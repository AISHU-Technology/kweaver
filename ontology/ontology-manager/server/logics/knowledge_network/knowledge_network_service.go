package knowledge_network

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/exporter/v2/ar_trace"
	"github.com/rs/xid"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"

	"ontology-manager/common"
	oerrors "ontology-manager/errors"
	"ontology-manager/interfaces"
	"ontology-manager/logics"
	"ontology-manager/logics/action_type"
	"ontology-manager/logics/object_type"
	"ontology-manager/logics/permission"
	"ontology-manager/logics/relation_type"
)

var (
	knServiceOnce sync.Once
	knService     interfaces.KNService
)

type knowledgeNetworkService struct {
	appSetting *common.AppSetting
	db         *sql.DB
	ats        interfaces.ActionTypeService
	bsa        interfaces.BusinessSystemAccess
	kna        interfaces.KNAccess
	mfa        interfaces.ModelFactoryAccess
	osa        interfaces.OpenSearchAccess
	ots        interfaces.ObjectTypeService
	ps         interfaces.PermissionService
	rts        interfaces.RelationTypeService
	uma        interfaces.UserMgmtAccess
}

func NewKNService(appSetting *common.AppSetting) interfaces.KNService {
	knServiceOnce.Do(func() {
		knService = &knowledgeNetworkService{
			appSetting: appSetting,
			ats:        action_type.NewActionTypeService(appSetting),
			bsa:        logics.BSA,
			db:         logics.DB,
			kna:        logics.KNA,
			mfa:        logics.MFA,
			osa:        logics.OSA,
			ots:        object_type.NewObjectTypeService(appSetting),
			ps:         permission.NewPermissionService(appSetting),
			rts:        relation_type.NewRelationTypeService(appSetting),
			uma:        logics.UMA,
		}
	})
	return knService
}

func (kns *knowledgeNetworkService) CheckKNExistByID(ctx context.Context, KNID string) (string, bool, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("校验业务知识网络[%v]的存在性", KNID))
	defer span.End()

	span.SetAttributes(attr.Key("kn_id").String(KNID))

	otName, exist, err := kns.kna.CheckKNExistByID(ctx, KNID)
	if err != nil {
		logger.Errorf("CheckKNExistByID error: %s", err.Error())

		span.SetStatus(codes.Error, fmt.Sprintf("按ID[%v]获取业务知识网络失败", KNID))
		// 记录处理的 sql 字符串
		o11y.Error(ctx, fmt.Sprintf("按ID[%v]获取业务知识网络失败: %v", KNID, err))

		return "", exist, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_CheckKNIfExistFailed).WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return otName, exist, nil
}

func (kns *knowledgeNetworkService) CheckKNExistByName(ctx context.Context, knName string) (string, bool, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("校验业务知识网络[%v]的存在性", knName))
	defer span.End()

	span.SetAttributes(attr.Key("kn_name").String(knName))

	KNID, exist, err := kns.kna.CheckKNExistByName(ctx, knName)
	if err != nil {
		logger.Errorf("CheckKNExistByName error: %s", err.Error())

		span.SetStatus(codes.Error, fmt.Sprintf("按名称[%v]获取业务知识网络失败", knName))
		// 记录处理的 sql 字符串
		o11y.Error(ctx, fmt.Sprintf("按名称[%v]获取业务知识网络失败: %v", knName, err))

		return KNID, exist, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_CheckKNIfExistFailed).WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return KNID, exist, nil
}

func (kns *knowledgeNetworkService) CreateKN(ctx context.Context, kn *interfaces.KN, mode string) (string, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Create knowledge network")
	defer span.End()

	// 判断userid是否有创建业务知识网络的权限（策略决策）
	err := kns.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   interfaces.RESOURCE_ID_ALL,
	}, []string{interfaces.OPERATION_TYPE_CREATE})
	if err != nil {
		return "", err
	}

	currentTime := time.Now().UnixMilli()
	// 若提交的模型id为空，生成分布式ID
	if kn.KNID == "" {
		kn.KNID = xid.New().String()
	}
	for _, objectType := range kn.ObjectTypes {
		objectType.KNID = kn.KNID
	}
	for _, relationType := range kn.RelationTypes {
		relationType.KNID = kn.KNID
	}
	for _, actionType := range kn.ActionTypes {
		actionType.KNID = kn.KNID
	}

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	kn.Creator = accountInfo
	kn.Updater = accountInfo

	kn.CreateTime = currentTime
	kn.UpdateTime = currentTime

	// todo: 处理版本

	// 0. 开始事务
	tx, err := kns.db.Begin()
	if err != nil {
		logger.Errorf("Begin transaction error: %s", err.Error())
		span.SetStatus(codes.Error, "事务开启失败")
		o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

		return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_BeginTransactionFailed).
			WithErrorDetails(err.Error())
	}

	// 0.1 异常时
	defer func() {
		switch err {
		case nil:
			// 提交事务
			err = tx.Commit()
			if err != nil {
				logger.Errorf("CreateKN Transaction Commit Failed:%v", err)
				span.SetStatus(codes.Error, "提交事务失败")
				o11y.Error(ctx, fmt.Sprintf("CreateKN Transaction Commit Failed: %s", err.Error()))
				return
			}
			logger.Infof("CreateKN Transaction Commit Success")
			o11y.Debug(ctx, "CreateKN Transaction Commit Success")
		default:
			rollbackErr := tx.Rollback()
			if rollbackErr != nil {
				logger.Errorf("CreateKN Transaction Rollback Error:%v", rollbackErr)
				span.SetStatus(codes.Error, "事务回滚失败")
				o11y.Error(ctx, fmt.Sprintf("CreateKN Transaction Rollback Error: %s", err.Error()))
			}
		}
	}()

	// 处理导入模式
	isCreate, isUpdate, err := kns.handleKNImportMode(ctx, mode, kn)
	if err != nil {
		return "", err
	}

	// 处理更新情况
	if isUpdate {
		// todo: 提交的已存在，需要更新，则版本号+1
		err = kns.UpdateKN(ctx, tx, kn)
		if err != nil {
			logger.Errorf("UpdateKN error: %s", err.Error())
			span.SetStatus(codes.Error, "修改业务知识网络失败")
			return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_KnowledgeNetwork_InternalError_UpdateKNFailed).
				WithErrorDetails(err.Error())
		}

		if len(kn.ObjectTypes) > 0 {
			_, err = kns.ots.CreateObjectTypes(ctx, tx, kn.ObjectTypes, mode)
			if err != nil {
				logger.Errorf("CreateObjectTypes error: %s", err.Error())
				span.SetStatus(codes.Error, "创建业务知识网络对象类失败")
				return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_KnowledgeNetwork_InternalError_CreateObjectTypesFailed).
					WithErrorDetails(err.Error())
			}
		}

		if len(kn.RelationTypes) > 0 {
			_, err = kns.rts.CreateRelationTypes(ctx, tx, kn.RelationTypes, mode)
			if err != nil {
				logger.Errorf("CreateRelationTypes error: %s", err.Error())
				span.SetStatus(codes.Error, "创建业务知识网络关系类失败")
				return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_KnowledgeNetwork_InternalError_CreateRelationTypesFailed).
					WithErrorDetails(err.Error())
			}
		}

		if len(kn.ActionTypes) > 0 {
			_, err = kns.ats.CreateActionTypes(ctx, tx, kn.ActionTypes, mode)
			if err != nil {
				logger.Errorf("CreateActionTypes error: %s", err.Error())
				span.SetStatus(codes.Error, "创建业务知识网络动作类失败")
				return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_KnowledgeNetwork_InternalError_CreateActionTypesFailed).
					WithErrorDetails(err.Error())
			}
		}
	}

	// 处理创建情况
	if isCreate {
		err = kns.kna.CreateKN(ctx, tx, kn)
		if err != nil {
			logger.Errorf("CreateKN error: %s", err.Error())
			span.SetStatus(codes.Error, "创建业务知识网络失败")

			return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_KnowledgeNetwork_InternalError_CreateKNFailed).
				WithErrorDetails(err.Error())
		}

		if len(kn.ObjectTypes) > 0 {
			_, err = kns.ots.CreateObjectTypes(ctx, tx, kn.ObjectTypes, mode)
			if err != nil {
				logger.Errorf("CreateObjectTypes error: %s", err.Error())
				span.SetStatus(codes.Error, "创建业务知识网络对象类失败")
				return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_KnowledgeNetwork_InternalError_CreateObjectTypesFailed).
					WithErrorDetails(err.Error())
			}
		}

		if len(kn.RelationTypes) > 0 {
			_, err = kns.rts.CreateRelationTypes(ctx, tx, kn.RelationTypes, mode)
			if err != nil {
				logger.Errorf("CreateRelationTypes error: %s", err.Error())
				span.SetStatus(codes.Error, "创建业务知识网络关系类失败")
				return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_KnowledgeNetwork_InternalError_CreateRelationTypesFailed).
					WithErrorDetails(err.Error())
			}
		}

		if len(kn.ActionTypes) > 0 {
			_, err = kns.ats.CreateActionTypes(ctx, tx, kn.ActionTypes, mode)
			if err != nil {
				logger.Errorf("CreateActionTypes error: %s", err.Error())
				span.SetStatus(codes.Error, "创建业务知识网络动作类失败")
				return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_KnowledgeNetwork_InternalError_CreateActionTypesFailed).
					WithErrorDetails(err.Error())
			}
		}

		// 注册资源策略
		err = kns.ps.CreateResources(ctx, []interfaces.Resource{{
			ID:   kn.KNID,
			Type: interfaces.RESOURCE_TYPE_KN,
			Name: kn.KNName,
		}}, interfaces.COMMON_OPERATIONS)
		if err != nil {
			logger.Errorf("CreateResources error: %s", err.Error())
			span.SetStatus(codes.Error, "创建业务知识网络资源失败")
			return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_KnowledgeNetwork_InternalError_CreateResourcesFailed).
				WithErrorDetails(err.Error())
		}

		err = kns.bsa.BindResource(ctx, kn.BusinessDomain, kn.KNID, interfaces.MODULE_TYPE_KN)
		if err != nil {
			logger.Errorf("BindResource error: %s", err.Error())
			span.SetStatus(codes.Error, "绑定业务知识网络业务系统失败")
			return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_KnowledgeNetwork_InternalError_BindBusinessDomainFailed).
				WithErrorDetails(err.Error())
		}
	}

	err = kns.insertOpenSearchData(ctx, kn)
	if err != nil {
		logger.Errorf("insertOpenSearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "业务知识网络概念索引写入失败")

		return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_InsertOpenSearchDataFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return kn.KNID, nil
}

func (kns *knowledgeNetworkService) ListKNs(ctx context.Context,
	parameter interfaces.KNsQueryParams) ([]*interfaces.KN, int, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "查询业务知识网络列表")
	defer span.End()

	//获取业务知识网络列表
	KNArr, err := kns.kna.ListKNs(ctx, parameter)
	if err != nil {
		logger.Errorf("ListKNs error: %s", err.Error())
		span.SetStatus(codes.Error, "List knowledge networks error")

		return []*interfaces.KN{}, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError).WithErrorDetails(err.Error())
	}
	if len(KNArr) == 0 {
		span.SetStatus(codes.Ok, "")
		return []*interfaces.KN{}, 0, nil
	}

	// 处理资源id
	KNIDs := make([]string, 0)
	for _, m := range KNArr {
		KNIDs = append(KNIDs, m.KNID)
	}

	// 根据权限过滤有查看权限的对象，过滤后的数组的总长度就是总数，无需再请求总数
	matchResoucesMap, err := kns.ps.FilterResources(ctx, interfaces.RESOURCE_TYPE_KN, KNIDs,
		[]string{interfaces.OPERATION_TYPE_VIEW_DETAIL}, true)
	if err != nil {
		span.SetStatus(codes.Error, "Filter resources error")
		return []*interfaces.KN{}, 0, err
	}

	KNs := make([]*interfaces.KN, 0)
	for _, kn := range KNArr {
		// 只留下有权限的模型
		if resrc, exist := matchResoucesMap[kn.KNID]; exist {
			kn.Operations = resrc.Operations // 用户当前有权限的操作
			KNs = append(KNs, kn)
		}
	}
	total := len(KNs)

	// limit = -1,则返回所有
	if parameter.Limit != -1 {
		// 分页
		// 检查起始位置是否越界
		if parameter.Offset < 0 || parameter.Offset >= len(KNs) {
			span.SetStatus(codes.Ok, "")
			return []*interfaces.KN{}, 0, nil
		}
		// 计算结束位置
		end := parameter.Offset + parameter.Limit
		if end > len(KNs) {
			end = len(KNs)
		}

		KNs = KNs[parameter.Offset:end]
	}

	userIDsMap := make(map[string]interfaces.AccountInfo)
	for _, kn := range KNs {
		userIDsMap[kn.Creator.ID] = kn.Creator
		userIDsMap[kn.Updater.ID] = kn.Updater
	}

	userIDs := make([]string, 0, len(userIDsMap))
	for userID := range userIDsMap {
		userIDs = append(userIDs, userID)
	}

	userNames, err := kns.uma.GetUserNames(ctx, userIDs)
	if err != nil {
		span.SetStatus(codes.Error, "GetUserNames error")

		return []*interfaces.KN{}, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError).WithErrorDetails(err.Error())
	}

	for _, kn := range KNs {
		if userName, exist := userNames[kn.Creator.ID]; exist {
			kn.Creator.Name = userName
		} else {
			kn.Creator.Name = "-"
		}
		if userName, exist := userNames[kn.Updater.ID]; exist {
			kn.Updater.Name = userName
		} else {
			kn.Updater.Name = "-"
		}
	}

	span.SetStatus(codes.Ok, "")
	return KNs, total, nil
}

func (kns *knowledgeNetworkService) GetKNByID(ctx context.Context, knID string, mode string) (*interfaces.KN, error) {
	// 获取业务知识网络
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("查询业务知识网络[%s]信息", knID))
	defer span.End()

	span.SetAttributes(attr.Key("kn_id").String(knID))

	// 获取模型基本信息
	kn, err := kns.kna.GetKNByID(ctx, knID)
	if err != nil {
		logger.Errorf("GetKNByID error: %s", err.Error())
		span.SetStatus(codes.Error, fmt.Sprintf("Get knowledge network[%s] error: %v", knID, err))
		span.End()

		return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_GetKNByIDFailed).WithErrorDetails(err.Error())
	}

	if kn == nil {
		errStr := fmt.Sprintf("Knowledge network[%s] not found", knID)
		logger.Errorf(errStr)
		span.SetStatus(codes.Error, errStr)
		span.End()

		return nil, rest.NewHTTPError(ctx, http.StatusNotFound,
			oerrors.OntologyManager_KnowledgeNetwork_NotFound).
			WithErrorDetails(errStr)
	}

	// 根据权限过滤有查看权限的对象，过滤后的数组的总长度就是总数，无需再请求总数
	matchResoucesMap, err := kns.ps.FilterResources(ctx, interfaces.RESOURCE_TYPE_KN, []string{kn.KNID},
		[]string{interfaces.OPERATION_TYPE_VIEW_DETAIL}, true)
	if err != nil {
		span.SetStatus(codes.Error, "Filter resources error")
		return nil, err
	}

	if resrc, exist := matchResoucesMap[kn.KNID]; exist {
		kn.Operations = resrc.Operations // 用户当前有权限的操作
	} else {
		return nil, rest.NewHTTPError(ctx, http.StatusForbidden, rest.PublicError_Forbidden).
			WithErrorDetails(fmt.Sprintf("Access denied: insufficient permissions for[%v]", interfaces.OPERATION_TYPE_VIEW_DETAIL))
	}

	userIDsMap := make(map[string]interfaces.AccountInfo)
	userIDsMap[kn.Creator.ID] = kn.Creator
	userIDsMap[kn.Updater.ID] = kn.Updater

	userIDs := []string{}
	for userID := range userIDsMap {
		userIDs = append(userIDs, userID)
	}

	userNames, err := kns.uma.GetUserNames(ctx, userIDs)
	if err != nil {
		span.SetStatus(codes.Error, "GetUserNames error")

		return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError).WithErrorDetails(err.Error())
	}

	if userName, exist := userNames[kn.Creator.ID]; exist {
		kn.Creator.Name = userName
	} else {
		kn.Creator.Name = "-"
	}
	if userName, exist := userNames[kn.Updater.ID]; exist {
		kn.Updater.Name = userName
	} else {
		kn.Updater.Name = "-"
	}

	if mode == "export" {
		objectTypes, _, err := kns.ots.ListObjectTypes(ctx, interfaces.ObjectTypesQueryParams{
			PaginationQueryParameters: interfaces.PaginationQueryParameters{
				Limit: -1,
			},
			KNID: kn.KNID,
		})
		if err != nil {
			return nil, err
		}
		kn.ObjectTypes = objectTypes

		relationTypes, _, err := kns.rts.ListRelationTypes(ctx, interfaces.RelationTypesQueryParams{
			PaginationQueryParameters: interfaces.PaginationQueryParameters{
				Limit: -1,
			},
			KNID: kn.KNID,
		})
		if err != nil {
			return nil, err
		}
		kn.RelationTypes = relationTypes

		actionTypes, _, err := kns.ats.ListActionTypes(ctx, interfaces.ActionTypesQueryParams{
			PaginationQueryParameters: interfaces.PaginationQueryParameters{
				Limit: -1,
			},
			KNID: kn.KNID,
		})
		if err != nil {
			return nil, err
		}
		kn.ActionTypes = actionTypes
	}

	span.SetStatus(codes.Ok, "")
	return kn, nil
}

// 更新业务知识网络
func (kns *knowledgeNetworkService) UpdateKN(ctx context.Context, tx *sql.Tx, kn *interfaces.KN) error {
	ctx, span := ar_trace.Tracer.Start(ctx, "Update knowledge network")
	defer span.End()

	// 判断userid是否有创建业务知识网络的权限（策略决策）
	err := kns.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   kn.KNID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return err
	}

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	kn.Updater = accountInfo

	currentTime := time.Now().UnixMilli() // 业务知识网络的update_time是int类型
	kn.UpdateTime = currentTime

	span.SetAttributes(
		attr.Key("kn_id").String(kn.KNID),
		attr.Key("kn_name").String(kn.KNName))

	if tx == nil {
		// 0. 开始事务
		tx, err = kns.db.Begin()
		if err != nil {
			logger.Errorf("Begin transaction error: %s", err.Error())
			span.SetStatus(codes.Error, "事务开启失败")
			o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

			return rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_KnowledgeNetwork_InternalError_BeginTransactionFailed).
				WithErrorDetails(err.Error())
		}
		// 0.1 异常时
		defer func() {
			switch err {
			case nil:
				// 提交事务
				err = tx.Commit()
				if err != nil {
					logger.Errorf("UpdateKN Transaction Commit Failed:%v", err)
					span.SetStatus(codes.Error, "提交事务失败")
					o11y.Error(ctx, fmt.Sprintf("UpdateKN Transaction Commit Failed: %s", err.Error()))
				}
				logger.Infof("UpdateKN Transaction Commit Success:%v", kn.KNName)
				o11y.Debug(ctx, fmt.Sprintf("UpdateKN Transaction Commit Success: %s", kn.KNName))
			default:
				rollbackErr := tx.Rollback()
				if rollbackErr != nil {
					logger.Errorf("UpdateKN Transaction Rollback Error:%v", rollbackErr)
					span.SetStatus(codes.Error, "事务回滚失败")
					o11y.Error(ctx, fmt.Sprintf("UpdateKN Transaction Rollback Error: %s", rollbackErr.Error()))
				}
			}
		}()
	}

	// 更新模型信息
	err = kns.kna.UpdateKN(ctx, tx, kn)
	if err != nil {
		logger.Errorf("UpdateKN error: %s", err.Error())
		span.SetStatus(codes.Error, "修改业务知识网络失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError).
			WithErrorDetails(err.Error())
	}

	err = kns.insertOpenSearchData(ctx, kn)
	if err != nil {
		logger.Errorf("insertOpenSearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "业务知识网络概念索引写入失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_InsertOpenSearchDataFailed).
			WithErrorDetails(err.Error())
	}

	// 请求更新资源名称的接口，更新资源的名称
	if kn.IfNameModify {
		err = kns.ps.UpdateResource(ctx, interfaces.Resource{
			ID:   kn.KNID,
			Type: interfaces.RESOURCE_TYPE_KN,
			Name: kn.KNName,
		})
		if err != nil {
			return err
		}
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

func (kns *knowledgeNetworkService) DeleteKN(ctx context.Context, kn *interfaces.KN) (int64, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Delete knowledge network")
	defer span.End()

	// 判断userid是否有删除业务知识网络的权限
	err := kns.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   kn.KNID,
	}, []string{interfaces.OPERATION_TYPE_DELETE})
	if err != nil {
		return 0, err
	}

	// 0. 开始事务
	tx, err := kns.db.Begin()
	if err != nil {
		logger.Errorf("Begin transaction error: %s", err.Error())
		span.SetStatus(codes.Error, "事务开启失败")
		o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

		return 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_BeginTransactionFailed).
			WithErrorDetails(err.Error())
	}

	// 0.1 异常时
	defer func() {
		switch err {
		case nil:
			// 提交事务
			err = tx.Commit()
			if err != nil {
				logger.Errorf("DeleteKN Transaction Commit Failed:%v", err)
				span.SetStatus(codes.Error, "提交事务失败")
				o11y.Error(ctx, fmt.Sprintf("CreateKN Transaction Commit Failed: %s", err.Error()))
				return
			}
			logger.Infof("DeleteKN Transaction Commit Success")
			o11y.Debug(ctx, "DeleteKN Transaction Commit Success")
		default:
			rollbackErr := tx.Rollback()
			if rollbackErr != nil {
				logger.Errorf("DeleteKN Transaction Rollback Error:%v", rollbackErr)
				span.SetStatus(codes.Error, "事务回滚失败")
				o11y.Error(ctx, fmt.Sprintf("CreateKN Transaction Rollback Error: %s", err.Error()))
			}
		}
	}()

	// 删除业务知识网络
	rowsAffect, err := kns.kna.DeleteKN(ctx, tx, kn.KNID)
	span.SetAttributes(attr.Key("rows_affect").Int64(rowsAffect))
	if err != nil {
		logger.Errorf("DeleteKN error: %s", err.Error())
		span.SetStatus(codes.Error, "删除业务知识网络失败")

		return rowsAffect, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError).WithErrorDetails(err.Error())
	}
	logger.Infof("DeleteKN: Rows affected is %v, request delete KNID is %s!", rowsAffect, kn.KNID)
	if rowsAffect != 1 {
		logger.Warnf("Delete kns number %v not equal 1!", rowsAffect)

		o11y.Warn(ctx, fmt.Sprintf("Delete kns number %v not equal 1!", rowsAffect))
	}

	// 删除对象类、关系类、行动类
	// 获取业务知识网络下的对象类id
	otIDs, err := kns.ots.GetObjectTypeIDsByKnID(ctx, kn.KNID)
	if err != nil {
		logger.Errorf("GetObjectTypeIDsByKnID error: %s", err.Error())
		span.SetStatus(codes.Error, "获取业务知识网络下的对象类失败")
		return 0, err
	}
	_, err = kns.ots.DeleteObjectTypes(ctx, tx, kn.KNID, otIDs)
	if err != nil {
		logger.Errorf("DeleteObjectTypes error: %s", err.Error())
		span.SetStatus(codes.Error, "删除业务知识网络对象类失败")
		return 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_DeleteObjectTypesFailed).
			WithErrorDetails(err.Error())
	}

	// 获取业务知识网络下的关系类id
	rtIDs, err := kns.rts.GetRelationTypeIDsByKnID(ctx, kn.KNID)
	if err != nil {
		logger.Errorf("GetRelationTypeIDsByKnID error: %s", err.Error())
		span.SetStatus(codes.Error, "获取业务知识网络下的关系类失败")
		return 0, err
	}
	_, err = kns.rts.DeleteRelationTypes(ctx, tx, kn.KNID, rtIDs)
	if err != nil {
		logger.Errorf("DeleteRelationTypes error: %s", err.Error())
		span.SetStatus(codes.Error, "删除业务知识网络关系类失败")
		return 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_CreateRelationTypesFailed).
			WithErrorDetails(err.Error())
	}

	// 获取业务知识网络下的行动类id
	atIDs, err := kns.ats.GetActionTypeIDsByKnID(ctx, kn.KNID)
	if err != nil {
		logger.Errorf("GetRelationTypeIDsByKnID error: %s", err.Error())
		span.SetStatus(codes.Error, "获取业务知识网络下的关系类失败")
		return 0, err
	}
	_, err = kns.ats.DeleteActionTypes(ctx, tx, kn.KNID, atIDs)
	if err != nil {
		logger.Errorf("DeleteActionTypes error: %s", err.Error())
		span.SetStatus(codes.Error, "删除业务知识网络动作类失败")
		return 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_DeleteActionTypesFailed).
			WithErrorDetails(err.Error())
	}

	//  清除资源策略
	err = kns.ps.DeleteResources(ctx, interfaces.RESOURCE_TYPE_KN, []string{kn.KNID})
	if err != nil {
		return 0, err
	}

	err = kns.bsa.UnbindResource(ctx, kn.BusinessDomain, kn.KNID, interfaces.RESOURCE_TYPE_KN)
	if err != nil {
		logger.Errorf("UnbindResource error: %s", err.Error())
		span.SetStatus(codes.Error, "解绑业务知识网络业务域失败")
		return 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError_UnbindBusinessDomainFailed).
			WithErrorDetails(err.Error())
	}

	docid := interfaces.GenerateConceptDocuemtnID(kn.KNID,
		interfaces.MODULE_TYPE_KN, kn.KNID, interfaces.MAIN_BRANCH)
	err = kns.osa.DeleteData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid)
	if err != nil {
		return 0, err
	}

	span.SetStatus(codes.Ok, "")
	return rowsAffect, nil
}

// 更新知识网络详情
func (kns *knowledgeNetworkService) UpdateKNDetail(ctx context.Context, knID string, detail string) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Update knowledge network detail[%s]", knID))
	defer span.End()

	span.SetAttributes(
		attr.Key("kn_id").String(knID))

	// 更新知识网络详情
	err := kns.kna.UpdateKNDetail(ctx, knID, detail)
	if err != nil {
		logger.Errorf("UpdateKNDetail error: %s", err.Error())
		span.SetStatus(codes.Error, "修改知识网络详情失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_KnowledgeNetwork_InternalError).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

func (kns *knowledgeNetworkService) handleKNImportMode(ctx context.Context, mode string,
	kn *interfaces.KN) (isCreate bool, isUpdate bool, err error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "knowledge network import mode logic")
	defer span.End()

	isCreate = false
	isUpdate = false

	// 校验单个KN的导入模式逻辑
	idExist := false
	_, idExist, err = kns.CheckKNExistByID(ctx, kn.KNID)
	if err != nil {
		return false, false, err
	}

	// 校验请求体与现有模型名称的重复性
	existID, nameExist, err := kns.CheckKNExistByName(ctx, kn.KNName)
	if err != nil {
		return false, false, err
	}

	// 根据mode来区别，若是ignore，就从结果集中忽略，若是overwrite，就调用update，若是normal就报错。
	if idExist || nameExist {
		switch mode {
		case interfaces.ImportMode_Normal:
			if idExist {
				errDetails := fmt.Sprintf("The knowledge network with id [%s] already exists!", kn.KNID)
				logger.Error(errDetails)
				span.SetStatus(codes.Error, errDetails)
				return false, false, rest.NewHTTPError(ctx, http.StatusBadRequest,
					oerrors.OntologyManager_KnowledgeNetwork_KNIDExisted).
					WithErrorDetails(errDetails)
			}

			if nameExist {
				errDetails := fmt.Sprintf("knowledge network name '%s' already exists", kn.KNName)
				logger.Error(errDetails)
				span.SetStatus(codes.Error, errDetails)
				return false, false, rest.NewHTTPError(ctx, http.StatusForbidden,
					oerrors.OntologyManager_KnowledgeNetwork_KNNameExisted).
					WithDescription(map[string]any{"kn_name": kn.KNName}).
					WithErrorDetails(errDetails)
			}

		case interfaces.ImportMode_Ignore:
			// 存在重复的就跳过，不创建也不更新
			return false, false, nil
		case interfaces.ImportMode_Overwrite:
			if idExist && nameExist {
				// 如果 id 和名称都存在，但是存在的名称对应的视图 id 和当前视图 id 不一样，则报错
				if existID != kn.KNID {
					errDetails := fmt.Sprintf("KN ID '%s' and name '%s' already exist, but the exist knowledge network id is '%s'",
						kn.KNID, kn.KNName, existID)
					logger.Error(errDetails)
					span.SetStatus(codes.Error, errDetails)
					return false, false, rest.NewHTTPError(ctx, http.StatusForbidden,
						oerrors.OntologyManager_KnowledgeNetwork_KNNameExisted).
						WithErrorDetails(errDetails)
				} else {
					// 如果 id 和名称、度量名称都存在，存在的名称对应的模型 id 和当前模型 id 一样，则覆盖更新
					isUpdate = true
					return isCreate, isUpdate, nil
				}
			}

			// id 已存在，且名称不存在，覆盖更新
			if idExist && !nameExist {
				isUpdate = true
				return isCreate, isUpdate, nil
			}

			// 如果 id 不存在，name 存在，报错
			if !idExist && nameExist {
				errDetails := fmt.Sprintf("KN ID '%s' does not exist, but name '%s' already exists",
					kn.KNID, kn.KNName)
				logger.Error(errDetails)
				span.SetStatus(codes.Error, errDetails)
				return false, false, rest.NewHTTPError(ctx, http.StatusForbidden,
					oerrors.OntologyManager_KnowledgeNetwork_KNNameExisted).
					WithErrorDetails(errDetails)
			}

			// 如果 id 不存在，name不存在，度量名称不存在，不需要做什么，创建
			// if !idExist && !nameExist {}
		}
	}

	// 默认情况：需要创建
	isCreate = true
	return isCreate, isUpdate, nil
}

func (kns *knowledgeNetworkService) insertOpenSearchData(ctx context.Context, kn *interfaces.KN) error {
	ctx, span := ar_trace.Tracer.Start(ctx, "业务知识网络概念索引写入")
	defer span.End()

	if kns.appSetting.ServerSetting.DefaultSmallModelEnabled {
		words := []string{kn.KNName}
		words = append(words, kn.Tags...)
		words = append(words, kn.Comment, kn.Detail)
		word := strings.Join(words, "\n")

		defaultModel, err := kns.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			span.SetStatus(codes.Error, "获取默认模型失败")
			return err
		}
		vectors, err := kns.mfa.GetVector(ctx, defaultModel, []string{word})
		if err != nil {
			logger.Errorf("GetVector error: %s", err.Error())
			span.SetStatus(codes.Error, "获取业务知识网络向量失败")
			return err
		}

		kn.Vector = vectors[0].Vector
	}

	docid := interfaces.GenerateConceptDocuemtnID(kn.KNID, interfaces.MODULE_TYPE_KN, kn.KNID, kn.Branch)
	kn.ModuleType = interfaces.MODULE_TYPE_KN

	err := kns.osa.InsertData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid, kn)
	if err != nil {
		logger.Errorf("InsertData error: %s", err.Error())
		span.SetStatus(codes.Error, "业务知识网络概念索引写入失败")
		return err
	}

	return nil
}

// 批量查询的中间状态
type batchQueryState struct {
	visited   map[string]bool
	batchSize int
}

// 根据起点对象类，方向，长度获取路径
func (kns *knowledgeNetworkService) GetRelationTypePaths(ctx context.Context,
	query interfaces.RelationTypePathsBaseOnSource) ([]interfaces.RelationTypePath, error) {
	// 1. 获取起点对象类

	allPaths := []interfaces.RelationTypePath{}

	// 使用BFS进行路径搜索
	queue := []interfaces.RelationTypePath{
		{
			ObjectTypes: []interfaces.ObjectTypeWithKeyField{
				{
					OTID: query.SourceObjecTypeId,
				},
			},
			Length: 0,
		},
	}

	// 初始化状态
	state := &batchQueryState{
		visited: map[string]bool{}, // 用于防止循环路径
		// objectTypeCache: map[string]interfaces.ObjectType{},
		batchSize: 50, // 每批查询的节点数量
	}
	for len(queue) > 0 {
		currentLevelSize := len(queue)
		var nextLevelNodes []string
		currentLevelPaths := make([]interfaces.RelationTypePath, 0, currentLevelSize)

		// 处理当前层的所有路径
		for i := 0; i < currentLevelSize; i++ {
			currentPath := queue[i]
			currentNode := currentPath.ObjectTypes[len(currentPath.ObjectTypes)-1]
			// 获取当前节点的信息（按需查询）
			if currentNode.OTName == "" {
				objectType, err := kns.ots.GetObjectTypes(ctx, query.KNID, []string{currentNode.OTID})
				if err != nil {
					return nil, err
				}
				currentNode = interfaces.ObjectTypeWithKeyField{
					OTID:            objectType[0].OTID,
					OTName:          objectType[0].OTName,
					DataSource:      objectType[0].DataSource,
					DataProperties:  objectType[0].DataProperties,
					LogicProperties: objectType[0].LogicProperties,
					PrimaryKeys:     objectType[0].PrimaryKeys,
					DisplayKey:      objectType[0].DisplayKey,
				}
				currentPath.ObjectTypes[len(currentPath.ObjectTypes)-1] = currentNode
			}

			// 如果达到最大深度，保存路径
			if currentPath.Length >= query.PathLength {
				allPaths = append(allPaths, currentPath)
				continue
			}

			// 收集需要查询邻居的节点ID
			nextLevelNodes = append(nextLevelNodes, currentNode.OTID)
			currentLevelPaths = append(currentLevelPaths, currentPath)
		}

		// 批量查询下一层节点的邻居
		if len(nextLevelNodes) > 0 {
			neighborPathsMap, err := kns.getNeighborsBatch(ctx, nextLevelNodes, query.Direction, state)
			if err != nil {
				return nil, err
			}

			// 为每个当前层的路径扩展新路径
			for i, currentPath := range currentLevelPaths {

				currentNodeID := nextLevelNodes[i]
				neighborPaths := neighborPathsMap[currentNodeID]

				// 如果没有邻居节点，保存当前路径
				if len(neighborPaths) == 0 {
					allPaths = append(allPaths, currentPath)
					continue
				}

				// 为每个邻居创建新路径. 当前起点指向的路径需要重置，不完整。
				for _, neighbor := range neighborPaths {
					// 构建路径键来检测循环
					// 这个一度的路径，第二个对象类是终点
					pathKey := buildPathKey(currentPath, neighbor.ObjectTypes[1].OTID)
					if state.visited[pathKey] {
						continue // 跳过已访问的路径
					}
					state.visited[pathKey] = true

					newPath := interfaces.RelationTypePath{
						ObjectTypes: make([]interfaces.ObjectTypeWithKeyField, len(currentPath.ObjectTypes)),
						TypeEdges:   make([]interfaces.TypeEdge, len(currentPath.TypeEdges)),
						Length:      currentPath.Length + 1,
					}
					copy(newPath.ObjectTypes, currentPath.ObjectTypes)
					copy(newPath.TypeEdges, currentPath.TypeEdges)
					newPath.ObjectTypes = append(newPath.ObjectTypes, neighbor.ObjectTypes[1])
					newPath.TypeEdges = append(newPath.TypeEdges, neighbor.TypeEdges...)

					queue = append(queue, newPath)
				}
			}
		}
		// 移除已处理的当前层路径
		if currentLevelSize > 0 {
			queue = queue[currentLevelSize:]
		}
	}
	// 添加队列中剩余的路径（如果未达到限制）
	for i := 0; i < len(queue); i++ {
		allPaths = append(allPaths, queue[i])
	}

	return allPaths, nil
}

// 批量查询相邻节点 - 核心优化方法
func (kns *knowledgeNetworkService) getNeighborsBatch(ctx context.Context, objectClassIDs []string,
	direction string, state *batchQueryState) (map[string][]interfaces.RelationTypePath, error) {

	if len(objectClassIDs) == 0 {
		return nil, nil
	}

	// 分批处理，避免SQL参数过多
	batchSize := state.batchSize
	neighborPathsMap := map[string][]interfaces.RelationTypePath{}

	for start := 0; start < len(objectClassIDs); start += batchSize {
		// 遍历当前节点的邻居路径
		end := start + batchSize
		if end > len(objectClassIDs) {
			end = len(objectClassIDs)
		}

		batchIDs := objectClassIDs[start:end]
		batchNeighborPathsMap, err := kns.kna.GetNeighborPathsBatch(ctx, batchIDs, direction)
		if err != nil {
			return nil, err
		}

		// 合并结果
		for k, v := range batchNeighborPathsMap {
			neighborPathsMap[k] = append(neighborPathsMap[k], v...)
		}
	}

	return neighborPathsMap, nil
}

// 构建路径键用于循环检测
func buildPathKey(path interfaces.RelationTypePath, nextNodeID string) string {
	key := path.ObjectTypes[0].OTID
	for i := 1; i < len(path.ObjectTypes); i++ {
		key += fmt.Sprintf("->%s", path.ObjectTypes[i].OTID)
	}
	key += fmt.Sprintf("->%s", nextNodeID)
	return key
}

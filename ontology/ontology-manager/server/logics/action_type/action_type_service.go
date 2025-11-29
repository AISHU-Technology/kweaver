package action_type

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/exporter/v2/ar_trace"
	"github.com/bytedance/sonic"
	"github.com/rs/xid"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"

	"ontology-manager/common"
	cond "ontology-manager/common/condition"
	oerrors "ontology-manager/errors"
	"ontology-manager/interfaces"
	"ontology-manager/logics"
	"ontology-manager/logics/object_type"
	"ontology-manager/logics/permission"
)

var (
	atServiceOnce sync.Once
	atService     interfaces.ActionTypeService
)

type actionTypeService struct {
	appSetting *common.AppSetting
	db         *sql.DB
	ata        interfaces.ActionTypeAccess
	mfa        interfaces.ModelFactoryAccess
	osa        interfaces.OpenSearchAccess
	ots        interfaces.ObjectTypeService
	ps         interfaces.PermissionService
	uma        interfaces.UserMgmtAccess
}

func NewActionTypeService(appSetting *common.AppSetting) interfaces.ActionTypeService {
	atServiceOnce.Do(func() {
		atService = &actionTypeService{
			appSetting: appSetting,
			db:         logics.DB,
			ata:        logics.ATA,
			mfa:        logics.MFA,
			osa:        logics.OSA,
			ots:        object_type.NewObjectTypeService(appSetting),
			ps:         permission.NewPermissionService(appSetting),
			uma:        logics.UMA,
		}
	})
	return atService
}

func (ats *actionTypeService) CheckActionTypeExistByID(ctx context.Context,
	knID string, atID string) (string, bool, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("校验行动类[%s]的存在性", atID))
	defer span.End()

	span.SetAttributes(attr.Key("at_id").String(atID))

	atName, exist, err := ats.ata.CheckActionTypeExistByID(ctx, knID, atID)
	if err != nil {
		logger.Errorf("CheckActionTypeExistByID error: %s", err.Error())

		span.SetStatus(codes.Error, fmt.Sprintf("按ID[%v]获取行动类失败", atID))
		// 记录处理的 sql 字符串
		o11y.Error(ctx, fmt.Sprintf("按ID[%v]获取行动类失败: %v", atID, err))

		return "", exist, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ActionType_InternalError_CheckActionTypeIfExistFailed).WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return atName, exist, nil
}

func (ats *actionTypeService) CheckActionTypeExistByName(ctx context.Context,
	knID string, atName string) (string, bool, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("校验行动类[%s]的存在性", atName))
	defer span.End()

	span.SetAttributes(attr.Key("at_name").String(atName))

	actionTypeID, exist, err := ats.ata.CheckActionTypeExistByName(ctx, knID, atName)
	if err != nil {
		logger.Errorf("CheckActionTypeExistByName error: %s", err.Error())
		// 记录处理的 sql 字符串
		o11y.Error(ctx, fmt.Sprintf("按名称[%s]获取行动类失败: %v", atName, err))
		span.SetStatus(codes.Error, fmt.Sprintf("按名称[%s]获取行动类失败", atName))
		return actionTypeID, exist, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ActionType_InternalError_CheckActionTypeIfExistFailed).WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return actionTypeID, exist, nil
}

func (ats *actionTypeService) CreateActionTypes(ctx context.Context, tx *sql.Tx,
	actionTypes []*interfaces.ActionType, mode string) ([]string, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Create action type")
	defer span.End()

	// 判断userid是否有修改业务知识网络的权限
	err := ats.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   actionTypes[0].KNID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return []string{}, err
	}

	currentTime := time.Now().UnixMilli()
	for _, at := range actionTypes {
		// 若提交的模型id为空，生成分布式ID
		if at.ATID == "" {
			at.ATID = xid.New().String()
		}

		accountInfo := interfaces.AccountInfo{}
		if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
			accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
		}

		at.Creator = accountInfo
		at.Updater = accountInfo

		at.CreateTime = currentTime
		at.UpdateTime = currentTime
	}

	// 0. 开始事务
	if tx == nil {
		tx, err = ats.db.Begin()
		if err != nil {
			logger.Errorf("Begin transaction error: %s", err.Error())
			span.SetStatus(codes.Error, "事务开启失败")
			o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

			return []string{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_ActionType_InternalError_BeginTransactionFailed).
				WithErrorDetails(err.Error())
		}
		// 0.1 异常时
		defer func() {
			switch err {
			case nil:
				// 提交事务
				err = tx.Commit()
				if err != nil {
					logger.Errorf("CreateActionType Transaction Commit Failed:%v", err)
					span.SetStatus(codes.Error, "提交事务失败")
					o11y.Error(ctx, fmt.Sprintf("CreateActionType Transaction Commit Failed: %s", err.Error()))
					return
				}
				logger.Infof("CreateActionType Transaction Commit Success")
				o11y.Debug(ctx, "CreateActionType Transaction Commit Success")
			default:
				rollbackErr := tx.Rollback()
				if rollbackErr != nil {
					logger.Errorf("CreateActionType Transaction Rollback Error:%v", rollbackErr)
					span.SetStatus(codes.Error, "事务回滚失败")
					o11y.Error(ctx, fmt.Sprintf("CreateActionType Transaction Rollback Error: %s", err.Error()))
				}
			}
		}()
	}

	createActionTypes, updateActionTypes, err := ats.handleActionTypeImportMode(ctx, mode, actionTypes)
	if err != nil {
		return []string{}, err
	}

	// 更新
	for _, actionType := range updateActionTypes {
		// 提交的已存在，需要更新
		err = ats.UpdateActionType(ctx, tx, actionType)
		if err != nil {
			return []string{}, err
		}
	}

	// 创建
	atIDs := []string{}
	for _, actionType := range createActionTypes {
		atIDs = append(atIDs, actionType.ATID)
		err = ats.ata.CreateActionType(ctx, tx, actionType)
		if err != nil {
			logger.Errorf("CreateActionType error: %s", err.Error())
			span.SetStatus(codes.Error, "创建行动类失败")

			return []string{}, rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_ActionType_InternalError).
				WithErrorDetails(err.Error())
		}
	}

	err = ats.InsertOpenSearchData(ctx, actionTypes)
	if err != nil {
		logger.Errorf("insertOpenSearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "行动类索引写入失败")

		return []string{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ActionType_InternalError_InsertOpenSearchDataFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return atIDs, nil
}

func (ats *actionTypeService) ListActionTypes(ctx context.Context,
	query interfaces.ActionTypesQueryParams) ([]*interfaces.ActionType, int, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "查询行动类列表")
	defer span.End()

	// 判断userid是否有查看业务知识网络的权限
	err := ats.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   query.KNID,
	}, []string{interfaces.OPERATION_TYPE_VIEW_DETAIL})
	if err != nil {
		return []*interfaces.ActionType{}, 0, err
	}

	//获取行动类列表
	actionTypes, err := ats.ata.ListActionTypes(ctx, query)
	if err != nil {
		logger.Errorf("ListActionTypes error: %s", err.Error())
		span.SetStatus(codes.Error, "List action types error")

		return []*interfaces.ActionType{}, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ActionType_InternalError).WithErrorDetails(err.Error())
	}
	if len(actionTypes) == 0 {
		span.SetStatus(codes.Ok, "")
		return actionTypes, 0, nil
	}

	// 获取绑定对象类的名称拿到
	for _, at := range actionTypes {
		objectTypeMap, err := ats.ots.GetObjectTypesMapByIDs(ctx, query.KNID,
			[]string{at.ObjectTypeID}, false)
		if err != nil {
			return []*interfaces.ActionType{}, 0, err
		}

		if objectTypeMap[at.ObjectTypeID] != nil {
			at.ObjectType = interfaces.SimpleObjectType{
				OTID:   objectTypeMap[at.ObjectTypeID].OTID,
				OTName: objectTypeMap[at.ObjectTypeID].OTName,
				Icon:   objectTypeMap[at.ObjectTypeID].Icon,
				Color:  objectTypeMap[at.ObjectTypeID].Color,
			}
		}
	}

	// limit = -1,则返回所有
	if query.Limit == -1 {
		span.SetStatus(codes.Ok, "")
		return actionTypes, len(actionTypes), nil
	}
	// 分页
	// 检查起始位置是否越界
	if query.Offset < 0 || query.Offset >= len(actionTypes) {
		span.SetStatus(codes.Ok, "")
		return []*interfaces.ActionType{}, 0, nil
	}
	// 计算结束位置
	end := query.Offset + query.Limit
	if end > len(actionTypes) {
		end = len(actionTypes)
	}
	total := len(actionTypes)

	actionTypes = actionTypes[query.Offset:end]

	userIDsMap := make(map[string]interfaces.AccountInfo)
	for _, at := range actionTypes {
		userIDsMap[at.Creator.ID] = at.Creator
		userIDsMap[at.Updater.ID] = at.Updater
	}

	userIDs := make([]string, 0, len(userIDsMap))
	for userID := range userIDsMap {
		userIDs = append(userIDs, userID)
	}

	userNames, err := ats.uma.GetUserNames(ctx, userIDs)
	if err != nil {
		span.SetStatus(codes.Error, "GetUserNames error")

		return []*interfaces.ActionType{}, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ActionType_InternalError).WithErrorDetails(err.Error())
	}

	for _, at := range actionTypes {
		if userName, exist := userNames[at.Creator.ID]; exist {
			at.Creator.Name = userName
		} else {
			at.Creator.Name = "-"
		}
		if userName, exist := userNames[at.Updater.ID]; exist {
			at.Updater.Name = userName
		} else {
			at.Updater.Name = "-"
		}
	}

	span.SetStatus(codes.Ok, "")
	return actionTypes, total, nil
}

func (ats *actionTypeService) GetActionTypes(ctx context.Context,
	knID string, atIDs []string) ([]*interfaces.ActionType, error) {
	// 获取行动类
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("查询行动类[%v]信息", atIDs))
	defer span.End()

	span.SetAttributes(attr.Key("at_ids").String(fmt.Sprintf("%v", atIDs)))

	// 判断userid是否有查看业务知识网络的权限
	err := ats.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_VIEW_DETAIL})
	if err != nil {
		return []*interfaces.ActionType{}, err
	}

	// id去重后再查
	atIDs = common.DuplicateSlice(atIDs)

	// 获取模型基本信息
	actionTypes, err := ats.ata.GetActionTypesByIDs(ctx, knID, atIDs)
	if err != nil {
		logger.Errorf("GetActionTypesByATIDs error: %s", err.Error())
		span.SetStatus(codes.Error, fmt.Sprintf("Get action type[%v] error: %v", atIDs, err))
		return []*interfaces.ActionType{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ActionType_InternalError_GetActionTypesByIDsFailed).
			WithErrorDetails(err.Error())
	}

	if len(actionTypes) != len(atIDs) {
		errStr := fmt.Sprintf("Exists any action types not found, expect action types nums is [%d], actual action types num is [%d]", len(atIDs), len(actionTypes))
		logger.Errorf(errStr)
		span.SetStatus(codes.Error, errStr)
		return []*interfaces.ActionType{}, rest.NewHTTPError(ctx, http.StatusNotFound,
			oerrors.OntologyManager_ActionType_ActionTypeNotFound).WithErrorDetails(errStr)
	}

	// todo:翻译绑定的对象类、影响对象类、和对应的api文档
	// 获取绑定对象类和影响对象类的名称拿到
	for _, at := range actionTypes {
		affectObjectTypeID := ""
		if at.Affect != nil && at.Affect.ObjectTypeID != "" {
			affectObjectTypeID = at.Affect.ObjectTypeID
		}

		objectTypeMap, err := ats.ots.GetObjectTypesMapByIDs(ctx, knID,
			[]string{at.ObjectTypeID, affectObjectTypeID}, false)
		if err != nil {
			return []*interfaces.ActionType{}, err
		}

		if objectTypeMap[at.ObjectTypeID] != nil {
			at.ObjectType = interfaces.SimpleObjectType{
				OTID:   objectTypeMap[at.ObjectTypeID].OTID,
				OTName: objectTypeMap[at.ObjectTypeID].OTName,
				Icon:   objectTypeMap[at.ObjectTypeID].Icon,
				Color:  objectTypeMap[at.ObjectTypeID].Color,
			}
		}

		if objectTypeMap[affectObjectTypeID] != nil {
			at.Affect.ObjectType = interfaces.SimpleObjectType{
				OTID:   objectTypeMap[affectObjectTypeID].OTID,
				OTName: objectTypeMap[affectObjectTypeID].OTName,
				Icon:   objectTypeMap[affectObjectTypeID].Icon,
				Color:  objectTypeMap[affectObjectTypeID].Color,
			}
		}
	}

	span.SetStatus(codes.Ok, "")
	return actionTypes, nil
}

// 更新行动类
func (ats *actionTypeService) UpdateActionType(ctx context.Context,
	tx *sql.Tx, actionType *interfaces.ActionType) error {

	ctx, span := ar_trace.Tracer.Start(ctx, "Update action type")
	defer span.End()

	span.SetAttributes(
		attr.Key("at_id").String(actionType.ATID),
		attr.Key("ot_name").String(actionType.ATName))

	// 判断userid是否有修改业务知识网络的权限
	err := ats.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   actionType.KNID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return err
	}

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	actionType.Updater = accountInfo

	currentTime := time.Now().UnixMilli() // 行动类的update_time是int类型
	actionType.UpdateTime = currentTime

	if tx == nil {
		// 0. 开始事务
		tx, err = ats.db.Begin()
		if err != nil {
			logger.Errorf("Begin transaction error: %s", err.Error())
			span.SetStatus(codes.Error, "事务开启失败")
			o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

			return rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_ActionType_InternalError_BeginTransactionFailed).
				WithErrorDetails(err.Error())
		}
		// 0.1 异常时
		defer func() {
			switch err {
			case nil:
				// 提交事务
				err = tx.Commit()
				if err != nil {
					logger.Errorf("UpdateActionType Transaction Commit Failed:%v", err)
					span.SetStatus(codes.Error, "提交事务失败")
					o11y.Error(ctx, fmt.Sprintf("UpdateActionType Transaction Commit Failed: %s", err.Error()))
				}
				logger.Infof("UpdateActionType Transaction Commit Success:%v", actionType.ATName)
				o11y.Debug(ctx, fmt.Sprintf("UpdateActionType Transaction Commit Success: %s", actionType.ATName))
			default:
				rollbackErr := tx.Rollback()
				if rollbackErr != nil {
					logger.Errorf("UpdateActionType Transaction Rollback Error:%v", rollbackErr)
					span.SetStatus(codes.Error, "事务回滚失败")
					o11y.Error(ctx, fmt.Sprintf("UpdateActionType Transaction Rollback Error: %s", rollbackErr.Error()))
				}
			}
		}()
	}

	// 更新模型信息
	err = ats.ata.UpdateActionType(ctx, tx, actionType)
	if err != nil {
		logger.Errorf("UpdateActionType error: %s", err.Error())
		span.SetStatus(codes.Error, "修改行动类失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ActionType_InternalError).
			WithErrorDetails(err.Error())
	}

	err = ats.InsertOpenSearchData(ctx, []*interfaces.ActionType{actionType})
	if err != nil {
		logger.Errorf("insertOpenSearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "行动类索引写入失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ActionType_InternalError_InsertOpenSearchDataFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

func (ats *actionTypeService) DeleteActionTypes(ctx context.Context, tx *sql.Tx,
	knID string, atIDs []string) (int64, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "Delete action types")
	defer span.End()

	// 判断userid是否有修改业务知识网络的权限
	err := ats.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return 0, err
	}

	if tx == nil {
		// 0. 开始事务
		tx, err = ats.db.Begin()
		if err != nil {
			logger.Errorf("Begin transaction error: %s", err.Error())
			span.SetStatus(codes.Error, "事务开启失败")
			o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

			return 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_ActionType_InternalError_BeginTransactionFailed).
				WithErrorDetails(err.Error())
		}
		// 0.1 异常时
		defer func() {
			switch err {
			case nil:
				// 提交事务
				err = tx.Commit()
				if err != nil {
					logger.Errorf("DeleteActionTypes Transaction Commit Failed:%v", err)
					span.SetStatus(codes.Error, "提交事务失败")
					o11y.Error(ctx, fmt.Sprintf("DeleteActionTypes Transaction Commit Failed: %s", err.Error()))
				}
				logger.Infof("DeleteActionTypes Transaction Commit Success: kn_id:%s,ot_ids:%v", knID, atIDs)
				o11y.Debug(ctx, fmt.Sprintf("DeleteActionTypes Transaction Commit Success: kn_id:%s,ot_ids:%v", knID, atIDs))
			default:
				rollbackErr := tx.Rollback()
				if rollbackErr != nil {
					logger.Errorf("DeleteActionTypes Transaction Rollback Error:%v", rollbackErr)
					span.SetStatus(codes.Error, "事务回滚失败")
					o11y.Error(ctx, fmt.Sprintf("DeleteActionTypes Transaction Rollback Error: %s", rollbackErr.Error()))
				}
			}
		}()
	}

	// 删除行动类
	rowsAffect, err := ats.ata.DeleteActionTypes(ctx, tx, knID, atIDs)
	span.SetAttributes(attr.Key("rows_affect").Int64(rowsAffect))
	if err != nil {
		logger.Errorf("DeleteActionTypes error: %s", err.Error())
		span.SetStatus(codes.Error, "删除行动类失败")

		return rowsAffect, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ActionType_InternalError).WithErrorDetails(err.Error())
	}

	logger.Infof("DeleteActionTypes: Rows affected is %v, request delete ATIDs is %v!", rowsAffect, len(atIDs))
	if rowsAffect != int64(len(atIDs)) {
		logger.Warnf("Delete action types number %v not equal requerst action types number %v!", rowsAffect, len(atIDs))

		o11y.Warn(ctx, fmt.Sprintf("Delete action types number %v not equal requerst action types number %v!", rowsAffect, len(atIDs)))
	}

	for _, atID := range atIDs {
		docid := interfaces.GenerateConceptDocuemtnID(knID, interfaces.MODULE_TYPE_ACTION_TYPE, atID, interfaces.MAIN_BRANCH)
		err = ats.osa.DeleteData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid)
		if err != nil {
			return 0, err
		}
	}

	span.SetStatus(codes.Ok, "")
	return rowsAffect, nil
}

func (ats *actionTypeService) handleActionTypeImportMode(ctx context.Context, mode string,
	actionTypes []*interfaces.ActionType) ([]*interfaces.ActionType, []*interfaces.ActionType, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "action type import mode logic")
	defer span.End()

	creates := []*interfaces.ActionType{}
	updates := []*interfaces.ActionType{}

	// 3. 校验 若模型的id不为空，则用请求体的id与现有模型ID的重复性
	for _, at := range actionTypes {
		creates = append(creates, at)
		idExist := false
		_, idExist, err := ats.CheckActionTypeExistByID(ctx, at.KNID, at.ATID)
		if err != nil {
			return creates, updates, err
		}

		// 校验 请求体与现有模型名称的重复性
		existID, nameExist, err := ats.CheckActionTypeExistByName(ctx, at.KNID, at.ATName)
		if err != nil {
			return creates, updates, err
		}

		// 根据mode来区别，若是ignore，就从结果集中忽略，若是overwrite，就调用update，若是normal就报错。
		if idExist || nameExist {
			switch mode {
			case interfaces.ImportMode_Normal:
				if idExist {
					errDetails := fmt.Sprintf("The action type with id [%s] already exists!", at.ATID)
					logger.Error(errDetails)
					span.SetStatus(codes.Error, errDetails)
					return creates, updates, rest.NewHTTPError(ctx, http.StatusBadRequest,
						oerrors.OntologyManager_ActionType_ActionTypeIDExisted).
						WithErrorDetails(errDetails)
				}

				if nameExist {
					errDetails := fmt.Sprintf("action type name '%s' already exists", at.ATName)
					logger.Error(errDetails)
					span.SetStatus(codes.Error, errDetails)
					return creates, updates, rest.NewHTTPError(ctx, http.StatusForbidden,
						oerrors.OntologyManager_ActionType_ActionTypeNameExisted).
						WithDescription(map[string]any{"name": at.ATName}).
						WithErrorDetails(errDetails)
				}

			case interfaces.ImportMode_Ignore:
				// 存在重复的就跳过
				// 从create数组中删除
				creates = creates[:len(creates)-1]
			case interfaces.ImportMode_Overwrite:
				if idExist && nameExist {
					// 如果 id 和名称都存在，但是存在的名称对应的行动类 id 和当前行动类 id 不一样，则报错
					if existID != at.ATID {
						errDetails := fmt.Sprintf("ActionType ID '%s' and name '%s' already exist, but the exist action type id is '%s'",
							at.ATID, at.ATName, existID)
						logger.Error(errDetails)
						span.SetStatus(codes.Error, errDetails)
						return creates, updates, rest.NewHTTPError(ctx, http.StatusForbidden,
							oerrors.OntologyManager_ActionType_ActionTypeNameExisted).
							WithErrorDetails(errDetails)
					} else {
						// 如果 id 和名称、度量名称都存在，存在的名称对应的模型 id 和当前模型 id 一样，则覆盖更新
						// 从create数组中删除, 放到更新数组中
						creates = creates[:len(creates)-1]
						updates = append(updates, at)
					}
				}

				// id 已存在，且名称不存在，覆盖更新
				if idExist && !nameExist {
					// 从create数组中删除, 放到更新数组中
					creates = creates[:len(creates)-1]
					updates = append(updates, at)
				}

				// 如果 id 不存在，name 存在，报错
				if !idExist && nameExist {
					errDetails := fmt.Sprintf("ActionType ID '%s' does not exist, but name '%s' already exists",
						at.ATID, at.ATName)
					logger.Error(errDetails)
					span.SetStatus(codes.Error, errDetails)
					return creates, updates, rest.NewHTTPError(ctx, http.StatusForbidden,
						oerrors.OntologyManager_ActionType_ActionTypeNameExisted).
						WithErrorDetails(errDetails)
				}

				// 如果 id 不存在，name不存在，度量名称不存在，不需要做什么，创建
				// if !idExist && !nameExist {}
			}
		}
	}

	span.SetStatus(codes.Ok, "")
	return creates, updates, nil
}

func (ats *actionTypeService) InsertOpenSearchData(ctx context.Context, actionTypes []*interfaces.ActionType) error {
	ctx, span := ar_trace.Tracer.Start(ctx, "行动类索引写入")
	defer span.End()

	if ats.appSetting.ServerSetting.DefaultSmallModelEnabled {
		words := []string{}
		for _, at := range actionTypes {
			arr := []string{at.ATName}
			arr = append(arr, at.Tags...)
			arr = append(arr, at.Comment, at.Detail)
			word := strings.Join(arr, "\n")
			words = append(words, word)
		}

		dftModel, err := ats.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			span.SetStatus(codes.Error, "获取默认模型失败")
			return err
		}
		vectors, err := ats.mfa.GetVector(ctx, dftModel, words)
		if err != nil {
			logger.Errorf("GetVector error: %s", err.Error())
			span.SetStatus(codes.Error, "获取行动类向量失败")
			return err
		}

		if len(vectors) != len(actionTypes) {
			logger.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(actionTypes), len(vectors))
			span.SetStatus(codes.Error, "获取行动类向量失败")
			return fmt.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(actionTypes), len(vectors))
		}

		for i, at := range actionTypes {
			at.Vector = vectors[i].Vector
		}
	}

	for _, at := range actionTypes {
		docid := interfaces.GenerateConceptDocuemtnID(at.KNID, interfaces.MODULE_TYPE_ACTION_TYPE,
			at.ATID, at.Branch)
		at.ModuleType = interfaces.MODULE_TYPE_ACTION_TYPE

		err := ats.osa.InsertData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid, at)
		if err != nil {
			logger.Errorf("InsertData error: %s", err.Error())
			span.SetStatus(codes.Error, "行动类概念索引写入失败")
			return err
		}
	}
	return nil
}

func (ats *actionTypeService) SearchActionTypes(ctx context.Context,
	query *interfaces.ConceptsQuery) (interfaces.ActionTypes, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "业务知识网络行动类检索")
	defer span.End()

	response := interfaces.ActionTypes{}

	// 构造 DSL 过滤条件
	condtion, err := cond.NewCondition(ctx, query.ActualCondition, 1, interfaces.CONCPET_QUERY_FIELD)
	if err != nil {
		return response, rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_ActionType_InvalidParameter_ConceptCondition).
			WithErrorDetails(fmt.Sprintf("failed to new condition, %s", err.Error()))
	}

	// 转换到dsl
	conditionDslStr, err := condtion.Convert(ctx, func(ctx context.Context, words []string) ([]cond.VectorResp, error) {
		if !ats.appSetting.ServerSetting.DefaultSmallModelEnabled {
			err = errors.New("DefaultSmallModelEnabled is false, does not support knn condition")
			span.SetStatus(codes.Error, err.Error())
			return nil, err
		}
		dftModel, err := ats.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			span.SetStatus(codes.Error, "获取默认模型失败")
			return nil, err
		}
		return ats.mfa.GetVector(ctx, dftModel, words)
	})
	if err != nil {
		return response, rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_ActionType_InvalidParameter_ConceptCondition).
			WithErrorDetails(fmt.Sprintf("failed to convert condition to dsl, %s", err.Error()))
	}

	dsl, err := logics.BuildDslQuery(ctx, conditionDslStr, query)
	if err != nil {
		return response, err
	}

	// 请求opensearch
	result, err := ats.osa.SearchData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, dsl)
	if err != nil {
		logger.Errorf("SearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "业务知识网络行动类检索查询失败")
		return response, err
	}

	// 根据NeedTotal参数决定是否查询total
	if query.NeedTotal {
		total, err := ats.GetTotal(ctx, dsl)
		if err != nil {
			return response, err
		}
		response.TotalCount = total
	}

	// 解析结果，转结构
	actionTypes := []*interfaces.ActionType{}
	for _, concept := range result {
		// 转成 object type 的 struct
		jsonByte, err := json.Marshal(concept.Source)
		if err != nil {
			return response, rest.NewHTTPError(ctx, http.StatusBadRequest,
				oerrors.OntologyManager_InternalError_MarshalDataFailed).
				WithErrorDetails(fmt.Sprintf("failed to Marshal opensearch hit _source, %s", err.Error()))
		}
		var actionType interfaces.ActionType
		err = json.Unmarshal(jsonByte, &actionType)
		if err != nil {
			return response, rest.NewHTTPError(ctx, http.StatusBadRequest,
				oerrors.OntologyManager_InternalError_UnMarshalDataFailed).
				WithErrorDetails(fmt.Sprintf("failed to Unmarshal opensearch hit _source to Object Type, %s", err.Error()))
		}

		actionType.Score = &concept.Score
		actionType.Vector = nil
		actionTypes = append(actionTypes, &actionType)
	}
	response.Entries = actionTypes

	var searchAfter []any
	if len(result) > 0 {
		searchAfter = result[len(result)-1].Sort
	} else {
		searchAfter = nil
	}
	response.SearchAfter = searchAfter

	return response, nil
}

func (ats *actionTypeService) GetTotal(ctx context.Context, dsl map[string]any) (total int64, err error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "logic layer: search action type total ")
	defer span.End()

	// delete(dsl, "pit")
	delete(dsl, "from")
	delete(dsl, "size")
	delete(dsl, "sort")
	totalBytes, err := ats.osa.Count(ctx, interfaces.KN_CONCEPT_INDEX_NAME, dsl)
	if err != nil {
		span.SetStatus(codes.Error, "Search total documents count failed")
		// return total, rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.Uniquery_InternalError_CountFailed).
		// 	WithErrorDetails(err.Error())
	}

	totalNode, err := sonic.Get(totalBytes, "count")
	if err != nil {
		span.SetStatus(codes.Error, "Get total documents count failed")
		// return total, rest.NewHTTPError(ctx, http.StatusInternalServerError, uerrors.Uniquery_InternalError_CountFailed).
		// 	WithErrorDetails(err.Error())
	}

	total, err = totalNode.Int64()
	if err != nil {
		span.SetStatus(codes.Error, "Convert total documents count to type int64 failed")
		// return total, rest.NewHTTPError(ctx, http.StatusInternalServerError, uerrors.Uniquery_InternalError_CountFailed).
		// 	WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return total, nil
}

// 内部调用，不加权限校验
func (ats *actionTypeService) GetActionTypeIDsByKnID(ctx context.Context, knID string) ([]string, error) {
	// 获取行动类
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("按kn_id[%s]获取行动类IDs", knID))
	defer span.End()

	span.SetAttributes(attr.Key("kn_id").String(fmt.Sprintf("%v", knID)))

	// 获取模型基本信息
	atIDs, err := ats.ata.GetActionTypeIDsByKnID(ctx, knID)
	if err != nil {
		logger.Errorf("GetActionTypeIDsByKnID error: %s", err.Error())
		span.SetStatus(codes.Error, fmt.Sprintf("Get action type[%v] error: %v", atIDs, err))
		return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ActionType_InternalError_GetActionTypesByIDsFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return atIDs, nil
}

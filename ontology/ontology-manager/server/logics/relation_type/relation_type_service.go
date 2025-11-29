package relation_type

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
	rtServiceOnce sync.Once
	rtService     interfaces.RelationTypeService
)

type relationTypeService struct {
	appSetting *common.AppSetting
	db         *sql.DB
	dva        interfaces.DataViewAccess
	mfa        interfaces.ModelFactoryAccess
	osa        interfaces.OpenSearchAccess
	ots        interfaces.ObjectTypeService
	ps         interfaces.PermissionService
	rta        interfaces.RelationTypeAccess
	uma        interfaces.UserMgmtAccess
}

func NewRelationTypeService(appSetting *common.AppSetting) interfaces.RelationTypeService {
	rtServiceOnce.Do(func() {
		rtService = &relationTypeService{
			appSetting: appSetting,
			db:         logics.DB,
			dva:        logics.DVA,
			mfa:        logics.MFA,
			osa:        logics.OSA,
			ots:        object_type.NewObjectTypeService(appSetting),
			ps:         permission.NewPermissionService(appSetting),
			rta:        logics.RTA,
			uma:        logics.UMA,
		}
	})
	return rtService
}

func (rts *relationTypeService) CheckRelationTypeExistByID(ctx context.Context,
	knID string, rtID string) (string, bool, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("校验关系类[%s]的存在性", rtID))
	defer span.End()

	span.SetAttributes(attr.Key("rt_id").String(rtID))

	rtName, exist, err := rts.rta.CheckRelationTypeExistByID(ctx, knID, rtID)
	if err != nil {
		logger.Errorf("CheckRelationTypeExistByID error: %s", err.Error())
		// 记录处理的 sql 字符串
		o11y.Error(ctx, fmt.Sprintf("按ID[%s]获取关系类失败: %v", rtID, err))
		span.SetStatus(codes.Error, fmt.Sprintf("按ID[%s]获取关系类失败", rtID))
		return "", exist, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_RelationType_InternalError_CheckRelationTypeIfExistFailed).WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return rtName, exist, nil
}

func (rts *relationTypeService) CheckRelationTypeExistByName(ctx context.Context,
	knID string, rtName string) (string, bool, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("校验关系类[%s]的存在性", rtName))
	defer span.End()

	span.SetAttributes(attr.Key("rt_name").String(rtName))

	rtID, exist, err := rts.rta.CheckRelationTypeExistByName(ctx, knID, rtName)
	if err != nil {
		logger.Errorf("CheckRelationTypeExistByName error: %s", err.Error())
		// 记录处理的 sql 字符串
		o11y.Error(ctx, fmt.Sprintf("按名称[%v]获取关系类失败: %v", rtName, err))
		span.SetStatus(codes.Error, fmt.Sprintf("按名称[%s]获取关系类失败", rtName))
		return rtID, exist, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_RelationType_InternalError_CheckRelationTypeIfExistFailed).WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return rtID, exist, nil
}

func (rts *relationTypeService) CreateRelationTypes(ctx context.Context, tx *sql.Tx,
	relationTypes []*interfaces.RelationType, mode string) ([]string, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "Create relation type")
	defer span.End()

	// 判断userid是否有修改业务知识网络的权限
	err := rts.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   relationTypes[0].KNID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return []string{}, err
	}

	currentTime := time.Now().UnixMilli()
	for _, relationType := range relationTypes {
		// 若提交的模型id为空，生成分布式ID
		if relationType.RTID == "" {
			relationType.RTID = xid.New().String()
		}

		accountInfo := interfaces.AccountInfo{}
		if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
			accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
		}
		relationType.Creator = accountInfo
		relationType.Updater = accountInfo

		relationType.CreateTime = currentTime
		relationType.UpdateTime = currentTime

		// todo: 处理版本
	}

	// 0. 开始事务
	if tx == nil {
		tx, err = rts.db.Begin()
		if err != nil {
			logger.Errorf("Begin transaction error: %s", err.Error())
			span.SetStatus(codes.Error, "事务开启失败")
			o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))
			return []string{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_RelationType_InternalError_BeginTransactionFailed).
				WithErrorDetails(err.Error())
		}
		// 0.1 异常时
		defer func() {
			switch err {
			case nil:
				// 提交事务
				err = tx.Commit()
				if err != nil {
					logger.Errorf("CreateRelationType Transaction Commit Failed:%v", err)
					span.SetStatus(codes.Error, "提交事务失败")
					o11y.Error(ctx, fmt.Sprintf("CreateRelationType Transaction Commit Failed: %s", err.Error()))
					return
				}
				logger.Infof("CreateRelationType Transaction Commit Success")
				o11y.Debug(ctx, "CreateRelationType Transaction Commit Success")
			default:
				rollbackErr := tx.Rollback()
				if rollbackErr != nil {
					logger.Errorf("CreateRelationType Transaction Rollback Error:%v", rollbackErr)
					span.SetStatus(codes.Error, "事务回滚失败")
					o11y.Error(ctx, fmt.Sprintf("CreateRelationType Transaction Rollback Error: %s", err.Error()))
				}
			}
		}()
	}

	createRelationTypes, updateRelationTypes, err := rts.handleRelationTypeImportMode(ctx, mode, relationTypes)
	if err != nil {
		return []string{}, err
	}

	// 更新
	for _, relationType := range updateRelationTypes {
		// todo: 提交的已存在，需要更新，则版本号+1
		err = rts.UpdateRelationType(ctx, tx, relationType)
		if err != nil {
			return []string{}, err
		}
	}

	// 1. 创建模型
	rtIDs := []string{}
	for _, relationType := range createRelationTypes {
		rtIDs = append(rtIDs, relationType.RTID)
		err = rts.rta.CreateRelationType(ctx, tx, relationType)
		if err != nil {
			logger.Errorf("CreateRelationType error: %s", err.Error())
			span.SetStatus(codes.Error, "创建关系类失败")
			return []string{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_RelationType_InternalError).
				WithErrorDetails(err.Error())
		}
	}

	err = rts.InsertOpenSearchData(ctx, relationTypes)
	if err != nil {
		logger.Errorf("insertOpenSearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "关系类索引写入失败")
		return []string{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_RelationType_InternalError_InsertOpenSearchDataFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return rtIDs, nil
}

func (rts *relationTypeService) ListRelationTypes(ctx context.Context,
	query interfaces.RelationTypesQueryParams) ([]*interfaces.RelationType, int, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "查询关系类列表")
	defer span.End()

	// 判断userid是否有查看业务知识网络的权限
	err := rts.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   query.KNID,
	}, []string{interfaces.OPERATION_TYPE_VIEW_DETAIL})
	if err != nil {
		return []*interfaces.RelationType{}, 0, err
	}

	//获取关系类列表
	relationTypes, err := rts.rta.ListRelationTypes(ctx, query)
	if err != nil {
		logger.Errorf("ListRelationTypes error: %s", err.Error())
		span.SetStatus(codes.Error, "List relation types error")

		return []*interfaces.RelationType{}, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_RelationType_InternalError).WithErrorDetails(err.Error())
	}
	if len(relationTypes) == 0 {
		span.SetStatus(codes.Ok, "")
		return relationTypes, 0, nil
	}

	// 把起点终点对象类的名称拿到
	for _, relationType := range relationTypes {
		// 起点终点对象类的名称拿到
		objectTypeMap, err := rts.ots.GetObjectTypesMapByIDs(ctx, query.KNID,
			[]string{relationType.SourceObjectTypeID, relationType.TargetObjectTypeID}, true)
		if err != nil {
			return []*interfaces.RelationType{}, 0, err
		}

		sourceObj := objectTypeMap[relationType.SourceObjectTypeID]
		targetObj := objectTypeMap[relationType.TargetObjectTypeID]

		if sourceObj != nil {
			relationType.SourceObjectType = interfaces.SimpleObjectType{
				OTID:   relationType.SourceObjectTypeID,
				OTName: sourceObj.OTName,
				Icon:   sourceObj.Icon,
				Color:  sourceObj.Color,
			}
		}
		if targetObj != nil {
			relationType.TargetObjectType = interfaces.SimpleObjectType{
				OTID:   relationType.TargetObjectTypeID,
				OTName: targetObj.OTName,
				Icon:   targetObj.Icon,
				Color:  targetObj.Color,
			}
		}
	}

	// limit = -1,则返回所有
	if query.Limit == -1 {
		span.SetStatus(codes.Ok, "")
		return relationTypes, len(relationTypes), nil
	}
	// 分页
	// 检查起始位置是否越界
	if query.Offset < 0 || query.Offset >= len(relationTypes) {
		span.SetStatus(codes.Ok, "")
		return []*interfaces.RelationType{}, 0, nil
	}
	// 计算结束位置
	end := query.Offset + query.Limit
	if end > len(relationTypes) {
		end = len(relationTypes)
	}

	total := len(relationTypes)
	relationTypes = relationTypes[query.Offset:end]

	userIDsMap := make(map[string]interfaces.AccountInfo)
	for _, rt := range relationTypes {
		userIDsMap[rt.Creator.ID] = rt.Creator
		userIDsMap[rt.Updater.ID] = rt.Updater
	}

	userIDs := make([]string, 0, len(userIDsMap))
	for userID := range userIDsMap {
		userIDs = append(userIDs, userID)
	}

	userNames, err := rts.uma.GetUserNames(ctx, userIDs)
	if err != nil {
		span.SetStatus(codes.Error, "GetUserNames error")

		return []*interfaces.RelationType{}, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_RelationType_InternalError).WithErrorDetails(err.Error())
	}

	for _, rt := range relationTypes {
		if userName, exist := userNames[rt.Creator.ID]; exist {
			rt.Creator.Name = userName
		} else {
			rt.Creator.Name = "-"
		}
		if userName, exist := userNames[rt.Updater.ID]; exist {
			rt.Updater.Name = userName
		} else {
			rt.Updater.Name = "-"
		}
	}

	span.SetStatus(codes.Ok, "")
	return relationTypes, total, nil
}

func (rts *relationTypeService) GetRelationTypes(ctx context.Context,
	knID string, rtIDs []string) ([]*interfaces.RelationType, error) {
	// 获取关系类
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("查询关系类[%v]信息", rtIDs))
	defer span.End()

	span.SetAttributes(attr.Key("rt_ids").String(fmt.Sprintf("%v", rtIDs)))

	// 判断userid是否有查看业务知识网络的权限
	err := rts.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_VIEW_DETAIL})
	if err != nil {
		return []*interfaces.RelationType{}, err
	}

	// id去重后再查
	rtIDs = common.DuplicateSlice(rtIDs)

	// 获取模型基本信息
	relationTypes, err := rts.rta.GetRelationTypesByIDs(ctx, knID, rtIDs)
	if err != nil {
		logger.Errorf("GetRelationTypesByRTIDs error: %s", err.Error())
		span.SetStatus(codes.Error, fmt.Sprintf("Get relation types[%v] error: %v", rtIDs, err))

		return []*interfaces.RelationType{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_RelationType_InternalError_GetRelationTypesByIDsFailed).
			WithErrorDetails(err.Error())
	}

	if len(relationTypes) != len(rtIDs) {
		errStr := fmt.Sprintf("Exists any relation types not found, expect relation type nums is [%d], actual relation types num is [%d]", len(rtIDs), len(relationTypes))
		logger.Errorf(errStr)
		span.SetStatus(codes.Error, errStr)

		return []*interfaces.RelationType{}, rest.NewHTTPError(ctx, http.StatusNotFound,
			oerrors.OntologyManager_RelationType_RelationTypeNotFound).WithErrorDetails(errStr)
	}

	// 把起点终点对象类的名称拿到
	for _, rt := range relationTypes {
		// 起点终点对象类的名称拿到
		objectTypeMap, err := rts.ots.GetObjectTypesMapByIDs(ctx, knID,
			[]string{rt.SourceObjectTypeID, rt.TargetObjectTypeID}, true)
		if err != nil {
			return []*interfaces.RelationType{}, err
		}

		sourceObj := objectTypeMap[rt.SourceObjectTypeID]
		targetObj := objectTypeMap[rt.TargetObjectTypeID]

		// 映射字段的翻译
		switch rt.Type {
		case interfaces.RELATION_TYPE_DIRECT:
			// 若都没有，不翻译，继续往下
			if sourceObj == nil && targetObj == nil {
				continue
			}

			// 源属性来自于源对象类。只绑数据属性，所以只需构造数据属性的map
			// 映射里的source字段名加上显示名
			for k, m := range rt.MappingRules.([]interfaces.Mapping) {
				if sourceObj != nil {
					rt.SourceObjectType = interfaces.SimpleObjectType{
						OTID:   rt.SourceObjectTypeID,
						OTName: sourceObj.OTName,
						Icon:   sourceObj.Icon,
						Color:  sourceObj.Color,
					}
					// 映射里的source字段名加上显示名
					rt.MappingRules.([]interfaces.Mapping)[k].SourceProp.DisplayName = sourceObj.PropertyMap[m.SourceProp.Name]
				}
				if targetObj != nil {
					rt.TargetObjectType = interfaces.SimpleObjectType{
						OTID:   rt.TargetObjectTypeID,
						OTName: targetObj.OTName,
						Icon:   targetObj.Icon,
						Color:  targetObj.Color,
					}
					// 映射里的target字段名加上显示名
					rt.MappingRules.([]interfaces.Mapping)[k].TargetProp.DisplayName = targetObj.PropertyMap[m.TargetProp.Name]
				}
			}

		case interfaces.RELATION_TYPE_DATA_VIEW:
			// 查视图，翻译视图名称和视图字段显示名
			mappingRules := rt.MappingRules.(interfaces.InDirectMapping)
			dataView, err := rts.dva.GetDataViewByID(ctx, mappingRules.BackingDataSource.ID)
			if err != nil {
				return []*interfaces.RelationType{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_RelationType_InternalError_GetDataViewByIDFailed).
					WithErrorDetails(err.Error())
			}
			if dataView == nil {
				o11y.Warn(ctx, fmt.Sprintf("Relation type [%s]'s Backing Data view %s not found", rt.RTID, mappingRules.BackingDataSource.ID))
				// 若都没有，不翻译，遍历下一个
				if sourceObj == nil && targetObj == nil {
					continue
				}
			} else {
				rt.MappingRules.(interfaces.InDirectMapping).BackingDataSource.Name = dataView.ViewName
			}

			// 起点到视图
			for k, m := range rt.MappingRules.(interfaces.InDirectMapping).SourceMappingRules {
				if sourceObj != nil {
					rt.SourceObjectType = interfaces.SimpleObjectType{
						OTID:   rt.SourceObjectTypeID,
						OTName: sourceObj.OTName,
						Icon:   sourceObj.Icon,
						Color:  sourceObj.Color,
					}
					// 映射里的source字段名加上显示名
					rt.MappingRules.(interfaces.InDirectMapping).SourceMappingRules[k].
						SourceProp.DisplayName = sourceObj.PropertyMap[m.SourceProp.Name]
				}
				if dataView != nil {
					// 映射里的target字段名加上显示名
					rt.MappingRules.(interfaces.InDirectMapping).SourceMappingRules[k].
						TargetProp.DisplayName = dataView.FieldsMap[m.TargetProp.Name].DisplayName
				}
			}

			// 视图到终点
			for k, m := range rt.MappingRules.(interfaces.InDirectMapping).TargetMappingRules {
				if dataView != nil {
					// 映射里的target字段名加上显示名
					rt.MappingRules.(interfaces.InDirectMapping).TargetMappingRules[k].
						SourceProp.DisplayName = dataView.FieldsMap[m.SourceProp.Name].DisplayName
				}
				if targetObj != nil {
					rt.TargetObjectType = interfaces.SimpleObjectType{
						OTID:   rt.TargetObjectTypeID,
						OTName: targetObj.OTName,
						Icon:   targetObj.Icon,
						Color:  targetObj.Color,
					}
					// 映射里的target字段名加上显示名
					rt.MappingRules.(interfaces.InDirectMapping).TargetMappingRules[k].
						TargetProp.DisplayName = targetObj.PropertyMap[m.TargetProp.Name]
				}
			}
		}
	}

	span.SetStatus(codes.Ok, "")
	return relationTypes, nil
}

// 更新关系类
func (rts *relationTypeService) UpdateRelationType(ctx context.Context,
	tx *sql.Tx, rt *interfaces.RelationType) error {

	ctx, span := ar_trace.Tracer.Start(ctx, "Update relation type")
	defer span.End()

	span.SetAttributes(
		attr.Key("rt_id").String(rt.RTID),
		attr.Key("rt_name").String(rt.RTName))

	// 判断userid是否有修改业务知识网络的权限
	err := rts.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   rt.KNID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return err
	}

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	rt.Updater = accountInfo

	currentTime := time.Now().UnixMilli() // 关系类的update_time是int类型
	rt.UpdateTime = currentTime

	if tx == nil {
		// 0. 开始事务
		tx, err = rts.db.Begin()
		if err != nil {
			logger.Errorf("Begin transaction error: %s", err.Error())
			span.SetStatus(codes.Error, "事务开启失败")
			o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

			return rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_RelationType_InternalError_BeginTransactionFailed).
				WithErrorDetails(err.Error())
		}
		// 0.1 异常时
		defer func() {
			switch err {
			case nil:
				// 提交事务
				err = tx.Commit()
				if err != nil {
					logger.Errorf("UpdateRelationType Transaction Commit Failed:%v", err)
					span.SetStatus(codes.Error, "提交事务失败")
					o11y.Error(ctx, fmt.Sprintf("UpdateRelationType Transaction Commit Failed: %s", err.Error()))
				}
				logger.Infof("UpdateRelationType Transaction Commit Success:%v", rt.RTName)
				o11y.Debug(ctx, fmt.Sprintf("UpdateRelationType Transaction Commit Success: %s", rt.RTName))
			default:
				rollbackErr := tx.Rollback()
				if rollbackErr != nil {
					logger.Errorf("UpdateRelationType Transaction Rollback Error:%v", rollbackErr)
					span.SetStatus(codes.Error, "事务回滚失败")
					o11y.Error(ctx, fmt.Sprintf("UpdateRelationType Transaction Rollback Error: %s", err.Error()))
				}
			}
		}()
	}

	// 更新模型信息
	err = rts.rta.UpdateRelationType(ctx, tx, rt)
	if err != nil {
		logger.Errorf("relationType error: %s", err.Error())
		span.SetStatus(codes.Error, "修改关系类失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_RelationType_InternalError).
			WithErrorDetails(err.Error())
	}

	err = rts.InsertOpenSearchData(ctx, []*interfaces.RelationType{rt})
	if err != nil {
		logger.Errorf("insertOpenSearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "对象类索引写入失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_RelationType_InternalError_InsertOpenSearchDataFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

func (rts *relationTypeService) DeleteRelationTypes(ctx context.Context, tx *sql.Tx,
	knID string, rtIDs []string) (int64, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "Delete relation types")
	defer span.End()

	// 判断userid是否有修改业务知识网络的权限
	err := rts.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return 0, err
	}

	if tx == nil {
		// 0. 开始事务
		tx, err = rts.db.Begin()
		if err != nil {
			logger.Errorf("Begin transaction error: %s", err.Error())
			span.SetStatus(codes.Error, "事务开启失败")
			o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

			return 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_RelationType_InternalError_BeginTransactionFailed).
				WithErrorDetails(err.Error())
		}
		// 0.1 异常时
		defer func() {
			switch err {
			case nil:
				// 提交事务
				err = tx.Commit()
				if err != nil {
					logger.Errorf("DeleteRelationTypes Transaction Commit Failed:%v", err)
					span.SetStatus(codes.Error, "提交事务失败")
					o11y.Error(ctx, fmt.Sprintf("DeleteRelationTypes Transaction Commit Failed: %s", err.Error()))
				}
				logger.Infof("DeleteRelationTypes Transaction Commit Success: kn_id:%s,ot_ids:%v", knID, rtIDs)
				o11y.Debug(ctx, fmt.Sprintf("DeleteRelationTypes Transaction Commit Success: kn_id:%s,ot_ids:%v", knID, rtIDs))
			default:
				rollbackErr := tx.Rollback()
				if rollbackErr != nil {
					logger.Errorf("DeleteRelationTypes Transaction Rollback Error:%v", rollbackErr)
					span.SetStatus(codes.Error, "事务回滚失败")
					o11y.Error(ctx, fmt.Sprintf("DeleteRelationTypes Transaction Rollback Error: %s", rollbackErr.Error()))
				}
			}
		}()
	}

	// 删除指标模型
	rowsAffect, err := rts.rta.DeleteRelationTypes(ctx, tx, knID, rtIDs)
	span.SetAttributes(attr.Key("rows_affect").Int64(rowsAffect))
	if err != nil {
		logger.Errorf("DeleteRelationTypes error: %s", err.Error())
		span.SetStatus(codes.Error, "删除关系类失败")

		return rowsAffect, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_RelationType_InternalError).WithErrorDetails(err.Error())
	}

	logger.Infof("DeleteRelationTypes: Rows affected is %v, request delete RTIDs is %v!", rowsAffect, len(rtIDs))
	if rowsAffect != int64(len(rtIDs)) {
		logger.Warnf("Delete relation types number %v not equal requerst relation types number %v!", rowsAffect, len(rtIDs))
		o11y.Warn(ctx, fmt.Sprintf("Delete relation types number %v not equal requerst relation types number %v!", rowsAffect, len(rtIDs)))
	}

	for _, rtID := range rtIDs {
		docid := interfaces.GenerateConceptDocuemtnID(knID, interfaces.MODULE_TYPE_RELATION_TYPE, rtID, interfaces.MAIN_BRANCH)
		err = rts.osa.DeleteData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid)
		if err != nil {
			return 0, err
		}
	}

	span.SetStatus(codes.Ok, "")
	return rowsAffect, nil
}

func (rts *relationTypeService) handleRelationTypeImportMode(ctx context.Context, mode string,
	relationTypes []*interfaces.RelationType) ([]*interfaces.RelationType, []*interfaces.RelationType, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "relation type import mode logic")
	defer span.End()

	creates := []*interfaces.RelationType{}
	updates := []*interfaces.RelationType{}

	// 3. 校验 若模型的id不为空，则用请求体的id与现有模型ID的重复性
	for _, relationType := range relationTypes {
		creates = append(creates, relationType)
		idExist := false
		_, idExist, err := rts.CheckRelationTypeExistByID(ctx, relationType.KNID, relationType.RTID)
		if err != nil {
			return creates, updates, err
		}

		// 校验 请求体与现有模型名称的重复性
		existID, nameExist, err := rts.CheckRelationTypeExistByName(ctx, relationType.KNID, relationType.RTName)
		if err != nil {
			return creates, updates, err
		}

		// 根据mode来区别，若是ignore，就从结果集中忽略，若是overwrite，就调用update，若是normal就报错。
		if idExist || nameExist {
			switch mode {
			case interfaces.ImportMode_Normal:
				if idExist {
					errDetails := fmt.Sprintf("The relation type with id [%s] already exists!", relationType.RTID)
					logger.Error(errDetails)
					span.SetStatus(codes.Error, errDetails)
					return creates, updates, rest.NewHTTPError(ctx, http.StatusBadRequest,
						oerrors.OntologyManager_RelationType_RelationTypeIDExisted).
						WithErrorDetails(errDetails)
				}

				if nameExist {
					errDetails := fmt.Sprintf("relation type name '%s' already exists", relationType.RTName)
					logger.Error(errDetails)
					span.SetStatus(codes.Error, errDetails)
					return creates, updates, rest.NewHTTPError(ctx, http.StatusForbidden,
						oerrors.OntologyManager_RelationType_RelationTypeNameExisted).
						WithDescription(map[string]any{"name": relationType.RTName}).
						WithErrorDetails(errDetails)
				}

			case interfaces.ImportMode_Ignore:
				// 存在重复的就跳过
				// 从create数组中删除
				creates = creates[:len(creates)-1]
			case interfaces.ImportMode_Overwrite:
				if idExist && nameExist {
					// 如果 id 和名称都存在，但是存在的名称对应的视图 id 和当前视图 id 不一样，则报错
					if existID != relationType.RTID {
						errDetails := fmt.Sprintf("RelationType ID '%s' and name '%s' already exist, but the exist relation type id is '%s'",
							relationType.RTID, relationType.RTName, existID)
						logger.Error(errDetails)
						span.SetStatus(codes.Error, errDetails)
						return creates, updates, rest.NewHTTPError(ctx, http.StatusForbidden,
							oerrors.OntologyManager_RelationType_RelationTypeNameExisted).
							WithErrorDetails(errDetails)
					} else {
						// 如果 id 和名称、度量名称都存在，存在的名称对应的模型 id 和当前模型 id 一样，则覆盖更新
						// 从create数组中删除, 放到更新数组中
						creates = creates[:len(creates)-1]
						updates = append(updates, relationType)
					}
				}

				// id 已存在，且名称不存在，覆盖更新
				if idExist && !nameExist {
					// 从create数组中删除, 放到更新数组中
					creates = creates[:len(creates)-1]
					updates = append(updates, relationType)
				}

				// 如果 id 不存在，name 存在，报错
				if !idExist && nameExist {
					errDetails := fmt.Sprintf("RelationType ID '%s' does not exist, but name '%s' already exists",
						relationType.RTID, relationType.RTName)
					logger.Error(errDetails)
					span.SetStatus(codes.Error, errDetails)
					return creates, updates, rest.NewHTTPError(ctx, http.StatusForbidden,
						oerrors.OntologyManager_RelationType_RelationTypeNameExisted).
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

func (rts *relationTypeService) InsertOpenSearchData(ctx context.Context, relationTypes []*interfaces.RelationType) error {
	ctx, span := ar_trace.Tracer.Start(ctx, "关系类索引写入")
	defer span.End()

	if rts.appSetting.ServerSetting.DefaultSmallModelEnabled {

		words := []string{}
		for _, relationType := range relationTypes {
			arr := []string{relationType.RTName}
			arr = append(arr, relationType.Tags...)
			arr = append(arr, relationType.Comment, relationType.Detail)
			word := strings.Join(arr, "\n")
			words = append(words, word)
		}

		dftModel, err := rts.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			span.SetStatus(codes.Error, "获取默认模型失败")
			return err
		}
		vectors, err := rts.mfa.GetVector(ctx, dftModel, words)
		if err != nil {
			logger.Errorf("GetVector error: %s", err.Error())
			span.SetStatus(codes.Error, "获取关系类向量失败")
			return err
		}

		if len(vectors) != len(relationTypes) {
			logger.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(relationTypes), len(vectors))
			span.SetStatus(codes.Error, "获取关系类向量失败")
			return fmt.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(relationTypes), len(vectors))
		}

		for i, rt := range relationTypes {
			rt.Vector = vectors[i].Vector
		}
	}

	for _, rt := range relationTypes {
		docid := interfaces.GenerateConceptDocuemtnID(rt.KNID, interfaces.MODULE_TYPE_RELATION_TYPE,
			rt.RTID, rt.Branch)
		rt.ModuleType = interfaces.MODULE_TYPE_RELATION_TYPE

		err := rts.osa.InsertData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid, rt)
		if err != nil {
			logger.Errorf("InsertData error: %s", err.Error())
			span.SetStatus(codes.Error, "关系类概念索引写入失败")
			return err
		}
	}
	return nil
}

func (rts *relationTypeService) SearchRelationTypes(ctx context.Context,
	query *interfaces.ConceptsQuery) (interfaces.RelationTypes, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "业务知识网络关系类检索")
	defer span.End()

	response := interfaces.RelationTypes{}

	// 构造 DSL 过滤条件
	condtion, err := cond.NewCondition(ctx, query.ActualCondition, 1, interfaces.CONCPET_QUERY_FIELD)
	if err != nil {
		return response, rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_RelationType_InvalidParameter_ConceptCondition).
			WithErrorDetails(fmt.Sprintf("failed to new condition, %s", err.Error()))
	}

	// 转换到dsl
	conditionDslStr, err := condtion.Convert(ctx, func(ctx context.Context, words []string) ([]cond.VectorResp, error) {
		if !rts.appSetting.ServerSetting.DefaultSmallModelEnabled {
			err = errors.New("DefaultSmallModelEnabled is false, does not support knn condition")
			span.SetStatus(codes.Error, err.Error())
			return nil, err
		}
		dftModel, err := rts.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			span.SetStatus(codes.Error, "获取默认模型失败")
			return nil, err
		}
		return rts.mfa.GetVector(ctx, dftModel, words)
	})
	if err != nil {
		return response, rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_RelationType_InvalidParameter_ConceptCondition).
			WithErrorDetails(fmt.Sprintf("failed to convert condition to dsl, %s", err.Error()))
	}

	dsl, err := logics.BuildDslQuery(ctx, conditionDslStr, query)
	if err != nil {
		return response, err
	}

	// 请求opensearch
	result, err := rts.osa.SearchData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, dsl)
	if err != nil {
		logger.Errorf("SearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "业务知识网络关系类检索查询失败")
		return response, err
	}

	// 根据NeedTotal参数决定是否查询total
	if query.NeedTotal {
		total, err := rts.GetTotal(ctx, dsl)
		if err != nil {
			return response, err
		}
		response.TotalCount = total
	}

	// 解析结果，转结构
	relationTypes := []*interfaces.RelationType{}
	for _, concept := range result {
		// 转成 object type 的 struct
		jsonByte, err := json.Marshal(concept.Source)
		if err != nil {
			return response, rest.NewHTTPError(ctx, http.StatusBadRequest,
				oerrors.OntologyManager_InternalError_MarshalDataFailed).
				WithErrorDetails(fmt.Sprintf("failed to Marshal opensearch hit _source, %s", err.Error()))
		}
		var relationType interfaces.RelationType
		err = json.Unmarshal(jsonByte, &relationType)
		if err != nil {
			return response, rest.NewHTTPError(ctx, http.StatusBadRequest,
				oerrors.OntologyManager_InternalError_UnMarshalDataFailed).
				WithErrorDetails(fmt.Sprintf("failed to Unmarshal opensearch hit _source to Object Type, %s", err.Error()))
		}

		relationType.Score = &concept.Score
		relationType.Vector = nil
		relationTypes = append(relationTypes, &relationType)
	}
	response.Entries = relationTypes

	var searchAfter []any
	if len(result) > 0 {
		searchAfter = result[len(result)-1].Sort
	} else {
		searchAfter = nil
	}
	response.SearchAfter = searchAfter

	return response, nil
}

func (rts *relationTypeService) GetTotal(ctx context.Context, dsl map[string]any) (total int64, err error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "logic layer: search relation type total ")
	defer span.End()

	// delete(dsl, "pit")
	delete(dsl, "from")
	delete(dsl, "size")
	delete(dsl, "sort")
	totalBytes, err := rts.osa.Count(ctx, interfaces.KN_CONCEPT_INDEX_NAME, dsl)
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
func (rts *relationTypeService) GetRelationTypeIDsByKnID(ctx context.Context, knID string) ([]string, error) {
	// 获取关系类
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("按kn_id[%s]获取关系类IDs", knID))
	defer span.End()

	span.SetAttributes(attr.Key("kn_id").String(knID))

	// 获取对象类基本信息
	rtIDs, err := rts.rta.GetRelationTypeIDsByKnID(ctx, knID)
	if err != nil {
		logger.Errorf("GetRelationTypeIDsByKnID error: %s", err.Error())
		span.SetStatus(codes.Error, fmt.Sprintf("Get relation type ids by kn_id[%s] error: %v", knID, err))

		return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_RelationType_InternalError_GetRelationTypesByIDsFailed).WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return rtIDs, nil
}

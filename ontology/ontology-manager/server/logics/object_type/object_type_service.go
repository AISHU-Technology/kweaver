package object_type

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
	"ontology-manager/logics/permission"
)

var (
	otServiceOnce sync.Once
	otService     interfaces.ObjectTypeService
)

type objectTypeService struct {
	appSetting *common.AppSetting
	db         *sql.DB
	dda        interfaces.DataModelAccess
	dva        interfaces.DataViewAccess
	mfa        interfaces.ModelFactoryAccess
	osa        interfaces.OpenSearchAccess
	ota        interfaces.ObjectTypeAccess
	uma        interfaces.UserMgmtAccess
	ps         interfaces.PermissionService
}

func NewObjectTypeService(appSetting *common.AppSetting) interfaces.ObjectTypeService {
	otServiceOnce.Do(func() {
		otService = &objectTypeService{
			appSetting: appSetting,
			db:         logics.DB,
			dda:        logics.DDA,
			dva:        logics.DVA,
			mfa:        logics.MFA,
			osa:        logics.OSA,
			ota:        logics.OTA,
			uma:        logics.UMA,
			ps:         permission.NewPermissionService(appSetting),
		}
	})
	return otService
}

func (ots *objectTypeService) CheckObjectTypeExistByID(ctx context.Context,
	knID string, otID string) (string, bool, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("校验对象类[%s]的存在性", otID))
	defer span.End()

	span.SetAttributes(attr.Key("ot_id").String(otID))

	otName, exist, err := ots.ota.CheckObjectTypeExistByID(ctx, knID, otID)
	if err != nil {
		logger.Errorf("CheckObjectTypeExistByID error: %s", err.Error())
		// 记录处理的 sql 字符串
		o11y.Error(ctx, fmt.Sprintf("在业务知识网络[%s]下按ID[%s]获取对象类失败: %v", knID, otID, err))
		span.SetStatus(codes.Error, fmt.Sprintf("在业务知识网络[%s]下按ID[%s]获取对象类失败", knID, otID))
		return "", exist, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError_CheckObjectTypeIfExistFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return otName, exist, nil
}

func (ots *objectTypeService) CheckObjectTypeExistByName(ctx context.Context,
	knID string, otName string) (string, bool, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("校验对象类[%s]的存在性", otName))
	defer span.End()

	span.SetAttributes(attr.Key("ot_name").String(otName))

	otID, exist, err := ots.ota.CheckObjectTypeExistByName(ctx, knID, otName)
	if err != nil {
		logger.Errorf("CheckObjectTypeExistByName error: %s", err.Error())
		// 记录处理的 sql 字符串
		o11y.Error(ctx, fmt.Sprintf("在业务知识网络[%s]下按名称[%s]获取对象类失败: %v", knID, otName, err))
		span.SetStatus(codes.Error, fmt.Sprintf("在业务知识网络[%s]下按名称[%s]获取对象类失败", knID, otName))
		return otID, exist, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError_CheckObjectTypeIfExistFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return otID, exist, nil
}

func (ots *objectTypeService) CreateObjectTypes(ctx context.Context, tx *sql.Tx,
	objectTypes []*interfaces.ObjectType, mode string) ([]string, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "Create object type")
	defer span.End()

	// 判断userid是否有修改业务知识网络的权限
	err := ots.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   objectTypes[0].KNID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return []string{}, err
	}

	currentTime := time.Now().UnixMilli()
	for _, ot := range objectTypes {
		// 若提交的模型id为空，生成分布式ID
		if ot.OTID == "" {
			ot.OTID = xid.New().String()
		}

		accountInfo := interfaces.AccountInfo{}
		if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
			accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
		}
		ot.Creator = accountInfo
		ot.Updater = accountInfo

		ot.CreateTime = currentTime
		ot.UpdateTime = currentTime

		// todo: 处理版本
	}

	// 0. 开始事务
	if tx == nil {
		tx, err = ots.db.Begin()
		if err != nil {
			logger.Errorf("Begin transaction error: %s", err.Error())
			span.SetStatus(codes.Error, "事务开启失败")
			o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))
			return []string{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_ObjectType_InternalError_BeginTransactionFailed).
				WithErrorDetails(err.Error())
		}
		// 0.1 异常时
		defer func() {
			switch err {
			case nil:
				// 提交事务
				err = tx.Commit()
				if err != nil {
					logger.Errorf("CreateObjectType Transaction Commit Failed:%v", err)
					span.SetStatus(codes.Error, "提交事务失败")
					o11y.Error(ctx, fmt.Sprintf("CreateObjectType Transaction Commit Failed: %s", err.Error()))
					return
				}
				logger.Infof("CreateObjectType Transaction Commit Success")
				o11y.Debug(ctx, "CreateObjectType Transaction Commit Success")
			default:
				rollbackErr := tx.Rollback()
				if rollbackErr != nil {
					logger.Errorf("CreateObjectType Transaction Rollback Error:%v", rollbackErr)
					span.SetStatus(codes.Error, "事务回滚失败")
					o11y.Error(ctx, fmt.Sprintf("CreateObjectType Transaction Rollback Error: %s", err.Error()))
				}
			}
		}()
	}

	createObjectTypes, updateObjectTypes, err := ots.handleObjectTypeImportMode(ctx, mode, objectTypes)
	if err != nil {
		return []string{}, err
	}

	// 更新
	for _, objectType := range updateObjectTypes {
		// todo: 提交的已存在，需要更新，则版本号+1
		err = ots.UpdateObjectType(ctx, tx, objectType)
		if err != nil {
			return []string{}, err
		}
	}

	// 创建
	otIDs := []string{}
	for _, objectType := range createObjectTypes {
		otIDs = append(otIDs, objectType.OTID)
		err = ots.ota.CreateObjectType(ctx, tx, objectType)
		if err != nil {
			logger.Errorf("CreateObjectType error: %s", err.Error())
			span.SetStatus(codes.Error, "创建对象类失败")

			return []string{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_ObjectType_InternalError).
				WithErrorDetails(err.Error())
		}
	}

	err = ots.InsertOpenSearchData(ctx, objectTypes)
	if err != nil {
		logger.Errorf("insertOpenSearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "对象类索引写入失败")

		return []string{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError_InsertOpenSearchDataFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return otIDs, nil
}

func (ots *objectTypeService) ListObjectTypes(ctx context.Context,
	query interfaces.ObjectTypesQueryParams) ([]*interfaces.ObjectType, int, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "查询对象类列表")
	defer span.End()

	// 判断userid是否有查看业务知识网络的权限
	err := ots.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   query.KNID,
	}, []string{interfaces.OPERATION_TYPE_VIEW_DETAIL})
	if err != nil {
		return []*interfaces.ObjectType{}, 0, err
	}

	//获取对象类列表
	objectTypes, err := ots.ota.ListObjectTypes(ctx, query)
	if err != nil {
		logger.Errorf("ListObjectTypes error: %s", err.Error())
		span.SetStatus(codes.Error, "List object types error")

		return []*interfaces.ObjectType{}, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError).WithErrorDetails(err.Error())
	}
	if len(objectTypes) == 0 {
		span.SetStatus(codes.Ok, "")
		return objectTypes, 0, nil
	}

	// limit = -1,则返回所有
	if query.Limit == -1 {
		span.SetStatus(codes.Ok, "")
		return objectTypes, len(objectTypes), nil
	}
	// 分页
	// 检查起始位置是否越界
	if query.Offset < 0 || query.Offset >= len(objectTypes) {
		span.SetStatus(codes.Ok, "")
		return []*interfaces.ObjectType{}, 0, nil
	}
	// 计算结束位置
	end := query.Offset + query.Limit
	if end > len(objectTypes) {
		end = len(objectTypes)
	}

	total := len(objectTypes)
	objectTypes = objectTypes[query.Offset:end]

	userIDsMap := make(map[string]interfaces.AccountInfo)
	for _, ot := range objectTypes {
		userIDsMap[ot.Creator.ID] = ot.Creator
		userIDsMap[ot.Updater.ID] = ot.Updater
	}

	userIDs := make([]string, 0, len(userIDsMap))
	for userID := range userIDsMap {
		userIDs = append(userIDs, userID)
	}

	userNames, err := ots.uma.GetUserNames(ctx, userIDs)
	if err != nil {
		span.SetStatus(codes.Error, "GetUserNames error")

		return []*interfaces.ObjectType{}, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError).WithErrorDetails(err.Error())
	}

	for _, ot := range objectTypes {
		if userName, exist := userNames[ot.Creator.ID]; exist {
			ot.Creator.Name = userName
		} else {
			ot.Creator.Name = "-"
		}
		if userName, exist := userNames[ot.Updater.ID]; exist {
			ot.Updater.Name = userName
		} else {
			ot.Updater.Name = "-"
		}

		if ot.DataSource != nil && ot.DataSource.ID != "" {
			dataView, err := ots.dva.GetDataViewByID(ctx, ot.DataSource.ID)
			if err != nil {
				return []*interfaces.ObjectType{}, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_ObjectType_InternalError_GetDataViewByIDFailed).
					WithErrorDetails(err.Error())
			}
			if dataView == nil {
				o11y.Warn(ctx, fmt.Sprintf("Object type [%s]'s Data view %s not found", ot.OTID, ot.DataSource.ID))
			} else {
				// 翻译数据属性映射的字段显示名
				for j, prop := range ot.DataProperties {
					if field, exists := dataView.FieldsMap[prop.MappedField.Name]; exists {
						ot.DataProperties[j].MappedField.DisplayName = field.DisplayName
						ot.DataProperties[j].MappedField.Type = field.Type
					}
					// 字符串类型的属性支持的操作符返回
					ot.DataProperties[j].ConditionOperations = ots.processConditionOperations(*ot, prop, dataView)
				}
			}
		}
	}

	span.SetStatus(codes.Ok, "")
	return objectTypes, total, nil
}

func (ots *objectTypeService) GetObjectTypes(ctx context.Context,
	knID string, otIDs []string) ([]*interfaces.ObjectType, error) {
	// 获取对象类
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("查询对象类[%s]信息", otIDs))
	defer span.End()

	span.SetAttributes(attr.Key("kn_id").String(knID),
		attr.Key("ot_ids").String(fmt.Sprintf("%v", otIDs)))

	// 判断userid是否有查看业务知识网络的权限
	err := ots.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_VIEW_DETAIL})
	if err != nil {
		return []*interfaces.ObjectType{}, err
	}

	// id去重后再查
	otIDs = common.DuplicateSlice(otIDs)

	// 获取对象类基本信息
	objectTypes, err := ots.ota.GetObjectTypesByIDs(ctx, knID, otIDs)
	if err != nil {
		logger.Errorf("GetObjectTypesByObjectTypeIDs error: %s", err.Error())
		span.SetStatus(codes.Error, fmt.Sprintf("Get object types[%s] error: %v", otIDs, err))

		return []*interfaces.ObjectType{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError_GetObjectTypesByIDsFailed).WithErrorDetails(err.Error())
	}

	if len(objectTypes) != len(otIDs) {
		errStr := fmt.Sprintf("Exists any object types not found, expect object types nums is [%d], actual object types num is [%d]", len(otIDs), len(objectTypes))
		logger.Errorf(errStr)
		span.SetStatus(codes.Error, errStr)

		return []*interfaces.ObjectType{}, rest.NewHTTPError(ctx, http.StatusNotFound,
			oerrors.OntologyManager_ObjectType_ObjectTypeNotFound).WithErrorDetails(errStr)
	}

	// 数据视图不为空时，需要把id转成名称
	// 请求视图
	for _, ot := range objectTypes {
		if ot.DataSource != nil && ot.DataSource.ID != "" {
			dataView, err := ots.dva.GetDataViewByID(ctx, ot.DataSource.ID)
			if err != nil {
				return []*interfaces.ObjectType{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_ObjectType_InternalError_GetDataViewByIDFailed).
					WithErrorDetails(err.Error())
			}
			if dataView == nil {
				o11y.Warn(ctx, fmt.Sprintf("Object type [%s]'s Data view %s not found", ot.OTID, ot.DataSource.ID))
			} else {
				ot.DataSource.Name = dataView.ViewName
				// 翻译数据属性映射的字段显示名
				for j, prop := range ot.DataProperties {
					if field, exists := dataView.FieldsMap[prop.MappedField.Name]; exists {
						ot.DataProperties[j].MappedField.DisplayName = field.DisplayName
						ot.DataProperties[j].MappedField.Type = field.Type
					}
					// 字符串类型的属性支持的操作符返回
					ot.DataProperties[j].ConditionOperations = ots.processConditionOperations(*ot, prop, dataView)
				}
			}

			// 逻辑属性，资源id转名称
			for j, logicProp := range ot.LogicProperties {
				switch logicProp.Type {
				case interfaces.LOGIC_PROPERTY_TYPE_METRIC:
					if logicProp.DataSource != nil && logicProp.DataSource.ID != "" {
						// 获取指标模型名称
						model, err := ots.dda.GetMetricModelByID(ctx, logicProp.DataSource.ID)
						if err != nil {
							return []*interfaces.ObjectType{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
								oerrors.OntologyManager_ObjectType_InternalError_GetMetricModelByIDFailed).
								WithErrorDetails(err.Error())
						}
						if model == nil {
							o11y.Warn(ctx, fmt.Sprintf("Object type [%s]'s logic property [%s] metric model [%s] not found",
								ot.OTID, logicProp.Name, ot.DataSource.ID))
						} else {
							ot.LogicProperties[j].DataSource.Name = model.ModelName
						}
					}
				case interfaces.LOGIC_PROPERTY_TYPE_OPERATOR:
					//todo: 算子的名称,前端翻译
				}
				// todo: 处理动态参数,动态参数统一放在一个新字段上,供统一召回的大模型使用(检索那边也需要处理一下)
			}
		}
	}

	span.SetStatus(codes.Ok, "")
	return objectTypes, nil
}

// 更新对象类
func (ots *objectTypeService) UpdateObjectType(ctx context.Context,
	tx *sql.Tx, objectType *interfaces.ObjectType) error {

	ctx, span := ar_trace.Tracer.Start(ctx, "Update object type")
	defer span.End()

	span.SetAttributes(
		attr.Key("ot_id").String(objectType.OTID),
		attr.Key("ot_name").String(objectType.OTName))

	// 判断userid是否有修改业务知识网络的权限
	err := ots.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   objectType.KNID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return err
	}

	// 校验数据属性
	for _, prop := range objectType.DataProperties {
		if prop.IndexConfig != nil && prop.IndexConfig.VectorConfig.Enabled {
			model, err := ots.mfa.GetModelByID(ctx, prop.IndexConfig.VectorConfig.ModelID)
			if err != nil {
				return rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_ObjectType_InternalError_GetSmallModelByIDFailed).
					WithErrorDetails(err.Error())
			}
			if model == nil {
				return rest.NewHTTPError(ctx, http.StatusNotFound,
					oerrors.OntologyManager_ObjectType_SmallModelNotFound).
					WithErrorDetails(fmt.Sprintf("model %s not found", prop.IndexConfig.VectorConfig.ModelID))
			}
			if model.ModelType != interfaces.SMALL_MODEL_TYPE_EMBEDDING {
				return rest.NewHTTPError(ctx, http.StatusBadRequest,
					oerrors.OntologyManager_ObjectType_InvalidParameter_SmallModel).
					WithErrorDetails(fmt.Sprintf("model type %s is not %s model", model.ModelType, interfaces.SMALL_MODEL_TYPE_EMBEDDING))
			}
			if model.EmbeddingDim == 0 || model.BatchSize == 0 || model.MaxTokens == 0 {
				return rest.NewHTTPError(ctx, http.StatusBadRequest,
					oerrors.OntologyManager_ObjectType_InvalidParameter_SmallModel).
					WithErrorDetails(fmt.Sprintf("model %s has invalid embedding dim, batch size or max tokens", model.ModelID))
			}
		}
	}

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	objectType.Updater = accountInfo

	currentTime := time.Now().UnixMilli() // 对象类的update_time是int类型
	objectType.UpdateTime = currentTime

	if tx == nil {
		// 0. 开始事务
		tx, err = ots.db.Begin()
		if err != nil {
			logger.Errorf("Begin transaction error: %s", err.Error())
			span.SetStatus(codes.Error, "事务开启失败")
			o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

			return rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_ObjectType_InternalError_BeginTransactionFailed).
				WithErrorDetails(err.Error())
		}
		// 0.1 异常时
		defer func() {
			switch err {
			case nil:
				// 提交事务
				err = tx.Commit()
				if err != nil {
					logger.Errorf("UpdateObjectType Transaction Commit Failed:%v", err)
					span.SetStatus(codes.Error, "提交事务失败")
					o11y.Error(ctx, fmt.Sprintf("UpdateObjectType Transaction Commit Failed: %s", err.Error()))
				}
				logger.Infof("UpdateObjectType Transaction Commit Success:%v", objectType.OTName)
				o11y.Debug(ctx, fmt.Sprintf("UpdateObjectType Transaction Commit Success: %s", objectType.OTName))
			default:
				rollbackErr := tx.Rollback()
				if rollbackErr != nil {
					logger.Errorf("UpdateObjectType Transaction Rollback Error:%v", rollbackErr)
					span.SetStatus(codes.Error, "事务回滚失败")
					o11y.Error(ctx, fmt.Sprintf("UpdateObjectType Transaction Rollback Error: %s", rollbackErr.Error()))
				}
			}
		}()
	}

	// 更新模型信息
	err = ots.ota.UpdateObjectType(ctx, tx, objectType)
	if err != nil {
		logger.Errorf("UpdateObjectType error: %s", err.Error())
		span.SetStatus(codes.Error, "修改对象类失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError).
			WithErrorDetails(err.Error())
	}

	err = ots.InsertOpenSearchData(ctx, []*interfaces.ObjectType{objectType})
	if err != nil {
		logger.Errorf("insertOpenSearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "对象类索引写入失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError_InsertOpenSearchDataFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// 更新对象类数据属性
func (ots *objectTypeService) UpdateDataProperties(ctx context.Context,
	objectType *interfaces.ObjectType, dataProperties []*interfaces.DataProperty) error {

	ctx, span := ar_trace.Tracer.Start(ctx, "Update object type")
	defer span.End()

	span.SetAttributes(
		attr.Key("ot_id").String(objectType.OTID),
		attr.Key("ot_name").String(objectType.OTName))

	// 判断userid是否有修改业务知识网络的权限
	err := ots.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   objectType.KNID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return err
	}

	// 校验数据属性
	for _, prop := range dataProperties {
		if prop.IndexConfig != nil && prop.IndexConfig.VectorConfig.Enabled {
			model, err := ots.mfa.GetModelByID(ctx, prop.IndexConfig.VectorConfig.ModelID)
			if err != nil {
				return rest.NewHTTPError(ctx, http.StatusInternalServerError,
					oerrors.OntologyManager_ObjectType_InternalError_GetSmallModelByIDFailed).
					WithErrorDetails(err.Error())
			}
			if model == nil {
				return rest.NewHTTPError(ctx, http.StatusNotFound,
					oerrors.OntologyManager_ObjectType_SmallModelNotFound).
					WithErrorDetails(fmt.Sprintf("model %s not found", prop.IndexConfig.VectorConfig.ModelID))
			}
			if model.ModelType != interfaces.SMALL_MODEL_TYPE_EMBEDDING {
				return rest.NewHTTPError(ctx, http.StatusBadRequest,
					oerrors.OntologyManager_ObjectType_InvalidParameter_SmallModel).
					WithErrorDetails(fmt.Sprintf("model type %s is not %s model", model.ModelType, interfaces.SMALL_MODEL_TYPE_EMBEDDING))
			}
			if model.EmbeddingDim == 0 || model.BatchSize == 0 || model.MaxTokens == 0 {
				return rest.NewHTTPError(ctx, http.StatusBadRequest,
					oerrors.OntologyManager_ObjectType_InvalidParameter_SmallModel).
					WithErrorDetails(fmt.Sprintf("model %s has invalid embedding dim, batch size or max tokens", model.ModelID))
			}
		}
	}

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	objectType.Updater = accountInfo
	currentTime := time.Now().UnixMilli() // 对象类的update_time是int类型
	objectType.UpdateTime = currentTime

	propMap := map[string]int{}
	for idx, prop := range objectType.DataProperties {
		propMap[prop.Name] = idx
	}
	for _, prop := range dataProperties {
		if idx, ok := propMap[prop.Name]; ok {
			objectType.DataProperties[idx] = prop
		} else {
			objectType.DataProperties = append(objectType.DataProperties, prop)
		}
	}

	// 更新模型信息
	err = ots.ota.UpdateDataProperties(ctx, objectType)
	if err != nil {
		logger.Errorf("UpdateObjectType error: %s", err.Error())
		span.SetStatus(codes.Error, "修改对象类失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError).
			WithErrorDetails(err.Error())
	}

	err = ots.InsertOpenSearchData(ctx, []*interfaces.ObjectType{objectType})
	if err != nil {
		logger.Errorf("insertOpenSearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "对象类索引写入失败")

		return rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError_InsertOpenSearchDataFailed).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

func (ots *objectTypeService) DeleteObjectTypes(ctx context.Context, tx *sql.Tx, knID string, otIDs []string) (int64, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Delete object types")
	defer span.End()

	// 判断userid是否有修改业务知识网络的权限
	err := ots.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_MODIFY})
	if err != nil {
		return 0, err
	}

	if tx == nil {
		// 0. 开始事务
		tx, err = ots.db.Begin()
		if err != nil {
			logger.Errorf("Begin transaction error: %s", err.Error())
			span.SetStatus(codes.Error, "事务开启失败")
			o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

			return 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				oerrors.OntologyManager_ObjectType_InternalError_BeginTransactionFailed).
				WithErrorDetails(err.Error())
		}
		// 0.1 异常时
		defer func() {
			switch err {
			case nil:
				// 提交事务
				err = tx.Commit()
				if err != nil {
					logger.Errorf("DeleteObjectTypes Transaction Commit Failed:%v", err)
					span.SetStatus(codes.Error, "提交事务失败")
					o11y.Error(ctx, fmt.Sprintf("DeleteObjectTypes Transaction Commit Failed: %s", err.Error()))
				}
				logger.Infof("DeleteObjectTypes Transaction Commit Success: kn_id:%s,ot_ids:%v", knID, otIDs)
				o11y.Debug(ctx, fmt.Sprintf("DeleteObjectTypes Transaction Commit Success: kn_id:%s,ot_ids:%v", knID, otIDs))
			default:
				rollbackErr := tx.Rollback()
				if rollbackErr != nil {
					logger.Errorf("DeleteObjectTypes Transaction Rollback Error:%v", rollbackErr)
					span.SetStatus(codes.Error, "事务回滚失败")
					o11y.Error(ctx, fmt.Sprintf("DeleteObjectTypes Transaction Rollback Error: %s", rollbackErr.Error()))
				}
			}
		}()
	}

	// 删除对象类
	rowsAffect, err := ots.ota.DeleteObjectTypes(ctx, tx, knID, otIDs)
	span.SetAttributes(attr.Key("rows_affect").Int64(rowsAffect))
	if err != nil {
		logger.Errorf("DeleteObjectTypes error: %s", err.Error())
		span.SetStatus(codes.Error, "删除对象类失败")

		return rowsAffect, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError).WithErrorDetails(err.Error())
	}

	logger.Infof("DeleteObjectTypes: Rows affected is %v, request delete ObjectTypeIDs is %v!", rowsAffect, len(otIDs))
	if rowsAffect != int64(len(otIDs)) {
		logger.Warnf("Delete object types number %v not equal requerst object types number %v!", rowsAffect, len(otIDs))

		o11y.Warn(ctx, fmt.Sprintf("Delete object types number %v not equal requerst object types number %v!", rowsAffect, len(otIDs)))
	}

	for _, otID := range otIDs {
		docid := interfaces.GenerateConceptDocuemtnID(knID, interfaces.MODULE_TYPE_OBJECT_TYPE, otID, interfaces.MAIN_BRANCH)
		err = ots.osa.DeleteData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid)
		if err != nil {
			return 0, err
		}
	}

	span.SetStatus(codes.Ok, "")
	return rowsAffect, nil
}

func (ots *objectTypeService) handleObjectTypeImportMode(ctx context.Context, mode string,
	objectTypes []*interfaces.ObjectType) ([]*interfaces.ObjectType, []*interfaces.ObjectType, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "object type import mode logic")
	defer span.End()

	creates := []*interfaces.ObjectType{}
	updates := []*interfaces.ObjectType{}

	// 3. 校验 若模型的id不为空，则用请求体的id与现有模型ID的重复性
	for _, ot := range objectTypes {
		creates = append(creates, ot)
		idExist := false
		_, idExist, err := ots.CheckObjectTypeExistByID(ctx, ot.KNID, ot.OTID)
		if err != nil {
			return creates, updates, err
		}

		// 校验 请求体与现有模型名称的重复性
		existID, nameExist, err := ots.CheckObjectTypeExistByName(ctx, ot.KNID, ot.OTName)
		if err != nil {
			return creates, updates, err
		}

		// 根据mode来区别，若是ignore，就从结果集中忽略，若是overwrite，就调用update，若是normal就报错。
		if idExist || nameExist {
			switch mode {
			case interfaces.ImportMode_Normal:
				if idExist {
					errDetails := fmt.Sprintf("The object type with id [%s] already exists!", ot.OTID)
					logger.Error(errDetails)
					span.SetStatus(codes.Error, errDetails)
					return creates, updates, rest.NewHTTPError(ctx, http.StatusBadRequest,
						oerrors.OntologyManager_ObjectType_ObjectTypeIDExisted).
						WithErrorDetails(errDetails)
				}

				if nameExist {
					errDetails := fmt.Sprintf("object type name '%s' already exists", ot.OTName)
					logger.Error(errDetails)
					span.SetStatus(codes.Error, errDetails)
					return creates, updates, rest.NewHTTPError(ctx, http.StatusForbidden,
						oerrors.OntologyManager_ObjectType_ObjectTypeNameExisted).
						WithDescription(map[string]any{"name": ot.OTName}).
						WithErrorDetails(errDetails)
				}

			case interfaces.ImportMode_Ignore:
				// 存在重复的就跳过
				// 从create数组中删除
				creates = creates[:len(creates)-1]
			case interfaces.ImportMode_Overwrite:
				if idExist && nameExist {
					// 如果 id 和名称都存在，但是存在的名称对应的视图 id 和当前视图 id 不一样，则报错
					if existID != ot.OTID {
						errDetails := fmt.Sprintf("ObjectType ID '%s' and name '%s' already exist, but the exist object type id is '%s'",
							ot.OTID, ot.OTName, existID)
						logger.Error(errDetails)
						span.SetStatus(codes.Error, errDetails)
						return creates, updates, rest.NewHTTPError(ctx, http.StatusForbidden,
							oerrors.OntologyManager_ObjectType_ObjectTypeNameExisted).
							WithErrorDetails(errDetails)
					} else {
						// 如果 id 和名称、度量名称都存在，存在的名称对应的模型 id 和当前模型 id 一样，则覆盖更新
						// 从create数组中删除, 放到更新数组中
						creates = creates[:len(creates)-1]
						updates = append(updates, ot)
					}
				}

				// id 已存在，且名称不存在，覆盖更新
				if idExist && !nameExist {
					// 从create数组中删除, 放到更新数组中
					creates = creates[:len(creates)-1]
					updates = append(updates, ot)
				}

				// 如果 id 不存在，name 存在，报错
				if !idExist && nameExist {
					errDetails := fmt.Sprintf("ObjectType ID '%s' does not exist, but name '%s' already exists",
						ot.OTID, ot.OTName)
					logger.Error(errDetails)
					span.SetStatus(codes.Error, errDetails)
					return creates, updates, rest.NewHTTPError(ctx, http.StatusForbidden,
						oerrors.OntologyManager_ObjectType_ObjectTypeNameExisted).
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

// 内部使用，无需校验权限
func (ots *objectTypeService) GetObjectTypesMapByIDs(ctx context.Context, knID string,
	otIDs []string, needPropMap bool) (map[string]*interfaces.ObjectType, error) {
	// 获取对象类
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("查询对象类[%v]信息", otIDs))
	defer span.End()

	span.SetAttributes(attr.Key("kn_id").String(knID),
		attr.Key("ot_ids").String(fmt.Sprintf("%v", otIDs)))

	// 判断userid是否有修改业务知识网络的权限
	err := ots.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_VIEW_DETAIL})
	if err != nil {
		return map[string]*interfaces.ObjectType{}, err
	}

	// id去重后再查
	otIDs = common.DuplicateSlice(otIDs)

	// 获取模型基本信息
	objectTypeArr, err := ots.ota.GetObjectTypesByIDs(ctx, knID, otIDs)
	if err != nil {
		logger.Errorf("GetObjectTypesByObjectTypeIDs error: %s", err.Error())
		span.SetStatus(codes.Error, fmt.Sprintf("Get object type[%v] error: %v", otIDs, err))
		return map[string]*interfaces.ObjectType{}, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError_GetObjectTypesByIDsFailed).
			WithErrorDetails(err.Error())
	}

	objectTypeMap := map[string]*interfaces.ObjectType{}
	for _, object := range objectTypeArr {
		if needPropMap {
			propMap := map[string]string{}
			for _, prop := range object.DataProperties {
				propMap[prop.Name] = prop.DisplayName
			}
			object.PropertyMap = propMap
		}
		objectTypeMap[object.OTID] = object
	}

	span.SetStatus(codes.Ok, "")
	return objectTypeMap, nil
}

func (ots *objectTypeService) InsertOpenSearchData(ctx context.Context, objectTypes []*interfaces.ObjectType) error {
	ctx, span := ar_trace.Tracer.Start(ctx, "对象类索引写入")
	defer span.End()

	if ots.appSetting.ServerSetting.DefaultSmallModelEnabled {

		words := []string{}
		for _, ot := range objectTypes {
			arr := []string{ot.OTName}
			arr = append(arr, ot.Tags...)
			arr = append(arr, ot.Comment, ot.Detail)
			word := strings.Join(arr, "\n")
			words = append(words, word)
		}

		dftModel, err := ots.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			span.SetStatus(codes.Error, "获取默认模型失败")
			return err
		}
		vectors, err := ots.mfa.GetVector(ctx, dftModel, words)
		if err != nil {
			logger.Errorf("GetVector error: %s", err.Error())
			span.SetStatus(codes.Error, "获取业务知识网络向量失败")
			return err
		}

		if len(vectors) != len(objectTypes) {
			logger.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(objectTypes), len(vectors))
			span.SetStatus(codes.Error, "获取业务知识网络向量失败")
			return fmt.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(objectTypes), len(vectors))
		}

		for i, ot := range objectTypes {
			ot.Vector = vectors[i].Vector
		}
	}

	for _, ot := range objectTypes {
		docid := interfaces.GenerateConceptDocuemtnID(ot.KNID, interfaces.MODULE_TYPE_OBJECT_TYPE,
			ot.OTID, ot.Branch)
		ot.ModuleType = interfaces.MODULE_TYPE_OBJECT_TYPE

		err := ots.osa.InsertData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid, ot)
		if err != nil {
			logger.Errorf("InsertData error: %s", err.Error())
			span.SetStatus(codes.Error, "对象类概念索引写入失败")
			return err
		}
	}
	return nil
}

// type vectorFunc func(ctx context.Context, words []string) ([]cond.VectorResp, error)

func (ots *objectTypeService) SearchObjectTypes(ctx context.Context,
	query *interfaces.ConceptsQuery) (interfaces.ObjectTypes, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "业务知识网络对象类检索")
	defer span.End()

	response := interfaces.ObjectTypes{}
	// 构造 DSL 过滤条件
	condtion, err := cond.NewCondition(ctx, query.ActualCondition, 1, interfaces.CONCPET_QUERY_FIELD)
	if err != nil {
		return response, rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_ObjectType_InvalidParameter_ConceptCondition).
			WithErrorDetails(fmt.Sprintf("failed to new condition, %s", err.Error()))
	}

	// 转换到dsl
	conditionDslStr, err := condtion.Convert(ctx, func(ctx context.Context, words []string) ([]cond.VectorResp, error) {
		if !ots.appSetting.ServerSetting.DefaultSmallModelEnabled {
			err = errors.New("DefaultSmallModelEnabled is false, does not support knn condition")
			span.SetStatus(codes.Error, err.Error())
			return nil, err
		}
		dftModel, err := ots.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			span.SetStatus(codes.Error, "获取默认模型失败")
			return nil, err
		}
		return ots.mfa.GetVector(ctx, dftModel, words)
	})
	if err != nil {
		return response, rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_ObjectType_InvalidParameter_ConceptCondition).
			WithErrorDetails(fmt.Sprintf("failed to convert condition to dsl, %s", err.Error()))
	}

	dsl, err := logics.BuildDslQuery(ctx, conditionDslStr, query)
	if err != nil {
		return response, err
	}

	// 请求opensearch
	result, err := ots.osa.SearchData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, dsl)
	if err != nil {
		logger.Errorf("SearchData error: %s", err.Error())
		span.SetStatus(codes.Error, "业务知识网络对象类检索失败")
		return response, err
	}

	// 根据NeedTotal参数决定是否查询total
	if query.NeedTotal {
		total, err := ots.GetTotal(ctx, dsl)
		if err != nil {
			return response, err
		}
		response.TotalCount = total
	}

	// 解析结果，转结构
	objectTypes := []*interfaces.ObjectType{}
	for _, concept := range result {
		// 转成 object type 的 struct
		jsonByte, err := json.Marshal(concept.Source)
		if err != nil {
			return response, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_InternalError_MarshalDataFailed).
				WithErrorDetails(fmt.Sprintf("failed to Marshal opensearch hit _source, %s", err.Error()))
		}
		var objectType interfaces.ObjectType
		err = json.Unmarshal(jsonByte, &objectType)
		if err != nil {
			return response, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_InternalError_UnMarshalDataFailed).
				WithErrorDetails(fmt.Sprintf("failed to Unmarshal opensearch hit _source to Object Type, %s", err.Error()))
		}

		objectType.Score = &concept.Score
		objectType.Vector = nil

		// 查视图组装 ops. 不需要组装,因为保存的时候会保存进去
		if objectType.DataSource != nil && objectType.DataSource.ID != "" {
			dataView, err := ots.dva.GetDataViewByID(ctx, objectType.DataSource.ID)
			if err != nil || dataView == nil {
				o11y.Warn(ctx, fmt.Sprintf("Object type [%s]'s Data view %s not found", objectType.OTID, objectType.DataSource.ID))
			} else {
				// 视图不为空，则把支持的操作符返回
				for j, prop := range objectType.DataProperties {
					if field, exists := dataView.FieldsMap[prop.MappedField.Name]; exists {
						objectType.DataProperties[j].MappedField.DisplayName = field.DisplayName
						objectType.DataProperties[j].MappedField.Type = field.Type
					}
					// 字符串类型的属性支持的操作符返回
					objectType.DataProperties[j].ConditionOperations = ots.processConditionOperations(objectType, prop, dataView)
				}
			}
		}

		objectTypes = append(objectTypes, &objectType)
	}
	response.Entries = objectTypes

	var searchAfter []any
	if len(result) > 0 {
		searchAfter = result[len(result)-1].Sort
	} else {
		searchAfter = nil
	}
	response.SearchAfter = searchAfter

	return response, nil
}

func (ots *objectTypeService) GetTotal(ctx context.Context, dsl map[string]any) (total int64, err error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "logic layer: search object type total ")
	defer span.End()

	// delete(dsl, "pit")
	delete(dsl, "from")
	delete(dsl, "size")
	delete(dsl, "sort")
	totalBytes, err := ots.osa.Count(ctx, interfaces.KN_CONCEPT_INDEX_NAME, dsl)
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
func (ots *objectTypeService) GetObjectTypeIDsByKnID(ctx context.Context, knID string) ([]string, error) {
	// 获取对象类
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("按kn_id[%s]获取对象类IDs", knID))
	defer span.End()

	span.SetAttributes(attr.Key("kn_id").String(knID))

	// 获取对象类基本信息
	otIDs, err := ots.ota.GetObjectTypeIDsByKnID(ctx, knID)
	if err != nil {
		logger.Errorf("GetObjectTypeIDsByKnID error: %s", err.Error())
		span.SetStatus(codes.Error, fmt.Sprintf("Get object type ids by kn_id[%s] error: %v", knID, err))

		return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError_GetObjectTypesByIDsFailed).WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return otIDs, nil
}

func (ots *objectTypeService) GetSimpleObjectTypeByKnID(ctx context.Context, knID string) ([]*interfaces.SimpleObjectType, error) {
	// 获取对象类
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("按kn_id[%s]获取对象类基本信息", knID))
	defer span.End()

	span.SetAttributes(attr.Key("kn_id").String(knID))

	// 获取对象类基本信息
	objectTypes, err := ots.ota.GetSimpleObjectTypeByKnID(ctx, knID)
	if err != nil {
		logger.Errorf("GetSimpleObjectTypeByKnID error: %s", err.Error())
		span.SetStatus(codes.Error, fmt.Sprintf("Get simple object type by kn_id[%s] error: %v", knID, err))

		return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError_GetObjectTypesByIDsFailed).WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return objectTypes, nil
}

// 内部接口，不检查权限
func (ots *objectTypeService) GetObjectTypeByID(ctx context.Context, knID string, otID string) (*interfaces.ObjectType, error) {
	// 获取对象类
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("查询对象类[%s]信息", otID))
	defer span.End()

	span.SetAttributes(
		attr.Key("kn_id").String(knID),
		attr.Key("ot_id").String(otID))

	// 获取对象类基本信息
	objectType, err := ots.ota.GetObjectTypeByID(ctx, knID, otID)
	if err != nil {
		logger.Errorf("GetObjectTypeByID error: %s", err.Error())
		span.SetStatus(codes.Error, fmt.Sprintf("Get object type by id[%s] error: %v", otID, err))

		return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_ObjectType_InternalError_GetObjectTypeByIDFailed).WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return objectType, nil
}

// 处理字符串类型的操作符
func (ots *objectTypeService) processConditionOperations(objectType interfaces.ObjectType, prop *interfaces.DataProperty,
	dataView *interfaces.DataView) []string {

	ops := []string{}
	if !objectType.IndexAvailable {
		// 索引不可用时,按视图的字段来做,varchar是opensearch没有的,是数据库字段.keyword和text是opensearch独有的,所以按字段类型来分
		switch prop.Type {
		case "keyword":
			ops = interfaces.DSL_KEYWORD_OPS
		case "varchar", "string":
			// string的原始类型可以是keyword或者varchar,所以按视图类型来区别一下
			if dataView.QueryType == interfaces.VIEW_QueryType_DSL {
				ops = interfaces.DSL_KEYWORD_OPS
			} else {
				ops = interfaces.SQL_STRING_OPS
			}
		case "text":
			ops = interfaces.DSL_TEXT_OPS
		case "vector":
			// 小模型打开了才能支持knn操作
			if ots.appSetting.ServerSetting.DefaultSmallModelEnabled {
				ops = append(ops, cond.OperationKNN)
			}
		}
	} else {
		opMap := map[string]string{}
		// 配置了keyword索引,则可以做 == != in not_in的操作
		if prop.IndexConfig != nil && prop.IndexConfig.KeywordConfig.Enabled {
			opMap[cond.OperationEq] = cond.OperationEq
			opMap[cond.OperationNotEq] = cond.OperationNotEq
			opMap[cond.OperationIn] = cond.OperationIn
			opMap[cond.OperationNotIn] = cond.OperationNotIn
		}
		// 配置了full text索引,则可以做 == != match 的操作
		if prop.IndexConfig != nil && prop.IndexConfig.FulltextConfig.Enabled {
			opMap[cond.OperationEq] = cond.OperationEq
			opMap[cond.OperationNotEq] = cond.OperationNotEq
			opMap[cond.OperationMatch] = cond.OperationMatch
		}
		// 配置了 vector 索引, 且向量化小模型是打开的,则可以做 knn 的操作
		if prop.IndexConfig != nil && prop.IndexConfig.VectorConfig.Enabled &&
			ots.appSetting.ServerSetting.DefaultSmallModelEnabled {

			opMap[cond.OperationKNN] = cond.OperationKNN
		}

		for k := range opMap {
			ops = append(ops, k)
		}
	}
	return ops
}

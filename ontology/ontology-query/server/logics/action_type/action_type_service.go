package action_type

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/tidwall/sjson"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/exporter/v2/ar_trace"

	"ontology-query/common"
	cond "ontology-query/common/condition"
	oerrors "ontology-query/errors"
	"ontology-query/interfaces"
	"ontology-query/logics"
	"ontology-query/logics/object_type"
)

var (
	atServiceOnce sync.Once
	atService     interfaces.ActionTypeService
)

type actionTypeService struct {
	appSetting *common.AppSetting
	omAccess   interfaces.OntologyManagerAccess
	ots        interfaces.ObjectTypeService
	uAccess    interfaces.UniqueryAccess
}

func NewActionTypeService(appSetting *common.AppSetting) interfaces.ActionTypeService {
	atServiceOnce.Do(func() {
		atService = &actionTypeService{
			appSetting: appSetting,
			omAccess:   logics.OMA,
			ots:        object_type.NewObjectTypeService(appSetting),
			uAccess:    logics.UA,
		}
	})
	return atService
}

func (ats *actionTypeService) GetActionsByActionTypeID(ctx context.Context,
	query *interfaces.ActionQuery) (interfaces.Actions, error) {

	ctx, span := ar_trace.Tracer.Start(ctx, "查询行动类的行动数据")
	defer span.End()

	var resps interfaces.Actions

	// 1. 先获取行动类信息
	actionType, exists, err := ats.omAccess.GetActionType(ctx, query.KNID, query.ActionTypeID)
	if err != nil {
		logger.Errorf("Get Action Type error: %s", err.Error())

		// 添加异常时的 trace 属性
		span.SetAttributes(attribute.Key("at_id").String(query.ActionTypeID))
		span.SetStatus(codes.Error, "Get Action Type error")
		span.End()
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Get Action Type error: %v", err))

		return resps, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyQuery_ObjectType_InternalError_GetObjectTypesByIDFailed).WithErrorDetails(err.Error())
	}
	if !exists {
		logger.Debugf("Action Type %d not found!", query.ActionTypeID)

		// 添加异常时的 trace 属性
		span.SetAttributes(attribute.Key("model_id").String(query.ActionTypeID))
		span.SetStatus(codes.Error, "Action Type not found!")
		span.End()
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Action Type [%s] not found!", query.ActionTypeID))

		return resps, rest.NewHTTPError(ctx, http.StatusNotFound, oerrors.OntologyQuery_ObjectType_ObjectTypeNotFound)
	}

	// 2.根据行动条件+请求的唯一标识，去请求对象类的对象实例数据（当前行动条件只能选绑定的对象类的，不能选其他类，所以当前就直接拼，认为这些条件都在作用在这个对象类上）
	// 条件转换，唯一标识换成主键过滤，各个对象之间用or连接，主键间用and连接，然后再跟行动条件and去请求对象类的对象数据
	ukCond := logics.BuildUniqueIdentitiesCondition(query.UniqueIdentities)

	objectQueryCond := &cond.CondCfg{
		Operation: "and",
		SubConds:  []*cond.CondCfg{ukCond, &actionType.Condition},
	}

	// 3. 根据行动条件和唯一标识组成的条件检索起点对象类的对象实例
	objectQuery := &interfaces.ObjectQueryBaseOnObjectType{
		ActualCondition: objectQueryCond,
		PageQuery: interfaces.PageQuery{
			Limit:     interfaces.MAX_LIMIT, // 不限制条数，要符合条件的所有,视图最大支持1w，所以就设置1w
			NeedTotal: true,
		},
		KNID:         query.KNID,
		ObjectTypeID: actionType.ObjectTypeID,
		CommonQueryParameters: interfaces.CommonQueryParameters{
			IncludeTypeInfo:    true,
			IncludeLogicParams: query.IncludeLogicParams,
		},
	}
	objects, err := ats.ots.GetObjectsByObjectTypeID(ctx, objectQuery)
	if err != nil {
		return resps, err
	}

	// 3 获得的对象是满足条件的对象，这些对象都应该实例化为行动
	actions := []interfaces.ActionParam{}
	for _, object := range objects.Datas {
		paramsJson := "{}"
		dynamicParamsJson := "{}"
		for _, param := range actionType.Parameters {
			switch param.ValueFrom {
			case interfaces.LOGIC_PARAMS_VALUE_FROM_PROP:
				value := object[param.Value]
				paramsJson, err = sjson.Set(paramsJson, param.Name, value)
				if err != nil {
					return resps, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_InternalError_UnMarshalDataFailed).
						WithErrorDetails(fmt.Sprintf("Error setting action type[%s]'s parameter path %s: %v",
							actionType.ATName, param.Name, err.Error()))
				}
			case interfaces.LOGIC_PARAMS_VALUE_FROM_INPUT:
				dynamicParamsJson, err = sjson.Set(dynamicParamsJson, param.Name, nil)
				if err != nil {
					return resps, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_InternalError_UnMarshalDataFailed).
						WithErrorDetails(fmt.Sprintf("Error setting action type[%s]'s dynamic parameter path %s: %v",
							actionType.ATName, param.Name, err.Error()))
				}
			case interfaces.LOGIC_PARAMS_VALUE_FROM_CONST:
				paramsJson, err = sjson.Set(paramsJson, param.Name, param.Value)
				if err != nil {
					return resps, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_InternalError_UnMarshalDataFailed).
						WithErrorDetails(fmt.Sprintf("Error setting action type[%s]'s parameter path %s: %v",
							actionType.ATName, param.Name, err.Error()))
				}
			}
		}
		params := map[string]any{}
		err = json.Unmarshal([]byte(paramsJson), &params)
		if err != nil {
			return resps, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_InternalError_UnMarshalDataFailed).
				WithErrorDetails(fmt.Sprintf("failed to Unmarshal action type[%s]'s paramtersJson to map, %s",
					actionType.ATName, err.Error()))
		}

		dynamicParams := map[string]any{}
		err = json.Unmarshal([]byte(dynamicParamsJson), &dynamicParams)
		if err != nil {
			return resps, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_InternalError_UnMarshalDataFailed).
				WithErrorDetails(fmt.Sprintf("failed to Unmarshal action type[%s]'s dynamicParamsJson to map, %s",
					actionType.ATName, err.Error()))
		}

		actions = append(actions, interfaces.ActionParam{
			Parameters:    params,
			DynamicParams: dynamicParams,
		})
	}

	return interfaces.Actions{
		ActionType:   &actionType,
		ActionSource: actionType.ActionSource,
		Actions:      actions,
		TotalCount:   len(actions),
	}, nil
}

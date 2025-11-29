package drivenadapters

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/exporter/v2/ar_trace"
	"github.com/bytedance/sonic"
	"go.opentelemetry.io/otel/trace"

	"ontology-query/common"
	"ontology-query/interfaces"
)

var (
	omAccessOnce sync.Once
	omAccess     interfaces.OntologyManagerAccess
)

type ontologyManagerAccess struct {
	appSetting         *common.AppSetting
	ontologyManagerUrl string
	httpClient         rest.HTTPClient
}

func NewOntologyManagerAccess(appSetting *common.AppSetting) interfaces.OntologyManagerAccess {
	omAccessOnce.Do(func() {
		omAccess = &ontologyManagerAccess{
			appSetting:         appSetting,
			ontologyManagerUrl: appSetting.OntologyManagerUrl,
			httpClient:         common.NewHTTPClient(),
		}
	})
	return omAccess
}

// 获取对象类信息
func (oma *ontologyManagerAccess) GetObjectType(ctx context.Context, knID string, otID string) (interfaces.ObjectType, bool, error) {
	httpUrl := fmt.Sprintf("%s/%s/object-types/%s", oma.ontologyManagerUrl, knID, otID)
	// http client 发送请求时，在 RoundTrip 时是用 transport 在 RoundTrip，此时的 transport 是 otelhttp.NewTransport 的，
	// otelhttp.NewTransport 的 RoundTrip 时会对 propagator 做 inject, 即 t.propagators.Inject
	ctx, span := ar_trace.Tracer.Start(ctx, "请求 ontology-manager 获取对象类信息", trace.WithSpanKind(trace.SpanKindClient))
	o11y.AddAttrs4InternalHttp(span, o11y.TraceAttrs{
		HttpUrl:         httpUrl,
		HttpMethod:      http.MethodGet,
		HttpContentType: rest.ContentTypeJson,
	})
	defer span.End()

	var (
		respCode int
		result   []byte
		err      error
	)

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}

	headers := map[string]string{
		interfaces.CONTENT_TYPE_NAME:        interfaces.CONTENT_TYPE_JSON,
		interfaces.HTTP_HEADER_ACCOUNT_ID:   accountInfo.ID,
		interfaces.HTTP_HEADER_ACCOUNT_TYPE: accountInfo.Type,
	}
	// httpClient 的请求新增参数支持上下文的处理请求的函数
	respCode, result, err = oma.httpClient.GetNoUnmarshal(ctx, httpUrl, nil, headers)

	var emptyObjectType interfaces.ObjectType
	if err != nil {
		logger.Errorf("get request method failed: %v", err)
		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Http Get Failed")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Get object type request failed: %v", err))

		return emptyObjectType, false, fmt.Errorf("get request method failed: %v", err)
	}

	if respCode == http.StatusNotFound {
		logger.Errorf("object type %s not exists", otID)

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Ok(span, respCode)
		// 记录模型不存在的日志
		o11y.Warn(ctx, fmt.Sprintf("Metric model [%s] not found", otID))

		return emptyObjectType, false, nil
	}

	if respCode != http.StatusOK {
		logger.Errorf("get object type failed: %v", result)

		var baseError rest.BaseError
		if err = sonic.Unmarshal(result, &baseError); err != nil {
			logger.Errorf("unmalshal BaesError failed: %v\n", err)

			// 添加异常时的 trace 属性
			o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Unmalshal BaesError failed")
			// 记录异常日志
			o11y.Error(ctx, fmt.Sprintf("Unmalshal BaesError failed: %v", err))

			return emptyObjectType, false, err
		}
		httpErr := &rest.HTTPError{HTTPCode: respCode, BaseError: baseError}

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Http status is not 200")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Get object type failed: %v", httpErr))

		return emptyObjectType, false, fmt.Errorf("get object type failed: %v", httpErr.Error())
	}

	if result == nil {
		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Ok(span, respCode)
		// 记录模型不存在的日志
		o11y.Warn(ctx, "Http response body is null")

		return emptyObjectType, false, nil
	}

	// 处理返回结果 result
	var objectTypes []interfaces.ObjectType
	if err = sonic.Unmarshal(result, &objectTypes); err != nil {
		logger.Errorf("unmalshal object type info failed: %v\n", err)

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Unmalshal object type info failed")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Unmalshal object type info failed: %v", err))

		return emptyObjectType, false, err
	}

	if len(objectTypes) == 0 {
		return emptyObjectType, false, nil
	}

	// 添加成功时的 trace 属性
	o11y.AddHttpAttrs4Ok(span, respCode)

	return objectTypes[0], true, nil
}

func (oma *ontologyManagerAccess) GetRelationTypePathsBaseOnSource(ctx context.Context, knID string,
	query interfaces.PathsQueryBaseOnSource) ([]interfaces.RelationTypePath, error) {

	url := fmt.Sprintf("%s/%s/relation-type-paths", oma.ontologyManagerUrl, knID)

	ctx, span := ar_trace.Tracer.Start(ctx, "请求 ontology-manager 获取关系类路径信息", trace.WithSpanKind(trace.SpanKindClient))
	o11y.AddAttrs4InternalHttp(span, o11y.TraceAttrs{
		HttpUrl:         url,
		HttpMethod:      http.MethodPost,
		HttpContentType: rest.ContentTypeJson,
	})
	defer span.End()

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}

	headers := map[string]string{
		interfaces.CONTENT_TYPE_NAME:           interfaces.CONTENT_TYPE_JSON,
		interfaces.HTTP_HEADER_METHOD_OVERRIDE: http.MethodGet,
		interfaces.HTTP_HEADER_ACCOUNT_ID:      accountInfo.ID,
		interfaces.HTTP_HEADER_ACCOUNT_TYPE:    accountInfo.Type,
	}

	start := time.Now().UnixMilli()
	respCode, result, err := oma.httpClient.PostNoUnmarshal(ctx, url, headers, query)
	logger.Debugf("post [%s] with headers[%v] finished, request is [%v] response code is [%d],  error is [%v], 耗时: %dms",
		url, headers, query, respCode, err, time.Now().UnixMilli()-start)

	if err != nil {
		logger.Errorf("get request method failed: %v", err)
		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Http Get Failed")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Get relation type paths request failed: %v", err))

		return nil, fmt.Errorf("get request method failed: %v", err)
	}

	if respCode != http.StatusOK {
		logger.Errorf("get relation type paths failed: %v", result)

		var baseError rest.BaseError
		if err = sonic.Unmarshal(result, &baseError); err != nil {
			logger.Errorf("unmalshal BaesError failed: %v\n", err)

			// 添加异常时的 trace 属性
			o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Unmalshal BaesError failed")
			// 记录异常日志
			o11y.Error(ctx, fmt.Sprintf("Unmalshal BaesError failed: %v", err))

			return nil, err
		}

		httpErr := &rest.HTTPError{HTTPCode: respCode, BaseError: baseError}

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Http status is not 200")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Get relation type paths failed: %v", httpErr))

		return nil, fmt.Errorf("get relation type paths failed: %v", httpErr.Error())
	}

	if result == nil {
		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Ok(span, respCode)
		// 记录模型不存在的日志
		o11y.Warn(ctx, "Http response body is null")

		return nil, nil
	}

	// 处理返回结果 result
	var typePaths []interfaces.RelationTypePath
	if err = sonic.Unmarshal(result, &typePaths); err != nil {
		logger.Errorf("unmalshal object type info failed: %v\n", err)

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Unmalshal object type info failed")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Unmalshal relation type paths info failed: %v", err))

		return nil, err
	}

	if len(typePaths) == 0 {
		return nil, nil
	}

	// 对关系类的映射在这转
	for i := range typePaths {
		// 生成路径id，简单编号即可，在当前查询中唯一即可，为后续的路径配额使用
		typePaths[i].ID = i
		for j := range typePaths[i].TypeEdges {
			switch typePaths[i].TypeEdges[j].RelationType.Type {
			case interfaces.RELATION_TYPE_DIRECT:
				var directMapping []interfaces.Mapping
				jsonData, err := json.Marshal(typePaths[i].TypeEdges[j].RelationType.MappingRules)
				if err != nil {
					return nil, fmt.Errorf("derived Config Marshal error: %s", err.Error())
				}
				err = json.Unmarshal(jsonData, &directMapping)
				if err != nil {
					return nil, fmt.Errorf("derived Config Unmarshal error: %s", err.Error())
				}
				typePaths[i].TypeEdges[j].RelationType.MappingRules = directMapping
			case interfaces.RELATION_TYPE_DATA_VIEW:
				var inDirectMapping interfaces.InDirectMapping
				jsonData, err := json.Marshal(typePaths[i].TypeEdges[j].RelationType.MappingRules)
				if err != nil {
					return nil, fmt.Errorf("derived Config Marshal error: %s", err.Error())
				}
				err = json.Unmarshal(jsonData, &inDirectMapping)
				if err != nil {
					return nil, fmt.Errorf("derived Config Unmarshal error: %s", err.Error())
				}
				typePaths[i].TypeEdges[j].RelationType.MappingRules = inDirectMapping
			}
		}
	}

	// 添加成功时的 trace 属性
	o11y.AddHttpAttrs4Ok(span, respCode)

	return typePaths, nil
}

func (oma *ontologyManagerAccess) GetRelationType(ctx context.Context, knID string,
	rtID string) (interfaces.RelationType, bool, error) {

	httpUrl := fmt.Sprintf("%s/%s/relation-types/%s", oma.ontologyManagerUrl, knID, rtID)
	// http client 发送请求时，在 RoundTrip 时是用 transport 在 RoundTrip，此时的 transport 是 otelhttp.NewTransport 的，
	// otelhttp.NewTransport 的 RoundTrip 时会对 propagator 做 inject, 即 t.propagators.Inject
	ctx, span := ar_trace.Tracer.Start(ctx, "请求 ontology-manager 获取关系类信息", trace.WithSpanKind(trace.SpanKindClient))
	o11y.AddAttrs4InternalHttp(span, o11y.TraceAttrs{
		HttpUrl:         httpUrl,
		HttpMethod:      http.MethodGet,
		HttpContentType: rest.ContentTypeJson,
	})
	defer span.End()

	var (
		respCode int
		result   []byte
		err      error
	)

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}

	headers := map[string]string{
		interfaces.CONTENT_TYPE_NAME:        interfaces.CONTENT_TYPE_JSON,
		interfaces.HTTP_HEADER_ACCOUNT_ID:   accountInfo.ID,
		interfaces.HTTP_HEADER_ACCOUNT_TYPE: accountInfo.Type,
	}
	// httpClient 的请求新增参数支持上下文的处理请求的函数
	respCode, result, err = oma.httpClient.GetNoUnmarshal(ctx, httpUrl, nil, headers)

	var emptyRelationType interfaces.RelationType
	if err != nil {
		logger.Errorf("get request method failed: %v", err)
		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Http Get Failed")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Get relation type request failed: %v", err))

		return emptyRelationType, false, fmt.Errorf("get request method failed: %v", err)
	}

	if respCode == http.StatusNotFound {
		logger.Errorf("relation type %s not exists", rtID)

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Ok(span, respCode)
		// 记录模型不存在的日志
		o11y.Warn(ctx, fmt.Sprintf("relation type [%s] not found", rtID))

		return emptyRelationType, false, nil
	}

	if respCode != http.StatusOK {
		logger.Errorf("get relation type failed: %v", result)

		var baseError rest.BaseError
		if err = sonic.Unmarshal(result, &baseError); err != nil {
			logger.Errorf("unmalshal BaesError failed: %v\n", err)

			// 添加异常时的 trace 属性
			o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Unmalshal BaesError failed")
			// 记录异常日志
			o11y.Error(ctx, fmt.Sprintf("Unmalshal BaesError failed: %v", err))

			return emptyRelationType, false, err
		}

		httpErr := &rest.HTTPError{HTTPCode: respCode, BaseError: baseError}

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Http status is not 200")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Get relation type failed: %v", httpErr))

		return emptyRelationType, false, fmt.Errorf("get relation type failed: %v", httpErr.Error())
	}

	if result == nil {
		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Ok(span, respCode)
		// 记录模型不存在的日志
		o11y.Warn(ctx, "Http response body is null")

		return emptyRelationType, false, nil
	}

	// 处理返回结果 result
	var relationTypes []interfaces.RelationType
	if err = sonic.Unmarshal(result, &relationTypes); err != nil {
		logger.Errorf("unmalshal relation type info failed: %v\n", err)

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Unmalshal relation type info failed")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Unmalshal relation type info failed: %v", err))

		return emptyRelationType, false, err
	}

	if len(relationTypes) == 0 {
		return emptyRelationType, false, nil
	}

	switch relationTypes[0].Type {
	case interfaces.RELATION_TYPE_DIRECT:
		var directMapping []interfaces.Mapping
		jsonData, err := json.Marshal(relationTypes[0].MappingRules)
		if err != nil {
			return emptyRelationType, false, fmt.Errorf("derived Config Marshal error: %s", err.Error())
		}
		err = json.Unmarshal(jsonData, &directMapping)
		if err != nil {
			return emptyRelationType, false, fmt.Errorf("derived Config Unmarshal error: %s", err.Error())
		}
		relationTypes[0].MappingRules = directMapping
	case interfaces.RELATION_TYPE_DATA_VIEW:
		var inDirectMapping interfaces.InDirectMapping
		jsonData, err := json.Marshal(relationTypes[0].MappingRules)
		if err != nil {
			return emptyRelationType, false, fmt.Errorf("derived Config Marshal error: %s", err.Error())
		}
		err = json.Unmarshal(jsonData, &inDirectMapping)
		if err != nil {
			return emptyRelationType, false, fmt.Errorf("derived Config Unmarshal error: %s", err.Error())
		}
		relationTypes[0].MappingRules = inDirectMapping
	}

	// 添加成功时的 trace 属性
	o11y.AddHttpAttrs4Ok(span, respCode)

	return relationTypes[0], true, nil
}

func (oma *ontologyManagerAccess) GetActionType(ctx context.Context, knID string,
	atID string) (interfaces.ActionType, bool, error) {

	httpUrl := fmt.Sprintf("%s/%s/action-types/%s", oma.ontologyManagerUrl, knID, atID)
	// http client 发送请求时，在 RoundTrip 时是用 transport 在 RoundTrip，此时的 transport 是 otelhttp.NewTransport 的，
	// otelhttp.NewTransport 的 RoundTrip 时会对 propagator 做 inject, 即 t.propagators.Inject
	ctx, span := ar_trace.Tracer.Start(ctx, "请求 ontology-manager 获取行动类信息", trace.WithSpanKind(trace.SpanKindClient))
	o11y.AddAttrs4InternalHttp(span, o11y.TraceAttrs{
		HttpUrl:         httpUrl,
		HttpMethod:      http.MethodGet,
		HttpContentType: rest.ContentTypeJson,
	})
	defer span.End()

	var (
		respCode int
		result   []byte
		err      error
	)

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}

	headers := map[string]string{
		interfaces.CONTENT_TYPE_NAME:        interfaces.CONTENT_TYPE_JSON,
		interfaces.HTTP_HEADER_ACCOUNT_ID:   accountInfo.ID,
		interfaces.HTTP_HEADER_ACCOUNT_TYPE: accountInfo.Type,
	}
	// httpClient 的请求新增参数支持上下文的处理请求的函数
	respCode, result, err = oma.httpClient.GetNoUnmarshal(ctx, httpUrl, nil, headers)

	var emptyActionType interfaces.ActionType
	if err != nil {
		logger.Errorf("get request method failed: %v", err)
		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Http Get Failed")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Get action type request failed: %v", err))

		return emptyActionType, false, fmt.Errorf("get request method failed: %v", err)
	}

	if respCode == http.StatusNotFound {
		logger.Errorf("action type %s not exists", atID)

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Ok(span, respCode)
		// 记录模型不存在的日志
		o11y.Warn(ctx, fmt.Sprintf("action type [%s] not found", atID))

		return emptyActionType, false, nil
	}

	if respCode != http.StatusOK {
		logger.Errorf("get action type failed: %v", result)

		var baseError rest.BaseError
		if err = sonic.Unmarshal(result, &baseError); err != nil {
			logger.Errorf("unmalshal BaesError failed: %v\n", err)

			// 添加异常时的 trace 属性
			o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Unmalshal BaesError failed")
			// 记录异常日志
			o11y.Error(ctx, fmt.Sprintf("Unmalshal BaesError failed: %v", err))

			return emptyActionType, false, err
		}

		httpErr := &rest.HTTPError{HTTPCode: respCode, BaseError: baseError}

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Http status is not 200")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Get action type failed: %v", httpErr))

		return emptyActionType, false, fmt.Errorf("get action type failed: %v", httpErr.Error())
	}

	if result == nil {
		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Ok(span, respCode)
		// 记录模型不存在的日志
		o11y.Warn(ctx, "Http response body is null")

		return emptyActionType, false, nil
	}

	// 处理返回结果 result
	var actionTypes []interfaces.ActionType
	if err = sonic.Unmarshal(result, &actionTypes); err != nil {
		logger.Errorf("unmalshal action type info failed: %v\n", err)

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Unmalshal action type info failed")
		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Unmalshal action type info failed: %v", err))

		return emptyActionType, false, err
	}

	if len(actionTypes) == 0 {
		return emptyActionType, false, nil
	}

	// 添加成功时的 trace 属性
	o11y.AddHttpAttrs4Ok(span, respCode)

	return actionTypes[0], true, nil
}

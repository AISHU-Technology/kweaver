package data_model

import (
	"context"
	"fmt"
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/exporter/v2/ar_trace"
	"github.com/bytedance/sonic"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"ontology-manager/common"
	"ontology-manager/interfaces"
)

var (
	ddAccessOnce sync.Once
	ddAccess     interfaces.DataModelAccess
)

type dataModelAccess struct {
	appSetting *common.AppSetting
	httpClient rest.HTTPClient
}

func NewDataModelAccess(appSetting *common.AppSetting) interfaces.DataModelAccess {
	ddAccessOnce.Do(func() {
		ddAccess = &dataModelAccess{
			appSetting: appSetting,
			httpClient: common.NewHTTPClient(),
		}
	})
	return ddAccess
}

// 根据 id 获取指标模型
func (dda *dataModelAccess) GetMetricModelByID(ctx context.Context, id string) (*interfaces.MetricModel, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "driven layer: Get views by IDs from data-model service", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(attr.Key("model_id").String(id))

	httpUrl := fmt.Sprintf("%s/metric-models/%s", dda.appSetting.DataModelUrl, id)
	o11y.AddAttrs4InternalHttp(span, o11y.TraceAttrs{
		HttpUrl:         httpUrl,
		HttpMethod:      http.MethodGet,
		HttpContentType: rest.ContentTypeJson,
	})

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	headers := map[string]string{
		interfaces.CONTENT_TYPE_NAME:        interfaces.CONTENT_TYPE_JSON,
		"X-Language":                        rest.GetLanguageByCtx(ctx),
		interfaces.HTTP_HEADER_ACCOUNT_ID:   accountInfo.ID,
		interfaces.HTTP_HEADER_ACCOUNT_TYPE: accountInfo.Type,
	}

	respCode, respData, err := dda.httpClient.GetNoUnmarshal(ctx, httpUrl, nil, headers)
	if err != nil {
		errDetails := fmt.Sprintf("GetMetricModelByID http request failed: %s", err.Error())
		logger.Error(errDetails)
		o11y.Error(ctx, errDetails)
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Http get models failed")

		return nil, fmt.Errorf("get request method failed: %s", err)
	}

	if respCode == http.StatusNotFound {
		logger.Errorf("metric model [%s] not exists", id)

		// 添加异常时的 trace 属性
		o11y.AddHttpAttrs4Ok(span, respCode)
		// 记录模型不存在的日志
		o11y.Warn(ctx, fmt.Sprintf("metric model [%s] not found", id))

		return nil, nil
	}

	if respCode != http.StatusOK {
		logger.Errorf("get metric model failed: %s", respData)

		var baseError rest.BaseError
		if err = sonic.Unmarshal(respData, &baseError); err != nil {
			logger.Errorf("Unmalshal baesError failed: %s", err)
			o11y.Error(ctx, err.Error())
			o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Unmarshal baseError failed")
			return nil, err
		}

		o11y.Error(ctx, fmt.Sprintf("%s. %v", baseError.Description, baseError.ErrorDetails))
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Http status code is not 200")
		return nil, fmt.Errorf("GetMetricModelByID failed: %s", baseError.ErrorDetails)
	}

	var models []*interfaces.MetricModel
	if err = sonic.Unmarshal(respData, &models); err != nil {
		logger.Errorf("Unmarshal metric model failed: %s", err)
		o11y.Error(ctx, err.Error())
		o11y.AddHttpAttrs4Error(span, respCode, "InternalError", "Unmarshal metric model info failed")
		return nil, err
	}

	if len(models) == 0 {
		return nil, nil
	}

	o11y.AddHttpAttrs4Ok(span, respCode)
	return models[0], nil
}

package drivenadapters

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"

	"ontology-query/common"
	"ontology-query/interfaces"
)

var (
	uAccessOnce sync.Once
	uAccess     interfaces.UniqueryAccess
)

type uniqueryAccess struct {
	appSetting  *common.AppSetting
	uniqueryUrl string
	httpClient  rest.HTTPClient
}

func NewUniqueryAccess(appSetting *common.AppSetting) interfaces.UniqueryAccess {
	uAccessOnce.Do(func() {
		uAccess = &uniqueryAccess{
			appSetting:  appSetting,
			uniqueryUrl: appSetting.UniqueryUrl,
			httpClient:  common.NewHTTPClient(),
		}
	})

	return uAccess
}

func (ua *uniqueryAccess) GetViewDataByID(ctx context.Context, viewID string, viewRequest interfaces.ViewQuery) (interfaces.ViewData, error) {

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

	url := fmt.Sprintf("%s/data-views/%s?timeout=%s", ua.uniqueryUrl, viewID, ua.appSetting.ServerSetting.ViewDataTimeout)

	start := time.Now().UnixMilli()
	respCode, result, err := ua.httpClient.PostNoUnmarshal(ctx, url, headers, viewRequest)
	logger.Debugf("post [%s] with headers[%v] finished, request is [%v] response code is [%d],  error is [%v], 耗时: %dms",
		url, headers, viewRequest, respCode, err, time.Now().UnixMilli()-start)

	viewData := interfaces.ViewData{}

	if err != nil {
		logger.Errorf("get request method failed: %v", err)

		return viewData, fmt.Errorf("get request method failed: %v", err)
	}
	if respCode != http.StatusOK {
		// 转成 baseerror
		var baseError rest.BaseError
		if err := json.Unmarshal(result, &baseError); err != nil {
			logger.Errorf("unmalshal BaesError failed: %v\n", err)
			return viewData, err
		}
		httpErr := &rest.HTTPError{HTTPCode: respCode, BaseError: baseError}
		logger.Errorf("Formula invalid: %v", httpErr.Error())

		return viewData, fmt.Errorf("get view data %s return error %v", viewID, httpErr.Error())
	}

	if result == nil {
		return viewData, fmt.Errorf("get view data %v return null", viewID)
	}

	if err := json.Unmarshal(result, &viewData); err != nil {
		logger.Errorf("Unmarshal View Data failed, %s", err)

		return viewData, err
	}

	// 当 need_total=true && total_count > 0 && len(datas) == 0,则认为是超时没获取到数据，提示超时异常
	if viewRequest.NeedTotal && viewData.TotalCount > 0 &&
		len(viewData.Datas) == 0 && viewData.SearchAfter != nil {

		viewReqStr, _ := json.Marshal(viewRequest)
		logger.Errorf("get view[%s] data timeout, current timeout is %s, view query is [%s]",
			viewID, ua.appSetting.ServerSetting.ViewDataTimeout, viewReqStr)

		return viewData, fmt.Errorf("get view[%s] data timeout, current timeout is %s, please use search after to continue the next request",
			viewID, ua.appSetting.ServerSetting.ViewDataTimeout)
	}

	logger.Debugf("从视图[%s]中获取到的数据条数为[%d]，耗时[%d]ms", viewID, len(viewData.Datas), time.Now().UnixMilli()-start)
	return viewData, nil
}

func (ua *uniqueryAccess) GetMetricDataByID(ctx context.Context, metricID string,
	metricRequest interfaces.MetricQuery) (interfaces.MetricData, error) {

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
		interfaces.CONTENT_TYPE_NAME:           interfaces.CONTENT_TYPE_JSON,
		interfaces.HTTP_HEADER_METHOD_OVERRIDE: http.MethodGet,
		interfaces.HTTP_HEADER_ACCOUNT_ID:      accountInfo.ID,
		interfaces.HTTP_HEADER_ACCOUNT_TYPE:    accountInfo.Type,
	}

	url := fmt.Sprintf("%s/metric-models/%s?include_model=true", ua.uniqueryUrl, metricID)

	start := time.Now().UnixMilli()
	respCode, result, err = ua.httpClient.PostNoUnmarshal(ctx, url, headers, metricRequest)
	logger.Debugf("post [%s] with headers[%v] finished, request is [%v] response code is [%d],  error is [%v], 耗时: %dms",
		url, headers, metricRequest, respCode, err, time.Now().UnixMilli()-start)

	metricData := interfaces.MetricData{}

	if err != nil {
		logger.Errorf("get request method failed: %v", err)

		return metricData, fmt.Errorf("get request method failed: %v", err)
	}
	if respCode != http.StatusOK {
		// 转成 baseerror
		var baseError rest.BaseError
		if err = json.Unmarshal(result, &baseError); err != nil {
			logger.Errorf("unmalshal BaesError failed: %v\n", err)
			return metricData, err
		}
		httpErr := &rest.HTTPError{HTTPCode: respCode, BaseError: baseError}
		logger.Errorf("Formula invalid: %v", httpErr.Error())

		return metricData, fmt.Errorf("get metric model %s return error %v", metricID, httpErr.Error())
	}

	if result == nil {
		return metricData, fmt.Errorf("get metric model %v return null", metricID)
	}

	if err = json.Unmarshal(result, &metricData); err != nil {
		logger.Errorf("Unmarshal metric data failed, %s", err)

		return metricData, err
	}

	return metricData, nil
}

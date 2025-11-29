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
	aoAccessOnce sync.Once
	aoAccess     interfaces.AgentOperatorAccess
)

type agentOperatorAccess struct {
	appSetting       *common.AppSetting
	agentOperatorUrl string
	httpClient       rest.HTTPClient
}

type OperatorError struct {
	Code        string      `json:"code"`        // 错误码
	Description string      `json:"description"` // 错误描述
	Detail      interface{} `json:"detail"`      // 详细内容
	Solution    interface{} `json:"solution"`    // 错误解决方案
	Link        interface{} `json:"link"`        // 错误链接
}

func NewAgentOperatorAccess(appSetting *common.AppSetting) interfaces.AgentOperatorAccess {
	aoAccessOnce.Do(func() {
		aoAccess = &agentOperatorAccess{
			appSetting:       appSetting,
			agentOperatorUrl: appSetting.AgentOperatorUrl,
			httpClient:       common.NewHTTPClient(),
		}
	})

	return aoAccess
}

func (aoa *agentOperatorAccess) GetAgentOperatorByID(ctx context.Context,
	agentOperatorID string) (interfaces.AgentOperator, error) {

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

	// http://{host}:{port}/api/agent-operator-integration/internal-v1/operator/market/:operator_id
	url := fmt.Sprintf("%s/market/%s", aoa.agentOperatorUrl, agentOperatorID)

	start := time.Now().UnixMilli()
	respCode, result, err = aoa.httpClient.GetNoUnmarshal(ctx, url, nil, headers)
	logger.Debugf("get [%s] with headers[%v] finished, request is [%v] response code is [%d],  error is [%v], 耗时: %dms",
		url, headers, respCode, err, time.Now().UnixMilli()-start)

	operatorInfo := interfaces.AgentOperator{}

	if err != nil {
		logger.Errorf("get request method failed: %v", err)

		return operatorInfo, fmt.Errorf("get request method failed: %v", err)
	}
	if respCode != http.StatusOK {
		// 转成 baseerror
		var baseError rest.BaseError
		if err = json.Unmarshal(result, &baseError); err != nil {
			logger.Errorf("unmalshal BaesError failed: %v\n", err)
			return operatorInfo, err
		}
		httpErr := &rest.HTTPError{HTTPCode: respCode, BaseError: baseError}
		logger.Errorf("Formula invalid: %v", httpErr.Error())

		return operatorInfo, fmt.Errorf("get operator info %s return error %v", agentOperatorID, httpErr.Error())
	}

	if result == nil {
		return operatorInfo, fmt.Errorf("get operator info %v return null", agentOperatorID)
	}

	if err = json.Unmarshal(result, &operatorInfo); err != nil {
		logger.Errorf("Unmarshal operator info failed, %s", err)

		return operatorInfo, err
	}

	return operatorInfo, nil
}

type operatorExecuteResult struct {
	StatusCode int            `json:"status_code"`
	Headers    map[string]any `json:"headers"`
	Body       map[string]any `json:"body"`
	Error      string         `json:"error"`
	DurationMs int            `json:"duration_ms"`
}

// 执行算子获取结果
func (aoa *agentOperatorAccess) ExecuteOperator(ctx context.Context, agentOperatorID string,
	execRequest interfaces.OperatorExecutionRequest) (any, error) {

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
	// http://{host}:{port}/api/agent-operator-integration/internal-v1/operator/proxy/{operator_id}
	url := fmt.Sprintf("%s/proxy/%s", aoa.agentOperatorUrl, agentOperatorID)

	start := time.Now().UnixMilli()
	respCode, result, err = aoa.httpClient.PostNoUnmarshal(ctx, url, headers, execRequest)
	logger.Debugf("post [%s] with headers[%v] finished, request is [%v] response code is [%d],  error is [%v], 耗时: %dms",
		url, headers, execRequest, respCode, err, time.Now().UnixMilli()-start)

	operatorResult := operatorExecuteResult{}

	if err != nil {
		logger.Errorf("get request method failed: %v", err)

		return operatorResult, fmt.Errorf("get request method failed: %v", err)
	}
	if respCode != http.StatusOK {
		// 转成 baseerror
		var opError OperatorError
		if err = json.Unmarshal(result, &opError); err != nil {
			logger.Errorf("unmalshal OperatorError failed: %v\n", err)
			return operatorResult, err
		}
		httpErr := &rest.HTTPError{HTTPCode: respCode,
			BaseError: rest.BaseError{
				ErrorCode:    opError.Code,
				Description:  opError.Description,
				ErrorDetails: opError.Detail,
			}}
		logger.Errorf("Formula invalid: %v", httpErr.Error())

		return operatorResult, fmt.Errorf("execute operator %s return error %v", agentOperatorID, httpErr.Error())
	}

	if result == nil {
		return operatorResult, fmt.Errorf("execute operator %v return null", agentOperatorID)
	}

	if err := json.Unmarshal(result, &operatorResult); err != nil {
		logger.Errorf("Unmarshal execute operator result failed, %s", err)

		return operatorResult, err
	}

	// status_code 在100-300间才算成功
	if http.StatusContinue <= operatorResult.StatusCode &&
		operatorResult.StatusCode < http.StatusMultipleChoices {

		return operatorResult.Body, nil
	} else {
		resByte, err := json.Marshal(operatorResult)
		if err != nil {
			logger.Errorf("unmalshal OperatorError failed: %v\n", err)
			return operatorResult, err
		}

		return nil, fmt.Errorf("execute operator failed: %v", string(resByte))
	}
}

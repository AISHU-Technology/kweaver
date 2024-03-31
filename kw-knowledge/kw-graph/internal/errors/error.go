// Package errors 错误码规范声明
package errors

import (
	"fmt"
	"kw-graph/internal/types"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

const (
	// TwoNum 数字2常量
	TwoNum = 2
	// ErrServerName 服务名
	ErrServerName = "EngineServer."
	// ArgsError 请求参数错误
	ArgsError = ErrServerName + "ArgsErr"
	// PermissionNotAllowed 查询语句不支持写操作
	PermissionNotAllowed = ErrServerName + "PermissionNotAllowed"
	// StatContainsMultiple 自定义查询语句query只支持单条语句
	StatContainsMultiple = ErrServerName + "StatContainsMultiple"
	// VidLengthErr vid长度错误
	VidLengthErr = ErrServerName + "VIDLengthErr"
	// KgIDErr 图谱不存在
	KgIDErr = ErrServerName + "KgIDErr"
	// InternalErr 内部错误
	InternalErr = ErrServerName + "InternalErr"
	// OpenSearchErr 调用opensearch 出错
	OpenSearchErr = ErrServerName + "OpenSearchErr"
	// HTTPClientCallFailed  HTTPClient 调用失败
	HTTPClientCallFailed = ErrServerName + "HTTPClientCallFailed "
	// EngineCoreErr EngineCore调用失败
	AuthErr = ErrServerName + "AuthErr"
	// BuilderErr Builder调用失败
	BuilderErr = ErrServerName + "BuilderErr"
	// RBACErr RBAC调用失败
	RBACErr = ErrServerName + "RBACErr"
	// CustomSearchBatchExecErr 批量执行查询语句出错
	CustomSearchBatchExecErr = ErrServerName + "CustomSearchBatchExecErr"
	// SeachResContainsText 自定义查询包含文本信息
	SeachResContainsText = ErrServerName + "SeachResContainsText"
	// NebulaInternalServer nebula 数据库内部错误
	NebulaInternalServer = ErrServerName + "NebulaInternalServer"
	// NebulaSemanticError nebula 语义错误
	NebulaSemanticError = ErrServerName + "NebulaSemanticError"
	// NebulaSyntaxError nebula 语法错误
	NebulaSyntaxError = ErrServerName + "NebulaSyntaxError"
	// NebulaPermissionDenied nebula 权限不足
	NebulaPermissionDenied = ErrServerName + "NebulaPermissionDenied"
	// NebulaExecuteError nebula 执行错误
	NebulaExecuteError = ErrServerName + "NebulaExecuteError"
	// NebulaInvalidOperation nebula 无效的操作
	NebulaInvalidOperation = ErrServerName + "NebulaInvalidOperation"
	// NebulaInvalidSpaceVidLen nebula vid长度无效
	NebulaInvalidSpaceVidLen = ErrServerName + "NebulaInvalidSpaceVidLen"
	// NebulaAuthenticationError nebula 账户或密码错误
	NebulaAuthenticationError = ErrServerName + "NebulaAuthenticationError"
	// ResourceCreateErr 资源创建失败
	ResourceCreateErr = ErrServerName + "ResourceCreateError"
	// ResourceUpdateErr 资源更新失败
	ResourceUpdateErr = ErrServerName + "ResourceUpdateError"
	// ResourceNotFound 资源不存在
	ResourceNotFound = ErrServerName + "ResourceNotFound"
	// ResourceAlreadyExists 资源已存在
	ResourceAlreadyExists = ErrServerName + "AlreadyExists"
	// NameIncorrect 命名不合法
	NameIncorrect = ErrServerName + "NameIncorrect"
	// ServiceStatusErr 应用状态异常
	ServiceStatusErr = ErrServerName + "ServiceStatusErr"
	// DataAuthErr DataAuth调用失败
	DataAuthErr = ErrServerName + "DataAuthErr"
	// PermissionDeniedErr 权限校验失败
	PermissionDeniedErr = ErrServerName + "PermissionDeniedErr"
	// ServicePermissionDeniedErr 应用权限校验失败
	ServicePermissionDeniedErr = ErrServerName + "ServicePermissionDeniedErr"
	// GraphPermissionDeniedErr 图谱权限校验失败
	GraphPermissionDeniedErr = ErrServerName + "GraphPermissionDeniedErr"
	// GraphAnalysisSvcConfigParseErr 认知应用配置文件解析失败
	GraphAnalysisSvcConfigParseErr = ErrServerName + "GraphAnalysisSvcConfigParseErr"
	// CogServerErr cog server接口调用失败
	CogServerErr = ErrServerName + "CogServerErr"
	// ErrAdvConfNameErr 配置名称重复
	ErrAdvConfNameErr = ErrServerName + "ErrAdvConfNameErr"
	// ErrAdvSearchConfIDErr 高级搜索配置id不存在
	ErrAdvSearchConfIDErr = ErrServerName + "ErrAdvSearchConfIDErr"
	// ErrAdvSearchErr 智能搜索错误
	ErrAdvSearchErr = ErrServerName + "ErrAdvSearchErr"
	// ErrAdvConfContentErr 高级搜索配置内容错误
	ErrAdvConfContentErr = ErrServerName + "ErrAdvConfContentErr"
	// AlgServerErr alg server 接口调用失败
	AlgServerErr = ErrServerName + "AlgServerErr"
	// DuplicateApplicationNameErr 重复名称错误
	DuplicateApplicationNameErr = ErrServerName + "DuplicateApplicationNameErr"
	// ForwardErr 转发接口返回报错
	ForwardErr = ErrServerName + "ForwardErr"
)

// ErrorInfo 错误信息返回的结构
type ErrorInfo struct {
	Code    int
	Reason  string
	Message string
}

// New 初始化错误码信息
func New(code int, reason, msg string) *ErrorInfo {
	return &ErrorInfo{
		Code:    code,
		Reason:  reason,
		Message: msg,
	}
}

func (e *ErrorInfo) Error() string {
	return fmt.Sprintf("code: %d, reason: %s, msg: %s", e.Code, e.Reason, e.Message)
}

// CommonErrResponse 标准错误信息
type CommonErrResponse struct {
	Description  string
	ErrorCode    string
	Solution     string
	ErrorDetails string
}

// NebulaErrorInfo nebula错误信息
type NebulaErrorInfo struct {
	ErrorCode int    `json:"ErrorCode"`
	ErrorMsg  string `json:"ErrorMsg"`
}

var (
	// Languages 支持的语言
	Languages = [3]string{"zh_CN", "zh_TW", "en_US"}
	// ErrorI18n 错误码国际化
	ErrorI18n = map[string]map[string]string{
		InternalErr: {
			Languages[0]: "内部错误",
			Languages[1]: "內部錯誤",
			Languages[2]: "Internal Error",
		},
		ArgsError: {
			Languages[0]: "参数错误",
			Languages[1]: "參數錯誤",
			Languages[2]: "Param Error",
		},
		PermissionNotAllowed: {
			Languages[0]: "未允许的操作",
			Languages[1]: "未允許的操作",
			Languages[2]: "The operation is not allowed",
		},
		StatContainsMultiple: {
			Languages[0]: "查询语句query只支持单条语句",
			Languages[1]: "查詢語句query只支持單條語句",
			Languages[2]: "Query statement supports only one statement",
		},
		NebulaInternalServer: {
			Languages[0]: "Nebula 数据库内部错误",
			Languages[1]: "Nebula 數據庫內部錯誤",
			Languages[2]: "Nebula database internal error",
		},
		NebulaSemanticError: {
			Languages[0]: "Nebula 语句语义错误",
			Languages[1]: "Nebula 語句語義錯誤",
			Languages[2]: "Nebula statement semantic error",
		},
		NebulaSyntaxError: {
			Languages[0]: "Nebula 语句语法错误",
			Languages[1]: "Nebula 語句語義錯誤",
			Languages[2]: "Nebula statement syntax error",
		},
		NebulaPermissionDenied: {
			Languages[0]: "Nebula 权限不足",
			Languages[1]: "Nebula 權限不足",
			Languages[2]: "Nebula lack of authority",
		},
		NebulaExecuteError: {
			Languages[0]: "Nebula 执行错误",
			Languages[1]: "Nebula 執行錯誤",
			Languages[2]: "Nebula execute error",
		},
		NebulaInvalidOperation: {
			Languages[0]: "Nebula 无效的操作",
			Languages[1]: "Nebula 無效的操作",
			Languages[2]: "Nebula invalid operation",
		},
		NebulaInvalidSpaceVidLen: {
			Languages[0]: "Nebula vid 长度无效",
			Languages[1]: "Nebula vid 長度無效",
			Languages[2]: "Nebula invalid vid lenth",
		},
		NebulaAuthenticationError: {
			Languages[0]: "Nebula 账户或密码不正确",
			Languages[1]: "Nebula 賬戶或密碼不正確",
			Languages[2]: "Nebula account or password is incorrect",
		},

		CustomSearchBatchExecErr: {
			Languages[0]: "批量执行自定义查询语句出错",
			Languages[1]: "批量執行自定義查詢語句出錯",
			Languages[2]: "A user-defined query statement failed to be executed in batches",
		},
		SeachResContainsText: {
			Languages[0]: "查询结果不足以在画布上显示",
			Languages[1]: "查詢結果不足以在畫布上顯示",
			Languages[2]: "Query results are not sufficient to be visualized on the canvas",
		},
		OpenSearchErr: {
			Languages[0]: "调用OpenSearch出错",
			Languages[1]: "",
			Languages[2]: "Call opensearch error",
		},
		HTTPClientCallFailed: {
			Languages[0]: "HTTPClient调用失败",
			Languages[1]: "",
			Languages[2]: "Call httpclient error",
		},
		AuthErr: {
			Languages[0]: "AuthErr调用失败",
			Languages[1]: "",
			Languages[2]: "Call data-auth error",
		},
		ResourceCreateErr: {
			Languages[0]: "创建资源失败",
			Languages[1]: "",
			Languages[2]: "Failed to create a resource",
		},
		ResourceUpdateErr: {
			Languages[0]: "更新资源失败",
			Languages[1]: "",
			Languages[2]: "Resource update failure",
		},
		ResourceNotFound: {
			Languages[0]: "资源不存在",
			Languages[1]: "",
			Languages[2]: "Resource does not exist",
		},
		ResourceAlreadyExists: {
			Languages[0]: "资源已存在",
			Languages[1]: "",
			Languages[2]: "Resource already exists",
		},
		BuilderErr: {
			Languages[0]: "访问builder接口异常",
			Languages[1]: "",
			Languages[2]: "Call builder interface error",
		},
		RBACErr: {
			Languages[0]: "访问RBAC接口异常",
			Languages[1]: "",
			Languages[2]: "Call RBAC interface error",
		},
		ServiceStatusErr: {
			Languages[0]: "认知应用状态异常",
			Languages[1]: "",
			Languages[2]: "The cognitive service status is abnormal",
		},
		DataAuthErr: {
			Languages[0]: "访问data-auth接口异常",
			Languages[1]: "",
			Languages[2]: "Call data-auth interface error",
		},
		PermissionDeniedErr: {
			Languages[0]: "权限校验失败",
			Languages[1]: "",
			Languages[2]: "Permission Denied Error",
		},
		ServicePermissionDeniedErr: {
			Languages[0]: "应用权限校验失败",
			Languages[1]: "",
			Languages[2]: "Service Permission Denied Error",
		},
		GraphPermissionDeniedErr: {
			Languages[0]: "图谱权限校验失败",
			Languages[1]: "",
			Languages[2]: "Graph Permission Denied Error",
		},
		GraphAnalysisSvcConfigParseErr: {
			Languages[0]: "图分析应用配置解析失败",
			Languages[1]: "",
			Languages[2]: "Graph analysis svc configuration parsing failure",
		},
		CogServerErr: {
			Languages[0]: "CogServerErr调用失败",
			Languages[1]: "",
			Languages[2]: "Call cog server error",
		},
		ErrAdvConfNameErr: {
			Languages[0]: "配置名称重复",
			Languages[1]: "",
			Languages[2]: "conf name repeat",
		},
		ErrAdvSearchConfIDErr: {
			Languages[0]: "配置不存在",
			Languages[1]: "",
			Languages[2]: "conf not exist",
		},
		ErrAdvSearchErr: {
			Languages[0]: "高级搜索错误",
			Languages[1]: "",
			Languages[2]: "adv search error",
		},
		ErrAdvConfContentErr: {
			Languages[0]: "高级搜索配置错误",
			Languages[1]: "",
			Languages[2]: "adv search config error",
		},
		AlgServerErr: {
			Languages[0]: "AlgServerErr调用失败",
			Languages[1]: "",
			Languages[2]: "Call alg server error",
		},
		DuplicateApplicationNameErr: {
			Languages[0]: "重复的应用名称",
			Languages[1]: "",
			Languages[2]: "Duplicate Application Name",
		},
		ForwardErr: {
			Languages[0]: "调用转发接口报错",
			Languages[1]: "",
			Languages[2]: "Error calling forwarding interface",
		},
	}

	// ErrorSolution 异常解决方案
	ErrorSolution = map[string]map[string]string{
		InternalErr: {
			Languages[0]: "内部错误，请联系开发人员",
			Languages[1]: "內部錯誤，請聯系開發人員",
			Languages[2]: "Internal error, please contact the developer",
		},
		ArgsError: {
			Languages[0]: "请检查参数是否正确",
			Languages[1]: "請檢查參數是否正確",
			Languages[2]: "Check whether the parameters are correct",
		},
		PermissionNotAllowed: {
			Languages[0]: "请检查是否包含写操作",
			Languages[1]: "請檢查是否包含寫操作",
			Languages[2]: "Check whether write operations are included",
		},
		StatContainsMultiple: {
			Languages[0]: "请检查语句是否为正确，只支持单条",
			Languages[1]: "請檢查語句是否為正確，只支持單條",
			Languages[2]: "Check whether the statement is correct. Only one statement is supported",
		},
		NebulaInternalServer: {
			Languages[0]: "Nebula 数据库内部错误，请联系开发人员",
			Languages[1]: "Nebula 數據庫內部錯誤，請聯系開發人員",
			Languages[2]: "Nebula database internal error, please contact the developer",
		},
		NebulaSemanticError: {
			Languages[0]: "请检查语句语义是否正确",
			Languages[1]: "請檢查語句語義是否正確",
			Languages[2]: "Please check that the statement semantics are correct",
		},
		NebulaSyntaxError: {
			Languages[0]: "请检查语句语法是否正确",
			Languages[1]: "請檢查語句語法是否正確",
			Languages[2]: "Please check that the statement syntax are correct",
		},
		NebulaPermissionDenied: {
			Languages[0]: "请检查nebula账户或密码是否正确",
			Languages[1]: "請檢查nebula賬戶或密碼是否正確",
			Languages[2]: "Please check whether the nebula account or password is correct",
		},
		NebulaExecuteError: {
			Languages[0]: "请检查nebula问题，执行失败",
			Languages[1]: "請檢查nebula問題，執行失败",
			Languages[2]: "Check nebula problem, execution failed",
		},
		NebulaInvalidOperation: {
			Languages[0]: "请检查nebula操作，执行失败",
			Languages[1]: "請檢查nebula操作，執行失敗",
			Languages[2]: "Please check nebula operation, execution failed",
		},
		NebulaInvalidSpaceVidLen: {
			Languages[0]: "请检查vid长度是否有效",
			Languages[1]: "請檢查vid長度是否有效",
			Languages[2]: "Check whether the vid length is valid",
		},
		NebulaAuthenticationError: {
			Languages[0]: "Nebula 账户或密码不正确",
			Languages[1]: "Nebula 賬戶或密碼不正確",
			Languages[2]: "Nebula account or password is incorrect",
		},

		CustomSearchBatchExecErr: {
			Languages[0]: "批量执行错误，请看详细错误判断原因或者联系开发人员",
			Languages[1]: "批量執行錯誤，請看詳細錯誤判斷原因或者聯系開發人員",
			Languages[2]: "Batch execution error, please see the error cause or contact the developer",
		},
		SeachResContainsText: {
			Languages[0]: "请检查语句是否包含文本值结果",
			Languages[1]: "請檢查語句是否包含文本值結果",
			Languages[2]: "Check that the statement contains text value results",
		},
		OpenSearchErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		HTTPClientCallFailed: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		AuthErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		ResourceCreateErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		ResourceUpdateErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		ResourceNotFound: {
			Languages[0]: "请检查id是否有效",
			Languages[1]: "",
			Languages[2]: "Please check whether the id is valid",
		},
		ResourceAlreadyExists: {
			Languages[0]: "资源已存在，请检查传入参数是否有效",
			Languages[1]: "",
			Languages[2]: "The resource already exists, check if the passed parameter is valid",
		},
		NameIncorrect: {
			Languages[0]: "命名不能包含特殊字符",
			Languages[1]: "",
			Languages[2]: "The name cannot contain special characters",
		},
		BuilderErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		RBACErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		ServiceStatusErr: {
			Languages[0]: "认知应用状态异常，请检查详细信息",
			Languages[1]: "",
			Languages[2]: "The cognitive service status is abnormal, please check the details",
		},
		DataAuthErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		PermissionDeniedErr: {
			Languages[0]: "请检查用户权限是否正确",
			Languages[1]: "",
			Languages[2]: "Please check whether the user permissions are correct",
		},
		ServicePermissionDeniedErr: {
			Languages[0]: "请检查用户权限是否正确",
			Languages[1]: "",
			Languages[2]: "Please check whether the user permissions are correct",
		},
		GraphPermissionDeniedErr: {
			Languages[0]: "请检查用户权限是否正确",
			Languages[1]: "",
			Languages[2]: "Please check whether the user permissions are correct",
		},
		GraphAnalysisSvcConfigParseErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		CogServerErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		ErrAdvConfNameErr: {
			Languages[0]: "请检查配置名称是否已经存在",
			Languages[1]: "",
			Languages[2]: "Please check if the configuration name already exists",
		},
		ErrAdvSearchConfIDErr: {
			Languages[0]: "请检查配置是否存在",
			Languages[1]: "",
			Languages[2]: "Please check if the configuration exists",
		},
		ErrAdvSearchErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		ErrAdvConfContentErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		AlgServerErr: {
			Languages[0]: "请检查详细信息，联系开发人员",
			Languages[1]: "",
			Languages[2]: "Please check the details and contact the developer",
		},
		DuplicateApplicationNameErr: {
			Languages[0]: "请检查名称是否正确",
			Languages[1]: "",
			Languages[2]: "Check whether the name is correct",
		},
		ForwardErr: {
			Languages[0]: "检查转发参数和目标接口状态",
			Languages[1]: "",
			Languages[2]: "Check parameters and target interface status",
		},
	}
	// NebulaErr2CommonErr nebula自身错误
	NebulaErr2CommonErr = map[int]string{
		-1001: NebulaAuthenticationError,
		-1004: NebulaSyntaxError,
		-1005: NebulaExecuteError,
		-1006: NebulaSemanticError,
		-1008: NebulaPermissionDenied,
		-1009: NebulaSemanticError,
		-3005: NebulaInvalidOperation,
		-3022: NebulaInvalidSpaceVidLen,
	}
)

func ErrorEncoder(err error) (int, any) {
	var (
		errorInfo CommonErrResponse
		errorCode int
	)

	switch v := err.(type) {
	case *ErrorInfo:
		errorCode = v.Code
		errC := v.Reason

		if strings.HasPrefix(v.Message, "SemanticError: No edge type found in space") {

			emptyRes := &types.GraphSearchResponse{
				Nodes: make([]*types.Nodes, 0),
				Edges: make([]*types.Edges, 0),
				Error: &types.Error{
					Description: ErrorI18n[errC]["en_US"],
					ErrorCode:   errC,
					ErrorDetails: []*types.ErrDetails{
						{
							Detail: v.Message,
						},
					},
					Solution: ErrorSolution[errC]["en_US"],
				},
			}
			resp := types.UnitiveResponse{Res: emptyRes}
			errorCode = http.StatusOK
			return errorCode, resp
		}

		if v.Code == 0 {
			errorCode = http.StatusInternalServerError
			errC = InternalErr
		}
		commonErrResponse := CommonErrResponse{
			Description:  ErrorI18n[errC]["en_US"],
			ErrorCode:    errC,
			ErrorDetails: v.Message,
			Solution:     ErrorSolution[errC]["en_US"],
		}
		if v.Reason == "VALIDATOR" {
			commonErrResponse.ErrorCode = ArgsError
			commonErrResponse.Description = ErrorI18n[ArgsError]["en_US"]
			commonErrResponse.Solution = ErrorSolution[ArgsError]["en_US"]
		} else if v.Reason == "UNKNOWN" {
			commonErrResponse.ErrorCode = InternalErr
			commonErrResponse.Description = ErrorI18n[InternalErr]["en_US"]
			commonErrResponse.Solution = ErrorSolution[InternalErr]["en_US"]
		}
		errorInfo = commonErrResponse
	// case *errors.CodeMsg:
	// 	if strings.HasPrefix(v.Error(), "is not set") {
	// 		commonErrResponse := CommonErrResponse{
	// 			Description:  ErrorI18n[ArgsError]["en_US"],
	// 			ErrorCode:    ArgsError,
	// 			ErrorDetails: v.Message,
	// 			Solution:     ErrorSolution[ArgsError]["en_US"],
	// 		}
	// 		return http.StatusBadRequest, commonErrResponse
	// 	}
	default:
		desp := ""
		errorCodeStr := ""
		detail := ""
		solution := ""
		errorCode = http.StatusInternalServerError
		if strings.HasPrefix(v.Error(), "field") && strings.Contains(v.Error(), "is not set") {
			commonErrResponse := CommonErrResponse{
				Description:  ErrorI18n[ArgsError]["en_US"],
				ErrorCode:    ArgsError,
				ErrorDetails: v.Error(),
				Solution:     ErrorSolution[ArgsError]["en_US"],
			}
			return http.StatusBadRequest, commonErrResponse
		} else if strings.HasPrefix(v.Error(), "ErrorCode:") {
			re := regexp.MustCompile(`ErrorCode:\s*(-?\d+),\s*ErrorMsg:\s*(.*)$`)
			match := re.FindStringSubmatch(v.Error())
			if len(match) > TwoNum {
				errorCodeInt, _ := strconv.Atoi(match[1])
				if _, ok := NebulaErr2CommonErr[errorCodeInt]; !ok {
					errorCodeStr = NebulaInternalServer
					detail = match[2]
					desp = ErrorI18n[NebulaInternalServer]["en_US"]
					solution = ErrorSolution[NebulaInternalServer]["en_US"]
				} else {
					errorCodeStr = NebulaErr2CommonErr[errorCodeInt]
					detail = match[2]
					desp = ErrorI18n[NebulaErr2CommonErr[errorCodeInt]]["en_US"]
					solution = ErrorSolution[NebulaErr2CommonErr[errorCodeInt]]["en_US"]
				}
			}
		} else if strings.HasPrefix(v.Error(), "SemanticError: No edge type found in space") {
			resp := map[string]map[string]interface{}{
				"res": {
					"outE":    []string{},
					"inE":     []string{},
					"message": "No edge type found in space",
				},
			}
			errorCode = http.StatusOK
			return errorCode, resp
		} else {
			desp = ErrorI18n[InternalErr]["en_US"]
			errorCodeStr = InternalErr
			detail = v.Error()
			solution = ErrorSolution[InternalErr]["en_US"]
		}

		commonErrResponse := CommonErrResponse{
			Description:  desp,
			ErrorCode:    errorCodeStr,
			ErrorDetails: detail,
			Solution:     solution,
		}
		errorInfo = commonErrResponse
	}
	return errorCode, errorInfo
}

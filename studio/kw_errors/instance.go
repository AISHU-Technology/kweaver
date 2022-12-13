package kw_errors

import "net/http"

var (
	//common
	OK                  = &Error{HttpCode: http.StatusOK, ErrorCode: "Studio.Common.OK", Description: "", Solution: "", ErrorLink: ""}
	ParameterError      = &Error{HttpCode: http.StatusBadRequest, ErrorCode: "Studio.Common.ParameterError", Description: "Parameter error", Solution: "", ErrorLink: ""}
	InternalServerError = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.Common.ServerError", Description: "Server error", ErrorLink: ""}

	//存储管理
	GraphDBRecordNotFoundError      = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.GraphDB.GraphDBRecordNotFoundError", Description: "Data source record does not exist"}
	DuplicateGraphDBRecordNameError = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.GraphDB.DuplicateGraphDBRecordNameError", Description: "Data source record name already exists"}
	GraphDBAccountError             = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.GraphDB.AccountError", Description: "The connection account or password is incorrect"}
	URLError                        = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.GraphDB.URLError", Description: "Wrong ip or port"}
	DuplicateConfigError            = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.GraphDB.DuplicateConfigError", Description: "Configuration information is duplicated"}
	GraphDbRecordUsedError          = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.GraphDB.GraphDbRecordUsedError", Description: "Graphdb record is being used"}

	//opensearch配置
	OsRecordNotFoundError      = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.OpenSearch.OsRecordNotFoundError", Description: "Record of opensearch does not exist"}
	DuplicateOsRecordNameError = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.OpenSearch.DuplicateOsRecordNameError", Description: "Record name of opensearch already exists"}
	OsIsUsedError              = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.OpenSearch.OsIsUsedError", Description: "Configuration is being used"}
	DuplicateOsConfigError     = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "Studio.OpenSearch.DuplicateOsConfigError", Description: "Configuration information is duplicated"}
)

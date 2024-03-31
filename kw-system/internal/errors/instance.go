package errors

import "net/http"

var (
	//common
	ParameterError      = &Error{HttpCode: http.StatusBadRequest, ErrorCode: "EventStats.Common.ParameterError", Description: "Parameter error", Solution: "", ErrorLink: ""}
	InternalServerError = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "EventStats.Common.ServerError", Description: "Server error", ErrorLink: ""}

	DictionaryNotFoundError     = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "EventStats.Dictionary.DictNotFoundError", Description: "Dictionary does not exist"}
	DictionaryExistError        = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "EventStats.Dictionary.DictExistError", Description: "Dictionary already exists"}
	DictionaryItemNotFoundError = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "EventStats.Dictionary.DictItemNotFoundError", Description: "Dictionary item does not exist"}
	DictionaryItemExistError    = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "EventStats.Dictionary.DictItemExistError", Description: "Dictionary item already exists"}
	MenuNotFoundError           = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "EventStats.Menu.MenuNotFoundError", Description: "Menu does not exist"}
	MenuExistError              = &Error{HttpCode: http.StatusInternalServerError, ErrorCode: "EventStats.Menu.MenuExistError", Description: "Menu already exists"}
)

package errors

import (
	"net/http"
)

// ErrorHandler 统一异常处理
func ErrorHandler(w http.ResponseWriter, err interface{}) {
	if e, ok := err.(*Error); ok {
		http.Error(w, e.Error(), e.HttpCode)
	} else if e, ok := err.(error); ok {
		er := InternalServerError.SetDetailError(e.Error())
		http.Error(w, er.Error(), er.HttpCode)
	} else if msg, ok := err.(string); ok {
		er := InternalServerError.SetDetailError(msg)
		http.Error(w, er.Error(), er.HttpCode)
	} else {
		http.Error(w, InternalServerError.Error(), InternalServerError.HttpCode)
	}
}

package middleware

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"kw-studio/global"
	"kw-studio/kw_errors"
	"kw-studio/utils/response"
)

// ErrorHandler 统一异常处理
func ErrorHandler(c *gin.Context) {
	defer func() {
		if err := recover(); err != nil {
			global.LOG.Error(fmt.Sprintf("%v", err))
			if en, ok := err.(*kw_errors.Error); ok {
				response.Fail(c, en)
			} else if e, ok := err.(error); ok {
				response.Fail(c, kw_errors.InternalServerError.SetDetailError(e.Error()))
			} else if msg, ok := err.(string); ok {
				response.Fail(c, kw_errors.InternalServerError.SetDetailError(msg))
			} else {
				response.Fail(c, kw_errors.InternalServerError)
			}
			c.Abort()
		}
	}()
	c.Next()
}

// Package leo 提供了 Web 框架使用的工具集
// - 描述：当前文件提供用户返回异常的方法
// - 时间：2020-1-7
package leo

import "github.com/gin-gonic/gin"

// Error is error from leo
type Error interface {
	Set(*gin.Context)
}

// ThrowError will throw errors
func ThrowError(o Error, c *gin.Context) {
	o.Set(c)
}

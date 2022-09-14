// Package leo 提供了 Web 框架使用的工具集
// - 描述：当前文件提供响应的返回格式及返回方式的中间件
// - 作者：张坤 (zhang.kun@eisoo.com)
// - 时间：2020-1-5
package leo

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

// LEO 可被JSON化的类型
type LEO map[string]interface{}

// 默认传递到web context且输出的key值
const (
	leoKey     = "leoKey"
	ErrKey     = "ErrKey"
	SuccessKey = "SuccessKey"
	StatusKey  = "StatusKey"
)

// Info 定义全局响应结构
type Info struct {
	StatusCode int    `json:"-"`
	Code       int    `json:"code"`
	Message    string `json:"Message"`
	Cause      string `json:"Cause"`
	Detail     LEO    `json:"Detail"`
}

// NewResponse 给web context传递用户自定义响应信息
func NewResponse(c *gin.Context, res Info) {
	c.Set(leoKey, res)
}

// NewException 给web context传递用户自定义异常信息
// TODO: 结合可捕获异常or错误的中间件统一处理各类异常类型
func NewException(c *gin.Context, exp Info, err error) {
	str := fmt.Sprintf("%s", err)
	exp.Message = str
	exp.Cause = str
	c.Set(leoKey, exp)
}

// 默认返回结构，在这一步返回时若发生异常，必定是业务逻辑错误
var defaultInfo = Info{
	StatusCode: 500,
	Code:       500001,
	Message:    "internal error",
	Cause:      "internal error",
	Detail:     nil,
}

// Infomer 是规范信息输出的中间件，必须是web context的最后一个中间件
// func Infomer() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		c.Next()

// 		var res = defaultInfo

// 		if value, exists := c.Get(leoKey); exists {
// 			res = value.(Info)
// 		}

// 		c.JSON(res.StatusCode, LEO{
// 			"code":    res.Code,
// 			"message": res.Message,
// 			"cause":   res.Cause,
// 			"detail":  res.Detail,
// 		})
// 	}
// }

// Informer 是规范信息输出的中间件，必须是web context的最后一个中间件
func Informer() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if value, exist := c.Get(ErrKey); exist {
			code := c.MustGet(StatusKey).(int)
			c.JSON(code, value)
		}

		if value, exist := c.Get(SuccessKey); exist {
			code := c.MustGet(StatusKey).(int)
			c.JSON(code, value)
		}
	}
}

// Package leo 提供了 Web 框架使用的工具集
// - 描述：当前文件提供了系统错误的处理方法，后续可根据错误类型进一步判断
// - 时间：2020-1-7
package leo

import (
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
)

// ErrHandler 可作为中间件使用
func ErrHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				fmt.Fprintf(os.Stderr, "Error: %s\n", err)
			}
			//fmt.Println("NO Error")
			return
		}()
		c.Next()
	}

}

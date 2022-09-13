package middleware

import (
	"bytes"
	"github.com/gin-gonic/gin"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"
	"io/ioutil"
	"time"
)

// ZapLogger 接收gin框架默认的日志
func ZapLogger(lg *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery
		post := ""

		if c.Request.Method == "POST" {
			// 把request的内容读取出来
			bodyBytes, _ := ioutil.ReadAll(c.Request.Body)
			c.Request.Body.Close()
			// 把刚刚读出来的再写进去
			c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))
			switch c.ContentType() {
			case "application/json":
				var result map[string]interface{}
				d := jsoniter.NewDecoder(bytes.NewReader(bodyBytes))
				d.UseNumber()
				if err := d.Decode(&result); err == nil {
					bt, _ := jsoniter.Marshal(result)
					post = string(bt)
				}
			default:
				post = string(bodyBytes)
			}
		}

		c.Next()

		cost := time.Since(start)
		lg.Info(path,
			zap.Int("status", c.Writer.Status()),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.String("post", post),
			zap.String("ip", c.ClientIP()),
			zap.String("user-agent", c.Request.UserAgent()),
			zap.String("errors", c.Errors.ByType(gin.ErrorTypePrivate).String()),
			zap.Duration("cost", cost),
		)
	}
}

package response

import (
	"github.com/gin-gonic/gin"
	"kw-studio/kw_errors"
	"net/http"
)

func Ok(c *gin.Context, data ...interface{}) {
	if len(data) <= 0 {
		c.JSON(http.StatusOK, gin.H{"res": "ok"})
	} else if len(data) == 1 {
		c.JSON(http.StatusOK, gin.H{"res": data[0]})
	} else {
		c.JSON(http.StatusOK, gin.H{"res": data})
	}
}

func Fail(c *gin.Context, e *kw_errors.Error) {
	c.JSON(e.HttpCode, e)
}

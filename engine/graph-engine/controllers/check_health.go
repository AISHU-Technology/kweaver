// @Author : yuan.qi@aishu.cn
// @File : check_health.go
// @Time : 2021/4/1

package controllers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func ReadyHandler(c *gin.Context) {

	c.JSON(http.StatusOK, nil)
}

func AliveHandler(c *gin.Context) {

	c.JSON(http.StatusOK, nil)
}

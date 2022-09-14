// @File : check_health.go
// @Time : 2021/4/1

package controllers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

// ReadyHandler
// @Summary ready
// @Description  Health detection
// @Tags CEngine
// @Router /api/engine/v1/health/ready [get]
// @Success 200
func ReadyHandler(c *gin.Context) {

	c.JSON(http.StatusOK, nil)
}

// AliveHandler
// @Summary alive
// @Description  Health detection
// @Tags CEngine
// @Router /api/engine/v1/health/alive [get]
// @Success 200
func AliveHandler(c *gin.Context) {

	c.JSON(http.StatusOK, nil)
}

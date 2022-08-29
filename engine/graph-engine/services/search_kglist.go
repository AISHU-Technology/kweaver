package services

import (
	"github.com/gin-gonic/gin"
	"graph-engine/controllers"
)

func SearchKGListHandler(c *gin.Context) {
	httpcode, res := controllers.SearchKGList()

	c.JSON(httpcode, res)
}

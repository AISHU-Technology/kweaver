package services

import (
	"github.com/gin-gonic/gin"
	"graph-engine/controllers"
	"graph-engine/utils"
	"strconv"
)

type ReqPropertiesArgs struct {
	ID    int    `form:"id" binding:"required,gt=0"`
	Class string `form:"class" binding:"required"`
}

func GetPropertiesHandler(c *gin.Context) {
	var body ReqPropertiesArgs

	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	httpcode, res := controllers.GetProperties(strconv.Itoa(body.ID), body.Class)

	c.JSON(httpcode, res)
}

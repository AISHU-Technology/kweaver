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

// GetPropertiesHandler
// @Summary attributes and types
// @Description Get attributes and types, for configuring search filter
// @Tags Engine
// @Param id query int true "knowledge graph id"
// @Param class query string true "class name"
// @Router /api/engine/v1/properties [post]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} controllers.GetPropertiesRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrVClassErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrOrientDBErr: OrientDB error"
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

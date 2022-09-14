package services

import (
	"github.com/gin-gonic/gin"
	"graph-engine/controllers"
	"graph-engine/utils"
	"strconv"
)

type ReqExploreRelationArgs struct {
	ID   int      `form:"id" binding:"required,gt=0"`
	Rids []string `form:"rids" binding:"required,eq=2"`
}

// ExploreRelationHandler
// @Summary Get relationship
// @Description Get the direct relationship between two entities
// @Tags CEngine
// Param id query int true "knowledge graph id"
// Param rids query []string true "IDs of the two entities, length=2"
// @Param body body ReqExploreRelationArgs true "knowledge graph id and entity IDs"
// @Router /api/engine/v1/explore/relation [post]
// @Accept  json
// @Produce json
// @Success 200 {object} controllers.Relation "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrOrientDBErr: OrientDB error"
func ExploreRelationHandler(c *gin.Context) {
	var body ReqExploreRelationArgs
	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	httpcode, res := controllers.ExploreRelation(strconv.Itoa(body.ID), body.Rids)

	c.JSON(httpcode, res)
}

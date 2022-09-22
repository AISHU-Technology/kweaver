package services

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"graph-engine/controllers"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"strconv"
)

type ExplorePathBody struct {
	ID        string `json:"id" binding:"required"`
	StartRid  string `json:"startRid" binding:"required"`
	EndRid    string `json:"endRid" binding:"required"`
	Direction string `json:"direction" binding:"oneof=positive reverse bidirect"`
	Shortest  int    `json:"shortest" binding:"oneof=0 1"`
}

type PathBody struct {
	ID    string                `json:"id" binding:"required"`
	Paths []map[string][]string `json:"paths" binding:"required"`
}

// ExplorePathHandler
// @Summary explore the path
// @Description explore the path between two vertices
// @Tags CEngine
// @Param body body ExplorePathBody true "explore path body, direction[positive, reverse, bidirect], shortest[0(all), 1(shortest)]"
// @Router /api/engine/v1/explore/path [post]
// @Accept  json
// @Produce json
// @Success 200 {object} PathRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
func ExplorePathHandler(c *gin.Context) {
	var body ExplorePathBody
	err := c.ShouldBindWith(&body, binding.JSON)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	kgId, err := strconv.ParseInt(body.ID, 10, 64)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	httpcode, res := controllers.ExplorePath(int(kgId), body.StartRid, body.EndRid, body.Direction, body.Shortest)

	c.JSON(httpcode, gin.H{"res": res})
}

// ExplorePathHandler
// @Summary query path details
// @Description query path details by paths list
// @Tags CEngine
// @Param body body PathBody true "knowledge graph id and paths list"
// @Router /api/engine/v1/explore/pathDetail [post]
// @Accept  json
// @Produce json
// @Success 200 {object} PathDetailRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
func PathDetail(c *gin.Context) {
	var body PathBody
	err := c.ShouldBindWith(&body, binding.JSON)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}
	kgId, err := strconv.ParseInt(body.ID, 10, 64)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}
	httpcode, res := controllers.PathDetail(int(kgId), body.Paths)

	c.JSON(httpcode, gin.H{"res": res})
}

//not used, just for swagger
type PathRes struct {
	Res []orient.PathInfo
}
type PathDetailRes struct {
	Res []orient.PathDetailInfo
}

package services

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"graph-engine/controllers"
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

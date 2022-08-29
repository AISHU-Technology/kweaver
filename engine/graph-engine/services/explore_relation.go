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

// Package services 为接口的控制逻辑
// - 描述：搜一搜 入口
// - 作者：原琦 (yuan.qi@aishu.cn)
// - 时间：2021-2-22

package services

import (
	"github.com/gin-gonic/gin"
	"graph-engine/controllers"
	"graph-engine/utils"
	"strconv"
)

type ReqRecommendArgs struct {
	ID    int    `form:"id" binding:"required,gt=0"`
	Class string `form:"class"`
	Limit int    `form:"limit" binding:"required,gt=0,lte=100"`
}

func RecommendHandler(c *gin.Context) {
	var body ReqRecommendArgs

	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	httpcode, res := controllers.Recommend(strconv.Itoa(body.ID), body.Class, body.Limit)

	c.JSON(httpcode, res)
}

package services

import (
	"github.com/gin-gonic/gin"
	"graph-engine/controllers"
	"graph-engine/utils"
)

type ReqAdvSearch struct {
	Query string `form:"query"`
	Page  int    `form:"page" binding:"required,gt=0"`
	Size  int    `form:"size" binding:"required,gt=0"`
	Limit int    `form:"limit"`
}

// 智能搜索（2AD）
func AdvSearchHandler(c *gin.Context) {
	var body ReqAdvSearch
	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	id, _ := c.Params.Get("confid")
	// 国际化
	header := c.Request.Header
	httpcode, res := controllers.AdvSearch(id, body.Query, body.Page, body.Size, body.Limit, header)
	c.JSON(httpcode, res)
}

// 语义搜索test
func AdvSearchTestHandler(c *gin.Context) {
	var body controllers.AdvSearchTestBody
	err := c.ShouldBindJSON(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	// 国际化
	header := c.Request.Header
	httpcode, res := controllers.AdvSearchTest(body, header)
	c.JSON(httpcode, res)
}

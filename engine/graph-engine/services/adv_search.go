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
type ResAdvSearch struct {
}

// AdvSearchHandler
// @Summary advanced search
// @Description semantic search
// @Tags Engine
// @Param confid path string true "config ids like'5,6,7'"
// @Param query query string false "Query statement"
// @Param page query int true  "number of pages" minimum(1)
// @Param size query int true  "Number of pages displayed" minimum(1)
// @Param limit query int false  "limit"
// @Router /api/engine/v1/adv-search/{confid} [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} controllers.ExpandVertexRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrConfigStatusErr: configuration is in editing status"
// @Failure 500 {object} utils.Error "EngineServer.ErrVClassErr: Entity does not exist"
// @Failure 500 {object} utils.Error "EngineServer.ErrOrientDBErr: OrientDB error"
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

// AdvSearchTestHandler
// @Summary advanced search test
// @Description semantic search test
// @Tags Engine
// @Param body body string true "adv-search query"
// @Router /api/engine/v1/adv-search/test [get]
// @Accept  json
// @Produce json
// @Success 200 {object} controllers.ExpandVertexRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrConfigStatusErr: configuration is in editing status"
// @Failure 500 {object} utils.Error "EngineServer.ErrVClassErr: Entity does not exist"
// @Failure 500 {object} utils.Error "EngineServer.ErrOrientDBErr: OrientDB error"
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

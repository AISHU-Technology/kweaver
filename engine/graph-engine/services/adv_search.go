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

// AdvSearchHandler
// @Summary advanced search
// @Description semantic search
// @Tags CEngine
// @Param confid path string true "config ids like'5,6,7'"
// @Param query query string false "Query statement"
// @Param page query int true  "number of pages" minimum(1)
// @Param size query int true  "Number of pages displayed" minimum(1)
// @Param limit query int false  "limit"
// @Router /api/engine/v1/adv-search/{confid} [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} Response "result string"
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
// @Tags CEngine
// @Param body body RequestModel true "adv-search query"
// @Router /api/engine/v1/adv-search/test [get]
// @Accept  json
// @Produce json
// @Success 200 {object} Response "result string"
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

// 智能搜索(文档)
type ReqAdvSearchDefault struct {
	KGID   string `form:"kg_id"`
	KNetID int    `form:"knet_id"`
	Query  string `form:"query"`
	Page   int    `form:"page" binding:"required,gt=0"`
	Size   int    `form:"size" binding:"required,gt=0"`
	Limit  int    `form:"limit"`
}

func AdvSearchDocumentHandler(c *gin.Context) {
	var body ReqAdvSearchDefault
	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}
	// 国际化
	header := c.Request.Header

	eventid := c.Request.Header.Get("Event-Id")
	httpcode, res := controllers.AdvSearchDocument(eventid, body.KGID, body.Query, body.Page, body.Size, body.Limit, header)

	c.JSON(httpcode, res)

}

//not used, just for swagger

type Vertexes struct {
	Open []string
}

type Edges struct {
	Open []string
}

type SearchRange struct {
	Vertexes Vertexes
	Edges    Edges
}

type DisplayRange struct {
	Vertexes Vertexes
}

type ConfContent struct {
	Max_depth     int
	Search_range  SearchRange
	Display_range DisplayRange
}
type RequestModel struct {
	Kg_ids       string
	Query        string
	Page         int
	Size         int
	Conf_content ConfContent
}

type Vertex struct {
	Id    string
	Tag   string
	Name  string
	Color string
}

type Edge struct {
	From_id string
	To_id   string
	Tag     string
	Name    string
	Color   string
}

type PathMetaData struct {
	From_entity_score float32
	Depth             int
	Weight            float32
}

type Path struct {
	Vertexes  []Vertex
	Edges     []Edge
	Meta_data []PathMetaData
}

type TargetVertex struct {
	Tag         string
	Id          string
	Name        string
	Score       float32
	Color       string
	Analysis    bool
	Properties  Dict
	Search_path Path
}

type SearchResult struct {
	Search []TargetVertex
}

type Response struct {
	Time   float32
	Number int
	Res    SearchResult
}

type Dict struct {
}

package services

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"graph-engine/controllers"
	"graph-engine/utils"
)

type ReqSearchVArgs struct {
	ID               string
	Class            string                  `json:"class" binding:"required"`
	Q                string                  `json:"query" binding:"omitempty"`
	Page             int32                   `json:"page" binding:"required,gt=0"`
	Size             int32                   `json:"size" binding:"required,gt=0"`
	QueryAll         bool                    `json:"query_all"`
	SearchFilterArgs *utils.SearchFilterArgs `json:"filter" binding:"required"`
}

// searchV
func KGSearchVHandler(c *gin.Context) {
	var body ReqSearchVArgs

	body.ID, _ = c.Params.Get("id")

	err := c.ShouldBindWith(&body, binding.JSON)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}
	//fmt.Println(body)

	status, res := controllers.KGSearchV(body.ID, body.Class, body.Q, body.Page, body.Size, body.QueryAll, body.SearchFilterArgs)

	c.JSON(status, gin.H{
		"res": res,
	})
}

type ReqSearchEArgs struct {
	ID  string
	Rid string `form:"rid" binding:"required"`
}

//searchE
func KGSearchEHandler(c *gin.Context) {
	var body ReqSearchEArgs
	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	body.ID, _ = c.Params.Get("id")

	status, res := controllers.KGSearchE(body.ID, body.Rid)

	c.JSON(status, gin.H{
		"res": res,
	})
}

type ReqExpandEArgs struct {
	ID    string
	Class string `form:"class" binding:"required"`
	IO    string `form:"io" binding:"required"`
	Rid   string `form:"rid" binding:"required"`
	Page  int32  `form:"page" binding:"required,gt=0"`
	Size  int32  `form:"size" binding:"required,gt=0"`
}

// expandE
func KGExpandEHandler(c *gin.Context) {
	var body ReqExpandEArgs

	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	body.ID, _ = c.Params.Get("id")

	status, res := controllers.KGExpandE(body.ID, body.Class, body.IO, body.Rid, body.Page, body.Size)

	c.JSON(status, gin.H{
		"res": res,
	})
}

type ReqExpandVArgs struct {
	ID    string `form:"id" binding:"required"`
	Class string `form:"class"`
	IO    string `form:"io" binding:"oneof=in out inout"`
	Rid   string `form:"rid" binding:"required"`
	Name  string `form:"name"`
	Page  int32  `form:"page" binding:"required,gt=0"`
	Size  int32  `form:"size" binding:"gte=-1"`
}

// KGExpandVHandler
// @Summary expand vertexes
// @Description expand edges by entity id
// @Tags CEngine
// @Param class query string false "Edge class, when null, query all edges"
// @Param page query int true "Number of pages" minimum(1)
// @Param size query int true  "Number of edges, query all when page = -1" minimum(-1)
// @Param io query string true  "The direction of the expanded edge" Enums(in,out,inout)
// @Param rid query string true  "entity id"
// @Param id query string  true  "graph id"
// @Param name query string false "entity name"
// @Router /api/engine/v1/explore/expandv [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} controllers.ExpandVertexRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrConfigStatusErr: configuration is in editing status"
// @Failure 500 {object} utils.Error "EngineServer.ErrVClassErr: Entity does not exist"
// @Failure 500 {object} utils.Error "EngineServer.ErrOrientDBErr: OrientDB error"
func KGExpandVHandler(c *gin.Context) {
	var body = ReqExpandVArgs{}
	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}
	status, res := controllers.KGExpandV(body.ID, body.Class, body.IO, body.Rid, body.Name, body.Page, body.Size)
	c.JSON(status, gin.H{
		"res": res,
	})
}

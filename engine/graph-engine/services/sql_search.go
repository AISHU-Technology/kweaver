package services

import (
	"github.com/gin-gonic/gin"
	"graph-engine/controllers"
	"graph-engine/utils"
)

type ReqBody struct {
	ID          string
	SQL         []string `json:"sql" binding:"required"`
	Mode        string   `json:"mode" binding:"omitempty,oneof=graph"` // 允许为空或者graph
	Transaction bool     `json:"transaction"`                          // 是否执行事务
}

// SearchSQLHandler
// @Summary Orientdb sql API
// @Description Orientdb sql API
// @Tags CEngine
// @Param id path string true "sql id"
// @Param body body ReqBody true "body"
// @Router /api/engine/v1/sql/{id} [post]
// @Accept  json
// @Produce json
// @Success 200 {object} controllers.SearchSQLRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrOrientDBErr: OrientDB error"
func SearchSQLHandler(c *gin.Context) {
	body := ReqBody{}
	err := c.ShouldBindJSON(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	body.ID, _ = c.Params.Get("id")
	status, res := controllers.SearchSQL(body.ID, body.SQL, body.Mode, body.Transaction)

	c.JSON(status, res)
}

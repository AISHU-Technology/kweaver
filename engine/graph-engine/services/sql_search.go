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

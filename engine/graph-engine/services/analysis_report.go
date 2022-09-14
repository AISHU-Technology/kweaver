// Package services 为接口的控制逻辑
// - 描述：分析报告 入口
// - 作者：原琦 (yuan.qi@aishu.cn)
// - 时间：2021-1-21

package services

import (
	"github.com/gin-gonic/gin"
	"graph-engine/controllers"
	"graph-engine/utils"
	"strconv"
)

type ReqAnalysisArgs struct {
	ID  int    `form:"id" binding:"required,gt=0"`
	Rid string `form:"rid" binding:"required"`
}

// AnalysisHandler
// @Summary Document analysis report
// @Description Document analysis report
// @Tags Engine
// @Param id query int true "knowledge graph id"
// @Param rid query string true "entity id"
// @Router /api/engine/v1/analysis [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} controllers.AnalysisRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrOrientDBErr: OrientDB error"
func AnalysisHandler(c *gin.Context) {
	var body ReqAnalysisArgs

	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	httpcode, res := controllers.Analysis(strconv.Itoa(body.ID), body.Rid)

	c.JSON(httpcode, res)

}

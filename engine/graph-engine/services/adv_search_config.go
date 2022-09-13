// @Author : yuan.qi@aishu.cn
// @File : adv_search_config.go
// @Time : 2021/3/13

package services

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"graph-engine/controllers"
	"graph-engine/models/dao"
	"graph-engine/utils"
	"regexp"
	"strconv"
	"unicode"
)

// -------------------------
// 查询搜索配置列表
// -------------------------
type GetAdvSearchConf struct {
	KNetID int    `form:"knowledge_network_id" binding:"required"`
	Filter string `form:"filter" binding:"required,oneof=all config kg"`
	Query  string `form:"query" binding:"omitempty"`
	Page   int    `form:"page" binding:"required,gt=0"`
	Size   int    `form:"size" binding:"required,gt=0"`
	Sort   string `form:"sort" binding:"required,oneof=descend ascend"`
}

// GetAdvSearchConfigHandler
// @Summary get configs
// @Description get adv-search configs
// @Tags Engine
// @Param knowledge_network_id query int true "knowledge network id"
// @Param filter query string true "'all' or config or kg name"
// @Param query query string false  "query keyword"
// @Param page query int true "Number of pages" minimum(1)
// @Param size query int true  "Number of edges" minimum(1)
// @Param sort query string true "sort type" Enums(descend,ascend)
// @Router /api/engine/v1/adv-search-config [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} controllers.GetSearchConfRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
func GetAdvSearchConfigHandler(c *gin.Context) {
	var body GetAdvSearchConf
	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}
	httpcode, res := controllers.GetAdvSearchConf(body.KNetID, body.Filter, body.Query, body.Sort, body.Page, body.Size)

	c.JSON(httpcode, res)
}

// -------------------------
// 删除搜索配置
// -------------------------
type DelAdvSearchConf struct {
	ConfIDS []int `json:"conf_ids" binding:"required,min=1,dive,gt=0"`
}

// DelAdvSearchConfigHandler
// @Summary delete configs
// @Description delete adv-search configs
// @Tags Engine
// @Param conf_ids body DelAdvSearchConf true "config ids"
// @Router /api/engine/v1/adv-search-config [delete]
// @Accept  json
// @Produce json
// @Success 200 {object} controllers.DelSearchConfRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrAdvSearchConfIDErr: config ID does not exist"
func DelAdvSearchConfigHandler(c *gin.Context) {
	var body DelAdvSearchConf

	err := c.ShouldBindWith(&body, binding.JSON)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	httpcode, res := controllers.DelAdvSearchConf(body.ConfIDS)

	c.JSON(httpcode, res)
	return
}

// -------------------------
// 新增搜索配置
// -------------------------
type AddAdvSearchConf struct {
	ConfName    string          `json:"conf_name" binding:"required,max=50"`
	Type        string          `json:"type"`
	KGID        int             `json:"kg_id" binding:"required"`
	ConfDesc    string          `json:"conf_desc" binding:"max=150"`
	ConfContent dao.ConfContent `json:"conf_content" binding:"required"`
}

// AddAdvSearchConfigHandler
// @Summary add configs
// @Description add adv-search configs
// @Tags Engine
// @Param conf_content body AddAdvSearchConf true "config content"
// @Router /api/engine/v1/adv-search-config [post]
// @Accept  json
// @Produce json
// @Success 200 {object} controllers.AddSearchConfRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrAdvSearchConfIDErr: config ID does not exist"
// @Failure 500 {object} utils.Error "EngineServer.ErrAdvConfContentErr: content error"
func AddAdvSearchConfigHandler(c *gin.Context) {
	var body AddAdvSearchConf
	// 参数校验
	err := c.ShouldBindWith(&body, binding.JSON)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	matchConfName, _ := regexp.MatchString("^[=~!@#$&%^&*()_+`{}\\-[\\];:,.\\\\\\?<>\\'\"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。/a-zA-Z0-9\u4e00-\u9fa5]+$", body.ConfName)
	if !matchConfName {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, errors.New("conf_name invalid characters")))
		return
	}

	if body.ConfDesc != "" {
		matchConfDesc, _ := regexp.MatchString("^[=~!@#$&%^&*()_+`{}\\-[\\];:,.\\\\\\?<>\\'\"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]+$", body.ConfDesc)
		if !matchConfDesc {
			c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, errors.New("conf_desc invalid characters")))
			return
		}
	}
	httpcode, res := controllers.AddAdvSearchConf(body.ConfName, body.Type, body.ConfDesc, body.KGID, body.ConfContent)

	c.JSON(httpcode, res)
	return
}

// -------------------------
// 更新搜索配置
// -------------------------
type UpdateAdvSearchConf struct {
	ConfID      int             `json:"conf_id" binding:"required"`
	ConfName    string          `json:"conf_name" binding:"required,max=50"`
	ConfDesc    string          `json:"conf_desc" binding:"max=150"`
	ConfContent dao.ConfContent `json:"conf_content" binding:"required"`
}

// UpdateAdvSearchConfigHandler
// @Summary update configs
// @Description update adv-search configs
// @Tags Engine
// @Param conf_content body UpdateAdvSearchConf true "config content"
// @Router /api/engine/v1/adv-search-config/update [post]
// @Accept  json
// @Produce json
// @Success 200 {object} controllers.UpdateSearchConfRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrAdvSearchConfIDErr: config ID does not exist"
// @Failure 500 {object} utils.Error "EngineServer.ErrAdvConfContentErr: content error"
func UpdateAdvSearchConfigHandler(c *gin.Context) {
	var body UpdateAdvSearchConf

	err := c.ShouldBindWith(&body, binding.JSON)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}

	matchConfName, _ := regexp.MatchString("^[=~!@#$&%^&*()_+`{}\\-[\\];:,.\\\\\\?<>\\'\"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。/a-zA-Z0-9\u4e00-\u9fa5]+$", body.ConfName)
	if !matchConfName {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, errors.New("conf_name invalid characters")))
		return
	}

	if body.ConfDesc != "" {
		matchConfDesc, _ := regexp.MatchString("^[=~!@#$&%^&*()_+`{}\\-[\\];:,.\\\\\\?<>\\'\"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]+$", body.ConfDesc)
		if !matchConfDesc {
			c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, errors.New("conf_desc invalid characters")))
			return
		}
	}

	httpcode, res := controllers.UpdateAdvSearchConf(body.ConfID, body.ConfName, body.ConfDesc, body.ConfContent)

	c.JSON(httpcode, res)
	return
}

// GetInfoAdvSearchConfigHandler
// @Summary get config info
// @Description get adv-search config info by id
// @Tags Engine
// @Param confid path string true "config id"
// @Router /api/engine/v1/adv-search-config/info/{confid} [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} controllers.InfoSearchConfRes "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrAdvSearchConfIDErr: config ID does not exist"
func GetInfoAdvSearchConfigHandler(c *gin.Context) {
	id, _ := c.Params.Get("confid")

	for _, s := range id {
		if !unicode.IsNumber(s) {
			c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, errors.New("id is not digital")))
			return
		}
	}

	confID, _ := strconv.Atoi(id)
	httpcode, res := controllers.GetInfoAdvSearchConf(confID)

	c.JSON(httpcode, res)
}

// GetConfByKGNameAdvSearchConfigHandler
// @Summary get config ids
// @Description add adv-search configs by knowledge graph id
// @Tags Engine
// @Param kgid path string true "knowledge graph id"
// @Router /api/engine/v1/adv-search-config/conf/{kgid} [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} controllers.GetConfByKGNameRes "result string"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrKGIDErr: knowledge graph ID does not exist"
func GetConfByKGNameAdvSearchConfigHandler(c *gin.Context) {
	kgid, _ := c.Params.Get("kgid")

	for _, s := range kgid {
		if !unicode.IsNumber(s) {
			c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, errors.New("id is not digital")))
			return
		}
	}

	id, _ := strconv.Atoi(kgid)
	httpcode, res := controllers.GetConfByKGID(id)

	c.JSON(httpcode, res)
}

type KGListAsBody struct {
	KNetworkId int    `json:"knowledge_network_id" binding:"required"`
	KGName     string `json:"kg_name"`
}

// KGListAdvSearchConfigHandler
// @Summary get kglist
// @Description get knowledge graph list
// @Tags Engine
// @Param knowledge_network_id query string true "knowledge network id"
// @Param knowledge_network_id query string false "knowledge network name"
// @Router /api/engine/v1/adv-search-config/kglist [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} controllers.AdvConfKGListRes "result string"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
func KGListAdvSearchConfigHandler(c *gin.Context) {

	var body KGListAsBody
	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}
	httpcode, res := controllers.AdvSearchConfKGList(body.KNetworkId, body.KGName)

	c.JSON(httpcode, res)
}

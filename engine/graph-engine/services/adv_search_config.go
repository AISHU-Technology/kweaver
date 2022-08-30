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

// -------------------------
// 查询单一搜索配置
// -------------------------
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

// -------------------------
// 获取图谱相应配置
// -------------------------
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

// -------------------------
// 包含AS模型图谱列表
// -------------------------

type KGListAsBody struct {
	KNetworkId int    `json:"knowledge_network_id" binding:"required"`
	KGName     string `json:"kg_name"`
}

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

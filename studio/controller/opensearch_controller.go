package controller

import (
	"github.com/gin-gonic/gin"
	"kw-studio/kw_errors"
	"kw-studio/model/vo"
	"kw-studio/service"
	"kw-studio/utils/constant"
	"kw-studio/utils/response"
)

/**
 * @Author: Xiangguang.li
 * @Date: 2022/8/20
 * @Email: Xiangguang.li@aishu.cn
 **/

type OpenSearchController struct {
	OpenSearchService *service.OpenSearchService
	GraphDBService    *service.GraphDBService
}

// GetOpenSearchList
// @Summary 根据page和size获取opensearch信息
// @Description 根据page和size获取opensearch信息
// @Tags Studio
// @Param page query int 1 "分页号"
// @Param size query int 0 "每页数量"
// @Param name query string opensearch_name "记录名称"
// @Param orderField query string created "排序字段"
// @Param order query string ASC "排序顺序"
// @Router /api/studio/v1/opensearch/list [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} vo.ListVo  "opensearch配置列表"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *OpenSearchController) GetOpenSearchList(c *gin.Context) {
	condition := &vo.OsSearchCondition{}
	kw_errors.Try(c.ShouldBind(condition)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.OpenSearchService.GetOpenSearchList(condition))
}

// GetOpenSearchInfoById
// @Summary 根据id查询opensearch配置信息
// @Description 根据id查询opensearch配置信息
// @Tags Studio
// @Param id query int 1 "opensearch记录id"
// @Router /api/studio/v1/opensearch [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} vo.OpenSearchVo "opensearch配置信息"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *OpenSearchController) GetOpenSearchInfoById(c *gin.Context) {
	idVo := &vo.OpenSearchIdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.OpenSearchService.GetOpenSearchInfoById(idVo.ID))
}

// AddOpenSearch
// @Summary 添加opensearch配置
// @Description 添加opensearch配置
// @Tags Studio
// @Param opensearchVo body vo.OpenSearchVo true "添加的opensearch配置"
// @Router /api/studio/v1/opensearch/add [post]
// @Accept  json
// @Produce json
// @Success 200 {number} number "添加的opensearch配置id"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *OpenSearchController) AddOpenSearch(c *gin.Context) {
	opensearchVo := &vo.OpenSearchVo{}
	kw_errors.Try(c.ShouldBind(opensearchVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(opensearchVo.Ip, opensearchVo.Port)
	opensearchVo.Ip, opensearchVo.Port = checkDuplicatesAddr(opensearchVo.Ip, opensearchVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: opensearchVo.Ip, Port: opensearchVo.Port, User: opensearchVo.User, Password: opensearchVo.Password, Type: constant.OpenSearch})
	response.Ok(c, controller.OpenSearchService.AddOpenSearch(opensearchVo))
}

// DeleteOpenSearchById
// @Summary 根据id删除opensearch配置
// @Description 根据id删除opensearch配置
// @Tags Studio
// @Param idVo body vo.OpenSearchIdVo true "opensearch配置id"
// @Router /api/studio/v1/opensearch/delete [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *OpenSearchController) DeleteOpenSearchById(c *gin.Context) {
	idVo := &vo.OpenSearchIdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	controller.OpenSearchService.DeleteOpenSearchById(idVo.ID)
	response.Ok(c)
}

// UpdateOpenSearch
// @Summary 根据id更新opensearch配置
// @Description 根据id更新opensearch配置
// @Tags Studio
// @Param opensearchUpdateVo body vo.OpenSearchUpdateVo true "待更新的opensearch配置信息"
// @Router /api/studio/v1/opensearch/update [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *OpenSearchController) UpdateOpenSearch(c *gin.Context) {
	opensearchUpdateVo := &vo.OpenSearchUpdateVo{}
	kw_errors.Try(c.ShouldBind(opensearchUpdateVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(opensearchUpdateVo.Ip, opensearchUpdateVo.Port)
	opensearchUpdateVo.Ip, opensearchUpdateVo.Port = checkDuplicatesAddr(opensearchUpdateVo.Ip, opensearchUpdateVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: opensearchUpdateVo.Ip, Port: opensearchUpdateVo.Port, User: opensearchUpdateVo.User, Password: opensearchUpdateVo.Password, Type: constant.OpenSearch})
	controller.OpenSearchService.UpdateOpenSearch(opensearchUpdateVo)
	response.Ok(c)
}

// TestOpenSearchConfig
// @Summary 测试opensearch配置信息是否正确
// @Description 测试opensearch配置信息是否正确
// @Tags Studio
// @Param osVo body vo.OpenSearchTestVo true "待测试的opensearch配置信息"
// @Router /api/studio/v1/opensearch/test [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *OpenSearchController) TestOpenSearchConfig(c *gin.Context) {
	osVo := &vo.OpenSearchTestVo{}
	kw_errors.Try(c.ShouldBind(osVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(osVo.Ip, osVo.Port)
	osVo.Ip, osVo.Port = checkDuplicatesAddr(osVo.Ip, osVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: osVo.Ip, Port: osVo.Port, User: osVo.User, Password: osVo.Password, Type: constant.OpenSearch})
	response.Ok(c)
}

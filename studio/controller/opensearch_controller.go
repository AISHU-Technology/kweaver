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
// @Summary Get opensearch information based on page and size
// @Description Get opensearch information based on page and size
// @Tags Studio
// @Param page query int 1 "Page number"
// @Param size query int 0 "Quantity per page"
// @Param name query string opensearch_name "Record name"
// @Param orderField query string created "Order field"
// @Param order query string ASC "Order type"
// @Router /api/studio/v1/opensearch/list [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} vo.ListVo  "opensearch configuration list"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *OpenSearchController) GetOpenSearchList(c *gin.Context) {
	condition := &vo.OsSearchCondition{}
	kw_errors.Try(c.ShouldBind(condition)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.OpenSearchService.GetOpenSearchList(condition))
}

// GetOpenSearchInfoById
// @Summary Query opensearch configuration information based on id
// @Description Query opensearch configuration information based on id
// @Tags Studio
// @Param id query int 1 "opensearch configuration id"
// @Router /api/studio/v1/opensearch [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} vo.OpenSearchVo "opensearch configuration"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *OpenSearchController) GetOpenSearchInfoById(c *gin.Context) {
	idVo := &vo.OpenSearchIdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.OpenSearchService.GetOpenSearchInfoById(idVo.ID))
}

// AddOpenSearch
// @Summary Add opensearch configuration
// @Description Add opensearch configuration
// @Tags Studio
// @Param opensearchVo body vo.OpenSearchVo true "Added opensearch configuration"
// @Router /api/studio/v1/opensearch/add [post]
// @Accept  json
// @Produce json
// @Success 200 {number} number "Added opensearch configuration id"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *OpenSearchController) AddOpenSearch(c *gin.Context) {
	opensearchVo := &vo.OpenSearchVo{}
	kw_errors.Try(c.ShouldBind(opensearchVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(opensearchVo.Ip, opensearchVo.Port)
	opensearchVo.Ip, opensearchVo.Port = checkDuplicatesAddr(opensearchVo.Ip, opensearchVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: opensearchVo.Ip, Port: opensearchVo.Port, User: opensearchVo.User, Password: opensearchVo.Password, Type: constant.OpenSearch})
	response.Ok(c, controller.OpenSearchService.AddOpenSearch(opensearchVo))
}

// DeleteOpenSearchById
// @Summary Delete opensearch configuration based on id
// @Description Delete opensearch configuration based on id
// @Tags Studio
// @Param idVo body vo.OpenSearchIdVo true "opensearch configuration id"
// @Router /api/studio/v1/opensearch/delete [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *OpenSearchController) DeleteOpenSearchById(c *gin.Context) {
	idVo := &vo.OpenSearchIdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	controller.OpenSearchService.DeleteOpenSearchById(idVo.ID)
	response.Ok(c)
}

// UpdateOpenSearch
// @Summary Update opensearch configuration based on id
// @Description Update opensearch configuration based on id
// @Tags Studio
// @Param opensearchUpdateVo body vo.OpenSearchUpdateVo true "Updated opensearch configuration"
// @Router /api/studio/v1/opensearch/update [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
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
// @Summary Test whether the opensearch configuration is correct
// @Description Test whether the opensearch configuration is correct
// @Tags Studio
// @Param osVo body vo.OpenSearchTestVo true "opensearch configuration to be tested"
// @Router /api/studio/v1/opensearch/test [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *OpenSearchController) TestOpenSearchConfig(c *gin.Context) {
	osVo := &vo.OpenSearchTestVo{}
	kw_errors.Try(c.ShouldBind(osVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(osVo.Ip, osVo.Port)
	osVo.Ip, osVo.Port = checkDuplicatesAddr(osVo.Ip, osVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: osVo.Ip, Port: osVo.Port, User: osVo.User, Password: osVo.Password, Type: constant.OpenSearch})
	response.Ok(c)
}

package controller

import (
	"github.com/gin-gonic/gin"
	"kw-studio/kw_errors"
	"kw-studio/model/vo"
	"kw-studio/service"
	"kw-studio/utils/constant"
	"kw-studio/utils/response"
)

type OpenSearchController struct {
	OpenSearchService *service.OpenSearchService
	GraphDBService    *service.GraphDBService
}

// GetOpenSearchList 根据page和size获取存储记录及存储记录中的谱图
func (controller *OpenSearchController) GetOpenSearchList(c *gin.Context) {
	condition := &vo.OsSearchCondition{}
	kw_errors.Try(c.ShouldBind(condition)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.OpenSearchService.GetOpenSearchList(condition))
}

// GetOpenSearchInfoById 根据id查询存储配置信息
func (controller *OpenSearchController) GetOpenSearchInfoById(c *gin.Context) {
	idVo := &vo.OpenSearchIdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.OpenSearchService.GetOpenSearchInfoById(idVo.ID))
}

func (controller *OpenSearchController) AddOpenSearch(c *gin.Context) {
	opensearchVo := &vo.OpenSearchVo{}
	kw_errors.Try(c.ShouldBind(opensearchVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(opensearchVo.Ip, opensearchVo.Port)
	opensearchVo.Ip, opensearchVo.Port = checkDuplicatesAddr(opensearchVo.Ip, opensearchVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: opensearchVo.Ip, Port: opensearchVo.Port, User: opensearchVo.User, Password: opensearchVo.Password, Type: constant.OpenSearch})
	response.Ok(c, controller.OpenSearchService.AddOpenSearch(opensearchVo))
}

func (controller *OpenSearchController) DeleteOpenSearchById(c *gin.Context) {
	idVo := &vo.OpenSearchIdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	controller.OpenSearchService.DeleteOpenSearchById(idVo.ID)
	response.Ok(c)
}

func (controller *OpenSearchController) UpdateOpenSearch(c *gin.Context) {
	opensearchUpdateVo := &vo.OpenSearchUpdateVo{}
	kw_errors.Try(c.ShouldBind(opensearchUpdateVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(opensearchUpdateVo.Ip, opensearchUpdateVo.Port)
	opensearchUpdateVo.Ip, opensearchUpdateVo.Port = checkDuplicatesAddr(opensearchUpdateVo.Ip, opensearchUpdateVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: opensearchUpdateVo.Ip, Port: opensearchUpdateVo.Port, User: opensearchUpdateVo.User, Password: opensearchUpdateVo.Password, Type: constant.OpenSearch})
	controller.OpenSearchService.UpdateOpenSearch(opensearchUpdateVo)
	response.Ok(c)
}

// TestOpenSearchConfig 测试存储配置信息是否正确
func (controller *OpenSearchController) TestOpenSearchConfig(c *gin.Context) {
	osVo := &vo.OpenSearchTestVo{}
	kw_errors.Try(c.ShouldBind(osVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(osVo.Ip, osVo.Port)
	osVo.Ip, osVo.Port = checkDuplicatesAddr(osVo.Ip, osVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: osVo.Ip, Port: osVo.Port, User: osVo.User, Password: osVo.Password, Type: constant.OpenSearch})
	response.Ok(c)
}

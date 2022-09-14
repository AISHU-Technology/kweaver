package controller

import (
	"github.com/gin-gonic/gin"
	"kw-studio/kw_errors"
	"kw-studio/model/vo"
	"kw-studio/service"
	"kw-studio/utils/response"
)

/**
 * @Author: Xiangguang.li
 * @Date: 2022/8/20
 * @Email: Xiangguang.li@aishu.cn
 **/

type GraphDBController struct {
	GraphDBService *service.GraphDBService
}

// GetGraphDBList
// @Summary Get storage configurations and graphs in storage configurations according to page and size
// @Description Get storage configurations and graphs in storage configurations according to page and size
// @Tags Studio
// @Param page query int 1 "Page number"
// @Param size query int 0 "Quantity per page"
// @Param name query string orientdb_name "Configuration name"
// @Param type query string orientdb "Configuration type"
// @Param orderField query string created "Order field"
// @Param order query string ASC "Order type"
// @Router /api/studio/v1/graphdb/list [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} vo.ListVo  "Storage configuration list"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *GraphDBController) GetGraphDBList(c *gin.Context) {
	condition := &vo.GraphListSearchCondition{}
	kw_errors.Try(c.ShouldBind(condition)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.GraphDBService.GetGraphDBList(condition))
}

// GetGraphDBInfoById
// @Summary Query storage configuration information based on id
// @Description Query storage configuration information based on id
// @Tags Studio
// @Param id query int 1 "Storage configuration id"
// @Router /api/studio/v1/graphdb [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} vo.GraphDBVo "Store configuration information"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *GraphDBController) GetGraphDBInfoById(c *gin.Context) {
	idVo := &vo.IdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.GraphDBService.GetGraphDBInfoById(idVo.ID))
}

// GetGraphInfoByGraphDBId
// @Summary Query the associated graph based on the storage configuration id
// @Description Query the associated graph based on the storage configuration id
// @Tags Studio
// @Param page query int 1 "Page number"
// @Param size query int 0 "Quantity per page"
// @Param id query int 1 "Storage configuration id"
// @Router /api/studio/v1/graphdb/graph/list [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} vo.ListVo  "Associated graph information"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *GraphDBController) GetGraphInfoByGraphDBId(c *gin.Context) {
	condition := &vo.GraphSearchCondition{}
	kw_errors.Try(c.ShouldBind(condition)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.GraphDBService.GetGraphInfoByGraphDBId(condition))
}

// AddGraphDB
// @Summary Add storage configuration
// @Description Add storage configuration
// @Tags Studio
// @Param graphDBVo body vo.GraphDBVo true "Storage configuration parameters"
// @Router /api/studio/v1/graphdb/add [post]
// @Accept  json
// @Produce json
// @Success 200 {number} number "Added storage configuration id"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *GraphDBController) AddGraphDB(c *gin.Context) {
	graphDBVo := &vo.GraphDBVo{}
	kw_errors.Try(c.ShouldBind(graphDBVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(graphDBVo.Ip, graphDBVo.Port)
	graphDBVo.Ip, graphDBVo.Port = checkDuplicatesAddr(graphDBVo.Ip, graphDBVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: graphDBVo.Ip, Port: graphDBVo.Port, User: graphDBVo.User, Password: graphDBVo.Password, Type: graphDBVo.Type})
	response.Ok(c, controller.GraphDBService.AddGraphDB(graphDBVo))
}

// DeleteGraphDBById
// @Summary Delete storage configuration based on id
// @Description Delete storage configuration based on id
// @Tags Studio
// @Param id body vo.IdVo true "Storage configuration id"
// @Router /api/studio/v1/graphdb/delete [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *GraphDBController) DeleteGraphDBById(c *gin.Context) {
	idVo := &vo.IdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	controller.GraphDBService.DeleteGraphDBById(idVo.ID)
	response.Ok(c)
}

// UpdateGraphDB
// @Summary Update storage configuration based on id
// @Description Update storage configuration based on id
// @Tags Studio
// @Param graphDBUpdateVo body vo.GraphDBUpdateVo true "Storage configuration parameters"
// @Router /api/studio/v1/graphdb/update [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *GraphDBController) UpdateGraphDB(c *gin.Context) {
	graphDBUpdateVo := &vo.GraphDBUpdateVo{}
	kw_errors.Try(c.ShouldBind(graphDBUpdateVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(graphDBUpdateVo.Ip, graphDBUpdateVo.Port)
	graphDBUpdateVo.Ip, graphDBUpdateVo.Port = checkDuplicatesAddr(graphDBUpdateVo.Ip, graphDBUpdateVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: graphDBUpdateVo.Ip, Port: graphDBUpdateVo.Port, User: graphDBUpdateVo.User, Password: graphDBUpdateVo.Password, Type: graphDBUpdateVo.Type})
	controller.GraphDBService.UpdateGraphDB(graphDBUpdateVo)
	response.Ok(c)
}

// TestGraphDBConfig
// @Summary Test whether the storage configuration information is correct
// @Description Test whether the storage configuration information is correct
// @Tags Studio
// @Param testVo body vo.ConnTestVo true "Storage configuration information to be tested"
// @Router /api/studio/v1/graphdb/test [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "Server internal error"
// @Failure 400 {object} kw_errors.Error "Parameter error"
func (controller *GraphDBController) TestGraphDBConfig(c *gin.Context) {
	vo := &vo.ConnTestVo{}
	kw_errors.Try(c.ShouldBind(vo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(vo.Ip, vo.Port)
	vo.Ip, vo.Port = checkDuplicatesAddr(vo.Ip, vo.Port)
	controller.GraphDBService.TestConnConfig(vo)
	response.Ok(c)
}

// RemoveDuplicatesAddr 去除重复地址
func removeDuplicatesAddr(originIps, originPorts []string) (ips, ports []string) {
	ipPortsMap := map[string]bool{}
	ips = []string{}
	ports = []string{}
	for i, ip := range originIps {
		if !ipPortsMap[ip+":"+originPorts[i]] {
			ipPortsMap[ip+":"+originPorts[i]] = true
			ips = append(ips, ip)
			ports = append(ports, originPorts[i])
		}
	}
	return ips, ports
}

func checkIpPortCount(ips, ports []string) {
	if len(ips) != len(ports) {
		panic(kw_errors.ParameterError.SetDetailError("The number of ip and port is inconsistent"))
	}
}

func checkDuplicatesAddr(originIps, originPorts []string) (ips, ports []string) {
	if len(originIps) > 1 {
		return removeDuplicatesAddr(originIps, originPorts)
	}
	return originIps, originPorts
}

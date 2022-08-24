package controller

import (
	"github.com/gin-gonic/gin"
	"kw-studio/kw_errors"
	"kw-studio/model/vo"
	"kw-studio/service"
	"kw-studio/utils/response"
)

type GraphDBController struct {
	GraphDBService *service.GraphDBService
}

// GetGraphDBList 根据page和size获取存储记录及存储记录中的谱图
func (controller *GraphDBController) GetGraphDBList(c *gin.Context) {
	condition := &vo.GraphListSearchCondition{}
	kw_errors.Try(c.ShouldBind(condition)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.GraphDBService.GetGraphDBList(condition))
}

// GetGraphDBInfoById 根据id查询存储配置信息
func (controller *GraphDBController) GetGraphDBInfoById(c *gin.Context) {
	idVo := &vo.IdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.GraphDBService.GetGraphDBInfoById(idVo.ID))
}

func (controller *GraphDBController) GetGraphInfoByGraphDBId(c *gin.Context) {
	condition := &vo.GraphSearchCondition{}
	kw_errors.Try(c.ShouldBind(condition)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.GraphDBService.GetGraphInfoByGraphDBId(condition))
}

func (controller *GraphDBController) AddGraphDB(c *gin.Context) {
	graphDBVo := &vo.GraphDBVo{}
	kw_errors.Try(c.ShouldBind(graphDBVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(graphDBVo.Ip, graphDBVo.Port)
	graphDBVo.Ip, graphDBVo.Port = checkDuplicatesAddr(graphDBVo.Ip, graphDBVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: graphDBVo.Ip, Port: graphDBVo.Port, User: graphDBVo.User, Password: graphDBVo.Password, Type: graphDBVo.Type})
	response.Ok(c, controller.GraphDBService.AddGraphDB(graphDBVo))
}

func (controller *GraphDBController) DeleteGraphDBById(c *gin.Context) {
	idVo := &vo.IdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	checkGraphDBDefaultConfig(idVo.ID)
	controller.GraphDBService.DeleteGraphDBById(idVo.ID)
	response.Ok(c)
}

func (controller *GraphDBController) UpdateGraphDB(c *gin.Context) {
	graphDBUpdateVo := &vo.GraphDBUpdateVo{}
	kw_errors.Try(c.ShouldBind(graphDBUpdateVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(graphDBUpdateVo.Ip, graphDBUpdateVo.Port)
	checkGraphDBDefaultConfig(graphDBUpdateVo.ID)
	graphDBUpdateVo.Ip, graphDBUpdateVo.Port = checkDuplicatesAddr(graphDBUpdateVo.Ip, graphDBUpdateVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: graphDBUpdateVo.Ip, Port: graphDBUpdateVo.Port, User: graphDBUpdateVo.User, Password: graphDBUpdateVo.Password, Type: graphDBUpdateVo.Type})
	controller.GraphDBService.UpdateGraphDB(graphDBUpdateVo)
	response.Ok(c)
}

// TestGraphDBConfig 测试存储配置信息是否正确
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

func checkGraphDBDefaultConfig(id int) {
	if id == 1 {
		panic(kw_errors.ParameterError.SetDetailError("Default configuration cannot be deleted"))
	}
}

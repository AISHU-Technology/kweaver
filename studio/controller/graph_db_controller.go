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
// @Summary 根据page和size获取存储记录及存储记录中的谱图
// @Description 根据page和size获取存储记录及存储记录中的谱图
// @Tags Studio
// @Param page query int 1 "分页号"
// @Param size query int 0 "每页数量"
// @Param name query string orientdb_name "记录名称"
// @Param type query string orientdb "配置类型"
// @Param orderField query string created "排序字段"
// @Param order query string ASC "排序顺序"
// @Router /api/studio/v1/graphdb/list [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} vo.ListVo  "存储配置列表"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *GraphDBController) GetGraphDBList(c *gin.Context) {
	condition := &vo.GraphListSearchCondition{}
	kw_errors.Try(c.ShouldBind(condition)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.GraphDBService.GetGraphDBList(condition))
}

// GetGraphDBInfoById
// @Summary 根据id查询存储配置信息
// @Description 根据id查询存储配置信息
// @Tags Studio
// @Param id query int 1 "存储记录id"
// @Router /api/studio/v1/graphdb [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} vo.GraphDBVo "存储配置信息"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *GraphDBController) GetGraphDBInfoById(c *gin.Context) {
	idVo := &vo.IdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.GraphDBService.GetGraphDBInfoById(idVo.ID))
}

// GetGraphInfoByGraphDBId
// @Summary 根据id查询关联的图谱
// @Description 根据id查询关联的图谱
// @Tags Studio
// @Param page query int 1 "分页号"
// @Param size query int 0 "每页数量"
// @Param id query int 1 "存储记录id"
// @Router /api/studio/v1/graphdb/graph/list [get]
// @Accept  x-www-form-urlencoded
// @Produce json
// @Success 200 {object} vo.ListVo  "关联的图谱信息"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *GraphDBController) GetGraphInfoByGraphDBId(c *gin.Context) {
	condition := &vo.GraphSearchCondition{}
	kw_errors.Try(c.ShouldBind(condition)).Throw(kw_errors.ParameterError)
	response.Ok(c, controller.GraphDBService.GetGraphInfoByGraphDBId(condition))
}

// AddGraphDB
// @Summary 添加存储配置
// @Description 添加存储配置
// @Tags Studio
// @Param graphDBVo body vo.GraphDBVo true "添加的存储配置"
// @Router /api/studio/v1/graphdb/add [post]
// @Accept  json
// @Produce json
// @Success 200 {number} number "添加的存储配置id"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *GraphDBController) AddGraphDB(c *gin.Context) {
	graphDBVo := &vo.GraphDBVo{}
	kw_errors.Try(c.ShouldBind(graphDBVo)).Throw(kw_errors.ParameterError)
	checkIpPortCount(graphDBVo.Ip, graphDBVo.Port)
	graphDBVo.Ip, graphDBVo.Port = checkDuplicatesAddr(graphDBVo.Ip, graphDBVo.Port)
	controller.GraphDBService.TestConnConfig(&vo.ConnTestVo{Ip: graphDBVo.Ip, Port: graphDBVo.Port, User: graphDBVo.User, Password: graphDBVo.Password, Type: graphDBVo.Type})
	response.Ok(c, controller.GraphDBService.AddGraphDB(graphDBVo))
}

// DeleteGraphDBById
// @Summary 根据id删除存储配置
// @Description 根据id删除存储配置
// @Tags Studio
// @Param id body vo.IdVo true "存储配置id"
// @Router /api/studio/v1/graphdb/delete [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
func (controller *GraphDBController) DeleteGraphDBById(c *gin.Context) {
	idVo := &vo.IdVo{}
	kw_errors.Try(c.ShouldBind(idVo)).Throw(kw_errors.ParameterError)
	controller.GraphDBService.DeleteGraphDBById(idVo.ID)
	response.Ok(c)
}

// UpdateGraphDB
// @Summary 根据id更新存储配置
// @Description 根据id更新存储配置
// @Tags Studio
// @Param graphDBUpdateVo body vo.GraphDBUpdateVo true "存储配置更新信息"
// @Router /api/studio/v1/graphdb/update [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
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
// @Summary 测试存储配置信息是否正确
// @Description 测试存储配置信息是否正确
// @Tags Studio
// @Param testVo body vo.ConnTestVo true "待测试的存储配置信息"
// @Router /api/studio/v1/graphdb/test [post]
// @Accept  json
// @Produce json
// @Success 200 {string} string "ok"
// @Failure 500 {object} kw_errors.Error "服务内部异常"
// @Failure 400 {object} kw_errors.Error "参数异常"
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

// - 描述：服务入口
// - 时间：2020-2-29
package main

import (
	"github.com/gin-gonic/gin"
	"graph-engine/database"
	"graph-engine/docs"
	"graph-engine/leo"
	"graph-engine/utils"
)

// @title kw_engine
// @version 1.0.0
// @description KWeaver graph-engine and alg-server
// @license.name Apache 2.0
func main() {
	if !utils.CONFIG.SysConf.Debug {
		gin.SetMode(gin.ReleaseMode)
	}

	gin.ForceConsoleColor() // web console 日志颜色
	gin.DebugPrintRouteFunc = func(httpMethod, absolutePath, handlerName string, nuHandlers int) {
		//log.Printf("API %-6s %-25s --> %s (%d handlers)\n", httpMethod, absolutePath, handlerName, nuHandlers)
	}
	docs.SwaggerInfo.BasePath = "/api/engine/v1"
	// DB pool
	utils.InitConn()
	database.InitDB()

	ip := utils.CONFIG.SysConf.IP + ":" + utils.CONFIG.SysConf.Port
	var conf = leo.ServiceConfig{
		IPAddr:      ip,
		Debug:       utils.CONFIG.Debug,
		EnablePprof: utils.CONFIG.Pprof,
	}

	s := leo.NewService(conf)
	// 此处添加中间件，将自己的中间件添加即可。
	s.RegisterMidwares(leo.CORSMiddleware() /*utils.TokenVali(), utils.ShareAPI()*/, leo.Informer())
	s.RegisterRouterGroups(GroupGQLKGRouters)

	s.Start()
}

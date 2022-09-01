// - 描述：服务入口
// - 作者：张坤 (zhang.kun@aishu.cn)
// - 时间：2020-2-29
package main

import (
	"github.com/gin-gonic/gin"
	"gitlab.aishu.cn/anydata-rnd/leo"
	"graph-engine/database"
	"graph-engine/utils"
)

func main() {
	if !utils.CONFIG.SysConf.Debug {
		gin.SetMode(gin.ReleaseMode)
	}

	gin.ForceConsoleColor() // web console 日志颜色
	gin.DebugPrintRouteFunc = func(httpMethod, absolutePath, handlerName string, nuHandlers int) {
		//log.Printf("API %-6s %-25s --> %s (%d handlers)\n", httpMethod, absolutePath, handlerName, nuHandlers)
	}

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

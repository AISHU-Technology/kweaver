// - 描述：服务入口
// - 作者：张坤 (zhang.kun@aishu.cn)
// - 时间：2020-2-29
package main

import (
	"fmt"
	"graph-engine/logger"

	"github.com/gin-gonic/gin"
	"gitlab.aishu.cn/anydata-rnd/leo"
	v1_1_1 "graph-engine/database/models/v1.1.1"
	"graph-engine/database/operation"
	"graph-engine/utils"
	"reflect"
	"strings"
)

func InitDB() {
	// 版本集合，需要每次追加
	var MigrageStruct = []interface{}{&operation.V_1_1_1{}}
	databaseVersion := "engine-1.1.1"

	if databaseVersion == "" {
		panic("please input engine database version to upgraded in job")
	}
	logger.Info("engine database version to upgraded is", databaseVersion)

	databaseVersion = strings.Split(databaseVersion, "-")[1]
	databaseVersionDeal := strings.ReplaceAll("V_"+databaseVersion, ".", "_")

	db := operation.GormEngine()

	// 获取当前子系统版本
	existVersion := db.Migrator().HasTable(&v1_1_1.Version{})
	var engineVersion string

	if existVersion {
		currentVersion := v1_1_1.Version{}
		err := db.Model(&v1_1_1.Version{}).Where("id = ?", 1).Find(&currentVersion).Error
		if err != nil {
			logger.Error(err)
			panic(err)
		}
		engineVersion = currentVersion.EngineVersion
	}

	if existVersion && engineVersion != "" {
		logger.Info(fmt.Sprintf("current engine database version is %s", engineVersion))

		engineVersion = strings.Split(engineVersion, "-")[1]
		currentVersionDeal := strings.ReplaceAll("V_"+engineVersion, ".", "_")

		// 对比变更版本与当前版本
		if strings.Compare(databaseVersion, engineVersion) == 0 {
			logger.Info("current engine version is the latest version, no upgrade is required")
			return
		} else {
			var searchNum int
			var progressIndex int
			var systemIndex int
			for k, v := range MigrageStruct {
				typeofv := reflect.TypeOf(v).Elem()
				// 在版本不一致的情况下，看先匹配到谁
				if strings.Index(typeofv.Name(), databaseVersionDeal) == 0 {
					progressIndex = k
					// 匹配到不做查询次数搜索
					continue
				}
				if strings.Index(typeofv.Name(), currentVersionDeal) == 0 {
					systemIndex = k
					// 匹配到不做查询次数搜索
				}
				// 每次查询均记录次数，找不到升级方案，报错。
				searchNum = searchNum + 1
			}
			if searchNum == len(MigrageStruct) {
				// 未找到可升级版本
				logger.Error(fmt.Sprintf("no engine database version to operate, current vesion is %s", engineVersion))
				return
			}
			// 处理版本差异值
			versionDiffValue := progressIndex - systemIndex
			if progressIndex > systemIndex {
				// 如果程序索引大于系统索引，就是要升级。
				for j := systemIndex + 1; j <= systemIndex+versionDiffValue; j++ {
					reflect.ValueOf(MigrageStruct[j]).MethodByName("Update").Call([]reflect.Value{})
				}

			} else {
				// 暂不支持降级
				logger.Error("does not support downgrade at the moment")
				panic("does not support downgrade at the moment")
			}
		}

	} else {
		// 表不存在逻辑
		var searchNum int
		for k, v := range MigrageStruct {
			typeof := reflect.TypeOf(v).Elem()
			// 如果匹配到了当前版本，就走默认安装即可。
			if strings.Index(typeof.Name(), databaseVersionDeal) == 0 {
				reflect.ValueOf(MigrageStruct[k]).MethodByName("DBInit").Call([]reflect.Value{})
				break
			} else {
				searchNum = searchNum + 1
			}
		}

		if searchNum == len(MigrageStruct) {
			logger.Error("not find available engine database version")
			panic("not find available engine database version")
		}
	}

	//logger.Info("database initialization success")
}
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
	InitDB()

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

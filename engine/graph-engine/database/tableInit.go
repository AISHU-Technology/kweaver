package database

import (
	"fmt"
	v1_1_1 "graph-engine/database/models/v1.1.1"
	"graph-engine/database/operation"
	"graph-engine/logger"
	"graph-engine/utils"
	"reflect"
	"strings"
)

// 版本集合，需要每次追加
var MigrageStruct = []interface{}{&operation.V_1_1_1{}}

func InitDB() {
	// 此版本用来确定当前程序版本
	//databaseVersion := os.Getenv("ENGINEVERSION")
	databaseVersion := "engine-1.1.1"

	if databaseVersion == "" {
		panic("please input engine database version to upgraded in job")
	}
	logger.Info("engine database version to upgraded is", databaseVersion)

	databaseVersion = strings.Split(databaseVersion, "-")[1]
	databaseVersionDeal := strings.ReplaceAll("V_"+databaseVersion, ".", "_")

	db := utils.DBENGINE

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

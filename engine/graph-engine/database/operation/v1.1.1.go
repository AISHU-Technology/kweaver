package operation

import (
	"fmt"
	v1_1_1 "graph-engine/database/models/v1.1.1"
	"graph-engine/logger"
	"time"
)

// Base Version
type V_1_1_1 struct {
}

func (v *V_1_1_1) Update() {
	logger.Info("current engine database version is base version")
	return
}

//// (暂时不做降级回滚)
//func (v *V_1_0) RollBack() {
//	logger.Info("current version is base version")
//}

func (v *V_1_1_1) DBInit() {
	db := GormEngine()

	// 检测SearchConfig结构体对应的表是否存在
	if !db.Migrator().HasTable(&v1_1_1.SearchConfig{}) {
		err := db.Migrator().AutoMigrate(&v1_1_1.SearchConfig{})
		if err != nil {
			logger.Error(fmt.Sprintf("create search_config error: %s", err))
			panic(err)
		}

		db.Create(&v1_1_1.SearchConfig{
			ID:          0,
			ConfName:    "",
			Type:        "",
			ConfDesc:    "",
			KGID:        0,
			ConfContent: "",
			CreateTime:  time.Time{},
			UpdateTime:  time.Time{},
			//CreateUser:  "",
			//UpdateUser:  "",
		})

		//logger.Info("search_config success")
	}

	// 检查EngineVersion结构体对用的表是否存在
	if !db.Migrator().HasTable(&v1_1_1.Version{}) {
		err := db.Migrator().AutoMigrate(&v1_1_1.Version{})
		if err != nil {
			logger.Error(fmt.Sprintf("create version error: %s", err))
			panic(err)
		}

		db.Create(&v1_1_1.Version{
			ID:            1,
			EngineVersion: "engine-1.1.1",
		})
	} else {
		db.Model(&v1_1_1.Version{}).Where("id = ?", 1).Update("engine_version", "engine-1.1.1")
	}

	logger.Info(fmt.Sprintf("database version %s initialization success", "engine-1.1.1"))
}

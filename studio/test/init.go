package test

import (
	"gorm.io/gorm/logger"
	"kw-studio/global"
	"kw-studio/initialize"
	"time"
)

var Logger logger.Interface

func init() {
	global.Config = initialize.Config("./config.yaml")
	global.LOG = initialize.Zap()
	Logger = initialize.NewZapGormLogger(
		global.LOG,
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.LogLevel(global.Config.Mariadb.LogLevel),
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)
}

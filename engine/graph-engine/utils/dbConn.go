package utils

import (
	"database/sql"
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
	logger2 "graph-engine/logger"
	"log"
	"os"
	"time"
)

//用来获取数据库连接
var (
	DBENGINE *gorm.DB
	DBCONN   *sql.DB
)

func InitConn() {
	var err error

	//dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?multiStatements=true", "anydata",
	//	"Qwe123!@#", "10.4.106.255", "3320",
	//	"anydata")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?multiStatements=true",
		os.Getenv("RDSUSER"),
		os.Getenv("RDSPASS"),
		os.Getenv("RDSHOST"),
		os.Getenv("RDSPORT"),
		os.Getenv("RDSDBNAME"))
	logger2.Info(dsn)
	LOGGER := logger.New(
		log.New(os.Stdout, "", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Silent,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)

	DBENGINE, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
		Logger: LOGGER,
	})

	// 连接不处理错误
	if err != nil {
		// 若连接失败，直接报错
		panic(err)
	} else {
		DBCONN, _ = DBENGINE.DB()
		DBCONN.SetConnMaxLifetime(time.Hour)
		DBCONN.SetMaxIdleConns(5)
		DBCONN.SetMaxOpenConns(100)

	}
}

// 兼容原生sql.DB
func GetConnect() *sql.DB {
	return DBCONN
}

func GetGormEngine() *gorm.DB {
	return DBENGINE
}

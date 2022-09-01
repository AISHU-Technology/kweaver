package operation

//
//import (
//	"database/sql"
//	"fmt"
//	"gorm.io/driver/mysql"
//	"gorm.io/gorm"
//	"gorm.io/gorm/logger"
//	"gorm.io/gorm/schema"
//	logger2 "graph-engine/logger"
//	"log"
//	"os"
//	"time"
//)
//
//// 用来获取数据库连接
//var (
//	dbEngine *gorm.DB
//	dbConn   *sql.DB
//)
//
//func init() {
//	var err error
//
//	//dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?multiStatements=true", utils.CONFIG.MariaConf.User,
//	//	utils.CONFIG.MariaConf.Pwd, utils.CONFIG.MariaConf.IP, utils.CONFIG.MariaConf.Port,
//	//	utils.CONFIG.MariaConf.Db)
//
//	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?multiStatements=true",
//		os.Getenv("RDSUSER"),
//		os.Getenv("RDSPASS"),
//		os.Getenv("RDSHOST"),
//		os.Getenv("RDSPORT"),
//		os.Getenv("RDSDBNAME"))
//
//	logger2.Info(dsn)
//	LOGGER := logger.New(
//		log.New(os.Stdout, "", log.LstdFlags),
//		logger.Config{
//			SlowThreshold:             time.Second,
//			LogLevel:                  logger.Silent,
//			IgnoreRecordNotFoundError: true,
//			Colorful:                  false,
//		},
//	)
//
//	dbEngine, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
//		NamingStrategy: schema.NamingStrategy{
//			SingularTable: true,
//		},
//		Logger: LOGGER,
//	})
//
//	// 连接不处理错误
//	if err != nil {
//		// 若连接失败，直接报错
//		panic(err)
//	} else {
//		dbConn, _ = dbEngine.DB()
//		dbConn.SetConnMaxLifetime(time.Hour)
//		dbConn.SetMaxIdleConns(5)
//		dbConn.SetMaxOpenConns(100)
//
//	}
//}
//
//func GormEngine() *gorm.DB {
//	return dbEngine
//}

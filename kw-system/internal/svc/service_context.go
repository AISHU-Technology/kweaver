package svc

import (
	"github.com/AISHU-Technology/kw-go-core/orm/gormx"
	"github.com/AISHU-Technology/kw-go-core/redis"
	"gorm.io/gorm"
	"kw-system/internal/config"
)

type ServiceContext struct {
	Config  config.Config
	DB      *gorm.DB
	RedisDB *redis.Redis
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config:  c,
		DB:      gormx.InitGormConf(c.DataSources),
		RedisDB: redis.InitRedisConf(c.RedisDb),
	}
}

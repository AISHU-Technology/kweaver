package config

import (
	"github.com/AISHU-Technology/kw-go-core/orm/gormx"
	"github.com/AISHU-Technology/kw-go-core/redis"
	"github.com/zeromicro/go-zero/rest"
)

type Config struct {
	rest.RestConf
	//service.ServiceConf
	DataSources gormx.GormConf
	RedisDb     redis.RedisConf
}

package global

import (
	"github.com/go-redis/redis/v8"
	"github.com/kgip/redis-lock/lock"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"kw-studio/config"
)

var (
	DB           *gorm.DB
	Config       *config.Config
	LOG          *zap.Logger
	Redis        redis.Cmdable
	LockOperator lock.LockOperator //redis分布式锁
)

package initialize

import (
	"context"
	"fmt"
	"github.com/go-redis/redis/v8"
	"github.com/kgip/redis-lock/adapters"
	"github.com/kgip/redis-lock/lock"
	"go.uber.org/zap"
	"kw-studio/global"
)

func Redis() redis.Cmdable {
	var client redis.Cmdable
	if global.Config.Redis.Mode == "stand-alone" {
		client = redis.NewClient(&redis.Options{
			Addr:     fmt.Sprintf("%s:%s", global.Config.Redis.Host, global.Config.Redis.Port),
			Username: global.Config.Redis.User,
			Password: global.Config.Redis.Password, // no password set
			DB:       global.Config.Redis.DB,       // use default DB
		})
	} else if global.Config.Redis.Mode == "sentinel" {
		sentinelAddrs := make([]string, len(global.Config.Redis.Sentinel))
		for i, sentinel := range global.Config.Redis.Sentinel {
			sentinelAddrs[i] = fmt.Sprintf("%v:%v", sentinel["host"], sentinel["port"])
		}
		client = redis.NewFailoverClusterClient(&redis.FailoverOptions{
			MasterName:       global.Config.Redis.MasterName,
			SentinelUsername: global.Config.Redis.SentinelUsername,
			SentinelPassword: global.Config.Redis.SentinelPassword,
			Username:         global.Config.Redis.User,
			Password:         global.Config.Redis.Password,
			SentinelAddrs:    sentinelAddrs,
			DB:               global.Config.Redis.DB,
			RouteRandomly:    true,
		})
	} else {
		global.LOG.Panic(fmt.Sprintf("unknown mode: %s", global.Config.Redis.Mode))
	}
	pong, err := client.Ping(context.Background()).Result()
	if err != nil {
		global.LOG.Error("redis connect ping failed, err:", zap.Any("err", err))
	} else {
		global.LOG.Info("redis connect ping response:", zap.String("pong", pong))
	}
	global.LockOperator = lock.NewRedisLockOperator(adapters.NewGoRedisV8Adapter(global.Redis))
	return client
}

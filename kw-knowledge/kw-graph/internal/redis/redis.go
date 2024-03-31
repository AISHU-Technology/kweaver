package redis

import (
	"context"
	"fmt"
	"github.com/go-redis/redis/v8"
	"github.com/zeromicro/go-zero/core/logx"
	"kw-graph/internal/config"
	"sync"
)

const (
	// RedisTypeSentinel redis哨兵模式
	RedisTypeSentinel = "sentinel"
	// RedisTypeStandalone redis单机模式
	RedisTypeStandalone = "standalone"
	// RedisTypeMasterSlave redis主从模式
	RedisTypeMasterSlave = "master-slave"
)

var (
	rdConnOnce sync.Once
	rdConn     *RedisConn
)

type RedisConn struct {
	WriteCli *redis.Client // 负责写操作
	ReadCli  *redis.Client // 负责读操作
}

// NewRedisConn 创建Redis连接对象
func NewRedisConn(c *config.Config, dbNumber int) *RedisConn {

	rdConn = &RedisConn{}

	switch c.Redis.ConnectType {
	case RedisTypeSentinel:
		rdConn.WriteCli = redis.NewFailoverClient(&redis.FailoverOptions{
			MasterName:       c.Redis.SentinelMasterName,
			SentinelAddrs:    []string{fmt.Sprintf("%s:%d", c.Redis.RedisHost, c.Redis.RedisPort)},
			Username:         c.Redis.RedisUser,
			Password:         c.Redis.RedisPass,
			SentinelUsername: c.Redis.SentinelName,
			SentinelPassword: c.Redis.SentinelPass,
			DB:               dbNumber,
		})
		rdConn.ReadCli = rdConn.WriteCli
	case RedisTypeStandalone:
		rdConn.WriteCli = redis.NewClient(&redis.Options{
			Addr:     fmt.Sprintf("%s:%d", c.Redis.RedisHost, c.Redis.RedisPort),
			Username: c.Redis.RedisUser,
			Password: c.Redis.RedisPass,
			DB:       dbNumber,
		})
		rdConn.ReadCli = rdConn.WriteCli
	case RedisTypeMasterSlave:
		// 华为云环境下，尝试区分主从节点
		rdConn.WriteCli = redis.NewClient(&redis.Options{
			Addr:     fmt.Sprintf("%s:%d", c.Redis.RedisWriteHost, c.Redis.RedisWritePort),
			Username: c.Redis.RedisWriteUser,
			Password: c.Redis.RedisWritePass,
			DB:       dbNumber,
		})
		if c.Redis.RedisReadHost != "" {
			rdConn.ReadCli = redis.NewClient(&redis.Options{
				Addr:     fmt.Sprintf("%s:%d", c.Redis.RedisReadHost, c.Redis.RedisReadPort),
				Username: c.Redis.RedisReadUser,
				Password: c.Redis.RedisReadPass,
				DB:       dbNumber,
			})
		} else {
			rdConn.ReadCli = rdConn.WriteCli
		}
	default:
		logx.Errorf("redis connect type should be one of %s, %s, %s", RedisTypeSentinel, RedisTypeMasterSlave, RedisTypeStandalone)
		panic(fmt.Sprintf("redis connect type should be one of %s, %s, %s", RedisTypeSentinel, RedisTypeMasterSlave, RedisTypeStandalone))
	}

	return rdConn
}

// HGetAll 返回名称为key的hash中所有的键（field）及其对应的value
func (r *RedisConn) HGetAll(ctx context.Context, key string) *redis.StringStringMapCmd {
	return r.ReadCli.HGetAll(ctx, key)
}

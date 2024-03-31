// Package config 配置列表文件
package config

import (
	"github.com/AISHU-Technology/kw-go-core/orm/gormx"
	"github.com/zeromicro/go-zero/rest"
)

// Config 配置加载的顺序会优先级 env > 配置中的定义 > json tag 中的 default 定义
// nolint
type Config struct {
	rest.RestConf
	DataSources gormx.GormConf

	Builder struct {
		BuilderHost string `json:"BuilderHost"`
		BuilderPort int    `json:"BuilderPort"`
	}

	Redis struct {
		ConnectType        string `json:"ConnectType,env=REDISCLUSTERMODE"`
		SentinelMasterName string `json:"SentinelMasterName,env=SENTINELMASTER"`
		SentinelName       string `json:"SentinelName,env=SENTINELUSER"`
		SentinelPass       string `json:"SentinelPass,env=SENTINELPASS"`
		RedisHost          string `json:"RedisHost,env=REDISHOST"`
		RedisPort          int    `json:"RedisPort,env=REDISPORT"`
		RedisUser          string `json:"RedisUser,env=REDISUSER"`
		RedisPass          string `json:"RedisPass,env=REDISPASS"`
		RedisReadHost      string `json:"RedisReadHost,env=REDISREADHOST"`
		RedisReadPort      int    `json:"RedisReadPort,env=REDISREADPORT"`
		RedisReadUser      string `json:"RedisReadUser,env=REDISREADUSER"`
		RedisReadPass      string `json:"RedisReadPass,env=REDISREADPASS"`
		RedisWriteHost     string `json:"RedisWriteHost,env=REDISWRITEHOST"`
		RedisWritePort     int    `json:"RedisWritePort,env=REDISWRITEPORT"`
		RedisWriteUser     string `json:"RedisWriteUser,env=REDISWRITEUSER"`
		RedisWritePass     string `json:"RedisWritePass,env=REDISWRITEPASS"`
	}

	Nebula struct {
		NebulaHost string `json:"NebulaHost,env=GRAPHDB_HOST"`
		NebulaPort int    `json:"NebulaPort,env=GRAPHDB_PORT"`
		NebulaUser string `json:"NebulaUser,env=GRAPHDB_READ_ONLY_USER"`
		NebulaPass string `json:"NebulaPass,env=GRAPHDB_READ_ONLY_PASSWORD"`
	}

	OpenSearch struct {
		OpenSearchHost string `json:"OpenSearchHost,env=OPENSEARCH_HOST"`
		OpenSearchPort int    `json:"OpenSearchPort,env=OPENSEARCH_PORT"`
		OpenSearchUser string `json:"OpenSearchUser,env=OPENSEARCH_USER"`
		OpenSearchPass string `json:"OpenSearchPass,env=OPENSEARCH_PASS"`
	}
}

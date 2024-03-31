// Package svc 依赖项 声明及实例化
package svc

import (
	"gorm.io/gorm"
	"kw-graph/internal/config"
	"kw-graph/internal/drivenadapter/builder"
	"kw-graph/internal/graphdb/nebula"
	"kw-graph/internal/graphdb/nebula/basicsearch"
	"kw-graph/internal/graphdb/nebula/customsearch"
	"kw-graph/internal/graphdb/nebula/graphexplore"
	"kw-graph/internal/logic/repo"
	"kw-graph/internal/model/canvas"
	"kw-graph/internal/opensearch"
	"kw-graph/internal/redis"
	"kw-graph/utils/httpclient"
	"time"
)

// ServiceContext 所有依赖
type ServiceContext struct {
	Builder              repo.BuilderRepo          // Builder接口调用实例
	CanvasManager        repo.CanvasesRepo         // 画布管理实例
	GraphBasicSearchRepo repo.GraphBasicSearchRepo // 基础查询repo实例
	CustomSearchRepo     repo.CustomSearchRepo     // 自定义查询repo实例
	GraphExploreRepo     repo.GraphExploreRepo     // 图探索分析repo
	Nebula               nebula.NebulaExecuteRepo  // Nebula基础查询实例
	OpenSearch           repo.OpenSearchRepo       // OpenSearch实例
	RedisOpRepo          repo.RedisOpRepo          // redis操作实例
}

func NewServiceContext(c config.Config, mysqlDB *gorm.DB) *ServiceContext {
	httpClient := httpclient.NewHTTPClientEx(time.Second * 600)
	nebulaRepo := nebula.NewNebulaDB(c.Nebula.NebulaHost, c.Nebula.NebulaUser, c.Nebula.NebulaPass, c.Nebula.NebulaPort)
	openSearch := opensearch.NewOpenSearchClient(c.OpenSearch.OpenSearchHost, c.OpenSearch.OpenSearchUser, c.OpenSearch.OpenSearchPass, c.OpenSearch.OpenSearchPort)
	return &ServiceContext{
		Builder:              builder.NewBuilderRepo(httpClient, c.Builder.BuilderHost, c.Builder.BuilderPort),
		CanvasManager:        canvas.NewCanvasesRepo(mysqlDB),
		GraphBasicSearchRepo: basicsearch.NewGraphBasicSearchRepo(nebulaRepo),
		CustomSearchRepo:     customsearch.NewCustomSearchRepo(nebulaRepo),
		GraphExploreRepo:     graphexplore.NewGraphExploreRepo(nebulaRepo),
		Nebula:               nebulaRepo,
		OpenSearch:           opensearch.NewOpenSearchRepo(openSearch),
		RedisOpRepo:          redis.NewRedisOperationRepo(redis.NewRedisConn(&c, 3)),
	}
}

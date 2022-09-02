// - 描述：服务路由
// - 作者：张坤 (zhang.kun@aishu.cn)
// - 时间：2020-2-29
package main

import (
	"graph-engine/controllers"
	"graph-engine/services"
	"time"

	"github.com/gin-contrib/cache/persistence"
	"graph-engine/leo"
)

var uriRoot = "api/engine/"

var store = persistence.NewInMemoryStore(time.Second)

// GroupRouters is the router of service

var GroupGQLKGRouters = map[string][]leo.Router{
	uriRoot + "v1": {
		// 健康检测
		leo.NewRouter("get", "/health/ready", controllers.ReadyHandler),
		leo.NewRouter("get", "/health/alive", controllers.AliveHandler),
		// GQL API
		leo.NewRouter("post", "/kg/", controllers.KGGqlHandler),
		leo.NewRouter("post", "/explore/", controllers.ExploreGqlHandler),
		// Orientdb sql API
		leo.NewRouter("post", "/sql/:id", services.SearchSQLHandler),

		// 分析详情
		leo.NewRouter("get", "/analysis", services.AnalysisHandler),
		// 智能搜索接口（2AD）
		leo.NewRouter("get", "/adv-search/:confid", services.AdvSearchHandler),
		leo.NewRouter("post", "/adv-search/test", services.AdvSearchTestHandler),
		// 高级搜索配置
		leo.NewRouter("get", "/adv-search-config", services.GetAdvSearchConfigHandler),
		leo.NewRouter("delete", "/adv-search-config", services.DelAdvSearchConfigHandler),
		leo.NewRouter("post", "/adv-search-config", services.AddAdvSearchConfigHandler),
		leo.NewRouter("post", "/adv-search-config/update", services.UpdateAdvSearchConfigHandler),
		leo.NewRouter("get", "/adv-search-config/info/:confid", services.GetInfoAdvSearchConfigHandler),
		leo.NewRouter("get", "/adv-search-config/conf/:kgid", services.GetConfByKGNameAdvSearchConfigHandler),
		leo.NewRouter("post", "/adv-search-config/kglist", services.KGListAdvSearchConfigHandler),
		// 搜索过滤属性下拉列表
		leo.NewRouter("post", "/properties", services.GetPropertiesHandler),
		// 探索两点间关系
		leo.NewRouter("post", "/explore/relation", services.ExploreRelationHandler),
		//扩展点
		leo.NewRouter("get", "/explore/expandv", services.KGExpandVHandler),
	},
}

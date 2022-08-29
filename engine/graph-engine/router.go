// - 描述：服务路由
// - 作者：张坤 (zhang.kun@aishu.cn)
// - 时间：2020-2-29
package main

import (
	"graph-engine/controllers"
	"graph-engine/services"
	"time"

	"github.com/gin-contrib/cache"
	"github.com/gin-contrib/cache/persistence"
	"gitlab.aishu.cn/anydata-rnd/leo"
)

var uriRoot = "api/engine/"

var store = persistence.NewInMemoryStore(time.Second)

// GroupRouters is the router of service
var GroupRouters = map[string][]leo.Router{
	uriRoot + "v1": {
		// KGDemo 使用的 RESTful API（已废弃，待删除）
		leo.NewRouter("post", "/search", controllers.SearchHandler),
		leo.NewRouter("post", "/searchv2", controllers.SearchHandlerV2),
		leo.NewRouter("get", "/click", cache.CachePage(store, 3*time.Second, controllers.ClickHandler)),
	},
}

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
		// 搜一搜（待删）
		leo.NewRouter("get", "/recommend", services.RecommendHandler),
		// 智能搜索采纳日志（待删）
		leo.NewRouter("post", "/adv-search/feedback", services.AdvSearchFeedBackLog),
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
		// 搜索界面图谱下拉列表（待删）
		leo.NewRouter("get", "/search-kglist", services.SearchKGListHandler),
		// 搜索过滤属性下拉列表
		leo.NewRouter("post", "/properties", services.GetPropertiesHandler),
		// 探索两点间关系
		leo.NewRouter("post", "/explore/relation", services.ExploreRelationHandler),
		//扩展点
		leo.NewRouter("get", "/explore/expandv", services.KGExpandVHandler),
	},
}

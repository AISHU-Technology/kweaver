// - 描述：服务路由
// - 时间：2020-2-29
package main

import (
	"github.com/swaggo/files"       // swagger embed files
	"github.com/swaggo/gin-swagger" // gin-swagger middleware
	"graph-engine/controllers"
	"graph-engine/services"
	"time"

	"github.com/gin-contrib/cache/persistence"
	"graph-engine/leo"
)

var uriRoot = "api/engine/"
var s = ""

var store = persistence.NewInMemoryStore(time.Second)

// GroupRouters is the router of service

var GroupGQLKGRouters = map[string][]leo.Router{
	s: {
		leo.NewRouter("get", "/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler)),
	},
	uriRoot + "v1": {
		// 健康检测
		leo.NewRouter("get", "/health/ready", controllers.ReadyHandler),
		leo.NewRouter("get", "/health/alive", controllers.AliveHandler),

		// Orientdb sql API
		leo.NewRouter("post", "/sql/:id", services.SearchSQLHandler),

		// GQL API
		leo.NewRouter("post", "/kg/", controllers.KGGqlHandler),
		leo.NewRouter("post", "/explore/", controllers.ExploreGqlHandler),
		// 搜索过滤属性下拉列表
		leo.NewRouter("post", "/properties", services.GetPropertiesHandler),
		//explore
		leo.NewRouter("post", "/explore/:id/searchv", services.KGSearchVHandler),
		leo.NewRouter("post", "/explore/:id/searche", services.KGSearchEHandler),
		leo.NewRouter("post", "/explore/:id/expande", services.KGExpandEHandler),
		// 探索两点间关系
		//leo.NewRouter("post", "/explore/relation", services.ExploreRelationHandler),
		//扩展点
		leo.NewRouter("get", "/explore/expandv", services.KGExpandVHandler),
		//探索路径
		leo.NewRouter("post", "/explore/path", services.ExplorePathHandler),
		leo.NewRouter("post", "/explore/pathDetail", services.PathDetail),
		// 分析详情
		leo.NewRouter("get", "/analysis", services.AnalysisHandler),

		// 知识网络搜索接口
		leo.NewRouter("get", "/adv-search/:confid", services.AdvSearchHandler),
		leo.NewRouter("post", "/adv-search/test", services.AdvSearchTestHandler),
		leo.NewRouter("get", "/adv-search/document", services.AdvSearchDocumentHandler),
		// 知识网络搜索配置
		leo.NewRouter("get", "/adv-search-config", services.GetAdvSearchConfigHandler),
		leo.NewRouter("delete", "/adv-search-config", services.DelAdvSearchConfigHandler),
		leo.NewRouter("post", "/adv-search-config", services.AddAdvSearchConfigHandler),
		leo.NewRouter("post", "/adv-search-config/update", services.UpdateAdvSearchConfigHandler),
		leo.NewRouter("get", "/adv-search-config/info/:confid", services.GetInfoAdvSearchConfigHandler),
		//leo.NewRouter("get", "/adv-search-config/conf/:kgid", services.GetConfByKGNameAdvSearchConfigHandler),
		leo.NewRouter("post", "/adv-search-config/kglist", services.KGListAdvSearchConfigHandler),
		leo.NewRouter("post", "/adv-search-config/kglist-backward", services.KGIDBackwardHandler),
	},
}

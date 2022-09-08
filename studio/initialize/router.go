package initialize

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	swaggerFiles "github.com/swaggo/files"
	gs "github.com/swaggo/gin-swagger"
	"kw-studio/controller"
	"kw-studio/global"
	"kw-studio/middleware"
	"kw-studio/validators"
)

/**
 * @Author: Xiangguang.li
 * @Date: 2022/8/20
 * @Email: Xiangguang.li@aishu.cn
 **/

var (
	GraphDBController    *controller.GraphDBController
	OpenSearchController *controller.OpenSearchController
	SwaggerController    *controller.SwaggerController
)

//创建controller对象
func initAPIs() {
	GraphDBController = &controller.GraphDBController{
		GraphDBService: GraphDBService,
	}
	OpenSearchController = &controller.OpenSearchController{
		OpenSearchService: OpenSearchService,
		GraphDBService:    GraphDBService,
	}
	SwaggerController = &controller.SwaggerController{
		SwaggerService: SwaggerService,
	}
}

func registerValidation() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("ipList", validators.CheckIpList)
		v.RegisterValidation("portList", validators.CheckPortList)
		v.RegisterValidation("graphdbName", validators.CheckGraphDBName)
		v.RegisterValidation("ip", validators.CheckIp)
	}
}

func Router() *gin.Engine {
	router := gin.New()
	InitServices() //初始化service层对象
	initAPIs()     //初始化controller层对象
	registerValidation()

	router.Use(middleware.ZapLogger(global.LOG), middleware.ErrorHandler)
	router.GET("/swagger/*any", gs.WrapHandler(swaggerFiles.Handler))
	r1 := router.Group("/api/studio/v1")
	{
		//graphdb
		r1.GET("/graphdb/list", GraphDBController.GetGraphDBList)
		r1.GET("/graphdb/graph/list", GraphDBController.GetGraphInfoByGraphDBId)
		r1.GET("/graphdb", GraphDBController.GetGraphDBInfoById)
		r1.POST("/graphdb/add", GraphDBController.AddGraphDB)
		r1.POST("/graphdb/delete", GraphDBController.DeleteGraphDBById)
		r1.POST("/graphdb/update", GraphDBController.UpdateGraphDB)
		r1.POST("/graphdb/test", GraphDBController.TestGraphDBConfig)

		//opensearch
		r1.GET("/opensearch/list", OpenSearchController.GetOpenSearchList)
		r1.GET("/opensearch", OpenSearchController.GetOpenSearchInfoById)
		r1.POST("/opensearch/add", OpenSearchController.AddOpenSearch)
		r1.POST("/opensearch/delete", OpenSearchController.DeleteOpenSearchById)
		r1.POST("/opensearch/update", OpenSearchController.UpdateOpenSearch)
		r1.POST("/opensearch/test", OpenSearchController.TestOpenSearchConfig)

		//swagger
		r1.GET("/swaggerDoc", SwaggerController.GetSwaggerDoc)
	}
	return router
}

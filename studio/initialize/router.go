package initialize

import (
	"bytes"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	jsoniter "github.com/json-iterator/go"
	swaggerFiles "github.com/swaggo/files"
	gs "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
	"io/ioutil"
	"kw-studio/controller"
	"kw-studio/global"
	"kw-studio/middleware"
	"kw-studio/validators"
	"time"
)

var (
	GraphDBController    *controller.GraphDBController
	OpenSearchController *controller.OpenSearchController
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
}

func registerValidation() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("ipList", validators.CheckIpList)
		v.RegisterValidation("portList", validators.CheckPortList)
		v.RegisterValidation("graphdbName", validators.CheckGraphDBName)
		v.RegisterValidation("ip", validators.CheckIp)
	}
}

// ZapLogger 接收gin框架默认的日志
func ZapLogger(lg *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery
		post := ""

		if c.Request.Method == "POST" {
			// 把request的内容读取出来
			bodyBytes, _ := ioutil.ReadAll(c.Request.Body)
			c.Request.Body.Close()
			// 把刚刚读出来的再写进去
			c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))
			switch c.ContentType() {
			case "application/json":
				var result map[string]interface{}
				d := jsoniter.NewDecoder(bytes.NewReader(bodyBytes))
				d.UseNumber()
				if err := d.Decode(&result); err == nil {
					bt, _ := jsoniter.Marshal(result)
					post = string(bt)
				}
			default:
				post = string(bodyBytes)
			}
		}

		c.Next()

		cost := time.Since(start)
		lg.Info(path,
			zap.Int("status", c.Writer.Status()),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.String("post", post),
			zap.String("ip", c.ClientIP()),
			zap.String("user-agent", c.Request.UserAgent()),
			zap.String("errors", c.Errors.ByType(gin.ErrorTypePrivate).String()),
			zap.Duration("cost", cost),
		)
	}
}

func Router() *gin.Engine {
	router := gin.New()
	InitServices() //初始化service层对象
	initAPIs()     //初始化controller层对象
	registerValidation()

	router.Use(ZapLogger(global.LOG), middleware.ErrorHandler)
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
	}
	return router
}

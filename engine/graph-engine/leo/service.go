// Package leo 提供了 Web 框架使用的工具集
// - 描述：创建一个 Web service 容器
// - 作者：陈骁 (xavier.chen@eisoo.com)
// - 时间：2020-1-4
package leo

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/pprof"
	"github.com/gin-gonic/gin"
)

// ServiceConfig 表示 Web 服务的配置信息
type ServiceConfig struct {
	IPAddr      string // IpAddr 地址和端口 ip:port
	Debug       bool   // 是否开启 Debug
	EnablePprof bool   // 是否开启 pprof 调优
}

// Service Web 为一个服务容器
type Service struct {
	conf   ServiceConfig // 服务的配置
	engine *gin.Engine   // 服务容器
	//midwares []gin.HandlerFunc // 中间件
	//routers  []Router          // 路由
}

// NewService 创造一个服务
func NewService(conf ServiceConfig) *Service {
	if conf.Debug == false {
		gin.SetMode(gin.ReleaseMode)
	}
	s := new(Service)
	s.conf = conf
	s.engine = gin.Default()

	if conf.EnablePprof {
		pprof.Register(s.engine)
	}

	return s
}

// NewServiceWithEngine 创造一个服务，并设置自动一的 engine
func NewServiceWithEngine(conf ServiceConfig, e *gin.Engine) *Service {
	if conf.Debug == false {
		gin.SetMode(gin.ReleaseMode)
	}

	s := new(Service)
	s.conf = conf
	s.engine = e

	if conf.EnablePprof {
		pprof.Register(s.engine)
	}

	return s
}

// Start 启动一个服务
func (s *Service) Start() error {
	return s.engine.Run(s.conf.IPAddr)
}

// Router 代表了一个服务的路由
type Router struct {
	Method  string
	URI     string
	Handler gin.HandlerFunc
}

// RouterGroup 代表一个路由分组
type RouterGroup struct {
	Group map[string][]Router
}

// NewRouter 创建一个 Router
func NewRouter(m string, u string, h gin.HandlerFunc) Router {
	return Router{
		Method:  m,
		URI:     u,
		Handler: h,
	}
}

// registerRouter 向服务注册 router 和处理函数
func (s *Service) registerOne(method string, uri string, handler gin.HandlerFunc) error {
	defer func() {
		if err := recover(); err != nil {
			_, _ = fmt.Fprintf(os.Stderr, "Register Error, %s, %s\n", method, uri)
		}
	}()
	s.engine.Handle(strings.ToUpper(method), uri, handler)

	return nil
}

// registerOneToGroup 向 Group router 和处理函数
func (s *Service) registerOneToGroup(group *gin.RouterGroup, method string, uri string, handler gin.HandlerFunc) error {
	defer func() {
		if err := recover(); err != nil {
			fmt.Fprintf(os.Stderr, "Register Error, %s, %s\n", method, uri)
		}
	}()
	group.Handle(strings.ToUpper(method), uri, handler)

	return nil
}

// RegisterRouters 注册 Routers
func (s *Service) RegisterRouters(routers []Router) {
	for _, router := range routers {
		_ = s.registerOne(router.Method, router.URI, router.Handler)
	}
}

// RegisterRouterGroups 通过分组的方式注册 Routers
func (s *Service) RegisterRouterGroups(groups map[string][]Router) {
	for k, v := range groups {
		g := s.engine.Group(k)
		for _, router := range v {
			s.registerOneToGroup(g, router.Method, router.URI, router.Handler)
		}
	}
}

// RegisterMidwares 注册 Routers
func (s *Service) RegisterMidwares(midwares ...gin.HandlerFunc) {
	s.engine.Use(midwares...)
}

// RegisterStatic 静态文件
func (s *Service) RegisterStatic(uri string, path string) {
	s.engine.Static(uri, path)
}

// RegisterStaticFS 静态文件的另一个选择
func (s *Service) RegisterStaticFS(uri string, path string) {
	s.engine.StaticFS(uri, http.Dir(path))
}

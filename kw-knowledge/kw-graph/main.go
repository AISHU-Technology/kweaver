package main

import (
	"flag"
	"fmt"
	"github.com/AISHU-Technology/kw-go-core/orm/gormx"
	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/rest/httpx"
	"kw-graph/internal/config"
	"kw-graph/internal/errors"
	"kw-graph/internal/handler"
	"kw-graph/internal/svc"
)

var configFile = flag.String("f", "./etc/config.yaml", "the config file")

func main() {
	flag.Parse()

	var cfg logx.LogConf
	cfg.Mode = "console"
	cfg.ServiceName = "engine_server"
	cfg.Stat = false
	_ = conf.FillDefault(&cfg)

	var c config.Config
	conf.MustLoad(*configFile, &c)

	server := rest.MustNewServer(c.RestConf)
	defer server.Stop()

	// 初始化数据库连接
	dbConn := gormx.InitGormConf(c.DataSources)

	ctx := svc.NewServiceContext(c, dbConn)
	handler.RegisterHandlers(server, ctx)
	// 设置捕获httpx 错误处理
	httpx.SetErrorHandler(errors.ErrorEncoder)
	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}

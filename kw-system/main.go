package main

import (
	"context"
	"flag"
	"fmt"
	confx "github.com/AISHU-Technology/kw-go-core/config"
	"github.com/AISHU-Technology/kw-go-core/cors"
	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/rest"
	"kw-system/internal/config"
	"kw-system/internal/cron"
	"kw-system/internal/handler"
	"kw-system/internal/svc"
)

// 多环境配置
var configFile = confx.InitEnvConf("etc/config-dev.yaml")

func main() {
	flag.Parse()
	var c config.Config
	conf.MustLoad(*configFile, &c)
	server := rest.MustNewServer(c.RestConf, rest.WithNotAllowedHandler(cors.Handler())) //自定义cors
	//server.Use() 这里可写自定义
	defer server.Stop()

	ctx := svc.NewServiceContext(c)

	//启动定时任务
	go cron.ScheduleRun(context.Background(), ctx)

	handler.RegisterHandlers(server, ctx)
	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()

}

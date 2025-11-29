package main

import (
	"context"
	"net/http"

	// _ "net/http/pprof"
	"os/signal"
	"strconv"
	"syscall"
	"time"
	_ "unicode/utf8"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	libdb "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/db"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	_ "go.uber.org/automaxprocs"

	"ontology-manager/common"
	"ontology-manager/drivenadapters/action_type"
	"ontology-manager/drivenadapters/business_system"
	"ontology-manager/drivenadapters/data_model"
	"ontology-manager/drivenadapters/data_view"
	"ontology-manager/drivenadapters/job"
	"ontology-manager/drivenadapters/knowledge_network"
	"ontology-manager/drivenadapters/model_factory"
	"ontology-manager/drivenadapters/object_type"
	"ontology-manager/drivenadapters/opensearch"
	"ontology-manager/drivenadapters/permission"
	"ontology-manager/drivenadapters/relation_type"
	"ontology-manager/drivenadapters/user_mgmt"
	"ontology-manager/driveradapters"
	"ontology-manager/interfaces"
	"ontology-manager/logics"
	"ontology-manager/worker"
)

type mgrService struct {
	appSetting    *common.AppSetting
	restHandler   driveradapters.RestHandler
	conceptSyncer *worker.ConceptSyncer
	jobExecutor   interfaces.JobExecutor
}

func (server *mgrService) start() {
	logger.Info("Server Starting")

	err := logics.Init(context.Background())
	if err != nil {
		panic(err)
	}

	// 创建gin.engine 并注册Public API
	engine := gin.New()

	server.restHandler.RegisterPublic(engine)
	logger.Info("Server Register API Success")

	go server.conceptSyncer.Start()
	go server.jobExecutor.Start()

	// 监听中断信号（SIGINT、SIGTERM）
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	// 在收到信号的时候，会自动触发 ctx 的 Done ，这个 stop 是不再捕获注册的信号的意思，算是一种释放资源。
	defer stop()

	// 初始化http服务
	s := &http.Server{
		Addr:           ":" + strconv.Itoa(server.appSetting.ServerSetting.HttpPort),
		Handler:        engine,
		ReadTimeout:    server.appSetting.ServerSetting.ReadTimeOut * time.Second,
		WriteTimeout:   server.appSetting.ServerSetting.WriteTimeout * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	// 启动http服务
	go func() {
		err := s.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			logger.Fatalf("s.ListenAndServe err:%v", err)
		}
	}()

	<-ctx.Done()
	// 重置系统中断信号处理
	// stop()

	// 设置系统最后处理时间
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// 停止http服务
	logger.Info("Server Start Shutdown")
	if err := s.Shutdown(ctx); err != nil {
		logger.Fatalf("Server Shutdown:%v", err)
	}
	logger.Info("Server Exiting")
}

func main() {
	// 开启 pprof
	// go func() {
	// 	http.ListenAndServe("0.0.0.0:6060", nil)
	// }()

	logger.Info("Server Starting")

	// 初始化服务配置
	appSetting := common.NewSetting()

	logger.Info("Server Init Setting Success")

	// 设置错误码语言
	rest.SetLang(appSetting.ServerSetting.Language)
	logger.Info("Server Set Language Success")

	// 设置gin运行模式
	gin.SetMode(appSetting.ServerSetting.RunMode)
	logger.Info("Server Set RunMode Success")

	logger.Infof("Server Start By Port:%d", appSetting.ServerSetting.HttpPort)

	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

	db := libdb.NewDB(&appSetting.DBSetting)
	logics.SetDB(db)

	audit.Init(&appSetting.MQSetting)

	// Set顺序按字母升序排序
	logics.SetActionTypeAccess(action_type.NewActionTypeAccess(appSetting))
	logics.SetBusinessSystemAccess(business_system.NewBusinessSystemAccess(appSetting))
	logics.SetDataModelAccess(data_model.NewDataModelAccess(appSetting))
	logics.SetDataViewAccess(data_view.NewDataViewAccess(appSetting))
	logics.SetJobAccess(job.NewJobAccess(appSetting))
	logics.SetKNAccess(knowledge_network.NewKNAccess(appSetting))
	logics.SetModelFactoryAccess(model_factory.NewModelFactoryAccess(appSetting))
	logics.SetObjectTypeAccess(object_type.NewObjectTypeAccess(appSetting))
	logics.SetOpenSearchAccess(opensearch.NewOpenSearchAccess(appSetting))
	logics.SetPermissionAccess(permission.NewPermissionAccess(appSetting))
	logics.SetRelationTypeAccess(relation_type.NewRelationTypeAccess(appSetting))
	logics.SetUserMgmtAccess(user_mgmt.NewUserMgmtAccess(appSetting))

	server := &mgrService{
		appSetting:    appSetting,
		restHandler:   driveradapters.NewRestHandler(appSetting),
		conceptSyncer: worker.NewConceptSyncer(appSetting),
		jobExecutor:   worker.NewJobExecutor(appSetting),
	}
	server.start()
}

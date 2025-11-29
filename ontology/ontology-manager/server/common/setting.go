package common

import (
	"fmt"
	"sync"
	"time"

	libdb "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/db"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	libmq "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/mq"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/bytedance/sonic"
	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"

	"ontology-manager/version"
)

// server配置项
type ServerSetting struct {
	RunMode                  string        `mapstructure:"runMode"`
	HttpPort                 int           `mapstructure:"httpPort"`
	Language                 string        `mapstructure:"language"`
	ReadTimeOut              time.Duration `mapstructure:"readTimeOut"`
	WriteTimeout             time.Duration `mapstructure:"writeTimeOut"`
	MaxConcurrentTasks       int           `mapstructure:"maxConcurrentTasks"`
	ViewDataLimit            int           `mapstructure:"viewDataLimit"`
	DefaultSmallModelName    string        `mapstructure:"defaultSmallModelName"`
	DefaultSmallModelEnabled bool          `mapstructure:"defaultSmallModelEnabled"`
}

// app配置项
type AppSetting struct {
	ServerSetting        ServerSetting             `mapstructure:"server"`
	LogSetting           logger.LogSetting         `mapstructure:"log"`
	ObservabilitySetting o11y.ObservabilitySetting `mapstructure:"observability"`
	DepServices          map[string]map[string]any `mapstructure:"depServices"`

	DBSetting         libdb.DBSetting
	MQSetting         libmq.MQSetting
	OpenSearchSetting rest.OpenSearchClientConfig
	HydraAdminSetting rest.HydraAdminSetting

	// data model url
	DataModelUrl string
	// data view url
	DataViewUrl string
	// UniQuery url
	UniQueryUrl string

	// permission url
	PermissionUrl string
	// user management url
	UserMgmtUrl string
	// model factory url
	ModelFactoryManagerUrl string
	// model factory api url
	ModelFactoryAPIUrl string
	// business system url
	BusinessSystemUrl string
}

const (
	// ConfigFile 配置文件信息
	configPath string = "./config/"
	configName string = "ontology-manager-config"
	configType string = "yaml"

	rdsServiceName                 string = "rds"
	mqServiceName                  string = "mq"
	opensearchServiceName          string = "opensearch"
	permissionServiceName          string = "authorization-private"
	userMgmtServiceName            string = "user-management"
	hydraAdminServiceName          string = "hydra-admin"
	modelFactoryManagerServiceName string = "mf-model-manager"
	modelFactoryAPIServiceName     string = "mf-model-api"
	dataModelServiceName           string = "data-model"
	dataViewServiceName            string = "data-model"
	uniQueryServiceName            string = "uniquery"
	businessSystemServiceName      string = "business-system"

	DATA_BASE_NAME string = "dip"
)

var (
	appSetting *AppSetting
	vp         *viper.Viper

	settingOnce sync.Once
)

// NewSetting 读取服务配置
func NewSetting() *AppSetting {
	settingOnce.Do(func() {
		appSetting = &AppSetting{}
		vp = viper.New()
		initSetting(vp)
	})

	return appSetting
}

// 初始化配置
func initSetting(vp *viper.Viper) {
	logger.Infof("Init Setting From File %s%s.%s", configPath, configName, configType)

	vp.AddConfigPath(configPath)
	vp.SetConfigName(configName)
	vp.SetConfigType(configType)

	loadSetting(vp)

	vp.WatchConfig()
	vp.OnConfigChange(func(e fsnotify.Event) {
		logger.Infof("Config file changed:%s", e)
		loadSetting(vp)
	})
}

// 读取配置文件
func loadSetting(vp *viper.Viper) {
	logger.Infof("Load Setting File %s%s.%s", configPath, configName, configType)

	if err := vp.ReadInConfig(); err != nil {
		logger.Fatalf("err:%s\n", err)
	}

	if err := vp.Unmarshal(appSetting); err != nil {
		logger.Fatalf("err:%s\n", err)
	}

	SetLogSetting(appSetting.LogSetting)

	SetDBSetting()

	SetMQSetting()

	SetOpenSearchSetting()

	SetHydraAdminSetting()

	SetDataModelSetting()

	SetDataViewSetting()

	SetUniQuerySetting()

	SetPermissionSetting()

	SetUserMgmtSetting()

	SetModelFactoryManagerSetting()

	SetModelFactoryAPISetting()

	SetBusinessSystemSetting()

	serverInfo := o11y.ServerInfo{
		ServerName:    version.ServerName,
		ServerVersion: version.ServerVersion,
		Language:      version.LanguageGo,
		GoVersion:     version.GoVersion,
		GoArch:        version.GoArch,
	}
	logger.Infof("ServerName: %s, ServerVersion: %s, Language: %s, GoVersion: %s, GoArch: %s, POD_NAME: %s",
		version.ServerName, version.ServerVersion, version.LanguageGo,
		version.GoVersion, version.GoArch, o11y.POD_NAME)

	o11y.Init(serverInfo, appSetting.ObservabilitySetting)

	s, _ := sonic.MarshalString(appSetting)
	logger.Debug(s)
}

func SetDBSetting() {
	setting, ok := appSetting.DepServices[rdsServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", rdsServiceName)
	}

	appSetting.DBSetting = libdb.DBSetting{
		Host:     setting["host"].(string),
		Port:     setting["port"].(int),
		Username: setting["user"].(string),
		Password: setting["password"].(string),
		DBName:   DATA_BASE_NAME,
	}
}

func SetMQSetting() {
	setting, ok := appSetting.DepServices[mqServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", mqServiceName)
	}
	authSetting, ok := setting["auth"].(map[string]any)
	if !ok {
		logger.Fatalf("service %s auth not found in depServices", mqServiceName)
	}

	appSetting.MQSetting = libmq.MQSetting{
		MQType: setting["mqtype"].(string),
		MQHost: setting["mqhost"].(string),
		MQPort: setting["mqport"].(int),
		Tenant: setting["tenant"].(string),
		Auth: libmq.MQAuthSetting{
			Username:  authSetting["username"].(string),
			Password:  authSetting["password"].(string),
			Mechanism: authSetting["mechanism"].(string),
		},
	}
}

func SetOpenSearchSetting() {
	setting, ok := appSetting.DepServices[opensearchServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", opensearchServiceName)
	}

	appSetting.OpenSearchSetting = rest.OpenSearchClientConfig{
		Host:     setting["host"].(string),
		Port:     setting["port"].(int),
		Protocol: setting["protocol"].(string),
		Username: setting["user"].(string),
		Password: setting["password"].(string),
	}
}

func SetHydraAdminSetting() {
	setting, ok := appSetting.DepServices[hydraAdminServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", hydraAdminServiceName)
	}
	appSetting.HydraAdminSetting = rest.HydraAdminSetting{
		HydraAdminProcotol: setting["protocol"].(string),
		HydraAdminHost:     setting["host"].(string),
		HydraAdminPort:     setting["port"].(int),
	}
}

func SetDataModelSetting() {
	setting, ok := appSetting.DepServices[dataModelServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", dataModelServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.DataModelUrl = fmt.Sprintf("%s://%s:%d/api/mdl-data-model/in/v1", protocol, host, port)
}

func SetDataViewSetting() {
	setting, ok := appSetting.DepServices[dataViewServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", dataViewServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.DataViewUrl = fmt.Sprintf("%s://%s:%d/api/mdl-data-model/in/v1", protocol, host, port)
}

func SetUniQuerySetting() {
	setting, ok := appSetting.DepServices[uniQueryServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", uniQueryServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.UniQueryUrl = fmt.Sprintf("%s://%s:%d/api/mdl-uniquery/in/v1", protocol, host, port)
}

func SetPermissionSetting() {
	setting, ok := appSetting.DepServices[permissionServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", permissionServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.PermissionUrl = fmt.Sprintf("%s://%s:%d/api/authorization/v1", protocol, host, port)
}

func SetUserMgmtSetting() {
	setting, ok := appSetting.DepServices[userMgmtServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", userMgmtServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.UserMgmtUrl = fmt.Sprintf("%s://%s:%d", protocol, host, port)
}

func SetModelFactoryManagerSetting() {
	setting, ok := appSetting.DepServices[modelFactoryManagerServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", modelFactoryManagerServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.ModelFactoryManagerUrl = fmt.Sprintf("%s://%s:%d/api/private/mf-model-manager/v1", protocol, host, port)
}

func SetModelFactoryAPISetting() {
	setting, ok := appSetting.DepServices[modelFactoryAPIServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", modelFactoryAPIServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.ModelFactoryAPIUrl = fmt.Sprintf("%s://%s:%d/api/private/mf-model-api/v1", protocol, host, port)
}

func SetBusinessSystemSetting() {
	setting, ok := appSetting.DepServices[businessSystemServiceName]
	if !ok {
		logger.Fatalf("service %s not found in depServices", businessSystemServiceName)
	}

	protocol := setting["protocol"].(string)
	host := setting["host"].(string)
	port := setting["port"].(int)

	appSetting.BusinessSystemUrl = fmt.Sprintf("%s://%s:%d/internal/api/business-system/v1", protocol, host, port)
}

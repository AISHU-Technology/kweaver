// Package utils 项目的通用的工具
// - 描述：服务、图数据库配置的数据结构
// - 作者：张坤 (zhang.kun@aishu.cn)
// - 时间：2020-2-29
package utils

import (
	"errors"
	"graph-engine/leo"
	"graph-engine/logger"
)

// CONFIG 服务器配置
var CONFIG ServerConf
var UrlCONF UrlConf

// 版本号和应用名称
const (
	Version string = "1.0.1"
	Name    string = "AnyDATA Graph Engine"
)

// ServerConf 整体配置
type ServerConf struct {
	SysConf    `yaml:"server"`
	OrientConf `yaml:"orient"`
	MariaConf  `yaml:"mariadb"`
	AlgConf    `yaml:"algServer"`
	//ManagerConf `yaml:"managerServer"`
	BuilderConf `yaml:"builderServer"`
}

// managerConf 配置
//type ManagerConf struct {
//	IP   string `yaml:"ip"`
//	Port string `yaml:"port"`
//}

// SysConf 系统配置
type SysConf struct {
	IP    string `yaml:"ip"`
	Port  string `yaml:"port"`
	Debug bool   `yaml:"debug"`
	Pprof bool   `yaml:"pprof"`
}

// MariaConf 配置
type MariaConf struct {
	IP   string `yaml:"host"`
	Port string `yaml:"port"`
	User string `yaml:"user"`
	Pwd  string `yaml:"password"`
	Db   string `yaml:"database"`
}

// OrientConf OrientDB 配置
type OrientConf struct {
	User string `yaml:"user"`
	Pwd  string `yaml:"password"`
	DB   string `yaml:"db"`
	IP   string `yaml:"ip"`
	Port string `yaml:"port"`
}

// JanusConf JanusGraph 配置
type JanusConf struct {
	User string `yaml:"user"`
	Pwd  string `yaml:"password"`
	URL  string `yaml:"url"`
}

// alg服务配置
type AlgConf struct {
	IP   string `yaml:"ip"`
	Port string `yaml:"port"`
}

// builder服务配置
type BuilderConf struct {
	IP   string `yaml:"ip"`
	Port string `yaml:"port"`
}

// api调用url
type UrlConf struct {
	BuilderUrl    `yaml:"builderUrl"`
	AlgUrl        `yaml:"algUrl"`
	AnyShareUrl   `yaml:"anyShareUrl"`
	ManagerUrl    `yaml:"managerUrl"`
	OpenSearchUrl `yaml:"openSearchUrl"`
}
type AlgUrl struct {
	TopicSearch   string `yaml:"topicSearch"`
	AdvSearch     string `yaml:"advSearch"`
	AdvSearch2AS  string `yaml:"advSearch2AS"`
	DocRecommend  string `yaml:"docRecommend"`
	TopicSubgraph string `yaml:"topicSubgraph"`
	AdvSearchTest string `yaml:"advSearchTest"`
}

type AnyShareUrl struct {
	ESAPI         string `yaml:"esAPI"`
	GetConfig     string `yaml:"getConfig"`
	GetIndex      string `yaml:"getIndex"`
	DeployManager string `yaml:"deployManager"`
}

type BuilderUrl struct {
	GetAcctoken string `yaml:"getAcctoken"`
}

// mananger api
type ManagerUrl struct {
	KgListInfo      string `yaml:"kgListInfo"`
	ResourceOperate string `yaml:"resourceOperate"`
}

type OpenSearchUrl struct {
	FullTextList string `yaml:"fullTextList"`
	Search       string `yaml:"search"`
}

func init() {
	var err = leo.ReadYamlConfig(&CONFIG, "./conf/settings.yaml")
	if err != nil {
		panic(errors.New("loading yaml file err, " + err.Error()))
	}
	//err = leo.ReadYamlConfig(&CONFIG, "/etc/builder/kwconfig.yaml")
	err = leo.ReadYamlConfig(&CONFIG, "./conf/settings2.yaml")
	if err != nil {
		logger.Info("no yaml file")
	}
	logger.Info("xxxxxxxxxx")
	logger.Info(CONFIG.MariaConf)
	err = leo.ReadYamlConfig(&UrlCONF, "./conf/url.yaml")
	if err != nil {
		panic(errors.New("loading yaml file err, " + err.Error()))
	}
}

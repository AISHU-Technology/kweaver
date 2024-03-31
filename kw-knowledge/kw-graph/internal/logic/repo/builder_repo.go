package repo

import "context"

// OntologyInfo data 层接口实现返回结构
type OntologyInfo struct {
	Entities   map[string]*Class
	Egdes      map[string]*Class
	UpdateTime string
}

// Class 类信息
type Class struct {
	Name            string               // 类名
	Color           string               // 显示颜色
	Alias           string               // 显示名
	DefaultProperty string               // 默认显示属性名
	Icon            string               // 显示图标
	Properties      map[string]*Property // 类属性列表
}

// Property 属性信息
type Property struct {
	Name  string // 属性名
	Alias string // 属性显示名
	Type  string // 属性类型
}

// KgInfo 图谱信息
type KgInfo struct {
	// ID 图谱ID
	ID int `json:"id"`
	// Name 图谱名称
	Name string `json:"name"`
	// OtlID 本体ID
	OtlID int `json:"otl"`
	// Status 图谱状态
	Status string `json:"status"`
	// GraphDBName 图数据库DB名
	GraphDBName string `json:"graphdb_dbname"`
	// TaskStatus  任务运行状态
	TaskStatus string `json:"task_status"`
	// GraphDes
	GraphDes string `json:"graph_des"`
	//
	KnwID string `json:"knw_id"`
}

type OntologyDetailInfo struct {
	UpdateTime string `json:"update_time"`
}

// BuilderRepo data 层实现接口抽象
//
//go:generate mockgen -package mock -source ../repo/builder_repo.go -destination ../repo/mock/mock_builder_repo.go
type BuilderRepo interface {
	GetOntologyInfo(ctx context.Context, kgID string) (*OntologyInfo, error)
	GetKGSpaceByKgID(ctx context.Context, kgID string) (string, error)
	GetKGNameByKgID(ctx context.Context, kgID string) (string, error)
	GetKgIDsByKnwID(ctx context.Context, knwID string) (map[string]string, error)
	GetKgsByKnwID(ctx context.Context, knwID string) (map[string]*KgInfo, error)
	GetKgIDByKdbName(ctx context.Context, kdbName string) (string, error)
	GetKgInfoByKgID(ctx context.Context, KgID string) (*KgInfo, error)
	GetOntologyDetailInfoByKgID(ctx context.Context, kgID string) (*OntologyDetailInfo, error)
}

// DepHTTPSvc 接口嵌入，为drivenadapter下http接口提供mock对象
type DepHTTPSvc interface {
	// HandleRequest 处理函数
	HandleRequest(method, url string, reqBody interface{}) (code int, resBody []byte)
}

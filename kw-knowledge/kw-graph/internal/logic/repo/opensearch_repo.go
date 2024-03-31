package repo

import (
	"context"
)

// NodeSimpleINfo 快速搜索点的简单信息
type NodeSimpleINfo struct {
	ID    string
	Tag   string
	Value string
}

// VertexesInfo data 层接口实现返回结构
type VertexesInfo struct {
	Vids []string
}

// QuickSearchNodesInfo  快速搜索点信息结构
type QuickSearchNodesInfo struct {
	Nodes []*NodeSimpleINfo
}

// TagSimpleInfoCore  tag简单信息
type TagSimpleInfoCore struct {
	Tag         string `json:"tag"`
	DefaultProp string `json:"default_prop"`
}

// QuickSearchRequestCore 快速搜索请求体
type QuickSearchRequestCore struct {
	Index           string               `json:"index"`
	Query           string               `json:"query"`
	Size            int64                `json:"size"`
	Page            int64                `json:"page"`
	TagsDefaultProp []*TagSimpleInfoCore `json:"tags_default_prop,optional"`
	AllEntities     bool                 `json:"all_entities"`
}

// NodeSimpleInfoCore  节点信息
type NodeSimpleInfoCore struct {
	ID    string `json:"id"`
	Tag   string `json:"tag"`
	Value string `json:"value"`
}

// QuickSearchResponseCore 快速搜索响应体
type QuickSearchResponseCore struct {
	Res   []*NodeSimpleInfoCore `json:"res"`
	Count int64                 `json:"count"`
}

// MultiSearchReq os自定义搜索
type OpenSearchReq struct {
	Space string
	Tags  []string
	Query string
}

// OpenSearchRepo 数据层实现接口抽象
//
//go:generate mockgen -package mock -source ../repo/opensearch_repo.go -destination ../repo/mock/mock_opensearch_repo.go
type OpenSearchRepo interface {
	GetVidsByVertexSearch(ctx context.Context, index string, tags []string, query string) (*VertexesInfo, error)
}

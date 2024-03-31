package repo

import (
	"context"
)

// FTSearchResult 全文检索结构
type FTSearchResult struct {
	Total        int
	NebulaVInfos []*NebulaVerticesSearchInfo
}

// NebulaVerticesSearchInfo 通用搜索点结构类型
type NebulaVerticesSearchInfo struct {
	Tag    string
	Vertex []*Vertex
}

// Vertex 点返回数据结构类型
type Vertex struct {
	ID         string                      `json:"id"`
	Tags       []string                    `json:"tags"`
	Properties map[string]map[string]*Prop `json:"properties"`
	Number     int
}

// DefaultProperty 默认属性结构体
type DefaultProperty struct {
	Name  string `json:"n"`
	Value string `json:"v"`
	Alias string `json:"a"`
}

// Prop 属性结构体
type Prop struct {
	Value string `json:"value"`
	Type  string `json:"type"`
}

// Edge 通用边结构
type Edge struct {
	ID         string
	Type       string
	SrcID      string
	DstID      string
	Rank       int
	Properties map[string]*Prop
	Number     int
}

// NebulaEdgesSearchInfo nebula 边集合结果结构
type NebulaEdgesSearchInfo struct {
	Type  string
	Edges []*Edge
}

// ClassFilterPropertiesCore 全文检索或vid搜索类属性筛选条件
type ClassFilterPropertiesCore struct {
	Name      string `json:"name"`
	Operation string `json:"operation"`
	OpValue   string `json:"op_value"`
}

// SearchConfigCore tag信息结构，请求体结构
type SearchConfigCore struct {
	Tag        string                       `json:"tag"`
	Properties []*ClassFilterPropertiesCore `json:"properties"`
}

// PropsCore 属性结构
type PropsCore struct {
	Name     string `json:"name"`
	Value    string `json:"value"`
	PropType string `json:"type"`
}

// PropertiesCore tag信息结构
type PropertiesCore struct {
	Tag   string       `json:"tag"`
	Props []*PropsCore `json:"props"`
}

// VertexCore 点信息结构
type VertexCore struct {
	ID         string            `json:"id"`
	Tags       []string          `json:"tags"`
	Properties []*PropertiesCore `json:"properties"`
}

// VertexGroupCore 点结合结构，以tag分类
type VertexGroupCore struct {
	Tag      string        `json:"tag"`
	Vertices []*VertexCore `json:"vertices"`
}

// VidsRequestCore vids搜索请求体结构
type VidsRequestCore struct {
	Space        string              `json:"space"`
	Page         int64               `json:"page"`
	Size         int64               `json:"size"`
	SearchConfig []*SearchConfigCore `json:"search_config"`
	Vids         []string            `json:"vids"`
}

// VerticesResponseCore vids搜索响应体结构
type VerticesResponseCore struct {
	Count  int64              `json:"count"`
	Result []*VertexGroupCore `json:"result"`
}

// FullTextRequestCore 全文检索请求体结构
type FullTextRequestCore struct {
	Space        string              `json:"space"`
	MatchingNum  int64               `json:"matching_num"`
	Query        string              `json:"query"`
	Page         int64               `json:"page"`
	Size         int64               `json:"size"`
	MatchingRule string              `json:"matching_rule"`
	SearchConfig []*SearchConfigCore `json:"search_config"`
}

// EdgeReqCore 边请求体
type EdgeReqCore struct {
	SrcID string `json:"src_id"`
	DstID string `json:"dst_id"`
	Type  string `json:"type"`
	Rank  int64  `json:"rank"`
}

// EdgesRequestCore 边响应体
type EdgesRequestCore struct {
	Space string         `json:"space"`
	Edges []*EdgeReqCore `json:"edges"`
	Eids  []string       `json:"eids"`
}

// EdgeCore 边信息
type EdgeCore struct {
	ID         string       `json:"id"`
	EdgeClass  string       `json:"edge_class"`
	SrcID      string       `json:"src_id"`
	DstID      string       `json:"dst_id"`
	Rank       int64        `json:"rank"`
	Properties []*PropsCore `json:"properties"`
}

// EdgeGroupCore 边结合信息
type EdgeGroupCore struct {
	EdgeClass string      `json:"edge_class"`
	Edges     []*EdgeCore `json:"edges"`
}

// EdgesResponseCore 边搜索响应体
type EdgesResponseCore struct {
	ECount  int64            `json:"e_count"`
	EResult []*EdgeGroupCore `json:"e_result"`
}

// FilterCore 筛选规则
type FilterCore struct {
	EFilters []*EFilterCore `json:"e_filters"`
	VFilters []*VFilterCore `json:"v_filters"`
}

// EFilterCore 边筛选规则
type EFilterCore struct {
	Relation        string                `json:"relation"`
	Type            string                `json:"type"`
	EdgeClass       string                `json:"edge_class"`
	PropertyFilters []*PropertyFilterCore `json:"property_filters"`
}

// VFilterCore 点筛选规则
type VFilterCore struct {
	Relation        string                `json:"relation"`
	Type            string                `json:"type"`
	Tag             string                `json:"tag"`
	PropertyFilters []*PropertyFilterCore `json:"property_filters"`
}

// PropertyFilterCore 属性筛选规则
type PropertyFilterCore struct {
	Name      string `json:"name"`
	Operation string `json:"operation"`
	OpValue   string `json:"op_value"`
}

// GraphBasicSearchRepo 数据层 图基本搜索接口声明
//
//go:generate mockgen -package mock -source ../repo/basic_search_repo.go -destination ../repo/mock/mock_basic_search_repo.go
type GraphBasicSearchRepo interface {
	GetVertex(ctx context.Context, space, nGql, query string) ([]*Vertex, error)
	QueryAllOfVids(ctx context.Context, conf map[string]interface{}, filters map[string][]string, query string, vids []string, kDBName string) ([]*NebulaVerticesSearchInfo, int, error)
	QueryAllOnEmptyQuery(ctx context.Context, conf map[string]interface{}, filters map[string][]string, query string, vids []string, kDBName string) ([]*NebulaVerticesSearchInfo, error)
	GetEdge(ctx context.Context, edges map[string][]Edge, kDBName string) ([]*NebulaEdgesSearchInfo, int, error)
}

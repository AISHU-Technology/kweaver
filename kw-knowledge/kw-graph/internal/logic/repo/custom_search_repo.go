// Package repo 数据层接口及结构声明
package repo

import "context"

// CustomSearchInfo 自定义查询结构
type CustomSearchInfo struct {
	VerticesParsedList []*VerticesParsedList          `json:"vertices_parsed_list,omitempty"`
	EdgesParsedList    []*EdgesParsedList             `json:"edges_parsed_list,omitempty"`
	PathsParsedList    []*PathsParsedList             `json:"paths_parsed_list,omitempty"`
	TextsParsedList    []*TextsParsedList             `json:"tesxt_parsed_list,omitempty"`
	NodesDetail        map[string]*VerticesParsedList `json:"nodes_detail,omitempty"`
}

// VerticesParsedList 点解析列表
type VerticesParsedList struct {
	Vid        string                      `json:"vid"`
	Tags       []string                    `json:"tags"`
	Properties map[string]map[string]*Prop `json:"properties"`
}

// EdgesParsedList 边解析列表
type EdgesParsedList struct {
	SrcID      string           `json:"src_id"`
	DstID      string           `json:"dst_id"`
	EdgeClass  string           `json:"edge_class"`
	Properties map[string]*Prop `json:"properties"`
}

// PathsParsedList 路径解析列表
type PathsParsedList struct {
	Nodes         []*VerticesParsedList `json:"nodes"`
	Relationships []*EdgesParsedList    `json:"relationships"`
}

// TextResultInfo 文本信息结构
type TextResultInfo struct {
	Column string   `json:"column"`
	Values []string `json:"values"`
}

// NodesInfoAllType 自定义查询 边和路径中分别查询的点信息
type NodesInfoAllType struct {
	Path map[string]*VerticesParsedList
	Edge map[string]*VerticesParsedList
}

// TextsParsedList 文本解析列表
type TextsParsedList struct {
	Column string `json:"column"`
	Value  string `json:"value"`
	Type   string `json:"type"`
}

// TextRowInfo 文本值行信息
type TextRowInfo struct {
	Column string   `json:"column"`
	Values []string `json:"values"`
}

// OldOpenCustomSearchError 旧自定义查询open结构
type OldOpenCustomSearchError struct {
	Message string `json:"message"`
	Code    int64  `json:"code"`
}

// OldOpenCustomSearchData 旧自定义查询open结构
type OldOpenCustomSearchData struct {
	Meta []interface{} `json:"meta"`
	Row  []interface{} `json:"row"`
}

// OldOpenCustomSearchResult 旧自定义查询open结构
type OldOpenCustomSearchResult struct {
	Columns   []string                  `json:"columns"`
	Data      []OldOpenCustomSearchData `json:"data"`
	SpaceName string                    `json:"spaceName"`
}

// OldOpenCustomSearchInfo 旧自定义查询open结构
type OldOpenCustomSearchInfo struct {
	Errors  []OldOpenCustomSearchError  `json:"errors"`
	Results []OldOpenCustomSearchResult `json:"results"`
}

// OldOpenCustomSearchMuti 旧自定义查询open结构
type OldOpenCustomSearchMuti struct {
	Data      interface{} `json:"data"`
	Statement string      `json:"statement"`
}

// CustomSearchRepo 自定义查询数据层接口声明
//
//go:generate mockgen -package mock -source ../repo/custom_search_repo.go -destination ../repo/mock/mock_custom_search_repo.go
type CustomSearchRepo interface {
	CustomSearch(ctx context.Context, qeury, spaceName string, givenJSON bool) ([]*CustomSearchInfo, *NodesInfoAllType, error)
}

package repo

import (
	"context"

	"kw-graph/internal/types"
)

// ExpandVRes 查询点的进出边数量响应体
type ExpandVRes struct {
	OutE []*ExpandVEdge
	InE  []*ExpandVEdge
}

// ExpandVEdge 边的数量及名称
type ExpandVEdge struct {
	EdgeClass string
	Count     int64
}

// NeighborsEResult 邻居查询边返回结构，以查询的起点和终点来存储vid，并单独记录边的方向
type NeighborsEResult struct {
	Type       string
	StartVid   string
	EndVid     string
	Direction  string
	Rank       int
	Properties map[string]*Prop
}

// NebulaNeighborsRes Nebula 邻居查询结果结构
type NebulaNeighborsRes struct {
	V *Vertex
	E *Edge
}

// NeighborsResult 邻居查询返回结构体
type NeighborsResult struct {
	VCount  int64
	ECount  int64
	VResult map[string]*Vertex
	EResult map[string]*Edge
}

// EdgeSimpleInfo 边的简单信息
type EdgeSimpleInfo struct {
	EdgeClass string
	SrcID     string
	DstID     string
}

// PathInfo 路径探索返回结构体
type PathInfo struct {
	Vertices  []string
	Edges     []string
	EdgesInfo []*EdgeSimpleInfo
}

// PathDetailInfo 路径详情结构
type PathDetailInfo struct {
	Vertices []*Vertex `json:"vertices"`
	Edges    []*Edge   `json:"edges"`
}

// NeighborsVertex 邻居查询点信息
type NeighborsVertex struct {
	ID         string
	Tags       []string
	Properties map[string]map[string]*Prop
	InE        []string
	OutE       []string
}

// ExpandVResponseCore 点探索响应体
type ExpandVResponseCore struct {
	Res []*ExpandVGroupCore `json:"res"`
}

// ExpandVGroupCore 点探索点集合结构
type ExpandVGroupCore struct {
	ID   string             `json:"id"`
	OutE []*ExpandVEdgeCore `json:"out_e"`
	InE  []*ExpandVEdgeCore `json:"in_e"`
}

// ExpandVEdgeCore 边探索点集合结构
type ExpandVEdgeCore struct {
	EdgeClass string `json:"edge_class"`
	Count     int64  `json:"count"`
}

// ExpandVRequestCore 点探索请求体
type ExpandVRequestCore struct {
	Space string   `json:"space"`
	Vids  []string `json:"vids"`
}

// NeighborsRequestCore 邻居查询请求体
type NeighborsRequestCore struct {
	Space     string        `json:"space"`
	Vids      []string      `json:"vids"`
	Direction string        `json:"direction"`
	Page      int           `json:"page"`
	Size      int           `json:"size"`
	Steps     int           `json:"steps"`
	Filters   []*FilterCore `json:"filters"`
	FinalStep bool          `json:"final_step"`
}

// NeighborsResponseCore 邻居查询响应体
type NeighborsResponseCore struct {
	VCount  int64              `json:"v_count"`
	ECount  int64              `json:"e_count"`
	VResult []*VertexGroupCore `json:"v_result"`
	EResult []*EdgeGroupCore   `json:"e_result"`
}

// GraphExploreRepo 数据层图探索接口声明
//
//go:generate mockgen -package mock -source ../repo/graph_explore_repo.go -destination ../repo/mock/mock_graph_explore_repo.go
type GraphExploreRepo interface {
	ExpandV(ctx context.Context, vids []string, space string) (map[string]*ExpandVRes, error)
	// NeighborsBasic 基础邻居查询 一次查完全部, 无筛选条件
	NeighborsBasic(ctx context.Context, vids []string, steps int, direction string, edges []string, space string) (map[string]*Vertex, map[string]*Edge, error)
	// Neighbors 邻居查询，有筛选条件
	Neighbors(ctx context.Context, vids []string, steps int, direction string, edges []string, filters []*types.Filter, space string) ([]*NebulaNeighborsRes, error)
	Path(ctx context.Context, in *types.PathRequest, space string) ([]*PathInfo, []string, []string, error)
	PathDetail(ctx context.Context, in *types.PathRequest, pathList []*PathInfo, vids, edges []string, space string) (*PathDetailInfo, []*PathInfo, error)
}

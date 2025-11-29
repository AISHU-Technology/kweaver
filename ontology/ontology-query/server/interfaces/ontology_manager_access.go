package interfaces

import "context"

// 基于起点、方向和路径长度获取对象子图的请求体
type PathsQueryBaseOnSource struct {
	SourceObjecTypeId string `json:"source_object_type_id"`
	Direction         string `json:"direction"`
	PathLength        int    `json:"path_length"`

	KNID string `json:"-"`
	// IncludeTypeInfo bool   `json:"-"`
}

//go:generate mockgen -source ../interfaces/metric_model_access.go -destination ../interfaces/mock/mock_metric_model_access.go
type OntologyManagerAccess interface {
	GetObjectType(ctx context.Context, knID string, otId string) (ObjectType, bool, error)
	GetRelationType(ctx context.Context, knID string, rtId string) (RelationType, bool, error)
	GetActionType(ctx context.Context, knID string, atId string) (ActionType, bool, error)
	GetRelationTypePathsBaseOnSource(ctx context.Context, knID string, query PathsQueryBaseOnSource) ([]RelationTypePath, error)
}

package interfaces

import (
	"context"
	"database/sql"
)

//go:generate mockgen -source ../interfaces/relation_type_service.go -destination ../interfaces/mock/mock_relation_type_service.go
type RelationTypeService interface {
	CheckRelationTypeExistByID(ctx context.Context, knID string, rtID string) (string, bool, error)
	CheckRelationTypeExistByName(ctx context.Context, knID string, rtName string) (string, bool, error)
	CreateRelationTypes(ctx context.Context, tx *sql.Tx, relationTypes []*RelationType, mode string) ([]string, error)
	ListRelationTypes(ctx context.Context, query RelationTypesQueryParams) ([]*RelationType, int, error)
	GetRelationTypes(ctx context.Context, knID string, rtIDs []string) ([]*RelationType, error)
	UpdateRelationType(ctx context.Context, tx *sql.Tx, relationType *RelationType) error
	DeleteRelationTypes(ctx context.Context, tx *sql.Tx, knID string, rtIDs []string) (int64, error)

	GetRelationTypeIDsByKnID(ctx context.Context, knID string) ([]string, error)

	SearchRelationTypes(ctx context.Context, query *ConceptsQuery) (RelationTypes, error)

	// 写关系类到索引中
	InsertOpenSearchData(ctx context.Context, relationTypes []*RelationType) error
}

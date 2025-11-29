package interfaces

import (
	"context"
	"database/sql"
)

//go:generate mockgen -source ../interfaces/relation_type_access.go -destination ../interfaces/mock/mock_relation_type_access.go
type RelationTypeAccess interface {
	CheckRelationTypeExistByID(ctx context.Context, knID string, rtID string) (string, bool, error)
	CheckRelationTypeExistByName(ctx context.Context, knID string, rtName string) (string, bool, error)

	CreateRelationType(ctx context.Context, tx *sql.Tx, relationType *RelationType) error
	ListRelationTypes(ctx context.Context, query RelationTypesQueryParams) ([]*RelationType, error)
	GetRelationTypesTotal(ctx context.Context, query RelationTypesQueryParams) (int, error)
	GetRelationTypeByID(ctx context.Context, knID string, rtID string) (*RelationType, error)
	GetRelationTypesByIDs(ctx context.Context, knID string, rtIDs []string) ([]*RelationType, error)
	UpdateRelationType(ctx context.Context, tx *sql.Tx, relationType *RelationType) error
	DeleteRelationTypes(ctx context.Context, tx *sql.Tx, knID string, rtIDs []string) (int64, error)

	GetAllRelationTypesByKnID(ctx context.Context, knID string) (map[string]*RelationType, error)
	GetRelationTypeIDsByKnID(ctx context.Context, knID string) ([]string, error)
}

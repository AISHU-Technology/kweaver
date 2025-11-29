package interfaces

import (
	"context"
	"database/sql"
)

//go:generate mockgen -source ../interfaces/object_type_access.go -destination ../interfaces/mock/mock_object_type_access.go
type ObjectTypeAccess interface {
	CheckObjectTypeExistByID(ctx context.Context, knID string, otID string) (string, bool, error)
	CheckObjectTypeExistByName(ctx context.Context, knID string, otName string) (string, bool, error)

	CreateObjectType(ctx context.Context, tx *sql.Tx, objectType *ObjectType) error
	ListObjectTypes(ctx context.Context, query ObjectTypesQueryParams) ([]*ObjectType, error)
	GetObjectTypesTotal(ctx context.Context, query ObjectTypesQueryParams) (int, error)
	GetObjectTypeByID(ctx context.Context, knID string, otID string) (*ObjectType, error)
	GetObjectTypesByIDs(ctx context.Context, knID string, otIDs []string) ([]*ObjectType, error)
	UpdateObjectType(ctx context.Context, tx *sql.Tx, objectType *ObjectType) error
	DeleteObjectTypes(ctx context.Context, tx *sql.Tx, knID string, otIDs []string) (int64, error)
	UpdateDataProperties(ctx context.Context, objectType *ObjectType) error

	GetAllObjectTypesByKnID(ctx context.Context, knID string) (map[string]*ObjectType, error)
	GetSimpleObjectTypeByKnID(ctx context.Context, knID string) ([]*SimpleObjectType, error)
	GetObjectTypeIDsByKnID(ctx context.Context, knID string) ([]string, error)
	UpdateObjectTypeIndex(ctx context.Context, tx *sql.Tx, knID string, otID string, index string) error
}

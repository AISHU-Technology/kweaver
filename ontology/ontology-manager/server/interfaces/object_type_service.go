package interfaces

import (
	"context"
	"database/sql"
)

//go:generate mockgen -source ../interfaces/object_type_service.go -destination ../interfaces/mock/mock_object_type_service.go
type ObjectTypeService interface {
	CheckObjectTypeExistByID(ctx context.Context, knID string, otID string) (string, bool, error)
	CheckObjectTypeExistByName(ctx context.Context, knID string, otName string) (string, bool, error)
	CreateObjectTypes(ctx context.Context, tx *sql.Tx, objectTypes []*ObjectType, mode string) ([]string, error)
	ListObjectTypes(ctx context.Context, query ObjectTypesQueryParams) ([]*ObjectType, int, error)
	GetObjectTypes(ctx context.Context, knID string, otIDs []string) ([]*ObjectType, error)
	UpdateObjectType(ctx context.Context, tx *sql.Tx, objectType *ObjectType) error
	UpdateDataProperties(ctx context.Context, objectType *ObjectType, dataProperties []*DataProperty) error
	DeleteObjectTypes(ctx context.Context, tx *sql.Tx, knID string, otIDs []string) (int64, error)

	GetObjectTypeByID(ctx context.Context, knID string, otID string) (*ObjectType, error)
	GetSimpleObjectTypeByKnID(ctx context.Context, knID string) ([]*SimpleObjectType, error)
	GetObjectTypeIDsByKnID(ctx context.Context, knID string) ([]string, error)

	SearchObjectTypes(ctx context.Context, query *ConceptsQuery) (ObjectTypes, error)

	// 获取对象类基本信息（无翻译依赖资源）
	GetObjectTypesMapByIDs(ctx context.Context, knID string, otIDs []string, needPropMap bool) (map[string]*ObjectType, error)

	// 对象类写索引
	InsertOpenSearchData(ctx context.Context, objectTypes []*ObjectType) error
}

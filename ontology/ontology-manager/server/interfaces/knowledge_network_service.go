package interfaces

import (
	"context"
	"database/sql"
)

//go:generate mockgen -source ../interfaces/knowledge_network_service.go -destination ../interfaces/mock/mock_kn_service.go
type KNService interface {
	CheckKNExistByID(ctx context.Context, knID string) (string, bool, error)
	CheckKNExistByName(ctx context.Context, knName string) (string, bool, error)
	CreateKN(ctx context.Context, kn *KN, mode string) (string, error)
	ListKNs(ctx context.Context, query KNsQueryParams) ([]*KN, int, error)
	GetKNByID(ctx context.Context, knID string, mode string) (*KN, error)
	UpdateKN(ctx context.Context, tx *sql.Tx, kn *KN) error
	UpdateKNDetail(ctx context.Context, knID string, detail string) error
	DeleteKN(ctx context.Context, kn *KN) (int64, error)

	GetRelationTypePaths(ctx context.Context, query RelationTypePathsBaseOnSource) ([]RelationTypePath, error)
}

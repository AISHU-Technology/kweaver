package interfaces

import (
	"context"
	"database/sql"
)

//go:generate mockgen -source ../interfaces/knowledge_network_access.go -destination ../interfaces/mock/mock_knowledge_network_access.go
type KNAccess interface {
	CheckKNExistByID(ctx context.Context, knID string) (string, bool, error)
	CheckKNExistByName(ctx context.Context, knName string) (string, bool, error)

	CreateKN(ctx context.Context, tx *sql.Tx, kn *KN) error
	ListKNs(ctx context.Context, query KNsQueryParams) ([]*KN, error)
	GetKNsTotal(ctx context.Context, query KNsQueryParams) (int, error)
	GetKNByID(ctx context.Context, knID string) (*KN, error)
	UpdateKN(ctx context.Context, tx *sql.Tx, kn *KN) error
	UpdateKNDetail(ctx context.Context, knID string, detail string) error
	DeleteKN(ctx context.Context, tx *sql.Tx, knID string) (int64, error)

	GetAllKNs(ctx context.Context) (map[string]*KN, error)
	GetNeighborPathsBatch(ctx context.Context, otIDs []string, direction string) (map[string][]RelationTypePath, error)
}

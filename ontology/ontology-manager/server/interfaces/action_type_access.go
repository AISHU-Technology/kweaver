package interfaces

import (
	"context"
	"database/sql"
)

//go:generate mockgen -source ../interfaces/action_type_access.go -destination ../interfaces/mock/mock_action_type_access.go
type ActionTypeAccess interface {
	CheckActionTypeExistByID(ctx context.Context, knID string, atID string) (string, bool, error)
	CheckActionTypeExistByName(ctx context.Context, knID string, atName string) (string, bool, error)

	CreateActionType(ctx context.Context, tx *sql.Tx, actionType *ActionType) error
	ListActionTypes(ctx context.Context, query ActionTypesQueryParams) ([]*ActionType, error)
	GetActionTypesTotal(ctx context.Context, query ActionTypesQueryParams) (int, error)
	GetActionTypesByIDs(ctx context.Context, knID string, atIDs []string) ([]*ActionType, error)
	UpdateActionType(ctx context.Context, tx *sql.Tx, actionType *ActionType) error
	DeleteActionTypes(ctx context.Context, tx *sql.Tx, knID string, atIDs []string) (int64, error)

	GetAllActionTypesByKnID(ctx context.Context, knID string) (map[string]*ActionType, error)
	GetActionTypeIDsByKnID(ctx context.Context, knID string) ([]string, error)
}

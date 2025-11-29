package interfaces

import (
	"context"
	"database/sql"
)

//go:generate mockgen -source ../interfaces/action_type_service.go -destination ../interfaces/mock/mock_action_type_service.go
type ActionTypeService interface {
	CheckActionTypeExistByID(ctx context.Context, knID string, atID string) (string, bool, error)
	CheckActionTypeExistByName(ctx context.Context, knID string, atName string) (string, bool, error)
	CreateActionTypes(ctx context.Context, tx *sql.Tx, actionTypes []*ActionType, mode string) ([]string, error)
	ListActionTypes(ctx context.Context, query ActionTypesQueryParams) ([]*ActionType, int, error)
	GetActionTypes(ctx context.Context, knID string, atIDs []string) ([]*ActionType, error)
	UpdateActionType(ctx context.Context, tx *sql.Tx, actionType *ActionType) error
	DeleteActionTypes(ctx context.Context, tx *sql.Tx, knID string, atIDs []string) (int64, error)

	GetActionTypeIDsByKnID(ctx context.Context, knID string) ([]string, error)

	SearchActionTypes(ctx context.Context, query *ConceptsQuery) (ActionTypes, error)

	// 写行动类到索引
	InsertOpenSearchData(ctx context.Context, actionTypes []*ActionType) error
}

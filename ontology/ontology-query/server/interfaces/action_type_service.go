package interfaces

import "context"

//go:generate mockgen -source ../interfaces/data_connection_service.go -destination ../interfaces/mock/mock_data_connection_service.go
type ActionTypeService interface {
	GetActionsByActionTypeID(ctx context.Context, query *ActionQuery) (Actions, error)
}

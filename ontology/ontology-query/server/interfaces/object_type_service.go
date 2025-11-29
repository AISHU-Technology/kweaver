package interfaces

import "context"

//go:generate mockgen -source ../interfaces/data_connection_service.go -destination ../interfaces/mock/mock_data_connection_service.go
type ObjectTypeService interface {
	GetObjectsByObjectTypeID(ctx context.Context, query *ObjectQueryBaseOnObjectType) (Objects, error)
	GetObjectPropertyValue(ctx context.Context, query *ObjectPropertyValueQuery) (Objects, error)
}

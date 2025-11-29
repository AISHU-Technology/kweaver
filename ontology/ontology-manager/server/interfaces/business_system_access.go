package interfaces

import "context"

//go:generate mockgen -source ../interfaces/business_system_access.go -destination ../interfaces/mock/mock_business_system_access.go
type BusinessSystemAccess interface {
	BindResource(ctx context.Context, bd_id string, rid string, rtype string) error
	UnbindResource(ctx context.Context, bd_id string, rid string, rtype string) error
}

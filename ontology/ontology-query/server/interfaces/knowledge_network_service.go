package interfaces

import "context"

//go:generate mockgen -source ../interfaces/data_connection_service.go -destination ../interfaces/mock/mock_data_connection_service.go
type KnowledgeNetworkService interface {
	SearchSubgraph(ctx context.Context, query *SubGraphQueryBaseOnSource) (ObjectSubGraph, error)
	SearchSubgraphByTypePath(ctx context.Context, query *SubGraphQueryBaseOnTypePath) (PathsEntries, error)
}

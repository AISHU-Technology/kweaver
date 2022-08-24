package initialize

import "kw-studio/service"

var (
	GraphDBService    *service.GraphDBService
	OpenSearchService *service.OpenSearchService
)

func InitServices() {
	GraphDBService = &service.GraphDBService{}
	OpenSearchService = &service.OpenSearchService{}
}

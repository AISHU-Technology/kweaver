package initialize

import (
	"kw-studio/global"
	"kw-studio/service"
)

var (
	GraphDBService    *service.GraphDBService
	OpenSearchService *service.OpenSearchService
	SwaggerService    *service.SwaggerService
)

func InitServices() {
	GraphDBService = &service.GraphDBService{}
	OpenSearchService = &service.OpenSearchService{}
	SwaggerService = &service.SwaggerService{Swagger: global.SwaggerHttpService}
}

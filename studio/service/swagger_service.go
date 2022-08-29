package service

import (
	"kw-studio/global"
	"kw-studio/http"
)

type SwaggerService struct {
	Swagger http.Swagger
}

func (service *SwaggerService) GetSwaggerDoc() interface{} {
	var swaggerDoc = map[string]interface{}{
		"info": map[string]interface{}{
			"title":       global.Config.Swagger.Title,
			"version":     global.Config.Swagger.Version,
			"description": global.Config.Swagger.Description,
			"license": map[string]interface{}{
				"name": global.Config.Swagger.License["name"],
				"url":  global.Config.Swagger.License["url"],
			},
		},
		"tags": global.Config.Swagger.Tags,
	}
	docChan := make(chan map[string]interface{}, len(global.Config.Swagger.DocUrls))
	//发送请求获取doc
	for _, url := range global.Config.Swagger.DocUrls {
		go func() {
			docChan <- service.Swagger.GetSwaggerDoc(url)
		}()
	}
	//合并doc
	for docCount := 0; docCount < len(global.Config.Swagger.DocUrls); {
		select {
		case doc := <-docChan:
			if doc != nil {
				swaggerDoc["swagger"] = doc["swagger"]
				for path, v := range doc["paths"].(map[string]interface{}) {
					if swaggerDoc["paths"] == nil {
						swaggerDoc["paths"] = map[string]interface{}{path: v}
						continue
					}
					swaggerDoc["paths"].(map[string]interface{})[path] = v
				}
				for definition, v := range doc["definitions"].(map[string]interface{}) {
					if swaggerDoc["definitions"] == nil {
						swaggerDoc["definitions"] = map[string]interface{}{definition: v}
						continue
					}
					swaggerDoc["definitions"].(map[string]interface{})[definition] = v
				}
			}
			docCount++
		default:
		}
	}
	return swaggerDoc
}

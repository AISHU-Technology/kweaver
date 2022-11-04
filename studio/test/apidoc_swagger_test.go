package test

import (
	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"
	"kw-studio/global"
	"kw-studio/test/mock"
	"net/http"
	"testing"
)

func TestGetSwaggerDoc(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	swaggerHttpServiceMock := mock.NewMockSwagger(ctrl)
	swaggerHttpServiceMock.EXPECT().GetSwaggerDoc(gomock.Any()).Return(map[string]interface{}{
		"swagger": "2.0",
		"paths": map[string]interface{}{
			"/api/studio/v1/graphdb": map[string]interface{}{
				"get": map[string]interface{}{
					"description": "根据id查询存储配置信息",
					"consumes": []string{
						"application/x-www-form-urlencoded",
					},
					"produces": []string{
						"application/json",
					},
					"tags": []string{
						"Studio",
					},
					"summary": "根据id查询存储配置信息",
					"parameters": []map[string]interface{}{
						{
							"type":        "integer",
							"description": "存储记录id",
							"name":        "id",
							"in":          "query",
						},
					},
					"responses": map[string]interface{}{
						"200": map[string]interface{}{
							"description": "存储配置信息",
							"schema": map[string]interface{}{
								"$ref": "#/definitions/vo.GraphDBVo",
							},
						},
						"400": map[string]interface{}{
							"description": "参数异常",
							"schema": map[string]interface{}{
								"$ref": "#/definitions/kw_errors.Error",
							},
						},
						"500": map[string]interface{}{
							"description": "服务内部异常",
							"schema": map[string]interface{}{
								"$ref": "#/definitions/kw_errors.Error",
							},
						},
					},
				},
			},
		},
		"definitions": map[string]interface{}{
			"kw_errors.Error": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"Description": map[string]interface{}{
						"type": "string",
					},
					"ErrorCode": map[string]interface{}{
						"type": "string",
					},
					"ErrorDetails": map[string]interface{}{
						"type":  "array",
						"items": map[string]interface{}{},
					},
					"ErrorLink": map[string]interface{}{
						"type": "string",
					},
					"Solution": map[string]interface{}{
						"type": "string",
					},
				},
			},
		},
	})
	swaggerHttpServiceMock.EXPECT().GetSwaggerDoc(gomock.Any()).Return(map[string]interface{}{
		"swagger": "2.0",
		"paths": map[string]interface{}{
			"/api/studio/v1/graphdb/add": map[string]interface{}{
				"post": map[string]interface{}{
					"description": "添加存储配置",
					"consumes": []string{
						"application/json",
					},
					"produces": []string{
						"application/json",
					},
					"tags": []string{
						"Studio",
					},
					"summary": "添加存储配置",
					"parameters": []map[string]interface{}{
						{
							"description": "添加的存储配置",
							"name":        "graphDBVo",
							"in":          "body",
							"required":    true,
							"schema": map[string]interface{}{
								"$ref": "#/definitions/vo.GraphDBVo",
							},
						},
					},
					"responses": map[string]interface{}{
						"200": map[string]interface{}{
							"description": "添加的存储配置id",
							"schema": map[string]interface{}{
								"type": "number",
							},
						},
						"400": map[string]interface{}{
							"description": "参数异常",
							"schema": map[string]interface{}{
								"$ref": "#/definitions/kw_errors.Error",
							},
						},
						"500": map[string]interface{}{
							"description": "服务内部异常",
							"schema": map[string]interface{}{
								"$ref": "#/definitions/kw_errors.Error",
							},
						},
					},
				},
			},
		},
		"definitions": map[string]interface{}{
			"vo.OpenSearchIdVo": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"id": map[string]interface{}{
						"type": "integer",
					},
				},
			},
		},
	})
	swaggerHttpServiceMock.EXPECT().GetSwaggerDoc(gomock.Any()).Return(map[string]interface{}{
		"swagger": "2.0",
		"paths": map[string]interface{}{
			"/api/studio/v1/opensearch/update": map[string]interface{}{
				"post": map[string]interface{}{
					"description": "根据id更新opensearch配置",
					"consumes": []string{
						"application/json",
					},
					"produces": []string{
						"application/json",
					},
					"tags": []string{
						"Studio",
					},
					"summary": "根据id更新opensearch配置",
					"parameters": []map[string]interface{}{
						{
							"description": "待更新的opensearch配置信息",
							"name":        "opensearchUpdateVo",
							"in":          "body",
							"required":    true,
							"schema": map[string]interface{}{
								"$ref": "#/definitions/vo.OpenSearchUpdateVo",
							},
						},
					},
					"responses": map[string]interface{}{
						"200": map[string]interface{}{
							"description": "ok",
							"schema": map[string]interface{}{
								"type": "string",
							},
						},
						"400": map[string]interface{}{
							"description": "参数异常",
							"schema": map[string]interface{}{
								"$ref": "#/definitions/kw_errors.Error",
							},
						},
						"500": map[string]interface{}{
							"description": "服务内部异常",
							"schema": map[string]interface{}{
								"$ref": "#/definitions/kw_errors.Error",
							},
						},
					},
				},
			},
		},
		"definitions": map[string]interface{}{
			"vo.OpenSearchTestVo": map[string]interface{}{
				"type": "object",
				"required": []string{
					"password",
					"user",
				},
				"properties": map[string]interface{}{
					"ip": map[string]interface{}{
						"type": "array",
						"items": map[string]interface{}{
							"type": "string",
						},
					},
					"password": map[string]interface{}{
						"type":      "string",
						"maxLength": 150,
					},
					"port": map[string]interface{}{
						"type": "array",
						"items": map[string]interface{}{
							"type": "string",
						},
					},
					"user": map[string]interface{}{
						"type":      "string",
						"maxLength": 50,
					},
				},
			},
		},
	})
	global.SwaggerHttpService = swaggerHttpServiceMock

	r := DoRequest(http.MethodGet, "/api/studio/v1/swaggerDoc", nil)
	assert.Equal(t, http.StatusOK, r.Code)
}

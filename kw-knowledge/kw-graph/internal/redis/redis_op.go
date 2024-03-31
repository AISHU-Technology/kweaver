// Package redis implements a Redis client.
package redis

import (
	"context"
	"fmt"
	"net/http"

	jsoniter "github.com/json-iterator/go"
	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/logic/repo"
	"kw-graph/utils"
)

// 编译器检查是否异常
var _ repo.RedisOpRepo = (*RedisOperation)(nil)

// RedisOperation redis操作对象
type RedisOperation struct {
	redisClient *RedisConn
}

// NewRedisOperationRepo redis操作对象实例化
func NewRedisOperationRepo(redis *RedisConn) repo.RedisOpRepo {
	return &RedisOperation{
		redisClient: redis,
	}
}

// GetGraphInfoByKgID 根据图谱ID获取图谱信息
func (r *RedisOperation) GetGraphInfoByKgID(ctx context.Context, kgID string) (*repo.GraphInfo, error) {
	redisGraphKey := "graph_" + kgID
	info, err := r.redisClient.HGetAll(ctx, redisGraphKey).Result()
	if err != nil {
		return nil, errorCode.New(http.StatusInternalServerError, errorCode.InternalErr, fmt.Sprintf("Redis get graph info error: %s", err.Error()))
	}

	if len(info) == 0 {
		return nil, nil
	}

	graphInfo := &repo.GraphInfo{
		OntologyInfo: &repo.OntologyInfo{
			Entities: make(map[string]*repo.Class),
			Egdes:    make(map[string]*repo.Class),
		},
	}

	if dbname, ok := info["dbname"]; ok {
		graphInfo.DBName = utils.TrimQuotationMarks(dbname)
	}

	if entity, ok := info["entity"]; ok {
		entityList := []interface{}{}
		err = jsoniter.UnmarshalFromString(entity, &entityList)
		if err != nil {
			return nil, errorCode.New(http.StatusBadRequest, errorCode.ResourceNotFound, fmt.Sprintf("graph %s info json unmarsha error: %s", kgID, err.Error()))
		}
		for _, vertex := range entityList {
			v := vertex.(map[string]interface{})
			vClass := &repo.Class{
				Name:       v["name"].(string),
				Color:      v["fill_color"].(string),
				Alias:      v["alias"].(string),
				Icon:       v["icon"].(string),
				Properties: make(map[string]*repo.Property),
			}
			if val, ok := v["default_tag"].(string); ok {
				vClass.DefaultProperty = val
			}

			for _, prop := range v["properties"].([]interface{}) {
				p := &repo.Property{
					Name:  prop.(map[string]interface{})["name"].(string),
					Alias: prop.(map[string]interface{})["alias"].(string),
					Type:  prop.(map[string]interface{})["data_type"].(string),
				}
				vClass.Properties[p.Name] = p
			}
			graphInfo.OntologyInfo.Entities[vClass.Name] = vClass
		}
	}
	if edge, ok := info["edge"]; ok {
		edgeList := []interface{}{}
		err = jsoniter.UnmarshalFromString(edge, &edgeList)
		if err != nil {
			return nil, errorCode.New(http.StatusBadRequest, errorCode.ResourceNotFound, fmt.Sprintf("graph %s info json unmarsha error: %s", kgID, err.Error()))
		}
		for _, edge := range edgeList {
			v := edge.(map[string]interface{})
			vClass := &repo.Class{
				Name:       v["name"].(string),
				Color:      v["colour"].(string),
				Alias:      v["alias"].(string),
				Properties: make(map[string]*repo.Property),
			}

			for _, prop := range v["properties"].([]interface{}) {
				p := &repo.Property{
					Name:  prop.(map[string]interface{})["name"].(string),
					Alias: prop.(map[string]interface{})["alias"].(string),
					Type:  prop.(map[string]interface{})["data_type"].(string),
				}
				vClass.Properties[p.Name] = p
			}
			graphInfo.OntologyInfo.Egdes[vClass.Name] = vClass
		}
	}

	return graphInfo, nil
}

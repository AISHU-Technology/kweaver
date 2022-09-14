// @Author : yuan.qi@aishu.cn
// @File : class_model_type.go
// @Time : 2021/3/26

package dao

import (
	sql2 "database/sql"
	"encoding/json"
	"fmt"
	"graph-engine/utils"
	"strings"
)

type Model struct {
	Entity []map[string]interface{}
	Edge   []map[string]interface{}
}

func GetClassModelType(kgid int) (res *Model, err error) {
	var modelRes Model

	engine := utils.GetConnect()

	sql := "select graph_otl from graph_config_table where id in (select KG_config_id from knowledge_graph where id=%d)"
	sql = fmt.Sprintf(sql, kgid)

	otlid, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer otlid.Close()

	var graphOtl string
	for otlid.Next() {
		var graph_otl sql2.NullString
		err = otlid.Scan(&graph_otl)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		graphOtl = graph_otl.String
	}
	if graphOtl == "" {
		return nil, nil
	}

	// 获取本体信息
	otlidStr := strings.TrimRight(graphOtl, "]")
	otlidStr = strings.TrimLeft(otlidStr, "[")
	if otlidStr == "" {
		return nil, nil
	}

	sqlOtl := "select entity, edge from ontology_table where id=%s"
	sqlOtl = fmt.Sprintf(sqlOtl, otlidStr)

	otl, err := engine.Query(sqlOtl)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer otl.Close()

	for otl.Next() {
		var (
			entity string
			edge   string
		)
		err := otl.Scan(&entity, &edge)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		entityStr := strings.Replace(entity, "'", "\"", -1)
		entityStr = strings.Replace(entityStr, "\n", "", -1)

		if err := json.Unmarshal([]byte(entityStr), &modelRes.Entity); err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		edgeStr := strings.Replace(edge, "'", "\"", -1)
		edgeStr = strings.Replace(edgeStr, "\n", "", -1)

		if err := json.Unmarshal([]byte(edgeStr), &modelRes.Edge); err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
	}

	return &modelRes, nil
}

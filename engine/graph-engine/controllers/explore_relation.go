package controllers

import (
	"graph-engine/models"
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"net/http"
	"strconv"
	"strings"
)

type Relation struct {
	Res []RelationEdges `json:"res"`
}
type RelationEdges struct {
	EName       string           `json:"name"`
	EClass      string           `json:"class"`
	EAlias      string           `json:"alias"`
	EColor      string           `json:"color"`
	EProperties []EdgeProperties `json:"properties"`
	ERid        string           `json:"rid"`
	EIn         string           `json:"in"`
	EOut        string           `json:"out"`
}
type EdgeProperties struct {
	PName  string `json:"name"`
	PValue string `json:"value"`
	PType  string `json:"type"`
}

func ExploreRelation(id string, rids []string) (httpcode int, res interface{}) {
	var edgeRes Relation
	edgeRes.Res = make([]RelationEdges, 0)

	// 数据库获取配置
	conf, err := utils.GetKGConfByKGID(id)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	queryRes, err := models.ExploreRelation(&conf, rids)
	if err != nil {
		return 500, err
	}

	switch queryRes.(type) {
	case orient.ExRelation:
		for _, e := range queryRes.(orient.ExRelation).Res {
			relationEdgeInfo := RelationEdges{
				EName:  e.Name,
				EClass: e.Class,
				EAlias: e.Alias,
				EColor: e.Color,
				ERid:   e.Rid,
				EIn:    e.In,
				EOut:   e.Out,
			}

			for _, p := range e.Properties {
				relationEdgeInfo.EProperties = append(relationEdgeInfo.EProperties, EdgeProperties{
					PName:  p.Name,
					PValue: p.Value,
					PType:  p.DataType,
				})
			}
			edgeRes.Res = append(edgeRes.Res, relationEdgeInfo)
		}

	case nebula.ExRelation:
		for _, e := range queryRes.(nebula.ExRelation).Res {
			relationEdgeInfo := RelationEdges{
				EName:  e.Name,
				EClass: e.Class,
				EAlias: e.Alias,
				EColor: e.Color,
				ERid:   e.Rid,
				EIn:    e.In,
				EOut:   e.Out,
			}

			for _, p := range e.Properties {
				relationEdgeInfo.EProperties = append(relationEdgeInfo.EProperties, EdgeProperties{
					PName:  p.Name,
					PValue: p.Value,
					PType:  p.DataType,
				})
			}
			edgeRes.Res = append(edgeRes.Res, relationEdgeInfo)
		}

	default:
		return 200, nil

	}

	return http.StatusOK, edgeRes
}

func processE(rec *RelationEdges, k string, v interface{}) {
	if strings.HasPrefix(k, "@") || strings.HasPrefix(k, "in") || strings.HasPrefix(k, "out") {
		return
	}

	if ok := strings.HasSuffix(strings.ToLower(k), "name"); rec.EName != "" && ok {
		rec.EName = v.(string)
	}

	var value, vtype string
	switch v.(type) {
	case string:
		{
			vtype = "STRING"
			value = v.(string)
		}
	case float64:
		{
			vtype = "FLOAT"
			value = strconv.FormatFloat(v.(float64), 'f', -1, 64)
		}
	}

	prop := EdgeProperties{
		PName:  k,
		PValue: value,
		PType:  vtype,
	}

	rec.EProperties = append(rec.EProperties, prop)

}

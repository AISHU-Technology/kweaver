package orient

import (
	"errors"
	"fmt"
	"graph-engine/models/dao"
	"graph-engine/utils"
	"strconv"
	"strings"
)

type ExRelation struct {
	Res []Relation
}
type Relation struct {
	Rid        string
	Class      string
	Color      string
	Alias      string
	Name       string
	Properties []PropValue
	In         string
	Out        string
}

func (er *ExRelation) ExploreRelation(conf *utils.KGConf, rids []string) error {
	if conf.ID == "" {
		return utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	var queryRes QueryRes
	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/command/" + conf.DB + "/sql",
		Method: "command",
	}

	sqlEdge := fmt.Sprintf("select from E where (in=%s and out=%s) or (in=%s and out=%s)", rids[0], rids[1], rids[1], rids[0])

	err := queryRes.ParseOrientResponse(operator, sqlEdge)
	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	kgid, _ := strconv.Atoi(conf.ID)
	model, err := dao.GetClassModelType(kgid)
	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	for _, query := range queryRes.Res.([]interface{}) {
		qMap := query.(map[string]interface{})

		re := Relation{
			Rid:        qMap["@rid"].(string),
			Class:      qMap["@class"].(string),
			Name:       qMap["@class"].(string),
			Properties: nil,
			Alias:      qMap["@class"].(string),
			In:         qMap["in"].(string),
			Out:        qMap["out"].(string),
		}

		processFunc := func(k string, v interface{}) {
			processE(&re, k, v)
		}
		utils.SortedMap(qMap, processFunc)

		// 获取class颜色
		if model != nil {
			for _, e := range model.Edge {
				if qMap["@class"].(string) == e["name"] {
					re.Color = e["colour"].(string)
					re.Alias = e["alias"].(string)
				}
			}
		}

		er.Res = append(er.Res, re)
	}

	return nil
}

func processE(rec *Relation, k string, v interface{}) {
	if strings.HasPrefix(k, "@") || strings.HasPrefix(k, "in") || strings.HasPrefix(k, "out") {
		return
	}

	if ok := strings.HasSuffix(strings.ToLower(k), "name"); rec.Name != "" && ok {
		rec.Name = v.(string)
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

	prop := PropValue{
		Name:     k,
		Value:    value,
		DataType: vtype,
	}

	rec.Properties = append(rec.Properties, prop)

}

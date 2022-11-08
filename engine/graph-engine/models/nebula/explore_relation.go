package nebula

import (
	"errors"
	"fmt"
	"graph-engine/models/dao"
	"graph-engine/utils"
	"sort"
	"strconv"
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

	kgid, _ := strconv.Atoi(conf.ID)
	model, err := dao.GetClassModelType(kgid)
	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	nebula := Nebula{}

	gql := "match (v)-[e]-(v2) where id(v) in ['%s'] and id(v2) in ['%s'] return e;"
	gql = fmt.Sprintf(gql, rids[0], rids[1])

	resultSet, err := nebula.Client(conf, gql)
	if err != nil {
		return err
	}

	for i := 0; i < resultSet.GetRowSize(); i++ {
		row, _ := resultSet.GetRowValuesByIndex(i)
		valWrap, _ := row.GetValueByIndex(0)

		edge, err := valWrap.AsRelationship()
		if err != nil {
			return utils.ErrInfo(utils.ErrNebulaErr, err)
		}

		ePro := edge.Properties()

		re := Relation{
			Rid:   edge.GetEdgeName() + ":" + edge.GetSrcVertexID().String() + "->" + edge.GetDstVertexID().String(),
			Class: edge.GetEdgeName(),
			Name:  utils.TrimQuotationMarks(ePro["name"].String()),
			In:    utils.TrimQuotationMarks(edge.GetDstVertexID().String()),
			Out:   utils.TrimQuotationMarks(edge.GetSrcVertexID().String()),
		}

		var proKeys []string
		for key, _ := range ePro {
			proKeys = append(proKeys, key)
			sort.Strings(proKeys)
		}
		for _, key := range proKeys {
			re.Properties = append(re.Properties, PropValue{
				Name:     key,
				Value:    utils.TrimQuotationMarks(ePro[key].String()),
				DataType: ePro[key].GetType(),
			})
		}

		if model != nil {
			for _, e := range model.Edge {
				if re.Class == e["name"] {
					re.Color = e["colour"].(string)
					re.Alias = e["alias"].(string)
				}
			}
		}

		er.Res = append(er.Res, re)
	}
	return nil
}

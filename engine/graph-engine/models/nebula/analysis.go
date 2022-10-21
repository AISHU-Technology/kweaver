package nebula

import (
	"errors"
	"fmt"
	"graph-engine/utils"
)

type AnalysisRes struct {
	Res *VInfo
}

type VInfo struct {
	Name  string
	Class string
	Gns   string
	DsID  string
	In    []interface{}
	Out   []interface{}
}

func (a *AnalysisRes) Analysis(conf *utils.KGConf, rid string) error {
	if conf.ID == "" {
		return utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	// 首次配置无推荐
	if conf.ConfigStatus == "edit" {
		return utils.ErrInfo(utils.ErrConfigStatusErr, errors.New("KG config status is edit"))
	}

	var schema Schema
	err := schema.GetSchema(conf)
	if err != nil {
		return err
	}

	if schema.V == nil {
		return utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))
	}

	var nebula Nebula

	// 仅对document进行分析报告
	gqlTag := "match (v) where id(v) in ['%s'] return v"
	gqlTag = fmt.Sprintf(gqlTag, rid)

	resultSet, err := nebula.Client(conf, gqlTag)
	if err != nil {
		return err
	}
	row, err := resultSet.GetRowValuesByIndex(0)
	if err != nil {
		return utils.ErrInfo(utils.ErrNebulaErr, err)
	}
	valWrap, _ := row.GetValueByIndex(0)
	node, _ := valWrap.AsNode()

	tag := node.GetTags()[0]
	if tag == "" {
		return utils.ErrInfo(utils.ErrOrientDBErr, errors.New("class is null"))
	}
	if tag != "document" {
		return utils.ErrInfo(utils.ErrNebulaErr, errors.New("class is not document"))
	}

	gql := "match (v)-[e]-(v2) where id(v) in ['%s'] return v, e, v2;"
	gql = fmt.Sprintf(gql, rid)
	gqlRes, err := nebula.Client(conf, gql)
	if err != nil {
		return err
	}

	var vInfo VInfo
	for i := 0; i < gqlRes.GetRowSize(); i++ {
		row, _ := gqlRes.GetRowValuesByIndex(i)

		v, _ := row.GetValueByColName("v")
		e, _ := row.GetValueByColName("e")
		v2, _ := row.GetValueByColName("v2")
		node, _ := v.AsNode()
		edge, _ := e.AsRelationship()
		node2, _ := v2.AsNode()

		nodePro, _ := node.Properties(node.GetTags()[0])
		vInfo.Name = nodePro["name"].String()[1 : len(nodePro["name"].String())-1]
		vInfo.Class = node.GetTags()[0]
		vInfo.Gns = nodePro["gns"].String()[1 : len(nodePro["gns"].String())-1]
		vInfo.DsID = nodePro["ds_id"].String()[1 : len(nodePro["ds_id"].String())-1]

		node2Pro, _ := node2.Properties(node2.GetTags()[0])
		newNode2Pro := make(map[string]interface{}, len(node2Pro))
		for k, value := range node2Pro {
			newNode2Pro[k] = value.String()[1 : len(value.String())-1]
		}
		newNode2Pro["@class"] = node2.GetTags()[0]

		nodeId, _ := node.GetID().AsString()
		edgeSrcId, _ := edge.GetSrcVertexID().AsString()
		edgeDstId, _ := edge.GetDstVertexID().AsString()

		if nodeId == edgeSrcId {
			vInfo.In = append(vInfo.In, newNode2Pro)
		}
		if nodeId == edgeDstId {
			vInfo.Out = append(vInfo.Out, newNode2Pro)
		}
	}
	a.Res = &vInfo
	return nil

}

// Package customsearch 自定义查询数据层实现
package customsearch

import (
	"context"

	model "kw-graph/internal/graphdb/nebula"
	"kw-graph/internal/logic/repo"
	"kw-graph/utils"

	mapset "github.com/deckarep/golang-set/v2"
	nebula "github.com/vesoft-inc/nebula-go/v3"
	"github.com/zeromicro/go-zero/core/logx"
)

// 编译器检查是否异常
var _ repo.CustomSearchRepo = (*customSearchRepo)(nil)

type customSearchRepo struct {
	nebula model.NebulaExecuteRepo
}

// NewCustomSearchRepo 对象实例化
func NewCustomSearchRepo(nebulaRepo model.NebulaExecuteRepo) repo.CustomSearchRepo {
	return &customSearchRepo{
		nebula: nebulaRepo,
	}
}

// CustomSearch 自定义查询
func (c *customSearchRepo) CustomSearch(ctx context.Context, qeury, spaceName string, givenJSON bool) ([]*repo.CustomSearchInfo, *repo.NodesInfoAllType, error) {
	logx.WithContext(ctx).Infof("CustomSearch by: %v, space: %s", qeury, spaceName)
	res, _, err := c.nebula.Execute(ctx, qeury, spaceName, false)
	if err != nil {
		return nil, nil, err
	}
	if res != nil && res.IsEmpty() {
		return []*repo.CustomSearchInfo{}, nil, nil
	}

	resList := make([]*repo.CustomSearchInfo, 0)
	keys := res.GetColNames()
	vIdsInEdges := mapset.NewSet[string]()
	vidsInPath := mapset.NewSet[string]()
	for i := 0; i < res.GetRowSize(); i++ {
		info := &repo.CustomSearchInfo{}
		rowValue, _ := res.GetRowValuesByIndex(i)
		for _, key := range keys {
			if ColInfos, err := rowValue.GetValueByColName(key); err == nil {
				if errInfo := c.recursiveParseRecording(info, ColInfos, key); errInfo != nil {
					return nil, nil, errInfo
				}
			} else {
				return nil, nil, err
			}
		}
		if len(info.EdgesParsedList) > 0 {
			for _, edge := range info.EdgesParsedList {
				vIdsInEdges.Add(edge.SrcID)
				vIdsInEdges.Add(edge.DstID)
			}
		} else if len(info.PathsParsedList) > 0 && len(info.PathsParsedList[0].Nodes[0].Properties) == 0 {
			for _, path := range info.PathsParsedList {
				for _, node := range path.Nodes {
					vidsInPath.Add(node.Vid)
				}
			}
		}
		resList = append(resList, info)
	}
	idsInEdge := []string{}
	for item := range vIdsInEdges.Iter() {
		idsInEdge = append(idsInEdge, item)
	}
	nodesDetailInEdge, err := c.getVInfoOnEdge(ctx, spaceName, idsInEdge)
	if err != nil {
		return nil, nil, err
	}

	idsInPath := []string{}
	for item := range vidsInPath.Iter() {
		idsInPath = append(idsInPath, item)
	}
	nodesDetailInPath, err := c.getVInfoOnEdge(ctx, spaceName, idsInPath)
	if err != nil {
		return nil, nil, err
	}

	nodesDetail := &repo.NodesInfoAllType{
		Path: nodesDetailInPath,
		Edge: nodesDetailInEdge,
	}
	return resList, nodesDetail, nil
}

// recursiveParseRecording 递归解析结果
func (c *customSearchRepo) recursiveParseRecording(info *repo.CustomSearchInfo, valWrap *nebula.ValueWrapper, column string) error {
	// 如果类型为点
	if valWrap.IsVertex() {
		node, err := valWrap.AsNode()
		if err != nil {
			return err
		}
		vInfo, err := c.parseInfoOnVectex(node)
		if err != nil {
			return err
		}
		info.VerticesParsedList = append(info.VerticesParsedList, vInfo)
	} else if valWrap.IsList() {
		list, err := valWrap.AsList()
		if err != nil {
			return err
		}
		for index := range list {
			if errInfo := c.recursiveParseRecording(info, &list[index], column); errInfo != nil {
				return errInfo
			}
		}
	} else if valWrap.IsEdge() {
		edge, err := valWrap.AsRelationship()
		if err != nil {
			return err
		}
		eInfo := c.parseInfoOnEdge(edge)

		info.EdgesParsedList = append(info.EdgesParsedList, eInfo)
	} else if valWrap.IsPath() {
		path, err := valWrap.AsPath()
		if err != nil {
			return err
		}
		pInfo, err := c.parseInfoOnPath(path)
		if err != nil {
			return err
		}
		info.PathsParsedList = append(info.PathsParsedList, pInfo)
	} else if valWrap.IsSet() {
		set, err := valWrap.AsDedupList()
		if err != nil {
			return err
		}
		for index := range set {
			if errInfo := c.recursiveParseRecording(info, &set[index], column); errInfo != nil {
				return errInfo
			}
		}
	} else {
		textInfo := &repo.TextsParsedList{
			Column: column,
			Value:  utils.TrimQuotationMarks(valWrap.String()),
			Type:   valWrap.GetType(),
		}
		info.TextsParsedList = append(info.TextsParsedList, textInfo)
	}
	return nil
}

// parseInfoOnVectex 解析点
func (c *customSearchRepo) parseInfoOnVectex(node *nebula.Node) (*repo.VerticesParsedList, error) {
	v := &repo.VerticesParsedList{
		Properties: make(map[string]map[string]*repo.Prop),
		Vid:        utils.TrimQuotationMarks(node.GetID().String()),
		Tags:       node.GetTags(),
	}

	if len(node.GetTags()) > 0 {
		v.Tags = node.GetTags()

		for _, tag := range node.GetTags() {
			props, err := node.Properties(tag)
			if err != nil {
				return nil, err
			}
			propsInfo := make(map[string]*repo.Prop)
			for name, prop := range props {
				p := &repo.Prop{
					Value: utils.TrimQuotationMarks(prop.String()),
					Type:  prop.GetType(),
				}
				propsInfo[name] = p
			}
			v.Properties[tag] = propsInfo
		}
	}

	return v, nil
}

// parseInfoOnEdge 解析边
func (c *customSearchRepo) parseInfoOnEdge(edge *nebula.Relationship) *repo.EdgesParsedList {
	e := &repo.EdgesParsedList{
		SrcID:      utils.TrimQuotationMarks(edge.GetSrcVertexID().String()),
		DstID:      utils.TrimQuotationMarks(edge.GetDstVertexID().String()),
		EdgeClass:  edge.GetEdgeName(),
		Properties: make(map[string]*repo.Prop),
	}

	props := edge.Properties()
	for name, prop := range props {
		p := &repo.Prop{
			Value: utils.TrimQuotationMarks(prop.String()),
			Type:  prop.GetType(),
		}
		e.Properties[name] = p
	}

	return e
}

// parseInfoOnPath 解析路径
func (c *customSearchRepo) parseInfoOnPath(path *nebula.PathWrapper) (*repo.PathsParsedList, error) {
	p := &repo.PathsParsedList{
		Nodes:         make([]*repo.VerticesParsedList, 0),
		Relationships: make([]*repo.EdgesParsedList, 0),
	}

	for _, v := range path.GetNodes() {
		vParsedInfo, err := c.parseInfoOnVectex(v)
		if err != nil {
			return nil, err
		}
		p.Nodes = append(p.Nodes, vParsedInfo)
	}

	for _, e := range path.GetRelationships() {
		eParsedInfo := c.parseInfoOnEdge(e)

		p.Relationships = append(p.Relationships, eParsedInfo)
	}
	return p, nil
}

// parseInfoOnEdge 解析边
func (c *customSearchRepo) getVInfoOnEdge(ctx context.Context, space string, ids []string) (map[string]*repo.VerticesParsedList, error) {
	vInfos := map[string]*repo.VerticesParsedList{}
	if len(ids) == 0 {
		return vInfos, nil
	}

	vInfosDetail, err := c.nebula.GetVinfoByIDs(ctx, space, ids)
	if err != nil {
		return nil, err
	}

	for _, v := range vInfosDetail {
		vInfo := &repo.VerticesParsedList{
			Vid:        v.ID,
			Tags:       v.Tags,
			Properties: v.Properties,
		}
		vInfos[v.ID] = vInfo
	}
	return vInfos, nil
}

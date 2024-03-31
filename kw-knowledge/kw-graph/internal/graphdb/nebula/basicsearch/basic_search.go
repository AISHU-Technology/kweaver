// Package basicsearch 数据层图基础查询实现
package basicsearch

/*
业务数据访问，包含 cache、db 等封装，实现了 biz 的 repo 接口。
我们可能会把 data 与 dao 混淆在一起，data 偏重业务的含义，它所要做的是将领域对象重新拿出来，我们去掉了 DDD 的 infra层。
*/
import (
	"context"
	"fmt"
	"sort"
	"strings"

	"kw-graph/utils"

	model "kw-graph/internal/graphdb/nebula"
	"kw-graph/internal/logic/repo"

	"github.com/zeromicro/go-zero/core/logx"
)

// 编译器检查是否异常
var _ repo.GraphBasicSearchRepo = (*graphBasicSearchRepo)(nil)

type graphBasicSearchRepo struct {
	nebula model.NebulaExecuteRepo
}

const (
	// POWBASENUMBER 指数增加的底数声明
	POWBASENUMBER = 2
)

// NewGraphBasicSearchRepo 实例
func NewGraphBasicSearchRepo(nebulaRepo model.NebulaExecuteRepo) repo.GraphBasicSearchRepo {
	return &graphBasicSearchRepo{
		nebula: nebulaRepo,
	}
}

func (gs *graphBasicSearchRepo) GetVertex(ctx context.Context, space, nGql, query string) ([]*repo.Vertex, error) {
	logx.WithContext(ctx).Infof("GetVertex by: %v, space: %s, nGql:%s", query, space, nGql)
	res, _, err := gs.nebula.Execute(ctx, nGql, space, false)
	if err != nil {
		return nil, err
	}
	vInfos := make([]*repo.Vertex, 0)
	for i := 0; i < res.GetRowSize(); i++ {
		rowValue, _ := res.GetRowValuesByIndex(i)
		valWrap, _ := rowValue.GetValueByIndex(0)
		if node, err := valWrap.AsNode(); err == nil {
			id := utils.TrimQuotationMarks(node.GetID().String())
			vertex := &repo.Vertex{
				ID:         id,
				Tags:       node.GetTags(),
				Properties: make(map[string]map[string]*repo.Prop),
			}

			values := []string{}
			for _, tag := range node.GetTags() {
				propMap := map[string]*repo.Prop{}
				if prop, err := node.Properties(tag); err == nil {
					for propName, propValue := range prop {
						p := &repo.Prop{
							Value: utils.TrimQuotationMarks(propValue.String()),
							Type:  propValue.GetType(),
						}
						propMap[propName] = p
						values = append(values, utils.TrimQuotationMarks(propValue.String()))
					}
				}
				vertex.Properties[tag] = propMap
			}
			// 根据关键词过滤点信息
			if query != "" && !utils.In(query, values) {
				continue
			}
			vInfos = append(vInfos, vertex)
		}
	}
	return vInfos, nil
}

// QueryAllOfVids 全文检索基于query查询/VidsSearch 基于vids查询
func (gs *graphBasicSearchRepo) QueryAllOfVids(ctx context.Context, conf map[string]interface{}, filters map[string][]string, query string, vids []string, kDBName string) ([]*repo.NebulaVerticesSearchInfo, int, error) {
	if len(filters) > 0 {
		res, totalNum, err := gs.QueryAllOfVidsByFilters(ctx, conf, filters, query, vids, kDBName)
		if err != nil {
			return nil, -1, err
		}
		return res, totalNum, nil
	}

	res, totalNum, err := gs.QueryAllOfVidsByNoFilters(ctx, conf, query, vids, kDBName)
	if err != nil {
		return nil, -1, err
	}
	return res, totalNum, nil
}

func (gs *graphBasicSearchRepo) QueryAllOfVidsByFilters(ctx context.Context, conf map[string]interface{}, filters map[string][]string, query string, vids []string, kDBName string) ([]*repo.NebulaVerticesSearchInfo, int, error) {
	usedTags := []string{}
	indexTags := []string{}
	skip := (int64(conf["page"].(float64)) - 1) * int64(conf["size"].(float64))
	totalNum := 0 // 查询总数
	res := []*repo.NebulaVerticesSearchInfo{}
	sortVids := []string{}
	sortVids = append(sortVids, vids...)

	if len(vids) > 0 {
		vidsProcess := []string{}
		for i, v := range vids {
			v = "'" + v + "'"
			vids[i] = v
			vidsProcess = append(vidsProcess, v)
		}

		if len(filters) > 0 {
			tagResMap := map[string][]*repo.Vertex{}

			for tag, filter := range filters {
				// 判断此tag 是否在此分页
				if len(usedTags) < int(skip) {
					usedTags = append(usedTags, tag)
					continue
				}
				// size == 0 表示不分页,判断此分页是否已满
				if conf["size"].(float64) != 0 && len(indexTags) == int(conf["size"].(float64)) {
					break
				}

				indexTags = append(indexTags, tag)
				connectStr := " and "
				filterStr := strings.Join(filter, connectStr)

				nGql := ""

				if len(filter) > 0 {
					nGql = fmt.Sprintf("match (%s) where id(%s) in [%s] %s return %s ;", "`"+tag+"`"+":"+"`"+tag+"`", "`"+tag+"`", strings.Join(vidsProcess, ","), "and "+filterStr, "`"+tag+"`")
				} else {
					nGql = fmt.Sprintf("match (%s) where id(%s) in [%s] %s return %s ;", "`"+tag+"`"+":"+"`"+tag+"`", "`"+tag+"`", strings.Join(vidsProcess, ","), "", "`"+tag+"`")
				}

				vertices, err := gs.GetVertex(ctx, kDBName, nGql, query)
				if err != nil {
					return nil, 0, err
				}

				vs := gs.sortVertex(vertices, sortVids)
				tagResMap[tag] = append(tagResMap[tag], vs...)

				// 临时总数，判断临时总数如果大于matching_num，则在当前总数下，计算还需要多少数量进行切分
				tmpNum := totalNum + len(vertices)

				if tmpNum >= int(conf["matching_num"].(float64)) {
					tagResMap[tag] = tagResMap[tag][:(int(conf["matching_num"].(float64)) - totalNum)]
					break
				}

				totalNum += len(vertices)
			}

			for tag, val := range tagResMap {
				verticesInfo := &repo.NebulaVerticesSearchInfo{
					Tag:    tag,
					Vertex: val,
				}
				res = append(res, verticesInfo)
			}
		}
	}
	return res, totalNum, nil
}

func (gs *graphBasicSearchRepo) QueryAllOfVidsByNoFilters(ctx context.Context, conf map[string]interface{}, query string, vids []string, kDBName string) ([]*repo.NebulaVerticesSearchInfo, int, error) {
	usedTags := []string{}
	indexTags := []string{}
	skip := (int64(conf["page"].(float64)) - 1) * int64(conf["size"].(float64))
	res := []*repo.NebulaVerticesSearchInfo{}
	sortVids := []string{}
	sortVids = append(sortVids, vids...)

	if len(vids) > 0 {
		vidsProcess := []string{}
		for i, v := range vids {
			v = "'" + v + "'"
			vids[i] = v
			vidsProcess = append(vidsProcess, v)
		}

		nGql := fmt.Sprintf("match (%s) where id(%s) in [%s] %s return %s limit %d;", "v", "v", strings.Join(vidsProcess, ","), "", "v", len(vids))

		vertices, err := gs.GetVertex(ctx, kDBName, nGql, query)
		if err != nil {
			return nil, 0, err
		}

		vs := gs.sortVertex(vertices, sortVids)
		if int(conf["matching_num"].(float64)) < len(vs) {
			vs = vs[:int(conf["matching_num"].(float64))]
		}

		totalTags := []string{}
		for _, vInfo := range vs {
			for _, tag := range vInfo.Tags {
				if !utils.In(tag, totalTags) {
					totalTags = append(totalTags, tag)
				}

				tmpIndexTags := make([]string, len(indexTags))
				copy(tmpIndexTags, indexTags)
				// utils.In 中对[]string做了排序再去查找，所以index发生了改变需要重新深拷贝一个indexTags
				if utils.In(tag, tmpIndexTags) {
					res[utils.GetIndexInSlice(tag, indexTags)].Vertex = append(res[utils.GetIndexInSlice(tag, indexTags)].Vertex, vInfo)
				} else {
					// 判断此tag是否在usedTags列表，如果在tag是否在此分页
					if utils.In(tag, usedTags) {
						continue
					}
					// 此tag不在usedTags列表,判断此tag是否在此分页
					if len(usedTags) < int(skip) {
						usedTags = append(usedTags, tag)
						continue
					}

					// size==0 表示不分页
					// 判断此分页是否已满
					if conf["size"].(float64) != 0 && len(indexTags) == int(conf["size"].(float64)) {
						break
					}

					verticesInfo := &repo.NebulaVerticesSearchInfo{
						Tag: tag,
					}
					verticesInfo.Vertex = append(verticesInfo.Vertex, vInfo)
					indexTags = append(indexTags, tag)
					res = append(res, verticesInfo)
				}
			}
		}
	}

	return res, len(res), nil
}

// QueryAllOnEmptyQuery 基于空的query查询nebula
func (gs *graphBasicSearchRepo) QueryAllOnEmptyQuery(ctx context.Context, conf map[string]interface{}, filters map[string][]string, query string, vids []string, kDBName string) ([]*repo.NebulaVerticesSearchInfo, error) {
	usedTags := []string{}
	indexTags := []string{}

	skip := (int(conf["page"].(float64) - 1)) * int(conf["size"].(float64))

	res := []*repo.NebulaVerticesSearchInfo{}

	if len(filters) != 0 && filters != nil {
		totalNum := 0                                  // 查询总数
		lastNum := int(conf["matching_num"].(float64)) // 每次查询数量

		for tag, filter := range filters {
			// 判断此tag 是否在此分页
			if len(usedTags) < skip {
				usedTags = append(usedTags, tag)
				continue
			}
			// size == 0 表示不分页,判断此分页是否已满
			if conf["size"].(float64) != 0 && len(indexTags) == int(conf["size"].(float64)) {
				break
			}
			indexTags = append(indexTags, tag)
			nGql := ""
			if len(filter) != 0 && filter != nil {
				connectStr := " and "
				filterStr := strings.Join(filter, connectStr)
				nGql = fmt.Sprintf("MATCH (%s) %s return %s limit %d;", "`"+tag+"`"+":"+"`"+tag+"`", "WHERE "+filterStr, "`"+tag+"`", lastNum)
			} else {
				nGql = fmt.Sprintf("MATCH (%s) %s return %s limit %d;", "`"+tag+"`"+":"+"`"+tag+"`", "", "`"+tag+"`", lastNum)
			}
			vertices, err := gs.GetVertex(ctx, kDBName, nGql, query)
			if err != nil {
				return nil, err
			}
			verticesInfo := &repo.NebulaVerticesSearchInfo{
				Tag: tag,
			}

			verticesInfo.Vertex = vertices
			// 临时总数，判断临时总数如果大于matching_num，则在当前总数下，计算还需要多少数量进行切分
			tmpNum := totalNum + len(vertices)

			if tmpNum >= int(conf["matching_num"].(float64)) {
				verticesInfo.Vertex = verticesInfo.Vertex[:(int(conf["matching_num"].(float64)) - totalNum)]
				res = append(res, verticesInfo)
				break
			}

			totalNum += len(vertices)
			lastNum -= len(vertices)
			res = append(res, verticesInfo)
		}
	} else {
		nGql := fmt.Sprintf("MATCH (%s) %s return %s limit %d;", "v", "", "v", int(conf["matching_num"].(float64)))
		vertices, err := gs.GetVertex(ctx, kDBName, nGql, query)
		if err != nil {
			return nil, err
		}

		totalTags := []string{}
		for _, vInfo := range vertices {
			for _, tag := range vInfo.Tags {
				if !utils.In(tag, totalTags) {
					totalTags = append(totalTags, tag)
				}
				if utils.In(tag, indexTags) {
					res[utils.GetIndexInSlice(tag, indexTags)].Vertex = append(res[utils.GetIndexInSlice(tag, indexTags)].Vertex, vInfo)
				} else {
					// 判断此tag是否在usedTags列表，如果在tag是否在此分页
					if utils.In(tag, usedTags) {
						continue
					}
					// 此tag不在usedTags列表,判断此tag是否在此分页
					if len(usedTags) < skip {
						usedTags = append(usedTags, tag)
						continue
					}

					// size==0 表示不分页
					// 判断此分页是否已满
					if conf["size"].(float64) != 0 && len(indexTags) == int(conf["size"].(float64)) {
						break
					}

					verticesInfo := &repo.NebulaVerticesSearchInfo{
						Tag: tag,
					}

					verticesInfo.Vertex = append(verticesInfo.Vertex, vInfo)
					indexTags = append(indexTags, tag)

					res = append(res, verticesInfo)
				}
			}
		}
	}

	return res, nil
}

// sortVertex 排序函数
func (gs *graphBasicSearchRepo) sortVertex(destin []*repo.Vertex, source []string) []*repo.Vertex {
	target := make([]*repo.Vertex, len(destin))
	copy(target, destin)
	sort.Slice(target, func(i, j int) bool {
		return utils.GetIndexInSlice(target[i].ID, source) < utils.GetIndexInSlice(target[j].ID, source)
	})
	return target
}

func (gs *graphBasicSearchRepo) GetEdge(ctx context.Context, conf map[string][]repo.Edge, space string) ([]*repo.NebulaEdgesSearchInfo, int, error) {
	var eResList []*repo.NebulaEdgesSearchInfo
	count := 0
	nGql := ""
	for k, v := range conf {
		var eRes repo.NebulaEdgesSearchInfo
		typeStr := "`" + k + "`"
		edgesStr := ""
		for _, e := range v {
			edgesStr += "\"" + e.SrcID + "\" -> \"" + e.DstID + "\","
		}
		edgesStr = strings.TrimRight(edgesStr, ",")
		nGql = fmt.Sprintf("FETCH PROP ON %s %s YIELD edge AS e", typeStr, edgesStr)

		res, _, err := gs.nebula.Execute(ctx, nGql, space, false)
		if err != nil {
			return nil, 0, err
		}

		edgeList := make([]*repo.Edge, 0)

		for i := 0; i < res.GetRowSize(); i++ {
			rowValue, _ := res.GetRowValuesByIndex(i)
			valWrap, _ := rowValue.GetValueByIndex(0)
			if e, err := valWrap.AsRelationship(); err == nil {
				srcID, _ := e.GetSrcVertexID().AsString()
				dstID, _ := e.GetDstVertexID().AsString()
				edge := &repo.Edge{
					SrcID:      srcID,
					DstID:      dstID,
					Type:       e.GetEdgeName(),
					Rank:       int(e.GetRanking()),
					Properties: make(map[string]*repo.Prop),
				}

				prop := e.Properties()
				for propName, propValue := range prop {
					p := &repo.Prop{
						Value: utils.TrimQuotationMarks(propValue.String()),
						Type:  propValue.GetType(),
					}
					edge.Properties[propName] = p
				}

				edgeList = append(edgeList, edge)
				count++
			} else {
				return nil, -1, err
			}
		}
		eRes.Type = k
		eRes.Edges = edgeList
		eResList = append(eResList, &eRes)
	}
	return eResList, count, nil
}

// Package custom 自定义查询handler 实现
package custom

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"

	mapset "github.com/deckarep/golang-set/v2"
	"github.com/zeromicro/go-zero/rest/httpx"
	"kw-graph/internal/common"
	errorCode "kw-graph/internal/errors"
	customsearch "kw-graph/internal/logic/graphsearch/custom"
	"kw-graph/internal/logic/repo"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
)

// CustomSearchHandler 自定义查询handler
func CustomSearchHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CustomSearchRequest
		if err := httpx.Parse(r, &req); err != nil {
			err = errorCode.New(http.StatusBadRequest, errorCode.ArgsError, err.Error())
			httpx.Error(w, err)
			return
		}

		l := customsearch.NewCustomSearchLogic(r.Context(), svcCtx)

		customResp := &types.CustomSearchV1Response{
			Res: make([]*types.GraphSearchResponse, 0),
		}

		for index := range req.Statements {
			req.Statements[index] = strings.Trim(req.Statements[index], "")
			subIndex := strings.Index(req.Statements[index], ";")
			if subIndex > 0 {
				if len(req.Statements[index][subIndex:]) > 1 {
					vRespInfo := &types.GraphSearchResponse{
						Statement: req.Statements[index],
					}
					customResp.Res = append(customResp.Res, vRespInfo)
					continue
				}
			}

			re := regexp.MustCompile(`^CREATE|^ALTER|^DROP|^INSERT|^UPDATE|^USE|^DELETE|^UPSERT|^REBUILD|^CLEAR|^MERGE`)

			if len(re.FindAllString(strings.ToUpper(req.Statements[index]), -1)) > 0 {
				vRespInfo := &types.GraphSearchResponse{
					Statement: req.Statements[index],
					Error: &types.Error{
						Description: errorCode.ErrorI18n[errorCode.ArgsError]["en_US"],
						ErrorCode:   errorCode.ArgsError,
						Solution:    errorCode.ErrorSolution[errorCode.ArgsError]["en_US"],
						ErrorDetails: []*types.ErrDetails{
							{
								Detail: fmt.Sprintf("Write operations are not supported: %s", req.Statements[index]),
							},
						},
					},
				}
				customResp.Res = append(customResp.Res, vRespInfo)
				continue
			}

			result, ontology, nodesDetail, err := l.CustomSearch(&req, req.Statements[index])
			if err != nil {
				errCode := ""
				detail := ""
				switch v := err.(type) {
				case *errorCode.ErrorInfo:
					errCode = v.Reason
					detail = v.Message
				default:
					errCode = errorCode.CustomSearchBatchExecErr
					detail = err.Error()
				}

				vRespInfo := &types.GraphSearchResponse{
					Statement: req.Statements[index],
					Error: &types.Error{
						Description: errorCode.ErrorI18n[errCode]["en_US"],
						ErrorCode:   errCode,
						Solution:    errorCode.ErrorSolution[errCode]["en_US"],
						ErrorDetails: []*types.ErrDetails{
							{
								Detail: detail,
							},
						},
					},
				}
				customResp.Res = append(customResp.Res, vRespInfo)
				continue
			}

			vRespInfo := &types.GraphSearchResponse{
				Nodes:       make([]*types.Nodes, 0),
				Edges:       make([]*types.Edges, 0),
				Paths:       make([]*types.PathSimpleInfo, 0),
				Texts:       make([]*types.Texts, 0),
				NodesDetail: make(map[string]*types.Nodes),
				Statement:   req.Statements[index],
			}

			vIdsInNodes := mapset.NewSet[string]()
			for _, v := range result {
				ParseCustomSearchInfoV1(v, vRespInfo, ontology, nodesDetail, vIdsInNodes)
			}
			customResp.Res = append(customResp.Res, vRespInfo)
		}

		httpx.OkJson(w, customResp)
	}
}

// ParseCustomSearchInfoV1 v1版本自定义查询解析函数
func ParseCustomSearchInfoV1(info *repo.CustomSearchInfo, result *types.GraphSearchResponse, ontology *repo.OntologyInfo, nodesInfo *repo.NodesInfoAllType, vIdsInNodes mapset.Set[string]) {
	if info.VerticesParsedList != nil {
		for _, node := range info.VerticesParsedList {
			if !vIdsInNodes.Contains(node.Vid) {
				vIdsInNodes.Add(node.Vid)
				// 以map形式封装属性
				vInfo := make(map[string]map[string]*repo.Prop)
				for tag, prop := range node.Properties {
					propMap := make(map[string]*repo.Prop)
					vInfo[tag] = propMap
					for name, p := range prop {
						propMap[name] = p
					}
				}

				if len(node.Tags) == 0 {
					nodeInfo := &types.Nodes{
						ID:         node.Vid,
						Tags:       []string{},
						Properties: []*types.UnitiveProperties{},
					}
					result.Nodes = append(result.Nodes, nodeInfo)
					continue
				}
				nodeInfo := &types.Nodes{
					ID:        node.Vid,
					Alias:     ontology.Entities[node.Tags[0]].Alias,
					Color:     ontology.Entities[node.Tags[0]].Color,
					Icon:      ontology.Entities[node.Tags[0]].Icon,
					ClassName: node.Tags[0],
					DefaultProperty: &types.UnitiveDefaultProperty{
						Name:  ontology.Entities[node.Tags[0]].DefaultProperty,
						Alias: ontology.Entities[node.Tags[0]].Properties[ontology.Entities[node.Tags[0]].DefaultProperty].Alias,
						Value: vInfo[node.Tags[0]][ontology.Entities[node.Tags[0]].DefaultProperty].Value,
					},
					Properties: make([]*types.UnitiveProperties, 0),
					Tags:       node.Tags,
				}

				for tag, property := range vInfo {
					propResp := &types.UnitiveProperties{
						Tag: tag,
					}
					for name, pVal := range property {
						if prop, ok := ontology.Entities[tag].Properties[name]; ok {
							if pVal.Value == "" {
								pVal.Value = common.NULLVAL
							}
							prop := &types.UnitiveProps{
								Key:      name,
								Value:    pVal.Value,
								Alias:    prop.Alias,
								Type:     pVal.Type,
								Disabled: false,
								Checked:  false,
							}
							propResp.Props = append(propResp.Props, prop)
						}
					}
					nodeInfo.Properties = append(nodeInfo.Properties, propResp)
				}
				result.Nodes = append(result.Nodes, nodeInfo)
			}
		}
	}
	if info.EdgesParsedList != nil {
		for _, edge := range info.EdgesParsedList {
			edgeInfo := &types.Edges{
				ID:         edge.EdgeClass + ":" + edge.SrcID + "-" + edge.DstID,
				Alias:      ontology.Egdes[edge.EdgeClass].Alias,
				Color:      ontology.Egdes[edge.EdgeClass].Color,
				ClassName:  edge.EdgeClass,
				Properties: make([]*types.UnitiveProps, 0),
				Source:     strings.Trim(edge.SrcID, "\""),
				Target:     strings.Trim(edge.DstID, "\""),
			}

			for name, pVal := range edge.Properties {
				if prop, ok := ontology.Egdes[edge.EdgeClass].Properties[name]; ok {
					if pVal.Value == "" {
						pVal.Value = common.NULLVAL
					}
					prop := &types.UnitiveProps{
						Key:      name,
						Value:    pVal.Value,
						Alias:    prop.Alias,
						Type:     pVal.Type,
						Disabled: false,
						Checked:  false,
					}
					edgeInfo.Properties = append(edgeInfo.Properties, prop)
				}
			}
			result.Edges = append(result.Edges, edgeInfo)

			// 封装边上起点、终点信息
			if source, ok := nodesInfo.Edge[edgeInfo.Source]; ok {
				nodeRes := ParseCustomNodeOfEdgeInfo(ontology, source)
				result.NodesDetail[edgeInfo.Source] = nodeRes
			}

			if target, ok := nodesInfo.Edge[edgeInfo.Target]; ok {
				nodeRes := ParseCustomNodeOfEdgeInfo(ontology, target)
				result.NodesDetail[edgeInfo.Target] = nodeRes
			}
		}
	}
	if info.PathsParsedList != nil {
		for _, path := range info.PathsParsedList {
			p := &repo.CustomSearchInfo{}
			if len(nodesInfo.Path) != 0 {
				for _, edge := range path.Relationships {
					if source, ok := nodesInfo.Path[edge.SrcID]; ok {
						p.VerticesParsedList = append(p.VerticesParsedList, source)
					}

					if target, ok := nodesInfo.Path[edge.DstID]; ok {
						p.VerticesParsedList = append(p.VerticesParsedList, target)
					}
				}
			} else {
				p.VerticesParsedList = path.Nodes
			}

			p.EdgesParsedList = path.Relationships
			pathRes := &types.GraphSearchResponse{
				Nodes: make([]*types.Nodes, 0),
				Edges: make([]*types.Edges, 0),
			}
			ParseCustomSearchInfoV1(p, pathRes, ontology, nodesInfo, vIdsInNodes)

			result.Nodes = append(result.Nodes, pathRes.Nodes...)
			result.Edges = append(result.Edges, pathRes.Edges...)

			// 单独对path 做处理
			nodesSet := mapset.NewSet[string]()
			nodes := make([]string, 0)
			edges := make([]string, 0)
			for _, node := range p.VerticesParsedList {
				nodesSet.Add(node.Vid)
			}

			for item := range nodesSet.Iter() {
				nodes = append(nodes, item)
			}

			for _, edge := range pathRes.Edges {
				edges = append(edges, edge.ID)
			}
			result.Paths = append(result.Paths, &types.PathSimpleInfo{
				Nodes: nodes,
				Edges: edges,
			})
		}
	}

	if info.TextsParsedList != nil {
		columnsInfo := make([]*types.TextRowInfo, 0)
		for _, text := range info.TextsParsedList {
			rowInfo := &types.TextRowInfo{
				Column: text.Column,
				Value:  text.Value,
				Type:   text.Type,
			}
			// 多列数据
			columnsInfo = append(columnsInfo, rowInfo)
		}
		textInfo := &types.Texts{
			Columns: columnsInfo,
		}
		result.Texts = append(result.Texts, textInfo)
	}
}

// ParseCustomNodeOfEdgeInfo 封装点信息
func ParseCustomNodeOfEdgeInfo(ontology *repo.OntologyInfo, nodesInfo *repo.VerticesParsedList) *types.Nodes {
	// 以map形式封装属性
	vInfo := make(map[string]map[string]*repo.Prop)
	for tag, prop := range nodesInfo.Properties {
		propMap := make(map[string]*repo.Prop)
		vInfo[tag] = propMap
		for name, p := range prop {
			propMap[name] = p
		}
	}

	if len(nodesInfo.Tags) == 0 {
		nodeInfo := &types.Nodes{
			ID:         nodesInfo.Vid,
			Tags:       []string{},
			Properties: []*types.UnitiveProperties{},
		}
		return nodeInfo
	}

	node := &types.Nodes{
		ID:        nodesInfo.Vid,
		Tags:      nodesInfo.Tags,
		Alias:     ontology.Entities[nodesInfo.Tags[0]].Alias,
		Color:     ontology.Entities[nodesInfo.Tags[0]].Color,
		Icon:      ontology.Entities[nodesInfo.Tags[0]].Icon,
		ClassName: nodesInfo.Tags[0],
		DefaultProperty: &types.UnitiveDefaultProperty{
			Name:  ontology.Entities[nodesInfo.Tags[0]].DefaultProperty,
			Alias: ontology.Entities[nodesInfo.Tags[0]].Properties[ontology.Entities[nodesInfo.Tags[0]].DefaultProperty].Alias,
			Value: vInfo[nodesInfo.Tags[0]][ontology.Entities[nodesInfo.Tags[0]].DefaultProperty].Value,
		},
		Properties: make([]*types.UnitiveProperties, 0),
	}

	for tag, property := range vInfo {
		propResp := &types.UnitiveProperties{
			Tag: tag,
		}
		for name, pVal := range property {
			if prop, ok := ontology.Entities[tag].Properties[name]; ok {
				if pVal.Value == "" {
					pVal.Value = common.NULLVAL
				}
				prop := &types.UnitiveProps{
					Key:      name,
					Value:    pVal.Value,
					Alias:    prop.Alias,
					Type:     pVal.Type,
					Disabled: false,
					Checked:  false,
				}
				propResp.Props = append(propResp.Props, prop)
			}
		}
		node.Properties = append(node.Properties, propResp)
	}
	return node

}

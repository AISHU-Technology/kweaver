package basic

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	errorCode "kw-graph/internal/errors"
	basicSearch "kw-graph/internal/logic/graphsearch/basic"
	"kw-graph/internal/logic/repo"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
)

// FullTextSearchHandler 全文检索handler
func FullTextSearchHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.FullTextRequest
		if err := httpx.Parse(r, &req); err != nil {
			err = errorCode.New(http.StatusBadRequest, errorCode.ArgsError, err.Error())
			httpx.Error(w, err)
			return
		}

		l := basicSearch.NewFullTextSearchLogic(r.Context(), svcCtx)
		results, ontology, err := l.FullTextSearch(&req)
		if err != nil {
			httpx.Error(w, err)
			return
		}
		ftResp := FTSearchInformationEncapsulation(results, ontology)
		httpx.OkJson(w, ftResp)
	}
}

// FTSearchInformationEncapsulation 点搜索通用结构解析封装
func FTSearchInformationEncapsulation(results *repo.FTSearchResult, ontology *repo.OntologyInfo) *types.UnitiveResponse {
	ftResp := &types.UnitiveResponse{}
	ftResp.Res = &types.GraphSearchResponse{
		Nodes: make([]*types.Nodes, 0),
		Edges: make([]*types.Edges, 0),
	}

	for _, tagInfos := range results.NebulaVInfos {
		for _, node := range tagInfos.Vertex {
			// 以map形式封装属性
			vInfo := make(map[string]map[string]*repo.Prop)
			for tag, prop := range node.Properties {
				propMap := make(map[string]*repo.Prop)
				vInfo[tag] = propMap
				for name, p := range prop {
					propMap[name] = p
				}
			}

			nodeInfo := &types.Nodes{
				ID:        node.ID,
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
							pVal.Value = "__NULL__"
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

				ftResp.Res.Nodes = append(ftResp.Res.Nodes, nodeInfo)
			}
		}
	}
	return ftResp
}

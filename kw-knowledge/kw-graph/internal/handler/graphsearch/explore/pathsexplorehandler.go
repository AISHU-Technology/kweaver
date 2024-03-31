// Package graphexplore 图探索handler实现层
package graphexplore

import (
	"context"
	"fmt"
	"net/http"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest/httpx"
	errorCode "kw-graph/internal/errors"
	graphExplore "kw-graph/internal/logic/graphsearch/explore"
	"kw-graph/internal/logic/repo"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
)

// PathsExploreHandler 路径探索handler实现
func PathsExploreHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.PathRequest
		if err := httpx.Parse(r, &req); err != nil {
			err = errorCode.New(http.StatusBadRequest, errorCode.ArgsError, err.Error())
			httpx.Error(w, err)
			return
		}
		resp, err := GetPathResp(r.Context(), svcCtx, &req)

		if err != nil {

			httpx.Error(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

// GetPathResp 路径探索子函数
func GetPathResp(ctx context.Context, svcCtx *svc.ServiceContext, req *types.PathRequest) (
	response *types.UnitiveResponse, err error) {
	l := graphExplore.NewPathsExploreLogic(ctx, svcCtx)
	pathListRes, pathDetailRes, ontology, err := l.PathsExplore(req)
	if err != nil {
		return nil, err
	}
	resp := &types.UnitiveResponse{
		Res: &types.GraphSearchResponse{
			Nodes: make([]*types.Nodes, 0),
			Edges: make([]*types.Edges, 0),
			Paths: make([]*types.PathSimpleInfo, 0),
		},
	}

	pathDetail := &types.GraphSearchResponse{
		Nodes: make([]*types.Nodes, 0),
		Edges: make([]*types.Edges, 0),
		Paths: make([]*types.PathSimpleInfo, 0),
	}
	if len(pathListRes) != 0 {
		for _, path := range pathListRes {
			pathInfo := &types.PathSimpleInfo{
				Nodes: make([]string, 0),
				Edges: make([]string, 0),
			}

			pathInfo.Nodes = append(pathInfo.Nodes, path.Vertices...)

			pathInfo.Edges = append(pathInfo.Edges, path.Edges...)

			pathDetail.Paths = append(pathDetail.Paths, pathInfo)
		}
	} else {
		return resp, nil
	}

	if pathDetailRes != nil {
		for _, v := range pathDetailRes.Vertices {
			vInfo := &types.Nodes{
				ID:   v.ID,
				Tags: v.Tags,
			}
			if _, ok := ontology.Entities[v.Tags[0]]; !ok {
				logx.Error(fmt.Sprintf("Explore path vertices result parsing error: tag %s  not found in ontology", v.Tags[0]))
				continue
			}
			// 以map形式封装属性
			vInfoMap := map[string]map[string]*repo.Prop{}
			for tag, prop := range v.Properties {
				propMap := make(map[string]*repo.Prop)
				vInfoMap[tag] = propMap
				for name, p := range prop {
					propMap[name] = p
				}
			}

			vInfo.ClassName = v.Tags[0]
			vInfo.Color = ontology.Entities[v.Tags[0]].Color
			vInfo.Alias = ontology.Entities[v.Tags[0]].Alias
			vInfo.Icon = ontology.Entities[v.Tags[0]].Icon
			vInfo.DefaultProperty = &types.UnitiveDefaultProperty{
				Name:  ontology.Entities[v.Tags[0]].DefaultProperty,
				Alias: ontology.Entities[v.Tags[0]].Properties[ontology.Entities[v.Tags[0]].DefaultProperty].Alias,
				Value: vInfoMap[v.Tags[0]][ontology.Entities[v.Tags[0]].DefaultProperty].Value,
			}
			// 解析属性
			for tag, props := range vInfoMap {
				p := &types.UnitiveProperties{
					Tag:   tag,
					Props: make([]*types.UnitiveProps, 0),
				}
				for propName, propVal := range props {
					if ontoProp, ok := ontology.Entities[tag].Properties[propName]; ok {
						prop := &types.UnitiveProps{
							Key:      propName,
							Alias:    ontoProp.Alias,
							Value:    propVal.Value,
							Type:     propVal.Type,
							Disabled: false,
							Checked:  false,
						}
						p.Props = append(p.Props, prop)
					}
				}
				vInfo.Properties = append(vInfo.Properties, p)
			}
			pathDetail.Nodes = append(pathDetail.Nodes, vInfo)
		}

		for _, e := range pathDetailRes.Edges {
			eInfo := &types.Edges{
				ID:         e.ID,
				ClassName:  e.Type,
				Source:     e.SrcID,
				Target:     e.DstID,
				Properties: make([]*types.UnitiveProps, 0),
			}
			if _, ok := ontology.Egdes[e.Type]; !ok {
				logx.Error(fmt.Sprintf("Explore path edges result parsing error: tag %s  not found in ontology", e.Type))
				continue
			}
			eInfo.Color = ontology.Egdes[e.Type].Color
			eInfo.Alias = ontology.Egdes[e.Type].Alias

			// 解析属性
			for name, propVal := range e.Properties {
				if ontoProp, ok := ontology.Egdes[e.Type].Properties[name]; ok {
					prop := &types.UnitiveProps{
						Key:      name,
						Alias:    ontoProp.Alias,
						Value:    propVal.Value,
						Type:     propVal.Type,
						Disabled: false,
						Checked:  false,
					}
					eInfo.Properties = append(eInfo.Properties, prop)
				}
			}
			pathDetail.Edges = append(pathDetail.Edges, eInfo)
		}
		resp.Res = pathDetail
	}
	return resp, nil
}

// PathsExploreHandler 路径探索handler实现
// func PathsExploreHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		var req types.PathRequest
// 		if err := httpx.Parse(r, &req); err != nil {
// 			err = errorCode.New(http.StatusBadRequest, errorCode.ArgsError, err.Error())
// 			httpx.Error(w, err)
// 			return
// 		}

// 		l := graphExplore.NewPathsExploreLogic(r.Context(), svcCtx)
// 		res, ontology, err := l.PathsExplore(&req)
// 		if err != nil {
// 			httpx.Error(w, err)
// 		} else {
// 			resp := &types.UnitiveResponse{
// 				Res: &types.GraphSearchResponse{
// 					Nodes: make([]*types.Nodes, 0),
// 					Edges: make([]*types.Edges, 0),
// 					Paths: make([]*types.PathSimpleInfo, 0),
// 				},
// 			}

// 			pathDetail := &types.GraphSearchResponse{
// 				Nodes: make([]*types.Nodes, 0),
// 				Edges: make([]*types.Edges, 0),
// 				Paths: make([]*types.PathSimpleInfo, 0),
// 			}
// 			if res.Res.Paths != nil {
// 				for _, path := range res.Res.Paths {
// 					pathInfo := &types.PathSimpleInfo{
// 						Nodes: make([]string, 0),
// 						Edges: make([]string, 0),
// 					}

// 					pathInfo.Nodes = append(pathInfo.Nodes, path.Vertices...)

// 					pathInfo.Edges = append(pathInfo.Edges, path.Edges...)

// 					pathDetail.Paths = append(pathDetail.Paths, pathInfo)
// 				}
// 			}

// 			if res.Res.PathDetail != nil {
// 				for _, v := range res.Res.PathDetail.Vertices {
// 					vInfo := &types.Nodes{
// 						ID:   v.ID,
// 						Tags: v.Tags,
// 					}
// 					if _, ok := ontology.Entities[v.Tags[0]]; !ok {
// 						logx.Error(fmt.Sprintf("Explore path vertices result parsing error: tag %s  not found in ontology", v.Tags[0]))
// 						continue
// 					}
// 					// 以map形式封装属性
// 					vInfoMap := map[string]map[string]*repo.PropsCore{}
// 					for _, prop := range v.Properties {
// 						propMap := make(map[string]*repo.PropsCore)
// 						vInfoMap[prop.Tag] = propMap
// 						for _, p := range prop.Props {
// 							propMap[p.Name] = p
// 						}
// 					}

// 					vInfo.ClassName = v.Tags[0]
// 					vInfo.Color = ontology.Entities[v.Tags[0]].Color
// 					vInfo.Alias = ontology.Entities[v.Tags[0]].Alias
// 					vInfo.Icon = ontology.Entities[v.Tags[0]].Icon
// 					vInfo.DefaultProperty = &types.UnitiveDefaultProperty{
// 						Name:  ontology.Entities[v.Tags[0]].DefaultProperty,
// 						Alias: ontology.Entities[v.Tags[0]].Properties[ontology.Entities[v.Tags[0]].DefaultProperty].Alias,
// 						Value: vInfoMap[v.Tags[0]][ontology.Entities[v.Tags[0]].DefaultProperty].Value,
// 					}
// 					// 解析属性
// 					for tag, props := range vInfoMap {
// 						p := &types.UnitiveProperties{
// 							Tag:   tag,
// 							Props: make([]*types.UnitiveProps, 0),
// 						}
// 						for propName, propVal := range props {
// 							if ontoProp, ok := ontology.Entities[tag].Properties[propName]; ok {
// 								prop := &types.UnitiveProps{
// 									Key:      propName,
// 									Alias:    ontoProp.Alias,
// 									Value:    propVal.Value,
// 									Type:     propVal.PropType,
// 									Disabled: false,
// 									Checked:  false,
// 								}
// 								p.Props = append(p.Props, prop)
// 							}
// 						}
// 						vInfo.Properties = append(vInfo.Properties, p)
// 					}
// 					pathDetail.Nodes = append(pathDetail.Nodes, vInfo)
// 				}

// 				for _, e := range res.Res.PathDetail.Edges {
// 					eInfo := &types.Edges{
// 						ID:         e.ID,
// 						ClassName:  e.EdgeClass,
// 						Source:     e.SrcID,
// 						Target:     e.DstID,
// 						Properties: make([]*types.UnitiveProps, 0),
// 					}
// 					if _, ok := ontology.Egdes[e.EdgeClass]; !ok {
// 						logx.Error(fmt.Sprintf("Explore path edges result parsing error: tag %s  not found in ontology", e.EdgeClass))
// 						continue
// 					}
// 					eInfo.Color = ontology.Egdes[e.EdgeClass].Color
// 					eInfo.Alias = ontology.Egdes[e.EdgeClass].Alias

// 					// 解析属性
// 					for _, propVal := range e.Properties {
// 						if ontoProp, ok := ontology.Egdes[e.EdgeClass].Properties[propVal.Name]; ok {
// 							prop := &types.UnitiveProps{
// 								Key:      propVal.Name,
// 								Alias:    ontoProp.Alias,
// 								Value:    propVal.Value,
// 								Type:     propVal.PropType,
// 								Disabled: false,
// 								Checked:  false,
// 							}
// 							eInfo.Properties = append(eInfo.Properties, prop)
// 						}
// 					}
// 					pathDetail.Edges = append(pathDetail.Edges, eInfo)
// 				}
// 				resp.Res = pathDetail
// 			}

// 			httpx.OkJsonCtx(r.Context(), w, resp)
// 		}
// 	}
// }

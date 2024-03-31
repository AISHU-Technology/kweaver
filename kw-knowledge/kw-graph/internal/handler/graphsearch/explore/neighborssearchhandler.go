package graphexplore

import (
	"context"
	"net/http"
	"sort"

	errorCode "kw-graph/internal/errors"

	"github.com/zeromicro/go-zero/rest/httpx"
	graphExplore "kw-graph/internal/logic/graphsearch/explore"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
)

// NeighborsSearchHandler 邻居查询
func NeighborsSearchHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.NeighborsRequest
		if err := httpx.Parse(r, &req); err != nil {

			err = errorCode.New(http.StatusBadRequest, errorCode.ArgsError, err.Error())
			httpx.Error(w, err)
			return
		}

		resp, err := GetNeighborsResp(r.Context(), svcCtx, &req)
		if err != nil {

			httpx.Error(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, types.UnitiveResponse{Res: resp})
		}
	}
}

func GetNeighborsResp(ctx context.Context, svcCtx *svc.ServiceContext, req *types.NeighborsRequest) (
	response *types.GraphSearchResponse, err error) {
	l := graphExplore.NewNeighborsSearchLogic(ctx, svcCtx)
	resV, resE, onto, err := l.NeighborsSearch(req)
	if err != nil {
		return nil, err
	}

	resp := types.GraphSearchResponse{
		Edges: make([]*types.Edges, 0),
		Nodes: make([]*types.Nodes, 0),
	}

	for eid, edgeRes := range resE {
		if _, ok := onto.Egdes[edgeRes.Type]; !ok {
			continue
		}

		edge := &types.Edges{
			ID:         eid,
			Alias:      onto.Egdes[edgeRes.Type].Alias,
			Color:      onto.Egdes[edgeRes.Type].Color,
			ClassName:  edgeRes.Type,
			Source:     edgeRes.SrcID,
			Target:     edgeRes.DstID,
			Properties: make([]*types.UnitiveProps, 0),
			Number:     edgeRes.Number,
		}
		for propName, propRes := range edgeRes.Properties {
			if propName[0] == '_' {
				continue
			}
			if _, ok := onto.Egdes[edgeRes.Type].Properties[propName]; !ok {
				continue
			}
			prop := &types.UnitiveProps{
				Key:   propName,
				Value: propRes.Value,
				Alias: onto.Egdes[edgeRes.Type].Properties[propName].Alias,
				Type:  propRes.Type,
			}
			edge.Properties = append(edge.Properties, prop)
		}
		resp.Edges = append(resp.Edges, edge)
	}

	for _, vertexRes := range resV {
		if _, ok := onto.Entities[vertexRes.Tags[0]]; !ok {
			continue
		}
		// 解析点信息
		vertex := &types.Nodes{
			ID:              vertexRes.ID,
			Alias:           onto.Entities[vertexRes.Tags[0]].Alias,
			Color:           onto.Entities[vertexRes.Tags[0]].Color,
			ClassName:       vertexRes.Tags[0],
			Icon:            onto.Entities[vertexRes.Tags[0]].Icon,
			DefaultProperty: nil,
			Tags:            vertexRes.Tags,
			Properties:      make([]*types.UnitiveProperties, 0),
			Number:          vertexRes.Number,
		}
		//var propMap = map[string]map[string]*repo.PropsCore{}
		//for _, propertyRes := range vertexRes.Properties {
		//	propMap[propertyRes.Tag] = map[string]*repo.PropsCore{}
		//	for _, propRes := range propertyRes.Props {
		//		propMap[propertyRes.Tag][propName] = propRes
		//	}
		//}

		defaultProperty := &types.UnitiveDefaultProperty{
			Name:  onto.Entities[vertex.Tags[0]].DefaultProperty,
			Value: vertexRes.Properties[vertex.Tags[0]][onto.Entities[vertex.Tags[0]].DefaultProperty].Value,
			Alias: onto.Entities[vertex.Tags[0]].Properties[onto.Entities[vertex.Tags[0]].DefaultProperty].Alias,
		}
		vertex.DefaultProperty = defaultProperty
		for tag, propertyRes := range vertexRes.Properties {
			properties := &types.UnitiveProperties{
				Tag:   tag,
				Props: make([]*types.UnitiveProps, 0),
			}
			for propName, propRes := range propertyRes {
				if propName[0] == '_' {
					continue
				}
				if _, ok := onto.Entities[vertexRes.Tags[0]].Properties[propName]; !ok {
					continue
				}
				prop := types.UnitiveProps{
					Key:   propName,
					Value: propRes.Value,
					Alias: onto.Entities[tag].Properties[propName].Alias,
					Type:  propRes.Type,
				}
				properties.Props = append(properties.Props, &prop)
			}
			vertex.Properties = append(vertex.Properties, properties)
		}
		resp.Nodes = append(resp.Nodes, vertex)
	}

	resp.NodesCount = int64(len(resp.Nodes))
	resp.EdgesCount = int64(len(resp.Edges))
	sort.Slice(resp.Nodes, func(i, j int) bool {
		return resp.Nodes[j].Number > resp.Nodes[i].Number
	})
	sort.Slice(resp.Edges, func(i, j int) bool {
		return resp.Edges[j].Number > resp.Edges[i].Number
	})
	return &resp, nil
}

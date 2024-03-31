// Package basic 图基础查询handler实现
package basic

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	errorCode "kw-graph/internal/errors"
	basicSearch "kw-graph/internal/logic/graphsearch/basic"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
)

// EdgesSearchHandler 边搜索handler
func EdgesSearchHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		var req types.EdgesRequest
		if err := httpx.Parse(r, &req); err != nil {
			err = errorCode.New(http.StatusBadRequest, errorCode.ArgsError, err.Error())
			httpx.Error(w, err)
			return
		}

		l := basicSearch.NewEdgesSearchLogic(r.Context(), svcCtx)
		res, onto, err := l.EdgesSearch(&req)
		if err != nil {
			httpx.Error(w, err)
			return
		}

		resp := &types.GraphSearchResponse{
			EdgesCount: res.ECount,
			Edges:      make([]*types.Edges, 0),
			Nodes:      make([]*types.Nodes, 0),
		}
		for _, edgeGroupRes := range res.EResult {
			if _, ok := onto.Egdes[edgeGroupRes.EdgeClass]; !ok {
				continue
			}
			//edgeGroup := &types.EdgeGroup{
			//	EdgeClass: edgeGroupRes.EdgeClass,
			//	Edges:     make([]*types.Edge, 0),
			//	Alias:     onto.Egdes[edgeGroupRes.EdgeClass].Alias,
			//	Color:     onto.Egdes[edgeGroupRes.EdgeClass].Color,
			//}
			for _, edgeRes := range edgeGroupRes.Edges {
				edge := &types.Edges{
					ID:         edgeRes.ID,
					Alias:      onto.Egdes[edgeGroupRes.EdgeClass].Alias,
					Color:      onto.Egdes[edgeGroupRes.EdgeClass].Color,
					ClassName:  edgeRes.EdgeClass,
					Source:     edgeRes.SrcID,
					Target:     edgeRes.DstID,
					Properties: make([]*types.UnitiveProps, 0),
				}
				for _, propRes := range edgeRes.Properties {
					if propRes.Name[0] == '_' {
						continue
					}
					if _, ok := onto.Egdes[edgeRes.EdgeClass].Properties[propRes.Name]; !ok {
						continue
					}

					prop := &types.UnitiveProps{
						Key:   propRes.Name,
						Value: propRes.Value,
						Alias: onto.Egdes[edgeRes.EdgeClass].Properties[propRes.Name].Alias,
						Type:  propRes.PropType,
					}
					edge.Properties = append(edge.Properties, prop)
				}
				resp.Edges = append(resp.Edges, edge)
			}

			//resp.Edges = append(resp.Edges, edgeGroup)
		}
		if err != nil {
			httpx.Error(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, types.UnitiveResponse{Res: resp})
		}
	}
}

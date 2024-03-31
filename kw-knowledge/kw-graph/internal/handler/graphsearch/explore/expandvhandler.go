package graphexplore

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	errorCode "kw-graph/internal/errors"
	graphExplore "kw-graph/internal/logic/graphsearch/explore"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
)

// ExpandVHandler 拓展点的进出边关系
func ExpandVHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ExpandVRequest
		if err := httpx.Parse(r, &req); err != nil {

			err = errorCode.New(http.StatusBadRequest, errorCode.ArgsError, err.Error())
			httpx.Error(w, err)
			return
		}

		l := graphExplore.NewExpandVLogic(r.Context(), svcCtx)
		res, onto, err := l.ExpandV(&req)
		if err != nil {

			httpx.Error(w, err)
			return
		}

		if len(res.Res) != 1 {
			httpx.OkJsonCtx(r.Context(), w, nil)
		}
		expandVGroup := &types.ExpandVGroup{
			ID:   res.Res[0].ID,
			OutE: make([]*types.ExpandVEdge, 0),
			InE:  make([]*types.ExpandVEdge, 0),
		}
		for _, edgeRes := range res.Res[0].InE {
			if _, ok := onto.Egdes[edgeRes.EdgeClass]; !ok {
				continue
			}
			edge := &types.ExpandVEdge{
				EdgeClass: edgeRes.EdgeClass,
				Count:     edgeRes.Count,
				Color:     onto.Egdes[edgeRes.EdgeClass].Color,
				Alias:     onto.Egdes[edgeRes.EdgeClass].Alias,
			}
			expandVGroup.InE = append(expandVGroup.InE, edge)
		}

		for _, edgeRes := range res.Res[0].OutE {
			if _, ok := onto.Egdes[edgeRes.EdgeClass]; !ok {
				continue
			}
			edge := &types.ExpandVEdge{
				EdgeClass: edgeRes.EdgeClass,
				Count:     edgeRes.Count,
				Color:     onto.Egdes[edgeRes.EdgeClass].Color,
				Alias:     onto.Egdes[edgeRes.EdgeClass].Alias,
			}
			expandVGroup.OutE = append(expandVGroup.OutE, edge)
		}

		resp := types.ExpandVResponse{Res: expandVGroup}
		if err != nil {

			httpx.Error(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

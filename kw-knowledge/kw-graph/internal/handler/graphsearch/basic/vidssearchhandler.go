package basic

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	errorCode "kw-graph/internal/errors"
	basicSearch "kw-graph/internal/logic/graphsearch/basic"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
)

// VidsSearchHandler vids 搜索handler
func VidsSearchHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.VidsRequest
		if err := httpx.Parse(r, &req); err != nil {
			err = errorCode.New(http.StatusBadRequest, errorCode.ArgsError, err.Error())
			httpx.Error(w, err)
			return
		}

		l := basicSearch.NewVidsSearchLogic(r.Context(), svcCtx)
		results, ontology, err := l.VidsSearch(&req)
		if err != nil {
			httpx.Error(w, err)
			return
		}

		vidsResp := FTSearchInformationEncapsulation(results, ontology)
		httpx.OkJson(w, vidsResp)
	}
}

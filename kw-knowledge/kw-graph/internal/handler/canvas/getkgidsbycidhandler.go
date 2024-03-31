package canvas

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/logic/canvas"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
)

func GetKgIDsByCIDHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GetKgidsByCIDRequest
		if err := httpx.Parse(r, &req); err != nil {

			err = errorCode.New(http.StatusBadRequest, errorCode.ArgsError, err.Error())
			httpx.Error(w, err)
			return
		}

		l := canvas.NewGetKgIDsByCIDLogic(r.Context(), svcCtx)
		resp, err := l.GetKgIDsByCID(&req)
		if err != nil {
			httpx.Error(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

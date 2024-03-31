package eventLog

import (
	httpx "github.com/zeromicro/go-zero/rest/httpx"
	"kw-system/internal/model/types"
	"net/http"
)

func Ready() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})

	}
}

func Alive() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
	}
}

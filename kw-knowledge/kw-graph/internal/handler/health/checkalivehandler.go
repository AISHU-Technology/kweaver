package health

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	"kw-graph/internal/svc"
)

// CheckAliveHandler 存活探针
func CheckAliveHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.Ok(w)
	}
}

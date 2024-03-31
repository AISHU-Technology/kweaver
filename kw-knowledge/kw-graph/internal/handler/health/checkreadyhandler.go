// Package health 健康检查handler
package health

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	"kw-graph/internal/svc"
)

// CheckReadyHandler 就绪探针
func CheckReadyHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.Ok(w)
	}
}

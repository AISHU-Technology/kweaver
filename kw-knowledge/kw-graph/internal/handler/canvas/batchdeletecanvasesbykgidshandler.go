package canvas

import (
	"context"
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"
	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/logic/canvas"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
)

// BatchDeleteCanvasesByKgIdsHandler 根据图谱id删除画布
func BatchDeleteCanvasesByKgIdsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.BatchDeleteCanvasesByKgIdsRequest
		if err := httpx.Parse(r, &req); err != nil {
			err = errorCode.New(http.StatusBadRequest, errorCode.ArgsError, err.Error())
			httpx.Error(w, err)
			return
		}

		l := canvas.NewBatchDeleteCanvasesByKgIdsLogic(context.Background(), svcCtx)
		resp, err := l.BatchDeleteCanvasesByKgIds(&req)
		res := types.ReturnResIntListResponse{Res: resp}

		if err != nil {
			httpx.Error(w, err)
		} else {

			httpx.OkJsonCtx(r.Context(), w, res)
		}
	}
}

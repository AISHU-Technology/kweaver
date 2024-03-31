package canvas

import (
	"context"

	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

// BatchDeleteCanvasesLogic 批量删除画布 逻辑层对象
type BatchDeleteCanvasesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewBatchDeleteCanvasesLogic 批量删除画布 逻辑层对象实例化
func NewBatchDeleteCanvasesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *BatchDeleteCanvasesLogic {
	return &BatchDeleteCanvasesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// BatchDeleteCanvases 批量删除画布
func (l *BatchDeleteCanvasesLogic) BatchDeleteCanvases(req *types.BatchDeleteCanvasesRequest) (resp []int64, err error) {
	ids, err := l.svcCtx.CanvasManager.DeleteCanvas(l.ctx, req.CIDs)
	if err != nil {

		return nil, err
	}
	return ids, nil
}

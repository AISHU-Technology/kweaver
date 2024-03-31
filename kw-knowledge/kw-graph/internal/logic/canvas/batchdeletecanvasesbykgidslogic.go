package canvas

import (
	"context"

	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

// BatchDeleteCanvasesByKgIdsLogic 根据图谱id删除画布 逻辑层对象
type BatchDeleteCanvasesByKgIdsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewBatchDeleteCanvasesByKgIdsLogic 根据图谱id删除画布 逻辑层对象实例化
func NewBatchDeleteCanvasesByKgIdsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *BatchDeleteCanvasesByKgIdsLogic {
	return &BatchDeleteCanvasesByKgIdsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// BatchDeleteCanvasesByKgIds 根据图谱id删除画布 仅内部调用
func (l *BatchDeleteCanvasesByKgIdsLogic) BatchDeleteCanvasesByKgIds(req *types.BatchDeleteCanvasesByKgIdsRequest) (resp []int64, err error) {
	ids, err := l.svcCtx.CanvasManager.DeleteCanvasByKgIDs(l.ctx, req.KgIds)
	if err != nil {

		return nil, err
	}

	return ids, nil
}

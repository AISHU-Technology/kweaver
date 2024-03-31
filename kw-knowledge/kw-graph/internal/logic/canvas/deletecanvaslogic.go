package canvas

import (
	"context"
	"net/http"

	errorCode "kw-graph/internal/errors"

	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

// DeleteCanvasLogic 删除画布 逻辑层对象
type DeleteCanvasLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewDeleteCanvasLogic 删除画布 逻辑层对象实例化
func NewDeleteCanvasLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteCanvasLogic {
	return &DeleteCanvasLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// DeleteCanvas 删除画布 逻辑实现
func (l *DeleteCanvasLogic) DeleteCanvas(req *types.CanvasIDRequestOnPath) (id int64, err error) {
	// 数据库层删除画布
	var cIDs []int64
	cIDs = append(cIDs, req.CID)
	ids, err := l.svcCtx.CanvasManager.DeleteCanvas(l.ctx, cIDs)
	if err != nil {

		return -1, err
	}
	if len(ids) == 0 {
		return 0, errorCode.New(http.StatusBadRequest, errorCode.ResourceNotFound, "画布不存在")
	}

	// 封装操作者信息
	// agent := logger.Agent{
	// 	Type: req.UserAgent,
	// 	Ip:   req.XForwardedFor,
	// }
	// operator := logger.Operator{
	// 	Type:  "authenticated_user",
	// 	ID:    req.UserID,
	// 	Name:  req.UserName,
	// 	Agent: agent,
	// }

	// logModel := logger.NewBusinessLog().WithOperator(operator).WithOperation(logger.Delete).WithObject(&logger.Object{Type: logger.Canvas}).WithTargetObject(map[string]interface{}{"canvas_id": id})
	// // 日志输出
	// l.svcCtx.Log.InfoField(field.MallocJsonField(logModel), logger.BusinessLog)
	return ids[0], nil
}

package canvas

import (
	"context"
	"strconv"

	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

// GetCanvasesListLogic 获取画布列表 逻辑层对象
type GetCanvasesListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewGetCanvasesListLogic 获取画布列表 逻辑层对象实例化
func NewGetCanvasesListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetCanvasesListLogic {
	return &GetCanvasesListLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetCanvasesList 获取画布列表 逻辑实现
func (l *GetCanvasesListLogic) GetCanvasesList(req *types.GetCanvasesListRequest) (resp *types.GetCanvasesListResponse, err error) {
	if req.OrderType != "asc" {
		req.OrderType = "desc"
	}
	res, count, err := l.svcCtx.CanvasManager.GetCanvasList(l.ctx, req)
	if err != nil {

		return nil, err
	}
	space, err := l.svcCtx.Builder.GetKGNameByKgID(l.ctx, strconv.Itoa(int(req.KgID)))
	if err != nil {

		return nil, err
	}
	var userIDs []string
	canvases := make([]types.Canvas, 0)
	for _, row := range res {
		userIDs = append(userIDs, row.CreateUser, row.UpdateUser)
	}

	for _, row := range res {
		canvas := types.Canvas{
			CID:        row.ID,
			KnwID:      row.KnwID,
			CanvasName: row.CanvasName,
			CanvasInfo: row.CanvasInfo,
			Kg: types.KnowledgeGraph{
				KgID: row.KgID,
				Name: space,
			},
			CreateUser: types.User{
				UserID: row.CreateUser,
			},
			CreateTime: row.CreateTime,
			UpdateUser: types.User{
				UserID: row.UpdateUser,
			},
			UpdateTime: row.UpdateTime,
			CanvasBody: "--",
		}

		canvases = append(canvases, canvas)
	}

	resp = &types.GetCanvasesListResponse{
		Res: types.CanvasesInfo{
			Count:    int64(count),
			Canvases: canvases,
		},
	}

	return resp, nil
}

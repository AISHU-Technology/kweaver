package canvas

import (
	"context"
	"net/http"
	"strconv"

	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

// GetCanvasInfoByCIDLogic 获取画布 逻辑层对象
type GetCanvasInfoByCIDLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewGetCanvasInfoByCIDLogic 获取画布 逻辑层对象实例化
func NewGetCanvasInfoByCIDLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetCanvasInfoByCIDLogic {
	return &GetCanvasInfoByCIDLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetCanvasInfoByCID 获取画布 逻辑层实现
func (l *GetCanvasInfoByCIDLogic) GetCanvasInfoByCID(req *types.CanvasIDRequestOnPath) (resp *types.GetCanvasInfoResponse, err error) {
	res, err := l.svcCtx.CanvasManager.GetCanvasByCID(l.ctx, req.CID)
	if err != nil {

		return nil, err
	}

	if res == nil {
		return nil, errorCode.New(http.StatusBadRequest, errorCode.ResourceNotFound, "画布不存在")
	}

	kgName, err := l.svcCtx.Builder.GetKGNameByKgID(l.ctx, strconv.Itoa(int(res.KgID)))
	if err != nil {

		return nil, err
	}

	if err != nil {
		return nil, err
	}
	createUser := types.User{
		UserID: res.CreateUser,
	}
	updateUser := types.User{
		UserID: res.UpdateUser,
	}

	canvas := types.Canvas{
		CID:        res.ID,
		KnwID:      res.KnwID,
		CanvasName: res.CanvasName,
		CanvasInfo: res.CanvasInfo,
		Kg: types.KnowledgeGraph{
			KgID: res.KgID,
			Name: kgName,
		},
		CreateUser: createUser,
		CreateTime: res.CreateTime,
		UpdateUser: updateUser,
		UpdateTime: res.UpdateTime,
		CanvasBody: res.CanvasBody,
	}
	resp = &types.GetCanvasInfoResponse{Canvas: canvas}
	if err != nil {

		return nil, err
	}
	return
}

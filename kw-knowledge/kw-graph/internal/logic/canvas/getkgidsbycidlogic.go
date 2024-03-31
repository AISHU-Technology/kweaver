package canvas

import (
	"context"
	"strconv"
	"strings"

	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

// GetKgIDsByCIDLogic 获取图谱id 逻辑层对象实例化
type GetKgIDsByCIDLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewGetKgIDsByCIDLogic 获取图谱id 逻辑层对象实例化
func NewGetKgIDsByCIDLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetKgIDsByCIDLogic {
	return &GetKgIDsByCIDLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GetKgIDsByCID 根据画布id获取图谱id 仅内部调用
func (l *GetKgIDsByCIDLogic) GetKgIDsByCID(req *types.GetKgidsByCIDRequest) (resp *types.ReturnResIntListResponse, err error) {
	var cIDs []int64
	cIDList := strings.Split(req.CIDs, ",")
	for _, id := range cIDList {
		cID, _ := strconv.Atoi(id)

		cIDs = append(cIDs, int64(cID))
	}

	res, err := l.svcCtx.CanvasManager.GetKgIDsByCID(l.ctx, cIDs)
	if err != nil {

		return nil, err
	}
	r := types.ReturnResIntListResponse{Res: res}

	return &r, nil
}

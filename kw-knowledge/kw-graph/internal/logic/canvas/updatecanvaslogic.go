package canvas

import (
	"context"
	"net/http"
	"regexp"

	errorCode "kw-graph/internal/errors"
	"time"

	"kw-graph/internal/logic/repo"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

// UpdateCanvasLogic 更新画布 逻辑层对象
type UpdateCanvasLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewUpdateCanvasLogic 更新画布 逻辑层对象实例化
func NewUpdateCanvasLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateCanvasLogic {
	return &UpdateCanvasLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// UpdateCanvas 更新画布 逻辑实现
func (l *UpdateCanvasLogic) UpdateCanvas(req *types.UpdateCanvasRequest) (id int64, err error) {
	if match, _ := regexp.MatchString("^[一-龥 -~·~！@#￥%……&*（）——+-=【】{}；’：“，。、《》？、|]*$", req.CanvasName); !match {
		return -1, errorCode.New(http.StatusBadRequest, errorCode.NameIncorrect, "画布名不能包含特殊字符")
	}

	// 校验图谱名称是否已存在
	cID, err := l.svcCtx.CanvasManager.GetCanvasIDByName(l.ctx, req.CanvasName)
	if err != nil {
		return -1, err
	}

	if cID != -1 && cID != req.CID {
		return -1, errorCode.New(http.StatusBadRequest, errorCode.ResourceAlreadyExists, "Canvas name already exists!")
	}

	canvas, err := l.svcCtx.CanvasManager.GetCanvasByCID(l.ctx, req.CID)
	if err != nil {
		return -1, err
	}

	if canvas == nil {
		return -1, errorCode.New(http.StatusBadRequest, errorCode.ResourceNotFound, "Canvas not found!")
	}
	canvas = &repo.Canvas{
		ID:         req.CID,
		KnwID:      req.KnwID,
		KgID:       req.KgID,
		CanvasName: req.CanvasName,
		CanvasBody: req.CanvasBody,
		CanvasInfo: req.CanvasInfo,
		UpdateUser: req.UserID,
		UpdateTime: time.Now().Format("2006-01-02 15:04:05"),
	}
	// 数据库层更新画布
	err = l.svcCtx.CanvasManager.UpdateCanvas(l.ctx, canvas)
	if err != nil {
		return -1, err
	}

	return req.CID, nil
}

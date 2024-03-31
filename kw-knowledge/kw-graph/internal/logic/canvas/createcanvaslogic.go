package canvas

import (
	"context"
	"github.com/zeromicro/go-zero/core/logx"
	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/logic/repo"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
	"net/http"
	"regexp"
	"time"
)

// CreateCanvasLogic 创建画布
type CreateCanvasLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewCreateCanvasLogic 创建画布对象 实例化
func NewCreateCanvasLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateCanvasLogic {
	return &CreateCanvasLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// CreateCanvas 逻辑实现
func (l *CreateCanvasLogic) CreateCanvas(req *types.CreateCanvasRequest) (int64, error) {
	if match, _ := regexp.MatchString("^[一-龥 -~·~！@#￥%……&*（）——+-=【】{}；’：“，。、《》？、|]*$", req.CanvasName); !match {
		return -1, errorCode.New(http.StatusBadRequest, errorCode.NameIncorrect, "画布名不能包含特殊字符")
	}

	canvasInfo := &repo.Canvas{
		KnwID:      req.KnwID,
		KgID:       req.KgID,
		CanvasName: req.CanvasName,
		CanvasBody: req.CanvasBody,
		CanvasInfo: req.CanvasInfo,
		CreateUser: req.UserID,
		CreateTime: time.Now().Format("2006-01-02 15:04:05"),
		UpdateUser: req.UserID,
		UpdateTime: time.Now().Format("2006-01-02 15:04:05"),
	}

	// 数据库层创建画布
	id, err := l.svcCtx.CanvasManager.CreateCanvas(l.ctx, canvasInfo)
	if err != nil {
		return -1, err
	}

	return id, nil
}

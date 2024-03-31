package repo

import (
	"context"

	"kw-graph/internal/types"
)

// Canvas 画布信息
type Canvas struct {
	ID         int64  `grom:"id"`
	KnwID      int64  `grom:"knw_id"`
	KgID       int64  `grom:"kg_id"`
	CanvasName string `grom:"canvas_name"`
	CanvasInfo string `grom:"canvas_info"`
	CanvasBody string `grom:"canvas_body"`
	CreateUser string `grom:"create_user"`
	CreateTime string `grom:"create_time"`
	UpdateUser string `grom:"update_user"`
	UpdateTime string `grom:"update_time"`
}

// CanvasesRepo 画布数据层接口抽象
//
//go:generate mockgen -package mock -source ../repo/canvas_repo.go -destination ../repo/mock/mock_canvas_repo.go
type CanvasesRepo interface {
	CreateCanvas(ctx context.Context, canvasInfo *Canvas) (int64, error)
	UpdateCanvas(ctx context.Context, canvasInfo *Canvas) error
	DeleteCanvas(ctx context.Context, cIDs []int64) ([]int64, error)
	DeleteCanvasByKgIDs(ctx context.Context, kgIds []int64) ([]int64, error)
	GetKgIDsByCID(ctx context.Context, cIDs []int64) ([]int64, error)
	GetCanvasByCID(ctx context.Context, cID int64) (*Canvas, error)
	GetCanvasList(ctx context.Context, req *types.GetCanvasesListRequest) ([]*Canvas, int64, error)
	GetCanvasIDByName(ctx context.Context, name string) (id int64, err error)
}

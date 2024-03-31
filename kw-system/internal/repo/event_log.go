package repo

import (
	"kw-system/internal/model/po"
	"kw-system/internal/model/types"
)

// EventLogRepo 数据访问层
type EventLogRepo interface {
	// GetHomeEventList 根据模块类型获取首页事件
	GetHomeEventList(req *types.ReqGetHomeEventList) ([]*po.TEventLog, error)
	// AddEvent 添加前端埋点事件
	AddEvent(req *types.ReqAddEvent) error
}

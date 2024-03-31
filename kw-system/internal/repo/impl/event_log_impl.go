package impl

import (
	"fmt"
	"github.com/AISHU-Technology/kw-go-core/idx"
	"github.com/zeromicro/go-zero/core/logx"
	"kw-system/internal/model/po"
	"kw-system/internal/model/types"
	"kw-system/internal/repo"
	"kw-system/internal/svc"
	"time"
)

type EventLogRepo struct {
	svcCtx *svc.ServiceContext
}

func NewEventLogRepo(svcCtx *svc.ServiceContext) repo.EventLogRepo {
	return &EventLogRepo{
		svcCtx: svcCtx,
	}
}

func (e EventLogRepo) GetHomeEventList(req *types.ReqGetHomeEventList) ([]*po.TEventLog, error) {

	res := make([]*po.TEventLog, 0)
	limit := 6
	err := e.svcCtx.DB.Raw(`SELECT f_title,f_remark,f_create_time FROM t_event_log WHERE f_mod_type = ? AND f_create_by = ? ORDER BY f_create_time DESC LIMIT ?`, req.ModType, req.UserId, limit).Find(&res).Error
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (e EventLogRepo) AddEvent(req *types.ReqAddEvent) error {
	model := &po.TEventLog{
		FID:         idx.NewID(),
		FModType:    req.ModType,
		FTitle:      req.Title,
		FPath:       req.Path,
		FRemark:     req.Remark,
		FMethod:     req.Method,
		FCreateBy:   req.UserId,
		FCreateTime: time.Now()}
	err := e.svcCtx.DB.Model(&po.TEventLog{}).Create(model).Error
	if err != nil {
		return err
	}
	//异步复制事件记录到事件历史表中
	go e.CopyEventHist(model)
	return nil
}

// CopyEventHist 复制事件记录到事件历史表
func (e EventLogRepo) CopyEventHist(model *po.TEventLog) {
	histModel := &po.TEventLogHist{
		FID:         model.FID,
		FModType:    model.FModType,
		FTitle:      model.FTitle,
		FPath:       model.FPath,
		FRemark:     model.FRemark,
		FType:       model.FType,
		FMethod:     model.FMethod,
		FCreateBy:   model.FCreateBy,
		FCreateTime: model.FCreateTime}
	err := e.svcCtx.DB.Model(&po.TEventLogHist{}).Create(histModel).Error
	if err != nil {
		logx.Error(fmt.Sprintf("copy events failed: '%s'", err.Error()))
	}
}

// ClearEventsByTime 清理指定时间之前的事件记录
func ClearEventsByTime(createTimeThreshold time.Time, svcCtx *svc.ServiceContext) error {
	err := svcCtx.DB.Exec(`DELETE FROM t_event_log WHERE f_create_time < ?`, createTimeThreshold).Error
	if err != nil {
		return err
	}
	return nil
}

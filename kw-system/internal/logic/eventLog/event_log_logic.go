package eventLog

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/AISHU-Technology/kw-go-core/redis"
	"github.com/AISHU-Technology/kw-go-core/response"
	"github.com/AISHU-Technology/kw-go-core/utils"
	"github.com/zeromicro/go-zero/core/logx"
	"kw-system/internal/common"
	"kw-system/internal/errors"
	"kw-system/internal/log/logger"
	"kw-system/internal/model/po"
	"kw-system/internal/model/types"
	"kw-system/internal/repo/impl"
	"kw-system/internal/svc"
	"time"
)

type EventLogLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewEventLogLogic(ctx context.Context, svcCtx *svc.ServiceContext) *EventLogLogic {
	return &EventLogLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (logic *EventLogLogic) GetHomeEventList(req *types.ReqGetHomeEventList) (resp interface{}, err error) {
	res := make([]*po.TEventLog, 0)
	key := fmt.Sprintf(common.KWEAVER_HOME_EVENT_USERID_TYPE_LIST, req.UserId, req.ModType)
	_, result := redis.Get(context.Background(), key)
	//数据存在cache
	if result != "" {
		if err := json.Unmarshal([]byte(result), &res); err != nil {
			return nil, errors.InternalServerError.SetDetailError(err)
		}
	} else {
		repo := impl.NewEventLogRepo(logic.svcCtx)
		res, err = repo.GetHomeEventList(req)
		if err != nil {
			return nil, errors.InternalServerError.SetDetailError(err)
		}
		//将结果缓存到redis
		jsonData, err := json.Marshal(res)
		if err != nil {
			return nil, errors.InternalServerError.SetDetailError(err)
		}
		if err := logic.svcCtx.RedisDB.Write.Set(context.Background(), key, jsonData, time.Duration(utils.RangeRandomNum(5, 10))*time.Second).Err(); err != nil {
			logx.Error(fmt.Sprintf("cache data failed: '%s'", err.Error()))
		}
	}
	resList := make([]*types.RespGetHomeEventList, 0)
	for _, row := range res {
		event := types.RespGetHomeEventList{
			Title:      row.FTitle,
			Remark:     row.FRemark,
			CreateTime: response.JsonTime(row.FCreateTime),
		}
		resList = append(resList, &event)
	}
	resp = &types.TotalVo{
		Data: resList,
	}
	return resp, nil

}

func (logic *EventLogLogic) AddEvent(req *types.ReqAddEvent) error {
	repo := impl.NewEventLogRepo(logic.svcCtx)
	if err := repo.AddEvent(req); err != nil {
		return errors.InternalServerError.SetDetailError(err)
	}
	//记录日志
	logModel := logger.NewBusinessLog().WithOperator(logic.ctx.Value(common.OperatorKey)).
		WithOperation(logger.Create).WithObject(&logger.Object{Type: logger.EventLog}).WithTargetObject(req).GenerateDescription()
	logx.Info(logModel)
	return nil
}

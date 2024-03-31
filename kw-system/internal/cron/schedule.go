package cron

import (
	"context"
	"fmt"
	"github.com/AISHU-Technology/kw-go-core/date"
	"github.com/AISHU-Technology/kw-go-core/redis"
	"github.com/AISHU-Technology/kw-go-core/utils"
	"github.com/robfig/cron/v3"
	"github.com/zeromicro/go-zero/core/logx"
	"kw-system/internal/common"
	"kw-system/internal/repo/impl"
	"kw-system/internal/svc"
	"time"
)

func ScheduleRun(ctx context.Context, svcCtx *svc.ServiceContext) {
	c := cron.New()
	//每周日22点执行任务 格式：分钟 小时 日 月 周
	_, err := c.AddFunc("0 22 * * 0", func() { clearEventsJob(ctx, svcCtx) })
	if err != nil {
		logx.Error(fmt.Sprintf("Add schedule job failed: '%s'", err.Error()))
	}
	c.Start()
	defer c.Stop()
	select {}
}

func clearEventsJob(ctx context.Context, svcCtx *svc.ServiceContext) {
	_, v := redis.Get(ctx, common.KWEAVER_CLEARENVENIS_JOB_KEY)
	if utils.IsNotBlank(v) {
		return
	}
	t := time.Duration(utils.RangeRandomNum(5, 10)) * time.Minute
	redis.SetEX(ctx, common.KWEAVER_CLEARENVENIS_JOB_KEY, "1", t)
	logx.Info("Start clear events job...")
	err := impl.ClearEventsByTime(date.GetNowAddDay(-90), svcCtx)
	if err != nil {
		logx.Error(fmt.Sprintf("clear events failed: '%s'", err.Error()))
		redis.Del(ctx, common.KWEAVER_CLEARENVENIS_JOB_KEY)
	}
}

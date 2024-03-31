package eventLog

import (
	httpx "github.com/zeromicro/go-zero/rest/httpx"
	"kw-system/internal/errors"
	"kw-system/internal/logic/eventLog"
	"kw-system/internal/model/types"
	"kw-system/internal/svc"
	"net/http"
)

// GetHomeEventList 根据模块类型获取首页事件
func GetHomeEventList(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqGetHomeEventList
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := eventLog.NewEventLogLogic(r.Context(), svcCtx)
		resp, err := l.GetHomeEventList(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: resp})
		}
	}
}

// AddEvent 添加前端埋点事件
func AddEvent(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqAddEvent
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := eventLog.NewEventLogLogic(r.Context(), svcCtx)
		err := l.AddEvent(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
		}
	}
}

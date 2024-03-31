package dict

import (
	"github.com/zeromicro/go-zero/rest/httpx"
	"kw-system/internal/errors"
	"kw-system/internal/logic/dict"
	"kw-system/internal/model/types"
	"kw-system/internal/svc"
	"net/http"
)

// GetDictList 获取字典列表
func GetDictList(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqGetDictList
		if err := httpx.ParseForm(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := dict.NewDictLogic(r.Context(), svcCtx)
		resp, err := l.GetDictList(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: resp})
		}
	}
}

// GetDict 获取指定字典详情
func GetDict(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.IdFormVO
		if err := httpx.ParseForm(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := dict.NewDictLogic(r.Context(), svcCtx)
		resp, err := l.GetDict(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: resp})
		}
	}
}

// AddDict 创建字典
func AddDict(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqAddDict
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := dict.NewDictLogic(r.Context(), svcCtx)
		err := l.AddDict(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
		}
	}
}

// UpdateDict 修改字典
func UpdateDict(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqUpdateDict
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := dict.NewDictLogic(r.Context(), svcCtx)
		err := l.UpdateDict(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
		}
	}
}

// DeleteDict 删除字典
func DeleteDict(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqDeleteDict
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := dict.NewDictLogic(r.Context(), svcCtx)
		err := l.DeleteDict(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
		}
	}
}

// GetDictItemList 获取指定字典下的字典值列表
func GetDictItemList(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqGetDictItemList
		if err := httpx.ParseForm(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := dict.NewDictLogic(r.Context(), svcCtx)
		resp, err := l.GetDictItemList(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: resp})
		}
	}
}

// GetDictItem 获取指定字典值详情
func GetDictItem(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.IdFormVO
		if err := httpx.ParseForm(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := dict.NewDictLogic(r.Context(), svcCtx)
		resp, err := l.GetDictItem(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: resp})
		}
	}
}

// AddDictItem 创建字典值
func AddDictItem(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqAddDictItem
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := dict.NewDictLogic(r.Context(), svcCtx)
		err := l.AddDictItem(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
		}
	}
}

// UpdateDictItem 修改字典值
func UpdateDictItem(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqUpdateDictItem
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := dict.NewDictLogic(r.Context(), svcCtx)
		err := l.UpdateDictItem(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
		}
	}
}

// DeleteDictItem 删除字典值
func DeleteDictItem(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqDeleteDict
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}

		l := dict.NewDictLogic(r.Context(), svcCtx)
		err := l.DeleteDictItem(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
		}
	}
}

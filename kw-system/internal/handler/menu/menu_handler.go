package menu

import (
	"github.com/AISHU-Technology/kw-go-core/utils"
	"github.com/zeromicro/go-zero/rest/httpx"
	"kw-system/internal/errors"
	menu "kw-system/internal/logic/menu"
	"kw-system/internal/model/po"
	"kw-system/internal/model/types"
	"kw-system/internal/svc"
	"math"
	"net/http"
)

// GetMenuList 获取菜单列表
func GetMenuList(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqGetMenuList
		if err := httpx.ParseForm(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}
		pid, err := utils.ToInt64(req.Pid)
		if err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}
		l := menu.NewMenuLogic(r.Context(), svcCtx)
		menuMap, err := l.GetMenuList([]*po.TMenu{{Id: pid}}, &req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			resp := make([]*types.RespMenu, 0)
			for _, menus := range menuMap {
				resp = append(resp, menus...)
			}
			list := &types.ListVo{}
			list.Total = int64(len(resp))
			start, end := SlicePage(int64(req.Page), int64(req.Size), int64(len(resp)))
			list.Data = resp[start:end]
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: list})
		}
	}
}

func SlicePage(page, pageSize, nums int64) (sliceStart, sliceEnd int64) {
	if pageSize == -1 {
		page = 1
		pageSize = nums //默认数量
	}
	if pageSize > nums {
		return 0, nums
	}
	// 总页数
	pageCount := int64(math.Ceil(float64(nums) / float64(pageSize)))
	if page > pageCount {
		return 0, 0
	}
	sliceStart = (page - 1) * pageSize
	sliceEnd = sliceStart + pageSize

	if sliceEnd > nums {
		sliceEnd = nums
	}
	return sliceStart, sliceEnd
}

// GetMenu 获取指定菜单详情
func GetMenu(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.IdFormVO
		if err := httpx.ParseForm(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}
		if _, err := utils.ToInt64(req.Id); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}
		l := menu.NewMenuLogic(r.Context(), svcCtx)
		resp, err := l.GetMenu(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: resp})
		}
	}
}

// AddMenu 创建菜单
func AddMenu(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqAddMenu
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}
		if _, err := utils.ToInt64(req.Pid); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}
		if req.MenuType == 1 && (req.Icon == "" || req.SelectedIcon == "" || req.Path == "" || req.Component == "") {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError("Icon, selected icon, path and component cannot be empty"))
			return
		}

		l := menu.NewMenuLogic(r.Context(), svcCtx)
		err := l.AddMenu(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
		}
	}
}

// UpdateMenu 修改菜单
func UpdateMenu(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqUpdateMenu
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}
		if _, err := utils.ToInt64(req.Pid); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}
		if req.MenuType == 1 && (req.Icon == "" || req.SelectedIcon == "" || req.Path == "" || req.Component == "") {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError("Icon, selected icon, path and component cannot be empty"))
			return
		}

		l := menu.NewMenuLogic(r.Context(), svcCtx)
		err := l.UpdateMenu(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
		}
	}
}

// DeleteMenu 删除菜单
func DeleteMenu(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReqDeleteMenu
		if err := httpx.Parse(r, &req); err != nil {
			errors.ErrorHandler(w, errors.ParameterError.SetDetailError(err.Error()))
			return
		}
		l := menu.NewMenuLogic(r.Context(), svcCtx)
		err := l.DeleteMenu(&req)
		if err != nil {
			errors.ErrorHandler(w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, &types.ResVo{Res: "OK"})
		}
	}
}

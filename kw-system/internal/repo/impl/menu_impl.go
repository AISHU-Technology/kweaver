package impl

import (
	"kw-system/internal/errors"
	"kw-system/internal/model/po"
	"kw-system/internal/model/types"
	"kw-system/internal/repo"
	"kw-system/internal/svc"
	"strconv"
	"time"
)

type MenuRepo struct {
	svcCtx *svc.ServiceContext
}

func NewMenuRepo(svcCtx *svc.ServiceContext) repo.MenuRepo {
	return &MenuRepo{
		svcCtx: svcCtx,
	}
}

func (e MenuRepo) GetMenuList(pids []int64) ([]*po.TMenu, error) {
	menuList := make([]*po.TMenu, 0)
	if err := e.svcCtx.DB.Model(&po.TMenu{}).Where("f_pid in (?)", pids).Order("f_sort_order ASC,f_id ASC").Find(&menuList).Error; err != nil {
		return nil, errors.InternalServerError.SetDetailError(err)
	}
	return menuList, nil
}

func (e MenuRepo) GetMenu(MenuId int64) (*po.TMenu, error) {

	menuModel := &po.TMenu{}
	//忽略是否删除
	if err := e.svcCtx.DB.Model(&po.TMenu{}).Unscoped().Where("f_id = ?", MenuId).Find(&menuModel).Error; err != nil {
		return nil, errors.InternalServerError.SetDetailError(err)
	}
	return menuModel, nil
}

func (e MenuRepo) GetMenuId(code string) (int64, error) {
	var id int64
	if err := e.svcCtx.DB.Model(&po.TMenu{}).Select("f_id").Where("f_code = ?", code).Find(&id).Error; err != nil {
		return 0, errors.InternalServerError.SetDetailError(err)
	}
	return id, nil
}

func (e MenuRepo) AddMenu(req *types.ReqAddMenu) error {
	var pid int64
	var err error
	if req.Pid != "" {
		pid, err = strconv.ParseInt(req.Pid, 10, 64)
		if err != nil {
			return errors.InternalServerError.SetDetailError(err)
		}
	}
	model := &po.TMenu{
		CName:        req.CName,
		EName:        req.EName,
		Code:         req.Code,
		Icon:         req.Icon,
		SelectedIcon: req.SelectedIcon,
		Path:         req.Path,
		Component:    req.Component,
		MenuType:     req.MenuType,
		Pid:          pid,
		SortOrder:    req.SortOrder,
		Visible:      req.Visible}

	if err := e.svcCtx.DB.Model(&po.TMenu{}).Create(model).Error; err != nil {
		return errors.InternalServerError.SetDetailError(err)
	}
	return nil
}

func (e MenuRepo) UpdateMenu(req *types.ReqUpdateMenu) error {
	var pid int64
	var err error
	if req.Pid != "" {
		pid, err = strconv.ParseInt(req.Pid, 10, 64)
		if err != nil {
			return errors.InternalServerError.SetDetailError(err)
		}
	}
	model := &po.TMenu{
		CName:        req.CName,
		EName:        req.EName,
		Icon:         req.Icon,
		SelectedIcon: req.SelectedIcon,
		Path:         req.Path,
		Component:    req.Component,
		MenuType:     req.MenuType,
		Pid:          pid,
		SortOrder:    req.SortOrder,
		Visible:      req.Visible,
		UpdateTime:   time.Now()}

	if err := e.svcCtx.DB.Model(&po.TMenu{}).Select("f_c_name", "f_e_name", "f_icon", "f_selected_icon", "f_path", "f_component", "f_menuType", "f_pid", "f_sort_order", "f_visible", "f_update_time").Where("f_id = ?", req.Id).Updates(model).Error; err != nil {
		return errors.InternalServerError.SetDetailError(err)
	}
	return nil
}

func (e MenuRepo) GetMenuIds(menuIds []int64) ([]int64, error) {
	var res []int64
	if len(menuIds) > 0 {
		if err := e.svcCtx.DB.Model(&po.TMenu{}).Select("f_id").Where("f_id in (?)", menuIds).Find(&res).Error; err != nil {
			return []int64{}, errors.InternalServerError.SetDetailError(err)
		}
	}
	return res, nil
}

func (e MenuRepo) DeleteMenu(req *types.ReqDeleteMenu) error {

	if len(req.Ids) > 0 {
		//更新修改人、修改时间、删除状态
		if err := e.svcCtx.DB.Model(&po.TMenu{}).Select("f_update_time", "f_del_flag").Where("f_id in (?)", req.Ids).Updates(&po.TMenu{UpdateTime: time.Now(), DelFlag: 1}).Error; err != nil {
			return errors.InternalServerError.SetDetailError(err)
		}
	}
	return nil
}

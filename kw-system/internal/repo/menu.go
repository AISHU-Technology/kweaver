package repo

import (
	"kw-system/internal/model/po"
	"kw-system/internal/model/types"
)

// MenuRepo 菜单 数据访问层
type MenuRepo interface {
	// GetMenuList 获取菜单列表
	GetMenuList(pids []int64) ([]*po.TMenu, error)
	// GetMenu 获取指定菜单详情
	GetMenu(MenuId int64) (*po.TMenu, error)
	// GetMenuId 根据菜单标识获取菜单id
	GetMenuId(code string) (int64, error)
	// AddMenu 创建菜单
	AddMenu(req *types.ReqAddMenu) error
	// UpdateMenu 修改菜单
	UpdateMenu(req *types.ReqUpdateMenu) error
	// GetMenuIds 通过菜单id获取数据库中存在的菜单id
	GetMenuIds(menuIds []int64) ([]int64, error)
	// DeleteMenu 删除菜单
	DeleteMenu(req *types.ReqDeleteMenu) error
}

package po

import (
	"github.com/AISHU-Technology/kw-go-core/idx"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
	"time"
)

// TMenu 菜单表
type TMenu struct {
	Id           int64                 `gorm:"column:f_id;type:bigint(20) not null"`                               //菜单id
	CName        string                `gorm:"column:f_c_name;type:varchar(128) not null"`                         //中文名称
	EName        string                `gorm:"column:f_e_name;type:varchar(128) not null"`                         //英文名称
	Code         string                `gorm:"column:f_code;type:varchar(255) not null;index:idx_menu_code"`       //菜单标识
	Icon         string                `gorm:"column:f_icon;type:varchar(128)"`                                    //常规图标
	SelectedIcon string                `gorm:"column:f_selected_icon;type:varchar(128)"`                           //选中图标
	Path         string                `gorm:"column:f_path;type:varchar(128)"`                                    //路由地址
	Component    string                `gorm:"column:f_component;type:varchar(255)"`                               //组件路径
	MenuType     int                   `gorm:"column:f_menu_type;type:smallint not null"`                          //1-菜单 2-按钮
	Pid          int64                 `gorm:"column:f_pid;type:bigint(20) not null;default:0;index:idx_menu_pid"` //上级菜单
	SortOrder    int                   `gorm:"column:f_sort_order;type:smallint not null;default:0"`               //排序
	Visible      int                   `gorm:"column:f_visible;type:smallint not null;default:0"`                  //是否显示 0-显示 1-不显示
	CreateTime   time.Time             `gorm:"column:f_create_time;type:datetime not null"`                        //创建时间
	UpdateTime   time.Time             `gorm:"column:f_update_time;type:datetime not null"`                        //修改时间
	DelFlag      soft_delete.DeletedAt `gorm:"column:f_del_flag;type:smallint;softDelete:flag;default:0"`          //删除标识
}

func (f *TMenu) BeforeCreate(tx *gorm.DB) error {
	// 在插入记录之前自动填充id、创建时间、修改时间
	f.Id = idx.NewID64()
	f.CreateTime = time.Now()
	f.UpdateTime = time.Now()
	return nil
}

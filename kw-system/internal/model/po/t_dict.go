package po

import (
	"github.com/AISHU-Technology/kw-go-core/idx"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
	"time"
)

//var DictionaryModel = &TDict{}

type TDict struct {
	ID         uint64                `gorm:"column:f_id;type:bigint;primary_key"`
	CName      string                `gorm:"column:f_c_name;type:varchar(100) not null"`
	EName      string                `gorm:"column:f_e_name;type:varchar(150) not null"`
	Remark     string                `gorm:"column:f_remark;type:varchar(255) not null;default:''"`
	DictType   string                `gorm:"column:f_dict_type;type:varchar(50) not null"`
	CreateBy   string                `gorm:"column:f_create_by;type:varchar(50) not null"`
	UpdateBy   string                `gorm:"column:f_update_by;type:varchar(50) not null"`
	CreateTime time.Time             `gorm:"column:f_create_time;type:datetime not null"`
	UpdateTime time.Time             `gorm:"column:f_update_time;type:datetime not null"`
	DelFlag    soft_delete.DeletedAt `gorm:"column:f_del_flag;type:smallint;softDelete:flag;default:0"`
}

func (f *TDict) BeforeCreate(tx *gorm.DB) error {
	// 在插入记录之前自动填充id、创建时间、修改时间
	f.ID = idx.NewID()
	f.CreateTime = time.Now()
	f.UpdateTime = time.Now()
	return nil
}

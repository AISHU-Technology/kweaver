package po

import (
	"time"
)

// TEventLog 事件记录表
type TEventLog struct {
	FID         uint64    `gorm:"column:f_id;type:bigint;primary_key"`
	FModType    int       `gorm:"column:f_mod_type;type:smallint not null;index:idx_event_mod_type"`
	FTitle      string    `gorm:"column:f_title;type:varchar(50) not null"`
	FPath       string    `gorm:"column:f_path;type:varchar(150) not null"`
	FType       int       `gorm:"column:f_type;type:smallint not null;default:1"`
	FMethod     string    `gorm:"column:f_method;type:varchar(10)"`
	FRemark     string    `gorm:"column:f_remark;type:varchar(255)"`
	FCreateBy   string    `gorm:"column:f_create_by;type:varchar(50) not null"`
	FCreateTime time.Time `gorm:"column:f_create_time;type:datetime not null"`
}

//func (f *TEventLog) BeforeCreate(tx *gorm.DB) error {
//	// 在插入记录之前自动填充创建时间
//	f.FCreateTime = time.Now()
//	f.FID = idx.NewID()
//	return nil
//}

package po

import "time"

// TEventLogHist 事件记录历史表
type TEventLogHist struct {
	FID         uint64    `gorm:"column:f_id;type:bigint;primary_key"`
	FModType    int       `gorm:"column:f_mod_type;type:smallint not null;index:idx_event_hist_mod_type"`
	FTitle      string    `gorm:"column:f_title;type:varchar(50) not null"`
	FPath       string    `gorm:"column:f_path;type:varchar(150) not null"`
	FRemark     string    `gorm:"column:f_remark;type:varchar(255)"`
	FType       int       `gorm:"column:f_type;type:smallint not null;default:1"`
	FMethod     string    `gorm:"column:f_method;type:varchar(10)"`
	FCreateBy   string    `gorm:"column:f_create_by;type:varchar(50) not null"`
	FCreateTime time.Time `gorm:"column:f_create_time;type:datetime not null"`
}

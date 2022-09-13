package po

/**
 * @Author: 王运凯
 * @Date: 2021/12/8
 * @Email: William.wang@aishu.cn
 **/

// Version 此信息用来记录当前系统版本
type Version struct {
	ID             int64
	StudioVersion  string `gorm:"not null;type:varchar(128)"`
	BuilderVersion string `gorm:"not null;type:varchar(128)"`
	EngineVersion  string `gorm:"not null;type:varchar(128)"`
}

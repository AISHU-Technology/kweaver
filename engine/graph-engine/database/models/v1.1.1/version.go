package v1_1_1

// 此信息用来记录当前系统版本
type Version struct {
	ID             int    `gorm:"column:id;type:int(50);primaryKey"`
	ManagerVersion string `gorm:"column:manager_version;type:varchar(255) not null"`
	BuilderVersion string `gorm:"column:builder_version;type:varchar(255) not null"`
	EngineVersion  string `gorm:"column:engine_version;type:varchar(255) not null"`
}

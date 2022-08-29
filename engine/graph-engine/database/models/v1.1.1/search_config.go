package v1_1_1

import "time"

// 高级搜索配置
type SearchConfig struct {
	ID          int       `gorm:"column:id;primaryKey"`
	ConfName    string    `gorm:"column:conf_name;type:varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NULL DEFAULT NULL;uniqueIndex"`
	Type        string    `gorm:"column:type;type:varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL"`
	ConfDesc    string    `gorm:"column:conf_desc;type:varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL"`
	KGID        int       `gorm:"column:kg_id;type:int(50) NULL DEFAULT NULL"`
	ConfContent string    `gorm:"column:conf_content;type:longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL"`
	DB2Doc      string    `gorm:"column:db_2_doc;type:longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL"`
	CreateTime  time.Time `gorm:"column:create_time;type:datetime(0) NULL DEFAULT NULL"`
	UpdateTime  time.Time `gorm:"column:update_time;type:datetime(0) NULL DEFAULT NULL"`
	//CreateUser  string    `gorm:"column:create_user;type:varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL"`
	//UpdateUser  string    `gorm:"column:update_user;type:varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NULL DEFAULT NULL"`
}

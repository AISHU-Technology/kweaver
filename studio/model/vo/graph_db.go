package vo

// GraphDBItemVo 查询存储记录列表时的存储项
type GraphDBItemVo struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Type   string `json:"type"`
	Count  int64  `json:"count"` //关联的图谱数量
	OsName string `json:"osName"`
	User   string `json:"user"`
	TimeVo
	//Dbs     []string `json:"dbs"` //图谱数据库名称
}

// GraphDBVo 根据id查询存储记录时的响应
type GraphDBVo struct {
	ID       int      `json:"id"`
	Name     string   `json:"name" binding:"graphdbName"`
	Type     string   `json:"type" binding:"oneof=orientdb nebula"`
	User     string   `json:"user" binding:"required,lte=50"`
	Password string   `json:"password" binding:"required,lte=150"`
	Ip       []string `json:"ip" binding:"ipList"`
	Port     []string `json:"port" binding:"portList"`
	OsId     int      `json:"osId" binding:"required_unless=Type orientdb,omitempty,gte=1"`
}

// GraphDBUpdateVo 根据id更新存储记录时的请求
type GraphDBUpdateVo struct {
	ID       int      `json:"id" binding:"gt=0"`
	Name     string   `json:"name" binding:"graphdbName"`
	Type     string   `json:"type" binding:"oneof=orientdb nebula"`
	User     string   `json:"user" binding:"required,lte=50"`
	Password string   `json:"password" binding:"required,lte=150"`
	Ip       []string `json:"ip" binding:"ipList"`
	Port     []string `json:"port" binding:"portList"`
}

// ConnTestVo 测试配置是否正确时的请求
type ConnTestVo struct {
	Type     string   `json:"type" binding:"oneof=orientdb nebula"`
	User     string   `json:"user" binding:"required,lte=50"`
	Password string   `json:"password" binding:"required,lte=150"`
	Ip       []string `json:"ip" binding:"ipList"`
	Port     []string `json:"port" binding:"portList"`
}

type GraphListSearchCondition struct {
	SearchCondition
	Type string `form:"type"  json:"type" binding:"required,oneof=orientdb nebula all"`
	Name string `form:"name" json:"name"`
}

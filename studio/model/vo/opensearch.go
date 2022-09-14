package vo

type OsSearchCondition struct {
	SearchCondition
	Name string `form:"name" json:"name"`
}

type OpenSearchIdVo struct {
	ID int `form:"id" json:"id" binding:"gt=0"`
}

// OpenSearchTestVo 测试配置是否正确时的请求
type OpenSearchTestVo struct {
	User     string   `json:"user" binding:"required,lte=50"`
	Password string   `json:"password" binding:"required,lte=150"`
	Ip       []string `json:"ip" binding:"ipList"`
	Port     []string `json:"port" binding:"portList"`
}

// OpenSearchItemVo 查询OpenSearch列表时的存储项
type OpenSearchItemVo struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	User    string `json:"user"`
	Updated int64  `json:"updated"`
	Created int64  `json:"created"`
}

type OpenSearchVo struct {
	ID       int      `json:"id"`
	Name     string   `json:"name" binding:"graphdbName"`
	User     string   `json:"user" binding:"required,lte=50"`
	Password string   `json:"password" binding:"required,lte=150"`
	Ip       []string `json:"ip" binding:"ipList"`
	Port     []string `json:"port" binding:"portList"`
	Updated  int64    `json:"updated"`
	Created  int64    `json:"created"`
}

// OpenSearchUpdateVo 根据id更新存储记录时的请求
type OpenSearchUpdateVo struct {
	ID       int      `json:"id" binding:"gt=0"`
	Name     string   `json:"name" binding:"graphdbName"`
	User     string   `json:"user" binding:"required,lte=50"`
	Password string   `json:"password" binding:"required,lte=150"`
	Ip       []string `json:"ip" binding:"ipList"`
	Port     []string `json:"port" binding:"portList"`
}

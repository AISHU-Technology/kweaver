package interfaces

var (
	ACTION_TYPE_SORT = map[string]string{
		"name":        "f_name",
		"update_time": "f_update_time",
	}
)

type ActionTypeWithKeyField struct {
	ATID         string           `json:"id" mapstructure:"id"`
	ATName       string           `json:"name" mapstructure:"name"`
	ActionType   string           `json:"action_type" mapstructure:"action_type"`
	ObjectTypeID string           `json:"object_type_id" mapstructure:"object_type_id"`
	ObjectType   SimpleObjectType `json:"object_type,omitempty" mapstructure:"object_type"` // 翻译绑定的对象类
	Condition    CondCfg          `json:"condition" mapstructure:"condition"`
	Affect       *ActionAffect    `json:"affect" mapstructure:"affect"`
	ActionSource ToolSource       `json:"action_source" mapstructure:"action_source"`
	Parameters   []Parameter      `json:"parameters" mapstructure:"parameters"`
	Schedule     Schedule         `json:"schedule" mapstructure:"schedule"`
}

// knowledge_network
type ActionType struct {
	ActionTypeWithKeyField `mapstructure:",squash"`
	CommonInfo             `mapstructure:",squash"`
	KNID                   string `json:"kn_id" mapstructure:"kn_id"`
	Branch                 string `json:"branch" mapstructure:"branch"`

	Creator    AccountInfo `json:"creator" mapstructure:"creator"`
	CreateTime int64       `json:"create_time" mapstructure:"create_time"`
	Updater    AccountInfo `json:"updater" mapstructure:"updater"`
	UpdateTime int64       `json:"update_time" mapstructure:"update_time"`

	ModuleType string `json:"module_type" mapstructure:"module_type"`

	IfNameModify bool `json:"-"`
	// 向量
	Vector []float32 `json:"_vector,omitempty"`
	Score  *float64  `json:"_score,omitempty"` // opensearch检索的得分，在概念搜索时使用
}

type ToolSource struct {
	Type   string `json:"type" mapstructure:"type"`
	BoxID  string `json:"box_id" mapstructure:"box_id"`
	ToolID string `json:"tool_id" mapstructure:"tool_id"`
}

type CondCfg struct {
	ObjectTypeID string     `json:"object_type_id,omitempty" mapstructure:"object_type_id"` // 行动条件需要标记是哪个行动类的
	Field        string     `json:"field,omitempty" mapstructure:"field"`
	Operation    string     `json:"operation,omitempty" mapstructure:"operation"`
	SubConds     []*CondCfg `json:"sub_conditions,omitempty" mapstructure:"sub_conditions"`
	ValueOptCfg  `mapstructure:",squash"`

	// NameField *ViewField `json:"-" mapstructure:"-"`
}

type ValueOptCfg struct {
	ValueFrom string `json:"value_from,omitempty" mapstructure:"value_from"`
	Value     any    `json:"value,omitempty" mapstructure:"value"`
}

type ActionAffect struct {
	ObjectTypeID string           `json:"object_type_id,omitempty" mapstructure:"object_type_id"` // 翻译影响的对象类
	ObjectType   SimpleObjectType `json:"object_type,omitempty" mapstructure:"object_type"`
	Comment      string           `json:"comment,omitempty" mapstructure:"comment"`
}

type Schedule struct {
	Type       string `json:"type" mapstructure:"type"`
	Expression string `json:"expression" mapstructure:"expression"`
}

// 对象类的分页查询
type ActionTypesQueryParams struct {
	PaginationQueryParameters
	NamePattern  string
	Tag          string
	Branch       string
	KNID         string
	GroupID      string
	ObjectTypeID string
	ActionType   string
}

// 检索行动类列表
type ActionTypes struct {
	Entries     []*ActionType `json:"entries"`
	TotalCount  int64         `json:"total_count,omitempty"`
	SearchAfter []any         `json:"search_after,omitempty"`
	OverallMs   int64         `json:"overall_ms"`
}

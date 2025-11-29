package interfaces

const (

	// 逻辑属性类型
	LOGIC_PROPERTY_TYPE_METRIC   = "metric"
	LOGIC_PROPERTY_TYPE_OPERATOR = "operator"
)

var (
	OBJECT_TYPE_SORT = map[string]string{
		"name":        "f_name",
		"update_time": "f_update_time",
	}
)

type ObjectTypeWithKeyField struct {
	OTID            string           `json:"id" mapstructure:"id"`
	OTName          string           `json:"name" mapstructure:"name"`
	DataSource      *ResourceInfo    `json:"data_source" mapstructure:"data_source"`
	DataProperties  []*DataProperty  `json:"data_properties,omitempty" mapstructure:"data_properties"`
	LogicProperties []*LogicProperty `json:"logic_properties,omitempty" mapstructure:"logic_properties"`
	PrimaryKeys     []string         `json:"primary_keys" mapstructure:"primary_keys"`
	DisplayKey      string           `json:"display_key" mapstructure:"display_key"`
	// ConditionOperations []string         `json:"condition_operations"`
}

// object type
type ObjectType struct {
	ObjectTypeWithKeyField `mapstructure:",squash"`
	CommonInfo             `mapstructure:",squash"`
	KNID                   string `json:"kn_id" mapstructure:"kn_id"`
	Branch                 string `json:"branch" mapstructure:"branch"`

	Index          string      `json:"index" mapstructure:"index"`
	IndexAvailable bool        `json:"index_available" mapstructure:"index_available"`
	Creator        AccountInfo `json:"creator" mapstructure:"creator"`
	CreateTime     int64       `json:"create_time" mapstructure:"create_time"`
	Updater        AccountInfo `json:"updater" mapstructure:"updater"`
	UpdateTime     int64       `json:"update_time" mapstructure:"update_time"`

	ModuleType string `json:"module_type" mapstructure:"module_type"`

	PropertyMap  map[string]string `json:"-"` // 以属性名为key，显示名为value的map
	IfNameModify bool              `json:"-"`

	// 向量
	Vector []float32 `json:"_vector,omitempty"`
	Score  *float64  `json:"_score,omitempty"` // opensearch检索的得分，在概念搜索时使用
}

type SimpleObjectType struct {
	OTID   string `json:"id" mapstructure:"id"`
	OTName string `json:"name" mapstructure:"name"`
	Branch string `json:"branch" mapstructure:"branch"`
	Icon   string `json:"icon" mapstructure:"icon"`
	Color  string `json:"color" mapstructure:"color"`
}

type DataProperty struct {
	Name        string `json:"name" mapstructure:"name"`
	DisplayName string `json:"display_name" mapstructure:"display_name"`
	Type        string `json:"type" mapstructure:"type"`
	Comment     string `json:"comment" mapstructure:"comment"`

	MappedField Field `json:"mapped_field" mapstructure:"mapped_field"`

	IndexConfig *IndexConfig `json:"index_config,omitempty" mapstructure:"index_config,omitempty"`

	ConditionOperations []string `json:"condition_operations,omitempty"` // 字符串类型的字段支持的操作集
}

type LogicProperty struct {
	Name        string        `json:"name" mapstructure:"name"`
	DisplayName string        `json:"display_name" mapstructure:"display_name"`
	Type        string        `json:"type" mapstructure:"type"`
	Comment     string        `json:"comment" mapstructure:"comment"`
	Index       bool          `json:"index" mapstructure:"index"`
	DataSource  *ResourceInfo `json:"data_source" mapstructure:"data_source"`
	Parameters  []Parameter   `json:"parameters" mapstructure:"parameters"`
}

type Field struct {
	Name        string `json:"name" mapstructure:"name"`                                     // 技术名
	Type        string `json:"type,omitempty" mapstructure:"type,omitempty"`                 // 字段类型
	DisplayName string `json:"display_name,omitempty" mapstructure:"display_name,omitempty"` // 显示名
}

type Parameter struct {
	Name        string `json:"name" mapstructure:"name"`
	Type        string `json:"type" mapstructure:"type"`           // 参数类型
	Source      string `json:"source" mapstructure:"source"`       // 来源类型
	Operation   string `json:"operation" mapstructure:"operation"` // 指标属性的操作符。
	ValueFrom   string `json:"value_from" mapstructure:"value_from"`
	Value       string `json:"value" mapstructure:"value"`
	IfSystemGen *bool  `json:"if_system_generate,omitempty" mapstructure:"if_system_generate,omitempty"`
}

type IndexConfig struct {
	KeywordConfig  KeywordConfig  `json:"keyword_config,omitempty" mapstructure:"keyword_config,omitempty"`
	FulltextConfig FulltextConfig `json:"fulltext_config,omitempty" mapstructure:"fulltext_config,omitempty"`
	VectorConfig   VectorConfig   `json:"vector_config,omitempty" mapstructure:"vector_config,omitempty"`
}

type KeywordConfig struct {
	Enabled        bool `json:"enabled" mapstructure:"enabled"`
	IgnoreAboveLen int  `json:"ignore_above_len" mapstructure:"ignore_above_len"`
}

type FulltextConfig struct {
	Enabled  bool   `json:"enabled" mapstructure:"enabled"`
	Analyzer string `json:"analyzer" mapstructure:"analyzer"`
}

type VectorConfig struct {
	Enabled bool   `json:"enabled" mapstructure:"enabled"`
	ModelID string `json:"model_id" mapstructure:"model_id"`

	//Model *SmallModel `json:"-"`
}

type SimpleProperty struct {
	Name        string `json:"name" mapstructure:"name"`
	DisplayName string `json:"display_name" mapstructure:"display_name"`
}

// 对象类的分页查询
type ObjectTypesQueryParams struct {
	PaginationQueryParameters
	NamePattern string
	Tag         string
	Branch      string
	KNID        string
	GroupID     string
}

// 检索的对象列表
type ObjectTypes struct {
	Entries     []*ObjectType `json:"entries"`
	TotalCount  int64         `json:"total_count,omitempty"`
	SearchAfter []any         `json:"search_after,omitempty"`
	OverallMs   int64         `json:"overall_ms"`
}

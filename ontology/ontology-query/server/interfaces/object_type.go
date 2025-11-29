package interfaces

import (
	cond "ontology-query/common/condition"
)

const (

	// 逻辑属性类型
	LOGIC_PROPERTY_TYPE_METRIC   = "metric"
	LOGIC_PROPERTY_TYPE_OPERATOR = "operator"

	// 逻辑属性参数来源类型
	LOGIC_PARAMS_VALUE_FROM_PROP  = "property"
	LOGIC_PARAMS_VALUE_FROM_INPUT = "input"
	LOGIC_PARAMS_VALUE_FROM_CONST = "const"

	// USE_SEARCH_AFTER
	USE_SEARCH_AFTER_TRUE = true
)

// 对象检索请求体
type ObjectQueryBaseOnObjectType struct {
	Condition  map[string]any `json:"condition,omitempty"`
	Properties []string       `json:"properties,omitempty"`
	PageQuery

	KNID            string        `json:"-"`
	ObjectTypeID    string        `json:"-"`
	ActualCondition *cond.CondCfg `json:"-"`
	CommonQueryParameters
}

// type CondCfg struct {
// 	ObjectTypeID string     `json:"object_type_id,omitempty" mapstructure:"object_type_id"` // 行动条件需要标记是哪个行动类的
// 	Field        string     `json:"field,omitempty" mapstructure:"field"`
// 	Operation    string     `json:"operation,omitempty" mapstructure:"operation"`
// 	SubConds     []*CondCfg `json:"sub_conditions,omitempty" mapstructure:"sub_conditions"`
// 	ValueOptCfg  `mapstructure:",squash"`

// 	// NameField *ViewField `json:"-" mapstructure:"-"`
// }

// type ValueOptCfg struct {
// 	ValueFrom string `json:"value_from,omitempty" mapstructure:"value_from"`
// 	Value     any    `json:"value,omitempty" mapstructure:"value"`
// }

type Objects struct {
	ObjectType      *ObjectType      `json:"object_type,omitempty"`
	Datas           []map[string]any `json:"datas"`
	TotalCount      int64            `json:"total_count,omitempty"`
	SearchAfter     []any            `json:"search_after,omitempty"`
	OverallMs       int64            `json:"overall_ms"`
	SearchFromIndex bool             `json:"search_from_index"` // 是否从索引中查询
}

// 指标属性的计算参数
type MetricProperty struct {
	PropertyType         string         `json:"property_type"`
	MappingSourceId      string         `json:"mapping_source_id"`
	HasAnyUnfilledParams bool           `json:"has_any_unfilled_params"`
	Parameters           MetricFilters  `json:"parameters"`
	DynamicParams        map[string]any `json:"dynamic_params"`
}

// 算子属性的计算参数
type OperatorProperty struct {
	PropertyType         string         `json:"property_type"`
	MappingSourceId      string         `json:"mapping_source_id"`
	HasAnyUnfilledParams bool           `json:"has_any_unfilled_params"`
	Parameters           map[string]any `json:"parameters"`
	DynamicParams        map[string]any `json:"dynamic_params"`
}

type OperatorParams struct {
	Name      string `json:"name"`
	Operation string `json:"operation,omitempty"`
	Value     any    `json:"value,omitempty"`
}

type MetricFilters struct {
	Filters []Filter `json:"filters"`
}

type Filter struct {
	Name      string `json:"name"`
	Operation string `json:"operation"`
	Value     any    `json:"value"`
}

type CommonQueryParameters struct {
	IncludeTypeInfo    bool
	IncludeLogicParams bool
	IgnoringStore      bool
}

type ObjectType struct {
	ObjectTypeWithKeyField

	Tags    []string `json:"tags"`
	Comment string   `json:"comment"`
	Icon    string   `json:"icon"`
	Color   string   `json:"color"`

	KNID           string `json:"kn_id"`
	Branch         string `json:"branch,omitempty"`
	BaseBranch     string `json:"base_branch,omitempty"`
	Index          string `json:"index"`
	IndexAvailable bool   `json:"index_available"`

	Detail string `json:"detail"`

	// Creator    AccountInfo `json:"creator"`
	// CreateTime int64       `json:"create_time"`
	// Updater    AccountInfo `json:"updater"`
	// UpdateTime int64       `json:"update_time"`

	IfNameModify bool
	ModuleType   string `json:"module_type"`
	// 操作权限
	Operations []string `json:"operations,omitempty"`
}

type ObjectTypeWithKeyField struct {
	OTID            string              `json:"id"`
	OTName          string              `json:"name"`
	DataSource      *ResourceInfo       `json:"data_source"`
	DataProperties  []cond.DataProperty `json:"data_properties,omitempty"`
	LogicProperties []LogicProperty     `json:"logic_properties,omitempty"`
	PrimaryKeys     []string            `json:"primary_keys"`
	DisplayKey      string              `json:"display_key"`

	// 兼容基于路径的子图的查询的提交请求
	Condition       map[string]any `json:"condition,omitempty"`
	ActualCondition *cond.CondCfg  `json:"-"` // 路径中对各对象类的过滤
	PageQuery                      // 路径中各个对象类的分页信息
}

type LogicProperty struct {
	Name        string       `json:"name"`
	DisplayName string       `json:"display_name"`
	Type        string       `json:"type"`
	Comment     string       `json:"comment"`
	Index       bool         `json:"index"`
	DataSource  ResourceInfo `json:"data_source"`
	Parameters  []Parameter  `json:"parameters"`
}

type Parameter struct {
	Name      string `json:"name"`
	Type      string `json:"type"`   // 参数类型
	Source    string `json:"source"` // 来源类型
	Operation string `json:"operation,omitempty"`
	ValueFrom string `json:"value_from,omitempty"`
	Value     string `json:"value,omitempty"`
}

// 对象属性值请求体
type ObjectPropertyValueQuery struct {
	UniqueIdentities []map[string]any          `json:"unique_identities,omitempty"`
	Properties       []string                  `json:"properties,omitempty"`
	DynamicParams    map[string]map[string]any `json:"dynamic_params"`

	KNID         string `json:"-"`
	ObjectTypeID string `json:"-"`
	CommonQueryParameters
}

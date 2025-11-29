package condition

import (
	"reflect"
)

// 字段范围
const (
	CUSTOM uint8 = iota
	ALL
)

const (
	DESENSITIZE_FIELD_SUFFIX = "_desensitize"

	AllField = "*"

	MetaField_ID = "__id"

	OS_MetaField_ID = "_id"

	ValueFrom_Const = "const"
	ValueFrom_Field = "field"
	ValueFrom_User  = "user"
)

const (
	OperationAnd = "and"
	OperationOr  = "or"

	OperationEq          = "=="
	OperationNotEq       = "!="
	OperationGt          = ">"
	OperationGte         = ">="
	OperationLt          = "<"
	OperationLte         = "<="
	OperationIn          = "in"
	OperationNotIn       = "not_in"
	OperationLike        = "like"
	OperationNotLike     = "not_like"
	OperationContain     = "contain"
	OperationNotContain  = "not_contain"
	OperationRange       = "range"
	OperationOutRange    = "out_range"
	OperationExist       = "exist"
	OperationNotExist    = "not_exist"
	OperationEmpty       = "empty"
	OperationNotEmpty    = "not_empty"
	OperationRegex       = "regex"
	OperationMatch       = "match"
	OperationMatchPhrase = "match_phrase"
	OperationKNN         = "knn"
	OperationKNNVector   = "knn_vector"
	OperationPrefix      = "prefix"
	OperationNotPrefix   = "not_prefix"
	OperationNull        = "null"
	OperationNotNull     = "not_null"
	OperationTrue        = "true"
	OperationFalse       = "false"
	OperationBefore      = "before"
	OperationCurrent     = "current"
	OperationBetween     = "between"
)

var (
	OperationMap = map[string]struct{}{
		"=":                  {}, // 兼容filter中定义的等于是 =
		OperationAnd:         {},
		OperationOr:          {},
		OperationEq:          {},
		OperationNotEq:       {},
		OperationGt:          {},
		OperationGte:         {},
		OperationLt:          {},
		OperationLte:         {},
		OperationIn:          {},
		OperationNotIn:       {},
		OperationLike:        {},
		OperationNotLike:     {},
		OperationContain:     {},
		OperationNotContain:  {},
		OperationRange:       {},
		OperationOutRange:    {},
		OperationExist:       {},
		OperationNotExist:    {},
		OperationEmpty:       {},
		OperationNotEmpty:    {},
		OperationRegex:       {},
		OperationMatch:       {},
		OperationMatchPhrase: {},
		OperationPrefix:      {},
		OperationNotPrefix:   {},
		OperationNull:        {},
		OperationNotNull:     {},
		OperationTrue:        {},
		OperationFalse:       {},
		OperationBefore:      {},
		OperationCurrent:     {},
		OperationBetween:     {},
		OperationKNN:         {},
	}

	NotRequiredValueOperationMap = map[string]struct{}{
		OperationExist:    {},
		OperationNotExist: {},
		OperationEmpty:    {},
		OperationNotEmpty: {},
		OperationNull:     {},
		OperationNotNull:  {},
		OperationTrue:     {},
		OperationFalse:    {},
	}
)

type VectorResp struct {
	Object string    `json:"object"`
	Vector []float32 `json:"embedding"`
	Index  int       `json:"index"`
}

type Filter struct {
	Name      string `json:"name"`
	Operation string `json:"operation"`
	Value     any    `json:"value"`
}

type CondCfg struct {
	ObjectTypeID string     `json:"object_type_id,omitempty" mapstructure:"object_type_id"` // 行动条件需要标记是哪个行动类的
	Name         string     `json:"field,omitempty" mapstructure:"field"`
	Operation    string     `json:"operation,omitempty" mapstructure:"operation"`
	SubConds     []*CondCfg `json:"sub_conditions,omitempty" mapstructure:"sub_conditions"`
	ValueOptCfg  `mapstructure:",squash"`

	ReaminCfg map[string]any `mapstructure:",remain"`

	NameField *DataProperty `json:"-" mapstructure:"-"`
}

type DataProperty struct {
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
	Type        string `json:"type"`
	Comment     string `json:"comment"`

	MappedField Field `json:"mapped_field"`

	IndexConfig         *IndexConfig `json:"index_config,omitempty"`
	ConditionOperations []string     `json:"condition_operations,omitempty"` // 字符串类型的字段支持的操作集
}

type Field struct {
	Name        string `json:"name"` // 技术名
	Type        string `json:"type"`
	DisplayName string `json:"display_name"` // 显示名
}

type IndexConfig struct {
	KeywordConfig  KeywordConfig  `json:"keyword_config,omitempty"`
	FulltextConfig FulltextConfig `json:"fulltext_config,omitempty"`
	VectorConfig   VectorConfig   `json:"vector_config,omitempty"`
}

type KeywordConfig struct {
	Enabled        bool `json:"enabled"`
	IgnoreAboveLen int  `json:"ignore_above_len"`
}

type FulltextConfig struct {
	Enabled  bool   `json:"enabled"`
	Analyzer string `json:"analyzer"`
}

type VectorConfig struct {
	Enabled bool   `json:"enabled"`
	ModelID string `json:"model_id"`
}

// type ViewField struct {
// 	Name         string `json:"name"`
// 	Type         string `json:"type"`
// 	Comment      string `json:"comment"`
// 	DisplayName  string `json:"display_name"`
// 	OriginalName string `json:"original_name"`

// 	Path []string `json:"-"`
// }

type ValueOptCfg struct {
	ValueFrom string `json:"value_from,omitempty" mapstructure:"value_from"`
	Value     any    `json:"value,omitempty" mapstructure:"value"`
}

// func (field *ViewField) InitFieldPath() {
// 	if len(field.Path) == 0 {
// 		field.Path = strings.Split(field.Name, ".")
// 	}
// }

func IsSlice(i any) bool {
	kind := reflect.ValueOf(i).Kind()
	return kind == reflect.Slice || kind == reflect.Array
}

func IsSameType(arr []any) bool {
	if len(arr) == 0 {
		return true
	}

	firstType := reflect.TypeOf(arr[0])
	for _, v := range arr {
		if reflect.TypeOf(v) != firstType {
			return false
		}
	}

	return true
}

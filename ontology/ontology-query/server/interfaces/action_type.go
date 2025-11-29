package interfaces

import cond "ontology-query/common/condition"

// 行动查询请求体
type ActionQuery struct {
	UniqueIdentities []map[string]any `json:"unique_identities,omitempty"`

	KNID         string `json:"-"`
	ActionTypeID string `json:"-"`
	CommonQueryParameters
}

// 行动查询返回体
type Actions struct {
	ActionType   *ActionType   `json:"action_type,omitempty"`
	ActionSource ToolSource    `json:"action_source"`
	Actions      []ActionParam `json:"actions"`
	TotalCount   int           `json:"total_count,omitempty"`
	OverallMs    int64         `json:"overall_ms"`
}

// 实例化后的行动参数
type ActionParam struct {
	Parameters    map[string]any `json:"parameters"`     // 填入了实参的参数
	DynamicParams map[string]any `json:"dynamic_params"` // 动态参数map
}

type ActionType struct {
	ATID         string        `json:"id"`
	ATName       string        `json:"name"`
	ActionType   string        `json:"action_type"`
	ObjectTypeID string        `json:"object_type_id"`
	Condition    cond.CondCfg  `json:"condition"`
	Affect       *ActionAffect `json:"affect"`
	ActionSource ToolSource    `json:"action_source"`
	Parameters   []Parameter   `json:"parameters"`
	Schedule     Schedule      `json:"schedule"`
}

type ActionAffect struct {
	ObjectTypeID string `json:"object_type_id,omitempty"`
	Comment      string `json:"comment,omitempty"`
}

type ToolSource struct {
	Type   string `json:"type"`
	BoxID  string `json:"box_id"`
	ToolID string `json:"tool_id"`
}

type Schedule struct {
	Type       string `json:"type"`
	Expression string `json:"expression"`
}

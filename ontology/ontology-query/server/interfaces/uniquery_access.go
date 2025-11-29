package interfaces

import (
	"context"
	cond "ontology-query/common/condition"
)

type ViewQuery struct {
	Filters        *cond.CondCfg `json:"filters"`
	NeedTotal      bool          `json:"need_total"`
	Limit          int           `json:"limit"`
	UseSearchAfter bool          `json:"use_search_after"`
	Sort           []*SortParams `json:"sort"`
	SearchAfterParams
}

type SortParams struct {
	Field     string `json:"field"`
	Direction string `json:"direction"`
}

type SearchAfterParams struct {
	SearchAfter []any `json:"search_after"`
	// PitID        string `json:"pit_id"`
	// PitKeepAlive string `json:"pit_keep_alive"`
}

type ViewData struct {
	Datas       []map[string]any `json:"entries"`
	TotalCount  int64            `json:"total_count"`
	SearchAfter []any            `json:"search_after,omitempty"`
}

type MetricQuery struct {
	Start          *int64   `json:"start"`
	End            *int64   `json:"end"`
	StepStr        *string  `json:"step"`
	IsInstantQuery bool     `json:"instant"`
	Filters        []Filter `json:"filters"`
}

type MetricData struct {
	Model      MetricModel `json:"model,omitempty"`
	Datas      []Data      `json:"datas"`
	Step       string      `json:"step"`
	IsVariable bool        `json:"is_variable"`
	IsCalendar bool        `json:"is_calendar"`
}

type Data struct {
	Labels map[string]string `json:"labels"`
	Times  []interface{}     `json:"times"`
	Values []interface{}     `json:"values"`
}

type MetricModel struct {
	UnitType string `json:"unit_type"`
	Unit     string `json:"unit"`
}

//go:generate mockgen -source ../interfaces/metric_model_access.go -destination ../interfaces/mock/mock_metric_model_access.go
type UniqueryAccess interface {
	GetViewDataByID(ctx context.Context, viewID string, viewRequest ViewQuery) (ViewData, error)
	GetMetricDataByID(ctx context.Context, metricID string, metricRequest MetricQuery) (MetricData, error)
}

package interfaces

import (
	"context"
	"ontology-manager/common/condition"
)

const (
	VIEW_QueryType_DSL = "DSL"
	VIEW_QueryType_SQL = "SQL"
)

var (
	SQL_CONDITION_OPS = []string{
		condition.OperationEq,
		condition.OperationNotEq,
		condition.OperationGt,
		condition.OperationGte,
		condition.OperationLt,
		condition.OperationLte,
		condition.OperationIn,
		condition.OperationNotIn,
		condition.OperationLike,
		condition.OperationNotLike,
		condition.OperationRange,
		condition.OperationOutRange,
		condition.OperationExist,
		condition.OperationNotExist,
	}

	DSL_CONDITION_OPS = []string{
		condition.OperationEq,
		condition.OperationNotEq,
		condition.OperationGt,
		condition.OperationGte,
		condition.OperationLt,
		condition.OperationLte,
		condition.OperationIn,
		condition.OperationNotIn,
		condition.OperationLike,
		condition.OperationNotLike,
		condition.OperationRange,
		condition.OperationOutRange,
		condition.OperationExist,
		condition.OperationNotExist,
		condition.OperationRegex,
		condition.OperationMatch,
		condition.OperationMatchPhrase,
		condition.OperationKNN,
	}

	DSL_KEYWORD_OPS = []string{
		condition.OperationEq,
		condition.OperationNotEq,
		condition.OperationIn,
		condition.OperationNotIn,
	}

	DSL_TEXT_OPS = []string{
		condition.OperationEq,
		condition.OperationNotEq,
		condition.OperationMatch,
	}

	SQL_STRING_OPS = []string{
		condition.OperationEq,
		condition.OperationNotEq,
		condition.OperationLike,
		condition.OperationNotLike,
		condition.OperationIn,
		condition.OperationNotIn,
	}

	// 配置了对象索引的操作符集合
	INDEX_CONDITION_OPS = []string{
		condition.OperationEq,
		condition.OperationNotEq,
		condition.OperationGt,
		condition.OperationGte,
		condition.OperationLt,
		condition.OperationLte,
		condition.OperationIn,
		condition.OperationNotIn,
		// condition.OperationLike,
		// condition.OperationNotLike,
		condition.OperationRange,
		condition.OperationOutRange,
		condition.OperationExist,
		condition.OperationNotExist,
		condition.OperationRegex,
		condition.OperationMatch,
		condition.OperationMatchPhrase,
		condition.OperationKNN,
	}
)

// 指标模型结构体
type MetricModel struct {
	ModelID   string `json:"id"`
	ModelName string `json:"name"`
	GroupID   string `json:"group_id"`
	GroupName string `json:"group_name"`
}

//go:generate mockgen -source ../interfaces/data_model_access.go -destination ../interfaces/mock/mock_data_model_access.go
type DataModelAccess interface {
	GetMetricModelByID(ctx context.Context, id string) (*MetricModel, error)
}

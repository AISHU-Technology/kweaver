// Package models 提供数据库连接和访问
// - 描述：图数据库连接
// - 作者：张坤 (zhang.kun@aishu.cn)
// - 时间：2020-2-29
package orient

import (
	"graph-engine/logger"
	"graph-engine/utils"
)

// Operator 图数据库操作对象
type GraphOperator interface {
	Result(string) ([]byte, error)
	SetParam(interface{})
}

// GetGraphData 获取数据
func GetGraphData(o GraphOperator, sql string) ([]byte, error) {
	logger.Info(sql)
	return o.Result(sql)
}

// SchemaInterface Schema 的操作对象
type SchemaInterface interface {
	GetSchema(conf *utils.KGConf) error
}

// SearchInterface 查询图数据库 的操作对象
type SearchInterface interface {
	SearchV(conf *utils.KGConf, class, q string) error
}

// GetInterface 获取一个节点
type GetInterface interface {
	GetV(conf *utils.KGConf, class, rid string) error
}

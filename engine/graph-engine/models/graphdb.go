package models

import "graph-engine/utils"

// SchemaInterface Schema 的操作对象
type SchemaInterface interface {
	GetSchema(conf *utils.KGConf) error
}

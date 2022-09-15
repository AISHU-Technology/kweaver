package models

import (
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
)

func GetKGSchema(conf *utils.KGConf) (SchemaInterface, error) {
	switch conf.Type {
	case "orientdb":
		var sc orient.Schema
		err := sc.GetSchema(conf)
		if err != nil {
			return nil, err
		}
		return &sc, nil
	case "nebula":
		var sc nebula.Schema
		err := sc.GetSchema(conf)
		if err != nil {
			return nil, err
		}
		return &sc, nil
	default:
		return nil, nil
	}
}

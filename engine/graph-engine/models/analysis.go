package models

import (
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
)

func Analysis(conf *utils.KGConf, rid string) (interface{}, error) {
	switch conf.Type {
	case "orientdb":
		var anaOrient = orient.AnalysisRes{}

		err := anaOrient.Analysis(conf, rid)
		if err != nil {
			return nil, err
		}

		return anaOrient, nil
	case "nebula":
		var anaNebula = nebula.AnalysisRes{}

		err := anaNebula.Analysis(conf, rid)
		if err != nil {
			return nil, err
		}

		return anaNebula, nil
	default:
		return nil, nil
	}
}

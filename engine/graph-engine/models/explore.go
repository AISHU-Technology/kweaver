package models

import (
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
)

func SearchVWithFilter(conf *utils.KGConf, class, q string, page int32, size int32, queryAll bool, searchFilterArgs *utils.SearchFilterArgs) (interface{}, error) {
	switch conf.Type {
	case "orientdb":
		var resultSet orient.VSearchRes

		err := resultSet.SearchVWithFilter(conf, class, q, page, size, queryAll, searchFilterArgs)
		if err != nil {
			return nil, err
		}

		return &resultSet, nil
	case "nebula":
		var resultSet nebula.VSearchRes

		err := resultSet.SearchVWithFilter(conf, class, q, page, size, queryAll, searchFilterArgs)
		if err != nil {
			return nil, err
		}

		return &resultSet, nil

	default:
		return nil, nil
	}
}

func GetProperties(conf *utils.KGConf, class string) (interface{}, error) {
	switch conf.Type {
	case "orientdb":
		properties, err := orient.GetProperties(conf, class)
		if err != nil {
			return nil, err
		}

		return properties, nil
	case "nebula":
		properties, err := nebula.GetProperties(conf, class)
		if err != nil {
			return nil, err
		}

		return properties, nil
	default:
		return nil, nil
	}
}

func SearchE(conf *utils.KGConf, rid string) (interface{}, error) {
	switch conf.Type {
	case "orientdb":
		var res orient.EdgeRes

		err := res.SearchE(conf, rid)
		if err != nil {
			return nil, err
		}

		return res, nil
	case "nebula":
		var res nebula.EdgeRes

		err := res.SearchE(conf, rid)
		if err != nil {
			return nil, err
		}

		return res, nil

	default:
		return nil, nil
	}
}

func ExpandE(conf *utils.KGConf, eclass string, vrid string, inout string, page int32, size int32) (interface{}, error) {
	switch conf.Type {
	case "orientdb":
		var eRes orient.ESearchRes

		err := eRes.GetE(conf, eclass, vrid, inout, page, size)
		if err != nil {
			return nil, err
		}

		return eRes, nil
	case "nebula":
		var eRes nebula.ESearchRes

		err := eRes.ExpandE(conf, eclass, vrid, inout, page, size)
		if err != nil {
			return nil, err
		}

		return eRes, nil
	default:
		return nil, nil
	}

}

func ExpandV(conf *utils.KGConf, eclass string, vrid string, inout string, name string, page int32, size int32) (interface{}, error) {
	switch conf.Type {
	case "orientdb":
		var eRes orient.ExpandVRes

		err := eRes.ExpandV(conf, eclass, vrid, inout, name, page, size)
		if err != nil {
			return nil, err
		}

		return eRes, nil
	case "nebula":
		var eRes nebula.ExpandVRes

		err := eRes.ExpandV(conf, eclass, vrid, inout, name, page, size)
		if err != nil {
			return nil, err
		}

		return eRes, nil
	default:
		return nil, nil
	}

}

func ExploreRelation(conf *utils.KGConf, rids []string) (interface{}, error) {
	switch conf.Type {
	case "orientdb":
		var res orient.ExRelation
		err := res.ExploreRelation(conf, rids)
		if err != nil {
			return nil, err
		}

		return res, nil
	case "nebula":
		var res nebula.ExRelation
		err := res.ExploreRelation(conf, rids)
		if err != nil {
			return nil, err
		}

		return res, nil
	default:
		return nil, nil
	}
}

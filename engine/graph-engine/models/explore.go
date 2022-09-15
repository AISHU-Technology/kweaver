package models

import (
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"sort"
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

func ExplorePath(conf *utils.KGConf, startRid, endRid, direction string, shortest int) (interface{}, error) {
	switch conf.Type {
	case "orientdb":
		r, err := orient.ExplorePath(conf, startRid, endRid, direction)
		if r == nil {
			return nil, err
		}
		paths := r.([]*orient.PathInfo)
		if len(paths) <= 0 {
			return nil, nil
		}
		sort.Slice(paths, func(i, j int) bool {
			return len(paths[i].Vertices) < len(paths[j].Vertices)
		})
		shortestLen := len(paths[0].Vertices)
		if shortest == 1 {
			for i, path := range paths {
				if len(path.Vertices) > shortestLen {
					return paths[:i], nil
				}
			}
		}
		return r, nil
	case "nebula":
		r, err := nebula.ExplorePath(conf, startRid, endRid, direction)
		if r == nil {
			return nil, err
		}
		paths := r.([]*nebula.PathInfo)
		if len(paths) <= 0 {
			return nil, nil
		}
		sort.Slice(paths, func(i, j int) bool {
			return len(paths[i].Vertices) < len(paths[j].Vertices)
		})
		shortestLen := len(paths[0].Vertices)
		if shortest == 1 {
			for i, path := range paths {
				if len(path.Vertices) > shortestLen {
					return paths[:i], nil
				}
			}
		}
		return r, nil
	default:
		return nil, nil
	}
}

func PathDetail(conf *utils.KGConf, pathsInfo []map[string][]string) (interface{}, error) {
	switch conf.Type {
	case "orientdb":
		r, err := orient.PathDetail(conf, pathsInfo)
		if err != nil {
			return nil, err
		}
		return r, nil
	case "nebula":
		r, err := nebula.PathDetail(conf, pathsInfo)
		if err != nil {
			return nil, err
		}
		return r, nil
	default:
		return nil, nil
	}
}

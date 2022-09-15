package nebula

import (
	"graph-engine/utils"
	"strconv"
)

func GetKnowledgeCount(conf *utils.KGConf) (uint64, uint64, uint64, uint64, uint64, error) {
	var (
		vc  uint64 // 实体总量
		ec  uint64 // 关系总量
		vpc uint64 // 实体属性总量
		epc uint64 // 关系属性总量
		pc  uint64 // 属性总量
	)

	var sc Schema
	err := sc.GetSchema(conf)
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	vc = sc.VCount
	ec = sc.ECount

	for _, v := range sc.V {
		vpc = vpc + uint64(v.Records)*uint64(len(v.Properties))
	}

	for _, e := range sc.E {
		epc = epc + uint64(e.Records)*uint64(len(e.Properties)) // nebula无in和out属性，不同于orientdb
	}

	pc = vpc + epc

	return vc, ec, vpc, epc, pc, nil
}

func GetKnowledgeVCountAndECount(conf *utils.KGConf) (uint64, uint64, error) {
	var (
		vc uint64 // 实体总量
		ec uint64 // 关系总量
	)

	var sc Schema
	// records
	stats, err := sc.GetRecordsCount(conf)
	if err != nil {
		return vc, ec, err
	}
	for _, stat := range stats {
		if stat.Type == "Space" && stat.Name == "vertices" {
			vc, _ = strconv.ParseUint(stat.Count, 0, 64)
		}
		if stat.Type == "Space" && stat.Name == "edges" {
			ec, _ = strconv.ParseUint(stat.Count, 0, 64)
		}
	}

	return vc, ec, nil
}

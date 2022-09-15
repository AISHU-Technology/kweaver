package nebula

import (
	"fmt"
	"graph-engine/utils"
)

func AdcSearchGetSizeByRid(conf utils.KGConf, rid string) (err error, _bool bool) {
	var nebula Nebula

	gqlExpand := "MATCH (v)-[e]-(v2) where id(v) in ['%s'] RETURN count(e);"
	gqlExpand = fmt.Sprintf(gqlExpand, rid)
	eCount, err := nebula.Client(&conf, gqlExpand)
	if err != nil {
		return err, false
	}
	rowValue, _ := eCount.GetRowValuesByIndex(0)
	value, _ := rowValue.GetValueByIndex(0)
	ecount, _ := value.AsInt()
	if int(ecount) != 0 {
		return nil, true
	}

	return nil, false
}

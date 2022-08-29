package orient

import (
	"fmt"
	"graph-engine/utils"
)

func AdcSearchGetSizeByRid(conf utils.KGConf, rid string) (err error, _bool bool) {
	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/command/" + conf.DB + "/sql",
		Method: "command",
	}
	var queryRes QueryRes

	sql := "select out().size() as out, in().size() as in from %s"
	sql = fmt.Sprintf(sql, rid)

	err = queryRes.ParseOrientResponse(operator, sql)
	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err), false
	}

	for _, c := range queryRes.Res.([]interface{}) {
		qMap := c.(map[string]interface{})
		if qMap["in"] == float64(0) && qMap["out"] == float64(0) {
			return nil, false
		}
	}
	return nil, true
}

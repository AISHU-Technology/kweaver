package dao

import (
	"fmt"
	"graph-engine/utils"
	"strings"
)

func GetKGIDByKGConfID(kgConfIDArray []string) (kgids []string, err error) {
	engine := utils.GetConnect()

	sql := "select `id` as kg_id, `KG_config_id` as kg_conf_id from knowledge_graph where KG_config_id in (%s)"

	confidStr := strings.Join(kgConfIDArray, ",")
	sql = fmt.Sprintf(sql, confidStr)

	kgConfID, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer kgConfID.Close()

	for kgConfID.Next() {
		var (
			kg_id      string
			kg_conf_id string
		)

		err = kgConfID.Scan(&kg_id, &kg_conf_id)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		kgids = append(kgids, kg_id)
	}

	return kgids, nil
}

func GetKGConfIDByKGID(kgid int) (kgconfid int, err error) {
	engine := utils.GetConnect()

	sql := "select `id` as kg_id, `KG_config_id` as kg_conf_id from knowledge_graph where id in (%d)"
	sql = fmt.Sprintf(sql, kgid)

	kgConfID, err := engine.Query(sql)
	if err != nil {
		return 0, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer kgConfID.Close()

	for kgConfID.Next() {
		var (
			kg_id      int
			kg_conf_id int
		)

		err = kgConfID.Scan(&kg_id, &kg_conf_id)
		if err != nil {
			return 0, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		return kg_conf_id, nil
	}
	return 0, nil
}

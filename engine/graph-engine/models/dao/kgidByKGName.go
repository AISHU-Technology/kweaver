package dao

import (
	sql2 "database/sql"
	"fmt"
	"graph-engine/utils"
)

func GetKGIDByKGName(kgName string) (kgid string, err error) {
	engine := utils.GetConnect()

	sql := "select `id` as kg_id from knowledge_graph where KDB_name='%s'"

	// 转义
	kgName, err = utils.EscapeMysql(kgName)
	if err != nil {
		return "", utils.ErrInfo(utils.ErrInternalErr, err)
	}
	sql = fmt.Sprintf(sql, kgName)

	kgID, err := engine.Query(sql)
	if err != nil {
		return "", utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer kgID.Close()

	for kgID.Next() {
		var id sql2.NullString

		err = kgID.Scan(&id)
		if err != nil {
			return "", utils.ErrInfo(utils.ErrInternalErr, err)
		}

		kgid = id.String
	}

	return kgid, nil
}

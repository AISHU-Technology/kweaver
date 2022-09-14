package utils

import (
	"fmt"
	"graph-engine/logger"
)

/*
	获取kg 相关信息
*/
type KGInfo struct {
	Status string
}

func GetKGInfo(kgId int) ([]KGInfo, error) {
	var r []KGInfo

	eninge := GetConnect()

	// 关联 KG，KDB，graph_task_table, graph_config_table
	sql := "select task_status from graph_task_table where graph_id=%d"
	sql = fmt.Sprintf(sql, kgId)

	logger.Info(sql)

	kgConfig, err := eninge.Query(sql)
	if err != nil {
		return nil, err
	}

	defer kgConfig.Close()

	for kgConfig.Next() {
		var (
			taskStatus string
		)
		err := kgConfig.Scan(&taskStatus)
		if err != nil {
			return nil, err
		}
		kglist := KGInfo{
			Status: taskStatus,
		}

		r = append(r, kglist)
	}
	return r, nil
}

// UpdateSynKcTaskInfo 更新同步任务状态
func UpdateSynKcTaskInfo(kgId int, status string) {
	eninge := GetConnect()
	sql := "update graph_task_table set kc_syn_status=? where graph_id=?"
	res, err := eninge.Exec(sql, status, kgId)
	if err != nil {
		logger.Error("exec failed, ", err)
		return
	}
	row, err := res.RowsAffected()
	if err != nil {
		logger.Error("rows failed, ", err)
	}
	logger.Info("update succ:", row)

}

package dao

import (
	"graph-engine/logger"
	"graph-engine/utils"
)

type SearchKGs struct {
	KGID         int
	KGName       string
	KGConfigID   int
	KGDataVolume int
	UpdateTime   string
}

func SearchKGList() ([]SearchKGs, error) {
	var res []SearchKGs

	eninge := utils.GetConnect()

	sql := "select knowledge_graph.id as KG_id, `KG_name`, `KG_config_id`, `kg_data_volume`, knowledge_graph.update_time " +
		"from knowledge_graph " +
		"LEFT JOIN graph_config_table ON knowledge_graph.KG_config_id = graph_config_table.id "

	//sql = fmt.Sprintf(sql, configids)
	//logger.Info(sql)

	kgs, err := eninge.Query(sql)
	if err != nil {
		logger.Info(sql)
		logger.Info(err)
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer kgs.Close()

	for kgs.Next() {
		kg := SearchKGs{
			KGID:         0,
			KGName:       "",
			KGConfigID:   0,
			KGDataVolume: 0,
			UpdateTime:   "",
		}
		err := kgs.Scan(&kg.KGID, &kg.KGName, &kg.KGConfigID, &kg.KGDataVolume, &kg.UpdateTime)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		res = append(res, kg)
	}
	return res, nil
}

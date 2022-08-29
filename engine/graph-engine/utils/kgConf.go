package utils

import (
	sql2 "database/sql"
	"fmt"
	"graph-engine/logger"
	"regexp"
	"strconv"
	"strings"
)

// KGS KG 配置
var KGS KGList

type KGConf struct {
	ID       string
	Type     string
	Name     string
	User     string
	Pwd      string
	URL      string
	DB       string
	Version  int
	KGConfID string
	//CreateUser       string
	//CreateEmail      string
	CreateTime string
	//UpdateUser       string
	//UpdateEmail      string
	UpdateTime       string
	Status           string
	TaskStatus       string
	TriggerType      string
	RabbitmqDs       int32
	ConfigStatus     string
	HLStart          string
	HLEnd            string
	KGDesc           string
	EffectiveStorage bool
	FulltextID       string
}

// KGList 知识图谱列表
type KGList struct {
	List []KGConf
}

// 数据库获取配置
func GetKGConf() ([]KGConf, error) {
	var r []KGConf

	eninge := GetConnect()

	sql := "select KG_id, graph_db.ip as KDB_ip, `KDB_name`, `KG_config_id`, `KG_name`, `status`, `task_status`, `config_status`, " +
		"graph_baseInfo, `hlStart`, `hlEnd`, create_time,`update_time`, graph_db.`port`, " +
		"graph_db.db_user, graph_db.`db_ps`, graph_db.version, graph_db.type, graph_db.fulltext_id from (select knowledge_graph.id as KG_id, " +
		"`KDB_name`, `KG_config_id`, `KG_name`, `status`, graph_task_table.task_status as `task_status`, " +
		"graph_config_table.graph_status as `config_status`, graph_config_table.graph_baseInfo, graph_config_table.graph_db_id, " +
		"`hlStart`, `hlEnd`, knowledge_graph.`create_time` as create_time, " +
		"knowledge_graph.`update_time` from knowledge_graph " +
		"LEFT JOIN graph_task_table on knowledge_graph.KG_config_id = graph_task_table.graph_id " +
		"LEFT JOIN graph_config_table on knowledge_graph.KG_config_id = graph_config_table.id) as t " +
		"LEFT JOIN graph_db ON graph_db_id = graph_db.id ORDER BY update_time DESC, KG_name"

	//logger.Info(sql)

	kgConfig, err := eninge.Query(sql)
	if err != nil {
		logger.Info(sql)
		logger.Info(err)
		return nil, err
	}

	defer kgConfig.Close()

	for kgConfig.Next() {
		var (
			id             string
			KDB_ip         sql2.NullString
			KDB_name       string
			KG_config_id   string
			KG_name        string
			status         sql2.NullString
			task_status    sql2.NullString
			config_status  sql2.NullString
			graph_baseInfo sql2.NullString
			hlStart        string
			hlEnd          string
			//create_user    sql2.NullString
			create_time sql2.NullString
			//update_user    sql2.NullString
			update_time sql2.NullString
			port        sql2.NullString
			user        sql2.NullString
			password    sql2.NullString
			version     sql2.NullString
			dbtype      sql2.NullString
			fulltextID  sql2.NullString
		)
		err := kgConfig.Scan(&id, &KDB_ip, &KDB_name, &KG_config_id, &KG_name, &status, &task_status, &config_status,
			&graph_baseInfo, &hlStart, &hlEnd, &create_time, &update_time, &port, &user,
			&password, &version, &dbtype, &fulltextID)
		if err != nil {
			logger.Info(err)
			return nil, err
		}

		KDB_ip.String = strings.Split(KDB_ip.String, ";")[0]
		port.String = strings.Split(port.String, ";")[0]

		kglist := KGConf{
			ID:           id,
			Type:         dbtype.String,
			Name:         KG_name,
			User:         user.String,
			Pwd:          password.String,
			URL:          `http://` + KDB_ip.String + `:` + port.String,
			DB:           KDB_name,
			Status:       status.String,
			TaskStatus:   task_status.String,
			ConfigStatus: config_status.String,
			KGConfID:     KG_config_id,
			//CreateUser:   create_user.String,
			CreateTime: create_time.String,
			//UpdateUser:   update_user.String,
			UpdateTime: update_time.String,
			HLStart:    hlStart,
			HLEnd:      hlEnd,
			FulltextID: fulltextID.String,
		}

		if graph_baseInfo.String != "" {
			reg := regexp.MustCompile("'graph_des': '([\\s\\S]*)',") // 截取图谱描述
			graphDes := reg.FindStringSubmatch(graph_baseInfo.String)
			kglist.KGDesc = graphDes[len(graphDes)-1]
		} else {
			kglist.KGDesc = graph_baseInfo.String
		}

		kglist.Version, _ = strconv.Atoi(version.String)

		switch kglist.Status {
		case "stop":
			kglist.Status = "edit"
		}

		r = append(r, kglist)
	}
	//logger.Info("get kgconf success")
	return r, nil
}

// 数据库获取配置
func GetKGConfByKGID(kgid string) (KGConf, error) {
	var r KGConf

	eninge := GetConnect()

	sql := "select KG_id, graph_db.ip as KDB_ip, KDB_name, KG_name, `type`, `port`, db_user, db_ps from " +
		"(select knowledge_graph.id as KG_id, `KDB_ip`, `KDB_name`, `KG_name`, graph_db_id from knowledge_graph " +
		"INNER JOIN graph_config_table ON graph_config_table.id = knowledge_graph.KG_config_id) as t " +
		"INNER JOIN graph_db ON graph_db.id = graph_db_id where KG_id=%s"
	sql = fmt.Sprintf(sql, kgid)

	//logger.Info(sql)

	kgConfig, err := eninge.Query(sql)
	if err != nil {
		logger.Info(sql)
		logger.Info(err)
		return r, err
	}

	defer kgConfig.Close()

	for kgConfig.Next() {
		var (
			id       string
			KDB_ip   sql2.NullString
			KDB_name string
			KG_name  string
			db_type  sql2.NullString
			port     sql2.NullString
			user     sql2.NullString
			password sql2.NullString
		)
		err := kgConfig.Scan(&id, &KDB_ip, &KDB_name, &KG_name, &db_type, &port, &user, &password)
		if err != nil {
			logger.Info(err)
			return r, err
		}
		KDB_ip.String = strings.Split(KDB_ip.String, ";")[0]
		port.String = strings.Split(port.String, ";")[0]

		kg := KGConf{
			ID:   id,
			Name: KG_name,
			User: user.String,
			Pwd:  password.String,
			URL:  `http://` + KDB_ip.String + `:` + port.String,
			DB:   KDB_name,
			Type: db_type.String,
		}
		r = kg
	}
	return r, nil
}

// 数据库获取配置
func GetKGConfByConfigID() ([]KGConf, error) {
	var r []KGConf

	eninge := GetConnect()

	sql := "select knowledge_graph.id as KG_id, graph_db.ip as `KDB_ip`, `KDB_name`, `KG_config_id`, `KG_name`, " +
		"knowledge_graph.`status`, graph_task_table.task_status as `task_status`, graph_task_table.trigger_type, " +
		"`rabbitmq_ds`, graph_config_table.graph_status as `config_status`, graph_config_table.graph_baseInfo, graph_db_id, " +
		"`hlStart`, `hlEnd`, knowledge_graph.`create_time` as create_time, knowledge_graph.`update_time`, `port`, `db_user`, `db_ps`, " +
		"`version`, graph_db.`type`, graph_db.fulltext_id from knowledge_graph " +
		"LEFT JOIN graph_task_table ON knowledge_graph.KG_config_id = graph_task_table.graph_id " +
		"LEFT JOIN graph_config_table ON knowledge_graph.KG_config_id = graph_config_table.id " +
		"LEFT JOIN graph_db ON graph_db.id = graph_config_table.graph_db_id " +
		"ORDER BY update_time DESC, KG_name"

	kgConfig, err := eninge.Query(sql)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	defer kgConfig.Close()

	for kgConfig.Next() {
		var (
			id             string
			KDB_ip         sql2.NullString
			KDB_name       string
			KG_config_id   string
			KG_name        string
			status         sql2.NullString
			task_status    sql2.NullString
			trigger_type   sql2.NullString
			rabbitmq_ds    sql2.NullInt32
			config_status  sql2.NullString
			graph_baseInfo sql2.NullString
			graph_db_id    sql2.NullInt32
			hlStart        string
			hlEnd          string
			create_time    sql2.NullString
			update_time    sql2.NullString
			port           sql2.NullString
			user           sql2.NullString
			password       sql2.NullString
			version        sql2.NullString
			dbtype         sql2.NullString
			fulltextID     sql2.NullString
		)
		err := kgConfig.Scan(&id, &KDB_ip, &KDB_name, &KG_config_id, &KG_name, &status, &task_status, &trigger_type, &rabbitmq_ds,
			&config_status, &graph_baseInfo, &graph_db_id, &hlStart, &hlEnd, &create_time, &update_time, &port, &user, &password, &version, &dbtype,
			&fulltextID)
		if err != nil {
			logger.Info(err)
			return nil, err
		}
		KDB_ip.String = strings.Split(KDB_ip.String, ";")[0]
		port.String = strings.Split(port.String, ";")[0]

		kglist := KGConf{
			ID:           id,
			Type:         dbtype.String,
			Name:         KG_name,
			User:         user.String,
			Pwd:          password.String,
			URL:          `http://` + KDB_ip.String + `:` + port.String,
			DB:           KDB_name,
			Status:       status.String,
			TaskStatus:   task_status.String,
			TriggerType:  trigger_type.String,
			RabbitmqDs:   rabbitmq_ds.Int32,
			ConfigStatus: config_status.String,
			KGConfID:     KG_config_id,
			CreateTime:   create_time.String,
			UpdateTime:   update_time.String,
			HLStart:      hlStart,
			HLEnd:        hlEnd,
			FulltextID:   fulltextID.String,
		}

		sql = fmt.Sprintf("select * from graph_db where id in (%d)", graph_db_id.Int32)
		graphDB, err := eninge.Query(sql)
		if err != nil {
			logger.Error(err)
			return nil, err
		}

		defer graphDB.Close()

		if graphDB.Next() {
			kglist.EffectiveStorage = true
		}

		if graph_baseInfo.String != "" {
			reg := regexp.MustCompile("'graph_des': '([\\s\\S]*)',") // 截取图谱描述
			graphDes := reg.FindStringSubmatch(graph_baseInfo.String)
			kglist.KGDesc = graphDes[len(graphDes)-1]
		} else {
			kglist.KGDesc = graph_baseInfo.String
		}

		kglist.Version, _ = strconv.Atoi(version.String)

		switch kglist.Status {
		case "stop":
			kglist.Status = "edit"
		}

		r = append(r, kglist)
	}

	//logger.Info("get kgconf success")
	return r, nil
}

// @Author : yuan.qi@aishu.cn
// @File : adv_search_config.go
// @Time : 2021/3/13

package dao

import (
	sql2 "database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"graph-engine/logger"
	"graph-engine/utils"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// 高级搜索配置列表
type AdvSearchConf struct {
	ID         int    `json:"conf_id"`
	Type       string `json:"type"`
	ConfName   string `json:"conf_name"`
	ConfDesc   string `json:"conf_desc"`
	KGName     string `json:"kg_name"`
	KGID       int    `json:"kg_id"`
	KGDesc     string `json:"kg_desc"`
	CreateTime string `json:"create_time"`
	UpdateTime string `json:"update_time"`
}

func GetAdvSearchConf(filter, query, sort string) ([]AdvSearchConf, error) {
	var r []AdvSearchConf

	engine := utils.GetConnect()

	switch filter {
	case "all":
		filter = "`conf_name`, kg_name"
	case "config":
		filter = "`conf_name`"
	case "kg":
		filter = "kg_name"
	}

	if sort == "descend" {
		sort = "desc, `conf_name`"
	} else {
		sort = "asc, `conf_name`"
	}

	// 模糊查询通配符转义
	re := regexp.MustCompile("^[_%]+$")
	query = re.ReplaceAllString(query, "\\${0}")
	query = "%" + query + "%"

	sql := fmt.Sprintf("select search_config.`id`, `conf_name`, `conf_desc`,search_config.`type` as `conf_type`, `KG_name` as kg_name, "+
		"knowledge_graph.id as kg_id, search_config.`create_time`, search_config.`update_time`,"+
		"graph_config_table.graph_baseInfo from search_config "+
		"inner join knowledge_graph on kg_id=knowledge_graph.id "+
		"left join graph_config_table on graph_config_table.id = knowledge_graph.KG_config_id "+
		"where concat(%s) collate utf8_general_ci like ? "+
		"order by update_time %s", filter, sort)

	stmt, err := engine.Prepare(sql)
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	defer stmt.Close()

	args := []interface{}{query}

	advConfig, err := stmt.Query(args...)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer advConfig.Close()

	for advConfig.Next() {
		var (
			id          int
			conf_name   string
			conf_desc   sql2.NullString
			conf_type   string
			kg_name     string
			kg_id       int
			create_time string
			update_time string

			graph_baseInfo sql2.NullString
		)
		err := advConfig.Scan(&id, &conf_name, &conf_desc, &conf_type, &kg_name, &kg_id, &create_time, &update_time, &graph_baseInfo)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		advSearchConf := AdvSearchConf{
			ID:         id,
			Type:       conf_type,
			ConfName:   conf_name,
			ConfDesc:   conf_desc.String,
			KGName:     kg_name,
			KGID:       kg_id,
			CreateTime: create_time,
			UpdateTime: update_time,
			//CreateUser:  create_user,
			//CreateEmail: create_email.String,
			//UpdateUser:  update_user,
			//UpdateEmail: update_email.String,
		}

		baseInfoMap := make(map[string]interface{})

		if graph_baseInfo.String != "" {
			baseInfo := strings.TrimLeft(graph_baseInfo.String, "[")
			baseInfo = strings.TrimRight(baseInfo, "]")
			baseInfoStr := strings.Replace(baseInfo, "'", "\"", -1)
			baseInfoStr = strings.Replace(baseInfoStr, "\n", "", -1)
			err = json.Unmarshal([]byte(baseInfoStr), &baseInfoMap)
			if err != nil {
				return nil, err
			}
			advSearchConf.KGDesc = baseInfoMap["graph_des"].(string)
		} else {
			advSearchConf.KGDesc = graph_baseInfo.String
		}

		r = append(r, advSearchConf)
	}
	return r, nil
}

func GetKGIDByKNetID(knowledgeNetID int) ([]int64, error) {
	var kgids []int64

	engine := utils.GetConnect()

	kNetIdSql := fmt.Sprintf("select id from knowledge_network where id=%d", knowledgeNetID)
	kNetId, err := engine.Query(kNetIdSql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	defer kNetId.Close()
	var knetid sql2.NullInt64
	for kNetId.Next() {
		err := kNetId.Scan(&knetid)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
	}
	if int(knetid.Int64) == 0 {
		return nil, utils.ErrInfo(utils.ErrKNetIDErr, errors.New("knowledge network not exist"))
	}

	sql := "select graph_id from network_graph_relation where knw_id=%d"
	sql = fmt.Sprintf(sql, knowledgeNetID)

	resultSet, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer resultSet.Close()

	var graphIDs []string
	for resultSet.Next() {
		var graph_id sql2.NullString

		err := resultSet.Scan(&graph_id)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		graphIDs = append(graphIDs, graph_id.String)
	}
	if len(graphIDs) == 0 {
		return kgids, nil
	}

	sql = "select id as kg_id from knowledge_graph where KG_config_id in (%s)"
	sql = fmt.Sprintf(sql, strings.Join(graphIDs, ", "))

	kgID, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer kgID.Close()

	for kgID.Next() {
		var kg_id sql2.NullInt64
		err = kgID.Scan(&kg_id)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		kgids = append(kgids, kg_id.Int64)
	}

	return kgids, nil
}

func GetKGIDByKNetIDAndKGName(knowledgeNetID int, kgName string) ([]int64, error) {
	var kgids []int64

	engine := utils.GetConnect()

	kNetIdSql := fmt.Sprintf("select id from knowledge_network where id=%d", knowledgeNetID)
	kNetId, err := engine.Query(kNetIdSql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	defer kNetId.Close()
	var knetid sql2.NullInt64
	for kNetId.Next() {
		err := kNetId.Scan(&knetid)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
	}
	if int(knetid.Int64) == 0 {
		return nil, utils.ErrInfo(utils.ErrKNetIDErr, errors.New("knowledge network not exist"))
	}

	sql := "select graph_id from network_graph_relation where knw_id=%d"
	sql = fmt.Sprintf(sql, knowledgeNetID)

	resultSet, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer resultSet.Close()

	var graphIDs []string
	for resultSet.Next() {
		var graph_id sql2.NullString

		err := resultSet.Scan(&graph_id)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		graphIDs = append(graphIDs, graph_id.String)
	}
	if len(graphIDs) == 0 {
		return kgids, nil
	}

	// 模糊查询通配符转义
	re := regexp.MustCompile("^[_%']+$")
	kgName = re.ReplaceAllString(kgName, "\\${0}")
	kgName = "%" + kgName + "%"

	sql = "select id as kg_id from knowledge_graph where KG_config_id in (%s) and KG_name like '%s'"
	sql = fmt.Sprintf(sql, strings.Join(graphIDs, ", "), kgName)

	kgID, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer kgID.Close()

	for kgID.Next() {
		var kg_id sql2.NullInt64
		err = kgID.Scan(&kg_id)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		kgids = append(kgids, kg_id.Int64)
	}

	return kgids, nil
}

// 删除配置
func DelAdvSearchConf(engine *sql2.DB, confIDs []int) error {
	var confidStrArray []string
	for _, i := range confIDs {
		confidStrArray = append(confidStrArray, strconv.Itoa(i))

	}

	args := make([]interface{}, len(confIDs))
	for i, v := range confIDs {
		args[i] = v
	}

	sql := fmt.Sprintf("delete from search_config where id in (%s);", utils.CreateQuestionMarks(len(confIDs)))

	stmt, err := engine.Prepare(sql)
	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer stmt.Close()

	_, err = stmt.Exec(args...)
	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	return nil
}

// 新增搜索配置
type ConfContent struct {
	MaxDepth     int          `json:"max_depth"`
	SearchRange  SearchRange  `json:"search_range" binding:"required,dive"`
	DisplayRange DisplayRange `json:"display_range" binding:"required,dive"`
}
type SearchRange struct {
	Vertexes RangeVertexes `json:"vertexes" binding:"required,dive"`
	Edges    RangeEdges    `json:"edges" binding:"required,dive"`
}
type DisplayRange struct {
	Vertexes RangeVertexes `json:"vertexes" binding:"required,dive"`
}
type RangeVertexes struct {
	Open []string `json:"open" binding:"omitempty"`
}
type RangeEdges struct {
	Open []string `json:"open" binding:"omitempty"`
}

func AddAdvSearchConf(confName, _type, confDesc string, kgid int, confContent ConfContent) (confID int, err error) {
	engine := utils.GetConnect()

	// search_config表新增配置
	sql := "INSERT INTO `anydata`.`search_config`(`conf_name`, `type`, `conf_desc`, `kg_id`, `conf_content`, `create_time`, `update_time`) " +
		"VALUES (?, ?, ?, ?, ?, ?, ?);"

	stmt, err := engine.Prepare(sql)
	if err != nil {
		return 0, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer stmt.Close()

	contentJson, err := json.Marshal(confContent)
	confNameEscape, err := utils.EscapeMysql(confName)
	confDescEscape, err := utils.EscapeMysql(confDesc)

	confid, err := stmt.Exec(confNameEscape, _type, confDescEscape, kgid, contentJson, time.Now().Format("2006-01-02 15:04:05"), time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		return 0, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	id, _ := confid.LastInsertId()

	return int(id), nil
}

// 更新搜索配置
func UpdateAdvSearchConf(confID int, confName, confDesc string, confContent ConfContent) error {
	engine := utils.GetConnect()

	// 更新search_config表
	sql := fmt.Sprintf("UPDATE `anydata`.`search_config` SET `conf_name` = ?, `conf_desc` = ?, `conf_content` = ?, " +
		"`update_time` = ? WHERE `id` = ?;")

	stmt, err := engine.Prepare(sql)
	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer stmt.Close()

	contentJson, err := json.Marshal(confContent)
	confNameEscape, err := utils.EscapeMysql(confName)
	confDescEscape, err := utils.EscapeMysql(confDesc)

	args := append([]interface{}{}, confNameEscape, confDescEscape, contentJson, time.Now().Format("2006-01-02 15:04:05"), confID)

	_, err = stmt.Exec(args...)
	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	return nil
}

// 查询单一搜索配置
type InfoSearchConf struct {
	ID          int         `json:"conf_id"`
	ConfName    string      `json:"conf_name"`
	Type        string      `json:"type"`
	ConfDesc    string      `json:"conf_desc"`
	KGName      string      `json:"kg_name"`
	KGID        int         `json:"kg_id"`
	ConfContent ConfContent `json:"conf_content"`
}

// 查看单一配置信息
func GetInfoAdvSearchConf(confID int) (error, *InfoSearchConf) {
	var ConfInfo InfoSearchConf
	engine := utils.GetConnect()

	// 检查confID
	_bool, err := CheckConfID(engine, confID)
	if err != nil {
		return err, nil
	}
	if !_bool {
		return utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New(fmt.Sprintf("id %s not exist", confID))), nil
	}

	sql := "select `id`, `conf_name`, `type`, `conf_desc`, `kg_id`, `conf_content` from `anydata`.`search_config` where id=%d"
	sql = fmt.Sprintf(sql, confID)
	infoRes, err := engine.Query(sql)
	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err), nil
	}

	defer infoRes.Close()

	for infoRes.Next() {
		var (
			id           int
			conf_name    string
			conf_type    string
			conf_desc    sql2.NullString
			kg_id        int
			conf_content string
		)
		err := infoRes.Scan(&id, &conf_name, &conf_type, &conf_desc, &kg_id, &conf_content)
		if err != nil {
			return utils.ErrInfo(utils.ErrInternalErr, err), nil
		}

		ConfInfo = InfoSearchConf{
			ID:       id,
			Type:     conf_type,
			ConfName: conf_name,
			ConfDesc: conf_desc.String,
			KGID:     kg_id,
			//ConfContent: conf_content,
		}

		err = json.Unmarshal([]byte(conf_content), &ConfInfo.ConfContent)
		if err != nil {
			return err, nil
		}

		kg_name, err := getKGNameByKgid(engine, kg_id)
		if err != nil {
			return err, nil
		}
		ConfInfo.KGName = kg_name
	}

	return nil, &ConfInfo
}

// 高级搜索图谱列表：仅包含存在配置的图谱
type ConfKGList struct {
	ID           int    `json:"kg_id"`
	Name         string `json:"kg_name"`
	UpdateTime   string `json:"update_time"`
	Status       string `json:"status"`
	TaskStatus   string `json:"task_status"`
	ConfigStatus string `json:"config_status"`
}

// 获取图谱相应配置
type ConfListByKgid struct {
	ID         int    `json:"conf_id"`
	ConfName   string `json:"conf_name"`
	Type       string `json:"type"`
	UpdateTime string `json:"update_time"`
	ConfDesc   string `json:"conf_desc"`
}

func GetConfByKGID(kgid int) (confRes []ConfListByKgid, err error) {
	var r []ConfListByKgid

	engine := utils.GetConnect()

	sql := "select id, conf_name, `type`, update_time, conf_desc from search_config where kg_id=%d order by update_time"
	sql = fmt.Sprintf(sql, kgid)

	confList, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	defer confList.Close()

	for confList.Next() {
		var (
			id          int
			conf_name   string
			_type       string
			update_time string
			conf_desc   sql2.NullString
		)

		err := confList.Scan(&id, &conf_name, &_type, &update_time, &conf_desc)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		confList := ConfListByKgid{
			ID:         id,
			ConfName:   conf_name,
			Type:       _type,
			UpdateTime: update_time,
			ConfDesc:   conf_desc.String,
		}
		r = append(r, confList)
	}
	return r, nil
}

// 过滤没有高级配置的图谱id
func FilterKgidNoAdvConf(kgids []string) (kgidArray []string, err error) {
	engine := utils.GetConnect()

	sql := "select kg_id from search_config where kg_id in (%s) group by kg_id"
	sql = fmt.Sprintf(sql, strings.Join(kgids, ","))

	KgidList, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	defer KgidList.Close()

	for KgidList.Next() {
		var (
			kg_id string
		)

		err := KgidList.Scan(&kg_id)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		kgidArray = append(kgidArray, kg_id)
	}

	return kgidArray, nil
}

// 获取kgname
func getKGNameByKgid(engine *sql2.DB, kgid int) (kgName string, err error) {
	sql := "select KG_name from knowledge_graph where id=%d"
	sql = fmt.Sprintf(sql, kgid)

	kgname, err := engine.Query(sql)
	if err != nil {
		return "", utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer kgname.Close()
	for kgname.Next() {
		err = kgname.Scan(&kgName)
		if err != nil {
			return "", utils.ErrInfo(utils.ErrInternalErr, err)
		}
	}
	return kgName, nil
}

// 检查配置id
func CheckConfID(engine *sql2.DB, id int) (bool, error) {
	sql := "select id from search_config where id=%d"
	sql = fmt.Sprintf(sql, id)

	idRes, err := engine.Query(sql)
	if err != nil {
		return false, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer idRes.Close()

	for idRes.Next() {
		var id int

		err = idRes.Scan(&id)
		if err != nil {
			return false, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		if idRes == nil {
			return false, nil
		} else {
			return true, nil
		}
	}
	return false, nil
}

func Checkkgid(kgid int) (bool, error) {
	engine := utils.GetConnect()
	sql := "select count(id) as count from knowledge_graph where id=%d"
	sql = fmt.Sprintf(sql, kgid)

	idRes, err := engine.Query(sql)
	if err != nil {
		logger.Error(err)
		return false, err
	}
	defer idRes.Close()

	for idRes.Next() {
		var (
			count int
		)

		err = idRes.Scan(&count)
		if err != nil {
			logger.Error(err)
			return false, err
		}
		if count == 0 {
			return false, utils.ErrInfo(utils.ErrKGIDErr, errors.New("KG does not exist"))
		}
	}
	return true, nil
}

// 检查配置名是否存在
func CheckConfName(confName string, confid int) (bool, error) {
	engine := utils.GetConnect()
	var sql string
	if confid != 0 {
		sql = "select conf_name as old_name from search_config where id=%d"
		sql = fmt.Sprintf(sql, confid)

		nameOld, err := engine.Query(sql)
		if err != nil {
			return false, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		nameOld.Close()

		for nameOld.Next() {
			var old_name string
			err = nameOld.Scan(&old_name)
			if err != nil {
				return false, utils.ErrInfo(utils.ErrInternalErr, err)
			}

			if old_name == confName {
				return true, nil
			}
		}
	}

	confNameEscape, err := utils.EscapeMysql(confName)
	if err != nil {
		return false, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	sql = "select conf_name from search_config where conf_name='%s'"
	sql = fmt.Sprintf(sql, confNameEscape)

	r, err := engine.Query(sql)
	if err != nil {
		return false, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer r.Close()

	for r.Next() {
		var conf_name sql2.NullString
		err = r.Scan(&conf_name)
		if err != nil {
			return false, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		if conf_name.String != "" {
			return false, utils.ErrInfo(utils.ErrAdvConfNameErr, errors.New(fmt.Sprintf("conf name repeat")))
		}
	}

	return true, nil
}

// 根据confid获取kgid
func GetKGIDByConfID(engine *sql2.DB, confid int) (kgid int, err error) {
	sql := "select kg_id as kgid from search_config where id=%d"
	sql = fmt.Sprintf(sql, confid)

	kgID, err := engine.Query(sql)
	if err != nil {
		return 0, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer kgID.Close()

	for kgID.Next() {
		var kg_id int
		err = kgID.Scan(&kg_id)
		if err != nil {
			return 0, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		kgid = kg_id
	}

	if kgid == 0 {
		return 0, utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New(fmt.Sprintf("conf_id %d not exist", confid)))
	}
	return kgid, nil
}

// 根据confids获取kgids
func GetKGIDByConfIDS(confids []string) (confidkgids []map[int]int, err error) {
	engine := utils.GetConnect()

	confidStr := strings.Join(confids, ",")

	sql := "select id as confid, kg_id as kgid from search_config where id in (%s)"
	sql = fmt.Sprintf(sql, confidStr)

	kgID, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer kgID.Close()

	for kgID.Next() {
		var (
			conf_id int
			kg_id   int
		)
		err = kgID.Scan(&conf_id, &kg_id)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		confidkgid := map[int]int{
			conf_id: kg_id,
		}

		confidkgids = append(confidkgids, confidkgid)
	}
	return confidkgids, nil
}

// 获取某个图谱基本信息
type KGInfo struct {
	KGID   int
	KGName string
	KGDesc string
}

func GetKGInfo(kgid int) (kginfo *KGInfo, err error) {
	//var kginfo *KGInfo

	engine := utils.GetConnect()

	sql := "select knowledge_graph.id, `KG_name` as kg_name, graph_config_table.graph_baseInfo from knowledge_graph left join graph_config_table on " +
		"graph_config_table.id = knowledge_graph.KG_config_id where knowledge_graph.id=%d"
	sql = fmt.Sprintf(sql, kgid)

	info, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	defer info.Close()

	for info.Next() {
		var (
			id             int
			kg_name        string
			graph_baseInfo sql2.NullString
		)

		err := info.Scan(&id, &kg_name, &graph_baseInfo)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		kginfo = &KGInfo{
			KGID:   id,
			KGName: kg_name,
		}

		baseInfoMap := make(map[string]interface{})

		if graph_baseInfo.String != "" {
			baseInfo := strings.TrimLeft(graph_baseInfo.String, "[")
			baseInfo = strings.TrimRight(baseInfo, "]")
			baseInfoStr := strings.Replace(baseInfo, "'", "\"", -1)
			baseInfoStr = strings.Replace(baseInfoStr, "\n", "", -1)
			err = json.Unmarshal([]byte(baseInfoStr), &baseInfoMap)
			if err != nil {
				return nil, err
			}
			kginfo.KGDesc = baseInfoMap["graph_des"].(string)
		} else {
			kginfo.KGDesc = graph_baseInfo.String
		}
	}

	return kginfo, nil
}

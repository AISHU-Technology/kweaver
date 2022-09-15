// @File : kg_topic.go
// @Time : 2021/4/10

package orient

import (
	"errors"
	"fmt"
	"graph-engine/utils"
	"strings"
)

// KC创建实体（label/document）
type KCArgs struct {
	TopicID     int        `json:"topic_id" binding:"required,gt=0"`
	TopicName   string     `json:"topic_name" binding:"required"`
	TopicTags   []string   `json:"topic_tags" binding:"required"`
	TopicTypeKC bool       `json:"topic_type_kc" binding:"required"`
	Files       []FileInfo `json:"files" binding:"required,dive"`
}
type FileInfo struct {
	FileGns  string `json:"file_gns" binding:"required"`
	FileName string `json:"file_name" binding:"required"`
}

// 存在即更新, 不存在则创建
func KCUpsert(conf utils.KGConf, args KCArgs) (res interface{}, err error) {
	var returnList []string

	// 创建label
	topicSql := "let label = UPDATE `label` SET adlabel_kcid=%d, name='%s', kc_topic_tags='%s', type_kc=%t " +
		"UPSERT RETURN AFTER $current.@class as class, $current.@rid as rid WHERE adlabel_kcid=%d;"
	topicSql = fmt.Sprintf(topicSql, args.TopicID, args.TopicName, args.TopicTags, args.TopicTypeKC, args.TopicID)
	returnList = append(returnList, "$label")

	// 前先删除该主题下文档, 以便更新该主题下文档
	deleteSql := "let del = delete edge where @rid in (select outE('label2document').@rid from `label` where adlabel_kcid=%d);"
	deleteSql = fmt.Sprintf(deleteSql, args.TopicID)

	docListSql, edgeListSql := "", ""
	for index, file := range args.Files {
		doc := fmt.Sprintf("doc%d", index)
		edge := fmt.Sprintf("edge%d", index)

		// 创建document
		docSql := "let %s = UPDATE `document` SET gns='%s', name='%s' UPSERT RETURN AFTER $current.@class as class, " +
			"$current.@rid as rid WHERE gns='%s';"
		docSql = fmt.Sprintf(docSql, doc, file.FileGns, file.FileName, file.FileGns)
		docListSql = docListSql + docSql

		// 创建edge
		edgeSql := "let %s = create edge `label2document` from $label.rid to $%s.rid;"
		edgeSql = fmt.Sprintf(edgeSql, edge, doc)

		edgeListSql = edgeListSql + edgeSql

		returnList = append(returnList, "$"+doc)
	}

	_return := strings.Join(returnList, ",")
	_returnRes := "return [%s];commit"
	_returnRes = fmt.Sprintf(_returnRes, _return)

	sqlListStr := "%s%s%s%s%s"
	sqlListStr = fmt.Sprintf(sqlListStr, topicSql, deleteSql, docListSql, edgeListSql, _returnRes)

	if conf.ID == "" {
		return nil, utils.ErrInfo(utils.ErrKGIDErr, errors.New("KG does not exist"))
		//return nil, utils.ServError{
		//	Code:    utils.ErrKGIDErr,
		//	Message: utils.ErrMsgMap[utils.ErrKGIDErr],
		//	Cause:   "KG does not exist.",
		//}
	}

	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/batch/" + conf.DB + "/",
		Method: "batch",
	}

	var queryRes QueryRes
	err = queryRes.ParseOrientResponse(operator, sqlListStr)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	return queryRes.Res, nil
}

type Score struct {
	TopicRid   string  `json:"rid" binging:"required"`
	TopicScore float64 `json:"score" binging:"required"`
	TopicID    int     `json:"topic_id" binging:"required,gt=0"`
}

// 批量更新主题价值分
func UpdateTopicBatch(conf utils.KGConf, args []Score) (res interface{}, err error) {
	if conf.ID == "" {
		return nil, utils.ErrInfo(utils.ErrKGIDErr, errors.New("KG does not exist"))
		//return nil, utils.ServError{
		//	Code:    utils.ErrKGIDErr,
		//	Message: utils.ErrMsgMap[utils.ErrKGIDErr],
		//	Cause:   "KG does not exist.",
		//}
	}

	var returnList []string

	sqlList := ""
	for index, topic := range args {
		topicIndex := fmt.Sprintf("topic%d", index)
		sql := "let %s = UPDATE `label` SET adlabel_kcid=%d, score=%g RETURN AFTER $current.@class as class, $current.@rid as rid WHERE @rid=%s;"
		sql = fmt.Sprintf(sql, topicIndex, topic.TopicID, topic.TopicScore, topic.TopicRid)

		sqlList = sqlList + sql
		returnList = append(returnList, "$"+topicIndex)
	}

	_return := strings.Join(returnList, ",")
	_returnRes := fmt.Sprintf("return [%s];commit", _return)

	sqlListStr := "%s%s"
	sqlListStr = fmt.Sprintf(sqlListStr, sqlList, _returnRes)

	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/batch/" + conf.DB + "/",
		Method: "batch",
	}

	var queryRes QueryRes
	err = queryRes.ParseOrientResponse(operator, sqlListStr)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	return queryRes.Res, nil
}

// 新增实体
func VertexAdd(conf utils.KGConf, class, fields, name string) (res interface{}, err error) {
	class = "`" + class + "`" // 中文class需使用反引号
	fields = strings.ReplaceAll(fields, `"`, "'")

	sql := " UPDATE %s SET %s UPSERT WHERE name='%s'"
	sql = fmt.Sprintf(sql, class, fields, name)

	queryRes, err := vertexOperator(conf, sql)
	if err != nil {
		return nil, err
	}

	res = queryRes.Res
	return res, nil
}

// 删除实体
func VertexDelete(conf utils.KGConf, class, condition string) (res interface{}, err error) {
	class = "`" + class + "`" // 中文class需使用反引号
	condition = strings.ReplaceAll(condition, `"`, "'")

	sql := "delete from %s where %s unsafe"
	sql = fmt.Sprintf(sql, class, condition)

	queryRes, err := vertexOperator(conf, sql)
	if err != nil {
		return nil, err
	}
	res = queryRes.Res
	return res, nil
}

// 查询实体
func VertexSelect(conf utils.KGConf, class, condition string) (res interface{}, err error) {
	class = "`" + class + "`" // 中文class需使用反引号

	var sql string
	if condition != "" {
		condition = strings.ReplaceAll(condition, `"`, "'")
		sql = "SELECT FROM %s WHERE %s"
		sql = fmt.Sprintf(sql, class, condition)
	} else {
		sql = "SELECT FROM %s"
		sql = fmt.Sprintf(sql, class)
	}

	queryRes, err := vertexOperator(conf, sql)
	if err != nil {
		return nil, err
	}
	res = queryRes.Res
	return res, nil
}

// 新增关系
func EdgeAdd(conf utils.KGConf, class, fields, startClass, startCondition, endClass, endCondition string) (res interface{}, err error) {
	fields = strings.ReplaceAll(fields, `"`, "'")
	startCondition = strings.ReplaceAll(startCondition, `"`, "'")
	endCondition = strings.ReplaceAll(endCondition, `"`, "'")

	// 先create edge，如果报错，再执行update，因为in/out是唯一索引
	sql := "create edge `%s` from (SELECT FROM `%s` WHERE %s) to (SELECT FROM `%s` WHERE %s) set %s"
	sql = fmt.Sprintf(sql, class, startClass, startCondition, endClass, endCondition, fields)

	queryRes, err := vertexOperator(conf, sql)
	if err != nil {
		sql := "update edge `%s` set in = (SELECT FROM `%s` WHERE %s),out = (SELECT FROM `%s` WHERE %s), %s upsert where in = (SELECT FROM `%s` WHERE %s) and out = (SELECT FROM `%s` WHERE %s)"
		sql = fmt.Sprintf(sql, class, endClass, endCondition, startClass, startCondition, fields, endClass, endCondition, startClass, startCondition)

		queryRes, err = vertexOperator(conf, sql)
		if err != nil {
			return nil, err
		}
		return nil, err
	}

	res = queryRes.Res
	return res, nil
}

// 删除关系
func EdgeDelete(conf utils.KGConf, class, startClass, startCondition, endClass, endCondition string) (res interface{}, err error) {
	startCondition = strings.ReplaceAll(startCondition, `"`, "'")
	endCondition = strings.ReplaceAll(endCondition, `"`, "'")

	sql := "delete edge `%s` where in = (select from `%s` where %s) and out = (select from `%s` where %s)"
	sql = fmt.Sprintf(sql, class, endClass, endCondition, startClass, startCondition)

	queryRes, err := vertexOperator(conf, sql)
	if err != nil {
		return nil, err
	}
	res = queryRes.Res
	return res, nil
}

// 查询关系
func EdgeSelect(conf utils.KGConf, class, condition string) (res interface{}, err error) {
	var sql string
	if condition != "" {
		condition = strings.ReplaceAll(condition, `"`, "'")
		sql = "SELECT FROM `%s` WHERE %s"
		sql = fmt.Sprintf(sql, class, condition)
	} else {
		sql = "SELECT FROM `%s`"
		sql = fmt.Sprintf(sql, class)
	}

	queryRes, err := vertexOperator(conf, sql)
	if err != nil {
		return nil, err
	}
	res = queryRes.Res
	return res, nil
}

func vertexOperator(conf utils.KGConf, sql string) (res *QueryRes, err error) {
	if conf.URL == "" {
		return nil, utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
		//return nil, utils.ServError{
		//	Code:    utils.ErrInternalErr,
		//	Message: utils.ErrMsgMap[utils.ErrInternalErr],
		//	Cause:   "KG does not exist.",
		//}
	}

	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/command/" + conf.DB + "/sql",
		Method: "command",
	}

	var queryRes QueryRes
	err = queryRes.ParseOrientResponse(operator, sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrOrientDBErr, err)
	}
	return &queryRes, nil
}

package orient

import (
	"encoding/json"
	"errors"
	"fmt"
	"graph-engine/utils"
	"math/rand"
	"strconv"
)

type ClassConf struct {
	Name       string     `json:"name"`
	SuperClass string     `json:"superClass"`
	Records    uint64     `json:"records"`
	Properties []Property `json:"properties"`
	Indexes    []Index    `json:"indexes"`
}

type RecommendOrientRes struct {
	Res            interface{}
	FulltextProper []string
}

func (r *RecommendOrientRes) Recommend(conf *utils.KGConf, class string, limit int) error {
	if conf.ID == "" {
		return utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	// 首次配置无推荐
	if conf.ConfigStatus == "edit" {
		return utils.ErrInfo(utils.ErrConfigStatusErr, errors.New("KG config status is edit"))
	}

	var schema Schema
	err := schema.GetSchema(conf)
	if err != nil {
		return err
	}

	if schema.V == nil {
		return utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))
	}

	// Class OrientDB 数据类别
	var indexOp = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/class/" + conf.DB + "/" + class,
		Method: "get",
	}

	response, err := indexOp.Result("")
	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	// 读取结果
	classConf := new(ClassConf)
	err = json.Unmarshal(response, classConf)

	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var proper []string
	//var indexName string
	for _, indexes := range classConf.Indexes {
		if indexes.Type == "FULLTEXT" {
			proper = indexes.Fields
			//indexName = indexes.Name
		}
	}

	// 没有fulltex不推荐实体
	if proper == nil {
		return nil
	}

	r.FulltextProper = proper

	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/command/" + conf.DB + "/sql",
		Method: "command",
	}

	var queryRes QueryRes

	class = "`" + class + "`" // 中文class需使用反引号

	sqlCount := "select count(*) as count from %s"
	sqlCount = fmt.Sprintf(sqlCount, class)

	//logger.Info(sqlCount)
	err = queryRes.ParseOrientResponse(operator, sqlCount)
	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	var skip int

	for _, c := range queryRes.Res.([]interface{}) {
		cMap := c.(map[string]interface{})
		count, _ := strconv.Atoi(strconv.FormatFloat(cMap["count"].(float64), 'f', -1, 64))

		// 随机选100，然后去重，最后返回6个
		limit = 100

		switch {
		case count == 0:
			return nil
		case count <= limit && limit <= 100:
			if count > 6 {
				skip = rand.Intn(count - 6)
			} else {
				skip = 0
				limit = -1
			}
		case limit <= 100 && limit < count && count <= 1000:
			skip = rand.Intn(count - limit)
		case count > 1000 && limit <= 100:
			skip = rand.Intn(1000 - limit)
		default:
			return nil
		}
	}

	sql := "select expand(res) from (select @this:{!out_*, !in_*} as res from (select * from %s skip %d limit %d))"
	sql = fmt.Sprintf(sql, class, skip, limit)

	//logger.Info(sql)
	err = queryRes.ParseOrientResponse(operator, sql)
	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	r.Res = queryRes.Res

	return nil
}

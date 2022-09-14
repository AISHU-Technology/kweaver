// Package orient 是 Orientdb 的数据访问层
// - 描述：分析报告 访问层
// - 时间：2021-1-21

package orient

import (
	"errors"
	"fmt"
	"graph-engine/utils"
)

type AnalysisRes struct {
	Res interface{}
}

func (a *AnalysisRes) Analysis(conf *utils.KGConf, rid string) error {
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

	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/command/" + conf.DB + "/sql",
		Method: "command",
	}

	var queryRes QueryRes

	// 仅对document进行分析报告
	sqlClass := "select @class from %s"
	sqlClass = fmt.Sprintf(sqlClass, rid)

	//logger.Info(sqlClass)
	err = queryRes.ParseOrientResponse(operator, sqlClass)
	if err != nil {
		return err
	}

	if len(queryRes.Res.([]interface{})) == 0 {
		return utils.ErrInfo(utils.ErrOrientDBErr, errors.New("class is null"))
	}

	for _, c := range queryRes.Res.([]interface{}) {
		cMap := c.(map[string]interface{})

		switch conf.Version {
		case 3:
			if cMap["@class"].(string) != "document" {
				a.Res = nil
				return utils.ErrInfo(utils.ErrOrientDBErr, errors.New("class is not document"))
			}
		case 2:
			if cMap["class"].(string) != "document" {
				a.Res = nil
				return utils.ErrInfo(utils.ErrOrientDBErr, errors.New("class is not document"))
			}
		}
	}

	sql := "select  @this:{!out_*, !in_*} from (" +
		"select *, $a as in, $b as out from %s " +
		"let $a = (select expand(in()) from %s), " +
		"$b = (select expand(out()) from %s) )"
	sql = fmt.Sprintf(sql, rid, rid, rid)

	//logger.Info(sql)
	err = queryRes.ParseOrientResponse(operator, sql)
	if err != nil {
		return err
	}

	a.Res = queryRes.Res

	return nil

}

// Package orient 是 Orientdb 的数据访问层
// - 描述：OrientDB SQL 访问层
// - 时间：2020-9-24

package orient

import (
	"encoding/json"
	"errors"
	"graph-engine/utils"
	"strings"
)

type QuerySQL struct {
	Result string `json:"result"`
}

type QuerySQLRes struct {
	Res interface{}
}

type QueryGraph struct {
	Vertices interface{}
	Edges    interface{}
}

func (q *QuerySQLRes) SearchSQL(conf *utils.KGConf, sql []string, mode string, transaction bool) error {
	if conf.ID == "" {
		return utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	if sql == nil {
		return nil
	}

	switch mode {
	case "graph":
		var operator = Operator{
			User: conf.User,
			PWD:  conf.Pwd,
			URL:  conf.URL + "/command/" + conf.DB + "/sql",
			Mode: mode,
		}
		// 备注：orientdb原生图模式不持支批量事务，所以sql输入仅可为单条语句
		sqlStr := strings.Join(sql, ";")
		response, err := operator.SQL(sqlStr)

		if err != nil {
			return utils.ErrInfo(utils.ErrOrientDBErr, err)
		}

		var res map[string]interface{}

		err = json.Unmarshal(response, &res)

		if err != nil {
			return utils.ErrInfo(utils.ErrInternalErr, err)
		}
		if e, exists := res["errors"]; exists {
			return utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
		}

		sc, exists := res["graph"]

		if !exists {
			return nil
		}

		rMap := sc.(map[string]interface{})
		graph := QueryGraph{
			Vertices: rMap["vertices"],
			Edges:    rMap["edges"],
		}

		q.Res = graph

	default:
		var operator = Operator{
			User: conf.User,
			PWD:  conf.Pwd,
			URL:  conf.URL + "/batch/" + conf.DB + "/",
			Mode: mode,
		}

		response, err := operator.TransactionBatch(transaction, sql)

		if err != nil {
			return utils.ErrInfo(utils.ErrOrientDBErr, err)
		}

		var res map[string]interface{}

		err = json.Unmarshal(response, &res)

		if err != nil {
			return utils.ErrInfo(utils.ErrInternalErr, err)
		}
		if e, exists := res["errors"]; exists {
			return utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
		}

		q.Res = res["result"]
	}

	return nil
}

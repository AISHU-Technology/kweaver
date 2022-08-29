// Package orient 是 Orientdb 的数据访问层
// - 描述：OrientDB Schema 访问层
// - 作者：陈骁 (xavier.chen@aishu.cn)
// - 时间：2020-6-15
package orient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"graph-engine/utils"
	"net/http"
)

// Operator OrientDB 操作对象
type Operator struct {
	User   string
	PWD    string
	URL    string
	Method string
	Mode   string //sql查询模式（一般查询&图查询）
}

// Result 获取 OrientDB 的结果
func (o *Operator) Result(sql string) ([]byte, error) {
	switch o.Method {
	case "command":
		return o.Command(sql)
	case "get":
		return o.CallGetMethod()
	case "batch":
		return o.Batch(sql)
	default:
		return o.SQL(sql)
	}
}

// SetParam 设置参数
func (o *Operator) SetParam(param interface{}) {
	switch param.(type) {
	case utils.OrientConf:
		conf := param.(utils.OrientConf)
		o.User = conf.User
		o.PWD = conf.Pwd
		o.URL = "http://" + conf.IP + ":" + conf.Port
	case utils.KGConf:
		conf := param.(utils.KGConf)
		o.User = conf.User
		o.PWD = conf.Pwd
		o.URL = conf.URL
	}
}

// Command 执行 OrientDB 的命令
func (o *Operator) Command(sql string) ([]byte, error) {

	var request, err = http.NewRequest(
		"POST", o.URL,
		bytes.NewBuffer([]byte("{\"command\":\""+sql+"\"}")))

	if err != nil {
		return nil, err
	}

	return utils.GetHTTPResponseWithAuth(request, o.User, o.PWD)
}

type TransactionBatchContent struct {
	Transaction bool                   `json:"transaction"`
	Operations  []TransactionOperation `json:"operations"`
}
type TransactionOperation struct {
	Type     string   `json:"type"`
	Language string   `json:"language"`
	Script   []string `json:"script"`
}

// TransactionBatch 事务执行命令, sql为list
func (o *Operator) TransactionBatch(transaction bool, sql []string) ([]byte, error) {
	var content = TransactionBatchContent{
		Transaction: transaction,
		Operations: []TransactionOperation{
			{
				Type:     "script",
				Language: "sql",
				Script:   sql,
			},
		},
	}
	jsonValue, _ := json.Marshal(content)
	var request, err = http.NewRequest(
		"POST", o.URL,
		bytes.NewBuffer(jsonValue))

	if err != nil {
		return nil, err
	}
	return utils.GetHTTPResponseWithAuth(request, o.User, o.PWD)
}

// Batch 事务执行命令，sql为string
type BatchContent struct {
	Transaction bool        `json:"transaction"`
	Operations  []Operation `json:"operations"`
}
type Operation struct {
	Type     string `json:"type"`
	Language string `json:"language"`
	Script   string `json:"script"`
}

func (o *Operator) Batch(sql string) ([]byte, error) {
	var content = BatchContent{
		Transaction: true,
		Operations: []Operation{
			{
				Type:     "script",
				Language: "sql",
				Script:   sql,
			},
		},
	}
	jsonValue, _ := json.Marshal(content)
	var request, err = http.NewRequest(
		"POST", o.URL,
		bytes.NewBuffer(jsonValue))

	if err != nil {
		return nil, err
	}
	return utils.GetHTTPResponseWithAuth(request, o.User, o.PWD)
}

// SQL 执行 OrientDB 的 SQL 查询
func (o *Operator) SQL(sql string) ([]byte, error) {
	url := fmt.Sprintf("%s/-/%d", o.URL, limit)

	switch o.Mode {
	case "graph":
		var request, err = http.NewRequest(
			"POST", url,
			bytes.NewBuffer([]byte("{\"command\":\""+sql+"\",\"mode\":\"graph\"}")))

		if err != nil {
			return nil, err
		}
		return utils.GetHTTPResponseWithAuth(request, o.User, o.PWD)

	default:
		var request, err = http.NewRequest(
			"POST", url,
			bytes.NewBuffer([]byte("{\"command\":\""+sql+"\"}")))
		if err != nil {
			return nil, err
		}
		return utils.GetHTTPResponseWithAuth(request, o.User, o.PWD)
	}
}

// CallGetMethod 调用 Get 请求
func (o *Operator) CallGetMethod() ([]byte, error) {
	var request, err = http.NewRequest(
		http.MethodGet, o.URL, nil)

	if err != nil {
		return nil, err
	}

	return utils.GetHTTPResponseWithAuth(request, o.User, o.PWD)
}

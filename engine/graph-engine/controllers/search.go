// Package controllers 为接口的控制逻辑
// - 描述：GEngine demo查询入口
// - 作者：张坤 (zhang.kun@aishu.cn)
// - 时间：2020-2-29
package controllers

import (
	"encoding/json"
	"fmt"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// 当前路由定义的post body结构
type reqBody struct {
	Word  string   `json:"word"`
	Links []string `json:"links"`
}

// getItems 无歧义词时返回所需数据
func getItems(r *orient.Res) [][]string {
	var items = make([][]string, 0)

	for _, v := range r.Result {
		if v.Relation != "歧义权重" && v.Relation != "描述" {
			items = append(items, []string{v.Relation, v.Value, utils.Int2Str(v.Label)})
		}
	}
	return items
}

// checkAmbiguity 判断搜索词是否为歧义词，如果不是歧义词则返回所需数据
func checkAmbiguity(r *orient.Res, b *reqBody) ([][]string, string, bool) {
	var (
		items     = make([][]string, 0)
		word      string
		ambiguity bool
	)

	for _, v := range r.Result {
		if v.Relation != "歧义权重" && v.Relation != "描述" {
			items = append(items, []string{v.Relation, v.Value, utils.Int2Str(v.Label)})
		}

		if v.Relation == "歧义关系" && strings.Contains(v.Value, b.Links[0]) {
			ambiguity = true
			word = v.Value
			break
		}
	}

	return items, word, ambiguity
}

// SearchHandler 提供查询接口
func SearchHandler(c *gin.Context) {
	var body = new(reqBody)
	err := c.BindJSON(&body)
	if err != nil {
		utils.ReturnError(c, 500, utils.ErrInternalErr, utils.ErrMsgMap[utils.ErrInternalErr], "request body structure not match", gin.H{"err": err.Error()})
		return
	}
	confs := utils.CONFIG.OrientConf //"http://10.2.196.39:2480/command/ownthinkdb/sql"
	var operator = orient.Operator{
		User:   confs.User,
		PWD:    confs.Pwd,
		URL:    "http://" + confs.IP + ":" + confs.Port + "/command/ownthinkdb/sql",
		Method: "command",
	}

	if word, length, data := strings.TrimSpace(body.Word), len(body.Links), make(map[string]interface{}); word == "" {
		data["entity"], data["items"] = "", [][]string{}
		c.JSON(http.StatusOK, gin.H{
			"data":  data,
			"links": []string{},
		})
	} else if length == 0 {
		escaped, err := utils.Escape(word)
		if err != nil {
			utils.ReturnError(c, 500, utils.ErrInternalErr, utils.ErrMsgMap[utils.ErrInternalErr], "String convert error", gin.H{"err": err.Error()})
			return
		}
		sql := fmt.Sprintf("Match {as: c, class:Entity, where:(vname= '%s')}.outE('Relationship') "+
			"{as:relationship}.inV(){as:value} return relationship.name, value.vname, relationship.label", escaped)
		response, err := orient.GetGraphData(&operator, sql)
		if err != nil {
			utils.ReturnError(c, 500, utils.ErrOrientDBErr, utils.ErrMsgMap[utils.ErrOrientDBErr], "orientdb error", gin.H{"err": err.Error()})
			return
		}

		//解析数据
		var res = new(orient.Res)
		err = json.Unmarshal(response, &res)
		if err != nil {
			utils.ReturnError(c, 500, utils.ErrInternalErr, utils.ErrMsgMap[utils.ErrInternalErr], "parse graph data error", gin.H{"err": err.Error()})
			return
		}
		if len(res.Result) == 0 {
			data["entity"], data["items"] = "", [][]string{}
			c.JSON(http.StatusOK, gin.H{
				"data":  data,
				"links": []string{},
			})
			return
		}

		items := getItems(res)

		data["entity"] = word
		data["items"] = items
		c.JSON(http.StatusOK, gin.H{
			"data":  data,
			"links": body.Links,
		})
	} else {
		sql := fmt.Sprintf("Match {as: c, class:Entity, where:(vname= '%s')}.outE('Relationship') "+
			"{as:relationship}.inV(){as:value} return relationship.name, value.vname, relationship.label", word)
		response, err := orient.GetGraphData(&operator, sql)
		if err != nil {
			utils.ReturnError(c, 500, utils.ErrOrientDBErr, utils.ErrMsgMap[utils.ErrOrientDBErr], "orientdb error", gin.H{"err": err.Error()})
			return
		}

		//解析数据
		var res = new(orient.Res)
		err = json.Unmarshal(response, &res)
		if err != nil {
			utils.ReturnError(c, 500, utils.ErrOrientDBErr, utils.ErrMsgMap[utils.ErrOrientDBErr], "orientdb error", gin.H{"err": err.Error()})
			return
		}

		data["entity"] = word
		items, newWord, ambiguity := checkAmbiguity(res, body)
		if ambiguity {
			data["entity"] = newWord

			sql := fmt.Sprintf("Match {as: c, class:Entity, where:(vname= '%s')}.outE('Relationship') "+
				"{as:relationship}.inV(){as:value} return relationship.name, value.vname, relationship.label", newWord)
			response, err := orient.GetGraphData(&operator, sql)
			if err != nil {
				utils.ReturnError(c, 500, utils.ErrOrientDBErr, utils.ErrMsgMap[utils.ErrOrientDBErr], "orientdb error", gin.H{"err": err.Error()})
				return
			}

			//解析数据
			var res = new(orient.Res)
			err = json.Unmarshal(response, &res)
			if err != nil {
				utils.ReturnError(c, 500, utils.ErrInternalErr, utils.ErrMsgMap[utils.ErrInternalErr], "parse graph data error", gin.H{"err": err.Error()})
				return
			}

			items = getItems(res)
		}
		data["items"] = items

		c.JSON(http.StatusOK, gin.H{
			"data":  data,
			"links": body.Links,
		})
	}
}

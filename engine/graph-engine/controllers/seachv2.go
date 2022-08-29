// Package controllers 为接口的控制逻辑
// - 描述：查询接口V2
// - 作者：张坤 (zhang.kun@aishu.cn)
// - 时间：2020-3-27
package controllers

import (
	"encoding/json"
	"fmt"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type postBody struct {
	Word  string   `json:"word"`
	Links []string `json:"Links"`
}

type kgNode struct {
	Rname   string `json:"rname"`
	Vname   string `json:"vname"`
	Label   int    `json:"label"`
	Weights int    `json:"weights"`
}

// 基于 Weights 对节点进行排序
type kgNodeSlice []kgNode

func (s kgNodeSlice) Less(i, j int) bool {
	return s[j].Weights < s[i].Weights
}

func (s kgNodeSlice) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s kgNodeSlice) Len() int {
	return len(s)
}

// getGroupItems 填充data
func getGroupItems(r *orient.ResV2, data map[string]interface{}) {
	for _, v := range r.Result {

		// 权重可能出现 string int 或者空的情况，所以需要进行类型转换
		var weights int
		switch v.Weights.(type) {
		case string:
			weights, _ = strconv.Atoi(v.Weights.(string))
		case float64:
			weights = int(v.Weights.(float64))
		default:
			weights = -1
		}

		if data["introduction"] == "" && v.Relation == "描述" {
			data["introduction"] = v.Value
		} else if v.Relation == "标签" {
			data["tag"] = append(data["tag"].([]string), v.Value)
		} else if v.Relation == "歧义关系" {
			data["ambiguity"] = append(data["ambiguity"].(kgNodeSlice), kgNode{v.Relation, v.Value, v.Label, weights})
		} else if v.Types == 0 && v.Relation != "歧义权重" {
			data["attribute"] = append(data["attribute"].(kgNodeSlice), kgNode{v.Relation, v.Value, v.Label, weights})
		} else if v.Types == 1 && v.Relation != "歧义权重" {
			data["relation"] = append(data["relation"].(kgNodeSlice), kgNode{v.Relation, v.Value, v.Label, weights})
		}
	}

	if len(data["ambiguity"].(kgNodeSlice)) > 0 {
		sort.Sort(data["ambiguity"].(kgNodeSlice))
	}
}

// SearchHandlerV2 支持信息分组的查询
func SearchHandlerV2(c *gin.Context) {
	var body = new(postBody)
	err := c.BindJSON(&body)
	if err != nil {
		utils.ReturnError(c, 500, utils.ErrInternalErr, utils.ErrMsgMap[utils.ErrInternalErr], "request body structure not match", gin.H{"err": err.Error()})
		return
	}
	fmt.Printf("search word: %s, parent node: %s \n", body.Word, body.Links)

	confs := utils.CONFIG.OrientConf
	var operator = orient.Operator{
		User:   confs.User,
		PWD:    confs.Pwd,
		URL:    "http://" + confs.IP + ":" + confs.Port + "/command/ownthinkdb/sql",
		Method: "command",
	}

	pql := "Match {as: c, class:Entity, where:(vname= '%s')}.outE('Relationship') {as:relationship}.inV(){as:value} " +
		"return relationship.name, value.vname, value.label, relationship.types, value.weights"

	// 生成结果集
	var data = make(map[string]interface{})

	word := strings.TrimSpace(body.Word)
	if word == "" {
		c.JSON(http.StatusOK, gin.H{
			"res": gin.H{
				"data":  data,
				"links": body.Links,
			},
		})
	} else {
		escaped, err := utils.Escape(word)
		sql := fmt.Sprintf(pql, escaped)
		if err != nil {
			utils.ReturnError(c, 500, utils.ErrInternalErr, utils.ErrMsgMap[utils.ErrInternalErr], "String convert error", gin.H{"err": err.Error()})
			return
		}

		response, err := orient.GetGraphData(&operator, sql)
		if err != nil {
			utils.ReturnError(c, 500, utils.ErrOrientDBErr, utils.ErrMsgMap[utils.ErrOrientDBErr], "orientdb error", gin.H{"err": err.Error()})
			return
		}

		var res = new(orient.ResV2)
		err = json.Unmarshal(response, &res)
		if err != nil {
			utils.ReturnError(c, 500, utils.ErrInternalErr, utils.ErrMsgMap[utils.ErrInternalErr], "parse graph data error", gin.H{"err": err.Error()})
			return
		}

		// 查询结果为空
		if len(res.Result) == 0 {
			data["entity"] = word
			c.JSON(http.StatusOK, gin.H{
				"res": gin.H{
					"data":  data,
					"links": body.Links,
				},
			})
			return
		}

		// 结果不为空的情况
		data["entity"] = word
		data["introduction"], data["tag"] = "", []string{}
		data["attribute"], data["relation"], data["ambiguity"] = kgNodeSlice{}, kgNodeSlice{}, kgNodeSlice{}

		getGroupItems(res, data)

		c.JSON(http.StatusOK, gin.H{
			"res": gin.H{
				"data":  data,
				"links": body.Links,
			},
		})
	}
}

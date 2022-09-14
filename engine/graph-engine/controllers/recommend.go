// Package services 为接口的控制逻辑
// - 描述：搜一搜 入口
// - 时间：2021-2-22

package controllers

import (
	"graph-engine/models/orient"
	"graph-engine/utils"
	"net/http"
	"strconv"
	"strings"
)

type RecommendRes struct {
	Res []Entities `json:"res"`
}
type Entities struct {
	Name string `json:"name"`
}

func Recommend(id, class string, limit int) (httpcode int, res interface{}) {

	var recRes RecommendRes
	recRes.Res = make([]Entities, 0)

	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if id == k.ID {
			conf = k
			break
		}
	}

	var recOrient = orient.RecommendOrientRes{}

	err = recOrient.Recommend(&conf, class, limit)
	if err != nil {
		return 500, err
	}
	if recOrient.Res == nil {
		return http.StatusOK, recRes
	}

	for _, r := range recOrient.Res.([]interface{}) {
		rMap := r.(map[string]interface{})

		for k, v := range rMap {
			if v == nil {
				continue
			}

			if strings.HasSuffix(strings.ToLower(k), "name") && len([]rune(v.(string))) != 0 &&
				!IsContain(recRes.Res, v.(string)) && utils.IsContain(recOrient.FulltextProper, k) {
				recRes.Res = append(recRes.Res, Entities{
					Name: v.(string),
				})
				break
			}

		}
		// 随机选100，然后去重，最后返回limit个
		if len(recRes.Res) >= limit {
			break
		}
	}

	if len(recRes.Res) < limit {
		for _, r := range recOrient.Res.([]interface{}) {
			rMap := r.(map[string]interface{})

			for k, v := range rMap {
				if v == nil {
					continue
				}

				switch v.(type) {
				case string:
					{
						v = v.(string)
					}
				case float64:
					{
						v = strconv.FormatFloat(v.(float64), 'f', -1, 64)
					}
				case bool:
					{
						v = strconv.FormatBool(v.(bool))
					}
				}

				if !IsContain(recRes.Res, v.(string)) && utils.IsContain(recOrient.FulltextProper, k) && len([]rune(v.(string))) != 0 {
					recRes.Res = append(recRes.Res, Entities{
						Name: v.(string),
					})

					// 随机选100，然后去重，最后返回limit个
					if len(recRes.Res) >= limit {
						break
					}

					continue

				}
			}
			// 随机选100，然后去重，最后返回limit个
			if len(recRes.Res) >= limit {
				break
			}

		}
	}

	return http.StatusOK, recRes
}

func IsContain(items []Entities, item string) bool {
	for _, eachItem := range items {
		if eachItem.Name == item {
			return true
		}
	}
	return false
}

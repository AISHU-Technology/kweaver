// Package controllers 为接口的控制逻辑
// - 描述：分析报告 入口
// - 时间：2021-1-21

package controllers

import (
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"graph-engine/logger"
	"graph-engine/models"
	"graph-engine/models/dao"
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
)

type VInfo struct {
	Name      string
	Class     string
	Gns       string
	In        interface{}
	Out       interface{}
	DsAddress string
	DsID      int
}

type AnalysisRes struct {
	Res AnaRes `json:"res"`
}

type AnaRes struct {
	Name    string      `json:"name"`
	Content []string    `json:"content"`
	Entity  []VPosition `json:"entity"`
}

type VPosition struct {
	WordName      string `json:"word_name"`
	VClass        string `json:"v_class"`
	VAlias        string `json:"v_alias"`
	VColor        string `json:"v_color"`
	VProper       string `json:"v_proper"`
	StartIndex    int    `json:"start_index"`
	EndIndex      int    `json:"end_index"`
	LineIndex     int    `json:"line_index"`
	SelectedIndex int    `json:"selected_index"`
	//Color string	`json:"color"`
	BeforeWord string `json:"before_word"`
	UniqueMark int    `json:"unique_mark"`
	RepeatFreq int    `json:"repeat_freq"`
}

func Analysis(id, rid string) (httpcode int, res interface{}) {

	kgid, _ := strconv.Atoi(id)

	var anaRes AnaRes
	anaRes.Entity = make([]VPosition, 0)
	anaRes.Content = make([]string, 0)

	var result AnalysisRes

	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if id == k.ID {
			// 导入的图谱不存在分析报告
			if k.KGConfID == "-1" {
				return 500, utils.ErrInfo(utils.ErrInternalErr, errors.New("analysis report unavailable"))
			}

			conf = k
			break
		}
	}

	var rec VInfo

	queryRes, err := models.Analysis(&conf, rid)
	if err != nil {
		return 500, err
	}

	switch queryRes.(type) {
	case orient.AnalysisRes:
		anaOrient := queryRes.(orient.AnalysisRes)

		if anaOrient.Res == nil {
			return http.StatusOK, nil
		}

		for _, r := range anaOrient.Res.([]interface{}) {
			rMap := r.(map[string]interface{})

			for _, t := range rMap {
				tMap := t.(map[string]interface{})
				rec = VInfo{
					Name:  tMap["name"].(string),
					Class: tMap["@class"].(string),
					Gns:   tMap["gns"].(string),
					In:    tMap["in"].(interface{}),
					Out:   tMap["out"].(interface{}),
				}

				if _, ok := tMap["_ds_id_"]; !ok {
					return 500, utils.ErrInfo(utils.ErrInternalErr, errors.New("missing ds_id"))
				}
				rec.DsID, _ = strconv.Atoi(tMap["_ds_id_"].(string))
			}
		}

	case nebula.AnalysisRes:
		anaNebula := queryRes.(nebula.AnalysisRes)

		if anaNebula.Res == nil {
			return http.StatusOK, nil
		}

		rec = VInfo{
			Name:  anaNebula.Res.Name,
			Class: anaNebula.Res.Class,
			Gns:   anaNebula.Res.Gns,
			In:    anaNebula.Res.In,
			Out:   anaNebula.Res.Out,
		}
		rec.DsID, _ = strconv.Atoi(anaNebula.Res.DsID)
	}

	// https验证
	http.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{InsecureSkipVerify: true}

	// builder获取asToken
	accessToken, err := getAccessTokenByBuilder(rec.DsID)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	logger.Info(accessToken)

	// 获取数据源ds_address，ds_port
	authInfo, err := dao.GetDsAuthInfo(rec.DsID)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	dsAddress := utils.LastString(strings.Split(authInfo.DsAddress, "//"))

	// 获取as版本
	//getConfigUrl := fmt.Sprintf(utils.UrlCONF.AnyShareUrl.GetConfig, dsAddress, authInfo.DsPort)  // 7.0.1.5版本
	getConfigUrl := fmt.Sprintf(utils.UrlCONF.AnyShareUrl.DeployManager, dsAddress, "8080")
	serverVersion, _ := getASServerVersion(getConfigUrl)
	//if err != nil {
	//	return 500, utils.NewError(utils.ErrInternalErr, err)
	//}

	// 因7.0.2.5 获取版本接口变更，所以版本信息为空时，默认给7.0.1.8
	if serverVersion == "" {
		serverVersion = "7.0.1.8"
	}

	// 分版本获取文档内容
	var content string
	// 按/切分gns，并取最后一个
	gns := utils.LastString(strings.Split(rec.Gns, "/"))

	switch {
	case serverVersion >= "7.0.1.8":
		indexUrl := fmt.Sprintf(utils.UrlCONF.AnyShareUrl.GetIndex, dsAddress, authInfo.DsPort, gns, "content")
		contentResp, err := utils.ASGetHttpResponseWithToken("GET", indexUrl, accessToken, nil)
		if err != nil {
			return 500, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		if _, ok := contentResp["content"]; !ok {
			return 500, utils.ErrInfo(utils.ErrESContentErr, errors.New("missing content"))
		}
		content = contentResp["content"].(string)
	default:
		// es读取内容, 无需token
		urlStr := fmt.Sprintf(utils.UrlCONF.AnyShareUrl.ESAPI, dsAddress, authInfo.DsPort, gns)

		resp, err := http.Get(urlStr)
		if err != nil {
			return 500, utils.ErrInfo(utils.ErrASAddressErr, err)
		}

		esBytes, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return 500, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		//utils.EscapeInvalidC(&bytes)

		var response map[string]interface{}
		err = json.Unmarshal(esBytes, &response)
		if err != nil {
			return 500, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		if _, ok := response["_source"]; !ok {
			return 500, utils.ErrInfo(utils.ErrESContentErr, errors.New("missing _source"))
		}
		source := response["_source"].(map[string]interface{})

		if _, ok := source["content"]; !ok {
			return 500, utils.ErrInfo(utils.ErrESContentErr, errors.New("missing content"))
		}
		content = source["content"].(string)
	}

	if content == "" {
		anaRes.Name = rec.Name
		result.Res = anaRes
		return http.StatusOK, result
	}

	// 分行处理：读取文本先按照换行符拆分
	var contentList []string
	con := strings.Split(content, "\n")
	for _, c := range con {
		// 超过1000行，截断
		if len(contentList) < 1000 {
			cStr := strings.TrimSpace(c)
			cRune := []rune(cStr)
			switch {
			case len(cRune) == 0:
				continue
			case 0 < len(cRune):
				contentList = append(contentList, cStr)
			}
		} else {
			break
		}
	}
	// 超过2000行，截断
	//if len(contentList) >= 2000 {
	//	contentList = contentList[0:2000]
	//}
	anaRes.Content = contentList

	var indexList utils.IndexList

	uniqueId := 0

	// 不展示以下一度关系
	var classRange = []string{"folder", "text", "chapter"}

	model, err := dao.GetClassModelType(kgid)
	if err != nil {
		return
	}

	for num, line := range contentList {
		for _, s := range rec.In.([]interface{}) {
			anaRes.Str2content(s, classRange, indexList, line, num, uniqueId, model)
		}

		for _, s := range rec.Out.([]interface{}) {
			anaRes.Str2content(s, classRange, indexList, line, num, uniqueId, model)
		}
	}

	anaRes.Name = rec.Name

	result.Res = anaRes
	return http.StatusOK, result

}

func (anaRes *AnaRes) Str2content(s interface{}, classRange []string, indexList utils.IndexList, line string, num, uniqueId int, model *dao.Model) {
	var subStr, vporper string

	// head类取content属性，其余取name属性
	sMap := s.(map[string]interface{})

	// 去除实体类为folder和text的实体
	if utils.IsContain(classRange, sMap["@class"].(string)) {
		return
	}

	if sMap["@class"] == "chapter" {
		for k, v := range sMap {
			if k == "content" {
				vporper = k
				subStr = v.(string)
				break
			} else {
				if ok := strings.HasSuffix(strings.ToLower(k), "content"); ok {
					vporper = k
					subStr = v.(string)
					break
				}
			}
		}
	} else {
		for k, v := range sMap {
			if k == "name" {
				vporper = k
				subStr = v.(string)
				break
			} else {
				if ok := strings.HasSuffix(strings.ToLower(k), "name"); ok {
					vporper = k
					subStr = sMap[k].(string)
					break
				}
			}
		}
	}

	position := utils.StrIndexAll(indexList, line, subStr)

	vp := VPosition{
		WordName:      subStr,
		VClass:        sMap["@class"].(string),
		VProper:       vporper,
		StartIndex:    position.StartIndex,
		EndIndex:      position.EndIndex,
		LineIndex:     num,
		SelectedIndex: 0,
		BeforeWord:    position.BeforeWord,
	}

	if vp.StartIndex == vp.EndIndex {
		return
	} else {
		// 同一行判断且重叠次数
		for _, r := range anaRes.Entity {
			// 唯一标识
			uniqueId++
			vp.UniqueMark = uniqueId

			if vp.LineIndex == r.LineIndex {
				//if (vp.EndIndex >= r.StartIndex && vp.EndIndex <= r.EndIndex) || (vp.StartIndex >= r.StartIndex && vp.EndIndex <= r.EndIndex) ||
				//	(vp.StartIndex >= r.StartIndex && vp.EndIndex >= r.EndIndex) || (vp.StartIndex <= r.StartIndex && vp.EndIndex >= r.EndIndex) {
				//	vp.RepeatFreq = r.RepeatFreq + 1
				//}
				if r.StartIndex >= vp.EndIndex || r.EndIndex <= vp.StartIndex {
					continue
				} else {
					if vp.RepeatFreq > r.RepeatFreq {
						continue
					}
					vp.RepeatFreq = r.RepeatFreq + 1
				}

			}
		}

		// 获取class颜色/别名
		if model != nil {
			for _, e := range model.Entity {
				if vp.VClass == e["name"] {
					vp.VColor = e["colour"].(string)
					vp.VAlias = e["alias"].(string)
					//if len(e["alias"].(string)) == 0 {
					//	vp.VAlias = e["name"].(string)
					//} else {
					//	vp.VAlias = e["alias"].(string)
					//}
				}
			}
		}

		// alias为空则赋值为class
		if vp.VAlias == "" {
			vp.VAlias = vp.VClass
		}

		// 超过1000行，截断
		if len(anaRes.Entity) < 1000 {
			anaRes.Entity = append(anaRes.Entity, vp)
		}
	}
}

func getAccessTokenByBuilder(dsID int) (accessToken string, err error) {
	tokenUrl := fmt.Sprintf(utils.UrlCONF.BuilderUrl.GetAcctoken, utils.CONFIG.BuilderConf.IP+":"+utils.CONFIG.BuilderConf.Port, strconv.Itoa(dsID))
	tokenResp, err := http.Get(tokenUrl)
	if err != nil {
		return "", err
	}

	tokenBytes, err := ioutil.ReadAll(tokenResp.Body)
	if err != nil {
		return "", err
	}
	var tokenRes map[string]interface{}
	err = json.Unmarshal(tokenBytes, &tokenRes)
	if err != nil {
		return "", err
	}

	if _, ok := tokenRes["res"]; !ok {
		return "", err
	}
	for _, t := range tokenRes["res"].(map[string]interface{}) {
		accessToken = t.(string)
	}
	return accessToken, nil
}

func getASServerVersion(getConfigUrl string) (serverVersion string, err error) {
	configResp, err := http.Get(getConfigUrl)
	if err != nil {
		return "", err
	}

	confBytes, err := ioutil.ReadAll(configResp.Body)
	if err != nil {
		return "", err
	}
	var confRes map[string]interface{}
	err = json.Unmarshal(confBytes, &confRes)
	if err != nil {
		return "", err
	}

	serverVersion = strings.Split(confRes["install_package"].(string), "-")[2]
	return serverVersion, nil
}

package controllers

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"graph-engine/logger"
	"graph-engine/models/dao"
	"graph-engine/utils"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func AdvSearch(id, query string, page, size, limit int, header map[string][]string) (httpcode int, response interface{}) {

	host := utils.CONFIG.AlgConf.IP + ":" + utils.CONFIG.AlgConf.Port
	urlStr := fmt.Sprintf(utils.UrlCONF.AdvSearch, host, id)

	req, _ := http.NewRequest("GET", urlStr, nil)
	params := req.URL.Query()
	params.Add("query", query)
	params.Add("page", strconv.Itoa(page))
	params.Add("size", strconv.Itoa(size))
	//params.Add("limit", strconv.Itoa(limit))
	req.URL.RawQuery = params.Encode()

	// 国际化
	req.Header = header

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		logger.Error(err)
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	bytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logger.Error(err)
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var respRes map[string]interface{}

	if resp.StatusCode != 200 {
		err = json.Unmarshal(bytes, &respRes)
		if err != nil {
			return 500, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		// 解析错误
		switch respRes["ErrorCode"] {
		case "AlgServer.ParamError.ConfIDNotExist":
			return 500, utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New(fmt.Sprintf("%v", respRes)))
		case "AlgServer.AdvConfError.KgIDNotExist":
			return 500, utils.ErrInfo(utils.ErrInternalErr, errors.New(fmt.Sprintf("%v", respRes)))
		case "AlgServer.ParamError.FormatError":
			return 400, utils.ErrInfo(utils.ErrArgsErr, errors.New(fmt.Sprintf("%v", respRes)))
		default:
			return 500, utils.ErrInfo(utils.ErrAdvSearchErr, errors.New(fmt.Sprintf("%v", respRes)))
		}
	}

	utils.EscapeInvalidC(&bytes)

	err = json.Unmarshal(bytes, &respRes)
	if err != nil {
		logger.Error(err)
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	return http.StatusOK, respRes
}

type AdvSearchTestBody struct {
	Query       string          `json:"query"`
	Page        int             `json:"page" binding:"required,gt=0"`
	Size        int             `json:"size" binding:"required,gt=0"`
	KGIDS       string          `json:"kg_ids" binding:"required"`
	ConfContent dao.ConfContent `json:"conf_content"`
}

func AdvSearchTest(body AdvSearchTestBody, header map[string][]string) (httpcode int, response interface{}) {
	kgidSplit := strings.Split(body.KGIDS, ",")

	host := utils.CONFIG.AlgConf.IP + ":" + utils.CONFIG.AlgConf.Port
	urlStr := fmt.Sprintf(utils.UrlCONF.AdvSearchTest, host)

	body.KGIDS = strings.Join(kgidSplit, ",")
	b, err := json.Marshal(body)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	req, _ := http.NewRequest("POST", urlStr, bytes.NewBuffer(b))

	// 国际化
	req.Header = header

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		logger.Error(err)
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	defer resp.Body.Close()

	bytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		logger.Error(err)
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var respRes map[string]interface{}

	if resp.StatusCode != 200 {
		err = json.Unmarshal(bytes, &respRes)
		if err != nil {
			return 500, utils.ErrInfo(utils.ErrInternalErr, err)
		}
		// 解析错误
		switch respRes["ErrorCode"] {
		case "AlgServer.ParamError.ConfIDNotExist":
			return 500, utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New(fmt.Sprintf("%v", respRes)))
		case "AlgServer.AdvConfError.KgIDNotExist":
			return 500, utils.ErrInfo(utils.ErrInternalErr, errors.New(fmt.Sprintf("%v", respRes)))
		case "AlgServer.ParamError.FormatError":
			return 400, utils.ErrInfo(utils.ErrArgsErr, errors.New(fmt.Sprintf("%v", respRes)))
		default:
			return 500, utils.ErrInfo(utils.ErrAdvSearchErr, errors.New(fmt.Sprintf("%v", respRes)))
		}
	}

	utils.EscapeInvalidC(&bytes)

	err = json.Unmarshal(bytes, &respRes)
	if err != nil {
		logger.Error(err)
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	return http.StatusOK, respRes
}

func AdvSearchDocument(eventid string, kgid string, query string, page, size, limit int, header map[string][]string, dataIds string) (httpcode int, response interface{}) {
	var res map[string]interface{}

	t := time.Now()
	l := fmt.Sprintf("begin time: %s", time.Since(t))
	logger.Info(l)
	var trueKgids []string
	var trueKgid string
	// kgid 可为空
	if kgid == "" {
		kgids, err := dao.GetConfKGID()
		if err != nil {
			return 500, utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New("knowledge_graph or adv_conf does not exist"))
		}
		if dataIds != "" {
			filter := strings.Split(dataIds, ",")
			for _, a_kgid := range kgids {
				id := strconv.Itoa(a_kgid)
				if utils.In(id, filter) == true {
					trueKgids = append(trueKgids, id)
				}
			}
		} else {
			//dataIds == ""
			for _, a_kgid := range kgids {
				id := strconv.Itoa(a_kgid)
				trueKgids = append(trueKgids, id)
			}
		}
		if trueKgids == nil {
			return 500, utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New("knowledge_graph or adv_conf does not exist"))
		}
		trueKgid = strings.Join(trueKgids, ",")
		l = fmt.Sprintf("get ConfKGID time: %s", time.Since(t))
		logger.Info(l)
	} else {
		//kgid != ""
		if dataIds != "" {
			filter := strings.Split(dataIds, ",")
			kgids := strings.Split(kgid, ",")
			for _, a_kgid := range kgids {
				if utils.In(a_kgid, filter) == true {
					trueKgids = append(trueKgids, a_kgid)
				}
			}
			if trueKgids == nil {
				return 500, utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New("knowledge_graph or adv_conf does not exist"))
			}
			trueKgid = strings.Join(trueKgids, ",")
		} else {
			trueKgid = kgid
		}
	}

	//else{
	//	// 过滤没有高级配置的图谱id
	//	filterKgidArray, err := dao.FilterKgidNoAdvConf(kgid)
	//	if err != nil {
	//		return 500, err
	//	}
	//
	//	l = fmt.Sprintf("filter no advConf kg time: %s", time.Since(t))
	//	logger.Info(l)
	//	if len(filterKgidArray) == 0 {
	//		return 500, utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New("adv_conf not exist"))
	//	}
	//}
	//
	//	kgid = strings.Join(kgids, ",")
	//
	//	l = fmt.Sprintf("judge auth operation rights time: %s", time.Since(t))
	//	logger.Info(l)
	//

	//	//// 用户无可查看的图谱
	//	//if len(falseKgids) != 0 {
	//	//	return 403, utils.ErrInfo(utils.ErrRightsErr, errors.New(fmt.Sprintf("knowledge graph %s invalid rights", strings.Join(falseKgids, ","))))
	//	//}
	//	//kgid = strings.Join(trueKgids, ",")

	//filter
	//这里的过滤方式过于臃肿复杂，需要优化

	host := utils.CONFIG.AlgConf.IP + ":" + utils.CONFIG.AlgConf.Port
	urlStr := fmt.Sprintf(utils.UrlCONF.AdvSearch2AS, host)

	req, _ := http.NewRequest("GET", urlStr, nil)
	req.Header.Set("Event-Id", eventid)
	params := req.URL.Query()
	params.Add("kg_id", trueKgid)
	params.Add("query", query)
	params.Add("page", strconv.Itoa(page))
	params.Add("size", strconv.Itoa(size))
	req.URL.RawQuery = params.Encode()

	// 国际化
	req.Header = header

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		logger.Error(err)
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	l = fmt.Sprintf("adv-search time: %s", time.Since(t))
	logger.Info(l)

	bytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	if resp.StatusCode != 200 {
		err = json.Unmarshal(bytes, &res)
		if err != nil {
			return 500, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		// 解析错误
		switch res["ErrorCode"] {
		case "AlgServer.ParamError.ConfIDNotExist":
			return 500, utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New(fmt.Sprintf("%v", res)))
		case "AlgServer.AdvConfError.KgIDNotExist":
			return 500, utils.ErrInfo(utils.ErrInternalErr, errors.New(fmt.Sprintf("%v", res)))
		case "AlgServer.ParamError.FormatError":
			return 400, utils.ErrInfo(utils.ErrArgsErr, errors.New(fmt.Sprintf("%v", res)))
		default:
			return 500, utils.ErrInfo(utils.ErrAdvSearchErr, errors.New(fmt.Sprintf("%v", res)))
		}
	}

	utils.EscapeInvalidC(&bytes)

	err = json.Unmarshal(bytes, &res)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	l = fmt.Sprintf("total time: %s", time.Since(t))
	logger.Info(l)

	return http.StatusOK, res
}

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

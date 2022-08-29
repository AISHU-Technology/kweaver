package controllers

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"graph-engine/logger"
	"graph-engine/utils"
	"io"
	"io/ioutil"
	"net/http"
	"sync"
	"time"
)

func etlArrayV1(inputRes interface{}) ([]interface{}, error) {
	inputByte, err := json.Marshal(inputRes)
	if err != nil {
		return nil, err
	}
	var mapResult []interface{}
	err = json.Unmarshal(inputByte, &mapResult)
	if err != nil {
		return nil, err
	}
	return mapResult, err
}

func etlMap(inputRes interface{}) (map[string]interface{}, error) {
	inputByte, err := json.Marshal(inputRes)
	if err != nil {
		return nil, err
	}
	var mapResult map[string]interface{}
	err = json.Unmarshal(inputByte, &mapResult)
	if err != nil {
		return nil, err
	}
	return mapResult, err
}

func etlString(inputRes interface{}) (string, error) {
	inputByte, err := json.Marshal(inputRes)
	if err != nil {
		return "", err
	}
	var resStr string
	err = json.Unmarshal(inputByte, &resStr)
	if err != nil {
		return "", err
	}
	return resStr, err
}

func etlInt(inputRes interface{}) (int, error) {
	inputByte, err := json.Marshal(inputRes)
	if err != nil {
		return 0, err
	}
	var resInt int
	err = json.Unmarshal(inputByte, &resInt)
	if err != nil {
		return 0, err
	}
	return resInt, err
}

func etlDataV1(inputRes interface{}) ([]map[string]int, error) {
	inputByte, err := json.Marshal(inputRes)
	if err != nil {
		return nil, err
	}
	var resInt []map[string]int
	err = json.Unmarshal(inputByte, &resInt)
	if err != nil {
		return nil, err
	}
	return resInt, err
}

func etlArrayV2(inputRes interface{}) ([]string, error) {
	inputByte, err := json.Marshal(inputRes)
	if err != nil {
		return []string{}, err
	}
	var resStr []string
	err = json.Unmarshal(inputByte, &resStr)
	if err != nil {
		return []string{}, err
	}
	return resStr, err
}

func etlArrayBool(inputRes interface{}) ([]bool, error) {
	inputByte, err := json.Marshal(inputRes)
	if err != nil {
		return []bool{}, err
	}
	var resStr []bool
	err = json.Unmarshal(inputByte, &resStr)
	if err != nil {
		return []bool{}, err
	}
	return resStr, err
}

type FileEle struct {
	FileGns  interface{} `json:"file_gns"`
	FileName interface{} `json:"file_name"`
}

type SynInfo struct {
	TaskKgTopicTs    int
	TaskTime         int64
	TaskKgTopicCount int
}

type QueryRes struct {
	Res   interface{} `json:"result"`
	Error interface{} `json:"errors"`
}

type KCQueryRes struct {
	Code interface{} `json:"code"`
	Msg  interface{} `json:"msg"`
	Data interface{} `json:"data"`
}

type TopicResV2 struct {
	TopicId   string              `json:"topic_id"`
	TopicName string              `json:"topic_name"`
	TopicDesc string              `json:"topic_desc"`
	Source    int                 `json:"source"`
	TopicType int                 `json:"topic_type"`
	IsVirtual int                 `json:"is_virtual"`
	UserIds   map[string][]string `json:"user_ids"`
	Files     []FileEle           `json:"files"`
	Tags      map[string][]string `json:"tags"`
}

func httpPost(url string, inputBody TopicResV2, repeatTime int) {
	//logger.Info(inputBody)
	payloadBuf := new(bytes.Buffer)
	err := json.NewEncoder(payloadBuf).Encode(inputBody)

	req, err := http.NewRequest("POST", url, payloadBuf)
	if err != nil {
		logger.Error(err)
		return
	}
	req.Header.Set("Accept-Encoding", "gzip,deflate")
	req.Header.Set("Content-Type", "application/json")
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr, Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		logger.Error(err)
		if repeatTime < 3 {
			httpPost(url, inputBody, repeatTime+1)
		}
		return
	}
	body, err := ioutil.ReadAll(resp.Body)
	var qr KCQueryRes
	err = json.Unmarshal(body, &qr)
	logger.Info(url)
	logger.Info(qr)

	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			logger.Error(err)
		}
	}(resp.Body)

}

func httpPostV2(url string, inputBody CallBackBody, repeatTime int) {
	payloadBuf := new(bytes.Buffer)
	err := json.NewEncoder(payloadBuf).Encode(inputBody)

	req, err := http.NewRequest("POST", url, payloadBuf)
	if err != nil {
		logger.Error(err)
		return
	}
	req.Header.Set("Accept-Encoding", "gzip,deflate")
	req.Header.Set("Content-Type", "application/json")
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	client := &http.Client{Transport: tr, Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		logger.Error(err)
		if repeatTime < 3 {
			httpPostV2(url, inputBody, repeatTime+1)
		} else {
			logger.Error(url, "execeed 3 time")

		}
		return
	}
	var qr KCQueryRes
	body, err := ioutil.ReadAll(resp.Body)
	err = json.Unmarshal(body, &qr)
	logger.Info(qr)
	logger.Info(url, "success call back")
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			logger.Error(err)
		}
	}(resp.Body)

}

// engine 的查询有问题，没有关闭请求，这里用自己实现的方法 ╮(╯▽╰)╭
func httpOrientPost(conf utils.KGConf, sql string) (QueryRes, error) {
	//payloadBuf := new(bytes.Buffer)
	//json.NewEncoder(payloadBuf).Encode(inputBody)
	url := conf.URL + "/command/" + conf.DB + "/sql"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte("{\"command\":\""+sql+"\"}")))
	if err != nil {
		fmt.Println(err)
	}
	req.Header.Set("Accept-Encoding", "gzip,deflate")
	req.Header.Set("Content-Type", "application/json")
	//req.SetBasicAuth(conf.User, conf.Pwd)
	req.SetBasicAuth("admin", "admin")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
	}

	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {

		}
	}(resp.Body)

	//fmt.Println("response Status:", resp.Status)
	//fmt.Println("response Headers:", resp.Header)
	body, err := ioutil.ReadAll(resp.Body)
	var qr QueryRes
	err = json.Unmarshal(body, &qr)
	return qr, err
	//fmt.Println("response Body:", string(body))

}

type CallBackBody struct {
	TaskStatus       int   `json:"task_status"`
	TaskTime         int64 `json:"task_time"`
	TaskKgTopicCount int   `json:"task_kg_topic_count"`
	TaskKgTopicTs    int   `json:"task_kg_topic_ts"`
}

func RemoveRepByMap(slc []string) []string {
	var result []string
	tempMap := map[string]byte{} // 存放不重复主键
	for _, e := range slc {
		l := len(tempMap)
		tempMap[e] = 0
		if len(tempMap) != l { // 加入map后，map长度变化，则元素不重复
			result = append(result, e)
		}
	}
	return result
}

// TopicSyn 同步主题任务
func TopicSyn(conf utils.KGConf, kcIp string, kcTs int, quit *chan int) (res SynInfo, err error) {
	var wg sync.WaitGroup
	ch := make(chan struct{}, 100)

	startTime := time.Now().Unix()
	synDataCount := 0
	batchNum := 100
	startIndx := 0
	maxTs := kcTs
	ifNext := true
	for ifNext {
		sql := "select * from `label` where type_nw=true skip %d limit %d"
		sql = fmt.Sprintf(sql, startIndx, batchNum)
		if kcTs > 0 {
			sql = "select * from `label` where type_nw=true and timestamp>%d skip %d limit %d"
			sql = fmt.Sprintf(sql, kcTs, startIndx, batchNum)
		}

		queryRes, vErr := httpOrientPost(conf, sql)
		if vErr != nil {
			fmt.Println(sql)
			fmt.Println(vErr)
			break
		}

		mapResult, _ := etlArrayV1(queryRes.Res)
		//fmt.Println(len(mapResult))

		if len(mapResult) < batchNum {
			ifNext = false
		}

		startIndx += batchNum

		for _, v := range mapResult {
			mr, _ := etlMap(v)
			rid := mr["@rid"]
			topicName := mr["name"]

			ridStr, _ := etlString(rid)
			topicNameStr, _ := etlString(topicName)

			nsql := "select out('label2document'), out('label2document').editor, out('label2document').creator, timestamp from %s"
			nsql = fmt.Sprintf(nsql, rid)

			nqueryRes, vErr := httpOrientPost(conf, nsql)
			if vErr != nil {
				fmt.Println(nsql)
				fmt.Println(vErr)
				continue
			}

			nresDict, _ := etlArrayV1(nqueryRes.Res)
			if len(nresDict) == 0 {
				fmt.Println(nresDict)
				fmt.Println(topicName)
				continue
			}
			//fmt.Println(nresDict)
			//fmt.Println(topicName)
			nresDictIn, _ := etlMap(nresDict[0])

			docRid := nresDictIn["out('label2document')"]
			editorId := nresDictIn["out('label2document').editor"]
			creatorId := nresDictIn["out('label2document').creator"]
			labelTs := nresDictIn["timestamp"]
			if labelTs != nil {
				labelTsInt, _ := etlInt(labelTs)
				if labelTsInt > maxTs {
					maxTs = labelTsInt
				}
			}

			var userIds map[string][]string
			userIds = make(map[string][]string)
			editorList, _ := etlArrayV2(editorId)
			creatorlist, _ := etlArrayV2(creatorId)
			userIds["editor"] = RemoveRepByMap(editorList)
			userIds["creator"] = RemoveRepByMap(creatorlist)

			var docContent []FileEle
			docRidArray, _ := etlArrayV1(docRid)

			// 主题相关的文档数量小于2就过滤
			if len(docRidArray) < 2 {
				continue
			}

			var docTagsArray []string
			for _, dRid := range docRidArray {
				queryDocumentElementsSql := "select name, gns, in('label2document').name, in('label2document').type_as  from %s"
				queryDocumentElementsSql = fmt.Sprintf(queryDocumentElementsSql, dRid)

				docResDict, vErr := httpOrientPost(conf, queryDocumentElementsSql)
				if vErr != nil {
					fmt.Println(vErr)
					continue
				}
				ndocResDict, etlErr := etlArrayV1(docResDict.Res)
				if etlErr != nil {
					fmt.Println(etlErr)
					continue
				}
				ndocResDictIn, _ := etlMap(ndocResDict[0])
				subFileEle := FileEle{
					FileGns:  ndocResDictIn["gns"],
					FileName: ndocResDictIn["name"],
				}
				docContent = append(docContent, subFileEle)

				subDocTags, _ := etlArrayV2(ndocResDictIn["in('label2document').name"])
				subDocTagType, _ := etlArrayBool(ndocResDictIn["in('label2document').type_as"])

				for i, sdt := range subDocTagType {
					if !sdt {
						continue
					}
					docTagsArray = append(docTagsArray, subDocTags[i])
				}

			}
			//const dlen = docTags.Len()
			var iTags map[string][]string
			iTags = make(map[string][]string)
			iTags["file_tag"] = RemoveRepByMap(docTagsArray)
			iTags["floder"] = []string{}

			body := &TopicResV2{
				TopicId:   ridStr,
				TopicName: topicNameStr,
				TopicDesc: "",
				Source:    200,
				TopicType: 10,
				IsVirtual: 1,
				UserIds:   userIds,
				Files:     docContent,
				Tags:      iTags,
			}
			select {
			case <-*quit:
				ifNext = false
				break
			default:
				ch <- struct{}{}
				url := "%s/api/kc-topic/kc-topicpool-topic"
				url = fmt.Sprintf(url, kcIp)
				//fmt.Println(url)
				wg.Add(1)
				go func() {
					defer wg.Done()
					httpPost(url, *body, 0)
					<-ch
				}()
				synDataCount += 1
			}
		}

	}

	endTime := time.Now().Unix()
	wg.Wait()

	//if maxTs == 0 {
	//	maxTs = 1
	//}

	synInfo := SynInfo{TaskKgTopicTs: maxTs, TaskTime: endTime - startTime, TaskKgTopicCount: synDataCount}
	logger.Info(synInfo)
	return synInfo, nil
}

func TopicGet(conf utils.KGConf, kcTs int, page int, size int) (res []TopicResV2, dCount int, err error) {

	maxTs := kcTs

	var synDataRes = make([]TopicResV2, 0)

	var sql = "select * from `label` where type_nw=true skip %d limit %d"
	sql = fmt.Sprintf(sql, page*size, size)

	countSql := "select count(*) from `label` where type_nw=true"

	if kcTs > 0 {
		sql = "select * from `label` where type_nw=true and timestamp>%d skip %d limit %d"
		sql = fmt.Sprintf(sql, kcTs, page*size, size)
		countSql = "select count(*) from `label` where type_nw=true and timestamp>%d"
		countSql = fmt.Sprintf(countSql, kcTs)
	}
	var countData, _ = httpOrientPost(conf, countSql)
	countDataInfo, _ := etlDataV1(countData.Res)
	countDataInt := countDataInfo[0]["count(*)"]

	queryRes, vErr := httpOrientPost(conf, sql)
	if vErr != nil {

		return nil, 0, vErr
	}

	mapResult, mrErr := etlArrayV1(queryRes.Res)
	if mrErr != nil {

		return nil, 0, mrErr
	}

	for _, v := range mapResult {
		mr, _ := etlMap(v)
		rid := mr["@rid"]
		topicName := mr["name"]

		ridStr, _ := etlString(rid)
		topicNameStr, _ := etlString(topicName)

		nsql := "select out('label2document'), out('label2document').editor, out('label2document').creator, ts from %s"
		nsql = fmt.Sprintf(nsql, rid)

		nqueryRes, vErr := httpOrientPost(conf, nsql)
		if vErr != nil {
			fmt.Println(nsql)
			fmt.Println(vErr)
			continue
		}

		nresDict, _ := etlArrayV1(nqueryRes.Res)
		nresDictIn, _ := etlMap(nresDict[0])

		docRid := nresDictIn["out('label2document')"]
		editorId := nresDictIn["out('label2document').editor"]
		creatorId := nresDictIn["out('label2document').creator"]
		labelTs := nresDictIn["ts"]
		if labelTs != nil {
			labelTsInt, _ := etlInt(labelTs)
			if labelTsInt > maxTs {
				maxTs = labelTsInt
			}
		}

		var userIds map[string][]string
		userIds = make(map[string][]string)
		editorList, _ := etlArrayV2(editorId)
		creatorList, _ := etlArrayV2(creatorId)
		userIds["editor"] = RemoveRepByMap(editorList)
		userIds["creator"] = RemoveRepByMap(creatorList)

		var docContent []FileEle
		docRidArray, _ := etlArrayV1(docRid)

		// 主题相关的文档数量小于2就过滤
		if len(docRidArray) < 2 {
			continue
		}
		var docTagsArray []string
		for _, dRid := range docRidArray {
			queryDocumentElementsSql := "select name, gns, in('label2document').name, in('label2document').type_as  from %s"
			queryDocumentElementsSql = fmt.Sprintf(queryDocumentElementsSql, dRid)

			docResDict, vErr := httpOrientPost(conf, queryDocumentElementsSql)
			if vErr != nil {
				fmt.Println(vErr)
				continue
			}
			ndocResDict, etlErr := etlArrayV1(docResDict.Res)
			if etlErr != nil {
				fmt.Println(etlErr)
				continue
			}
			ndocResDictIn, _ := etlMap(ndocResDict[0])
			subFileEle := FileEle{
				FileGns:  ndocResDictIn["gns"],
				FileName: ndocResDictIn["name"],
			}
			docContent = append(docContent, subFileEle)

			subDocTags, _ := etlArrayV2(ndocResDictIn["in('label2document').name"])
			subDocTagType, _ := etlArrayBool(ndocResDictIn["in('label2document').type_as"])

			for i, sdt := range subDocTagType {
				if !sdt {
					continue
				}
				docTagsArray = append(docTagsArray, subDocTags[i])
			}

		}
		//const dlen = docTags.Len()
		var iTags map[string][]string
		iTags = make(map[string][]string)
		iTags["file_tag"] = RemoveRepByMap(docTagsArray)
		iTags["floder"] = []string{}

		body := TopicResV2{
			TopicId:   ridStr,
			TopicName: topicNameStr,
			TopicDesc: "",
			Source:    200,
			TopicType: 10,
			IsVirtual: 1,
			UserIds:   userIds,
			Files:     docContent,
			Tags:      iTags,
		}
		synDataRes = append(synDataRes, body)

	}

	return synDataRes, countDataInt, nil
}

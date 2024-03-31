// Package builder builder 接口调用出站实现
package builder

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	jsoniter "github.com/json-iterator/go"
	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/logic/repo"
	"kw-graph/utils/httpclient"
)

// 编译器检查是否异常
var _ repo.BuilderRepo = (*builder)(nil)

type builder struct {
	httpClient  httpclient.HTTPClient
	builderHost string
	builderPort int
}

// NewBuilderRepo builder 对象实例化
func NewBuilderRepo(httpClient httpclient.HTTPClient, builderHost string, builderPort int) repo.BuilderRepo {
	return &builder{
		httpClient:  httpClient,
		builderHost: builderHost,
		builderPort: builderPort,
	}
}

// GetOntologyInfo 获取本体信息
func (b *builder) GetOntologyInfo(ctx context.Context, kgID string) (*repo.OntologyInfo, error) {
	url := fmt.Sprintf("http://%s:%d/api/builder/v1/graph/info/onto?graph_id=%s&compensation_cache=true", b.builderHost, b.builderPort, kgID)
	respCode, respBody, err := b.httpClient.Get(url, map[string]string{})
	if err != nil {
		return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get ontology info faied: "+err.Error())
	}

	ontology := &repo.OntologyInfo{
		Entities: make(map[string]*repo.Class),
		Egdes:    make(map[string]*repo.Class),
	}

	var resp map[string]interface{}
	err = jsoniter.Unmarshal(respBody, &resp)
	if err != nil {
		// Unmarshal失败时转成内部错误, body为空Unmarshal失败
		return nil, errorCode.New(http.StatusInternalServerError, errorCode.AuthErr, "data auth get permission faied: "+err.Error())
	}

	if respCode != http.StatusOK {
		if errInfo, ok := resp["ErrorDetails"]; ok {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, errInfo.(string))
		} else {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, string(respBody))
		}
	}

	if res, ok := resp["res"]; ok {
		for _, vertex := range res.(map[string]interface{})["entity"].([]interface{}) {
			v := vertex.(map[string]interface{})
			vClass := &repo.Class{
				Name:       v["name"].(string),
				Color:      v["color"].(string),
				Alias:      v["alias"].(string),
				Icon:       v["icon"].(string),
				Properties: make(map[string]*repo.Property),
			}
			if val, ok := v["default_tag"].(string); ok {
				vClass.DefaultProperty = val
			}

			for _, prop := range v["properties"].([]interface{}) {
				p := &repo.Property{
					Name:  prop.(map[string]interface{})["name"].(string),
					Alias: prop.(map[string]interface{})["alias"].(string),
					Type:  prop.(map[string]interface{})["type"].(string),
				}
				vClass.Properties[p.Name] = p
			}
			ontology.Entities[vClass.Name] = vClass
		}

		for _, edge := range res.(map[string]interface{})["edge"].([]interface{}) {
			v := edge.(map[string]interface{})
			vClass := &repo.Class{
				Name:       v["name"].(string),
				Color:      v["color"].(string),
				Alias:      v["alias"].(string),
				Properties: make(map[string]*repo.Property),
			}

			for _, prop := range v["properties"].([]interface{}) {
				p := &repo.Property{
					Name:  prop.(map[string]interface{})["name"].(string),
					Alias: prop.(map[string]interface{})["alias"].(string),
					Type:  prop.(map[string]interface{})["type"].(string),
				}
				vClass.Properties[p.Name] = p
			}
			ontology.Egdes[vClass.Name] = vClass
		}
	}

	return ontology, nil
}

// GetKGSpaceByKgID 根据kg_id 获取Nebula数据库名
func (b *builder) GetKGSpaceByKgID(ctx context.Context, kgID string) (string, error) {
	url := fmt.Sprintf("http://%s:%d/api/builder/v1/graph/info/basic?graph_id=%s&key=[\"graphdb_dbname\"]", b.builderHost, b.builderPort, kgID)
	respCode, respBody, err := b.httpClient.Get(url, map[string]string{})
	if err != nil {
		return "", errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get kg space by kg_id faied: "+err.Error())
	}

	var resp map[string]interface{}
	err = jsoniter.Unmarshal(respBody, &resp)
	if err != nil {
		// Unmarshal失败时转成内部错误, body为空Unmarshal失败
		return "", errorCode.New(http.StatusInternalServerError, errorCode.AuthErr, "Builder get kg space by kg_id faied: "+err.Error())
	}

	if respCode != http.StatusOK {
		if errInfo, ok := resp["ErrorDetails"]; ok {
			return "", errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, errInfo.(string))
		} else {
			return "", errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, string(respBody))
		}
	}

	if res, ok := resp["res"]; ok {
		if graphName, ok := res.(map[string]interface{})["graphdb_dbname"]; ok {
			return graphName.(string), nil
		}
	}

	return "", nil
}

// GetKGNameByKgID 根据图谱id获取图谱名称
func (b *builder) GetKGNameByKgID(ctx context.Context, kgID string) (string, error) {
	url := fmt.Sprintf("http://%s:%d/api/builder/v1/graph/info/basic?graph_id=%s&key=[\"graphdb_dbname\"]", b.builderHost, b.builderPort, kgID)
	respCode, respBody, err := b.httpClient.Get(url, map[string]string{})
	if err != nil {
		return "", errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get kg name by kg_id faied: "+err.Error())
	}

	var resp map[string]interface{}
	err = jsoniter.Unmarshal(respBody, &resp)
	if err != nil {
		// Unmarshal失败时转成内部错误, body为空Unmarshal失败
		return "", errorCode.New(http.StatusInternalServerError, errorCode.AuthErr, "Builder get kg name by kg_id faied: "+err.Error())
	}

	if respCode != http.StatusOK {
		if errInfo, ok := resp["ErrorDetails"]; ok {
			return "", errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, errInfo.(string))
		} else {
			return "", errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, string(respBody))
		}
	}

	if res, ok := resp["res"]; ok {
		if space, ok := res.(map[string]interface{})["name"]; ok {
			return space.(string), nil
		}
	}

	return "", nil
}

// GetKgIDsByKnwID 根据知识网络id获取图谱id
func (b *builder) GetKgIDsByKnwID(ctx context.Context, knwID string) (map[string]string, error) {
	count := 1
	kgIDs := map[string]string{}
	var url string
	for {
		url = fmt.Sprintf("http://%s:%d/api/builder/v1/knw/get_graph_by_knw?filter=all&knw_id=%s&page=1&size=%d&order=desc&name=&rule=update", b.builderHost, b.builderPort, knwID, count)
		respCode, respBody, err := b.httpClient.Get(url, map[string]string{})
		if err != nil {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get kg ids by knw_id faied: "+err.Error())
		}

		var resp map[string]interface{}
		err = jsoniter.Unmarshal(respBody, &resp)
		if err != nil {
			// Unmarshal失败时转成内部错误, body为空Unmarshal失败
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.AuthErr, "Builder get kg ids by knw_id faied: "+err.Error())
		}

		if respCode != http.StatusOK {
			if errInfo, ok := resp["ErrorDetails"]; ok {
				return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, errInfo.(string))
			} else {
				return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, string(respBody))
			}
		}

		if res, ok := resp["res"]; ok {
			for _, df := range res.(map[string]interface{})["df"].([]interface{}) {
				kgConfID := strconv.Itoa(int(df.(map[string]interface{})["id"].(float64)))
				name := df.(map[string]interface{})["name"].(string)
				kgIDs[kgConfID] = name
			}
			if int(res.(map[string]interface{})["count"].(float64)) > len(kgIDs) {
				count += 1
			} else {
				return kgIDs, nil
			}
		}
	}
}

// GetKgIDByKdbName 根据kdbname获取kgid
func (b *builder) GetKgIDByKdbName(ctx context.Context, kdbName string) (string, error) {
	info := map[string]interface{}{
		"dbnames": []string{kdbName},
	}

	reqBody, err := jsoniter.Marshal(info)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("http://%s:%d/api/builder/v1/open/graph/getidbydbname", b.builderHost, b.builderPort)

	headers := map[string]string{
		"Content-Type": "application/json",
	}
	respCode, respBody, err := b.httpClient.Post(url, headers, reqBody)
	if err != nil {
		return "", errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get kg_id by kdb_name faied: "+string(respBody))
	}

	var resp map[string]interface{}
	err = jsoniter.Unmarshal(respBody, &resp)
	if err != nil {
		// Unmarshal失败时转成内部错误, body为空Unmarshal失败

		return "", errorCode.New(http.StatusInternalServerError, errorCode.AuthErr, "Builder get kg name by kg_id faied: "+err.Error())
	}

	if respCode != http.StatusOK {
		if errInfo, ok := resp["ErrorDetails"]; ok {
			return "", errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, errInfo.(string))
		} else {
			return "", errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, string(respBody))
		}
	}

	if name, ok := resp[kdbName]; ok {
		if infoMap, ok := name.(map[string]interface{}); ok {
			if id, ok := infoMap["id"].(float64); ok {
				return strconv.Itoa(int(id)), nil
			}
		}
	}

	return "-1", nil
}

func (b *builder) GetKgInfoByKgID(ctx context.Context, kgID string) (*repo.KgInfo, error) {
	url := fmt.Sprintf("http://%s:%d/api/builder/v1/graph/info/basic?graph_id=%s", b.builderHost, b.builderPort, kgID)
	respCode, respBody, err := b.httpClient.Get(url, map[string]string{})
	if err != nil {
		return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get kg info by kg_id faied: "+err.Error())
	}

	var resp map[string]interface{}
	err = jsoniter.Unmarshal(respBody, &resp)
	if err != nil {
		// Unmarshal失败时转成内部错误, body为空Unmarshal失败

		return nil, errorCode.New(http.StatusInternalServerError, errorCode.AuthErr, "Builder get kg info by kg_id faied: "+err.Error())
	}

	if respCode != http.StatusOK {
		if errInfo, ok := resp["ErrorDetails"]; ok {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, errInfo.(string))
		} else {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, string(respBody))
		}
	}

	result := &repo.KgInfo{}
	if res, ok := resp["res"]; ok {
		jsonByte, err := jsoniter.Marshal(res)
		if err != nil {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get kg info by kg_id faied: "+err.Error())
		}

		err = jsoniter.Unmarshal(jsonByte, result)
		if err != nil {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get kg info by kg_id faied: "+err.Error())
		}
	}

	return result, nil
}

// GetKgIDsByKnwID 根据知识网络id获取图谱信息
func (b *builder) GetKgsByKnwID(ctx context.Context, knwID string) (map[string]*repo.KgInfo, error) {
	count := 10000
	kgs := map[string]*repo.KgInfo{}
	url := fmt.Sprintf("http://%s:%d/api/builder/v1/knw/get_graph_by_knw?filter=all&knw_id=%s&page=1&size=%d&order=desc&name=&rule=update", b.builderHost, b.builderPort, knwID, count)
	respCode, respBody, err := b.httpClient.Get(url, map[string]string{})
	if err != nil {
		return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get kg ids by knw_id faied: "+err.Error())
	}

	var resp map[string]interface{}
	err = jsoniter.Unmarshal(respBody, &resp)
	if err != nil {
		return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get kgs by knw_id faied: "+err.Error())
	}
	if respCode != http.StatusOK {
		if errInfo, ok := resp["ErrorDetails"]; ok {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, errInfo.(string))
		} else {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, string(respBody))
		}
	}

	if res, ok := resp["res"]; ok {
		for _, df := range res.(map[string]interface{})["df"].([]interface{}) {
			kgID := int(df.(map[string]interface{})["id"].(float64))
			kg := &repo.KgInfo{
				ID:          kgID,
				Name:        df.(map[string]interface{})["name"].(string),
				OtlID:       0,
				Status:      "",
				GraphDBName: df.(map[string]interface{})["graph_db_name"].(string),
				TaskStatus:  "",
				GraphDes:    "",
				KnwID:       strconv.Itoa(int(df.(map[string]interface{})["knw_id"].(float64))),
			}

			kgs[strconv.Itoa(kgID)] = kg
		}
		return kgs, nil
	} else {

		return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get kgs by knw_id faied: "+err.Error())
	}
}

// GetOntologyDetailInfoByKgID 根据图谱id获取本体信息
func (b *builder) GetOntologyDetailInfoByKgID(ctx context.Context, kgID string) (*repo.OntologyDetailInfo, error) {
	url := fmt.Sprintf("http://%s:%d/api/builder/v1/onto/getbykgid/%s", b.builderHost, b.builderPort, kgID)
	respCode, respBody, err := b.httpClient.Get(url, map[string]string{})
	if err != nil {
		return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, "Builder get ontology info faied: "+err.Error())
	}

	ontology := &repo.OntologyDetailInfo{}
	var resp map[string]interface{}
	err = jsoniter.Unmarshal(respBody, &resp)
	if err != nil {
		// Unmarshal失败时转成内部错误, body为空Unmarshal失败
		return nil, errorCode.New(http.StatusInternalServerError, errorCode.AuthErr, "Builder get ontology detail faied: "+err.Error())
	}

	if respCode != http.StatusOK {
		if errInfo, ok := resp["ErrorDetails"]; ok {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, errInfo.(string))
		} else {
			return nil, errorCode.New(http.StatusInternalServerError, errorCode.BuilderErr, string(respBody))
		}
	}

	if res, ok := resp["res"]; ok {
		ontology.UpdateTime = res.(map[string]interface{})["update_time"].(string)
	}

	return ontology, nil
}

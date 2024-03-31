package opensearch

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"

	opensearchV2 "github.com/opensearch-project/opensearch-go/v2"
	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/logic/repo"
)

// 编译器检查是否异常
var _ repo.OpenSearchRepo = (*opensearch)(nil)

type opensearch struct {
	openSearchConfig opensearchV2.Config
}

const (
	// MAXSIZE opensearch 查询最大值
	MAXSIZE = 1000

	// DEFAULTSIZE opensearch 查询数量默认值
	DEFAULTSIZE = 100
)

// NewOpenSearchRepo opensearch 对象实例化
func NewOpenSearchRepo(openSearchConfig opensearchV2.Config) repo.OpenSearchRepo {
	return &opensearch{
		openSearchConfig: openSearchConfig,
	}
}

// NewOpenSearchClient 初始化 open search 客户端
func NewOpenSearchClient(host, user, pass string, port int) opensearchV2.Config {
	url := fmt.Sprintf("http://%s:%d", host, port)
	cfg := opensearchV2.Config{
		Addresses: []string{
			url,
		},
		Username: user,
		Password: pass,
		Transport: &http.Transport{
			MaxIdleConnsPerHost:   10,
			ResponseHeaderTimeout: 10 * time.Second,
			DialContext:           (&net.Dialer{Timeout: 10 * time.Second}).DialContext,
			TLSClientConfig: &tls.Config{
				MinVersion: tls.VersionTLS11,
			},
		},
	}

	return cfg
}

// GetVidsByVertexSearch 点搜索接口从OpenSearch获取点
func (op *opensearch) GetVidsByVertexSearch(ctx context.Context, kDBName string, tags []string, query string) (*repo.VertexesInfo, error) {
	content := strings.NewReader(fmt.Sprintf(`{
		"query": {
			"bool": {
				"must": [
					{
						"multi_match": {
							"query": "%s"

						}
					}
				],
				"should": [
					{
						"multi_match": {
							"query": "%s",
							"type": "phrase"
						}
					}
				]
			}
		}
	}`, query, query))

	index := ""
	if len(tags) > 0 {
		for index, tag := range tags {
			tags[index] = kDBName + "_" + strings.ToLower(tag)
		}
		index = strings.Join(tags, ",")
	} else {
		index = kDBName + "_*"
	}

	opsearch, err := opensearchV2.NewClient(op.openSearchConfig)
	if err != nil {
		return nil, errorCode.New(http.StatusInternalServerError, errorCode.OpenSearchErr, err.Error())
	}

	res, err := opsearch.Search(
		opsearch.Search.WithContext(context.Background()),
		opsearch.Search.WithIndex(index),
		opsearch.Search.WithBody(content),
		opsearch.Search.WithFrom(0),       // Starting index of the search results
		opsearch.Search.WithSize(MAXSIZE), // Number of search results to return
	)
	if err != nil {
		fmt.Println("Error performing the search: ", err)

		return nil, errorCode.New(http.StatusInternalServerError, errorCode.OpenSearchErr, err.Error())
	}

	body, _ := io.ReadAll(res.Body)

	if res.StatusCode != http.StatusOK {
		return nil, errorCode.New(http.StatusInternalServerError, errorCode.OpenSearchErr, string(body))
	}

	searchRes := map[string]interface{}{}
	err = json.Unmarshal(body, &searchRes)
	if err != nil {
		return nil, err
	}

	ids := []string{}
	if res, ok := searchRes["hits"]; ok {
		for _, hit := range res.(map[string]interface{})["hits"].([]interface{}) {
			ids = append(ids, hit.(map[string]interface{})["_id"].(string))
		}
	}
	return &repo.VertexesInfo{
		Vids: ids,
	}, nil
}

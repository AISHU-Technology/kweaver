package nebula

import (
	"bytes"
	"encoding/json"
	"fmt"
	"graph-engine/logger"
	"graph-engine/models/dao"
	"graph-engine/utils"
	"net/http"
)

type OpenSearch struct{}

func (os OpenSearch) FullTextIndexesList(fulltextID string) (map[string]interface{}, error) {
	osConf, err := dao.GetOSConfig(fulltextID)
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrOpenSearchErr, err)
	}

	urlStr := fmt.Sprintf(utils.UrlCONF.OpenSearchUrl.FullTextList, osConf.IP+":"+osConf.Port)

	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrOpenSearchErr, err)
	}

	//req.SetBasicAuth(osConf.User, osConf.PWD)
	_bytes, err := utils.GetHTTPResponseWithAuth(req, osConf.User, osConf.PWD)
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrOpenSearchErr, err)
	}
	logger.Info(req.URL.String())

	var respRes map[string]interface{}

	err = json.Unmarshal(_bytes, &respRes)
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrOpenSearchErr, err)
	}
	return respRes, nil
}

type SearchWithHLBody struct {
	Query Query     `json:"query"`
	HL    HighLight `json:"highlight"`
	From  int       `json:"from"`
	Size  int       `json:"size"`
}
type Match struct {
	Query    string   `json:"query"`
	Fields   []string `json:"fields"`
	Operator string   `json:"operator"`
	Type     string   `json:"type"`
}
type MultiMatch struct {
	Match Match `json:"multi_match"`
}
type HighLight struct {
	PreTags  []string               `json:"pre_tags"`
	PostTags []string               `json:"post_tags"`
	Fields   map[string]interface{} `json:"fields"`
}
type Query struct {
	Bool Bool `json:"bool"`
}
type Bool struct {
	Must   []MultiMatch `json:"must"`
	Should []MultiMatch `json:"should"`
}

func (os OpenSearch) SerachWithHL(fulltextID string, fullTextName string, query string,
	fields []string, operator string, preTags, postTags []string, sizeOptional ...int) (map[string]interface{}, error) {
	size := 1000
	from := 0
	if len(sizeOptional) > 0 {
		size = sizeOptional[0]
		from = sizeOptional[1]
	}

	osConf, err := dao.GetOSConfig(fulltextID)
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrOpenSearchErr, err)
	}

	urlStr := fmt.Sprintf(utils.UrlCONF.OpenSearchUrl.Search, osConf.IP+":"+osConf.Port, fullTextName)

	fieldsMap := map[string]interface{}{}
	for _, field := range fields {
		fieldsMap[field] = map[string]interface{}{}
	}
	searchWithHLBody := SearchWithHLBody{
		Query: Query{
			Bool: Bool{
				Must: []MultiMatch{{
					Match: Match{
						Query:    query,
						Fields:   fields,
						Operator: operator,
						Type:     "best_fields",
					},
				}},
				Should: []MultiMatch{{
					Match: Match{
						Query:    query,
						Fields:   fields,
						Operator: operator,
						Type:     "phrase_prefix",
					},
				}},
			},
		},

		HL: HighLight{
			PreTags:  preTags,
			PostTags: postTags,
			Fields:   fieldsMap,
		},
		From: from,
		Size: size,
	}
	b, err := json.Marshal(searchWithHLBody)
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrOpenSearchErr, err)
	}

	body := bytes.NewBuffer(b)

	req, err := http.NewRequest("GET", urlStr, body)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrOpenSearchErr, err)
	}

	//req.SetBasicAuth(osConf.User, osConf.PWD)
	_bytes, err := utils.GetHTTPResponseWithAuth(req, osConf.User, osConf.PWD)
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrOpenSearchErr, err)
	}

	logger.Info(req.URL.String())

	var respRes map[string]interface{}

	err = json.Unmarshal(_bytes, &respRes)
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrOpenSearchErr, err)
	}
	return respRes, nil
}

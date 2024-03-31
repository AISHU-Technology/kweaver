package basic

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"kw-graph/internal/common"
	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/graphdb/nebula"
	"kw-graph/internal/logic/repo"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
	"kw-graph/utils"

	jsoniter "github.com/json-iterator/go"
	"github.com/zeromicro/go-zero/core/logx"
)

// FullTextSearchLogic 全文检索对象结构
type FullTextSearchLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewFullTextSearchLogic 全文检索对象实例化
func NewFullTextSearchLogic(ctx context.Context, svcCtx *svc.ServiceContext) *FullTextSearchLogic {
	return &FullTextSearchLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// FullTextSearch 全文检索实现
func (l *FullTextSearchLogic) FullTextSearch(conf *types.FullTextRequest) (*repo.FTSearchResult, *repo.OntologyInfo, error) {
	// 获取本体信息
	ontology, err := l.svcCtx.Builder.GetOntologyInfo(l.ctx, conf.KgID)
	if err != nil {
		return nil, nil, err
	}

	// 获取图谱名称
	space, err := l.svcCtx.Builder.GetKGSpaceByKgID(l.ctx, conf.KgID)
	if err != nil {
		return nil, nil, err
	}

	needCheckConfByte, _ := jsoniter.Marshal(conf)
	var needCheckConf map[string]interface{}
	_ = jsoniter.Unmarshal(needCheckConfByte, &needCheckConf)
	// 参数校验，并拼接筛选语句
	filterMap, err := CheckParamsValidity(l.ctx, needCheckConf, space, l.svcCtx.Nebula)
	if err != nil {
		return nil, nil, err
	}

	// 参数校验完成后，对filterMap提取tag
	tags := []string{}
	for tag := range filterMap {
		tags = append(tags, tag)
	}

	searchRes := &repo.FTSearchResult{}

	if conf.Query != "" {
		ids, err := l.svcCtx.OpenSearch.GetVidsByVertexSearch(l.ctx, space, tags, conf.Query)
		if err != nil {

			return nil, nil, err
		}

		if conf.MatchingRule == "portion" {
			conf.Query = ""
		}
		vInfos, num, err := l.svcCtx.GraphBasicSearchRepo.QueryAllOfVids(l.ctx, needCheckConf, filterMap, conf.Query, ids.Vids, space)
		if err != nil {

			return nil, nil, err
		}
		searchRes.NebulaVInfos = vInfos
		searchRes.Total = num
	} else {
		vInfos, err := l.svcCtx.GraphBasicSearchRepo.QueryAllOnEmptyQuery(l.ctx, needCheckConf, filterMap, "", []string{}, space)
		if err != nil {

			return nil, nil, err
		}
		searchRes.NebulaVInfos = vInfos
		searchRes.Total = len(vInfos)
	}
	// result := InformationEncapsulation(searchRes)
	return searchRes, ontology, nil
}

// FullTextSearch 全文检索实现
func InformationEncapsulation(searchRes *repo.FTSearchResult) *repo.VerticesResponseCore {
	ftResp := &repo.VerticesResponseCore{
		Count:  int64(searchRes.Total),
		Result: make([]*repo.VertexGroupCore, 0),
	}

	for _, res := range searchRes.NebulaVInfos {
		tagRes := &repo.VertexGroupCore{
			Tag: res.Tag,
		}
		for _, vertex := range res.Vertex {
			v := &repo.VertexCore{
				ID:   vertex.ID,
				Tags: vertex.Tags,
			}

			for tag, props := range vertex.Properties {
				p := &repo.PropertiesCore{
					Tag:   tag,
					Props: make([]*repo.PropsCore, 0),
				}

				for propName, propVal := range props {
					prop := &repo.PropsCore{
						Name:     propName,
						Value:    propVal.Value,
						PropType: propVal.Type,
					}
					if prop.Value == "" {
						prop.Value = "__NULL__"
					}
					p.Props = append(p.Props, prop)
				}
				v.Properties = append(v.Properties, p)
			}
			tagRes.Vertices = append(tagRes.Vertices, v)
		}
		ftResp.Result = append(ftResp.Result, tagRes)
	}

	return ftResp
}

// CheckParamsValidity 检查参数是否有效
func CheckParamsValidity(ctx context.Context, conf map[string]interface{}, kDBName string, nebula nebula.NebulaExecuteRepo) (map[string][]string, error) {
	filterMap := map[string][]string{}

	tags, err := nebula.ShowTags(ctx, kDBName)
	if err != nil {
		return nil, err
	}
	if conf["search_config"] != nil {
		for _, config := range conf["search_config"].([]interface{}) {
			if _, ok := filterMap[config.(map[string]interface{})["tag"].(string)]; ok {
				return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Tag:%s is duplicated", config.(map[string]interface{})["tag"].(string)))
			}

			isExists := false
			for _, tag := range tags {
				if tag == config.(map[string]interface{})["tag"].(string) {
					isExists = true
				}
			}

			// 判断tag是否在该图谱存在
			if !isExists {
				return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "Tag not found in space")
			}

			filterMap[config.(map[string]interface{})["tag"].(string)] = []string{}

			tagInfo, err := nebula.DescTag(ctx, kDBName, config.(map[string]interface{})["tag"].(string))
			if err != nil {
				return nil, err
			}

			propMap := map[string]string{}
			for _, prop := range tagInfo.Properties {
				propMap[prop.Name] = prop.Type
			}
			if config.(map[string]interface{})["properties"] != nil {
				for _, prop := range config.(map[string]interface{})["properties"].([]interface{}) {
					proFilter := ""
					if val, ok := propMap[prop.(map[string]interface{})["name"].(string)]; ok {
						if utils.In(val, common.STRING) {
							if opVal, ok := common.STRING2NEBULAOPMAP[prop.(map[string]interface{})["operation"].(string)]; ok {
								proFilter = fmt.Sprintf("%s.%s.%s", "`"+tagInfo.Name+"`", "`"+tagInfo.Name+"`", "`"+prop.(map[string]interface{})["name"].(string)+"`"+opVal+"'"+prop.(map[string]interface{})["op_value"].(string)+"'")
							} else {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid operation: %s", prop.(map[string]interface{})["operation"].(string)))
							}
						} else if utils.In(val, common.NUMBER) {
							// 数值转换判断是否有效
							if _, err := strconv.ParseFloat(prop.(map[string]interface{})["op_value"].(string), 64); err != nil {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid column value: %s", prop.(map[string]interface{})["op_value"].(string)))
							}

							if opVal, ok := common.NUMBER2NEBULAOPMAP[prop.(map[string]interface{})["operation"].(string)]; ok {
								proFilter = fmt.Sprintf("%s.%s.%s", "`"+tagInfo.Name+"`", "`"+tagInfo.Name+"`", "`"+prop.(map[string]interface{})["name"].(string)+"`"+opVal+"'"+prop.(map[string]interface{})["op_value"].(string)+"'")
							} else {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid operation: %s", prop.(map[string]interface{})["operation"].(string)))
							}
						} else if utils.In(val, common.INTEGER) {
							// int转换判断是否有效
							if _, err := strconv.Atoi(prop.(map[string]interface{})["op_value"].(string)); err != nil {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid column value: %s", prop.(map[string]interface{})["op_value"].(string)))
							}

							if opVal, ok := common.NUMBER2NEBULAOPMAP[prop.(map[string]interface{})["operation"].(string)]; ok {
								proFilter = fmt.Sprintf("%s.%s.%s", "`"+tagInfo.Name+"`", "`"+tagInfo.Name+"`", "`"+prop.(map[string]interface{})["name"].(string)+"`"+opVal+"'"+prop.(map[string]interface{})["op_value"].(string)+"'")
							} else {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid operation: %s", prop.(map[string]interface{})["operation"].(string)))
							}
						} else if utils.In(val, common.BOOL) {
							// bool转换判断是否有效
							boolRes := strings.ToLower(prop.(map[string]interface{})["op_value"].(string))
							if !utils.In(boolRes, []string{"true", "false"}) {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid column value: %s", prop.(map[string]interface{})["op_value"].(string)))
							}

							if opVal, ok := common.NUMBER2NEBULAOPMAP[prop.(map[string]interface{})["operation"].(string)]; ok {
								proFilter = fmt.Sprintf("%s.%s.%s", "`"+tagInfo.Name+"`", "`"+tagInfo.Name+"`", "`"+prop.(map[string]interface{})["name"].(string)+"`"+opVal+"'"+prop.(map[string]interface{})["op_value"].(string)+"'")
							} else {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid operation: %s", prop.(map[string]interface{})["operation"].(string)))
							}
						} else if val == "date" {
							if opVal, ok := common.NUMBER2NEBULAOPMAP[prop.(map[string]interface{})["operation"].(string)]; ok {
								proFilter = fmt.Sprintf("%s.%s.%s", "`"+tagInfo.Name+"`", "`"+tagInfo.Name+"`", "`"+prop.(map[string]interface{})["name"].(string)+"`"+opVal+"date('"+prop.(map[string]interface{})["op_value"].(string)+"')")
							} else {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid operation: %s", prop.(map[string]interface{})["operation"].(string)))
							}
						} else if val == "time" {
							if opVal, ok := common.NUMBER2NEBULAOPMAP[prop.(map[string]interface{})["operation"].(string)]; ok {
								proFilter = fmt.Sprintf("%s.%s.%s", "`"+tagInfo.Name+"`", "`"+tagInfo.Name+"`", "`"+prop.(map[string]interface{})["name"].(string)+"`"+opVal+"time('"+prop.(map[string]interface{})["op_value"].(string)+"')")
							} else {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid operation: %s", prop.(map[string]interface{})["operation"].(string)))
							}
						} else if val == "datetime" {
							if opVal, ok := common.NUMBER2NEBULAOPMAP[prop.(map[string]interface{})["operation"].(string)]; ok {
								proFilter = fmt.Sprintf("%s.%s.%s", "`"+tagInfo.Name+"`", "`"+tagInfo.Name+"`", "`"+prop.(map[string]interface{})["name"].(string)+"`"+opVal+"datetime('"+prop.(map[string]interface{})["op_value"].(string)+"')")
							} else {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid operation: %s", prop.(map[string]interface{})["operation"].(string)))
							}
						} else if val == "timestamp" {
							if opVal, ok := common.NUMBER2NEBULAOPMAP[prop.(map[string]interface{})["operation"].(string)]; ok {
								proFilter = fmt.Sprintf("%s.%s.%s", "`"+tagInfo.Name+"`", "`"+tagInfo.Name+"`", "`"+prop.(map[string]interface{})["name"].(string)+"`"+opVal+"timestamp('"+prop.(map[string]interface{})["op_value"].(string)+"')")
							} else {
								return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Invalid operation: %s", prop.(map[string]interface{})["operation"].(string)))
							}
						}
					} else {
						return nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("Property: %s not found", prop.(map[string]interface{})["name"].(string)))
					}
					filterMap[config.(map[string]interface{})["tag"].(string)] = append(filterMap[config.(map[string]interface{})["tag"].(string)], proFilter)
				}
			}

		}
	}

	return filterMap, nil
}

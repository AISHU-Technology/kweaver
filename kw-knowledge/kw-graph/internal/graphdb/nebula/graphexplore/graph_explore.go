// Package graphexplore 探索数据库层
package graphexplore

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	mapset "github.com/deckarep/golang-set/v2"
	"github.com/zeromicro/go-zero/core/logx"
	"kw-graph/internal/common"
	errorCode "kw-graph/internal/errors"
	model "kw-graph/internal/graphdb/nebula"
	"kw-graph/internal/logic/repo"
	"kw-graph/internal/types"
	"kw-graph/utils"
)

// 编译器检查是否异常
var _ repo.GraphExploreRepo = (*graphExploreRepo)(nil)

type graphExploreRepo struct {
	nebula model.NebulaExecuteRepo
}

// NewGraphExploreRepo 数据层图探索对象实例化
func NewGraphExploreRepo(nebulaRepo model.NebulaExecuteRepo) repo.GraphExploreRepo {
	return &graphExploreRepo{
		nebula: nebulaRepo,
	}
}

// NeighborsBasic 邻居查询基础版
func (ge graphExploreRepo) NeighborsBasic(ctx context.Context, vids []string, steps int, direction string, edges []string, space string) (resV map[string]*repo.Vertex, resE map[string]*repo.Edge, err error) {
	// 基础邻居查询，使用over指定经过的边，不使用where，步数为1-n跳
	// 拼接查询语句
	var directionNGql = ""
	if direction == string(common.BIDIRECT) {
		directionNGql = "BIDIRECT"
	}
	if direction == string(common.REVERSE) {
		directionNGql = "REVERSELY"
	}
	var edgesNgql = ""
	if len(edges) == 0 {
		edgesNgql = "*"
	} else {
		for _, edge := range edges {
			edgesNgql += "`" + edge + "`,"
		}
		edgesNgql = strings.TrimRight(edgesNgql, ",")
	}
	var vidsNGql = ""
	for _, vid := range vids {
		vidsNGql += "\"" + vid + "\","
	}
	vidsNGql = strings.TrimRight(vidsNGql, ",")
	if steps <= 0 {
		steps = 1
	}
	var nGql = fmt.Sprintf(" GO 0 to %d steps FROM %s OVER %s %s YIELD $$ as end, edge as e ",
		steps, vidsNGql, edgesNgql, directionNGql)

	res, _, err := ge.nebula.Execute(ctx, nGql, space, false)
	if err != nil {
		return nil, nil, err
	}

	// 解析结果为map，点的属性以tag为key分类
	resV = make(map[string]*repo.Vertex)
	resE = make(map[string]*repo.Edge)
	number := 0
	for i := 0; i < res.GetRowSize(); i++ {
		rowValue, _ := res.GetRowValuesByIndex(i)
		vWarp, _ := rowValue.GetValueByIndex(0)
		// 遇到悬挂边，丢掉这个点和边的结果，
		// 在基础查询的逻辑中，起点-不存在的点A-存在的点B 的形式是可以得到点B的
		if vWarp.IsNull() {
			continue
		}
		v, _ := vWarp.AsNode()
		eWarp, _ := rowValue.GetValueByIndex(1)
		e, _ := eWarp.AsRelationship()

		var vertex repo.Vertex
		vertex.Number = number
		vertex.ID = utils.TrimQuotationMarks(v.GetID().String())
		vertex.Tags = v.GetTags()
		vertex.Properties = make(map[string]map[string]*repo.Prop)
		for _, tag := range v.GetTags() {
			vertex.Properties[tag] = make(map[string]*repo.Prop)
			prop, _ := v.Properties(tag)
			for propName, propValue := range prop {
				p := &repo.Prop{
					Value: utils.TrimQuotationMarks(propValue.String()),
					Type:  propValue.GetType(),
				}
				vertex.Properties[tag][propName] = p
			}
		}
		resV[vertex.ID] = &vertex
		// 解析边的结果
		var edge repo.Edge
		edge.Number = number
		edge.SrcID = utils.TrimQuotationMarks(e.GetSrcVertexID().String())
		edge.DstID = utils.TrimQuotationMarks(e.GetDstVertexID().String())
		edge.Type = e.GetEdgeName()
		edge.Rank = int(e.GetRanking())
		edge.Properties = make(map[string]*repo.Prop)
		for propName, propValue := range e.Properties() {
			p := &repo.Prop{
				Value: utils.TrimQuotationMarks(propValue.String()),
				Type:  propValue.GetType(),
			}
			edge.Properties[propName] = p
		}
		eid := edge.Type + ":" + edge.SrcID + "-" + edge.DstID
		resE[eid] = &edge
		number += 1
	}

	return resV, resE, nil
}

func (ge graphExploreRepo) Neighbors(ctx context.Context, vids []string, steps int, direction string, edges []string, filters []*types.Filter, space string) ([]*repo.NebulaNeighborsRes, error) {
	// 高级邻居查询，目前使用时固定只查1跳，使用where进行复杂条件筛选，由上层多次调用并筛选拼接结果
	var directionNGql = ""
	if direction == string(common.BIDIRECT) {
		directionNGql = "BIDIRECT"
	}
	if direction == string(common.REVERSE) {
		directionNGql = "REVERSELY"
	}
	var edgesNgql = ""
	if len(edges) == 0 {
		edgesNgql = "*"
	} else {
		for _, edge := range edges {
			edgesNgql += "`" + edge + "`,"
		}
		edgesNgql = strings.TrimRight(edgesNgql, ",")
	}
	var vidsNGql = ""
	for _, vid := range vids {
		vidsNGql += "\"" + vid + "\","
	}
	vidsNGql = strings.TrimRight(vidsNGql, ",")
	if steps <= 0 {
		steps = 1
	}
	filtersNGql, err := ge.parseNeighborsFilter(ctx, filters, space)
	if err != nil {
		return nil, err
	}

	var nGql = fmt.Sprintf(" GO 0 to %d steps FROM %s OVER %s %s %s YIELD $$ as end, edge as e ",
		steps, vidsNGql, edgesNgql, directionNGql, filtersNGql)

	res, _, err := ge.nebula.Execute(ctx, nGql, space, false)
	if err != nil {
		return nil, err
	}

	neighbors := make([]*repo.NebulaNeighborsRes, 0)
	// 点的处理与基础邻居查询相同
	for i := 0; i < res.GetRowSize(); i++ {
		var neighborsGroup repo.NebulaNeighborsRes
		rowValue, _ := res.GetRowValuesByIndex(i)

		vWarp, _ := rowValue.GetValueByIndex(0)

		// 遇到悬挂边，丢掉这个点和边的结果，其连接的后续的点也会在logic层筛掉
		if vWarp.IsNull() {
			continue
		}
		v, _ := vWarp.AsNode()
		eWarp, _ := rowValue.GetValueByIndex(1)
		e, _ := eWarp.AsRelationship()

		var vertex repo.Vertex
		vertex.ID = utils.TrimQuotationMarks(v.GetID().String())
		vertex.Tags = v.GetTags()
		vertex.Properties = make(map[string]map[string]*repo.Prop)
		for _, tag := range v.GetTags() {
			vertex.Properties[tag] = make(map[string]*repo.Prop)
			prop, _ := v.Properties(tag)
			for propName, propValue := range prop {
				p := &repo.Prop{
					Value: utils.TrimQuotationMarks(propValue.String()),
					Type:  propValue.GetType(),
				}
				vertex.Properties[tag][propName] = p
			}
		}
		neighborsGroup.V = &vertex

		// 边的返回信息带有查询起点和得到的结果点信息，而不是按边的方向存储
		var edge repo.Edge
		srcID := utils.TrimQuotationMarks(e.GetSrcVertexID().String())
		dstID := utils.TrimQuotationMarks(e.GetDstVertexID().String())

		edge.SrcID = srcID
		edge.DstID = dstID
		edge.Type = e.GetEdgeName()
		edge.Rank = int(e.GetRanking())
		edge.Properties = make(map[string]*repo.Prop)
		for propName, propValue := range e.Properties() {
			p := &repo.Prop{
				Value: utils.TrimQuotationMarks(propValue.String()),
				Type:  propValue.GetType(),
			}
			edge.Properties[propName] = p
		}

		neighborsGroup.E = &edge

		neighbors = append(neighbors, &neighborsGroup)
	}

	return neighbors, nil
}

// ExpandV 点探索
func (ge graphExploreRepo) ExpandV(ctx context.Context, vids []string, space string) (map[string]*repo.ExpandVRes, error) {
	res := make(map[string]*repo.ExpandVRes)
	for _, vid := range vids {
		outEGql := fmt.Sprintf("GO FROM '%s' OVER * YIELD id($$) as v, type(EDGE) AS type | GROUP BY $-.type YIELD $-.type AS type, COUNT($-.v) as count;", vid)

		outRes, _, err := ge.nebula.Execute(ctx, outEGql, space, false)
		if err != nil {
			return nil, err
		}

		inEGql := fmt.Sprintf("GO FROM '%s' OVER * REVERSELY YIELD id($$) as v, type(EDGE) AS type | GROUP BY $-.type YIELD $-.type AS type, COUNT($-.v) as count;", vid)

		inRes, _, err := ge.nebula.Execute(ctx, inEGql, space, false)
		if err != nil {
			return nil, err
		}
		var expandVRes repo.ExpandVRes
		for i := 0; i < inRes.GetRowSize(); i++ {
			rowValue, _ := inRes.GetRowValuesByIndex(i)
			typeWrap, _ := rowValue.GetValueByIndex(0)
			countWrap, _ := rowValue.GetValueByIndex(1)
			var edge repo.ExpandVEdge
			edge.EdgeClass, _ = typeWrap.AsString()
			edge.Count, _ = countWrap.AsInt()
			expandVRes.InE = append(expandVRes.InE, &edge)
		}
		for i := 0; i < outRes.GetRowSize(); i++ {
			rowValue, _ := outRes.GetRowValuesByIndex(i)
			typeWrap, _ := rowValue.GetValueByIndex(0)
			countWrap, _ := rowValue.GetValueByIndex(1)
			var edge repo.ExpandVEdge
			edge.EdgeClass, _ = typeWrap.AsString()
			edge.Count, _ = countWrap.AsInt()
			expandVRes.OutE = append(expandVRes.OutE, &edge)
		}
		res[vid] = &expandVRes
	}
	return res, nil
}

func (ge graphExploreRepo) parseNeighborsFilter(ctx context.Context, filters []*types.Filter, space string) (string, error) {
	// 解析拼接过滤条件
	nGql := ""
	/* 一个语句示例
	where
	(
		(
			(
				"enterprise" in tags($$) and properties($$).`name` == "name" and properties($$).`xx` == "aaa"
			)
			or
			(
				"enterprise1" in tags($$) and properties($$).`name1` == "name1" or properties($$).`xx` == "aaa"
			)
		)
	and
		(
			(
				type(edge) == "enterprise_2_zone"  and properties(edge).`_timestamp_` ==  1681896143
			)
			or
			(
				type(edge) == "enterprise_2_zone"  and properties(edge).`_timestamp_` ==  1681896143
			)
		)
	)
	or // filter之间固定为or
	(下一个filter)
	*/

	firstFilterFlag := true
	for _, filter := range filters {
		// 如果没有点只有边的筛选条件，边和点之间少一层and
		vFiltersFlag := false
		if len(filter.VFilters) != 0 {
			if firstFilterFlag {
				nGql += "(("
				firstFilterFlag = false
			} else {
				nGql += "or (("
			}

			vFiltersFlag = true   // 存在点的筛选条件，设为true
			firstPropFlag := true // 点里面第一个属性不需要前面加or或and

			for _, vFilter := range filter.VFilters {
				if firstPropFlag {
					firstPropFlag = false
				} else {
					nGql += vFilter.Relation // 加上两个filter之间的or或者and
				}

				if vFilter.Type == string(common.NOTSATISFYALL) || vFilter.Type == string(common.NOTSATISFYANY) {
					nGql += " not " // 如果是反选 最前面加个not
				}
				nGql += " (\"" + vFilter.Tag + "\" " + "in tags($$) " // 过滤条件指定tag

				if len(vFilter.PropertyFilters) != 0 {
					// 属性过滤条件
					filter, err := ge.parsePropFilter(ctx, "v", vFilter.Type, vFilter.Tag, vFilter.PropertyFilters, space)
					if err != nil {
						return "", err
					}
					nGql += filter
				}
				nGql += ")" // 属性过滤条件最后的括号
			}
			nGql += ")" // 这个filter里所有点的筛选条件结束的括号
		}

		if len(filter.EFilters) != 0 {
			if firstFilterFlag { // 为第一个过滤器且过滤器里只有边没有点的情况
				nGql += "(("
				firstFilterFlag = false
			} else if !vFiltersFlag { // 非第一个过滤器但该过滤器里只有边没有点的情况
				nGql += " or(("
			} else {
				nGql += " and("
			}

			firstPropFlag := true // 第一个属性不需要加 or或者and

			for _, eFilter := range filter.EFilters {
				if firstPropFlag {
					firstPropFlag = false
				} else {
					nGql += eFilter.Relation
				}

				if eFilter.Type == string(common.NOTSATISFYALL) || eFilter.Type == string(common.NOTSATISFYANY) {
					nGql += " not "
				}

				nGql += " (type(edge) == \"" + eFilter.EdgeClass + "\" "
				if len(eFilter.PropertyFilters) != 0 {
					filter, err := ge.parsePropFilter(ctx, "e", eFilter.Type, eFilter.EdgeClass, eFilter.PropertyFilters, space)
					if err != nil {
						return "", err
					}
					nGql += filter
				}
				nGql += ")" // 属性筛选条件结束的括号
			}
			nGql += ")" // filter边条件结束的括号
		}
		if vFiltersFlag || len(filter.EFilters) != 0 {
			nGql += ")" // 整个filter结束的括号，如果filter是空的就省去这个，filter与filter之间固定为or，最外层没括号。
		}
	}
	if nGql != "" {
		nGql = "where " + nGql
	}
	return nGql, nil
}

func (ge graphExploreRepo) parsePropFilter(ctx context.Context, dataType string, relationType string,
	className string, propertyFilters []*types.PropertyFilter, space string) (string, error) {
	/*
		处理属性过滤条件
		dataType: v表示点的过滤条件，e表示边的过滤条件,后面全文检索那边也能用这个，再加个dataType就行
		relationType: 表示属性之间的关系为and还是or
		className: 点的tag或边的type
		property_filters: 过滤属性列表
	*/
	firstFilterFlag := true
	nGql := ""
	dataTypeSQL := ""
	var err error

	// 从nebula获取所有属性的数据类型
	var classInfo *model.ClassInfo
	if dataType == "v" {
		dataTypeSQL = "$$"
		classInfo, err = ge.nebula.DescTag(ctx, space, className)
	} else if dataType == "e" {
		dataTypeSQL = "edge"
		classInfo, err = ge.nebula.DescEdge(ctx, space, className)
	}
	if err != nil {
		return "", err
	}

	// 将属性的数据类型转成map
	propTypeMap := make(map[string]string)
	for _, classProp := range classInfo.Properties {
		propTypeMap[classProp.Name] = classProp.Type
	}

	typeFilter := "" // 属性与属性之间的关系
	if relationType == string(common.SATISFYALL) || relationType == string(common.NOTSATISFYANY) {
		typeFilter = " and "
	} else if relationType == string(common.SATISFYANY) || relationType == string(common.NOTSATISFYALL) {
		typeFilter = " or "
	}

	for _, property := range propertyFilters {
		// 处理与上一个属性过滤条件之间的关系
		if firstFilterFlag {
			nGql += "and("
			firstFilterFlag = false
		} else {
			nGql += typeFilter
		}

		// 特殊情况：参数为空则查属性为null，不支持查空字符串
		if property.OpValue == "" {
			if property.Operation == "eq" {
				nGql += "properties(" + dataTypeSQL + ").`" + property.Name + "` is null "
			}
			if property.Operation == "neq" {
				nGql += "properties(" + dataTypeSQL + ").`" + property.Name + "` is not null "
			}
			continue
		}
		propType, ok := propTypeMap[property.Name]
		if !ok {
			return "", errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
				fmt.Sprintf("property does not exist: %s.%s ", className, property.Name))
		}

		nGql += "properties(" + dataTypeSQL + ").`" + property.Name + "` " // properties($$).`name` = "xxx"
		switch {
		case utils.In(propType, common.STRING):
			val, ok := common.STRING2NEBULAOPMAP[property.Operation]
			if !ok {
				return "", errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
					fmt.Sprintf("Invalid operation: %s for type %s.%s : %s",
						property.Operation, className, property.Name, propType))
			}
			nGql += val
			nGql += " \"" + property.OpValue + "\" "

		case utils.In(propType, common.BOOL):
			val, ok := common.BOOL2NEBULAOPMAP[property.Operation]
			if !ok {
				return "", errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
					fmt.Sprintf("Invalid operation: %s for type %s.%s : %s",
						property.Operation, className, property.Name, propType))
			}
			nGql += val
			nGql += " " + property.OpValue

		case utils.In(propType, common.NUMBER) || utils.In(propType, common.INTEGER):
			val, ok := common.NUMBER2NEBULAOPMAP[property.Operation]
			if !ok {
				return "", errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
					fmt.Sprintf("Invalid operation: %s for type %s.%s : %s",
						property.Operation, className, property.Name, propType))
			}
			nGql += val
			nGql += " " + property.OpValue

		case propType == "date":
			val, ok := common.NUMBER2NEBULAOPMAP[property.Operation]
			if !ok {
				return "", errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
					fmt.Sprintf("Invalid operation: %s for type %s.%s : %s",
						property.Operation, className, property.Name, propType))
			}
			nGql += val
			nGql += "date(\"" + utils.ParseTime(property.OpValue) + "\") "

		case propType == "datetime":
			val, ok := common.NUMBER2NEBULAOPMAP[property.Operation]
			if !ok {
				return "", errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
					fmt.Sprintf("Invalid operation: %s for type %s.%s : %s",
						property.Operation, className, property.Name, propType))
			}
			nGql += val
			nGql += "datetime(\"" + utils.ParseTime(property.OpValue) + "\") "

		case propType == "time":
			val, ok := common.NUMBER2NEBULAOPMAP[property.Operation]
			if !ok {
				return "", errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
					fmt.Sprintf("Invalid operation: %s for type %s.%s : %s",
						property.Operation, className, property.Name, propType))
			}
			nGql += val
			nGql += "time(\"" + property.OpValue + "\") "

		default:
			// 暂不支持的类型直接抛错
			return "", errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
				className+"."+property.Name+" : "+propType+" is not supported ")
		}
	}
	if nGql != "" {
		nGql += ")"
	}
	return nGql, nil
}

// Path 路径探索
func (ge graphExploreRepo) Path(ctx context.Context, in *types.PathRequest, space string) (pathList []*repo.PathInfo, vidsList, edgesList []string, err error) {
	gqlFilter, edgeTypeList, err := ge.parsePathFilter(ctx, space, in.Filters)
	if err != nil {
		return nil, nil, nil, err
	}
	gql := ""
	if common.PathType(in.PathType) == common.FULLPATH {
		gql = "FIND ALL PATH"
	} else if common.PathType(in.PathType) == common.SHORTESTPATH {
		if common.PathDecision(in.PathDecision) == common.EDGEQUANTITY {
			gql = "FIND SHORTEST PATH"
		} else if common.PathDecision(in.PathDecision) == common.WEIGHTPROPERTY {
			gql = "FIND NOLOOP PATH"
		} else if in.PathDecision == "" {
			return nil, nil, nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "parameter 'path_decision' is missing!")
		} else {
			return nil, nil, nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "this 'path_decision' is not supported!")
		}
	} else if common.PathType(in.PathType) == common.NOLOOPPATH {
		gql = "FIND NOLOOP PATH"
	} else {
		return nil, nil, nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "this 'path_type' is not supported!")
	}
	gql += " FROM '%s' TO '%s' OVER %s"

	if common.EdgeDirection(in.Direction) == common.REVERSE {
		gql += " REVERSELY"
	} else if common.EdgeDirection(in.Direction) == common.BIDIRECT {
		gql += " BIDIRECT "
	}

	if gqlFilter != "" {
		gql += " WHERE " + gqlFilter
	}

	if in.Steps <= 0 {
		in.Steps = 5
	}

	edgeStr := "*"
	if len(edgeTypeList) != 0 {
		edgeStr = ""
		for _, edge := range edgeTypeList {
			edgeStr += "`" + edge + "`,"
		}
		edgeStr = edgeStr[:len(edgeStr)-1]
	}

	edge := edgeStr
	gql += " UPTO %d STEPS yield path as `path`"
	gql = fmt.Sprintf(gql, in.Source, in.Target, edge, in.Steps)

	if in.Limit != 0 {
		gql += " | LIMIT %d"
		gql = fmt.Sprintf(gql, in.Limit)
	}
	pathList, vidsSet, edgesSet, err := ge.explorePath(ctx, space, gql)
	if err != nil {
		return nil, nil, nil, err
	}
	vidsList = []string{}
	edgesList = []string{}
	for elem := range vidsSet.Iter() {
		vidsList = append(vidsList, elem)
	}

	for elem := range edgesSet.Iter() {
		edgesList = append(edgesList, elem)
	}
	return pathList, vidsList, edgesList, nil
}

// parsePathFilter 解析筛选规则
// nolint
func (ge graphExploreRepo) parsePathFilter(ctx context.Context, space string, filters []*types.Filter) (ruleGql string, fullTypeList []string, err error) {
	// 多个规则
	ruler := []string{}
	fullTypeList = []string{}
	notSatisfyExist := false

	for _, filter := range filters {
		filterGql := ""

		// 规则内的不同类
		for _, eFilter := range filter.EFilters {
			eFilterGql := ""
			edgeInfo, err := ge.nebula.DescEdge(ctx, space, eFilter.EdgeClass)
			if err != nil {
				return "", nil, err
			}

			propType := make(map[string]string)
			for _, classProp := range edgeInfo.Properties {
				propType[classProp.Name] = classProp.Type
			}

			classFilter := []string{}

			// 类中的不同属性
			for _, p := range eFilter.PropertyFilters {
				proFilter := ""
				val, ok := propType[p.Name]
				if !ok {
					return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, p.Name+" does not exist")
				}

				// 如果类型为字符串
				if utils.In(val, common.STRING) {
					if opVal, ok := common.STRING2NEBULAOPMAP[p.Operation]; !ok {
						return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, p.Operation+" does not exist")
					} else if val == "is" {
						if p.OpValue == common.NULLSTRING {
							proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+"is NULL")
						} else {
							return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "The operation does not match the operation value")
						}
					} else {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+"'"+p.OpValue+"'")
					}
				} else if utils.In(val, common.INTEGER) { // 如果类型为整型
					opVal, ok := common.NUMBER2NEBULAOPMAP[p.Operation]
					if !ok {
						return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, p.Operation+" does not exist")
					}
					_, err := strconv.Atoi(p.OpValue)
					if err != nil {
						if p.OpValue == common.NULLSTRING || p.OpValue == "" {
							proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+"is NULL")
						} else {
							proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+"'"+p.OpValue+"'")
						}
					} else {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+p.OpValue)
					}
				} else if utils.In(val, common.NUMBER) { // 如果类型为小数
					opVal, ok := common.NUMBER2NEBULAOPMAP[p.Operation]
					if !ok {
						return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, p.Operation+" does not exist")
					}
					_, err := strconv.ParseFloat(p.OpValue, 64)
					if err != nil {
						if p.OpValue == common.NULLSTRING || p.OpValue == "" {
							proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+"is NULL")
						} else {
							proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+"'"+p.OpValue+"'")
						}
					} else {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+p.OpValue)
					}
				} else if utils.In(val, common.BOOL) {
					if opVal, ok := common.BOOL2NEBULAOPMAP[p.Operation]; !ok {
						return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, p.Operation+" does not exist")
					} else if !utils.In(p.OpValue, []string{"trule", "false"}) {
						if p.OpValue == common.NULLSTRING || p.OpValue == "" {
							proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+"is NULL")
						} else {
							proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+"'"+p.OpValue+"'")
						}
					} else {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+p.OpValue)
					}
				} else if common.TimeType(val) == common.DATE {
					opVal, ok := common.NUMBER2NEBULAOPMAP[p.Operation]
					if !ok {
						return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, p.Operation+" does not exist")
					}
					if p.OpValue == common.NULLSTRING || p.OpValue == "" {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+"is NULL")
					} else {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+"date('"+p.OpValue+"')")
					}
				} else if common.TimeType(val) == common.TIMESTAMP {
					opVal, ok := common.NUMBER2NEBULAOPMAP[p.Operation]
					if !ok {
						return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, p.Operation+" does not exist")
					}
					if p.OpValue == common.NULLSTRING || p.OpValue == "" {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+"is NULL")
					} else {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+"timestamp('"+p.OpValue+"')")
					}

				} else if common.TimeType(val) == common.DATETIME {
					opVal, ok := common.NUMBER2NEBULAOPMAP[p.Operation]
					if !ok {
						return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, p.Operation+" does not exist")
					}

					if p.OpValue == common.NULLSTRING || p.OpValue == "" {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+"is NULL")
					} else {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+"datetime('"+p.OpValue+"')")
					}

				} else if common.TimeType(val) == common.TIME {
					opVal, ok := common.NUMBER2NEBULAOPMAP[p.Operation]
					if !ok {
						return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, p.Operation+" does not exist")
					}
					if p.OpValue == common.NULLSTRING || p.OpValue == "" {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+"is NULL")
					} else {
						proFilter = fmt.Sprintf("%s.%s", "`"+eFilter.EdgeClass+"`", "`"+p.Name+"`"+opVal+"time('"+p.OpValue+"')")
					}
				} else {
					return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "type "+val+" does not exist")
				}
				classFilter = append(classFilter, proFilter)
			}
			if len(classFilter) > 0 {
				if common.FilterType(eFilter.Type) == common.NOTSATISFYALL {
					eFilterGql = "(not (" + strings.Join(classFilter, " and ") + "))"
				} else if common.FilterType(eFilter.Type) == common.NOTSATISFYANY {
					eFilterGql = "(not (" + strings.Join(classFilter, " or ") + "))"
				} else if common.FilterType(eFilter.Type) == common.SATISFYALL {
					eFilterGql = "(" + strings.Join(classFilter, " and ") + ")"
				} else if common.FilterType(eFilter.Type) == common.SATISFYANY {
					eFilterGql = "(" + strings.Join(classFilter, " or ") + ")"
				} else {
					return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "this 'type' is not supported!")
				}
			}
			if len(eFilter.PropertyFilters) == 0 {
				if common.FilterType(eFilter.Type) == common.NOTSATISFYALL || common.FilterType(eFilter.Type) == common.NOTSATISFYANY {
					eFilterGql = fmt.Sprintf("(%s.`_timestamp_` is EMPTY)", eFilter.EdgeClass)
				} else {
					eFilterGql = fmt.Sprintf("(%s.`_timestamp_` is not EMPTY)", eFilter.EdgeClass)
				}
			}

			// 拼接语句
			if filterGql == "" {
				filterGql = eFilterGql
			} else {
				if common.FilterRelation(eFilter.Relation) == common.AND {
					filterGql += " and " + eFilterGql
				} else if common.FilterRelation(eFilter.Relation) == common.OR {
					filterGql += " or " + eFilterGql
				} else {
					return "", nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "this 'relation' is not supported!")
				}
				filterGql = "(" + filterGql + ")"
			}

			if notSatisfyExist {
				continue
			}
			if common.FilterType(eFilter.Type) == common.SATISFYALL || common.FilterType(eFilter.Type) == common.SATISFYANY {
				if !utils.In(eFilter.EdgeClass, fullTypeList) {
					fullTypeList = append(fullTypeList, eFilter.EdgeClass)
				}
			} else {
				fullTypeList = fullTypeList[:0]
				notSatisfyExist = true
			}
		}
		if filterGql != "" {
			ruler = append(ruler, filterGql)
		}
	}
	ruleGql = strings.Join(ruler, " or ")

	return ruleGql, fullTypeList, nil
}

func (ge graphExploreRepo) explorePath(ctx context.Context, space, gql string) (paths []*repo.PathInfo, vidsSet, edgesSet mapset.Set[string], err error) {
	res, _, err := ge.nebula.Execute(ctx, gql, space, false)
	if err != nil {
		return nil, nil, nil, err
	}

	paths = []*repo.PathInfo{}
	vidsSet = mapset.NewSet[string]()
	edgesSet = mapset.NewSet[string]()
	for i := 0; i < res.GetRowSize(); i++ {
		rowValue, _ := res.GetRowValuesByIndex(i)
		valWrap, _ := rowValue.GetValueByIndex(0)
		pathVal, err := valWrap.AsPath()
		if err != nil {
			return nil, nil, nil, err
		}
		nodes := pathVal.GetNodes()
		edges := pathVal.GetRelationships()
		pathInfo := &repo.PathInfo{
			Vertices: []string{},
			Edges:    []string{},
		}

		// 获取点
		for _, node := range nodes {
			pathInfo.Vertices = append(pathInfo.Vertices, utils.TrimQuotationMarks(node.GetID().String()))
			vidsSet.Add(utils.TrimQuotationMarks(node.GetID().String()))
		}

		// 获取边信息
		for _, edge := range edges {
			e := edge.GetEdgeName() + ":" + utils.TrimQuotationMarks(edge.GetSrcVertexID().String()) + "-" + utils.TrimQuotationMarks(edge.GetDstVertexID().String())
			searchE := edge.GetEdgeName() + ":" + edge.GetSrcVertexID().String() + "->" + edge.GetDstVertexID().String()
			pathInfo.EdgesInfo = append(pathInfo.EdgesInfo, &repo.EdgeSimpleInfo{
				EdgeClass: edge.GetEdgeName(),
				SrcID:     utils.TrimQuotationMarks(edge.GetSrcVertexID().String()),
				DstID:     utils.TrimQuotationMarks(edge.GetDstVertexID().String()),
			})
			pathInfo.Edges = append(pathInfo.Edges, e)
			edgesSet.Add(searchE)
		}

		paths = append(paths, pathInfo)
	}
	return paths, vidsSet, edgesSet, nil
}

func (ge graphExploreRepo) GetVertex(ctx context.Context, space, nGql, query string) ([]*repo.Vertex, error) {
	logx.WithContext(ctx).Infof("GetVertex by: %v, space: %s, nGql:%s", query, space, nGql)
	res, _, err := ge.nebula.Execute(ctx, nGql, space, false)
	if err != nil {
		return nil, err
	}
	vInfos := make([]*repo.Vertex, 0)
	for i := 0; i < res.GetRowSize(); i++ {
		rowValue, _ := res.GetRowValuesByIndex(i)
		valWrap, _ := rowValue.GetValueByIndex(0)
		if node, err := valWrap.AsNode(); err == nil {
			id := utils.TrimQuotationMarks(node.GetID().String())
			vertex := &repo.Vertex{
				ID:         id,
				Tags:       node.GetTags(),
				Properties: make(map[string]map[string]*repo.Prop),
			}

			values := []string{}
			for _, tag := range node.GetTags() {
				propMap := map[string]*repo.Prop{}
				if prop, err := node.Properties(tag); err == nil {
					for propName, propValue := range prop {
						p := &repo.Prop{
							Value: utils.TrimQuotationMarks(propValue.String()),
							Type:  propValue.GetType(),
						}
						propMap[propName] = p
						values = append(values, utils.TrimQuotationMarks(propValue.String()))
					}
				}
				vertex.Properties[tag] = propMap
			}
			// 根据关键词过滤点信息
			if query != "" && !utils.In(query, values) {
				continue
			}
			vInfos = append(vInfos, vertex)
		}
	}
	return vInfos, nil
}

func (ge graphExploreRepo) GetEdges(ctx context.Context, space, nGql string) ([]*repo.Edge, error) {
	logx.WithContext(ctx).Infof("GetVertex space: %s, nGql:%s", space, nGql)

	res, _, err := ge.nebula.Execute(ctx, nGql, space, false)
	if err != nil {
		return nil, err
	}

	eInfos := make([]*repo.Edge, 0)
	for i := 0; i < res.GetRowSize(); i++ {
		rowValue, _ := res.GetRowValuesByIndex(i)
		valWrap, _ := rowValue.GetValueByIndex(0)
		if e, err := valWrap.AsRelationship(); err == nil {
			srcID, _ := e.GetSrcVertexID().AsString()
			dstID, _ := e.GetDstVertexID().AsString()
			edge := &repo.Edge{
				ID:         e.GetEdgeName() + ":" + srcID + "-" + dstID,
				SrcID:      srcID,
				DstID:      dstID,
				Type:       e.GetEdgeName(),
				Rank:       int(e.GetRanking()),
				Properties: make(map[string]*repo.Prop),
			}

			prop := e.Properties()
			for propName, propValue := range prop {
				p := &repo.Prop{
					Value: utils.TrimQuotationMarks(propValue.String()),
					Type:  propValue.GetType(),
				}
				edge.Properties[propName] = p
			}

			eInfos = append(eInfos, edge)
		} else {
			return nil, err
		}
	}
	return eInfos, nil
}

func (ge graphExploreRepo) PathDetail(ctx context.Context, in *types.PathRequest, pathList []*repo.PathInfo, vids, edges []string, space string) (*repo.PathDetailInfo, []*repo.PathInfo, error) {
	vidsProcess := []string{}
	for i, v := range vids {
		v = "'" + v + "'"
		vids[i] = v
		vidsProcess = append(vidsProcess, v)
	}
	vidGql := fmt.Sprintf("match (v) where id(v) in [%s] return v;", strings.Join(vidsProcess, ","))

	vidRes, err := ge.GetVertex(ctx, space, vidGql, "")
	if err != nil {
		return nil, nil, err
	}

	edgeMap := map[string][]string{}
	for _, e := range edges {
		eList := strings.Split(e, ":")
		if _, ok := edgeMap[eList[0]]; !ok {
			edgeMap[eList[0]] = []string{eList[1]}
		} else {
			edgeMap[eList[0]] = append(edgeMap[eList[0]], eList[1])
		}
	}
	edgeRes := []*repo.Edge{}

	for key := range edgeMap {
		e1 := "`" + key + "`"
		edgeGql := fmt.Sprintf("FETCH PROP ON %s %s YIELD edge AS e", e1, strings.Join(edgeMap[key], ","))
		eClassRes, err := ge.GetEdges(ctx, space, edgeGql)
		if err != nil {
			return nil, nil, err
		}

		edgeRes = append(edgeRes, eClassRes...)
	}

	if common.PathType(in.PathType) == common.SHORTESTPATH && common.PathDecision(in.PathDecision) == common.WEIGHTPROPERTY {
		defaultVal, err := strconv.ParseFloat(in.DefaultValue, 64)
		if err != nil {
			return nil, nil, err
		}
		vidMap := map[string]*repo.Vertex{}
		edgeMap := map[string]*repo.Edge{}
		savedVids := []string{}
		savedEdges := []string{}

		for _, v := range vidRes {
			vidMap[v.ID] = v
		}

		for _, e := range edgeRes {
			edgeMap[e.ID] = e
		}

		minDepth := math.Pow(2, 63) - 1
		minWeight := math.Pow(2, 63) - 1
		weightList := []*repo.PathInfo{}
		for _, path := range pathList {
			var sumWeight float64
			nextLoop := false
			for _, edge := range path.Edges {
				if edgeMap[edge].Type != in.Edges {
					nextLoop = true
					break
				}
				for prop, propVal := range edgeMap[edge].Properties {
					if prop == in.Property {
						val, err := strconv.ParseFloat(propVal.Value, 64)
						if err != nil {
							sumWeight += defaultVal
						}
						sumWeight += val
					}
				}
			}
			if nextLoop {
				continue
			}
			if sumWeight < minWeight || sumWeight == minWeight && len(path.Edges) < int(minDepth) {
				minWeight = sumWeight
				minDepth = float64(len(path.Edges))
				weightList = weightList[:0]
				weightList = append(weightList, path)
			} else if sumWeight == minWeight && float64(len(path.Edges)) == minDepth {
				weightList = append(weightList, path)
			}
		}

		weithtPathDetail := &repo.PathDetailInfo{
			Vertices: make([]*repo.Vertex, 0),
			Edges:    make([]*repo.Edge, 0),
		}
		for _, path := range weightList {
			for _, e := range path.Edges {
				if !utils.In(e, savedEdges) {
					savedEdges = append(savedEdges, e)
					weithtPathDetail.Edges = append(weithtPathDetail.Edges, edgeMap[e])
				}
			}
			for _, v := range path.Vertices {
				if !utils.In(v, savedVids) {
					// TODO: python  del vid_map[v].score
					savedVids = append(savedVids, v)
					weithtPathDetail.Vertices = append(weithtPathDetail.Vertices, vidMap[v])
				}
			}
		}
		return weithtPathDetail, weightList, nil
	}

	return &repo.PathDetailInfo{
		Vertices: vidRes,
		Edges:    edgeRes,
	}, pathList, nil
}

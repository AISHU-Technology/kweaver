package explore

import (
	"context"
	"fmt"
	"net/http"

	mapset "github.com/deckarep/golang-set/v2"
	"kw-graph/internal/common"
	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/logic/repo"
	"kw-graph/utils"

	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

// NeighborsSearchLogic 邻居查询对象结构
type NeighborsSearchLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewNeighborsSearchLogic 邻居查询对象实例化
func NewNeighborsSearchLogic(ctx context.Context, svcCtx *svc.ServiceContext) *NeighborsSearchLogic {
	return &NeighborsSearchLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// NeighborsSearch 邻居查询
func (l *NeighborsSearchLogic) NeighborsSearch(req *types.NeighborsRequest) (map[string]*repo.Vertex, map[string]*repo.Edge, *repo.OntologyInfo, error) {
	// 获取本体信息
	ontology, err := l.svcCtx.Builder.GetOntologyInfo(l.ctx, req.KgID)
	if err != nil {

		return nil, nil, nil, err
	}

	// 获取图谱名称
	space, err := l.svcCtx.Builder.GetKGSpaceByKgID(l.ctx, req.KgID)
	if err != nil {

		return nil, nil, nil, err
	}

	resV, resE, err := l.NeighborsSearchLogics(space, req)
	if err != nil {

		return nil, nil, nil, err
	}

	return resV, resE, ontology, err
}

// NeighborsSearch 邻居查询旧逻辑
func (l *NeighborsSearchLogic) NeighborsSearchOld(req *types.NeighborsRequest) (*repo.NeighborsResponseCore, *repo.OntologyInfo, error) {
	// 获取本体信息
	ontology, err := l.svcCtx.Builder.GetOntologyInfo(l.ctx, req.KgID)
	if err != nil {

		return nil, nil, err
	}

	// 获取图谱名称
	space, err := l.svcCtx.Builder.GetKGSpaceByKgID(l.ctx, req.KgID)
	if err != nil {

		return nil, nil, err
	}

	resV, resE, err := l.NeighborsSearchLogics(space, req)
	if err != nil {

		return nil, nil, err
	}
	result := &repo.NeighborsResponseCore{}
	vMap := make(map[string]*repo.VertexGroupCore)
	eMap := make(map[string]*repo.EdgeGroupCore)
	var vCount int64
	var eCount int64

	for _, v := range resV {
		if _, ok := vMap[v.Tags[0]]; !ok {
			vMap[v.Tags[0]] = &repo.VertexGroupCore{
				Tag:      v.Tags[0],
				Vertices: make([]*repo.VertexCore, 0),
			}
		}

		properties := make([]*repo.PropertiesCore, 0)
		for tag, props := range v.Properties {
			property := &repo.PropertiesCore{
				Tag:   tag,
				Props: make([]*repo.PropsCore, 0),
			}
			for name, value := range props {
				p := &repo.PropsCore{
					Name:     name,
					Value:    value.Value,
					PropType: value.Type,
				}
				property.Props = append(property.Props, p)
			}
			properties = append(properties, property)
		}
		vertex := &repo.VertexCore{
			ID:         v.ID,
			Tags:       v.Tags,
			Properties: properties,
		}
		vCount++
		vMap[v.Tags[0]].Vertices = append(vMap[v.Tags[0]].Vertices, vertex)
	}
	for eid, e := range resE {
		if _, ok := eMap[e.Type]; !ok {
			eMap[e.Type] = &repo.EdgeGroupCore{
				EdgeClass: e.Type,
				Edges:     make([]*repo.EdgeCore, 0),
			}
		}

		properties := make([]*repo.PropsCore, 0)
		for name, value := range e.Properties {
			p := &repo.PropsCore{
				Name:     name,
				Value:    value.Value,
				PropType: value.Type,
			}

			properties = append(properties, p)
		}

		edge := &repo.EdgeCore{
			ID:         eid,
			EdgeClass:  e.Type,
			SrcID:      e.SrcID,
			DstID:      e.DstID,
			Rank:       int64(e.Rank),
			Properties: properties,
		}
		eCount++
		eMap[e.Type].Edges = append(eMap[e.Type].Edges, edge)
	}

	vResult := make([]*repo.VertexGroupCore, 0)
	eResult := make([]*repo.EdgeGroupCore, 0)
	for _, value := range vMap {
		vResult = append(vResult, value)
	}
	for _, value := range eMap {
		eResult = append(eResult, value)
	}
	result.VResult = vResult
	result.EResult = eResult
	result.VCount = vCount
	result.ECount = eCount

	return result, ontology, err
}

func (l *NeighborsSearchLogic) NeighborsSearchLogics(space string, req *types.NeighborsRequest) (respV map[string]*repo.Vertex, respE map[string]*repo.Edge, err error) {
	err = l.checkParamsValidity(req)

	if err != nil {
		return nil, nil, err
	}

	simpleFlag, overEdges := l.FilterPreprocess(space, req)

	// 如果一个点同时是第二跳和第三跳的结果，基础查询会返回，但高级查询不会，为了统一结果，只使用高级查询
	if req.FinalStep == true {
		simpleFlag = false
	}
	respV = make(map[string]*repo.Vertex)
	respE = make(map[string]*repo.Edge)

	if req.Steps <= 0 {
		req.Steps = 1
	}
	if simpleFlag {
		respV, respE, err = l.svcCtx.GraphExploreRepo.NeighborsBasic(l.ctx, req.Vids, req.Steps, req.Direction, overEdges, space)
		if err != nil {
			return nil, nil, err
		}
		return respV, respE, nil
	}
	vids := req.Vids
	numV := 0
	numE := 0
	// 有效起点的列表，只有能连到起点上的终点才是有效结果，包含初始起点和后续查询的终点
	startVids := mapset.NewSet[string]()
	for _, vid := range vids {
		startVids.Add(vid)
	}
	for i := 0; i < req.Steps; i++ {
		if len(vids) == 0 {
			// 如果只想要最后一跳结果，但提前结束了，直接返回空结果
			if req.FinalStep == true {
				finalStepV := make(map[string]*repo.Vertex)
				finalStepE := make(map[string]*repo.Edge)
				return finalStepV, finalStepE, nil
			}
			break
		}
		// 获取下一跳的结果
		neighbors, err := l.svcCtx.GraphExploreRepo.Neighbors(l.ctx, vids, 1, req.Direction, overEdges, req.Filters, space)
		if err != nil {
			return nil, nil, err
		}

		// 只返回最后一跳的点的情况，单独处理
		if i == req.Steps-1 && req.FinalStep == true {
			finalStepV := make(map[string]*repo.Vertex)
			finalStepE := make(map[string]*repo.Edge)
			for _, neighborsGroup := range neighbors {
				// 处理每一组结果，包含一条边和一个终点
				v := neighborsGroup.V
				e := neighborsGroup.E

				// 这组结果的起点
				var startID string

				if e.SrcID == v.ID {
					startID = e.DstID
				} else {
					startID = e.SrcID
				}

				// 如果起点不在有效起点列表中, 抛弃这组结果
				if !startVids.Contains(startID) {
					continue
				}
				// 如果这个点不在结果列表中，加入这个结果，并且加入最终结果中
				// 已在结果列表中的情况：原路返回，环，或者两点之间有不止一条边
				if _, ok := respV[v.ID]; !ok {
					v.Number = numV
					numV += 1
					finalStepV[v.ID] = v
					respV[v.ID] = v
				}
			}
			return finalStepV, finalStepE, nil
		}
		// 清空vids，作为下一跳的查询起点列表
		vids = []string{}
		for _, neighborsGroup := range neighbors {
			// 处理每一组结果，包含一条边和一个终点
			v := neighborsGroup.V
			e := neighborsGroup.E

			// 这组结果的起点
			var startID string

			if e.SrcID == v.ID {
				startID = e.DstID
			} else {
				startID = e.SrcID
			}

			// 如果起点不在有效起点列表中（初始起点+已有的结果列表）, 抛弃这组结果
			if !startVids.Contains(startID) {
				continue
			}
			startVids.Append(v.ID)
			// 如果这个点不在结果列表中，加入这个结果，并且加入到下一跳的起点中
			// 已在结果列表中的情况：原路返回，环，或者两点之间有不止一条边
			if _, ok := respV[v.ID]; !ok {
				v.Number = numV
				numV += 1
				vids = append(vids, v.ID)
				respV[v.ID] = v
			}
			eid := e.Type + ":" + e.SrcID + "-" + e.DstID
			if _, ok := respE[eid]; !ok {
				e.Number = numE
				numE += 1
				respE[eid] = e
			}
		}
	}
	if err != nil {
		return nil, nil, err
	}

	return respV, respE, nil
}
func (l *NeighborsSearchLogic) checkParamsValidity(req *types.NeighborsRequest) error {
	for _, filters := range req.Filters {
		for _, eFilter := range filters.EFilters {
			if !utils.In(eFilter.Relation, []string{string(common.AND), string(common.OR)}) {
				return errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
					fmt.Sprintf("Invalid relation: %s", eFilter.Relation))
			}
			if !utils.In(eFilter.Type, []string{string(common.SATISFYANY), string(common.SATISFYALL), string(common.NOTSATISFYANY), string(common.NOTSATISFYALL)}) {
				return errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
					fmt.Sprintf("Invalid type: %s", eFilter.Type))
			}
			for _, propertyFilter := range eFilter.PropertyFilters {
				if propertyFilter.OpValue == "" {
					if propertyFilter.Operation == "eq" || propertyFilter.Operation == "neq" {
						continue
					}
					return errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
						fmt.Sprintf("Invalid operation: %s, %s", propertyFilter.Operation, propertyFilter.OpValue))
				}
			}
		}
		for _, vFilter := range filters.VFilters {
			if !utils.In(vFilter.Relation, []string{string(common.AND), string(common.OR)}) {
				return errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
					fmt.Sprintf("Invalid relation: %s", vFilter.Relation))
			}
			if !utils.In(vFilter.Type, []string{string(common.SATISFYANY), string(common.SATISFYALL), string(common.NOTSATISFYANY), string(common.NOTSATISFYALL)}) {
				return errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
					fmt.Sprintf("Invalid type: %s", vFilter.Type))
			}
			for _, propertyFilter := range vFilter.PropertyFilters {
				if propertyFilter.OpValue == "" {
					if propertyFilter.Operation == "eq" || propertyFilter.Operation == "neq" {
						continue
					}
					return errorCode.New(http.StatusBadRequest, errorCode.ArgsError,
						fmt.Sprintf("Invalid operation: %s, %s", propertyFilter.Operation, propertyFilter.OpValue))
				}
			}
		}
	}
	return nil
}

// FilterPreprocess 统计需要查询的边，判断能否进行简单查询
func (l *NeighborsSearchLogic) FilterPreprocess(space string, req *types.NeighborsRequest) (simpleFlag bool, edges []string) {
	allEdgesFlag := false
	simpleFlag = true
	edgesSet := mapset.NewSet[string]()

	tags, _ := l.svcCtx.Nebula.ShowEdges(l.ctx, space)
	edgesSetAll := mapset.NewSet[string]()
	for _, tag := range tags {
		edgesSetAll.Add(tag)
	}
	for _, filter := range req.Filters {
		if len(filter.VFilters) != 0 {
			simpleFlag = false
		}
		edgesSetF := mapset.NewSet[string]()
		edgeSetInvertF := mapset.NewSet[string]()
		// 无edge视为查全部
		if len(filter.EFilters) == 0 {
			allEdgesFlag = true
		} else {
			for _, eFilter := range filter.EFilters { // 正选的边
				if eFilter.Type == string(common.SATISFYALL) || eFilter.Type == string(common.SATISFYANY) {
					if len(eFilter.PropertyFilters) != 0 {
						simpleFlag = false
					}
					edgesSetF.Add(eFilter.EdgeClass)
					continue
				} else {
					// 如果只有反选的边，且无属性过滤条件，可以用基础搜索
					if eFilter.Relation == string(common.AND) || len(filter.EFilters) == 1 {
						if len(eFilter.PropertyFilters) == 0 {
							edgeSetInvertF.Add(eFilter.EdgeClass)
							continue
						}
					}
					// 如果反选的边与上一个属性间的关系用了or,或者筛选了反选的边里面的属性，可能的逻辑太复杂，无法处理，直接查全部的边，用复杂搜索
					simpleFlag = false
					allEdgesFlag = true
					break
				}
			}
		}

		// 如果同一个filter里同时有正选和反选，无法处理，查全部
		if edgesSetF.Cardinality() != 0 && edgeSetInvertF.Cardinality() != 0 {
			simpleFlag = false
			allEdgesFlag = true
			break
		}
		// 把当前filter里指定的边加入over的边集合中
		edgesSet = edgesSet.Union(edgesSetF)
		// 反选的情况
		if edgeSetInvertF.Cardinality() != 0 {
			edgesSet = edgesSetAll.Difference(edgeSetInvertF)
		}
	}
	if allEdgesFlag {
		return simpleFlag, nil
	}
	return simpleFlag, edgesSet.ToSlice()
}

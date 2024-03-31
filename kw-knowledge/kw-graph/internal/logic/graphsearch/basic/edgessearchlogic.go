// Package basic 图基础查询逻辑层实现
package basic

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/logic/repo"

	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

// EdgesSearchLogic 搜索边对象结构
type EdgesSearchLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewEdgesSearchLogic 搜索边对象实例化
func NewEdgesSearchLogic(ctx context.Context, svcCtx *svc.ServiceContext) *EdgesSearchLogic {
	return &EdgesSearchLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// EdgesSearch 搜索边
func (l *EdgesSearchLogic) EdgesSearch(req *types.EdgesRequest) (*repo.EdgesResponseCore, *repo.OntologyInfo, error) {
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

	confContent := *req

	edges := make(map[string][]repo.Edge)
	var edge repo.Edge

	for _, eid := range confContent.Eids {
		params := strings.Split(eid, "\"")
		if len(params) == 1 {
			params = strings.Split(eid, ":")
			if len(params) != 2 {
				return nil, nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("cannot analysis eid:%s ", eid))
			}
			edge.Type = params[0]
			paramsID := strings.Split(params[1], "-")
			if len(paramsID) != 2 {
				return nil, nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("cannot analysis eid:%s ", eid))
			}
			edge.SrcID = paramsID[0]
			edge.DstID = paramsID[1]
		} else if len(params) == 5 {
			// 旧版eid兼容
			params[0] = strings.TrimRight(params[0], ":")
			edge.Type = params[0]
			edge.SrcID = params[1]
			edge.DstID = params[3]
		} else {
			return nil, nil, errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("cannot analysis eid:%s ", eid))
		}
		edges[edge.Type] = append(edges[edge.Type], edge)
	}
	for _, edgeReq := range confContent.Edges {
		edge.Type = edgeReq.Type
		edge.SrcID = edgeReq.SrcID
		edge.DstID = edgeReq.DstID
		edges[edge.Type] = append(edges[edge.Type], edge)
	}

	eInfos, count, err := l.svcCtx.GraphBasicSearchRepo.GetEdge(l.ctx, edges, space)
	if err != nil {
		return nil, nil, err
	}

	result := l.InformationEncapsulation(eInfos, count)
	return result, ontology, nil
}

func (l *EdgesSearchLogic) InformationEncapsulation(eInfos []*repo.NebulaEdgesSearchInfo, count int) *repo.EdgesResponseCore {
	edgesResp := &repo.EdgesResponseCore{
		ECount:  int64(count),
		EResult: make([]*repo.EdgeGroupCore, 0),
	}
	for _, respGroup := range eInfos {
		var eGroup repo.EdgeGroupCore
		eGroup.EdgeClass = respGroup.Type
		for _, respEdge := range respGroup.Edges {
			var edge repo.EdgeCore
			edge.EdgeClass = respEdge.Type
			edge.SrcID = respEdge.SrcID
			edge.DstID = respEdge.DstID
			edge.Rank = int64(respEdge.Rank)
			edge.Properties = make([]*repo.PropsCore, 0)
			edge.ID = edge.EdgeClass + ":" + edge.SrcID + "-" + edge.DstID
			for propName, propValue := range respEdge.Properties {
				var props repo.PropsCore
				props.Name = propName
				props.Value = propValue.Value
				props.PropType = propValue.Type
				edge.Properties = append(edge.Properties, &props)
			}
			eGroup.Edges = append(eGroup.Edges, &edge)
		}
		edgesResp.EResult = append(edgesResp.EResult, &eGroup)
	}
	return edgesResp
}

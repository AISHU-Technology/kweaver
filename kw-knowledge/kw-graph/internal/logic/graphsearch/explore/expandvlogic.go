// Package explore 图探索逻辑层实现
package explore

import (
	"context"

	"kw-graph/internal/logic/repo"

	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

// ExpandVLogic 点探索对象结构
type ExpandVLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewExpandVLogic 点探索对象实例化
func NewExpandVLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ExpandVLogic {
	return &ExpandVLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// ExpandV 点探索
func (l *ExpandVLogic) ExpandV(req *types.ExpandVRequest) (*repo.ExpandVResponseCore, *repo.OntologyInfo, error) {
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

	result, err := l.svcCtx.GraphExploreRepo.ExpandV(l.ctx, []string{req.Vid}, space)
	if err != nil {

		return nil, nil, err
	}

	resp := &repo.ExpandVResponseCore{}
	for key, value := range result {
		var edgeGroup repo.ExpandVGroupCore
		edgeGroup.ID = key
		for _, edgeRes := range value.InE {
			edge := repo.ExpandVEdgeCore{
				EdgeClass: edgeRes.EdgeClass,
				Count:     edgeRes.Count,
			}
			edgeGroup.InE = append(edgeGroup.InE, &edge)
		}
		for _, edgeRes := range value.OutE {
			edge := repo.ExpandVEdgeCore{
				EdgeClass: edgeRes.EdgeClass,
				Count:     edgeRes.Count,
			}
			edgeGroup.OutE = append(edgeGroup.OutE, &edge)
		}
		resp.Res = append(resp.Res, &edgeGroup)
	}
	return resp, ontology, nil
}

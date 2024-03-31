// custom 自定义查询逻辑层实现
package custom

import (
	"context"

	"kw-graph/internal/logic/repo"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

var (
	// NULLVAL null值常量
	NULLVAL = "__NULL__"
)

// CustomSearchLogic 自定义查询对象结构
type CustomSearchLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewCustomSearchLogic 自定义查询对象实例化
func NewCustomSearchLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CustomSearchLogic {
	return &CustomSearchLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// CustomSearch 自定义查询
func (l *CustomSearchLogic) CustomSearch(req *types.CustomSearchRequest, statament string) ([]*repo.CustomSearchInfo, *repo.OntologyInfo, *repo.NodesInfoAllType, error) {
	var graphInfo *repo.GraphInfo
	graphInfo, err := l.svcCtx.RedisOpRepo.GetGraphInfoByKgID(l.ctx, req.KgID)
	if err != nil {
		return nil, nil, nil, err
	}

	if graphInfo == nil {
		graphInfo = &repo.GraphInfo{}
		// 获取本体信息
		ontology, errOnto := l.svcCtx.Builder.GetOntologyInfo(l.ctx, req.KgID)
		if errOnto != nil {

			return nil, nil, nil, errOnto
		}

		// 获取图谱名称
		space, err := l.svcCtx.Builder.GetKGSpaceByKgID(l.ctx, req.KgID)
		if err != nil {

			return nil, nil, nil, err
		}
		graphInfo.OntologyInfo = ontology
		graphInfo.DBName = space
	}

	result, nodesDetail, err := l.svcCtx.CustomSearchRepo.CustomSearch(l.ctx, statament, graphInfo.DBName, req.GivenJson)
	if err != nil {

		return nil, nil, nil, err
	}
	return result, graphInfo.OntologyInfo, nodesDetail, nil
}

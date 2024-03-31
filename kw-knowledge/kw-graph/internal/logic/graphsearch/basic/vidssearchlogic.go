package basic

import (
	"context"

	"kw-graph/internal/logic/repo"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"

	jsoniter "github.com/json-iterator/go"
	"github.com/zeromicro/go-zero/core/logx"
)

const (
	// VIDSDEFAULTNUM  vids搜索默认数量
	VIDSDEFAULTNUM = 1000
)

// VidsSearchLogic 点搜索对象结构
type VidsSearchLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewVidsSearchLogic 点搜索对象实例化
func NewVidsSearchLogic(ctx context.Context, svcCtx *svc.ServiceContext) *VidsSearchLogic {
	return &VidsSearchLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// VidsSearch 点搜索
func (l *VidsSearchLogic) VidsSearch(conf *types.VidsRequest) (*repo.FTSearchResult, *repo.OntologyInfo, error) {
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

	searchRes := &repo.FTSearchResult{}
	needCheckConf["matching_num"] = float64(VIDSDEFAULTNUM)
	if len(conf.Vids) > 0 {
		vInfos, _, err := l.svcCtx.GraphBasicSearchRepo.QueryAllOfVids(l.ctx, needCheckConf, filterMap, "", conf.Vids, space)
		if err != nil {

			return nil, nil, err
		}
		searchRes.NebulaVInfos = vInfos
		searchRes.Total = len(vInfos)
	} else {
		vInfos, err := l.svcCtx.GraphBasicSearchRepo.QueryAllOnEmptyQuery(l.ctx, needCheckConf, filterMap, "", conf.Vids, space)
		if err != nil {

			return nil, nil, err
		}
		searchRes.NebulaVInfos = vInfos
		searchRes.Total = len(vInfos)
	}

	// result := InformationEncapsulation(searchRes)
	return searchRes, ontology, nil
}

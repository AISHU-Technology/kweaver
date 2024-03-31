// Package explore 路径探索逻辑层实现
package explore

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"kw-graph/internal/common"
	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/logic/repo"
	"kw-graph/internal/svc"
	"kw-graph/internal/types"
	"kw-graph/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

// PathsExploreLogic 路径探索对象
type PathsExploreLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewPathsExploreLogic 路径探索逻辑层对象实例化
func NewPathsExploreLogic(ctx context.Context, svcCtx *svc.ServiceContext) *PathsExploreLogic {
	return &PathsExploreLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// PathsExplore 路径探索
func (l *PathsExploreLogic) PathsExplore(req *types.PathRequest) ([]*repo.PathInfo, *repo.PathDetailInfo, *repo.OntologyInfo, error) {
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

	pathList, pathDetail, err := l.Path(req, space)
	if err != nil {

		return nil, nil, nil, err
	}

	return pathList, pathDetail, ontology, nil
}

// Path 路径探索
func (l *PathsExploreLogic) Path(req *types.PathRequest, space string) ([]*repo.PathInfo, *repo.PathDetailInfo, error) {

	// 参数校验
	err := l.checkPathValidity(req, space)
	if err != nil {
		return nil, nil, err
	}

	pathList, vidsList, edgesList, err := l.svcCtx.GraphExploreRepo.Path(l.ctx, req, space)
	if err != nil {
		return nil, nil, err
	}

	if len(pathList) == 0 {
		return nil, nil, nil
	}

	pathDetail, pathListDetail, err := l.svcCtx.GraphExploreRepo.PathDetail(l.ctx, req, pathList, vidsList, edgesList, space)
	if err != nil {
		return nil, nil, err
	}

	return pathListDetail, pathDetail, err
}

// checkPathValidity 参数校验
func (l *PathsExploreLogic) checkPathValidity(req *types.PathRequest, space string) error {
	edges, err := l.svcCtx.Nebula.ShowEdges(l.ctx, space)
	if err != nil {
		return err
	}

	if common.PathType(req.PathType) == common.SHORTESTPATH {
		if common.PathDecision(req.PathDecision) == common.WEIGHTPROPERTY {
			if req.Edges == "" {
				return errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "parameter 'edges' is missing!")
			} else if !utils.In(req.Edges, edges) {
				return errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("edge_class %s does not exist", req.Edges))
			}

			if req.Property == "" {
				return errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "parameter 'property' is missing!")
			} else {
				edgesPro, err := l.svcCtx.Nebula.DescEdge(l.ctx, space, req.Edges)
				if err != nil {
					return err
				}
				isExist := false

				for _, edge := range edgesPro.Properties {
					if req.Property == edge.Name {
						if utils.In(edge.Type, common.INTEGER) || utils.In(edge.Type, common.NUMBER) {
							isExist = true
						} else {
							return errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "parameter 'property' type is error!")
						}
					}
				}
				if !isExist {
					return errorCode.New(http.StatusBadRequest, errorCode.ArgsError, fmt.Sprintf("%s  does not exist in %s", req.Property, req.Edges))
				}
			}

			if req.DefaultValue == "" {
				return errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "parameter 'default_value' is missing!")
			} else {
				_, err := strconv.ParseFloat(req.DefaultValue, 64)
				if err != nil {
					return errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "parameter 'default_value' type is error!")
				}
			}
		}
	}
	return nil
}

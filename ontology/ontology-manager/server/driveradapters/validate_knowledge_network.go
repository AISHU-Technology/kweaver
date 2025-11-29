package driveradapters

import (
	"context"
	"fmt"
	"net/http"

	oerrors "ontology-manager/errors"
	"ontology-manager/interfaces"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

// 路径查询的参数校验
func ValidateRelationTypePathsQuery(ctx context.Context, query *interfaces.RelationTypePathsBaseOnSource) error {
	// 起点对象类非空
	if query.SourceObjecTypeId == "" {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_KnowledgeNetwork_NullParameter_SourceObjectTypeId)
	}

	// 方向非空
	if query.Direction == "" {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_KnowledgeNetwork_NullParameter_Direction)
	}

	// 方向有效性
	if !interfaces.DIRECTION_MAP[query.Direction] {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_KnowledgeNetwork_InvalidParameter_Direction).
			WithErrorDetails(fmt.Sprintf("当前支持的方向有: forward, backward, bidirectional. 请求的方向为: %s", query.Direction))
	}

	// 路径长度不超过3
	if query.PathLength > 3 {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_KnowledgeNetwork_InvalidParameter_PathLength).
			WithErrorDetails(fmt.Sprintf("路径长度不超过3, 请求的路径长度为%d", query.PathLength))
	}

	return nil
}

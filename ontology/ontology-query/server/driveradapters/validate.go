package driveradapters

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/mitchellh/mapstructure"

	cond "ontology-query/common/condition"
	oerrors "ontology-query/errors"
	"ontology-query/interfaces"
)

// 校验 x-http-method-override 重载方法，只在header里传递 method
func ValidateHeaderMethodOverride(ctx context.Context, headerMethod string) error {
	// 校验 method
	if headerMethod == "" {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_NullParameter_OverrideMethod)
	}
	if headerMethod != "GET" {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_InvalidParameter_OverrideMethod).
			WithErrorDetails(fmt.Sprintf("X-HTTP-Method-Override is expected to be GET, but it is actually %s", headerMethod))
	}

	return nil
}

// 校验对象类的查询参数
func validateObjectsQueryParameters(ctx context.Context, includeTypeInfo string, ignoringStoreCache string,
	includeLogicParams string) (interfaces.CommonQueryParameters, error) {

	includeType, err := strconv.ParseBool(includeTypeInfo)
	if err != nil {
		return interfaces.CommonQueryParameters{}, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_ObjectType_InvalidParameter_IncludeTypeInfo).
			WithErrorDetails(fmt.Sprintf("The include_type_info:%s is invalid", includeTypeInfo))
	}

	includeLogicP, err := strconv.ParseBool(includeLogicParams)
	if err != nil {
		return interfaces.CommonQueryParameters{}, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_ObjectType_InvalidParameter_IncludeTypeInfo).
			WithErrorDetails(fmt.Sprintf("The include_logic_params:%s is invalid", includeLogicParams))
	}

	ignoringStore, err := strconv.ParseBool(ignoringStoreCache)
	if err != nil {
		return interfaces.CommonQueryParameters{}, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_ObjectType_InvalidParameter_IgnoringStoreCache).
			WithErrorDetails(fmt.Sprintf("The ignoring_store_cache:%s is invalid", ignoringStoreCache))
	}

	return interfaces.CommonQueryParameters{
		IncludeTypeInfo:    includeType,
		IncludeLogicParams: includeLogicP,
		IgnoringStore:      ignoringStore,
	}, nil
}

// 校验子图查询的查询参数
func validateSugraphQueryParameters(ctx context.Context,
	includeLogicParams string, ignoringStoreCache string) (interfaces.CommonQueryParameters, error) {

	includeLogicP, err := strconv.ParseBool(includeLogicParams)
	if err != nil {
		return interfaces.CommonQueryParameters{}, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_ObjectType_InvalidParameter_IncludeTypeInfo).
			WithErrorDetails(fmt.Sprintf("The include_logic_params:%s is invalid", includeLogicParams))
	}

	ignoringStore, err := strconv.ParseBool(ignoringStoreCache)
	if err != nil {
		return interfaces.CommonQueryParameters{}, rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_ObjectType_InvalidParameter_IgnoringStoreCache).
			WithErrorDetails(fmt.Sprintf("The ignoring_store_cache:%s is invalid", ignoringStoreCache))
	}

	return interfaces.CommonQueryParameters{
		IncludeLogicParams: includeLogicP,
		IgnoringStore:      ignoringStore,
	}, nil
}

// 基于起点、方向和路径长度获取对象子图的参数校验
func validateSubgraphSearchRequest(ctx context.Context, query *interfaces.SubGraphQueryBaseOnSource) error {

	// 过滤条件用map接，然后再decode到condCfg中
	var actualCond *cond.CondCfg
	err := mapstructure.Decode(query.Condition, &actualCond)
	if err != nil {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_InvalidParameter_Condition).
			WithErrorDetails(fmt.Sprintf("mapstructure decode condition failed: %s", err.Error()))
	}
	query.ActualCondition = actualCond

	// 起点对象类非空
	if query.SourceObjecTypeId == "" {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_KnowledgeNetwork_NullParameter_SourceObjectTypeId)
	}

	// 方向非空
	if query.Direction == "" {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_KnowledgeNetwork_NullParameter_Direction)
	}

	// 方向有效性
	if !interfaces.DIRECTION_MAP[query.Direction] {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_KnowledgeNetwork_InvalidParameter_Direction).
			WithErrorDetails(fmt.Sprintf("当前支持的方向有: forward, backward, bidirectional. 请求的方向为: %s", query.Direction))
	}

	// 路径长度不超过3
	if query.PathLength > 3 {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_KnowledgeNetwork_InvalidParameter_PathLength).
			WithErrorDetails(fmt.Sprintf("路径长度不超过3, 请求的路径长度为%d", query.PathLength))
	}

	return nil

}

// 基于路径获取对象子图的参数校验
func validateSubgraphQueryByPathRequest(ctx context.Context, query *interfaces.SubGraphQueryBaseOnTypePath) error {

	for i := range query.Paths.TypePaths {
		if len(query.Paths.TypePaths[i].Edges) > 10 {
			return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_ObjectType_InvalidParameter).
				WithErrorDetails("实例关系查询最多支持10度")
		}
		if query.Paths.TypePaths[i].Limit == 0 {
			query.Paths.TypePaths[i].Limit = interfaces.DEFAULT_PATHS // 不给路径长度时，给最大值2000
		}
	}

	for _, path := range query.Paths.TypePaths {
		// 1. 各路径的节点不能为空
		if len(path.ObjectTypes) == 0 {
			return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_KnowledgeNetwork_NullParameter_TypePathObjectTypes)
		}
		// 2. 路径不能为空
		if len(path.Edges) == 0 {
			return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_KnowledgeNetwork_NullParameter_TypePathRelationTypes)
		}

		// 3. 路径的起始点在边中需存在且位置正确
		for i, edge := range path.Edges {
			// 第i条边的起点等于第i个位置的对象类
			if edge.SourceObjectTypeId != path.ObjectTypes[i].OTID {
				return rest.NewHTTPError(ctx, http.StatusBadRequest,
					oerrors.OntologyQuery_KnowledgeNetwork_InvalidParameter_TypePath).
					WithErrorDetails(fmt.Sprintf("路径的边[%d]的起点对象类指向[%s],在对象类数组中对应的位置[%d]找到的对象类为[%s]",
						i, edge.SourceObjectTypeId, i, path.ObjectTypes[i].OTID))
			}
			// 第i条边的终点等于第i+1个位置的对象类
			if edge.TargetObjectTypeId != path.ObjectTypes[i+1].OTID {
				return rest.NewHTTPError(ctx, http.StatusBadRequest,
					oerrors.OntologyQuery_KnowledgeNetwork_InvalidParameter_TypePath).
					WithErrorDetails(fmt.Sprintf("路径的边[%d]的终点对象类指向[%s],在对象类数组中对应的位置[%d]找到的对象类为[%s]",
						i, edge.TargetObjectTypeId, i+1, path.ObjectTypes[i+1].OTID))
			}
			// 路径上当前边的终点是上一条边的起点
			if i > 0 {
				if edge.SourceObjectTypeId != path.Edges[i-1].TargetObjectTypeId {
					return rest.NewHTTPError(ctx, http.StatusBadRequest,
						oerrors.OntologyQuery_KnowledgeNetwork_InvalidParameter_TypePath).
						WithErrorDetails(fmt.Sprintf("当前请求的边无法组成一条路径,路径的边的起点是上一条边的终点,当前请求的路径的边[%d]的起点对象类指向[%s]，而前序边的终点对象类是[%s]",
							i, edge.SourceObjectTypeId, path.Edges[i-1].TargetObjectTypeId))
				}
			}
		}

		// 4. 如果路径数未设置，默认是给 2000
		// if path.Limit == 0 {
		// 	MAX_PATHS
		// }
	}

	return nil
}

// 基于对象类的对象数据查询的参数校验
func validateObjectSearchRequest(ctx context.Context, query *interfaces.ObjectQueryBaseOnObjectType) error {

	// 过滤条件用map接，然后再decode到condCfg中
	var actualCond *cond.CondCfg
	err := mapstructure.Decode(query.Condition, &actualCond)
	if err != nil {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyQuery_InvalidParameter_Condition).
			WithErrorDetails(fmt.Sprintf("mapstructure decode condition failed: %s", err.Error()))
	}
	query.ActualCondition = actualCond

	return nil
}

// 基于行动类的行动数据查询的参数校验
func validateActionQuery(ctx context.Context, query *interfaces.ActionQuery) error {

	// 校验查询时间范围的相关参数
	// err := validateQueryTimeParam(ctx, &query.QueryTimeParams)
	// if err != nil {
	// 	return err
	// }

	// // 校验 filters
	// err = validateFilters(ctx, query.Filters)
	// if err != nil {
	// 	return err
	// }

	// // 校验同环比参数
	// err = validateRequestMetrics(ctx, query)
	// if err != nil {
	// 	return err
	// }

	return nil
}

// 属性值查询的参数校验
func validateObjectPropertyValueQuery(ctx context.Context, query *interfaces.ObjectPropertyValueQuery) error {

	// 校验查询时间范围的相关参数
	// err := validateQueryTimeParam(ctx, &query.QueryTimeParams)
	// if err != nil {
	// 	return err
	// }

	// // 校验 filters
	// err = validateFilters(ctx, query.Filters)
	// if err != nil {
	// 	return err
	// }

	// // 校验同环比参数
	// err = validateRequestMetrics(ctx, query)
	// if err != nil {
	// 	return err
	// }

	return nil
}

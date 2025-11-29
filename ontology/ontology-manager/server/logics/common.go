package logics

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"

	oerrors "ontology-manager/errors"
	"ontology-manager/interfaces"
)

func BuildDslQuery(ctx context.Context, queryStr string, query *interfaces.ConceptsQuery) (map[string]any, error) {
	var dslMap map[string]any
	err := json.Unmarshal([]byte(queryStr), &dslMap)
	if err != nil {
		return map[string]any{}, rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_InternalError_UnMarshalDataFailed).
			WithErrorDetails(fmt.Sprintf("failed to unMarshal dslStr to map, %s", err.Error()))
	}

	// 处理 sort
	sort := []map[string]any{}
	for _, sp := range query.Sort {
		// 不做排序字段参数校验了，如果排序字段不存在，opensearch会报错，由opensearch来报错
		sort = append(sort, map[string]any{
			sp.Field: sp.Direction,
		})
	}

	if len(query.SearchAfter) > 0 {
		query.NeedTotal = false
	}

	// 如果没传 limit，传了 search_after 参数，设置默认limit 10000
	if query.Limit == 0 && query.SearchAfter != nil && len(query.SearchAfter) > 0 {
		query.Limit = interfaces.SearchAfter_Limit
	}

	dsl := map[string]any{
		"size": query.Limit,
		"sort": sort,
	}
	dsl["query"] = dslMap

	// 存在search after时需加上search_after
	if query.SearchAfter != nil {
		dsl["search_after"] = query.SearchAfter
	}

	return dsl, nil
}

package logics

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync/atomic"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"

	cond "ontology-query/common/condition"
	oerrors "ontology-query/errors"
	"ontology-query/interfaces"
)

// 构建默认的排序
func BuildSort(objectType interfaces.ObjectType) []*interfaces.SortParams {
	sorts := []*interfaces.SortParams{
		{
			Field:     interfaces.SORT_FIELD_SCORE,
			Direction: interfaces.DESC_DIRECTION,
		},
	}
	// 属性到视图的映射。主键是属性名，需要找到主键属性再找到其映射的视图字段名
	propFieldMap := map[string]string{}
	for _, prop := range objectType.DataProperties {
		propFieldMap[prop.Name] = prop.MappedField.Name
	}

	for _, pri := range objectType.PrimaryKeys {
		if fieldName, exists := propFieldMap[pri]; exists {
			// 存在映射，则组装到对象属性中
			sorts = append(sorts, &interfaces.SortParams{
				Field:     fieldName,
				Direction: interfaces.ASC_DIRECTION,
			})
		}
	}
	return sorts
}

// 构建路径键用于循环检测
func BuildPathKey(path interfaces.RelationPath, nextNodeID string) string {
	key := fmt.Sprintf("%s:%s", path.Relations[0].RelationTypeId, path.Relations[0].SourceObjectId)
	for i := 1; i < len(path.Relations); i++ {
		key += fmt.Sprintf("->%s", path.Relations[i].TargetObjectId)
	}
	key += fmt.Sprintf("->%s", nextNodeID)
	return key
}

// 过滤有效路径（排除包含循环的路径）
func FilterValidPaths(paths []interfaces.RelationPath, visitedNodes map[string]bool) []interfaces.RelationPath {
	var validPaths []interfaces.RelationPath

	for _, path := range paths {
		if IsPathValid(path, visitedNodes) {
			validPaths = append(validPaths, path)
		}
	}

	return validPaths
}

// 检查路径是否有效（无循环）
func IsPathValid(path interfaces.RelationPath, visitedNodes map[string]bool) bool {
	nodeSet := make(map[string]bool)

	// 检查路径中的每个节点是否唯一
	for _, relation := range path.Relations {
		if nodeSet[relation.SourceObjectId] {
			logger.Debugf("检测到循环路径 - 重复节点: %s", relation.SourceObjectId)
			return false
		}
		nodeSet[relation.SourceObjectId] = true

		if nodeSet[relation.TargetObjectId] {
			logger.Debugf("检测到循环路径 - 重复节点: %s", relation.TargetObjectId)
			return false
		}
		nodeSet[relation.TargetObjectId] = true
	}

	return true
}

// 检查限制
func CanGenerate(quotaManager *interfaces.PathQuotaManager, pathID int) bool {
	if quotaManager == nil {
		return true
	}

	// 检查全局限制
	currentGlobal := atomic.LoadInt64(&quotaManager.GlobalCount)
	if currentGlobal >= quotaManager.TotalLimit {
		logger.Debugf("达到全局限制: %d/%d", currentGlobal, quotaManager.TotalLimit)
		return false
	}

	used := 0
	if value, exist := quotaManager.UsedQuota.Load(pathID); !exist {
		quotaManager.UsedQuota.Store(pathID, used)
	} else {
		used = value.(int)
	}

	if quotaManager.RequestPathTypeNum > 1 {
		// 动态配额：根据权重和剩余总量计算
		maxQuota := quotaManager.TotalLimit - quotaManager.GlobalCount
		return int64(used) < maxQuota
	} else {
		// 总数小于限制数，可添加
		return quotaManager.GlobalCount < quotaManager.TotalLimit
	}
}

// RecordGenerated 记录已生成的路径
func RecordGenerated(quotaManager *interfaces.PathQuotaManager, typePathID int, cnt int) {
	if quotaManager == nil {
		return
	}

	// 原子操作增加全局计数
	newGlobalCount := atomic.AddInt64(&quotaManager.GlobalCount, int64(cnt))

	// 更新特定路径类型的配额使用情况
	if value, exist := quotaManager.UsedQuota.Load(typePathID); !exist {
		quotaManager.UsedQuota.Store(typePathID, cnt)
	} else {
		quotaManager.UsedQuota.Store(typePathID, value.(int)+cnt)
	}
	logger.Debugf("路径配额更新 - 路径ID: %d, 新增: %d, 全局计数: %d/%d",
		typePathID, cnt, newGlobalCount, quotaManager.TotalLimit)
}

// 从对象数据中提取对象ID
func GetObjectID(objectData map[string]any, objectType *interfaces.ObjectType) (string, map[string]any) {
	if objectType == nil || len(objectType.PrimaryKeys) == 0 {
		return "", nil
	}

	// 使用主键构建对象ID
	var idParts []string
	uk := map[string]any{}
	for _, pk := range objectType.PrimaryKeys {
		if value, exists := objectData[pk]; exists {
			idParts = append(idParts, fmt.Sprintf("%v", value))
			uk[pk] = value
		}
	}

	if len(idParts) == 0 {
		return "", uk
	}

	return objectType.OTID + "-" + strings.Join(idParts, "_"), uk
}

// 构建直接映射的批量条件
func BuildDirectBatchConditions(currentLevelObjects []interfaces.LevelObject,
	edge *interfaces.TypeEdge, isForward bool) ([]*cond.CondCfg, error) {

	var conditions []*cond.CondCfg
	var inValues []any
	var inField string
	mappingRules := edge.RelationType.MappingRules.([]interfaces.Mapping)

	for _, levelObj := range currentLevelObjects {
		// 按关联关系构建了过滤子句。
		// 多个字段关联，需用and连接各个对象的过滤条件，然后再用or拼接各个对象的过滤条件
		// 1个关联字段，则对多个对象的过滤条件采用in操作
		objectConditions, targetField, inValue := BuildCondition(nil, mappingRules, isForward, levelObj.ObjectData)
		if inValue != nil {
			inValues = append(inValues, inValue)
		}
		inField = targetField

		// 一个对象下如果是多个过滤子句，则用and关联
		if len(objectConditions) > 1 {
			conditions = append(conditions, &cond.CondCfg{
				Operation: "and",
				SubConds:  objectConditions,
			})
		} else if len(objectConditions) == 1 {
			conditions = append(conditions, objectConditions[0])
		}
	}

	if len(mappingRules) == 1 && len(inValues) > 0 {
		return []*cond.CondCfg{
			{
				Name:      inField,
				Operation: "in",
				ValueOptCfg: cond.ValueOptCfg{
					ValueFrom: "const",
					Value:     inValues,
				},
			},
		}, nil
	}

	return conditions, nil
}

func BuildCondition(viewQuery *interfaces.ViewQuery, mappingRules []interfaces.Mapping,
	isForward bool, currentObjectData map[string]any) ([]*cond.CondCfg, string, any) {

	conditions := []*cond.CondCfg{}
	var inValue any
	var targetField string
	// 视图作为中间表时，查询视图数据按 _score desc, 关联字段 asc
	sort := []*interfaces.SortParams{
		{
			Field:     interfaces.SORT_FIELD_SCORE,
			Direction: interfaces.DESC_DIRECTION,
		},
	}

	for _, mapping := range mappingRules {
		// 默认先取正向的，若是反向，再修改起终点字段
		targetName := mapping.TargetProp.Name
		sourceName := mapping.SourceProp.Name
		if !isForward {
			targetName = mapping.SourceProp.Name
			sourceName = mapping.TargetProp.Name
		}
		// 一个关联字段，则取字段值作为in的过滤条件
		if len(mappingRules) == 1 {
			inValue = currentObjectData[sourceName]
			targetField = targetName
		}
		// 多个字段关联，则构造多个过滤条件，在上层用and连接
		conditions = append(conditions, &cond.CondCfg{
			Name:      targetName, // 注意正向反向的差别
			Operation: "==",       // 关联时只有等于的关系
			ValueOptCfg: cond.ValueOptCfg{
				ValueFrom: "const",
				Value:     currentObjectData[sourceName], // 从起点对象中获取的起点属性
			},
		})
		sort = append(sort, &interfaces.SortParams{
			Field:     targetName,
			Direction: interfaces.ASC_DIRECTION,
		})
	}

	if viewQuery != nil {
		if len(conditions) > 0 {
			viewQuery.Filters = &cond.CondCfg{
				Operation: "and",
				SubConds:  conditions,
			}
		}
		viewQuery.Sort = sort
	}

	return conditions, targetField, inValue
}

// 检查直接映射条件
func CheckDirectMappingConditions(currentObjectData map[string]any,
	nextObject map[string]any, mappingRules []interfaces.Mapping, isForward bool) bool {

	for _, mapping := range mappingRules {
		var sourceValue, targetValue interface{}
		var ok bool

		if isForward {
			// 正向：currentObject -> nextObject
			sourceValue, ok = currentObjectData[mapping.SourceProp.Name]
			if !ok {
				return false
			}
			targetValue, ok = nextObject[mapping.TargetProp.Name]
			if !ok {
				return false
			}
		} else {
			// 反向：nextObject -> currentObject
			sourceValue, ok = nextObject[mapping.SourceProp.Name]
			if !ok {
				return false
			}
			targetValue, ok = currentObjectData[mapping.TargetProp.Name]
			if !ok {
				return false
			}
		}

		// 比较值是否相等
		if !CompareValues(sourceValue, targetValue) {
			return false
		}
	}

	return true
}

// 比较两个值是否相等（处理不同类型的情况）
func CompareValues(a, b interface{}) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}

	// 转换为字符串比较，避免类型不匹配的问题
	aStr := fmt.Sprintf("%v", a)
	bStr := fmt.Sprintf("%v", b)

	return aStr == bStr
}

// 检查视图数据是否满足查询条件
func CheckViewDataMatchesCondition(viewData map[string]any,
	condition *cond.CondCfg, mappingRules []interfaces.Mapping, isForward bool) bool {

	// 简化实现：根据映射规则检查视图数据
	for _, mapping := range mappingRules {
		var fieldName string
		if isForward {
			fieldName = mapping.TargetProp.Name
		} else {
			fieldName = mapping.SourceProp.Name
		}

		expectedValue, exists := viewData[fieldName]
		if !exists {
			return false
		}

		// 比较值是否相等。因为关系关联都是等于的关系，直接取值比较
		// 从条件里取值，不能只取一个，还需要考虑多字段关联的情况
		conditionValue := condition.ValueOptCfg.Value
		if !CompareValues(expectedValue, conditionValue) {
			return false
		}
	}

	return true
}

// 使用视图数据检查间接映射条件
func CheckIndirectMappingConditionsWithViewData(currentObjectData map[string]any,
	nextObject map[string]any, mappingRules interfaces.InDirectMapping, isForward bool,
	viewData []map[string]any) bool {

	// 检查是否存在一个视图记录能够连接当前对象和下一层对象
	for _, viewRecord := range viewData {
		// 检查当前对象 -> 视图记录的映射
		var sourceMapping []interfaces.Mapping
		if isForward {
			sourceMapping = mappingRules.SourceMappingRules
		} else {
			sourceMapping = mappingRules.TargetMappingRules
		}

		sourceMatch := true
		for _, mapping := range sourceMapping {
			sorcePropName := ""
			targetPropName := ""
			if isForward {
				sorcePropName = mapping.SourceProp.Name
				targetPropName = mapping.TargetProp.Name
			} else {
				sorcePropName = mapping.TargetProp.Name
				targetPropName = mapping.SourceProp.Name
			}
			currentValue, ok1 := currentObjectData[sorcePropName]
			viewValue, ok2 := viewRecord[targetPropName]
			if !ok1 || !ok2 || !CompareValues(currentValue, viewValue) {
				sourceMatch = false
				break
			}
		}
		if !sourceMatch {
			continue
		}

		// 检查视图记录 -> 下一层对象的映射
		var targetMapping []interfaces.Mapping
		if isForward {
			targetMapping = mappingRules.TargetMappingRules
		} else {
			targetMapping = mappingRules.SourceMappingRules
		}

		targetMatch := true
		for _, mapping := range targetMapping {
			sorcePropName := ""
			targetPropName := ""
			if isForward {
				sorcePropName = mapping.SourceProp.Name
				targetPropName = mapping.TargetProp.Name
			} else {
				sorcePropName = mapping.TargetProp.Name
				targetPropName = mapping.SourceProp.Name
			}

			viewValue, ok1 := viewRecord[sorcePropName]
			nextValue, ok2 := nextObject[targetPropName]
			if !ok1 || !ok2 || !CompareValues(viewValue, nextValue) {
				targetMatch = false
				break
			}
		}

		if targetMatch {
			return true
		}
	}

	return false
}

// 根据对象唯一标识构建对象查询的过滤条件
func BuildUniqueIdentitiesCondition(uks []map[string]any) *cond.CondCfg {
	ukSubConds := []*cond.CondCfg{}
	for _, uk := range uks { // 多个对象
		conds := []*cond.CondCfg{}
		for k, v := range uk { // 联合主键
			conds = append(conds, &cond.CondCfg{
				Name:      k,
				Operation: "==",
				ValueOptCfg: cond.ValueOptCfg{
					Value: v,
				},
			})
		}
		ukSubConds = append(ukSubConds, &cond.CondCfg{
			Operation: "and",
			SubConds:  conds,
		})
	}
	var ukCondition *cond.CondCfg
	if len(ukSubConds) > 1 {
		ukCondition = &cond.CondCfg{
			Operation: "or",
			SubConds:  ukSubConds,
		}
	} else {
		ukCondition = ukSubConds[0]
	}
	return ukCondition
}

func TransferPropsToPropMap(props []cond.DataProperty) map[string]*cond.DataProperty {
	propMap := map[string]*cond.DataProperty{}
	for _, prop := range props {
		propMap[prop.Name] = &prop
		// 后面计划:若修改了索引配置,则把索引状态设置为不可用,那么就走虚拟化查询,不走持久化.所以查询这里可以认为是准确的
		// if prop.IndexConfig != nil && prop.IndexConfig.FulltextConfig.Enabled {
		// 	// 配置了全文索引的,字段类型定义为text
		// 	propMap[prop.Name] = prop
		// } else if prop.IndexConfig != nil && prop.IndexConfig.VectorConfig.Enabled {
		// 	// 配置了向量化的字段
		// 	propMap[prop.Name] = prop

		// 	propMap[prop.Name] = prop
		// } else {
		// 	// 其他情况
		// 	propMap[prop.Name] = prop
		// }
	}

	return propMap
}

// 构建dsl的query
func BuildDslQuery(ctx context.Context, queryStr string, query *interfaces.ObjectQueryBaseOnObjectType) (map[string]any, error) {

	var dslMap map[string]any
	err := json.Unmarshal([]byte(queryStr), &dslMap)
	if err != nil {
		return map[string]any{}, rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyQuery_InternalError_UnMarshalDataFailed).
			WithErrorDetails(fmt.Sprintf("failed to unMarshal dslStr to map, %s", err.Error()))
	}

	// 处理 sort
	sort := []map[string]any{}
	for _, sp := range query.Sort {
		// 不做排序字段参数校验了，如果排序字段不存在，opensearch会报错，由opensearch来报错
		// _score 是传递给视图的字段,这里是直接查opensearch,那么这个_score需要改为_score
		// if sp.Field == interfaces.SORT_FIELD_SCORE {
		// 	sort = append(sort, map[string]any{
		// 		"_score": sp.Direction,
		// 	})
		// } else {
		sort = append(sort, map[string]any{
			sp.Field: sp.Direction,
		})
		// }
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
	if len(dslMap) > 0 {
		dsl["query"] = dslMap
	}

	// 存在search after时需加上search_after
	if query.SearchAfter != nil {
		dsl["search_after"] = query.SearchAfter
	}

	return dsl, nil
}

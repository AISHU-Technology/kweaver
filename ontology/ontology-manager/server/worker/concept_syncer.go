package worker

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"github.com/bytedance/sonic"
	"github.com/mitchellh/mapstructure"

	"ontology-manager/common"
	"ontology-manager/interfaces"
	"ontology-manager/logics"
)

var (
	cSyncerOnce sync.Once
	cSyncer     *ConceptSyncer
)

type ConceptSyncer struct {
	appSetting *common.AppSetting
	ata        interfaces.ActionTypeAccess
	mfa        interfaces.ModelFactoryAccess
	kna        interfaces.KNAccess
	osa        interfaces.OpenSearchAccess
	ota        interfaces.ObjectTypeAccess
	rta        interfaces.RelationTypeAccess
}

func NewConceptSyncer(appSetting *common.AppSetting) *ConceptSyncer {
	cSyncerOnce.Do(func() {
		cSyncer = &ConceptSyncer{
			appSetting: appSetting,
			ata:        logics.ATA,
			mfa:        logics.MFA,
			kna:        logics.KNA,
			osa:        logics.OSA,
			ota:        logics.OTA,
			rta:        logics.RTA,
		}
	})
	return cSyncer
}

// KNDetailInfo 知识网络详情信息结构
type KNDetailInfo struct {
	NetworkInfo   map[string]any `json:"network_info"`
	ObjectTypes   []SimpleItem   `json:"object_types"`
	RelationTypes []SimpleItem   `json:"relation_types"`
	ActionTypes   []SimpleItem   `json:"action_types"`
}

// SimpleItem 简化项结构，仅保留id、name、tag、comment字段
type SimpleItem struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Tags    []string `json:"tags"`
	Comment string   `json:"comment"`

	// for relation types
	SourceObjectTypeName string `json:"source_object_type_name,omitempty"`
	TargetObjectTypeName string `json:"target_object_type_name,omitempty"`

	// for action types
	ObjectTypeName string `json:"object_type_name,omitempty"`
}

// GeneratorTicker 生成业务知识网络详情定时任务
func (cs *ConceptSyncer) Start() {
	for {
		err := cs.handleKNs()
		if err != nil {
			logger.Errorf("[handleKNs] Failed: %v", err)
		}
		time.Sleep(5 * time.Minute)
	}
}

// handleKNs 处理业务知识网络详情 todo：补充 对象类、关系类、行动类的detail，并且要更新概念索引
func (cs *ConceptSyncer) handleKNs() error {
	defer func() {
		if rerr := recover(); rerr != nil {
			logger.Errorf("[handleKNs] Failed: %v", rerr)
			return
		}
	}()

	logger.Debug("[handleKNs] Start")

	ctx := context.Background()

	knsInDB, err := cs.kna.GetAllKNs(ctx)
	if err != nil {
		logger.Errorf("Failed to list knowledge networks: %v", err)
		return err
	}

	knsInOS, err := cs.getAllKNsFromOpenSearch(ctx)
	if err != nil {
		logger.Errorf("Failed to list knowledge networks in OpenSearch: %v", err)
		return err
	}

	for _, knInDB := range knsInDB {
		need_update := false
		knInOS, exist := knsInOS[knInDB.KNID]
		if !exist {
			need_update = true
		} else if knInDB.UpdateTime != knInOS.UpdateTime {
			need_update = true
		}

		err := cs.handleKnowledgeNetwork(ctx, knInDB, need_update)
		if err != nil {
			logger.Errorf("Failed to handle knowledge network %s: %v", knInDB.KNName, err)
			continue
		}
	}

	logger.Info("handle KNs completed")
	return nil
}

// handleKnowledgeNetwork 处理单个知识网络
func (cs *ConceptSyncer) handleKnowledgeNetwork(ctx context.Context, kn *interfaces.KN, need_update bool) error {
	logger.Infof("Handle knowledge network: %s (%s)", kn.KNName, kn.KNID)

	// 获取对象类型列表
	objectTypes, ot_need_update, err := cs.handleObjectTypes(ctx, kn.KNID)
	if err != nil {
		logger.Errorf("Failed to handle object types %s: %v", kn.KNID, err)
		return err
	}
	objectTypesMap := map[string]string{}
	for _, objectType := range objectTypes {
		objectTypesMap[objectType.ID] = objectType.Name
	}
	// 获取关系类型列表
	relationTypes, rt_need_update, err := cs.handleRelationTypes(ctx, kn.KNID, objectTypesMap)
	if err != nil {
		logger.Errorf("Failed to handle relation types %s: %v", kn.KNID, err)
		return err
	}
	// 获取行动类型列表
	actionTypes, at_need_update, err := cs.handleActionTypes(ctx, kn.KNID, objectTypesMap)
	if err != nil {
		logger.Errorf("Failed to handle action types %s: %v", kn.KNID, err)
		return err
	}

	if !need_update && !ot_need_update && !rt_need_update && !at_need_update {
		logger.Infof("Knowledge network %s (%s) does not need update", kn.KNName, kn.KNID)
		return nil
	}

	// 创建知识网络详情信息
	knDetail := KNDetailInfo{
		NetworkInfo: map[string]any{
			"id":                   kn.KNID,
			"name":                 kn.KNName,
			"tags":                 kn.Tags,
			"comment":              kn.Comment,
			"object_types_count":   int64(len(objectTypes)),
			"relation_types_count": int64(len(relationTypes)),
			"action_types_count":   int64(len(actionTypes)),
		},
		ObjectTypes:   objectTypes,
		RelationTypes: relationTypes,
		ActionTypes:   actionTypes,
	}

	// 转换为JSON字符串
	jsonData, err := sonic.MarshalString(knDetail)
	if err != nil {
		logger.Errorf("Failed to marshal KN detail to JSON: %v", err)
		return err
	}

	// 更新知识网络详情
	kn.Detail = jsonData
	err = cs.kna.UpdateKNDetail(ctx, kn.KNID, jsonData)
	if err != nil {
		logger.Errorf("Failed to update KN detail for %s: %v", kn.KNName, err)
		return err
	}

	err = cs.insertOpenSearchDataForKN(ctx, kn)
	if err != nil {
		logger.Errorf("Failed to insert open search data for KN %s: %v", kn.KNName, err)
		return err
	}

	logger.Infof("Generated KN detail for %s: %s", kn.KNName, string(jsonData))
	return nil
}

// handleObjectTypes 获取知识网络的对象类型
func (cs *ConceptSyncer) handleObjectTypes(ctx context.Context, knID string) ([]SimpleItem, bool, error) {
	objectTypesInDB, err := cs.ota.GetAllObjectTypesByKnID(ctx, knID)
	if err != nil {
		return []SimpleItem{}, false, err
	}

	objectTypesInOS, err := cs.getAllObjectTypesFromOpenSearchByKnID(ctx, knID)
	if err != nil {
		return []SimpleItem{}, false, err
	}

	need_update := false
	add_list := []*interfaces.ObjectType{}
	for _, otInDB := range objectTypesInDB {
		otInOS, exist := objectTypesInOS[otInDB.OTID]
		if !exist {
			add_list = append(add_list, otInDB)
		} else if otInDB.UpdateTime != otInOS.UpdateTime {
			add_list = append(add_list, otInDB)
		}
	}
	if len(add_list) > 0 {
		need_update = true
	}
	// TODO 获取opensearch 中 list
	// 对比list，判断是否需要更新

	err = cs.insertOpenSearchDataForObjectTypes(ctx, add_list)
	if err != nil {
		return []SimpleItem{}, false, err
	}

	// 简化为仅保留id、name、tag、comment字段
	simpleObjectTypes := make([]SimpleItem, 0, len(objectTypesInDB))
	for _, otInDB := range objectTypesInDB {
		simpleItem := SimpleItem{
			ID:      otInDB.OTID,
			Name:    otInDB.OTName,
			Tags:    otInDB.Tags,
			Comment: otInDB.Comment,
		}
		simpleObjectTypes = append(simpleObjectTypes, simpleItem)
	}

	return simpleObjectTypes, need_update, nil
}

// handleRelationTypes 获取知识网络的关系类型
func (cs *ConceptSyncer) handleRelationTypes(ctx context.Context, knID string,
	objectTypesMap map[string]string) ([]SimpleItem, bool, error) {

	relationTypesInDB, err := cs.rta.GetAllRelationTypesByKnID(ctx, knID)
	if err != nil {
		return []SimpleItem{}, false, err
	}

	relationTypesInOS, err := cs.getAllRelationTypesFromOpenSearchByKnID(ctx, knID)
	if err != nil {
		return []SimpleItem{}, false, err
	}

	need_update := false
	add_list := []*interfaces.RelationType{}
	for _, rtInDB := range relationTypesInDB {
		rtInOS, exist := relationTypesInOS[rtInDB.RTID]
		if !exist {
			add_list = append(add_list, rtInDB)
		} else if rtInDB.UpdateTime != rtInOS.UpdateTime {
			add_list = append(add_list, rtInDB)
		}
	}
	if len(add_list) > 0 {
		need_update = true
	}

	err = cs.insertOpenSearchDataForRelationTypes(ctx, add_list)
	if err != nil {
		return []SimpleItem{}, false, err
	}

	// 简化为仅保留id、name、tag、comment字段
	simpleRelationTypes := make([]SimpleItem, 0, len(relationTypesInDB))
	for _, rtInDB := range relationTypesInDB {
		sourceObjectTypeName := objectTypesMap[rtInDB.SourceObjectTypeID]
		targetObjectTypeName := objectTypesMap[rtInDB.TargetObjectTypeID]
		simpleItem := SimpleItem{
			ID:                   rtInDB.RTID,
			Name:                 rtInDB.RTName,
			Tags:                 rtInDB.Tags,
			Comment:              rtInDB.Comment,
			SourceObjectTypeName: sourceObjectTypeName,
			TargetObjectTypeName: targetObjectTypeName,
		}
		simpleRelationTypes = append(simpleRelationTypes, simpleItem)
	}

	return simpleRelationTypes, need_update, nil
}

// handleActionTypes 获取知识网络的行动类型
func (cs *ConceptSyncer) handleActionTypes(ctx context.Context, knID string,
	objectTypesMap map[string]string) ([]SimpleItem, bool, error) {

	actionTypesInDB, err := cs.ata.GetAllActionTypesByKnID(ctx, knID)
	if err != nil {
		return []SimpleItem{}, false, err
	}

	actionTypesInOS, err := cs.getAllActionTypesFromOpenSearchByKnID(ctx, knID)
	if err != nil {
		return []SimpleItem{}, false, err
	}

	need_update := false
	add_list := []*interfaces.ActionType{}
	for _, atInDB := range actionTypesInDB {
		atInOS, exist := actionTypesInOS[atInDB.ATID]
		if !exist {
			add_list = append(add_list, atInDB)
		} else if atInDB.UpdateTime != atInOS.UpdateTime {
			add_list = append(add_list, atInDB)
		}
	}
	if len(add_list) > 0 {
		need_update = true
	}

	err = cs.insertOpenSearchDataForActionTypes(ctx, add_list)
	if err != nil {
		return []SimpleItem{}, false, err
	}

	// 简化为仅保留id、name、tag、comment字段
	simpleActionTypes := make([]SimpleItem, 0, len(actionTypesInDB))
	for _, atInDB := range actionTypesInDB {
		objectTypeName := objectTypesMap[atInDB.ObjectTypeID]
		simpleItem := SimpleItem{
			ID:             atInDB.ATID,
			Name:           atInDB.ATName,
			Tags:           atInDB.Tags,
			Comment:        atInDB.Comment,
			ObjectTypeName: objectTypeName,
		}
		simpleActionTypes = append(simpleActionTypes, simpleItem)
	}

	return simpleActionTypes, need_update, nil
}

func (cs *ConceptSyncer) insertOpenSearchDataForKN(ctx context.Context, kn *interfaces.KN) error {
	if cs.appSetting.ServerSetting.DefaultSmallModelEnabled {
		words := []string{kn.KNName}
		words = append(words, kn.Tags...)
		words = append(words, kn.Comment, kn.Detail)
		word := strings.Join(words, "\n")

		defaultModel, err := cs.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			return err
		}
		vectors, err := cs.mfa.GetVector(ctx, defaultModel, []string{word})
		if err != nil {
			logger.Errorf("GetVector error: %s", err.Error())
			return err
		}

		kn.Vector = vectors[0].Vector
	}

	docid := interfaces.GenerateConceptDocuemtnID(kn.KNID, interfaces.MODULE_TYPE_KN, kn.KNID, kn.Branch)
	kn.ModuleType = interfaces.MODULE_TYPE_KN

	err := cs.osa.InsertData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid, kn)
	if err != nil {
		logger.Errorf("InsertData error: %s", err.Error())
		return err
	}

	return nil
}

func (cs *ConceptSyncer) insertOpenSearchDataForObjectTypes(ctx context.Context, objectTypes []*interfaces.ObjectType) error {
	if len(objectTypes) == 0 {
		return nil
	}

	if cs.appSetting.ServerSetting.DefaultSmallModelEnabled {
		words := []string{}
		for _, ot := range objectTypes {
			arr := []string{ot.OTName}
			arr = append(arr, ot.Tags...)
			arr = append(arr, ot.Comment, ot.Detail)
			word := strings.Join(arr, "\n")
			words = append(words, word)
		}

		dftModel, err := cs.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			return err
		}
		vectors, err := cs.mfa.GetVector(ctx, dftModel, words)
		if err != nil {
			logger.Errorf("GetVector error: %s", err.Error())
			return err
		}

		if len(vectors) != len(objectTypes) {
			logger.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(objectTypes), len(vectors))
			return fmt.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(objectTypes), len(vectors))
		}

		for i, ot := range objectTypes {
			ot.Vector = vectors[i].Vector
		}
	}

	for _, ot := range objectTypes {
		docid := interfaces.GenerateConceptDocuemtnID(ot.KNID, interfaces.MODULE_TYPE_OBJECT_TYPE,
			ot.OTID, ot.Branch)
		ot.ModuleType = interfaces.MODULE_TYPE_OBJECT_TYPE

		err := cs.osa.InsertData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid, ot)
		if err != nil {
			logger.Errorf("InsertData error: %s", err.Error())
			return err
		}
	}
	return nil
}

func (cs *ConceptSyncer) insertOpenSearchDataForActionTypes(ctx context.Context, actionTypes []*interfaces.ActionType) error {
	if len(actionTypes) == 0 {
		return nil
	}

	if cs.appSetting.ServerSetting.DefaultSmallModelEnabled {
		words := []string{}
		for _, at := range actionTypes {
			arr := []string{at.ATName}
			arr = append(arr, at.Tags...)
			arr = append(arr, at.Comment, at.Detail)
			word := strings.Join(arr, "\n")
			words = append(words, word)
		}

		dftModel, err := cs.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			return err
		}
		vectors, err := cs.mfa.GetVector(ctx, dftModel, words)
		if err != nil {
			logger.Errorf("GetVector error: %s", err.Error())
			return err
		}

		if len(vectors) != len(actionTypes) {
			logger.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(actionTypes), len(vectors))
			return fmt.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(actionTypes), len(vectors))
		}

		for i, at := range actionTypes {
			at.Vector = vectors[i].Vector
		}
	}

	for _, at := range actionTypes {
		docid := interfaces.GenerateConceptDocuemtnID(at.KNID, interfaces.MODULE_TYPE_ACTION_TYPE,
			at.ATID, at.Branch)
		at.ModuleType = interfaces.MODULE_TYPE_ACTION_TYPE

		err := cs.osa.InsertData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid, at)
		if err != nil {
			logger.Errorf("InsertData error: %s", err.Error())
			return err
		}
	}
	return nil
}

func (cs *ConceptSyncer) insertOpenSearchDataForRelationTypes(ctx context.Context, relationTypes []*interfaces.RelationType) error {
	if len(relationTypes) == 0 {
		return nil
	}

	if cs.appSetting.ServerSetting.DefaultSmallModelEnabled {
		words := []string{}
		for _, relationType := range relationTypes {
			arr := []string{relationType.RTName}
			arr = append(arr, relationType.Tags...)
			arr = append(arr, relationType.Comment, relationType.Detail)
			word := strings.Join(arr, "\n")
			words = append(words, word)
		}

		dftModel, err := cs.mfa.GetDefaultModel(ctx)
		if err != nil {
			logger.Errorf("GetDefaultModel error: %s", err.Error())
			return err
		}
		vectors, err := cs.mfa.GetVector(ctx, dftModel, words)
		if err != nil {
			logger.Errorf("GetVector error: %s", err.Error())
			return err
		}

		if len(vectors) != len(relationTypes) {
			logger.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(relationTypes), len(vectors))
			return fmt.Errorf("GetVector error: expect vectors num is [%d], actual vectors num is [%d]", len(relationTypes), len(vectors))
		}

		for i, rt := range relationTypes {
			rt.Vector = vectors[i].Vector
		}
	}

	for _, rt := range relationTypes {
		docid := interfaces.GenerateConceptDocuemtnID(rt.KNID, interfaces.MODULE_TYPE_RELATION_TYPE,
			rt.RTID, rt.Branch)
		rt.ModuleType = interfaces.MODULE_TYPE_RELATION_TYPE

		err := cs.osa.InsertData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, docid, rt)
		if err != nil {
			logger.Errorf("InsertData error: %s", err.Error())
			return err
		}
	}
	return nil
}

func (cs *ConceptSyncer) getAllKNsFromOpenSearch(ctx context.Context) (map[string]*interfaces.KN, error) {
	query := map[string]any{
		"size": 10000,
		"query": map[string]any{
			"bool": map[string]any{
				"filter": []any{
					map[string]any{
						"term": map[string]any{
							"module_type": interfaces.MODULE_TYPE_KN,
						},
					},
				},
			},
		},
	}

	hits, err := cs.osa.SearchData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, query)
	if err != nil {
		return map[string]*interfaces.KN{}, err
	}

	kns := map[string]*interfaces.KN{}
	for _, hit := range hits {

		kn := interfaces.KN{}
		err := mapstructure.Decode(hit.Source, &kn)
		if err != nil {
			return map[string]*interfaces.KN{}, err
		}

		kns[kn.KNID] = &kn
	}

	return kns, nil
}

func (cs *ConceptSyncer) getAllObjectTypesFromOpenSearchByKnID(ctx context.Context, knID string) (map[string]*interfaces.ObjectType, error) {
	query := map[string]any{
		"size": 10000,
		"query": map[string]any{
			"bool": map[string]any{
				"filter": []any{
					map[string]any{
						"term": map[string]any{
							"kn_id": knID,
						},
					},
					map[string]any{
						"term": map[string]any{
							"module_type": interfaces.MODULE_TYPE_OBJECT_TYPE,
						},
					},
				},
			},
		},
	}

	hits, err := cs.osa.SearchData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, query)
	if err != nil {
		return map[string]*interfaces.ObjectType{}, err
	}

	objectTypes := map[string]*interfaces.ObjectType{}
	for _, hit := range hits {

		ot := interfaces.ObjectType{}
		err := mapstructure.Decode(hit.Source, &ot)
		if err != nil {
			return map[string]*interfaces.ObjectType{}, err
		}

		objectTypes[ot.OTID] = &ot
	}

	return objectTypes, nil
}

func (cs *ConceptSyncer) getAllRelationTypesFromOpenSearchByKnID(ctx context.Context, knID string) (map[string]*interfaces.RelationType, error) {
	query := map[string]any{
		"size": 10000,
		"query": map[string]any{
			"bool": map[string]any{
				"filter": []any{
					map[string]any{
						"term": map[string]any{
							"kn_id": knID,
						},
					},
					map[string]any{
						"term": map[string]any{
							"module_type": interfaces.MODULE_TYPE_RELATION_TYPE,
						},
					},
				},
			},
		},
	}

	hits, err := cs.osa.SearchData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, query)
	if err != nil {
		return map[string]*interfaces.RelationType{}, err
	}

	relationTypes := map[string]*interfaces.RelationType{}
	for _, hit := range hits {

		rt := interfaces.RelationType{}
		err = mapstructure.Decode(hit.Source, &rt)
		if err != nil {
			return map[string]*interfaces.RelationType{}, err
		}

		relationTypes[rt.RTID] = &rt
	}

	return relationTypes, nil
}

func (cs *ConceptSyncer) getAllActionTypesFromOpenSearchByKnID(ctx context.Context, knID string) (map[string]*interfaces.ActionType, error) {
	query := map[string]any{
		"size": 10000,
		"query": map[string]any{
			"bool": map[string]any{
				"filter": []any{
					map[string]any{
						"term": map[string]any{
							"kn_id": knID,
						},
					},
					map[string]any{
						"term": map[string]any{
							"module_type": interfaces.MODULE_TYPE_ACTION_TYPE,
						},
					},
				},
			},
		},
	}

	hits, err := cs.osa.SearchData(ctx, interfaces.KN_CONCEPT_INDEX_NAME, query)
	if err != nil {
		return map[string]*interfaces.ActionType{}, err
	}

	actionTypes := map[string]*interfaces.ActionType{}
	for _, hit := range hits {

		at := interfaces.ActionType{}
		err = mapstructure.Decode(hit.Source, &at)
		if err != nil {
			return map[string]*interfaces.ActionType{}, err
		}

		actionTypes[at.ATID] = &at
	}

	return actionTypes, nil
}

package worker

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"strings"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"github.com/mohae/deepcopy"

	"ontology-manager/common"
	cond "ontology-manager/common/condition"
	"ontology-manager/interfaces"
	"ontology-manager/logics"
)

type VectorProperty struct {
	Name           string
	VectorField    string
	Model          *interfaces.SmallModel
	AllVectorResps []cond.VectorResp
	Err            error
}

type ObjectTypeTask struct {
	appSetting *common.AppSetting
	dva        interfaces.DataViewAccess
	mfa        interfaces.ModelFactoryAccess
	osa        interfaces.OpenSearchAccess

	ViewDataLimit int
	task          *interfaces.Task
	objectType    *interfaces.ObjectType

	propertyMapping  map[string]string
	vectorProperties []*VectorProperty
	totalCount       int64
	currentCount     int64
}

func NewObjectTypeTask(appSetting *common.AppSetting, task *interfaces.Task,
	objectType *interfaces.ObjectType) *ObjectTypeTask {

	return &ObjectTypeTask{
		appSetting: appSetting,
		dva:        logics.DVA,
		mfa:        logics.MFA,
		osa:        logics.OSA,

		ViewDataLimit: appSetting.ServerSetting.ViewDataLimit,
		task:          task,
		objectType:    objectType,

		propertyMapping:  make(map[string]string),
		vectorProperties: make([]*VectorProperty, 0),
		totalCount:       0,
		currentCount:     0,
	}
}

func (ott *ObjectTypeTask) HandleObjectTypeTask(ctx context.Context, job *interfaces.Job,
	task *interfaces.Task, objectType *interfaces.ObjectType) error {

	startTime := time.Now()
	logger.Infof("开始处理 object type %s", objectType.OTID)

	dataSource := objectType.DataSource
	if dataSource.Type != "data_view" {
		logger.Warnf("data source type %s is not data_view", dataSource.Type)
		return nil
	}

	for _, property := range objectType.DataProperties {
		if property.MappedField.Name == "" {
			continue
		}
		ott.propertyMapping[property.MappedField.Name] = property.Name
		if property.Type == "varchar" || property.Type == "string" || property.Type == "text" {
			if property.IndexConfig != nil && property.IndexConfig.VectorConfig.Enabled {

				model, err := ott.mfa.GetModelByID(ctx, property.IndexConfig.VectorConfig.ModelID)
				if err != nil {
					return err
				}
				if model == nil {
					return fmt.Errorf("failed to get small model by id '%s'", property.IndexConfig.VectorConfig.ModelID)
				}

				ott.vectorProperties = append(ott.vectorProperties, &VectorProperty{
					Name:           property.Name,
					VectorField:    "_vector_" + property.Name,
					Model:          model,
					AllVectorResps: make([]cond.VectorResp, 0),
				})
			}
		}
	}

	err := ott.handlerIndex(ctx, task, objectType)
	if err != nil {
		return err
	}

	dataView, err := ott.dva.GetDataViewByID(ctx, dataSource.ID)
	if err != nil {
		return err
	}

	currentStartTime := time.Now()
	viewQueryResult, err := ott.dva.GetDataStart(ctx, dataView.ViewID, ott.ViewDataLimit)
	if err != nil {
		logger.Errorf("从 %s 读取第一批数据失败: %s", dataView.ViewName, err.Error())
		return err
	}

	ott.totalCount = viewQueryResult.TotalCount
	err = ott.handlerIndexData(ctx, viewQueryResult)
	if err != nil {
		logger.Errorf("从视图 %s 读取第一批数据后写入第一批索引数据失败, 总条数：%d, 当前条数：%d, 失败原因: %s",
			dataView.ViewName, ott.totalCount, len(viewQueryResult.Entries), err.Error())
		return err
	}
	ott.currentCount += int64(len(viewQueryResult.Entries))

	logger.Infof("从 %s 读取一批数据, 总条数：%d, 当前条数：%d, 耗时：%dms, searchAfter: %v, 进度：%d/%d",
		dataView.ViewID, ott.totalCount, len(viewQueryResult.Entries), time.Since(currentStartTime).Milliseconds(),
		viewQueryResult.SearchAfter, ott.currentCount, ott.totalCount)

	for len(viewQueryResult.SearchAfter) > 0 {
		currentStartTime := time.Now()
		viewQueryResult, err = ott.dva.GetDataNext(ctx, dataView.ViewID,
			viewQueryResult.SearchAfter, ott.ViewDataLimit)
		if err != nil {
			logger.Errorf("从 %s 分批读取数据失败: %s", dataView.ViewName, err.Error())
			return err
		}
		err = ott.handlerIndexData(ctx, viewQueryResult)
		if err != nil {
			logger.Errorf("从视图 %s 分批读取数据后写入索引数据失败, 总条数：%d, 当前条数：%d, 失败原因: %s",
				dataView.ViewName, ott.totalCount, len(viewQueryResult.Entries), err.Error())
			return err
		}
		ott.currentCount += int64(len(viewQueryResult.Entries))

		logger.Infof("从 %s 分批读取数据, 总条数：%d, 当前条数：%d, 耗时：%dms, searchAfter: %v, 进度：%d/%d",
			dataView.ViewName, ott.totalCount, len(viewQueryResult.Entries), time.Since(currentStartTime).Milliseconds(),
			viewQueryResult.SearchAfter, ott.currentCount, ott.totalCount)
	}

	logger.Infof("处理 object type %s 完成, 总条数：%d, 当前条数：%d, 耗时：%dms",
		objectType.OTID, ott.totalCount, ott.currentCount, time.Since(startTime).Milliseconds())
	return nil
}

func (ott *ObjectTypeTask) handlerIndex(ctx context.Context, task *interfaces.Task, objectType *interfaces.ObjectType) error {
	logger.Debugf("handlerIndex: %v", task)

	exists, err := ott.osa.IndexExists(ctx, task.Index)
	if err != nil {
		logger.Errorf("CheckKNConceptIndexExists err:%v", err)
		return err
	}
	if exists {
		err = ott.osa.DeleteIndex(ctx, task.Index)
		if err != nil {
			logger.Errorf("DeleteKNConceptIndex err:%v", err)
			return err
		}
	}

	propertiesMap := map[string]any{}
	for _, property := range objectType.DataProperties {
		propConfig, ok := interfaces.KN_INDEX_PROP_TYPE_MAPPING[property.Type]
		if !ok {
			logger.Errorf("Unknown property type %s", property.Type)
			continue
		}
		propConfig = deepcopy.Copy(propConfig)

		if property.IndexConfig != nil {
			switch property.Type {
			case "string", "varchar", "keyword":
				if property.IndexConfig.KeywordConfig.Enabled {
					propConfig.(map[string]any)["ignore_above"] = property.IndexConfig.KeywordConfig.IgnoreAboveLen
				}
				if property.IndexConfig.FulltextConfig.Enabled {
					textPropConfig := deepcopy.Copy(interfaces.KN_INDEX_PROP_TYPE_MAPPING["text"])
					textPropConfig.(map[string]any)["analyzer"] = property.IndexConfig.FulltextConfig.Analyzer
					propConfig.(map[string]any)["fields"] = map[string]any{
						"text": textPropConfig,
					}
				}
			case "text":
				if property.IndexConfig.FulltextConfig.Enabled {
					propConfig.(map[string]any)["analyzer"] = property.IndexConfig.FulltextConfig.Analyzer
				}
				if property.IndexConfig.KeywordConfig.Enabled {
					keywordPropConfig := deepcopy.Copy(interfaces.KN_INDEX_PROP_TYPE_MAPPING["keyword"])
					keywordPropConfig.(map[string]any)["ignore_above"] = property.IndexConfig.KeywordConfig.IgnoreAboveLen
					propConfig.(map[string]any)["fields"] = map[string]any{
						"keyword": keywordPropConfig,
					}
				}
			}
		}

		propertiesMap[property.Name] = propConfig
	}

	for _, prop := range ott.vectorProperties {
		propVectoConfig := deepcopy.Copy(interfaces.KN_INDEX_PROP_TYPE_MAPPING["vector"])
		propVectoConfig.(map[string]any)["dimension"] = prop.Model.EmbeddingDim
		propertiesMap[prop.VectorField] = propVectoConfig
	}

	indexBody := map[string]any{
		"settings": interfaces.KN_INDEX_SETTINGS,
		"mappings": map[string]any{
			"dynamic_templates": interfaces.KN_INDEX_DYNAMIC_TEMPLATES,
			"properties":        propertiesMap,
		},
	}
	err = ott.osa.CreateIndex(ctx, task.Index, indexBody)
	if err != nil {
		logger.Errorf("CreateKNConceptIndex err:%v", err)
		return err
	}
	return nil
}

func (ott *ObjectTypeTask) handlerIndexData(ctx context.Context, viewQueryResult *interfaces.ViewQueryResult) error {
	if len(viewQueryResult.Entries) == 0 {
		return nil
	}
	newEntries := make([]any, 0, len(viewQueryResult.Entries))
	for _, entry := range viewQueryResult.Entries {
		newEntry := map[string]any{}
		for k, v := range ott.propertyMapping {
			newEntry[v] = entry[k]
		}
		//  handler __ID
		objectID := GetObjectID(entry, ott.objectType)
		newEntry[interfaces.OBJECT_ID] = objectID

		newEntries = append(newEntries, newEntry)
	}

	if len(ott.vectorProperties) > 0 {
		var wg sync.WaitGroup
		for _, property := range ott.vectorProperties {
			wg.Add(1)
			go func() {
				defer wg.Done()
				err := ott.handlerVector(ctx, property, newEntries)
				if err != nil {
					logger.Errorf("handlerVector err:%v", err)
					property.Err = err
				}
			}()
		}
		wg.Wait()

		for _, property := range ott.vectorProperties {
			if property.Err != nil {
				return property.Err
			}
			for i, entry := range newEntries {
				entry.(map[string]any)[property.VectorField] = property.AllVectorResps[i].Vector
			}
		}
	}

	// todo 分批 block 100m
	err := ott.osa.BulkInsertData(ctx, ott.task.Index, newEntries)
	if err != nil {
		return err
	}
	return nil
}

func (ott *ObjectTypeTask) handlerVector(ctx context.Context, property *VectorProperty, newEntries []any) error {
	words := []string{}
	for _, entry := range newEntries {
		word := entry.(map[string]any)[property.Name].(string)
		words = append(words, word)
	}

	allVectorResps, err := ott.mfa.GetVector(ctx, property.Model, words)
	if err != nil {
		return err
	}

	property.AllVectorResps = allVectorResps
	return nil
}

// 从对象数据中提取对象ID
func GetObjectID(objectData map[string]any, objectType *interfaces.ObjectType) string {
	if objectType == nil || len(objectType.PrimaryKeys) == 0 {
		return ""
	}

	// 使用主键构建对象ID
	var idParts []string
	for _, pk := range objectType.PrimaryKeys {
		if value, exists := objectData[pk]; exists {
			idParts = append(idParts, fmt.Sprintf("%v", value))
		}
	}

	if len(idParts) == 0 {
		return ""
	}

	// id: md5(主键值-主键值-...)
	md5Hasher := md5.New()
	md5Hasher.Write([]byte(strings.Join(idParts, "-")))
	hashed := md5Hasher.Sum(nil)

	return hex.EncodeToString(hashed)
}

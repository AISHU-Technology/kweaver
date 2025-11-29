package logics

import (
	"context"
	"ontology-manager/interfaces"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

func Init(ctx context.Context) error {
	// 初始化 OpenSearch 索引

	exists, err := OSA.IndexExists(ctx, interfaces.KN_CONCEPT_INDEX_NAME)
	if err != nil {
		logger.Errorf("CheckKNConceptIndexExists err:%v", err)
		return err
	}

	if !exists {
		err = OSA.CreateIndex(ctx, interfaces.KN_CONCEPT_INDEX_NAME, interfaces.KN_CONCEPT_INDEX_BODY)
		if err != nil {
			logger.Errorf("CreateKNConceptIndex err:%v", err)
			return err
		}
	}

	return nil
}

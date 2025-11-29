package condition

import (
	"context"
	"encoding/json"
	"fmt"
)

type KnnCond struct {
	mCfg             *CondCfg
	mFilterFieldName string
	mSubConds        []Condition
}

func NewKnnCond(ctx context.Context, cfg *CondCfg, fieldScope uint8, fieldsMap map[string]*ViewField) (Condition, error) {
	if cfg.ValueOptCfg.ValueFrom != ValueFrom_Const {
		return nil, fmt.Errorf("condition [knn] does not support value_from type '%s'", cfg.ValueFrom)
	}

	// knnByte, err := json.Marshal(cfg.ValueOptCfg.Value)
	// if err != nil {
	// 	return nil, err
	// }
	// var knnParam KnnParams
	// err = json.Unmarshal(knnByte, &knnParam)
	// if err != nil {
	// 	return nil, err
	// }

	// val, ok := cfg.ValueOptCfg.Value.([]any)
	// if !ok {
	// 	return nil, fmt.Errorf("condition [knn] right value should be an array of length 2")
	// }

	// if len(val) != 2 {
	// 	return nil, fmt.Errorf("condition [knn] right value should be an array of length 2")
	// }

	// _, ok = val[1].(float64)
	// if !ok {
	// 	return nil, fmt.Errorf("condition [knn]'s interval value should be a integer")
	// }

	name := getFilterFieldName(cfg.Name, fieldsMap, true)
	var field string
	// 如果指定*查询，则把 * 换成 _vector
	if name == AllField {
		field = "_vector"
	} else {
		field = name
	}

	subConds := []Condition{}
	for _, subCond := range cfg.SubConds {
		cond, err := NewCondition(ctx, subCond, fieldScope, fieldsMap)
		if err != nil {
			return nil, err
		}

		if cond != nil {
			subConds = append(subConds, cond)
		}

	}

	return &KnnCond{
		mCfg:             cfg,
		mFilterFieldName: field,
		mSubConds:        subConds,
	}, nil
}

func (cond *KnnCond) Convert(ctx context.Context, vectorizer func(ctx context.Context, words []string) ([]VectorResp, error)) (string, error) {
	v := fmt.Sprintf("%v", cond.mCfg.Value)

	vector, err := vectorizer(ctx, []string{v})
	if err != nil {
		return "", fmt.Errorf("condition [knn]: vectorizer [%s] failed, error: %s", v, err.Error())
	}
	res, err := json.Marshal(vector[0].Vector)
	if err != nil {
		return "", fmt.Errorf("condition [in] json marshal right value failed, %s", err.Error())
	}

	// sub condition
	subDSL := ""
	if len(cond.mSubConds) > 0 {
		subDSL = `
		,
		"filter": {
			"bool": {
				"must": [
					%s
				]
			}
		}
		`

		subCondStr := ""
		for i, subCond := range cond.mSubConds {
			dsl, err := subCond.Convert(ctx, vectorizer)
			if err != nil {
				return "", err
			}

			if i != len(cond.mSubConds)-1 {
				dsl += ","
			}

			subCondStr += dsl

		}
		subDSL = fmt.Sprintf(subDSL, subCondStr)
	}

	dslStr := fmt.Sprintf(`
					{
						"knn": {
							"%s":{
								"%s": %v,
								"vector": %v
								%s
							}
						}
					}`, cond.mFilterFieldName, cond.mCfg.ReaminCfg["limit_key"], cond.mCfg.ReaminCfg["limit_value"],
		string(res), subDSL)

	return dslStr, nil
}

func (cond *KnnCond) Convert2SQL(ctx context.Context) (string, error) {
	return "", nil
}

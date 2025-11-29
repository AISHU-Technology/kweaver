package driveradapters

import (
	"context"
	"strings"

	libCommon "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/common"

	"ontology-manager/interfaces"
)

// 对象类必要创建参数的非空校验。
func ValidateRelationType(ctx context.Context, relationType *interfaces.RelationType) error {
	// 校验id的合法性
	err := validateID(ctx, relationType.RTID)
	if err != nil {
		return err
	}

	// 校验名称合法性
	// 去掉名称的前后空格
	relationType.RTName = strings.TrimSpace(relationType.RTName)
	err = validateObjectName(ctx, relationType.RTName, interfaces.MODULE_TYPE_RELATION_TYPE)
	if err != nil {
		return err
	}

	// 若输入了 tags，校验 tags 的合法性
	err = ValidateTags(ctx, relationType.Tags)
	if err != nil {
		return err
	}

	// 去掉tag前后空格以及数组去重
	relationType.Tags = libCommon.TagSliceTransform(relationType.Tags)

	// 校验comment合法性
	err = validateObjectComment(ctx, relationType.Comment)
	if err != nil {
		return err
	}

	return nil
}

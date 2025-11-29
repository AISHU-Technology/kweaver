package driveradapters

import (
	"context"
	"strings"

	libCommon "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/common"

	"ontology-manager/interfaces"
)

// 对象类必要创建参数的非空校验。
func ValidateActionType(ctx context.Context, actionType *interfaces.ActionType) error {
	// 校验id的合法性
	err := validateID(ctx, actionType.ATID)
	if err != nil {
		return err
	}

	// 校验名称合法性
	// 去掉名称的前后空格
	actionType.ATName = strings.TrimSpace(actionType.ATName)
	err = validateObjectName(ctx, actionType.ATName, interfaces.MODULE_TYPE_ACTION_TYPE)
	if err != nil {
		return err
	}

	// 若输入了 tags，校验 tags 的合法性
	err = ValidateTags(ctx, actionType.Tags)
	if err != nil {
		return err
	}

	// 去掉tag前后空格以及数组去重
	actionType.Tags = libCommon.TagSliceTransform(actionType.Tags)

	// 校验comment合法性
	err = validateObjectComment(ctx, actionType.Comment)
	if err != nil {
		return err
	}

	return nil
}

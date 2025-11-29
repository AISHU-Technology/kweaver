package driveradapters

import (
	"context"
	"strings"

	libCommon "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/common"

	"ontology-manager/interfaces"
)

// 指标模型必要创建参数的非空校验。bool 为 dsl 语句中是否使用了 top_hits 的标识。
func ValidateKN(ctx context.Context, kn *interfaces.KN) error {
	// 校验id的合法性
	err := validateID(ctx, kn.KNID)
	if err != nil {
		return err
	}

	// 校验名称合法性
	// 去掉模型名称的前后空格
	kn.KNName = strings.TrimSpace(kn.KNName)
	err = validateObjectName(ctx, kn.KNName, interfaces.MODULE_TYPE_KN)
	if err != nil {
		return err
	}

	// 若输入了 tags，校验 tags 的合法性
	err = ValidateTags(ctx, kn.Tags)
	if err != nil {
		return err
	}

	// 去掉tag前后空格以及数组去重
	kn.Tags = libCommon.TagSliceTransform(kn.Tags)

	// 校验comment合法性
	err = validateObjectComment(ctx, kn.Comment)
	if err != nil {
		return err
	}

	return nil
}

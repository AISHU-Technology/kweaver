// Package errors 服务错误码
package errors

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"

	"ontology-manager/locale"
)

// 公共错误码, 服务内所有模块均可使用
const (
	// 400
	OntologyManager_CountExceeded_TagTotal          = "OntologyManager.CountExceeded.TagTotal"
	OntologyManager_InvalidParameter_Condition      = "OntologyManager.InvalidParameter.Condition"
	OntologyManager_InvalidParameter_DataTagName    = "OntologyManager.InvalidParameter.DataTagName"
	OntologyManager_InvalidParameter_Direction      = "OntologyManager.InvalidParameter.Direction"
	OntologyManager_InvalidParameter_ID             = "OntologyManager.InvalidParameter.ID"
	OntologyManager_InvalidParameter_ImportMode     = "OntologyManager.InvalidParameter.ImportMode"
	OntologyManager_InvalidParameter_Mode           = "OntologyManager.InvalidParameter.Mode"
	OntologyManager_InvalidParameter_Limit          = "OntologyManager.InvalidParameter.Limit"
	OntologyManager_InvalidParameter_ModuleType     = "OntologyManager.InvalidParameter.ModuleType"
	OntologyManager_InvalidParameter_Offset         = "OntologyManager.InvalidParameter.Offset"
	OntologyManager_InvalidParameter_OverrideMethod = "OntologyManager.InvalidParameter.OverrideMethod"
	OntologyManager_InvalidParameter_RequestBody    = "OntologyManager.InvalidParameter.RequestBody"
	OntologyManager_InvalidParameter_Sort           = "OntologyManager.InvalidParameter.Sort"
	OntologyManager_InvalidParameter_ConditionValue = "OntologyManager.InvalidParameter.ConditionValue"
	OntologyManager_LengthExceeded_Comment          = "OntologyManager.LengthExceeded.Comment"

	OntologyManager_NullParameter_ConditionName      = "OntologyManager.NullParameter.ConditionName"
	OntologyManager_NullParameter_ConditionOperation = "OntologyManager.NullParameter.ConditionOperation"
	OntologyManager_UnsupportConditionOperation      = "OntologyManager.UnsupportConditionOperation"
	OntologyManager_CountExceeded_Conditions         = "OntologyManager.CountExceeded.Conditions"

	// 406
	OntologyManager_InvalidRequestHeader_ContentType = "OntologyManager.InvalidRequestHeader.ContentType"

	// Permission
	OntologyManager_InternalError_CheckPermissionFailed = "OntologyManager.InternalError.CheckPermissionFailed"
	OntologyManager_InternalError_CreateResourcesFailed = "OntologyManager.InternalError.CreateResourcesFailed"
	OntologyManager_InternalError_DeleteResourcesFailed = "OntologyManager.InternalError.DeleteResourcesFailed"
	OntologyManager_InternalError_FilterResourcesFailed = "OntologyManager.InternalError.FilterResourcesFailed"
	OntologyManager_InternalError_UpdateResourceFailed  = "OntologyManager.InternalError.UpdateResourceFailed"
	OntologyManager_InternalError_MQPublishMsgFailed    = "OntologyManager.InternalError.MQPublishMsgFailed"

	// 500
	OntologyManager_InternalError_MarshalDataFailed   = "OntologyManager.InternalError.MarshalDataFailed"
	OntologyManager_InternalError_UnMarshalDataFailed = "OntologyManager.InternalError.UnMarshalDataFailed"
)

var (
	errCodeList = []string{
		// ---公共错误码---
		// 400
		OntologyManager_CountExceeded_TagTotal,
		OntologyManager_InvalidParameter_Direction,
		OntologyManager_InvalidParameter_Condition,
		OntologyManager_InvalidParameter_ID,
		OntologyManager_InvalidParameter_ImportMode,
		OntologyManager_InvalidParameter_Mode,
		OntologyManager_InvalidParameter_Limit,
		OntologyManager_InvalidParameter_ModuleType,
		OntologyManager_InvalidParameter_Offset,
		OntologyManager_InvalidParameter_OverrideMethod,
		OntologyManager_InvalidParameter_RequestBody,
		OntologyManager_InvalidParameter_Sort,
		OntologyManager_LengthExceeded_Comment,

		OntologyManager_NullParameter_ConditionName,
		OntologyManager_NullParameter_ConditionOperation,
		OntologyManager_UnsupportConditionOperation,
		OntologyManager_CountExceeded_Conditions,
		OntologyManager_InvalidParameter_ConditionValue,

		// permission
		OntologyManager_InternalError_CheckPermissionFailed,
		OntologyManager_InternalError_CreateResourcesFailed,
		OntologyManager_InternalError_DeleteResourcesFailed,
		OntologyManager_InternalError_FilterResourcesFailed,
		OntologyManager_InternalError_UpdateResourceFailed,
		OntologyManager_InternalError_MQPublishMsgFailed,

		// 406
		OntologyManager_InvalidRequestHeader_ContentType,

		// 500
		OntologyManager_InternalError_MarshalDataFailed,
		OntologyManager_InternalError_UnMarshalDataFailed,
	}
)

func init() {
	locale.Register()
	rest.Register(errCodeList)
	rest.Register(KNErrCodeList)
	rest.Register(ObjectTypeErrCodeList)
	rest.Register(RelationTypeErrCodeList)
	rest.Register(ActionTypeErrCodeList)
	rest.Register(JobErrCodeList)
}

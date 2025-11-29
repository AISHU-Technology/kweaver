package errors

// 业务知识网络错误码
const (
	// 400
	OntologyManager_ActionType_Duplicated_IDInFile               = "OntologyManager.ActionType.Duplicated.IDInFile"
	OntologyManager_ActionType_Duplicated_Name                   = "OntologyManager.ActionType.Duplicated.Name"
	OntologyManager_ActionType_InvalidParameter                  = "OntologyManager.ActionType.InvalidParameter"
	OntologyManager_ActionType_InvalidParameter_ConceptCondition = "OntologyManager.ActionType.InvalidParameter.ConceptCondition"
	OntologyManager_ActionType_ActionTypeIDExisted               = "OntologyManager.ActionType.ActionTypeIDExisted"
	OntologyManager_ActionType_ActionTypeNameExisted             = "OntologyManager.ActionType.ActionTypeNameExisted"
	OntologyManager_ActionType_LengthExceeded_Name               = "OntologyManager.ActionType.LengthExceeded.Name"
	OntologyManager_ActionType_NullParameter_Name                = "OntologyManager.ActionType.NullParameter.Name"

	// 500
	OntologyManager_ActionType_InternalError                              = "OntologyManager.ActionType.InternalError"
	OntologyManager_ActionType_InternalError_BeginTransactionFailed       = "OntologyManager.ActionType.InternalError.BeginTransactionFailed"
	OntologyManager_ActionType_InternalError_CheckActionTypeIfExistFailed = "OntologyManager.ActionType.InternalError.CheckActionTypeIfExistFailed"
	OntologyManager_ActionType_InternalError_GetActionTypesByIDsFailed    = "OntologyManager.ActionType.InternalError.GetActionTypesByIDsFailed"
	OntologyManager_ActionType_InternalError_InsertOpenSearchDataFailed   = "OntologyManager.ActionType.InternalError.InsertOpenSearchDataFailed"
	OntologyManager_ActionType_ActionTypeNotFound                         = "OntologyManager.ActionType.ActionTypeNotFound"
)

var (
	ActionTypeErrCodeList = []string{
		// 400
		OntologyManager_ActionType_Duplicated_IDInFile,
		OntologyManager_ActionType_Duplicated_Name,
		OntologyManager_ActionType_InvalidParameter,
		OntologyManager_ActionType_InvalidParameter_ConceptCondition,
		OntologyManager_ActionType_ActionTypeIDExisted,
		OntologyManager_ActionType_ActionTypeNameExisted,
		OntologyManager_ActionType_LengthExceeded_Name,
		OntologyManager_ActionType_NullParameter_Name,

		// 500
		OntologyManager_ActionType_InternalError,
		OntologyManager_ActionType_InternalError_CheckActionTypeIfExistFailed,
		OntologyManager_ActionType_InternalError_BeginTransactionFailed,
		OntologyManager_ActionType_InternalError_GetActionTypesByIDsFailed,
		OntologyManager_ActionType_InternalError_InsertOpenSearchDataFailed,
		OntologyManager_ActionType_ActionTypeNotFound,
	}
)

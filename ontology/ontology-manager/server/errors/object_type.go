package errors

// 业务知识网络错误码
const (
	// 400
	OntologyManager_ObjectType_Duplicated_IDInFile               = "OntologyManager.ObjectType.Duplicated.IDInFile"
	OntologyManager_ObjectType_Duplicated_Name                   = "OntologyManager.ObjectType.Duplicated.Name"
	OntologyManager_ObjectType_InvalidParameter                  = "OntologyManager.ObjectType.InvalidParameter"
	OntologyManager_ObjectType_InvalidParameter_ConceptCondition = "OntologyManager.ObjectType.InvalidParameter.ConceptCondition"
	OntologyManager_ObjectType_InvalidParameter_PropertyName     = "OntologyManager.ObjectType.InvalidParameter.PropertyName"
	OntologyManager_ObjectType_InvalidParameter_SmallModel       = "OntologyManager.ObjectType.InvalidParameter.SmallModel"
	OntologyManager_ObjectType_LengthExceeded_Name               = "OntologyManager.ObjectType.LengthExceeded.Name"
	OntologyManager_ObjectType_NullParameter_Name                = "OntologyManager.ObjectType.NullParameter.Name"
	OntologyManager_ObjectType_NullParameter_PrimaryKeys         = "OntologyManager.ObjectType.NullParameter.PrimaryKeys"
	OntologyManager_ObjectType_NullParameter_PropertyName        = "OntologyManager.ObjectType.NullParameter.PropertyName"
	OntologyManager_ObjectType_ObjectTypeIDExisted               = "OntologyManager.ObjectType.ObjectTypeIDExisted"
	OntologyManager_ObjectType_ObjectTypeNameExisted             = "OntologyManager.ObjectType.ObjectTypeNameExisted"

	// 404
	OntologyManager_ObjectType_ObjectTypeNotFound = "OntologyManager.ObjectType.ObjectTypeNotFound"
	OntologyManager_ObjectType_SmallModelNotFound = "OntologyManager.ObjectType.SmallModelNotFound"

	// 500
	OntologyManager_ObjectType_InternalError                              = "OntologyManager.ObjectType.InternalError"
	OntologyManager_ObjectType_InternalError_BeginTransactionFailed       = "OntologyManager.ObjectType.InternalError.BeginTransactionFailed"
	OntologyManager_ObjectType_InternalError_CheckObjectTypeIfExistFailed = "OntologyManager.ObjectType.InternalError.CheckObjectTypeIfExistFailed"
	OntologyManager_ObjectType_InternalError_GetDataViewByIDFailed        = "OntologyManager.ObjectType.InternalError.GetDataViewByIDFailed"
	OntologyManager_ObjectType_InternalError_GetMetricModelByIDFailed     = "OntologyManager.ObjectType.InternalError.GetMetricModelByIDFailed"
	OntologyManager_ObjectType_InternalError_GetObjectTypeByIDFailed      = "OntologyManager.ObjectType.InternalError.GetObjectTypeByIDFailed"
	OntologyManager_ObjectType_InternalError_GetObjectTypesByIDsFailed    = "OntologyManager.ObjectType.InternalError.GetObjectTypesByIDsFailed"
	OntologyManager_ObjectType_InternalError_GetSmallModelByIDFailed      = "OntologyManager.ObjectType.InternalError.GetSmallModelByIDFailed"
	OntologyManager_ObjectType_InternalError_InsertOpenSearchDataFailed   = "OntologyManager.ObjectType.InternalError.InsertOpenSearchDataFailed"
)

var (
	ObjectTypeErrCodeList = []string{
		// 400
		OntologyManager_ObjectType_Duplicated_IDInFile,
		OntologyManager_ObjectType_Duplicated_Name,
		OntologyManager_ObjectType_InvalidParameter,
		OntologyManager_ObjectType_InvalidParameter_ConceptCondition,
		OntologyManager_ObjectType_InvalidParameter_PropertyName,
		OntologyManager_ObjectType_InvalidParameter_SmallModel,
		OntologyManager_ObjectType_LengthExceeded_Name,
		OntologyManager_ObjectType_NullParameter_Name,
		OntologyManager_ObjectType_NullParameter_PrimaryKeys,
		OntologyManager_ObjectType_NullParameter_PropertyName,
		OntologyManager_ObjectType_ObjectTypeIDExisted,
		OntologyManager_ObjectType_ObjectTypeNameExisted,

		// 404
		OntologyManager_ObjectType_ObjectTypeNotFound,
		OntologyManager_ObjectType_SmallModelNotFound,

		// 500
		OntologyManager_ObjectType_InternalError,
		OntologyManager_ObjectType_InternalError_BeginTransactionFailed,
		OntologyManager_ObjectType_InternalError_CheckObjectTypeIfExistFailed,
		OntologyManager_ObjectType_InternalError_GetDataViewByIDFailed,
		OntologyManager_ObjectType_InternalError_GetMetricModelByIDFailed,
		OntologyManager_ObjectType_InternalError_GetObjectTypeByIDFailed,
		OntologyManager_ObjectType_InternalError_GetObjectTypesByIDsFailed,
		OntologyManager_ObjectType_InternalError_GetSmallModelByIDFailed,
		OntologyManager_ObjectType_InternalError_InsertOpenSearchDataFailed,
	}
)

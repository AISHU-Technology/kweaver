package errors

// 业务知识网络错误码
const (
	// 400
	OntologyManager_RelationType_Duplicated_IDInFile               = "OntologyManager.RelationType.Duplicated.IDInFile"
	OntologyManager_RelationType_Duplicated_Name                   = "OntologyManager.RelationType.Duplicated.Name"
	OntologyManager_RelationType_InvalidParameter                  = "OntologyManager.RelationType.InvalidParameter"
	OntologyManager_RelationType_InvalidParameter_ConceptCondition = "OntologyManager.RelationType.InvalidParameter.ConceptCondition"
	OntologyManager_RelationType_RelationTypeIDExisted             = "OntologyManager.RelationType.RelationTypeIDExisted"
	OntologyManager_RelationType_RelationTypeNameExisted           = "OntologyManager.RelationType.RelationTypeNameExisted"
	OntologyManager_RelationType_LengthExceeded_Name               = "OntologyManager.RelationType.LengthExceeded.Name"
	OntologyManager_RelationType_NullParameter_Name                = "OntologyManager.RelationType.NullParameter.Name"

	// 500
	OntologyManager_RelationType_InternalError                                = "OntologyManager.RelationType.InternalError"
	OntologyManager_RelationType_InternalError_BeginTransactionFailed         = "OntologyManager.RelationType.InternalError.BeginTransactionFailed"
	OntologyManager_RelationType_InternalError_CheckRelationTypeIfExistFailed = "OntologyManager.RelationType.InternalError.CheckRelationTypeIfExistFailed"
	OntologyManager_RelationType_InternalError_GetDataViewByIDFailed          = "OntologyManager.RelationType.InternalError.GetDataViewByIDFailed"
	OntologyManager_RelationType_InternalError_GetRelationTypesByIDsFailed    = "OntologyManager.RelationType.InternalError.GetRelationTypesByIDsFailed"
	OntologyManager_RelationType_InternalError_InsertOpenSearchDataFailed     = "OntologyManager.RelationType.InternalError.InsertOpenSearchDataFailed"
	OntologyManager_RelationType_RelationTypeNotFound                         = "OntologyManager.RelationType.RelationTypeNotFound"
)

var (
	RelationTypeErrCodeList = []string{
		// 400
		OntologyManager_RelationType_Duplicated_IDInFile,
		OntologyManager_RelationType_Duplicated_Name,
		OntologyManager_RelationType_InvalidParameter,
		OntologyManager_RelationType_InvalidParameter_ConceptCondition,
		OntologyManager_RelationType_RelationTypeIDExisted,
		OntologyManager_RelationType_RelationTypeNameExisted,
		OntologyManager_RelationType_LengthExceeded_Name,
		OntologyManager_RelationType_NullParameter_Name,

		// 500
		OntologyManager_RelationType_InternalError,
		OntologyManager_RelationType_InternalError_CheckRelationTypeIfExistFailed,
		OntologyManager_RelationType_InternalError_BeginTransactionFailed,
		OntologyManager_RelationType_InternalError_GetDataViewByIDFailed,
		OntologyManager_RelationType_InternalError_GetRelationTypesByIDsFailed,
		OntologyManager_RelationType_InternalError_InsertOpenSearchDataFailed,
		OntologyManager_RelationType_RelationTypeNotFound,
	}
)

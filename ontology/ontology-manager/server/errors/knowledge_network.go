package errors

// 业务知识网络错误码
const (
	// 400
	OntologyManager_KnowledgeNetwork_Duplicated_Name                   = "OntologyManager.KnowledgeNetwork.Duplicated.Name"
	OntologyManager_KnowledgeNetwork_InvalidParameter                  = "OntologyManager.KnowledgeNetwork.InvalidParameter"
	OntologyManager_KnowledgeNetwork_InvalidParameter_BusinessDomain   = "OntologyManager.KnowledgeNetwork.InvalidParameter.BusinessDomain"
	OntologyManager_KnowledgeNetwork_InvalidParameter_ConceptCondition = "OntologyManager.KnowledgeNetwork.InvalidParameter.ConceptCondition"
	OntologyManager_KnowledgeNetwork_InvalidParameter_Direction        = "OntologyManager.KnowledgeNetwork.InvalidParameter.Direction"
	OntologyManager_KnowledgeNetwork_InvalidParameter_IncludeTypeInfo  = "OntologyManager.KnowledgeNetwork.InvalidParameter.IncludeTypeInfo"
	OntologyManager_KnowledgeNetwork_InvalidParameter_PathLength       = "OntologyManager.KnowledgeNetwork.InvalidParameter.PathLength"
	OntologyManager_KnowledgeNetwork_KNIDExisted                       = "OntologyManager.KnowledgeNetwork.KNIDExisted"
	OntologyManager_KnowledgeNetwork_KNNameExisted                     = "OntologyManager.KnowledgeNetwork.KNNameExisted"
	OntologyManager_KnowledgeNetwork_LengthExceeded_Name               = "OntologyManager.KnowledgeNetwork.LengthExceeded.Name"
	OntologyManager_KnowledgeNetwork_NullParameter_Direction           = "OntologyManager.KnowledgeNetwork.NullParameter.Direction"
	OntologyManager_KnowledgeNetwork_NullParameter_Name                = "OntologyManager.KnowledgeNetwork.NullParameter.Name"
	OntologyManager_KnowledgeNetwork_NullParameter_SourceObjectTypeId  = "OntologyManager.KnowledgeNetwork.NullParameter.SourceObjectTypeId"

	// 404
	OntologyManager_KnowledgeNetwork_NotFound = "OntologyManager.KnowledgeNetwork.NotFound"

	// 500
	OntologyManager_KnowledgeNetwork_InternalError                            = "OntologyManager.KnowledgeNetwork.InternalError"
	OntologyManager_KnowledgeNetwork_InternalError_BeginTransactionFailed     = "OntologyManager.KnowledgeNetwork.InternalError.BeginTransactionFailed"
	OntologyManager_KnowledgeNetwork_InternalError_BindBusinessDomainFailed   = "OntologyManager.KnowledgeNetwork.InternalError.BindBusinessDomainFailed"
	OntologyManager_KnowledgeNetwork_InternalError_UnbindBusinessDomainFailed = "OntologyManager.KnowledgeNetwork.InternalError.UnbindBusinessDomainFailed"
	OntologyManager_KnowledgeNetwork_InternalError_CheckKNIfExistFailed       = "OntologyManager.KnowledgeNetwork.InternalError.CheckKNIfExistFailed"
	OntologyManager_KnowledgeNetwork_InternalError_GetKNByIDFailed            = "OntologyManager.KnowledgeNetwork.InternalError.GetKNByIDFailed"
	OntologyManager_KnowledgeNetwork_InternalError_UpdateKNFailed             = "OntologyManager.KnowledgeNetwork.InternalError.UpdateKNFailed"
	OntologyManager_KnowledgeNetwork_InternalError_CreateKNFailed             = "OntologyManager.KnowledgeNetwork.InternalError.CreateKNFailed"
	OntologyManager_KnowledgeNetwork_InternalError_CreateResourcesFailed      = "OntologyManager.KnowledgeNetwork.InternalError.CreateResourcesFailed"
	OntologyManager_KnowledgeNetwork_InternalError_GetVectorFailed            = "OntologyManager.KnowledgeNetwork.InternalError.GetVectorFailed"
	OntologyManager_KnowledgeNetwork_InternalError_InsertOpenSearchDataFailed = "OntologyManager.KnowledgeNetwork.InternalError.InsertOpenSearchDataFailed"
	OntologyManager_KnowledgeNetwork_InternalError_CreateObjectTypesFailed    = "OntologyManager.KnowledgeNetwork.InternalError.CreateObjectTypesFailed"
	OntologyManager_KnowledgeNetwork_InternalError_CreateRelationTypesFailed  = "OntologyManager.KnowledgeNetwork.InternalError.CreateRelationTypesFailed"
	OntologyManager_KnowledgeNetwork_InternalError_CreateActionTypesFailed    = "OntologyManager.KnowledgeNetwork.InternalError.CreateActionTypesFailed"
	OntologyManager_KnowledgeNetwork_InternalError_DeleteObjectTypesFailed    = "OntologyManager.KnowledgeNetwork.InternalError.DeleteObjectTypesFailed"
	OntologyManager_KnowledgeNetwork_InternalError_DeleteRelationTypesFailed  = "OntologyManager.KnowledgeNetwork.InternalError.DeleteRelationTypesFailed"
	OntologyManager_KnowledgeNetwork_InternalError_DeleteActionTypesFailed    = "OntologyManager.KnowledgeNetwork.InternalError.DeleteActionTypesFailed"
)

var (
	KNErrCodeList = []string{
		// 400
		OntologyManager_KnowledgeNetwork_Duplicated_Name,
		OntologyManager_KnowledgeNetwork_InvalidParameter,
		OntologyManager_KnowledgeNetwork_InvalidParameter_BusinessDomain,
		OntologyManager_KnowledgeNetwork_InvalidParameter_ConceptCondition,
		OntologyManager_KnowledgeNetwork_InvalidParameter_Direction,
		OntologyManager_KnowledgeNetwork_InvalidParameter_IncludeTypeInfo,
		OntologyManager_KnowledgeNetwork_InvalidParameter_PathLength,
		OntologyManager_KnowledgeNetwork_KNIDExisted,
		OntologyManager_KnowledgeNetwork_KNNameExisted,
		OntologyManager_KnowledgeNetwork_LengthExceeded_Name,
		OntologyManager_KnowledgeNetwork_NullParameter_Direction,
		OntologyManager_KnowledgeNetwork_NullParameter_Name,
		OntologyManager_KnowledgeNetwork_NullParameter_SourceObjectTypeId,

		// 404
		OntologyManager_KnowledgeNetwork_NotFound,

		// 500
		OntologyManager_KnowledgeNetwork_InternalError,
		OntologyManager_KnowledgeNetwork_InternalError_CheckKNIfExistFailed,
		OntologyManager_KnowledgeNetwork_InternalError_BeginTransactionFailed,
		OntologyManager_KnowledgeNetwork_InternalError_BindBusinessDomainFailed,
		OntologyManager_KnowledgeNetwork_InternalError_UnbindBusinessDomainFailed,
		OntologyManager_KnowledgeNetwork_InternalError_GetKNByIDFailed,
		OntologyManager_KnowledgeNetwork_InternalError_UpdateKNFailed,
		OntologyManager_KnowledgeNetwork_InternalError_CreateKNFailed,
		OntologyManager_KnowledgeNetwork_InternalError_CreateResourcesFailed,
		OntologyManager_KnowledgeNetwork_InternalError_GetVectorFailed,
		OntologyManager_KnowledgeNetwork_InternalError_InsertOpenSearchDataFailed,
		OntologyManager_KnowledgeNetwork_InternalError_CreateObjectTypesFailed,
		OntologyManager_KnowledgeNetwork_InternalError_CreateRelationTypesFailed,
		OntologyManager_KnowledgeNetwork_InternalError_CreateActionTypesFailed,
		OntologyManager_KnowledgeNetwork_InternalError_DeleteObjectTypesFailed,
		OntologyManager_KnowledgeNetwork_InternalError_DeleteRelationTypesFailed,
		OntologyManager_KnowledgeNetwork_InternalError_DeleteActionTypesFailed,
	}
)

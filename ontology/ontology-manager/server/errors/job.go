package errors

const (
	// 400
	OntologyManager_Job_InvalidParameter                  = "OntologyManager.Job.InvalidParameter"
	OntologyManager_Job_InvalidParameter_JobType          = "OntologyManager.Job.InvalidParameter.JobType"
	OntologyManager_Job_InvalidParameter_JobState         = "OntologyManager.Job.InvalidParameter.JobState"
	OntologyManager_Job_InvalidParameter_JobConceptConfig = "OntologyManager.Job.InvalidParameter.JobConceptConfig"
	OntologyManager_Job_InvalidParameter_TaskState        = "OntologyManager.Job.InvalidParameter.TaskState"
	OntologyManager_Job_InvalidParameter_ConceptType      = "OntologyManager.Job.InvalidParameter.ConceptType"
	OntologyManager_Job_NullParameter_Name                = "OntologyManager.Job.NullParameter.Name"
	OntologyManager_Job_LengthExceeded_Name               = "OntologyManager.Job.LengthExceeded.Name"

	// 404
	OntologyManager_Job_JobNotFound = "OntologyManager.Job.JobNotFound"

	// 500
	OntologyManager_Job_InternalError                         = "OntologyManager.Job.InternalError"
	OntologyManager_Job_InternalError_BeginTransactionFailed  = "OntologyManager.Job.InternalError.BeginTransactionFailed"
	OntologyManager_Job_InternalError_CommitTransactionFailed = "OntologyManager.Job.InternalError.CommitTransactionFailed"
)

var (
	JobErrCodeList = []string{
		OntologyManager_Job_InvalidParameter,
		OntologyManager_Job_InvalidParameter_JobType,
		OntologyManager_Job_InvalidParameter_JobState,
		OntologyManager_Job_InvalidParameter_JobConceptConfig,
		OntologyManager_Job_InvalidParameter_TaskState,
		OntologyManager_Job_InvalidParameter_ConceptType,
		OntologyManager_Job_NullParameter_Name,
		OntologyManager_Job_LengthExceeded_Name,

		OntologyManager_Job_JobNotFound,

		OntologyManager_Job_InternalError,
		OntologyManager_Job_InternalError_BeginTransactionFailed,
		OntologyManager_Job_InternalError_CommitTransactionFailed,
	}
)

package driveradapters

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"

	oerrors "ontology-manager/errors"
	"ontology-manager/interfaces"
)

func ValidateJob(ctx context.Context, job *interfaces.Job) error {

	// 校验名称合法性
	// 去掉名称的前后空格
	job.Name = strings.TrimSpace(job.Name)
	err := validateObjectName(ctx, job.Name, interfaces.MODULE_TYPE_JOB)
	if err != nil {
		return err
	}

	err = ValidateJobType(ctx, job.JobType)
	if err != nil {
		return err
	}

	if job.JobConceptConfig != nil || len(job.JobConceptConfig) != 0 {
		for _, conceptConfig := range job.JobConceptConfig {
			err = ValidateConceptType(ctx, conceptConfig.ConceptType)
			if err != nil {
				return err
			}

			if conceptConfig.ConceptID == "" {
				return rest.NewHTTPError(ctx, http.StatusBadRequest,
					oerrors.OntologyManager_Job_InvalidParameter_JobConceptConfig).
					WithErrorDetails("The job concept config must contain concept_id")
			}
		}
	}
	return nil
}

func ValidateJobType(ctx context.Context, jobType interfaces.JobType) error {
	switch jobType {
	case interfaces.JobTypeFull:
	default:
		return rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_Job_InvalidParameter_JobType).
			WithErrorDetails(fmt.Sprintf("The job_type value can be 'full', but got: %s", jobType))
	}

	return nil
}

func ValidateJobState(ctx context.Context, jobState interfaces.JobState) error {
	switch jobState {
	case interfaces.JobStatePending:
	case interfaces.JobStateRunning:
	case interfaces.JobStateCompleted:
	case interfaces.JobStateCanceled:
	case interfaces.JobStateFailed:
	default:
		return rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_Job_InvalidParameter_JobState).
			WithErrorDetails(fmt.Sprintf("The job state value can be 'pending', 'running', 'completed', 'canceled', 'failed', but got: %s", jobState))
	}
	return nil
}

func ValidateTaskState(ctx context.Context, taskState interfaces.TaskState) error {
	switch taskState {
	case interfaces.TaskStatePending:
	case interfaces.TaskStateRunning:
	case interfaces.TaskStateCompleted:
	case interfaces.TaskStateCanceled:
	case interfaces.TaskStateFailed:
	default:
		return rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_Job_InvalidParameter_TaskState).
			WithErrorDetails(fmt.Sprintf("The task state value can be 'pending', 'running', 'completed', 'canceled', 'failed', but got: %s", taskState))
	}
	return nil
}

func ValidateConceptType(ctx context.Context, conceptType string) error {
	switch conceptType {
	case interfaces.MODULE_TYPE_OBJECT_TYPE:
	case interfaces.MODULE_TYPE_RELATION_TYPE:
	default:
		return rest.NewHTTPError(ctx, http.StatusBadRequest,
			oerrors.OntologyManager_Job_InvalidParameter_ConceptType).
			WithErrorDetails(fmt.Sprintf("The concept_type value can be 'object_type' or 'relation_type', but got: %s", conceptType))
	}
	return nil
}

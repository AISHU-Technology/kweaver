package interfaces

import (
	"context"
	"database/sql"
)

// JobAccess 定义 job 访问接口
//
//go:generate mockgen -source ../interfaces/job_access.go -destination ../interfaces/mock/mock_job_access.go
type JobAccess interface {
	CreateJob(ctx context.Context, tx *sql.Tx, job *Job) error
	DeleteJobs(ctx context.Context, tx *sql.Tx, jobIDs []string) error
	DeleteTasks(ctx context.Context, tx *sql.Tx, jobIDs []string) error
	ListJobs(ctx context.Context, queryParams JobsQueryParams) ([]*Job, error)
	GetJobsTotal(ctx context.Context, queryParams JobsQueryParams) (int64, error)
	ListTasks(ctx context.Context, queryParams TasksQueryParams) ([]*Task, error)
	GetTasksTotal(ctx context.Context, queryParams TasksQueryParams) (int64, error)

	CreateTasks(ctx context.Context, tx *sql.Tx, tasks map[string]*Task) error
	GetJob(ctx context.Context, jobID string) (*Job, error)
	GetJobs(ctx context.Context, jobIDs []string) (map[string]*Job, error)

	UpdateTaskState(ctx context.Context, taskID string, stateInfo TaskStateInfo) error
	UpdateJobState(ctx context.Context, tx *sql.Tx, jobID string, stateInfo JobStateInfo) error
}

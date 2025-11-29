package interfaces

import (
	"context"
)

// JobService 定义 job 服务接口
//
//go:generate mockgen -source ../interfaces/job_service.go -destination ../interfaces/mock/mock_job_service.go
type JobService interface {
	CreateJob(ctx context.Context, knID string, job *Job) (string, error)
	DeleteJobs(ctx context.Context, knID string, jobIDs []string) error
	ListJobs(ctx context.Context, knID string, queryParams JobsQueryParams) ([]*Job, int64, error)
	ListTasks(ctx context.Context, knID string, queryParams TasksQueryParams) ([]*Task, int64, error)

	// 内部接口，不鉴权
	GetJob(ctx context.Context, jobID string) (*Job, error)
	GetJobs(ctx context.Context, jobIDs []string) (map[string]*Job, error)
}

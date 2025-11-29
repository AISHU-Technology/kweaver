package interfaces

import "context"

// JobExecutor 定义 job 执行接口
//
//go:generate mockgen -source ../interfaces/job_executor.go -destination ../interfaces/mock/mock_job_executor.go
type JobExecutor interface {
	AddJob(ctx context.Context, job *Job) error
	Start()
}

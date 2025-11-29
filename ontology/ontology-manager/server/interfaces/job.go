package interfaces

type JobType string
type JobState string
type TaskState string

const (
	JobTypeFull           JobType = "full"
	MAX_STATE_DETAIL_SIZE int     = 50000
)

const (
	JobStatePending   JobState = "pending"
	JobStateRunning   JobState = "running"
	JobStateCompleted JobState = "completed"
	JobStateCanceled  JobState = "canceled"
	JobStateFailed    JobState = "failed"
)

const (
	TaskStatePending   TaskState = "pending"
	TaskStateRunning   TaskState = "running"
	TaskStateCompleted TaskState = "completed"
	TaskStateCanceled  TaskState = "canceled"
	TaskStateFailed    TaskState = "failed"
)

type JobStateInfo struct {
	State       JobState `json:"state"`
	StateDetail string   `json:"state_detail"`
	FinishTime  int64    `json:"finish_time"`
	TimeCost    int64    `json:"time_cost"`
}

type TaskStateInfo struct {
	State       TaskState `json:"state"`
	StateDetail string    `json:"state_detail"`
	StartTime   int64     `json:"start_time"`
	FinishTime  int64     `json:"finish_time"`
	TimeCost    int64     `json:"time_cost"`
}

type ConceptConfig struct {
	ConceptType string `json:"concept_type"`
	ConceptID   string `json:"concept_id"`
}

// Job 定义 job 结构
type Job struct {
	ID               string          `json:"id"`
	Name             string          `json:"name"`
	KNID             string          `json:"knid"`
	Branch           string          `json:"branch"`
	JobType          JobType         `json:"job_type"`
	JobConceptConfig []ConceptConfig `json:"Job_concept_config"`
	State            JobState        `json:"state"`
	StateDetail      string          `json:"state_detail"`
	Creator          AccountInfo     `json:"creator"`
	CreateTime       int64           `json:"create_time"`
	FinishTime       int64           `json:"finish_time"`
	TimeCost         int64           `json:"time_cost"`

	Tasks       map[string]*Task `json:"tasks,omitempty"`
	FinishCount int              `json:"finish_count,omitempty"`
}

// Task 定义子任务结构
type Task struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	JobID       string    `json:"job_id"`
	ConceptType string    `json:"concept_type"`
	ConceptID   string    `json:"concept_id"`
	Branch      string    `json:"branch"`
	Index       string    `json:"index"`
	State       TaskState `json:"state"`
	StateDetail string    `json:"state_detail"`
	StartTime   int64     `json:"start_time"`
	FinishTime  int64     `json:"finish_time"`
	TimeCost    int64     `json:"time_cost"`

	ConceptName string `json:"concept_name"`
}

var (
	JOB_SORT = map[string]string{
		"create_time": "f_create_time",
		"finish_time": "f_finish_time",
		"time_cost":   "f_time_cost",
	}
	TASK_SORT = map[string]string{
		"start_time":  "f_start_time",
		"finish_time": "f_finish_time",
		"time_cost":   "f_time_cost",
	}
)

// 任务的分页查询
type JobsQueryParams struct {
	PaginationQueryParameters
	NamePattern string
	KNID        string
	JobType     JobType
	State       []JobState
}

type TasksQueryParams struct {
	PaginationQueryParameters
	KNID        string
	JobID       string
	ConceptType string
	NamePattern string
	State       []TaskState
}

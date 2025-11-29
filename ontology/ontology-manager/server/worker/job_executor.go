package worker

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	llq "github.com/emirpasic/gods/queues/linkedlistqueue"

	"ontology-manager/common"
	"ontology-manager/interfaces"
	"ontology-manager/logics"
)

var (
	jExecutorOnce sync.Once
	jExecutor     *jobExecutor
)

type jobExecutor struct {
	appSetting *common.AppSetting
	db         *sql.DB
	ja         interfaces.JobAccess
	ota        interfaces.ObjectTypeAccess
	rta        interfaces.RelationTypeAccess

	MaxConcurrentTasks int

	mJobs      map[string]*interfaces.Job
	mJobLock   sync.Mutex
	mTaskQueue *llq.Queue

	mTaskCallbackChan chan *interfaces.Task
}

func NewJobExecutor(appSetting *common.AppSetting) interfaces.JobExecutor {
	jExecutorOnce.Do(func() {
		jExecutor = &jobExecutor{
			appSetting: appSetting,
			db:         logics.DB,
			ja:         logics.JA,
			ota:        logics.OTA,
			rta:        logics.RTA,

			MaxConcurrentTasks: appSetting.ServerSetting.MaxConcurrentTasks,
			mJobs:              make(map[string]*interfaces.Job),
			mJobLock:           sync.Mutex{},
			mTaskQueue:         llq.New(),

			mTaskCallbackChan: make(chan *interfaces.Task, 100),
		}
	})
	return jExecutor
}

func (je *jobExecutor) Start() {
	logger.Debug("jobExecutor Start")

	err := je.reloadJobs()
	if err != nil {
		logger.Fatalf("Failed to reload jobs: %v", err)
		return
	}

	if je.MaxConcurrentTasks <= 0 {
		je.MaxConcurrentTasks = 1
	}
	for i := 0; i < je.MaxConcurrentTasks; i++ {
		go je.StartTaskWorker()
	}
	go je.StartTaskCallbackWorker()
}

func (je *jobExecutor) reloadJobs() error {
	logger.Debug("jobExecutor reloadJobs")

	ctx := context.Background()

	taskList, err := je.ja.ListTasks(ctx, interfaces.TasksQueryParams{
		PaginationQueryParameters: interfaces.PaginationQueryParameters{
			Sort:      "f_id",
			Direction: interfaces.DESC_DIRECTION,
		},
		State: []interfaces.TaskState{
			interfaces.TaskStateRunning,
		},
	})
	if err != nil {
		return err
	}

	for _, task := range taskList {
		// 所有子任务完成，父任务完成
		info := interfaces.TaskStateInfo{
			State:       interfaces.TaskStateCanceled,
			StateDetail: fmt.Sprintf("task '%s' has been canceled caused by restart service", task.ID),
		}

		err = je.ja.UpdateTaskState(ctx, task.ID, info)
		if err != nil {
			return err
		}
	}

	jobList, err := je.ja.ListJobs(ctx, interfaces.JobsQueryParams{
		PaginationQueryParameters: interfaces.PaginationQueryParameters{
			Sort:      "f_id",
			Direction: interfaces.DESC_DIRECTION,
		},
		State: []interfaces.JobState{
			interfaces.JobStateRunning,
			interfaces.JobStatePending,
		},
	})
	if err != nil {
		return err
	}

	for _, job := range jobList {
		// 所有子任务完成，父任务完成
		finishTime := time.Now().UnixMilli()
		info := interfaces.JobStateInfo{
			State:       interfaces.JobStateCanceled,
			StateDetail: fmt.Sprintf("job '%s' has been canceled caused by restart service", job.Name),
			FinishTime:  finishTime,
			TimeCost:    finishTime - job.CreateTime,
		}

		err = je.ja.UpdateJobState(ctx, nil, job.ID, info)
		if err != nil {
			return err
		}
	}

	return nil
}

func (je *jobExecutor) AddJob(ctx context.Context, job *interfaces.Job) error {
	logger.Debugf("jobExecutor AddJob: %v", job)

	je.mJobLock.Lock()
	defer je.mJobLock.Unlock()

	je.mJobs[job.ID] = job

	for _, task := range job.Tasks {
		je.mTaskQueue.Enqueue(task)
	}

	info := interfaces.JobStateInfo{
		State: interfaces.JobStateRunning,
	}
	err := je.ja.UpdateJobState(ctx, nil, job.ID, info)
	if err != nil {
		return err
	}

	return nil
}

func (je *jobExecutor) StartTaskCallbackWorker() {
	logger.Debug("jobExecutor StartTaskCallbackWorker")
	for {
		task := <-je.mTaskCallbackChan
		je.HandleTaskCallback(task)
	}
}

func (je *jobExecutor) HandleTaskCallback(task *interfaces.Task) {
	defer func() {
		if rerr := recover(); rerr != nil {
			logger.Errorf("[handleTaskCallback] Failed: %v", rerr)
			return
		}
	}()

	logger.Debugf("jobExecutor HandleTaskCallback: %v", task)

	je.mJobLock.Lock()
	defer je.mJobLock.Unlock()

	job, ok := je.mJobs[task.JobID]
	if !ok {
		logger.Errorf("Failed to get job %s", task.JobID)
		return
	}

	ctx := context.WithValue(context.Background(), interfaces.ACCOUNT_INFO_KEY, job.Creator)

	// 检查任务是否完成
	job.FinishCount++
	if job.FinishCount != len(job.Tasks) {
		return
	}

	// 所有子任务完成，父任务完成
	finishTime := time.Now().UnixMilli()
	info := interfaces.JobStateInfo{
		State:      interfaces.JobStateCompleted,
		FinishTime: finishTime,
		TimeCost:   finishTime - job.CreateTime,
	}
	for _, task := range job.Tasks {
		if task.State == interfaces.TaskStateFailed {
			info.State = interfaces.JobStateFailed
			info.StateDetail += fmt.Sprintf("%s: %s\n", task.Name, task.StateDetail)
		}
	}

	if info.State == interfaces.JobStateFailed {
		err := je.ja.UpdateJobState(ctx, nil, job.ID, info)
		if err != nil {
			return
		}

		delete(je.mJobs, job.ID)
		return
	}

	tx, err := je.db.Begin()
	if err != nil {
		logger.Errorf("Failed to begin transaction: %v", err)
		return
	}

	for _, task := range job.Tasks {
		if task.ConceptType == interfaces.MODULE_TYPE_OBJECT_TYPE {
			err = je.ota.UpdateObjectTypeIndex(ctx, tx, job.KNID, task.ConceptID, task.Index)
			if err != nil {
				return
			}
		}
	}

	err = je.ja.UpdateJobState(ctx, tx, job.ID, info)
	if err != nil {
		return
	}

	err = tx.Commit()
	if err != nil {
		logger.Errorf("Failed to commit transaction: %v", err)
		return
	}

	delete(je.mJobs, job.ID)
}

func (je *jobExecutor) StartTaskWorker() {
	logger.Debug("jobExecutor StartTaskWorker")
	for {
		je.mJobLock.Lock()
		queObj, ok := je.mTaskQueue.Dequeue()
		je.mJobLock.Unlock()
		if !ok {
			time.Sleep(time.Second)
			continue
		}

		ctx := context.Background()
		select {
		case <-ctx.Done(): // 监听取消信号
			logger.Errorf("Operation canceled: %v", ctx.Err())
			continue
		default:
			task := queObj.(*interfaces.Task)
			err := je.HandleTask(ctx, task)
			if err != nil {
				logger.Errorf("Failed to handle task %s: %v", task.ID, err)
				continue
			}
		}
	}
}

func (je *jobExecutor) UpdateTaskStateFailed(ctx context.Context, task *interfaces.Task, err error) {
	logger.Debugf("jobExecutor UpdateTaskStateFailed: %v, err: %v", task, err)

	finishTime := time.Now().UnixMilli()
	info := interfaces.TaskStateInfo{
		State:       interfaces.TaskStateFailed,
		StateDetail: err.Error(),
		FinishTime:  finishTime,
		TimeCost:    finishTime - task.StartTime,
	}

	err = je.ja.UpdateTaskState(ctx, task.ID, info)
	if err != nil {
		return
	}
	task.State = info.State
	task.StateDetail = info.StateDetail
	task.FinishTime = info.FinishTime
	task.TimeCost = info.TimeCost
}

func (je *jobExecutor) UpdateTaskStateCompleted(ctx context.Context, task *interfaces.Task) {
	logger.Debugf("jobExecutor UpdateTaskStateCompleted: %v", task)

	finishTime := time.Now().UnixMilli()
	info := interfaces.TaskStateInfo{
		State:      interfaces.TaskStateCompleted,
		FinishTime: finishTime,
		TimeCost:   finishTime - task.StartTime,
	}

	err := je.ja.UpdateTaskState(ctx, task.ID, info)
	if err != nil {
		return
	}
	task.State = info.State
	task.FinishTime = info.FinishTime
	task.TimeCost = info.TimeCost
}

func (je *jobExecutor) HandleTask(ctx context.Context, task *interfaces.Task) (err error) {
	defer func() {
		if rerr := recover(); rerr != nil {
			logger.Errorf("[handleTask] Failed: %v", rerr)
			return
		}

		if err != nil {
			je.UpdateTaskStateFailed(ctx, task, err)
		}
		je.mTaskCallbackChan <- task
	}()

	logger.Infof("Start to execute task %s, concept type: %s, concept id: %s, branch: %s, index: %s",
		task.ID, task.ConceptType, task.ConceptID, task.Branch, task.Index)

	if task.State != interfaces.TaskStatePending {
		logger.Infof("Task %s is not pending, current state: %s", task.ID, task.State)
		return nil
	}

	job, ok := je.mJobs[task.JobID]
	if !ok {
		logger.Errorf("Failed to get job %s", task.JobID)
		return nil
	}

	accountInfo := job.Creator
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	startTime := time.Now().UnixMilli()
	info := interfaces.TaskStateInfo{
		State:     interfaces.TaskStateRunning,
		StartTime: startTime,
	}
	err = je.ja.UpdateTaskState(ctx, task.ID, info)
	if err != nil {
		return err
	}
	task.State = info.State
	task.StartTime = info.StartTime

	if task.ConceptType == interfaces.MODULE_TYPE_OBJECT_TYPE {
		objectType, err := je.ota.GetObjectTypeByID(ctx, job.KNID, task.ConceptID)
		if err != nil {
			return err
		}

		ott := NewObjectTypeTask(je.appSetting, task, objectType)
		err = ott.HandleObjectTypeTask(ctx, job, task, objectType)
		if err != nil {
			return err
		}
	} else if task.ConceptType == interfaces.MODULE_TYPE_RELATION_TYPE {
		relationType, err := je.rta.GetRelationTypeByID(ctx, job.KNID, task.ConceptID)
		if err != nil {
			return err
		}

		err = je.HandleRelationTypeTask(ctx, job, task, relationType)
		if err != nil {
			return err
		}
	}

	je.UpdateTaskStateCompleted(ctx, task)
	return nil
}

func (je *jobExecutor) HandleRelationTypeTask(ctx context.Context, job *interfaces.Job,
	task *interfaces.Task, relationType *interfaces.RelationType) error {
	logger.Infof("jobExecutor HandleRelationTypeTask: %v", task)

	info := interfaces.TaskStateInfo{
		State:     interfaces.TaskStateRunning,
		StartTime: time.Now().UnixMilli(),
	}
	err := je.ja.UpdateTaskState(ctx, task.ID, info)
	if err != nil {
		return err
	}
	return nil
}

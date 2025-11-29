package job

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/exporter/v2/ar_trace"
	"github.com/rs/xid"
	"go.opentelemetry.io/otel/codes"

	"ontology-manager/common"
	oerrors "ontology-manager/errors"
	"ontology-manager/interfaces"
	"ontology-manager/logics"
	"ontology-manager/logics/object_type"
	"ontology-manager/logics/permission"
	"ontology-manager/worker"
)

var (
	jServiceOnce sync.Once
	jService     interfaces.JobService
)

type jobService struct {
	appSetting *common.AppSetting
	db         *sql.DB
	ja         interfaces.JobAccess
	je         interfaces.JobExecutor
	ps         interfaces.PermissionService
	ots        interfaces.ObjectTypeService
	uma        interfaces.UserMgmtAccess
}

func NewJobService(appSetting *common.AppSetting) interfaces.JobService {
	jServiceOnce.Do(func() {
		jService = &jobService{
			appSetting: appSetting,
			db:         logics.DB,
			ja:         logics.JA,
			je:         worker.NewJobExecutor(appSetting),
			ps:         permission.NewPermissionService(appSetting),
			ots:        object_type.NewObjectTypeService(appSetting),
			uma:        logics.UMA,
		}
	})
	return jService
}

func (js *jobService) CreateJob(ctx context.Context, knID string, job *interfaces.Job) (jobID string, err error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Create job")
	defer span.End()

	// 判断userid是否有修改业务知识网络的权限
	err = js.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_TASK_MANAGE})
	if err != nil {
		return "", err
	}

	// 若提交的模型id为空，生成分布式ID
	if job.ID == "" {
		job.ID = xid.New().String()
	}
	jobID = job.ID

	job.KNID = knID
	job.Branch = interfaces.MAIN_BRANCH

	job.State = interfaces.JobStatePending
	job.StateDetail = ""

	currentTime := time.Now().UnixMilli()
	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}
	job.Creator = accountInfo
	job.CreateTime = currentTime
	job.FinishTime = 0
	job.TimeCost = 0

	if job.JobConceptConfig == nil {
		job.JobConceptConfig = []interfaces.ConceptConfig{}
	}

	tasks := map[string]*interfaces.Task{}
	if len(job.JobConceptConfig) == 0 {
		ots, err := js.ots.GetSimpleObjectTypeByKnID(ctx, knID)
		if err != nil {
			return "", err
		}
		for _, ot := range ots {
			task_id := xid.New().String()
			tasks[task_id] = &interfaces.Task{
				ID:          task_id,
				Name:        ot.OTName,
				JobID:       job.ID,
				ConceptType: interfaces.MODULE_TYPE_OBJECT_TYPE,
				ConceptID:   ot.OTID,
				ConceptName: ot.OTName,
				Branch:      ot.Branch,
				Index:       js.generateTaskIndexName(knID, ot.OTID, task_id),
				State:       interfaces.TaskStatePending,
				StateDetail: "",
				StartTime:   0,
				FinishTime:  0,
				TimeCost:    0,
			}
		}
	}
	job.Tasks = tasks

	tx, err := js.db.Begin()
	if err != nil {
		logger.Errorf("Begin transaction error: %s", err.Error())
		span.SetStatus(codes.Error, "事务开启失败")
		o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))

		return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_Job_InternalError_BeginTransactionFailed).
			WithErrorDetails(err.Error())
	}
	// 0.1 异常时
	defer func() {
		if err != nil {
			rollbackErr := tx.Rollback()
			if rollbackErr != nil {
				logger.Errorf("CreateJob Transaction Rollback Error:%v", rollbackErr)
				span.SetStatus(codes.Error, "事务回滚失败")
				o11y.Error(ctx, fmt.Sprintf("CreateJob Transaction Rollback Error: %s", err.Error()))
			}
		}
	}()

	// 创建
	err = js.ja.CreateJob(ctx, tx, job)
	if err != nil {
		logger.Errorf("CreateJob error: %s", err.Error())
		span.SetStatus(codes.Error, "创建任务失败")

		return "", rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_Job_InternalError).
			WithErrorDetails(err.Error())
	}

	err = js.ja.CreateTasks(ctx, tx, tasks)
	if err != nil {
		logger.Errorf("CreateTasks error: %s", err.Error())
		span.SetStatus(codes.Error, "创建子任务失败")

		return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_Job_InternalError).
			WithErrorDetails(err.Error())
	}

	err = tx.Commit()
	if err != nil {
		logger.Errorf("CreateJob Transaction Commit Failed:%v", err)
		span.SetStatus(codes.Error, "提交事务失败")
		o11y.Error(ctx, fmt.Sprintf("CreateJob Transaction Commit Failed: %s", err.Error()))
		return "", rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_Job_InternalError_CommitTransactionFailed).
			WithErrorDetails(err.Error())
	}

	_ = js.je.AddJob(ctx, job)

	span.SetStatus(codes.Ok, "")
	return job.ID, nil
}

func (js *jobService) DeleteJobs(ctx context.Context, knID string, jobIDs []string) (err error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Delete jobs")
	defer span.End()

	// 判断userid是否有修改业务知识网络的权限
	err = js.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_TASK_MANAGE})
	if err != nil {
		return err
	}

	tx, err := js.db.Begin()
	if err != nil {
		logger.Errorf("Begin transaction error: %s", err.Error())
		span.SetStatus(codes.Error, "事务开启失败")
		o11y.Error(ctx, fmt.Sprintf("Begin transaction error: %s", err.Error()))
	}
	defer func() {
		switch err {
		case nil:
			// 提交事务
			err = tx.Commit()
			if err != nil {
				logger.Errorf("DeleteJobs Transaction Commit Failed:%v", err)
				span.SetStatus(codes.Error, "提交事务失败")
				o11y.Error(ctx, fmt.Sprintf("DeleteJobs Transaction Commit Failed: %s", err.Error()))
				return
			}
			logger.Infof("DeleteJobs Transaction Commit Success")
			o11y.Debug(ctx, "DeleteJobs Transaction Commit Success")
		default:
			rollbackErr := tx.Rollback()
			if rollbackErr != nil {
				logger.Errorf("DeleteJobs Transaction Rollback Error:%v", rollbackErr)
				span.SetStatus(codes.Error, "事务回滚失败")
				o11y.Error(ctx, fmt.Sprintf("DeleteJobs Transaction Rollback Error: %s", err.Error()))
			}
		}
	}()

	// 删除
	err = js.ja.DeleteJobs(ctx, tx, jobIDs)
	if err != nil {
		logger.Errorf("DeleteJobs error: %s", err.Error())
		span.SetStatus(codes.Error, "删除任务失败")
		return rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_Job_InternalError).
			WithErrorDetails(err.Error())
	}

	err = js.ja.DeleteTasks(ctx, tx, jobIDs)
	if err != nil {
		logger.Errorf("DeleteTasks error: %s", err.Error())
		span.SetStatus(codes.Error, "删除子任务失败")
		return rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_Job_InternalError).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return err
}

func (js *jobService) ListJobs(ctx context.Context, knID string, queryParams interfaces.JobsQueryParams) ([]*interfaces.Job, int64, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "List jobs")
	defer span.End()

	// 判断userid是否有查看业务知识网络的权限
	err := js.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_TASK_MANAGE})
	if err != nil {
		return nil, 0, err
	}

	// 列表
	jobs, err := js.ja.ListJobs(ctx, queryParams)
	if err != nil {
		logger.Errorf("ListJobs error: %s", err.Error())
		span.SetStatus(codes.Error, "查询任务失败")
		return nil, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_Job_InternalError).
			WithErrorDetails(err.Error())
	}

	total, err := js.ja.GetJobsTotal(ctx, queryParams)
	if err != nil {
		logger.Errorf("GetJobsTotal error: %s", err.Error())
		span.SetStatus(codes.Error, "查询任务总数失败")
		return nil, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_Job_InternalError).
			WithErrorDetails(err.Error())
	}

	userIDsMap := make(map[string]string)
	for _, job := range jobs {
		userIDsMap[job.Creator.ID] = job.Creator.ID
	}

	userIDs := make([]string, 0, len(jobs))
	for userID := range userIDsMap {
		userIDs = append(userIDs, userID)
	}

	userNames, err := js.uma.GetUserNames(ctx, userIDs)
	if err != nil {
		span.SetStatus(codes.Error, "GetUserNames error")

		return []*interfaces.Job{}, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			oerrors.OntologyManager_Job_InternalError).WithErrorDetails(err.Error())
	}

	for _, job := range jobs {
		if userName, exist := userNames[job.Creator.ID]; exist {
			job.Creator.Name = userName
		} else {
			job.Creator.Name = "-"
		}
	}

	span.SetStatus(codes.Ok, "")
	return jobs, total, nil
}

func (js *jobService) ListTasks(ctx context.Context, knID string, queryParams interfaces.TasksQueryParams) ([]*interfaces.Task, int64, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "List tasks")
	defer span.End()

	// 判断userid是否有查看业务知识网络的权限
	err := js.ps.CheckPermission(ctx, interfaces.Resource{
		Type: interfaces.RESOURCE_TYPE_KN,
		ID:   knID,
	}, []string{interfaces.OPERATION_TYPE_TASK_MANAGE})
	if err != nil {
		return nil, 0, err
	}

	// 列表
	tasks, err := js.ja.ListTasks(ctx, queryParams)
	if err != nil {
		logger.Errorf("ListTasks error: %s", err.Error())
		span.SetStatus(codes.Error, "查询任务失败")
		return nil, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_Job_InternalError).
			WithErrorDetails(err.Error())
	}

	// 总数
	total, err := js.ja.GetTasksTotal(ctx, queryParams)
	if err != nil {
		logger.Errorf("GetTasksTotal error: %s", err.Error())
		span.SetStatus(codes.Error, "查询任务总数失败")
		return nil, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_Job_InternalError).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return tasks, total, nil
}

func (js *jobService) GetJobs(ctx context.Context, jobIDs []string) (map[string]*interfaces.Job, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Get jobs")
	defer span.End()

	// 查询
	jobs, err := js.ja.GetJobs(ctx, jobIDs)
	if err != nil {
		logger.Errorf("GetJobs error: %s", err.Error())
		span.SetStatus(codes.Error, "查询任务失败")
		return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_Job_InternalError).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return jobs, nil
}

func (js *jobService) GetJob(ctx context.Context, jobID string) (*interfaces.Job, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Get job")
	defer span.End()

	// 查询
	job, err := js.ja.GetJob(ctx, jobID)
	if err != nil {
		logger.Errorf("GetJob error: %s", err.Error())
		span.SetStatus(codes.Error, "查询任务失败")
		return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError, oerrors.OntologyManager_Job_InternalError).
			WithErrorDetails(err.Error())
	}

	span.SetStatus(codes.Ok, "")
	return job, nil
}

func (js *jobService) generateTaskIndexName(knID string, otID string, task_id string) string {
	// dip-kn_<kn_id>_<object_type_id>_<task_id>
	return fmt.Sprintf("dip-kn_ot_index-%s-%s-%s", knID, otID, task_id)
}

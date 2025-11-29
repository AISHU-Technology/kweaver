package job

import (
	"context"
	"database/sql"
	"fmt"
	"sync"

	libdb "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/db"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/exporter/v2/ar_trace"
	sq "github.com/Masterminds/squirrel"
	"github.com/bytedance/sonic"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"ontology-manager/common"
	"ontology-manager/interfaces"
)

const (
	OT_TABLE_NAME   = "t_object_type"
	RT_TABLE_NAME   = "t_relation_type"
	JOB_TABLE_NAME  = "t_kn_job"
	TASK_TABLE_NAME = "t_kn_task"
)

var (
	jAccessOnce sync.Once
	jAccess     interfaces.JobAccess
)

type jobAccess struct {
	appSetting *common.AppSetting
	db         *sql.DB
}

func NewJobAccess(appSetting *common.AppSetting) interfaces.JobAccess {
	jAccessOnce.Do(func() {
		jAccess = &jobAccess{
			appSetting: appSetting,
			db:         libdb.NewDB(&appSetting.DBSetting),
		}
	})
	return jAccess
}

// 创建job
func (ja *jobAccess) CreateJob(ctx context.Context, tx *sql.Tx, job *interfaces.Job) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Create job[%s]", job.Name), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	jobConceptConfigStr, err := sonic.MarshalString(job.JobConceptConfig)
	if err != nil {
		logger.Errorf("Failed to marshal job concept config, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to marshal job concept config, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Marshal job concept config failed ")
		return err
	}

	sqlStr, vals, err := sq.Insert(JOB_TABLE_NAME).
		Columns(
			"f_id",
			"f_name",
			"f_kn_id",
			"f_branch",
			"f_job_type",
			"f_job_concept_config",
			"f_state",
			"f_state_detail",
			"f_creator",
			"f_creator_type",
			"f_create_time",
		).
		Values(
			job.ID,
			job.Name,
			job.KNID,
			job.Branch,
			job.JobType,
			jobConceptConfigStr,
			job.State,
			job.StateDetail,
			job.Creator.ID,
			job.Creator.Type,
			job.CreateTime,
		).ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of insert job, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of insert job, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("创建job的 sql 语句: %s", sqlStr))

	_, err = tx.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("insert data error: %v\n", err)
		span.SetStatus(codes.Error, "Insert data error")
		o11y.Error(ctx, fmt.Sprintf("Insert data error: %v ", err))
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// 删除jobs
func (ja *jobAccess) DeleteJobs(ctx context.Context, tx *sql.Tx, jobIDs []string) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Delete jobs[%v]", jobIDs), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	if len(jobIDs) == 0 {
		return nil
	}

	sqlStr, vals, err := sq.Delete(JOB_TABLE_NAME).
		Where(sq.Eq{"f_id": jobIDs}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of delete jobs, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of delete jobs, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("删除job的 sql 语句: %s", sqlStr))

	_, err = tx.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("delete data error: %v\n", err)
		span.SetStatus(codes.Error, "Delete data error")
		o11y.Error(ctx, fmt.Sprintf("Delete data error: %v ", err))
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

func (ja *jobAccess) DeleteTasks(ctx context.Context, tx *sql.Tx, jobIDs []string) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Delete tasks[%v]", jobIDs), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	if len(jobIDs) == 0 {
		return nil
	}

	sqlStr, vals, err := sq.Delete(TASK_TABLE_NAME).
		Where(sq.Eq{"f_job_id": jobIDs}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of delete tasks, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of delete tasks, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("删除task的 sql 语句: %s", sqlStr))

	_, err = tx.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("delete data error: %v\n", err)
		span.SetStatus(codes.Error, "Delete data error")
		o11y.Error(ctx, fmt.Sprintf("Delete data error: %v ", err))
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// 更新job状态
func (ja *jobAccess) UpdateJobState(ctx context.Context, tx *sql.Tx, jobID string, stateInfo interfaces.JobStateInfo) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Update job[%s] state to %s", jobID, stateInfo.State),
		trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	if len(stateInfo.StateDetail) > interfaces.MAX_STATE_DETAIL_SIZE {
		stateInfo.StateDetail = stateInfo.StateDetail[:interfaces.MAX_STATE_DETAIL_SIZE]
	}
	builder := sq.Update(JOB_TABLE_NAME).
		Set("f_state", stateInfo.State).
		Set("f_state_detail", stateInfo.StateDetail).
		Where(sq.Eq{"f_id": jobID})

	if stateInfo.FinishTime != 0 {
		builder = builder.Set("f_finish_time", stateInfo.FinishTime)
	}
	if stateInfo.TimeCost != 0 {
		builder = builder.Set("f_time_cost", stateInfo.TimeCost)
	}

	sqlStr, vals, err := builder.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of update job status, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of update job status, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("更新job状态的 sql 语句: %s", sqlStr))

	if tx != nil {
		_, err = tx.ExecContext(ctx, sqlStr, vals...)
	} else {
		_, err = ja.db.ExecContext(ctx, sqlStr, vals...)
	}
	if err != nil {
		logger.Errorf("update data error: %v\n", err)
		span.SetStatus(codes.Error, "Update data error")
		o11y.Error(ctx, fmt.Sprintf("Update data error: %v ", err))
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// 根据ID查询job
func (ja *jobAccess) GetJob(ctx context.Context, jobID string) (*interfaces.Job, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Get job[%s]", jobID), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	if jobID == "" {
		return nil, nil
	}

	query := sq.Select(
		"f_id",
		"f_name",
		"f_kn_id",
		"f_branch",
		"f_state",
		"f_state_detail",
		"f_creator",
		"f_creator_type",
		"f_create_time",
		"f_finish_time",
		"f_time_cost",
	).From(JOB_TABLE_NAME).
		Where(sq.Eq{"f_id": jobID})

	sqlStr, vals, err := query.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of get job, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of get jobs, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return nil, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("根据ID查询job的 sql 语句: %s", sqlStr))

	row := ja.db.QueryRowContext(ctx, sqlStr, vals...)
	job := interfaces.Job{}
	err = row.Scan(
		&job.ID,
		&job.Name,
		&job.KNID,
		&job.Branch,
		&job.State,
		&job.StateDetail,
		&job.Creator.ID,
		&job.Creator.Type,
		&job.CreateTime,
		&job.FinishTime,
		&job.TimeCost,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		logger.Errorf("scan data error: %v\n", err)
		span.SetStatus(codes.Error, "Scan data error")
		o11y.Error(ctx, fmt.Sprintf("Scan data error: %v ", err))
		return nil, err
	}

	span.SetStatus(codes.Ok, "")
	return &job, nil
}

// 根据ID查询job
func (ja *jobAccess) GetJobs(ctx context.Context, jobIDs []string) (map[string]*interfaces.Job, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Get jobs[%v]", jobIDs), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	if len(jobIDs) == 0 {
		return map[string]*interfaces.Job{}, nil
	}

	query := sq.Select(
		"f_id",
		"f_name",
		"f_kn_id",
		"f_branch",
		"f_state",
		"f_state_detail",
		"f_creator",
		"f_creator_type",
		"f_create_time",
		"f_finish_time",
		"f_time_cost",
	).From(JOB_TABLE_NAME).
		Where(sq.Eq{"f_id": jobIDs})

	sqlStr, vals, err := query.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of get jobs, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of get jobs, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return nil, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("根据ID查询job的 sql 语句: %s", sqlStr))

	rows, err := ja.db.QueryContext(ctx, sqlStr, vals...)
	if err != nil {
		logger.Errorf("query data error: %v\n", err)
		span.SetStatus(codes.Error, "Query data error")
		o11y.Error(ctx, fmt.Sprintf("Query data error: %v ", err))
		return nil, err
	}
	defer rows.Close()

	jobs := map[string]*interfaces.Job{}
	for rows.Next() {
		var job interfaces.Job
		err := rows.Scan(
			&job.ID,
			&job.Name,
			&job.KNID,
			&job.Branch,
			&job.State,
			&job.StateDetail,
			&job.Creator.ID,
			&job.Creator.Type,
			&job.CreateTime,
			&job.FinishTime,
			&job.TimeCost,
		)
		if err != nil {
			logger.Errorf("scan data error: %v\n", err)
			span.SetStatus(codes.Error, "Scan data error")
			o11y.Error(ctx, fmt.Sprintf("Scan data error: %v ", err))
			return nil, err
		}
		jobs[job.ID] = &job
	}

	span.SetStatus(codes.Ok, "")
	return jobs, nil
}

// 更新task状态
func (ja *jobAccess) UpdateTaskState(ctx context.Context, taskID string, stateInfo interfaces.TaskStateInfo) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Update task[%s] state to %s", taskID, stateInfo.State), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	if len(stateInfo.StateDetail) > interfaces.MAX_STATE_DETAIL_SIZE {
		stateInfo.StateDetail = stateInfo.StateDetail[:interfaces.MAX_STATE_DETAIL_SIZE]
	}
	builder := sq.Update(TASK_TABLE_NAME).
		Set("f_state", stateInfo.State).
		Set("f_state_detail", stateInfo.StateDetail).
		Where(sq.Eq{"f_id": taskID})

	if stateInfo.StartTime != 0 {
		builder = builder.Set("f_start_time", stateInfo.StartTime)
	}
	if stateInfo.FinishTime != 0 {
		builder = builder.Set("f_finish_time", stateInfo.FinishTime)
	}
	if stateInfo.TimeCost != 0 {
		builder = builder.Set("f_time_cost", stateInfo.TimeCost)
	}

	sqlStr, vals, err := builder.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of update task status, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of update task status, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("更新task状态的 sql 语句: %s", sqlStr))

	_, err = ja.db.ExecContext(ctx, sqlStr, vals...)
	if err != nil {
		logger.Errorf("update data error: %v\n", err)
		span.SetStatus(codes.Error, "Update data error")
		o11y.Error(ctx, fmt.Sprintf("Update data error: %v ", err))
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// 查询job列表
func (ja *jobAccess) ListJobs(ctx context.Context, queryParams interfaces.JobsQueryParams) ([]*interfaces.Job, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "List jobs", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	query := sq.Select(
		"f_id",
		"f_name",
		"f_kn_id",
		"f_branch",
		"f_job_type",
		"f_job_concept_config",
		"f_state",
		"f_state_detail",
		"f_creator",
		"f_creator_type",
		"f_create_time",
		"f_finish_time",
		"f_time_cost",
	).From(JOB_TABLE_NAME)

	if queryParams.KNID != "" {
		query = query.Where(sq.Eq{"f_kn_id": queryParams.KNID})
	}

	// 过滤job名称
	if queryParams.NamePattern != "" {
		query = query.Where(sq.Like{"f_name": fmt.Sprintf("%%%s%%", queryParams.NamePattern)})
	}
	if queryParams.JobType != "" {
		query = query.Where(sq.Eq{"f_job_type": queryParams.JobType})
	}
	if len(queryParams.State) > 0 {
		query = query.Where(sq.Eq{"f_state": queryParams.State})
	}

	query = query.OrderBy(fmt.Sprintf("%s %s", queryParams.Sort, queryParams.Direction))

	if queryParams.Offset > 0 {
		query = query.Offset(uint64(queryParams.Offset))
	}
	if queryParams.Limit > 0 {
		query = query.Limit(uint64(queryParams.Limit))
	}

	sqlStr, vals, err := query.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of list jobs, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of list jobs, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return nil, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询job列表的 sql 语句: %s", sqlStr))
	logger.Debugf("查询job列表的 sql 语句: %s", sqlStr)

	rows, err := ja.db.QueryContext(ctx, sqlStr, vals...)
	if err != nil {
		logger.Errorf("query data error: %v\n", err)
		span.SetStatus(codes.Error, "Query data error")
		o11y.Error(ctx, fmt.Sprintf("Query data error: %v ", err))
		return nil, err
	}
	defer rows.Close()

	jobs := []*interfaces.Job{}
	for rows.Next() {
		job := interfaces.Job{}
		var jobConceptConfigStr string
		err := rows.Scan(
			&job.ID,
			&job.Name,
			&job.KNID,
			&job.Branch,
			&job.JobType,
			&jobConceptConfigStr,
			&job.State,
			&job.StateDetail,
			&job.Creator.ID,
			&job.Creator.Type,
			&job.CreateTime,
			&job.FinishTime,
			&job.TimeCost,
		)
		if err != nil {
			logger.Errorf("scan data error: %v\n", err)
			span.SetStatus(codes.Error, "Scan data error")
			o11y.Error(ctx, fmt.Sprintf("Scan data error: %v ", err))
			return nil, err
		}

		err = sonic.UnmarshalString(jobConceptConfigStr, &job.JobConceptConfig)
		if err != nil {
			logger.Errorf("unmarshal job concept config error: %v\n", err)
			span.SetStatus(codes.Error, "Unmarshal job concept config error")
			o11y.Error(ctx, fmt.Sprintf("Unmarshal job concept config error: %v ", err))
			return nil, err
		}
		jobs = append(jobs, &job)
	}

	span.SetStatus(codes.Ok, "")
	return jobs, nil
}

// 查询job总数
func (ja *jobAccess) GetJobsTotal(ctx context.Context, queryParams interfaces.JobsQueryParams) (int64, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Get jobs total", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	query := sq.Select("COUNT(*)").From(JOB_TABLE_NAME).
		Where(sq.Eq{"f_kn_id": queryParams.KNID})

	// 过滤job名称
	if queryParams.NamePattern != "" {
		query = query.Where(sq.Like{"f_name": fmt.Sprintf("%%%s%%", queryParams.NamePattern)})
	}
	if len(queryParams.State) > 0 {
		query = query.Where(sq.Eq{"f_state": queryParams.State})
	}

	sqlStr, vals, err := query.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of get jobs total, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of get jobs total, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return 0, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询job总数的 sql 语句: %s", sqlStr))

	var total int64
	err = ja.db.QueryRowContext(ctx, sqlStr, vals...).Scan(&total)
	if err != nil {
		logger.Errorf("query data error: %v\n", err)
		span.SetStatus(codes.Error, "Query data error")
		o11y.Error(ctx, fmt.Sprintf("Query data error: %v ", err))
		return 0, err
	}

	span.SetStatus(codes.Ok, "")
	return total, nil
}

// 批量创建tasks
func (ja *jobAccess) CreateTasks(ctx context.Context, tx *sql.Tx, tasks map[string]*interfaces.Task) error {
	ctx, span := ar_trace.Tracer.Start(ctx, fmt.Sprintf("Create tasks[%d]", len(tasks)), trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	if len(tasks) == 0 {
		return nil
	}

	builder := sq.Insert(TASK_TABLE_NAME).
		Columns(
			"f_id",
			"f_name",
			"f_job_id",
			"f_concept_type",
			"f_concept_id",
			"f_branch",
			"f_index",
			"f_state",
			"f_state_detail",
		)

	for _, task := range tasks {
		builder = builder.Values(
			task.ID,
			task.Name,
			task.JobID,
			task.ConceptType,
			task.ConceptID,
			task.Branch,
			task.Index,
			task.State,
			task.StateDetail,
		)
	}

	sqlStr, vals, err := builder.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of insert tasks, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of insert tasks, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("批量创建tasks的 sql 语句: %s", sqlStr))

	_, err = tx.Exec(sqlStr, vals...)
	if err != nil {
		logger.Errorf("insert data error: %v\n", err)
		span.SetStatus(codes.Error, "Insert data error")
		o11y.Error(ctx, fmt.Sprintf("Insert data error: %v ", err))
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// 查询task列表
func (ja *jobAccess) ListTasks(ctx context.Context, queryParams interfaces.TasksQueryParams) ([]*interfaces.Task, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "List tasks", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	query := sq.Select(
		"f_id",
		"f_name",
		"f_job_id",
		"f_concept_type",
		"f_concept_id",
		"f_branch",
		"f_index",
		"f_state",
		"f_state_detail",
		"f_start_time",
		"f_finish_time",
		"f_time_cost",
	).From(TASK_TABLE_NAME)

	if queryParams.JobID != "" {
		query = query.Where(sq.Eq{"f_job_id": queryParams.JobID})
	}

	if queryParams.NamePattern != "" {
		query = query.Where(sq.Like{"f_name": fmt.Sprintf("%%%s%%", queryParams.NamePattern)})
	}
	if queryParams.ConceptType != "" {
		query = query.Where(sq.Eq{"f_concept_type": queryParams.ConceptType})
	}
	if len(queryParams.State) != 0 {
		query = query.Where(sq.Eq{"f_state": queryParams.State})
	}

	query = query.OrderBy(fmt.Sprintf("%s %s", queryParams.Sort, queryParams.Direction))

	if queryParams.Offset != 0 {
		query = query.Offset(uint64(queryParams.Offset))
	}
	if queryParams.Limit != 0 {
		query = query.Limit(uint64(queryParams.Limit))
	}

	sqlStr, vals, err := query.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of list tasks, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of list tasks, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return nil, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询task列表的 sql 语句: %s", sqlStr))
	logger.Debugf("查询task列表的 sql 语句: %s", sqlStr)

	rows, err := ja.db.QueryContext(ctx, sqlStr, vals...)
	if err != nil {
		logger.Errorf("query data error: %v\n", err)
		span.SetStatus(codes.Error, "Query data error")
		o11y.Error(ctx, fmt.Sprintf("Query data error: %v ", err))
		return nil, err
	}
	defer rows.Close()

	tasks := []*interfaces.Task{}
	for rows.Next() {
		task := interfaces.Task{}
		err := rows.Scan(
			&task.ID,
			&task.Name,
			&task.JobID,
			&task.ConceptType,
			&task.ConceptID,
			&task.Branch,
			&task.Index,
			&task.State,
			&task.StateDetail,
			&task.StartTime,
			&task.FinishTime,
			&task.TimeCost,
		)
		if err != nil {
			logger.Errorf("scan data error: %v\n", err)
			span.SetStatus(codes.Error, "Scan data error")
			o11y.Error(ctx, fmt.Sprintf("Scan data error: %v ", err))
			return nil, err
		}
		tasks = append(tasks, &task)
	}

	span.SetStatus(codes.Ok, "")
	return tasks, nil
}

// 查询task总数
func (ja *jobAccess) GetTasksTotal(ctx context.Context, queryParams interfaces.TasksQueryParams) (int64, error) {
	ctx, span := ar_trace.Tracer.Start(ctx, "Get tasks total", trace.WithSpanKind(trace.SpanKindClient))
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	query := sq.Select(
		"count(*)",
	).From(TASK_TABLE_NAME).
		Where(sq.Eq{"f_job_id": queryParams.JobID})

	if queryParams.ConceptType != "" {
		query = query.Where(sq.Eq{"f_concept_type": queryParams.ConceptType})
	}
	if queryParams.NamePattern != "" {
		query = query.Where(sq.Like{"f_name": fmt.Sprintf("%%%s%%", queryParams.NamePattern)})
	}
	if len(queryParams.State) != 0 {
		query = query.Where(sq.Eq{"f_state": queryParams.State})
	}

	sqlStr, vals, err := query.ToSql()
	if err != nil {
		logger.Errorf("Failed to build the sql of get tasks total, error: %s", err.Error())
		o11y.Error(ctx, fmt.Sprintf("Failed to build the sql of get tasks total, error: %s", err.Error()))
		span.SetStatus(codes.Error, "Build sql failed ")
		return 0, err
	}

	// 记录处理的 sql 字符串
	o11y.Info(ctx, fmt.Sprintf("查询task总数的 sql 语句: %s", sqlStr))

	var total int64
	err = ja.db.QueryRowContext(ctx, sqlStr, vals...).Scan(&total)
	if err != nil {
		logger.Errorf("query data error: %v\n", err)
		span.SetStatus(codes.Error, "Query data error")
		o11y.Error(ctx, fmt.Sprintf("Query data error: %v ", err))
		return 0, err
	}

	span.SetStatus(codes.Ok, "")
	return total, nil
}

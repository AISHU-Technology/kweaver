package driveradapters

import (
	"context"
	"fmt"
	"net/http"
	"ontology-manager/common"
	oerrors "ontology-manager/errors"
	"ontology-manager/interfaces"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/exporter/v2/ar_trace"
	"github.com/gin-gonic/gin"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// CreateJob 创建 job
func (r *restHandler) CreateJob(c *gin.Context) {
	logger.Debug("Handler CreateJob Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"创建job", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// userId 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 设置 trace 的相关 api 的属性
	o11y.AddHttpAttrs4API(span, o11y.GetAttrsByGinCtx(c))

	// 1. 接受 kn_id 参数
	knID := c.Param("kn_id")
	span.SetAttributes(attr.Key("kn_id").String(knID))

	// 校验业务知识网络存在性
	_, exist, err := r.kns.CheckKNExistByID(ctx, knID)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	if !exist {
		httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
			oerrors.OntologyManager_KnowledgeNetwork_NotFound)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 接受绑定参数
	reqBody := interfaces.Job{}
	err = c.ShouldBindJSON(&reqBody)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_Job_InvalidParameter).
			WithErrorDetails("Binding Paramter Failed:" + err.Error())

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	reqBody.KNID = knID
	reqBody.Branch = interfaces.MAIN_BRANCH

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("创建行动类请求参数: [%s,%v]", c.Request.RequestURI, reqBody))

	// 1. 校验 创建任务必要参数的合法性, 非空、长度、是枚举值
	err = ValidateJob(ctx, &reqBody)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Validate job[%s] failed: %s. %v", reqBody.Name,
			httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		span.SetAttributes(attr.Key("job_name").String(reqBody.Name))
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	//调用创建 job 接口
	jobID, err := r.js.CreateJob(ctx, knID, &reqBody)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	//每次成功创建 记录审计日志
	audit.NewInfoLog(audit.OPERATION, audit.CREATE, audit.TransforOperator(visitor),
		interfaces.GenerateJobAuditObject(jobID, reqBody.Name), "")

	result := map[string]any{"id": jobID}

	logger.Debug("Handler CreateJob Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusCreated, result)
}

// DeleteJobs 批量删除 job
func (r *restHandler) DeleteJobs(c *gin.Context) {
	logger.Debug("Handler DeleteJobs Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"批量删除job", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// userId 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 设置 trace 的相关 api 的属性
	o11y.AddHttpAttrs4API(span, o11y.GetAttrsByGinCtx(c))

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("批量删除job请求参数: [%s]", c.Request.RequestURI))

	// 1. 接受 kn_id 参数
	knID := c.Param("kn_id")
	span.SetAttributes(attr.Key("kn_id").String(knID))
	// 校验业务知识网络存在性
	_, exist, err := r.kns.CheckKNExistByID(ctx, knID)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	if !exist {
		httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
			oerrors.OntologyManager_KnowledgeNetwork_NotFound)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	//获取参数字符串 <id1,id2,id3>
	jobIDsStr := c.Param("job_ids")
	span.SetAttributes(attr.Key("job_ids").String(jobIDsStr))

	//解析字符串 转换为 []string
	jobIDs := common.StringToStringSlice(jobIDsStr)

	//检查 jobIDs 是否都存在
	jobs, err := r.js.GetJobs(ctx, jobIDs)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	if len(jobIDs) != len(jobs) {
		for _, jobID := range jobIDs {
			if _, exist := jobs[jobID]; !exist {
				httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest,
					oerrors.OntologyManager_Job_JobNotFound)
				// 设置 trace 的错误信息的 attributes
				o11y.AddHttpAttrs4HttpError(span, httpErr)
				rest.ReplyError(c, httpErr)
				return
			}
		}
	}
	for _, job := range jobs {
		// 校验任务是否在当前业务知识网络下
		if job.KNID != knID {
			httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest,
				oerrors.OntologyManager_Job_JobNotFound)
			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
	}

	// 批量删除 job
	err = r.js.DeleteJobs(ctx, knID, jobIDs)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	//循环记录审计日志
	for _, job := range jobs {
		audit.NewWarnLog(audit.OPERATION, audit.DELETE, audit.TransforOperator(visitor),
			interfaces.GenerateJobAuditObject(job.ID, job.Name), audit.SUCCESS, "")
	}

	logger.Debug("Handler DeleteJobs Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusNoContent, nil)
}

// ListJobs 列出所有 job
func (r *restHandler) ListJobs(c *gin.Context) {
	logger.Debug("Handler ListJobs Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"列出所有job", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// userId 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 设置 trace 的相关 api 的属性
	o11y.AddHttpAttrs4API(span, o11y.GetAttrsByGinCtx(c))

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("列出所有job请求参数: [%s]", c.Request.RequestURI))

	// 1. 接受 kn_id 参数
	knID := c.Param("kn_id")
	span.SetAttributes(attr.Key("kn_id").String(knID))
	// 校验业务知识网络存在性
	_, exist, err := r.kns.CheckKNExistByID(ctx, knID)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	if !exist {
		httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
			oerrors.OntologyManager_KnowledgeNetwork_NotFound)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 获取分页参数
	namePattern := c.Query("name_pattern")
	jobType := c.Query("job_type")
	stateArr := c.QueryArray("state")
	offset := c.DefaultQuery("offset", interfaces.DEFAULT_OFFEST)
	limit := c.DefaultQuery("limit", interfaces.DEFAULT_LIMIT)
	sort := c.DefaultQuery("sort", "create_time")
	direction := c.DefaultQuery("direction", interfaces.DESC_DIRECTION)

	// 校验分页查询参数
	pageParam, err := validatePaginationQueryParameters(ctx,
		offset, limit, sort, direction, interfaces.JOB_SORT)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description,
			httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 校验 job_type 参数
	if jobType != "" {
		err = ValidateJobType(ctx, interfaces.JobType(jobType))
		if err != nil {
			httpErr := err.(*rest.HTTPError)
			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
	}

	// 校验 state 参数
	state := []interfaces.JobState{}
	for _, stateStr := range stateArr {
		err = ValidateJobState(ctx, interfaces.JobState(stateStr))
		if err != nil {
			httpErr := err.(*rest.HTTPError)
			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
		state = append(state, interfaces.JobState(stateStr))
	}

	// 构造标签列表查询参数的结构体
	queryParams := interfaces.JobsQueryParams{
		NamePattern: namePattern,
		KNID:        knID,
		JobType:     interfaces.JobType(jobType),
		State:       state,
	}
	queryParams.Sort = pageParam.Sort
	queryParams.Direction = pageParam.Direction
	queryParams.Limit = pageParam.Limit
	queryParams.Offset = pageParam.Offset

	jobs, total, err := r.js.ListJobs(ctx, knID, queryParams)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	result := map[string]any{
		"entries":     jobs,
		"total_count": total,
	}
	logger.Debug("Handler ListJobs Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusOK, result)
}

// ListTasks 列出指定 job 的子任务
func (r *restHandler) ListTasks(c *gin.Context) {
	logger.Debug("Handler ListTasks Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"列出指定job的子任务", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// userId 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 1. 接受 kn_id 参数
	knID := c.Param("kn_id")
	span.SetAttributes(attr.Key("kn_id").String(knID))
	// 校验业务知识网络存在性
	_, exist, err := r.kns.CheckKNExistByID(ctx, knID)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	if !exist {
		httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
			oerrors.OntologyManager_KnowledgeNetwork_NotFound)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	jobID := c.Param("job_id")
	span.SetAttributes(attr.Key("job_id").String(jobID))

	job, err := r.js.GetJob(ctx, jobID)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	if job == nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
			oerrors.OntologyManager_Job_JobNotFound)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 获取分页参数
	conceptType := c.Query("concept_type")
	NamePattern := c.Query("name_pattern")
	stateArr := c.QueryArray("state")
	offset := c.DefaultQuery("offset", interfaces.DEFAULT_OFFEST)
	limit := c.DefaultQuery("limit", interfaces.DEFAULT_LIMIT)
	sort := c.DefaultQuery("sort", "start_time")
	direction := c.DefaultQuery("direction", interfaces.ASC_DIRECTION)

	// 校验分页查询参数
	pageParam, err := validatePaginationQueryParameters(ctx,
		offset, limit, sort, direction, interfaces.TASK_SORT)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description,
			httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	if conceptType != "" {
		err = ValidateConceptType(ctx, conceptType)
		if err != nil {
			httpErr := err.(*rest.HTTPError)
			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
	}

	state := []interfaces.TaskState{}
	for _, stateStr := range stateArr {
		err = ValidateTaskState(ctx, interfaces.TaskState(stateStr))
		if err != nil {
			httpErr := err.(*rest.HTTPError)
			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
		state = append(state, interfaces.TaskState(stateStr))
	}

	// 构造标签列表查询参数的结构体
	queryParams := interfaces.TasksQueryParams{
		KNID:        knID,
		JobID:       jobID,
		ConceptType: conceptType,
		NamePattern: NamePattern,
		State:       state,
	}
	queryParams.Sort = pageParam.Sort
	queryParams.Direction = pageParam.Direction
	queryParams.Limit = pageParam.Limit
	queryParams.Offset = pageParam.Offset

	tasks, total, err := r.js.ListTasks(ctx, knID, queryParams)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	result := map[string]any{
		"entries":     tasks,
		"total_count": total,
	}
	logger.Debug("Handler ListTasks Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusOK, result)
}

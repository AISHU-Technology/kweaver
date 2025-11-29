package driveradapters

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/exporter/v2/ar_trace"
	"github.com/gin-gonic/gin"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"ontology-manager/common"
	oerrors "ontology-manager/errors"
	"ontology-manager/interfaces"
)

func (r *restHandler) HandleRelationTypeGetOverrideByIn(c *gin.Context) {
	switch c.GetHeader(interfaces.HTTP_HEADER_METHOD_OVERRIDE) {
	case "", http.MethodPost:
		r.CreateRelationTypesByIn(c)
	case http.MethodGet:
		r.SearchRelationTypesByIn(c)
	default:
		httpErr := rest.NewHTTPError(rest.GetLanguageCtx(c), http.StatusBadRequest,
			oerrors.OntologyManager_InvalidParameter_OverrideMethod)
		rest.ReplyError(c, httpErr)
	}
}

func (r *restHandler) HandleRelationTypeGetOverrideByEx(c *gin.Context) {
	switch c.GetHeader(interfaces.HTTP_HEADER_METHOD_OVERRIDE) {
	case "", http.MethodPost:
		r.CreateRelationTypesByEx(c)
	case http.MethodGet:
		r.SearchRelationTypesByEx(c)
	default:
		httpErr := rest.NewHTTPError(rest.GetLanguageCtx(c), http.StatusBadRequest,
			oerrors.OntologyManager_InvalidParameter_OverrideMethod)
		rest.ReplyError(c, httpErr)
	}
}

// 创建关系类(内部)
func (r *restHandler) CreateRelationTypesByIn(c *gin.Context) {
	logger.Debug("Handler CreateRelationTypesByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.CreateRelationTypes(c, visitor)
}

// 创建关系类（外部）
func (r *restHandler) CreateRelationTypesByEx(c *gin.Context) {
	logger.Debug("Handler CreateRelationTypesByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"创建关系类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.CreateRelationTypes(c, visitor)
}

// 创建关系类
func (r *restHandler) CreateRelationTypes(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("Handler CreateRelationTypes Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"创建关系类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// account_type 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 设置 trace 的相关 api 的属性
	o11y.AddHttpAttrs4API(span, o11y.GetAttrsByGinCtx(c))

	// 查询参数
	mode := c.DefaultQuery(interfaces.QueryParam_ImportMode, interfaces.ImportMode_Normal)
	httpErr := validateImportMode(ctx, mode)
	if httpErr != nil {
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

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
	reqBody := []*interfaces.RelationType{}
	err = c.ShouldBindJSON(&reqBody)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_RelationType_InvalidParameter).
			WithErrorDetails("Binding Paramter Failed:" + err.Error())

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	// 如果传入的模型对象为[], 应报错
	if len(reqBody) == 0 {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_InvalidParameter_RequestBody).
			WithErrorDetails("No relation type was passed in")

		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("创建关系类请求参数: [%s,%v]", c.Request.RequestURI, reqBody))

	relationTypes := make([]*interfaces.RelationType, 0)
	// 校验 请求体中目标模型名称合法性
	tmpNameMap := make(map[string]any)
	idMap := make(map[string]any)
	for i := 0; i < len(reqBody); i++ {
		// 校验导入模型时模块是否是关系类
		if reqBody[i].ModuleType != "" && reqBody[i].ModuleType != interfaces.MODULE_TYPE_RELATION_TYPE {
			httpErr := rest.NewHTTPError(ctx, http.StatusForbidden, oerrors.OntologyManager_InvalidParameter_ModuleType).
				WithErrorDetails("Relation type name is not 'relation_type'")

			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}

		// 0.校验请求体中多个模型 ID 是否重复
		rtID := reqBody[i].RTID
		if _, ok := idMap[rtID]; !ok || rtID == "" {
			idMap[rtID] = nil
		} else {
			errDetails := fmt.Sprintf("RelationType ID '%s' already exists in the request body", rtID)
			httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_RelationType_Duplicated_IDInFile).
				WithDescription(map[string]any{"relationTypeID": rtID}).
				WithErrorDetails(errDetails)

			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}

		// 1. 校验 关系类必要创建参数的合法性, 非空、长度、是枚举值
		err = ValidateRelationType(ctx, reqBody[i])
		if err != nil {
			httpErr := err.(*rest.HTTPError)

			// 记录异常日志
			o11y.Error(ctx, fmt.Sprintf("Validate relation type[%s] failed: %s. %v", reqBody[i].RTName,
				httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

			// 设置 trace 的错误信息的 attributes
			span.SetAttributes(attr.Key("rt_name").String(reqBody[i].RTName))
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}

		// 3. 校验 请求体中关系类名称重复性
		if _, ok := tmpNameMap[reqBody[i].RTName]; !ok {
			tmpNameMap[reqBody[i].RTName] = nil
		} else {
			httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_RelationType_Duplicated_Name)

			// 记录异常日志
			o11y.Error(ctx, fmt.Sprintf("Duplicated relation type name: [%s]: %s. %v", fmt.Sprintf("%v", reqBody[i].RTName),
				httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

			// 设置 trace 的错误信息的 attributes
			span.SetAttributes(attr.Key("rt_name").String(reqBody[i].RTName))

			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
		reqBody[i].KNID = knID

		relationTypes = append(relationTypes, reqBody[i])
	}

	//调用创建
	rtIDs, err := r.rts.CreateRelationTypes(ctx, nil, relationTypes, mode)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 成功，发送多条
	for _, relationType := range relationTypes {
		//每次成功创建 记录审计日志
		audit.NewInfoLog(audit.OPERATION, audit.CREATE, audit.TransforOperator(visitor),
			interfaces.GenerateRelationTypeAuditObject(relationType.RTID, relationType.RTName), "")
	}

	result := []any{}
	for _, rtID := range rtIDs {
		result = append(result, map[string]any{"id": rtID})
	}

	logger.Debug("Handler CreateRelationTypes Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusCreated, result)
}

// 更新关系类(内部)
func (r *restHandler) UpdateRelationTypeByIn(c *gin.Context) {
	logger.Debug("Handler UpdateRelationTypeByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.UpdateRelationType(c, visitor)
}

// 更新关系类（外部）
func (r *restHandler) UpdateRelationTypeByEx(c *gin.Context) {
	logger.Debug("Handler UpdateRelationTypeByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"修改关系类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.UpdateRelationType(c, visitor)
}

// 更新关系类
func (r *restHandler) UpdateRelationType(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("Handler UpdateRelationType Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"修改关系类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// accountID 存入 context 中
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

	// 1. 接受 rt_id 参数
	rtID := c.Param("rt_id")
	span.SetAttributes(attr.Key("rt_id").String(rtID))

	//接收绑定参数
	relationType := interfaces.RelationType{}
	err = c.ShouldBindJSON(&relationType)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_RelationType_InvalidParameter).
			WithErrorDetails("Binding Paramter Failed:" + err.Error())

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	relationType.RTID = rtID

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("修改关系类请求参数: [%s, %v]", c.Request.RequestURI, relationType))

	// 先按id获取原对象
	oldRTName, exist, err := r.rts.CheckRelationTypeExistByID(ctx, knID, rtID)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	if !exist {
		httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
			oerrors.OntologyManager_RelationType_RelationTypeNotFound)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 校验 关系类基本参数的合法性, 非空、长度、是枚举值
	err = ValidateRelationType(ctx, &relationType)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Validate relation type[%s] failed: %s. %v", relationType.RTName,
			httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		span.SetAttributes(attr.Key("rt_name").String(relationType.RTName))
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 名称或分组不同，校验新名称是否已存在
	ifNameModify := false
	if oldRTName != relationType.RTName {
		ifNameModify = true
		_, exist, err = r.rts.CheckRelationTypeExistByName(ctx, knID, relationType.RTName)
		if err != nil {
			httpErr := err.(*rest.HTTPError)

			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
		if exist {
			httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
				oerrors.OntologyManager_RelationType_RelationTypeNameExisted)

			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
	}
	relationType.IfNameModify = ifNameModify
	relationType.KNID = knID

	//根据id修改信息
	err = r.rts.UpdateRelationType(ctx, nil, &relationType)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	audit.NewInfoLog(audit.OPERATION, audit.UPDATE, audit.TransforOperator(visitor),
		interfaces.GenerateRelationTypeAuditObject(rtID, relationType.RTName), "")

	logger.Debug("Handler UpdateRelationType Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusNoContent, nil)
}

// 批量删除关系类
func (r *restHandler) DeleteRelationTypes(c *gin.Context) {
	logger.Debug("Handler DeleteRelationTypes Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"删除关系类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// accountID 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 设置 trace 的相关 api 的属性
	o11y.AddHttpAttrs4API(span, o11y.GetAttrsByGinCtx(c))

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("删除关系类请求参数: [%s]", c.Request.RequestURI))

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
	otIDsStr := c.Param("rt_ids")
	span.SetAttributes(attr.Key("rt_ids").String(otIDsStr))

	//解析字符串 转换为 []string
	rtIDs := common.StringToStringSlice(otIDsStr)

	//检查 rtIDs 是否都存在
	var relationTypes []*interfaces.RelationTypeWithKeyField
	for _, rtID := range rtIDs {
		rtName, exist, err := r.rts.CheckRelationTypeExistByID(ctx, knID, rtID)
		if err != nil {
			httpErr := err.(*rest.HTTPError)

			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)

			rest.ReplyError(c, httpErr)
			return
		}
		if !exist {
			httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
				oerrors.OntologyManager_RelationType_RelationTypeNotFound)

			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}

		relationTypes = append(relationTypes, &interfaces.RelationTypeWithKeyField{RTID: rtID, RTName: rtName})
	}

	// 批量删除关系类
	rowsAffect, err := r.rts.DeleteRelationTypes(ctx, nil, knID, rtIDs)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	//循环记录审计日志
	if rowsAffect != 0 {
		for _, relationType := range relationTypes {
			audit.NewWarnLog(audit.OPERATION, audit.DELETE, audit.TransforOperator(visitor),
				interfaces.GenerateRelationTypeAuditObject(relationType.RTID, relationType.RTName), audit.SUCCESS, "")
		}
	}

	logger.Debug("Handler DeleteRelationTypes Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusNoContent, nil)
}

// 分页获取关系类列表(内部)
func (r *restHandler) ListRelationTypesByIn(c *gin.Context) {
	logger.Debug("Handler ListRelationTypesByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.ListRelationTypes(c, visitor)
}

// 分页获取关系类列表（外部）
func (r *restHandler) ListRelationTypesByEx(c *gin.Context) {
	logger.Debug("Handler ListRelationTypesByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"分页获取关系类列表", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.ListRelationTypes(c, visitor)
}

// 分页获取关系类列表
func (r *restHandler) ListRelationTypes(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("ListRelationTypes Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"分页获取关系类列表", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// accountID 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 设置 trace 的相关 api 的属性
	o11y.AddHttpAttrs4API(span, o11y.GetAttrsByGinCtx(c))

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("分页获取关系类列表请求参数: [%s]", c.Request.RequestURI))

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
	tag := c.Query("tag")
	branch := c.Query("branch")
	groupID := c.Query("group_id")
	sourceObjectTypeID := c.Query("source_object_type_id")
	targetObjectTypeID := c.Query("target_object_type_id")
	offset := c.DefaultQuery("offset", interfaces.DEFAULT_OFFEST)
	limit := c.DefaultQuery("limit", interfaces.DEFAULT_LIMIT)
	sort := c.DefaultQuery("sort", "update_time")
	direction := c.DefaultQuery("direction", interfaces.DESC_DIRECTION)

	//去掉标签前后的所有空格进行搜索
	tag = strings.Trim(tag, " ")

	// 校验分页查询参数
	pageParam, err := validatePaginationQueryParameters(ctx,
		offset, limit, sort, direction, interfaces.RELATION_TYPE_SORT)
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

	// 构造标签列表查询参数的结构体
	parameter := interfaces.RelationTypesQueryParams{
		NamePattern:        namePattern,
		Tag:                tag,
		Branch:             branch,
		KNID:               knID,
		GroupID:            groupID,
		SourceObjectTypeID: sourceObjectTypeID,
		TargetObjectTypeID: targetObjectTypeID,
	}
	parameter.Sort = pageParam.Sort
	parameter.Direction = pageParam.Direction
	parameter.Limit = pageParam.Limit
	parameter.Offset = pageParam.Offset

	// var result map[string]any
	// if simpleInfo {
	// 获取关系类简单信息
	otList, total, err := r.rts.ListRelationTypes(ctx, parameter)
	result := map[string]any{"entries": otList, "total_count": total}
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

	logger.Debug("Handler ListRelationTypes Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusOK, result)
}

// 按 id 获取关系类对象信息(内部)
func (r *restHandler) GetRelationTypesByIn(c *gin.Context) {
	logger.Debug("Handler GetRelationTypesByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.GetRelationTypes(c, visitor)
}

// 按 id 获取关系类对象信息（外部）
func (r *restHandler) GetRelationTypesByEx(c *gin.Context) {
	logger.Debug("Handler ListRelationTypesByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"分页获取关系类列表", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.GetRelationTypes(c, visitor)
}

// 按 id 获取关系类对象信息
func (r *restHandler) GetRelationTypes(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("Handler GetRelationTypes Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"driver layer: Get relation type", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// accountID 存入 context 中
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

	//获取参数字符串
	rtIDsStr := c.Param("rt_ids")
	span.SetAttributes(attr.Key("rt_ids").String(rtIDsStr))

	//解析字符串 转换为 []string
	rtIDs := common.StringToStringSlice(rtIDsStr)

	// 获取关系类的详细信息，根据 include_view 参数来判断是否包含数据视图的过滤条件
	result, err := r.rts.GetRelationTypes(ctx, knID, rtIDs)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	logger.Debug("Handler GetRelationTypes Success")
	rest.ReplyOK(c, http.StatusOK, result)
}

// 检索关系类（外部）
func (r *restHandler) SearchRelationTypesByIn(c *gin.Context) {
	logger.Debug("Handler SearchRelationTypesByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.SearchRelationTypes(c, visitor)
}

// 检索关系类（外部）
func (r *restHandler) SearchRelationTypesByEx(c *gin.Context) {
	logger.Debug("Handler SearchRelationTypesByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"检索关系类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.SearchRelationTypes(c, visitor)
}

// 检索对象类
func (r *restHandler) SearchRelationTypes(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("SearchRelationTypes Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"检索关系类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// accountID 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 设置 trace 的相关 api 的属性
	o11y.AddHttpAttrs4API(span, o11y.GetAttrsByGinCtx(c))

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("检索对象类请求参数: [%s]", c.Request.RequestURI))

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

	//接收绑定参数
	query := interfaces.ConceptsQuery{}
	err = c.ShouldBindJSON(&query)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_KnowledgeNetwork_InvalidParameter).
			WithErrorDetails(fmt.Sprintf("Binding Concept Query Paramter Failed:%s", err.Error()))

		o11y.AddHttpAttrs4HttpError(span, httpErr)
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description,
			httpErr.BaseError.ErrorDetails))

		rest.ReplyError(c, httpErr)

		return
	}
	query.KNID = knID
	query.ModuleType = interfaces.MODULE_TYPE_RELATION_TYPE

	// todo: 校验：概念类型非空时，需要是指定的枚举类型；过滤条件的字段只能是type_id, type_name, property_name, property_dispaly_name, comment, *
	if query.Limit == 0 {
		query.Limit = 10
	}

	if query.Sort == nil {
		query.Sort = []*interfaces.SortParams{
			{
				Field:     interfaces.OPENSEARCH_SCORE_FIELD,
				Direction: interfaces.DESC_DIRECTION,
			},
			{
				Field:     "id",
				Direction: interfaces.ASC_DIRECTION,
			},
		}
	}

	err = validateConceptsQuery(ctx, &query)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		o11y.AddHttpAttrs4HttpError(span, httpErr)
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description,
			httpErr.BaseError.ErrorDetails))

		rest.ReplyError(c, httpErr)

		return
	}

	// 搜索概念
	result, err := r.rts.SearchRelationTypes(ctx, &query)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	logger.Debug("Handler SearchRelationTypes Success")
	rest.ReplyOK(c, http.StatusOK, result)
}

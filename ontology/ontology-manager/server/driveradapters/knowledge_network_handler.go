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

	oerrors "ontology-manager/errors"
	"ontology-manager/interfaces"
)

const (
	RESOURCES_KEYWOED    = "keyword"
	RESOURCES_PAGE_LIMIT = "50"
)

// 创建业务知识网络(内部)
func (r *restHandler) CreateKNByIn(c *gin.Context) {
	logger.Debug("Handler CreateKNByIn Start")
	// 内部接口 user_id从header中取
	visitor := GenerateVisitor(c)
	r.CreateKN(c, visitor)
}

// 创建业务知识网络（外部）
func (r *restHandler) CreateKNByEx(c *gin.Context) {
	logger.Debug("Handler CreateKNByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"创建业务知识网络", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.CreateKN(c, visitor)
}

// 创建业务知识网络
func (r *restHandler) CreateKN(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("Handler CreateKN Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"创建业务知识网络", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// accountID 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 设置 trace 的相关 api 的属性
	o11y.AddHttpAttrs4API(span, o11y.GetAttrsByGinCtx(c))

	// 导入模式
	mode := c.DefaultQuery(interfaces.QueryParam_ImportMode, interfaces.ImportMode_Normal)
	httpErr := validateImportMode(ctx, mode)
	if httpErr != nil {
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 接受绑定参数 - 单个知识网络对象
	kn := interfaces.KN{}
	err := c.ShouldBindJSON(&kn)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_KnowledgeNetwork_InvalidParameter).
			WithErrorDetails("Binding Paramter Failed:" + err.Error())

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("创建业务知识网络请求参数: [%s,%v]", c.Request.RequestURI, kn))

	// 校验导入模型时模块是否是业务知识网络
	if kn.ModuleType != "" && kn.ModuleType != interfaces.MODULE_TYPE_KN {
		httpErr := rest.NewHTTPError(ctx, http.StatusForbidden, oerrors.OntologyManager_InvalidParameter_ModuleType).
			WithErrorDetails("KN name is not 'knowledge_network'")

		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 从header中获取业务域
	businessDomain := c.GetHeader(interfaces.HTTP_HEADER_BUSINESS_DOMAIN)
	if businessDomain == "" {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_KnowledgeNetwork_InvalidParameter_BusinessDomain).
			WithErrorDetails("Business Domain is empty")

		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	kn.BusinessDomain = businessDomain

	// 1. 校验 业务知识网络必要创建参数的合法性, 非空、长度、是枚举值
	err = ValidateKN(ctx, &kn)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Validate knowledge network[%s] failed: %s. %v", kn.KNName,
			httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		span.SetAttributes(attr.Key("kn_name").String(kn.KNName))
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 调用创建单个知识网络
	knID, err := r.kns.CreateKN(ctx, &kn, mode)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 成功创建记录审计日志
	audit.NewInfoLog(audit.OPERATION, audit.CREATE, audit.TransforOperator(visitor),
		interfaces.GenerateKNAuditObject(knID, kn.KNName), "")

	logger.Debug("Handler CreateKN Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusCreated, map[string]any{"id": knID})
}

// 更新业务知识网络(内部)
func (r *restHandler) UpdateKNByIn(c *gin.Context) {
	logger.Debug("Handler UpdateKNByIn Start")
	// 内部接口 user_id从header中取
	visitor := GenerateVisitor(c)
	r.UpdateKN(c, visitor)
}

// 更新业务知识网络（外部）
func (r *restHandler) UpdateKNByEx(c *gin.Context) {
	logger.Debug("Handler UpdateKNByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"修改业务知识网络", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.UpdateKN(c, visitor)
}

// 更新业务知识网络
func (r *restHandler) UpdateKN(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("Handler UpdateKN Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"修改业务知识网络", trace.WithSpanKind(trace.SpanKindServer))
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

	//接收绑定参数
	kn := interfaces.KN{}
	err := c.ShouldBindJSON(&kn)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_KnowledgeNetwork_InvalidParameter).
			WithErrorDetails("Binding Paramter Failed:" + err.Error())

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	kn.KNID = knID

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("修改业务知识网络请求参数: [%s, %v]", c.Request.RequestURI, kn))

	// 先按id获取原对象
	oldKNName, exist, err := r.kns.CheckKNExistByID(ctx, knID)
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

	// 校验 业务知识网络基本参数的合法性, 非空、长度、是枚举值
	err = ValidateKN(ctx, &kn)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Validate knowledge network[%s] failed: %s. %v", kn.KNName,
			httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		span.SetAttributes(attr.Key("kn_name").String(kn.KNName))
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 名称或分组不同，校验新名称是否已存在
	ifNameModify := false
	if oldKNName != kn.KNName {
		ifNameModify = true
		_, exist, err = r.kns.CheckKNExistByName(ctx, kn.KNName)
		if err != nil {
			httpErr := err.(*rest.HTTPError)

			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
		if exist {
			httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
				oerrors.OntologyManager_KnowledgeNetwork_KNNameExisted)

			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
	}
	kn.IfNameModify = ifNameModify

	//根据id修改信息
	err = r.kns.UpdateKN(ctx, nil, &kn)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	audit.NewInfoLog(audit.OPERATION, audit.UPDATE, audit.TransforOperator(visitor),
		interfaces.GenerateKNAuditObject(knID, kn.KNName), "")

	logger.Debug("Handler UpdateKN Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusNoContent, nil)
}

// 批量删除业务知识网络
func (r *restHandler) DeleteKN(c *gin.Context) {
	logger.Debug("Handler DeleteKN Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"删除业务知识网络", trace.WithSpanKind(trace.SpanKindServer))
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
	o11y.Info(ctx, fmt.Sprintf("删除业务知识网络请求参数: [%s]", c.Request.RequestURI))

	//获取参数字符串 <id1,id2,id3>
	knID := c.Param("kn_id")
	span.SetAttributes(attr.Key("kn_id").String(knID))

	kn, err := r.kns.GetKNByID(ctx, knID, "")
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	if kn == nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusNotFound,
			oerrors.OntologyManager_KnowledgeNetwork_NotFound)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 批量删除业务知识网络
	rowsAffect, err := r.kns.DeleteKN(ctx, kn)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 记录审计日志
	if rowsAffect != 0 {
		audit.NewWarnLog(audit.OPERATION, audit.DELETE, audit.TransforOperator(visitor),
			interfaces.GenerateKNAuditObject(knID, kn.KNName), audit.SUCCESS, "")
	}

	logger.Debug("Handler DeleteKN Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusNoContent, nil)
}

// 分页获取业务知识网络列表(内部)
func (r *restHandler) ListKNsByIn(c *gin.Context) {
	logger.Debug("Handler ListKNsByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.ListKNs(c, visitor)
}

// 分页获取业务知识网络列表（外部）
func (r *restHandler) ListKNsByEx(c *gin.Context) {
	logger.Debug("Handler ListKNsByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"分页获取业务知识网络列表", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.ListKNs(c, visitor)
}

// 分页获取业务知识网络列表
func (r *restHandler) ListKNs(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("ListKNs Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"分页获取业务知识网络列表", trace.WithSpanKind(trace.SpanKindServer))
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
	o11y.Info(ctx, fmt.Sprintf("分页获取业务知识网络列表请求参数: [%s]", c.Request.RequestURI))

	// 从header中获取业务域
	businessDomain := c.GetHeader(interfaces.HTTP_HEADER_BUSINESS_DOMAIN)
	if businessDomain == "" {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_KnowledgeNetwork_InvalidParameter_BusinessDomain).
			WithErrorDetails("Business Domain is empty")

		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 获取分页参数
	namePattern := c.Query("name_pattern")
	branch := c.Query("branch")
	tag := c.Query("tag")
	offset := c.DefaultQuery("offset", interfaces.DEFAULT_OFFEST)
	limit := c.DefaultQuery("limit", interfaces.DEFAULT_LIMIT)
	sort := c.DefaultQuery("sort", "update_time")
	direction := c.DefaultQuery("direction", interfaces.DESC_DIRECTION)

	//去掉标签前后的所有空格进行搜索
	tag = strings.Trim(tag, " ")

	// 校验分页查询参数
	pageParam, err := validatePaginationQueryParameters(ctx,
		offset, limit, sort, direction, interfaces.KN_SORT)
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
	parameter := interfaces.KNsQueryParams{
		NamePattern:    namePattern,
		Tag:            tag,
		Branch:         branch,
		BusinessDomain: businessDomain,
	}
	parameter.Sort = pageParam.Sort
	parameter.Direction = pageParam.Direction
	parameter.Limit = pageParam.Limit
	parameter.Offset = pageParam.Offset

	// var result map[string]any
	// if simpleInfo {
	// 获取业务知识网络简单信息
	knList, total, err := r.kns.ListKNs(ctx, parameter)
	result := map[string]any{"entries": knList, "total_count": total}
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

	logger.Debug("Handler ListKNs Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusOK, result)
}

// 按 id 获取业务知识网络对象信息(内部)
func (r *restHandler) GetKNByIn(c *gin.Context) {
	logger.Debug("Handler GetKNByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.GetKN(c, visitor)
}

// 按 id 获取业务知识网络对象信息（外部）
func (r *restHandler) GetKNByEx(c *gin.Context) {
	logger.Debug("Handler ListKNsByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"分页获取业务知识网络列表", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.GetKN(c, visitor)
}

// 按 id 获取业务知识网络对象信息
func (r *restHandler) GetKN(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("Handler GetKN Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"driver layer: Get knowledge network", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// accountID 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 设置 trace 的相关 api 的属性
	o11y.AddHttpAttrs4API(span, o11y.GetAttrsByGinCtx(c))

	//获取参数字符串
	knID := c.Param("kn_id")
	span.SetAttributes(attr.Key("kn_id").String(knID))

	mode := c.DefaultQuery(interfaces.QueryParam_Mode, "")
	if mode != "" && mode != interfaces.Mode_Export {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_InvalidParameter_Mode).
			WithErrorDetails(fmt.Sprintf("The mode:%s is invalid", mode))
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	span.SetAttributes(attr.Key(interfaces.QueryParam_Mode).String(mode))

	// 获取业务知识网络的详细信息
	kn, err := r.kns.GetKNByID(ctx, knID, mode)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	logger.Debug("Handler GetKN Success")
	rest.ReplyOK(c, http.StatusOK, kn)
}

func (r *restHandler) GetRelationTypePathsByIn(c *gin.Context) {
	logger.Debug("Handler GetRelationTypePathsByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.GetRelationTypePaths(c, visitor)
}

// 在业务知识网络下查找概念子图（外部）
func (r *restHandler) GetRelationTypePathsByEx(c *gin.Context) {
	logger.Debug("Handler GetRelationTypePathsByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"在业务知识网络下查找概念子图", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.GetRelationTypePaths(c, visitor)
}

// 在业务知识网络下查找概念子图
func (r *restHandler) GetRelationTypePaths(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("Handler GetRelationTypePaths Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"driver layer: Get knowledge network", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// accountID 存入 context 中
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)

	// 设置 trace 的相关 api 的属性
	o11y.AddHttpAttrs4API(span, o11y.GetAttrsByGinCtx(c))

	//接收绑定参数
	query := interfaces.RelationTypePathsBaseOnSource{}
	err := c.ShouldBindJSON(&query)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_KnowledgeNetwork_InvalidParameter).
			WithErrorDetails(fmt.Sprintf("Binding Paramter Failed:%s", err.Error()))

		o11y.AddHttpAttrs4HttpError(span, httpErr)
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description,
			httpErr.BaseError.ErrorDetails))

		rest.ReplyError(c, httpErr)

		return
	}

	//获取参数字符串
	knID := c.Param("kn_id")
	span.SetAttributes(attr.Key("kn_id").String(knID))
	query.KNID = knID

	// todo： validate: 路径长度默认是1度，最大可查3度。
	err = ValidateRelationTypePathsQuery(ctx, &query)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 获取业务知识网络的详细信息
	kn, err := r.kns.GetRelationTypePaths(ctx, query)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	logger.Debug("Handler GetKN Success")
	rest.ReplyOK(c, http.StatusOK, kn)
}

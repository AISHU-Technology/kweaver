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

func (r *restHandler) HandleObjectTypeGetOverrideByIn(c *gin.Context) {
	switch c.GetHeader(interfaces.HTTP_HEADER_METHOD_OVERRIDE) {
	case "", http.MethodPost:
		r.CreateObjectTypesByIn(c)
	case http.MethodGet:
		r.SearchObjectTypesByIn(c)
	default:
		httpErr := rest.NewHTTPError(rest.GetLanguageCtx(c), http.StatusBadRequest,
			oerrors.OntologyManager_InvalidParameter_OverrideMethod)
		rest.ReplyError(c, httpErr)
	}
}

func (r *restHandler) HandleObjectTypeGetOverrideByEx(c *gin.Context) {
	switch c.GetHeader(interfaces.HTTP_HEADER_METHOD_OVERRIDE) {
	case "", http.MethodPost:
		r.CreateObjectTypesByEx(c)
	case http.MethodGet:
		r.SearchObjectTypesByEx(c)
	default:
		httpErr := rest.NewHTTPError(rest.GetLanguageCtx(c), http.StatusBadRequest,
			oerrors.OntologyManager_InvalidParameter_OverrideMethod)
		rest.ReplyError(c, httpErr)
	}
}

// 创建对象类(内部)
func (r *restHandler) CreateObjectTypesByIn(c *gin.Context) {
	logger.Debug("Handler CreateObjectTypesByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.CreateObjectTypes(c, visitor)
}

// 创建对象类（外部）
func (r *restHandler) CreateObjectTypesByEx(c *gin.Context) {
	logger.Debug("Handler CreateObjectTypesByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"创建对象类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.CreateObjectTypes(c, visitor)
}

// 创建对象类
func (r *restHandler) CreateObjectTypes(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("Handler CreateObjectTypes Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"创建对象类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	// accountID 存入 context 中
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
	reqBody := []*interfaces.ObjectType{}
	err = c.ShouldBindJSON(&reqBody)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_ObjectType_InvalidParameter).
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
			WithErrorDetails("No object type was passed in")

		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("创建对象类请求参数: [%s,%v]", c.Request.RequestURI, reqBody))

	objectTypes := make([]*interfaces.ObjectType, 0)
	// 校验 请求体中目标模型名称合法性
	tmpNameMap := make(map[string]any)
	idMap := make(map[string]any)
	for i := 0; i < len(reqBody); i++ {
		// 校验导入模型时模块是否是对象类
		if reqBody[i].ModuleType != "" && reqBody[i].ModuleType != interfaces.MODULE_TYPE_OBJECT_TYPE {
			httpErr := rest.NewHTTPError(ctx, http.StatusForbidden, oerrors.OntologyManager_InvalidParameter_ModuleType).
				WithErrorDetails("Object type name is not 'object_type'")

			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}

		// 0.校验请求体中多个模型 ID 是否重复
		otID := reqBody[i].OTID
		if _, ok := idMap[otID]; !ok || otID == "" {
			idMap[otID] = nil
		} else {
			errDetails := fmt.Sprintf("ObjectType ID '%s' already exists in the request body", otID)
			httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_ObjectType_Duplicated_IDInFile).
				WithDescription(map[string]any{"ObjectTypeID": otID}).
				WithErrorDetails(errDetails)

			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}

		// 1. 校验 对象类必要创建参数的合法性, 非空、长度、是枚举值
		err = ValidateObjectType(ctx, reqBody[i])
		if err != nil {
			httpErr := err.(*rest.HTTPError)

			// 记录异常日志
			o11y.Error(ctx, fmt.Sprintf("Validate object type[%s] failed: %s. %v", reqBody[i].OTName,
				httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

			// 设置 trace 的错误信息的 attributes
			span.SetAttributes(attr.Key("ot_name").String(reqBody[i].OTName))
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}

		// 3. 校验 请求体中对象类名称重复性
		if _, ok := tmpNameMap[reqBody[i].OTName]; !ok {
			tmpNameMap[reqBody[i].OTName] = nil
		} else {
			httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_ObjectType_Duplicated_Name)

			// 记录异常日志
			o11y.Error(ctx, fmt.Sprintf("Duplicated object type name: [%s]: %s. %v", fmt.Sprintf("%v", reqBody[i].OTName),
				httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

			// 设置 trace 的错误信息的 attributes
			span.SetAttributes(attr.Key("ot_name").String(reqBody[i].OTName))

			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}

		reqBody[i].KNID = knID
		objectTypes = append(objectTypes, reqBody[i])
	}

	//调用创建
	otIDs, err := r.ots.CreateObjectTypes(ctx, nil, objectTypes, mode)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 成功，发送多条
	for _, objectType := range objectTypes {
		//每次成功创建 记录审计日志
		audit.NewInfoLog(audit.OPERATION, audit.CREATE, audit.TransforOperator(visitor),
			interfaces.GenerateObjectTypeAuditObject(objectType.OTID, objectType.OTName), "")
	}

	result := []any{}
	for _, otID := range otIDs {
		result = append(result, map[string]any{"id": otID})
	}

	logger.Debug("Handler CreateObjectTypes Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusCreated, result)
}

// 更新对象类(内部)
func (r *restHandler) UpdateObjectTypeByIn(c *gin.Context) {
	logger.Debug("Handler UpdateObjectTypeByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.UpdateObjectType(c, visitor)
}

// 更新对象类（外部）
func (r *restHandler) UpdateObjectTypeByEx(c *gin.Context) {
	logger.Debug("Handler UpdateObjectTypeByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"修改对象类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.UpdateObjectType(c, visitor)
}

// 更新对象类
func (r *restHandler) UpdateObjectType(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("Handler UpdateObjectType Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"修改对象类", trace.WithSpanKind(trace.SpanKindServer))
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

	// 1. 接受 ot_id 参数
	otID := c.Param("ot_id")
	span.SetAttributes(attr.Key("ot_id").String(otID))

	//接收绑定参数
	objectType := interfaces.ObjectType{}
	err = c.ShouldBindJSON(&objectType)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_ObjectType_InvalidParameter).
			WithErrorDetails("Binding Paramter Failed:" + err.Error())

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	objectType.OTID = otID

	// 记录接口调用参数： c.Request.RequestURI, body
	o11y.Info(ctx, fmt.Sprintf("修改对象类请求参数: [%s, %v]", c.Request.RequestURI, objectType))

	// 先按id获取原对象
	oldObjectTypeName, exist, err := r.ots.CheckObjectTypeExistByID(ctx, knID, otID)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	if !exist {
		httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
			oerrors.OntologyManager_ObjectType_ObjectTypeNotFound)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 校验 对象类基本参数的合法性, 非空、长度、是枚举值
	err = ValidateObjectType(ctx, &objectType)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("Validate object type[%s] failed: %s. %v", objectType.OTName,
			httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		span.SetAttributes(attr.Key("ot_name").String(objectType.OTName))
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 名称或分组不同，校验新名称是否已存在
	ifNameModify := false
	if oldObjectTypeName != objectType.OTName {
		ifNameModify = true
		_, exist, err = r.ots.CheckObjectTypeExistByName(ctx, knID, objectType.OTName)
		if err != nil {
			httpErr := err.(*rest.HTTPError)

			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
		if exist {
			httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
				oerrors.OntologyManager_ObjectType_ObjectTypeNameExisted)

			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}
	}
	objectType.IfNameModify = ifNameModify
	objectType.KNID = knID

	//根据id修改信息
	err = r.ots.UpdateObjectType(ctx, nil, &objectType)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	audit.NewInfoLog(audit.OPERATION, audit.UPDATE, audit.TransforOperator(visitor),
		interfaces.GenerateObjectTypeAuditObject(otID, objectType.OTName), "")

	logger.Debug("Handler UpdateObjectType Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusNoContent, nil)
}

// 更新对象类的数据属性
func (r *restHandler) UpdateDataProperties(c *gin.Context) {
	logger.Debug("Handler UpdateDataProperties Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"修改对象类数据属性", trace.WithSpanKind(trace.SpanKindServer))
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
	// accountInfo 存入 context 中
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

	// 1. 接受 ot_id 参数
	otID := c.Param("ot_id")
	span.SetAttributes(attr.Key("ot_id").String(otID))

	// 先按id获取原对象
	objectType, err := r.ots.GetObjectTypeByID(ctx, knID, otID)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	if objectType == nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
			oerrors.OntologyManager_ObjectType_ObjectTypeNotFound)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	propertyNamesStr := c.Param("property_names")
	span.SetAttributes(attr.Key("property_names").String(propertyNamesStr))

	propertyNames := common.StringToStringSlice(propertyNamesStr)

	//接收绑定参数
	dataProperties := []*interfaces.DataProperty{}
	err = c.ShouldBindJSON(&dataProperties)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, oerrors.OntologyManager_ObjectType_InvalidParameter).
			WithErrorDetails("Binding Paramter Failed:" + err.Error())

		// 记录异常日志
		o11y.Error(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description, httpErr.BaseError.ErrorDetails))

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	// 校验数据属性
	err = ValidateDataProperties(ctx, propertyNames, dataProperties)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	//根据id修改信息
	err = r.ots.UpdateDataProperties(ctx, objectType, dataProperties)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	audit.NewInfoLog(audit.OPERATION, audit.UPDATE, audit.TransforOperator(visitor),
		interfaces.GenerateObjectTypeAuditObject(otID, objectType.OTName), "")

	logger.Debug("Handler UpdateObjectType Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusNoContent, nil)
}

// 批量删除对象类
func (r *restHandler) DeleteObjectTypes(c *gin.Context) {
	logger.Debug("Handler DeleteObjectTypes Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"删除对象类", trace.WithSpanKind(trace.SpanKindServer))
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
	o11y.Info(ctx, fmt.Sprintf("删除对象类请求参数: [%s]", c.Request.RequestURI))

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
	otIDsStr := c.Param("ot_ids")
	span.SetAttributes(attr.Key("ot_ids").String(otIDsStr))

	//解析字符串 转换为 []string
	otIDs := common.StringToStringSlice(otIDsStr)

	//检查 otIDs 是否都存在
	var objectTypes []*interfaces.ObjectTypeWithKeyField
	for _, otID := range otIDs {
		// 在指定业务知识网络下校验otID
		otName, exist, err := r.ots.CheckObjectTypeExistByID(ctx, knID, otID)
		if err != nil {
			httpErr := err.(*rest.HTTPError)

			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)

			rest.ReplyError(c, httpErr)
			return
		}
		if !exist {
			httpErr := rest.NewHTTPError(ctx, http.StatusForbidden,
				oerrors.OntologyManager_ObjectType_ObjectTypeNotFound)

			// 设置 trace 的错误信息的 attributes
			o11y.AddHttpAttrs4HttpError(span, httpErr)
			rest.ReplyError(c, httpErr)
			return
		}

		objectTypes = append(objectTypes, &interfaces.ObjectTypeWithKeyField{OTID: otID, OTName: otName})
	}

	// 批量删除对象类
	rowsAffect, err := r.ots.DeleteObjectTypes(ctx, nil, knID, otIDs)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	//循环记录审计日志
	if rowsAffect != 0 {
		for _, objectType := range objectTypes {
			audit.NewWarnLog(audit.OPERATION, audit.DELETE, audit.TransforOperator(visitor),
				interfaces.GenerateObjectTypeAuditObject(objectType.OTID, objectType.OTName), audit.SUCCESS, "")
		}
	}

	logger.Debug("Handler DeleteObjectTypes Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusNoContent, nil)
}

// 分页获取对象类列表(内部)
func (r *restHandler) ListObjectTypesByIn(c *gin.Context) {
	logger.Debug("Handler ListObjectTypesByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.ListObjectTypes(c, visitor)
}

// 分页获取对象类列表（外部）
func (r *restHandler) ListObjectTypesByEx(c *gin.Context) {
	logger.Debug("Handler ListObjectTypesByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"分页获取对象类列表", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.ListObjectTypes(c, visitor)
}

// 分页获取对象类列表
func (r *restHandler) ListObjectTypes(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("ListObjectTypes Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"分页获取对象类列表", trace.WithSpanKind(trace.SpanKindServer))
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
	o11y.Info(ctx, fmt.Sprintf("分页获取对象类列表请求参数: [%s]", c.Request.RequestURI))

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
	offset := c.DefaultQuery("offset", interfaces.DEFAULT_OFFEST)
	limit := c.DefaultQuery("limit", interfaces.DEFAULT_LIMIT)
	sort := c.DefaultQuery("sort", "update_time")
	direction := c.DefaultQuery("direction", interfaces.DESC_DIRECTION)

	//去掉标签前后的所有空格进行搜索
	tag = strings.Trim(tag, " ")

	// 校验分页查询参数
	pageParam, err := validatePaginationQueryParameters(ctx,
		offset, limit, sort, direction, interfaces.OBJECT_TYPE_SORT)
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
	parameter := interfaces.ObjectTypesQueryParams{
		NamePattern: namePattern,
		Tag:         tag,
		Branch:      branch,
		KNID:        knID,
		GroupID:     groupID,
	}
	parameter.Sort = pageParam.Sort
	parameter.Direction = pageParam.Direction
	parameter.Limit = pageParam.Limit
	parameter.Offset = pageParam.Offset

	// var result map[string]any
	// if simpleInfo {
	// 获取对象类简单信息
	otList, total, err := r.ots.ListObjectTypes(ctx, parameter)
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

	logger.Debug("Handler ListObjectTypes Success")
	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusOK, result)
}

// 按 id 获取对象类对象信息(内部)
func (r *restHandler) GetObjectTypesByIn(c *gin.Context) {
	logger.Debug("Handler GetObjectTypesByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.GetObjectTypes(c, visitor)
}

// 按 id 获取对象类对象信息（外部）
func (r *restHandler) GetObjectTypesByEx(c *gin.Context) {
	logger.Debug("Handler GetObjectTypesByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"分页获取对象类列表", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.GetObjectTypes(c, visitor)
}

// 按 id 获取对象类对象信息
func (r *restHandler) GetObjectTypes(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("Handler GetObjectTypes Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"driver layer: Get object type", trace.WithSpanKind(trace.SpanKindServer))
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
	otIDsStr := c.Param("ot_ids")
	span.SetAttributes(attr.Key("ot_ids").String(otIDsStr))

	//解析字符串 转换为 []string
	otIDs := common.StringToStringSlice(otIDsStr)

	// 获取对象类的详细信息，根据 include_view 参数来判断是否包含数据视图的过滤条件
	result, err := r.ots.GetObjectTypes(ctx, knID, otIDs)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	logger.Debug("Handler GetObjectTypes Success")
	rest.ReplyOK(c, http.StatusOK, result)
}

// 检索对象类（外部）
func (r *restHandler) SearchObjectTypesByIn(c *gin.Context) {
	logger.Debug("Handler SearchObjectTypesByIn Start")
	// 内部接口 user_id从header中取，跳过用户有效认证，后面在权限校验时就会校验这个用户是否有权限，无效用户无权限
	// 自行构建一个visitor
	visitor := GenerateVisitor(c)
	r.SearchObjectTypes(c, visitor)
}

// 检索对象类（外部）
func (r *restHandler) SearchObjectTypesByEx(c *gin.Context) {
	logger.Debug("Handler SearchObjectTypesByEx Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"检索对象类", trace.WithSpanKind(trace.SpanKindServer))
	defer span.End()

	// 校验token
	visitor, err := r.verifyOAuth(ctx, c)
	if err != nil {
		return
	}
	r.SearchObjectTypes(c, visitor)
}

// 检索对象类
func (r *restHandler) SearchObjectTypes(c *gin.Context, visitor rest.Visitor) {
	logger.Debug("SearchObjectTypes Start")
	ctx, span := ar_trace.Tracer.Start(rest.GetLanguageCtx(c),
		"检索对象类", trace.WithSpanKind(trace.SpanKindServer))
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
	query.ModuleType = interfaces.MODULE_TYPE_OBJECT_TYPE

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
	result, err := r.ots.SearchObjectTypes(ctx, &query)
	if err != nil {
		httpErr := err.(*rest.HTTPError)

		// 设置 trace 的错误信息的 attributes
		o11y.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	o11y.AddHttpAttrs4Ok(span, http.StatusOK)
	logger.Debug("Handler SearchObjectTypes Success")
	rest.ReplyOK(c, http.StatusOK, result)
}

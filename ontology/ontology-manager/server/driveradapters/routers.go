package driveradapters

import (
	"context"
	"fmt"
	"net/http"
	"time"

	libCommon "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/middleware"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"

	"ontology-manager/common"
	oerrors "ontology-manager/errors"
	"ontology-manager/interfaces"
	"ontology-manager/logics/action_type"
	"ontology-manager/logics/job"
	"ontology-manager/logics/knowledge_network"
	"ontology-manager/logics/object_type"
	"ontology-manager/logics/relation_type"
	"ontology-manager/version"
)

type RestHandler interface {
	RegisterPublic(engine *gin.Engine)
}

type restHandler struct {
	appSetting *common.AppSetting
	hydra      rest.Hydra
	ats        interfaces.ActionTypeService
	js         interfaces.JobService
	kns        interfaces.KNService
	ots        interfaces.ObjectTypeService
	rts        interfaces.RelationTypeService
}

func NewRestHandler(appSetting *common.AppSetting) RestHandler {
	r := &restHandler{
		appSetting: appSetting,
		hydra:      rest.NewHydra(appSetting.HydraAdminSetting),
		ats:        action_type.NewActionTypeService(appSetting),
		js:         job.NewJobService(appSetting),
		kns:        knowledge_network.NewKNService(appSetting),
		ots:        object_type.NewObjectTypeService(appSetting),
		rts:        relation_type.NewRelationTypeService(appSetting),
	}
	return r
}

func (r *restHandler) RegisterPublic(c *gin.Engine) {
	c.Use(r.AccessLog())
	c.Use(middleware.TracingMiddleware())

	c.GET("/health", r.HealthCheck)

	apiV1 := c.Group("/api/ontology-manager/v1")
	{
		// 业务知识网络
		apiV1.POST("/knowledge-networks", r.verifyJsonContentTypeMiddleWare(), r.CreateKNByEx)
		apiV1.DELETE("/knowledge-networks/:kn_id", r.DeleteKN)
		apiV1.PUT("/knowledge-networks/:kn_id", r.verifyJsonContentTypeMiddleWare(), r.UpdateKNByEx)
		apiV1.GET("/knowledge-networks", r.ListKNsByEx)
		apiV1.GET("/knowledge-networks/:kn_id", r.GetKNByEx)
		apiV1.POST("/knowledge-networks/:kn_id/relation-type-paths", r.GetRelationTypePathsByEx)

		// 对象类
		apiV1.POST("/knowledge-networks/:kn_id/object-types", r.verifyJsonContentTypeMiddleWare(), r.HandleObjectTypeGetOverrideByEx)
		apiV1.DELETE("/knowledge-networks/:kn_id/object-types/:ot_ids", r.DeleteObjectTypes) // path上用kn_ids接，实际上只能传一个id
		apiV1.PUT("/knowledge-networks/:kn_id/object-types/:ot_id", r.verifyJsonContentTypeMiddleWare(), r.UpdateObjectTypeByEx)
		apiV1.PUT("/knowledge-networks/:kn_id/object-types/:ot_id/data_properties/:property_names", r.verifyJsonContentTypeMiddleWare(), r.UpdateDataProperties)
		apiV1.GET("/knowledge-networks/:kn_id/object-types", r.ListObjectTypesByEx)        // path上用kn_ids接，实际上只能传一个id
		apiV1.GET("/knowledge-networks/:kn_id/object-types/:ot_ids", r.GetObjectTypesByEx) // path上用kn_ids接，实际上只能传一个id

		// 关系类
		apiV1.POST("/knowledge-networks/:kn_id/relation-types", r.verifyJsonContentTypeMiddleWare(), r.HandleRelationTypeGetOverrideByEx)
		apiV1.DELETE("/knowledge-networks/:kn_id/relation-types/:rt_ids", r.DeleteRelationTypes)
		apiV1.PUT("/knowledge-networks/:kn_id/relation-types/:rt_id", r.verifyJsonContentTypeMiddleWare(), r.UpdateRelationTypeByEx)
		apiV1.GET("/knowledge-networks/:kn_id/relation-types", r.ListRelationTypesByEx)
		apiV1.GET("/knowledge-networks/:kn_id/relation-types/:rt_ids", r.GetRelationTypesByEx)

		// 行动类
		apiV1.POST("/knowledge-networks/:kn_id/action-types", r.verifyJsonContentTypeMiddleWare(), r.HandleActionTypeGetOverrideByEx)
		apiV1.DELETE("/knowledge-networks/:kn_id/action-types/:at_ids", r.DeleteActionTypes)
		apiV1.PUT("/knowledge-networks/:kn_id/action-types/:at_id", r.verifyJsonContentTypeMiddleWare(), r.UpdateActionTypeByEx)
		apiV1.GET("/knowledge-networks/:kn_id/action-types", r.ListActionTypesByEx)
		apiV1.GET("/knowledge-networks/:kn_id/action-types/:at_ids", r.GetActionTypesByEx)

		// 任务管理
		apiV1.POST("/knowledge-networks/:kn_id/jobs", r.verifyJsonContentTypeMiddleWare(), r.CreateJob)
		apiV1.DELETE("/knowledge-networks/:kn_id/jobs/:job_ids", r.DeleteJobs)
		apiV1.GET("/knowledge-networks/:kn_id/jobs", r.ListJobs)
		apiV1.GET("/knowledge-networks/:kn_id/jobs/:job_id/tasks", r.ListTasks)
	}

	apiInV1 := c.Group("/api/ontology-manager/in/v1")
	{
		// 业务知识网络
		apiInV1.POST("/knowledge-networks", r.verifyJsonContentTypeMiddleWare(), r.CreateKNByIn)
		apiInV1.PUT("/knowledge-networks/:kn_id", r.verifyJsonContentTypeMiddleWare(), r.UpdateKNByIn)
		apiInV1.GET("/knowledge-networks", r.ListKNsByIn)
		apiInV1.GET("/knowledge-networks/:kn_id", r.GetKNByIn)
		apiInV1.POST("/knowledge-networks/:kn_id/relation-type-paths", r.GetRelationTypePathsByIn)

		// 对象类
		apiInV1.POST("/knowledge-networks/:kn_id/object-types", r.verifyJsonContentTypeMiddleWare(), r.HandleObjectTypeGetOverrideByIn)
		apiInV1.PUT("/knowledge-networks/:kn_id/object-types/:ot_id", r.verifyJsonContentTypeMiddleWare(), r.UpdateObjectTypeByIn)
		apiInV1.GET("/knowledge-networks/:kn_id/object-types", r.ListObjectTypesByIn)
		apiInV1.GET("/knowledge-networks/:kn_id/object-types/:ot_ids", r.GetObjectTypesByIn) // path上用kn_ids接，实际上只能传一个id

		// 关系类
		apiInV1.POST("/knowledge-networks/:kn_id/relation-types", r.verifyJsonContentTypeMiddleWare(), r.HandleRelationTypeGetOverrideByIn)
		apiInV1.PUT("/knowledge-networks/:kn_id/relation-types/:rt_id", r.verifyJsonContentTypeMiddleWare(), r.UpdateRelationTypeByIn)
		apiInV1.GET("/knowledge-networks/:kn_id/relation-types", r.ListRelationTypesByIn)
		apiInV1.GET("/knowledge-networks/:kn_id/relation-types/:rt_ids", r.GetRelationTypesByIn)

		// 行动类
		apiInV1.POST("/knowledge-networks/:kn_id/action-types", r.verifyJsonContentTypeMiddleWare(), r.HandleActionTypeGetOverrideByIn)
		apiInV1.PUT("/knowledge-networks/:kn_id/action-types/:at_id", r.verifyJsonContentTypeMiddleWare(), r.UpdateActionTypeByIn)
		apiInV1.GET("/knowledge-networks/:kn_id/action-types", r.ListActionTypesByIn)
		apiInV1.GET("/knowledge-networks/:kn_id/action-types/:at_ids", r.GetActionTypesByIn)
	}

	logger.Info("RestHandler RegisterPublic")
}

// HealthCheck 健康检查
func (r *restHandler) HealthCheck(c *gin.Context) {
	// 返回服务信息
	serverInfo := o11y.ServerInfo{
		ServerName:    version.ServerName,
		ServerVersion: version.ServerVersion,
		Language:      version.LanguageGo,
		GoVersion:     version.GoVersion,
		GoArch:        version.GoArch,
	}
	rest.ReplyOK(c, http.StatusOK, serverInfo)
}

// gin中间件 校验content type
func (r *restHandler) verifyJsonContentTypeMiddleWare() gin.HandlerFunc {
	return func(c *gin.Context) {
		//拦截请求，判断ContentType是否为XXX
		if c.ContentType() != interfaces.CONTENT_TYPE_JSON {
			httpErr := rest.NewHTTPError(c, http.StatusNotAcceptable, oerrors.OntologyManager_InvalidRequestHeader_ContentType).
				WithErrorDetails(fmt.Sprintf("Content-Type header [%s] is not supported, expected is [application/json].", c.ContentType()))
			rest.ReplyError(c, httpErr)

			c.Abort()
		}

		//执行后续操作
		c.Next()
	}
}

// gin中间件 访问日志
func (r *restHandler) AccessLog() gin.HandlerFunc {
	return func(c *gin.Context) {

		beginTime := time.Now()
		c.Next()
		endTime := time.Now()
		durTime := endTime.Sub(beginTime).Seconds()

		logger.Debugf("access log: url: %s, method: %s, begin_time: %s, end_time: %s, subTime: %f",
			c.Request.URL.Path,
			c.Request.Method,
			beginTime.Format(libCommon.RFC3339Milli),
			endTime.Format(libCommon.RFC3339Milli),
			durTime,
		)
	}
}

// 校验oauth
func (r *restHandler) verifyOAuth(ctx context.Context, c *gin.Context) (rest.Visitor, error) {
	vistor, err := r.hydra.VerifyToken(ctx, c)
	if err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusUnauthorized, rest.PublicError_Unauthorized).
			WithErrorDetails(err.Error())
		rest.ReplyError(c, httpErr)
		return vistor, err
	}

	return vistor, nil
}

func GenerateVisitor(c *gin.Context) rest.Visitor {

	accountInfo := interfaces.AccountInfo{
		ID:   c.GetHeader(interfaces.HTTP_HEADER_ACCOUNT_ID),
		Type: c.GetHeader(interfaces.HTTP_HEADER_ACCOUNT_TYPE),
	}

	visitor := rest.Visitor{
		ID:         accountInfo.ID,
		Type:       rest.VisitorType(accountInfo.Type),
		TokenID:    "", // 无token
		IP:         c.ClientIP(),
		Mac:        c.GetHeader("X-Request-MAC"),
		UserAgent:  c.GetHeader("User-Agent"),
		ClientType: rest.ClientType_Linux,
	}
	return visitor
}

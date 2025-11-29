package driveradapters

import (
	"context"
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/middleware"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"

	"ontology-query/common"
	oerrors "ontology-query/errors"
	"ontology-query/interfaces"
	"ontology-query/logics/action_type"
	"ontology-query/logics/knowledge_network"
	"ontology-query/logics/object_type"
	"ontology-query/version"
)

type RestHandler interface {
	RegisterPublic(engine *gin.Engine)
}

type restHandler struct {
	appSetting *common.AppSetting
	hydra      rest.Hydra

	ats interfaces.ActionTypeService
	kns interfaces.KnowledgeNetworkService
	ots interfaces.ObjectTypeService
}

func NewRestHandler(appSetting *common.AppSetting) RestHandler {
	r := &restHandler{
		appSetting: appSetting,
		hydra:      rest.NewHydra(appSetting.HydraAdminSetting),
		kns:        knowledge_network.NewKnowledgeNetworkService(appSetting),
		ats:        action_type.NewActionTypeService(appSetting),
		ots:        object_type.NewObjectTypeService(appSetting),
	}
	return r
}

func (r *restHandler) RegisterPublic(c *gin.Engine) {
	c.Use(middleware.TracingMiddleware())

	c.GET("/health", r.HealthCheck)

	apiV1 := c.Group("/api/ontology-query/v1")
	{
		// 查询指定对象类的对象数据
		apiV1.POST("/knowledge-networks/:kn_id/object-types/:ot_id", r.verifyJsonContentTypeMiddleWare(), r.GetObjectsInObjectTypeByEx)
		apiV1.POST("/knowledge-networks/:kn_id/object-types/:ot_id/properties", r.verifyJsonContentTypeMiddleWare(), r.GetObjectsPropertiesByEx)
		// 基于起点、方向和路径长度获取对象子图
		apiV1.POST("/knowledge-networks/:kn_id/subgraph", r.verifyJsonContentTypeMiddleWare(), r.GetObjectsSubgraphByEx)
		apiV1.POST("/knowledge-networks/:kn_id/action-types/:at_id", r.verifyJsonContentTypeMiddleWare(), r.GetActionsInActionTypeByEx)
	}

	apiInV1 := c.Group("/api/ontology-query/in/v1")
	{
		// 业务知识网络
		apiInV1.POST("/knowledge-networks/:kn_id/object-types/:ot_id", r.verifyJsonContentTypeMiddleWare(), r.GetObjectsInObjectTypeByIn)
		apiInV1.POST("/knowledge-networks/:kn_id/object-types/:ot_id/properties", r.verifyJsonContentTypeMiddleWare(), r.GetObjectsPropertiesByIn)
		// 基于起点、方向和路径长度获取对象子图
		apiInV1.POST("/knowledge-networks/:kn_id/subgraph", r.verifyJsonContentTypeMiddleWare(), r.GetObjectsSubgraphByIn)
		apiInV1.POST("/knowledge-networks/:kn_id/action-types/:at_id", r.verifyJsonContentTypeMiddleWare(), r.GetActionsInActionTypeByIn)
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
			httpErr := rest.NewHTTPError(c, http.StatusNotAcceptable, oerrors.OntologyQuery_InvalidRequestHeader_ContentType).
				WithErrorDetails(fmt.Sprintf("Content-Type header [%s] is not supported, expected is [application/json].", c.ContentType()))
			rest.ReplyError(c, httpErr)

			c.Abort()
		}

		//执行后续操作
		c.Next()
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

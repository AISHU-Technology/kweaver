// Package controllers 为接口的控制逻辑
// - 描述：GEngine KG 入口
// - 时间：2020-6-4
package controllers

import (
	"context"
	"github.com/gin-gonic/gin"
	"github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"graph-engine/controllers/gql"
	"graph-engine/leo"
)

// MakeKGHandler 创建 GQL Handler
func MakeKGHandler() gin.HandlerFunc {
	return leo.NewGraphqlHandler(gql.KGSchema, &gql.KGInfoQuery{})
}

// KGGqlHandler 创建 GraphQL handler 带入HTTP相关属性
// @Summary graphql search
// @Description graphql search
// @Tags Engine
// Param body body gql.KGInfoQuery true "graphql search statement"
// @Router /api/engine/v1/kg/ [post]
// @Accept  json
// @Produce json
// @Success 200 json data "result data"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrOrientDBErr: OrientDB error"
// @Failure 500 {object} utils.Error "EngineServer.ErrResourceErr: did not find configuration file "
func KGGqlHandler(c *gin.Context) {
	schema := graphql.MustParseSchema(gql.KGSchema, &gql.KGInfoQuery{})
	var gqlhandler = relay.Handler{Schema: schema}

	ctx := context.WithValue(c.Request.Context(), "Context", c)
	newReq := c.Request.WithContext(ctx)

	gqlhandler.ServeHTTP(c.Writer, newReq)
}

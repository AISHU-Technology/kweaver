// Package controllers 为接口的控制逻辑
// - 描述：GEngine KG 入口
// - 作者：张坤 (xavier.chen@aishu.cn)
// - 时间：2020-6-4
package controllers

import (
	"context"
	"github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"graph-engine/controllers/gql"

	"github.com/gin-gonic/gin"
	"graph-engine/leo"
)

// MakeKGHandler 创建 GQL Handler
func MakeKGHandler() gin.HandlerFunc {
	return leo.NewGraphqlHandler(gql.KGSchema, &gql.KGInfoQuery{})
}

// KGGqlHandler 创建 GraphQL handler 带入HTTP相关属性
func KGGqlHandler(c *gin.Context) {
	schema := graphql.MustParseSchema(gql.KGSchema, &gql.KGInfoQuery{})
	var gqlhandler = relay.Handler{Schema: schema}

	ctx := context.WithValue(c.Request.Context(), "Context", c)
	newReq := c.Request.WithContext(ctx)

	gqlhandler.ServeHTTP(c.Writer, newReq)
}

// Package controllers 为接口的控制逻辑
// - 描述：GEngine KG 入口
// - 作者：张坤 (xavier.chen@aishu.cn)
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

// MakeExploreHandler 创建 GQL Handler
func MakeExploreHandler() gin.HandlerFunc {
	return leo.NewGraphqlHandler(gql.DataQuerySchema, &gql.DataQuery{})
}

// ExploreGqlHandler 创建 GraphQL handler 带入HTTP相关属性
func ExploreGqlHandler(c *gin.Context) {
	schema := graphql.MustParseSchema(gql.DataQuerySchema, &gql.DataQuery{})
	var gqlhandler = relay.Handler{Schema: schema}

	ctx := context.WithValue(context.Background(), "Context", c)
	//ctx := context.WithValue(c.Request.Context(), "Context", c)
	newReq := c.Request.WithContext(ctx)

	gqlhandler.ServeHTTP(c.Writer, newReq)
}

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

// MakeExploreHandler 创建 GQL Handler
func MakeExploreHandler() gin.HandlerFunc {
	return leo.NewGraphqlHandler(gql.DataQuerySchema, &gql.DataQuery{})
}

// ExploreGqlHandler
// @Summary graphql search
// @Description graphql search
// @Tags CEngine
// @Param body body gql.DataQuery true "graphql search statement"
// @Router /api/engine/v1/explore/ [post]
// @Accept  json
// @Produce json
// @Success 200 {object} gql.DataQuery "result string"
// @Failure 400 {object} utils.Error "EngineServer.ErrArgsErr: Parameter exception"
// @Failure 500 {object} utils.Error "EngineServer.ErrInternalErr: internal error"
// @Failure 500 {object} utils.Error "EngineServer.ErrVClassErr: no vertexs class"
// @Failure 500 {object} utils.Error "EngineServer.ErrConfigStatusErr: graph in configuration status"
func ExploreGqlHandler(c *gin.Context) {
	schema := graphql.MustParseSchema(gql.DataQuerySchema, &gql.DataQuery{})
	var gqlhandler = relay.Handler{Schema: schema}
	ctx := context.WithValue(context.Background(), "Context", c)
	//ctx := context.WithValue(c.Request.Context(), "Context", c)
	newReq := c.Request.WithContext(ctx)

	gqlhandler.ServeHTTP(c.Writer, newReq)
}

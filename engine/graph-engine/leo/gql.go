// Package leo 提供了 Web 框架使用的工具集
// - 描述：当前文件提供了 GQL 的 handler 函数
// - 作者：陈骁 (xavier.chen@eisoo.com)
// - 时间：2020-1-4
package leo

import (
	"html/template"

	"github.com/gin-gonic/gin"
	graphql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
)

type testQuery struct{}

func (q *testQuery) Hello() string {
	return "Hello, world!"
}

var testSchema = `
type Query {
	hello: String!
}
`

// HelloGqlHandler 处理 GtraphQL 请求，Hello 提供了一个样例
func HelloGqlHandler(c *gin.Context) {

	schema := graphql.MustParseSchema(testSchema, &testQuery{})
	var gqlhandler = relay.Handler{Schema: schema}
	gqlhandler.ServeHTTP(c.Writer, c.Request)
}

// NewGraphqlHandler 创建 GraphQL handler
func NewGraphqlHandler(schema string, resovler interface{}, opts ...graphql.SchemaOpt) gin.HandlerFunc {
	s := graphql.MustParseSchema(schema, resovler, opts...)
	var gqlhandler = relay.Handler{Schema: s}
	return func(c *gin.Context) {
		gqlhandler.ServeHTTP(c.Writer, c.Request)
	}
}

// GraphiqlHandler 生成 graphiql
// 必须和 graphql 的 url 保持一致，否则无法生成文档
// 必须先注册静态文件
func GraphiqlHandler(c *gin.Context) {
	tmpl, err := template.New("page").Parse(page)
	if err != nil {
		panic("Error")
	}
	uri := c.Request.RequestURI
	err = tmpl.Execute(c.Writer, uri)

	if err != nil {
		panic(err)
	}
}

// RegisterIQLAssets 注册 gql 静态文件
func RegisterIQLAssets(s *Service) {
	s.RegisterStatic("/gqlassets", "./gql_assets")
}

var page = `
<!DOCTYPE html>
<html>
	<head>
		<link href="https://cdnjs.cloudflare.com/ajax/libs/graphiql/0.11.11/graphiql.min.css" rel="stylesheet" />
		<script src="https://cdnjs.cloudflare.com/ajax/libs/es6-promise/4.1.1/es6-promise.auto.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/fetch/2.0.3/fetch.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/react/16.2.0/umd/react.production.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.2.0/umd/react-dom.production.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/graphiql/0.11.11/graphiql.min.js"></script>
	</head>
	<body style="width: 100%; height: 100%; margin: 0; overflow: hidden;">
		<div id="graphiql" style="height: 100vh;">Loading...</div>
		<script>
			function graphQLFetcher(graphQLParams) {
				return fetch({{.}}, {
					method: "post",
					body: JSON.stringify(graphQLParams),
					credentials: "include",
				}).then(function (response) {
					return response.text();
				}).then(function (responseBody) {
					try {
						return JSON.parse(responseBody);
					} catch (error) {
						return responseBody;
					}
				});
			}
			ReactDOM.render(
				React.createElement(GraphiQL, {fetcher: graphQLFetcher}),
				document.getElementById("graphiql")
			);
		</script>
	</body>
</html>
`

package gql

import (
	"bytes"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	graphql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"github.com/stretchr/testify/assert"
)

func createSchema() (*graphql.Schema, error) {
	// 配置项
	opts := []graphql.SchemaOpt{graphql.UseFieldResolvers()}

	// 创建 Schema
	s, err := graphql.ParseSchema(KGSchema, &KGInfoQuery{}, opts...)
	return s, err
}

func query(q string) string {
	/** curl
	curl --request POST \
	--url http://127.0.0.1:1323/gql2/test/ \
	--header 'content-type: application/json' \
	--data '{"query":"{\n  hello\n}\n"}'
	*/

	// 创建 handler
	s, _ := createSchema()
	gqlhandler := relay.Handler{Schema: s}

	// 测试 handler
	ts := httptest.NewServer(&gqlhandler)
	defer ts.Close()

	res, err := http.Post(ts.URL, "application/json", bytes.NewReader([]byte(q)))
	if err != nil {
		log.Fatal(err)
	}
	greeting, err := ioutil.ReadAll(res.Body)
	res.Body.Close()
	if err != nil {
		log.Fatal(err)
	}

	return string(greeting)
}

func TestGQLSchema(t *testing.T) {
	_, err := createSchema()
	if err != nil {
		t.Error(err)
	}
}

func TestHello(t *testing.T) {
	q := `{"query":"{\n  hello\n}\n"}`
	res := query(q)
	t.Log(string(res))
}

func TestKGList(t *testing.T) {
	/*
		curl --request POST \
		  --url http://127.0.0.1:1323/gql2/test/ \
		  --header 'content-type: application/json' \
		  --data '{"query":"{\n  kglist {\n    name\n    id\n  }\n}"}'
	*/
	q := `{"query":"{\n  kglist {\n    name\n    id\n  }\n}"}`
	res := query(q)
	t.Log(string(res))
	assert.JSONEqf(t, `{"data":{"kglist":[{"name":"Ownthinkdb","id":"001"}]}}`, string(res), "KGListError")
}

package leo

import (
	"bytes"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/mattn/go-sqlite3"
	"github.com/stretchr/testify/assert"
	"golang.org/x/text/message"
)

type TestError struct {
	info Info
}

func (e TestError) Set(c *gin.Context) {
	c.Set("Error", e.info)
}

func (e TestError) Error() {
	fmt.Println("Test Error")
}

func TestExpAndInfomerHandler(t *testing.T) {
	resp := httptest.NewRecorder()
	gin.SetMode(gin.TestMode)
	c, r := gin.CreateTestContext(resp)

	r.Use(ErrHandler(), Informer())

	r.GET("/exp", func(c *gin.Context) {
		_, found := c.Get("profile")
		if !found {
			NewException(c, Info{}, errors.New("key not found"))
			return
		}
		NewResponse(c, Info{})
	})
	r.GET("/exp2", func(c *gin.Context) {
		_, found := c.Get("profile")
		if !found {
			var err = TestError{}
			ThrowError(&err, c)
			return
		}
		NewResponse(c, Info{})
	})
	r.GET("/info", func(c *gin.Context) {
		NewResponse(c, Info{})
	})
	r.GET("/panic", func(c *gin.Context) {
		panic(TestError{})
	})

	c.Request, _ = http.NewRequest(http.MethodGet, "/info", nil)
	r.ServeHTTP(resp, c.Request)

	c.Request, _ = http.NewRequest(http.MethodGet, "/exp", nil)
	r.ServeHTTP(resp, c.Request)

	c.Request, _ = http.NewRequest(http.MethodGet, "/exp2", nil)
	r.ServeHTTP(resp, c.Request)

	c.Request, _ = http.NewRequest(http.MethodGet, "/panic", nil)
	r.ServeHTTP(resp, c.Request)

}

func TestI18n(t *testing.T) {
	//var p = leo.getFormater()
	var p = Formater("zh")
	if reflect.TypeOf(p) != reflect.TypeOf(&message.Printer{}) {
		t.Fatal()
	}
}

// func TestMysqlFind(t *testing.T) {
// 	type CittCopy struct {
// 		IP1    string
// 		IP2    string
// 		Infor1 string
// 		Infor2 string
// 	}
// 	// 这里需要本地配置
// 	orm, err0 := NewORM("mysql", "root:fa@123@/lae?charset=utf8")
// 	assert.Equal(t, err0, nil)

// 	orm.Engine.SetMapper(core.SameMapper{})
// 	rows := make([]*CittCopy, 0)

// 	err := orm.Find(&rows)
// 	assert.Equal(t, err, nil)

// 	for _, row := range rows {
// 		fmt.Println(row.IP1, row.IP2, row.Infor1, row.Infor2)
// 	}
// }

func getTime(t time.Time) string {
	return fmt.Sprintf("%d-%02d-%02d %02d:%02d:%02d", t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second())
}

func TestSqliteORM(t *testing.T) {

	type User struct {
		ID   string `json:"id"`
		Name string `json:"name"`
		Time string `json:"log_time"`
	}

	var (
		id   = "0"
		user = "test"
	)
	orm, err := NewORM("sqlite3", "./user.db")
	assert.Equal(t, err, nil)

	err = orm.CreateTables(&User{})
	assert.Equal(t, err, nil)

	err2 := orm.Insert(&User{id, user, getTime(time.Now())})
	assert.Equal(t, err2, nil)

	err3 := orm.Delete(&User{id, user, ""})
	assert.Equal(t, err3, nil)

	err4 := orm.Update(&User{id, user + "update", ""})
	assert.Equal(t, err4, nil)

	orm.Engine.Close()

	e := os.Remove("./user.db")

	fmt.Println(e)
}

var Routers = []Router{
	NewRouter("get", "/", func(context *gin.Context) {
		var res = Info{Detail: LEO{"Msg": "Hello leo!"}}
		//panic(errors.New("aaaa"))
		NewResponse(context, res)
	}),
}

var GroupRouters = map[string][]Router{
	"v1": {
		NewRouter("get", "/g", func(context *gin.Context) {
			var res = Info{Detail: LEO{"Msg": "v1, Hello leo!"}}
			//panic(errors.New("aaaa"))
			NewResponse(context, res)
		}),
	},
	"v2": {
		NewRouter("get", "/g", func(context *gin.Context) {
			var res = Info{Detail: LEO{"Msg": "v2, Hello leo!"}}
			//panic(errors.New("aaaa"))
			NewResponse(context, res)
		}),
	},
}

func TestService(t *testing.T) {
	var conf = ServiceConfig{
		IPAddr: ":8088",
		Debug:  false,
	}
	var service = NewService(conf)

	if gin.Mode() != gin.ReleaseMode {
		t.Error("Mode error, should be release")
	}

	service.RegisterMidwares(Informer())
	service.RegisterRouters(Routers)

	service.RegisterRouterGroups(GroupRouters)

	service.RegisterStaticFS("/files", "./gql_assets")

}

func TestYaml(t *testing.T) {
	type Test struct {
		Name string `yaml:"name"`
		Age  string `yaml:"age"`
	}

	var value = Test{
		Name: "test",
		Age:  "007",
	}
	var filename = "./test.yaml"
	err := WriteYamlConfig(value, filename)
	if err != nil {
		t.Fail()
	}

	var newValue = Test{}
	err = ReadYamlConfig(&newValue, filename)
	if err != nil {
		t.Fail()
	}
	if newValue.Name != value.Name {
		t.Fatal("not equal")
	}
	os.Remove(filename)
}

func TestCORSMiddleware(t *testing.T) {
	resp := httptest.NewRecorder()
	c, r := gin.CreateTestContext(resp)

	r.Use(CORSMiddleware())

	r.GET("/cross", func(c *gin.Context) {
		NewResponse(c, Info{})
	})

	c.Request, _ = http.NewRequest(http.MethodGet, "/cross", nil)
	r.ServeHTTP(resp, c.Request)
	c.Request, _ = http.NewRequest(http.MethodOptions, "/cross", nil)
	r.ServeHTTP(resp, c.Request)
}

// -------------------------------------
// GQL 测试
// -------------------------------------
func TestGQLHandler(t *testing.T) {
	resp := httptest.NewRecorder()

	c, r := gin.CreateTestContext(resp)

	r.POST("/test", HelloGqlHandler)

	q := `{"query":"{\n  hello\n}\n"}`
	c.Request, _ = http.NewRequest(http.MethodPost, "/test", bytes.NewReader([]byte(q)))
	r.ServeHTTP(resp, c.Request)
	greeting, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatal(err)
	}

	t.Log(string(greeting))
	assert.JSONEqf(t, `{"data":{"hello":"Hello, world!"}}`, string(greeting), "GQLError")
}

var ts = `
type Query {
	greeting(w: String!): String!
}
`

type tq struct{}

func (q *tq) Greeting(arg struct{ W string }) string {
	return fmt.Sprintf("Hello, %s!", arg.W)
}

func TestNewGQLHandler(t *testing.T) {

	resp := httptest.NewRecorder()

	c, r := gin.CreateTestContext(resp)

	handler := NewGraphqlHandler(ts, &tq{})
	r.POST("/test", handler)

	var testW = "World"
	q := fmt.Sprintf(`{"query":"{\n  greeting(w: \"%s\")\n}"}`, testW)
	c.Request, _ = http.NewRequest(http.MethodPost, "/test", bytes.NewReader([]byte(q)))
	r.ServeHTTP(resp, c.Request)
	greeting, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatal(err)
	}

	t.Log(string(greeting))
	assert.JSONEqf(t, fmt.Sprintf(`{"data":{"greeting":"Hello, %s!"}}`, testW), string(greeting), "GQLError")
}

func TestIQLHandler(t *testing.T) {
	// 测试用的引擎和客户端
	resp := httptest.NewRecorder()
	c, r := gin.CreateTestContext(resp)

	var conf = ServiceConfig{
		IPAddr: ":8088",
		Debug:  false,
	}

	// 注册静态文件
	var testService = NewServiceWithEngine(conf, r)
	RegisterIQLAssets(testService)

	r.GET("/test", GraphiqlHandler)

	c.Request, _ = http.NewRequest(http.MethodGet, "/test", nil)
	r.ServeHTTP(resp, c.Request)
	assert.Equal(t, resp.Code, http.StatusOK)
}

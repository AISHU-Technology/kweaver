package test

import (
	"bytes"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
	"io"
	"kw-studio/initialize"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"regexp"
	"sync"
	"time"
)

func InitTestDB(db *sql.DB, l logger.Interface) *gorm.DB {
	if l == nil {
		l = logger.New(
			log.New(os.Stdout, "", log.LstdFlags),
			logger.Config{
				SlowThreshold:             time.Second,
				LogLevel:                  logger.Info,
				IgnoreRecordNotFoundError: true,
				Colorful:                  true,
			},
		)
	}
	var err error
	DBENGINE, err := gorm.Open(mysql.New(mysql.Config{
		SkipInitializeWithVersion: true,
		Conn:                      db,
	}), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
		Logger:                 l,
		SkipDefaultTransaction: true,
	})

	if err != nil {
		panic(err)
	} else {
		sqlDB, _ := DBENGINE.DB()
		sqlDB.SetConnMaxLifetime(time.Hour)
		sqlDB.SetMaxIdleConns(5)
		sqlDB.SetMaxOpenConns(100)
	}
	return DBENGINE
}

type Count struct {
	count int
}

type Select struct {
	po interface{}
}

const (
	insert = iota
	delete
	update
)

type Exec struct {
	id           int64
	rowsAffected int64
	action       int
}

const (
	begin = iota
	commit
	rollback
)

type Tx struct {
	action int
}

type wrapParam struct {
	param     interface{}
	statement *gorm.Statement
}

type ParamPredefineHandler interface {
	IsSupport(param interface{}) bool
	Handle(param *wrapParam, mock sqlmock.Sqlmock)
}

type ExecHandler struct{}

func (e *ExecHandler) IsSupport(param interface{}) bool {
	if _, ok := param.(Exec); ok {
		return true
	}
	return false
}

func (e *ExecHandler) Handle(param *wrapParam, mock sqlmock.Sqlmock) {
	result := sqlmock.NewResult(param.param.(Exec).id, param.param.(Exec).rowsAffected)
	switch param.param.(Exec).action {
	case insert:
		mock.ExpectExec("INSERT").WillReturnResult(result)
	case delete:
		mock.ExpectExec("DELETE").WillReturnResult(result)
	case update:
		mock.ExpectExec("UPDATE").WillReturnResult(result)
	default:
		log.Panicf("Unsupported parameter: %v", param.param)
	}
}

type CountSelectHandler struct{}

func (c *CountSelectHandler) IsSupport(param interface{}) bool {
	if _, ok := param.(Count); ok {
		return true
	}
	return false
}

func (c *CountSelectHandler) Handle(param *wrapParam, mock sqlmock.Sqlmock) {
	mock.ExpectQuery("SELECT").WillReturnRows(mock.NewRows([]string{"count(*)"}).AddRow(param.param.(Count).count))
}

type PoSelectHandler struct{}

func (p *PoSelectHandler) IsSupport(param interface{}) bool {
	return true
}

func (p *PoSelectHandler) Handle(param *wrapParam, mock sqlmock.Sqlmock) {
	var selects []string
	var valuesList [][]driver.Value
	rv := reflect.ValueOf(param.param)
	hasMultiValue := false
	if rv.Kind() == reflect.Slice || rv.Kind() == reflect.Array {
		valuesList = make([][]driver.Value, rv.Len())
		hasMultiValue = true
	} else if rv.Kind() == reflect.Struct {
		valuesList = make([][]driver.Value, 1)
	} else {
		log.Panicf("Unsupported parameter type: %v", rv.Kind())
	}
	if param.statement.Selects != nil {
		selects = param.statement.Selects
		v := rv
		for i := 0; i < len(valuesList); i++ {
			if hasMultiValue {
				v = rv.Index(i)
			}
			values := make([]driver.Value, len(selects))
			for j, s := range selects {
				values[j] = v.FieldByName(getNameByDbFieldName(s, param.statement)).Interface()
			}
			valuesList[i] = values
		}
	} else {
		selects = make([]string, len(param.statement.Schema.Fields))
		for i, field := range param.statement.Schema.Fields {
			selects[i] = field.DBName
			v := rv
			for j := range valuesList {
				if hasMultiValue {
					v = rv.Index(j)
				}
				if valuesList[j] == nil {
					valuesList[j] = make([]driver.Value, 0)
				}
				if value := v.FieldByName(field.Name).Interface(); value != nil {
					valuesList[j] = append(valuesList[j], value)
				} else {
					log.Panicf("Could not find the corresponding object field name: %s", field.DBName)
				}
			}
		}
	}
	rows := mock.NewRows(selects)
	for _, values := range valuesList {
		rows.AddRow(values...)
	}
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
}

type SelectHandler struct {
	handlerChain ParamPredefineHandlerChain
}

func (s *SelectHandler) IsSupport(param interface{}) bool {
	return isSelectAction(param)
}

func (s *SelectHandler) Handle(param *wrapParam, mock sqlmock.Sqlmock) {
	param.param = param.param.(Select).po
	s.handlerChain.DoChainHandle(param, mock)
}

func getNameByDbFieldName(dbFieldName string, statement *gorm.Statement) string {
	for _, field := range statement.Schema.Fields {
		if match, _ := regexp.MatchString(fmt.Sprintf("^(.+\\.)?`?%s`?$", field.DBName), dbFieldName); match {
			return field.Name
		}
	}
	log.Panicf("Could not find the corresponding object field name: %s", dbFieldName)
	return ""
}

type TransactionHandler struct{}

func (t *TransactionHandler) IsSupport(param interface{}) bool {
	if _, ok := param.(Tx); ok {
		return true
	}
	return false
}

func (t *TransactionHandler) Handle(param *wrapParam, mock sqlmock.Sqlmock) {
	switch param.param.(Tx).action {
	case begin:
		mock.ExpectBegin()
	case commit:
		mock.ExpectCommit()
	case rollback:
		mock.ExpectRollback()
	}
}

type ParamPredefineHandlerChain []ParamPredefineHandler

func (chain ParamPredefineHandlerChain) DoChainHandle(param *wrapParam, mock sqlmock.Sqlmock) bool {
	for _, handler := range chain {
		if handler.IsSupport(param.param) {
			handler.Handle(param, mock)
			return true
		}
	}
	return false
}

var DefaultHandlerChain ParamPredefineHandlerChain = []ParamPredefineHandler{
	&ExecHandler{},
	&TransactionHandler{},
	&SelectHandler{handlerChain: []ParamPredefineHandler{
		&CountSelectHandler{},
		&PoSelectHandler{},
	}},
}

func isSelectAction(param interface{}) bool {
	if _, ok := param.(Select); ok {
		return true
	}
	return false
}

func group(params []interface{}) [][]interface{} {
	groups := make([][]interface{}, 0)
	queryActionIdxs := make([]int, 0)
	for i := 0; i < len(params); i++ {
		if isSelectAction(params[i]) {
			queryActionIdxs = append(queryActionIdxs, i)
		}
	}
	if len(queryActionIdxs) > 0 {
		for i := 1; i < len(queryActionIdxs); i++ {
			groups = append(groups, params[queryActionIdxs[i-1]:queryActionIdxs[i]])
		}
		groups = append(groups, params[queryActionIdxs[len(queryActionIdxs)-1]:])
	}
	return groups
}

func handleHeadNonQueryAction(params []interface{}, mock sqlmock.Sqlmock) []interface{} {
	for i := 0; i < len(params); i++ {
		if isSelectAction(params[i]) {
			return params[i:]
		}
		DefaultHandlerChain.DoChainHandle(&wrapParam{param: params[i]}, mock)
	}
	return nil
}

type DBMockCreator struct {
	params []interface{}
	logger logger.Interface
}

func NewDBMockCreator() *DBMockCreator {
	return &DBMockCreator{params: make([]interface{}, 0)}
}

func (creator *DBMockCreator) Insert(ID, RowsAffected int64) *DBMockCreator {
	creator.params = append(creator.params, Exec{ID, RowsAffected, insert})
	return creator
}

func (creator *DBMockCreator) Delete(ID, RowsAffected int64) *DBMockCreator {
	creator.params = append(creator.params, Exec{ID, RowsAffected, delete})
	return creator
}

func (creator *DBMockCreator) Update(ID, RowsAffected int64) *DBMockCreator {
	creator.params = append(creator.params, Exec{ID, RowsAffected, update})
	return creator
}

func (creator *DBMockCreator) Count(count int) *DBMockCreator {
	creator.params = append(creator.params, Select{po: Count{count: count}})
	return creator
}

func (creator *DBMockCreator) Select(pos ...interface{}) *DBMockCreator {
	for _, po := range pos {
		creator.params = append(creator.params, Select{po: po})
	}
	return creator
}

func (creator *DBMockCreator) Tx(createTx func(txCreator *DBMockCreator) (commit bool)) *DBMockCreator {
	creator.params = append(creator.params, Tx{begin})
	if createTx(creator) {
		creator.params = append(creator.params, Tx{commit})
	} else {
		creator.params = append(creator.params, Tx{rollback})
	}
	return creator
}

func (creator *DBMockCreator) Logger(logger logger.Interface) *DBMockCreator {
	creator.logger = logger
	return creator
}

func (creator *DBMockCreator) Create() *gorm.DB {
	params := creator.params
	if len(params) <= 0 {
		panic("No arguments pending")
	}
	db, mo, _ := sqlmock.New()
	g := InitTestDB(db, creator.logger)
	if params = handleHeadNonQueryAction(params, mo); params != nil {
		groups := group(params)
		var index int
		g.Callback().Query().Before("*").Register("QueryParamPredefine", func(db *gorm.DB) {
			for _, action := range groups[index] {
				DefaultHandlerChain.DoChainHandle(&wrapParam{param: action, statement: db.Statement}, mo)
			}
			index++
		})
	}
	return g
}

var (
	once   = &sync.Once{}
	router *gin.Engine
)

// DoRequest 初始化请求并且发送请求，返回响应结果
func DoRequest(method, url string, data interface{}, headers ...map[string]string) *httptest.ResponseRecorder {
	once.Do(func() {
		router = initialize.Router()
	})
	w := httptest.NewRecorder()
	var reader io.Reader
	if data != nil {
		body, _ := json.Marshal(data)
		reader = bytes.NewReader(body)
		if len(headers) > 0 {
			headers[0]["Content-Type"] = "application/json"
		} else {
			headers = append(headers, map[string]string{"Content-Type": "application/json"})
		}
	}
	req, _ := http.NewRequest(method, url, reader)
	for _, header := range headers {
		for k, v := range header {
			req.Header.Set(k, v)
		}
	}
	router.ServeHTTP(w, req)
	fmt.Println(w.Body.String())
	return w
}

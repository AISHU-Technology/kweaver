package test

import (
	"encoding/base64"
	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"
	"kw-studio/global"
	"kw-studio/model/po"
	"kw-studio/model/vo"
	"kw-studio/service"
	"kw-studio/test/mock"
	"kw-studio/utils/constant"
	"net/http"
	"testing"
	"time"
)

func TestGetGraphDBList(t *testing.T) {
	global.DB = NewDBMockCreator().Logger(Logger).Count(1).Select(po.GraphDB{ID: 1, Type: constant.OrientDB, Name: "graph_db_01", Created: time.Now(), Updated: time.Now()}).
		Count(1).Select(po.FulltextEngine{ID: 1, Name: "opensearch_1"}).Create()
	r := DoRequest(http.MethodGet, "/api/studio/v1/graphdb/list?page=1&size=10&orderField=updated&order=ASC&type=orientdb&name=graph_", nil)
	assert.Equal(t, http.StatusOK, r.Code)

	global.DB = NewDBMockCreator().Logger(Logger).Count(1).Select(po.GraphDB{ID: 1, Type: constant.OrientDB, Name: "graph_db_01", Created: time.Now(), Updated: time.Now()}).
		Count(2).Select(po.FulltextEngine{ID: 1, Name: "opensearch_1"}).Create()
	r = DoRequest(http.MethodGet, "/api/studio/v1/graphdb/list?page=1&size=10&orderField=updated&order=ASC&type=orientdb", nil)
	assert.Equal(t, http.StatusOK, r.Code)

	global.DB = NewDBMockCreator().Logger(Logger).Count(1).Select(po.GraphDB{ID: 1, Type: constant.OrientDB, Name: "graph_db_01", Created: time.Now(), Updated: time.Now()}).
		Count(2).Select(po.FulltextEngine{ID: 1, Name: "opensearch_1"}).Create()
	r = DoRequest(http.MethodGet, "/api/studio/v1/graphdb/list?page=1&size=-1&orderField=updated&order=ASC&type=orientdb", nil)
	assert.Equal(t, http.StatusOK, r.Code)
}

func TestGetGraphInfoByGraphDBId(t *testing.T) {
	global.DB = NewDBMockCreator().Logger(Logger).Select(po.GraphConfigTable{ID: 1, GraphName: "graph_01", CreateTime: "2022-03-25 13:34:28"}).Count(1).Create()
	r := DoRequest(http.MethodGet, "/api/studio/v1/graphdb/graph/list?page=2&size=10&id=1", nil)
	assert.Equal(t, http.StatusOK, r.Code)
}

func TestGetGraphDBInfoById(t *testing.T) {
	global.DB = NewDBMockCreator().Logger(Logger).Select(po.GraphDB{ID: 1, Name: "graph_db_01", Type: constant.OrientDB, Ip: "10.4.56.45;10.43.234.234", Port: "13344;3223", User: "root", Password: base64.StdEncoding.EncodeToString([]byte("1233445"))}).Create()
	r := DoRequest(http.MethodGet, "/api/studio/v1/graphdb?id=1", nil)
	assert.Equal(t, http.StatusOK, r.Code)
}

func TestAddGraphDB(t *testing.T) {
	var nebulaTestHandler = service.ConnTestHandlers[constant.Nebula]
	service.ConnTestHandlers[constant.Nebula] = func(config *vo.ConnTestVo) {}
	global.DB = NewDBMockCreator().Logger(Logger).Count(0).Count(0).Count(1).Insert(1, 1).Create()

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	lockMock := mock.NewMockLockOperator(ctrl)
	lockMock.EXPECT().TryLock(gomock.Any(), gomock.Any(), gomock.Any()).Return(true)
	lockMock.EXPECT().TryLock(gomock.Any(), gomock.Any(), gomock.Any()).Return(true)
	lockMock.EXPECT().Unlock(gomock.Any()).Return(true)
	lockMock.EXPECT().Unlock(gomock.Any()).Return(true)
	global.LockOperator = lockMock

	r := DoRequest(http.MethodPost, "/api/studio/v1/graphdb/add", &vo.GraphDBVo{Name: "`9348里分解hiifeh&---*(*(*()><》$", OsId: 1, Type: constant.Nebula, User: "root", Password: "nebula", Ip: []string{"10.4.32.45", "10.4.32.45", "10.4.32.45"}, Port: []string{"2232", "3223", "2232"}})
	assert.Equal(t, http.StatusOK, r.Code)
	service.ConnTestHandlers[constant.Nebula] = nebulaTestHandler
}

func TestDeleteGraphDBById(t *testing.T) {
	global.DB = NewDBMockCreator().Logger(Logger).Count(1).Delete(1, 1).Create()
	r := DoRequest(http.MethodPost, "/api/studio/v1/graphdb/delete", &vo.IdVo{ID: 3})
	assert.Equal(t, http.StatusOK, r.Code)

	//global.DB = NewDBMockCreator().Count(1).Delete(1, 1).Create()
	//r = DoRequest(http.MethodPost, "/api/studio/v1/graphdb/delete", &vo.IdVo{ID: 1})
	//assert.Equal(t, http.StatusBadRequest, r.Code)
}

func TestUpdateGraphDB(t *testing.T) {
	//case 1
	var nebulaTestHandler = service.ConnTestHandlers[constant.Nebula]
	service.ConnTestHandlers[constant.Nebula] = func(config *vo.ConnTestVo) {}
	global.DB = NewDBMockCreator().Logger(Logger).Count(1).Count(0).Count(0).Update(1, 1).Create()

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	lockMock := mock.NewMockLockOperator(ctrl)
	lockMock.EXPECT().TryLock(gomock.Any(), gomock.Any(), gomock.Any()).Return(true)
	lockMock.EXPECT().Unlock(gomock.Any()).Return(true)
	global.LockOperator = lockMock

	r := DoRequest(http.MethodPost, "/api/studio/v1/graphdb/update", &vo.GraphDBUpdateVo{ID: 2, Name: "哈哈哈", Type: constant.Nebula, User: "root", Password: "123322", Ip: []string{"10.4.32.45", "aaa.si.com"}, Port: []string{"2232", "3223"}, OsId: 1})
	assert.Equal(t, http.StatusOK, r.Code)

	////case 2
	//global.DB = NewDBMockCreator().Count(1).Count(0).Count(0).Update(1, 1).Create()
	//r = DoRequest(http.MethodPost, "/api/studio/v1/graphdb/update", &vo.GraphDBUpdateVo{ID: 1, Name: "afhief", Type: constant.Nebula, User: "root", Password: "123322", Ip: []string{"10.4.32.45", "aaa.si.com"}, Port: []string{"2232", "3223"}})
	//assert.Equal(t, http.StatusBadRequest, r.Code)

	service.ConnTestHandlers[constant.Nebula] = nebulaTestHandler
}

func TestTestGraphDBConfig(t *testing.T) {
	//services.ConnTestHandlers[constant.OrientDB] = func(config *vo.ConnTestVo) {}
	r := DoRequest(http.MethodPost, "/api/studio/v1/graphdb/test", &vo.ConnTestVo{Type: constant.OrientDB, User: "root", Password: "nebulad", Ip: []string{"10.4.68.144"}, Port: []string{"9669"}})
	t.Log(r)
	assert.Equal(t, http.StatusInternalServerError, r.Code)

	r = DoRequest(http.MethodPost, "/api/studio/v1/graphdb/test", &vo.ConnTestVo{Type: constant.Nebula, User: "root", Password: "nebulad", Ip: []string{"10.4.68.144"}, Port: []string{"9669"}})
	t.Log(r)
	assert.Equal(t, http.StatusInternalServerError, r.Code)

	r = DoRequest(http.MethodPost, "/api/studio/v1/graphdb/test", &vo.ConnTestVo{Type: constant.OpenSearch, User: "root", Password: "nebulad", Ip: []string{"10.4.68.144"}, Port: []string{"9669"}})
	t.Log(r)
	assert.Equal(t, http.StatusBadRequest, r.Code)
}

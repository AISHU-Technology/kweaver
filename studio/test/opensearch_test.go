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

func TestGetOpenSearchList(t *testing.T) {
	global.DB = NewDBMockCreator().Logger(Logger).Count(1).Select(po.FulltextEngine{ID: 1, Name: "graph_db_01", User: "aaa", Created: time.Now(), Updated: time.Now()}).Create()
	r := DoRequest(http.MethodGet, "/api/studio/v1/opensearch/list?page=2&size=1&orderField=updated&order=ASC&name=graph_", nil)
	assert.Equal(t, http.StatusOK, r.Code)
}

func TestGetOpenSearchInfoById(t *testing.T) {
	global.DB = NewDBMockCreator().Logger(Logger).Select(po.FulltextEngine{ID: 1, Name: "graph_db_01", Ip: "10.4.56.45;10.43.234.234", Port: "13344;3223", User: "root", Password: base64.StdEncoding.EncodeToString([]byte("1233445"))}).Create()
	r := DoRequest(http.MethodGet, "/api/studio/v1/opensearch?id=1", nil)
	assert.Equal(t, http.StatusOK, r.Code)
}

func TestAddOpenSearch(t *testing.T) {
	var openSearchTestHandler = service.ConnTestHandlers[constant.OpenSearch]
	service.ConnTestHandlers[constant.OpenSearch] = func(config *vo.ConnTestVo) {}
	global.DB = NewDBMockCreator().Logger(Logger).Count(0).Count(0).Insert(1, 1).Create()

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	lockMock := mock.NewMockLockOperator(ctrl)
	lockMock.EXPECT().TryLock(gomock.Any(), gomock.Any(), gomock.Any()).Return(true)
	lockMock.EXPECT().Unlock(gomock.Any()).Return(true)
	global.LockOperator = lockMock

	r := DoRequest(http.MethodPost, "/api/studio/v1/opensearch/add", &vo.OpenSearchVo{Name: "`HHHhhhhhhh哈哈哈哈哈哈哈哈哈哈哈哈哈", User: "admin", Password: "admin", Ip: []string{"10.4.68.221"}, Port: []string{"9200"}})
	assert.Equal(t, http.StatusOK, r.Code)
	service.ConnTestHandlers[constant.OpenSearch] = openSearchTestHandler
}

func TestDeleteOpenSearchById(t *testing.T) {
	//case 1
	global.DB = NewDBMockCreator().Logger(Logger).Count(1).Count(0).Delete(1, 1).Create()
	ctrl := gomock.NewController(t)

	defer ctrl.Finish()
	lockMock := mock.NewMockLockOperator(ctrl)
	lockMock.EXPECT().TryLock(gomock.Any(), gomock.Any(), gomock.Any()).Return(true)
	lockMock.EXPECT().Unlock(gomock.Any()).Return(true)
	global.LockOperator = lockMock

	r := DoRequest(http.MethodPost, "/api/studio/v1/opensearch/delete", &vo.OpenSearchIdVo{ID: 3})
	assert.Equal(t, http.StatusOK, r.Code)

	//case 2
	//global.DB = NewDBMockCreator().Logger(Logger).Count(1).Count(0).Delete(1, 1).Create()
	//r = DoRequest(http.MethodPost, "/api/studio/v1/opensearch/delete", &vo.OpenSearchIdVo{ID: 1})
	//assert.Equal(t, http.StatusBadRequest, r.Code)
}

func TestUpdateOpenSearch(t *testing.T) {
	//case 1
	var openSearchTestHandler = service.ConnTestHandlers[constant.OpenSearch]
	service.ConnTestHandlers[constant.OpenSearch] = func(config *vo.ConnTestVo) {}
	global.DB = NewDBMockCreator().Logger(Logger).Count(1).Count(0).Count(0).Update(1, 1).Create()

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	lockMock := mock.NewMockLockOperator(ctrl)
	lockMock.EXPECT().TryLock(gomock.Any(), gomock.Any(), gomock.Any()).Return(true)
	lockMock.EXPECT().Unlock(gomock.Any()).Return(true)
	global.LockOperator = lockMock

	r := DoRequest(http.MethodPost, "/api/studio/v1/opensearch/update", &vo.OpenSearchUpdateVo{ID: 2, Name: "HHHhhhhhhh哈哈哈哈哈哈哈哈哈哈哈哈哈", User: "root", Password: "123322", Ip: []string{"10.4.32.45", "aaa.si.com"}, Port: []string{"2232", "3223"}})
	assert.Equal(t, http.StatusOK, r.Code)

	//case 2
	//global.DB = NewDBMockCreator().Logger(Logger).Count(1).Count(0).Count(0).Update(1, 1).Create()
	//r = DoRequest(http.MethodPost, "/api/studio/v1/opensearch/update", &vo.OpenSearchUpdateVo{ID: 1, Name: "HHHhhhhhhh哈哈哈哈哈哈哈哈哈哈哈哈哈", User: "root", Password: "123322", Ip: []string{"10.4.32.45", "aaa.si.com"}, Port: []string{"2232", "3223"}})
	//assert.Equal(t, http.StatusBadRequest, r.Code)
	service.ConnTestHandlers[constant.OpenSearch] = openSearchTestHandler
}

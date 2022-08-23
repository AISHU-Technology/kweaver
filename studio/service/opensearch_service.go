package service

import (
	"encoding/base64"
	"fmt"
	"github.com/kgip/redis-lock/lock"
	"kw-studio/global"
	"kw-studio/kw_errors"
	"kw-studio/model/po"
	"kw-studio/model/vo"
	"strings"
	"time"
)

type OpenSearchService struct{}

func (*OpenSearchService) GetOpenSearchList(condition *vo.OsSearchCondition) *vo.ListVo {
	opensearchList := make([]*po.FulltextEngine, 0)
	session := global.DB.Model(po.FulltextEngineModel)
	//countSession := global.DB.Model(po.FulltextEngineModel)
	if condition.Name != "" {
		session.Where("name like ?", "%"+condition.Name+"%")
	}
	list := &vo.ListVo{}
	kw_errors.Try(session.Count(&list.Total).Error).Throw(kw_errors.InternalServerError)
	if condition.Order != "no" {
		session.Order(fmt.Sprintf("%s %s", condition.OrderField, condition.Order))
	}
	if condition.Size != 0 {
		kw_errors.Try(session.Offset((condition.Page - 1) * condition.Size).Limit(condition.Size).Find(&opensearchList).Error).Throw(kw_errors.InternalServerError)
	}
	var opensearchVos = make([]*vo.OpenSearchItemVo, len(opensearchList))
	for i, engine := range opensearchList {
		opensearchVos[i] = &vo.OpenSearchItemVo{ID: engine.ID, Name: engine.Name, User: engine.User, Updated: engine.Updated.Unix(), Created: engine.Created.Unix()}
	}
	list.Data = opensearchVos
	return list
}

func (*OpenSearchService) GetOpenSearchInfoById(id int) *vo.OpenSearchVo {
	opensearch := &po.FulltextEngine{}
	kw_errors.Try(global.DB.Model(po.FulltextEngineModel).Where("id = ?", id).Find(opensearch).Error).Throw(kw_errors.InternalServerError)
	if opensearch.ID <= 0 {
		panic(kw_errors.OsRecordNotFoundError)
	}
	bytes, err := base64.StdEncoding.DecodeString(opensearch.Password)
	kw_errors.Try(err).Throw(kw_errors.InternalServerError)
	return &vo.OpenSearchVo{ID: opensearch.ID, Name: opensearch.Name, Ip: strings.Split(opensearch.Ip, IpPortSplitChar),
		Port: strings.Split(opensearch.Port, IpPortSplitChar), User: opensearch.User, Password: string(bytes)}
}

func (*OpenSearchService) GetOpenSearchNameById(id int) (name string) {
	kw_errors.Try(global.DB.Model(po.FulltextEngineModel).Select("name").Where("id = ?", id).Find(&name).Error).Throw(kw_errors.InternalServerError)
	return name
}

func (*OpenSearchService) AddOpenSearch(vo *vo.OpenSearchVo) (id int) {
	//查询是否有同名存储配置
	var count int64
	if kw_errors.Try(global.DB.Model(po.FulltextEngineModel).Where("name = ?", vo.Name).Count(&count).Error).Throw(kw_errors.InternalServerError); count > 0 {
		panic(kw_errors.DuplicateOsRecordNameError)
	}
	encodedPass := base64.StdEncoding.EncodeToString([]byte(vo.Password))
	if global.LockOperator.TryLock("update_os_lock", lock.Context(), 5*time.Second) {
		defer global.LockOperator.Unlock("update_os_lock")
		//查询是否有相同用户名，密码，ip和port的配置
		checkDuplicateConfig(po.FulltextEngineModel, 0, vo.User, encodedPass, vo.Ip, vo.Port)
		opensearch := &po.FulltextEngine{Name: vo.Name, Ip: strings.Join(vo.Ip, IpPortSplitChar), Port: strings.Join(vo.Port, IpPortSplitChar), User: vo.User, Password: encodedPass}
		kw_errors.Try(global.DB.Create(opensearch).Error).Throw(kw_errors.InternalServerError)
		if opensearch.ID <= 0 {
			panic(kw_errors.InternalServerError.SetDetailError("opensearch configuration creation failed"))
		}
		return opensearch.ID
	} else {
		panic(kw_errors.InternalServerError.SetDetailError("redis lock acquisition timeout"))
	}
	return
}

func (*OpenSearchService) DeleteOpenSearchById(id int) {
	var count int64
	if kw_errors.Try(global.DB.Model(po.FulltextEngineModel).Where("id = ?", id).Count(&count).Error).Throw(kw_errors.InternalServerError); count <= 0 {
		panic(kw_errors.OsRecordNotFoundError)
	}
	count = 0
	if global.LockOperator.TryLock("delete_os_lock", lock.Context(), 5*time.Second) {
		defer global.LockOperator.Unlock("delete_os_lock")
		if kw_errors.Try(global.DB.Model(po.GraphDBModel).Where("fulltext_id = ?", id).Count(&count).Error); count > 0 {
			panic(kw_errors.OsIsUsedError)
		}
		r := global.DB.Model(po.FulltextEngineModel).Delete("id", id)
		kw_errors.Try(r.Error).Throw(kw_errors.InternalServerError)
		if r.RowsAffected <= 0 {
			panic(kw_errors.InternalServerError.SetDetailError("opensearch configuration delete failed"))
		}
	} else {
		panic(kw_errors.InternalServerError.SetDetailError("redis lock acquisition timeout"))
	}
}

func (*OpenSearchService) UpdateOpenSearch(vo *vo.OpenSearchUpdateVo) {
	var count int64
	//查询待更新记录是否存在
	if kw_errors.Try(global.DB.Model(po.FulltextEngineModel).Where("id = ?", vo.ID).Count(&count).Error).Throw(kw_errors.InternalServerError); count <= 0 {
		panic(kw_errors.OsRecordNotFoundError)
	}
	encodedPass := base64.StdEncoding.EncodeToString([]byte(vo.Password))
	if global.LockOperator.TryLock("update_os_lock", lock.Context(), 5*time.Second) {
		defer global.LockOperator.Unlock("update_os_lock")
		//检查是否有同名记录
		if kw_errors.Try(global.DB.Model(po.FulltextEngineModel).Where("name = ? and id != ?", vo.Name, vo.ID).Count(&count).Error).Throw(kw_errors.InternalServerError); count > 0 {
			panic(kw_errors.DuplicateGraphDBRecordNameError)
		}
		//查询是否有相同用户名，密码，ip和port的配置
		checkDuplicateConfig(po.FulltextEngineModel, vo.ID, vo.User, encodedPass, vo.Ip, vo.Port)
		opensearch := &po.FulltextEngine{ID: vo.ID, Name: vo.Name, Ip: strings.Join(vo.Ip, IpPortSplitChar), Port: strings.Join(vo.Port, IpPortSplitChar), User: vo.User, Password: encodedPass}
		r := global.DB.Updates(opensearch)
		kw_errors.Try(r.Error).Throw(kw_errors.InternalServerError)
		if r.RowsAffected <= 0 {
			panic(kw_errors.InternalServerError.SetDetailError("opensearch configuration update failed"))
		}
	} else {
		panic(kw_errors.InternalServerError.SetDetailError("redis lock acquisition timeout"))
	}
}

package service

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"github.com/kgip/redis-lock/lock"
	"github.com/opensearch-project/opensearch-go"
	nebula "github.com/vesoft-inc/nebula-go/v3"
	"kw-studio/global"
	"kw-studio/kw_errors"
	"kw-studio/model/po"
	"kw-studio/model/vo"
	"kw-studio/utils"
	"kw-studio/utils/constant"
	"net/http"
	"strconv"
	"strings"
	"time"
)

/**
 * @Author: Xiangguang.li
 * @Date: 2022/8/20
 * @Email: Xiangguang.li@aishu.cn
 **/

const IpPortSplitChar = ";"

var (
	client = &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}
	ConnTestHandlers = map[string]func(config *vo.ConnTestVo){
		constant.OrientDB: func(config *vo.ConnTestVo) {
			for i, ip := range config.Ip {
				req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("http://%s:%s/server", ip, config.Port[i]), nil)
				kw_errors.Try(err).Throw(kw_errors.URLError)
				req.SetBasicAuth(config.User, config.Password)
				requestWithTimeout(func() (int, error) {
					resp, e := client.Do(req)
					if resp != nil {
						if resp.StatusCode == http.StatusUnauthorized {
							return http.StatusUnauthorized, e
						}
						buf := make([]byte, 64)
						resp.Body.Read(buf)
						defer resp.Body.Close()
						body := string(buf)
						global.LOG.Info(body)
						if strings.Contains(body, "connections") {
							return resp.StatusCode, e
						} else {
							return http.StatusNotFound, e
						}
					} else {
						return http.StatusNotFound, e
					}
				}, 5*time.Second)
			}
		},
		constant.Nebula: func(config *vo.ConnTestVo) {
			hostList := make([]nebula.HostAddress, len(config.Ip))
			for i, ip := range config.Ip {
				intPort, _ := strconv.ParseInt(config.Port[i], 10, 64)
				hostList[i] = nebula.HostAddress{Host: ip, Port: int(intPort)}
			}
			// Initialize connection pool
			var pool *nebula.ConnectionPool
			var err error
			requestWithTimeout(func() (int, error) {
				pool, err = nebula.NewConnectionPool(hostList, nebula.GetDefaultConf(), nebula.DefaultLogger{})
				return 0, err
			}, 5*time.Second)
			defer pool.Close()
			// Create session
			session, err := pool.GetSession(config.User, config.Password)
			// Release session and return connection back to connection pool
			defer func() {
				if session != nil {
					session.Release()
				}
			}()
			kw_errors.Try(err).Throw(kw_errors.GraphDBAccountError)
		},
		constant.OpenSearch: func(config *vo.ConnTestVo) {
			hostList := make([]string, len(config.Ip))
			for i, ip := range config.Ip {
				hostList[i] = fmt.Sprintf("http://%s:%s", ip, config.Port[i])
			}
			// Initialize the client with SSL/TLS enabled.
			cli, err := opensearch.NewClient(opensearch.Config{
				Transport: &http.Transport{
					TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
				},
				Addresses: hostList,
				Username:  config.User, // For testing only. Don't store credentials in code.
				Password:  config.Password,
			})
			kw_errors.Try(err).Throw(kw_errors.InternalServerError)
			requestWithTimeout(func() (int, error) {
				r, e := cli.Ping()
				if r != nil {
					return r.StatusCode, e
				} else {
					return http.StatusNotFound, e
				}
			}, 5*time.Second)
		},
	}
)

func requestWithTimeout(action func() (int, error), timeout time.Duration) {
	ch := make(chan *kw_errors.Error)
	//最多执行3s
	go func() {
		defer func() {
			if e := recover(); e != nil {
				global.LOG.Error(fmt.Sprintf("%v", e))
				ch <- kw_errors.URLError
			}
		}()
		if code, err := action(); err != nil {
			ch <- kw_errors.URLError.SetDetailError(err.Error())
		} else {
			if code == http.StatusUnauthorized {
				ch <- kw_errors.GraphDBAccountError
			} else if code == http.StatusNotFound {
				ch <- kw_errors.URLError
			} else {
				ch <- kw_errors.OK
			}
		}
	}()
	timer := time.NewTimer(timeout)
	defer timer.Stop()
	for {
		select {
		case e := <-ch:
			if e != kw_errors.OK {
				panic(e)
			}
			return
		case <-timer.C:
			panic(kw_errors.URLError)
		}
	}
}

type GraphDBService struct{}

func (*GraphDBService) GetGraphDBList(condition *vo.GraphListSearchCondition) *vo.ListVo {
	graphDBs := make([]*po.GraphDB, 0)
	session := global.DB.Model(po.GraphDBModel)
	if condition.Type != "all" {
		session.Where("type = ?", condition.Type)
	}
	if condition.Name != "" {
		session.Where("name like ?", "%"+condition.Name+"%")
	}
	list := &vo.ListVo{}
	kw_errors.Try(session.Count(&list.Total).Error).Throw(kw_errors.InternalServerError)
	if condition.Order != "no" {
		session.Order(fmt.Sprintf("%s %s", condition.OrderField, condition.Order))
	}
	if condition.Size != 0 {
		kw_errors.Try(session.Offset((condition.Page - 1) * condition.Size).Limit(condition.Size).Find(&graphDBs).Error).Throw(kw_errors.InternalServerError)
	}
	var graphDBVos = make([]*vo.GraphDBItemVo, len(graphDBs))
	if len(graphDBs) > 0 {
		for i, item := range graphDBs {
			vo := &vo.GraphDBItemVo{ID: item.ID, Name: item.Name, Type: item.Type, User: item.User, TimeVo: vo.TimeVo{Updated: item.Updated.Unix(), Created: item.Created.Unix()}}
			kw_errors.Try(global.DB.Model(po.GraphConfigTableModel).Where("graph_db_id = ?", item.ID).Count(&vo.Count).Error).Throw(kw_errors.InternalServerError)
			if item.FulltextId != 0 {
				kw_errors.Try(global.DB.Model(po.FulltextEngineModel).Select("name").Where("id = ?", item.FulltextId).First(&vo.OsName).Error).Throw(kw_errors.InternalServerError)
			} else {
				vo.OsName = ""
			}
			graphDBVos[i] = vo
		}
	}
	list.Data = graphDBVos
	return list
}

// GetGraphInfoByGraphDBId 查询存储项关联的图谱信息
func (*GraphDBService) GetGraphInfoByGraphDBId(condition *vo.GraphSearchCondition) *vo.ListVo {
	var graphConfigTableList = make([]*po.GraphConfigTable, condition.Size)
	kw_errors.Try(global.DB.Model(po.GraphConfigTableModel).Select("create_time", "graph_name").
		Where("graph_db_id = ?", condition.ID).Offset((condition.Page - 1) * condition.Size).Limit(condition.Size).
		Find(&graphConfigTableList).Error).Throw(kw_errors.InternalServerError)
	var graphList = make([]*vo.GraphConfigTableItemVo, len(graphConfigTableList))
	for i, graph := range graphConfigTableList {
		createTime, err := time.ParseInLocation("2006-01-02 15:04:05", graph.CreateTime, time.Local)
		kw_errors.Try(err).Throw(kw_errors.InternalServerError)
		graphList[i] = &vo.GraphConfigTableItemVo{Name: graph.GraphName, Created: createTime.Unix()}
	}
	list := &vo.ListVo{Data: graphList}
	kw_errors.Try(global.DB.Model(po.GraphConfigTableModel).Where("graph_db_id = ?", condition.ID).Count(&list.Total).Error).Throw(kw_errors.InternalServerError)
	return list
}

func (*GraphDBService) GetGraphDBInfoById(id int) *vo.GraphDBVo {
	graphDb := &po.GraphDB{}
	kw_errors.Try(global.DB.Model(po.GraphDBModel).Where("id = ?", id).Find(graphDb).Error).Throw(kw_errors.InternalServerError)
	if graphDb.ID <= 0 {
		panic(kw_errors.GraphDBRecordNotFoundError)
	}
	bytes, err := base64.StdEncoding.DecodeString(graphDb.Password)
	kw_errors.Try(err).Throw(kw_errors.InternalServerError)
	return &vo.GraphDBVo{ID: graphDb.ID, Name: graphDb.Name, Type: graphDb.Type, Ip: strings.Split(graphDb.Ip, IpPortSplitChar), Port: strings.Split(graphDb.Port, IpPortSplitChar), User: graphDb.User, Password: string(bytes), OsId: graphDb.FulltextId}
}

func (*GraphDBService) GetGraphDBNameById(id int) (name string) {
	kw_errors.Try(global.DB.Model(po.GraphDBModel).Select("name").Where("id = ?", id).Find(&name).Error).Throw(kw_errors.InternalServerError)
	return name
}

//检查是否存在相同配置
func checkDuplicateConfig(model interface{}, id int, user, password string, ips, ports []string) {
	arrangementIdxs := utils.GetFullArrangementIndex(len(ips), nil)
	var ipList = make([]string, len(arrangementIdxs))
	var portList = make([]string, len(arrangementIdxs))
	for i, arrangement := range arrangementIdxs {
		for j, idx := range arrangement {
			if j <= 0 {
				ipList[i] = ips[idx]
				portList[i] = ports[idx]
				continue
			}
			ipList[i] = ipList[i] + IpPortSplitChar + ips[idx]
			portList[i] = portList[i] + IpPortSplitChar + ports[idx]
		}
	}
	var count int64
	var whereSql = "user = ? and password = ? and ("
	var sqlParams = []interface{}{user, password}
	for i, ip := range ipList {
		if i < len(ipList)-1 {
			whereSql = whereSql + " ip = ? and port = ? or "
		} else {
			whereSql = whereSql + " ip = ? and port = ?)"
		}
		sqlParams = append(sqlParams, ip, portList[i])
	}
	session := global.DB.Model(model).Where(whereSql, sqlParams...)
	if id > 0 {
		session.Not("id = ?", id)
	}
	if kw_errors.Try(session.Count(&count).Error).Throw(kw_errors.InternalServerError); count > 0 {
		panic(kw_errors.DuplicateConfigError)
	}
}

func (*GraphDBService) AddGraphDB(vo *vo.GraphDBVo) (id int) {
	//查询是否有同名存储配置
	var count int64
	if kw_errors.Try(global.DB.Model(po.GraphDBModel).Where("name = ?", vo.Name).Count(&count).Error).Throw(kw_errors.InternalServerError); count > 0 {
		panic(kw_errors.DuplicateGraphDBRecordNameError)
	}
	encodedPass := base64.StdEncoding.EncodeToString([]byte(vo.Password))
	//查询是否有相同用户名，密码，ip和port的配置
	if global.LockOperator.TryLock("update_graphdb_lock", lock.Context(), 5*time.Second) {
		defer global.LockOperator.Unlock("update_graphdb_lock")
		checkDuplicateConfig(po.GraphDBModel, 0, vo.User, encodedPass, vo.Ip, vo.Port)
		if global.LockOperator.TryLock("delete_os_lock", lock.Context(), 5*time.Second) {
			defer global.LockOperator.Unlock("delete_os_lock")
			//查询opensearch配置是否存在
			if kw_errors.Try(global.DB.Model(po.FulltextEngineModel).Where("id = ?", vo.OsId).Count(&count).Error).Throw(kw_errors.InternalServerError); count <= 0 {
				if vo.Type != constant.OrientDB {
					panic(kw_errors.OsRecordNotFoundError)
				}
			}
			graphDb := &po.GraphDB{Name: vo.Name, Type: vo.Type, Ip: strings.Join(vo.Ip, IpPortSplitChar), Port: strings.Join(vo.Port, IpPortSplitChar),
				User: vo.User, Password: encodedPass, DbUser: vo.User, DbPs: encodedPass, FulltextId: vo.OsId}
			kw_errors.Try(global.DB.Create(graphDb).Error).Throw(kw_errors.InternalServerError)
			if graphDb.ID <= 0 {
				panic(kw_errors.InternalServerError.SetDetailError("Storage configuration creation failed"))
			}
			return graphDb.ID
		} else {
			panic(kw_errors.InternalServerError.SetDetailError("redis lock acquisition timeout"))
		}
	} else {
		panic(kw_errors.InternalServerError.SetDetailError("redis lock acquisition timeout"))
	}
	return
}

func (*GraphDBService) DeleteGraphDBById(id int) {
	var count int64
	if kw_errors.Try(global.DB.Model(po.GraphDBModel).Where("id = ?", id).Count(&count).Error).Throw(kw_errors.InternalServerError); count <= 0 {
		panic(kw_errors.GraphDBRecordNotFoundError)
	}
	r := global.DB.Model(po.GraphDBModel).Delete("id", id)
	kw_errors.Try(r.Error).Throw(kw_errors.InternalServerError)
	if r.RowsAffected <= 0 {
		panic(kw_errors.InternalServerError.SetDetailError("Storage configuration delete failed"))
	}
}

func (*GraphDBService) UpdateGraphDB(vo *vo.GraphDBUpdateVo) {
	var count int64
	//查询待更新记录是否存在
	if kw_errors.Try(global.DB.Model(po.GraphDBModel).Where("id = ?", vo.ID).Count(&count).Error).Throw(kw_errors.InternalServerError); count <= 0 {
		panic(kw_errors.GraphDBRecordNotFoundError)
	}
	count = 0
	encodedPass := base64.StdEncoding.EncodeToString([]byte(vo.Password))
	if global.LockOperator.TryLock("update_graphdb_lock", lock.Context(), 5*time.Second) {
		defer global.LockOperator.Unlock("update_graphdb_lock")
		//查询是否有同名记录
		if kw_errors.Try(global.DB.Model(po.GraphDBModel).Where("name = ? and id != ?", vo.Name, vo.ID).Count(&count).Error).Throw(kw_errors.InternalServerError); count > 0 {
			panic(kw_errors.DuplicateGraphDBRecordNameError)
		}
		var fulltextId int
		kw_errors.Try(global.DB.Model(po.GraphDBModel).Select("fulltext_id").Where("id = ?", vo.ID).Find(&fulltextId).Error).Throw(kw_errors.InternalServerError)
		if fulltextId != vo.OsId && fulltextId != 0 {
			panic(kw_errors.InternalServerError)
		}
		//查询是否有相同用户名，密码，ip和port的配置
		checkDuplicateConfig(po.GraphDBModel, vo.ID, vo.User, encodedPass, vo.Ip, vo.Port)
		graphDb := &po.GraphDB{ID: vo.ID, Name: vo.Name, Type: vo.Type, Ip: strings.Join(vo.Ip, IpPortSplitChar), Port: strings.Join(vo.Port, IpPortSplitChar), User: vo.User, Password: encodedPass, DbUser: vo.User, DbPs: encodedPass, FulltextId: vo.OsId}
		r := global.DB.Updates(graphDb)
		kw_errors.Try(r.Error).Throw(kw_errors.InternalServerError)
		if r.RowsAffected <= 0 {
			panic(kw_errors.InternalServerError.SetDetailError("Storage configuration update failed"))
		}
	} else {
		panic(kw_errors.InternalServerError.SetDetailError("redis lock acquisition timeout"))
	}
}

func (*GraphDBService) TestConnConfig(vo *vo.ConnTestVo) {
	ConnTestHandlers[vo.Type](vo)
}

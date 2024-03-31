// Package nebula 数据层实现
package nebula

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"kw-graph/utils"

	nebulaV3 "github.com/vesoft-inc/nebula-go/v3"
	"github.com/zeromicro/go-zero/core/logx"
	errorCode "kw-graph/internal/errors"
	"kw-graph/internal/logic/repo"
)

// NebulaClient nebula 结构声明
type NebulaClient struct {
	nebulaHost string
	nebulaPort int
	nebulaUser string
	nebulaPass string
}

// VInfo 点信息结构
type VInfo struct {
	ID         string
	Tags       []string
	Properties map[string]map[string]*repo.Prop
}

// ClassInfo 通用类型返回结构体
type ClassInfo struct {
	Name       string
	Properties []*ClassPropertity
}

// ClassPropertity TagPropertity TagInfo.Properties 结构类型
type ClassPropertity struct {
	Name string
	Type string
}

// NebulaExecuteRepo nebula 基础操作接口声明
type NebulaExecuteRepo interface {
	Execute(ctx context.Context, query, space string, givenJSON bool) (*nebulaV3.ResultSet, []byte, error)
	ShowTags(ctx context.Context, space string) ([]string, error)
	ShowEdges(ctx context.Context, space string) ([]string, error)
	DescTag(ctx context.Context, space, tag string) (*ClassInfo, error)
	DescEdge(ctx context.Context, space, edge string) (*ClassInfo, error)
	GetVinfoByIDs(ctx context.Context, space string, ids []string) ([]*VInfo, error)
}

// NewNebulaDB 数据库初始化函数
func NewNebulaDB(host, user, pass string, port int) NebulaExecuteRepo {
	return &NebulaClient{
		nebulaHost: host,
		nebulaPort: port,
		nebulaUser: user,
		nebulaPass: pass,
	}
}

// Execute nebula execute函数
func (ne *NebulaClient) Execute(ctx context.Context, query, space string, givenJSON bool) (*nebulaV3.ResultSet, []byte, error) {
	hosts := strings.Split(ne.nebulaHost, ",")
	hostList := []nebulaV3.HostAddress{}
	for _, host := range hosts {
		hostAddress := nebulaV3.HostAddress{Host: host, Port: ne.nebulaPort}
		hostList = append(hostList, hostAddress)
	}

	// Create configs for connection pool using default values
	testPoolConfig := nebulaV3.GetDefaultConf()
	testPoolConfig.MaxConnPoolSize = 200
	// Initialize connection pool
	pool, err := nebulaV3.NewConnectionPool(hostList, testPoolConfig, nebulaV3.DefaultLogger{})
	if err != nil {
		logx.Errorf("Fail to initialize the connection pool, host: %s, port: %d, %s", ne.nebulaHost, ne.nebulaPort, err.Error())
		return nil, nil, errorCode.New(http.StatusInternalServerError, errorCode.NebulaInternalServer,
			fmt.Sprintf("Fail to initialize the connection pool, host: %s, port: %d, %s", ne.nebulaHost, ne.nebulaPort, err.Error()))
	}

	// Close all connections in the pool
	defer pool.Close()

	logx.Infof("Nebula search statement is : %s", query)
	session, err := pool.GetSession(ne.nebulaUser, ne.nebulaPass)
	if err != nil {
		logx.Errorf("Fail to create a new session from connection pool, nebulaUser: %s, password: %s, %s",
			ne.nebulaUser, ne.nebulaPass, err.Error())

		return nil, nil, err
	}
	// Release session and return connection back to connection pool
	defer session.Release()

	// Use space
	useSpace, err := session.Execute(fmt.Sprintf("use `%s`", space))
	if err != nil {
		logx.Errorf(err.Error())
		return nil, nil, err
	}

	if !useSpace.IsSucceed() {
		logx.Errorf(fmt.Sprintf("ErrorCode: %d, ErrorMsg: %s", useSpace.GetErrorCode(), useSpace.GetErrorMsg()))
		if e, ok := errorCode.NebulaErr2CommonErr[int(useSpace.GetErrorCode())]; ok {
			return nil, nil, errorCode.New(http.StatusInternalServerError, e, useSpace.GetErrorMsg())
		}
		return nil, nil, errorCode.New(http.StatusInternalServerError, errorCode.NebulaInternalServer, useSpace.GetErrorMsg())
	}

	var resultSet *nebulaV3.ResultSet
	var jsonResult []byte
	if !givenJSON {
		// Excute a query
		resultSet, err = session.Execute(query)
		if err != nil {
			logx.Errorf(err.Error())
			return nil, nil, err
		}

		// 注意这里不能用err判断，某些情况报错err ==nil, 抛出上层直接panic
		if !resultSet.IsSucceed() {
			logx.Errorf(fmt.Sprintf("ErrorCode: %d, ErrorMsg: %s, Query:%s", resultSet.GetErrorCode(), resultSet.GetErrorMsg(), query))
			if e, ok := errorCode.NebulaErr2CommonErr[int(resultSet.GetErrorCode())]; ok {
				return nil, nil, errorCode.New(http.StatusInternalServerError, e, resultSet.GetErrorMsg())
			}

			return nil, nil, errorCode.New(http.StatusInternalServerError, errorCode.NebulaInternalServer, resultSet.GetErrorMsg())
		}
	} else {
		// Excute a query
		jsonResult, err = session.ExecuteJson(query)

		if err != nil {
			logx.Errorf(err.Error())
			return nil, nil, err
		}
	}

	return resultSet, jsonResult, nil
}

// ShowTags 展示某space中所有tag名称
func (ne *NebulaClient) ShowTags(ctx context.Context, space string) ([]string, error) {
	nGql := "show tags;"
	tags, _, err := ne.Execute(ctx, nGql, space, false)
	if err != nil {
		logx.Error("Show tags failed: ", err, space)
		return nil, err
	}

	res := make([]string, tags.GetRowSize())
	for i := 0; i < tags.GetRowSize(); i++ {
		rowValue, _ := tags.GetRowValuesByIndex(i)
		res[i] = utils.TrimQuotationMarks(rowValue.String())
	}
	return res, nil
}

// DescTag 展示某space中某tag的信息
func (ne *NebulaClient) DescTag(ctx context.Context, space, tag string) (*ClassInfo, error) {
	nGql := fmt.Sprintf("desc tag `%s`", tag)
	res, _, err := ne.Execute(ctx, nGql, space, false)
	if err != nil {
		logx.Error("Show tags failed: ", err)
		return nil, err
	}

	tagInfo := &ClassInfo{Name: tag}

	for i := 0; i < res.GetRowSize(); i++ {
		rowValue, _ := res.GetRowValuesByIndex(i)
		rowValueSplit := strings.Split(rowValue.String(), ", ")

		tagProp := &ClassPropertity{
			Name: utils.TrimQuotationMarks(rowValueSplit[0]),
			Type: utils.TrimQuotationMarks(rowValueSplit[1]),
		}
		tagInfo.Properties = append(tagInfo.Properties, tagProp)
	}

	return tagInfo, nil
}

// ShowEdges 展示某space中所有edge type
func (ne *NebulaClient) ShowEdges(ctx context.Context, space string) ([]string, error) {
	nGql := "show edges;"
	edges, _, err := ne.Execute(ctx, nGql, space, false)
	if err != nil {
		logx.Error("Show edges failed: ", err, space)
		return nil, err
	}

	res := make([]string, edges.GetRowSize())
	for i := 0; i < edges.GetRowSize(); i++ {
		rowValue, _ := edges.GetRowValuesByIndex(i)
		res[i] = utils.TrimQuotationMarks(rowValue.String())
	}
	return res, nil
}

// DescEdge 展示某space中某edge的信息
func (ne *NebulaClient) DescEdge(ctx context.Context, space, edge string) (*ClassInfo, error) {
	nGql := fmt.Sprintf("desc edge `%s`", edge)
	res, _, err := ne.Execute(ctx, nGql, space, false)
	if err != nil {
		logx.Error("Show tags failed: ", err)
		return nil, err
	}

	tagInfo := &ClassInfo{Name: edge}

	for i := 0; i < res.GetRowSize(); i++ {
		rowValue, _ := res.GetRowValuesByIndex(i)
		rowValueSplit := strings.Split(rowValue.String(), ", ")

		tagProp := &ClassPropertity{
			Name: utils.TrimQuotationMarks(rowValueSplit[0]),
			Type: utils.TrimQuotationMarks(rowValueSplit[1]),
		}
		tagInfo.Properties = append(tagInfo.Properties, tagProp)
	}

	return tagInfo, nil
}

// GetVinfoByIDs 根据vids获取点的信息
func (ne *NebulaClient) GetVinfoByIDs(ctx context.Context, space string, ids []string) ([]*VInfo, error) {
	tmpIDs := []string{}

	for _, id := range ids {
		tmpIDs = append(tmpIDs, "'"+id+"'")
	}

	nGql := fmt.Sprintf("match (v) where id(v) in [%s]  return v;", strings.Join(tmpIDs, ","))
	res, _, err := ne.Execute(ctx, nGql, space, false)
	if err != nil {
		logx.Error("get vids info failed: ", err, space)
		return nil, err
	}
	vInfos := []*VInfo{}
	for i := 0; i < res.GetRowSize(); i++ {
		rowValue, _ := res.GetRowValuesByIndex(i)
		valWrap, _ := rowValue.GetValueByIndex(0)
		if node, err := valWrap.AsNode(); err == nil {
			id := utils.TrimQuotationMarks(node.GetID().String())
			vertex := &VInfo{
				ID:         id,
				Tags:       node.GetTags(),
				Properties: make(map[string]map[string]*repo.Prop),
			}

			for _, tag := range node.GetTags() {
				propMap := map[string]*repo.Prop{}
				if prop, err := node.Properties(tag); err == nil {
					for propName, propValue := range prop {
						p := &repo.Prop{
							Value: utils.TrimQuotationMarks(propValue.String()),
							Type:  propValue.GetType(),
						}
						propMap[propName] = p
					}
				}
				vertex.Properties[tag] = propMap
			}

			vInfos = append(vInfos, vertex)
		}
	}
	return vInfos, nil
}

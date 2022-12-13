package nebula

import (
	"encoding/base64"
	"errors"
	"fmt"
	nebula "github.com/vesoft-inc/nebula-go/v3"
	"graph-engine/logger"
	"graph-engine/utils"
	"strconv"
	"strings"
)

//const (
//	address  = "10.4.131.25"
//	port     = 9669
//	username = "root"
//	password = "nebula"
//)

// Initialize logger
var log = nebula.DefaultLogger{}

type Nebula struct{}

func (Nebula) Client(conf *utils.KGConf, query string) (*nebula.ResultSet, error) {
	address := strings.Split(strings.Split(conf.URL, "//")[1], ":")[0]
	port, _ := strconv.Atoi(strings.Split(strings.Split(conf.URL, "//")[1], ":")[1])

	hostAddress := nebula.HostAddress{Host: address, Port: port}
	hostList := []nebula.HostAddress{hostAddress}
	// Create configs for connection pool using default values
	testPoolConfig := nebula.GetDefaultConf()

	// Initialize connection pool
	pool, err := nebula.NewConnectionPool(hostList, testPoolConfig, log)
	if err != nil {
		logger.Error(fmt.Sprintf("Fail to initialize the connection pool, host: %s, port: %d, %s", address, port, err.Error()))
		return nil, utils.ErrInfo(utils.ErrNebulaErr, errors.New(fmt.Sprintf("Fail to initialize the connection pool, host: %s, port: %d, %s", address, port, err.Error())))
	}
	// Close all connections in the pool
	defer pool.Close()

	// Create session
	// base64 decode
	pwdDecode, err := base64.StdEncoding.DecodeString(conf.Pwd)
	if err != nil {
		return nil, err
	}
	Session, err := pool.GetSession(conf.User, string(pwdDecode))
	if err != nil {
		logger.Error(fmt.Sprintf("Fail to create a new session from connection pool, username: %s, password: %s, %s",
			conf.User, conf.Pwd, err.Error()))

		return nil, utils.ErrInfo(utils.ErrNebulaErr, errors.New(fmt.Sprintf("Fail to create a new session from connection pool, username: %s, password: %s, %s",
			conf.User, conf.Pwd, err.Error())))
	}
	// Release session and return connection back to connection pool
	defer Session.Release()

	// Use space
	useSpace, err := Session.Execute(fmt.Sprintf("use `%s`", conf.DB))
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrNebulaErr, err)
	}

	if !useSpace.IsSucceed() {
		logger.Error(fmt.Sprintf("ErrorCode: %d, ErrorMsg: %s", useSpace.GetErrorCode(), useSpace.GetErrorMsg()))
		if useSpace.GetErrorCode() == -1005 {
			err := utils.ErrInfo(utils.ErrNebulaNotFoundSpace, errors.New(fmt.Sprintf("ErrorCode: %d, ErrorMsg: %s", useSpace.GetErrorCode(), useSpace.GetErrorMsg())))
			return nil, err
		}
		err := utils.ErrInfo(utils.ErrNebulaErr, errors.New(fmt.Sprintf("ErrorCode: %d, ErrorMsg: %s", useSpace.GetErrorCode(), useSpace.GetErrorMsg())))
		return nil, err
	}

	// Excute a query
	resultSet, err := Session.Execute(query)
	//resultSet, err := Session.ExecuteJson(query)
	if err != nil {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrNebulaErr, err)
	}

	if !resultSet.IsSucceed() {
		logger.Error(fmt.Sprintf("ErrorCode: %d, ErrorMsg: %s", resultSet.GetErrorCode(), resultSet.GetErrorMsg()))
		// 捕获特殊异常
		if int(resultSet.GetErrorCode()) == -1005 &&
			resultSet.GetErrorMsg() == "There is no any stats info to show, please execute `submit job stats' firstly!" {
			err := utils.ErrInfo(utils.ErrNebulaStatsErr, errors.New(fmt.Sprintf("ErrorCode: %d, ErrorMsg: %s", resultSet.GetErrorCode(), resultSet.GetErrorMsg())))
			return nil, err
		} else if strings.Contains(resultSet.GetErrorMsg(), "No edge type found ") {
			//部分查询语句在没有边时会报错,内部处理,不抛出
			err := errors.New("no edge")
			return nil, err

		} else {
			err := utils.ErrInfo(utils.ErrNebulaErr, errors.New(fmt.Sprintf("ErrorCode: %d, ErrorMsg: %s", resultSet.GetErrorCode(), resultSet.GetErrorMsg())))
			return nil, err
		}
	}
	//var jsonObj JsonObj
	//// Parse JSON
	//json.Unmarshal(resultSet, &jsonObj)
	//
	//if jsonObj.Errors[0].ErrorCode != 0 {
	//	logger.Error(fmt.Sprintf("ErrorCode: %d, ErrorMsg: %s", jsonObj.Errors[0].ErrorCode, jsonObj.Errors[0].ErrorMsg))
	//
	//	err := utils.ErrInfo(utils.ErrNebulaErr, errors.New(fmt.Sprintf("ErrorCode: %d, ErrorMsg: %s", jsonObj.Errors[0].ErrorCode, jsonObj.Errors[0].ErrorMsg)))
	//	return nil, err
	//}

	return resultSet, nil
}

// Struct used for storing the parsed object
type JsonObj struct {
	Results []struct {
		Columns []string `json:"columns"`
		Data    []struct {
			Row  []interface{} `json:"row"`
			Meta []interface{} `json:"meta"`
		} `json:"data"`
		LatencyInUs int    `json:"latencyInUs"`
		SpaceName   string `json:"spaceName"`
		PlanDesc    struct {
			PlanNodeDescs []struct {
				Name        string `json:"name"`
				ID          int    `json:"id"`
				OutputVar   string `json:"outputVar"`
				Description struct {
					Key string `json:"key"`
				} `json:"description"`
				Profiles []struct {
					Rows              int `json:"rows"`
					ExecDurationInUs  int `json:"execDurationInUs"`
					TotalDurationInUs int `json:"totalDurationInUs"`
					OtherStats        struct {
					} `json:"otherStats"`
				} `json:"profiles"`
				BranchInfo struct {
					IsDoBranch      bool `json:"isDoBranch"`
					ConditionNodeID int  `json:"conditionNodeId"`
				} `json:"branchInfo"`
				Dependencies []interface{} `json:"dependencies"`
			} `json:"planNodeDescs"`
			NodeIndexMap struct {
			} `json:"nodeIndexMap"`
			Format           string `json:"format"`
			OptimizeTimeInUs int    `json:"optimize_time_in_us"`
		} `json:"planDesc "`
		Comment string `json:"comment "`
	} `json:"results"`
	Errors []struct {
		ErrorCode int    `json:"code"`
		ErrorMsg  string `json:"message"`
	} `json:"errors"`
}

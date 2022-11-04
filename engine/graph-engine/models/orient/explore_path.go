package orient

import (
	"encoding/json"
	"errors"
	"fmt"
	"graph-engine/logger"
	"graph-engine/utils"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

const (
	MAXDEPTH         = 13
	MAX_WORKER_COUNT = 300000
)

type PathDetailInfo struct {
	VerticesInfo []*ExplorePathVertexRes `json:"vertices"`
	EdgesInfo    []*ExplorePathEdgeRes   `json:"edges"`
}

type EdgeSimpleInfo struct {
	ID  string `json:"id"`
	Out string `json:"out"`
	In  string `json:"in"`
}

type PathInfo struct {
	Vertices  []string          `json:"vertices"`
	Edges     []*EdgeSimpleInfo `json:"edges"`
	IsInvalid bool              `json:"-"` //边是否无效
}

type ExplorePathProperty struct {
	Name  string `json:"n"`
	Value string `json:"v"`
}

// ExplorePathEdgeRes 路径边对象
type ExplorePathEdgeRes struct {
	ID         string                 `json:"id"`
	Class      string                 `json:"class"`
	Alias      string                 `json:"alias"`
	Color      string                 `json:"color"`
	Name       string                 `json:"name"`
	Properties []*ExplorePathProperty `json:"properties"`
	Out        string                 `json:"out"`
	In         string                 `json:"in"`
}

// ExplorePathVertexRes 路径点返回对象
type ExplorePathVertexRes struct {
	ID         string                 `json:"id"`
	Class      string                 `json:"class"`
	Color      string                 `json:"color"`
	Alias      string                 `json:"alias"`
	Name       string                 `json:"name"`
	Expand     bool                   `json:"expand"`
	Analysis   bool                   `json:"analysis"`
	Properties []*ExplorePathProperty `json:"properties"`
}

func ExplorePath(conf *utils.KGConf, startRid, endRid, direction string) (interface{}, error) {
	if conf.ID == "" {
		return nil, utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	var operator = Operator{
		User: conf.User,
		PWD:  conf.Pwd,
		URL:  conf.URL + "/command/" + conf.DB + "/sql/-/1111111",
		Mode: "graph",
	}
	//var operator = Operator{
	//	User: "root",
	//	PWD:  "YW55ZGF0YTEyMw==",
	//	URL:  "http://10.4.69.53:2480" + "/command/" + conf.DB + "/sql/-/1111111",
	//	Mode: "graph",
	//}

	var sql string
	//双向
	if direction == "bidirect" {
		sql = "select expand($path) from (TRAVERSE * FROM %s MAXDEPTH %d)"
	} else {
		//正向
		if direction == "positive" {
			sql = "select expand($path) from (TRAVERSE out() FROM %s MAXDEPTH %d)"
		} else { //返向
			sql = "select expand($path) from (TRAVERSE in() FROM %s MAXDEPTH %d)"
		}
	}
	sql = fmt.Sprintf(sql, startRid, MAXDEPTH)

	response, err := operator.SQL(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	paths := make([]*PathInfo, 0)
	var res map[string]interface{}
	err = json.Unmarshal(response, &res)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	if e, exists := res["errors"]; exists {
		logger.Error(err)
		return nil, utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
	}
	result, exists := res["graph"]
	if !exists {
		return nil, nil
	}

	resultMaps := result.(map[string]interface{})

	vertices := resultMaps["vertices"].([]interface{})
	edges := resultMaps["edges"].([]interface{})
	isTimeout := false

	if len(vertices) > 0 && len(edges) > 0 {
		//将点和边保存为map,提供查询效率
		verticesMap := make(map[string]string)
		edgesMap := make(map[string][]*EdgeSimpleInfo)
		wg := &sync.WaitGroup{}
		wg.Add(2)
		var hasContainsEnd bool
		//获取点的详细信息
		go func() {
			for _, vertex := range vertices {
				vMap := vertex.(map[string]interface{})
				rid := vMap["@rid"].(string)
				if strings.Trim(rid, "\"") == endRid {
					hasContainsEnd = true
				}
				verticesMap[rid] = rid
			}
			wg.Done()
		}()
		//获取边的详细信息
		go func() {
			for _, edge := range edges {
				rMap := edge.(map[string]interface{})
				rec := &EdgeSimpleInfo{
					ID:  rMap["@rid"].(string),
					In:  rMap["in"].(string),
					Out: rMap["out"].(string),
				}
				if direction != "positive" {
					edgesMap[rec.In] = append(edgesMap[rec.In], rec)
				}
				if direction != "reverse" {
					edgesMap[rec.Out] = append(edgesMap[rec.Out], rec)
				}
			}
			wg.Done()
		}()
		wg.Wait()
		if !hasContainsEnd {
			return nil, nil
		}

		var completed bool
		//var invalidPathMap = make(map[int]*PathInfo)
		paths = []*PathInfo{{Vertices: []string{startRid}}}
		end := time.Now().Unix() + 30
		for !isTimeout {
			if paths, completed = HandleV(paths, edgesMap, endRid); completed {
				var effectivePaths = make([]*PathInfo, len(paths))
				var count int
				//去除无效路径
				for _, path := range paths {
					if !path.IsInvalid {
						count++
						effectivePaths[count-1] = path
					}
				}
				if count < len(paths) {
					paths = effectivePaths[:count]
				}
				break
			} else {
				paths = HandleE(paths, verticesMap, endRid)
			}
		}
		isTimeout = end < time.Now().Unix()
	}
	if isTimeout {
		return nil, nil
	}
	return paths, nil
}

func HandleV(origin []*PathInfo, edgesMap map[string][]*EdgeSimpleInfo, endRid string) (res []*PathInfo, completed bool) {
	length := len(origin)
	//是否还有新边
	//hasEdge := false
	var hasEdge int32 = 0

	var splitedIndex int
	var step = 10
	var end int
	var leftWorksCount int
	workerCount := length / step
	if length%step != 0 {
		workerCount++
	}

	if workerCount > MAX_WORKER_COUNT {
		workerCount = MAX_WORKER_COUNT
		step = length / MAX_WORKER_COUNT
		leftWorksCount = length % MAX_WORKER_COUNT
	}
	ch := make(chan *PathInfo, workerCount)
	invalidPathCh := make(chan *PathInfo, length)
	for splitedIndex < length {
		if splitedIndex+step > length {
			end = length
		} else {
			if leftWorksCount > 0 {
				end = splitedIndex + step + 1
				leftWorksCount--
			} else {
				end = splitedIndex + step
			}
		}
		go func(start, end int) {
			for i := start; i < end; i++ {
				path := origin[i]
				//获取当前路径最后一个点
				last := path.Vertices[len(path.Vertices)-1]
				//最大路径长度为6
				if len(path.Edges) >= 5 && last != endRid {
					path.IsInvalid = true
					invalidPathCh <- path
					continue
				}
				//最后一条边
				var lastE *EdgeSimpleInfo
				if len(path.Edges) > 0 {
					lastE = path.Edges[len(path.Edges)-1]
				}
				//获取以该点为起点的所有边
				edges := edgesMap[last]
				if len(edges) <= 1 {
					if lastE == nil || edges != nil && edges[0].ID != lastE.ID {
					} else {
						//需要剔除的路径
						if last != endRid {
							path.IsInvalid = true
							//invalidPathMap[i] = path
							invalidPathCh <- path
							continue
						}
					}
				}
				if last == endRid && len(path.Edges) > 0 {
					continue
				}
				isInvalid := false
				//当前路径的终点是路径中已经遍历过的点，则表明是环，将该路径标为无效路径
				for j := 0; j < len(path.Vertices)-1; j++ {
					if path.Vertices[j] == last {
						path.IsInvalid = true
						isInvalid = true
						//invalidPathMap[i] = path
						invalidPathCh <- path
						break
					}
				}
				//只遍历有效边
				if isInvalid {
					continue
				}
				var flag bool
				//如果当前顶点超过一条出边，则生成多条路径
				for j := 0; j < len(edges); j++ {
					//不能重复遍历一条边
					if lastE != nil && edges[j].ID == lastE.ID {
						continue
					}
					if !flag {
						path.Edges = append(path.Edges, edges[j])
						flag = true
						continue
					}
					verticesInfo := make([]string, len(path.Vertices))
					edgesInfo := make([]*EdgeSimpleInfo, len(path.Edges))
					for k, vertexRes := range path.Vertices {
						verticesInfo[k] = vertexRes
					}
					for k := 0; k < len(path.Edges)-1; k++ {
						edgesInfo[k] = path.Edges[k]
					}
					edgesInfo[len(path.Edges)-1] = edges[j]
					//寻找无效路径，并用新路径覆盖
					select {
					case p := <-invalidPathCh:
						p.Vertices = verticesInfo
						p.Edges = edgesInfo
						p.IsInvalid = false
					default:
						ch <- &PathInfo{
							Vertices: verticesInfo,
							Edges:    edgesInfo,
						}
					}
				}
				atomic.StoreInt32(&hasEdge, 1)
			}
			ch <- nil
		}(splitedIndex, end)
		splitedIndex = end
	}
	//从ch中取出路径并添加路径数组后面
	completedWorkCount := 0
	for completedWorkCount < workerCount {
		select {
		case p := <-ch:
			if p != nil {
				origin = append(origin, p)
			} else {
				completedWorkCount++
			}
		default:
			time.Sleep(time.Millisecond)
		}
	}
	if hasEdge == 0 {
		return origin, true
	}
	return origin, false
}

func HandleE(origin []*PathInfo, verticesMap map[string]string, endRid string) []*PathInfo {
	length := len(origin)
	var splitedIndex int
	var step = 2000
	var end int
	var leftWorksCount int
	workerCount := length / step
	if length%step != 0 {
		workerCount++
	}
	if workerCount > MAX_WORKER_COUNT {
		workerCount = MAX_WORKER_COUNT
		step = length / MAX_WORKER_COUNT
		leftWorksCount = length % MAX_WORKER_COUNT
	}
	//var invalidCount int64 = 0
	wg := &sync.WaitGroup{}
	wg.Add(workerCount)
	for splitedIndex < length {
		if splitedIndex+step > length {
			end = length
		} else {
			if leftWorksCount > 0 {
				end = splitedIndex + step + 1
				leftWorksCount--
			} else {
				end = splitedIndex + step
			}
		}
		go func(start, end int) {
			for i := start; i < end; i++ {
				path := origin[i]
				//路径是无效的，或者路径已经到最后一个顶点，无需遍历
				if path.IsInvalid || path.Vertices[len(path.Vertices)-1] == endRid && len(path.Vertices) > 1 {
					//atomic.AddInt64(&invalidCount, 1)
					continue
				}
				lastE := path.Edges[len(path.Edges)-1]
				lastV := path.Vertices[len(path.Vertices)-1]
				var v string
				//正向
				if lastV == lastE.Out {
					v = verticesMap[lastE.In]
				} else { //反向
					v = verticesMap[lastE.Out]
				}
				path.Vertices = append(path.Vertices, v)
			}
			wg.Done()
		}(splitedIndex, end)
		splitedIndex = end
	}
	wg.Wait()
	//fmt.Println(invalidCount)
	return origin
}

func PathDetail(conf *utils.KGConf, pathsInfo []map[string][]string) (interface{}, error) {
	if conf.ID == "" {
		return nil, utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	var operator = Operator{
		User: conf.User,
		PWD:  conf.Pwd,
		URL:  conf.URL + "/command/" + conf.DB + "/sql",
		Mode: "command",
	}
	//var operator = Operator{
	//	User: "root",
	//	PWD:  "YW55ZGF0YTEyMw==",
	//	URL:  "http://10.4.68.144:2480" + "/command/" + conf.DB + "/sql",
	//	Mode: "command",
	//}

	var vSql = "select * from V where @rid in [%s]"
	var eSql = "select * from E where @rid in [%s]"

	var vids []string
	var eids []string
	for _, path := range pathsInfo {
		if path["vids"] == nil || path["eids"] == nil {
			continue
		}
		vids = append(vids, path["vids"]...)
		eids = append(eids, path["eids"]...)
	}
	if len(vids) <= 0 || len(eids) <= 0 {
		return nil, nil
	}
	var schema Schema
	err := schema.GetSchema(conf)
	if err != nil {
		return nil, err
	}

	if schema.V == nil {
		return nil, utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))
	}

	vSql = fmt.Sprintf(vSql, strings.Join(vids, ","))
	eSql = fmt.Sprintf(eSql, strings.Join(eids, ","))

	wg := &sync.WaitGroup{}
	wg.Add(2)
	var orientDBErr error
	verticesMap := make(map[string]*ExplorePathVertexRes)
	edgesMap := make(map[string]*ExplorePathEdgeRes)
	//查询点
	go func() {
		response, err := operator.Command(vSql)
		if err != nil {
			orientDBErr = utils.ErrInfo(utils.ErrOrientDBErr, err)
		}

		var res map[string]interface{}
		err = json.Unmarshal(response, &res)
		if err != nil {
			orientDBErr = utils.ErrInfo(utils.ErrOrientDBErr, err)
		}
		if e, exists := res["errors"]; exists {
			logger.Error(err)
			orientDBErr = utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
		}
		result, exists := res["result"]
		if !exists {
			return
		}
		results := result.([]interface{})

		for _, r := range results {
			vMap := r.(map[string]interface{})
			vrec := &ExplorePathVertexRes{
				Class:    vMap["@class"].(string),
				Name:     vMap["@class"].(string),
				ID:       vMap["@rid"].(string),
				Expand:   true,
				Analysis: false,
			}

			processFunc := func(k string, v interface{}) {
				ExplorePathProcessV(vrec, k, v)
			}

			utils.SortedMap(vMap, processFunc)

			// 导入的图谱不存在分析报告
			if conf.KGConfID != "-1" {
				// 是否有分析报告: class为document
				if vrec.Class == "document" {
					vrec.Analysis = true
				}
			}

			for _, s := range schema.V {
				if s.Name == vrec.Class {
					vrec.Alias = s.Alias
					vrec.Color = s.Color
					break
				}
			}
			verticesMap[vrec.ID] = vrec
		}
		wg.Done()
	}()
	//查询边
	go func() {
		response, err := operator.Command(eSql)
		if err != nil {
			orientDBErr = utils.ErrInfo(utils.ErrOrientDBErr, err)
		}

		var res map[string]interface{}
		err = json.Unmarshal(response, &res)
		if err != nil {
			orientDBErr = utils.ErrInfo(utils.ErrOrientDBErr, err)
		}
		if e, exists := res["errors"]; exists {
			logger.Error(err)
			orientDBErr = utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
		}
		result, exists := res["result"]
		if !exists {
			return
		}
		results := result.([]interface{})

		for _, r := range results {
			rMap := r.(map[string]interface{})
			rec := &ExplorePathEdgeRes{
				Class: rMap["@class"].(string),
				ID:    rMap["@rid"].(string),
				Name:  rMap["@class"].(string),
			}
			for _, s := range schema.E {
				if s.Name == rec.Class {
					rec.Alias = s.Alias
					rec.Color = s.Color
					break
				}
			}
			processFunc := func(k string, v interface{}) {
				ExplorePathProcessE(rec, k, v)
			}
			utils.SortedMap(rMap, processFunc)
			edgesMap[rec.ID] = rec
		}
		wg.Done()
	}()
	wg.Wait()
	if orientDBErr != nil {
		return nil, utils.ErrInfo(utils.ErrOrientDBErr, orientDBErr)
	}
	paths := make([]*PathDetailInfo, len(pathsInfo))
	for i, pathInfo := range pathsInfo {
		path := &PathDetailInfo{
			VerticesInfo: make([]*ExplorePathVertexRes, len(pathInfo["vids"])),
			EdgesInfo:    make([]*ExplorePathEdgeRes, len(pathInfo["eids"])),
		}
		for j, id := range pathInfo["vids"] {
			path.VerticesInfo[j] = verticesMap[id]
		}
		for j, id := range pathInfo["eids"] {
			path.EdgesInfo[j] = edgesMap[id]
		}
		paths[i] = path
	}
	return paths, nil
}

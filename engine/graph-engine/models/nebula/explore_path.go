package nebula

import (
	"errors"
	"fmt"
	"graph-engine/utils"
	"sort"
	"strings"
	"sync"
	"time"
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
	Vertices []string          `json:"vertices"`
	Edges    []*EdgeSimpleInfo `json:"edges"`
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

	//start := time.Now().UnixNano()

	var schema Schema
	err := schema.GetSchema(conf)
	if err != nil {
		return nil, err
	}

	if schema.V == nil {
		return nil, utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))
	}
	nebula := Nebula{}

	var gql = `FIND ALL PATH FROM "%s" TO "%s" OVER *`
	if direction == "reverse" {
		gql += " REVERSELY"
	} else if direction == "bidirect" {
		gql += " BIDIRECT"
	}
	gql += " yield path as `path`"
	gql = fmt.Sprintf(gql, startRid, endRid)

	resultSet, err := nebula.Client(conf, gql)
	if err != nil {
		return nil, err
	}
	//fmt.Println("查询耗时：", time.Now().UnixNano()-start)

	var paths = make([]*PathInfo, resultSet.GetRowSize())
	var splitedIndex int
	var step = 20
	var end int
	wg := &sync.WaitGroup{}
	workerCount := resultSet.GetRowSize() / step
	if resultSet.GetRowSize()%step != 0 {
		workerCount++
	}
	wg.Add(workerCount + 1)
	ch := make(chan *PathInfo, workerCount*2)
	for splitedIndex < resultSet.GetRowSize() {
		if splitedIndex+step > resultSet.GetRowSize() {
			end = resultSet.GetRowSize()
		} else {
			end = splitedIndex + step
		}
		go func(start, end int) {
			for i := start; i < end; i++ {
				row, _ := resultSet.GetRowValuesByIndex(i)
				pathValWarp, _ := row.GetValueByColName("path")
				pathVal, _ := pathValWarp.AsPath()
				edges := pathVal.GetRelationships()
				nodes := pathVal.GetNodes()
				path := &PathInfo{Edges: make([]*EdgeSimpleInfo, len(edges)), Vertices: make([]string, len(nodes))}
				//处理点
				for j, node := range nodes {
					path.Vertices[j] = node.GetID().String()[1 : len(node.GetID().String())-1]
				}
				//处理边
				for j, edge := range edges {
					eRecord := &EdgeSimpleInfo{
						ID:  edge.GetEdgeName() + ":" + edge.GetSrcVertexID().String() + "->" + edge.GetDstVertexID().String(),
						In:  edge.GetDstVertexID().String()[1 : len(edge.GetDstVertexID().String())-1],
						Out: edge.GetSrcVertexID().String()[1 : len(edge.GetSrcVertexID().String())-1],
					}
					path.Edges[j] = eRecord
				}
				ch <- path
			}
			wg.Done()
		}(splitedIndex, end)
		splitedIndex += step
	}
	go func() {
		var count int
		for count < resultSet.GetRowSize() {
			select {
			case path := <-ch:
				paths[count] = path
				count++
			default:
				//fmt.Println("等待................")
				time.Sleep(time.Millisecond)
			}
		}
		wg.Done()
	}()
	wg.Wait()
	return paths, nil
}

func PathDetail(conf *utils.KGConf, pathsInfo []map[string][]string) (interface{}, error) {
	if conf.ID == "" {
		return nil, utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	var schema Schema
	err := schema.GetSchema(conf)
	if err != nil {
		return nil, err
	}

	if schema.V == nil {
		return nil, utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))
	}
	nebula := Nebula{}

	var vGql = `MATCH (v) where id(v) in [%s] return v`
	var eGql = `FETCH PROP ON %s %s YIELD edge AS e`

	var edgesClassMap = make(map[string][]string)
	var vids []string
	for _, path := range pathsInfo {
		if path["vids"] == nil || path["eids"] == nil {
			continue
		}
		isValid := true
		for _, eid := range path["eids"] {
			list := strings.Split(eid, ":")
			if len(list) != 2 {
				isValid = false
				break
			}
			class := list[0]
			if len(list) != 2 {
				isValid = false
				break
			}
			edgesClassMap[class] = append(edgesClassMap[class], list[1])
		}
		if !isValid {
			continue
		}
		for i, p := range path["vids"] {
			path["vids"][i] = fmt.Sprintf(`"%s"`, p)
		}
		vids = append(vids, path["vids"]...)
	}
	if len(vids) <= 0 || len(edgesClassMap) <= 0 {
		return nil, nil
	}

	wg := &sync.WaitGroup{}
	wg.Add(2)
	var nebulaErr error
	verticesMap := make(map[string]*ExplorePathVertexRes)
	edgesMap := make(map[string]*ExplorePathEdgeRes)
	//查询点
	go func() {
		vGql = fmt.Sprintf(vGql, strings.Join(vids, ","))
		resultSet, err := nebula.Client(conf, vGql)
		if err != nil {
			nebulaErr = err
			return
		}
		for i := 0; i < resultSet.GetRowSize(); i++ {
			row, _ := resultSet.GetRowValuesByIndex(i)
			nodeValWarp, _ := row.GetValueByColName("v")
			node, _ := nodeValWarp.AsNode()
			v2Pro, _ := node.Properties(node.GetTags()[0])

			vRecord := &ExplorePathVertexRes{
				ID:         node.GetID().String()[1 : len(node.GetID().String())-1],
				Class:      node.GetTags()[0],
				Name:       v2Pro["name"].String()[1 : len(v2Pro["name"].String())-1],
				Expand:     false,
				Properties: nil,
				Analysis:   false,
			}

			var proKeys []string
			for key := range v2Pro {
				proKeys = append(proKeys, key)
				sort.Strings(proKeys)
			}
			for _, key := range proKeys {
				vRecord.Properties = append(vRecord.Properties, &ExplorePathProperty{
					Name:  key,
					Value: v2Pro[key].String()[1 : len(v2Pro[key].String())-1],
				})
			}

			// 导入的图谱不存在分析报告
			if conf.KGConfID != "-1" {
				// 是否有分析报告: class为document
				if vRecord.Class == "document" {
					vRecord.Analysis = true
				}
			}

			for _, s := range schema.V {
				if s.Name == vRecord.Class {
					vRecord.Alias = s.Alias
					vRecord.Color = s.Color
					break
				}
			}
			verticesMap[vRecord.ID] = vRecord
		}
		wg.Done()
	}()
	//查找边
	go func() {
		for class, e := range edgesClassMap {
			newEGql := fmt.Sprintf(eGql, class, strings.Join(e, ","))
			resultSet, err := nebula.Client(conf, newEGql)
			if err != nil {
				nebulaErr = err
				return
			}
			for i := 0; i < resultSet.GetRowSize(); i++ {
				row, _ := resultSet.GetRowValuesByIndex(i)
				edgeValWarp, _ := row.GetValueByColName("e")
				edge, _ := edgeValWarp.AsRelationship()
				edgePro := edge.Properties()
				eRecord := &ExplorePathEdgeRes{
					ID:    edge.GetEdgeName() + ":" + edge.GetSrcVertexID().String() + "->" + edge.GetDstVertexID().String(),
					Class: edge.GetEdgeName(),
					Name:  edge.GetEdgeName(),
					In:    edge.GetDstVertexID().String()[1 : len(edge.GetDstVertexID().String())-1],
					Out:   edge.GetSrcVertexID().String()[1 : len(edge.GetSrcVertexID().String())-1],
				}
				for _, s := range schema.E {
					if s.Name == eRecord.Class {
						eRecord.Alias = s.Alias
						eRecord.Color = s.Color
						break
					}
				}

				// edge properties
				var proKeys []string
				for key := range edgePro {
					proKeys = append(proKeys, key)
					sort.Strings(proKeys)
				}
				for _, key := range proKeys {
					eRecord.Properties = append(eRecord.Properties, &ExplorePathProperty{
						Name:  key,
						Value: edgePro[key].String()[1 : len(edgePro[key].String())-1],
					})
				}
				edgesMap[eRecord.ID] = eRecord
			}
		}
		wg.Done()
	}()
	wg.Wait()
	if nebulaErr != nil {
		return nil, utils.ErrInfo(utils.ErrNebulaErr, nebulaErr)
	}

	paths := make([]*PathDetailInfo, len(pathsInfo))
	for i, pathInfo := range pathsInfo {
		path := &PathDetailInfo{
			VerticesInfo: make([]*ExplorePathVertexRes, len(pathInfo["vids"])),
			EdgesInfo:    make([]*ExplorePathEdgeRes, len(pathInfo["eids"])),
		}
		for j, id := range pathInfo["vids"] {
			path.VerticesInfo[j] = verticesMap[id[1:len(id)-1]]
		}
		for j, id := range pathInfo["eids"] {
			path.EdgesInfo[j] = edgesMap[id]
		}
		paths[i] = path
	}
	return paths, nil
}

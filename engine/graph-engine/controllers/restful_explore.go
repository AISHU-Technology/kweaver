// Package controllers 为接口的控制逻辑
// - 描述：GEngine KG 入口
// - 时间：2020-9-22

package controllers

import (
	"errors"
	"graph-engine/models"
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// --------------------------------
// RESTful API 查询&探索
// --------------------------------

// VertexRes 顶点返回对象
type VertexRes struct {
	Id         string            `json:"id"`
	Class      string            `json:"class"`
	Name       string            `json:"name"`
	HL         string            `json:"hl"`
	Expand     bool              `json:"expand"`
	Analysis   bool              `json:"analysis"`
	Properties *[]*PropertyField `json:"properties"`
}

type ExpandEVertexRes struct {
	Id         string       `json:"id"`
	Class      string       `json:"class"`
	Name       string       `json:"name"`
	Expand     bool         `json:"expand"`
	Properties *[]*Property `json:"properties"`
}

// PropertyField 数据字段对象
type PropertyField struct {
	Name  string `json:"name"`
	Value string `json:"value"`
	//DataType string
	HL string `json:"hl"`
}

type Property struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type HighLight struct {
	N string
	V string
}

type HighLightRes struct {
	HLRes []HighLight
}

type SearchEdgesRes struct {
	InE  *[]*Edges `json:"in_e"`
	OutE *[]*Edges `json:"out_e"`
}

// Edges 边分组对象
type Edges struct {
	Class string `json:"class"`
	Count string `json:"count"`
}

// EdgeRes 边对象
type EdgeRes struct {
	Id         string            `json:"id"`
	Class      string            `json:"class"`
	Name       string            `json:"name"`
	Properties *[]*Property      `json:"properties"`
	InV        *ExpandEVertexRes `json:"in_v"`
	OutV       *ExpandEVertexRes `json:"out_v"`
}

//SearchRes 返回节点计数
type SearchVRes struct {
	Time     string        `json:"time"`
	Count    string        `json:"count"`
	Vertexes *[]*VertexRes `json:"vertexes"`
}

//中间件 searchV
func KGSearchV(id, class, q string, page, size int32, queryAll bool, SearchFilterArgs *utils.SearchFilterArgs) (httpcode int, response interface{}) {
	start := time.Now()

	//kgConf, err := KGConf()
	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if id == k.ID {
			conf = k
			break
		}
	}

	resultSet, err := models.SearchVWithFilter(&conf, class, q, page, size, queryAll, SearchFilterArgs)
	if err != nil {
		return 500, err
	}

	var vRes []*VertexRes
	vRes = make([]*VertexRes, 0)

	switch resultSet.(type) {
	case *orient.VSearchRes:
		res := resultSet.(*orient.VSearchRes)

		for _, r := range res.Res {
			var hlRes []*HighLight
			for _, h := range r.Properties {
				if strings.HasSuffix(h.Name, "_hl") {
					hlRes = append(hlRes, &HighLight{
						N: strings.TrimSuffix(h.Name, "_hl"),
						V: h.Value,
					})
				}
			}

			var propList []*PropertyField
			for _, p := range r.Properties {
				hl := ""
				if strings.HasSuffix(p.Name, "_hl") {
					continue
				}
				for _, h := range hlRes {
					if h.N != p.Name {
						continue
					} else {
						hl = h.V
					}
				}
				if hl == "" {
					hl = p.Value
				}
				propList = append(propList, &PropertyField{
					Name:  p.Name,
					Value: p.Value,
					//DataType:  p.DataType,
					HL: hl,
				})
			}

			hlName := ""
			for _, a := range propList {
				if a.Value == r.Name {
					hlName = a.HL
				}
			}
			if hlName == "" {
				hlName = r.Name
			}

			vRes = append(vRes, &VertexRes{
				Id:         r.Rid,
				Class:      r.Class,
				Name:       r.Name,
				HL:         hlName,
				Expand:     r.Expand,
				Properties: &propList,
				Analysis:   r.Analysis,
			})
		}

		Time := time.Since(start).Seconds()

		data := &SearchVRes{
			Count:    strconv.FormatUint(res.Counts, 10),
			Time:     strconv.FormatFloat(Time, 'f', 2, 64) + "s",
			Vertexes: &vRes,
		}
		return http.StatusOK, data

	case *nebula.VSearchRes:
		res := resultSet.(*nebula.VSearchRes)

		var hlName string
		for _, r := range res.Res {
			var propList []*PropertyField
			for _, p := range r.Properties {
				propList = append(propList, &PropertyField{
					Name:  p.Name,
					Value: p.Value,
					HL:    p.HL,
				})

				if p.Name == "name" {
					hlName = p.HL
				}
			}

			vRes = append(vRes, &VertexRes{
				Id:         r.Rid,
				Class:      r.Class,
				Name:       r.Name,
				HL:         hlName,
				Expand:     r.Expand,
				Analysis:   r.Analysis,
				Properties: &propList,
			})
		}

		Time := time.Since(start).Seconds()

		return http.StatusOK, &SearchVRes{
			Count:    strconv.FormatUint(res.Counts, 10),
			Time:     strconv.FormatFloat(Time, 'f', 2, 64) + "s",
			Vertexes: &vRes,
		}
	default:
		return http.StatusOK, nil
	}
}

func KGSearchE(id, rid string) (httpcode int, response interface{}) {
	//kgConf, err := KGConf()
	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if id == k.ID {
			conf = k
			break
		}
	}

	resultSet, err := models.SearchE(&conf, rid)

	if err != nil {
		return 500, err
	}

	var inE, outE []*Edges

	switch resultSet.(type) {
	case orient.EdgeRes:
		res := resultSet.(orient.EdgeRes)
		for _, e := range res.InE {
			inE = append(inE, &Edges{
				Class: e.Class,
				Count: strconv.FormatFloat(e.Count, 'f', -1, 64),
			})
		}

		for _, e := range res.OutE {
			outE = append(outE, &Edges{
				Class: e.Class,
				Count: strconv.FormatFloat(e.Count, 'f', -1, 64),
			})
		}

	case nebula.EdgeRes:
		res := resultSet.(nebula.EdgeRes)
		for _, e := range res.InE {
			inE = append(inE, &Edges{
				Class: e.Class,
				Count: strconv.FormatFloat(e.Count, 'f', -1, 64),
			})
		}

		for _, e := range res.OutE {
			outE = append(outE, &Edges{
				Class: e.Class,
				Count: strconv.FormatFloat(e.Count, 'f', -1, 64),
			})
		}
	}

	data := &SearchEdgesRes{
		InE:  &inE,
		OutE: &outE,
	}

	return http.StatusOK, data
}

func KGExpandE(id, class, io, rid string, page, size int32) (httpcode int, response interface{}) {
	var res []*EdgeRes

	//kgConf, err := KGConf()
	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if id == k.ID {
			conf = k
			break
		}
	}

	resultSet, err := models.ExpandE(&conf, class, rid, io, page, size)

	if err != nil {
		return 500, err
	}

	switch resultSet.(type) {
	case orient.ESearchRes:
		eRes := resultSet.(orient.ESearchRes)
		for _, eRes := range eRes.Res {
			var propList []*Property
			for _, p := range eRes.Properties {
				propList = append(propList, &Property{
					Name:  p.Name,
					Value: p.Value,
				})
			}

			er := &EdgeRes{
				Id:         eRes.Rid,
				Class:      eRes.Class,
				Name:       eRes.Name,
				Properties: &propList,
				InV:        nil,
				OutV:       nil,
			}

			var VRec orient.VRecord
			if io == "in" {
				VRec = eRes.Out
			} else {
				VRec = eRes.In
			}

			var vPropList []*Property
			for _, p := range VRec.Properties {
				vPropList = append(vPropList, &Property{
					Name:  p.Name,
					Value: p.Value,
				})
			}

			var vRes = &ExpandEVertexRes{
				Id:         VRec.Rid,
				Class:      VRec.Class,
				Name:       VRec.Name,
				Expand:     VRec.Expand,
				Properties: &vPropList,
			}

			if io == "in" {
				er.OutV = vRes
			} else {
				er.InV = vRes
			}

			res = append(res, er)
		}

	case nebula.ESearchRes:
		eRes := resultSet.(nebula.ESearchRes)
		for _, eRes := range eRes.Res {
			var propList []*Property
			for _, p := range eRes.Properties {
				propList = append(propList, &Property{
					Name:  p.Name,
					Value: p.Value,
				})
			}

			er := &EdgeRes{
				Id:         eRes.Rid,
				Class:      eRes.Class,
				Name:       eRes.Name,
				Properties: &propList,
				InV:        nil,
				OutV:       nil,
			}

			var VRec nebula.VRecord
			if io == "in" {
				VRec = eRes.Out
			} else {
				VRec = eRes.In
			}

			var vPropList []*Property
			for _, p := range VRec.Properties {
				vPropList = append(vPropList, &Property{
					Name:  p.Name,
					Value: p.Value,
				})
			}

			var vRes = &ExpandEVertexRes{
				Id:         VRec.Rid,
				Class:      VRec.Class,
				Name:       VRec.Name,
				Expand:     VRec.Expand,
				Properties: &vPropList,
			}

			if io == "in" {
				er.OutV = vRes
			} else {
				er.InV = vRes
			}

			res = append(res, er)
		}

	}
	return http.StatusOK, res
}

// --------------------------------
// SQL search RESTful API
// --------------------------------

type SearchSQLRes struct {
	Res  interface{} `json:"res"`
	Time string      `json:"time"`
}

// searchSQL 根据sql进行检索
func SearchSQL(id string, sql []string, mode string, transaction bool) (httpcode int, response interface{}) {
	start := time.Now()

	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if id == k.ID {
			// 查询图谱状态
			if k.Status != "normal" {
				return 500, utils.ErrInfo(utils.ErrInternalErr, errors.New("graph not available"))
			}

			conf = k
			break
		}
	}

	var res = new(orient.QuerySQLRes)

	err = res.SearchSQL(&conf, sql, mode, transaction)

	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	Time := time.Since(start).Seconds()

	result := &SearchSQLRes{
		Time: strconv.FormatFloat(Time, 'f', 2, 64) + "s",
		Res:  res.Res,
	}

	return http.StatusOK, result
}

type ExpandProperty struct {
	Name  string `json:"n"`
	Value string `json:"v"`
}

// ExpandVEdgeRes 扩展点对象
type ExpandVEdgeRes struct {
	ID         string            `json:"id"`
	Class      string            `json:"class"`
	Alias      string            `json:"alias"`
	Color      string            `json:"color"`
	Name       string            `json:"name"`
	Properties []*ExpandProperty `json:"properties"`
}

// ExpandVertexRes 扩展顶点返回对象
type ExpandVertexRes struct {
	ID         string            `json:"id"`
	Class      string            `json:"class"`
	Color      string            `json:"color"`
	Alias      string            `json:"alias"`
	Name       string            `json:"name"`
	Expand     bool              `json:"expand"`
	Analysis   bool              `json:"analysis"`
	Properties []*ExpandProperty `json:"properties"`
	InE        []*ExpandVEdgeRes `json:"in_e"`
	OutE       []*ExpandVEdgeRes `json:"out_e"`
}

func KGExpandV(id, class, io, rid, name string, page, size int32) (httpcode int, response interface{}) {
	var res []*ExpandVertexRes

	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if id == k.ID {
			conf = k
			break
		}
	}

	resultSet, err := models.ExpandV(&conf, class, rid, io, name, page, size)

	if err != nil {
		return 500, err
	}

	switch resultSet.(type) {
	case orient.ExpandVRes:
		vRes := resultSet.(orient.ExpandVRes)
		for _, r := range vRes.Res {
			var propList []*ExpandProperty
			for _, p := range r.Properties {
				propList = append(propList, &ExpandProperty{
					Name:  p.Name,
					Value: p.Value,
				})
			}

			vr := &ExpandVertexRes{
				ID:         r.Rid,
				Class:      r.Class,
				Name:       r.Name,
				Color:      r.Color,
				Alias:      r.Alias,
				Analysis:   r.Analysis,
				Expand:     r.Expand,
				Properties: propList,
			}

			for _, e := range r.InE {
				var vPropList []*ExpandProperty
				for _, p := range e.Properties {
					vPropList = append(vPropList, &ExpandProperty{
						Name:  p.Name,
						Value: p.Value,
					})
				}

				var eRes = &ExpandVEdgeRes{
					ID:         e.Rid,
					Class:      e.Class,
					Name:       e.Name,
					Alias:      e.Alias,
					Color:      e.Color,
					Properties: vPropList,
				}
				vr.InE = append(vr.InE, eRes)
			}
			for _, e := range r.OutE {
				var vPropList []*ExpandProperty
				for _, p := range e.Properties {
					vPropList = append(vPropList, &ExpandProperty{
						Name:  p.Name,
						Value: p.Value,
					})
				}

				var eRes = &ExpandVEdgeRes{
					ID:         e.Rid,
					Class:      e.Class,
					Name:       e.Name,
					Alias:      e.Alias,
					Color:      e.Color,
					Properties: vPropList,
				}
				vr.OutE = append(vr.OutE, eRes)
			}
			res = append(res, vr)
		}

	case nebula.ExpandVRes:
		vRes := resultSet.(nebula.ExpandVRes)
		for _, r := range vRes.Res {
			var propList []*ExpandProperty
			for _, p := range r.Properties {
				propList = append(propList, &ExpandProperty{
					Name:  p.Name,
					Value: p.Value,
				})
			}

			vr := &ExpandVertexRes{
				ID:         r.Rid,
				Class:      r.Class,
				Name:       r.Name,
				Color:      r.Color,
				Alias:      r.Alias,
				Analysis:   r.Analysis,
				Expand:     r.Expand,
				Properties: propList,
			}

			for _, e := range r.InE {
				var vPropList []*ExpandProperty
				for _, p := range e.Properties {
					vPropList = append(vPropList, &ExpandProperty{
						Name:  p.Name,
						Value: p.Value,
					})
				}

				var eRes = &ExpandVEdgeRes{
					ID:         e.Rid,
					Class:      e.Class,
					Name:       e.Name,
					Alias:      e.Alias,
					Color:      e.Color,
					Properties: vPropList,
				}
				vr.InE = append(vr.InE, eRes)
			}
			for _, e := range r.OutE {
				var vPropList []*ExpandProperty
				for _, p := range e.Properties {
					vPropList = append(vPropList, &ExpandProperty{
						Name:  p.Name,
						Value: p.Value,
					})
				}

				var eRes = &ExpandVEdgeRes{
					ID:         e.Rid,
					Class:      e.Class,
					Name:       e.Name,
					Alias:      e.Alias,
					Color:      e.Color,
					Properties: vPropList,
				}
				vr.OutE = append(vr.OutE, eRes)
			}
			res = append(res, vr)
		}
	}
	return http.StatusOK, res
}

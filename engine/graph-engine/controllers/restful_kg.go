package controllers

import (
	"errors"
	"graph-engine/models"
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
)

// -------------------------------------------------
// 图谱列表
// -------------------------------------------------

// KG 知识图谱
type KG struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Status       string `json:"status"`
	TaskStatus   string `json:"task_status"`
	ConfigStatus string `json:"config_status"`
	KGconfid     string `json:"kg_confid"`
	//CreateUser   string    `json:"create_user"`
	CreateTime string `json:"create_time"`
	//UpdateUser   string    `json:"update_user"`
	UpdateTime string    `json:"update_time"`
	Onto       *Ontology `json:"onto"`
}

// Ontology 本体类
type Ontology struct {
	V       []*VertexResolver `json:"v"`
	E       []*EdgeResolver   `json:"e"`
	VCount  string            `json:"v_count"`
	ECount  string            `json:"e_count"`
	VPCount string            `json:"vp_count"`
	EPCount string            `json:"ep_count"`
	PCount  string            `json:"p_count"`
	CCount  string            `json:"c_count"`
	conf    *utils.KGConf
	mutex   sync.Mutex
}

// VertexResolver 获取属性节点
type VertexResolver struct {
	v *Vertex
}

// EdgeResolver 获取边对象
type EdgeResolver struct {
	e *Edge
}

// Edge 边对象
type Edge struct {
	Class      string    `json:"class"`
	Name       string    `json:"name"`
	Properties []*Proper `json:"properties"`
	//Type       int32	`json:"type"`
	In      string    `json:"in"`
	Out     string    `json:"out"`
	Count   string    `json:"count"`
	Indexes *[]*Index `json:"indexes"`
}

// Vertex 顶点属性
type Vertex struct {
	Class      string    `json:"class"`
	Name       string    `json:"name"`
	Count      string    `json:"count"`
	Properties []*Proper `json:"properties"`
	Indexes    *[]*Index `json:"indexes"`
}

// Index 索引
type Index struct {
	Name       string    `json:"name"`
	Type       string    `json:"type"`
	Properties *[]string `json:"properties"`
	// EngineField     string
}

// KGResovler 知识图谱返回对象
type KGResovler struct {
	KG       *KG
	DBConfig utils.KGConf
}

// KGResult 图谱列表结果
type KGResult struct {
	Count  int32
	KGList *[]*KGResovler
}

// KGListRes 图谱列表结果
type KGListRes struct {
	Count  int32     `json:"count"`
	KGList *[]*KGRes `json:"kg_list"`
}

type KGRes struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Status       string `json:"status"`
	TaskStatus   string `json:"task_status"`
	ConfigStatus string `json:"config_status"`
	KGconfid     string `json:"kg_confid"`
	//CreateUser   string     `json:"create_user"`
	CreateTime string `json:"create_time"`
	//UpdateUser   string     `json:"update_user"`
	UpdateTime string     `json:"update_time"`
	Onto       *OntoCount `json:"onto"`
}

// Ontology 本体类
type OntoCount struct {
	VCount string `json:"v_count"`
	ECount string `json:"e_count"`
	CCount string `json:"c_count"`
}

// 获取图谱列表
func KGList(authorType int, graphName string, graphStatus string, page int32, size int32) (httpcode int, response interface{}) {
	//kgConf, err := KGConf()
	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var res []*KGResovler

	if page == 0 {
		return http.StatusOK, &KGResult{
			Count:  int32(len(kgConf)),
			KGList: &res,
		}
	}

	// Page 传入负值时，直接获取全部的 list
	for _, k := range kgConf {
		//if page > 0 && (i < int((page-1)*size) || i > int(page*(size)-1)) {
		//	continue
		//}

		// 图谱搜索
		switch {
		case graphStatus != "":
			if graphName != "" {
				if graphStatus == k.Status && strings.Contains(strings.ToLower(k.Name), strings.ToLower(graphName)) {
					kg := KG{
						ID:           k.ID,
						Name:         k.Name,
						Status:       k.Status,
						TaskStatus:   k.TaskStatus,
						ConfigStatus: k.ConfigStatus,
						KGconfid:     k.KGConfID,
						//CreateUser:   k.CreateUser,
						CreateTime: k.CreateTime,
						//UpdateUser:   k.UpdateUser,
						UpdateTime: k.UpdateTime,
						Onto:       nil,
					}

					res = append(
						res,
						&KGResovler{
							KG:       &kg,
							DBConfig: k,
						})
				}
			} else {
				if graphStatus == k.Status {
					kg := KG{
						ID:           k.ID,
						Name:         k.Name,
						Status:       k.Status,
						TaskStatus:   k.TaskStatus,
						ConfigStatus: k.ConfigStatus,
						KGconfid:     k.KGConfID,
						//CreateUser:   k.CreateUser,
						CreateTime: k.CreateTime,
						//UpdateUser:   k.UpdateUser,
						UpdateTime: k.UpdateTime,
						Onto:       nil,
					}

					res = append(
						res,
						&KGResovler{
							KG:       &kg,
							DBConfig: k,
						})
				}
			}

		case graphStatus == "":
			if graphName != "" {
				if strings.Contains(strings.ToLower(k.Name), strings.ToLower(graphName)) {
					kg := KG{
						ID:           k.ID,
						Name:         k.Name,
						Status:       k.Status,
						TaskStatus:   k.TaskStatus,
						ConfigStatus: k.ConfigStatus,
						KGconfid:     k.KGConfID,
						//CreateUser:   k.CreateUser,
						CreateTime: k.CreateTime,
						//UpdateUser:   k.UpdateUser,
						UpdateTime: k.UpdateTime,
						Onto:       nil,
					}

					res = append(
						res,
						&KGResovler{
							KG:       &kg,
							DBConfig: k,
						})
				}
			} else {
				kg := KG{
					ID:           k.ID,
					Name:         k.Name,
					Status:       k.Status,
					TaskStatus:   k.TaskStatus,
					ConfigStatus: k.ConfigStatus,
					KGconfid:     k.KGConfID,
					//CreateUser:   k.CreateUser,
					CreateTime: k.CreateTime,
					//UpdateUser:   k.UpdateUser,
					UpdateTime: k.UpdateTime,
					Onto:       nil,
				}

				res = append(
					res,
					&KGResovler{
						KG:       &kg,
						DBConfig: k,
					})
			}
		}
	}

	var graphRes []*KGResovler
	// 分页, page为负，返回全部list
	for i, graphList := range res {
		if page > 0 && (i < int((page-1)*size) || i > int(page*(size)-1)) {
			continue
		}
		graphRes = append(graphRes, graphList)
	}

	var kglist []*KGRes
	for _, r := range graphRes {
		// 用户管理: 1 为普通用户，只可查看normal图谱； 0 为管理员
		switch authorType {
		case 1:
			if r.KG.ConfigStatus != "edit" {
				r.KG.Onto, err = Onto(r)
				if err != nil {
					return 500, utils.ErrInfo(utils.ErrInternalErr, err)
				}

				ontoCount := OntoCount{
					VCount: r.KG.Onto.VCount,
					ECount: r.KG.Onto.ECount,
					CCount: r.KG.Onto.CCount,
				}
				kg := &KGRes{
					ID:           r.KG.ID,
					Name:         r.KG.Name,
					Status:       r.KG.Status,
					TaskStatus:   r.KG.TaskStatus,
					ConfigStatus: r.KG.ConfigStatus,
					KGconfid:     r.KG.KGconfid,
					//CreateUser:   r.KG.CreateUser,
					CreateTime: r.KG.CreateTime,
					//UpdateUser:   r.KG.UpdateUser,
					UpdateTime: r.KG.UpdateTime,
					Onto:       &ontoCount,
				}

				kglist = append(kglist, kg)
			}
		case 0:
			r.KG.Onto, err = Onto(r)
			if err != nil {
				return 500, utils.ErrInfo(utils.ErrInternalErr, err)
			}

			ontoCount := OntoCount{
				VCount: r.KG.Onto.VCount,
				ECount: r.KG.Onto.ECount,
				CCount: r.KG.Onto.CCount,
			}
			kg := &KGRes{
				ID:           r.KG.ID,
				Name:         r.KG.Name,
				Status:       r.KG.Status,
				TaskStatus:   r.KG.TaskStatus,
				ConfigStatus: r.KG.ConfigStatus,
				KGconfid:     r.KG.KGconfid,
				//CreateUser:   r.KG.CreateUser,
				CreateTime: r.KG.CreateTime,
				//UpdateUser:   r.KG.UpdateUser,
				UpdateTime: r.KG.UpdateTime,
				Onto:       &ontoCount,
			}

			kglist = append(kglist, kg)

		}
	}

	data := &KGListRes{
		Count:  int32(len(res)),
		KGList: &kglist,
	}

	return http.StatusOK, data
}

// Onto 返回图谱本体
func Onto(r *KGResovler) (*Ontology, error) {
	// edit状态图谱不检索实体个数
	var vc, ec, vpc, epc, pc, cc string
	var err error

	switch r.DBConfig.Type {
	case "orientdb":
		vcount, ecount, vpcount, epcount, pcount, e := orient.GetKnowledgeCount(&r.DBConfig)
		vc, ec = strconv.FormatUint(vcount, 10), strconv.FormatUint(ecount, 10)
		vpc, epc, pc = strconv.FormatUint(vpcount, 10), strconv.FormatUint(epcount, 10), strconv.FormatUint(pcount, 10)
		err = e

	case "nebula":
		vcount, ecount, vpcount, epcount, pcount, e := nebula.GetKnowledgeCount(&r.DBConfig)
		vc, ec = strconv.FormatUint(vcount, 10), strconv.FormatUint(ecount, 10)
		vpc, epc, pc = strconv.FormatUint(vpcount, 10), strconv.FormatUint(epcount, 10), strconv.FormatUint(pcount, 10)
		err = e
	}

	if r.KG.Onto == nil {
		r.KG.Onto = &Ontology{
			VCount:  vc,
			ECount:  ec,
			VPCount: vpc,
			EPCount: epc,
			PCount:  pc,
			CCount:  cc,
			conf:    &r.DBConfig,
		}
	}

	if err != nil {
		r.KG.Onto = &Ontology{
			VCount:  "-",
			ECount:  "-",
			VPCount: "-",
			EPCount: "-",
			PCount:  "-",
			CCount:  "-",
			conf:    &r.DBConfig,
		}
	}

	return r.KG.Onto, nil
}

// -------------------------------------------------
// 图谱详情
// -------------------------------------------------

type KGInfoRes struct {
	ID   string     `json:"id"`
	Name string     `json:"name"`
	Onto *OntoClass `json:"onto"`
}

type Proper struct {
	Name  string `json:"name"`
	DType string `json:"d_type"`
	//Opt bool	`json:"opt"`
}

type OntoClass struct {
	VCount string    `json:"v_count"`
	ECount string    `json:"e_count"`
	V      []*Vertex `json:"v"`
	E      []*Edge   `json:"e"`
}

// 图谱详情
func KGInfo(id string) (httpcode int, response interface{}) {
	//kgConf, err := KGConf()
	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var res *KGResovler = nil
	var data KGInfoRes

	for _, k := range kgConf {
		if id == k.DB { // 天津项目需要基于KDB_name查询详情
			kg := KG{
				ID:   k.ID,
				Name: k.Name,
				Onto: nil,
			}

			res = &KGResovler{
				KG:       &kg,
				DBConfig: k,
			}

			onto, err := Onto(res)
			res.KG.Onto = onto
			if err != nil {
				return 500, utils.ErrInfo(utils.ErrInternalErr, err)
			}

			res.KG.Onto.V, err = V(res.KG.Onto)
			if err != nil {
				return 500, utils.ErrInfo(utils.ErrInternalErr, err)
				//c.JSON(500, utils.NewError(utils.ErrInternalErr, err))
			}
			res.KG.Onto.E, err = E(res.KG.Onto)
			if err != nil {
				return 500, utils.ErrInfo(utils.ErrInternalErr, err)
			}

			var ontoClass OntoClass
			for _, v := range res.KG.Onto.V {
				ontoClass.V = append(ontoClass.V, v.v)
			}
			for _, e := range res.KG.Onto.E {
				ontoClass.E = append(ontoClass.E, e.e)
			}

			ontoClass.VCount = onto.VCount
			ontoClass.ECount = onto.ECount

			data = KGInfoRes{
				ID:   res.KG.ID,
				Name: res.KG.Name,
				Onto: &ontoClass,
			}

			break
		}
	}

	if res == nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	//c.JSON(http.StatusOK, gin.H{
	//	"res": data,
	//})
	return http.StatusOK, data
}

// V 获取顶点信息
func V(r *Ontology) ([]*VertexResolver, error) {
	var err error
	defer r.mutex.Unlock()

	r.mutex.Lock()
	if len(r.V) == 0 {
		res, err := getKGSchema(r.conf)
		if err != nil {
			return r.V, err
		}
		r.translate(res)

	}
	return r.V, err
}

// E 获取边信息
func E(r *Ontology) ([]*EdgeResolver, error) {
	var err error
	defer r.mutex.Unlock()

	r.mutex.Lock()
	if len(r.E) == 0 {
		res, err := getKGSchema(r.conf)
		if err != nil {
			return r.E, err
		}
		r.translate(res)
	}
	return r.E, err
}

func getKGSchema(conf *utils.KGConf) (orient.SchemaInterface, error) {
	switch conf.Type {
	case "orientdb":
		var sc orient.Schema
		err := sc.GetSchema(conf)
		if err != nil {
			return nil, err
		}
		return &sc, nil
	case "nebula":
		var sc nebula.Schema
		err := sc.GetSchema(conf)
		if err != nil {
			return nil, err
		}
		return &sc, nil
	default:
		return nil, nil
	}
}

func (r *Ontology) translate(sc models.SchemaInterface) {
	switch sc.(type) {
	case *orient.Schema:
		scOrient := sc.(*orient.Schema)
		r.translateOrient(scOrient)
	case *nebula.Schema:
		scNebula := sc.(*nebula.Schema)
		r.translateNebula(scNebula)
	}
}

func (r *Ontology) translateOrient(sc *orient.Schema) {
	r.ECount = strconv.Itoa(int(sc.ECount))
	r.VCount = strconv.Itoa(int(sc.VCount))

	// 记录顶点信息以获取边的指入指出关系
	vmap := map[string]*VertexResolver{}

	//生成点的信息
	extractIndex := func(des *[]*Index, source *[]orient.Index) {
		for _, i := range *source {
			index := Index{
				Name:       i.Name,
				Type:       i.Type,
				Properties: &i.Fields,
			}

			*des = append(*des, &index)
		}
	}

	for _, v := range sc.V {
		vertex := Vertex{
			Class: v.Name,
			Name:  "name",
			Count: strconv.Itoa(int(v.Records)),
		}

		res := &VertexResolver{v: &vertex}
		vmap[vertex.Class] = res

		// 抽取属性不能通用，因为边还需要处理 in 和 out
		for _, p := range v.Properties {
			prop := Proper{
				Name:  p.Name,
				DType: p.Type,
				//Opt: !p.Mandatory,
			}

			vertex.Properties = append(vertex.Properties, &prop)
		}

		if vertex.Indexes == nil && len(v.Indexes) >= 0 {
			vertex.Indexes = &[]*Index{}
		}

		extractIndex(vertex.Indexes, &v.Indexes)

		r.V = append(r.V, res)
	}

	// 生成边的信息
	for _, e := range sc.E {
		edge := Edge{
			Class: e.Name,
			Name:  "name",
			Count: strconv.Itoa(int(e.Records)),
		}

		for _, p := range e.Properties {
			// 如果出现 in 与 out 则直接跳过
			if strings.ToLower(p.Name) == "in" {
				if v, ok := vmap[p.LinkedClass]; ok {
					edge.In = v.v.Class
				}
				continue
			}

			if strings.ToLower(p.Name) == "out" {
				if v, ok := vmap[p.LinkedClass]; ok {
					edge.Out = v.v.Class
				}
				continue
			}

			prop := Proper{
				Name:  p.Name,
				DType: p.Type,
				//Opt: !p.Mandatory,
			}

			edge.Properties = append(edge.Properties, &prop)

		}

		if edge.Indexes == nil && len(e.Indexes) >= 0 {
			edge.Indexes = &[]*Index{}
		}

		extractIndex(edge.Indexes, &e.Indexes)
		r.E = append(r.E, &EdgeResolver{e: &edge})
	}

	// 对顶点和边进行排序
	sort.Sort(vertexSlice(r.V))
	sort.Sort(edegSlice(r.E))

	// 顶点和边的类型总数
	r.CCount = strconv.Itoa(len(r.E) + len(r.V))
}

func (r *Ontology) translateNebula(sc *nebula.Schema) {
	r.ECount = strconv.Itoa(int(sc.ECount))
	r.VCount = strconv.Itoa(int(sc.VCount))

	// 记录顶点信息以获取边的指入指出关系
	vmap := map[string]*VertexResolver{}

	// 生成点的信息
	extractIndex := func(des *[]*Index, source *[]nebula.Index) {
		for _, i := range *source {
			fields := i.Fields
			index := Index{
				Name:       i.Name,
				Type:       i.Type,
				Properties: &fields,
			}

			*des = append(*des, &index)
		}
	}

	for _, v := range sc.V {
		vertex := Vertex{
			Class: v.Name,
			Name:  "name",
			Count: strconv.Itoa(int(v.Records)),
		}

		res := &VertexResolver{v: &vertex}
		vmap[vertex.Class] = res

		// 抽取属性不能通用，因为边还需要处理 in 和 out
		for _, p := range v.Properties {
			prop := Proper{
				Name:  p.Name,
				DType: p.Type,
			}

			vertex.Properties = append(vertex.Properties, &prop)
		}

		if vertex.Indexes == nil && len(v.Indexes) >= 0 {
			vertex.Indexes = &[]*Index{}
		}

		extractIndex(vertex.Indexes, &v.Indexes)

		r.V = append(r.V, res)
	}

	// 生成边的信息
	for _, e := range sc.E {
		edge := Edge{
			Class: e.Name,
			Name:  "name",
			Count: strconv.Itoa(int(e.Records)),
		}

		for _, p := range e.Properties {

			// 如果出现 in 与 out 则直接跳过
			if strings.ToLower(p.Name) == "in" {
				if v, ok := vmap[p.LinkedClass]; ok {
					edge.In = v.v.Class
				}
				continue
			}

			if strings.ToLower(p.Name) == "out" {
				if v, ok := vmap[p.LinkedClass]; ok {
					edge.Out = v.v.Class
				}
				continue
			}

			prop := Proper{
				Name:  p.Name,
				DType: p.Type,
				//Opt: !p.Mandatory,
			}

			edge.Properties = append(edge.Properties, &prop)

		}

		if edge.Indexes == nil && len(e.Indexes) >= 0 {
			edge.Indexes = &[]*Index{}
		}

		extractIndex(edge.Indexes, &e.Indexes)
		r.E = append(r.E, &EdgeResolver{e: &edge})
	}

	// 对顶点和边进行排序
	sort.Sort(vertexSlice(r.V))
	sort.Sort(edegSlice(r.E))

	// 顶点和边的类型总数
	r.CCount = strconv.Itoa(len(r.E) + len(r.V))
}

// 排序顶点
type vertexSlice []*VertexResolver

func (s vertexSlice) Less(i, j int) bool {
	if s[j].v.Count < s[i].v.Count {
		return true
	}

	if s[j].v.Count == s[i].v.Count {
		return s[j].v.Class > s[i].v.Class
	}

	return false
}

func (s vertexSlice) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s vertexSlice) Len() int {
	return len(s)
}

// 排序边
type edegSlice []*EdgeResolver

func (s edegSlice) Less(i, j int) bool {
	if s[j].e.Count < s[i].e.Count {
		return true
	}

	if s[j].e.Count == s[i].e.Count {
		return s[j].e.Class > s[i].e.Class
	}

	return false
}

func (s edegSlice) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s edegSlice) Len() int {
	return len(s)
}

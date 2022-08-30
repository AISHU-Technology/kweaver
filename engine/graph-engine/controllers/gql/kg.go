// Package gql GQL 的实现
// - 描述：提供 GQL 的 resolver
// - 作者：陈骁 (xavier.chen@eisoo.com)
// - 时间：2020-4-18
package gql

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	graphql "github.com/graph-gophers/graphql-go"
	"graph-engine/logger"
	"graph-engine/models"
	"graph-engine/models/dao"
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"sort"
	"strconv"
	"strings"
	"sync"
)

// KGSchema Schema
var KGSchema = `
	schema {
		query: KGInfoQuery
	}
	
	# 获取知识图谱的基本信息
	type KGInfoQuery {
		# 输出 Hello
		hello: String!
		# 获得知识图谱的列表
		//kglist(graphStatus: String!, graphName: String!, page: Int = 1, size: Int = 20): KGResult!
		# 获取一个知识图谱
		kg(id:ID!): KG
	}

	# 知识图谱列表返回结果
	type KGResult {
		# 知识图谱的数量
		count: Int!
		# 知识图谱列表
		kglist: [KG]
	}


	# 本体对象
	type Ontology {
		# 顶点
		v: [Vertex]!
		# 边
		e: [Edge]!
		# 顶点总数
		vcount: String!
		# 边总数
		ecount: String!
		# 节点属性总数
		vpcount: String!
		# 边属性总数
		epcount: String!
		# 属性总数
		pcount: String!
		# 顶和边的类型总数
		ccount: String!
	}

	# 顶点对象
	type Vertex {
		# 顶点类别
		class: String!
		# 顶点类别别名
		alias: String!
		# 类别颜色
		color: String!
		# 显示名称
		name: String!
		# 抽取模型
		extractmodel: String!
		# 是否可参与高级搜索配置
		configurable: Boolean!
		# 顶点属性
		properties: [Property]!
		# 计数，因为可能超出 int 范围，所以使用 String
		count: String!
		# 索引
		Indexes: [Index!]
	}

	# 边对象
	type Edge {
		# 边类别
		class: String!
		# 边类别别名
		alias: String!
		# 类别颜色
		color: String!
		# 显示名称
		name: String!
		# 抽取模型
		extractmodel: String!
		# 默认配置
		defaultconfigured: Boolean!
		# 边类型，0, 无向 ｜ 1, 有向
		type: Int!
		# 边属性
		properties: [Property]!
		# 边的指入节点
		in: Vertex
		# 边的指出节点
		out: Vertex
		# 计数，因为可能超出 int 范围，所以使用 String
		count: String!
		# 索引
		Indexes: [Index!]
	}

	# 属性对象
	type Property {
		# Name 属性名称
		n: String!
		# Data type数据类型
		dt: String!
		# Optional 是否可选属性
		opt: Boolean!
		# display 是否显示属性
		# dis: Boolean!
		# Display name 显示名称
		# dn: String!
	}

	# 索引
	type Index {
		# 名称
		name: String!
		# 索引类别
		type: String!
		# 属性
		properties: [String!]
		# 引擎
		# engine: String!
	}

	# 知识图谱类型
	type KG {
		# 知识图谱 ID
		id: ID!
		# 知识图谱名称
		name: String!
		# 本体
		onto:Ontology!
		# 图谱状态
		status: String!
		# 任务状态
		taskstatus: String!
		# 触发类型
		triggerType: String!
		# 是否为MQ数据源
		rabbitmqDs: Int!
		# 配置状态
		configstatus: String!
		# 图谱配置id
		kgconfid: ID!
		# 创建者
		//createUser:	String!
		# 创建邮箱
		//createEmail: String!
		# 创建时间
		createTime:	String!
		# 修改者
		//updateUser:	String!
		# 修改邮箱
		//updateEmail: String!
		# 修改时间
		updateTime:	String!
		# 知识图谱信息
		# kginfo:KGInfo!
		# 是否含有as文档模型
		asModel: Boolean!
		# 是否含有高级搜索配置
		advConf: Boolean!
		# 图谱描述
		kgDesc: String!
		propertyId: Float!
		# 存储地址是否有效
		effectiveStorage: Boolean!
	}
`

// ----------------------------------------------------
// 定义数据类型
// ----------------------------------------------------

// Property 节点或者边的属性
type Property struct {
	// name
	NField string
	// Data type
	DTField string
	// Optional
	OptField bool
	// Display
	// DisField bool
	// Display name
	// DNField string
}

// N 获取名称
func (p *Property) N() string {
	return p.NField
}

// DT 获取数据类型
func (p *Property) DT() string {
	return p.DTField
}

// Opt 获取是否为可选属性
func (p *Property) Opt() bool {
	return p.OptField
}

// Dis 获取是否为显示属性
// func (p *Property) Dis() bool {
// 	return p.DisField
// }

// DN 显示名称
// func (p *Property) DN() string {
// 	return p.DNField
// }

// Index 索引
type Index struct {
	NameField       string
	TypeField       string
	PropertiesField *[]string
	// EngineField     string
}

// Name 名称
func (r *Index) Name() string {
	return r.NameField
}

// Type 类型
func (r *Index) Type() string {
	return r.TypeField
}

// Properties 属性
func (r *Index) Properties() *[]string {
	return r.PropertiesField
}

// Vertex 顶点属性
type Vertex struct {
	Class        string
	Alias        string
	Color        string
	Name         string
	Count        uint64
	ExtractModel string
	Configurable bool
	Properties   []*Property
	Indexes      *[]*Index
}

// VertexResolver 获取属性节点
type VertexResolver struct {
	// v KGObject
	V *Vertex
}

// Class 获取顶点的类型
func (r *VertexResolver) Class() string {
	return r.V.Class
}

// Alias 获取顶点类别的别名
func (r *VertexResolver) Alias() string {
	return r.V.Alias
}

// Color 顶点类别颜色
func (r *VertexResolver) Color() string {
	return r.V.Color
}

// Name 获取顶点的类型
func (r *VertexResolver) Name() string {
	return r.V.Name
}

// Model 获取顶点的抽取模型
func (r *VertexResolver) ExtractModel() string {
	return r.V.ExtractModel
}

// Model 获取顶点的抽取模型
func (r *VertexResolver) Configurable() bool {
	if r.V.ExtractModel != "Anysharedocumentmodel" {
		r.V.Configurable = true
	} else {
		if r.V.Class == "label" {
			r.V.Configurable = true
		} else {
			r.V.Configurable = false
		}
	}
	return r.V.Configurable
}

// Properties 获取顶点的属性
func (r *VertexResolver) Properties() []*Property {
	return r.V.Properties
}

// Count 图谱中此类顶点的个数
func (r *VertexResolver) Count() string {
	return strconv.FormatUint(r.V.Count, 10)
}

// Indexes 顶点的索引
func (r *VertexResolver) Indexes() *[]*Index {
	return r.V.Indexes
}

// Edge 边对象
type Edge struct {
	Class             string
	Color             string
	Alias             string
	Name              string
	ExtractModel      string
	DefaultConfigured bool
	Properties        []*Property
	Type              int32
	In                *VertexResolver
	Out               *VertexResolver
	Count             uint64
	Indexes           *[]*Index
}

// EdgeResolver 获取边对象
type EdgeResolver struct {
	E *Edge
}

// Class 获取边类型
func (r *EdgeResolver) Class() string {
	return r.E.Class
}

// Alias 获取边类型的别名
func (r *EdgeResolver) Alias() string {
	return r.E.Alias
}

// Color 顶点类别颜色
func (r *EdgeResolver) Color() string {
	return r.E.Color
}

// Name 获取边的名称
func (r *EdgeResolver) Name() string {
	return r.E.Name
}

// Model 获取边的抽取模型
func (r *EdgeResolver) ExtractModel() string {
	return r.E.ExtractModel
}

// Model 获取边的抽取模型
func (r *EdgeResolver) DefaultConfigured() bool {
	if (r.E.In.V.ExtractModel == "Anysharedocumentmodel" && r.E.In.V.Class != "label") || (r.E.Out.V.ExtractModel == "Anysharedocumentmodel" && r.E.Out.V.Class != "label") {
		r.E.DefaultConfigured = false
	} else {
		r.E.DefaultConfigured = true
	}
	return r.E.DefaultConfigured
}

// Properties 获取边属性
func (r *EdgeResolver) Properties() []*Property {
	return r.E.Properties
}

// Type 获取边的类型 0 无向 ｜ 1 有向
func (r *EdgeResolver) Type() int32 {
	return r.E.Type
}

// In 指入顶点
func (r *EdgeResolver) In() *VertexResolver {
	return r.E.In
}

// Out 指出顶点
func (r *EdgeResolver) Out() *VertexResolver {
	return r.E.Out
}

// Count 图谱中此类顶点的个数
func (r *EdgeResolver) Count() string {
	return strconv.FormatUint(r.E.Count, 10)
}

// Indexes 顶点的索引
func (r *EdgeResolver) Indexes() *[]*Index {
	return r.E.Indexes
}

// Ontology 本体类
type Ontology struct {
	VField       []*VertexResolver
	EField       []*EdgeResolver
	VCountField  string
	ECountField  string
	CCountField  string
	VPCountField string
	EPCountField string
	PCountField  string
	Conf         *utils.KGConf
	mutex        sync.Mutex
}

// V 获取顶点信息
func (r *Ontology) V(context.Context) ([]*VertexResolver, error) {
	var err error
	defer r.mutex.Unlock()

	r.mutex.Lock()
	if len(r.VField) == 0 {
		res, err := models.GetKGSchema(r.Conf)
		if err != nil {
			return r.VField, err
		}
		r.Translate(res)

	}
	return r.VField, err
}

// E 获取边信息
func (r *Ontology) E(context.Context) ([]*EdgeResolver, error) {
	var err error
	defer r.mutex.Unlock()

	r.mutex.Lock()
	if len(r.EField) == 0 {
		res, err := models.GetKGSchema(r.Conf)
		if err != nil {
			return r.EField, err
		}
		r.Translate(res)
	}
	return r.EField, err
}

// VCount 获取顶点计数
func (r *Ontology) VCount() string {
	vcount, _ := strconv.ParseUint(r.VCountField, 10, 64)
	if vcount == maxUint {
		r.VCountField = "-"
		return r.VCountField
	}
	return r.VCountField
}

// ECount 获取顶点计数
func (r *Ontology) ECount() string {
	ecount, _ := strconv.ParseUint(r.ECountField, 10, 64)
	if ecount == maxUint {
		r.ECountField = "-"
		return r.ECountField
	}
	return r.ECountField
}

// CCount 类型总数
func (r *Ontology) CCount() string {
	ccount, _ := strconv.ParseUint(r.CCountField, 10, 64)
	if ccount == maxUint {
		r.CCountField = "-"
		return r.CCountField
	}
	return r.CCountField
}

// VPCount 节点属性总数
func (r *Ontology) VPCount() string {
	vpcount, _ := strconv.ParseUint(r.VPCountField, 10, 64)
	if vpcount == maxUint {
		r.VPCountField = "-"
		return r.VPCountField
	}
	return r.VPCountField
}

// EPCount 边属性总数
func (r *Ontology) EPCount() string {
	epcount, _ := strconv.ParseUint(r.EPCountField, 10, 64)
	if epcount == maxUint {
		r.EPCountField = "-"
		return r.EPCountField
	}
	return r.EPCountField
}

// PCount 属性总数
func (r *Ontology) PCount() string {
	pcount, _ := strconv.ParseUint(r.PCountField, 10, 64)
	if pcount == maxUint {
		r.PCountField = "-"
		return r.PCountField
	}
	return r.PCountField
}

// KG 知识图谱
type KG struct {
	ID               graphql.ID
	Name             string
	Status           string
	TaskStatus       string
	TriggerType      string
	RabbitmqDs       int32
	ConfigStatus     string
	KGconfid         graphql.ID
	CreateTime       string
	UpdateTime       string
	Onto             *Ontology
	ASModel          bool
	AdvConf          bool
	KGDesc           string
	PropertyId       float64
	EffectiveStorage bool
}

// KGResovler 知识图谱返回对象
type KGResovler struct {
	kg       *KG
	dbConfig utils.KGConf
}

// ID 返回图谱 ID
func (r *KGResovler) ID() graphql.ID {
	return r.kg.ID
}

// Name 返回图谱 Name
func (r *KGResovler) Name() string {
	return r.kg.Name
}

// Status 返回图谱状态 Status
func (r *KGResovler) Status() string {
	return r.kg.Status
}

// TaskStatus 返回任务状态 TaskStatus
func (r *KGResovler) TaskStatus() string {
	return r.kg.TaskStatus
}

// TriggerType 触发类型 TriggerType
func (r *KGResovler) TriggerType() string {
	return r.kg.TriggerType
}

// RabbitmqDs 是否为MQ数据类型
func (r *KGResovler) RabbitmqDs() int32 {
	return r.kg.RabbitmqDs
}

// ConfigStatus 返回配置状态 ConfigStatus
func (r *KGResovler) ConfigStatus() string {
	return r.kg.ConfigStatus
}

//	KgConfID 返回谱图配置id
func (r *KGResovler) KGConfID() graphql.ID {
	return r.kg.KGconfid
}

// CreateTime 返回创建时间
func (r *KGResovler) CreateTime() string {
	return r.kg.CreateTime
}

// UpdateTime 返回更新时间
func (r *KGResovler) UpdateTime() string {
	return r.kg.UpdateTime
}

// ASModel 判断是否含有as文档模型
func (r *KGResovler) ASModel() bool {
	return r.kg.ASModel
}

// AdvConf 判断是否含有高级搜索配置
func (r *KGResovler) AdvConf() bool {
	return r.kg.AdvConf
}

// KGDesc 图谱描述
func (r *KGResovler) KGDesc() string {
	return r.kg.KGDesc
}

// PropertyId
func (r *KGResovler) PropertyId() float64 {
	return r.kg.PropertyId
}

// EffectiveStorage 存储地址是否有效
func (r *KGResovler) EffectiveStorage() bool {
	return r.kg.EffectiveStorage
}

//func GetKGSchema(conf *utils.KGConf) (orient.SchemaInterface, error) {
//	switch conf.Type {
//	case "orient":
//		var sc orient.Schema
//		err := sc.GetSchema(conf)
//		if err != nil {
//			return nil, err
//		}
//		return &sc, nil
//	default:
//		return nil, nil
//	}
//}

func (r *Ontology) Translate(sc models.SchemaInterface) {
	switch sc.(type) {
	case *orient.Schema:
		scOrient := sc.(*orient.Schema)
		r.translateOrient(scOrient)
	case *nebula.Schema:
		scNebula := sc.(*nebula.Schema)
		r.translateNebula(scNebula)
	}
}

// 排序顶点
type vertexSlice []*VertexResolver

func (s vertexSlice) Less(i, j int) bool {
	if s[j].V.Count < s[i].V.Count {
		return true
	}

	if s[j].V.Count == s[i].V.Count {
		return s[j].V.Class > s[i].V.Class
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
	if s[j].E.Count < s[i].E.Count {
		return true
	}

	if s[j].E.Count == s[i].E.Count {
		return s[j].E.Class > s[i].E.Class
	}

	return false
}

func (s edegSlice) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s edegSlice) Len() int {
	return len(s)
}

func (r *Ontology) translateNebula(sc *nebula.Schema) {
	r.ECountField = strconv.Itoa(int(sc.ECount))
	r.VCountField = strconv.Itoa(int(sc.VCount))

	// 记录顶点信息以获取边的指入指出关系
	vmap := map[string]*VertexResolver{}

	// 生成点的信息
	extractIndex := func(des *[]*Index, source *[]nebula.Index) {
		for _, i := range *source {
			fields := i.Fields
			index := Index{
				NameField:       i.Name,
				TypeField:       i.Type,
				PropertiesField: &fields,
			}

			*des = append(*des, &index)
		}
	}

	for _, v := range sc.V {
		vertex := Vertex{
			Class:        v.Name,
			Alias:        v.Alias,
			Color:        v.Color,
			Name:         "name",
			Count:        uint64(v.Records),
			ExtractModel: v.ExtractModel,
		}

		res := &VertexResolver{V: &vertex}
		vmap[vertex.Class] = res

		// 抽取属性不能通用，因为边还需要处理 in 和 out
		for _, p := range v.Properties {
			prop := Property{
				NField:   p.Name,
				DTField:  p.Type,
				OptField: !p.Mandatory,
			}

			vertex.Properties = append(vertex.Properties, &prop)
		}

		if vertex.Indexes == nil && len(v.Indexes) >= 0 {
			vertex.Indexes = &[]*Index{}
		}

		extractIndex(vertex.Indexes, &v.Indexes)

		r.VField = append(r.VField, res)
	}

	// 生成边的信息
	for _, e := range sc.E {
		edge := Edge{
			Class:        e.Name,
			Alias:        e.Alias,
			Color:        e.Color,
			Name:         "name",
			Count:        uint64(e.Records),
			ExtractModel: e.ExtractModel,
		}

		for _, p := range e.Properties {

			// 如果出现 in 与 out 则直接跳过
			if strings.ToLower(p.Name) == "in" {
				if v, ok := vmap[p.LinkedClass]; ok {
					edge.In = v
				}
				continue
			}

			if strings.ToLower(p.Name) == "out" {
				if v, ok := vmap[p.LinkedClass]; ok {
					edge.Out = v
				}
				continue
			}

			prop := Property{
				NField:   p.Name,
				DTField:  p.Type,
				OptField: !p.Mandatory,
			}

			edge.Properties = append(edge.Properties, &prop)

		}

		if edge.Indexes == nil && len(e.Indexes) >= 0 {
			edge.Indexes = &[]*Index{}
		}

		extractIndex(edge.Indexes, &e.Indexes)
		r.EField = append(r.EField, &EdgeResolver{E: &edge})
	}

	// 对顶点和边进行排序
	sort.Sort(vertexSlice(r.VField))
	sort.Sort(edegSlice(r.EField))

	// 顶点和边的类型总数
	//r.CCountField = uint64(len(r.EField) + len(r.VField))
	r.CCountField = strconv.Itoa(len(r.EField) + len(r.VField))
}

func (r *Ontology) translateOrient(sc *orient.Schema) {
	r.ECountField = strconv.Itoa(int(sc.ECount))
	r.VCountField = strconv.Itoa(int(sc.VCount))

	// 记录顶点信息以获取边的指入指出关系
	vmap := map[string]*VertexResolver{}

	// 生成点的信息
	extractIndex := func(des *[]*Index, source *[]orient.Index) {
		for _, i := range *source {
			index := Index{
				NameField:       i.Name,
				TypeField:       i.Type,
				PropertiesField: &i.Fields,
			}

			*des = append(*des, &index)
		}
	}

	for _, v := range sc.V {
		vertex := Vertex{
			Class:        v.Name,
			Alias:        v.Alias,
			Color:        v.Color,
			Name:         "name",
			Count:        uint64(v.Records),
			ExtractModel: v.ExtractModel,
		}

		res := &VertexResolver{V: &vertex}
		vmap[vertex.Class] = res

		// 抽取属性不能通用，因为边还需要处理 in 和 out
		for _, p := range v.Properties {
			prop := Property{
				NField:   p.Name,
				DTField:  p.Type,
				OptField: !p.Mandatory,
			}

			vertex.Properties = append(vertex.Properties, &prop)
		}

		if vertex.Indexes == nil && len(v.Indexes) >= 0 {
			vertex.Indexes = &[]*Index{}
		}

		extractIndex(vertex.Indexes, &v.Indexes)

		r.VField = append(r.VField, res)
	}

	// 生成边的信息
	for _, e := range sc.E {
		edge := Edge{
			Class:        e.Name,
			Alias:        e.Alias,
			Color:        e.Color,
			Name:         "name",
			Count:        uint64(e.Records),
			ExtractModel: e.ExtractModel,
		}

		for _, p := range e.Properties {

			// 如果出现 in 与 out 则直接跳过
			if strings.ToLower(p.Name) == "in" {
				if v, ok := vmap[p.LinkedClass]; ok {
					edge.In = v
				}
				continue
			}

			if strings.ToLower(p.Name) == "out" {
				if v, ok := vmap[p.LinkedClass]; ok {
					edge.Out = v
				}
				continue
			}

			prop := Property{
				NField:   p.Name,
				DTField:  p.Type,
				OptField: !p.Mandatory,
			}

			edge.Properties = append(edge.Properties, &prop)

		}

		if edge.Indexes == nil && len(e.Indexes) >= 0 {
			edge.Indexes = &[]*Index{}
		}

		extractIndex(edge.Indexes, &e.Indexes)
		r.EField = append(r.EField, &EdgeResolver{E: &edge})
	}

	// 对顶点和边进行排序
	sort.Sort(vertexSlice(r.VField))
	sort.Sort(edegSlice(r.EField))

	// 顶点和边的类型总数
	//r.CCountField = uint64(len(r.EField) + len(r.VField))
	r.CCountField = strconv.Itoa(len(r.EField) + len(r.VField))
}

// uint 的最大长度
const maxUint = ^uint64(0)

// Onto 返回图谱本体
func (r *KGResovler) Onto(ctx context.Context) (*Ontology, error) {
	var vc, ec, vpc, epc, pc, cc uint64
	var err error

	switch r.dbConfig.Type {
	case "orientdb":
		vcount, ecount, vpcount, epcount, pcount, e := orient.GetKnowledgeCount(&r.dbConfig)
		vc, ec, vpc, epc, pc = vcount, ecount, vpcount, epcount, pcount
		err = e

	case "nebula":
		vcount, ecount, vpcount, epcount, pcount, e := nebula.GetKnowledgeCount(&r.dbConfig)
		vc, ec, vpc, epc, pc = vcount, ecount, vpcount, epcount, pcount
		err = e
	}

	if r.kg.Onto == nil {
		r.kg.Onto = &Ontology{
			VCountField:  strconv.Itoa(int(vc)),
			ECountField:  strconv.Itoa(int(ec)),
			VPCountField: strconv.Itoa(int(vpc)),
			EPCountField: strconv.Itoa(int(epc)),
			PCountField:  strconv.Itoa(int(pc)),
			CCountField:  strconv.Itoa(int(cc)),
			VField:       []*VertexResolver{},
			EField:       []*EdgeResolver{},
			Conf:         &r.dbConfig,
		}
	}

	if err != nil {
		r.kg.Onto = &Ontology{
			VCountField:  strconv.FormatUint(maxUint, 10),
			ECountField:  strconv.FormatUint(maxUint, 10),
			VPCountField: strconv.FormatUint(maxUint, 10),
			EPCountField: strconv.FormatUint(maxUint, 10),
			PCountField:  strconv.FormatUint(maxUint, 10),
			CCountField:  strconv.FormatUint(maxUint, 10),
			VField:       []*VertexResolver{},
			EField:       []*EdgeResolver{},
			Conf:         &r.dbConfig,
		}
		logger.Error(err)
	}

	return r.kg.Onto, nil
}

// KGResult 图谱列表结果
type KGResult struct {
	CountField  int32
	KGListField *[]*KGResovler
}

// Count 知识图谱列表长度
func (r *KGResult) Count() int32 {
	return r.CountField
}

// KGList 知识图谱列表长度
func (r *KGResult) KGList() *[]*KGResovler {
	return r.KGListField
}

// -------------------------------------------------
// 下面是 Query 相关的对象
// -------------------------------------------------

// KGInfoQuery 测试 GQL 输出
type KGInfoQuery struct{}

// Hello 字段的 Resovler
func (q *KGInfoQuery) Hello() string {
	return "Hello, test!"
}

// 分页参数
type paging struct {
	Page int32
	Size int32
}

type filter struct {
	GraphStatus string
	GraphName   string
	paging
}

func getKgListByFilter(k utils.KGConf, authKGResp []interface{}) (KG, error) {
	kg := KG{
		ID:               graphql.ID(k.ID),
		Name:             k.Name,
		Status:           k.Status,
		TaskStatus:       k.TaskStatus,
		TriggerType:      k.TriggerType,
		RabbitmqDs:       k.RabbitmqDs,
		ConfigStatus:     k.ConfigStatus,
		KGconfid:         graphql.ID(k.KGConfID),
		CreateTime:       k.CreateTime,
		UpdateTime:       k.UpdateTime,
		Onto:             nil,
		ASModel:          false,
		AdvConf:          false,
		KGDesc:           k.KGDesc,
		EffectiveStorage: k.EffectiveStorage,
	}

	//判断是否含有as文档模型
	kgidInt, _ := strconv.Atoi(k.ID)
	model, err := dao.GetClassModelType(kgidInt)
	if err != nil {
		return kg, err
	}
	// 手动导入图谱无对应模型
	if model != nil {
		for _, entity := range model.Entity {
			if entity["model"] == "Anysharedocumentmodel" {
				// as模型必须包含document
				if entity["name"] == "document" {
					kg.ASModel = true
					break
				}
			}
		}
	}

	// 判断是否含有高级搜索配置
	advConfList, err := dao.GetConfByKGID(kgidInt)
	if err != nil {
		return kg, err
	}
	if advConfList != nil {
		kg.AdvConf = true
	}

	// propertyId
	for _, v := range authKGResp {
		vMap := v.(map[string]interface{})
		kgid := strconv.FormatFloat(vMap["configId"].(float64), 'f', -1, 64)
		if kg.KGconfid == graphql.ID(kgid) {
			kg.PropertyId = vMap["propertyId"].(float64)
		}
	}

	return kg, nil
}

// KG 获取单个 KG 信息
func (q *KGInfoQuery) KG(ctx context.Context, args struct{ ID graphql.ID }) (*KGResovler, error) {
	c := ctx.Value("Context").(*gin.Context)

	// 天津项目根据KDB_name查询kgid
	id, err := dao.GetKGIDByKGName(string(args.ID))
	if err != nil {
		return nil, err
	}
	if id == "" {
		return nil, utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	// 数据库获取配置
	r, err := utils.GetKGConf()
	if err != nil {
		c.Status(500)
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var res *KGResovler = nil
	for _, k := range r {
		if string(args.ID) == k.DB { // 天津项目根据KDB_name查询kgid
			kg := KG{
				ID:     graphql.ID(k.ID),
				Name:   k.Name,
				Status: k.Status,
				Onto:   nil,
			}

			res = &KGResovler{
				kg:       &kg,
				dbConfig: k,
			}
			break
		}

	}

	if res == nil {
		c.Status(500)
		return res, utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	return res, nil
}

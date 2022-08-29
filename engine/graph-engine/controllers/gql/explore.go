// Package gql GQL 的实现
// - 描述：提供 GQL 的 测试数据
// - 作者：陈骁 (xavier.chen@aishu.cn)
// - 时间：2020-4-25package gql
package gql

import (
	"context"
	"github.com/gin-gonic/gin"
	"gitlab.aishu.cn/anydata-rnd/leo"
	"graph-engine/models"
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"strconv"
	"strings"
	"time"

	"github.com/graph-gophers/graphql-go"
)

// "web-framework/tools"

// "github.com/gin-gonic/gin"
// graphql "github.com/graph-gophers/graphql-go"

// DataQuerySchema 查询返回结果的 GQL Schema
var DataQuerySchema = `
	schema {
		query: DataQuery
	}

	input SearchFilterArgs {
		selectedRids: [String!]
		# 仅支持 "selected" "unselected"
		selected: SelectedEnum
		filter: [Filter!]
	}

	input Filter {
		# 属性名
		property: String!
		# 属性类型，仅支持"STRING" "BOOLEAN" "INTEGER" "FLOAT" "DATETIME" "DOUBLE" "DECIMAL" "DATE"
		pt:	FilterPtEnum!
		# 筛选条件，仅支持"lt"(小于) "gt"(大于) "eq"(等于) "between"(介于)
		condition: FilterConditionEnum!
		# 筛选值
		range: [String!]
	}
	enum SelectedEnum {
		selected
		unselected
	}
	enum FilterPtEnum {
		STRING
		BOOLEAN
		INTEGER
		FLOAT
		DATE
		DATETIME
		DOUBLE
		DECIMAL
		string
		bool
		double
		float
		int
	}
	enum FilterConditionEnum {
		lt
		gt
		eq
		between
	}

	# 查询知识图谱中的数据
	type DataQuery {
		# 查询顶点
		search_v(id: ID!, class: String!, q: String!, search_filter_args:SearchFilterArgs!, page: Int = 1, size: Int = 20, query_all: Boolean!): SearchRes

		# 查询边
		search_e(id: ID!, rid: String!): SearchEdgesRes

		# 展开节点
		//expand_v(id: ID!, io: String, edge_class: [String!]): QueryResult

		# 根据 ID 查询一个顶点
		//get_v(id: ID!, class: String!, rid: String!): [VertexRes!]

		# 根据 ID 查询一个顶点
		expand_e(id: ID!, class: String!, io: String!, rid: String!, page: Int = 1, size: Int = 20): [EdgeRes!]
	}

	# 查询的结构对象
	type QueryResult {
		v:[VertexRes]
		e:[EdgeRes]
	}

	# 查询结果字段
	type PropertyField {
		# 字段名称
		n: String!
		# 值字段，都用 String 的方式，提供更多地灵活性
		v: String!
		# 数据类型字段，根据数据类型解析值字段
		dt: String!
		# 字段值高亮显示
		hl: String!
	}

	# 顶点对象
	type VertexRes {
		# 顶点的 ID
		id: ID!
		# 顶点类别
		class: String!
		# 类别颜色
		color: String!
		# 顶点类别别名
		alias: String!
		# 显示名称
		name: String!
		# 高亮名称
		hl: String!
		# 是否可展
		expand: Boolean!
		# 分析报告
		analysis: Boolean!
		# 属性对象
		properties: [PropertyField!]
		# 节点的入边
		inE: [Edges!]
		# 节点的出边
		outE: [Edges!]
		# 进入节点
		in: [Vertecies!]
		# 指出节点
		out: [Vertecies!]
	}

	# 边对象分组
	type Edges {
		# 边类型
		class: String!
		# 边类别别名
		alias: String!
		# 类别颜色
		color: String!
		# 计数，因为前端默认是 Int32 可能出现超过的情况
		count: String!
		# 边对象
		edges(page: Int = 1, size: Int = 20): [EdgeRes!]
		# 所有的 Id
		ids: [String!]
	}

	# 边对象类别和个数
	type SearchEdgesRes {
		# 进边
		inE: [Edges!]
		# 出边  
		outE: [Edges!]
	}

	# 顶点对象分组
	type Vertecies {
		# 顶点类型
		class: String!
		# 顶点类型别名
		alias: String!
		# 计数，因为前端默认是 Int32 可能出现超过的情况
		count: String!
		# 顶点对象
		vertecies: [VertexRes!]
	}

	# 返回计数与用时
	type SearchRes {
		# 顶点类型
		time: String!
		# 计数，因为前端默认是 Int32 可能出现超过的情况
		count: String!
		# 顶点对象
		vertexes: [VertexRes!]
	}

	# 边对象
	type EdgeRes {
		# 边的 ID
		id: ID!
		# 边类别
		class: String!
		# 边类别别名
		alias: String!
		# 类别颜色
		color: String!
		# 显示名称
		name: String!
		# 属性对象
		properties: [PropertyField!]
		# 边的指入节点
		inV: VertexRes
		# 边的指出节点
		outV: VertexRes
	}
`

// ----------------------------------------------------
// 定义数据类型
// ----------------------------------------------------

// PropertyField 数据字段对象
type PropertyField struct {
	NameField      string
	ValueField     string
	DataTypeField  string
	HighLightField string
}

// N 获取字段名称
func (p *PropertyField) N() string {
	return p.NameField
}

// V 获取字段名称
func (p *PropertyField) V() string {
	return p.ValueField
}

// DT 获取字段名称
func (p *PropertyField) DT() string {
	return p.DataTypeField
}

// HL 字段值高亮
func (p *PropertyField) HL() string {
	return p.HighLightField
}

// SearchRes 返回节点计数
type SearchRes struct {
	TimeField     string
	CountField    string
	VertexesField *[]*VertexRes
}

// Time 获取顶点分组类别
func (v *SearchRes) Time() string {
	return v.TimeField
}

// Count 获取顶点分数计数
func (v *SearchRes) Count() string {
	return v.CountField
}

// Vertexes 获取顶点分数计数
func (v *SearchRes) Vertexes() *[]*VertexRes {
	return v.VertexesField
}

// VertexRes 顶点返回对象
type VertexRes struct {
	IDField         graphql.ID
	ClassField      string
	ColorField      string
	AliasField      string
	NameField       string
	HLField         string
	ExpandField     bool
	AnalysisField   bool
	PropertiesField *[]*PropertyField
	InEField        *[]*Edges
	OutEField       *[]*Edges
	InField         *[]*Vertecies
	OutField        *[]*Vertecies
}

// ID 获取顶点 ID
func (v *VertexRes) ID() graphql.ID {
	return v.IDField
}

// Class 获取顶点类型
func (v *VertexRes) Class() string {
	return v.ClassField
}

// Color 类别颜色
func (v *VertexRes) Color() string {
	return v.ColorField
}

// Alias 获取顶点类型别名
func (v *VertexRes) Alias() string {
	return v.AliasField
}

// Name 获取顶点名
func (v *VertexRes) Name() string {
	return v.NameField
}

// HL 获取高亮顶点名
func (v *VertexRes) HL() string {
	return v.HLField
}

// Expand 顶点是否可展
func (v *VertexRes) Expand() bool {
	return v.ExpandField
}

// Analysis 是否有分析报告
func (v *VertexRes) Analysis() bool {
	return v.AnalysisField
}

// Properties 获取属性
func (v *VertexRes) Properties() *[]*PropertyField {
	if v.PropertiesField != nil {
		return v.PropertiesField
	}

	res := VertexProperties[string(v.IDField)]

	v.PropertiesField = &res

	return v.PropertiesField
}

// InE 顶点的指入边
func (v *VertexRes) InE() *[]*Edges {
	// 获取指入节点
	if v.InEField != nil {
		return v.InEField
	}

	return nil

	//// 找到顶点的入边
	//if strings.ToUpper(v.ClassField) == "CUSTOMER" {
	//	inE := new([]*Edges)
	//	v.InEField = inE
	//
	//	edges := new(Edges)
	//	edges.EdgesField = new([]*EdgeRes)
	//	edges.ClassField = Project2Customer[0].ClassField
	//
	//	for _, e := range Project2Customer {
	//		// 顶点的入边的指出顶点的 ID 与当前 ID 相等
	//		if e.OutVField.IDField == v.IDField {
	//			*edges.EdgesField = append(*edges.EdgesField, e)
	//		}
	//	}
	//
	//	edges.CountField = strconv.Itoa(len(*edges.EdgesField))
	//
	//	*v.InEField = append(*v.InEField, edges)
	//}
	//
	//return v.InEField
}

// OutE 顶点的指出边
func (v *VertexRes) OutE() *[]*Edges {
	// 获取指入节点
	if v.OutEField != nil {
		return v.OutEField
	}
	return nil

	// 找到顶点的入边
	//if strings.ToUpper(v.ClassField) == "PROJECT" {
	//	outE := new([]*Edges)
	//	v.OutEField = outE
	//
	//	edges := new(Edges)
	//	edges.EdgesField = new([]*EdgeRes)
	//	edges.ClassField = Project2Customer[0].ClassField
	//
	//	for _, e := range Project2Customer {
	//		if e.InVField.IDField == v.IDField {
	//			*edges.EdgesField = append(*edges.EdgesField, e)
	//		}
	//	}
	//
	//	edges.CountField = strconv.Itoa(len(*edges.EdgesField))
	//
	//	*v.OutEField = append(*v.OutEField, edges)
	//}
	//
	//return v.OutEField
}

// In 顶点的指入顶点
func (v *VertexRes) In() *[]*Vertecies {
	if v.InField != nil {
		return v.InField
	}

	if strings.ToUpper(v.ClassField) == "CUSTOMER" {
		in := new([]*Vertecies)
		v.InField = in

		vertecies := new(Vertecies)
		vertecies.VeteciesField = new([]*VertexRes)
		vertecies.ClassField = Project2Customer[0].InVField.ClassField

		for _, e := range Project2Customer {
			if e.OutVField.IDField == v.IDField {
				*vertecies.VeteciesField = append(*vertecies.VeteciesField, e.InVField)
			}
		}

		vertecies.CountField = strconv.Itoa(len(*vertecies.VeteciesField))

		*v.InField = append(*v.InField, vertecies)
	}

	return v.InField
}

// Out 顶点的指入对象
func (v *VertexRes) Out() *[]*Vertecies {
	if v.OutField != nil {
		return v.OutField
	}

	if strings.ToUpper(v.ClassField) == "PROJECT" {
		out := new([]*Vertecies)
		v.OutField = out

		vertecies := new(Vertecies)
		vertecies.VeteciesField = new([]*VertexRes)
		vertecies.ClassField = Project2Customer[0].OutVField.ClassField

		for _, e := range Project2Customer {
			if e.InVField.IDField == v.IDField {
				*vertecies.VeteciesField = append(*vertecies.VeteciesField, e.OutVField)
			}
		}

		vertecies.CountField = strconv.Itoa(len(*vertecies.VeteciesField))

		*v.OutField = append(*v.OutField, vertecies)
	}

	return v.OutField
}

// EdgeRes 边对象
type EdgeRes struct {
	IDField         graphql.ID
	ClassField      string
	AliasFeild      string
	ColorField      string
	NameField       string
	PropertiesField *[]*PropertyField
	InVField        *VertexRes
	OutVField       *VertexRes
}

// ID 获取 ID 字段
func (e *EdgeRes) ID() graphql.ID {
	return e.IDField
}

// Class 获取类型字段
func (e *EdgeRes) Class() string {
	return e.ClassField
}

// Alias 获取类型别名
func (e *EdgeRes) Alias() string {
	return e.AliasFeild
}

// Color 类别颜色
func (e *EdgeRes) Color() string {
	return e.ColorField
}

// Name 获取类型字段
func (e *EdgeRes) Name() string {
	return e.NameField
}

// Properties 获取属性对象
func (e *EdgeRes) Properties() *[]*PropertyField {
	if e.PropertiesField != nil {
		return e.PropertiesField
	}

	res := EdgeProperties[string(e.IDField)]
	e.PropertiesField = &res

	return e.PropertiesField
}

// InV 获取指入节点
func (e *EdgeRes) InV() *VertexRes {
	if e.InVField != nil {
		return e.InVField
	}

	for _, i := range Project2Customer {
		if i.IDField == e.IDField {
			e.InVField = i.InVField
		}
	}

	return e.InVField
}

// OutV 获取指出节点
func (e *EdgeRes) OutV() *VertexRes {
	if e.OutVField != nil {
		return e.OutVField
	}

	for _, i := range Project2Customer {
		if i.IDField == e.IDField {
			e.OutVField = i.OutVField
		}
	}

	return e.OutVField
}

// Vertecies 顶点分组对象
type Vertecies struct {
	ClassField    string
	AliasField    string
	CountField    string
	VeteciesField *[]*VertexRes
}

// Class 获取顶点分组类别
func (v *Vertecies) Class() string {
	return v.ClassField
}

// Alias 获取顶点分组类别别名
func (v *Vertecies) Alias() string {
	return v.AliasField
}

// Count 获取顶点分数计数
func (v *Vertecies) Count() string {
	return v.CountField
}

// Vertecies 获取顶点分数计数
func (v *Vertecies) Vertecies() *[]*VertexRes {
	return v.VeteciesField
}

// Edges 边分组对象
type Edges struct {
	ClassField string
	AliasField string
	ColorField string
	CountField string
	EdgesField *[]*EdgeRes
	IDsField   *[]string
	conf       utils.KGConf
	inOut      string
	rid        string
}

// Class 获取边的类型
func (e *Edges) Class() string {
	return e.ClassField
}

// Alias 获取边的类型别名
func (e *Edges) Alias() string {
	return e.AliasField
}

// Color 类别颜色
func (e *Edges) Color() string {
	return e.ColorField
}

// Count 获取边的类型
func (e *Edges) Count() string {
	return e.CountField
}

func (e *Edges) IDs() *[]string {
	return e.IDsField

}

// Edges 获取边对象
func (e *Edges) Edges(args *paging) *[]*EdgeRes {
	var res []*EdgeRes

	if args.Page <= 0 || len(*e.IDsField) == 0 {
		return &res
	}

	// 为了使用 eid 查询更加方便，所以用切片方式处理 eid
	//left, right := int((args.Page-1)*args.Size), int(args.Page*(args.Size)-1)
	//
	//if len(*e.IDsField) < int(right) {
	//	right = len(*e.IDsField)
	//}

	//eIDs := (*e.IDsField)[left:right]

	var eRes orient.ESearchRes

	eRes.GetE(&e.conf, e.ClassField, e.rid, e.inOut, args.Page, args.Size)

	for _, eRes := range eRes.Res {

		var propList []*PropertyField
		for _, p := range eRes.Properties {
			propList = append(propList, &PropertyField{
				NameField:     p.Name,
				DataTypeField: p.DataType,
				ValueField:    p.Value,
			})
		}

		er := &EdgeRes{
			IDField:         graphql.ID(eRes.Rid),
			ClassField:      eRes.Class,
			NameField:       "name",
			PropertiesField: &propList,
			InVField:        nil,
			OutVField:       nil,
		}

		var VRec orient.VRecord
		if e.inOut == "in" {
			VRec = eRes.Out
		} else {
			VRec = eRes.In
		}

		var vPropList []*PropertyField
		for _, p := range VRec.Properties {
			vPropList = append(vPropList, &PropertyField{
				NameField:     p.Name,
				DataTypeField: p.DataType,
				ValueField:    p.Value,
			})
		}

		var vRes = &VertexRes{
			IDField:         graphql.ID(VRec.Rid),
			ClassField:      VRec.Class,
			NameField:       "name",
			PropertiesField: &vPropList,
			InEField:        nil,
			OutEField:       nil,
			InField:         nil,
			OutField:        nil,
		}

		if e.inOut == "in" {
			er.OutVField = vRes
		} else {
			er.InVField = vRes
		}

		res = append(res, er)
	}

	e.EdgesField = &res

	return e.EdgesField
}

//type SearchEdges struct {
//	ClassField string
//	CountField string
//}
//
//func (e *SearchEdges) Class() string {
//	return e.ClassField
//}
//
//func (e *SearchEdges) Count() string {
//	return e.CountField
//}

type SearchEdgesRes struct {
	InEdge  *[]*Edges
	OutEdge *[]*Edges
}

func (e *SearchEdgesRes) InE() *[]*Edges {
	return e.InEdge
}

func (e *SearchEdgesRes) OutE() *[]*Edges {
	return e.OutEdge
}

// QueryResult 图查询的结果
type QueryResult struct {
	vField []*VertexRes
	eField []*EdgeRes
}

// V 获取所有的顶点信息
func (r *QueryResult) V() *[]*VertexRes {
	return &r.vField
}

// E 获取所有的顶点信息
func (r *QueryResult) E() *[]*EdgeRes {
	return &r.eField
}

// -------------------------------------------------
// 下面是 Query 相关的对象
// -------------------------------------------------

// DataQuery 测试 GQL 输出
type DataQuery struct{}

// SearchArgs 查询参数
type SearchArgs struct {
	ID    graphql.ID
	Class string
	// 查询关键词
	Q        string
	QueryAll bool
	paging
	SearchFilterArgs *utils.SearchFilterArgs
}

type GetVArgs struct {
	ID    graphql.ID
	Class string
	Rid   string
}

type HighLight struct {
	N string
	V string
}

type HighLightRes struct {
	HLRes []HighLight
}

//SearchV 获取满足条件的顶点
func (q *DataQuery) SearchV(ctx context.Context, args SearchArgs) (*SearchRes, error) {
	start := time.Now()

	c := ctx.Value("Context").(*gin.Context)

	//uuid := c.Request.Header.Get("uuid")
	//kgid, _ := strconv.Atoi(string(args.ID))
	//// 判断用户是否有操作资源权限
	//operateResp, err := utils.GetAuthResourceOperate(uuid, kgid, 3, utils.RescourceOperateMap[utils.GraphSearch])
	//if err != nil {
	//	return nil, err
	//}
	//
	//if operateResp["res"] == false {
	//	c.Status(403)
	//	return nil, utils.ErrInfo(utils.ErrRightsErr, errors.New("insufficient user rights"))
	//}

	// 数据库获取配置
	r, err := utils.GetKGConf()
	if err != nil {
		c.Status(500)
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range r {
		if args.ID == graphql.ID(k.ID) {
			conf = k
		}
	}

	resultSet, err := models.SearchVWithFilter(&conf, args.Class, args.Q, args.Page, args.Size, args.QueryAll, args.SearchFilterArgs)
	if err != nil {
		c.Status(500)
		return nil, err
	}

	var vRes []*VertexRes

	switch resultSet.(type) {
	case *orient.VSearchRes:
		res := resultSet.(*orient.VSearchRes)

		for _, r := range res.Res {

			//if i < int((args.Page-1)*args.Size) || i > int(args.Page*(args.Size)-1) {
			//	continue
			//}

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
					NameField:      p.Name,
					ValueField:     p.Value,
					DataTypeField:  p.DataType,
					HighLightField: hl,
				})
			}

			hlName := ""
			for _, a := range propList {
				if a.ValueField == r.Name {
					hlName = a.HighLightField
				}
			}
			if hlName == "" {
				hlName = r.Name
			}

			vRes = append(vRes, &VertexRes{
				IDField:         graphql.ID(r.Rid),
				ClassField:      r.Class,
				AliasField:      r.Alias,
				ColorField:      r.Color,
				NameField:       r.Name,
				HLField:         hlName,
				ExpandField:     r.Expand,
				AnalysisField:   r.Analysis,
				PropertiesField: &propList,
				//InEField:        &inE,
				//OutEField:       &outE,
				//InField:         nil,
				//OutField:        nil,
			})
		}

		Time := time.Since(start).Seconds()

		return &SearchRes{
			CountField:    strconv.FormatUint(res.Counts, 10),
			TimeField:     strconv.FormatFloat(Time, 'f', 2, 64) + "s",
			VertexesField: &vRes,
		}, nil
	case *nebula.VSearchRes:
		res := resultSet.(*nebula.VSearchRes)

		var hlName string
		for _, r := range res.Res {
			var propList []*PropertyField
			for _, p := range r.Properties {
				propList = append(propList, &PropertyField{
					NameField:      p.Name,
					ValueField:     p.Value,
					DataTypeField:  p.DataType,
					HighLightField: p.HL,
				})

				if p.Name == "name" {
					hlName = p.HL
				}
			}

			vRes = append(vRes, &VertexRes{
				IDField:         graphql.ID(r.Rid),
				ClassField:      r.Class,
				AliasField:      r.Alias,
				ColorField:      r.Color,
				NameField:       r.Name,
				HLField:         hlName,
				ExpandField:     r.Expand,
				AnalysisField:   r.Analysis,
				PropertiesField: &propList,
			})
		}

		Time := time.Since(start).Seconds()

		return &SearchRes{
			CountField:    strconv.FormatUint(res.Counts, 10),
			TimeField:     strconv.FormatFloat(Time, 'f', 2, 64) + "s",
			VertexesField: &vRes,
		}, nil

	default:
		return nil, nil
	}
}

// SearchE 参数
type SearchEArgs struct {
	ID  graphql.ID
	Rid string
}

// SearchE 获取边的class和count
func (q *DataQuery) SearchE(ctx context.Context, args SearchEArgs) (*SearchEdgesRes, error) {
	c := ctx.Value("Context").(*gin.Context)

	//uuid := c.Request.Header.Get("uuid")
	//kgid, _ := strconv.Atoi(string(args.ID))
	//// 判断用户是否有操作资源权限
	//operateResp, err := utils.GetAuthResourceOperate(uuid, kgid, 3, utils.RescourceOperateMap[utils.GraphSearch])
	//if err != nil {
	//	return nil, err
	//}
	//
	//if operateResp["res"] == false {
	//	c.Status(403)
	//	return nil, utils.ErrInfo(utils.ErrRightsErr, errors.New("insufficient user rights"))
	//}

	// 数据库获取配置
	r, err := utils.GetKGConf()
	if err != nil {
		c.Status(500)
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range r {
		if args.ID == graphql.ID(k.ID) {
			conf = k
		}
	}

	searchRes, err := models.SearchE(&conf, args.Rid)

	if err != nil {
		c.Status(500)
		return nil, err
	}

	var inE, outE []*Edges

	switch searchRes.(type) {
	case orient.EdgeRes:
		res := searchRes.(orient.EdgeRes)

		for _, e := range res.InE {
			inE = append(inE, &Edges{
				ClassField: e.Class,
				AliasField: e.Alias,
				ColorField: e.Color,
				CountField: strconv.FormatFloat(e.Count, 'f', -1, 64),
			})
		}

		for _, e := range res.OutE {
			outE = append(outE, &Edges{
				ClassField: e.Class,
				AliasField: e.Alias,
				ColorField: e.Color,
				CountField: strconv.FormatFloat(e.Count, 'f', -1, 64),
			})
		}
	case nebula.EdgeRes:
		res := searchRes.(nebula.EdgeRes)

		for _, e := range res.InE {
			inE = append(inE, &Edges{
				ClassField: e.Class,
				AliasField: e.Alias,
				ColorField: e.Color,
				CountField: strconv.FormatFloat(e.Count, 'f', -1, 64),
			})
		}

		for _, e := range res.OutE {
			outE = append(outE, &Edges{
				ClassField: e.Class,
				AliasField: e.Alias,
				ColorField: e.Color,
				CountField: strconv.FormatFloat(e.Count, 'f', -1, 64),
			})
		}
	default:
		return nil, nil

	}

	return &SearchEdgesRes{
		InEdge:  &inE,
		OutEdge: &outE,
	}, nil

}

// ExpandArgs 查询参数
type ExpandArgs struct {
	// expand_v(id: ID!, io: String, edge_class: [String!]): QueryResult
	// 要展开的节点 ID
	ID graphql.ID
	// 展开出边或者入边，只能是 in 或者 out，为空则展开所有
	IO *string
	// 要展开的边的类型，为空则展开所有
	EdgeClass *[]string
}

// ExpandV 展开一个节点
func (q *DataQuery) ExpandV(args ExpandArgs) *QueryResult {
	var res = QueryResult{
		vField: []*VertexRes{},
		eField: []*EdgeRes{},
	}

	v, found := ProjectVertecies[args.ID]
	if !found {
		v, found = CustomerVertecies[args.ID]
	}

	if !found {
		return &res
	}

	// 找到自己，插入结果中
	res.vField = append(res.vField, v)

	// 找到入边
	if args.IO == nil || *args.IO == "" || strings.ToUpper(*args.IO) == "IN" {
		allEdges := v.InE()

		// 不存在的情况下，直接返回
		if allEdges != nil {
			// 不指定类型，全部展开
			if args.EdgeClass == nil || len(*args.EdgeClass) == 0 {
				for _, e := range *allEdges {
					for _, i := range *e.EdgesField {
						res.eField = append(res.eField, i)
						res.vField = append(res.vField, i.InVField)
					}
				}
			} else {
				// 根据指定的类型展开
				for _, e := range *allEdges {
					for _, ae := range *args.EdgeClass {
						if ae == e.ClassField {
							for _, i := range *e.EdgesField {
								res.eField = append(res.eField, i)
								res.vField = append(res.vField, i.InVField)
							}
						}
					}
				}
			}
		}
	}

	// 找到出边
	if args.IO == nil || *args.IO == "" || strings.ToUpper(*args.IO) == "OUT" {
		allEdges := v.OutE()

		// 不存在的情况下，直接返回
		if allEdges != nil {

			// 不指定类型，全部展开
			if args.EdgeClass == nil || len(*args.EdgeClass) == 0 {
				for _, e := range *allEdges {
					for _, i := range *e.EdgesField {
						res.eField = append(res.eField, i)
						res.vField = append(res.vField, i.OutVField)
					}
				}
			} else {
				// 根据指定的类型展开
				for _, e := range *allEdges {
					for _, ae := range *args.EdgeClass {
						if ae == e.ClassField {
							for _, i := range *e.EdgesField {
								res.eField = append(res.eField, i)
								res.vField = append(res.vField, i.OutVField)
							}
						}
					}
				}
			}
		}
	}

	return &res
}

// GetV 获取一个节点
func (q *DataQuery) GetV(args GetVArgs) *[]*VertexRes {
	// var res = []*VertexRes{}
	var res = orient.VSearchRes{}

	// TODO：异常处理
	leo.ReadYamlConfig(&utils.KGS, "./conf/kg.yaml")

	var conf utils.KGConf
	for _, k := range utils.KGS.List {
		if args.ID == graphql.ID(k.ID) {
			conf = k
		}
	}

	res.GetV(&conf, args.Class, args.Rid)

	var vRes []*VertexRes

	for _, r := range res.Res {

		var propList []*PropertyField
		for _, p := range r.Properties {
			propList = append(propList, &PropertyField{
				NameField:     p.Name,
				DataTypeField: p.DataType,
				ValueField:    p.Value,
			})
		}

		var inE, outE []*Edges

		for c, e := range r.In {
			inE = append(inE, &Edges{
				ClassField: c,
				CountField: strconv.Itoa(len(e)),
				EdgesField: nil,
				IDsField:   &e,
				conf:       conf,
				inOut:      "in",
			})
		}

		for c, e := range r.Out {
			outE = append(outE, &Edges{
				ClassField: c,
				CountField: strconv.Itoa(len(e)),
				EdgesField: nil,
				IDsField:   &e,
				conf:       conf,
				inOut:      "out",
			})
		}

		vRes = append(vRes, &VertexRes{
			IDField:         graphql.ID(r.Rid),
			ClassField:      r.Class,
			NameField:       "name",
			PropertiesField: &propList,
			InEField:        &inE,
			OutEField:       &outE,
			InField:         nil,
			OutField:        nil,
		})
	}

	return &vRes
}

type ExpandEArgs struct {
	ID    graphql.ID
	Class string
	//Rids  []string
	Rid string
	IO  string
	paging
}

func (q *DataQuery) ExpandE(ctx context.Context, args *ExpandEArgs) (*[]*EdgeRes, error) {
	c := ctx.Value("Context").(*gin.Context)

	// 判断用户是否有操作资源权限
	//uuid := c.Request.Header.Get("uuid")
	//kgid, _ := strconv.Atoi(string(args.ID))
	//operateResp, err := utils.GetAuthResourceOperate(uuid, kgid, 3, utils.RescourceOperateMap[utils.GraphSearch])
	//if err != nil {
	//	return nil, err
	//}
	//
	//if operateResp["res"] == false {
	//	c.Status(403)
	//	return nil, utils.ErrInfo(utils.ErrRightsErr, errors.New("insufficient user rights"))
	//}

	var res []*EdgeRes

	// 数据库获取配置
	r, err := utils.GetKGConf()
	if err != nil {
		c.Status(500)
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range r {
		if args.ID == graphql.ID(k.ID) {
			conf = k
		}
	}

	getRes, err := models.ExpandE(&conf, args.Class, args.Rid, args.IO, args.Page, args.Size)
	if err != nil {
		c.Status(500)
		return nil, err
	}

	switch getRes.(type) {
	case orient.ESearchRes:
		eRes := getRes.(orient.ESearchRes)

		for _, eRes := range eRes.Res {
			var propList []*PropertyField
			for _, p := range eRes.Properties {
				propList = append(propList, &PropertyField{
					NameField:     p.Name,
					DataTypeField: p.DataType,
					ValueField:    p.Value,
				})
			}

			er := &EdgeRes{
				IDField:         graphql.ID(eRes.Rid),
				ClassField:      eRes.Class,
				AliasFeild:      eRes.Alias,
				ColorField:      eRes.Color,
				NameField:       eRes.Name,
				PropertiesField: &propList,
				InVField:        nil,
				OutVField:       nil,
			}

			var VRec orient.VRecord
			if args.IO == "in" {
				VRec = eRes.Out
			} else {
				VRec = eRes.In
			}

			var vPropList []*PropertyField
			for _, p := range VRec.Properties {
				vPropList = append(vPropList, &PropertyField{
					NameField:     p.Name,
					DataTypeField: p.DataType,
					ValueField:    p.Value,
				})
			}

			var vRes = &VertexRes{
				IDField:         graphql.ID(VRec.Rid),
				ClassField:      VRec.Class,
				AliasField:      VRec.Alias,
				ColorField:      VRec.Color,
				NameField:       VRec.Name,
				ExpandField:     VRec.Expand,
				PropertiesField: &vPropList,
				AnalysisField:   VRec.Analysis,
			}

			if args.IO == "in" {
				er.OutVField = vRes
			} else {
				er.InVField = vRes
			}

			res = append(res, er)
		}

	case nebula.ESearchRes:
		eRes := getRes.(nebula.ESearchRes)

		for _, eRes := range eRes.Res {
			var propList []*PropertyField
			for _, p := range eRes.Properties {
				propList = append(propList, &PropertyField{
					NameField:     p.Name,
					DataTypeField: p.DataType,
					ValueField:    p.Value,
				})
			}

			er := &EdgeRes{
				IDField:         graphql.ID(eRes.Rid),
				ClassField:      eRes.Class,
				AliasFeild:      eRes.Alias,
				ColorField:      eRes.Color,
				NameField:       eRes.Name,
				PropertiesField: &propList,
				InVField:        nil,
				OutVField:       nil,
			}

			var VRec nebula.VRecord
			if args.IO == "in" {
				VRec = eRes.Out
			} else {
				VRec = eRes.In
			}

			var vPropList []*PropertyField
			for _, p := range VRec.Properties {
				vPropList = append(vPropList, &PropertyField{
					NameField:     p.Name,
					DataTypeField: p.DataType,
					ValueField:    p.Value,
				})
			}

			var vRes = &VertexRes{
				IDField:         graphql.ID(VRec.Rid),
				ClassField:      VRec.Class,
				AliasField:      VRec.Alias,
				ColorField:      VRec.Color,
				NameField:       VRec.Name,
				ExpandField:     VRec.Expand,
				PropertiesField: &vPropList,
				AnalysisField:   VRec.Analysis,
			}

			if args.IO == "in" {
				er.OutVField = vRes
			} else {
				er.InVField = vRes
			}

			res = append(res, er)
		}
	}

	return &res, nil
}

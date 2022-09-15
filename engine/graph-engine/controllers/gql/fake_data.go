// Package gql GQL 的实现
// - 描述：提供 GQL 的 测试数据
// - 时间：2020-4-23
package gql

import "github.com/graph-gophers/graphql-go"

// -------------------------------------------------
// KG INFO 的测试数据
// -------------------------------------------------

// VProperties 节点属性
var VProperties = []*Property{
	{
		NField:  "vname",
		DTField: "String",
		// DisField: true,
		OptField: false,
		// DNField:  "名称",
	},
	{
		NField:  "label",
		DTField: "Int",
		// DisField: false,
		OptField: true,
		// DNField:  "标签",
	},
	{
		NField:  "weights",
		DTField: "Int",
		// DisField: false,
		OptField: true,
		// DNField:  "权重",
	},
}

// VIndexes 顶点索引
var VIndexes = []*Index{
	{
		NameField:       "area.all_property_index",
		TypeField:       "UNIQUE",
		PropertiesField: &[]string{"areaId", "areaName"},
		// EngineField:     "SBTREE",
	}, {
		NameField:       "lucene_area_name",
		TypeField:       "FULLTEXT",
		PropertiesField: &[]string{"areaName"},
		// EngineField:     "LUCENE",
	},
}

// Entity 对象
var Entity = VertexResolver{
	&Vertex{
		Class:      "Entity",
		Name:       "实体",
		Properties: VProperties,
		Count:      123123123,
		Indexes:    &VIndexes,
	},
}

// EProperties 边对象
var EProperties = []*Property{
	{
		NField:  "name",
		DTField: "String",
		// DisField: true,
		OptField: true,
		// DNField:  "名称",
	},
	{
		NField:  "types",
		DTField: "Int",
		// DisField: true,
		OptField: true,
		// DNField:  "类型",
	},
}

// Relationship 关系
var Relationship = EdgeResolver{
	&Edge{
		Class:      "Relationship",
		Name:       "",
		Properties: EProperties,
		Type:       1,
		In:         &Entity,
		Out:        &Entity,
		Count:      453453,
		Indexes:    nil,
	},
}

// OntoObj 本体
var OntoObj = Ontology{
	VField:      []*VertexResolver{&Entity},
	EField:      []*EdgeResolver{&Relationship},
	VCountField: "4242340532341",
	ECountField: "572347187334",
}

// KGObj 知识图谱对象
var KGObj = KG{
	ID:   "001",
	Name: "Ownthinkdb",
	Onto: &OntoObj,
}

// -------------------------------------------------
// KG 数据的测试数据
// -------------------------------------------------

// Projects 顶点对象
var Projects = []*VertexRes{
	{
		IDField:    "1",
		ClassField: "PROJECT",
		NameField:  "项目 1",
	},
	{
		IDField:    "2",
		ClassField: "PROJECT",
		NameField:  "项目 2",
	},
	{
		IDField:    "3",
		ClassField: "PROJECT",
		NameField:  "项目 3",
	},
}

// Customer 顶点对象
var Customer = []*VertexRes{
	{
		IDField:    "4",
		ClassField: "CUSTOMER",
		NameField:  "客户 1",
	},
	{
		IDField:    "5",
		ClassField: "CUSTOMER",
		NameField:  "客户 2",
	},
}

// VertexProperties 属性列表
var VertexProperties = map[string][]*PropertyField{
	"1": {
		{
			NameField:     "name",
			ValueField:    "项目 1",
			DataTypeField: "string",
		},
		{
			NameField:     "created",
			ValueField:    "2020-1-1",
			DataTypeField: "datetime",
		},
		{
			NameField:     "status",
			ValueField:    "已成交",
			DataTypeField: "string",
		},
	},
	"2": {
		{
			NameField:     "name",
			ValueField:    "项目 2",
			DataTypeField: "string",
		},
		{
			NameField:     "created",
			ValueField:    "2020-2-2",
			DataTypeField: "datetime",
		},
		{
			NameField:     "status",
			ValueField:    "已丢单",
			DataTypeField: "string",
		},
	},
	"3": {
		{
			NameField:     "name",
			ValueField:    "项目 3",
			DataTypeField: "string",
		},
		{
			NameField:     "created",
			ValueField:    "2020-3-3",
			DataTypeField: "datetime",
		},
		{
			NameField:     "status",
			ValueField:    "进行中",
			DataTypeField: "string",
		},
	},
	"4": {
		{
			NameField:     "name",
			ValueField:    "客户 1",
			DataTypeField: "string",
		},
		{
			NameField:     "地址",
			ValueField:    "A城市A路1号",
			DataTypeField: "string",
		},
	},
	"5": {
		{
			NameField:     "name",
			ValueField:    "客户 2",
			DataTypeField: "string",
		},
		{
			NameField:     "地址",
			ValueField:    "B城市B路2号",
			DataTypeField: "string",
		},
	},
}

// Project2Customer 项目边
var Project2Customer = []*EdgeRes{
	{
		IDField:    "100",
		ClassField: "Project2Customer",
		NameField:  "客户是",
		InVField:   Projects[0],
		OutVField:  Customer[0],
	},
	{
		IDField:    "101",
		ClassField: "Project2Customer",
		NameField:  "客户是",
		InVField:   Projects[1],
		OutVField:  Customer[0],
	},
	{
		IDField:    "102",
		ClassField: "Project2Customer",
		NameField:  "客户是",
		InVField:   Projects[2],
		OutVField:  Customer[1],
	},
}

// EdgeProperties 属性列表
var EdgeProperties = map[string][]*PropertyField{
	"100": {
		{
			NameField:     "edge_property",
			ValueField:    "1",
			DataTypeField: "int",
		},
		{
			NameField:     "edge_property2",
			ValueField:    "2020-1-1",
			DataTypeField: "datetime",
		},
	},
	"101": {
		{
			NameField:     "edge_property",
			ValueField:    "2",
			DataTypeField: "int",
		},
		{
			NameField:     "edge_property2",
			ValueField:    "2020-2-2",
			DataTypeField: "datetime",
		},
	},
	"102": {
		{
			NameField:     "edge_property",
			ValueField:    "3",
			DataTypeField: "int",
		},
		{
			NameField:     "edge_property2",
			ValueField:    "2020-3-3",
			DataTypeField: "datetime",
		},
	},
}

// ProjectVertecies 测试数据集
var ProjectVertecies = make(map[graphql.ID]*VertexRes)

// CustomerVertecies 测试数据集
var CustomerVertecies = make(map[graphql.ID]*VertexRes)

func makeAllVertecies() {
	// 填充数据
	for _, v := range Projects {
		ProjectVertecies[v.IDField] = v
	}

	for _, v := range Customer {
		CustomerVertecies[v.IDField] = v
	}
}

func init() {
	makeAllVertecies()
}

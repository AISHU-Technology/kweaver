// Package orient 是 Orientdb 的数据访问层
// - 描述：预置OrientDB数据结构
// - 时间：2020-3-27
package orient

// --------------------------------------------
// Demo 的接口返回样式
// --------------------------------------------

// Info orient返回的单条结构信息
type Info struct {
	Kind     string `json:"@type"`
	Version  int    `json:"@version"`
	Relation string `json:"relationship_name"`
	Value    string `json:"value_vname"`
	Label    int    `json:"relationship_label"`
}

// Res orient返回的结构信息
type Res struct {
	Result []Info `json:"result"`
}

// InfoV2 第二种模式的返回
type InfoV2 struct {
	Kind     string      `json:"@type"` // OrientDB 默认的类型
	Version  int         `json:"@version"`
	Relation string      `json:"relationship_name"`
	Value    string      `json:"value_vname"`
	Label    int         `json:"value_label"`
	Types    int         `json:"relationship_types"`
	Weights  interface{} `json:"value_Weights"` // 可能出现空的情况
}

// ResV2 第二种模式的返回
type ResV2 struct {
	Result []InfoV2 `json:"result"`
}

// Package orient 是 Orientdb 的数据访问层
// - 描述：OrientDB Schema 访问层
// - 时间：2020-6-15
package orient

import (
	"encoding/json"
	"graph-engine/logger"
	"graph-engine/models/dao"
	"graph-engine/utils"
	"strconv"
)

var ver = []string{"2.1", "3.0"}

const (
	vsuper = "V"
	esuper = "E"
	vtype  = 1
	etype  = 1
)

// Database OrientDB 类型
type Database struct {
	Errors  []interface{} `json:"errors"`
	Classes []Class       `json:"classes"`
	Server  Server        `json:"server"`
}

// Server 信息
/*
   "version": "3.0.6",
   "build": "b63614ab180ff02b75d65054b2a77116c16c0a3c",
   "osName": "Linux",
   "osVersion": "3.10.0-123.el7.x86_64",
   "osArch": "amd64",
   "javaVendor": "Oracle Corporation",
   "javaVersion": "25.171-b11",
*/
type Server struct {
	Version     string `json:"version"`
	Build       string `json:"build"`
	OSName      string `json:"osName"`
	OSVersion   string `json:"osVersion"`
	OSArch      string `json:"osArch"`
	JavaVendor  string `json:"javaVendor"`
	JavaVersion string `json:"javaVersion"`
}

// Class OrientDB 数据类别
type Class struct {
	Name         string     `json:"name"`
	Color        string     `json:"color"`
	Alias        string     `json:"alias"`
	SuperClass   string     `json:"superClass"`
	Records      int64      `json:"records"`
	Properties   []Property `json:"properties"`
	Indexes      []Index    `json:"indexes"`
	ExtractModel string     `json:"extract_model"`
}

// Property 属性类型
type Property struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	LinkedClass string `json:"linkedClass"` // 链接属性
	Mandatory   bool   `json:"mandatory"`
}

// Index 类型
type Index struct {
	Name   string   `json:"name"`
	Type   string   `json:"type"`
	Fields []string `json:"fields"`
}

// -----------------------------------
// 查询知识图谱的 Schema
// -----------------------------------

// Schema 知识图谱结构
type Schema struct {
	V      []Class
	E      []Class
	VCount uint64
	ECount uint64
}

/*
"OUser",
"ORole",
"OIdentity",
"_studio",
"OFunction",
"ORestricted",
"OShape",
"OPoint",
"OGeometryCollection",
"OLineString",
"OMultiLineString",
"OMultiPoint",
"OPolygon",
"OMultiPolygon",
"ORectangle",
"OSchedule",
"OSequence",
"OTriggered"
*/
var systemClasses = map[string]int{
	"OUser":               1,
	"ORole":               1,
	"OIdentity":           1,
	"_studio":             1,
	"OFunction":           1,
	"ORestricted":         1,
	"OShape":              1,
	"OPoint":              1,
	"OGeometryCollection": 1,
	"OLineString":         1,
	"OMultiLineString":    1,
	"OMultiPoint":         1,
	"OPolygon":            1,
	"OMultiPolygon":       1,
	"ORectangle":          1,
	"OSchedule":           1,
	"OSequence":           1,
	"OTriggered":          1,
}

// GetSchema 查询本体 Schema
func (s *Schema) GetSchema(config *utils.KGConf) error {
	// 获取class抽取模型
	kgid, _ := strconv.Atoi(config.ID)
	model, err := dao.GetClassModelType(kgid)
	if err != nil {
		return err
	}

	var operator = Operator{
		User:   config.User,
		PWD:    config.Pwd,
		URL:    config.URL + "/database/" + config.DB,
		Method: "get",
	}

	//var operator = Operator{
	//	User:   "root",
	//	PWD:    "YW55ZGF0YTEyMw==",
	//	URL:    "http://10.4.68.144:2480"+ "/database/" + config.DB,
	//	Method: "get",
	//}

	response, err := operator.Result("")
	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	// 读取结果
	db := new(Database)
	err = json.Unmarshal(response, db)
	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	classMap := make(map[string]Class)

	type ClassType struct {
		name  string
		super *ClassType
	}

	ClassTypeMap := make(map[string]*ClassType)

	for _, c := range db.Classes {
		// 获取节点抽取模型
		if model != nil {
			if _, ok := systemClasses[c.Name]; !ok {
				if c.SuperClass == vsuper {
					for _, entity := range model.Entity {
						if c.Name == entity["name"] {
							c.ExtractModel = entity["model"].(string)
							c.Color = entity["colour"].(string)
							c.Alias = entity["alias"].(string)
							//if len(entity["alias"].(string)) == 0 {
							//	c.Alias = entity["name"].(string)
							//} else {
							//	c.Alias = entity["alias"].(string)
							//}

							break
						}
					}
				}
				if c.SuperClass == esuper {
					for _, edge := range model.Edge {
						if c.Name == edge["name"] {
							c.ExtractModel = edge["model"].(string)
							c.Color = edge["colour"].(string)
							c.Alias = edge["alias"].(string)
							//if len(edge["alias"].(string)) == 0 {
							//	c.Alias = edge["name"].(string)
							//} else {
							//	c.Alias = edge["alias"].(string)
							//}
							break
						}
					}
				}
			}
		}
		// 别名为空则赋值为class名
		if c.Alias == "" {
			c.Alias = c.Name
		}

		// 过滤系统类型
		_, ok := systemClasses[c.Name]
		if ok {
			continue
		}

		// 根节点的类型就是整个图的属性计数
		if c.Name == vsuper {
			s.VCount = uint64(c.Records)
		}

		if c.Name == esuper {
			s.ECount = uint64(c.Records)
		}

		classMap[c.Name] = c

		// 通过链表的方式判断 Class 是顶点还是边
		// 点的父类是 V, 边的父类是 E
		// 类如:
		//   A->E, B->A->E, 则 A,B都是边
		// 用 Map 存储每个类型的链表

		// E 和 V 的父类都是 "", 只考虑父类的情况
		if c.SuperClass == "" {
			continue
		}
		sp, spExits := ClassTypeMap[c.SuperClass]

		// 如果父节点不存在，则创建出来
		if !spExits {
			sp = &ClassType{
				name:  c.SuperClass,
				super: nil,
			}
			ClassTypeMap[c.SuperClass] = sp
		}

		// 如果子节点不存在，创建出来，并连接到父节点
		tp, tpExists := ClassTypeMap[c.Name]
		if tpExists {
			tp.super = sp
		} else {
			ClassTypeMap[c.Name] = &ClassType{
				name:  c.Name,
				super: sp,
			}
		}
	}

	// 找到边和点类型
	for k, v := range ClassTypeMap {
		if k == vsuper || k == esuper {
			continue
		}

		cur := v.super
		for {
			if cur == nil {
				break
			}

			if cur.name == vsuper {
				s.V = append(s.V, classMap[k])
				break
			}

			if cur.name == esuper {
				s.E = append(s.E, classMap[k])
				break
			}

			cur = cur.super
		}

	}

	return nil
}

// 知识量统计
func GetKnowledgeCount(conf *utils.KGConf) (uint64, uint64, uint64, uint64, uint64, error) {
	var (
		vc  uint64 // 实体总量
		ec  uint64 // 关系总量
		vpc uint64 // 实体属性总量
		epc uint64 // 关系属性总量
		pc  uint64 // 属性总量
	)
	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/database/" + conf.DB,
		Method: "get",
	}

	logger.Info(operator.URL)

	response, err := operator.Result("")
	if err != nil {
		logger.Error(err)
		return 0, 0, 0, 0, 0, utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	// 读取结果
	db := new(Database)
	err = json.Unmarshal(response, db)
	if err != nil {
		utils.UnmarshalErr(response, err)

		return 0, 0, 0, 0, 0, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	for _, c := range db.Classes {
		if _, ok := systemClasses[c.Name]; !ok {
			switch {
			case c.SuperClass == vsuper && c.Name != vsuper:
				vpc = vpc + uint64(c.Records)*uint64(len(c.Properties))
			case c.SuperClass == esuper && c.Name != esuper:
				epc = epc + uint64(c.Records)*uint64(len(c.Properties)-2) // 去除in和out属性
			case c.Name == vsuper:
				vc = uint64(c.Records)
			case c.Name == esuper:
				ec = uint64(c.Records)
			}
		}
	}

	pc = vpc + epc

	return vc, ec, vpc, epc, pc, nil
}

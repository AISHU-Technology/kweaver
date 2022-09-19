package nebula

import (
	"fmt"
	"graph-engine/models/dao"
	"graph-engine/utils"
	"strconv"
	"strings"
)

// Schema 知识图谱结构
type Schema struct {
	V      []Class
	E      []Class
	VCount uint64
	ECount uint64
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

func (s *Schema) GetSchema(conf *utils.KGConf) error {
	// 获取class抽取模型
	kgid, _ := strconv.Atoi(conf.ID)
	model, err := dao.GetClassModelType(kgid)
	if err != nil {
		return err
	}

	// records
	stats, err := s.GetRecordsCount(conf)
	if err != nil {
		return err
	}

	indexes, err := s.GetIndexes(conf)
	if err != nil {
		return err
	}

	// fulltext index
	var os = OpenSearch{}
	allFullTextIndexes, err := os.FullTextIndexesList(conf.FulltextID)
	//allFullTextIndexes := map[string]interface{}{}
	if err != nil {
		return err
	}

	nebula := Nebula{}

	// tags
	showTags := "show tags;"
	tags, err := nebula.Client(conf, showTags)
	if err != nil {
		return err
	}

	for i := 0; i < tags.GetRowSize(); i++ {
		var vclass Class

		rowValue, _ := tags.GetRowValuesByIndex(i)
		rowValueSplit := strings.Split(rowValue.String(), ", ")

		vclass.Name = strings.Trim(rowValueSplit[0], "\"")

		// 获取节点抽取模型
		if model != nil {
			for _, entity := range model.Entity {
				if vclass.Name == entity["name"] {
					vclass.ExtractModel = entity["model"].(string)
					vclass.Color = entity["colour"].(string)
					vclass.Alias = entity["alias"].(string)

					break
				}
			}
		}
		// 别名为空则赋值为class名
		if vclass.Alias == "" {
			vclass.Alias = vclass.Name
		}

		// record
		for _, stat := range stats {
			if stat.Type == "Tag" && stat.Name == vclass.Name {
				vclass.Records, _ = strconv.ParseInt(stat.Count, 0, 64)
			}
		}

		// desc tag
		descTag := fmt.Sprintf("desc tag `%s`", vclass.Name)
		resultSet, err := nebula.Client(conf, descTag)
		if err != nil {
			return err
		}

		for i := 0; i < resultSet.GetRowSize(); i++ {
			rowValue, _ := resultSet.GetRowValuesByIndex(i)
			rowValueSplit := strings.Split(rowValue.String(), ", ")

			vclass.Properties = append(vclass.Properties, Property{
				Name:        strings.Trim(rowValueSplit[0], "\""),
				Type:        strings.Trim(rowValueSplit[1], "\""),
				LinkedClass: "",
				Mandatory:   false,
			})
		}

		// tag indexes
		for _, tagIndex := range indexes.TagIndexes {
			if tagIndex.Tag == vclass.Name {
				vclass.Indexes = tagIndex.Indexes
			}
		}
		//fulltext
		fullTextName := fmt.Sprintf("%s_%s", conf.DB, strings.ToLower(vclass.Name))

		if fullTextIndex, ok := allFullTextIndexes[fullTextName]; ok {
			mappings := fullTextIndex.(map[string]interface{})["mappings"].(map[string]interface{})

			var (
				fields []string
				_type  string
			)
			for key, value := range mappings["properties"].(map[string]interface{}) {
				fields = append(fields, key)
				valueMap := value.(map[string]interface{})
				_type = valueMap["type"].(string)
			}
			vclass.Indexes = append(vclass.Indexes, Index{
				Name:   fullTextName,
				Type:   _type,
				Fields: fields,
			})
		}

		s.V = append(s.V, vclass)
	}

	// edges
	showEdges := "show edges;"
	edges, err := nebula.Client(conf, showEdges)
	if err != nil {
		return err
	}

	for i := 0; i < edges.GetRowSize(); i++ {
		var eclass Class

		rowValue, _ := edges.GetRowValuesByIndex(i)
		rowValueSplit := strings.Split(rowValue.String(), ", ")

		eclass.Name = strings.Trim(rowValueSplit[0], "\"")

		if model != nil {
			for _, edge := range model.Edge {
				if eclass.Name == edge["name"] {
					eclass.ExtractModel = edge["model"].(string)
					eclass.Color = edge["colour"].(string)
					eclass.Alias = edge["alias"].(string)

					break
				}
			}
		}
		// 别名为空则赋值为class名
		if eclass.Alias == "" {
			eclass.Alias = eclass.Name
		}

		// record
		for _, stat := range stats {
			if stat.Type == "Edge" && stat.Name == eclass.Name {
				eclass.Records, _ = strconv.ParseInt(stat.Count, 0, 64)
			}
		}

		// desc edge
		descEdge := fmt.Sprintf("desc edge `%s`", eclass.Name)
		resultSet, err := nebula.Client(conf, descEdge)
		if err != nil {
			return err
		}

		var in, out string
		for i := 0; i < resultSet.GetRowSize(); i++ {
			row, _ := resultSet.GetRowValuesByIndex(i)
			field, _ := row.GetValueByColName("Field")
			_type, _ := row.GetValueByColName("Type")

			switch strings.Trim(field.String(), "\"") {
			//case "name":
			//	// parse in/out
			//	comment, _ := row.GetValueByColName("Comment")
			//	commentStrSplit := strings.Split(strings.Trim(comment.String(), "\""), ";")
			//
			//	inSplit := strings.Split(commentStrSplit[0], ":")
			//	outSplit := strings.Split(commentStrSplit[1], ":")
			//
			//	in = strings.Trim(inSplit[1], "`")
			//	out = strings.Trim(outSplit[1], "`")
			//
			//	eclass.Properties = append(eclass.Properties, Property{
			//		Name:        strings.Trim(field.String(), "\""),
			//		Type:        strings.Trim(_type.String(), "\""),
			//		LinkedClass: "",
			//		Mandatory:   false,
			//	})
			case "in":
				eclass.Properties = append(eclass.Properties, Property{
					Name:        strings.Trim(field.String(), "\""),
					Type:        strings.Trim(_type.String(), "\""),
					LinkedClass: in,
					Mandatory:   false,
				})
			case "out":
				eclass.Properties = append(eclass.Properties, Property{
					Name:        strings.Trim(field.String(), "\""),
					Type:        strings.Trim(_type.String(), "\""),
					LinkedClass: out,
					Mandatory:   false,
				})

			}
		}

		// edge indexes
		for _, edgeIndex := range indexes.EdgeIndexes {
			if edgeIndex.Tag == eclass.Name {
				eclass.Indexes = edgeIndex.Indexes
			}
		}
		//fulltext
		fullTextName := fmt.Sprintf("%s_%s", conf.DB, eclass.Name)

		if fullTextIndex, ok := allFullTextIndexes[fullTextName]; ok {
			mappings := fullTextIndex.(map[string]interface{})["mappings"].(map[string]interface{})

			var (
				fields []string
				_type  string
			)
			for key, value := range mappings["properties"].(map[string]interface{}) {
				fields = append(fields, key)
				valueMap := value.(map[string]interface{})
				_type = valueMap["type"].(string)
			}
			eclass.Indexes = append(eclass.Indexes, Index{
				Name:   fullTextName,
				Type:   _type,
				Fields: fields,
			})
		}

		s.E = append(s.E, eclass)
	}

	for _, stat := range stats {
		if stat.Type == "Space" && stat.Name == "vertices" {
			s.VCount, _ = strconv.ParseUint(stat.Count, 0, 64)
		}
		if stat.Type == "Space" && stat.Name == "edges" {
			s.ECount, _ = strconv.ParseUint(stat.Count, 0, 64)
		}
	}

	return nil
}

type Stat struct {
	Type  string
	Name  string
	Count string
}

func (s Schema) GetRecordsCount(conf *utils.KGConf) ([]Stat, error) {
	nebula := Nebula{}

	var stats []Stat

	showRecords := "show stats;"
	records, err := nebula.Client(conf, showRecords)
	if err != nil {
		return nil, err
	}

	for i := 0; i < records.GetRowSize(); i++ {
		rowValue, _ := records.GetRowValuesByIndex(i)
		rowValueSplit := strings.Split(rowValue.String(), ", ")

		stats = append(stats, Stat{
			Type:  strings.Trim(rowValueSplit[0], "\""),
			Name:  strings.Trim(rowValueSplit[1], "\""),
			Count: rowValueSplit[2],
		})
	}
	return stats, nil
}

type Indexes struct {
	TagIndexes  []TagIndex
	EdgeIndexes []EdgeIndex
}
type TagIndex struct {
	Tag     string
	Indexes []Index
}
type EdgeIndex struct {
	Tag     string
	Indexes []Index
}

func (s Schema) GetIndexes(conf *utils.KGConf) (*Indexes, error) {
	var indexes Indexes

	nebula := Nebula{}

	// tag indexes
	showTagIndexes := "SHOW TAG INDEXES;"
	tagIndexes, err := nebula.Client(conf, showTagIndexes)
	if err != nil {
		return nil, err
	}

	for i := 0; i < tagIndexes.GetRowSize(); i++ {
		var tagIndex TagIndex

		rowValue, _ := tagIndexes.GetRowValuesByIndex(i)
		indexName, _ := rowValue.GetValueByColName("Index Name")
		indexTag, _ := rowValue.GetValueByColName("By Tag")
		columns, _ := rowValue.GetValueByColName("Columns")

		columnsStr := strings.TrimLeft(columns.String(), "[")
		columnsStr = strings.TrimRight(columnsStr, "]")
		columnsList := strings.Split(columnsStr, ", ")

		var fields []string
		for _, field := range columnsList {
			fields = append(fields, strings.Trim(field, "\""))
		}

		if tagIndex.Tag == strings.Trim(indexTag.String(), "\"") {
			tagIndex.Indexes = append(tagIndex.Indexes, Index{
				Name:   strings.Trim(indexName.String(), "\""),
				Type:   "",
				Fields: fields,
			})
		} else {
			tagIndex.Tag = strings.Trim(indexTag.String(), "\"")

			tagIndex.Indexes = append(tagIndex.Indexes, Index{
				Name:   strings.Trim(indexName.String(), "\""),
				Type:   "",
				Fields: fields,
			})
		}

		indexes.TagIndexes = append(indexes.TagIndexes, tagIndex)
	}

	// edge indexes
	showEdgeIndexes := "SHOW EDGE INDEXES"
	edgeIndexes, err := nebula.Client(conf, showEdgeIndexes)
	if err != nil {
		return nil, err
	}

	for i := 0; i < edgeIndexes.GetRowSize(); i++ {
		var edgeIndex EdgeIndex

		rowValue, _ := edgeIndexes.GetRowValuesByIndex(i)
		indexName, _ := rowValue.GetValueByColName("Index Name")
		indexEdge, _ := rowValue.GetValueByColName("By Edge")
		columns, _ := rowValue.GetValueByColName("Columns")

		columnsStr := strings.TrimLeft(columns.String(), "[")
		columnsStr = strings.TrimRight(columnsStr, "]")
		columnsList := strings.Split(columnsStr, ", ")

		var fields []string
		for _, field := range columnsList {
			fields = append(fields, strings.Trim(field, "\""))
		}

		if edgeIndex.Tag == strings.Trim(indexEdge.String(), "\"") {
			edgeIndex.Indexes = append(edgeIndex.Indexes, Index{
				Name:   strings.Trim(indexName.String(), "\""),
				Type:   "",
				Fields: fields,
			})
		} else {
			edgeIndex.Tag = strings.Trim(indexEdge.String(), "\"")
			edgeIndex.Indexes = append(edgeIndex.Indexes, Index{
				Name:   strings.Trim(indexName.String(), "\""),
				Type:   "",
				Fields: fields,
			})
		}

		indexes.EdgeIndexes = append(indexes.EdgeIndexes, edgeIndex)
	}
	return &indexes, nil
}

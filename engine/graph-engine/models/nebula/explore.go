package nebula

import (
	"errors"
	"fmt"
	"graph-engine/utils"
	"sort"
	"strings"
	"time"
)

type VSearchRes struct {
	Res    []VRecord
	Counts uint64
	Time   float64
}

type VRecord struct {
	Rid        string
	Class      string
	Color      string
	Alias      string
	Name       string
	Expand     bool
	Properties []PropValue
	Analysis   bool
}

type PropValue struct {
	Name     string
	Value    string
	DataType string
	HL       string
}

type EdgeRes struct {
	InE  []Edge
	OutE []Edge
}

type Edge struct {
	Class string
	Alias string
	Color string
	Count float64
}

type ESearchRes struct {
	Res []*ERecord
}

type ERecord struct {
	Rid        string
	Class      string
	Color      string
	Alias      string
	Name       string
	Properties []PropValue
	In         VRecord
	Out        VRecord
}

type ExpandVRes struct {
	Res []*ExpandVRecord
}

// ExpandVRecord 顶点对象
type ExpandVRecord struct {
	Rid        string
	Class      string
	Color      string
	Alias      string
	Name       string
	Version    float64
	Expand     bool
	Properties []PropValue
	InE        []ERecord
	OutE       []ERecord
	Analysis   bool
}

func (s *VSearchRes) SearchVWithFilter(conf *utils.KGConf, class, q string, page int32, size int32, queryAll bool, searchFilterArgs *utils.SearchFilterArgs) error {
	start := time.Now()

	if conf.ID == "" {
		return utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	// 首次配置无推荐
	if conf.ConfigStatus == "edit" {
		return utils.ErrInfo(utils.ErrConfigStatusErr, errors.New("KG config status is edit"))
	}

	var schema Schema
	err := schema.GetSchema(conf)
	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	if schema.V == nil {
		return utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))
	}

	q = strings.TrimSpace(q)

	skip, limit := (page-1)*size, size

	nebula := Nebula{}

	// 处理筛选条件
	class = "`" + class + "`"
	filterStrMap := processSearchFilter(class, searchFilterArgs)

	if queryAll {
		var gqlCount string
		if _, ok := filterStrMap["vids"]; ok {
			gqlCount = "match (%s:%s) where %s %s return %s;"
			if _, ok := filterStrMap["filter"]; ok {
				// nebula 3.0.0 版本开始，为了区别不同 Tag 的属性，match语句返回属性时必须额外指定 Tag 名称
				filterlist := []string{}
				for _, filter := range filterStrMap["filter"].([]string) {
					filterlist = append(filterlist, fmt.Sprintf("%s.", class)+filter)
				}
				filterStr := strings.Join(filterlist, " and ")
				gqlCount = fmt.Sprintf(gqlCount, class, class, filterStrMap["vids"], "and "+filterStr, class)
			} else {
				gqlCount = fmt.Sprintf(gqlCount, class, class, filterStrMap["vids"], "", class)
			}
		} else {
			gqlCount = "LOOKUP ON %s %s YIELD properties(vertex);"
			if _, ok := filterStrMap["filter"]; ok {
				filterStr := strings.Join(filterStrMap["filter"].([]string), " and ")
				gqlCount = fmt.Sprintf(gqlCount, class, "WHERE "+filterStr)
			} else {
				gqlCount = fmt.Sprintf(gqlCount, class, "")
			}
		}

		vCount, err := nebula.Client(conf, gqlCount)
		if err != nil {
			return err
		}

		vcount := vCount.GetRowSize()
		s.Counts = uint64(vcount)

		var gql string
		if _, ok := filterStrMap["vids"]; ok {
			gql = "match (%s:%s) where %s %s return %s skip %d limit %d;"
			if _, ok := filterStrMap["filter"]; ok {
				// nebula 3.0.0 版本开始，为了区别不同 Tag 的属性，match语句返回属性时必须额外指定 Tag 名称
				filterlist := []string{}
				for _, filter := range filterStrMap["filter"].([]string) {
					filterlist = append(filterlist, fmt.Sprintf("%s.", class)+filter)
				}
				filterStr := strings.Join(filterlist, " and ")
				gql = fmt.Sprintf(gql, class, class, filterStrMap["vids"], "and "+filterStr, class, skip, limit)
			} else {
				gql = fmt.Sprintf(gql, class, class, filterStrMap["vids"], "", class, skip, limit)
			}

			resultSet, err := nebula.Client(conf, gql)
			if err != nil {
				return err
			}
			for i := 0; i < resultSet.GetRowSize(); i++ {
				rowValue, _ := resultSet.GetRowValuesByIndex(i)

				valWrap, err := rowValue.GetValueByIndex(0)
				if err != nil {
					return utils.ErrInfo(utils.ErrNebulaErr, err)
				}

				node, err := valWrap.AsNode()
				if err != nil {
					return utils.ErrInfo(utils.ErrNebulaErr, err)
				}
				properties, _ := node.Properties(node.GetTags()[0])

				rec := VRecord{
					Class:    node.GetTags()[0],
					Name:     properties["name"].String()[1 : len(properties["name"].String())-1],
					Rid:      node.GetID().String()[1 : len(node.GetID().String())-1],
					Expand:   false,
					Analysis: false,
				}
				// process properties
				var keys []string
				for k, _ := range properties {
					keys = append(keys, k)
					sort.Strings(keys)
				}
				for _, k := range keys {
					prop := PropValue{
						Name:     k,
						Value:    properties[k].String()[1 : len(properties[k].String())-1],
						DataType: properties[k].GetType(),
						HL:       properties[k].String()[1 : len(properties[k].String())-1],
					}
					rec.Properties = append(rec.Properties, prop)
				}

				// 节点是否可展开
				gqlExpand := "MATCH (v)-[e]-(v2) where id(v) in ['%s'] RETURN count(e);"
				gqlExpand = fmt.Sprintf(gqlExpand, rec.Rid)
				eCount, err := nebula.Client(conf, gqlExpand)
				if err != nil {
					return err
				}
				row, _ := eCount.GetRowValuesByIndex(0)
				value, _ := row.GetValueByIndex(0)
				ecount, _ := value.AsInt()
				if int(ecount) != 0 {
					rec.Expand = true
				}

				// 导入的图谱不存在分析报告
				if conf.KGConfID != "-1" {
					// 是否有分析报告: class为document
					if rec.Class == "document" {
						rec.Analysis = true
					}
				}
				// 获取class别名/节点颜色
				for _, sv := range schema.V {
					if sv.Name == rec.Class {
						rec.Alias = sv.Alias
						rec.Color = sv.Color
						break
					}
				}

				s.Res = append(s.Res, rec)
			}

		} else {
			// nebula 3.0.0 版本开始，lookup语句不默认返回VertexID，需yield后添加id(vertex)返回
			gql = "LOOKUP ON %s %s YIELD id(vertex) as VertexID, properties(vertex) | LIMIT %d, %d;"
			if _, ok := filterStrMap["filter"]; ok {
				filterStr := strings.Join(filterStrMap["filter"].([]string), " and ")
				gql = fmt.Sprintf(gql, class, "WHERE "+filterStr, skip, limit)
			} else {
				gql = fmt.Sprintf(gql, class, "", skip, limit)
			}

			resultSet, err := nebula.Client(conf, gql)
			if err != nil {
				return err
			}
			for i := 0; i < resultSet.GetRowSize(); i++ {
				rowValue, _ := resultSet.GetRowValuesByIndex(i)

				vid, err := rowValue.GetValueByColName("VertexID")
				valWrap, err := rowValue.GetValueByColName("properties(VERTEX)")
				if err != nil {
					return utils.ErrInfo(utils.ErrNebulaErr, err)
				}

				properties, err := valWrap.AsMap()
				if err != nil {
					return utils.ErrInfo(utils.ErrNebulaErr, err)
				}

				rec := VRecord{
					Class:    strings.Trim(class, "`"),
					Name:     properties["name"].String()[1 : len(properties["name"].String())-1],
					Rid:      vid.String()[1 : len(vid.String())-1],
					Expand:   false,
					Analysis: false,
				}
				// process properties
				var keys []string
				for k, _ := range properties {
					keys = append(keys, k)
					sort.Strings(keys)
				}
				for _, k := range keys {
					prop := PropValue{
						Name:     k,
						Value:    properties[k].String()[1 : len(properties[k].String())-1],
						DataType: properties[k].GetType(),
						HL:       properties[k].String()[1 : len(properties[k].String())-1],
					}
					rec.Properties = append(rec.Properties, prop)
				}

				// 节点是否可展开
				gqlExpand := "MATCH (v)-[e]-(v2) where id(v) in ['%s'] RETURN count(e);"
				gqlExpand = fmt.Sprintf(gqlExpand, rec.Rid)
				eCount, err := nebula.Client(conf, gqlExpand)
				if err != nil {
					return err
				}
				row, _ := eCount.GetRowValuesByIndex(0)
				value, _ := row.GetValueByIndex(0)
				ecount, _ := value.AsInt()
				if int(ecount) != 0 {
					rec.Expand = true
				}

				// 导入的图谱不存在分析报告
				if conf.KGConfID != "-1" {
					// 是否有分析报告: class为document
					if rec.Class == "document" {
						rec.Analysis = true
					}
				}
				// 获取class别名/节点颜色
				for _, sv := range schema.V {
					if sv.Name == rec.Class {
						rec.Alias = sv.Alias
						rec.Color = sv.Color
						break
					}
				}

				s.Res = append(s.Res, rec)
			}
		}

	} else {

		if q == "" {
			return nil
		}
		var proper []string
		var indexName string
		for _, tag := range schema.V {
			if tag.Name == strings.Trim(class, "`") {
				for _, indexes := range tag.Indexes {
					if indexes.Type == "text" {
						proper = indexes.Fields
						indexName = indexes.Name
					}
				}
			}
		}

		if proper == nil {
			s.Res = nil
			return nil
		} else {
			// openSearch fulltext
			var os = OpenSearch{}

			osRes, err := os.SerachWithHL(conf.FulltextID, indexName, q, proper, "or", []string{conf.HLStart}, []string{conf.HLEnd})
			if err != nil {
				return err
			}

			hits := osRes["hits"].(map[string]interface{})

			var vids []string
			highlight := make(map[string]interface{}, len(hits["hits"].([]interface{})))
			for _, hit := range hits["hits"].([]interface{}) {
				hitMap := hit.(map[string]interface{})

				vid := hitMap["_id"].(string)
				highlight[vid] = hitMap["highlight"].(map[string]interface{})

				vids = append(vids, "'"+vid+"'")
			}
			if vids == nil {
				return nil
			}

			// counts
			var gqlCount string
			if _, ok := filterStrMap["vids"]; ok {
				gqlCount = "match (%s:%s) where %s %s return count(%s);"
				if _, ok := filterStrMap["filter"]; ok {
					// nebula 3.0.0 版本开始，为了区别不同 Tag 的属性，match语句返回属性时必须额外指定 Tag 名称
					filterlist := []string{}
					for _, filter := range filterStrMap["filter"].([]string) {
						filterlist = append(filterlist, fmt.Sprintf("%s.", class)+filter)
					}
					filterStr := strings.Join(filterlist, " and ")
					gqlCount = fmt.Sprintf(gqlCount, class, class, filterStrMap["vids"], "and "+filterStr, class)
				} else {
					gqlCount = fmt.Sprintf(gqlCount, class, class, filterStrMap["vids"], "", class)
				}
			} else {
				gqlCount = "match (%s:%s) where id(%s) in [%s] %s return count(%s);"
				if _, ok := filterStrMap["filter"]; ok {
					// nebula 3.0.0 版本开始，为了区别不同 Tag 的属性，match语句返回属性时必须额外指定 Tag 名称
					filterlist := []string{}
					for _, filter := range filterStrMap["filter"].([]string) {
						filterlist = append(filterlist, fmt.Sprintf("%s.", class)+filter)
					}
					filterStr := strings.Join(filterlist, " and ")
					gqlCount = fmt.Sprintf(gqlCount, class, class, class, strings.Join(vids, ", "), "and "+filterStr, class)
				} else {
					gqlCount = fmt.Sprintf(gqlCount, class, class, class, strings.Join(vids, ", "), "", class)
				}
			}
			vCount, err := nebula.Client(conf, gqlCount)
			if err != nil {
				return err
			}
			row, _ := vCount.GetRowValuesByIndex(0)
			value, _ := row.GetValueByIndex(0)
			vcount, _ := value.AsInt()

			s.Counts = uint64(vcount)

			// nebula search
			var gql string
			if _, ok := filterStrMap["vids"]; ok {
				gql = "match (%s:%s) where %s %s return %s skip %d limit %d;"
				if _, ok := filterStrMap["filter"]; ok {
					// nebula 3.0.0 版本开始，为了区别不同 Tag 的属性，match语句返回属性时必须额外指定 Tag 名称
					filterlist := []string{}
					for _, filter := range filterStrMap["filter"].([]string) {
						filterlist = append(filterlist, fmt.Sprintf("%s.", class)+filter)
					}
					filterStr := strings.Join(filterlist, " and ")
					gql = fmt.Sprintf(gql, class, class, filterStrMap["vids"], "and "+filterStr, class, skip, limit)
				} else {
					gqlCount = fmt.Sprintf(gql, class, filterStrMap["vids"], "", class, skip, limit)
				}
			} else {
				gql = "match (%s:%s) where id(%s) in [%s] %s return %s skip %d limit %d;;"
				if _, ok := filterStrMap["filter"]; ok {
					// nebula 3.0.0 版本开始，为了区别不同 Tag 的属性，match语句返回属性时必须额外指定 Tag 名称
					filterlist := []string{}
					for _, filter := range filterStrMap["filter"].([]string) {
						filterlist = append(filterlist, fmt.Sprintf("%s.", class)+filter)
					}
					filterStr := strings.Join(filterlist, " and ")
					gql = fmt.Sprintf(gql, class, class, class, strings.Join(vids, ", "), "and "+filterStr, class, skip, limit)
				} else {
					gql = fmt.Sprintf(gql, class, class, class, strings.Join(vids, ", "), "", class, skip, limit)
				}
			}

			reusltSet, err := nebula.Client(conf, gql)
			if err != nil {
				return err
			}

			for i := 0; i < reusltSet.GetRowSize(); i++ {
				row, _ := reusltSet.GetRowValuesByIndex(i)
				valWrap, _ := row.GetValueByIndex(0)
				node, err := valWrap.AsNode()
				if err != nil {
					return utils.ErrInfo(utils.ErrNebulaErr, err)
				}

				properties, _ := node.Properties(node.GetTags()[0])

				rec := VRecord{
					Class:    node.GetTags()[0],
					Name:     properties["name"].String()[1 : len(properties["name"].String())-1],
					Rid:      node.GetID().String()[1 : len(node.GetID().String())-1],
					Expand:   false,
					Analysis: false,
				}
				// process properties
				var keys []string
				for k, _ := range properties {
					keys = append(keys, k)
					sort.Strings(keys)
				}
				for _, k := range keys {
					prop := PropValue{
						Name:     k,
						Value:    properties[k].String()[1 : len(properties[k].String())-1],
						DataType: properties[k].GetType(),
						HL:       properties[k].String()[1 : len(properties[k].String())-1],
					}

					if _, ok := highlight[rec.Rid].(map[string]interface{})[k]; ok {
						for _, value := range highlight[rec.Rid].(map[string]interface{})[k].([]interface{}) {
							prop.HL = value.(string)
						}
					}
					rec.Properties = append(rec.Properties, prop)
				}

				// 节点是否可展开
				gqlExpand := "MATCH (v)-[e]-(v2) where id(v) in ['%s'] RETURN count(e);"
				gqlExpand = fmt.Sprintf(gqlExpand, rec.Rid)
				eCount, err := nebula.Client(conf, gqlExpand)
				if err != nil {
					return err
				}
				rowValue, _ := eCount.GetRowValuesByIndex(0)
				value, _ := rowValue.GetValueByIndex(0)
				ecount, _ := value.AsInt()
				if int(ecount) != 0 {
					rec.Expand = true
				}

				// 导入的图谱不存在分析报告
				if conf.KGConfID != "-1" {
					// 是否有分析报告: class为document
					if rec.Class == "document" {
						rec.Analysis = true
					}
				}

				// 获取class别名/节点颜色
				for _, sv := range schema.V {
					if sv.Name == rec.Class {
						rec.Alias = sv.Alias
						rec.Color = sv.Color
						break
					}
				}

				s.Res = append(s.Res, rec)
			}
		}
	}

	s.Time = time.Since(start).Seconds()

	return nil

}

func processSearchFilter(tag string, searchFilter *utils.SearchFilterArgs) map[string]interface{} {
	var filterStrList []string
	filterRes := make(map[string]interface{})

	if searchFilter.Selected != nil {
		var vids []string
		if searchFilter.SelectedRids != nil {
			for _, id := range *searchFilter.SelectedRids {
				vids = append(vids, "'"+id+"'")
			}
		}

		switch *searchFilter.Selected {
		case "selected":
			ridStr := fmt.Sprintf("id(%s) in [%s]", tag, strings.Join(vids, ", "))
			filterRes["vids"] = ridStr
		case "unselected":
			ridStr := fmt.Sprintf("id(%s) not in [%s]", tag, strings.Join(vids, ","))
			filterRes["vids"] = ridStr
		}
	}

	if searchFilter.Filter != nil {
		for _, filter := range *searchFilter.Filter {
			var filterStr string

			filter.Pt = strings.ToUpper(filter.Pt)
			filter.Property = fmt.Sprintf("%s.", tag) + "`" + filter.Property + "`"

			switch {
			case filter.Pt == "STRING" || strings.HasPrefix(filter.Pt, "FIXED_STRING"):
				switch filter.Condition {
				case "eq":
					filterStr = filter.Property + `==` + `'` + (*filter.Range)[0] + `'`
				}
			case filter.Pt == "BOOL":
				switch filter.Condition {
				case "eq":
					filterStr = filter.Property + `==` + (*filter.Range)[0]
				}
			case filter.Pt == "INT64" || filter.Pt == "INT32" || filter.Pt == "INT16" || filter.Pt == "INT8" || filter.Pt == "FLOAT" || filter.Pt == "DOUBLE":
				switch filter.Condition {
				case "lt":
					filterStr = filter.Property + `<` + (*filter.Range)[0]
				case "gt":
					filterStr = filter.Property + `>` + (*filter.Range)[0]
				case "between":
					filterStr = (*filter.Range)[0] + `<=` + filter.Property + ` and ` + filter.Property + `<=` + (*filter.Range)[1]
				case "eq":
					filterStr = filter.Property + `==` + (*filter.Range)[0]
				}
			case filter.Pt == "DATETIME" || filter.Pt == "DATE" || filter.Pt == "TIME" || filter.Pt == "TIMESTAMP":
				switch filter.Condition {
				case "lt":
					filterStr = filter.Property + `<` + (*filter.Range)[0]
				case "gt":
					filterStr = filter.Property + `>` + (*filter.Range)[0]
				case "between":
					filterStr = (*filter.Range)[0] + `<=` + filter.Property + ` and ` + filter.Property + `<=` + (*filter.Range)[1]
				case "eq":
					filterStr = filter.Property + `==` + (*filter.Range)[0]
				}
			}

			if filterStr != "" {
				filterStrList = append(filterStrList, filterStr)
			}
		}
		if len(filterStrList) != 0 {
			filterRes["filter"] = filterStrList
		}
	}

	return filterRes
}

func (e *EdgeRes) SearchE(conf *utils.KGConf, rid string) error {
	if conf.ID == "" {
		return utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	if conf.ConfigStatus == "edit" {
		return utils.ErrInfo(utils.ErrConfigStatusErr, errors.New("KG config status is edit"))
	}

	var schema Schema
	err := schema.GetSchema(conf)
	if err != nil {
		return err
	}

	if schema.V == nil {
		return utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))
	}

	nebula := Nebula{}

	// outE
	outEgql := "MATCH (v)-[e]->(v2) WHERE id(v) IN ['%s'] RETURN e;"
	outEgql = fmt.Sprintf(outEgql, rid)

	outE, err := nebula.Client(conf, outEgql)
	if err != nil {
		return err
	}

	outECount := make(map[string]int, 0)

	for i := 0; i < outE.GetRowSize(); i++ {
		row, _ := outE.GetRowValuesByIndex(i)
		valWrap, _ := row.GetValueByIndex(0)
		edge, err := valWrap.AsRelationship()
		if err != nil {
			return utils.ErrInfo(utils.ErrNebulaErr, err)
		}

		edgeName := edge.GetEdgeName()
		outECount[edgeName]++
	}

	var outECountKeys []string
	for k, _ := range outECount {
		outECountKeys = append(outECountKeys, k)
		sort.Strings(outECountKeys)
	}
	for _, key := range outECountKeys {
		oute := Edge{
			Class: key,
			Alias: "",
			Color: "",
			Count: float64(outECount[key]),
		}
		for _, s := range schema.E {
			if s.Name == oute.Class {
				oute.Alias = s.Alias
				oute.Color = s.Color
				break
			}
		}

		e.OutE = append(e.OutE, oute)
	}

	// inE
	inEgql := "MATCH (v)<-[e]-(v2) WHERE id(v) IN ['%s'] RETURN e;"
	inEgql = fmt.Sprintf(inEgql, rid)

	inE, err := nebula.Client(conf, inEgql)
	if err != nil {
		return err
	}

	inECount := make(map[string]int, 0)

	for i := 0; i < inE.GetRowSize(); i++ {
		row, _ := inE.GetRowValuesByIndex(i)
		valWrap, _ := row.GetValueByIndex(0)
		edge, err := valWrap.AsRelationship()
		if err != nil {
			return utils.ErrInfo(utils.ErrNebulaErr, err)
		}

		edgeName := edge.GetEdgeName()
		inECount[edgeName]++
	}

	var inECountKeys []string
	for k, _ := range inECount {
		inECountKeys = append(inECountKeys, k)
		sort.Strings(inECountKeys)
	}
	for _, key := range inECountKeys {
		ine := Edge{
			Class: key,
			Alias: "",
			Color: "",
			Count: float64(inECount[key]),
		}
		for _, s := range schema.E {
			if s.Name == ine.Class {
				ine.Alias = s.Alias
				ine.Color = s.Color
				break
			}
		}

		e.InE = append(e.InE, ine)
	}

	return nil
}

func (e *ESearchRes) ExpandE(conf *utils.KGConf, eclass string, vrid string, inout string, page int32, size int32) error {
	if conf.ConfigStatus == "edit" {
		return utils.ErrInfo(utils.ErrConfigStatusErr, errors.New("KG config status is edit"))
	}

	if conf.ID == "" {
		return utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	var schema Schema
	err := schema.GetSchema(conf)
	if err != nil {
		return err
	}

	if schema.V == nil {
		return utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))
	}

	if eclass == "" || inout == "" {
		return utils.ErrInfo(utils.ErrInternalErr, errors.New("Not Found"))
	}

	skip, limit := (page-1)*size, size

	nebula := Nebula{}

	var gql string
	if inout == "in" {
		gql = "match (v)<-[e:%s]-(v2) where id(v) in ['%s'] return e, v2 skip %d limit %d;"
	} else {
		gql = "match (v)-[e:%s]->(v2) where id(v) in ['%s'] return e, v2 skip %d limit %d;"
	}
	gql = fmt.Sprintf(gql, eclass, vrid, skip, limit)

	resultSet, err := nebula.Client(conf, gql)
	if err != nil {
		return err
	}

	for i := 0; i < resultSet.GetRowSize(); i++ {
		row, _ := resultSet.GetRowValuesByIndex(i)

		edgeValWarp, _ := row.GetValueByColName("e")
		v2ValWarp, _ := row.GetValueByColName("v2")

		edge, _ := edgeValWarp.AsRelationship()
		edgePro := edge.Properties()

		v2, _ := v2ValWarp.AsNode()

		eRecord := ERecord{
			Rid:   edge.GetEdgeName() + ":" + edge.GetSrcVertexID().String() + "->" + edge.GetDstVertexID().String(),
			Class: edge.GetEdgeName(),
			Name:  edgePro["name"].String()[1 : len(edgePro["name"].String())-1],
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
		for key, _ := range edgePro {
			proKeys = append(proKeys, key)
			sort.Strings(proKeys)
		}
		for _, key := range proKeys {
			eRecord.Properties = append(eRecord.Properties, PropValue{
				Name:     key,
				Value:    edgePro[key].String()[1 : len(edgePro[key].String())-1],
				DataType: edgePro[key].GetType(),
			})
		}

		if inout == "in" {
			// edge in
			v2Pro, _ := v2.Properties(v2.GetTags()[0])

			eRecord.Out = VRecord{
				Rid:        v2.GetID().String()[1 : len(v2.GetID().String())-1],
				Class:      v2.GetTags()[0],
				Name:       v2Pro["name"].String()[1 : len(v2Pro["name"].String())-1],
				Expand:     false,
				Properties: nil,
				Analysis:   false,
			}

			var proKeys []string
			for key, _ := range v2Pro {
				proKeys = append(proKeys, key)
				sort.Strings(proKeys)
			}
			for _, key := range proKeys {
				eRecord.Out.Properties = append(eRecord.Out.Properties, PropValue{
					Name:     key,
					Value:    v2Pro[key].String()[1 : len(v2Pro[key].String())-1],
					DataType: v2Pro[key].GetType(),
				})
			}

			// 导入的图谱不存在分析报告
			if conf.KGConfID != "-1" {
				// 是否有分析报告: class为document
				if eRecord.Out.Class == "document" {
					eRecord.Out.Analysis = true
				}
			}

			for _, s := range schema.V {
				if s.Name == eRecord.Out.Class {
					eRecord.Out.Alias = s.Alias
					eRecord.Out.Color = s.Color
					break
				}
			}

			// 节点是否可展开
			gqlExpand := "MATCH (v)-[e]-(v2) where id(v) in ['%s'] RETURN count(e);"
			gqlExpand = fmt.Sprintf(gqlExpand, eRecord.Out.Rid)
			eCount, err := nebula.Client(conf, gqlExpand)
			if err != nil {
				return err
			}
			rowValue, _ := eCount.GetRowValuesByIndex(0)
			value, _ := rowValue.GetValueByIndex(0)
			ecount, _ := value.AsInt()
			if int(ecount) != 0 {
				eRecord.Out.Expand = true
			}

		} else {
			// edge out
			v2Pro, _ := v2.Properties(v2.GetTags()[0])

			eRecord.In = VRecord{
				Rid:        v2.GetID().String()[1 : len(v2.GetID().String())-1],
				Class:      v2.GetTags()[0],
				Name:       v2Pro["name"].String()[1 : len(v2Pro["name"].String())-1],
				Expand:     false,
				Properties: nil,
				Analysis:   false,
			}

			var proKeys []string
			for key, _ := range v2Pro {
				proKeys = append(proKeys, key)
				sort.Strings(proKeys)
			}
			for _, key := range proKeys {
				eRecord.In.Properties = append(eRecord.In.Properties, PropValue{
					Name:     key,
					Value:    v2Pro[key].String()[1 : len(v2Pro[key].String())-1],
					DataType: v2Pro[key].GetType(),
				})
			}

			// 导入的图谱不存在分析报告
			if conf.KGConfID != "-1" {
				// 是否有分析报告: class为document
				if eRecord.In.Class == "document" {
					eRecord.In.Analysis = true
				}
			}

			for _, s := range schema.V {
				if s.Name == eRecord.In.Class {
					eRecord.In.Alias = s.Alias
					eRecord.In.Color = s.Color
					break
				}
			}

			// 节点是否可展开
			gqlExpand := "MATCH (v)-[e]-(v2) where id(v) in ['%s'] RETURN count(e);"
			gqlExpand = fmt.Sprintf(gqlExpand, eRecord.In.Rid)
			eCount, err := nebula.Client(conf, gqlExpand)
			if err != nil {
				return err
			}
			rowValue, _ := eCount.GetRowValuesByIndex(0)
			value, _ := rowValue.GetValueByIndex(0)
			ecount, _ := value.AsInt()
			if int(ecount) != 0 {
				eRecord.In.Expand = true
			}
		}

		e.Res = append(e.Res, &eRecord)

	}
	return nil
}

func (e *ExpandVRes) ExpandV(conf *utils.KGConf, eclass string, vrid string, inout string, name string, page int32, size int32) error {
	if conf.ConfigStatus == "edit" {
		return utils.ErrInfo(utils.ErrConfigStatusErr, errors.New("KG config status is edit"))
	}

	if conf.ID == "" {
		return utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	var schema Schema
	err := schema.GetSchema(conf)
	if err != nil {
		return err
	}

	if schema.V == nil {
		return utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))
	}
	nebula := Nebula{}

	var eClassSql = "*"
	if eclass != "" {
		eClassSql = eclass
	}
	var nameSql = ""
	if name != "" {
		nameSql = fmt.Sprintf(`WHERE properties($$).name =~ ".*%s.*"`, name)
	}
	var overSql string
	if inout == "in" {
		overSql = " REVERSELY "
	} else if inout == "inout" {
		overSql = " BIDIRECT "
	}
	var gql = fmt.Sprintf(`GO FROM "%s" OVER %s %s %s YIELD DISTINCT id($$) as res`, vrid, eClassSql, overSql, nameSql)

	if size > -1 {
		skip, limit := (page-1)*size, size
		gql = gql + fmt.Sprintf(" | limit %d,%d", skip, limit)
	}

	resultSet, err := nebula.Client(conf, gql)
	if err != nil {
		return err
	}
	vidList := make([]string, resultSet.GetRowSize())
	for i := 0; i < resultSet.GetRowSize(); i++ {
		row, _ := resultSet.GetRowValuesByIndex(i)
		vid, _ := row.GetValueByColName("res")
		vidList[i] = vid.String()
	}
	if len(vidList) <= 0 {
		return nil
	}
	gql = fmt.Sprintf("match (v)-[e]-(v2) where id(v) in ['%s'] and id(v2) in [%s] return e, v2", vrid, strings.Join(vidList, ","))
	resultSet, err = nebula.Client(conf, gql)
	if err != nil {
		return err
	}
	for i := 0; i < resultSet.GetRowSize(); i++ {
		row, _ := resultSet.GetRowValuesByIndex(i)

		edgeValWarp, _ := row.GetValueByColName("e")
		v2ValWarp, _ := row.GetValueByColName("v2")

		edge, _ := edgeValWarp.AsRelationship()
		edgePro := edge.Properties()

		v2, _ := v2ValWarp.AsNode()
		v2Pro, _ := v2.Properties(v2.GetTags()[0])

		if inout == "in" && edge.GetDstVertexID().String()[1:len(edge.GetDstVertexID().String())-1] != vrid ||
			inout == "out" && edge.GetSrcVertexID().String()[1:len(edge.GetSrcVertexID().String())-1] != vrid {
			continue
		}

		var vrec ExpandVRecord
		for _, re := range e.Res {
			if re.Rid == v2.GetID().String()[1:len(v2.GetID().String())-1] {
				vrec = *re
				break
			}
		}

		if vrec.Rid == "" {
			vrec = ExpandVRecord{
				Rid:        v2.GetID().String()[1 : len(v2.GetID().String())-1],
				Class:      v2.GetTags()[0],
				Name:       v2Pro["name"].String()[1 : len(v2Pro["name"].String())-1],
				Expand:     false,
				Properties: nil,
				Analysis:   false,
			}
			var proKeys []string
			for key, _ := range v2Pro {
				proKeys = append(proKeys, key)
				sort.Strings(proKeys)
			}
			for _, key := range proKeys {
				vrec.Properties = append(vrec.Properties, PropValue{
					Name:     key,
					Value:    v2Pro[key].String()[1 : len(v2Pro[key].String())-1],
					DataType: v2Pro[key].GetType(),
				})
			}

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

			// 节点是否可展开
			gqlExpand := "MATCH (v)-[e]-(v2) where id(v) in ['%s'] RETURN count(e);"
			gqlExpand = fmt.Sprintf(gqlExpand, vrec.Rid)
			eCount, err := nebula.Client(conf, gqlExpand)
			if err != nil {
				return err
			}
			rowValue, _ := eCount.GetRowValuesByIndex(0)
			value, _ := rowValue.GetValueByIndex(0)
			ecount, _ := value.AsInt()
			if int(ecount) != 0 {
				vrec.Expand = true
			}
			e.Res = append(e.Res, &vrec)
		}
		eRecord := ERecord{
			Rid:   edge.GetEdgeName() + ":" + edge.GetSrcVertexID().String() + "->" + edge.GetDstVertexID().String(),
			Class: edge.GetEdgeName(),
			Name:  edgePro["name"].String()[1 : len(edgePro["name"].String())-1],
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
		for key, _ := range edgePro {
			proKeys = append(proKeys, key)
			sort.Strings(proKeys)
		}
		for _, key := range proKeys {
			eRecord.Properties = append(eRecord.Properties, PropValue{
				Name:     key,
				Value:    edgePro[key].String()[1 : len(edgePro[key].String())-1],
				DataType: edgePro[key].GetType(),
			})
		}
		if inout == "out" && edge.GetSrcVertexID().String()[1:len(edge.GetSrcVertexID().String())-1] == vrid {
			vrec.InE = append(vrec.InE, eRecord)
			continue
		}
		if inout == "in" && edge.GetDstVertexID().String()[1:len(edge.GetDstVertexID().String())-1] == vrid {
			vrec.OutE = append(vrec.OutE, eRecord)
			continue
		}
		if inout == "inout" {
			if edge.GetDstVertexID().String()[1:len(edge.GetDstVertexID().String())-1] == vrid {
				vrec.OutE = append(vrec.OutE, eRecord)
			}
			if edge.GetSrcVertexID().String()[1:len(edge.GetSrcVertexID().String())-1] == vrid {
				vrec.InE = append(vrec.InE, eRecord)
			}
		}
	}
	return nil
}

// Package orient 是 Orientdb 的数据访问层
// - 描述：OrientDB 节点探索 访问层

// - 时间：2020-6-15

package orient

import (
	"encoding/json"
	"errors"
	"fmt"
	"graph-engine/utils"
	"strconv"
	"strings"
	"time"
)

const (
	limit = 20
)

/*
   "@type": "d",
   "@rid": "#29:1",
   "@version": 20,
   "@class": "PROJECT",
*/

// 顶点查询结果
type VSearchRes struct {
	Res    []VRecord
	Counts uint64
	Time   float64
}

// 边查询结果
type ESearchRes struct {
	Res []*ERecord
}

type PropValue struct {
	Name     string
	Value    string
	DataType string
}

// VRecord 顶点对象
type VRecord struct {
	Rid        string
	Class      string
	Color      string
	Alias      string
	Name       string
	Version    float64
	Expand     bool
	Properties []PropValue
	InE        []Edge
	OutE       []Edge
	In         map[string][]string
	Out        map[string][]string
	Analysis   bool
}

type Edge struct {
	Class string
	Alias string
	Color string
	Count float64
}

type EdgeRes struct {
	InE  []Edge
	OutE []Edge
}

// ERecord 顶点对象
type ERecord struct {
	Rid        string
	Class      string
	Color      string
	Alias      string
	Name       string
	Version    float64
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

func ProcessV(rec *VRecord, k string, v interface{}) {
	if strings.HasPrefix(k, "@") {
		return
	}

	// 进出边处理
	//if strings.HasPrefix(k, "in_") {
	//	for _, e := range v.([]interface{}) {
	//		if _, ok := rec.In[k[3:]]; !ok {
	//			rec.In[k[3:]] = []string{}
	//		}
	//
	//		rec.In[k[3:]] = append(rec.In[k[3:]], e.(string))
	//	}
	//	return
	//}
	//if strings.HasPrefix(k, "out_") {
	//	for _, e := range v.([]interface{}) {
	//		if _, ok := rec.Out[k[4:]]; !ok {
	//			rec.Out[k[4:]] = []string{}
	//		}
	//		rec.Out[k[4:]] = append(rec.Out[k[4:]], e.(string))
	//	}
	//	return
	//}
	if k == "out" {
		return
	}
	if k == "in" {
		return
	}

	// 空属性值
	if v == "nan" {
		return
	}

	var value, vtype string
	switch v.(type) {
	case string:
		{
			vtype = "STRING"
			value = v.(string)
		}
	case float64:
		{
			vtype = "FLOAT"
			value = strconv.FormatFloat(v.(float64), 'f', -1, 64)
		}
	case bool:
		{
			vtype = "BOOL"
			value = strconv.FormatBool(v.(bool))
		}
	}

	prop := PropValue{
		Name:     k,
		Value:    value,
		DataType: vtype,
	}
	rec.Properties = append(rec.Properties, prop)

	if ok := strings.HasSuffix(strings.ToLower(k), "name"); rec.Name != "" && ok && len([]rune(v.(string))) != 0 {
		rec.Name = v.(string)
	}

}
func ExplorePathProcessV(rec *ExplorePathVertexRes, k string, v interface{}) {
	if strings.HasPrefix(k, "@") {
		return
	}

	if k == "out" {
		return
	}
	if k == "in" {
		return
	}

	// 空属性值
	if v == "nan" {
		return
	}

	var value string
	switch v.(type) {
	case string:
		{
			value = v.(string)
		}
	case float64:
		{
			value = strconv.FormatFloat(v.(float64), 'f', -1, 64)
		}
	case bool:
		{
			value = strconv.FormatBool(v.(bool))
		}
	}

	prop := &ExplorePathProperty{
		Name:  k,
		Value: value,
	}
	rec.Properties = append(rec.Properties, prop)

	if ok := strings.HasSuffix(strings.ToLower(k), "name"); rec.Name != "" && ok && len([]rune(v.(string))) != 0 {
		rec.Name = v.(string)
	}

}

func ProcessExpandV(rec *ExpandVRecord, k string, v interface{}) {
	if strings.HasPrefix(k, "@") {
		return
	}
	if k == "out" {
		return
	}
	if k == "in" {
		return
	}

	// 空属性值
	if v == "nan" {
		return
	}

	var value, vtype string
	switch v.(type) {
	case string:
		{
			vtype = "STRING"
			value = v.(string)
		}
	case float64:
		{
			vtype = "FLOAT"
			value = strconv.FormatFloat(v.(float64), 'f', -1, 64)
		}
	case bool:
		{
			vtype = "BOOL"
			value = strconv.FormatBool(v.(bool))
		}
	}

	prop := PropValue{
		Name:     k,
		Value:    value,
		DataType: vtype,
	}
	rec.Properties = append(rec.Properties, prop)

	if ok := strings.HasSuffix(strings.ToLower(k), "name"); rec.Name != "" && ok && len([]rune(v.(string))) != 0 {
		rec.Name = v.(string)
	}
}

func ProcessE(rec *ERecord, k string, v interface{}, vrid string) string {
	if strings.HasPrefix(k, "@") {
		return ""
	}

	// 进出顶点处理
	var relatedV string
	//进边
	if (k == "in" || k == "out") && v.(string) != vrid {
		relatedV = v.(string)
		return relatedV
	}
	//if inout == "in" && k == "out" || inout == "out" && k == "in" {
	//	relatedV = v.(string)
	//}

	//if k == "in" || k == "out" {
	//	return relatedV
	//}
	var value, vtype string
	switch v.(type) {
	case string:
		{
			vtype = "STRING"
			value = v.(string)
		}
	case float64:
		{
			vtype = "FLOAT"
			value = strconv.FormatFloat(v.(float64), 'f', -1, 64)
		}
	}
	prop := PropValue{
		Name:     k,
		Value:    value,
		DataType: vtype,
	}

	if ok := strings.HasSuffix(strings.ToLower(k), "name"); rec.Name != "" && ok {
		rec.Name = v.(string)
	}

	rec.Properties = append(rec.Properties, prop)

	return relatedV
}

func ExplorePathProcessE(rec *ExplorePathEdgeRes, k string, v interface{}) (outV, inV string) {
	if strings.HasPrefix(k, "@") {
		return "", ""
	}

	// 进出顶点处理
	if k == "out" {
		rec.Out = v.(string)
		return rec.Out, ""
	}
	if k == "in" {
		rec.In = v.(string)
		return "", rec.In
	}

	var value string
	switch v.(type) {
	case string:
		{
			value = v.(string)
		}
	case float64:
		{
			value = strconv.FormatFloat(v.(float64), 'f', -1, 64)
		}
	}
	prop := &ExplorePathProperty{
		Name:  k,
		Value: value,
	}

	if ok := strings.HasSuffix(strings.ToLower(k), "name"); rec.Name != "" && ok {
		rec.Name = v.(string)
	}

	rec.Properties = append(rec.Properties, prop)

	return "", ""
}

type SearchFilterArgs struct {
	Selected     *string
	SelectedRids *[]string
	Filter       *[]SearchFilter
}

type SearchFilter struct {
	Property  string
	Pt        string
	Condition string
	Range     *[]string
}

func (s *VSearchRes) SearchVWithFilter(conf *utils.KGConf, class, q string, page int32, size int32, queryAll bool, searchFilterArgs *utils.SearchFilterArgs) error {

	start := time.Now()

	if conf.ID == "" {
		return utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
		//return utils.ServError{
		//	Code:    utils.ErrInternalErr,
		//	Message: utils.ErrMsgMap[utils.ErrInternalErr],
		//	Cause:   "KG does not exist.",
		//}
	}

	// 首次配置无推荐
	if conf.ConfigStatus == "edit" {
		return utils.ErrInfo(utils.ErrConfigStatusErr, errors.New("KG config status is edit"))
		//return utils.ServError{
		//	Code:    utils.ErrConfigStatusErr,
		//	Message: utils.ErrMsgMap[utils.ErrGraphStatusErr],
		//	Cause:   "KG config status is edit",
		//}
	}

	var schema Schema
	err := schema.GetSchema(conf)
	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	if schema.V == nil {
		return utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))

		//return utils.ServError{
		//	Code:    utils.ErrVClassErr,
		//	Message: utils.ErrMsgMap[utils.ErrVClassErr],
		//	Cause:   "KG not have class",
		//}
	}

	// Class OrientDB 数据类别
	type ClassConf struct {
		Name       string     `json:"name"`
		SuperClass string     `json:"superClass"`
		Records    uint64     `json:"records"`
		Properties []Property `json:"properties"`
		Indexes    []Index    `json:"indexes"`
	}

	var indexOp = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/class/" + conf.DB + "/" + class,
		Method: "get",
	}

	response, err := indexOp.Result("")
	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	// 读取结果
	classConf := new(ClassConf)
	err = json.Unmarshal(response, classConf)

	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	q = strings.TrimSpace(q)

	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/command/" + conf.DB + "/sql",
		Method: "command",
	}

	var sql string

	class = "`" + class + "`" // 中文class需使用反引号

	if queryAll {
		// 处理筛选条件
		filterStr := processSearchFilter(searchFilterArgs)

		var queryRes QueryRes
		//sqlCount := "select count(*) as count from %s"
		sqlCount := "select count(1) as count from %s"
		if filterStr != "" {
			sqlCount = fmt.Sprintf(sqlCount, class+" where "+filterStr)
		} else {
			sqlCount = fmt.Sprintf(sqlCount, class)
		}

		//logger.Info(sqlCount)
		err = queryRes.ParseOrientResponse(operator, sqlCount)
		if err != nil {
			return utils.ErrInfo(utils.ErrOrientDBErr, err)
		}
		for _, c := range queryRes.Res.([]interface{}) {
			qMap := c.(map[string]interface{})
			cStr := strconv.FormatFloat(qMap["count"].(float64), 'f', -1, 64)
			s.Counts, _ = strconv.ParseUint(cStr, 10, 64)
		}

		skip, limit := (page-1)*size, size

		//sql = "select expand(res) from (select @this:{!out_*, !in_*} as res from (select *, out().size() as out, in().size() as in from %s skip %d limit %d))"
		sql = "select expand(res) from (select @this:{!out_*, !in_*} as res from (select *, out().size() as out, in().size() as in from %s skip %d limit %d))"
		if filterStr != "" {
			sql = fmt.Sprintf(sql, class+" where "+filterStr, skip, limit)

		} else {
			sql = fmt.Sprintf(sql, class, skip, limit)
		}

	} else {

		if q == "" {
			return nil
		}

		var proper []string
		var indexName string
		for _, indexes := range classConf.Indexes {
			if indexes.Type == "FULLTEXT" {
				proper = indexes.Fields
				indexName = indexes.Name
			}
		}

		if proper == nil {
			s.Res = nil
			return nil
		} else {

			escaped, err := utils.EscapeLucene(q)

			if escaped == "" {
				return nil
			}

			// escaped, err = utils.EscapeLucene(escaped)

			// 中文属性添加反引号
			var properList []string
			for _, p := range proper {
				p = "`" + p + "`"
				properList = append(properList, p)
			}
			// 处理筛选条件
			filterStr := processSearchFilter(searchFilterArgs)

			// 总条数
			var sqlCount string
			if conf.Version == 2 {
				sqlCount = `select $totalHits from %s where [%s] lucene '%s' limit 1`
				sqlCount = fmt.Sprintf(sqlCount, class, strings.Join(properList, ","), escaped)
			} else {
				// orientdb版本3，同一属性多条索引，应用search_index
				//sqlCount = `select $totalHits from %s where SEARCH_INDEX('%s', '%s')=true limit 1`
				sqlCount = `select count(*) as count from %s where SEARCH_INDEX('%s', '%s')=true %s limit 1`

				if filterStr != "" {
					sqlCount = fmt.Sprintf(sqlCount, class, indexName, escaped, "and "+filterStr)
				} else {
					sqlCount = fmt.Sprintf(sqlCount, class, indexName, escaped, filterStr)
				}
			}

			//logger.Info(sqlCount)
			response, err = GetGraphData(&operator, sqlCount)

			if err != nil {
				return utils.ErrInfo(utils.ErrOrientDBErr, err)
			}

			type count struct {
				//Count uint64 `json:"$totalHits"`
				Count uint64 `json:"count"`
			}

			type queryRes struct {
				Res   []count     `json:"result"`
				Error interface{} `json:"errors"`
			}

			countObj := new(queryRes)

			err = json.Unmarshal(response, countObj)

			if err != nil {
				return utils.ErrInfo(utils.ErrInternalErr, err)
			}
			if countObj.Error != nil {
				return utils.ErrInfo(utils.ErrOrientDBErr, errors.New(countObj.Error.(string)))
				//return utils.ServError{
				//	Code:    utils.ErrOrientDBErr,
				//	Message: utils.ErrMsgMap[utils.ErrOrientDBErr],
				//	Cause:   "Query error",
				//	Detail: map[string]interface{}{
				//		"err": countObj.Error,
				//	},
				//}
			}
			if len(countObj.Res) < 1 {
				return nil
			}

			s.Counts = countObj.Res[0].Count

			// skip=(page-1)*size  limit=size
			skip, limit := (page-1)*size, size

			if conf.Version == 2 {
				sql = `select expand(@this.exclude( 'out_*','in_*' )) from (select  *, $score, out().size() as out, in().size() as in from %s where [%s] lucene '%s' order by $score DESC skip %d limit %d)`
				sql = fmt.Sprintf(sql, class, strings.Join(proper, ","), escaped, skip, limit)
			} else {
				//		sql = `select expand(res) from (select @this:{!out_*, !in_*} as res from (select *, out().size() as out, in().size() as in, %s from %s where search_fields(['%s'], '%s', {"highlight": {
				//   "fields": ['%s'],
				//   "start": "%s",
				//   "end": "%s"
				//}}) = true  skip %d limit %d))`

				//sql = `select expand(res) from (select @this:{!out_*, !in_*} as res from (select *, out().size() as out, in().size() as in, %s from %s where search_class('%s', {
				//		"highlight": {
				//			"fields": ['%s'],
				//			"start": "%s",
				//			"end": "%s"
				//		}
				//	}) = true  skip %d limit %d))`

				sql = `select expand(res) from (select @this:{!out_*, !in_*} as res from (select *, out().size() as out, in().size() as in, %s from %s where search_index('%s', '%s', {
					"highlight": {
						"fields": ['%s'],
						"start": "%s",
						"end": "%s"
					}
				}) = true %s skip %d limit %d))`
				props := strings.Join(proper, "','")
				props = strings.TrimRight(props, "','")

				var lightPros []string
				for _, pro := range proper {
					// 中文属性名高亮加反引号
					lightPro := "`" + "$" + pro + "_hl" + "`" + " as " + "`" + pro + "_hl" + "`"
					lightPros = append(lightPros, lightPro)
				}
				lightProsRes := strings.Join(lightPros, ",")
				lightProsRes = strings.TrimRight(lightProsRes, ",")

				//	sql = fmt.Sprintf(sql, lightProsRes, class, props, escaped, props, conf.HLStart, conf.HLEnd, skip, limit)
				if filterStr != "" {
					sql = fmt.Sprintf(sql, lightProsRes, class, indexName, escaped, props, conf.HLStart, conf.HLEnd, "and "+filterStr, skip, limit)
				} else {
					sql = fmt.Sprintf(sql, lightProsRes, class, indexName, escaped, props, conf.HLStart, conf.HLEnd, filterStr, skip, limit)
				}

			}
		}
	}
	//logger.Info(sql)
	response, err = GetGraphData(&operator, sql)

	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	var res map[string]interface{}
	err = json.Unmarshal(response, &res)

	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	if e, exists := res["errors"]; exists {
		return utils.ErrInfo(utils.ErrOrientDBErr, errors.New(e.(string)))

		//return utils.ServError{
		//	Code:    utils.ErrOrientDBErr,
		//	Message: utils.ErrMsgMap[utils.ErrOrientDBErr],
		//	Cause:   "Query error",
		//	Detail: map[string]interface{}{
		//		"err": e,
		//	},
		//}
	}

	sc, exists := res["result"]

	if !exists {
		return nil
	}

	for _, r := range sc.([]interface{}) {
		rMap := r.(map[string]interface{})
		rec := VRecord{
			Class:    rMap["@class"].(string),
			Color:    "",
			Rid:      rMap["@rid"].(string),
			Name:     rMap["@class"].(string),
			Version:  rMap["@version"].(float64),
			Expand:   true,
			Analysis: false,
		}

		processFunc := func(k string, v interface{}) {
			ProcessV(&rec, k, v)
		}

		utils.SortedMap(rMap, processFunc)

		// 节点是否可展开
		if rMap["in"] == float64(0) && rMap["out"] == float64(0) {
			rec.Expand = false
		}

		// 导入的图谱不存在分析报告
		if conf.KGConfID != "-1" {
			// 是否有分析报告: class为document
			if class == "`document`" {
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

	s.Time = time.Since(start).Seconds()

	return nil

}

func processSearchFilter(searchFilter *utils.SearchFilterArgs) string {
	var filterStrList []string
	var filterRes string

	if searchFilter.Selected != nil {
		switch *searchFilter.Selected {
		case "selected":
			if searchFilter.SelectedRids != nil {
				ridStr := fmt.Sprintf("@rid in [%s]", strings.Join(*searchFilter.SelectedRids, ","))
				filterStrList = append(filterStrList, ridStr)
			}
		case "unselected":
			if searchFilter.SelectedRids != nil {
				ridStr := fmt.Sprintf("@rid not in [%s]", strings.Join(*searchFilter.SelectedRids, ","))
				filterStrList = append(filterStrList, ridStr)
			}
		}
	}

	if searchFilter.Filter != nil {
		for _, filter := range *searchFilter.Filter {
			var filterStr string

			switch {
			case filter.Pt == "STRING":
				switch filter.Condition {
				case "eq":
					filterStr = filter.Property + `=` + `'` + (*filter.Range)[0] + `'`
				}
			case filter.Pt == "BOOLEAN":
				switch filter.Condition {
				case "eq":
					filterStr = filter.Property + `=` + (*filter.Range)[0]
				}
			case filter.Pt == "INTEGER" || filter.Pt == "FLOAT" || filter.Pt == "DOUBLE" || filter.Pt == "DECIMAL":
				switch filter.Condition {
				case "lt":
					filterStr = `(` + filter.Property + `<` + (*filter.Range)[0] + `)`
				case "gt":
					filterStr = `(` + filter.Property + `>` + (*filter.Range)[0] + `)`
				case "between":
					filterStr = `(` + filter.Property + ` BETWEEN ` + (*filter.Range)[0] + ` AND ` + (*filter.Range)[1] + `)`
				case "eq":
					filterStr = `(` + filter.Property + `=` + (*filter.Range)[0] + `)`
				}
			case filter.Pt == "DATETIME" || filter.Pt == "DATE":
				switch filter.Condition {
				case "lt":
					filterStr = `(` + filter.Property + `<` + `'` + (*filter.Range)[0] + `'` + `)`
				case "gt":
					filterStr = `(` + filter.Property + `>` + `'` + (*filter.Range)[0] + `'` + `)`
				case "between":
					filterStr = `(` + filter.Property + ` BETWEEN ` + `'` + (*filter.Range)[0] + `'` + ` AND ` + `'` + (*filter.Range)[1] + `'` + `)`
				case "eq":
					filterStr = `(` + filter.Property + `=` + `'` + (*filter.Range)[0] + `'` + `)`
				}
			}

			if filterStr != "" {
				filterStrList = append(filterStrList, filterStr)
			}
		}
	}

	if len(filterStrList) != 0 {
		//filterRes = "and " + strings.Join(filterStrList, " and ")
		filterRes = strings.Join(filterStrList, " and ")
	}

	return filterRes
}

func (e *EdgeRes) SearchE(conf *utils.KGConf, rid string) error {
	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/command/" + conf.DB + "/sql",
		Method: "command",
	}

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
		return err
	}

	if schema.V == nil {
		return utils.ErrInfo(utils.ErrVClassErr, errors.New("KG not have class"))
	}

	// 获取边类别
	sqlClass := `SELECT outE().@class.asSet() as out, inE().@class.asSet() as in from %s`
	sqlClass = fmt.Sprintf(sqlClass, rid)

	//logger.Info(sqlClass)
	response, err := GetGraphData(&operator, sqlClass)

	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	var resClass map[string]interface{}
	err = json.Unmarshal(response, &resClass)

	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	if e, exists := resClass["errors"]; exists {
		return utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
		//return utils.ServError{
		//	Code:    utils.ErrOrientDBErr,
		//	Message: utils.ErrMsgMap[utils.ErrOrientDBErr],
		//	Cause:   "Query error",
		//	Detail: map[string]interface{}{
		//		"err": e,
		//	},
		//}
	}

	eClass, exists := resClass["result"]

	if !exists {
		return nil
	}

	// 查询边类别数量
	var os, is string
	for _, class := range eClass.([]interface{}) {
		cMap := class.(map[string]interface{})
		for k, v := range cMap {
			if k == "out" {
				for _, o := range v.([]interface{}) {
					sql := "%s('%s').size() as `%s_%s`"
					sql = fmt.Sprintf(sql, k, o, k, o)

					os = strings.Join([]string{sql, os}, ",")
				}
				os = strings.TrimRight(os, ",")
			}
			if k == "in" {
				for _, i := range v.([]interface{}) {
					sql := "%s('%s').size() as `%s_%s`"
					sql = fmt.Sprintf(sql, k, i, k, i)

					is = strings.Join([]string{sql, is}, ",")
				}
				is = strings.TrimRight(is, ",")
			}
		}
	}

	var sqlCount string

	s := strings.Join([]string{os, is}, ",")
	s = strings.TrimRight(s, ",")
	s = strings.TrimLeft(s, ",")

	if s != "" {
		sqlCount = "SELECT %s from %s"
		sqlCount = fmt.Sprintf(sqlCount, s, rid)
		//fmt.Println(sqlCount)
	} else {
		return nil
	}

	//logger.Info(sqlCount)
	responseCount, errCount := GetGraphData(&operator, sqlCount)

	if errCount != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	var res map[string]interface{}
	err = json.Unmarshal(responseCount, &res)

	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	if e, exists := res["errors"]; exists {
		return utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
		//return utils.ServError{
		//	Code:    utils.ErrOrientDBErr,
		//	Message: utils.ErrMsgMap[utils.ErrOrientDBErr],
		//	Cause:   "Query error",
		//	Detail: map[string]interface{}{
		//		"err": e,
		//	},
		//}
	}

	eCount, exists := res["result"]

	if !exists {
		return nil
	}

	for _, r := range eCount.([]interface{}) {
		cMap := r.(map[string]interface{})

		eRes := func(k string, v interface{}) {
			EdgeClass(e, k, v, schema)
		}

		utils.SortedMap(cMap, eRes)

	}
	return nil
}

func EdgeClass(eRes *EdgeRes, k string, v interface{}, schema Schema) {
	if strings.HasPrefix(k, "@") {
		return
	}
	if strings.HasPrefix(k, "in_") {
		in := Edge{
			Class: k[3:],
			Count: v.(float64),
		}

		for _, s := range schema.E {
			if s.Name == in.Class {
				in.Alias = s.Alias
				in.Color = s.Color
				break
			}
		}

		eRes.InE = append(eRes.InE, in)

	} else {
		out := Edge{
			Class: k[4:],
			Count: v.(float64),
		}

		for _, s := range schema.E {
			if s.Name == out.Class {
				out.Alias = s.Alias
				out.Color = s.Color
				break
			}
		}
		eRes.OutE = append(eRes.OutE, out)
	}
}

func (s *VSearchRes) GetV(conf *utils.KGConf, class, rid string) error {
	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/command/" + conf.DB + "/sql",
		Method: "command",
	}

	sql := `select from %s where @rid = %s`
	sql = fmt.Sprintf(sql, class, rid)
	response, err := GetGraphData(&operator, sql)

	if err != nil {
		return err
	}

	var res map[string]interface{}
	err = json.Unmarshal(response, &res)

	if err != nil {
		return err
	}

	sc, exists := res["result"]

	if !exists {
		return nil
	}

	for _, r := range sc.([]interface{}) {
		rMap := r.(map[string]interface{})
		rec := VRecord{
			Class:   rMap["@class"].(string),
			Rid:     rMap["@rid"].(string),
			Version: rMap["@version"].(float64),
			In:      map[string][]string{},
			Out:     map[string][]string{},
		}

		for k, v := range rMap {
			ProcessV(&rec, k, v)
		}

		s.Res = append(s.Res, rec)
	}
	return nil
}

func (e *ESearchRes) GetE(conf *utils.KGConf, eclass string, vrid string, inout string, page int32, size int32) error {
	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/command/" + conf.DB + "/sql",
		Method: "command",
	}
	//var operator = Operator{
	//	User:   "root",
	//	PWD:    "YW55ZGF0YTEyMw==",
	//	URL:    "http://10.4.68.144:2480" + "/command/" + conf.DB + "/sql",
	//	Method: "command",
	//}

	// 首次配置无推荐
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

	//if eclass == "" || inout == "" {
	//	return utils.ErrInfo(utils.ErrOrientDBErr, errors.New("Not Found"))
	//}

	// 查询边属性
	var io string
	if inout == "out" {
		io = "outE"
	} else if inout == "in" {
		io = "inE"
	} else {
		io = "bothE"
	}

	skip, limit := (page-1)*size, size

	sqlPro := fmt.Sprintf(`select expand( %s(%s)) from %s`, io, eclass, vrid)
	if size > -1 {
		sqlPro = sqlPro + fmt.Sprintf(" skip %d limit %d", skip, limit)
	}

	//logger.Info(sqlPro)
	responsePro, errPro := GetGraphData(&operator, sqlPro)

	if errPro != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, errPro)
	}
	var resPro map[string]interface{}
	errPro = json.Unmarshal(responsePro, &resPro)

	if errPro != nil {
		return utils.ErrInfo(utils.ErrInternalErr, errPro)
	}

	if e, exists := resPro["errors"]; exists {
		return utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
		//return utils.ServError{
		//	Code:    utils.ErrOrientDBErr,
		//	Message: utils.ErrMsgMap[utils.ErrOrientDBErr],
		//	Cause:   "Query error",
		//	Detail: map[string]interface{}{
		//		"err": e,
		//	},
		//}
	}

	ePro, exists := resPro["result"]

	if !exists {
		return nil
	}

	// 为了将边与顶点匹配，先保存一个边的 map
	// eMap := make(map[string]*ERecord)
	eProList := ePro.([]interface{})
	relatedVIDList := make([]string, len(eProList))
	for i, r := range eProList {
		rMap := r.(map[string]interface{})
		rec := ERecord{
			Class:   rMap["@class"].(string),
			Rid:     rMap["@rid"].(string),
			Name:    rMap["@class"].(string),
			Version: rMap["@version"].(float64),
		}

		processFunc := func(k string, v interface{}) {
			relatedV := ProcessE(&rec, k, v, vrid)

			if relatedV != "" {
				vrec := VRecord{
					Rid: relatedV,
				}

				if rMap["in"].(string) == vrid { //进边
					rec.Out = vrec
				} else { //出边
					rec.In = vrec
				}
				relatedVIDList[i] = relatedV
			}
		}

		for _, s := range schema.E {
			if s.Name == rec.Class {
				rec.Alias = s.Alias
				rec.Color = s.Color
				break
			}
		}

		utils.SortedMap(rMap, processFunc)

		e.Res = append(e.Res, &rec)
	}

	// inout:查询进边或出边
	var sql string
	if conf.Version == 2 {
		sql = `select expand(@this.exclude("in_*", "out_*")) from (select *, out().size() as out, in().size() as in from (select * from V where @rid in [%s]))`
		sql = fmt.Sprintf(sql, strings.Join(relatedVIDList, ","))
	} else {
		sql = `select expand(res) from (select @this:{!out_*, !in_*} as res from (select *, out().size() as out, in().size() as in from (select * from V where @rid in [%s])))`
		sql = fmt.Sprintf(sql, strings.Join(relatedVIDList, ","))
	}

	//logger.Info(sql)
	response, err := GetGraphData(&operator, sql)

	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	var res map[string]interface{}
	err = json.Unmarshal(response, &res)

	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	if e, exists := resPro["errors"]; exists {
		return utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
	}

	sc, exists := res["result"]

	if !exists {
		return nil
	}

	// 处理边关联的点
	candidates := sc.([]interface{})
	for _, r := range candidates {
		vMap := r.(map[string]interface{})
		vrec := VRecord{
			Class:    vMap["@class"].(string),
			Name:     vMap["@class"].(string),
			Rid:      vMap["@rid"].(string),
			Expand:   true,
			Analysis: false,
			Version:  vMap["@version"].(float64),
			In:       map[string][]string{},
			Out:      map[string][]string{},
		}

		processFunc := func(k string, v interface{}) {
			ProcessV(&vrec, k, v)
		}

		utils.SortedMap(vMap, processFunc)

		if vMap["in"] == float64(0) && vMap["out"] == float64(0) {
			vrec.Expand = false
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

		for _, ev := range e.Res {
			if ev.In.Rid == vrec.Rid {
				ev.In = vrec
				break
			} else if ev.Out.Rid == vrec.Rid {
				ev.Out = vrec
				break
			}
		}
	}
	return nil
}

func (e *ExpandVRes) ExpandV(conf *utils.KGConf, eclass string, vrid string, inout string, name string, page int32, size int32) error {
	var operator = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/command/" + conf.DB + "/sql",
		Method: "command",
	}
	//var operator = Operator{
	//	User:   "root",
	//	PWD:    "YW55ZGF0YTEyMw==",
	//	URL:    "http://10.4.68.144:2480" + "/command/" + conf.DB + "/sql",
	//	Method: "command",
	//}

	// 首次配置无推荐
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

	// 查询边属性
	var io string
	var eIo string
	var eClassKey string
	if inout == "out" {
		io = "out"
		eIo = "outE"
		if eclass != "" {
			eClassKey = "in_" + eclass
		}
	} else if inout == "in" {
		io = "in"
		eIo = "inE"
		if eclass != "" {
			eClassKey = "out_" + eclass
		}
	} else {
		io = "both"
		eIo = "bothE"
	}

	var pageSql string
	if size > -1 {
		skip, limit := (page-1)*size, size
		pageSql = fmt.Sprintf(" skip %d limit %d", skip, limit)
	}
	var eClassSql string
	if eclass != "" {
		eClassSql = "'" + eclass + "'"
	}
	sqlPro := fmt.Sprintf(`select * from (select expand(%s(%s)) as res from V where @rid='%s') where name like '%s' %s`, io, eClassSql, vrid, "%"+name+"%", pageSql)

	//logger.Info(sqlPro)
	responsePro, errPro := GetGraphData(&operator, sqlPro)

	if errPro != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, errPro)
	}
	var resPro map[string]interface{}
	errPro = json.Unmarshal(responsePro, &resPro)

	if errPro != nil {
		return utils.ErrInfo(utils.ErrInternalErr, errPro)
	}

	if e, exists := resPro["errors"]; exists {
		return utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
	}

	vPro, exists := resPro["result"]

	if !exists {
		return nil
	}

	// 为了将边与顶点匹配，先保存一个边的 map
	vProList := vPro.([]interface{})
	eIDList := make([]string, 0)
	for _, r := range vProList {
		vMap := r.(map[string]interface{})
		vrec := ExpandVRecord{
			Class:    vMap["@class"].(string),
			Rid:      vMap["@rid"].(string),
			Name:     vMap["@class"].(string),
			Version:  vMap["@version"].(float64),
			Expand:   true,
			Analysis: false,
		}

		processFunc := func(k string, v interface{}) {
			if eClassKey == "" && (strings.HasPrefix(k, "in_") || strings.HasPrefix(k, "out_")) {
				vList := v.([]interface{})
				for _, id := range vList {
					eIDList = append(eIDList, id.(string))
				}
			} else {
				ProcessExpandV(&vrec, k, v)
			}
		}

		utils.SortedMap(vMap, processFunc)

		if eClassKey != "" {
			if v := vMap[eClassKey]; v != nil {
				for _, id := range v.([]interface{}) {
					eIDList = append(eIDList, id.(string))
				}
			}
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
		e.Res = append(e.Res, &vrec)
	}

	sqlPro = fmt.Sprintf("select * from (select expand(%s(%s)) from %s) where @rid in [%s]", eIo, eClassSql, vrid, strings.Join(eIDList, ","))
	//logger.Info(sqlPro)
	responsePro, errPro = GetGraphData(&operator, sqlPro)

	if errPro != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, errPro)
	}
	var res map[string]interface{}
	errPro = json.Unmarshal(responsePro, &res)

	if errPro != nil {
		return utils.ErrInfo(utils.ErrInternalErr, errPro)
	}

	if e, exists := res["errors"]; exists {
		return utils.ErrInfo(utils.ErrOrientDBErr, e.(error))
	}

	ePro, exists := res["result"]

	if !exists {
		return nil
	}
	eProList := ePro.([]interface{})
	for _, r := range eProList {
		rMap := r.(map[string]interface{})
		rec := ERecord{
			Class:   rMap["@class"].(string),
			Rid:     rMap["@rid"].(string),
			Name:    rMap["@class"].(string),
			Version: rMap["@version"].(float64),
		}

		processFunc := func(k string, v interface{}) {
			ProcessE(&rec, k, v, vrid)
		}

		for _, s := range schema.E {
			if s.Name == rec.Class {
				rec.Alias = s.Alias
				rec.Color = s.Color
				break
			}
		}
		utils.SortedMap(rMap, processFunc)

		for _, v := range e.Res {
			if inout == "in" && v.Rid == rMap["out"] {
				v.OutE = append(v.OutE, rec)
				break
			}
			if inout == "out" && v.Rid == rMap["in"] {
				v.InE = append(v.InE, rec)
				break
			}
			if inout == "inout" {
				if v.Rid == rMap["in"] {
					v.InE = append(v.InE, rec)
				}
				if v.Rid == rMap["out"] {
					v.OutE = append(v.OutE, rec)
				}
			}
		}
	}
	return nil
}

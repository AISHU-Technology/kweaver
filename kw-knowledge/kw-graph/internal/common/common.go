// Package common 通用包
package common

import (
	"fmt"
	"mime/multipart"
	"net/http"
	"sort"
	"time"
	"unicode"

	errorCode "kw-graph/internal/errors"
)

// PathType 路径类型
type PathType int

const (
	// FULLPATH 全部路径
	FULLPATH PathType = iota
	// SHORTESTPATH 最短路径
	SHORTESTPATH
	// NOLOOPPATH 无环路径
	NOLOOPPATH
)
const (
	// NULLVAL null值常量
	NULLVAL = "__NULL__"
)

// In 判断字符串是否在某字符串数组中
func In(target string, strArray []string) bool {
	sort.Strings(strArray)
	index := sort.SearchStrings(strArray, target)
	// index的取值：[0,len(strArray)]
	if index < len(strArray) && strArray[index] == target { // 需要注意此处的判断，先判断 &&左侧的条件，如果不满足则结束此处判断，不会再进行右侧的判断
		return true
	}
	return false
}

// GetIndexInSlice 从字符串数组中查找元素下标
func GetIndexInSlice(val string, slice []string) int {
	for p, v := range slice {
		if v == val {
			return p
		}
	}
	return -1
}

// GetSystemTimeVar 生成系统时间变量字符串，目前只支持日期
func GetSystemTimeVar(varType string, offset int64) (string, error) {
	// 今天today                            上周末 last weekend
	// 上月末 end of last month             上周第一天 first day of last week
	// 上月第一天 first day of last month    去年末 end of last year
	// 去年第一天 first day of last year     明年末 end of next year
	// 明年第一天 first day of next year
	timeNow := time.Now()
	timeVar := time.Time{}
	switch varType {
	case "today":
		timeVar = timeNow

	case "last weekend":
		timeVar = timeNow.AddDate(0, 0, -int(timeNow.Weekday()))

	case "end of last month":
		timeVar = timeNow.AddDate(0, 0, -timeNow.Day())

	case "first day of last week":
		timeVar = timeNow.AddDate(0, 0, -int(timeNow.Weekday())-6)

	case "first day of last month":
		timeVar = timeNow.AddDate(0, 0, -timeNow.Day()+1)
		timeVar = timeVar.AddDate(0, -1, 0)

	case "end of last year":
		timeVar = timeNow.AddDate(0, 0, -timeNow.YearDay())

	case "first day of last year":
		timeVar = timeNow.AddDate(0, 0, -timeNow.YearDay()+1)
		timeVar = timeVar.AddDate(-1, 0, 0)

	case "end of next year":
		timeVar = timeNow.AddDate(0, 0, -timeNow.YearDay()+1)
		timeVar = timeVar.AddDate(2, 0, -1)

	case "first day of next year":
		timeVar = timeNow.AddDate(0, 0, -timeNow.YearDay()+1)
		timeVar = timeVar.AddDate(1, 0, 0)

	default:
		return "", errorCode.New(http.StatusBadRequest, errorCode.ArgsError, "wrong parameter")
	}
	timeVar = timeVar.AddDate(0, 0, int(offset))
	return timeVar.Format("2006-01-02 15:04:05")[0:10], nil
}

// GraphAnalysisOpType  图分析应用操作类型
type GraphAnalysisOpType string

const (
	// CustomSearch 自定义查询
	CustomSearch GraphAnalysisOpType = "custom-search"
	// Neighbors 邻居查询
	Neighbors GraphAnalysisOpType = "neighbors"
	// FullPath 两点之间全部路径查询
	FullPath GraphAnalysisOpType = "full-path"
	// ShortestPath 两点之间最短路径查询
	ShortestPath GraphAnalysisOpType = "shortest-path"
)

// CustomSearchParamType 图分析应用自定义查询参数类型
type CustomSearchParamType string

const (
	// Entity 实体类型
	Entity CustomSearchParamType = "entity"

	// String 字符串类型
	String CustomSearchParamType = "string"
)

// CustomSearchEntityOption 图分析应用自定义查询实体类型
type CustomSearchEntityOption string

const (
	// Single 单个实体
	Single CustomSearchEntityOption = "single"

	// Multiple 多个实体
	Multiple CustomSearchEntityOption = "multiple"
)

// ReplaceInfo 存储替换信息
type ReplaceInfo struct {
	Start  int
	End    int
	NewStr string
}

// ReplaceSubstring 替换字符串多个区间值
func ReplaceSubstring(str string, replacements []ReplaceInfo) string {
	runes := []rune(str)
	for _, r := range replacements {
		valueRunes := []rune(r.NewStr)
		runes = append(runes[:r.Start], append(valueRunes, runes[r.End:]...)...)
	}

	return string(runes)
}

// ReplaceControlChars 将控制字符替换为Unicode代码点，并将结果存储回str变量。
// replaceControlChars函数使用unicode.IsControl函数来检查字符是否为控制字符，并使用fmt.Sprintf函数将其转换为Unicode代码点
func ReplaceControlChars(str string) string {
	var result []rune
	for _, r := range str {
		if unicode.IsControl(r) {
			result = append(result, []rune(fmt.Sprintf("\\u%04X", r))...)
		} else {
			result = append(result, r)
		}
	}
	return string(result)
}

const (
	// DefaultMultipartMemory 默认最大文件大小
	DefaultMultipartMemory = 1024 * 1024 // 10 MB
)

// FromFile 解析form
func FromFile(r *http.Request, name string) (*multipart.FileHeader, error) {
	if r.MultipartForm == nil {
		if err := r.ParseMultipartForm(DefaultMultipartMemory); err != nil {
			return nil, err
		}
	}
	f, fh, err := r.FormFile(name)
	if err != nil {
		return nil, err
	}

	err = f.Close()
	if err != nil {
		return nil, err
	}
	return fh, err
}

// CogSvcType 认知应用类型
type CogSvcType string

const (
	// GraphAnalysis 图分析应用
	GraphAnalysis CogSvcType = "graph-analysis"
)

const (
	// ExpireTime reids 键超时时间10min
	ExpireTime = time.Second * 600
)

// Nebula数据类型
var (
	STRING     = []string{"string", "fixed_string"}
	NUMBER     = []string{"double", "float"}
	INTEGER    = []string{"int", "int8", "int16", "int32", "int64"}
	BOOL       = []string{"bool"}
	NULLSTRING = "NULL"
	// todo 待讨论
	//DATE			   = []string{"date"}
	//TIME			   = []string{"time"}
	//DATETIME		   = []string{"datetime"}
	//TIMESTAMP		   = []string{"timestamp"}

	STRING2NEBULAOPMAP = map[string]string{
		"eq":              "==",
		"neq":             "!=",
		"contains":        "contains",
		"not_contains":    "not contains",
		"starts_with":     "starts with",
		"not_starts_with": "not starts with",
		"ends_with":       "ends with",
		"not_ends_with":   "not ends with",
	}
	BOOL2NEBULAOPMAP = map[string]string{
		"eq":  "==",
		"neq": "!=",
	}
	NUMBER2NEBULAOPMAP = map[string]string{
		"eq":  "==",
		"neq": "!=",
		"gt":  ">",
		"gte": ">=",
		"lt":  "<",
		"lte": "<=",
	}

	FILTERDIR2NEBULADIR = map[EdgeDirection]string{
		POSITIVE: "POSITIVE",
		REVERSE:  "REVERSE",
		BIDIRECT: "BIDIRECT",
	}
)

// NebulaResColType Nebula 返回结果类型
type NebulaResColType int

// 文档类型枚举
const (
	// 点类型
	Node NebulaResColType = 1

	// 边类型
	Edge NebulaResColType = 2

	// 路径类型
	Path NebulaResColType = 3

	// 文本值
	Text NebulaResColType = 4
)

// FilterType 搜索规则筛选条件类型
type FilterType string

const (
	SATISFYALL    FilterType = "satisfy_all"
	SATISFYANY    FilterType = "satisfy_any"
	NOTSATISFYALL FilterType = "unsatisfy_all"
	NOTSATISFYANY FilterType = "unsatisfy_any"
)

// FilterRelation 搜索规则之间的关系
type FilterRelation string

const (
	AND FilterRelation = "and"
	OR  FilterRelation = "or"
)

// EdgeDirection 边的方向
type EdgeDirection string

const (
	POSITIVE EdgeDirection = "positive" // 进边
	REVERSE  EdgeDirection = "reverse"  // 出边
	BIDIRECT EdgeDirection = "bidirect" // 双向
)

// TimeType 时间类型
type TimeType string

const (
	DATE      TimeType = "date"      // 包含日期，但是不包含时间
	TIME      TimeType = "time"      // 包含时间，但是不包含日期
	DATETIME  TimeType = "datetime"  // 包含日期和时间
	TIMESTAMP TimeType = "timestamp" // 时间戳
)

// PathDecision 最短路径决策依据
type PathDecision string

const (
	EDGEQUANTITY   PathDecision = "path_depth"
	WEIGHTPROPERTY PathDecision = "weight_property"
)

func DifferenceOfStringSets(set1, set2 []string) []string {
	// 使用 map 存储 set2 中的元素
	set2Map := make(map[string]bool)
	for _, s := range set2 {
		set2Map[s] = true
	}

	// 计算差异
	var difference []string
	for _, s := range set1 {
		if !set2Map[s] {
			difference = append(difference, s)
		}
	}

	return difference
}

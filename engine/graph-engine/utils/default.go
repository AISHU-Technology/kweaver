// Package utils 项目的通用的工具
// - 描述：基础的工具
// - 时间：2020-2-29
package utils

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"graph-engine/logger"
	"reflect"
	"sort"
	"strconv"
	"strings"
)

// Str2Int 字符串转为 int
func Str2Int(s string) int {
	r, err := strconv.Atoi(s)
	if err != nil {
		panic(errors.New("string to int error"))
	}
	return r
}

// Int2Str int 转为 string
func Int2Str(i int) string {
	return strconv.Itoa(i)
}

//整形转换成字节
func IntToBytes(n int, b byte) []byte {
	switch b {
	case 1:
		tmp := int8(n)
		bytesBuffer := bytes.NewBuffer([]byte{})
		binary.Write(bytesBuffer, binary.BigEndian, &tmp)
		return bytesBuffer.Bytes()
	case 2:
		tmp := int16(n)
		bytesBuffer := bytes.NewBuffer([]byte{})
		binary.Write(bytesBuffer, binary.BigEndian, &tmp)
		return bytesBuffer.Bytes()
	case 3, 4:
		tmp := int32(n)
		bytesBuffer := bytes.NewBuffer([]byte{})
		binary.Write(bytesBuffer, binary.BigEndian, &tmp)
		return bytesBuffer.Bytes()
	}
	return nil
}

//字节数(大端)组转成int(无符号的)
func BytesToIntU(b []byte) int {
	if len(b) == 3 {
		b = append([]byte{0}, b...)
	}
	bytesBuffer := bytes.NewBuffer(b)
	switch len(b) {
	case 1:
		var tmp uint8
		binary.Read(bytesBuffer, binary.BigEndian, &tmp)
		return int(tmp)
	case 2:
		var tmp uint16
		binary.Read(bytesBuffer, binary.BigEndian, &tmp)
		return int(tmp)
	case 4:
		var tmp uint32
		binary.Read(bytesBuffer, binary.BigEndian, &tmp)
		return int(tmp)
	default:
		return 0
	}
}

//字节数(大端)组转成int(有符号)
func BytesToIntS(b []byte) int {
	if len(b) == 3 {
		b = append([]byte{0}, b...)
	}
	bytesBuffer := bytes.NewBuffer(b)
	switch len(b) {
	case 1:
		var tmp int8
		binary.Read(bytesBuffer, binary.BigEndian, &tmp)
		return int(tmp)
	case 2:
		var tmp int16
		binary.Read(bytesBuffer, binary.BigEndian, &tmp)
		return int(tmp)
	case 4:
		var tmp int32
		binary.Read(bytesBuffer, binary.BigEndian, &tmp)
		return int(tmp)
	default:
		return 0
	}
}

const (
	espStr           string = "'\"%"
	slash            rune   = '\\'
	singleQuote      rune   = '\''
	doubleQuote      rune   = '"'
	espStrLucene     string = "+-&|!(){}[]^~*?:\\/"
	espStrMysql      string = "'\""
	espStrMysqlSlash rune   = '\\'
)

// Escape 字符串转义
func Escape(s string) (string, error) {
	var b = new(strings.Builder)
	var e error = nil

	for _, c := range s {
		var in = strings.IndexRune(espStr, c)
		if in != -1 {
			e = b.WriteByte('\\')
		}

		_, e = b.WriteRune(c)
	}

	return b.String(), e
}

// Struct2Map 将 Struct 转为 Map
func Struct2Map(obj interface{}) map[string]interface{} {
	t := reflect.TypeOf(obj)
	v := reflect.ValueOf(obj)

	var data = make(map[string]interface{})
	for i := 0; i < t.NumField(); i++ {
		data[t.Field(i).Name] = v.Field(i).Interface()
	}
	return data
}

// Escape for Lucene
func EscapeLucene(s string) (string, error) {
	var b = new(strings.Builder)
	var e error = nil

	// slashNum := 0
	for _, c := range s {
		var in = strings.IndexRune(espStrLucene, c)

		switch c {
		case slash:
			_, e = b.WriteString("\\\\\\\\\\\\\\\\")
			continue
		case singleQuote:
			_, e = b.WriteString("\\\\")
		case doubleQuote:
			_, e = b.WriteString("\\\\\\\\\\")
		}

		if in != -1 {
			_, e = b.WriteString("\\\\\\\\")
		}

		_, e = b.WriteRune(c)
	}

	//return strings.TrimRight(b.String(), "\\"), e
	return b.String(), e
}

// Escape for Mysql
func EscapeMysql(s string) (string, error) {
	var b = new(strings.Builder)
	var e error = nil

	for _, c := range s {
		var in = strings.IndexRune(espStrMysql, c)

		switch c {
		case espStrMysqlSlash:
			_, e = b.WriteString("\\\\")
			continue
		}

		if in != -1 {
			_, e = b.WriteString("\\")
		}

		_, e = b.WriteRune(c)
	}

	//return strings.TrimRight(b.String(), "\\"), e
	return b.String(), e
}

// sortMap
func SortedMap(m map[string]interface{}, f func(k string, v interface{})) {
	var keys []string
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		f(k, m[k])
	}
}

// escape invalid character
func EscapeInvalidC(s *[]byte) {
	for i, ch := range *s {
		if IsControl(ch) {
			(*s)[i] = 0xff
		}
	}
}

// 判断数组中是否含有指定字符串
func In(target string, str_array []string) bool {
	sort.Strings(str_array)
	index := sort.SearchStrings(str_array, target)
	//index的取值：[0,len(str_array)]
	if index < len(str_array) && str_array[index] == target { //需要注意此处的判断，先判断 &&左侧的条件，如果不满足则结束此处判断，不会再进行右侧的判断
		return true
	}
	return false
}

// json 解析错误分析
func UnmarshalErr(response []byte, err error) {
	switch t := err.(type) {
	case *json.SyntaxError:
		jsn := string(response[0:t.Offset])
		jsn += "--(Invalid Character)"
		logger.Error(fmt.Sprintf("Invalid character at offset %v\n %s", t.Offset, jsn))
	case *json.UnmarshalTypeError:
		jsn := string(response[0:t.Offset])
		jsn += "--(Invalid Type)"
		logger.Error(fmt.Sprintf("Invalid value at offset %v\n %s", t.Offset, jsn))
	}
}

// sql注入时，占位符个数
func CreateQuestionMarks(n int) string {
	s := "?"
	for i := 1; i < n; i++ {
		s += ",?"
	}
	return s
}

//删去nebula返回string中的首尾各一个引号
func TrimQuotationMarks(s string) string {
	if s[0] == '"' {
		return s[1 : len(s)-1]
	}
	return s
}

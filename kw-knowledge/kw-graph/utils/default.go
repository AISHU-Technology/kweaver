package utils

import (
	"bytes"
	"encoding/binary"
	"errors"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"unicode"
)

// 删去nebula返回string中的首尾各一个引号
func TrimQuotationMarks(s string) string {
	if s == "" {
		return s
	}
	if s[0] == '"' {
		return s[1 : len(s)-1]
	}
	return s
}

func ParseTime(time string) string {
	//对错误格式不作判断
	//仅用于将yyyy/MM/dd和yyyyMMdd格式的时间统一成yyyy-MM-dd

	if len(time) > 4 {
		// 处理yyyyMM的情况
		if unicode.IsDigit(rune(time[4])) {
			time = time[0:4] + "-" + time[4:]
			if len(time) > 7 {
				//处理yyyy - MMdd的情况
				if unicode.IsDigit(rune(time[7])) {
					time = time[0:7] + "-" + time[7:]
				}
			}
		}
	}
	//处理yyyy / MM / dd的情况
	time = strings.Replace(time, "/", "-", -1)

	return time
}

// In 判断字符串是否在某字符串数组中
func In(target string, str_array []string) bool {
	sort.Strings(str_array)
	index := sort.SearchStrings(str_array, target)
	//index的取值：[0,len(str_array)]
	if index < len(str_array) && str_array[index] == target { //需要注意此处的判断，先判断 &&左侧的条件，如果不满足则结束此处判断，不会再进行右侧的判断
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

// Swap 更换字符串切片元素位置
func Swap(slice []string, i, j int) {
	slice[i], slice[j] = slice[j], slice[i]
}

// Prepend 将元素放到首位去
func Prepend(slice []string, str string) []string {
	// 创建一个新的字符串切片，长度为原始切片长度加1
	newSlice := make([]string, len(slice)+1)

	// 将新字符串添加到新切片的首位
	newSlice[0] = str

	// 将原始切片中的元素复制到新切片中
	copy(newSlice[1:], slice)

	return newSlice
}

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

// 整形转换成字节
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

// 字节数(大端)组转成int(无符号的)
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

// 字节数(大端)组转成int(有符号)
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

// sql注入时，占位符个数
func CreateQuestionMarks(n int) string {
	s := "?"
	for i := 1; i < n; i++ {
		s += ",?"
	}
	return s
}

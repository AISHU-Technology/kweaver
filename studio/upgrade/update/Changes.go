package update

/**
 * @Author: 王运凯
 * @Date: 2022/2/18
 * @Email: William.wang@aishu.cn
 **/

type Change struct {
	// 要修改字段名字
	FieldName string
	// 修改后字段名称
	FieldNewName string
	// 字段类型
	FieldType string
	// 默认值
	DefaultValue string
	// 操作
	Action int
	// 表名称
	ModelName string
	// 版本
	Version int
}

// 下面是第二版本，比较第一个版本需要处理的东西。
var CHANGE = []Change{}

func GetChangeByVersion(version int) []Change {
	Changes := make([]Change, 0)
	for _, item := range CHANGE {
		if item.Version == version {
			Changes = append(Changes, item)
		}
	}
	return Changes
}

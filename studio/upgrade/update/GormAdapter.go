package update

import (
	"errors"
	"fmt"
	"gorm.io/gorm"
	"kw-studio/global"
	"kw-studio/model/po"
	"reflect"
	"strings"
)

/*
 * @Author: 夏华楼
 * @Date: 2021/3/2 11:12
 * @Email: Variou.xia@aishu.cn
 */

var Repo *Repository

const (
	ALTER_DROP        = "ALTER TABLE %s DROP %s;"
	ALTER_RENAME      = "ALTER TABLE %s RENAME COLUMN %s TO %s;"
	ALTER_ADD         = "ALTER TABLE %s ADD COLUMN %s %s;"
	ALTER_ADD_DEFAULT = "ALTER TABLE %s ADD COLUMN %s %s DEFAULT %s;"
	ALTER_FILED_TYPE  = "ALTER TABLE %s MODIFY %s %s;"
	ALTER_COLUMN_DROP = iota
	ALTER_COLUMN_RENAME
	ALTER_COULUMN_ADD
	ALTER_COULUMN_ADD_DEAFULT
	ALTER_COLUMN_TYPE
)

type PageLimit struct {
	Page int
	Size int
}

var OperateMap map[int]string

func init() {
	OperateMap = make(map[int]string)
	OperateMap[ALTER_COLUMN_DROP] = ALTER_DROP
	OperateMap[ALTER_COLUMN_TYPE] = ALTER_FILED_TYPE
	OperateMap[ALTER_COLUMN_RENAME] = ALTER_RENAME
	OperateMap[ALTER_COULUMN_ADD] = ALTER_ADD
	OperateMap[ALTER_COULUMN_ADD_DEAFULT] = ALTER_ADD_DEFAULT
}

type Repository struct { //把model加进去会自动建表，自动获取所有model包括嵌套的内容
	Conn           *gorm.DB
	TableMapping   map[string][]string            //备用 递归获取的所有数据字段去掉了tag不要的{"表名":["字段名1",字段名2]}
	ColumnsMapping map[string]map[string]struct{} //备用 递归获取的所有数据字段map,{"表名":{"字段名1":"空结构体","字段名2":"空结构体"},将来用来判断字段是否存在用
	po.Version
}

type _w struct {
	sql string
	val []interface{}
}

func Where(sql string, vals ...interface{}) *_w {
	return &_w{sql, vals}
}

func (r *Repository) Install() {
	if r.Conn == nil {
		r.Conn = global.DB
	}
	r_type := reflect.TypeOf(*r)
	r_value := reflect.ValueOf(*r)
	r.TableMapping = make(map[string][]string)
	r.ColumnsMapping = make(map[string]map[string]struct{})
	for i := 3; i < r_type.NumField(); i++ {
		table := r_value.Field(i).Interface()
		if !r.Conn.Migrator().HasTable(table) {
			if r.Conn.Migrator().CreateTable(table) != nil {
				global.LOG.Info(fmt.Sprintf("create table %s failed", r_type.Field(i).Name))
			} else {
				global.LOG.Info(fmt.Sprintf("create table %s successfully", r_type.Field(i).Name))
			}
		}
		inner_table := reflect.TypeOf(table)
		for j := 0; j < inner_table.NumField(); j++ {
			if inner_table.Field(j).Tag.Get("gorm") != "-" {
				r.TableMapping[inner_table.Name()] = append(r.TableMapping[inner_table.Name()], DeepFields(inner_table.Field(j))...)
			}
		}
	}
	for table, columns := range r.TableMapping {
		if _, ok := r.ColumnsMapping[table]; !ok {
			r.ColumnsMapping[table] = make(map[string]struct{})
		}
		for _, column := range columns {
			r.ColumnsMapping[table][column] = struct{}{}
		}
	}
}

func (r *Repository) Pool() *gorm.DB {
	return r.Conn
}

func (r *Repository) TableName(tables ...interface{}) []string {
	var result []string
	for _, table := range tables {
		result = append(result, reflect.TypeOf(table).Name())
	}
	return result
}

func (r *Repository) Create(records ...interface{}) error {
	errs := make([]string, 0)
	for _, rec := range records {
		if r.Conn.Create(rec).RowsAffected == 0 {
			if r.Conn.Error != nil {
				errs = append(errs, r.Conn.Error.Error())
			}
		}
	}
	return errors.New(strings.Join(errs, ","))
}

func (r *Repository) Delete(model interface{}, conds ...interface{}) error {
	return r.Conn.Delete(model, conds...).Error
}

func (r *Repository) Update(model interface{}, conds ...interface{}) error { //更新多个
	if len(conds) == 1 {
		if _, ok := conds[0].(map[string]interface{}); ok {
			return r.Conn.Model(model).Where("id > ?", 0).Updates(conds[0]).Error
		} else {
			return errors.New("condition not enough")
		}
	}
	if len(conds) == 0 {
		return r.Conn.Save(model).Error
	} else {
		for i, cond := range conds {
			if _, ok := cond.(*_w); ok {
				where := cond.(*_w)
				if len(conds) == 2 {
					if i == 0 {
						if _, ok := conds[1].(map[string]interface{}); ok {
							return r.Conn.
								Model(model).
								Where(where.sql, where.val...).
								Updates(conds[1].(map[string]interface{})).Error
						} else {
							return errors.New("columns type error")
						}
					} else {
						if _, ok := conds[0].(map[string]interface{}); ok {
							return r.Conn.
								Model(model).
								Where(where.sql, where.val...).
								Updates(conds[0].(map[string]interface{})).Error
						} else {
							return errors.New("columns type error")
						}
					}
				} else if len(conds) == 3 {
					if i == 0 {
						if _, ok := conds[1].(string); !ok {
							return errors.New("column must be string")
						} else {
							return r.Conn.Model(model).Where(where.sql, where.val...).Update(conds[1].(string), conds[2]).Error
						}
					} else {
						if _, ok := conds[0].(string); !ok {
							return errors.New("column must be string")
						} else {
							update := make([]interface{}, 0)
							for j, _ := range conds {
								if j == i {
									continue
								}
								update = append(update, conds[j])
							}
							return r.Conn.Model(model).Where(where.sql, where.val...).Update(update[0].(string), update[1]).Error
						}
					}
				} else {
					return errors.New("params length must in [1,2,3]")
				}
			} else {
				continue
			}
		}
		if len(conds) == 2 {
			return r.Conn.Model(model).Where("id > ?", 0).Update(conds[0].(string), conds[1]).Error
		} else if len(conds) == 1 {
			if _, ok := conds[0].(map[string]interface{}); ok {
				return r.Conn.Model(model).Where("id > ?", 0).Updates(conds[0]).Error
			}
		}
	}
	return errors.New("param error")
}

//如果需要分页,分页参数必须最后一个传
func (r *Repository) Select(models interface{}, conds ...interface{}) error {
	if len(conds) == 1 {
		return errors.New("condition not enough")
	}
	var err error
	if len(conds) == 0 {
		err = r.Conn.Find(models).Error
	} else {
		var _copy []interface{}
		pageIndex := 0
		for i, cond := range conds {
			if _, ok := cond.(*PageLimit); ok {
				if i == 0 {
					_copy = append(_copy, conds[1:]...)
				} else {
					_copy = append(_copy, conds[0:i]...)
					_copy = append(_copy, conds[i+1:]...)
				}
				pageIndex = i
				break
			}
		}
		if _copy != nil {
			return r.Conn.Where(_copy[0], _copy[1:]...).
				Limit(conds[pageIndex].(*PageLimit).Page).
				Offset(conds[pageIndex].(*PageLimit).Size * (conds[pageIndex].(*PageLimit).Page - 1)).
				Find(models).Error
		} else {
			return r.Conn.Where(conds[0], conds[1:]...).Find(models).Error
		}
	}
	return err
}

func DeepFields(field reflect.StructField) []string { //递归获取嵌套model字段
	fields := make([]string, 0)
	if field.Tag.Get("gorm") == "-" {
		return fields
	}
	if field.Tag.Get("gorm") == "embedded" {
		val := reflect.New(field.Type).Elem().Interface()
		typ := reflect.TypeOf(val)
		for i := 0; i < typ.NumField(); i++ {
			fields = append(fields, DeepFields(typ.Field(i))...)
		}
	} else {
		fields = append(fields, field.Name)
	}
	return fields
}

func (r *Repository) ApplyChanges(changes ...Change) {
	err := r.Conn.Transaction(func(tx *gorm.DB) error {
		for _, change := range changes {
			tx.Exec(r.SqlGenerator(change))
			if tx.Error != nil {
				return tx.Error
			}
		}
		return nil
	})
	global.LOG.Info(err.Error())
}

func (r *Repository) SqlGenerator(change Change) string {
	switch change.Action {
	case ALTER_COLUMN_DROP:
		return fmt.Sprintf(OperateMap[change.Action], change.ModelName, change.FieldName)
	case ALTER_COLUMN_RENAME:
		return fmt.Sprintf(OperateMap[change.Action], change.ModelName, change.FieldName, change.FieldNewName)
	case ALTER_COULUMN_ADD:
		return fmt.Sprintf(OperateMap[change.Action], change.ModelName, change.FieldName, change.FieldType)
	case ALTER_COULUMN_ADD_DEAFULT:
		return fmt.Sprintf(OperateMap[change.Action], change.ModelName, change.FieldName, change.FieldType, change.DefaultValue)
	case ALTER_COLUMN_TYPE:
		return fmt.Sprintf(OperateMap[change.Action], change.ModelName, change.FieldName, change.FieldType)
	default:
		return "error sql"
	}
}

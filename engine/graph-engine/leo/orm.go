// Package leo 提供了 Web 框架使用的工具集
// - 描述：当前文件提供了ORM增删改查方法
// - 时间：2020-1-5
package leo

import (
	"xorm.io/xorm"
)

// ORM object
type ORM struct {
	Engine *xorm.Engine
}

// NewORM constructor for ORM
func NewORM(driverName, dataSourceName string) (*ORM, error) {
	engine, err := xorm.NewEngine(driverName, dataSourceName)
	return &ORM{Engine: engine}, err
}

// ShowSQL show sql
func (orm *ORM) ShowSQL(show ...bool) {
	orm.Engine.ShowSQL(show...)
}

//func (orm *ORM) Exist(beans ...interface{}) (bool, error) {
//	exist, err := orm.Engine.Exist(beans...)
//	return exist, err
//}

// CreateTables create tables
func (orm *ORM) CreateTables(beans ...interface{}) error {
	err := orm.Engine.CreateTables(beans...)
	return err
}

// Insert records
func (orm *ORM) Insert(beans ...interface{}) error {
	_, err := orm.Engine.Insert(beans...)
	return err
}

// Delete records
func (orm *ORM) Delete(beans interface{}) error {
	_, err := orm.Engine.Delete(beans)
	return err
}

// Update records
func (orm *ORM) Update(bean interface{}, condiBeans ...interface{}) error {
	_, err := orm.Engine.Update(bean, condiBeans...)
	return err
}

// Find records
func (orm *ORM) Find(bean interface{}, condiBeans ...interface{}) error {
	err := orm.Engine.Find(bean, condiBeans...)
	return err
}

package upgrade

import (
	"fmt"
	"kw-studio/global"
	"kw-studio/model/po"
	"kw-studio/upgrade/update"
	"strings"
	"sync"
)

/**
 * @Author: 王运凯
 * @Date: 2021/12/2
 * @Email: William.wang@aishu.cn
 **/

// 系统信息使用log打印，报错使用panic直接报错处理。
// 次结构用来记录所有默认升级组件
// 以一个结构体为例，1.0.2.3 当中存储了 1.0.2.2 的升级，1.0.2.3 的降级，1.0.2.3 的初始化。
// 在降级过程中，需要使用本次降级，升级，需要使用后一个升级。初始化，使用本身的初始化。
// 比较
var (
	Version = map[string]int{"1.1.1": 1}
	once    = &sync.Once{}
)

const version = "studio-1.1.1" // 此版本用来确定当前程序版本

// Upgrade model 层存储历史升级的所有model结构，均需要兼容。
func Upgrade() {
	global.LOG.Info(fmt.Sprintf("The current version is:%s", version))
	// 处理字符串为能处理形式
	versionSplit := strings.Split(version, "-")[1]
	db := global.DB
	// 判断版本表是否存在，版本表不允许更改
	versionExist := db.Migrator().HasTable(&po.Version{})
	dbVersion := po.Version{}
	if versionExist {
		err := db.Model(&po.Version{}).Where("id = ?", 1).Find(&dbVersion).Error
		if err != nil {
			global.LOG.Info("Failed to get database version")
			panic(err)
		}
		global.LOG.Info(fmt.Sprintf("The data version obtained from the database is:%v", dbVersion))
	}

	// 如果表存在，就处理存在后升级和降级逻辑
	// 如果表不存在，就初始化当前版本数据。
	once.Do(func() {
		update.Repo = &update.Repository{Conn: db}
	})
	update.Repo.Install()
	if versionExist && dbVersion.StudioVersion != "" {
		// 表存在逻辑

		// 如果表存在，先获取当前版本。并处理成可比较形式。
		dbVersionSplit := strings.Split(dbVersion.StudioVersion, "-")[1]

		if strings.Compare(dbVersionSplit, versionSplit) == 0 {
			global.LOG.Info("The upgrade version is the same as the system version, and no upgrade processing is performed.")
			return
		} else {
			result := GetChanges(dbVersionSplit, versionSplit)
			if len(result) == 0 {
				panic("Downgrade not supported")
			} else {
				for _, v := range result {
					update.Repo.ApplyChanges(update.GetChangeByVersion(v)...)
				}
			}
		}
	}
	CreateDefaultRecords()
	if versionExist {
		db.Model(&po.Version{}).Where("id = ?", 1).Update("studio_version", version)
	} else {
		update.Repo.Create(
			&po.Version{StudioVersion: version},
		)
	}
}

func CreateDefaultRecords() {
	update.Repo.Create()
}

func GetChanges(oldVersion string, newVersion string) []int {
	versionList := []int{}

	oldVersionNum := Version[oldVersion]
	newVersionNum := Version[newVersion]
	if oldVersionNum > newVersionNum {
		return versionList
	}
	for i := oldVersionNum + 1; i <= newVersionNum; i++ {
		versionList = append(versionList, i)
	}
	return versionList
}

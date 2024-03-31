package repo

import (
	"kw-system/internal/model/po"
	"kw-system/internal/model/types"
)

// DictRepo 字典 数据访问层
type DictRepo interface {
	// GetDictList 获取字典列表
	GetDictList(req *types.ReqGetDictList) (*types.ListVo, error)
	// GetDict 获取指定字典详情
	GetDict(dictId int) (*po.TDict, error)
	// AddDict 创建字典
	AddDict(req *types.ReqAddDict) error
	// UpdateDict 修改字典
	UpdateDict(req *types.ReqUpdateDict) error
	// DeleteDict 删除字典
	DeleteDict(req *types.ReqDeleteDict) error
	// GetDictItemList 获取指定字典下的字典值列表
	GetDictItemList(req *types.ReqGetDictItemList) (*types.ListVo, error)
	// GetDictItem 获取指定字典值详情
	GetDictItem(dictItemId int) (*po.TDictItem, error)
	// AddDictItem 创建字典值
	AddDictItem(req *types.ReqAddDictItem) error
	// UpdateDictItem 修改字典值
	UpdateDictItem(req *types.ReqUpdateDictItem) error
	// DeleteDictItem 删除字典值
	DeleteDictItem(req *types.ReqDeleteDict) error
	// GetDictId 根据字典类型获取字典id
	GetDictId(dictType string) (int, error)
	// GetDictItemIdList 通过字典id获取字典值id列表
	GetDictItemIdList(dictIds []int) ([]int, error)
	// GetDictIds 通过字典id获取数据库中存在的字典id
	GetDictIds(dictIds []int) ([]int, error)
	// GetDictItemCount  通过字典id和字典值获取记录条数
	GetDictItemCount(dictId int, itemValue string) (int64, error)
	// GetDictItemIds 通过字典值id获取数据库中存在的字典值id
	GetDictItemIds(dictItemIds []int) ([]int, error)
}

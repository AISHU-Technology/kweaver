package impl

import (
	"github.com/AISHU-Technology/kw-go-core/utils"
	"kw-system/internal/errors"
	"kw-system/internal/model/po"
	"kw-system/internal/model/types"
	"kw-system/internal/repo"
	"kw-system/internal/svc"
	"time"
)

type DictRepo struct {
	svcCtx *svc.ServiceContext
}

func NewDictRepo(svcCtx *svc.ServiceContext) repo.DictRepo {
	return &DictRepo{
		svcCtx: svcCtx,
	}
}

func (e DictRepo) GetDictList(req *types.ReqGetDictList) (*types.ListVo, error) {
	var list = &types.ListVo{}
	dictModels := make([]*po.TDict, 0)
	session := e.svcCtx.DB.Model(&po.TDict{})
	if req.Key != "" {
		session = session.Where("f_c_name like ? or f_e_name like ? or f_dict_type like ?", "%"+req.Key+"%", "%"+req.Key+"%", "%"+req.Key+"%")
	}
	if err := session.Count(&list.Total).Error; err != nil {
		return nil, errors.InternalServerError.SetDetailError(err)
	}
	if req.Size != 0 {
		if err := session.Offset((req.Page - 1) * req.Size).Limit(req.Size).Find(&dictModels).Error; err != nil {
			return nil, errors.InternalServerError.SetDetailError(err)
		}
	}
	list.Data = dictModels
	return list, nil
}

func (e DictRepo) GetDict(dictId int) (*po.TDict, error) {

	dictModel := &po.TDict{}
	//忽略是否删除
	if err := e.svcCtx.DB.Model(&po.TDict{}).Unscoped().Where("f_id = ?", dictId).Find(&dictModel).Error; err != nil {
		return nil, errors.InternalServerError.SetDetailError(err)
	}
	return dictModel, nil
}

func (e DictRepo) AddDict(req *types.ReqAddDict) error {

	model := &po.TDict{
		CName:    req.CName,
		EName:    req.EName,
		Remark:   req.Remark,
		DictType: req.DictType,
		CreateBy: req.UserId,
		UpdateBy: req.UserId}

	if err := e.svcCtx.DB.Model(&po.TDict{}).Create(model).Error; err != nil {
		return errors.InternalServerError.SetDetailError(err)
	}
	return nil
}

func (e DictRepo) UpdateDict(req *types.ReqUpdateDict) error {
	model := &po.TDict{
		CName:      req.CName,
		EName:      req.EName,
		Remark:     req.Remark,
		UpdateBy:   req.UserId,
		UpdateTime: time.Now()}

	if err := e.svcCtx.DB.Model(&po.TDict{}).Select("f_c_name", "f_e_name", "f_remark", "f_update_by", "f_update_time").Where("f_id = ?", req.Id).Updates(model).Error; err != nil {
		return errors.InternalServerError.SetDetailError(err)
	}
	return nil
}
func (e DictRepo) DeleteDict(req *types.ReqDeleteDict) error {

	if len(req.Ids) > 0 {
		//更新修改人、修改时间、删除状态
		if err := e.svcCtx.DB.Model(&po.TDict{}).Select("f_update_by", "f_update_time", "f_del_flag").Where("f_id in (?)", req.Ids).Updates(&po.TDict{UpdateBy: req.UserId, UpdateTime: time.Now(), DelFlag: 1}).Error; err != nil {
			return errors.InternalServerError.SetDetailError(err)
		}

		if err := e.svcCtx.DB.Model(&po.TDictItem{}).Select("f_update_by", "f_update_time", "f_del_flag").Where("f_dict_id in (?)", req.Ids).Updates(&po.TDictItem{UpdateBy: req.UserId, UpdateTime: time.Now(), DelFlag: 1}).Error; err != nil {
			return errors.InternalServerError.SetDetailError(err)
		}
	}
	return nil
}

func (e DictRepo) GetDictItemList(req *types.ReqGetDictItemList) (*types.ListVo, error) {
	var list = &types.ListVo{}
	dictItems := make([]*po.TDictItem, 0)

	session := e.svcCtx.DB.Model(&po.TDictItem{}).Where("f_dict_id = ?", req.FieldValue)
	if req.Key != "" {
		session = session.Where("f_c_name like ? or f_e_name like ? or f_item_value like ?", "%"+req.Key+"%", "%"+req.Key+"%", "%"+req.Key+"%")
	}

	if err := session.Count(&list.Total).Error; err != nil {
		return nil, errors.InternalServerError.SetDetailError(err)
	}
	if req.Size != 0 {
		if err := session.Offset((req.Page - 1) * req.Size).Limit(req.Size).Find(&dictItems).Error; err != nil {
			return nil, errors.InternalServerError.SetDetailError(err)
		}
	}
	list.Data = dictItems
	return list, nil

}

func (e DictRepo) GetDictItem(dictItemId int) (*po.TDictItem, error) {
	model := &po.TDictItem{}
	//忽略是否删除
	if err := e.svcCtx.DB.Model(&po.TDictItem{}).Unscoped().Where("f_id = ?", dictItemId).Find(&model).Error; err != nil {
		return nil, errors.InternalServerError.SetDetailError(err)
	}
	return model, nil
}

func (e DictRepo) AddDictItem(req *types.ReqAddDictItem) error {

	//新建字典值
	dictId, err := utils.StrToInt(req.DictId)
	if err != nil {
		return errors.InternalServerError.SetDetailError(err)
	}
	model := &po.TDictItem{
		CName:     req.CName,
		EName:     req.EName,
		Remark:    req.Remark,
		DictId:    uint64(dictId),
		ItemValue: req.ItemValue,
		CreateBy:  req.UserId,
		UpdateBy:  req.UserId}
	if err := e.svcCtx.DB.Model(&po.TDictItem{}).Create(model).Error; err != nil {
		return errors.InternalServerError.SetDetailError(err)
	}
	return nil
}

func (e DictRepo) UpdateDictItem(req *types.ReqUpdateDictItem) error {
	model := &po.TDictItem{
		CName:      req.CName,
		EName:      req.EName,
		Remark:     req.Remark,
		ItemValue:  req.ItemValue,
		UpdateBy:   req.UserId,
		UpdateTime: time.Now()}
	if err := e.svcCtx.DB.Model(&po.TDictItem{}).Select("f_c_name", "f_e_name", "f_remark", "f_item_value", "f_update_by", "f_update_time").Where("f_id = ?", req.Id).Updates(model).Error; err != nil {
		return errors.InternalServerError.SetDetailError(err)
	}
	return nil
}

func (e DictRepo) DeleteDictItem(req *types.ReqDeleteDict) error {

	if len(req.Ids) > 0 {
		//更新修改人、修改时间、删除状态
		if err := e.svcCtx.DB.Model(&po.TDictItem{}).Select("f_update_by", "f_update_time", "f_del_flag").Where("f_id in (?)", req.Ids).Updates(&po.TDictItem{UpdateBy: req.UserId, UpdateTime: time.Now(), DelFlag: 1}).Error; err != nil {
			return errors.InternalServerError.SetDetailError(err)
		}
	}
	return nil
}

func (e DictRepo) GetDictId(dictType string) (int, error) {
	dictId := 0
	if err := e.svcCtx.DB.Model(&po.TDict{}).Select("f_id").Where("f_dict_type = ?", dictType).Find(&dictId).Error; err != nil {
		return 0, errors.InternalServerError.SetDetailError(err)
	}
	return dictId, nil
}

func (e DictRepo) GetDictItemIdList(dictIds []int) ([]int, error) {
	var res []int
	if len(dictIds) > 0 {
		if err := e.svcCtx.DB.Model(&po.TDictItem{}).Select("f_id").Where("f_dict_id in (?)", dictIds).Find(&res).Error; err != nil {
			return []int{}, errors.InternalServerError.SetDetailError(err)
		}
	}
	return res, nil
}

func (e DictRepo) GetDictIds(dictIds []int) ([]int, error) {
	var dictItemIds []int
	if len(dictIds) > 0 {
		if err := e.svcCtx.DB.Model(&po.TDict{}).Select("f_id").Where("f_id in (?)", dictIds).Find(&dictItemIds).Error; err != nil {
			return []int{}, errors.InternalServerError.SetDetailError(err)
		}
	}
	return dictItemIds, nil
}

func (e DictRepo) GetDictItemCount(dictId int, itemValue string) (int64, error) {

	var count int64
	if err := e.svcCtx.DB.Model(&po.TDictItem{}).Where("f_dict_id = ? and f_item_value = ?", dictId, itemValue).Count(&count).Error; err != nil {
		return 0, errors.InternalServerError.SetDetailError(err)
	}
	return count, nil
}

func (e DictRepo) GetDictItemIds(dictItemIds []int) ([]int, error) {
	var res []int
	if len(dictItemIds) > 0 {
		if err := e.svcCtx.DB.Model(&po.TDictItem{}).Select("f_id").Where("f_id in (?)", dictItemIds).Find(&res).Error; err != nil {
			return []int{}, errors.InternalServerError.SetDetailError(err)
		}
	}
	return res, nil
}

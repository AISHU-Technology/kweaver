package dict

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/AISHU-Technology/kw-go-core/redis"
	"github.com/AISHU-Technology/kw-go-core/response"
	"github.com/AISHU-Technology/kw-go-core/utils"
	"github.com/zeromicro/go-zero/core/logx"
	"kw-system/internal/common"
	"kw-system/internal/errors"
	"kw-system/internal/log/logger"
	"kw-system/internal/model/po"
	"kw-system/internal/model/types"
	"kw-system/internal/repo/impl"
	"kw-system/internal/svc"
	"time"
)

type DictLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDictLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DictLogic {
	return &DictLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (logic *DictLogic) GetDictList(req *types.ReqGetDictList) (resp interface{}, err error) {

	repo := impl.NewDictRepo(logic.svcCtx)
	res, err := repo.GetDictList(req)
	if err != nil {
		return nil, err
	}
	dicts := make([]*types.RespDict, 0)
	dbData := res.Data.([]*po.TDict)
	for _, model := range dbData {
		dictVo := &types.RespDict{ID: utils.ToString(model.ID), CName: model.CName, EName: model.EName, Remark: model.Remark, DictType: model.DictType,
			CreateBy: model.CreateBy, UpdateBy: model.UpdateBy, CreateTime: response.JsonTime(model.CreateTime), UpdateTime: response.JsonTime(model.UpdateTime)}
		dicts = append(dicts, dictVo)
	}
	res.Data = dicts
	return res, nil
}

func (logic *DictLogic) GetDict(req *types.IdFormVO) (resp interface{}, err error) {
	id, err := utils.StrToInt(req.Id)
	if err != nil {
		return nil, err
	}
	key := fmt.Sprintf(common.KWEAVER_DICT_INFO, id)
	model := &po.TDict{}
	_, result := redis.Get(context.Background(), key)
	//存在缓存
	if len(result) > 0 {
		if err := json.Unmarshal([]byte(result), &model); err != nil {
			return nil, errors.InternalServerError.SetDetailError(err)
		}
	} else {
		repo := impl.NewDictRepo(logic.svcCtx)

		if id, err := utils.StrToInt(req.Id); err != nil {
			return nil, err
		} else {
			if model, err = repo.GetDict(id); err != nil {
				return nil, err
			}
			if model.ID <= 0 {
				return nil, errors.DictionaryNotFoundError
			}
		}

		//将结果缓存到redis
		jsonData, err := json.Marshal(model)
		if err != nil {
			return nil, errors.InternalServerError.SetDetailError(err)
		}
		if err := logic.svcCtx.RedisDB.Write.Set(context.Background(), key, jsonData, time.Duration(utils.RangeRandomNum(5, 10))*time.Second).Err(); err != nil {
			logx.Error(fmt.Sprintf("cache data failed: '%s'", err.Error()))
		}
	}

	res := &types.RespDict{ID: utils.ToString(model.ID), CName: model.CName, EName: model.EName, Remark: model.Remark, DictType: model.DictType,
		CreateBy: model.CreateBy, UpdateBy: model.UpdateBy, CreateTime: response.JsonTime(model.CreateTime), UpdateTime: response.JsonTime(model.UpdateTime)}
	return res, nil
}

func (logic *DictLogic) AddDict(req *types.ReqAddDict) error {

	repo := impl.NewDictRepo(logic.svcCtx)

	//判断字典是否已存在
	dictId, err := repo.GetDictId(req.DictType)
	if err != nil {
		return err
	}
	if dictId > 0 {
		return errors.DictionaryExistError
	}

	//添加字典
	if err := repo.AddDict(req); err != nil {
		return err
	}

	//记录日志
	logModel := logger.NewBusinessLog().WithOperator(logic.ctx.Value(common.OperatorKey)).
		WithOperation(logger.Create).WithObject(&logger.Object{Type: logger.DictType}).WithTargetObject(req).GenerateDescription()
	logx.Info(logModel)
	return nil
}

func (logic *DictLogic) UpdateDict(req *types.ReqUpdateDict) error {

	repo := impl.NewDictRepo(logic.svcCtx)
	//判断字典是否存在
	id, err := utils.StrToInt(req.Id)
	if err != nil {
		return err
	}
	dictIds, err := repo.GetDictIds([]int{id})
	if err != nil {
		return err
	}
	if len(dictIds) <= 0 {
		return errors.DictionaryNotFoundError
	}
	//修改字典
	if err := repo.UpdateDict(req); err != nil {
		return err
	}

	//清除缓存
	logic.DelDictCacheByIds([]int{id}, []int{})

	//记录日志
	logModel := logger.NewBusinessLog().WithOperator(logic.ctx.Value(common.OperatorKey)).
		WithOperation(logger.Update).WithObject(&logger.Object{Type: logger.DictType}).WithTargetObject(req).GenerateDescription()
	logx.Info(logModel)
	return nil
}

func (logic *DictLogic) DelDictCacheByIds(dictIds []int, dictItemIds []int) {
	keys := make([]string, 0)

	//字典cache
	for _, id := range dictIds {
		keys = append(keys, fmt.Sprintf(common.KWEAVER_DICT_INFO, id))
	}
	//字典值cache
	for _, id := range dictItemIds {
		keys = append(keys, fmt.Sprintf(common.KWEAVER_DICT_ITEM_INFO, id))
	}

	if err := logic.svcCtx.RedisDB.Write.Del(context.Background(), keys...).Err(); err != nil {
		logx.Error(fmt.Sprintf("Clear data cache failed: '%s'", err.Error()))
	}
}

func (logic *DictLogic) DeleteDict(req *types.ReqDeleteDict) error {

	repo := impl.NewDictRepo(logic.svcCtx)
	//获取数据库中存在的字典
	reqIds := make([]int, 0)
	for _, id := range req.Ids {
		intId, err := utils.StrToInt(id)
		if err != nil {
			return err
		}
		reqIds = append(reqIds, intId)
	}
	dictIds, err := repo.GetDictIds(reqIds)
	if err != nil {
		return err
	}

	//不存在的字典id
	errorDictIds := GetArrDiff(reqIds, dictIds)

	//根据字典id获取字典值id
	dictItemIds, err := repo.GetDictItemIdList(dictIds)
	if err != nil {
		return err
	}
	//删除字典
	err = repo.DeleteDict(req)
	if err != nil {
		return err
	}
	//清除缓存
	logic.DelDictCacheByIds(reqIds, dictItemIds)
	//记录日志
	logModel := logger.NewBusinessLog().WithOperator(logic.ctx.Value(common.OperatorKey)).
		WithOperation(logger.Delete).WithObject(&logger.Object{Type: logger.DictType}).WithTargetObject(req).GenerateDescription()
	logx.Info(logModel)

	if len(errorDictIds) > 0 {
		errString, err := json.Marshal(errorDictIds)
		if err != nil {
			return errors.InternalServerError.SetDetailError(err)
		}
		return errors.DictionaryNotFoundError.SetDetailError("Dictionary not found", string(errString))
	}
	return nil
}

func GetArrDiff(arr []int, dbArr []int) []int {
	var res []int
	for _, i := range arr {
		isExist := false
		for _, j := range dbArr {
			if i == j {
				isExist = true
				break
			}
		}
		if !isExist {
			res = append(res, i)
		}
	}
	return res
}

func (logic *DictLogic) GetDictItemList(req *types.ReqGetDictItemList) (resp interface{}, err error) {

	repo := impl.NewDictRepo(logic.svcCtx)

	//判断字典是否存在
	dictId := 0
	if req.FieldType == 1 { //字典id
		fieldValue, err := utils.StrToInt(req.FieldValue)
		if err != nil {
			return nil, errors.ParameterError.SetDetailError(err)
		}
		dictIds, err := repo.GetDictIds([]int{fieldValue})
		if err != nil {
			return nil, err
		}
		if len(dictIds) == 1 {
			dictId = dictIds[0]
		}
	} else if req.FieldType == 2 { //字典类型
		if dictId, err = repo.GetDictId(req.FieldValue); err != nil {
			return nil, err
		}
	}
	if dictId <= 0 {
		return nil, errors.DictionaryNotFoundError
	}

	//获取字典值列表
	req.FieldType = 1
	req.FieldValue = fmt.Sprintf("%d", dictId)
	res, err := repo.GetDictItemList(req)
	if err != nil {
		return nil, err
	}

	dictItems := make([]*types.RespDictItem, 0)
	models := res.Data.([]*po.TDictItem)
	for _, model := range models {
		dictVo := &types.RespDictItem{ID: utils.ToString(model.ID), CName: model.CName, EName: model.EName, Remark: model.Remark, DictId: utils.ToString(model.DictId), ItemValue: model.ItemValue,
			CreateBy: model.CreateBy, UpdateBy: model.UpdateBy, CreateTime: response.JsonTime(model.CreateTime), UpdateTime: response.JsonTime(model.UpdateTime)}
		dictItems = append(dictItems, dictVo)
	}
	res.Data = dictItems
	return res, nil
}

func (logic *DictLogic) GetDictItem(req *types.IdFormVO) (resp interface{}, err error) {
	id, err := utils.StrToInt(req.Id)
	if err != nil {
		return nil, err
	}
	key := fmt.Sprintf(common.KWEAVER_DICT_ITEM_INFO, id)
	model := &po.TDictItem{}
	_, result := redis.Get(context.Background(), key)
	if len(result) > 0 {
		if err := json.Unmarshal([]byte(result), &model); err != nil {
			return nil, errors.InternalServerError.SetDetailError(err)
		}
	} else {
		repo := impl.NewDictRepo(logic.svcCtx)
		if model, err = repo.GetDictItem(id); err != nil {
			return nil, err
		}
		if model.ID <= 0 {
			return nil, errors.DictionaryItemNotFoundError
		}
		//将结果缓存到redis
		jsonData, err := json.Marshal(model)
		if err != nil {
			return nil, errors.InternalServerError.SetDetailError(err)
		}
		if err := logic.svcCtx.RedisDB.Write.Set(context.Background(), key, jsonData, time.Duration(utils.RangeRandomNum(5, 10))*time.Second).Err(); err != nil {
			logx.Error(fmt.Sprintf("cache data failed: '%s'", err.Error()))
		}
	}

	res := &types.RespDictItem{ID: utils.ToString(model.ID), CName: model.CName, EName: model.EName, Remark: model.Remark, DictId: utils.ToString(model.DictId), ItemValue: model.ItemValue,
		CreateBy: model.CreateBy, UpdateBy: model.UpdateBy, CreateTime: response.JsonTime(model.CreateTime), UpdateTime: response.JsonTime(model.UpdateTime)}
	return res, nil
}

func (logic *DictLogic) AddDictItem(req *types.ReqAddDictItem) error {

	repo := impl.NewDictRepo(logic.svcCtx)

	//判断字典是否存在
	dictId, err := utils.StrToInt(req.DictId)
	if err != nil {
		return err
	}
	dictIds, err := repo.GetDictIds([]int{dictId})
	if err != nil {
		return err
	}
	if len(dictIds) <= 0 {
		return errors.DictionaryNotFoundError
	}

	//判断字典值是否存在
	count, err := repo.GetDictItemCount(dictId, req.ItemValue)
	if err != nil {
		return err
	}
	if count > 0 {
		return errors.DictionaryItemExistError
	}
	//添加字典值
	if err := repo.AddDictItem(req); err != nil {
		return err
	}
	//记录日志
	logModel := logger.NewBusinessLog().WithOperator(logic.ctx.Value(common.OperatorKey)).
		WithOperation(logger.Create).WithObject(&logger.Object{Type: logger.DictItem}).WithTargetObject(req).GenerateDescription()
	logx.Info(logModel)
	return nil
}

func (logic *DictLogic) UpdateDictItem(req *types.ReqUpdateDictItem) error {

	repo := impl.NewDictRepo(logic.svcCtx)

	//判断字典值是否存在
	id, err := utils.StrToInt(req.Id)
	if err != nil {
		return err
	}
	dictItemIds, err := repo.GetDictItemIds([]int{id})
	if err != nil {
		return err
	}
	if len(dictItemIds) <= 0 {
		return errors.DictionaryItemNotFoundError
	}

	//修改字典值
	if err := repo.UpdateDictItem(req); err != nil {
		return err
	}
	//清除缓存
	logic.DelDictItemCacheByIds([]int{id})
	//记录日志
	logModel := logger.NewBusinessLog().WithOperator(logic.ctx.Value(common.OperatorKey)).
		WithOperation(logger.Update).WithObject(&logger.Object{Type: logger.DictItem}).WithTargetObject(req).GenerateDescription()
	logx.Info(logModel)
	return nil
}

func (logic *DictLogic) DelDictItemCacheByIds(ids []int) {
	keys := make([]string, 0)
	for _, id := range ids {
		keys = append(keys, fmt.Sprintf(common.KWEAVER_DICT_ITEM_INFO, id))
	}

	if err := logic.svcCtx.RedisDB.Write.Del(context.Background(), keys...).Err(); err != nil {
		logx.Error(fmt.Sprintf("Clear data cache failed: '%s'", err.Error()))
	}
}

func (logic *DictLogic) DeleteDictItem(req *types.ReqDeleteDict) error {

	repo := impl.NewDictRepo(logic.svcCtx)

	//数据库中存在的字典值
	reqIds := make([]int, 0)
	for _, id := range req.Ids {
		intId, err := utils.StrToInt(id)
		if err != nil {
			return err
		}
		reqIds = append(reqIds, intId)
	}
	dictItemIds, err := repo.GetDictItemIds(reqIds)
	if err != nil {
		return err
	}

	//不存在的字典值
	errorDictItemIds := GetArrDiff(reqIds, dictItemIds)

	//删除字典值
	if err := repo.DeleteDictItem(req); err != nil {
		return err
	}
	//清除缓存
	logic.DelDictItemCacheByIds(reqIds)
	//记录日志
	logModel := logger.NewBusinessLog().WithOperator(logic.ctx.Value(common.OperatorKey)).
		WithOperation(logger.Delete).WithObject(&logger.Object{Type: logger.DictItem}).WithTargetObject(req).GenerateDescription()
	logx.Info(logModel)

	if len(errorDictItemIds) > 0 {
		errString, err := json.Marshal(errorDictItemIds)
		if err != nil {
			return errors.InternalServerError.SetDetailError(err.Error())
		}
		return errors.DictionaryItemNotFoundError.SetDetailError("Dictionary item not found", string(errString))
	}

	return nil
}

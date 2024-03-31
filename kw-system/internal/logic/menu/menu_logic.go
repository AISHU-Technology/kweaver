package Menu

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
	"strings"
	"time"
)

type MenuLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewMenuLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MenuLogic {
	return &MenuLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (logic *MenuLogic) GetMenuList(parentMenuList []*po.TMenu, req *types.ReqGetMenuList) (map[int64][]*types.RespMenu, error) {
	repo := impl.NewMenuRepo(logic.svcCtx)

	//根据父级菜单获取下级菜单
	pids := make([]int64, len(parentMenuList))
	if len(parentMenuList) > 0 {
		for i, model := range parentMenuList {
			pids[i] = model.Id
		}
	}
	menuList, err := repo.GetMenuList(pids)
	if err != nil {
		return nil, err
	}

	//循环获取下级菜单
	childrenMenuMap := make(map[int64][]*types.RespMenu, 0)
	if len(menuList) > 0 {
		if childrenMenuMap, err = logic.GetMenuList(menuList, req); err != nil {
			return nil, err
		}
	}

	res := make(map[int64][]*types.RespMenu, 0)
	children := make([]*types.RespMenu, 0)
	for _, model := range menuList {
		cItem := &types.RespMenu{Id: utils.ToString(model.Id), CName: model.CName, EName: model.EName, Code: model.Code, Icon: model.Icon, SelectedIcon: model.SelectedIcon,
			Path: model.Path, Component: model.Component, MenuType: model.MenuType, Pid: utils.ToString(model.Pid), SortOrder: model.SortOrder, Visible: model.Visible,
			CreateTime: response.JsonTime(model.CreateTime), UpdateTime: response.JsonTime(model.UpdateTime), DelFlag: int(model.DelFlag), Children: children}
		if len(childrenMenuMap[model.Id]) == 0 {
			if req.MenuType < 3 && model.MenuType != req.MenuType {
				continue
			}
			if !(strings.Contains(model.CName, req.Key) || strings.Contains(model.EName, req.Key) || strings.Contains(model.Code, req.Key)) {
				continue
			}
			res[model.Pid] = append(res[model.Pid], cItem)
		} else {
			if req.IsTree == 1 {
				for _, cModel := range childrenMenuMap[model.Id] {
					cItem.Children = append(cItem.Children, cModel)
				}
				res[model.Pid] = append(res[model.Pid], cItem)
			} else {
				res[model.Pid] = append(res[model.Pid], cItem)
				for _, cModel := range childrenMenuMap[model.Id] {
					res[model.Pid] = append(res[model.Pid], cModel)
				}
			}
		}
	}
	return res, nil
}

func (logic *MenuLogic) GetMenu(req *types.IdFormVO) (resp interface{}, err error) {
	id, err := utils.ToInt64(req.Id)
	if err != nil {
		return nil, err
	}
	key := fmt.Sprintf(common.KWEAVER_MENU_INFO, id)
	model := &po.TMenu{}
	_, result := redis.Get(context.Background(), key)
	//存在缓存
	if len(result) > 0 {
		if err := json.Unmarshal([]byte(result), &model); err != nil {
			return nil, errors.InternalServerError.SetDetailError(err)
		}
	} else {
		repo := impl.NewMenuRepo(logic.svcCtx)

		if model, err = repo.GetMenu(id); err != nil {
			return nil, err
		}

		if model.Id <= 0 {
			return nil, errors.MenuNotFoundError
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
	res := &types.RespMenu{Id: utils.ToString(model.Id), CName: model.CName, EName: model.EName, Code: model.Code, Icon: model.Icon, SelectedIcon: model.SelectedIcon,
		Path: model.Path, Component: model.Component, MenuType: model.MenuType, Pid: utils.ToString(model.Pid), SortOrder: model.SortOrder, Visible: model.Visible,
		CreateTime: response.JsonTime(model.CreateTime), UpdateTime: response.JsonTime(model.UpdateTime), DelFlag: int(model.DelFlag), Children: []*types.RespMenu{}}
	return res, nil
}

func (logic *MenuLogic) AddMenu(req *types.ReqAddMenu) error {

	repo := impl.NewMenuRepo(logic.svcCtx)

	//判断菜单是否已存在
	if menuId, err := repo.GetMenuId(req.Code); err != nil {
		return err
	} else if menuId > 0 {
		return errors.MenuExistError
	}

	//添加菜单
	if req.MenuType == 2 {
		req.Path = ""
		req.Component = ""
	}
	if err := repo.AddMenu(req); err != nil {
		return err
	}

	//记录日志
	logModel := logger.NewBusinessLog().WithOperator(logic.ctx.Value(common.OperatorKey)).
		WithOperation(logger.Create).WithObject(&logger.Object{Type: logger.Menu}).WithTargetObject(req).GenerateDescription()
	logx.Info(logModel)
	return nil
}

func (logic *MenuLogic) UpdateMenu(req *types.ReqUpdateMenu) error {

	repo := impl.NewMenuRepo(logic.svcCtx)
	//判断菜单是否存在
	id, err := utils.ToInt64(req.Id)
	if err != nil {
		return err
	}
	if menu, err := repo.GetMenu(id); err != nil {
		return err
	} else if menu.Code == "" {
		return errors.MenuNotFoundError
	}

	//修改菜单
	if req.MenuType == 2 {
		req.Path = ""
		req.Component = ""
	}
	if err := repo.UpdateMenu(req); err != nil {
		return err
	}

	//清除缓存
	if id, err := utils.ToInt64(req.Id); err != nil {
		return err
	} else {
		logic.DelMenuCacheByIds([]int64{id})
	}

	//记录日志
	logModel := logger.NewBusinessLog().WithOperator(logic.ctx.Value(common.OperatorKey)).
		WithOperation(logger.Update).WithObject(&logger.Object{Type: logger.Menu}).WithTargetObject(req).GenerateDescription()
	logx.Info(logModel)
	return nil
}

func (logic *MenuLogic) DelMenuCacheByIds(menuIds []int64) {
	keys := make([]string, 0)

	//菜单cache
	for _, id := range menuIds {
		keys = append(keys, fmt.Sprintf(common.KWEAVER_MENU_INFO, id))
	}

	if err := logic.svcCtx.RedisDB.Write.Del(context.Background(), keys...).Err(); err != nil {
		logx.Error(fmt.Sprintf("Clear data cache failed: '%s'", err.Error()))
	}
}

func (logic *MenuLogic) DeleteMenu(req *types.ReqDeleteMenu) error {

	repo := impl.NewMenuRepo(logic.svcCtx)
	//获取数据库中存在的菜单
	reqIds := make([]int64, 0)
	for _, id := range req.Ids {
		intId, err := utils.ToInt64(id)
		if err != nil {
			return err
		}
		reqIds = append(reqIds, intId)
	}
	menuIds, err := repo.GetMenuIds(reqIds)
	if err != nil {
		return err
	}

	//不存在的菜单id
	errorMenuIds := GetArrDiff(reqIds, menuIds)

	//删除菜单
	if err = repo.DeleteMenu(req); err != nil {
		return err
	}
	//清除缓存
	logic.DelMenuCacheByIds(reqIds)
	//记录日志
	logModel := logger.NewBusinessLog().WithOperator(logic.ctx.Value(common.OperatorKey)).
		WithOperation(logger.Delete).WithObject(&logger.Object{Type: logger.Menu}).WithTargetObject(req).GenerateDescription()
	logx.Info(logModel)

	if len(errorMenuIds) > 0 {
		errString, err := json.Marshal(errorMenuIds)
		if err != nil {
			return errors.InternalServerError.SetDetailError(err)
		}
		return errors.MenuNotFoundError.SetDetailError("Menu not found", string(errString))
	}
	return nil
}

func GetArrDiff(arr []int64, dbArr []int64) []int64 {
	var res []int64
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

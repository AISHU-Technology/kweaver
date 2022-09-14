// @File : adv_search_config.go
// @Time : 2021/3/13

package controllers

import (
	"errors"
	"fmt"
	"graph-engine/models"
	"graph-engine/models/dao"
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"net/http"
	"strconv"
)

// -------------------------
// 查询搜索配置
// -------------------------
type GetSearchConfRes struct {
	Res   []AdvConfKG `json:"res"`
	Count int         `json:"count"`
}

type AdvConfKG struct {
	KGName string `json:"kg_name"`
	KGID   int    `json:"kg_id"`
	//KGDesc  string    `json:"kg_desc"`
	//ASModel bool      `json:"as_model"`
	AdvConf    []AdvConf `json:"adv_conf"`
	PropertyID int       `json:"property_id"`
}

type AdvConf struct {
	ConfID   int    `json:"conf_id"`
	ConfName string `json:"conf_name"`
	//Type        string `json:"type"`
	//KGName      string `json:"kg_name"`
	//KGID        int    `json:"kg_id"`
	//ConfDesc    string `json:"conf_desc"`
}

// 获取配置列表
func GetAdvSearchConf(kNetID int, filter, query, sort string, page, size int) (httpcode int, res interface{}) {
	var SearchConf GetSearchConfRes
	SearchConf.Res = make([]AdvConfKG, 0)

	kgids, err := dao.GetKGIDByKNetID(kNetID)
	if err != nil {
		return 500, err
	}

	advConfs, err := dao.GetAdvSearchConf(filter, query, sort)
	if err != nil {
		return 500, err
	}

	if advConfs == nil {
		return http.StatusOK, SearchConf
	}

	// 双层排序，外层知识网络从新至旧降序，里层高级配置从新至旧降序
	advConfMap := make(map[string][]AdvConf)
	keys := make([]map[int]map[string]string, 0, len(advConfMap)) // golang range map 是无序的遍历，利用slice达到有序
	for _, advConf := range advConfs {
		if _, ok := advConfMap[advConf.KGName]; !ok {
			advConfMap[advConf.KGName] = append(advConfMap[advConf.KGName], AdvConf{
				ConfID:   advConf.ID,
				ConfName: advConf.ConfName,
				//Type:        advConf.Type,
				//KGName:      advConf.KGName,
				//KGID:        advConf.KGID,
				//ConfDesc:    advConf.ConfDesc,
			})

			keys = append(keys, map[int]map[string]string{
				advConf.KGID: {
					"kg_name": advConf.KGName,
					"kg_desc": advConf.KGDesc,
				},
			})
		} else {
			advConfMap[advConf.KGName] = append(advConfMap[advConf.KGName], AdvConf{
				ConfID:   advConf.ID,
				ConfName: advConf.ConfName,
				//Type:        advConf.Type,
				//KGName:      advConf.KGName,
				//KGID:        advConf.KGID,
				//ConfDesc:    advConf.ConfDesc,
				//UpdateTime:  advConf.UpdateTime,
				//CreateTime:  advConf.CreateTime,
			})
		}
	}

	var advConfsKG []AdvConfKG

	for _, key := range keys {
		for k, v := range key {
			for _, kgid := range kgids {
				if k == int(kgid) {
					//for _, conf := range advConfMap[v["kg_name"]] {
					//	advConfsKG = append(advConfsKG, conf)
					//
					//}
					advConfKG := AdvConfKG{
						KGName:  v["kg_name"],
						KGID:    k,
						AdvConf: advConfMap[v["kg_name"]],
					}

					// propertyID
					//kgconfid, err := dao.GetKGConfIDByKGID(k)
					//if err != nil {
					//	return 500, err
					//}
					//for _, v := range authKGResp["res"].([]interface{}) {
					//	vMap := v.(map[string]interface{})
					//	if int(vMap["configId"].(float64)) == kgconfid {
					//		advConfKG.PropertyID = int(vMap["propertyId"].(float64))
					//	}
					//}
					advConfsKG = append(advConfsKG, advConfKG)
				}
			}
		}
	}

	// 分页显示
	for i, conf := range advConfsKG {
		if page > 0 && (i < (page-1)*size || i > page*(size)-1) {
			continue
		}

		SearchConf.Res = append(SearchConf.Res, conf)
	}
	SearchConf.Count = len(advConfsKG)

	return http.StatusOK, SearchConf
}

// -------------------------
// 删除搜索配置
// -------------------------
type DelSearchConfRes struct {
	Res string `json:"res"`
}

func DelAdvSearchConf(confIDs []int) (httpcode int, res interface{}) {
	var delSearchConfRes DelSearchConfRes

	engine := utils.GetConnect()

	var confidStr []string
	for _, confid := range confIDs {
		confidStr = append(confidStr, strconv.Itoa(confid))
	}
	// 获取配置对应图谱
	confidKgids, err := dao.GetKGIDByConfIDS(confidStr)
	if err != nil {
		return 500, err
	}

	if len(confidKgids) == 0 {
		delSearchConfRes.Res = "delete success"
		return http.StatusOK, delSearchConfRes
	}

	// 删除有权限的，保留无权限的
	err = dao.DelAdvSearchConf(engine, confIDs)
	if err != nil {
		return 500, err
	}

	delSearchConfRes.Res = "delete success"
	return http.StatusOK, delSearchConfRes
}

// -------------------------
// 新增搜索配置
// -------------------------
type AddSearchConfRes struct {
	Res int `json:"res"`
}

func AddAdvSearchConf(confName, _type, confDesc string, kgid int, confContent dao.ConfContent) (httpcode int, res interface{}) {
	// 检查kgid是否存在
	_bool, err := dao.Checkkgid(kgid)
	if !_bool {
		return 500, err
	}

	var addSearchConfRes AddSearchConfRes

	// 检查配置名称是否存在
	_bool, err = dao.CheckConfName(confName, 0)
	if !_bool {
		return 500, err
	}

	// confContent校验
	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if strconv.Itoa(kgid) == k.ID {
			conf = k
			break
		}
	}
	schema, err := models.GetKGSchema(&conf)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	err = checkConfContent(schema, confContent)
	if err != nil {
		return 500, err
	}

	confID, err := dao.AddAdvSearchConf(confName, _type, confDesc, kgid, confContent)
	if err != nil {
		return 500, err
	}

	addSearchConfRes.Res = confID

	return http.StatusOK, addSearchConfRes
}

// -------------------------
// 更新搜索配置
// -------------------------
type UpdateSearchConfRes struct {
	Res string `json:"res"`
}

func UpdateAdvSearchConf(confID int, confName, confDesc string, confContent dao.ConfContent) (httpcode int, res interface{}) {
	var addSearchConfRes UpdateSearchConfRes

	engine := utils.GetConnect()

	// 检查confID
	_bool, err := dao.CheckConfID(engine, confID)
	if err != nil {
		return 500, err
	}
	if !_bool {
		return 500, utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New(fmt.Sprintf("conf_id %d not exist", confID)))
	}
	// 获取kgID
	kgid, err := dao.GetKGIDByConfID(engine, confID)
	if err != nil {
		return 500, err
	}

	// 获取schema信息
	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if strconv.Itoa(kgid) == k.ID {
			conf = k
			break
		}
	}

	schema, err := models.GetKGSchema(&conf)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	// confContent校验
	err = checkConfContent(schema, confContent)
	if err != nil {
		return 500, err
	}

	err = dao.UpdateAdvSearchConf(confID, confName, confDesc, confContent)
	if err != nil {
		return 500, err
	}

	addSearchConfRes.Res = "update success"

	return http.StatusOK, addSearchConfRes
}

// -------------------------
// 查询单一搜索配置
// -------------------------
type InfoSearchConfRes struct {
	Res dao.InfoSearchConf `json:"res"`
}

func GetInfoAdvSearchConf(confID int) (httpcode int, res interface{}) {
	engine := utils.GetConnect()

	// 检查confID
	_bool, err := dao.CheckConfID(engine, confID)
	if err != nil {
		return 500, err
	}
	if !_bool {
		return 500, utils.ErrInfo(utils.ErrAdvSearchConfIDErr, errors.New(fmt.Sprintf("conf_id %d not exist", confID)))
	}

	var infoSearchConfRes InfoSearchConfRes

	err, info := dao.GetInfoAdvSearchConf(confID)
	if err != nil {
		return 500, err
	}

	infoSearchConfRes.Res = *info

	return http.StatusOK, infoSearchConfRes
}

// -------------------------
// 获取图谱相应配置
// -------------------------
type GetConfByKGNameRes struct {
	Res []GetConfByKGName `json:"res"`
}

type GetConfByKGName struct {
	KGID        int                  `json:"kg_id"`
	KGName      string               `json:"kg_name"`
	KGDesc      string               `json:"kg_desc"`
	ASModel     bool                 `json:"as_model"`
	AdvConfList []dao.ConfListByKgid `json:"adv_conf"`
}

func GetConfByKGID(kgid int) (httpcode int, res interface{}) {

	var confListRes GetConfByKGNameRes
	confListRes.Res = make([]GetConfByKGName, 0)

	var confByKGName GetConfByKGName
	confByKGName.AdvConfList = make([]dao.ConfListByKgid, 0)

	// 获取图谱基本信息
	kginfo, err := dao.GetKGInfo(kgid)
	if err != nil {
		return 500, err
	}
	if kginfo != nil {
		confByKGName = GetConfByKGName{
			KGID:        kginfo.KGID,
			KGName:      kginfo.KGName,
			KGDesc:      kginfo.KGDesc,
			ASModel:     false,
			AdvConfList: nil,
		}

		// 判断配置对应的图谱本体中是否有as模型
		model, err := dao.GetClassModelType(kgid)
		if err != nil {
			return 500, err
		}
		if model != nil {
			for _, d := range model.Entity {
				if d["model"] != "Anysharedocumentmodel" {
					continue
				} else {
					// as模型必须包含document
					if d["name"] == "document" {
						confByKGName.ASModel = true
						break
					}
				}
			}
		}
	}

	// 获取图谱配置
	conflist, err := dao.GetConfByKGID(kgid)
	if err != nil {
		return 500, err
	}
	if conflist != nil {
		confByKGName.AdvConfList = conflist
	}

	confListRes.Res = append(confListRes.Res, confByKGName)

	return http.StatusOK, confListRes
}

// -------------------------
// 可添加配置的图谱列表
// -------------------------
type AdvConfKGListRes struct {
	Res []AdvConfKGList `json:"res"`
}

type AdvConfKGList struct {
	ID           int    `json:"kg_id"`
	Name         string `json:"kg_name"`
	UpdateTime   string `json:"update_time"`
	Status       string `json:"status"`
	TaskStatus   string `json:"task_status"`
	ConfigStatus string `json:"config_status"`
}

func AdvSearchConfKGList(kNetId int, kgName string) (httpcode int, res interface{}) {
	var hasKGListRes AdvConfKGListRes
	hasKGListRes.Res = make([]AdvConfKGList, 0)

	kgids, err := dao.GetKGIDByKNetIDAndKGName(kNetId, kgName)
	if err != nil {
		return 500, err
	}

	kglist, err := models.AdvConfKGList()
	if err != nil {
		return 500, err
	}

	if kglist != nil {
		for _, kg := range kglist {
			kglistRes := AdvConfKGList{
				Name:         kg.Name,
				UpdateTime:   kg.UpdateTime,
				Status:       kg.Status,
				TaskStatus:   kg.TaskStatus,
				ConfigStatus: kg.ConfigStatus,
			}
			kglistRes.ID, _ = strconv.Atoi(kg.ID)

			for _, kgid := range kgids {
				if kglistRes.ID == int(kgid) {
					hasKGListRes.Res = append(hasKGListRes.Res, kglistRes)
				}
			}
		}
	}

	return http.StatusOK, hasKGListRes
}

func checkConfContent(sc models.SchemaInterface, confContent dao.ConfContent) (err error) {
	// 校验配置的类别和属性是否存在
	var (
		vClassArray []string
		vProArray   []string
		eClassArray []string
	)

	switch sc.(type) {
	case *orient.Schema:
		schema := sc.(*orient.Schema)

		for _, v := range schema.V {
			vClassArray = append(vClassArray, v.Name)
			for _, vpro := range v.Properties {
				vProArray = append(vProArray, vpro.Name)
			}
		}
		for _, e := range schema.E {
			eClassArray = append(eClassArray, e.Name)
		}
	case *nebula.Schema:
		schema := sc.(*nebula.Schema)

		for _, v := range schema.V {
			vClassArray = append(vClassArray, v.Name)
			for _, vpro := range v.Properties {
				vProArray = append(vProArray, vpro.Name)
			}
		}
		for _, e := range schema.E {
			eClassArray = append(eClassArray, e.Name)
		}
	}

	for _, v := range confContent.SearchRange.Vertexes.Open {
		_bool := utils.In(v, vClassArray)
		if !_bool {
			return utils.ErrInfo(utils.ErrAdvConfContentErr, errors.New(fmt.Sprintf("config content %s not exist", v)))
		}
	}
	for _, e := range confContent.SearchRange.Edges.Open {
		_bool := utils.In(e, eClassArray)
		if !_bool {
			return utils.ErrInfo(utils.ErrAdvConfContentErr, errors.New(fmt.Sprintf("config content %s not exist", e)))
		}
	}

	return nil
}

// @File : adv_conf_.go
// @Time : 2021/4/6

package models

import (
	"graph-engine/models/nebula"
	"graph-engine/utils"
	//"strconv"
	//"strings"
)

// 可配置的图谱列表
func AdvConfKGList() ([]utils.KGConf, error) {
	var r []utils.KGConf

	kglist, err := utils.GetKGConfByConfigID()
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	for _, kg := range kglist {
		// 过滤非首次配置图谱
		if kg.ConfigStatus != "edit" {
			// 过滤vcount,ecount为”-“和“0”的图谱，有数据即可配置
			var vc, ec uint64
			switch kg.Type {
			//case "orientdb":  # 暂时仅支持nebula
			//	vc, ec, _, _, _, err = orient.GetKnowledgeCount(&kg)
			case "nebula":
				vc, ec, err = nebula.GetKnowledgeVCountAndECount(&kg)
			}

			if err == nil && (int(vc) != 0 || int(ec) != 0) {
				r = append(r, kg)
			}
		}
	}

	return r, nil
}

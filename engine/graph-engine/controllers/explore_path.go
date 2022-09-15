package controllers

import (
	"fmt"
	"graph-engine/models"
	"graph-engine/utils"
	"net/http"
)

func ExplorePath(kgID int, startRid, endRid, direction string, shortest int) (httpcode int, res interface{}) {

	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if fmt.Sprintf("%d", kgID) == k.ID {
			conf = k
			break
		}
	}

	paths, err := models.ExplorePath(&conf, startRid, endRid, direction, shortest)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	return http.StatusOK, paths
}

func PathDetail(kgID int, pathsInfo []map[string][]string) (httpcode int, res interface{}) {
	kgConf, err := utils.GetKGConf()
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	var conf utils.KGConf
	for _, k := range kgConf {
		if fmt.Sprintf("%d", kgID) == k.ID {
			conf = k
			break
		}
	}
	if len(pathsInfo) <= 0 {
		return http.StatusOK, nil
	}
	paths, err := models.PathDetail(&conf, pathsInfo)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}
	return http.StatusOK, paths
}

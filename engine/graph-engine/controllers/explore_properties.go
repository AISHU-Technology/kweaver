package controllers

import (
	"graph-engine/models"
	"graph-engine/models/nebula"
	"graph-engine/models/orient"
	"graph-engine/utils"
	"net/http"
)

type GetPropertiesRes struct {
	Res []Properties `json:"res"`
}

type Properties struct {
	PName string `json:"p_name"`
	PType string `json:"p_type"`
}

func GetProperties(id, class string) (httpcode int, res interface{}) {
	var recRes GetPropertiesRes
	recRes.Res = make([]Properties, 0)

	conf, err := utils.GetKGConfByKGID(id)
	if err != nil {
		return 500, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	properties, err := models.GetProperties(&conf, class)
	if err != nil {
		return 500, err
	}

	switch properties.(type) {
	case []orient.Property:
		for _, p := range properties.([]orient.Property) {
			recRes.Res = append(recRes.Res, Properties{
				PName: p.Name,
				PType: p.Type,
			})
		}
	case []nebula.Property:
		for _, p := range properties.([]nebula.Property) {
			recRes.Res = append(recRes.Res, Properties{
				PName: p.Name,
				PType: p.Type,
			})
		}
	}

	return http.StatusOK, recRes
}

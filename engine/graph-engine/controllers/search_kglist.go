package controllers

import (
	"graph-engine/models/dao"
	"net/http"
	"strconv"
)

type SKGList struct {
	KGID   string `json:"kg_id"`
	KGName string `json:"kg_name"`
}

type SKGListRes struct {
	Res []SKGList `json:"res"`
}

func SearchKGList() (httpcode int, res interface{}) {
	var searchKGs SKGListRes
	searchKGs.Res = make([]SKGList, 0)

	r, err := dao.SearchKGList()
	if err != nil {
		return 500, err
	}

	for _, kg := range r {
		skg := SKGList{
			KGID:   strconv.Itoa(kg.KGID),
			KGName: kg.KGName,
		}

		searchKGs.Res = append(searchKGs.Res, skg)
	}
	return http.StatusOK, searchKGs

}

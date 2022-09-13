package dao

import (
	"fmt"
	"graph-engine/logger"
	"graph-engine/utils"
)

type DsAuthInfo struct {
	DsAuth       int
	RedirectUrl  string
	ClientId     string
	ClientSecret string
	RefreshToken string
	AccessToken  string
	DsAddress    string
	DsPort       string
	DsCode       string
	UpdateTime   string
}

// 获取数据源信息
func GetDsAuthInfo(dsAuth int) (dsAuthInfo DsAuthInfo, err error) {
	var authInfoRes DsAuthInfo
	eninge := utils.GetConnect()

	sql := "select author_token.ds_auth, redirect_uri, client_id, client_secret, refresh_token, access_token, " +
		"author_token.ds_address, author_token.ds_port, ds_code, author_token.update_time " +
		"from (`data_source_table` inner join `author_token` on data_source_table.ds_auth = author_token.ds_auth) " +
		"where id in (%d)"
	sql = fmt.Sprintf(sql, dsAuth)

	logger.Info(sql)

	authInfo, err := eninge.Query(sql)
	if err != nil {
		return authInfoRes, err
	}

	defer authInfo.Close()

	for authInfo.Next() {
		err := authInfo.Scan(&authInfoRes.DsAuth, &authInfoRes.RedirectUrl, &authInfoRes.ClientId, &authInfoRes.ClientSecret,
			&authInfoRes.RefreshToken, &authInfoRes.AccessToken, &authInfoRes.DsAddress, &authInfoRes.DsPort,
			&authInfoRes.DsCode, &authInfoRes.UpdateTime)
		if err != nil {
			return authInfoRes, err
		}
	}
	return authInfoRes, nil
}

package dao

import (
	sql2 "database/sql"
	"fmt"
	"graph-engine/utils"
)

type OpenSearchConfig struct {
	ID   int64
	IP   string
	Port string
	User string
	PWD  string
}

func GetOSConfig(fulltextID string) (*OpenSearchConfig, error) {
	var osConf OpenSearchConfig

	engine := utils.GetConnect()

	sql := "select id, ip, port, `user`, password from fulltext_engine where id = %s"
	sql = fmt.Sprintf(sql, fulltextID)
	conf, err := engine.Query(sql)
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrInternalErr, err)
	}

	defer conf.Close()

	for conf.Next() {
		var (
			id   sql2.NullInt64
			ip   sql2.NullString
			port sql2.NullString
			user sql2.NullString
			pwd  sql2.NullString
		)
		err := conf.Scan(&id, &ip, &port, &user, &pwd)
		if err != nil {
			return nil, utils.ErrInfo(utils.ErrInternalErr, err)
		}

		osConf = OpenSearchConfig{
			ID:   id.Int64,
			IP:   ip.String,
			Port: port.String,
			User: user.String,
			PWD:  pwd.String,
		}
	}
	return &osConf, nil
}

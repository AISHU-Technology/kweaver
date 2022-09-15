package orient

import (
	"encoding/json"
	"errors"
	"graph-engine/utils"
)

func GetProperties(conf *utils.KGConf, class string) ([]Property, error) {
	if conf.ID == "" {
		return nil, utils.ErrInfo(utils.ErrInternalErr, errors.New("KG does not exist"))
	}

	// Class OrientDB 数据类别
	var indexOp = Operator{
		User:   conf.User,
		PWD:    conf.Pwd,
		URL:    conf.URL + "/class/" + conf.DB + "/" + class,
		Method: "get",
	}

	response, err := indexOp.Result("")
	if err != nil {
		return nil, utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	// 读取结果
	classConf := new(ClassConf)
	err = json.Unmarshal(response, classConf)

	if err != nil {
		return nil, utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	return classConf.Properties, nil
}

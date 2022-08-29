package orient

import (
	"encoding/json"
	"graph-engine/utils"
)

type QueryRes struct {
	Res   interface{} `json:"result"`
	Error interface{} `json:"errors"`
}

func (r *QueryRes) ParseOrientResponse(operator Operator, sql string) error {
	response, err := GetGraphData(&operator, sql)

	if err != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, err)
	}

	err = json.Unmarshal(response, r)

	if err != nil {
		return utils.ErrInfo(utils.ErrInternalErr, err)
	}

	if r.Error != nil {
		return utils.ErrInfo(utils.ErrOrientDBErr, r.Error.(error))
		//return utils.ServError{
		//	Code:    utils.ErrOrientDBErr,
		//	Message: utils.ErrMsgMap[utils.ErrOrientDBErr],
		//	Cause:   "Query error",
		//	Detail: map[string]interface{}{
		//		"err": r.Error,
		//	},
		//}
	}

	return nil
}

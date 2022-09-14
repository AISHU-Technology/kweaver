package vo

type GraphConfigTableItemVo struct {
	Name    string `json:"name"`
	Created int64  `json:"created"`
}

type GraphSearchCondition struct {
	PageVo
	IdVo
}

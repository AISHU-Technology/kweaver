package vo

type IdVo struct {
	ID int `form:"id" json:"id" binding:"gt=0"`
}

type PageVo struct {
	Page int `form:"page" json:"page" binding:"required,gt=0"`
	Size int `form:"size" json:"size"`
}

type ListVo struct {
	Total int64       `json:"total"`
	Data  interface{} `json:"data"`
}

type SearchCondition struct {
	PageVo
	OrderField string `form:"orderField" json:"orderField" binding:"oneof=updated created no"`
	Order      string `form:"order" json:"order" binding:"oneof=ASC DESC"` //ASC DESC
}

type TimeVo struct {
	Updated int64 `json:"updated"`
	Created int64 `json:"created"`
}

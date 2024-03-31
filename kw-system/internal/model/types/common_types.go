package types

type ResVo struct {
	Res interface{} `json:"res"`
}

type TotalVo struct {
	Data interface{} `json:"data"`
}

type ListVo struct {
	Total int64       `json:"total"`
	Data  interface{} `json:"data"`
}

type IdFormVO struct {
	Id string `form:"id"`
}

type IdJsonVO struct {
	Id string `json:"id"`
}

package types

import "github.com/AISHU-Technology/kw-go-core/response"

// TODO 此处返回请求参数和响应参数

type ReqGetHomeEventList struct {
	UserId  string `header:"userId"`
	ModType int    `path:"modType,range=(0:)"`
}

type RespGetHomeEventList struct {
	Title      string            `json:"title"`
	Remark     string            `json:"remark"`
	CreateTime response.JsonTime `json:"createTime"`
}

type ReqAddEvent struct {
	UserId  string `header:"userId"`
	ModType int    `json:"modType,range=(0:)"`
	Title   string `json:"title"`
	Path    string `json:"path"`
	Remark  string `json:"remark"`
	Method  string `json:"method,optional"`
}

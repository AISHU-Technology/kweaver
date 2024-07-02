package types

import (
	"github.com/AISHU-Technology/kw-go-core/response"
)

type ReqGetDictList struct {
	Key  string `form:"key,optional"`
	Page int    `form:"page,range=(0:)"`
	Size int    `form:"size,range=[-1:)"`
}

type RespDict struct {
	ID         string            `json:"id"`
	CName      string            `json:"cName"`
	EName      string            `json:"eName"`
	Remark     string            `json:"remark"`
	DictType   string            `json:"dictType"`
	CreateBy   string            `json:"createBy"`
	UpdateBy   string            `json:"updateBy"`
	CreateTime response.JsonTime `json:"createTime"`
	UpdateTime response.JsonTime `json:"updateTime"`
}

type ReqAddDict struct {
	UserId   string `header:"userId,optional"`
	CName    string `json:"cName"`
	EName    string `json:"eName"`
	Remark   string `json:"remark,optional"`
	DictType string `json:"dictType"`
}

type ReqUpdateDict struct {
	UserId string `header:"userId,optional"`
	Id     string `json:"id"`
	CName  string `json:"cName"`
	EName  string `json:"eName"`
	Remark string `json:"remark,optional"`
}

type ReqDeleteDict struct {
	UserId string   `header:"userId,optional"`
	Ids    []string `json:"ids"`
}

type ReqGetDictItemList struct {
	FieldType  int    `form:"fieldType,options=[1,2]"`
	FieldValue string `form:"fieldValue"`
	Key        string `form:"key,optional"`
	Page       int    `form:"page,range=(0:)"`
	Size       int    `form:"size,range=[-1:)"`
}

type RespDictItem struct {
	ID         string            `json:"id"`
	CName      string            `json:"cName"`
	EName      string            `json:"eName"`
	Remark     string            `json:"remark"`
	DictId     string            `json:"dictId"`
	ItemValue  string            `json:"itemValue"`
	CreateBy   string            `json:"createBy"`
	UpdateBy   string            `json:"updateBy"`
	CreateTime response.JsonTime `json:"createTime"`
	UpdateTime response.JsonTime `json:"updateTime"`
}

type ReqAddDictItem struct {
	UserId    string `header:"userId,optional"`
	CName     string `json:"cName"`
	EName     string `json:"eName"`
	Remark    string `json:"remark,optional"`
	DictId    string `json:"dictId"`
	ItemValue string `json:"itemValue"`
}

type ReqUpdateDictItem struct {
	UserId    string `header:"userId,optional"`
	Id        string `json:"id"`
	CName     string `json:"cName"`
	EName     string `json:"eName"`
	Remark    string `json:"remark,optional"`
	ItemValue string `json:"itemValue"`
}

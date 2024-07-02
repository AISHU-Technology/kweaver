package types

import (
	"github.com/AISHU-Technology/kw-go-core/response"
)

type ReqGetMenuList struct {
	Pid      string `form:"pid,optional,default=0"`
	IsTree   int    `form:"isTree,options=[1,2]"`
	MenuType int    `form:"menuType,options=[1,2,3]"`
	Key      string `form:"key,optional"`
	Page     int    `form:"page,range=(0:)"`
	Size     int    `form:"size,range=[-1:)"`
}

type RespMenu struct {
	Id           string            `json:"id"`
	CName        string            `json:"cName"`
	EName        string            `json:"eName"`
	Code         string            `json:"code"`
	Icon         string            `json:"icon"`
	SelectedIcon string            `json:"selectedIcon"`
	Path         string            `json:"path"`
	Component    string            `json:"component"`
	MenuType     int               `json:"menuType"`
	Pid          string            `json:"pid"`
	SortOrder    int               `json:"sortOrder"`
	Visible      int               `json:"visible"`
	CreateTime   response.JsonTime `json:"createTime"`
	UpdateTime   response.JsonTime `json:"updateTime"`
	DelFlag      int               `json:"delFlag"`
	Children     []*RespMenu       `json:"children"`
}

type ReqAddMenu struct {
	CName        string `json:"cName"`
	EName        string `json:"eName"`
	Code         string `json:"code"`
	Icon         string `json:"icon,optional"`
	SelectedIcon string `json:"selectedIcon,optional"`
	Path         string `json:"path,optional"`
	Component    string `json:"component,optional"`
	MenuType     int    `json:"menuType,options=[1,2]"`
	Pid          string `json:"pid,optional,default=0"`
	SortOrder    int    `json:"sortOrder,optional"`
	Visible      int    `json:"visible,optional,options=[0,1]"`
}

type ReqUpdateMenu struct {
	Id           string `json:"id"`
	CName        string `json:"cName"`
	EName        string `json:"eName"`
	Icon         string `json:"icon,optional"`
	SelectedIcon string `json:"selectedIcon,optional"`
	Path         string `json:"path,optional"`
	Component    string `json:"component,optional"`
	MenuType     int    `json:"menuType,options=[1,2]"`
	Pid          string `json:"pid,optional,default=0"`
	SortOrder    int    `json:"sortOrder,optional"`
	Visible      int    `json:"visible,optional,options=[0,1]"`
}

type ReqDeleteMenu struct {
	Ids []string `json:"ids"`
}

type ReqGetMenuTree struct {
	Pid string `form:"pid,optional,default=0"`
}

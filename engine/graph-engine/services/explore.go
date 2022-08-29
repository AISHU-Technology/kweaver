package services

import (
	"github.com/gin-gonic/gin"
	"graph-engine/controllers"
	"graph-engine/utils"
)

//type ReqSearchVArgs struct {
//	ID               string
//	Class            string                  `json:"class" binding:"required"`
//	Q                string                  `json:"query" binding:"omitempty"`
//	Page             int32                   `json:"page" binding:"required,gt=0"`
//	Size             int32                   `json:"size" binding:"required,gt=0"`
//	QueryAll         bool                    `json:"query_all"`
//	SearchFilterArgs *utils.SearchFilterArgs `json:"filter" binding:"required"`
//}
//
//// searchV
//func KGSearchVHandler(c *gin.Context) {
//	var body ReqSearchVArgs
//
//	body.ID, _ = c.Params.Get("id")
//
//	err := c.ShouldBindWith(&body, binding.JSON)
//	if err != nil {
//		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
//		return
//	}
//	//fmt.Println(body)
//
//	status, res := controllers.KGSearchV(body.ID, body.Class, body.Q, body.Page, body.Size, body.QueryAll, body.SearchFilterArgs)
//
//	c.JSON(status, gin.H{
//		"res": res,
//	})
//}

//type ReqSearchEArgs struct {
//	ID  string
//	Rid string `form:"rid" binding:"required"`
//}

// searchE
//func KGSearchEHandler(c *gin.Context) {
//	var body ReqSearchEArgs
//	err := c.ShouldBind(&body)
//	if err != nil {
//		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
//		return
//	}
//
//	body.ID, _ = c.Params.Get("id")
//
//	status, res := controllers.KGSearchE(body.ID, body.Rid)
//
//	c.JSON(status, gin.H{
//		"res": res,
//	})
//}
//
//type ReqExpandEArgs struct {
//	ID    string
//	Class string `form:"class" binding:"required"`
//	IO    string `form:"io" binding:"required"`
//	Rid   string `form:"rid" binding:"required"`
//	Page  int32  `form:"page" binding:"required,gt=0"`
//	Size  int32  `form:"size" binding:"required,gt=0"`
//}
//
//// expandE
//func KGExpandEHandler(c *gin.Context) {
//	var body ReqExpandEArgs
//
//	err := c.ShouldBind(&body)
//	if err != nil {
//		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
//		return
//	}
//
//	body.ID, _ = c.Params.Get("id")
//
//	status, res := controllers.KGExpandE(body.ID, body.Class, body.IO, body.Rid, body.Page, body.Size)
//
//	c.JSON(status, gin.H{
//		"res": res,
//	})
//}
//
type ReqExpandVArgs struct {
	ID    string `form:"id" binding:"required"`
	Class string `form:"class"`
	IO    string `form:"io" binding:"oneof=in out inout"`
	Rid   string `form:"rid" binding:"required"`
	Name  string `form:"name"`
	Page  int32  `form:"page" binding:"required,gt=0"`
	Size  int32  `form:"size" binding:"gte=-1"`
}

//expandV
func KGExpandVHandler(c *gin.Context) {
	var body = ReqExpandVArgs{}

	err := c.ShouldBind(&body)
	if err != nil {
		c.JSON(400, utils.ErrInfo(utils.ErrArgsErr, err))
		return
	}
	status, res := controllers.KGExpandV(body.ID, body.Class, body.IO, body.Rid, body.Name, body.Page, body.Size)
	c.JSON(status, gin.H{
		"res": res,
	})
}

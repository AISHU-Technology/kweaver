// Package utils 项目的通用的工具
// - 描述：orientdb server http访问辅助方法
// - 作者：张坤 (zhang.kun@aishu.cn)
// - 时间：2020-2-29
package utils

import (
	"fmt"
	"github.com/fatih/structs"
	"github.com/gin-gonic/gin"
	"graph-engine/leo"
)

// 错误服务名
const ErrServerName = "EngineServer."

// 错误值定义
const (
	ErrInternalErr = ErrServerName + "ErrInternalErr"
	ErrLoginFailed = ErrServerName + "ErrLoginFailed"

	ErrOrientDBErr = ErrServerName + "ErrOrientDBErr"
	ErrResourceErr = ErrServerName + "ErrResourceErr"

	ErrKGIDErr         = ErrServerName + "ErrKGIDErr" // 图谱id错误
	ErrTokenErr        = ErrServerName + "ErrTokenErr"
	ErrRightsErr       = ErrServerName + "ErrRightsErr" // 权限错误
	ErrArgsErr         = ErrServerName + "ErrArgsErr"
	ErrGraphStatusErr  = ErrServerName + "ErrGraphStatusErr"  // 图谱状态错误
	ErrASAddressErr    = ErrServerName + "ErrASAddressErr"    // as 错误
	ErrESContentErr    = ErrServerName + "ErrESContentErr"    // es内容错误
	ErrVClassErr       = ErrServerName + "ErrVClassErr"       // 没有vclass
	ErrConfigStatusErr = ErrServerName + "ErrConfigStatusErr" // 配置状态

	ErrAdvConfNameErr         = ErrServerName + "ErrAdvConfNameErr"         // 配置名称重复
	ErrAdvSearchConfIDErr     = ErrServerName + "ErrAdvSearchConfIDErr"     // 高级搜索配置id不存在
	ErrAdvSearchConfKGNameErr = ErrServerName + "ErrAdvSearchConfKGNameErr" // 图谱搜索配置超个数
	ErrAdvSearchErr           = ErrServerName + "ErrAdvSearchErr"           // 智能搜索错误
	ErrAdvConfContentErr      = ErrServerName + "ErrAdvConfContentErr"      // 高级搜索配置内容错误
	ErrAdvConfKGErr           = ErrServerName + "ErrAdvConfKGErr"           // 选取的图谱非kglist-as中

	ErrKGTaskErr   = ErrServerName + "ErrKGTaskErr"   // 选取的图谱非kglist-as中
	ErrKGNotNoraml = ErrServerName + "ErrKGNotNoraml" // 选取的图谱没有处于正常完成状态

	ErrNebulaErr           = ErrServerName + "ErrNebulaErr"     // Nebula error
	ErrOpenSearchErr       = ErrServerName + "ErrOpenSearchErr" // OpenSearch error
	ErrNebulaNotFoundSpace = ErrServerName + "ErrNebulaNotFoundSpace"
	ErrNebulaStatsErr      = ErrServerName + "ErrNebulaStatsErr" // Nebula show stats error
	ErrKNetIDErr           = ErrServerName + "ErrKNetIDErr"      // KNetID error
)

var (
	ErrMsgMap      map[string]string // ErrMsgMap 全局错误描述
	ErrSolutionMap map[string]string // ErrSolutionMap 全局错误描处理建议
)

func init() {
	ErrMsgMap = map[string]string{
		ErrInternalErr: "Internal error",
		ErrLoginFailed: "Login failed",

		ErrOrientDBErr: "OrientDB error",
		ErrResourceErr: "Resource error",

		ErrKGIDErr:         "KGid error",
		ErrArgsErr:         "Param error",
		ErrTokenErr:        "Token error",
		ErrRightsErr:       "User Rights error",
		ErrGraphStatusErr:  "Graph Status error",
		ErrASAddressErr:    "AS address error",
		ErrESContentErr:    "ES content error",
		ErrVClassErr:       "KG class error",
		ErrConfigStatusErr: "KG Config status error",

		ErrAdvSearchConfIDErr:     "Adv search conf ID error",
		ErrAdvSearchConfKGNameErr: "KG adv search conf count error",
		ErrAdvConfNameErr:         "Adv conf name error",
		ErrAdvSearchErr:           "Adv search error",
		ErrAdvConfContentErr:      "Adv conf content error",
		ErrAdvConfKGErr:           "Adv conf KG choose error",

		ErrNebulaErr:           "Nebula error",
		ErrOpenSearchErr:       "OpenSearch error",
		ErrNebulaNotFoundSpace: "Nebula not found space",
		ErrNebulaStatsErr:      "Nebula stats error",
		ErrKNetIDErr:           "Knowledge network error",
	}

	ErrSolutionMap = map[string]string{
		ErrInternalErr: "",
	}
}

// ServError 服务器端错误
type ServError struct {
	error
	Code    string                 `json:"Code"`
	Message string                 `json:"message"`
	Cause   string                 `json:"cause"`
	Detail  map[string]interface{} `json:"detail"`
}

// Set 服务器端错误
func (s *ServError) Set(c *gin.Context) {
	c.Set(leo.ErrKey, structs.Map(s))
}

// Error
func (s ServError) Error() string {
	return fmt.Sprintf("[%d] Msg: %s", s.Code, s.Message)
}

// Extensions 兼容 OrientDB 的异常
// 需要实现一个 Extern 方法
// type ResolverError interface {
// 	error
// 	Extensions() map[string]interface{}
// }
//func (s ServError) Extensions() map[string]interface{} {
//	return map[string]interface{}{
//		"code":    s.Code,
//		"message": s.Message,
//		"cause":   s.Cause,
//		"detail":  s.Detail,
//	}
//}

// HTTPError HTTP 异常
type HTTPError struct {
	error
	Status int
	URL    string
	Msg    string
}

func (e HTTPError) Error() string {
	return fmt.Sprintf("Status Code: %d, Msg: %s, URL: %s", e.Status, e.Msg, e.URL)
}

// ReturnError 返回当前服务自定义的异常信息
func ReturnError(c *gin.Context, status int, code string, msg, cause string, detail map[string]interface{}) {
	c.Set(leo.StatusKey, status)
	leo.ThrowError(&ServError{
		Code:    code,
		Message: msg,
		Cause:   cause,
		Detail:  detail,
	}, c)
}

//// NewError 返回一个由 Cause 引起的 Error
//func NewError(id int, cause error) ServError {
//	return ServError{
//		Code:    id,
//		Message: ErrMsgMap[id],
//		Cause:   cause.Error(),
//		Detail: map[string]interface{}{
//			"err": cause,
//		},
//	}
//}

// 按照公司规范返回错误码
type Error struct {
	error
	ErrorCode    string
	Description  string
	Solution     string
	ErrorDetails []map[string]string
	ErrorLink    string
}

// Set 服务器端错误
func (s *Error) Set(c *gin.Context) {
	c.Set(leo.ErrKey, structs.Map(s))
}

// Error
func (s Error) Error() string {
	return fmt.Sprintf("[%s] Msg: %s", s.ErrorCode, s.Description)
}

func (s Error) Extensions() map[string]interface{} {
	return map[string]interface{}{
		"ErrorCode":    s.ErrorCode,
		"Description":  s.Description,
		"Solution":     s.Solution,
		"ErrorDetails": s.ErrorDetails,
	}
}

func ErrInfo(code string, cause error) Error {
	return Error{
		ErrorCode:   code,
		Description: ErrMsgMap[code],
		Solution:    ErrSolutionMap[code],
		ErrorDetails: []map[string]string{
			{
				"err": cause.Error(),
			},
		},
		ErrorLink: "",
	}
}

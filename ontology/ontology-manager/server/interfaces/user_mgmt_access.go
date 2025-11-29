package interfaces

import "context"

// UserMgmtAccess 定义用户管理相关的访问接口
type UserMgmtAccess interface {
	// GetUserNames 根据用户ID数组获取对应的用户名映射
	// 参数：
	//   - ctx: 上下文对象
	//   - userIDs: 用户ID数组
	// 返回：
	//   - map[string]string: 用户ID到用户名的映射
	//   - error: 错误信息
	GetUserNames(ctx context.Context, userIDs []string) (map[string]string, error)
}

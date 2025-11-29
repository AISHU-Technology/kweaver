package user_mgmt

import (
	"context"
	"fmt"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/bytedance/sonic"

	"ontology-manager/common"
	"ontology-manager/interfaces"
)

var (
	umAccessOnce sync.Once
	umAccess     interfaces.UserMgmtAccess
)

type userMgmtAccess struct {
	appSetting  *common.AppSetting
	httpClient  rest.HTTPClient
	userMgmtUrl string
}

// NewUserMgmtAccess 创建用户管理访问实例
func NewUserMgmtAccess(appSetting *common.AppSetting) interfaces.UserMgmtAccess {
	umAccessOnce.Do(func() {
		umAccess = &userMgmtAccess{
			appSetting:  appSetting,
			httpClient:  common.NewHTTPClient(),
			userMgmtUrl: appSetting.UserMgmtUrl,
		}
	})

	return umAccess
}

// GetUserNames 根据用户ID数组获取对应的用户名映射
// 参数：
//   - ctx: 上下文对象
//   - userIDs: 用户ID数组
//
// 返回：
//   - map[string]string: 用户ID到用户名的映射
//   - error: 错误信息
func (u *userMgmtAccess) GetUserNames(ctx context.Context, userIDs []string) (map[string]string, error) {
	if len(userIDs) == 0 {
		return make(map[string]string), nil
	}

	// 构建请求URL
	httpUrl := fmt.Sprintf("%s/api/user-management/v1/batch-get-user-info", u.userMgmtUrl)

	// 构建请求体
	requestBody := map[string]any{
		"user_ids": userIDs,
		"fields":   []string{"name"},
		"method":   "GET",
		"strict":   false,
	}

	// 设置请求头
	headers := map[string]string{
		"Content-Type": "application/json",
	}

	// 发送POST请求获取用户信息
	respCode, result, err := u.httpClient.PostNoUnmarshal(ctx, httpUrl, headers, requestBody)
	logger.Debugf("post [%s] finished, response code is [%d], result is [%s], error is [%v]", httpUrl, respCode, result, err)

	if err != nil {
		logger.Errorf("Get user names request failed: %v", err)
		return nil, fmt.Errorf("get user names request failed: %w", err)
	}

	if respCode != 200 {
		logger.Errorf("Get user names request failed with status code: %d", respCode)
		return nil, fmt.Errorf("get user names request failed with status code: %d", respCode)
	}

	// 解析响应数据
	response := []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}{}

	if err := sonic.Unmarshal(result, &response); err != nil {
		logger.Errorf("Unmarshal user names response failed: %v", err)
		return nil, fmt.Errorf("unmarshal user names response failed: %w", err)
	}

	// 构建用户ID到用户名的映射
	userMap := make(map[string]string)
	for _, user := range response {
		userMap[user.ID] = user.Name
	}

	return userMap, nil
}

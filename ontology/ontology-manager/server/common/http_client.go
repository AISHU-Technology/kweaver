package common

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

var (
	httpClientOnce sync.Once
	httpClient     rest.HTTPClient
)

func NewHTTPClient() rest.HTTPClient {
	httpClientOnce.Do(func() {
		httpClient = rest.NewHTTPClient()
	})

	return httpClient
}

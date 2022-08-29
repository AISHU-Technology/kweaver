package initialize

import (
	"crypto/tls"
	"kw-studio/global"
	"kw-studio/http/impl"
	"net/http"
	"runtime"
	"time"
)

func HttpService() {
	var client = &http.Client{
		Timeout: 5 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:       2 * runtime.NumCPU(),
			IdleConnTimeout:    30 * time.Second,
			DisableCompression: true,
			TLSClientConfig:    &tls.Config{InsecureSkipVerify: true}},
	}

	global.SwaggerHttpService = &impl.Swagger{Client: client}
}

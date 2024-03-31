// Package httpclient httpclient 客户端基础实现
package httpclient

import (
	"bytes"
	"crypto/tls"
	"errors"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	jsoniter "github.com/json-iterator/go"
)

//go:generate mockgen -package mock -source ./http_client.go -destination ./mock/mock_http_client.go

// HTTPClient HTTP客户端服务接口
type HTTPClient interface {
	Get(url string, headers map[string]string) (respCode int, respParam []byte, err error)
	Post(url string, headers map[string]string, reqParam interface{}) (respCode int, respParam []byte, err error)
	Put(url string, headers map[string]string, reqParam interface{}) (respCode int, respParam []byte, err error)
	Delete(url string, headers map[string]string) (respParam []byte, err error)
	HttpForward(r *http.Request, url string, method string) (respCode int, body []byte, contentType string, err error)
}

var (
	rawOnce   sync.Once
	rawClient *http.Client
	httpOnce  sync.Once
	client    HTTPClient
)

// httpClient HTTP客户端结构
type httpClient struct {
	client *http.Client
}

// NewRawHTTPClient 创建原生HTTP客户端对象
func NewRawHTTPClient() *http.Client {
	rawOnce.Do(func() {
		rawClient = &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
			Transport: &http.Transport{
				TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
				MaxIdleConnsPerHost:   100,
				MaxIdleConns:          100,
				IdleConnTimeout:       90 * time.Second,
				TLSHandshakeTimeout:   10 * time.Second,
				ExpectContinueTimeout: 1 * time.Second,
			},
			Timeout: 10 * time.Second,
		}
	})

	return rawClient
}

// NewHTTPClient 创建HTTP客户端对象
func NewHTTPClient() HTTPClient {
	httpOnce.Do(func() {
		client = &httpClient{
			client: NewRawHTTPClient(),
		}
	})

	return client
}

// NewHTTPClientEx 创建HTTP客户端对象, 自定义超时时间
func NewHTTPClientEx(timeout time.Duration) HTTPClient {
	return &httpClient{
		client: &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
			Transport: &http.Transport{
				TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
				MaxIdleConnsPerHost:   100,
				MaxIdleConns:          100,
				IdleConnTimeout:       90 * time.Second,
				TLSHandshakeTimeout:   10 * time.Second,
				ExpectContinueTimeout: 1 * time.Second,
			},
			Timeout: timeout * time.Second,
		},
	}
}

// Get http client get
func (c *httpClient) Get(url string, headers map[string]string) (respCode int, respParam []byte, err error) {
	req, err := http.NewRequest("GET", url, http.NoBody)
	if err != nil {
		return
	}

	respCode, respParam, _, err = c.httpDo(req, headers)
	if err != nil {
		return
	}
	return
}

// Post http client post
func (c *httpClient) Post(url string, headers map[string]string, reqParam interface{}) (respCode int, respParam []byte, err error) {
	var reqBody []byte
	if v, ok := reqParam.([]byte); ok {
		reqBody = v
	} else {
		reqBody, err = jsoniter.Marshal(reqParam)
		if err != nil {
			return
		}
	}

	req, err := http.NewRequest("POST", url, bytes.NewReader(reqBody))
	if err != nil {
		return
	}

	respCode, respParam, _, err = c.httpDo(req, headers)
	return
}

// Put http client put
func (c *httpClient) Put(url string, headers map[string]string, reqParam interface{}) (respCode int, respParam []byte, err error) {
	reqBody, err := jsoniter.Marshal(reqParam)
	if err != nil {
		return
	}

	req, err := http.NewRequest("PUT", url, bytes.NewReader(reqBody))
	if err != nil {
		return
	}

	respCode, respParam, _, err = c.httpDo(req, headers)
	return
}

// Delete http client delete
func (c *httpClient) Delete(url string, headers map[string]string) (respParam []byte, err error) {
	req, err := http.NewRequest("DELETE", url, http.NoBody)
	if err != nil {
		return
	}

	_, respParam, _, err = c.httpDo(req, headers)
	return
}

// HttpForward 转发request，需要保证request里的body可以读取
func (c *httpClient) HttpForward(r *http.Request, url, method string) (respCode int, body []byte, contentType string, err error) {
	req, err := http.NewRequest(method, url, r.Body)
	if err != nil {
		return
	}
	req.Header = r.Header
	req.Form = r.Form
	respCode, body, contentType, err = c.httpDo(req, nil)
	return
}

func (c *httpClient) httpDo(req *http.Request, headers map[string]string) (respCode int, body []byte, contentType string, err error) {
	if c.client == nil {
		return 0, nil, "", errors.New("http client is unavailable")
	}

	c.addHeaders(req, headers)

	resp, err := c.client.Do(req)
	if err != nil {
		return
	}
	defer func() {
		closeErr := resp.Body.Close()
		if closeErr != nil {
			logx.Error(closeErr)
		}
	}()
	body, err = io.ReadAll(resp.Body)
	respCode = resp.StatusCode
	contentType = resp.Header.Get("Content-Type")

	return
}

func (c *httpClient) addHeaders(req *http.Request, headers map[string]string) {
	if len(headers) == 0 {
		return
	}

	for k, v := range headers {
		if len(v) > 0 {
			req.Header.Add(k, v)
		}
	}
}

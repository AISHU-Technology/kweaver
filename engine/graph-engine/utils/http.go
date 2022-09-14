// Package utils 项目的通用的工具
// - 描述：orientdb server http访问辅助方法
// - 时间：2020-2-29
package utils

import (
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"time"
)

func makeHTTPClient() http.Client {
	var (
		dailTimeout     time.Duration = 3
		responseTimeout time.Duration = 30
	)
	var client = http.Client{
		Transport: &http.Transport{
			Dial: func(netw, addr string) (net.Conn, error) {
				conn, err := net.DialTimeout(netw, addr, time.Second*dailTimeout) //设置建立连接超时
				if err != nil {
					return nil, err
				}
				conn.SetDeadline(time.Now().Add(time.Second * (dailTimeout + responseTimeout))) //设置发送接受数据超时
				return conn, nil
			},
			ResponseHeaderTimeout: time.Second * responseTimeout,
			TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
		},
	}

	return client
}

// GetHTTPResponse 获取请求
func GetHTTPResponse(request *http.Request) ([]byte, error) {
	request.Header.Set("Accept-Encoding", "identity")
	request.Header.Set("Content-Type", "application/json;charset=utf-8")
	request.Header.Set("Connection", "close") // 短连接

	var client = makeHTTPClient()
	resp, err := client.Do(request)

	if err != nil {
		return nil, err
	}

	bytes, err := ioutil.ReadAll(resp.Body)

	if err != nil {
		return bytes, err
	}

	if resp.StatusCode != http.StatusOK {
		return bytes, HTTPError{
			Status: resp.StatusCode,
			URL:    request.URL.String(),
			//Msg:    http.StatusText(resp.StatusCode),
			Msg: string(bytes),
		}
	}
	EscapeInvalidC(&bytes)

	return bytes, nil
}

// GetHTTPResponseWithAuth 获取请求
func GetHTTPResponseWithAuth(request *http.Request, user, pwd string) ([]byte, error) {
	//// base64 encode
	//pwdEncode := base64.StdEncoding.EncodeToString([]byte("anydata123"))
	//fmt.Print(pwdEncode)

	// base64 decode
	pwdDecode, err := base64.StdEncoding.DecodeString(pwd)
	if err != nil {
		return nil, err
	}

	request.SetBasicAuth(user, string(pwdDecode))
	return GetHTTPResponse(request)
}

// AnyShareHttpResponse
func ASGetHttpResponseWithToken(method, url, token string, body io.Reader) (map[string]interface{}, error) {
	http.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	//提交请求
	request, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, err
	}

	//增加header选项
	accessToken := "Bearer " + token
	request.Header.Add("authorization", accessToken)

	resp, err := (&http.Client{}).Do(request)
	if err != nil {
		return nil, err
	}

	bytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, HTTPError{
			Status: resp.StatusCode,
			URL:    request.URL.String(),
			Msg:    http.StatusText(resp.StatusCode),
		}
	}
	EscapeInvalidC(&bytes)

	var respJson map[string]interface{}
	err = json.Unmarshal(bytes, &respJson)
	if err != nil {
		return nil, err
	}

	return respJson, nil
}

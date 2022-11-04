package kw_errors

import "encoding/json"

type Error struct {
	HttpCode     int           `json:"-"`
	ErrorCode    string        `json:"ErrorCode"`
	Description  string        `json:"Description"`
	Solution     string        `json:"Solution"`
	ErrorDetails []interface{} `json:"ErrorDetails"`
	ErrorLink    string        `json:"ErrorLink"`
}

func (e *Error) Error() string {
	bytes, _ := json.Marshal(e)
	return string(bytes)
}

func (e Error) SetDetailError(msgs ...string) *Error {
	for _, msg := range msgs {
		e.ErrorDetails = append(e.ErrorDetails, msg)
	}
	return &e
}

func (e Error) SetHttpCode(httpCode int) *Error {
	e.HttpCode = httpCode
	return &e
}

func (e Error) SetDetailString(message string) *Error {
	e.ErrorDetails = append(e.ErrorDetails, message)
	return &e
}

func (e Error) SetDescription(des string) *Error {
	e.Description = des
	return &e
}

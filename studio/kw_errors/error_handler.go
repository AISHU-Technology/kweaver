package kw_errors

import (
	"errors"
	"reflect"
)

/**
 * @Author: Xiangguang.li
 * @Date: 2022/2/24
 * @Email: Xiangguang.li@aishu.cn
 **/

type ErrorHandler func() []error

// Throw 如果ErrorHandler处理后返回errors不为空，则使用e包装后panic
func (handler ErrorHandler) Throw(e *Error) {
	if errs := handler(); errs != nil && len(errs) > 0 {
		errMsgs := make([]string, len(errs))
		for i, err := range errs {
			errMsgs[i] = err.Error()
		}
		panic(e.SetDetailError(errMsgs...))
	}
}

// Handle 如果ErrorHandler处理后返回的errors不为空，则使用处理函数errorHandler处理
func (handler ErrorHandler) Handle(errorHandler func(errs ...error)) {
	if errors := handler(); errors != nil && len(errors) > 0 {
		errorHandler(errors...)
	}
}

// ErrorHandlerCreator 根据参数类型创建不同类型的ErrorHandler
type ErrorHandlerCreator func(params ...interface{}) ErrorHandler

var (
	defaultHandler = func(params ...interface{}) ErrorHandler {
		return func() []error {
			var errs []error
			for _, param := range params {
				if param == nil {
					continue
				}
				if err, ok := param.(error); ok {
					if errs == nil {
						errs = make([]error, 0)
					}
					errs = append(errs, err)
				}
			}
			return errs
		}
	}

	funcPanicHandler = func(params ...interface{}) ErrorHandler {
		if len(params) <= 0 {
			return nil
		}
		rv := reflect.ValueOf(params[0])
		if rv.Kind() == reflect.Func {
			return func() (errs []error) {
				defer func() {
					if err := recover(); err != nil {
						if e, ok := err.(error); ok {
							errs = []error{e}
						} else if errorMsg, ok := err.(string); ok {
							errs = []error{errors.New(errorMsg)}
						}
					}
				}()
				paramsValues := make([]reflect.Value, len(params)-1)
				for i := 1; i < len(params); i++ {
					paramsValues[i-1] = reflect.ValueOf(params[i])
				}
				rv.Call(paramsValues)
				return
			}
		}
		return nil
	}

	errorHandlerCreators = []ErrorHandlerCreator{
		funcPanicHandler,
		defaultHandler,
	}
)

// Try 传入待处理的参数
// 1.如果传入的第一个参数为函数，则后面的参数作为函数的参数，Try返回ErrorHandler,执行ErrorHandler会执行函数并捕获从函数抛出的error，然后交给后续处理函数
// 2.如果传入的第一个参数不是函数，Try返回ErrorHandler，执行ErrorHandler会找出参数中所有不为空的error,然后交给后续处理函数
func Try(params ...interface{}) ErrorHandler {
	for _, creator := range errorHandlerCreators {
		if handler := creator(params...); handler != nil {
			return handler
		}
	}
	return defaultHandler(params...)
}

package logger

import (
	"encoding/json"
	"fmt"
	"runtime"
	"runtime/debug"
	"time"
)

const (
	SystemLog   = "SystemLog"
	BusinessLog = "BusinessLog"
)

// SystemLogModel 系统日志
type SystemLogModel struct {
	Message interface{} `json:"message"` //日志信息
	Caller  string      `json:"caller"`  //调用位置
	Stack   string      `json:"stack"`   //调用栈
	Time    string      `json:"time"`    //时间
}

func NewSystemLog(message interface{}) *SystemLogModel {
	_, file, line, _ := runtime.Caller(1)
	return &SystemLogModel{
		Message: message,
		Caller:  fmt.Sprintf("%s:%d", file, line),
		Time:    time.Now().Format("2006/01/02 15:04:05"),
	}
}

func NewSystemLogWithStack(message interface{}) *SystemLogModel {
	_, file, line, _ := runtime.Caller(1)
	return &SystemLogModel{
		Message: message,
		Caller:  fmt.Sprintf("%s:%d", file, line),
		Stack:   string(debug.Stack()),
		Time:    time.Now().Format("2006/01/02 15:04:05"),
	}
}

func (model *SystemLogModel) WithTime(time time.Time) *SystemLogModel {
	model.Time = time.Format("2006/01/02 15:04:05")
	return model
}

func (model *SystemLogModel) WithCaller(caller string) *SystemLogModel {
	model.Caller = caller
	return model
}

func (model *SystemLogModel) WithStack(stack string) *SystemLogModel {
	model.Stack = stack
	return model
}

// Operations
const (
	Create = "create"
	Delete = "delete"
	Update = "update"
)

func OperationSwitchChinese(operation string) string {
	var operationMsg string
	switch operation {
	case Create:
		operationMsg = "创建"
	case Delete:
		operationMsg = "删除"
	case Update:
		operationMsg = "更新"
	}
	return operationMsg
}

// Operator type
const (
	AuthenticatedUser = "authenticated_user"
	AnonymousUser     = "anonymous_user"
	InternalService   = "internal_service"
)

// Object type 资源类型
const (
	User     = "user"
	EventLog = "eventLog"
	DictType = "dictType"
	DictItem = "DictItem"
	Menu     = "Menu"
)

func ObjectTypeSwitchChinese(typ string) string {
	var typMsg string
	switch typ {
	case User:
		typMsg = "账户"
	case EventLog:
		typMsg = "事件日志"
	case DictType:
		typMsg = "字典类型"
	case DictItem:
		typMsg = "字典值"
	case Menu:
		typMsg = "菜单"
	}
	return typMsg
}

// BusinessLogModel 业务日志
type BusinessLogModel struct {
	Operator     interface{} `json:"operator"`     //操作者
	Operation    string      `json:"operation"`    //操作类型
	Object       interface{} `json:"object"`       //操作对象
	TargetObject interface{} `json:"targetObject"` //操作结果信息
	TargetMsg    string      `json:"-"`            //结果描述，用户自动生成description
	Description  string      `json:"description"`  //操作描述
	Time         string      `json:"time"`         //时间
}

// Operator 操作人信息
type Operator struct {
	Type  string      `json:"type"` //操作客户端类型：authenticated_user | anonymous_user | internal_service
	Id    string      `json:"id"`
	Name  string      `json:"name"`
	Agent interface{} `json:"agent"`
}

type Agent struct {
	Type string `json:"type"`
	Ip   string `json:"ip"`
}

// Object 操作对象信息
type Object struct {
	Id   string `json:"id"`
	Type string `json:"type"`
}

func NewBusinessLog() *BusinessLogModel {
	return &BusinessLogModel{
		Operator: &Operator{},
		Object:   &Object{},
		Time:     time.Now().Format("2006/01/02 15:04:05"),
	}
}

// WithDescription 设置描述信息
func (model *BusinessLogModel) WithDescription(description string) *BusinessLogModel {
	model.Description = description
	return model
}

// WithOperator 设置操作人信息
func (model *BusinessLogModel) WithOperator(operator interface{}) *BusinessLogModel {
	model.Operator = operator
	return model
}

// WithOperation 设置操作类型
func (model *BusinessLogModel) WithOperation(operation string) *BusinessLogModel {
	model.Operation = operation
	return model
}

// WithObject 设置操作对象信息
func (model *BusinessLogModel) WithObject(object interface{}) *BusinessLogModel {
	model.Object = object
	return model
}

// WithTargetObject 设置操作结果对象信息
func (model *BusinessLogModel) WithTargetObject(object interface{}) *BusinessLogModel {
	model.TargetObject = object
	return model
}

func (model *BusinessLogModel) WithTargetMsg(msg string) *BusinessLogModel {
	model.TargetMsg = msg
	return model
}

// GenerateDescription 根据已有的信息自动生成描述信息
func (model *BusinessLogModel) GenerateDescription() *BusinessLogModel {
	if model.Operator == nil || model.Object == nil {
		return model
	}
	operator := model.Operator.(*Operator)
	object := model.Object.(*Object)
	if operator == nil || object == nil {
		return model
	}
	var operatorMsg, operationMsg, objectTypeMsg string
	if operator.Type == AuthenticatedUser || operator.Type == AnonymousUser {
		if operator.Type == AuthenticatedUser {
			operatorMsg = fmt.Sprintf("用户{id=%s,name=%s}", operator.Id, operator.Name)
		} else {
			operatorMsg = "用户"
		}
		if operator.Agent != nil {
			agent := operator.Agent.(*Agent)
			operatorMsg += fmt.Sprintf("在客户端{ip=%s,type=%s}", agent.Ip, agent.Type)
		}
	} else {
		operatorMsg = "内部程序"
	}
	operationMsg = OperationSwitchChinese(model.Operation)
	objectTypeMsg = ObjectTypeSwitchChinese(object.Type)
	model.Description = fmt.Sprintf("%s%s了%s{id=%s}", operatorMsg, operationMsg, objectTypeMsg, object.Id)
	if model.TargetMsg != "" {
		model.Description += fmt.Sprintf("的%s", model.TargetMsg)
	}
	if model.TargetObject != nil {
		bytes, _ := json.Marshal(model.TargetObject)
		model.Description += fmt.Sprintf("，结果为%s", string(bytes))
	}
	return model
}

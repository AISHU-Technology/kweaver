// @Author : yuan.qi@aishu.cn
// @File : gatewaylogger.go
// @Time : 2021/3/17

package logger

import (
	"fmt"
	"github.com/json-iterator/go"
	rotatelogs "github.com/lestrrat-go/file-rotatelogs"
	"github.com/pkg/errors"
	"github.com/rifflock/lfshook"
	"github.com/sirupsen/logrus"
	"github.com/vladoatanasov/logrus_amqp"
	"gopkg.in/olivere/elastic.v5"
	"gopkg.in/sohlich/elogrus.v2"
	"path"
	"sync"
	"time"
)

var log *logrus.Logger
var FeedbackLog *logrus.Logger
var carrier sync.Pool
var json = jsoniter.ConfigCompatibleWithStandardLibrary
var Logger struct{}

func init() {
	carrier = sync.Pool{
		New: func() interface{} {
			return &stdContent{
				dopts: defaultAttr(),
			}
		},
	}
	log = logrus.New()
	FeedbackLog = logrus.New()

	log.SetFormatter(&MyFormatter{})
	SetIoStreamToFile("logs", "feedback", time.Duration(365*24)*time.Hour, time.Duration(24)*time.Hour)
}

func ResetCarrierForReUsing(p *stdContent) {
	p.dopts.Body = nil
	p.dopts.Resource = nil
	p.dopts.Attributes = nil
	p.dopts.Severity = ""
	p.dopts.TraceFlags = ""
	p.dopts.SpanId = ""
	p.dopts.TraceId = ""
	p.dopts.Timestamp = 0
	carrier.Put(p)
}

type MyFormatter struct{}

func (s *MyFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	return []byte(fmt.Sprintf("%s\n", entry.Message)), nil
}

type LogStream struct {
	Timestamp  int64       `json:"Timestamp"`
	TraceId    string      `json:"TraceId"`
	SpanId     string      `json:"SpanId"`
	TraceFlags string      `json:"TraceFlags"`
	Body       interface{} `json:"Body"`
	Resource   interface{} `json:"Resource"`
	Attributes interface{} `json:"Attributes"`
	Severity   string      `json:"Severity"`
}

type StdInt interface {
	apply(*LogStream)
}

type funcOption struct {
	f func(*LogStream)
}

func (fdo *funcOption) apply(do *LogStream) {
	fdo.f(do)
}

func ContentOptionFunc(f func(*LogStream)) *funcOption {
	return &funcOption{
		f: f,
	}
}

func WithBody(body interface{}) StdInt {
	return ContentOptionFunc(func(o *LogStream) {
		o.Body = body
	})
}

func WithResource(resource interface{}) StdInt {
	return ContentOptionFunc(func(o *LogStream) {
		o.Resource = resource
	})
}

func WithAttributes(attr interface{}) StdInt {
	return ContentOptionFunc(func(o *LogStream) {
		o.Attributes = attr
	})
}

func WithSpanId(s string) StdInt {
	return ContentOptionFunc(func(o *LogStream) {
		o.SpanId = s
	})
}

func WithTraceId(s string) StdInt {
	return ContentOptionFunc(func(o *LogStream) {
		o.TraceId = s
	})
}

func WithTraceFlags(s string) StdInt {
	return ContentOptionFunc(func(o *LogStream) {
		o.TraceFlags = s
	})
}

//默认参数
func defaultAttr() LogStream {
	return LogStream{
		Timestamp: time.Now().Unix(),
	}
}

type stdContent struct {
	dopts LogStream
}

func MultiParamPlugin(cc *stdContent, opts []interface{}) {
	for _, opt := range opts {
		if o, ok := opt.(StdInt); ok {
			o.apply(&(cc.dopts))
		} else {
			switch opt.(type) {
			case string:
				if cc.dopts.Body == nil {
					cc.dopts.Body = fmt.Sprintf("%s", opt.(string))
					continue
				}
				cc.dopts.Body = fmt.Sprintf("%s %s", cc.dopts.Body, opt.(string))
			case int:
				if cc.dopts.Body == nil {
					cc.dopts.Body = fmt.Sprintf("%d", opt.(int))
					continue
				}
				cc.dopts.Body = fmt.Sprintf("%s %d", cc.dopts.Body, opt.(int))
			default:
				s, _ := json.Marshal(opt)
				if cc.dopts.Body == nil {
					cc.dopts.Body = fmt.Sprintf("%s", string(s))
					continue
				}
				cc.dopts.Body = fmt.Sprintf("%s %s", cc.dopts.Body, string(s))
			}
		}
	}
	if cc.dopts.Resource == nil {
		cc.dopts.Resource = ""
	}
	if cc.dopts.Attributes == nil {
		cc.dopts.Attributes = ""
	}
	if cc.dopts.Body == nil {
		cc.dopts.Body = ""
	}
}

// config logrus log to File
func SetIoStreamToFile(logPath string, logFileName string, maxAge time.Duration, rotationTime time.Duration) {
	baseLogPath := path.Join(logPath, logFileName)
	writer, err := rotatelogs.New(
		baseLogPath+"_%Y%m%d"+".log",
		//rotatelogs.WithLinkName(baseLogPath),      // 生成软链，指向最新日志文件
		rotatelogs.WithMaxAge(maxAge),             // 文件最大保存时间
		rotatelogs.WithRotationTime(rotationTime), // 日志切割时间间隔
	)
	if err != nil {
		log.Errorf("config local file system logger error. %+v", errors.WithStack(err))
	}
	lfHook := lfshook.NewHook(lfshook.WriterMap{
		logrus.DebugLevel: writer, // 为不同级别设置不同的输出目的
		logrus.InfoLevel:  writer,
		logrus.WarnLevel:  writer,
		logrus.ErrorLevel: writer,
		logrus.FatalLevel: writer,
		logrus.PanicLevel: writer,
	}, &MyFormatter{})
	FeedbackLog.AddHook(lfHook)
}

// config logrus log to MQ
func SetIoStreamToMQ(server, username, password, exchange, exchangeType, virtualHost, routingKey string) {
	hook := logrus_amqp.NewAMQPHookWithType(server, username, password, exchange, exchangeType, virtualHost, routingKey)
	log.AddHook(hook)
}

// config logrus log to es
func SetIoStreamToEs(esUrl string, esHOst string, index string) {
	client, err := elastic.NewClient(elastic.SetURL(esUrl))
	if err != nil {
		log.Errorf("config es logger error. %+v", errors.WithStack(err))
	}
	esHook, err := elogrus.NewElasticHook(client, esHOst, log.Level, index)
	if err != nil {
		log.Errorf("config es logger error. %+v", errors.WithStack(err))
	}
	log.AddHook(esHook)
}

func Info(opts ...interface{}) {
	cc := carrier.Get().(*stdContent)
	defer ResetCarrierForReUsing(cc)
	cc.dopts.Severity = "INFO"
	cc.dopts.Timestamp = time.Now().Unix()
	MultiParamPlugin(cc, opts)
	msg, _ := json.Marshal(cc.dopts)
	log.Info(string(msg))
}

func Warn(opts ...interface{}) {
	cc := carrier.Get().(*stdContent)
	defer ResetCarrierForReUsing(cc)
	cc.dopts.Severity = "WARN"
	cc.dopts.Timestamp = time.Now().Unix()
	MultiParamPlugin(cc, opts)
	msg, _ := json.Marshal(cc.dopts)
	log.Warn(string(msg))
}

func Error(opts ...interface{}) {
	if len(opts) == 0 {
		return
	}
	cc := carrier.Get().(*stdContent)
	defer ResetCarrierForReUsing(cc)
	cc.dopts.Severity = "ERROR"
	cc.dopts.Timestamp = time.Now().Unix()
	MultiParamPlugin(cc, opts)
	msg, _ := json.Marshal(cc.dopts)
	log.Error(string(msg))
}

func Panic(opts ...interface{}) {
	cc := carrier.Get().(*stdContent)
	defer ResetCarrierForReUsing(cc)
	cc.dopts.Severity = "PANIC"
	cc.dopts.Timestamp = time.Now().Unix()
	MultiParamPlugin(cc, opts)
	msg, _ := json.Marshal(cc.dopts)
	log.Panic(string(msg))
}

#!/usr/bin/env python
# -*- coding: utf-8 -*-
import logging
import json
import datetime
import math

REMOVE_ATTR = ["process", "processName", "threadName", "thread", "funcName", "lineno", "pathname", "levelno", "name",
               "filename", "module", "exc_text", "stack_info", "created", "msecs", "relativeCreated",
               "exc_info", "msg", "args"]


class JSONFormatter(logging.Formatter):
    def format(self, record):
        extra = self.build_record(record)
        self.set_format_time(extra)  # set time
        self.set_attrs(extra)
        self.set_resources(extra)
        self.set_others(extra)
        if isinstance(record.msg, dict):
            if not record.msg.get("Body"):
                raise Exception("if pass a dict,key `Body` is needed")
            if record.msg.get("Attributes"):
                extra["Attributes"] = record.msg.get("Attributes")
            if record.msg.get("SpanId"):
                extra["SpanId"] = record.msg.get("SpanId")
            if record.msg.get("TraceId"):
                extra["TraceId"] = record.msg.get("TraceId")
            if record.msg.get("Body"):
                extra['Body'] = record.msg.get("Body")
            else:
                extra['Body'] = record.msg  # set message
        else:
            if record.args:
                extra['Body'] = "'" + record.msg + "'," + str(record.args).strip('()')
            else:
                extra['Body'] = record.msg
        extra["Severity"] = extra["levelname"]
        del extra["levelname"]
        if self._fmt == 'pretty':
            return json.dumps(extra, indent=1, ensure_ascii=False)
        else:
            return json.dumps(extra, ensure_ascii=False)

    @classmethod
    def build_record(cls, record):
        return {
            attr_name: record.__dict__[attr_name]
            for attr_name in record.__dict__
            if attr_name not in REMOVE_ATTR
        }

    @classmethod
    def set_format_time(cls, extra):
        now = math.floor(datetime.datetime.now().timestamp())
        extra['Timestamp'] = now
        return now

    @classmethod
    def set_attrs(cls, extra):
        extra["Attributes"] = {}
        return None

    @classmethod
    def set_resources(cls, extra):
        extra["Resource"] = {}
        return None

    @classmethod
    def set_others(cls, extra):
        extra["TraceId"] = ""
        extra["SpanId"] = ""
        return None


class LogModel(dict):
    @property
    def attr(self):
        return self["Attributes"]

    @attr.setter
    def attr(self, value):
        self["Attributes"] = value

    @property
    def span_id(self):
        return self["SpanId"]

    @span_id.setter
    def span_id(self, value):
        self["SpanId"] = value

    @property
    def trace_id(self):
        return self["TraceId"]

    @trace_id.setter
    def trace_id(self, value):
        self["TraceId"] = value

    @property
    def body(self):
        return self["Body"]

    @body.setter
    def body(self, value):
        self["Body"] = value


def _set_log_model(body, span_id="", trace_id="", attributes={}) -> LogModel:
    if not body:
        raise Exception("body can not be null")
    model = LogModel()
    model.trace_id = trace_id
    model.span_id = span_id
    model.attr = attributes
    model.body = body
    return model


class Log:
    def __init__(self):
        # ---------------------初始化-------------------------------------------------
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)  # 设置全局日志级别为DEBUG
        # write log to file
        handler = logging.FileHandler("/var/log/logging.txt")  # 添加本地日志输入，文件自己定义
        handler.setLevel(logging.INFO)  # 设置输出日志到文件得日志级别，如果不需要写入到文件，把这行和上一行注释了
        handler.setFormatter(JSONFormatter())  # 使用自定义的格式输入日志到文件
        self.logger.addHandler(handler)  # 添加日志文件handler
        # write log to console
        handler_console = logging.StreamHandler()  # 设置输出日志到标准输出
        handler_console.setLevel(logging.INFO)  # 设置输出到标准输出得日志级别
        self.logger.addHandler(handler_console)  # 添加日志控制台handler
        # handler_console.setFormatter(JSONFormatter("pretty"))  # 使用自定义的格式输入控制台并且增加json缩进，美化输出，加上pretty美化参数会额外有性能损耗

    def log_info(self, body):
        self.logger.info(str(body))

    def info(self, body):
        self.logger.info(str(body))

    def log_error(self, err):
        self.logger.error(str(err))

    def error(self, err):
        self.logger.error(str(err))

    def set_log_model(self, body, span_id="", trace_id="", attributes={}) -> LogModel:
        if not body:
            raise Exception("body can not be null")
        model = LogModel()
        model.trace_id = trace_id
        model.span_id = span_id
        model.attr = attributes
        model.body = body
        return model


Logger = Log()

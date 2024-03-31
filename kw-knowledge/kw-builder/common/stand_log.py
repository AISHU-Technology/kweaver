#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Author  : Cerfly.xie
# @Time    : 2022/12/27 17:30

import time

import arrow
from flask import request

SYSTEM_LOG = "SystemLog"
BUSINESS_LOG = "BusinessLog"

CREATE = "create"  # 新建
DELETE = "delete"  # 删除
DOWNLOAD = "download"  # 下载
UPDATE = "update"  # 修改
UPLOAD = "upload"  # 上传
LOGIN = "login"  # 登录

# supervisord程序的标准输出流
LOG_FILE = "/dev/fd/1"


def get_error_log(message, caller_frame, caller_traceback=""):
    """
        获取待打印的错误日志
        @message:实际内容(字符串类型)
        @caller_frame:调用者上下文（请使用sys._getframe()）
        @caller_traceback:调用者当前堆栈信息（请使用traceback.format_exc()，调用位置不在except Exception：下，请不要传参）
    """
    log_info = {}
    log_info["message"] = message
    log_info["caller"] = caller_frame.f_code.co_filename + ":" + str(caller_frame.f_lineno)
    log_info["stack"] = caller_traceback
    log_info["time"] = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time()))
    return log_info


def get_operation_log(user_name, operation, object_id, target_object, description, object_type="kg"):
    """
        获取待打印的用户行为日志
        @user_name: 用户名
        @operation: 操作类型(CREATE, DELETE, DOWNLOAD, UPDATE, UPLOAD, LOGIN)
        @object_id: 操作对象id（也可以是一个列表）
        @target_object: 操作结果对象，类型为dict
        @description: 行为描述（传参只应包括具体动作，例如：修改了知识图谱{id=3}，结果为{name:"知识图谱2"}）
        @object_type: 操作对象类型(知识网络:kn, 知识图谱:kg, 数据源:ds, 词库:lexicon, 函数:function, 本体:otl)
    """
    user_id = request.headers.get("userId")
    agent_type = request.headers.get("User-Agent")
    ip = request.headers.get("X-Forwarded-For")
    agent = {
        "type": agent_type,
        "ip": ip
    }
    operator = {
        "type": "authenticated_user",
        "id": user_id,
        "name": user_name,
        "agent": agent
    }
    object_info = {
        "id": object_id,
        "type": object_type
    }
    now_time = arrow.now().format('YYYY-MM-DD HH:mm:ss')
    description = "用户{id=%s,name=%s}在客户端{ip=%s,type=%s}" % (user_id, user_name, ip, agent_type) + description
    operation_log = {
        "operator": operator,
        "operation": operation,
        "object": object_info,
        "targetObject": target_object,
        "description": description,
        "time": now_time
    }
    return operation_log


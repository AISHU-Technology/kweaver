# -*- coding:utf-8 -*-
# @Author: Cerfly.xie
# @Email: Cerfly.xie@aishu.cn
# @CreatDate: 2023/5/22 09:36

import inspect
import os
from typing import Tuple

cur_pwd = os.getcwd()

def GetCallerInfo() -> Tuple[str, int]:
    """ 获取调用者文件项目相对位置以及行号 """
    caller_frame = inspect.stack()[2]
    caller_filename = caller_frame.filename.split(cur_pwd)[-1][1:]
    caller_lineno = caller_frame.lineno
    return caller_filename, caller_lineno

def IsInPod() -> bool:
    return 'KUBERNETES_SERVICE_HOST' in os.environ and 'KUBERNETES_SERVICE_PORT' in os.environ

# 触发熔断的失败次数
failureThreshold = 10
def GetFailureThreshold() -> int:
    return failureThreshold

def SetFailureThreshold(time:int):
    global failureThreshold
    failureThreshold = time

# 熔断触发后的再次重试间隔，单位：秒
recoveryTimeout = 5
def GetRecoveryTimeout() -> int:
    return recoveryTimeout

def SetRecoveryTimeout(time:int):
    global recoveryTimeout
    recoveryTimeout = time

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
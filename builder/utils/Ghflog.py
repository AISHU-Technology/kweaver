# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import sys
import os
import logbook, platform
from logbook import Logger, TimedRotatingFileHandler


from config import config as Config

DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S.00"


def user_handler_log_formatter(record, handler):
    currentLogTime = str(record.time)
    log = "{dt}\t{level}\t{filename}\t{func_name}\t{lineno}\t{msg}".format(
        dt=currentLogTime[0:-3],
        level=record.level_name,
        filename=os.path.split(record.filename)[-1],
        func_name=record.func_name,
        lineno=record.lineno,
        msg=record.message,
    )
    return log


# 日志路径如果为linux并且指定的文件夹存在则日志放到指定文件夹

try:
    APP_LOG_PATH = Config.APP_LOG_PATH
    current_system = platform.system().lower()
    if current_system == "linux":
        LOG_DIR = APP_LOG_PATH
    else:
        LOG_DIR = os.path.join('logs')
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)
except Exception as e:
    LOG_DIR = os.path.join('logs')
    print("日志文件" + LOG_DIR + "不存在", str(e))


# 用户代码logger日志
hflog = Logger("hflog")


def init_logger(hflog, logName="ib"):
    logbook.set_datetime_format("local")
    hflog.handlers = []
    user_file_handler = TimedRotatingFileHandler(
        os.path.join(LOG_DIR, '%s.log' % logName), date_format='%Y%m%d-' + str(os.getpid()), bubble=True)
    user_file_handler.formatter = user_handler_log_formatter
    hflog.handlers.append(user_file_handler)


init_logger(hflog)

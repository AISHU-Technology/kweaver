#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging
import time
import sys
import os

'''
日志logger类
'''

# 创建logs文件夹
rootPath = os.path.abspath(os.path.dirname(os.path.abspath(__file__)) + os.path.sep + "..")
# cur_path = os.path.dirname(os.path.realpath(__file__))
log_path = os.path.join(rootPath, 'logs')
# 如果不存在这个logs文件夹，就自动创建一个
if not os.path.exists(log_path): os.mkdir(log_path), os.chmod(log_path, 0o777)


class Log(object):
    def __init__(self):
        # 文件的命名
        self.logname = os.path.join(log_path, '%s.log' % time.strftime('%Y_%m_%d'))
        logging.basicConfig()
        self.logger = logging.getLogger("mylogger")
        self.logger.setLevel(logging.DEBUG)
        self.logger.propagate = False
        # 日志输出格式
        self.formatter = logging.Formatter('[%(asctime)s] - %(levelname)s: %(message)s')

    def __console(self, level, message):
        # 创建一个FileHandler，用于写到本地
        fh = logging.FileHandler(self.logname, 'a', encoding='utf-8')  # 这个是python3的
        fh.setLevel(logging.INFO)
        fh.setFormatter(self.formatter)
        self.logger.addHandler(fh)

        # 创建一个StreamHandler,用于输出到控制台
        ch = logging.StreamHandler()
        ch.setLevel(logging.DEBUG)
        ch.setFormatter(self.formatter)
        self.logger.addHandler(ch)

        if level == 'info':
            self.logger.info(message)
        elif level == 'debug':
            self.logger.debug(message)
        elif level == 'warning':
            self.logger.warning(message)
        elif level == 'error':
            self.logger.error(message)
        # 这两行代码是为了避免日志输出重复问题
        self.logger.removeHandler(ch)
        self.logger.removeHandler(fh)
        # 关闭打开的文件
        fh.close()

    def debug(self, message):
        self.__console('debug', message)

    def info(self, message):
        self.__console('info', message)

    def warning(self, message):
        self.__console('warning', message)

    def error(self, message):
        self.__console('error', message)


log = Log()

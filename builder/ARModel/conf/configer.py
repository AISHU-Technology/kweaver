# -*- coding: utf-8 -*-
from configparser import ConfigParser
from configparser import NoOptionError, NoSectionError
import os


class MyConfigParser():
    def __init__(self, ):
        self.config = ConfigParser()
        # root_path = os.path.abspath(os.path.dirname(os.path.abspath(__file__)) + os.path.sep + "..")
        self.config.read("../unstructedmodel/OperationMaintenanceModel/model/config.txt", encoding="utf-8")
    
    # 如果没有找到就返回默认值
    def get(self, section, option, defaultValue=''):
        value = ''
        try:
            value = self.config.get(section, option)
        except (NoSectionError, NoOptionError):
            value = defaultValue
        return value


config = MyConfigParser()


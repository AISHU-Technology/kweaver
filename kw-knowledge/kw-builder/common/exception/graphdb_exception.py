# -*- coding:utf-8 -*-
from common.exception.base import ADBaseException


class GraphDBException(ADBaseException):
    def __init__(self, error_info_tuple):
        """
        图数据库异常
        :param tuple error_info_tuple: (<msgid>, <error_value>)
        """
        super(GraphDBException, self).__init__(error_info_tuple)
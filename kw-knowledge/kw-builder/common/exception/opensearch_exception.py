# -*- coding:utf-8 -*-
from common.exception.base import ADBaseException


class OpensearchException(ADBaseException):
    def __init__(self, error_info_tuple):
        """
        opensearch异常
        :param tuple error_info_tuple: (<msgid>, <error_value>)
        """
        super(OpensearchException, self).__init__(error_info_tuple)
# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import re

from flask import jsonify
from flask_babel import gettext as _l
import sys
import traceback

from common.errorcode import errDict
from common.errorcode.codes import successCode
from utils.log_info import Logger
import common.stand_log as log_oper
import copy


class Gview(object):
    """
    api对外暴露统一的接口
    """

    @staticmethod
    def replaceArgs(content, ds):
        try:
            content = _l(content)
            p = re.compile('\[(\w+)\]')
            args = p.findall(content)
            if len(args) <= 0:
                return content
            for arg in args:
                sub_str = "[{}]".format(arg)
                content = str(content).replace(sub_str, str(ds[arg]))
            return content
        except Exception as e:
            error_log = log_oper.get_error_log(f"international translation error:{repr(e)}", sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
        return content

    @classmethod
    def TErrorreturn(cls, ErrorCode, **args):
        detailError = errDict[ErrorCode]
        detailErrorCopy= copy.deepcopy(detailError)

        detailErrorCopy['Description'] = cls.replaceArgs(detailError['Description'], args)
        detailErrorCopy['ErrorDetails'] = cls.replaceArgs(detailError['ErrorDetails'], args)
        detailErrorCopy['Solution'] = cls.replaceArgs(detailError['Solution'], args)
        detailErrorCopy['ErrorLink'] = ""
        return jsonify(detailErrorCopy)

    @classmethod
    def error_return(cls, error_code, **args):
        detail_error = errDict[error_code]
        detail_error_copy = copy.deepcopy(detail_error)

        detail_error_copy['Description'] = cls.replaceArgs(detail_error['Description'], args)
        detail_error_copy['ErrorDetails'] = cls.replaceArgs(detail_error['ErrorDetails'], args)
        detail_error_copy['Solution'] = cls.replaceArgs(detail_error['Solution'], args)
        return jsonify(detail_error_copy)

    @staticmethod
    def json_return(data):
        """
        统一返回调用信息
        :param data:
        :return:
        """
        obj = {}
        obj['res'] = data
        return jsonify(obj)

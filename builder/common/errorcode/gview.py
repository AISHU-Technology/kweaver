# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import re

from flask import jsonify
from flask_babel import gettext as _l

from common.errorcode import errDict
from common.errorcode.codes import successCode
import copy


class Gview(object):
    """
    api对外暴露统一的接口
    """

    @staticmethod
    def replaceArgs(content, ds):
        content = _l(content)
        p = re.compile('\[(\w+)\]')
        args = p.findall(content)
        if len(args) <= 0:
            return content
        for arg in args:
            subStr = "[{}]".format(arg)
            content = str(content).replace(subStr, str(ds[arg]))
        return content

    @classmethod
    def TErrorreturn(cls, ErrorCode, **args):
        detailError = errDict[ErrorCode]
        detailErrorCopy= copy.deepcopy(detailError)

        detailErrorCopy['description'] = cls.replaceArgs(detailError['description'], args)
        detailErrorCopy['cause'] = cls.replaceArgs(detailError['cause'], args)
        detailErrorCopy['solution'] = cls.replaceArgs(detailError['solution'], args)
        return jsonify(detailErrorCopy)

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

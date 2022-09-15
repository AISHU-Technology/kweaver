# -*-coding:utf-8-*-
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

        detailErrorCopy['Description'] = cls.replaceArgs(detailError['Description'], args)
        detailErrorCopy['ErrorDetails'] = cls.replaceArgs(detailError['ErrorDetails'], args)
        detailErrorCopy['Solution'] = cls.replaceArgs(detailError['Solution'], args)
        detailErrorCopy['ErrorLink'] = ""
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

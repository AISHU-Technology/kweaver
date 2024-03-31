# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from flask import jsonify,make_response
import re

class Gview(object):
    """
    api对外暴露统一的接口
    """

    @classmethod
    def __init__(cls):
        pass #empty
    @staticmethod
    def BuVreturn(message):
        """
        统一返回调用信息
        """
        obj = {}
        obj['res'] = message+" success"
        # response = make_response(jsonify(obj))
        # response.headers['Access-Control-Allow-Origin'] = '*'
        # response.headers['Access-Control-Allow-Methods'] = 'OPTIONS,HEAD,GET,POST'
        # response.headers['Access-Control-Allow-Headers'] = 'x-requested-with'
        return jsonify(obj)

    @staticmethod
    def BuFailVreturn(cause, code, message):
        """
        错误 统一返回调用信息
        """
        obj = {}
        obj['Cause'] = cause
        obj['Code'] = code
        obj['message'] = message
        # response = make_response(jsonify(obj))
        # response.headers['Access-Control-Allow-Origin'] = '*'
        # response.headers['Access-Control-Allow-Methods'] = 'OPTIONS,HEAD,GET,POST'
        # response.headers['Access-Control-Allow-Headers'] = 'x-requested-with'
        return jsonify(obj)

    @staticmethod
    def BuFailVreturnV2(cause, code, message):
        """
        错误 统一返回调用信息
        """
        obj = {}
        obj['cause'] = cause
        obj['code'] = code
        obj['message'] = message
        # response = make_response(jsonify(obj))
        # response.headers['Access-Control-Allow-Origin'] = '*'
        # response.headers['Access-Control-Allow-Methods'] = 'OPTIONS,HEAD,GET,POST'
        # response.headers['Access-Control-Allow-Headers'] = 'x-requested-with'
        return jsonify(obj)

    @staticmethod
    def Vsuccess(data=None, message='success'):
        """
        返回成功调用方法
        :param data:
        :param message:
        :return:
        """
        obj = {}
        obj['code'] = 200
        obj['data'] = data
        obj['message'] = message
        return jsonify(obj)

    @staticmethod
    def Vfail(data=None, message='fail'):
        """
        返回失败调用方法
        :param data:
        :param message:
        :return:
        """
        obj = {}
        code_str = [int(s) for s in re.findall(r'\d+', message)]
        code = 400000
        if len(code_str) > 0:
            if code_str[0] == 1045:
                code = 400006
        obj['Cause'] = message
        obj['Code'] = code
        err = "unknown error "
        if code == 400006:
            err = "密码或者用户名错误 "
        elif code == 400004:
            err = "密码或者用户名错误3333 "
        obj['message'] = err
        return jsonify(obj)


    @staticmethod
    def Vreturn(code, data, message):
        """
        统一返回调用信息
        :param code:
        :param data:
        :param message:
        :return:
        """
        obj = {}
        obj['code'] = code
        obj['data'] = data
        obj['message'] = message
        return jsonify(obj)

    @staticmethod
    def VErrorreturn(oldobj):
        obj = {}
        obj["ErrorCode"] = str(oldobj["ErrorCode"])
        obj["Description"] = oldobj["Description"]
        obj["Solution"] = oldobj["Solution"]
        obj["ErrorDetails"] = oldobj["ErrorDetails"]
        obj["ErrorLink"] = oldobj["ErrorLink"]
        return jsonify(obj)

    @staticmethod
    def TErrorreturn(ErrorCode, Description, Solution, ErrorDetails, ErrorLink):
        obj = {}
        obj["ErrorCode"] = f'{ErrorCode}'
        obj["Description"] = Description
        obj["Solution"] = Solution
        obj["ErrorDetails"] = ErrorDetails
        obj["ErrorLink"] = ErrorLink
        return jsonify(obj)

    @staticmethod
    def text_match_return(data):
        """
        统一返回调用信息
        :param data:
        :return:
        """
        obj = {}
        obj['res'] = data
        return jsonify(obj)

# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from flask import jsonify, Response,make_response
from werkzeug.datastructures import Headers

class Gresponse(Response):
    """
    http统一钩子方法
    """

    #
    # def options(self):
    #     return {'Allow': '*'}, 200, {'Access-Control-Allow-Origin': '*',
    #                                  'Access-Control-Allow-Methods': 'HEAD, OPTIONS, GET, POST, DELETE, PUT',
    #                                  'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild',
    #                                  }
    #

    # def __init__(self, response=None, **kwargs):
        # kwargs['headers'] = ''
        # headers = kwargs.get('headers')
        # # 跨域控制
        # origin = ('Access-Control-Allow-Origin', '*')
        # methods = ('Access-Control-Allow-Methods', 'HEAD, OPTIONS, GET, POST, DELETE, PUT')
        # if headers:
        #     headers.add(*origin)
        #     headers.add(*methods)
        # else:
        #     headers = Headers([origin, methods])
        # kwargs['headers'] = headers
        # return super().__init__(response, **kwargs)

    @classmethod
    def force_type(cls, response, environ=None):
        if isinstance(response, (list, dict)):
            response = jsonify(response)
        return super(Response, cls).force_type(response, environ)

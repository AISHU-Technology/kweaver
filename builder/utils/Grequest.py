# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import json
from flask import make_response


class Grequest():
    """
    http统一钩子方法
    """

    @staticmethod
    def beforeRequest():
        """
        http请求前置钩子方法
        :return:
        """

        # try:
        #     data=request.get_json()
        # except:
        #     return Gview.Vfail('数据格式不正确',406)
        # #data=json.loads(data)
        #
        #
        # baseToken = request.headers.get('Authorization')
        # baseToken = baseToken[ 6: ]
        # baseToken = base64.b64decode(baseToken.encode('utf-8'))
        # baseToken = baseToken.decode('utf-8')
        # print(baseToken)
        # if True:
        #     # if baseToken!='jython:jython1':
        #     obj = {'status_code': 401}
        #     response = make_response( )
        #     response.status_code = 401
        #     response.headers[ 'WWW-Authenticate' ] = 'Basic realm="test"'
        #     return response
        # return Gview.Vsuccess()

    @staticmethod
    def afterRequest(response):
        """
        http后置钩子方法
        :param response:
        :return:
        """
        obj = {}
        obj['code'] = response.status_code
        data = response.data.decode('utf-8')
        data = json.loads(data)
        response = make_response(data)
        return response
        # obj = {}
        # obj['code'] = response.status_code
        # data = response.data.decode('utf-8')
        # message = ''
        # try:
        #     data = json.loads(data)
        #     if 'code' in data.keys():
        #         obj = data
        #     else:
        #         message = data.get('message')
        #         if message:
        #             del data['message']
        #         obj['data'] = data
        #         obj['message'] = "" if not message else message
        # except:
        #     obj['data'] = data
        #     obj['message'] = "" if not message else message
        # finally:
        #     response = make_response(obj)
        # return response


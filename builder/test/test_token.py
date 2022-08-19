# -*- coding:utf-8 -*-
import unittest
from unittest import mock
import pandas as pd
import arrow
import requests
from multiprocessing import Pool
from test import MockResponse

from third_party_service.anyshare.token import asToken
from utils.ConnectUtil import redisConnect


class ASTokenTest(unittest.TestCase):
    

    class MockRedis:
        def __init__(self):
            self.values = {}  # 值为[值, 过期时间]

        def set(self, *args, **kargs):
            # >>> redis.set(redis_key, 'valid', ex=ASTOKEN_TIMEOUT, nx=True)
            k, v = args[0], args[1]
            ex, nx = kargs.get('ex', -1), kargs.get('nx', True)
            if nx:
                if k in self.values:
                    ex0 = self.values[k][1]
                    if ex0 == -1 or arrow.now() <= arrow.now().shift(seconds=ex0):  # 未过期
                        return False
                # 不存在k，或已过期
                self.values[k] = [v, ex]
                return True

        def delete(self, k):
            # >>> redis.delete(redis_key)
            if k in self.values:
                self.values.pop(k)

        def ttl(self, k):
            """获取失效时间，永久有效返回-1，k不存在返回-2
            >>> redis.ttl(redis_key)
            """
            if k in self.values:
                return self.values[k][1]
            return -2

        def expire(self, k, ex):
            """设置失效时间
            >>> redis.expire(redis_key, ASTOKEN_TIMEOUT)
            """
            if k in self.values:
                self.values[k][1] = ex
                return 1
            return 0

    def setUp(self) -> None:
        # mock get_data_by_auth的列
        self.data_get_data_by_auth_columns = ['ds_auth', 'redirect_uri', 'client_id', 'client_secret', 'refresh_token',
                                              'access_token',
                                              'ds_address', 'ds_port', 'ds_code', 'update_time']
        # mock insert_refresh_token 插入成功
        asToken.insert_refresh_token = mock.Mock(return_value=0)
        # mock get_source_data_by_auth ds_auth=1的数据源
        data_get_source_data_by_auth_columns = ['id', 'create_user', 'create_time', 'update_user', 'update_time',
                                                'dsname', 'dataType', 'data_source', 'ds_user', 'ds_password',
                                                'ds_address', 'ds_port', 'ds_path', 'extract_type', 'ds_auth', 'vhost',
                                                'queue', 'json_schema', 'knw_id']
        data_get_source_data_by_auth_row = [[1, 'a10b9b2a-e799-11ec-8695-d250fcb41284', '2022-06-09 10:14:14',
                                             '853ba1db-4e37-11eb-a57d-0242ac190002', '2022-06-15 14:53:56', '公司as',
                                             'unstructured', 'as7', None, None, 'https://anyshare.aishu.cn', 443,
                                             '郭健康（Stefan）', 'modelExtraction', '1', '', '', '', 1]]
        data_get_source_data_by_auth = pd.DataFrame(data_get_source_data_by_auth_row,
                                                    columns=data_get_source_data_by_auth_columns)
        asToken.get_source_data_by_auth = mock.Mock(return_value=data_get_source_data_by_auth)
        # mock 调用AS接口成功
        r_json = {
            'access_token': 'BpM65uBjzjBYqZD3biringpgNNUWwOUhaKQNhb4MNmI.yKGsnoF4S_i-9vAR0XXJkqp6sesPakaUSzDhVLYHmK4',
            'expires_in': 3600,
            'id_token': 'eyJhbGciOiJSUzI1NiIsImtpZCI6InB1YmxpYzoyNGMxNjhmZC05NTRlLTQyNzItYmYwMi1jNWY3NTdhMzFiOTIiLCJ0eXAiOiJKV1QifQ.eyJhdF9oYXNoIjoiVWVnV1pWNEZMa3dSNUdUcTFsNXJudyIsImF1ZCI6WyI3OTUyZGI3NS02MmMwLTRlNzQtODczNC0xN2RjYjdiY2VmYjEiXSwiYXV0aF90aW1lIjoxNjU0MzA3MTk2LCJleHAiOjE2NTU0NDY0NTMsImlhdCI6MTY1NTQ0Mjg1MywiaXNzIjoiaHR0cHM6Ly9hbnlzaGFyZS5haXNodS5jbjo0NDMvIiwianRpIjoiMWFkM2UzZTctYzg5MS00ZjU4LTgwMjUtMDhhNWEyMGEyOWIzIiwibm9uY2UiOiIiLCJyYXQiOjE2NTUyNzYwMjksInNpZCI6IjQ4MzYzNzdhLTM2MmYtNDgxOS1iNmY0LTM4NDE0NzViMTQwYyIsInN1YiI6IjYyZWY0MGJhLWVkZTYtMTFlYi05NzQzLTg2NWZlY2U1ZGJlNSJ9.ewVs4rYZXC4ZitskFdmIFxhsGfzgdix5l2bTQutXNH0LLC311FGNT-JZRbOhPjSvvwv0bMCsBJW0ZWYDOrya_vC1Hg9hLahTYGI14LmiH4QI3krQ5hbiod3Qrva44spJlDC0aTYI_0U0QIggsa7YcV3eIsAznxblzVA1j12MCWSzmPiOqayxgTSKORikQ7MBFImadCZtqQUInRpa7EHXYSL39oaK9NK-hsJGm2wxMm9SErbQpziypjyQ-BySQFBZXx54CkaGtEXyifNHa-zPnTQU8z-_QhTFORTY_OIZe_APcck2FEHUM5y8cMHtS2dbieAJ3_1k5HNl0ygIEpzri_hqh7XUskk0No77P9vKnlBuGLrft2_XxC5iA1trXdtlKRRxhohYaM7gbpMfX_XQAy9LggsXh0zo8KAG4HyzzusyC3xSu8qwAzX5ZBLsRePT5fpFOa4LIKxzeTM4Kf2AoHW89pVvUnIXeja5pR_9zzDwr9iChQi3HMBjUFYfbffIARlcw4TK608_J9aWdFWdeZb1C-zVxCw94Me3g1IE0qCUWo4JiGLkcPn6uuepRed0jb7YaM3i_78qJ5TLzJlbMgZlglapbiWKEzdCEQmdAQIJDgo8RzfpSJ4M-02eiySw61EpKl0fuJVQPdX6FVIvvxdkkn278AN111KB05VEX2s',
            'refresh_token': 'oHJ4YQoAH90soai5vrWh4uTYu3-aqprpq9Qia0SsnPQ.QBNmwgUC3mJEGs0snK23l2HNOMhEruqXPWGZ5N414zs',
            'scope': 'openid offline all', 'token_type': 'bearer'}
        requests.post = mock.Mock(return_value=MockResponse(200, r_json))
        # mock redis
        redisConnect.connect_redis = mock.Mock(return_value=self.MockRedis())

    def test_get_token_success1(self):
        """
        token处于有效期内
        """
        # get_data_by_auth mock数据: token有效,update_time设为过去前5分钟
        data_get_data_by_auth_row = [[1, 'https://10.4.106.255/auth-success/1', '7952db75-62c0-4e74-8734-17dcb7bcefb1',
                                      '4tAOncH37-B3',
                                      'dV2XaXtfU4Vu14gs0ugB-Z_BGolUFc9J5tb-ap4umyU.S30oAREXR8KpheLkkVpSDo_CILvzINYZujpGyI0Dryw',
                                      'oYgqHNPCY5wmhzFI0SNv5i-lz74bUCgJR42IcvM9cC4.NAqwGoOBWJ_qYQNSg5z9O2a7mDXGZInvJEPYOyS-EC0',
                                      'https://anyshare.aishu.cn', '443',
                                      'cqwkLZioi1bhn93M1TliHUMEPfAyxQ24kx4Ja5dsfLI.VuWHDMuZOXgw64xpHK2W3xvt-MWOHT7Ye5S6TYWoncA',
                                      arrow.now().shift(minutes=-5).format('YYYY-MM-DD HH:mm:ss')]]
        data_get_data_by_auth = pd.DataFrame(data_get_data_by_auth_row, columns=self.data_get_data_by_auth_columns)
        asToken.get_data_by_auth = mock.Mock(return_value=data_get_data_by_auth)
        ret_code, token = asToken.get_token(1)
        self.assertEqual(ret_code, 200)

    def test_get_token_success2(self):
        """
        token距离上次更新过了70分钟
        """
        # get_data_by_auth mock数据: token有效,update_time设为过去前70分钟
        data_get_data_by_auth_row = [[1, 'https://10.4.106.255/auth-success/1', '7952db75-62c0-4e74-8734-17dcb7bcefb1',
                                      '4tAOncH37-B3',
                                      'dV2XaXtfU4Vu14gs0ugB-Z_BGolUFc9J5tb-ap4umyU.S30oAREXR8KpheLkkVpSDo_CILvzINYZujpGyI0Dryw',
                                      'oYgqHNPCY5wmhzFI0SNv5i-lz74bUCgJR42IcvM9cC4.NAqwGoOBWJ_qYQNSg5z9O2a7mDXGZInvJEPYOyS-EC0',
                                      'https://anyshare.aishu.cn', '443',
                                      'cqwkLZioi1bhn93M1TliHUMEPfAyxQ24kx4Ja5dsfLI.VuWHDMuZOXgw64xpHK2W3xvt-MWOHT7Ye5S6TYWoncA',
                                      arrow.now().shift(minutes=-70).format('YYYY-MM-DD HH:mm:ss')]]
        data_get_data_by_auth = pd.DataFrame(data_get_data_by_auth_row, columns=self.data_get_data_by_auth_columns)
        asToken.get_data_by_auth = mock.Mock(return_value=data_get_data_by_auth)
        ret_code, token = asToken.get_token(1)
        self.assertEqual(ret_code, 200)

    def test_get_token_success3(self):
        """
        token距离上次更新过了58分钟
        """
        # get_data_by_auth mock数据: token有效,update_time设为过去前58分钟
        data_get_data_by_auth_row = [[1, 'https://10.4.106.255/auth-success/1', '7952db75-62c0-4e74-8734-17dcb7bcefb1',
                                      '4tAOncH37-B3',
                                      'dV2XaXtfU4Vu14gs0ugB-Z_BGolUFc9J5tb-ap4umyU.S30oAREXR8KpheLkkVpSDo_CILvzINYZujpGyI0Dryw',
                                      'oYgqHNPCY5wmhzFI0SNv5i-lz74bUCgJR42IcvM9cC4.NAqwGoOBWJ_qYQNSg5z9O2a7mDXGZInvJEPYOyS-EC0',
                                      'https://anyshare.aishu.cn', '443',
                                      'cqwkLZioi1bhn93M1TliHUMEPfAyxQ24kx4Ja5dsfLI.VuWHDMuZOXgw64xpHK2W3xvt-MWOHT7Ye5S6TYWoncA',
                                      arrow.now().shift(minutes=-58).format('YYYY-MM-DD HH:mm:ss')]]
        data_get_data_by_auth = pd.DataFrame(data_get_data_by_auth_row, columns=self.data_get_data_by_auth_columns)
        asToken.get_data_by_auth = mock.Mock(return_value=data_get_data_by_auth)
        ret_code, token = asToken.get_token(1)
        self.assertEqual(ret_code, 200)

    def test_get_token_success4(self):
        """
        token距离上次更新过了55分钟
        """
        # get_data_by_auth mock数据: token有效,update_time设为过去前55分钟
        data_get_data_by_auth_row = [[1, 'https://10.4.106.255/auth-success/1', '7952db75-62c0-4e74-8734-17dcb7bcefb1',
                                      '4tAOncH37-B3',
                                      'dV2XaXtfU4Vu14gs0ugB-Z_BGolUFc9J5tb-ap4umyU.S30oAREXR8KpheLkkVpSDo_CILvzINYZujpGyI0Dryw',
                                      'oYgqHNPCY5wmhzFI0SNv5i-lz74bUCgJR42IcvM9cC4.NAqwGoOBWJ_qYQNSg5z9O2a7mDXGZInvJEPYOyS-EC0',
                                      'https://anyshare.aishu.cn', '443',
                                      'cqwkLZioi1bhn93M1TliHUMEPfAyxQ24kx4Ja5dsfLI.VuWHDMuZOXgw64xpHK2W3xvt-MWOHT7Ye5S6TYWoncA',
                                      arrow.now().shift(minutes=-55).format('YYYY-MM-DD HH:mm:ss')]]
        data_get_data_by_auth = pd.DataFrame(data_get_data_by_auth_row, columns=self.data_get_data_by_auth_columns)
        asToken.get_data_by_auth = mock.Mock(return_value=data_get_data_by_auth)
        ret_code, token = asToken.get_token(1)
        self.assertEqual(ret_code, 200)

    def test_get_token_success5(self):
        """
        token距离上次更新过了55分钟，且多线程同时请求token
        """
        # get_data_by_auth mock数据: token有效,update_time设为过去前55分钟
        data_get_data_by_auth_row = [[1, 'https://10.4.106.255/auth-success/1', '7952db75-62c0-4e74-8734-17dcb7bcefb1',
                                      '4tAOncH37-B3',
                                      'dV2XaXtfU4Vu14gs0ugB-Z_BGolUFc9J5tb-ap4umyU.S30oAREXR8KpheLkkVpSDo_CILvzINYZujpGyI0Dryw',
                                      'oYgqHNPCY5wmhzFI0SNv5i-lz74bUCgJR42IcvM9cC4.NAqwGoOBWJ_qYQNSg5z9O2a7mDXGZInvJEPYOyS-EC0',
                                      'https://anyshare.aishu.cn', '443',
                                      'cqwkLZioi1bhn93M1TliHUMEPfAyxQ24kx4Ja5dsfLI.VuWHDMuZOXgw64xpHK2W3xvt-MWOHT7Ye5S6TYWoncA',
                                      arrow.now().shift(minutes=-55).format('YYYY-MM-DD HH:mm:ss')]]
        data_get_data_by_auth = pd.DataFrame(data_get_data_by_auth_row, columns=self.data_get_data_by_auth_columns)
        asToken.get_data_by_auth = mock.Mock(return_value=data_get_data_by_auth)
        thread_num = 16  # 线程数
        # pool = Pool(thread_num)
        for i in range(thread_num):
            # res = pool.apply_async(asToken.get_token, args=(1,))
            # ret_code, token = res.get()
            ret_code, token = asToken.get_token(1)
            self.assertEqual(ret_code, 200)
            if i == 0:
                # get_data_by_auth mock数据: token有效
                data_get_data_by_auth_row = [
                    [1, 'https://10.4.106.255/auth-success/1', '7952db75-62c0-4e74-8734-17dcb7bcefb1',
                     '4tAOncH37-B3',
                     'dV2XaXtfU4Vu14gs0ugB-Z_BGolUFc9J5tb-ap4umyU.S30oAREXR8KpheLkkVpSDo_CILvzINYZujpGyI0Dryw',
                     'oYgqHNPCY5wmhzFI0SNv5i-lz74bUCgJR42IcvM9cC4.NAqwGoOBWJ_qYQNSg5z9O2a7mDXGZInvJEPYOyS-EC0',
                     'https://anyshare.aishu.cn', '443',
                     'cqwkLZioi1bhn93M1TliHUMEPfAyxQ24kx4Ja5dsfLI.VuWHDMuZOXgw64xpHK2W3xvt-MWOHT7Ye5S6TYWoncA',
                     arrow.now().format('YYYY-MM-DD HH:mm:ss')]]
                data_get_data_by_auth = pd.DataFrame(data_get_data_by_auth_row,
                                                     columns=self.data_get_data_by_auth_columns)
                asToken.get_data_by_auth = mock.Mock(return_value=data_get_data_by_auth)

    def test_get_token_fail1(self):
        """
        调用AS刷新token接口失败
        """
        # get_data_by_auth mock数据: token有效,update_time设为过去前55分钟
        data_get_data_by_auth_row = [[1, 'https://10.4.106.255/auth-success/1', '7952db75-62c0-4e74-8734-17dcb7bcefb1',
                                      '4tAOncH37-B3',
                                      'dV2XaXtfU4Vu14gs0ugB-Z_BGolUFc9J5tb-ap4umyU.S30oAREXR8KpheLkkVpSDo_CILvzINYZujpGyI0Dryw',
                                      'oYgqHNPCY5wmhzFI0SNv5i-lz74bUCgJR42IcvM9cC4.NAqwGoOBWJ_qYQNSg5z9O2a7mDXGZInvJEPYOyS-EC0',
                                      'https://anyshare.aishu.cn', '443',
                                      'cqwkLZioi1bhn93M1TliHUMEPfAyxQ24kx4Ja5dsfLI.VuWHDMuZOXgw64xpHK2W3xvt-MWOHT7Ye5S6TYWoncA',
                                      arrow.now().shift(minutes=-55).format('YYYY-MM-DD HH:mm:ss')]]
        data_get_data_by_auth = pd.DataFrame(data_get_data_by_auth_row, columns=self.data_get_data_by_auth_columns)
        asToken.get_data_by_auth = mock.Mock(return_value=data_get_data_by_auth)
        # mock 调用AS接口失败（服务器内部错误）
        r_json = {
            "error": "string",
            "error_description": "string",
            "error_hint": "string",
            "status_code": 0
        }
        requests.post = mock.Mock(return_value=MockResponse(500, r_json))
        ret_code, token = asToken.get_token(1)
        self.assertNotEqual(ret_code, 200)

    def test_get_token_fail2(self):
        """
        refresh_token过期
        """
        # get_data_by_auth mock数据: token有效,update_time设为过去前55分钟
        data_get_data_by_auth_row = [[1, 'https://10.4.106.255/auth-success/1', '7952db75-62c0-4e74-8734-17dcb7bcefb1',
                                      '4tAOncH37-B3',
                                      'dV2XaXtfU4Vu14gs0ugB-Z_BGolUFc9J5tb-ap4umyU.S30oAREXR8KpheLkkVpSDo_CILvzINYZujpGyI0Dryw',
                                      'oYgqHNPCY5wmhzFI0SNv5i-lz74bUCgJR42IcvM9cC4.NAqwGoOBWJ_qYQNSg5z9O2a7mDXGZInvJEPYOyS-EC0',
                                      'https://anyshare.aishu.cn', '443',
                                      'cqwkLZioi1bhn93M1TliHUMEPfAyxQ24kx4Ja5dsfLI.VuWHDMuZOXgw64xpHK2W3xvt-MWOHT7Ye5S6TYWoncA',
                                      arrow.now().shift(minutes=-55).format('YYYY-MM-DD HH:mm:ss')]]
        data_get_data_by_auth = pd.DataFrame(data_get_data_by_auth_row, columns=self.data_get_data_by_auth_columns)
        asToken.get_data_by_auth = mock.Mock(return_value=data_get_data_by_auth)
        # mock 调用AS接口失败（服务器内部错误）
        r_json = {
            "error": "string",
            "error_description": "string",
            "error_hint": "string",
            "status_code": 0
        }
        requests.post = mock.Mock(return_value=MockResponse(401, r_json))
        ret_code, token = asToken.get_token(1)
        self.assertNotEqual(ret_code, 200)

    def test_get_token_fail3(self):
        """
        ds_auth无效
        """
        # get_data_by_auth mock数据
        data_get_data_by_auth_row = []
        data_get_data_by_auth = pd.DataFrame(data_get_data_by_auth_row, columns=self.data_get_data_by_auth_columns)
        asToken.get_data_by_auth = mock.Mock(return_value=data_get_data_by_auth)
        ret_code, token = asToken.get_token(1)
        self.assertNotEqual(ret_code, 200)

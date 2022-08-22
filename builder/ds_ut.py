import unittest
import requests
from unittest.mock import Mock
from service.dsm_Service import dsm_service
import unittest
import requests
import mock
from controller.dsm_controller import connectTest
from utils.ds_check_parameters import dsCheckParameters
from service.dsm_Service import dsm_service
from dao.dsm_dao import dsm_dao
from utils.CommonUtil import commonutil
import os
import sys
sys.path.append(os.path.abspath("/"))
import unittest
from utils.ds_check_parameters import dsCheckParameters
from service.dsm_Service import dsm_service
from utils.CommonUtil import commonutil


# 每一个以test开头的方法，都会为其构建TestCase对象
class TestDsm(unittest.TestCase):

    # success
    def test_testConPar_success(self):
        params = {"data_source": "as7", "ds_address": "http://10.2.174.249", "ds_port": 443, "ds_auth": "92",
                  "ds_path": "123/POC数据集"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, 0)

    # 参数格式不是dict
    def test_testConPar_params_not_dict(self):
        params = [{"data_source": "as7", "ds_address": "https://10.2.174.249", "ds_port": 443, "ds_auth": "92",
                  "ds_path": "123/POC数据集"}]
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)
        self.assertEqual(message, "parameters must be json")

    # 缺少参数
    def test_testConPar_lack_params(self):
        params = {"ds_address": "https://10.2.174.249", "ds_port": 443, "ds_auth": "92",
                   "ds_path": "123/POC数据集"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

    # ds_port不是int
    def test_testConPar_dsport_type_error(self):
        params = {"data_source": "as7", "ds_address": "https://10.2.174.249", "ds_port": "443", "ds_auth": "92",
                  "ds_path": "123/POC数据集"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

    # ds_port不在1-65535的范围
    def test_testConPar_dsport_range_error(self):
        params = {"data_source": "as7", "ds_address": "https://10.2.174.249", "ds_port": 65536, "ds_auth": "92",
                  "ds_path": "123/POC数据集"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

    # ds_auth不是str
    def test_testConPar_dsauth_type_error(self):
        params = {"data_source": "as7", "ds_address": "https://10.2.174.249", "ds_port": 443, "ds_auth": 92,
         "ds_path": "123/POC数据集"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

    # ds_source error
    def test_testConPar_dssource_error1(self):
        params = {"data_source": "as8", "ds_address": "https://10.2.174.249", "ds_port": 443, "ds_auth": "92",
                  "ds_path": "123/POC数据集"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

    # ds_address 不是str
    def test_testConPar_dsaddress_type_error(self):
        params = {"data_source": "as7", "ds_address": 10, "ds_port": 443, "ds_auth": "92",
                  "ds_path": "123/POC数据集"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

    # ds_address error
    def test_testConPar_dsaddress_error1(self):
        params = {"data_source": "as7", "ds_address": "10.2.174.249", "ds_port": 443, "ds_auth": "92",
                  "ds_path": "123/POC数据集"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

    # ds_address=""
    def test_testConPar_dsaddress_error2(self):
        params = {"data_source": "as7", "ds_address": "", "ds_port": 443, "ds_auth": "92",
                  "ds_path": "123/POC数据集"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

    # ds_address包含" "
    def test_testConPar_dsaddress_error3(self):
        params = {"data_source": "as7", "ds_address": "https://10.2. 174.249", "ds_port": 443, "ds_auth": "92",
                  "ds_path": "123/POC数据集"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

    # ds_path error
    def test_testConPar_dspath_error1(self):
        params = {"data_source": "as7", "ds_address": "https://10.2.174.249", "ds_port": 443, "ds_auth": "92",
                  "ds_path": ""}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)


    # 参数多余，错误的参数
    def test_testConPar_surplus_params(self):
        params = {"data_source": "as7", "ds_address": "https://10.2.174.249", "ds_port": 443, "ds_auth": "92",
                  "ds_path": "123/POC数据集", "username": "admin"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

    # 参数多余，错误的参数
    def test_testConPar_params_error(self):
        params = {"data_source": "as7", "ds_address": "https://10.2.174.249", "ds_port": 443, "ds_auth": "92"}
        ret_status, message = dsCheckParameters.testConPar(params)
        self.assertEqual(ret_status, -1)

# as7测试连接成功
    def test_connectTest_as7_success(self):
        params_json = {"data_source": "as7", "ds_address": "https://10.2.174.249", "ds_port": 443, "ds_auth": "92",
         "ds_path": "123/POC数据集"}
        check_res, message = dsCheckParameters.testConPar(params_json)
        self.assertEqual(check_res, 0)
        ret_code, ret_message = dsm_service.connectTest(params_json)
        self.assertEqual(ret_code, 500)

    # as7测试连接失败
    def test_connectTest_as7_fail(self):
        params_json = {"data_source": "as8", "ds_address": "https://10.2.174.249", "ds_port": 443, "ds_auth": "92",
         "ds_path": "123/POC数据集"}
        check_res, message = dsCheckParameters.testConPar(params_json)
        self.assertEqual(check_res, -1)
        ret_code, ret_message = dsm_service.connectTest(params_json)
        self.assertEqual(ret_code, 400)

    # mysql
    def test_connectTest_mysql_success(self):
        params_json = {"data_source":"mysql","ds_address":"10.240.0.125","ds_port":3306,"ds_user":"root","ds_password":"RWlzb29AMTIz","ds_path":"kom"}
        check_res, message = dsCheckParameters.testConPar(params_json)
        self.assertEqual(check_res, 0)
        ret_code, ret_message = dsm_service.connectTest(params_json)
        self.assertEqual(ret_code, 200)
    # mysql
    def test_connectTest_mysql_fail(self):
        params_json = {"data_source":"mysql","ds_address":"10.240.0.125","ds_port":3306,"ds_user":"root","ds_password":"AMTIz","ds_path":"kom"}
        check_res, message = dsCheckParameters.testConPar(params_json)
        self.assertEqual(check_res, 0)
        ret_code, ret_message = dsm_service.connectTest(params_json)
        self.assertEqual(ret_code, 500)

    def test_getMethodParam_success(self):
        param_code, params_json, param_message = commonutil.getMethodParam()
        self.assertEqual(param_code, -1)

    def test_auth(self):
        params1 = {"ds_route": "auth-success","ds_address": "https://10.2.174.249","ds_auth":"92"}
        params2 = {"ds_route": "auth-success","ds_address": "https://10.2.174.249","ds_auth":"92", "name": ""}
        params3 = {"ds_route": "auth-success","ds_address": 74,"ds_auth":"92"}
        params4 = {"ds_route": "auth-success","ds_address": "https://10 .2.174.249","ds_auth":"92", "name": ""}
        params5 = {"ds_route": "auth-success","ds_address": "10.2.174.249","ds_auth":"92"}
        params6 = {"ds_route": "auth-success","ds_address": "https://10.2.174.249","ds_auth":92}
        params7 = {"ds_route": 1, "ds_address": "https://10.2.174.249","ds_auth":"92"}
        params8 = {"ds_routes": "auth-success", "ds_addresss": "https://10.2.174.249","ds_auth":"92"}
        params9 = {"ds_address": "https://10.2.174.249","ds_auth":"92"}

        check_res1, message1 = dsCheckParameters.Authcheck(params1)
        check_res2, message2 = dsCheckParameters.Authcheck(params2)
        check_res3, message3 = dsCheckParameters.Authcheck(params3)
        check_res4, message4 = dsCheckParameters.Authcheck(params4)
        check_res5, message5 = dsCheckParameters.Authcheck(params5)
        check_res6, message6 = dsCheckParameters.Authcheck(params6)
        check_res7, message7 = dsCheckParameters.Authcheck(params7)
        check_res8, message8 = dsCheckParameters.Authcheck(params8)
        check_res9, message9 = dsCheckParameters.Authcheck(params9)
        self.assertEqual(check_res1, 0)
        self.assertEqual(check_res2, 0)
        self.assertEqual(check_res3, -1)
        self.assertEqual(check_res4, -1)
        self.assertEqual(check_res5, -1)
        self.assertEqual(check_res6, -1)
        self.assertEqual(check_res7, -1)
        self.assertEqual(check_res8, -1)
        self.assertEqual(check_res9, -1)

    def test_gettokencheck(self):
        params1 = {"ds_code": "", "ds_auth": "92"}
        params2 = {"ds_auth": "92"}
        ret_status1, message1 = dsCheckParameters.gettokencheck(params1)
        ret_status2, message2 = dsCheckParameters.gettokencheck(params2)
        self.assertEqual(ret_status1, 0)
        self.assertEqual(ret_status2, -1)

    def test_verifycheck(self):
        params1 = {"ds_auth": "92"}
        params2 = {}
        params3 = {"ds_auth": None}
        params4 = {"ds_auth": "aa"}

        ret_status1, message1 = dsCheckParameters.verifycheck(params1)
        ret_status2, message2 = dsCheckParameters.verifycheck(params2)
        ret_status3, message3 = dsCheckParameters.verifycheck(params3)
        ret_status4, message4 = dsCheckParameters.verifycheck(params4)
        self.assertEqual(ret_status1, 0)
        self.assertEqual(ret_status2, -1)
        self.assertEqual(ret_status3, -1)
        self.assertEqual(ret_status4, -1)

    def test_dsgetbynamePar(self):
        params1 = {"page":"1", "size":"10", "dsname":"aa","order":"ascend"}
        params2 = {"page":"1", "size":"10", "dsname":"aa","order":"asc"}
        params3 = {"page":"1", "size":"", "dsname":11,"order":"ascend"}
        params4 = {"page":"1", "size":"0", "dsname":"aa","order":"ascend"}
        params5 = {"page":"a", "size":"10", "dsname":"aa","order":"ascend"}
        params6 = {"size":"10", "dsname":"aa","order":"ascend"}
        params7 = {"page":"a", "size":"10", "dsname":"aa","order":"ascend", "aaa": "vv"}

        ret_status1, message1 = dsCheckParameters.dsgetbynamePar(params1)
        ret_status2, message2 = dsCheckParameters.dsgetbynamePar(params2)
        ret_status3, message3 = dsCheckParameters.dsgetbynamePar(params3)
        ret_status4, message4 = dsCheckParameters.dsgetbynamePar(params4)
        ret_status5, message5 = dsCheckParameters.dsgetbynamePar(params5)
        ret_status6, message6 = dsCheckParameters.dsgetbynamePar(params6)
        ret_status7, message7 = dsCheckParameters.dsgetbynamePar(params7)
        self.assertEqual(ret_status1, 0)
        self.assertEqual(ret_status2, -1)
        self.assertEqual(ret_status3, -1)
        self.assertEqual(ret_status4, -1)
        self.assertEqual(ret_status5, -1)
        self.assertEqual(ret_status6, -1)
        self.assertEqual(ret_status7, -1)

    def test_dsDelPar(self):
        params1 = {"dsids":1, "name": "a"}
        params2 = {"dsids":1}
        params3 = {"sdss":1}
        params4 = {"dsids":[1,2,3,4]}
        params5 = {"dsids":[]}
        params6 = {"dsids":["1","2"]}

        ret_status1, message1 = dsCheckParameters.dsDelPar(params1)
        ret_status2, message2 = dsCheckParameters.dsDelPar(params2)
        ret_status3, message3 = dsCheckParameters.dsDelPar(params3)
        ret_status4, message4 = dsCheckParameters.dsDelPar(params4)
        ret_status5, message5 = dsCheckParameters.dsDelPar(params5)
        ret_status6, message6 = dsCheckParameters.dsDelPar(params6)
        self.assertEqual(ret_status1, -1)
        self.assertEqual(ret_status2, -1)
        self.assertEqual(ret_status3, -1)
        self.assertEqual(ret_status4, 0)
        self.assertEqual(ret_status5, -1)
        self.assertEqual(ret_status6, -1)


    def test_dsdelcheck(self):
        param = ""
        value1 = [1,2,3]
        value2 = []
        value3 = ["1", "2"]

        ret_status1, param1, message1 = dsCheckParameters.dsdelcheck(param, value1)
        ret_status2, param2, message2 = dsCheckParameters.dsdelcheck(param, value2)
        ret_status3, param3, message3 = dsCheckParameters.dsdelcheck(param, value3)
        self.assertEqual(ret_status1, -1)
        self.assertEqual(ret_status2, -1)
        self.assertEqual(ret_status3, 0)


if __name__ == '__main__':
    unittest.main()

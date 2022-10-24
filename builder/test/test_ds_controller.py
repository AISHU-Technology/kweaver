import json
import unittest
from unittest import TestCase, mock

from dao.graph_dao import graph_dao
from test import MockResponse
import pandas as pd
import requests

from dao.dsm_dao import dsm_dao
from main.builder_app import app
from utils.CommonUtil import commonutil
from utils.common_response_status import CommonResponseStatus

client = app.test_client()


class TestAuth(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/ds/Auth'
        self.data_row = [
            [1, "https://10.4.106.255/auth-success/1", "f8920c94-7c8c-46da-87db-8757aab4b488", "ipxnENkCcshp",
             "I2HGCqGyqFh5yKPiM5XH5mSQ9gj7j4NbWmCy1DDKwkE.-7LGrXL91aY241YzjDoNt4HyA0ji0-28O0wSh5mdhAI",
             "cqLusY9-z8xtPwKFlVc97skW-fdqJLXzpLQeCRsKzug.M8aU3w8zBj4epqSYSf8netY6JC9XGVQIszh2aHCE1SI",
             "https://anyshare.aishu.cn", 443,
             "T40F5h_GqlxgYEmD90k9JkfUuPuB1k_vg-vov6-WFx8.Jfk93qWTptXt7tQYZvjU1TrYgKrnz9bANKx458JtMFw",
             "2022-08-25 08:48:17"]]
        self.data_column = ["ds_auth", "redirect_uri", "client_id", "client_secret", "refresh_token", "access_token",
                            "ds_address", "ds_port", "ds_code", "update_time"]
        commonutil.getHostUrl = mock.Mock(return_value="localhost")
    def test_auth_success(self):
        """ success """
        requests.post = mock.Mock(return_value=MockResponse(201, {"client_id": "f8920c94-7c8c-46da-87db-8757aab4b488",
                                                                  "client_secret": "ipxnENkCcshp"})
                                  )
        data = pd.DataFrame(self.data_row, columns=self.data_column)
        dsm_dao.getdatabyauth = mock.Mock(return_value=data)
        dsm_dao.update_token = mock.Mock(return_value=1)
        response = client.get(self.url,
                              query_string={'ds_route': 'auth-success',
                                            'ds_address': '0.0.0.0',
                                            'ds_auth': 1,
                                            'ds_port': 5555}
                              )
        self.assertEqual(response.status_code, 200)

    def test_auth_failed1(self):
        """ params err """
        response = client.get(self.url,
                              query_string={'ds_route': 1,
                                            'ds_address': 1,
                                            'ds_auth': 'param',
                                            'ds_port': 99999}
                              )
        self.assertEqual(response.status_code, 400)

    def test_auth_failed2(self):
        """ Insert auth fail """
        requests.post = mock.Mock(return_value=MockResponse(201, {"client_id": "f8920c94-7c8c-46da-87db-8757aab4b488",
                                                                  "client_secret": "ipxnENkCcshp"})
                                  )
        dsm_dao.getdatabyauth = mock.Mock(side_effect=Exception())
        response = client.get(self.url,
                              query_string={'ds_route': 'auth-success',
                                            'ds_address': '0.0.0.0',
                                            'ds_auth': 1,
                                            'ds_port': 5555}
                              )
        self.assertEqual(response.status_code, 500)

    def test_auth_failed3(self):
        """ ds_auth not exist """
        requests.post = mock.Mock(return_value=MockResponse(201, {"client_id": "f8920c94-7c8c-46da-87db-8757aab4b488",
                                                                  "client_secret": "ipxnENkCcshp"})
                                  )
        data = pd.DataFrame([], columns=self.data_column)
        dsm_dao.getdatabyauth = mock.Mock(return_value=data)
        response = client.get(self.url,
                              query_string={'ds_route': 'auth-success',
                                            'ds_address': '0.0.0.0',
                                            'ds_auth': 1,
                                            'ds_port': 5555}
                              )
        self.assertEqual(response.status_code, 500)

    def test_auth_failed4(self):
        """ Get authorization fail """
        requests.post = mock.Mock(return_value=MockResponse(500, {}))
        response = client.get(self.url,
                              query_string={'ds_route': 'auth-success',
                                            'ds_address': '0.0.0.0',
                                            'ds_auth': 1,
                                            'ds_port': 5555}
                              )
        self.assertEqual(response.status_code, 500)


class TestGettoken(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/ds/gettoken'
        self.data_row = [
            [1, "https://10.4.106.255/auth-success/1", "f8920c94-7c8c-46da-87db-8757aab4b488", "ipxnENkCcshp",
             "I2HGCqGyqFh5yKPiM5XH5mSQ9gj7j4NbWmCy1DDKwkE.-7LGrXL91aY241YzjDoNt4HyA0ji0-28O0wSh5mdhAI",
             "cqLusY9-z8xtPwKFlVc97skW-fdqJLXzpLQeCRsKzug.M8aU3w8zBj4epqSYSf8netY6JC9XGVQIszh2aHCE1SI",
             "https://anyshare.aishu.cn", 443,
             "T40F5h_GqlxgYEmD90k9JkfUuPuB1k_vg-vov6-WFx8.Jfk93qWTptXt7tQYZvjU1TrYgKrnz9bANKx458JtMFw",
             "2022-08-25 08:48:17"]]
        self.data_column = ["ds_auth", "redirect_uri", "client_id", "client_secret", "refresh_token", "access_token",
                            "ds_address", "ds_port", "ds_code", "update_time"]

    def test_gettoken_success(self):
        """ success """
        df = pd.DataFrame([], columns=self.data_column)
        dsm_dao.getcode = mock.Mock(return_value=df)
        dsm_dao.gettokenbycode = mock.Mock(return_value={
            'refresh_token': "I2HGCqGyqFh5yKPiM5XH5mSQ9gj1j4NbWmCy1DDKwkE.-7LGrXL91aY241YzjDoNt4HyA0ji0-28O0wSh5mdhAI",
            "access_token": "cqLusY9-z8xtPwKFlVc97skW-fdqJLXzpLQeCRsKzug.M8aU3w8zBj4epqSYSf8netY6JC9XGVQIszh2aHCE1SI"})
        df = pd.DataFrame(self.data_row, columns=self.data_column)
        dsm_dao.getdatabyauth = mock.Mock(return_value=df)
        dsm_dao.insert_refresh_token = mock.Mock(return_value=1)
        response = client.post(self.url,
                               data=json.dumps({'ds_code': 'fd4645y6u6756454e5423465gbfxefef', 'ds_auth': '1'})
                               )
        self.assertEqual(response.status_code, 200)

    def test_gettoken_failed1(self):
        """ params error """
        response = client.post(self.url,
                               data=json.dumps({'ds_code': 123, 'ds_auth': 'abc', 'inexistence': 'inexistence'})
                               )
        self.assertEqual(response.status_code, 400)

    def test_gettoken_failed2(self):
        """ code has been exist """
        df = pd.DataFrame(self.data_row, columns=self.data_column)
        dsm_dao.getcode = mock.Mock(return_value=df)
        response = client.post(self.url,
                               data=json.dumps({'ds_code': 'fd4645y6u6756454e5423465gbfxefef', 'ds_auth': '1'})
                               )
        self.assertEqual(response.status_code, 500)

    def test_gettoken_failed3(self):
        """ Get token fail """
        df = pd.DataFrame([], columns=self.data_column)
        dsm_dao.getcode = mock.Mock(return_value=df)
        dsm_dao.gettokenbycode = mock.Mock(return_value="-1")
        response = client.post(self.url,
                               data=json.dumps({'ds_code': 'fd4645y6u6756454e5423465gbfxefef', 'ds_auth': '1'})
                               )
        self.assertEqual(response.status_code, 500)

    def test_gettoken_failed4(self):
        """ ds_auth not exist """
        df = pd.DataFrame([], columns=self.data_column)
        dsm_dao.getcode = mock.Mock(return_value=df)
        dsm_dao.gettokenbycode = mock.Mock(return_value="-2")
        response = client.post(self.url,
                               data=json.dumps({'ds_code': 'fd4645y6u6756454e5423465gbfxefef', 'ds_auth': '1'})
                               )
        self.assertEqual(response.status_code, 500)

    def test_gettoken_failed5(self):
        """ Insert refresh_token fail """
        df = pd.DataFrame([], columns=self.data_column)
        dsm_dao.getcode = mock.Mock(return_value=df)
        dsm_dao.gettokenbycode = mock.Mock(return_value={
            'refresh_token': "I2HGCqGyqFh5yKPiM5XH5mSQ9gj7j4NbWmCy1DDKwkE.-7LGrXL91aY241YzjDoNt4HyA0ji0-28O0wSh5mdhAI",
            "access_token": "cqLusY9-z8xtPwKFlVc97skW-fdqJLXzpLQeCRsKzug.M8aU3w8zBj4epqSYSf8netY6JC9XGVQIszh2aHCE1SI"})
        df = pd.DataFrame(self.data_row, columns=self.data_column)
        dsm_dao.getdatabyauth = mock.Mock(return_value=df)
        dsm_dao.insert_refresh_token = mock.Mock(side_effect=Exception())
        response = client.post(self.url,
                               data=json.dumps({'ds_code': 'fd4645y6u6756454e5423465gbfxefef', 'ds_auth': '1'})
                               )
        self.assertEqual(response.status_code, 500)

    def test_gettoken_failed6(self):
        """ exception """
        dsm_dao.getcode = mock.Mock(side_effect=Exception())
        response = client.post(self.url,
                               data=json.dumps({'ds_code': 'fd4645y6u6756454e5423465gbfxefef', 'ds_auth': '1'})
                               )
        self.assertEqual(response.status_code, 500)


class TestConnectTest(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/ds/testconnect'

    def test_connectTest_as_success(self):
        """ data_source is as success """
        commonutil.asTestCon = mock.Mock(return_value=(200, {'res': 'test connection'}))
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'as', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': '', 'queue': ''})
                               )
        self.assertEqual(response.status_code, 200)

    def test_connecTest_as_failed(self):
        """ data_source is as failed """
        commonutil.asTestCon = mock.Mock(return_value=(500, {'cause': 'JSONDecodeError',
                                                             'code': 500001,
                                                             'message': 'test connection fail'})
                                         )
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'as', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb18uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': '', 'queue': ''})
                               )
        self.assertEqual(response.status_code, 500)

    def test_connectTest_as7_success(self):
        """ data_source is as7 success """
        dsm_dao.as7TestCon = mock.Mock(return_value=(200, {}))
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'as7', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_path': 'anydata', 'vhost': '', 'queue': '',
                                                'ds_auth': '1'})
                               )
        self.assertEqual(response.status_code, 200)

    def test_connectTest_as7_failed(self):
        """ data_source is as7 failed """
        dsm_dao.as7TestCon = mock.Mock(return_value=(500, {'cause': 'JSONDecodeError',
                                                           'code': 500001,
                                                           'message': 'Anyshare 7 test connection fail'}))
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'as7', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_path': 'anydata', 'vhost': '', 'queue': '',
                                                'ds_auth': '1'})
                               )
        self.assertEqual(response.status_code, 500)

    def test_connectTest_mysql_success(self):
        """ data_source id mysql success """
        dsm_dao.mysqlConnectTest = mock.Mock(return_value=None)
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'mysql', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': '', 'queue': ''})
                               )
        self.assertEqual(response.status_code, 200)

    def test_connectTest_mysql_failed1(self):
        """ data_source is mysql password decryption err """
        dsm_dao.mysqlConnectTest = mock.Mock(return_value="-1")
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'mysql', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': '', 'queue': ''})
                               )
        self.assertEqual(response.status_code, 500)

    def test_connectTest_mysql_failed2(self):
        """ data_source is mysql time out """
        dsm_dao.mysqlConnectTest = mock.Mock(return_value="-2")
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'mysql', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb18uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': '', 'queue': ''})
                               )
        self.assertEqual(response.status_code, 500)

    def test_connectTest_mysql_failed3(self):
        """ data_source is mysql exception """
        dsm_dao.mysqlConnectTest = mock.Mock(side_effect=Exception("SQL,password"))
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'mysql', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb16uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': '', 'queue': ''})
                               )
        self.assertEqual(response.status_code, 500)

    def test_connectTest_hive_success(self):
        """ data_source is hive success """
        dsm_dao.hiveConnectTest = mock.Mock(return_value=None)
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'hive', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': '', 'queue': ''})
                               )
        self.assertEqual(response.status_code, 200)

    def test_connectTest_hive_failed1(self):
        """ data_source is hive password decryption err """
        dsm_dao.hiveConnectTest = mock.Mock(return_value="-1")
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'hive', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb18uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': '', 'queue': ''})
                               )
        self.assertEqual(response.status_code, 500)

    def test_connectTest_hive_failed2(self):
        """ data_source is hive exception """
        dsm_dao.hiveConnectTest = mock.Mock(side_effect=Exception("SQL,Error validating the login"))
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'hive', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb16uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': '', 'queue': ''})
                               )
        self.assertEqual(response.status_code, 500)

    def test_connectTest_rabbitmq_failed(self):
        """ data_source is RabbitMQ failed """
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'rabbitmq', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': 'vhost', 'queue': 'queue'})
                               )
        self.assertEqual(response.status_code, 500)

    def test_connectTest_data_source_no_rule(self):
        """ data_source no rule """
        dsm_dao.hiveConnectTest = mock.Mock(return_value=None)
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'data_source': 'no_rule', 'ds_address': '192.168.0.1', 'ds_id': 1,
                                                'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                                'ds_path': 'anydata', 'vhost': '', 'queue': ''})
                               )
        self.assertEqual(response.status_code, 400)


class TestDsopt(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/ds'
        self.addParams = json.dumps({'dsname': 'dsname', 'data_source': 'as', 'ds_address': '192.168.0.1',
                                     'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                     'ds_path': 'anydata', 'extract_type': 'standardExtraction', 'vhost': '',
                                     'queue': '', 'dataType': 'structured', 'json_schema': '', 'knw_id': 1}
                                    )
        self.getAllParams = {'page': 1, 'size': 5, 'order': 'ascend', 'knw_id': 1}

    def test_dsopt_add_success(self):
        """ success """
        my_mock = mock.Mock(return_value=(200, {'res': 'insert'}, 1))
        with mock.patch('service.dsm_Service.dsm_service.addds', my_mock):
            response = client.post(self.url,
                                   headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                                   data=self.addParams
                                   )
        self.assertEqual(response.status_code, 200)

    def test_dsopt_add_failed1(self):
        """ params err """
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({'dsname': 'dsname', 'data_source': 'ad', 'ds_address': '192.168.0.1',
                                                'ds_port': 'abc', 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                                'ds_path': 'anydata', 'extract_type': 'standardExtraction', 'vhost': '',
                                                'queue': '', 'dataType': 'structured', 'json_schema': '',
                                                'knw_id': '1a'})
                               )
        self.assertEqual(response.status_code, 400)

    def test_dsopt_add_failed2(self):
        """ service exception """
        my_mock = mock.Mock(
            return_value=(500, {"ErrorCode": "Builder.service.dsm_Service.DsmService.addds.RequestError",
                                "Description": "you have an error in your SQL!",
                                "Solution": "err",
                                "ErrorDetails": "insert fail",
                                "ErrorLink": ""}, -1)
        )
        with mock.patch('service.dsm_Service.dsm_service.addds', my_mock):
            response = client.post(self.url,
                                   headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                   data=self.addParams
                                   )
        self.assertEqual(response.status_code, 500)

    def test_dsopt_get_all_success1(self):
        """ data_source not empty success """
        my_mock = mock.Mock(return_value=(200, {}))
        with mock.patch('service.dsm_Service.dsm_service.getall', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.getAllParams
                                  )
        self.assertEqual(response.status_code, 200)

    def test_dsopt_get_all_success2(self):
        """ data_source empty success """
        my_mock = mock.Mock(return_value=(200, {}))
        with mock.patch('service.dsm_Service.dsm_service.getall', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.getAllParams
                                  )
        self.assertEqual(response.status_code, 200)

    def test_dsopt_get_all_failed1(self):
        """ params err """
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={'page': 'abc', 'size': 'abc', 'order': 123, 'knw_id': 'abc'}
                              )
        self.assertEqual(response.status_code, 400)

    def test_dsopt_get_all_failed2(self):
        """ service exception """
        my_mock = mock.Mock(return_value=(500, {'cause': 'you have an error in your SQL!',
                                                'code': 'Builder.service.dsm_Service.DsmService.getall.RequestError',
                                                'message': 'insert connection fail'}))
        with mock.patch('service.dsm_Service.dsm_service.getall', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.getAllParams
                                  )
        self.assertEqual(response.status_code, 500)


class TestDs(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/ds/1'
        self.dsParams = json.dumps({'dsname': 'dsname', 'data_source': 'as', 'ds_address': '192.168.0.1',
                                    'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                    'ds_path': 'anydata', 'extract_type': 'standardExtraction', 'vhost': '',
                                    'queue': '', 'dataType': 'structured', 'json_schema': ''}
                                   )

    def test_ds_success(self):
        """ success """
        my_mock = mock.Mock(return_value=(200, {'res': 'update dsId'}))
        with mock.patch('service.dsm_Service.dsm_service.update', my_mock):
            response = client.put(self.url,
                                  headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                                  data=self.dsParams)
        self.assertEqual(response.status_code, 200)

    def test_ds_failed1(self):
        """ params err """
        response = client.put(self.url,
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                              data=json.dumps(
                                  {'dsname': 'dsname', 'data_source': 'no_rule', 'ds_address': '192.168.0.1',
                                   'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                   'ds_path': 'anydata', 'extract_type': 'standardExtraction', 'vhost': '',
                                   'queue': '', 'dataType': 'structured', 'json_schema': ''})
                              )
        self.assertEqual(response.status_code, 400)

    def test_ds_failed2(self):
        """ service exception """
        my_mock = mock.Mock(return_value=(500, {'cause': 'you have an error in your SQL',
                                                'code': CommonResponseStatus.USRPASS_ERROR.value,
                                                'message': 'update  fail'}))
        with mock.patch('service.dsm_Service.dsm_service.update', my_mock):
            response = client.put(self.url,
                                  headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                                  data=self.dsParams)
        self.assertEqual(response.status_code, 500)


class TestDelds(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/ds/delbydsids'
        self.deldsParams = json.dumps({'dsids': [1, 2, 3, 4]})

    def test_delds_success(self):
        """ success """
        my_mock = mock.Mock(return_value=(200, {'res': 'success delete dsids'}))
        with mock.patch('service.dsm_Service.dsm_service.delete', my_mock):
            response = client.delete(self.url,
                                     headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                                     data=self.deldsParams)
        self.assertEqual(response.status_code, 200)

    def test_delds_failed1(self):
        """ params err """
        response = client.delete(self.url,
                                 headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                                 data=json.dumps({'dsids': ['abc']}))
        self.assertEqual(response.status_code, 400)

    def test_del_failed2(self):
        """ service exception """
        my_mock = mock.Mock(return_value=(500, {'cause': 'you have an error in your SQL!',
                                                'code': CommonResponseStatus.REQUEST_ERROR.value,
                                                'message': 'delete failed'}))
        with mock.patch('service.dsm_Service.dsm_service.delete', my_mock):
            response = client.delete(self.url,
                                     headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                                     data=self.deldsParams)
        self.assertEqual(response.status_code, 500)


class TestGetByDsName(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/ds/searchbyname'
        self.getByDsNameParams = {'dsname': 'dsname', 'page': 1, 'size': 5, 'order': 'ascend', 'knw_id': 1}

    def test_getbydsname_success1(self):
        """ data_source not empty success """
        my_mock = mock.Mock(return_value=(200, {}))
        with mock.patch('service.dsm_Service.dsm_service.getbydsname', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.getByDsNameParams)
        self.assertEqual(response.status_code, 200)

    def test_getbydsname_success2(self):
        """ data_source empty success """
        my_mock = mock.Mock(return_value=(200, {}))
        with mock.patch('service.dsm_Service.dsm_service.getbydsname', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.getByDsNameParams)
        self.assertEqual(response.status_code, 200)

    def test_getbydsname_failed1(self):
        """ params err """
        response = client.get(self.url,
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={'dsname': 12, 'page': 'ab', 'size': 'ab', 'order': 'c', 'knw_id': 'abc'})
        self.assertEqual(response.status_code, 400)

    def test_getbydsname_failed2(self):
        """ service exception"""
        my_mock = mock.Mock(return_value=(500, {'cause': 'you have an error in your SQL!',
                                                'code': 'Builder.service.dsm_Service.DsmService.getbydsname.RequestError',
                                                'message': 'query datasource fail'})
                            )
        with mock.patch('service.dsm_Service.dsm_service.getbydsname', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.getByDsNameParams)
        self.assertEqual(response.status_code, 500)


class TestGetAcctokenById(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/ds/acctoken/1'

    def test_get_acctoken_by_id_success(self):
        """ success """
        graph_dao.getDs_authById = mock.Mock(return_value=pd.DataFrame([[1]], columns=['ds_auth']))
        my_mock = mock.Mock(return_value=(
            200, "cqLusY9-z8xtPwKFlVc97skW-fdqJLXzpLQeCRsKzug.M8aU3w8zBj4epqSYSf8netY6JC9XGVQIszh2aHCE1SI"))
        with mock.patch('third_party_service.anyshare.token.asToken.get_token', my_mock):
            response = client.get(self.url, headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 200)

    def test_get_acctoken_by_id_failed1(self):
        """ params err """
        response = client.get('/api/builder/v1/ds/acctoken/param',
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 400)

    def test_get_acctoken_by_id_failed2(self):
        """ ds_id not exist """
        graph_dao.getDs_authById = mock.Mock(return_value=pd.DataFrame([], columns=['ds_auth']))
        response = client.get(self.url, headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 500)


class TestDsCopy(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/ds/ds_copy/1'
        self.copyParams = json.dumps({'dsname': 'dsname', 'data_source': 'as', 'ds_address': '192.168.0.1',
                                      'ds_port': 5555, 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                      'ds_path': 'anydata', 'extract_type': 'standardExtraction', 'vhost': '',
                                      'queue': '', 'dataType': 'structured', 'json_schema': '', 'knw_id': 1}
                                     )

    def test_ds_copy_success(self):
        """ success """
        dsm_dao.getbyid = mock.Mock(return_value=pd.DataFrame([[1]], columns=['id']))
        my_mock = mock.Mock(return_value=(200, {'res': 'insert'}, 1))
        with mock.patch('service.dsm_Service.dsm_service.addds', my_mock):
            response = client.post(self.url,
                                   headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac191002'},
                                   data=self.copyParams)
        self.assertEqual(response.status_code, 200)

    def test_ds_copy_failed1(self):
        """ params err """
        response = client.post(self.url,
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac191002'},
                               data=json.dumps({'dsname': 123, 'data_source': 'as', 'ds_address': '192.168.0.1',
                                                'ds_port': 'abc', 'ds_user': 'admin', 'ds_password': 'ZWlzb28uY29tMTIz',
                                                'ds_path': 'anydata', 'extract_type': 'standardExtraction', 'vhost': '',
                                                'queue': '', 'dataType': 'structured', 'json_schema': '', 'knw_id': 1})
                               )
        self.assertEqual(response.status_code, 400)

    def test_ds_copy_failed2(self):
        """ ds_id not int """
        response = client.post('/api/builder/v1/ds/ds_copy/ds_id',
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac191002'},
                               data=self.copyParams)
        self.assertEqual(response.status_code, 400)

    def test_ds_copy_failed3(self):
        """ ds_id not exist """
        dsm_dao.getbyid = mock.Mock(return_value=pd.DataFrame([], columns=['id']))
        response = client.post('/api/builder/v1/ds/ds_copy/1',
                               headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac191002'},
                               data=self.copyParams)
        self.assertEqual(response.status_code, 400)

    def test_ds_copy_failed4(self):
        """ service exception """
        dsm_dao.getbyid = mock.Mock(return_value=pd.DataFrame([[1]], columns=['id']))
        my_mock = mock.Mock(
            return_value=(500, {'ErrorCode': 'Builder.service.dsm_Service.DsmService.addds.RequestError',
                                'Description': 'you have an error in your SQL!',
                                'Solution': 'exception err',
                                'ErrorDetails': 'insert fail',
                                'ErrorLink': ''}, -1))
        with mock.patch('service.dsm_Service.dsm_service.addds', my_mock):
            response = client.post(self.url,
                                   headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac191002'},
                                   data=self.copyParams)
        self.assertEqual(response.status_code, 500)


if __name__ == '__main__':
    unittest.main()

# -*- coding:utf-8 -*-
from unittest import TestCase, mock
from main.builder_app import app
from utils.ds_check_parameters import dsCheckParameters
from utils.celery_check_params_json import celery_check_params
from service.task_Service import task_service
from service.graph_Service import graph_Service
from test import MockResponse
import requests
from common.errorcode import codes

client = app.test_client()

class TestExecuteTask(TestCase):
    def setUp(self):
        self.url = '/api/builder/v1/task/1'
        self.data = {'tasktype': 'full'}
        self.origin_dsCheckParameters_buildtaskbyidPar = dsCheckParameters.buildtaskbyidPar
        dsCheckParameters.buildtaskbyidPar = mock.Mock(return_value=(0, ""))
        self.origin_task_service_getgraphcountbyid = task_service.getgraphcountbyid
        task_service.getgraphcountbyid = mock.Mock(return_value=(200, {}))
        self.origin_graph_Service_get_DataSourceById = graph_Service.get_DataSourceById
        graph_Service.get_DataSourceById = mock.Mock(return_value=(0, {}))

    def tearDown(self) -> None:
        dsCheckParameters.buildtaskbyidPar = self.origin_dsCheckParameters_buildtaskbyidPar
        task_service.getgraphcountbyid = self.origin_task_service_getgraphcountbyid
        graph_Service.get_DataSourceById = self.origin_graph_Service_get_DataSourceById

    def test_execute_task_success(self):
        requests.request = mock.Mock(
            return_value=MockResponse(200,
                                      {"code": 200,
                                       "res": "8d1a0716-53c9-4476-bf9e-d9d8f9ba16a7 start running success"}))
        response = client.post(self.url, json=self.data)
        self.assertEqual(response.status_code, 200)

    def test_execute_task_fail1(self):
        """parameter error"""
        # graph_id is not digit
        url = '/api/builder/v1/task/aa'
        response = client.post(url, json=self.data)
        self.assertEqual(response.status_code, 400)
        # data is not json format
        response = client.post(self.url, data='{')
        self.assertEqual(response.status_code, 400)
        # data parameter error
        dsCheckParameters.buildtaskbyidPar = mock.Mock(
            return_value=(-1, "parameters tasktype must in ['full', 'increment']!"))
        response = client.post(self.url, json={"tasktype": "xxx"})
        self.assertEqual(response.status_code, 400)

    def test_execute_task_fail2(self):
        """graph id not exist"""
        task_service.getgraphcountbyid = mock.Mock(
            return_value=(500,
                          {'cause': 'graph not exist',
                           'code': 500021,
                           'message': 'graph not exist',
                           'solution': 'Please use valid graph_id'}))
        response = client.post(self.url, json=self.data)
        self.assertEqual(response.status_code, 500)

    def test_execute_task_fail3(self):
        """get trigger_type fail"""
        graph_Service.get_DataSourceById = mock.Mock(
            return_value=(-1,
                          {'cause': 'error',
                            'code': 500,
                            'message': 'error'}))
        response = client.post(self.url, json=self.data)
        self.assertEqual(response.status_code, 500)

    def test_execute_task_fail4(self):
        """service fail"""
        requests.request = mock.Mock(
            return_value=MockResponse(500, {"code": 500,
                                             'cause': 'error',
                                             'message': 'error'}))
        response = client.post(self.url, json=self.data)
        self.assertEqual(response.status_code, 500)


class TestBatchExecuteTask(TestCase):
    def setUp(self):
        self.url = '/api/builder/v1/task/batch/1'
        self.data = {'subgraph_ids': [1, 2], 'write_mode': 'skip'}
        self.origin_celery_check_params_batch_build = celery_check_params.batch_build
        celery_check_params.batch_build = mock.Mock(return_value=(0, ''))
        self.origin_task_service_getgraphcountbyid = task_service.getgraphcountbyid
        task_service.getgraphcountbyid = mock.Mock(return_value=(200, {}))

    def tearDown(self) -> None:
        task_service.getgraphcountbyid = self.origin_task_service_getgraphcountbyid
        celery_check_params.batch_build = self.origin_celery_check_params_batch_build

    def test_batch_execute_task_success(self):
        requests.request = mock.Mock(
            return_value=MockResponse(200,
                                      {"code": 200,
                                       "res": "8d1a0716-53c9-4476-bf9e-d9d8f9ba16a7 start running success"}))
        response = client.post(self.url, json=self.data)
        self.assertEqual(response.status_code, 200)

    def test_batch_execute_task_fail1(self):
        """parameter error"""
        # graph_id is not digit
        url = '/api/builder/v1/task/batch/a'
        response = client.post(url, json=self.data)
        self.assertEqual(response.status_code, 400)
        # data is not json format
        response = client.post(self.url, data="{")
        self.assertEqual(response.status_code, 400)
        # data parameter invalid
        celery_check_params.batch_build = mock.Mock(return_value=(-1, 'subgraph_ids cannot be empty.'))
        response = client.post(self.url, json={})
        self.assertEqual(response.status_code, 400)

    def test_batch_execute_task_fail2(self):
        """graph id not exist"""
        task_service.getgraphcountbyid = mock.Mock(
            return_value=(500,
                          {'cause': 'graph not exist',
                           'code': 500021,
                           'message': 'graph not exist',
                           'solution': 'Please use valid graph_id'}))
        response = client.post(self.url, json=self.data)
        self.assertEqual(response.status_code, 500)

    def test_batch_execute_task_fail3(self):
        """unknown error"""
        requests.request = mock.Mock(side_effect=Exception('error'))
        response = client.post(self.url, json=self.data)
        self.assertEqual(response.status_code, 500)


class TestDeleteTask(TestCase):
    def setUp(self):
        self.url = '/api/builder/v1/task/delete/1'
        self.data = {'task_ids': [1, 2]}
        self.origin_dsCheckParameters_deletetaskbyidPar = dsCheckParameters.deletetaskbyidPar
        dsCheckParameters.deletetaskbyidPar = mock.Mock(return_value=(0, ''))
        self.origin_task_service_getgraphcountbyid = task_service.getgraphcountbyid
        task_service.getgraphcountbyid = mock.Mock(return_value=(200, {}))

    def tearDown(self) -> None:
        dsCheckParameters.deletetaskbyidPar = self.origin_dsCheckParameters_deletetaskbyidPar
        task_service.getgraphcountbyid = self.origin_task_service_getgraphcountbyid

    def test_delete_task_success(self):
        requests.request = mock.Mock(
            return_value=MockResponse(200,
                                      {"code": 200,
                                       "res": 'delete task success'}))
        response = client.post(self.url, json=self.data)
        self.assertEqual(response.status_code, 200)

    def test_delete_task_fail1(self):
        """param error"""
        # graph id is not digit
        url = '/api/builder/v1/task/delete/a'
        response = client.post(url, json=self.data)
        self.assertEqual(response.status_code, 400)
        # data is not json format
        response = client.post(self.url, data='{')
        self.assertEqual(response.status_code, 400)
        # data parameter invalid
        dsCheckParameters.deletetaskbyidPar = mock.Mock(return_value=(-1, "parameters task_id must be list!"))
        response = client.post(self.url, json={"task_ids": 1})
        self.assertEqual(response.status_code, 400)

    def test_delete_task_fail2(self):
        """graph id not exist"""
        task_service.getgraphcountbyid = mock.Mock(
            return_value=(500,
                          {'cause': 'graph not exist',
                           'code': 500021,
                           'message': 'graph not exist',
                           'solution': 'Please use valid graph_id'}))
        response = client.post(self.url, json=self.data)
        self.assertEqual(response.status_code, 500)

    def test_delete_task_fail3(self):
        """unknown error"""
        requests.request = mock.Mock(side_effect=Exception('error'))
        response = client.post(self.url, json=self.data)
        self.assertEqual(response.status_code, 500)


class TestGetAllTask(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/task/1'
        self.param = {'page': 1, "size": 20, 'order': 'desc', 'status': 'all',
                      'graph_name': '', 'task_type': 'all', 'trigger_type': 'all'}
        self.origin_dsCheckParameters_searchtaskbynamePar = dsCheckParameters.searchtaskbynamePar
        dsCheckParameters.searchtaskbynamePar = mock.Mock(return_value=(0, ''))
        self.origin_task_service_getgraphcountbyid = task_service.getgraphcountbyid
        task_service.getgraphcountbyid = mock.Mock(return_value=(200, {}))

    def tearDown(self) -> None:
        dsCheckParameters.searchtaskbynamePar = self.origin_dsCheckParameters_searchtaskbynamePar
        task_service.getgraphcountbyid = self.origin_task_service_getgraphcountbyid

    def test_get_all_task_success(self):
        requests.request = mock.Mock(
            return_value=MockResponse(200,
                                      {"code": 200,
                                       "res": {}}))
        response = client.get(self.url, query_string=self.param)
        self.assertEqual(response.status_code, 200)

    def test_get_all_task_fail1(self):
        """param error"""
        # graph_id is not digit
        url = '/api/builder/v1/task/a'
        response = client.get(url, query_string=self.param)
        self.assertEqual(response.status_code, 400)
        # parameter invalid
        dsCheckParameters.searchtaskbynamePar = mock.Mock(
            return_value=(-1, 'parameters: page can not be empty !'))
        response = client.get(self.url, query_string=self.param)
        self.assertEqual(response.status_code, 400)

    def test_get_all_task_fail2(self):
        """graph id not exist"""
        task_service.getgraphcountbyid = mock.Mock(
            return_value=(500,
                          {'cause': 'graph not exist',
                           'code': 500021,
                           'message': 'graph not exist',
                           'solution': 'Please use valid graph_id'}))
        response = client.get(self.url, query_string=self.param)
        self.assertEqual(response.status_code, 500)

    def test_get_all_task_fail3(self):
        """unknown error"""
        requests.request = mock.Mock(side_effect=Exception('error'))
        response = client.get(self.url, query_string=self.param)
        self.assertEqual(response.status_code, 500)

class TestStopTask(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/task/stoptask'

    def test_stop_task_success(self):
        requests.request = mock.Mock(
            return_value=MockResponse(200,
                                      {"code": 200,
                                       "res": {}}))
        response = client.post(self.url, json={'graph_id': 1})
        self.assertEqual(response.status_code, 200)

    def test_stop_task_fail1(self):
        """param error"""
        # get parameter fail
        response = client.post(self.url, data='{')
        self.assertEqual(response.status_code, 400)
        # graph_id and task_id coexist
        response = client.post(self.url, json={'graph_id': 1, 'task_id': 1})
        self.assertEqual(response.status_code, 400)
        # graph_id is not int
        response = client.post(self.url, json={'graph_id': 'a'})
        self.assertEqual(response.status_code, 400)
        # graph_id is smaller than zero
        response = client.post(self.url, json={'graph_id': -1})
        self.assertEqual(response.status_code, 400)
        # task_id is not int
        response = client.post(self.url, json={'task_id': 'a'})
        self.assertEqual(response.status_code, 400)
        # task_id is smaller than zero
        response = client.post(self.url, json={'task_id': -1})
        self.assertEqual(response.status_code, 400)
        # missing parameter
        response = client.post(self.url, json={})
        self.assertEqual(response.status_code, 400)

    def test_stop_task_fail2(self):
        """unknown error"""
        requests.request = mock.Mock(side_effect=Exception('error'))
        response = client.post(self.url, json={'graph_id': 1})
        self.assertEqual(response.status_code, 500)


class TestGetProgress(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/task/get_progress/1'

    def tearDown(self) -> None:
        pass

    def test_get_progress_success(self):
        requests.request = mock.Mock(
            return_value=MockResponse(200,
                                      {"code": 200,
                                       "res": {}}))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_get_progress_fail1(self):
        """param error"""
        url = '/api/builder/v1/task/get_progress/a'
        response = client.get(url)
        self.assertEqual(response.status_code, 400)

    def test_get_progress_fail2(self):
        """unknown error"""
        requests.request = mock.Mock(side_effect=Exception('error'))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)

class TestHealth(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/task/health/ready'

    def test_health_success(self):
        requests.request = mock.Mock(
            return_value=MockResponse(200,
                                      {"code": 200,
                                       "res": {}}))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_health_fail1(self):
        requests.request = mock.Mock(
            return_value=MockResponse(500,
                                      {"code": 500,
                                       "res": {}}))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)

    def test_health_fail2(self):
        requests.request = mock.Mock(side_effect=Exception('error'))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)

class TestHealthAlive(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/task/health/alive'

    def test_health_alive_success(self):
        requests.request = mock.Mock(
            return_value=MockResponse(200,
                                      {"code": 200,
                                       "res": {}}))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_health_alive_fail1(self):
        requests.request = mock.Mock(
            return_value=MockResponse(500,
                                      {"code": 500,
                                       "res": {}}))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)

    def test_health_alive_fail2(self):
        requests.request = mock.Mock(side_effect=Exception('error'))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)

class TestGetSubgraphConfig(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/task/subgraph/1'
        self.origin_task_service_get_subgraph_config = task_service.get_subgraph_config

    def tearDown(self) -> None:
        task_service.get_subgraph_config = self.origin_task_service_get_subgraph_config

    def test_get_subgraph_config_success(self):
        task_service.get_subgraph_config = mock.Mock(
            return_value=(codes.successCode,
                          {}))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_get_subgraph_config_fail1(self):
        """unknown error"""
        task_service.get_subgraph_config = mock.Mock(side_effect=Exception('error'))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)

    def test_get_subgraph_config_fail2(self):
        """param error"""
        # task_id is not digit
        url = '/api/builder/v1/task/subgraph/s'
        response = client.get(url)
        self.assertEqual(response.status_code, 400)
        # task_id is 0
        url = '/api/builder/v1/task/subgraph/0'
        response = client.get(url)
        self.assertEqual(response.status_code, 400)

    def test_get_subgraph_config_fail3(self):
        task_service.get_subgraph_config = mock.Mock(
            return_value=(500,
                          {}))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)
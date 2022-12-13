from unittest import TestCase, mock

import pandas as pd

from common.errorcode import codes
from dao.task_dao import task_dao
from main.builder_app import app

client = app.test_client()


class TestGetSubgraphConfig(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/task/subgraph/1'
        self.get_task_config_rows = [[1, 'name', 1, 1, '[{"entity_id": 1}]', '[{"edge_id": 1}]']]
        self.get_task_config_colums = ['id', 'name', 'entity_num', 'edge_num', 'entity', 'edge']

    def test_get_subgraph_config_success(self):
        task_dao.get_task_config = mock.Mock(
            return_value=pd.DataFrame(self.get_task_config_rows, columns=self.get_task_config_colums))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_get_subgraph_config_failed1(self):
        """Builder_CeleryController_GetSubgraphConfig_ParamError"""
        response = client.get('/api/builder/v1/task/subgraph/abc')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_CeleryController_GetSubgraphConfig_ParamError)

    def test_get_subgraph_config_failed2(self):
        """Builder_CeleryController_GetSubgraphConfig_ParamError"""
        response = client.get('/api/builder/v1/task/subgraph/0')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_CeleryController_GetSubgraphConfig_ParamError)

    def test_get_subgraph_config_failed3(self):
        """Builder_TaskService_GetSubgraphConfig_TaskIdNotExist"""
        task_dao.get_task_config = mock.Mock(
            return_value=pd.DataFrame([], columns=self.get_task_config_colums))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_TaskService_GetSubgraphConfig_TaskIdNotExist)

    def test_get_subgraph_config_failed4(self):
        """Builder_CeleryController_GetSubgraphConfig_UnknownError"""
        task_dao.get_task_config = mock.Mock(side_effect=Exception('exception'))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_CeleryController_GetSubgraphConfig_UnknownError)

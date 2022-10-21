import json
import unittest
import datetime
from decimal import Decimal

import pandas as pd
from unittest import mock

import requests

from common.errorcode.gview import Gview
from dao.async_task_dao import async_task_dao
from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB
from dao.intelligence_dao import intelligence_dao
from dao.knw_dao import knw_dao
from service.graph_Service import graph_Service, GraphService
from service.intelligence_service import intelligence_calculate_service, intelligence_query_service
from test import MockResponse, MockNebulaResponse


class TestIntelligenceCalculateService(unittest.TestCase):

    @mock.patch('dao.graphdb_dao.GraphDB.__init__',
                mock.Mock(spec=['type', 'address', 'port', 'username', 'password'],
                          return_value=None))
    def setUp(self) -> None:
        # mock nebula
        self.graph_db_nebula = GraphDB(2)
        self.graph_db_nebula.type = 'nebula'
        self.graph_db_nebula.address = ['kg-orientdb']
        self.graph_db_nebula.port = ['9669']
        self.graph_db_nebula.username = 'orientdb'
        self.graph_db_nebula.password = 'orientdb'
        # mock GraphDB._nebula_exec
        self.origin_GraphDB_nebula_exec = GraphDB._nebula_exec
        res_nebula = pd.DataFrame([['name', 'string'],
                                   ['industry_name', 'string'],
                                   ['subindustry_name', 'string'],
                                   ['industry_level', 'string'],
                                   ['industry_status', 'string'],
                                   ['industry_id', 'string'],
                                   ['ds_id', 'string'],
                                   ['timestamp', 'double']])
        res_nebula = MockNebulaResponse(data=res_nebula)
        GraphDB._nebula_exec = mock.Mock(return_value=(200, res_nebula))

        # mock graph_detail
        self.graph_detail = {
            "graph_id": 12,
            "KDB_name": "KDB_name",
            "graph_db_id": 1,
            "knw_id": 3
        }
        self.real_entity_list = [{
            "space_id": "123456789",
            "otl_type": "edge",
            "name": "document",
            "total": 17
        }, {
            "space_id": "123456789",
            "otl_type": "entity",
            "name": "document",
            "total": 189
        }
        ]
        self.entity_quality_list = [
            {
                "space_id": "123456789",
                "otl_type": "edge",
                "name": "document",
                "total": 17,
                "empty": 10,
                "repeat": 0,
                "prop_number": 9

            },
            {
                "space_id": "123456789",
                "otl_type": "entity",
                "name": "document",
                "total": 189,
                "empty": 10,
                "repeat": 0,
                "prop_number": 9
            }
        ]

        # mock orientdb
        self.graphdb_orientdb = GraphDB(1)
        self.graphdb_orientdb.type = 'orientdb'
        self.graphdb_orientdb.address = ['kg-orientdb']
        self.graphdb_orientdb.port = ['2480']
        self.graphdb_orientdb.username = 'orientdb'
        self.graphdb_orientdb.password = 'orientdb'
        # mock requests.get
        self.origin_requests_get = requests.get
        resp_res = {
            'classes': [
                {'name': 'E', 'superClass': '', 'superClasses': [], 'alias': None, 'abstract': False,
                 'strictmode': False, 'clusters': [13, 14, 15, 16], 'defaultCluster': 13,
                 'clusterSelection': 'round-robin', 'records': 1053},
                {'name': 'V', 'superClass': '', 'superClasses': [], 'alias': None, 'abstract': False,
                 'strictmode': False, 'clusters': [9, 10, 11, 12], 'defaultCluster': 9,
                 'clusterSelection': 'round-robin', 'records': 242},
                {'name': 'industry_info', 'superClass': 'V', 'superClasses': ['V'], 'alias': None, 'abstract': False,
                 'strictmode': False, 'clusters': [17, 18, 19, 20], 'defaultCluster': 17,
                 'clusterSelection': 'round-robin', 'records': 5, 'properties': [
                    {'name': 'industry_status', 'type': 'STRING', 'mandatory': False, 'readonly': False,
                     'notNull': False, 'min': None, 'max': None, 'regexp': None, 'collate': 'default',
                     'defaultValue': None},
                    {'name': 'industry_id', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': 'industry_name', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': 'industry_level', 'type': 'STRING', 'mandatory': False, 'readonly': False,
                     'notNull': False, 'min': None, 'max': None, 'regexp': None, 'collate': 'default',
                     'defaultValue': None},
                    {'name': 'name', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': 'ds_id', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': 'timestamp', 'type': 'DOUBLE', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': 'subindustry_name', 'type': 'STRING', 'mandatory': False, 'readonly': False,
                     'notNull': False, 'min': None, 'max': None, 'regexp': None, 'collate': 'default',
                     'defaultValue': None}], 'indexes': [
                    {'name': 'industry_info_industry_name', 'type': 'UNIQUE_HASH_INDEX', 'fields': ['industry_name']},
                    {'name': 'industry_info_fulltext', 'type': 'FULLTEXT', 'fields': ['name']}]},
                {'name': 'sub_industry_info', 'superClass': 'V', 'superClasses': ['V'], 'alias': None,
                 'abstract': False, 'strictmode': False, 'clusters': [21, 22, 23, 24], 'defaultCluster': 21,
                 'clusterSelection': 'round-robin', 'records': 237, 'properties': [
                    {'name': 'industry_status', 'type': 'STRING', 'mandatory': False, 'readonly': False,
                     'notNull': False, 'min': None, 'max': None, 'regexp': None, 'collate': 'default',
                     'defaultValue': None},
                    {'name': 'industry_level', 'type': 'STRING', 'mandatory': False, 'readonly': False,
                     'notNull': False, 'min': None, 'max': None, 'regexp': None, 'collate': 'default',
                     'defaultValue': None},
                    {'name': 'name', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': 'sub_industry_id', 'type': 'STRING', 'mandatory': False, 'readonly': False,
                     'notNull': False, 'min': None, 'max': None, 'regexp': None, 'collate': 'default',
                     'defaultValue': None},
                    {'name': 'ds_id', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': 'subindustry_name', 'type': 'STRING', 'mandatory': False, 'readonly': False,
                     'notNull': False, 'min': None, 'max': None, 'regexp': None, 'collate': 'default',
                     'defaultValue': None},
                    {'name': 'timestamp', 'type': 'DOUBLE', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None}],
                 'indexes': [{'name': 'sub_industry_info_fulltext', 'type': 'FULLTEXT', 'fields': ['name']},
                             {'name': 'sub_industry_info_sub_industry_id', 'type': 'UNIQUE_HASH_INDEX',
                              'fields': ['sub_industry_id']}]},
                {'name': 'sub_industry_info_2_industry_info', 'superClass': 'E', 'superClasses': ['E'], 'alias': None,
                 'abstract': False, 'strictmode': False, 'clusters': [25, 26, 27, 28], 'defaultCluster': 25,
                 'clusterSelection': 'round-robin', 'records': 1053, 'properties': [
                    {'name': 'name', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': 'timestamp', 'type': 'DOUBLE', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None}],
                 'indexes': [
                     {'name': 'sub_industry_info_2_industry_info_fulltext', 'type': 'FULLTEXT', 'fields': ['name']}]}]
        }
        requests.get = mock.Mock(return_value=MockResponse(200, resp_res))

        self.intelligence_record = []
        self.successCode = 'success'

    def tearDown(self) -> None:
        pass

    @mock.patch("service.intelligence_service.IntelligenceCalculateService.calculate_graph_intelligence")
    def test_calculate_graph_intelligence(self, mock_bar):
        graph_id = 12
        graph_dao.get_graph_detail = mock.Mock(return_value=self.graph_detail)
        intelligence_query_service.query_real_entity_list = mock.Mock(return_value=self.real_entity_list)

        intelligence_calculate_service.entity_quality = mock.Mock(return_value=self.entity_quality_list[0])

        intelligence_calculate_service.calculate_graph_intelligence(graph_id)
        self.assertTrue(mock_bar.called)

    def test_entity_quality(self):
        GraphDB.graph_entity_prop_empty = mock.Mock(return_value=(200, 20))
        entity_quality_info = intelligence_calculate_service.entity_quality(self.graph_db_nebula,
                                                                            self.real_entity_list[0])
        self.assertIsNotNone(entity_quality_info)

    @mock.patch("service.intelligence_service.IntelligenceCalculateService.update_intelligence_info")
    def test_update_intelligence_info(self, mock_bar):
        graph_id_list = [1, 2, 3]
        requests.request = mock.Mock(return_value=MockResponse(200, {"res": "ok"}))
        intelligence_calculate_service.update_intelligence_info(graph_id_list)
        self.assertTrue(mock_bar.called)

    def test_send_task(self):
        graph_id = 13
        graph_info = {"status": 'normal', 'graphdb_type': 'nebula'}
        graph_Service.get_graph_info_basic = mock.Mock(return_value=(self.successCode, Gview.json_return(graph_info)))
        requests.request = mock.Mock(return_value=MockResponse(200, {"res": "9ce3efcd-f2eb-4cdf-aa59-52277fc62668"}))
        code, resp = intelligence_calculate_service.send_task(graph_id)
        self.assertEqual(code, 200)
        self.assertTrue(isinstance(resp, dict))


class TestIntelligenceQueryService(unittest.TestCase):

    def setUp(self) -> None:
        # mock nebula
        self.graph_db_nebula = GraphDB(2)
        self.graph_db_nebula.type = 'nebula'
        self.graph_db_nebula.address = ['kg-orientdb']
        self.graph_db_nebula.port = ['9669']
        self.graph_db_nebula.username = 'orientdb'
        self.graph_db_nebula.password = 'orientdb'

        self.graph_detail = {
            "graph_id": 12,
            "graph_name": "graph_name",
            "last_update_time": "2022-01-09 12:09:09",
            "graph_config_id": 12,
            "KDB_name": "KDB_name",
            "graph_db_id": 1,
            "knw_id": 3
        }
        self.graph_info_count = {
            'edge': [{
                "name": 'edge_1',
                "count": 5,
                "prop_number": 10
            }],
            'edge_count': 20,
            'entity': [{
                "name": 'entity_1',
                "count": 5,
                "prop_number": 10
            }],
            'entity_count': 15
        }
        self.task_record = [{
            "id": 1,
            "task_type": "intelligence",
            "task_status": "finished",
            "task_name": "intelligence-4",
            "celery_task_id": "9ce3efcd-f2eb-4cdf-aa59-52277fc62668",
            "relation_id": "4",
            "task_params": "{\"graph_id\": 4}",
            "result": None,
            "created_time": datetime.datetime(2022, 10, 19, 3, 18, 32),
            "finished_time": datetime.datetime(2022, 10, 19, 3, 18, 33),
        }]
        self.intelligence_record = [{
            "id": 56,
            "graph_id": 13,
            "knw_id": 3,
            "entity_knowledge": 168,
            "edge_knowledge": 20,
            "data_number": 20,
            "total_knowledge": 188,
            "empty_number": 61,
            "repeat_number": 0,
            "data_quality_score": 0.84,
            "update_time": datetime.datetime(2022, 10, 19, 20, 18, 15)
        }]
        self.successCode = 'success'

        self.graph_detail_list = [{'knw_id': 3, 'knw_name': 'gjk_test', 'knw_description': '', 'color': '#126EE3',
                                   'creation_time': '2022-09-28 14:36:37', 'update_time': '2022-10-21 15:21:10',
                                   'graph_id': 4, 'graph_config_id': 4, 'graph_name': '文档结构模型',
                                   'KDB_name': 'u16bb67533ef911ed9ba2040300000000', 'graph_db_id': 1,
                                   'graph_otl': '[4]', 'last_update_time': '2022-10-10 13:13:51'},
                                  {'knw_id': 3, 'knw_name': 'gjk_test', 'knw_description': '', 'color': '#126EE3',
                                   'creation_time': '2022-09-28 14:36:37', 'update_time': '2022-10-21 15:21:10',
                                   'graph_id': 13, 'graph_config_id': 13, 'graph_name': '空值test_orientdb',
                                   'KDB_name': 'u8237f094490a11ed8bca040300000000', 'graph_db_id': 2,
                                   'graph_otl': '[13]', 'last_update_time': '2022-10-11 11:25:51'},
                                  {'knw_id': 3, 'knw_name': 'gjk_test', 'knw_description': '', 'color': '#126EE3',
                                   'creation_time': '2022-09-28 14:36:37', 'update_time': '2022-10-21 15:21:10',
                                   'graph_id': 16, 'graph_config_id': 16, 'graph_name': '映射name',
                                   'KDB_name': 'u7863ae384f7b11ed9273040300000000', 'graph_db_id': 2,
                                   'graph_otl': '[19]', 'last_update_time': '2022-10-21 15:21:10'},
                                  {'knw_id': 3, 'knw_name': 'gjk_test', 'knw_description': '', 'color': '#126EE3',
                                   'creation_time': '2022-09-28 14:36:37', 'update_time': '2022-10-21 15:21:10',
                                   'graph_id': 33, 'graph_config_id': 33, 'graph_name': '结构化as测试',
                                   'KDB_name': 'u6f967d7f3ef911ed9ba2040300000000', 'graph_db_id': 1,
                                   'graph_otl': '[36]', 'last_update_time': '2022-10-20 09:19:51'},
                                  {'knw_id': 3, 'knw_name': 'gjk_test', 'knw_description': '', 'color': '#126EE3',
                                   'creation_time': '2022-09-28 14:36:37', 'update_time': '2022-10-21 15:21:10',
                                   'graph_id': 35, 'graph_config_id': 35, 'graph_name': '合同模型测试',
                                   'KDB_name': 'u890f1489486211ed8bca040300000000', 'graph_db_id': 1,
                                   'graph_otl': '[38]', 'last_update_time': '2022-10-20 14:34:10'}]

        self.graph_score_list = [
            {'graph_id': 16, 'graph_name': '映射name', 'id': 57, 'total_knowledge': 49, 'repeat_number': 0,
             'entity_knowledge': 49, 'edge_knowledge': 0, 'empty_number': 5, 'data_quality_score': Decimal('0.95'),
             'last_update_time': '2022-10-21 15:21:10', 'update_time_timestamp': Decimal('1666336870.000000'),
             'null_score': 0},
            {'graph_id': 35, 'graph_name': '合同模型测试', 'id': 55, 'total_knowledge': 132, 'repeat_number': 0,
             'entity_knowledge': 92, 'edge_knowledge': 40, 'empty_number': 43, 'data_quality_score': Decimal('0.84'),
             'last_update_time': '2022-10-20 14:34:10', 'update_time_timestamp': Decimal('1666247650.000000'),
             'null_score': 0},
            {'graph_id': 33, 'graph_name': '结构化as测试', 'id': None, 'total_knowledge': None, 'repeat_number': None,
             'entity_knowledge': None, 'edge_knowledge': None, 'empty_number': None, 'data_quality_score': None,
             'last_update_time': '2022-10-20 09:19:51', 'update_time_timestamp': Decimal('1666228791.000000'),
             'null_score': 1},
            {'graph_id': 13, 'graph_name': '空值test_orientdb', 'id': 56, 'total_knowledge': 188, 'repeat_number': 0,
             'entity_knowledge': 168, 'edge_knowledge': 20, 'empty_number': 61, 'data_quality_score': Decimal('0.84'),
             'last_update_time': '2022-10-11 11:25:51', 'update_time_timestamp': Decimal('1665458751.000000'),
             'null_score': 0},
            {'graph_id': 4, 'graph_name': '文档结构模型', 'id': 44, 'total_knowledge': 1627, 'repeat_number': 0,
             'entity_knowledge': 501, 'edge_knowledge': 1126, 'empty_number': 630,
             'data_quality_score': Decimal('0.81'), 'last_update_time': '2022-10-10 13:13:51',
             'update_time_timestamp': Decimal('1665378831.000000'), 'null_score': 0}]
        self.last_task_list = [
            {'id': 43, 'task_type': 'intelligence', 'task_status': 'finished', 'task_name': 'intelligence-13',
             'celery_task_id': '27343b6c-1141-4086-9b46-981150a819de', 'relation_id': '13',
             'task_params': '{"graph_id": 13}', 'result': None,
             'created_time': datetime.datetime(2022, 10, 20, 12, 5, 42),
             'finished_time': datetime.datetime(2022, 10, 20, 12, 5, 43)},
            {'id': 44, 'task_type': 'intelligence', 'task_status': 'finished', 'task_name': 'intelligence-4',
             'celery_task_id': '208434db-97e2-46eb-bcb4-10559e6340af', 'relation_id': '4',
             'task_params': '{"graph_id": 4}', 'result': None,
             'created_time': datetime.datetime(2022, 10, 20, 12, 5, 46),
             'finished_time': datetime.datetime(2022, 10, 20, 12, 5, 47)},
            {'id': 55, 'task_type': 'intelligence', 'task_status': 'redis wrong', 'task_name': 'intelligence-35',
             'celery_task_id': '33bb9a8a-7c26-4d8e-b0c7-740e01a31382', 'relation_id': '35',
             'task_params': '{"graph_id": "35"}', 'result': 'redis wrong',
             'created_time': datetime.datetime(2022, 10, 20, 14, 36, 28),
             'finished_time': datetime.datetime(2022, 10, 20, 14, 36, 29)},
            {'id': 57, 'task_type': 'intelligence', 'task_status': 'finished', 'task_name': 'intelligence-16',
             'celery_task_id': 'f7d45811-952c-4e2a-84aa-10805829ee51', 'relation_id': '16',
             'task_params': '{"graph_id": "16"}', 'result': None,
             'created_time': datetime.datetime(2022, 10, 21, 15, 20, 33),
             'finished_time': datetime.datetime(2022, 10, 21, 15, 20, 33)}]

    def tearDown(self) -> None:
        pass

    def test_query_graph_intelligence(self):
        graph_id = 13
        graph_dao.get_graph_detail = mock.Mock(return_value=self.graph_detail)
        graph_Service.get_graph_info_count = mock.Mock(
            return_value=('success', Gview.json_return(self.graph_info_count)))
        async_task_dao.query_latest_task = mock.Mock(return_value=self.task_record)
        intelligence_dao.query = mock.Mock(return_value=self.intelligence_record)
        code, resp = intelligence_query_service.query_graph_intelligence(graph_id)
        self.assertEqual(code, self.successCode)
        self.assertTrue(isinstance(resp, dict))

    def test_query_network_intelligence(self):
        query_params = dict()
        query_params['knw_id'] = 3
        query_params['graph_name'] = 'test_graph'
        query_params['size'] = 10
        query_params['page'] = 1
        query_params['rule'] = 'data_quality_score'
        query_params['order'] = 'desc'

        count_ret = pd.DataFrame([[0, 4], [1, 13], [2, 16], [3, 33], [4, 35]])
        knw_dao.get_graph_count = mock.Mock(return_value=count_ret)
        intelligence_query_service.query_graph_score_in_pages = mock.Mock(return_value=self.graph_score_list)
        graph_dao.get_graph_detail = mock.Mock(return_value=self.graph_detail_list)
        async_task_dao.query_latest_task = mock.Mock(return_value=self.last_task_list)

        code, resp = intelligence_query_service.query_network_intelligence(query_params)

        self.assertEqual(code, self.successCode)

    def test_query_real_entity_list(self):
        GraphDB.stats = mock.Mock(return_value=[])
        intelligence_query_service.query_graph_onto_info = mock.Mock(return_value=[])

        graph_id = 13
        space_id = '123456789'
        onto_list = intelligence_query_service.query_real_entity_list(self.graph_db_nebula, graph_id, space_id)
        self.assertTrue(len(onto_list) > 0)

    def test_query_network_param_check(self):
        query_params = dict()
        query_params['knw_id'] = 3
        query_params['graph_name'] = 'test_graph'
        query_params['size'] = 10
        query_params['page'] = 1
        query_params['rule'] = 'data_quality_score'
        query_params['order'] = 'desc'

        knw_dao.check_knw_id = mock.Mock(return_value=pd.DataFrame([[0, 3]]))
        code, resp = intelligence_query_service.query_network_param_check(query_params)
        self.assertEqual(code, self.successCode)

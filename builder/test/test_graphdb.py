# -*- coding:utf-8 -*-
import unittest
from unittest import mock
from dao.graphdb_dao import GraphDB
import requests
from test import MockResponse, MockNebulaResponse
from common.errorcode import codes
import pandas as pd


class TestGetProperties(unittest.TestCase):
    @mock.patch('dao.graphdb_dao.GraphDB.__init__',
                mock.Mock(spec=['type', 'address', 'port', 'username', 'password'],
                          return_value=None))
    def setUp(self):
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
                    {'name': '_ds_id_', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': '_timestamp_', 'type': 'integer', 'mandatory': False, 'readonly': False, 'notNull': False,
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
                    {'name': '_ds_id_', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': 'subindustry_name', 'type': 'STRING', 'mandatory': False, 'readonly': False,
                     'notNull': False, 'min': None, 'max': None, 'regexp': None, 'collate': 'default',
                     'defaultValue': None},
                    {'name': '_timestamp_', 'type': 'integer', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None}],
                 'indexes': [{'name': 'sub_industry_info_fulltext', 'type': 'FULLTEXT', 'fields': ['name']},
                             {'name': 'sub_industry_info_sub_industry_id', 'type': 'UNIQUE_HASH_INDEX',
                              'fields': ['sub_industry_id']}]},
                {'name': 'sub_industry_info_2_industry_info', 'superClass': 'E', 'superClasses': ['E'], 'alias': None,
                 'abstract': False, 'strictmode': False, 'clusters': [25, 26, 27, 28], 'defaultCluster': 25,
                 'clusterSelection': 'round-robin', 'records': 1053, 'properties': [
                    {'name': 'name', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': '_timestamp_', 'type': 'integer', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None}],
                 'indexes': [
                     {'name': 'sub_industry_info_2_industry_info_fulltext', 'type': 'FULLTEXT', 'fields': ['name']}]}]
        }
        requests.get = mock.Mock(return_value=MockResponse(200, resp_res))

        # mock nebula
        self.graphdb_nebula = GraphDB(2)
        self.graphdb_nebula.type = 'nebula'
        # mock GraphDB._nebula_exec
        self.origin_GraphDB_nebula_exec = GraphDB._nebula_exec
        res_nebula = pd.DataFrame([['name', 'string'],
                                   ['industry_name', 'string'],
                                   ['subindustry_name', 'string'],
                                   ['industry_level', 'string'],
                                   ['industry_status', 'string'],
                                   ['industry_id', 'string'],
                                   ['_ds_id_', 'string'],
                                   ['_timestamp_', 'integer']])
        res_nebula = MockNebulaResponse(data=res_nebula)
        GraphDB._nebula_exec = mock.Mock(return_value=(200, res_nebula))

    def tearDown(self) -> None:
        requests.get = self.origin_requests_get
        GraphDB._nebula_exec = self.origin_GraphDB_nebula_exec

    def test_get_properties_orientdb_success1(self):
        code, res = self.graphdb_orientdb.get_properties('dbname', 'entity', 'industry_info')
        self.assertEqual(code, codes.successCode)

    def test_get_properties_orientdb_success2(self):
        code, res = self.graphdb_orientdb.get_properties('dbname', 'edge', 'name')
        self.assertEqual(code, codes.successCode)

    def test_get_properties_orientdb_fail1(self):
        '''Builder_GraphdbDao_GetPropertiesOrientdb_OrientdbRequestError'''
        # orientdb返回不为200
        requests.get = mock.Mock(return_value=MockResponse(401, {'errors': 'errors'}))
        code, res = self.graphdb_orientdb.get_properties('dbname', 'entity', 'name')
        self.assertEqual(code, codes.Builder_GraphdbDao_GetPropertiesOrientdb_OrientdbRequestError)
        # orientdb返回不为200 + orientdb返回无法转为json
        requests.get = mock.Mock(return_value=MockResponse(401, mock.Mock(side_effect=Exception())))
        requests.get.json = mock.Mock(side_effect=Exception())
        code, res = self.graphdb_orientdb.get_properties('dbname', 'entity', 'name')
        self.assertEqual(code, codes.Builder_GraphdbDao_GetPropertiesOrientdb_OrientdbRequestError)
        # orientdb返回为200 + orientdb返回无法转为json
        requests.get = mock.Mock(return_value=MockResponse(200, mock.Mock(side_effect=Exception())))
        code, res = self.graphdb_orientdb.get_properties('dbname', 'entity', 'name')
        self.assertEqual(code, codes.Builder_GraphdbDao_GetPropertiesOrientdb_OrientdbRequestError)

    def test_get_properties_nebula_success1(self):
        code, res = self.graphdb_nebula.get_properties('dbname', 'entity', 'industry_info')
        self.assertEqual(code, codes.successCode)

    def test_get_properties_nebula_success2(self):
        '''dbname不存在 返回空'''
        res_nebula = MockNebulaResponse(error='Tag not existed!')
        GraphDB._nebula_exec = mock.Mock(return_value=(400, res_nebula))
        code, res = self.graphdb_nebula.get_properties('dbname', 'entity', 'industry_info')
        self.assertEqual(code, codes.successCode)

    def test_get_properties_nebula_fail1(self):
        '''Builder_GraphdbDao_GetPropertiesNebula_NebulaExecError'''
        res_nebula = MockNebulaResponse(error='error')
        GraphDB._nebula_exec = mock.Mock(return_value=(400, res_nebula))


class TestCount(unittest.TestCase):
    @mock.patch('dao.graphdb_dao.GraphDB.__init__',
                mock.Mock(spec=['type', 'address', 'port', 'username', 'password'],
                          return_value=None))
    def setUp(self) -> None:
        # mock GraphDB.get_list
        self.origin_GraphDB_get_list = GraphDB.get_list
        GraphDB.get_list = mock.Mock(return_value=['dbname'])

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
                    {'name': '_ds_id_', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': '_timestamp_', 'type': 'integer', 'mandatory': False, 'readonly': False, 'notNull': False,
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
                    {'name': '_ds_id_', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': 'subindustry_name', 'type': 'STRING', 'mandatory': False, 'readonly': False,
                     'notNull': False, 'min': None, 'max': None, 'regexp': None, 'collate': 'default',
                     'defaultValue': None},
                    {'name': '_timestamp_', 'type': 'integer', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None}],
                 'indexes': [{'name': 'sub_industry_info_fulltext', 'type': 'FULLTEXT', 'fields': ['name']},
                             {'name': 'sub_industry_info_sub_industry_id', 'type': 'UNIQUE_HASH_INDEX',
                              'fields': ['sub_industry_id']}]},
                {'name': 'sub_industry_info_2_industry_info', 'superClass': 'E', 'superClasses': ['E'], 'alias': None,
                 'abstract': False, 'strictmode': False, 'clusters': [25, 26, 27, 28], 'defaultCluster': 25,
                 'clusterSelection': 'round-robin', 'records': 1053, 'properties': [
                    {'name': 'name', 'type': 'STRING', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None},
                    {'name': '_timestamp_', 'type': 'integer', 'mandatory': False, 'readonly': False, 'notNull': False,
                     'min': None, 'max': None, 'regexp': None, 'collate': 'default', 'defaultValue': None}],
                 'indexes': [
                     {'name': 'sub_industry_info_2_industry_info_fulltext', 'type': 'FULLTEXT', 'fields': ['name']}]}]
        }
        requests.get = mock.Mock(return_value=MockResponse(200, resp_res))

        # mock nebula
        self.graphdb_nebula = GraphDB(2)
        self.graphdb_nebula.type = 'nebula'
        # mock GraphDB._nebula_exec
        self.origin_GraphDB_nebula_exec = GraphDB._nebula_exec
        self.res_stats = pd.DataFrame([['Tag', 'docComponent', 18],
                                       ['Tag', 'document', 8],
                                       ['Tag', 'label', 5],
                                       ['Tag', 'software', 1],
                                       ['Tag', 'version', 5],
                                       ['Edge', 'childChapter', 12],
                                       ['Edge', 'docComponentIs', 144],
                                       ['Edge', 'docComponentQuote', 0],
                                       ['Edge', 'docComponentText', 13],
                                       ['Edge', 'documentIs', 5],
                                       ['Edge', 'labelIs', 40],
                                       ['Edge', 'matchVersion', 5],
                                       ['Edge', 'quote', 0],
                                       ['Edge', 'upgradeVersionIs', 0],
                                       ['Edge', 'versionIS', 5],
                                       ['Space', 'vertices', 37],
                                       ['Space', 'edges', 224]])
        self.res_tag = pd.DataFrame([['name', 'string'],
                                     ['_ds_id_', 'string'],
                                     ['_timestamp_', 'integer']])
        self.res_edge = pd.DataFrame([['name', 'string'],
                                      ['_timestamp_', 'integer']])
        res_nebula_vals = {'show stats': (200, MockNebulaResponse(data=self.res_stats)),
                           'describe tag': (200, MockNebulaResponse(data=self.res_tag)),
                           'describe edge': (200, MockNebulaResponse(data=self.res_edge))}
        def res_nebula(ngql: str, db=None):
            for k, v in res_nebula_vals.items():
                if k in ngql.lower():
                    return v

        GraphDB._nebula_exec = mock.Mock(side_effect=res_nebula)

    def tearDown(self) -> None:
        GraphDB.get_list = self.origin_GraphDB_get_list
        requests.get = self.origin_requests_get
        GraphDB._nebula_exec = self.origin_GraphDB_nebula_exec

    def test_count_fail1(self):
        '''Builder_GraphdbDao_Count_GraphDBConnectionError'''
        GraphDB.get_list = mock.Mock(return_value=-1)
        code, res = self.graphdb_orientdb.count('dbname')
        self.assertEqual(code, codes.Builder_GraphdbDao_Count_GraphDBConnectionError)

    def test_count_fail2(self):
        '''Builder_GraphdbDao_Count_DBNameNotExitsError'''
        GraphDB.get_list = mock.Mock(return_value=['dbname'])
        code, res = self.graphdb_orientdb.count('not_exist')
        self.assertEqual(code, codes.Builder_GraphdbDao_Count_DBNameNotExitsError)

    def test_count_orientdb_success(self):
        code, res = self.graphdb_orientdb.count('dbname')
        self.assertEqual(code, codes.successCode)

    def test_count_orientdb_fail1(self):
        '''Builder_GraphdbDao_CountOrientdb_OrientdbRequestError'''
        # orientdb返回不为200
        requests.get = mock.Mock(return_value=MockResponse(401, {'errors': 'errors'}))
        code, res = self.graphdb_orientdb.count('dbname')
        self.assertEqual(code, codes.Builder_GraphdbDao_CountOrientdb_OrientdbRequestError)
        # orientdb返回为200 + orientdb返回无法转为json
        requests.get = mock.Mock(return_value=MockResponse(200, mock.Mock(side_effect=Exception())))
        code, res = self.graphdb_orientdb.count('dbname')
        self.assertEqual(code, codes.Builder_GraphdbDao_CountOrientdb_OrientdbRequestError)

    def test_count_nebula_success(self):
        code, res = self.graphdb_nebula.count('dbname')
        self.assertEqual(code, codes.successCode)

    def test_count_nebula_fail1(self):
        '''Builder_GraphdbDao_CountNebula_NebulaExecError'''

        def res_nebula(ngql: str, db=None):
            for k, v in res_nebula_vals.items():
                if k in ngql.lower():
                    return v

        # show stats 失败
        res_nebula_vals = {'show stats': (400, MockNebulaResponse(error='error')),
                           'describe tag': (200, MockNebulaResponse(data=self.res_tag)),
                           'describe edge': (200, MockNebulaResponse(data=self.res_edge))}
        GraphDB._nebula_exec = mock.Mock(side_effect=res_nebula)
        code, res = self.graphdb_nebula.count('dbname')
        self.assertEqual(code, codes.Builder_GraphdbDao_CountNebula_NebulaExecError)
        # describe tag 失败
        res_nebula_vals = {'show stats': (200, MockNebulaResponse(data=self.res_stats)),
                           'describe tag': (400, MockNebulaResponse(error='error')),
                           'describe edge': (200, MockNebulaResponse(data=self.res_edge))}
        GraphDB._nebula_exec = mock.Mock(side_effect=res_nebula)
        code, res = self.graphdb_nebula.count('dbname')
        self.assertEqual(code, codes.Builder_GraphdbDao_CountNebula_NebulaExecError)
        # describe tag 失败
        res_nebula_vals = {'show stats': (200, MockNebulaResponse(data=self.res_stats)),
                           'describe tag': (200, MockNebulaResponse(data=self.res_tag)),
                           'describe edge': (400, MockNebulaResponse(error='error'))}
        GraphDB._nebula_exec = mock.Mock(side_effect=res_nebula)
        code, res = self.graphdb_nebula.count('dbname')
        self.assertEqual(code, codes.Builder_GraphdbDao_CountNebula_NebulaExecError)

class TestCheckSchema(unittest.TestCase):
    @mock.patch('dao.graphdb_dao.GraphDB.__init__',
                mock.Mock(spec=['type', 'address', 'port', 'username', 'password'],
                          return_value=None))
    def setUp(self) -> None:
        # mock orientdb
        self.graphdb_orientdb = GraphDB(1)
        self.graphdb_orientdb.type = 'orientdb'
        self.graphdb_orientdb.address = ['kg-orientdb']
        self.graphdb_orientdb.port = ['2480']
        self.graphdb_orientdb.username = 'orientdb'
        self.graphdb_orientdb.password = 'orientdb'
        # mock GraphDB._get_properties_orientdb
        self.origin_GraphDB_get_properties_orientdb = GraphDB._get_properties_orientdb
        GraphDB._get_properties_orientdb = mock.Mock(return_value=(codes.successCode, {'name': 'string'}))

        # mock nebula
        self.graphdb_nebula = GraphDB(2)
        self.graphdb_nebula.type = 'nebula'
        # mock GraphDB._nebula_exec
        self.origin_GraphDB_nebula_exec = GraphDB._nebula_exec
        self.res_show = pd.DataFrame([['name']], columns=['Name'])
        self.res_describe = pd.DataFrame([['name', 'string']], columns=['Field', 'Type'])
        res_nebula_vals = {'show': (200, MockNebulaResponse(data=self.res_show)),
                           'describe': (200, MockNebulaResponse(data=self.res_describe))}
        def res_nebula(ngql: str, db=None):
            for k, v in res_nebula_vals.items():
                if k in ngql.lower():
                    return v

        GraphDB._nebula_exec = mock.Mock(side_effect=res_nebula)

    def tearDown(self) -> None:
        GraphDB._get_properties_orientdb = self.origin_GraphDB_get_properties_orientdb
        GraphDB._nebula_exec = self.origin_GraphDB_nebula_exec

    def test_check_schema_orientdb_success1(self):
        # schema存在
        code, res = self.graphdb_orientdb.check_schema('db', 'name', [], 'entity')
        self.assertEqual(code, codes.successCode)
        code, res = self.graphdb_orientdb.check_schema('db', 'name', [], 'edge')
        self.assertEqual(code, codes.successCode)
        # name不存在
        GraphDB._get_properties_orientdb = mock.Mock(return_value=(codes.successCode, {}))
        code, res = self.graphdb_orientdb.check_schema('db', 'name', [], 'edge')
        self.assertEqual(code, codes.successCode)

    def test_check_schema_orientdb_fail1(self):
        '''GraphDB._get_properties_orientdb失败'''
        GraphDB._get_properties_orientdb = mock.Mock(return_value=(codes.Builder_GraphdbDao_GetPropertiesOrientdb_OrientdbRequestError, {}))
        code, res = self.graphdb_orientdb.check_schema('db', 'name', [], 'entity')
        self.assertNotEqual(code, codes.successCode)

    def test_check_schema_nebula_success1(self):
        code, res = self.graphdb_nebula.check_schema('db', 'name', [], 'entity')
        self.assertEqual(code, codes.successCode)

    def test_check_schema_nebula_fail1(self):
        '''Builder_GraphdbDao_CheckSchemaNebula_NebulaExecError'''
        def res_nebula(ngql: str, db=None):
            for k, v in res_nebula_vals.items():
                if k in ngql.lower():
                    return v

        # show 失败
        res_nebula_vals = {'show': (400, MockNebulaResponse(error='error')),
                           'describe': (200, MockNebulaResponse(data=self.res_describe))}
        GraphDB._nebula_exec = mock.Mock(side_effect=res_nebula)
        code, res = self.graphdb_nebula.check_schema('db', 'name', [], 'entity')
        self.assertNotEqual(code, codes.successCode)
        # describe 失败
        res_nebula_vals = {'show': (200, MockNebulaResponse(data=self.res_show)),
                           'describe': (400, MockNebulaResponse(error='error'))}
        GraphDB._nebula_exec = mock.Mock(side_effect=res_nebula)
        code, res = self.graphdb_nebula.check_schema('db', 'name', [], 'entity')
        self.assertNotEqual(code, codes.successCode)

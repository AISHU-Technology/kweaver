# -*- coding:utf-8 -*-
import unittest
from unittest import mock
import pandas as pd
from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB
from dao.otl_dao import otl_dao
from service.graph_Service import graph_Service
from test import testApp
from common.errorcode import codes


class TestGetGraphInfoBasic(unittest.TestCase):
    def setUp(self):
        # 输入参数
        self.graphid = '118'
        self.is_all = False
        self.key = ["graph_des", "create_time", "update_time",
                    "display_task", "export", "is_import", "is_upload", "knowledge_type", "property_id",
                    "status", "step_num", "ds", "otl", "info_ext", "kmap", "kmerge", "mongo_name", "graphdb_name",
                    "graphdb_type", "graphdb_address", "graphdb_id"]
        # mock graph_dao.get_knowledge_graph_by_id
        self.res_get_knowledge_graph_by_id_column = ['id', 'KDB_ip', 'KDB_name', 'KG_config_id', 'KG_name', 'status',
                                                     'hlStart', 'hlEnd', 'create_time',
                                                     'update_time', 'graph_update_time', 'kg_data_volume']
        row = [[164, '10.4.133.125;10.4.131.18;10.4.131.25',
                'u4d1b761a01f811edb7079af371d61d07', 118, '1111', 'normal',
                '@-highlight-content-start-@', '@-highlight-content-end-@',
                '853ba1db-4e37-11eb-a57d-0242ac190002', '2022-07-12 23:36:03',
                '853ba1db-4e37-11eb-a57d-0242ac190002', '2022-07-13 13:11:41',
                '2022-07-13 11:29:15', 1]]
        res = pd.DataFrame(row, columns=self.res_get_knowledge_graph_by_id_column)
        graph_dao.get_knowledge_graph_by_id = mock.Mock(return_value=res)
        # mock graph_dao.getStatusById
        column = ['graph_id', 'task_status']
        row = [[118, 'normal']]
        res = pd.DataFrame(row, columns=column)
        graph_dao.getStatusById = mock.Mock(return_value=res)
        # mock graph_dao.getbyid
        column = ['id', 'create_time',  'update_time',
                  'graph_name', 'graph_status', 'graph_baseInfo', 'graph_ds', 'graph_otl',
                  'graph_otl_temp', 'graph_InfoExt', 'graph_KMap', 'graph_KMerge',
                  'rabbitmq_ds', 'graph_db_id', 'upload', 'step_num', 'is_upload']
        row = [[118, '2022-07-12 23:36:03',
               '2022-07-13 13:16:30',
                '1111', 'finish',
                "[{'graph_Name': '1111', 'graph_des': '', 'graph_db_id': 5, 'graphDBAddress': '10.4.133.125;10.4.131.18;10.4.131.25', 'graph_mongo_Name': 'mongoDB-118', 'graph_DBName': 'u4d1b761a01f811edb7079af371d61d07'}]",
                '[101]', '[250]', '[]',
                "[{'ds_name': 'ASToken通道测试_结构化2', 'ds_id': 101, 'data_source': 'as7', 'ds_path': '黄思祺(Alice)', 'file_source': 'gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/3D77695B9C1641398944920D7B6D921E', 'file_name': 'industry_info.csv', 'file_path': '黄思祺（Alice）/测试用例/industry_info.csv', 'file_type': 'file', 'extract_type': 'standardExtraction', 'extract_rules': [{'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'subindustry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_level', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_status', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_id', 'property_func': 'All'}}]}, {'ds_name': 'ASToken通道测试_结构化2', 'ds_id': 101, 'data_source': 'as7', 'ds_path': '黄思祺(Alice)', 'file_source': 'gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/66EDF458B6E54F53BDCD955EBEC88292', 'file_name': 'sub_industry_info.csv', 'file_path': '黄思祺（Alice）/测试用例/sub_industry_info.csv', 'file_type': 'file', 'extract_type': 'standardExtraction', 'extract_rules': [{'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'sub_industry_id', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'subindustry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'industry_level', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'industry_status', 'property_func': 'All'}}]}]",
                "[{'otls_map': [{'otl_name': 'industry_info', 'entity_type': 'industry_info', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'industry_name'}, {'otl_prop': 'industry_name', 'entity_prop': 'industry_name'}, {'otl_prop': 'subindustry_name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'industry_level', 'entity_prop': 'industry_level'}, {'otl_prop': 'industry_status', 'entity_prop': 'industry_status'}, {'otl_prop': 'industry_id', 'entity_prop': 'industry_id'}]}, {'otl_name': 'sub_industry_info', 'entity_type': 'sub_industry_info', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'sub_industry_id', 'entity_prop': 'sub_industry_id'}, {'otl_prop': 'subindustry_name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'industry_level', 'entity_prop': 'industry_level'}, {'otl_prop': 'industry_status', 'entity_prop': 'industry_status'}]}], 'relations_map': [{'relation_info': {'source_type': 'manual', 'model': '', 'begin_name': 'industry_info', 'edge_name': 'industry_info_2_sub_industry_info', 'end_name': 'sub_industry_info', 'entity_type': ''}, 'property_map': [{'edge_prop': 'name', 'entity_prop': ''}], 'relation_map': [{'begin_class_prop': 'subindustry_name', 'equation_begin': '', 'relation_begin_pro': '', 'equation': '被包含', 'relation_end_pro': '', 'equation_end': '', 'end_class_prop': 'subindustry_name'}]}]}]",
                "[{'status': True, 'entity_classes': [{'name': 'industry_info', 'properties': [{'function': 'equality', 'property': 'industry_name'}]}, {'name': 'sub_industry_info', 'properties': [{'property': 'sub_industry_id', 'function': 'equality'}]}]}]",
                0, 5, 0, 6, 0]]
        res = pd.DataFrame(row, columns=column)
        graph_dao.getbyid = mock.Mock(return_value=res)
        # mock graph_dao.getGraphDBNew
        self.res_getGraphDBNew_column = ['id', 'ip', 'port', 'user', 'password', 'version', 'type', 'db_user',
                                         'db_ps', 'db_port', 'name', 'created', 'updated', 'fulltext_id']
        row = [[5, '10.4.133.125;10.4.131.18;10.4.131.25', '9669;9669;9669',
                'root', 'MTIz', 0, 'nebula', 'root', 'MTIz', 0, 'nebula',
                '2022-07-12 15:04:22',
                '2022-07-12 15:04:22', 1]]
        res = pd.DataFrame(row, columns=self.res_getGraphDBNew_column)
        graph_dao.getGraphDBNew = mock.Mock(return_value=res)
        # mock graph_dao.get_upload_id
        column = ['gid']
        row = []
        res = pd.DataFrame(row, columns=column)
        graph_dao.get_upload_id = mock.Mock(return_value=res)

    def test_get_graph_info_basic_success1(self):
        code, res = graph_Service.get_graph_info_basic(self.graphid, self.is_all, self.key)
        self.assertEqual(code, codes.successCode)

    def test_get_graph_info_basic_success2(self):
        '''未输入key'''
        code, res = graph_Service.get_graph_info_basic(self.graphid, self.is_all, None)
        self.assertEqual(code, codes.successCode)

    def test_get_graph_info_basic_success2(self):
        '''is_all为True'''
        code, res = graph_Service.get_graph_info_basic(self.graphid, True, self.key)
        self.assertEqual(code, codes.successCode)

    def test_get_graph_info_basic_fail1(self):
        '''Builder.GraphService.GetGraphInfoBasic.GraphidNotExist'''
        res = pd.DataFrame([], columns=self.res_get_knowledge_graph_by_id_column)
        graph_dao.get_knowledge_graph_by_id = mock.Mock(return_value=res)
        code, res = graph_Service.get_graph_info_basic(self.graphid, self.is_all, self.key)
        self.assertEqual(code, codes.Builder_GraphService_GetGraphInfoBasic_GraphidNotExist)

    def test_get_graph_info_basic_fail2(self):
        '''Builder.GraphService.GetGraphInfoBasic.GraphDBIdNotExist'''
        res = pd.DataFrame([], columns=self.res_getGraphDBNew_column)
        graph_dao.getGraphDBNew = mock.Mock(return_value=res)
        code, res = graph_Service.get_graph_info_basic(self.graphid, self.is_all, self.key)
        self.assertEqual(code, codes.Builder_GraphService_GetGraphInfoBasic_GraphDBIdNotExist)

    def test_get_graph_info_basic_fail4(self):
        '''Builder.GraphService.GetGraphInfoBasic.UnsupportedKeyExist'''
        code, res = graph_Service.get_graph_info_basic(self.graphid, self.is_all, '["unsupported"]')
        self.assertEqual(code, codes.Builder_GraphService_GetGraphInfoBasic_UnsupportedKeyExist)


class TestGetGraphInfoOnto(unittest.TestCase):
    def setUp(self) -> None:
        # 输入参数
        self.graphid = 118
        # mock graph_dao.getbyid
        graph_dao.getbyid = mock.Mock
        self.res_graph_dao_getbyid_column = ['id', 'create_time', 'update_time',
                                             'graph_name', 'graph_status', 'graph_baseInfo', 'graph_ds', 'graph_otl',
                                             'graph_otl_temp', 'graph_InfoExt', 'graph_KMap', 'graph_KMerge',
                                             'rabbitmq_ds', 'graph_db_id', 'upload', 'step_num', 'is_upload']
        row = [[118,
                '2022-07-12 23:36:03',
                '2022-07-13 13:16:30', '1111', 'finish',
                "[{'graph_Name': '1111', 'graph_des': '', 'graph_db_id': 5, 'graphDBAddress': '10.4.133.125;10.4.131.18;10.4.131.25', 'graph_mongo_Name': 'mongoDB-118', 'graph_DBName': 'u4d1b761a01f811edb7079af371d61d07'}]",
                '[101]', '[250]', '[]',
                "[{'ds_name': 'ASToken通道测试_结构化2', 'ds_id': 101, 'data_source': 'as7', 'ds_path': '黄思祺(Alice)', 'file_source': 'gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/3D77695B9C1641398944920D7B6D921E', 'file_name': 'industry_info.csv', 'file_path': '黄思祺（Alice）/测试用例/industry_info.csv', 'file_type': 'file', 'extract_type': 'standardExtraction', 'extract_rules': [{'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'subindustry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_level', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_status', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_id', 'property_func': 'All'}}]}, {'ds_name': 'ASToken通道测试_结构化2', 'ds_id': 101, 'data_source': 'as7', 'ds_path': '黄思祺(Alice)', 'file_source': 'gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/66EDF458B6E54F53BDCD955EBEC88292', 'file_name': 'sub_industry_info.csv', 'file_path': '黄思祺（Alice）/测试用例/sub_industry_info.csv', 'file_type': 'file', 'extract_type': 'standardExtraction', 'extract_rules': [{'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'sub_industry_id', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'subindustry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'industry_level', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'industry_status', 'property_func': 'All'}}]}]",
                "[{'otls_map': [{'otl_name': 'industry_info', 'entity_type': 'industry_info', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'industry_name'}, {'otl_prop': 'industry_name', 'entity_prop': 'industry_name'}, {'otl_prop': 'subindustry_name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'industry_level', 'entity_prop': 'industry_level'}, {'otl_prop': 'industry_status', 'entity_prop': 'industry_status'}, {'otl_prop': 'industry_id', 'entity_prop': 'industry_id'}]}, {'otl_name': 'sub_industry_info', 'entity_type': 'sub_industry_info', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'sub_industry_id', 'entity_prop': 'sub_industry_id'}, {'otl_prop': 'subindustry_name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'industry_level', 'entity_prop': 'industry_level'}, {'otl_prop': 'industry_status', 'entity_prop': 'industry_status'}]}], 'relations_map': [{'relation_info': {'source_type': 'manual', 'model': '', 'begin_name': 'industry_info', 'edge_name': 'industry_info_2_sub_industry_info', 'end_name': 'sub_industry_info', 'entity_type': ''}, 'property_map': [{'edge_prop': 'name', 'entity_prop': ''}], 'relation_map': [{'begin_class_prop': 'subindustry_name', 'equation_begin': '', 'relation_begin_pro': '', 'equation': '被包含', 'relation_end_pro': '', 'equation_end': '', 'end_class_prop': 'subindustry_name'}]}]}]",
                "[{'status': True, 'entity_classes': [{'name': 'industry_info', 'properties': [{'function': 'equality', 'property': 'industry_name'}]}, {'name': 'sub_industry_info', 'properties': [{'property': 'sub_industry_id', 'function': 'equality'}]}]}]",
                0, 5, 0, 6, 0]]
        res = pd.DataFrame(row, columns=self.res_graph_dao_getbyid_column)
        graph_dao.getbyid = mock.Mock(return_value=res)
        # mock otl_dao.getbyid
        self.res_otl_dao_getbyid_column = ['id', 'create_time', 'update_time',
                                           'ontology_name', 'ontology_des', 'otl_status', 'entity', 'edge',
                                           'used_task', 'all_task']
        row = [[250,
                '2022-07-12 23:36:18',
                '2022-07-18 09:38:41', '11111', '', 'available',
                "[{'entity_id': 1, 'colour': '#5F81D8', 'ds_name': 'ASToken通道测试_结构化2', 'dataType': 'structured', 'data_source': 'as7', 'ds_path': '黄思祺(Alice)', 'ds_id': '101', 'extract_type': 'standardExtraction', 'name': 'industry_info', 'source_table': [['gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/3D77695B9C1641398944920D7B6D921E', 'industry_info.csv', '黄思祺（Alice）/测试用例/industry_info.csv']], 'source_type': 'automatic', 'properties': [['name', 'string'], ['industry_name', 'string'], ['subindustry_name', 'string'], ['industry_level', 'string'], ['industry_status', 'string'], ['industry_id', 'string']], 'file_type': 'csv', 'task_id': '18', 'properties_index': ['name'], 'model': '', 'ds_address': 'https://anyshare.aishu.cn', 'alias': 'industry_info'}, {'entity_id': 2, 'colour': '#D8707A', 'ds_name': 'ASToken通道测试_结构化2', 'dataType': 'structured', 'data_source': 'as7', 'ds_path': '黄思祺(Alice)', 'ds_id': '101', 'extract_type': 'standardExtraction', 'name': 'sub_industry_info', 'source_table': [['gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/66EDF458B6E54F53BDCD955EBEC88292', 'sub_industry_info.csv', '黄思祺（Alice）/测试用例/sub_industry_info.csv']], 'source_type': 'automatic', 'properties': [['name', 'string'], ['sub_industry_id', 'string'], ['subindustry_name', 'string'], ['industry_level', 'string'], ['industry_status', 'string']], 'file_type': 'csv', 'task_id': '19', 'properties_index': ['name'], 'model': '', 'ds_address': 'https://anyshare.aishu.cn', 'alias': 'sub_industry_info'}, {'entity_id': 3, 'colour': '#D8707A', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'ss', 'source_table': [], 'source_type': 'manual', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': '', 'ds_address': '', 'alias': 'ss'}]",
                "[{'edge_id': 1, 'colour': '#5F81D8', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_id': '', 'extract_type': '', 'name': 'industry_info_2_sub_industry_info', 'source_table': [], 'source_type': 'manual', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': '', 'relations': ['industry_info', 'industry_info_2_sub_industry_info', 'sub_industry_info'], 'ds_address': '', 'alias': 'industry_info_2_sub_industry_info'}, {'edge_id': 2, 'colour': '#5C539B', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_id': '', 'extract_type': '', 'name': 'ss_2_industry_info', 'source_table': [], 'source_type': 'manual', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': '', 'relations': ['ss', 'ss_2_industry_info', 'industry_info'], 'ds_address': '', 'alias': 'ss_2_industry_info'}]",
                '[18, 19]', '[18, 19]']]
        res = pd.DataFrame(row, columns=self.res_otl_dao_getbyid_column)
        otl_dao.getbyid = mock.Mock(return_value=res)

    def test_get_graph_info_onto_success(self):
        code, res = graph_Service.get_graph_info_onto(self.graphid)
        self.assertEqual(code, codes.successCode)

    def test_get_graph_info_onto_fail1(self):
        '''Builder.GraphService.GetGraphInfoOnto.GraphidNotExist'''
        res = pd.DataFrame([], columns=self.res_graph_dao_getbyid_column)
        graph_dao.getbyid = mock.Mock(return_value=res)
        code, res = graph_Service.get_graph_info_onto(self.graphid)
        self.assertEqual(code, codes.Builder_GraphService_GetGraphInfoOnto_GraphidNotExist)

    def test_get_graph_info_onto_fail2(self):
        '''Builder_GraphService_GetGraphInfoOnto_OtlidNotExist'''
        res = pd.DataFrame([], columns=self.res_otl_dao_getbyid_column)
        otl_dao.getbyid = mock.Mock(return_value=res)
        code, res = graph_Service.get_graph_info_onto(self.graphid)
        self.assertEqual(code, codes.Builder_GraphService_GetGraphInfoOnto_OtlidNotExist)


class TestGetGraphInfoCount(unittest.TestCase):
    def setUp(self) -> None:
        # 输入参数
        self.graphid = 118
        # mock graph_dao.getbyid
        graph_dao.getbyid = mock.Mock
        self.res_getbyid_column = ['id', 'create_time', 'update_time',
                                   'graph_name', 'graph_status', 'graph_baseInfo', 'graph_ds', 'graph_otl',
                                   'graph_otl_temp', 'graph_InfoExt', 'graph_KMap', 'graph_KMerge',
                                   'rabbitmq_ds', 'graph_db_id', 'upload', 'step_num', 'is_upload']
        row = [[118,
                '2022-07-12 23:36:03',
                '2022-07-13 13:16:30', '1111', 'finish',
                "[{'graph_Name': '1111', 'graph_des': '', 'graph_db_id': 5, 'graphDBAddress': '10.4.133.125;10.4.131.18;10.4.131.25', 'graph_mongo_Name': 'mongoDB-118', 'graph_DBName': 'u4d1b761a01f811edb7079af371d61d07'}]",
                '[101]', '[250]', '[]',
                "[{'ds_name': 'ASToken通道测试_结构化2', 'ds_id': 101, 'data_source': 'as7', 'ds_path': '黄思祺(Alice)', 'file_source': 'gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/3D77695B9C1641398944920D7B6D921E', 'file_name': 'industry_info.csv', 'file_path': '黄思祺（Alice）/测试用例/industry_info.csv', 'file_type': 'file', 'extract_type': 'standardExtraction', 'extract_rules': [{'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'subindustry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_level', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_status', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_id', 'property_func': 'All'}}]}, {'ds_name': 'ASToken通道测试_结构化2', 'ds_id': 101, 'data_source': 'as7', 'ds_path': '黄思祺(Alice)', 'file_source': 'gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/66EDF458B6E54F53BDCD955EBEC88292', 'file_name': 'sub_industry_info.csv', 'file_path': '黄思祺（Alice）/测试用例/sub_industry_info.csv', 'file_type': 'file', 'extract_type': 'standardExtraction', 'extract_rules': [{'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'sub_industry_id', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'subindustry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'industry_level', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'industry_status', 'property_func': 'All'}}]}]",
                "[{'otls_map': [{'otl_name': 'industry_info', 'entity_type': 'industry_info', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'industry_name'}, {'otl_prop': 'industry_name', 'entity_prop': 'industry_name'}, {'otl_prop': 'subindustry_name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'industry_level', 'entity_prop': 'industry_level'}, {'otl_prop': 'industry_status', 'entity_prop': 'industry_status'}, {'otl_prop': 'industry_id', 'entity_prop': 'industry_id'}]}, {'otl_name': 'sub_industry_info', 'entity_type': 'sub_industry_info', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'sub_industry_id', 'entity_prop': 'sub_industry_id'}, {'otl_prop': 'subindustry_name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'industry_level', 'entity_prop': 'industry_level'}, {'otl_prop': 'industry_status', 'entity_prop': 'industry_status'}]}], 'relations_map': [{'relation_info': {'source_type': 'manual', 'model': '', 'begin_name': 'industry_info', 'edge_name': 'industry_info_2_sub_industry_info', 'end_name': 'sub_industry_info', 'entity_type': ''}, 'property_map': [{'edge_prop': 'name', 'entity_prop': ''}], 'relation_map': [{'begin_class_prop': 'subindustry_name', 'equation_begin': '', 'relation_begin_pro': '', 'equation': '被包含', 'relation_end_pro': '', 'equation_end': '', 'end_class_prop': 'subindustry_name'}]}]}]",
                "[{'status': True, 'entity_classes': [{'name': 'industry_info', 'properties': [{'function': 'equality', 'property': 'industry_name'}]}, {'name': 'sub_industry_info', 'properties': [{'property': 'sub_industry_id', 'function': 'equality'}]}]}]",
                0, 5, 0, 6, 0]]
        res = pd.DataFrame(row, columns=self.res_getbyid_column)
        graph_dao.getbyid = mock.Mock(return_value=res)

    def test_get_graph_info_count_success(self):
        with mock.patch('dao.graphdb_dao.GraphDB.__init__') as init_mock:
            init_mock.return_value = None
            edge_count = 476
            entity_count = 266
            entitys_count = {'industry_info': 29, 'sub_industry_info': 237}
            edges_count = {'industry_info_2_sub_industry_info': 476}
            count_return = codes.successCode, (edge_count, entity_count, None, entitys_count, edges_count, None, None)
            origin_GraphDB_count = GraphDB.count
            GraphDB.count = mock.Mock(return_value=count_return)
            code, res = graph_Service.get_graph_info_count(self.graphid)
            self.assertEqual(code, codes.successCode)
            GraphDB.count = origin_GraphDB_count

    def test_get_graph_info_count_fail(self):
        '''Builder.GraphService.GetGraphInfoCount.GraphidNotExist'''
        res = pd.DataFrame([], columns=self.res_getbyid_column)
        graph_dao.getbyid = mock.Mock(return_value=res)
        code, res = graph_Service.get_graph_info_count(self.graphid)
        self.assertEqual(code, codes.Builder_GraphService_GetGraphInfoCount_GraphidNotExist)


class TestGetGraphInfoDetail(unittest.TestCase):
    def setUp(self) -> None:
        # 输入参数
        self.graphid = 118
        self.type = 'entity'
        self.name = 'industry_info'
        # mock graph_dao.getbyid
        self.res_getbyid_column = ['id', 'create_time', 'update_time',
                                   'graph_name', 'graph_status', 'graph_baseInfo', 'graph_ds', 'graph_otl',
                                   'graph_otl_temp', 'graph_InfoExt', 'graph_KMap', 'graph_KMerge',
                                   'rabbitmq_ds', 'graph_db_id', 'upload', 'step_num', 'is_upload']
        row = [[118,
                '2022-07-12 23:36:03',
                '2022-07-13 13:16:30', '1111', 'finish',
                "[{'graph_Name': '1111', 'graph_des': '', 'graph_db_id': 5, 'graphDBAddress': '10.4.133.125;10.4.131.18;10.4.131.25', 'graph_mongo_Name': 'mongoDB-118', 'graph_DBName': 'u4d1b761a01f811edb7079af371d61d07'}]",
                '[101]', '[250]', '[]',
                "[{'ds_name': 'ASToken通道测试_结构化2', 'ds_id': 101, 'data_source': 'as7', 'ds_path': '黄思祺(Alice)', 'file_source': 'gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/3D77695B9C1641398944920D7B6D921E', 'file_name': 'industry_info.csv', 'file_path': '黄思祺（Alice）/测试用例/industry_info.csv', 'file_type': 'file', 'extract_type': 'standardExtraction', 'extract_rules': [{'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'subindustry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_level', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_status', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'industry_info', 'property': {'property_field': 'industry_id', 'property_func': 'All'}}]}, {'ds_name': 'ASToken通道测试_结构化2', 'ds_id': 101, 'data_source': 'as7', 'ds_path': '黄思祺(Alice)', 'file_source': 'gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/66EDF458B6E54F53BDCD955EBEC88292', 'file_name': 'sub_industry_info.csv', 'file_path': '黄思祺（Alice）/测试用例/sub_industry_info.csv', 'file_type': 'file', 'extract_type': 'standardExtraction', 'extract_rules': [{'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'sub_industry_id', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'subindustry_name', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'industry_level', 'property_func': 'All'}}, {'is_model': 'not_model', 'entity_type': 'sub_industry_info', 'property': {'property_field': 'industry_status', 'property_func': 'All'}}]}]",
                "[{'otls_map': [{'otl_name': 'industry_info', 'entity_type': 'industry_info', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'industry_name'}, {'otl_prop': 'industry_name', 'entity_prop': 'industry_name'}, {'otl_prop': 'subindustry_name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'industry_level', 'entity_prop': 'industry_level'}, {'otl_prop': 'industry_status', 'entity_prop': 'industry_status'}, {'otl_prop': 'industry_id', 'entity_prop': 'industry_id'}]}, {'otl_name': 'sub_industry_info', 'entity_type': 'sub_industry_info', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'sub_industry_id', 'entity_prop': 'sub_industry_id'}, {'otl_prop': 'subindustry_name', 'entity_prop': 'subindustry_name'}, {'otl_prop': 'industry_level', 'entity_prop': 'industry_level'}, {'otl_prop': 'industry_status', 'entity_prop': 'industry_status'}]}], 'relations_map': [{'relation_info': {'source_type': 'manual', 'model': '', 'begin_name': 'industry_info', 'edge_name': 'industry_info_2_sub_industry_info', 'end_name': 'sub_industry_info', 'entity_type': ''}, 'property_map': [{'edge_prop': 'name', 'entity_prop': ''}], 'relation_map': [{'begin_class_prop': 'subindustry_name', 'equation_begin': '', 'relation_begin_pro': '', 'equation': '被包含', 'relation_end_pro': '', 'equation_end': '', 'end_class_prop': 'subindustry_name'}]}]}]",
                "[{'status': True, 'entity_classes': [{'name': 'industry_info', 'properties': [{'function': 'equality', 'property': 'industry_name'}]}, {'name': 'sub_industry_info', 'properties': [{'property': 'sub_industry_id', 'function': 'equality'}]}]}]",
                0, 5, 0, 6, 0]]
        res = pd.DataFrame(row, columns=self.res_getbyid_column)
        self.origin_graph_dao_getbyid = graph_dao.getbyid
        graph_dao.getbyid = mock.Mock(return_value=res)

    def tearDown(self) -> None:
        # 取消mock
        graph_dao.getbyid = self.origin_graph_dao_getbyid

    def test_get_graph_info_detail_success(self):
        with mock.patch('dao.graphdb_dao.GraphDB.__init__') as init_mock:
            init_mock.return_value = None
            GraphDB.type = mock.Mock('nebula')
            # mock GraphDB.check_schema
            origin_GraphDB_check_schema = GraphDB.check_schema
            GraphDB.check_schema = mock.Mock(return_value=(codes.successCode, True))
            # mock GraphDB.get_properties
            res_properties = {'name': 'string', 'industry_name': 'string', 'subindustry_name': 'string',
                              'industry_level': 'string', 'industry_status': 'string', 'industry_id': 'string',
                              'ds_id': 'string', 'timestamp': 'double'}
            origin_GraphDB_get_properties = GraphDB.get_properties
            GraphDB.get_properties = mock.Mock(return_value=(codes.successCode, res_properties))
            # mock GraphDB.get_present_index
            present_index_field = {'industry_info': ['name'], 'industry_info_2_sub_industry_info': ['name'],
                                   'sub_industry_info': ['name']}
            present_index_name = {'industry_info': 'u4d1b761a01f811edb7079af371d61d07_industry_info',
                                  'industry_info_2_sub_industry_info': 'u4d1b761a01f811edb7079af371d61d07_industry_info_2_sub_industry_info',
                                  'sub_industry_info': 'u4d1b761a01f811edb7079af371d61d07_sub_industry_info'}
            present_index_field_unique = {'industry_info': ['industry_name'], 'sub_industry_info': ['sub_industry_id'],
                                          'industry_info_2_sub_industry_info': ['name']}
            present_index_name_unique = {'industry_info': 'industry_info_industry_name',
                                         'sub_industry_info': 'sub_industry_info_sub_industry_id',
                                         'industry_info_2_sub_industry_info': 'industry_info_2_sub_industry_info_name'}
            res_index = (
                present_index_field, present_index_name, present_index_field_unique, present_index_name_unique)
            origin_GraphDB_get_present_index = GraphDB.get_present_index
            GraphDB.get_present_index = mock.Mock(return_value=(200, res_index))
            # 验证
            code, res = graph_Service.get_graph_info_detail(self.graphid, self.type, self.name)
            self.assertEqual(code, codes.successCode)
            # 取消mock
            GraphDB.check_schema = origin_GraphDB_check_schema
            GraphDB.get_properties = origin_GraphDB_get_properties
            GraphDB.get_present_index = origin_GraphDB_get_present_index

    def test_get_graph_info_detail_fail1(self):
        '''Builder_GraphService_GetGraphInfoDetail_GraphidNotExist'''
        res = pd.DataFrame([], columns=self.res_getbyid_column)
        graph_dao.getbyid = mock.Mock(return_value=res)
        code, res = graph_Service.get_graph_info_detail(self.graphid, self.type, self.name)
        self.assertEqual(code, codes.Builder_GraphService_GetGraphInfoDetail_GraphidNotExist)

    def test_get_graph_info_detail_fail2(self):
        '''graphdb执行失败'''
        with mock.patch('dao.graphdb_dao.GraphDB.__init__') as init_mock:
            init_mock.return_value = None
            GraphDB.type = mock.Mock('nebula')
            # mock GraphDB.check_schema
            origin_GraphDB_check_schema = GraphDB.check_schema
            GraphDB.check_schema = mock.Mock(return_value=(codes.successCode, True))
            # mock GraphDB.get_properties 失败
            origin_GraphDB_get_properties = GraphDB.get_properties
            GraphDB.get_properties = mock.Mock(
                return_value=(codes.Builder_GraphdbDao_GetPropertiesOrientdb_OrientdbRequestError, ()))
            # graphdb.get_properties失败
            code, res = graph_Service.get_graph_info_detail(self.graphid, self.type, self.name)
            self.assertNotEqual(code, codes.successCode)
            # graphdb.check_schema 失败
            GraphDB.check_schema = mock.Mock(
                return_value=(codes.Builder_GraphdbDao_CheckSchemaNebula_NebulaExecError, None))
            code, res = graph_Service.get_graph_info_detail(self.graphid, self.type, self.name)
            self.assertNotEqual(code, codes.successCode)
            # 取消mock
            GraphDB.check_schema = origin_GraphDB_check_schema
            GraphDB.get_properties = origin_GraphDB_get_properties

    def test_get_graph_info_detail_fail3(self):
        '''Builder_GraphService_GetGraphInfoDetail_NameNotExist'''
        with mock.patch('dao.graphdb_dao.GraphDB.__init__') as init_mock:
            init_mock.return_value = None
            GraphDB.type = mock.Mock('nebula')
            # mock GraphDB.check_schema
            origin_GraphDB_check_schema = GraphDB.check_schema
            GraphDB.check_schema = mock.Mock(return_value=(codes.successCode, False))
            # 验证
            code, res = graph_Service.get_graph_info_detail(self.graphid, self.type, self.name)
            self.assertNotEqual(code, codes.successCode)
            # 取消mock
            GraphDB.check_schema = origin_GraphDB_check_schema

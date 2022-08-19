# -*- coding: utf-8 -*-
# @Time : 2021/10/27 11:32
# @Author : jack.li
# @Email : jack.li@aishu.cn
# @File : test_subject.py
# @Project : builder
import unittest
import faiss
import pandas as pd
from unittest import mock
#from dao import subject_dao
#from dao.subject_dao import *
from utils.Gview import Gview
from common.errorcode import codes
#from controller import celery_controller_open_kc
#from controller.celery_controller_open_kc import check_params

query_res = {'res': {'id': 22, 'create_user': '853ba1db-4e37-11eb-a57d-0242ac190002', 'create_time': '2021-11-08 10:39:30', 'update_user': '853ba1db-4e37-11eb-a57d-0242ac190002', 'update_time': '2021-11-08 14:23:54', 'graph_name': 'lnn_test22', 'graph_status': 'finish', 'graph_baseInfo': [{'graph_Name': 'lnn_test22', 'graph_des': '', 'graph_DBName': 'lnn_test22', 'graphDBAddress': 'kg-orientdb', 'graph_mongo_Name': 'mongoDB_22'}], 'graph_ds': [{'create_user_email': '--', 'create_user_name': 'admin', 'update_user_email': '--', 'update_user_name': 'admin', 'id': 3, 'create_user': '853ba1db-4e37-11eb-a57d-0242ac190002', 'create_time': '2021-10-12 16:59:41', 'update_user': '853ba1db-4e37-11eb-a57d-0242ac190002', 'update_time': '2021-10-12 16:59:41', 'dsname': '133', 'dataType': 'unstructured', 'data_source': 'as7', 'ds_user': None, 'ds_password': None, 'ds_address': 'https://10.240.0.133', 'ds_port': 443, 'ds_path': 'dataset', 'extract_type': 'modelExtraction', 'ds_auth': '4'}], 'graph_otl': [{'id': 22, 'create_user': '853ba1db-4e37-11eb-a57d-0242ac190002', 'create_time': '2021-11-08 10:39:39', 'update_user': '853ba1db-4e37-11eb-a57d-0242ac190002', 'update_time': '2021-11-08 14:22:02', 'ontology_name': 'lnn_test22', 'ontology_des': '', 'otl_status': 'available', 'entity': [{'entity_id': 1, 'colour': '#F44336', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'folder', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['path', 'string'], ['gns', 'string'], ['create_time', 'string'], ['rev', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'path', 'gns', 'create_time', 'rev'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '目录'}, {'entity_id': 2, 'colour': '#F44336', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'document', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['path', 'string'], ['creator', 'string'], ['create_time', 'string'], ['editor', 'string'], ['gns', 'string'], ['file_type', 'string'], ['modified_time', 'string'], ['rev', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'path', 'creator', 'create_time', 'editor', 'gns', 'file_type', 'modified_time', 'rev'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '文档'}, {'entity_id': 3, 'colour': '#ED679F', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'chapter', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['path', 'string'], ['level', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'path', 'level'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '章节'}, {'entity_id': 4, 'colour': '#8BC34A', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'text', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '正文'}, {'entity_id': 5, 'colour': '#673AB8', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'label', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['confidence', 'float'], ['adlabel_kcid', 'string'], ['kc_topic_tags', 'string'], ['type_as', 'boolean'], ['type_sa', 'boolean'], ['type_nw', 'boolean'], ['type_kc', 'boolean']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'confidence', 'adlabel_kcid', 'kc_topic_tags', 'type_as', 'type_sa', 'type_nw', 'type_kc'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '标签'}, {'entity_id': 6, 'colour': '#00BDD4', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'desc', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '解释'}, {'entity_id': 7, 'colour': '#00BDD4', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'subject', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['subject_id', 'float'], ['subject_path', 'string'], ['subject_fold', 'string'], ['subject_desc', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'subject_id', 'subject_path', 'subject_fold', 'subject_desc'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '主题'}], 'edge': [{'edge_id': 1, 'colour': '#673AB8', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'desc2document', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'relations': ['desc', 'desc2document', 'document'], 'ds_address': '', 'alias': '出现于'}, {'edge_id': 2, 'colour': '#CDDC39', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'desc2label', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['weight', 'float']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'weight'], 'model': 'Anysharedocumentmodel', 'relations': ['desc', 'desc2label', 'label'], 'ds_address': '', 'alias': '解释是'}, {'edge_id': 3, 'colour': '#354675', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'folder2folder', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'relations': ['folder', 'folder2folder', 'folder'], 'ds_address': '', 'alias': '包含'}, {'edge_id': 4, 'colour': '#0288D1', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'folder2document', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'relations': ['folder', 'folder2document', 'document'], 'ds_address': '', 'alias': '包含'}, {'edge_id': 5, 'colour': '#00BDD4', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'document2chapter', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'relations': ['document', 'document2chapter', 'chapter'], 'ds_address': '', 'alias': '包含'}, {'edge_id': 6, 'colour': '#00BDD4', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'document2text', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'relations': ['document', 'document2text', 'text'], 'ds_address': '', 'alias': '包含'}, {'edge_id': 7, 'colour': '#B31ACC', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'text2text', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'relations': ['text', 'text2text', 'text'], 'ds_address': '', 'alias': 'A相关B'}, {'edge_id': 8, 'colour': '#795648', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'chapter2text', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'relations': ['chapter', 'chapter2text', 'text'], 'ds_address': '', 'alias': '内容是'}, {'edge_id': 9, 'colour': '#448AFF', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'label2label', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['weight', 'float']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'weight'], 'model': 'Anysharedocumentmodel', 'relations': ['label', 'label2label', 'label'], 'ds_address': '', 'alias': '关联'}, {'edge_id': 10, 'colour': '#B31ACC', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'label2document', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['weight', 'float']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'weight'], 'model': 'Anysharedocumentmodel', 'relations': ['label', 'label2document', 'document'], 'ds_address': '', 'alias': '出现于'}, {'edge_id': 11, 'colour': '#673AB8', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'label2subject', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'relations': ['label', 'label2subject', 'subject'], 'ds_address': '', 'alias': '关联'}, {'edge_id': 12, 'colour': '#673AB8', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'subject2document', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['score', 'float']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'score'], 'model': 'Anysharedocumentmodel', 'relations': ['subject', 'subject2document', 'document'], 'ds_address': '', 'alias': '关联'}], 'used_task': [], 'all_task': []}], 'graph_otl_temp': '[]', 'graph_InfoExt': [{'ds_name': '133', 'ds_id': 3, 'data_source': 'as7', 'ds_path': 'dataset', 'file_source': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3', 'file_name': '筑森', 'file_path': 'dataset/行业数据/筑森', 'extract_type': 'modelExtraction', 'extract_model': 'Anysharedocumentmodel', 'extract_rules': [{'is_model': 'from_model', 'entity_type': 'folder', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'folder', 'property': {'property_field': 'path', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'folder', 'property': {'property_field': 'gns', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'folder', 'property': {'property_field': 'create_time', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'folder', 'property': {'property_field': 'rev', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document', 'property': {'property_field': 'path', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document', 'property': {'property_field': 'creator', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document', 'property': {'property_field': 'create_time', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document', 'property': {'property_field': 'editor', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document', 'property': {'property_field': 'gns', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document', 'property': {'property_field': 'file_type', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document', 'property': {'property_field': 'modified_time', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document', 'property': {'property_field': 'rev', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'chapter', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'chapter', 'property': {'property_field': 'path', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'chapter', 'property': {'property_field': 'level', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'text', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label', 'property': {'property_field': 'confidence', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label', 'property': {'property_field': 'adlabel_kcid', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label', 'property': {'property_field': 'kc_topic_tags', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label', 'property': {'property_field': 'type_as', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label', 'property': {'property_field': 'type_sa', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label', 'property': {'property_field': 'type_nw', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label', 'property': {'property_field': 'type_kc', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'desc', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'subject', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'subject', 'property': {'property_field': 'subject_id', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'subject', 'property': {'property_field': 'subject_path', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'subject', 'property': {'property_field': 'subject_fold', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'subject', 'property': {'property_field': 'subject_desc', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'desc2document', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'desc2label', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'desc2label', 'property': {'property_field': 'weight', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document2text', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'text2text', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'document2chapter', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'folder2document', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'folder2folder', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'chapter2text', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label2label', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label2label', 'property': {'property_field': 'weight', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label2document', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label2document', 'property': {'property_field': 'weight', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'label2subject', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'subject2document', 'property': {'property_field': 'name', 'property_func': 'All'}}, {'is_model': 'from_model', 'entity_type': 'subject2document', 'property': {'property_field': 'score', 'property_func': 'All'}}]}], 'graph_KMap': [{'otls_map': [{'otl_name': 'folder', 'entity_type': 'folder', 'key_property': 'name', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'name'}, {'otl_prop': 'path', 'entity_prop': 'path'}, {'otl_prop': 'gns', 'entity_prop': 'gns'}, {'otl_prop': 'create_time', 'entity_prop': 'create_time'}, {'otl_prop': 'rev', 'entity_prop': 'rev'}]}, {'otl_name': 'document', 'entity_type': 'document', 'key_property': 'name', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'name'}, {'otl_prop': 'path', 'entity_prop': 'path'}, {'otl_prop': 'creator', 'entity_prop': 'creator'}, {'otl_prop': 'create_time', 'entity_prop': 'create_time'}, {'otl_prop': 'editor', 'entity_prop': 'editor'}, {'otl_prop': 'gns', 'entity_prop': 'gns'}, {'otl_prop': 'file_type', 'entity_prop': 'file_type'}, {'otl_prop': 'modified_time', 'entity_prop': 'modified_time'}, {'otl_prop': 'rev', 'entity_prop': 'rev'}]}, {'otl_name': 'chapter', 'entity_type': 'chapter', 'key_property': 'name', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'name'}, {'otl_prop': 'path', 'entity_prop': 'path'}, {'otl_prop': 'level', 'entity_prop': 'level'}]}, {'otl_name': 'text', 'entity_type': 'text', 'key_property': 'name', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'name'}]}, {'otl_name': 'label', 'entity_type': 'label', 'key_property': 'name', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'name'}, {'otl_prop': 'confidence', 'entity_prop': 'confidence'}, {'otl_prop': 'adlabel_kcid', 'entity_prop': 'adlabel_kcid'}, {'otl_prop': 'kc_topic_tags', 'entity_prop': 'kc_topic_tags'}, {'otl_prop': 'type_as', 'entity_prop': 'type_as'}, {'otl_prop': 'type_sa', 'entity_prop': 'type_sa'}, {'otl_prop': 'type_nw', 'entity_prop': 'type_nw'}, {'otl_prop': 'type_kc', 'entity_prop': 'type_kc'}]}, {'otl_name': 'desc', 'entity_type': 'desc', 'key_property': 'name', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'name'}]}, {'otl_name': 'subject', 'entity_type': 'subject', 'key_property': 'name', 'property_map': [{'otl_prop': 'name', 'entity_prop': 'name'}, {'otl_prop': 'subject_id', 'entity_prop': 'subject_id'}, {'otl_prop': 'subject_path', 'entity_prop': 'subject_path'}, {'otl_prop': 'subject_fold', 'entity_prop': 'subject_fold'}, {'otl_prop': 'subject_desc', 'entity_prop': 'subject_desc'}]}], 'relations_map': [{'relation_info': {'begin_name': 'desc', 'edge_name': 'desc2document', 'end_name': 'document', 'entity_type': 'desc2document', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'desc', 'edge_name': 'desc2label', 'end_name': 'label', 'entity_type': 'desc2label', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}, {'edge_prop': 'weight', 'entity_prop': 'weight'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'folder', 'edge_name': 'folder2folder', 'end_name': 'folder', 'entity_type': 'folder2folder', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'folder', 'edge_name': 'folder2document', 'end_name': 'document', 'entity_type': 'folder2document', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'document', 'edge_name': 'document2chapter', 'end_name': 'chapter', 'entity_type': 'document2chapter', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'document', 'edge_name': 'document2text', 'end_name': 'text', 'entity_type': 'document2text', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'text', 'edge_name': 'text2text', 'end_name': 'text', 'entity_type': 'text2text', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'chapter', 'edge_name': 'chapter2text', 'end_name': 'text', 'entity_type': 'chapter2text', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'label', 'edge_name': 'label2label', 'end_name': 'label', 'entity_type': 'label2label', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}, {'edge_prop': 'weight', 'entity_prop': 'weight'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'label', 'edge_name': 'label2document', 'end_name': 'document', 'entity_type': 'label2document', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}, {'edge_prop': 'weight', 'entity_prop': 'weight'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'label', 'edge_name': 'label2subject', 'end_name': 'subject', 'entity_type': 'label2subject', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}, {'relation_info': {'begin_name': 'subject', 'edge_name': 'subject2document', 'end_name': 'document', 'entity_type': 'subject2document', 'key_property': 'name'}, 'property_map': [{'edge_prop': 'name', 'entity_prop': 'name'}, {'edge_prop': 'score', 'entity_prop': 'score'}], 'relation_map': [{'Multi_relation': '文档结构关系', 'begin_prop': '', 'end_prop': '', 'edge_prop': ['', '']}]}]}], 'graph_KMerge': [{'status': True, 'entity_classes': [{'name': 'folder', 'properties': [{'property': 'gns', 'function': 'equality'}]}, {'name': 'document', 'properties': [{'property': 'gns', 'function': 'equality'}]}, {'name': 'chapter', 'properties': [{'property': 'name', 'function': 'equality'}, {'property': 'path', 'function': 'equality'}, {'property': 'level', 'function': 'equality'}]}, {'name': 'text', 'properties': [{'property': 'name', 'function': 'equality'}]}, {'name': 'label', 'properties': [{'property': 'name', 'function': 'equality'}, {'property': 'adlabel_kcid', 'function': 'equality'}]}, {'name': 'desc', 'properties': [{'property': 'name', 'function': 'equality'}]}, {'name': 'subject', 'properties': [{'property': 'name', 'function': 'equality'}]}]}], 'graph_used_ds': [{'id': 3, 'create_user': '853ba1db-4e37-11eb-a57d-0242ac190002', 'create_time': '2021-10-12 16:59:41', 'update_user': '853ba1db-4e37-11eb-a57d-0242ac190002', 'update_time': '2021-10-12 16:59:41', 'dsname': '133', 'dataType': 'unstructured', 'data_source': 'as7', 'ds_user': None, 'ds_password': None, 'ds_address': 'https://10.240.0.133', 'ds_port': 443, 'ds_path': 'dataset', 'extract_type': 'modelExtraction', 'ds_auth': '4'}]}}


class MockMongoCollection(object):
    def __init__(self):
        pass #EMPTY

    def aggregate(self, *args, **kwargs):
        return [{'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/943857D14DA44A869FB7E6D39D54351C/07C16A47AA2B4E7E94424BE58CFD70A1/F98E68F57A2542F581E6F4C7F88AB4EF/4112CFF8330B4166A1FF4FAAA45FE979/22FFDA6AD2E74C378D88531F85C2ABB7/0402371C11054859870F6A3BA4E4C8AD/03894C1267B44DDDA1CA43A145341AE2', 'slist': ['目录'], 'name': '41#.pdf'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/943857D14DA44A869FB7E6D39D54351C/07C16A47AA2B4E7E94424BE58CFD70A1/F98E68F57A2542F581E6F4C7F88AB4EF/4112CFF8330B4166A1FF4FAAA45FE979/22FFDA6AD2E74C378D88531F85C2ABB7/DB55BC66543A4832B39EAB4EBA7478CD', 'slist': ['IaK', 'KaE', 'KaU', 'IaQ', 'QaQ', 'JaO', 'GaW', 'JaE', 'IJa', 'KaW', 'DaA', 'HaI', 'GaI', 'JaQ', 'DaC', 'PM2', 'HaS', 'JaY', 'WIa', 'GJa', 'HaE', 'HaG', 'HaO', 'JaK', 'IaE', 'MaI', 'HaW', 'IaY', 'DaE', 'IaG'], 'name': 'ZP(套屋顶平面）20140403(方案)-布局.PLT'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/943857D14DA44A869FB7E6D39D54351C/07C16A47AA2B4E7E94424BE58CFD70A1/F98E68F57A2542F581E6F4C7F88AB4EF/4112CFF8330B4166A1FF4FAAA45FE979/22FFDA6AD2E74C378D88531F85C2ABB7/2D7AF58A9B724A6D95DBB6C35D9A57E5', 'slist': ['住宅', '高层建筑', '线规划', '期分析', '竖向规划', '范围线', '多层建筑', '日照分析图', '管线规划', '心景观', '中心景', '景观轴线', '系统规划', '用地范围', '分期分析', '高层建筑控制线', '用地', '中心景观轴线', '控制线', '景观轴', '中心景观', '一期用地', '用地分期分析', '用地范围线', '底层物管用', '缺日照', '组团景观轴线', '分析图', '套型分析', '绿地系统规划', '一期用地范围', '综合管线规划', '组团景观', '多层建筑控制线', '竖向规划图'], 'name': '05分析图.pdf'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/943857D14DA44A869FB7E6D39D54351C/07C16A47AA2B4E7E94424BE58CFD70A1/F98E68F57A2542F581E6F4C7F88AB4EF/744127F2E32141EEAE6A5ED4D1A11F38/3968F11620D54219A0F0DF701E69CF72/3182B9EC6AA04C60854568CA0C5181D8', 'slist': ['com', 'ttp', 'Pro', 'Int'], 'name': '土木铺.url'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/943857D14DA44A869FB7E6D39D54351C/07C16A47AA2B4E7E94424BE58CFD70A1/F98E68F57A2542F581E6F4C7F88AB4EF/744127F2E32141EEAE6A5ED4D1A11F38/3968F11620D54219A0F0DF701E69CF72/0AB404DE065C4CEBBF4CCA0155290C31', 'slist': ['搜索', '淘宝', '赠送设计资料', '可进入本店', '朋友圈赠送设计', '店铺新资料', '搜索店铺', '淘宝搜索店铺', '上架情况', '店铺', '微信号', '本店', '土木'], 'name': '更多资料.txt'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/2FB79C8D526B4DC9B35304CF99284BE4/563546A4632D4A7EA270C1A0573B7384/1FAF3A4770274E038E3BA5BED8A32B19/0B4901FEBC824294985AB49B97A55F63/550C57F802774187AA7D1230E49A57F5', 'slist': ['高层', '项目', '面积段', '主卧套房', '使用原则', '使用原', '扬州新城', '色金属', '武汉新洲', '交通核', '洋房产品', '适用范', '产品线', '产品特点', '面宽数', '真石漆', '立面库', '立入户', '洋房', '万达项目', '房产品', '型结构', '开间数', '独立入户', '非独立入户', '面积区间', '积区间', '房面积区间', '小高层', '户型库', '户型结构', '送方式', '立面导则', '赠送方式'], 'name': '《万达销售物业小高层、洋房产品线》V1.0培训文件.pptx'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/A0EB68F73F3545B9BE98D7D6A746B678/680706F06642455A957E02E5F0DA85E0/8E394930E41F4655AE8D1CA9C233803F/B2EE85E0730C4FB5BC4F3EA117FF9BB3/7DB56ADD1AE3428E82CFC8CAE028DBA6', 'slist': ['cad', 'aca'], 'name': 'acaddoc.lsp'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/943857D14DA44A869FB7E6D39D54351C/07C16A47AA2B4E7E94424BE58CFD70A1/CE74FFF05DE642EEB197ABA26550A6A3/570141C5991F422299171A038C98A233/8B1C2DE904E345469946F7FFB841F843', 'slist': ['地块', 'TOWN', '品质管控', '注重总图', '式合院', '中式合院', '规划形', '心景观', '拿地方案', '明确地面', '产品不同品类', '控要点', '轴线关系', '总图形态', 'OWN', 'GRE', '总图排布', 'EEN', 'TOW', '绿城产品', '中心景', '方案案例', '线关系', '管控要点', 'REE', '地块条件', '品类产品', '强排管控', '品类产品组合', '景观设置', '强排管控要点', '中心景观', 'GREEN', '规划形态'], 'name': '绿城中国强排要点宣贯0114最终版b.pdf'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/9C5F769FC5364FA98FD06C731781AAE4/5AAB5057623A468AA3CCCA93660DC39F/D3B00DDABB3A4E31B8BFE4AB6F622C12/F85F22176E6542F3BBF08EEDCAB531C4', 'slist': ['单位', '业主', '时代广场', '深圳', '泛光照明设计', '容建筑面积', '塔楼高度', '夜景泛光照明设计', '夜景泛光照明', '总计容建筑', '华汇设计', '幕墙设计', '深圳市华汇', '示范区', '深圳市华汇设计', '总计容建筑面积', '深圳远洋', '有限公', '远洋', '深圳市朋格幕墙', '华汇设计有限公司', '远洋时代广场', '限公司', '深圳远洋时代广场', '深圳市朋格', '深圳市', '汇设计', '墙设计', '设计有限公司', '别墅区组团', '远洋地产', '朋格幕墙', '计容建筑面积', '朋格幕墙设计', '施工图单位'], 'name': '任园园组-深圳远洋时代广场二期.ppt'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/9C5F769FC5364FA98FD06C731781AAE4/E055F93DB4AC48B497A0D1E255A421E3/4E9BB44C9E3B4CED9E1E96506D080B17/44AD7BCF0BDF411A878191382A37146D', 'slist': ['业主', '展示中心', '南通', '项目', '部设计', '深圳市华汇', '华汇设计有限公司', '整体形象', '优秀项目', '项目基本信息', '兼顾展示中心', '德诚翠', '要关注商业', '细部设计', '翠珑湾展示中心', '兴华设计院', '凸显厚重感', '人视图', '形态凸显厚重感', '深圳市华汇设计', '要兼顾展示中心', '湾项目', '东朗景观', '显建筑', '德诚翠珑湾项目展示中心', '杭州兴华设计院', '设计采用折框', '重点打造细部', '凸显建筑', '示中心', '德诚翠珑湾项目', '打造细部设计', '大门作为展示中心', '设计团队成员', '年度优秀项目'], 'name': '翠珑湾展示中心-2018年度优秀项目评选.ppt'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/9C5F769FC5364FA98FD06C731781AAE4/6E72FA3F536846DBBBDB8B4E46C7598E/1747EFDDEF3340E7BAB42291C1BD8357/DBA1B06EF3924073A73E0F7A9E1D56EC', 'slist': ['片墙形围', '纪念庭园', '习近平手植树', '习近平手', '低调质朴', '合出建筑空间', '位于莲花山公园', '市民群众参观', '深圳华汇', '深圳华汇设计', '合出建筑', '华汇设计', '将建筑气质', '领导干部', '华汇设计奖励', '奖励申报表', '设计奖励申报表', '设计奖', '汇设计', '莲花山公园', '气质定位', '也是市民', '石材饰面墙围', '是市民群众', '市民群众', '强调位于广场', '群众参观', '陈列展Sheet1', '建筑气质定位', '墙围合出建筑'], 'name': '深圳华汇设计奖励申报表-深圳莲花山“小平与深圳”陈列展.xlsx'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/9C5F769FC5364FA98FD06C731781AAE4/5AAB5057623A468AA3CCCA93660DC39F/2BA3A4E934324D1CAA34CB5777992E5A/DFD4C8C7D23D423783E3595CE7C46A07', 'slist': ['国山水', '增加城市', '深圳市南山', '中国山水', '城市中央公园', '深圳市南山区', '重组建筑形体', '总部基地', '位于深圳市南山区', '联想中国', '增加城市渗透率', '重组建筑', '央公园', '中央公', '慢行系统串联', '形成口袋公园', '叠积表皮', '山水意境', '绿化共同营造', '立体开放城市', '数码像素', '神州数码云', '亦让人', '人联想中国', '云科技', '联想中国山水', '中国山水意境', '中央公园城市', '中央公园城市景观', '神州数码云科技'], 'name': '神州数码申报表01.xlsx'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/9C5F769FC5364FA98FD06C731781AAE4/32DC588860144323ABDBD348B96EE5C1/2B873778DFEE4E0DA8232C37829A6083/43403F4D20CB4DD39D843F276D06E233', 'slist': ['业主', '城市', '建筑设计股份有限公司', '建筑设计股份', '融创天津小淀', '展厅', '融创天津', '建设咨询有限公司', '天津', '深圳市华汇设计', '限公司', '设计股份有限公司', '天津小淀城市', '深圳市华汇', '市展厅', '天友建筑设计', '城市展厅', '融创集团', '幕墙建设咨询', '深圳市', '汇设计', '有限公', '小淀城市展厅', '华汇设计有限公司', '天津市天友', '华汇设计', '设计有限公司', '天友建筑设计股份', '小淀城市', '上海伊杜幕墙', '单位', '天津市天友建筑设计', '伊杜幕墙', '天津小淀', '伊杜幕墙建设'], 'name': '评选模板-2018年度优秀项目评选（融创天津小淀城市展厅）.ppt'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/9C5F769FC5364FA98FD06C731781AAE4/32D7B6DA93C84D89A4EDDF23FBEC8026/163015EAA6D049E3940AAE8899432992/853C663D684B4FCE9823144245FA554C', 'slist': ['居住区建筑', '现代都市综合体', '是集万象', 'CBD核心区', '华润中心悦府', '中心悦府项目', '特色五星酒店', '错列布局', '门路错列布局', '东邻山东', '门路错列', '形成连续错落', '写字楼', '青岛华润中心', '市综合', '青岛市政府行政区', '山海视野', '华润悦府', '万象城', '市中心繁华视野', '繁华视野', '市中心', '项目坐落于青岛市政府', '青岛华润', '坐落于青岛市政府行政区', '戴积金', '东邻山东路', '五星酒店', '坐拥市中心', '坐落于青岛市政府'], 'name': '青岛-华润悦府二期.xlsx'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/943857D14DA44A869FB7E6D39D54351C/07C16A47AA2B4E7E94424BE58CFD70A1/CE74FFF05DE642EEB197ABA26550A6A3/03ACB6EEAD55474CB0C8FFCBA7CE83FC', 'slist': ['ArcelorMittal', '钢板', 'PVDF', '提高装配化率', '锌钢板', '综合单', '耐候性', '流产品', '符合欧洲', 'PVDF辊涂', '镀铝锌', '高耐候钢', 'PVF膜', 'PVDF辊', 'PVDF高耐候钢', '屈服强度', '材料', '檐口包边', '热镀铝锌', '铝板', '进口PVDF', 'PVDF高耐候', '易加工', 'MPa', '大气中', '综合单价', '加工成', '耐候钢板', 'PVDF高耐候钢板', '高耐候钢板', '性能特点', '国产PVDF', '小厂国产', '厂国产', '易加工成形', '穿孔板', '热镀铝'], 'name': '建筑外立面常用金属材料--MT.pdf'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/C3E774A0010D43B690035B1CDA2C052D/F42E7BC00DBD4C88A357736AB56C2379/ECBE47B28FB94B1B94ADA63D0EAD7E0A', 'slist': ['滨江', 'ION', '最大化', '全板式', 'NAL', '鳌江', '型设计', 'ONA', '地块方案设计', 'ANN', '块方案', '中心', 'PLA', '平阳县鳌江镇', '滨江中心', '江镇滨江', '鳌江镇', '鳌江镇滨江', '江镇滨江中心', 'NIN', 'IGN', 'LAN', 'SIG', 'ESI', 'DES', '走道区域', 'PRO', 'NNI', '中心片F', 'ING', '地块', '地块方', '案设计', '户型设计'], 'name': '中央悦府（世茂温州平阳）设计例会zz1561708532.pptx'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/C3E774A0010D43B690035B1CDA2C052D/E25108794EA847759A643A2C67B78EC3/D4B63ED56684466980D228A92567D9F4', 'slist': ['视觉', 'ATI', '立面材料', '行入口', 'STR', '景观', 'ONG', '昆明新中心', 'TAT', 'MIN', '金属斜面', 'UNM', 'NMI', '新中心', '昆明', '幻灯片编号', '严格控制细节', '细节', 'KUN', '立面效', '诚信卓越', '昆明火车站', '视觉体验', '售楼部', '玻璃面', '中海地产', '立面效果', '昆明市中心', '立面形象', 'IAN', '视觉冲击', '构造', 'DIA', '面形象', 'ING'], 'name': '中海巫家坝寰宇天下1561949975.pdf'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/C3E774A0010D43B690035B1CDA2C052D/E1FD854014254F95868D8D0FEE71DD49/1F81CB3A941348D2941A7BF16A18AD94', 'slist': ['城市', '像一面镜子', '材料', '建筑', '人带来心神', '守卫者雕塑', '空灵神韵', '左岸艺术中心', '体空间', '紧扣人心', '将生活诗化', 'U型柱廊', '沿河空间', '开放沿河空间', '将生活', '借助临河', '现代美学', '术中心', '实现效果', '便紧扣人心', '希冀将生活', '传达现代美学', '简素精', '城南河', '中央居住区', '青奥体育公园', '设计师', '艺术中心', '青奥体育', '艺术围墙', '菠萝格景墙', '天光云', '印尼菠萝格景墙', '光影律动'], 'name': '艺术与技术的完美融合-左岸艺术中心—0628 - 副本15617129281562145533.pptx'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/C3E774A0010D43B690035B1CDA2C052D/50A77B1F90984F11AEF964C94A38A2BA/6B3DDBA471D14FEF9344BD747CFC6A40', 'slist': ['社区', '入口', '城市', '规定建筑面积', '深圳市', '规定建筑', 'NGS', '容积率建筑', 'ANA', 'MEN', 'ONA', 'NSI', 'LYS', 'YSI', '建筑面积', '光明区', 'ION', '筑面积', 'SIO', 'NAL', '建筑面', '花园', 'REN', '核增建筑', '生活方式', '容积率', '活方式', '生活方', '深圳市光明', '核增建筑面', '计容积率建筑', '深圳市光明区', 'ALY', 'SIS'], 'name': '金融街深圳市光明区光明街道地块前端-北京天华1561813760.pdf'}, {'_id': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/943857D14DA44A869FB7E6D39D54351C/6BAE80CF82004368B557AF287761D20A/D069E4BE2F2047BBB23BBADA7DEA662B', 'slist': ['项目', '标准层', '成本导则', '设计成本导则', '采购阶段', '售面积', '经济型别墅', '线城市', '成本限额标准', '集团住宅', '集团住宅产品', '型别墅', '限额标准', '化设计', '住宅产', '成本限额', '量化设计', '限额标', '住宅产品', '限额指', '限额指标', '案设计', '主体方案', '主体方案设计', '电梯厅', '赠送面积', '修标准', '装修标准', '档项目', '送面积', '成本', '产品策', '可售面积'], 'name': '011：金地集团住宅产品配置 、量化设计及成本限额标准 V2.0.pdf'}]
    def bulk_write(self, *args, **kwargs):
        pass #EMPTY

    def find_one(self, *args, **kwargs):
        return {
            "_id" : 0,
            "gns" : "gns://DA5596D930134D7B8BBB230BF9D4A0D6/D7CC2FC3828746BB8F8E0D8C9712DC4B/05DE9E9A120C4BB6B6AF344B0FD33EF2/001C28C51B13478BBDB07A6F5FE66036",
            "name" : "蚂蚁金服：只做 Tech，支持金融机构做 Fin.txt"
        }
    def drop(self):
        pass #EMPTY

    def insert_many(self, *args, **kwargs):
        pass #EMPTY

def mock_execute_orient_command(args, input_sql: str, sess=None):
    if input_sql == "select file_type,gns,name,in(label2document).name from document skip 0 limit 20":
        return 200, {'result': [{'file_type': '.PDF', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC', 'name': '2019年1月 昆明市@中粮 【用地410亩 容积率5.3】高层豪宅项目投标 HZS.PDF', 'in(label2document).name': ['万科', '万科', '筑森']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/1E2BFDD892964D68895730BF19FD4B24', 'name': '[搜建筑] - 2018-02-11 4 座全新的摩天大楼，颠覆法兰克福天际线！！.pdf', 'in(label2document).name': ['筑森', '颠覆法兰克福', 'ank', 'urt', '颠覆法兰克福天际线', '法兰克福天际线', 'HPP建筑', 'HPP建筑事务所', '法兰克福中心', '法兰克福中心城区', '核心地块', '事务所董事', '建筑事', '筑事务', '建筑事务所', '事务所', '中心城区', '中心城', 'dio', '中心城区全景', '黄金地块', 'Partner点将', 'Partner点将UNStudio', '点将UNStudio', '事务所组成设计', '组成设计', '组成设计联合体', '联袂打造法兰克福', '打造法兰克福核心', '法兰克福核心', '法兰克福核心地块', '回复', '项目', '空间', '即将颠覆法兰克福']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/3490D8D8B19F4F4798D90129E6772CC9', 'name': '[搜建筑] - 2018-10-21 中国最美40家——设计型民宿酒店集合.pdf', 'in(label2document).name': ['望山的原址是一个废弃的小学', '基地是当地一个自然村中几户人家的多栋老农宅', '楠舍前身是一个停用的疗养院', '满眼是绿色', '院门是高大的徽州门楼', '酒店在改造前是一户普通民居', '筑森', '设计师', '浙江省', '归云山房', '位于浙', '主人小熊', '葭蓬村', '思明区环岛', '杭州市西湖区', '酒店', '精品酒', '设计型民宿', '云山房', '位于浙江', '树蛙部落', '凤阳山房', '三山雾里', '落地玻璃', '建筑', '改造', '基地', '满眼', '院门', '精品酒店', '青龙坞', '艺术精品酒店', '是设计', '菩提谷', '微酒店', '青年旅社', '民宿', '楠舍前身', '品酒店', '归云山', '艺术精品', '型民宿酒店', '吴国平', '徽州园林', '厦门市思明区', '位于', '望山的原址']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/C0ED59C724B942629BB6EC837645D77F', 'name': '[搜建筑] - 2018-06-25 两座标志性塔楼，一种创新的结构方案。.pdf', 'in(label2document).name': ['筑森', 'the', 'towers', 'ect', 'ing', 'architects', 'and', '标志性塔楼', 'owe', 'ive', 'ati', 'ent', '结构方案', '平面图', 'ble', 'ers', 'all', 'rns', 'ion', 'nov', 'ttp', 'ova', 'com', 'ral', 'ide', '总部位于芝加哥', '芝加哥尖顶', '芝加哥尖顶场址', '尖顶场址', '尖顶场址设计', '场址设计', '回复', '芝加哥', 'STLarchitects', 'Chicago']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/A0DA09D433B448748B4A8A0A996C3535', 'name': '[搜建筑] - 2019-02-19 万科养老住宅的细节（户型+储藏间+厨房+卫生间）.pdf', 'in(label2document).name': ['筑森', '万科养老', '万科养老住宅', '养老住宅', '老住宅', '户型平面图', '户型平面', '卫生间', '型平面', '建造中国特色', '硬件配套社区', '老年人设计', '符合老年设计规范', '老年设计规范', '提出适合老年人', '适合老年人养老', '老年人养老', '软性服务', '基本设计要素', 'Ａ户型', 'Ａ户型平面图', '智能化联动遮阳', '联动遮阳帘', '床边储物', '床边储物空间', '软质家具', '弱电报警系统', '小区中央护理人员', '健康环境', '紧急呼叫按钮', '地面无高差', '回复', '户型', '养老', '老年人', '阳台']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/9BDFAFF8F78A400FAE1B0868D90F5A17', 'name': '[搜建筑] - 2018-10-18 新方案：165米高“竹笋形”办公楼.pdf', 'in(label2document).name': ['筑森', 'the', 'and', 'ing', '竹笋形', 'ent', '新方案', 'ral', 'tra', 'all', 'nes', 'ade', 'cen', 'ace', 'ati', 'ttp', 'com', 'ght', 'igh', 'ine', 'cti', '毗邻歌剧院', '体允许光线', '光线渗透办公', '渗透办公', '渗透办公空间', '将填充建筑', '裙房靠近地面', '激活较低层', '赞扬文化', '工业城市', '回复', 'Aedas', 'city', '建筑', 'building']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/6BE954962E2A44228E7EC035135D5D7A', 'name': '[搜建筑] - 2019-07-15 小体量办公建筑（穿孔铝板立面）.pdf', 'in(label2document).name': ['筑森', 'the', 'and', 'ing', 'ion', 'tio', 'ent', 'eri', 'cti', 'ace', 'all', 'ati', 'ivi', 'pac', '孵化器', 'ver', 'ell', 'spa', 'rou', 'tor', 'tha', 'out', 'ers', 'ive', 'ide', '小体量办公建筑', '艺术孵化器', 'meetin', 'ard', 'com', 'ral', 'activities', '建筑', 'spaces', '米兰', 'industrial']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/7D061439B8C74721A61F732AC159888B', 'name': '[搜建筑] - 2018-05-05 又一座全球最美建筑 —— 140亿元投资的高铁站.pdf', 'in(label2document).name': ['筑森', '全球最美建筑', '最美建筑', '美建筑', '璃幕墙', '武汉火车站', '代表江城', '搜建筑', 'ttp', '火车站位于湖北省', '湖北省会武汉市', '铁路枢纽站', '也是亚洲', '是亚洲规模', '亚洲规模', '武汉站设计', '字型枢纽', '获得美国芝加哥', '美国芝加哥雅典娜', '芝加哥雅典娜', '芝加哥雅典娜建筑设计', '雅典娜建筑设计', '雅典娜建筑设计博物馆', '国际建筑奖', '堪称是大手笔', '京广高铁', '大顶屋顶', '远看武汉站', '波浪型重檐', '型重檐屋顶', '重檐屋顶', '回复', '高铁站', '武汉站', '玻璃幕墙', '波浪造型']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/4BBDAF64EADB45A59B653244AF2783FE', 'name': '2019.03.29 大连万达甘子井区体育中心配套展示示范区投标方案 Lcime architects.pdf', 'in(label2document).name': ['筑森', 'CONTENT', '概念', '生成', 'DESIGN', 'GENERATION', 'REN', 'EFE', 'NAL', 'IGN', 'SIG', 'DES', 'ERE', 'ESI', 'ENC', 'LYS', 'ALY', 'SIS', 'YSI', 'ATI', 'ANA', 'NCE', 'TIO', 'TION', 'ION', 'NER', 'RAT', 'UNC', 'FUN', 'PLA', 'MAS', 'ONA', 'STE', 'LAN', '销售中心', '售中心', 'AST', 'REA']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/9DD1A7FE083E4D1A8DCF42D80EF4B768', 'name': '[搜建筑] - 2019-10-28 漂亮！！纯净现代的多层办公楼，这样设计……甲方都喜欢.pdf', 'in(label2document).name': ['筑森', 'the', 'ing', 'Bat', 'and', 'igh', 'ffi', 'fic', 'ent', 'JfM_EA', 'oad', 'ice', 'ion', 'ght', 'tra', 'ntr', 'tio', 'ide', '巴斯路', 'existin', 'pac', 'ral', 'Law', 'lin', 'ttp', 'com', 'spa', 'lan', 'ace', 'ris', 'ati', '建筑', 'building', 'office', 'Bath', 'space']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/4AB4A108C8CB4917B9167C1E7112ECDF', 'name': '2018.11.27 金科重庆南岸茶园新城区K标准分区庆隆售楼处汇报版 天华.pdf', 'in(label2document).name': ['筑森', '用地条件', '规划方案', '商业金融业用地', '金融业用地', '建筑密度', '筑密度', '建设用地面积', '设用地面积', '建筑高度', '筑高度', '用地性质', '销售中心', '售中心', '建设用地', '容积率', '用地面积', '层数设计', '国宴厅', '标高设计', '建筑面积', '筑面积', '夫球场', '建筑面', '别墅区标高', '标高协调统一', '入口道路标高', '入口道路', '健身中心', '协调统一', '行流线', '规划', '方案', '用地', '条件', '建筑']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/619BA29307A049EFB97935DAD945A49F', 'name': '[搜建筑] - 2018-03-18 工业建筑设计的新构想.pdf', 'in(label2document).name': ['筑森', 'ing', 'ati', 'ion', 'ide', 'tio', 'spa', '工业建筑设计', '行政大楼', 'and', '政大楼', 'pac', 'tra', '工业建筑', 'ace', 'ect', '业建筑', 'its', 'roj', 'oje', 'bein', 'jec', 'tha', '考虑到仓库', '是避免典型', '白茧设计', '是原始结构', '原始结构', '原始结构变形', '动态形式', '回复', '仓库', '项目', 'warehouse', 'space', 'the', 'Designin']}, {'file_type': '.png', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/CA796D24E95E49C88EA63894649F196A/211B568D47054C9983A2972944B135BE', 'name': '企业微信截图_16183007082147.png', 'in(label2document).name': ['00材料截图']}, {'file_type': '.png', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/CA796D24E95E49C88EA63894649F196A/4CA1B6241C7841DD811F7F1850A5CCAA', 'name': '企业微信截图_1618279586438.png', 'in(label2document).name': ['00材料截图']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/54D05EBE35EF4BA795A2B1C7F5E4E00A', 'name': '2019.03.15 碧桂园郑州国基路2#地块总体规划（商业综合体、安置房、住宅）及建筑设计投标方案 博意.pdf', 'in(label2document).name': ['筑森', 'm2', '面积', '户型', '方案', '叠拼', '室两厅', '房两厅', '设计推演DEDUCTION', '推演DEDUCTION', 'DED', '建筑面积', '筑面积', '建筑面', 'DUC', 'UCT', '附赠全面积', 'CTI', '国基路', 'TIO', 'TION', 'ION', '全高层', '叠拼户', '阳光美景', '增值方式', '增值后得房率', '容积率', '参观体验', '后得房率', '全面积', '型面积', '商业比例', '叠拼户型', 'MAL', '拼户型', '厅设计', '小户型']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/B3F3A093FB2D4FDBA388CA167BDECB13', 'name': '2019.07.15 SCDA最新作品集.pdf', 'in(label2document).name': ['筑森', 'ing', 'ard', 'ect', 'esi', 'Des', 'ign', 'sig', 'ion', 'ona', 'tio', 'ati', 'ent', 'and', 'Int', 'the', 'ral', 'SIA', 'ina', 'yte', 'ide', 'eri', 'CDA', 'sia', 'Bali', 'Bar', 'Mal', 'han', 'rac', 'ace', 'tel', 'Singapore', 'Design', 'Architecture', 'Awards', 'Award']}, {'file_type': '.png', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/CA796D24E95E49C88EA63894649F196A/6EAB21CEC1D54C769C0F23889FADC65D', 'name': '企业微信截图_16182737756766.png', 'in(label2document).name': ['00材料截图']}, {'file_type': '.pptx', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/45AD7AED00C14FAE958D427ECD8168D1', 'name': '2018.11.28 金科广州南沙新区明珠湾起步区C1-27-01地块江景高层（T4、T6）住宅+会购房项目投标方案 上海侨恩.pptx', 'in(label2document).name': ['交流是维持圈层的必要途径', '筑森', 'roj', 'oje', '广州市横沥镇', '广州市横沥镇灵山岛', '尖项目设计方案', 'jec', '横沥镇灵山岛', '灵山岛尖项目', '尖项目', 'ect', 'gsh', 'ing', '项目设计', '目设计', '设计方案', '计方案', 'ive', 'ngs', 'sha', '房型视线', '房型视线分析', 'han', 'lan', '化产品分析', '房型指标', '建面总和', 'ign', 'sig', 'esi', '公摊系数', 'analysis', 'project', '住宅', '私人定制', 'Competitive', '交流']}, {'file_type': '.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/8A4B3BDE5CC849F0B58465AD19AD60A7', 'name': '[搜建筑] - 2019-05-25 纯净现代的“矩形几何”办公大楼.pdf', 'in(label2document).name': ['门厅是一个空旷的空间', '筑森', 'the', 'ing', 'ent', 'and', 'ion', 'tio', 'ati', 'spa', 'ice', 'upa', 'ers', 'upan', 'Urb', 'out', 'ide', 'cti', 'eri', 'ace', 'ffi', 'pac', 'fic', 'Urbo商务中心', 'rou', 'aca', 'ine', 'com', 'tra', 'cad', 'ver', 'spaces', '建筑', 'building', 'floors', '空间', 'floor', '门厅']}, {'file_type': '.png', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/CA796D24E95E49C88EA63894649F196A/E0922495C78645D18D066B2662A1289E', 'name': '企业微信截图_16182974086293.png', 'in(label2document).name': ['00材料截图']}], 'executionPlan': {'@type': 'd', '@version': 0, 'cost': 0, 'prettyPrint': '+ FETCH FROM CLASS document\n  + FETCH FROM CLUSTER 21 ASC\n  + FETCH FROM CLUSTER 22 ASC\n  + FETCH FROM CLUSTER 23 ASC\n  + FETCH FROM CLUSTER 24 ASC\n  + FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)\n+ SKIP ( SKIP 0)\n+ LIMIT ( LIMIT 20)\n+ CALCULATE PROJECTIONS\n  file_type, gns, name, in(label2document).name', 'type': 'QueryExecutionPlan', 'steps': [{'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [{'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 21 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 22 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 23 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 24 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'FetchTemporaryFromTxStep', 'description': '+ FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)', 'type': 'FetchTemporaryFromTxStep', 'targetNode': 'FetchTemporaryFromTxStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchTemporaryFromTxStep', '@fieldTypes': 'cost=l'}], 'name': 'FetchFromClassExecutionStep', 'description': '+ FETCH FROM CLASS document\n   + FETCH FROM CLUSTER 21 ASC\n   + FETCH FROM CLUSTER 22 ASC\n   + FETCH FROM CLUSTER 23 ASC\n   + FETCH FROM CLUSTER 24 ASC\n   + FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)', 'type': 'FetchFromClassExecutionStep', 'targetNode': 'FetchFromClassExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClassExecutionStep', '@fieldTypes': 'cost=l,subSteps=z'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'SkipExecutionStep', 'description': '+ SKIP ( SKIP 0)', 'type': 'SkipExecutionStep', 'targetNode': 'SkipExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.SkipExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'LimitExecutionStep', 'description': '+ LIMIT ( LIMIT 20)', 'type': 'LimitExecutionStep', 'targetNode': 'LimitExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.LimitExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'ProjectionCalculationStep', 'description': '+ CALCULATE PROJECTIONS\n  file_type, gns, name, in(label2document).name', 'type': 'ProjectionCalculationStep', 'targetNode': 'ProjectionCalculationStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.ProjectionCalculationStep', '@fieldTypes': 'cost=l'}], 'javaType': 'com.orientechnologies.orient.core.sql.executor.OSelectExecutionPlan', '@fieldTypes': 'cost=l,steps=z'}, 'elapsedMs': 9}
    elif input_sql == "select file_type,gns,name,in(label2document).name from document skip 20 limit 20":
        return 200, {"result": []}
    elif input_sql == "select name, gns, $score as score from document where  search_class('万科 万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。')=true skip 0 limit 10":
        return 200, {'result': [{'name': '[搜建筑] - 2018-05-08 万科养老住宅，75㎡、100㎡和110㎡三种户型设计！！.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/21C3F2B0A70F44F3B7DC61123A3C1681', 'score': 76.672806}, {'name': '[搜建筑] - 2018-05-23 万科的幼儿园，眼前一亮，真的不一样！！.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/6FF126AE04204B4799883C44A1DAE44E/1054B59F915F4BCBA8275BFA7F75B033', 'score': 75.75197}, {'name': '[搜建筑] - 2019-05-12 以光、影、色、材为元素，日本充满活力和趣味的幼儿园！！.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/6FF126AE04204B4799883C44A1DAE44E/EFE3413882A44692873D16197ABFB6DE', 'score': 75.61677}, {'name': '[搜建筑] - 2019-05-27 山地的校园设计，利用高差，打造出个性、多元化、与自然融为一体的空间！！.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/6FF126AE04204B4799883C44A1DAE44E/DAD6A7446AB64673B9635E0214927C2C', 'score': 72.717255}, {'name': '[搜建筑] - 2019-07-06 一个新的小学设计，颠覆了以往的印象，层次、结构更丰富的空间。.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/6FF126AE04204B4799883C44A1DAE44E/233E3CC80A3C49A6A6524446AD567024', 'score': 71.6752}, {'name': '[搜建筑] - 2019-09-08 市民舞台 - 义乌市文化广场—— 8万多平方米的，集文化娱乐、教育培训、体育健身等多功能的大型文化综合体。.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/C395703C118C49AC82BB8100C246DD96/623D3B1E17744D07B9A5251E2DE056EF', 'score': 69.18989}, {'name': '007：绿城集团住宅类产品厨房、卫生间设计.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/943857D14DA44A869FB7E6D39D54351C/07C16A47AA2B4E7E94424BE58CFD70A1/FF93EA0BB9304D3FAAA29FEA53215ED2', 'score': 68.62098}, {'name': '[搜建筑] - 2019-05-01 扎哈在中国的遗作，终于完成，耗资28亿，施工难度堪比鸟巢.pdf', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/C395703C118C49AC82BB8100C246DD96/5B510DB02BB24E8B817D19305D613FA6', 'score': 65.61716}, {'name': '深圳万科集团总部项目-2018年度优秀项目评选.ppt', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/9C5F769FC5364FA98FD06C731781AAE4/5070BABCE957416C99B0E6426EBF3490/16813F0D056345AE8EA692EE72D2B101/A6610672496B4776A2159D40703291CD', 'score': 63.863888}, {'name': '深圳万科集团总部项目-深圳华汇设计奖励申报表.xlsx', 'gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/5522C793E8DD4F82A2FBA492022E210B/9C5F769FC5364FA98FD06C731781AAE4/5070BABCE957416C99B0E6426EBF3490/16813F0D056345AE8EA692EE72D2B101/90F2E1460AFA45C281E114EEF3D77E45', 'score': 62.804317}], 'executionPlan': {'@type': 'd', '@version': 0, 'cost': 0, 'prettyPrint': "+ FETCH FROM INDEXED FUNCTION search_class('万科 万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。') = true\n+ FILTER ITEMS BY CLUSTERS \n  document, document_1, document_3, document_2\n+ FILTER ITEMS BY CLASS \n  document\n+ SKIP ( SKIP 0)\n+ LIMIT ( LIMIT 10)\n+ CALCULATE PROJECTIONS\n  name, gns, $score AS score", 'type': 'QueryExecutionPlan', 'steps': [{'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromIndexedFunctionStep', 'description': "+ FETCH FROM INDEXED FUNCTION search_class('万科 万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。') = true", 'type': 'FetchFromIndexedFunctionStep', 'targetNode': 'FetchFromIndexedFunctionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromIndexedFunctionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'FilterByClustersStep', 'description': '+ FILTER ITEMS BY CLUSTERS \n  document, document_1, document_3, document_2', 'type': 'FilterByClustersStep', 'targetNode': 'FilterByClustersStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FilterByClustersStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FilterByClassStep', 'description': '+ FILTER ITEMS BY CLASS \n  document', 'type': 'FilterByClassStep', 'targetNode': 'FilterByClassStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FilterByClassStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'SkipExecutionStep', 'description': '+ SKIP ( SKIP 0)', 'type': 'SkipExecutionStep', 'targetNode': 'SkipExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.SkipExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'LimitExecutionStep', 'description': '+ LIMIT ( LIMIT 10)', 'type': 'LimitExecutionStep', 'targetNode': 'LimitExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.LimitExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'ProjectionCalculationStep', 'description': '+ CALCULATE PROJECTIONS\n  name, gns, $score AS score', 'type': 'ProjectionCalculationStep', 'targetNode': 'ProjectionCalculationStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.ProjectionCalculationStep', '@fieldTypes': 'cost=l'}], 'javaType': 'com.orientechnologies.orient.core.sql.executor.OSelectExecutionPlan', '@fieldTypes': 'cost=l,steps=z'}, 'elapsedMs': 22}
    elif input_sql == "select @rid from subject where subject_id=4":
        return 200, {"result": []}
    elif input_sql == "select @rid from subject where subject_id=4 ":
        return 200, {'result': [{'@rid': '#43:1'}], 'executionPlan': {'@type': 'd', '@version': 0, 'cost': 0, 'prettyPrint': '+ FETCH FROM CLASS subject\n  + FETCH FROM CLUSTER 41 ASC\n  + FETCH FROM CLUSTER 42 ASC\n  + FETCH FROM CLUSTER 43 ASC\n  + FETCH FROM CLUSTER 44 ASC\n  + FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)\n+ FILTER ITEMS WHERE \n  subject_id = 5\n+ CALCULATE PROJECTIONS\n  @rid', 'type': 'QueryExecutionPlan', 'steps': [{'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [{'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 41 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 42 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 43 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 44 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'FetchTemporaryFromTxStep', 'description': '+ FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)', 'type': 'FetchTemporaryFromTxStep', 'targetNode': 'FetchTemporaryFromTxStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchTemporaryFromTxStep', '@fieldTypes': 'cost=l'}], 'name': 'FetchFromClassExecutionStep', 'description': '+ FETCH FROM CLASS subject\n   + FETCH FROM CLUSTER 41 ASC\n   + FETCH FROM CLUSTER 42 ASC\n   + FETCH FROM CLUSTER 43 ASC\n   + FETCH FROM CLUSTER 44 ASC\n   + FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)', 'type': 'FetchFromClassExecutionStep', 'targetNode': 'FetchFromClassExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClassExecutionStep', '@fieldTypes': 'cost=l,subSteps=z'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FilterStep', 'description': '+ FILTER ITEMS WHERE \n  subject_id = 5', 'type': 'FilterStep', 'targetNode': 'FilterStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FilterStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'ProjectionCalculationStep', 'description': '+ CALCULATE PROJECTIONS\n  @rid', 'type': 'ProjectionCalculationStep', 'targetNode': 'ProjectionCalculationStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.ProjectionCalculationStep', '@fieldTypes': 'cost=l'}], 'javaType': 'com.orientechnologies.orient.core.sql.executor.OSelectExecutionPlan', '@fieldTypes': 'cost=l,steps=z'}, 'elapsedMs': 0}
    elif input_sql == "select @rid, out(subject2document).@rid, in(label2subject).@rid from subject where subject_id=3":
        return 200, {'result': [{'@rid': '#41:1', 'out(subject2document).@rid': ['#21:0'], 'in(label2subject).@rid': ['#34:2854', '#35:2854']}], 'executionPlan': {'@type': 'd', '@version': 0, 'cost': 0, 'prettyPrint': '+ FETCH FROM CLASS subject\n  + FETCH FROM CLUSTER 41 ASC\n  + FETCH FROM CLUSTER 42 ASC\n  + FETCH FROM CLUSTER 43 ASC\n  + FETCH FROM CLUSTER 44 ASC\n  + FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)\n+ FILTER ITEMS WHERE \n  subject_id = 3\n+ CALCULATE PROJECTIONS\n  @rid, out(subject2document).@rid, in(label2subject).@rid', 'type': 'QueryExecutionPlan', 'steps': [{'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [{'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 41 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 42 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 43 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 44 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'FetchTemporaryFromTxStep', 'description': '+ FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)', 'type': 'FetchTemporaryFromTxStep', 'targetNode': 'FetchTemporaryFromTxStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchTemporaryFromTxStep', '@fieldTypes': 'cost=l'}], 'name': 'FetchFromClassExecutionStep', 'description': '+ FETCH FROM CLASS subject\n   + FETCH FROM CLUSTER 41 ASC\n   + FETCH FROM CLUSTER 42 ASC\n   + FETCH FROM CLUSTER 43 ASC\n   + FETCH FROM CLUSTER 44 ASC\n   + FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)', 'type': 'FetchFromClassExecutionStep', 'targetNode': 'FetchFromClassExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClassExecutionStep', '@fieldTypes': 'cost=l,subSteps=z'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FilterStep', 'description': '+ FILTER ITEMS WHERE \n  subject_id = 3', 'type': 'FilterStep', 'targetNode': 'FilterStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FilterStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'ProjectionCalculationStep', 'description': '+ CALCULATE PROJECTIONS\n  @rid, out(subject2document).@rid, in(label2subject).@rid', 'type': 'ProjectionCalculationStep', 'targetNode': 'ProjectionCalculationStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.ProjectionCalculationStep', '@fieldTypes': 'cost=l'}], 'javaType': 'com.orientechnologies.orient.core.sql.executor.OSelectExecutionPlan', '@fieldTypes': 'cost=l,steps=z'}, 'elapsedMs': 4}
    elif input_sql == "select @rid from subject where subject_id=5":
        return 200, {'result': [{'@rid': '#43:1'}], 'executionPlan': {'@type': 'd', '@version': 0, 'cost': 0, 'prettyPrint': '+ FETCH FROM CLASS subject\n  + FETCH FROM CLUSTER 41 ASC\n  + FETCH FROM CLUSTER 42 ASC\n  + FETCH FROM CLUSTER 43 ASC\n  + FETCH FROM CLUSTER 44 ASC\n  + FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)\n+ FILTER ITEMS WHERE \n  subject_id = 5\n+ CALCULATE PROJECTIONS\n  @rid', 'type': 'QueryExecutionPlan', 'steps': [{'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [{'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 41 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 42 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 43 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 44 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'FetchTemporaryFromTxStep', 'description': '+ FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)', 'type': 'FetchTemporaryFromTxStep', 'targetNode': 'FetchTemporaryFromTxStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchTemporaryFromTxStep', '@fieldTypes': 'cost=l'}], 'name': 'FetchFromClassExecutionStep', 'description': '+ FETCH FROM CLASS subject\n   + FETCH FROM CLUSTER 41 ASC\n   + FETCH FROM CLUSTER 42 ASC\n   + FETCH FROM CLUSTER 43 ASC\n   + FETCH FROM CLUSTER 44 ASC\n   + FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)', 'type': 'FetchFromClassExecutionStep', 'targetNode': 'FetchFromClassExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClassExecutionStep', '@fieldTypes': 'cost=l,subSteps=z'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FilterStep', 'description': '+ FILTER ITEMS WHERE \n  subject_id = 5', 'type': 'FilterStep', 'targetNode': 'FilterStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FilterStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'ProjectionCalculationStep', 'description': '+ CALCULATE PROJECTIONS\n  @rid', 'type': 'ProjectionCalculationStep', 'targetNode': 'ProjectionCalculationStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.ProjectionCalculationStep', '@fieldTypes': 'cost=l'}], 'javaType': 'com.orientechnologies.orient.core.sql.executor.OSelectExecutionPlan', '@fieldTypes': 'cost=l,steps=z'}, 'elapsedMs': 0}
    elif input_sql == "select @rid from label where name=\'王伟\'":
        return 200, {'result': [{'@rid': '#35:2854'}], 'executionPlan': {'@type': 'd', '@version': 0, 'cost': 0, 'prettyPrint': "+ FETCH FROM INDEX label.name\n  name = '王伟'\n+ EXTRACT VALUE FROM INDEX ENTRY\n  filtering clusters [36,35,34,33]\n+ FILTER ITEMS BY CLASS \n  label\n+ CALCULATE PROJECTIONS\n  @rid", 'type': 'QueryExecutionPlan', 'steps': [{'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromIndexStep', 'description': "+ FETCH FROM INDEX label.name\n  name = '王伟'", 'type': 'FetchFromIndexStep', 'targetNode': 'FetchFromIndexStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromIndexStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'GetValueFromIndexEntryStep', 'description': '+ EXTRACT VALUE FROM INDEX ENTRY\n  filtering clusters [36,35,34,33]', 'type': 'GetValueFromIndexEntryStep', 'targetNode': 'GetValueFromIndexEntryStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.GetValueFromIndexEntryStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FilterByClassStep', 'description': '+ FILTER ITEMS BY CLASS \n  label', 'type': 'FilterByClassStep', 'targetNode': 'FilterByClassStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FilterByClassStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'ProjectionCalculationStep', 'description': '+ CALCULATE PROJECTIONS\n  @rid', 'type': 'ProjectionCalculationStep', 'targetNode': 'ProjectionCalculationStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.ProjectionCalculationStep', '@fieldTypes': 'cost=l'}], 'javaType': 'com.orientechnologies.orient.core.sql.executor.OSelectExecutionPlan', '@fieldTypes': 'cost=l,steps=z'}, 'elapsedMs': 1}
    elif input_sql == "select @rid from document where gns=\'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC\'":
        return 200, {'result': [{'@rid': '#21:0'}], 'executionPlan': {'@type': 'd', '@version': 0, 'cost': 0, 'prettyPrint': "+ FETCH FROM INDEX document.gns\n  gns = 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC'\n+ EXTRACT VALUE FROM INDEX ENTRY\n  filtering clusters [21,22,24,23]\n+ FILTER ITEMS BY CLASS \n  document\n+ CALCULATE PROJECTIONS\n  @rid", 'type': 'QueryExecutionPlan', 'steps': [{'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromIndexStep', 'description': "+ FETCH FROM INDEX document.gns\n  gns = 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC'", 'type': 'FetchFromIndexStep', 'targetNode': 'FetchFromIndexStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromIndexStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'GetValueFromIndexEntryStep', 'description': '+ EXTRACT VALUE FROM INDEX ENTRY\n  filtering clusters [21,22,24,23]', 'type': 'GetValueFromIndexEntryStep', 'targetNode': 'GetValueFromIndexEntryStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.GetValueFromIndexEntryStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FilterByClassStep', 'description': '+ FILTER ITEMS BY CLASS \n  document', 'type': 'FilterByClassStep', 'targetNode': 'FilterByClassStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FilterByClassStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'ProjectionCalculationStep', 'description': '+ CALCULATE PROJECTIONS\n  @rid', 'type': 'ProjectionCalculationStep', 'targetNode': 'ProjectionCalculationStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.ProjectionCalculationStep', '@fieldTypes': 'cost=l'}], 'javaType': 'com.orientechnologies.orient.core.sql.executor.OSelectExecutionPlan', '@fieldTypes': 'cost=l,steps=z'}, 'elapsedMs': 1}
    elif input_sql == "select score, in.gns, in.name from subject2document where out.subject_id=5 order by score desc skip 0 limit 10":
        return 200, {'result': [{'score': 1.0, 'in.gns': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC', 'in.name': '2019年1月 昆明市@中粮 【用地410亩 容积率5.3】高层豪宅项目投标 HZS.PDF'}], 'executionPlan': {'@type': 'd', '@version': 0, 'cost': 0, 'prettyPrint': '+ FETCH FROM CLASS subject2document\n  + FETCH FROM CLUSTER 89 ASC\n  + FETCH FROM CLUSTER 90 ASC\n  + FETCH FROM CLUSTER 91 ASC\n  + FETCH FROM CLUSTER 92 ASC\n  + FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)\n+ FILTER ITEMS WHERE \n  out.subject_id = 5\n+ CALCULATE PROJECTIONS\n  score, in.gns, in.name\n+ ORDER BY score DESC\n  (buffer size: 10)\n+ SKIP ( SKIP 0)\n+ LIMIT ( LIMIT 10)', 'type': 'QueryExecutionPlan', 'steps': [{'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [{'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 89 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 90 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 91 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FetchFromClusterExecutionStep', 'description': '+ FETCH FROM CLUSTER 92 ASC', 'type': 'FetchFromClusterExecutionStep', 'targetNode': 'FetchFromClusterExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClusterExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'FetchTemporaryFromTxStep', 'description': '+ FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)', 'type': 'FetchTemporaryFromTxStep', 'targetNode': 'FetchTemporaryFromTxStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchTemporaryFromTxStep', '@fieldTypes': 'cost=l'}], 'name': 'FetchFromClassExecutionStep', 'description': '+ FETCH FROM CLASS subject2document\n   + FETCH FROM CLUSTER 89 ASC\n   + FETCH FROM CLUSTER 90 ASC\n   + FETCH FROM CLUSTER 91 ASC\n   + FETCH FROM CLUSTER 92 ASC\n   + FETCH NEW RECORDS FROM CURRENT TRANSACTION SCOPE (if any)', 'type': 'FetchFromClassExecutionStep', 'targetNode': 'FetchFromClassExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FetchFromClassExecutionStep', '@fieldTypes': 'cost=l,subSteps=z'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'FilterStep', 'description': '+ FILTER ITEMS WHERE \n  out.subject_id = 5', 'type': 'FilterStep', 'targetNode': 'FilterStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.FilterStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'ProjectionCalculationStep', 'description': '+ CALCULATE PROJECTIONS\n  score, in.gns, in.name', 'type': 'ProjectionCalculationStep', 'targetNode': 'ProjectionCalculationStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.ProjectionCalculationStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': 0, 'subSteps': [], 'name': 'OrderByStep', 'description': '+ ORDER BY score DESC\n  (buffer size: 10)', 'type': 'OrderByStep', 'targetNode': 'OrderByStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.OrderByStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'SkipExecutionStep', 'description': '+ SKIP ( SKIP 0)', 'type': 'SkipExecutionStep', 'targetNode': 'SkipExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.SkipExecutionStep', '@fieldTypes': 'cost=l'}, {'@type': 'd', '@version': 0, 'cost': -1, 'subSteps': [], 'name': 'LimitExecutionStep', 'description': '+ LIMIT ( LIMIT 10)', 'type': 'LimitExecutionStep', 'targetNode': 'LimitExecutionStep', 'javaType': 'com.orientechnologies.orient.core.sql.executor.LimitExecutionStep', '@fieldTypes': 'cost=l'}], 'javaType': 'com.orientechnologies.orient.core.sql.executor.OSelectExecutionPlan', '@fieldTypes': 'cost=l,steps=z'}, 'elapsedMs': 4}
    else:
        return 200, {}


class MockRequest(object):
    def __init__(self):
        self.method = "POST"
        self.args = {}

    def get_data(self):
        return {
            "kg_id": 22,
            "subject_path": "/subject1/subject2",
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": "万科",
            "subject_desc": "万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。",
            "subject_label": [{"name": "王石"}],
            "page": 1,
            "limit": 10
        }

class MockGridFS(object):
    def __init__(self, db, collection):
        self.db = db
        self.collection = collection

    def put(self, *args, **kwargs):
        pass #EMPTY

    def find_one(self):
        class TpData(object):
            def read(self):
                cur_path = os.path.dirname(__file__)
                config_path = os.path.join(os.path.dirname(cur_path), "config/asapi.conf")
                config = ConfigParser()
                config.read(config_path, "utf-8")

                embed_path = config["text_match"]["text_match_embed_path"]

                index_path = "{}/{}".format(embed_path, "document_embed_{}.index".format(22))
                index = faiss.read_index(index_path)

                index_pickle = cPickle.dumps(index)

                return index_pickle

        return TpData()


@unittest.skip("ut skip")
class TestSubject(unittest.TestCase):

    def setUp(self):
        np.random.seed(100)
        cur_path = os.path.dirname(__file__)
        config_path = os.path.join(os.path.dirname(cur_path), "config/asapi.conf")
        config = ConfigParser()
        config.read(config_path, "utf-8")

        self.embed_path = config["text_match"]["text_match_embed_path"]
        if not os.path.exists(self.embed_path):
            os.makedirs(self.embed_path)
        obj = 200, query_res
        graph_Service.getGraphById = mock.Mock(return_value=obj)
        res = [{"id": 1,
               "ip": "kg-orientdb",
               "port":  2480,
               "user":  "admin",
                "password": "YWRtaW4=",
                "version": 3,
                "type": "orient",
                "db_user": "root",
                "db_ps": "YW55ZGF0YTEyMw==",
                "db_port": 2424
        }]
        df = pd.DataFrame(res)
        task_dao.getGraphDBbyIp = mock.Mock(return_value=df)

        res = codes.successCode, (1, 1, 1, 1, 1)
        graph_count_controller.getGraphCountByid = mock.Mock(return_value=res)

        # res = pd.DataFrame(self.graph_config_table_empty, columns=self.graph_config_columns)
        # graph_dao.getKgConfByName = mock.Mock(return_value=res)

        res = pd.DataFrame({"graph_otl": ['[22]']})
        graph_dao.get_graph_otl_id = mock.Mock(return_value=res)

        res = pd.DataFrame({"entity": ["[{'entity_id': 1, 'colour': '#F44336', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'folder', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['path', 'string'], ['gns', 'string'], ['create_time', 'string'], ['rev', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'path', 'gns', 'create_time', 'rev'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '目录'}, {'entity_id': 2, 'colour': '#F44336', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'document', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['path', 'string'], ['creator', 'string'], ['create_time', 'string'], ['editor', 'string'], ['gns', 'string'], ['file_type', 'string'], ['modified_time', 'string'], ['rev', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'path', 'creator', 'create_time', 'editor', 'gns', 'file_type', 'modified_time', 'rev'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '文档'}, {'entity_id': 3, 'colour': '#ED679F', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'chapter', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['path', 'string'], ['level', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'path', 'level'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '章节'}, {'entity_id': 4, 'colour': '#8BC34A', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'text', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '正文'}, {'entity_id': 5, 'colour': '#673AB8', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'label', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['confidence', 'float'], ['adlabel_kcid', 'string'], ['kc_topic_tags', 'string'], ['type_as', 'boolean'], ['type_sa', 'boolean'], ['type_nw', 'boolean'], ['type_kc', 'boolean']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'confidence', 'adlabel_kcid', 'kc_topic_tags', 'type_as', 'type_sa', 'type_nw', 'type_kc'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '标签'}, {'entity_id': 6, 'colour': '#00BDD4', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'desc', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '解释'}, {'entity_id': 7, 'colour': '#00BDD4', 'ds_name': '', 'dataType': '', 'data_source': '', 'ds_path': '', 'ds_id': '', 'extract_type': '', 'name': 'subject', 'source_table': [], 'source_type': 'automatic', 'properties': [['name', 'string'], ['subject_id', 'float'], ['subject_path', 'string'], ['subject_fold', 'string'], ['subject_desc', 'string']], 'file_type': '', 'task_id': '', 'properties_index': ['name', 'subject_id', 'subject_path', 'subject_fold', 'subject_desc'], 'model': 'Anysharedocumentmodel', 'ds_address': '', 'alias': '主题'}]"]})
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(return_value=res)

        cur_path = os.path.dirname(__file__)
        word_set_path = os.path.join(cur_path, "word_set.json")
        with open(word_set_path, "r") as f:
            data = f.read()
        word_json = json.loads(data)

        word_vector = dict()
        for word in word_json["word_set"]:
            word_vector[word] = np.random.random(300)
        tm.embed_model = word_vector

        subject_dao.execute_orient_command = mock.Mock(side_effect=mock_execute_orient_command)



        mongo = {"mongoDB_22": {"label2document": MockMongoCollection(),
                                "subject_info_22": MockMongoCollection(),
                                "document_index_22.chunks": MockMongoCollection(),
                                "document_index_22.files": MockMongoCollection()}}
        pymongo.MongoClient = mock.Mock(return_value=mongo)

        gridfs.GridFS = mock.Mock(side_effect=MockGridFS)
        #

        # subject_dao.get_orient_data_by_orientdb = mock.Mock(side_effect=mock_get_orient_data_by_orientdb)
        # subject_dao.delete_data_by_orientdb = mock.Mock(side_effect=mock_delete_data_by_orientdb)
        # subject_dao.update_data_by_orientdb = mock.Mock(side_effect=mock_update_data_by_orientdb)
    def test_build_vector_index(self):
        kg_id = 22
        task = TextMatchTask("test", kg_id)
        task.document_source = "mongodb"
        task.build_document_embed()

        index_exits = os.path.exists("{}/{}".format(self.embed_path, "document_embed_{}.index".format(kg_id)))
        doc_info_exits = os.path.exists("{}/{}".format(self.embed_path, "document_info_{}.json".format(kg_id)))

        self.assertEqual(True, index_exits)
        self.assertEqual(True, doc_info_exits)

        task.document_source = "orientdb"
        task.build_document_embed()

        # index_exits = os.path.exists("{}/{}".format(self.embed_path, "document_embed_{}.index".format(kg_id)))
        # doc_info_exits = os.path.exists("{}/{}".format(self.embed_path, "document_info_{}.json".format(kg_id)))

        # self.assertEqual(True, index_exits)
        # self.assertEqual(True, doc_info_exits)

    def test_search_document(self):
        params_json = {
            "kg_id": 22,
            "subject_path": "/subject1/subject2",
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": "万科",
            "subject_desc": "万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。",
            "subject_label": [{"name": "王石"}],
            "search_type": "vector",
            "page": 1,
            "limit": 10
        }
        ret_code, res = search_subject_task(params_json["kg_id"], subject_path=params_json["subject_path"],
                             subject_fold=params_json["subject_fold"],
                             subject_name=params_json["subject_name"],
                             subject_desc=params_json["subject_desc"],
                             subject_label=params_json["subject_label"],
                             search_type=params_json["search_type"],
                             page=params_json["page"],
                             limit=params_json["limit"])
        print(res)
        self.assertEqual(200, ret_code)
        self.assertIn("kg_id", res)
        self.assertIn("relate_document", res)
        self.assertEqual(22, res["kg_id"])
        self.assertEqual(5, len(res["relate_document"]))
        self.assertIn("name", res["relate_document"][0])
        self.assertIn("score", res["relate_document"][0])
        self.assertIn("gns", res["relate_document"][0])

        ret_code, res = search_subject_task(params_json["kg_id"], subject_path=params_json["subject_path"],
                                            subject_fold=params_json["subject_fold"],
                                            subject_name=params_json["subject_name"],
                                            subject_desc=params_json["subject_desc"],
                                            subject_label=params_json["subject_label"],
                                            search_type="full-text",
                                            page=params_json["page"],
                                            limit=params_json["limit"])
        self.assertEqual(200, ret_code)
        self.assertIn("kg_id", res)
        self.assertIn("relate_document", res)
        self.assertEqual(22, res["kg_id"])
        self.assertEqual(10, len(res["relate_document"]))
        self.assertIn("name", res["relate_document"][0])
        self.assertIn("score", res["relate_document"][0])
        self.assertIn("gns", res["relate_document"][0])

        # self.assertRegex(res["relate_document"][0]["gns"], "gns://[\w\/]{32}")

    def test_create_subject(self):
        params_json = {
                "kg_id": 22,
                "subject_id": 4,
                "subject_path": "/subject1/subject2",
                "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3",
                "subject_name": "万科",
                "subject_desc": "万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。",
                "subject_label": [{"name": "王石"}],
                "subject_document": [{
                    "gns": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC",
                    "score": 1.0,
                    "name": "2019年1月 昆明市@中粮 【用地410亩 容积率5.3】高层豪宅项目投标 HZS.PDF"
                }
                ]
        }
        ret_code, res = tm.submit_subject_task(params_json["kg_id"],
                               subject_id=params_json["subject_id"],
                               subject_path=params_json["subject_path"],
                               subject_fold=params_json["subject_fold"],
                               subject_name=params_json["subject_name"],
                               subject_desc=params_json["subject_desc"],
                               subject_label=params_json["subject_label"],
                               subject_document=params_json["subject_document"])
        self.assertEqual(200, ret_code)

    def test_delete_subject(self):
        params_json = {
            "kg_id": 22,
            "subject_id": 3,
        }
        ret_code, res = delete_subject_task(params_json["kg_id"], params_json["subject_id"])
        self.assertEqual(200, ret_code)

    def test_update_subject(self):
        kg_id = 22
        params_json = {
            "subject_id": 5,
            "subject_path": "/subject1/subject2",
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": "万科",
            "subject_desc": "万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。",
            "subject_label": [{"name": "王伟"}],
            "subject_document": [{
                    "gns": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC",
                    "score": 1.0,
                    "name": "2019年1月 昆明市@中粮 【用地410亩 容积率5.3】高层豪宅项目投标 HZS.PDF"
                }
            ]
        }
        ret_code, res = update_subject_task(kg_id=kg_id, **params_json)
        self.assertEqual(200, ret_code)

    def test_query_subject(self):
        kg_id = 22
        params = {
            "subject_id": 5,
            "doc_title_keyword": "",
            "page": 1,
            "limit": 10
        }

        ret_code, res = query_subject_task(kg_id, **params)

        self.assertEqual(200, ret_code)
        self.assertIn("subject_id", res)
        self.assertIn("kg_id", res)
        self.assertIn("relate_document", res)
        self.assertEqual(1, len(res["relate_document"]))
        self.assertIn("name", res["relate_document"][0])
        self.assertIn("score", res["relate_document"][0])
        self.assertIn("gns", res["relate_document"][0])

    def test_function(self):
        input_a = np.array([1, 0])
        input_b = np.array([0, 1])

        self.assertEqual(1.0, cosine_distance(input_a, input_b))

        fold_gns, document_gns = "gns://abc", "gns://abc/abd"
        self.assertEqual(True, is_subdocument(fold_gns, document_gns))

        cur_path = os.path.dirname(__file__)
        data_vector_path = os.path.join(cur_path, "data_vector.bz2")
        embedding_dict = load_word_vector_by(data_vector_path)
        self.assertIn("a", embedding_dict)

    def test_check_param(self):
        param_search_success = {
            "kg_id": 22,
            "subject_path": "/subject1/subject2",
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": "万科",
            "subject_desc": "万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。",
            "subject_label": [{"name": "王石"}],
            "page": 1,
            "limit": 10
        }
        ret_code, res = check_params(param_search_success, "search")
        self.assertEqual(200, ret_code)

        param_create_success = {
                "kg_id": 22,
                "subject_id": 4,
                "subject_path": "/subject1/subject2",
                "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3",
                "subject_name": "万科",
                "subject_desc": "万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。",
                "subject_label": [{"name": "王石"}],
                "subject_document": [{
                    "gns": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC",
                    "score": 1.0,
                    "name": "2019年1月 昆明市@中粮 【用地410亩 容积率5.3】高层豪宅项目投标 HZS.PDF"
                }
                ]
        }
        ret_code, res = check_params(param_create_success, "create")
        print(res)
        self.assertEqual(200, ret_code)

        param_delete_success = {
            "kg_id": 22,
            "subject_id": 3,
        }
        ret_code, res = check_params(param_delete_success, "delete")
        self.assertEqual(200, ret_code)

        param_update_success = {
            "kg_id": 22,
            "subject_id": 5,
            "subject_path": "/subject1/subject2",
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": "万科",
            "subject_desc": "万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。",
            "subject_label": [{"name": "王伟"}],
            "subject_document": [{
                    "gns": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC",
                    "score": 1.0,
                    "name": "2019年1月 昆明市@中粮 【用地410亩 容积率5.3】高层豪宅项目投标 HZS.PDF"
                }
            ]
        }
        ret_code, res = check_params(param_update_success, "update")

        print(res)
        self.assertEqual(200, ret_code)

        param_query_success = {
            "kg_id": 22,
            "subject_id": 5,
            "doc_title_keyword": "",
            "page": 1,
            "limit": 10
        }
        ret_code, res = check_params(param_query_success, "get")
        self.assertEqual(200, ret_code)

    def test_check_search_request(self):
        # m_request = MockRequest()
        # flask.request = mock.Mock(side_effect=m_request)
        m = mock.MagicMock()
        m.method = "POST"

        def f(data=None):
            return {}

        def fv():
            return 0, {'kg_id': 22, 'subject_path': '', 'subject_fold': 'gns://DA5596D930134D7B8BBB230BF9D4A0D6', 'subject_name': '外立面设计', 'subject_desc': '', 'subject_label': [], 'page': 1, 'limit': 10}, ""
        # m.get_data = f

        from utils.CommonUtil import commonutil

        commonutil.getMethodParam = mock.Mock(side_effect=fv)
        Gview.text_match_return = mock.Mock(side_effect=f)

        with mock.patch("controller.celery_controller_open_kc.request", m):
            res, res_code = celery_controller_open_kc.search_subject()
            self.assertEqual(200, res_code)

    def test_check_create_request(self):
        # m_request = MockRequest()
        # flask.request = mock.Mock(side_effect=m_request)
        from utils.CommonUtil import commonutil
        m = mock.MagicMock()
        m.method = "POST"

        def f(data=None):
            return {}

        def fv():
            return 0, {
                "kg_id": 22,
                "subject_id": 4,
                "subject_path": "/subject1/subject2",
                "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3",
                "subject_name": "万科",
                "subject_desc": "万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。",
                "subject_label": [{"name": "王石"}],
                "subject_document": [{
                    "gns": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC",
                    "score": 1.0,
                    "name": "2019年1月 昆明市@中粮 【用地410亩 容积率5.3】高层豪宅项目投标 HZS.PDF"
                }
                ]
        }, ""
        # m.get_data = f



        commonutil.getMethodParam = mock.Mock(side_effect=fv)
        Gview.text_match_return = mock.Mock(side_effect=f)

        with mock.patch("controller.celery_controller_open_kc.request", m):
            res, res_code = celery_controller_open_kc.create_subject()
            self.assertEqual(200, res_code)

    def test_check_delete_request(self):
        # m_request = MockRequest()
        # flask.request = mock.Mock(side_effect=m_request)
        m = mock.MagicMock()
        m.method = "POST"

        def f(data=None):
            return {}

        def fv():
            return 0, {
                "kg_id": 22,
                "subject_id": 4
        }, ""
        # m.get_data = f

        from utils.CommonUtil import commonutil

        commonutil.getMethodParam = mock.Mock(side_effect=fv)
        Gview.text_match_return = mock.Mock(side_effect=f)

        with mock.patch("controller.celery_controller_open_kc.request", m):
            res, res_code = celery_controller_open_kc.delete_subject()
            self.assertEqual(200, res_code)

    def test_check_update_request(self):
        # m_request = MockRequest()
        # flask.request = mock.Mock(side_effect=m_request)
        m = mock.MagicMock()
        m.method = "POST"

        def f(data=None):
            return {}

        def fv():
            return 0, {
                "kg_id": 22,
                "subject_id": 5,
                "subject_path": "/subject1/subject2",
                "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3",
                "subject_name": "万科",
                "subject_desc": "万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。",
                "subject_label": [{"name": "王石"}],
                "subject_document": [{
                    "gns": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC",
                    "score": 1.0,
                    "name": "2019年1月 昆明市@中粮 【用地410亩 容积率5.3】高层豪宅项目投标 HZS.PDF"
                }
                ]
        }, ""

        from utils.CommonUtil import commonutil

        commonutil.getMethodParam = mock.Mock(side_effect=fv)
        Gview.text_match_return = mock.Mock(side_effect=f)

        with mock.patch("controller.celery_controller_open_kc.request", m):
            res, res_code = celery_controller_open_kc.update_subject()
            self.assertEqual(200, res_code)

    def test_check_query_request(self):
        # m_request = MockRequest()
        # flask.request = mock.Mock(side_effect=m_request)
        m = mock.MagicMock()
        m.method = "GET"

        def f(data=None):
            return {}

        def fv():
            return 0, {
            "kg_id": 22,
            "subject_id": 5,
            "doc_title_keyword": "",
            "page": 1,
            "limit": 10
        }, ""

        from utils.CommonUtil import commonutil

        commonutil.getMethodParam = mock.Mock(side_effect=fv)
        Gview.text_match_return = mock.Mock(side_effect=f)

        with mock.patch("controller.celery_controller_open_kc.request", m):
            res, res_code = celery_controller_open_kc.get_subject()
            self.assertEqual(200, res_code)


if __name__ == "__main__":
    unittest.main()

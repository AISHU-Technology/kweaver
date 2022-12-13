import json
from unittest import TestCase, mock
from main.builder_app import app
from common.errorcode import codes
from service.graph_Service import graph_Service
from service.subgraph_service import subgraph_service

client = app.test_client()


class TestGetGraphInfoBasic(TestCase):
    def setUp(self) -> None:
        self.origin_graph_Service_get_graph_info_basic = graph_Service.get_graph_info_basic
        graph_Service.get_graph_info_basic = mock.Mock(return_value=(codes.successCode, {}))

    def tearDown(self) -> None:
        graph_Service.get_graph_info_basic = self.origin_graph_Service_get_graph_info_basic

    def test_get_graph_info_basic_success1(self):
        response = client.get('/api/builder/v1/graph/info/basic',
                              query_string={'graph_id': '1',
                                            'is_all': 'true'}
                              )
        self.assertEqual(response.status_code, 200)

    def test_get_graph_info_basic_success2(self):
        response = client.get('/api/builder/v1/graph/info/basic',
                              query_string={'graph_id': '1',
                                            'is_all': 'false',
                                            'key': '["graph_des", "create_time", "update_time", "display_task", "export", "is_import", "is_upload", "knowledge_type", "property_id", "status", "step_num", "ds", "otl", "info_ext", "kmap", "kmerge", "mongo_name", "graphdb_name", "graphdb_type", "graphdb_address", "graphdb_id"]'}
                              )
        self.assertEqual(response.status_code, 200)

    def test_get_graph_info_basic_fail1(self):
        '''Builder_GraphController_GetGraphInfoBasic_ParamError'''
        # graph_id不存在
        response = client.get('/api/builder/v1/graph/info/basic',
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoBasic_ParamError)
        # is_all错误
        response = client.get('/api/builder/v1/graph/info/basic',
                              query_string={'graph_id': '1',
                                            'is_all': 'wrong'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoBasic_ParamError)

    def test_get_graph_info_basic_fail2(self):
        '''Builder_GraphController_GetGraphInfoBasic_KeyTypeError'''
        # key无法被eval
        response = client.get('/api/builder/v1/graph/info/basic',
                              query_string={'graph_id': '1',
                                            'is_all': 'false',
                                            'key': '[a'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoBasic_KeyTypeError)
        # key不是列表
        response = client.get('/api/builder/v1/graph/info/basic',
                              query_string={'graph_id': '1',
                                            'is_all': 'false',
                                            'key': 'a'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoBasic_KeyTypeError)

    def test_get_graph_info_basic_fail3(self):
        '''graph_Service.get_graph_info_basic 错误'''
        graph_Service.get_graph_info_basic = mock.Mock(
            return_value=(codes.Builder_GraphService_GetGraphInfoBasic_GraphDBIdNotExist, {}))
        response = client.get('/api/builder/v1/graph/info/basic',
                              query_string={'graph_id': '1',
                                            'is_all': 'true'}
                              )
        self.assertEqual(response.status_code, 400)

    def test_get_graph_info_basic_fail4(self):
        '''Builder_GraphController_GetGraphInfoBasic_UnknownError'''
        graph_Service.get_graph_info_basic = mock.Mock(side_effect=Exception())
        response = client.get('/api/builder/v1/graph/info/basic',
                              query_string={'graph_id': '1',
                                            'is_all': 'true'}
                              )
        self.assertEqual(response.status_code, 400)


class TestGetGraphInfoOnto(TestCase):
    def setUp(self) -> None:
        self.origin_graph_Service_get_graph_info_onto = graph_Service.get_graph_info_onto
        graph_Service.get_graph_info_onto = mock.Mock(return_value=(codes.successCode, {}))

    def tearDown(self) -> None:
        graph_Service.get_graph_info_onto = self.origin_graph_Service_get_graph_info_onto

    def test_get_graph_info_onto_success1(self):
        response = client.get('/api/builder/v1/graph/info/onto',
                              query_string={'graph_id': '1'}
                              )
        self.assertEqual(response.status_code, 200)

    def test_get_graph_info_onto_fail1(self):
        '''Builder_GraphController_GetGraphInfoOnto_ParamError'''
        response = client.get('/api/builder/v1/graph/info/onto'
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoOnto_ParamError)

    def test_get_graph_info_onto_fail2(self):
        '''graph_Service.get_graph_info_onto 出错'''
        graph_Service.get_graph_info_onto = mock.Mock(
            return_value=(codes.Builder_GraphService_GetGraphInfoOnto_GraphidNotExist, {}))
        response = client.get('/api/builder/v1/graph/info/onto',
                              query_string={'graph_id': '1'}
                              )
        self.assertEqual(response.status_code, 400)

    def test_get_graph_info_onto_fail3(self):
        '''Builder_GraphController_GetGraphInfoOnto_UnknownError'''
        graph_Service.get_graph_info_onto = mock.Mock(side_effect=Exception())
        response = client.get('/api/builder/v1/graph/info/onto',
                              query_string={'graph_id': '1'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoOnto_UnknownError)


class TestGetGraphInfoCount(TestCase):
    def setUp(self) -> None:
        self.origin_graph_Service_get_graph_info_count = graph_Service.get_graph_info_count
        graph_Service.get_graph_info_count = mock.Mock(return_value=(codes.successCode, {}))

    def tearDown(self) -> None:
        graph_Service.get_graph_info_count = self.origin_graph_Service_get_graph_info_count

    def test_get_graph_info_count_success1(self):
        response = client.get('/api/builder/v1/graph/info/count',
                              query_string={'graph_id': '1'}
                              )
        self.assertEqual(response.status_code, 200)

    def test_get_graph_info_count_fail1(self):
        '''Builder_GraphController_GetGraphInfoCount_ParamError'''
        response = client.get('/api/builder/v1/graph/info/count'
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoCount_ParamError)

    def test_get_graph_info_count_fail2(self):
        '''graph_Service.get_graph_info_count 出错'''
        graph_Service.get_graph_info_count = mock.Mock(
            return_value=(codes.Builder_GraphService_GetGraphInfoCount_GraphidNotExist, {}))
        response = client.get('/api/builder/v1/graph/info/count',
                              query_string={'graph_id': '1'}
                              )
        self.assertEqual(response.status_code, 400)

    def test_get_graph_info_count_fail3(self):
        '''Builder_GraphController_GetGraphInfoCount_UnknownError'''
        graph_Service.get_graph_info_count = mock.Mock(side_effect=Exception())
        response = client.get('/api/builder/v1/graph/info/count',
                              query_string={'graph_id': '1'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoCount_UnknownError)


class TestGetGraphInfoDetail(TestCase):
    def setUp(self) -> None:
        self.origin_graph_Service_get_graph_info_detail = graph_Service.get_graph_info_detail
        graph_Service.get_graph_info_detail = mock.Mock(return_value=(codes.successCode, {}))

    def tearDown(self) -> None:
        graph_Service.get_graph_info_detail = self.origin_graph_Service_get_graph_info_detail

    def test_get_graph_info_detail_success1(self):
        response = client.get('/api/builder/v1/graph/info/detail',
                              query_string={'graph_id': '1',
                                            'type': 'entity',
                                            'name': 'entity_name'}
                              )
        self.assertEqual(response.status_code, 200)

    def test_get_graph_info_detail_fail1(self):
        '''Builder_GraphController_GetGraphInfoDetail_ParamError'''
        # graph_id不存在
        response = client.get('/api/builder/v1/graph/info/detail',
                              query_string={'type': 'entity',
                                            'name': 'entity_name'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoDetail_ParamError)
        # type不存在
        response = client.get('/api/builder/v1/graph/info/detail',
                              query_string={'graph_id': '1',
                                            'name': 'entity_name'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoDetail_ParamError)
        # type错误
        response = client.get('/api/builder/v1/graph/info/detail',
                              query_string={'graph_id': '1',
                                            'type': 'wrong',
                                            'name': 'entity_name'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoDetail_ParamError)
        # name不存在
        response = client.get('/api/builder/v1/graph/info/detail',
                              query_string={'graph_id': '1',
                                            'type': 'entity'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoDetail_ParamError)

    def test_get_graph_info_detail_fail2(self):
        '''graph_Service.get_graph_info_detail错误'''
        graph_Service.get_graph_info_detail = mock.Mock(
            return_value=(codes.Builder_GraphService_GetGraphInfoDetail_GraphidNotExist, {}))
        response = client.get('/api/builder/v1/graph/info/detail',
                              query_string={'graph_id': '1',
                                            'type': 'entity',
                                            'name': 'entity_name'}
                              )
        self.assertEqual(response.status_code, 400)

    def test_get_graph_info_detail_fail3(self):
        '''Builder_GraphController_GetGraphInfoDetail_UnknownError'''
        graph_Service.get_graph_info_detail = mock.Mock(side_effect=Exception())
        response = client.get('/api/builder/v1/graph/info/detail',
                              query_string={'graph_id': '1',
                                            'type': 'entity',
                                            'name': 'entity_name'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetGraphInfoDetail_UnknownError)


class TestCreateSubgraphConfig(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/graph/subgraph'
        self.params = json.dumps({
            "edge": [
                {
                    "edge_id": 1,
                    "colour": "#F44336",
                    "ds_name": "",
                    "dataType": "",
                    "data_source": "",
                    "ds_path": "",
                    "ds_id": "",
                    "extract_type": "",
                    "name": "contain",
                    "source_table": [],
                    "source_type": "automatic",
                    "properties": [["name", "string"]],
                    "file_type": "",
                    "task_id": "",
                    "properties_index": ["name"],
                    "model": "Contractmodel",
                    "relations": ["contract", "contain", "clause"],
                    "ds_address": "",
                    "alias": "包含"
                }
            ],
            "entity": [
                {
                    "entity_id": 1,
                    "colour": "#448AFF",
                    "ds_name": "",
                    "dataType": "",
                    "data_source": "",
                    "ds_path": "",
                    "ds_id": "",
                    "extract_type": "",
                    "name": "contract",
                    "source_table": [],
                    "source_type": "automatic",
                    "properties": [
                        ["name", "string"],
                        ["id", "string"],
                        ["number", "string"],
                        ["currency", "string"],
                        ["amount", "string"],
                        ["sign_date", "string"],
                        ["account_name", "string"],
                        ["bank", "string"],
                        ["bank_number", "string"],
                        ["tax_rate", "string"],
                        ["tax_amount", "string"],
                        ["amount_without_tax", "string"]
                    ],
                    "file_type": "",
                    "task_id": "",
                    "properties_index": [
                        "name",
                        "number",
                        "amount",
                        "sign_date",
                        "account_name",
                        "bank"
                    ],
                    "model": "Contractmodel",
                    "ds_address": "",
                    "alias": "合同"
                },
                {
                    "entity_id": 3,
                    "colour": "#ED679F",
                    "ds_name": "",
                    "dataType": "",
                    "data_source": "",
                    "ds_path": "",
                    "ds_id": "",
                    "extract_type": "",
                    "name": "clause",
                    "source_table": [],
                    "source_type": "automatic",
                    "properties": [
                        ["name", "string"],
                        ["content", "string"]
                    ],
                    "file_type": "",
                    "task_id": "",
                    "properties_index": ["name", "content"],
                    "model": "Contractmodel",
                    "ds_address": "",
                    "alias": "条款"
                }
            ],
            "graph_id": 1,
            "name": "subgraph_name_2",
            "ontology_id": 1
        })
        self.origin_create_subgraph_config = subgraph_service.create_subgraph_config
        subgraph_service.create_subgraph_config = mock.Mock(return_value=(codes.successCode, {}))

    def tearDown(self) -> None:
        subgraph_service.create_subgraph_config = self.origin_create_subgraph_config

    def test_create_subgraph_config_success(self):
        response = client.post(self.url, data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_create_subgraph_config_failed1(self):
        """Builder_GraphController_CreateSubgraphConfig_ParamError"""
        response = client.post(self.url, data=json.dumps({}))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_CreateSubgraphConfig_ParamError)

    def test_create_subgraph_config_failed2(self):
        """Builder_GraphController_CreateSubgraphConfig_UnknownError"""
        subgraph_service.create_subgraph_config = mock.Mock(side_effect=Exception('exception'))
        response = client.post(self.url, data=self.params)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_CreateSubgraphConfig_UnknownError)

    def test_create_subgraph_config_failed3(self):
        """ subgraph service error """
        subgraph_service.create_subgraph_config = mock.Mock(return_value=(500, {}))
        response = client.post(self.url, data=self.params)
        self.assertEqual(response.status_code, 500)


class TestEditSubgraphConfig(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/graph/subgraph/edit/1'
        self.params = json.dumps([
            {
                "subgraph_id": 7,
                "name": "subgraph_1",
                "entity": [{
                    "entity_id": 3,
                    "colour": "#ED679F",
                    "ds_name": "",
                    "dataType": "",
                    "data_source": "",
                    "ds_path": "",
                    "ds_id": "",
                    "extract_type": "",
                    "name": "clause",
                    "source_table": [],
                    "source_type": "automatic",
                    "properties": [
                        ["name", "string"],
                        ["content", "string"]
                    ],
                    "file_type": "",
                    "task_id": "",
                    "properties_index": ["name", "content"],
                    "model": "Contractmodel",
                    "ds_address": "",
                    "alias": "条款"
                }],
                "edge": []
            }
        ])
        self.origin_edit_subgraph_config = subgraph_service.edit_subgraph_config
        self.origin_check_by_id = graph_Service.checkById
        subgraph_service.edit_subgraph_config = mock.Mock(return_value=(codes.successCode, {}))
        graph_Service.checkById = mock.Mock(return_value=(0, {}))

    def tearDown(self) -> None:
        subgraph_service.edit_subgraph_config = self.origin_edit_subgraph_config
        graph_Service.checkById = self.origin_check_by_id

    def test_edit_subgraph_config_success(self):
        response = client.post(self.url, data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_edit_subgraph_config_failed1(self):
        """Builder_GraphController_EditSubgraphConfig_ParamError"""
        response = client.post(self.url, data=json.dumps({}))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_EditSubgraphConfig_ParamError)

    def test_edit_subgraph_config_failed2(self):
        """ parameter graph id error """
        response = client.post('/api/builder/v1/graph/subgraph/edit/-1', data=self.params)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_EditSubgraphConfig_ParamError)

    def test_edit_subgraph_config_failed3(self):
        """Builder_GraphController_EditSubgraphConfig_GraphIdNotExist"""
        graph_Service.checkById = mock.Mock(return_value=(-1, {}))
        response = client.post(self.url, data=self.params)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_EditSubgraphConfig_GraphIdNotExist)

    def test_edit_subgraph_config_failed4(self):
        """Builder_GraphController_EditSubgraphConfig_UnknownError"""
        subgraph_service.edit_subgraph_config = mock.Mock(side_effect=Exception('exception'))
        response = client.post(self.url, data=self.params)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_EditSubgraphConfig_UnknownError)

    def test_edit_subgraph_config_failed5(self):
        """ subgraph service error """
        subgraph_service.edit_subgraph_config = mock.Mock(return_value=(500, {}))
        response = client.post(self.url, data=self.params)
        self.assertEqual(response.status_code, 500)


class TestGetSubgraphList(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/graph/subgraph'
        self.origin_get_subgraph_list = subgraph_service.get_subgraph_list
        subgraph_service.get_subgraph_list = mock.Mock(return_value=(codes.successCode, {}))

    def tearDown(self) -> None:
        subgraph_service.get_subgraph_list = self.origin_get_subgraph_list

    def test_get_subgraph_list_success(self):
        response = client.get(self.url, query_string={'graph_id': '1', 'subgraph_name': 'test'})
        self.assertEqual(response.status_code, 200)

    def test_get_subgraph_list_failed1(self):
        """Builder_GraphController_GetSubgraphList_ParamError"""
        response = client.get(self.url, query_string={'graph_id': '1', 'subgraph_name': 'test', 'return_all': '1'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetSubgraphList_ParamError)

    def test_get_subgraph_list_failed2(self):
        """ subgraph service error """
        subgraph_service.get_subgraph_list = mock.Mock(return_value=(500, {}))
        response = client.get(self.url, query_string={'graph_id': '1', 'subgraph_name': 'test'})
        self.assertEqual(response.status_code, 500)

    def test_get_subgraph_list_failed3(self):
        """Builder_GraphController_GetSubgraphList_UnknownError"""
        subgraph_service.get_subgraph_list = mock.Mock(side_effect=Exception('exception'))
        response = client.get(self.url, query_string={'graph_id': '1', 'subgraph_name': 'test'})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetSubgraphList_UnknownError)


class TestGetSubgraphConfig(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/graph/subgraph/1'
        self.origin_get_subgraph_config = subgraph_service.get_subgraph_config
        subgraph_service.get_subgraph_config = mock.Mock(return_value=(codes.successCode, {}))

    def tearDown(self) -> None:
        subgraph_service.get_subgraph_config = self.origin_get_subgraph_config

    def test_get_subgraph_config_success(self):
        response = client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_get_subgraph_config_failed1(self):
        """Builder_GraphController_GetSubgraphConfig_ParamError"""
        response = client.get('/api/builder/v1/graph/subgraph/abc')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetSubgraphConfig_ParamError)

    def test_get_subgraph_config_failed2(self):
        """ subgraph service error """
        subgraph_service.get_subgraph_config = mock.Mock(return_value=(500, {}))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)

    def test_get_subgraph_config_failed3(self):
        """Builder_GraphController_GetSubgraphConfig_UnknownError"""
        subgraph_service.get_subgraph_config = mock.Mock(side_effect=Exception('exception'))
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_GetSubgraphConfig_UnknownError)


class TestDeleteSubgraphConfig(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/graph/subgraph/delete'
        self.body = {'graph_id': 1, 'subgraph_ids': [1, 2]}
        self.origin_delete_subgraph_config = subgraph_service.delete_subgraph_config
        subgraph_service.delete_subgraph_config = mock.Mock(return_value=(codes.successCode, {}))

    def tearDown(self) -> None:
        subgraph_service.delete_subgraph_config = self.origin_delete_subgraph_config

    def test_delete_subgraph_config_success(self):
        response = client.post(self.url, json=self.body)
        self.assertEqual(response.status_code, 200)

    def test_delete_subgraph_config_failed1(self):
        """Builder_GraphController_DeleteSubgraphConfig_ParamError"""
        # get param error
        response = client.post(self.url, data='{')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_DeleteSubgraphConfig_ParamError)
        # missing parameter graph_id
        response = client.post(self.url, json={'subgraph_ids': [1, 2]})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_DeleteSubgraphConfig_ParamError)
        # graph_id is not int
        response = client.post(self.url, json={'graph_id': 'a'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_DeleteSubgraphConfig_ParamError)
        # graph_id is smaller than zero
        response = client.post(self.url, json={'graph_id': -1})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_DeleteSubgraphConfig_ParamError)
        # missing parameter subgraph_id
        response = client.post(self.url, json={'graph_id': 1})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_DeleteSubgraphConfig_ParamError)
        # subgraph_ids is not list
        response = client.post(self.url, json={"subgraph_ids": 1})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_DeleteSubgraphConfig_ParamError)
        # subgraph id is not int
        response = client.post(self.url, json={"subgraph_ids": ['a']})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_DeleteSubgraphConfig_ParamError)
        # subgraph is 0
        response = client.post(self.url, json={"subgraph_ids": [0]})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_DeleteSubgraphConfig_ParamError)

    def test_delete_subgraph_config_failed2(self):
        """Builder_GraphController_DeleteSubgraphConfig_UnknownError"""
        subgraph_service.delete_subgraph_config = mock.Mock(side_effect=Exception('exception'))
        response = client.post(self.url, json=self.body)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], codes.Builder_GraphController_DeleteSubgraphConfig_UnknownError)

    def test_delete_subgraph_config_failed3(self):
        """ subgraph service error """
        subgraph_service.delete_subgraph_config = mock.Mock(return_value=(500, {}))
        response = client.post(self.url, json=self.body)
        self.assertEqual(response.status_code, 500)

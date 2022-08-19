from unittest import TestCase, mock
from main.builder_app import app
from common.errorcode import codes
from service.graph_Service import graph_Service

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
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoBasic_ParamError)
        # is_all错误
        response = client.get('/api/builder/v1/graph/info/basic',
                              query_string={'graph_id': '1',
                                            'is_all': 'wrong'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoBasic_ParamError)

    def test_get_graph_info_basic_fail2(self):
        '''Builder_GraphController_GetGraphInfoBasic_KeyTypeError'''
        # key无法被eval
        response = client.get('/api/builder/v1/graph/info/basic',
                              query_string={'graph_id': '1',
                                            'is_all': 'false',
                                            'key': '[a'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoBasic_KeyTypeError)
        # key不是列表
        response = client.get('/api/builder/v1/graph/info/basic',
                              query_string={'graph_id': '1',
                                            'is_all': 'false',
                                            'key': 'a'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoBasic_KeyTypeError)

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
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoOnto_ParamError)

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
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoOnto_UnknownError)


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
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoCount_ParamError)

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
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoCount_UnknownError)


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
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoDetail_ParamError)
        # type不存在
        response = client.get('/api/builder/v1/graph/info/detail',
                              query_string={'graph_id': '1',
                                            'name': 'entity_name'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoDetail_ParamError)
        # type错误
        response = client.get('/api/builder/v1/graph/info/detail',
                              query_string={'graph_id': '1',
                                            'type': 'wrong',
                                            'name': 'entity_name'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoDetail_ParamError)
        # name不存在
        response = client.get('/api/builder/v1/graph/info/detail',
                              query_string={'graph_id': '1',
                                            'type': 'entity'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoDetail_ParamError)

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
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoDetail_UnknownError)

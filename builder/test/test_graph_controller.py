from unittest import TestCase, mock
from controller.graph_controller import is_match
from main.builder_app import app
from common.errorcode import codes
from service.graph_Service import graph_Service

client = app.test_client()


class TestIsMatch(TestCase):
    def setUp(self):
        self.gns1 = "gns://A7BF3CFEB17F44AA8980E6D61F6EA9D1/9202357016594A039BFCDA510C59530A/FCCEBF383A6A4B4FBBCD862B975F3B88"
        self.gns2 = "gns://A7BF3CFEB17F44AA8980E6D61F6EA9D1"
        self.gns3 = "gns://A7BF3CFEB17F4"

    def test_is_match(self):
        res = is_match(self.gns1, self.gns1)
        self.assertEqual(res, True)

        res = is_match(self.gns1, self.gns2)
        self.assertEqual(res, True)

        res = is_match(self.gns2, self.gns1)
        self.assertEqual(res, True)

        res = is_match(self.gns2, self.gns3)
        self.assertEqual(res, False)

        res = is_match(self.gns3, self.gns2)
        self.assertEqual(res, False)


class TestGetGraphInfoBasic(TestCase):
    def setUp(self) -> None:
        self.origin_graph_Service_get_graph_info_basic = graph_Service.get_graph_info_basic
        graph_Service.get_graph_info_basic = mock.Mock(return_value=(codes.successCode, {}))

    def tearDown(self) -> None:
        graph_Service.get_graph_info_basic = self.origin_graph_Service_get_graph_info_basic

    def test_get_graph_info_basic_success1(self):
        response = client.get('/api/builder/v1/graph/info/basic',
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={'graph_id': '1',
                                            'is_all': 'true'}
                              )
        self.assertEqual(response.status_code, 200)

    def test_get_graph_info_basic_success2(self):
        response = client.get('/api/builder/v1/graph/info/basic',
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={'graph_id': '1',
                                            'is_all': 'false',
                                            'key': '["graph_des", "create_email", "create_user", "create_time", "update_email", "update_time", "update_user", "display_task", "export", "is_import", "is_upload", "knowledge_type", "property_id", "status", "step_num", "ds", "otl", "info_ext", "kmap", "kmerge", "mongo_name", "graphdb_name", "graphdb_type", "graphdb_address", "graphdb_id"]'}
                              )
        self.assertEqual(response.status_code, 200)

    def test_get_graph_info_basic_fail1(self):
        '''Builder_GraphController_GetGraphInfoBasic_ParamError'''
        # graph_id不存在
        response = client.get('/api/builder/v1/graph/info/basic',
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoBasic_ParamError)
        # is_all错误
        response = client.get('/api/builder/v1/graph/info/basic',
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={'graph_id': '1',
                                            'is_all': 'wrong'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoBasic_ParamError)

    def test_get_graph_info_basic_fail2(self):
        '''Builder_GraphController_GetGraphInfoBasic_KeyTypeError'''
        # key无法被eval
        response = client.get('/api/builder/v1/graph/info/basic',
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={'graph_id': '1',
                                            'is_all': 'false',
                                            'key': '[a'}
                              )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['errorcode'], codes.Builder_GraphController_GetGraphInfoBasic_KeyTypeError)
        # key不是列表
        response = client.get('/api/builder/v1/graph/info/basic',
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
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
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={'graph_id': '1',
                                            'is_all': 'true'}
                              )
        self.assertEqual(response.status_code, 400)

    def test_get_graph_info_basic_fail4(self):
        '''Builder_GraphController_GetGraphInfoBasic_UnknownError'''
        graph_Service.get_graph_info_basic = mock.Mock(side_effect=Exception())
        response = client.get('/api/builder/v1/graph/info/basic',
                              headers={'uuid': '853ba1db-4e37-11eb-a57d-0242ac190002'},
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

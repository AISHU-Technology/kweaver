import json
import unittest
from unittest import TestCase, mock
import numpy as np

from dao import subject_dao
from dao.graph_dao import graph_dao
from dao.task_dao import task_dao
from main.builder_app import app
import pandas as pd

from test import MockNebulaResponse
from utils.sentence_embedding import SentenceEncoder

client = app.test_client()


class TestCreateSubject(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/open/kc/subject"
        self.params = json.dumps({
            "kg_id": 1,
            "subject_id": 1,
            "subject_path": "/subject1/subject2",
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                            "/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": "test_subject.doc",
            "subject_desc": "test desc",
            "subject_label": [
                {"name": "test_label1"},
                {"name": "test_label2"},
                {"name": "test_label3"},
                {"name": "test_label4"},
                {"name": "test_label5"}
            ],
            "subject_document": [
                {
                    "name": "test_document.docx",
                    "gns": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                           "/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC",
                    "score": 4.44
                }
            ]
        })
        self.errParam = json.dumps({
            "kg_id": "str",
            "subject_id": "str",
            "subject_path": 1,
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                            "/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": 1,
            "subject_desc": "test desc",
            "subject_label": [
                {"name": "test_label1"},
                {"name": "test_label2"},
                {"name": "test_label3"},
                {"name": "test_label4"},
                {"name": "test_label5"}
            ],
            "subject_document": [
                {
                    "name": "test_document.docx",
                    "gns": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                           "/9ADE238BF68342CF98166BD181BF58F3/BACBD486CF054C0D940169AC33B077EC",
                    "score": 4.44
                }
            ]
        })
        self.mock1 = mock.Mock(
            return_value=(200, {"res": {"graph_baseInfo": [{'graph_Name': 'nebula测试', 'graph_des': 'sf',
                                                            'graph_db_id': 5,
                                                            'graphDBAddress': '10.4.128.147',
                                                            'graph_mongo_Name': 'mongoDB-14',
                                                            'graph_DBName': 'u3cd049e42e7511eda22f96ac5f65169d'}]}}))
        self.mock2 = mock.Mock(return_value=('success', [10, 10, "", "", ""]))

    def test_create_subject_success(self):
        """ success """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[14]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "1234", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(return_value=(200, {"result": ""}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                       data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_create_subject_failed1(self):
        """ Incorrect parameter format """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac19'}, query_string=self.params)
        self.assertEqual(response.status_code, 400)

    def test_create_subject_failed2(self):
        """ params error """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.errParam)
        self.assertEqual(response.status_code, 400)

    def test_create_subject_failed3(self):
        """ graph id not exist """
        mock1 = mock.Mock(return_value=(500, {"message": "garaph id not exist"}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', mock1):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_create_subject_failed4(self):
        """ graph otl not exits """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([], columns=["graph_otl"]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_create_subject_failed5(self):
        """ anyshare document model is not exits """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[14]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'doc', 'model':'model'}]"]], columns=["entity"]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_create_subject_failed6(self):
        """ Graph database has something wrong """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[14]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        mock2 = mock.Mock(return_value=('failed', [10, 10, "", "", ""]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                       data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_create_subject_failed7(self):
        """ knowledge is empty """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[14]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        mock2 = mock.Mock(return_value=('success', [0, 0, "", "", ""]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                       data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_create_subject_failed8(self):
        """ GraphDB ip does not exist """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[14]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([], columns=["db_user", "db_ps", "port", "type"]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                       data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_create_subject_failed9(self):
        """ orientdb internal error """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[1]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "1234", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(return_value=(200, ""))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                       data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_create_subject_failed10(self):
        """ subject_id exits """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[12]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "1234", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(return_value=(200, {"result": [1, 2]}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                       data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_create_subject_failed11(self):
        """ nebula internal error """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[4]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([[1, "1.1.1.1", "root", "YW55ZGF0YTEyMw==", "1234", "nebula"]],
                                      columns=["fulltext_id", "ip", "db_user", "db_ps", "port", "type"]))
        task_dao.getFulltextEnginebyId = mock.Mock(
            return_value=(pd.DataFrame([["1.1.1.1", "1111", "admin", "ZWlzb28uY29tMTIz"]],
                                       columns=["ip", "port", "user", "password"])))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1), \
             mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2), \
             mock.patch("dao.subject_dao.GraphDB") as mock_GraphDB:
            db = mock_GraphDB.return_value
            db.exec.return_value = 500, MockNebulaResponse(error="nebula error")
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                   data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_create_subject_failed12(self):
        """ nebula subject_id exits """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[4]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([[1, "1.1.1.1", "root", "YW55ZGF0YTEyMw==", "1234", "nebula"]],
                                      columns=["fulltext_id", "ip", "db_user", "db_ps", "port", "type"]))
        task_dao.getFulltextEnginebyId = mock.Mock(
            return_value=(pd.DataFrame([["1.1.1.1", "1111", "admin", "ZWlzb28uY29tMTIz"]],
                                       columns=["ip", "port", "user", "password"])))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1), \
             mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2), \
             mock.patch("dao.subject_dao.GraphDB") as mock_GraphDB:
            db = mock_GraphDB.return_value
            db.exec.return_value = 200, MockNebulaResponse(data=[{1}, {2}])
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                   data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_create_subject_failed13(self):
        """ nebula insert subject error """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[4]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([[1, "1.1.1.1", "root", "YW55ZGF0YTEyMw==", "1134", "nebula"]],
                                      columns=["fulltext_id", "ip", "db_user", "db_ps", "port", "type"]))
        task_dao.getFulltextEnginebyId = mock.Mock(
            return_value=(pd.DataFrame([["1.1.1.1", "1111", "admin", "ZWlzb28uY29tMTIz"]],
                                       columns=["ip", "port", "user", "password"])))
        subject_dao.insert_subject_nebula = mock.Mock(return_value=(500, "insert subject error"))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1), \
             mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2), \
             mock.patch("dao.subject_dao.GraphDB") as mock_GraphDB:
            db = mock_GraphDB.return_value
            db.exec.return_value = 200, MockNebulaResponse(data=[])
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                   data=self.params)
        self.assertEqual(response.status_code, 500)


class TestDeleteSubjectk(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/open/kc/subject/deletion"
        self.params = json.dumps({"subject_id": 1, "kg_id": 1})
        self.err_param = json.dumps({"subject_id": "s", "kg_id": "S"})
        self.mock1 = mock.Mock(
            return_value=(200, {"res": {"graph_baseInfo": [{'graph_Name': 'nebula测试', 'graph_des': 'sf',
                                                            'graph_db_id': 5,
                                                            'graphDBAddress': '10.4.128.147',
                                                            'graph_mongo_Name': 'mongoDB-14',
                                                            'graph_DBName': 'u3cd049e42e7511eda22f96ac5f65169d'}]}}))

    def test_delete_subject_success(self):
        """ success """
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "1234", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(return_value=(200, {"result": ""}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_delete_subject_failed1(self):
        """ params error """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.err_param)
        self.assertEqual(response.status_code, 400)

    def test_delete_subject_failed2(self):
        """ Incorrect parameter format """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac19'}, query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_delete_subject_failed3(self):
        """ graph id not exist """
        mock1 = mock.Mock(
            return_value=(500, {"message": "garaph id not exist", "code": "500101", "cause": "garaph id not exist"}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', mock1):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190012'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_delete_subject_failed4(self):
        """ OrientDB ip does not exist """
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([], columns=["db_user", "db_ps", "port", "type"]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.params)
        self.assertEqual(response.status_code, 500)


class TestUpdateSubject(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/open/kc/subject/update"
        self.params = json.dumps({
            "kg_id": 1,
            "subject_id": 1,
            "subject_path": "/subject1/subject2",
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                            "/9ADE238BF68342CF98166BD181BF58F2",
            "subject_name": "test_subject",
            "subject_desc": "test desc",
            "subject_label": [
                {"name": "test_label1"},
                {"name": "test_label2"},
                {"name": "test_label3"},
                {"name": "test_label4"},
                {"name": "test_label5"}
            ],
            "subject_document": [
                {
                    "name": "test_document.docx",
                    "gns": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                           "/9ADE238BF68342CF98166BD181BF58F2/BACBD486CF054C0D940169AC33B077EC",
                    "score": 4.44
                }
            ]
        })
        self.errParam = json.dumps({
            "kg_id": "str",
            "subject_id": "str",
            "subject_path": 1,
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                            "/9ADE238BF68342CF98166BD181BF58F2",
            "subject_name": 1,
            "subject_desc": "test desc",
            "subject_label": [
                {"name": "test_label1"},
                {"name": "test_label2"},
                {"name": "test_label3"},
                {"name": "test_label4"},
                {"name": "test_label5"}
            ],
            "subject_document": [
                {
                    "name": "test_document.docx",
                    "gns": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                           "/9ADE238BF68342CF98166BD181BF58F2/BACBD486CF054C0D940169AC33B077EC",
                    "score": 4.44
                }
            ]
        })
        self.mock1 = mock.Mock(
            return_value=(200, {"res": {"graph_baseInfo": [{'graph_Name': 'nebula测试', 'graph_des': 'sf',
                                                            'graph_db_id': 5,
                                                            'graphDBAddress': '10.4.128.147',
                                                            'graph_mongo_Name': 'mongoDB-14',
                                                            'graph_DBName': 'u3cd049e42e7511eda22f96ac5f651694'}]}}))
        self.mock2 = mock.Mock(return_value=('success', [10, 10, "", "", ""]))

    def test_update_subject_success(self):
        """ success """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[11]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "1234", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(return_value=(200, {"result": [{"@rid": 1}]}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.post(
                    self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_update_subject_failed1(self):
        """ params error """
        response = client.post(
            self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.errParam)
        self.assertEqual(response.status_code, 400)

    def test_update_subject_failed2(self):
        """Incorrect parameter format """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac19'}, query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_update_subject_failed3(self):
        """ graph id not exist """
        mock1 = mock.Mock(
            return_value=(500, {"message": "garaph id not exist", "code": "500101", "cause": "garaph id not exist"}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', mock1):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac191002'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_update_subject_failed4(self):
        """ graph otl not exits """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([], columns=["graph_otl"]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190012'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_update_subject_failed5(self):
        """ anyshare document model is not exits """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[14]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'doc', 'model':'model'}]"]], columns=["entity"]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190102'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_update_subject_failed6(self):
        """ Graph database has something wrong """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[41]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        mock2 = mock.Mock(return_value=('failed', [10, 10, "", "", ""]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190102'},
                                       data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_update_subject_failed7(self):
        """ knowledge is empty """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[41]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        mock2 = mock.Mock(return_value=('success', [0, 0, "", "", ""]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac191002'},
                                       data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_update_subject_failed8(self):
        """ GraphDB ip does not exist """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[41]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([], columns=["db_user", "db_ps", "port", "type"]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac191002'},
                                       data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_update_subject_failed9(self):
        """ orientdb internal error """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[15]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "123", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(return_value=(200, ""))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac191002'},
                                       data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_update_subject_failed10(self):
        """ subject_id not exits """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[19]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "1134", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(return_value=(200, {"result": []}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac191002'},
                                       data=self.params)
        self.assertEqual(response.status_code, 500)


class TestGetSubject(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/open/kc/subject/document"
        self.params = {"subject_id": 1, "kg_id": 1, "page": 1, "limit": 10}
        self.errParam = {"subject_id": "s", "kg_id": "s", "page": 1}
        self.mock1 = mock.Mock(
            return_value=(200, {"res": {"graph_baseInfo": [{'graph_Name': 'nebula测试', 'graph_des': 'sf',
                                                            'graph_db_id': 5,
                                                            'graphDBAddress': '10.4.128.147',
                                                            'graph_mongo_Name': 'mongoDB-14',
                                                            'graph_DBName': 'u3cd049e41e7511eda22f96ac5f651694'}]}}))
        self.mock2 = mock.Mock(return_value=('success', [10, 10, "", "", ""]))

    def test_get_subject_success1(self):
        """ success """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[11]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "1234", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(
            return_value=(200, {"result": [{"in.gns": "1", "score": 1.11, "in.name": "name"}]}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.get(
                    self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, query_string=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_subject_success2(self):
        """ anyshare document model is not exits """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[14]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'doc', 'model':'model'}]"]], columns=["entity"]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            response = client.get(
                self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, query_string=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_subject_failed1(self):
        """ params error """
        response = client.get(
            self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, query_string=self.errParam)
        self.assertEqual(response.status_code, 400)

    def test_get_subject_failed2(self):
        """ graph id not exist """
        mock1 = mock.Mock(
            return_value=(500, {"message": "garaph id not exist", "code": "500101", "cause": "garaph id not exist"}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', mock1):
            response = client.get(
                self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_get_subject_failed3(self):
        """ graph otl not exits """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([], columns=["graph_otl"]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            response = client.get(
                self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_get_subject_failed4(self):
        """ Graph database has something wrong """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[21]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        mock2 = mock.Mock(return_value=('failed', [10, 10, "", "", ""]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', mock2):
                response = client.get(
                    self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_get_subject_failed5(self):
        """ knowledge is empty """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[21]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        mock2 = mock.Mock(return_value=('success', [0, 0, "", "", ""]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', mock2):
                response = client.get(
                    self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_get_subject_failed6(self):
        """ GraphDB ip does not exist """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[21]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([], columns=["db_user", "db_ps", "port", "type"]))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.get(
                    self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_get_subject_failed7(self):
        """ orientdb internal error """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[12]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "123", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(return_value=(200, ""))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.get(
                    self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_get_subject_failed8(self):
        """ subject_id not exits """
        graph_dao.get_graph_otl_id = mock.Mock(return_value=pd.DataFrame([["[11]"]], columns=["graph_otl"]))
        graph_dao.get_graph_entity_otl_info_by_id = mock.Mock(
            return_value=pd.DataFrame([["[{'name': 'document', 'model':'Anysharedocumentmodel'}]"]],
                                      columns=["entity"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "1134", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(return_value=(200, {"result": []}))
        with mock.patch('service.graph_Service.graph_Service.getGraphById', self.mock1):
            with mock.patch('controller.graph_count_controller.getGraphCountByid', self.mock2):
                response = client.get(
                    self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, query_string=self.params)
        self.assertEqual(response.status_code, 500)


class TestSearchSubject(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/open/kc/subject/search"
        self.params = json.dumps({
            "kg_id": 1,
            "subject_path": "/subject1/subject2",
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                            "/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": "test_subject.docx",
            "subject_desc": "world",
            "subject_label": [
                {"name": "test_label1"},
                {"name": "test_label2"},
                {"name": "test_label3"},
                {"name": "test_label4"},
                {"name": "test_label5"}
            ],
            "page": 1,
            "limit": 20
        })
        self.vectorParams = json.dumps({
            "kg_id": 1,
            "subject_path": "/subject1/subject2",
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                            "/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": "test_subject.docx",
            "subject_desc": "world",
            "subject_label": [
                {"name": "test_label1"},
                {"name": "test_label2"},
                {"name": "test_label3"},
                {"name": "test_label4"},
                {"name": "test_label5"}
            ],
            "page": 1,
            "limit": 20,
            "search_type": "vector"
        })
        self.fullTextParams = json.dumps({
            "kg_id": 1,
            "subject_path": "/subject1/subject2",
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                            "/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": "test_subject.docx",
            "subject_desc": "world",
            "subject_label": [
                {"name": "test_label1"},
                {"name": "test_label2"},
                {"name": "test_label3"},
                {"name": "test_label4"},
                {"name": "test_label5"}
            ],
            "page": 1,
            "limit": 20,
            "search_type": "full-text"
        })
        self.errParam = json.dumps({
            "kg_id": "s",
            "subject_path": 1,
            "subject_fold": "gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                            "/9ADE238BF68342CF98166BD181BF58F3",
            "subject_name": "test_subject.docx",
            "subject_desc": "world",
            "page": 1,
            "limit": 20
        })

    def test_search_subject_success1(self):
        """ success """
        graph_dao.getbyid = mock.Mock(
            return_value=pd.DataFrame([["[{'graph_Name': 'test_orientdb', 'graph_des': 'des', 'graph_db_id': 1, "
                                        "'graphDBAddress': '1.1.1.1', 'graph_mongo_Name': 'mongoDB-1', "
                                        "'graph_DBName': 'u174db4c33e3e11ed866efe7fcd1d44c2'}]", 1]],
                                      columns=["graph_baseInfo", "graph_db_id"]))
        subject_dao.execute_orient_command = mock.Mock(
            return_value=(200, {"result": [{"gns": "gns://DA5596D930134D7B8", "score": 1.11, "name": "test"}]}))
        with mock.patch("dao.subject_dao.TextMatchTask") as TmtClass:
            tmt = TmtClass.return_value
            tmt.search_subject.return_value = [{"score": 1.11, "name": "test", "gns": "gns://DA5596D930134D7B8"}]
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_search_subject_success2(self):
        """ search_type is vector success """
        graph_dao.getbyid = mock.Mock(
            return_value=pd.DataFrame([["[{'graph_Name': 'test_orientdb', 'graph_des': 'des', 'graph_db_id': 1, "
                                        "'graphDBAddress': '1.1.1.1', 'graph_mongo_Name': 'mongoDB-1', "
                                        "'graph_DBName': 'u174db4c33e3e11ed866efe7fcd1d44c2'}]", 1]],
                                      columns=["graph_baseInfo", "graph_db_id"]))
        with mock.patch("dao.subject_dao.TextMatchTask") as TmtClass:
            tmt = TmtClass.return_value
            tmt.search_subject.return_value = [{"score": 1.11, "name": "test", "gns": "gns://DA5596D930134D7B1"}]
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac'}, data=self.vectorParams)
        self.assertEqual(response.status_code, 200)

    def test_search_subject_success3(self):
        """ search_type is full-text success"""
        graph_dao.getbyid = mock.Mock(
            return_value=pd.DataFrame([["[{'graph_Name': 'test_orientdb', 'graph_des': 'des', 'graph_db_id': 1, "
                                        "'graphDBAddress': '1.1.1.1', 'graph_mongo_Name': 'mongoDB-1', "
                                        "'graph_DBName': 'u174db4c33e3e11ed866efe7fcd1d44c2'}]", 1]],
                                      columns=["graph_baseInfo", "graph_db_id"]))
        subject_dao.execute_orient_command = mock.Mock(
            return_value=(200, {"result": [{"gns": "gns://DA5596D930134D7B8", "score": 1.11, "name": "test"}]}))
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac19'}, data=self.fullTextParams)
        self.assertEqual(response.status_code, 200)

    def test_search_subject_failed1(self):
        """ params error """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.errParam)
        self.assertEqual(response.status_code, 400)

    def test_search_subject_failed2(self):
        """ Incorrect parameter format """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac19'}, query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_search_subject_failed3(self):
        """ graph id not exist """
        graph_dao.getbyid = mock.Mock(
            return_value=pd.DataFrame([], columns=["graph_baseInfo", "graph_db_id"]))
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_search_subject_failed4(self):
        """ orientdb internal error """
        graph_dao.getbyid = mock.Mock(
            return_value=pd.DataFrame([["[{'graph_Name': 'test_orientdb', 'graph_des': 'des', 'graph_db_id': 1, "
                                        "'graphDBAddress': '1.1.1.1', 'graph_mongo_Name': 'mongoDB-1', "
                                        "'graph_DBName': 'u174db4c33e3e11ed866efe7fcd1d44c2'}]", 1]],
                                      columns=["graph_baseInfo", "graph_db_id"]))
        subject_dao.execute_orient_command = mock.Mock(
            return_value=(500, {}))
        with mock.patch("dao.subject_dao.TextMatchTask") as TmtClass:
            tmt = TmtClass.return_value
            tmt.search_subject.return_value = [{"score": 1.11, "name": "test", "gns": "gns://DA5596D930134D71111"}]
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}, data=self.params)
        self.assertEqual(response.status_code, 500)


class TestSearchKgsSubject(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/open/kc/subject/knowledge_graphs/search"
        self.params = json.dumps({
            "kg_id_list": [80],
            "subject_path": "/subject1/subject2",
            "subject_fold": ["gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                             "/9ADE238BF68342CF98166BD181BF58F3"],
            "subject_name": "subject",
            "subject_desc": "world",
            "subject_label": [
                {"name": "label1"},
                {"name": "label2"},
                {"name": "label3"},
                {"name": "label4"},
                {"name": "label5"}
            ],
            "page": 1,
            "limit": 20,
            "filter_documents": [""],
            "doc_title_keyword": "doc"
        })
        self.errParam = json.dumps({
            "kg_id_list": 80,
            "subject_path": 1,
            "subject_fold": ["gns://DA5596D930134D7B8BBB230BF9D4A0D6/C28470929BE34641982B32D54DC7F29F"
                             "/9ADE238BF68342CF98166BD181BF58F3"],
            "subject_name": "subject",
            "subject_desc": "world"
        })

    def test_search_kgs_subject_success(self):
        """ success """
        graph_dao.getbyid = mock.Mock(
            return_value=pd.DataFrame([["[{'graph_Name': 'test_orientdb', 'graph_des': 'des', 'graph_db_id': 1, "
                                        "'graphDBAddress': '1.1.1.1', 'graph_mongo_Name': 'mongoDB-1', "
                                        "'graph_DBName': 'u174db4c33e3e11ed866efe7fcd1d44c2'}]", 1]],
                                      columns=["graph_baseInfo", "graph_db_id"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "1134", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(
            return_value=(200, {"result": [{"gns": "gns://DA5596D930134D7B8", "score": 1.11, "name": "test"}]}))
        with mock.patch("dao.subject_dao.TextMatchTask") as TmtClass:
            tmt = TmtClass.return_value
            tmt.search_subject.return_value = [{"score": 1.11, "name": "test", "gns": "gns://DA5596D930134D7B8"}]
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_search_kgs_subject_failed1(self):
        """ params error """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.errParam)
        self.assertEqual(response.status_code, 400)

    def test_search_kgs_subject_failed2(self):
        """ Incorrect parameter format """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac'}, query_string=self.errParam)
        self.assertEqual(response.status_code, 400)

    def test_search_kgs_subject_failed3(self):
        """ graph id not exist """
        graph_dao.getbyid = mock.Mock(return_value=pd.DataFrame([], columns=["graph_baseInfo", "graph_db_id"]))
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_search_kgs_subject_failed4(self):
        """ GraphDB ip not exist """
        graph_dao.getbyid = mock.Mock(
            return_value=pd.DataFrame([["[{'graph_Name': 'test_orientdb', 'graph_des': 'des', 'graph_db_id': 1, "
                                        "'graphDBAddress': '1.1.1.1', 'graph_mongo_Name': 'mongoDB-1', "
                                        "'graph_DBName': 'u174db4c33e3e11ed866efe7fcd1d44c2'}]", 1]],
                                      columns=["graph_baseInfo", "graph_db_id"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([], columns=["db_user", "db_ps", "port", "type"]))
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_search_kgs_subject_failed5(self):
        """ orientdb internal error """
        graph_dao.getbyid = mock.Mock(
            return_value=pd.DataFrame([["[{'graph_Name': 'test_orientdb', 'graph_des': 'des', 'graph_db_id': 1, "
                                        "'graphDBAddress': '1.1.1.1', 'graph_mongo_Name': 'mongoDB-1', "
                                        "'graph_DBName': 'u174db4c33e3e11ed866efe7fcd1d44c1'}]", 1]],
                                      columns=["graph_baseInfo", "graph_db_id"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([["root", "YW55ZGF0YTEyMw==", "1114", "orientdb"]],
                                      columns=["db_user", "db_ps", "port", "type"]))
        subject_dao.execute_orient_command = mock.Mock(
            return_value=(500, {}))
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_search_kgs_subject_failed6(self):
        """ nebula internal error """
        graph_dao.getbyid = mock.Mock(
            return_value=pd.DataFrame([["[{'graph_Name': 'test_orientdb', 'graph_des': 'des', 'graph_db_id': 1, "
                                        "'graphDBAddress': '1.1.1.1', 'graph_mongo_Name': 'mongoDB-1', "
                                        "'graph_DBName': 'u174db4c33e3e11ed866efe7fcd1d44c2'}]", 1]],
                                      columns=["graph_baseInfo", "graph_db_id"]))
        task_dao.getGraphDBbyId = mock.Mock(
            return_value=pd.DataFrame([[1, "1.1.1.1", "root", "YW55ZGF0YTEyMw==", "1114", "nebula"]],
                                      columns=["fulltext_id", "ip", "db_user", "db_ps", "port", "type"]))
        subject_dao.search_subject_nebula = mock.Mock(return_value=(500, {}))
        task_dao.getFulltextEnginebyId = mock.Mock(
            return_value=(pd.DataFrame([["1.1.1.1", "1111", "admin", "ZWlzb28uY29tMTIz"]],
                                       columns=["ip", "port", "user", "password"])))
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.params)
        self.assertEqual(response.status_code, 500)


class TestGetEmbeddings(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/open/kc/embedding"
        self.params = json.dumps({
            "text": [
                ["标题1", "摘要1", "内容1"],
                ["标题2", "摘要2", "内容2"],
                ["标题3", "摘要3", "内容3"]
            ],
            "type": "mean",
            "weights": [0.5, 0.3, 0.2]
        })
        self.errParam = json.dumps({
            "text": [
                ["标题1", "摘要1", "内容1"],
                ["标题2", "摘要2", "内容2"],
                ["标题3", "摘要3", "内容3"]
            ],
            "type": 1,
            "weights": "s"
        })
        self.maxParam = json.dumps({
            "text": [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [],
                     [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [],
                     [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [],
                     [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [],
                     [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [],
                     [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []],
            "type": "mean",
            "weights": [0.5, 0.3, 0.2]})

    def test_get_embedding_success(self):
        """ success """
        def __init__(self, embed_model, max_sequence_length=512, embed_dim=300, pooling_method="mean"):
            self.max_sequence_length = max_sequence_length
            self.embed_model = embed_model
            self.embed_dim = embed_dim
            self.pooling_method = pooling_method
        with mock.patch.object(SentenceEncoder, '__init__', __init__), \
                mock.patch('controller.celery_controller_open_kc.SentenceEncoder') as SentenceEncoderClass:
            sentenceEncoder = SentenceEncoderClass.return_value
            sentenceEncoder.get_document_embedding.return_value = np.array([[1], [2], [3]])
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.params)

        self.assertEqual(response.status_code, 200)

    def test_get_embedding_failed1(self):
        """ params error """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.errParam)
        self.assertEqual(response.status_code, 400)

    def test_get_embedding_failed2(self):
        """ text processed exceeds the maximum batch """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.maxParam)
        self.assertEqual(response.status_code, 500)


class TestGetTopicWords(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/open/kc/topics"
        self.params = json.dumps({"gns": ["gns://DA5596D930134D7B8BBB230BF9D/C28470929BE34641982B32D54DC"], "kg_id": 1})
        self.errParam = json.dumps({"gns": "gns://DA5596D930134D7B8BBB230BF9D4/C28470929BE34641982B32", "kg_id": "s"})

    def test_get_topic_words_success(self):
        """ success """
        with mock.patch("service.graph_Service.graph_Service.checkById", mock.Mock(return_value=(0, {}))), \
                mock.patch("service.graph_Service.graph_Service.get_topic_by_gns", mock.Mock(return_value=(0, {}))):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_topic_words_failed1(self):
        """ params error """
        response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.errParam)
        self.assertEqual(response.status_code, 400)

    def test_get_topic_words_failed2(self):
        """ kg_id not exist """
        with mock.patch("service.graph_Service.graph_Service.checkById", mock.Mock(return_value=(-1, {"code": "err"}))):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_get_topic_words_failed3(self):
        """ internal error """
        with mock.patch("service.graph_Service.graph_Service.checkById", mock.Mock(return_value=(0, {}))), \
                mock.patch("service.graph_Service.graph_Service.get_topic_by_gns",
                           mock.Mock(return_value=(-1, {"message": "err", "cause": "err"}))):
            response = client.post(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190001'}, data=self.params)
        self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()

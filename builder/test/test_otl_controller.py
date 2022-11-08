import json
import unittest
from unittest import TestCase, mock

from dao.dsm_dao import dsm_dao
from dao.otl_dao import otl_dao

from main.builder_app import app
from dao.graph_dao import graph_dao
from test import MockResponse
import pandas as pd
import requests
from utils.common_response_status import CommonResponseStatus

client = app.test_client()


class TestGetTable(TestCase):
    def setUp(self) -> None:
        self.url = '/api/builder/v1/onto/gettabbydsn'
        self.getTableParams = {"ds_id": 1, "data_source": "mysql"}

    def test_get_table_success(self):
        """ success """
        my_mock = mock.Mock(return_value=(200, {}))
        with mock.patch('service.Otl_Service.otl_service.showtables', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.getTableParams
                                  )
        self.assertEqual(response.status_code, 200)

    def test_get_table_failed1(self):
        """ params error """
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"ds_id": "abc", "data_source": "as7"}
                              )
        self.assertEqual(response.status_code, 400)

    def test_get_table_failed2(self):
        """ Show table False """
        my_mock = mock.Mock(return_value=(500, {'cause': 'data_source_table`s data_source != param data_source',
                                                'code': CommonResponseStatus.PARAMETERS_ERROR.value,
                                                'message': 'Show table False'}))
        with mock.patch('service.Otl_Service.otl_service.showtables', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.getTableParams
                                  )
        self.assertEqual(response.status_code, 400)


class TestFilterByPostfix(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/dirlist"
        self.filterByPostfixParams = {"ds_id": 1, "docid": "4A27F90691C544D999A543EA6F057479", "postfix": "json"}
        self.dataSourceRow = [[1, 'mysql2', 'structured', 'mysql', 'anydata', 'UXdlMTIzIUAj', '10.4.1.1', 3306,
                               'anydata', 'standardExtraction', '', '', '', '', 1, '2022-08-24 16:41:12',
                               '2022-08-24 16:41:12']]
        self.dataSourceColumn = ['id', 'dsname', 'dataType', 'data_source', 'ds_user', 'ds_password', 'ds_address',
                                 'ds_port', 'ds_path', 'extract_type', 'ds_auth', 'vhost', 'queue', 'json_schema',
                                 'knw_id', 'create_time', 'update_time']

    def test_filter_by_postfix_success(self):
        """ success """
        dsm_dao.getdatabyid = mock.Mock(return_value=pd.DataFrame(self.dataSourceRow, columns=self.dataSourceColumn))
        otl_dao.filter_by_postfix = mock.Mock(return_value=(200, {}))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.filterByPostfixParams
                              )
        self.assertEqual(response.status_code, 200)

    def test_filter_by_postfix_failed1(self):
        """ params error """
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"ds_id": "abc", "docid": 123, "postfix": 123}
                              )
        self.assertEqual(response.status_code, 400)

    def test_filter_by_postfix_failed2(self):
        """ extract_type is standardExtraction, postfix must be json or cvs """
        dsm_dao.getdatabyid = mock.Mock(return_value=pd.DataFrame(self.dataSourceRow, columns=self.dataSourceColumn))
        otl_dao.filter_by_postfix = mock.Mock(return_value=(200, {}))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"ds_id": 1, "docid": "4A27F90691C544D999A543EA6F057479", "postfix": "all"}
                              )
        self.assertEqual(response.status_code, 500)

    def test_filter_by_postfix_failed3(self):
        """ extract_type is modelExtraction, postfix must be all """
        dataSourceRow = [[1, 'mysql2', 'structured', 'mysql', 'anydata', 'UXdlMTIzIUAj', '10.4.1.1', 3306,
                          'anydata', 'modelExtraction', '', '', '', '', 1, '2022-08-24 16:41:12',
                          '2022-08-24 16:41:12']]
        dsm_dao.getdatabyid = mock.Mock(return_value=pd.DataFrame(dataSourceRow, columns=self.dataSourceColumn))
        otl_dao.filter_by_postfix = mock.Mock(return_value=(200, {}))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.filterByPostfixParams
                              )
        self.assertEqual(response.status_code, 500)

    def test_filter_by_postfix_failed4(self):
        """ id not exist """
        dsm_dao.getdatabyid = mock.Mock(return_value=[])
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.filterByPostfixParams
                              )
        self.assertEqual(response.status_code, 500)


class TestDataPreview(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/previewdata"
        self.dataPreviewParams = {"ds_id": 1, "data_source": "mysql", "name": "table_name"}
        self.dataSourceRow = [[1, 'mysql2', 'structured', 'mysql', 'anydata', 'UXdlMTIzIUBj', '10.4.1.1', 3306,
                               'anydata', 'standardExtraction', '', '', '', '', 1, '2022-08-24 16:41:12',
                               '2022-08-24 16:41:12']]
        self.dataSourceColumn = ['id', 'dsname', 'dataType', 'data_source', 'ds_user', 'ds_password', 'ds_address',
                                 'ds_port', 'ds_path', 'extract_type', 'ds_auth', 'vhost', 'queue', 'json_schema',
                                 'knw_id', 'create_time', 'update_time']

    def test_data_preview_success(self):
        """ success """
        dsm_dao.getdatabyid = mock.Mock(return_value=pd.DataFrame(self.dataSourceRow, columns=self.dataSourceColumn))
        otl_dao.mysqldatashow = mock.Mock(return_value=0)
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.dataPreviewParams
                              )
        self.assertEqual(response.status_code, 200)

    def test_data_preview_failed1(self):
        """ params error """
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"ds_id": "ab", "data_source": "a", "name": "table_name"}
                              )
        self.assertEqual(response.status_code, 400)

    def test_data_preview_failed2(self):
        """ param data_source not is table data_source """
        dsm_dao.getdatabyid = mock.Mock(return_value=pd.DataFrame(self.dataSourceRow, columns=self.dataSourceColumn))
        otl_dao.mysqldatashow = mock.Mock(return_value=0)
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"ds_id": 1, "data_source": "hive", "name": "table_name"}
                              )
        self.assertEqual(response.status_code, 400)

    def test_data_preview_failed3(self):
        """ id not exist """
        dsm_dao.getdatabyid = mock.Mock(return_value=[])
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"ds_id": 1, "data_source": "hive", "name": "table_name"}
                              )
        self.assertEqual(response.status_code, 500)

    def test_data_preview_failed4(self):
        """ mysql password decryption failed """
        dsm_dao.getdatabyid = mock.Mock(return_value=pd.DataFrame(self.dataSourceRow, columns=self.dataSourceColumn))
        otl_dao.mysqldatashow = mock.Mock(return_value="-1")
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"ds_id": 1, "data_source": "mysql", "name": "table_name"}
                              )
        self.assertEqual(response.status_code, 500)

    def test_data_preview_failed5(self):
        """ exception """
        dsm_dao.getdatabyid = mock.Mock(return_value=pd.DataFrame(self.dataSourceRow, columns=self.dataSourceColumn))
        otl_dao.mysqldatashow = mock.Mock(side_effect=Exception("database"))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"ds_id": 1, "data_source": "mysql", "name": "table_name"}
                              )
        self.assertEqual(response.status_code, 500)


class TestPredictOntology(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/auto/autogenschema"
        self.predictOntologyParams = json.dumps({"ds_id": "1",
                                                 "data_source": "mysql",
                                                 "file_list": [{
                                                     "docid": "gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/667CDDD12E364766B72F8652F624A072",
                                                     "name": "cuostomer.csv",
                                                     "type": "file"}],
                                                 "step": "",
                                                 "extract_type": "standardExtraction",
                                                 "postfix": "cvs"
                                                 })

    def test_predict_ontology_success(self):
        """ success """
        my_mock = mock.Mock(return_value=(200, {}))
        with mock.patch('service.Otl_Service.otl_service.predict_ontology', my_mock):
            response = client.post(self.url,
                                   headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                   data=self.predictOntologyParams
                                   )
        self.assertEqual(response.status_code, 200)

    def test_predict_ontology_failed1(self):
        """ params error """
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({"ds_id": "1",
                                                "data_source": "as",
                                                "file_list": [{
                                                    "docid": "gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/667CDDD12E364766B72F8652F624A072",
                                                    "name": "cuostomer.csv",
                                                    "type": "file"}],
                                                "step": "",
                                                "extract_type": "standardExtraction",
                                                "postfix": "cvs"
                                                })
                               )
        self.assertEqual(response.status_code, 400)

    def test_predict_ontology_failed2(self):
        """ service exception """
        my_mock = mock.Mock(return_value=(500, {"cause": "cause",
                                                "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                                                "message": "message"}))
        with mock.patch('service.Otl_Service.otl_service.predict_ontology', my_mock):
            response = client.post(self.url,
                                   headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                   data=self.predictOntologyParams
                                   )
        self.assertEqual(response.status_code, 400)


class TestSaveOntology(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/saveontology"
        self.saveOntologyParams = json.dumps({"ontology_name": "ontology_name",
                                              "ontology_des": "ontology_des",
                                              "entity": [{
                                                  "colour": "#546CFF",
                                                  "dataTtype": "data type(structured, unstructured)",
                                                  "ds_name": "data source name or ontology name",
                                                  "extract_type": "standardExtraction",
                                                  "file_type": "file type，data sources such as csv, mysql don't have file type",
                                                  "model": "aishu",
                                                  "name": "entity1",
                                                  "properties": [
                                                      [
                                                          "name",
                                                          "string"
                                                      ]
                                                  ],
                                                  "relations": [
                                                      "entity1",
                                                      "edge1",
                                                      "entity2"
                                                  ],
                                                  "source": [
                                                      "docid",
                                                      "table"
                                                  ],
                                                  "source_type": " automatic,manual,import"
                                              }
                                              ],
                                              "edge": [{
                                                  "colour": "#123CDF",
                                                  "dataType": "data type(structured, unstructured)",
                                                  "data_source": "as",
                                                  "ds_name": "data source name or ontology name",
                                                  "ds_path": "123",
                                                  "extract_type": "standardExtraction",
                                                  "file_type": "file type，data sources such as csv, mysql don't have file type",
                                                  "id": "7",
                                                  "model": "aishu",
                                                  "name": "entity1",
                                                  "properties": [
                                                      [
                                                          "name",
                                                          "string"
                                                      ],
                                                      [
                                                          "age",
                                                          "int"
                                                      ]
                                                  ],
                                                  "source": [
                                                      "docid",
                                                      "table"
                                                  ],
                                                  "source_type": " automatic,manual,import"
                                              }]})
        self.errParams = json.dumps(
            {"ontology_name": "ontology_name，", "ontology_des": "ontology_des", "entity": "entity"})

    def test_save_ontology_success(self):
        """ success """
        my_mock = mock.Mock(return_value=(200, {}, 1))
        with mock.patch('service.Otl_Service.otl_service.ontology_save', my_mock):
            response = client.post(self.url,
                                   headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                   data=self.saveOntologyParams
                                   )
        self.assertEqual(response.status_code, 200)

    def test_save_ontology_failed1(self):
        """ params error """
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.errParams
                               )
        self.assertEqual(response.status_code, 400)

    def test_save_ontology_failed2(self):
        """ service exception """
        my_mock = mock.Mock(return_value=(500, {"cause": "service exception",
                                                "code": CommonResponseStatus.USRPASS_ERROR.value,
                                                "message": "insert fail"}, -1))
        with mock.patch('service.Otl_Service.otl_service.ontology_save', my_mock):
            response = client.post(self.url,
                                   headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                   data=self.saveOntologyParams
                                   )
        self.assertEqual(response.status_code, 500)


class TestGetModelList(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/modellist"

    def test_get_model_list_success(self):
        """ success """
        otl_dao.getmodelschema = mock.Mock(return_value={"res": "res"})
        response = client.get(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 200)

    def test_get_model_list_failed1(self):
        """ database error"""
        otl_dao.getmodelschema = mock.Mock(side_effect=Exception("database"))
        response = client.get(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 500)


class TestGetModelSpo(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/modelspo"

    def test_get_model_spo_success(self):
        """ success """
        otl_dao.getmodelspo = mock.Mock(return_value={})
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"model": "AImodel"}
                              )
        self.assertEqual(response.status_code, 200)

    def test_get_model_spo_failed1(self):
        """ params error"""
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"model": "model_name"}
                              )
        self.assertEqual(response.status_code, 400)

    def test_get_model_spo_failed2(self):
        """ database error """
        otl_dao.getmodelspo = mock.Mock(side_effect=Exception("SQL"))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"model": "AImodel"}
                              )
        self.assertEqual(response.status_code, 500)


class TestGetModelOtl(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/getmodelotl"
        self.params = json.dumps({"model": "AImodel", "file_list": [
            [
                "gns://3B3FDF44E3FD48FEB0F0C38C0C4D9C13/C6B5BF7F283144E897CA818707F14812/AE3E13B7F7674CF7BA6C48D420D1AD07",
                "anyshare//anydata研发线//aaa.csv",
                "aaa.csv"
            ]
        ]})

    def test_get_model_otl_success(self):
        """ success """
        otl_dao.getmodelotl = mock.Mock(return_value={})
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_model_otl_failed1(self):
        """ params error """
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({"model": "model_name", "file_list": []}))
        self.assertEqual(response.status_code, 400)

    def test_get_model_otl_failed2(self):
        """ database error """
        otl_dao.getmodelotl = mock.Mock(side_effect=Exception("SQL"))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 500)


class TestGetAll(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/getotl"
        self.params = {"page": 1, "size": 5, "order": "ascend", "knw_id": 1}

    def test_get_all_success1(self):
        """ data source list not empty success"""
        my_mock = mock.Mock(return_value=(200, {}))
        with mock.patch('service.Otl_Service.otl_service.getall', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_all_success2(self):
        """ data source list empty success"""
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_all_failed1(self):
        """ params error """
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"page": "ab", "size": "abc", "order": 1})
        self.assertEqual(response.status_code, 400)

    def test_get_all_failed2(self):
        """ service exception """
        my_mock = mock.Mock(return_value=(500, {"cause": "you have an error in your SQL!",
                                                "code": CommonResponseStatus.REQUEST_ERROR.value,
                                                "message": "query ontology fail"}))
        with mock.patch('service.Otl_Service.otl_service.getall', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.params)
        self.assertEqual(response.status_code, 500)


class TestDelOtl(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/delotlbyids"
        self.params = json.dumps({"otlids": [1, 2, 3, 4, 5, 6]})

    def test_del_otl_success(self):
        """ success """
        my_mock = mock.Mock(return_value=(200, {"res": "delete success"}))
        with mock.patch('service.Otl_Service.otl_service.delete', my_mock):
            response = client.delete(self.url,
                                     headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                     data=self.params
                                     )
        self.assertEqual(response.status_code, 200)

    def test_del_otl_failed1(self):
        """ params error """
        response = client.delete(self.url,
                                 headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                 data=json.dumps({"otlids": ["b", "a", "c"]})
                                 )
        self.assertEqual(response.status_code, 400)

    def test_del_otl_failed3(self):
        """ service exception """
        my_mock = mock.Mock(return_value=(500, {"cause": "you have an error in your SQL!",
                                                "code": CommonResponseStatus.REQUEST_ERROR.value,
                                                "message": "delete failed!"}))
        with mock.patch('service.Otl_Service.otl_service.delete', my_mock):
            response = client.delete(self.url,
                                     headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                     data=self.params
                                     )
        self.assertEqual(response.status_code, 500)


class TestGetOtlByName(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/searchbyname"
        self.params = {"page": 1, "size": 5, "order": "ascend", "otlname": "name", "otl_status": "all"}

    def test_get_otl_by_name_success1(self):
        """ data source list not empty success """
        my_mock = mock.Mock(return_value=(200, {}))
        with mock.patch('service.Otl_Service.otl_service.getbyotlname', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_otl_by_name_success2(self):
        """ data source list empty success """
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_otl_by_name_failed1(self):
        """ params error """
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"page": "a", "size": 5, "order": "cend", "otlname": "name"})
        self.assertEqual(response.status_code, 400)

    def test_get_otl_by_name_failed2(self):
        """ service exception """
        my_mock = mock.Mock(return_value=(500, {"cause": "you have an error in your SQL!",
                                                "code": CommonResponseStatus.REQUEST_ERROR.value,
                                                "message": "query ontology fail"}))
        with mock.patch('service.Otl_Service.otl_service.getbyotlname', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  query_string=self.params)
        self.assertEqual(response.status_code, 500)


class TestUpdateOtlName(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/updatename/1"
        self.params = json.dumps({"ontology_name": "name", "ontology_des": "des"})

    def test_update_otl_name_success(self):
        """ success """
        my_mock = mock.Mock(return_value=(200, {"res": "update success"}))
        with mock.patch('service.Otl_Service.otl_service.update_name', my_mock):
            response = client.put(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_update_otl_name_failed1(self):
        """ params error """
        response = client.put(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              data={"ontology_name": 123})
        self.assertEqual(response.status_code, 400)

    def test_update_otl_name_failed2(self):
        """ otl_id must be int """
        response = client.put("/api/builder/v1/onto/updatename/otlid",
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              data=self.params)
        self.assertEqual(response.status_code, 400)

    def test_update_otl_name_failed4(self):
        """ service exception """
        my_mock = mock.Mock(return_value=(500, {"cause": "you have an error in your SQL!",
                                                "code": CommonResponseStatus.REQUEST_ERROR.value,
                                                "message": "query ontology fail"}))
        with mock.patch('service.Otl_Service.otl_service.update_name', my_mock):
            response = client.put(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  data=self.params)
        self.assertEqual(response.status_code, 500)


class TestUpdateOtlInfo(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/updateinfo/1"
        self.params = json.dumps({"used_task": [1, 23],
                                  "flag": "nextstep",
                                  "edge": [],
                                  "entity": [
                                      {
                                          "alias": "花花护花",
                                          "colour": "#805A9C",
                                          "dataType": "structured",
                                          "data_source": "as7",
                                          "ds_address": "https://10.4.69.44",
                                          "ds_id": "5",
                                          "ds_name": "结构化数据",
                                          "ds_path": "结构化数据",
                                          "entity_id": 4,
                                          "extract_type": "standardExtraction",
                                          "file_type": "csv",
                                          "model": "",
                                          "name": "nei1",
                                          "properties": [
                                              [
                                                  "name",
                                                  "string"
                                              ],
                                              [
                                                  "p",
                                                  "string"
                                              ],
                                              [
                                                  "s",
                                                  "string"
                                              ]
                                          ],
                                          "properties_index": [
                                              "name",
                                              "p",
                                              "s"
                                          ],
                                          "source_table": [
                                              [
                                                  "gns://B4FFFD35301B43B78DAEA4737A364C47/DC6942AC590846C297A52346AE9B27F0/EDEA69091B1B4538BE74AAA9535D0E66",
                                                  "结构化数据/csv/nei1.csv",
                                                  "nei1.csv"
                                              ]
                                          ],
                                          "source_type": "automatic",
                                          "task_id": "55"
                                      }
                                  ]})

    def test_update_otl_info_success(self):
        """ success """
        my_mock = mock.Mock(return_value=(200, {"res": "update"}))
        with mock.patch('service.Otl_Service.otl_service.update_info', my_mock):
            response = client.put(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_update_otl_info_failed1(self):
        """ otlid not int """
        response = client.put("/api/builder/v1/onto/updateinfo/otlid",
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              data=self.params)
        self.assertEqual(response.status_code, 400)

    def test_update_otl_info_failed2(self):
        """ params error """
        response = client.put(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              data=json.dumps({"used_task": [1, 23],
                                               "flag": "nextstep",
                                               "edge": []})
                              )
        self.assertEqual(response.status_code, 400)

    def test_update_otl_info_failed3(self):
        """ database error """
        my_mock = mock.Mock(return_value=(500, {"cause": "you have an error in your SQL!",
                                                "code": CommonResponseStatus.USRPASS_ERROR.value,
                                                "message": "update fail"}))
        with mock.patch('service.Otl_Service.otl_service.update_info', my_mock):
            response = client.put(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                  data=self.params)
        self.assertEqual(response.status_code, 500)


class TestDs(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/1"

    def test_ds_success(self):
        my_mock = mock.Mock(return_value=(200, {"count": 1, "df": {}}))
        with mock.patch('service.Otl_Service.otl_service.getbyotlname', my_mock):
            response = client.get(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 200)

    def test_ds_failed1(self):
        """ otlid not int """
        response = client.get("/api/builder/v1/onto/otlid",
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}
                              )
        self.assertEqual(response.status_code, 400)

    def test_ds_failed2(self):
        """ database error """
        my_mock = mock.Mock(return_value=(500, {"cause": "you have an error in your SQL!",
                                                "code": CommonResponseStatus.USRPASS_ERROR.value,
                                                "message": "update fail"}))
        with mock.patch('service.Otl_Service.otl_service.getbyotlname', my_mock):
            response = client.get(self.url,
                                  headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'}
                                  )
        self.assertEqual(response.status_code, 500)


class TestGetOtlByKgid(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/getbykgid/1"
        self.getByIdRow = [[2, "test", "finish",
                            [{'graph_Name': 'test123', 'graph_des': 'Ad', 'graph_db_id': 1,
                              'graphDBAddress': '10.4.106.255',
                              'graph_mongo_Name': 'mongoDB-1', 'graph_DBName': 'u1040b0bc239011ed8fa50242ac110002'}],
                            ["1"], "[2]", [], [
                                {'ds_name': 'mysql', 'ds_id': 1, 'data_source': 'mysql', 'ds_path': 'anydata',
                                 'file_source': 'account', 'file_name': 'account', 'file_path': 'anydata',
                                 'file_type': '', 'extract_type': 'standardExtraction', 'extract_rules': [
                                    {'is_model': 'not_model', 'entity_type': 'account',
                                     'property': {'property_field': 'name', 'property_func': 'All'}},
                                    {'is_model': 'not_model', 'entity_type': 'account',
                                     'property': {'property_field': 'passwd', 'property_func': 'All'}},
                                    {'is_model': 'not_model', 'entity_type': 'graph_task_history_table',
                                     'property': {'property_field': 'count_status', 'property_func': 'All'}}]}],
                            [{'otls_map': [{'otl_name': 'account', 'entity_type': 'account',
                                            'property_map': [{'otl_prop': 'name', 'entity_prop': 'name'},
                                                             {'otl_prop': 'id', 'entity_prop': 'id'},
                                                             {'otl_prop': 'passwd', 'entity_prop': 'passwd'},
                                                             {'otl_prop': 'email', 'entity_prop': 'email'},
                                                             {'otl_prop': 'type', 'entity_prop': 'type'},
                                                             {'otl_prop': 'desc', 'entity_prop': 'desc'},
                                                             {'otl_prop': 'status', 'entity_prop': 'status'},
                                                             {'otl_prop': 'uuid', 'entity_prop': 'uuid'},
                                                             {'otl_prop': 'expire_time', 'entity_prop': 'expire_time'},
                                                             {'otl_prop': 'create_time', 'entity_prop': 'create_time'},
                                                             {'otl_prop': 'app_id', 'entity_prop': 'app_id'},
                                                             {'otl_prop': 'pass_st', 'entity_prop': 'pass_st'},
                                                             {'otl_prop': 'pass_ct', 'entity_prop': 'pass_ct'},
                                                             {'otl_prop': 'locked_dur', 'entity_prop': 'locked_dur'},
                                                             {'otl_prop': 'pass_len', 'entity_prop': 'pass_len'},
                                                             {'otl_prop': 'pass_dur', 'entity_prop': 'pass_dur'},
                                                             {'otl_prop': 'activation', 'entity_prop': 'activation'},
                                                             {'otl_prop': 'ldap_domain',
                                                              'entity_prop': 'ldap_domain'}]},
                                           ],
                              'relations_map': []}],
                            [{'status': True, 'entity_classes': [
                                {'name': 'account', 'properties': [{'function': 'equality', 'property': 'name'}]},
                                {'name': 'graph_task_history_table',
                                 'properties': [{'function': 'equality', 'property': 'id'}]}]}],
                            0, 1, 0, 6, 0, "2022-08-24 17:35:17", "2022-08-24 17:35:17"
                            ]]
        self.notHaveOntologyRow = [[2, "test", "finish",
                                    [{'graph_Name': 'test123', 'graph_des': 'Ad', 'graph_db_id': 1,
                                      'graphDBAddress': '10.4.106.255',
                                      'graph_mongo_Name': 'mongoDB-1',
                                      'graph_DBName': 'u1040b0bc239011ed8fa50242ac110002'}],
                                    ["1"], "[]", [], [
                                        {'ds_name': 'mysql', 'ds_id': 1, 'data_source': 'mysql', 'ds_path': 'anydata',
                                         'file_source': 'account', 'file_name': 'account', 'file_path': 'anydata',
                                         'file_type': '', 'extract_type': 'standardExtraction', 'extract_rules': [
                                            {'is_model': 'not_model', 'entity_type': 'account',
                                             'property': {'property_field': 'name', 'property_func': 'All'}},
                                            {'is_model': 'not_model', 'entity_type': 'account',
                                             'property': {'property_field': 'passwd', 'property_func': 'All'}},
                                            {'is_model': 'not_model', 'entity_type': 'graph_task_history_table',
                                             'property': {'property_field': 'count_status', 'property_func': 'All'}}]}],
                                    [{'otls_map': [{'otl_name': 'account', 'entity_type': 'account',
                                                    'property_map': [{'otl_prop': 'name', 'entity_prop': 'name'},
                                                                     {'otl_prop': 'id', 'entity_prop': 'id'},
                                                                     {'otl_prop': 'passwd', 'entity_prop': 'passwd'},
                                                                     {'otl_prop': 'email', 'entity_prop': 'email'},
                                                                     {'otl_prop': 'type', 'entity_prop': 'type'},
                                                                     {'otl_prop': 'desc', 'entity_prop': 'desc'},
                                                                     {'otl_prop': 'status', 'entity_prop': 'status'},
                                                                     {'otl_prop': 'uuid', 'entity_prop': 'uuid'},
                                                                     {'otl_prop': 'expire_time',
                                                                      'entity_prop': 'expire_time'},
                                                                     {'otl_prop': 'create_time',
                                                                      'entity_prop': 'create_time'},
                                                                     {'otl_prop': 'app_id', 'entity_prop': 'app_id'},
                                                                     {'otl_prop': 'pass_st', 'entity_prop': 'pass_st'},
                                                                     {'otl_prop': 'pass_ct', 'entity_prop': 'pass_ct'},
                                                                     {'otl_prop': 'locked_dur',
                                                                      'entity_prop': 'locked_dur'},
                                                                     {'otl_prop': 'pass_len',
                                                                      'entity_prop': 'pass_len'},
                                                                     {'otl_prop': 'pass_dur',
                                                                      'entity_prop': 'pass_dur'},
                                                                     {'otl_prop': 'activation',
                                                                      'entity_prop': 'activation'},
                                                                     {'otl_prop': 'ldap_domain',
                                                                      'entity_prop': 'ldap_domain'}]},
                                                   ],
                                      'relations_map': []}],
                                    [{'status': True, 'entity_classes': [
                                        {'name': 'account',
                                         'properties': [{'function': 'equality', 'property': 'name'}]},
                                        {'name': 'graph_task_history_table',
                                         'properties': [{'function': 'equality', 'property': 'id'}]}]}],
                                    0, 1, 0, 6, 0, "2022-08-24 17:35:17", "2022-08-24 17:35:17"
                                    ]]
        self.getByIdColum = ["id", "graph_name", "graph_status", "graph_baseInfo", "graph_ds", "graph_otl",
                             "graph_otl_temp", "graph_InfoExt", "graph_KMap", "graph_KMerge", "rabbitmq_ds",
                             "graph_db_id", "upload", "step_num", "is_upload", "create_time", "update_time"]

    def test_get_otl_by_kgid_success(self):
        """ success """
        graph_dao.get_configid_by_kgid = mock.Mock(return_value=pd.DataFrame([[1]], columns=["KG_config_id"]))
        graph_dao.getbyid = mock.Mock(return_value=pd.DataFrame(self.getByIdRow, columns=self.getByIdColum))
        otl_dao.getbyid = mock.Mock(return_value=pd.DataFrame([], columns=["ontology_name", "otl_status", "entity"]))
        my_mock = mock.Mock(return_value=(200, {}))
        with mock.patch('service.Otl_Service.otl_service.filterotl', my_mock):
            response = client.get(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 200)

    def test_get_otl_by_kgid_failed1(self):
        """ kgid not int """
        response = client.get("/api/builder/v1/onto/getbykgid/kgid",
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 400)

    def test_get_otl_by_kgid_failed2(self):
        """ kgid not exist """
        graph_dao.get_configid_by_kgid = mock.Mock(return_value=pd.DataFrame([], columns=["KG_config_id"]))
        response = client.get(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 500)

    def test_get_otl_by_kgid_failed3(self):
        """ configid not exist """
        graph_dao.get_configid_by_kgid = mock.Mock(return_value=pd.DataFrame([[1]], columns=["KG_config_id"]))
        graph_dao.getbyid = mock.Mock(return_value=pd.DataFrame([], columns=self.getByIdColum))
        response = client.get(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 500)

    def test_get_otl_by_kgid_failed4(self):
        """ configid does not have ontology """
        graph_dao.get_configid_by_kgid = mock.Mock(return_value=pd.DataFrame([[1]], columns=["KG_config_id"]))
        graph_dao.getbyid = mock.Mock(return_value=pd.DataFrame(self.notHaveOntologyRow, columns=self.getByIdColum))
        response = client.get(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 500)

    def test_get_otl_by_kgid_failed5(self):
        """ database error """
        graph_dao.get_configid_by_kgid = mock.Mock(return_value=pd.DataFrame([[1]], columns=["KG_config_id"]))
        graph_dao.getbyid = mock.Mock(return_value=pd.DataFrame(self.getByIdRow, columns=self.getByIdColum))
        otl_dao.getbyid = mock.Mock(side_effect=Exception("SQL"))
        response = client.get(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 500)


class TestGetOtlByOtlname(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/getotlbyname"
        self.params = {"name": "ontology_name"}
        self.getByNameRow = [[1, "name", "", "available",
                              "[{'entity_id': 1, 'colour': '#50A06A', 'ds_name': 'mysql', 'dataType': 'structured', 'data_source': 'mysql', 'ds_path': 'anydata', 'ds_id': '1', 'extract_type': 'standardExtraction', 'name': 'account', 'source_table': ['account'], 'source_type': 'automatic', 'properties': [['name', 'string'], ['id', 'string'], ['passwd', 'string'], ['email', 'string'], ['type', 'string'], ['desc', 'string'], ['status', 'string'], ['uuid', 'string'], ['expire_time', 'datetime'], ['create_time', 'datetime'], ['app_id', 'string'], ['pass_st', 'datetime'], ['pass_ct', 'string'], ['locked_dur', 'string'], ['pass_len', 'string'], ['pass_dur', 'string'], ['activation', 'string'], ['ldap_domain', 'string']], 'file_type': '', 'task_id': '1', 'properties_index': ['name'], 'model': '', 'ds_address': '10.4.106.255', 'alias': 'account'}, {'entity_id': 2, 'colour': '#5F81D8', 'ds_name': 'mysql', 'dataType': 'structured', 'data_source': 'mysql', 'ds_path': 'anydata', 'ds_id': '1', 'extract_type': 'standardExtraction', 'name': 'graph_task_history_table', 'source_table': ['graph_task_history_table'], 'source_type': 'automatic', 'properties': [['name', 'string'], ['id', 'string'], ['graph_id', 'string'], ['graph_name', 'string'], ['task_id', 'string'], ['task_status', 'string'], ['create_user', 'string'], ['start_time', 'string'], ['end_time', 'string'], ['all_num', 'string'], ['entity_num', 'string'], ['edge_num', 'string'], ['graph_entity', 'string'], ['graph_edge', 'string'], ['error_report', 'string'], ['entity_pro_num', 'string'], ['edge_pro_num', 'string'], ['trigger_type', 'string'], ['task_type', 'string'], ['count_status', 'string']], 'file_type': '', 'task_id': '1', 'properties_index': ['name'], 'model': '', 'ds_address': '10.4.106.255', 'alias': 'graph_task_history_table'}]",
                              "[]", "[1]", "[1]", "2022-08-24 16:41:55", "2022-08-24 16:41:55"
                              ]]
        self.getByNameColum = ["id", "ontology_name", "ontology_des", "otl_status", "entity", "edge", "used_task",
                               "all_task", "create_time", "update_time"]

    def test_get_otl_by_otlname_success(self):
        """ success """
        otl_dao.getOtlIdbyname = mock.Mock(return_value=pd.DataFrame([[1]], columns=["id"]))
        otl_dao.getbyname = mock.Mock(return_value=pd.DataFrame(self.getByNameRow, columns=self.getByNameColum))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_otl_by_otlname_failed1(self):
        """ name str illegal """
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"name": ",，"})
        self.assertEqual(response.status_code, 400)

    def test_get_otl_by_otlname_failed2(self):
        """ name str empty """
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"name": "   "})
        self.assertEqual(response.status_code, 400)

    def test_get_otl_by_otlname_failed3(self):
        """ database error """
        otl_dao.getOtlIdbyname = mock.Mock(side_effect=Exception("SQL"))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_get_otl_by_otlname_failed4(self):
        """ ontology name does not exist """
        otl_dao.getOtlIdbyname = mock.Mock(return_value=(pd.DataFrame([], columns=["id"])))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.params)
        self.assertEqual(response.status_code, 500)

    def test_get_otl_by_otlname_failed5(self):
        """ database error """
        otl_dao.getOtlIdbyname = mock.Mock(return_value=pd.DataFrame([[1]], columns=["id"]))
        otl_dao.getbyname = mock.Mock(side_effect=Exception("SQL"))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.params)
        self.assertEqual(response.status_code, 500)


class TestBuildeOntoTask(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/task/build_task"
        self.params = json.dumps({"ontology_id": 1, "file_list": [{
            "docid": "gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/3D77695B9C1641398944920D7B6D921E",
            "name": "industry_info.csv",
            "type": "file"
        }], "postfix": "csv", "ds_id": 1})
        self.errParams = json.dumps({"ontology_id": "1", "postfix": "csv", "ds_id": "1"})

    def test_builde_onto_task_success(self):
        """ success """
        requests.request = mock.Mock(return_value=(MockResponse(200, {"code": 200, "res": "res"})))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_builde_onto_task_failed1(self):
        """ params error """
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.errParams)
        self.assertEqual(response.status_code, 400)

    def test_builde_onto_task_failed2(self):
        """ builder task error """
        requests.request = mock.Mock(
            return_value=(MockResponse(500, {"code": 500, "res": {"cause": "", "code": "", "message": ""}})))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 500)


class TestGetTaskInfo(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/task/gettaskinfo"
        self.params = json.dumps({"page": 1, "size": 10, "ontology_id": 1, "used_task": []})

    def test_get_task_info_success(self):
        """ success """
        requests.request = mock.Mock(return_value=(MockResponse(200, {"code": 200, "res": "res"})))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_task_info_failed1(self):
        """ params error """
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({"page": "1", "size": "10", "ontology_id": "1", "used_task": []}))
        self.assertEqual(response.status_code, 400)

    def test_get_task_info_failed2(self):
        """ get task error """
        requests.request = mock.Mock(
            return_value=(MockResponse(500, {"code": 500, "res": {"cause": "", "code": "", "message": ""}})))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-12eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 500)


class TestDeleteTask(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/task/deletetask"
        self.params = json.dumps({"task_list": [1, 2]})

    def test_delete_task_success(self):
        """ success """
        requests.request = mock.Mock(return_value=(MockResponse(200, {"code": 200, "res": "res"})))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_delete_task_failed1(self):
        """ params error """
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({"task_list": ["1", "2"]}))
        self.assertEqual(response.status_code, 400)

    def test_delete_task_failed2(self):
        """ delete task error """
        requests.request = mock.Mock(
            return_value=(MockResponse(500, {"code": 500, "res": {"cause": "", "code": "", "message": ""}})))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-12eb-a57d-1242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 500)


class TestGetTaskFile(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/task/get_task_files"
        self.params = {"task_id": 1, "page": 1, "size": 10}

    def test_get_task_file_success(self):
        """ success """
        requests.request = mock.Mock(return_value=(MockResponse(200, {"code": 200, "res": "res"})))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string=self.params)
        self.assertEqual(response.status_code, 200)

    def test_get_task_file_failed1(self):
        """ params error """
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                              query_string={"task_id": "a", "page": "b", "size": "c"})
        self.assertEqual(response.status_code, 400)

    def test_get_task_file_failed2(self):
        """ get task file error """
        requests.request = mock.Mock(
            return_value=(MockResponse(500, {"code": 500, "res": {"cause": "", "code": "", "message": ""}})))
        response = client.get(self.url,
                              headers={'uuid': '851ba1db-4e37-12eb-a57d-1242ac190012'},
                              query_string=self.params)
        self.assertEqual(response.status_code, 500)


class TestDeleteAllTask(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/task/deletealltask"
        self.params = {"ontology_id": 1, "state": "edit"}

    def test_delete_all_task_success(self):
        requests.request = mock.Mock(return_value=(MockResponse(200, {"code": 200, "res": "res"})))
        response = client.delete(self.url,
                                 headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                 query_string=self.params)
        self.assertEqual(response.status_code, 200)

    def test_delete_all_task_failed1(self):
        """ params error """
        response = client.delete(self.url,
                                 headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                                 query_string={"ontology_id": "a", "state": "edit"})
        self.assertEqual(response.status_code, 400)

    def test_delete_all_task_failed2(self):
        """ delete all task error """
        requests.request = mock.Mock(
            return_value=(MockResponse(500, {"code": 500, "res": {"cause": "", "code": "", "message": ""}})))
        response = client.delete(self.url,
                                 headers={'uuid': '851ba1db-4e37-12eb-a57d-1242ac190012'},
                                 query_string=self.params)
        self.assertEqual(response.status_code, 500)


class TestCopyOtl(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/copy/1"
        self.params = json.dumps({"otlid": 1, "ontology_name": "name", "ontology_des": "des"})
        self.getByIdRow = [["[{'entity_id': 1, 'colour': '#50A06A', 'ds_name': 'mysql', 'dataType': 'structured', "
                            "'data_source': 'mysql', 'ds_path': 'anydata', 'ds_id': '1', 'extract_type': "
                            "'standardExtraction', 'name': 'account', 'source_table': ['account'], 'source_type': "
                            "'automatic', 'properties': [['name', 'string'], ['id', 'string'], ['passwd', 'string'], "
                            "['email', 'string'], ['type', 'string'], ['desc', 'string'], ['status', 'string'], "
                            "['uuid', 'string'], ['expire_time', 'datetime'], ['create_time', 'datetime'], ['app_id', "
                            "'string'], ['pass_st', 'datetime'], ['pass_ct', 'string'], ['locked_dur', 'string'], "
                            "['pass_len', 'string'], ['pass_dur', 'string'], ['activation', 'string'], "
                            "['ldap_domain', 'string']], 'file_type': '', 'task_id': '1', 'properties_index': ["
                            "'name'], 'model': '', 'ds_address': '10.4.106.255', 'alias': 'account'}, {'entity_id': "
                            "2, 'colour': '#5F81D8', 'ds_name': 'mysql', 'dataType': 'structured', 'data_source': "
                            "'mysql', 'ds_path': 'anydata', 'ds_id': '1', 'extract_type': 'standardExtraction', "
                            "'name': 'graph_task_history_table', 'source_table': ['graph_task_history_table'], "
                            "'source_type': 'automatic', 'properties': [['name', 'string'], ['id', 'string'], "
                            "['graph_id', 'string'], ['graph_name', 'string'], ['task_id', 'string'], ['task_status', "
                            "'string'], ['create_user', 'string'], ['start_time', 'string'], ['end_time', 'string'], "
                            "['all_num', 'string'], ['entity_num', 'string'], ['edge_num', 'string'], "
                            "['graph_entity', 'string'], ['graph_edge', 'string'], ['error_report', 'string'], "
                            "['entity_pro_num', 'string'], ['edge_pro_num', 'string'], ['trigger_type', 'string'], "
                            "['task_type', 'string'], ['count_status', 'string']], 'file_type': '', 'task_id': '1', "
                            "'properties_index': ['name'], 'model': '', 'ds_address': '10.4.106.255', "
                            "'alias': 'graph_task_history_table'}]", 1, "name", "", "available", "[]", "[1]", "[1]",
                            "2022-08-24 16:41:55", "2022-08-24 16:41:55"]]
        self.getByIdColumn = ["entity", "id", "ontology_name", "ontology_des", "otl_status", "edge",
                              "used_task", "all_task", "create_time", "update_time"]

    def test_copy_otl_success(self):
        """ success """
        otl_dao.getAllOtlId = mock.Mock(return_value=pd.DataFrame([[1], [2], [3]], columns=["id"]))
        otl_dao.getOtlStatusbyid = mock.Mock(return_value=pd.DataFrame([["available"]], columns=["otl_status"]))
        otl_dao.getbyid = mock.Mock(return_value=pd.DataFrame(self.getByIdRow, columns=self.getByIdColumn))
        otl_dao.get_ontology = mock.Mock(return_value=pd.DataFrame([], columns=["entity", "edge"]))
        otl_dao.insertCopyOtl = mock.Mock(return_value=3)
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 200)

    def test_copy_otl_failed1(self):
        """ params error """
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=json.dumps({"otlid": "a", "ontology_name": 123, "ontology_des": "des"}))
        self.assertEqual(response.status_code, 400)

    def test_copy_otl_failed2(self):
        """ otlid not int """
        response = client.post("/api/builder/v1/onto/copy/otlid",
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 400)

    def test_copy_otl_failed3(self):
        """ getAllOtlId database error """
        otl_dao.getAllOtlId = mock.Mock(side_effect=Exception("SQL"))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_copy_otl_failed4(self):
        """ otlid does not exist """
        otl_dao.getAllOtlId = mock.Mock(return_value=pd.DataFrame([[11], [12], [13]], columns=["id"]))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_copy_otl_failed5(self):
        """ Ontology in unavailable state cannot be copied """
        otl_dao.getAllOtlId = mock.Mock(return_value=pd.DataFrame([[1], [2], [3]], columns=["id"]))
        otl_dao.getOtlStatusbyid = mock.Mock(return_value=pd.DataFrame([["run"]], columns=["otl_status"]))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_copy_otl_failed6(self):
        """ getbyid database error """
        otl_dao.getAllOtlId = mock.Mock(return_value=pd.DataFrame([[1], [2], [3]], columns=["id"]))
        otl_dao.getOtlStatusbyid = mock.Mock(return_value=pd.DataFrame([["available"]], columns=["otl_status"]))
        otl_dao.getbyid = mock.Mock(side_effect=Exception("SQL"))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 500)

    def test_copy_otl_failed7(self):
        """ otl name already existed """
        otl_dao.getAllOtlId = mock.Mock(return_value=pd.DataFrame([[1], [2], [3]], columns=["id"]))
        otl_dao.getOtlStatusbyid = mock.Mock(return_value=pd.DataFrame([["available"]], columns=["otl_status"]))
        otl_dao.getbyid = mock.Mock(return_value=pd.DataFrame(self.getByIdRow, columns=self.getByIdColumn))
        otl_dao.get_ontology = mock.Mock(return_value=pd.DataFrame([["", ""]], columns=["entity", "edge"]))
        response = client.post(self.url,
                               headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'},
                               data=self.params)
        self.assertEqual(response.status_code, 500)


class TestGraphDsList(TestCase):
    def setUp(self) -> None:
        self.url = "/api/builder/v1/onto/ds"

    def test_graph_ds_list_success1(self):
        dsm_dao.getCounts1 = mock.Mock(return_value=5)
        dsm_dao.getdsbyid = mock.Mock(return_value=pd.DataFrame([["", "", ""]], columns=["id", "dat_source", "dataType"]))
        response = client.get(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 200)

    def test_graph_ds_list_failed(self):
        """ database error """
        dsm_dao.getCounts1 = mock.Mock(side_effect=Exception("SQL"))
        response = client.get(self.url, headers={'uuid': '851ba1db-4e37-11eb-a57d-0242ac190002'})
        self.assertEqual(response.status_code, 500)



if __name__ == '__main__':
    unittest.main()

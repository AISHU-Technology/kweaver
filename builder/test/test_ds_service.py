from unittest import TestCase, mock
from dao.knw_dao import knw_dao
from dao.dsm_dao import dsm_dao
from dao.graph_dao import graph_dao
from service.dsm_Service import dsm_service
import pandas as pd


class Test_addds(TestCase):
    def setUp(self) -> None:
        self.params = {"knw_id": 35, "dsname": "test1234", "dataType": "structured", "data_source": "rabbitmq",
                       "ds_address": "10.4.109.191", "ds_port": 5672, "ds_user": "admin", "ds_password": "anydata123",
                       "ds_path": "", "extract_type": "standardExtraction", "vhost": "test", "queue": "test1",
                       "json_schema": "{'name': 'xiaoming'}"}

        # mock knw_dao.get_knw_by_id
        ret_row = [[1, "test1", "des", "#126EE3", "be2ecbdc-b4bf-11ec-900d-46cafb76d0dc", "2022-04-19 09:24:45"]]
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_id = mock.Mock(return_value=ret)

        # mock dsm_dao.getbydsname
        ret_row = []
        column = ["id"]
        ret = pd.DataFrame(ret_row, columns=column)
        dsm_dao.getbydsname = mock.Mock(return_value=ret)

        # mock dsm_dao.insertData
        dsm_dao.insertData = mock.Mock(return_value=1)

    # success
    def test_success(self):
        res = dsm_service.addds(self.params)
        self.assertEqual(res[0], 200)

    # 知识网络不存在
    def test_not_find_knw(self):
        # mock knw_dao.get_knw_by_id
        ret_row = []
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_id = mock.Mock(return_value=ret)

        res = dsm_service.addds(self.params)
        self.assertEqual(res[0], 500)

    # 名称重复
    def test_same_name(self):
        # mock dsm_dao.getbydsname
        ret_row = [[1]]
        column = ["id"]
        ret = pd.DataFrame(ret_row, columns=column)
        dsm_dao.getbydsname = mock.Mock(return_value=ret)

        res = dsm_service.addds(self.params)
        self.assertEqual(res[0], 500)

    # exception
    def test_exception(self):
        # mock dsm_dao.insertData
        dsm_dao.insertData = mock.Mock(return_value=[], side_effect=Exception("database error"))

        res = dsm_service.addds(self.params)
        self.assertEqual(res[0], 500)


class Test_getall(TestCase):
    def setUp(self) -> None:
        self.params_json = {"page": 1, "size": 10, "order": "ascend", "knw_id": 35}

        # mock dsm_dao.getCountByKnwId
        dsm_dao.getCountByKnwId = mock.Mock(return_value=5)

        # mock knw_dao.get_knw_by_id
        ret_row = [[1, "test1", "des", "#126EE3", "2022-04-19 09:24:45", "2022-04-19 09:24:45"]]
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_id = mock.Mock(return_value=ret)

        # mock dsm_dao.getall
        ret_row = [[23,
                    "2022-04-19 10:17:42", "2022-04-19 10:17:42", "mysql",
                    "structured", "mysql", "root", "RWlzb29AMTIz", "10.240.0.125", 3306, "kom", "standardExtraction",
                    "null", "", "", "", 32],
                   [24,
                    "2022-04-19 10:17:42", "2022-04-19 10:17:42", "mysql",
                    "structured", "mysql", "root", "RWlzb29AMTIz", "10.240.0.125", 3306, "kom", "standardExtraction",
                    "null", "", "", "", 32],
                   [25,
                    "2022-04-19 10:17:42", "2022-04-19 10:17:42", "mysql",
                    "structured", "mysql", "root", "RWlzb29AMTIz", "10.240.0.125", 3306, "kom", "standardExtraction",
                    "null", "", "", "", 32],
                   [26,
                    "2022-04-19 10:17:42", "2022-04-19 10:17:42", "mysql",
                    "structured", "mysql", "root", "RWlzb29AMTIz", "10.240.0.125", 3306, "kom", "standardExtraction",
                    "null", "", "", "", 32],
                   [27,
                    "2022-04-19 10:17:42", "2022-04-19 10:17:42", "mysql",
                    "structured", "mysql", "root", "RWlzb29AMTIz", "10.240.0.125", 3306, "kom", "standardExtraction",
                    "null", "", "", "", 32]]
        column = ["id",
                  "create_time", "update_time", "dsname", "dataType", "data_source", "ds_user",
                  "ds_password", "ds_address", "ds_port", "ds_path", "extract_type", "ds_auth", "vhost", "queue",
                  "json_schema", "knw_id"]
        ret = pd.DataFrame(ret_row, columns=column)
        dsm_dao.getall = mock.Mock(return_value=ret)

    # success
    def test_success(self):
        res = dsm_service.getall(self.params_json)
        self.assertEqual(res[0], 200)

    # 知识网络不存在
    def test_not_find_knw(self):
        # mock knw_dao.get_knw_by_id
        ret_row = []
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_id = mock.Mock(return_value=ret)

        res = dsm_service.getall(self.params_json)
        self.assertEqual(res[0], 500)

    # exception
    def test_exception(self):
        # mock dsm_dao.getall
        dsm_dao.getall = mock.Mock(return_value=[], side_effect=Exception("database error"))

        res = dsm_service.addds(self.params_json)
        self.assertEqual(res[0], 500)


class Test_getbydsname(TestCase):
    def setUp(self) -> None:
        self.params_json = {"page": 1, "size": 10, "order": "ascend", "knw_id": 35, "dsname": "mysql", "res_list": []}

        # mock knw_dao.get_knw_by_id
        ret_row = [[1, "test1", "des", "#126EE3", "2022-04-19 09:24:45", "2022-04-19 09:24:45"]]
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_id = mock.Mock(return_value=ret)

        # mock dsm_dao.getCountbyname
        dsm_dao.getCountbyname = mock.Mock(return_value=5)

        # mock dsm_dao.getallbyname
        ret_row = [
            [23,
             "2022-04-19 10:17:42", "2022-04-19 10:17:42", "mysql1",
             "structured", "mysql", "root", "RWlzb29AMTIz", "10.240.0.125", 3306, "kom", "standardExtraction",
             "null", "", "", "", 32],
            [24,
             "2022-04-19 10:17:42", "2022-04-19 10:17:42", "mysql2",
             "structured", "mysql", "root", "RWlzb29AMTIz", "10.240.0.125", 3306, "kom", "standardExtraction",
             "null", "", "", "", 32],
            [25,
             "2022-04-19 10:17:42", "2022-04-19 10:17:42", "mysql3",
             "structured", "mysql", "root", "RWlzb29AMTIz", "10.240.0.125", 3306, "kom", "standardExtraction",
             "null", "", "", "", 32],
            [26,
             "2022-04-19 10:17:42", "2022-04-19 10:17:42", "mysql4",
             "structured", "mysql", "root", "RWlzb29AMTIz", "10.240.0.125", 3306, "kom", "standardExtraction",
             "null", "", "", "", 32],
            [27,
             "2022-04-19 10:17:42", "2022-04-19 10:17:42", "mysql5",
             "structured", "mysql", "root", "RWlzb29AMTIz", "10.240.0.125", 3306, "kom", "standardExtraction",
             "null", "", "", "", 32]]
        column = ["id",
                  "create_time", "update_time", "dsname", "dataType", "data_source", "ds_user",
                  "ds_password", "ds_address", "ds_port", "ds_path", "extract_type", "ds_auth", "vhost", "queue",
                  "json_schema", "knw_id"]
        ret = pd.DataFrame(ret_row, columns=column)
        dsm_dao.getallbyname = mock.Mock(return_value=ret)

    # success
    def test_success(self):
        ret = dsm_service.getbydsname(self.params_json)
        self.assertEqual(ret[0], 200)

    # 知识网络不存在
    def test_not_find_knw(self):
        # mock knw_dao.get_knw_by_id
        ret_row = []
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_id = mock.Mock(return_value=ret)

        res = dsm_service.getbydsname(self.params_json)
        self.assertEqual(res[0], 500)

    # exception
    def test_exception(self):
        # mock dsm_dao.getallbyname
        dsm_dao.getallbyname = mock.Mock(return_value=[], side_effect=Exception("database error"))

        res = dsm_service.getbydsname(self.params_json)
        self.assertEqual(res[0], 500)


class Test_update(TestCase):
    def setUp(self) -> None:
        self.params_json = {"dsname": "sql", "dataType": "structured", "data_source": "rabbitmq",
                            "ds_address": "10.4.109.191", "ds_port": 5672, "ds_user": "admin",
                            "ds_password": "anydata123", "ds_path": "", "extract_type": "standardExtraction",
                            "vhost": "test", "queue": "test1", "json_schema": "{'name': 'xiaoming000'}"}

        # mock dsm_dao.getbyid
        ret_row = [[1]]
        column = ["id"]
        ret = pd.DataFrame(ret_row, columns=column)
        dsm_dao.getbyid = mock.Mock(return_value=ret)

        # mock dsm_dao.getbydsnameId
        ret_row = []
        column = ["id"]
        ret = pd.DataFrame(ret_row, columns=column)
        dsm_dao.getbydsnameId = mock.Mock(return_value=ret)

        # mock dsm_dao.update
        dsm_dao.update = mock.Mock(return_value=1)

    def test_success(self):
        res = dsm_service.update(1, self.params_json)
        self.assertEqual(res[0], 200)

    def test_not_find_ds(self):
        # mock dsm_dao.getbyid
        ret_row = []
        column = ["id"]
        ret = pd.DataFrame(ret_row, columns=column)
        dsm_dao.getbyid = mock.Mock(return_value=ret)

        res = dsm_service.update(1, self.params_json)
        self.assertEqual(res[0], 500)

    def test_same_name(self):
        # mock dsm_dao.getbydsnameId
        ret_row = [[2]]
        column = ["id"]
        ret = pd.DataFrame(ret_row, columns=column)
        dsm_dao.getbydsnameId = mock.Mock(return_value=ret)

        res = dsm_service.update(1, self.params_json)
        self.assertEqual(res[0], 500)

    def test_exception(self):
        # mock dsm_dao.update
        dsm_dao.update = mock.Mock(return_value=[], side_effect=Exception("database error"))

        res = dsm_service.update(1, self.params_json)
        self.assertEqual(res[0], 500)


class Test_delete(TestCase):
    def setUp(self) -> None:
        self.params_json = {"dsids": [1]}

        # mock dsm_dao.getbyids
        ret_row = [[1, "test1", "des", "#126EE3", "2022-04-19 09:24:45", "2022-04-19 09:24:45"]]
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        dsm_dao.getbyids = mock.Mock(return_value=ret)

        # mock graph_dao.getdsgraphuseall
        ret_row = []
        column = ["graph_ds"]
        ret = pd.DataFrame(ret_row, columns=column)
        graph_dao.getdsgraphuseall = mock.Mock(return_value=ret)

        # mock dsm_dao.delete
        dsm_dao.delete = mock.Mock(return_value=0)

    def test_success(self):
        res = dsm_service.delete(self.params_json)
        self.assertEqual(res[0], 200)

    def test_not_find_ds(self):
        # mock dsm_dao.getbyids
        ret_row = []
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        dsm_dao.getbyids = mock.Mock(return_value=ret)

        res = dsm_service.delete(self.params_json)
        self.assertEqual(res[0], 500)

    def test_used(self):
        # mock graph_dao.getdsgraphuseall
        ret_row = ["[1, 2]"]
        column = ["graph_ds"]
        ret = pd.DataFrame(ret_row, columns=column)
        graph_dao.getdsgraphuseall = mock.Mock(return_value=ret)

        res = dsm_service.delete(self.params_json)
        self.assertEqual(res[0], 500)

    def test_exception(self):
        # mock dsm_dao.delete
        dsm_dao.delete = mock.Mock(return_value=[], side_effect=Exception("database error"))

        res = dsm_service.delete(self.params_json)
        self.assertEqual(res[0], 500)
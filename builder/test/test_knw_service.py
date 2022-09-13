import unittest
from unittest import TestCase, mock
from service.knw_service import knw_service
from dao.knw_dao import knw_dao
import pandas as pd


# test新增知识网络
class Test_knw_save(TestCase):
    def setUp(self) -> None:
        self.params_json = {"knw_name": "name", "knw_des": "des", "knw_color": "#126EE3"}

        # mock knw_dao.get_id_by_name
        knw_name_row = []
        column = ["id"]
        knw_name = pd.DataFrame(knw_name_row, columns=column)
        knw_dao.get_id_by_name = mock.Mock(return_value=knw_name)

        # mock knw_dao.insert_knowledgeNetwork
        knw_id = 1
        knw_dao.insert_knowledgeNetwork = mock.Mock(return_value=knw_id)

    # success
    def test_knw_save_success(self):
        res = knw_service.knowledgeNetwork_save(self.params_json)
        self.assertEqual(res[0], 200)

    # 知识网络名称已存在
    def test_knw_save_name_exists(self):
        # mock knw_dao.get_id_by_name
        knw_name_row = [1]
        column = ["id"]
        knw_name = pd.DataFrame(knw_name_row, columns=column)
        knw_dao.get_id_by_name = mock.Mock(return_value=knw_name)

        res = knw_service.knowledgeNetwork_save(self.params_json)
        self.assertEqual(res[0], 500)

    # 异常
    def test_knw_save_exception(self):
        knw_dao.insert_knowledgeNetwork = mock.Mock(return_value=[], side_effect=Exception("database Unusable!"))

        res = knw_service.knowledgeNetwork_save(self.params_json)
        self.assertEqual(res[0], 500)


# test获取知识网络
class Test_get(TestCase):
    def setUp(self) -> None:
        # mock knw_dao.get_ids_by_graph
        knw_ids_row = [1, 2, 3, 4, 5]
        column = ["ids"]
        knw_ids = pd.DataFrame(knw_ids_row, columns=column)
        knw_dao.get_ids_by_graph = mock.Mock(return_value=knw_ids)

        # mock knw_dao.get_count
        knw_dao.get_count = mock.Mock(return_value=pd.DataFrame([[1], [2], [3], [4], [5]], columns=["id"]))

        # mock knw_dao.get_knw_by_name
        ret_row = [
            [1, "test1", "des", "#126EE3",
             "2022-04-19 09:24:45", "2022-04-19 09:24:45"],
            [2, "test2", "des", "#126EE3",
             "2022-04-19 09:24:45", "2022-04-19 09:24:45"],
            [3, "test3", "des", "#126EE3",
             "2022-04-19 09:24:45", "2022-04-19 09:24:45"],
            [4, "test4", "des", "#126EE3",
             "2022-04-19 09:24:45", "2022-04-19 09:24:45"],
            [5, "test5", "des", "#126EE3",
             "2022-04-19 09:24:45", "2022-04-19 09:24:45"]
        ]
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_name = mock.Mock(return_value=ret)

    # success
    def test_get_success(self):
        # knw_name为空
        self.params_json = {"knw_name": "", "page": 1, "size": 10, "order": "desc", "rule": "create"}
        res = knw_service.getKnw(self.params_json)
        self.assertEqual(res[0], 200)

        # knw_name不为空
        self.params_json = {"knw_name": "test", "page": 1, "size": 10, "order": "desc", "rule": "create"}
        res = knw_service.getKnw(self.params_json)
        self.assertEqual(res[0], 200)

    # 异常
    def test_get_exception(self):
        # mock knw_dao.get_count
        knw_dao.get_count = mock.Mock(return_value=[], side_effect=Exception("database error"))

        self.params_json = {"knw_name": "test", "page": 1, "size": 10, "order": "desc", "rule": "create"}
        res = knw_service.getKnw(self.params_json)
        self.assertEqual(res[0], 500)


# test编辑知识网络
class Test_edit(TestCase):
    def setUp(self) -> None:
        self.params_json = {"knw_id": 1, "knw_name": "test", "knw_des": "des", "knw_color": "#126EE3"}
        # mock knw_dao.get_knw_by_id
        ret_row = [[1, "test1", "des", "#126EE3", "2022-04-19 09:24:45", "2022-04-19 09:24:45"]]
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_id = mock.Mock(return_value=ret)

        # mock knw_dao.get_id_by_name
        ret_row = []
        column = ["id"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_id_by_name = mock.Mock(return_value=ret)

        # mock knw_dao.edit_knw
        knw_dao.edit_knw = mock.Mock(return_value=1)

    # success
    def test_edit_success(self):
        res = knw_service.editKnw(self.params_json)
        self.assertEqual(res[0], 200)

    # 知识网络不存在
    def test_edit_not_find_knw(self):
        # mock knw_dao.get_knw_by_id
        ret_row = []
        column = ["id", "knw_name", "knw_description", "color", "creation_time",
                  "update_time"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_id = mock.Mock(return_value=ret)

        res = knw_service.editKnw(self.params_json)
        self.assertEqual(res[0], 500)

    # 知识网络名称重复
    def test_edit_name_exists(self):
        # mock knw_dao.get_id_by_name
        ret_row = [[2]]
        column = ["id"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_id_by_name = mock.Mock(return_value=ret)

        res = knw_service.editKnw(self.params_json)
        self.assertEqual(res[0], 500)

    # 异常
    def test_get_exception(self):
        # mock knw_dao.edit_knw
        knw_dao.edit_knw = mock.Mock(return_value=[], side_effect=Exception("database error"))

        res = knw_service.editKnw(self.params_json)
        self.assertEqual(res[0], 500)


# test删除知识网络
class Test_delete(TestCase):
    def setUp(self) -> None:
        self.params_json = {"knw_id": 1}

        # mock knw_dao.get_knw_by_id
        ret_row = [[1, 'test_as', 'test_as', '#126EE3', '2022-06-09 10:13:19',
        '2022-08-19 13:25:19', 'bb334610-e799-11ec-9211-2afe3ac772a3']]
        column = ['id', 'knw_name', 'knw_description', 'color', 'creation_time', 'update_time', 'identify_id']
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_id = mock.Mock(return_value=ret)

        # mock knw_dao.get_relation
        ret_row = []
        column = ["id"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_relation = mock.Mock(return_value=ret)

        # mock knw_dao.delete_knw
        knw_dao.delete_knw = mock.Mock(return_value=(200, {}))

    # success
    def test_delete_success(self):
        res = knw_service.deleteKnw(self.params_json)
        self.assertEqual(res[0], 200)

    # 无知识网络
    def test_delete_not_find_knw(self):
        # mock knw_dao.get_knw_by_id
        ret_row = []
        column = ['id', 'knw_name', 'knw_description', 'color', 'creation_time', 'update_time', 'identify_id']
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_knw_by_id = mock.Mock(return_value=ret)

        res = knw_service.deleteKnw(self.params_json)
        self.assertEqual(res[0], 500)

    # 存在图谱
    def test_delete_exists_graph(self):
        # mock knw_dao.get_relation
        ret_row = [[1], [2], [3]]
        column = ["id"]
        ret = pd.DataFrame(ret_row, columns=column)
        knw_dao.get_relation = mock.Mock(return_value=ret)

        res = knw_service.deleteKnw(self.params_json)
        self.assertEqual(res[0], 500)

    # 异常
    def test_delete_exception(self):
        # mock knw_dao.delete_knw
        knw_dao.delete_knw = mock.Mock(return_value=[], side_effect=Exception("database error"))

        res = knw_service.deleteKnw(self.params_json)
        self.assertEqual(res[0], 500)


if __name__ == "__main__":
    unittest.main()

# -*- coding: utf-8 -*-
import json
from unittest import TestCase, mock
import pandas as pd
from dao.lexicon_dao import lexicon_dao
from utils.ConnectUtil import mongoConnect
from main.builder_app import app
from common.errorcode.codes.lexicon_code import *
from service.lexicon_service import lexicon_service


mongoConnect.connect_mongo = mock.Mock()
client = app.test_client()


class TestCreateLexicon(TestCase):
    """ 新建词库UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/create"
        self.headers = {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
        self.params_correct = {"name": "lexicon1", "labels": json.dumps(["label1", "label2"]),
                               "description": "词库新建测试", "knowledge_id": 1}
        self.params_error = {"name": "&^ ^$$",
                             "labels": json.dumps(["label1", "label2787yuyuuuuuuu675609(*(&^&%7e87r8e6rwe866r868e"]),
                             "description": "词库新建测试*#$%#*", "knowledge_id": -1}
        self.knowledge_id_exist = pd.DataFrame.from_dict({"id": [1]})
        self.knowledge_id_Noexist = pd.DataFrame.from_dict({"id": []})
        self.lexicon_name_exist = pd.DataFrame.from_dict({"id": [2]})
        self.lexicon_name_Noexist = pd.DataFrame.from_dict({"id": []})
    
    def test_create_lexicon_success(self):
        """ 新建正常 """
        lexicon_dao.get_knowledge_by_id = mock.Mock(return_value=self.knowledge_id_exist)
        lexicon_dao.get_id_by_name = mock.Mock(return_value=self.lexicon_name_Noexist)
        lexicon_dao.insert_lexicon = mock.Mock(return_value=1)
        lexicon_service.insert_lexicon = mock.Mock(return_value=(200, 1))
        lexicon_dao.update_lexicon_status = mock.Mock(return_value=1)
        # request_file = {'file': open('./test.txt', 'rb')}
        response = client.post(self.url, data=self.params_correct, headers=self.headers)
        self.assertEqual(response.status_code, 200)
    
    def test_create_lexicon_failed1(self):
        """ 参数错误 """
        lexicon_dao.get_knowledge_by_id = mock.Mock(return_value=self.knowledge_id_exist)
        lexicon_dao.get_id_by_name = mock.Mock(return_value=self.lexicon_name_Noexist)
        lexicon_service.insert_lexicon = mock.Mock(return_value=(200, 1))
        response = client.post(self.url, data=self.params_error, headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_CreateLexicon_ParamError)
    
    def test_create_lexicon_failed2(self):
        """ 词库名称已存在 """
        lexicon_dao.get_knowledge_by_id = mock.Mock(return_value=self.knowledge_id_exist)
        lexicon_dao.get_id_by_name = mock.Mock(return_value=self.lexicon_name_exist)
        response = client.post(self.url, data=self.params_correct, headers=self.headers)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_CreateLexicon_DuplicatedName)
    
    def test_create_lexicon_failed3(self):
        """ 知识网络id不存在 """
        lexicon_dao.get_knowledge_by_id = mock.Mock(return_value=self.knowledge_id_Noexist)
        lexicon_dao.get_id_by_name = mock.Mock(return_value=self.lexicon_name_Noexist)
        response = client.post(self.url, data=self.params_correct, headers=self.headers)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_CreateLexicon_KnowledgeIdNotExist)


class TestGetLabels(TestCase):
    """ 获取候选标签UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/labels?knowledge_id=1"
        self.url_error = "/api/builder/v1/lexicon/labels?knowledge_ids=1"
        self.knowledge_id_exist = pd.DataFrame.from_dict({"id": [1]})
        self.knowledge_id_Noexist = pd.DataFrame.from_dict({"id": []})
        self.labels = pd.DataFrame.from_dict({"labels": ['["label1", "label2"]']})
    
    def test_get_labels_success(self):
        """ 正常情况 """
        lexicon_dao.get_knowledge_by_id = mock.Mock(return_value=self.knowledge_id_exist)
        lexicon_dao.get_all_labels = mock.Mock(return_value=self.labels)
        response = client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['res'], ["label1", "label2"])
    
    def test_get_labels_failed1(self):
        """ 参数错误 """
        lexicon_dao.get_knowledge_by_id = mock.Mock(return_value=self.knowledge_id_exist)
        response = client.get(self.url_error)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_GetLabels_ParamError)
    
    def test_get_labels_failed2(self):
        """ 知识网络id不存在 """
        lexicon_dao.get_knowledge_by_id = mock.Mock(return_value=self.knowledge_id_Noexist)
        response = client.get(self.url)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_GetLabels_KnowledgeIdNotExist)


class TestALlLexicon(TestCase):
    """ 获取词库列表UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/getall"
        self.knowledge_id_exist = pd.DataFrame.from_dict({"id": [1]})
        self.knowledge_id_Noexist = pd.DataFrame.from_dict({"id": []})
        self.lexicon_info = pd.DataFrame.from_dict(
            {"id": [1, 2], "lexicon_name": ["lexicon1", "lexicon2"], "columns": ["[]", "[]"],
             "status": ["running", "running"], "error_info": ["", ""]})
        self.ret_obj = {"count": 2,
                        "df": [{"id": 1, "name": "lexicon1", "columns": [], "status": "running", "error_info": ""},
                               {"id": 2, "name": "lexicon2", "columns": [], "status": "running", "error_info": ""}]}
        self.params_correct = {"knowledge_id": 1, "page": 1, "size": 10, "order": "asc", "rule": "create_time",
                               "word": "lexicon"}
        self.params_correct = {"knowledge_id": 1, "page": 1, "size": 10, "order": "asc", "rule": "create_time",
                               "word": ""}
        self.params_error = {"knowledge_id": 10, "page": -1, "size": -1, "order": "ascs", "rule": "create_time1",
                             "word": "测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试"}
    
    def test_get_lexicon_success(self):
        """ 正常情况, word非空 """
        lexicon_dao.get_lexicon_count = mock.Mock(return_value=2)
        lexicon_dao.get_knowledge_by_id = mock.Mock(return_value=self.knowledge_id_exist)
        lexicon_dao.get_all_lexicon = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_all_lexicon_by_name = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_all_lexicon_by_label = mock.Mock(return_value=self.lexicon_info)
        response = client.get(self.url, query_string=self.params_correct)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['res'], self.ret_obj)
    
    def test_get_lexicon_success1(self):
        """ 正常情况, word为空 """
        lexicon_dao.get_lexicon_count = mock.Mock(return_value=2)
        lexicon_dao.get_knowledge_by_id = mock.Mock(return_value=self.knowledge_id_exist)
        lexicon_dao.get_all_lexicon = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_all_lexicon_by_name = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_all_lexicon_by_label = mock.Mock(return_value=self.lexicon_info)
        response = client.get(self.url, query_string=self.params_correct)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['res'], self.ret_obj)
    
    def test_get_lexicon_failed1(self):
        """ 参数错误 """
        response = client.get(self.url, query_string=self.params_error)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_GetLexiconList_ParamError)
    
    def test_get_lexicon_failed2(self):
        """ 知识网络id不存在 """
        lexicon_dao.get_knowledge_by_id = mock.Mock(return_value=self.knowledge_id_Noexist)
        response = client.get(self.url, query_string=self.params_correct)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_GetLexiconList_KnowledgeIdNotExist)


class TestGetLexiconById(TestCase):
    """ 根据词库id查找词库UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/getbyid"
        self.params_correct = {"id": 1, "page": 1, "size": 10}
        self.params_error = {"id": -1, "page": -1, "size": -10}
        self.ret_obj = {
            "id": 1,
            "lexicon_name": "ciku1",
            "description": "xxxxxxxxxxxx",
            "labels": ["label1", "label2", "label3"],
            "create_time": "2022-07-25 13:47:46",
            "update_time": "2022-07-25 13:47:46",
            "count": 3,
            "columns": [],
            "word_info": [
                {"word": "开心"},
                {"word": "不开心"},
                {"word": "不开心1"}
            ]
        }
        self.lexicon_id_Noexist = pd.DataFrame.from_dict({"id": [],
                                                          "lexicon_name": [],
                                                          "description": [],
                                                          "labels": [],
                                                          "create_time": [],
                                                          "update_time": []})
        self.user_info = pd.DataFrame.from_dict({"name": ["xiaoming"], "uuid": ["123456789"]})
        self.lexicon_info = pd.DataFrame.from_dict({
            "id": [1],
            "lexicon_name": ["ciku1"],
            "description": ["xxxxxxxxxxxx"],
            "labels": ['["label1", "label2", "label3"]'],
            "create_time": ["2022-07-25 13:47:46"],
            "update_time": ["2022-07-25 13:47:46"],
            "columns": "[]"})
        self.lexicon_word = (3, [{"word": "开心"}, {"word": "不开心"}, {"word": "不开心1"}])
    
    def test_get_lexicon_by_id_success(self):
        """ 正常情况 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_all_lexicon2mongo = mock.Mock(return_value=self.lexicon_word)
        response = client.get(self.url, query_string=self.params_correct)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['res'], self.ret_obj)
    
    def test_get_lexicon_by_id_failed1(self):
        """ 参数错误 """
        response = client.get(self.url, query_string=self.params_error)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_GetLexiconById_ParamError)
    
    def test_get_lexicon_by_id_failed2(self):
        """ 词库ID不存在 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_id_Noexist)
        response = client.get(self.url, query_string=self.params_correct)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_GetLexiconById_LexiconIdNotExist)


class TestLexiconExport(TestCase):
    """ 词库导出UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/export"
        self.params_correct = {"id_list": [1]}
        self.params_error = {"id_list": ["a"]}
        self.lexicon_words = [{"word": "开心"}, {"word": "不开心"}]
        self.lexicon_words_empty = []
        self.lexicon_id_Noexist = pd.DataFrame.from_dict({"id": [],
                                                          "lexicon_name": [],
                                                          "description": [],
                                                          "labels": [],
                                                          "create_user": [],
                                                          "operate_user": [],
                                                          "create_time": [],
                                                          "update_time": []})
        self.lexicon_info = pd.DataFrame.from_dict({
            "id": [1],
            "lexicon_name": ["ciku1"],
            "description": ["xxxxxxxxxxxx"],
            "labels": ['["label1", "label2", "label3"]'],
            "create_user": ["123456789"],
            "operate_user": ["123456789"],
            "create_time": ["2022-07-25 13:47:46"],
            "update_time": ["2022-07-25 13:47:46"]})
        
        self.status = pd.DataFrame.from_dict({"id": [1]})
        self.status_no = pd.DataFrame.from_dict({"id": []})
    
    def test_lexicon_export_success(self):
        """ 正常情况 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_all_words_from_mongo = mock.Mock(return_value=self.lexicon_words)
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 200)
    
    def test_lexicon_export_failed1(self):
        """ 参数错误 """
        response = client.post(self.url, data=json.dumps(self.params_error),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_ExportLexicon_ParamError)
    
    def test_lexicon_export_failed2(self):
        """ 词库id不存在 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_id_Noexist)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_ExportLexicon_LexiconIdNotExist)
    
    def test_lexicon_export_failed3(self):
        """ 词库为空 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        lexicon_dao.get_all_words_from_mongo = mock.Mock(return_value=self.lexicon_words_empty)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_ExportLexicon_EmptyLexicon)
    
    def test_lexicon_export_failed4(self):
        """ running状态的词库不能导出 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_all_words_from_mongo = mock.Mock(return_value=self.lexicon_words)
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status_no)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_ExportLexicon_InvalidStatus)


class TestLexiconInserWord(TestCase):
    """ 词库中新增词汇UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/insert"
        self.params_correct = {"id": 1, "word_info": {"word": "难过"}}
        self.params_error = {"id": 10, "word_info": "难过"}
        self.word_info = pd.DataFrame.from_dict({"columns": ['["word"]']})
        self.word_info_mismatch = pd.DataFrame.from_dict({"columns": ['["word1"]']})
        self.lexicon_info = pd.DataFrame.from_dict({
            "id": [1],
            "lexicon_name": ["ciku1"],
            "description": ["xxxxxxxxxxxx"],
            "labels": ['["label1", "label2", "label3"]'],
            "create_user": ["123456789"],
            "operate_user": ["123456789"],
            "create_time": ["2022-07-25 13:47:46"],
            "update_time": ["2022-07-25 13:47:46"]})
        self.lexicon_id_Noexist = pd.DataFrame.from_dict({"id": [],
                                                          "lexicon_name": [],
                                                          "description": [],
                                                          "labels": [],
                                                          "create_user": [],
                                                          "operate_user": [],
                                                          "create_time": [],
                                                          "update_time": []})
        self.status = pd.DataFrame.from_dict({"id": [1]})
        self.status_no = pd.DataFrame.from_dict({"id": []})
    
    def test_insert_success(self):
        """" 正常情况"""
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_columns_from_lexicon = mock.Mock(return_value=self.word_info)
        lexicon_dao.write_lexicon2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        lexicon_dao.is_word_exist_mongo = mock.Mock(return_value=False)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 200)
    
    def test_insert_failed(self):
        """" 新增的词汇已存在 """
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_columns_from_lexicon = mock.Mock(return_value=self.word_info)
        lexicon_dao.write_lexicon2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        lexicon_dao.is_word_exist_mongo = mock.Mock(return_value=True)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_InsertLexiconWord_WordExisted)
    
    def test_insert_failed0(self):
        """" running状态的词库无法新增词汇"""
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status_no)
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_columns_from_lexicon = mock.Mock(return_value=self.word_info)
        lexicon_dao.write_lexicon2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        lexicon_dao.is_word_exist_mongo = mock.Mock(return_value=False)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_InsertLexiconWord_InvalidStatus)
    
    def test_insert_failed1(self):
        """" 参数错误 """
        response = client.post(self.url, data=json.dumps(self.params_error),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_InsertLexiconWord_ParamError)
    
    def test_insert_failed2(self):
        """" 格式错误 """
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        lexicon_dao.is_word_exist_mongo = mock.Mock(return_value=False)
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_columns_from_lexicon = mock.Mock(return_value=self.word_info_mismatch)
        lexicon_dao.write_lexicon2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_InsertLexiconWord_FormatMismatch)
    
    def test_insert_failed3(self):
        """" 词库ID不存在 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_id_Noexist)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_InsertLexiconWord_LexiconIdNotExist)


class TestLexiconSearchWord(TestCase):
    """ 词库中搜索词汇UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/search"
        self.params_correct = {"id": 1, "word": "难过", "page": 1, "size": 10}
        self.params_error = {"id": -1, "words": "", "page": -1, "size": -10}
        self.lexicon_info = pd.DataFrame.from_dict({
            "id": [1],
            "lexicon_name": ["ciku1"],
            "description": ["xxxxxxxxxxxx"],
            "labels": ['["label1", "label2", "label3"]'],
            "create_user": ["123456789"],
            "operate_user": ["123456789"],
            "create_time": ["2022-07-25 13:47:46"],
            "update_time": ["2022-07-25 13:47:46"]})
        self.lexicon_id_Noexist = pd.DataFrame.from_dict({"id": [],
                                                          "lexicon_name": [],
                                                          "description": [],
                                                          "labels": [],
                                                          "create_user": [],
                                                          "operate_user": [],
                                                          "create_time": [],
                                                          "update_time": []})
        self.search_res = {"count": 1, "df": [{"word": "难过"}]}
    
    def test_search_words_success(self):
        """ 正常情况 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_word_by_condition_mongo = mock.Mock(return_value=self.search_res)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 200)
    
    def test_search_words_failed1(self):
        """ 参数错误 """
        response = client.post(self.url, data=json.dumps(self.params_error),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_SearchLexiconWord_ParamError)
    
    def test_search_words_failed2(self):
        """ 词库id不存在 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_id_Noexist)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_SearchLexiconWord_LexiconIdNotExist)


class TestLexiconEditWord(TestCase):
    """ 词库中编辑词汇UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/edit_words"
        self.params_correct = {"id": 1, "old_info": {"word": "难过"}, "new_info": {"word": "不难过"}}
        self.params_mismatch = {"id": 1, "old_info": {"word1": "难过"}, "new_info": {"word": "不难过"}}
        self.params_error = {"id": 1, "old_info": "难过", "new_info": {"word": "不难过"}}
        self.lexicon_info = pd.DataFrame.from_dict({
            "id": [1],
            "lexicon_name": ["ciku1"],
            "description": ["xxxxxxxxxxxx"],
            "labels": ['["label1", "label2", "label3"]'],
            "create_user": ["123456789"],
            "operate_user": ["123456789"],
            "create_time": ["2022-07-25 13:47:46"],
            "update_time": ["2022-07-25 13:47:46"]})
        self.lexicon_id_Noexist = pd.DataFrame.from_dict({"id": [],
                                                          "lexicon_name": [],
                                                          "description": [],
                                                          "labels": [],
                                                          "create_user": [],
                                                          "operate_user": [],
                                                          "create_time": [],
                                                          "update_time": []})
        self.word_info_mismatch = {"_id": "23214sda", "word1": "测试"}
        self.status = pd.DataFrame.from_dict({"id": [1]})
        self.status_no = pd.DataFrame.from_dict({"id": []})
    
    def test_edit_words_success(self):
        """ 正常情况 """
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        lexicon_dao.is_word_exist_mongo = mock.Mock(return_value=False)
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_service.edit_word_in_lexicon = mock.Mock(return_value="")
        lexicon_dao.update_lexicon2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['res'], "success")
    
    def test_edit_words_failed1(self):
        """ 参数错误 """
        response = client.post(self.url, data=json.dumps(self.params_error),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_EditLexiconWord_ParamError)
    
    def test_edit_words_failed2(self):
        """ 词库id不存在 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_id_Noexist)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_EditLexiconWord_LexiconIdNotExist)
    
    def test_edit_words_failed3(self):
        """ 格式不匹配 """
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        lexicon_dao.is_word_exist_mongo = mock.Mock(return_value=False)
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_service.edit_word_in_lexicon = mock.Mock(
            return_value="Builder_LexiconController_EditLexiconWord_FormatMismatch")
        lexicon_dao.update_lexicon2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_mismatch),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_EditLexiconWord_FormatMismatch)
    
    def test_edit_words_failed4(self):
        """ 词汇不存在 """
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        lexicon_dao.is_word_exist_mongo = mock.Mock(return_value=False)
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_service.edit_word_in_lexicon = mock.Mock(
            return_value="Builder_LexiconController_EditLexiconWord_LexiconWordNotExist")
        lexicon_dao.update_lexicon2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_mismatch),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_EditLexiconWord_LexiconWordNotExist)


class TestLexiconDeleteWord(TestCase):
    """ 词库中删除词汇UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/delete_words"
        self.params_correct = {"id": 1, "word_info_list": [{"word": "不难过"}]}
        self.params_error = {"id": 1, "old_info": "难过"}
        self.lexicon_info = pd.DataFrame.from_dict({
            "id": [1],
            "lexicon_name": ["ciku1"],
            "description": ["xxxxxxxxxxxx"],
            "labels": ['["label1", "label2", "label3"]'],
            "create_user": ["123456789"],
            "operate_user": ["123456789"],
            "create_time": ["2022-07-25 13:47:46"],
            "update_time": ["2022-07-25 13:47:46"]})
        self.lexicon_id_Noexist = pd.DataFrame.from_dict({"id": [],
                                                          "lexicon_name": [],
                                                          "description": [],
                                                          "labels": [],
                                                          "create_user": [],
                                                          "operate_user": [],
                                                          "create_time": [],
                                                          "update_time": []})
        self.status = pd.DataFrame.from_dict({"id": [1]})
        self.status_no = pd.DataFrame.from_dict({"id": []})
    
    def test_delete_words_success(self):
        """ 正常情况 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.is_word_exist_mongo = mock.Mock(return_value=True)
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        lexicon_dao.delete_lexicon_word2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['res'], "success")
    
    def test_delete_words_failed0(self):
        """ running状态的词库不能删除词汇 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.is_word_exist_mongo = mock.Mock(return_value=True)
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status_no)
        lexicon_dao.delete_lexicon_word2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_DeleteLexiconWord_InvalidStatus)
    
    def test_delete_words_failed1(self):
        """ 参数错误 """
        response = client.post(self.url, data=json.dumps(self.params_error),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_DeleteLexiconWord_ParamError)
    
    def test_delete_words_failed2(self):
        """ 词库id不存在 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_id_Noexist)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_DeleteLexiconWord_LexiconIdNotExist)
    
    def test_delete_words_failed3(self):
        """ 词汇不存在 """
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.is_word_exist_mongo = mock.Mock(return_value=False)
        lexicon_dao.delete_lexicon_word2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_DeleteLexiconWord_WordNotExist)


class TestLexiconEdit(TestCase):
    """ 编辑词库信息UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/edit"
        self.params_correct = {"id": 1, "name": "测试", "labels": ["label1"], "description": ""}
        self.params_error = {"id": 1,
                             "name": "测试测试测试测试测试测试测" * 5,
                             "labels": ["label1", "label2", "label3", "label4", "label5", "label6", "label7", "label8",
                                        "label9", "label10", "label11"],
                             "description": "测试测试测试测试测试测试测" * 50,
                             "extra": "ssa"}
        self.lexicon_info = pd.DataFrame.from_dict({
            "id": [1],
            "lexicon_name": ["ciku1"],
            "description": ["xxxxxxxxxxxx"],
            "labels": ['["label1", "label2", "label3"]'],
            "create_user": ["123456789"],
            "operate_user": ["123456789"],
            "create_time": ["2022-07-25 13:47:46"],
            "update_time": ["2022-07-25 13:47:46"]})
        self.lexicon_id_Noexist = pd.DataFrame.from_dict({"id": [],
                                                          "lexicon_name": [],
                                                          "description": [],
                                                          "labels": [],
                                                          "create_user": [],
                                                          "operate_user": [],
                                                          "create_time": [],
                                                          "update_time": []})
        self.knowledge_info = pd.DataFrame.from_dict({"knowledge_id": [10]})
        self.lexicon_name_exist = pd.DataFrame.from_dict({"id": []})
        self.lexicon_name_Noexist = pd.DataFrame.from_dict({"id": [1, 2]})
    
    def test_edit_success(self):
        """ 正常情况"""
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_knowledge_by_lexicon_id = mock.Mock(return_value=self.knowledge_info)
        lexicon_dao.get_id_by_name = mock.Mock(return_value=self.lexicon_name_exist)
        lexicon_dao.update_lexicon = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['res'], "success")
    
    def test_edit_failed1(self):
        """ 参数错误 """
        response = client.post(self.url, data=json.dumps(self.params_error),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_EditLexicon_ParamError)
    
    def test_edit_failed2(self):
        """ 词库id不存在 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_id_Noexist)
        lexicon_dao.get_knowledge_by_lexicon_id = mock.Mock(return_value=self.knowledge_info)
        lexicon_dao.get_id_by_name = mock.Mock(return_value=self.lexicon_name_exist)
        lexicon_dao.update_lexicon = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_EditLexicon_LexiconIdNotExist)
    
    def test_edit_failed3(self):
        """ 名称重复 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_knowledge_by_lexicon_id = mock.Mock(return_value=self.knowledge_info)
        lexicon_dao.get_id_by_name = mock.Mock(return_value=self.lexicon_name_Noexist)
        lexicon_dao.update_lexicon = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_EditLexicon_DuplicatedName)


class TestLexiconDelete(TestCase):
    """ 删除词库UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/delete"
        self.params_correct = {"id_list": [1, 2]}
        self.params_error = {"id_list": [1, "a"]}
        self.lexicon_info = pd.DataFrame.from_dict({
            "id": [1],
            "lexicon_name": ["ciku1"],
            "description": ["xxxxxxxxxxxx"],
            "labels": ['["label1", "label2", "label3"]'],
            "create_user": ["123456789"],
            "operate_user": ["123456789"],
            "create_time": ["2022-07-25 13:47:46"],
            "update_time": ["2022-07-25 13:47:46"],
            "columns": '[]'})
        self.lexicon_id_Noexist = pd.DataFrame.from_dict({"id": [],
                                                          "lexicon_name": [],
                                                          "description": [],
                                                          "labels": [],
                                                          "create_user": [],
                                                          "operate_user": [],
                                                          "create_time": [],
                                                          "update_time": []})
    
    def test_delete_success(self):
        """ 正常情况"""
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.delete_lexicon_2mongo = mock.Mock(return_value=None)
        lexicon_dao.delete_lexicon = mock.Mock(return_value=1)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['res'], "success")
    
    def test_delete_failed1(self):
        """ 参数错误 """
        response = client.post(self.url, data=json.dumps(self.params_error),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_DeleteLexicon_ParamError)
    
    def test_delete_failed2(self):
        """ 词库id不存在 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_id_Noexist)
        response = client.post(self.url, data=json.dumps(self.params_correct),
                               headers={"content-type": "application/json"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_DeleteLexicon_LexiconIdNotExist)


class TestLexiconImportWords(TestCase):
    """ 导入词汇UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/import_words"
        self.params_correct_add = {"id": 1, "mode": "add", "file": ""}
        self.params_correct_replace = {"id": 1, "mode": "replace", "file": ""}
        self.params_error = {"id": 1, "mode": "add1"}
        self.lexicon_info = pd.DataFrame.from_dict({
            "id": [1],
            "lexicon_name": ["ciku1"],
            "description": ["xxxxxxxxxxxx"],
            "labels": ['["label1", "label2", "label3"]'],
            "create_user": ["123456789"],
            "operate_user": ["123456789"],
            "create_time": ["2022-07-25 13:47:46"],
            "update_time": ["2022-07-25 13:47:46"]})
        self.lexicon_id_Noexist = pd.DataFrame.from_dict({"id": [],
                                                          "lexicon_name": [],
                                                          "description": [],
                                                          "labels": [],
                                                          "create_user": [],
                                                          "operate_user": [],
                                                          "create_time": [],
                                                          "update_time": []})
        self.headers = {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
        self.word_info = '["word"]'
        self.word_info_mismatch = {"_id": "23214sda", "word1": "测试"}
        self.status = pd.DataFrame.from_dict({"id": [1]})
        self.status_no = pd.DataFrame.from_dict({"id": []})
    
    def test_import_words_success(self):
        """ 没选文件 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_info)
        lexicon_dao.get_all_status = mock.Mock(return_value=self.status)
        lexicon_dao.delete_lexicon_2mongo = mock.Mock(return_value=None)
        lexicon_dao.get_columns_from_lexicon = mock.Mock(return_value=self.word_info)
        lexicon_dao.write_lexicon2mongo = mock.Mock(return_value=None)
        lexicon_dao.update_lexicon_user_and_time = mock.Mock(return_value=1)
        response = client.post(self.url, data=self.params_correct_add,
                               headers=self.headers)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_ImportWord2Lexicon_FileUploadFailed)
        
        response1 = client.post(self.url, data=self.params_correct_replace,
                                headers=self.headers)
        self.assertEqual(response1.status_code, 500)
        self.assertEqual(response1.json['ErrorCode'], Builder_LexiconController_ImportWord2Lexicon_FileUploadFailed)
    
    def test_import_words_failed1(self):
        """ 参数错误 """
        response = client.post(self.url, data=self.params_error,
                               headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_ImportWord2Lexicon_ParamError)
    
    def test_import_words_failed2(self):
        """ 词库id不存在 """
        lexicon_dao.get_lexicon_by_id = mock.Mock(return_value=self.lexicon_id_Noexist)
        response = client.post(self.url, data=self.params_correct_add,
                               headers=self.headers)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json['ErrorCode'], Builder_LexiconController_ImportWord2Lexicon_LexiconIdNotExist)


class TestLexiconDownloadTemplate(TestCase):
    """ 模板下载UT """
    
    def setUp(self) -> None:
        self.url = "/api/builder/v1/lexicon/template"
    
    def test_download_success(self):
        response = client.post(self.url, data=json.dumps({}))
        self.assertEqual(response.status_code, 200)

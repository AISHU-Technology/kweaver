# -*- coding: utf-8 -*-
import json
import os
import re
import time
import uuid
import zipfile
import numpy as np
import pandas as pd
import requests

from celery_task.transfer import HiveTransfer, MysqlTransfer
from celery_task.graph_config import GraphKMapConfig, OntologyConfig
from common.errorcode import codes
from dao.graph_dao import graph_dao
from dao.graphdb_dao import get_md5, normalize_text
from dao.knw_dao import knw_dao
from dao.lexicon_dao import lexicon_dao
from service.graph_Service import graph_Service
from utils.Otl_Util import otl_util
from common.errorcode.gview import Gview as Gview2
from flask_babel import gettext as _l



class LexiconService:
    def insert_lexicon(self, user_id, lexicon_id, word_dict_list):
        """ 新建词库 """
        try:
            # 若有词库文件，则词汇信息插入mariadb
            if len(word_dict_list) == 0:
                lexicon_dao.update_lexicon_status(lexicon_id, "success")
            else:
                try:
                    lexicon_dao.write_lexicon_words(user_id, lexicon_id, word_dict_list)
                    lexicon_dao.update_lexicon_status(lexicon_id, "success")
                except Exception as e:
                    lexicon_dao.update_lexicon_status(lexicon_id, "failed")
                    lexicon_dao.update_lexicon_error_info(lexicon_id, repr(e))
                    
                    return 500, repr(e)
            
            return 200, ""
        except Exception as e:
            
            return 500, repr(e)

    def create_template_lexicon(self, params_json: dict, user_id: str, roles: str):
        knw_id = params_json["knw_id"]
        name = params_json["name"]
        params_json["knowledge_id"] = knw_id

        # knw_id 不存在
        res = knw_dao.check_knw_id(knw_id)
        if len(res) <= 0:
            code = codes.Builder_LexiconService_CreateTemplateLexicon_KnwIdNotExist
            
            return 500, Gview2.error_return(code, knw_id=knw_id)

        # 名称重复
        if lexicon_service.is_lexicon_name_exist(name, knw_id, 0):
            code = codes.Builder_LexiconService_CreateTemplateLexicon_DuplicatedName
            
            return 500, Gview2.error_return(code, name=name)

        mode = params_json["mode"]
        if mode == "std":
            params_json["columns"] = ['synonym', 'std_name', 'std_property', 'ent_name', 'graph_id']
        elif mode == "entity_link":
            params_json["columns"] = ['words', 'vid', 'ent_name', 'graph_id']
        elif mode == "custom":
            params_json["columns"] = ['words']

        params_json["status"] = "edit"
        lexicon_id = lexicon_dao.insert_lexicon(params_json, user_id)
        return 200, lexicon_id

    def build_task(self, lexicon_id: int, user_id: str, roles: str):
        lexicon_info = lexicon_dao.get_lexicon_by_id(lexicon_id)
        if len(lexicon_info) == 0:
            code = codes.Builder_LexiconService_BuildTask_LexiconIdNotExist
            
            return 500, Gview2.error_return(code, lexicon_id=lexicon_id)

        lexicon = lexicon_info[0]
        if lexicon["status"] in ["running", "waiting"]:
            code = codes.Builder_LexiconService_BuildTask_LexiconIsRunning
            
            return 500, Gview2.error_return(code)

        extract_info = eval(lexicon["extract_info"])
        if not extract_info:
            code = codes.Builder_LexiconService_BuildTask_ExtractInfoEmptyError
            
            return 500, Gview2.error_return(code)
        extract_lexicon = extract_info.get("lexicon", [])
        extract_graph = extract_info.get("graph", [])
        if len(extract_lexicon) == 0 and len(extract_graph) == 0:
            code = codes.Builder_LexiconService_BuildTask_ExtractInfoEmptyError
            
            return 500, Gview2.error_return(code)

        # 校验词库id是否存在
        extract_lexicon_ids = [l_extract["id"] for l_extract in extract_lexicon]
        if len(extract_lexicon_ids) > 0:
            lexicon_infos = lexicon_dao.get_lexicon_by_id(extract_lexicon_ids)
            ids = [lexicon_info["id"] for lexicon_info in lexicon_infos]
            not_exist_ids = list(set(extract_lexicon_ids).difference(set(ids)))
            if len(not_exist_ids) > 0:
                code = codes.Builder_LexiconService_BuildTask_ExtractLexiconIdNotExist
                
                return 500, Gview2.error_return(code, ids=not_exist_ids)

        # 校验图谱id是否存在
        extract_graph_ids = [g_extract["id"] for g_extract in extract_graph]
        if len(extract_graph_ids) > 0:
            graph_infos = graph_dao.get_graph_by_ids(extract_graph_ids)
            ids = [graph_info["id"] for graph_info in graph_infos]
            not_exist_ids = list(set(extract_graph_ids).difference(set(ids)))
            if len(not_exist_ids) > 0:
                code = codes.Builder_LexiconService_BuildTask_ExtractGraphIdNotExist
                
                return 500, Gview2.error_return(code, ids=not_exist_ids)

        # 清空词汇
        lexicon_service.delete_all_words(lexicon_id)
        lexicon_dao.update_lexicon_user_and_time(lexicon_id, user_id)

        params_json = {}
        params_json["user_id"] = user_id
        params_json["mode"] = lexicon["mode"]
        params_json["extract_info"] = extract_info
        params_json["lexicon_id"] = lexicon_id
        params_json['task_type'] = 'lexicon_build'
        params_json['relation_id'] = lexicon_id
        params_json['task_name'] = 'lexicon_build-{}'.format(lexicon_id)
        params_json['async_task_name'] = "cel.lexicon_build"
        params_json['cancel_pre'] = True
        params_json['task_params'] = json.dumps({"lexicon_id": lexicon_id})
        url = "http://localhost:6488/task/lexicon_build"
        # url = "http://10.4.37.76:6488/task/lexicon_build" #debug
        headers = {
            'Content-Type': 'application/json'
        }
        # 尝试3次
        message = ""
        request_status = False
        for _ in range(3):
            try:
                response = requests.request("POST", url, headers=headers, data=json.dumps(params_json))
                if response.status_code == 200:
                    request_status = True
                    break
                message = f"post task import_lexicon-{lexicon_id} failed:{str(response.text)}"
            except Exception as e:
                message = repr(e)
        if not request_status:
            code = codes.Builder_LexiconService_BuildTask_AsyncTaskInternalError
            
            return 500, Gview2.error_return(code, message=message)
        return 200, response.json()

    def delete_lexicon(self, ids):
        """ 删除词库 """
        try:
            # 删除词库
            lexicon_id = lexicon_dao.delete_lexicon(ids)
            for id in ids:
                self.delete_all_words(id)
            
            return 200, lexicon_id
        except Exception as e:
            
            return 500, repr(e)

    def edit_lexicon(self, params_json):
        """ 编辑词库信息 """
        try:
            lexicon_id = params_json["id"]
            name = params_json["name"]
            user_id = params_json["user_id"]
            # roles = params_json["roles"]
            lexicon_info = lexicon_dao.get_lexicon_by_id(lexicon_id)
            if len(lexicon_info) <= 0:
                code = codes.Builder_LexiconService_EditLexicon_LexiconIdNotExist
                
                return 500, Gview2.error_return(code, lexicon_id=lexicon_id)

            lexicon_info = lexicon_info[0]
            if lexicon_info["status"] in ["waiting", "running"]:
                code = codes.Builder_LexiconService_EditLexicon_LexiconIsRunning
                
                return 500, Gview2.error_return(code)

            knw_id = lexicon_info["knowledge_id"]
            mode = lexicon_info["mode"]

            if "extract_info" in params_json.keys():
                # 校验是否有词库查看权限
                # no_perm_ids = []
                # extract_lexicon = params_json["extract_info"].get("lexicon", [])
                # extract_lexicon_ids = [str(lexicon["id"]) for lexicon in extract_lexicon]
                # if extract_lexicon_ids:
                #     perms = data_auth.get_data_permission(extract_lexicon_ids, "lexicon", user_id, roles)
                #     for perm in perms:
                #         if drivenConstants.LEXICON_VIEW not in perm["codes"]:
                #             no_perm_ids.append(int(perm["dataId"]))
                #     if no_perm_ids:
                #         code = codes.Builder_LexiconService_EditLexicon_LexiconPermError
                #         
                #         return 500, Gview2.error_return(code, lexicon_ids=str(no_perm_ids))

                # 校验是否有图谱查看权限
                # no_perm_ids = []
                # extract_graph = params_json["extract_info"].get("graph", [])
                # extract_graph_ids = [str(graph["id"]) for graph in extract_graph]
                # if extract_graph_ids:
                #     perms = data_auth.get_data_permission(extract_graph_ids, "kg", user_id, roles)
                #     for perm in perms:
                #         if drivenConstants.KG_VIEW not in perm["codes"]:
                #             no_perm_ids.append(int(perm["dataId"]))
                #     if no_perm_ids:
                #         code = codes.Builder_LexiconService_EditLexicon_GraphPermError
                #         
                #         return 500, Gview2.error_return(code, graph_ids=str(no_perm_ids))
                extract_graph = []
                if mode == "std" or mode == "entity_link":
                    if "lexicon" in params_json["extract_info"]:
                        code = codes.Builder_LexiconService_EditLexicon_ExtractError
                        
                        return 500, Gview2.error_return(code)
                    elif mode == "std":
                        for graph in extract_graph:
                            for entity in graph["entities"]:
                                if entity["separator"][entity["prop"].index(entity["std_prop"])] != "":
                                    code = codes.Builder_LexiconService_EditLexicon_SeparatorError
                                    
                                    return 500, Gview2.error_return(code)

            if lexicon_service.is_lexicon_name_exist(name, knw_id, lexicon_id):
                code = codes.Builder_LexiconService_EditLexicon_DuplicatedName
                
                return 500, Gview2.error_return(code, lexicon_name=name)
            # 编辑词库信息
            lexicon_id = lexicon_dao.update_lexicon(params_json["id"], params_json["name"], params_json["description"],
                                                    params_json.get("extract_info"), user_id)
            
            return 200, lexicon_id
        except Exception as e:
            code = codes.Builder_LexiconService_EditLexicon_UnknownError
            
            return 500, Gview2.error_return(code, err=repr(e))

    def update_lexicon(self, id, user_id):
        """ 更新词库update_time和operate_user """
        try:
            # 编辑词库信息
            lexicon_id = lexicon_dao.update_lexicon_user_and_time(id, user_id)
            
            return 200, lexicon_id
        except Exception as e:
            
            return 500, repr(e)

    def update_lexicon_columns(self, id, columns, user_id):
        """ 更新词库update_time和operate_user """
        try:
            lexicon_id = lexicon_dao.update_lexicon_columns(id, columns, user_id)
            return 200, lexicon_id
        except Exception as e:
            return 500, repr(e)

    def get_lexicon_by_id(self, params_json):
        """ 获取指定id的词库信息 """
        try:
            uuid2name = {}
            # 获取用户信息
            # user_infos = lexicon_dao.get_account()
            # for user_info in user_infos:
            #     uuid2name[user_info.get("account_id")] = user_info.get("name")

            # 获取词库信息
            res = lexicon_dao.get_lexicon_by_id(int(params_json.get("id")))[0]
            extract_info = eval(res["extract_info"]) if res["extract_info"] else res["extract_info"]
            if extract_info:
                extract_lexicon = extract_info.get("lexicon", [])
                if len(extract_lexicon) > 0:
                    extract_lexicon_ids = [lexicon["id"] for lexicon in extract_lexicon]
                    lexicon_infos = lexicon_dao.get_lexicon_by_id(extract_lexicon_ids)
                    lexicon_id_2_name = {str(lexicon["id"]): lexicon["lexicon_name"] for lexicon in lexicon_infos}
                    for lexicon in extract_lexicon:
                        lexicon["name"] = lexicon_id_2_name.get(str(lexicon["id"]))
                    extract_info["lexicon"] = extract_lexicon

                extract_graph = extract_info.get("graph", [])
                if len(extract_graph) > 0:
                    extract_graph_ids = [graph["id"] for graph in extract_graph]
                    graph_infos = graph_dao.get_graph_by_ids(extract_graph_ids)
                    graph_id_2_name = {str(graph["id"]): graph["graph_name"] for graph in graph_infos}
                    for graph in extract_graph:
                        graph["name"] = graph_id_2_name.get(str(graph["id"]))
                    extract_info["graph"] = extract_graph

            res["extract_info"] = extract_info
            res["error_info"] = _l(res["error_info"] if res["error_info"] else res["error_info"])
            if res["status"] == "running":
                res["columns"] = eval(res.get("columns"))
                res["create_by"] = uuid2name.get(res["create_by"])
                res["update_by"] = uuid2name.get(res["update_by"])
                res["word_info"] = []
                
                return 200, res

            # 获取该词库的词汇内容
            count, word_info = lexicon_dao.get_words_page(params_json.get("id"), int(params_json.get("page")),
                                                                 int(params_json.get("size")))
            res["columns"] = eval(res.get("columns"))
            res["count"] = count
            res["create_by"] = uuid2name.get(res["create_by"])
            res["update_by"] = uuid2name.get(res["update_by"])
            if word_info:
                titles = list(word_info[0].keys())
                titles.sort()
            res["word_info"] = word_info
            
            return 200, res
        except Exception as e:
            
            return 500, repr(e)

    def get_knowledge_by_lexicon_id(self, lexicon_id):
        """ 根据id查找词库所属的知识网络id """
        res = lexicon_dao.get_knowledge_by_lexicon_id(int(lexicon_id))
        res = res[0]
        res = res.get("knowledge_id")
        return res

    def is_knowledgeId_exist(self, knowledge_id):
        """ 校验知识网络id是否存在 """
        res = lexicon_dao.get_knowledge_by_id(knowledge_id)
        
        if len(res) == 0:
            return False
        return True

    def is_lexicon_name_exist(self, name, knowledge_id, lexicon_id):
        """ 校验词库名称是否存在 """
        res = []
        ids = lexicon_dao.get_id_by_name(name, knowledge_id)
        for line in ids:
            if line.get("id") != lexicon_id:
                res.append(line.get("id"))
        
        if len(res) > 0:
            return True
        return False

    def is_lexicon_id_exist(self, ids):
        """ 校验词库id是否存在 """
        res = lexicon_dao.get_lexicon_by_id(ids)
        ids = []
        for line in res:
            ids.append(line.get("id"))
        
        return ids

    def file_content_verification(self, flag, columns, word_infos):
        """ 词汇内容校验 """
        message = ""
        res = []
        try:
            if flag == "txt":
                if len(word_infos) == 0:
                    
                    return res, message
                # 列名称有重名
                if len(columns) != len(set(columns)):
                    message = "Builder_LexiconController_CreateLexicon_ContentFormatError"
                    
                    return res, message
                if len(columns) != len(word_infos[0].split("\t")):
                    message = "Builder_LexiconController_CreateLexicon_ContentFormatError"
                    
                    return res, message
                for line in word_infos:
                    line_dict = {}
                    values = line.split("\t")
                    if len(values) != len(columns):
                        continue
                    for i in range(len(values)):
                        if values[i].strip() and len(values[i].strip()) <= 200:
                            line_dict[columns[i].strip()] = values[i].strip()
                    if len(line_dict) == len(columns):
                        res.append(line_dict)
            else:
                for column in columns:
                    word_infos[column] = word_infos[column].str.strip()
                    word_infos[column].replace('', np.nan, inplace=True)
                    word_infos = word_infos[~word_infos[column].str.len().gt(200)]
                # 删除包含空置的行
                word_infos = word_infos.dropna(axis=0, how="any")
                # 重置索引
                word_infos = word_infos.reset_index()
                if "index" in word_infos.columns.tolist():
                    word_infos = word_infos.drop(labels='index', axis=1)
                res = word_infos.to_dict("records")
            if len(res) > 350000:
                message = "DataExceeded"
            
            return res, message
        except Exception as e:
            message = repr(e)
            
            return res, message

    def file_columns_verification(self, columns):
        """ 词汇内容列名字段校验 """
        message = ""
        if len(columns) > 5:
            message = "Builder_LexiconController_CreateLexicon_ContentFormatError"
            
            return message
        if len(columns) != len(set(columns)):
            message = "Builder_LexiconController_CreateLexicon_ContentFormatError"
            
            return message
        for key in columns:
            if not re.search(u'^[_a-zA-Z0-9]+$', key):
                message = "Builder_LexiconController_CreateLexicon_ContentFormatError"
                
                return message
            if len(key) > 50:
                message = "Builder_LexiconController_CreateLexicon_ContentFormatError"
                
                return message
            
        return message

    def get_file_content(self, file_path):
        """ 获取文件内容 """
        contents, columns = [], []
        message, flag = "", ""
        try:
            if file_path.endswith("csv"):
                flag = "csv"
                df = pd.read_csv(file_path, dtype="string")
                columns = df.columns.tolist()
                if "index" in columns:
                    columns.remove("index")
                contents = df
            else:
                flag = "txt"
                with open(file_path, "r", encoding="utf-8-sig") as f:
                    lines = f.readlines()
                    if len(lines) == 0:
                        
                        return columns, contents, flag, message
                    columns = [str(key.strip()) for key in lines[0].split("\t")]
                    contents = lines[1:]
            
            return columns, contents, flag, message
        except Exception as e:
            if "utf-8" in repr(e):
                message = "Builder_LexiconController_CreateLexicon_EncodingError"
            elif "No columns to parse from file" in repr(e):
                message = ""
            elif "UnicodeDecodeError" in repr(e):
                message = "Builder_LexiconController_CreateLexicon_EncodingError"
            else:
                message = repr(e)
            
            return columns, contents, flag, message

    def get_lexicon_list(self, params_json):
        """ 查找满足条件的lexicon """
        obj = {}
        data = []
        lexicon_ids = params_json.get("lexicon_ids")
        try:
            page = int(params_json.get("page"))
            size = int(params_json.get("size"))
            if not params_json.get("word"):
                # 获取全部词库
                count = lexicon_dao.get_lexicon_count(params_json.get("knowledge_id"), lexicon_ids)
                res = lexicon_dao.get_all_lexicon(params_json.get("knowledge_id"),
                                                  params_json.get("rule"),
                                                  params_json.get("order"),
                                                  page,
                                                  size,
                                                  lexicon_ids)
                for line in res:
                    lexicon = {}
                    lexicon["id"] = line.get("id")
                    lexicon["name"] = line.get("lexicon_name")
                    lexicon["status"] = line.get("status")
                    error_info = line.get("error_info")
                    lexicon["error_info"] = _l(error_info) if error_info else error_info
                    lexicon["columns"] = eval(line.get("columns"))
                    data.append(lexicon)
                obj = {
                    "count": count,
                    "df": data
                }
            else:

                id2lexicons = {}
                # 在名称中搜索
                res = lexicon_dao.get_all_lexicon_by_name(params_json.get("knowledge_id"),
                                                          params_json.get("word"),
                                                          lexicon_ids)
                for line in res:
                    line["weight"] = 1.0
                    id2lexicons[line.get("id")] = line

                lexicon_list = list(id2lexicons.values())
                if len(lexicon_list) == 0:
                    obj = {
                        "count": 0,
                        "df": []
                    }
                    return 200, obj
                rule = params_json.get("rule") if params_json.get("rule") else "update_time"
                order = True if params_json.get("order") == "asc" else False

                lexicon_list = self.dict_order(dict_info=lexicon_list, sort_field=["weight", rule],
                                               sort_rules=[False, order])
                count = len(lexicon_list)
                # 权重排序
                lexicon_list = lexicon_list[(page - 1) * size: page * size]
                for temp in lexicon_list:
                    data.append(
                        {"id": temp.get("id"), "name": temp.get("lexicon_name"), "columns": eval(temp.get("columns")),
                         "status": temp.get("status"), "error_info": temp.get("error_info")})
                    # data.append(temp)
                obj = {
                    "count": count,
                    "df": data
                }
            
            return 200, obj
        except Exception as e:
            
            return 500, repr(e)

    def dict_order(self, dict_info, sort_field, sort_rules):
        # 将字典转换成 DataFrame
        df_data = pd.DataFrame(dict_info)
        # 利用 DataFrame 进行排序
        df_data = df_data.sort_values(by=sort_field, axis=0, ascending=sort_rules, inplace=False)
        # 将排序好的结果再转成字典
        res_dict = df_data.to_dict(orient="records")
        return res_dict

    def insert_words(self, lexicon_id, word_info, user_id, insert_one=False):
        """ 词库新增词汇"""
        message = ""
        try:
            # 校验格式
            columns = self.get_columns_from_lexicon(lexicon_id)
            if len(word_info) == 0:
                if not insert_one:
                    lexicon_dao.update_lexicon_status(lexicon_id, "success")
                
                return 200, message
            if set(columns) != set((word_info[0].keys())) and columns:
                return 500, "Builder_LexiconController_InsertLexiconWord_FormatMismatch"
            # 校验词汇是否已经存在
            if insert_one and lexicon_dao.is_word_exist_info(lexicon_id, word_info[0]):
                return 500, "Builder_LexiconController_InsertLexiconWord_WordExisted"

            titles = list(word_info[0].keys())
            # mysql中更新操作时间，操作人
            if set(columns) == set(word_info[0].keys()):
                lexicon_dao.update_lexicon_user_and_time(lexicon_id, user_id)
            else:
                lexicon_dao.update_lexicon_columns(lexicon_id, titles, user_id)
            # 新增词汇
            lexicon_dao.write_lexicon_words(user_id, lexicon_id, word_info)
            if not insert_one:
                lexicon_dao.update_lexicon_status(lexicon_id, "success")
            return 200, message

        except Exception as e:
            message = repr(e)
            if not insert_one:
                lexicon_dao.update_lexicon_status(lexicon_id, "failed")
                lexicon_dao.update_lexicon_error_info(lexicon_id, message)

        return 500, message

    def get_columns_from_lexicon(self, lexicon_id):
        res = lexicon_dao.get_columns_from_lexicon(lexicon_id)
        res = res[0]
        columns = eval(res.get("columns"))
        return columns

    def search_word_in_lexicon(self, params_json):
        """ 词库中搜索词汇 """
        try:
            count, data = lexicon_dao.get_word_by_condition(params_json.get("id"), params_json.get("word"),
                                                                  params_json.get("page"),
                                                                  params_json.get("size"))
            obj = {"count": count,
                   "df": data}
            
            return 200, obj
        except Exception as e:
            message = repr(e)
                
        return 500, message

    def edit_word_in_lexicon(self, params_json, user_id):
        """ 在词库中修改词汇 """
        error_code = ""
        try:
            # 被修改的词汇是否存在
            if not lexicon_dao.is_word_exist_id(params_json.get("id"), params_json.get("word_id")):
                return "Builder_LexiconController_EditLexiconWord_LexiconWordNotExist"
            # 修改后的词汇是否存在
            if lexicon_dao.is_word_exist_info(params_json.get("id"), params_json.get("new_info")):
                return "Builder_LexiconController_EditLexiconWord_LexiconWordExisted"
            # 词汇格式
            mode = lexicon_dao.get_mode_by_lexicon_id(params_json.get("id"))
            std_keys = {"synonym", "std_name", "std_property", "ent_name", "graph_id"}
            entity_link_keys = {"words", "vid", "ent_name", "graph_id"}
            custom_keys = {"words"}
            keys = {}
            if mode == "std":
                keys = std_keys
            elif mode == "entity_link":
                keys = entity_link_keys
            elif mode == "custom":
                keys = custom_keys

            if keys != set(params_json.get("new_info").keys()):
                return "Builder_LexiconController_EditLexiconWord_FormatMismatch"

            # 修改
            lexicon_dao.update_word(params_json.get("id"), int(params_json.get("word_id")),
                                             params_json.get("new_info"))
            # mysql中更新操作时间，操作人
            self.update_lexicon(params_json.get("id"), user_id)
            
        except Exception as e:
            error_code = repr(e)
        return error_code

    def delete_word_in_lexicon(self, params_json, user_id):
        """ 在词库中删除词汇 """
        error_code = ""
        try:
            # 词汇是否存在
            word_ids = []
            for word_id in params_json.get("word_ids"):
                if lexicon_dao.is_word_exist_id(params_json.get("id"), int(word_id)):
                    word_ids.append(word_id)
            if len(word_ids) == 0:
                return "Builder.LexiconController.DeleteLexiconWord.WordNotExist"
            lexicon_dao.delete_words(params_json.get("id"), word_ids)
            # mysql中更新操作时间，操作人
            self.update_lexicon(params_json.get("id"), user_id)

        except Exception as e:
            error_code = repr(e)

        return error_code

    def get_lexicon_status(self, lexicon_ids):
        """ 获取词库状态为非running的词库 """
        if not isinstance(lexicon_ids, list):
            lexicon_ids = [lexicon_ids]
        ids = lexicon_dao.get_all_status(lexicon_ids)
        res = [line.get("id") for line in ids]
            
        return res

    def export_lexicon(self, ids):
        """ 导出词库"""
        file_path = '/tmp/'
        if os.name == 'nt':
            file_path = 'C:/Users/Public/Downloads/'
        timestamp = time.time()
        timestampString = "{0}".format(timestamp).replace(".", "")
        dir_name = "export_lexicon_{}".format(timestampString)
        save_path = file_path+'{}'
        save_path = save_path.format(dir_name)
        if not os.path.exists(save_path):
            os.mkdir(save_path)
        txt_dir = os.path.join(save_path, "TXT")
        csv_dir = os.path.join(save_path, "CSV")
        if not os.path.exists(txt_dir):
            os.mkdir(txt_dir)
        if not os.path.exists(csv_dir):
            os.mkdir(csv_dir)
        file_name = ""
        flags = 0  # 非空词库的个数
        for id in ids:
            # 词库名称
            res = lexicon_dao.get_lexicon_by_id(id)
            res = res[0]
            lexicon_name = res.get("lexicon_name")
            word_infos = lexicon_dao.get_all_words(id)
            if word_infos:
                word_info_df = pd.DataFrame(word_infos)
                csv_name = "{}.csv".format(lexicon_name)
                word_info_df.to_csv(os.path.join(csv_dir, csv_name), sep=",", index=0)

                file_name = "{}.txt".format(lexicon_name)
                flags += 1
                keys = list(word_infos[0].keys())
                with open(os.path.join(txt_dir, file_name), "w", encoding="utf_8_sig") as f:
                    f.write("\t".join(keys) + "\n")
                    for word_info in word_infos:
                        line = [word_info.get(key) for key in keys]
                        line = list(map(str, line))
                        f.write("\t".join(line) + "\n")
        #
        # if flags > 1:
        #     # 压缩
        file_name = "exported_lexicons.zip"
        file_path = '/tmp'
        if os.name == 'nt':
            file_path = 'C:/Users/Public/Downloads'
        self.make_zip(save_path, os.path.join(file_path, file_name))
            
        return file_path, file_name, flags

    # 压缩
    def make_zip(self, source_dir, output_filename):
        zipf = zipfile.ZipFile(output_filename, 'w')
        pre_len = len(os.path.dirname(source_dir))
        for parent, dirnames, filenames in os.walk(source_dir):
            for filename in filenames:
                pathfile = os.path.join(parent, filename)
                arcname = pathfile[pre_len:].strip(os.path.sep)  # 相对路径
                zipf.write(pathfile, arcname)
        zipf.close()

    def download_template(self):
        """ 下载词库模板文件 """
        current_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(current_path, "template/")
        file_name = "Template.zip"
            
        return file_path, file_name

    def delete_all_words(self, lexicon_id):
        lexicon_dao.delete_all_words(lexicon_id)

    def download_lexicon(self, ids):
        """ 导出词库"""
        file_path = '/tmp/'
        if os.name == 'nt':
            file_path = 'C:/Users/Public/Downloads/'
        synonym_name = f"{uuid.uuid1()}.txt"
        save_path = file_path+'{}'
        save_path = save_path.format(synonym_name)
        flag = 1
        for id in ids:
            word_infos = lexicon_dao.get_all_words(id)
            with open(save_path, "w", encoding="utf_8_sig") as f:
                if word_infos:
                    keys = list(word_infos[0].keys())
                    f.write("\t".join(keys) + "\n")
                else:
                    flag = 0
                for word_info in word_infos:
                    line = [word_info.get(key) for key in keys]
                    line = list(map(str, line))
                    f.write("\t".join(line) + "\n")
        return file_path, synonym_name, flag

    def generate_synonym(self, mode, graph_id, contents):
        synonym_dict = {}
        std_pro_dict = {}
        for v in contents:
            if v.endswith('\n'):
                v = v[:-1]
            otl_name = v.split('\t')[0]
            synonym_dict[otl_name] = {}
            otl_pros = v.split('\t')[1].split('|')
            otl_pros_sep = v.split('\t')[2].split('|')
            for index, otl_pro in enumerate(otl_pros):
                if index == 0:
                    std_pro_dict[otl_name] = otl_pro
                synonym_dict[otl_name][otl_pro] = otl_pros_sep[index]
        synonym_name = f"synonym_{mode}.txt"
        synonym_file_path = os.path.dirname(os.path.abspath(__file__))
        synonym_path = os.path.join(synonym_file_path, synonym_name)
        ret_code, ret_message = graph_Service.getGraphById(graph_id, host_url="")
        res = ret_message['res']
        graph_KMap = res['graph_KMap']
        kmap_config = GraphKMapConfig(graph_KMap)
        ontology = res['graph_otl'][0]
        ontology_config = OntologyConfig(ontology)

        synonym_file = open(synonym_path, 'w')
        if mode == "custom":
            synonym_file.write("words\n")
        elif mode == "entity_link":
            synonym_file.write("words\tvid\n")
        else:
            synonym_file.write("synonym\tstd_name\tstd_property\tent_name\n")

        for otl_name, std_pro in std_pro_dict.items():
            otl_info = kmap_config.entity_info(otl_name)
            data_source = otl_info.data_source
            file_name = otl_info.files['files'][0]['file_name']
            batch_size = 200000
            skip = 0
            if data_source == 'mysql':
                try:
                    transfer = MysqlTransfer({'name': otl_name}, kmap_config)
                    client = transfer.get_client_dict()
                    cursor = client.cursor()
                    sql_column = f"desc `{file_name}`"
                    cursor.execute(sql_column)
                    df_column = cursor.fetchall()
                except Exception:
                    return synonym_file_path, synonym_name, 1
                columns = [x['Field'] for x in df_column]
                columns_new = [f"`{column}` as `{otl_util.is_special(column)}`" for column in columns]
                columns_str = ",".join(columns_new)
                while True:
                    sql = f"select {columns_str} from `{file_name}` limit {skip}, {batch_size}"
                    cursor.execute(sql)
                    data = cursor.fetchall()
                    if len(data) <= 0:
                        break
                    for row in data:
                        std_lexicon = row[otl_info.otl_tab[std_pro]]
                        if not std_lexicon:
                            continue
                        for otl_prop, otl_pro_sep in synonym_dict[otl_name].items():
                            tab_pro = otl_info.otl_tab[otl_prop]
                            if not row[tab_pro]:
                                continue
                            else:
                                res = str(row[tab_pro]).split(otl_pro_sep)
                                for v in res:
                                    if not v:
                                        continue
                                    if mode == "custom":
                                        synonym_file.write(f"{v}\n")
                                    elif mode == "entity_link":
                                        idval = otl_name + '_'
                                        for primary_key in ontology_config.pro_merge[otl_name]:
                                            primary_column = otl_info.otl_tab[primary_key]
                                            vid_value = row[primary_column]
                                            vid_value = normalize_text(str(vid_value))
                                            idval += f'{vid_value}_'
                                        vid = get_md5(idval)
                                        synonym_file.write(f"{v}\t{vid}\n")
                                    else:
                                        synonym_file.write(f"{v}\t{std_lexicon}\t{std_pro}\t{otl_name}\n")
                    skip += batch_size
            elif data_source == "hive":
                try:
                    transfer = HiveTransfer({'name': otl_name}, kmap_config)
                    client = transfer.get_client()
                    hive_conn = client.conn
                    hive_cursor = hive_conn.cursor(dictify=True)
                    columns = transfer.get_columns()
                    columns_str = ",".join([f"`{column}` as `{otl_util.is_special(column)}`" for column in columns])
                    database = transfer.data_ds['ds_path']
                    sql = f"SELECT {columns_str} FROM {database}.`{transfer.table_name}`"
                    hive_cursor.execute(sql)
                except Exception:
                    return synonym_file_path, synonym_name, 1
                while True:
                    data = hive_cursor.fetchmany(size=1000000)
                    if not data:
                        hive_conn.close()
                        break
                    for row in data:
                        std_lexicon = row[otl_info.otl_tab[std_pro]]
                        if not std_lexicon:
                            continue
                        for otl_prop, otl_pro_sep in synonym_dict[otl_name].items():
                            tab_pro = otl_info.otl_tab[otl_prop]
                            if not row[tab_pro]:
                                continue
                            else:
                                res = row[tab_pro].split(otl_pro_sep)
                                for v in res:
                                    if not v:
                                        continue
                                    if mode == "custom":
                                        synonym_file.write(f"{v}\n")
                                    elif mode == "entity_link":
                                        idval = otl_name + '_'
                                        for primary_key in ontology_config.pro_merge[otl_name]:
                                            primary_column = otl_info.otl_tab[primary_key]
                                            vid_value = row[primary_column]
                                            vid_value = normalize_text(str(vid_value))
                                            idval += f'{vid_value}_'
                                        vid = get_md5(idval)
                                        synonym_file.write(f"{v}\t{vid}\n")
                                    else:
                                        synonym_file.write(f"{v}\t{std_lexicon}\t{std_pro}\t{otl_name}\n")
        synonym_file.close()
        return synonym_file_path, synonym_name, 0


lexicon_service = LexiconService()

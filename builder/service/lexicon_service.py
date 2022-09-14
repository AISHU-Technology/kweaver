# -*- coding: utf-8 -*-
'''
@Author ：Jay.zhu
@Date ：2022/9/14 9:03
'''
import os
import re
import time
import zipfile
import numpy as np
import pandas as pd
from dao.lexicon_dao import lexicon_dao
from utils.ConnectUtil import mongoConnect

db = mongoConnect.connect_mongo()


class LexiconService:
    def insert_lexicon(self, lexicon_id, word_dict_list):
        """ 新建词库 """
        try:
            # 若有词库文件，则词汇信息插入mongodb
            if len(word_dict_list) == 0:
                lexicon_dao.update_lexicon_status(lexicon_id, "success")
            else:
                mongodb_name = "Lexicon-{}".format(lexicon_id)
                try:
                    lexicon_dao.write_lexicon2mongo(db, mongodb_name, word_dict_list)
                    lexicon_dao.update_lexicon_status(lexicon_id, "success")
                except Exception as e:
                    lexicon_dao.update_lexicon_status(lexicon_id, "failed")
                    lexicon_dao.update_lexicon_error_info(lexicon_id, repr(e))
                    return 500, repr(e)
            return 200, ""
        except Exception as e:
            return 500, repr(e)
    
    def delete_lexicon(self, ids):
        """ 删除词库 """
        try:
            # 删除词库
            lexicon_id = lexicon_dao.delete_lexicon(ids)
            for id in ids:
                self.delete_word_in_mongo(id)
            return 200, lexicon_id
        except Exception as e:
            return 500, repr(e)
    
    def edit_lexicon(self, params_json):
        """ 编辑词库信息 """
        try:
            # 编辑词库信息
            labels = list(set(params_json.get("labels")))
            lexicon_id = lexicon_dao.update_lexicon(params_json.get("id"), params_json.get("name"),
                                                    labels, params_json.get("description"))
            return 200, lexicon_id
        except Exception as e:
            return 500, repr(e)
    
    def update_lexicon(self, id):
        """ 更新词库update_time和operate_user """
        try:
            # 编辑词库信息
            lexicon_id = lexicon_dao.update_lexicon_user_and_time(id)
            return 200, lexicon_id
        except Exception as e:
            return 500, repr(e)
    
    def update_lexicon_columns(self, id, columns):
        """ 更新词库update_time和operate_user """
        try:
            lexicon_id = lexicon_dao.update_lexicon_columns(id, columns)
            return 200, lexicon_id
        except Exception as e:
            return 500, repr(e)
    
    def get_labels(self, knowledge_id):
        """ 获取词库候选标签 """
        labels = []
        try:
            # 获取标签
            df = lexicon_dao.get_all_labels(knowledge_id)
            df = df.to_dict("records")
            for line in df:
                labels_list = eval(line.get("labels"))
                for label in labels_list:
                    if label not in labels:
                        labels.append(label)
            return 200, labels
        except Exception as e:
            return 500, repr(e)
    
    def get_lexicon_by_id(self, params_json):
        """ 获取指定id的词库信息 """
        try:
            # 获取词库信息
            df = lexicon_dao.get_lexicon_by_id(int(params_json.get("id")))
            res = df.to_dict("records")[0]
            
            # 获取该词库的词汇内容
            mongodb_name = "Lexicon-{}".format(params_json.get("id"))
            count, word_info = lexicon_dao.get_all_lexicon2mongo(db, mongodb_name, int(params_json.get("page")),
                                                                 int(params_json.get("size")))
            res["labels"] = eval(res.get("labels"))
            res["columns"] = eval(res.get("columns"))
            res["count"] = count
            if word_info:
                titles = list(word_info[0].keys())
                titles.sort()
            res["word_info"] = word_info
            return 200, res
        except Exception as e:
            return 500, repr(e)
    
    def get_knowledge_by_lexicon_id(self, lexicon_id):
        """ 根据id查找词库所属的知识网络id """
        df = lexicon_dao.get_knowledge_by_lexicon_id(int(lexicon_id))
        res = df.to_dict("records")[0]
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
        df = lexicon_dao.get_id_by_name(name, knowledge_id)
        df = df.to_dict("records")
        for line in df:
            if line.get("id") != lexicon_id:
                res.append(line.get("id"))
        
        if len(res) > 0:
            return True
        return False
    
    def is_lexicon_id_exist(self, ids):
        """ 校验词库id是否存在 """
        df = lexicon_dao.get_lexicon_by_id(ids)
        df = df.to_dict("records")
        ids = []
        for line in df:
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
                        if values[i].strip() and len(values[i].strip()) <= 50:
                            line_dict[columns[i].strip()] = values[i].strip()
                    if len(line_dict) == len(columns):
                        res.append(line_dict)
            else:
                for column in columns:
                    word_infos[column] = word_infos[column].str.strip()
                    word_infos[column].replace('', np.nan, inplace=True)
                    word_infos = word_infos[~word_infos[column].str.len().gt(50)]
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
    
    def get_file_content(self, file):
        """ 获取文件内容 """
        contents, columns = [], []
        message, flag = "", ""
        try:
            if file.endswith("csv"):
                flag = "csv"
                df = pd.read_csv(file, dtype="string")
                columns = df.columns.tolist()
                if "index" in columns:
                    columns.remove("index")
                contents = df
            else:
                flag = "txt"
                with open(file, "r", encoding="utf-8-sig") as f:
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
        try:
            page = int(params_json.get("page"))
            size = int(params_json.get("size"))
            if not params_json.get("word"):
                # 获取全部词库
                count = lexicon_dao.get_lexicon_count(params_json.get("knowledge_id"))
                df = lexicon_dao.get_all_lexicon(params_json.get("knowledge_id"),
                                                 params_json.get("rule"),
                                                 params_json.get("order"),
                                                 page,
                                                 size)
                df = df.to_dict("records")
                for line in df:
                    lexicon = {}
                    lexicon["id"] = line.get("id")
                    lexicon["name"] = line.get("lexicon_name")
                    lexicon["status"] = line.get("status")
                    lexicon["error_info"] = line.get("error_info")
                    lexicon["columns"] = eval(line.get("columns"))
                    data.append(lexicon)
                obj = {
                    "count": count,
                    "df": data
                }
            else:
                
                id2lexicons = {}
                # 在名称中搜索
                df_name = lexicon_dao.get_all_lexicon_by_name(params_json.get("knowledge_id"), params_json.get("word"))
                df_name = df_name.to_dict("records")
                for line in df_name:
                    line["weight"] = 1.0
                    id2lexicons[line.get("id")] = line
                # 在标签中搜索
                df_label = lexicon_dao.get_all_lexicon_by_label(params_json.get("knowledge_id"),
                                                                params_json.get("word"))
                df_label = df_label.to_dict("records")
                for line in df_label:
                    if line.get("id") in id2lexicons:
                        id2lexicons[line.get("id")]["weight"] += 0.5
                    else:
                        line["weight"] = 0.5
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
    
    def insert_data2mongo(self, lexicon_id, word_info, insert_one=False):
        """ 词库新增词汇"""
        message = ""
        try:
            if not insert_one:
                # 更新状态
                lexicon_dao.update_lexicon_status(lexicon_id, "running")
            # 校验格式
            mongodb_name = "Lexicon-{}".format(lexicon_id)
            columns = self.get_columns_from_lexicon(lexicon_id)
            if len(word_info) == 0:
                if not insert_one:
                    lexicon_dao.update_lexicon_status(lexicon_id, "success")
                return 200, message
            if set(columns) != set((word_info[0].keys())) and columns:
                return 500, "Builder_LexiconController_InsertLexiconWord_FormatMismatch"
            # 校验词汇是否已经存在
            if insert_one and lexicon_dao.is_word_exist_mongo(db, mongodb_name, word_info[0]):
                return 500, "Builder_LexiconController_InsertLexiconWord_WordExisted"
            
            titles = list(word_info[0].keys())
            # mysql中更新操作时间，操作人
            if set(columns) == set(word_info[0].keys()):
                lexicon_dao.update_lexicon_user_and_time(lexicon_id)
            else:
                lexicon_dao.update_lexicon_columns(lexicon_id, titles)
            if not insert_one:
                lexicon_dao.update_lexicon_status(lexicon_id, "success")
            # 新增词汇
            lexicon_dao.write_lexicon2mongo(db, mongodb_name, word_info)
            return 200, message
        
        except Exception as e:
            message = repr(e)
            if not insert_one:
                lexicon_dao.update_lexicon_status(lexicon_id, "failed")
                lexicon_dao.update_lexicon_error_info(lexicon_id, message)
        
        return 500, message
    
    def get_columns_from_lexicon(self, lexicon_id):
        df = lexicon_dao.get_columns_from_lexicon(lexicon_id)
        df = df.to_dict("records")[0]
        columns = eval(df.get("columns"))
        return columns
    
    def search_word_in_lexicon(self, params_json):
        """ 词库中搜索词汇 """
        mongodb_name = "Lexicon-{}".format(params_json.get("id"))
        try:
            count, data = lexicon_dao.get_word_by_condition_mongo(db, mongodb_name, params_json.get("word"),
                                                                  params_json.get("page"),
                                                                  params_json.get("size"))
            obj = {"count": count,
                   "df": data}
            return 200, obj
        except Exception as e:
            message = repr(e)
        return 500, message
    
    def edit_word_in_lexicon(self, params_json):
        """ 在词库中修改词汇 """
        mongodb_name = "Lexicon-{}".format(params_json.get("id"))
        error_code = ""
        try:
            # 被修改的词汇是否存在
            if not lexicon_dao.is_word_exist_mongo(db, mongodb_name, params_json.get("old_info")):
                return "Builder_LexiconController_EditLexiconWord_LexiconWordNotExist"
            # 修改后的词汇是否存在
            if lexicon_dao.is_word_exist_mongo(db, mongodb_name, params_json.get("new_info")):
                return "Builder_LexiconController_EditLexiconWord_LexiconWordExisted"
            # 词汇格式
            if set(params_json.get("old_info").keys()) != set(params_json.get("new_info").keys()):
                return "Builder_LexiconController_EditLexiconWord_FormatMismatch"
            
            # mongodb中修改
            lexicon_dao.update_lexicon2mongo(db, mongodb_name, params_json.get("old_info"),
                                             params_json.get("new_info"))
            # mysql中更新操作时间，操作人
            self.update_lexicon(params_json.get("id"))
        except Exception as e:
            error_code = repr(e)
        return error_code
    
    def delete_word_in_lexicon(self, params_json):
        """ 在词库中删除词汇 """
        mongodb_name = "Lexicon-{}".format(params_json.get("id"))
        error_code = ""
        try:
            # 词汇是否存在
            word_infos = []
            for word_info in params_json.get("word_info_list"):
                if lexicon_dao.is_word_exist_mongo(db, mongodb_name, word_info):
                    word_infos.append(word_info)
            if len(word_infos) == 0:
                return "Builder.LexiconController.DeleteLexiconWord.WordNotExist"
            lexicon_dao.delete_lexicon_word2mongo(db, mongodb_name, word_infos)
            # mysql中更新操作时间，操作人
            self.update_lexicon(params_json.get("id"))
        except Exception as e:
            error_code = repr(e)
        return error_code
    
    def get_lexicon_status(self, lexicon_ids):
        """ 获取词库状态为非running的词库 """
        if not isinstance(lexicon_ids, list):
            lexicon_ids = [lexicon_ids]
        df = lexicon_dao.get_all_status(lexicon_ids)
        df = df.to_dict("records")
        res = [line.get("id") for line in df]
        return res
    
    def export_lexicon(self, ids):
        """ 导出词库"""
        file_path = "/tmp/"
        timestamp = time.time()
        timestampString = "{0}".format(timestamp).replace(".", "")
        dir_name = "export_lexicon_{}".format(timestampString)
        save_path = "/tmp/{}".format(dir_name)
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
            df = lexicon_dao.get_lexicon_by_id(id)
            df = df.to_dict("records")[0]
            lexicon_name = df.get("lexicon_name")
            mongodb_name = "Lexicon-{}".format(id)
            word_infos = lexicon_dao.get_all_words_from_mongo(db, mongodb_name)
            
            if word_infos:
                word_info_df = pd.DataFrame(word_infos)
                csv_name = "{}.csv".format(lexicon_name)
                word_info_df.to_csv(os.path.join(csv_dir, csv_name), sep=",", index=0)
                
                file_name = "{}.txt".format(lexicon_name)
                flags += 1
                keys = list(word_infos[0].keys())
                with open(os.path.join(txt_dir, file_name), "w", encoding="utf-8") as f:
                    f.write("\t".join(keys) + "\n")
                    for word_info in word_infos:
                        line = [word_info.get(key) for key in keys]
                        line = list(map(str, line))
                        f.write("\t".join(line) + "\n")
        
        file_name = "exported_lexicons.zip"
        self.make_zip(save_path, os.path.join("/tmp", file_name))
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
        file_path = os.path.join(current_path, "utils/")
        file_name = "Template.zip"
        return file_path, file_name
    
    def delete_word_in_mongo(self, id):
        mongodb_name = "Lexicon-{}".format(id)
        lexicon_dao.delete_lexicon_2mongo(db, mongodb_name)


lexicon_service = LexiconService()

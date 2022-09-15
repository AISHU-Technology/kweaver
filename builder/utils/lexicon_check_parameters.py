# -*- coding: utf-8 -*-
import re


class LexiconCheckParameters(object):
    """
    词库相关接口参数校验
    """
    VALID = 0
    INVALID = -1
    message = ""
    
    def params_check(self, params_json, required, file=False):
        """ 校验是否缺少参数或者有额外的参数"""
        message = ""
        extra = list(set(params_json.keys()) - set(required))  # 额外的参数
        lacked = list(set(required) - set(params_json.keys()))  # 缺少的参数
        if file and "file" in extra:
            extra.remove("file")
        if len(lacked):
            message += "missing required parameter：{};".format(", ".join(lacked))
        if "timestamp" in extra:
            extra.remove("timestamp")
        if len(extra):
            message += "extra parameter ：{};".format(", ".join(extra))
        return message
    
    def check_insert_lexicon(self, params_json, param):
        """  新建词库接口参数校验 """
        ret_status = self.VALID
        required = ["name", "labels", "description", "knowledge_id"]
        message = self.params_check(param, required, file=True)
        for key, value in params_json.items():
            if key in ["name", "description"]:
                if not isinstance(value, str):
                    message += "parameter {} must be string; ".format(str(key))
                else:
                    if key == "name":
                        if len(value) == 0:
                            message += "lexicon name can not be empty;"
                        elif len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                            message += "the maximum length of lexicon name is 50, and character must be number, _, Chinese or English; "
                    else:
                        if len(params_json.get("description")) > 150:
                            message += "the maximum length of lexicon description is 150; "
                        if len(value) > 0 and not re.search(
                                u'^[-_a-zA-Z0-9 =~!@#$&%^&*\'\"\“、\‘()_+`{}[\];:,.·?<>|/~！$\s/\n\\\s@#￥%…&*“”（）—+。={}|【】：；、《》？，。\u4e00-\u9fa5]+$',
                                value):
                            message += "lexicon description character illegal; "
            elif key == "knowledge_id":
                if value:
                    if not value.isdigit():
                        message += "parameter {} must be int and > 0;".format(str(key))
                    else:
                        if int(value) <= 0:
                            message += "parameter {} must > 0; ".format(str(key))
                else:
                    message += "parameter {} cannot be empty; ".format(str(key))
            elif key == "labels":
                try:
                    labels = eval(value)
                    if not isinstance(labels, list):
                        message += "parameter {} must be list; ".format(str(key))
                    else:
                        if len(labels) > 10:
                            message += "The maximum number of lexicon labels is 10;"
                        else:
                            for label in labels:
                                if len(label) > 50:
                                    message += 'the maximum length of lexicon label is 50;'
                                elif len(label.strip()) == 0:
                                    message += 'lexicon label cannot be empty;'
                                elif re.search(u'[#/:*?"<>|]', label):
                                    message += 'lexicon label cannot contain characters [#/:*?"<>|]; '
                except Exception as e:
                    message += "parameter {} must be list; ".format(str(key))
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_get_labels_lexicon(self, params_json):
        """  获取候选标签接口参数校验 """
        ret_status = self.VALID
        required = ["knowledge_id"]
        message = self.params_check(params_json, required)
        if params_json.get("knowledge_id"):
            if not params_json.get("knowledge_id").isdigit():
                message += "parameter knowledge_id must be int; "
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_get_all_lexicon(self, params_json):
        """  获取词库列表接口参数校验 """
        ret_status = self.VALID
        required = ["knowledge_id", "page", "size", "order", "rule", "word"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key in ["knowledge_id", "page", "size"]:
                if not value.isdigit():
                    message += "parameter {} must be int; ".format(key)
                else:
                    if int(value) <= 0:
                        message += "parameter {} must > 0; ".format(key)
            elif key == "order":
                if value not in ["desc", "asc", ""]:
                    message += "the value of parameter order must be in ['asc', 'desc', ''];"
            elif key == "rule":
                if value not in ["create_time", "update_time", "name", ""]:
                    message += "the value of parameter rule must be in ['create_time', 'update_time', 'name', ''];"
            elif key == "word":
                if not isinstance(value, str):
                    message += "parameter {} must be string; ".format(key)
                else:
                    if len(value) > 50:
                        message += "The maximum length of the value of parameter {} is 50; ".format(key)
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_get_lexicon_by_id(self, params_json):
        """  获取词库列表接口参数校验 """
        ret_status = self.VALID
        required = ["id", "page", "size"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if not value.isdigit():
                message += "parameter {} must be int; ".format(key)
            else:
                if int(value) <= 0:
                    message += "parameter {} must > 0; ".format(key)
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_get_lexicon_by_name(self, params_json):
        """  获取词库列表接口参数校验 """
        ret_status = self.VALID
        required = ["name", "labels", "knowledge_id", "page", "size"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key == "name":
                if not isinstance(value, str):
                    message += "parameter {} must be string; ".format(key)
                else:
                    if len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                        message += "the maximum length of lexicon name is 50, and character must be number, _, Chinese or English; "
            elif key == "labels":
                if not isinstance(value, list):
                    message += "parameter {} must be list; ".format(key)
                else:
                    for label in value:
                        if len(label) > 50 or not re.search(u'[#/:*?"<>|]', label):
                            message += 'the maximum length of lexicon label is 50, and and cannot contain characters #/:*?"<>|; '
            elif key in ["knowledge_id", "page", "size"]:
                if not isinstance(value, int):
                    message += "parameter {} must be int; ".format(key)
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_export_lexicon(self, params_json):
        """  导出词库列表接口参数校验 """
        ret_status = self.VALID
        required = ["id_list"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key == "id_list":
                if not isinstance(value, list):
                    message += "parameter {} must be list; ".format(key)
                else:
                    if len(value) > 20:
                        message += "The maximum number of files exported in batch is 20."
                    elif len(value) == 0:
                        message += "parameter id_list cannot be empty;"
                    else:
                        for id in value:
                            if not isinstance(id, int):
                                message += "parameter {} element must be int;"
            # else:
            #     if value not in ["csv", "txt"]:
            #         message += "the value of parameter {} must be in ['csv', 'txt']; ".format(key)
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_add_lexicon_word(self, params_json):
        """ 词库中新增词汇接口参数校验 """
        ret_status = self.VALID
        required = ["id", "word_info"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key == "id":
                if not isinstance(value, int):
                    message += "parameter {} must be int; ".format(key)
            elif key == "word_info":
                if not isinstance(value, dict):
                    message += "parameter {} must be dict; ".format(key)
                else:
                    for key, v in value.items():
                        if not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', key):
                            message += "The column names can only consist of numbers, letters, _."
                        if not v.strip():
                            message += "word cannot be empty;"
                        if len(v) > 50:
                            message += "the max length of word is 50;"
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_search_lexicon_word(self, params_json):
        """ 词库中搜索词汇接口参数校验 """
        ret_status = self.VALID
        required = ["id", "word", "page", "size"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key == "id":
                if not isinstance(value, int):
                    message += "parameter {} must be int; ".format(key)
            elif key == "word":
                if not isinstance(value, str):
                    message += "parameter {} must be str; ".format(key)
                else:
                    if len(value) > 50:
                        message += "The maximum length of the input word is 50; ".format(key)
            elif key in ["page", "size"]:
                if not isinstance(value, int):
                    message += "parameter {} must be int; ".format(key)
                else:
                    if value <= 0:
                        message += "parameter {} must > 0; ".format(key)
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_edit_lexicon_word(self, params_json):
        """ 词库中编辑词汇接口参数校验 """
        ret_status = self.VALID
        required = ["id", "old_info", "new_info"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key == "id":
                if not isinstance(value, int):
                    message += "parameter {} must be int; ".format(key)
            elif key in ["old_info", "new_info"]:
                if not isinstance(value, dict):
                    message += "parameter {} must be dict; ".format(key)
                else:
                    if key == "new_info":
                        for k, v in value.items():
                            if not v.strip():
                                message += "word cannot be empty; ".format(key)
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_delete_lexicon_word(self, params_json):
        """ 词库中删除词汇接口参数校验 """
        ret_status = self.VALID
        required = ["id", "word_info_list"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key == "id":
                if not isinstance(value, int):
                    message += "parameter {} must be int; ".format(key)
            elif key == "word_info_list":
                if not isinstance(value, list):
                    message += "parameter {} must be list; ".format(key)
                else:
                    if len(value) == 0:
                        message += "parameter {} can not be empty; ".format(key)
                    else:
                        for line in value:
                            if not isinstance(line, dict):
                                message += "parameter {} must be list, and the list element is string; ".format(key)
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_edit_lexicon(self, params_json):
        """ 编辑词库信息接口参数校验 """
        ret_status = self.VALID
        required = ["id", "name", "labels", "description"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key == "id":
                if not isinstance(value, int):
                    message += "parameter {} must be int; ".format(key)
            elif key in ["name", "description"]:
                if not isinstance(value, str):
                    message += "parameter {} must be string; ".format(key)
                else:
                    if key == "name":
                        if len(value.strip()) == 0:
                            message += "lexicon name cna not be empty;"
                        elif len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                            message += "the maximum length of lexicon name is 50, and character must be number, _, Chinese or English; "
                    else:
                        if len(value) > 150:
                            message += "the maximum length of lexcion description is 150; "
                        if len(value) > 0 and not re.search(
                                u'^[-_a-zA-Z0-9 =~!@#$&%^&*\'\"\“、\‘()_+`{}[\];:,.·?<>|/~！$\s/\n\\\s@#￥%…&*“”（）—+。={}|【】：；、《》？，。\u4e00-\u9fa5]+$',
                                value):
                            message += "lexicon description character illegal; "
            elif key == "labels":
                if not isinstance(value, list):
                    message += "parameter {} must be list; ".format(key)
                else:
                    if len(value) > 10:
                        message += "The maximum number of lexicon labels is 10;"
                    else:
                        for label in value:
                            if len(label) > 50:
                                message += 'the maximum length of lexicon label is 50;'
                            elif len(label.strip()) == 0:
                                message += 'lexicon label cannot be empty;'
                            elif re.search(u'[#/:*?"<>|]', label):
                                message += 'lexicon label cannot contain characters [#/:*?"<>|]; '
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_delete_lexicon(self, params_json):
        """ 删除词库接口参数校验 """
        ret_status = self.VALID
        required = ["id_list"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key == "id_list":
                if not isinstance(value, list):
                    message += "parameter {} must be list; ".format(key)
                else:
                    if len(value) == 0:
                        message += "parameter id_list cannot be empty;"
                    else:
                        for id in value:
                            if not isinstance(id, int):
                                message += "parameter {} must be list, and the list element is int; ".format(key)
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_import_words_lexicon(self, params_json, param):
        """ 词库导入词汇接口参数校验 """
        ret_status = self.VALID
        required = ["id", "mode"]
        message = self.params_check(param, required, file=True)
        for key, value in params_json.items():
            if key == "id":
                if value:
                    if not value.isdigit():
                        message += "parameter {} must be int and > 0;".format(str(key))
                    else:
                        if int(value) <= 0:
                            message += "parameter {} must > 0; ".format(str(key))
                else:
                    message += "parameter {} cannot be empty; ".format(str(key))
            elif key == "mode":
                if value not in ["add", "replace"]:
                    message += "parameter {} must be in ['add', 'replace']; ".format(key)
        if message:
            ret_status = self.INVALID
        return ret_status, message
    
    def check_download_template(self, params_json):
        """ 词库模板下载接口参数校验 """
        ret_status = self.VALID
        required = []
        message = self.params_check(params_json, required)
        if message:
            ret_status = self.INVALID
        return ret_status, message


lexicon_check_parameters = LexiconCheckParameters()

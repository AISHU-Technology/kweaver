# -*- coding: utf-8 -*-
'''
@Author ：Jay.zhu
@Date ：2022/8/13 10:37
'''
import re
from utils.CommonUtil import RegularEnum
from flask_babel import gettext as _l


class LexiconCheckParameters(object):
    """
    词库相关接口参数校验
    """
    VALID = 0
    INVALID = -1
    message = ""

    def params_check(self, params_json, required):
        """ 校验是否缺少参数 """
        message = ""
        lacked = list(set(required) - set(params_json.keys()))  # 缺少的参数
        if len(lacked):
            message += _l("missing required parameter：{};").format(", ".join(lacked))
        return message

    def check_insert_lexicon(self, params_json, param):
        """  新建词库接口参数校验 """
        ret_status = self.VALID
        required = ["name", "description", "knowledge_id"]
        message = self.params_check(param, required)
        for key, value in params_json.items():
            if key in ["name", "description"]:
                if not isinstance(value, str):
                    message += "parameter {} must be string; ".format(str(key))
                else:
                    if key == "name":
                        if len(value) == 0:
                            message += "lexicon name can not be empty;"
                        elif len(value) > 50 or not re.search(
                                RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                value):
                            message += "lexicon name only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits."
                    else:
                        if len(value) > 255 or not (re.search(
                                RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                value) or len(value) == 0):
                            message += key + _l(
                                " only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-255 digits.")
            elif key == "knowledge_id":
                if value:
                    if not value.isdigit():
                        message += "parameter {} must be int and > 0;".format(str(key))
                    else:
                        if int(value) <= 0:
                            message += "parameter {} must > 0; ".format(str(key))
                else:
                    message += "parameter {} cannot be empty; ".format(str(key))
        if message:
            ret_status = self.INVALID
        return ret_status, message

    def check_create_template_lexicon(self, params_json):
        ret_status = self.VALID
        required = ["name", "description", "knw_id", "mode"]
        message = self.params_check(params_json, required)

        for key, value in params_json.items():
            # check name
            if key == "name":
                if not isinstance(value, str):
                    message += _l("Parameter %s must be a string type. ") % key
                elif not value:
                    message += _l("Parameter %s cannot be empty. ") % key
                elif len(value) > 50 or not re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        value):
                    message += "name" + _l(
                        " only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits.")
            # check description
            elif key == "description":
                if not isinstance(value, str):
                    message += _l("Parameter %s must be a string type. ") % key
                elif len(value) > 255 or not (re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        value) or len(value) == 0):
                    message += key + _l(
                        " only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-255 digits.")
            # check knw_id
            elif key == "knw_id":
                if not isinstance(value, int) or value <= 0:
                    message += key + _l(" must be int, and more than zero!")
            # check mode
            elif key == "mode":
                mode_list = ["std", "custom", "entity_link"]
                if not isinstance(value, str):
                    message += _l("Parameter %s must be a string type. ") % key
                if value not in mode_list:
                    message += _l("Parameter %s must be in %s. ") % (key, str(mode_list))

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

    def check_download_lexicon(self, params_json):
        """  导出词库列表接口参数校验 """
        ret_status = self.VALID
        required = ["lexicon_id"]
        message = ""
        for key in required:
            if key not in params_json:
                message += "parameter {} missed; ".format(key)
        for key, value in params_json.items():
            if key not in required:
                message += "parameter {} is not requeired; ".format(key)
            if key == "lexicon_id":
                if not value.isdigit():
                    message += "parameter {} must be int; ".format(key)
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
                        if not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, key):
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
        required = ["id", "name", "description"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key == "id":
                if not isinstance(value, int):
                    message += _l("Parameter %s must be a int type. ") % key
            elif key in ["name", "description"]:
                if not isinstance(value, str):
                    message += _l("Parameter %s must be a string type. ") % key
                else:
                    if key == "name":
                        if len(value.strip()) == 0:
                            message += _l("Parameter %s cannot be empty. ") % key
                        elif len(value) > 50 or not re.search(
                                RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                value):
                            message += key + _l(" only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits.")
                    else:
                        if len(value) > 255 or not (re.search(
                                RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                value) or len(value) == 0):
                            message += key + _l(
                            " only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-255 digits.")
            elif key == "extract_info":
                if not isinstance(value, dict):
                    message += key + _l(" must be dict.")
                else:
                    extract_lexicon = value.get("lexicon", [])
                    extract_graph = value.get("graph", [])
                    lexicon_required = ["id", "columns", "separator"]
                    graph_required = ["id", "entities"]
                    entity_required = ["name", "prop", "separator"]
                    if not isinstance(extract_lexicon, list):
                        message += _l("lexicon in the extract_info must be list.")
                    else:
                        for lexicon in extract_lexicon:
                            message += self.params_check(lexicon, lexicon_required)
                            for l_key, l_value in lexicon.items():
                                if l_key == "id":
                                    if not isinstance(l_value, int):
                                        message += _l("lexicon id in the extract_info must be int.")
                                    elif l_value <= 0:
                                        message += _l("lexicon id in the extract_info must more than zero.")
                                elif l_key == "columns":
                                    if not isinstance(l_value, list):
                                        message += _l("lexicon columns in the extract_info must be list.")
                                    elif len(l_value) == 0:
                                        message += _l("lexicon columns in the extract_info cannot be empty.")
                                    else:
                                        for column in l_value:
                                            if not isinstance(column, str):
                                                message += _l("lexicon columns item in the extract_info must be str.")
                                                break
                                            if len(column) == 0:
                                                message += _l("lexicon columns item in the extract_info cannot be empty.")
                                                break
                                elif l_key == "separator":
                                    if not isinstance(l_value, list):
                                        message += _l("lexicon separator in the extract_info must be list.")
                                    elif len(l_value) == 0:
                                        message += _l("lexicon separator in the extract_info cannot be empty.")
                                    else:
                                        for sep in l_value:
                                            if not isinstance(sep, str):
                                                message += _l("lexicon separator item in the extract_info must be str.")
                                                break
                                            elif len(sep) > 1 and sep not in ["\\n", "\\t"]:
                                                message += _l("lexicon separator item in the extract_info only support single characters or \\n,\\t.")
                                                break
                                            elif sep != "" and not re.search(RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                                                             sep):
                                                message += _l("lexicon separator item in the extract_info only support English and Chinese, numbers and special symbols on the keyboard.")
                                                break
                            if len(lexicon.get("columns", [])) != len(lexicon.get("separator", [])):
                                message += _l("the length of columns and separator don't match.")
                    if not isinstance(extract_graph, list):
                        message += _l("graph in the extract_info must be list.")
                    else:
                        for graph in extract_graph:
                            message += self.params_check(graph, graph_required)
                            for g_key, g_value in graph.items():
                                if g_key == "id":
                                    if not isinstance(g_value, int):
                                        message += _l("graph id in the extract_info must be int.")
                                    elif g_value <= 0:
                                        message += _l("graph id in the extract_info must more than zero.")
                                elif g_key == "entities":
                                    for entity in g_value:
                                        message += self.params_check(entity, entity_required)
                                        for entity_key, entity_value in entity.items():
                                            if entity_key == "name":
                                                if not isinstance(entity_value, str):
                                                    message += _l("entity name must be str.")
                                                elif entity_value == "":
                                                    message += _l("entity name cannot be empty.")
                                            elif entity_key == "prop":
                                                if not isinstance(entity_value, list):
                                                    message += _l("entity prop must be list.")
                                                elif len(entity_value) == 0:
                                                    message += _l("entity prop cannot be empty.")
                                                else:
                                                    for prop in entity_value:
                                                        if not isinstance(prop, str):
                                                            message += _l("entity prop item must be str.")
                                                            break
                                                        elif prop == "":
                                                            message += _l("entity prop item cannot be empty.")
                                                            break
                                            elif entity_key == "separator":
                                                if not isinstance(entity_value, list):
                                                    message += _l("entity separator must be list.")
                                                elif len(entity_value) == 0:
                                                    message += _l("entity separator cannot be empty.")
                                                else:
                                                    for separator in entity_value:
                                                        if not isinstance(separator, str):
                                                            message += _l("entity separator item must be str.")
                                                            break
                                                        elif len(separator) > 1 and separator not in ["\\n", "\\t"]:
                                                            message += _l("entity separator item only support single characters or \\n,\\t.")
                                                            break
                                                        elif separator != "" and not re.search(
                                                                RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                                                separator):
                                                            message += _l("entity separator item only support English and Chinese, numbers and special symbols on the keyboard.")
                                                            break
                                            elif entity_key == "std_prop":
                                                if not isinstance(entity_value, str):
                                                    message += _l("entity std_prop must be str.")
                                        if len(entity.get("prop", [])) != len(entity.get("separator", [])):
                                            message += _l("the length of prop and separator don't match.")
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
        message = self.params_check(param, required)
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

    def check_create_synonym(self, params_json):
        """天辰词库工具参数校验"""
        ret_status = self.VALID
        required = ["graph_id", "mode"]
        message = self.params_check(params_json, required)
        for key, value in params_json.items():
            if key == "graph_id":
                if value:
                    if not value.isdigit():
                        message += "parameter {} must be int and > 0;".format(str(key))
                    else:
                        if int(value) <= 0:
                            message += "parameter {} must > 0; ".format(str(key))
                else:
                    message += "parameter {} cannot be empty; ".format(str(key))
            elif key == "mode":
                if value:
                    if value not in ["std", "custom", "entity_link"]:
                        message += "parameter {} must be in ['std', 'custom', 'entity_link']; ".format(key)
                else:
                    message += "parameter {} cannot be empty; ".format(str(key))
        if message:
            ret_status = self.INVALID
        return ret_status, message


lexicon_check_parameters = LexiconCheckParameters()

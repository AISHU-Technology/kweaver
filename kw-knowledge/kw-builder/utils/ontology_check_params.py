# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import copy
import re
import regex
from .CommonUtil import commonutil, RegularEnum
from config import config as Config
import os
from flask_babel import gettext as _l
from utils.log_info import Logger

class Otl_check_params(object):
    VALID = 0
    INVALID = -1
    # 某些参数只有固定值

    rule_dict = {}
    rule_dict["dataType"] = ["structured", "unstructured"]
    rule_dict["extract_type"] = ["standardExtraction", "modelExtraction"]
    rule_dict["data_source"] = ["mysql", "hive", "sqlserver", "kingbasees", "postgresql",
                                "clickhouse"]
    rule_dict["model"] = ["AImodel", "Generalmodel", "Anysharedocumentmodel", "Contractmodel",
                          "OperationMaintenanceModel"]
    rule_dict["postfix"] = ["csv", "json", "all"]
    rule_dict["step"] = ["Otl", "Ext"]
    rule_dict["flag"] = ["nextstep", "save"]
    # 定义接口的参数
    otl_paramdic = {}
    params = {}
    params_v1 = {}
    param_dic = {}
    param_dic_v1 = {}
    ####数据表显示 as/mysql 不同
    otl_paramdic["get_table"] = ("ds_id", "data_source", "postfix",)
    #####按需返回
    otl_paramdic["show_by_postfix"] = ("docid", "postfix", "ds_id",)
    #####本体预览
    otl_paramdic["preview_ontology"] = ("ontologyname",)
    #####数据预览
    otl_paramdic["preview_data"] = ("ds_id", "name", "data_source", "delimiter", "quotechar", "escapechar",
                                    "request_id", "start_time", "end_time")
    #####算法预测 as/mysql 不同
    otl_paramdic["predict_ontology"] = ("ds_id", "data_source", "file", "extract_type", "postfix", "delimiter", "quotechar", "escapechar")
    ####本体保存
    otl_paramdic["ontology_save"] = ("ontology_name", "ontology_des")
    otl_paramdic["update_otl_name"] = ("ontology_name", "ontology_des", 'domain')
    otl_paramdic["update_otl_info"] = ("entity", "edge", "used_task", "flag")
    ####获取模型
    otl_paramdic["modelspo"] = ("model",)
    ####获取模型本体
    otl_paramdic["getmodelotl"] = ("model", "file_list",)
    ######戰平文件夾
    otl_paramdic["flatfile"] = ("ds_id", "postfix", "file",)
    param_dic["extract_type"] = ["standardExtraction", "modelExtraction", "", ]
    param_dic["file_type"] = ["csv", "json", "", "all", ]
    param_dic["dataType"] = ["structured", "unstructured", "", ]
    param_dic["source_type"] = ["automatic", "manual", ]
    param_dic["model"] = ["AImodel", "Generalmodel", "Anysharedocumentmodel", "Contractmodel",
                          "OperationMaintenanceModel", ""]
    param_dic["data_source"] = ["mysql", "hive", "", "sqlserver", "kingbasees", "postgresql"]
    params["entity"] = ["name", "alias", "properties", "colour", "source_type", "ds_name", "source_table", "file_type",
                        "dataType", "extract_type", "model", "ds_id", "data_source", "ds_path", "properties_index",
                        "task_id", "entity_id", "x", "y", "icon", "default_tag", "vector_generation"]
    params["edge"] = ["name", "alias", "colour", "ds_name", "dataType", "extract_type", "model", "file_type",
                      "properties", "source_table", "source_type", "relations", "properties_index", "task_id", "ds_id",
                      "edge_id"]
    params_v1["entity"] = ['entity_id', 'name', 'description', 'alias', 'synonym', 'default_tag', 'properties_index',
                           'primary_key', 'properties', 'x', 'y', 'icon', 'shape', 'fill_color', 'stroke_color',
                           'text_color', 'text_position', 'icon_color', 'text_width', 'model', 'size', 'text_type', 'index_default_switch',
                           'index_main_switch', 'task_id', 'vector_generation']
    params_v1["edge"] = ['edge_id', 'name', 'description', 'alias', 'synonym', 'relations', 'colour', 'model', 'shape',
                         'properties', 'default_tag', 'width', 'properties_index', 'index_default_switch', 'index_main_switch']
    params_v1['properties'] = ['name', 'description', 'alias', 'data_type', 'synonym']
    param_dic_v1["file_type"] = ["csv", "json", "", "all", ]
    param_dic_v1["source_type"] = ["automatic", "manual", ]
    param_dic_v1["model"] = ["AImodel", "Generalmodel", "Anysharedocumentmodel", "Contractmodel",
                             "OperationMaintenanceModel", ""]
    propertytype = ["boolean", "float", "double", "string", "decimal", "datetime", "date", "integer", ]

    # color_pattern = u'^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$'
    color_pattern = u'.*'  # 颜色不校验

    def params_check(self, params, all_params, required):
        """ 校验是否有缺少的参数或者额外的参数 """
        message = ''
        if 'timestamp' in params:
            params.remove('timestamp')
        # 缺少的参数
        lacked = list(set(required) - set(params))
        if len(lacked):
            message += _l("parameters:  %s  are Missing!,") % ", ".join(lacked)
        # 额外的参数
        extra = list(set(params) - set(all_params))
        if len(extra):
            message += _l("parameters:  %s  are not required!,") % ", ".join(extra)
        if message:
            return self.INVALID, message
        return self.VALID, message

    ####边和点的校验
    def entity_edge_check(self, flag, params_json):
        ret_status = self.VALID
        inexistence = []
        message = flag + " "
        illegual = []
        empty = []
        logic_mirror = []

        newparams = self.params[flag]
        for param in newparams:
            if param not in params_json:
                if param not in ["x", "y", "icon"]:
                    inexistence.append(param)
                    ret_status = self.INVALID
            else:
                value = params_json[param]
                if param != "icon" and value is None:  ####如果傳入的參數是none
                    message += param + " is None type ;"
                    illegual.append(param)
                    ret_status = self.INVALID
                else:
                    if param == "name":
                        if not type(value) == str:
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if len(value) > 50 or not re.search(RegularEnum.ENGLISH_NUMBER_AND_UNDERLINE.value, value):
                                message += param + " must <= 50 ; and it is must be consisted of letter ,number and underline ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                            if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                                empty.append(param)
                                ret_status = self.INVALID
                    elif param == "alias":
                        if not type(value) == str:
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if len(value) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, value):
                                message += param + " must <= 50 ; and it must be consisted of letter ,number and underline ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                                ###  需求146695 别名不可为空
                            if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                                empty.append(param)
                                ret_status = self.INVALID
                    elif param == "properties_index":
                        if not isinstance(value, list):
                            message += param + " must be  list ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        if flag == "entity" and len(value) == 0:
                            message += param + "must have one properties_index"
                            illegual.append(param)
                            ret_status = self.INVALID

                    elif param == "colour":
                        if not isinstance(value, str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if not re.search(self.color_pattern, value):
                                message += param + " is not illegal ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                            if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                                empty.append(param)
                                ret_status = self.INVALID
                    elif param in self.param_dic:
                        if value not in self.param_dic[param]:
                            message += param + " must be in " + str(self.param_dic[param]) + ";"
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == "relations":
                        if not isinstance(value, list):
                            message += param + " must be  list ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if len(value) == 3:
                                for one in value:
                                    if len(one) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value,
                                                                      one):
                                        message += param + " must <= 50 ; and it is must be consisted of letter ,number and underline ; "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                            else:
                                message += param + " is not illegual ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == "properties":
                        if not isinstance(value, list):
                            message += param + " must be  list ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            propertyname = []
                            alias = []
                            if len(value) >= 1:
                                for one in value:
                                    if len(one) != 3:
                                        message += param+" : the property must have a length of 3 ;"
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                        break
                                    if one[0] not in propertyname:
                                        propertyname.append(one[0])
                                    else:
                                        message += "property_name "+one[0]+" is duplicated ; "
                                        illegual.append(one[0])
                                        ret_status = self.INVALID

                                    if one[2] not in alias:
                                        alias.append(one[2])
                                    else:
                                        message += "property_alias "+one[2]+" is duplicated ; "
                                        illegual.append(one[2])
                                        ret_status = self.INVALID

                                    if len(one[0]) > 50 or not re.search(RegularEnum.ENGLISH_NUMBER_AND_UNDERLINE.value,
                                                                         one[0]):
                                        message += param + " name cannot exceed 50 characters and characters must be numbers, _ or english. "
                                        illegual.append(param)
                                        ret_status = self.INVALID

                                    if len(one[2]) > 50 or not re.search(
                                            RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, one[2]):
                                        message += param + " alias cannot exceed 50 characters and characters must be numbers, _, chinese or english. "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                    else:
                                        if one[1] not in self.propertytype:
                                            message += param + " type is illegal ; "
                                            illegual.append(param)
                                            ret_status = self.INVALID
                            elif flag == "entity":
                                message += param + " must have one property! ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == "ds_name":
                        if not isinstance(value, str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if len(value) != 0:
                                if len(value) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value,
                                                                    value):
                                    message += param + " must <= 50 ; and it is must be consisted of letter ,number and underline ; "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                    elif param == "source_table":
                        if not isinstance(value, list):
                            message += param + " must be  list ;"
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == "ds_id" or param == "task_id":
                        if not isinstance(value, str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if value != "":
                                try:
                                    value = int(value)
                                    if value < 0:
                                        message += param + " must be >0 ; "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                except Exception:
                                    message += param + " must be number; "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                    elif param == "entity_id" or param == "edge_id":
                        if not isinstance(value, int):
                            message += param + " must be  int ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if value <= 0:
                                message += param + " must  more than 0 ; "
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == "x" or param == "y":
                        if not (isinstance(value, float) or isinstance(value, int)):
                            message += param + " is not illegual ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == "icon":
                        if not (isinstance(value, str) or value is None):
                            message += param + " must be str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == "default_tag":
                        flag = False
                        for prop in params_json["properties"]:
                            if value == prop['name']:
                                flag = True
                                break
                        if not flag:
                            message += f"{params_json['name']} {param} must in properties!"
                            illegual.append(param)
                            ret_status = self.INVALID
                    else:
                        if not isinstance(value, str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID


        inexistence = set(inexistence)
        illegual = set(illegual)
        empty = set(empty)
        # logic_mirror = set(logic_mirror)
        if inexistence:
            message += "These parameters :" + ",".join(inexistence) + " are inexistence ; "
            ret_status = self.INVALID
        if empty:
            message += "These parameters :" + ",".join(empty) + "  are exist but empty or have blankspace:"
            ret_status = self.INVALID
        if illegual:
            # message += "These parameters :" + ",".join(illegual) + " are illegual ; "
            ret_status = self.INVALID
        if logic_mirror:
            message += "These parameters :" + ",".join(logic_mirror) + "   has logic mirror :"
            ret_status = self.INVALID

        return ret_status, message

    ####边和点的校验v1，params_json不包含数据源相关信息
    def entity_edge_check_v1(self, flag, params_json):
        ret_status = self.VALID
        inexistence = []
        message = ""
        if flag == 'entity':
            message = _l('entity ')
        elif flag == 'edge':
            message = _l('edge ')
        illegual = []
        empty = []
        logic_mirror = []

        newparams = self.params_v1[flag]
        for param in newparams:
            if param not in params_json:
                if not (flag == 'edge' and param in ['properties', 'properties_index', 'default_tag']):
                    inexistence.append(param)
                    ret_status = self.INVALID
            else:
                value = params_json[param]
                if param not in ["icon", 'synonym', 'description'] and value is None:  ####如果傳入的參數是none
                    message += str(params_json.get('name', '')) + " " + _l(param) + _l("is None type ;")
                    illegual.append(param)
                    ret_status = self.INVALID
                else:
                    if param == "name":
                        if not type(value) == str:
                            message += str(params_json.get('name', '')) + _l(" name") + _l(" must be str！")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if value == "":
                                empty.append(param)
                                ret_status = self.INVALID
                            elif len(value) > 255 or not re.search(RegularEnum.ENGLISH_NUMBER_AND_UNDERLINE.value,
                                                                   value):
                                message += str(params_json.get('name', '')) + _l(" name") +\
                                           _l(" Length over 255 or Characters are not _, English. ")
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == "alias":
                        if not type(value) == str:
                            message += str(params_json.get('name', '')) + _l(" alias") + _l(" must be str！")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if value == "":
                                empty.append(param)
                                ret_status = self.INVALID
                            elif len(value) > 255 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, value):
                                message += str(params_json.get('name', '')) + _l(" alias") +\
                                           _l(" only support English and Chinese, numbers and underline, and the length is 0-255 digits.")
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == 'index_default_switch':
                        if not isinstance(value, bool):
                            message += str(params_json.get('name', '')) + _l(" index_default_switch") + _l(" must be bool！")
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == 'index_main_switch':
                        if not isinstance(value, bool):
                            message += str(params_json.get('name', '')) + _l(" index_main_switch") + _l(" must be bool！")
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == "properties_index":
                        if not isinstance(value, list):
                            message += str(params_json.get('name', '')) + _l(" properties_index") +\
                                       _l(" must be list ") + "."
                            illegual.append(param)
                            ret_status = self.INVALID
                        elif flag == "entity" and len(value) == 0:
                            message += str(params_json.get('name', '')) + _l(" properties_index") +\
                                       _l(" must have one properties_index.")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            for value_i in value:
                                prop_flag = False
                                for prop in params_json.get("properties", []):
                                    if value_i == prop.get('name', ''):
                                        prop_flag = True
                                        break
                                if not prop_flag:
                                    message += str(params_json.get('name', '')) + _l(" properties_index") +\
                                               _l(" must be an existing properties name. ")
                                    illegual.append(param)
                                    ret_status = self.INVALID
                    elif param in ["colour", 'fill_color', 'stroke_color', 'text_color']:
                        if not isinstance(value, str):
                            message += str(params_json.get('name', '')) + " " + _l(param) + _l(" must be str！")
                            illegual.append(param)
                            ret_status = self.INVALID
                        elif value.strip() == "":
                            message += str(params_json.get('name', '')) + " " + _l(param) + _l(" can not be empty.") + ' '
                            ret_status = self.INVALID
                        else:
                            if not re.search(self.color_pattern, value):
                                message += str(params_json.get('name', '')) + " " + _l(param) + _l(" is not illegal ; ")
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param in self.param_dic_v1:
                        if value not in self.param_dic_v1[param]:
                            message += str(params_json.get('name', '')) + " " + _l(param) +\
                                       _l(" must in %s. ") % str(self.param_dic_v1[param])
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == "relations":
                        if not isinstance(value, list):
                            message += str(params_json.get('name', '')) + _l(" relations ") + _l(" must be list ") + "."
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if len(value) == 3:
                                for one in value:
                                    if len(one) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value,
                                                                      one):
                                        message += str(params_json.get('name', '')) + _l(" relations ") +\
                                                   _l(" Length over 50 or Characters are not _, Chinese, English！")
                                        illegual.append(param)
                                        ret_status = self.INVALID
                            else:
                                message += str(params_json.get('name', '')) + _l(" relations ") +\
                                           _l(" is not illegal ; ")
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == "properties":
                        if not isinstance(value, list):
                            message += str(params_json.get('name', '')) + _l(" properties") + _l(" must be list ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if len(value) >= 1:
                                property_names = []
                                property_alias_names = []
                                for a_property in value:
                                    if not isinstance(a_property, dict):
                                        message += str(params_json.get('name', '')) + _l(' properties item must be dict. ')
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                    else:
                                        prop_inexistence = []
                                        for prop_key in self.params_v1['properties']:
                                            if prop_key not in a_property:
                                                if prop_key not in ['description', 'synonym']:
                                                    prop_inexistence.append(prop_key)
                                            else:
                                                prop_value = a_property[prop_key]
                                                if prop_key == 'name':
                                                    if not type(prop_value) == str:
                                                        message += str(params_json.get('name', '')) +\
                                                                   _l(' properties name') + _l(" must be str！")
                                                        illegual.append(param)
                                                        ret_status = self.INVALID
                                                    elif prop_value == "":
                                                        message += str(params_json.get('name', '')) + _l(' properties name') +\
                                                                   _l(" can not be empty.") + ' '
                                                        ret_status = self.INVALID
                                                    elif len(prop_value) > 255 or not re.search(
                                                            RegularEnum.ENGLISH_NUMBER_AND_UNDERLINE.value, prop_value):
                                                        message += str(params_json.get('name', '')) + _l(' properties name') + \
                                                                   _l(" Length over 255 or Characters are not _, English. ")
                                                        illegual.append(param)
                                                        ret_status = self.INVALID
                                                    elif prop_value in property_names:
                                                        message += str(params_json.get('name', '')) + _l(' properties name') + ' ' +\
                                                                   prop_value + _l(" is dupulicated ; ")
                                                        illegual.append(param)
                                                        ret_status = self.INVALID
                                                    else:
                                                        property_names.append(prop_value)
                                                elif prop_key == 'description':
                                                    if not isinstance(prop_value, str):
                                                        message += str(params_json.get('name', '')) +\
                                                                   _l(' properties description') + _l(" must be str！")
                                                        illegual.append(param)
                                                        ret_status = self.INVALID
                                                    elif len(prop_value) > 150 or not (re.search(
                                                            RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                                            prop_value) or len(prop_value) == 0):
                                                        message += str(params_json.get('name', '')) + _l(' properties description') +\
                                                                   _l(" only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-150 digits.") + ' '
                                                        illegual.append(param)
                                                        ret_status = self.INVALID
                                                elif prop_key == 'alias':
                                                    if not type(prop_value) == str:
                                                        message += str(params_json.get('name', '')) +\
                                                                   _l(' properties alias') + _l(" must be str！")
                                                        illegual.append(param)
                                                        ret_status = self.INVALID
                                                    else:
                                                        # 别名不可为空
                                                        if prop_value == "":
                                                            message += str(params_json.get('name', '')) + _l(' properties alias') +\
                                                                       _l(" can not be empty.") + ' '
                                                            ret_status = self.INVALID
                                                        elif len(prop_value) > 255 or not re.search(
                                                                RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value,
                                                                prop_value):
                                                            message += str(params_json.get('name', '')) + _l(' properties alias') +\
                                                                       _l(" only support English and Chinese, numbers and underline, and the length is 0-255 digits.")  + ' '
                                                            illegual.append(param)
                                                            ret_status = self.INVALID
                                                        elif prop_value in property_alias_names:
                                                            message += str(params_json.get('name', '')) + _l(' properties alias') + ' ' + \
                                                                       prop_value + _l(" is dupulicated ; ")
                                                            illegual.append(param)
                                                            ret_status = self.INVALID
                                                        else:
                                                            property_alias_names.append(prop_value)
                                                elif prop_key == 'data_type':
                                                    if prop_value not in self.propertytype:
                                                        message += str(params_json.get('name', '')) + _l(' properties data_type')\
                                                                   + _l(" is not illegal ; ")
                                                        illegual.append(param)
                                                        ret_status = self.INVALID
                                                elif prop_key == 'synonym':
                                                    if not isinstance(prop_value, str):
                                                        message += str(params_json.get('name', '')) +\
                                                                   _l(' properties synonym') + _l(" must be str！")
                                                        illegual.append(param)
                                                        ret_status = self.INVALID
                                                    else:
                                                        synonym_names = []
                                                        for a_synonym in prop_value.split('|'):
                                                            if len(a_synonym) > 255 or not (re.search(
                                                                    RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value,
                                                                    a_synonym) or len(a_synonym) == 0):
                                                                message += str(params_json.get('name', '')) + _l(' properties synonym') + ' ' + a_synonym + ' ' +\
                                                                           _l(" only support English and Chinese, numbers and underline, and the length is 0-255 digits.") + ' '
                                                                illegual.append(param)
                                                                ret_status = self.INVALID
                                                            else:
                                                                if a_synonym in synonym_names:
                                                                    message += str(params_json.get('name', '')) + _l(' properties synonym') + ' ' +\
                                                                               a_synonym + _l(" is dupulicated ; ")
                                                                    ret_status = self.INVALID
                                                                else:
                                                                    synonym_names.append(a_synonym)
                                        if prop_inexistence:
                                            message += str(params_json.get('name', '')) + _l("These properties parameters :") +\
                                                       ",".join(prop_inexistence) + _l(" are inexistence ; ")
                                            illegual.append(param)
                                            ret_status = self.INVALID
                            elif flag == "entity":
                                message += str(params_json.get('name', '')) + _l(" must have one property! ")
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == "task_id":
                        if not isinstance(value, str):
                            message += param + " must be  str ; "
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if value != "":
                                try:
                                    value = int(value)
                                    if value < 0:
                                        message += param + " must be >0 ; "
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                except Exception:
                                    message += param + " must be number; "
                                    illegual.append(param)
                                    ret_status = self.INVALID
                    elif param == "entity_id" or param == "edge_id":
                        if not isinstance(value, int) or value <= 0:
                            message += str(params_json.get('name', '')) + " " + _l(param) +\
                                       _l(" must be int, and more than zero!")
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param in ["x", "y", "text_width"]:
                        if not (isinstance(value, float) or isinstance(value, int)):
                            message += str(params_json.get('name', '')) + " " + _l(param) + _l(" is not illegal ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == 'width':
                        if not value or not isinstance(value, str) or not value.endswith('x'):
                            message += str(params_json.get('name', '')) + " " + _l('width') + _l(" is not illegal ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == "icon":
                        if not (isinstance(value, str) or value is None):
                            message += str(params_json.get('name', '')) + " " + _l("icon") + _l(" must be str！")
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param in "default_tag":
                        prop_names = []
                        for prop in params_json["properties"]:
                            prop_names.append(prop.get('name', ''))
                        if not ((flag == 'edge' and value == '' and len(prop_names) == 0) or value in prop_names):
                            message += str(params_json.get('name', '')) + _l(" default_tag") + _l(" must in %s. ") % "properties"
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == 'primary_key':
                        if not isinstance(value, list):
                            message += str(params_json.get('name', '')) + _l(" primary_key") + \
                                       _l(" must be list ") + "."
                            illegual.append(param)
                            ret_status = self.INVALID
                        elif flag == "entity" and len(value) == 0:
                            message += str(params_json.get('name', '')) + _l(" primary_key") + \
                                       _l(" must have one primary_key.")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            for value_i in value:
                                prop_flag = False
                                for prop in params_json.get("properties", []):
                                    if value_i == prop.get('name', ''):
                                        prop_flag = True
                                        break
                                if not prop_flag:
                                    message += str(params_json.get('name', '')) + _l(" primary_key") +\
                                               _l(" must be an existing properties name. ")
                                    illegual.append(param)
                                    ret_status = self.INVALID
                    elif param == 'vector_generation':
                        for value_i in value:
                            prop_flag = False
                            for prop in params_json.get("properties", []):
                                if value_i == prop.get('name', ''):
                                    prop_flag = True
                                    break
                            if not prop_flag:
                                message += str(params_json.get('name', '')) + _l(" vector_generation") + \
                                           _l(" must be an existing properties name. ")
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == 'shape':
                        if not isinstance(value, str):
                            message += str(params_json.get('name', '')) + _l(' shape') + _l(" must be str！")
                            illegual.append(param)
                            ret_status = self.INVALID
                        if flag == 'entity':
                            # elif value not in ['circular', 'rectangular']:
                            if value not in ['circle']:
                                # message += param + ' must be circular or rectangular. '
                                message += str(params_json.get('name', '')) + _l(' shape') +\
                                           _l(" must in %s. ") % ['circle']
                                illegual.append(param)
                                ret_status = self.INVALID
                        else:
                            if value not in ['line']:
                                # message += param + ' must be circular or rectangular. '
                                message += str(params_json.get('name', '')) + _l(' shape') +\
                                           _l(" must in %s. ") % ['line']
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == 'description':
                        if not isinstance(value, str):
                            message += str(params_json.get('name', '')) + " " + _l('description') + _l(" must be str！")
                            illegual.append(param)
                            ret_status = self.INVALID
                        elif len(value) > 150 or not (re.search(
                                RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                value) or len(value) == 0):
                            message += str(params_json.get('name', '')) + " " + _l('description') + _l(
                                " only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-150 digits.") + ' '
                            illegual.append(param)
                            ret_status = self.INVALID
                    elif param == 'synonym':
                        if not isinstance(value, str):
                            message += str(params_json.get('name', '')) + " " + _l('synonym') + _l(" must be str！")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            synonym_names = []
                            for a_synonym in value.split('|'):
                                if len(a_synonym) > 255 or not (re.search(
                                        RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value,
                                        a_synonym) or len(a_synonym) == 0):
                                    message += str(params_json.get('name', '')) + " " + _l('synonym') + _l(
                                        " only support English and Chinese, numbers and underline, and the length is 0-255 digits.") + ' '
                                    illegual.append(param)
                                    ret_status = self.INVALID
                                else:
                                    if a_synonym in synonym_names:
                                        message += str(params_json.get('name', '')) + " " + _l('synonym') + " " + \
                                                   a_synonym + _l(" is dupulicated ; ")
                                        ret_status = self.INVALID
                                    else:
                                        synonym_names.append(a_synonym)
                    elif param == 'size':
                        if not isinstance(value, str):
                            message += str(params_json.get('name', '')) + _l(' size') + _l(" must be str！")
                            ret_status = self.INVALID
                        else:
                            size_list = ['0.25x', '0.5x', '1x', '2x', '4x']
                            if value not in size_list:
                                message += str(params_json.get('name', '')) + _l(' size') + _l(' must in %s. ') % size_list
                                ret_status = self.INVALID
                    elif param == 'text_position':
                        text_position_value = ['top', 'center', 'left', 'right', 'bottom']
                        if not isinstance(value, str):
                            message += str(params_json.get('name', '')) + _l(' text_position') + _l(" must be str！")
                            ret_status = self.INVALID
                        elif value not in text_position_value:
                            message += str(params_json.get('name', '')) + _l(' text_position') +\
                                        _l(" must in %s. ") % text_position_value
                            ret_status = self.INVALID
                    elif param == 'icon_color':
                        if not isinstance(value, str):
                            message += str(params_json.get('name', '')) + _l(' icon_color') + _l(" must be str！")
                            ret_status = self.INVALID
                    elif param == 'text_type':
                        text_type_value = ['stable', 'adaptive']
                        if not isinstance(value, str):
                            message += str(params_json.get('name', '')) + _l(' text_type') + _l(" must be str！")
                            ret_status = self.INVALID
                        elif params_json.get('shape', '') == 'circle':
                            if value != 'adaptive':
                                message += str(params_json.get('name', '')) + _l(' text_type') +\
                                           _l('must be adaptive. ')
                        elif params_json.get('shape', '') == 'rect':
                            if value not in text_type_value:
                                message += str(params_json.get('name', '')) + _l(' text_type') +\
                                           _l(" must in %s. ") % text_type_value

        inexistence = set(inexistence)
        illegual = set(illegual)
        empty = set(empty)
        # logic_mirror = set(logic_mirror)
        if inexistence:
            message += str(params_json.get('name', '')) + " " + _l("These parameters :") +\
                       ",".join(inexistence) + _l(" are inexistence ; ")
            ret_status = self.INVALID
        if empty:
            message += str(params_json.get('name', '')) + " " + _l("These parameters :") +\
                       ",".join(empty) + _l(" can not be empty.") + ' '
            ret_status = self.INVALID
        if illegual:
            # message += "These parameters :" + ",".join(illegual) + " are illegual ; "
            ret_status = self.INVALID
        if logic_mirror:
            message += "These parameters :" + ",".join(logic_mirror) + "   has logic mirror :"
            ret_status = self.INVALID

        return ret_status, message

    def entity_relation_check(self, params_json):
        ret_status = self.VALID
        message = ""
        illegal = []
        if len(params_json["entity"]) == 0:
            if len(params_json["edge"]) != 0:
                message += _l(" if entity is empty ,edge must be empty. ")
                illegal.append("edge")
                ret_status = self.INVALID
        else:
            if len(params_json["edge"]) != 0:
                names = []
                for one in params_json["entity"]:
                    names.append(one["name"])
                Logger.log_info(names)
                for ones in params_json["edge"]:
                    relation = ones["relations"]
                    if relation[0] not in names or relation[2] not in names:
                        message += _l("The entity of edge %s's relationship is not in the entity list. ") % ones['name']
                        ret_status = self.INVALID
                        return ret_status, message
                    if relation[1] != ones["name"]:
                        message += _l("Edge class %s's name does not match the relation. ") % ones['name']
                        ret_status = self.INVALID
                        return ret_status, message
        if illegal:
            ret_status = self.INVALID
        return ret_status, message

    def valid_params_check(self, flag, params_json):
        Logger.log_info(params_json)
        message = ""
        edge = 1
        entity = 1
        ret_status = self.VALID
        inexistence = []  ###没有的参数 应该存在却不存在的参数
        illegual = []  #####不合法的参数 类型 长度
        empty = []  #####传入的参数值为空
        duplicate = []  ####entity edge 的name是否重复
        params = list(self.otl_paramdic[flag])
        if flag == "get_table" or flag == "predict_ontology":
            if "data_source" in params_json:
                datasource = params_json["data_source"]
                if "postfix" in params:
                    params.remove("postfix")
                if "page" in params:
                    params.remove("page")
                if "size" in params:
                    params.remove("size")
            else:
                inexistence.append("data_source")
                ret_status = self.INVALID
        if flag == "predict_ontology":
            if "extract_type" in params_json:
                # if params_json["extract_type"] != "labelExtraction":
                if "step" in params:
                    params.remove("step")
            else:
                inexistence.append("extract_type")
                ret_status = self.INVALID

            if "graph_id" in params_json:
                graph_id = params_json["graph_id"]
                if not isinstance(graph_id, int):
                    illegual.append("graph_id")
                    ret_status = self.INVALID
                elif graph_id <= 0:
                    illegual.append("graph_id")
                    ret_status = self.INVALID
            else:
                inexistence.append("graph_id")
                ret_status = self.INVALID

        for param in params:
            if param not in params_json:
                if not (flag == 'update_otl_name' and param in ['ontology_des', 'domain']):
                    if param not in ["delimiter", "quotechar", "escapechar", "request_id", "start_time", "end_time"]:
                        inexistence.append(param)
                        ret_status = self.INVALID
            else:
                value = params_json[param]
                if value is None:  ####如果傳入的參數是none
                    message += param + _l("is None type;")
                    illegual.append(param)
                    ret_status = self.INVALID
                else:
                    if param in self.rule_dict:
                        if value not in self.rule_dict[param]:
                            message += param + _l(" must be in ") + str(self.rule_dict[param]) + ";"
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if flag == "predict_ontology" and param == "extract_type":
                                if value not in ["standardExtraction"]:
                                    message += _l("extract_type can not be ") + value
                                    illegual.append(param)
                                    ret_status = self.INVALID

                    elif param == "file":
                        if flag == 'predict_ontology':
                            if not isinstance(value, str):
                                message += param + _l(" must be  str ; ")
                                illegual.append(param)
                                ret_status = self.INVALID
                            elif not value:
                                message += param + _l(" cannot be empty. ")
                                illegual.append(param)
                                ret_status = self.INVALID
                        else:
                            params_file = ["docid", "name", "type"]
                            for file_p in params_file:
                                if file_p not in value:
                                    inexistence.append(param)
                                    ret_status = self.INVALID
                                else:
                                    file_v = value[file_p]
                                    if file_p == "docid":
                                        if not isinstance(file_v, str):
                                            message += file_p + _l(" must be  str ; ")
                                            illegual.append(file_p)
                                            ret_status = self.INVALID
                                        else:
                                            if "gns://" not in file_v:
                                                message += file_p + _l(" must be  docid ; ")
                                                illegual.append(file_p)
                                                ret_status = self.INVALID
                                    elif file_p == "name":
                                        if not isinstance(file_v, str):
                                            message += file_p + _l(" must be  str ; ")
                                            illegual.append(file_p)
                                            ret_status = self.INVALID

                                    elif file_p == "type":
                                        if file_v != "dir":
                                            message += file_p + _l(" must be  dir ; ")
                                            illegual.append(file_p)
                                            ret_status = self.INVALID

                    elif param == "used_task":
                        if not isinstance(value, list):
                            message += param + _l(" must be  list ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            error = []
                            if len(value) != 0:
                                for i in value:
                                    if not isinstance(i, int):
                                        error.append(i)
                            if error:
                                err = ",".join(error)
                                message += param + _l("has some error : ") + err + _l(" isn`t a valid parameter")
                                illegual.append(param)
                                ret_status = self.INVALID

                    elif param == "ontology_id":

                        if not isinstance(value, str):
                            message += param + _l(" must be string ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if flag == "ontology_save":
                                if value != "":
                                    if "new" in value:
                                        otl_id = value.split("new")[1]
                                        if not otl_id.isdigit():
                                            message += param + _l(" isn`t a valid parameter ")
                                            illegual.append(param)
                                            ret_status = self.INVALID
                                        else:
                                            otl_id = int(otl_id)
                                            if otl_id < 1:
                                                message += param + _l(" must be >=1 ; ")
                                                illegual.append(param)
                                                ret_status = self.INVALID
                                    else:
                                        message += param + _l(" isn`t a valid parameter ")
                                        illegual.append(param)
                                        ret_status = self.INVALID

                            elif flag == "update_otl_name" or flag == "update_otl_info":
                                try:
                                    value = int(value)
                                    if value < 1:
                                        message += param + _l(" must be >=1 ; ")
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                except Exception:
                                    message += param + _l(" must be  number ; ")
                                    illegual.append(param)
                                    ret_status = self.INVALID

                    elif param == "ds_port" or param == "ds_id":

                        if not isinstance(value, str):
                            message += param + _l(" must be  str ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            try:
                                value = int(value)
                                # if param == "page" or param == "size":
                                #
                                #     if  value < 1:
                                #         message += param + " must be >1 ; "
                                #         illegual.append(param)
                                #         ret_status = self.INVALID
                                if param == "ds_id":
                                    if value < 0:
                                        message += param + _l(" must be >0 ; ")
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                if param == "ds_port":
                                    if value > 65535 or value < 1:
                                        message += param + _l(" must be in 1~65535 ; ")
                                        illegual.append(param)
                                        ret_status = self.INVALID
                            except Exception:
                                message += param + _l(" must be  number ; ")
                                illegual.append(param)
                                ret_status = self.INVALID
                    elif param == "file_list":
                        if not isinstance(value, list):
                            message += param + _l(" must be  list ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if "data_source" not in illegual and "data_source" not in inexistence:
                                if flag == "getmodelotl":
                                    if len(value) != 0:
                                        for one in value:
                                            if not isinstance(one, list):
                                                message += _l("as file_list  is not illegal ")
                                                illegual.append(param)
                                                ret_status = self.INVALID

                    elif param == "entity" or param == "edge":

                        if not isinstance(value, list):
                            message += param + _l(" must be  list ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if param == "edge" and len(value) == 0:
                                edge = 0
                            elif param == "entity" and len(value) == 0:
                                if "flag" not in illegual and "flag" not in inexistence:
                                    if params_json["flag"] == "nextstep":
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                        message += _l("Add at least one entity class")
                            else:
                                if len(value):
                                    ret_statuslist = []
                                    for one in value:
                                        if flag == "update_otl_info":
                                            ret_status, message1 = self.entity_edge_check_v1(param, one)
                                        else:
                                            ret_status, message1 = self.entity_edge_check(param, one)
                                        ret_statuslist.append(ret_status)
                                        if ret_status == self.INVALID:
                                            illegual.append(param)
                                            ret_status = self.INVALID
                                            message += message1
                                    if self.INVALID in ret_statuslist:
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                else:
                                    if params_json["data_source"] != "rabbitmq":
                                        empty.append(param)
                                        ret_status = self.INVALID

                    elif param == "ds_address":
                        if not isinstance(value, str):
                            message += param + _l(" must be  str ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if flag != "show_by_postfix":
                                if "data_source" not in illegual and "data_source" not in inexistence:
                                    if not commonutil.is_valid_domain(value):
                                        illegual.append(param)
                                        message += param + _l(" is not illegal ; ")
                                        ret_status = self.INVALID
                            else:
                                if "https://" in value or "http://" in value:
                                    value = value.split("://")[-1]
                                    if not commonutil.is_valid_domain(value):
                                        message += param + _l(" is not illegal ; ")
                                        illegual.append(param)
                                        ret_status = self.INVALID
                                else:
                                    message += param + _l(" is not illegal ; ")
                                    illegual.append(param)
                                    ret_status = self.INVALID

                    elif param == "ontology_des":
                        if not isinstance(value, str):
                            message += param + _l(" must be str ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if value != "":
                                if len(value) > 150 or not re.search(
                                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                        value):
                                    message += param + _l(" must <= 150 ,and conclude letter number and special characters")
                                    illegual.append(param)
                                    ret_status = self.INVALID

                    elif param == "ontology_name":
                        if not isinstance(value, str):
                            message += param + _l(" must be str ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            # 允许本体名称为空，所有本体默认没有名字
                            # if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                            #     empty.append(param)
                            #     ret_status = self.INVALID
                            if value != '':
                                if len(value) > 50 or not re.search(
                                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                        value):
                                    message += param + _l(" only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits.")
                                    illegual.append(param)
                                    ret_status = self.INVALID

                    elif param == "name":
                        if not isinstance(value, str):
                            message += param + _l(" must be str ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            if value == "":  # 所有参数值 校验是否包含空格或为空
                                if params_json["data_source"] != "rabbitmq":
                                    empty.append(param)
                                    ret_status = self.INVALID

                    elif param == 'domain':
                        if not isinstance(value, list):
                            message += 'domain' + _l(' must be  list ; ')
                            illegual.append(param)
                            ret_status = self.INVALID
                        elif len(value) > 10:
                            message += _l('max number of domain is 10. ')
                            illegual.append(param)
                            ret_status = self.INVALID
                        else:
                            domain_names = []
                            domain_message = ""
                            for domain in value:
                                if domain in domain_names:
                                    domain_message += _l('the value in domain can not duplicate. ')
                                elif not isinstance(domain, str):
                                    domain_message += _l('the value in domain must be string. ')
                                elif len(domain) > 50 or not re.search(
                                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                        domain):
                                    domain_message += _l(
                                        'the value in domain only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits.') + ' '
                                if domain_message:
                                    message += domain_message
                                    illegual.append(param)
                                    ret_status = self.INVALID
                                    break
                                domain_names.append(domain)
                    elif param == 'canvas':
                        if not isinstance(value, dict):
                            message += 'canvas' + _l(" must be dict.")
                            illegual.append(param)
                            ret_status = self.INVALID
                        background_color_set = ['white', 'light_grey', 'grey', 'light_blue', 'blue']
                        if 'background_color' not in value:
                            message += _l('canvas must have background_color.')
                            illegual.append(param)
                            ret_status = self.INVALID
                        elif value['background_color'] not in background_color_set:
                            message += _l("canvas background_color must be in {}.").format(background_color_set)
                            illegual.append(param)
                            ret_status = self.INVALID
                        background_image_set = ['empty', 'point', 'net']
                        if 'background_image' not in value:
                            message += _l('canvas must have background_image.')
                            illegual.append(param)
                            ret_status = self.INVALID
                        elif value['background_image'] not in background_image_set:
                            message += _l('canvas background_image must be in {}.').format(background_image_set)
                            illegual.append(param)
                            ret_status = self.INVALID

                    elif param in ["delimiter", "quotechar", "escapechar"]:
                        if not isinstance(value, str):
                            message += _l(param) + _l(" must be str ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        elif len(value) == 0:
                            message += _l(param) + _l(" cannot be empty.")
                            illegual.append(param)
                            ret_status = self.INVALID
                        elif len(value) != 1:
                            message += _l("only a single character is allowed for %s.") % _l(param)
                            illegual.append(param)
                            ret_status = self.INVALID
                        elif not re.search(u'^[=~!@#$&%^&*()_+`{}\-[\];:,.\\\?<>\'"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                            message += _l(param) + _l(" only support English and Chinese, numbers and special symbols on the keyboard.")
                            illegual.append(param)
                            ret_status = self.INVALID

                    elif param == 'request_id':
                        if not isinstance(value, str):
                            message += param + _l(" must be str ; ")
                            illegual.append(param)
                            ret_status = self.INVALID

                    elif param in ["start_time, end_time"]:
                        if not value.isdigit() or value == "0":
                            message += param + _l(" must be int, and more than zero!")
                    else:
                        if not isinstance(value, str):
                            message += param + _l(" must be str ; ")
                            illegual.append(param)
                            ret_status = self.INVALID
                        if not value == ''.join(value.split()) or value == "":  # 所有参数值 校验是否包含空格或为空
                            empty.append(param)
                            ret_status = self.INVALID
        # allname: 实体类名列表
        allname = []
        # allname_alias: 实体类显示名列表
        allname_alias = []
        # allrelation: 关系类关系列表
        allrelation = []
        allrelation_alias = {}
        edge_names_model, edge_names_not_model = [], []
        # 当起点、终点相同时，关系类显示名不能重复
        alias_relation = []
        if "entity" in params and "edge" in params:
            if "entity" not in inexistence and "edge" not in inexistence:
                if "entity" not in illegual and "edge" not in illegual:
                    if edge != 0:
                        edgevalue = params_json["edge"]
                        for one in edgevalue:
                            allrelation.append(str(one["relations"]))
                            alias_relation.append(str([one["relations"][0], one['alias'], one["relations"][2]]))
                            if one['name'] in allrelation_alias:
                                if one['alias'] != allrelation_alias[one['name']]:
                                    message += _l('When the relationship name is the same, the alias must be the same')
                                    ret_status = self.INVALID
                            else:
                                allrelation_alias[one["name"]] = one['alias']
                            if one['model'] != '':
                                # 模型关系类
                                edge_names_model.append(one['name'])
                            else:
                                # 手绘关系类
                                edge_names_not_model.append(one['name'])
                    if entity != 0:
                        entityvalue = params_json["entity"]
                        for one in entityvalue:
                            allname.append(one["name"])
                            if one["alias"] != "":
                                allname_alias.append(one["alias"])
            if len(allname) != len(set(allname)):
                Logger.log_info("allnAME")
                message += _l("class name can't repeated !")
                ret_status = self.INVALID
            if len(allname_alias) != len(set(allname_alias)):
                Logger.log_info("allnAME")
                message += _l("alias name can't repeated !")
                ret_status = self.INVALID
            # 手绘关系类名与模型关系类名不能重复
            if set(edge_names_model).intersection(set(edge_names_not_model)):
                message += _l('The edge class name is already in use by the model, please modify it!')
                ret_status = self.INVALID
            if len(allrelation) != len(set(allrelation)):
                message += _l("relationships between the same entities can't have the same name !")
                ret_status = self.INVALID
            # 当起点、终点相同时，关系类显示名不能重复
            if len(alias_relation) != len(set(alias_relation)):
                message += _l("relationships between the same entities can't have the same name !")
                ret_status = self.INVALID
            ret_status_entity_relation_check, message_entity_relation_check = self.entity_relation_check(params_json)
            if ret_status_entity_relation_check == self.INVALID:
                ret_status = self.INVALID
                message += message_entity_relation_check

        illegual = set(illegual)
        inexistence = set(inexistence)
        empty = set(empty)
        duplicate = set(duplicate)
        # params_check["illegual"]=set(illegual)
        # params_check["inexistence"] = set(inexistence)
        # params_check["empty"] = set(empty)
        if illegual:
            ret_status = self.INVALID
        if inexistence:
            message += _l("These parameters :") + ",".join(inexistence) + _l(" are inexistence ; ")
            ret_status = self.INVALID
        if empty:
            message += _l("These parameters :") + ",".join(empty) + _l("  are exist but empty or have blankspace :")
            ret_status = self.INVALID
        if duplicate:
            message += _l("These parameters :") + ",".join(duplicate) + _l("  are exist but name is reduplicative :")
            ret_status = self.INVALID
        return ret_status, message

    def getAllParOnto(self, params_json):
        all_params = ['knw_id', 'page', 'size', 'rule', 'order', 'search', 'filter']
        required = ['knw_id', 'page', 'size', 'rule', 'order']
        code, message = self.params_check(list(params_json.keys()), all_params, required)
        if code == self.INVALID:
            return code, message
        for key, value in params_json.items():
            if key == 'knw_id' or key == 'size':
                if not value.isdigit() or value == '0':
                    message += key + _l(' must be int, and more than zero!')
            if key == 'page':
                if value != '-1' and (not value.isdigit() or value == '0'):
                    message += 'page' + _l(' must be int, and more than zero or equal to -1. ')
            if key == 'rule':
                rule_list = ['name', 'create', 'update']
                if value not in rule_list:
                    message += 'rule' + _l(' must in %s. ') % rule_list
            if key == 'order':
                order_list = ['asc', 'desc']
                if value not in order_list:
                    message += 'order' + _l(' must in %s. ') % order_list
            if key == 'search':
                if not isinstance(value, str):
                    message += 'search' + _l(' must be str！')
            if key == 'filter':
                if value != '' and value != 'import':
                    message += 'filter' + _l(' must in %s. ') % ['', 'import']
        if message:
            return self.INVALID, message
        return self.VALID, message

    def otlDelPar(self, params_json):
        ret_status = self.VALID
        message = ""
        # 定义参数
        # required = ["graph_name", "graph_step", "graph_process", "graph_status"]
        required = ["otlids"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required:
                unnecessaryParameters.append(k)
        dsids = params_json.get("otlids", None)
        # 请求的参数缺少必须的参数
        MissingParameters = []
        if dsids == None:
            for k in required:
                if not k in values:
                    MissingParameters.append(k)
        if len(unnecessaryParameters) > 0:
            message += "parameters:  %s  are not required!" % ",".join(unnecessaryParameters)
            ret_status = self.INVALID
        if len(MissingParameters) > 0:
            message += "parameters:  %s  are Missing!" % ",".join(MissingParameters)
            ret_status = self.INVALID
        # 校验顺序一 先校验参数是否缺少或者多的
        if len(unnecessaryParameters) > 0 or len(MissingParameters) > 0:
            return ret_status, message
        Logger.log_info(type(dsids))
        if type(dsids).__name__ != "list":
            message += "The parameter otlids type must be list!"
            ret_status = self.INVALID
            return ret_status, message
        if len(dsids) == 0:
            message += "The parameter otlids cannot be empty!"
            ret_status = self.INVALID
            return ret_status, message
        flag_digit = True
        for id1 in dsids:
            if type(id1).__name__ != "int":
                # if not isinstance(id1, int):
                flag_digit = False
                break

        if not flag_digit:
            message = "The parameter list element  must be int"
            ret_status = self.INVALID
            return ret_status, message

        return ret_status, message

    def parmchecklist(self, param, value):
        ret_status = 0
        message = ""
        flag_digit = True
        try:
            ids = value
            if type(ids).__name__ == "list":
                if len(ids) > 0:
                    for id1 in ids:
                        if not isinstance(id1, str):
                            flag_digit = False
                        else:
                            id1 = str(id1)
                            # if not isinstance(id1,int):
                            if len(id1) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, id1):
                                message += "  The parameter list element Length over 50 or Characters are not _, Chinese, English！"
                                ret_status = self.INVALID

                            # if not id1 == ''.join(id1.split()) or id1 == "":
                            #         flag_digit = False

                    if flag_digit:
                        return ret_status, ids, message
                    else:
                        ret_status = -1
                        message = "The parameter list element  must be str"
                        return ret_status, param, message

                else:
                    ret_status = -1
                    message = "The parameter list cannot be empty"
                    return ret_status, param, message
            else:
                ret_status = -1
                message = "The parameter type must be list！"
                return ret_status, param, message
        except Exception as e:
            err = repr(e)
            ret_status = -1
            message = err
            return ret_status, param, message

    def otlgetbynamePar(self, params_json):
        ret_status = 0
        message = ""
        otl_getbyname_params = ["page", "size", "otlname", "order", "otl_status"]
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        # if not isinstance(params_json, dict):
        #     message = "parameters must json"
        #     ret_status = self.INVALID
        #     return ret_status, message
        # 缺少参数
        for pa in otl_getbyname_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        for k in params_json.keys():
            if k in otl_getbyname_params:
                value = params_json[k]
                if k == "page" or k == "size":
                    if not value.isdigit() or value == "0":
                        message += " parameters: " + k + " must be int, and more than zero"
                        ret_status = self.INVALID
                elif k == "order":
                    if value not in ["ascend", "descend"]:
                        message += " parameters: " + k + " must be ascend or descend!"
                        ret_status = self.INVALID
                elif k == "otlname":
                    if not isinstance(value, str):
                        message += " parameters: " + k + " must be str！"
                        ret_status = self.INVALID
                elif k == "otl_status":
                    if value not in ["all", "running", "pending", "available"]:
                        message += " parameters: " + k + " must in [ all , running , pending , available ]"
                        ret_status = self.INVALID
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID
        # 参数多余，错误的参数
        if len(message_dict["request_error"]) > 0:
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += " parameters: %s can not be empty and cannot contain spaces!" % ",".join(
                message_dict["no_request"])
        # 参数值错误
        if len(message_dict["request_illegal"]) > 0:
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
        # 不符合规则
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
        return ret_status, message

    def otlUpdatePar(self, params_json):
        ret_status = 0
        message = ""
        otl_getbyname_params = ["ontology_name", "entity", "edge", "ontology_des"]
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        # 缺少参数
        for pa in otl_getbyname_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        for k in params_json.keys():
            if k in otl_getbyname_params:
                params_json[k]
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID
        # 参数多余，错误的参数
        if len(message_dict["request_error"]) > 0:
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += " parameters: %s can not be empty and cannot contain spaces!" % ",".join(
                message_dict["no_request"])
        # 参数值错误
        if len(message_dict["request_illegal"]) > 0:
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
        # 不符合规则
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
        return ret_status, message

    def saveOtlPar(self, params_json):
        all_params = ['ontology_name', 'ontology_des', 'domain', 'knw_id', 'entity', 'edge', 'temp_save', 'used_task',
                      'copy_from', 'canvas']
        required = ['ontology_name', 'knw_id', 'entity', 'used_task', 'canvas']
        entity_names = []
        edge_names = []
        edge_names_model, edge_names_not_model = [], []
        code, message = self.params_check(params_json.keys(), all_params, required)
        if code == self.INVALID:
            return code, message
        temp_save = params_json.get('temp_save', False)
        if temp_save not in [True, False]:
            message += 'temp_save' + _l(' must be True or False. ')
            return self.INVALID, message
        for key, value in params_json.items():
            if key == 'ontology_name':
                if not isinstance(value, str):
                    message += 'ontology_name' + _l(' must be str！')
                elif len(value) == 0:
                    message += 'ontology_name ' + _l(' can not be empty.') + ' '
                elif (len(value) > 50 or not re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        value)):
                    message += 'ontology_name' + _l(" only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits.")
            elif key == 'knw_id':
                if not isinstance(value, int):
                    message += _l('parameter knw_id must be int. ')
                elif value <= 0:
                    message += _l('parameter knw_id must be larger than zero. ')
            elif key == 'ontology_des':
                if not isinstance(value, str):
                    message += 'ontology_des' + _l(' must be str！')
                elif (len(value) > 150 or not (re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        value) or len(value) == 0)):
                    message += 'ontology_des' + _l(
                        " only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-150 digits.") + ' '
            elif key == 'domain':
                if not isinstance(value, list):
                    message += 'domain' + _l(' must be  list ; ')
                elif len(value) > 10:
                    message += _l('max number of domain is 10. ')
                else:
                    domain_names = []
                    domain_message = ""
                    for domain in value:
                        if domain in domain_names:
                            domain_message += _l('the value in domain can not duplicate. ')
                        elif not isinstance(domain, str):
                            domain_message += _l('the value in domain must be string. ')
                        elif len(domain) > 50 or not re.search(
                                RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                domain):
                            domain_message += _l('the value in domain only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits.') + ' '
                        if domain_message:
                            message += domain_message
                            break
                        domain_names.append(domain)
            elif key == 'entity':
                if not isinstance(value, list):
                    message += 'entity' + _l(' must be  list ; ')
                elif not temp_save:
                    entity_alias_names = []
                    if len(value) == 0:
                        message += _l("Add at least one entity class")
                    for one in value:
                        ret_status, ret_message = self.entity_edge_check_v1(key, one)
                        if ret_status == self.INVALID:
                            message += ret_message
                        entity_name = one['name']
                        alias_name = one['alias']
                        # 类名重复校验
                        if entity_name in entity_names:
                            message += _l('entity name %s is duplicate. ') % entity_name
                        else:
                            entity_names.append(entity_name)
                        if entity_name in edge_names:
                            message += _l('entity name %s is duplicate. ') % entity_name
                        # 实体类别名重复校验
                        if alias_name in entity_alias_names:
                            message += _l('entity alias name %s is duplicate. ') % alias_name
                        else:
                            entity_alias_names.append(alias_name)
            elif key == 'edge':
                if not isinstance(value, list):
                    message += 'edge' + _l(' must be  list ; ')
                elif not temp_save:
                    check_edge_flag = True
                    edge_dict = {}
                    all_relation = []
                    alias_relation = []
                    for one in value:
                        new_edge = copy.deepcopy(one)
                        new_edge.pop('relations')
                        new_edge.pop('edge_id')
                        # 模型关系类与非模型关系类重名的情况报另外的错
                        new_edge.pop('source_type', None)
                        new_edge.pop('model', None)
                        if one['name'] in edge_dict:
                            if new_edge != edge_dict[one['name']]:
                                # 同名的关系类其他配置项必须相同
                                message += _l('edge name %s is duplicate. ') % one['name']
                        else:
                            edge_dict[one['name']] = new_edge
                            ret_status, ret_message = self.entity_edge_check_v1(key, one)
                            if ret_status == self.INVALID:
                                message += ret_message
                                check_edge_flag = False
                            edge_name = one['name']
                            # 类名重复校验
                            if edge_name in entity_names:
                                message += _l('edge name %s is duplicate. ') % edge_name
                            else:
                                edge_names.append(edge_name)
                            if check_edge_flag:
                                # 手绘关系类名不能与模型关系类名同名
                                if one['model'] != '':
                                    # 模型
                                    if one['name'] in edge_names_not_model:
                                        message += _l('The edge class name is already in use by the model, please modify it!')
                                    edge_names_model.append(one['name'])
                                else:
                                    # 手绘
                                    if one['name'] in edge_names_model:
                                        message += _l(
                                            'The edge class name is already in use by the model, please modify it!')
                                    edge_names_not_model.append(one['name'])
                                # 当起点、终点相同时，关系类名不能重复
                                if one['relations'] in all_relation:
                                    message += _l("relationships between the same entities can't have the same name !")
                                else:
                                    all_relation.append(one['relations'])
                                # 当起点、终点相同时，关系类显示名不能重复
                                alias_rela = [one['relations'][0], one['alias'], one['relations'][2]]
                                if alias_rela in alias_relation:
                                    message += _l("relationships between the same entities can't have the same name !")
                                else:
                                    alias_relation.append(alias_rela)
                    if check_edge_flag:
                        # message += self.check_duplicate_edges(value)
                        ret_status, ret_message = self.entity_relation_check(params_json)
                        if ret_status == self.INVALID:
                            message += ret_message
            elif key == 'used_task':
                if not isinstance(value, list):
                    message += 'used_task' + _l(" must be  list ; ")
                else:
                    for a_used_task in value:
                        if not isinstance(a_used_task, int) or a_used_task <= 0:
                            message += 'used_task' + _l(" must be int, and more than zero!")
                            break
            elif key == 'canvas':
                if not isinstance(value, dict):
                    message += 'canvas' + _l(" must be dict.")
                background_color_set = ['white', 'light_grey', 'grey', 'light_blue', 'blue']
                if 'background_color' not in value:
                    message += _l('canvas must have background_color.')
                elif value['background_color'] not in background_color_set:
                    message += _l("canvas background_color must be in {}.").format(background_color_set)
                background_image_set = ['empty', 'point', 'net']
                if 'background_image' not in value:
                    message += _l('canvas must have background_image.')
                elif value['background_image'] not in background_image_set:
                    message += _l('canvas background_image must be in {}.').format(background_image_set)

        if message:
            return self.INVALID, message
        return self.VALID, message

    def editOtlPar(self, params_json):
        all_params = ['ontology_name', 'ontology_des', 'domain', 'entity', 'edge', 'temp_save', 'cover', 'used_task', 'canvas']
        required = ['ontology_name', 'entity', 'used_task', 'canvas']
        entity_names = []
        edge_names = []
        edge_names_model, edge_names_not_model = [], []
        code, message = self.params_check(params_json.keys(), all_params, required)
        if code == self.INVALID:
            return code, message
        temp_save = params_json.get('temp_save', False)
        if temp_save not in [True, False]:
            message += 'temp_save' + _l(' must be True or False. ')
            return self.INVALID, message
        cover = params_json.get('cover', False)
        if cover not in [True, False]:
            message += 'cover' + _l(' must be True or False. ')
            return self.INVALID, message
        for key, value in params_json.items():
            if key == 'ontology_name':
                if not isinstance(value, str):
                    message += 'ontology_name' + _l(' must be str！')
                elif len(value) == 0:
                    message += 'ontology_name ' + _l(' can not be empty.') + ' '
                elif (len(value) > 50 or not re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        value)):
                    message += 'ontology_name' + _l(" only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits.")
            elif key == 'ontology_des':
                if not isinstance(value, str):
                    message += 'ontology_des' + _l(' must be str！')
                elif (len(value) > 150 or not (re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        value) or len(value) == 0)):
                    message += 'ontology_des' + _l(
                        " only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-150 digits.") + ' '
            elif key == 'domain':
                if not isinstance(value, list):
                    message += 'domain' + _l(' must be  list ; ')
                elif len(value) > 10:
                    message += _l('max number of domain is 10. ')
                else:
                    domain_names = []
                    domain_message = ""
                    for domain in value:
                        if domain in domain_names:
                            domain_message += _l('the value in domain can not duplicate. ')
                        elif not isinstance(domain, str):
                            domain_message += _l('the value in domain must be string. ')
                        elif len(domain) > 50 or not re.search(
                                RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                domain):
                            domain_message += _l(
                                'the value in domain only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits.') + ' '
                        if domain_message:
                            message += domain_message
                            break
                        domain_names.append(domain)
            elif key == 'entity':
                if not isinstance(value, list):
                    message += 'entity' + _l(' must be  list ; ')
                elif not temp_save:
                    entity_alias_names = []
                    if len(value) == 0:
                        message += _l("Add at least one entity class")
                    for one in value:
                        ret_status, ret_message = self.entity_edge_check_v1(key, one)
                        if ret_status == self.INVALID:
                            message += ret_message
                        entity_name = one['name']
                        alias_name = one['alias']
                        # 类名重复校验
                        if entity_name in entity_names:
                            message += _l('entity name %s is duplicate. ') % entity_name
                        else:
                            entity_names.append(entity_name)
                        if entity_name in edge_names:
                            message += _l('entity name %s is duplicate. ') % entity_name
                        # 实体类别名重复校验
                        if alias_name in entity_alias_names:
                            message += _l('entity alias name %s is duplicate. ') % alias_name
                        else:
                            entity_alias_names.append(alias_name)
            elif key == 'edge':
                if not isinstance(value, list):
                    message += 'edge' + _l(' must be  list ; ')
                elif not temp_save:
                    check_edge_flag = True
                    edge_dict = {}
                    all_relation = []
                    alias_relation = []
                    for one in value:
                        new_edge = copy.deepcopy(one)
                        new_edge.pop('relations')
                        new_edge.pop('edge_id')
                        # 模型关系类与非模型关系类重名的情况报另外的错
                        new_edge.pop('source_type', None)
                        new_edge.pop('model', None)
                        if one['name'] in edge_dict:
                            if new_edge != edge_dict[one['name']]:
                                # 同名的关系类其他配置项必须相同
                                message += _l('edge name %s is duplicate. ') % one['name']
                        else:
                            edge_dict[one['name']] = new_edge
                            ret_status, ret_message = self.entity_edge_check_v1(key, one)
                            if ret_status == self.INVALID:
                                message += ret_message
                                check_edge_flag = False
                            edge_name = one['name']
                            # 类名重复校验
                            if edge_name in entity_names:
                                message += _l('edge name %s is duplicate. ') % edge_name
                            else:
                                edge_names.append(edge_name)
                            if check_edge_flag:
                                # 手绘关系类名不能与模型关系类名同名
                                if one['model'] != '':
                                    # 模型
                                    if one['name'] in edge_names_not_model:
                                        message += _l('The edge class name is already in use by the model, please modify it!')
                                    edge_names_model.append(one['name'])
                                else:
                                    # 手绘
                                    if one['name'] in edge_names_model:
                                        message += _l(
                                            'The edge class name is already in use by the model, please modify it!')
                                    edge_names_not_model.append(one['name'])
                                # 当起点、终点相同时，关系类名不能重复
                                if one['relations'] in all_relation:
                                    message += _l(
                                        "relationships between the same entities can't have the same name !")
                                else:
                                    all_relation.append(one['relations'])
                                # 当起点、终点相同时，关系类显示名不能重复
                                alias_rela = [one['relations'][0], one['alias'], one['relations'][2]]
                                if alias_rela in alias_relation:
                                    message += _l(
                                        "relationships between the same entities can't have the same name !")
                                else:
                                    alias_relation.append(alias_rela)
                    if check_edge_flag:
                        # message += self.check_duplicate_edges(value)
                        ret_status, ret_message = self.entity_relation_check(params_json)
                        if ret_status == self.INVALID:
                            message += ret_message
            elif key == 'used_task':
                if not isinstance(value, list):
                    message += 'used_task' + _l(" must be  list ; ")
                else:
                    for a_used_task in value:
                        if not isinstance(a_used_task, int) or a_used_task <= 0:
                            message += 'used_task' + _l(" must be int, and more than zero!")
                            break
            elif key == 'canvas':
                if not isinstance(value, dict):
                    message += 'canvas' + _l(" must be dict.")
                background_color_set = ['white', 'light_grey', 'grey', 'light_blue', 'blue']
                if 'background_color' not in value:
                    message += _l('canvas must have background_color.')
                elif value['background_color'] not in background_color_set:
                    message += _l("canvas background_color must be in {}.").format(background_color_set)
                background_image_set = ['empty', 'point', 'net']
                if 'background_image' not in value:
                    message += _l('canvas must have background_image.')
                elif value['background_image'] not in background_image_set:
                    message += _l('canvas background_image must be in {}.').format(background_image_set)

        if message:
            return self.INVALID, message
        return self.VALID, message

    def check_duplicate_edges(self, edges):
        edge_dict = dict()
        for edge in edges:
            edge_name = edge['name']
            new_edge = copy.deepcopy(edge)
            new_edge.pop('relations')
            new_edge.pop('edge_id')
            if edge_name in edge_dict:
                if new_edge != edge_dict[edge_name]:
                    return _l('edge name %s is duplicate. ') % edge_name
            else:
                edge_dict[edge_name] = new_edge
        return ''

    def deleteOtlPar(self, params_json):
        all_params = ['otl_ids', 'knw_id']
        required = ['otl_ids', 'knw_id']
        code, message = self.params_check(params_json.keys(), all_params, required)
        if code == self.INVALID:
            return code, message
        for key, value in params_json.items():
            if key == 'otl_ids':
                if not isinstance(value, list):
                    message += _l('parameter otl_ids must be list. ')
                elif len(value) == 0:
                    message += _l("parameter otl_ids cannot be empty.")
                else:
                    for otl_id in value:
                        if not isinstance(otl_id, int) or otl_id <= 0:
                            message += _l('ontology id must be int, and more than zero. ')
                            break
            elif key == 'knw_id':
                if not isinstance(value, int):
                    message += _l('parameter knw_id must be int. ')
                elif value <= 0:
                    message += _l('parameter knw_id must be larger than zero. ')
        if message:
            return self.INVALID, message
        return self.VALID, message

    def otlSqlExtractPar(self, params_json):
        message = ""
        ret_status = self.VALID
        # check ds_id
        if "ds_id" not in params_json.keys():
            message += _l("NO parameter %s. ") % "ds_id"
        elif not isinstance(params_json["ds_id"], int):
            message += _l("Parameter %s must be a int type. ") % "ds_id"

        # check sql
        if "sql" not in params_json.keys():
            message += _l("NO parameter %s. ") % "sql"
        elif not isinstance(params_json["sql"], str):
            message += _l("Parameter %s must be a string type. ") % "sql"
        elif len(params_json["sql"]) == 0:
            message += _l("Parameter %s cannot be empty. ") % "sql"
        elif not commonutil.check_statement_num(params_json["sql"]):
            message += _l("Parameter sql only support entering a single statement. ")
        else:
            sql = params_json["sql"]
            sql = re.sub(r"[\n\t]", " ", sql)
            if not regex.findall("^(?i)(\\s*)(select)(\\s+)(((?!( insert | update | delete | create |"
                                 " drop | alter | truncate | grant )).)+)$", sql):
                message += _l("Parameter sql must be a query statement. ")

        # check sql_name
        if "sql_name" not in params_json.keys():
            message += _l("NO parameter %s. ") % "sql_name"
        elif not isinstance(params_json["sql_name"], str):
            message += _l("Parameter %s must be a string type. ") % "sql_name"
        elif len(params_json["sql_name"]) == 0:
            message += _l("Parameter %s cannot be empty. ") % "sql_name"
        elif len(params_json["sql_name"]) > 50 or not (re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value,
                                                                 params_json["sql_name"])):
            message += _l("Parameter sql_name only support English and Chinese, numbers and underline,"
                          " and the length is 0-50 digits.")

        if message:
            ret_status = self.INVALID
        return ret_status, message

    def otlSqlPreviewPar(self, params_json):
        message = ""
        ret_status = self.VALID
        # check sql
        if "sql" not in params_json.keys():
            message += _l("NO parameter %s. ") % "sql"
        elif not isinstance(params_json["sql"], str):
            message += _l("Parameter %s must be a string type. ") % "sql"
        elif len(params_json["sql"]) == 0:
            message += _l("Parameter %s cannot be empty. ") % "sql"
        elif not commonutil.check_statement_num(params_json["sql"]):
            message += _l("Parameter sql only support entering a single statement. ")
        else:
            sql = params_json["sql"]
            sql = re.sub(r"[\n\t]", " ", sql)
            if not regex.findall("^(?i)(\\s*)(select)(\\s+)(((?!( insert | update | delete | create |"
                                 " drop | alter | truncate | grant )).)+)$", sql):
                message += _l("Parameter sql must be a query statement. ")

        # check ds_id
        if "ds_id" not in params_json.keys():
            message += _l("NO parameter %s. ") % "ds_id"
        elif not isinstance(params_json["ds_id"], int):
            message += _l("Parameter %s must be a int type. ") % "ds_id"

        if message:
            ret_status = self.INVALID
        return ret_status, message


otl_check_params = Otl_check_params()

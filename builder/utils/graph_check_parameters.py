# -*-coding:utf-8-*-
# @Time    : 2020/9/7 19:42
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import re
from utils.CommonUtil import commonutil
from utils.ds_check_parameters import dsCheckParameters
from service.graph_Service import graph_Service
from jsonschema import validate, ValidationError

from utils.ontology_check_params import otl_check_params


class GraphCheckParameters(object):
    VALID = 0
    INVALID = -1
    message = ""

    # data参数校验装饰器，可指定不同的校验schema
    def json_validate(self, schema):
        def wrapper(func):
            def inner(data, *args, **kwargs):
                # global message
                try:
                    validate(data, schema)
                except ValidationError as e:
                    # except Exception as e:
                    message = "参数校验失败：{}".format(e.message)  # message
                    ret_status = -1
                else:
                    message = "参数校验通过!"
                    ret_status = 0
                return ret_status, message

            return inner

        return wrapper

    def checkgetgraphbyId(self, params_json):
        ret_status = self.VALID
        message = ""
        required = ["id"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required:
                unnecessaryParameters.append(k)
        # graph_name = params_json.get("graph_name", None)
        graph_id = params_json.get("id", None)
        # graph_status = params_json.get("graph_status", None)
        # 请求的参数缺少必须的参数
        MissingParameters = []
        if graph_id == None:
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
        flag_digit = True
        if not isinstance(graph_id, int):
            flag_digit = False
        else:
            if not graph_id == ''.join(graph_id.split()) or graph_id == "":
                flag_digit = False
        print(flag_digit)

    def graphAddPar(self, params_json):
        ret_status = self.VALID
        message = ""
        graph_step = params_json.get("graph_step", None)
        # 流程三本体单独处理 参数需要一个字段判断是更新本体还是新建本体
        if graph_step != None and graph_step == "graph_otl":

            # 定义参数
            # required = ["graph_name", "graph_step", "graph_process", "graph_status"]
            required = ["graph_step", "graph_process", "updateoradd"]
            # 请求参数
            values = params_json
            # 请求的参数不在定义的参数中
            unnecessaryParameters = []
            for k in values:
                if not k in required:
                    unnecessaryParameters.append(k)
            # graph_name = params_json.get("graph_name", None)
            graph_step = params_json.get("graph_step", None)
            graph_process = params_json.get("graph_process", None)
            updateoradd = params_json.get("updateoradd", None)
            # graph_status = params_json.get("graph_status", None)
            # 请求的参数缺少必须的参数
            MissingParameters = []
            if graph_step == None or graph_process == None or updateoradd == None:
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
            # 校验顺序二 参数是否合法
            if updateoradd not in ["update_otl_name", "add", "update_otl_info"]:
                message += " parameters: updateoradd value must be in [update_otl_name, add,update_otl_info] ！"
                ret_status = self.INVALID
            if not isinstance(graph_process, list):
                message += " parameters: graph_process type must be list ！"
                ret_status = self.INVALID
            # if graph_status not in ["edit", "finished"]:
            #     message += " parameters: graph_status value must be edit or finished ！"
            #     ret_status = self.INVALID
            if ret_status == -1:
                return ret_status, message
        else:
            # 定义参数
            # required = ["graph_name", "graph_step", "graph_process", "graph_status"]
            required = ["graph_step", "graph_process"]
            if graph_step == "graph_baseInfo":
                required = ["graph_step", "graph_process", "knw_id"]
            # 请求参数
            values = params_json
            # 请求的参数不在定义的参数中
            unnecessaryParameters = []
            for k in values:
                if not k in required:
                    unnecessaryParameters.append(k)
            # graph_name = params_json.get("graph_name", None)
            graph_step = params_json.get("graph_step", None)
            graph_process = params_json.get("graph_process", None)
            knw_id = params_json.get("knw_id", None)
            # graph_status = params_json.get("graph_status", None)
            # 请求的参数缺少必须的参数
            MissingParameters = []
            if graph_step == None or graph_process == None or knw_id == None:
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
            # 校验顺序二 参数是否合法
            # if len(graph_name) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', graph_name):
            #     message += " parameters: " + graph_name + " Length over 50 or Characters are not _, Chinese, English！"
            #     ret_status = self.INVALID

            if graph_step not in ["graph_baseInfo", "graph_ds", "graph_otl", "graph_InfoExt", "graph_KMap",
                                  "graph_KMerge"]:
                message += " parameters: graph_process value must be in [graph_baseInfo, graph_ds, graph_otl, graph_InfoExt, graph_KMap, graph_KMerge] ！"
                ret_status = self.INVALID
            if not isinstance(graph_process, list):
                message += " parameters: graph_process type must be list ！"
                ret_status = self.INVALID
            if graph_step == "graph_baseInfo":
                if not str(knw_id).isdigit():
                    message += " parameters: knw_id must be number！"
                    ret_status = self.INVALID
                elif int(knw_id) <= 0:
                    message += " parameters: knw_id can not be 0！"
                    ret_status = self.INVALID
            # if graph_status not in ["edit", "finished"]:
            #     message += " parameters: graph_status value must be edit or finished ！"
            #     ret_status = self.INVALID
            if ret_status == -1:
                return ret_status, message
            # 校验顺序三 根据不同的流程步骤，校验不同的步骤
            # 流程一图谱基本信息
            if graph_step == "graph_baseInfo":
                ret_status, message = self.graph_baseInfo(graph_process)
                return ret_status, message
            # 流程二图谱数据源配置
            if graph_step == "graph_ds":
                ret_status, message = self.graph_ds(graph_process)
                return ret_status, message
            # # 流程三图谱本体配置
            # if graph_step == "graph_otl":
            #     print()
            if graph_step == "graph_InfoExt":
                ret_status, message = self.graph_InfoExt(graph_process)
                return ret_status, message
            if graph_step == "graph_KMap":
                ret_status, message = self.graph_KMap(graph_process)
                print("message", message)
                return ret_status, message
            if graph_step == "graph_KMerge":
                ret_status, message = self.graph_Kmerge(graph_process)
                return ret_status, message

        return ret_status, message

    def checkparam_getinfoext(self, params_json):
        '''Flora 20201101'''
        ret_status = self.VALID
        message = ""
        graphid = params_json.get("graphid", None)
        graph_step = params_json.get("graph_step", None)
        infoext_list = params_json.get("infoext_list", None)
        required = ["graphid", "graph_step", "infoext_list"]
        print("*****", graphid, graph_step, infoext_list)
        if graphid == None or graph_step == None or infoext_list == None:
            MissingParameters = []
            for k in required:
                if not k in params_json:
                    MissingParameters.append(k)
            unnecessaryParameters = []
            for k in params_json:
                if not k in required:
                    unnecessaryParameters.append(k)
            if len(unnecessaryParameters) > 0:
                message += "parameters:  %s  are not required!" % ",".join(unnecessaryParameters)
                ret_status = self.INVALID
            if len(MissingParameters) > 0:
                message += "parameters:  %s  are Missing!" % ",".join(MissingParameters)
                ret_status = self.INVALID
            if len(unnecessaryParameters) > 0 or len(MissingParameters) > 0:
                return ret_status, message
        else:
            if not isinstance(graphid, int):
                message = "The parameter graph id type must be int!"
                ret_status = self.INVALID
            graph_step_list = ["graph_InfoExt", "graph_KMap", "graph_KMerge"]
            if graph_step not in graph_step_list:
                message += " parameters: graph_step value must be in {} ！".format(graph_step_list)
                ret_status = self.INVALID
            if not isinstance(infoext_list, list):
                message += " parameters: infoext_list type must be list ！"
                ret_status = self.INVALID

            return ret_status, message

    def graph_InfoExt(self, graph_process):
        '''Flora
        graph_InfoExt保存更新update接口参数校验方法'''
        message = ""
        ret_status = self.VALID
        if len(graph_process) == 0:
            message += " parameters: graph_process is at least one element！"
            ret_status = self.INVALID
        else:
            pattern = u"^[_a-zA-Z0-9\u4e00-\u9fa5]+$"
            schema_InfoExt = {"type": "object",
                              "required": ["ds_name", "ds_id", "ds_path", "data_source", "file_name", "file_source",
                                           "file_path", "extract_type", "extract_rules"],
                              "dependencies": {"extract_model": ["extract_type"]},
                              "uniqueProperties": True,
                              "additionalProperties": False,
                              "properties": {
                                  "ds_name": {'type': 'string', "pattern": pattern, "maxLength": 50},
                                  "ds_id": {'type': 'number'},
                                  "ds_path": {'type': 'string', "pattern": u"\S"},
                                  "data_source": {'type': 'string', "enum": ["mysql", "hive", "as", "as7", "rabbitmq"]},
                                  "file_source": {'type': 'string', "pattern": u"\S"},
                                  "file_type": {'type': 'string', "enum": ["file", "dir", ""]},
                                  "file_name": {'type': 'string', "pattern": u"\S"},
                                  # "pattern": u"^[._a-zA-Z0-9\u4e00-\u9fa5]+$"
                                  "file_path": {'type': 'string', "pattern": u"\S"},
                                  # "postfix": {'type': 'string', "enum": ["doc", "ppt","pdf","txt"]},
                                  "extract_type": {'type': 'string', "pattern": pattern,
                                                   "enum": ["standardExtraction", "modelExtraction",
                                                            "labelExtraction"]},
                                  "extract_model": {'type': 'string', "pattern": pattern, "maxLength": 50},
                                  "extract_rules": {'type': 'array', "uniqueItems": True,
                                                    "items": {"type": "object",
                                                              "required": ["entity_type", "property", "is_model"],
                                                              "properties":
                                                                  {"entity_type": {'type': 'string', "pattern": pattern,
                                                                                   "maxLength": 64},
                                                                   "property": {'type': 'object',
                                                                                "required": ["property_field",
                                                                                             "property_func"],
                                                                                "properties": {
                                                                                    "property_field": {'type': 'string',
                                                                                                       "pattern": pattern,
                                                                                                       "maxLength": 64},
                                                                                    "property_func": {'type': 'string',
                                                                                                      "maxLength": 256,
                                                                                                      "pattern": u"\S"}
                                                                                }, },
                                                                   "is_model": {'type': 'string',
                                                                                "enum": ["from_model", "not_model"]}
                                                                   },
                                                              }
                                                    }
                              },
                              "oneOf": [{"properties": {
                                  "extract_type": {"enum": ["modelExtraction"]}},
                                  "required": ["extract_model"]},
                                  {"properties": {
                                      "extract_type": {"enum": ["standardExtraction", "labelExtraction"]},
                                      "extract_model": {"enum": []},

                                  },
                                  }
                              ],
                              }

            @self.json_validate(schema=schema_InfoExt)
            def graph_InfoExt_api(data):
                print("graph_InfoExt执行入库操作！")
                return data

            flag = False
            for i in graph_process:
                ret_status2, message2 = graph_InfoExt_api(i)
                if ret_status2 != 0:
                    flag = True
                    message += message2
            if flag:
                ret_status = self.INVALID
                return ret_status, message
        return ret_status, message

    def graph_KMap(self, graph_process):
        '''Flora
        graph_KMap保存更新update接口参数校验方法'''
        message = ""
        ret_status = self.VALID
        if not isinstance(graph_process, list):
            message += " parameters: graph_process must be list！"
            ret_status = self.INVALID
        elif len(graph_process) == 0:
            message += " parameters: graph_process is at least one element！"
            ret_status = self.INVALID

        else:
            pattern = u"^[_a-zA-Z0-9\u4e00-\u9fa5]+$|^$"
            schema_KMap = {"type": "object",
                           # type 必须是 ["integer", "string", "number", "object", "array", "boolean", "null"] 六种类型之一
                           # "required": ["otls_map", "relations_map"],
                           "uniqueProperties": True,
                           "additionalProperties": False,  # 是否允许有格外的属性 表示json可以出现object未定义，但是满足一定条件的数据
                           ## "properties" 属性字段 ## array 表示 list ##  "uniqueItems" 是否唯一值，必须是boolean， 如果true，则items内部不允许重复
                           "properties": {
                               "otls_map": {
                                   'type': 'array',
                                   "uniqueItems": True,
                                   "items": {
                                       'type': "object",
                                       # "required" : ["otl_name","entity_type", "infoext_list","property_map"],
                                       "uniqueProperties": True,
                                       "additionalProperties": False,
                                       "properties": {
                                           "otl_name": {
                                               'type': 'string',
                                               "pattern": pattern,
                                               "maxLength": 50},
                                           "entity_type": {
                                               'type': 'string',
                                               "pattern": pattern,
                                               "maxLength": 50},
                                           "property_map": {
                                               'type': 'array',
                                               "uniqueItems": True,
                                               "items": {
                                                   'type': "object",
                                                   "additionalProperties": False,
                                                   "properties": {
                                                       "otl_prop": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "maxLength": 50},
                                                       "entity_prop": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "maxLength": 50}
                                                   }
                                               }
                                           }  # property_map
                                       }  # properties
                                   },
                               },  # otls_map

                               "relations_map": {
                                   'type': 'array',
                                   "uniqueItems": True,
                                   "items": {
                                       'type': "object",
                                       # "required": ["relation_info", "property_map", "relation_map"],
                                       "additionalProperties": False,
                                       "properties": {
                                           "relation_info": {
                                               "type": "object",
                                               "additionalProperties": False,
                                               "properties": {
                                                   "begin_name": {
                                                       'type': 'string',
                                                       "pattern": pattern,
                                                       "maxLength": 50},
                                                   "edge_name": {
                                                       'type': 'string',
                                                       "pattern": pattern,
                                                       "maxLength": 50},
                                                   "end_name": {
                                                       'type': 'string',
                                                       "pattern": pattern,
                                                       "maxLength": 50},
                                                   "entity_type": {
                                                       'type': 'string',
                                                       "pattern": pattern,
                                                       "maxLength": 50},
                                                   ## 1960 ++
                                                   "source_type": {
                                                       'type': 'string',
                                                       "pattern": pattern,
                                                       "enum": ['automatic', 'manual']},
                                                   ## 1960 ++
                                                   "model": {
                                                       'type': 'string',
                                                       "pattern": pattern,
                                                       "enum": ["AImodel", "Generalmodel", "Anysharedocumentmodel",
                                                                "Contractmodel", "OperationMaintenanceModel", ""]}
                                               }
                                           },  # relation_info
                                           "property_map": {
                                               'type': 'array',
                                               "uniqueItems": True,
                                               "items": {
                                                   'type': "object",
                                                   "additionalProperties": False,
                                                   "properties": {
                                                       "edge_prop": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "maxLength": 50},
                                                       "entity_prop": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "maxLength": 50}
                                                   }
                                               }  # items
                                           },  # property_map
                                           "relation_map": {
                                               'type': 'array',
                                               "uniqueItems": True,
                                               "items": {
                                                   'type': "object",
                                                   "additionalProperties": False,
                                                   "properties": {
                                                       "begin_class_prop": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "maxLength": 50},
                                                       "relation_begin_pro": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "maxLength": 50},
                                                       "relation_end_pro": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "maxLength": 50},
                                                       "end_class_prop": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "maxLength": 50},
                                                       "equation_begin": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "enum": ['等于', '包含', '被包含', ""]},
                                                       "equation_end": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "enum": ['等于', '包含', '被包含', ""]},
                                                       "equation": {
                                                           'type': 'string',
                                                           "pattern": pattern,
                                                           "enum": ['等于', '包含', '被包含', ""]},

                                                   },
                                                   "allof": [
                                                       ### 模型 判断条件
                                                       {
                                                           ## 如果 begin_class_prop == “”
                                                           "if": {
                                                               "properties": {
                                                                   "begin_class_prop": {
                                                                       "const": ""}}},
                                                           ## 则 其他 都为空
                                                           "then": {
                                                               "properties": {
                                                                   "relation_begin_pro": {
                                                                       "const": ""},
                                                                   "relation_end_pro": {
                                                                       "const": ""},
                                                                   "end_class_prop": {
                                                                       "const": ""},
                                                                   "equation_begin": {
                                                                       "const": ""},
                                                                   "equation_end": {
                                                                       "const": ""},
                                                                   "equation": {
                                                                       "const": ""}

                                                               }
                                                           },

                                                       },
                                                       ### 四框 判断条件
                                                       {
                                                           ### if relation begin pro != ""
                                                           "if": {
                                                               "properties": {
                                                                   "relation_begin_pro": {
                                                                       "not": {"const": ""}}}},
                                                           ### then "equation" == "" 其他不为空
                                                           "then": {
                                                               "properties": {
                                                                   "equation":
                                                                       {"const": ""},
                                                                   "begin_class_prop":
                                                                       {"not": {"const": ""}},
                                                                   "equation_begin":
                                                                       {"not": {"const": ""}},
                                                                   "relation_end_pro":
                                                                       {"not": {"const": ""}},
                                                                   "end_class_prop":
                                                                       {"not": {"const": ""}},
                                                                   "equation_end":
                                                                       {"not": {"const": ""}}
                                                               },

                                                           }},
                                                       ### 两框 判断条件
                                                       {
                                                           ### if equation != ""
                                                           "if": {
                                                               "properties": {
                                                                   "equation": {
                                                                       "not": {"const": ""}
                                                                   }}},
                                                           ### then begin_class_prop != "" and end_class_prop != "",
                                                           "then": {
                                                               "properties": {
                                                                   "relation_begin_pro":
                                                                       {"const": ""},
                                                                   "begin_class_prop":
                                                                       {"not": {"const": ""}},
                                                                   "equation_begin":
                                                                       {"const": ""},
                                                                   "relation_end_pro":
                                                                       {"const": ""},
                                                                   "end_class_prop":
                                                                       {"not": {"const": ""}},
                                                                   "equation_end":
                                                                       {"const": ""}

                                                               }
                                                           }
                                                       }
                                                   ],
                                               }  # "items"
                                           }  # relation_map
                                       }  # properties
                                   }  # items
                               }  # relations_map
                           }  # schema_KMap
                           }

            @self.json_validate(schema=schema_KMap)
            def graph_KMap_api(data):
                print("graph_KMap执行入库操作！")
                return data

            # def check_relation_map(relation_maps):
            #     ret_status = 0
            #     message = ""
            #     for relation_map in relation_maps :
            #         begin_class_prop = relation_map["begin_class_prop"]
            #         equation_begin = relation_map["equation_begin"]
            #         relation_begin_pro = relation_map["relation_begin_pro"]
            #         equation = relation_map["equation"]
            #         relation_end_pro = relation_map["relation_end_pro"]
            #         equation_end = relation_map["equation_end"]
            #         end_class_prop = relation_map["end_class_prop"]
            #         ## 如果是 模型
            #         if begin_class_prop == "" and end_class_prop == "":
            #             if equation_begin != "" or relation_begin_pro != "" or equation != "" or relation_end_pro != "" or equation_end != "" or end_class_prop != "":
            #                 ret_status = 1
            #                 return ret_status
            #         else :
            #             ## 4 框
            #             if equation == "" :
            #                 if equation_end == "" or relation_begin_pro == "" or relation_end_pro == "" or equation_begin == ""  or begin_class_prop == "" or end_class_prop == "":
            #                     ret_status = 1
            #                     return ret_status
            #
            #             ## 2框
            #             else :
            #                 if relation_begin_pro != "" or relation_end_pro != "" or equation_begin != "" or equation_end != "" or begin_class_prop == "" or end_class_prop == "":
            #                     ret_status = 1
            #                     return ret_status
            #     return ret_status
            flag = False
            for i in graph_process:
                ret_status2, message2 = graph_KMap_api(i)
                if ret_status2 != 0:
                    flag = True
                    message += message2
                # if flag != True :
                #     for relation_maps in i["relations_map"]:
                #         relation_map = relation_maps["relation_map"]
                #         edge_name = relation_maps["relation_info"]["edge_name"]
                #         ret_status_map = check_relation_map(relation_map)
                #         if ret_status_map == 1 :
                #             flag = True
                #             message += edge_name +" has some errors about relation map "

            if flag:
                ret_status = self.INVALID
                return ret_status, message
        return ret_status, message

    def graph_ds(self, graph_process):
        # message = ""
        # ret_status = self.VALID
        # if len(graph_process) == 0:
        #     message += " parameters: graph_process is at least one element ！"
        #     ret_status = self.INVALID
        # else:
        #     for i, graph_process_value in enumerate(graph_process):
        #         rstatus_, message_ = dsCheckParameters.dsAddPar(graph_process_value)
        #         if rstatus_ != 0:
        #             ret_status += rstatus_
        #             message += message_
        # return ret_status, message
        message = ""
        ret_status = self.VALID
        if len(graph_process) == 0:
            message += " parameters: graph_process is at least one element ！"
            ret_status = self.INVALID
        else:
            flag_digit = True
            for id1 in graph_process:
                if type(id1) != int:
                    flag_digit = False
                    break
                # if not isinstance(id1, int):
                #     flag_digit = False
                #     break
            if not flag_digit:
                message = "The parameter list element  must be int"
                ret_status = self.INVALID
        return ret_status, message

    def graph_baseInfo(self, graph_process):
        message = ""
        ret_status = self.VALID
        if len(graph_process) != 1:
            message += " parameters: graph_process Must contain only one element ！"
            ret_status = self.INVALID
        else:
            # 流程一里面的参数校验
            graph_process_value = graph_process[0]
            if not isinstance(graph_process_value, dict):
                message += " parameters: graph_process the element type of the parameter must be dict！"
                ret_status = self.INVALID
            else:
                # 流程中定义的参数
                process_required = ["graph_Name", "graph_des", "graph_db_id"]
                # 流程中请求的参数
                process_values = graph_process_value
                # 请求的参数不在定义的参数中
                process_unnecessaryParameters = []
                for k in process_values:
                    if not k in process_required:
                        process_unnecessaryParameters.append(k)

                graph_Name = graph_process_value.get("graph_Name", None)
                graph_des = graph_process_value.get("graph_des", None)
                # graphDBAddress = graph_process_value.get("graphDBAddress", None)
                # graph_DBName = graph_process_value.get("graph_DBName", None)
                graph_db_id = graph_process_value.get("graph_db_id", None)
                # 请求的参数缺少必须的参数
                process_MissingParameters = []
                if graph_Name == None or graph_des == None or graph_db_id == None:
                    for k in process_required:
                        if not k in process_values:
                            process_MissingParameters.append(k)
                if len(process_unnecessaryParameters) > 0:
                    message += "parameters:  %s  are not required!" % ",".join(process_unnecessaryParameters)
                    ret_status = self.INVALID
                if len(process_MissingParameters) > 0:
                    message += "parameters:  %s  are Missing!" % ",".join(process_MissingParameters)
                    ret_status = self.INVALID
                # 校验顺序一 先校验参数是否缺少或者多的
                if len(process_unnecessaryParameters) > 0 or len(process_MissingParameters) > 0:
                    return ret_status, message
                if len(graph_Name) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', graph_Name):
                    message += "parameters: graph_Name Length cannot exceed 50 or Characters must be Numbers, _, Chinese or  English！"
                    ret_status = self.INVALID
                # if graph_name !=graph_Name:
                #     message += "The graph_name does not match the graph_Name in the graph_process！"
                #     ret_status = self.INVALID
                if graph_des is not None and graph_des != "":
                    if len(graph_des) > 150 or not re.search(
                            u'^[-_a-zA-Z0-9 =~!@#$&%^&*\'\"\“、\‘()_+`{}[\];:,.·?<>|/~！$\s/\n\\\s@#￥%…&*“”（）—+。={}|【】：；、《》？，。\u4e00-\u9fa5]+$',
                            graph_des):
                        message += " parameters: graph_des Length cannot over 150 or Characters illegal!"
                        ret_status = self.INVALID

                # if not commonutil.is_valid_domain(graphDBAddress):
                #     message += " parameters: graphDBAddress irregular！"
                #     ret_status = self.INVALID
                # if len(graph_DBName) > 250 or not re.search(u'^[_a-zA-Z0-9]+$', graph_DBName):
                #     message += "parameters: graph_DBName Length cannot exceed 250 or Characters must be Numbers or English！"
                #     ret_status = self.INVALID
                if not isinstance(graph_db_id, int):
                    message += "parameters: graph_db_id must be int！"
                    ret_status = self.INVALID
        return ret_status, message

    def graph_baseInfo_1635(self, graph_process):
        message = ""
        ret_status = self.VALID
        if len(graph_process) != 1:
            message += " parameters: graph_process Must contain only one element ！"
            ret_status = self.INVALID
        else:
            # 流程一里面的参数校验
            graph_process_value = graph_process[0]
            if not isinstance(graph_process_value, dict):
                message += " parameters: graph_process the element type of the parameter must be dict！"
                ret_status = self.INVALID
            else:
                # 流程中定义的参数
                process_required = ["graph_Name", "graph_des"]
                # 流程中请求的参数
                process_values = graph_process_value
                # 请求的参数不在定义的参数中
                process_unnecessaryParameters = []
                for k in process_values:
                    if not k in process_required:
                        process_unnecessaryParameters.append(k)

                graph_Name = graph_process_value.get("graph_Name", None)
                graph_des = graph_process_value.get("graph_des", None)
                # graphDBAddress = graph_process_value.get("graphDBAddress", None)
                # graph_DBName = graph_process_value.get("graph_DBName", None)
                # 请求的参数缺少必须的参数
                process_MissingParameters = []
                if graph_Name == None or graph_des == None:
                    for k in process_required:
                        if not k in process_values:
                            process_MissingParameters.append(k)
                if len(process_unnecessaryParameters) > 0:
                    message += "parameters:  %s  are not required!" % ",".join(process_unnecessaryParameters)
                    ret_status = self.INVALID
                if len(process_MissingParameters) > 0:
                    message += "parameters:  %s  are Missing!" % ",".join(process_MissingParameters)
                    ret_status = self.INVALID
                # 校验顺序一 先校验参数是否缺少或者多的
                if len(process_unnecessaryParameters) > 0 or len(process_MissingParameters) > 0:
                    return ret_status, message
                if len(graph_Name) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', graph_Name):
                    message += "parameters: graph_Name Length cannot exceed 50 or Characters must be Numbers, _, Chinese or  English！"
                    ret_status = self.INVALID
                # if graph_name !=graph_Name:
                #     message += "The graph_name does not match the graph_Name in the graph_process！"
                #     ret_status = self.INVALID

                if len(graph_des) > 150:
                    message += " parameters: graph_des Length cannot over 150 !"
                    ret_status = self.INVALID
                # if not commonutil.is_valid_domain(graphDBAddress):
                #     message += " parameters: graphDBAddress irregular！"
                #     ret_status = self.INVALID
                # if len(graph_DBName) > 250 or not re.search(u'^[_a-zA-Z0-9]+$', graph_DBName):
                #     message += "parameters: graph_DBName Length cannot exceed 250 or Characters must be Numbers or English！"
                #     ret_status = self.INVALID

        return ret_status, message

    def graph_baseInfo_old(self, graph_process):
        message = ""
        ret_status = self.VALID
        if len(graph_process) != 1:
            message += " parameters: graph_process Must contain only one element ！"
            ret_status = self.INVALID
        else:
            # 流程一里面的参数校验
            graph_process_value = graph_process[0]
            if not isinstance(graph_process_value, dict):
                message += " parameters: graph_process the element type of the parameter must be dict！"
                ret_status = self.INVALID
            else:
                # 流程中定义的参数
                process_required = ["graph_Name", "graph_des", "graphDBAddress", "graph_DBName"]
                # 流程中请求的参数
                process_values = graph_process_value
                # 请求的参数不在定义的参数中
                process_unnecessaryParameters = []
                for k in process_values:
                    if not k in process_required:
                        process_unnecessaryParameters.append(k)

                graph_Name = graph_process_value.get("graph_Name", None)
                graph_des = graph_process_value.get("graph_des", None)
                graphDBAddress = graph_process_value.get("graphDBAddress", None)
                graph_DBName = graph_process_value.get("graph_DBName", None)
                # 请求的参数缺少必须的参数
                process_MissingParameters = []
                if graph_Name == None or graph_des == None \
                        or graphDBAddress == None or graph_DBName == None:
                    for k in process_required:
                        if not k in process_values:
                            process_MissingParameters.append(k)
                if len(process_unnecessaryParameters) > 0:
                    message += "parameters:  %s  are not required!" % ",".join(process_unnecessaryParameters)
                    ret_status = self.INVALID
                if len(process_MissingParameters) > 0:
                    message += "parameters:  %s  are Missing!" % ",".join(process_MissingParameters)
                    ret_status = self.INVALID
                # 校验顺序一 先校验参数是否缺少或者多的
                if len(process_unnecessaryParameters) > 0 or len(process_MissingParameters) > 0:
                    return ret_status, message
                if len(graph_Name) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', graph_Name):
                    message += "parameters: graph_Name Length cannot exceed 50 or Characters must be Numbers, _, Chinese or  English！"
                    ret_status = self.INVALID
                # if graph_name !=graph_Name:
                #     message += "The graph_name does not match the graph_Name in the graph_process！"
                #     ret_status = self.INVALID

                if len(graph_des) > 150:
                    message += " parameters: graph_des Length cannot over 150 !"
                    ret_status = self.INVALID
                if not commonutil.is_valid_domain(graphDBAddress):
                    message += " parameters: graphDBAddress irregular！"
                    ret_status = self.INVALID
                if len(graph_DBName) > 250 or not re.search(u'^[_a-zA-Z0-9]+$', graph_DBName):
                    message += "parameters: graph_DBName Length cannot exceed 250 or Characters must be Numbers or English！"
                    ret_status = self.INVALID

        return ret_status, message

    def graph_otl_check(self, graph_process):
        message = ""
        ret_status = self.VALID
        if len(graph_process) == 0:
            message += " parameters: graph_process is at least one element ！"
            ret_status = self.INVALID
        else:
            for i, graph_process_value in enumerate(graph_process):
                rstatus_, message_ = otl_check_params.valid_params_check(flag="ontology_save",
                                                                         params_json=graph_process_value)
                if rstatus_ != 0:
                    ret_status += rstatus_
                    message += message_
        return ret_status, message

    def getdsbygraphidPar(self, params_json):
        ret_status = self.VALID
        message = ""
        required = ["id", "type"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required and k != "timestamp":
                unnecessaryParameters.append(k)
        # graph_name = params_json.get("graph_name", None)
        graph_id = params_json.get("id", None)
        ds_type = params_json.get("type", None)

        MissingParameters = []
        if graph_id == None:
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
        # if type(id).__name__ != "int":
        if not graph_id.isdigit():
            message += "The parameter id type must be int!"
            ret_status = self.INVALID
        if ds_type not in ["filter", "unfilter"]:
            message += "The parameter type must be in [filter, unfilter] !"
            ret_status = self.INVALID
        return ret_status, message

    def savenoCheckPar(self, params_json):
        ret_status = self.VALID
        message = ""
        # 定义参数
        # required = ["graph_name", "graph_step", "graph_process", "graph_status"]
        required = ["graph_id", "graph_baseInfo", "graph_ds", "graph_otl", "graph_InfoExt", "graph_KMap",
                    "graph_KMerge"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required:
                unnecessaryParameters.append(k)
        # graph_name = params_json.get("graph_name", None)
        graph_id = params_json.get("graph_id", None)
        graph_baseInfo = params_json.get("graph_baseInfo", None)
        graph_ds = params_json.get("graph_ds", None)
        graph_otl = params_json.get("graph_otl", None)
        graph_InfoExt = params_json.get("graph_InfoExt", None)
        graph_KMap = params_json.get("graph_KMap", None)
        graph_KMerge = params_json.get("graph_KMerge", None)
        # 请求的参数缺少必须的参数
        MissingParameters = []
        if graph_id == None or graph_baseInfo == None or graph_ds == None \
                or graph_otl == None or graph_InfoExt == None or graph_KMap == None or graph_KMerge == None:
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
        # 校验顺序二 参数是否合法
        # if updateoradd not in ["update", "add"]:
        #     message += " parameters: updateoradd value must be in [update, add] ！"
        #     ret_status = self.INVALID
        flag = False
        message3 = ""
        for k in values:
            print(values[k])
            if k != "graph_id":
                if not isinstance(values[k], list):
                    flag = True
                    message3 += k + " "
        if flag:
            message += " parameters: %s  must be list ！" % message3
            ret_status = self.INVALID
        return ret_status, message

    def graph_Kmerge(self, graph_process):
        message = ""
        ret_status = self.VALID
        inexistence = []  ###没有的参数 应该存在却不存在的参数
        illegual = []  #####不合法的参数 类型 长度
        empty = []  #####传入的参数值为空
        allname = []
        params = ["status", "entity_classes"]
        if not isinstance(graph_process, list):
            illegual.append("graph_KMerge")
            message += "graph_KMerge must be list"
        else:
            if len(graph_process) > 1:
                illegual.append("graph_KMerge")
                message += "graph_KMerge must have only one"
                ret_status = self.INVALID
            else:
                graph_process = graph_process[0]
                for param in params:
                    if param not in graph_process:
                        inexistence.append(param)
                        ret_status = self.INVALID
                    else:
                        value = graph_process[param]
                        if param == "status":
                            if not isinstance(value, bool):
                                illegual.append(param)
                                ret_status = self.INVALID
                                message += param + "must be bool"
                        if param == "entity_classes":
                            if not isinstance(value, list):
                                illegual.append(param)
                                ret_status = self.INVALID
                                message += param + "must be list"
                            else:
                                if "status" not in illegual and "status" not in inexistence:
                                    if graph_process["status"] == False:
                                        if len(value) != 0:
                                            illegual.append(param)
                                            ret_status = self.INVALID
                                            message += "when status is False ,entity_classes must be empty"
                                    else:

                                        if len(value) == 0:
                                            empty.append(param)
                                            ret_status = self.INVALID
                                        else:
                                            for one in value:
                                                ret_enyity, message_enyity = self.check_entity(one, allname)
                                                if ret_enyity != self.VALID:
                                                    illegual.append("entity")
                                                    message += message_enyity
            if illegual:
                # message += "These parameters :" + ",".join(illegual) + " are illegual ; "
                ret_status = self.INVALID
            if inexistence:
                message += "These parameters :" + ",".join(inexistence) + " are inexistence ; "
                ret_status = self.INVALID
            if empty:
                message += "These parameters :" + ",".join(empty) + " are empty ; "
                ret_status = self.INVALID
            message += "\n"
            return ret_status, message

    def check_graph_KMap2(self, params_json, ret_message):
        otl_dict = {}
        ext_dict = {}
        res = {}
        check_res = 0
        ### 各个参数都可为空
        try:
            if 'graph_otl' in ret_message['res'].keys():
                graph_otl = ret_message['res']['graph_otl']
                edge_otl = graph_otl[0]["edge"]
                for edge in edge_otl:
                    otl_dict[edge["name"]] = []
                    for pro in edge["properties"]:
                        otl_dict[edge["name"]].append(pro[0])
                vertex_otl = graph_otl[0]["entity"]
                for vertex in vertex_otl:
                    otl_dict[vertex["name"]] = []
                    for pro in vertex["properties"]:
                        otl_dict[vertex["name"]].append(pro[0])

            if 'graph_InfoExt' in ret_message['res'].keys():
                graph_InfoExt = ret_message['res']['graph_InfoExt']
                for InfoExt in graph_InfoExt:
                    rules = InfoExt["extract_rules"]
                    for rule in rules:
                        entity_type_rule = rule["entity_type"]
                        if entity_type_rule not in ext_dict:
                            ext_dict[entity_type_rule] = []
                        ext_dict[entity_type_rule].append(rule["property"]["property_field"])
            print(ext_dict)

            if 'graph_KMap' not in params_json.keys():
                check_res = 1
                message = "The parameters:%s is invalid" % params_json
                return check_res, message, {}
            graph_KMap = params_json['graph_KMap']
            ret_status, message = self.graph_KMap(graph_KMap)
            if ret_status != 0:
                check_res = 1
                print('--------------------------------------------------------------')
                print(message)
                message = "The parameters:%s is invalid because  " % params_json + message
                return check_res, message, {}
            graph_KMap = params_json['graph_KMap']
            for mapdata in graph_KMap:
                otls_map = mapdata["otls_map"]
                relations_map = mapdata["relations_map"]
                res["otls_map"] = []
                res["relations_map"] = []
                for otl in otls_map:
                    otl_pro_Type = 0
                    ent_Type = 0
                    oneotldict = {}
                    otl_name = otl["otl_name"]
                    entity_type = otl["entity_type"]
                    property_map = otl["property_map"]
                    ## 返回字段
                    oneotldict["entity_type"] = {}
                    oneotldict["otl_name"] = {}
                    oneotldict["property_map"] = []
                    ## 再验证 抽取表
                    if entity_type != "" and entity_type not in ext_dict:
                        ent_Type = 1
                        oneotldict["entity_type"]["Type"] = 1
                        oneotldict["entity_type"]["value"] = entity_type

                    else:
                        oneotldict["entity_type"]["Type"] = 0
                        oneotldict["entity_type"]["value"] = entity_type
                    ## 先验证 抽取属性

                    for pro in property_map:
                        otl_prop = pro["otl_prop"]
                        entity_prop = pro["entity_prop"]
                        ## 返回字段
                        pro_dict = {}
                        if entity_prop != "" and (ent_Type == 1 or entity_prop not in ext_dict[entity_type]):
                            otl_pro_Type = 2
                            pro_dict["otl_prop"] = {}
                            pro_dict["otl_prop"]["Type"] = 0
                            pro_dict["otl_prop"]["value"] = otl_prop
                            pro_dict["entity_prop"] = {}
                            pro_dict["entity_prop"]["Type"] = 2
                            pro_dict["entity_prop"]["value"] = entity_prop
                        else:
                            pro_dict["otl_prop"] = {}
                            pro_dict["otl_prop"]["Type"] = 0
                            pro_dict["otl_prop"]["value"] = otl_prop
                            pro_dict["entity_prop"] = {}
                            pro_dict["entity_prop"]["Type"] = 0
                            pro_dict["entity_prop"]["value"] = entity_prop
                        oneotldict["property_map"].append(pro_dict)

                    ## 最后验证 本体 如果这个类里有任何一个错误，则这个本体是错的
                    if ent_Type == 1 or otl_pro_Type == 2:
                        oneotldict["otl_name"]["Type"] = 1
                        oneotldict["otl_name"]["value"] = otl_name
                    else:
                        oneotldict["otl_name"]["Type"] = 0
                        oneotldict["otl_name"]["value"] = otl_name
                    res["otls_map"].append(oneotldict)

                for rel in relations_map:
                    rel_pro_Type = 0
                    rel_Type = 0
                    rel_map_Type = 0
                    onereldict = {}
                    relation_info = rel["relation_info"]
                    rel_entity_type = relation_info["entity_type"]
                    edge_name = relation_info["edge_name"]
                    begin_name = relation_info["begin_name"]
                    end_name = relation_info["end_name"]
                    property_map = rel["property_map"]
                    relation_map = rel["relation_map"]
                    ## 返回字段
                    onereldict["relation_info"] = {}
                    onereldict["relation_map"] = []
                    onereldict["property_map"] = []
                    ## 先验证抽取属性 再验证抽取类 再验证4框 最后验证本体
                    ## 再验证抽取类

                    ## 如果抽取类为2框映射，抽取类为空
                    ## 如果是四框映射，抽取类不可为空
                    ## 如果是模型 抽取不为空
                    ## 四框映射,模型
                    if rel_entity_type != "":
                        if rel_entity_type not in ext_dict:
                            rel_Type = 1
                            onereldict["relation_info"]["entity_type"] = {}
                            onereldict["relation_info"]["entity_type"]["Type"] = 1
                            onereldict["relation_info"]["entity_type"]["value"] = rel_entity_type
                        else:
                            onereldict["relation_info"]["entity_type"] = {}
                            onereldict["relation_info"]["entity_type"]["Type"] = 0
                            onereldict["relation_info"]["entity_type"]["value"] = rel_entity_type
                            ## 先验证抽取属性
                            ## 如果是两框可为空
                            for rel_pro in property_map:
                                rel_prop = rel_pro["edge_prop"]
                                entity_prop = rel_pro["entity_prop"]
                                ## 返回字段
                                rel_pro_dict = {}
                                if entity_prop != "" and entity_prop not in ext_dict[rel_entity_type]:
                                    rel_pro_Type = 2
                                    rel_pro_dict["edge_prop"] = {}
                                    rel_pro_dict["edge_prop"]["Type"] = 0
                                    rel_pro_dict["edge_prop"]["value"] = rel_prop
                                    rel_pro_dict["entity_prop"] = {}
                                    rel_pro_dict["entity_prop"]["Type"] = 2
                                    rel_pro_dict["entity_prop"]["value"] = entity_prop
                                else:
                                    rel_pro_dict["otl_prop"] = {}
                                    rel_pro_dict["otl_prop"]["Type"] = 0
                                    rel_pro_dict["otl_prop"]["value"] = rel_prop
                                    rel_pro_dict["entity_prop"] = {}
                                    rel_pro_dict["entity_prop"]["Type"] = 0
                                    rel_pro_dict["entity_prop"]["value"] = entity_prop
                                onereldict["property_map"].append(rel_pro_dict)
                    else:  ## entity type 如果为空
                        onereldict["relation_info"]["entity_type"] = {}
                        onereldict["relation_info"]["entity_type"]["Type"] = 0
                        onereldict["relation_info"]["entity_type"]["value"] = rel_entity_type
                        for rel_pro in property_map:
                            rel_prop = rel_pro["edge_prop"]
                            entity_prop = rel_pro["entity_prop"]
                            ## 返回字段
                            rel_pro_dict = {}
                            if entity_prop != "":
                                rel_pro_Type = 2
                                rel_pro_dict["edge_prop"] = {}
                                rel_pro_dict["edge_prop"]["Type"] = 0
                                rel_pro_dict["edge_prop"]["value"] = rel_prop
                                rel_pro_dict["entity_prop"] = {}
                                rel_pro_dict["entity_prop"]["Type"] = 2
                                rel_pro_dict["entity_prop"]["value"] = entity_prop
                            else:
                                rel_pro_dict["otl_prop"] = {}
                                rel_pro_dict["otl_prop"]["Type"] = 0
                                rel_pro_dict["otl_prop"]["value"] = rel_prop
                                rel_pro_dict["entity_prop"] = {}
                                rel_pro_dict["entity_prop"]["Type"] = 0
                                rel_pro_dict["entity_prop"]["value"] = entity_prop
                            onereldict["property_map"].append(rel_pro_dict)

                    ## 再验证map框
                    for map in relation_map:
                        rel_map_dict = {}
                        begin_class_prop = map["begin_class_prop"]
                        relation_begin_pro = map["relation_begin_pro"]
                        relation_end_pro = map["relation_end_pro"]
                        end_class_prop = map["end_class_prop"]
                        rel_map_dict["begin_class_prop"] = {}
                        rel_map_dict["begin_class_prop"]["Type"] = 0
                        rel_map_dict["begin_class_prop"]["Value"] = begin_class_prop
                        rel_map_dict["end_class_prop"] = {}
                        rel_map_dict["end_class_prop"]["Type"] = 0
                        rel_map_dict["end_class_prop"]["Value"] = end_class_prop
                        rel_map_dict["relation_begin_pro"] = {}
                        rel_map_dict["relation_begin_pro"]["Type"] = 0
                        rel_map_dict["relation_begin_pro"]["Value"] = relation_begin_pro
                        rel_map_dict["relation_end_pro"] = {}
                        rel_map_dict["relation_end_pro"]["Type"] = 0
                        rel_map_dict["relation_end_pro"]["Value"] = relation_end_pro

                        ## 本体
                        if begin_name not in otl_dict or (
                                begin_class_prop != "" and begin_class_prop not in otl_dict[begin_name]):
                            rel_map_Type = 2
                            rel_map_dict["begin_class_prop"]["Type"] = 2
                        ## 本体
                        if end_name not in otl_dict or (
                                end_class_prop != "" and end_class_prop not in otl_dict[end_name]):
                            rel_map_Type = 2
                            rel_map_dict["end_class_prop"]["Type"] = 2
                        ## 抽取
                        if rel_entity_type != "":  ## 四框或者模型
                            if relation_begin_pro != "" and relation_end_pro != "":
                                if rel_pro_Type == 2 or (relation_begin_pro not in ext_dict[rel_entity_type]):
                                    rel_map_Type = 2
                                    rel_map_dict["relation_begin_pro"]["Type"] = 2
                                if rel_pro_Type == 2 or (relation_end_pro not in ext_dict[rel_entity_type]):
                                    rel_map_Type = 2
                                    rel_map_dict["relation_end_pro"]["Type"] = 2
                        onereldict["relation_map"].append(rel_map_dict)

                    if rel_Type == 1 or rel_map_Type == 2 or rel_pro_Type == 2:
                        onereldict["relation_info"]["edge_name"] = {}
                        onereldict["relation_info"]["edge_name"]["Type"] = 1
                        onereldict["relation_info"]["edge_name"]["value"] = edge_name
                        onereldict["relation_info"]["begin_name"] = begin_name
                        onereldict["relation_info"]["end_name"] = end_name
                    else:
                        onereldict["relation_info"]["edge_name"] = {}
                        onereldict["relation_info"]["edge_name"]["Type"] = 0
                        onereldict["relation_info"]["edge_name"]["value"] = edge_name
                        onereldict["relation_info"]["begin_name"] = begin_name
                        onereldict["relation_info"]["end_name"] = end_name

                    res["relations_map"].append(onereldict)
                message = "graph_KMap_check have finished "

                return check_res, message, res
        except Exception as e:
            err = repr(e)
            check_res = 1
            message = err
            res = {}
            return check_res, message, res

    def check_graph_KMap(self, params_json, ret_message):
        check_res = 0
        # 获取本体库中的点和边，点属性集和边属性集
        graph_otl = otlname_graph = edgename_graph = []
        if 'graph_otl' in ret_message['res'].keys():
            graph_otl = ret_message['res']['graph_otl']
            if isinstance(graph_otl, list) and len(graph_otl) > 0:
                otlname_graph = []
                edgename_graph = []
                try:
                    otlname_graph = [x['name'] for x in [i["entity"] for i in graph_otl][0]]
                    # print("otlname_graph",otlname_graph)
                    edgename_graph = [x['name'] for x in [i["edge"] for i in graph_otl][0]]
                    # print("edgename_graph",edgename_graph)
                except Exception:
                    pass

        # 获取抽取规则中的实体和实体属性集合
        entity_type_list = []
        entity_message = graph_Service.get_entity_property(ret_message, 'graph_InfoExt')
        all_entity_list = entity_message['res']
        if all_entity_list:
            entity_type_list = [i['entity_type'] for i in all_entity_list]

        # 前端传来的参数，先校验参数格式,不正确直接return,正确了就取出【点和边的映射信息】
        if 'graph_KMap' not in params_json.keys():
            check_res = 1
            message = "The parameters:%s is invalid" % params_json
            return check_res, message, {}
        graph_KMap = params_json['graph_KMap']
        ret_status, message = self.graph_KMap(graph_KMap)
        if ret_status != 0:
            check_res = 1
            message = "The parameters:%s is invalid" % params_json
            return check_res, message, {}

        otls_map = []
        relations_map = []
        try:
            otls_map = graph_KMap[0]["otls_map"]
            relations_map = graph_KMap[0]["relations_map"]
        except Exception:
            pass

        def get_dictdata(dict_f, list_f, add_str):
            '''取出字典中的key作为变量名，value赋值给变量'''
            for i in list_f:
                globals()[i + add_str] = ""
                if dict_f:
                    if i in dict_f.keys():
                        globals()[i + add_str] = dict_f[i]

        # 先校验点映射信息的准确性,并返回Type:0,1,2
        otls_map_check = []
        for map in otls_map:
            if map:
                get_dictdata(map, ["otl_name", "entity_type", "key_property", "property_map"], "_lc")
                print("otl_name_lc=====", otl_name_lc, entity_type_lc, key_property_lc, property_map_lc)

                # 1、判断映射中的点类名称是否在本体库中,在本体中取出点类属性集
                otl_name_property = []
                if otl_name_lc == "" or otl_name_lc in otlname_graph:
                    otl_flag = 0
                    try:
                        for p in [i["entity"] for i in graph_otl][0]:
                            if p['name'] == otl_name_lc:
                                for j in p['properties']:
                                    otl_name_property.append(j[0])
                    except Exception:
                        pass
                else:
                    otl_flag = 1

                # 2、判断实体名称是否在抽取规则中，在则“取出”实体属性集合
                entity_property = []
                entity_key_property = []
                if entity_type_lc == "" or entity_type_lc in entity_type_list:
                    entity_flag = 0
                    try:
                        entity_property = \
                            [i["entity_prop"] for i in all_entity_list if i["entity_type"] == entity_type_lc][0]
                        entity_key_property = \
                            [i["key_property"] for i in all_entity_list if i["entity_type"] == entity_type_lc][0]
                    except Exception as e:
                        pass
                else:
                    entity_flag = 1
                    if otl_flag == 0: otl_flag = 2

                # 3、判断实体标识字段是否在该实体属性集合中
                if key_property_lc == "" or key_property_lc in entity_key_property:
                    flag = 0
                else:
                    flag = 1
                    if otl_flag == 0: otl_flag = 2
                key_property_check = {"value": key_property_lc, "Type": flag}

                property_map_check = []
                # 4、判断“点类的属性映射”信息是否正确
                for property in property_map_lc:
                    get_dictdata(property, ["entity_prop", "otl_prop"], "_lc")
                    print("entity_prop_map====***********", entity_prop_lc, otl_prop_lc)
                    if otl_prop_lc == "" or otl_prop_lc in otl_name_property:
                        flag = 0
                    else:
                        flag = 1
                        if otl_flag == 0: otl_flag = 2
                    otl_prop_check = {"value": otl_prop_lc, "Type": flag}
                    if entity_prop_lc == "" or entity_prop_lc in entity_property:
                        flag = 0
                    else:
                        flag = 1
                        if otl_flag == 0: otl_flag = 2
                    entity_prop_check = {"value": entity_prop_lc, "Type": flag}
                    property_map_check.append({"otl_prop": otl_prop_check, "entity_prop": entity_prop_check})

                otl_name_check = {"value": otl_name_lc, "Type": otl_flag}
                entity_type_check = {"value": entity_type_lc, "Type": entity_flag}
                otl_map_checkone = {"otl_name": otl_name_check, "entity_type": entity_type_check,
                                    "key_property": key_property_check, "property_map": property_map_check}
                otls_map_check.append(otl_map_checkone)
        print("otls_map_check=====", otls_map_check)

        # 校验“边类”映射信息的准确性,并返回Type:0,1,2
        relations_map_check = []
        for edge_map in relations_map:
            if edge_map:
                get_dictdata(edge_map, ["relation_info", "property_map", "relation_map"], "_ed")
                print("relation_info_lc=======", relation_info_ed, property_map_ed, relation_map_ed)

                # 一、relation_info:校验基本信息，起始点，边和终点、抽取规则是否存在
                get_dictdata(relation_info_ed, ["begin_name", "edge_name", "end_name", "entity_type", "key_property"],
                             "_map")
                print("begin_name_map=====", begin_name_map, edge_name_map, end_name_map, entity_type_map,
                      key_property_map)

                # 1、校验《边类名》是否在本体库中，存在则取出边类属性集
                otl_edge_property = []
                if edge_name_map == "" or edge_name_map in edgename_graph:
                    edge_flag = 0
                    try:
                        otl_edge_property_temp = \
                            [x['properties'] for x in [i["edge"] for i in graph_otl][0] if x['name'] == edge_name_map][
                                0]  # ?
                        otl_edge_property = [i[0] for i in otl_edge_property_temp]
                        # print("otl_edge_property",otl_edge_property)
                    except Exception:
                        pass
                else:
                    edge_flag = 1

                # 2、校验《边类映射的实体》是否存在，存在取出该实体对应的属性集
                edge_property = []
                if entity_type_map == "" or entity_type_map in entity_type_list:
                    flag = 0
                    try:
                        edge_property = \
                            [i["entity_prop"] for i in all_entity_list if i["entity_type"] == entity_type_map][0]
                    except Exception:
                        pass
                else:
                    flag = 1
                    if edge_flag == 0: edge_flag = 2
                edge_entity_type_check = {"value": entity_type_map, "Type": flag}

                # 3、判断边类的实体标识字段是否存在
                if key_property_map == "" or key_property_map in edge_property:
                    flag = 0
                else:
                    flag = 1
                    if edge_flag == 0: edge_flag = 2
                edge_key_prop_check = {"value": key_property_map, "Type": flag}

                # 3、判断起始点和终点是否存在，存在时取出起始点/终点的属性集（注意：一定是取映射的实体的属性）
                begin_property = []
                if begin_name_map == "" or begin_name_map in otlname_graph:
                    flag = 0
                    try:
                        begin_entity = [i['entity_type'] for i in otls_map if i['otl_name'] == begin_name_map][0]
                        begin_property = \
                            [i["entity_prop"] for i in all_entity_list if i["entity_type"] == begin_entity][0]
                    except Exception as e:
                        pass
                else:
                    flag = 1
                    if edge_flag == 0: edge_flag = 2
                begin_name_check = {"value": begin_name_map, "Type": flag}

                end_property = []
                if end_name_map == "" or end_name_map in otlname_graph:
                    flag = 0
                    try:
                        end_entity = [i['entity_type'] for i in otls_map if i['otl_name'] == end_name_map][0]
                        end_property = [i["entity_prop"] for i in all_entity_list if i["entity_type"] == end_entity][0]
                    except Exception as e:
                        pass
                else:
                    flag = 1
                    if edge_flag == 0: edge_flag = 2

                end_name_check = {"value": end_name_map, "Type": flag}

                # 4、判断“边类的属性映射”信息是否存在
                edge_property_map_check = []
                for property_edge in property_map_ed:
                    if property_edge:
                        get_dictdata(property_edge, ["edge_prop", "entity_prop"], "_edge")
                        print("edge_prop_edge======", edge_prop_edge, entity_prop_edge)
                        if edge_prop_edge == "" or edge_prop_edge in otl_edge_property:  # 边类存在于的《本体》属性集
                            flag = 0
                        else:
                            flag = 1
                            if edge_flag == 0: edge_flag = 2
                        edge_prop_check = {"value": edge_prop_edge, "Type": flag}
                        if entity_prop_edge == "" or entity_prop_edge in edge_property:  # 边类属性映射对应《实体》的属性集
                            flag = 0
                        else:
                            flag = 1
                            if edge_flag == 0: edge_flag = 2
                        edge_entity_prop_check = {"value": entity_prop_edge, "Type": flag}
                        edge_property_map_check.append(
                            {"edge_prop": edge_prop_check, "entity_prop": edge_entity_prop_check})

                # 边类的关系映射校验
                relation_map_check = []
                for relation in relation_map_ed:
                    # print("relation_map_lc",relation)
                    if relation:
                        get_dictdata(relation, ["Multi_relation", "begin_prop", "edge_prop", "end_prop"], "_ed")
                        print("Multi_relation======", Multi_relation_ed, begin_prop_ed, edge_prop_ed, end_prop_ed)

                        if Multi_relation_ed in ['独立关联', '内部关联', '外部关联', '包含关系', '文档结构关系']:
                            flag = 0
                        else:
                            flag = 1
                            if edge_flag == 0: edge_flag = 2
                        Multi_relation_check = {"value": Multi_relation_ed, "Type": flag}
                        # if not [False for c in edge_prop_ed if c not in edge_property]:#边类映射的《实体》属性集
                        #     flag = 0
                        # else: flag, edge_flag = 1, 2
                        edge_prop_check = []
                        for e in edge_prop_ed:
                            if e == "" or e in edge_property:
                                flag_only = 0
                            else:
                                flag_only = 1
                                if edge_flag == 0: edge_flag = 2
                            edge_prop_check.append({"value": e, "Type": flag_only})

                        if begin_prop_ed == "" or begin_prop_ed in begin_property:
                            flag = 0
                        else:
                            flag = 1
                            if edge_flag == 0: edge_flag = 2
                        begin_prop_check = {"value": begin_prop_ed, "Type": flag}
                        if end_prop_ed == "" or end_prop_ed in end_property:
                            flag = 0
                        else:
                            flag = 1
                            if edge_flag == 0: edge_flag = 2
                        end_prop_check = {"value": end_prop_ed, "Type": flag}

                        relation_map_check.append(
                            {"Multi_relation": Multi_relation_check, "begin_prop": begin_prop_check,
                             "edge_prop": edge_prop_check, "end_prop": end_prop_check})

                edge_name_check = {"value": edge_name_map, "Type": edge_flag}

                relation_info_check = {"begin_name": begin_name_check, "edge_name": edge_name_check,
                                       "end_name": end_name_check, "entity_type": edge_entity_type_check,
                                       "key_property": edge_key_prop_check}

                edge_map_one = {"relation_info": relation_info_check, "property_map": edge_property_map_check,
                                "relation_map": relation_map_check}
                relations_map_check.append(edge_map_one)

        graph_KMap_check = {"otls_map": otls_map_check, "relations_map": relations_map_check}
        # print("graph_KMap_check", graph_KMap_check)
        message = "graph_KMap_check have finished "

        return check_res, message, graph_KMap_check

    def check_entity(self, one, allname):
        message = ""
        ret_status = self.VALID
        inexistence = []  ###没有的参数 应该存在却不存在的参数
        illegual = []  #####不合法的参数 类型 长度
        empty = []  #####传入的参数值为空
        # allname = []
        if "name" not in one:  #####如果名字不存在
            inexistence.append("name")
            ret_status = self.INVALID
        else:

            # allname.append(one["name"])
            paramname = "name"
            namevalue = one["name"]
            if namevalue is None:
                message += "Classname is None type  ; "
                illegual.append(paramname)
                ret_status = self.INVALID
            else:
                if not isinstance(namevalue, str):  ##名字存在，但是不是str
                    message += paramname + " must be  str ; "
                    illegual.append(paramname)
                    ret_status = self.INVALID
                else:
                    if len(namevalue) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$',
                                                            namevalue):  ##名字不是又字母数字下划线组成
                        message += paramname + " must < 50 ; and it is must be consisted of letter ,number and underline ; "
                        illegual.append(paramname)
                        ret_status = self.INVALID
                    if not namevalue == ''.join(namevalue.split()) or namevalue == "":  # 所有参数值 校验是否包含空格或为空
                        empty.append(paramname)
                        ret_status = self.INVALID

                    if namevalue not in allname:
                        allname.append(namevalue)

                    else:  ####如果点类名重复
                        message += "Classname" + " : " + namevalue + " is dupulicated ; "
                        illegual.append(paramname)
                        ret_status = self.INVALID
                    message += namevalue + " has some error : "
        if "properties" not in one:  ###如果属性不存在
            inexistence.append("properties")
            ret_status = self.INVALID
        else:
            proparam = "properties"
            provalue = one["properties"]
            if provalue is None:
                message += "properties is None type  ; "
                illegual.append(provalue)
                ret_status = self.INVALID
            else:
                if not isinstance(provalue, list):  ##如果属性不是list
                    message += proparam + " must be  list ; "
                    illegual.append(proparam)
                    ret_status = self.INVALID
                else:
                    if len(provalue) != 0:
                        propertyname = []
                        for pro in provalue:
                            if not isinstance(pro, dict):  ###如果属性不是dict
                                message += "property" + " must be  dict ; "
                                illegual.append("property")
                                ret_status = self.INVALID

                            else:
                                if "property" not in pro:  ##如果属性没有"property"字段
                                    inexistence.append("property")
                                    ret_status = self.INVALID
                                else:
                                    if pro["property"] is None:
                                        message += "property is None type  ; "
                                        illegual.append(provalue)
                                        ret_status = self.INVALID
                                    else:
                                        if not isinstance(pro["property"], str):  ###如果属性不是str
                                            message += "property must be  str ; "
                                            illegual.append("property")
                                            ret_status = self.INVALID
                                        else:
                                            if pro["property"] not in propertyname:
                                                propertyname.append(pro["property"])
                                            else:  ####如果属性重复
                                                message += "property" + " : " + pro["property"] + " is dupulicated ; "
                                                illegual.append(pro["property"])
                                                ret_status = self.INVALID
                                            if len(pro["property"]) > 50 or not re.search(  ###如果属性不是由字母数字组成
                                                    u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$',
                                                    pro["property"]):
                                                message += "property" + " must < 50 ; and it is must be consisted of letter ,number and underline ; "
                                                illegual.append("property")
                                                ret_status = self.INVALID

                                if "function" not in pro:  ##如果"function"字段不存在
                                    inexistence.append("function")
                                    ret_status = self.INVALID
                                else:
                                    if pro["function"] is None:
                                        message += "function is None type  ; "
                                        illegual.append(provalue)
                                        ret_status = self.INVALID
                                    else:
                                        if pro["function"] != "equality":  ####如果函数不是相等
                                            message += "function must be  equality ; "
                                            illegual.append("function")
                                            ret_status = self.INVALID
        if len(allname) != len(set(allname)):  ###如果点类名重复
            message += "entity name is  dupulicated"
            illegual.append("name")
            ret_status = self.INVALID
        if inexistence:
            message += "These parameters :" + ",".join(inexistence) + " are inexistence ; "
            ret_status = self.INVALID
        if empty:
            message += "These parameters :" + ",".join(empty) + "  are exist but empty or have blankspace:"
            ret_status = self.INVALID
        if illegual:
            # message += "These parameters :" + ",".join(illegual) + " are illegual ; "
            ret_status = self.INVALID
        message += "\n"
        return ret_status, message

    # 图谱批量删除参数校验
    def graphDelPar(self, params_json):
        ret_status = self.VALID
        message = ""
        required = ["graphids", "knw_id"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required and k != "timestamp":
                unnecessaryParameters.append(k)
        graph_id = params_json.get("graphids", None)
        knw_id = params_json.get("knw_id")
        MissingParameters = []
        if graph_id == None:
            MissingParameters.append("graphids")
        if knw_id == None:
            MissingParameters.append("knw_id")
        if len(unnecessaryParameters) > 0:
            message += "parameters:  %s  are not required!" % ",".join(unnecessaryParameters)
            ret_status = self.INVALID
        if len(MissingParameters) > 0:
            message += "parameters:  %s  are Missing!" % ",".join(MissingParameters)
            ret_status = self.INVALID
        # 校验顺序一 先校验参数是否缺少或者多的
        if len(unnecessaryParameters) > 0 or len(MissingParameters) > 0:
            return ret_status, message
        if not isinstance(graph_id, list):
            message += "The parameter graphids must be list!"
            ret_status = self.INVALID
            return ret_status, message
        if not isinstance(knw_id, int) or knw_id < 1:
            message += "The parameter knw_id must be int and greater than 0!"
            ret_status = self.INVALID
            return ret_status, message
        if len(graph_id) == 0:
            message += "The parameter graphids can't be empty!"
            ret_status = self.INVALID
            return ret_status, message
        for temp in graph_id:
            if not isinstance(temp, int):
                message += "The parameter graphids element must be int!"
                ret_status = self.INVALID
                break
        return ret_status, message

    # 图谱编辑过程中的数据源列表
    def getGraphDSList(self, params_json):
        ret_status = 0
        message = ""
        graph_ds_list_params = ["page", "size", "order"]

        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        for pa in graph_ds_list_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += " parameters: %s can not be empty !" % ",".join(
                message_dict["no_request"])
            return ret_status, message
        for k in params_json.keys():
            if k in graph_ds_list_params:
                value = params_json[k]
                if k == "page":
                    if value == "-1":
                        continue
                    else:
                        if not value.isdigit() or value == "0":
                            message += " parameters: " + k + " must be int, and more than zero!"
                            ret_status = self.INVALID

                elif k == "order":
                    if value not in ["ascend", "descend"]:
                        message += " parameters: " + k + " must be ascend or descend!"
                        ret_status = self.INVALID
                else:
                    if not value.isdigit() or value == "0":
                        message += " parameters: " + k + " must be int, and more than zero!"
                        ret_status = self.INVALID
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID

        if len(message_dict["request_error"]) > 0:
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
        if len(message_dict["request_illegal"]) > 0:
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
        return ret_status, message


    def output(self, params_json):
        pass #empty


    def input(self, knw_id, graph_id, method):

        pass #empty


graphCheckParameters = GraphCheckParameters()

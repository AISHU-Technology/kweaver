# -*-coding:utf-8-*-
# @Time    : 2020/9/7 19:42
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import re
from flask_babel import gettext as _l
from jsonschema import validate, ValidationError
from utils.CommonUtil import commonutil, RegularEnum
from utils.log_info import Logger
from utils.ontology_check_params import otl_check_params


class GraphCheckParameters(object):  # pragma: no cover
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
                    message = e.message
                    if e.validator == 'pattern':
                        if e.validator_value == u"\S":
                            message = '"{}" must be non empty string.'.format(e.instance)
                    if len(e.absolute_path) > 0:
                        message = "参数校验失败：{} {}".format(e.absolute_path[-1], message)
                    else:
                        message = "参数校验失败：{}".format(message)
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
        Logger.log_info(flag_digit)

    def graphAddPar(self, params_json, graphname):
        ret_status = self.VALID
        message = ""
        graph_step = params_json.get("graph_step", None)
        # 流程三本体单独处理 参数需要一个字段判断是更新本体还是新建本体
        if graph_step != None and graph_step == "graph_otl":
            # 定义参数
            required = ["graph_step", "graph_process", "updateoradd"]
            # 请求参数
            values = params_json
            # 请求的参数不在定义的参数中
            unnecessaryParameters = []
            for k in values:
                if not k in required:
                    unnecessaryParameters.append(k)
            graph_step = params_json.get("graph_step", None)
            graph_process = params_json.get("graph_process", None)
            updateoradd = params_json.get("updateoradd", None)
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
            if graph_step not in ["graph_baseInfo", "graph_ds", "graph_otl", "graph_KMap"]:
                message += " parameters: graph_process value must be in [graph_baseInfo, graph_ds, graph_otl, graph_KMap] ！"
                ret_status = self.INVALID
            if graph_step in ['graph_ds', 'graph_otl']:
                if not isinstance(graph_process, list):
                    message += " parameters: graph_process type must be list ！"
                    ret_status = self.INVALID
            elif graph_step in ['graph_baseInfo', 'graph_KMap']:
                if not isinstance(graph_process, dict):
                    message += " parameters: graph_process type must be dict ！"
                    ret_status = self.INVALID
            if graph_step == "graph_baseInfo":
                if not str(knw_id).isdigit():
                    message += " parameters: knw_id must be number！"
                    ret_status = self.INVALID
                elif int(knw_id) <= 0:
                    message += " parameters: knw_id can not be 0！"
                    ret_status = self.INVALID
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
            # if graph_step == "graph_InfoExt":
            #     ret_status, message = self.graph_InfoExt(graph_process)
            #     return ret_status, message
            # 流程四知识映射
            if graph_step == "graph_KMap":
                ret_status, message = self.graph_KMap(graph_process)
                Logger.log_info("message: {}".format(message))
                return ret_status, message

        return ret_status, message


    def graph_KMap(self, graph_process):
        ''' graph_KMap保存更新update接口参数校验方法 '''
        message = ""
        ret_status = self.VALID
        if not isinstance(graph_process, dict):
            message += " parameters: graph_process must be dict！"
            ret_status = self.INVALID
            return ret_status, message

        pattern = u"^[_a-zA-Z0-9\u4e00-\u9fa5/]+$|^$"
        one_in_keyboard_pattern = u'^[=~!@#$&%^&*()_+`{}\-[\];:,.\\\?<>\'"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]{1}$'
        schema_KMap = {
            "type": "object",
            # type 必须是 ["integer", "string", "number", "object", "array", "boolean", "null"] 六种类型之一
            "required": ["entity", "edge", 'files'],
            "uniqueProperties": True,
            "additionalProperties": False,  # 是否允许有格外的属性 表示json可以出现object未定义，但是满足一定条件的数据
            ## "properties" 属性字段 ## array 表示 list ##  "uniqueItems" 是否唯一值，必须是boolean， 如果true，则items内部不允许重复
            'properties': {
                'entity': {
                    'type': 'array',
                    'uniqueItems': True,
                    'items': {
                        'type': 'object',
                        'uniqueProperties': True,
                        'additionalProperties': False,
                        'required': ['name', 'entity_type', 'x', 'y', 'property_map'],
                        'properties': {
                            'name': {
                                'type': 'string',
                                'pattern': pattern,
                                'maxLength': 50
                            },
                            'entity_type': {
                                'type': 'string',
                                'pattern': pattern,
                                'maxLength': 54
                            },
                            'x': {
                                'type': 'number'
                            },
                            'y': {
                                'type': 'number'
                            },
                            'property_map': {
                                'type': 'array',
                                'uniqueItems': True,
                                'items': {
                                    'type': 'object',
                                    'uniqueProperties': True,
                                    'additionalProperties': False,
                                    'required': ['entity_prop', 'otl_prop'],
                                    'properties': {
                                        'entity_prop': {
                                            'type': 'string',
                                            'pattern': pattern,
                                            'maxLength': 50
                                        },
                                        'otl_prop': {
                                            'type': 'string',
                                            'pattern': pattern,
                                            'maxLength': 50
                                        },
                                    }
                                }
                            }
                        }
                    }
                },
                'edge': {
                    'type': 'array',
                    'uniqueItems': True,
                    'items': {
                        'type': 'object',
                        "uniqueProperties": True,
                        "additionalProperties": False,
                        'required': ['relations', 'entity_type', 'property_map', 'relation_map'],
                        'properties': {
                            'relations': {
                                'type': 'array',
                                'minItems': 3,
                                'maxItems': 3,
                                'items': {
                                    'type': 'string',
                                    'pattern': pattern,
                                    'maxLength': 50
                                }
                            },
                            'entity_type': {
                                'type': 'string',
                                'pattern': pattern,
                                'maxLength': 54
                            },
                            'property_map': {
                                'type': 'array',
                                'uniqueItems': True,
                                'items': {
                                    'type': 'object',
                                    "uniqueProperties": True,
                                    "additionalProperties": False,
                                    'required': ['entity_prop', 'edge_prop'],
                                    'properties': {
                                        'entity_prop': {
                                            'type': 'string',
                                            'pattern': pattern,
                                            'maxLength': 50
                                        },
                                        'edge_prop': {
                                            'type': 'string',
                                            'pattern': pattern,
                                            'maxLength': 50
                                        }
                                    }
                                }
                            },
                            'relation_map': {
                                'type': 'object',
                                "uniqueProperties": True,
                                "additionalProperties": False,
                                'required': ['begin_class_prop', 'equation_begin', 'relation_begin_pro',
                                             'equation', 'relation_end_pro', 'equation_end',
                                             'end_class_prop'],
                                'properties': {
                                    'begin_class_prop': {
                                        'type': 'string',
                                        'pattern': pattern,
                                        'maxLength': 50
                                    },
                                    'equation_begin': {
                                        'type': 'string',
                                        "enum": ['等于', '包含', '被包含', ""]
                                    },
                                    'relation_begin_pro': {
                                        'type': 'string',
                                        'pattern': pattern,
                                        'maxLength': 50
                                    },
                                    'equation': {
                                        'type': 'string',
                                        "enum": ['等于', '包含', '被包含', ""]
                                    },
                                    'relation_end_pro': {
                                        'type': 'string',
                                        'pattern': pattern,
                                        'maxLength': 50
                                    },
                                    'equation_end': {
                                        'type': 'string',
                                        "enum": ['等于', '包含', '被包含', ""]
                                    },
                                    'end_class_prop': {
                                        'type': 'string',
                                        'pattern': pattern,
                                        'maxLength': 50
                                    },
                                },
                                "allof": [
                                    # 模型 判断条件
                                    {
                                        # 如果 begin_class_prop == “”
                                        "if": {
                                            "properties": {
                                                "begin_class_prop": {"const": ""}
                                            }
                                        },
                                        # 则 其他 都为空
                                        "then": {
                                            "properties": {
                                                "relation_begin_pro": {"const": ""},
                                                "relation_end_pro": {"const": ""},
                                                "end_class_prop": {"const": ""},
                                                "equation_begin": {"const": ""},
                                                "equation_end": {"const": ""},
                                                "equation": {"const": ""}
                                            }
                                        },

                                    },
                                    # 有中间表（3表） 判断条件
                                    {
                                        # if relation_begin_pro != ""
                                        "if": {
                                            "properties": {
                                                "relation_begin_pro": {"not": {"const": ""}}
                                            }
                                        },
                                        # then "equation" == "" 其他不为空
                                        "then": {
                                            "properties": {
                                                "equation": {"const": ""},
                                                "begin_class_prop": {"not": {"const": ""}},
                                                "equation_begin": {"not": {"const": ""}},
                                                "relation_end_pro": {"not": {"const": ""}},
                                                "end_class_prop": {"not": {"const": ""}},
                                                "equation_end": {"not": {"const": ""}}
                                            },
                                        }
                                    },
                                    # 没有中间表（2表） 判断条件
                                    {
                                        # if equation != ""
                                        "if": {
                                            "properties": {
                                                "equation": {"not": {"const": ""}
                                                             }
                                            }
                                        },
                                        # then begin_class_prop != "" and end_class_prop != "",
                                        "then": {
                                            "properties": {
                                                "relation_begin_pro": {"const": ""},
                                                "begin_class_prop": {"not": {"const": ""}},
                                                "equation_begin": {"const": ""},
                                                "relation_end_pro": {"const": ""},
                                                "end_class_prop": {"not": {"const": ""}},
                                                "equation_end": {"const": ""}
                                            }
                                        }
                                    }
                                ],
                            }
                        }
                    }
                },
                'files': {
                    'type': 'array',
                    'uniqueItems': True,
                    'items': {
                        'type': 'object',
                        "uniqueProperties": True,
                        "additionalProperties": False,
                        'required': ['ds_id', 'data_source', 'ds_path', 'extract_type', 'extract_rules',
                                     'files', 'x', 'y'],
                        'properties': {
                            'ds_id': {
                                'type': 'integer'
                            },
                            'data_source': {
                                'type': 'string',
                                'enum': ["mysql", "hive", "sqlserver",
                                         "kingbasees", "postgresql", 'clickhouse']
                            },
                            'ds_path': {
                                'type': 'string'
                            },
                            'extract_type': {
                                'type': 'string',
                                "enum": ["standardExtraction", "modelExtraction", 'sqlExtraction']
                            },
                            'extract_rules': {
                                'type': 'array',
                                "uniqueItems": True,
                                'items': {
                                    'type': 'object',
                                    "uniqueProperties": True,
                                    "additionalProperties": False,
                                    'required': ['entity_type', 'property'],
                                    'properties': {
                                        'entity_type': {
                                            'type': 'string',
                                            "pattern": pattern,
                                            "maxLength": 54
                                        },
                                        'property': {
                                            'type': 'array',
                                            "uniqueItems": True,
                                            'items': {
                                                'type': 'object',
                                                "uniqueProperties": True,
                                                "additionalProperties": False,
                                                'required': ['column_name', 'property_field'],
                                                'properties': {
                                                    'column_name': {
                                                        'type': 'string'
                                                    },
                                                    'property_field': {
                                                        'type': 'string',
                                                        "pattern": pattern,
                                                        "maxLength": 64
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            'files': {
                                'type': 'array',
                                "uniqueItems": True,
                                'items': {
                                    'type': 'object',
                                    "uniqueProperties": True,
                                    "additionalProperties": False,
                                    'required': ['file_name', 'file_path', 'file_source'],
                                    'properties': {
                                        'file_name': {
                                            'type': 'string',
                                            "pattern": u"\S"
                                        },
                                        'file_path': {
                                            'type': 'string'
                                        },
                                        'file_source': {
                                            'type': 'string',
                                            "pattern": u"\S"
                                        },
                                        'file_type': {
                                            'type': 'string',
                                            "enum": ["file", "dir", ""]
                                        },
                                        'delimiter': {
                                            'type': 'string',
                                            "pattern": one_in_keyboard_pattern
                                        },
                                        'quotechar': {
                                            'type': 'string',
                                            "pattern": one_in_keyboard_pattern
                                        },
                                        'escapechar': {
                                            'type': 'string',
                                            "pattern": one_in_keyboard_pattern
                                        },
                                        'start_time': {
                                            'type': 'integer'
                                        },
                                        'end_time': {
                                            'type': 'integer'
                                        }
                                    }
                                }
                            },
                            'x': {
                                'type': 'number'
                            },
                            'y': {
                                'type': 'number'
                            },
                            'extract_model': {
                                'type': 'string',
                                'enum': ['Contractmodel',
                                         'OperationMaintenanceModel',
                                         'Anysharedocumentmodel',
                                         'AImodel',
                                         'Generalmodel',
                                         '']
                            },
                            'partition_usage': {'type': 'boolean'},
                            'partition_infos': {'type': 'object'}
                        },
                        'allOf': [
                            {
                                # 如果是模型抽取，则extract_model必填
                                'if': {
                                    'properties': {'extract_type': {'enum': ['modelExtraction']}}
                                },
                                'then': {
                                    'required': ['extract_model'],
                                    'properties': {
                                        'extract_model': {
                                            'enum': ['Contractmodel',
                                                     'OperationMaintenanceModel',
                                                     'Anysharedocumentmodel',
                                                     'AImodel',
                                                     'Generalmodel']
                                        }
                                    }
                                }
                            },
                            {
                                # 如果是hive数据源，则分区必填
                                'if': {
                                    'properties': {'data_source': {'enum': ['hive']}}
                                },
                                'then': {
                                    'required': ['partition_usage', 'partition_infos'],
                                    'properties': {
                                        'partition_usage': {'type': 'boolean'},
                                        'partition_infos': {'type': 'object'}
                                    }
                                }
                            },
                            {
                                # 如果为标准抽取或sql抽取，则extract_rules和files只有一项
                                'if': {
                                    'properties': {
                                        'extract_type': {'enum': ['standardExtraction', 'sqlExtraction']}
                                    }
                                },
                                'then': {
                                    'properties': {
                                        'extract_rules': {'minItems': 1, 'maxItems': 1, },
                                        'files': {'minItems': 1, 'maxItems': 1, }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
        }

        @self.json_validate(schema=schema_KMap)
        def graph_KMap_api(data):
            Logger.log_info("graph_KMap执行入库操作！")
            return data

        ret_status2, message2 = graph_KMap_api(graph_process)
        if ret_status2 != 0:
            message += message2
            ret_status = self.INVALID
            return ret_status, message

        # 检测files的entity_type是否重复
        # entity_pros: {files的entity_type: 抽取对象属性列表}
        entity_pros = {}
        # sql_names: sql抽取时的sql数据文件名称
        sql_names = []
        # 模型抽取的entity_type列表
        model_entity_types = []
        for file in graph_process['files']:
            # 检测files的entity_type是否重复
            for extract_rule in file['extract_rules']:
                if file['extract_type'] == 'modelExtraction':
                    model_entity_types.append(extract_rule['entity_type'])
                elif extract_rule['entity_type'] in entity_pros:
                    ret_status = self.INVALID
                    # 前端添加文件时会避免entity_type重名，但是如果是升级上来的配置或者导入的文件有可能会重复，
                    # 这时在前端重新添加一遍就可以解决。
                    message += ' 请重新添加文件 {}.'.format(extract_rule['entity_type'])
                    return ret_status, message
                entity_pros[extract_rule['entity_type']] = [pro['property_field'] for pro in extract_rule['property']]
            # 当数据源为hive时，校验分区信息是否正确
            if file['data_source'] == 'hive':
                partition_usage = file['partition_usage']
                partition_infos = file['partition_infos']
                if partition_usage and len(partition_infos) == 0:
                    message += f" parameters: ds_id:{file['ds_id']} table:{file['files'][0]['file_name']}'s partition_infos cannot be empty ！"
                    ret_status = self.INVALID
                    return ret_status, message
                for name, expression in partition_infos.items():
                    from service.dsm_Service import dsm_service
                    if not dsm_service.checkPartitionExpression(expression):
                        message += f" parameters: ds_id:{file['ds_id']} table:{file['files'][0]['file_name']}'s partition:{name} expression is invalid ！"
                        ret_status = self.INVALID
                        return ret_status, message
            # 当sql抽取时，校验以下参数
            if file['extract_type'] == 'sqlExtraction':
                sql_name = file['files'][0]["file_name"]
                sql = file['files'][0]["file_source"]
                sql = re.sub(r"[\n\t]", " ", sql)
                if len(sql_name) > 50 or not (re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, sql_name)):
                    ret_status = self.INVALID
                    message += "sql_name " + sql_name + _l(" only support English and Chinese, numbers and "
                                                           "underline, and the length is 0-50 digits.")
                    return ret_status, message
                if sql_name in sql_names:
                    ret_status = self.INVALID
                    message += _l("sql name %s repeats. ") % sql_name
                    return ret_status, message
                else:
                    sql_names.append(sql_name)
                if not re.findall("^(?i)(\\s*)(select)(\\s+)(((?!( insert | delete | update | create |"
                                     " drop | alter | truncate | grant )).)+)$", sql):
                    message += _l("Parameter SQL must be a query statement. ")
                    return ret_status, message

        # 检测entity和edge的entity_type是否和files的entity_type一致
        # 检测entity和edge的属性在files的属性中存在
        # class_entity_types: 已经映射至实体类/关系类的entity_type集合
        class_entity_types = set()
        for entity in graph_process['entity']:
            # 实体类可以不映射至文件，此时entity_type为空字符串，跳过校验
            if entity['entity_type']:
                class_entity_types.add(entity['entity_type'])
                if entity['entity_type'] not in entity_pros:
                    ret_status = self.INVALID
                    message += _l('entity_type of entity "{}" does not exists in entity_types of files. ').format(
                        entity['name'])
                    return ret_status, message
            for prop in entity['property_map']:
                # entity_prop为空时表示属性未映射
                if prop['entity_prop'] and prop['entity_prop'] not in entity_pros[entity['entity_type']]:
                    ret_status = self.INVALID
                    message += _l('entity_prop "{entity_prop}" of entity "{entity}" does not exists in property_field of files. ')\
                        .format(entity_prop=prop['entity_prop'], entity=entity['name'])
                    return ret_status, message
        for edge in graph_process['edge']:
            # 关系类可以不映射至文件，此时entity_type为空字符串，跳过校验
            if edge['entity_type']:
                class_entity_types.add(edge['entity_type'])
                if edge['entity_type'] not in entity_pros:
                    ret_status = self.INVALID
                    message += _l('entity_type of edge "{}" does not exists in entity_types of files. ').format(
                        edge['relations'])
                    return ret_status, message
            for prop in edge['property_map']:
                # entity_prop为空时表示属性未映射
                if prop['entity_prop'] and prop['entity_prop'] not in entity_pros[edge['entity_type']]:
                    ret_status = self.INVALID
                    message += _l(
                        'entity_prop "{entity_prop}" of edge "{edge}" does not exists in property_field of files. ') \
                        .format(entity_prop=prop['entity_prop'], edge=edge['relations'])
                    return ret_status, message
        # 检测files的entity_type是否有没映射至实体类/关系类的
        # 需要排除模型的entity_type，因为可能模型的本体删去了部分，但是抽取仍然全部抽取
        extra = set(entity_pros.keys()) - set(model_entity_types) - class_entity_types
        if extra:
            ret_status = self.INVALID
            message += 'The entity_type of the file {} does not map to entity or relationship classes'.format(extra)
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
        # 流程一里面的参数校验
        graph_process_value = graph_process
        if not isinstance(graph_process_value, dict):
            message += " parameters: graph_process the element type of the parameter must be dict！"
            ret_status = self.INVALID
        else:
            # 流程中定义的参数
            process_parameters = ["graph_Name", "graph_des", 'to_be_uploaded']
            process_required = ["graph_Name", "graph_des"]
            # 流程中请求的参数
            process_values = graph_process_value
            # 请求的参数不在定义的参数中
            process_unnecessaryParameters = []
            for k in process_values:
                if not k in process_parameters:
                    process_unnecessaryParameters.append(k)

            graph_Name = graph_process_value.get("graph_Name", None)
            graph_des = graph_process_value.get("graph_des", None)
            # graphDBAddress = graph_process_value.get("graphDBAddress", None)
            # graph_DBName = graph_process_value.get("graph_DBName", None)
            to_be_uploaded = graph_process_value.get("to_be_uploaded", None)
            # 请求的参数缺少必须的参数
            process_MissingParameters = []
            if graph_Name == None or graph_des == None or to_be_uploaded == None:
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
            if len(graph_Name) > 50 or not re.search(
                    RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                    graph_Name):
                message += "parameters: graph_Name only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits."
                ret_status = self.INVALID
            if graph_des is not None and graph_des != "":
                if len(graph_des) > 255 or not re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        graph_des):
                    message += " parameters: graph_des Length cannot over 255 or Characters illegal!"
                    ret_status = self.INVALID

            if to_be_uploaded is not None and to_be_uploaded not in [0, 1]:
                message += _l('parameter to_be_uploaded must be 0 or 1. ')
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
                if len(graph_Name) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, graph_Name):
                    message += "parameters: graph_Name Length cannot exceed 50 or Characters must be Numbers, _, Chinese or  English！"
                    ret_status = self.INVALID
                # if graph_name !=graph_Name:
                #     message += "The graph_name does not match the graph_Name in the graph_process！"
                #     ret_status = self.INVALID

                if len(graph_des) > 150:
                    message += " parameters: graph_des Length cannot over 150 !"
                    ret_status = self.INVALID

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
                if len(graph_Name) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, graph_Name):
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
        required = ["graph_id", "graph_baseInfo", "graph_ds", "graph_otl", "graph_KMap"]
        all_params = ["graph_id", "graph_baseInfo", "graph_ds", "graph_otl", "graph_KMap"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in all_params:
                unnecessaryParameters.append(k)
        # graph_name = params_json.get("graph_name", None)
        graph_id = params_json.get("graph_id", None)
        graph_baseInfo = params_json.get("graph_baseInfo", None)
        graph_ds = params_json.get("graph_ds", None)
        graph_otl = params_json.get("graph_otl", None)
        graph_KMap = params_json.get("graph_KMap", None)
        # 请求的参数缺少必须的参数
        MissingParameters = []
        if graph_id == None or graph_baseInfo == None or graph_ds == None \
                or graph_otl == None or graph_KMap == None:
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
        list_params = ""
        for k in values:
            Logger.log_info(values[k])
            if k == 'graph_id':
                if not isinstance(values[k], int):
                    message += "graph_id must be int."
                    ret_status = self.INVALID
            elif k in ['graph_ds']:
                if not isinstance(values[k], list):
                    message += " parameters: graph_ds must be list ！"
            elif k in ['graph_KMap', 'graph_baseInfo', 'graph_otl']:
                if not isinstance(values[k], dict):
                    message += 'parameter %s must be dict. ' % k
                    ret_status = self.INVALID
        return ret_status, message

    def getdsotlbygraphIdPar(self, params_json):
        ret_status = self.VALID
        message = ""
        required = ["graph_id", "type"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required and k != "timestamp":
                unnecessaryParameters.append(k)
        graph_id = params_json.get("graph_id", None)
        ds_type = params_json.get("type", None)
        MissingParameters = []
        if graph_id == None:
            MissingParameters.append("graph_id")
        if ds_type == None:
            MissingParameters.append("type")
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
            message += "The parameter graph_id must be list!"
            ret_status = self.INVALID
            return ret_status, message
        if len(graph_id) == 0:
            message += "The parameter graph_id can't be empty!"
            ret_status = self.INVALID
            return ret_status, message
        for temp in graph_id:
            if not isinstance(temp, int):
                message += "The parameter graph_id element must be int!"
                ret_status = self.INVALID
                break
        if ds_type not in [1, 2]:
            message += "The parameter type must be in [1, 2] !"
            ret_status = self.INVALID
        return ret_status, message

    # 根据graph_id查找该图谱下个数据源或本体接口参数校验
    def getgraphinfoPar(self, params_json):
        ret_status = self.VALID
        message = ""
        required = ["graph_id"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required and k != "timestamp":
                unnecessaryParameters.append(k)
        graph_id = params_json.get("graph_id", None)
        MissingParameters = []
        if graph_id == None:
            MissingParameters.append("graph_id")
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
            message += "The parameter graph_id must be list!"
            ret_status = self.INVALID
            return ret_status, message
        if len(graph_id) == 0:
            message += "The parameter graph_id can't be empty!"
            ret_status = self.INVALID
            return ret_status, message
        for temp in graph_id:
            if not isinstance(temp, int):
                message += "The parameter graph_id element must be int!"
                ret_status = self.INVALID
                break
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
            message += _l(" parameters: %s can not be empty !") % ",".join(
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
                            message += _l(" parameters: ") + k + _l(" must be int, and more than zero!")
                            ret_status = self.INVALID

                elif k == "order":
                    if value not in ["ascend", "descend"]:
                        message += _l(" parameters: ") + k + _l(" must be ascend or descend!")
                        ret_status = self.INVALID
                else:
                    if not value.isdigit() or value == "0":
                        message += _l(" parameters: ") + k + _l(" must be int, and more than zero!")
                        ret_status = self.INVALID
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID

        if len(message_dict["request_error"]) > 0:
            message += _l(" parameters:  %s  error!") % ",".join(message_dict["request_error"])
        if len(message_dict["request_illegal"]) > 0:
            message += _l(" parameters: %s illegal!") % ",".join(message_dict["request_illegal"])
        if len(message_dict["no_rule"]) > 0:
            message += _l(" parameters: %s no rule!") % ",".join(message_dict["no_rule"])
        if message == "":
            message = _l("unknown error!")
        return ret_status, message

    def output(self, params_json):
        pass  # empty

    def input(self, knw_id, graph_id, method):

        pass  # empty

    def create_subgraph_config(self, params_json):
        ret_status = self.VALID
        message = ''
        # check parameter name
        name = params_json.get('name')
        if not name:
            ret_status = self.INVALID
            message += _l('parameter name cannot be empty. ')
            return ret_status, message
        elif len(name) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, name):
            ret_status = self.INVALID
            message += _l(
                "parameter name cannot exceed 50 characters and characters must be numbers, _, chinese or english. ")
            return ret_status, message
        elif name in ['未分组', 'ungrouped']:
            ret_status = self.INVALID
            message = _l('parameter name cannot be "未分组" or "ungrouped". ')
            return ret_status, message
        # check parameter graph_id
        graph_id = params_json.get('graph_id')
        if not graph_id:
            ret_status = self.INVALID
            message = _l('parameter graph_id cannot be empty.')
            return ret_status, message
        elif type(graph_id) != int:
            ret_status = self.INVALID
            message = _l('parameter graph_id must be int. ')
            return ret_status, message
        elif graph_id <= 0:
            ret_status = self.INVALID
            message = _l('parameter graph_id must be larger than zero.')
            return ret_status, message
        # check parameter ontology_id
        ontology_id = params_json.get('ontology_id')
        if not ontology_id:
            ret_status = self.INVALID
            message = _l('parameter ontology_id cannot be empty.')
            return ret_status, message
        elif type(ontology_id) != int:
            ret_status = self.INVALID
            message = _l('parameter ontology_id must be int. ')
            return ret_status, message
        elif ontology_id <= 0:
            ret_status = self.INVALID
            message = _l('parameter ontology_id must be larger than zero.')
            return ret_status, message
        # check parameter entity
        entity = params_json.get('entity')
        if type(entity) != list:
            ret_status = self.INVALID
            message += 'parameter entity must be list. '
            return ret_status, message
        else:
            message = ''
            ret_status = self.VALID
            entity_names, duplicate_entity = [], set()
            for a_entity in entity:
                entity_check_code, entity_check_message = otl_check_params.entity_edge_check_v1('entity', a_entity)
                if entity_check_code != otl_check_params.VALID:
                    ret_status = self.INVALID
                    message += entity_check_message
                if a_entity['name'] in entity_names:
                    duplicate_entity.add(a_entity['name'])
                else:
                    entity_names.append(a_entity['name'])
            if len(duplicate_entity) != 0:
                ret_status = self.INVALID
                message += 'entities {} are duplicate. '.format(duplicate_entity)
            if ret_status == self.INVALID:
                return ret_status, message
        # check parameter edge
        edge = params_json.get('edge')
        if type(edge) != list:
            ret_status = self.INVALID
            message += 'parameter edge must be list. '
            return ret_status, message
        else:
            message = ''
            ret_status = self.VALID
            edge_relations, duplicate_edge = [], set()
            for a_edge in edge:
                edge_check_code, edge_check_message = otl_check_params.entity_edge_check_v1('edge', a_edge)
                if edge_check_code != otl_check_params.VALID:
                    ret_status = self.INVALID
                    message += edge_check_message
                if a_edge['relations'] in edge_relations:
                    duplicate_edge.add(a_edge['relations'])
                else:
                    edge_relations.append(a_edge['relations'])
            if len(duplicate_edge) != 0:
                ret_status = self.INVALID
                message += 'edge relations {} are duplicate. '.format(duplicate_edge)
            if ret_status == self.INVALID:
                return ret_status, message
        # check relation of entity and edge
        relation_code, relation_message = otl_check_params.entity_relation_check({'entity': entity, 'edge': edge})
        if relation_code != otl_check_params.VALID:
            ret_status = self.INVALID
            message += relation_message
            return ret_status, message
        return ret_status, message

    def edit_subgraph_config(self, params_json):
        if type(params_json) != list:
            ret_status = self.INVALID
            message = _l('the parameter must be a list. ')
            return ret_status, message
        names = []
        subgraph_ids = []
        for a_subgraph_config in params_json:
            # check parameter subgraph_id
            subgraph_id = a_subgraph_config.get('subgraph_id')
            if not subgraph_id:
                ret_status = self.INVALID
                message = _l('parameter subgraph_id cannot be empty.')
                return ret_status, message
            elif type(subgraph_id) != int:
                ret_status = self.INVALID
                message = _l('parameter subgraph_id must be int. ')
                return ret_status, message
            elif subgraph_id <= 0:
                ret_status = self.INVALID
                message = _l('parameter subgraph_id must be larger than zero.')
                return ret_status, message
            elif subgraph_id in subgraph_ids:
                ret_status = self.INVALID
                message = _l('subgraph id {} is duplicate. ').format(subgraph_id)
                return ret_status, message
            else:
                subgraph_ids.append(subgraph_id)
            # check parameter name
            name = a_subgraph_config.get('name')
            if not name:
                ret_status = self.INVALID
                message = _l('parameter name cannot be empty. ')
                return ret_status, message
            elif len(name) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, name):
                ret_status = self.INVALID
                message = _l("parameter name {} cannot exceed 50 characters and characters must be " \
                             "numbers, _, chinese or english. ").format(name)
                return ret_status, message
            else:
                # check whether the names are duplicate
                if name in names:
                    ret_status = self.INVALID
                    message = _l('name {} is duplicate.').format(name)
                    return ret_status, message
                names.append(name)
            # check parameter entity
            if 'entity' in a_subgraph_config:
                entity = a_subgraph_config.get('entity')
                if type(entity) != list:
                    ret_status = self.INVALID
                    message = _l('parameter entity must be list. ')
                    return ret_status, message
                else:
                    message = ''
                    ret_status = self.VALID
                    entity_names, duplicate_entity = [], set()
                    for a_entity in entity:
                        entity_check_code, entity_check_message = otl_check_params.entity_edge_check_v1('entity',
                                                                                                        a_entity)
                        if entity_check_code != otl_check_params.VALID:
                            ret_status = self.INVALID
                            message += entity_check_message
                        if a_entity['name'] in entity_names:
                            duplicate_entity.add(a_entity['name'])
                        else:
                            entity_names.append(a_entity['name'])
                    if len(duplicate_entity) != 0:
                        ret_status = self.INVALID
                        message += 'entities {} are duplicate. '.format(duplicate_entity)
                    if ret_status == self.INVALID:
                        return ret_status, message
            # check parameter edge
            if 'edge' in a_subgraph_config:
                edge = a_subgraph_config.get('edge')
                if type(edge) != list:
                    ret_status = self.INVALID
                    message = _l('parameter edge must be list. ')
                    return ret_status, message
                else:
                    message = ''
                    ret_status = self.VALID
                    edge_relations, duplicate_edge = [], set()
                    for a_edge in edge:
                        edge_check_code, edge_check_message = otl_check_params.entity_edge_check_v1('edge', a_edge)
                        if edge_check_code != otl_check_params.VALID:
                            ret_status = self.INVALID
                            message += edge_check_message
                        if a_edge['relations'] in edge_relations:
                            duplicate_edge.add(a_edge['relations'])
                        else:
                            edge_relations.append(a_edge['relations'])
                    if len(duplicate_edge) != 0:
                        ret_status = self.INVALID
                        message += 'edge relations {} are duplicate. '.format(duplicate_edge)
                    if ret_status == self.INVALID:
                        return ret_status, message
            # check relation of entity and edge
            if 'entity' in a_subgraph_config and 'edge' in a_subgraph_config:
                relation_code, relation_message = otl_check_params.entity_relation_check(
                    {'entity': entity, 'edge': edge})
                if relation_code != otl_check_params.VALID:
                    ret_status = self.INVALID
                    message = relation_message
                    return ret_status, message
        return self.VALID, 'success'

    def subgraph_save_no_check(self, params_json):
        if type(params_json) != list:
            ret_status = self.INVALID
            message = _l('the parameter must be a list. ')
            return ret_status, message
        subgraph_ids = []
        for a_subgraph_config in params_json:
            # check parameter subgraph_id
            subgraph_id = a_subgraph_config.get('subgraph_id')
            if not subgraph_id:
                ret_status = self.INVALID
                message = _l('parameter subgraph_id cannot be empty.')
                return ret_status, message
            elif type(subgraph_id) != int:
                ret_status = self.INVALID
                message = _l('parameter subgraph_id must be int. ')
                return ret_status, message
            elif subgraph_id <= 0:
                ret_status = self.INVALID
                message = _l('parameter subgraph_id must be larger than zero.')
                return ret_status, message
            elif subgraph_id in subgraph_ids:
                ret_status = self.INVALID
                message = _l('subgraph id {} is duplicate. ').format(subgraph_id)
                return ret_status, message
            else:
                subgraph_ids.append(subgraph_id)
            # check parameter name
            name = a_subgraph_config.get('name')
            if not name:
                ret_status = self.INVALID
                message = _l('parameter name cannot be empty. ')
                return ret_status, message
            elif len(name) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, name):
                ret_status = self.INVALID
                message = _l("parameter name {} cannot exceed 50 characters and characters must be " \
                             "numbers, _, chinese or english. ").format(name)
                return ret_status, message
            # check parameter entity
            if 'entity' in a_subgraph_config:
                entity = a_subgraph_config.get('entity')
                if type(entity) != list:
                    ret_status = self.INVALID
                    message = _l('parameter entity must be list. ')
                    return ret_status, message
            # check parameter edge
            if 'edge' in a_subgraph_config:
                edge = a_subgraph_config.get('edge')
                if type(edge) != list:
                    ret_status = self.INVALID
                    message = _l('parameter edge must be list. ')
                    return ret_status, message
        return self.VALID, 'success'

    def get_subgraph_list(self, params_json):
        ret_status = self.VALID
        # check parameter graph_id
        graph_id = params_json.get('graph_id')
        if not graph_id:
            ret_status = self.INVALID
            message = _l('parameter graph_id cannot be empty.')
            return ret_status, message
        elif type(graph_id) != int and not graph_id.isdigit():
            ret_status = self.INVALID
            message = _l('parameter graph_id must be int. ')
            return ret_status, message
        elif int(graph_id) <= 0:
            ret_status = self.INVALID
            message = _l('parameter graph_id must be larger than zero.')
            return ret_status, message
        # check parameter subgraph_name
        subgraph_name = params_json.get('subgraph_name')
        if subgraph_name is None:
            ret_status = self.INVALID
            message = _l('parameter subgraph_name cannot be empty.')
            return ret_status, message
        # check parameter return_all
        return_all = params_json.get('return_all', "False")
        if return_all not in ["False", "True"]:
            ret_status = self.INVALID
            message = _l('parameter return_all must be False or True.')
            return ret_status, message
        return ret_status, 'success'


graphCheckParameters = GraphCheckParameters()

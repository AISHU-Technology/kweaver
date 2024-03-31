# -*-coding:utf-8-*-
# @Time    : 2020/9/7 18:31
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import configparser
import hashlib
import json
import math
import os
import re
import sys
import time
import traceback
import uuid as uuid_obj
import arrow
import requests
from flask import request
from flask_babel import gettext as _l
import common.stand_log as log_oper
from common.errorcode import codes
from common.errorcode.gview import Gview as Gview2
from dao.dsm_dao import dsm_dao
from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB
# 此处导入知识图谱搜索配置模块
from dao.knw_dao import knw_dao
from dao.otl_dao import otl_dao
from dao.subgraph_dao import subgraph_dao
from dao.task_dao import task_dao
from dao.task_onto_dao import task_dao_onto
from utils.ConnectUtil import mongoConnect
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from utils.log_info import Logger
from utils.opensearch_util import OpenSearchManager
from utils.util import GetGraphDbOsInfo


class GraphService():
    model_dict = {'AImodel': {'name': '名称', 'journal': '发表期刊', 'publish_date': '发布时间', 'financing': '融资',
                              'financing_amount': '融资金额', 'datetime': '举行时间'},
                  'Anysharedocumentmodel': {'name': '名称', 'path': '路径', 'gns': '文档id', 'create_time': '创建时间',
                                            'rev': '版本号', 'subject_id': '主题id', 'subject_path': '主题路径',
                                            'subject_fold': '主题目录', 'subject_desc': '主题描述',
                                            'confidence': '置信度', 'adlabel_kcid': 'AD或者KC的标签',
                                            'kc_topic_tags': 'KC主题标签', 'type_as': '是否来自AS',
                                            'type_sa': '是否来自句法分析', 'type_nw': '是否来自新词',
                                            'type_kc': '是否来自KC', 'creator': '创建者', 'editor': '编辑者',
                                            'file_type': '文件类型', 'modified_time': '修改时间', 'level': '级别',
                                            'weight': '权重', 'score': '主题文档分数'},
                  'Contractmodel': {'name': '名称', 'id': '合同id', 'number': '合同编号', 'currency': '合同金额',
                                    'amount': '币种', 'sign_date': '签约日期', 'account_name': '账户名称',
                                    'bank': '开户行', 'bank_number': '账号', 'tax_rate': '税率', 'tax_amount': '税额',
                                    'amount_without_tax': '不含税金额', 'content': '内容'},
                  'Generalmodel': {'name': '名称', 'height': '身高', 'birthday': '出生日期', 'minority': '民族',
                                   'altitude': '海拔', 'publishing_company': '出版社', 'courtesy_name': '字',
                                   'dynasty': '朝代', 'literary_name': '号', 'area': '面积', 'postcode': '邮政编码',
                                   'population': '人口数量', 'study_duration': '修业年限', 'order_of': '目',
                                   'professional_code': '专业代码', 'release_date': '上映时间', 'abbreviation': '简称',
                                   'registered_capital': '注册资本', 'establishment_date': '成立日期'},
                  'OperationMaintenanceModel': {'name': '名称', 'docComponentId': '组成部分id',
                                                'docComponentClassify': '组成部分分类', 'docClassify': '文档分类',
                                                'docComponentContent': '组成部分内容', 'gns': '文档id',
                                                'docPath': '文档路径', 'docFormat': '文档格式', 'docSize': '文档大小',
                                                'docCreatedTime': '文档创建时间', 'docUpdatedTime': '文档修改时间',
                                                'docTitle': '文档标题', 'docLabel': '文档标签', 'docLink': '文档链接',
                                                'docAuthor': '文档作者', 'docVersion': '文档版本'}}

    def getGraphDB(self, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            res = {}
            rec_dict = [{"ip": GetGraphDbOsInfo.graphdb_host}]
            res["df"] = rec_dict
            obj["res"] = res
            
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert connection fail"

        return ret_code, obj

    def getallgraph(self, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            res = {}
            rec_dict = graph_dao.getallgraph()
            res["df"] = rec_dict
            obj["res"] = res
            
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get graph fail"
        return ret_code, obj


    def get_listDatabases(self, graph_DBAddress, graph_DBPort, username, password, graph_DBType):
        databases = []
        if graph_DBType == 'orientDB':
            headers = {"Connection": "close"}
            url_db = 'http://' + graph_DBAddress + ':' + str(graph_DBPort) + "/listDatabases"
            r_db = requests.get(url_db, headers=headers)
            databases_res = r_db.json()
            databases = databases_res["databases"]
        elif graph_DBType == 'nebulaGraph':
            graph_db = GraphDB()
            graph_db.start_connect_pool()
            connection_pool = graph_db.connection_pool
            session = connection_pool.get_session(username, password)
            res = session.execute('SHOW SPACES')
            size = res.row_size()
            databases = [''] * size
            for i in range(size):
                databases[i] = res.row_values(i)[0]
            graph_db.close_nebula_conn()
            
        return databases

    def get_listMongo(self):
        mongoDB_conn = mongoConnect.connect_mongo()
        # 获取 mongoDB 数据库集合
        mongoDB_names = mongoDB_conn.collection_names()
        mongoDB_col_names = [current_usr.lower().split("_")[0] for current_usr in mongoDB_names]
        return mongoDB_col_names

    def test_avaible_db(self, address, port, username, password, graph_DBType):
        if graph_DBType == 'orientDB':
            dbname = "akdjshfureghfvkldsklgfj"
            headers = {"Connection": "close"}
            try:
                url = f"http://{address}:{port}/database/{dbname}/plocal"
                r_del = requests.delete(url, headers=headers, auth=(username, password), timeout=10)
                if r_del.status_code == 401:
                    raise Exception("username or password error")
            except Exception:
                raise Exception(f"ConnectTimeout: HTTPConnectionPool(host={address}, port={port})")
        elif graph_DBType == 'nebulaGraph':
            graph = GraphDB()
            code, msg = graph.test_nebula_conn()
            if not code:
                raise Exception(msg)

    def addgraph(self, params_json, host_url):
        config = configparser.ConfigParser()
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        dbname_exits_flag = False
        KGname_exit_flag = False
        DB_IP_ERROR = False
        update_flag = False
        graph_id = -1  # 图谱id
        try:
            graph_process_dict = params_json["graph_process"]
            knw_id = params_json["knw_id"]
            graph_Name = graph_process_dict["graph_Name"]
            graph_DBName = graph_process_dict["graph_DBName"]
            KgConf = graph_dao.getKgConfByName(graph_Name, knw_id)
            if len(KgConf) != 0:
                KGname_exit_flag = True
            # 获取图数据库密码
            graph_DBPort = GetGraphDbOsInfo.graphdb_port
            username = GetGraphDbOsInfo.graphdb_user
            password = GetGraphDbOsInfo.graphdb_password
            graph_DBType = GetGraphDbOsInfo.graphdb_type
            if graph_DBType == 'nebulaGraph':
                graphdb_invalid = False
                rule = re.compile('^[a-zA-z]{1}.*$')
                if not isinstance(graph_DBName, str) or graph_DBName.isdigit() \
                        or rule.match(graph_DBName) == None:
                    graphdb_invalid = True
                    obj['cause'] = "nebula graph_DBName must be Beginning with a letter, " \
                                   "a combination of letters and numbers"
                if not graph_DBName.islower():
                    graphdb_invalid = True
                    obj['cause'] = "nebula graph_DBName must be lowercase"
                if graphdb_invalid:
                    obj['code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                    obj['message'] = "create graph config fail"
                    ret_code = CommonResponseStatus.BAD_REQUEST.value
                    return ret_code, obj, graph_id
            graph_DBAddress = GetGraphDbOsInfo.graphdb_host
            graph_lastId = 0
            # 获取最后图谱配置id
            rec_lastId_dict = graph_dao.getKgConfLastId()
            if len(rec_lastId_dict) == 1:
                r_lastId = rec_lastId_dict[0]
                graph_lastId = int(r_lastId["id"])
            conId = "-" + str(graph_lastId + 1)
            graph_mongo_Name = "mongoDB" + conId
            graph_DBName = graph_process_dict["graph_DBName"]
            try:
                # dbname 在数据库已存在
                databases = self.get_listDatabases(graph_DBAddress, graph_DBPort, username, password,
                                                   graph_DBType)
                if graph_DBName in databases:
                    dbname_exits_flag = True
                # dbname 被其他配置使用
                graph_all = graph_dao.getallgraph()
                for graph in graph_all:
                    if "\'graph_DBName\': \'" + graph_DBName + "\'" in graph["graph_baseInfo"]:
                        dbname_exits_flag = True
                        break
                try:
                    # 获取 mongoDB 数据库集合
                    mongoDB_db_names = self.get_listMongo()
                    # 如果自动生成的graph_DBName 已存在orientDB 和 mongoDB 中继续触发生成规则
                    while graph_mongo_Name.lower() in mongoDB_db_names:
                        # 规则是 knowledgegraph_id ;[_id] 是数据库自增id, 如果已存在就拼接_id
                        graph_mongo_Name += conId
                except Exception as e:
                    error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
                    Logger.log_error(error_log)
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "mongoDB Unusable!"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "create fail"
                    
                    return ret_code, obj, graph_id
                if not DB_IP_ERROR:
                    try:
                        # db  需要测试连接一下是否可用
                        self.test_avaible_db(graph_DBAddress, graph_DBPort, username, password, graph_DBType)
                    except Exception as e:
                        error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
                        Logger.log_error(error_log)
                        DB_IP_ERROR = True

            except Exception as e:
                error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                DB_IP_ERROR = True

            graph_process_dict["graphDBAddress"] = graph_DBAddress
            graph_process_dict["graph_DBName"] = graph_DBName
            graph_process_dict["graph_mongo_Name"] = graph_mongo_Name
            if KGname_exit_flag:
                if DB_IP_ERROR:
                    obj['cause'] = "graph name exist and graph DB Unusable!"
                    # 错误码DB_IP_KGNAME_ERROR
                    obj['code'] = CommonResponseStatus.DB_IP_KGNAME_ERROR.value
                    
                else:
                    if dbname_exits_flag:  # 图数据库名
                        obj['cause'] = "graph name exist and graph DB name exist!"
                        obj['code'] = CommonResponseStatus.KGDB_KGNAME_ERROR.value
                        
                    else:
                        obj['cause'] = "kg graph name exists!"
                        obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                        
            else:
                if DB_IP_ERROR:
                    obj['cause'] = "graph DB Unusable!"
                    # 错误码
                    obj['code'] = CommonResponseStatus.DB_IP_ERROR.value
                    
                else:
                    if dbname_exits_flag:  # 图数据库名
                        obj['cause'] = "graph DB name exist!"
                        obj['code'] = CommonResponseStatus.KGDB_ERROR.value
                        
                    else:
                        update_flag = True
            if update_flag:
                # 数据写入graph_config_table，返回最后一个插入的id
                ret = graph_dao.insertData(params_json)
                graph_id = ret
                obj["res"] = str(ret)
            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['message'] = "create graph config fail"
                
        except Exception as e:
            error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "create graph config fail"
            
        return ret_code, obj, graph_id

    def getGraphById(self, grapid, host_url, slient=False):
        """Get the graph configuration by graph id

        Args:
            grapid: graph id
            slient: print log or not

        Returns:
            a dictionary of following keys:
            graph_ds: a list of detailed data source information from table data_source_table
                    whose ids are used by this graph
            graph_baseInfo: the value (instead of longtext string) of graph_baseInfo from table graph_config_table
            graph_KMap: the value (instead of longtext string) of graph_KMap from table graph_config_table
            graph_otl: detailed ontology information value.
            graph_used_ds: the detailed information of data source used by graph_KMap
        """
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = graph_dao.getbyid(grapid)
            if len(ret) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = str(grapid) + " not exist!"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = str(grapid) + _l(" not exist!")
                return ret_code, obj
            else:
                rec_dict = ret[0]
                ds_ids = rec_dict["graph_ds"]
                graph_info = rec_dict["graph_baseInfo"]
                graph_otl = rec_dict["graph_otl"]
                graph_kMap = rec_dict["graph_KMap"]
                used_ds = []  # 使用的数据源
                # 流程中数据源选择的数据源
                if ds_ids is not None and len(eval(ds_ids)) > 0:
                    ds_infos = dsm_dao.getbyids(eval(ds_ids))
                    ds_ids = eval(ds_ids)
                    # 用于保存数据源id顺序
                    order_of_ids = dict(zip(ds_ids, (i for i in range(len(ds_ids)))))

                    # 根据配置中数据源id顺序排序函数
                    def cmpTmp(ds_info1, ds_info2):
                        # 不需要考虑重复的情况
                        if order_of_ids[ds_info1["id"]] < order_of_ids[ds_info2["id"]]:
                            return -1
                        else:
                            return 1

                    import functools
                    # 查询数据源时排序，按照选择的顺序返回，否则保存时自动排序了
                    ds_infos.sort(key=functools.cmp_to_key(cmpTmp))
                    # 将数据源详细信息赋值给graph_ds
                    rec_dict["graph_ds"] = ds_infos
                else:
                    rec_dict["graph_ds"] = eval(ds_ids)
                # 流程中 图谱基本信息
                rec_dict["graph_baseInfo"] = eval(graph_info)
                # 流程中 本体
                if graph_otl is not None and graph_otl != "":
                    otl = otl_dao.getbyids([graph_otl])
                    list_all = self.getotlinfo(otl)
                    if not slient:
                        Logger.log_info(list_all)
                    # entity_map_dict: {实体类名: {将本体的信息添加到graph_KMap返回}}
                    entity_map_dict = {}
                    if list_all:
                        otl = list_all[0]
                        for entity in otl['entity']:
                            entity_map_dict[entity['name']] = {
                                'alias': entity.get('alias'),
                                'icon': entity.get('icon'),
                                'shape': entity.get('shape'),
                                'size': entity.get('size'),
                                'fill_color': entity.get('fill_color'),
                                'stroke_color': entity.get('stroke_color'),
                                'text_color': entity.get('text_color'),
                                'icon_color': entity.get('icon_color'),
                                'text_position': entity.get('text_position'),
                                'text_width': entity.get('text_width'),
                                'text_type': entity.get('text_type'),
                                'default_tag': entity.get('default_tag'),
                                'primary_key': entity.get('primary_key'),
                                'source_type': entity.get('source_type'),
                                'model': entity.get('model')
                            }
                        # edge_map_dict: {关系三元组: {将本体的信息添加到graph_KMap返回}}
                        edge_map_dict = {}
                        for edge in otl['edge']:
                            edge_map_dict[str(edge['relations'])] = {
                                'alias': edge.get('alias'),
                                'default_tag': edge.get('alias'),
                                'color': edge.get('colour'),
                                'width': edge.get('width'),
                                'source_type': edge.get('source_type'),
                                'model': edge.get('model')
                            }
                    # 将本体详细信息赋值给图谱的graph_otl
                    rec_dict["graph_otl"] = list_all
                else:
                    rec_dict["graph_otl"] = []
                # 流程中 图谱映射
                rec_dict["graph_KMap"] = eval(graph_kMap)
                if 'entity' in rec_dict["graph_KMap"]:
                    for entity in rec_dict["graph_KMap"]['entity']:
                        # 有可能流程三已删除实体类，因此此处需要先判断是否存在
                        if entity['name'] in entity_map_dict:
                            entity.update(entity_map_dict[entity['name']])
                if 'edge' in rec_dict['graph_KMap']:
                    for edge in rec_dict['graph_KMap']['edge']:
                        # 有可能流程三已删除关系类，因此此处需要先判断是否存在
                        if str(edge['relations']) in edge_map_dict:
                            edge.update(edge_map_dict[str(edge['relations'])])
                if 'files' in eval(graph_kMap):
                    for file in rec_dict['graph_KMap']['files']:
                        used_ds.append(file['ds_id'])

                # 流程中 映射已经使用的数据源
                if len(used_ds) > 0:
                    if not slient:
                        Logger.log_info(used_ds)
                    # ds_name_dict: {ds_id: ds_name}
                    ds_name_dict = {}
                    ds_byname_dict = dsm_dao.getdsbyids(list(set(used_ds)))
                    for ds in ds_byname_dict:
                        ds_name_dict[ds['id']] = ds['dsname']
                    # 将映射中使用的数据源详细信息赋值给graph_used_ds
                    rec_dict["graph_used_ds"] = ds_byname_dict
                else:
                    rec_dict["graph_used_ds"] = []
                for file in rec_dict['graph_KMap'].get('files', []):
                    file['ds_name'] = ds_name_dict[file['ds_id']]
                obj["res"] = rec_dict

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = _l("get %s fail") % grapid

        return ret_code, obj

    def getotlinfo(self, otl_dict):
        list_all = []  # 重新组装otl
        for reslist in otl_dict:
            dict_all = {}
            for key in reslist:
                if key in ["entity", "edge", "all_task", "used_task", 'canvas']:
                    value = reslist[key]
                    if not isinstance(value, list) and value != None:
                        value = eval(value)
                    if key == "entity" or key == "edge":
                        if len(value) > 0:
                            for v_dict in value:
                                properties = v_dict['properties']
                                if key == "entity":
                                    v_dict['x'] = v_dict.get('x', None)
                                    v_dict['y'] = v_dict.get('y', None)
                                    v_dict['default_tag'] = v_dict.get('default_tag', None)
                                    v_dict['icon'] = v_dict.get('icon', "")
                    dict_all[key] = value
                else:
                    dict_all[key] = reslist[key]
            list_all.append(dict_all)
        return list_all

    def savenocheck(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        # 参数不校验，前端做校验，保存错就错了
        graph_id = params_json.get("graph_id", None)
        try:
            ret = graph_dao.getbyid(graph_id)
            if len(ret) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graphid  %s not exist!" % graph_id
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "Exit save fail"

            else:
                baseinfo_res = graph_dao.getbaseinfoById(graph_id)
                for line in baseinfo_res:
                    graph_baseInfo = line["graph_baseInfo"]
                    graphDBAddress = eval(graph_baseInfo)["graphDBAddress"]
                    graph_DBName = eval(graph_baseInfo)["graph_DBName"]
                    graph_mongo_Name = eval(graph_baseInfo)["graph_mongo_Name"]
                    for key in params_json:
                        value_temp = params_json[key]
                        if key == "graph_baseInfo":
                            value_temp2 = value_temp
                            value_temp2["graphDBAddress"] = graphDBAddress
                            value_temp2["graph_mongo_Name"] = graph_mongo_Name
                            value_temp2["graph_DBName"] = graph_DBName
                            params_json[key] = value_temp2
                            break
                if params_json["graph_KMap"] != {} and "entity" in params_json["graph_otl"].keys() and params_json["graph_otl"]["entity"] != []:
                    if "entity" in params_json["graph_KMap"] and params_json["graph_KMap"]["entity"] == []:
                        for entity in params_json["graph_otl"]["entity"]:
                            tmp_entity = {}
                            tmp_entity["name"] = entity["name"]
                            tmp_entity["entity_type"] = ""
                            tmp_entity["x"] = entity["x"]
                            tmp_entity["y"] = entity["y"]
                            tmp_entity["property_map"] = []
                            for property in entity["properties"]:
                                tmp_property = {}
                                tmp_property["entity_prop"] = ""
                                tmp_property["otl_prop"] = property["name"]
                                tmp_entity["property_map"].append(tmp_property)
                            params_json["graph_KMap"]["entity"].append(tmp_entity)
                    if "edge" in params_json["graph_KMap"] and params_json["graph_KMap"]["edge"] == []:
                        for edge in params_json["graph_otl"]["edge"]:
                            tmp_edge = {}
                            tmp_edge["relations"] = edge["relations"]
                            tmp_edge["entity_type"] = ""
                            tmp_edge["property_map"] = []
                            for property in edge["properties"]:
                                tmp_property = {}
                                tmp_property["entity_prop"] = ""
                                tmp_property["otl_prop"] = property["name"]
                                tmp_edge["property_map"].append(tmp_property)
                            tmp_edge["relation_map"] = {
                                "begin_class_prop": "",
                                "end_class_prop": "",
                                "equation": "",
                                "equation_begin": "",
                                "equation_end": "",
                                "relation_begin_pro": "",
                                "relation_end_pro": ""
                            }

                # 保存本体
                if 'graph_otl' in params_json and params_json['graph_otl']:
                    otl_id = ret[0]['graph_otl']
                    all_data = task_dao_onto.get_all_by_otlid(otl_id)
                    alltask = [info["task_id"] for info in all_data]
                    params_json['graph_otl']["all_task"] = alltask
                    otl_dao.update_info(otl_id, params_json['graph_otl'], 0)
                # 保存除本体以外的信息
                ret = graph_dao.savenocheck(graph_id, params_json)
                Logger.log_info(ret)
                if ret == 1:
                    obj["res"] = "Exit save graph %s " % (graph_id)

                    if params_json["graph_KMap"] != {} and "entity" in params_json["graph_otl"].keys() and \
                            params_json["graph_otl"]["entity"] != []:
                        # 如果此处不为空，检查步骤号是否大于第三步，如果不是的话，把步骤号修改为第三步
                        graph_dao.update_step_num_to_three(graph_id)
                else:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "Exit save %s fail" % graph_id
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Exit save %s fail" % graph_id


        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                obj['cause'] = "database already have the same name"
            obj['message'] = "Exit save %s fail" % graph_id

        return ret_code, obj

    def getdsbygraphid(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        graphid = params_json["id"]
        ds_type = params_json["type"]

        try:
            ret = graph_dao.getbyid(graphid)
            Logger.log_info(ret)
            if len(ret) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graphid  %s not exist!" % graphid
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "get fail"

            else:
                # 查询 图谱中使用数据源
                ds_dict = graph_dao.getdsgraphuse(graphid)
                ds_dict = ds_dict[0]
                ds_ids1 = eval(ds_dict["graph_ds"])
                ## 如果KGIDS在參數里則是走權限，不在就不走權限
                # if "kgIds" in params_json:
                #     kgIds = params_json["kgIds"]
                #     ds_ids = [id for id in ds_ids1 if id in kgIds]
                # else:
                ds_ids = [id for id in ds_ids1]
                if len(ds_ids) > 0:
                    # 获得 图谱中使用的数据源详细信息
                    ds_infos = dsm_dao.getbyids(ds_ids)

                    # 用于保存数据源id顺序
                    order_of_ids = dict(zip(ds_ids, (i for i in range(len(ds_ids)))))

                    # 根据配置中数据源id顺序排序函数
                    def cmpTmp(ds_info1, ds_info2):
                        # 不需要考虑重复的情况
                        if order_of_ids[ds_info1["id"]] < order_of_ids[ds_info2["id"]]:
                            return -1
                        else:
                            return 1

                    import functools
                    # # 查询数据源时排序，按照选择的顺序返回
                    # ds_infos.sort(key=functools.cmp_to_key(cmpTmp))

                    if ds_type == "filter":
                        ds_infos = dsm_dao.getbyids_order(ds_ids)

                    # sort_df_grade = sort_df_grade.loc[sort_df_grade["dataType"] == "structured"]
                    # pd.merge(sort_df_grade, quizs_type_df, on='quiz_id', how='left')
                    res = {}
                    res["count"] = len(ds_infos)
                    res["df"] = ds_infos
                    obj["res"] = res
                else:
                    res = {}
                    res["count"] = 0
                    res["df"] = []
                    obj["res"] = res


        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get %s fail" % graphid

        return ret_code, obj

    def updatebaseInfo(self, grapid, params_json, otl_id, host_url):
        """
        修改流程一
        :param grapid:
        :param params_json:
        :param otl_id:
        :param host_url:
        :return:
        """
        obj = {}
        ret_code = CommonResponseStatus.SUCCESS.value
        KGname_exit_flag = False
        DB_IP_ERROR = False
        update_flag = False
        is_error = False
        try:
            graph_process_dict = params_json["graph_process"]
            knw_id = params_json["knw_id"]
            graph_Name = graph_process_dict["graph_Name"]
            KgConf = graph_dao.getKgByNameandId(graph_Name, grapid, knw_id)
            if len(KgConf) != 0:
                KGname_exit_flag = True
            res = graph_dao.getbaseinfoById(grapid)
            for line in res:
                graph_baseInfo = eval(line["graph_baseInfo"])
                graph_process_dict["graphDBAddress"] = GetGraphDbOsInfo.graphdb_host
                graph_process_dict["graph_mongo_Name"] = graph_baseInfo["graph_mongo_Name"]
                try:
                    # 获取图数据库密码
                    graph_DBPort = GetGraphDbOsInfo.graphdb_port
                    username = GetGraphDbOsInfo.graphdb_user
                    password = GetGraphDbOsInfo.graphdb_password
                    graph_DBAddress = GetGraphDbOsInfo.graphdb_host
                    graph_DBType = GetGraphDbOsInfo.graphdb_type
                    if not DB_IP_ERROR:
                        self.test_avaible_db(graph_DBAddress, graph_DBPort, username, password, graph_DBType)
                except Exception as e:
                    error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
                    Logger.log_error(error_log)
                    DB_IP_ERROR = True

            if KGname_exit_flag:
                is_error = True
                if DB_IP_ERROR:
                    obj['cause'] = "graph name exist and graph DB Unusable!"
                    # 错误码DB_IP_KGNAME_ERROR
                    obj['code'] = CommonResponseStatus.DB_IP_KGNAME_ERROR.value
                    obj['message'] = "update graph fail"

                else:
                    obj['cause'] = "kg graph name exists!"
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['message'] = "update graph fail"

            else:
                if DB_IP_ERROR:
                    is_error = True
                    obj['cause'] = "graph DB Unusable!"
                    # 错误码
                    obj['code'] = CommonResponseStatus.DB_IP_ERROR.value
                    obj['message'] = "update graph fail"

                else:
                    update_flag = True
            if not is_error:
                if update_flag:
                    ret = graph_dao.update(grapid, params_json, otl_id)
                    # 修改时，图数据库名字已经存在
                    task_dao.updatestaskgname(grapid, graph_Name)
                    task_dao.updatehistorygname(grapid, graph_Name)
                    obj["res"] = "update graph "
                else:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['message'] = "update graph fail"
                    obj['cause'] = "graph name not exist"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value

            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "update fail"
                
        return ret_code, obj

    def getrunbygraphid(self, grapid):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            res = task_dao.getRunByid(grapid)
            if len(res) > 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graph_id %s is running or waiting can not edit!" % grapid
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "update fail"
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "update %s fail" % grapid
                
        return ret_code, obj

    # 图谱编辑过程中更新配置
    def update(self, grapid, params_json, otl_id, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = graph_dao.getbyid(grapid)
            if len(ret) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graphid  %s not exist!" % grapid
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "update fail"
                
            else:
                graph_step = params_json["graph_step"]
                if graph_step == "graph_ds":
                    if params_json["graph_process"] == []:  # 如果传的数据源列表为空，直接跳过校验和各种操作，返回ok
                        
                        obj["res"] = "update graph %s " % (grapid)
                        return ret_code, obj
                    graph_process_list = params_json["graph_process"]
                    # 数据源已经不存在
                    ds_infos = dsm_dao.getbyids(graph_process_list)
                    Logger.log_info(ds_infos)
                    if len(ds_infos) != len(graph_process_list):
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "update %s fail" % grapid
                        obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
                        obj['message'] = "update %s fail" % grapid
                        
                    elif len(ds_infos) == len(graph_process_list):
                        graph_dao.update(grapid, params_json, otl_id)
                        obj["res"] = "update graph %s " % (grapid)
                elif graph_step == "graph_baseInfo":
                    ret_code, obj = self.updatebaseInfo(grapid, params_json, otl_id, host_url)

                elif graph_step == "graph_otl":
                    graph_dao.update(grapid, params_json, otl_id)
                    obj["res"] = str(otl_id) + " update graph %s " % (grapid)
                else:
                    graph_dao.update(grapid, params_json, otl_id)
                    obj["res"] = "update graph %s " % (grapid)
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                obj['cause'] = "database already have the same name"
            obj['message'] = "update %s fail" % grapid
        return ret_code, obj


    # 根据graph_id查找该图谱下个数据源或本体
    def getOtlDsByGraphid(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        graph_id = params_json["graph_id"]
        ds_type = params_json["type"]
        ids = []
        try:
            if ds_type == 2:
                res = graph_dao.getDsById(graph_id)
                graph_ds = eval(res[0]["graph_ds"])
                ids.extend(graph_ds)
            else:
                res = graph_dao.getOtlById(graph_id)
                graph_otl = res[0]["graph_otl"]
                ids.append(int(graph_otl))
            obj["res"] = ids
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get %s fail" % graph_id
        return ret_code, obj

    # 根据图谱id，查找图谱名称和描述
    def getGraphInfoByGraphid(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        graph_id = params_json["graph_id"]
        infos = []

        try:
            res = graph_dao.getinfoById(graph_id)
            for line in res:
                temp = {}
                temp["id"] = line["id"]
                graph_baseInfo = line["graph_baseInfo"]
                temp["graph_name"] = eval(graph_baseInfo)["graph_Name"]
                temp["graph_des"] = eval(graph_baseInfo)["graph_des"]
                infos.append(temp)

            obj["res"] = infos
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get %s fail" % graph_id
        return ret_code, obj

    # graphIds运行状态统计
    def getStatusByIds(self, graphids):
        '''
        return the graphs whose task status is running
        Args:
            graphids:
        Returns:
            obj: return object
            code: 0: success; -1: failure
        '''
        obj = {}
        # 运行状态的
        runs = []
        try:
            res = graph_dao.getStatusById(graphids)
            for graph_info in res:
                if graph_info["task_status"] == "running" or graph_info["task_status"] == "waiting":
                    runs.append(graph_info["graph_id"])
            obj["runs"] = runs
            return obj, 0
        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = len(graphids)
            obj['solution'] = 'Please check mariadb or sql'
            return obj, -1

    def getNoExistIds(self, graphids):
        '''
        get the graph ids that not exist in the database
        Args:
            graphids: graph ids to be checked
        Returns:
            obj: return obj
            code: 0: success; -1: failure
        '''
        noExist = []
        obj = {}
        try:
            res = graph_dao.get_graph_id_list()
            allGraphIds = []
            for info in res:
                allGraphIds.append(info["id"])
            # the ids that not exist in the database
            noExist = [i for i in graphids if i not in allGraphIds]
            obj["noExist"] = noExist
            return obj, 0
        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj = {"cause": err,
                   "code": CommonResponseStatus.REQUEST_ERROR.value,
                   "message": "mysql connection error",
                   "solution": "Please check mariadb"}
            return obj, -1

    def deleteGraphByIds(self, graph_ids):
        '''
        batch delete graphs
        Args:
            graph_ids: graph ids to be deleted
        '''
        try:

            # delete mongodb data
            client_mon = mongoConnect.connect_mongo()
            collection_names = client_mon.collection_names()
            graphs_info = graph_dao.getinfoById(graph_ids)
            for info in graphs_info:
                mongo_name = eval(info["graph_baseInfo"])["graph_mongo_Name"]
                for collection_name in collection_names:
                    if collection_name.startswith(mongo_name):
                        db_collection = client_mon[collection_name]
                        db_collection.drop()

            # delete opensearch data
            ret = graph_dao.get_graph_db_id(graph_ids)
            graph_ids = []
            for info in ret:
                graph_ids.append(info["id"])
            for i, graph_id in enumerate(graph_ids):
                opensearch_manager = OpenSearchManager()
                opensearch_manager.delete_index(graph_id)

            # delete graph db data
            KDB_names = set()
            for graph_id in graph_ids:
                graphdb = GraphDB()
                ret = graph_dao.get_version_by_id(graph_id)
                ret_dict = ret[0]
                KDB_name = ret_dict['KDB_name']
                KDB_names.add(KDB_name.split('-')[0])
                KDB_name_temp = ret_dict['KDB_name_temp']
                graphdb.drop_database(KDB_name)
                if KDB_name_temp:
                    graphdb.drop_database(KDB_name_temp)

            # delete redis data
            try:
                for graph_id in graph_ids:
                    graph_dao.delete_redis_cache("graph_" + str(graph_id))
            except Exception as e:
                print(e)

            # delete mysql data
            ret = graph_dao.deleteGraphByIds(graph_ids)
            if ret == "success":
                mess = "success delete graphids: %s ;" % ", ".join(map(str, graph_ids))

                return mess, 0
        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            return {"cause": err,
                    "code": CommonResponseStatus.REQUEST_ERROR.value,
                    "message": _l("delete fail "), "solution": "Please check mariadb"}, -1

    # 根据graph_id查找该图谱下的数据源列表
    def getDsByGraphid(self, graphid):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ids = []
        try:
            res = graph_dao.getDsById([graphid])
            Logger.log_info(res)
            ds_ids = res[0]["graph_ds"]
            ids.extend(eval(ds_ids))
            obj["ids"] = ids

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = _l("get %s fail") % graphid
                
        return ret_code, obj

    # 获取数据源信息
    def getDsAll(self, args):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            graph_id = args.get("graphid")
            page = args.get("page")
            dsids = args.get("dsids")
            size = args.get("size")
            order = args.get("order")
            knw_id = knw_dao.get_knw_id_by_graph_id(graph_id)
            res = {}
            rec_dict = dsm_dao.getall(int(page) - 1, int(size), order, dsids, knw_id, None, None)
            count = dsm_dao.getCountByKnwId(dsids, knw_id, None, None)
            if page == "-1":
                for i in range(len(rec_dict)):
                    if "sort" in rec_dict[i]:
                        rec_dict[i].pop("sort")
                count = len(rec_dict)
            res["count"] = count
            res["df"] = rec_dict

            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err \
                    or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = _l("insert connection fail")
        return ret_code, obj

    # 该图谱id是否存在
    def checkById(self, graph_id):
        obj = {}
        try:
            ret = graph_dao.getbyid(graph_id)
            if len(ret) == 0:
                obj["cause"] = _l("graph_id  %s not exist!") % graph_id
                obj["code"] = CommonResponseStatus.KGID_NOT_EXIST.value
                obj["message"] = _l("graph_id error")

                return -1, obj
            else:

                return 0, {}
        except Exception as e:
            error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj["cause"] = _l("get graph error: mysql connect error")
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            obj["message"] = _l("error")

            return -1, obj


    # 根据数据源id，查询起对应数据源类型
    def get_ds_source_by_id(self, ds_ids):
        obj = {}
        try:
            res = graph_dao.get_data_sourcebyids(ds_ids)

            return 0, res
        except Exception as e:
            error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj["cause"] = repr(e)
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            obj["message"] = "error"

            return -1, obj

    def get_DataSourceById(self, graph_id):
        """ 根据图谱id返回抽取的文件中是否是rabbitmq的数据源
        Returns:
            0: 是rabbitmq，-1:不是rabbitmq
        """
        obj = {}
        try:
            data_sources = []
            res = graph_dao.getbyid(graph_id)
            graph_KMap = res[0].get("graph_KMap")
            if graph_KMap:
                graph_KMap = eval(graph_KMap)
                if graph_KMap == {}:
                    return -1, obj
                for file in graph_KMap.get('files'):
                    if file['data_source'] == 'rabbitmq':

                        return 0, obj

            return -1, obj
        except Exception as e:
            error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj["cause"] = repr(e)
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            obj["message"] = "error"

            return -1, obj

    # 根据数据源id，判断数据源类型是否为rabbitmq, 流程2使用
    def ds_is_rabbitmq(self, ds_ids):
        obj = {}
        try:
            ds_sources = []
            if ds_ids == []:
                return 0, obj
            res = graph_dao.get_data_sourcebyids(ds_ids)
            for line in res:
                ds_sources.append(line.get("data_source", ""))
            # 数据源是rabbitmq

            if ds_sources == ["rabbitmq"]:
                return 1, obj
            return 0, obj
        except Exception as e:
            error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj["cause"] = repr(e)
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            obj["message"] = "error"

            return -1, obj

    def get_graph_conf_list(self, configids):
        result = task_dao.get_graph_conf_list_by_configs(configids)
        for info in result:
            if info["status"] == "stop":
                info["status"] = "edit"
            
        return result

    # 统计是否存在上传中的id
    def get_upload_id(self, graphids):
        try:
            res = graph_dao.get_upload_id(graphids)

        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj = {"cause": err,
                   "code": CommonResponseStatus.REQUEST_ERROR.value,
                   "message": "mysql connection error",
                   "solution": "Please check mariadb"}

            return obj, -1
        return res, 0

    def graph_output(self, graph_id):
        """
        导出图谱
        :param graph_ids: 用户要导出的图谱
        :return: 文件路径
        """
        item = []
        # 根据图谱id，查看图谱配置表。
        config = graph_dao.getbyid(graph_id)
        if len(config) > 0:
            config = config[0]
        file_name = config["graph_name"]
        knw_id = config["knw_id"]
        knowledge_network = knw_dao.get_knw_by_id(knw_id)
        if len(knowledge_network) > 0:
            knowledge_network = knowledge_network[0]
            knowledge_network["intelligence_score"] = float(knowledge_network["intelligence_score"])

        # 查看本体表
        if len(config) > 0:
            ontology_id = config["graph_otl"]
        else:
            ontology_id = -1
        ontology = otl_dao.getbyid(ontology_id)
        if len(ontology) > 0:
            ontology = ontology[0]

        # 子图配置表
        subgraph_config = subgraph_dao.get_subgraph_config_by_graph_id(graph_id)

        # 数据源信息获取
        graph_KMap = eval(config["graph_KMap"])
        used_ds = set()
        for file in graph_KMap.get('files', []):
            used_ds.add(file["ds_id"])
        used_ds = list(used_ds)

        ds_infos = dsm_dao.getbyids(used_ds)
        ds_basic_infos = []
        for ds_info in ds_infos:
            ds_basic_info = {}
            ds_basic_info["id"] = ds_info["id"]
            ds_basic_info["dsname"] = ds_info["dsname"]
            ds_basic_info["ds_path"] = ds_info["ds_path"]
            ds_basic_info["dataType"] = ds_info["dataType"]
            ds_basic_info["data_source"] = ds_info["data_source"]
            ds_basic_infos.append(ds_basic_info)

        # 图谱配置信息中使用的数据源列表，修改成抽取规则中确定使用到的数据源
        config["graph_ds"] = str(used_ds)

        item.append(
            {"knowledge_network": knowledge_network, "config": config, "ds_basic_infos": ds_basic_infos,
             "ontology": ontology, "subgraph_config": subgraph_config,
             "version": ""})

        # 此处使用uuid进行处理即可，或者考虑添加其他时间标识。
        file_path = '/tmp/'
        if os.name == 'nt':
            file_path = 'C:/Users/Public/Downloads/'
        file_name: str
        # if not file_name.startswith('图谱_'):
        #     file_name = "图谱_" + file_name # 添加前缀防止与本体json混淆
        file_name = "{0}.json".format(file_name)
        file_handler = open(file=file_path + file_name, mode="w", encoding='utf-8')
        json.dump(item, file_handler)
            
        return file_path, file_name

    def graph_input(self, user_id, roles, knw_id, file_path, ds_id_map, rename, graph_id):
        """
        同步数据
        :param userId: 用户唯一标识
        :param knw_id: 知识网络id,如果不为None则为前端调用，将图谱导入指定的知识网络，如果为None为上传内部调用，按照唯一标识判断
        :param graph_id: 知识图谱id
        :param file_path: 文件路径
        :param ds_id_map: 新老数据源ID映射表
        :param rename: 导入图谱重命名
        :param graph_id: 覆盖导入图谱，被覆盖的图谱id
        :return:
        """
        if graph_id:
            # 如果是覆盖导入
            # 判断图谱是否存在
            table_graph_config = graph_dao.getbyid(graph_id)
            if len(table_graph_config) == 0:
                code = codes.Builder_GraphService_GraphInput_GraphIdNotExist
                return Gview2.TErrorreturn(code, graphid=graph_id), 500
            table_graph_config = table_graph_config[0]
            if str(table_graph_config['knw_id']) != str(knw_id):
                code = codes.Builder_GraphService_GraphInput_GraphNotExistInKnw
                return Gview2.TErrorreturn(code), 500
            otl_id = table_graph_config['graph_otl']

        # 获取数据源映射表中所有本机数据源信息
        new_dss = set()
        for key, v in ds_id_map.items():
            new_dss.add(v)
        new_dss = list(new_dss)

        ds_types = {}
        if len(new_dss) != 0:
            ds_infos = dsm_dao.getbyids(new_dss)
            ds_types = {ds_info['id']: ds_info["data_source"] for ds_info in ds_infos}

        time_now = arrow.now().format('YYYY-MM-DD HH:mm:ss')

        with open(file_path, 'r', encoding='utf-8') as file_input_handler:
            # 此处处理结果是数据，需要根据唯一不变的名称进行遍历。
            try:
                datas = json.load(file_input_handler)
            except Exception as e:
                return Gview.TErrorreturn(
                    "Builder.controller.graph_service.load_data_error.not_json_structed",
                    _l("not a json structed"),
                    _l("check the file"),
                    e.__str__(), ""), 500

            Logger.log_info("解析出来的数据为：{}".format(datas))

            graph_ids = []

        # config代表graph_config_table这张表，search_graph代表knowledge_graph表，
        # ontology这张表代表本体这张表，search_config代表search_config这张表
        # 考虑到代码提交的可观测性，for循环暂不删除
        if not isinstance(datas, list):
            return Gview.TErrorreturn(
                "Builder.controller.graph_service.get_value_error.json_info_error",
                _l("content error in json file"),
                _l("Please check your parameter again."),
                _l("content error in json file"), ""), 500
        if len(datas) <= 0 or "version" not in datas[0].keys():
            return Gview.TErrorreturn(
                "Builder.controller.graph_service.graph_input.versionNotFound",
                _l("can not find version in json file"),
                _l("Please check your parameter again."),
                _l("can not find version in json file"), ""), 500
        Logger.log_info("升级后的数据为：{}".format(datas))
        for data in datas:
            try:
                graph_config = data["config"]
                ontology = data["ontology"]
            except Exception as e:
                return Gview.TErrorreturn(
                    "Builder.controller.graph_service.get_value_error.json_info_error",
                    _l("content error in json file"),
                    _l("Please check your parameter again."),
                    _l("content error in json file"), ""), 500

            # 处理数据源映射
            graph_KMap = eval(graph_config['graph_KMap'])
            new_files = []
            entity_types = []
            if len(ds_id_map) != 0:
                # 修改数据源ID
                old_dss = eval(graph_config["graph_ds"])
                new_dss = set()
                for ds_id in old_dss:
                    ds_id_str = str(ds_id)
                    # 旧数据源没有映射到新数据源
                    if ds_id_str not in ds_id_map:
                        continue
                    new_ds_id = ds_id_map[ds_id_str]
                    new_dss.add(new_ds_id)
                graph_config["graph_ds"] = str(list(new_dss))

                # 修改抽取规则中数据源ID、数据源类型
                for file in graph_KMap.get('files', []):
                    ds_id_str = str(file["ds_id"])
                    # 旧数据源没有映射到新数据源
                    if ds_id_str not in ds_id_map:
                        continue
                    new_ds_id = ds_id_map[ds_id_str]
                    new_ds_info = dsm_dao.getdatabyid(new_ds_id)[0]
                    file["ds_path"] = new_ds_info["ds_path"]
                    file["ds_id"] = new_ds_id
                    file["data_source"] = ds_types[new_ds_id]
                    for a_file in file['files']:
                        a_file["file_path"] = new_ds_info["ds_path"]
                    for extract_rule in file['extract_rules']:
                        entity_types.append(extract_rule['entity_type'])
                    new_files.append(file)
                graph_KMap["files"] = new_files
            else:
                graph_config["graph_ds"] = "[]"
                graph_KMap["files"] = []
                graph_config["step_num"] = 3

            for entity in graph_KMap.get('entity', []):
                if entity['entity_type'] not in entity_types:
                    entity['entity_type'] = ''
                    for prop in entity['property_map']:
                        prop['entity_prop'] = ''

            for edge in graph_KMap.get('edge', []):
                if edge['entity_type'] not in entity_types:
                    edge['entity_type'] = ''
                    for prop in edge['property_map']:
                        prop['entity_prop'] = ''
            graph_config["graph_KMap"] = str(graph_KMap)

            # 处理子图配置表
            default_subgraph_config = [
                {'name': 'ungrouped', 'entity': ontology['entity'], 'edge': ontology['edge']}]
            subgraph_config = data.get("subgraph_config", default_subgraph_config)
            for subgraph in subgraph_config:
                subgraph["create_time"] = time_now
                subgraph["update_time"] = time_now

            if graph_id:
                # 覆盖导入
                # 处理graph_config_table的数据结构
                graph_config['id'] = table_graph_config['id']
                graph_config["update_user"] = user_id
                graph_config["update_time"] = time_now
                graph_config["is_upload"] = 1
                if graph_config["graph_ds"] == "[]":
                    graph_config['graph_ds'] = table_graph_config['graph_ds']
                graph_config['step_num'] = max(graph_config['step_num'], table_graph_config['step_num'])

                # 处理本体结构
                ontology['id'] = otl_id
                ontology["update_user"] = user_id
                ontology["update_time"] = time_now

                # 处理子图配置表
                graph_dao.input_data_cover(graph_config, ontology, subgraph_config)
                graph_ids.append(table_graph_config['id'])
            else:
                # 新增导入
                # 处理本体结构
                ontology["create_user"] = user_id
                ontology["create_time"] = time_now
                ontology["update_user"] = user_id
                ontology["update_time"] = time_now
                # 循环处理，直到名称非重复。
                ontology_name = ontology["ontology_name"]
                number = 1
                while otl_dao.check_ontology_by_name(ontology_name, knw_id):
                    ontology_name = ontology["ontology_name"] + "_{0}".format(number)
                    number = number + 1
                ontology["ontology_name"] = ontology_name

                # 处理graph_config_table的数据结构
                graph_config["create_user"] = user_id
                graph_config["create_time"] = time_now
                graph_config["update_user"] = user_id
                graph_config["update_time"] = time_now
                graph_config["is_upload"] = 1
                graph_config_name_temp = rename if rename else graph_config["graph_name"]
                graph_config_name = graph_config_name_temp
                # 如果名称重复，在后面拼接递增数字
                number = 1
                while graph_dao.check_by_name(graph_config_name, knw_id):
                    graph_config_name = graph_config_name_temp + "_{0}".format(number)
                    number = number + 1
                if len(graph_config_name) > 50:
                    return Gview.TErrorreturn(
                        "Builder.controller.graph_service.get_value_error.name_length_error",
                        _l("graph_Name length cannot exceed 50"),
                        _l("Please check your parameter again."),
                        _l("graph_Name length cannot exceed 50"), ""), 500
                graph_config["graph_name"] = graph_config_name
                # 更换graph_db信息
                KDB_name = "u{}".format(str(uuid_obj.uuid1()).replace('-', ''))
                base_info = eval(graph_config["graph_baseInfo"])
                base_info["graphDBAddress"] = GetGraphDbOsInfo.graphdb_host
                base_info["graph_Name"] = graph_config_name
                base_info["graph_DBName"] = KDB_name
                base_info = str(base_info)
                graph_config["graph_baseInfo"] = base_info
                graph_config["KDB_name"] = KDB_name

                graph_config["is_upload"] = 1
                graph_config["graph_update_time"] = time_now
                graph_config["status"] = "edit"

                new_ids = graph_dao.input_data(graph_config, ontology, subgraph_config, knw_id)


        return graph_ids, 200

    def get_graph_info_basic(self, graph_id, is_all, key, userId):
        '''
        获取图谱信息
        Args:
            graph_id: 图谱id
            is_all: True：全部返回，忽略key值； False：返回key指定的字段
            key: 字符串列表,可选值:
                "graph_des": 图谱描述
                "create_email": 创建人邮箱
                "create_user" 创建人
                "create_time" 创建时间
                "update_email" 最终操作人邮箱
                "update_time" 最终操作时间
                "update_user" 最终操作用户
                "export" 是否可以导出
                "is_import" 是外部导入的图谱还是手动创建
                "knowledge_type" 知识类型
                "property_id" 用户权限
                "status" 状态
                "task_status" 任务运行状态
                "step_num" 图谱配置流程进行到了第几步
                "ds": 使用过的数据源id
                “otl”: 本体id
                "kmap": 映射规则信息
                "mongo_name": MongoDB表名
                "graphdb_name": 图数据库名
                "graphdb_dbname": 图数据库DB名
                "graphdb_type": 图数据库类型
                "graphdb_address": 图数据库地址
                "graphdb_id": 图数据库id 
        Returns:
            默认返回id、confid、name
        '''
        code = codes.successCode
        res_info = {}
        # knowledge_graph信息
        kg_info = graph_dao.get_knowledge_graph_by_id(graph_id)
        if len(kg_info) == 0:
            code = codes.Builder_GraphService_GetGraphInfoBasic_GraphidNotExist

            data = Gview2.TErrorreturn(code,
                                       graphid=graph_id)
            return code, data
        res_info['id'] = int(kg_info[0]['id'])
        res_info['name'] = kg_info[0]['graph_name']
        if not is_all and not key:

            return code, Gview2.json_return(res_info)
        res_info['status'] = kg_info[0]['status']
        # graph_task_table信息
        task_info = graph_dao.getStatusById([graph_id])
        task_status = None
        if len(task_info) != 0:
            task_status = task_info[0]['task_status']
        res_info['task_status'] = task_status
        # graph_config_table信息
        config_info = graph_dao.getbyid(graph_id)[0]
        graph_baseInfo = eval(config_info['graph_baseInfo'])
        res_info['graph_des'] = graph_baseInfo['graph_des']
        res_info['graphdb_address'] = graph_baseInfo['graphDBAddress']
        res_info['mongo_name'] = graph_baseInfo['graph_mongo_Name']
        res_info['graphdb_dbname'] = graph_baseInfo['graph_DBName']
        res_info['create_time'] = config_info['create_time']
        res_info['update_time'] = config_info['update_time']
        res_info['step_num'] = int(config_info['step_num'])
        res_info['ds'] = config_info['graph_ds']
        res_info['otl'] = config_info['graph_otl']
        res_info['kmap'] = config_info['graph_KMap']
        if res_info["task_status"] == "failed":
            payload = {
                "graph_id": str(graph_id),
                "page": "1",
                "size": "1",
                "order": "desc",
                "rule": "start_time",
                "graph_name": "",
                "status": "failed",
                "task_type": "all",
                "trigger_type": "all"
            }
            url = "http://localhost:6485/buildertask"
            # url = "http://10.4.37.76:6485/buildertask"  # for debug
            headers = {'Accept-Language': request.headers.get('Accept-Language'),
                       'userId': request.headers.get("userId")}
            response = requests.request("GET", url, params=payload, headers=headers)
            if response.status_code != 200:
                message = 'call to {} failed: {}'.format(url, response.json())
                error_log = log_oper.get_error_log(message,
                                                   sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                code = codes.Builder_GraphController_GetGraphInfoBasic_UnknownError

                return Gview2.TErrorreturn(code,
                                           cause=message,
                                           description=message), 500
            res_info["error_result"] = response.json()["res"]["df"][0]["error_report"]
        else:
            res_info["error_result"] = {}
        if is_all or ('create_user' in key):
            create_user_uuid = kg_info[0]['create_user']
            # account_info = graph_dao.get_account_by_uuid(create_user_uuid)
            # if len(account_info) > 0:
            #     res_info['create_user'] = account_info[0]['username']
        if is_all or ('update_user' in key):
            update_user_uuid = kg_info[0]['update_user']
            # account_info = graph_dao.get_account_by_uuid(update_user_uuid)
            # if len(account_info) > 0:
            #     res_info['update_user'] = account_info[0]['username']
        is_upload = config_info['is_upload']  # 表示图谱是否是上传而来
        res_info['is_import'] = True if is_upload else False
        if is_all or ('graphdb_type' in key or 'export' in key or 'graphdb_name' in key):
            res_info['graphdb_type'] = GetGraphDbOsInfo.graphdb_type
            if is_all or 'export' in key:
                if task_status == 'normal':
                    res_info['export'] = True
                else:
                    res_info['export'] = False
        res_info['knowledge_type'] = 'kg'
        if is_all:

            return code, Gview2.json_return(res_info)
        res = {}
        res['id'] = res_info['id']
        res['name'] = res_info['name']
        for key_item in key:
            unsupported_key = []
            if key_item not in res_info:
                unsupported_key.append(key_item)
            else:
                res[key_item] = res_info[key_item]
            if len(unsupported_key) != 0:
                code = codes.Builder_GraphService_GetGraphInfoBasic_UnsupportedKeyExist

                data = Gview2.TErrorreturn(code,
                                           unsupported_key=', '.join(unsupported_key))
                return code, data
            
        return code, Gview2.json_return(res)

    def get_graph_info_onto(self, graph_id, compensation_cache=False):
        ret = graph_dao.getbyid(graph_id)
        if len(ret) == 0:
            code = codes.Builder_GraphService_GetGraphInfoOnto_GraphidNotExist

            data = Gview2.TErrorreturn(code,
                                       graphid=graph_id)
            return code, data
        otl_id = ret[0]['graph_otl']
        ret = otl_dao.getbyid(otl_id)
        if len(ret) == 0:
            code = codes.Builder_GraphService_GetGraphInfoOnto_OtlidNotExist

            data = Gview2.TErrorreturn(code, otl_id=otl_id)
            return code, data
        ret = ret[0]
        entitys = eval(ret['entity'])
        edges = eval(ret['edge'])
        res = {'entity': [], 'edge': []}
        for e in entitys:
            old_properties = e['properties']
            new_properties = []
            for prop in old_properties:
                p = dict()
                p['name'] = prop['name']
                p['type'] = prop['data_type']
                p['alias'] = prop['alias']
                new_properties.append(p)
            entity = {}
            entity['properties'] = new_properties
            entity['name'] = e['name']
            entity['alias'] = e['alias']
            entity['entity_id'] = e['entity_id']
            entity['x'] = e.get('x', None)
            entity['y'] = e.get('y', None)
            entity['default_tag'] = e.get('default_tag', '')
            entity['icon'] = e.get('icon', "")
            entity['shape'] = e.get('shape')
            entity['size'] = e.get('size')
            entity['color'] = e.get('fill_color')
            entity['fill_color'] = e.get('fill_color')
            entity['stroke_color'] = e.get('stroke_color')
            entity['text_position'] = e.get('text_position')
            entity['icon_color'] = e.get('icon_color')
            entity['text_width'] = e.get('text_width')
            entity['text_color'] = e.get('text_color')
            entity['text_type'] = e.get('text_type')
            res['entity'].append(entity)
        for e in edges:
            old_properties = e['properties']
            new_properties = []
            for prop in old_properties:
                p = dict()
                p['name'] = prop['name']
                p['type'] = prop['data_type']
                p['alias'] = prop['alias']
                new_properties.append(p)
            edge = {}
            edge['properties'] = new_properties
            edge['name'] = e['name']
            edge['alias'] = e['alias']
            edge['color'] = e['colour']
            edge['edge_id'] = e['edge_id']
            edge['relation'] = e['relations']
            edge['shape'] = e['shape']
            edge['width'] = e.get('width')
            res['edge'].append(edge)
        res['dbname'] = graph_dao.getKDBnameByIds([graph_id])[0]
        if compensation_cache == True:
            content = {}
            content["dbname"] = res['dbname']
            content["edge"] = edges
            content["entity"] = entitys
            code = graph_dao.refresh_redis_cache(graph_id, content)
        code = codes.successCode
            
        return code, Gview2.json_return(res)

    def get_graph_info_count(self, graph_id):
        ret = graph_dao.getbyid(graph_id)
        if len(ret) == 0:
            code = codes.Builder_GraphService_GetGraphInfoCount_GraphidNotExist
            data = Gview2.TErrorreturn(code,
                                       graphid=graph_id)

            return code, data
        graph_baseInfo = eval(ret[0]['graph_baseInfo'])
        dbname = graph_baseInfo['graph_DBName']
        graphdb = GraphDB()
        code, count_res = graphdb.count(dbname)
        if code != codes.successCode:
            if code == codes.Builder_GraphdbDao_Count_GraphDBConnectionError:
                count_res = Gview2.TErrorreturn(code,
                                          cause='{} connection error'.format(dbname),
                                          description='{} connection error'.format(dbname))
            elif code == codes.Builder_GraphdbDao_Count_DBNameNotExitsError:
                count_res = Gview2.TErrorreturn(code,
                                          db_name=dbname,
                                          graphdb_address=graphdb.address,
                                          graphdb_port=graphdb.port,
                                          graphdb_type=graphdb.type)
            elif code == codes.Builder_GraphdbDao_CountOrientdb_OrientdbRequestError:
                count_res = Gview2.TErrorreturn(code,
                                          cause=count_res['cause'],
                                          description=count_res['description'])
            elif code == codes.Builder_GraphdbDao_CountNebula_NebulaExecError:
                count_res = Gview2.TErrorreturn(code,
                                          cause=count_res['cause'],
                                          description=count_res['description'])

            return code, count_res
        edge_count, entity_count, _, entitys_count, edges_count, edge_prop_info, entity_prop_info = count_res
        res = {}
        res['entity_count'] = entity_count
        res['edge_count'] = edge_count
        res['entity'] = []
        res['edge'] = []
        for k, v in entitys_count.items():
            entity = {}
            entity['name'] = k
            entity['count'] = v
            entity['prop_number'] = entity_prop_info.get(k, 0)
            res['entity'].append(entity)
        for k, v in edges_count.items():
            edge = {}
            edge['name'] = k
            edge['count'] = v
            edge['prop_number'] = edge_prop_info.get(k, 0)
            res['edge'].append(edge)
            
        return codes.successCode, Gview2.json_return(res)

    def get_graph_info_detail(self, graph_id, type, name):
        res = {'properties': [], 'indexes': []}
        ret = graph_dao.getbyid(graph_id)
        if len(ret) == 0:
            code = codes.Builder_GraphService_GetGraphInfoDetail_GraphidNotExist
            data = Gview2.TErrorreturn(code, graphid=graph_id)

            return code, data
        alias_dict = {}
        graph_baseInfo = eval(ret[0]['graph_baseInfo'])
        graph_otl = ret[0]['graph_otl']
        otl = otl_dao.getbyids([graph_otl])[0]
        type_info = eval(otl[type])
        for info in type_info:
            if info['name'] == name:
                properties = info['properties']
                for prop in properties:
                    alias_dict[prop['name']] = prop['alias']
        db = graph_baseInfo['graph_DBName']
        graphdb = GraphDB()
        # 校验是否存在对应name的点或边
        code, schema_res = graphdb.check_schema(db, name, [], type)
        if code != 200:

            return code, schema_res
        if not schema_res:
            code = codes.Builder_GraphService_GetGraphInfoDetail_NameNotExist

            return code, Gview2.TErrorreturn(code,
                                             class_type=type,
                                             name=name)
        # 获取属性
        code, properties = graphdb.get_properties(db, type, name)
        if code != 200:

            code = codes.Builder_GraphdbDao_GetPropertiesNebula_NebulaExecError
            return code, Gview2.TErrorreturn(code,
                                             description=properties,
                                             cause='get properties of {} {} failed'.format(type, name))
        for k, v in properties.items():
            p = {}
            p['name'] = k
            p['type'] = v
            p['alias'] = alias_dict.get(k, k)
            res['properties'].append(p)
        # 获取索引
        _, res_index = graphdb.get_present_index(db)
        present_index_field, present_index_name, present_index_field_unique, present_index_name_unique = res_index
        if name in present_index_field:
            index = {}
            index['name'] = present_index_name[name]
            index['type'] = 'FULLTEXT'
            index['properties'] = [{'name': field,
                                    'alias': alias_dict.get(field, field)} for field in present_index_field[name]]
            res['indexes'].append(index)
        if name in present_index_field_unique:
            index = {}
            index['name'] = present_index_name_unique[name]
            if graphdb.type == 'nebulaGraph':
                index['type'] = 'NEBULA_NATIVE_INDEX'
            elif graphdb.type == 'orientDB':
                index['type'] = 'UNIQUE_HASH_INDEX'
            index['properties'] = [{'name': field,
                                    'alias': alias_dict.get(field, field)} for field in
                                   present_index_field_unique[name]]
            res['indexes'].append(index)
            
        return code, Gview2.json_return(res)


    def check_kmap_otl_consistence(self, graph_KMap, graph_id):
        """
        校验前端传参的graph_KMap的entity和edge的信息和本体是否一致。
        1. 校验entity名称、edge关系、属性
        2. 检测必配属性是否有配置（融合属性、唯一标识属性）
        Args:
            params_json: 前端传参的graph_KMap值
            graph_id: 图谱id
        Returns:
            code: 0: VALID; -1: INVALID
            message: 报错信息
        """
        VALID, INVALID = 0, -1
        ret = graph_dao.getbyid(graph_id)
        graph_otl = ret[0]['graph_otl']
        otl = otl_dao.getbyids([graph_otl])[0]
        # 获取本体信息
        # entity_dict: {实体类名: 属性名集合}
        entity_prop_dict = {}
        # entity_necessary_prop_dict: {实体类名: 融合属性和唯一显示属性组成的集合}
        entity_necessary_prop_dict = {}
        for entity in eval(otl['entity']):
            entity_prop_dict[entity['name']] = set()
            for prop in entity['properties']:
                entity_prop_dict[entity['name']].add(prop['name'])
            entity_necessary_prop_dict[entity['name']] = set()
            entity_necessary_prop_dict[entity['name']].update(entity['primary_key'])
            entity_necessary_prop_dict[entity['name']].add(entity['default_tag'])
        # edge_prop_dict: {关系三元组: 属性名集合}
        edge_prop_dict = {}
        # edge_necessary_prop_dict: {关系三元组: 唯一显示属性组成的集合}
        edge_necessary_prop_dict = {}
        for edge in eval(otl['edge']):
            edge_prop_dict[str(edge['relations'])] = set()
            for prop in edge['properties']:
                edge_prop_dict[str(edge['relations'])].add(prop['name'])
            edge_necessary_prop_dict[str(edge['relations'])] = set()
            if 'default_tag' in edge and edge['default_tag']:
                edge_necessary_prop_dict[str(edge['relations'])].add(edge['default_tag'])
        # 校验graph_KMap传参是否符合规则
        entity_name_list = []
        for entity in graph_KMap['entity']:
            # 这里校验graph_KMap的entity比本体多的情况
            if entity['name'] not in entity_prop_dict:
                message = _l('entity name "{}" does not consistent with ontology. ').format(entity['name'])
                return INVALID, message
            entity_name_list.append(entity['name'])
            otl_props = [item['otl_prop'] for item in entity['property_map']]
            if set(otl_props) != entity_prop_dict[entity['name']]:
                message = _l('property of entity class "{}" does not consistent with ontology. ').format(entity['name'])
                return INVALID, message
            for prop_map in entity['property_map']:
                if entity['entity_type'] and prop_map['otl_prop'] in entity_necessary_prop_dict[entity['name']]:
                    if not prop_map['entity_prop']:
                        message = _l(
                            'otl_prop "{otl_prop}" of entity class "{entity_name}" must config property mapping. ') \
                            .format(otl_prop=prop_map['otl_prop'], entity_name=entity['name'])
                        return INVALID, message
        # 有可能graph_KMap的entity比本体少
        if set(entity_name_list) != set(entity_prop_dict.keys()):
            message = _l('missing entity {}').format(set(entity_prop_dict.keys()) - set(entity_name_list))
            return INVALID, message
        relations_list = []
        for edge in graph_KMap['edge']:
            # 这里校验graph_KMap的edge比本体多的情况
            if str(edge['relations']) not in edge_prop_dict:
                message = _l('edge relation "{}" does not consistent with ontology. ').format(str(edge['relations']))
                return INVALID, message
            relations_list.append(str(edge['relations']))
            edge_props = [item['edge_prop'] for item in edge['property_map']]
            if set(edge_props) != edge_prop_dict[str(edge['relations'])]:
                message = _l('property of edge relation "{}" does not consistent with ontology. ') \
                    .format(str(edge['relations']))
                return INVALID, message
            for prop_map in edge['property_map']:
                if edge['entity_type'] and prop_map['edge_prop'] in edge_necessary_prop_dict[str(edge['relations'])]:
                    if not prop_map['entity_prop']:
                        message = _l(
                            'edge_prop "{edge_prop}" of edge relation "{edge_relation}" must config property mapping. ') \
                            .format(edge_prop=prop_map['edge_prop'], edge_relation=str(edge['relations']))
                        return INVALID, message
        if set(relations_list) != set(edge_prop_dict.keys()):
            message = _l('missing relation {}').format(set(edge_prop_dict.keys()) - set(relations_list))
            return INVALID, message
        return VALID, ''

    def create_graph_space(self, graph_id):
        KDB_name = graph_dao.getKDBnameByIds([graph_id])
        if len(KDB_name) == 0:
            code = codes.Builder_GraphService_CreateGraphSpace_GraphIdNotExist

            return 500, Gview2.error_return(code, graph_id=graph_id)
        KDB_name = KDB_name[0]
        # 正在运行中的图谱不允许创建图空间
        res = graph_dao.get_knowledge_graph_by_id(graph_id)
        if res[0]['status'] in ['waiting', 'running']:
            code = codes.Builder_GraphService_CreateGraphSpace_GraphRunning

            return 500, Gview2.error_return(code)
        graphdb = GraphDB()
        code, databaselist = graphdb.get_list()
        if code != 200:
            code = codes.Builder_GraphService_CreateGraphSpace_NebulaError
            message = databaselist

            return 500, Gview2.error_return(code, message=message)
        if KDB_name not in databaselist:
            ngql = 'CREATE SPACE `{}` (partition_num = 30,replica_factor = 1,vid_type = FIXED_STRING(32))'.format(
                KDB_name)
            code, res = graphdb._nebula_exec(ngql=ngql)
            if code != 200:
                code = codes.Builder_GraphService_CreateGraphSpace_NebulaError
                message = 'create space failed. ' + res.error_msg()

                return 500, Gview2.error_return(code, message=message)

        return 200, Gview2.json_return('create space {} success'.format(KDB_name))

    def create_schema(self, graph_id):
        graph = graph_dao.getbyid(graph_id)
        if len(graph) == 0:
            code = codes.Builder_GraphService_CreateSchema_GraphIdNotExist

            return 500, Gview2.error_return(code, graph_id=graph_id)
        graph = graph[0]
        KDB_name = graph_dao.getKDBnameByIds([graph_id])
        if len(KDB_name) == 0:
            code = codes.Builder_GraphService_CreateGraphSpace_GraphIdNotExist

            return 500, Gview2.error_return(code, graph_id=graph_id)
        KDB_name = KDB_name[0]
        # 正在运行中的图谱不允许创建schema
        res = graph_dao.get_knowledge_graph_by_id(graph_id)
        if res[0]['status'] in ['waiting', 'running']:
            code = codes.Builder_GraphService_CreateSchema_GraphRunning

            return 500, Gview2.error_return(code)
        graphdb = GraphDB()
        # 校验图空间是否创建完毕
        code, res = graphdb._nebula_exec('', KDB_name)
        if code != 200 or (not res.is_succeeded() and 'SpaceNotFound' in res.error_msg()):
            code = codes.Builder_GraphService_CreateSchema_SpaceNotFound

            return 500, Gview2.error_return(code)
        # 授权给只读用户
        user_name = os.getenv('GRAPHDB_READ_ONLY_USER')
        code, res = graphdb._nebula_exec('show users')
        if code != 200 or not res.is_succeeded():
            code = codes.Builder_GraphService_CreateSchema_NebulaError
            message = 'show users failed. ' + res.error_msg()

            return 500, Gview2.error_return(code, message=message)
        name_exist = False
        for i in range(res.row_size()):
            if res.row_values(i)[0].as_string() == user_name:
                name_exist = True
                break
        if not name_exist:
            code = codes.Builder_GraphService_CreateSchema_NebulaError
            message = 'grant role guest on {} to user {} failed. \n' \
                      'nebula does not have user {}'.format(KDB_name, user_name, user_name)

            return 500, Gview2.error_return(code, message=message)
        code, res = graphdb._nebula_exec('GRANT ROLE GUEST ON `{}` TO {}'.format(KDB_name, user_name))
        if code != 200 or not res.is_succeeded():
            code = codes.Builder_GraphService_CreateSchema_NebulaError
            message = 'grant role guest on {} to user {} failed. \n'.format(KDB_name, user_name,
                                                                            user_name) + res.error_msg()

            return 500, Gview2.error_return(code, message=message)
        # 创建schema
        otl = graph['graph_otl']
        if not otl:
            code = codes.Builder_GraphService_CreateSchema_OtlNotExist

            return 500, Gview2.error_return(code)
        otl = otl_dao.getbyids([otl])
        if not otl:
            code = codes.Builder_GraphService_CreateSchema_OtlNotExist

            return 500, Gview2.error_return(code)

        entities = eval(otl[0]['entity'])
        edges = eval(otl[0]['edge'])
        if len(entities) == 0:
            code = codes.Builder_GraphService_CreateSchema_OtlNotExist

            return 500, Gview2.error_return(code)
        # 创建点类
        tag_class_start = time.time()
        Logger.log_info("开始创建点类")
        for entity in entities:
            # pro_dict: {属性名：属性类型}
            pro_dict = {prop['name']: prop['data_type'] for prop in entity['properties']}
            Logger.log_info(f'开始创建顶点:{entity["name"]}')
            code, res = graphdb.create_class(KDB_name, entity["name"], pro_dict, True)
            if code != 200:
                code = codes.Builder_GraphService_CreateSchema_NebulaError
                message = 'create entity class failed. ' + str(graphdb.state)

                return 500, Gview2.error_return(code, message=message)
            # 可能重新创建点类后索引发生了变化，所以需要重新获取
            code, res = graphdb.get_present_index(KDB_name)
            if code != 200:
                code = codes.Builder_GraphService_CreateSchema_NebulaError
                message = 'get index failed. ' + str(graphdb.state)

                return 500, Gview2.error_return(code, message=message)
            present_index_field, present_index_name, present_index_field_unique, present_index_name_unique = res
            # 创建全文索引
            code, res = graphdb.create_full_index(entity["name"], entity['properties_index'], present_index_name,
                                                  KDB_name)
            if code != 200:
                code = codes.Builder_GraphService_CreateSchema_OpensearchError
                message = 'create entity fulltext index failed. ' + str(res)

                return 500, Gview2.error_return(code, message=message)
            # 创建唯一索引
            graphdb.create_uni_index(entity["name"], entity['primary_key'], present_index_name_unique, KDB_name,
                                     pro_dict)
        Logger.log_info('创建点类结束，耗时{}s'.format(time.time() - tag_class_start))
        # 创建边类
        edge_class_start = time.time()
        Logger.log_info('开始创建边类')
        for edge in edges:
            # edge_otl_pro: 边的属性列表
            edge_otl_pro = [prop['name'] for prop in edge['properties']]
            # edge_pro_dict: {边名：{属性名：属性类型}}
            edge_pro_dict = {edge["name"]: {prop['name']: prop['data_type'] for prop in edge['properties']}}
            Logger.log_info(f'开始创建边类:{edge["name"]}')
            code, res = graphdb.create_edge_class(edge["name"], edge_otl_pro, edge_pro_dict, KDB_name, True)
            if code != 200:
                code = codes.Builder_GraphService_CreateSchema_NebulaError
                message = 'create edge class failed. ' + str(graphdb.state)

                return 500, Gview2.error_return(code, message=message)
            # 可能重新创建边类后索引发生了变化，所以需要重新获取
            code, res = graphdb.get_present_index(KDB_name)
            if code != 200:
                code = codes.Builder_GraphService_CreateSchema_NebulaError
                message = 'get index failed. ' + str(graphdb.state)

                return 500, Gview2.error_return(code, message=message)
            present_index_field, present_index_name, present_index_field_unique, present_index_name_unique = res
            graphdb.create_edge_index(edge["name"], edge_otl_pro, present_index_name,
                                      present_index_field, {edge['name']: edge['properties_index']},
                                      edge_pro_dict, KDB_name)
        Logger.log_info('创建边类结束，耗时{}s'.format(time.time() - edge_class_start))
        # 创建schema结束后将图谱的状态标记为normal
        task_dao.upKgstatus(graph_id, 'normal')
        graph_dao.update_graph_status(graph_id)

        # 创建或更新redis缓存，若失败直接略过
        content = {}
        content["dbname"] = KDB_name
        content["edge"] = edges
        content["entity"] = entities
        code = graph_dao.refresh_redis_cache(graph_id, content)
        return 200, Gview2.json_return('{} create schema success'.format(KDB_name))

    def alter_graph_data(self, graph_id, name, action, data_type, graph_data):
        t1 = time.time()
        # 此处修改otl和KDB_name获取方式，因此处获取otl的目的是获取entity和edge，所以先去缓存查询是否有对应entity和edge
        code, cache = graph_dao.find_redis_graph_cache(graph_id)
        if code != 200:
            code = codes.Builder_GraphDao_FindRedisGraphCache_RedisReadError
            message = 'Redis cache read failed.'
            Logger.log_info(message)

            return 500, Gview2.error_return(code, message=message)
        cnt = 0  # 最大重试次数为3
        while cache == {} and cnt < 3:
            time.sleep(0.1)
            code, res = self.get_graph_info_onto(str(graph_id), True)
            if code != 'success':
                return code, res
            code, cache = graph_dao.find_redis_graph_cache(graph_id)
            if code != 200:
                code = codes.Builder_GraphDao_FindRedisGraphCache_RedisReadError
                message = 'Redis cache read failed.'
                Logger.log_info(message)

                return 500, Gview2.error_return(code, message=message)
            cnt += 1
        if cache == {} and cnt == 3:  # 超过最大重试次数仍读取为空，说明写入有异常
            code = codes.Builder_GraphDao_RefreshRedisCache_RedisWriteError
            message = 'Redis cache write failed.'

            return 500, Gview2.error_return(code, message=message)
        KDB_name = str(cache["dbname"])[1: -1]
        entities = cache["entity"]
        edges = cache["edge"]
        t2 = time.time()
        Logger.log_info(f"/data:get cache end,spend:{t2-t1}s")
        graphdb = GraphDB()
        # en_pro_dict: {实体名：{属性名：属性类型}}
        en_pro_dict = {}
        # edge_pro_dict: {边名：{属性名：属性类型}}
        edge_pro_dict = {}
        # pro_merge: {实体名: 融合属性列表}
        pro_merge = {}
        # pro_index: {实体名/边名: 需要创建全文索引的属性列表}
        pro_index = {}
        my_entity = {}
        for entity in entities:
            en_pro_dict[entity['name']] = {prop['name']: prop['data_type']
                                           for prop in entity['properties']}
            pro_merge[entity['name']] = entity['primary_key']
            pro_index[entity['name']] = entity['properties_index']
            if data_type == "entity" and entity["name"] == name:
                my_entity = entity
        for edge in edges:
            edge_pro_dict[edge['name']] = {prop['name']: prop['data_type']
                                           for prop in edge['properties']}
            pro_index[edge['name']] = edge['properties_index']
        # 实体类名/边名不存在
        if data_type == 'entity' and name not in en_pro_dict:
            code = codes.Builder_GraphService_AlterGraphData_NameNotExists

            return 500, Gview2.error_return(code, name='entity ' + name)
        if data_type == 'edge' and name not in edge_pro_dict:
            code = codes.Builder_GraphService_AlterGraphData_NameNotExists

            return 500, Gview2.error_return(code, name='edge ' + name)
        # 关系与本体不一致
        if data_type == 'edge':
            start_entity = graph_data[0]['start']['_start_entity']
            end_entity = graph_data[0]['end']['_end_entity']
            flag = False
            for edge in edges:
                if [start_entity, name, end_entity] == edge['relations']:
                    flag = True
                    break
            if not flag:
                code = codes.Builder_GraphService_AlterGraphData_RelationNotExists

                return 500, Gview2.error_return(code)
        t3 = time.time()
        if action == 'upsert':
            if data_type == 'entity':
                return self.insert_entity(KDB_name, name, graph_data, en_pro_dict[name],
                                          KDB_name + "_" + name, my_entity["properties_index"],
                                          graphdb, pro_merge)
            elif data_type == 'edge':
                return self.insert_edge(KDB_name, name, graph_data, edge_pro_dict[name],
                                        graphdb, pro_merge)
        elif action == 'update':
            if data_type == 'entity':
                return self.update_entity(KDB_name, name, graph_data, en_pro_dict[name],
                                          KDB_name + "_" + name, my_entity["properties_index"],
                                          graphdb, pro_merge)
            elif data_type == 'edge':
                return self.update_edge(KDB_name, name, graph_data, edge_pro_dict[name],
                                        graphdb, pro_merge)
        elif action == 'delete':
            if data_type == 'entity':
                return self.delete_entity(KDB_name, name, graph_data, KDB_name + "_" + name,
                                          graphdb, pro_merge)
            elif data_type == 'edge':
                return self.delete_edge(KDB_name, name, graph_data, graphdb, pro_merge)
            

    def get_md5(self, data):
        if isinstance(data, str):
            data = data.encode("utf-8")
        md = hashlib.md5()
        md.update(data)
        return md.hexdigest()

    def normalize_text(self, text):
        text = text.replace("\\", "\\\\")
        text = text.replace("\n", "\\n")
        text = text.replace("\t", "\\t")
        text = re.sub(r"[\"]", "\\\"", text)
        text = re.sub(r"[\']", "\\\'", text).strip()
        return text

    def type_transform(self, value, type):
        if type == "string":
            value = "'" + str(value) + "'"
        if type == "date":
            if '/' in value:
                value = value.replace('/', '-')
            value = ' date("{}") '.format(value)
        if type == "datetime":
            if '/' in value:
                value = value.replace('/', '-')
            value = ' datetime("{}") '.format(value)
        if type == 'boolean':
            if value.lower() not in ['true', 'false']:
                try:
                    value = str(bool(eval(value)))
                except Exception:
                    value = "NULL"
        return str(value)

    def insert_entity(self, db, name, graph_data, pro_dict, index_name, index_props, graphdb, pro_merge):
        '''
        向nebula中插入实体以及插入全文索引
        Args:
            db: nebula图空间名
            name: 实体名
            graph_data: 需要插入的数据，需要包含融合属性，结构：{属性名: 属性值}
            pro_dict: {实体类属性：属性类型}
            index_name: 全文索引名称
            index_props: 需插入全文索引的属性列表
            graphdb: 图数据库操作对象
            pro_merge: {实体名: 融合属性列表}

        Returns:
            code
            response
        '''
        # 构造ngql
        pros = list(map(lambda x: f'`{x}`', pro_dict.keys()))
        pros.extend(['`_ds_id_`', '`_timestamp_`'])
        ngql = 'INSERT VERTEX `{}` ({}) VALUES \n' \
            .format(name, ','.join(pros))
        ngql_values = []
        es_index = []
        # body_field: 构建全文索引的映射
        body_field = {}
        for data in graph_data:
            vid = name + '_'
            for pro in pro_merge[name]:
                if pro not in data:
                    code = codes.Builder_GraphService_AlterGraphData_MissingMergeProperty
                    err = _l('graph_data does not have merge property "{}": {}').format(pro, data)

                    return 500, Gview2.error_return(code, message=err)
                vid += "{}_".format(self.normalize_text(str(data[pro])))
            vid = self.get_md5(vid)

            values = []
            for pro in pro_dict:
                if pro not in data:
                    data_value = 'NULL'
                else:
                    data_value = self.type_transform(self.normalize_text(str(data[pro])),
                                                     pro_dict[pro])
                    if pro_dict[pro] in ['decimal', 'double', 'float', 'integer']:
                        if not isinstance(data[pro], (int, float)):
                            err = _l('data_type of graph_data "{}" is incorrect: {}').format(pro, data)
                            code = codes.Builder_GraphService_AlterGraphData_DataTypeError

                            return 500, Gview2.error_return(code, message=err)
                values.append(data_value)
            values.append("'api'")  # _ds_id_
            values.append(str(int(time.time())))  # _timestamp_
            for pro in index_props:
                if pro not in data:
                    data_value = ''
                else:
                    data_value = str(data[pro])
                body_field[pro] = data_value
            # 构造ngql
            ngql_values.append('"{}":({})'.format(vid, ','.join(values)))
            # 构造全文索引语句
            body_index = {"index": {"_index": index_name, "_id": vid}}
            es_index.append(json.dumps(body_index) + '\n' + json.dumps(body_field))
        ngql += ',\n'.join(ngql_values)

        # 执行插入
        graphdb.create_vertex(db, ngql, es_index)

        return 200, Gview2.json_return('success')

    def insert_edge(self, db, name, graph_data, pro_dict, graphdb, pro_merge):
        '''
        向nebula中插入边
        Args:
            db: nebula图空间名
            name: 边名
            graph_data: 需要插入的数据，结构：
                {'start': {起点融合属性: 起点融合属性值, '_start_entity': 起点类名},
                 'end': {终点融合属性:终点融合属性值, '_end_entity': 终点类名},
                 'edge_pros': {边的属性: 边的属性值}}
            pro_dict: {边类属性: 属性类型}
            graphdb: 图数据库操作对象
            pro_merge: {实体名: 融合属性列表}

        Returns:
            code
            response
        '''
        pros = list(map(lambda x: f'`{x}`', pro_dict.keys()))
        pros.append('`_timestamp_`')
        ngql = 'INSERT EDGE `{}` ({}) VALUES \n' \
            .format(name, ','.join(pros))
        ngql_values = []
        start_entity = graph_data[0]['start']['_start_entity']
        end_entity = graph_data[0]['end']['_end_entity']
        if start_entity not in pro_merge:
            code = codes.Builder_GraphService_AlterGraphData_NameNotExists

            return 500, Gview2.error_return(code, name='start entity ' + start_entity)
        if end_entity not in pro_merge:
            code = codes.Builder_GraphService_AlterGraphData_NameNotExists

            return 500, Gview2.error_return(code, name='end entity ' + end_entity)
        for data in graph_data:
            start_data = data['start']
            end_data = data['end']
            pro_data = data['edge_pros']
            # 构造起始点vid
            if '_vid' in start_data:
                start_vid = start_data['_vid']
            else:
                start_vid = start_entity + '_'
                for pro in pro_merge[start_entity]:
                    if pro not in start_data:
                        err = _l('graph_data start does not have _vid or merge property "{}": {}')\
                            .format(pro, start_data)
                        code = codes.Builder_GraphService_AlterGraphData_MissingMergeProperty

                        return 500, Gview2.error_return(code, message=err)
                    start_vid += "{}_".format(self.normalize_text(str(start_data[pro])))
                start_vid = self.get_md5(start_vid)
            # 构造终点vid
            if '_vid' in end_data:
                end_vid = end_data['_vid']
            else:
                end_vid = end_entity + '_'
                for pro in pro_merge[end_entity]:
                    if pro not in end_data:
                        err = _l('graph_data end does not have _vid or merge property "{}": {}')\
                            .format(pro, end_data)
                        code = codes.Builder_GraphService_AlterGraphData_MissingMergeProperty

                        return 500, Gview2.error_return(code, message=err)
                    end_vid += "{}_".format(self.normalize_text(str(end_data[pro])))
                end_vid = self.get_md5(end_vid)
            # 构造属性
            values = []
            for pro in pro_dict:
                if pro not in pro_data:
                    data_value = 'NULL'
                else:
                    data_value = self.type_transform(self.normalize_text(str(pro_data[pro])),
                                                     pro_dict[pro])
                    if pro_dict[pro] in ['decimal', 'double', 'float', 'integer']:
                        if not isinstance(pro_data[pro], (int, float)):
                            err = _l('data_type of graph_data edge_pros "{}" is incorrect: {}')\
                                .format(pro, pro_data)
                            code = codes.Builder_GraphService_AlterGraphData_DataTypeError

                            return 500, Gview2.error_return(code, message=err)
                values.append(data_value)
            values.append(str(int(time.time())))  # _timestamp_
            ngql_values.append('"{}" -> "{}" : ({})'
                               .format(start_vid, end_vid, ','.join(values)))
        ngql += ', \n'.join(ngql_values)
        t1 = time.time()
        code, res = graphdb.exec_batch(ngql, db)
        t2 = time.time()
        Logger.log_info(f"/data:edge insert nebula end,spend:{t2-t1}s")
        if code != 200:
            code = codes.Builder_GraphService_AlterGraphData_NebulaError
            message = 'insert edge failed. \n' + ngql + '\n' + res.error_msg()

            return 500, Gview2.error_return(code, message=message)

        return 200, Gview2.json_return('success')

    def update_entity(self, db, name, graph_data, pro_dict, index_name, index_props, graphdb, pro_merge):
        '''
        修改nebula中点的属性值以及修改全文索引
        Args:
            db: nebula图空间名
            name: 实体名
            graph_data: 需要插入的数据，需要包含融合属性，结构：{属性名: 属性值}
            pro_dict: {实体类属性：属性类型}
            index_name: 全文索引名称
            index_props: 需插入全文索引的属性列表
            graphdb: 图数据库操作对象
            pro_merge: {实体名: 融合属性列表}

        Returns:
            code
            response
        '''
        ngqls = []
        es_bulk_index = []
        for data in graph_data:
            # 构造vid
            vid = name + '_'
            for pro in pro_merge[name]:
                if pro not in data:
                    err = _l('graph_data does not have merge property "{}": {}').format(pro, data)
                    code = codes.Builder_GraphService_AlterGraphData_MissingMergeProperty

                    return 500, Gview2.error_return(code, message=err)
                vid += "{}_".format(self.normalize_text(str(data[pro])))
            vid = self.get_md5(vid)
            # 构造属性值
            update_prop = []
            # body_field: 全文索引请求体
            body_field = {}
            for pro in data.keys():
                if pro not in pro_dict:
                    err = _l('graph_data have property "{}" that do not exist in the ontology: {}').format(pro,
                                                                                                           data)
                    code = codes.Builder_GraphService_AlterGraphData_ExtraProperty

                    return 500, Gview2.error_return(code, message=err)
                if pro_dict[pro] in ['decimal', 'double', 'float', 'integer']:
                    if not isinstance(data[pro], (int, float)):
                        err = _l('data_type of graph_data "{}" is incorrect: {}').format(pro, data)
                        code = codes.Builder_GraphService_AlterGraphData_DataTypeError

                        return 500, Gview2.error_return(code, message=err)
                update_prop.append('`{}`={}'.format(pro,
                                                    self.type_transform(self.normalize_text(str(data[pro])),
                                                                        pro_dict[pro])))
                if pro in index_props:
                    body_field[pro] = str(data[pro])
            if len(update_prop) > 0:
                ngql = 'UPDATE VERTEX ON `{}` "{}" SET {};'.format(name, vid, ','.join(update_prop))
                ngqls.append(ngql)
            # 构造更新全文索引请求体
            body_index = {"update": {"_index": index_name, "_id": vid}}
            if len(body_field) > 0:
                es_bulk_index.append(json.dumps(body_index) + '\n' + json.dumps({'doc': body_field}))
        # 更新nebula
        if len(ngqls) > 0:
            code, res = graphdb.exec_batch('\n'.join(ngqls), db)
            if code != 200:
                code = codes.Builder_GraphService_AlterGraphData_NebulaError
                message = 'update entity failed. \n' + '\n'.join(ngqls) + '\n' + res.error_msg()

                return 500, Gview2.error_return(code, message=message)
        # 更新全文索引
        es_bulk_index_new = '\n'.join(es_bulk_index) + '\n'
        if len(es_bulk_index_new) > 92160:
            split_num = math.ceil(len(es_bulk_index_new) / 92160)
            res_data = [es_bulk_index[i::split_num] for i in range(split_num)]
            for es_data in res_data:
                es_bulk_index_data = '\n'.join(es_data) + '\n'
                graphdb.batch_process_vertex_index_not_catch_exp(es_bulk_index_data)
        else:
            graphdb.batch_process_vertex_index_not_catch_exp(es_bulk_index_new)

        return 200, Gview2.json_return('success')

    def update_edge(self, db, name, graph_data, pro_dict, graphdb, pro_merge):
        '''
        修改nebula中边的属性值
        Args:
            db: nebula图空间名
            name: 边名
            graph_data: 需要插入的数据，结构：
                {'start': {起点融合属性: 起点融合属性值, '_start_entity': 起点类名},
                 'end': {终点融合属性:终点融合属性值, '_end_entity': 终点类名},
                 'edge_pros': {边的属性: 边的属性值}}
            pro_dict: {边类属性: 属性类型}
            graphdb: 图数据库操作对象
            pro_merge: {实体名: 融合属性列表}

        Returns:
            code
            response
        '''
        ngqls = []
        start_entity = graph_data[0]['start']['_start_entity']
        end_entity = graph_data[0]['end']['_end_entity']
        if start_entity not in pro_merge:
            code = codes.Builder_GraphService_AlterGraphData_NameNotExists

            return 500, Gview2.error_return(code, name='start entity ' + start_entity)
        if end_entity not in pro_merge:
            code = codes.Builder_GraphService_AlterGraphData_NameNotExists

            return 500, Gview2.error_return(code, name='end entity ' + end_entity)
        for data in graph_data:
            start_data = data['start']
            end_data = data['end']
            pro_data = data['edge_pros']
            # 构造起始点vid
            if '_vid' in start_data:
                start_vid = start_data['_vid']
            else:
                start_vid = start_entity + '_'
                for pro in pro_merge[start_entity]:
                    if pro not in start_data:
                        err = _l('graph_data start does not have _vid or merge property "{}": {}')\
                            .format(pro, start_data)
                        code = codes.Builder_GraphService_AlterGraphData_MissingMergeProperty

                        return 500, Gview2.error_return(code, message=err)
                    start_vid += "{}_".format(self.normalize_text(str(start_data[pro])))
                start_vid = self.get_md5(start_vid)
            # 构造终点vid
            if '_vid' in end_data:
                end_vid = end_data['_vid']
            else:
                end_vid = end_entity + '_'
                for pro in pro_merge[end_entity]:
                    if pro not in end_data:
                        err = _l('graph_data end does not have _vid or merge property "{}": {}')\
                            .format(pro, end_data)
                        code = codes.Builder_GraphService_AlterGraphData_MissingMergeProperty

                        return 500, Gview2.error_return(code, message=err)
                    end_vid += "{}_".format(self.normalize_text(str(end_data[pro])))
                end_vid = self.get_md5(end_vid)
            # 构造属性
            update_prop = []
            for pro in pro_data.keys():
                if pro not in pro_dict:
                    err = _l('graph_data edge_pros have property "{}" that do not exist in the ontology: {}') \
                        .format(pro, pro_data)
                    code = codes.Builder_GraphService_AlterGraphData_ExtraProperty

                    return 500, Gview2.error_return(code, message=err)
                if pro_dict[pro] in ['decimal', 'double', 'float', 'integer']:
                    if not isinstance(pro_data[pro], (int, float)):
                        err = _l('data_type of graph_data "{}" is incorrect: {}').format(pro, pro_data)
                        code = codes.Builder_GraphService_AlterGraphData_DataTypeError

                        return 500, Gview2.error_return(code, message=err)
                update_prop.append('`{}`={}'.format(pro,
                                                    self.type_transform(self.normalize_text(str(pro_data[pro])),
                                                                        pro_dict[pro])))
            if len(update_prop) > 0:
                ngql = 'UPDATE EDGE ON `{}` "{}" -> "{}" SET {};' \
                    .format(name, start_vid, end_vid, ','.join(update_prop))
                ngqls.append(ngql)
        if len(ngqls) > 0:
            code, res = graphdb.exec_batch('\n'.join(ngqls), db)
            if code != 200:
                code = codes.Builder_GraphService_AlterGraphData_NebulaError
                message = 'update edge failed. \n' + '\n'.join(ngqls) + '\n' + res.error_msg()

                return 500, Gview2.error_return(code, message=message)

        return 200, Gview2.json_return('success')

    def delete_entity(self, db, name, graph_data, index_name, graphdb, pro_merge):
        '''
        删除nebula中的点 以及删除全文索引
        Args:
            db: nebula图空间名
            name: 实体名
            graph_data: 需要插入的数据，需要包含融合属性，结构：{属性名: 属性值}
            index_name: 全文索引名称
            graphdb: 图数据库操作对象
            pro_merge: {实体名: 融合属性列表}

        Returns:
            code
            response
        '''
        vids = []
        es_bulk_index = []
        for data in graph_data:
            vid = name + '_'
            for pro in pro_merge[name]:
                if pro not in data:
                    err = _l('graph_data does not have merge property "{}": {}').format(pro, data)
                    code = codes.Builder_GraphService_AlterGraphData_MissingMergeProperty

                    return 500, Gview2.error_return(code, message=err)
                vid += "{}_".format(self.normalize_text(str(data[pro])))
            vid = self.get_md5(vid)
            vids.append(vid)
            es_bulk_index.append(json.dumps({"delete": {"_index": index_name, "_id": vid}}))
        ngql = 'DELETE VERTEX {} WITH EDGE'.format(','.join(list(map(lambda x: f'"{x}"', vids))))
        code, res = graphdb.exec_batch(ngql, db)
        if code != 200:
            code = codes.Builder_GraphService_AlterGraphData_NebulaError
            message = 'delete entity failed. \n' + ngql + '\n' + res.error_msg()

            return 500, Gview2.error_return(code, message=message)
        # 删除全文索引
        es_bulk_index_new = '\n'.join(es_bulk_index) + '\n'
        if len(es_bulk_index_new) > 92160:
            split_num = math.ceil(len(es_bulk_index_new) / 92160)
            res_data = [es_bulk_index[i::split_num] for i in range(split_num)]
            for es_data in res_data:
                es_bulk_index_data = '\n'.join(es_data) + '\n'
                graphdb.batch_process_vertex_index_not_catch_exp(es_bulk_index_data)
        else:
            graphdb.batch_process_vertex_index_not_catch_exp(es_bulk_index_new)

        return 200, Gview2.json_return('success')

    def delete_edge(self, db, name, graph_data, graphdb, pro_merge):
        '''
        删除nebula中的边
        Args:
            db: nebula图空间名
            name: 边名
            graph_data: 需要插入的数据，结构：
                {'start': {起点融合属性: 起点融合属性值, '_start_entity': 起点类名},
                 'end': {终点融合属性:终点融合属性值, '_end_entity': 终点类名}}
            graphdb: 图数据库操作对象
            pro_merge: {实体名: 融合属性列表}

        Returns:
            code
            response
        '''
        values = []
        start_entity = graph_data[0]['start']['_start_entity']
        end_entity = graph_data[0]['end']['_end_entity']
        if start_entity not in pro_merge:
            code = codes.Builder_GraphService_AlterGraphData_NameNotExists

            return 500, Gview2.error_return(code, name='start entity ' + start_entity)
        if end_entity not in pro_merge:
            code = codes.Builder_GraphService_AlterGraphData_NameNotExists

            return 500, Gview2.error_return(code, name='end entity ' + end_entity)
        for data in graph_data:
            start_data = data['start']
            end_data = data['end']
            # 构造起始点vid
            if '_vid' in start_data:
                start_vid = start_data['_vid']
            else:
                start_vid = start_entity + '_'
                for pro in pro_merge[start_entity]:
                    if pro not in start_data:
                        err = _l('graph_data start does not have _vid or merge property "{}": {}')\
                            .format(pro, start_data)
                        code = codes.Builder_GraphService_AlterGraphData_MissingMergeProperty

                        return 500, Gview2.error_return(code, message=err)
                    start_vid += "{}_".format(self.normalize_text(str(start_data[pro])))
                start_vid = self.get_md5(start_vid)
            # 构造终点vid
            if '_vid' in end_data:
                end_vid = end_data['_vid']
            else:
                end_vid = end_entity + '_'
                for pro in pro_merge[end_entity]:
                    if pro not in end_data:
                        err = _l('graph_data end does not have _vid or merge property "{}": {}')\
                            .format(pro, end_data)
                        code = codes.Builder_GraphService_AlterGraphData_MissingMergeProperty

                        return 500, Gview2.error_return(code, message=err)
                    end_vid += "{}_".format(self.normalize_text(str(end_data[pro])))
                end_vid = self.get_md5(end_vid)
            values.append('"{}" -> "{}"'.format(start_vid, end_vid))
        ngql = 'DELETE EDGE `{}` {}'.format(name, ','.join(values))
        code, res = graphdb.exec_batch(ngql, db)
        if code != 200:
            code = codes.Builder_GraphService_AlterGraphData_NebulaError
            message = 'delete edge failed. \n' + ngql + '\n' + res.error_msg()

            return 500, Gview2.error_return(code, message=message)

        return 200, Gview2.json_return('success')

    def batch_del_relation(self, graph_id, vertex_name, relation_name, vertex_data):
        '''
        批量删除关系
        Args:
            graph_id: 图谱id
            vertex_name: 需要批量删除关系的起始点或终点实体类名
            relation_name: 需要批量删除的关系的关系类名
            vertex_data: 删除该关系起始点或者终点的融合属性值或者vid，vid使用参数_vid传递，例如：{"_vid":123}代表使用vid删除，{"name":爱数}则代表使用融合属性删除

        Returns:
            code
            response
        '''
        t1 = time.time()
        graphdb = GraphDB()
        code, cache = graph_dao.find_redis_graph_cache(graph_id)
        if code != 200:
            code = codes.Builder_GraphDao_FindRedisGraphCache_RedisReadError
            message = 'Redis cache read failed.'
            Logger.log_info(message)

            return 500, Gview2.error_return(code, message=message)
        cnt = 0  # 最大重试次数为3
        while cache == {} and cnt < 3:
            time.sleep(0.1)
            code, res = self.get_graph_info_onto(str(graph_id), True)
            if code != 'success':
                if code == codes.Builder_GraphService_GetGraphInfoOnto_GraphidNotExist:
                    code = codes.Builder_GraphService_BatchDelRelation_GraphIdNotExist
                return code, res
            code, cache = graph_dao.find_redis_graph_cache(graph_id)
            if code != 200:
                code = codes.Builder_GraphDao_FindRedisGraphCache_RedisReadError
                message = 'Redis cache read failed.'
                Logger.log_info(message)

                return 500, Gview2.error_return(code, message=message)
            cnt += 1
        if cache == {} and cnt == 3:  # 超过最大重试次数仍读取为空，说明写入有异常
            code = codes.Builder_GraphDao_RefreshRedisCache_RedisWriteError
            message = 'Redis cache write failed.'

            return 500, Gview2.error_return(code, message=message)
        KDB_name = str(cache["dbname"])[1: -1]
        entities = cache["entity"]
        edges = cache["edge"]
        t2 = time.time()
        Logger.log_info(f"/batch_del_relation:get cache end,spend:{t2 - t1}s")
        edge = None
        entity = None
        for my_entity in entities:
            if my_entity["name"] == vertex_name:
                entity = my_entity
                break
        if entity == None:
            code = codes.Builder_GraphService_BatchDelRelation_VertexNameNotExists

            data = Gview2.TErrorreturn(code,
                                       graphid=graph_id)
            return code, data
        if "_vid" in vertex_data.keys():
            vid = vertex_data["_vid"]
        else:
            vid = vertex_name + '_'
            for pro in entity["primary_key"]:
                if pro not in vertex_data.keys():
                    code = codes.Builder_GraphService_BatchDelRelation_MissingMergeProperty
                    err = _l('graph_data start does not have _vid or merge property "{}": {}').format(
                        vertex_name,
                        pro)

                    return 500, Gview2.error_return(code, message=err)
                vid += "{}_".format(self.normalize_text(str(vertex_data[pro])))
            vid = self.get_md5(vid)
        for relation in relation_name:
            edge = None
            for my_edge in edges:
                if my_edge["name"] == relation['name']:
                    edge = my_edge
                    break
            if edge == None:
                code = codes.Builder_GraphService_BatchDelRelation_RelationNameNotExists

                data = Gview2.TErrorreturn(code,
                                           graphid=graph_id)
                return code, data
            if vertex_name not in [edge["relations"][0], edge["relations"][2]]:
                code = codes.Builder_GraphService_BatchDelRelation_RelationNameNotExists

                data = Gview2.TErrorreturn(code,
                                           graphid=graph_id)
                return code, data
            t3 = time.time()
            if relation['direction'] == "out":
                ngql = 'go from "{}" over `{}` yield src(edge) as s, dst(edge) as d | delete edge `{}` $-.s -> $-.d'.format(
                    vid, relation['name'], relation['name'])
            elif relation['direction'] == "in":
                ngql = 'go from "{}" over `{}` reversely yield src(edge) as s, dst(edge) as d | delete edge `{}` $-.s -> $-.d'.format(
                    vid, relation['name'], relation['name'])
            else:
                ngql = 'go from "{}" over `{}` bidirect yield src(edge) as s, dst(edge) as d | delete edge `{}` $-.s -> $-.d'.format(
                    vid, relation['name'], relation['name'])
            try:
                code, res = graphdb._nebula_exec(ngql=ngql, db=KDB_name, retry=False)
                if code != 200:
                    code = codes.Builder_GraphService_BatchDelRelation_DeleteError

                    data = Gview2.TErrorreturn(code,
                                               cause=res.err.args)
                    return code, data
            except Exception as e:
                code = codes.Builder_GraphService_BatchDelRelation_DeleteError

                data = Gview2.TErrorreturn(code,
                                           cause=res)
                return code, data
            t4 = time.time()
            Logger.log_info(f"/batch_del_relation:delete nebula spend：{t4 - t3}s")
        return 200, Gview2.json_return('success')



graph_Service = GraphService()

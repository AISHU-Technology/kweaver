# -*-coding:utf-8-*-
# @Time    : 2020/9/7 18:31
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import re

import pymongo
import pickle
import arrow
from flask import jsonify
from config import config
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from dao.graph_dao import graph_dao
from dao.dsm_dao import dsm_dao
from dao.otl_dao import otl_dao
from dao.task_dao import task_dao
from dao.graphdb_dao import GraphDB
from dao.other_dao import other_dao
# 此处导入知识图谱搜索配置模块
from dao.knw_dao import knw_dao
import pyorient
from functools import wraps
from utils import orientSoket
from utils.log_info import Logger
import pyorient
from utils import orientSoket
from utils.CommonUtil import commonutil
from utils.ConnectUtil import redisConnect, mongoConnect
import requests
import pandas as pd
from collections import Counter

from utils.log_info import Logger

from pymongo import MongoClient
import configparser
from os import path

from nebula2.gclient.net import ConnectionPool
from nebula2.Config import Config as NebulaConfig
from common.errorcode import codes
from common.errorcode.gview import Gview as Gview2

class GraphService():
    def getGraphDB(self, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            res = {}
            ret = graph_dao.getGraphDB()
            rec_dict = ret.to_dict('records')
            res["df"] = rec_dict
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert connection fail"

        return ret_code, obj

    def getallgraph(self, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            res = {}
            ret = graph_dao.getallgraph()
            rec_dict = ret.to_dict('records')
            res["df"] = rec_dict
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get graph fail"

        return ret_code, obj
        # 新增图谱配置

    def getbis(self, host_url):
        config = configparser.ConfigParser()
        config.read("./../config/asapi.conf")
        baseInfo_flag = eval(config.get("baseInfo_flag", "baseInfo_flag"))
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        obj["baseInfo_flag"] = baseInfo_flag
        Logger.log_info("host: {}, base info switch {}".format(host_url, baseInfo_flag))
        return ret_code, obj

    # def getalldbname(self,host_url):
    #     ret_code = CommonResponseStatus.SUCCESS.value
    #     obj = {}
    #     db_list = []
    #
    #     ret = graph_dao.getGraphDBNew()
    #     rec_dict = ret.to_dict('records')
    #     rec_dict2 = rec_dict[0]
    #     graph_DBPort = rec_dict2["port"]
    #     graph_DBAddress = rec_dict2["ip"]
    #     try:
    #         # # 获取 orientDB 数据库集合
    #         url_db = 'http://' + graph_DBAddress + ':' + str(graph_DBPort) + "/listDatabases"
    #         r_db = requests.get(url_db)
    #         databases_res = r_db.json()
    #         db_list = databases_res["databases"]
    #         obj["res"] = db_list
    #     except Exception as e:
    #         obj["res"] = db_list
    #         return ret_code, obj
    #     return ret_code, obj

    def get_listDatabases(self, graph_DBAddress, graph_DBPort, username, password, graph_DBType):
        databases = []
        if graph_DBType == 'orientdb':
            headers = {"Connection": "close"}
            url_db = 'http://' + graph_DBAddress[0] + ':' + str(graph_DBPort[0]) + "/listDatabases"
            r_db = requests.get(url_db, headers=headers)
            databases_res = r_db.json()
            databases = databases_res["databases"]
        elif graph_DBType == 'nebula':
            host = []  # nebula数据地址和端口组成的列表
            for i in range(len(graph_DBAddress)):
                host.append((graph_DBAddress[i], graph_DBPort[i]))
            config = NebulaConfig()
            connection_pool = ConnectionPool()
            connection_pool.init(host, config)
            session = connection_pool.get_session(username, password)
            res = session.execute('SHOW SPACES')
            size = res.row_size()
            databases = [''] * size
            for i in range(size):
                databases[i] = res.row_values(i)[0]
            connection_pool.close()
        return databases

    def get_listMongo(self):
        mongoDB_conn = mongoConnect.connect_mongo()
        # 获取 mongoDB 数据库集合
        mongoDB_names = mongoDB_conn.collection_names()
        mongoDB_col_names = [current_usr.lower().split("_")[0] for current_usr in mongoDB_names]
        return mongoDB_col_names

    def test_avaible_db(self, address, port, username, password, graph_DBID, graph_DBType):
        if graph_DBType == 'orientdb':
            dbname = "akdjshfureghfvkldsklgfj"
            headers = {"Connection": "close"}
            try:
                url = f"http://{address[0]}:{port[0]}/database/{dbname}/plocal"
                r_del = requests.delete(url, headers=headers, auth=(username, password), timeout=10)
                if r_del.status_code == 401:
                    raise Exception("username or password error")
            except Exception:
                raise Exception(f"ConnectTimeout: HTTPConnectionPool(host={address}, port={port})")
        elif graph_DBType == 'nebula':
            graph = GraphDB(graph_DBID)
            code, msg = graph.test_nebula_conn()
            if not code:
                raise Exception(msg)

    def addgraph(self, params_json, host_url):
        config = configparser.ConfigParser()
        asapi_path = path.join(path.dirname(path.dirname(path.abspath(__file__))), 'config', 'asapi.conf')
        config.read(asapi_path)
        baseInfo_flag = eval(config.get("baseInfo_flag", "baseInfo_flag"))
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        dbname_exits_flag = False
        KGname_exit_flag = False
        DB_IP_ERROR = False
        update_flag = False
        graph_id = -1  # 图谱id
        try:
            graph_process_list = params_json["graph_process"]
            graph_process_dict = graph_process_list[0]
            knw_id = params_json["knw_id"]
            graph_Name = graph_process_dict["graph_Name"]
            graph_DBName = graph_process_dict["graph_DBName"]
            graph_db_id = graph_process_dict["graph_db_id"]
            KgConf = graph_dao.getKgConfByName(graph_Name, knw_id)
            if len(KgConf) != 0:
                KGname_exit_flag = True

            ret = graph_dao.getGraphDBNew(graph_db_id)
            rec_dict = ret.to_dict('records')
            if len(rec_dict) == 0:
                DB_IP_ERROR = True
            else:
                # 获取图数据库密码
                rec_dict2 = rec_dict[0]
                graph_DBPort = rec_dict2["port"]
                graph_DBPort = graph_DBPort.split(';')
                username = rec_dict2["db_user"]
                # username = commonutil.DecryptBybase64(username)
                password = rec_dict2["db_ps"]
                graph_DBType = rec_dict2['type']
                if graph_DBType == 'nebula':
                    graphdb_invalid = False
                    rule = re.compile('^[a-zA-z]{1}.*$')
                    if not isinstance(graph_DBName, str) or graph_DBName.isdigit() or rule.match(graph_DBName) == None:
                        graphdb_invalid = True
                        obj[
                            'cause'] = "nebula graph_DBName must be Beginning with a letter, a combination of letters and numbers"
                    if not graph_DBName.islower():
                        graphdb_invalid = True
                        obj['cause'] = "nebula graph_DBName must be lowercase"
                    if '_' in graph_DBName:
                        graphdb_invalid = True
                        obj['cause'] = "nebula graph_DBName can not contain '_'"
                    if graphdb_invalid:
                        obj['code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                        obj['message'] = "create graph config fail"
                        ret_code = CommonResponseStatus.BAD_REQUEST.value
                        return ret_code, obj, graph_id
                try:
                    password = commonutil.DecryptBybase64(password)
                except Exception as e:
                    Logger.log_error(repr(e))
                    DB_IP_ERROR = True
                graph_ips = rec_dict2["ip"]
                graph_DBAddress = rec_dict2["ip"]
                graph_DBAddress = graph_DBAddress.split(';')
                graph_lastId = 0
                # 获取最后图谱配置id
                ret_lastId = graph_dao.getKgConfLastId()
                rec_lastId_dict = ret_lastId.to_dict('records')
                if len(rec_lastId_dict) == 1:
                    r_lastId = rec_lastId_dict[0]
                    graph_lastId = int(r_lastId["id"])

                conId = "-" + str(graph_lastId + 1)
                graph_mongo_Name = "mongoDB" + conId
                graph_DBName = graph_process_dict["graph_DBName"]
                try:
                    if not baseInfo_flag:
                        # dbname 在数据库已存在
                        databases = self.get_listDatabases(graph_DBAddress, graph_DBPort, username, password,
                                                           graph_DBType)
                        if graph_DBName in databases:
                            dbname_exits_flag = True
                        # dbname 被其他配置使用
                        graph_all = graph_dao.getallgraph()
                        graph_all_df = graph_all.loc[
                            graph_all["graph_baseInfo"].str.contains("\'graph_DBName\': \'" + graph_DBName + "\'")]
                        if len(graph_all_df) > 0:
                            dbname_exits_flag = True
                    try:
                        # 获取 mongoDB 数据库集合
                        mongoDB_db_names = self.get_listMongo()
                        # 如果自动生成的graph_DBName 已存在orientDB 和 mongoDB 中继续触发生成规则
                        while graph_mongo_Name.lower() in mongoDB_db_names:
                            # 规则是 knowledgegraph_id ;[_id] 是数据库自增id, 如果已存在就拼接_id
                            graph_mongo_Name += conId
                    except Exception as e:
                        Logger.log_error(repr(e))
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "mongoDB Unusable!"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "create fail"
                        return ret_code, obj, graph_id
                    if not DB_IP_ERROR:
                        try:
                            # db  需要测试连接一下是否可用
                            self.test_avaible_db(graph_DBAddress, graph_DBPort, username, password, graph_db_id,
                                                 graph_DBType)
                        except Exception as e:
                            Logger.log_error(repr(e))
                            DB_IP_ERROR = True

                except Exception as e:
                    Logger.log_error(repr(e))
                    DB_IP_ERROR = True

                # dbname 其他配置用过
                # graph_all = graph_dao.getallgraph()
                # graph_DBName = self.dbnameused(graph_DBName, graph_all,conId)
                graph_process_dict["graphDBAddress"] = graph_ips
                graph_process_dict["graph_DBName"] = graph_DBName
                graph_process_dict["graph_mongo_Name"] = graph_mongo_Name
                graph_process_list[0] = graph_process_dict
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
                if ret > 0:
                    # 将图谱配置的id 插入knowledge_graph，返回最后一个插入的id
                    ret_graph = graph_dao.insertgraph(params_json, ret)
                    if ret_graph > 0:
                        obj["res"] = str(ret)
                    else:
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "create graph config fail"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "create graph config fail"
            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['message'] = "create graph config fail"
        except Exception as e:
            Logger.log_error(repr(e))
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "create graph config fail"
        return ret_code, obj, graph_id

    # 修改 新增图谱配置，,已废弃
    def addgraph_V1635(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        dbname_exits_flag = False
        KGname_exit_flag = False
        DB_IP_ERROR = False
        update_flag = False

        graph_id = -1  # 图谱id
        # 查询图数据库密码
        try:
            # 1. 图谱名称是否存在
            # 2. 数据库IP是否可用
            # 3. 图数据名是否可用

            graph_process_list = params_json["graph_process"]
            graph_process_dict = graph_process_list[0]

            graph_Name = graph_process_dict["graph_Name"]
            graph_db_id = graph_process_dict["graph_db_id"]
            KgConf = graph_dao.getKgConfByName(graph_Name)

            mongoDB_conn = mongoConnect.connect_mongo()

            if len(KgConf) != 0:
                KGname_exit_flag = True

            ret = graph_dao.getGraphDBNew(graph_db_id)
            rec_dict = ret.to_dict('records')
            if len(rec_dict) == 0:
                DB_IP_ERROR = True
            else:
                rec_dict2 = rec_dict[0]
                graph_DBPort = rec_dict2["port"]
                graph_DBPort = graph_DBPort.split(';')
                username = rec_dict2["db_user"]
                # username = commonutil.DecryptBybase64(username)
                password = rec_dict2["db_ps"]
                password = commonutil.DecryptBybase64(password)
                graph_ips = rec_dict2["ip"]
                graph_DBAddress = rec_dict2["ip"]
                graph_DBAddress = graph_DBAddress.split(';')
                graph_DBType = rec_dict2['type']
                graph_lastId = 0
                ret_lastId = graph_dao.getKgConfLastId()
                rec_lastId_dict = ret_lastId.to_dict('records')
                if len(rec_lastId_dict) == 1:
                    r_lastId = rec_lastId_dict[0]
                    graph_lastId = int(r_lastId["id"])

                conId = "-" + str(graph_lastId + 1)
                graph_DBName = "knowledgegraph" + conId
                try:
                    # 获取 orientDB 数据库集合
                    databases = self.get_listDatabases(graph_DBAddress, graph_DBPort, username, password, graph_DBType)
                    # 获取 mongoDB 数据库集合
                    mongoDB_collection_names = mongoDB_conn.collection_names()
                    mongoDB_db_names = [current_usr.lower() for current_usr in mongoDB_collection_names]
                    # 如果自动生成的graph_DBName 已存在orientDB 和 mongoDB 中继续触发生成规则
                    while graph_DBName in databases or graph_DBName.lower() in mongoDB_db_names:
                        # 规则是 knowledgegraph_id ;[_id] 是数据库自增id, 如果已存在就拼接_id
                        graph_DBName += conId
                    # 如果自动生成的数据库名长度超过50 报错终止。
                    if len(graph_DBName) > 50:
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "graph_DBName Length over 50!"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "create fail"
                        return ret_code, obj, graph_id
                    # db  需要测试连接一下是否可用
                    self.test_avaible_db(graph_DBAddress, graph_DBPort, username, password, graph_db_id, graph_DBType)
                except Exception as e:
                    #  DB只有存在的时不保存，其他 DB port user ps不可用报IP错误
                    if "ODatabaseException" in repr(e):
                        Logger.log_info(repr(e))
                    else:
                        Logger.log_error(e)
                        DB_IP_ERROR = True

                # dbname 其他配置用过
                graph_all = graph_dao.getallgraph()
                graph_DBName = self.dbnameused(graph_DBName, graph_all, conId)
                graph_process_dict["graphDBAddress"] = graph_ips
                graph_process_dict["graph_DBName"] = graph_DBName
                graph_process_list[0] = graph_process_dict

                # graph_all_df = graph_all.loc[
                #     graph_all["graph_baseInfo"].str.contains("\'graph_DBName\': \'" + graph_DBName + "\'")]
                # if len(graph_all_df) > 0:
                #     dbname_exits_flag = True

            if KGname_exit_flag:
                if DB_IP_ERROR:
                    obj['cause'] = "graph name exist and DB IP error!"
                    # 错误码DB_IP_KGNAME_ERROR
                    obj['code'] = CommonResponseStatus.DB_IP_KGNAME_ERROR.value
                else:
                    if dbname_exits_flag:  # 图数据库名
                        obj['cause'] = "graph name exist and DB name exist!"
                        obj['code'] = CommonResponseStatus.KGDB_KGNAME_ERROR.value
                    else:
                        obj['cause'] = "kg graph name  exists!"
                        obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            else:

                if DB_IP_ERROR:
                    obj['cause'] = "DB IP error!"
                    # 错误码
                    obj['code'] = CommonResponseStatus.DB_IP_ERROR.value
                else:
                    if dbname_exits_flag:  # 图数据库名
                        obj['cause'] = "DB name exist!"
                        obj['code'] = CommonResponseStatus.KGDB_ERROR.value
                    else:
                        update_flag = True
            if update_flag:
                # 数据写入graph_config_table，返回最后一个插入的id
                ret = graph_dao.insertData(params_json)
                graph_id = ret
                if ret > 0:
                    # 将图谱配置的id 插入knowledge_graph，返回最后一个插入的id
                    ret_graph = graph_dao.insertgraph(params_json, ret)
                    if ret_graph > 0:
                        obj["res"] = str(ret)
                    else:
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "create graph config fail"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "create graph config fail"
            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['message'] = "create graph fail"
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "create fail"
        return ret_code, obj, graph_id

    def dbnameused(self, graph_DBName, graph_all, conId):
        graph_all_df = graph_all.loc[
            graph_all["graph_baseInfo"].str.contains("\'graph_DBName\': \'" + graph_DBName + "\'")]
        while len(graph_all_df) > 0:
            graph_DBName += conId
            self.dbnameused(graph_DBName, graph_all, conId)
        return graph_DBName

    def getGraphById(self, grapid, host_url, slient=False):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = graph_dao.getbyid(grapid)
            if len(ret) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = str(grapid) + " not exist!"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = str(grapid) + " not exist!"
                return ret_code, obj
            else:

                # graph_ds = ret["graph_ds"].to_dict()
                # print(graph_ds.get("0"))
                rec_dict = ret.to_dict('records')
                rec_dict = rec_dict[0]
                ds_ids = rec_dict["graph_ds"]
                graph_info = rec_dict["graph_baseInfo"]
                graph_otl_temp = rec_dict["graph_otl_temp"]
                graph_InfoExt = rec_dict["graph_InfoExt"]
                graph_otl = rec_dict["graph_otl"]
                graph_kMap = rec_dict["graph_KMap"]
                graph_kMerge = rec_dict["graph_KMerge"]
                used_ds = []  # 使用的数据源
                # 流程中数据源选择的数据源
                if ds_ids is not None and len(eval(ds_ids)) > 0:
                    dss = dsm_dao.getbyids(eval(ds_ids))
                    # 查询数据源时排序，按照选择的顺序返回，否则保存时自动排序了
                    dss.index = dss['id']
                    sort_df_grade = dss.loc[eval(ds_ids)]
                    ds_dict = sort_df_grade.to_dict('records')
                    # ds_dict = dss.to_dict('records')
                    # 将数据源详细信息赋值给graph_ds
                    rec_dict["graph_ds"] = ds_dict
                else:
                    rec_dict["graph_ds"] = eval(ds_ids)
                # 流程中 图谱基本信息
                # if graph_info is not None and len(eval(graph_info)) > 0:
                #     rec_dict["graph_baseInfo"] = eval(graph_info)
                # else:
                rec_dict["graph_baseInfo"] = eval(graph_info)

                # 流程中 图谱映射
                # if graph_kMap is not None and len(eval(graph_kMap)) > 0:
                #     rec_dict["graph_KMap"] = eval(graph_kMap)
                # else:
                rec_dict["graph_KMap"] = eval(graph_kMap)
                # 流程中 图谱映射
                # if graph_kMerge is not None and len(eval(graph_kMerge)) > 0:
                #     rec_dict["graph_KMerge"] = eval(graph_kMerge)
                # else:
                rec_dict["graph_KMerge"] = eval(graph_kMerge)

                # 查询时先 查询graph_otl_temp本体临时字段， 退出保存时存入的数据
                if graph_otl_temp is not None and len(eval(graph_otl_temp)) > 0:
                    # graph_otl_temp = graph_otl_temp[0]
                    # print("&&&&&&&&&&&&&&")

                    list_all, otl_used_ds = self.getotlinfo(eval(graph_otl_temp))
                    if not slient:
                        print(list_all)
                    used_ds.extend(otl_used_ds)
                    # 将本体详细信息赋值给图谱的graph_otl
                    rec_dict["graph_otl"] = list_all
                else:
                    # 流程中 使用的本体

                    if graph_otl is not None and len(eval(graph_otl)) > 0:
                        otl = otl_dao.getbyids(eval(graph_otl))
                        if not slient:
                            print(otl)
                        otl_dict = otl.to_dict('records')
                        if not slient:
                            print(otl_dict)
                        list_all, otl_used_ds = self.getotlinfo(otl_dict)
                        used_ds.extend(otl_used_ds)
                        # 将本体详细信息赋值给图谱的graph_otl
                        rec_dict["graph_otl"] = list_all
                    else:
                        rec_dict["graph_otl"] = eval(graph_otl)
                # 流程中 抽取
                if graph_InfoExt is not None and len(eval(graph_InfoExt)) > 0:
                    infoExt = eval(graph_InfoExt)
                    # 将抽取信息赋值给图谱的graph_InfoExt
                    rec_dict["graph_InfoExt"] = infoExt
                    for info in infoExt:
                        for info_k, info_v in info.items():
                            if info_k == "ds_name":
                                used_ds.append(info_v)
                else:
                    rec_dict["graph_InfoExt"] = eval(graph_InfoExt)

                # 流程中  本体和抽取已经使用的数据源
                if len(used_ds) > 0:
                    if not slient:
                        print(used_ds)
                    ds_byname = dsm_dao.getdsbynames(list(set(used_ds)))
                    ds_byname_dict = ds_byname.to_dict('records')
                    # # 将本体和抽取中使用的数据源详细信息赋值给graph_used_ds
                    rec_dict["graph_used_ds"] = ds_byname_dict
                else:
                    rec_dict["graph_used_ds"] = []
                obj["res"] = rec_dict

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get %s fail" % grapid

        return ret_code, obj

    def getotlinfo(self, otl_dict):
        list_all = []  # 重新组装otl
        used_ds = []
        for reslist in otl_dict:
            dict_all = {}
            for key in reslist:
                if key == "entity" or key == "edge" or key == "all_task" or key == "used_task":
                    value = reslist[key]
                    if not isinstance(value, list):
                        value = eval(value)
                    if key == "entity" or key == "edge":
                        if len(value) > 0:  # used_ds添加本体已经使用的数据源
                            for v_dict in value:
                                for ds_k, ds_v in v_dict.items():
                                    if ds_k == "ds_name":
                                        # 将本体中选择的数据源 单独拿出来给used_ds 后续将抽取中的数据源拿出来给流程中的数据源展示那块用
                                        used_ds.append(ds_v)
                    dict_all[key] = value
                # elif key == "id":  # 本体id
                #     idd = reslist[key]
                #     print(idd)
                else:
                    dict_all[key] = reslist[key]
            list_all.append(dict_all)
        return list_all, used_ds

    def savenocheck(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        # 参数不校验，前端做校验，保存错就错了
        graph_id = params_json.get("graph_id", None)
        try:
            df = graph_dao.getbyid(graph_id)
            if len(df) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graphid  %s not exist!" % graph_id
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "Exit save fail"
            else:
                baseinfo_df = graph_dao.getbaseinfoById(graph_id)
                baseinfo_df = baseinfo_df.to_dict("records")
                for line in baseinfo_df:
                    graph_baseInfo = line["graph_baseInfo"]
                    graphDBAddress = eval(graph_baseInfo)[0]["graphDBAddress"]
                    graph_DBName = eval(graph_baseInfo)[0]["graph_DBName"]
                    graph_mongo_Name = eval(graph_baseInfo)[0]["graph_mongo_Name"]
                    for key in params_json:
                        value_temp = params_json[key]
                        if key == "graph_baseInfo":
                            graph_baseInfo_value = []
                            value_temp2 = value_temp[0]
                            value_temp2["graphDBAddress"] = graphDBAddress
                            value_temp2["graph_mongo_Name"] = graph_mongo_Name
                            value_temp2["graph_DBName"] = graph_DBName
                            graph_baseInfo_value.append(value_temp2)
                            params_json[key] = graph_baseInfo_value
                            break
                ret = graph_dao.savenocheck(graph_id, params_json)
                print(ret)
                if ret == 1:
                    obj["res"] = "Exit save graph %s " % (graph_id)
                else:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "Exit save %s fail" % graph_id
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Exit save %s fail" % graph_id

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
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

        # dsids = params_json["dsids"]
        try:
            df = graph_dao.getbyid(graphid)
            print(df)
            if len(df) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graphid  %s not exist!" % graphid
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "get fail"
            else:
                # 查询 图谱中使用数据源
                dss = graph_dao.getdsgraphuse(graphid)
                ds_dict = dss.to_dict('records')
                ds_dict = ds_dict[0]
                ds_ids1 = eval(ds_dict["graph_ds"])
                ds_ids = [id for id in ds_ids1]
                if len(ds_ids) > 0:
                    # 获得 图谱中使用的数据源详细信息
                    ds_df = dsm_dao.getbyids(ds_ids)
                    # 排序，展示时 根据选择的数据源的顺序
                    ds_df.index = ds_df['id']
                    # 删除已经被使用的数据源（在数据库中删除）
                    ds_id_list = ds_df['id'].tolist()
                    use_list = ds_ids
                    sort_list = [val for val in use_list if val in ds_id_list]
                    sort_df_grade = ds_df.loc[sort_list]
                    if ds_type == "filter":
                        sort_df_grade = dsm_dao.getbyids_order(ds_ids)

                    # sort_df_grade = sort_df_grade.loc[sort_df_grade["dataType"] == "structured"]
                    # pd.merge(sort_df_grade, quizs_type_df, on='quiz_id', how='left')
                    ds_value = sort_df_grade.to_dict('records')
                    res = {}
                    res["count"] = len(ds_value)
                    res["df"] = ds_value
                    obj["res"] = res
                else:
                    res = {}
                    res["count"] = 0
                    res["df"] = []
                    obj["res"] = res

                # else:
                #     obj['cause'] = "data source cannot empty"
                #     obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                #     obj['message'] = "get data source fail"

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
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
        config = configparser.ConfigParser()
        config.read("./../config/asapi.conf")
        ret_code = CommonResponseStatus.SUCCESS.value
        KGname_exit_flag = False
        DB_IP_ERROR = False
        update_flag = False
        merge_flag = True
        is_error = False
        try:
            graph_process_list = params_json["graph_process"]
            graph_process_dict = graph_process_list[0]
            knw_id = params_json["knw_id"]
            graph_Name = graph_process_dict["graph_Name"]
            KgConf = graph_dao.getKgByNameandId(graph_Name, grapid, knw_id)
            if len(KgConf) != 0:
                KGname_exit_flag = True
            graph_db_id = params_json['graph_process'][0]['graph_db_id']
            ret = graph_dao.getGraphDBbyId(graph_db_id)
            rec_dict = ret.to_dict('records')
            if len(rec_dict) == 0:
                DB_IP_ERROR = True
            else:
                if merge_flag:
                    try:
                        # 获取图数据库密码
                        rec_dict2 = rec_dict[0]
                        graph_DBPort = rec_dict2["port"]
                        graph_DBPort = graph_DBPort.split(';')
                        username = rec_dict2["db_user"]
                        password = rec_dict2["db_ps"]
                        graph_DBAddress = rec_dict2["ip"]
                        graph_DBAddress = graph_DBAddress.split(';')
                        graph_DBType = rec_dict2['type']
                        try:
                            password = commonutil.DecryptBybase64(password)
                        except Exception as e:
                            Logger.log_error(repr(e))
                            DB_IP_ERROR = True
                        if not DB_IP_ERROR:
                            self.test_avaible_db(graph_DBAddress, graph_DBPort, username, password, graph_db_id,
                                                 graph_DBType)
                    except Exception as e:
                        Logger.log_error(repr(e))
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
                    graph_dao.updategraph(grapid, params_json, otl_id)
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
            Logger.log_error(err)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "update fail"
        return ret_code, obj

    def updatebaseInfo_1635(self, grapid, params_json, otl_id, host_url):
        # todo: 此函数已经没人在使用，做一下标记。
        obj = {}
        ret_code = CommonResponseStatus.SUCCESS.value
        KGname_exit_flag = False
        update_flag = False
        try:
            graph_process_list = params_json["graph_process"]
            graph_process_dict = graph_process_list[0]

            graph_Name = graph_process_dict["graph_Name"]
            KgConf = graph_dao.getKgByNameandId(graph_Name, grapid)
            if len(KgConf) != 0:
                KGname_exit_flag = True

            df = graph_dao.getbaseinfoById(grapid)
            df = df.to_dict("records")
            for line in df:
                graph_baseInfo = line["graph_baseInfo"]
                graph_process_dict["graphDBAddress"] = eval(graph_baseInfo)[0]["graphDBAddress"]
                graph_process_dict["graph_DBName"] = eval(graph_baseInfo)[0]["graph_DBName"]
                graph_process_dict["graph_mongo_Name"] = eval(graph_baseInfo)[0]["graph_mongo_Name"]
            if KGname_exit_flag:
                obj['cause'] = "kg graph name  exists!"
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value

            else:
                update_flag = True
            if update_flag:
                graph_dao.update(grapid, params_json, otl_id)
                # 修改时，图数据库名字已经存在
                graph_dao.updategraph(grapid, params_json, otl_id)
                task_dao.updatestaskgname(grapid, graph_Name)
                task_dao.updatehistorygname(grapid, graph_Name)
                obj["res"] = "update graph "

            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['message'] = "update graph fail"
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "update fail"
        return ret_code, obj

    def getrunbygraphid(self, grapid):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            df = task_dao.getRunByid(grapid)
            if len(df) > 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graph_id %s is running or waiting can not edit!" % grapid
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "update fail"
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "update %s fail" % grapid
        return ret_code, obj

    def update_otl_temp(self, grapid, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            df = graph_dao.getbyid(grapid)
            if len(df) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graphid  %s not exist!" % grapid
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "update fail"
            else:
                graph_dao.update_otl_temp(grapid)
                obj["res"] = "update graph %s " % (grapid)
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                obj['cause'] = "database already have the same name"
            obj['message'] = "update %s fail" % grapid

        return ret_code, obj

    # 图谱编辑过程中更新数据源
    def update(self, grapid, params_json, otl_id, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            df = graph_dao.getbyid(grapid)
            if len(df) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graphid  %s not exist!" % grapid
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "update fail"
            else:
                graph_step = params_json["graph_step"]
                if graph_step == "graph_ds":
                    graph_process_list = params_json["graph_process"]
                    # 数据源已经不存在
                    ds_list = dsm_dao.getbyids(graph_process_list)
                    if len(ds_list) != len(graph_process_list):
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "update %s fail" % grapid
                        obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
                        obj['message'] = "update %s fail" % grapid
                    elif len(ds_list) == len(graph_process_list):
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
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                obj['cause'] = "database already have the same name"
            obj['message'] = "update %s fail" % grapid
            # obj['message'] = "update  fail"

        return ret_code, obj

    def get_entity_property(self, ret_message, graph_step):
        '''通过graphid获取图谱所有信息，再从中提取出抽取规则中的点和点属性集合.
        Flora 20201110
        check_graph_KMap和getgraphbystep使用到了'''
        entity_message = {"res": []}
        try:
            all_entity_list = []
            entity_type_list = set()
            count = 0
            if len(ret_message["res"]) > 0 and graph_step in ret_message['res'].keys():
                graph_step = ret_message['res'][graph_step]
                if isinstance(graph_step, list) and len(graph_step) > 0:
                    # 获取到entity实体集合列表和实体属性集
                    for i in graph_step:
                        entity_type = set()
                        entity_prop = {}
                        for j in i['extract_rules']:
                            entity_type.add(j['entity_type'])
                            for k, v in {j['entity_type']: j['property']['property_field']}.items():
                                entity_prop.setdefault(k, []).append(v)

                        for entity in list(entity_type):
                            if entity in entity_type_list:  # 如果本体类名存在了，则只追加属性字段即可
                                count += 1
                                for all in all_entity_list:
                                    if entity == all["entity_type"]:
                                        if count == 1:
                                            both_prop = set(all["entity_prop"]).intersection(entity_prop[entity])
                                        elif count > 1:
                                            both_prop = set(all["key_property"]).intersection(entity_prop[entity])
                                        all["key_property"] = list(both_prop)
                                        all["entity_prop"].extend(entity_prop[entity])
                            else:
                                entity_type_list.add(entity)
                                entity_prop_dict = {"entity_type": entity, "entity_prop": entity_prop[entity],
                                                    "key_property": []}
                                all_entity_list.append(entity_prop_dict)

                    for all in all_entity_list:
                        all["entity_prop"] = list(set(all["entity_prop"]))
                        if all["key_property"] == []:
                            all["key_property"] = all["entity_prop"]
            entity_message['res'] = all_entity_list
        except Exception as e:
            Logger.log_error(repr(e))
            entity_message['cause'] = repr(e)
            entity_message['code'] = CommonResponseStatus.SERVER_ERROR.value
            entity_message['message'] = "get  %s abcdefg fail" % graph_step

        return entity_message

    # graphIds运行状态统计
    def getStatusByIds(self, graphids):
        obj = {}
        # 运行状态的
        runs = []
        try:
            df = graph_dao.getStatusById(graphids)
            graph_ids = df["graph_id"].tolist()
            records = df["task_status"].tolist()
            for id, record in zip(graph_ids, records):
                if record == "running":
                    runs.append(id)
            obj["runs"] = runs
            return obj, 0

        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = len(graphids)
            obj['solution'] = 'Please check mariadb or sql'
            return obj, -1

    # 统计不存在的graphids
    def getNoExistIds(self, graphids):
        noExist = []
        obj = {}
        try:
            df = graph_dao.get_graph_id_list()
            allGraphIds = df["id"].tolist()
            # 数据库中不存在的id
            noExist = [i for i in graphids if i not in allGraphIds]
            obj["noExist"] = noExist
            return obj, 0
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            obj = {"cause": err,
                   "code": CommonResponseStatus.REQUEST_ERROR.value,
                   "message": "mysql connection error",
                   "solution": "Please check mariadb"}
            return obj, -1

    # 图谱批量删除
    def deleteGraphByIds(self, graphids):
        mess = ""
        try:
            # 删除mongodb数据，先判断是否存在，不存在则跳过，存在则删除
            client_mon = mongoConnect.connect_mongo()
            collection_names = client_mon.collection_names()
            # dbnames = graph_dao.getKDBnameByIds(graphids)
            # dbnames = dbnames["KDB_name"].tolist()
            for graphid in graphids:
                for collection_name in collection_names:
                    if collection_name.startswith("mongodb-" + str(graphid)):
                        db_collection = client_mon["mongo-" + str(graphid)]
                        db_collection.drop()
            # 删除mysql数据库记录
            ret = graph_dao.deleteGraphByIds(graphids)
            if ret == 0:
                mess = "success delete graphids: %s ;" % ", ".join(map(str, graphids))
                return mess, 0
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            return {"cause": err,
                    "code": CommonResponseStatus.REQUEST_ERROR.value,
                    "message": "delete fail ", "solution": "Please check mariadb"}, -1

    # 根据graph_id查找该图谱下的数据源列表
    def getDsByGraphid(self, graphid):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ids = []
        try:
            df = graph_dao.getDsById([graphid])
            print(df)
            df = df.to_dict()["graph_ds"]
            for k, v in df.items():
                ids.extend(eval(v))
            obj["ids"] = ids
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get %s fail" % graphid

        return ret_code, obj

    # 获取数据源信息
    def getDsAll(self, args):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            page = args.get("page")
            size = args.get("size")
            order = args.get("order")
            count = dsm_dao.getCount()
            res = {}
            ret = dsm_dao.getall(int(page) - 1, int(size), order, None)
            ret = ret.where(ret.notnull(), None)
            rec_dict = ret.to_dict('records')

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
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert connection fail"

        return ret_code, obj

    # 该图谱id是否存在
    def checkById(self, graph_id):
        obj = {}
        try:
            df = graph_dao.getbyid(graph_id)
            if len(df) == 0:
                obj["cause"] = "graph_id  %s not exist!" % graph_id
                obj["code"] = CommonResponseStatus.KGID_NOT_EXIST.value
                obj["message"] = "graph_id error"
                return -1, obj
            else:
                return 0, {}
        except Exception as e:
            Logger.log_error(repr(e))
            obj["cause"] = "get grapg error: mysql connect error"
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            obj["message"] = "error"
            return -1, obj

    # 根据数据源id，查询起对应数据源类型
    def get_ds_source_by_id(self, ds_ids):
        obj = {}
        try:
            ds_sources = []
            df = graph_dao.get_data_sourcebyids(ds_ids)
            df = df.to_dict('records')
            for line in df:
                ds_sources.append(line.get("data_source", ""))
            if len(ds_sources) > 1 and "rabbitmq" in ds_sources:
                Logger.log_error("RabbitMQ数据源混用")
                obj["cause"] = "RabbitMQ数据源只能单独使用"
                obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
                obj["message"] = "RabbitMQ数据源混用"
                return -1, obj
            return 0, df
        except Exception as e:
            Logger.log_error(repr(e))
            obj["cause"] = repr(e)
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            obj["message"] = "error"
            return -1, obj

    # 根据数据源id，查询起对应数据源类型
    def get_DataSourceById(self, graph_id):
        obj = {}
        try:
            data_sources = []
            df = graph_dao.get_DataSourceTypebyid(graph_id)
            df = df.to_dict('records')
            graph_InfoExt = df[0].get("graph_InfoExt")
            if graph_InfoExt:
                graph_InfoExt = eval(graph_InfoExt)
                for info in graph_InfoExt:
                    data_sources.append(info.get("data_source"))
            if data_sources == ["rabbitmq"]:
                return 0, obj
            return -1, obj
        except Exception as e:
            Logger.log_error(repr(e))
            obj["cause"] = repr(e)
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            obj["message"] = "error"
            return -1, obj

    # 根据数据源id，判断数据源类型是否为rabbitmq, 流程2使用
    def ds_is_rabbitmq(self, ds_ids):
        obj = {}
        try:
            ds_sources = []
            df = graph_dao.get_data_sourcebyids(ds_ids)
            df = df.to_dict('records')
            for line in df:
                ds_sources.append(line.get("data_source", ""))
            # 数据源是rabbitmq
            if ds_sources == ["rabbitmq"]:
                return 1, obj
            return 0, obj
        except Exception as e:
            Logger.log_error(repr(e))
            obj["cause"] = repr(e)
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            obj["message"] = "error"
            return -1, obj

    # 获取gns对应主题
    def get_topic_by_gns(self, graph_id, gns_list, topk):
        # 获取图谱信息
        obj = {}
        res = {}
        try:
            dbconn = mongoConnect.connect_mongo()
            for gns in gns_list:
                desc = []
                keywords = []
                data = dbconn["mongoDB-" + str(graph_id) + "_label2document"].find({"o_pro.gns": {"$regex": gns}})
                for da in data:
                    keywords.append(da.get("s"))
                if len(keywords) == 0:
                    obj = {}
                else:
                    ret = Counter(keywords)
                    ret = ret.most_common(topk)
                    keywords = [item[0] for item in ret]

                    conds = [{"o": word} for word in keywords]
                    descs_data = dbconn["mongoDB-" + str(graph_id) + "_desc2label"].find({"$or": conds})
                    for line in descs_data:
                        desc.append(line.get("s"))
                    res[gns] = {"topic": keywords, "desc": desc}
            obj = {"res": res}
            return 0, obj

        except Exception as e:
            Logger.log_error(repr(e))
            obj["cause"] = repr(e)
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            obj["message"] = "get word from mongodb error"
            return -1, obj

    def get_graph_conf_list(self, configids):
        df = task_dao.get_graph_conf_list_by_configs(configids)
        df.loc[df[df.status == "stop"].index.tolist(), 'status'] = "edit"
        # 此处采用df的转换格式，进行转换。并拼接表头。
        result = df.to_dict(orient="records")
        return result

    # 统计是否存在上传中的id
    def get_upload_id(self, graphids):
        try:
            df = graph_dao.get_upload_id(graphids)
        except Exception as e:
            err = repr(e)
            Logger.log_error(err)
            obj = {"cause": err,
                   "code": CommonResponseStatus.REQUEST_ERROR.value,
                   "message": "mysql connection error",
                   "solution": "Please check mariadb"}
            return obj, -1
        return df, 0

    def graph_output(self, graph_ids):
        """
        导出图谱
        :param graph_ids: 用户要导出的图谱
        :return: 文件路径
        """
        item = []
        # 此处，file_name 默认是uuid，其余情况下均为图配置名称
        file_name = "graph"
        for graph_id in graph_ids:
            # 根据图谱id，查看图谱配置表。
            config = graph_dao.getbyid(graph_id)
            config = config.to_dict(orient="records")
            if len(config) > 0:
                config = config[0]
            file_name = config["graph_name"]
            knw_id = knw_dao.get_knw_id_by_graph_id(config["id"])
            knowledge_network = knw_dao.get_knw_by_id(knw_id)
            knowledge_network = knowledge_network.to_dict(orient="records")
            if len(knowledge_network) > 0:
                knowledge_network = knowledge_network[0]
            # 根据图谱id，看看图谱搜索表
            search_graph = graph_dao.get_knowledge_graph_by_id(graph_id)
            search_graph = search_graph.to_dict(orient="records")
            if len(search_graph) > 0:
                search_graph = search_graph[0]
            search_graph_id = search_graph["id"]

            # 查看本体表
            if len(config) > 0:
                ontology_id = config["graph_otl"]
            else:
                ontology_id = -1
            ontology = otl_dao.getbyid(eval(ontology_id)[0])
            ontology = ontology.to_dict(orient="records")
            if len(ontology) > 0:
                ontology = ontology[0]

            # 搜索本体配置表
            search_config = other_dao.get_search_config_by_id(search_graph_id)
            search_config = search_config.to_dict(orient="records")

            item.append(
                {"knowledge_network": knowledge_network, "config": config, "search_graph": search_graph,
                 "ontology": ontology, "search_config": search_config})

        # 此处使用uuid进行处理即可，或者考虑添加其他时间标识。
        file_path = "/tmp/"
        file_name = "{0}.txt".format(file_name)
        file_handler = open(file=file_path + file_name, mode="wb")
        pickle.dump(item, file=file_handler)
        return file_path, file_name

    def graph_input(self, knw_id, graph_id, file_path, method=1):
        """
        同步数据
        :param knw_id: 知识网络id,如果不为None则为前端调用，将图谱导入指定的知识网络，如果为None为上传内部调用，按照唯一标识判断
        :param graph_id: 知识图谱id
        :param file_path: 文件路径
        :param method: 0 跳过  1 更新
        :return:
        """
        print(knw_id, graph_id, file_path)

        # 获取图数据库配置，查询出来使用第一条即可。
        df = graph_dao.getGraphDBbyId(graph_id)
        graph_db = df.to_dict(orient="records")[0]

        # 判断是否是更新的
        is_update = False

        time_now = arrow.now().format('YYYY-MM-DD HH:mm:ss')

        with open(file_path, 'rb') as file_input_handler:
            # 此处处理结果是数据，需要根据唯一不变的名称进行遍历。
            try:
                datas = pickle.load(file_input_handler)
            except Exception as e:
                return Gview.TErrorreturn(
                    "Builder.controller.graph_service.load_data_error.not_json_structed",
                    "not a json structed",
                    "check the data",
                    e.__str__(), ""), 500

        print("解析出来的数据为：", datas)

        # config代表graph_config_table这张表，search_graph代表knowledge_graph表，ontology这张表代表本体这张表，search_config代表search_config这张表
        for data in datas:
            knowledge_network = data["knowledge_network"]
            graph_config = data["config"]
            knowledge_graph = data["search_graph"]
            ontology = data["ontology"]
            search_configs = data["search_config"]

            # 检测knowledge_graph下面的名称是否存在，如果存在代表重复导入。
            kdb_name = knowledge_graph["KDB_name"]
            # 对于批量来说，如果kdb_name已经存在，需要更新此数据库。
            if graph_dao.check_knowledge_graph_by_kdb_name(kdb_name):
                is_update = True

            # 1 代表更新， 0 代表同时存在
            if is_update and method == "0":
                is_update = False
                continue

            # 检测知识网络部分
            if not knw_id:
                old_knowledge_network = knw_dao.get_knw_by_identify_id(knowledge_network["identify_id"])
                old_knowledge_network = old_knowledge_network.to_dict(orient="records")
                knowledge_network["is_update"] = False
                # 如果知识网络的id存在，就代表是更新。
                if len(old_knowledge_network) > 0:
                    old_knowledge_network = old_knowledge_network[0]
                    knowledge_network["is_update"] = True
                    knowledge_network["id"] = old_knowledge_network["id"]
                knowledge_network["creation_time"] = time_now
                knowledge_network["update_time"] = time_now
            else:
                knowledge_network["is_update"] = True

            if is_update:
                # 如果是更新，获取旧版本的knowledge数据。
                old_knowledge_graph = graph_dao.get_knowledge_graph_by_kdb_name(kdb_name)
                if len(old_knowledge_graph) > 0:
                    old_knowledge_graph = old_knowledge_graph[0]
                running_task = graph_dao.get_running_task(old_knowledge_graph["KG_config_id"])
                if len(running_task) > 0:
                    return Gview.TErrorreturn(
                        "Builder.controller.graph_service.get_running_task.task_running",
                        "graph status exception",
                        "please wait or cancel task",
                        "running task cannot perform an import operation", ""), 500
                # 如果是更新，获取旧版本的graph_config数据
                old_graph_config = graph_dao.getbyid(old_knowledge_graph["KG_config_id"])
                old_graph_config = old_graph_config.to_dict(orient="records")
                if len(old_graph_config) > 0:
                    old_graph_config = old_graph_config[0]

                # 获取高级搜索配置id

            # 处理本体结构
            if is_update:
                # 如果是更新，将旧版本id替换
                ontology["id"] = eval(old_graph_config["graph_otl"])[0]
            ontology["create_time"] = time_now
            ontology["update_time"] = time_now

            # 循环处理，直到名称非重复。
            ontology_name = ontology["ontology_name"]
            if not is_update:
                number = 1
                while otl_dao.check_ontology_by_name(ontology_name):
                    ontology_name = ontology["ontology_name"] + "_{0}".format(number)
                    number = number + 1
            else:
                old_ontology_df = otl_dao.getbyid(ontology["id"])
                old_ontology = old_ontology_df.to_dict('records')[0]
                ontology_name = old_ontology['ontology_name']
            ontology["ontology_name"] = ontology_name
            # 处理graph_config_table的数据结构
            if is_update:
                # 如果是更新，替换旧版本id
                graph_config["id"] = old_graph_config["id"]
                graph_config["graph_otl"] = old_graph_config["graph_otl"]
            graph_config["create_time"] = time_now
            graph_config["update_time"] = time_now

            # 如果名称重复，循环处理，直到名称非重复。
            graph_config_name = graph_config["graph_name"]
            if not is_update:
                number = 1
                while graph_dao.check_by_name(graph_config_name):
                    graph_config_name = graph_config["graph_name"] + "_{0}".format(number)
                    number = number + 1
            graph_config["graph_name"] = graph_config_name

            # 更换graph_db信息
            base_infos = graph_config["graph_baseInfo"]
            base_infos = eval(base_infos)
            for base_info in base_infos:
                base_info["graph_db_id"] = graph_db["id"]
                base_info["graphDBAddress"] = graph_db["ip"]
                base_info["graph_Name"] = graph_config_name
            base_infos = str(base_infos)
            graph_config["graph_baseInfo"] = base_infos
            graph_config["graph_ds"] = "[]"
            graph_config["graph_otl_temp"] = "[]"
            graph_config["graph_db_id"] = graph_id
            graph_config["is_upload"] = 1
            # graph_config["graph_status"] = "edit"

            # 处理knowledge_graph结构
            if is_update:
                # 如果是更新，替换旧版本id
                knowledge_graph["id"] = old_knowledge_graph["id"]
                knowledge_graph["KG_config_id"] = old_knowledge_graph["KG_config_id"]
            knowledge_graph["KDB_ip"] = graph_db["ip"]
            knowledge_graph_name = knowledge_graph["KG_name"]
            # 处理名称
            if not is_update:
                number = 1
                while graph_dao.check_knowledge_graph_by_kg_name(knowledge_graph_name):
                    knowledge_graph_name = knowledge_graph["KG_name"] + "_{0}".format(number)
                    number = number + 1
            knowledge_graph["KG_name"] = knowledge_graph_name
            knowledge_graph["create_time"] = time_now
            knowledge_graph["update_time"] = time_now
            knowledge_graph["graph_update_time"] = time_now
            # knowledge_graph["status"] = "edit"

            # 处理高级搜索配置，因为可能不为一条，因此要循环处理。
            for search_config in search_configs:
                if is_update:
                    old_search_config = other_dao.get_search_config_by_name_and_kg_id(search_config["conf_name"],
                                                                                      old_knowledge_graph["id"])
                    search_config["kg_id"] = old_knowledge_graph["id"]
                    if len(old_search_config) > 0:
                        old_search_config = old_search_config[0]
                        search_config["id"] = old_search_config["id"]
                        # 添加search_config是否为更新，search_config可能重复添加更新。
                        search_config["is_update"] = True
                    else:
                        search_config["is_update"] = False

                search_config_name = search_config["conf_name"]
                if not is_update:
                    number = 1
                    while other_dao.check_search_config_by_name(search_config_name):
                        search_config_name = search_config["conf_name"] + "_{0}".format(number)
                        number = number + 1
                search_config["conf_name"] = search_config_name

                search_config["create_time"] = time_now
                search_config["update_time"] = time_now

            new_ids = graph_dao.input_data(knowledge_network, graph_config, knowledge_graph, ontology, search_configs,
                                           is_update, knw_id)

            if is_update and not knowledge_network["is_update"]:
                # 这种情况不存在，如果需要特殊处理，需要在此处修改。
                pass

            # 注：下属代码只有在非update的时候才会执行。
            if not is_update:
                new_ontology_id = new_ids["ontology_id"]
                new_graph_config_id = new_ids["graph_config_id"]

        return "True", 200
    
    def get_graph_info_basic(self, graph_id, is_all, key):
        '''
        获取图谱信息
        Args:
            graph_id: 图谱id
            is_all: True：全部返回，忽略key值； False：返回key指定的字段
            key: 字符串列表,可选值:
                "graph_des": 图谱描述
                "create_time" 创建时间
                "update_time" 最终操作时间
                "display_task" 导入的图谱是否执行过任务
                "export" 是否可以导出
                "is_import" 是外部导入的图谱还是手动创建
                "is_upload" 该图谱是否处于上传中
                "knowledge_type" 知识类型
                "property_id" 用户权限
                "status" 状态
                "task_status" 任务运行状态
                "step_num" 图谱配置流程进行到了第几步
                "ds": 使用过的数据源id
                “otl”: 本体id
                "info_ext": 抽取规则信息
                "kmap": 映射规则信息
                "kmerge": 融合规则信息
                "mongo_name": MongoDB表名
                "graphdb_name": 图数据库DB名
                "graphdb_type": 图数据库类型
                "graphdb_address": 图数据库地址
                "graphdb_id": 图数据库id 
        Returns:
            默认返回id、confid、name
        '''
        code = codes.successCode
        res_info = {}
        kg_conf_id = graph_id
        res_info['kg_conf_id'] = kg_conf_id
        # knowledge_graph信息
        kg_info = graph_dao.get_knowledge_graph_by_id(graph_id)
        if len(kg_info) == 0:
            code = codes.Builder_GraphService_GetGraphInfoBasic_GraphidNotExist
            data = Gview2.TErrorreturn(code,
                                       graphid=graph_id)
            return code, data
        res_info['id'] = int(kg_info.iloc[0]['id'])
        res_info['name'] = kg_info.iloc[0]['KG_name']
        if not is_all and not key:
            return code, Gview2.json_return(res_info)
        res_info['status'] = kg_info.iloc[0]['status']
        # graph_task_table信息
        task_info = graph_dao.getStatusById([kg_conf_id])
        task_status = None
        if len(task_info) != 0:
            task_status = task_info.iloc[0]['task_status']
        res_info['task_status'] = task_status
        # graph_config_table信息
        config_info = graph_dao.getbyid(kg_conf_id).iloc[0]
        graph_baseInfo = eval(config_info['graph_baseInfo'])[0]
        res_info['graph_des'] = graph_baseInfo['graph_des']
        res_info['graphdb_id'] = graph_baseInfo['graph_db_id']
        res_info['graphdb_address'] = graph_baseInfo['graphDBAddress']
        res_info['mongo_name'] = graph_baseInfo['graph_mongo_Name']
        res_info['graphdb_name'] = graph_baseInfo['graph_DBName']
        res_info['create_time'] = config_info['create_time']
        res_info['update_time'] = config_info['update_time']
        res_info['step_num'] = int(config_info['step_num'])
        res_info['ds'] = config_info['graph_ds']
        res_info['otl'] = config_info['graph_otl']
        res_info['info_ext'] = config_info['graph_InfoExt']
        res_info['kmap'] = config_info['graph_KMap']
        res_info['kmerge'] = config_info['graph_KMerge']
        is_upload = config_info['is_upload']  # 表示图谱是否是上传而来
        res_info['is_import'] = True if is_upload else False
        res_info['display_task'] = False if is_upload and task_status == None else True
        if is_all or ('graphdb_type' in key or 'export' in key):
            graphdb_info = graph_dao.getGraphDBNew(res_info['graphdb_id'])
            if len(graphdb_info) == 0:
                code = codes.Builder_GraphService_GetGraphInfoBasic_GraphDBIdNotExist
                data = Gview2.TErrorreturn(code,
                                           graphdb_id = res_info['graphdb_id'])
                return code, data
            res_info['graphdb_type'] = graphdb_info.iloc[0]['type']
            if is_all or 'export' in key:
                if task_status == 'normal' and res_info['graphdb_type'] == 'nebula':
                    res_info['export'] = True
                else:
                    res_info['export'] = False
        if is_all or 'is_upload' in key:
            upload_id = graph_dao.get_upload_id([graph_id])
            res_info['is_upload'] = (len(upload_id) != 0)  # 该图谱是否处于上传中
        res_info['knowledge_type'] = 'kg'
        if is_all:
            return code, Gview2.json_return(res_info)
        res = {}
        res['id'] = res_info['id']
        res['kg_conf_id'] = res_info['kg_conf_id']
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
    
    def get_graph_info_onto(self, graph_id):
        ret = graph_dao.getbyid(graph_id)
        if len(ret) == 0:
            code = codes.Builder_GraphService_GetGraphInfoOnto_GraphidNotExist
            data = Gview2.TErrorreturn(code,
                                       graphid=graph_id)
            return code, data
        otl_id = eval(ret.iloc[0]['graph_otl'])[0]
        ret = otl_dao.getbyid(otl_id)
        if len(ret) == 0:
            code = codes.Builder_GraphService_GetGraphInfoOnto_OtlidNotExist
            data = Gview2.TErrorreturn(code,
                                       otl_id=otl_id)
            return code, data
        ret = ret.to_dict('records')[0]
        entitys = eval(ret['entity'])
        edges = eval(ret['edge'])
        res = {'entity': [], 'edge': []}
        for e in entitys:
            entity = {}
            entity['name'] = e['name']
            entity['alias'] = e['alias']
            entity['color'] = e['colour']
            entity['entity_id'] = e['entity_id']
            res['entity'].append(entity)
        for e in edges:
            edge = {}
            edge['name'] = e['name']
            edge['alias'] = e['alias']
            edge['color'] = e['colour']
            edge['edge_id'] = e['edge_id']
            edge['relation'] = e['relations']
            res['edge'].append(edge)
        code = codes.successCode
        return code, Gview2.json_return(res)

    def get_graph_info_count(self, graph_id):
        ret = graph_dao.getbyid(graph_id)
        if len(ret) == 0:
            code = codes.Builder_GraphService_GetGraphInfoCount_GraphidNotExist
            data = Gview2.TErrorreturn(code,
                                       graphid=graph_id)
            return code, data
        graph_baseInfo = eval(ret.iloc[0]['graph_baseInfo'])[0]
        graphdb_id = graph_baseInfo['graph_db_id']
        db = graph_baseInfo['graph_DBName']
        graphdb = GraphDB(graphdb_id)
        code, count_res = graphdb.count(db)
        if code != codes.successCode:
            return code, count_res
        edge_count, entity_count, _, entitys_count, edges_count, _, _ = count_res
        res = {}
        res['entity_count'] = entity_count
        res['edge_count'] = edge_count
        res['entity'] = []
        res['edge'] = []
        for k, v in entitys_count.items():
            entity = {}
            entity['name'] = k
            entity['count'] = v
            res['entity'].append(entity)
        for k, v in edges_count.items():
            edge = {}
            edge['name'] = k
            edge['count'] = v
            res['edge'].append(edge)
        return codes.successCode, Gview2.json_return(res)

    def get_graph_info_detail(self, graph_id, type, name):
        res = {'properties': [], 'indexes': []}
        ret = graph_dao.getbyid(graph_id)
        if len(ret) == 0:
            code = codes.Builder_GraphService_GetGraphInfoDetail_GraphidNotExist
            data = Gview2.TErrorreturn(code,
                                       graphid=graph_id)
            return code, data
        graph_baseInfo = eval(ret.iloc[0]['graph_baseInfo'])[0]
        graphdb_id = graph_baseInfo['graph_db_id']
        db = graph_baseInfo['graph_DBName']
        graphdb = GraphDB(graphdb_id)
        # 校验是否存在对应name的点或边
        code, schema_res = graphdb.check_schema(db, name, [], type)
        if code != codes.successCode:
            return code, schema_res
        if not schema_res:
            code = codes.Builder_GraphService_GetGraphInfoDetail_NameNotExist
            return code, Gview2.TErrorreturn(code,
                                             class_type=type,
                                             name=name)
        # 获取属性
        code, properties = graphdb.get_properties(db, type, name)
        if code != codes.successCode:
            return code, properties
        for k, v in properties.items():
            p = {}
            p['name'] = k
            p['type'] = v
            res['properties'].append(p)
        # 获取索引
        _, res_index = graphdb.get_present_index(db)
        present_index_field, present_index_name, present_index_field_unique, present_index_name_unique = res_index
        if name in present_index_field:
            index = {}
            index['name'] = present_index_name[name]
            index['type'] = 'FULLTEXT'
            index['properties'] = present_index_field[name]
            res['indexes'].append(index)
        if name in present_index_field_unique:
            index = {}
            index['name'] = present_index_name_unique[name]
            if graphdb.type == 'nebula':
                index['type'] = 'NEBULA_NATIVE_INDEX'
            elif graphdb.type == 'orientdb':
                index['type'] = 'UNIQUE_HASH_INDEX'
            index['properties'] = present_index_field_unique[name]
            res['indexes'].append(index)
        return code, Gview2.json_return(res)

graph_Service = GraphService()

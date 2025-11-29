# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn

import json
import os
import traceback
import pandas as pd
from flask_babel import gettext as _l
from func_timeout import exceptions
from common.errorcode import codes
from common.errorcode.gview import Gview as Gview2
from dao.async_task_dao import async_task_dao
from dao.dsm_dao import dsm_dao
from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB, SQLProcessor
from dao.knw_dao import knw_dao
from dao.otl_dao import otl_dao
from dao.task_onto_dao import task_dao_onto
from utils.database import DataBase
from utils.Gview import Gview
from utils.Otl_Util import otl_util
from utils.common_response_status import CommonResponseStatus
from utils.log_info import Logger
import common.stand_log as log_oper
import sys

class OtlService(object):
    def showtables(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_id = params_json["ds_id"]
        data = dsm_dao.getdatabyid(ds_id)
        Logger.log_info(data)
        if len(data) != 0:
            data = data[0]
            params_json["ds_password"] = data["ds_password"]
            params_json["new_data_source"] = data["data_source"]
            params_json["ds_user"] = data["ds_user"]
            params_json["ds_address"] = data["ds_address"]
            params_json["ds_port"] = data["ds_port"]
            params_json["ds_path"] = data["ds_path"]
            params_json["ds_auth"] = data["ds_auth"]
            params_json["connect_type"] = data["connect_type"]
            if params_json["new_data_source"] != params_json["data_source"]:
                obj["ErrorCode"] = "Builder.OtlService.ShowTables.DsNotMatch"
                obj["Description"] = _l("Show table False")
                obj["Solution"] = "Please check your parameter again."
                obj["ErrorDetails"] = "data source doesn't match."
                obj["ErrorLink"] = ""
                return 400, obj
        else:
            obj["ErrorCode"] = "Builder.OtlService.ShowTables.DsIdNotExist"
            obj["Description"] = _l("Show table False")
            obj["Solution"] = "Please check your parameter again."
            obj["ErrorDetails"] = "ds_id {} not exists.".format(ds_id)
            obj["ErrorLink"] = ""
            return 400, obj

        if params_json["data_source"] == "mysql":
            try:
                if params_json["connect_type"] == "odbc":
                    count, ret = otl_dao.mysqlOdbcConnect(params_json)
                else:
                    count, ret = otl_dao.mysqlConnect(params_json)
                if count == "-1":
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "解密密码错误"
                    obj["ErrorLink"] = ""
                    return 400, obj
                res = {}
                res["count"] = count
                res["output"] = ret
                obj["res"] = res
                return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "password" in err or "does not have [USE]" in err:
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "User or Password in mysql has error"
                    obj["ErrorLink"] = ""
                    return 400, obj
                obj["ErrorCode"] = "Builder.OtlService.ShowTables.UnknownError"
                obj["Description"] = _l("Show table False")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = "You have error in Mysql"
                obj["ErrorLink"] = ""
                return 500, obj
        elif params_json["data_source"] == "sqlserver":
            try:
                count, ret = otl_dao.sqlServerConnect(params_json)
                if count == "-1":
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "解密密码错误"
                    obj["ErrorLink"] = ""
                    return 400, obj
                res = {}
                res["count"] = count
                res["output"] = ret
                obj["res"] = res
                return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "Login failed for user" in err:
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "User or Password in sqlserver has error"
                    obj["ErrorLink"] = ""
                    return 400, obj
                obj["ErrorCode"] = "Builder.OtlService.ShowTables.UnknownError"
                obj["Description"] = _l("Show table False")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = "You have error in sqlserver"
                obj["ErrorLink"] = ""
                return 500, obj
        elif params_json["data_source"] == "kingbasees":
            try:
                count, ret = otl_dao.kingbaseesConnect(params_json)
                if count == "-1":
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "解密密码错误"
                    obj["ErrorLink"] = ""
                    return 400, obj
                res = {}
                res["count"] = count
                res["output"] = ret
                obj["res"] = res
                return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "password" in err:
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "User or Password in kingbasees has error"
                    obj["ErrorLink"] = ""
                    return 400, obj
                obj["ErrorCode"] = "Builder.OtlService.ShowTables.UnknownError"
                obj["Description"] = _l("Show table False")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = "You have error in kingbasees"
                obj["ErrorLink"] = ""
                return 500, obj
        elif params_json["data_source"] == "hive":
            Logger.log_info("start hive")
            try:
                count, ret = otl_dao.hiveConnect(params_json)
                if count == "-1":
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "解密密码错误"
                    obj["ErrorLink"] = ""
                    return 400, obj
                res = {}
                res["count"] = count
                res["output"] = ret
                obj["res"] = res
                return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.UnknownError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please contact the developers."
                    obj["ErrorDetails"] = "you have an error in your SQL!"
                    obj["ErrorLink"] = ""
                    return 500, obj
                if ("Error" in err and "login" in err) or "does not have [USE]" in err:
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "User or Password in hive has error"
                    obj["ErrorLink"] = ""
                    return 400, obj
                obj["ErrorCode"] = "Builder.OtlService.ShowTables.UnknownError"
                obj["Description"] = _l("Show table False")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = err
                obj["ErrorLink"] = ""
                return 500, obj
        elif params_json["data_source"] == "postgresql":
            try:
                count, ret = otl_dao.postgresConnect(params_json)
                if count == "-1":
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "解密密码错误"
                    obj["ErrorLink"] = ""
                    return 400, obj
                res = {}
                res["count"] = count
                res["output"] = ret
                obj["res"] = res
                return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "password" in err:
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "User or Password in postgresql has error"
                    obj["ErrorLink"] = ""
                    return 400, obj
                obj["ErrorCode"] = "Builder.OtlService.ShowTables.UnknownError"
                obj["Description"] = _l("Show table False")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = "You have error in postgresql"
                obj["ErrorLink"] = ""
                return 500, obj
        elif params_json["data_source"] == "clickhouse":
            try:
                count, ret = otl_dao.clickhouseConnect(params_json)
                if count == "-1":
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "解密密码错误"
                    obj["ErrorLink"] = ""
                    return 400, obj
                res = {}
                res["count"] = count
                res["output"] = ret
                obj["res"] = res
                return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "password" in err:
                    obj["ErrorCode"] = "Builder.OtlService.ShowTables.PasswordError"
                    obj["Description"] = _l("Show table False")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "User or Password in ClickHouse has error"
                    obj["ErrorLink"] = ""
                    return 400, obj
                obj["ErrorCode"] = "Builder.OtlService.ShowTables.UnknownError"
                obj["Description"] = _l("Show table False")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = "You have error in ClickHouse"
                obj["ErrorLink"] = ""
                return 500, obj

    def preview_data(self, params_json):
        # 数据库表展示前100行、前100列，每个数据最多200个字符
        # AS取前20000个字符以表格形式展示
        Logger.log_info("preview data ")
        ret_code = CommonResponseStatus.SUCCESS.value
        ds_id = params_json["ds_id"]
        data = dsm_dao.getdatabyid(ds_id)
        if len(data) != 0:
            data = data[0]
            params_json["ds_password"] = data["ds_password"]
            params_json["new_data_source"] = data["data_source"]
            params_json["ds_user"] = data["ds_user"]
            params_json["ds_address"] = data["ds_address"]
            params_json["ds_port"] = data["ds_port"]
            params_json["ds_path"] = data["ds_path"]
            params_json["ds_auth"] = data["ds_auth"]
            params_json["connect_type"] = data["connect_type"]
            if params_json["new_data_source"] != params_json["data_source"]:
                code = codes.Builder_OtlService_PreviewData_DataSourceInConsistent
                return 500, Gview2.TErrorreturn(code)
        else:
            code = codes.Builder_OtlService_PreviewData_DsIdNotExist
            return 500, Gview2.TErrorreturn(code, ds_id=ds_id)
        if params_json["data_source"] == "mysql":
            try:
                if params_json["connect_type"] == "odbc":
                    ret = otl_dao.mysqlOdbcdatashow(params_json)
                else:
                    ret = otl_dao.mysqldatashow(params_json)
                if ret == "-1":
                    code = codes.Builder_OtlService_PreviewData_PreviewMysqlError
                    cause = 'decipher the password failed.'
                    solution = _l('please check your data source again.')
                    return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
                res = {}
                res['content'] = ret
                property = []
                for p in ret[0]:
                    property.append(otl_util.is_special(p))
                res['property'] = property
                return ret_code, Gview2.json_return(res)
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "password" in err or "does not have [USE]" in err:
                    code = codes.Builder_OtlService_PreviewData_PasswordError
                    cause = _l('the username or password of mysql is incorrect.')
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                if "doesn't exist" in err or "database" in err:
                    code = codes.Builder_OtlService_PreviewData_FileNotExist
                    cause = _l("Mysql does not have this database or table.")
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                code = codes.Builder_OtlService_PreviewData_PreviewMysqlError
                cause = err
                solution = _l("Please contact the developers.")
                return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
        elif params_json["data_source"] == "postgresql":
            try:
                ret = otl_dao.postgresdatashow(params_json)
                if ret == "-1":
                    code = codes.Builder_OtlService_PreviewData_PreviewPostgreSQLError
                    cause = 'decipher the password failed.'
                    solution = _l('please check your data source again.')
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
                res = {}
                res['content'] = ret
                property = []
                for p in ret[0]:
                    property.append(otl_util.is_special(p))
                res['property'] = property
                return ret_code, Gview2.json_return(res)
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "password" in err or "does not have [USE]" in err:
                    code = codes.Builder_OtlService_PreviewData_PasswordError
                    cause = _l('the username or password of postgresql is incorrect.')
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                if "does not exist" in err:
                    code = codes.Builder_OtlService_PreviewData_FileNotExist
                    cause = _l("PostgreSQL does not have this database or table.")
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                code = codes.Builder_OtlService_PreviewData_PreviewMysqlError
                cause = err
                solution = _l("Please contact the developers.")
                
                return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
        elif params_json["data_source"] == "sqlserver":
            try:
                ret = otl_dao.sqlserverdatashow(params_json)
                if ret == "-1":
                    code = codes.Builder_OtlService_PreviewData_PreviewSqlServerError
                    cause = 'decipher the password failed.'
                    solution = _l('please check your data source again.')
                    return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
                res = {}
                res['content'] = ret
                property = []
                for p in ret[0]:
                    property.append(otl_util.is_special(p))
                res['property'] = property
                return ret_code, Gview2.json_return(res)
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "Login failed for user" in err:
                    code = codes.Builder_OtlService_PreviewData_PasswordError
                    cause = _l('the username or password of sqlserver is incorrect.')
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                if "Invalid object name" in err:
                    code = codes.Builder_OtlService_PreviewData_FileNotExist
                    cause = _l("sqlserver does not have this database or table.")
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                code = codes.Builder_OtlService_PreviewData_PreviewSqlServerError
                cause = err
                solution =  _l("Please contact the developers.")
                
                return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
        elif params_json["data_source"] == "kingbasees":
            try:
                ret = otl_dao.kingbaseesdatashow(params_json)
                if ret == "-1":
                    code = codes.Builder_OtlService_PreviewData_PreviewKingbaseesError
                    cause = 'decipher the password failed.'
                    solution = _l('please check your data source again.')
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
                res = {}
                res['content'] = ret
                property = []
                for p in ret[0]:
                    property.append(otl_util.is_special(p))
                res['property'] = property
                
                return ret_code, Gview2.json_return(res)
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "password" in err:
                    code = codes.Builder_OtlService_PreviewData_PasswordError
                    cause = _l('the username or password of kingbasees is incorrect.')
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                if "不存在" in err or "database" in err:
                    code = codes.Builder_OtlService_PreviewData_FileNotExist
                    cause = _l("kingbasees does not have this database or table.")
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                code = codes.Builder_OtlService_PreviewData_PreviewKingbaseesError
                cause = err
                solution =  _l("Please contact the developers.")
                
                return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
        elif params_json["data_source"] == "clickhouse":
            try:
                ret = otl_dao.clickhousedatashow(params_json)
                if ret == "-1":
                    code = codes.Builder_OtlService_PreviewData_PreviewClickHouseError
                    cause = 'decipher the password failed.'
                    solution = _l('please check your data source again.')
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
                res = {}
                res['content'] = ret
                property = []
                for p in ret[0]:
                    property.append(otl_util.is_special(p))
                res['property'] = property
                
                return ret_code, Gview2.json_return(res)
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "password" in err:
                    code = codes.Builder_OtlService_PreviewData_PasswordError
                    cause = _l('the username or password of ClickHouse is incorrect.')
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                if "doesn't exist" in err or "database" in err:
                    code = codes.Builder_OtlService_PreviewData_FileNotExist
                    cause = _l("ClickHouse does not have this database or table.")
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                code = codes.Builder_OtlService_PreviewData_PreviewClickHouseError
                cause = err
                solution = _l("Please contact the developers.")
                
                return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)

        elif params_json["data_source"] == "hive":
            obj = {}
            try:
                ret = otl_dao.hivedatashow(params_json)
                if ret == "-1":
                    code = codes.Builder_OtlService_PreviewData_PreviewHiveError
                    cause = 'decipher the password failed.'
                    solution = _l('please check your data source again.')
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
                res = {}
                res['content'] = ret
                property = []
                for p in ret[0]:
                    property.append(otl_util.is_special(p))
                res['property'] = property
                
                return ret_code, Gview2.json_return(res)
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if ("Error" in err and "login" in err) or "does not have [USE]" in err:
                    code = codes.Builder_OtlService_PreviewData_PasswordError
                    cause = _l('the username or password of hive is incorrect.')
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                if "Table not found" in err or "Database" in err:
                    code = codes.Builder_OtlService_PreviewData_FileNotExist
                    cause = _l("Hive dose not have this database or table.")
                    
                    return 500, Gview2.TErrorreturn(code, cause=cause)
                code = codes.Builder_OtlService_PreviewData_PreviewHiveError
                cause = err
                solution = _l("Please contact the developers.")
                
                return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)

    def ontology_save(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        # 图谱新增本体
        if "graph_id" in params_json:
            knw_id = knw_dao.get_knw_id_by_graph_id(params_json["graph_id"])
            params_json["knw_id"] = knw_id
            params_json["all_task"] = []
            ontology_id = otl_dao.insert_Ontology(params_json)
            obj["ontology_id"] = ontology_id
            
            return ret_code, obj, ontology_id

        # 校验knw_id
        knw_id = params_json.get("knw_id")
        res = knw_dao.check_knw_id(knw_id)
        if len(res) <= 0:
            code = codes.Builder_OtlService_OntologySave_KnwIdNotExist
            
            return 500, Gview2.error_return(code, knw_id=knw_id), -1

        # 本体名称是否存在
        ontology_name = params_json.get("ontology_name")
        res = otl_dao.check_otl_name(ontology_name, knw_id, -1)
        if len(res) > 0:
            code = codes.Builder_OtlService_OntologySave_OtlNameDuplicate
            
            return 500, Gview2.error_return(code, name=ontology_name), -1

        # 是否保存为草稿
        if params_json.get("temp_save"):
            otl_temp = dict()
            otl_temp["entity"] = params_json["entity"]
            otl_temp["edge"] = params_json.get("edge", [])
            params_json["otl_temp"] = [otl_temp]
            params_json["entity"] = []
            params_json["edge"] = []
        else:
            params_json["otl_temp"] = []

        ontology_id = otl_dao.insert_Ontology(params_json)
        obj["ontology_id"] = ontology_id
        
        return ret_code, obj, ontology_id

    def edit_ontology(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        ret_message = "edit success !"
        # 校验otl_id
        otl_id = params_json["otl_id"]
        res = otl_dao.getbyid(otl_id)
        if len(res) <= 0:
            code = codes.Builder_OtlService_EditOntology_OtlIdNotExist
            
            return 500, Gview2.error_return(code, ontology_id=otl_id)

        # 本体名称是否存在
        otl_name = params_json.get("ontology_name")
        knw_id = res[0]["knw_id"]
        res = otl_dao.check_otl_name(otl_name, knw_id, otl_id)
        if len(res) > 0:
            code = codes.Builder_OtlService_OntologyEdit_OtlNameDuplicate
            
            return 500, Gview2.error_return(code, name=otl_name)

        # 是否保存为草稿
        if params_json.get("temp_save"):
            otl_temp = dict()
            otl_temp["entity"] = params_json["entity"]
            otl_temp["edge"] = params_json.get("edge", [])
            params_json["otl_temp"] = [otl_temp]
        else:
            params_json["otl_temp"] = []

        # 若为覆盖，则删除与本体关联的任务
        if params_json.get('cover'):
            task_dao_onto.delete_otl_task_by_id([otl_id])
            params_json["all_task"] = []
        else:
            all_data = task_dao_onto.get_all_by_otlid(otl_id)
            alltask = [info["task_id"] for info in all_data]
            params_json["all_task"] = alltask

        otl_dao.edit_ontology(params_json)
        
        return ret_code, ret_message

    def delete_ontology(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        # 校验knw_id
        knw_id = params_json.get("knw_id")
        res = knw_dao.check_knw_id(knw_id)
        if len(res) <= 0:
            code = codes.Builder_OtlService_DeleteOntology_KnwIdNotExist
            
            return 500, Gview2.error_return(code, knw_id=knw_id)

        otl_ids = params_json["otl_ids"]
        new_otl_ids = otl_dao.get_ids_in_ontology_library(otl_ids, knw_id)
        new_otl_ids = [id_dict["id"] for id_dict in new_otl_ids]
        if len(set(new_otl_ids)) < len(set(otl_ids)):
            # 本体id已经经网关过滤过，传进来的都是有删除权限的（本体库中的本体）
            code = codes.Builder_OtlService_DeleteOntology_OtlNotExistInKnw
            
            return 500, Gview2.error_return(code, otl_id=set(otl_ids) - set(new_otl_ids), knw_id=knw_id)
        # 删除本体及其任务
        if len(new_otl_ids) > 0:
            otl_dao.delete(new_otl_ids)
            task_dao_onto.delete_otl_task_by_id(new_otl_ids)
        
        return ret_code, {"otl_ids": new_otl_ids}

    def predict_ontology(self, params_json):
        graph_id = params_json['graph_id']
        ds_id = int(params_json["ds_id"])
        extract_type = params_json["extract_type"]
        ds_dict = graph_dao.getdsgraphuse(graph_id)
        if len(ds_dict) == 0:
            code = codes.Builder_OtlService_PredictOntology_GraphIdNotExist
            return 500, Gview2.TErrorreturn(code, graph_id=graph_id)
        ds_dict = ds_dict[0]
        used_ds_list = eval(ds_dict["graph_ds"])
        if ds_id not in used_ds_list:
            code = codes.Builder_OtlService_PredictOntology_DsIdNotExist
            return 500, Gview2.TErrorreturn(code, ds_id=ds_id)
        data = dsm_dao.getdatabyid(ds_id)
        data = data[0]
        params_json["ds_password"] = data["ds_password"]
        params_json["new_data_source"] = data["data_source"]
        params_json["ds_user"] = data["ds_user"]
        params_json["ds_address"] = data["ds_address"]
        params_json["ds_port"] = data["ds_port"]
        params_json["ds_path"] = data["ds_path"]
        params_json["ds_auth"] = data["ds_auth"]
        params_json["ds_name"] = data["ds_name"]
        params_json["connect_type"] = data["connect_type"]
        if params_json["new_data_source"] != params_json["data_source"]:
            code = codes.Builder_OtlService_PredictOntology_DataSourceInConsistent
            return 500, Gview2.TErrorreturn(code)
        if extract_type == "standardExtraction":
            # 标准抽取
            new_params_json = params_json
            try:
                # 文件夹迭选
                # 获取文件
                new_params_json['file_list'] = [new_params_json['file']]
                file_list = new_params_json["file_list"]
                tablelist = []

                for i in range(len(file_list)):
                    if new_params_json["data_source"]:
                        tablelist.append([str(file_list[i]),
                                          str(new_params_json["ds_path"]),
                                          str(new_params_json["ds_name"]),
                                          "running",
                                          str(new_params_json["data_source"])])
                    # table_list example: [[表名, 数据源路径, 数据源名, 'running', 数据源类型]]
                new_params_json["table_list"] = tablelist
                if len(new_params_json["table_list"]) == 0:
                    res = {}
                    res["entity_list"] = []
                    res["entity_property_dict"] = []
                    res["entity_relation_set"] = []
                    res["entity_main_table_dict"] = []
                    res["relation_main_table_dict"] = []
                    res["relation_property_dict"] = []
                    res["extract_type"] = "标准抽取"
                    return 200, Gview2.json_return(res)
                else:
                    if len(new_params_json["table_list"]) > 100:
                        new_params_json["table_list"] = new_params_json["table_list"][0:100]
                    new_relation_property_dict = []
                    new_relation_main_table = []
                    new_relation_set = []
                    try: # hive,masql [a,b,c]
                        new_params_json["newtablelist"] = new_params_json["table_list"]
                        code_extract, res_extract = DataBase(new_params_json).get_entity_edge(new_params_json)
                        if code_extract != CommonResponseStatus.SUCCESS.value:
                            code = codes.Builder_OtlService_PredictOntology_GetExtractionRulesFailed
                            cause = res_extract['cause']
                            solution = _l("Please contact the developers.")
                            return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
                        new_entity_list = res_extract["res"]["entity_list"]
                        new_entity_property_dict = res_extract["res"]["entity_property_dict"]
                        new_entity_for_table_dict = res_extract["res"]["entity_main_table_dict"]

                        res = {}
                        res["entity_list"] = [list(t) for t in set(tuple(_) for _ in new_entity_list)]
                        res["entity_property_dict"] = new_entity_property_dict
                        res["entity_relation_set"] = new_relation_set
                        res["entity_main_table_dict"] = new_entity_for_table_dict
                        res["relation_main_table_dict"] = new_relation_main_table
                        res["relation_property_dict"] = new_relation_property_dict
                        res["extract_type"] = "标准抽取"
                        return 200, Gview2.json_return(res)
                    except Exception as e:
                        code = codes.Builder_OtlService_PredictOntology_GetExtractionRulesFailed
                        cause = repr(e)
                        solution = _l("Please contact the developers.")
                        return 500, Gview2.TErrorreturn(code, cause=cause, solution=solution)
            except Exception as e:
                traceback.print_exc()
                code = codes.Builder_OtlService_PredictOntology_UnknownError
                return 500, Gview2.TErrorreturn(code, description=repr(e), cause=repr(e))

    # 本体列表 遍历处理
    def optotl(self, rec_dict):
        """
        本体列表 遍历处理

        返回值由字符串转换为对应的格式: used_task, all_task
        增加返回值:
            entitynums: 实体类数量
            edgenums: 关系类数量
            otl_id: 本体id
            usedotlname: 使用该本体的图谱名称
            sum: 实体类数量与关系类数量之和

        Args:
            rec_dict: 本体列表 list of dict。包括从ontology_table中取出的全部信息和用户和时间信息
        """
        reslists = []
        # 遍历本体库
        for reslist in rec_dict:
            resdict = {}
            entitynums = 0
            # 遍历每条 dict
            for key in reslist:
                value = reslist[key]
                if key == "entity":
                    value = eval(value)
                    entitynums = len(value)
                    resdict["entitynums"] = entitynums
                elif key == "edge":
                    edgenums = len(eval(value))
                    resdict["edgenums"] = len(eval(value))
                elif key == "id":
                    Logger.log_info(value)
                    resdict["otl_id"] = value
                    usedotlid = graph_dao.getdatabyotlid(str(value))
                    if len(usedotlid) != 0:
                        otlid = str(usedotlid[0])
                    else:
                        otlid = "-"
                    resdict["usedotlname"] = otlid
                elif key == "used_task" or key == "all_task":
                    resdict[key] = eval(value)
                else:
                    resdict[key] = value
            resdict["sum"] = entitynums + edgenums
            reslists.append(resdict)
        return reslists

    def getall(self, args):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        # 校验knw_id
        knw_id = args.get("knw_id")
        res = knw_dao.check_knw_id(knw_id)
        if len(res) <= 0:
            code = codes.Builder_OtlService_GetAll_KnwIdNotExist
            
            return 500, Gview2.error_return(code, knw_id=knw_id)
        count = otl_dao.get_count(args)
        otls_list = otl_dao.get_otls_list(args)
        for otl in otls_list:
            entity = eval(otl.pop("entity"))
            otl["domain"] = eval(otl["domain"])
            otl["entity_num"] = len(entity)
            otl["edge_num"] = len(eval(otl.pop("edge")))
            otl["is_temp"] = False if otl.pop("otl_temp") == "[]" else True
            otl["saved"] = True if entity else False
        obj["count"] = count
        obj["otls"] = otls_list
        
        return ret_code, obj

    def get_by_id(self, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        res = otl_dao.getbyid(otl_id)
        if len(res) <= 0:
            code = codes.Builder_OtlService_GetById_OtlIdNotExist
            return 500, Gview2.error_return(code, ontology_id=otl_id)
        otl = res[0]
        for key, value in otl.items():
            if key in ["entity", "edge", "used_task", "all_task", "otl_temp", "domain", 'canvas']:
                if value:
                    otl[key] = eval(value)
        return ret_code, otl

    def delete(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        message = ""
        obj = {}
        flag_code = False
        ids = params_json["otlids"]
        ids = set(ids)
        try:
            res = otl_dao.getbyids(ids)
            res_ids = []
            for id in res:
                res_ids.append(id["id"])
            ret_list = list(set(ids) ^ set(res_ids))
            # 不存在的 id
            if len(ret_list) > 0:
                flag_code = True
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                message += "%s not exist!" % ",".join('%s' % id2 for id2 in ret_list)

            if len(res) > 0:
                useds = graph_dao.getdsgraphuse_otl()
                used_list = []
                for used in useds:
                    used = used.get("graph_otl")
                    if used:
                        used_list.append(int(used))

                # 使用中所有的和参数中存在的id 交集 不能删除
                use_list = list(set(res_ids).intersection(set(used_list)))
                # 参数中存在的id和不能删除的差集 可删除
                unuse_list = list(set(res_ids) ^ set(use_list))
                if len(unuse_list) > 0:
                    ret = otl_dao.delete(unuse_list)
                    #####删除本体相关任务##########
                    task_data = task_dao_onto.get_otl_task_list(unuse_list)
                    if len(task_data) > 0:
                        for row in task_data:
                            task_id = row["task_id"]
                            task_dao_onto.delete_otl_task(task_id)

                    if ret == 0:
                        ids = unuse_list
                        message += "success delete otlids  %s !" % ",".join('%s' % id2 for id2 in ids)
                    else:
                        ids = unuse_list
                        message += "failed delete dsids  %s !" % ",".join('%s' % id2 for id2 in ids)

                if len(use_list) > 0:
                    flag_code = True
                    ret_code = CommonResponseStatus.DELETE_USEDDS_ERROR.value
                    message += "%s is used cannot del!" % ",".join('%s' % id2 for id2 in use_list)
            if flag_code:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = message
                obj['code'] = CommonResponseStatus.DELETE_USEDDS_ERROR.value
                obj['message'] = "delete fail!"
            else:
                obj["res"] = "success delete dsids %s !" % ids
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "delete %s failed!" % ",".join('%s' % id2 for id2 in ids)
        return ret_code, obj

    def update_name(self, otl_id, params_json, host_url, flag):
        ret_code = CommonResponseStatus.SUCCESS.value
        ret_message = 'update name success!'
        res = otl_dao.getbyid(otl_id)
        # 本体不存在
        if len(res) == 0:
            code = codes.Builder_OtlService_UpdateName_OtlIdNotExist    
            return 500, Gview2.error_return(code, ontology_id=otl_id)

        # 本体名称是否存在
        otl_name = params_json.get("ontology_name")
        knw_id = res[0]["knw_id"]
        res = otl_dao.check_otl_name(otl_name, knw_id, otl_id)
        if len(res) > 0:
            code = codes.Builder_OtlService_UpdateName_OtlNameDuplicate
            
            return 500, Gview2.error_return(code, name=otl_name)
        otl_dao.update_name(otl_id, params_json)
        return ret_code, ret_message

    def update_info(self, otl_id, params_json, host_url, flag, grapid=None):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            res = otl_dao.getbyid(otl_id)
            otl_id = params_json["ontology_id"]
            flag_save = params_json["flag"]
            all_data = task_dao_onto.get_all_by_otlid(otl_id)
            alltask = [info["task_id"] for info in all_data]
            params_json["all_task"] = alltask
            running_task = [info["task_status"] for info in all_data]
            if "running" in running_task:
                if flag_save == "nextstep":
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = _l("Operation failed, importing entities in bulk, please try again later")
                    obj['code'] = CommonResponseStatus.CANT_SAVE_OTL.value
                    obj['message'] = "insert fail"
                    
                    return ret_code, obj

            # 实体与关系不改变，不更新update_time
            otl_info = otl_dao.getbyid(otl_id)
            old_entity = set([entity["name"] for entity in eval(otl_info[0]["entity"])])
            old_edge = set([edge["name"] for edge in eval(otl_info[0]["edge"])])
            new_entity = set([entity["name"] for entity in params_json["entity"]])
            new_edge = set([edge["name"] for edge in params_json["edge"]])
            if not (list(old_entity - new_entity) or list(new_entity - old_entity)
                    or list(old_edge - new_edge) or list(new_edge - old_edge)):
                params_json["update_time"] = otl_info[0]["update_time"]

            # 本体不存在
            if len(res) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "id  %s not exist!" % otl_id
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "update fail"
                
                return ret_code, obj
            # 不可编辑
            else:
                graph_otl = graph_dao.getdatabyotlid(str(otl_id))
                if len(graph_otl) != 0:
                    if flag == "-1":
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "id  %s can not be edit !" % otl_id
                        obj['code'] = CommonResponseStatus.EDIT_USED_ERROR.value  # 加新状态码
                        obj['message'] = "update fail"
                        
                        return ret_code, obj

                    else:
                        otl_dao.update_info(otl_id, params_json, grapid)
                        obj["res"] = "update "
                        
                else:
                    otl_dao.update_info(otl_id, params_json, grapid)
                    obj["res"] = "update "
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['cause'] = "database already have the same name"
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "update fail"
            
        return ret_code, obj

    def getotlbyname(self, otlname, params_json, host_url):
        """ 根据本体名称获取本体信息"""
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            res = {}
            rec_dict = otl_dao.getbyname(otlname)
            list_all = []
            for reslist in rec_dict:
                dict_all = {}
                for key in reslist:
                    if key == "entity" or key == "edge":
                        value = reslist[key]
                        value = eval(value)
                        dict_all[key] = value
                    else:
                        dict_all[key] = reslist[key]
                list_all.append(dict_all)

            res["df"] = list_all
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "query ontology fail"
        return ret_code, obj

    def getds(self, kgIds):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            count = dsm_dao.getCounts1(kgIds)
            res = {}
            rec_dict = dsm_dao.getdsbyid(kgIds)
            res["count"] = count
            res["df"] = rec_dict
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert connection fail"
        return ret_code, obj

    def getAllOtlIds(self):
        ret_code = CommonResponseStatus.SUCCESS.value
        try:
            dfs = otl_dao.getAllOtlId()
            otlIds = [df.get("id") for df in dfs]
            return otlIds, ret_code
        except Exception as e:
            obj = {}
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            obj['message'] = "mysql connection error "
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            return obj, ret_code

    # 根据本体id查询本体状态
    def getOtlStatus(self, otlid):
        try:
            res = otl_dao.getOtlStatusbyid(otlid)
            status = res[0].get("otl_status")
            return status, 200
        except Exception as e:
            obj = {}
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            obj['message'] = "mysql connection error "
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            return obj, ret_code

    # 保存复制的本体数据
    def saveCopyOtl(self, args, params_json):
        obj = {}
        try:
            # 本体名称是否存在
            ontology_name = params_json.get("ontology_name")
            res = otl_dao.get_ontology(ontology_name)
            if len(res) > 0:
                obj['cause'] = "Ontology name already existed "
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                obj['message'] = "insert fail"

                return 500, obj, -1
            otlid = otl_dao.insertCopyOtl(args, params_json)

            return 200, "copy success", otlid
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert fail"
            if "Duplicate entry" in err:
                obj['cause'] = "database already have the same name"
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                obj['message'] = "insert fail"
            else:
                obj['cause'] = " You have error in Mysql"

            return ret_code, obj, -1

    # 根据本体名称获取本体id
    def getOtlId(self, otl_name):
        try:
            res = otl_dao.getOtlIdbyname(otl_name)
            if len(res) == 0:
                return -1, 200
            otlid = res[0].get("id")
            return otlid, 200
        except Exception as e:
            obj = {}
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            obj['message'] = "mysql connection error "
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value

            return obj, ret_code

    # 根据kgid查询本体id
    def getOtlIdbyKGId(self, kgid):
        graph_info = graph_dao.getbyid(kgid)
        if len(graph_info) == 0:
            return 500, Gview.TErrorreturn(
                ErrorCode='Builder.service.ontology.getOtlIdbyKGId.kgidNotExists',
                Description="kgid {} not exist!".format(kgid),
                ErrorDetails="kgid {} not exist!".format(kgid),
                Solution='Please check mariaDB.',
                ErrorLink=''
            )
        graph_otl = graph_info[0]["graph_otl"]
        if graph_otl == "":
            return 500, Gview.TErrorreturn(
                ErrorCode='Builder.service.ontology.getOtlIdbyKGId.otlidNotExists',
                Description="kgid {} does not have ontology.".format(kgid),
                ErrorDetails="kgid {} does not have ontology.".format(kgid),
                Solution=f'Please config ontology for graph where kgid={kgid}',
                ErrorLink=''
            )
            
        return 200, graph_otl

    def filterotl(self, kgid, ret_otl):
        '''过滤本体中不在图数据库中的点或边'''
        # 根据kgid获取graphdb信息
        graph_info = graph_dao.getbyid(kgid)
        graph_baseInfo = eval(graph_info[0]['graph_baseInfo'])
        db = graph_baseInfo['graph_DBName']
        graphdb = GraphDB()
        code, graph_shema = graphdb.get_schema(db)
        otl_filtered = ret_otl.copy()
        otl_filtered['entity'] = []
        otl_filtered['edge'] = []
        entity_names = []
        for aentity in ret_otl['entity']:
            if aentity['name'] in graph_shema['entity']:
                otl_filtered['entity'].append(aentity)
                entity_names.append(aentity['name'])
        for aedge in ret_otl['edge']:
            if aedge['name'] in graph_shema['edge']:
                # 过滤不合法的边
                if aedge['relations'][0] in entity_names and aedge['relations'][2] in entity_names:
                    otl_filtered['edge'].append(aedge)
            
        return CommonResponseStatus.SUCCESS.value, Gview2.json_return(otl_filtered)

    def get_import_task(self, celery_task_id):
        task_list = async_task_dao.query({"celery_task_id": celery_task_id, "task_type": "import_onto"})
        if len(task_list) == 0:
            code = codes.Builder_OtlService_GetImportTask_CeleryTaskIdNotExists
            return 500, Gview2.TErrorreturn(code, celery_task_id=celery_task_id)
        return 200, Gview2.json_return(task_list[0])

    def export_onto(self, otl_id, format, language):
        '''
        导出本体文件
        Args:
            otl_id: 本体id
            format: 文件格式 xlsx json
            language: 语言 en zh

        Returns:
            code
            res:
                file_path
                file_name
        '''
        file_path = '/tmp/'
        if os.name == 'nt':
            file_path = 'C:/Users/Public/Downloads/'
        ret = otl_dao.getbyid(otl_id)
        if len(ret) == 0:
            code = codes.Builder_OtlService_ExportOnto_OtlIdNotExist
            
            return 500, Gview2.TErrorreturn(code, otl_id=otl_id)
        if not ret[0]['identify_id'] or not ret[0]['ontology_name']:
            code = codes.Builder_OtlService_ExportOnto_OtlIdNotInOtlLibrary
            
            return 500, Gview2.TErrorreturn(code, otl_id=otl_id)
        ontology = ret[0]
        ontology['entity'] = eval(ontology['entity'])
        ontology['edge'] = eval(ontology['edge'])
        ontology['domain'] = eval(ontology['domain'])
        if format == 'xlsx':
            file_name = '{}.xlsx'.format(ontology['ontology_name'])
            self.export_onto_xlsx(ontology, os.path.join(file_path, file_name), language)
            
            return 200, {'file_path': file_path, 'file_name': file_name}
        elif format == 'json':
            ontology_res = {
                "ontology_name": ontology['ontology_name'],
                "ontology_des": ontology.get('ontology_des'),
                "domain": ontology.get('domain'),
                'entity': [
                    {
                        "name": entity.get('name'),
                        "entity_id": entity.get('entity_id'),
                        "alias": entity.get('alias', ''),
                        "description": entity.get('description', ''),
                        "synonym": entity.get('synonym', ''),
                        "shape": entity.get('shape', ''),
                        "icon": entity.get('icon', ''),
                        "size": entity.get('size', ''),
                        "fill_color": entity.get('fill_color', ''),
                        "stroke_color": entity.get('stroke_color', ''),
                        "text_color": entity.get('text_color', ''),
                        "text_type": entity.get('text_type', ''),
                        "text_width": entity.get('text_width', ''),
                        "x": entity.get('x', ''),
                        "y": entity.get('y', ''),
                        "text_position": entity.get('text_position', ''),
                        "icon_color": entity.get('icon_color', ''),
                        "properties": [
                            {
                                "name": property.get('name'),
                                "description": property.get('description', ''),
                                "alias": property.get('alias', ''),
                                "data_type": property.get('data_type'),
                                "synonym": property.get('synonym', ''),
                            }
                            for property in entity.get('properties')
                        ],
                        "default_tag": entity.get('default_tag', ''),
                        "properties_index": entity.get('properties_index', []),
                        "primary_key": entity.get('primary_key', []),
                        "vector_generation": entity.get('vector_generation', [])
                    }
                    for entity in ontology.get('entity')
                ],
                'edge': [
                    {
                        "name": edge.get('name'),
                        "edge_id": edge.get('edge_id'),
                        "alias": edge.get('alias', ''),
                        "relations": edge.get('relations'),
                        "description": edge.get('description', ''),
                        "synonym": edge.get('synonym', ''),
                        "colour": edge.get('colour', ''),
                        "shape": edge.get('shape', ''),
                        "width": edge.get('width', ''),
                        "properties_index": edge.get('properties_index', []),
                        "default_tag": edge.get('default_tag', ''),
                        "properties": [
                            {
                                "name": property.get('name'),
                                "description": property.get('description', ''),
                                "alias": property.get('alias', ''),
                                "data_type": property.get('data_type'),
                                "synonym": property.get('synonym', ''),
                            }
                            for property in edge.get('properties', [])
                        ]
                    }
                    for edge in ontology.get('edge')
                ]
            }
            file_name = "{}.json".format(ontology['ontology_name'])
            file_handler = open(file=os.path.join(file_path, file_name), mode="w")
            json.dump(ontology_res, file_handler)
            file_handler.close()
            
            return 200, {'file_path': file_path, 'file_name': file_name}

    def export_onto_xlsx(self, ontology, file_name, language):
        writer = pd.ExcelWriter(file_name)
        book = writer.book

        # 样式
        default = book.add_format({'align': 'left',  # 左对齐
                                   'valign': 'vcenter',  # 垂直居中
                                   'font': '微软雅黑',
                                   'font_size': 10,
                                   'text_wrap': True,
                                   'border': 1})
        bold = book.add_format({'align': 'left',  # 左对齐
                                'valign': 'vcenter',  # 垂直居中
                                'font': '微软雅黑',
                                'font_size': 10,
                                'bold': True})
        bold_red = book.add_format({'align': 'left',  # 左对齐
                                    'valign': 'vcenter',  # 垂直居中
                                    'font': '微软雅黑',
                                    'font_size': 10,
                                    'bold': True,
                                    'font_color': '#FF0000'})
        bg_yellow = book.add_format({'align': 'left',  # 左对齐
                                     'valign': 'vcenter',  # 垂直居中
                                     'font': '微软雅黑',
                                     'font_size': 10,
                                     'bg_color': '#FFF2CC',
                                     'text_wrap': True,
                                     'border': 1})
        bg_pink = book.add_format({'align': 'left',  # 左对齐
                                   'valign': 'vcenter',  # 垂直居中
                                   'font': '微软雅黑',
                                   'font_size': 10,
                                   'bg_color': '#FCE4D6',
                                   'bold': True,
                                   'border': 1})
        bg_blue = book.add_format({'align': 'left',  # 左对齐
                                   'valign': 'vcenter',  # 垂直居中
                                   'font': '微软雅黑',
                                   'font_size': 10,
                                   'bg_color': '#D9E1F2',
                                   'bold': True,
                                   'border': 1})

        # --------------- sheet1 本体配置 ---------------
        if language == 'zh':
            sheet1 = book.add_worksheet('本体配置')
        else:
            sheet1 = book.add_worksheet('Ontology Configuration')
        # 行高
        row_height = 71
        for row_num in range(4):
            sheet1.set_row(row_num, row_height)
        # 列宽
        sheet1.set_column(0, 0, 15)
        sheet1.set_column(1, 1, 50)
        sheet1.set_column(2, 2, 64)
        # 合并单元格
        sheet1.merge_range('A1:C1', '')
        # 内容
        if language == 'zh':
            sheet1.write_rich_string('A1',
                                     bold, '注意事项：\n',
                                     default, '1.请务必准确填写必填项\n' \
                                              '2.必填项不能为空，若为空则将会被跳过\n' \
                                              '3.表格顺序及结构不允许被修改。修改会直接导致失败',
                                     bg_yellow)
            sheet1.write_rich_string('A2',
                                     bold_red, '*',
                                     bold, '本体命名',
                                     bg_pink)
            sheet1.write('A3', '本体描述', bg_blue)
            sheet1.write('A4', '本体所属领域', bg_blue)
            sheet1.write('B2', ontology['ontology_name'], default)
            sheet1.write('B3', ontology['ontology_des'], default)
            sheet1.write('B4', '|'.join(ontology['domain']), default)
            sheet1.write_rich_string('C2',
                                     bold_red, '1.必填\n',
                                     default, '2.仅支持中文、英文及下划线\n' \
                                              '3.同一知识网络中本体命名不能重复\n' \
                                              '4.字符长度1～50',
                                     default)
            sheet1.write_column('C3',
                                ['1.选填\n' \
                                 '2.定义或备注说明\n' \
                                 '3.字符长度1～150\n' \
                                 '4.支持输入中英文、数字和键盘上的特殊符号',
                                 '1.选填\n' \
                                 '2.可填多个，用"|"分隔\n' \
                                 '3.仅支持中英文、数字'
                                 ],
                                default)
        else:
            sheet1.write_rich_string('A1',
                                     bold, 'Note:\n',
                                     default, '1. Please make sure to enter the required fields accurately\n' \
                                              '2. The required fields must not be null and will be skipped if they are null\n' \
                                              '3. The order and structure of the form are not allowed to be modified. And it will lead to a failure of importing ontologies if modified',
                                     bg_yellow)
            sheet1.write_rich_string('A2',
                                     bold_red, '*',
                                     bold, 'Ontology Naming',
                                     bg_pink)
            sheet1.write('A3', 'Ontology Description', bg_blue)
            sheet1.write('A4', 'Ontology Domain Affiliated', bg_blue)
            sheet1.write('B2', ontology['ontology_name'], default)
            sheet1.write('B3', ontology['ontology_des'], default)
            sheet1.write('B4', '|'.join(ontology['domain']), default)
            sheet1.write_rich_string('C2',
                                     bold_red, '1. Required field\n',
                                     default, '2. Only support Chinese, English, and underscores\n' \
                                              '3. No duplication of ontology name in the same knowledge network\n' \
                                              '4. Character length 1-50',
                                     default)
            sheet1.write_column('C3',
                                ['1. Optional field\n' \
                                 '2. Definition or note\n' \
                                 '3. Character length 1-150\n' \
                                 '4. Only support Chinese, English, numbers, and special symbols on the keyboard',
                                 '1. Optional field\n' \
                                 '2. You can enter multiple domains which could be separated by "|"\n' \
                                 '3. Only support Chinese, English, and numbers'
                                 ],
                                default)

        # --------------- sheet2 实体类定义 ---------------
        if language == 'zh':
            sheet2 = book.add_worksheet('实体类定义')
        else:
            sheet2 = book.add_worksheet('Entity Class Definition')
        # 行高
        sheet2.set_row(0, 85)
        # 列宽
        col_width = [34, 30, 20, 20, 25, 25, 30, 30, 30, 25, 25, 25, 25, 25, 25, 25]
        for i in range(len(col_width)):
            sheet2.set_column(i, i, col_width[i])
        # 内容
        if language == 'zh':
            sheet2.write_rich_string('A1',
                                     bold_red, '1.必填\n',
                                     default, '2.同一个本体中实体类名称不可重复\n' \
                                              '3.仅支持大写字母、小写字母、数字及下划线\n' \
                                              '4.字符长度1～50',
                                     default)
            sheet2.write_row('B1',
                             [
                                 '1.选填（未填写时系统自动生成）\n' \
                                 '2.同一个本体中实体类显示名不可重复\n' \
                                 '3.仅支持中英文、数字及下划线\n' \
                                 '4.字符长度1～50',
                                 '1.选填\n' \
                                 '2.定义或备注说明\n' \
                                 '3.仅支持输入中英文、数字和键盘上的特殊符号\n' \
                                 '4.字符长度1～150',
                                 '1.选填\n' \
                                 '2.可填写多个，用|隔开\n' \
                                 '3.仅支持中英文、数字及下划线\n' \
                                 '4.字符长度1～50',
                                 '1.选填：circle\n' \
                                 '（未填写时系统自动生成：circle)',
                                 '1.选填\n' \
                                 '2.格式如：',
                                 '1.选填：0.25x、0.5x、1x、2x、4x\n' \
                                 '（未填写时系统自动生成：0.5x）\n',
                                 '2.实体类的大小倍数'
                                 '1.选填\n' \
                                 '(未填写时系统自动生成）\n' \
                                 '2.格式如：rgba(0,0,0,0.8)',
                                 '1.选填\n' \
                                 '(未填写时系统自动生成）\n' \
                                 '2.格式如：rgba(0,0,0,0.8)',
                                 '1.选填\n' \
                                 '(未填写时系统自动生成:rgba(0,0,0,0.8))\n' \
                                 '2.格式如：rgba(0,0,0,0.8)',
                                 '1.当形状为circle时只能选adaptive',
                                 '1.选填\n' \
                                 '2.格式如：\n' \
                                 '（未填写时系统自动生成）',
                                 '1.选填\n' \
                                 '2.格式如：\n' \
                                 '（未填写时系统自动生成）',
                                 '1.选填\n' \
                                 '2.格式如：\n' \
                                 '（未填写时系统自动生成）',
                                 '1.选填：top、center、left、right、bottom\n' \
                                 '（未填写时系统自动生成：top）',
                                 '1.选填\n' \
                                 '(未填写时系统自动生成)\n' \
                                 '2.格式如：rgba(0,0,0,0.8)',
                             ],
                             default)
            sheet2.write_rich_string('A2',
                                     bold_red, '*',
                                     bold, '实体类名',
                                     bg_pink)
            sheet2.write_row('B2',
                             [
                                 '实体类显示名', '实体类描述', '实体类名同义词', '形状', '图标',
                                 '大小', '填充颜色', '描边颜色', '文字颜色', '文字固定或自适应', '文字宽度',
                                 '位置（x坐标）', '位置（y坐标）', '文字位置', '图标颜色'
                             ],
                             bg_blue)
        else:
            sheet2.write_rich_string('A1',
                                     bold_red, '1. Required field\n',
                                     default, '2. No duplication of entity class name in the same ontology\n' \
                                              '3. Only support uppercase and lowercase letters, numbers, and underscores\n' \
                                              '4. Character length 1-50',
                                     default)
            sheet2.write_row('B1',
                             [
                                 '1. Optional field (generated automatically when not entered)\n' \
                                 '2. No duplication of entity class show name in the same ontology\n' \
                                 '3. Only support Chinese, English, numbers, and underscores\n' \
                                 '4. Character length 1-50',
                                 '1. Optional field\n' \
                                 '2. Definition or note\n' \
                                 '3. Only support Chinese, English, numbers, and special symbols on the keyboard\n' \
                                 '4. Character length 1-150',
                                 '1. Optional field\n' \
                                 '2. You can enter multiple domains which could be separated by "|"\n' \
                                 '3. Only support Chinese, English, numbers, and underscores\n' \
                                 '4. Character length 1-50',
                                 '1. Optional field: circle\n' \
                                 '(generates "circle" automatically when not entered)',
                                 '1. Optional field\n' \
                                 '2. Format example:',
                                 '1. Optional field: 0.25x, 0.5x, 1x, 2x, 4x\n' \
                                 '(generates "0.5x" automatically when not entered)\n',
                                 '2. The size multiple of the entity class'
                                 '1. Optional field\n' \
                                 '(generated automatically when not entered)\n' \
                                 '2. Format example: rgba(0,0,0,0.8)',
                                 '1. Optional field\n' \
                                 '(generated automatically when not entered)\n' \
                                 '2. Format example: rgba(0,0,0,0.8)',
                                 '1. Optional field\n' \
                                 ' (generates "rgba(0,0,0,0.8)" automatically when not entered)\n' \
                                 '2. Format example: rgba(0,0,0,0.8)',
                                 '1. Only "adaptive" can be selected when the shape is "circle"',
                                 '1. Optional field\n' \
                                 '2. Format example:\n',
                                 '(generated automatically when not entered)\n' \
                                 '1. Optional field\n' \
                                 '2. Format example:\n',
                                 '(generated automatically when not entered)\n' \
                                 '1. Optional field\n' \
                                 '2. Format example:\n',
                                 '(generated automatically when not entered)\n' \
                                 '1. Optional field: top, center, left, right, bottom\n' \
                                 '(generates "top" automatically when not entered)',
                                 '1. Optional field\n' \
                                 '(generated automatically when not entered)\n' \
                                 '2. Format example: rgba(0,0,0,0.8)',
                             ],
                             default)
            sheet2.write_rich_string('A2',
                                     bold_red, '*',
                                     bold, 'Entity Class Name',
                                     bg_pink)
            sheet2.write_row('B2',
                             [
                                 'Entity Class Show Name', 'Entity Class Description', 'Entity Class Name Synonyms',
                                 'Shape', 'Icon', 'Size', 'Fill Color', 'Stroke Color', 'Text Color',
                                 'Text Fixed or Adaptive', 'Text Width', 'Location (x-coordinate)',
                                 'Location (y-coordinate)', 'Text Location', 'Icon Color'
                             ],
                             bg_blue)
        properties = []
        for i, entity in enumerate(ontology['entity']):
            values = [entity.get('name'),
                      entity.get('alias'),
                      entity.get('description'),
                      entity.get('synonym'),
                      entity.get('shape'),
                      entity.get('icon'),
                      entity.get('size'),
                      entity.get('fill_color'),
                      entity.get('stroke_color'),
                      entity.get('text_color'),
                      entity.get('text_type'),
                      entity.get('text_width'),
                      entity.get('x'),
                      entity.get('y'),
                      entity.get('text_position'),
                      entity.get('icon_color')]
            for property in entity['properties']:
                property_value = [entity.get('name'),
                                  property.get('name'),
                                  property.get('alias'),
                                  property.get('data_type'),
                                  'Y' if property.get('name') in entity.get('properties_index') else 'N',
                                  'Y' if property.get('name') in entity.get('primary_key') else 'N',
                                  'Y' if property.get('name') == entity.get('default_tag') else 'N',
                                  property.get('description'),
                                  property.get('synonym'),
                                  'Y' if property.get('name') in entity.get('vector_generation') else 'N'
                                  ]
                properties.append(property_value)
            sheet2.write_row(i + 2, 0, values)
        # 创建数据验证规则： 形状可选circle
        data_validation = {
            'validate': 'list',
            'value': ['circle']
        }
        sheet2.data_validation('E3:E1048576', data_validation)
        # 创建数据验证规则： 图标可选值
        data_validation = {
            'validate': 'list',
            'value': ['graph-model', 'graph-user', 'graph-document', 'graph-data', 'graph-discount', 'graph-factory',
                      'graph-contract', 'graph-telephone', 'graph-collect', 'graph-bill', 'graph-credit_card']
        }
        sheet2.data_validation('F3:F1048576', data_validation)
        # 创建数据验证规则： 实体类大小可选值
        data_validation = {
            'validate': 'list',
            'value': ['0.25x', '0.5x', '1x', '2x', '4x']
        }
        sheet2.data_validation('G3:G1048576', data_validation)


        # --------------- sheet3 实体类属性 ---------------
        if language == 'zh':
            sheet3 = book.add_worksheet('实体类属性')
        else:
            sheet3 = book.add_worksheet('Entity Class Attribute')
        # 行高
        sheet3.set_row(0, 85)
        # 列宽
        col_width = [25, 33, 25, 25, 25, 30, 30, 25, 25, 30]
        for i in range(len(col_width)):
            sheet3.set_column(i, i, col_width[i])
        # 内容
        if language == 'zh':
            sheet3.write_rich_string('A1',
                                     bold_red, '1.必填\n',
                                     default, '2.范围：需要实体类名中存在定义',
                                     default)
            sheet3.write_rich_string('B1',
                                     bold_red, '1.必填\n',
                                     default, '2.同一个实体类下的属性名称不可重复\n' \
                                              '3.仅支持大写字母、小写字母、数字及下划线\n' \
                                              '4.字符长度1～50',
                                     default)
            sheet3.write_row('C1',
                             [
                                 '1.选填（未填写时系统自动生成）\n' \
                                 '2.同一个实体类显示名不可重复\n' \
                                 '3.仅支持中英文、数字及下划线\n' \
                                 '4.字符长度1～50',
                                 '1.选填：string、boolean、date、datetime、integer、float、double、decimal\n' \
                                 '（未填写时系统自动生成：string)',
                                 '1.选填：Y/N\n' \
                                 '（未填写时系统自动生成：N)\n' \
                                 '2.每个实体类至少创建一个索引',
                                 '1.选填：Y/N\n' \
                                 '（未填写时系统自动生成：N)\n' \
                                 '2.每个实体类至少选择一个融合属性',
                                 '1.选填：Y/N\n' \
                                 '（未填写时系统自动默认将第一行填Y）\n' \
                                 '2.仅支持一个显示属性为Y',
                                 '1.选填\n' \
                                 '2.定义或备注说明\n' \
                                 '3.仅支持输入中英文、数字和键盘上的特殊符号\n' \
                                 '4.字符长度1～150',
                                 '1.选填\n' \
                                 '2.可填写多个，用|隔开\n' \
                                 '3.仅支持中英文、数字及下划线\n' \
                                 '4.字符长度1～50',
                                 '1.选填：Y/N\n' \
                                 '（未填写时系统自动生成：N)\n' \
                                 '2.必须创建了索引才能创建向量索引'
                             ],
                             default)
            sheet3.write_rich_string('A2',
                                     bold_red, '*',
                                     bold, '所属实体类',
                                     bg_pink)
            sheet3.write_rich_string('B2',
                                     bold_red, '*',
                                     bold, '属性名',
                                     bg_pink)
            sheet3.write_row('C2',
                             [
                                 '显示名', '属性值类型', '是否创建索引', '是否融合属性',
                                 '是否默认显示属性', '实体类属性描述', '显示名同义词', '是否创建向量索引'
                             ],
                             bg_blue)
        else:
            sheet3.write_rich_string('A1',
                                     bold_red, '1. Required field\n',
                                     default, '2. Range: the definition is required in the entity class name',
                                     default)
            sheet3.write_rich_string('B1',
                                     bold_red, '1. Required field\n',
                                     default, '2. No duplication of attribute name in the same entity class\n' \
                                              '3. Only support uppercase and lowercase letters, numbers, and underscores\n' \
                                              '4. Character length 1-50',
                                     default)
            sheet3.write_row('C1',
                             [
                                 '1. Optional field (generated automatically when not entered)\n' \
                                 '2. No duplication of show name in the same entity class\n' \
                                 '3. Only support Chinese, English, numbers, and underscores\n' \
                                 '4. Character length 1-50',
                                 '1. Optional field: string, boolean, date, datetime, integer, float, double, decimal\n' \
                                 '(generates "string" automatically when not entered)',
                                 '1. Optional field: Y/N\n' \
                                 '(generates "N" automatically when not entered)\n' \
                                 '2. At least one index should be created per entity class',
                                 '1. Optional field: Y/N\n' \
                                 '(generates "N" automatically when not entered)\n' \
                                 '2. At least one fusion attribute should be selected per entity class',
                                 '1. Optional field: Y/N\n' \
                                 '(generates "Y" automatically in the first line when not entered)\n' \
                                 '2. Only support show attribute "Y"',
                                 '1. Optional field\n' \
                                 '2. Definition or note\n' \
                                 '3. Only support Chinese, English, numbers, and special symbols on the keyboard\n' \
                                 '4. Character length 1-150',
                                 '1. Optional field\n' \
                                 '2. You can enter multiple domains which could be separated by "|"' \
                                 '3. Only support Chinese, English, numbers, and underscores\n' \
                                 '4. Character length 1-50',
                                 '1. Optional field: Y/N\n' \
                                 '(generates "N" automatically when not entered)\n' \
                                 '2.Indexes must be created to create vector indexes'
                                 ],
                             default)
            sheet3.write_rich_string('A2',
                                     bold_red, '*',
                                     bold, 'Entity Class Affiliated',
                                     bg_pink)
            sheet3.write_rich_string('B2',
                                     bold_red, '*',
                                     bold, 'Attribute Name',
                                     bg_pink)
            sheet3.write_row('C2',
                             [
                                 'Show Name', 'Attribute Value Type', 'Create Indexes or Not', 'Fuse Attribute or Not',
                                 'Show Attribute by Default or Not', 'Entity Class Attribute Description',
                                 'Show Name Synonyms', 'Create Vector Indexes or Not'
                             ],
                             bg_blue)
        for i, property_value in enumerate(properties):
            sheet3.write_row(i + 2, 0, property_value)
        # 创建数据验证规则：所属实体类的范围限制
        if language == 'zh':
            data_validation = {
                'validate': 'list',
                'value': '=实体类定义!$A$3:$A$1048576'
            }
        elif language == 'en':
            data_validation = {
                'validate': 'list',
                'value': '=Entity Class Definition!$A$3:$A$1048576'
            }
        sheet3.data_validation('A3:A1048576', data_validation)
        # 创建数据验证规则：属性值类型范围限制
        data_validation = {
            'validate': 'list',
            'value': ['string', 'boolean', 'date', 'datetime', 'integer', 'float', 'double', 'decimal']
        }
        sheet3.data_validation('D3:D1048576', data_validation)
        # 创建数据验证规则：是否创建索引、是否融合属性、是否默认显示属性 范围限制
        data_validation = {
            'validate': 'list',
            'value': ['Y', 'N']
        }
        sheet3.data_validation('E3:G1048576', data_validation)

        # --------------- sheet4 关系类定义 ---------------
        if language == 'zh':
            sheet4 = book.add_worksheet('关系类定义')
        else:
            sheet4 = book.add_worksheet('Relationship Class Definition')
        # 行高
        sheet4.set_row(0, 85)
        # 列宽
        col_width = [34, 31, 25, 25, 34, 34, 25, 25, 27]
        for i in range(len(col_width)):
            sheet4.set_column(i, i, col_width[i])
        # 内容
        if language == 'zh':
            sheet4.write_rich_string('A1',
                                     bold_red, '1.必填\n',
                                     default, '2.同一个本体中关系类可重复使用\n' \
                                              '3.仅支持大写字母、小写字母、数字及下划线\n' \
                                              '4.字符长度1～50',
                                     default)
            sheet4.write('B1',
                         '1.选填（未填写时系统自动生成）\n' \
                         '2.同一个本体中相同关系类显示名相同\n' \
                         '3仅支持中英文、数字及下划线\n' \
                         '4.字符长度1～50',
                         default)
            sheet4.write_rich_string('C1',
                                     bold_red, '1.必填\n',
                                     default, '（在实体类表中选择）',
                                     default
                                     )
            sheet4.write_rich_string('D1',
                                     bold_red, '1.必填\n',
                                     default, '（在实体类表中选择）',
                                     default
                                     )
            sheet4.write_row('E1',
                             [
                                 '1.选填\n' \
                                 '2.同一个本体中相同关系类描述相同\n' \
                                 '3.仅支持输入中英文、数字和键盘上的特殊符号\n' \
                                 '4.字符长度1～150',
                                 '1.选填\n' \
                                 '2.可填写多个，用|隔开\n' \
                                 '每一个字符数小于50\n' \
                                 '3仅支持中英文、数字及下划线\n' \
                                 '4.字符长度1～50',
                                 '1.选填\n' \
                                 '(未填写时系统自动生成:rgba(0,0,0,0.8))\n' \
                                 '2.格式如：rgba(0,0,0,0.8)',
                                 '1.选填：line\n' \
                                 '(未填写时系统自动生成：line）',
                                 '1.选填：0.25x、0.5x、1x、2x、4x\n' \
                                 '（未填写时系统自动生成：0.25x）'
                             ],
                             default)
            sheet4.write_rich_string('A2',
                                     bold_red, '*',
                                     bold, '关系类名',
                                     bg_pink)
            sheet4.write('B2', '关系类显示名', bg_blue)
            sheet4.write_rich_string('C2',
                                     bold_red, '*',
                                     bold, '起始实体',
                                     bg_pink)
            sheet4.write_rich_string('D2',
                                     bold_red, '*',
                                     bold, '指向实体',
                                     bg_pink)
            sheet4.write_row('E2',
                             [
                                 '关系类描述',
                                 '关系类名同义词', '颜色', '形状', '粗细'
                             ],
                             bg_blue)
        else:
            sheet4.write_rich_string('A1',
                                     bold_red, '1. Required field\n',
                                     default, '2. Relationship class can be reused in the same ontology\n' \
                                              '3. Only support uppercase and lowercase letters, numbers, and underscores\n' \
                                              '4. Character length 1-50',
                                     default)
            sheet4.write('B1',
                         '1. Optional field (generated automatically when not entered)\n' \
                         '2. In the same ontology, the show name of the same relationship class is also the same\n' \
                         '3. Only support Chinese, English, numbers, and underscores\n' \
                         '4. Character length 1-50',
                         default)
            sheet4.write_rich_string('C1',
                                     bold_red, '1. Required field\n',
                                     default, '(select in the entity class table)',
                                     default
                                     )
            sheet4.write_rich_string('D1',
                                     bold_red, '1. Required field\n',
                                     default, '(select in the entity class table)',
                                     default
                                     )
            sheet4.write_row('E1',
                             [
                                 '1. Optional field\n' \
                                 '2. In the same ontology, the description of the same relationship class is also the same\n' \
                                 '3. Only support Chinese, English, numbers, and special symbols on the keyboard\n' \
                                 '4. Character length 1-150',
                                 '1. Optional field\n' \
                                 '2. You can enter multiple domains which could be separated by "|"\n' \
                                 'The number of characters should be less than 50\n' \
                                 '3. Only support Chinese, English, numbers, and underscores\n' \
                                 '4. Character length 1-50',
                                 '1. Optional field\n' \
                                 '(generates "rgba(0,0,0,0.8)" automatically when not entered)\n' \
                                 '2. Format example: rgba(0,0,0,0.8)',
                                 '1. Optional field: line\n' \
                                 '(generates "line" automatically when not entered)',
                                 '1. Optional field: 0.25x, 0.5x, 1x, 2x, 4x\n' \
                                 ' (generates "0.25x" automatically when not entered)'
                             ],
                             default)
            sheet4.write_rich_string('A2',
                                     bold_red, '*',
                                     bold, 'Relationship Class Name',
                                     bg_pink)
            sheet4.write('B2', 'Relationship Class Show Name', bg_blue)
            sheet4.write_rich_string('C2',
                                     bold_red, '*',
                                     bold, 'Starting Entity',
                                     bg_pink)
            sheet4.write_rich_string('D2',
                                     bold_red, '*',
                                     bold, 'End Entity',
                                     bg_pink)
            sheet4.write_row('E2',
                             [
                                 'Relationship Class Description',
                                 'Relationship Class Name Synonyms', 'Color', 'Shape', 'Width'
                             ],
                             bg_blue)
        properties = []
        for i, edge in enumerate(ontology['edge']):
            value = [edge.get('name'),
                     edge.get('alias'),
                     edge.get('relations')[0],
                     edge.get('relations')[2],
                     edge.get('description'),
                     edge.get('synonym'),
                     edge.get('colour'),
                     edge.get('shape'),
                     edge.get('width'),
                     ]
            for property in edge.get('properties', []):
                property_value = [edge.get('name'),
                                  property.get('name'),
                                  property.get('alias'),
                                  property.get('data_type'),
                                  'Y' if property.get('name') in edge.get('properties_index') else 'N',
                                  'Y' if property.get('name') == edge.get('default_tag') else 'N',
                                  property.get('description'),
                                  property.get('synonym')
                                  ]
                properties.append(property_value)
            sheet4.write_row(i + 2, 0, value)

        # 创建数据验证规则：起始实体、指向实体 范围限制
        if language == 'zh':
            data_validation = {
                'validate': 'list',
                'value': '=实体类定义!$A$3:$A$1048576'
            }
        elif language == 'en':
            data_validation = {
                'validate': 'list',
                'value': '=Entity Class Definition!$A$3:$A$1048576'
            }
        sheet4.data_validation('C3:D1048576', data_validation)

        # --------------- sheet5 关系类属性 ---------------
        if language == 'zh':
            sheet5 = book.add_worksheet('关系类属性')
        else:
            sheet5 = book.add_worksheet('Relationship Class Attribute')
        # 行高
        sheet5.set_row(0, 85)
        # 列宽
        col_width = [25, 35, 25, 25, 25, 25, 25, 25]
        for i in range(len(col_width)):
            sheet5.set_column(i, i, col_width[i])
        # 内容
        if language == 'zh':
            sheet5.write_rich_string('A1',
                                     bold_red, '1.必填\n',
                                     default, '2.范围：需要关系类名中存在定义',
                                     default)
            sheet5.write_rich_string('B1',
                                     bold_red, '1.必填\n',
                                     default, '2.同一个关系类下的属性名称不可重复\n' \
                                              '3.仅支持大写字母、小写字母、数字及下划线\n' \
                                              '4.字符长度1～50',
                                     default)
            sheet5.write_row('C1',
                             [
                                 '1.选填（未填写时系统自动生成）\n' \
                                 '2.同一个关系类显示名不可重复\n' \
                                 '3仅支持中英文、数字及下划线\n' \
                                 '4.字符长度1～50',
                                 '1.选填：string、boolean、date、datetime、integer、float、double、decimal\n' \
                                 '（未填写时系统自动生成：string)',
                                 '1.选填：Y/N\n' \
                                 '（未填写时系统自动默认将第一行填Y）\n' \
                                 '2.仅支持一个显示属性为Y',
                                 '1.选填：Y/N\n' \
                                 '（未填写时系统自动默认将第一行填Y）\n' \
                                 '2.仅支持一个显示属性为Y',
                                 '1.选填\n' \
                                 '2.定义或备注说明\n' \
                                 '3.仅支持输入中英文、数字和键盘上的特殊符号\n' \
                                 '4.字符长度1～150',
                                 '1.选填\n' \
                                 '2.可填写多个，用|隔开\n' \
                                 '3.每一个字符数小于50'
                             ],
                             default)
            sheet5.write_rich_string('A2',
                                     bold_red, '*',
                                     bold, '所属关系类',
                                     bg_pink)
            sheet5.write_rich_string('B2',
                                     bold_red, '*',
                                     bold, '属性名',
                                     bg_pink)
            sheet5.write_row('C2',
                             ['显示名', '属性值类型', '是否创建索引',
                              '是否默认显示属性', '关系类属性描述', '显示名同义词'],
                             bg_blue)
        else:
            sheet5.write_rich_string('A1',
                                     bold_red, '1. Required field\n',
                                     default, '2. Range: the definition is required in the relationship class name',
                                     default)
            sheet5.write_rich_string('B1',
                                     bold_red, '1. Required field\n',
                                     default, '2. No duplication of attribute name in the same relationship class\n' \
                                              '3. Only support uppercase and lowercase letters, numbers, and underscores\n' \
                                              '4. Character length 1-50',
                                     default)
            sheet5.write_row('C1',
                             [
                                 '1. Optional field (generated automatically when not entered)\n' \
                                 '2. No duplication of show name in the same relationship class\n' \
                                 '3. Only support Chinese, English, numbers, and underscores\n' \
                                 '4. Character length 1-50',
                                 '1. Optional field: string, boolean, date, datetime, integer, float, double, decimal\n' \
                                 '(generates "string" automatically when not entered)',
                                 '1. Optional field: Y/N\n' \
                                 '(generates "Y" automatically in the first line when not entered)\n' \
                                 '2. Only support show attribute "Y"',
                                 '1. Optional field: Y/N\n' \
                                 '(generates "Y" automatically in the first line when not entered)\n' \
                                 '2. Only support show attribute "Y"',
                                 '1. Optional field\n' \
                                 '2. Definition or note\n' \
                                 '3. Only support Chinese, English, numbers, and special symbols on the keyboard\n' \
                                 '4. Character length 1-150',
                                 '1. Optional field\n' \
                                 '2. You can enter multiple domains which could be separated by "|"\n' \
                                 '3. The number of characters should be less than 50'
                             ],
                             default)
            sheet5.write_rich_string('A2',
                                     bold_red, '*',
                                     bold, 'Relationship Class Affiliated',
                                     bg_pink)
            sheet5.write_rich_string('B2',
                                     bold_red, '*',
                                     bold, 'Attribute Name',
                                     bg_pink)
            sheet5.write_row('C2',
                             ['Show Name', 'Attribute Value Type', 'Create Indexes or Not',
                              'Show Attribute by Default or Not', 'Relationship Class Attribute Description', 'Show Name Synonyms'],
                             bg_blue)
        for i, property in enumerate(properties):
            sheet5.write_row(i + 2, 0, property)

        # 创建数据验证规则：所属关系类 范围限制
        if language == 'zh':
            data_validation = {
                'validate': 'list',
                'value': '=关系类定义!$A$3:$A$1048576'
            }
        elif language == 'en':
            data_validation = {
                'validate': 'list',
                'value': '=Relationship Class Definition!$A$3:$A$1048576'
            }
        sheet5.data_validation('A3:A1048576', data_validation)
        # 创建数据验证规则：属性值类型范围限制
        data_validation = {
            'validate': 'list',
            'value': ['string', 'boolean', 'date', 'datetime', 'integer', 'float', 'double', 'decimal']
        }
        sheet5.data_validation('D3:D1048576', data_validation)
        # 创建数据验证规则：是否创建索引、是否默认显示属性 范围限制
        data_validation = {
            'validate': 'list',
            'value': ['Y', 'N']
        }
        sheet5.data_validation('E3:F1048576', data_validation)

        # 保存excel文件
        writer.save()

    def sql_extract(self, params_json, preview=False):
        ds_id = params_json["ds_id"]
        ds = dsm_dao.getdatabyid(ds_id)
        if len(ds) == 0:
            code = codes.Builder_OtlService_SqlExtract_DsIdNotExist

            return 500, Gview2.TErrorreturn(code, ds_id=ds_id)
        data_source = ds[0]["data_source"]
        params_json["ds_address"] = ds[0]["ds_address"]
        params_json["ds_port"] = ds[0]["ds_port"]
        params_json["ds_path"] = ds[0]["ds_path"]
        params_json["ds_user"] = ds[0]["ds_user"]
        params_json["ds_password"] = ds[0]["ds_password"]
        params_json["connect_type"] = ds[0]["connect_type"]
        try:
            if data_source == "mysql":
                ret = otl_dao.mysql_sql_show_data(params_json)
            elif data_source == "hive":
                ret = otl_dao.hive_sql_show_data(params_json)
            elif data_source == "sqlserver":
                ret = otl_dao.sqlserver_sql_show_data(params_json)
            elif data_source == "kingbasees":
                ret = otl_dao.kingbasees_sql_show_data(params_json)
            elif data_source == "postgresql":
                ret = otl_dao.postgres_sql_show_data(params_json)
            elif data_source == "clickhouse":
                ret = otl_dao.clickhouse_sql_show_data(params_json)
            else:
                code = codes.Builder_OtlService_SqlExtract_DataSourceError

                return 500, Gview2.TErrorreturn(code, data_source=data_source)
        except Exception as e:
            log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
            Logger.log_error(log_info)
            code = codes.Builder_OtlService_SqlExtract_SqlError

            return 500, Gview2.TErrorreturn(code, cause=repr(e))
        except exceptions.FunctionTimedOut:
            code = codes.Builder_OtlService_SqlExtract_TimeOutError

            return 500, Gview2.TErrorreturn(code)

        if ret == "-1":
            cause = _l('Password decoding failed. ')
            code = codes.Builder_OtlService_SqlExtract_PasswordError

            return 500, Gview2.TErrorreturn(code, cause=cause)
        elif ret == "-2":
            code = codes.Builder_OtlService_SqlExtract_FieldRepeats

            return 500, Gview2.TErrorreturn(code)

        if not preview:
            ret["ds_id"] = ds_id
            ret["ds_name"] = ds[0]["ds_name"]
            ret["data_source"] = ds[0]["data_source"]
            ret["ds_path"] = ds[0]["ds_path"]
            ret["extract_type"] = "sqlExtraction"
            ret["file_name"] = params_json["sql_name"]
            ret["file_path"] = ret["ds_path"]
            ret["file_source"] = params_json["sql"]
            ret["file_type"] = ""
        else:
            if len(ret["property"]) == 0:
                code = codes.Builder_OtlService_SqlExtract_EmptyData
                
                return 500, Gview2.TErrorreturn(code)
            ret["property"] = [p['field'] for p in ret['property']]
        
        return 200, ret

    def get_vector_service_status(self):
        try:
            processor = SQLProcessor(None)
            code, res = processor.get_vector_service_status()
            return code, Gview2.json_return(res)
        except Exception as e:
            pass


otl_service = OtlService()

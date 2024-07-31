# -*-coding:utf-8-*-
# @Time    : 2020/8/10 18:24
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from typing import Tuple

from common.errorcode import codes
from common.errorcode.gview import Gview as Gview2
from dao.otl_dao import otl_dao
from func_timeout import exceptions
from utils.common_response_status import CommonResponseStatus
from dao.dsm_dao import dsm_dao
from dao.graph_dao import graph_dao
from utils.CommonUtil import commonutil
import datetime
from utils.log_info import Logger
import common.stand_log as log_oper
import sys
import traceback
from dao.knw_dao import knw_dao
from flask_babel import gettext as _l
from utils.ConnectUtil import HiveClient
from datetime import datetime, timedelta


class DsmService():
    def connectTestByGraphID(self, graph_id):
        # 获取图谱依赖的数据源编号集合
        ds_array = []
        ret = graph_dao.getdsgraphuse(graph_id)
        for row in ret:
            ds_array = eval(row["graph_ds"])

        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        if len(ds_array) == 0:
            return ret_code, obj

        # 获取集合中所有数据源信息
        ds_infos = dsm_dao.getbyids(ds_array)
        # 如果有部分数据源不存在
        if len(ds_array) != len(ds_infos):
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj['cause'] = "section of data source is not exist"
            obj['code'] = CommonResponseStatus.SERVER_ERROR.value
            obj['message'] = "check graph's data source error"
            return ret_code, obj

        for row in ds_infos:
            # 检查数据源连接
            ret_code, ret_message = self.connectTest(row)

            # 失败情况返回错误
            if ret_code != CommonResponseStatus.SUCCESS.value:
                # 添加问题数据源名称信息
                ds_name_info = "inavailability data source name: {},".format(row['ds_name'])
                obj['cause'] = ds_name_info + ret_message['Description']
                obj['code'] = CommonResponseStatus.SERVER_ERROR.value
                obj['message'] = "check graph's data source error"
                break
        return ret_code, obj

    def connectTestByDsIDs(self, ds_ids: list[int]):
        ''' 根据数据源id列表检测数据源是否有效 '''
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        if len(ds_ids) == 0:
            return ret_code, obj

        # 获取集合中所有数据源信息
        ds_infos = dsm_dao.getbyids(ds_ids)
        # 如果有部分数据源不存在
        if len(ds_ids) != len(ds_infos):
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj['cause'] = "section of data source is not exist"
            obj['code'] = CommonResponseStatus.SERVER_ERROR.value
            obj['message'] = "check graph's data source error"
            return ret_code, obj

        for row in ds_infos:
            # 检查数据源连接
            ret_code, ret_message = self.connectTest(row)

            # 失败情况返回错误
            if ret_code != CommonResponseStatus.SUCCESS.value:
                # 添加问题数据源名称信息
                ds_name_info = "inavailability data source name: {},".format(row['ds_name'])
                obj['cause'] = ds_name_info + ret_message['Description']
                obj['code'] = CommonResponseStatus.SERVER_ERROR.value
                obj['message'] = "check graph's data source error"
                break
        return ret_code, obj

    def connectTest(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        if params_json["data_source"] == "mysql":
            try:
                ret = "-1"
                if params_json["connect_type"] == "odbc":
                    ret = dsm_dao.mysqlConnectTestUseODBC(params_json)
                else:
                    ret = dsm_dao.mysqlConnectTest(params_json)
                # 密码解密错误
                if ret == "-1":
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("Password encryption error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "Password encryption error"
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                else:
                    obj["res"] = _l("test connection success")
                    
                    return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "password" in err or "Access denied for user" in err:
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("User or Password in mysql have error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "User or Password in mysql have error"
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                obj["ErrorCode"] = "Builder.DsmService.ConnectTest.UnknownError"
                obj["Description"] = _l("test connection fail, check your parameter again")
                obj["Solution"] = "Please check your parameter again."
                obj["ErrorDetails"] = err
                obj["ErrorLink"] = ""
                
                return 500, obj
        elif params_json["data_source"] == "hive":
            try:
                ret = dsm_dao.hiveConnectTest(params_json)

                if ret == "-1":  # 解密
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("Password encryption error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "Password encryption error"
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                else:
                    obj["res"] = "test connection success"
                    
                    return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "Error validating the login" in err:
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("User or password in hive has some error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "User or password in hive has some error"
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                obj["ErrorCode"] = "Builder.DsmService.ConnectTest.UnknownError"
                obj["Description"] = _l("test connection fail, check your parameter again")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = err
                obj["ErrorLink"] = ""
                
                return 500, obj
        elif params_json["data_source"] == "sqlserver":
            try:
                ret = dsm_dao.sqlserverConnectTest(params_json)
                if ret == "-1":
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("Password encryption error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "Password encryption error"
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                else:
                    obj["res"] = _l("test connection success")
                    
                    return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "Login failed for user" in err:
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("User or Password in sqlserver have error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "User or Password in sqlserver have error"
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                obj["ErrorCode"] = "Builder.DsmService.ConnectTest.UnknownError"
                obj["Description"] = _l("test connection fail, check your parameter again")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = err
                obj["ErrorLink"] = ""
                
                return 500, obj
        elif params_json["data_source"] == "kingbasees":
            try:
                ret = dsm_dao.kingbaseesConnectTest(params_json)
                if ret == "-1":
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("Password encryption error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "Password encryption error"
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                else:
                    obj["res"] = _l("test connection success")
                    
                    return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "Password" in err:
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("User or Password in kingbasees have error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "User or Password in kingbasees have error"
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                obj["ErrorCode"] = "Builder.DsmService.ConnectTest.UnknownError"
                obj["Description"] = _l("test connection fail, check your parameter again")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = err
                obj["ErrorLink"] = ""
                
                return 500, obj
        elif params_json["data_source"] == "postgresql":
            try:
                ret = dsm_dao.postgresqlConnectTest(params_json)
                if ret == "-1":
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("Password encryption error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "Password encryption error"
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                else:
                    obj["res"] = _l("test connection success")
                    
                    return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "Password" in err or "password" in err:
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("User or Password in PostgreSQL have error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = _l("User or Password in PostgreSQL have error")
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                obj["ErrorCode"] = "Builder.DsmService.ConnectTest.UnknownError"
                obj["Description"] = _l("test connection fail, check your parameter again")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = err
                obj["ErrorLink"] = ""
                
                return 500, obj
        elif params_json["data_source"] == "clickhouse":
            try:
                ret = dsm_dao.clickHouseConnectTest(params_json)
                if ret == "-1":
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("Password encryption error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = "Password encryption error"
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                else:
                    obj["res"] = _l("test connection success")
                    
                    return ret_code, obj
            except Exception as e:
                err = repr(e)
                error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                if "Password" in err or "password" in err:
                    obj["ErrorCode"] = "Builder.DsmService.ConnectTest.PasswordError"
                    obj["Description"] = _l("User or Password in ClickHouse have error")
                    obj["Solution"] = "Please check your parameter again."
                    obj["ErrorDetails"] = _l("User or Password in ClickHouse have error")
                    obj["ErrorLink"] = ""
                    
                    return 400, obj
                obj["ErrorCode"] = "Builder.DsmService.ConnectTest.UnknownError"
                obj["Description"] = _l("test connection fail, check your parameter again")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = err
                obj["ErrorLink"] = ""
                
                return 500, obj
        else:
            obj["ErrorCode"] = "Builder.DsmService.ConnectTest.UnknownError"
            obj["Description"] = _l("data_source no rule")
            obj["Solution"] = "Please contact the developers."
            obj["ErrorDetails"] = "data_source no rule"
            obj["ErrorLink"] = ""
            
            return 500, obj


    def insert_refresh_token(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_code = params_json["ds_code"]
        ds_auth = params_json["ds_auth"]
        try:
            res = dsm_dao.getcode(ds_code)
            if len(res) != 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "code has been exist"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "Insert refresh_token fail"
                
                return ret_code, obj
            else:
                try:
                    obj_token = dsm_dao.gettokenbycode(ds_auth, ds_code)
                    if obj_token == "-1":
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "Get token fail"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Insert refresh_token fail"
                        
                        return ret_code, obj
                    if obj_token == "-2":
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "ds_auth {} not exist ".format(ds_auth)
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Insert refresh_token fail"
                        
                        return ret_code, obj
                    value_list = []
                    refresh_token = obj_token["refresh_token"]
                    access_token = obj_token["access_token"]
                    value_list.append(refresh_token)
                    value_list.append(access_token)
                    value_list.append(ds_code)
                    value_list.append(ds_auth)
                    res = dsm_dao.getdatabyauth(ds_auth)
                    if len(res) == 0:
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "ds_auth  %s not exist!" % ds_auth
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Insert refresh_token fail"
                        
                        return ret_code, obj
                    else:
                        try:
                            ds_auth = dsm_dao.insert_refresh_token("code", value_list)
                            obj["res"] = "Insert refreshtoken sucess "
                            
                            return ret_code, obj
                        except Exception as e:
                            err = repr(e)
                            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                            Logger.log_error(error_log)
                            ret_code = CommonResponseStatus.SERVER_ERROR.value
                            obj['cause'] = "insert token false!"
                            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                            obj['message'] = "Insert refresh_token fail"
                            
                            return ret_code, obj
                except  Exception as e:
                    err = repr(e)
                    error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                    Logger.log_error(error_log)
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "get token false!"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Insert refresh_token fail"
                    
                    return ret_code, obj

        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj['cause'] = "get code false!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "Insert refresh_token fail"
            
            return ret_code, obj

    def addds(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_id = -1  # 数据源id
        try:
            ds_name = params_json["ds_name"].strip()
            params_json["ds_name"] = ds_name
            knw_id = params_json["knw_id"]

            # 知识网络不存在
            knw_info_list = knw_dao.get_knw_by_id(knw_id)
            if len(knw_info_list) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.dsm_Service.DsmService.addds.NotFindKnwError"
                obj["Description"] = _l("id %s not exist!") % knw_id
                obj["Solution"] = "id %s not exist!" % knw_id
                obj["ErrorDetails"] = "insert fail"
                obj["ErrorLink"] = ""
                
                return ret_code, obj, ds_id

            # 校验数据源名是否重名
            resname = dsm_dao.getbydsname(ds_name, knw_id)
            if len(resname) > 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.dsm_Service.DsmService.addds.SameNameError"
                obj["Description"] = _l("database already have the same name")
                obj["Solution"] = "database already have the same name"
                obj["ErrorDetails"] = "insert fail"
                obj["ErrorLink"] = ""
                
                return ret_code, obj, ds_id

            ret = dsm_dao.insertData(params_json)
            ds_id = ret
            obj["res"] = _l("insert success")
            
        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj["ErrorCode"] = "Builder.service.dsm_Service.DsmService.addds.RequestError"
            obj["Description"] = _l("you have an error in your SQL!")
            obj["Solution"] = err
            obj["ErrorDetails"] = "insert fail"
            obj["ErrorLink"] = ""

        return ret_code, obj, ds_id

    def getall(self, args, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        try:
            kgIds = args.get("kgIds", [])
            page = args.get("page")
            # user = args.get("user")
            size = args.get("size")
            order = args.get("order")
            knw_id = args.get("knw_id")
            filter = args.get('filter')
            ds_type = args.get('ds_type')
            count = dsm_dao.getCountByKnwId(kgIds, knw_id, filter, ds_type)
            res = {}

            # 知识网络不存在
            if knw_id != "-1":
                knw_info_list = knw_dao.get_knw_by_id(knw_id)
                if len(knw_info_list) == 0:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = _l("id  %s not exist!") % knw_id
                    obj['code'] = "Builder.service.dsm_service.DsmService.getall.NotFindKnwError"
                    obj['message'] = "select fail"
                    
                    return ret_code, obj

            rec_dict = dsm_dao.getall(int(page) - 1, int(size), order, kgIds, knw_id, filter, ds_type)
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
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = _l("you have an error in your SQL!")
            obj['code'] = "Builder.service.dsm_Service.DsmService.getall.RequestError"
            obj['message'] = "insert connection fail"
            
        return ret_code, obj

    def getbydsname(self, args, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        try:
            kgIds = args.get("kgIds", [])
            page = args.get("page")
            ds_name = args.get("ds_name")
            size = args.get("size")
            order = args.get("order")
            knw_id = args.get("knw_id")

            # 知识网络不存在
            knw_info_list = knw_dao.get_knw_by_id(knw_id)
            if len(knw_info_list) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "id  %s not exist!" % knw_id
                obj['code'] = "Builder.service.dsm_service.DsmService.getbydsname.NotFindKnwError"
                obj['message'] = "select fail"
                
                return ret_code, obj

            count = dsm_dao.getCountbyname(ds_name, kgIds, knw_id)
            rec_dict = dsm_dao.getallbyname(ds_name, int(page) - 1, int(size), order, kgIds, knw_id)
            res = {}
            res["count"] = count
            res["df"] = rec_dict
            obj["res"] = res
            
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = "Builder.service.dsm_Service.DsmService.getbydsname.RequestError"
            obj['message'] = "query datasource fail"

        return ret_code, obj

    def getById(self, ds_id: int) -> Tuple[int, dict]:
        ds_info = dsm_dao.getdatabyid(ds_id)
        if len(ds_info) == 0:
            code = codes.Builder_DsmService_GetById_DsIdNotExists
            
            return 500, Gview2.error_return(code, ds_id=ds_id)
        new_ds_info = {}
        ds_info = ds_info[0]
        new_ds_info["data_source"] = ds_info["data_source"]
        new_ds_info["ds_address"] = ds_info["ds_address"]
        new_ds_info["ds_password"] = ds_info["ds_password"]
        new_ds_info["ds_path"] = ds_info["ds_path"]
        new_ds_info["ds_port"] = ds_info["ds_port"]
        new_ds_info["ds_user"] = ds_info["ds_user"]
        new_ds_info["ds_name"] = ds_info["ds_name"]
            
        return 200, new_ds_info

    def getCount(self, host_url):
        count = dsm_dao.getCount()
        return count

    def delete(self, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        message = ""
        obj = {}
        flag_code = False
        flag_no_exit = False
        ids = params_json["ds_ids"]
        ids = set(ids)
        try:
            ds_infos = dsm_dao.getbyids(ids)

            # 数据库中存在的数据源id
            exist_ids = set()
            for info in ds_infos:
                exist_ids.add(info["id"])

            ret_list = list(set(ids) ^ exist_ids)
            # 不存在的 id
            if len(ret_list) > 0:
                flag_no_exit = True
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                message += "%s not exist!" % ",".join('%s' % id2 for id2 in ret_list)

            if len(ds_infos) > 0:
                useds = graph_dao.getdsgraphuseall()
                total_used_ids = []
                for used_ids in useds:
                    i = eval(used_ids["graph_ds"])
                    total_used_ids.extend(i)

                # 使用中所有的和参数中存在的id 交集 不能删除
                use_list = list(exist_ids.intersection(set(total_used_ids)))
                # 参数中存在的id和不能删除的差集 可删除
                unuse_list = list(exist_ids ^ set(use_list))
                if len(unuse_list) > 0:
                    ret = dsm_dao.delete(unuse_list)
                    if ret == 0:
                        ids = unuse_list
                        message += "success delete ds_ids  %s !" % ",".join('%s' % id2 for id2 in ids)
                    else:
                        ids = unuse_list
                        message += "failed delete ds_ids  %s !" % ",".join('%s' % id2 for id2 in ids)

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
                if flag_no_exit:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = message
                    obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
                    obj['message'] = "delete fail!"
                else:
                    obj["res"] = "success delete ds_ids %s !" % ids
                    obj["ds_ids"] = ids
            

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "delete %s failed!" % ",".join('%s' % id2 for id2 in ids)
                
        return ret_code, obj

    # 编辑数据源
    def update(self, id, params_json, host_url):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ids = dsm_dao.getbyid(id)
            if len(ids) == 0:
                obj["ErrorCode"] = "Builder.DsmService.Updata.NotFindDsError"
                obj["Description"] = _l("update fail")
                obj["Solution"] = "Please check your parameter again."
                obj["ErrorDetails"] = "dsId %s not exist!" % id
                obj["ErrorLink"] = ""
                
                return 400, obj

            # user_id = params_json["user_id"]
            # roles = params_json["roles"]
            # auth_list = data_auth.get_data_permission([id], "ds", user_id, roles)
            # if "DS_EDIT" not in auth_list[0]["codes"]:
            #     code = codes.Builder_dsmService_Update_NoPermissionError
            #     obj["ErrorCode"] = "Builder.dsmService.Update.NoPermissionError"
            #     obj["Description"] = _l("No permissions for ds_id %s.") % id
            #     obj["Solution"] = _l('please check your data source again.')
            #     obj["ErrorDetails"] = _l("No permissions for ds_id %s.") % id
            #     obj["ErrorLink"] = ""
            #     
            #     return 500, obj

            ds_name = params_json["ds_name"].strip()
            params_json["ds_name"] = ds_name
            resbyname = dsm_dao.getbydsnameId(ds_name, id)
            if len(resbyname) > 0:
                obj["ErrorCode"] = "Builder.DsmService.Updata.SameNameError"
                obj["Description"] = _l("Duplicate data source name")
                obj["Solution"] = _l("Please check your parameter again.")
                obj["ErrorDetails"] = "database already have the same name"
                obj["ErrorLink"] = ""
                
                return 500, obj

            dsm_dao.update(id, params_json)
            obj["res"] = _l("update dsId success")   
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj["ErrorCode"] = "Builder.DsmService.Updata.UnknownError"
                obj["Description"] = _l("update fail")
                obj["Solution"] = "Please contact the developers."
                obj["ErrorDetails"] = "you have an error in your SQL!"
                obj["ErrorLink"] = ""
                
                return 500, obj
            if "Duplicate entry" in err:
                obj["ErrorCode"] = "Builder.DsmService.Updata.SameNameError"
                obj["Description"] = _l("update fail")
                obj["Solution"] = "Please check your parameter again."
                obj["ErrorDetails"] = "database already have the same name"
                obj["ErrorLink"] = ""
                
                return 400, obj
            obj["ErrorCode"] = "Builder.DsmService.Updata.UnknownError"
            obj["Description"] = _l("update fail")
            obj["Solution"] = "Please contact the developers."
            obj["ErrorDetails"] = err
            obj["ErrorLink"] = ""
            
            return 500, obj
        return ret_code, obj

    # 该数据源ID是否存在
    def checkById(self, id):
        obj = {}
        try:
            ids = dsm_dao.getbyid(id)
            if len(ids) == 0:
                obj['Cause'] = _l("ds_id  %s not exist!") % id
                obj['Code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "ds_id error"
                return -1, obj
            else:
                return 0, {}
        except Exception as e:
            error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['Cause'] = repr(e)
            obj['Code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "error"
            return -1, obj

    def getHivePartitions(self, ds_id, table_name):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ds_info = dsm_dao.getdatabyid(ds_id)
            if len(ds_info) == 0:
                obj["ErrorCode"] = "Builder.DsmService.getHivePartitions.NotFindDsError"
                obj["Description"] = _l("ds_id not exist!")
                obj["Solution"] = "Please check your parameter again."
                obj["ErrorDetails"] = _l("ds_id not exist!")
                obj["ErrorLink"] = ""
                
                return CommonResponseStatus.SERVER_ERROR.value, obj
            ds_info = ds_info[0]
            if ds_info["data_source"] != "hive":
                obj["ErrorCode"] = "Builder.DsmService.getHivePartitions.DataSourceNotHive"
                obj["Description"] = _l("data source isn't hive")
                obj["Solution"] = "Please check your parameter again."
                obj["ErrorDetails"] = _l("data source isn't hive")
                obj["ErrorLink"] = ""
                
                return CommonResponseStatus.SERVER_ERROR.value, obj
            password = commonutil.DecryptBybase64(ds_info['ds_password'])
            hiveClient = HiveClient(ds_info["ds_address"], ds_info["ds_user"], password, ds_info["ds_path"],
                                    ds_info["ds_port"])
            
            # 如果不是分区表
            if not hiveClient.isPartitionTable(table_name):
                return ret_code, []
            obj = hiveClient.getPartitions(table_name)
            return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj["ErrorCode"] = "Builder.DsmService.getHivePartitions.UnknownError"
            obj["Description"] = err
            obj["Solution"] = "Please check your parameter again."
            obj["ErrorDetails"] = err
            obj["ErrorLink"] = ""
            
            return ret_code, obj

    def getPartitionCase(self, expression):
        """ 通过分区表达式获取分区实例 """
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            # 检查表达式是否合法
            if not self.checkPartitionExpression(expression):
                raise Exception("expression is invalid")

            # 正确的expression: $date_format($hour_add($date_add($current_timestamp(),-1),-1),'YYYY-MM-dd:HH')
            expressionSlice = expression.split("'")
            timeStr = expressionSlice[-2]

            # 获取中间表达式的datetime类型 => $hour_add($date_add($current_timestamp(),-1),-1)
            subExpression = expression[len("$date_format("): len(expressionSlice[0]) - 1]
            theTime = self.getTimeByExpression(subExpression)
            models = ['YYYY', 'YY', 'MM', 'M', 'dd', 'd', 'HH', 'H']
            formatStrs = {'YYYY': '%Y', 'YY': '%y',
                          'MM': '%m', 'M': '%m',
                          'dd': '%d', 'd': '%d',
                          'HH': '%H', 'H': '%H'}
            for model in models:
                modelTime = datetime.strftime(theTime, formatStrs[model])
                # 单字符
                if model in ['M', 'd', 'H']:
                    if modelTime[0] == '0':
                        modelTime = modelTime[1:]
                timeStr = timeStr.replace(model, modelTime)
            return ret_code, timeStr
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = str(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj["ErrorCode"] = "Builder.DsmService.getPartitionCase.UnknownError"
            obj["Description"] = err
            obj["Solution"] = "Please check your parameter again."
            obj["ErrorDetails"] = err
            obj["ErrorLink"] = ""
            
            return ret_code, obj

    def getTimeByExpression(self, expression):
        # $hour_add($date_add($current_timestamp(),-1),-1)
        if expression == "$current_timestamp()":
            return datetime.now()
        curFunc = expression.split("(")[0]
        curNumStr = expression.split(",")[-1]
        curNumStr = curNumStr[:len(curNumStr) - 1]
        curNum = int(curNumStr)

        subExpression = expression[len(curFunc) + 1: len(expression) - len(curNumStr) - 2]
        if curFunc == "$hour_add":
            return self.getTimeByExpression(subExpression) + timedelta(hours=curNum)
        elif curFunc == "$date_add":
            return self.getTimeByExpression(subExpression) + timedelta(days=curNum)
        else:
            raise Exception("error! undefined func: {}".format(curFunc))

    def checkTimeModel(self, timeModel):
        '''检查分区模板中是否有多余的字符'''
        if not (timeModel.startswith("'") and timeModel.endswith("'")):
            return False
        models = ['YYYY', 'YY', 'MM', 'M', 'dd', 'd', 'HH', 'H']
        i = 0
        while i < len(models):
            timeModelTmp = timeModel.replace(models[i], '', 1)
            i += 1
            if timeModelTmp != timeModel:
                # 表示有替换的地方，如果替换了YYYY，则跳过YY，防止出现YYYYYY
                i += i % 2
            timeModel = timeModelTmp
        bytes = ['Y', 'M', 'd', 'H']
        for byte in bytes:
            if byte in timeModel:
                return False
        return True

    def checkPartitionExpression(self, expression):
        '''检查分区表达式是否符合要求'''

        # expression = "$date_format($hour_add($date_add($current_timestamp(),-20),-20),'YYYY-MM-dd:HH')"
        if not (expression.startswith("$date_format(") and expression.endswith(")")):
            return False
        if "$current_timestamp()" not in expression:
            return False
        funcStack = []
        str1 = ""
        getTimeModel = False
        for i in range(len(expression)):
            # 识别时间模板阶段
            if getTimeModel:
                if expression[i] == '\'':
                    getTimeModel = False
                str1 += expression[i]
                continue
            if expression[i] == ',':
                if str1 != "":
                    return False
                continue
            elif expression[i] == '(':
                funcStack.append(str1)
                str1 = ""
                continue
            elif expression[i] == ')':
                # 根据函数类型消耗参数
                if len(funcStack) == 0:
                    return False
                if funcStack[-1] == "$date_format":
                    if not self.checkTimeModel(str1):
                        return False
                    return i == len(expression) - 1
                elif funcStack[-1] == "$hour_add" or funcStack[-1] == "$date_add":
                    # str1为空，或者str1不为正整数，并且str1也不为负整数
                    if len(str1) == 0 or not (str1.isdigit() or (str1[0] == '-' and str1[1:].isdigit())):
                        return False
                elif funcStack[-1] == "$current_timestamp":
                    if len(str1) != 0:
                        return False
                else:
                    return False
                funcStack = funcStack[:-1]
                str1 = ""
                continue
            elif expression[i] == '\'':
                getTimeModel = True
            str1 += expression[i]
        return False

    def checkPartitionInfos(self, ds_id, table_name, partition_infos):
        ''' 检查hive分区配置 '''
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        partition_name_error = []
        partition_expression_error = []
        try:
            # 获取当前表的所有分区
            ret_code, ret_message = self.getHivePartitions(ds_id, table_name)
            if ret_code != CommonResponseStatus.SUCCESS.value:
                return ret_code, ret_message
            partitions = ret_message
            for name, expression in partition_infos.items():
                # 判断name是否存在于partitions中
                if name not in partitions:
                    partition_name_error.append(name)
                elif not self.checkPartitionExpression(expression):
                    partition_expression_error.append(name)
            obj["partition_name_error"] = partition_name_error
            obj["partition_expression_error"] = partition_expression_error
            return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj["ErrorCode"] = "Builder.DsmService.checkPartitionInfos.UnknownError"
            obj["Description"] = err
            obj["Solution"] = "Please contact the developers."
            obj["ErrorDetails"] = err
            obj["ErrorLink"] = ""
            return ret_code, obj

    def table_field(self, params_json):
        ds_id = params_json["ds_id"]
        model_name = params_json.get("model_name", "")
        table_name = params_json.get("table_name", "")
        ds = dsm_dao.getdatabyid(ds_id)
        if len(ds) == 0:
            code = codes.Builder_DsmService_TableField_DsIdNotExist

            return 500, Gview2.TErrorreturn(code, ds_id=ds_id)

        # 判断是否有数据源权限
        # ds_ids = [str(ds_id)]
        # user_id = params_json["user_id"]
        # roles = params_json["roles"]
        # auth_list = data_auth.get_data_permission(ds_ids, "ds", user_id, roles)
        # if "DS_VIEW" not in auth_list[0]["codes"]:
        #     code = codes.Builder_dsmService_TableField_NoPermissionError
        #
        #     return 500, Gview2.TErrorreturn(code, ds_id=ds_id)

        if params_json["data_source"] != ds[0]["data_source"]:
            code = codes.Builder_DsmService_TableField_DsNotMatch

            return 500, Gview2.TErrorreturn(code, ds_id=ds_id)
        data_source = params_json["data_source"]
        params_json["ds_address"] = ds[0]["ds_address"]
        params_json["ds_port"] = ds[0]["ds_port"]
        params_json["ds_path"] = ds[0]["ds_path"]
        params_json["ds_user"] = ds[0]["ds_user"]
        params_json["ds_password"] = ds[0]["ds_password"]
        params_json["connect_type"] = ds[0]["connect_type"]
        try:
            if data_source == "mysql":
                ret = dsm_dao.mysql_table_field(params_json)
            elif data_source == "hive":
                ret = dsm_dao.hive_table_field(params_json)
            elif data_source == "sqlserver":
                ret = dsm_dao.sqlserver_table_field(params_json)
            elif data_source == "kingbasees":
                ret = dsm_dao.kingbasees_table_field(params_json)
            elif data_source == "postgresql":
                ret = dsm_dao.postgres_table_field(params_json)
            elif data_source == "clickhouse":
                ret = dsm_dao.clickhouse_table_field(params_json)
        except Exception as e:
            code = codes.Builder_DsmService_TableField_GetTableFieldError

            return 500, Gview2.TErrorreturn(code, cause=repr(e))
        if ret == "-1":
            cause = _l('Password decoding failed. ')
            code = codes.Builder_DsmService_TableField_PasswordError

            return 500, Gview2.TErrorreturn(code, cause=cause)
        elif ret["fields"] == {}:
            cause = _l("Table '%s' or model '%s' doesn't exist. ") % (table_name, model_name)
            code = codes.Builder_DsmService_TableField_GetTableFieldError
            if data_source == "postgresql":
                count, schema_info = otl_dao.postgresConnect(params_json)
                if table_name not in schema_info.get(model_name, []):

                    return 500, Gview2.TErrorreturn(code, cause=cause)
            else:

                return 500, Gview2.TErrorreturn(code, cause=cause)

        return 200, ret

    def ds_sql(self, params_json):
        ds_id = params_json["ds_id"]
        ds = dsm_dao.getdatabyid(ds_id)
        if len(ds) == 0:
            code = codes.Builder_DsmService_DsSql_DsIdNotExist
            return 500, Gview2.TErrorreturn(code, ds_id=ds_id)

        # 判断是否有数据源权限
        # ds_ids = [str(ds_id)]
        # user_id = params_json["user_id"]
        # roles = params_json["roles"]
        # auth_list = data_auth.get_data_permission(ds_ids, "ds", user_id, roles)
        # if "DS_VIEW" not in auth_list[0]["codes"]:
        #     code = codes.Builder_dsmService_DsSql_NoPermissionError
        #
        #     return 500, Gview2.TErrorreturn(code, ds_id=ds_id)

        data_source = ds[0]["data_source"]
        params_json["ds_address"] = ds[0]["ds_address"]
        params_json["ds_port"] = ds[0]["ds_port"]
        params_json["ds_path"] = ds[0]["ds_path"]
        params_json["ds_user"] = ds[0]["ds_user"]
        params_json["ds_password"] = ds[0]["ds_password"]
        params_json["connect_type"] = ds[0]["connect_type"]
        params_json["check_repeat_field"] = False
        params_json["data_num"] = 500
        params_json["limitwide"] = -1
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
                code = codes.Builder_DsmService_DsSql_DataSourceError

                return 500, Gview2.TErrorreturn(code, data_source=data_source)
        except Exception as e:
            code = codes.Builder_DsmService_DsSql_SqlError

            return 500, Gview2.TErrorreturn(code, cause=repr(e))
        except exceptions.FunctionTimedOut:
            code = codes.Builder_DsmService_DsSql_TimeOutError

            return 500, Gview2.TErrorreturn(code)

        if ret == "-1":
            cause = _l('Password decoding failed. ')
            code = codes.Builder_DsmService_DsSql_PasswordError

            return 500, Gview2.TErrorreturn(code, cause=cause)
        ret = {"content": ret["content"]}

        return 200, ret

    def preview_data(self, params_json):
        ds_id = params_json["ds_id"]
        data = dsm_dao.getdatabyid(ds_id)
        if len(data) == 0:
            code = codes.Builder_DsmService_PreviewData_DsIdNotExist

            return 500, Gview2.TErrorreturn(code, ds_id=ds_id)

        # 判断是否有数据源权限
        # ds_ids = [str(ds_id)]
        # user_id = params_json["user_id"]
        # roles = params_json["roles"]
        # auth_list = data_auth.get_data_permission(ds_ids, "ds", user_id, roles)
        # if "DS_VIEW" not in auth_list[0]["codes"]:
        #     code = codes.Builder_dsmService_PreviewData_NoPermissionError
        #
        #     return 500, Gview2.TErrorreturn(code, ds_id=ds_id)

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
            code = codes.Builder_DsmService_PreviewData_DsNotMatch

            return 500, Gview2.TErrorreturn(code)
        try:
            if params_json["data_source"] == "mysql":
                if params_json["connect_type"] == "odbc":
                    ret = otl_dao.mysqlOdbcdatashow(params_json)
                else:
                    ret = otl_dao.mysqldatashow(params_json)
            elif params_json["data_source"] == "postgresql":
                ret = otl_dao.postgresdatashow(params_json)
            elif params_json["data_source"] == "sqlserver":
                ret = otl_dao.sqlserverdatashow(params_json)
            elif params_json["data_source"] == "kingbasees":
                ret = otl_dao.kingbaseesdatashow(params_json)
            elif params_json["data_source"] == "clickhouse":
                ret = otl_dao.clickhousedatashow(params_json)
            elif params_json["data_source"] == "hive":
                ret = otl_dao.hivedatashow(params_json)
        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            code = codes.Builder_OtlService_PreviewData_PreviewError

            return 500, Gview2.TErrorreturn(code, cause=err)

        if ret == "-1":
            code = codes.Builder_DsmService_PreviewData_PasswordError
            cause = 'decipher the password failed.'

            return 500, Gview2.TErrorreturn(code, cause=cause)

        return 200, {'content': ret}


dsm_service = DsmService()

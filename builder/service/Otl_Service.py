# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from dao.graphdb_dao import GraphDB
from third_party_service.anyshare.token import asToken
from utils.log_info import Logger
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from dao.dsm_dao import dsm_dao
from dao.otl_dao import otl_dao
# from dao.dsm_dao import dsm_dao
from utils.Otl_Util import otl_util
import arrow
from utils.CommonUtil import commonutil
from method.knowledge_graph import Ontology
from method.database import DataBase
from config import config as Config
from dao.graph_dao import graph_dao
import os
import pandas as pd
from dao.task_onto_dao import task_dao_onto
import json
from utils.log_info import Logger

class OtlService(object):
    def showtables(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_id=params_json["ds_id"]
        # iddf=dsm_dao.getbyid(ds_id)
        # # if iddf==None:
        data=dsm_dao.getdatabyid(ds_id)
        print(data)
        if len(data)!=0:
            params_json["ds_password"] = data.loc[0, "ds_password"]
            params_json["new_data_source"]=data.loc[0, "data_source"]
            params_json["ds_user"]=data.loc[0, "ds_user"]
            params_json["ds_address"] = data.loc[0,"ds_address"]
            params_json["ds_port"] = data.loc[0, "ds_port"]
            params_json["ds_path"] = data.loc[0, "ds_path"]
            params_json["ds_auth"] = data.loc[0, "ds_auth"]
            if params_json["new_data_source"] != params_json["data_source"]:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                # err = repr(e)
                obj['cause'] = "data_source_table`s data_source != param data_source"
                obj['code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                obj['message'] = "Show table False"
                return ret_code, obj
        else:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            # err = repr(e)
            obj['cause'] = "data_source_table dont have this id 44"
            obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
            obj['message'] = "Show table False"
            return ret_code, obj

        # data_source 1 mysql 2 as 3 hive
        if params_json["data_source"] == "mysql":
            try:
                count,ret = otl_dao.mysqlConnect(params_json)
                if count == "-1":
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = " 解密密码码错误"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "get mysql table false "
                    return ret_code, obj
                res={}
                res["count"]=count
                res["output"] = ret
                obj["res"] = res
                return ret_code, obj
            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                Logger.log_error(err)
                obj['cause']=" You have error in Mysql"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "Get mysql table false "

                if "password" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  mysql has error"
                obj['message'] = "Get mysql table false "
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  mysql has error"
                obj['message'] = "Get mysql table false "
            return ret_code, obj



        elif params_json["data_source"] == "as" or params_json["data_source"] == "as7":
            # postfix = params_json["postfix"]
            # ret_code, res = otl_dao.asCon(params_json)
            # print(res)
            ret_code, obj = otl_dao.asCon(params_json=params_json,version=params_json["data_source"])

            return ret_code, obj
            # if ret_code== CommonResponseStatus.SUCCESS.value:
            #     obj=otl_util.getfile(res,postfix)
            # else:
            #     obj=res

        elif params_json["data_source"] == "hive":
            print("start hive")
            try:
                count, ret = otl_dao.hiveConnect(params_json)
                if count=="-1":
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "解密密码错误"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Get Hive tablelist fail"
                    return  ret_code ,obj
                res = {}
                res["count"] = count
                res["output"] = ret
                obj["res"] = res
                return ret_code, obj
            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                Logger.log_error(err)
                obj['cause'] = err
                if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                    obj['cause'] = "you have an error in your SQL!"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "Get Hive tablelist fail"
                if "Error" in err and "login" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  hive has error"
                obj['message'] = "Get Hive tablelist fail"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  hive has error"

                obj['message'] = "Get Hive tablelist fail"
            return ret_code, obj


    def show_by_postfix(self,params_json):
        obj = {}
        ds_id = params_json["ds_id"]
        # iddf=dsm_dao.getbyid(ds_id)
        # # if iddf==None:
        data = dsm_dao.getdatabyid(ds_id)
        print(data)
        if len(data)!=0:
            params_json["ds_password"] = data.loc[0, "ds_password"]
            # params_json["data_source"] = data.loc[0, "data_source"]
            params_json["ds_user"] = data.loc[0, "ds_user"]
            params_json["ds_address"] = data.loc[0, "ds_address"]
            params_json["ds_port"] = data.loc[0, "ds_port"]
            params_json["ds_path"] = data.loc[0, "ds_path"]
            params_json["data_source"]=data.loc[0, "data_source"]
            params_json["ds_auth"]=data.loc[0, "ds_auth"]
            extract_type=data.loc[0, "extract_type"]
            if extract_type=="standardExtraction"and  params_json["postfix"] not in ["json","csv"]:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                # err = repr(e)
                obj['cause'] = "postfix must be in "+"".join(["json","csv"])
                obj['code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                obj['message'] = "Show by postfix False"
                return ret_code, obj
            if extract_type=="modelExtraction"and  params_json["postfix"] !="all":
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                # err = repr(e)
                obj['cause'] = "postfix must be all "
                obj['code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                obj['message'] = "Show by postfix False"
                return ret_code, obj
        else:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            # err = repr(e)
            obj['cause'] = "data_source_table dont have this id 169"
            obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
            obj['message'] = "Show by postfix False"
            return ret_code, obj

        ret_code, obj = otl_dao.filter_by_postfix(params_json,)
        return ret_code, obj

    def preview_ontology(self,params_json):

        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_id = params_json["ds_id"]
        # iddf=dsm_dao.getbyid(ds_id)
        # # if iddf==None:
        data = dsm_dao.getdatabyid(ds_id)
        print(data)
        if len(data)!=0:
            params_json["ds_password"] = data.loc[0, "ds_password"]
            params_json["data_source"] = data.loc[0, "data_source"]
            params_json["ds_user"] = data.loc[0, "ds_user"]
            params_json["ds_address"] = data.loc[0, "ds_address"]
            params_json["ds_port"] = data.loc[0, "ds_port"]
            params_json["ds_path"] = data.loc[0, "ds_path"]
        else:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            # err = repr(e)
            obj['cause'] = "data_source_table dont have this id 193"
            obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
            obj['message'] = "data_source_table dont have this id 195"
            return ret_code, obj

        try:
            ontologyname = params_json["ontologyname"]
            # user = args.get("user")
            resdf=otl_dao.get_ontology(ontologyname)
            # DAIZUO df转一下
            res = resdf.to_json(force_ascii = False)
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "preview ontology fail"

        return ret_code, obj
    def preview_data2(self, params_json):
        print("preview data ")
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_id = params_json["ds_id"]
        # iddf=dsm_dao.getbyid(ds_id)
        # # if iddf==None:
        data = dsm_dao.getdatabyid(ds_id)
        if not data.empty:
            params_json["ds_password"] = data.loc[0, "ds_password"]
            params_json["new_data_source"] = data.loc[0, "data_source"]
            params_json["ds_user"] = data.loc[0, "ds_user"]
            params_json["ds_address"] = data.loc[0, "ds_address"]
            params_json["ds_port"] = data.loc[0, "ds_port"]
            params_json["ds_path"] = data.loc[0, "ds_path"]
            params_json["ds_auth"] = data.loc[0, "ds_auth"]
            if params_json["new_data_source"] != params_json["data_source"]:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                # err = repr(e)
                obj['cause'] = "data_source_table`s data_source != param data_source"
                obj['code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                obj['message'] = "Preview Data False"
                return ret_code, obj
        else:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            # err = repr(e)
            obj['cause'] = "data_source_table dont have this id"
            obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
            obj['message'] = "Preview Data False"
            return ret_code, obj
        if params_json["data_source"] == "mysql":
            obj = {}
            try:
                ret = otl_dao.mysqldatashow(params_json)
                if ret == "-1":
                    ret_code = CommonResponseStatus.SERVER_ERROR.value

                    obj['cause'] = "解密密码失败"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Show mysql data False"
                    return ret_code, obj

                obj["res"] = ret

                return ret_code, obj
            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                Logger.log_error(err)
                obj['cause'] = " You have error in Mysql"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "password" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  mysql has error"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  mysql has error"
                if "doesn't exist" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['cause'] = "Mysql dont have this database or table"
                if "database" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['cause'] = "Mysql dont have this database or table"
                obj['message'] = "Show mysql data False"
                return ret_code, obj

        if params_json["data_source"] == "hive":
            obj = {}
            try:
                ret = otl_dao.hivedatashow(params_json)
                if ret:
                    obj["res"] = ret

            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                Logger.log_error(err)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "Error" in err and "login" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  hive has error"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  hive has error"
                if "Table not found" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['cause'] = "Hive dont have this database or table"
                if "Database" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['cause'] = "Hive dont have this database or table"
                obj['message'] = "Show Hive data False"
                obj['cause'] = " You have error in Hive"

            return ret_code, obj
        if params_json["data_source"] == "as" or params_json["data_source"] == "as7":
            ret_code, obj = otl_dao.asdatashow(params_json, params_json["data_source"])
            return ret_code, obj
    def preview_data(self,params_json):
        print("preview data ")
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_id = params_json["ds_id"]
        # iddf=dsm_dao.getbyid(ds_id)
        # # if iddf==None:
        data = dsm_dao.getdatabyid(ds_id)
        if len(data)!=0:
            params_json["ds_password"] = data.loc[0, "ds_password"]
            params_json["new_data_source"] = data.loc[0, "data_source"]
            params_json["ds_user"] = data.loc[0, "ds_user"]
            params_json["ds_address"] = data.loc[0, "ds_address"]
            params_json["ds_port"] = data.loc[0, "ds_port"]
            params_json["ds_path"] = data.loc[0, "ds_path"]
            params_json["ds_auth"] = data.loc[0, "ds_auth"]
            if params_json["new_data_source"] != params_json["data_source"]:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                # err = repr(e)
                obj['cause'] = "data_source_table`s data_source != param data_source"
                obj['code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                obj['message'] = "Preview Data False"
                return ret_code, obj
        else:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            # err = repr(e)
            obj['cause'] = "data_source_table dont have this id 242"
            obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
            obj['message'] = "Preview Data False"
            return ret_code, obj
        if params_json["data_source"] == "rabbitmq":
            obj = {}
            obj["res"] = data.loc[0, "json_schema"]
            return ret_code, obj
        if params_json["data_source"]=="mysql":
            obj = {}
            try:
                ret=otl_dao.mysqldatashow(params_json)
                if ret=="-1":
                    ret_code = CommonResponseStatus.SERVER_ERROR.value

                    obj['cause'] = "解密密码失败"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Show mysql data False"
                    return ret_code , obj

                obj["res"] = ret

                return ret_code, obj
            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                Logger.log_error(err)
                obj['cause'] = " You have error in Mysql"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "password" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  mysql has error"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  mysql has error"
                if "doesn't exist" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['cause'] = "Mysql dont have this database or table"
                if "database" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['cause'] = "Mysql dont have this database or table"
                obj['message'] = "Show mysql data False"
                return ret_code, obj

        if params_json["data_source"]=="hive":
            obj = {}
            try:
                ret = otl_dao.hivedatashow(params_json)
                if ret:
                    obj["res"] = ret

            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                Logger.log_error(err)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "Error" in err and "login" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  hive has error"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in  hive has error"
                if "Table not found" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['cause'] = "Hive dont have this database or table"
                if "Database" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['cause'] = "Hive dont have this database or table"
                obj['message'] = "Show Hive data False"
                obj['cause'] = " You have error in Hive"

            return ret_code, obj
        if params_json["data_source"] =="as" or params_json["data_source"] =="as7":
            ret_code,obj = otl_dao.asdatashow(params_json,params_json["data_source"])
            return ret_code,obj
    def ontology_save(self,params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        onto_id = -1
        try:
            # 本体名称是否存在
            ontology_name = params_json.get("ontology_name")
            res = otl_dao.get_ontology(ontology_name)
            if len(res) > 0:
                obj['cause'] = "Ontology name already existed "
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                obj['message'] = "insert fail"
                return 500, obj, -1

            ontology_id = otl_dao.insert_Ontology(params_json)
            res = {}
            res["ontology_id"]=ontology_id

            obj["res"] = res
            onto_id = ontology_id
            # if "new" in otl_id:
            #     res_temp=task_dao_onto.update_task_by_otl_temp(otl_id,res)
            return ret_code, obj, onto_id

            # obj["res"] = "insert ontology "+params_json["ontology_name"]

        except Exception as e:

            ret_code = CommonResponseStatus.SERVER_ERROR.value
            print(e)
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert fail"
            if "Duplicate entry" in err:
                obj['cause'] = "database already have the same name"
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                obj['message'] = "insert fail"
            else:
                obj['cause'] = " You have error in Mysql"
        return ret_code, obj, onto_id

    # def ontology_save(self,params_json):
    #     ret_code = CommonResponseStatus.SUCCESS.value
    #     obj = {}
    #     try:
    #         res = otl_dao.insert_Ontology(params_json)
    #
    #         print(res)
    #         obj["res"] = str(res)
    #
    #         # obj["res"] = "insert ontology "+params_json["ontology_name"]
    #
    #     except Exception as e:
    #
    #         ret_code = CommonResponseStatus.SERVER_ERROR.value
    #         err = repr(e)
    #         obj['cause'] = err
    #
    #         obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
    #         obj['message'] = "insert fail"
    #         if "Duplicate entry" in err:
    #             obj['cause'] = "database already have the same name"
    #             obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
    #             obj['message'] = "insert fail"
    #         else:
    #             obj['cause'] = " You have error in Mysql"
    #
    #
    #
    #     return ret_code, obj
    # def update_ontology_table(self):

    def flatfile(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        ds_id = str(params_json["ds_id"])
        file_list=params_json["file_list"]
        postfix = params_json["postfix"]
        newparams_json = {}
        newparams_json["id"] = ds_id
        newparams_json["file_list"] = file_list
        newparams_json["postfix"] = postfix
        # iddf=dsm_dao.getbyid(ds_id)
        # # if iddf==None:
        data = dsm_dao.getdatabyid(ds_id)

        print(data)
        if len(data)!=0:
            newparams_json["ds_password"] = data.loc[0, "ds_password"]
            newparams_json["data_source"] = data.loc[0, "data_source"]
            newparams_json["ds_user"] = data.loc[0, "ds_user"]
            newparams_json["ds_address"] = data.loc[0, "ds_address"]
            newparams_json["ds_port"] = data.loc[0, "ds_port"]
            newparams_json["ds_path"] = data.loc[0, "ds_path"]
            newparams_json["ds_auth"] = data.loc[0, "ds_auth"]
        else:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            # err = repr(e)
            obj['cause'] = "data_source_table dont have this id 415"
            obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
            obj['message'] = "Show by postfix False"
            return ret_code, obj
        ds_auth = newparams_json['ds_auth']
        print('开始获取AS token', __file__, 'flatfile')
        ret_token, obj_token = asToken.get_token(ds_auth)
        if ret_token != CommonResponseStatus.SUCCESS.value:
            return ret_token, obj_token
        tokenid = obj_token
        try:
            file_list = newparams_json["file_list"]
            table_list=[]
            ret_table,newtable_list=self.get_table_list(file_list,tokenid,table_list,newparams_json)
            if ret_table!=CommonResponseStatus.SUCCESS.value:
                return ret_table,newtable_list

            # print('params_json["table_list"]')
            # table_list=params_json["table_list"]
            # res={}
            # res["count"]=len(table_list)
            # res["output"]=table_list
            # obj["res"]=res
            return ret_code,table_list
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
            if "access token校验失败" in obj['cause']:
                obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
            obj['message'] = "get tablelist false"
            return ret_code, obj

    def get_table_list(self,file_list, tokenid, table_list, params_json):
        ret_code = 200
        new_file_list = []
        ds_port = params_json["ds_port"]
        ds_address = params_json["ds_address"]
        postfix = params_json["postfix"]
        version = params_json["data_source"]
        for file in file_list:
            if file["type"] == "dir":
                docid = file["docid"]
                ret_code, ret_message = otl_dao.filter_file(ds_port, version, ds_address, docid, tokenid, postfix)
                print("otl_service get_table_list ret_message{0}".format(ret_message))
                if ret_code == CommonResponseStatus.SERVER_ERROR.value:
                    return ret_code, ret_message
                output = ret_message["res"]["output"]
                for newfile in output:
                    if newfile["type"] == "file":
                        path = otl_dao.convertpath (newfile["docid"], ds_port, version, ds_address, tokenid)
                        table_list.append([newfile["docid"], newfile["name"], path])
                    if newfile["type"] == "dir":
                        new_file_list.append(newfile)
            else:
                path = otl_dao.convertpath(file["docid"], ds_port, version, ds_address, tokenid)
                table_list.append([file["docid"], path.split("/")[-1], path])
        if len(new_file_list) == 0:
            return ret_code, table_list
        return self.get_table_list(new_file_list, tokenid, table_list, params_json)


    def predict_ontology(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_id = params_json["ds_id"]
        extract_type= params_json["extract_type"]
        data = dsm_dao.getdatabyid(ds_id)
        if len(data)!=0:
            params_json["ds_password"] = data.loc[0, "ds_password"]
            params_json["new_data_source"] = data.loc[0, "data_source"]
            params_json["ds_user"] = data.loc[0, "ds_user"]
            params_json["ds_address"] = data.loc[0, "ds_address"]
            params_json["ds_port"] = data.loc[0, "ds_port"]
            params_json["ds_path"] = data.loc[0, "ds_path"]
            params_json["ds_auth"] = data.loc[0, "ds_auth"]
            params_json["dsname"] = data.loc[0, "dsname"]
            if params_json["new_data_source"] != params_json["data_source"]:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                # err = repr(e)
                obj['cause'] = "data_source_table`s data_source != param data_source"
                obj['code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                obj['message'] = "Predict data False"
                return ret_code, obj
        else:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            # err = repr(e)
            obj['cause'] = "data_source_table dont have this id 503"
            obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
            obj['message'] = "Predict data False"
            return ret_code, obj
        if extract_type=="standardExtraction":
            new_params_json = params_json
            obj = {}
            try:
                ### 文件夹迭选
                #### 获取文件
                if new_params_json["data_source"] == "as7":
                    flat_code, tablelist = otl_service.flatfile(new_params_json)
                    if flat_code == 200:
                        for i in range(len(tablelist)):
                            if new_params_json["postfix"]:
                                tablelist[i].extend(
                                    [str(new_params_json["dsname"]), "running", str(new_params_json["postfix"])])
                        new_params_json["table_list"] = tablelist
                    else:
                        re_obj = {}
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        re_obj['cause'] = "can not get all of files of anyshare"
                        re_obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        re_obj['message'] = "Predict ontology fail"

                        return ret_code, re_obj
                        # return jsonify({'res': tablelist, "code": 500})
                else:
                    file_list = new_params_json["file_list"]
                    tableinfo = []

                    for i in range(len(file_list)):
                        if new_params_json["data_source"]:
                            tableinfo.append(
                                [str(file_list[i]), str(new_params_json["ds_path"]), str(new_params_json["dsname"]),
                                 "running",
                                 str(new_params_json["data_source"])])
                    new_params_json["table_list"] = tableinfo
                # tableinfo = params_json["table_list"]
                # add_code, add_res = task_service.update_otl_task_filelist(new_params_json["table_list"], task_id)
                # if add_code != 200:
                #     self.update_state(state="FAILURE", meta=add_res)
                #     return {'current': 100, 'total': 100}
                if len(new_params_json["table_list"]) == 0:
                    res = {}
                    res["entity_list"] = []
                    res["entity_property_dict"] = []

                    res["entity_relation_set"] = []
                    res["entity_main_table_dict"] = []
                    res["relation_main_table_dict"] = []
                    res["relation_property_dict"] = []
                    res["extract_type"] = "标准抽取"

                    # print(res)
                    obj["res"] = res
                    obj["file_list"] = []
                    return obj
                    # print(res)
                    # obj["res"] = res
                else:
                    if len(new_params_json["table_list"]) > 100:
                        new_params_json["table_list"] = new_params_json["table_list"][0:100]
                    # predicttablelist = []
                    new_entity_property_dict = []
                    new_entity_for_table_dict = []
                    new_relation_property_dict = []
                    new_relation_main_table = []
                    new_relation_set = []
                    if new_params_json["data_source"] not in ["as", "as7"]:  ##hive,masql [a,b,c]
                        # try:
                        # tablelist = params_json["table_list"]
                        # ontology = Ontology()  ########因为初始化问题，每次都需要进行类实例化，要不然会出现缓存未清除的现象
                        # code, res, entity_list, entity_property_dict, entity_relation_set, entity_for_table_dict, name_rule_dict, pro_type_dict, newtable_list = ontology.data_processing(
                        #     new_params_json)
                        # #####newtable_list update to mysql
                        # if len(entity_list) == 0:  ####如果算法没有提取到 则常规提取
                        try:
                            # new_params_json["newtablelist"] = [i[0] for i in new_params_json["table_list"]]
                            new_params_json["newtablelist"] = new_params_json["table_list"]
                            code_extract, res_extract = DataBase(new_params_json).get_entity_edge(new_params_json)
                            if code_extract != CommonResponseStatus.SUCCESS.value:
                                re_obj = {}
                                ret_code = CommonResponseStatus.SERVER_ERROR.value
                                re_obj['cause'] = res_extract['cause']
                                re_obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                                re_obj['message'] = "Predict ontology fail"

                                return ret_code, re_obj
                                # raise Ignore()
                                # return code_extract, res_extract
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
                            obj["res"] = res
                            # obj["file_list"] = res_extract["file_list"]

                            return ret_code,obj
                        except Exception as e:
                            re_obj = {}
                            ret_code = CommonResponseStatus.SERVER_ERROR.value
                            re_obj['cause'] = repr(e)
                            re_obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                            re_obj['message'] = "Predict ontology fail"
                            return ret_code, re_obj


                    else:  ###as
                        try:  ####常规提取
                            tablelist_as = new_params_json["table_list"]
                            newtabledic = {}
                            new_params_json["new_table_list"] = []
                            if tablelist_as:
                                for table in tablelist_as:
                                    newtabledic[table[0]] = table[1:]
                                    new_params_json["new_table_list"].append(table)
                            code_extract, res_extract = DataBase(new_params_json).get_entity_edge(new_params_json)
                            if code_extract != CommonResponseStatus.SUCCESS.value:
                                re_obj = {}
                                ret_code = CommonResponseStatus.SERVER_ERROR.value
                                re_obj['cause'] = res_extract['cause']
                                re_obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                                re_obj['message'] = "Predict ontology fail"

                                return ret_code, re_obj
                                # raise Ignore()
                                # return code_extract, res_extract
                            # newtable_list = res_extract["file_list"]
                            new_entity_list = res_extract["res"]["entity_list"]
                            new_entity_property_dict = res_extract["res"]["entity_property_dict"]

                            new_entity_for_table_dict = res_extract["res"]["entity_main_table_dict"]
                            new_entity_for_table_dict_path = []
                            if len(new_entity_for_table_dict) != 0:
                                for entity in new_entity_for_table_dict:
                                    main_table = entity["main_table"]
                                    entity["main_table"] = []
                                    if main_table:
                                        for one in main_table:
                                            path = newtabledic[one]
                                            entity["main_table"].append([one, path[0], path[1]])
                                        new_entity_for_table_dict_path.append(entity)

                            res = {}
                            res["entity_list"] = [list(t) for t in set(tuple(_) for _ in new_entity_list)]
                            res["entity_property_dict"] = new_entity_property_dict
                            res["entity_relation_set"] = new_relation_set
                            res["entity_main_table_dict"] = new_entity_for_table_dict_path
                            res["relation_main_table_dict"] = new_relation_main_table
                            res["relation_property_dict"] = new_relation_property_dict
                            res["extract_type"] = "标准抽取"
                            obj["res"] = res
                            # obj["file_list"] = newtable_list
                            return ret_code,obj
                        except Exception as e:
                            err = repr(e)
                            re_obj = {}
                            ret_code = CommonResponseStatus.SERVER_ERROR.value
                            re_obj['cause'] = err
                            re_obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                            re_obj['message'] = "Predict ontology fail"

                            return ret_code, re_obj
                            # raise Ignore()
                            # return ret_code, obj
            except Exception as e:
                err = repr(e)
                re_obj = {}
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                re_obj['cause'] = err
                re_obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                re_obj['message'] = "Predict ontology fail"

                return ret_code, re_obj

        else:
            ret_code,obj=otl_dao.get_annotation_otl(params_json)
            return ret_code,obj

    def getmodelotl(self,params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            obj = otl_dao.getmodelotl(params_json)
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get model otl fail"
        return ret_code, obj

    def get_model_spo(self,params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            obj = otl_dao.getmodelspo(params_json)
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get model spo fail"
        return ret_code, obj

    def get_model_list(self):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            obj=otl_dao.getmodelschema()
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get model list fail"
        return ret_code, obj

    # 本体列表 遍历处理
    def optotl(self,rec_dict):
        reslists = []
        # 遍历本体库
        for reslist in rec_dict:
            resdict = {}
            entitypronum = 0
            sourcesum = []
            edgepronum = 0
            entitynums = 0
            # resdict["edgepropertynums"] = 0
            # 遍历每条 dict
            for key in reslist:
                value = reslist[key]
                if key == "entity":
                    value = eval(value)
                    entitynums = len(value)
                    resdict["entitynums"] = entitynums
                    if entitynums == 0:
                        entitypronum = 0 + entitypronum
                    else:
                        # 遍历属性dict
                        for property in value:
                            print(property)
                            for property_key in property:
                                if property_key == "properties":
                                    p_v = property[property_key]
                                    # property_value = eval(property[property_key])
                                    propertynums = len(p_v)
                                    entitypronum = propertynums + entitypronum
                                if property_key == "source_table":
                                    s_v = property[property_key]
                                    if len(s_v)!=0:
                                        for one in s_v:
                                            if one[0] not in sourcesum:
                                                sourcesum.append(s_v)


                elif key == "edge":
                    edgenums = len(eval(value))
                    resdict["edgenums"] = len(eval(value))
                    value = eval(value)
                    if edgenums == 0:
                        edgepronum = 0 + edgepronum
                    else:
                        # 遍历属性dict
                        for property in value:
                            print(property)
                            for property_key in property:
                                if property_key == "properties":
                                    p_v = property[property_key]
                                    # property_value = eval(property[property_key])
                                    propertynums = len(p_v)
                                    edgepronum = propertynums + edgepronum

                elif key == "id":
                    print(value)
                    resdict["otl_id"] = value
                    usedotlid = graph_dao.getdatabyotlid("[" + str(value) + "]")
                    if len(usedotlid) != 0:
                        otlid = str(usedotlid[0])
                    else:
                        otlid = "-"
                    resdict["usedotlname"] = otlid


                elif key == "used_task" or key == "all_task":
                    resdict[key] = eval(value)

                else:
                    resdict[key] = value

            ##因为相关数据源不再显示，所以总数去掉sourcenum
            # resdict["sum"] = len(sourcesum) + entitynums + edgenums
            resdict["sum"] = entitynums + edgenums
            resdict["related_ds_num"] = len(sourcesum)
            reslists.append(resdict)

        return reslists


    # lzg add
    def getall(self, args):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            kgIds = []
            page = args.get("page")
            size = args.get("size")
            order = args.get("order")
            count = otl_dao.getCount()
            res = {}
            res["count"] = count
            ret = otl_dao.getall(int(page)-1, int(size), order, kgIds)
            rec_dict = ret.to_dict('records')
            # rec_dict["entity"] = eval(rec_dict["entity"])
            # print(rec_dict)
            ##### 本体导入
            if page == "-1":
                list_all = []
                for reslist in rec_dict:
                    dict_all = {}
                    otl_id = reslist["id"]
                    entity = reslist["entity"]
                    entity_value = eval(entity)
                    used_task = eval(reslist["used_task"])
                    if len(entity_value) != 0 :
                        task_in_table = task_dao_onto.get_all_by_otlid(otl_id)
                        alltask = task_in_table["task_id"].tolist()
                        running_task = task_in_table["task_status"].tolist()
                        difference = [i for i in alltask if i not in used_task]
                        if "running" not in running_task and len(difference) == 0:
                            dict_all["ontology_name"] = reslist["ontology_name"]
                            list_all.append(dict_all)

                res["df"] = list_all

            else:
                # print(rec_dict)
                ###### 本题库
                res["df"] = self.optotl(rec_dict)

            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "query ontology fail"

        return ret_code, obj

    def delete(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        message = ""
        obj = {}
        flag_code = False
        ids = params_json["otlids"]
        ids = set(ids)
        try:
            df = otl_dao.getbyids(ids)
            ret_list = list(set(ids) ^ set(df["id"]))
            # 不存在的 id
            if len(ret_list) > 0:
                flag_code = True
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                message += "%s not exits!" % ",".join('%s' % id2 for id2 in ret_list)

            if len(df) > 0:
                useds = graph_dao.getdsgraphuse_otl()
                useds = useds.dropna(axis=0, how='all')
                # useds = useds[useds["graph_ds"]]
                useds = useds['graph_otl'].drop_duplicates().values.tolist()
                used_list = []
                for i in useds:
                    i = eval(i)
                    used_list.extend(i)

                # 使用中所有的和参数中存在的id 交集 不能删除
                use_list = list(set(df["id"]).intersection(set(used_list)))
                # 参数中存在的id和不能删除的差集 可删除
                unuse_list = list(set(df["id"]) ^ set(use_list))
                if len(unuse_list) > 0:
                    ret = otl_dao.delete(unuse_list)
                    #####删除本体相关任务##########
                    task_data = task_dao_onto.get_otl_task_list(unuse_list)
                    if len(task_data) > 0:
                        for index, row in task_data.iterrows():
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
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "delete %s failed!" % ",".join('%s' % id2 for id2 in ids)

        return ret_code, obj
    # 和查询所有本体重复，待重构
    def getbyotlname(self, otlid, args, num):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        if num == 1:
            try:
                ret = otl_dao.getbyid(otlid)
                count = len(ret)
                rec_dict = ret.to_dict('records')
                res = {}
                list_all = []
                for reslist in rec_dict:
                    dict_all = {}
                    for key in reslist:
                        if key == "entity" or key == "edge" or key == "used_task" or key == "all_task":
                            value = reslist[key]
                            value = eval(value)
                            dict_all[key] = value
                        else:
                            dict_all[key] = reslist[key]
                    list_all.append(dict_all)

                res["df"] = list_all
                res["count"] = count
                obj["res"] = res

            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                Logger.log_error(err)
                obj['cause'] = err
                if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                    obj['cause'] = "you have an error in your SQL!"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "query ontology %s fail" % otlid

        else:
            try:
                kgIds = []
                page = args.get("page")
                otlname = args.get("otlname")
                size = args.get("size")
                order = args.get("order")
                state = args.get("otl_status")
                if otlname == "":
                    if state == "all":
                        count = otl_dao.getCount()
                        ret = otl_dao.getall(int(page) - 1, int(size), order,kgIds)
                        rec_dict = ret.to_dict('records')
                    else:
                        count = otl_dao.getcountbystate(state)
                        ret = otl_dao.getallbystate(int(page) - 1, int(size), order,state)
                        rec_dict = ret.to_dict('records')
                else:
                    if state == "all":
                        count = otl_dao.getCountbyname(otlname)
                        ret = otl_dao.getallbyname(otlname, int(page) - 1, int(size), order)
                        rec_dict = ret.to_dict('records')
                    else:
                        count = otl_dao.getCountbynameandstate(otlname,state)
                        ret = otl_dao.getallbynameandstate(otlname, int(page) - 1, int(size), order,state)
                        rec_dict = ret.to_dict('records')
                res = {}
                res["count"] = count
                res["df"] = self.optotl(rec_dict)
                obj["res"] = res
            except Exception as e:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                err = repr(e)
                Logger.log_error(err)
                obj['cause'] = err
                if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                    obj['cause'] = "you have an error in your SQL!"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "query  ontology %s fail" % otlname

        return ret_code, obj
    def update_name(self, otl_id,params_json,flag):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            df = otl_dao.getbyid(otl_id)
            # 本体不存在
            if len(df) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "id  %s not exist!" % otl_id
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "update fail"
                return ret_code, obj
            # 不可编辑
            else:
                graph_otl = graph_dao.getdatabyotlid("[" + str(otl_id) + "]")
                if len(graph_otl) != 0:
                    if flag == "-1":
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "id  %s can not be edit !" % otl_id
                        obj['code'] = CommonResponseStatus.EDIT_USED_ERROR.value  # 加新状态码
                        obj['message'] = "update fail"
                        return ret_code, obj

                    else:
                        otl_dao.update_name(otl_id, params_json)
                        obj["res"] = "update "
                else:
                    otl_dao.update_name(otl_id, params_json)
                    obj["res"] = "update "

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['cause'] = "database already have the same name"
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "update fail"

        return ret_code, obj
    def update_info(self, otl_id,params_json,flag,grapid=None):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            df = otl_dao.getbyid(otl_id)
            otl_id = params_json["ontology_id"]
            flag_save = params_json["flag"]
            all_data = task_dao_onto.get_all_by_otlid(otl_id)
            alltask = all_data["task_id"].tolist()
            params_json["all_task"] = alltask
            running_task = all_data["task_status"].tolist()
            if "running" in running_task:
                if flag_save == "nextstep":
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "ontology can`t be saved with running task for nextstep"
                    obj['code'] = CommonResponseStatus.CANT_SAVE_OTL.value
                    obj['message'] = "insert fail"
                    return ret_code, obj

            # 本体不存在
            if len(df) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "id  %s not exist!" % otl_id
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "update fail"
                return ret_code, obj
            # 不可编辑
            else:
                graph_otl = graph_dao.getdatabyotlid("[" + str(otl_id) + "]")
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
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['cause'] = "database already have the same name"
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "update fail"

        return ret_code, obj

    def copy_otl(self,params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            temp_id=""
            otl_id=params_json["ontology_id"]
            df = otl_dao.getbyid(otl_id)
            if len(df) == 0:
                ret_code=CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "ontology_id doesn`t exist!"
                obj['code'] = CommonResponseStatus.OTL_EXIST_ERR.value
                obj['message'] = "query ontology fail"
                return ret_code, obj
            otl_task = task_dao_onto.get_all_by_otlid(otl_id)
            otl_task_list = otl_task["ontology_id"].values.tolist()
            if otl_id in otl_task_list:
                max_id=task_dao_onto.get_max_id().loc[0,"task_id"]
                temp_id = "new" + str(int(max_id) + 1)
                task_dao_onto.replace_task(temp_id,otl_id)
            onto_df=otl_dao.getbyid(otl_id)
            entity=onto_df.loc[0,"entity"]
            edge = onto_df.loc[0, "edge"]
            ontology_name = onto_df.loc[0, "ontology_name"]
            ontology_des = onto_df.loc[0, "ontology_des"]
            obj["res"]={}
            obj["res"]["ontology_id"]=temp_id
            obj["res"]["ontology_name"] = ontology_name
            obj["res"]["entity"] = eval(entity)
            obj["res"]["edge"] = eval(edge)
            obj["res"]["ontology_des"] = ontology_des

            return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "query ontology fail"

            return ret_code, obj


    def getotlbyname(self,otlname):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            res = {}
            ret = otl_dao.getbyname(otlname)
            rec_dict = ret.to_dict('records')
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
            Logger.log_error(err)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err or "column" in err.lower() or "row" in err.lower():
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "query ontology fail"

        return ret_code, obj

    def getdocname(self,ds_id,docid):
        obj = {}
        params_json={}
        data = dsm_dao.getdatabyid(ds_id)
        print(data)
        if len(data)!=0:
            params_json["ds_password"] = data.loc[0, "ds_password"]
            params_json["data_source"] = data.loc[0, "data_source"]
            params_json["ds_user"] = data.loc[0, "ds_user"]
            params_json["ds_address"] = data.loc[0, "ds_address"]
            params_json["ds_port"] = data.loc[0, "ds_port"]
            params_json["ds_path"] = data.loc[0, "ds_path"]
            params_json["ds_auth"] = data.loc[0, "ds_auth"]
        else:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            # err = repr(e)
            obj['cause'] = "dataSourcetable dont have this id 1290"
            obj['code'] = CommonResponseStatus.DS_NO_EXIST_ERROR.value
            obj['message'] = "Show by postfix False"
            return ret_code, obj
        ds_auth = params_json['ds_auth']
        print('开始获取AS token', __file__, 'getdocname')
        ret_token, obj_token = asToken.get_token(ds_auth)
        if ret_token != CommonResponseStatus.SUCCESS.value:
            return ret_token, obj_token
        tokenid = obj_token

        ret_name, obj_name=otl_dao.get_docid_name(tokenid,docid,params_json["ds_address"],params_json["ds_port"])
        return ret_name,obj_name


    def getds(self):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            count = dsm_dao.getCounts1()
            res = {}
            ret = dsm_dao.getdsbyid()
            rec_dict = ret.to_dict('records')
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

    def getAllOtlIds(self):
        ret_code = CommonResponseStatus.SUCCESS.value
        try:
            ret = otl_dao.getAllOtlId()
            dfs = ret.to_dict('records')
            otlIds = [df.get("id") for df in dfs]
            return otlIds, ret_code
        except Exception as e:
            obj = {}
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            obj['message'] = "mysql connection error "
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            return obj, ret_code

    # 根据本体id查询本体状态
    def getOtlStatus(self, otlid):
        try:
            df = otl_dao.getOtlStatusbyid(otlid)
            status = df.to_dict("records")[0].get("otl_status")
            return status, 200
        except Exception as e:
            obj = {}
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
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
            Logger.log_error(err)
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

    # 根据本体id查询本体状态
    def getOtlId(self, otl_name):
        try:
            df = otl_dao.getOtlIdbyname(otl_name)
            if len(df) == 0:
                return -1, 200
            otlid = df.to_dict("records")[0].get("id")
            return otlid, 200
        except Exception as e:
            obj = {}
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            obj['message'] = "mysql connection error "
            obj["code"] = CommonResponseStatus.REQUEST_ERROR.value
            return obj, ret_code
    
    # 根据kgid查询本体id
    def getOtlIdbyKGId(self, kgid):
        # 根据kgid获取configid
        configid = graph_dao.get_configid_by_kgid(kgid)
        if len(configid) == 0:
            return 500, Gview.TErrorreturn(
                ErrorCode='Builder.service.ontology.getOtlIdbyKGId.kgidNotExists',
                Description="kgid {} not exist!".format(kgid),
                ErrorDetails="kgid {} not exist!".format(kgid),
                Solution='Please check mariaDB.',
                ErrorLink=''
            )
        configid = configid.iloc[0]['KG_config_id']
        # 根据configid获取otlid
        graph_info = graph_dao.getbyid(configid)
        if len(graph_info) == 0:
            return 500, Gview.TErrorreturn(
                ErrorCode='Builder.service.ontology.getOtlIdbyKGId.configidNotExists',
                Description="configid {} not exist!".format(configid),
                ErrorDetails="configid {} not exist!".format(configid),
                Solution='Please check mariaDB.',
                ErrorLink=''
            )
        graph_otl = graph_info.iloc[0]["graph_otl"]
        graph_otl = eval(graph_otl)
        if len(graph_otl) < 1:
            return 500, Gview.TErrorreturn(
                ErrorCode='Builder.service.ontology.getOtlIdbyKGId.otlidNotExists',
                Description="configid {} does not have ontology.".format(configid),
                ErrorDetails="configid {} does not have ontology.".format(configid),
                Solution=f'Please config ontology for graph where configid={configid}',
                ErrorLink=''
            )
        return 200, graph_otl[0]
    
    def filterotl(self, kgid, ret_otl):
        '''过滤本体中不在图数据库中的点或边'''
        # 根据kgid获取configid
        configid = graph_dao.get_configid_by_kgid(kgid)
        if len(configid) == 0:
            return 500, Gview.TErrorreturn(
                ErrorCode='Builder.service.ontology.getOtlIdbyKGId.kgidNotExists',
                Description="kgid {} not exist!".format(kgid),
                ErrorDetails="kgid {} not exist!".format(kgid),
                Solution='Please check mariaDB.',
                ErrorLink=''
            )
        configid = configid.iloc[0]['KG_config_id']
        # 根据configid获取graphdb信息
        graph_info = graph_dao.getbyid(configid)
        graph_baseInfo = eval(graph_info.iloc[0]['graph_baseInfo'])[0]
        graphdb_id = graph_baseInfo['graph_db_id']
        db = graph_baseInfo['graph_DBName']
        graphdb = GraphDB(graphdb_id)
        code, graph_shema = graphdb.get_schema(db)
        otl = ret_otl['res']['df'][0]
        otl_filtered = otl.copy()
        otl_filtered['entity'] = []
        otl_filtered['edge'] = []
        entity_names = []
        for aentity in otl['entity']:
            if aentity['name'] in graph_shema['entity']:
                otl_filtered['entity'].append(aentity)
                entity_names.append(aentity['name'])
        for aedge in otl['edge']:
            if aedge['name'] in graph_shema['edge']:
                # 过滤不合法的边
                if aedge['relations'][0] in entity_names and aedge['relations'][2] in entity_names:
                    otl_filtered['edge'].append(aedge)
        ret_otl['res']['df'][0] = otl_filtered
        return CommonResponseStatus.SUCCESS.value, ret_otl

otl_service = OtlService()

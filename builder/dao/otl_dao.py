# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db
import pymysql
import time
import pandas as pd
from utils.DB import DB
# from utils.hiveUtil import HiveClient
import arrow
import base64
import datetime
from utils.log_info import Logger
from dao.dsm_dao import dsm_dao
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5 as Cipher_pkcsl_v1_5
import chardet
from configparser import ConfigParser
from config import config as Config
import requests
from utils.Otl_Util import otl_util
import json
from flask import request

from utils.common_response_status import CommonResponseStatus
from utils.CommonUtil import commonutil
from third_party_service.anyshare.token import asToken
# from pdfminer.pdfparser import PDFParser,PDFDocument
# from pdfminer.pdfparser import PDFParser,PDFDocument
# from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
# from pdfminer.converter import PDFPageAggregator
# from pdfminer.layout import *
# from pdfminer.pdfinterp import PDFTextExtractionNotAllowed
import os
import io
import xlrd
import csv
import zipfile
import configparser

config = configparser.ConfigParser()
config.read("./../config/asapi.conf")


# hiveclient=HiveClient()
class OtlDao(object):
    postfixdic = {}
    postfixdic["excel"] = ["xlsx", "xls", "xlsm", "xlsb", "xltx", "xltm", "xml", "xlam", "xla", "xlw", "xlr"]

    postfixdic["json"] = ["json"]
    postfixdic["csv"] = ["csv"]
    # postfixdic["all"] = ["ppt","pptx","pdf","doc","docx","txt"]
    # postfixdic["ppt"] = ["ppt","pptx"]
    # postfixdic["pdf"] = ["pdf"]
    # postfixdic["doc"] = ["doc","docx"]
    # postfixdic["txt"] = ["txt"]

    public_key = '''-----BEGIN PUBLIC KEY-----
    MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC7JL0DcaMUHumSdhxXTxqiABBC
    DERhRJIsAPB++zx1INgSEKPGbexDt1ojcNAc0fI+G/yTuQcgH1EW8posgUni0mcT
    E6CnjkVbv8ILgCuhy+4eu+2lApDwQPD9Tr6J8k21Ruu2sWV5Z1VRuQFqGm/c5vaT
    OQE5VFOIXPVTaa25mQIDAQAB
    -----END PUBLIC KEY-----
    '''

    def getHiveClient(self):
        from utils.ConnectUtil import HiveClient
        return HiveClient

    def RSAEndcode(self, msg):
        msg = bytes(msg, encoding="utf8")
        rsakey = RSA.importKey(self.public_key)
        cipher = Cipher_pkcsl_v1_5.new(rsakey)
        cipher_text = base64.b64encode(cipher.encrypt(msg))
        return cipher_text.decode()

    def mysqlConnect(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        password = params_json['ds_password']
        # # 注释 解密 测试连接时，输入密码不需要解密，从数据库拿出来的才要解密
        # password = commonutil.DecryptBybase64(password)
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1", []
        conn = pymysql.connect(host=ip, port=int(port), user=user, password=password, database=database, charset="utf8",
                               connect_timeout=10, read_timeout=10, write_timeout=10)
        cursor = conn.cursor()
        sql1 = "show tables"
        # sql = """SELECT TABLE_NAME FROM information_schema.`TABLES`
        #         WHERE TABLE_SCHEMA = "{}"
        #         ORDER BY TABLE_NAME
        #         LIMIT {} OFFSET {}; """
        # sql = sql.format(database,str(size), str(offset))
        # cursor.execute(sql)
        # ret = cursor.fetchall()
        cursor.execute(sql1)
        ret = cursor.fetchall()
        count = len(ret)
        ret1 = [x[0] for x in ret]
        print(ret1)
        cursor.close()
        conn.close()

        return count, ret1

    def mysqldatashow(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        password = params_json['ds_password']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        tablename = params_json['name']
        limitsize = 50
        limitwide = 100
        conn = pymysql.connect(host=ip, port=int(port), user=user, password=password, database=database, charset="utf8",
                               connect_timeout=10, read_timeout=10, write_timeout=10)
        cursor = conn.cursor()
        sql = """SELECT * FROM {} LIMIT 0,{}; """
        sql = sql.format(tablename, limitsize)
        sql0 = "desc {}".format(tablename)
        cursor.execute(sql0)
        ret = pd.read_sql_query(sql, conn).fillna("")
        colums = ret.columns.tolist()
        for c in colums:
            ret[c] = ret[c].apply(str)
        try:
            ret = ret.iloc[:, :limitwide]
        except Exception:
            ret = ret
        res = []
        res.append(ret.columns.values.tolist())
        for i, row in ret.iterrows():
            res.append(row.values.tolist())
        cursor.close()
        conn.close()

        return res

    def hivedatashow(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        password = params_json['ds_password']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        tablename = params_json['name']
        limitsize = 50
        limitwide = 100
        start = datetime.datetime.now()
        HiveClient = self.getHiveClient()
        hiveCli = HiveClient(ip, user, password, database, port)
        end = datetime.datetime.now()
        print("hive connection time is ")
        print((end - start).seconds)
        start = datetime.datetime.now()
        sql0 = """DESC `{}`"""
        sql0 = sql0.format(tablename)
        ret0 = hiveCli.query(sql0)
        end = datetime.datetime.now()
        print("hive query columns time is ")
        print((end - start).seconds)
        resultlist = []
        headlist = [x[0] for x in ret0]
        print(headlist)
        resultlist.append(headlist[:limitwide])
        sql = "SELECT * FROM {}.`{}` LIMIT {} "
        sql = sql.format(database, tablename, limitsize)
        Logger.log_info(sql)
        start = datetime.datetime.now()
        ret = hiveCli.query(sql)
        end = datetime.datetime.now()
        print("hive query data time is ")
        print((end - start).seconds)
        # ret = pd.read_sql(sql, conn)
        print(ret)
        start = datetime.datetime.now()
        for data in ret:
            linelist = [str(x).replace("None", "") for x in data]
            resultlist.append(linelist[:limitwide])

        # obj = {}
        # obj["res"] = resultlist
        # obj["viewtype"] = "non-json"
        end = datetime.datetime.now()
        print("hive return data time is ")
        print((end - start).seconds)
        # ret = pd.read_sql(sql, conn)
        print(ret)

        return resultlist
        # tablename = params_json['tablename']
        # # limitsize = 200
        #
        # hiveCli.close()
        # return data

    def hiveConnect(self, params_json):
        print("start hive")
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        password = params_json['ds_password']
        # page = int(params_json['page'])
        # size = int(params_json['size'])
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1", []
        HiveClient = self.getHiveClient()
        hiveCli = HiveClient(ip, user, password, database, port)
        print("show")
        sql = """SHOW TABLES"""
        # sql = sql.format(size, page, size,size)
        # sql = """select * from testdate_6_7c_e_s_r_xlsx"""
        ret = hiveCli.query(sql)
        count = len(ret)
        ret1 = [x[0] for x in ret]
        print(ret1)

        hiveCli.close()
        return count, ret1

    def asCon(self, params_json, version):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_auth = params_json['ds_auth']
        print('开始获取AS token', __file__, 'asCon')
        ret_token, obj_token = asToken.get_token(ds_auth)
        if ret_token != CommonResponseStatus.SUCCESS.value:
            return ret_token, obj_token
        tokenid = obj_token

        try:
            port = str(params_json["ds_port"])
            getpath = config.get(version, "getinfobypath")

            url = params_json["ds_address"] + ':' + port + getpath
            payload = {"namepath": params_json["ds_path"]}
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenid
            }

            response = requests.request("POST", url, headers=headers, data=json.dumps(payload), timeout=10,
                                        verify=False)
            resp_json = response.json()
            if response.status_code == 200:  #####获得docid 获得路径
                docid = resp_json["docid"]
                name = resp_json["name"]
                res = {}
                output = {}
                res["count"] = 1
                output["docid"] = docid
                output["name"] = name
                output["type"] = "dir"
                res["output"] = [output]
                obj["res"] = res
                return ret_code, obj


            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = resp_json['cause']
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "access token校验失败" in obj['cause']:
                    obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
                obj['message'] = "Get anyshare dir or file fail "
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "access token校验失败" in obj['cause']:
                obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
            obj['message'] = "Get anyshare dir or file fail "
            return ret_code, obj

    def convertpath(self, docid, ds_port, version, ds_address, tokenid):
        port = str(ds_port)
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + tokenid
        }
        params = {"docid": docid}
        convert = config.get(version, "convertpath")
        r = requests.post(ds_address + ':' + port + convert,
                          data=json.dumps(params), headers=headers,
                          verify=False, timeout=(10, 20))
        resp_json2 = r.json()
        if r.status_code == 200:
            path = resp_json2["namepath"]
            return path

    def getversion(self, ds_address):
        default_version = 'AnyShare-Server-7.0.2.2-20211018-el7.x86_64-13'
        headers = {
            'Content-Type': 'application/json'
        }
        getconfig = config.get("as7", "getconfig")
        try:
            r = requests.get(ds_address + ':' + "8080" + getconfig, headers=headers,
                             verify=False, timeout=(10, 20))
            resp_json2 = r.json()
            if r.status_code == 200:
                version = resp_json2["install_package"]
            else:
                version = default_version
        except Exception:
            version = default_version
        return version

    def filter_by_postfix(self, params_json):
        docid = params_json["docid"]
        version = params_json["data_source"]
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_auth = params_json['ds_auth']
        print('开始获取AS token', __file__, 'filter_by_postfix')
        ret_token, obj_token = asToken.get_token(ds_auth)
        if ret_token != CommonResponseStatus.SUCCESS.value:
            return ret_token, obj_token
        tokenid = obj_token
        ds_port = params_json["ds_port"]
        ds_address = params_json["ds_address"]
        postfix = params_json["postfix"]

        try:
            ret_filter, obj_filter = self.filter_file(ds_port, version, ds_address, docid, tokenid, postfix)
            # if ret_filter != CommonResponseStatus.SUCCESS.value:
            #     return ret_filter, obj_filter
            # else:
            return ret_filter, obj_filter
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = " Show by postfix False "
            return ret_code, obj

    def filter_file(self, ds_port, version, ds_address, docid, tokenid, postfix):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        port = str(ds_port)
        dirlist = config.get(version, "dirlist")
        dirlist_url = ds_address + ':' + port + dirlist
        dirlist_payload = {"docid": docid}
        dirlist_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + tokenid
        }
        dirlist_response = requests.request("POST", dirlist_url, headers=dirlist_headers, timeout=10,
                                            data=json.dumps(dirlist_payload), verify=False)
        print("otldao filter_by_postfix dirlist_response {0}".format(dirlist_response))
        resp_json2 = dirlist_response.json()
        print(resp_json2)
        # print("resp_json2")
        # print(resp_json2)
        # print("dirlist_response.status_code")
        # print(dirlist_response.status_code)
        if dirlist_response.status_code == 200:
            # print("files")
            files = resp_json2["files"]
            dirs = resp_json2["dirs"]
            resp_json2["newfiles"] = []
            resp_json2["newdirs"] = []
            for dir in dirs:
                newdir = {}
                newdir["docid"] = dir["docid"]
                newdir["name"] = dir["name"]
                newdir["type"] = "dir"
                resp_json2["newdirs"].append(newdir)
            postfix = postfix.lower()

            for file in files:
                filename = file["name"]
                file_type = filename.split(".")[-1]
                print(filename)
                try:
                    if postfix == "all" or file_type.lower() in self.postfixdic[postfix]:
                        newfile = {}
                        newfile["docid"] = file["docid"]
                        newfile["name"] = file["name"]
                        newfile["type"] = "file"
                        resp_json2["newfiles"].append(newfile)
                except Exception:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = "Con`t support this type of file"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = " Show by postfix False "
                    return ret_code, obj

            resp_json2.pop("files")
            resp_json2.pop("dirs")
            dirs = resp_json2["newdirs"]
            files = resp_json2["newfiles"]
            dirs.extend(files)
            print(dirs)
            count = len(dirs)
            res = {}
            # pre = (page - 1) * size
            # aft = pre + size
            # if pre <= count:
            #     if aft <= count:
            #         output = dirs[pre:aft]
            #     else:
            #         output = dirs[pre:]
            # else:
            #     output = []

            res["output"] = dirs
            res["count"] = count
            obj["res"] = res
            return ret_code, obj
        else:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj['cause'] = resp_json2['cause']
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "gns" in resp_json2['cause'].lower() and "不存在" in resp_json2['cause'].lower():
                obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
            elif "access token校验失败" in obj['cause']:
                obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
            obj['message'] = " Show by postfix False "
            return ret_code, obj

    def getmodelschema(self):
        obj = {}
        res = {}
        try:
            modeldir = Config.modeldir
            print(modeldir)
            files = os.listdir(modeldir)
            files.sort()
            if "basemodel" in files:
                files.remove("basemodel")
            for file in files:
                if file == "bert-base-chinese":
                    continue
                file_path = modeldir + "/" + file + "/model_name.txt"
                with open(file_path, "r", encoding="utf-8") as f:
                    name = f.readlines()[0]
                    res[file] = name.strip()
            obj["res"] = res
        except Exception as e:
            Logger.log_error("get model list error: {}".format(repr(e)))
        return obj

    def getmodelspo(self, params_json):
        obj = {}
        model = params_json["model"]
        modeldir = Config.modeldir
        res = {}
        schemadir = modeldir + "/" + model + "/schema/schema_english.json"
        schemadir_c = modeldir + "/" + model + "/schema/schema_chinese.json"
        df = pd.read_json(schemadir)
        df_C = pd.read_json(schemadir_c)
        schema_content = [["Subject", "Predicate", "Object"]]
        for index, row in df.iterrows():
            schema_content.append([{"original_name": row["subject_type"], "alias": df_C.loc[index, "subject_type"]},
                                   {"original_name": row["predicate"], "alias": df_C.loc[index, "predicate"]},
                                   {"original_name": row["object_type"],
                                    "alias": "属性" if df_C.loc[index, "object_type"].lower() in ["date", "text",
                                                                                                "number", "num",
                                                                                                "boolean"] else
                                    df_C.loc[index, "object_type"]}])
        res["modelspo"] = schema_content
        obj["res"] = res
        return obj

    def getmodelotl(self, params_json):
        obj = {}
        model = params_json["model"]
        file_list = params_json["file_list"]
        if len(file_list) == 0:
            flag = "Otl"
        else:
            flag = "Ext"
        modeldir = Config.modeldir
        res = {}
        schemadir_E = modeldir + model + "/schema/schema_english.json"
        schemadir_C = modeldir + model + "/schema/schema_chinese.json"
        df_E = pd.read_json(schemadir_E)
        df_C = pd.read_json(schemadir_C)
        res["entity_main_table_dict"] = []
        res["entity_relation_set"] = []
        res["relation_property_dict"] = []
        res["relation_main_table_dict"] = []
        res["entity_property_dict"] = []
        relarionlist = []
        res["entity_list"] = []
        res["model"] = model
        res["extract_type"] = "modelExtraction"
        # 除name外在前端默认显示为需要建索引的属性
        property_index = {
            "Anysharedocumentmodel": {
                "subject": ["subject_desc"],
                "document": ["path", "creator", "editor"],
                "folder": ["path"],
                "chapter": ["path"]
            },
            "Contractmodel": {
                "clause": ["content"],
                "contract": ["number", "amount", "sign_date", "account_name", "bank"]
            }
        }
        if model != "Anysharedocumentmodel":
            for index, row in df_E.iterrows():
                object_type = row["object_type"]
                predicate = row["predicate"]
                subject_type = row["subject_type"]
                # 主语不在实体列表
                if [subject_type, df_C.loc[index, "subject_type"]] not in res["entity_list"]:
                    s_property = {}
                    res["entity_list"].append([subject_type, df_C.loc[index, "subject_type"]])
                    s_property["entity"] = subject_type
                    s_property["property"] = [["name", "string"]]
                    s_property["property_index"] = ["name"]
                    # 宾语是数据类型，谓语表示属性
                    if object_type.lower() in ["date", "text", "number", "num", "boolean"]:
                        # 记录属性及其数据类型。数据类型保留boolean类型，其余类型全部用string表示
                        if object_type.lower() == "boolean":
                            s_property["property"].append([row["predicate"], "boolean"])
                        else:
                            if [row["predicate"], "string"] not in s_property["property"]:
                                s_property["property"].append([row["predicate"], "string"])
                        # 该属性在前端展示为默认添加索引
                        if model == "Contractmodel" and subject_type in property_index["Contractmodel"] \
                                and predicate in property_index["Contractmodel"][subject_type]:
                            s_property["property_index"].append(predicate)
                        res["entity_property_dict"].append(s_property)
                    # 宾语不是数据类型，谓语表示关系
                    else:
                        # 该实体增加name属性
                        res["entity_property_dict"].append(s_property)
                        if [object_type, df_C.loc[index, "object_type"]] not in res["entity_list"]:
                            properties = {}
                            res["entity_list"].append([object_type, df_C.loc[index, "object_type"]])
                            properties["entity"] = object_type
                            properties["property"] = [["name", "string"]]
                            properties["property_index"] = ["name"]
                            res["entity_property_dict"].append(properties)
                        # 将谓语加入关系列表
                        if row["predicate"] not in relarionlist:
                            relation_property = {}
                            relarionlist.append(row["predicate"])
                            relation_property["edge"] = row["predicate"]
                            relation_property["property_index"] = ["name"]
                            if flag == "Ext":
                                relation_property["property"] = [["name", "string"], ["subject", "string"],
                                                                 ["object", "string"]]
                            if flag == "Otl":
                                relation_property["property"] = [["name", "string"]]
                            res["relation_property_dict"].append(relation_property)
                        res["entity_relation_set"].append(
                            [[subject_type, df_C.loc[index, "subject_type"]], [predicate, df_C.loc[index, "predicate"]],
                             [object_type, df_C.loc[index, "object_type"]]])
                # 主语在实体列表
                else:
                    for i, s_pro in enumerate(res["entity_property_dict"]):
                        if s_pro["entity"] == subject_type:
                            # 宾语是数据类型，谓语表示属性
                            if object_type.lower() in ["date", "text", "number", "num", "boolean"]:
                                # 记录属性及其数据类型。数据类型保留boolean类型，其余类型全部用string表示
                                if object_type.lower() == "boolean":
                                    s_pro["property"].append([row["predicate"], "boolean"])
                                else:
                                    if [row["predicate"], "string"] not in s_pro["property"]:
                                        s_pro["property"].append([row["predicate"], "string"])
                                # 该属性在前端展示为默认添加索引
                                if model == "Contractmodel" and s_pro["entity"] in property_index["Contractmodel"] \
                                        and predicate in property_index["Contractmodel"][s_pro["entity"]]:
                                    s_property["property_index"].append(predicate)
                                res["entity_property_dict"][i] = s_pro
                                break
                            # 宾语不是数据类型，谓语表示关系
                            else:
                                # 该实体增加name属性
                                if [object_type, df_C.loc[index, "object_type"]] not in res["entity_list"]:
                                    property = {}
                                    res["entity_list"].append([object_type, df_C.loc[index, "object_type"]])
                                    property["entity"] = object_type
                                    property["property"] = [["name", "string"]]
                                    property["property_index"] = ["name"]
                                    res["entity_property_dict"].append(property)
                                # 将谓语加入关系列表中
                                if row["predicate"] not in relarionlist:
                                    relation_property = {}
                                    relarionlist.append(row["predicate"])
                                    relation_property["edge"] = row["predicate"]
                                    relation_property["property_index"] = ["name"]
                                    if flag == "Ext":
                                        relation_property["property"] = [["name", "string"], ["subject", "string"],
                                                                         ["object", "string"]]
                                    if flag == "Otl":
                                        relation_property["property"] = [["name", "string"]]
                                    res["relation_property_dict"].append(relation_property)
                                res["entity_relation_set"].append([[subject_type, df_C.loc[index, "subject_type"]],
                                                                   [predicate, df_C.loc[index, "predicate"]],
                                                                   [object_type, df_C.loc[index, "object_type"]]])
                                break

            for one in res["entity_list"]:
                main_table = {}
                main_table["entity"] = one[0]
                main_table["main_table"] = file_list
                res["entity_main_table_dict"].append(main_table)
            obj["res"] = res
            return obj
        else:  # if model == "Anysharedocumentmodel":

            df_filter = df_E.loc[
                (df_E["object_type"] != "Text") & (df_E["object_type"] != "boolean") & (df_E["object_type"] != "num")]
            for index, row in df_filter.iterrows():
                res["entity_relation_set"].append([[row["subject_type"], df_C.loc[index, "subject_type"]],
                                                   [row["predicate"], df_C.loc[index, "predicate"]],
                                                   [row["object_type"], df_C.loc[index, "object_type"]]])
            relationlist = df_filter["predicate"].tolist()
            newrelationlist = []
            for index, row in df_E.iterrows():
                if row["object_type"] in ["Text", "boolean", "num"]:
                    # 主语不在关系列表，且不在实体列表
                    if row["subject_type"] not in relationlist and [row["subject_type"],
                                                                    df_C.loc[index, "subject_type"]] not in res[
                        "entity_list"]:
                        res["entity_list"].append([row["subject_type"], df_C.loc[index, "subject_type"]])
                        entity_property_dict = {}
                        entity_property_dict["entity"] = row["subject_type"]
                        entity_property_dict["property"] = []
                        entity_property_dict["property_index"] = ["name"]
                        # 该属性在前端展示为默认添加索引
                        if row["subject_type"] in property_index["Anysharedocumentmodel"] \
                                and row["predicate"] in property_index["Anysharedocumentmodel"][row["subject_type"]]:
                            entity_property_dict["property_index"].append(row["predicate"])
                        if row["object_type"] == "Text":
                            entity_property_dict["property"].append([row["predicate"], "string"])
                        elif row["object_type"] == "boolean":
                            entity_property_dict["property"].append([row["predicate"], "boolean"])
                        elif row["object_type"] == "num":
                            entity_property_dict["property"].append([row["predicate"], "float"])
                        res["entity_property_dict"].append(entity_property_dict)
                    # 主语不在关系列表，在实体列表
                    elif row["subject_type"] not in relationlist and [row["subject_type"],
                                                                      df_C.loc[index, "subject_type"]] in res[
                        "entity_list"]:
                        for i in range(len(res["entity_property_dict"])):
                            if res["entity_property_dict"][i]["entity"] == row["subject_type"]:
                                # 该属性在前端展示为默认添加索引
                                if row["subject_type"] in property_index["Anysharedocumentmodel"] \
                                        and row["predicate"] in property_index["Anysharedocumentmodel"][
                                    row["subject_type"]]:
                                    entity_property_dict["property_index"].append(row["predicate"])
                                if row["object_type"] == "Text":
                                    res["entity_property_dict"][i]["property"].append([row["predicate"], "string"])
                                elif row["object_type"] == "boolean":
                                    res["entity_property_dict"][i]["property"].append([row["predicate"], "boolean"])
                                elif row["object_type"] == "num":
                                    res["entity_property_dict"][i]["property"].append([row["predicate"], "float"])
                                # res["entity_property_dict"][i]["property"].append([row["predicate"], "string"])
                    # 主语在关系列表，未在新关系列表
                    elif row["subject_type"] in relationlist and row["subject_type"] not in newrelationlist:
                        newrelationlist.append(row["subject_type"])
                        relation_property_dict = {}

                        relation_property_dict["edge"] = row["subject_type"]
                        relation_property_dict["property"] = []
                        relation_property_dict["property_index"] = ["name"]
                        if row["object_type"] == "Text":
                            relation_property_dict["property"].append([row["predicate"], "string"])
                        if row["object_type"] == "boolean":
                            relation_property_dict["property"].append([row["predicate"], "boolean"])
                        if row["object_type"] == "num":
                            relation_property_dict["property"].append([row["predicate"], "float"])
                        res["relation_property_dict"].append(relation_property_dict)
                    # 主语在关系列表，且在新关系列表
                    elif row["subject_type"] in relationlist and row["subject_type"] in newrelationlist:
                        for i in range(len(res["relation_property_dict"])):
                            if res["relation_property_dict"][i]["edge"] == row["subject_type"]:
                                if row["object_type"] == "Text":
                                    res["relation_property_dict"][i]["property"].append([row["predicate"], "string"])
                                if row["object_type"] == "boolean":
                                    res["relation_property_dict"][i]["property"].append([row["predicate"], "boolean"])
                                if row["object_type"] == "num":
                                    res["relation_property_dict"][i]["property"].append([row["predicate"], "float"])
            for one in res["entity_list"]:
                main_table = {}
                main_table["entity"] = one[0]
                main_table["main_table"] = file_list
                res["entity_main_table_dict"].append(main_table)
            obj["res"] = res
            return obj

    def get_annotation_otl(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        # flag=params_json["step"]
        ds_auth = params_json['ds_auth']
        print('开始获取AS token', __file__, 'get_annotation_otl')
        acc_code, token_id = asToken.get_token(ds_auth)
        if acc_code != CommonResponseStatus.SUCCESS.value:
            return acc_code, token_id
        try:
            port = str(params_json["ds_port"])
            osdownlowd = config.get(params_json["data_source"], "osdownload")
            url = params_json["ds_address"] + ':' + port + osdownlowd
            payload = json.dumps(
                {"docid": params_json["file_list"][0]["docid"]})
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer {}'.format(tokenid)
            }
            response = requests.request("POST", url, headers=headers, data=payload, timeout=10, verify=False)
            resp_json = response.json()

            if response.status_code == 200:
                authrequest = resp_json["authrequest"]
                print(authrequest)
                headers = {}
                for i in authrequest[2:]:
                    headers[i[:i.index(":")].strip()] = i[i.index(":") + 1:].strip()

                fileresponse = requests.request("GET", authrequest[1], headers=headers, timeout=10, verify=False)
                if fileresponse.status_code == 416:  ####文件为空，返回空
                    res = {}
                    res["entity_list"] = []
                    res["entity_property_dict"] = []
                    res["entity_relation_set"] = []
                    res["entity_main_table_dict"] = []
                    res["relation_main_table_dict"] = []
                    res["relation_property_dict"] = []
                    res["extract_type"] = "标注抽取"
                    obj["res"] = res
                    return ret_code, obj
                elif fileresponse.status_code == 200:
                    textcontent = fileresponse.text
                    data = json.loads(textcontent)
                    otl = data["ontology_info"]
                    entity = otl["entity"]
                    edge = otl["edge"]
                    res = {}
                    res["entity_list"] = []
                    res["entity_property_dict"] = []
                    res["entity_relation_set"] = []
                    res["entity_main_table_dict"] = []
                    res["relation_main_table_dict"] = []
                    res["relation_property_dict"] = []
                    res["extract_type"] = "标注抽取"
                    for entity_one in entity:
                        entity_property_dict = {}
                        res["entity_list"].append(entity_one["name"])
                        entity_property_dict["entity"] = entity_one["name"]
                        entity_property_dict["property"] = entity_one["properties"]
                        res["entity_property_dict"].append(entity_property_dict)
                        entity_main_table_dict = {}
                        entity_main_table_dict["entity"] = entity_one["name"]
                        entity_main_table_dict["main_table"] = params_json["file_list"]
                        res["entity_main_table_dict"].append(entity_main_table_dict)
                    for edge_one in edge:
                        res["entity_relation_set"].append(edge_one["relations"])
                        relation_main_table_dict = {}
                        relation_main_table_dict["edge"] = edge_one["name"]
                        relation_main_table_dict["main_table"] = params_json["file_list"]
                        res["relation_main_table_dict"].append(relation_main_table_dict)
                        relation_property_dict = {}
                        relation_property_dict["edge"] = edge_one["name"]
                        relation_property_dict["property"] = edge_one["properties"]
                        # if flag=="Ext":
                        #     relation_property_dict["property"].extend([["subject","string"],["object","string"]])
                        res["relation_property_dict"].append(relation_property_dict)
                    obj["res"] = res
                    return ret_code, obj
                else:
                    filejson = response.json()
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = filejson['cause']
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    if "gns" in filejson['cause'].lower() and "不存在" in filejson['cause'].lower():
                        obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['message'] = " get file detail False "
                    return ret_code, obj
            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = resp_json['cause']
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "gns" in resp_json['cause'].lower() and "不存在" in resp_json['cause'].lower():
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                else:
                    if "access token校验失败" in obj['cause']:
                        obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
                obj['message'] = " get file False "
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj['cause'] = repr(e)
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "gns" in repr(e) and "不存在" in repr(e).lower():
                obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
            obj['message'] = "get annotation otl false"
            return ret_code, obj

    def transform_data(self, textcontent):
        res = textcontent
        if len(res) > 20000:
            new_res = res[:20000]
        else:
            new_res = res

        print(len(new_res))

        obj = {}
        obj["data"] = new_res
        obj["viewtype"] = "json"
        return obj

    def asdatashow2(self, params_json, version, flag="showdata"):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_auth = params_json['ds_auth']
        print('开始获取AS token', __file__, 'asdatashow2')
        ret_code, obj_token = asToken.get_token(ds_auth)
        if ret_token != CommonResponseStatus.SUCCESS.value:
            return ret_token, obj_token
        tokenid = obj_token
        docid = params_json["name"]
        port = str(params_json["ds_port"])
        osdownlowd = config.get(version, "osdownload")
        url = params_json["ds_address"] + ':' + port + osdownlowd
        print(url)
        reqhost = params_json["ds_address"].split("//")[-1]
        print(reqhost)
        payload = json.dumps(
            {"docid": docid})

        # , "authtype": "QUERY_STRING"

        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {}'.format(tokenid)
        }
        try:
            response = requests.request("POST", url, headers=headers, data=payload, timeout=10, verify=False)
            resp_json = response.json()

            if response.status_code == 200:
                authrequest = resp_json["authrequest"]
                print(authrequest)
                headers = {}
                name = resp_json["name"]
                for i in authrequest[2:]:
                    headers[i[:i.index(":")].strip()] = i[i.index(":") + 1:].strip()
                # headers["Range"] = "bytes  0-2000"
                headers["Range"] = "bytes=0-102400"

                try:
                    fileresponse = requests.request("GET", authrequest[1], headers=headers, timeout=10, verify=False)
                    if fileresponse.status_code == 416:  ####文件为空，返回空
                        if flag == "showdata":
                            obj = {}
                            obj["data"] = []
                            obj["viewtype"] = "json"
                            return ret_code, obj

                        elif flag == "getdata":
                            info = {}
                            return ret_code, info


                    elif fileresponse.status_code == 206:
                        file_type = name.split(".")[-1]
                        textcontent = fileresponse.text
                        ############ 多种文件解析##########
                        if flag == "showdata":
                            if file_type.lower() in self.postfixdic["csv"]:
                                res = textcontent
                                # if len(res) > 20000:
                                #     new_res = res[:20000]
                                # else:
                                new_res = res
                                obj = {}
                                obj["data"] = new_res
                                obj["viewtype"] = "json"
                                # obj["viewtype"] = "non-json"
                            elif file_type.lower() in self.postfixdic["json"]:
                                res = textcontent
                                if len(res) > 20000:
                                    new_res = res[:20000]
                                else:
                                    new_res = res
                                obj = {}
                                obj["data"] = new_res
                                obj["viewtype"] = "json"
                            elif file_type.lower() in self.postfixdic["pdf"]:
                                obj = self.transform_data(textcontent)
                            elif file_type.lower() in self.postfixdic["ppt"]:
                                obj = self.transform_data(textcontent)
                            elif file_type.lower() in self.postfixdic["doc"]:
                                obj = self.transform_data(textcontent)
                            elif file_type.lower() in self.postfixdic["txt"]:
                                obj = self.transform_data(textcontent)
                            else:
                                ret_code = CommonResponseStatus.SERVER_ERROR.value
                                obj['cause'] = "Don`t support this type of data"
                                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                                obj['message'] = "Show anyshare data False"
                                return ret_code, obj
                            return ret_code, obj

                        if flag == "getdata":

                            if file_type.lower() in self.postfixdic["csv"]:
                                try:
                                    if "\r\n" in textcontent:
                                        data = textcontent.split("\r\n")[0]
                                    else:
                                        if "\r" in textcontent:
                                            data = textcontent.split("\r")[0]
                                        if "\n" in textcontent:
                                            data = textcontent.split("\n")[0]
                                    newdata = list(set(data.split(",")))
                                    info = {}
                                    info["docid"] = docid
                                    info["name"] = name
                                    info["data"] = newdata
                                    print("get csv data for predict")
                                    print(info)
                                    return ret_code, info
                                except Exception as e:
                                    print(repr(e))
                                    info = {}
                                    return ret_code, info

                            elif file_type.lower() in self.postfixdic["json"]:
                                try:
                                    if "\r\n" in textcontent:
                                        data = textcontent.split("\r\n")[0]
                                    else:
                                        if "\r" in textcontent:
                                            data = textcontent.split("\r")[0]
                                        elif "\n" in textcontent:
                                            data = textcontent.split("\n")[0]
                                        else:
                                            data = textcontent

                                    newdata = data
                                    newdata = json.loads(newdata)
                                    try:
                                        dataout = otl_util.flatten_json(newdata, 3)
                                    except Exception as e:
                                        print(repr(e))
                                    data = list(dataout.keys())
                                    info = {}
                                    info["docid"] = docid
                                    info["name"] = name
                                    info["data"] = data
                                    return ret_code, info
                                except Exception:
                                    info = {}
                                    return ret_code, info
                            else:
                                info = {}
                                return ret_code, info
                    else:
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "get as data error"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Show or Get Anyshare data False "
                        return ret_code, obj
                except Exception as e:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    err = repr(e)
                    obj['cause'] = err
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Show or Get Anyshare data False "
                    return ret_code, obj

            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = resp_json['cause']
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "gns" in obj['cause'] and "不存在" in obj['cause']:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                obj['message'] = "Show or Get Anyshare data False "
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "Show or Get Anyshare data False "
            return ret_code, obj

    def asdatashow(self, params_json, version, flag="showdata"):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_auth = params_json['ds_auth']
        print('开始获取AS token', __file__, 'asdatashow')
        ret_token, obj_token = asToken.get_token(ds_auth)
        if ret_token != CommonResponseStatus.SUCCESS.value:
            return ret_token, obj_token
        tokenid = obj_token

        # start_n=datetime.datetime.now()
        # ret_name,obj_name=self.get_docid_name(tokenid,params_json)
        # end_n=datetime.datetime.now()
        # print("get name time is ")
        # print((end_n-start_n).total_seconds())
        # if ret_name!=CommonResponseStatus.SUCCESS.value:
        #     return ret_name,obj_name
        # name=obj_name["name"]
        docid = params_json["name"]
        port = str(params_json["ds_port"])
        osdownlowd = config.get(version, "osdownload")
        url = params_json["ds_address"] + ':' + port + osdownlowd
        print(url)
        reqhost = params_json["ds_address"].split("//")[-1]
        print(reqhost)
        payload = json.dumps(
            {"docid": docid})

        # , "authtype": "QUERY_STRING"

        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {}'.format(tokenid)
        }
        try:
            response = requests.request("POST", url, headers=headers, data=payload, timeout=10, verify=False)
            resp_json = response.json()

            if response.status_code == 200:
                authrequest = resp_json["authrequest"]
                print(authrequest)
                headers = {}
                name = resp_json["name"]
                for i in authrequest[2:]:
                    headers[i[:i.index(":")].strip()] = i[i.index(":") + 1:].strip()
                # headers["Range"] = "bytes  0-2000"
                headers["Range"] = "bytes=0-102400"
                # headers["Content-Range"] = "bytes 0-10"
                # headers["Content-Length"] = "11"

                try:
                    #
                    # if "https" in authrequest([1]):
                    #     authrequest([1]).replace("9029","9028")
                    #     authrequest([1]).replace("https","http")
                    # authrequest[1].replace("https","http").replace("9029","9028")

                    fileresponse = requests.request("GET", authrequest[1], headers=headers, timeout=10, verify=False)
                    if fileresponse.status_code == 416:  ####文件为空，返回空
                        if flag == "showdata":
                            obj = {}
                            obj["data"] = []
                            obj["viewtype"] = "json"
                            return ret_code, obj

                        elif flag == "getdata":
                            info = {}
                            return ret_code, info


                    elif fileresponse.status_code == 206  or fileresponse.status_code == 200:
                        file_type = name.split(".")[-1]
                        # encode=chardet.detect(fileresponse.content[0:1024])["encoding"]

                        # print("content")
                        # print(fileresponse.content)
                        textcontent = fileresponse.text
                        ############ 多种文件解析##########
                        if flag == "showdata":
                            # if fileresponse.content == b"":
                            #     obj["res"] = []
                            #     return ret_code, obj
                            # if file_type.lower() in self.postfixdic["excel"]:
                            #
                            #     workbook = xlrd.open_workbook(file_contents=fileresponse.content)
                            #     # 获取sheet
                            #     sheet = workbook.sheet_by_index(0)
                            #
                            #     # 获取行数
                            #     r_num = sheet.nrows
                            #     # 获取列数
                            #     c_num = sheet.ncols
                            #     merge = sheet.merged_cells
                            #     print(merge)  # [(1, 5, 0, 1), (1, 5, 1, 2)], 对应上面两个合并的单元格
                            #     read_data = []
                            #     i=1
                            #     for r in range(r_num):
                            #         if i<=limitsize:
                            #             li = []
                            #             for c in range(c_num):
                            #                 # 读取每个单元格里的数据，合并单元格只有单元格内的第一行第一列有数据，其余空间都为空
                            #                 cell_value = sheet.row_values(r)[c]
                            #                 # 判断空数据是否在合并单元格的坐标中，如果在就把数据填充进去
                            #                 if cell_value is None or cell_value == '':
                            #                     for (rlow, rhigh, clow, chigh) in merge:
                            #                         if rlow <= r < rhigh:
                            #                             if clow <= c < chigh:
                            #                                 cell_value = sheet.cell_value(rlow, clow)
                            #                 li.append(cell_value)
                            #             try:
                            #                 read_data.append(li[0:limitwide])
                            #             except:
                            #                 read_data.append(li)
                            #             i+=1
                            #         else:
                            #             break
                            #
                            #
                            #     res=read_data
                            #     obj = {}
                            #     obj["data"] = res
                            #     obj["viewtype"] = "non-json"

                            if file_type.lower() in self.postfixdic["csv"]:
                                res = textcontent
                                if len(res) > 20000:
                                    new_res = res[:20000]
                                else:
                                    new_res = res
                                obj = {}
                                obj["data"] = new_res
                                obj["viewtype"] = "json"
                                # Windows换行符是’\r\n’，Unix / Linux的换行符为’\n’，Mac的换行符为’\r’
                                # limitsize = 51
                                # limitwide = 100
                                #
                                #
                                # if "\r\n" in textcontent:
                                #     data=textcontent.split("\r\n")[0:limitsize]
                                # else:
                                #     if "\r" in textcontent:
                                #         data=textcontent.split("\r")[0:limitsize]
                                #     if "\n" in textcontent:
                                #         data=textcontent.split("\n")[0:limitsize]
                                # newdata=[line.split(",")[0:limitwide] for line in data]
                                #
                                # # open(fileresponse.content.decode("utf8")[:1024])
                                # # headings = next(data)
                                # # print(headings)
                                #
                                # # data = pd.read_csv(open(fileresponse.content.decode("utf8")[:1024]),header=None,error_bad_lines=False, encoding=encode).fillna("")
                                # # print(data.split("\r\n")[0])
                                # # print("//////////////////////")
                                # # if newdata.shape[0]>=limitsize:
                                # #     data=data.iloc[0:limitsize]
                                # # else:
                                # #     data=data
                                # # if data.shape[1]>=limitwide:
                                # #     data=data.iloc[:,0:limitwide]
                                # # else:
                                # #     data=data
                                # # data.fillna("")
                                # # res.append(data.columns.values.tolist())
                                # # print(res)
                                # # for i,row in data.iterrows():
                                # #     print(row)
                                # #     res.append(row.values.tolist())
                                # obj = {}
                                # obj["data"] = newdata
                                # obj["viewtype"] = "non-json"
                            elif file_type.lower() in self.postfixdic["json"]:

                                res = textcontent

                                # res=json.loads(fileresponse.content)
                                # res=json.dumps(res,indent=4,ensure_ascii=False)
                                if len(res) > 20000:
                                    new_res = res[:20000]
                                else:
                                    new_res = res

                                print(len(new_res))

                                # line = []
                                # allline=[]
                                # for i in res:
                                #     if len(allline)<limitsize-1:
                                #         if i != "\n":
                                #             line.append(i)
                                #         else:
                                #
                                #             allline.append("".join(line)[:limitwide])
                                #
                                #             line = []
                                #     else:
                                #         break
                                # allline.append("".join(line)[:limitwide])
                                obj = {}
                                obj["data"] = new_res
                                obj["viewtype"] = "json"
                            elif file_type.lower() in self.postfixdic["pdf"]:
                                obj = self.transform_data(textcontent)
                            #
                            #     parser = PDFParser(textcontent)
                            #     # 创建一个PDF文档
                            #     doc = PDFDocument()
                            #     # 连接分析器 与文档对象
                            #     parser.set_document(doc)
                            #     doc.set_parser(parser)

                            # 提供初始化密码
                            # 如果没有密码 就创建一个空的字符串
                            # doc.initialize()
                            #
                            # # 检测文档是否提供txt转换，不提供就忽略
                            # if not doc.is_extractable:
                            #     raise PDFTextExtractionNotAllowed
                            # else:
                            #     # 创建PDf 资源管理器 来管理共享资源
                            #     rsrcmgr = PDFResourceManager()
                            #     # 创建一个PDF设备对象
                            #     laparams = LAParams()
                            #     device = PDFPageAggregator(rsrcmgr, laparams=laparams)
                            #     # 创建一个PDF解释器对象
                            #     interpreter = PDFPageInterpreter(rsrcmgr, device)
                            #     # 每页文字内容
                            #     results = []
                            #     # 循环遍历列表，每次处理一个page的内容
                            #     for page in doc.get_pages():  # doc.get_pages() 获取page列表
                            #         interpreter.process_page(page)
                            #         # 接受该页面的LTPage对象
                            #         layout = device.get_result()
                            #         # 这里layout是一个LTPage对象 里面存放着 这个page解析出的各种对象 一般包括LTTextBox, LTFigure, LTImage, LTTextBoxHorizontal 等等 想要获取文本就获得对象的text属性，
                            #         for x in layout:
                            #             if isinstance(x, LTTextBoxHorizontal):
                            #                 results.append(x.get_text())
                            #     print(results)
                            # obj["data"] = results
                            # obj["viewtype"] = "json"
                            elif file_type.lower() in self.postfixdic["ppt"]:
                                # presentation = pptx.Presentation(fp)
                                # results = []
                                # for slide in presentation.slides:
                                #     for shape in slide.shapes:
                                #         if shape.has_text_frame:
                                #             for paragraph in shape.text_frame.paragraphs:
                                #                 part = []
                                #                 for run in paragraph.runs:
                                #                     part.append(run.text)
                                #                 results.append(''.join(part))
                                #         elif isinstance(shape, Picture):
                                #             content = self.parsepic.request_api(shape.image.blob)
                                #             results.append(''.join(content))
                                # results = [line for line in results if line.strip()]
                                obj = self.transform_data(textcontent)

                            elif file_type.lower() in self.postfixdic["doc"]:
                                obj = self.transform_data(textcontent)

                            elif file_type.lower() in self.postfixdic["txt"]:
                                obj = self.transform_data(textcontent)

                            else:
                                ret_code = CommonResponseStatus.SERVER_ERROR.value
                                obj['cause'] = "Don`t support this type of data"
                                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                                obj['message'] = "Show anyshare data False"
                                return ret_code, obj
                            return ret_code, obj

                        if flag == "getdata":

                            # if file_type in self.postfixdic["excel"]:
                            #     try:
                            #         data = pd.read_excel(reader,encoding="utf-8",nrows =5)
                            #     except:
                            #         data = pd.DataFrame()
                            #     return ret_code, data

                            if file_type.lower() in self.postfixdic["csv"]:
                                try:
                                    if "\r\n" in textcontent:
                                        data = textcontent.split("\r\n")[0]
                                        if "\r" in data:
                                            data = data.split("\r")[0]
                                        if "\n" in data:
                                            data = data.split("\n")[0]
                                    else:
                                        if "\r" in textcontent:
                                            data = textcontent.split("\r")[0]
                                        if "\n" in textcontent:
                                            data = textcontent.split("\n")[0]
                                    newdata = list(set(data.split(",")))
                                    info = {}
                                    info["docid"] = docid
                                    info["name"] = name
                                    info["data"] = newdata
                                    print("get csv data for predict")
                                    print(info)
                                    return ret_code, info
                                except Exception as e:
                                    print(repr(e))
                                    info = {}
                                    return ret_code, info

                            elif file_type.lower() in self.postfixdic["json"]:
                                try:
                                    if "\r\n" in textcontent:
                                        data = textcontent.split("\r\n")[0]
                                    else:
                                        if "\r" in textcontent:
                                            data = textcontent.split("\r")[0]
                                        elif "\n" in textcontent:
                                            data = textcontent.split("\n")[0]
                                        else:
                                            data = textcontent

                                    newdata = data
                                    newdata = json.loads(newdata)
                                    #######支持换行##########
                                    # print("Get json data for predict")
                                    # print(data)
                                    # text=""
                                    # for row in data:
                                    #     row = row.strip()
                                    #     print(row)
                                    #     print("blank in row ")
                                    #     print(" " in row)
                                    #     text+=''.join(row)
                                    #
                                    #     # print(text)
                                    #     if otl_util.check_json(text):
                                    #         print(text)
                                    #         newdata= json.loads(text)
                                    #         print(type(newdata))
                                    #         break
                                    # # print(newdata)
                                    # print("start flat json")
                                    try:
                                        dataout = otl_util.flatten_json(newdata, 3)
                                    except Exception as e:
                                        print(repr(e))
                                    print(dataout)
                                    data = list(dataout.keys())
                                    info = {}
                                    info["docid"] = docid
                                    info["name"] = name
                                    info["data"] = data
                                    print("get data sucess")
                                    return ret_code, info
                                except Exception:
                                    info = {}
                                    return ret_code, info

                                # try:
                                #     data = pd.read_json(reader,encoding="utf-8")
                                # except:
                                #     data = pd.DataFrame()
                                #
                                # print(data)

                                # return ret_code, data
                            else:
                                # ret_code = CommonResponseStatus.SERVER_ERROR.value
                                # obj['cause'] = "Don`t support this type of data"
                                # obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                                # obj['message'] = "Don`t support this type of data"
                                # return ret_code, obj
                                info = {}
                                return ret_code, info

                    else:
                        ret_code = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "get as data error"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Show or Get Anyshare data False "
                        return ret_code, obj
                except Exception as e:
                    ret_code = CommonResponseStatus.SERVER_ERROR.value
                    err = repr(e)
                    obj['cause'] = err
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Show or Get Anyshare data False "
                    return ret_code, obj

            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = resp_json['cause']
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                if "gns" in obj['cause'] and "不存在" in obj['cause']:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                else:
                    if "access token校验失败" in obj['cause']:
                        obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
                obj['message'] = "Show or Get Anyshare data False "
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "Show or Get Anyshare data False "
            return ret_code, obj

    def get_docid_name(self, tokenid, docid, ds_address, port):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        url = str(ds_address) + ':' + str(port) + "/api/efast/v1/dir/attribute"

        payload = json.dumps(
            {"docid": docid})

        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {}'.format(tokenid)
        }
        try:
            response = requests.request("POST", url, headers=headers, data=payload, timeout=(10, 20), verify=False)
            resp_json = response.json()
            # print("response")
            # print(response)
            if response.status_code == 200:
                filename = resp_json["name"]
                obj["name"] = filename
                return ret_code, obj
            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = resp_json['causemsg']
                obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                if "access token校验失败" in obj['cause']:
                    obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
                obj['message'] = "get filename fail"
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "access token校验失败" in obj['cause']:
                obj['code'] = CommonResponseStatus.TOKEN_OVERDUE_ERROR.value
            obj['message'] = "Get anyshare file name false"
            return ret_code, obj

    def get_entry_doc(self, params_json, version="as7"):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_auth = params_json['ds_auth']
        print('开始获取AS token', __file__, 'get_entry_doc')
        ret_token, obj_token = asToken.get_token(ds_auth)
        if ret_token != CommonResponseStatus.SUCCESS.value:
            return ret_token, obj_token
        tokenid = obj_token

        try:
            port = str(params_json["ds_port"])
            entry_doc_path = config.get(version, "entry_doc_path")

            url = params_json["ds_address"] + ':' + port + entry_doc_path
            # payload = {"docid": params_json["docid"]}
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenid
            }

            response = requests.request("GET", url, headers=headers, timeout=10, verify=False)
            resp_json = response.json()
            if response.status_code == 200:  #####获得docid 获得路径
                for r in resp_json:
                    # _id = r['id']
                    obj[id] = r
            return ret_code, obj


        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "Get dir attribute false"
            return ret_code, obj


        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "Get dir attribute false"
            return ret_code, obj

    def get_dir_attribute(self, params_json, version="as7"):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_auth = params_json['ds_auth']
        print('开始获取AS token', __file__, 'get_dir_attribute')
        ret_token, obj_token = asToken.get_token(ds_auth)
        if ret_token != CommonResponseStatus.SUCCESS.value:
            return ret_token, obj_token
        tokenid = obj_token

        try:
            port = str(params_json["ds_port"])
            getpath = config.get(version, "dirattribute")

            url = params_json["ds_address"] + ':' + port + getpath
            payload = {"docid": params_json["docid"]}
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenid
            }

            response = requests.request("POST", url, headers=headers, data=json.dumps(payload), timeout=10,
                                        verify=False)
            resp_json = response.json()
            if response.status_code == 200:  #####获得docid 获得路径
                creator = resp_json["creator"]
                create_time = resp_json["create_time"]
                name = resp_json["name"]
                res = {}
                res["creator"] = creator
                res["create_time"] = create_time
                res["name"] = name
                obj["res"] = res

                return ret_code, obj
            elif response.status_code == 403:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                return ret_code, resp_json
            else:
                res = {}
                res["creator"] = ""
                res["create_time"] = ""
                res["name"] = ""
                obj["res"] = res
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "Get dir attribute false"
            return ret_code, obj

    def getinfofromas(self, asjson, keylist, gns, version):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_address = asjson["ds_address"]
        ds_port = asjson["ds_port"]
        try:
            version = version.split("-")[2]
            gnslastid = gns.split("/")[-1]
            token_code, token_obj = asToken.get_token(asjson['ds_auth'])
            if token_code != 200:
                return token_code, token_obj
            acc_token = token_obj
            if version >= "7.0.1.8":
                es_api_0 = config.get("es", "es_api_0")
                if keylist[0] == "_source":
                    keylist = ["basename", "created_at", "created_by", "extension", "modified_at", "modified_by",
                               "parent_path", "security_level", "size", "version", "summary", "tags", "content"]
                es_url = es_api_0.format(ds_address, ds_port, gnslastid, ",".join(keylist))
                headers = {
                    'Content-Type': 'application/json',
                    "authorization": "Bearer {}".format(acc_token)
                }
                response = requests.request("GET", url=es_url, headers=headers, timeout=30, verify=False)
                if response.status_code != 200:
                    return response.status_code, response.json()
                res = response.json()
                return ret_code, res
            else:
                es_api_1 = config.get("es", "es_api_1")
                es_url = es_api_1.format(ds_address, ds_port, gnslastid)
                payload = {}
                headers = {}
                response = requests.request("GET", es_url, headers=headers, data=payload, timeout=30, verify=False)
                if response.status_code != 200:
                    return response.status_code, response.json()
                res = response.json()["_source"]
                return ret_code, res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.UNVERIFY_ERROR.value
            obj['message'] = "Get es information  false"
            return ret_code, obj

    # 获取as 文本内容 文档结构模型专用
    def getinfofromas_v2(self, ds_id, keylist, gns, ds_address, ds_port, version=None, sess: requests.Session = None,
                         acc_token=None):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            if version is None:
                version = self.getversion(ds_address)
                version = version.split("-")[2]

            gnslastid = gns.split("/")[-1]

            if version >= "7.0.1.8":
                if acc_token is None:
                    data = dsm_dao.getdatabyid(ds_id)
                    asjson = data.to_dict('records')[0]
                    ds_address = asjson["ds_address"]
                    ds_port = asjson["ds_port"]

                    token_code, token_obj = asToken.get_token(asjson['ds_auth'])

                    if token_code != 200:
                        return token_code, token_obj
                    acc_token = token_obj
                es_url = " {}:{}/api/ecoindex/v1/index/{}/{}".format(ds_address, ds_port, gnslastid, ",".join(keylist))
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + acc_token,
                }
                payload = {}
                response = sess.get(url=es_url, headers=headers, verify=False, timeout=10)
                if response.status_code != 200:
                    return CommonResponseStatus.SERVER_ERROR.value, response.json()
                res = response.json()
                return ret_code, res
            else:
                es_url = "{}:{}/anyshare/file/{}?pretty".format(ds_address, ds_port, gnslastid)
                payload = {}
                headers = {}
                response = sess.get(es_url, headers=headers, data=payload, timeout=10, verify=False)
                if response.status_code != 200:
                    return CommonResponseStatus.SERVER_ERROR.value, response.json()
                res = response.json()["_source"]
                return ret_code, res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.UNVERIFY_ERROR.value
            obj['message'] = "Get es information  false"
            return ret_code, obj

    # def getbatch_data(self,params_json):
    #
    #     ret_code = CommonResponseStatus.SUCCESS.value
    #     res = ""
    #     obj = {}
    #     ret_token, obj_token = self.get_token_id(params_json)
    #     if ret_token != CommonResponseStatus.SUCCESS.value:
    #         return ret_token, obj_token
    #     tokenid = obj_token["tokenid"]
    #     # ret_name, obj_name = self.get_docid_name(tokenid, params_json)
    #     # if ret_name != CommonResponseStatus.SUCCESS.value:
    #     #     return ret, obj
    #     # name = ret_name["name"]
    #     # docid = params_json["docid"]
    #
    #     filelist = params_json["docid"]
    #     # name = params_json["name"]
    #     # filelist=
    #     limitsize = 200
    #     port = str(params_json["ds_port"])
    #     url = params_json["ds_address"] + ':' + port + "/api/v1/file/batchdownload"
    #
    #     reqhost=params_json["ds_address"].split("//")[-1]
    #     print(reqhost)
    #
    #     payload = json.dumps({"name": "test.zip", "reqhost": reqhost, "usehttps": False ,"files": filelist})
    #     # params_json["ds_address"].split("//")[-1]
    #     # payload = json.dumps(
    #     #     {"name": "test.zip","reqhost": "anyshare.aishu.cn",})
    #
    #     headers = {
    #         'Content-Type': 'application/json',
    #         'Authorization': 'Bearer {}'.format(tokenid),
    #         'Content-Type': 'text/plain'
    #     }
    #     try:
    #         response = requests.request("POST", url, headers=headers, data=payload,timeout=(10,20))
    #         resp_json = response.json()
    #
    #         if response.status_code == 200:
    #             # url = resp_json["url"].replace("https","http")
    #             url = resp_json["url"]
    #
    #             method = resp_json["method"]
    #
    #             try:
    #                 fileresponse = requests.request(method, url ,timeout=(10,20))
    #
    #                 if fileresponse.status_code == 200:
    #
    #                     # azip = zipfile.ZipFile(fileresponse.content,"r")
    #                     fio = io.BytesIO(fileresponse.content)
    #                     f = zipfile.ZipFile(file=fio)
    #                     # encode = chardet.detect(fileresponse.content)["encoding"]
    #                     # print(encode)
    #                     # if not encode :
    #                     #     encode="utf-8"
    #                     # print(encode)
    #                     file_df_dict={}
    #                     for file in f.namelist():
    #                         data=f.open(file)
    #                         file_type.lower() = file.split(".")[-1]
    #
    #                         if file_type.lower() in self.postfixdic["csv"]:
    #
    #                             df=pd.read_csv(data,encoding="utf-8")
    #                             # df=csv.reader(data,)
    #                             for row in df :
    #                                 print(row)
    #                             file_df_dict[file] = df
    #                         elif file_type.lower() in self.postfixdic["json"]:
    #                             data=data.read().decode("utf-8").split("\r\n")
    #                             newdata=data[0]
    #                             print(newdata)
    #                             newdata=json.loads(newdata)
    #                             dataout=otl_util.flatten_json(newdata,3)
    #                             df=pd.DataFrame(columns=list(dataout.keys()))
    #                             df.append([x for x in range(len(list(dataout.keys())))])
    #                             file_df_dict[file] = df
    #                             file_df_dict[file] = df
    #                         else:
    #                             df = pd.DataFrame()
    #                             file_df_dict[file] = df
    #                     return ret_code, file_df_dict
    #
    #
    #                     # outlist = []
    #                     # file_type.lower() = name.split(".")[-1]
    #                     # # print(file_type.lower())
    #                     # reader = io.BufferedReader(io.BytesIO(fileresponse.content))
    #                     # # print("content")
    #                     # # print(fileresponse.content)
    #                     # ############ 多种文件解析##########
    #                     # if file_type.lower() in ["xlsx", "xls"]:
    #                     #     data = pd.read_excel(reader, encoding="utf-8", nrows=5)
    #                     #     return ret_code, data
    #                     #
    #                     # elif file_type.lower() == "csv":
    #                     #     data = pd.read_csv(reader, encoding="utf-8", nrows=5)
    #                     #     return ret_code, data
    #                     #
    #                     # elif file_type.lower() == "json":
    #                     #     data = pd.read_json(reader, encoding="utf-8")
    #                     #     return ret_code, data
    #
    #                 else:
    #                     ret_code = CommonResponseStatus.SERVER_ERROR.value
    #                     obj['cause'] = "get as data error"
    #                     obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
    #                     obj['message'] = "get as data error"
    #                     return ret_code, obj
    #             except Exception as e:
    #                 ret_code = CommonResponseStatus.SERVER_ERROR.value
    #                 err = repr(e)
    #                 obj['cause'] = err
    #                 obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
    #                 obj['message'] = "test connection fail"
    #                 return ret_code, obj
    #
    #         else:
    #             ret_code = CommonResponseStatus.SERVER_ERROR.value
    #             obj['cause'] = resp_json['causemsg']
    #             obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
    #             obj['message'] = "test connection fail"
    #             return ret_code, obj
    #     except Exception as e:
    #         ret_code = CommonResponseStatus.SERVER_ERROR.value
    #         err = repr(e)
    #         obj['cause'] = err
    #         obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
    #         obj['message'] = "test connection fail"
    #         return ret_code, obj

    @connect_execute_close_db
    def get_ontology(self, ontologyname, connection, cursor):
        sql = """
                 SELECT entity,edge FROM ontology_table WHERE ontology_name ="{}";
                 """

        sql = sql.format(ontologyname)
        Logger.log_info(sql)
        cursor.execute(sql)

        df = pd.read_sql(sql, connection)
        print(df)
        return df

    @connect_execute_commit_close_db
    def insert_Ontology(self, params_json, cursor, connection):
        print("entry in save")
        values_list = []
        values_list.append(params_json["ontology_name"])
        values_list.append(params_json["ontology_des"].replace('"', '\"').replace("\\", "\\\\"))
        values_list.append(str([]))
        values_list.append(str([]))
        values_list.append(str([]))
        values_list.append(str([]))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        print(values_list)

        sql = """INSERT INTO ontology_table (ontology_name, ontology_des, entity,edge,used_task,all_task,create_time,update_time) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)"""
        cursor.execute(sql, values_list)
        new_id = cursor.lastrowid
        return new_id

    # lzg add
    @connect_execute_close_db
    def getCount(self, connection, cursor, ):
        sql = """SELECT id FROM ontology_table;"""
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return len(df)

    @connect_execute_close_db
    def getall(self, page, size, order, kgIds, connection, cursor):
        if page == -2 and kgIds == "all":
            sql = """SELECT * FROM ontology_table """
            df = pd.read_sql(sql, connection)
            return df
        if page == -2:
            sql = """
                SELECT *
                FROM ontology_table
                order by create_time Desc"""
        else:
            sql = """
                SELECT *
                FROM ontology_table
                order by create_time Desc
                limit {0}, {1};"""
            if order == "descend":
                sql = """
                    SELECT *
                    FROM ontology_table
                    order by create_time asc
                    limit {0}, {1};"""
            sql = sql.format(page * size, size)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_commit_close_db
    def delete(self, name, connection, cursor, ):
        sql1 = """DELETE FROM ontology_table WHERE id in (%s);""" % (",".join([str(id) for id in name]))
        cursor.execute(sql1)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_close_db
    def getbyname(self, name, connection, cursor, ):
        sql = """SELECT * FROM ontology_table where ontology_name = %s""" % ('"' + name + '"')
        Logger.log_info(sql)
        # sql = sql.format()
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getbyids(self, ids, connection, cursor, ):

        sql = """SELECT * FROM ontology_table where id in (%s) """ % (",".join([str(id) for id in ids]))
        Logger.log_info(sql)

        # sql = sql.format()
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getbyid(self, name, connection, cursor, ):
        sql = """SELECT * FROM ontology_table where id = %s""" % (str(name))
        # sql = sql.format()
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getCountbyname(self, otlname, connection, cursor, ):
        sql = """
                 SELECT id FROM ontology_table  where  ontology_name collate utf8_general_ci like {0};
                 """
        otlname = '"%' + otlname + '%"'
        sql = sql.format(otlname)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return len(df)

    @connect_execute_close_db
    def getallbyname(self, otlname, page, size, order, connection, cursor):
        sql = """
            SELECT *
            FROM ontology_table
            where ontology_name collate utf8_general_ci like {0}
            order by create_time Desc
            limit {1}, {2};"""
        if order == "descend":
            sql = """
                SELECT *
                FROM ontology_table 
                where ontology_name collate utf8_general_ci like {0}
                order by create_time asc
                limit {1}, {2};"""
        otlname = '"%' + otlname + '%"'
        sql = sql.format(otlname, page * size, size)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_commit_close_db
    def update_name(self, otlid, params_json, connection, cursor):
        values_list = []
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(params_json["ontology_name"])
        values_list.append(params_json["ontology_des"].replace("\\", "\\\\").replace('"', '\\"'))
        values_list.append(str(otlid))

        sql = """UPDATE ontology_table SET update_time=%s , ontology_name=%s,ontology_des=%s where id = %s"""

        sql = sql % ('"' + values_list[0] + '"',
                     '"' + values_list[1] + '"',
                     '"' + values_list[2] + '"',
                     '"' + values_list[3] + '"',
                     )
        Logger.log_info(sql)
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_close_db
    def getAllOtlId(self, connection, cursor):
        sql = """SELECT id FROM ontology_table"""
        print(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def check_ontology_by_name(self, name, connection, cursor):
        sql = """SELECT * FROM ontology_table where ontology_name = '{}'""".format(name)
        print(sql)
        df = pd.read_sql(sql, connection)
        df = df.to_dict("records")
        if len(df) > 0:
            return True
        else:
            return False

    @connect_execute_close_db
    def getOtlStatusbyid(self, otlid, connection, cursor, ):
        sql = """SELECT otl_status FROM ontology_table where id = %s""" % (str(otlid))
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_commit_close_db
    def update_info(self, otlid, params_json, graph_id, connection, cursor):
        '''更新本体信息，同时更新graph_confg_table中的step_num'''
        values_list = []
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(str(params_json["entity"]))
        values_list.append(str(params_json["edge"]))
        values_list.append(str(params_json["used_task"]))
        values_list.append(str(params_json["all_task"]))
        values_list.append(str(otlid))
        updateoradd = params_json.get("updateoradd", None)
        sql = f"select step_num from graph_config_table where id={graph_id}"
        df = pd.read_sql(sql, connection)
        step_raw = df.to_dict('records')[0]['step_num']
        step_num = 3 if updateoradd == "update_otl_info" else 2
        step_num = step_raw if step_num < step_raw else step_num
        sql = """UPDATE ontology_table SET update_time=%s , entity=%s, edge=%s ,used_task=%s,all_task=%s where id = %s"""

        sql = sql % ('"' + values_list[0] + '"',
                     '"' + values_list[1] + '"',
                     '"' + values_list[2] + '"',
                     '"' + values_list[3] + '"',
                     '"' + values_list[4] + '"',
                     '"' + values_list[5] + '"',
                     )
        Logger.log_info(sql)
        cursor.execute(sql)
        new_id = cursor.lastrowid
        if graph_id:
            sql = f"""UPDATE graph_config_table SET step_num={step_num} where id = {graph_id}"""
            cursor.execute(sql)
        return new_id

    @connect_execute_close_db
    def getcountbystate(self, state, connection, cursor):
        sql = """SELECT * FROM ontology_table WHERE otl_status = %s """ % ('"' + state + '"')
        df = pd.read_sql(sql, connection)
        return len(df)

    @connect_execute_close_db
    def getallbystate(self, page, size, order, state, connection, cursor):
        sql = """
            SELECT *
            FROM ontology_table
            where otl_status = {0}
            order by create_time Desc
            limit {1}, {2};"""
        if order == "descend":
            sql = """
                SELECT *
                FROM ontology_table
                where otl_status = {0}
                order by create_time asc
                limit {1}, {2};"""
        sql = sql.format('"' + state + '"', page * size, size)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getCountbynameandstate(self, name, state, connection, cursor):
        sql = """
                         SELECT id FROM ontology_table where ontology_name collate utf8_general_ci like {0} and otl_status = {1};
                         """
        otlname = '"%' + name + '%"'
        sql = sql.format(otlname, '"' + state + '"')
        df = pd.read_sql(sql, connection)
        return len(df)

    @connect_execute_close_db
    def getallbynameandstate(self, name, page, size, order, state, connection, cursor):
        sql = """
            SELECT *
            FROM ontology_table
            where
              ontology_name collate utf8_general_ci like {0}
              and otl_status = {1}
            order by create_time Desc
            limit {2}, {3};"""
        if order == "descend":
            sql = """
                SELECT *
                FROM ontology_table
                where
                  ontology_name collate utf8_general_ci like {0}
                  and otl_status = {1}
                order by create_time asc
                limit {2}, {3};"""
        otlname = '"%' + name + '%"'
        sql = sql.format(otlname, '"' + state + '"', page * size, size)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_commit_close_db
    def update_state(self, id, state, connection, cursor):
        values_list = []
        # 只修改 用户名密码

        # values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(state)
        values_list.append(str(id))

        sql = """UPDATE ontology_table SET  otl_status=%s where id = %s"""

        sql = sql % ('"' + values_list[0] + '"',
                     values_list[1])
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_close_db
    def getallbystate(self, page, size, order, state, connection, cursor):
        sql = """SELECT * FROM ontology_table  where otl_status ={0}  order by create_time  Desc limit {1}, {2};"""
        if order == "descend":
            sql = """SELECT * FROM ontology_table  where otl_status = {0} order by create_time  asc limit {1}, {2};"""
        sql = sql.format('"' + state + '"', page * size, size)
        df = pd.read_sql(sql, connection)
        return df


    @connect_execute_close_db
    def getallbynameandstate(self, name, page, size, order, state, connection, cursor):
        sql = """
                          SELECT * FROM ontology_table  where ontology_name collate utf8_general_ci like {0} and otl_status = {1} order by create_time  Desc limit {2}, {3};
                          """
        if order == "descend":
            sql = """
                     SELECT * FROM ontology_table  where ontology_name collate utf8_general_ci like {0} and otl_status = {1} order by create_time  asc limit {2}, {3};

                           """
        otlname = '"%' + name + '%"'
        sql = sql.format(otlname, '"' + state + '"', page * size, size)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_commit_close_db
    def insertCopyOtl(self, args, params_json, cursor, connection):
        print("entry in save")
        values_list = []
        values_list.append(params_json.get("ontology_name"))
        values_list.append(params_json["ontology_des"].replace('"', '\"').replace("\\", "\\\\"))
        values_list.append(args.get("entity"))
        values_list.append(args.get("edge"))
        values_list.append([])
        values_list.append([])
        values_list.append(args.get("otl_status"))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))  # create_time
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))  # update_time
        values_list = list(map(str, values_list))
        print(values_list)

        sql = """INSERT INTO ontology_table (ontology_name, ontology_des, entity,edge,used_task,all_task,otl_status,create_time, update_time) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        print(sql)
        cursor.execute(sql, values_list)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_close_db
    def getOtlIdbyname(self, otl_name, connection, cursor):
        sql = """SELECT id FROM ontology_table WHERE ontology_name = %s """ % ('"' + otl_name + '"')
        df = pd.read_sql(sql, connection)
        return df


otl_dao = OtlDao()

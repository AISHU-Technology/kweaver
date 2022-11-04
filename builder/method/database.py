# -*- coding: utf-8 -*-
from .name_rule import _2upper, upper2_,drop_adornment
import pymysql
# from pyhive import hive
from dao.otl_dao import otl_dao
import datetime
from utils.common_response_status import CommonResponseStatus
from multiprocessing import Pool
from utils.CommonUtil import commonutil
from utils.Otl_Util import otl_util
import collections
import pandas as pd
### 数据库选择接口
class DataBase():
    ###flag=0：hive数据源，flag=1:mysql数据源

    def getHiveClient(self):
        from utils.ConnectUtil import HiveClient
        return HiveClient
    
    def __init__(self, params_json):
        self.ip = params_json['ds_address']
        self.port = int(params_json['ds_port'])
        self.user = params_json['ds_user']
        self.password = params_json['ds_password']
        self.pw_error_df = ""
        self.flag = params_json['data_source']
        if self.flag not in ["as" ,"as7"] :# mysql,hive
            if len(params_json['newtablelist'])!=0:
                if not isinstance(params_json['newtablelist'][0],list):
                    self.new_table_list = [[i,"","","",""]for i in params_json['newtablelist'] ] ####[docid，docid]
                else:
                    self.new_table_list = params_json['newtablelist']
        else :#as,as7
            if len(params_json['new_table_list']) != 0:
                if not isinstance(params_json['new_table_list'][0], list):
                    self.table_list = [[i, "", "", "", "","",""] for i in params_json['new_table_list']]  ####[docid，docid]
                else:
                    self.table_list = params_json['new_table_list']
            # self.table_list = params_json["new_table_list"]
                if len(self.table_list)>100:
                    self.table_list=self.table_list[0:100]

        if self.flag == "rabbitmq":
            self.ret = CommonResponseStatus.SUCCESS.value

        if self.flag == "mysql":
            self.password = commonutil.DecryptBybase64(params_json['ds_password'])
            self.ds_path = params_json['ds_path']
            self.ret = CommonResponseStatus.SUCCESS.value
            obj = {}
            try:
                # self.conn = pymysql.connect(host='10.2.196.18', user='root', passwd='Qwe123!@#', db='komdb', port=3306)
                self.conn = pymysql.connect(host=self.ip, user=self.user, passwd=self.password, db=self.ds_path, port=self.port)
                # print(str())
                print("test connect successful")
                obj["res"]="test connect successful"
                self.df = obj
            except Exception as e:
                self.ret= CommonResponseStatus.SERVER_ERROR.value
                print("test connect false")
                err = repr(e)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "test connection fail"
                if "password" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in mysql have error"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in mysql have error"
                if "doesn't exist" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                if "database" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                obj['message'] = "test connection fail"
                obj['cause'] = " You have error in Mysql"
                self.df = obj
        if self.flag == "hive":
            self.password = commonutil.DecryptBybase64(params_json['ds_password'])
            self.ds_path = params_json['ds_path']
            self.ret = CommonResponseStatus.SUCCESS.value
            obj = {}
            try:
                HiveClient = self.getHiveClient()
                self.hiveCli = HiveClient(self.ip, self.user, self.password, self.ds_path,
                                            self.port)

                print("test connect successful")
                obj["res"] = "test connect successful"
                self.df = obj
            except Exception as e:
                self.ret = CommonResponseStatus.SERVER_ERROR.value
                print("test connect false")
                err = repr(e)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "test connection fail"
                if "Error" in err and "login" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in hive have error"
                obj['message'] = "test connection fail"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in hive have error"
                if "Table not found" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['cause'] = "hive dont have this table or database"
                if "Database" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                    obj['cause'] = "hive dont have this table or database"
                obj['message'] = "test connection fail"
                obj['cause'] = " You have error in Hive"
                self.df = obj


        if self.flag == "as" or self.flag == "as7":
            self.table_list_status=[]
            print("entry in as ")
            self.ret = CommonResponseStatus.SUCCESS.value
            self.new_table_dict = {}
            retcodelist=[]
            # self.postfix=params_json["postfix"]

            # for docid ,name in self.table_list.items():
            params_json["docid"]=[]
            self.df=[]
            if len(self.table_list)==1:
                file=self.table_list[0]
                params_json["name"] = file[0]
                ###########缺少内容分解析失败处理（解码失败，文件不符合csv，json，文件无内容）
                retcode, obj = otl_dao.asdatashow(params_json,self.flag, flag="getdata")
                if retcode != CommonResponseStatus.SUCCESS.value:
                    file[4]="failed"
                    self.table_list_status.append(file)
                else:
                    file[4] = "success"
                    self.table_list_status.append(file)
                self.ret = retcode
                self.df =[obj]
            else :
                for file in self.table_list:
                    # name=file["name"]
                    # docid=file["docid"]
                    params_json["name"]=file[0]
                    ###########缺少内容分解析失败处理（解码失败，文件不符合csv，json，文件无内容）
                    retcode, as_obj = otl_dao.asdatashow(params_json,self.flag, flag="getdata")
                    if retcode!=CommonResponseStatus.SUCCESS.value :
                        file[4] = "failed"
                        self.table_list_status.append(file)
                        if as_obj['code'] == CommonResponseStatus.USRPASS_ERROR.value:
                            self.ret = CommonResponseStatus.SERVER_ERROR.value
                            self.pw_error_df = [as_obj]
                            break
                    else:
                        file[4] = "success"
                        self.table_list_status.append(file)

                    self.df.append(as_obj)
                    retcodelist.append(retcode)
                if CommonResponseStatus.SUCCESS.value in retcodelist:
                    self.ret=CommonResponseStatus.SUCCESS.value
                else:
                    self.ret =CommonResponseStatus.SERVER_ERROR.value
                    if self.pw_error_df:
                        self.df = self.pw_error_df
                    else:
                        obj={}
                        obj['cause'] = "None of tables can be predict"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Predict Ontology FALSE"
                        self.df = [obj]







    def query(self, sql):
        self.cur = self.conn.cursor()
        self.cur.execute(sql)
        return self.cur

    def cur_close(self):
        self.cur.close()

    def data_query(self, sql):
        if self.flag == 0:
            self.cur = self.conn.cursor()
            self.cur.execute(sql)
        elif self.flag == 1:
            self.cur = self.conn.cursor(pymysql.cursors.SSCursor)
            self.cur.execute(sql)
        return self.cur.fetchall()

    def close_database(self):
        self.conn.close()

    def swapnamePositions(self,list):
        if len(list)>0:
            if ["name","string"] in list:
                nameindex = list.index(["name","string"])
                list[nameindex], list[0] = list[0], list[nameindex]
            else:
                list.insert( 0, ["name","string"])
        else:
            list.append(["name","string"])


        return list

    def get_entity_edge(self,params_json):
        res={}
        entitylist=[]
        entity_main_table_dict=[]
        entity_property_dict=[]
        entity_relation_set=[]
        relation_main_table_dict=[]
        relation_property_dict=[]
        if self.flag not in ["as" ,"as7"] :
            if self.ret == CommonResponseStatus.SERVER_ERROR.value:
                return self.ret, self.df
            # self.new_table_list =  params_json["newtablelist"]
            if len(self.new_table_list)==0:
                table_list = []
                res["entity_list"] = entitylist
                res["entity_property_dict"] = entity_property_dict
                res["entity_main_table_dict"] = entity_main_table_dict
                res["entity_relation_set"] = entity_relation_set
                res["relation_main_table_dict"] = relation_main_table_dict
                res["relation_property_dict"] = relation_property_dict
                res["extract_type"] = "标准抽取"
                obj = {}
                obj["res"] = res
                obj["file_list"] = table_list
                return self.ret, obj
            if self.flag == "rabbitmq":
                table_list = []
                if len(self.new_table_list) == 1:  # 只有一个表
                    table = self.new_table_list[0]
                    table_name = table[0]
                    try:
                        entitylist.append([otl_util.is_special(table_name), otl_util.is_special(table_name)])
                        maintabledict={}
                        maintabledict["entity"]=otl_util.is_special(table_name)
                        maintabledict["main_table"] = [table_name]
                        entity_main_table_dict.append(maintabledict)
                        column_get_sql = "desc %s" % (table_name)
                        property_dict={}
                        property_dict["entity"] = otl_util.is_special(table_name)
                        property_dict["property"]=[]
                        propertyname = []
                        json_schema = params_json.get("json_schema", {})
                        if json_schema and not isinstance(json_schema, dict):
                            json_schema = eval(json_schema)
                        json_schema = otl_util.flatten_json_n(json_schema)
                        num = 0
                        for k, v in json_schema.items():
                            if num <= 99:
                                typ = str(type(v)).split()[-1].replace("'", "").replace('"', "").replace(">", "")
                                if typ not in ["boolean", "float", "double", "string", "decimal", "datetime", "date"]:
                                    typnew = "string"
                                elif typ == "int":
                                    typnew = "integer"
                                else:
                                    typnew = typ
                                if [otl_util.is_special(k), typnew] not in property_dict["property"]:
                                    if otl_util.is_special(k) not in propertyname:
                                        propertyname.append(otl_util.is_special(k))
                                        property_dict["property"].append([otl_util.is_special(k), typnew])
                                    else:
                                        sumdict = collections.Counter(propertyname)
                                        property_dict["property"].append([otl_util.is_special(k) + "(" + str(
                                            sumdict[otl_util.is_special(k)]) + ")", typnew])
                                        propertyname.append(otl_util.is_special(k))
                                num += 1
                            else:
                                break
                        property_dict["property"] = self.swapnamePositions(property_dict["property"])
                        entity_property_dict.append(property_dict)
                        table[3] = "success"
                        table_list.append(table)
                        res["entity_list"]=[list(t) for t in set(tuple(_) for _ in entitylist)]
                        res["entity_property_dict"]=entity_property_dict
                        res["entity_main_table_dict"]=entity_main_table_dict
                        res["entity_relation_set"]=entity_relation_set
                        res["relation_main_table_dict"]=relation_main_table_dict
                        res["relation_property_dict"]=relation_property_dict
                        res["extract_type"] = "标准抽取"
                        obj={}
                        obj["res"] = res
                        obj["file_list"] = table_list

                        return self.ret ,obj
                                # table_column_result.append((new_table_name, new_column_name))  # （表名，列名）
                                # return self.ret, self.df, table_column_result, name_rule_dict, column_type_dict
                    except Exception as e:
                        obj={}
                        self.ret=CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = repr(e)
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        if "doesn't exist" in obj['cause']:
                            obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                        obj['message'] = "get data fail"
                        obj['cause'] = " You have error in Mysql"
                        return self.ret ,obj

            if self.flag == "mysql":
                table_list = []
                if len(self.new_table_list) == 1:####只有一个表
                    table = self.new_table_list[0]
                    table_name = table[0]
                    try:
                        # for table in set(self.new_table_list):
                            # print(table)
                        entitylist.append([otl_util.is_special(table_name),otl_util.is_special(table_name)])
                        maintabledict={}
                        maintabledict["entity"]=otl_util.is_special(table_name)
                        maintabledict["main_table"] = [table_name]
                        entity_main_table_dict.append(maintabledict)
                        column_get_sql = "desc %s" % (table_name)
                        property_dict={}
                        property_dict["entity"] = otl_util.is_special(table_name)
                        property_dict["property"]=[]
                        propertyname = []
                        columnsdata=self.query(column_get_sql)
                        for i,item in enumerate(columnsdata):
                            if i <=99:
                            ### 要将表名和字段名转化为驼峰规则
                                typ = item[1].split("(")[0]
                                if typ not in ["boolean", "float", "double", "string", "decimal", "datetime","date"]:
                                    typnew = "string"
                                elif typ == "int":
                                    typnew = "integer"
                                else:
                                    typnew = typ
                                if [otl_util.is_special(item[0]),typnew] not in property_dict["property"]:
                                    if otl_util.is_special(item[0]) not in propertyname :
                                        propertyname.append(otl_util.is_special(item[0]))
                                        property_dict["property"].append([otl_util.is_special(item[0]),typnew])
                                    else :
                                        sumdict = collections.Counter(propertyname)
                                        property_dict["property"].append([otl_util.is_special(item[0])+"("+str(sumdict[otl_util.is_special(item[0])])+")", typnew])
                                        propertyname.append(otl_util.is_special(item[0]))

                            else:
                                break
                        property_dict["property"] = self.swapnamePositions(property_dict["property"])
                        entity_property_dict.append(property_dict)
                        table[3] = "success"
                        table_list.append(table)
                        res["entity_list"]=[list(t) for t in set(tuple(_) for _ in entitylist)]
                        res["entity_property_dict"]=entity_property_dict
                        res["entity_main_table_dict"]=entity_main_table_dict
                        res["entity_relation_set"]=entity_relation_set
                        res["relation_main_table_dict"]=relation_main_table_dict
                        res["relation_property_dict"]=relation_property_dict
                        res["extract_type"] = "标准抽取"
                        obj={}
                        obj["res"] = res
                        obj["file_list"] = table_list

                        return self.ret ,obj
                                # table_column_result.append((new_table_name, new_column_name))  # （表名，列名）
                                # return self.ret, self.df, table_column_result, name_rule_dict, column_type_dict
                    except Exception as e:
                        obj={}
                        self.ret=CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = repr(e)
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        if "doesn't exist" in obj['cause']:
                            obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                        obj['message'] = "get data fail"
                        obj['cause'] = " You have error in Mysql"
                        return self.ret ,obj
                if len(self.new_table_list) > 1:#####多个表
                    retcodelist=[]
                    for table in self.new_table_list:
                        table_name = table[0]
                        maintabledict = {}
                        column_get_sql = "desc %s" % (table_name)
                        property_dict = {}
                        property_dict["entity"] = otl_util.is_special(table_name)
                        property_dict["property"] = []
                        propertyname = []
                        try:###其中一个表有问题就跳过
                            columndata=self.query(column_get_sql)
                            ret = CommonResponseStatus.SUCCESS.value
                            maintabledict["entity"] = otl_util.is_special(table_name)
                            maintabledict["main_table"] = [table_name]
                            entity_main_table_dict.append(maintabledict)
                            entitylist.append([otl_util.is_special(table_name),otl_util.is_special(table_name)])
                            for i,item in enumerate(columndata):
                                if i <=99:
                                ### 要将表名和字段名转化为驼峰规则
                                    typ = item[1].split("(")[0]
                                    if typ not in ["boolean", "float", "double", "string", "decimal", "datetime",
                                                   "date"]:
                                        typnew = "string"
                                    elif typ == "int":
                                        typnew = "integer"
                                    else:
                                        typnew = typ
                                    if [otl_util.is_special(item[0]), typnew] not in property_dict["property"]:
                                        if otl_util.is_special(item[0]) not in propertyname:
                                            propertyname.append(otl_util.is_special(item[0]))
                                            property_dict["property"].append([otl_util.is_special(item[0]), typnew])
                                        else:
                                            sumdict = collections.Counter(propertyname)
                                            property_dict["property"].append([otl_util.is_special(item[0]) + "(" + str(
                                                sumdict[otl_util.is_special(item[0])]) + ")", typnew])
                                            propertyname.append(otl_util.is_special(item[0]))
                                else:
                                    break
                            property_dict["property"] = self.swapnamePositions(property_dict["property"])
                            entity_property_dict.append(property_dict)
                            retcodelist.append(ret)
                            table[3]="success"
                            table_list.append(table)
                        except Exception:
                            table[3] = "failed"
                            table_list.append(table)
                            ret=CommonResponseStatus.SERVER_ERROR.value
                            retcodelist.append(ret)

                            continue
                    if CommonResponseStatus.SUCCESS.value in retcodelist:
                        self.ret = CommonResponseStatus.SUCCESS.value
                    else:
                        self.ret = CommonResponseStatus.SERVER_ERROR.value
                        print("test connect false")
                        obj = {}
                        obj['cause'] = "None of tables can be predict"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Predict Ontology FALSE"
                        return self.ret, obj


                    new_entity_main_table_dict = []
                    # entitylist=[]

                    res["entity_list"] = [list(t) for t in set(tuple(_) for _ in entitylist)]
                    res["entity_property_dict"] = entity_property_dict
                    res["entity_main_table_dict"] = entity_main_table_dict
                    res["entity_relation_set"] = entity_relation_set
                    res["relation_main_table_dict"] = relation_main_table_dict
                    res["relation_property_dict"] = relation_property_dict
                    res["extract_type"] = "标准抽取"
                    obj = {}
                    obj["res"] = res
                    obj["file_list"] = table_list
                    return self.ret, obj

            elif self.flag=="hive":#####self.hiveCli.query
                table_list = []
                if len(self.new_table_list) == 1:  ####只有一个表
                    table = self.new_table_list[0]
                    table_name = table[0]
                    entitylist.append([otl_util.is_special(table_name),otl_util.is_special(table_name)])
                    maintabledict = {}
                    maintabledict["entity"] = otl_util.is_special(table_name)
                    maintabledict["main_table"] = [table_name]
                    entity_main_table_dict.append(maintabledict)
                    column_get_sql = "desc %s" % (table_name)
                    property_dict = {}
                    property_dict["entity"] = otl_util.is_special(table_name)
                    property_dict["property"] = []
                    propertyname = []
                    try:
                        columndata=self.hiveCli.query(column_get_sql)
                        if len(columndata) > 100:
                            columndata = columndata[0:100]
                        for item in columndata:
                            ### 要将表名和字段名转化为驼峰规则
                            typ = item[1].split("(")[0]
                            if typ not in ["boolean", "float", "double", "string", "decimal", "datetime",
                                           "date"]:

                                typnew = "string"
                            elif typ == "int":
                                typnew = "integer"
                            else:
                                typnew = typ
                            if [otl_util.is_special(item[0]), typnew] not in property_dict["property"]:
                                if otl_util.is_special(item[0]) not in propertyname:
                                    propertyname.append(otl_util.is_special(item[0]))
                                    property_dict["property"].append([otl_util.is_special(item[0]), typnew])
                                else:
                                    sumdict = collections.Counter(propertyname)
                                    property_dict["property"].append([otl_util.is_special(item[0]) + "(" + str(
                                        sumdict[otl_util.is_special(item[0])]) + ")", typnew])
                                    propertyname.append(otl_util.is_special(item[0]))
                        property_dict["property"] = self.swapnamePositions(property_dict["property"])
                        entity_property_dict.append(property_dict)
                        table[3] = "success"
                        table_list.append(table)
                        res["entity_list"] = [list(t) for t in set(tuple(_) for _ in entitylist)]
                        res["entity_property_dict"] = entity_property_dict
                        res["entity_main_table_dict"] = entity_main_table_dict
                        res["entity_relation_set"] = entity_relation_set
                        res["relation_main_table_dict"] = relation_main_table_dict
                        res["relation_property_dict"] = relation_property_dict
                        res["extract_type"] = "标准抽取"
                        obj = {}
                        obj["res"] = res
                        obj["file_list"] = table_list
                        return self.ret, obj
                        # table_column_result.append((new_table_name, new_column_name))  # （表名，列名）
                        # return self.ret, self.df, table_column_result, name_rule_dict, column_type_dict
                    except Exception as e:
                        obj = {}
                        self.ret = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = " You have error in Hive"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        if "Error" in repr(e) and "login" in repr(e):
                            obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                            obj['cause'] = "User or Password in  hive has error"
                        if "Table not found" in repr(e):
                            obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                            obj['cause'] = "Hive dont have this table or database"
                        if "Database" in repr(e):
                            obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                            obj['cause'] = "Hive dont have this table or database"
                        obj['message'] = "get data fail"

                        return self.ret, obj
                else:  #####多个表
                    retcodelist=[]
                    for table in self.new_table_list:
                        table_name = table[0]
                        maintabledict = {}
                        column_get_sql = "desc %s" % (table_name)
                        property_dict = {}
                        property_dict["entity"] = otl_util.is_special(table_name)
                        property_dict["property"] = []
                        propertyname = []
                        try:  ###其中一个表有问题就跳过
                            columnsdata = self.hiveCli.query(column_get_sql)
                            if len(columnsdata) > 100:
                                columnsdata = columnsdata[0:100]
                            ret = CommonResponseStatus.SUCCESS.value
                            maintabledict["entity"] = otl_util.is_special(table_name)
                            maintabledict["main_table"] = [table_name]
                            entity_main_table_dict.append(maintabledict)
                            entitylist.append([otl_util.is_special(table_name),otl_util.is_special(table_name)])
                            for item in columnsdata:
                                ### 要将表名和字段名转化为驼峰规则
                                typ = item[1].split("(")[0]
                                if typ not in ["boolean", "float", "double", "string", "decimal", "datetime",
                                               "date"]:

                                    typnew = "string"
                                elif typ == "int":
                                    typnew = "integer"
                                else:
                                    typnew = typ
                                if [otl_util.is_special(item[0]), typnew] not in property_dict["property"]:
                                    if otl_util.is_special(item[0]) not in propertyname:
                                        propertyname.append(otl_util.is_special(item[0]))
                                        property_dict["property"].append([otl_util.is_special(item[0]), typnew])
                                    else:
                                        sumdict = collections.Counter(propertyname)
                                        property_dict["property"].append([otl_util.is_special(item[0]) + "(" + str(
                                            sumdict[otl_util.is_special(item[0])]) + ")", typnew])
                                        propertyname.append(otl_util.is_special(item[0]))
                            property_dict["property"] = self.swapnamePositions(property_dict["property"])
                            entity_property_dict.append(property_dict)
                            retcodelist.append(ret)
                            table[3] = "success"
                            table_list.append(table)
                        except Exception as e:
                            print(repr(e))
                            table[3]="failed"
                            table_list.append(table)
                            ret=CommonResponseStatus.SERVER_ERROR.value
                            retcodelist.append(ret)
                            continue
                    if CommonResponseStatus.SUCCESS.value in retcodelist:
                        self.ret = CommonResponseStatus.SUCCESS.value
                    else:
                        self.ret = CommonResponseStatus.SERVER_ERROR.value
                        print("test connect false")
                        obj = {}
                        obj['cause'] = "None of tables can be predict"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Predict Ontology FALSE"
                        return self.ret, obj
                    new_entity_main_table_dict = []
                    # entitylist=[]

                    res["entity_list"] = [list(t) for t in set(tuple(_) for _ in entitylist)]
                    res["entity_property_dict"] = entity_property_dict
                    res["entity_main_table_dict"] = entity_main_table_dict
                    res["entity_relation_set"] = entity_relation_set
                    res["relation_main_table_dict"] = relation_main_table_dict
                    res["relation_property_dict"] = relation_property_dict
                    res["extract_type"] = "标准抽取"
                    obj = {}
                    obj["res"] = res
                    obj["file_list"] = table_list

                    return self.ret, obj

        else:#####as
            if self.ret == CommonResponseStatus.SERVER_ERROR.value:
                return self.ret, self.df[0]
            if len(self.df)==1:
                try:
                    one=self.df[0]
                    print(one)
                    property_dict = {}
                    filename = one["name"]
                    datadf = one["data"]
                    docid= one["docid"]
                    file = filename[::-1].split(".", 1)[-1][::-1]

                    property_dict["entity"] = otl_util.is_special(file)  # 预测本体 实体名 特殊字符处理
                    property_dict["property"] =[]
                    columns = datadf
                    if len(columns)>100:
                        columns=columns[0:100]
                    if len(columns)==1 and columns[0]=="":##空表处理
                        obj = {}
                        self.ret = CommonResponseStatus.SERVER_ERROR.value
                        obj['cause'] = "The columns of file is empty!"
                        obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                        obj['message'] = "Predict Ontology False"
                        return self.ret, obj

                    for column in columns:
                        if len(column)==0 :
                            continue
                        else:
                            if [otl_util.is_special(column),"string"] not in property_dict["property"] :
                                property_dict["property"].append([otl_util.is_special(column),"string"])  # 预测本体 属性 特殊字符处理
                    property_dict["property"] = self.swapnamePositions(property_dict["property"])
                    entity_property_dict.append(property_dict)
                    entitylist.append([otl_util.is_special(file),otl_util.is_special(file)])
                    maintabledict = {}
                    maintabledict["entity"] = otl_util.is_special(file)
                    maintabledict["main_table"] = [docid]
                    entity_main_table_dict.append(maintabledict)
                    new_entity_main_table_dict=[]######同名table
                    main_allentitylist=[]
                    for one in entity_main_table_dict:
                        entity = one["entity"]
                        maintable = one["main_table"]
                        if entity not in main_allentitylist:
                            main_allentitylist.append(entity)
                            new_main_table = {}
                            new_main_table["entity"] = entity
                            new_main_table["main_table"] = maintable
                            new_entity_main_table_dict.append(new_main_table)
                        else:
                            for i,two in enumerate(new_entity_main_table_dict):
                                if two["entity"] == entity:
                                    new_entity_main_table_dict[i]["main_table"].extend(maintable)
                                    new_entity_main_table_dict[i]["main_table"]= list(set(new_entity_main_table_dict[i]["main_table"]))
                    pro_allentitylist=[]
                    new_entity_property_dict=[]
                    for one in entity_property_dict:
                        entity = one["entity"]
                        properties = one["property"]
                        if entity not in pro_allentitylist:
                            pro_allentitylist.append(entity)
                            properties_dict = {}
                            properties_dict["entity"] = entity
                            properties_dict["property"] = properties
                            new_entity_property_dict.append(properties_dict)
                        else:
                            for i, two in enumerate(new_entity_property_dict):
                                if two["entity"] == entity:
                                    if two["property"]:
                                        for property in properties:
                                            if property not in new_entity_property_dict[i]["property"]:
                                                new_entity_property_dict[i]["property"].append(property)

                    res["entity_list"] = [list(t) for t in set(tuple(_) for _ in entitylist)]
                    res["entity_main_table_dict"] = entity_main_table_dict
                    res["entity_relation_set"] = entity_relation_set
                    res["relation_main_table_dict"] = relation_main_table_dict
                    res["entity_property_dict"] = entity_property_dict
                    res["relation_property_dict"] = relation_property_dict
                    res["extract_type"] = "标准抽取"
                    obj = {}
                    obj["res"] = res
                    obj["file_list"] = self.table_list_status
                    return self.ret, obj
            # table_column_result.append((new_table_name, new_column_name))  # （表名，列名）
            # return self.ret, self.df, table_column_result, name_rule_dict, column_type_dict
                except Exception as e:
                    obj = {}
                    self.ret = CommonResponseStatus.SERVER_ERROR.value
                    obj['cause'] = repr(e)
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Predict Ontology False"
                    return self.ret, obj
            if len(self.df) > 1:
                retcodelist=[]
                for one in self.df:
                    try:
                        ret=CommonResponseStatus.SUCCESS.value
                        print(one)
                        property_dict = {}
                        filename = one["name"]
                        datadf = one["data"]
                        docid = one["docid"]
                        file = filename[::-1].split(".", 1)[-1][::-1]

                        property_dict["entity"] = otl_util.is_special(file)
                        property_dict["property"] = []
                        columns = datadf
                        if len(columns) > 100:
                            columns = columns[0:100]
                        if len(columns) == 1 and columns[0] == "":  ##空表处理
                            ret = CommonResponseStatus.SERVER_ERROR.value
                            retcodelist.append(ret)
                            continue
                        for column in columns:
                            if len(column) == 0:
                                continue
                            else:
                                if [otl_util.is_special(column), "string"] not in property_dict["property"] :
                                    property_dict["property"].append([otl_util.is_special(column), "string"])
                            # property_dict["property"].append([otl_util.is_special(column), "string"])
                        property_dict["property"] = self.swapnamePositions(property_dict["property"])
                        entity_property_dict.append(property_dict)
                        # print(entity_property_dict)
                        entitylist.append([otl_util.is_special(file),otl_util.is_special(file)])
                        maintabledict = {}
                        maintabledict["entity"] = otl_util.is_special(file)
                        maintabledict["main_table"] = [docid]
                        entity_main_table_dict.append(maintabledict)
                        retcodelist.append(ret)
                    except Exception:
                        ret = CommonResponseStatus.SERVER_ERROR.value
                        retcodelist.append(ret)
                        continue
                new_entity_main_table_dict = []  ######同名table
                main_allentitylist = []
                for one in entity_main_table_dict:
                    entity = one["entity"]
                    maintable = one["main_table"]
                    if entity not in main_allentitylist:
                        main_allentitylist.append(entity)
                        new_main_table = {}
                        new_main_table["entity"] = entity
                        new_main_table["main_table"] = maintable
                        new_entity_main_table_dict.append(new_main_table)
                    else:
                        for i,two in enumerate(new_entity_main_table_dict):
                            if two["entity"] == entity:
                                if two["main_table"]:
                                    new_entity_main_table_dict[i]["main_table"].extend(maintable)
                                    new_entity_main_table_dict[i]["main_table"] = list(set(new_entity_main_table_dict[i]["main_table"]))
                pro_allentitylist = []
                new_entity_property_dict = []
                for one in entity_property_dict:
                    entity = one["entity"]
                    properties = one["property"]
                    if entity not in pro_allentitylist:
                        pro_allentitylist.append(entity)
                        properties_dict = {}
                        properties_dict["entity"] = entity
                        properties_dict["property"] = properties
                        new_entity_property_dict.append(properties_dict)
                    else:
                        for i,two in enumerate(new_entity_property_dict):
                            if two["entity"] == entity:
                                if two["property"]:
                                    for property in properties:
                                        if property not in new_entity_property_dict[i]["property"]:
                                            new_entity_property_dict[i]["property"].append(property)
                                    # new_entity_property_dict[i]["property"].extend(properties)
                                    # new_entity_property_dict[i]["property"] = list(set(new_entity_property_dict[i]["property"]))

                if CommonResponseStatus.SUCCESS.value in retcodelist:
                    self.ret = CommonResponseStatus.SUCCESS.value
                else:
                    self.ret = CommonResponseStatus.SERVER_ERROR.value
                    print("test connect false")
                    obj = {}
                    obj['cause'] = "None of tables can be predict"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Predict Ontology FALSE"
                    return self.ret, obj


                res["entity_list"] = [list(t) for t in set(tuple(_) for _ in entitylist)]
                res["entity_main_table_dict"] = new_entity_main_table_dict
                res["entity_relation_set"] = entity_relation_set
                res["relation_main_table_dict"] = relation_main_table_dict
                res["entity_property_dict"] = new_entity_property_dict
                res["relation_property_dict"] = relation_property_dict
                res["extract_type"] = "标准抽取"
                obj = {}
                obj["res"] = res
                obj["file_list"]=self.table_list_status
                return self.ret, obj
                # table_column_result.append((new_table_name, new_column_name))  # （表名，列名）
                # return self.ret, self.df, table_column_result, name_rule_dict, column_type_dict








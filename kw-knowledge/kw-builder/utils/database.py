# -*- coding: utf-8 -*-
'''
@Time    : 2020/2/21 10:03
@Author  : Tian.gu
'''
import pymysql
from utils.common_response_status import CommonResponseStatus
from utils.CommonUtil import commonutil
from utils.Otl_Util import otl_util
import collections
from utils.log_info import Logger
import common.stand_log as log_oper
import sys
import traceback
import pyodbc
import clickhouse_connect
import psycopg2
### 数据库选择接口
class DataBase():
    """
    self.df: for as, a list of file contents
        data: the column headers of the file
        name: file name
        docid: gns_path
    """
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
        self.connect_type = params_json['connect_type']
        if len(params_json['newtablelist']) != 0:
            if not isinstance(params_json['newtablelist'][0], list):
                self.new_table_list = [[i, "", "", "", ""] for i in params_json['newtablelist']]  ####[docid，docid]
            else:
                self.new_table_list = params_json['newtablelist']

        if self.flag == "mysql":
            self.password = commonutil.DecryptBybase64(params_json['ds_password'])
            self.ds_path = params_json['ds_path']
            self.ret = CommonResponseStatus.SUCCESS.value
            obj = {}
            try:
                if self.connect_type == "odbc":
                    pass
                    cnxnstr = f'DRIVER=MySQL ODBC 8.0 Unicode Driver;SERVER={self.ip};PORT={self.port};DATABASE={self.ds_path};UID={self.user};PWD={self.password};'
                    # mysql的odbc连接需要特殊处理，因为pyodbc.connect中timeout参数无效
                    from func_timeout import func_set_timeout

                    # 设定函数超时执行时间
                    @func_set_timeout(10)
                    def connect(cnxnstr):
                        return pyodbc.connect(cnxnstr, timeout=5)

                    try:
                        self.conn = connect(cnxnstr)
                    except:
                        raise Exception("Can't connect to MySQL server on '{}' (timed out)".format(self.ip))
                else:
                    self.conn = pymysql.connect(host=self.ip, user=self.user, passwd=self.password, db=self.ds_path,
                                                port=self.port)
                Logger.log_info("test connect successful")
                obj["res"] = "test connect successful"
                self.df = obj
            except Exception as e:
                self.ret = CommonResponseStatus.SERVER_ERROR.value
                Logger.log_info("test connect false")
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
                self.df = obj
        elif self.flag == "sqlserver":
            self.password = commonutil.DecryptBybase64(params_json['ds_password'])
            self.ds_path = params_json['ds_path']
            self.ret = CommonResponseStatus.SUCCESS.value
            obj = {}
            try:
                cnxnstr = f'DRIVER=ODBC Driver 18 for SQL Server;SERVER={self.ip},{self.port};DATABASE={self.ds_path};TrustServerCertificate=yes;UID={self.user};PWD={self.password};'
                self.conn = pyodbc.connect(cnxnstr, timeout=5)
                Logger.log_info("test connect successful")
                obj["res"] = "test connect successful"
                self.df = obj
            except Exception as e:
                self.ret = CommonResponseStatus.SERVER_ERROR.value
                Logger.log_info("test connect false")
                err = repr(e)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "test connection fail"
                if "password" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in sqlserver have error"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in sqlserver have error"
                if "doesn't exist" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                if "database" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                self.df = obj
        elif self.flag == "kingbasees":
            self.password = commonutil.DecryptBybase64(params_json['ds_password'])
            self.ds_path = params_json['ds_path']
            database = params_json['ds_path']
            database = database.split("/")[0]
            self.ret = CommonResponseStatus.SUCCESS.value
            obj = {}
            try:
                if self.connect_type == 'odbc':
                    cnxnstr = f'Driver=KingbaseES ODBC;SERVER={self.ip};PORT={self.port};DATABASE={database};UID={self.user};PWD={self.password}'
                    self.conn = pyodbc.connect(cnxnstr, timeout=5)
                else:
                    self.conn = psycopg2.connect(dbname=database, user=self.user, password=self.password, host=self.ip,
                                                 port=self.port, connect_timeout=10)
                Logger.log_info("test connect successful")
                obj["res"] = "test connect successful"
                self.df = obj
            except Exception as e:
                self.ret = CommonResponseStatus.SERVER_ERROR.value
                Logger.log_info("test connect false")
                err = repr(e)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "test connection fail"
                if "password" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in kingbasees have error"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in kingbasees have error"
                if "doesn't exist" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                if "database" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                self.df = obj
        elif self.flag == "postgresql":
            self.password = commonutil.DecryptBybase64(params_json['ds_password'])
            self.ds_path = params_json['ds_path']
            database = params_json['ds_path']
            database = database.split("/")[0]
            self.ret = CommonResponseStatus.SUCCESS.value
            obj = {}
            try:
                self.conn = psycopg2.connect(dbname=database, user=self.user, password=self.password, host=self.ip,
                                             port=self.port, connect_timeout=10)
                Logger.log_info("test connect successful")
                obj["res"] = "test connect successful"
                self.df = obj
            except Exception as e:
                self.ret = CommonResponseStatus.SERVER_ERROR.value
                Logger.log_info("test connect false")
                err = repr(e)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "test connection fail"
                if "password" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in postgresql have error"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in postgresql have error"
                if "doesn't exist" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                if "database" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                self.df = obj
        elif self.flag == "hive":
            self.password = commonutil.DecryptBybase64(params_json['ds_password'])
            self.ds_path = params_json['ds_path']
            self.ret = CommonResponseStatus.SUCCESS.value
            obj = {}
            try:
                HiveClient = self.getHiveClient()
                self.hiveCli = HiveClient(self.ip, self.user, self.password, self.ds_path,
                                          self.port)

                Logger.log_info("test connect successful")
                obj["res"] = "test connect successful"
                self.df = obj
            except Exception as e:
                self.ret = CommonResponseStatus.SERVER_ERROR.value
                Logger.log_info("test connect false")
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
                self.df = obj
        elif self.flag == "clickhouse":
            self.password = commonutil.DecryptBybase64(params_json['ds_password'])
            self.ds_path = params_json['ds_path']
            database = params_json['ds_path']
            self.ret = CommonResponseStatus.SUCCESS.value
            obj = {}
            try:
                self.client = clickhouse_connect.get_client(host=self.ip, port=self.port, username=self.user,
                                                            password=self.password, database=database)
                Logger.log_info("test connect successful")
                obj["res"] = "test connect successful"
                self.df = obj
            except Exception as e:
                self.ret = CommonResponseStatus.SERVER_ERROR.value
                Logger.log_info("test connect false")
                err = repr(e)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "test connection fail"
                if "password" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in clickhouse have error"
                if "does not have [USE]" in err:
                    obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                    obj['cause'] = "User or Password in clickhouse have error"
                if "doesn't exist" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                if "database" in err:
                    obj['code'] = CommonResponseStatus.NO_FILE_FALSE.value
                obj['message'] = "test connection fail"
                obj['cause'] = " You have error in clickhouse"
                self.df = obj

    def query(self, sql):
        self.cur = self.conn.cursor()
        self.cur.execute(sql)
        return self.cur.fetchall()

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

    def get_entity_edge(self, params_json):
        """
        根据文件获取抽取对象名及属性
        Args:
            params_json:
                data_source: 数据源类型
                postfix: 文件后缀名。可选值:csv json
                ds_name: 数据源名
                table_list: 对于数据库: [[表名, 数据源路径, 数据源名, 'running', 数据源类型]]
                ds_path: 数据源路径
                newtablelist: 和table_list一样
                graph_id: 图谱id

        Returns:
            ret:
            obj:
                res:
                    entity_list: 实体列表 example: [[entity1, entity1], [entity2, entity2]]
                    entity_property_dict: 实体属性表 list of object
                        entity: 实体名
                        property: [属性名， 属性类型]
                        column_name: 原数据列名
                    entity_main_table_dict: 实体所属表 list of object
                        entity: 实体名
                        main_table： 对于AS: [gns, 文件名, 完整文件名]；对于数据库: [表名]
                    entity_relation_set: []
                    relation_main_table_dict: []
                    relation_property_dict: []
                    extract_type: "标准抽取"
                file_list: table_list

        """
        res = {}
        entitylist = []
        entity_main_table_dict = []
        entity_property_dict = []
        entity_relation_set = []
        relation_main_table_dict = []
        relation_property_dict = []
        if self.ret == CommonResponseStatus.SERVER_ERROR.value:
            return self.ret, self.df
        if len(self.new_table_list) == 0:
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

        if self.flag == "mysql":
            table_list = []
            if len(self.new_table_list) != 0:
                retcodelist = []
                for table in self.new_table_list:
                    table_name = table[0]
                    maintabledict = {}
                    column_get_sql = "desc `%s`" % (table_name)
                    property_dict = {}
                    property_dict["entity"] = otl_util.is_special(table_name)
                    property_dict["property"] = []
                    property_dict['column_name'] = []
                    propertyname = []
                    try:  ###其中一个表有问题就跳过
                        columndata = []
                        if self.connect_type == "odbc":
                            cur = self.conn.cursor()
                            columndata = cur.execute(column_get_sql).fetchmany(100)
                        else:
                            columndata = self.query(column_get_sql)
                        if len(columndata) == 0:
                            raise Exception("table not exist")
                        ret = CommonResponseStatus.SUCCESS.value
                        maintabledict["entity"] = otl_util.is_special(table_name)
                        maintabledict["main_table"] = [table_name]
                        entity_main_table_dict.append(maintabledict)
                        entitylist.append([otl_util.is_special(table_name), otl_util.is_special(table_name)])
                        for i, item in enumerate(columndata):
                            if i <= 99:
                                ### 要将表名和字段名转化为驼峰规则
                                typ = item[1].split("(")[0]
                                if typ in ["boolean", "float", "double", "string", "decimal", "datetime",
                                           "date"]:
                                    typnew = typ
                                elif typ.startswith('int') or typ.endswith('int'):
                                    typnew = "integer"
                                elif typ.startswith('float'):
                                    typnew = 'float'
                                else:
                                    typnew = 'string'
                                if [otl_util.is_special(item[0]), typnew] not in property_dict["property"]:
                                    if otl_util.is_special(item[0]) not in propertyname:
                                        propertyname.append(otl_util.is_special(item[0]))
                                        property_dict["property"].append([otl_util.is_special(item[0]), typnew])
                                    else:
                                        sumdict = collections.Counter(propertyname)
                                        property_dict["property"].append([otl_util.is_special(item[0]) + "(" + str(
                                            sumdict[otl_util.is_special(item[0])]) + ")", typnew])
                                        propertyname.append(otl_util.is_special(item[0]))
                                    property_dict['column_name'].append(item[0])
                            else:
                                break
                        entity_property_dict.append(property_dict)
                        retcodelist.append(ret)
                        table[3] = "success"
                        table_list.append(table)
                    except Exception:
                        table[3] = "failed"
                        table_list.append(table)
                        ret = CommonResponseStatus.SERVER_ERROR.value
                        retcodelist.append(ret)

                        continue
                if CommonResponseStatus.SUCCESS.value in retcodelist:
                    self.ret = CommonResponseStatus.SUCCESS.value
                else:
                    self.ret = CommonResponseStatus.SERVER_ERROR.value
                    Logger.log_info("test connect false")
                    obj = {}
                    obj['cause'] = "None of tables can be predict"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Predict Ontology FALSE"
                    return self.ret, obj

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
        if self.flag == "sqlserver":
            table_list = []
            if len(self.new_table_list) != 0:
                retcodelist = []
                for table in self.new_table_list:
                    schema = table[0].split("/")[0]
                    table_name = table[0].split("/")[-1]
                    maintabledict = {}
                    column_get_sql = f"select column_name,data_type from information_schema.COLUMNS where TABLE_SCHEMA=N'{schema}' and TABLE_NAME=N'{table_name}';"
                    property_dict = {}
                    property_dict["entity"] = otl_util.is_special(table_name)
                    property_dict["property"] = []
                    property_dict['column_name'] = []
                    propertyname = []
                    try:  ###其中一个表有问题就跳过
                        cur = self.conn.cursor()
                        columndata = cur.execute(column_get_sql).fetchmany(100)
                        if len(columndata) == 0:
                            raise Exception("table not exist")

                        ret = CommonResponseStatus.SUCCESS.value
                        maintabledict["entity"] = otl_util.is_special(table_name)
                        maintabledict["main_table"] = [table[0]]
                        entity_main_table_dict.append(maintabledict)
                        entitylist.append([otl_util.is_special(table_name), otl_util.is_special(table_name)])
                        for i, item in enumerate(columndata):
                            if i <= 99:
                                ### 要将表名和字段名转化为驼峰规则
                                typ = item[1].split("(")[0]
                                if typ in ["boolean", "float", "double", "string", "decimal", "datetime", "date"]:
                                    typnew = typ
                                elif typ.startswith('int') or typ.endswith('int'):
                                    typnew = "integer"
                                elif typ.startswith('float'):
                                    typnew = 'float'
                                else:
                                    typnew = 'string'
                                if [otl_util.is_special(item[0]), typnew] not in property_dict["property"]:
                                    if otl_util.is_special(item[0]) not in propertyname:
                                        propertyname.append(otl_util.is_special(item[0]))
                                        property_dict["property"].append([otl_util.is_special(item[0]), typnew])
                                    else:
                                        sumdict = collections.Counter(propertyname)
                                        property_dict["property"].append([otl_util.is_special(item[0]) + "(" + str(
                                            sumdict[otl_util.is_special(item[0])]) + ")", typnew])
                                        propertyname.append(otl_util.is_special(item[0]))
                                    property_dict['column_name'].append(item[0])
                            else:
                                break
                        entity_property_dict.append(property_dict)
                        retcodelist.append(ret)
                        table[3] = "success"
                        table_list.append(table)
                    except Exception as e:
                        error_log = log_oper.get_error_log(repr(e),sys._getframe(), traceback.format_exc())
                        Logger.log_error(error_log)
                        table[3] = "failed"
                        table_list.append(table)
                        ret = CommonResponseStatus.SERVER_ERROR.value
                        retcodelist.append(ret)

                        continue
                if CommonResponseStatus.SUCCESS.value in retcodelist:
                    self.ret = CommonResponseStatus.SUCCESS.value
                else:
                    self.ret = CommonResponseStatus.SERVER_ERROR.value
                    Logger.log_info("test connect false")
                    obj = {}
                    obj['cause'] = "None of tables can be predict"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Predict Ontology FALSE"
                    return self.ret, obj

                new_entity_main_table_dict = []

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
        elif self.flag == "kingbasees":
            table_list = []
            if len(self.new_table_list) != 0:
                retcodelist = []
                for table in self.new_table_list:
                    schema = table[0].split("/")[0]
                    table_name = table[0].split("/")[-1]
                    maintabledict = {}
                    column_get_sql = f'''
                            SELECT col.COLUMN_NAME as name, col.UDT_NAME as type
                            FROM information_schema.COLUMNS col
                                     JOIN SYS_CLASS c ON c.RELNAME = col.TABLE_NAME
                                     LEFT JOIN SYS_DESCRIPTION d ON d.OBJOID = c.OID AND d.OBJSUBID = col.ORDINAL_POSITION
                                     LEFT JOIN sys_constraint s on c.OID = s.conrelid and col.ORDINAL_POSITION=ANY(conkey::int[])
                            WHERE col.table_schema = '{schema}'
                            AND col.TABLE_NAME = '{table_name}';'''
                    property_dict = {}
                    property_dict["entity"] = otl_util.is_special(table_name)
                    property_dict["property"] = []
                    property_dict['column_name'] = []
                    propertyname = []
                    try:  ###其中一个表有问题就跳过
                        cur = self.conn.cursor()
                        cur.execute(column_get_sql)
                        columndata = cur.fetchmany(100)
                        if len(columndata) == 0:
                            raise Exception("table not exist")

                        ret = CommonResponseStatus.SUCCESS.value
                        maintabledict["entity"] = otl_util.is_special(table_name)
                        maintabledict["main_table"] = [table[0]]
                        entity_main_table_dict.append(maintabledict)
                        entitylist.append([otl_util.is_special(table_name), otl_util.is_special(table_name)])
                        for i, item in enumerate(columndata):
                            if i <= 99:
                                ### 要将表名和字段名转化为驼峰规则
                                typ = item[1].split("(")[0].lower()
                                if typ in ["date", "datetime"]:
                                    typnew = "datetime"
                                elif typ.startswith('int') or typ.endswith('int'):
                                    typnew = "integer"
                                elif typ.startswith('float'):
                                    typnew = 'float'
                                elif typ not in ["boolean", "float", "double", "string", "decimal"]:
                                    typnew = "string"
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
                                    property_dict['column_name'].append(item[0])
                            else:
                                break
                        entity_property_dict.append(property_dict)
                        retcodelist.append(ret)
                        table[3] = "success"
                        table_list.append(table)
                    except Exception as e:
                        error_log = log_oper.get_error_log(repr(e),sys._getframe(), traceback.format_exc())
                        Logger.log_error(error_log)
                        table[3] = "failed"
                        table_list.append(table)
                        ret = CommonResponseStatus.SERVER_ERROR.value
                        retcodelist.append(ret)

                        continue
                if CommonResponseStatus.SUCCESS.value in retcodelist:
                    self.ret = CommonResponseStatus.SUCCESS.value
                else:
                    self.ret = CommonResponseStatus.SERVER_ERROR.value
                    Logger.log_info("test connect false")
                    obj = {}
                    obj['cause'] = "None of tables can be predict"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Predict Ontology FALSE"
                    return self.ret, obj

                new_entity_main_table_dict = []

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

        elif self.flag == "postgresql":
            table_list = []
            if len(self.new_table_list) != 0:
                retcodelist = []
                for table in self.new_table_list:
                    schema = table[0].split("/")[0]
                    table_name = table[0].split("/")[-1]
                    maintabledict = {}
                    column_get_sql = f'''SELECT a.attname as name, format_type(a.atttypid,a.atttypmod) as type
                                             FROM pg_class as c,pg_attribute as a,pg_namespace as n
                                             where a.attrelid = c.oid and a.attnum>0 and n.oid = c.relnamespace and attisdropped = false
                                             and n.nspname = '{schema}' and c.relname = '{table_name}';'''
                    property_dict = {}
                    property_dict["entity"] = otl_util.is_special(table_name)
                    property_dict["property"] = []
                    property_dict['column_name'] = []
                    propertyname = []
                    try:  ###其中一个表有问题就跳过
                        cur = self.conn.cursor()
                        cur.execute(column_get_sql)
                        columndata = cur.fetchmany(100)
                        if len(columndata) == 0:
                            raise Exception("table not exist")

                        ret = CommonResponseStatus.SUCCESS.value
                        maintabledict["entity"] = otl_util.is_special(table_name)
                        maintabledict["main_table"] = [table[0]]
                        entity_main_table_dict.append(maintabledict)
                        entitylist.append([otl_util.is_special(table_name), otl_util.is_special(table_name)])
                        for i, item in enumerate(columndata):
                            if i <= 99:
                                ### 要将表名和字段名转化为驼峰规则
                                typ = item[1].split("(")[0]
                                if typ in ["date", "datetime"]:
                                    typnew = "datetime"
                                elif typ.startswith('int') or typ.endswith('int'):
                                    typnew = "integer"
                                elif typ.startswith('float'):
                                    typnew = 'float'
                                elif typ not in ["boolean", "float", "double", "string", "decimal"]:
                                    typnew = "string"
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
                                    property_dict['column_name'].append(item[0])
                            else:
                                break
                        entity_property_dict.append(property_dict)
                        retcodelist.append(ret)
                        table[3] = "success"
                        table_list.append(table)
                    except Exception as e:
                        error_log = log_oper.get_error_log(repr(e),sys._getframe(), traceback.format_exc())
                        Logger.log_error(error_log)
                        table[3] = "failed"
                        table_list.append(table)
                        ret = CommonResponseStatus.SERVER_ERROR.value
                        retcodelist.append(ret)

                        continue
                if CommonResponseStatus.SUCCESS.value in retcodelist:
                    self.ret = CommonResponseStatus.SUCCESS.value
                else:
                    self.ret = CommonResponseStatus.SERVER_ERROR.value
                    Logger.log_info("test connect false")
                    obj = {}
                    obj['cause'] = "None of tables can be predict"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Predict Ontology FALSE"
                    return self.ret, obj

                new_entity_main_table_dict = []

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
        elif self.flag == "clickhouse":
            table_list = []
            if len(self.new_table_list) != 0:
                retcodelist = []
                for table in self.new_table_list:
                    table_name = table[0]
                    maintabledict = {}
                    column_get_sql = f'''desc `{table_name}`'''
                    property_dict = {}
                    property_dict["entity"] = otl_util.is_special(table_name)
                    property_dict["property"] = []
                    property_dict['column_name'] = []
                    propertyname = []
                    try:  ###其中一个表有问题就跳过
                        client = self.client
                        result = client.query(column_get_sql)
                        columndata = result.result_set
                        if len(columndata) == 0:
                            raise Exception("table not exist")

                        ret = CommonResponseStatus.SUCCESS.value
                        maintabledict["entity"] = otl_util.is_special(table_name)
                        maintabledict["main_table"] = [table[0]]
                        entity_main_table_dict.append(maintabledict)
                        entitylist.append([otl_util.is_special(table_name), otl_util.is_special(table_name)])
                        for i, item in enumerate(columndata):
                            if i <= 99:
                                ### 要将表名和字段名转化为驼峰规则
                                typ = item[1][9:-1] if "Nullable(" in item[1] else item[1]
                                if typ in ["DateTime", "DateTime64"] or "DateTime" in typ:
                                    typnew = "datetime"
                                elif typ in ["Date", "Date32"]:
                                    typnew = "date"
                                elif typ in ["Uint8", "Uint16", "Uint32", "Uint64", "Uint128", "Uint256", "Int8",
                                             "Int16", "Int32", "Int64", "Int128", "Int256"]:
                                    typnew = "integer"
                                elif typ == "Float32":
                                    typnew = "float"
                                elif typ == "Float64":
                                    typnew = "double"
                                elif "Decimal" in typ:
                                    typnew = "decimal"
                                else:
                                    typnew = "string"
                                if [otl_util.is_special(item[0]), typnew] not in property_dict["property"]:
                                    if otl_util.is_special(item[0]) not in propertyname:
                                        propertyname.append(otl_util.is_special(item[0]))
                                        property_dict["property"].append([otl_util.is_special(item[0]), typnew])
                                    else:
                                        sumdict = collections.Counter(propertyname)
                                        property_dict["property"].append([otl_util.is_special(item[0]) + "(" + str(
                                            sumdict[otl_util.is_special(item[0])]) + ")", typnew])
                                        propertyname.append(otl_util.is_special(item[0]))
                                    property_dict['column_name'].append(item[0])
                            else:
                                break
                        entity_property_dict.append(property_dict)
                        retcodelist.append(ret)
                        table[3] = "success"
                        table_list.append(table)
                    except Exception as e:
                        error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
                        Logger.log_info(error_log)
                        table[3] = "failed"
                        table_list.append(table)
                        ret = CommonResponseStatus.SERVER_ERROR.value
                        retcodelist.append(ret)

                        continue
                if CommonResponseStatus.SUCCESS.value in retcodelist:
                    self.ret = CommonResponseStatus.SUCCESS.value
                else:
                    self.ret = CommonResponseStatus.SERVER_ERROR.value
                    Logger.log_info("test connect false")
                    obj = {}
                    obj['cause'] = "None of tables can be predict"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Predict Ontology FALSE"
                    return self.ret, obj

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
        elif self.flag == "hive":  #####self.hiveCli.query
            table_list = []
            if len(self.new_table_list) == 1:  ####只有一个表
                table = self.new_table_list[0]
                table_name = table[0]
                entitylist.append([otl_util.is_special(table_name), otl_util.is_special(table_name)])
                maintabledict = {}
                maintabledict["entity"] = otl_util.is_special(table_name)
                maintabledict["main_table"] = [table_name]
                entity_main_table_dict.append(maintabledict)
                column_get_sql = "desc `%s`" % (table_name)
                property_dict = {}
                property_dict["entity"] = otl_util.is_special(table_name)
                property_dict["property"] = []
                property_dict['column_name'] = []
                propertyname = []
                try:
                    columndata = self.hiveCli.query(column_get_sql)
                    if len(columndata) == 0:
                        raise Exception("table not exist")
                    if len(columndata) > 100:
                        columndata = columndata[0:100]
                    for item in columndata:
                        # 分区表的特殊处理
                        if not item[0]:
                            break
                        ### 要将表名和字段名转化为驼峰规则
                        typ = item[1].split("(")[0]
                        if typ in ["boolean", "float", "double", "string", "decimal", "datetime",
                                   "date"]:
                            typnew = typ
                        elif typ.startswith('int') or typ.endswith('int'):
                            typnew = "integer"
                        elif typ.startswith('float'):
                            typnew = 'float'
                        else:
                            typnew = 'string'
                        if [otl_util.is_special(item[0]), typnew] not in property_dict["property"]:
                            if otl_util.is_special(item[0]) not in propertyname:
                                propertyname.append(otl_util.is_special(item[0]))
                                property_dict["property"].append([otl_util.is_special(item[0]), typnew])
                            else:
                                sumdict = collections.Counter(propertyname)
                                property_dict["property"].append([otl_util.is_special(item[0]) + "(" + str(
                                    sumdict[otl_util.is_special(item[0])]) + ")", typnew])
                                propertyname.append(otl_util.is_special(item[0]))
                            property_dict['column_name'].append(item[0])
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
                    error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
                    Logger.log_error(error_log)
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
                retcodelist = []
                for table in self.new_table_list:
                    table_name = table[0]
                    maintabledict = {}
                    column_get_sql = "desc `%s`" % (table_name)
                    property_dict = {}
                    property_dict["entity"] = otl_util.is_special(table_name)
                    property_dict["property"] = []
                    property_dict['column_name'] = []
                    propertyname = []
                    try:  ###其中一个表有问题就跳过
                        columnsdata = self.hiveCli.query(column_get_sql)
                        if len(columnsdata) == 0:
                            raise Exception("table not exist")
                        if len(columnsdata) > 100:
                            columnsdata = columnsdata[0:100]
                        ret = CommonResponseStatus.SUCCESS.value
                        maintabledict["entity"] = otl_util.is_special(table_name)
                        maintabledict["main_table"] = [table_name]
                        entity_main_table_dict.append(maintabledict)
                        entitylist.append([otl_util.is_special(table_name), otl_util.is_special(table_name)])
                        for item in columnsdata:
                            # 分区表的特殊处理
                            if not item[0]:
                                break
                            ### 要将表名和字段名转化为驼峰规则
                            typ = item[1].split("(")[0]
                            if typ in ["boolean", "float", "double", "string", "decimal", "datetime",
                                       "date"]:
                                typnew = typ
                            elif typ.startswith('int') or typ.endswith('int'):
                                typnew = "integer"
                            elif typ.startswith('float'):
                                typnew = 'float'
                            else:
                                typnew = 'string'
                            if [otl_util.is_special(item[0]), typnew] not in property_dict["property"]:
                                if otl_util.is_special(item[0]) not in propertyname:
                                    propertyname.append(otl_util.is_special(item[0]))
                                    property_dict["property"].append([otl_util.is_special(item[0]), typnew])
                                else:
                                    sumdict = collections.Counter(propertyname)
                                    property_dict["property"].append([otl_util.is_special(item[0]) + "(" + str(
                                        sumdict[otl_util.is_special(item[0])]) + ")", typnew])
                                    propertyname.append(otl_util.is_special(item[0]))
                                property_dict['column_name'].append(item[0])
                        entity_property_dict.append(property_dict)
                        retcodelist.append(ret)
                        table[3] = "success"
                        table_list.append(table)
                    except Exception as e:
                        error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
                        Logger.log_error(error_log)
                        table[3] = "failed"
                        table_list.append(table)
                        ret = CommonResponseStatus.SERVER_ERROR.value
                        retcodelist.append(ret)
                        continue
                if CommonResponseStatus.SUCCESS.value in retcodelist:
                    self.ret = CommonResponseStatus.SUCCESS.value
                else:
                    self.ret = CommonResponseStatus.SERVER_ERROR.value
                    Logger.log_info("test connect false")
                    obj = {}
                    obj['cause'] = "None of tables can be predict"
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Predict Ontology FALSE"
                    return self.ret, obj
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


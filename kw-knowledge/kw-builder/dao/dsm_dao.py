# -*-coding:utf-8-*-
# @Time    : 2020/8/11 10:37
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn

import arrow
import clickhouse_connect
import pandas as pd
import psycopg2
import pymysql
import pyodbc
import requests
import rdsdriver
from requests.auth import HTTPBasicAuth
from utils.CommonUtil import commonutil
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db


class DsmDao(object):
    def mysqlConnectTest(self, params_json):
        ip = params_json['ds_address']
        # ip = ip.split("://")[-1]
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        # password=params_json['ds_password']
        # 注释 解密 测试连接时，输入密码不需要解密，从数据库拿出来的才要解密
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        conn = pymysql.connect(host=ip, port=int(port), user=user, password=password, database=database,
                               charset="utf8",
                               connect_timeout=10, read_timeout=10, write_timeout=10)
        cursor = conn.cursor()
        sql = """SHOW TABLES;"""
        cursor.execute(sql)
        ret = cursor.fetchone()
        cursor.close()
        conn.close()
        return ret

    def getHiveClient(self):
        from utils.ConnectUtil import HiveClient
        return HiveClient

    def hiveConnectTest(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        # password = params_json['ds_password']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        HiveClient = self.getHiveClient()
        hiveCli = HiveClient(ip, user, password, database, port)
        hiveCli.close()
        data = "test connection sucess"
            
        return data

    @connect_execute_close_db
    def getdatabyauth(self, ds_auth, connection, cursor):
        sql = """SELECT * FROM author_token WHERE ds_auth=%s """
        sql = sql % ds_auth
        Logger.log_info(sql)
        cursor.execute(sql)
        data = cursor.fetchall()
        data = pd.DataFrame(list(data))
        return data

    def gettokenbycode(self, ds_auth, ds_code):
        obj = {}
        df = self.getdatabyauth(ds_auth)
        if len(df) == 0:
            
            return "-2"
        redirect_uri = df.loc[0, "redirect_uri"]
        client_id = df.loc[0, "client_id"]
        ds_address = df.loc[0, "ds_address"]
        ds_port = df.loc[0, "ds_port"]
        client_secret = df.loc[0, "client_secret"]
        payload = {"grant_type": "authorization_code",
                   "code": ds_code,
                   "redirect_uri": redirect_uri}

        url = ds_address + ":" + ds_port + "/oauth2/token"
        response2 = requests.post(url, auth=HTTPBasicAuth(client_id, client_secret), data=payload, verify=False)
        rs_json = response2.json()
        
        if response2.status_code == 200:
            refresh_token = rs_json["refresh_token"]
            acc_token = rs_json["access_token"]
            obj["refresh_token"] = refresh_token
            obj["access_token"] = acc_token
            return obj
        else:
            return "-1"

    def mysqlConnectTestUseODBC(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        cnxnstr = f'DRIVER=MySQL ODBC 8.0 Unicode Driver;SERVER={ip};PORT={port};DATABASE={database};UID={user};PWD={password};'

        # mysql的odbc连接需要特殊处理，因为pyodbc.connect中timeout参数无效
        from func_timeout import func_set_timeout

        # 设定函数超时执行时间
        @func_set_timeout(10)
        def connect(cnxnstr):
            return pyodbc.connect(cnxnstr, timeout=5)

        try:
            conn = connect(cnxnstr)
        except Exception:
            msg = "Can't connect to MySQL server on '{}' (timed out)".format(ip)
            
            raise Exception(msg)
        cursor = conn.cursor()
        sql = """select 1;"""
        cursor.execute(sql)
        ret = cursor.fetchone()
        cursor.close()
        conn.close()
        return ret

    def sqlserverConnectTest(self, params_json):
        """测试sqlserver连接"""
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        cnxnstr = f'DRIVER=ODBC Driver 18 for SQL Server;SERVER={ip},{port};DATABASE={database};TrustServerCertificate=yes;UID={user};PWD={password};'
        conn = pyodbc.connect(cnxnstr, timeout=5)

        cursor = conn.cursor()
        sql = """select 1;"""
        cursor.execute(sql)
        ret = cursor.fetchone()
        cursor.close()
        conn.close()

        return ret

    def kingbaseesConnectTest(self, params_json):
        """测试kingbasees连接"""
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        connect_type = params_json['connect_type']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        if connect_type == 'odbc':
            cnxnstr = f'Driver=KingbaseES ODBC;SERVER={ip};PORT={port};DATABASE={database};UID={user};PWD={password}'
            conn = pyodbc.connect(cnxnstr, autocommit=True, timeout=5)
        else:
            conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip, port=port,
                                    connect_timeout=10)

        cursor = conn.cursor()
        sql = 'select schema_name from information_schema.schemata'
        cursor.execute(sql)
        ret = cursor.fetchone()
        cursor.close()
        conn.close()
        return ret

    def postgresqlConnectTest(self, params_json):
        """测试postgresql连接"""
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip, port=port,
                                connect_timeout=10)
        cursor = conn.cursor()
        sql = 'select schema_name from information_schema.schemata'
        cursor.execute(sql)
        ret = cursor.fetchone()
        cursor.close()
        conn.close()
        return ret

    def clickHouseConnectTest(self, params_json):
        """ClickHouse测试连接"""
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        client = clickhouse_connect.get_client(host=ip, port=port, username=user, password=password,
                                               database=database)
        sql = "SHOW TABLES"
        result = client.query(sql)
            
        return result.result_set

    def mysql_table_field(self, params_json):
        """获取Mysql表字段"""
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        table_name = params_json["table_name"]
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        if params_json["connect_type"] == "odbc":
            cnxnstr = f'DRIVER=MySQL ODBC 8.0 Unicode Driver;SERVER={ip};PORT={port};DATABASE={database};UID={user};PWD={password};'
            conn = pyodbc.connect(cnxnstr, timeout=15)
            conn.timeout = 15
        else:
            conn = pymysql.connect(host=ip, port=int(port), user=user, password=password, database=database,
                                   charset="utf8", connect_timeout=10, read_timeout=15)
        cursor = conn.cursor()
        sql = f"desc `{table_name}`"
        cursor.execute(sql)
        table_desc = cursor.fetchall()
        fields = {desc[0]: desc[1] for desc in table_desc}
        res = {"fields": fields}
            
        return res

    def hive_table_field(self, params_json):
        """获取hive表结构"""
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        table_name = params_json['table_name']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        HiveClient = self.getHiveClient()
        hiveCli = HiveClient(ip, user, password, database, port)
        sql = f"desc `{table_name}`"
        table_desc = hiveCli.query(sql)
        fields = {desc[0]: desc[1] for desc in table_desc}
        res = {"fields": fields}
            
        return res

    def sqlserver_table_field(self, params_json):
        """获取sqlserver表结构"""
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        table_name = params_json['table_name']
        model_name = params_json['model_name']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        cnxnstr = f'DRIVER=ODBC Driver 18 for SQL Server;SERVER={ip},{port};DATABASE={database};TrustServerCertificate=yes;UID={user};PWD={password};'
        conn = pyodbc.connect(cnxnstr, timeout=5)
        cursor = conn.cursor()
        sql = f"select column_name, DATA_TYPE from information_schema.COLUMNS where " \
              f"TABLE_SCHEMA=N'{model_name}' and TABLE_NAME=N'{table_name}'"
        cursor.execute(sql)
        table_desc = cursor.fetchall()
        fields = {desc[0]: desc[1] for desc in table_desc}
        res = {"fields": fields}
            
        return res

    def kingbasees_table_field(self, params_json):
        """获取kingbasees表结构"""
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        connect_type = params_json['connect_type']
        table_name = params_json['table_name']
        model_name = params_json['model_name']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        if connect_type == 'odbc':
            cnxnstr = f'Driver=KingbaseES ODBC;SERVER={ip};PORT={port};DATABASE={database};UID={user};PWD={password}'
            conn = pyodbc.connect(cnxnstr, timeout=15)
        else:
            conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip,
                                    port=port, connect_timeout=15)
        cursor = conn.cursor()
        sql = f"SELECT column_name, data_type FROM information_schema.columns WHERE " \
              f"table_schema='{model_name}' and table_name='{table_name}'"
        cursor.execute(sql)
        table_desc = cursor.fetchall()
        fields = {desc[0]: desc[1] for desc in table_desc}
        res = {"fields": fields}
            
        return res

    def postgres_table_field(self, params_json):
        """获取postgres表结构"""
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        table_name = params_json['table_name']
        model_name = params_json['model_name']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip, port=port,
                                connect_timeout=10)
        cursor = conn.cursor()
        sql = f"SELECT column_name, data_type FROM information_schema.columns WHERE " \
              f"table_schema='{model_name}' and table_name='{table_name}'"
        cursor.execute(sql)
        table_desc = cursor.fetchall()
        fields = {desc[0]: desc[1] for desc in table_desc}
        res = {"fields": fields}
            
        return res

    def clickhouse_table_field(self, params_json):
        """获取clickhouse表结构"""
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        table_name = params_json['table_name']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        client = clickhouse_connect.get_client(host=ip, port=port, username=user, password=password,
                                               database=database)
        sql = f"desc `{table_name}`"
        result = client.query(sql)
        table_desc = result.result_set
        fields = {desc[0]: desc[1] for desc in table_desc}
        res = {"fields": fields}
            
        return res

    @connect_execute_commit_close_db
    def insertData(self, params_json, connection, cursor):
        """在data_source_table中新增数据源记录"""
        values_list = []
        # userId = request.headers.get("userId")
        userId = ""
        Logger.log_info("userId :%s " % userId)
        values_list.append(userId)  # 用户
        values_list.append(userId)
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(params_json["ds_name"])
        values_list.append(params_json["data_type"])
        values_list.append(params_json["data_source"])
        ds_address = params_json["ds_address"]
        values_list.append(ds_address)
        values_list.append(params_json["ds_port"])
        ds_path = params_json.get("ds_path", "")
        values_list.append(ds_path)
        values_list.append(params_json.get("extract_type", ""))
        values_list.append(params_json.get("vhost", ""))
        values_list.append(params_json.get("queue", ""))
        values_list.append(params_json.get("json_schema", ""))
        values_list.append(params_json["knw_id"])
        values_list.append(params_json.get("connect_type", ""))

        values_list.append(params_json.get("ds_user", ""))
        values_list.append(params_json.get("ds_password", ""))

        sql = """INSERT INTO data_source_table (create_by,update_by ,create_time,update_time, ds_name, data_type,
                       data_source,ds_address,ds_port,ds_path,extract_type,vhost, queue, json_schema, knw_id, connect_type, ds_user,ds_password) 
                       VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        cursor.execute(sql, values_list)
        Logger.log_info(sql % tuple(values_list))
        self.lastrowid = rdsdriver.process_last_row_id(cursor.lastrowid)
        new_id = self.lastrowid
            
        return new_id

    @connect_execute_close_db
    def getCountByKnwId(self, kgIds, knw_id, filter, ds_type, connection, cursor, ):
        condition = " where id > 0 "
        if len(kgIds) > 0:
            condition += """ AND id IN ({}) """.format(",".join(map(str, kgIds)))
        if filter == 'structured':
            condition += " and data_type = 'structured' "
        if ds_type:
            condition += f" and data_source = '{ds_type}' "
        if knw_id != "-1":
            condition += f" and knw_id = {knw_id} "
        sql = " SELECT id FROM data_source_table " + condition
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
            
        return len(res)

    @connect_execute_close_db
    def getCount(self, kgIds, connection, cursor, ):
        condition = " "
        if len(kgIds) > 0:
            condition = """WHERE id in ({})""".format(",".join(map(str, kgIds)))
        sql = """SELECT id FROM data_source_table """ + condition + """ ;"""
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return len(res)

    @connect_execute_close_db
    def getCountstructured(self, connection, cursor, ):
        sql = """
                SELECT id FROM data_source_table where data_type = 'structured';
                """
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return len(res)

    @connect_execute_close_db
    def getbyids(self, ids, connection, cursor, ):
        if len(ids) == 0:
            return []
        # sql = """SELECT a1.username AS create_user_name, a2.username AS update_user_name,d.* FROM data_source_table AS d
        #             LEFT JOIN account a1 ON a1.account_id=d.create_by
        #             LEFT JOIN account a2 ON a2.account_id=d.update_by  where d.id in (%s)
        #         ORDER BY update_time desc""" % (
        #     ",".join([str(id) for id in ids]))
        sql = """SELECT d.* FROM data_source_table AS d 
                    where d.id in (%s) 
                ORDER BY update_time desc""" % (
            ",".join([str(id) for id in ids]))
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        # 若没数据时会返回空tuple，需修改为list，防止后续排序时出错
        if len(res) == 0:
            res = []
            
        return res

    @connect_execute_close_db
    def getbyids_order(self, ids, connection, cursor, ):
        sql = """SELECT * FROM data_source_table WHERE id IN ({}) 
                AND data_type=%s ORDER BY update_time desc""".format(",".join([str(id) for id in ids]))

        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql, ["structured"])
        res = cursor.fetchall()
            
        return res

    @connect_execute_close_db
    def getdsbyids(self, ids, connection, cursor, ):

        sql = """SELECT * FROM data_source_table where id in (%s) """ % (",".join([str(id) for id in ids]))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getbyid(self, id, connection, cursor, ):
        sql = """SELECT * FROM data_source_table where id = %s""" % (id)

        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
            
        return res

    @connect_execute_close_db
    def getbydsname(self, name, knw_id, connection, cursor, ):
        sql = """SELECT id FROM data_source_table where ds_name=%s and knw_id=%s;"""

        Logger.log_info(sql)
        cursor.execute(sql, [name, knw_id])
        res = cursor.fetchall()
            
        return res

    @connect_execute_close_db
    def getdatabyid(self, ds_id, connection, cursor):
        sql = """SELECT * FROM data_source_table where id = %s""" % str(ds_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
            
        return res

    @connect_execute_close_db
    def getCountbyname(self, ds_name, kgIds, knw_id, connection, cursor, ):
        condition = " "
        if len(kgIds) > 0:
            condition = """ id in ({}) AND """.format(",".join(map(str, kgIds)))
        sql = """SELECT id FROM data_source_table where knw_id=%s AND """ + condition + """ ds_name like %s;"""
        ds_name = "%" + ds_name + "%"
        value_list = [knw_id, ds_name]
        Logger.log_info(sql % tuple(value_list))

        cursor.execute(sql, value_list)
        res = cursor.fetchall()
            
        return len(res)

    @connect_execute_commit_close_db
    def delete(self, ids, connection, cursor, ):
        sql1 = """DELETE FROM data_source_table WHERE id in (%s);""" % (",".join([str(id) for id in ids]))
        Logger.log_info(sql1)
        cursor.execute(sql1)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
            
        return new_id

    @connect_execute_close_db
    def getall(self, page, size, order, kgIds, knw_id, filter, ds_type, connection, cursor):
        if knw_id and knw_id != "-1":
            if len(kgIds) > 0:
                condition = """ WHERE d.knw_id={0} AND d.id in ({1}) """.format(knw_id, ",".join(map(str, kgIds)))
            else:
                condition = """ WHERE d.knw_id={0} """.format(knw_id)
        else:
            if len(kgIds) > 0:
                condition = """ WHERE d.id in ({}) """.format(",".join(map(str, kgIds)))
            else:
                condition = """ WHERE d.id > 0 """
        if filter == 'structured':
            condition += """ and d.data_type = 'structured' """
        if ds_type:
            condition += f""" and d.data_source = '{ds_type}' """

        if page == -2:
            sql = """SELECT
                        *
                    FROM
                        data_source_table as d """ \
                  + condition
            Logger.log_info(sql)
            cursor.execute(sql)
            res = cursor.fetchall()

            return res
        else:
            if order == "ascend":
                # sql = """SELECT
                #         a1.username AS create_user_name,
                #         a2.username AS update_user_name,
                #         d.*
                #     FROM
                #         data_source_table AS d
                #         JOIN account a1 ON a1.account_id = d.create_by
                #         JOIN account a2 ON a2.account_id = d.update_by""" \
                #       + condition + """ order by update_time asc limit %s, %s;"""
                sql = """SELECT
                        d.*
                    FROM
                        data_source_table AS d """ \
                      + condition + """ order by update_time asc limit %s, %s;"""
            else:
                # sql = """SELECT
                #         a1.username AS create_user_name,
                #         a2.username AS update_user_name,
                #         d.*
                #     FROM
                #         data_source_table AS d
                #         JOIN account a1 ON a1.account_id = d.create_by
                #         JOIN account a2 ON a2.account_id = d.update_by """ \
                #       + condition + """ order by update_time  Desc limit %s, %s;"""
                sql = """SELECT
                        d.*
                    FROM
                        data_source_table AS d """ \
                      + condition + """ order by update_time  Desc limit %s, %s;"""
            cursor.execute(sql, [page * size, size])
            Logger.log_info(sql)
            res = cursor.fetchall()

            return res

    @connect_execute_close_db
    def getallbyname(self, ds_name, page, size, order, kgIds, knw_id, connection, cursor):
        condition = " "
        if len(kgIds) > 0:
            condition = """ d.id in ({}) AND """.format(",".join(map(str, kgIds)))
        # sql = """SELECT a1.username AS create_user_name, a2.username AS update_user_name, d.* FROM data_source_table AS d
        #         LEFT JOIN account a1 ON a1.account_id=d.create_by
        #         LEFT JOIN account a2 ON a2.account_id=d.update_by
        #         where  """ + condition + """ knw_id=%s AND d.ds_name like %s
        #         order by d.update_time asc limit %s, %s;"""
        sql = """SELECT d.* FROM data_source_table AS d 
                where  """ + condition + """ knw_id=%s AND d.ds_name like %s 
                order by d.update_time asc limit %s, %s;"""
        if order == "descend":
            # sql = """SELECT a1.username AS create_user_name, a2.username AS update_user_name, d.* FROM data_source_table AS d
            #         LEFT JOIN account a1 ON a1.account_id=d.create_by
            #         LEFT JOIN account a2 ON a2.account_id=d.update_by
            #         where """ + condition + """ knw_id=%s AND d.ds_name like %s
            #         order by d.update_time desc limit %s, %s; """
            sql = """SELECT d.* FROM data_source_table AS d 
                        where """ + condition + """ knw_id=%s AND d.ds_name like %s 
                        order by d.update_time desc limit %s, %s; """
        ds_name = "%" + ds_name + "%"
        value_list = [knw_id, ds_name, page * size, size]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
            
        return res

    @connect_execute_commit_close_db
    def update(self, id, params_json, connection, cursor):
        """数据源编辑"""
        values_list = []
        # userId = request.headers.get("userId")
        userId = ""
        values_list.append(userId)  # 用户
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(params_json["ds_name"])

        values_list.append(params_json.get("json_schema", ""))
        values_list.append(params_json.get("ds_user", ""))
        values_list.append(params_json.get("ds_password", ""))

        values_list.append(id)
        sql = """UPDATE data_source_table SET update_by=%s, update_time=%s, ds_name=%s, json_schema=%s,
                            ds_user=%s, ds_password=%s where id = %s"""
        cursor.execute(sql, values_list)
        # cursor.execute(sql)
        Logger.log_info(sql % tuple(values_list))
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
            
        return new_id

    @connect_execute_close_db
    def getcode(self, code, connection, cursor):
        sql = "SELECT * FROM author_token WHERE " + "ds_code='" + code + "'"
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
            
        return res

    @connect_execute_commit_close_db
    def insert_token(self, value_json, connection, cursor):
        sql = """INSERT INTO author_token (ds_address,ds_port) VALUES(%s,%s)"""
        Logger.log_info(sql % tuple(value_json))
        cursor.execute(sql, value_json)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_commit_close_db
    def update_token(self, value_json, connection, cursor):
        sql = """UPDATE author_token SET ds_address=%s, ds_port=%s, redirect_uri=%s, client_id=%s, client_secret=%s where ds_auth = %s"""
        value_list = [value_json[0], value_json[1], value_json[2], value_json[3], value_json[4], value_json[5]]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
            

    @connect_execute_commit_close_db
    def insert_refresh_token(self, flag, value_json, connection, cursor):
        if flag == "refresh":
            sql = """UPDATE author_token SET refresh_token=%s, access_token=%s, update_time=%s where ds_auth = %s"""
            value_list = [value_json[0], value_json[1], arrow.now().format('YYYY-MM-DD HH:mm:ss'), value_json[2]]
        elif flag == "code":
            sql = """UPDATE author_token SET refresh_token=%s, access_token=%s, ds_code=%s, update_time=%s where ds_auth = %s"""
            value_list = [value_json[0], value_json[1], value_json[2], arrow.now().format('YYYY-MM-DD HH:mm:ss'), value_json[3]]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_close_db
    def getdsbyid(self, kgIds, connection, cursor):
        condition1, condition2 = " ", " "
        if len(kgIds) > 0:
            condition1 = """ WHERE d.id in ({}) """.format(",".join(map(str, kgIds)))
            condition2 = """ AND data_type = "structured" """

        # sql = """SELECT a1.username AS create_user_name, a2.username AS update_user_name, d.* FROM data_source_table AS d
        #             LEFT JOIN account a1 ON a1.account_id=d.create_by
        #             LEFT JOIN account a2 ON a2.account_id=d.update_by
        #             """ + condition1 + condition2 + """ order by update_time """
        sql = """SELECT d.* FROM data_source_table AS d 
                    """ + condition1 + condition2 + """ order by update_time """
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getCounts1(self, kgIds, connection, cursor, ):
        condition1, condition2 = " ", " "
        if len(kgIds) > 0:
            condition1 = """ WHERE id in ({}) """.format(",".join(map(str, kgIds)))
            condition2 = """ AND data_type = 'structured' """
        sql = """SELECT id FROM data_source_table """ + condition1 + condition2 + """ ;"""
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return len(res)

    @connect_execute_close_db
    def getbydsnameId(self, name, dsid, connection, cursor, ):
        sql = """SELECT id FROM data_source_table where ds_name = %s and id != %s and knw_id=(select knw_id from data_source_table d where id = %s);"""
        Logger.log_info(sql)
        cursor.execute(sql, [name, dsid, dsid])
        res = cursor.fetchall()
        return res


    @connect_execute_close_db
    def get_ds_by_knw(self, knw_ids, connection, cursor):
        knw_ids = [str(knw_id) for knw_id in knw_ids]
        sql = """ select id from data_source_table where knw_id in ({}); """.format(','.join(knw_ids))
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()


dsm_dao = DsmDao()

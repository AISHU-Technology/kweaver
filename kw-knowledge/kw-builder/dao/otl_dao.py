# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import base64
import configparser
import datetime
import json
import re
import rdsdriver
import arrow
import psycopg2
import pymysql
import pyodbc
import clickhouse_connect
import requests
from Crypto.Cipher import PKCS1_v1_5 as Cipher_pkcsl_v1_5
from Crypto.PublicKey import RSA
from flask_babel import gettext as _l
from func_timeout import func_set_timeout
from utils.CommonUtil import commonutil
from utils.Otl_Util import otl_util
from utils.common_response_status import CommonResponseStatus
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db

config = configparser.ConfigParser()


class OtlDao(object):

    public_key = '''-----BEGIN PUBLIC KEY-----
    MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC7JL0DcaMUHumSdhxXTxqiABBC
    DERhRJIsAPB++zx1INgSEKPGbexDt1ojcNAc0fI+G/yTuQcgH1EW8posgUni0mcT
    E6CnjkVbv8ILgCuhy+4eu+2lApDwQPD9Tr6J8k21Ruu2sWV5Z1VRuQFqGm/c5vaT
    OQE5VFOIXPVTaa25mQIDAQAB
    -----END PUBLIC KEY-----
    '''

    mysql_desc_code = {3: "integer", 5: "double", 4: "float", 246: "decimal", 10: "date", 19: "datetime"}
    psycopg2_desc_code = {23: "integer", 701: "double", 1700: "decimal", 1114: "datetime", 16: "boolean"}
    type_desc_dict = {"int": "integer", "float": "float", "decimal.Decimal": "decimal", "datetime.date": "date",
                      "datetime.datetime": "datetime"}

    def get_clickhouse_type(self, ch_type):
        if ch_type in ["UInt8", "UInt16", "UInt32", "UInt64", "UInt128", "UInt256",
                       "Int8", "Int16", "Int32", "Int64", "Int128", "Int256"]:
            return "integer"
        elif ch_type in ["Float32", "Float64"]:
            return "float"
        elif ch_type in ["Date", "Date32"]:
            return "date"
        elif ch_type in ["DateTime", "DateTime64"]:
            return "datetime"
        else:
            return "string"

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
        cursor.execute(sql1)
        ret = cursor.fetchall()
        count = len(ret)
        ret1 = [x[0] for x in ret]
        Logger.log_info(ret1)
        cursor.close()
        conn.close()
        return count, ret1

    def mysqlOdbcConnect(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1", []
        cnxnstr = f'DRIVER=MySQL ODBC 8.0 Unicode Driver;SERVER={ip};PORT={port};DATABASE={database};UID={user};PWD={password};'

        # mysql的odbc连接需要特殊处理，因为pyodbc.connect中timeout参数无效
        from func_timeout import func_set_timeout

        # 设定函数超时执行时间
        @func_set_timeout(10)
        def connect(cnxnstr):
            return pyodbc.connect(cnxnstr, timeout=5)

        try:
            conn = connect(cnxnstr)
        except:
            raise Exception("Can't connect to MySQL server on '{}' (timed out)".format(ip))
        cursor = conn.cursor()
        sql1 = "show tables;"
        cursor.execute(sql1)
        ret = cursor.fetchall()
        count = len(ret)
        ret1 = [x[0] for x in ret]
        Logger.log_info(ret1)
        cursor.close()
        conn.close()
        return count, ret1

    def sqlServerConnect(self, params_json):
        ret1 = dict()
        count = 0
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1", []
        cnxnstr = f'DRIVER=ODBC Driver 18 for SQL Server;SERVER={ip},{port};DATABASE={database};TrustServerCertificate=yes;UID={user};PWD={password};'
        conn = pyodbc.connect(cnxnstr, timeout=5)
        cursor = conn.cursor()

        sql = "select name from sys.schemas"
        cursor.execute(sql)
        ret = cursor.fetchall()
        schemas = [x[0] for x in ret]
        for schema in schemas:
            sql1 = f"select TABLE_NAME from INFORMATION_SCHEMA.TABLES where TABLE_SCHEMA='{schema}' ORDER BY TABLE_NAME;"
            cursor.execute(sql1)
            ret = cursor.fetchall()
            count += len(ret)
            ret1[schema] = [x[0] for x in ret]
        Logger.log_info(ret1)
        cursor.close()
        conn.close()
        return count, ret1

    def kingbaseesConnect(self, params_json):
        ret1 = dict()
        count = 0
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        database = database.split("/")[0]
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
            conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip,
                                    port=port, connect_timeout=10)

        cursor = conn.cursor()
        sql = 'select schema_name from information_schema.schemata'
        cursor.execute(sql)
        ret = cursor.fetchall()
        schemas = [x[0] for x in ret]

        for schema in schemas:
            sql1 = f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{schema}' ORDER BY table_name;"
            cursor.execute(sql1)
            ret = cursor.fetchall()
            count += len(ret)
            ret1[schema] = [x[0] for x in ret]
        Logger.log_info(ret1)
        cursor.close()
        conn.close()
        return count, ret1

    def postgresConnect(self, params_json):
        ret1 = dict()
        count = 0
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        database = database.split("/")[0]
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip, port=port, connect_timeout=10)
        cursor = conn.cursor()
        sql = 'select schema_name from information_schema.schemata'
        cursor.execute(sql)
        ret = cursor.fetchall()
        schemas = [x[0] for x in ret]

        for schema in schemas:
            sql1 = f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{schema}' ORDER BY table_name;"
            cursor.execute(sql1)
            ret = cursor.fetchall()
            count += len(ret)
            ret1[schema] = [x[0] for x in ret]
        Logger.log_info(ret1)
        cursor.close()
        conn.close()
        return count, ret1

    def clickhouseConnect(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        client = clickhouse_connect.get_client(host=ip, port=port, username=user, password=password, database=database)
        sql = """show tables"""
        result = client.query(sql)
        ret = result.result_set
        res = [x[0] for x in ret]
        count = len(res)

        return count, res

    def mysqldatashow(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        tablename = params_json['name']
        limitsize = params_json.get("limit_size", 100)
        limitwide = params_json.get("limit_wide", 100)
        conn = pymysql.connect(host=ip, port=int(port), user=user, password=password, database=database, charset="utf8",
                               connect_timeout=10, read_timeout=10, write_timeout=10)
        cursor = conn.cursor()
        sql0 = "desc `{}`".format(tablename)
        cursor.execute(sql0)
        if limitwide == -1:
            ret = cursor.fetchall()
            limitwide = len(ret)
        else:
            ret = cursor.fetchmany(limitwide)

        columnNames = []
        for item in ret:
            columnNames.append(item[0])
        res = [columnNames[:limitwide]]
        sql = """SELECT * FROM `{}` LIMIT 0,{}; """
        sql = sql.format(tablename, limitsize)
        cursor.execute(sql)
        ret = cursor.fetchall()
        for val in ret:
            res.append(list(val[:limitwide]))

        for i in range(len(res)):
            for j in range(len(res[i])):
                res[i][j] = str(res[i][j])[:200]

        cursor.close()
        conn.close()

        return res

    def mysqlOdbcdatashow(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        tablename = params_json['name']
        limitsize = params_json.get("limit_size", 100)
        limitwide = params_json.get("limit_wide", 100)
        cnxnstr = f'DRIVER=MySQL ODBC 8.0 Unicode Driver;SERVER={ip};PORT={port};DATABASE={database};UID={user};PWD={password};'

        # mysql的odbc连接需要特殊处理，因为pyodbc.connect中timeout参数无效
        from func_timeout import func_set_timeout

        # 设定函数超时执行时间
        @func_set_timeout(10)
        def connect(cnxnstr):
            return pyodbc.connect(cnxnstr, timeout=5)

        try:
            conn = connect(cnxnstr)
        except:
            raise Exception("Can't connect to MySQL server on '{}' (timed out)".format(ip))
        cursor = conn.cursor()
        sql = f"desc `{tablename}`;"
        cursor.execute(sql)
        if limitwide == -1:
            ret = cursor.fetchall()
            limitwide = len(ret)
        else:
            ret = cursor.fetchmany(limitwide)
        columnNames = []
        for item in ret:
            columnNames.append(item[0])

        res = [columnNames[:limitwide]]
        sql = f"SELECT * FROM `{tablename}` limit 0,{limitsize}"
        cursor.execute(sql)
        ret = cursor.fetchall()
        for val in ret:
            res.append(list(val[:limitwide]))
        for i in range(len(res)):
            for j in range(len(res[i])):
                res[i][j] = str(res[i][j])[:200]
        cursor.close()
        conn.close()
        return res

    def sqlserverdatashow(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        schema = params_json.get('model_name', params_json['name'].split("/")[0])
        tablename = params_json['name'].split("/")[-1]
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        limitsize = params_json.get("limit_size", 100)
        limitwide = params_json.get("limit_wide", 100)
        cnxnstr = f'DRIVER=ODBC Driver 18 for SQL Server;SERVER={ip},{port};DATABASE={database};TrustServerCertificate=yes;UID={user};PWD={password};'
        conn = pyodbc.connect(cnxnstr, timeout=5)
        cursor = conn.cursor()
        sql = f"select column_name, data_type from information_schema.COLUMNS " \
              f"where TABLE_SCHEMA=N'{schema}' and TABLE_NAME=N'{tablename}';"
        cursor.execute(sql)
        if limitwide == -1:
            ret = cursor.fetchall()
            limitwide = len(ret)
        else:
            ret = cursor.fetchmany(limitwide)
        columnNames = []
        for item in ret:
            columnNames.append(item[0])

        res = [columnNames[:limitwide]]
        sql = f'''SELECT top {limitsize} * FROM "{schema}"."{tablename}"'''
        cursor.execute(sql)
        ret = cursor.fetchall()
        for val in ret:
            res.append(list(val[:limitwide]))

        for i in range(len(res)):
            for j in range(len(res[i])):
                res[i][j] = str(res[i][j])[:200]
        cursor.close()
        conn.close()
        return res

    def kingbaseesdatashow(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        schema = params_json.get('model_name', params_json['name'].split("/")[0])
        tablename = params_json['name'].split("/")[-1]
        database = params_json['ds_path'].split("/")[0]
        user = params_json['ds_user']
        connect_type = params_json['connect_type']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        limitsize = params_json.get("limit_size", 100)
        limitwide = params_json.get("limit_wide", 100)

        if connect_type == 'odbc':
            cnxnstr = f'Driver=KingbaseES ODBC;SERVER={ip};PORT={port};DATABASE={database};UID={user};PWD={password}'
            conn = pyodbc.connect(cnxnstr, autocommit=True, timeout=5)
        else:
            conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip,
                                    port=port, connect_timeout=10)
        cursor = conn.cursor()
        sql1 = f"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '{schema}' and table_name='{tablename}' ;"
        cursor.execute(sql1)
        if limitwide == -1:
            ret = cursor.fetchall()
            limitwide = len(ret)
        else:
            ret = cursor.fetchmany(limitwide)
        columnNames = []
        for item in ret:
            columnNames.append(item[0])

        res = [columnNames[:limitwide]]
        sql1 = f'''SELECT * FROM "{schema}"."{tablename}" limit {limitsize}'''
        cursor.execute(sql1)
        ret = cursor.fetchall()
        for val in ret:
            res.append(list(val[:limitwide]))

        for i in range(len(res)):
            for j in range(len(res[i])):
                res[i][j] = str(res[i][j])[:200]
        cursor.close()
        conn.close()
        return res

    def postgresdatashow(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        schema = params_json.get('model_name', params_json['name'].split("/")[0])
        tablename = params_json['name'].split("/")[-1]
        database = params_json['ds_path'].split("/")[0]
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        limitsize = params_json.get("limit_size", 100)
        limitwide = params_json.get("limit_wide", 100)

        conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip, port=port, connect_timeout=10)
        cursor = conn.cursor()
        sql1 = f"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '{schema}' and table_name='{tablename}';"
        cursor.execute(sql1)
        if limitwide == -1:
            ret = cursor.fetchall()
            limitwide = len(ret)
        else:
            ret = cursor.fetchmany(limitwide)
        columnNames = []
        for item in ret:
            columnNames.append(item[0])

        res = [columnNames[:limitwide]]
        sql1 = f'''SELECT * FROM "{schema}"."{tablename}" limit {limitsize}'''
        cursor.execute(sql1)
        ret = cursor.fetchall()
        for val in ret:
            res.append(list(val[:limitwide]))

        for i in range(len(res)):
            for j in range(len(res[i])):
                res[i][j] = str(res[i][j])[:200]
        cursor.close()
        conn.close()
        return res

    def clickhousedatashow(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        tablename = params_json['name']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        limitsize = params_json.get("limit_size", 100)
        limitwide = params_json.get("limit_wide", 100)

        client = clickhouse_connect.get_client(host=ip, port=port, username=user, password=password, database=database)

        sql1 = f"""desc `{tablename}`"""
        result = client.query(sql1)
        ret = result.result_set
        if limitwide == -1:
            limitwide = len(ret)
        else:
            ret = ret[:limitwide]
        columnNames = [item[0] for item in ret]
        res = [columnNames]

        sql = f"""SELECT * FROM `{tablename}` LIMIT 0, {limitsize}"""
        result = client.query(sql, query_formats={'FixedString': 'string'})
        ret = result.result_set

        for val in ret:
            res.append(list(val[:limitwide]))

        for i in range(len(res)):
            for j in range(len(res[i])):
                res[i][j] = re.sub('[\x00]*', "", str(res[i][j]))[:200]

        return res

    def hivedatashow(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"
        tablename = params_json['name']
        limitsize = params_json.get("limit_size", 100)
        limitwide = params_json.get("limit_wide", 100)
        start = datetime.datetime.now()
        HiveClient = self.getHiveClient()
        hiveCli = HiveClient(ip, user, password, database, port)
        end = datetime.datetime.now()
        Logger.log_info("hive connection time is {}".format((end - start).seconds))
        start = datetime.datetime.now()
        sql0 = """DESC `{}`"""
        sql0 = sql0.format(tablename)
        ret0 = hiveCli.query(sql0)
        end = datetime.datetime.now()
        Logger.log_info("hive query columns time is {}".format((end - start).seconds))
        resultlist = []
        headlist = []
        for x in ret0:
            # 分区表特殊处理
            if not x[0]:
                break
            headlist.append(x[0])
        Logger.log_info(headlist)
        if limitwide == -1:
            resultlist.append(headlist)
            limitwide = len(headlist)
        else:
            resultlist.append(headlist[:limitwide])
        sql = "SELECT * FROM `{}`.`{}` LIMIT {} "
        sql = sql.format(database, tablename, limitsize)
        Logger.log_info(sql)
        start = datetime.datetime.now()
        ret = hiveCli.query(sql)
        end = datetime.datetime.now()
        Logger.log_info("hive query data time is {}".format((end - start).seconds))
        Logger.log_info(ret)
        start = datetime.datetime.now()
        for data in ret:
            linelist = [str(x).replace("None", "")[:200] for x in data]
            resultlist.append(linelist[:limitwide])

        end = datetime.datetime.now()
        Logger.log_info("hive return data time is {}".format((end - start).seconds))
        Logger.log_info(ret)

        return resultlist

    def hiveConnect(self, params_json):
        Logger.log_info("start hive")
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        password = params_json['ds_password']
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1", []
        HiveClient = self.getHiveClient()
        hiveCli = HiveClient(ip, user, password, database, port)
        Logger.log_info("show")
        sql = """SHOW TABLES"""
        ret = hiveCli.query(sql)
        count = len(ret)
        ret1 = [x[0] for x in ret]
        Logger.log_info(ret1)

        hiveCli.close()
        return count, ret1

    def transform_data(self, file_content, file_type):
        if file_type == 'json':
            preview_delimiter = '.'
            extrct_delimiter = '_'
            if "\r\n" in file_content:
                lines = file_content.split("\r\n")
            elif "\r" in file_content:
                lines = file_content.split("\r")
            elif "\n" in file_content:
                lines = file_content.split("\n")
            else:
                lines = [file_content]
            try:
                res = []
                property = []
                for i, line in enumerate(lines):
                    if not line:
                        continue
                    if len(res) > 100:
                        break
                    jsondata = json.loads(line)
                    out = {}
                    extract_items = []
                    for k, v in jsondata.items():
                        if isinstance(v, dict):
                            for k_1, v_1 in v.items():
                                if isinstance(v_1, dict):
                                    for k_2, v_2 in v_1.items():
                                        out[k + preview_delimiter + k_1 + preview_delimiter + k_2] = v_2
                                        extract_items.append(otl_util.is_special(k + extrct_delimiter + k_1 + extrct_delimiter + k_2))
                                else:
                                    out[k + preview_delimiter + k_1] = v_1
                                    extract_items.append(otl_util.is_special(k + extrct_delimiter + k_1))
                        else:
                            out[k] = v
                            extract_items.append(otl_util.is_special(k))
                    if i == 0:
                        res.append(list(out.keys()))
                        res.append(list(out.values()))
                        property = extract_items
                    else:
                        if res[0] != list(out.keys()):
                            obj = {}
                            obj['cause'] = _l('transform json file failed. ')
                            return 500, obj
                        res.append(list(out.values()))
                ret = {'content': res,
                       'property': property}
                return 200, ret
            except Exception as e:
                obj = {}
                obj['cause'] = _l('transform json file failed. ') + repr(e)
                return 500, obj

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


    def rewriteSql(self, sql, num):
        index = sql.lower().rfind(" limit ")
        if index != -1:
            new_sql = sql[:index].strip()
            limit = sql[index + 7:].strip().split(",")[-1]
            if limit[-1] == ';':
                limit = limit[:-1].strip()
            if int(limit) <= num:
                return sql
        else:
            new_sql = sql.strip()
        if new_sql[-1] == ';':
            new_sql = new_sql[:-1]
        new_sql += f" limit {num} "
        return new_sql

    def rewriteSqlserver(self, sql, num):
        sql_list = sql.split(' ')
        sql_list = [i for i in sql_list if i]
        for index, key_word in enumerate(sql_list):
            if key_word.lower() == 'top':
                if sql_list[index + 2].lower() == 'percent':
                    sql_list[index + 2] = ''
                    sql_list[index + 1] = str(num)
                else:
                    if int(sql_list[index + 1]) > num:
                        sql_list[index + 1] = str(num)
                return ' '.join(sql_list)
        return sql_list[0] + f' top {num} ' + ' '.join(sql_list[1:])

    @func_set_timeout(15)
    def mysql_sql_show_data(self, params_json):
        ip = params_json["ds_address"]
        port = params_json["ds_port"]
        database = params_json["ds_path"]
        user = params_json["ds_user"]
        data_num = params_json.get("data_num", 100)
        try:
            password = commonutil.DecryptBybase64(params_json["ds_password"])
        except Exception:
            return "-1"
        if params_json["connect_type"] == "odbc":
            cnxnstr = f'DRIVER=MySQL ODBC 8.0 Unicode Driver;SERVER={ip};PORT={port};DATABASE={database};UID={user};PWD={password};'
            conn = pyodbc.connect(cnxnstr, timeout=15)
            conn.timeout = 15
        else:
            conn = pymysql.connect(host=ip, port=int(port), user=user, password=password, database=database, charset="utf8",
                                   connect_timeout=10, read_timeout=15)
        cursor = conn.cursor()
        sql = params_json["sql"]
        new_sql = self.rewriteSql(sql, data_num)
        cursor.execute(new_sql)
        ret = cursor.fetchmany(data_num)
        description = cursor.description

        property = []
        column_names = []
        if params_json["connect_type"] == "odbc":
            for desc in description:
                prop = dict()
                column_names.append(desc[0])
                prop["column_name"] = desc[0]
                prop["field"] = otl_util.is_special(desc[0])
                column_type = str(desc[1]).split("'")[1]
                prop["type"] = self.type_desc_dict.get(column_type, "string")
                property.append(prop)
        else:
            for desc in description:
                prop = dict()
                column_names.append(desc[0])
                prop["column_name"] = desc[0]
                prop["field"] = otl_util.is_special(desc[0])
                type_code = desc[1]
                prop["type"] = self.mysql_desc_code.get(type_code, "string")
                property.append(prop)

        # 校验字段名是否有重复
        if params_json.get("check_repeat_field", True):
            set_column = set(column_names)
            if len(set_column) != len(column_names):
                return "-2"

        limitwide = len(column_names) if params_json.get("limitwide", 100) == -1 else 100
        content = [column_names[:limitwide]]
        for val in ret:
            content.append(list(val[:limitwide]))

        for i in range(len(content)):
            for j in range(len(content[i])):
                content[i][j] = str(content[i][j])[:200]
        res = {"property": property, "content": content}

        cursor.close()
        conn.close()
        return res

    @func_set_timeout(15)
    def hive_sql_show_data(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        data_num = params_json.get("data_num", 100)
        sql = params_json['sql']
        new_sql = self.rewriteSql(sql, data_num)
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        HiveClient = self.getHiveClient()
        hiveCli = HiveClient(ip, user, password, database, port)
        description, ret = hiveCli.query_many(new_sql, data_num)

        property = []
        column_names = []
        for desc in description:
            prop = dict()
            # 返回的结果可能带有表名，删除表名
            field = desc[0]
            field = field.split('.')[-1]
            column_names.append(field)
            prop["column_name"] = field
            prop["field"] = otl_util.is_special(field)
            field_type = desc[1].lower()
            if field_type in ['double', 'float', 'boolean', 'decimal', 'date', 'datetime']:
                prop["type"] = field_type
            elif field_type == 'int':
                prop["type"] = 'integer'
            else:
                prop["type"] = "string"
            property.append(prop)

        # 校验字段名是否有重复
        if params_json.get("check_repeat_field", True):
            set_column = set(column_names)
            if len(set_column) != len(column_names):
                return "-2"

        limitwide = len(column_names) if params_json.get("limitwide", 100) == -1 else 100
        resultlist = []
        resultlist.append(column_names[:limitwide])
        for data in ret:
            linelist = [str(x).replace("None", "")[:200] for x in data]
            resultlist.append(linelist[:limitwide])
        res = {"property": property, "content": resultlist}

        hiveCli.close()
        return res

    @func_set_timeout(15)
    def sqlserver_sql_show_data(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        data_num = params_json.get("data_num", 100)
        sql = params_json['sql']
        new_sql = self.rewriteSqlserver(sql, data_num)
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        cnxnstr = f'DRIVER=ODBC Driver 18 for SQL Server;SERVER={ip},{port};DATABASE={database};TrustServerCertificate=yes;UID={user};PWD={password};'
        conn = pyodbc.connect(cnxnstr, timeout=5)
        cursor = conn.cursor()
        cursor.execute(new_sql)
        ret = cursor.fetchmany(data_num)
        description = cursor.description

        property = []
        column_names = []
        for desc in description:
            prop = dict()
            column_names.append(desc[0])
            prop["column_name"] = desc[0]
            prop["field"] = otl_util.is_special(desc[0])
            column_type = str(desc[1]).split("'")[1]
            prop["type"] = self.type_desc_dict.get(column_type, "string")
            property.append(prop)

        # 校验字段名是否有重复
        if params_json.get("check_repeat_field", True):
            set_column = set(column_names)
            if len(set_column) != len(column_names):
                return "-2"

        limitwide = len(column_names) if params_json.get("limitwide", 100) == -1 else 100
        content = [column_names[:limitwide]]
        for val in ret:
            content.append(list(val[:limitwide]))

        for i in range(len(content)):
            for j in range(len(content[i])):
                content[i][j] = str(content[i][j])[:200]
        res = {"property": property, "content": content}

        cursor.close()
        conn.close()
        return res

    @func_set_timeout(15)
    def kingbasees_sql_show_data(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        connect_type = params_json['connect_type']
        data_num = params_json.get("data_num", 100)
        sql = params_json["sql"]
        new_sql = self.rewriteSql(sql, data_num)
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
        cursor.execute(new_sql)
        ret = cursor.fetchmany(data_num)
        description = cursor.description

        property = []
        column_names = []
        if connect_type == "odbc":
            for desc in description:
                prop = dict()
                column_names.append(desc[0])
                prop["column_name"] = desc[0]
                prop["field"] = otl_util.is_special(desc[0])
                column_type = str(desc[1]).split("'")[1]
                prop["type"] = self.type_desc_dict.get(column_type, "string")
                property.append(prop)
        else:
            for desc in description:
                prop = dict()
                name = desc.name
                type_code = desc.type_code
                column_names.append(name)
                prop["column_name"] = name
                prop["field"] = otl_util.is_special(name)
                prop["type"] = self.psycopg2_desc_code.get(type_code, "string")
                property.append(prop)

        # 校验字段名是否有重复
        if params_json.get("check_repeat_field", True):
            set_column = set(column_names)
            if len(set_column) != len(column_names):
                return "-2"

        limitwide = len(column_names) if params_json.get("limitwide", 100) == -1 else 100
        content = [column_names[:limitwide]]
        for val in ret:
            content.append(list(val[:limitwide]))

        for i in range(len(content)):
            for j in range(len(content[i])):
                content[i][j] = str(content[i][j])[:200]
        res = {"property": property, "content": content}

        cursor.close()
        conn.close()
        return res

    @func_set_timeout(15)
    def postgres_sql_show_data(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        data_num = params_json.get("data_num", 100)
        sql = params_json["sql"]
        new_sql = self.rewriteSql(sql, data_num)
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip, port=port, connect_timeout=10)
        cursor = conn.cursor()
        cursor.execute(new_sql)
        ret = cursor.fetchmany(data_num)
        description = cursor.description
        property = []
        column_names = []
        for desc in description:
            prop = dict()
            name = desc.name
            type_code = desc.type_code
            column_names.append(name)
            prop["column_name"] = name
            prop["field"] = otl_util.is_special(name)
            prop["type"] = self.psycopg2_desc_code.get(type_code, "string")
            property.append(prop)

        # 校验字段名是否有重复
        if params_json.get("check_repeat_field", True):
            set_column = set(column_names)
            if len(set_column) != len(column_names):
                return "-2"

        limitwide = len(column_names) if params_json.get("limitwide", 100) == -1 else 100
        content = [column_names[:limitwide]]
        for val in ret:
            content.append(list(val[:limitwide]))

        for i in range(len(content)):
            for j in range(len(content[i])):
                content[i][j] = str(content[i][j])[:200]
        res = {"property": property, "content": content}

        cursor.close()
        conn.close()
        return res

    @func_set_timeout(15)
    def clickhouse_sql_show_data(self, params_json):
        ip = params_json['ds_address']
        port = params_json['ds_port']
        database = params_json['ds_path']
        user = params_json['ds_user']
        data_num = params_json.get("data_num", 100)
        sql = params_json["sql"]
        new_sql = self.rewriteSql(sql, data_num)
        try:
            password = commonutil.DecryptBybase64(params_json['ds_password'])
        except Exception:
            return "-1"

        client = clickhouse_connect.get_client(host=ip, port=port, username=user, password=password,
                                               database=database, query_limit=data_num)
        result = client.query(new_sql, query_formats={'FixedString': 'string'})
        column_names = list(result.column_names)
        column_types = [column_type.base_type for column_type in result.column_types]
        property = []
        for i in range(len(column_names)):
            prop = dict()
            prop["column_name"] = column_names[i]
            prop["field"] = otl_util.is_special(column_names[i])
            prop["type"] = self.get_clickhouse_type(column_types[i])
            property.append(prop)

        # 校验字段名是否有重复
        if params_json.get("check_repeat_field", True):
            set_column = set(column_names)
            if len(set_column) != len(column_names):
                return "-2"

        limitwide = len(column_names) if params_json.get("limitwide", 100) == -1 else 100
        content = [column_names[:limitwide]]
        for val in result.result_set:
            content.append(list(val[:limitwide]))

        for i in range(len(content)):
            for j in range(len(content[i])):
                content[i][j] = re.sub('[\x00]*', "", str(content[i][j]))[:200]
        res = {"property": property, "content": content}
        return res

    @connect_execute_close_db
    def get_ontology(self, ontologyname, connection, cursor):
        sql = """
                 SELECT entity,edge FROM ontology_table WHERE ontology_name=%s;
                 """
        Logger.log_info(sql % ontologyname)
        cursor.execute(sql, [ontologyname])
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def insert_Ontology(self, params_json, cursor, connection):
        Logger.log_info("entry in save")
        values_list = []
        # userId = request.headers.get("userId")
        userId = ""
        values_list.append(userId)  # 用户
        values_list.append(userId)  # 用户
        values_list.append(params_json["ontology_name"])
        values_list.append(params_json.get("ontology_des", "").replace('"', '\"').replace("\\", "\\\\"))
        values_list.append(str(params_json.get("entity", [])))
        values_list.append(str(params_json.get("edge", [])))
        values_list.append(str(params_json.get('used_task', [])))
        values_list.append(str(params_json.get('all_task', [])))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(params_json.get("identify_id", None))
        values_list.append(params_json["knw_id"])
        values_list.append(str(params_json.get("domain", [])))
        values_list.append(str(params_json.get("otl_temp", [])))
        values_list.append(str(params_json.get('canvas', {})))
        Logger.log_info(values_list)

        sql = """INSERT INTO ontology_table (create_by, update_by, ontology_name, ontology_des, entity, edge,
                    used_task, all_task, create_time, update_time, identify_id, knw_id, `domain`, otl_temp, canvas)
                 VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        # after the ontology is added, add a subgraph whose name is 'ungrouped'
        if 'graph_id' in params_json.keys():
            value_list = []
            value_list.append(params_json.get('graph_id'))
            value_list.append(new_id)  # ontology_id
            value_list.append('ungrouped')  # name
            value_list.append('[]')  # entity
            value_list.append('[]')  # edge
            value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
            value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
            sql = '''INSERT INTO subgraph_config 
                                (graph_id, ontology_id, name, entity, edge, create_time, update_time)
                            VALUES 
                                (%s, %s, %s, %s, %s, %s, %s)'''
            Logger.log_info(sql % tuple(value_list))
            cursor.execute(sql, value_list)
        return new_id

    @connect_execute_commit_close_db
    def edit_ontology(self, params_json, connection, cursor):
        value_list = []
        value_list.append(params_json["ontology_name"])
        value_list.append(params_json.get("ontology_des", "").replace('"', '\"').replace("\\", "\\\\"))
        value_list.append(str(params_json.get("domain", [])))
        update_entity = ''
        if not params_json["otl_temp"]:
            # 正式保存
            value_list.append(str(params_json.get("entity", [])))
            value_list.append(str(params_json.get("edge", [])))
            update_entity = 'entity=%s, edge=%s,'
        value_list.append(str(params_json["otl_temp"]))
        value_list.append(str(params_json.get("used_task", [])))
        value_list.append(str(params_json.get("all_task", [])))
        # value_list.append(request.headers.get("userId"))
        value_list.append("")
        value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        value_list.append(str(params_json.get('canvas', {})))
        value_list.append(params_json["otl_id"])
        sql = """update ontology_table set ontology_name=%s, ontology_des=%s, `domain`=%s, {}
                 otl_temp=%s, used_task=%s, all_task=%s, update_by=%s, update_time=%s, canvas=%s
                 where id=%s;""".format(update_entity)
        Logger.log_info(sql % tuple(value_list))
        new_id = cursor.execute(sql, value_list)
        return new_id

    # lzg add
    @connect_execute_close_db
    def getCount(self, kgIds, connection, cursor, ):
        condition = " "
        if len(kgIds) > 0:
            condition = """ where id in ({})""".format(",".join(map(str, kgIds)))
        sql = """SELECT id FROM ontology_table """ + condition + """;"""
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return len(res)

    @connect_execute_close_db
    def getall(self, page, size, order, kgIds, connection, cursor):
        condition = " "
        if page == -2 and kgIds == "all":
            sql = """SELECT * FROM ontology_table """
            cursor.execute(sql)
            res = cursor.fetchall()
            return res
        if len(kgIds) > 0:
            condition = """ where o.id in ({}) """.format(",".join(map(str, kgIds)))
        if page == -2:
            sql = """SELECT
--                               a1.username AS create_user_name,
--                               a2.username AS update_user_name,
                           o.*
                    FROM ontology_table AS o
--                                 LEFT JOIN account a1 ON a1.account_id = o.create_by
--                                 LEFT JOIN account a2 ON a2.account_id = o.update_by
            """ + condition + """ order by o.create_time  Desc """
        else:
            sql = """SELECT
--                               a1.username AS create_user_name,
--                              a2.username AS update_user_name,
                           o.*
                    FROM ontology_table AS o
--                                 LEFT JOIN account a1 ON a1.account_id = o.create_by
--                                 LEFT JOIN account a2 ON a2.account_id = o.update_by
            """ + condition + """ order by o.create_time  Desc limit {0}, {1};"""
            if order == "descend":
                sql = """SELECT
--                                   a1.username AS create_user_name,
--                                   a2.username AS update_user_name,
                               o.*
                        FROM ontology_table AS o
--                                     LEFT JOIN account a1 ON a1.account_id = o.create_by
--                                     LEFT JOIN account a2 ON a2.account_id = o.update_by
                """ + condition + """ order by o.create_time asc limit {0}, {1} ;"""
            sql = sql.format(page * size, size)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def delete(self, name, connection, cursor, ):
        sql1 = """DELETE FROM ontology_table WHERE id in (%s);""" % (",".join([str(id) for id in name]))
        Logger.log_info(sql1)
        cursor.execute(sql1)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_close_db
    def getbyname(self, name, connection, cursor, ):
        sql = """SELECT * FROM ontology_table where ontology_name = %s"""
        Logger.log_info(sql % name)
        # sql = sql.format()
        cursor.execute(sql, name)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getbyids(self, ids, connection, cursor, ):
        sql = """SELECT * FROM ontology_table where id in (%s) """ % (",".join([str(id) for id in ids]))
        Logger.log_info(sql)

        # sql = sql.format()
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getbyid(self, name, connection, cursor, ):
        sql = """SELECT * FROM ontology_table where id = %s""" % (str(name))
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getCountbyname(self, otlname, kgIds, connection, cursor, ):
        condition = " "
        if len(kgIds) > 0:
            condition = """ id in ({}) AND """.format(",".join(map(str, kgIds)))
        sql = """
                 SELECT id FROM ontology_table  where """ + condition + """ ontology_name like %s;
                 """
        otlname = '%' + otlname + '%'
        Logger.log_info(sql % otlname)
        cursor.execute(sql, otlname)
        res = cursor.fetchall()
        return len(res)

    @connect_execute_close_db
    def getallbyname(self, otlname, page, size, order, kgIds, connection, cursor):
        condition = " "
        if len(kgIds) > 0:
            condition = """ o.id in ({}) AND """.format(",".join(map(str, kgIds)))
        # sql = """SELECT
        #                a1.username AS create_user_name,
        #                a2.username AS update_user_name,
        #                o.*
        #         FROM ontology_table AS o
        #                  LEFT JOIN account a1 ON a1.account_id = o.create_by
        #                  LEFT JOIN account a2 ON a2.account_id = o.update_by
        #          where """ + condition + """ o.ontology_name like %s
        #          order by o.create_time Desc
        #          limit %s, %s;"""
        sql = """SELECT
                       o.*
                FROM ontology_table AS o
                 where """ + condition + """ o.ontology_name like %s 
                 order by o.create_time Desc 
                 limit %s, %s;"""
        if order == "descend":
            # sql = """SELECT
            #                a1.username AS create_user_name,
            #                a2.username AS update_user_name,
            #                o.*
            #         FROM ontology_table AS o
            #                  LEFT JOIN account a1 ON a1.account_id = o.create_by
            #                  LEFT JOIN account a2 ON a2.account_id = o.update_by
            #      where """ + condition + """ o.ontology_name like %s
            #      order by o.create_time asc
            #      limit %s, %s;"""
            sql = """SELECT
                           o.*
                    FROM ontology_table AS o
                 where """ + condition + """ o.ontology_name like %s 
                 order by o.create_time asc 
                 limit %s, %s;"""
        otlname = '%' + otlname + '%'
        value_list = [otlname, page * size, size]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def update_name(self, otlid, params_json, connection, cursor):
        values_list = []
        # 只修改 用户名密码
        sql = """UPDATE ontology_table SET update_by=%s, update_time=%s , ontology_name=%s"""
        # userId = request.headers.get("userId")
        userId = ""
        values_list.append(userId)  # 用户
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(params_json["ontology_name"])
        if 'ontology_des' in params_json:
            values_list.append(params_json["ontology_des"])
            sql += ', ontology_des=%s'
        if 'domain' in params_json:
            values_list.append(str(params_json.get('domain', [])))
            sql += ', `domain`=%s'
        values_list.append(str(otlid))
        sql += ' where id = %s'

        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_close_db
    def getAllOtlId(self, connection, cursor):
        sql = """SELECT id FROM ontology_table"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def check_ontology_by_name(self, name, knw_id, connection, cursor):
        sql = """SELECT * FROM ontology_table where ontology_name = '{}' and knw_id={}""".format(name, knw_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        if len(res) > 0:
            return True
        else:
            return False

    @connect_execute_close_db
    def getOtlStatusbyid(self, otlid, connection, cursor, ):
        sql = """SELECT otl_status FROM ontology_table where id = %s""" % (str(otlid))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def update_info(self, otlid, params_json, graph_id, connection, cursor):
        '''更新本体信息，同时更新graph_confg_table中的step_num'''
        values_list = []
        # 只修改 用户名密码
        # userId = request.headers.get("userId")
        userId = ""
        values_list.append(userId)  # 用户
        values_list.append(params_json.get("update_time", arrow.now().format('YYYY-MM-DD HH:mm:ss')))
        values_list.append(str(params_json["entity"]))
        values_list.append(str(params_json["edge"]))
        values_list.append(str(params_json["used_task"]))
        values_list.append(str(params_json["all_task"]))
        values_list.append(str(params_json.get('canvas', {})))
        values_list.append(str(otlid))
        updateoradd = params_json.get("updateoradd", None)
        if graph_id:
            sql = f"select step_num from graph_config_table where id={graph_id}"
            Logger.log_info(sql)
            cursor.execute(sql)
            res = cursor.fetchall()
            step_raw = res[0]['step_num']
            step_num = 3 if updateoradd == "update_otl_info" else 2
            step_num = step_raw if step_num < step_raw else step_num
        sql = """UPDATE ontology_table SET update_by=%s, update_time=%s , entity=%s, edge=%s ,used_task=%s,all_task=%s,
                 canvas=%s
                 where id = %s"""

        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        if graph_id:
            sql = f"""UPDATE graph_config_table SET step_num={step_num} where id = {graph_id}"""
            Logger.log_info(sql)
            cursor.execute(sql)
        return new_id

    @connect_execute_close_db
    def getcountbystate(self, state, connection, cursor):
        sql = """SELECT * FROM ontology_table WHERE otl_status = '%s' """ % state
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return len(res)

    @connect_execute_close_db
    def getallbystate(self, page, size, order, state, connection, cursor):
        sql = """SELECT
                       a1.username AS create_user_name,
                       a2.username AS update_user_name,
                       o.*
                FROM ontology_table AS o
                         LEFT JOIN account a1 ON a1.account_id = o.create_by
                         LEFT JOIN account a2 ON a2.account_id = o.update_by
                where o.otl_status ={0}
                order by o.create_time Desc
                limit {1}, {2};"""
        if order == "descend":
            sql = """SELECT
                           a1.username AS create_user_name,
                           a2.username AS update_user_name,
                           o.*
                    FROM ontology_table AS o
                             LEFT JOIN account a1 ON a1.account_id = o.create_by
                             LEFT JOIN account a2 ON a2.account_id = o.update_by
                    where o.otl_status = {0}
                    order by o.create_time asc
                    limit {1}, {2};"""
        sql = sql.format("'" + state + "'", page * size, size)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getCountbynameandstate(self, name, state, connection, cursor):
        sql = """SELECT id
            FROM ontology_table
            where ontology_name like %s and otl_status = %s;"""
        value_list = ['%' + name + '%', state]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return len(res)

    @connect_execute_close_db
    def getallbynameandstate(self, name, page, size, order, state, connection, cursor):
        sql = """SELECT
                       a1.username AS create_user_name,
                       a2.username AS update_user_name,
                       o.*
                FROM ontology_table AS o
                         LEFT JOIN account a1 ON a1.account_id = o.create_by
                         LEFT JOIN account a2 ON a2.account_id = o.update_by
                where o.ontology_name like %s and o.otl_status = %s
                order by o.create_time Desc
                limit %s, %s;"""
        if order == "descend":
            sql = """SELECT
                           a1.username AS create_user_name,
                           a2.username AS update_user_name,
                           o.*
                    FROM ontology_table AS o
                             LEFT JOIN account a1 ON a1.account_id = o.create_by
                             LEFT JOIN account a2 ON a2.account_id = o.update_by
                    where o.ontology_name like %s and o.otl_status = %s
                    order by o.create_time asc
                    limit %s, %s;"""
        otlname = '%' + name + '%'
        value_list = [otlname, state, page * size, size]
        Logger.log_info(sql % value_list)
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def update_state(self, id, state, connection, cursor):
        values_list = []
        values_list.append(state)
        values_list.append(id)

        sql = """UPDATE ontology_table SET  otl_status=%s where id = %s"""
        cursor.execute(sql, values_list)
        Logger.log_info("update_otl: {}".format(sql % tuple(values_list)))
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        Logger.log_info(new_id)
        return new_id

    @connect_execute_close_db
    def getReviserByUuid(self, connection, cursor):
        sql = """SELECT * FROM account"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getallbystate(self, page, size, order, state, connection, cursor):
        sql = """SELECT * FROM ontology_table  where otl_status ={0}  order by create_time  Desc limit {1}, {2};"""
        if order == "descend":
            sql = """SELECT * FROM ontology_table  where otl_status = {0} order by create_time  asc limit {1}, {2};"""
        sql = sql.format("'" + state + "'", page * size, size)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getallbynameandstate(self, name, page, size, order, state, connection, cursor):
        sql = """
                    SELECT * FROM ontology_table where ontology_name like %s and otl_status = %s order by create_time Desc limit %s, %s;
                          """
        if order == "descend":
            sql = """
                     SELECT * FROM ontology_table where ontology_name like %s and otl_status = %s order by create_time asc limit %s, %s;
                           """
        otlname = '%' + name + '%'
        value_list = [otlname, state, page * size, size]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def insertCopyOtl(self, args, params_json, cursor, connection):
        Logger.log_info("entry in save")
        values_list = []
        # userId = request.headers.get("userId")
        userId = ""
        values_list.append(userId)  # create_by
        values_list.append(userId)  # update_by
        values_list.append(params_json.get("ontology_name"))
        values_list.append(params_json["ontology_des"])
        values_list.append(args.get("entity"))
        values_list.append(args.get("edge"))
        values_list.append([])
        values_list.append([])
        values_list.append(args.get("otl_status"))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))  # create_time
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))  # update_time
        values_list.append([])
        values_list = list(map(str, values_list))
        Logger.log_info(values_list)

        sql = """INSERT INTO ontology_table (create_by, update_by, ontology_name, ontology_des, entity,edge,used_task,all_task,otl_status,create_time, update_time, otl_temp) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_close_db
    def getOtlIdbyname(self, otl_name, connection, cursor):
        sql = """SELECT id FROM ontology_table WHERE ontology_name = %s """
        Logger.log_info(sql % otl_name)
        cursor.execute(sql, otl_name)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def check_otl_name(self, otl_name, knw_id, otl_id, connection, cursor):
        condition = f" and id != {otl_id}" if otl_id != -1 else ""
        sql = f"""select id from ontology_table where ontology_name='{otl_name}' and knw_id={knw_id}""" + condition
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_ids_in_ontology_library(self, otl_ids, knw_id, connection, cursor):
        otl_ids = ",".join(map(str, otl_ids))
        sql = f"""select id from ontology_table where identify_id is not null and knw_id={knw_id} and id in ({otl_ids})"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_count(self, params_json, connection, cursor):
        condition = ""
        otl_ids = params_json["otl_ids"]
        knw_id = params_json["knw_id"]
        search = params_json.get("search", "")
        filter = params_json.get("filter", "")
        # user_id = params_json.get('user_id')

        if len(otl_ids) > 0:
            condition += " and id in ({}) ".format(",".join(map(str, otl_ids)))
        if search:
            condition += f" and ontology_name like %s "
        if filter:
            condition += f" and otl_temp = '[]' "
        # sql = f"""select count(*) `count` from ontology_table
        #           where
        #             knw_id={knw_id}
        #             and identify_id is not null
        #             AND NOT (otl_temp != '[]' AND entity = '[]' AND create_by != %s) """ \
        #       + condition
        sql = f"""select count(*) `count` from ontology_table 
                  where 
                    knw_id={knw_id} 
                    and identify_id is not null 
                    AND NOT (otl_temp != '[]' AND entity = '[]' AND create_by is not null) """\
              + condition
        Logger.log_info(sql)
        if search:
            # cursor.execute(sql, [user_id, '%' + search + '%'])
            cursor.execute(sql, ['%' + search + '%'])
        else:
            # cursor.execute(sql, user_id)
            cursor.execute(sql)
        count = cursor.fetchone().get('count')
        return count

    @connect_execute_close_db
    def get_otls_list(self, params_json, connection, cursor):
        condition = ""
        otl_ids = params_json["otl_ids"]
        knw_id = params_json["knw_id"]
        page = params_json["page"]
        size = params_json["size"]
        rule = params_json["rule"]
        if rule == "name":
            rule = "ontology_name"
        elif rule == "create":
            rule = "create_time"
        else:
            rule = "update_time"
        order = params_json["order"]
        search = params_json.get("search", "")
        filter = params_json.get("filter", "")
        user_id = params_json.get('user_id')

        if len(otl_ids) > 0:
            condition += " and otl.id in ({}) ".format(",".join(map(str, otl_ids)))
        if search:
            condition += f" and ontology_name like %s "
        if filter:
            condition += f" and entity != '[]' "
        condition += f" order by {rule} {order} "
        if page != "-1":
            page = int(page) - 1
            size = int(size)
            condition += f" limit {page * size}, {size} "

        # sql = f"""select
        #             otl.id otl_id,
        #             otl.ontology_name,
        #             otl.ontology_des,
        #             otl.`domain`,
        #             otl.otl_temp,
        #             otl.entity,
        #             otl.edge,
        #             otl.create_time,
        #             otl.update_time,
        #             a1.username create_user_name,
        #             a2.username update_user_name
        #         from
        #             ontology_table otl
        #             left join account a1 on a1.account_id = otl.create_by
        #             left join account a2 on a2.account_id = otl.update_by
        #         where
        #             knw_id=%s
        #             and otl.identify_id is not null
        #             AND NOT (otl_temp != '[]' AND entity = '[]' AND create_by != %s) """ \
        #       + condition
        sql = f"""select
                    otl.id otl_id,
                    otl.ontology_name,
                    otl.ontology_des,
                    otl.`domain`,
                    otl.otl_temp,
                    otl.entity,
                    otl.edge,
                    otl.create_time,
                    otl.update_time
                from
                    ontology_table otl
                where
                    knw_id=%s 
                    and otl.identify_id is not null 
                    AND NOT (otl_temp != '[]' AND entity = '[]' AND create_by is not null) """ \
              + condition
        # value_list = [knw_id, user_id]
        value_list = [knw_id]
        Logger.log_info(sql)
        if search:
            value_list.append('%' + search + '%')
            cursor.execute(sql, value_list)
        else:
            cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res


otl_dao = OtlDao()

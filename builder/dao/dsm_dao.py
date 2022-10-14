# -*-coding:utf-8-*-
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db
import pymysql
import pandas as pd
import datetime
import json
from utils.DB import DB
import arrow
from utils.CommonUtil import commonutil
from utils.log_info import Logger
import time
import requests
from requests.auth import HTTPBasicAuth
from utils.common_response_status import CommonResponseStatus
from flask import request
import yaml
import pymysql
from third_party_service.anyshare.token import asToken


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
        conn = pymysql.connect(host=ip, port=int(port), user=user, password=password, database=database, charset="utf8",
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

    def getdatabyauth(self, ds_auth):
        from config.config import db_config_path
        with open(db_config_path, 'r') as f:
            yaml_config = yaml.load(f)
        mariadb_config = yaml_config['mariadb']
        host = mariadb_config.get('host')
        port = mariadb_config.get('port')
        user_name = mariadb_config.get('user')
        password = mariadb_config.get('password')
        database = mariadb_config.get('database')
        db = pymysql.connect(host=host, user=user_name, passwd=password, db=database, port=port, charset="utf8")
        cur = db.cursor(cursor=pymysql.cursors.DictCursor)
        sql = """SELECT * FROM author_token WHERE ds_auth=%s """
        sql = sql % ds_auth
        cur.execute(sql)
        data = cur.fetchall()
        data = pd.DataFrame(list(data))
        cur.close()
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

    def as7TestCon(self, params_json):
        """对AS7的数据源进行测试连接
        1. 测试access token是否可用
        2. 测试路径是否为文件夹"""
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret_v, obj_v = self.verify(params_json)
            if ret_v != CommonResponseStatus.SUCCESS.value:
                obj_v['message'] = "Anyshare 7 test connection fail"
                return ret_v, obj_v
            access_token = obj_v
            ds_address = params_json["ds_address"]
            ds_port = params_json["ds_port"]
            ds_path = params_json["ds_path"]
            ret_id, obj_id = commonutil.getdocidbypath(ds_address, ds_port, access_token, ds_path)
            if ret_id == CommonResponseStatus.SUCCESS.value:
                return ret_id, obj_id
            else:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = obj_id["cause"]
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "Anyshare 7 test connection fail"
                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "Anyshare 7 test connection fail"
            return ret_code, obj

    def verify(self, params_json):
        """测试AS7的access token是否可用"""
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        ds_auth = params_json["ds_auth"]
        data = self.getdatabyauth(ds_auth)
        if len(data) == 0:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj['cause'] = "ds_auth  %s not exist!" % ds_auth
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "Verify fail"
            return ret_code, obj
        else:
            refresh_token = data.loc[0, "refresh_token"]
            if not refresh_token:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "Verify token is empty"
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "Verify fail"
                return ret_code, obj
            else:
                print('开始获取AS token', __file__, 'verify')
                ret_code, acc_token = asToken.get_token(ds_auth)
                return ret_code, acc_token

    @connect_execute_commit_close_db
    def insertData(self, params_json, connection, cursor):
        """在data_source_table中新增数据源记录"""
        values_list = []
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(params_json["dsname"])
        values_list.append(params_json["dataType"])
        values_list.append(params_json["data_source"])
        ds_address = params_json["ds_address"]
        if params_json["data_source"] == "as" or params_json["data_source"] == "as7":
            if "https://" not in ds_address:
                ds_address = "https://" + str(ds_address)
        values_list.append(ds_address)
        values_list.append(params_json["ds_port"])
        ds_path = params_json["ds_path"]
        if params_json["data_source"] == "rabbitmq":
            ds_path = str(params_json["vhost"]) + "_" + str(params_json["queue"])
        values_list.append(ds_path)
        values_list.append(params_json["extract_type"])
        values_list.append(params_json["vhost"])
        values_list.append(params_json["queue"])
        values_list.append(params_json["json_schema"])
        values_list.append(params_json["knw_id"])

        if params_json["data_source"] != "as7":
            values_list.append(params_json["ds_user"])
            # values_list.append(commonutil.EncryptBybase64(params_json["ds_password"]))
            values_list.append(params_json["ds_password"])

            sql = """INSERT INTO data_source_table (create_time,update_time, dsname, dataType,
                   data_source,ds_address,ds_port,ds_path,extract_type,vhost, queue, json_schema, knw_id, ds_user,ds_password) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        else:
            values_list.append(params_json["ds_auth"])
            sql = """INSERT INTO data_source_table (create_time,update_time, dsname, dataType,
                               data_source,ds_address,ds_port,ds_path,extract_type,vhost, queue, json_schema, knw_id,ds_auth) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        cursor.execute(sql, values_list)
        Logger.log_info(sql)
        self.lastrowid = cursor.lastrowid
        new_id = self.lastrowid
        return new_id

    @connect_execute_close_db
    def getCountByKnwId(self, knw_id, connection, cursor, ):
        sql = ("""SELECT id FROM data_source_table WHERE knw_id=%s; """ % knw_id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return len(df)

    @connect_execute_close_db
    def getCount(self, graph_id, connection, cursor, ):
        sql = f"select graph_ds from graph_config_table where id={graph_id}"
        ds_df = pd.read_sql(sql, connection)
        ds_list = eval(ds_df.to_dict("list")["graph_ds"][0])
        if not ds_list:
            return 0
        ds_list = ','.join("{0}".format(x) for x in ds_list)
        limit_sql = f"where id in ({ds_list})"
        sql = f"""SELECT id FROM data_source_table {limit_sql}; """
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return len(df)

    @connect_execute_close_db
    def getCountstructured(self, connection, cursor, ):
        sql = """
                SELECT id FROM data_source_table where datatype = 'structured';
                """
        # sql = sql.format()
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)

        return len(df)

    @connect_execute_close_db
    def getbyids(self, ids, connection, cursor, ):
        sql = f"""SELECT * FROM data_source_table where id in (%s)""" % (",".join([str(id) for id in ids]))
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getbyids_order(self, ids, connection, cursor, ):

        sql = """SELECT * , (CASE WHEN HEX(dsname) REGEXP'^([46][1-9]|[357][0-9]|[46][a-f]|[57]a|e[4-9][0-9a-f]{4})+' THEN 0 ELSE 1 END) AS sort FROM data_source_table WHERE id IN (%s) AND dataType="structured" ORDER BY sort , CONVERT(dsname USING gbk)""" % (
            ",".join([str(id) for id in ids]))

        # sql = sql.format()
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    # def getdatabydsid(self,ds_id,connection, cursor):
    #     sql = """SELECT dataType,data_source,ds_address, FROM data_source_table where id = %s""" % (str(ds_id))
    #
    #     # sql = sql.format()
    #     df = pd.read_sql(sql, connection)
    #     return df

    @connect_execute_close_db
    def getdsbynames(self, ids, connection, cursor, ):

        sql = """SELECT * FROM data_source_table where dsname in (%s) """ % (
            ",".join(['"' + str(id) + '"' for id in ids]))
        Logger.log_info(sql)

        # sql = sql.format()
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getbyid(self, id, connection, cursor, ):

        sql = """SELECT id FROM data_source_table where id = %s""" % (id)

        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getbydsname(self, name, knw_id, connection, cursor, ):

        sql = """SELECT id FROM data_source_table where dsname = %s and knw_id=%s;""" % ("'" + name + "'", knw_id)

        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getdatabyid(self, id, connection, cursor, ):
        sql = """SELECT * FROM data_source_table where id = %s""" % ('"' + str(id) + '"')
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        # data=df.to_dict()
        return df

    @connect_execute_close_db
    def getCountbyname(self, dsname, knw_id, connection, cursor, ):
        sql = """SELECT id FROM data_source_table where knw_id={1} AND dsname collate utf8_general_ci like {0};"""
        dsname = '"%' + dsname + '%"'
        sql = sql.format(dsname, knw_id)
        Logger.log_info(sql)

        df = pd.read_sql(sql, connection)
        return len(df)

    @connect_execute_commit_close_db
    def delete(self, ids, connection, cursor, ):
        sql1 = """DELETE FROM data_source_table WHERE id in (%s);""" % (",".join([str(id) for id in ids]))
        cursor.execute(sql1)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_close_db
    def getall(self, page, size, order, limit_id, limit_type, connection, cursor):
        if page == -2:
            sql = """
                SELECT
                  *,
                  (
                    CASE
                      WHEN HEX(dsname) REGEXP "^([46][1-9]|[357][0-9]|[46][a-f]|[57]a|e[4-9][0-9a-f]{4})+" THEN 0
                      ELSE 1
                    END
                  ) AS sort
                FROM
                  data_source_table
                WHERE
                  dataType = "structured "
                ORDER BY
                  sort,
                  CONVERT(dsname USING gbk)"""
            df = pd.read_sql(sql, connection)
            Logger.log_info(sql)
            return df
        else:
            if limit_type == "knw":
                limit_sql = f"where knw_id={limit_id}"
            else:
                sql = f"select graph_ds from graph_config_table where id={limit_id}"
                ds_df = pd.read_sql(sql, connection)
                ds_list = eval(ds_df.to_dict("list")["graph_ds"][0])
                if not ds_list:
                    return pd.DataFrame()
                ds_list = ','.join("{0}".format(x) for x in ds_list)
                limit_sql = f"where id in ({ds_list})"
            if order == "descend":
                sql = f"""
                    SELECT *
                    FROM
                      data_source_table
                    {limit_sql}
                    order by
                      update_time asc
                    limit
                      {page * size}, {size};"""
            else:
                sql = f"""
                    SELECT *
                    FROM
                      data_source_table
                    {limit_sql}
                    order by
                      update_time Desc
                    limit
                      {page * size}, {size};"""
            Logger.log_info(sql)
            df = pd.read_sql(sql, connection)
            return df

    @connect_execute_close_db
    def getallbyname(self, dsname, page, size, order, knw_id, connection, cursor):
        sql = """
            SELECT *
            FROM
              data_source_table
            where
              knw_id = {3}
              AND dsname collate utf8_general_ci like {0}
            order by
              update_time Desc
            limit
              {1}, {2};"""
        if order == "descend":
            sql = """
                SELECT *
                FROM
                  data_source_table
                where
                  knw_id = {3}
                  AND dsname collate utf8_general_ci like {0}
                order by
                  update_time asc
                limit
                  {1}, {2};"""
        dsname = '"%' + dsname + '%"'
        sql = sql.format(dsname, page * size, size, knw_id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_commit_close_db
    def update(self, id, params_json, connection, cursor):
        """数据源编辑"""
        values_list = []
        # 只修改 用户名密码
        values_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        values_list.append(params_json["dsname"])
        values_list.append(params_json["dataType"])
        # values_list.append(params_json["ds_user"])
        values_list.append(params_json["data_source"])
        # values_list.append(params_json["ds_password"])  # 加密模块未调用，前端加密了
        ds_address = params_json["ds_address"]
        if params_json["data_source"] == "as" or params_json["data_source"] == "as7":
            if "https://" not in ds_address:
                ds_address = "https://" + str(ds_address)
        values_list.append(ds_address)
        values_list.append(str(params_json["ds_port"]))
        ds_path = params_json["ds_path"]
        if params_json["data_source"] == "rabbitmq":
            ds_path = str(params_json["vhost"]) + "_" + str(params_json["queue"])
        values_list.append(ds_path)
        values_list.append(params_json["extract_type"])

        if params_json["data_source"] != "as7":
            values_list.append(params_json["vhost"])
            values_list.append(params_json["queue"])
            values_list.append(params_json["json_schema"])
            values_list.append(params_json["ds_user"])
            # values_list.append(commonutil.EncryptBybase64(params_json["ds_password"]))
            values_list.append(params_json["ds_password"])
        else:
            values_list.append(params_json["ds_auth"])

        values_list.append(id)

        if params_json["data_source"] != "as7":
            sql = """
                UPDATE
                  data_source_table
                SET
                  update_time = %s,
                  dsname = %s,
                  dataType = %s,
                  data_source = %s,
                  ds_address = %s,
                  ds_port = %s,
                  ds_path = %s,
                  extract_type = %s,
                  vhost = %s,
                  queue = %s,
                  json_schema = %s,
                  ds_user = %s,
                  ds_password = %s
                where
                  id = %s """
        else:
            sql = """
                UPDATE
                  data_source_table
                SET
                  update_time = %s,
                  dsname = %s,
                  dataType = %s,
                  data_source = %s,
                  ds_address = %s,
                  ds_port = %s,
                  ds_path = %s,
                  extract_type = %s,
                  ds_auth = %s
                where
                  id = %s"""
        cursor.execute(sql, values_list)
        Logger.log_info(sql)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_close_db
    def getcode(self, code, connection, cursor):
        sql = "SELECT * FROM author_token WHERE " + "ds_code='" + code + "'"
        Logger.log_info(sql)
        # sql = sql%('"'+code+'"')
        df = pd.read_sql(sql, connection)
        # df=cursor.execute(sql)

        return df

    @connect_execute_commit_close_db
    def insert_token(self, value_json, connection, cursor):
        sql = """INSERT INTO author_token (ds_address,ds_port) VALUES(%s,%s)"""
        Logger.log_info(sql)
        cursor.execute(sql, value_json)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_commit_close_db
    def update_token(self, value_json, connection, cursor):

        sql = """UPDATE author_token SET ds_address=%s,ds_port=%s,redirect_uri=%s,client_id=%s, client_secret=%s, update_time="" where ds_auth = %s"""
        sql = sql % ('"' + value_json[0] + '"',
                     '"' + value_json[1] + '"',
                     '"' + value_json[2] + '"',
                     '"' + value_json[3] + '"',
                     '"' + value_json[4] + '"',
                     '"' + value_json[5] + '"',
                     )

        cursor.execute(sql)
        Logger.log_info(sql)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_commit_close_db
    def insert_refresh_token(self, flag, value_json, connection, cursor):
        if flag == "refresh":
            sql = """UPDATE author_token SET  refresh_token=%s,access_token=%s,update_time=%s where ds_auth = %s"""
            sql = sql % ('"' + value_json[0] + '"',
                         '"' + value_json[1] + '"',
                         '"' + arrow.now().format('YYYY-MM-DD HH:mm:ss') + '"',
                         '"' + value_json[2] + '"'
                         )
        if flag == "code":
            sql = """UPDATE author_token SET  refresh_token=%s,access_token=%s,ds_code=%s,update_time=%s where ds_auth = %s"""
            sql = sql % ('"' + value_json[0] + '"',
                         '"' + value_json[1] + '"',
                         '"' + value_json[2] + '"',
                         '"' + arrow.now().format('YYYY-MM-DD HH:mm:ss') + '"',
                         '"' + value_json[3] + '"'
                         )
        Logger.log_info(sql)
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_close_db
    def getdsbyid(self, connection, cursor):
        sql = """
            SELECT * FROM data_source_table
            order by update_time"""
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getCounts1(self, connection, cursor):
        sql = """SELECT id FROM data_source_table;"""
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return len(df)

    @connect_execute_close_db
    def getbydsnameId(self, name, dsid, connection, cursor, ):

        sql = """SELECT id FROM data_source_table where dsname = %s and id != %s and knw_id=(select knw_id from data_source_table d where id = %s);""" % (
            "'" + name + "'", dsid, dsid)

        # sql = sql.format()
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def getrabbitdsbyid(self, id, connection, cursor, ):

        sql = """SELECT * FROM data_source_table where id = %s AND data_source='rabbitmq' """ % (id)

        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        return df


dsm_dao = DsmDao()

# -*- coding:utf-8 -*-
import hashlib
import json
import logging
import math
import multiprocessing
import os
import pprint
import random
import re
import sys
import threading
import time
import traceback
from functools import partial

import requests
import yaml
from circuitbreaker import circuit, CircuitBreakerError
from flask_babel import gettext as _l
from nebula3.Config import Config as NebulaConfig
from nebula3.gclient.net import ConnectionPool
from requests.auth import HTTPBasicAuth

import common.stand_log as log_oper
from common.errorcode import codes
from common.errorcode.gview import Gview as Gview2
from common.exception.base import ExceptLevel
from common.exception.graphdb_exception import GraphDBException
from utils.log_info import Logger
from utils.util import GetGraphDbOsInfo

requests.packages.urllib3.disable_warnings()

# index_len = os.getenv("INDEXLEN")  # nebula索引长度 
index_len = 15

vector_url = os.getenv('VECTOR_URL')
if not vector_url or vector_url == 'None':
    Logger.log_info("请配置向量服务")
    vector_url = ""


def get_md5(data):
    if isinstance(data, str):
        data = data.encode("utf-8")
    md = hashlib.md5()
    md.update(data)
    return md.hexdigest()


def type_transform(db_type, value, type, sql_format=True):
    if sql_format:
        if type == "string":
            value = "'" + str(value) + "'"
        if type == "date":
            if db_type == "nebulaGraph":
                if '/' in value:
                    value = value.replace('/', '-')
                value = ' date("{}") '.format(value)
            elif db_type == 'orientDB':
                value = "'" + str(value) + "'"
        if type == "datetime":
            if db_type == "nebulaGraph":
                if '/' in value:
                    value = value.replace('/', '-')
                value = ' datetime("{}") '.format(value)
            elif db_type == 'orientDB':
                value = "'" + str(value) + "'"
        if type == 'boolean':
            if value.lower() not in ['true', 'false']:
                try:
                    value = str(bool(eval(value)))
                except Exception:
                    value = default_value(db_type, type)
    return str(value)


def gen_doc_vid(merge_entity_list, entity_name, one_data, entity_otl, gtype='nebulaGraph') -> str:
    """
    计算图数据库点的vid, 兼容nebula和orientdb

    参数
        merge_entity_list: 融合属性列表
            demo: {"t_stock_percent_wide": ["name"]}
                t_stock_percent_wide： 抽取对象实体名
                name: 融合属性（抽取对象属性）
        entity_name: 抽取实体名
        one_data: 一个实体数据
        entity_otl: {抽取对象名称: 实体类名}
        gtype: 图数据库的名称，默认nebula

    返回
        vid: 字符串
  """
    tab_val_index = []  # 属性列表
    for k in merge_entity_list[entity_name]:
        if k not in one_data:
            return None
        value = normalize_text(str(one_data[k]))
        if gtype == "orientDB":
            value = "  `{}` = '{}' ".format(k, normalize_text(str(one_data[k])))
        tab_val_index.append(value)

    if gtype == "orientDB":
        return 'SELECT FROM `{}` WHERE {}'.format(entity_otl[entity_name], ','.join(tab_val_index))

    props_str = entity_otl[entity_name] + '_'
    for m in tab_val_index:
        props_str += f'{m}_'
    return get_md5(props_str)


def data_type_transform(data_type: str):
    '''默认数据类型以orientdb为基础，部分数据类型需要兼容nebula，在此进行转换'''
    mapping = {'boolean': 'bool', 'decimal': 'double', 'integer': 'int', "float": "double"}
    if data_type.lower() not in mapping:
        return data_type
    return mapping[data_type.lower()]


def default_value(db_type='nebula', type='other', sql_format=True):
    '''
    当数据为空时插入图数据库或者opensearch的默认值
    Args:
        db_type: 图数据库类型 nebula or orientdb
        type: 数据类型
        sql_format: False: opensearch使用
    '''
    if not sql_format:
        return ""
    if type == 'string':
        return '""'  # 如果为NULL，engine搜索会报错
    return "NULL"


def value_transfer(value, db_type, type):
    if not value:
        return default_value(db_type, type)
    return type_transform(db_type, normalize_text(str(value)), type)


def normalize_text(text):
    text = text.replace("\\", "\\\\")
    text = text.replace("\n", "\\n")
    text = text.replace("\t", "\\t")
    text = re.sub(r"[\"]", "\\\"", text)
    text = re.sub(r"[\']", "\\\'", text).strip()
    return text


def normalize_text_es(text):
    text = re.sub(r"[\n\t]", " ", text)
    text = text.replace("\\", "\\\\").strip()
    return text


class GraphDB(object):
    def __init__(self):
        self.address = GetGraphDbOsInfo.graphdb_host
        self.port = GetGraphDbOsInfo.graphdb_port
        self.username = GetGraphDbOsInfo.graphdb_user
        self.password = GetGraphDbOsInfo.graphdb_password
        self.type = GetGraphDbOsInfo.graphdb_type
        if self.type == 'nebulaGraph':
            self.address = GetGraphDbOsInfo.graphdb_host.split(",")
            self.esaddress = GetGraphDbOsInfo.opensearch_ip
            self.esport = GetGraphDbOsInfo.opensearch_port
            self.esusername = GetGraphDbOsInfo.opensearch_user
            self.espassword = GetGraphDbOsInfo.opensearch_passwd
        self.nebula_pool = False
        self.state = {}

    def start_connect_pool(self):
        """
        添加链接池
        """
        while len(self.address) > 0:
            if self.nebula_pool:
                return
            try:
                # nebula数据地址和端口组成的列表，例：[('10.4.131.25', 9669), ('10.4.131.18', 9669), ('10.4.133.125', 9669)]
                host = [(add, self.port) for add in self.address]
                config = NebulaConfig()
                config.max_connection_pool_size = 50
                connection_pool = ConnectionPool()
                connection_pool.init(host, config)
                self.connection_pool = connection_pool
                self.nebula_pool = True
            except Exception as e:
                err = str(e)
                # 节点挂掉时去除此节点并重试
                if "status: BAD" in err:
                    address = re.findall(r"[\[](.*?)[\]]", err)
                    for add in address:
                        if "status: BAD" in add:
                            bad_address = re.findall(r"[(](.*?)[)]", add)[0]
                            bad_address = eval(bad_address.split(',')[0])
                            lock = threading.Lock()
                            lock.acquire()
                            try:
                                if bad_address in self.address:
                                    self.address.remove(bad_address)
                            finally:
                                lock.release()
                else:
                    raise e
        raise Exception(_l("Nebula has some error."))

    def exec(self, sql, db):
        if self.type == 'orientDB':
            return self._orientdb_http(sql, db)
        elif self.type == 'nebulaGraph':
            return self._nebula_exec(ngql=sql, db=db)

    def exec_batch(self, sql, db):
        if self.type == 'orientDB':
            return self._orientdb_batch_http(sql, db)
        elif self.type == 'nebulaGraph':
            return self._nebula_session_exec_(sql, db)

    def get_list(self):
        '''
            获取数据库列表
        Returns:
            code
            error message or list result
        '''
        if self.type == 'orientDB':
            try:
                url_listdatabase = "http://{}:{}/listDatabases".format(self.address, self.port)
                databases = requests.get(url=url_listdatabase, timeout=30)
                if databases.status_code != 200:
                    message = "获取orientdb列表错误：{}".format(databases.json())
                    error_log = log_oper.get_error_log(message, sys._getframe())
                    Logger.log_error(error_log)
                    return 500, message
                databaselist = databases.json()["databases"]
                return 200, databaselist
            except Exception as e:
                message = "获取orientdb列表错误：{}".format(repr(e))
                error_log = log_oper.get_error_log(message, sys._getframe(),
                                                   traceback.format_exc())
                Logger.log_error(error_log)
                return 500, message
        elif self.type == 'nebulaGraph':
            ngql = 'SHOW SPACES'
            code, res = self._nebula_exec(ngql=ngql)
            if code != 200 or not res.is_succeeded():
                message = "获取nebula列表错误：{}".format(repr(res.error_msg()))
                error_log = log_oper.get_error_log(message, sys._getframe())
                Logger.log_error(error_log)
                return 500, message
            else:
                size = res.row_size()
                databaselist = [''] * size
                for i in range(size):
                    databaselist[i] = res.row_values(i)[0].as_string()
                return 200, databaselist

    def check_db(self, dbname):
        '''
            检查数据库是否已存在，不存在则新建
        '''
        code, databaselist = self.get_list()
        if self.type == 'orientDB':
            if code != 200:
                self.state = {'state': 'FAILURE',
                              'meta': {'cause': databaselist,
                                       'message': "graph_InfoExt failed"}}
                Logger.log_error(str(self.state))
                return 500, self.state
            else:
                self._check_orientdb(dbname, databaselist)
                return 200, {}
        elif self.type == 'nebulaGraph':
            if not re.match(r'^[a-zA-Z][a-zA-Z0-9-]*$', dbname):
                self.state = {'state': 'FAILURE',
                              'meta': {
                                  'cause': "dbname must start with a letter and consist of letters, numbers. "
                                           "current dbname: {}".format(dbname),
                                  'message': "graph_InfoExt failed"}}
                Logger.log_error(str(self.state))
                return 500, self.state
            if code != 200:
                self.state = {'state': 'FAILURE',
                              'meta': {'cause': databaselist,
                                       'message': "graph_InfoExt failed"}}
                Logger.log_error(str(self.state))
                return 500, self.state
            else:
                if dbname not in databaselist:
                    return self._create_db_nebula(dbname)
                return 200, {}

    def _orientdb_batch_http(self, sql, db):
        """
            orientdb批量执行sql语句
        """
        orient_url = "http://{}:{}/batch/{}".format(self.address, self.port, db)
        body = {
            "transaction": False,
            "operations": [
                {
                    "type": "script",
                    "language": "sql",
                    "script": sql
                }
            ]
        }
        headers = {"Connection": "close"}
        retry_count = 3
        request_mvcc = 0
        request_num = 0
        # 重试3次
        for _ in range(retry_count):
            try:
                or_res = requests.post(url=orient_url, headers=headers, json=body,
                                       auth=HTTPBasicAuth(self.username, self.password))
                if or_res.status_code == 200:
                    return or_res.status_code, or_res.json()
                else:
                    if or_res.status_code == 500:
                        break
                    if or_res.status_code == 409:
                        request_mvcc += 1
                        if request_mvcc >= retry_count:
                            Logger.log_error(f'mvcc error cause data loss')
                    else:
                        request_num += 1
                        if request_num >= retry_count:
                            Logger.log_error(f'write orientdb status:{or_res.status_code} error:{or_res.json()}')
                    continue
            except Exception as e:
                Logger.log_error(f'write orientdb error:{str(e)},sleep 5s,start retry')
                time.sleep(5)
        self.state = {"state": "FAILURE",
                      "meta": {'cause': "orientdb batch exec failed",
                               'message': "orientdb batch exec failed"}
                      }
        return 500, {}

    def _orientdb_http(self, sql, db):
        """
            orientdb执行sql语句
        Returns:
            code:成功为200
            message:执行结果
        """
        orient_url = "http://{}:{}/command/{}/sql".format(self.address, self.port, db)
        sql = re.sub('[\r|\n]*', "", sql)
        body = {"command": sql}
        headers = {"Connection": "close"}
        state_code = 200
        resmessage = {}

        # 重试3次
        for _ in range(3):
            try:
                or_res = requests.post(url=orient_url, headers=headers, json=body,
                                       auth=HTTPBasicAuth(self.username, self.password))
                if or_res.status_code == 500:
                    state_code = or_res.status_code
                    resmessage = or_res.json()
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': "orientdb exec failed",
                                           'message': resmessage}
                                  }
                    Logger.log_error(sql)
                    Logger.log_error(or_res.json())
                    break
            except Exception as e:
                self.state = {"state": "FAILURE",
                              "meta": {'cause': "orientdb exec failed",
                                       'message': "orientdb exec failed"}
                              }
                Logger.log_error(f'run orientdb sql error:{str(e)},sleep 5s retry')
                time.sleep(5)
                state_code = 500
                resmessage = self.state
            else:
                if or_res.status_code != 200:
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': "orientdb exec failed",
                                           'message': "orientdb exec failed"}
                                  }
                    Logger.log_error(sql)
                    Logger.log_error(or_res.json())
                return or_res.status_code, or_res.json()
        return state_code, resmessage

    def close_nebula_conn(self):
        if self.type == 'nebulaGraph':
            try:
                self.connection_pool.close()
                self.nebula_pool = False
            except Exception:
                pass

    def _nebula_session_exec_(self, ngql, db=None):
        self.start_connect_pool()
        logging.getLogger().setLevel(logging.WARNING)
        # lock=threading.Lock()
        # lock.acquire()
        session = self.connection_pool.get_session(self.username, self.password)
        retry_num = 3
        state_code = 200
        res = {}
        while retry_num > 0:
            retry_num -= 1
            try:
                if db:
                    res = session.execute('USE `{}`'.format(db))
                    if not res.is_succeeded():
                        self.state = {"state": "FAILURE",
                                      "meta": {'cause': res.error_msg(),
                                               'message': "nebula use db {} failed".format(db)}
                                      }
                        Logger.log_error(ngql)
                        Logger.log_error(res.error_msg())
                        state_code = 500
                if ngql:
                    ngql = re.sub('[\r\n]*', "", ngql)
                    res = session.execute(ngql)
                    if not res.is_succeeded():
                        self.state = {"state": "FAILURE",
                                      "meta": {'cause': res.error_msg(),
                                               'message': "nebula exec ngql failed: {}".format(ngql)}
                                      }
                        Logger.log_error(ngql)
                        Logger.log_error(res.error_msg())
                        state_code = 500
            except Exception as e:
                self.state = {"state": "FAILURE",
                              "meta": {'cause': repr(e),
                                       'message': "nebula exec failed"}
                              }
                Logger.log_error(f"nebula_exec error:{str(e)},sleeping 5s retry")
                time.sleep(5)
            else:
                break
            finally:
                session.release()
                # lock.release()
        return state_code, res

    def _nebula_exec(self, ngql, db=None, retry=True):
        '''
            nebula执行ngql语句
        Returns:
            code: 成功则返回200,失败返回500
            res: 执行结果
        '''
        retry_num = 3 if retry else 1
        state_code = 200
        res = {}
        while retry_num > 0:
            retry_num -= 1
            try:
                self.start_connect_pool()
                connection_pool = self.connection_pool
                logging.getLogger().setLevel(logging.WARNING)
                session = connection_pool.get_session(self.username, self.password)
                if db:
                    res = session.execute('USE `{}`'.format(db))
                    if not res.is_succeeded():
                        self.state = {"state": "FAILURE",
                                      "meta": {'cause': res.error_msg(),
                                               'message': "nebula use db {} failed".format(db)}
                                      }
                        Logger.log_error(ngql)
                        Logger.log_error(res.error_msg())
                        state_code = 500
                        return state_code, res
                if ngql:
                    ngql = re.sub('[\r\n]*', "", ngql)
                    res = session.execute(ngql)
                    if not res.is_succeeded():
                        self.state = {"state": "FAILURE",
                                      "meta": {'cause': res.error_msg(),
                                               'message': "nebula exec ngql failed: {}".format(ngql)}
                                      }
                        Logger.log_error(ngql)
                        if "VALUES \n" in ngql and ngql.split("VALUES \n")[1] == "":
                            Logger.log_error("value is empty")
                        else:
                            Logger.log_error(res.error_msg())
                        state_code = 500
                session.release()
                self.close_nebula_conn()
            except Exception as e:
                state_code = 500
                self.state = {"state": "FAILURE",
                              "meta": {'cause': repr(e),
                                       'message': "nebula exec failed"}
                              }

                class errTmp(object):
                    def __init__(self, err):
                        self.err = err

                    def error_msg(self):
                        return _l("Nebula Internal Server Error")

                    def is_succeeded(self):
                        return False

                res = errTmp(e)
                if retry_num > 0:
                    Logger.log_error(f"nebula_exec error:{str(e)},sleeping 2s retry")
                    time.sleep(2)
            else:
                break
        return state_code, res

    def _check_orientdb(self, dbname, db_list):
        """
        检查orientdb数据库是否存在，不存在则新建
        Args：
            dbname：orientdb数据库名称
            ds_list：orientdb数据库名称列表
        """
        if dbname not in db_list:
            # 获取该orientdb的数据库信息
            url = 'http://' + self.address + ':' + str(self.port) + '/database/' + dbname
            r = requests.get(url, auth=(self.username, self.password), timeout=30)
            if r.status_code != 200:
                # 新建orientdb数据库
                r = requests.post(
                    'http://' + self.address + ':' + str(self.port) + '/database/' + dbname + '/plocal',
                    auth=(self.username, self.password))
                if r.status_code != 200:
                    # orientDB 库被删了
                    if r.status_code == 500 and r.text.find("NoSuchFileException"):
                        self.state = {"state": "FAILURE",
                                      "meta": {'cause': "the databases does not exist",
                                               'message': "graph_InfoExt failed"}
                                      }
                        Logger.log_error(str(self.state))
                    else:
                        self.state = {"state": "FAILURE",
                                      "meta": {'cause': str(r.text),
                                               'message': "graph_InfoExt failed0"}
                                      }
                        Logger.log_error(str(self.state))
        else:  # 验证能不能建库
            r_exist = requests.post(
                'http://' + self.address + ':' + str(self.port) + '/database/' + "le0c1g2m0ofbst" + '/plocal',
                auth=(self.username, self.password))
            if r_exist.status_code != 200:
                requests.delete(
                    'http://' + self.address + ':' + str(self.port) + '/database/' + "le0c1g2m0ofbst" + '/plocal',
                    auth=(self.username, self.password))
                # orientDB 库被删了
                if r_exist.status_code == 500 and r_exist.text.find("NoSuchFileException"):
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': "the databases does not exist",
                                           'message': "graph_InfoExt failed"}
                                  }
                    Logger.log_error(str(self.state))
                else:
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': "the databases error",
                                           'message': "graph_InfoExt failed"}
                                  }
                    Logger.log_error(str(self.state))
            else:
                requests.delete(
                    'http://' + self.address + ':' + str(self.port) + '/database/' + "le0c1g2m0ofbst" + '/plocal',
                    auth=(self.username, self.password))

    def test_nebula_conn(self):
        try:
            self.start_connect_pool()
        except Exception as e:
            return False, str(e)
        return True, ""

    def _create_db_nebula(self, db):
        '''
            nebula创建数据库
        '''
        ngql = 'CREATE SPACE `{}` (partition_num = 30,replica_factor = 1,vid_type = FIXED_STRING(32))'.format(db)
        code, res = self._nebula_exec(ngql=ngql)
        if code != 200 or not res.is_succeeded():
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': res.error_msg(),
                                   'message': 'graph_InfoExt failed'}}
            Logger.log_error(str(self.state))
            return code, res
        read_only_user_name = os.getenv('GRAPHDB_READ_ONLY_USER')
        return self._grant_role_guest(db, read_only_user_name)

    def _grant_role_guest(self, db, user_name):
        """
        nebula对指定用户添加图空间只读权限
        Args:
            db: 图空间名
            user_name: 用户名
        """
        code, res = self._check_db_nebula(db)
        if code != 200:
            return code, res
        code, res = self._nebula_exec('show users')
        if code != 200 or not res.is_succeeded():
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': res.error_msg(),
                                   'message': 'get nebula users failed'}}
            Logger.log_error(str(self.state))
            return code, res
        name_exist = False
        for i in range(res.row_size()):
            if res.row_values(i)[0].as_string() == user_name:
                name_exist = True
                break
        if not name_exist:
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': 'nebula does not have user {}'.format(user_name),
                                   'message': 'grant role guest on {} to user {} failed'.format(db, user_name)}}
            Logger.log_error(str(self.state))
            return 500, self.state
        code, res = self._nebula_exec('GRANT ROLE GUEST ON `{}` TO {}'.format(db, user_name))
        if code != 200 or not res.is_succeeded():
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': res.error_msg(),
                                   'message': 'grant role guest on {} to user {} failed'.format(db, user_name)}}
            Logger.log_error(str(self.state))
            return 500, res
        return 200, {}

    def _check_db_nebula(self, db):
        # 检查nebula数据库是否存在, 不存在则等待
        HEARTBEAT = 10  # 一个心跳周期
        code, res = self._nebula_exec('', db, retry=False)
        if code != 200:
            if not res.is_succeeded() and 'SpaceNotFound' in res.error_msg():
                Logger.log_info('creating nebula space {}... please wait'.format(db))
                time.sleep(2 * HEARTBEAT)
                databases_code, databases = self.get_list()
                if databases_code != 200:
                    return 500, databases
                if db not in databases:
                    self.state = {'state': 'FAILURE',
                                  'meta': {'cause': 'nebula database "{}" does not exist.'.format(db),
                                           'message': 'nebula database "{}" does not exist.'.format(db)}}
                    Logger.log_error(str(self.state))
                    return code, res
            else:
                self.state = {'state': 'FAILURE',
                              'meta': {'cause': 'nebula error: {}'.format(res.error_msg()),
                                       'message': 'nebula error: {}'.format(res.error_msg())}}
                return 500, 'nebula错误'
        return 200, {}

    def get_present_index(self, db):
        '''获取图数据库中已存在的索引信息

        Return:
            code: 成功则返回200
            res: 成功则返回：
                present_index_field: 全文索引关联的属性，例：{"document": ["name", "path"]}
                present_index_name: 全文索引名称，每个类只有一项全文索引，
                    例: orientdb: {"document": "document_fulltext"}
                        nebula: {"document": "spacename_document"}
                present_index_field_unique: 唯一索引关联的属性
                present_index_name_unique: 唯一索引名称
        '''
        if self.type == 'orientDB':
            return self._get_present_index_orientdb(db)
        elif self.type == 'nebulaGraph':
            return self._get_present_index_nebula(db)

    def _get_present_index_orientdb(self, db):
        """获取orientdb中已存在的索引信息
        """
        index_query = "select expand(indexes) from metadata:indexmanager"
        code, re_index = self._orientdb_http(index_query, db)
        if code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': str(re_index),
                                   'message': "orientdb get present index failed"}
                          }
            return code, re_index
        present_index_field = {}
        present_index_name = {}
        present_index_field_unique = {}
        present_index_name_unique = {}
        if "result" in re_index.keys():
            index = re_index["result"]
            for object in index:
                if object["type"] == "FULLTEXT":
                    index_name = object["name"]
                    classname = object["indexDefinition"]["className"]
                    present_index_name[classname.lower()] = index_name
                    if len(object["indexDefinition"]) == 4:  # 多个属性
                        indexDefinitions = object["indexDefinition"]["indexDefinitions"]
                        properties = []
                        for j in indexDefinitions:
                            field = j["field"]
                            properties.append(field)
                        present_index_field[classname.lower()] = properties
                    else:
                        present_index_field[classname.lower()] = [object["indexDefinition"]["field"]]  # 单个属性也返回列表
                elif object["type"] == "UNIQUE_HASH_INDEX":
                    index_name = object["name"]
                    classname = object["indexDefinition"]["className"]
                    present_index_name_unique[classname] = index_name
                    if len(object["indexDefinition"]) == 4:  # 多个属性
                        indexDefinitions = object["indexDefinition"]["indexDefinitions"]
                        properties = []
                        for j in indexDefinitions:
                            field = j["field"]
                            properties.append(field)
                        present_index_field_unique[classname] = properties
                    else:
                        present_index_field_unique[classname] = [object["indexDefinition"]["field"]]  # 单个属性也返回列表
        return 200, (present_index_field, present_index_name, present_index_field_unique, present_index_name_unique)

    def _get_present_index_nebula(self, db):
        '''获取nebula中已存在的索引信息
        '''
        code, res = self._check_db_nebula(db)
        if code != 200:
            return code, res
        present_index_field = {}
        present_index_name = {}
        present_index_field_unique = {}
        present_index_name_unique = {}
        # es全文索引
        url = 'http://' + self.esaddress + ':' + str(self.esport) + '/' + db + '*'
        retry_num = 0
        while retry_num <= 3:
            try:
                response = requests.get(url=url, auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
                if response.status_code != 200:
                    if response.status_code == 429:
                        retry_num += 1
                        Logger.log_error("get elasticsearch index failed,Pause for five second and try again")
                        time.sleep(5)
                        continue
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': response.content,
                                           'message': "get elasticsearch index failed"}
                                  }
                    Logger.log_error(str(self.state))
                    return response.status_code, response.json()
                else:
                    if retry_num > 1:
                        Logger.log_info(f"get elasticsearch index retry sucess,retry num:{retry_num}")
                    res = response.json()
                    if len(res) == 0:
                        Logger.log_info('dbname {} does not have fulltextindex.'.format(db))
                    for index in res:
                        entity_name = index[len(db) + 1:]
                        if len(res[index]['mappings']) > 0:
                            present_index_field[entity_name] = list(res[index]['mappings']['properties'].keys())
                        else:
                            present_index_field[entity_name] = []
                        present_index_name[entity_name] = index
                break
            except Exception as e:
                if retry_num == 3:
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': str(e),
                                           'message': "get elasticsearch index failed"}
                                  }
                    return 500, f"send es request exception:{str(e)}"
                retry_num += 1
                Logger.log_error(f"send es request exception:{str(e)},sleeping 5s")
                time.sleep(5)
        # 原生索引
        code, tag_indexes = self._nebula_exec(ngql='SHOW TAG INDEXES', db=db, retry=False)
        if code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': tag_indexes.error_msg(),
                                   'message': "get nebula tag index failed"}
                          }
            Logger.log_error(str(self.state))
            return code, tag_indexes
        if tag_indexes.row_size() > 0:
            for name, vertex_name, fields in tag_indexes:
                vertex_name = vertex_name.as_string()
                present_index_field_unique[vertex_name] = []
                for field in fields.as_list():
                    present_index_field_unique[vertex_name].append(field.as_string())
                present_index_name_unique[vertex_name] = name.as_string()
        code, edge_indexes = self._nebula_exec(ngql='SHOW EDGE INDEXES', db=db, retry=False)
        if code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': tag_indexes.error_msg(),
                                   'message': "get nebula edge index failed"}
                          }
            Logger.log_error(str(self.state))
            return code, edge_indexes
        if edge_indexes.row_size() > 0:
            for name, edge_name, fields in edge_indexes:
                edge_name = edge_name.as_string()
                present_index_field_unique[edge_name] = []
                for field in fields.as_list():
                    present_index_field_unique[edge_name].append(field.as_string())
                present_index_name_unique[edge_name] = name.as_string()
        return 200, (present_index_field, present_index_name, present_index_field_unique, present_index_name_unique)

    def get_properties(self, db, otl_type, name):
        '''获取点/边的属性信息

        Args:
            db: 图数据库名
            otl_type: entity/edge
            name: 点/边名

        Returns:
            code: 返回码，正确返回： 200
            data: {属性名: 属性类型}, name不存在则返回{}
        '''
        if self.type == 'orientDB':
            return self._get_properties_orientdb(db, otl_type, name)
        elif self.type == 'nebulaGraph':
            return self._get_properties_nebula(db, otl_type, name)

    def _get_properties_orientdb(self, db, otl_type, name):
        '''orientdb获取点/边的属性信息'''
        if otl_type == 'entity':
            otl_type = 'V'
        elif otl_type == 'edge':
            otl_type = 'E'
        url = "http://" + self.address + ":" + self.port + "/database/" + db
        resp = requests.get(url, auth=(self.username, self.password))
        if resp.status_code != 200:
            description = 'url: {} '.format(url)
            try:
                cause = str(resp.json().get('errors'))
            except Exception:
                cause = str(resp.content)
            description += cause
            return 500, description
        try:
            resp = resp.json()
        except Exception as e:
            cause = str(e)
            description = 'url: {} '.format(url)
            description += cause
            return 500, description
        classes = resp['classes']
        res = {}
        for aclass in classes:
            if aclass['name'] == name and aclass['superClass'] == otl_type:
                for prop in aclass['properties']:
                    res[prop['name']] = prop['type']
                break
        return 200, res

    def _get_properties_nebula(self, db, otl_type, name):
        '''nebula获取点/边的属性信息'''
        if otl_type == 'entity':
            otl_type = 'tag'
        ngql = 'describe {} `{}`'.format(otl_type, name)
        code, props_res = self._nebula_exec(ngql, db)
        if code != 200:
            if 'not existed' in props_res.error_msg():
                return 200, {}
            return code, props_res.error_msg()
        res = {}
        for i in range(props_res.row_size()):
            val = props_res.row_values(i)
            res[val[0].as_string()] = val[1].as_string()
        return 200, res

    def get_schema(self, db):
        '''获取点/边信息

        Returns:
            code: 返回码
            data: {'entity': [], 'edge': []}
        '''
        if self.type == 'orientDB':
            return self._get_schema_orientdb(db)
        elif self.type == 'nebulaGraph':
            return self._get_schema_nebula(db)

    def _get_schema_orientdb(self, db):
        url = "http://" + self.address + ":" + self.port + "/database/" + db
        resp = requests.get(url, auth=(self.username, self.password))
        if resp.status_code != 200:
            Logger.log_error(resp.content)
        try:
            resp = resp.json()
        except Exception as e:
            error_log = log_oper.get_error_log(str(e), sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
        classes = resp['classes']
        res = {'entity': [], 'edge': []}
        for aclass in classes:
            if aclass['superClass'] == 'E':
                res['edge'].append(aclass['name'])
            if aclass['superClass'] == 'V':
                res['entity'].append(aclass['name'])
        return 200, res

    def _get_schema_nebula(self, db):
        res = {'entity': [], 'edge': []}
        code, res_tags = self._nebula_exec('show tags', db)
        if code != 200:
            return code, res_tags
        for i in range(res_tags.row_size()):
            res['entity'].append(res_tags.row_values(i)[0].as_string())
        code, res_edges = self._nebula_exec('show edges', db)
        if code != 200:
            return code, res_edges
        for i in range(res_edges.row_size()):
            res['edge'].append(res_edges.row_values(i)[0].as_string())
        return 200, res

    def create_class(self, db, otl_name, pro_dict=None, is_batch=False):
        '''创建点类
        创建本体点以及本体的属性,属性增加_ds_id_(string)、_timestamp_(integer)

        Args:
            db: 数据库名
            otl_name: 本体名
            pro_dict: {属性名: 属性类型}
            is_batch: if the task is batch task, drop the class before creating
        Returns:
            code: 返回码,成功为200
            res:
        '''
        if is_batch:
            code, res = self.drop_class(db, otl_name)
            if code != 200:
                return code, res
        if self.type == 'orientDB':
            return self._create_class_orientdb(otl_name, pro_dict, db)
        elif self.type == 'nebulaGraph':
            return self._create_class_nebula(otl_name, pro_dict, db)

    def _create_class_orientdb(self, otl_name, pro_dict, db):
        v_class = "create class `{}` if not exists extends V".format(otl_name)
        code, res = self._orientdb_http(v_class, db)
        if code != 200:
            return code, res
        if len(pro_dict) == 0:
            return 200, {}
        for o_p in pro_dict:
            e_pro = "create property `{}`.`{}` if not exists {}".format(otl_name, o_p, pro_dict[o_p])
            code, res = self._orientdb_http(e_pro, db)
            if code != 200:
                return code, res
        address_pro = "create property `{}`.`{}` if not exists {}".format(otl_name, "_ds_id_", "string")
        code, res = self._orientdb_http(address_pro, db)
        if code != 200:
            return code, res
        address_pro = "create property `{}`.`{}` if not exists {}".format(otl_name, "_timestamp_", "integer")
        code, res = self._orientdb_http(address_pro, db)
        if code != 200:
            return code, res
        return 200, {}

    def _create_class_nebula(self, otl_name, pro_dict, db):
        self._check_db_nebula(db)
        create_tag = 'CREATE TAG IF NOT EXISTS `{}` '.format(otl_name)
        props = []
        for o_p in pro_dict:
            props.append('`' + o_p + '` ' + data_type_transform(pro_dict[o_p]))
        props.append('`_ds_id_` string')
        props.append('`_timestamp_` int')
        create_tag += '(' + ','.join(props) + ')'
        code, res = self._nebula_exec(create_tag, db)
        return code, res

    def drop_class(self, db, otl_name, class_type='tag'):
        '''删除点/边类
        Args:
            db: 数据库名
            otl_name: 本体名
            class_type: 点/边 tag/edge
        '''
        if self.type == 'orientDB':
            return self._drop_class_orientdb(db, otl_name)
        elif self.type == 'nebulaGraph':
            return self._drop_class_nebula(db, otl_name, class_type)

    def _drop_class_orientdb(self, db, otl_name):
        drop_class_sql = "DROP class `{}` if exists UNSAFE".format(otl_name)
        code, res = self._orientdb_http(drop_class_sql, db)
        return code, res

    def _drop_class_nebula(self, db, otl_name, class_type):
        '''nebula删除tag/edge
        在删除前先删除该tag/edge上的索引'''
        code, res = self._get_present_index_nebula(db)
        if code != 200:
            return code, res
        _, present_index_name, _, present_index_name_unique = res
        if otl_name in present_index_name:
            code, res = self._drop_fulltext_index_nebula(present_index_name[otl_name])
            if code != 200:
                return code, res
        if otl_name in present_index_name_unique:
            code, res = self._drop_index_nebula(db, present_index_name_unique[otl_name], class_type)
            if code != 200:
                return code, res
        ngql = 'DROP {} IF EXISTS`{}`'.format(class_type, otl_name)
        code, res = self._nebula_exec(ngql, db)
        return code, res

    def alter_class(self, db, otl_name, class_type='tag', op='add_prop', **kw):
        '''修改点/边类的结构

        Args:
            db: 数据库名
            otl_name: 本体名
            class_type: 点/边 tag/edge
            op: alter操作方法
                'add_prop': 新增属性
                'drop_prop': 删除属性
                'alter_name': 更改类名 (nebula不支持)
                'alter_prop': 修改属性 (nebula不支持)
            **kw:
                otl_pro: 本体属性列表
                en_pro_dict: {实体名:{属性名:属性类型}}

       turns:
            code: 正常返回200
            res:
        '''
        if self.type == 'orientDB':
            return self._alter_class_orientdb(db, otl_name, op, **kw)
        elif self.type == 'nebulaGraph':
            return self._alter_class_nebula(db, otl_name, class_type, op, **kw)

    def _alter_class_orientdb(self, db, otl_name, op, **kw):
        if op.lower() == 'add_prop':
            otl_pro = kw.get('otl_pro')
            en_pro_dict = kw.get('en_pro_dict')
            for o_p in otl_pro:
                e_pro = "create property `{}`.`{}` {}".format(otl_name, o_p, en_pro_dict[otl_name][o_p])
                code, res = self._orientdb_http(e_pro, db)
                if code != 200:
                    return code, res
            return code, res
        elif op.lower() == 'drop_prop':
            drop_property_sql = "drop property  `{}`.`{}`  ".format(otl_name, kw["propertyname"])
            if kw["unsafe"] == "True":
                drop_property_sql += " force"
            code, res = self._orientdb_http(drop_property_sql, db)
            return code, res
        elif op.lower() == 'alter_name':
            update_class_sql = "alter class  `{}` name `{}`".format(kw["oldname"], otl_name)
            if kw["unsafe"] == "True":
                update_class_sql += " unsafe"
            code, res = self._orientdb_http(update_class_sql, db)
            return code, res
        elif op.lower() == 'alter_prop':
            update_class_sql = "alter property  `{}`.`{}`  `{}` ".format(otl_name, kw["oldname"],
                                                                         kw["altertype"])
            if kw["altertype"] == "name":
                update_class_sql += "{} ".format(kw["propertyname"])
            if kw["altertype"] == "type":
                update_class_sql += "{} ".format(kw["propertytype"])
            code, res = self._orientdb_http(update_class_sql, db)
            return code, res

    def _alter_class_nebula(self, db, otl_name, class_type, op, **kw):
        self._check_schema_nebula(db, otl_name, [], class_type)
        if op.lower() == 'add_prop':
            otl_pro = kw.get('otl_pro')
            en_pro_dict = kw.get('en_pro_dict')
            if class_type.lower() == 'tag':
                ngql = 'ALTER TAG `{}` ADD'.format(otl_name)
            elif class_type.lower() == 'edge':
                ngql = 'ALTER EDGE `{}` ADD'.format(otl_name)
            props = []
            for o_p in otl_pro:
                props.append('`' + o_p + '` ' + data_type_transform(en_pro_dict[otl_name][o_p]))
            ngql += '(' + ','.join(props) + ')'
            code, res = self._nebula_exec(ngql, db)
            return code, res
        elif op.lower() == 'drop_prop':
            # 若用户指定了unsafe模式，则先删除属性对应的索引
            if kw["unsafe"] == "True":
                code, res = self._get_present_index_nebula(db)
                if code != 200:
                    return code, res
                present_index_field, present_index_name, present_index_field_unique, present_index_name_unique = res
                if otl_name in present_index_name and kw["propertyname"] in present_index_field[otl_name]:
                    code, res = self._drop_fulltext_index_nebula(present_index_name[otl_name])
                    if code != 200:
                        return code, res
                if otl_name in present_index_name_unique and kw["propertyname"] in present_index_field_unique[otl_name]:
                    code, res = self._drop_index_nebula(db, present_index_name_unique[otl_name], class_type)
                    if code != 200:
                        return code, res
            ngql = 'ALTER {} `{}` DROP (`{}`)'.format(class_type, otl_name, kw["propertyname"])
            code, res = self._nebula_exec(ngql, db)
            return code, res

    def create_full_index(self, otl_name, prop_list, present_index_name, db, pro_vector=[], index_name=None):
        '''
        创建全文索引,已存在则删除旧的重建新的

        Args:
            otl_name: 本体名
            prop_list: 全文索引属性列表
            present_index_name: 已有的全文索引名称，每个类只有一项全文索引
            db: 数据库名
            pro_vector: 需要创建向量的属性列表
            index_name: 索引名, 'document_docfulltexindex'表示标注抽取的文档全文索引
        Returns:
            code: 成功返回200
            res:
        '''
        if self.type == 'orientDB':
            if not index_name:
                index_name = otl_name + '_fulltext'
            o_p_s = ",".join(["`" + pro + "`" for pro in prop_list])
            if otl_name.lower() in present_index_name:
                code, res = self._drop_index_orientdb(db, present_index_name[otl_name.lower()])
                if code != 200:
                    return code, res
            code, res = self._create_full_index_orientdb(db, index_name, otl_name, o_p_s)
            return code, res
        elif self.type == 'nebulaGraph':
            if not index_name:
                index_name = db + '_' + otl_name
            elif index_name == 'document_docfulltexindex':
                index_name = db + '_' + index_name
            if otl_name.lower() in present_index_name:
                code, res = self._alter_full_index_nebula(index_name, prop_list, pro_vector)
            else:
                code, res = self._create_full_index_nebula(index_name, prop_list, pro_vector)
            return code, res

    def drop_fulltext_index(self, db, index_name):
        if self.type == 'orientDB':
            return self._drop_index_orientdb(db, index_name)
        elif self.type == 'nebulaGraph':
            return self._drop_fulltext_index_nebula(index_name)

    def _drop_index_orientdb(self, db, index_name):
        drop_sql = "DROP INDEX " + "`" + index_name + "`" + " if exists"
        return self._orientdb_http(drop_sql, db)

    def _create_full_index_orientdb(self, db, index_name, otl_name, properties):
        if properties == "":
            return 200, "properties empty"
        e_index = 'create index `{}` on `{}`({}) fulltext engine lucene ' \
                  'metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer",' \
                  '"query": "com.hankcs.lucene.HanLPAnalyzer"}}' \
            .format(index_name, otl_name, properties)
        code, res = self._orientdb_http(e_index, db)
        if code != 200:
            return code, res
        rebuild = 'REBUILD INDEX `{}`'.format(index_name)
        code, res = self._orientdb_http(rebuild, db)
        return code, res

    def _drop_fulltext_index_nebula(self, index_name):
        url = 'http://' + self.esaddress + ':' + str(self.esport) + '/' + index_name
        response = requests.delete(url=url,
                                   params={'ignore_unavailable': 'true'},
                                   auth=HTTPBasicAuth(self.esusername, self.espassword),
                                   verify=False)
        if response.status_code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': response.content,
                                   'message': "delete elasticsearch index failed"}}
            Logger.log_error(str(self.state))
        return response.status_code, response.json()

    def _alter_full_index_nebula(self, index_name, properties, pro_vector):
        '''
        修改opensearch全文索引映射
        Args:
            index_name: 索引名
            properties: 新增的属性
            pro_vector: 新增的向量属性
        '''
        url = 'http://{}:{}/{}/_mapping'.format(self.esaddress, self.esport, index_name.lower())
        body = {
                "properties": {
                }
        }
        fields = {}
        for p in properties:
            fields[p] = {
                "type": "text",
                "analyzer": "hanlp_index",
                "search_analyzer": "hanlp_standard",
                "fields": {
                    "keyword": {
                        "type": "keyword"
                    }
                }
            }
        for p in pro_vector:
            fields[p + "-vector"] = {
                "type": "knn_vector",
                "dimension": 768,
                "method": {
                    "name": "hnsw",
                    "space_type": "cosinesimil",
                    "engine": "nmslib",
                    "parameters": {
                        "ef_construction": 128,
                        "m": 24
                    }
                }
            }
        body['properties'] = fields
        response = requests.put(url=url, json=body, auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
        if response.status_code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': response.content,
                                   'message': "create elasticsearch index failed"}
                          }
            Logger.log_error(str(self.state))
            return response.status_code, response.json()
        return 200, {}

    def _create_full_index_nebula(self, index_name, properties, pro_vector):
        # 获取节点数
        url = 'http://' + self.esaddress + ':' + str(self.esport) + '/_nodes'
        response = requests.get(url=url, auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
        if response.status_code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': response.content,
                                   'message': "getting opensearch node number failed"}
                          }
            Logger.log_error(str(self.state))
            return response.status_code, response.json()
        nodenum = response.json()['_nodes']['total']
        replicanum = 1
        if nodenum == 1:
            replicanum = 0
        # 创建全文索引
        url = 'http://' + self.esaddress + ':' + str(self.esport) + '/' + index_name.lower()
        body = {
            "settings": {
                "number_of_shards": min(3, nodenum),
                "number_of_replicas": replicanum
            },
            "mappings": {
                "properties": {
                }
            }
        }
        fields = {}
        for p in properties:
            fields[p] = {
                "type": "text",
                "analyzer": "hanlp_index",
                "search_analyzer": "hanlp_standard",
                "fields": {
                    "keyword": {
                        "type": "keyword"
                    }
                }
            }
            if p in pro_vector:
                fields[p + "-vector"] = {
                    "type": "knn_vector",
                    "dimension": 768,
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil",
                        "engine": "nmslib",
                        "parameters": {
                            "ef_construction": 128,
                            "m": 24
                        }
                    }
                }
        body['mappings']['properties'] = fields
        response = requests.put(url=url, json=body, auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
        if response.status_code != 200:
            if response.json()['error']['type'] != 'resource_already_exists_exception':
                self.state = {"state": "FAILURE",
                              "meta": {'cause': response.content,
                                       'message': "create elasticsearch index failed"}
                              }
                Logger.log_error(str(self.state))
                return response.status_code, response.json()
        return 200, {}

    def create_uni_index(self, otl_name, merge_pro, present_index_name_unique, db, pro_dict):
        '''创建唯一索引
        当图数据库类型为orientdb时 本体名为label或subject时增加额外的属性

        Args:
            otl_name: 本体名
            merge_pro: 属性列表
            present_index_name_unique: 已存在的唯一索引名称 {indexDefinition.className: name}
            db: 数据库名
            pro_dict: {属性名：属性类型}
        '''
        if merge_pro:
            index_name = otl_name + '_' + "_".join(i for i in merge_pro)
            if self.type == 'orientDB':
                properties = ",".join("`" + i + "`" for i in merge_pro)
                code, res = self._create_uni_index_orientdb(db, index_name, otl_name, properties)
                if otl_name in present_index_name_unique and code == 200:
                    self._drop_index_orientdb(db, present_index_name_unique[otl_name])
            elif self.type == 'nebulaGraph':
                if (otl_name in present_index_name_unique
                        and index_name != present_index_name_unique[otl_name]):
                    self._drop_index_nebula(db, present_index_name_unique[otl_name])
                self._create_tag_index_nebula(db, index_name, otl_name, merge_pro, pro_dict)
        if otl_name == "label":
            merge_pro = ["name", "_ds_id_"]
            index_name = otl_name + '_' + "_".join(i for i in merge_pro)
            if self.type == 'orientDB':
                properties = ",".join("`" + i + "`" for i in merge_pro)
                self._create_uni_index_orientdb(db, index_name, otl_name, properties)
                self._create_notuni_index_orientdb(db, 'label_name', 'label', 'name')
        if otl_name == "subject":
            merge_pro = ["name", "subject_id"]
            index_name = otl_name + '_' + "_".join(i for i in merge_pro)
            if self.type == 'orientDB':
                properties = ",".join("`" + i + "`" for i in merge_pro)
                self._create_uni_index_orientdb(db, index_name, otl_name, properties)
                self._drop_index_orientdb(db, 'subject_name')
                self._create_notuni_index_orientdb(db, 'subject_name', 'subject', 'name')
        return 200, {}

    def _create_uni_index_orientdb(self, db, index_name, otl_name, properties):
        e_index = 'CREATE INDEX `{}` on `{}` ({}) UNIQUE_HASH_INDEX' \
            .format(index_name, otl_name, properties)
        return self._orientdb_http(e_index, db)

    def _create_notuni_index_orientdb(self, db, index_name, otl_name, properties):
        e_index = 'CREATE INDEX `{}` on `{}` ({}) NOTUNIQUE_HASH_INDEX' \
            .format(index_name, otl_name, properties)
        return self._orientdb_http(e_index, db)

    def _drop_index_nebula(self, db, index_name, class_type='tag'):
        '''删除nebula原生索引
        Args:
            db: 数据库名
            index_name: 索引名
            class_type: 点/边: tag/edge
        '''
        drop = 'DROP {} INDEX IF EXISTS `{}`'.format(class_type, index_name)
        return self._nebula_exec(drop, db)

    def _create_tag_index_nebula(self, db, index_name, otl_name, props, pro_dict):
        properties = []
        for p in props:
            if pro_dict[p] == 'string':
                properties.append('`' + p + '`' + '(' + str(index_len) + ')')
            else:
                properties.append('`' + p + '`')
        tag_index = 'CREATE TAG INDEX IF NOT EXISTS `{}` ON `{}` ({})' \
            .format(index_name, otl_name, ','.join(properties))
        self._nebula_exec(tag_index, db)

    def _create_edge_index_nebula(self, db, index_name, edge_name, props, pro_dict):
        properties = []
        for p in props:
            if pro_dict[p] == 'string':
                properties.append('`' + p + '`' + '(' + str(index_len) + ')')
            else:
                properties.append('`' + p + '`')
        edge_index = 'CREATE EDGE INDEX IF NOT EXISTS`{}` ON `{}` ({})' \
            .format(index_name, edge_name, ','.join(properties))
        return self._nebula_exec(edge_index, db)

    def batch_process_vertex_index(self, es_bulk_index_data):
        url = 'http://{}:{}/_bulk'.format(self.esaddress, self.esport)
        headers = {'Content-Type': 'application/json'}
        retry_num = 0
        while retry_num <= 3:
            if retry_num > 1:
                Logger.log_error(f"start retry num:{retry_num}")
            try:
                response = requests.post(url=url, headers=headers, data=es_bulk_index_data,
                                         auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
                if response.status_code != 200:
                    Logger.log_error(f"create_vertex failed,code:{response.status_code}")
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': response.content,
                                           'message': "create elasticsearch index failed"}
                                  }
                    if response.status_code == 429:
                        retry_num += 1
                        Logger.log_error("create_vertex opensearch jvm error,random sleeping 5~15s,retry")
                        time.sleep(random.randint(5, 15))
                        continue
                    else:
                        break
                if retry_num > 1 and response.status_code == 200:
                    Logger.log_info(f"create_vertex retry sucess,retry num:{retry_num}")
                break
            except Exception as e:
                retry_num += 1
                Logger.log_error(f"send es request exception:{str(e)},sleeping 20s")
                time.sleep(20)

    def batch_process_vertex_index_not_catch_exp(self, es_bulk_index_data):
        url = 'http://{}:{}/_bulk'.format(self.esaddress, self.esport)
        headers = {'Content-Type': 'application/json'}
        retry_num = 0
        while retry_num <= 3:
            if retry_num > 1:
                Logger.log_info(f"start retry num:{retry_num}")
            # 去掉try，如有异常直接抛出到最外层
            try:
                response = requests.post(url=url, headers=headers, data=es_bulk_index_data,
                                         auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
            except Exception as e:
                raise Exception(_l("Opensearch has some error."))
            if response.status_code != 200:
                raise Exception(_l("Opensearch has some error."))
                Logger.log_info(f"create_vertex failed,code:{response.status_code}")
                self.state = {"state": "FAILURE",
                              "meta": {'cause': response.content,
                                       'message': "create elasticsearch index failed"}
                              }
                if response.status_code == 429:
                    retry_num += 1
                    Logger.log_info("create_vertex opensearch jvm error,random sleeping 5~15s,retry")
                    time.sleep(random.randint(5, 15))
                    continue
                else:
                    break
            if retry_num > 1 and response.status_code == 200:
                Logger.log_info(f"create_vertex retry sucess,retry num:{retry_num}")
            break

    def create_vertex(self, db, batch_sql=None, es_bulk_index=None, otl_name=None, props=None, values=None,
                      values_index=None, pro_value=None, pro_value_index=None):
        """插入实体点
        batch_sql存在则是批量插入,否则为单点插入

        Args:
            db: 图数据库中database的名字
            batch_sql: 已处理好的sql语句
            es_bulk_index: es批量插入的请求体
            otl_name: 本体名
            props: 属性列表
            values: 值列表
            values_index: 融合属性值列表
            pro_value: 赋值字符串
            pro_value_index: where条件字符串
        """
        if batch_sql:
            t1 = time.time()
            code, res = self.exec_batch(batch_sql, db)
            t2 = time.time()
            Logger.log_info(f"/data:entity insert nebula end,spend:{t2-t1}s")
            if code != 200:
                if self.type == 'orientDB':
                    raise Exception(_l("orientDB has some error."))
                elif self.type == 'nebulaGraph':
                    raise Exception(_l("Nebula has some error."))
            if self.type == 'nebulaGraph':
                es_bulk_index_new = '\n'.join(es_bulk_index) + '\n'
                if len(es_bulk_index_new) > 92160:
                    split_num = math.ceil(len(es_bulk_index_new) / 92160)
                    res_data = [es_bulk_index[i::split_num] for i in range(split_num)]
                    for es_data in res_data:
                        es_bulk_index_data = '\n'.join(es_data) + '\n'
                        self.batch_process_vertex_index_not_catch_exp(es_bulk_index_data)
                else:
                    self.batch_process_vertex_index_not_catch_exp(es_bulk_index_new)
            t3 = time.time()
            Logger.log_info(f"/data:entity insert opensearch end,spend:{t3-t2}s")

        else:
            if self.type == 'orientDB':
                vertexsql = "UPDATE  `{}` SET {} UPSERT WHERE {}" \
                    .format(otl_name, ",".join(pro_value), " and ".join(pro_value_index))
                self._orientdb_http(vertexsql, db)
            elif self.type == 'nebulaGraph':
                vid = otl_name + '_'
                for v in values_index:
                    vid += f"{v}_"
                vid = get_md5(vid)
                propsstr = []
                for p in props:
                    propsstr.append('`' + p + '`')
                valuesstr = []
                for v in values:
                    if isinstance(v, int):
                        valuesstr.append(str(v))
                    else:
                        valuesstr.append("'" + v + "'")
                ngql = 'INSERT VERTEX `{}` ({}) VALUES \n"{}" : ({})' \
                    .format(otl_name, ','.join(propsstr), vid, ','.join(valuesstr))
                self._nebula_session_exec_(ngql, db)
                # es插入索引
                code, res = self._get_present_index_nebula(db)
                if code != 200:
                    raise Exception(str(self.state))
                present_index_field, present_index_name, _, _ = res
                if otl_name.lower() not in present_index_name:
                    message = 'otl_name {} not in present_index_name. presen_index_name for db {} is {}' \
                        .format(otl_name.lower(), db, present_index_name)
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': message,
                                           'message': "create elasticsearch index failed"}
                                  }
                    Logger.log_error(message)
                    return
                index_name = present_index_name[otl_name.lower()]
                url = 'http://{}:{}/{}/_doc/{}' \
                    .format(self.esaddress, self.esport, index_name, vid)
                body = {}
                for i in range(len(props)):
                    if props[i] in present_index_field[otl_name.lower()]:
                        body[props[i]] = values[i]
                response = requests.put(url=url, json=body, auth=HTTPBasicAuth(self.esusername, self.espassword),
                                        verify=False)
                if response.status_code != 200 and response.status_code != 201:
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': response.content,
                                           'message': "create elasticsearch index failed"}
                                  }
                    raise Exception(str(self.state))

    def check_schema(self, db, name, props=None, class_type=None):
        """确认schema是否存在
        Args:
            db: 图数据库名
            name: 点/边名
            props: 属性列表
            class_type: entity/edge
        Returns:
            code: 返回码
            res: 正常返回: True:存在; False:不存在
        """
        if self.type == 'orientDB':
            if class_type == 'entity':
                class_type = 'V'
            elif class_type == 'edge':
                class_type = 'E'
            return self._check_schema_orientdb(db, name, props, class_type)
        elif self.type == 'nebulaGraph':
            if class_type == 'entity':
                class_type = 'tag'
            return self._check_schema_nebula(db, name, props, class_type)

    def _check_schema_orientdb(self, db, name, props, class_type):
        code, res = self._get_properties_orientdb(db, class_type, name)
        if code != 200:
            return code, res
        # name不存在
        if len(res) == 0:
            return 200, False
        # 属性不存在
        for prop in props:
            if prop not in res:
                return 200, False
        return 200, True

    def _check_schema_nebula(self, db, name, props, class_type):
        '''确认nebula schema是否存在
        
        Args:
            db: 数据库名
            name: 点/边名
            props: 点/边的属性列表
            class_type: 点/边 tag/edge
        '''
        # 点/边名存在
        code, res = self._nebula_exec('SHOW {}S'.format(class_type.upper()), db)
        if code != 200:
            code = codes.Builder_GraphdbDao_CheckSchemaNebula_NebulaExecError
            if "SpaceNotFound" in res.error_msg():
                return code, Gview2.TErrorreturn(code,
                                                 cause='nebula show {} failed'.format(class_type),
                                                 description="Space Not Found Error"
                                                 )
            return code, Gview2.TErrorreturn(code,
                                             cause='nebula show {} failed'.format(class_type),
                                             description=res.error_msg()
                                             )
        tags = []
        for t in res.column_values('Name'):
            tags.append(t.as_string())
        if name not in tags:
            return codes.successCode, False
        # 属性存在
        code, res = self._nebula_exec('DESCRIBE {} `{}`'.format(class_type.upper(), name), db)
        if code != 200:
            code = codes.Builder_GraphdbDao_CheckSchemaNebula_NebulaExecError
            return code, Gview2.TErrorreturn(code,
                                             cause='nebula describe {} {} failed'.format(class_type, name),
                                             description=res.error_msg()
                                             )
        fields = []
        for t in res.column_values('Field'):
            fields.append(t.as_string())
        for p in props:
            if p not in fields:
                return codes.successCode, False
        return 200, True

    def create_edge_class(self, edge_class, edge_otl_pro, edge_pro_dict, db, is_batch=False):
        '''创建边类
        创建边类及边的属性,属性增加_timestamp_(integer)

        Args:
            edge_class: 边名
            edge_otl_pro: 边的属性列表
            edge_pro_dict: {边名:{属性名:属性类型}}
            db: 数据库名
            is_batch: if the task is batch task, drop the class before creating
        Returns:
            code: 成功返回200
            res:
        '''
        if is_batch:
            self.drop_class(db, edge_class, 'edge')
        if self.type == 'orientDB':
            return self._create_edge_class_orientdb(edge_class, edge_otl_pro, edge_pro_dict, db)
        elif self.type == 'nebulaGraph':
            return self._create_edge_class_nebula(edge_class, edge_otl_pro, edge_pro_dict, db)

    def _create_edge_class_orientdb(self, edge_class, edge_otl_pro, edge_pro_dict, db):
        v_class = "create class `{}` if not exists extends E".format(edge_class)
        code, res = self._orientdb_http(v_class, db)
        if code == 500 and 'exists' in res['errors'][0]['content']:  # 重名的边不再重复创建
            return 200, {}
        for o_p in edge_otl_pro:
            e_pro = "create property `{}`.`{}` if not exists {}" \
                .format(edge_class,
                        o_p,
                        edge_pro_dict[edge_class][o_p])
            code, res = self._orientdb_http(e_pro, db)
            if code != 200:
                return code, res
        address_pro = "create property `{}`.`{}` if not exists {}" \
            .format(edge_class, "_timestamp_", "integer")
        code, res = self._orientdb_http(address_pro, db)
        return code, res

    def _create_edge_class_nebula(self, edge_class, edge_otl_pro, edge_pro_dict, db):
        self._check_db_nebula(db)
        create_edge = 'CREATE EDGE IF NOT EXISTS `{}`'.format(edge_class)
        props = []
        for o_p in edge_otl_pro:
            prop = '`' + o_p + '` ' + data_type_transform(edge_pro_dict[edge_class][o_p])
            props.append(prop)
        props.append('`_timestamp_` int')
        create_edge += '(' + ','.join(props) + ')'
        code, res = self._nebula_exec(create_edge, db)
        return code, res

    def create_edge_index(self, edge_class, edge_otl_pro, present_index_name, present_index_field,
                          pro_index, edge_pro_dict, db, is_batch=False):
        if self.type == 'nebulaGraph':
            self._create_edge_index_nebula(db, edge_class + '_' + '_'.join(edge_otl_pro),
                                           edge_class, edge_otl_pro, edge_pro_dict[edge_class])
        # 创建全文索引
        if not is_batch and edge_class.lower() in present_index_name:
            present_field = present_index_field[edge_class.lower()]  # 已有索引的属性
            if isinstance(present_field, str):
                present_field = [present_field]  # 如果只有单个属性，将其包装成列表
            new_set = [i for i in present_field if i not in edge_otl_pro]  # 已有索引但不在edge_otl_pro中的属性
            for otl in pro_index[edge_class]:
                if otl not in new_set:
                    new_set.append(otl)  # 需要创建索引的属性和已有索引的属性的并集
            if not (edge_class == "document" and present_index_name[edge_class.lower()].endswiwh(
                    "document_docfulltexindex")):
                return self.create_full_index(edge_class, new_set, present_index_name, db)
        else:
            return self.create_full_index(edge_class, pro_index[edge_class], present_index_name, db)

    def _create_edge_orientdb(self, edge_class, start, end, set_sql, db):
        '''orientdb插入边

        Args:
            edge_class: 边的类型
            start: 选择起始点的sql语句
            end: 选择终点的sql语句
            set_sql: 边的属性值sql语句list
            db: 图数据库名
        '''
        delete_sql = "DELETE EDGE FROM ({}) to ({}) WHERE @class = '{}'".format(start, end, edge_class)
        code, r_json = self._orientdb_http(delete_sql, db)
        create_sql = "create edge `{}` from ({}) to ({}) set {}" \
            .format(edge_class, start, end, " , ".join(set_sql))
        code, r_json = self._orientdb_http(create_sql, db)
        if code == 500 and "DuplicatedException" in r_json["errors"][0]["content"]:
            update_sql = "UPDATE  EDGE `{}` set out= ({}) ,in = ({}) , {} \
                        UPSERT where out = ({}) and in = ({})" \
                .format(edge_class, start, end, " , ".join(set_sql),
                        start, end)
            code, r_json = self._orientdb_http(update_sql, db)

    def _create_edge_nebula(self, edge_class, props, start, end, values, db):
        '''nebula插入边

        Args:
            edge_class: 边的类型
            props: 边的属性 列表
            start: 起始点的VID
            end: 终点的VID
            values: 边的值 列表
            db: 图数据库名
        '''
        propsstr = []
        for p in props:
            propsstr.append('`' + p + '`')
        ngql = 'INSERT EDGE `{}` ({}) VALUES \n"{}" -> "{}" : ({})' \
            .format(edge_class, ','.join(propsstr), start, end, ','.join(values))
        self._nebula_exec(ngql, db)
        # 插入全文索引
        code, res = self._get_present_index_nebula(db)
        if code != 200:
            raise Exception(str(self.state))
        present_index_field, present_index_name, _, _ = res
        if not edge_class.lower() in present_index_name:
            message = 'edge_class {} not in present_index_name'.format(edge_class.lower())
            self.state = {"state": "FAILURE",
                          "meta": {'cause': message,
                                   'message': "create elasticsearch index failed"}
                          }
            Logger.log_error(message)
            return
        index_name = present_index_name[edge_class.lower()]
        url = 'http://{}:{}/{}/_doc/{}' \
            .format(self.esaddress, self.esport, index_name, start + '_' + end)
        body = {}
        for i in range(len(props)):
            if props[i] in present_index_field[edge_class.lower()]:
                body[props[i]] = values[i]
        response = requests.put(url=url, json=body, auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
        if response.status_code != 200 and response.status_code != 201:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': response.content,
                                   'message': "create elasticsearch index failed"}
                          }
            raise Exception(str(self.state))

    def create_edge(self, edge_class, start, end, prop_val_sql, db):
        '''
        Args:
            edge_class: 边名
            start: 起点sql/起点VID
            end: 终点sql/终点VID
            prop_val_sql: orientdb: 第一项为赋值字符串列表 nebula: 第一项为属性列表,第二项为值列表
            db: 图数据库名
        '''
        if self.type == 'orientDB':
            self._create_edge_orientdb(edge_class, start, end, prop_val_sql[0], db)
        elif self.type == 'nebulaGraph':
            self._create_edge_nebula(edge_class, prop_val_sql[0], start, end,
                                     prop_val_sql[1], db)

    def fulltext_rebuild_nebula(self, tag_pro_index, edge_pro_index, graphid, db):
        '''
        nebula重建全文索引
        Args:
            tag_pro_index: {实体名:需要创建全文索引的属性list}
            edge_pro_index: {边名:需要创建全文索引的属性list}
            graphid: 图谱id
            db: 数据库名
        '''
        Logger.log_info('开始重建索引')
        start_time = time.time()
        # 多进程 读取nebula数据，插入全文索引
        pool = multiprocessing.Pool(10)
        partial_work = partial(self._fulltext_rebuild_process, pro_index=tag_pro_index, db=db, class_type='vertex')
        vertex_res = pool.map(partial_work, tag_pro_index.keys())
        partial_work = partial(self._fulltext_rebuild_process, pro_index=edge_pro_index, db=db, class_type='edge')
        edge_res = pool.map(partial_work, edge_pro_index.keys())
        pool.close()
        pool.join()
        end_time = time.time()
        Logger.log_info('重建索引结束，耗时{}s'.format(end_time - start_time))
        from utils.ConnectUtil import redisConnect
        redis = redisConnect.connect_redis("0", model="write")
        success = True
        for a_vertex_res in vertex_res:
            if a_vertex_res[0] != 200:
                success = False
                break
        if not success:
            redis.set(f"rebuild_flag_{graphid}", -1, ex=86400)
            return
        for a_edge_res in edge_res:
            if a_edge_res[0] != 200:
                success = False
                break
        if not success:
            redis.set(f"rebuild_flag_{graphid}", -1, ex=86400)
            return
        redis.set(f"rebuild_flag_{graphid}", 0, ex=86400)

    def _fulltext_rebuild_process(self, otl_name, pro_index, db, class_type):
        '''
        创建全文索引process
        
        Args:
            otl_name: 点/边名
            pro_index: {点/边名: 属性list}
            db: 数据库名
            class_type: 点/边: vertex/edge
        Returns:
            code:
            res:
        '''
        # 创建全文索引
        try:
            code, res = self.get_present_index(db)
            if code != 200:
                Logger.log_error(str(self.state))
                return code, {otl_name: self.state}
            _, present_index_name, _, _ = res
            self.create_full_index(otl_name, pro_index[otl_name], present_index_name, db)
            # 遍历nebula
            # 属性拼接
            props = []
            for p in pro_index[otl_name]:
                props.append('properties({}).`{}`'.format(class_type, p))
            # 获取总数
            ngql = 'show stats'
            code, res = self._nebula_exec(ngql, db)
            if code != 200:
                self.state = {'state': 'FAILURE',
                              'meta': {'cause': res.error_msg(),
                                       'message': 'nebula run ngql failed: {}'.format(ngql)}}
                Logger.log_error(str(self.state))
                return code, {otl_name: self.state}
            count = 0
            for i in range(res.row_size()):
                row = res.row_values(i)
                if row[1].as_string() == 'econ_kind':
                    count = row[2].as_int()
                    break
            iter_size = 1000
            current = 0
            while current <= count:
                if class_type == 'vertex':
                    sql = '''LOOKUP ON `{}` yield id(vertex),{} | limit {}, {}''' \
                        .format(otl_name, ','.join(props), current, iter_size)
                elif class_type == 'edge':
                    sql = '''LOOKUP ON `{}` yield src(edge),dst(edge),rank(edge),{} | limit {}, {}''' \
                        .format(otl_name, ','.join(props), current, iter_size)
                code, data = self._nebula_exec(sql, db)
                if code != 200:
                    self.state = {'state': 'FAILURE',
                                  'meta': {'cause': res.error_msg(),
                                           'message': 'nebula run ngql failed: {}'.format(sql)}}
                    Logger.log_error(str(self.state))
                    return code, {otl_name: self.state}
                # 插入全文索引
                index_name = db + '_' + otl_name
                body = []
                for i in range(data.row_size()):
                    row = data.row_values(i)
                    vid = ''
                    if class_type == 'vertex':
                        vid = row[0].as_string()
                    elif class_type == 'edge':
                        vid = row[0].as_string() + '_' + row[1].as_string()
                    body_index = {"index": {"_index": index_name, "_id": vid}}
                    body_field = {}
                    # 对nebula返回结果取值的开始列
                    j = 1
                    if class_type == 'edge':
                        j = 3
                    for p in pro_index[otl_name]:
                        if row[j].is_string():
                            body_field[p] = row[j].as_string()
                        else:
                            body_field[p] = ''
                        j += 1
                    body.append(json.dumps(body_index) + '\n' + json.dumps(body_field))
                if body:
                    body = '\n'.join(body) + '\n'
                    self.fulltext_bulk_index(body)
                current += iter_size
            return 200, {otl_name: 'success'}
        except Exception as e:
            error_log = log_oper.get_error_log(str(e), sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            return 500, {otl_name: e}

    def fulltext_bulk_index(self, es_bulk_index_body):
        url = 'http://{}:{}/_bulk'.format(self.esaddress, self.esport)
        headers = {'Content-Type': 'application/json'}
        retry_num = 0
        while retry_num <= 3:
            if retry_num > 1:
                Logger.log_info(f"start retry num:{retry_num}")
            try:
                response = requests.post(url=url, headers=headers, data=es_bulk_index_body,
                                         auth=HTTPBasicAuth(self.esusername, self.espassword),
                                         verify=False)
                if response.status_code != 200:
                    if response.status_code == 429:
                        retry_num += 1
                        Logger.log_error("opensearch jvm error,random sleeping 5~15s,retry")
                        time.sleep(random.randint(5, 15))
                        continue
                    Logger.log_error(f"fulltext_bulk_index failed,code:{response.status_code}")
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': response.content,
                                           'message': "create elasticsearch index failed"}
                                  }
                    Logger.log_error(str(self.state))
                    break
                else:
                    if retry_num > 1:
                        Logger.log_info(f"fulltext_bulk_index retry sucess,retry num:{retry_num}")
                break
            except Exception as e:
                retry_num += 1
                Logger.log_error(f"send es request exception:{str(e)},sleeping 20s")
                time.sleep(20)
        return 0

    async def async_fulltext_bulk_index(self, es_bulk_index_body):
        url = 'http://{}:{}/_bulk'.format(self.esaddress, self.esport)
        headers = {'Content-Type': 'application/json'}
        retry_num = 0
        while retry_num <= 3:
            if retry_num > 1:
                Logger.log_info(f"start retry num:{retry_num}")
            try:
                response = requests.post(url=url, headers=headers, data=es_bulk_index_body,
                                         auth=HTTPBasicAuth(self.esusername, self.espassword),
                                         verify=False)
                if response.status_code != 200:
                    if response.status_code == 429:
                        retry_num += 1
                        Logger.log_error("opensearch jvm error,random sleeping 5~15s,retry")
                        time.sleep(random.randint(5, 15))
                        continue
                    Logger.log_error(f"fulltext_bulk_index failed,code:{response.status_code}")
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': response.content,
                                           'message': "create elasticsearch index failed"}
                                  }
                    Logger.log_error(str(self.state))
                    break
                else:
                    if retry_num > 1:
                        Logger.log_info(f"fulltext_bulk_index retry sucess,retry num:{retry_num}")
                break
            except Exception as e:
                retry_num += 1
                Logger.log_error(f"send es request exception:{str(e)},sleeping 20s")
                time.sleep(20)
        return 0

    def stats(self, db):
        '''
        统计数据量

        Returns:
            code: 返回码
            res: 正确则返回以下字段
                edges: 边的总数
                entities: 点的总数
                name2count: {点/边的名字: 个数}
                entity_count: {点的名字: 个数}
                edge_count: {边的名字: 个数}
                edge2pros: {边名: 属性个数}
                entity2pros: {实体名: 属性个数}
        '''
        code, databaselist = self.get_list()
        if code != 200:
            code = codes.Builder_GraphdbDao_Count_GraphDBConnectionError
            return code, 'GraphDBConnectionError'
        if db not in databaselist:
            return codes.Builder_GraphdbDao_Count_DBNameNotExitsError, 'DBNameNotExitsError'

        if self.type == 'orientDB':
            return self._count_orientdb(db)
        elif self.type == 'nebulaGraph':
            return self._count_nebula(db)

    def count(self, db):
        '''
        统计数据量
        
        Returns:
            code: 返回码
            res: 正确则返回以下字段
                edges: 边的总数
                entities: 点的总数
                name2count: {点/边的名字: 个数}
                entity_count: {点的名字: 个数}
                edge_count: {边的名字: 个数}
                edge2pros: {边名: 属性个数}
                entity2pros: {实体名: 属性个数}
        '''
        message = '开始统计数据量: {}'.format(db)
        Logger.log_info(message)
        code, databaselist = self.get_list()
        if code != 200:
            message = '图数据库连接失败'
            Logger.log_error(message)
            code = codes.Builder_GraphdbDao_Count_GraphDBConnectionError
            return code, {}
        if db not in databaselist:
            message = 'db {} 不存在'.format(db)
            Logger.log_error(message)
            code = codes.Builder_GraphdbDao_Count_DBNameNotExitsError
            return code, {}
        if self.type == 'orientDB':
            return self._count_orientdb(db)
        elif self.type == 'nebulaGraph':
            return self._count_nebula(db)

    def _count_orientdb(self, db):
        url = "http://" + self.address + ":" + self.port + "/database/" + db
        resp = requests.get(url, auth=(self.username, self.password))
        if resp.status_code != 200:
            code = codes.Builder_GraphdbDao_CountOrientdb_OrientdbRequestError
            cause = resp.content
            description = 'url: {}, error: {}'.format(url, cause)
            return code, {'cause': cause, 'description': description}
        try:
            # http码204
            resp = resp.json()
        except Exception as e:
            code = codes.Builder_GraphdbDao_CountOrientdb_OrientdbRequestError
            cause = str(e)
            description = 'url: {}, error: {}'.format(url, cause)
            return code, {'cause': cause, 'description': description}
        classes_infos = resp["classes"]
        edges, entities, name2count, entity_count, edge_count, edge2pros, entity2pros = 0, 0, {}, {}, {}, {}, {}
        if len(classes_infos) > 0:
            for class_info in classes_infos:
                name = class_info["name"]
                superclass = class_info["superClasses"]
                records = class_info["records"]
                if superclass in [["E"], ["V"]]:
                    name2count[name] = records
                    if superclass in [['V']]:
                        entity_count[name] = records
                    if superclass in [['E']]:
                        edge_count[name] = records
                    if "properties" in class_info:
                        if superclass == ["E"]:
                            edge2pros[name] = len(class_info["properties"]) - 2
                        else:
                            entity2pros[name] = len(class_info["properties"])
                elif name == "E":
                    edges = records
                elif name == "V":
                    entities = records
        res = edges, entities, name2count, entity_count, edge_count, edge2pros, entity2pros
        return codes.successCode, res

    def _count_nebula(self, db):
        code, statsres = self._nebula_exec('SHOW STATS', db)
        if code != 200:
            code = codes.Builder_GraphdbDao_CountNebula_NebulaExecError
            return code, {'cause': "nebula show stats failed",
                          'description': statsres.error_msg()}
        edges, entities, name2count, entity_count, edge_count, edge2pros, entity2pros = 0, 0, {}, {}, {}, {}, {}
        tag_names, edge_names = [], []
        for row_index in range(statsres.row_size()):
            row = statsres.row_values(row_index)
            if row[0].as_string() == 'Space':
                if row[1].as_string() == 'vertices':
                    entities = row[2].as_int()
                elif row[1].as_string() == 'edges':
                    edges = row[2].as_int()
            else:
                name2count[row[1].as_string()] = row[2].as_int()
                if row[0].as_string() == 'Tag':
                    tag_names.append(row[1].as_string())
                    entity_count[row[1].as_string()] = row[2].as_int()
                elif row[0].as_string() == 'Edge':
                    edge_names.append(row[1].as_string())
                    edge_count[row[1].as_string()] = row[2].as_int()
        for tag in tag_names:
            code, describe_res = self._nebula_exec('DESCRIBE TAG `{}`'.format(tag), db)
            if code != 200:
                code = codes.Builder_GraphdbDao_CountNebula_NebulaExecError
                return code, {'cause': "nebula describe tag {} failed".format(tag),
                              'description': describe_res.error_msg()}
            entity2pros[tag] = describe_res.row_size()
        for edge in edge_names:
            code, describe_res = self._nebula_exec('DESCRIBE EDGE `{}`'.format(edge), db)
            if code != 200:
                code = codes.Builder_GraphdbDao_CountNebula_NebulaExecError
                return code, {'cause': "nebula describe edge {} failed".format(edge),
                              'description': describe_res.error_msg()}
            edge2pros[edge] = describe_res.row_size()
        res = edges, entities, name2count, entity_count, edge_count, edge2pros, entity2pros
        message = '{} 统计数据量成功,结果为: {}'.format(db, res)
        Logger.log_info(message)
        return codes.successCode, res

    def submit_job_nebula(self, db, graphid, job='stats'):
        from utils.ConnectUtil import redisConnect
        code = 0
        res = ""
        try:
            code, res = self._nebula_exec('SUBMIT JOB {}'.format(job), db)
            # 图数据库断开连接异常 与 code不为200 做相同处理
            if code != 200:
                raise Exception(ExceptLevel.ERROR, 'Builder.graphDBDao.graphdb.nebulaExecError', 'nebula exec error')
        except Exception:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': "nebula connection disconnect",
                                   'message': "nebula submit job {} failed".format(job)}
                          }
            if res != "":
                self.state["meta"]["cause"] = res.error_msg()
            Logger.log_error(str(self.state))
            return code

        job_id = res.row_values(0)[0].as_int()
        rw = redisConnect.connect_redis("0", model="write")
        rw.hset('nebula_stats_job_id', db + '_' + str(graphid), job_id)
        rw.expire('nebula_stats_job_id', 86400)
        return code

    def job_status_nebula(self, db, graphid):
        """
        nebula job 运行状态
        Returns:
            已完成: True
            未完成: False
            失败: 抛异常
        """
        from utils.ConnectUtil import redisConnect
        read_conn = redisConnect.connect_redis(0, 'read')
        status = read_conn.exists("nebula_stats_job_id")
        if not status:
            return True
        job_id = read_conn.hget("nebula_stats_job_id", db + '_' + str(graphid))
        if not job_id:
            return True
        ngql = "show job {}".format(int(job_id.decode()))
        state_code, res = self._nebula_exec(ngql, db=db)
        if state_code != 200:
            raise GraphDBException((ExceptLevel.ERROR, 'Builder.dao.graphdb.nebulaExecError', str(res)))
        num = res.row_size()
        value = res.row_values(0)
        status = value[2].as_string()
        if status == 'FINISHED':
            return True
        for index in range(num):
            value = res.row_values(index)
            status = value[2].as_string()
            if status == 'FAILED':
                raise GraphDBException(
                    (ExceptLevel.ERROR, 'Builder.controller.graphdb.nebulaJobError', 'nebula job error'))
        return False

    def delete_edges(self, edge_class, starts, ends, db):
        """
        Args:
            edge_class: 边名
            starts: 起点sql/起点VID 列表
            ends: 终点sql/终点VID 列表
            db: 图数据库名
        """
        if self.type == 'orientDB':
            self._delete_edges_orientdb(edge_class, starts, ends, db)

        elif self.type == 'nebulaGraph':
            self._delete_edges_nebula(edge_class, starts, ends, db)

    def _delete_edges_nebula(self, edge_class, starts, ends, db):
        """nebula批量删除边

        Args:
            edge_class: 边的类型
            starts: 起始点的VID 列表
            ends: 终点的VID 列表
            db: 图数据库名
        """
        pairs = []
        for index, start in enumerate(starts):
            pair = '"{}" -> "{}"'.format(start, ends[index])
            pairs.append(pair)
        ngql = 'DELETE EDGE `{}` {}'.format(edge_class, ','.join(pairs))
        code, res = self._nebula_session_exec_(ngql, db)
        if code != 200:
            Logger.log_error(repr(res))

    def _delete_edges_orientdb(self, edge_class, starts, ends, db):
        '''orientdb删除边

        Args:
            edge_class: 边的类型
            starts: 选择起始点的sql语句
            ends: 选择终点的sql语句
            db: 图数据库名
        '''

        for index, start in enumerate(starts):
            end = ends[index]
            delete_sql = "DELETE EDGE FROM ({}) to ({}) WHERE @class = '{}'".format(start, end, edge_class)
            code, r_json = self._orientdb_http(delete_sql, db)
            if code != 200:
                Logger.log_error(r_json)

    def create_edges(self, edge_class, starts, ends, prop_val_sqls, db, fullindex, pro_index=None):
        """
        Args:
            edge_class: 边名
            start: 起点sql/起点VID 列表
            end: 终点sql/终点VID 列表
            prop_val_sql: orientdb: 第一项为赋值字符串列表 nebula: 第一项为属性列表,第二项为值列表
            db: 图数据库名
        """
        if self.type == 'orientDB':
            self._create_edges_orientdb(edge_class, starts, ends, prop_val_sqls, db)

        elif self.type == 'nebulaGraph':
            self._create_edges_nebula(edge_class, starts, ends, prop_val_sqls, db, fullindex, pro_index)

    def _create_edges_nebula(self, edge_class, starts, ends, prop_val_sqls, db, fullindex, pro_index):
        """nebula批量插入边

        Args:
            edge_class: 边名
            starts: 起始点的VID 列表
            ends: 终点的VID 列表
            prop_val_sqls: orientdb: 第一项为赋值字符串列表 nebula: 第一项为属性列表,第二项为值列表
            db: 图数据库名

        if self.type == 'orientDB':
            self._create_edge_orientdb(edge_class, start, end, prop_val_sql[0], db)
        elif self.type == 'nebulaGraph':
            self._create_edge_nebula(edge_class, prop_val_sql[0], start, end,prop_val_sql[1], db)
        """
        # t1=time.time()
        pairs = []
        for index, start in enumerate(starts):
            props = prop_val_sqls[index][0]
            values = prop_val_sqls[index][1]
            propsstr = ['`' + p + '`' for p in props]
            pair = '"{}" -> "{}" : ({})'.format(start, ends[index], ','.join(values))
            pairs.append(pair)

        ngql = 'INSERT EDGE `{}` ({}) VALUES \n{}'.format(edge_class, ','.join(propsstr), ",\n".join(pairs))

        code, res = self._nebula_session_exec_(ngql, db)
        if code != 200:
            Logger.log_error(repr(res))

    def _create_edges_orientdb(self, edge_class, starts, ends, set_sqls, db):
        '''orientdb插入边

        Args:
            edge_class: 边的类型
            start: 选择起始点的sql语句
            end: 选择终点的sql语句
            set_sql: 边的属性值sql语句list
            db: 图数据库名
        '''

        for index, start in enumerate(starts):
            end = ends[index]

            delete_sql = "DELETE EDGE FROM ({}) to ({}) WHERE @class = '{}'".format(start, end, edge_class)
            code, r_json = self._orientdb_http(delete_sql, db)
            create_sql = "create edge `{}` from ({}) to ({}) set {}".format(edge_class, start, end,
                                                                            " , ".join(set_sqls[index][0]))
            code, r_json = self._orientdb_http(create_sql, db)
            if code == 500 and "DuplicatedException" in r_json["errors"][0]["content"]:
                update_sql = "UPDATE  EDGE `{}` set out= ({}) ,in = ({}) , {} \
                                    UPSERT where out = ({}) and in = ({})" \
                    .format(edge_class, start, end, " , ".join(set_sqls[index][0]),
                            start, end)
                code, r_json = self._orientdb_http(update_sql, db)
                if code != 200:
                    Logger.log_error(r_json)

    def graph_entity_prop_empty(self, db, entity_name, otl_type, prop):
        """
        查询某个实体类的非空值数量,该查询可能非常耗时
        """
        if self.type == 'orientDB':
            code, res = self._orientdb_prop_empty(db, entity_name, otl_type, prop)
            if code != 200:
                return code, res
            count = res.get('result', list())[0].get('not_empty')
            return code, count
        code, res = self._nebula_prop_empty(db, entity_name, otl_type, prop)
        if code != 200:
            return code, res
        count = res.column_values('not_empty').pop(0).as_int()
        return code, count

    def _orientdb_prop_empty(self, db, entity_name, otl_type, prop):
        empty_value_list = """ ["","()","[]","{}"] """
        sql = f"""select count(*) as `not_empty` from `{entity_name}` where `{prop}` not in {empty_value_list} and `{prop}` is not null"""
        code, res = self._orientdb_http(sql, db)
        return code, res

    def _nebula_prop_empty(self, db, entity_name, otl_type, prop):
        if otl_type != "edge":
            otl_type = "vertex"
        empty_value_list = """ ["","()","[]","{}"] """
        sql = f"""lookup on `{entity_name}` where `{entity_name}`.`{prop}` not in {empty_value_list} 
                yield properties({otl_type}).`{prop}` as props | yield count(*) as not_empty"""
        code, res = self._nebula_session_exec_(sql, db)
        return code, res

    def drop_database(self, db):
        if self.type == 'orientDB':
            self._orientdb_drop_database(db)
        else:
            self._nebula_drop_database(db)

    def _orientdb_drop_database(self, db):
        url = 'http://' + self.address + ':' + str(self.port) + '/database/' + db
        r = requests.delete(url, auth=(self.username, self.password), timeout=30)
        if r.status_code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': str(r.text),
                                   'message': "graph_InfoExt failed"}
                          }
            Logger.log_error(str(self.state))

    def _nebula_drop_database(self, db):
        self._drop_fulltext_index_nebula('{}_*'.format(db))
        ngql = 'DROP SPACE IF EXISTS `{}`'.format(db)
        code, res = self._nebula_exec(ngql=ngql)
        if code != 200 or not res.is_succeeded():
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': res.error_msg(),
                                   'message': 'graph_InfoExt failed'}}
            Logger.log_error(str(self.state))

    def drop_vertex(self, db, entity):
        if self.type == 'nebulaGraph':
            return self._nebula_drop_vertex(db, entity)
        elif self.type == 'orientDB':
            return self._orientdb_drop_vertex(db, entity)

    def _nebula_drop_vertex(self, db, entity):
        # drop fulltext index
        index_name = db + "_" + entity
        self._drop_fulltext_index_nebula(index_name)
        # delete vertex
        ngql = f"LOOKUP ON `{entity}` YIELD id(vertex) AS id | DELETE VERTEX $-.id WITH EDGE"
        code, res = self._nebula_exec(ngql, db)
        if code != 200 or not res.is_succeeded():
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': res.error_msg(),
                                   'message': 'graph_InfoExt failed'}}
            Logger.log_error(str(self.state))
            return code, res
        # drop tag
        code, res = self._drop_class_nebula(db, entity, "tag")
        return code, res

    def _orientdb_drop_vertex(self, db, entity):
        drop_class_sql = "DELETE VERTEX `{}` ".format(entity)
        self._orientdb_http(drop_class_sql, db)
        code, res = self._drop_class_orientdb(db, entity)
        return code, res

    def drop_edge(self, db, edge):
        if self.type == 'nebulaGraph':
            return self._drop_class_nebula(db, edge, "edge")
        elif self.type == 'orientDB':
            return self._orientdb_drop_edge(db, edge)

    def _orientdb_drop_edge(self, db, edge):
        drop_class_sql = "DELETE EDGE `{}` ".format(edge)
        self._orientdb_http(drop_class_sql, db)
        code, res = self._drop_class_orientdb(db, edge)
        return code, res


class SQLProcessor:
    def __init__(self, dbtype) -> None:
        self.type = dbtype

    def vertex_sql_multi(self, batch, otl_tab, en_pro_dict, pro_merge, otl_name, ds_id=-1):
        '''多线程 将MongoDB中的实体转换成插入点的sql

        Args:
            batch: MongoDB中的一批实体
            otl_tab: {本体属性: 实体属性} {property_map.otl_prop: property_map.entity_prop, …}
            en_pro_dict: {实体名：{属性名：属性类型}}
            pro_merge: {实体名:{融合的属性: 融合方法}}
            otl_name: 本体名
        '''
        # 多线程
        # pool = ThreadPool(40)
        # 多进程
        # pool = multiprocessing.Pool(multiprocessing.cpu_count())
        partial_work = partial(self._vertex_sql_process, otl_tab=otl_tab,
                               en_pro_dict=en_pro_dict, pro_merge=pro_merge,
                               otl_name=otl_name, ds_id=ds_id)
        # batch_sql = pool.map(partial_work, batch)
        batch_sql = list(map(partial_work, batch))
        batch_sql = [i for i in batch_sql if i]  # 去除列表中为空的项
        if self.type == 'nebulaGraph':
            # 没数据则不执行ngql
            if not batch_sql:
                return None
            pros = []
            for k in otl_tab.keys():
                pros.append('`' + k + '`')
            pros.append('`_ds_id_`')
            pros.append('`_timestamp_`')
            batch_sql = 'INSERT VERTEX `{}` ({}) VALUES \n{}' \
                .format(otl_name,
                        ','.join(pros),
                        ',\n'.join(batch_sql))
        # pool.close()
        # pool.join()
        return batch_sql

    def _vertex_sql_process(self, batch_iter, otl_tab, en_pro_dict, pro_merge, otl_name, ds_id):
        """将MongoDB中实体 处理成sql
        orientdb的sql是列表,nebula是一整条句子,这里返回VID:(值)

        Args:
            batch_iter: MongoDB中的一项实体
            otl_tab: {本体属性: 实体属性}
            en_pro_dict: {实体名：{属性名：属性类型}}
            pro_merge: {实体名:[融合的属性]}
            otl_name: 本体名
            ds_id: 数据源id
        """
        process_class_sql = ""
        # batch_id = batch_iter['_id']
        row = batch_iter
        tab_val = []
        vals = []
        tab_val_index = [''] * len(pro_merge[otl_name])
        has_merge_pro = False
        for ot_tb in otl_tab:  # 本体属性
            tb_val = otl_tab[ot_tb]  # 实体属性
            valueExist = True
            if tb_val in row.keys():
                row_val_t = row.get(tb_val)  # 实体属性对应的值
                if tb_val in ["type_as", "type_sa", "type_kc", "type_nw"] and row_val_t == "false":
                    valueExist = False
                else:
                    if row_val_t is not None and not (isinstance(row_val_t, str) and row_val_t.strip() == ''):
                        if isinstance(row_val_t, float) and math.isnan(row_val_t):
                            valueExist = False
                        else:
                            otlvalue = type_transform(self.type, normalize_text(str(row_val_t)),
                                                      en_pro_dict[otl_name][ot_tb])
                            value_for_vid = normalize_text(str(row_val_t))
                            val = "%(otlpro)s=%(otlvalue)s" \
                                  % {"otlpro": "`" + ot_tb + "`",
                                     "otlvalue": otlvalue}
                            tab_val.append(val)
                            vals.append(otlvalue)
                            if otl_name in pro_merge:
                                merge_pros = pro_merge[otl_name]
                                if ot_tb in merge_pros:
                                    has_merge_pro = True
                                    if self.type == 'orientDB':
                                        tab_val_index[merge_pros.index(ot_tb)] = val
                                    elif self.type == 'nebulaGraph':
                                        tab_val_index[merge_pros.index(ot_tb)] = value_for_vid
                    else:
                        valueExist = False
            else:
                valueExist = False
            if not valueExist:
                tab_val.append("%(otlpro)s=%(otlvalue)s" \
                               % {"otlpro": "`" + ot_tb + "`",
                                  "otlvalue": default_value(self.type, en_pro_dict[otl_name][ot_tb])})
                vals.append(default_value(self.type, en_pro_dict[otl_name][ot_tb]))
        if tab_val:
            if ds_id != -1:
                tab_val.append('`_ds_id_`=\'' + str(ds_id) + '\'')
                vals.append('\'' + str(ds_id) + '\'')
            elif "_ds_id_" in row.keys():
                tab_val.append('`_ds_id_`=\'' + str(row["_ds_id_"]) + '\'')
                vals.append('\'' + str(row["_ds_id_"]) + '\'')
            else:
                vals.append(default_value(self.type, 'string'))
            ts = int(time.time())
            tab_val.append(" `_timestamp_` = " + str(ts))
            vals.append(str(ts))
            sql = ''
            if not has_merge_pro:
                return ''  # 融合属性没有值则跳过该点
            if tab_val_index:
                if self.type == 'orientDB':
                    sql = "UPDATE `{}` SET {} UPSERT WHERE {}" \
                        .format(otl_name,
                                ",".join(m for m in tab_val),
                                " and ".join(m for m in tab_val_index))
                elif self.type == 'nebulaGraph':
                    idval = otl_name + '_'
                    for m in tab_val_index:
                        idval += f'{m}_'
                    vid = get_md5(idval)
                    sql = '"{}":({})'.format(vid, ','.join(vals))
            else:
                # if self.type == 'orientDB':
                #     sql = "UPDATE `{}` SET {} UPSERT WHERE {}" \
                #         .format(otl_name,
                #                 ",".join(m for m in tab_val),
                #                 " and ".join(m for m in tab_val))
                # elif self.type == 'nebulaGraph':
                # 报错
                pass
                # idval = ''
                # for m in vals:
                #     idval += f'{m}_'
                # vid = get_md5(idval)
                # sql = '"{}":({})'.format(vid, ','.join(vals))
            process_class_sql = sql
        process_class_sql = re.sub('[\r|\n]*', "", process_class_sql)
        return process_class_sql

    def es_bulk_multi(self, db, otl_name, otl_tab, en_pro_dict, pro_merge, batch, delete=False):
        '''获取es批量插入的请求体

        Args:
            db: 数据库名
            otl_name: 本体名
            otl_tab: {本体属性: 实体属性}
            en_pro_dict: {实体名：{属性名：属性类型}}
            pro_merge: {实体名:[融合的属性]}
            batch: MongoDB中的一批实体
            delete: 为True时获取es批量删除请求体
        '''
        graphdb = GraphDB()
        code, res = graphdb._get_present_index_nebula(db)
        if code != 200:
            Logger.log_error(graphdb.state)
            return
        present_index_field, present_index_name, _, _ = res
        if otl_name.lower() not in present_index_name or otl_name.lower() not in present_index_field:
            state = {'state': 'FAILURE',
                     'meta': {'cause': "otlname '{}' not in present index.".format(otl_name.lower()),
                              'message': "get es_bulk_multi body failed."}}
            Logger.log_error(state)
        es_partial_work = partial(self._es_bulk_process, index_name=present_index_name[otl_name.lower()],
                                  index_props=present_index_field[otl_name.lower()], otl_tab=otl_tab,
                                  en_pro_dict=en_pro_dict, pro_merge=pro_merge, otl_name=otl_name, delete=delete)
        es_bulk_index = list(map(es_partial_work, batch))
        es_bulk_index = [i for i in es_bulk_index if i]
        return es_bulk_index

    def _es_bulk_process(self, batch_iter, index_name, index_props, otl_tab, en_pro_dict, pro_merge, otl_name, delete):
        '''获取es批量插入的请求体

        Args:
            batch_iter: MongoDB中的一项实体
            index_name: es的索引名
            index_props: 需插入索引的属性列表
            otl_tab: {本体属性: 实体属性}
            en_pro_dict: {实体名：{属性名：属性类型}}
            pro_merge: {实体名:[融合的属性]}
            otl_name: 本体名
        '''
        row = batch_iter
        vals = []
        tab_val_index = [''] * len(pro_merge[otl_name])
        has_merge_pro = False
        body_field = {}
        name_exists = False
        for ot_tb in otl_tab:  # 本体属性
            tb_val = otl_tab[ot_tb]  # 实体属性
            if tb_val in row.keys():
                row_val_t = row.get(tb_val)  # 实体属性对应的值
                if not (tb_val in ["type_as", "type_sa", "type_kc", "type_nw"] and row_val_t == "false"):
                    if row_val_t:
                        if not (isinstance(row_val_t, float) and math.isnan(row_val_t)):
                            otlvalue = type_transform(self.type, normalize_text_es(str(row_val_t)),
                                                      en_pro_dict[otl_name][ot_tb],
                                                      sql_format=False)
                            value_for_vid = normalize_text(str(row_val_t))
                            vals.append(otlvalue)
                            if otl_name in pro_merge:
                                merge_pros = pro_merge[otl_name]
                                if ot_tb in merge_pros:
                                    tab_val_index[merge_pros.index(ot_tb)] = value_for_vid
                                    has_merge_pro = True
                            if ot_tb in index_props:
                                body_field[ot_tb] = otlvalue
                            if ot_tb + "-vector" in index_props:
                                try:
                                    vec = self.get_vector({"texts": [otlvalue]})
                                    if vec.status_code == 200:
                                        body_field[ot_tb + "-vector"] = eval(vec.text)[0]
                                    else:
                                        Logger.log_error("向量生成接口异常1")
                                except Exception as e:
                                    try:
                                        if not isinstance(e, CircuitBreakerError):
                                            Logger.log_error(f"向量生成接口异常: {e.args[0]}")
                                    except Exception:
                                        pass

                        # todo 非浮点数处理方式
        vid = ''
        if not has_merge_pro:
            return ''  # 融合属性没有值则跳过该点
        if vals and tab_val_index:
            idval = otl_name + '_'
            for m in tab_val_index:
                idval += f"{m}_"
            vid = get_md5(idval)
        if delete:
            body_delete_index = {"delete": {"_index": index_name, "_id": vid}}
            return json.dumps(body_delete_index)
        body_index = {"index": {"_index": index_name, "_id": vid}}
        return json.dumps(body_index) + '\n' + json.dumps(body_field)

    @circuit(failure_threshold=5, recovery_timeout=600)
    def get_vector(self, json):
        response = requests.post(
            url=vector_url, json=json, timeout=3.0)
        if response.status_code != 200:
            time.sleep(1)
            Logger.log_error("get vector重试")
            retry_time = 3  # 接口有时不稳定，重试三次，每次间隔一秒
            while retry_time > 0:
                response = requests.post(
                    url=vector_url, json=json, timeout=3.0)
                retry_time -= 1
                if response.status_code == 200:
                    return response
            Logger.log_error("get vector错误:" + response.text)
            err = "get vector error: {}".format(response.content)
            raise Exception(err)
        return response

    def es_bulk_edge_multi(self, db, edge_name, batch, s_class, o_class, pro_merge):
        '''获取es批量插入边的请求体'''
        graphdb = GraphDB()
        code, res = graphdb._get_present_index_nebula(db)
        if code != 200:
            Logger.log_error(graphdb.state)
            return
        present_index_field, present_index_name, _, _ = res
        if edge_name.lower() not in present_index_name or edge_name.lower() not in present_index_field:
            state = {'state': 'FAILURE',
                     'meta': {'cause': "edgename '{}' not in present index.".format(edge_name.lower()),
                              'message': "get es_bulk_edge_multi body failed."}}
            Logger.log_error(state)
        es_partial_work = partial(self._es_bulk_edge_process, index_name=present_index_name[edge_name.lower()],
                                  index_props=present_index_field[edge_name.lower()], s_class=s_class, o_class=o_class,
                                  pro_merge=pro_merge)
        es_bulk_index = list(map(es_partial_work, batch))
        return '\n'.join(es_bulk_index) + '\n'

    def _es_bulk_edge_process(self, item, index_name, index_props, s_class, o_class, pro_merge):
        '''获取es批量插入边的请求体'''
        s, p, o, s_pro, p_pro, o_pro = item["s"], item["p"], item["o"], item["s_pro"], item["p_pro"], item["o_pro"]
        s_id = self.select_sql(s_class, property_dict=s_pro, merge_pro=pro_merge[s_class])
        o_id = self.select_sql(o_class, property_dict=o_pro, merge_pro=pro_merge[o_class])
        doc_id = s_id + '_' + o_id
        body_index = {"index": {"_index": index_name, "_id": doc_id}}
        body_field = {}
        for pro in index_props:
            if pro in p_pro:
                body_field[pro] = normalize_text_es(str(p_pro[pro]))
            else:
                body_field[pro] = ''
        return json.dumps(body_index) + '\n' + json.dumps(body_field)

    def prop_value_sql(self, entity_data=None, edge_otl_tab_pro=None, onedata=None, prop=None, value=None,
                       edge_class=None, edge_pro_dict=None):
        '''获取赋值sql
        如果onedata存在,将MongoDB数据中的需要的实体属性值dict转换为字符串list
        否则通过prop和value构造

        Args:
            entity_data: 实体类型
            edge_otl_tab_pro: 本体属性实体属性dict
            onedata: MongoDB的一项文档
            prop: 属性列表
            value: 值列表
            edge_class: 边名, 没有name属性值时则将属性name赋值为边名
            edge_pro_dict: {边名: {属性名: 属性类型}}

        Returns:
            orientdb只有返回值第一项有意义,为给属性赋值的字符串列表
            nebula返回值第一项为属性列表,第二项为值列表
        '''
        prop_val_sql = [[], []]
        if onedata:
            if entity_data != "" and len(edge_otl_tab_pro) != 0:
                for otl_pro, tab_pro in edge_otl_tab_pro.items():
                    # k: otl_pro v: tab_pro
                    if tab_pro in onedata:
                        if self.type == 'orientDB':
                            prop_val_sql[0].append(str(otl_pro) + "=" +
                                                   value_transfer(onedata[tab_pro],
                                                                  self.type,
                                                                  edge_pro_dict[edge_class][otl_pro]))
                        elif self.type == 'nebulaGraph':
                            prop_val_sql[0].append(str(otl_pro))
                            prop_val_sql[1].append(value_transfer(onedata[tab_pro],
                                                                  self.type,
                                                                  edge_pro_dict[edge_class][otl_pro]))
            if self.type == 'orientDB':
                prop_val_sql[0].append("`_timestamp_`=" + "'" + str(int(time.time())) + "'")
            elif self.type == 'nebulaGraph':
                prop_val_sql[0].append('_timestamp_')
                prop_val_sql[1].append(str(int(time.time())))
        else:
            if self.type == 'orientDB':
                for i in range(len(prop)):
                    prop_val_sql[0].append(prop[i] + '=' + '`' + value[i] + '`')
            elif self.type == 'nebulaGraph':
                prop_val_sql[0] = prop
                prop_val_sql[1] = value
        return prop_val_sql

    def select_sql(self, class_name, prop=None, value=None, property_dict=None, merge_pro=None, graphdb=None, db=None):
        '''构造选择点的语句
        orientdb返回select语句
        nebula返回点的VID

        Args:
            class_name: 类名
            prop: 属性名
            value: 值
            property_dict: 点的属性值dict
            merge_pro: 融合属性列表
            graphdb: 图数据库操作对象
            db: 图数据库名
        '''
        if not property_dict:  # 根据prop和value来构造sql语句
            if self.type == 'orientDB':
                sql = 'SELECT FROM `{}` WHERE `{}` = {}'.format(class_name, prop, value)
            elif self.type == 'nebulaGraph':
                ngql = 'LOOKUP ON `{}` where `{}`.`{}` == {} YIELD id(vertex)'.format(class_name, class_name, prop,
                                                                                      value)
                code, res = graphdb._nebula_exec(ngql, db)
                sql = []
                for i in range(res.row_size()):
                    sql.append(res.row_values(i)[0].as_string())
            return sql
        else:  # 根据property_dict来构造sql语句
            if self.type == 'orientDB':
                sql = 'select from `{}` where '.format(class_name)
                vals = []
                for pro in merge_pro:
                    if pro not in property_dict:
                        state = {'state': 'FAILURE',
                                 'meta': {
                                     'cause': "class_name {} does not has property {} in mongodb. mongodb property_dict: {}" \
                                         .format(class_name, pro, property_dict),
                                     'message': "contructing select sql failed"}}
                        Logger.log_error(state)
                    property_value = normalize_text(str(property_dict[pro]))
                    vals.append("`{}`='{}'".format(pro, property_value))
                sql += ' and '.join(vals)
            elif self.type == 'nebulaGraph':
                val = class_name + '_'
                for pro in merge_pro:
                    if pro not in property_dict:
                        state = {'state': 'FAILURE',
                                 'meta': {
                                     'cause': "class_name {} does not has property {} in mongodb. mongodb property_dict: {}" \
                                         .format(class_name, pro, property_dict),
                                     'message': "contructing select sql failed"}}
                        Logger.log_error(state)
                    property_value = normalize_text(str(property_dict[pro]))
                    val += "{}_".format(property_value)
                sql = get_md5(val)
            return sql

    def edge_sql_multi(self, s_class, o_class, edge_class, batch, edge_pro_dict, pro_merge):
        '''批量构造插入边的sql语句

        Args:
            s_class: 起点名
            o_class: 终点名
            edge_class: 边名
            batch: mongodo一批数据
            edge_pro_dict: {边名:{属性名:属性类型}}
            pro_merge: {实体名:[融合的属性]}
        '''
        partial_work = partial(self._edge_sql_process, s_class=s_class, o_class=o_class,
                               edge_class=edge_class, pro_merge=pro_merge, edge_pro_dict=edge_pro_dict)
        batch_sql = list(map(partial_work, batch))

        if self.type == 'orientDB':
            sql_list = []
            for data in batch_sql:
                sql_list.extend(data)
            return sql_list
        # 批量出来有创建语句和更新语句；创建语句批量一个错都错了。
        # batch_sql [[创建sql，更新],[创建sql，更新]]
        # 不使用内存转换 [[创建sql，创建sql],[更新，更新]]
        # batch_sql_t =list(map(list, itertools.zip_longest(*batch_sql)))
        # 使用内存转换 [[创建sql，创建sql],[更新，更新]]
        # batch_sql_t = list(map(list, zip(*batch_sql)))
        if self.type == 'nebulaGraph':
            prosstr = []
            for p in edge_pro_dict[edge_class].keys():
                prosstr.append('`' + p + '`')
            ngql = 'INSERT EDGE `{}` ({}) VALUES \n' \
                .format(edge_class, ','.join(prosstr))
            ngql += ', \n'.join(batch_sql)
            return ngql

    def _edge_sql_process(self, item, s_class, o_class, edge_class, pro_merge, edge_pro_dict):
        '''获取建边的sql

        Args:
            item: mongodb一项数据 dict
            s_class: 起点名
            o_class: 终点名
            edge_class: 边名
            pro_merge: {实体名:[融合的属性]}
            edge_pro_dict: {边名:{属性名:属性类型}}
        '''
        s, p, o, s_pro, p_pro, o_pro = item["s"], item["p"], item["o"], item["s_pro"], item["p_pro"], item["o_pro"]
        p_pro["_timestamp_"] = str(int(time.time()))
        if "_id" in s_pro:
            del s_pro["_id"]
        if "_id" in p_pro:
            del p_pro["_id"]
        if "_id" in o_pro:
            del o_pro["_id"]
        # s_class = s_class
        s_sql = self.select_sql(s_class, property_dict=s_pro, merge_pro=pro_merge[s_class])
        o_sql = self.select_sql(o_class, property_dict=o_pro, merge_pro=pro_merge[o_class])
        s_sql = re.sub('[\r|\n]*', "", s_sql)
        o_sql = re.sub('[\r|\n]*', "", o_sql)
        if self.type == 'orientDB':
            create_sql = [f"let $start_data ={s_sql}", f"let $end_data ={o_sql}"]
            delete_sql = f"delete edge from $start_data to $end_data where @class='{edge_class}'"
            create_sql.append(delete_sql)
            relation_create_sql = f"create edge {edge_class} from $start_data to $end_data"
            num = 0
            for pro in edge_pro_dict[edge_class]:
                if pro in p_pro:
                    pro_value = normalize_text(str(p_pro[pro]))
                    if num == 0:
                        if pro == "_timestamp_":
                            relation_create_sql += " , `{}`={} ".format(pro, str(pro_value))
                        else:
                            relation_create_sql += " set `{}`='{}' ".format(pro, str(pro_value))
                    else:
                        if pro == "_timestamp_":
                            relation_create_sql += " , `{}`={} ".format(pro, str(pro_value))
                        else:
                            relation_create_sql += " , `{}`='{}' ".format(pro, str(pro_value))
                    num += 1
            relation_create_sql += " RETRY 1000 WAIT 10"
            relation_create_sql = re.sub('[\r|\n]*', "", relation_create_sql)
            create_sql.append(relation_create_sql)
            return create_sql
        elif self.type == 'nebulaGraph':
            vals = []
            for pro in edge_pro_dict[edge_class]:
                if pro in p_pro:
                    pro_value = type_transform(self.type, normalize_text(str(p_pro[pro])),
                                               edge_pro_dict[edge_class][pro])
                    vals.append(pro_value)
                else:
                    vals.append(default_value(self.type, edge_pro_dict[edge_class][pro]))
            ngql = '"{}" -> "{}" : ({})' \
                .format(s_sql, o_sql, ','.join(vals))
            return ngql

    def delete_sql_multi(self, batch, otl_tab, en_pro_dict, pro_merge, otl_name):
        """将实体转换成删除点的VID

        Args:
            batch: MongoDB中的一批实体
            otl_tab: {本体属性: 实体属性} {property_map.otl_prop: property_map.entity_prop, …}
            en_pro_dict: {实体名：{属性名：属性类型}}
            pro_merge: {实体名:[融合的属性]}
            otl_name: 本体名
        """
        partial_work = partial(self._delete_vertex_sql_process, otl_tab=otl_tab,
                               en_pro_dict=en_pro_dict, pro_merge=pro_merge,
                               otl_name=otl_name)
        batch_sql = list(map(partial_work, batch))
        batch_sql = [i for i in batch_sql if i]  # 去除列表中为空的项
        if self.type == 'nebulaGraph':
            batch_sql = 'DELETE VERTEX {} WITH EDGE'.format(','.join(batch_sql))
        return batch_sql

    def _delete_vertex_sql_process(self, batch_iter, otl_tab, en_pro_dict, pro_merge, otl_name):
        """处理成删除sql
        orientdb的sql是列表,nebula是一整条句子,这里返回VID

        Args:
            batch_iter: MongoDB中的一项实体
            otl_tab: {本体属性: 实体属性}
            en_pro_dict: {实体名：{属性名：属性类型}}
            pro_merge: {实体名:{融合的属性: 融合方法}}
            otl_name: 本体名
        """
        process_class_sql = ""
        row = batch_iter
        tab_val = []
        vals = []
        tab_val_index = [''] * len(pro_merge[otl_name])
        for ot_tb in otl_tab:  # 本体属性
            tb_val = otl_tab[ot_tb]  # 实体属性
            valueExist = True
            if tb_val in row.keys():
                row_val_t = row[tb_val]  # 实体属性对应的值
                if tb_val in ["type_as", "type_sa", "type_kc", "type_nw"] and row_val_t == "false":
                    valueExist = False
                else:
                    if row_val_t:
                        if isinstance(row_val_t, float) and math.isnan(row_val_t):
                            valueExist = False
                        else:
                            otlvalue = type_transform(self.type, normalize_text(str(row_val_t)),
                                                      en_pro_dict[otl_name][ot_tb])
                            value_for_vid = normalize_text(str(row_val_t))
                            val = "%(otlpro)s=%(otlvalue)s" \
                                  % {"otlpro": "`" + ot_tb + "`",
                                     "otlvalue": otlvalue}
                            tab_val.append(val)
                            vals.append(otlvalue)
                            if otl_name in pro_merge:
                                merge_pros = pro_merge[otl_name]
                                if ot_tb in merge_pros:
                                    if self.type == 'orientDB':
                                        tab_val_index[merge_pros.index(ot_tb)] = val
                                    elif self.type == 'nebulaGraph':
                                        tab_val_index[merge_pros.index(ot_tb)] = value_for_vid
                    else:
                        valueExist = False
            else:
                valueExist = False
            if not valueExist:
                tab_val.append("%(otlpro)s=%(otlvalue)s" \
                               % {"otlpro": "`" + ot_tb + "`",
                                  "otlvalue": default_value(self.type, en_pro_dict[otl_name][ot_tb])})
                vals.append(default_value(self.type, en_pro_dict[otl_name][ot_tb]))
        if tab_val:
            if "_ds_id_" in row.keys():
                tab_val.append('`_ds_id_`=\'' + str(row["_ds_id_"]) + '\'')
                vals.append('\'' + str(row["_ds_id_"]) + '\'')
            else:
                vals.append(default_value(self.type, 'string'))
            ts = int(time.time())
            tab_val.append(" `_timestamp_` = " + str(ts))
            vals.append(str(ts))
            sql = ''
            if tab_val_index:
                if self.type == 'orientDB':
                    sql = "DELETE VERTEX `{}` WHERE {}".format(otl_name, " AND ".join(m for m in tab_val_index))
                elif self.type == 'nebulaGraph':
                    idval = otl_name + '_'
                    for m in tab_val_index:
                        idval += f'{m}_'
                    vid = get_md5(idval)
                    sql = f'"{vid}"'
            else:
                pass
            process_class_sql = sql
        process_class_sql = re.sub('[\r|\n]*', "", process_class_sql)
        return process_class_sql

    def get_vector_service_status(self):
        if vector_url == "":
            return 200, "Vector service not configured"
        try:
            vec = self.get_vector({"texts": ["test"]})
            if vec.status_code != 200:
                return 200, "Vector Service Exception"
            return 200, "success"
        except Exception:
            return 200, "Vector Service Exception"

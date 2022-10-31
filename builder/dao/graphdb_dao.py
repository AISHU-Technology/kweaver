# -*- coding:utf-8 -*-
import logging
import re
import requests

from common.exception.graphdb_exception import GraphDBException
from common.exception.base import ExceptLevel
from utils.CommonUtil import commonutil
from dao.task_dao import task_dao
from utils.log_info import Logger
from requests.auth import HTTPBasicAuth
import time
import os
import hashlib
from functools import partial
import math
import json
import multiprocessing

from nebula3.gclient.net import ConnectionPool
from nebula3.Config import Config as NebulaConfig
from common.errorcode.gview import Gview as Gview2
from common.errorcode import codes

requests.packages.urllib3.disable_warnings()

# index_len = os.getenv("INDEXLEN")  # nebula索引长度 
index_len = 15


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
            if db_type == "nebula":
                value = ' date("{}") '.format(value)
            elif db_type == 'orientdb':
                value = "'" + str(value) + "'"
        if type == "datetime":
            if db_type == "nebula":
                value = ' datetime("{}") '.format(value)
            elif db_type == 'orientdb':
                value = "'" + str(value) + "'"
        if type == 'boolean':
            if value.lower() not in ['true', 'false']:
                try:
                    value = str(bool(eval(value)))
                except Exception:
                    value = default_value(db_type, type)
    return str(value)


def gen_doc_vid(merge_entity_list, entity_name, one_data, en_pro_dict, gtype='nebula'):
    """
    计算图数据库点的vid, 兼容nebula和orientdb

    参数
        merge_entity_list: 融合属性字典
            demo: {"t_stock_percent_wide": {"name": "equality"}}
                t_stock_percent_wide： 抽取对象实体名
                name: 融合属性
                equality: 融合的方法
        entity_name: 抽取实体名
        one_data: 一个实体数据
        en_pro_dict: 属性字典
        gtype: 图数据库的名称，默认nebula

    """
    tab_val_index = []  # 属性列表
    for k, v in merge_entity_list[entity_name].items():
        value = type_transform(gtype, normalize_text(str(one_data[k])), en_pro_dict[entity_name]['pro_map'][k])
        if gtype == "orientdb":
            value = "  `{}` = '{}' ".format(k, normalize_text(str(one_data[k])))
        tab_val_index.append(value)

    if gtype == "orientdb":
        return 'SELECT FROM `{}` WHERE {}'.format(en_pro_dict[entity_name]['otl_name'], ','.join(tab_val_index))

    props_str = en_pro_dict[entity_name]['otl_name'] + '_'
    for m in tab_val_index:
        props_str += f'{m}_'
    return get_md5(props_str)


def data_type_transform(data_type: str):
    '''默认数据类型以orientdb为基础，部分数据类型需要兼容nebula，在此进行转换'''
    mapping = {'boolean': 'bool', 'decimal': 'float', 'integer': 'int'}
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
    text = re.sub(r"[\n\t]", " ", text)
    text = text.replace("\\", "\\\\")
    text = re.sub(r"[\"]", "\\\"", text)
    text = re.sub(r"[\']", "\\\'", text).strip()
    return text


def normalize_text_es(text):
    text = re.sub(r"[\n\t]", " ", text)
    text = text.replace("\\", "\\\\").strip()
    return text


class GraphDB(object):
    def __init__(self, graph_db_id):
        '''
        Args:
            graph_db_id: 图数据库id
        '''
        ret = task_dao.getGraphDBbyId(graph_db_id)
        rec_dict = ret.to_dict('records')
        self.state = {}
        if len(rec_dict) == 0:
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': "DB IP does not exist", 'message': "graph_InfoExt failed"}}
            print(self.state)
        rec_dict = rec_dict[0]
        address = rec_dict["ip"]
        port = rec_dict["port"]
        address = address.split(';')
        port = port.split(';')
        if len(address) != len(port):
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': "graphdb address or port error", 'message': "graph_InfoExt failed"}}
            print(self.state)
        self.address = address
        self.port = port
        self.username = rec_dict["db_user"]
        password = rec_dict["db_ps"]
        self.password = commonutil.DecryptBybase64(password)  # 密码解密
        if not password:
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': "orientDB password error!", 'message': "graph_InfoExt failed"}}
            print(self.state)
        self.type = rec_dict['type']
        fulltext_id = rec_dict['fulltext_id']
        if self.type == 'nebula':
            ret = task_dao.getFulltextEnginebyId(fulltext_id)
            rec_dict = ret.to_dict('records')[0]
            self.esaddress = rec_dict['ip']
            # DEBUG
            # self.esaddress  = os.getenv('RDSHOST')
            self.esport = rec_dict['port']
            self.esusername = rec_dict['user']
            self.espassword = rec_dict['password']
            self.espassword = commonutil.DecryptBybase64(self.espassword)

    def start_connect_pool(self):
        """
        添加链接池
        """
        if 'connection_pool' in self.__dict__:
            return
        host = []  # nebula数据地址和端口组成的列表，例：[('10.4.131.25', 9669), ('10.4.131.18', 9669), ('10.4.133.125', 9669)]
        for i in range(len(self.address)):
            host.append((self.address[i], self.port[i]))
        config = NebulaConfig()
        connection_pool = ConnectionPool()
        connection_pool.init(host, config)
        self.connection_pool = connection_pool

    def _nebula_session_exec_(self, ngql, db=None):
        self.start_connect_pool()
        logging.getLogger().setLevel(logging.WARNING)
        session = self.connection_pool.get_session(self.username, self.password)
        state_code = 200
        res = {}
        if db:
            res = session.execute('USE {}'.format(db))
            if not res.is_succeeded():
                print(ngql)
                print(res.error_msg())
                state_code = 500
        if ngql:
            ngql = re.sub('[\r\n]*', "", ngql)
            res = session.execute(ngql)
            if not res.is_succeeded():
                print(ngql)
                print(res.error_msg())
                state_code = 500
        session.release()
        return state_code, res

    def exec(self, sql, db):
        if self.type == 'orientdb':
            return self._orientdb_http(sql, db)
        elif self.type == 'nebula':
            return self._nebula_exec(ngql=sql, db=db)

    def exec_batch(self, sql, db):
        if self.type == 'orientdb':
            return self._orientdb_batch_http(sql, db)
        elif self.type == 'nebula':
            return self._nebula_exec(sql, db)

    def get_list(self):
        '''
            获取数据库列表
        '''
        if self.type == 'orientdb':
            try:
                url_listdatabase = "http://{}:{}/listDatabases".format(self.address[0], self.port[0])
                databases = requests.get(url=url_listdatabase, timeout=30)
                if databases.status_code != 200:
                    Logger.log_error("获取orientdb列表错误: {}".format(databases.json()))
                    return -1
                databaselist = databases.json()["databases"]
                return databaselist
            except Exception as e:
                Logger.log_error("获取orientdb列表错误：{}".format(repr(e)))
                return -1
        elif self.type == 'nebula':
            ngql = 'SHOW SPACES'
            code, res = self._nebula_exec(ngql=ngql)
            if code != 200 or not res.is_succeeded():
                Logger.log_error("获取nebula列表错误：{}".format(repr(res.error_msg())))
                return -1
            else:
                size = res.row_size()
                databaselist = [''] * size
                for i in range(size):
                    databaselist[i] = res.row_values(i)[0].as_string()
                return databaselist

    def check_db(self, dbname):
        '''
            检查数据库是否已存在，不存在则新建
        '''
        databaselist = self.get_list()
        if self.type == 'orientdb':
            if databaselist == -1:
                self.state = {'state': 'FAILURE',
                              'meta': {'cause': "orientDB database list get failed!",
                                       'message': "graph_InfoExt failed"}}
                print(self.state)
            else:
                self._check_orientdb(dbname, databaselist)
        elif self.type == 'nebula':
            if not re.match(r'^[a-zA-Z][a-zA-Z0-9]*$', dbname):
                self.state = {'state': 'FAILURE',
                              'meta': {
                                  'cause': "dbname must start with a letter and consist of letters, numbers. "
                                           "current dbname: {}".format(dbname),
                                  'message': "graph_InfoExt failed"}}
                print(self.state)
                return
            if databaselist == -1:
                self.state = {'state': 'FAILURE',
                              'meta': {'cause': "nebula database list get failed!",
                                       'message': "graph_InfoExt failed"}}
                print(self.state)
            else:
                if dbname not in databaselist:
                    self._create_db_nebula(dbname)

    def _orientdb_batch_http(self, sql, db):
        """
            orientdb批量执行sql语句
        """
        orient_url = "http://{}:{}/batch/{}".format(self.address[0], self.port[0], db)
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
        retry_count = 30
        request_mvcc = 0
        request_num = 0
        # 重试30次
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
                            print(f'mvcc error cause data loss')
                    else:
                        request_num += 1
                        if request_num >= retry_count:
                            print(f'write orientdb status:{or_res.status_code} error:{or_res.json()}')
                    continue
            except Exception as e:
                print(f'write orientdb error:{str(e)},sleep 1s,start retry')
                time.sleep(1)
        return 500, {}

    def _orientdb_http(self, sql, db):
        """
            orientdb执行sql语句
        Returns:
            code:成功为200
            message:执行结果
        """
        orient_url = "http://{}:{}/command/{}/sql".format(self.address[0], self.port[0], db)
        sql = re.sub('[\r|\n]*', "", sql)
        body = {"command": sql}
        headers = {"Connection": "close"}
        state_code = 200
        resmessage = {}

        # 重试10次
        for _ in range(10):
            try:
                or_res = requests.post(url=orient_url, headers=headers, json=body,
                                       auth=HTTPBasicAuth(self.username, self.password))
                if or_res.status_code == 500:
                    state_code = or_res.status_code
                    resmessage = or_res.json()
                    break
            except Exception as e:
                print(f'run orientdb sql error:{str(e)},sleep 1s retry')
            else:
                if or_res.status_code != 200:
                    print(sql)
                    print(or_res.json())
                return or_res.status_code, or_res.json()
        return state_code, resmessage

    def _nebula_exec(self, ngql, db=None):
        '''
            nebula执行ngql语句
        Returns:
            code: 成功则返回200,失败返回500
            res: 执行结果
        '''
        host = []  # nebula数据地址和端口组成的列表，例：[('10.4.131.25', 9669), ('10.4.131.18', 9669), ('10.4.133.125', 9669)]
        for i in range(len(self.address)):
            host.append((self.address[i], self.port[i]))
        config = NebulaConfig()
        connection_pool = ConnectionPool()
        connection_pool.init(host, config)
        logging.getLogger().setLevel(logging.WARNING)
        session = connection_pool.get_session(self.username, self.password)
        state_code = 200
        res = {}
        if db:
            res = session.execute('USE {}'.format(db))
            if not res.is_succeeded():
                print(ngql)
                print(res.error_msg())
                state_code = 500
        if ngql:
            ngql = re.sub('[\r|\n]*', "", ngql)
            res = session.execute(ngql)
            if not res.is_succeeded():
                print(ngql)
                print(res.error_msg())
                state_code = 500
        session.release()
        connection_pool.close()
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
            url = 'http://' + self.address[0] + ':' + str(self.port[0]) + '/database/' + dbname
            r = requests.get(url, auth=(self.username, self.password), timeout=30)
            if r.status_code != 200:
                # 新建orientdb数据库
                r = requests.post(
                    'http://' + self.address[0] + ':' + str(self.port[0]) + '/database/' + dbname + '/plocal',
                    auth=(self.username, self.password))
                if r.status_code != 200:
                    # orientDB 库被删了
                    if r.status_code == 500 and r.text.find("NoSuchFileException"):
                        self.state = {"state": "FAILURE",
                                      "meta": {'cause': "the databases does not exist",
                                               'message': "graph_InfoExt failed"}
                                      }
                        print(self.state)
                    else:
                        self.state = {"state": "FAILURE",
                                      "meta": {'cause': str(r.text),
                                               'message': "graph_InfoExt failed0"}
                                      }
                        print(self.state)
        else:  # 验证能不能建库
            r_exist = requests.post(
                'http://' + self.address[0] + ':' + str(self.port[0]) + '/database/' + "le0c1g2m0ofbst" + '/plocal',
                auth=(self.username, self.password))
            if r_exist.status_code != 200:
                requests.delete(
                    'http://' + self.address[0] + ':' + str(self.port[0]) + '/database/' + "le0c1g2m0ofbst" + '/plocal',
                    auth=(self.username, self.password))
                # orientDB 库被删了
                if r_exist.status_code == 500 and r_exist.text.find("NoSuchFileException"):
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': "the databases does not exist",
                                           'message': "graph_InfoExt failed"}
                                  }
                    print(self.state)
                else:
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': "the databases error",
                                           'message': "graph_InfoExt failed"}
                                  }
                    print(self.state)
            else:
                requests.delete(
                    'http://' + self.address[0] + ':' + str(self.port[0]) + '/database/' + "le0c1g2m0ofbst" + '/plocal',
                    auth=(self.username, self.password))

    def test_nebula_conn(self):
        try:
            host = []
            for i in range(len(self.address)):
                host.append((self.address[i], self.port[i]))
            config = NebulaConfig()
            connection_pool = ConnectionPool()
            connection_pool.init(host, config)
            connection_pool.close()
        except Exception as e:
            return False, str(e)
        return True, ""

    def _create_db_nebula(self, db):
        '''
            nebula创建数据库
        '''
        ngql = 'CREATE SPACE {} (partition_num = 30,replica_factor = 1,vid_type = FIXED_STRING(32))'.format(db)
        code, res = self._nebula_exec(ngql=ngql)
        if code != 200 or not res.is_succeeded():
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': res.error_msg(),
                                   'message': 'graph_InfoExt failed'}}
            print(self.state)
        # HEARTBEAT = 10  # 一个心跳周期
        # print('creating nebula space {}... please wait'.format(db))
        # time.sleep(2 * HEARTBEAT)

    def _check_db_nebula(self, db):
        # 检查nebula数据库是否存在, 不存在则等待
        HEARTBEAT = 10  # 一个心跳周期
        code, res = self._nebula_exec('', db)
        if code != 200 or (not res.is_succeeded() and 'SpaceNotFound' in res.error_msg()):
            print('creating nebula space {}... please wait'.format(db))
            time.sleep(2 * HEARTBEAT)
            databases = self.get_list()
            if db not in databases:
                self.state = {'state': 'FAILURE',
                              'meta': {'cause': 'nebula database "{}" does not exist.'.format(db),
                                       'message': 'nebula database "{}" does not exist.'.format(db)}}
                print(self.state)
                return code, res
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
        if self.type == 'orientdb':
            return self._get_present_index_orientdb(db)
        elif self.type == 'nebula':
            return self._get_present_index_nebula(db)

    def _get_present_index_orientdb(self, db):
        """获取orientdb中已存在的索引信息
        """
        index_query = "select expand(indexes) from metadata:indexmanager"
        code, re_index = self._orientdb_http(index_query, db)
        if code != 200:
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
        self._check_db_nebula(db)
        present_index_field = {}
        present_index_name = {}
        present_index_field_unique = {}
        present_index_name_unique = {}
        # es全文索引
        url = 'http://' + self.esaddress + ':' + str(self.esport) + '/' + db + '*'
        response = requests.get(url=url, auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
        if response.status_code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': response.content,
                                   'message': "get elasticsearch index failed"}
                          }
            print(self.state)
            return response.status_code, response.json()
        res = response.json()
        if len(res) == 0:
            print('dbname {} does not have fulltextindex.'.format(db))
        for index in res:
            entity_name = index[len(db) + 1:]
            present_index_field[entity_name] = list(res[index]['mappings']['properties'].keys())
            present_index_name[entity_name] = index
        # 原生索引
        code, tag_indexes = self._nebula_exec(ngql='SHOW TAG INDEXES', db=db)
        if code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': tag_indexes.error_msg(),
                                   'message': "get nebula tag index failed"}
                          }
            print(self.state)
            return code, tag_indexes
        if tag_indexes.row_size() > 0:
            for name, vertex_name, fields in tag_indexes:
                vertex_name = vertex_name.as_string()
                present_index_field_unique[vertex_name] = []
                for field in fields.as_list():
                    present_index_field_unique[vertex_name].append(field.as_string())
                present_index_name_unique[vertex_name] = name.as_string()
        code, edge_indexes = self._nebula_exec(ngql='SHOW EDGE INDEXES', db=db)
        if code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': tag_indexes.error_msg(),
                                   'message': "get nebula edge index failed"}
                          }
            print(self.state)
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
            code: 返回码
            data: {属性名: 属性类型}, name不存在则返回{}
        '''
        if self.type == 'orientdb':
            return self._get_properties_orientdb(db, otl_type, name)
        elif self.type == 'nebula':
            return self._get_properties_nebula(db, otl_type, name)

    def _get_properties_orientdb(self, db, otl_type, name):
        '''orientdb获取点/边的属性信息'''
        if otl_type == 'entity':
            otl_type = 'V'
        elif otl_type == 'edge':
            otl_type = 'E'
        url = "http://" + self.address[0] + ":" + self.port[0] + "/database/" + db
        resp = requests.get(url, auth=(self.username, self.password))
        if resp.status_code != 200:
            description = 'url: {} '.format(url)
            try:
                cause = str(resp.json().get('errors'))
            except Exception:
                cause = str(resp.content)
            description += cause
            code = codes.Builder_GraphdbDao_GetPropertiesOrientdb_OrientdbRequestError
            return code, Gview2.TErrorreturn(code,
                                             description=description,
                                             cause=cause)
        try:
            resp = resp.json()
        except Exception as e:
            cause = str(e)
            description = 'url: {} '.format(url)
            description += cause
            code = codes.Builder_GraphdbDao_GetPropertiesOrientdb_OrientdbRequestError
            return code, Gview2.TErrorreturn(code,
                                             description=description,
                                             cause=cause)
        classes = resp['classes']
        res = {}
        for aclass in classes:
            if aclass['name'] == name and aclass['superClass'] == otl_type:
                for prop in aclass['properties']:
                    res[prop['name']] = prop['type']
                break
        return codes.successCode, res

    def _get_properties_nebula(self, db, otl_type, name):
        '''nebula获取点/边的属性信息'''
        if otl_type == 'entity':
            otl_type = 'tag'
        ngql = 'describe {} `{}`'.format(otl_type, name)
        code, props_res = self._nebula_exec(ngql, db)
        if code != 200:
            if 'not existed' in props_res.error_msg():
                return codes.successCode, {}
            code = codes.Builder_GraphdbDao_GetPropertiesNebula_NebulaExecError
            return code, Gview2.TErrorreturn(code,
                                             description=props_res.error_msg(),
                                             cause='get nebula properties of {} {} failed'.format(otl_type, name))
        res = {}
        for i in range(props_res.row_size()):
            val = props_res.row_values(i)
            res[val[0].as_string()] = val[1].as_string()
        return codes.successCode, res

    def get_schema(self, db):
        '''获取点/边信息

        Returns:
            code: 返回码
            data: {'entity': [], 'edge': []}
        '''
        if self.type == 'orientdb':
            return self._get_schema_orientdb(db)
        elif self.type == 'nebula':
            return self._get_schema_nebula(db)

    def _get_schema_orientdb(self, db):
        url = "http://" + self.address[0] + ":" + self.port[0] + "/database/" + db
        resp = requests.get(url, auth=(self.username, self.password))
        if resp.status_code != 200:
            print(resp.content)
        try:
            resp = resp.json()
        except Exception as e:
            print(str(e))
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
        for i in range(res_tags.row_size()):
            res['entity'].append(res_tags.row_values(i)[0].as_string())
        code, res_edges = self._nebula_exec('show edges', db)
        for i in range(res_edges.row_size()):
            res['edge'].append(res_edges.row_values(i)[0].as_string())
        return 200, res

    def create_class(self, db, otl_name, otl_pro=None, en_pro_dict=None):
        '''创建点类
        创建本体点以及本体的属性,属性增加ds_id(string)、timestamp(double)

        Args:
            db: 数据库名
            otl_name: 本体名
            otl_pro: 本体属性列表
            en_pro_dict: {实体名:{属性名:属性类型}}
        Returns:
            code: 返回码,成功为200
            res:
        '''
        if self.type == 'orientdb':
            return self._create_class_orientdb(otl_name, otl_pro, en_pro_dict, db)
        elif self.type == 'nebula':
            return self._create_class_nebula(otl_name, otl_pro, en_pro_dict, db)

    def _create_class_orientdb(self, otl_name, otl_pro, en_pro_dict, db):
        v_class = "create class `{}` extends V".format(otl_name)
        code, res = self._orientdb_http(v_class, db)
        if code != 200:
            return code, res
        if not otl_pro or len(otl_pro) == 0:
            return 200, {}
        if otl_pro and len(otl_pro) != 0:
            for o_p in otl_pro:
                e_pro = "create property `{}`.`{}` {}".format(otl_name, o_p, en_pro_dict[otl_name][o_p])
                code, res = self._orientdb_http(e_pro, db)
                if code != 200:
                    return code, res
        address_pro = "create property `{}`.`{}` {}".format(otl_name, "ds_id", "string")
        code, res = self._orientdb_http(address_pro, db)
        if code != 200:
            return code, res
        address_pro = "create property `{}`.`{}` {}".format(otl_name, "timestamp", "DOUBLE")
        code, res = self._orientdb_http(address_pro, db)
        if code != 200:
            return code, res
        return 200, {}

    def _create_class_nebula(self, otl_name, otl_pro, en_pro_dict, db):
        self._check_db_nebula(db)
        create_tag = 'CREATE TAG IF NOT EXISTS `{}` '.format(otl_name)
        props = []
        if otl_pro and len(otl_pro) != 0:
            for o_p in otl_pro:
                props.append('`' + o_p + '` ' + data_type_transform(en_pro_dict[otl_name][o_p]))
            props.append('`ds_id` string')
            props.append('`timestamp` double')
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
        if self.type == 'orientdb':
            return self._drop_class_orientdb(db, otl_name)
        elif self.type == 'nebula':
            return self._drop_class_nebula(db, otl_name, class_type)

    def _drop_class_orientdb(self, db, otl_name):
        drop_class_sql = "DROP class  `{}` ".format(otl_name)
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
        ngql = 'DROP {} `{}`'.format(class_type, otl_name)
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
        if self.type == 'orientdb':
            return self._alter_class_orientdb(db, otl_name, op, **kw)
        elif self.type == 'nebula':
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

    def create_full_index(self, otl_name, prop_list, present_index_name, db, index_name=None):
        '''
        创建全文索引,已存在则删除旧的重建新的

        Args:
            otl_name: 本体名
            prop_list: 全文索引属性列表
            present_index_name: 已有的全文索引名称，每个类只有一项全文索引
            db: 数据库名
            index_name: 索引名, 'document_docfulltexindex'表示标注抽取的文档全文索引
        Returns:
            code: 成功返回200
            res:
        '''
        if self.type == 'orientdb':
            if not index_name:
                index_name = otl_name + '_fulltext'
            o_p_s = ",".join(["`" + pro + "`" for pro in prop_list])
            if otl_name.lower() in present_index_name:
                code, res = self._drop_index_orientdb(db, present_index_name[otl_name.lower()])
                if code != 200:
                    return code, res
            code, res = self._create_full_index_orientdb(db, index_name, otl_name, o_p_s)
            return code, res
        elif self.type == 'nebula':
            if not index_name:
                index_name = db + '_' + otl_name
            elif index_name == 'document_docfulltexindex':
                index_name = db + '_' + index_name
            if otl_name.lower() in present_index_name:
                code, res = self._drop_fulltext_index_nebula(present_index_name[otl_name.lower()])
                if code != 200:
                    return code, res
            code, res = self._create_full_index_nebula(index_name, prop_list)
            return code, res

    def drop_fulltext_index(self, db, index_name):
        if self.type == 'orientdb':
            return self._drop_index_orientdb(db, index_name)
        elif self.type == 'nebula':
            return self._drop_fulltext_index_nebula(index_name)

    def _drop_index_orientdb(self, db, index_name):
        drop_sql = "DROP INDEX " + "`" + index_name + "`"
        return self._orientdb_http(drop_sql, db)

    def _create_full_index_orientdb(self, db, index_name, otl_name, properties):
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
        response = requests.delete(url=url, auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
        if response.status_code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': response.content,
                                   'message': "delete elasticsearch index failed"}}
            print(self.state)
        return response.status_code, response.json()

    def _create_full_index_nebula(self, index_name, properties):
        # 获取节点数
        url = 'http://' + self.esaddress + ':' + str(self.esport) + '/_nodes'
        response = requests.get(url=url, auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
        if response.status_code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': response.content,
                                   'message': "getting opensearch node number failed"}
                          }
            print(self.state)
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
                "search_analyzer": "hanlp_standard"
            }
        body['mappings']['properties'] = fields
        response = requests.put(url=url, json=body, auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
        if response.status_code != 200:
            if response.json()['error']['type'] != 'resource_already_exists_exception':
                self.state = {"state": "FAILURE",
                              "meta": {'cause': response.content,
                                       'message': "create elasticsearch index failed"}
                              }
                print(self.state)
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
            if self.type == 'orientdb':
                properties = ",".join("`" + i + "`" for i in merge_pro)
                code, res = self._create_uni_index_orientdb(db, index_name, otl_name, properties)
                if otl_name in present_index_name_unique and code == 200:
                    self._drop_index_orientdb(db, present_index_name_unique[otl_name])
            elif self.type == 'nebula':
                if (otl_name in present_index_name_unique
                        and index_name != present_index_name_unique[otl_name]):
                    self._drop_index_nebula(db, present_index_name_unique[otl_name])
                self._create_tag_index_nebula(db, index_name, otl_name, merge_pro, pro_dict)
        if otl_name == "label":
            merge_pro = ["name", "ds_id"]
            index_name = otl_name + '_' + "_".join(i for i in merge_pro)
            if self.type == 'orientdb':
                properties = ",".join("`" + i + "`" for i in merge_pro)
                self._create_uni_index_orientdb(db, index_name, otl_name, properties)
                self._create_notuni_index_orientdb(db, 'label_name', 'label', 'name')
        if otl_name == "subject":
            merge_pro = ["name", "subject_id"]
            index_name = otl_name + '_' + "_".join(i for i in merge_pro)
            if self.type == 'orientdb':
                properties = ",".join("`" + i + "`" for i in merge_pro)
                self._create_uni_index_orientdb(db, index_name, otl_name, properties)
                self._drop_index_orientdb(db, 'subject_name')
                self._create_notuni_index_orientdb(db, 'subject_name', 'subject', 'name')

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
        if len(self.state) != 0:
            print(self.state)
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
        self._nebula_exec(edge_index, db)

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
            self.exec_batch(batch_sql, db)
            if self.type == 'nebula':
                url = 'http://{}:{}/_bulk'.format(self.esaddress, self.esport)
                headers = {'Content-Type': 'application/json'}
                response = requests.post(url=url, headers=headers, data=es_bulk_index,
                                         auth=HTTPBasicAuth(self.esusername, self.espassword), verify=False)
                if response.status_code != 200:
                    self.state = {"state": "FAILURE",
                                  "meta": {'cause': response.content,
                                           'message': "create elasticsearch index failed"}
                                  }
                    print(url)
                    print(es_bulk_index)
                    print(self.state)
        elif pro_value and pro_value_index:
            if self.type == 'orientdb':
                vertexsql = "UPDATE  `{}` SET {} UPSERT WHERE {}" \
                    .format(otl_name, ",".join(pro_value), " and ".join(pro_value_index))
                self._orientdb_http(vertexsql, db)
            elif self.type == 'nebula':
                vid = otl_name + '_'
                for v in values_index:
                    vid += f"'{v}'_"
                vid = get_md5(vid)
                propsstr = []
                for p in props:
                    propsstr.append('`' + p + '`')
                valuesstr = []
                for v in values:
                    valuesstr.append("'" + v + "'")
                ngql = 'INSERT VERTEX `{}` ({}) VALUES "{}" : ({})' \
                    .format(otl_name, ','.join(propsstr), vid, ','.join(valuesstr))
                self._nebula_session_exec_(ngql, db)
                # es插入索引
                code, res = self._get_present_index_nebula(db)
                if code != 200:
                    print(self.state)
                    return
                present_index_field, present_index_name, _, _ = res
                if otl_name.lower() not in present_index_name:
                    print('otl_name {} not in present_index_name. presen_index_name for db {} is {}' \
                          .format(otl_name.lower(), db, present_index_name))
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
                    print(self.state)

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
        if self.type == 'orientdb':
            if class_type == 'entity':
                class_type = 'V'
            elif class_type == 'edge':
                class_type = 'E'
            return self._check_schema_orientdb(db, name, props, class_type)
        elif self.type == 'nebula':
            if class_type == 'entity':
                class_type = 'tag'
            return self._check_schema_nebula(db, name, props, class_type)

    def _check_schema_orientdb(self, db, name, props, class_type):
        code, res = self._get_properties_orientdb(db, class_type, name)
        if code != codes.successCode:
            return code, res
        # name不存在
        if len(res) == 0:
            return codes.successCode, False
        # 属性不存在
        for prop in props:
            if prop not in res:
                return codes.successCode, False
        return codes.successCode, True

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
        return codes.successCode, True

    def create_edge_class(self, edge_class, edge_otl_pro, edge_pro_dict, db):
        '''创建边类
        创建边类及边的属性,属性增加timestamp(double)

        Args:
            edge_class: 边名
            edge_otl_pro: 边的属性列表
            edge_pro_dict: {边名:{属性名:属性类型}}
            db: 数据库名
        Returns:
            code: 成功返回200
            res:
        '''
        if self.type == 'orientdb':
            return self._create_edge_class_orientdb(edge_class, edge_otl_pro, edge_pro_dict, db)
        elif self.type == 'nebula':
            return self._create_edge_class_nebula(edge_class, edge_otl_pro, edge_pro_dict, db)

    def _create_edge_class_orientdb(self, edge_class, edge_otl_pro, edge_pro_dict, db):
        v_class = "create class `{}` extends E".format(edge_class)
        code, res = self._orientdb_http(v_class, db)
        if code == 500 and 'exists' in res['errors'][0]['content']:  # 重名的边不再重复创建
            return 200, {}
        for o_p in edge_otl_pro:
            e_pro = "create property `{}`.`{}` {}" \
                .format(edge_class,
                        o_p,
                        edge_pro_dict[edge_class][o_p])
            code, res = self._orientdb_http(e_pro, db)
            if code != 200:
                return code, res
        address_pro = "create property `{}`.`{}` {}" \
            .format(edge_class, "timestamp", "DOUBLE")
        code, res = self._orientdb_http(address_pro, db)
        return code, res

    def _create_edge_class_nebula(self, edge_class, edge_otl_pro, edge_pro_dict, db):
        self._check_db_nebula(db)
        create_edge = 'CREATE EDGE IF NOT EXISTS `{}`'.format(edge_class)
        props = []
        for o_p in edge_otl_pro:
            prop = '`' + o_p + '` ' + data_type_transform(edge_pro_dict[edge_class][o_p])
            props.append(prop)
        props.append('`timestamp` double')
        create_edge += '(' + ','.join(props) + ')'
        code, res = self._nebula_exec(create_edge, db)
        return code, res

    def create_edge_index(self, edge_class, edge_otl_pro, present_index_name, present_index_field,
                          pro_index, edge_pro_dict, db):
        if self.type == 'nebula':
            self._create_edge_index_nebula(db, edge_class + '_' + '_'.join(edge_otl_pro),
                                           edge_class, edge_otl_pro, edge_pro_dict[edge_class])
        # 创建全文索引
        if edge_class.lower() in present_index_name:
            present_field = present_index_field[edge_class.lower()]  # 已有索引的属性
            if isinstance(present_field, str):
                present_field = [present_field]  # 如果只有单个属性，将其包装成列表
            new_set = [i for i in present_field if i not in edge_otl_pro]  # 已有索引但不在edge_otl_pro中的属性
            for otl in pro_index[edge_class]:
                if otl not in new_set:
                    new_set.append(otl)  # 需要创建索引的属性和已有索引的属性的并集
            if not (edge_class == "document" and present_index_name[edge_class.lower()].endswiwh(
                    "document_docfulltexindex")):
                self.create_full_index(edge_class, new_set, present_index_name, db)
        else:
            self.create_full_index(edge_class, pro_index[edge_class], present_index_name, db)

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
        ngql = 'INSERT EDGE `{}` ({}) VALUES "{}" -> "{}" : ({})' \
            .format(edge_class, ','.join(propsstr), start, end, ','.join(values))
        self._nebula_exec(ngql, db)
        # 插入全文索引
        code, res = self._get_present_index_nebula(db)
        if code != 200:
            print(self.state)
            return
        present_index_field, present_index_name, _, _ = res
        if not edge_class.lower() in present_index_name:
            print('edge_class {} not in present_index_name'.format(edge_class.lower()))
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
            print(self.state)

    def create_edge(self, edge_class, start, end, prop_val_sql, db):
        '''
        Args:
            edge_class: 边名
            start: 起点sql/起点VID
            end: 终点sql/终点VID
            prop_val_sql: orientdb: 第一项为赋值字符串列表 nebula: 第一项为属性列表,第二项为值列表
            db: 图数据库名
        '''
        if self.type == 'orientdb':
            self._create_edge_orientdb(edge_class, start, end, prop_val_sql[0], db)
        elif self.type == 'nebula':
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
        print('开始重建索引')
        start_time = time.time()
        # 多进程 读取nebula数据，插入全文索引
        pool = multiprocessing.Pool(10)
        partial_work = partial(self._fulltext_rebuild_process, pro_index=tag_pro_index, db=db, class_type='vertex')
        pool.map(partial_work, tag_pro_index.keys())
        partial_work = partial(self._fulltext_rebuild_process, pro_index=edge_pro_index, db=db, class_type='edge')
        pool.map(partial_work, edge_pro_index.keys())
        pool.close()
        pool.join()
        end_time = time.time()
        print('重建索引结束，耗时{}s'.format(end_time - start_time))
        from utils.ConnectUtil import redisConnect
        redis = redisConnect.connect_redis("0", model="write")
        redis.set(f"rebuild_flag_{graphid}", 0, ex=86400)

    def _fulltext_rebuild_process(self, otl_name, pro_index, db, class_type):
        '''
        创建全文索引process
        
        Args:
            otl_name: 点/边名
            pro_index: {点/边名: 属性list}
            db: 数据库名
            class_type: 点/边: vertex/edge
        '''
        # 创建全文索引
        code, res = self.get_present_index(db)
        if code != 200:
            print(self.state)
            return
        _, present_index_name, _, _ = res
        self.create_full_index(otl_name, pro_index[otl_name], present_index_name, db)
        # 遍历nebula
        props = []
        for p in pro_index[otl_name]:
            props.append('properties({}).`{}`'.format(class_type, p))
        sql = '''LOOKUP ON `{}` yield {}'''.format(otl_name, ','.join((props)))
        code, data = self._nebula_exec(sql, db)
        if code != 200:
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': res.error_msg(),
                                   'message': 'nebula run ngql failed: {}'.format(sql)}}
            print(self.state)
            return
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
            j = 1
            if class_type == 'edge':
                j = 3
            for p in pro_index[otl_name]:
                body_field[p] = row[j].as_string()
                j += 1
            body.append(json.dumps(body_index) + '\n' + json.dumps(body_field))
        if body:
            body = '\n'.join(body) + '\n'
            self.fulltext_bulk_index(body)

    def fulltext_bulk_index(self, es_bulk_index_body):
        url = 'http://{}:{}/_bulk'.format(self.esaddress, self.esport)
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url=url, headers=headers, data=es_bulk_index_body,
                                 auth=HTTPBasicAuth(self.esusername, self.espassword),
                                 verify=False)
        if response.status_code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': response.content,
                                   'message': "create elasticsearch index failed"}
                          }
            print(url)
            print(es_bulk_index_body)
            print(self.state)

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
        databaselist = self.get_list()
        if databaselist == -1:
            code = codes.Builder_GraphdbDao_Count_GraphDBConnectionError
            return code, None
        if db not in databaselist:
            return codes.Builder_GraphdbDao_Count_DBNameNotExitsError, None

        if self.type == 'orientdb':
            return self._count_orientdb(db)
        elif self.type == 'nebula':
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
        databaselist = self.get_list()
        if databaselist == -1:
            code = codes.Builder_GraphdbDao_Count_GraphDBConnectionError
            return code, Gview2.TErrorreturn(code,
                                             cause='{} connection error'.format(db),
                                             description='{} connection error'.format(db))
        if db not in databaselist:
            code = codes.Builder_GraphdbDao_Count_DBNameNotExitsError
            return code, Gview2.TErrorreturn(code,
                                             db_name=db,
                                             graphdb_address=self.address,
                                             graphdb_port=self.port,
                                             graphdb_type=self.type)
        if self.type == 'orientdb':
            return self._count_orientdb(db)
        elif self.type == 'nebula':
            return self._count_nebula(db)

    def _count_orientdb(self, db):
        url = "http://" + self.address[0] + ":" + self.port[0] + "/database/" + db
        resp = requests.get(url, auth=(self.username, self.password))
        if resp.status_code != 200:
            code = codes.Builder_GraphdbDao_CountOrientdb_OrientdbRequestError
            cause = resp.content
            description = 'url: {}, error: {}'.format(url, cause)
            return code, Gview2.TErrorreturn(code,
                                             cause=cause,
                                             description=description)
        try:
            # http码204
            resp = resp.json()
        except Exception as e:
            code = codes.Builder_GraphdbDao_CountOrientdb_OrientdbRequestError
            cause = str(e)
            description = 'url: {}, error: {}'.format(url, cause)
            return code, Gview2.TErrorreturn(code,
                                             cause=cause,
                                             description=description)
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
            return code, Gview2.TErrorreturn(code,
                                             cause="nebula show stats failed",
                                             description=statsres.error_msg())
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
                return code, Gview2.TErrorreturn(code,
                                                 cause="nebula describe tag {} failed".format(tag),
                                                 description=describe_res.error_msg())
            entity2pros[tag] = describe_res.row_size()
        for edge in edge_names:
            code, describe_res = self._nebula_exec('DESCRIBE EDGE `{}`'.format(edge), db)
            if code != 200:
                code = codes.Builder_GraphdbDao_CountNebula_NebulaExecError
                return code, Gview2.TErrorreturn(code,
                                                 cause="nebula describe edge {} failed".format(edge),
                                                 description=describe_res.error_msg())
            edge2pros[edge] = describe_res.row_size()
        res = edges, entities, name2count, entity_count, edge_count, edge2pros, entity2pros
        return codes.successCode, res

    def submit_job_nebula(self, db, graphid, job='stats'):
        from utils.ConnectUtil import redisConnect
        code, res = self._nebula_exec('SUBMIT JOB {}'.format(job), db)
        if code != 200:
            self.state = {"state": "FAILURE",
                          "meta": {'cause': res.error_msg(),
                                   'message': "nebula submit job {} failed".format(job)}
                          }
            print(self.state)
            return
        job_id = res.row_values(0)[0].as_int()
        rw = redisConnect.connect_redis("0", model="write")
        rw.hset('nebula_stats_job_id', db + '_' + str(graphid), job_id)
        rw.expire('nebula_stats_job_id', 86400)

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

    def create_edges(self, edge_class, starts, ends, prop_val_sqls, db):
        """
        Args:
            edge_class: 边名
            start: 起点sql/起点VID
            end: 终点sql/终点VID
            prop_val_sql: orientdb: 第一项为赋值字符串列表 nebula: 第一项为属性列表,第二项为值列表
            db: 图数据库名
        """
        if self.type == 'orientdb':
            self._create_edges_orientdb(edge_class, starts, ends, prop_val_sqls, db)

        elif self.type == 'nebula':
            self._create_edges_nebula(edge_class, starts, ends, prop_val_sqls, db)

    def _create_edges_nebula(self, edge_class, starts, ends, prop_val_sqls, db):
        """nebula批量插入边

        Args:
            edge_class: 边的类型
            props: 边的属性 列表
            starts: 起始点的VID
            ends: 终点的VID
            values: 边的值 列表
            db: 图数据库名

        if self.type == 'orientdb':
            self._create_edge_orientdb(edge_class, start, end, prop_val_sql[0], db)
        elif self.type == 'nebula':
            self._create_edge_nebula(edge_class, prop_val_sql[0], start, end,prop_val_sql[1], db)
        """

        pairs = []
        for index, start in enumerate(starts):
            props = prop_val_sqls[index][0]
            values = prop_val_sqls[index][1]
            propsstr = ['`' + p + '`' for p in props]
            pair = '"{}" -> "{}" : ({})'.format(start, ends[index], ','.join(values))
            pairs.append(pair)

        ngql = 'INSERT EDGE `{}` ({}) VALUES {}'.format(edge_class, ','.join(propsstr), ",".join(pairs))
        code, res = self._nebula_session_exec_(ngql, db)
        if code != 200:
            print(repr(res))

        # 插入全文索引
        code, res = self._get_present_index_nebula(db)
        if code != 200:
            print(self.state)
            return
        present_index_field, present_index_name, _, _ = res
        if not edge_class.lower() in present_index_name:
            print('edge_class {} not in present_index_name'.format(edge_class.lower()))
            return

        body = []

        index_name = present_index_name[edge_class.lower()]
        index_fields = present_index_field[edge_class.lower()]

        for index, start in enumerate(starts):
            vid = start + '_' + ends[index]
            props = prop_val_sqls[index][0]

            body_field = {}
            for i in range(len(props)):
                if props[i] in index_fields:
                    body_field[props[i]] = values[i]

            body_index = {"index": {"_index": index_name, "_id": vid}}
            body.append(json.dumps(body_index) + '\n' + json.dumps(body_field))

        if body:
            body = '\n'.join(body) + '\n'
            self.fulltext_bulk_index(body)

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
                    print(r_json)

    def graph_entity_prop_empty(self, db, entity_name, otl_type, prop):
        """
        查询某个实体类的非空值数量,该查询可能非常耗时
        """
        if self.type == 'orientdb':
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


class SQLProcessor:
    def __init__(self, dbtype) -> None:
        self.type = dbtype

    def vertex_sql_multi(self, batch, otl_tab, en_pro_dict, merge_otls, otl_name):
        '''多线程 将MongoDB中的实体转换成插入点的sql

        Args:
            batch: MongoDB中的一批实体
            otl_tab: {本体属性: 实体属性} {property_map.otl_prop: property_map.entity_prop, …}
            en_pro_dict: {实体名：{属性名：属性类型}}
            merge_otls: {实体名:{融合的属性: 融合方法}}
            otl_name: 本体名
        '''
        # 多线程
        # pool = ThreadPool(40)
        # 多进程
        # pool = multiprocessing.Pool(multiprocessing.cpu_count())
        partial_work = partial(self._vertex_sql_process, otl_tab=otl_tab,
                               en_pro_dict=en_pro_dict, merge_otls=merge_otls,
                               otl_name=otl_name)
        # batch_sql = pool.map(partial_work, batch)
        batch_sql = list(map(partial_work, batch))
        batch_sql = [i for i in batch_sql if i]  # 去除列表中为空的项
        if self.type == 'nebula':
            pros = []
            for k in otl_tab.keys():
                pros.append('`' + k + '`')
            pros.append('`ds_id`')
            pros.append('`timestamp`')
            batch_sql = 'INSERT VERTEX `{}` ({}) VALUES {}' \
                .format(otl_name,
                        ','.join(pros),
                        ',\n'.join(batch_sql))
        # pool.close()
        # pool.join()
        return batch_sql

    def _vertex_sql_process(self, batch_iter, otl_tab, en_pro_dict, merge_otls, otl_name):
        """将MongoDB中实体 处理成sql
        orientdb的sql是列表,nebula是一整条句子,这里返回VID:(值)

        Args:
            batch_iter: MongoDB中的一项实体
            otl_tab: {本体属性: 实体属性}
            en_pro_dict: {实体名：{属性名：属性类型}}
            merge_otls: {实体名:{融合的属性: 融合方法}}
            otl_name: 本体名
        """
        process_class_sql = ""
        # batch_id = batch_iter['_id']
        row = batch_iter
        tab_val = []
        vals = []
        tab_val_index = []
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
                            val = "%(otlpro)s=%(otlvalue)s" \
                                  % {"otlpro": "`" + ot_tb + "`",
                                     "otlvalue": otlvalue}
                            tab_val.append(val)
                            vals.append(otlvalue)
                            if otl_name in merge_otls:
                                merge_pros = merge_otls[otl_name]
                                if ot_tb in merge_pros:
                                    if self.type == 'orientdb':
                                        tab_val_index.append(val)
                                    elif self.type == 'nebula':
                                        tab_val_index.append(otlvalue)
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
            if "ds_id" in row.keys():
                tab_val.append('`ds_id`=\'' + str(row["ds_id"]) + '\'')
                vals.append('\'' + str(row["ds_id"]) + '\'')
            else:
                vals.append(default_value(self.type, 'string'))
            ts = time.time()
            tab_val.append(" `timestamp` = " + str(ts))
            vals.append(str(ts))
            sql = ''
            if tab_val_index:
                if self.type == 'orientdb':
                    sql = "UPDATE `{}` SET {} UPSERT WHERE {}" \
                        .format(otl_name,
                                ",".join(m for m in tab_val),
                                " and ".join(m for m in tab_val_index))
                elif self.type == 'nebula':
                    idval = otl_name + '_'
                    for m in tab_val_index:
                        idval += f'{m}_'
                    vid = get_md5(idval)
                    sql = '"{}":({})'.format(vid, ','.join(vals))
            else:
                # if self.type == 'orientdb':
                #     sql = "UPDATE `{}` SET {} UPSERT WHERE {}" \
                #         .format(otl_name,
                #                 ",".join(m for m in tab_val),
                #                 " and ".join(m for m in tab_val))
                # elif self.type == 'nebula':
                # 报错
                print(
                    'missing merge properties, can\'t get nebula vid. otl_name: {}. batch_iter: {}'.format(otl_name,
                                                                                                           batch_iter))
                # idval = ''
                # for m in vals:
                #     idval += f'{m}_'
                # vid = get_md5(idval)
                # sql = '"{}":({})'.format(vid, ','.join(vals))
            process_class_sql = sql
        process_class_sql = re.sub('[\r|\n]*', "", process_class_sql)
        return process_class_sql

    def es_bulk_multi(self, db, otl_name, otl_tab, en_pro_dict, merge_otls, batch, graph_db_id):
        '''获取es批量插入的请求体

        Args:
            db: 数据库名
            otl_name: 本体名
            otl_tab: {本体属性: 实体属性}
            en_pro_dict: {实体名：{属性名：属性类型}}
            merge_otls: {实体名:{融合的属性: 融合方法}}
            batch: MongoDB中的一批实体
            graph_db_id: 图数据库id
        '''
        graphdb = GraphDB(graph_db_id)
        code, res = graphdb._get_present_index_nebula(db)
        if code != 200:
            print(graphdb.state)
            return
        present_index_field, present_index_name, _, _ = res
        if otl_name.lower() not in present_index_name or otl_name.lower() not in present_index_field:
            state = {'state': 'FAILURE',
                     'meta': {'cause': "otlname '{}' not in present index.".format(otl_name.lower()),
                              'message': "get es_bulk_multi body failed."}}
            print(state)
        es_partial_work = partial(self._es_bulk_process, index_name=present_index_name[otl_name.lower()],
                                  index_props=present_index_field[otl_name.lower()], otl_tab=otl_tab,
                                  en_pro_dict=en_pro_dict, merge_otls=merge_otls, otl_name=otl_name)
        es_bulk_index = list(map(es_partial_work, batch))
        return '\n'.join(es_bulk_index) + '\n'

    def _es_bulk_process(self, batch_iter, index_name, index_props, otl_tab, en_pro_dict, merge_otls, otl_name):
        '''获取es批量插入的请求体

        Args:
            batch_iter: MongoDB中的一项实体
            index_name: es的索引名
            index_props: 需插入索引的属性列表
            otl_tab: {本体属性: 实体属性}
            en_pro_dict: {实体名：{属性名：属性类型}}
            merge_otls: {实体名:{融合的属性: 融合方法}}
            otl_name: 本体名
        '''
        row = batch_iter
        vals = []
        tab_val_index = []
        body_field = {}
        name_exists = False
        for ot_tb in otl_tab:  # 本体属性
            tb_val = otl_tab[ot_tb]  # 实体属性
            if tb_val in row.keys():
                row_val_t = row[tb_val]  # 实体属性对应的值
                if not (tb_val in ["type_as", "type_sa", "type_kc", "type_nw"] and row_val_t == "false"):
                    if row_val_t:
                        if not (isinstance(row_val_t, float) and math.isnan(row_val_t)):
                            if ot_tb == 'name':
                                name_exists = True
                            otlvalue = type_transform(self.type, normalize_text_es(str(row_val_t)),
                                                      en_pro_dict[otl_name][ot_tb],
                                                      sql_format=False)
                            otlindexvalue = type_transform(self.type, normalize_text(str(row_val_t)),
                                                           en_pro_dict[otl_name][ot_tb],
                                                           sql_format=False)
                            vals.append(otlindexvalue)
                            if otl_name in merge_otls:
                                merge_pros = merge_otls[otl_name]
                                if ot_tb in merge_pros:
                                    tab_val_index.append(otlindexvalue)
                            if ot_tb in index_props:
                                body_field[ot_tb] = otlvalue
                        # todo 非浮点数处理方式
        if not name_exists:
            body_field['name'] = default_value(sql_format=False)
        vid = ''
        if vals and tab_val_index:
            idval = otl_name + '_'
            for m in tab_val_index:
                idval += f"'{m}'_"
            vid = get_md5(idval)
        else:
            # 报错
            print('missing merge properties, can\'t get nebula vid. otl_name: {}. batch_iter: {}.'.format(otl_name,
                                                                                                          batch_iter))
            return ''  # 融合属性没有值则跳过该点
        body_index = {"index": {"_index": index_name, "_id": vid}}
        return json.dumps(body_index) + '\n' + json.dumps(body_field)

    def es_bulk_edge_multi(self, db, edge_name, batch, graph_db_id, s_class, o_class, merge_otls):
        '''获取es批量插入边的请求体'''
        graphdb = GraphDB(graph_db_id)
        code, res = graphdb._get_present_index_nebula(db)
        if code != 200:
            print(graphdb.state)
            return
        present_index_field, present_index_name, _, _ = res
        if edge_name.lower() not in present_index_name or edge_name.lower() not in present_index_field:
            state = {'state': 'FAILURE',
                     'meta': {'cause': "edgename '{}' not in present index.".format(edge_name.lower()),
                              'message': "get es_bulk_edge_multi body failed."}}
            print(state)
        es_partial_work = partial(self._es_bulk_edge_process, index_name=present_index_name[edge_name.lower()],
                                  index_props=present_index_field[edge_name.lower()], s_class=s_class, o_class=o_class,
                                  merge_otls=merge_otls)
        es_bulk_index = list(map(es_partial_work, batch))
        return '\n'.join(es_bulk_index) + '\n'

    def _es_bulk_edge_process(self, item, index_name, index_props, s_class, o_class, merge_otls):
        '''获取es批量插入边的请求体'''
        s, p, o, s_pro, p_pro, o_pro = item["s"], item["p"], item["o"], item["s_pro"], item["p_pro"], item["o_pro"]
        s_id = self.select_sql(s_class, property_dict=s_pro, merge_pro=list(merge_otls[s_class].keys()))
        o_id = self.select_sql(o_class, property_dict=o_pro, merge_pro=list(merge_otls[o_class].keys()))
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
            name_exists = False
            if entity_data != "" and len(edge_otl_tab_pro) != 0:
                for otl_pro, tab_pro in edge_otl_tab_pro.items():
                    # k: otl_pro v: tab_pro
                    if tab_pro in onedata:
                        if otl_pro == 'name':
                            name_exists = True
                        if self.type == 'orientdb':
                            prop_val_sql[0].append(str(otl_pro) + "=" +
                                                   value_transfer(onedata[tab_pro],
                                                                  self.type,
                                                                  edge_pro_dict[edge_class][otl_pro]))
                        elif self.type == 'nebula':
                            prop_val_sql[0].append(str(otl_pro))
                            prop_val_sql[1].append(value_transfer(onedata[tab_pro],
                                                                  self.type,
                                                                  edge_pro_dict[edge_class][otl_pro]))
            if not name_exists:
                if self.type == 'orientdb':
                    prop_val_sql[0].append("`name`=" + "'" + str(edge_class) + "'")
                elif self.type == 'nebula':
                    prop_val_sql[0].append('name')
                    prop_val_sql[1].append("'" + str(edge_class) + "'")
            if self.type == 'orientdb':
                prop_val_sql[0].append("`timestamp`=" + "'" + str(time.time()) + "'")
            elif self.type == 'nebula':
                prop_val_sql[0].append('timestamp')
                prop_val_sql[1].append(str(time.time()))
        else:
            if self.type == 'orientdb':
                for i in range(len(prop)):
                    prop_val_sql[0].append(prop[i] + '=' + '`' + value[i] + '`')
            elif self.type == 'nebula':
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
            if self.type == 'orientdb':
                sql = 'SELECT FROM `{}` WHERE `{}` = {}'.format(class_name, prop, value)
            elif self.type == 'nebula':
                ngql = 'LOOKUP ON `{}` where `{}`.`{}` == {} YIELD id(vertex)'.format(class_name, class_name, prop,
                                                                                      value)
                code, res = graphdb._nebula_exec(ngql, db)
                sql = []
                for i in range(res.row_size()):
                    sql.append(res.row_values(i)[0].as_string())
            return sql
        else:  # 根据property_dict来构造sql语句
            if self.type == 'orientdb':
                sql = 'select from `{}` where '.format(class_name)
                vals = []
                for pro in merge_pro:
                    if pro not in property_dict:
                        state = {'state': 'FAILURE',
                                 'meta': {
                                     'cause': "class_name {} does not has property {} in mongodb. mongodb property_dict: {}" \
                                         .format(class_name, pro, property_dict),
                                     'message': "contructing select sql failed"}}
                        print(state)
                    property_value = normalize_text(str(property_dict[pro]))
                    vals.append("`{}`='{}'".format(pro, property_value))
                sql += ' and '.join(vals)
            elif self.type == 'nebula':
                val = class_name + '_'
                for pro in merge_pro:
                    if pro not in property_dict:
                        state = {'state': 'FAILURE',
                                 'meta': {
                                     'cause': "class_name {} does not has property {} in mongodb. mongodb property_dict: {}" \
                                         .format(class_name, pro, property_dict),
                                     'message': "contructing select sql failed"}}
                        print(state)
                    property_value = normalize_text(str(property_dict[pro]))
                    val += "'{}'_".format(property_value)
                sql = get_md5(val)
            return sql

    def edge_sql_multi(self, s_class, o_class, edge_class, batch, edge_pro_dict, merge_otls):
        '''批量构造插入边的sql语句

        Args:
            s_class: 起点名
            o_class: 终点名
            edge_class: 边名
            batch: mongodo一批数据
            edge_pro_dict: {边名:{属性名:属性类型}}
            merge_otls: {实体名:{融合的属性: 融合方法}}
        '''
        # pool = ThreadPool(500)
        # pool = multiprocessing.Pool(10)
        # partial_work = partial(process_class33, otl_tab=otl_tab,
        #                        en_pro_dict=en_pro_dict, merge_otls=merge_otls,
        #                        otl_name=otl_name)
        # batch_sql = pool.map(partial_work, batch)
        partial_work = partial(self._edge_sql_process, s_class=s_class, o_class=o_class,
                               edge_class=edge_class, merge_otls=merge_otls, edge_pro_dict=edge_pro_dict)
        batch_sql = list(map(partial_work, batch))

        if self.type == 'orientdb':
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
        if self.type == 'nebula':
            prosstr = []
            for p in edge_pro_dict[edge_class].keys():
                prosstr.append('`' + p + '`')
            ngql = 'INSERT EDGE `{}` ({}) VALUES ' \
                .format(edge_class, ','.join(prosstr))
            ngql += ', '.join(batch_sql)
            return ngql

    def _edge_sql_process(self, item, s_class, o_class, edge_class, merge_otls, edge_pro_dict):
        '''获取建边的sql

        Args:
            item: mongodb一项数据 dict
            s_class: 起点名
            o_class: 终点名
            edge_class: 边名
            merge_otls: {实体名:{融合的属性: 融合方法}}
            edge_pro_dict: {边名:{属性名:属性类型}}
        '''
        s, p, o, s_pro, p_pro, o_pro = item["s"], item["p"], item["o"], item["s_pro"], item["p_pro"], item["o_pro"]
        p_pro["timestamp"] = str(time.time())
        if "_id" in s_pro:
            del s_pro["_id"]
        if "_id" in p_pro:
            del p_pro["_id"]
        if "_id" in o_pro:
            del o_pro["_id"]
        # s_class = s_class
        s_sql = self.select_sql(s_class, property_dict=s_pro, merge_pro=list(merge_otls[s_class].keys()))
        o_sql = self.select_sql(o_class, property_dict=o_pro, merge_pro=list(merge_otls[o_class].keys()))
        s_sql = re.sub('[\r|\n]*', "", s_sql)
        o_sql = re.sub('[\r|\n]*', "", o_sql)
        if self.type == 'orientdb':
            create_sql = [f"let $start_data ={s_sql}", f"let $end_data ={o_sql}"]
            delete_sql = f"delete edge from $start_data to $end_data where @class='{edge_class}'"
            create_sql.append(delete_sql)
            relation_create_sql = f"create edge {edge_class} from $start_data to $end_data"
            num = 0
            for pro in edge_pro_dict[edge_class]:
                if pro in p_pro:
                    pro_value = normalize_text(str(p_pro[pro]))
                    if num == 0:
                        if pro == "timestamp":
                            relation_create_sql += " , `{}`={} ".format(pro, str(pro_value))
                        else:
                            relation_create_sql += " set `{}`='{}' ".format(pro, str(pro_value))
                    else:
                        if pro == "timestamp":
                            relation_create_sql += " , `{}`={} ".format(pro, str(pro_value))
                        else:
                            relation_create_sql += " , `{}`='{}' ".format(pro, str(pro_value))
                    num += 1
            relation_create_sql += " RETRY 1000 WAIT 10"
            relation_create_sql = re.sub('[\r|\n]*', "", relation_create_sql)
            create_sql.append(relation_create_sql)
            return create_sql
        elif self.type == 'nebula':
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

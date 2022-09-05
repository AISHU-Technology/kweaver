# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import sys
import os
import datetime
import time
import copy
import traceback
from functools import partial
import threading
from multiprocessing.pool import ThreadPool

import yaml
from requests.auth import HTTPBasicAuth

import requests
# from utils.ConnectUtil import redisConnect
from os import path
sys.path.append(os.path.abspath("../"))
from common.exception.base import ExceptLevel
from common.exception.celerytask_exception import CeleryTaskException
from utils.ConnectUtil import redisConnect, mongoConnect
from rabbitmq_utils.start_rabbitmq import rabbit_start_listening
from celery import Celery
from celery.contrib import rdb
from celery_flask_app import app
from utils.log_info import Logger
import ahocorasick
import itertools

sys.path.append(os.path.abspath("../"))
from utils.util import get_timezone, redislock
from spo.ie_flora import Extract_SPO #,SubjectModel,ObjectModel
from spo.train_flora import SubjectModel,ObjectModel

from contracrt_extract.extractor.multi_process_extract import MultiExtract
from ARModel.operation_maintenance_model import OperationMaintenanceModel
import pymongo
import math
import pandas as pd
from config import config as Config
from service.Otl_Service import otl_service
from utils.log_info import Logger
from utils.Otl_Util import otl_util
from utils.CommonUtil import commonutil
from utils.common_response_status import CommonResponseStatus
from utils import orientSoket
import pyorient
import json
from dao.document_dao import FileDownloadByGnsId, GetAnyshareFileTree, insert_to_mogodb, AsShareDocumentChangeModel, \
    AnyshareDocumentModel
from dao.dsm_dao import dsm_dao
from dao.otl_dao import otl_dao
from dao.graph_dao import graph_dao
from dao.kg_new_word.new_words_dao_v2 import NewWordsToMongo
from pymongo import MongoClient
from config import config
from urllib import parse
from celery.utils.log import get_task_logger

from dao.task_dao import task_dao
from dao.graphdb_dao import GraphDB, SQLProcessor, gen_doc_vid

logger = get_task_logger(__name__)

from controller.graph_count_controller import get_graph_count_all
import configparser
import re
from bson.objectid import ObjectId
import redis
from functools import partial
from multiprocessing.dummy import Pool as ThreadPool
from celery import schedules
import multiprocessing
from config.config import db_config_path
from dao.builder_dao import MongoBuildDao
from utils.ConnectUtil import HiveClient
import pymysql


# CELERY_BROKER_URL = 'redis://10.4.70.120:6379/1'
# # 要存储 Celery 任务的状态或运行结果时就必须要配置
# CELERY_RESULT_BACKEND = 'redis://10.4.70.120:6379/2'
# cel= Celery(app.name, broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND,include=[app.name])
# 初始化Celery
# cel = Celery(app.name,
#              broker=app.config['CELERY_BROKER_URL'],
#              broker_transport_options=app.config['CELERY_BROKER_TRANSPORT_OPTIONS'],
#              backend=app.config['CELERY_RESULT_BACKEND'],
#              result_backend_transport_options=app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS'],
#              include=[app.name])
# print(cel.conf)
# 初始化定时任务，默认为空
beat_schedule = {}
beat_scheduler = 'celery_task.celery_beat:DatabaseScheduler'
# The maximum number of seconds beat can sleep between checking the schedule.
# default: 0
beat_max_loop_interval = 10
with open(db_config_path, 'r') as f:
    yaml_config = yaml.load(f)
mariadb_config = yaml_config['mariadb']
ip = mariadb_config.get('host')
port = mariadb_config.get('port')
user = mariadb_config.get('user')
passwd = mariadb_config.get('password')
passwd=parse.quote_plus(passwd)
database = mariadb_config.get('database')
beat_dburi = f'mysql+mysqlconnector://{user}:{passwd}@{ip}:{port}/{database}'
beat_config = dict(
    beat_schedule=beat_schedule,
    beat_scheduler=beat_scheduler,
    beat_max_loop_interval=beat_max_loop_interval,
    beat_dburi=beat_dburi,
    timezone=get_timezone(),
    worker_max_tasks_per_child=10
)
redis_config = yaml_config['redis']
redis_cluster_mode = redis_config['mode']
print(redis_config)
if config.local_testing != True:
    if redis_cluster_mode == "sentinel":
        # 初始化Celery
        cel = Celery(app.name, broker=app.config['CELERY_BROKER_URL'],
                     broker_transport_options=app.config['CELERY_BROKER_TRANSPORT_OPTIONS'],
                     backend=app.config['CELERY_RESULT_BACKEND'],
                     result_backend_transport_options=app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS'],
                     include=[app.name])
        # print(cel.conf)

        # # 将Flask中的配置直接传递给Celery
        # cel.conf.update(app.config)
        print("-------------------------celery config -------------------------")
        print(cel.conf.broker_url)
        cel.conf.broker_transport_options = app.config['CELERY_BROKER_TRANSPORT_OPTIONS']
        print(cel.conf.broker_transport_options)
        print(cel.conf.result_backend)
        cel.conf.result_backend_transport_options = app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS']
        print(cel.conf.result_backend_transport_options)
        # cel.conf.update(app.config)
        cel.conf.update(beat_config)
        print("-------------------------app+cel config -------------------------")
        print(cel.conf.broker_url)
        print(cel.conf.broker_transport_options)
        print(cel.conf.result_backend)
        print(cel.conf.result_backend_transport_options)
    if redis_cluster_mode == "stand-alone":
        # 初始化Celery
        cel = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'],
                     include=[app.name])

        # 将Flask中的配置直接传递给Celery
        # cel.conf.update(app.config)
        cel.conf.update(beat_config)
else:
    # 初始化Celery
    cel = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'],
                 include=[app.name])

    # 将Flask中的配置直接传递给Celery
    cel.conf.update(app.config)
# print(cel.conf)
conn_db = mongoConnect.connect_mongo()

# # 将Flask中的配置直接传递给Celery
# cel.conf.update(app.config)
# print("-------------------------celery config -------------------------")
# print(cel.conf.broker_url)
# cel.conf.broker_transport_options = app.config['CELERY_BROKER_TRANSPORT_OPTIONS']
# print(cel.conf.broker_transport_options)
# print(cel.conf.result_backend)
# cel.conf.result_backend_transport_options = app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS']
# print(cel.conf.result_backend_transport_options)
# cel.conf.update(app.config)
# print("-------------------------app+cel config -------------------------")
# print(cel.conf.broker_url)
# print(cel.conf.broker_transport_options)
# print(cel.conf.result_backend)
# print(cel.conf.result_backend_transport_options)
# print(cel.conf)
# conn_db = mongoConnect.connect_mongo()


# conn = MongoClient('mongodb://'+celeryconfig.mongodb_add+':'+celeryconfig.mongodb_port+'/')
import configparser
import os
import re
from bson.objectid import ObjectId
import redis



class GeneralVariable(object):
    """
    存储全部通用的变量
    task_state: celery 的任务状态
    updategraph: general_variable.updategraph
    """

    def __init__(self):
        self.task_state = {}
        self.updategraph = False


# 读取配置文件
class Configure(object):
    def __init__(self, aspi_config_path="", config_ini_path=""):
        self.aspi_config_path = aspi_config_path
        if aspi_config_path and not os.path.exists(os.path.join(os.getcwd(), aspi_config_path)):
            Logger.log_info("配置文件：{}不存在".format(aspi_config_path))
        else:
            config = configparser.ConfigParser()
            config.read(aspi_config_path, "utf-8")
            self.esapi = config.get("es", "es_api")
        if config_ini_path and not os.path.exists(os.path.join(os.getcwd(), config_ini_path)):
            Logger.log_info("配置文件：{}不存在".format(config_ini_path))
        else:
            config1 = configparser.ConfigParser()
            config1.read(config_ini_path, encoding="utf-8")
            # 获取特定section
            extract_items = config1.items('extract')
            extract_items = dict(extract_items)

            self.configYaml = extract_items.get("configyaml", "")
            self.model = extract_items.get("model", "")
            self.stopwords_file = extract_items.get("stopwords_file", "")
            self.schema_file = extract_items.get("schema_english", "")
            self.process_num = int(extract_items.get("process_num", 1))


general_variable = GeneralVariable()

def buildACTree(data, prop):
    '''构造AC自动机
    将data中的数据prop属性的值加入到trie树中

    Args:
        data: 一组数据集合
        prop: 属性
    '''
    ACtree = ahocorasick.Automaton()
    if len(data) > 0:
        for index, onedata in enumerate(data):
            if prop in onedata:
                # Todo 加属性映射
                word = onedata[prop]
                if word:
                    ACtree.add_word(str(word), (index, str(word)))
    ACtree.make_automaton()
    return ACtree

def conndb():
    """
    连接mongodb数据库
    Args：
    Return：
        db: mongodb数据库连接
    """
    db = mongoConnect.connect_mongo()
    # db = conn[mongo_db]
    return db

def account_verify(address, port, username, password, graph_db_id):
    """
    用户、密码,网络连通性验证
    Args:
        address: orientdb ip
        port: orientdb 端口号
        username：用户名
        password：用户密码
        graph_db_id: 图数据库id
    Return：
        flag: bool, True or False
    """
    graphdb = GraphDB(graph_db_id)
    if graphdb.type == 'orientdb':
        flag = True
        dbname = "akdjshfureghfvkldsklgfj"
        headers = {"Connection": "close"}
        try:
            url = f"http://{address}:{port}/database/{dbname}/plocal"
            r_del = requests.delete(url, headers=headers, auth=(username, password), timeout=10)
            if r_del.status_code == 401:
                flag = False
        except Exception:
            flag = False
            Logger.log_error(f"ConnectTimeout: HTTPConnectionPool(host={address}, port={port})")
        return flag
    elif graphdb.type == 'nebula':
        code, msg = graphdb.test_nebula_conn()
        if not code:
            return False
        return True



def decrypt_base64(password):
    """
    base64 解密
    Args:
        password：被解密的密码， string
    Return：
        成功则返回解密后的密码；失败则返回None
    """
    try:
        password = commonutil.DecryptBybase64(password)
        return password
    except Exception as e:
        err = repr(e)
        Logger.log_error("base64密码解密失败：{}".format(err))
        return None


def create_mongodb_by_graph_name(conn_db, graph_mongo_Name, flag="full"):
    """
    根据图谱名称创建mongo数据库
    如果不是增量，删除collection；是增量，gnsinfo,.files,.chunks,empty_data不删除
    Args:
        conn_db: mongo连接
        mongodb name, baseInfo["graph_mongo_Name"]
        flag:是否是增量，增量：increment； 全量：full
    """
    # 根据图谱名称创建 mongodb数据库
    collection_names = conn_db.list_collection_names()
    # 获取数据库中所有的 collection 名称
    for collection_name in collection_names:
        # 保留主题信息
        if collection_name.startswith("document_index_"):
            continue
        if collection_name.startswith("subject_info_"):
            continue
        if flag == "increment" and collection_name in ["gnsInfo", graph_mongo_Name + ".files",
                                                       graph_mongo_Name + ".chunks", "empty_data"]:
            continue
        else:
            if graph_mongo_Name in collection_name:
                db_collection = conn_db[collection_name]  # 每个数据库包含多个集合，根据集合名称获取集合对象（Collection）
                db_collection.drop()
                Logger.log_info(
                    "is deleting mongo database {}, table {} is deleted".format(graph_mongo_Name, collection_name))


# 读取mysql数据
def readmysql(ip, port, database, user, password, tablename):
    import pandas as pd
    import pymysql
    dbconn = pymysql.connect(
        host=ip,
        database=database,
        user=user,
        password=password,
        port=port,
        charset='utf8'
    )
    sqlcmd = """select * from {} """.format(tablename)
    df = pd.read_sql(sqlcmd, dbconn)
    return df


def read_hive(data_ds, file_name):
    from utils.ConnectUtil import HiveClient
    from utils.CommonUtil import commonutil
    tablename = file_name
    ip = data_ds['ds_address']
    port = data_ds['ds_port']
    database = data_ds['ds_path']
    user = data_ds['ds_user']
    password = commonutil.DecryptBybase64(data_ds['ds_password'])
    hiveCli = HiveClient(ip, user, password, database, port)
    sql0 = """DESC `{}`"""
    sql0 = sql0.format(tablename)
    ret0 = hiveCli.query(sql0)
    resultlist = []
    headlist = [x[0] for x in ret0]
    resultlist.append(headlist)
    sql = "SELECT * FROM {}.`{}`"
    sql = sql.format(database, tablename)
    conn = hiveCli.conn

    return headlist, sql, conn


def readinfo(data_source, data_ds, file_name, file_source):
    if data_source == "as7":
        ds_address = data_ds['ds_address']
        gns = file_source
        keylist = ["extension", "content"]
        version = otl_dao.getversion(ds_address)
        ret_code, result = otl_dao.getinfofromas(data_ds, keylist, gns, version)
        if ret_code == 500:
            print("error : {}".format(file_name))
            return ret_code, result
        else:
            return ret_code, result
    elif data_source == "mysql":
        ip = data_ds['ds_address']
        port = data_ds['ds_port']
        database = data_ds['ds_path']
        user = data_ds['ds_user']
        from utils.CommonUtil import commonutil
        password = commonutil.DecryptBybase64(data_ds['ds_password'])
        tablename = file_name
        df = readmysql(ip, port, database, user, password, tablename)
        return 200, df
    elif data_source == "hive":
        from utils.ConnectUtil import HiveClient
        from utils.CommonUtil import commonutil
        tablename = file_name
        ip = data_ds['ds_address']
        port = data_ds['ds_port']
        database = data_ds['ds_path']
        user = data_ds['ds_user']
        password = commonutil.DecryptBybase64(data_ds['ds_password'])
        hiveCli = HiveClient(ip, user, password, database, port)
        sql0 = """DESC `{}`"""
        sql0 = sql0.format(tablename)
        ret0 = hiveCli.query(sql0)
        resultlist = []
        headlist = [x[0] for x in ret0]
        resultlist.append(headlist)
        sql = "SELECT * FROM {}.`{}`"
        sql = sql.format(database, tablename)
        ret = hiveCli.query(sql)
        for data in ret:
            linelist = [x for x in data]
            resultlist.append(linelist)

        df = pd.DataFrame(resultlist[1:], columns=resultlist[0])

        return 200, df


def get_rules(graph_InfoExt):
    """
    从每一条抽取信息中获取抽取规则
    Args:
        graph_InfoExt:一条抽取信息。graph_config_table中graph_InfoExt字段内容list元
    Return:
        data_source：数据来源，eg：mysql、as7、hive
        file_path：文件路径，eg：DataSet/公司产品知识库/04.AnyRobot/a.txt
        file_name：文件名称,
        file_source：文件对应gns
        ds_id：数据源id
        extract_type：提取类型，模型提取、标准提取, eg:modelExtraction
        rules: 抽取规则, dict, key:点或边名，value： key对应的属性名
        entity_type：点名
        extract_rules:抽取规则,list， 每一个属性抽取方式，eg：{'is_model': 'from_model', 'entity_type': 'folder', 'property': {'property_field': 'name', 'property_func': 'All'}}
    """
    data_source_set = set()
    entity_type = ""
    rules = {}  # {'entity2': {'sample_db': 'All'}, 'relation': {'sample_db': 'All'}, 'entity1': {'sample_db': 'All'}}

    data_source = graph_InfoExt["data_source"]
    data_source_set.add(data_source)
    file_path = graph_InfoExt["file_path"]
    file_name = graph_InfoExt["file_name"]
    file_source = graph_InfoExt["file_source"]
    ds_id = graph_InfoExt["ds_id"]
    extract_type = graph_InfoExt["extract_type"]

    extract_rules = graph_InfoExt["extract_rules"]
    for rule in extract_rules:
        entity_type = rule["entity_type"]
        properties = rule["property"]
        f_f = []  # 属性规则
        property_field = properties["property_field"]
        f_f.append(property_field)
        if entity_type not in rules.keys():
            rules[entity_type] = f_f
        else:
            new = []
            en = rules[entity_type]
            new.append(property_field)
            rules[entity_type] = new + en
    return data_source, file_path, file_name, file_source, ds_id, extract_type, rules, entity_type, extract_rules, data_source_set


def standard_extract(conn_db, graph_mongo_Name, graph_used_ds, data_source, ds_id, file_name, file_source, rules,
                     graph_KMerge, entity_type):
    """
    标准抽取, standardExtraction，处理数据加入mongodb
    Args：
        conn_db: mongodb数据库，根据根据图谱名称创建的
        graph_mongo_Name:
        graph_used_ds：本体和抽取中使用的数据源详细信息
        data_source: 数据来源，mysql、as7、hive
        ds_id: 数据源id
        file_name: 文件名称
        file_source: 文件对应gns
        rules: 抽取规则 {文件名: 属性列表}
        graph_KMerge: 融合属性，在monogo中用于构建唯一索引
        entity_type: 点名, 即文件名
    """
    ret_code = CommonResponseStatus.SUCCESS.value
    for used_ds in graph_used_ds:
        if ds_id == used_ds["id"]:
            print(f'创建mongodb集合:{entity_type}')
            collection = conn_db[graph_mongo_Name + "_" + entity_type]

            data_ds = used_ds
            if data_source != "hive":
                ret_code, data = readinfo(data_source, data_ds, file_name, file_source)
                if ret_code != CommonResponseStatus.SUCCESS.value:
                    # 仅token错误时才中止任务，读取文件发生错误仍继续运行
                    if (data.get('code') and
                            (data.get('code') == CommonResponseStatus.UNVERIFY_ERROR.value or
                             data.get('code') == CommonResponseStatus.TOKEN_OVERDUE_ERROR.value)):
                        return ret_code, data
                    else:
                        ret_code = CommonResponseStatus.SUCCESS.value

            print(f'创建mongodb集合:{entity_type} 唯一索引')
            create_mongo_index(graph_mongo_Name, entity_type, graph_KMerge)

            entity_rules = rules[entity_type]
            if len(entity_rules) <= 0:
                raise BaseException(f'{entity_type} 提取规则为空')

            if data_source == "mysql":
                transfer = MysqlTransfer(file_name, used_ds, entity_rules, ds_id, collection)
                transfer.run()
            if data_source == "hive":
                transfer = HiveTransfer(file_name, used_ds, entity_rules, ds_id, collection)
                transfer.run()
            if data_source == "as7":
                transfer = ASTransfer(file_name, file_source, used_ds, rules, ds_id, collection)
                transfer.run()

    return ret_code, 'standard_extract success'

def normalize_text(text):
    text = re.sub(r"[\n\t\'\"]", " ", text)
    text = text.replace("\\", "\\\\").strip()
    return text


def labelExtraction(graph_KMerge, graph_used_ds, data_source, ds_id, file_name, file_source,
                    graph_db_id, graph_name, graph_id, port, username, password, pro_index):
    """
    标注抽取，labelExtraction
    Args：
        graph_KMerge：graph_config_table表中graph_KMerge字段内容
        graph_used_ds：使用过的数据源
        data_source: 数据来源，mysql、as7、hive
        ds_id: 数据源id
        file_name: 文件名称
        file_source: 文件对应gns
        graph_db_id: 图数据库id
        graph_name: 图谱名称, baseInfo["graph_DBName"]
        graph_id：图谱id
        port：端口号
        username：用户名
        password：用户密码
        pro_index：属性索引，dict
    """
    merge_otls = {}
    graphdb = GraphDB(graph_db_id)
    for gme in graph_KMerge:
        merge_flag = gme["status"]
        entity_classes = gme["entity_classes"]
        for ec in entity_classes:
            otl_n = ec["name"]  # 类
            otl_pro = ec["properties"]
            merge_pro = {}
            for op in otl_pro:
                ft = op['function']  # 融合的方法
                ft_pro = op['property']  # 融合的属性
                merge_pro[ft_pro] = ft
            merge_otls[otl_n] = merge_pro
    for used_ds in graph_used_ds:
        if ds_id == used_ds["id"]:
            data_ds = used_ds
            ret_code, data = readinfo(data_source, data_ds, file_name, file_source)
            file_content = data["content"]
            alldata = json.loads(file_content)
            otldata = alldata["ontology_info"]
            graphdb.create_class(graph_name, 'document')
            hash_index = []
            index_pro = []
            for entity in otldata["entity"]:
                entityname = entity["name"]
                entitypro = entity["properties"]
                otl_pro = []
                en_pro_dict = {entityname: {}}
                for pro in entitypro:
                    otl_pro.append(pro[0])
                    en_pro_dict[entityname][pro[0]] = pro[1]
                graphdb.create_class(graph_name, entityname, otl_pro, en_pro_dict)
                if entityname == "document":
                    index_pro = [pro[0] for pro in entitypro]
                    # index_sql = 'create index `{}`.`fulltextindex`
                    # `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                    #     entityname, entityname, ",".join([pro[0] for pro in entitypro]))
                    # oriendb_http(address, mongo_db, index_sql, graph_id,port,username,password)
                if entityname != "document":
                    edge_class = entityname + '2document'
                    edge_otl_pro = ['name']
                    edge_pro_dict = {edge_class: {'name': 'string'}}
                    graphdb.create_edge_class(edge_class, edge_otl_pro, edge_pro_dict, graph_name)
                if merge_flag and entityname in merge_otls:
                    merge_pro = []  # 属性列表
                    for k, v in merge_otls[entityname].items():
                        merge_pro.append(k)
                    if entityname != 'document':
                        graphdb.create_uni_index(entityname, merge_pro, {}, graph_name, en_pro_dict[entityname])
                    else:
                        hash_index = merge_pro
            for edge in otldata["edge"]:
                edgename = edge["name"]
                edgepro = edge["properties"]
                edge_otl_pro = []
                edge_pro_dict = {edgename: {}}
                for pro in edgepro:
                    edge_otl_pro.append(pro[0])
                    edge_pro_dict[edgename][pro(0)] = [pro[1]]
                graphdb.create_edge_class(edgename, edge_otl_pro, edge_pro_dict, graph_name)
                # index_sql = 'create index `{}`.`fulltexindex` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                #     edgename, edgename, ",".join([pro[0] for pro in edgepro]))
                # oriendb_http(address, mongo_db, index_sql, graph_id,port,username,password)
            documentdata = alldata["label_info"]
            if graphdb.type == 'nebula':
                print('label extraction waiting for nebula create schema. please wait...')
                time.sleep(20)
            for aa in documentdata:
                document = aa["document_info"]
                # document={"doc_path":"1-售前方案与POC测试\AnyShare 3.5 私有云盘解决方案模板.docx","name":"AnyShare 3.5 私有云盘解决方案模板.docx","gns":"gns://0FF0245EA0544F978A133B3A08FC4E90/5852E4CBA3BD4F5CB384D06B417813DD/F3590DFAD4FC4597AE7A80CB37C90802/882B5BB1DF5044BEB0A49E40B8CF9799/98C0F20BCA434F0C9B5DEA737DE8ABAC/182CA47DC1244C3CABAB3A1112B6EB8D/09B9DB1B02464242B638C4E8576A3F94"}
                doc_full_index = []
                doc_props = []
                doc_values = []
                doc_values_index = []
                doc_provalue = []
                pro = []
                pro_dict = {"document": {}}
                for k, v in document.items():
                    if k == "doc_path":
                        k = "path"
                    if k == "doc_gns":
                        k = "gns"
                    if k == "doc_name":
                        k = "name"
                    pro_v = '`' + k + '`' + '=' + '"' + normalize_text(v) + '"'
                    pro.append(k)
                    pro_dict['document'][k] = 'string'
                    doc_full_index.append(k)
                    doc_props.append(k)
                    doc_values.append('"' + normalize_text(v) + '"')
                    if k == 'path':
                        doc_values_index.append('"' + normalize_text(v) + '"')
                    doc_provalue.append(pro_v)
                graphdb.alter_class(graph_name, 'document', otl_pro=pro, en_pro_dict=pro_dict)
                hash_index.extend(["gns"])
                merge_pro = set(hash_index)
                pro_dict = {}
                for pro in merge_pro:
                    pro_dict[pro] = 'string'
                graphdb.create_uni_index('document', merge_pro, {}, graph_name, pro_dict)
                # index_pro.extend(["ds_address", "doc_gns", "doc_path", "doc_name"])

                doc_full_index.extend(index_pro)
                graphdb.create_full_index('document', set(doc_full_index), {}, graph_name, index_name='document_docfulltexindex')
                graphdb.create_vertex(graph_name, otl_name='document', props=doc_props, values=doc_values,
                                      values_index=doc_values_index, pro_value=doc_provalue, pro_value_index=doc_provalue)
                pos_info = aa["pos"]
                for one in pos_info:
                    begainpro_value = []
                    begainpro_value_index = []
                    endpro_value = []
                    endpro_value_index = []
                    relpro_value = []
                    sqlProcessor = SQLProcessor(graphdb.type)
                    if "entity_class" in one["begin_entity"]:
                        begin_entity = one["begin_entity"]["entity_class"]
                        if "property" in one["begin_entity"]:
                            begin_property = one["begin_entity"]["property"]
                            props = []
                            values = []
                            for k, v in begin_property.items():
                                pro_v = '`' + k + '`' + "=" + '"' + normalize_text(v) + '"'
                                props.append(k)
                                values.append(normalize_text(v))
                                begainpro_value.append(pro_v)
                                if k in pro_index[begin_entity]:
                                    pro_v = '`' + k + '`' + "=" + '"' + normalize_text(v) + '"'
                                    begainpro_value_index.append(pro_v)
                            graphdb.create_vertex(graph_name, otl_name=begin_entity, props=props, values=values,
                                                values_index=values, pro_value=begainpro_value, 
                                                  pro_value_index=begainpro_value_index)
                            if begin_entity != "document":
                                start_sql = sqlProcessor.select_sql(begin_entity, property_dict=begin_property,
                                                                    merge_pro=list(merge_otls[begin_entity].keys()))
                                end_sql = sqlProcessor.select_sql('document', prop='path',
                                                                  value='"'+normalize_text(document["doc_path"])+'"',
                                                                  graphdb=graphdb,
                                                                  db=graph_name)
                                prop_val_sql = sqlProcessor.prop_value_sql(prop=['name'], value=['"' + begin_entity + "2document" + '"'])
                                if isinstance(end_sql, list):
                                    for end_sql_i in end_sql:
                                        graphdb.create_edge(begin_entity + "2document", start_sql, end_sql_i,
                                                            prop_val_sql, graph_name)
                                else:
                                    graphdb.create_edge(begin_entity + "2document", start_sql, end_sql, prop_val_sql, graph_name)
                    if "entity_class" in one["end_entity"]:
                        end_entity = one["end_entity"]["entity_class"]
                        if "property" in one["end_entity"]:
                            end_property = one["end_entity"]["property"]
                            props = []
                            values = []
                            for k, v in end_property.items():
                                pro_v = '`' + k + '`' + "=" + '"' + normalize_text(v) + '"'
                                props.append(k)
                                values.append(normalize_text(v))
                                endpro_value.append(pro_v)
                                if k in pro_index[end_entity]:
                                    pro_v = '`' + k + '`' + "=" + '"' + normalize_text(v) + '"'
                                    endpro_value_index.append(pro_v)
                            graphdb.create_vertex(graph_name, otl_name=end_entity, props=props, values=values,
                                                values_index=values, pro_value=endpro_value, 
                                                  pro_value_index=endpro_value_index)
                            if end_entity != "document":
                                start_sql = sqlProcessor.select_sql(end_entity, property_dict=end_property,
                                                                    merge_pro=list(merge_otls[end_entity].keys()))
                                end_sql = sqlProcessor.select_sql('document', prop='path',
                                                                  value='"'+normalize_text(document["doc_path"])+'"',
                                                                  graphdb=graphdb,
                                                                  db=graph_name)
                                prop_val_sql = sqlProcessor.prop_value_sql(prop=['name'], value=['"' + end_entity + "2document" + '"'])
                                if isinstance(end_sql, list):
                                    for end_sql_i in end_sql:
                                        graphdb.create_edge(end_entity + "2document", start_sql, end_sql_i, prop_val_sql, graph_name)
                                else:
                                    graphdb.create_edge(end_entity + "2document", start_sql, end_sql, prop_val_sql, graph_name)
                    if "relation_entity" in one["relation"]:
                        relation = one["relation"]["relation_entity"]
                        if "relation_property" in one["relation"]:
                            relation_property = one["relation"]["relation_property"]
                            for k, v in relation_property.items():
                                relpro_v = '`' + k + '`' + "=" + '"' + normalize_text(v) + '"'
                                relpro_value.append(relpro_v)

                            start_sql = sqlProcessor.select_sql(begin_entity, property_dict=begin_property,
                                                                merge_pro=list(merge_otls[begin_entity].keys()))
                            end_sql = sqlProcessor.select_sql(end_entity, property_dict=end_property,
                                                              merge_pro=list(merge_otls[end_entity].keys()))
                            prop_val_sql = sqlProcessor.prop_value_sql(prop=list(relation_property.keys()), value=list(relation_property.values()))
                            graphdb.create_edge(relation, start_sql, end_sql, prop_val_sql, graph_name)

def contract_model_extract(conn_db, graph_mongo_Name, ds_id, file_source, configYaml, model, stopwords_file,
                           process_num, schema_file, files_type):
    """
    合同模型抽取
    Args：
        conn_db: mongodb数据库
        graph_mongo_Name:
        ds_id: 数据源id
        file_source: 文件对应gns
        configYaml:合同模型规则配置文件路径
        model: 合同模型路径
        stopwords_file: 合同模型停用词路径
        process_num: 多进程提取的进程数
        schema_file: 合同本体的schema文件路径
    """
    # 获取文件docid
    docid_list, as7_json, ds_address, version = get_docids(ds_id=ds_id, postfix="all",
                                                           file_source=file_source, files_type=files_type)
    # 提取
    contract_res = multi_extract(docids=docid_list, configYaml=configYaml, model=model,
                                 stopwords_file=stopwords_file, process_num=process_num,
                                 as7_json=as7_json, version=version)
    # 结构化数据插入mongodb
    for contract in contract_res:
        contract_insert2mongodb(conn_db, graph_mongo_Name, contract, schema_file)


# AR 运维模型
def operation_maintenance_model_extract(conn_db, graph_mongo_Name, ds_id, file_source, config_path, files_type):
    # 获取文件docid
    docid_list, as7_json, ds_address, version = get_docids(ds_id=ds_id, postfix="all", file_source=file_source,
                                                           files_type=files_type)
    # 提取
    Logger.log_info("operation maintenance model extract...")
    ar_model = OperationMaintenanceModel(as7_json, version, config_path, ds_id)
    for doc_id in docid_list:
        Logger.log_info("doc_id: {}".format(doc_id))

        spos = ar_model.get_spos(doc_id)
        # 写入mongodb
        ar_model.write2mongodb(conn_db, graph_mongo_Name, spos)
    Logger.log_info("operation maintenance model extract finished!")
    
    



def ai_common_model_extract(modeldir, extract_model, conn_db, ds_id, file_source,files_type,  extract_rules, graph_mongo_Name):
    """
    AI模型或通用模型抽取
    Args：
        modeldir: 模型路径
        extract_model:模型名称
        db: mongodb数据库
        ds_id: 数据源id
        file_source:文件gns
    Return：
    """
    c_e_dict = {}
    schemadir_e = modeldir + "/" + extract_model + "/schema/schema_english.json"
    schemadir_c = modeldir + "/" + extract_model + "/schema/schema_chinese.json"
    cc = pd.read_json(schemadir_c)
    aa = pd.read_json(schemadir_e)
    property_dict, relation_dict = {}, {}
    for i, row in aa.iterrows():
        object_type = row["object_type"]
        subject_type = row["subject_type"]
        predicate = row["predicate"]
        c_e_dict[cc.loc[i, "predicate"]] = predicate

        if object_type.lower() in ["date", "Text", "number", "num"]:
            property_dict[predicate] = {}
            property_dict[predicate]["s"] = subject_type
        else:
            relation_dict[predicate] = {}
            relation_dict[predicate]["s"] = subject_type
            relation_dict[predicate]["o"] = object_type
    postfix = "all"
    obj = unstructed_spo(conn_db, graph_mongo_Name, ds_id, postfix, file_source,files_type, extract_model, property_dict,
                         relation_dict, extract_rules, c_e_dict)
    return obj


def insert_mogodb(conn_db, graph_mongo_Name, result_list, property_dict, relation_dict, extract_rules, ds_id, c_e_dict):
    properties = {}
    entities = []
    for one in extract_rules:
        entitiy = one["entity_type"]
        property_field = one["property"]["property_field"]
        if entitiy not in entities:
            properties[entitiy] = []
            entities.append(entitiy)
            properties[entitiy].append(property_field)
        else:
            properties[entitiy].append(property_field)
    for spo in result_list:
        ## chinese2english
        p = c_e_dict[spo[1]]
        s = spo[0]
        o = spo[2]
        if p in entities:  ###如果數據是spo
            class_s = relation_dict[p]["s"]
            class_o = relation_dict[p]["o"]
            condition_s = {'name': s}
            condition_o = {'name': o}
            data = {}
            # for pro in properties[p]:
            data["s"] = s
            data["o"] = o
            data["p"] = p
            data["s_pro"] = {'name': s}
            data["p_pro"] = {'name': p}
            data["o_pro"] = {'name': o}
            result_p = conn_db[graph_mongo_Name + "_" + p].find_one(data)
            if not result_p:
                data["ds_id"] = ds_id
                conn_db[graph_mongo_Name + "_" + p].insert_one(data)
            result_s = conn_db[graph_mongo_Name + "_" + class_s].find_one(condition_s)
            if not result_s:
                data_s = {}
                data_s["name"] = s
                data_s["ds_id"] = ds_id
                conn_db[graph_mongo_Name + "_" + class_s].insert_one(data_s)
            result_o = conn_db[graph_mongo_Name + "_" + class_o].find_one(condition_o)
            if not result_o:
                data_o = {}
                data_o["name"] = o
                data_o["ds_id"] = ds_id
                conn_db[graph_mongo_Name + "_" + class_o].insert_one(data_o)
        else:  ###如果數據是屬性spo
            if p in property_dict.keys():
                if property_dict[p]["s"] in entities:
                    class_s = property_dict[p]["s"]
                    condition = {'name': s}
                    result = conn_db[graph_mongo_Name + "_" + class_s].find_one(condition)
                    if result:
                        result[p] = o
                        conn_db[graph_mongo_Name + "_" + class_s].update(condition, result)

                    else:
                        data = {}
                        data["name"] = s
                        data[p] = o
                        result_ss = conn_db[graph_mongo_Name + "_" + class_s].find_one(data)
                        if not result_ss:
                            data["ds_id"] = ds_id
                            conn_db[graph_mongo_Name + "_" + class_s].insert_one(data)


def unstructed_spo(conn_db, graph_mongo_Name, ds_id, postfix, file_source, files_type, extract_model, property_dict,
                   relation_dict, extract_rules, c_e_dict):
    obj = {}
    params_json = {}
    params_json["ds_id"] = ds_id
    data = dsm_dao.getdatabyid(ds_id)
    if len(data) != 0:
        as7_json = data.to_json(orient='records')
        as7_json = json.loads(as7_json)[0]
        ds_address = as7_json["ds_address"]
        params_json["postfix"] = postfix
        params_json["file_list"] = []
        file = {}
        file["docid"] = file_source
        file["type"] = files_type
        params_json["file_list"].append(file)
        SPO = Extract_SPO(extract_model)
        version = otl_dao.getversion(ds_address)
        retcode, docid_list = otl_service.flatfile(params_json)  ###文件夾路徑
        if retcode != 200:
            er = docid_list['message'] + docid_list['cause']
            obj = {"state": 'FAILURE',
                   "meta": {'cause': er, 'message': "graph_InfoExt failed1"}}
            return obj
        for docid in docid_list:
            docid = docid[0]
            result_list = []
            code, text = otl_dao.getinfofromas(as7_json, ["content"], docid, version)

            if code == 200:
                if "content" in text:
                    spo_list = SPO.extract_spo(text["content"])
                    result_list.extend(spo_list)
                    # print(result_list)
                    result_list = list(set(result_list))
                    insert_mogodb(conn_db, graph_mongo_Name, result_list, property_dict,
                                  relation_dict, extract_rules, ds_id, c_e_dict)
                else:
                    print("error : {}".format(docid))
            else:
                print("error : {}".format(docid))
    # dblist = conn.list_database_names()
    # if graph_mongo_Name in dblist:
    #     print(graph_mongo_Name + " has been in mongodb")
    # else:
    #     print(graph_mongo_Name + " no ")
    return obj


def as_document_model_extract(conn_db, ds_id, file_source, flag, graph_mongo_Name, modeldir, extract_model,
                              config_path):
    """
    anyshare文档知识模型抽取,抽取新词插入mongodb，抽取文档结构插入mongodb
    Args：
        conn_db: mongodb数据库
        ds_id: 数据源id
        file_source：文件gns
        flag:增量or全量，增量：increment；全量：full
        graph_mongo_Name: mongodb name, baseInfo["graph_mongo_Name"]
        modeldir: 模型路径
        extract_model: 模型名称
        config_path: asapi.conf配置文件路径

    """
    data = dsm_dao.getdatabyid(str(ds_id))
    as7_json = data.to_json(orient='records')
    as7_json = json.loads(as7_json)[0]
    ds_address = as7_json["ds_address"]
    version = otl_dao.getversion(ds_address)
    as7_json["version"] = version
    gnsid = file_source
    new_as7_json = as7_json
    new_as7_json["docid"] = gnsid
    if flag == "full":
        # 顾磊
        # file_info_dict = GetAnyshareFileTree(as7_json, entrance_dict,config_path).get_file_tree()
        # insert_to_mogodb(conn, mongo_db, file_info_dict, as7_json)
        # 李宁宁
        file_info_dict = AsShareDocumentChangeModel(as7_json, conn_db, graph_collection_prefix=graph_mongo_Name)
        file_info_dict.compare()
        is_increment = False
    elif flag == "increment":
        as_change_model = AsShareDocumentChangeModel(as7_json, conn_db, graph_collection_prefix=graph_mongo_Name)
        change_state = as_change_model.compare()
        is_increment = True
        collection_names = conn_db.collection_names()
        if graph_mongo_Name + "_" + "gnsInfoChange" not in collection_names or change_state == 0:
            return {}, {}, is_increment

    entity_property_dict, relationship_property_dict = {}, {}
    schemadir_e = modeldir + extract_model + "/schema/schema_english.json"
    df = pd.read_json(schemadir_e)
    df_filter = df.loc[(df["object_type"] != "Text") & (df["object_type"] != "boolean") & (
            df["object_type"] != "num")]
    relationlist = df_filter["predicate"].tolist()
    # print(relationlist)
    for index, row in df.iterrows():
        if row["object_type"] in ["Text", "boolean", "num"]:
            if row["subject_type"] not in relationlist and row[
                "subject_type"] not in entity_property_dict:
                entity_property_dict[row["subject_type"]] = []
                if row["object_type"] == "Text":
                    entity_property_dict[row["subject_type"]].append(
                        [row["predicate"], "string"])
                elif row["object_type"] == "boolean":
                    entity_property_dict[row["subject_type"]].append(
                        [row["predicate"], "boolean"])
                elif row["object_type"] == "num":
                    entity_property_dict[row["subject_type"]].append(
                        [row["predicate"], "float"])
            elif row["subject_type"] not in relationlist and row[
                "subject_type"] in entity_property_dict:
                if row["object_type"] == "Text":
                    entity_property_dict[row["subject_type"]].append(
                        [row["predicate"], "string"])
                elif row["object_type"] == "boolean":
                    entity_property_dict[row["subject_type"]].append(
                        [row["predicate"], "boolean"])
                elif row["object_type"] == "num":
                    entity_property_dict[row["subject_type"]].append(
                        [row["predicate"], "float"])
            elif row["subject_type"] in relationlist and row[
                "subject_type"] not in relationship_property_dict:
                relationship_property_dict[row["subject_type"]] = []
                if row["object_type"] == "Text":
                    relationship_property_dict[row["subject_type"]].append(
                        [row["predicate"], "string"])
                elif row["object_type"] == "boolean":
                    relationship_property_dict[row["subject_type"]].append(
                        [row["predicate"], "boolean"])
                elif row["object_type"] == "num":
                    relationship_property_dict[row["subject_type"]].append(
                        [row["predicate"], "float"])
            elif row["subject_type"] in relationlist and row[
                "subject_type"] in relationship_property_dict:
                if row["object_type"] == "Text":
                    relationship_property_dict[row["subject_type"]].append(
                        [row["predicate"], "string"])
                elif row["object_type"] == "boolean":
                    relationship_property_dict[row["subject_type"]].append(
                        [row["predicate"], "boolean"])
                elif row["object_type"] == "num":
                    relationship_property_dict[row["subject_type"]].append(
                        [row["predicate"], "float"])
    print("start extracting newword")
    newwords = datetime.datetime.now()
    print(datetime.datetime.now())
    # newword
    if not is_increment:
        new_words_to_mongo = NewWordsToMongo(config_path=config_path,
                                             mongo_db=graph_mongo_Name,
                                             as7_json=as7_json,
                                             is_increment=is_increment
                                             )
        new_words_to_mongo.start()
        print("extracting newword finished")
        newworde = datetime.datetime.now()
        print(newworde)
        print("newword spends {}s ".format((newworde - newwords).total_seconds()))
        print("start extracting document structure")
    documents = datetime.datetime.now()
    print(documents)
    # AnyshareDocumentModel 李宁宁
    # FileDownloadByGnsId 顾磊
    spo = AnyshareDocumentModel(entity_property_dict, relationship_property_dict, conn_db,
                                as7_json,
                                config_path=config_path,
                                graph_collection_prefix=graph_mongo_Name)
    spo.start()
    print("extracting document structure finished")
    documente = datetime.datetime.now()
    print(documente)
    print("document structure spends {}s ".format((documente - documents).total_seconds()))


def insert2orientdb(pro_index, en_pro_dict, edge_pro_dict, graph_KMap, graph_baseInfo, graph_KMerge, graphid,
                    data_source_set):
    """
    mongodb中的数据插入orientdb
    Args：
        pro_index：属性索引
        en_pro_dict：点属性dict
        edge_pro_dict：边属性dict
        graph_KMap：映射信息
        graph_baseInfo：图谱配置信息
        graph_KMerge：融合信息
        graphid：图谱id

    """
    obj = {}
    try:
        print("start write into orientdb ")
        orientdbs = datetime.datetime.now()
        print(orientdbs)
        status_code, message = gr_map2(pro_index, en_pro_dict, edge_pro_dict, graph_KMap, graph_baseInfo, graph_KMerge,
                                       graphid, data_source_set)
        print("writing into orientdb finished ")
        orientdbe = datetime.datetime.now()
        print(orientdbe)
        print("wiriting into orientdb spend {}s".format((orientdbe - orientdbs).total_seconds()))
        if status_code == 500:
            # print(message)
            obj = {"state": "FAILURE",
                   "meta": {'cause': message, 'message': "graph_KMap failed"}
                   }
        if "subject" in en_pro_dict:
            print("build document vector start")
            start_time = time.time()
            from dao.subject_dao import TextMatchTask
            subject_match_task = TextMatchTask("test", graphid)
            subject_match_task.build_document_embed()
            print("build document vector end, cost {}".format(time.time() - start_time))

        obj = {"state": "graph_KMerge",
               "meta": {'current': "graph_KMerge", 'total': "100"}
               }
        return obj
    except Exception as e:
        obj = {"state": "FAILURE",
               "meta": {'cause': repr(e), 'message': "graph_KMap failed"}
               }
        return obj
    finally:
        if general_variable.updategraph:
            try:
                graph_dao.updategraphstatus(graphid)
            except Exception as e:
                print(f'update mysql error:{str(e)}')
            else:
                print('update mysql sucess')
        # return obj


def get_docids(ds_id, postfix, file_source, files_type):
    """
    根据gns从AS获取文件docid
    Args：
        ds_id: 数据源id
        postfix: "all"
        file_source: 文件gns
    Return：
        docid_list, as7_json, ds_address, version
    """
    params_json = {}
    params_json["ds_id"] = ds_id
    data = dsm_dao.getdatabyid(ds_id)
    if len(data) != 0:
        as7_json = data.to_json(orient='records')
        as7_json = json.loads(as7_json)[0]
        ds_address = as7_json["ds_address"]
        params_json["postfix"] = postfix
        params_json["file_list"] = []
        file = {}
        file["docid"] = file_source
        file["type"] = files_type
        params_json["file_list"].append(file)
        version = otl_dao.getversion(ds_address)
        retcode, docid_list = otl_service.flatfile(params_json)  ###文件夾路徑
        if retcode != 200:
            # self.update_state(state='FAILURE',
            #                   meta={'cause': er, 'message': "graph_InfoExt failed"})
            return {'current': 100, 'total': 100}
        else:
            return docid_list, as7_json, ds_address, version


# 多进程提取合同结构化数据
def multi_extract(docids, configYaml, model, stopwords_file, process_num, as7_json, version):
    start_time = time.time()
    op = MultiExtract(configYaml=configYaml, model_path=model, stopwords_file=stopwords_file, process_num=process_num,
                      as7_json=as7_json, version=version)
    op.flow(docids)
    # print(len(op.mp_lst))
    print(time.time() - start_time)
    return op.mp_lst


# 合同模型提取的数据写入mongodb
def contract_insert2mongodb(db, graph_mongo_Name, data, schema_file):
    with open(schema_file, 'r', encoding='utf8')as fp:
        schemas = json.load(fp)
    con = {}
    claus = {}
    for schema in schemas:
        s = schema.get("subject_type", "")
        p = schema.get("predicate", "")
        o = schema.get("object_type", "")
        # 实体-属性
        if o.lower() in ["text", "date", "number"]:
            if s == "company":
                coms = []
                owner = data.get("owner_subject", "")
                others = data.get("other_subject", [])
                coms.append(owner)
                coms.extend(others)
                for com in set(coms):
                    flag = db[graph_mongo_Name + "_" + s].find_one({"name": com})
                    if not flag and len(com.strip()) > 0:
                        db[graph_mongo_Name + "_" + s].insert_one({"name": com})
            elif s == "clause":
                clauses = data.get("clause", {})
                for k, v in clauses.items():
                    claus = {}
                    claus["name"] = k
                    claus["content"] = v
                    flag = db[graph_mongo_Name + "_" + s].find_one(claus)
                    if not flag:
                        db[graph_mongo_Name + "_" + s].insert_one(claus)
            else:
                con[p] = data.get(p, "")
                if len(list(con.keys())) == 12:
                    if len(con.get("name", "").strip()) > 0:
                        flag = db[graph_mongo_Name + "_" + s].find_one(con)
                        if not flag:
                            db[graph_mongo_Name + "_" + s].insert_one(con)
        # 边
        else:
            contract_name = data.get("name", "")
            if p == "contain":
                clauses = data.get("clause", [])
                for name, content in clauses.items():
                    con = {}
                    con["s"] = contract_name
                    con["p"] = p
                    con["o"] = name
                    con["s_pro"] = {"id": data.get("id"), "name": data.get("name", "")}
                    con["p_pro"] = {"name": p}
                    con["o_pro"] = {"name": name, "content": content}
                    flag = db[graph_mongo_Name + "_" + p].find_one(con)
                    if not flag:
                        db[graph_mongo_Name + "_" + p].insert_one(con)
            elif p == "ownerSubject":
                owner = data.get("owner_subject", "")
                con = {}
                con["s"] = contract_name
                con["p"] = p
                con["o"] = owner
                con["s_pro"] = {"id": data.get("id"), "name": data.get("name", "")}
                con["p_pro"] = {"name": p}
                con["o_pro"] = {"name": owner}
                flag = db[graph_mongo_Name + "_" + p].find_one(con)
                if not flag:
                    db[graph_mongo_Name + "_" + p].insert_one(con)
            else:
                others = data.get("other_subject", [])
                for other in others:
                    con = {}
                    con["s"] = contract_name
                    con["p"] = p
                    con["o"] = other
                    con["s_pro"] = {"id": data.get("id"), "name": data.get("name", "")}
                    con["p_pro"] = {"name": p}
                    con["o_pro"] = {"name": other}
                    flag = db[graph_mongo_Name + "_" + p].find_one(con)
                    if not flag:
                        db[graph_mongo_Name + "_" + p].insert_one(con)


def mongo_type_tansform(value):
    return str(value)


def get_pro_type(graph_otl):
    entity_pro_dict = {}
    edge_pro_dict = {}
    otl = graph_otl[0]
    entitys = otl["entity"]
    edges = otl["edge"]
    for entity in entitys:
        name = entity["name"]
        properties = entity["properties"]
        entity_pro_dict[name] = {}
        for pro in properties:
            entity_pro_dict[name][pro[0]] = pro[1]
    for edge in edges:
        name = edge["name"]
        properties = edge["properties"]
        edge_pro_dict[name] = {}
        for pro in properties:
            edge_pro_dict[name][pro[0]] = pro[1]
    return entity_pro_dict, edge_pro_dict

def get_graph_config_info(graphid):
    """
    读取graph_config_table内容， 获取图谱配置信息
    """
    sys.path.append(os.path.abspath("../"))
    from service.graph_Service import graph_Service
    ret_code, obj = graph_Service.getGraphById(graphid)
    if ret_code != 200:
        res_obj = {"state": 'FAILURE', "meta": {'cause': obj["cause"], 'message': obj["message"]}}
        return res_obj, -1
    res = obj["res"]
    if not bool(obj["res"]):
        res_obj = {"state": 'FAILURE', "meta": {'cause': "get graph failed", 'message': "get graph failed"}}
        return res_obj, 0
    try:
        graph_baseInfo = res["graph_baseInfo"]
        res_obj = {"state": 'graph_baseInfo', "meta": {'current': "graph_baseInfo", 'total': "100"}}
        res_obj = {"state": 'graph_ds', "meta": {'current': "graph_ds", 'total': "100"}}
        graph_otl = res["graph_otl"]
        # 获取该图谱对应的本体信息
        en_pro_dict, edge_pro_dict = get_pro_type(graph_otl)
        time.sleep(3)
        res_obj = {"state": 'graph_otl', "meta": {'current': "graph_otl", 'total': "100"}}
        graph_otl_info = graph_otl[0]
        entity = graph_otl_info["entity"]
        edge = graph_otl_info["edge"]
        pro_index = {}
        for i in entity:
            pro_index[i["name"]] = i["properties_index"]
        for i in edge:
            pro_index[i["name"]] = i["properties_index"]
        graph_InfoExt = res["graph_InfoExt"]
        res_obj = {"state": 'graph_InfoExt', "meta": {'current': "graph_InfoExt", 'total': "100"}}
        graph_KMap = res["graph_KMap"]
        graph_KMerge = res["graph_KMerge"]
        # time.sleep(10)
        graph_used_ds = res["graph_used_ds"]
        address = ""
        mongo_db = ""
        graph_mongo_Name = ""
        graph_db_id = 0
        for baseInfo in graph_baseInfo:
            address = baseInfo["graphDBAddress"]  # 图数据库ip,orientdb ip
            mongo_db = baseInfo["graph_DBName"]  # oeientdb name
            graph_mongo_Name = baseInfo["graph_mongo_Name"]  # mongodb name
            graph_db_id = baseInfo["graph_db_id"]
        return res_obj, graph_baseInfo, pro_index, en_pro_dict, edge_pro_dict, graph_InfoExt, graph_KMap, graph_KMerge, graph_used_ds, address, mongo_db, graph_mongo_Name, graph_db_id
    except Exception as e:
        er = repr(e)
        if "_source" in er:
            er = "read data failed! file_path error!"
        if "connection" in er and "error" in er:
            er = "get anyshare data false because of connection error"

        res_obj = {"state": 'FAILURE', "meta": {'cause': er, 'message': "graph_InfoExt failed2"}}
        return res_obj, 0


def get_map_dict(g_kmap):
    """粗略处理映射信息

    Args:
        g_kmap: 表graph_config_table中的graph_KMap项，结构: [{otls_map:[], relations_map:[]}]

    Returns:
        otls_map: 本体映射，g_kmap中的otls_map项，结构：
            [{otl_name: "", entity_type: "", property_map: [{otl_prop: "", entity_prop: ""}, …]}, …]
        relations_map: 关系映射，g_kmap中的relations_map项，结构：
            [{relation_info:{source_type: "", model: "", begin_name: "", edge_name: "", end_name: "", entity_type: ""},
             property_map: [{edge_prop: "", entity_prop: ""}], relation_map: [{begin_class_prop: "", equation_begin: "",
             relation_begin_pro: "", equation: "", relation_end_pro: "", equation_end: "", end_class_prop: ""}]}, …]
    """
    otls_map = []  # 本体映射
    relations_map = []  # 关系映射
    for map_dict in g_kmap:
        for map_key in map_dict:
            if map_key == "otls_map":
                # 本体映射
                otls_map = map_dict[map_key]
            elif map_key == "relations_map":
                # 关系映射
                relations_map = map_dict[map_key]
    return otls_map, relations_map


def get_Kmerge_dict(g_merge):
    """处理融合信息

    Args:
        g_merge: 表graph_config_table中的graph_KMerge项，结构：
            [{status: True, entity_classes: [{name: "", properties: [{property: "name", function: "equality"}]}, …]}]

    Returns:
        merge_otls: 结构：{entity_classes.name: {entity_classes.properties.property: entity_classes.properties.function}}
            表示：{类:{融合的属性: 融合方法}}
        merge_flag: g_merge中的status，默认为False
    """
    merge_flag = False
    merge_otls = {}
    for gme in g_merge:
        merge_flag = gme["status"]
        entity_classes = gme["entity_classes"]
        for ec in entity_classes:
            otl_n = ec["name"]  # 类
            otl_pro = ec["properties"]
            merge_pro = {}
            for op in otl_pro:
                ft = op['function']
                ft_pro = op['property']  # 融合的属性
                merge_pro[ft_pro] = ft
            merge_otls[otl_n] = merge_pro
    return merge_otls, merge_flag

def get_map_info(otls_map):
    """获取实体映射信息

    Args:
        otls_map: 本体映射，表graph_config_table中的graph_KMap项中的otls_map项，结构：
            [{otl_name: "", entity_type: "", property_map: [{otl_prop: "", entity_prop: ""}, …]}, …]

    Returns:
        all_otl_class: 结构：[[{otl_name: entity_type}, {property_map.otl_prop: property_map.entity_prop}, …], …]
            表示 [[{本体: 实体}, {本体属性: 实体属性}, …], …]
        otl_tab_map: 结构：{otl_name: {"entity_data": entity_type, "pro_map":
            {property_map.otl_prop: property_map.entity_prop, …}}, …}
            例: {'folder':{'entity_data': 'folder', 'pro_map':{'name':'name'}}}
        tab_otl_map: 结构：{entity_type: [{"otl_name": otl_name, "pro_map": {property_map.entity_prop:
            [property_map.otl_prop]}}]}
    """
    all_otl_class = []
    otl_tab_map = {}
    tab_otl_map = {}
    for otl_class in otls_map:

        otl_class_list = []
        dict1 = {}
        dict1[otl_class["otl_name"]] = otl_class["entity_type"]
        otl_tab_map[otl_class["otl_name"]] = {}
        otl_tab_map[otl_class["otl_name"]]["entity_data"] = otl_class["entity_type"]
        if otl_class["entity_type"] not in tab_otl_map:
            tab_otl_map[otl_class["entity_type"]] = []
        entity_otl_dict = {}
        entity_otl_dict["otl_name"] = otl_class["otl_name"]
        entity_otl_dict["pro_map"] = {}
        otl_class_list.append(dict1)
        property_map = otl_class["property_map"]
        otl_tab_map[otl_class["otl_name"]]["pro_map"] = {}
        for pro_map in property_map:
            dict2 = {}
            dict2[pro_map["otl_prop"]] = pro_map["entity_prop"]
            if pro_map["entity_prop"] not in entity_otl_dict["pro_map"]:
                entity_otl_dict["pro_map"][pro_map["entity_prop"]] = []
            entity_otl_dict["pro_map"][pro_map["entity_prop"]].append(pro_map["otl_prop"])
            otl_tab_map[otl_class["otl_name"]]["pro_map"][pro_map["otl_prop"]] = pro_map["entity_prop"]
            otl_class_list.append(dict2)
        all_otl_class.append(otl_class_list)
        tab_otl_map[otl_class["entity_type"]].append(entity_otl_dict)
    return all_otl_class, otl_tab_map, tab_otl_map


def get_Kmap_dict(o_i, all_otl_class):
    """细节处理map信息

    Args:
        o_i: all_otl_class其中一项的编号
        all_otl_class: 表graph_config_table中的graph_KMap项中的otls_map中的信息，结构：
            [[{otl_name: entity_type}, {property_map.otl_prop: property_map.entity_prop}, …], …]
            表示 [[{本体: 实体}, {本体属性: 实体属性}, …], …]

    Returns:
        otl_name: 本体名，all_otl_class[o_i]的otl_name
        tab_: 表，all_otl_class[o_i]的entity_type
        otl_pro: 本体属性，[property_map.otl_prop, …]
        tab_pro: [property_map.entity_prop, …]
        tab_otl: {property_map.entity_prop: property_map.otl_prop, …}
        otl_tab: {property_map.otl_prop: property_map.entity_prop, …}
"""
    dict_otl = all_otl_class[o_i]
    otl_name = ""  # 本体
    tab_ = ""  # 表
    otl_pro = []
    tab_pro = []
    tab_otl = {}
    otl_tab = {}
    ## 开始处理本体
    for all_otl_in in range(len(dict_otl)):
        otl_keys = dict_otl[all_otl_in]
        ## 本体类
        ## {本体：实体}
        if all_otl_in == 0:

            otl_key = list(otl_keys.keys())
            otl_name = otl_key[0]
            tab_ = otl_keys[otl_name]
        ## {本体属性：实体属性}
        ## 属性
        else:
            # otl_keys = dict_otl[all_otl_in]
            otl_key = list(otl_keys.keys())
            otl_pro.append(otl_key[0])
            tab_pro.append(otl_keys[otl_key[0]])
            tab_otl[otl_keys[otl_key[0]]] = otl_key[0]
            otl_tab[otl_key[0]] = otl_keys[otl_key[0]]
    return otl_name, tab_, otl_pro, tab_pro, tab_otl, otl_tab


def gr_map1(pro_index, en_pro_dict, edge_pro_dict, g_kmap, g_merge, graphid, graph_db_id, mongo_db, graph_mongo_Name):
    """图谱映射

    Args:
        pro_index: 需要创建索引的属性，结构：{实体名：属性索引}
        en_pro_dict: {实体名：{属性名：属性类型}}
        edge_pro_dict: {边名：{属性名：属性类型}}
        graph_KMap: 表graph_config_table中的graph_KMap项
        graph_KMerge: 表graph_config_table中的graph_KMerge项
        graphid: 图谱id
        graph_db_id: 图数据库id
        mongo_db: 表graph_config_table中的graph_baseInfo中的graph_DBName，表示orientdb中database的名字
        graph_mongo_Name: 表graph_config_table中的graph_baseInfo中的graph_mongo_Name，例：mongoDB-2

    Returns:
        code:
        message:
    """
    # merge_flag = False
    # 粗略处理映射信息
    try:
        otls_map, relations_map = get_map_dict(g_kmap)
        merge_otls, merge_flag = get_Kmerge_dict(g_merge)
        # Pre_Pro_graph = Pre_process_Graph_data(graphid)
        # address, mongo_db, graph_mongo_Name, username, password, graph_DBPort, graph_Port = Pre_Pro_graph.get_db_data()
        graphdb = GraphDB(graph_db_id)
        code, res = graphdb.get_present_index(mongo_db)
        if code != 200:
            return 500, repr(graphdb.state)
        present_index_field, present_index_name, present_index_field_unique, present_index_name_unique = res
        all_otl_class, otl_tab_map, tab_otl_map = get_map_info(otls_map)

        # 创建图数据库schema
        # 创建点类
        tag_class_start = time.time()
        print('开始创建点类')
        for o_i in range(len(all_otl_class)):
            ## 细节处理map信息
            otl_name, tab_, otl_pro, tab_pro, tab_otl, otl_tab = get_Kmap_dict(o_i, all_otl_class)
            ## 创建点类
            print(f'开始创建顶点:{otl_name}')
            graphdb.create_class(mongo_db, otl_name, otl_pro, en_pro_dict)
            if not general_variable.updategraph:
                general_variable.updategraph = True
            # 创建全文索引
            if otl_name in present_index_name:
                present_field = present_index_field[otl_name.lower()]  # 已有索引的属性
                if isinstance(present_field, str):
                    present_field = [present_field]  # 如果只有单个属性，将其包装成列表
                new_set = [i for i in present_field if i not in otl_pro]  # 已有索引但不在otl_pro中的属性
                for otl in pro_index[otl_name]:
                    if otl not in new_set:
                        new_set.append(otl)  # 需要创建索引的属性和已有索引的属性的并集
                if not (otl_name == "document" and present_index_name[otl_name.lower()].endswith("document_docfulltextindex")):
                    graphdb.create_full_index(otl_name, new_set, present_index_name, mongo_db)
            else:
                graphdb.create_full_index(otl_name, pro_index[otl_name], present_index_name, mongo_db)
            # 创建唯一索引
            if merge_flag and otl_name in merge_otls:
                merge_pro = []  # 属性列表
                for k, v in merge_otls[otl_name].items():
                    merge_pro.append(k)
                graphdb.create_uni_index(otl_name, merge_pro, present_index_name_unique, mongo_db,
                                        en_pro_dict[otl_name])
        print('创建点类结束，耗时{}s'.format(time.time() - tag_class_start))
        # 创建边类
        edge_class_start = time.time()
        print('开始创建边类')
        for rel_i in range(len(relations_map)):
            rela = relations_map[rel_i]
            '''rela结构:
            {
                "relation_info": {
                    "source_type": "automatic",
                    "model": "Anysharedocumentmodel"
                    "begin_name": "folder",
                    "edge_name": "folder2document",
                    "end_name": "document",
                    "entity_type": "folder2document"
                },
                "property_map": [
                    {
                        "edge_prop": "name",
                        "entity_prop": "name"
                    }
                ],
                "relation_map": [  ## 四个框的情况
                    {
                        "begin_class_prop": "name",
                        "equation_begin": "等于",
                        "relation_begin_pro": "name",
                        "equation": "",
                        "relation_end_pro": "name",
                        "equation_end": "等于",
                        "end_class_prop": "name"
                    }
                ]
            }
            '''
            relation_info = rela["relation_info"]
            edge_class = relation_info["edge_name"]
            ## 获取 边 属性
            property_map = rela["property_map"]
            edge_otl_pro = []  # 边的属性列表
            edge_otl_tab_pro = {}  # 边的属性对应的实体属性
            for pro_map in property_map:
                edge_otl_pro.append(pro_map["edge_prop"])
                edge_otl_tab_pro[pro_map["edge_prop"]] = pro_map["entity_prop"]
            print(f'开始创建边类:{edge_class}')
            graphdb.create_edge_class(edge_class, edge_otl_pro, edge_pro_dict, mongo_db)
            graphdb.create_edge_index(edge_class, edge_otl_pro, present_index_name,
                                      present_index_field, pro_index, edge_pro_dict, mongo_db)
        print('创建边类结束，耗时{}s'.format(time.time() - edge_class_start))
        if graphdb.type == 'nebula':
            print('waiting for nebula creating schema. please wait...')
            time.sleep(20)

        # 更新knowledge_graph的kg_data_volume字段
        try:
            graph_dao.updategraphbuildstatus(graphid)
        except Exception as e:
            print(f'update mysql error:{str(e)}')
        else:
            print('update mysql sucess')

        # 插入点
        start_create_vertex = time.time()
        vertex_writer = VertexWriter(all_otl_class, graph_mongo_Name, graphdb, graph_db_id, mongo_db, en_pro_dict,
                                     merge_otls)
        vertex_writer.write()
        print(f'创建顶点总耗时：{time.time() - start_create_vertex}s')
        ## 遍历边 创建边
        start_create_edge = time.time()
        edgeWriter = EdgeWriter(otls_map, en_pro_dict, edge_pro_dict, relations_map, g_merge,
                                graph_db_id, mongo_db, graph_mongo_Name)
        edgeWriter.write()
        print(f'创建边总耗时：{time.time() - start_create_edge}s')
        return 200, "success"
    except Exception as e:
        print(repr(e))
        return 500, repr(e)



def mongodb2graphdb(pro_index, en_pro_dict, edge_pro_dict, graph_KMap, graph_KMerge,
                    graphid, graph_db_id, mongo_db, graph_mongo_Name):
    """mongodb数据写入graphdb

    Args:
        pro_index: 需要创建索引的属性，结构：{实体名：属性索引}
        en_pro_dict: 点属性dict {实体名：{属性名：属性类型}}
        edge_pro_dict: 边属性dict {边名：{属性名：属性类型}}
        graph_KMap: 映射信息 表graph_config_table中的graph_KMap项
        graph_KMerge: 融合信息 表graph_config_table中的graph_KMerge项
        graphid: 图谱id
        graph_db_id: 图数据库id
        mongo_db: 表graph_config_table中的graph_baseInfo中的graph_DBName，表示orientdb中database的名字
        graph_mongo_Name: 表graph_config_table中的graph_baseInfo中的graph_mongo_Name，例：mongoDB-2

    Return:
        obj: 结构：{"state":"", "meta": {}}
    """
    obj = {}
    try:
        print("start write into graphdb. graphid: {}. graph_db_id: {}".format(graphid, graph_db_id))
        graphdbs = datetime.datetime.now()
        print(graphdbs)
        status_code, message = gr_map1(pro_index, en_pro_dict, edge_pro_dict, graph_KMap, graph_KMerge, graphid,
                                       graph_db_id, mongo_db, graph_mongo_Name)
        print("writing into graphdb finished. graphid: {}. graph_db_id: {}".format(graphid, graph_db_id))
        graphdbe = datetime.datetime.now()
        print(graphdbe)
        print("wiriting into graphdb spend {}s".format((graphdbe - graphdbs).total_seconds()))
        if status_code == 500:
            # print(message)
            obj = {"state": 'FAILURE', "meta": {'cause': message, 'message': "graph_KMap failed0"}}
            return obj

        ret = task_dao.getGraphDBbyId(graph_db_id)
        rec_dict = ret.to_dict('records')
        rec_dict = rec_dict[0]
        db_type = rec_dict['type']
        if db_type == 'orientdb':
            if "subject" in en_pro_dict:
                print("build document vector start")
                start_time = time.time()
                from dao.subject_dao import TextMatchTask
                subject_match_task = TextMatchTask("test", graphid)
                subject_match_task.build_document_embed()
                print("build document vector end, cost {}".format(time.time() - start_time))

        obj = {"state": 'graph_KMerge', "meta": {'current': "graph_KMerge", 'total': "100"}}
        # time.sleep(30)
        return obj
    except Exception as e:
        obj = {"state": 'FAILURE', "meta": {'cause': repr(e), 'message': "graph_KMap failed1"}}
        return obj
    finally:
        if general_variable.updategraph:
            try:
                graph_dao.updategraphstatus(graphid)
            except Exception as e:
                print(f'update mysql error:{str(e)}')
            else:
                print('update mysql sucess')


def standard_extract_rabbitmq(json_data, graph_mongo_Name, conn_db, ds_id, rules, entity_type):
    """
    提取RabbitMQ数据，并写入mongodb
    """
    collection = conn_db[graph_mongo_Name + "_" + entity_type]
    mongo_data = []
    # 嵌套的json拉平
    flatten_data = otl_util.flatten_json_n(json_data)
    # 根据抽取规则抽取数据
    df = pd.DataFrame([flatten_data])
    df2 = list(df)  # 列
    for index, row in df.iterrows():  # 遍历行
        # 按行处理 方便插入mongodb
        mongodict = {}
        for i in df2:
            for key in rules:  ###抽取規則
                val = rules[key]  ####抽取規則屬性
                if i in val:  # 遍历列名
                    dict_m = {}
                    if row[i] != None:
                        dict_m[i] = mongo_type_tansform(row[i])
                        if key not in mongodict.keys():
                            mongodict[key] = dict_m
                        else:
                            old_d = mongodict[key]
                            new_d = {**old_d, **dict_m}
                            mongodict[key] = new_d
        # print("mongodict: ", mongodict)
        # 数据写入mongodb
        for all_en in mongodict:
            value = mongodict[all_en]
            Entity1_data = value  # 实体1的属性
            Entity1_data["ds_id"] = ds_id
            # print("Entity1_data:", Entity1_data)
            mongo_data.append(Entity1_data)
        collection.insert_many(mongo_data)


def rabbitmq_task(json_data, args):
    obj = {}
    graph_mongo_Name = args.get("graph_mongo_Name", "")
    # 根据图谱名称创建数据库
    create_mongodb_by_graph_name(conn_db, graph_mongo_Name, flag="full")
    # 根据抽取信息 抽取中间存储数据

    for infoext in args.get("graph_InfoExt", []):
        # 从每一条抽取信息中获取抽取规则
        data_source, file_path, file_name, file_source, ds_id, extract_type, rules, entity_type, extract_rules, data_source_set = get_rules(
            infoext)
        # 提取数据并写入mongodb
        standard_extract_rabbitmq(json_data, graph_mongo_Name, conn_db, ds_id, rules, entity_type)
        # mongodb写入orientdb
        ret_obj = mongodb2graphdb(args.get("pro_index"), args.get("en_pro_dict"), args.get("edge_pro_dict"),
                                   args.get("graph_KMap"), args.get("graph_KMerge"),
                                   args.get("graphid"), args.get("graph_db_id"), args.get("mongo_db"),
                                   args.get("graph_mongo_Name"))
        obj = {"state": ret_obj["state"], "meta": ret_obj["meta"]}
    return obj


def get_rabbitinfo(graphid):
    """
    获取rabbitMQ数据源的配置信息
    Args:
        graphid: 图谱id
    Return:
        df: dict,该图谱使用的数据源的具体信息
    """
    # 查找图谱使用的数据源
    dss = graph_dao.getdsgraphuse(graphid)
    ds_dict = dss.to_dict('records')
    ds_dict = ds_dict[0]
    used_ds_list = eval(ds_dict["graph_ds"])
    # rabbitmq只能单独使用
    if len(used_ds_list) > 1:
        return -1, {}
    # 根据数据源id，获取具体信息
    df = dsm_dao.getrabbitdsbyid(used_ds_list[0])
    if len(df) > 0:
        df = df.to_dict('records')[0]
        return 0, df
    return -1, df


@cel.task(name='app.buildertask', bind=True)
def buildertask(self, graphid, flag):
    """运行任务，

    Args:
        graphid: 图谱id
        flag: 是否是增量，增量：increment； 全量：full
    """
    try:
        general_variable.updategraph = False
        # 读取配置
        configure = Configure(aspi_config_path="./../config/asapi.conf", config_ini_path="./../config/config.ini")
        # 读取graph_config_table内容，获取图谱配置信息
        res = get_graph_config_info(graphid)
        data_source_set = set()
        if len(res) == 2:
            res_obj, res_code = res[0], res[1]
            if res_code == -1:
                self.update_state(state=res_obj["state"], meta=res_obj["meta"])
                return {'current': 100, 'total': 100}
        else:
            res_obj, graph_baseInfo, pro_index, en_pro_dict, edge_pro_dict, graph_InfoExt, graph_KMap, graph_KMerge, \
            graph_used_ds, address, mongo_db, graph_mongo_Name, graph_db_id = res
            self.update_state(state=res_obj["state"], meta=res_obj["meta"])
            try:
                ret = task_dao.getGraphDBbyId(graph_db_id)
                rec_dict = ret.to_dict('records')
                if len(rec_dict) == 0:
                    self.update_state(state='FAILURE',
                                      meta={'cause': "DB IP does not exist", 'message': "graph_InfoExt failed"})
                    return {'current': 100, 'total': 100}
                rec_dict = rec_dict[0]
                username = rec_dict["db_user"]
                password = rec_dict["db_ps"]
                # 密码解密
                password = decrypt_base64(password)
                if not password:
                    self.update_state(state='FAILURE',
                                      meta={'cause': "graphDB password error!",
                                            'message': "graph_InfoExt failed"})
                    return {'current': 100, 'total': 100}
                graph_DBPort = rec_dict["port"]
                # 验证用户名密码是否可用
                # if not account_verify(address, graph_Port, username, password, graph_db_id):
                #     self.update_state(state='FAILURE',
                #                       meta={'cause': "user and password verification failed",
                #                             'message': "graph_InfoExt failed"})
                #     return {'current': 100, 'total': 100}
                graphdb = GraphDB(graph_db_id)  # 图数据库操作
                # 检查图数据库是否存在，不存在则新建
                graphdb.check_db(mongo_db)
                if len(graphdb.state) != 0:
                    self.update_state(state=graphdb.state['state'],
                                      meta={'cause': graphdb.state['meta']['cause'],
                                            'message': graphdb.state['meta']['message']})
                    return {'current': 100, 'total': 100}
                # 获取图谱使用的数据源配置信息
                code, args = get_rabbitinfo(graphid)
                if code == 0:
                    # RabbitMQ
                    # 数据比对校验, 传输的数据和新建数据源时定义的数据规范没重复的key
                    # if not set(args.get("json_schema", {}).keys()) & set(json_data.keys()):
                    #     self.update_state(state='FAILURE',
                    #                       meta={'cause': "orientDB database list get failed!",
                    #                             'message': "graph_InfoExt failed"})
                    #     return {'current': 100, 'total': 100}
                    args["rabbitmq_task"] = rabbitmq_task
                    args["graph_mongo_Name"] = graph_mongo_Name
                    args["graph_InfoExt"] = graph_InfoExt
                    args["pro_index"] = pro_index
                    args["en_pro_dict"] = en_pro_dict
                    args["edge_pro_dict"] = edge_pro_dict
                    args["graph_KMap"] = graph_KMap
                    args["graph_baseInfo"] = graph_baseInfo
                    args["graph_KMerge"] = graph_KMerge
                    args["ds_password"] = decrypt_base64(args["ds_password"])
                    args["graph_db_id"] = graph_db_id
                    args["address"] = address
                    args["mongo_db"] = mongo_db
                    # args["graph_mongo_Name"] = graph_mongo_Name
                    args["username"] = username
                    args["password"] = password
                    args["graph_DBPort"] = graph_DBPort
    
                    # 启动监听
                    Logger.log_info("图谱{}，RabbitMQ启动监听...".format(graphid))
                    rabbit_start_listening(args)
                    self.update_state(state='graph_KMerge', meta={'current': "graph_KMerge", 'total': "100"})
                    return {'current': 100, 'total': 100}
                else:
                    # 非RabbitMQ
                    # 根据图谱名称创建数据库
                    create_mongodb_by_graph_name(conn_db, graph_mongo_Name, flag=flag)
                    # 根据抽取信息 抽取中间存储数据
                    for infoext in graph_InfoExt:
                        # 从每一条抽取信息中获取抽取规则
                        data_source, file_path, file_name, file_source, ds_id, extract_type, rules, \
                        entity_type, extract_rules, data_source_set1 = get_rules(infoext)
                        data_source_set = data_source_set | data_source_set1
                        files_type = infoext["file_type"]
                        # 标准抽取
                        if extract_type == "standardExtraction":
                            ret_code, obj = standard_extract(conn_db, graph_mongo_Name, graph_used_ds, data_source, ds_id, file_name,
                                             file_source, rules, entity_type)
                            if ret_code != CommonResponseStatus.SUCCESS.value:
                                self.update_state(state='FAILURE', meta=obj)
                                return {'current': 100, 'total': 100}
                        # 标注抽取
                        elif extract_type == "labelExtraction":
                            labelExtraction(graph_KMerge, graph_used_ds, data_source, ds_id, file_name, file_source,
                                            graph_db_id, mongo_db, graphid, graph_DBPort, username, password, pro_index)
                        # Anyshare模型抽取
                        else:
                            extract_model = infoext["extract_model"]
                            # 合同模型
                            if extract_model == "Contractmodel":
                                contract_model_extract(conn_db, graph_mongo_Name, ds_id, file_source, configure.configYaml,
                                                       configure.model, configure.stopwords_file, configure.process_num,
                                                       configure.schema_file, files_type)
                            elif extract_model == "OperationMaintenanceModel":
                                try:
                                    operation_maintenance_model_extract(conn_db, graph_mongo_Name, ds_id, file_source, configure.aspi_config_path, files_type)
                                except Exception as e:
                                    Logger.log_error("OperationMaintenanceModel error： {}".format(repr(e)))
                            # AI模型和通用模型
                            elif extract_model != "Anysharedocumentmodel":
                                obj = ai_common_model_extract(Config.modeldir, extract_model, conn_db, ds_id, file_source, files_type,
                                                              extract_rules, graph_mongo_Name)
                                if obj:
                                    self.update_state(state=obj["state"],
                                                      meta={"cause": obj["meta"]["cause"],
                                                            "message": obj["meta"]["message"]})
                                    return {'current': 100, 'total': 100}
                            # 文档知识模型
                            else:
                                as_document_model_extract(conn_db, ds_id, file_source, flag, graph_mongo_Name,
                                                          Config.modeldir,
                                                          extract_model,
                                                          configure.aspi_config_path)
            except Exception as e:
                er = repr(e)
                if "_source" in er:
                    er = "read data failed! file_path error!"
                if "connection" in er and "error" in er:
                    er = "get anyshare data false because of connection error"
                self.update_state(state='FAILURE', meta={'cause': er, 'message': "graph_InfoExt failed3"})
                return {'current': 100, 'total': 100}
            # mongodb数据写入graphdb
            self.update_state(state='graph_KMap', meta={'current': "graph_KMap", 'total': "100"})
            ret_obj = mongodb2graphdb(pro_index, en_pro_dict, edge_pro_dict, graph_KMap, graph_KMerge,
                                      graphid, graph_db_id, mongo_db, graph_mongo_Name)
            self.update_state(state=ret_obj["state"], meta=ret_obj["meta"])
            return {'current': 100, 'total': 100}
    except Exception as e:
        self.update_state(state='FAILURE', meta={'cause': repr(e), 'message': "buildertask failed"})
        return {'current': 100, 'total': 100}
    finally:
        # 无论图谱构建成功或失败，都要统计数量信息
        try:
            if graphdb.type == 'nebula':
                print('nebula submit job stats.')
                time.sleep(20)
                graphdb.submit_job_nebula(mongo_db, graphid, 'stats')
                # 统计数量结束之后才允许结束
                time_out = 60 * 60  # 超时时间为1h
                while not graphdb.job_status_nebula(mongo_db, graphid):
                    time.sleep(5)
                    time_out -= 5
                    if time_out < 0:
                        raise CeleryTaskException(
                            (ExceptLevel.ERROR, 'Builder.celeryTask.graphdb.nebulaTimeOutError', 'nebula job time out'))
        except Exception:
            pass  # 统计任务失败的异常忽略掉


@cel.task
def send_builder_task(task_type, graph_id, trigger_type, cycle, task_id):
    url = "http://kg-builder:6485/buildertask"
    # url = "http://10.4.106.255:6485/buildertask" #本地测试
    payload = {"tasktype": task_type, "graph_id": graph_id, "trigger_type": trigger_type}
    print(f'start timer task,payload: {payload}')
    close_key = f'close_{graph_id}'
    try:
        # 定时任务需要进行任务注册防止同一时刻运行同一个图谱任务
        if cycle:
            if cycle == 'one':
                if not redislock.read_conn.exists(close_key):
                    redislock.write_conn.set(close_key, task_id)
                    redislock.write_conn.expire(close_key, 50)
            status = redislock.get_lock(graph_id, task_id)
            if not status:
                print(f"timer_task_id:{task_id} skip,the graph:{graph_id} task is runninig or waiting")
                return
        response = requests.request("POST", url, data=json.dumps(payload))
        res_json = response.json()
        code = res_json["code"]
        if code != 200:
            print(f'send timer error,res_json:{res_json}')
        else:
            print(f"send timer success,task_id:{task_id}")
    except Exception as e:
        print(f'send timer exception:{str(e)}')



def create_mongo_index(graph_mongo_Name, entity_type, g_merge):
    """
    给指定的集合创建唯一索引
    从融合属性里面找到融合属性列表，然后创建唯一索引

    参数：
        graph_mongo_Name: mongo里面的集合名字的前缀
            demo: mongoDB-10_t_enterprise_econ_kind, mongoDB-10就是前缀，t_enterprise_econ_kind是实体类的名称
        entity_type: 表名字
            demo: t_stock_percent_wide
        g_merge: 融合属性
            demo: {"t_stock_percent_wide": {"name": "equality"}}
                  name: 是融合属性
                  equality: 是融合的方法
    """
    merge_otls, merge_flag = get_Kmerge_dict(g_merge)
    # 如果merge_flag==False，那么可以抛出错误，不允许，没有融合属性
    if not merge_flag:
        raise Exception("entity {}, merge flag not set error".format(entity_type))

    c = MongoBuildDao.get_collection(graph_mongo_Name + "_" + entity_type)
    merge_pro = []  # 属性列表
    if entity_type not in merge_otls:
        return
    for k, v in merge_otls[entity_type].items():
        merge_pro.append((k, 1))
    try:
        c.create_index(merge_pro, unique=True)
    except Exception as e:
        raise ("create mongo unique index error:{}".format(repr(e)))


class RelationBuildBase(object):
    """
    写边的类，包含一些比较复杂的数据对象，是其他写边子类的必备类，一个对象即可，考虑使用单例模式
    """

    def __init__(self, otls_map, en_pro_dict, edge_pro_dict, relations_map,
                 g_merge, graph_db_id, mongo_db, graph_mongo_Name):
        self.otls_map = otls_map
        self.relations_map = relations_map

        mapInfo = get_map_info(otls_map)
        self.otl_tab_map = mapInfo[1]
        merge_otls, merge_flag = get_Kmerge_dict(g_merge)

        self.en_pro_dict = en_pro_dict
        self.edge_pro_dict = edge_pro_dict
        self.merge_otls = merge_otls
        self.g_merge = g_merge
        self.graph_db_id = graph_db_id
        self.mongo_db = mongo_db
        # mongodb集合名称前缀，每个图一种前缀
        self.graph_mongo_Name = graph_mongo_Name
        self.graphdb = GraphDB(self.graph_db_id)
        self.sqlProcessor = SQLProcessor(self.graphdb.type)

    def gen_vid(self, otl_name, one_data):
        """
        计算实体one_data在图数据库中的的VertexId，支持nebula和orientdb

        逻辑
            根据实体类的融合属性，根据web页面的先后顺序，计算出MD5结果

        参数
            otl_name: 实体类名称，用来获实体类的融合属性
            one_data: 实际的实体点数据

        条件
            1. 实体类必须有融合属性

        返回
            MD5字符串
                demo: 7f3fdf6fbbbcb5875062a88473303e0a
        """
        return gen_doc_vid(self.merge_otls, otl_name, one_data, self.en_pro_dict, self.graphdb.type)

    def get_collection_name(self, class_name):
        """
        获取实体类名对应的mongodb 集合名称

        参数
            class_name: 实体类名
        """
        return self.graph_mongo_Name + "_" + class_name


class RelationManualBase(object):
    """
    每种边类型的基础信息，基本都是从buildInfo.relations_map中获取的

    参数
        rela_id: 边类型索引，整形
        buildInfo: RelationBuildBase,写边基础信息
    """

    def __init__(self, rela_id: int, buildInfo: RelationBuildBase):
        self.buildInfo = buildInfo

        rela = self.buildInfo.relations_map[rela_id]

        relation_info = rela["relation_info"]
        self.source = relation_info["source_type"]
        self.model = relation_info["model"]
        # 获取头尾实体
        self.begin_vertex_class = relation_info["begin_name"]
        self.edge_class = relation_info["edge_name"]
        self.end_vertex_class = relation_info["end_name"]
        self.entity_data = relation_info["entity_type"]
        # 获取 边 属性
        property_map = rela["property_map"]
        self.edge_otl_pro = []  # 边的属性列表
        self.edge_otl_tab_pro = {}  # 边的属性对应的实体属性
        for pro_map in property_map:
            self.edge_otl_pro.append(pro_map["edge_prop"])
            self.edge_otl_tab_pro[pro_map["edge_prop"]
            ] = pro_map["entity_prop"]
        # 获取 映射 数据
        relation_map = rela["relation_map"][0]
        self.begin_class_prop = relation_map["begin_class_prop"]
        self.equation_begin = relation_map["equation_begin"]
        self.relation_begin_pro = relation_map["relation_begin_pro"]
        self.equation = relation_map["equation"]
        self.relation_end_pro = relation_map["relation_end_pro"]
        self.equation_end = relation_map["equation_end"]
        self.end_class_prop = relation_map["end_class_prop"]


class RelationManualBuilder(object):
    """
    写边公共类，包含写边的公共方法

    参数
        buildInfo： RelationManualBase，每种边类型的基础信息
    """

    def __init__(self, buildInfo: RelationManualBase):
        self.__dict__ = buildInfo.__dict__
        self.len_dict = dict()

    def get_collection_prop_len(self, class_name, class_prop):
        """
        获取某个实体类中某个属性的长度范围

        逻辑
            使用mongo数据库的aggregate计算，有一定的耗时，

        参数
            class_name: 实体类名
            class_prop: 需要统计长度范围的属性

        返回
            字典格式：{"2":1,"10":1,"5":1}
        """
        mongo_collection_name = self.buildInfo.get_collection_name(class_name)
        collection = MongoBuildDao.get_collection(mongo_collection_name)
        return MongoBuildDao.prop_len(collection, class_prop)

    def load_collection_prop_len(self, class_name, class_prop):
        """
        保存某集合某属性长度返回
        """
        len_dict = self.__dict__.get('len_dict', dict())
        len_value = self.get_collection_prop_len(class_name, class_prop)
        # 有值的情况下，才会更新
        if len_value:
            len_dict[class_name] = len_value
            self.len_dict = len_dict

    def props_filter(self):
        """
        mongo查询，没必要获取文档的所有属性，将相关的属性返回即可

        逻辑
            包含
                1. 起点和终点的融合属性  》 计算VertexID
                2. 起点和终点，关系类的关联属性   》 直接关系和间接关系的所有属性
        """
        merge_pro = {}
        # 起点的融合属性
        for k, v in self.buildInfo.merge_otls[self.begin_vertex_class].items():
            merge_pro[k] = 1
        # 终点的融合属性
        for k, v in self.buildInfo.merge_otls[self.end_vertex_class].items():
            merge_pro[k] = 1

        filter_dict = {
            self.begin_class_prop: 1,
            self.relation_begin_pro: 1,
            self.relation_end_pro: 1,
            self.end_class_prop: 1}
        filter_dict.update(merge_pro)
        return filter_dict

    def edge_sql(self, one_data):
        """
        构造边的属性值sql语句
        """
        sql_processor: SQLProcessor = self.buildInfo.sqlProcessor
        return sql_processor.prop_value_sql(
            self.entity_data, self.edge_otl_tab_pro, one_data, edge_class=self.edge_class)

    def find_contain_relations(self, collection, len_dict, collection_prop, find_value):
        """
        关系A.p1 包含 B.p2
        p1是父串，p2是子串， 如果找出包含关系，需要将p1_value的全部子串手动计算出来，然后在B中查询

        对应调用是:
        find_contain_relations(B_collection, B_lenDict, B_p2, p1_value)

        参数
            collection: Mongo集合对象， B_collection
            lenDict:  mongo集合长度字典，B_lenDict
            collection_prop: mongo集合关系属性，B_p2
            find_value: p1_value

        """
        sub_strings = MongoBuildDao.gen_sub_str(len_dict, find_value)
        exist_items = MongoBuildDao.relations(collection, collection_prop, sub_strings, self.props_filter())
        return exist_items

    def find_equal_relations(self, batch_data, batch_prop, relation_collection, relation_prop):
        """
        关系A.p1 等于 B.p2，假定边的方向是从A->B

        先从A中查询出一批数据batch_data，batch_prop就是p1, relation_collection就是B，relation_prop就是p2

        对应调用是:
        find_equal_relations(batch_data, p1, B_collection, p2)

        参数
            batch_data: 批量数据
            batch_prop: 批量数据的映射关系属性
            relation_collection: 关系集合的mongo collection
            relation_prop: 关系集合的映射属性

        返回： 字典 one_of_batch[batch_prop]:list[mongo_document]
        """
        values = [one[batch_prop] for one in batch_data if batch_prop in one]
        items = relation_collection.find({relation_prop: {"$in": values}}, self.props_filter())

        results = dict()
        for item in items:
            key = item[relation_prop]
            end_data = results.get(key, [])
            end_data.append(item)
            results[key] = end_data
        return results

    def create_batch_edges(self, batch_data, batch_begin, batch_end):
        """
        批量写入边到图数据库， 由batch_data开始构建

        参数
            batch_data: 批量的关系数据
            batch_begin: 起点数据
            batch_end: 终点数据

        逻辑
            1. 分批写边，每批次5000条
            2. 支持nebula和orientdb
            3. 参数都是list，长度一致

        """
        starts = []
        ends = []
        prop_val_sqls = []
        graphdb: GraphDB = self.buildInfo.graphdb
        total = 0

        for one_data in batch_data:
            # 构造边的属性值sql语句
            prop_val_sql = self.edge_sql(one_data)
            # 获取某个数据的ObjectId字符串
            key = str(one_data['_id'])
            # 边的起点和终点，可能有多种情况
            start_points = batch_begin[key] if key in batch_begin else []
            end_points = batch_end[key] if key in batch_end else []
            for i in start_points:
                for j in end_points:
                    starts.append(i)
                    ends.append(j)
                    prop_val_sqls.append(prop_val_sql)
                    if len(starts) % 5000 == 0:
                        total += 5000
                        # nebula插入必须单线程，这里加锁
                        self.lock.acquire()
                        graphdb.create_edges(self.edge_class, starts, ends, prop_val_sqls, self.buildInfo.mongo_db)
                        self.lock.release()

                        # 循环重置
                        starts = []
                        ends = []
                        prop_val_sqls = []

        if len(starts) > 0:
            total += len(starts)

            self.lock.acquire()
            graphdb.create_edges(self.edge_class, starts, ends, prop_val_sqls, self.buildInfo.mongo_db)
            self.lock.release()

            # print("write {} edge".format(total))

    def gen_batch_vid(self, batch_otl_name, batch_datas):
        """
        计算批量数据的vid

        参数：
            otl_name: batch_data对应的实体类名称
            batch_datas: 批量实体数据

        返回：字典结构，[bsonId]:list(vids)
        """
        results = dict()
        for one in batch_datas:
            vid = self.buildInfo.gen_vid(batch_otl_name, one)
            results[str(one["_id"])] = [vid]
        return results

    def batch_equal_relations(self, batch_data, batch_prop, relation_class_name, relation_prop):
        """
        去集合查询等于关系的数据

        参数：
            batch_data: 批量数据
            batch_class_name: 批量数据对应的实体类名
            batch_prop: 批量数据的映射关系属性
            relation_collection: 关系集合的mongo collection
            relation_prop: 关系集合的映射属性
        """
        relation_collection_name = self.buildInfo.get_collection_name(relation_class_name)
        relation_collection = MongoBuildDao.get_collection(relation_collection_name)
        end_item_dict = self.find_equal_relations(batch_data, batch_prop, relation_collection, relation_prop)

        results = dict()
        for one_data in batch_data:
            key = one_data[batch_prop]
            if key not in end_item_dict:
                continue
            one_ends = end_item_dict[key]
            vids = []
            for one in one_ends:
                # 如果两个ID一样，是同一个点
                if str(one['_id']) == str(one_data['_id']):
                    continue
                vid = self.buildInfo.gen_vid(relation_class_name, one)
                vids.append(vid)
            results[str(one_data["_id"])] = vids
        return results

    def batch_contain_relations(self, batch_data, batch_prop, relation_class_name, relation_prop):
        """
        查询包含情况下的关系开始值

        参数
            batch_data: 批量数据
            batch_prop: 批量数据的映射关系属性
            relation_class_name: 关系实体的mongo集合名称
            len_dict:
            relation_prop: 关系集合的映射属性
        wordsDict:dict -> bsonID[words]
        """
        # 去mongo中的集合C，查询每个数据对应的关系数据words
        results = dict()
        relation_collect_name = self.buildInfo.get_collection_name(relation_class_name)
        relation_collection = MongoBuildDao.get_collection(relation_collect_name)
        len_dict = self.len_dict[relation_class_name]
        for one_data in batch_data:
            if batch_prop not in one_data:
                continue
            docs = self.find_contain_relations(relation_collection, len_dict, relation_prop, one_data[batch_prop])

            vids = []
            bsonId = str(one_data['_id'])
            for one in docs:
                # 如果两个ID一样，是同一个点
                if str(one['_id']) == str(one_data['_id']):
                    continue
                vid = self.buildInfo.gen_vid(relation_class_name, one)
                vids.append(vid)
            results[bsonId] = vids

        return results


class RelationIn2Class(RelationManualBuilder):
    """
    涉及两个类之间的关系边构建，也叫 两框

    参数
        relationBaseInfo: 某边构建的基础信息
    """

    def __init__(self, relationBaseInfo: RelationManualBuilder):
        super().__init__(relationBaseInfo)
        """
            边构建的前期准备，主要是准备一些属性
        """
        self.start_collection_name = self.buildInfo.graph_mongo_Name + "_" + \
                                     self.buildInfo.otl_tab_map[self.begin_vertex_class]["entity_data"]
        self.end_collection_name = self.buildInfo.graph_mongo_Name + "_" + \
                                   self.buildInfo.otl_tab_map[self.end_vertex_class]["entity_data"]

        self.start_collection = MongoBuildDao.get_collection(
            self.start_collection_name)
        self.end_collection = MongoBuildDao.get_collection(
            self.end_collection_name)

        self.start_data_count = self.start_collection.count_documents({})
        self.end_data_count = self.end_collection.count_documents({})

    def prepare_from_start(self):
        """
        边构建的起点数据
        """
        self.all_data_collection = self.start_collection
        self.all_data_count = self.start_data_count
        self.find_class = self.begin_vertex_class
        self.relation_class = self.end_vertex_class
        self.find_prop = self.buildInfo.otl_tab_map[self.begin_vertex_class]["pro_map"][self.begin_class_prop]
        self.relation_prop = self.buildInfo.otl_tab_map[self.end_vertex_class]["pro_map"][self.end_class_prop]
        self.reverse = False

    def prepare_from_end(self):
        """
        边构建的终点数据
        """
        self.all_data_collection = self.end_collection
        self.all_data_count = self.end_data_count
        self.find_class = self.end_vertex_class
        self.relation_class = self.begin_vertex_class
        self.find_prop = self.buildInfo.otl_tab_map[self.end_vertex_class]["pro_map"][self.end_class_prop]
        self.relation_prop = self.buildInfo.otl_tab_map[self.begin_vertex_class]["pro_map"][self.begin_class_prop]
        self.reverse = True

    def prepare(self):
        if self.equation == "包含" or self.equation == "被包含":
            if self.equation == "被包含":
                self.prepare_from_end()
            if self.equation == "包含":
                self.prepare_from_start()

            # 包含情况下，要加载属性长度范围，为后面的包含关系计算做准备
            self.load_collection_prop_len(self.find_class, self.find_prop)
            self.load_collection_prop_len(self.relation_class, self.relation_prop)

        if self.equation == "等于":
            if self.start_data_count <= self.end_data_count:
                self.prepare_from_start()
            else:
                self.prepare_from_end()

        # 添加hash索引，方便mongo查找
        MongoBuildDao.hashed_index(self.start_collection, self.find_prop)
        MongoBuildDao.hashed_index(self.end_collection, self.relation_prop)

        self.lock = threading.Lock()

    def write(self):
        """
        写边的入口方法
        """
        self.prepare()
        if self.start_data_count <= 0 or self.end_data_count <= 0:
            return

        pool = ThreadPool(10)
        iter_size = 1000
        current = 0
        while current < self.all_data_count:
            pool.apply_async(self.process, (self.all_data_collection, current, iter_size))
            # f(c, current, iter_size)
            current += iter_size
        pool.close()
        pool.join()
        print("edge_class:{}=>{}->{} total: {}".format(self.edge_class, self.begin_vertex_class, self.end_vertex_class, self.all_data_count))


    def process(self, collection, current, iter_size):
        """
        批量处理边

        参数
            collection: 起点的mongo集合
            current: 当前数据的索引
            iter_size: 每次数据的长度
        """
        batch_results = collection.find({}, self.props_filter()).skip(current).limit(iter_size)
        batch_data = list(batch_results)
        print("edge_class:{}=>{}->{} current: {}".format(self.edge_class, self.begin_vertex_class, self.end_vertex_class, current))

        # 直接关系情况下，边的起点可以直接计算
        batch_begin = self.gen_batch_vid(self.find_class, batch_data)

        if self.equation == "包含" or self.equation == "被包含":
            batch_end = self.batch_contain_relations(batch_data, self.find_prop, self.relation_class,
                                                     self.relation_prop)

        if self.equation == "等于":
            batch_end = self.batch_equal_relations(batch_data, self.find_prop, self.relation_class, self.relation_prop)

        if self.reverse:
            self.create_batch_edges(batch_data, batch_end, batch_begin)
        else:
            self.create_batch_edges(batch_data, batch_begin, batch_end)


class RelationIn3Class(RelationManualBuilder):
    """
    涉及三个类之间的关系边构建
    以等于关系举例
    A.p1==B.p2; B.p3=c.p4

    A: begin_vertex_class
    B: entity_data
    c: end_vertex_class
    p1: begin_class_prop
    p2: relation_begin_pro
    p3: relation_end_pro
    p4: end_class_prop

    构建关系是从A->C

    参数
        relationBaseInfo: 某边构建的基础信息
    """

    def __init__(self, relation_base_info: RelationManualBase):
        super().__init__(relation_base_info)

        self.start_collection_ame = self.buildInfo.graph_mongo_Name + "_" + \
                                    self.buildInfo.otl_tab_map[self.begin_vertex_class]["entity_data"]
        self.end_collection_name = self.buildInfo.graph_mongo_Name + "_" + \
                                   self.buildInfo.otl_tab_map[self.end_vertex_class]["entity_data"]

        self.start_prop = self.buildInfo.otl_tab_map[self.begin_vertex_class]["pro_map"][self.begin_class_prop]
        self.end_prop = self.buildInfo.otl_tab_map[self.end_vertex_class]["pro_map"][self.end_class_prop]

        self.start_collection = MongoBuildDao.get_collection(self.start_collection_ame)
        self.end_collection = MongoBuildDao.get_collection(self.end_collection_name)

        self.start_count = self.start_collection.count_documents({})
        self.end_count = self.end_collection.count_documents({})

        self.lock = threading.Lock()

    def prepare(self):
        # 添加hash索引
        MongoBuildDao.hashed_index(self.start_collection, self.start_prop)
        MongoBuildDao.hashed_index(self.end_collection, self.end_prop)

    def get_edge_collection(self):
        """
        获取关系类entity_data的mongo集合
        """
        edge_collection_name = self.buildInfo.graph_mongo_Name + "_" + self.entity_data
        if self.entity_data == self.buildInfo.otl_tab_map[self.begin_vertex_class]["entity_data"]:
            edge_collection_name = self.start_collection_ame
        if self.entity_data == self.buildInfo.otl_tab_map[self.end_vertex_class]["entity_data"]:
            edge_collection_name = self.end_collection_name
        return MongoBuildDao.get_collection(edge_collection_name)

    def write(self):
        """
        写边入口方法
        """
        self.prepare()
        # 确定边所在类
        edge_collection = self.get_edge_collection()
        total = edge_collection.count_documents({})
        if total > 0:
            if self.equation_begin == "被包含":
                self.load_collection_prop_len(self.begin_vertex_class, self.begin_class_prop)

            if self.equation_end == "包含":
                self.load_collection_prop_len(self.end_vertex_class, self.end_class_prop)

        pool = ThreadPool(10)
        iter_size = 1000
        current = 0
        while current < total:
            pool.apply_async(self.process, (edge_collection, current, iter_size))
            # self.write_process(edge_collection, current, iter_size)
            current += iter_size
        pool.close()
        pool.join()
        print("edge_class:{}=>{}->{} total: {}".format(self.edge_class, self.begin_vertex_class, self.end_vertex_class, total))

    def process(self, collection, current, iter_size):
        """
        批量处理边

        参数
            collection: 起点的mongo集合
            current: 当前数据的索引
            iter_size: 每次数据的长度
        """
        batch_results = collection.find({}, self.props_filter()).skip(current).limit(iter_size)
        batch_data = list(batch_results)
        if current % 100000 == 0:
            print("edge_class:{}=>{}->{} current: {}".format(self.edge_class, self.begin_vertex_class, self.end_vertex_class, current))

        if self.equation_begin == "等于":
            batch_begin = self.batch_equal_relations(batch_data, self.relation_begin_pro, self.begin_vertex_class,
                                                     self.begin_class_prop)

        if self.equation_begin == "被包含":
            batch_begin = self.batch_contain_relations(batch_data, self.relation_begin_pro, self.begin_vertex_class,
                                                       self.begin_class_prop)

        if self.equation_end == "等于":
            batch_end = self.batch_equal_relations(batch_data, self.relation_end_pro, self.end_vertex_class,
                                                   self.end_class_prop)

        if self.equation_end == "包含":
            batch_end = self.batch_contain_relations(batch_data, self.relation_end_pro, self.end_vertex_class,
                                                     self.end_class_prop)

        self.create_batch_edges(batch_data, batch_begin, batch_end)


class EdgeWriter(object):

    def __init__(self, otls_map, en_pro_dict, edge_pro_dict, relations_map, g_merge, graph_db_id, mongo_db, graph_mongo_Name):
        self.relationBuildInfo = RelationBuildBase(
            otls_map, en_pro_dict, edge_pro_dict, relations_map, g_merge, graph_db_id, mongo_db, graph_mongo_Name)

    def write(self):
        for rel_i in range(len(self.relationBuildInfo.relations_map)):
            base_info = RelationManualBase(rel_i, self.relationBuildInfo)
            # 如果是手绘
            if base_info.source == 'manual':
                self.manual(base_info)
            # 如果是model
            if base_info.model != '':
                self.model(base_info)

    def manual(self, base_info):
        # 用户在流程五未选择实体的映射属性
        if not base_info.begin_class_prop or not base_info.end_class_prop:
            return None
        # 如果是4框
        if base_info.equation == '':
            builder = RelationIn3Class(base_info)
            builder.write()
        # 如果是2框
        else:
            builder = RelationIn2Class(base_info)
            builder.write()

    def model(self, base_info):
        """
        模型处理方法，代码没有动
        """
        edge_class = base_info.edge_class
        begin_vertex_class = base_info.begin_vertex_class
        end_vertex_class = base_info.end_vertex_class
        graph_mongo_Name = base_info.buildInfo.graph_mongo_Name
        sqlProcessor = base_info.buildInfo.sqlProcessor
        edge_pro_dict = base_info.buildInfo.edge_pro_dict
        merge_otls = base_info.buildInfo.merge_otls
        graphdb = base_info.buildInfo.graphdb
        mongo_db = base_info.buildInfo.mongo_db
        graph_db_id = base_info.buildInfo.graph_db_id

        if edge_class == (begin_vertex_class + "2" + end_vertex_class):
            s_class = edge_class.split("2")[0]
            o_class = edge_class.split("2")[-1]
        else:
            s_class = begin_vertex_class
            o_class = end_vertex_class
        if edge_class != "":
            table2 = conn_db[graph_mongo_Name + "_" + edge_class]
            alldata = table2.find()
            # 关系改为批量执行
            pool = ThreadPool(20)
            # pool = multiprocessing.Pool(10)
            if alldata.count() > 0:
                table = conn_db[graph_mongo_Name + "_" + edge_class]
                alldata_length = alldata.count()
                iter_size = 1000
                current = 0
                batch_id = []
                # batch = table.find().limit(iter_size)
                while current < alldata_length:
                    if (batch_id):
                        # batch = table.find({"_id": {'$gt': ObjectId(batch_id[0])}}).limit(iter_size)
                        batch = table.find().limit(iter_size).skip(current)
                    else:
                        batch = table.find().limit(iter_size)
                    sql_list = sqlProcessor.edge_sql_multi(s_class, o_class, edge_class, batch, edge_pro_dict,
                                                           merge_otls=merge_otls)
                    if (batch_id):
                        # batch = table.find({"_id": {'$gt': ObjectId(batch_id[0])}}).limit(iter_size)
                        batch = table.find().limit(iter_size).skip(current)
                    else:
                        batch = table.find().limit(iter_size)
                    list_d = pd.DataFrame(list(batch))
                    list_d = list_d["_id"].tail(1)
                    batch_id = list_d.tolist()
                    if graphdb.type == 'nebula':
                        props_check = list(
                            edge_pro_dict[edge_class].keys())
                        graphdb._check_schema_nebula(
                            mongo_db, edge_class, props_check, 'edge')
                    pool.apply_async(
                        graphdb.exec_batch, (sql_list, mongo_db))
                    if graphdb.type == 'nebula':
                        if (batch_id):
                            batch = table.find().limit(iter_size).skip(current)
                        else:
                            batch = table.find().limit(iter_size)
                        es_bulk_edge_index = sqlProcessor.es_bulk_edge_multi(mongo_db, edge_class, batch, graph_db_id,
                                                                             s_class, o_class, merge_otls)
                        graphdb.fulltext_bulk_index(es_bulk_edge_index)
                    # print("批两处理关系最后一个id: ",batch_id)
                    # 创建
                    # oriendb_batch_http(address, mongo_db, batch_sql_t[0], graph_DBPort, username, password,
                    #                    graphid)
                    # 更新
                    # oriendb_batch_http(address, mongo_db, batch_sql_t[1], graph_DBPort, username,
                    #                    password,
                    #                    graphid)
                    # del batch_sql
                    # del batch_sql_t
                    # pool.close()
                    # pool.join()
                    current = current + iter_size
                    if current % 10000 == 0:
                        print(f'{edge_class}已插入数据：{current}条')
            pool.close()
            pool.join()
            print(f'{edge_class}共插入(更新)数据{alldata.count()}条')


class VertexWriter(object):

    def __init__(self, all_otl_class, graph_mongo_name, graphdb, graph_db_id, mongo_db, en_pro_dict, merge_otls):
        self.graphdb = graphdb
        self.all_otl_class = all_otl_class
        self.graph_mongo_name = graph_mongo_name
        self.en_pro_dict = en_pro_dict
        self.mongo_db = mongo_db
        self.graph_db_id = graph_db_id
        self.merge_otls = merge_otls
        self.sqlProcessor = SQLProcessor(self.graphdb.type)
        self.lock = threading.Lock()

    def write(self):
        for o_i in range(len(self.all_otl_class)):
            # 细节处理map信息
            otl_name, tab_, otl_pro, tab_pro, tab_otl, otl_tab = get_Kmap_dict(o_i, self.all_otl_class)

            if not tab_:
                continue

            print(f'开始插入顶点:{otl_name}')
            vertex_time1 = time.time()

            collection_name = self.graph_mongo_name + "_" + tab_
            collection = conn_db[collection_name]
            total = collection.count_documents({})
            if total <= 0:
                continue
            iter_size = MongoBuildDao.step_size(collection_name, 4194304)

            index = 0
            batch_size = 200000
            while index < total:
                # 多线程插入
                pool = ThreadPool(10)
                current = 0
                while current < batch_size and (current + index) <= total:
                    pool.apply_async(self.process, (collection, current + index, iter_size, otl_tab, otl_name))
                    # self.process(collection, current+ index, iter_size, otl_tab, otl_name)
                    current += iter_size
                pool.close()
                pool.join()

                index += batch_size
            print(f'创建顶点{otl_name}, total:{total} 成功,耗时:{time.time() - vertex_time1}s')

    def process(self, collection, current, iter_size, otl_tab, otl_name):
        try:
            batch = collection.find({}).skip(current).limit(iter_size)
            batch_copy = copy.deepcopy(batch)

            # 生成ES索引
            es_bulk_index = ''
            if self.graphdb.type == 'nebula':
                es_bulk_index = self.sqlProcessor.es_bulk_multi(self.mongo_db, otl_name, otl_tab,
                                                                self.en_pro_dict, self.merge_otls,
                                                                batch, self.graph_db_id)

            # 生成nebula插入语句
            batch_sql = self.sqlProcessor.vertex_sql_multi(batch_copy, otl_tab, self.en_pro_dict,
                                                           self.merge_otls, otl_name)

            # 插入nebula点， 单线程
            self.lock.acquire()
            self.graphdb.create_vertex(self.mongo_db, batch_sql=batch_sql, es_bulk_index=es_bulk_index,
                                       otl_name=otl_name, props=list(otl_tab.keys()))
            self.lock.release()

            # 打个日志
            if (current + iter_size) % 100000 == 0:
                print("当前插入顶点{}， {}个".format(otl_name, current + iter_size))
        except Exception as e:
            traceback.print_exc()




class Transfer(object):
    """
    数据转换的基类
    """

    def __init__(self, rules, ds_id, collection):
        self.ds_id = ds_id
        self.collection = collection
        self.rules = rules

    def get_client(self):
        pass

    def run(self):
        pass

    def extract(self, data, columns):
        """
        数据转换的通用方法，每个实现都要用到的方法
        """
        if len(self.rules) <= 0:
            raise BaseException('extract rules empty error')

        try:
            new_columns = [otl_util.is_special(i) for i in columns]
            columns_dict = {v: k for k, v in enumerate(new_columns)}
            mongo_data = []
            exist_rule = [r for r in self.rules if r in columns_dict]

            for row in data:
                temp_dict = {k: row[v] for k, v in columns_dict.items() if row[v]}
                m = {k: temp_dict[k] for k in exist_rule if k in temp_dict}
                m["ds_id"] = self.ds_id
                mongo_data.append(m)
            MongoBuildDao.insert_many(c=self.collection, documents=mongo_data, ordered=False)
        except BaseException:
            traceback.print_exc()


class HiveTransfer(Transfer):
    """
    hive的提取方法
    """

    def __init__(self, table_name, ds, rules, ds_id, collection):
        super().__init__(rules, ds_id, collection)
        self.table_name = table_name
        self.data_ds = ds
        self.hive_batch_number = 1000000
        self.parser_batch_number = 20000

    def get_client(self):
        ip = self.data_ds['ds_address']
        port = self.data_ds['ds_port']
        database = self.data_ds['ds_path']
        user = self.data_ds['ds_user']

        password = commonutil.DecryptBybase64(self.data_ds['ds_password'])
        return HiveClient(ip, user, password, database, port)

    def read(self, client):
        database = self.data_ds['ds_path']
        sql0 = """DESC `{}`"""
        sql0 = sql0.format(self.table_name)
        ret0 = client.query(sql0)
        columns = [x[0] for x in ret0]
        sql = "SELECT * FROM {}.`{}`"
        sql = sql.format(database, self.table_name)
        conn = client.conn
        return columns, sql, conn

    def run(self):
        try:
            client = self.get_client()

            columns, sql, hive_conn = self.read(client)
            hive_cursor = hive_conn.cursor()
            hive_cursor.execute(sql)

            while True:
                start_time = time.time()
                ret = hive_cursor.fetchmany(size=self.hive_batch_number)
                if not ret:
                    hive_conn.close()
                    break

                total = len(ret)
                print(f'hive读取{total / 10000}w条数据耗时:{time.time() - start_time}s')
                rows = [list(data) for data in ret]

                pool = ThreadPool(10)
                current = 0
                while current < total:
                    pool.apply_async(self.extract, (rows[current:current + self.parser_batch_number], columns))
                    current += self.parser_batch_number
                pool.close()
                pool.join()
        except BaseException as e:
            print("extract data error:{}".format(repr(e)))

        return CommonResponseStatus.SUCCESS.value, 'standard_extract success'


class MysqlTransfer(Transfer):
    """
    mysql处理类
    """

    def __init__(self, table_name, data_ds, rules, ds_id, collection):
        super().__init__(rules, ds_id, collection)
        self.table_name = table_name
        self.data_ds = data_ds

    def get_client(self):
        ip = self.data_ds['ds_address']
        port = self.data_ds['ds_port']
        database = self.data_ds['ds_path']
        user = self.data_ds['ds_user']
        password = commonutil.DecryptBybase64(self.data_ds['ds_password'])

        return pymysql.connect(host=ip, database=database, user=user, password=password, port=port, charset='utf8')

    def total(self, client):
        try:
            sql = "SELECT count(1) FROM {}".format(self.table_name)
            cursor = client.cursor()
            cursor.execute(sql)
            data = cursor.fetchall()
            cursor.close()
            return int(data[0][0])
        except BaseException:
            traceback.print_exc()

    def run(self):
        client = self.get_client()

        iter_size = 1000
        batch_size = 200000
        skip = 0

        try:
            while True:
                sql = "select * from {} limit {}, {}".format(self.table_name, skip, batch_size)
                df = pd.read_sql(sql, client)
                df2 = list(df)  # 列

                data = [value for index, value in df.iterrows()]
                total = len(data)
                if len(data) <= 0:
                    break

                current = 0
                pool = ThreadPool(10)
                while current < total:
                    pool.apply_async(self.extract, (data[current:current + iter_size], df2))
                    current += iter_size

                pool.close()
                pool.join()

                skip += batch_size
        except BaseException:
            traceback.print_exc()
            return CommonResponseStatus.QUEUE_ERROR.value, 'standard_extract fail'
        return CommonResponseStatus.SUCCESS.value, 'standard_extrac success'


class ASTransfer(Transfer):

    def __init__(self, file_name, file_source, used_ds, rules, ds_id, collection):
        super().__init__(rules, ds_id, collection)
        self.file_name = file_name
        self.data_ds = used_ds
        self.file_source = file_source

    def read(self):
        ds_address = self.data_ds['ds_address']
        keylist = ["extension", "content"]
        version = otl_dao.getversion(ds_address)
        ret_code, result = otl_dao.getinfofromas(self.data_ds, keylist, self.file_source, version)
        if ret_code == 500:
            print("error : {}".format(self.file_name))
            return ret_code, result
        else:
            return ret_code, result

    def extract_csv(self, file_content):
        if "\r\n" in file_content:
            lines = file_content.split("\r\n")
        elif "\n\t" in file_content:
            lines = file_content.split("\n\t")
        else:
            lines = file_content.split("\n")
        lie_l = lines[0]
        if "\r" in lie_l:
            lie_l = lie_l.replace("\r", "")
        if "\t" in lie_l:
            if lie_l.startswith('\t'):
                lie_list = lie_l.split("\t")[1:]
            else:
                lie_list = lie_l.split("\t")
        elif "," in lie_l:
            lie_list = lie_l.split(",")
        elif "，" in lie_l:
            lie_list = lie_l.split("，")
        else:
            lie_list = []
            lie_list.append(lie_l)
        lie_list = [otl_util.is_special(_) for _ in lie_list]  # 构建任务 读取文件内容 属性 特殊字符处理
        # lie_list = lie_l.split("\t")
        mongo_data = []
        for line in lines[1:]:  # 遍历行
            line = line.replace("\r", "")
            if "\t" in line:
                if line.startswith('\t'):
                    line_val = line.split("\t")[1:]
                else:
                    line_val = line.split("\t")
            elif "," in line:
                line_val = line.split(",")
            elif "，" in line:
                line_val = line.split("，")
            else:
                line_val = []
                line_val.append(line)
            if len(line_val) != len(lie_list):
                continue
            # if "" in line_val:
            #     line_val.remove("")
            mongodict = {}  # 组装 mongo数据
            for ind in range(len(lie_list)):  # 遍历列名
                for key in self.rules:  # 本体 实体名
                    val = self.rules[key]  # 本体 属性名list
                    lie_var = lie_list[ind]
                    if "\r" in lie_var:
                        lie_var = lie_var.replace("\r", "")
                    if lie_var in val:
                        dict_m = {}
                        dict_m[lie_var] = line_val[ind]
                        if key not in mongodict.keys():
                            mongodict[key] = dict_m
                        else:
                            old_d = mongodict[key]
                            new_d = {**old_d, **dict_m}
                            mongodict[key] = new_d

            for all_en in mongodict:
                value = mongodict[all_en]
                Entity1_data = value  # 实体1的属性
                Entity1_data["ds_id"] = self.ds_id
                mongo_data.append(Entity1_data)
                if len(mongo_data) % 10000 == 0:
                    MongoBuildDao.insert_many(c=self.collection, documents=mongo_data, ordered=False)
                    mongo_data = []
        if mongo_data:
            MongoBuildDao.insert_many(c=self.collection, documents=mongo_data, ordered=False)

    def extract_json(self, file_content):
        lines = file_content.split("\n")
        mongo_data = []
        for line in lines:  # 遍历行
            json_t = json.loads(line)
            json_t = otl_util.flatten_json(json_t, 3)
            lie_ = json_t.keys()
            mongodict = {}  # 组装 mongo数据
            for lie in lie_:  # 遍历列名
                a = isinstance(json_t[lie], list)
                b = isinstance(json_t[lie], dict)
                if not (a or b):
                    for key in self.rules:
                        val = self.rules[key]
                        if lie in val:
                            dict_m = {}
                            if json_t[lie] != None:
                                dict_m[lie] = str(json_t[lie])
                                if key not in mongodict.keys():
                                    mongodict[key] = dict_m
                                else:
                                    old_d = mongodict[key]
                                    new_d = {**old_d, **dict_m}
                                    mongodict[key] = new_d

            for all_en in mongodict:
                value = mongodict[all_en]
                Entity1_data = value  # 实体1的属性
                Entity1_data["ds_id"] = self.ds_id
                mongo_data.append(Entity1_data)
                if len(mongo_data) % 10000 == 0:
                    MongoBuildDao.insert_many(c=self.collection, documents=mongo_data, ordered=False)
                    mongo_data = []

        if mongo_data:
            MongoBuildDao.insert_many(c=self.collection, documents=mongo_data, ordered=False)

    def run(self):
        ret_code, data = self.read()
        if ret_code != CommonResponseStatus.SUCCESS.value:
            # 仅token错误时才中止任务，读取文件发生错误仍继续运行
            if (data.get('code') and
                    (data.get('code') == CommonResponseStatus.UNVERIFY_ERROR.value or
                     data.get('code') == CommonResponseStatus.TOKEN_OVERDUE_ERROR.value)):
                return ret_code, data
            else:
                ret_code = CommonResponseStatus.SUCCESS.value
        try:
            _source = data
            if "extension" in _source:
                file_type = _source["extension"]
            elif "ext" in _source:
                file_type = _source["ext"]
            file_content = _source["content"]

            if file_type == ".csv":
                self.extract_csv(file_content)
            if file_type == ".json":
                self.extract_json(file_content)
        except BaseException:
            print("error : {}".format(self.file_name))

        return ret_code, 'standard_extract success'

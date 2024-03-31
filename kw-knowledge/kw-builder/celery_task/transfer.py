import csv
import json
import os
import sys
import time
import traceback
import uuid
from multiprocessing.pool import ThreadPool

import clickhouse_connect
import psycopg2
import pymysql
import pyodbc
from bson import json_util
from func_timeout import func_set_timeout

import common.stand_log as log_oper
from celery_task.graph_config import OntologyConfig, GraphKMapConfig
from celery_task.writer import VertexWriter, EdgeWriter
from dao.builder_dao import MongoBuildDao
from dao.dsm_dao import dsm_dao
from service.dsm_Service import dsm_service
from utils.CommonUtil import commonutil
from utils.ConnectUtil import HiveClient
from utils.Otl_Util import otl_util
from utils.log_info import Logger


class DataStorage(object):
    ''' 将 Transfer读取到的数据存储进mongodb和图数据库中 '''

    def __init__(self, otl_class: dict, graph_DBName: str, graph_mongo_Name: str, ontology_config: OntologyConfig,
                 kmap_config: GraphKMapConfig, flag: str):
        '''

        Args:
            otl_class: 实体类/关系类信息
            graph_DBName: 图数据库名称
            graph_mongo_Name: mongodb名称
            ontology_config: 本体配置信息
            kmap_config: 文件映射配置信息
            flag: 是否是增量，增量：increment；全量：full
        '''
        self.graph_mongo_Name = graph_mongo_Name
        self.flag = flag
        self.is_entity = 'relations' not in otl_class

        self.vertex_writer, self.edge_writer = None, None
        if self.is_entity:
            otl_name = otl_class['name']
            self.vertex_writer = VertexWriter(otl_name, graph_DBName, ontology_config, kmap_config, flag)
            otl_info = kmap_config.entity_info(otl_name)
        else:
            relation = otl_class['relations']
            self.edge_writer = EdgeWriter(relation, graph_DBName, graph_mongo_Name, ontology_config, kmap_config,
                                          flag)
            otl_info = kmap_config.edge_info(relation)

        # entity_type: entity_type
        self.entity_type = otl_info.entity_type
        # entity_index: 融合属性对应的文件的属性列表
        self.entity_index = []
        if self.entity_type:
            # ds_id: 抽取对象的数据源id
            self.ds_id = otl_info.ds_id
            # rules: 抽取对象属性列表
            # 点抽取映射属性对应的属性即可
            # 边还需要另外加上连接边需要用到的属性
            # 如果是增量，还要加上_timestamp和_action
            self.rules = set(otl_info.otl_tab.values())
            if not self.is_entity:
                if otl_info.equation:
                    # 两框
                    self.rules.update({otl_info.start_prop, otl_info.end_prop})
                else:
                    # 三框
                    self.rules.update({otl_info.relation_begin_pro, otl_info.relation_end_pro})
            if flag == 'increment':
                self.rules.update({'_timestamp', '_action'})
            if self.is_entity:
                self.entity_index = [otl_info.otl_tab[p]
                                     for p in ontology_config.pro_merge.get(otl_name, [])]

        self.collection = None

    def create_mongo(self):
        ''' 创建 mongodb 集合和 mongodb 的唯一索引'''
        message = f'创建mongodb集合:{self.entity_type}'
        Logger.log_info(message)
        self.collection = MongoBuildDao.client[self.graph_mongo_Name + "_" + self.entity_type]

        message = f'创建mongodb集合:{self.entity_type} 唯一索引'
        Logger.log_info(message)
        self.create_mongo_index()

    def create_mongo_index(self):
        """
        给指定的集合创建唯一索引

        参数：
            graph_mongo_Name: mongo里面的集合名字的前缀
                demo: mongoDB-10_t_enterprise_econ_kind, mongoDB-10就是前缀，t_enterprise_econ_kind是实体类的名称
            entity_type: 表名字
                demo: t_stock_percent_wide
            entity_index: 索引信息
                demo: [id, name]
        """
        c = MongoBuildDao.get_collection(self.graph_mongo_Name + "_" + self.entity_type)
        merge_pro = [(index, 1) for index in self.entity_index]  # 属性列表
        if not merge_pro:
            return
        try:
            if self.flag == 'increment':
                # 增量构建删除旧的唯一索引
                old_indexes = list(c.list_indexes())
                for i in old_indexes:
                    if i.get('unique') and i.get('key'):
                        if set(json_util.loads(json_util.dumps(i.get('key'))).keys()) != set(self.entity_index):
                            c.drop()
                            break
            c.create_index(merge_pro, unique=True)
        except Exception as e:
            raise Exception("create mongo unique index error:{}".format(repr(e)))

    def extract(self, data):
        """
        将数据插入mongodb和图数据库中
        写点时，写mongo和写图数据库一起进行
        @data: 数据库读取的数据列表，每项数据是dict类型
        """
        start_time = time.time()
        current = 0
        total = len(data)
        iter_size = 1000
        pool = ThreadPool(15)
        pool_res = []
        while current < total:
            batch = data[current:current + iter_size]
            pool_res.append(pool.apply_async(self.write_mongo_process, args=(batch,)))
            if self.is_entity:
                pool_res.append(pool.apply_async(self.vertex_writer.write_process, args=(batch, current + iter_size)))
            current += iter_size
        pool.close()
        pool.join()
        for res in pool_res:
            # 如果线程内部有异常则在此处抛出
            res.get()
        end_time = time.time()
        if self.is_entity:
            message = f"mongodb和图数据库写入一批长度为 {total} 的实体 {self.entity_type} 结束，" \
                      f"耗时:{end_time - start_time}s"
        else:
            message = f'mongodb写入一批长度为 {total} 的实体 {self.entity_type} 结束，' \
                      f"耗时:{end_time - start_time}s"
        Logger.log_info(message)

    def write_mongo_process(self, data):
        """
        将数据插入mongodb中
        @data: 数据库读取的数据列表，每项数据是dict类型
        """
        try:
            mongo_data = []

            for row in data:
                # 只有需要抽取的列(属性映射+关系映射)才写入mongo
                m = {otl_util.is_special(key): str(row.get(key)) if row.get(key) is not None else None
                     for key in row if otl_util.is_special(key) in self.rules}
                m["_ds_id_"] = self.ds_id
                mongo_data.append(m)
            if self.flag == "increment" and self.collection.count() != 0:
                MongoBuildDao.upsert(self.collection, mongo_data, self.entity_index)
            else:
                MongoBuildDao.insert_many(c=self.collection, documents=mongo_data, ordered=False)
        except BaseException as e:
            error_log = log_oper.get_error_log("write_mongo_process error: {}".format(e), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
            raise e

    def write_edge(self, **kwargs):
        '''
        边写入图数据库
        写边时，等写mongo结束之后再写入图数据库
        增量删除边也在里面
        '''
        self.edge_writer.write_edge(**kwargs)

    def mongo_delete(self, table_timestamp):
        '''
        mongodb 删除数据
        Args:
            table_timestamp: 上次构建记录的时间戳
        '''
        if table_timestamp:
            self.collection.delete_many({'$and': [
                {'_timestamp': {'$gt': table_timestamp}},
                {'_action': {'$gt': '0'}}
            ]})
        else:
            self.collection.delete_many({'_action': {'$gt': '0'}})

    def delete(self, data):
        ''' 图数据库增量删除点 '''
        self.vertex_writer.delete(data)


class Transfer(object):
    """
    数据转换的基类，读取数据源中的数据，并通过
    """

    def __init__(self, otl_class: dict, kmap_config: GraphKMapConfig, flag: str = None,
                 data_storage: DataStorage = None):
        '''
        
        Args:
            otl_class: 实体类/关系类信息，有 name 或 relations 属性即可
            kmap_config: 文件映射配置信息
            flag: 是否是增量，增量：increment；全量：full
            data_storage: 将数据存储进mongodb和图数据库的操作类
        '''
        self.otl_class = otl_class
        self.data_storage = data_storage

        self.is_entity = 'relations' not in otl_class
        if self.is_entity:
            self.otl_info = kmap_config.entity_info(otl_class['name'])
        else:
            self.otl_info = kmap_config.edge_info(otl_class['relations'])

        # entity_type: entity_type
        self.entity_type = self.otl_info.entity_type
        if self.entity_type:
            # ds_id: 抽取对象的数据源id
            self.ds_id = self.otl_info.ds_id
            # data_ds: 数据源信息
            self.data_ds = dsm_dao.getdatabyid(self.ds_id)[0]
            # rules: 抽取对象属性列表
            self.rules = self.otl_info.otl_tab.values()
            # table_name: 抽取文件名
            self.table_name = self.otl_info.files['files'][0]['file_name']
            # file_source: 抽取文件具体信息
            self.file_source = self.otl_info.files['files'][0]['file_source']
            if self.otl_info.extract_type == 'sqlExtraction':
                # sql抽取则去除句尾的分号，防止嵌套查询时出错
                self.file_source = self.file_source.strip()
                if self.file_source.endswith(';'):
                    self.file_source = self.file_source[:-1]

        self.flag = flag

    def prepare(self):
        '''
        抽取前的准备
        '''
        if self.flag == 'increment':
            self.flag = self.check_increment()
            message = 'check_increment result: {}'.format(self.flag)
            Logger.log_info(message)
        if not self.entity_type:
            message = '{} 未映射至数据，抽取结束'.format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            raise Exception(message)
        if self.is_entity and len(self.rules) <= 0:
            message = '{} 缺少映射规则，抽取结束'.format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            raise Exception(message)
        if self.data_storage:
            self.data_storage.create_mongo()

    def extract(self, data):
        """
        将数据插入mongodb和图数据库中
        写点时，写mongo和写图数据库一起进行
        @data: 数据库读取的数据列表，每项数据是dict类型
        """
        if self.data_storage:
            self.data_storage.extract(data)

    def write_edge(self, **kwargs):
        '''
        边写入图数据库
        写边时，等写mongo结束之后再写入图数据库
        增量删除边也在里面
        '''
        if self.data_storage:
            self.data_storage.write_edge(**kwargs)

    def mongo_delete(self, table_timestamp):
        '''
        mongodb 删除数据
        Args:
            table_timestamp: 上次构建记录的时间戳
        '''
        if self.data_storage:
            self.data_storage.mongo_delete(table_timestamp)

    def delete(self, data):
        '''
        图数据库增量删除点
        Args:
            data: 删除的数据
        '''
        if self.data_storage:
            self.data_storage.delete(data)

    def check_increment(self) -> str:
        '''
        判断数据源中的表是否支持增量，即列名中是否有 _timestamp 和 _action
        如果列名不符合增量抽取的条件，则返回 full
        否则返回 increment

        '''
        extract_type = self.otl_info.extract_type
        # 没选择文件则跳过判断
        if not extract_type:
            return "increment"

        if type(self) in [MysqlOdbcTransfer, MysqlTransfer, HiveTransfer, SqlserverTransfer,
                          KingbaseesTransfer, PostgresqlTransfer, ClickHouseTransfer]:
            columns = self.get_columns()
        else:
            return 'full'

        if "_timestamp" not in columns or "_action" not in columns:
            message = f"_timestamp or _action not in {self.otl_info.files['files'][0]['file_name']} columns"
            Logger.log_info(message)
            return "full"

        return "increment"


class HiveTransfer(Transfer):
    """
    hive处理类
    """

    def __init__(self, otl_class: dict, kmap_config: GraphKMapConfig, flag: str = None,
                 data_storage: DataStorage = None):
        super().__init__(otl_class, kmap_config, flag, data_storage)
        self.hive_batch_number = 1000000
        self.partition_usage = self.otl_info.files.get('partition_usage', False)
        self.partition_infos = self.otl_info.files.get('partition_infos', {})

    def get_client(self):
        ip = self.data_ds['ds_address']
        port = self.data_ds['ds_port']
        database = self.data_ds['ds_path']
        user = self.data_ds['ds_user']

        password = commonutil.DecryptBybase64(self.data_ds['ds_password'])
        return HiveClient(ip, user, password, database, port, timeout=60)

    def get_columns(self) -> list[str]:
        ''' 获取表的列名 '''
        client = self.get_client()
        hive_conn = client.conn
        hive_cursor = hive_conn.cursor()
        if self.otl_info.extract_type == 'sqlExtraction':
            sql = self.file_source
            hive_cursor.execute(sql)
            # hive如果查询select * ,结果会带有点，需取真实的列名
            return [desc[0].split('.')[-1] for desc in hive_cursor.description]
        else:
            sql0 = """DESC `{}`"""
            sql0 = sql0.format(self.table_name)
            ret0 = client.query(sql0)
            columns = []
            # 分区表特殊处理
            for x in ret0:
                if not x[0]:
                    break
                columns.append(x[0])
            return columns

    def run(self, timestamp: dict = None) -> dict:
        '''
        标准抽取
        Args:
            timestamp: 历史的最大时间。如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间

        '''
        try:
            self.prepare()
            max_timestamp = {}
            client = self.get_client()
            hive_conn = client.conn

            columns = self.get_columns()
            columns_str = ",".join([f"`{column}` as `{otl_util.is_special(column)}`" for column in columns])
            database = self.data_ds['ds_path']
            sql = f"SELECT {columns_str} FROM {database}.`{self.table_name}`"
            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    sql += 'WHERE NOT ISNULL(`_timestamp`) and IF(ISNULL(`_action`), "0", `_action`) <= "0" '
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    sql += 'WHERE NOT ISNULL(`_timestamp`) '
                # 上次构建记录的最大时间戳
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    sql += f" AND `_timestamp` > '{table_timestamp}'"
                if self.partition_usage:
                    for partition, expression in self.partition_infos.items():
                        code, partition_case = dsm_service.getPartitionCase(expression)
                        sql += f" AND `{partition}` = '{partition_case}'"
            else:
                if self.partition_usage:
                    sql += " WHERE"
                    for i, (partition, expression) in enumerate(self.partition_infos.items()):
                        code, partition_case = dsm_service.getPartitionCase(expression)
                        if i == len(self.partition_infos) - 1:
                            sql += f" `{partition}` = '{partition_case}'"
                        else:
                            sql += f" `{partition}` = '{partition_case}' AND"
            hive_cursor = hive_conn.cursor(dictify=True)
            hive_cursor.execute(sql)

            skip = 0
            while True:
                # 从数据源读取数据
                start_time = time.time()
                data = hive_cursor.fetchmany(size=self.hive_batch_number)
                if not data:
                    break
                total = len(data)
                message = f'hive 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)
                skip += total

                # 写入mongodb + 写入图数据库
                self.extract(data)

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建更新最大时间戳
            if "_timestamp" in columns:
                database = self.data_ds['ds_path']
                try:
                    sql = f"select max(`_timestamp`) max_timestamp from {database}.`{self.table_name}`"
                    hive_cursor.execute(sql)
                    table_max_timestamp = hive_cursor.fetchone()["max_timestamp"]
                    if table_max_timestamp:
                        max_timestamp[self.entity_type] = str(table_max_timestamp)
                except:
                    # 如果没数据，执行该sql会报错，忽略错误
                    pass

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                if table_timestamp:
                    sql += f" WHERE NOT ISNULL(`_timestamp`) " \
                           f"AND `_timestamp` > '{table_timestamp}' " \
                           f" and `_action` > '0' "
                else:
                    sql += f" WHERE NOT ISNULL(`_timestamp`) " \
                           f" and `_action` > '0' "
                if self.partition_usage:
                    for partition, expression in self.partition_infos.items():
                        code, partition_case = dsm_service.getPartitionCase(expression)
                        sql += f" AND `{partition}` = '{partition_case}'"
                hive_cursor.execute(sql)
                skip = 0
                while True:
                    start_time = time.time()
                    data = hive_cursor.fetchmany(size=self.hive_batch_number)
                    if not data:
                        break
                    total = len(data)
                    message = f'hive 从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)
                    skip += total

                    # 图数据库 删除数据
                    self.delete(data)

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("HiveTransfer run error:{}".format(repr(e)),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e
        finally:
            hive_conn.close()

    def sql_run(self, timestamp: dict = None) -> dict:
        '''
        sql抽取
        Args:
            timestamp:历史的最大时间.如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间
        '''
        try:
            self.prepare()
            sql = self.file_source
            max_time = ""
            max_timestamp = {}
            client = self.get_client()
            hive_conn = client.conn
            hive_cursor = hive_conn.cursor()

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    sql = f"select * from ({self.file_source}) as temp " \
                          f"where not isnull(temp.`_timestamp`) " \
                          f"and IF(ISNULL(temp.`_action`), '0', temp.`_action`) <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    sql = f"select * from ({self.file_source}) as temp " \
                          f"where not isnull(temp.`_timestamp`) "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    sql += f"and temp.`_timestamp` > '{table_timestamp}'"

            hive_cursor.execute(sql)
            description = hive_cursor.description
            if self.flag == "increment":
                columns = [otl_util.is_special(desc[0])[4:] for desc in description]
            else:
                columns = [otl_util.is_special(desc[0].split('.')[-1]) for desc in description]
            if len(set(columns)) != len(columns):
                raise Exception(f"Duplicate field names exist in {self.table_name} SQL extracting results. ")

            skip = 0
            while True:
                start_time = time.time()
                data = hive_cursor.fetchmany(size=self.hive_batch_number)
                if not data:
                    break
                total = len(data)
                message = f'hive从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                if "_timestamp" in columns:
                    index = columns.index("_timestamp")
                    # 过滤掉空值
                    time_list = [i[index] for i in data if i[index]]
                    if time_list:
                        max_time = max(str(max(time_list)), max_time)

                # 转成字典列表
                # 增量sql抽取，列名前面会变成temp. 所以需要对列名进行处理
                dataDicts = []
                for i in range(total):
                    dataDicts.append(dict(zip(columns, data[i])))

                # 写入mongodb + 写入图数据库
                self.extract(dataDicts)

                skip += self.hive_batch_number

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f"select * from ({self.file_source}) as temp " \
                      f"where not isnull(temp.`_timestamp`) and temp.`_action` > '0' "
                if table_timestamp:
                    sql += f"and temp.`_timestamp` > '{table_timestamp}'"
                hive_cursor.execute(sql)
                skip = 0
                while True:
                    start_time = time.time()
                    data = hive_cursor.fetchmany(size=self.hive_batch_number)
                    if not data:
                        break
                    total = len(data)
                    message = f'hive从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)
                    skip += total

                    if "_timestamp" in columns:
                        index = columns.index("_timestamp")
                        # 过滤掉空值
                        time_list = [i[index] for i in data if i[index]]
                        if time_list:
                            max_time = max(str(max(time_list)), max_time)

                    # 转成字典列表
                    # 增量sql抽取，列名前面会变成temp. 所以需要对列名进行处理
                    dataDicts = []
                    for i in range(total):
                        dataDicts.append(dict(zip(columns, data[i])))

                    # 图数据库 删除数据
                    self.delete(dataDicts)

            # 增量构建更新最大时间戳
            if "_timestamp" in columns and max_time:
                max_timestamp[self.entity_type] = max_time

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("HiveTransfer sql_run error: {}".format(repr(e)),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e
        finally:
            hive_conn.close()


class MysqlTransfer(Transfer):
    """
    mysql处理类
    """

    def __init__(self, otl_class: dict, kmap_config: GraphKMapConfig, flag: str = None,
                 data_storage: DataStorage = None):
        super().__init__(otl_class, kmap_config, flag, data_storage)
        self.batch_size = 200000

    def get_client(self):
        ip = self.data_ds['ds_address']
        port = self.data_ds['ds_port']
        database = self.data_ds['ds_path']
        user = self.data_ds['ds_user']
        password = commonutil.DecryptBybase64(self.data_ds['ds_password'])

        return pymysql.connect(host=ip, database=database, user=user, password=password, port=port,
                               charset='utf8', connect_timeout=60)

    def get_client_dict(self):
        ip = self.data_ds['ds_address']
        port = self.data_ds['ds_port']
        database = self.data_ds['ds_path']
        user = self.data_ds['ds_user']
        password = commonutil.DecryptBybase64(self.data_ds['ds_password'])

        return pymysql.connect(host=ip, database=database, user=user, password=password, port=port, charset='utf8',
                               connect_timeout=60, cursorclass=pymysql.cursors.DictCursor)

    def get_columns(self) -> list[str]:
        ''' 获取表的列名 '''
        client = self.get_client_dict()
        cursor = client.cursor()
        if self.otl_info.extract_type == 'sqlExtraction':
            sql = self.file_source
            cursor.execute(sql)
            return [desc[0] for desc in cursor.description]
        else:
            sql_column = f"desc `{self.table_name}`"
            cursor.execute(sql_column)
            df_column = cursor.fetchall()
            columns = [x.get('Field') for x in df_column]
            return columns

    def run(self, timestamp: dict = None) -> dict:
        '''
        标准抽取
        Args:
            timestamp: 历史的最大时间。如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间

        '''
        try:
            self.prepare()
            max_timestamp = {}
            client = self.get_client_dict()
            cursor = client.cursor()

            columns = self.get_columns()
            columns_str = ",".join([f"`{column}` as `{otl_util.is_special(column)}`" for column in columns])
            condition = ""

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    condition += 'where not isnull(_timestamp) and IF(ISNULL(_action), "0", _action) <= "0" '
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    condition += 'where not isnull(_timestamp) '
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    condition += f"and _timestamp > '{table_timestamp}'"
            skip = 0
            while True:
                # 从数据源读取数据
                start_time = time.time()
                sql = f"select {columns_str} from `{self.table_name}` {condition} limit {skip},{self.batch_size}"
                cursor.execute(sql)
                data = cursor.fetchall()
                total = len(data)
                if len(data) <= 0:
                    break
                message = f'mysql 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                # 写入mongodb + 点写入图数据库
                self.extract(data)

                skip += self.batch_size

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建更新最大时间戳
            if "_timestamp" in columns:
                sql = f"select max(_timestamp) max_timestamp from `{self.table_name}`"
                cursor.execute(sql)
                table_max_timestamp = cursor.fetchone()["max_timestamp"]
                if table_max_timestamp:
                    max_timestamp[self.entity_type] = str(table_max_timestamp)

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)
                skip = 0
                while True:
                    start_time = time.time()
                    sql = f"select {columns_str} from `{self.table_name}`" \
                          f" where not isnull(_timestamp) " \
                          f" and _action > '0' "
                    if table_timestamp:
                        sql += f"and _timestamp > '{table_timestamp}'"
                    sql += f" limit {skip}, {self.batch_size}"
                    cursor.execute(sql)
                    data = cursor.fetchall()
                    total = len(data)
                    if len(data) <= 0:
                        break
                    message = f'mysql 从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    # 图数据库 删除数据
                    self.delete(data)

                    skip += self.batch_size

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("MysqlTransfer run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e

    def sql_run(self, timestamp: dict = None) -> dict:
        '''
        sql抽取
        Args:
            timestamp:历史的最大时间.如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间
        '''
        try:
            self.prepare()
            sql = self.file_source
            max_time = ""
            max_timestamp = {}
            client = self.get_client()
            cursor = client.cursor()

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    sql = f"select * from ({self.file_source}) as temp " \
                          f"where not isnull(temp._timestamp) " \
                          f"and IF(ISNULL(temp._action), '0', temp._action) <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    sql = f"select * from ({self.file_source}) as temp where not isnull(temp._timestamp) "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}' "

            cursor.execute(sql)
            description = cursor.description
            columns = [otl_util.is_special(desc[0]) for desc in description]
            if len(set(columns)) != len(columns):
                raise Exception(f"Duplicate field names exist in {self.table_name} SQL extracting results. ")

            skip = 0
            while True:
                start_time = time.time()
                data = cursor.fetchmany(self.batch_size)
                total = len(data)
                if len(data) <= 0:
                    break
                message = f'mysql从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                if "_timestamp" in columns:
                    # 过滤掉空值
                    index = columns.index("_timestamp")
                    time_list = [i[index] for i in data if i[index]]
                    if time_list:
                        max_time = max(str(max(time_list)), max_time)

                # 转成字典列表，也消除列名中可能存在的特殊字符造成的影响
                retDicts = []
                for i in range(total):
                    retDicts.append(dict(zip(columns, data[i])))

                # 写入mongodb + 写入图数据库
                self.extract(retDicts)

                skip += self.batch_size

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)
                delete_sql = f"select * from ({self.file_source}) as temp " \
                             f"where not isnull(temp._timestamp) " \
                             f" and temp._action > '0' "
                if table_timestamp:
                    delete_sql += f"and temp._timestamp > '{table_timestamp}'"
                cursor.execute(delete_sql)
                skip = 0
                while True:
                    start_time = time.time()
                    data = cursor.fetchmany(self.batch_size)
                    total = len(data)
                    if len(data) <= 0:
                        break
                    message = f'mysql从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    if "_timestamp" in columns:
                        # 过滤掉空值
                        index = columns.index("_timestamp")
                        time_list = [i[index] for i in data if i[index]]
                        if time_list:
                            max_time = max(str(max(time_list)), max_time)

                    # 转成字典列表，也消除列名中可能存在的特殊字符造成的影响
                    retDicts = []
                    for i in range(total):
                        retDicts.append(dict(zip(columns, data[i])))

                    # 图数据库 删除数据
                    self.delete(retDicts)

                    skip += self.batch_size

            # 增量构建更新最大时间戳
            if "_timestamp" in columns and max_time:
                max_timestamp[self.entity_type] = max_time
            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("MysqlTransfer sql_run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e


class MysqlOdbcTransfer(Transfer):
    """
    mysql odbc 处理类
    """

    def __init__(self, otl_class: dict, kmap_config: GraphKMapConfig, flag: str = None,
                 data_storage: DataStorage = None):
        super().__init__(otl_class, kmap_config, flag, data_storage)
        self.batch_size = 200000

    def get_client(self):
        ip = self.data_ds['ds_address']
        port = self.data_ds['ds_port']
        database = self.data_ds['ds_path']
        user = self.data_ds['ds_user']
        password = commonutil.DecryptBybase64(self.data_ds['ds_password'])

        cnxnstr = f'DRIVER=MySQL ODBC 8.0 Unicode Driver;SERVER={ip};PORT={port};' \
                  f'DATABASE={database};UID={user};PWD={password};'

        # mysql的odbc连接需要特殊处理，因为pyodbc.connect中timeout参数无效
        # 设定函数超时执行时间
        @func_set_timeout(60)
        def connect(cnxnstr):
            return pyodbc.connect(cnxnstr, timeout=60)

        try:
            conn = connect(cnxnstr)
        except:
            raise Exception("Can't connect to MySQL server on '{}' (timed out)".format(ip))

        return conn

    def get_columns(self) -> list[str]:
        ''' 获取表的列名 '''
        client = self.get_client()
        cursor = client.cursor()
        if self.otl_info.extract_type == 'sqlExtraction':
            sql = self.file_source
            cursor.execute(sql)
            return [desc[0] for desc in cursor.description]
        else:
            sql_column = f"desc `{self.table_name}`;"
            cursor.execute(sql_column)
            ret = cursor.fetchall()
            columns = [x[0] for x in ret]
            return columns

    def run(self, timestamp: dict = None) -> dict:
        '''
        标准抽取
        Args:
            timestamp: 历史的最大时间。如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间

        '''
        try:
            self.prepare()
            max_timestamp = {}
            client = self.get_client()
            cursor = client.cursor()

            columns = self.get_columns()
            columnsWithoutSpecial = [otl_util.is_special(column) for column in columns]
            columns_str = ",".join([f"`{column}` as `{otl_util.is_special(column)}`" for column in columns])
            condition = ""

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    condition += "where not isnull(_timestamp) and IF(ISNULL(_action), '0', _action) <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    condition += "where not isnull(_timestamp) "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    condition += f"and _timestamp > '{table_timestamp}'"
            sql = f"select {columns_str} from `{self.table_name}` {condition}"
            cursor.execute(sql)
            skip = 0
            while True:
                # 从数据源读取数据
                start_time = time.time()
                data = cursor.fetchmany(self.batch_size)
                total = len(data)
                if len(data) <= 0:
                    break
                message = f'mysql odbc 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                # 转成字典列表
                retDicts = []
                for i in range(total):
                    retDicts.append(dict(zip(columnsWithoutSpecial, data[i])))

                # 写入mongodb + 写入图数据库
                self.extract(retDicts)

                skip += self.batch_size

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建更新最大时间戳
            if "_timestamp" in columns:
                sql = f"select max(_timestamp) max_timestamp from `{self.table_name}`"
                cursor.execute(sql)
                res = list(cursor.fetchone())
                if res[0]:
                    max_timestamp[self.entity_type] = str(res[0])

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f"select {columns_str} from `{self.table_name}`" \
                      f" where not isnull(_timestamp) " \
                      f" and _action > '0' "
                if table_timestamp:
                    sql += f"and _timestamp > '{table_timestamp}'"
                cursor.execute(sql)
                skip = 0
                while True:
                    start_time = time.time()
                    data = cursor.fetchmany(self.batch_size)
                    total = len(data)
                    if len(data) <= 0:
                        break
                    message = f'mysql odbc 从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    retDicts = []
                    for i in range(total):
                        retDicts.append(dict(zip(columns, data[i])))

                    # 图数据库 删除数据
                    self.delete(retDicts)

                    skip += self.batch_size

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("MysqlOdbcTransfer run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e

    def sql_run(self, timestamp: dict = None) -> dict:
        '''
        sql抽取
        Args:
            timestamp:历史的最大时间.如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间
        '''
        try:
            self.prepare()
            sql = self.file_source
            max_time = ""
            max_timestamp = {}
            client = self.get_client()
            cursor = client.cursor()

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    sql = f"select * from ({self.file_source}) as temp where not isnull(temp._timestamp) " \
                          f"and IF(ISNULL(temp._action), '0', temp._action) <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    sql = f"select * from ({self.file_source}) as temp where not isnull(temp._timestamp) "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}'"

            cursor.execute(sql)
            description = cursor.description
            columns = [otl_util.is_special(desc[0]) for desc in description]
            if len(set(columns)) != len(columns):
                raise Exception(f"Duplicate field names exist in {self.table_name} SQL extracting results. ")

            skip = 0
            while True:
                start_time = time.time()
                data = cursor.fetchmany(self.batch_size)
                total = len(data)
                if len(data) <= 0:
                    break
                message = f'mysql odbc 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                if "_timestamp" in columns:
                    index = columns.index("_timestamp")
                    time_list = [i[index] for i in data if i[index]]
                    if time_list:
                        max_time = max(str(max(time_list)), max_time)

                # 转成字典列表
                retDicts = []
                for i in range(total):
                    retDicts.append(dict(zip(columns, data[i])))

                # 写入mongodb + 写入图数据库
                self.extract(retDicts)

                skip += self.batch_size

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f"select * from ({self.file_source}) as temp " \
                      f"where not isnull(temp._timestamp) " \
                      f"and temp._action > '0' "
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}'"
                cursor.execute(sql)
                description = cursor.description
                columns = [otl_util.is_special(desc[0]) for desc in description]
                skip = 0
                while True:
                    start_time = time.time()
                    data = cursor.fetchmany(self.batch_size)
                    total = len(data)
                    if len(data) <= 0:
                        break
                    message = f'mysql odbc 从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    if "_timestamp" in columns:
                        index = columns.index("_timestamp")
                        time_list = [i[index] for i in data if i[index]]
                        if time_list:
                            max_time = max(str(max(time_list)), max_time)

                    # 转成字典列表
                    retDicts = []
                    for i in range(total):
                        retDicts.append(dict(zip(columns, data[i])))

                    # 图数据库 删除数据
                    self.delete(retDicts)

                    skip += self.batch_size

            # 增量构建更新最大时间戳
            if "_timestamp" in columns and max_time:
                max_timestamp[self.entity_type] = max_time

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("MysqlOdbaTransfer sql_run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e


class SqlserverTransfer(Transfer):
    """
    sqlserver处理类
    """

    def __init__(self, otl_class: dict, kmap_config: GraphKMapConfig, flag: str = None,
                 data_storage: DataStorage = None):
        super().__init__(otl_class, kmap_config, flag, data_storage)
        self.batch_size = 200000
        table_name = self.table_name
        self.table_name = table_name.split("/")[-1]
        self.schema = table_name.split("/")[0]

    def get_client(self):
        ip = self.data_ds['ds_address']
        port = self.data_ds['ds_port']
        database = self.data_ds['ds_path']
        user = self.data_ds['ds_user']
        password = commonutil.DecryptBybase64(self.data_ds['ds_password'])

        cnxnstr = f'DRIVER=ODBC Driver 18 for SQL Server;SERVER={ip},{port};' \
                  f'DATABASE={database};TrustServerCertificate=yes;UID={user};PWD={password};'
        return pyodbc.connect(cnxnstr, autocommit=True, timeout=60)

    def get_columns(self) -> list[str]:
        ''' 获取表的列名 '''
        client = self.get_client()
        cursor = client.cursor()
        if self.otl_info.extract_type == 'sqlExtraction':
            sql = self.file_source
            cursor.execute(sql)
            return [desc[0] for desc in cursor.description]
        else:
            sql_column = f"select column_name from information_schema.COLUMNS " \
                         f"where TABLE_SCHEMA=N'{self.schema}' and TABLE_NAME=N'{self.table_name}';"
            cursor.execute(sql_column)
            ret = cursor.fetchall()
            columns = [x[0] for x in ret]
            return columns

    def run(self, timestamp: dict = None) -> dict:
        '''
        标准抽取
        Args:
            timestamp: 历史的最大时间。如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间

        '''
        try:
            self.prepare()
            max_timestamp = {}
            client = self.get_client()
            cursor = client.cursor()

            columns = self.get_columns()
            columnsWithoutSpecial = [otl_util.is_special(column) for column in columns]
            columns_str = ",".join([f'''"{column}" as "{otl_util.is_special(column)}"''' for column in columns])
            condition = ""

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    condition += "where _timestamp is not null and" \
                                 " CASE WHEN _action IS NULL THEN '0' ELSE _action END <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    condition += "where _timestamp is not null "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    condition += f"and _timestamp > '{table_timestamp}'"
            sql = f'''select {columns_str} from "{self.schema}"."{self.table_name}" {condition}'''
            cursor.execute(sql)

            skip = 0
            while True:
                # 从数据源读取数据
                start_time = time.time()
                data = cursor.fetchmany(self.batch_size)
                total = len(data)
                if len(data) <= 0:
                    break
                message = f'sqlserver 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                # 转成字典列表
                retDicts = []
                for i in range(total):
                    retDicts.append(dict(zip(columnsWithoutSpecial, data[i])))

                # 写入mongodb + 写入图数据库
                self.extract(retDicts)

                skip += self.batch_size

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建更新最大时间戳
            if "_timestamp" in columns:
                sql = f'''select max(_timestamp) max_timestamp from "{self.schema}"."{self.table_name}"'''
                cursor.execute(sql)
                res = list(cursor.fetchone())
                if res[0]:
                    max_timestamp[self.entity_type] = str(res[0])

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f'select {columns_str} from "{self.schema}"."{self.table_name}" ' \
                      f"where _timestamp is not null and _action>'0' "
                if table_timestamp:
                    sql += f"and _timestamp > '{table_timestamp}' "
                cursor.execute(sql)
                skip = 0
                while True:
                    # 从数据源读取数据
                    start_time = time.time()
                    data = cursor.fetchmany(self.batch_size)
                    total = len(data)
                    if len(data) <= 0:
                        break
                    message = f'sqlserver 从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    # 转成字典列表
                    retDicts = []
                    for i in range(total):
                        retDicts.append(dict(zip(columnsWithoutSpecial, data[i])))

                    # 图数据库 删除数据
                    self.delete(retDicts)

                    skip += self.batch_size

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("SqlserverTransfer run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e

    def sql_run(self, timestamp: dict = None) -> dict:
        '''
        sql抽取
        Args:
            timestamp:历史的最大时间.如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间
        '''
        try:
            self.prepare()
            sql = self.file_source
            max_time = ""
            max_timestamp = {}
            client = self.get_client()
            cursor = client.cursor()

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    sql = f"select * from ({self.file_source}) as temp where temp._timestamp is not null and " \
                          " CASE WHEN temp._action IS NULL THEN '0' ELSE temp._action END <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    sql = f"select * from ({self.file_source}) as temp where temp._timestamp is not null "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}'"
            cursor.execute(sql)
            description = cursor.description
            columns = [otl_util.is_special(desc[0]) for desc in description]
            if len(set(columns)) != len(columns):
                raise Exception(f"Duplicate field names exist in {self.table_name} SQL extracting results. ")

            skip = 0
            while True:
                # 从数据源读取数据
                start_time = time.time()
                data = cursor.fetchmany(self.batch_size)
                total = len(data)
                if len(data) <= 0:
                    break
                message = f'sqlserver 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                if "_timestamp" in columns:
                    index = columns.index("_timestamp")
                    time_list = [i[index] for i in data if i[index]]
                    if time_list:
                        max_time = max(str(max(time_list)), max_time)

                # 转成字典列表
                retDicts = []
                for i in range(total):
                    retDicts.append(dict(zip(columns, data[i])))

                # 写入mongodb + 写入图数据库
                self.extract(retDicts)

                skip += self.batch_size

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f"select * from ({self.file_source}) as temp " \
                      f"where temp._timestamp is not null and _action>'0' "
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}'"
                cursor.execute(sql)
                description = cursor.description
                columns = [otl_util.is_special(desc[0]) for desc in description]

                skip = 0
                while True:
                    start_time = time.time()
                    data = cursor.fetchmany(self.batch_size)
                    total = len(data)
                    if len(data) <= 0:
                        break
                    message = f'sqlserver 从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    if "_timestamp" in columns:
                        index = columns.index("_timestamp")
                        time_list = [i[index] for i in data if i[index]]
                        if time_list:
                            max_time = max(str(max(time_list)), max_time)

                    # 转成字典列表
                    retDicts = []
                    for i in range(total):
                        retDicts.append(dict(zip(columns, data[i])))

                    # 图数据库 删除数据
                    self.delete(retDicts)

                    skip += self.batch_size

            # 增量构建更新最大时间戳
            if "_timestamp" in columns and max_time:
                max_timestamp[self.entity_type] = max_time

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("SqlserverTransfer sql_run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e


class KingbaseesTransfer(Transfer):
    """
    kingbasees处理类
    """

    def __init__(self, otl_class: dict, kmap_config: GraphKMapConfig, flag: str = None,
                 data_storage: DataStorage = None):
        super().__init__(otl_class, kmap_config, flag, data_storage)
        self.batch_size = 200000
        table_name = self.table_name
        self.table_name = table_name.split("/")[-1]
        self.schema = table_name.split("/")[0]

    def get_client(self):
        ip = self.data_ds['ds_address']
        port = self.data_ds['ds_port']
        database = self.data_ds['ds_path'].split("/")[0]
        user = self.data_ds['ds_user']
        password = commonutil.DecryptBybase64(self.data_ds['ds_password'])
        if self.data_ds["connect_type"] == 'odbc':
            cnxnstr = f'Driver=KingbaseES ODBC;SERVER={ip};PORT={port};DATABASE={database};UID={user};PWD={password}'
            conn = pyodbc.connect(cnxnstr, timeout=5)
        else:
            conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip,
                                    port=port, connect_timeout=60)
        return conn

    def get_columns(self) -> list[str]:
        ''' 获取表的列名 '''
        client = self.get_client()
        cursor = client.cursor()
        if self.otl_info.extract_type == 'sqlExtraction':
            sql = self.file_source
            cursor.execute(sql)
            return [desc[0] for desc in cursor.description]
        else:
            sql_column = f"SELECT column_name FROM information_schema.columns " \
                         f"WHERE table_schema = '{self.schema}' and table_name='{self.table_name}';"
            cursor.execute(sql_column)
            ret = cursor.fetchall()
            columns = [x[0] for x in ret]
            return columns

    def run(self, timestamp: dict = None) -> dict:
        '''
        标准抽取
        Args:
            timestamp: 历史的最大时间。如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间

        '''
        try:
            self.prepare()
            max_timestamp = {}
            client = self.get_client()
            cursor = client.cursor()

            columns = self.get_columns()
            columnsWithoutSpecial = [otl_util.is_special(column) for column in columns]
            columns_str = ",".join([f'''"{column}" as "{otl_util.is_special(column)}"''' for column in columns])
            condition = ""

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    condition += "where _timestamp is not null and " \
                                 "CASE WHEN _action IS NULL THEN '0' ELSE _action END <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    condition += "where _timestamp is not null "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    condition += f"and _timestamp > '{table_timestamp}'"
            sql = f'''SELECT {columns_str} FROM "{self.schema}"."{self.table_name}" {condition}'''
            cursor.execute(sql)

            skip = 0
            while True:
                # 从数据源读取数据
                start_time = time.time()
                data = cursor.fetchmany(self.batch_size)
                total = len(data)
                if len(data) <= 0:
                    break
                message = f'kingbasees 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                # 转成字典列表
                retDicts = []
                for i in range(total):
                    retDicts.append(dict(zip(columnsWithoutSpecial, data[i])))

                # 写入mongodb + 写入图数据库
                self.extract(retDicts)

                skip += self.batch_size

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建更新最大时间戳
            if "_timestamp" in columns or "_TIMESTAMP" in columns:
                sql = f'''select max(_timestamp) max_timestamp from "{self.schema}"."{self.table_name}"'''
                cursor.execute(sql)
                res = list(cursor.fetchone())
                if res[0]:
                    max_timestamp[self.entity_type] = str(res[0])

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f'select {columns_str} from "{self.schema}"."{self.table_name}" ' \
                      f"where _timestamp is not null and _action>'0' "
                if table_timestamp:
                    sql += f"and _timestamp > '{table_timestamp}'"
                cursor.execute(sql)

                skip = 0
                while True:
                    # 从数据源读取数据
                    start_time = time.time()
                    data = cursor.fetchmany(self.batch_size)
                    total = len(data)
                    if len(data) <= 0:
                        break
                    message = f'kingbasees 从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    # 转成字典列表
                    retDicts = []
                    for i in range(total):
                        retDicts.append(dict(zip(columnsWithoutSpecial, data[i])))

                    # 图数据库 删除数据
                    self.delete(retDicts)

                    skip += self.batch_size

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("KingbaseesTransfer run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e

    def sql_run(self, timestamp: dict = None) -> dict:
        '''
        sql抽取
        Args:
            timestamp:历史的最大时间.如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间
        '''
        try:
            self.prepare()
            sql = self.file_source
            max_time = ""
            max_timestamp = {}
            client = self.get_client()
            cursor = client.cursor()

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    sql = f"select * from ({self.file_source}) as temp where temp._timestamp is not null and " \
                          "CASE WHEN temp._action IS NULL THEN '0' ELSE temp._action END <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    sql = f"select * from ({self.file_source}) as temp where temp._timestamp is not null "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}'"

            cursor.execute(sql)
            description = cursor.description
            columns = [otl_util.is_special(desc[0]) for desc in description]
            if len(set(columns)) != len(columns):
                raise Exception(f"Duplicate field names exist in {self.table_name} SQL extracting results. ")

            skip = 0
            while True:
                # 从数据源读取数据
                start_time = time.time()
                data = cursor.fetchmany(self.batch_size)
                total = len(data)
                if len(data) <= 0:
                    break
                message = f'kingbasees 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                if "_timestamp" in columns:
                    index = columns.index("_timestamp")
                    time_list = [i[index] for i in data if i[index]]
                    if time_list:
                        max_time = max(str(max(time_list)), max_time)
                elif "_TIMESTAMP" in columns:
                    index = columns.index("_TIMESTAMP")
                    time_list = [i[index] for i in data if i[index]]
                    if time_list:
                        max_time = max(str(max(time_list)), max_time)

                # 转成字典列表
                retDicts = []
                for i in range(total):
                    retDicts.append(dict(zip(columns, data[i])))

                # 写入mongodb + 写入图数据库
                self.extract(retDicts)

                skip += self.batch_size

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f"select * from ({self.file_source}) as temp " \
                      f"where temp._timestamp is not null and _action>'0' "
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}'"
                cursor.execute(sql)
                description = cursor.description
                columns = [otl_util.is_special(desc[0]) for desc in description]

                skip = 0
                while True:
                    start_time = time.time()
                    data = cursor.fetchmany(self.batch_size)
                    total = len(data)
                    if len(data) <= 0:
                        break
                    message = f'kingbasees 从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    if "_timestamp" in columns:
                        index = columns.index("_timestamp")
                        time_list = [i[index] for i in data if i[index]]
                        if time_list:
                            max_time = max(str(max(time_list)), max_time)
                    elif "_TIMESTAMP" in columns:
                        index = columns.index("_TIMESTAMP")
                        time_list = [i[index] for i in data if i[index]]
                        if time_list:
                            max_time = max(str(max(time_list)), max_time)

                    # 转成字典列表
                    retDicts = []
                    for i in range(total):
                        retDicts.append(dict(zip(columns, data[i])))

                    # 图数据库 删除数据
                    self.delete(retDicts)

                    skip += self.batch_size

            # 增量构建更新最大时间戳
            if ("_timestamp" in columns or "_TIMESTAMP" in columns) and max_time:
                max_timestamp[self.entity_type] = max_time

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("KingbaseesTransfer sql_run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e


class PostgresqlTransfer(Transfer):
    """
    Postgresql处理类
    """

    def __init__(self, otl_class: dict, kmap_config: GraphKMapConfig, flag: str = None,
                 data_storage: DataStorage = None):
        super().__init__(otl_class, kmap_config, flag, data_storage)
        self.batch_size = 200000
        table_name = self.table_name
        self.table_name = table_name.split("/")[-1]
        self.schema = table_name.split("/")[0]

    def get_client(self):
        ip = self.data_ds['ds_address']
        port = self.data_ds['ds_port']
        database = self.data_ds['ds_path'].split("/")[0]
        user = self.data_ds['ds_user']
        password = commonutil.DecryptBybase64(self.data_ds['ds_password'])
        conn = psycopg2.connect(dbname=database, user=user, password=password, host=ip, port=port, connect_timeout=60)
        return conn

    def get_columns(self) -> list[str]:
        ''' 获取表的列名 '''
        client = self.get_client()
        cursor = client.cursor()
        if self.otl_info.extract_type == 'sqlExtraction':
            sql = self.file_source
            cursor.execute(sql)
            return [desc[0] for desc in cursor.description]
        else:
            sql_column = f"SELECT column_name FROM information_schema.columns WHERE " \
                         f"table_schema = '{self.schema}' and table_name='{self.table_name}';"
            cursor.execute(sql_column)
            ret = cursor.fetchall()
            columns = [x[0] for x in ret]
            return columns

    def run(self, timestamp: dict = None) -> dict:
        '''
        标准抽取
        Args:
            timestamp: 历史的最大时间。如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间

        '''
        try:
            self.prepare()
            max_timestamp = {}
            client = self.get_client()
            cursor = client.cursor()

            columns = self.get_columns()
            columnsWithoutSpecial = [otl_util.is_special(column) for column in columns]
            columns_str = ",".join([f'''"{column}" as "{otl_util.is_special(column)}"''' for column in columns])
            condition = ""

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    condition += "where _timestamp is not null and " \
                                 "CASE WHEN _action IS NULL THEN '0' ELSE _action END <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    condition += "where _timestamp is not null "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    condition += f"and _timestamp > '{table_timestamp}'"
            sql = f'''SELECT {columns_str} FROM "{self.schema}"."{self.table_name}" {condition}'''
            cursor.execute(sql)

            skip = 0
            while True:
                # 从数据源读取数据
                start_time = time.time()
                data = cursor.fetchmany(self.batch_size)
                total = len(data)
                if len(data) <= 0:
                    break
                message = f'postgresql 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                # 转成字典列表
                retDicts = []
                for i in range(total):
                    retDicts.append(dict(zip(columnsWithoutSpecial, data[i])))

                # 写入mongodb + 写入图数据库
                self.extract(retDicts)

                skip += self.batch_size

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建更新最大时间戳
            if "_timestamp" in columns:
                sql = f'''select max(_timestamp) max_timestamp from "{self.schema}"."{self.table_name}"'''
                cursor.execute(sql)
                res = list(cursor.fetchone())
                if res[0]:
                    max_timestamp[self.entity_type] = str(res[0])

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f'select {columns_str} from "{self.schema}"."{self.table_name}" ' \
                      f"where _timestamp is not null and _action > '0' "
                if table_timestamp:
                    sql += f"and _timestamp > '{table_timestamp}'"
                cursor.execute(sql)

                skip = 0
                while True:
                    # 从数据源读取数据
                    start_time = time.time()
                    data = cursor.fetchmany(self.batch_size)
                    total = len(data)
                    if len(data) <= 0:
                        break
                    message = f'postgresql 从 {self.table_name} 读取一批需要删除的数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    # 转成字典列表
                    retDicts = []
                    for i in range(total):
                        retDicts.append(dict(zip(columnsWithoutSpecial, data[i])))

                    # 图数据库 删除数据
                    self.delete(retDicts)

                    skip += self.batch_size

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("PostgresqlTransfer run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e

    def sql_run(self, timestamp: dict = None) -> dict:
        '''
        sql抽取
        Args:
            timestamp:历史的最大时间.如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间
        '''
        try:
            self.prepare()
            sql = self.file_source
            max_time = ""
            max_timestamp = {}
            client = self.get_client()
            cursor = client.cursor()

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    sql = f"select * from ({self.file_source}) as temp where temp._timestamp is not null and " \
                          "CASE WHEN temp._action IS NULL THEN '0' ELSE temp._action END <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    sql = f"select * from ({self.file_source}) as temp where temp._timestamp is not null "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}'"
            cursor.execute(sql)
            description = cursor.description
            columns = [otl_util.is_special(desc[0]) for desc in description]

            skip = 0
            while True:
                # 从数据源读取数据
                start_time = time.time()
                data = cursor.fetchmany(self.batch_size)
                total = len(data)
                if len(data) <= 0:
                    break
                message = f'postgresql 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                          f'耗时：{time.time() - start_time}s'
                Logger.log_info(message)

                if "_timestamp" in columns:
                    index = columns.index("_timestamp")
                    time_list = [i[index] for i in data if i[index]]
                    if time_list:
                        max_time = max(str(max(time_list)), max_time)

                # 转成字典列表
                retDicts = []
                for i in range(total):
                    retDicts.append(dict(zip(columns, data[i])))

                # 写入mongodb + 写入图数据库
                self.extract(retDicts)

                skip += self.batch_size

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f"select * from ({self.file_source}) as temp " \
                      f"where temp._timestamp is not null and _action > '0' "
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}'"
                cursor.execute(sql)
                description = cursor.description
                columns = [otl_util.is_special(desc[0]) for desc in description]

                skip = 0
                while True:
                    start_time = time.time()
                    data = cursor.fetchmany(self.batch_size)
                    total = len(data)
                    if len(data) <= 0:
                        break
                    message = f'postgresql 从 {self.table_name} 读取一批数据 {skip} ~ {skip + total} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    if "_timestamp" in columns:
                        index = columns.index("_timestamp")
                        time_list = [i[index] for i in data if i[index]]
                        if time_list:
                            max_time = max(str(max(time_list)), max_time)

                    # 转成字典列表
                    retDicts = []
                    for i in range(total):
                        retDicts.append(dict(zip(columns, data[i])))

                    # 图数据库 删除数据
                    self.delete(retDicts)

                    skip += self.batch_size

            # 增量构建更新最大时间戳
            if "_timestamp" in columns and max_time:
                max_timestamp[self.entity_type] = max_time

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("PostgresqlTransfer sql_run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e


class ClickHouseTransfer(Transfer):
    """
    ClickHouse处理类
    """

    def __init__(self, otl_class: dict, kmap_config: GraphKMapConfig, flag: str = None,
                 data_storage: DataStorage = None):
        super().__init__(otl_class, kmap_config, flag, data_storage)
        self.batch_size = 200000

    def get_client(self):
        ip = self.data_ds['ds_address']
        port = self.data_ds['ds_port']
        database = self.data_ds['ds_path']
        user = self.data_ds['ds_user']
        password = commonutil.DecryptBybase64(self.data_ds['ds_password'])
        client = clickhouse_connect.get_client(host=ip, port=port, username=user, password=password,
                                               database=database, connect_timeout=60)
        return client

    def get_columns(self) -> list[str]:
        ''' 获取表的列名 '''
        client = self.get_client()
        if self.otl_info.extract_type == 'sqlExtraction':
            sql = self.file_source
            with client.query_row_block_stream(sql, query_formats={'FixedString': 'string'}) as stream:
                return stream.source.column_names
        else:
            sql_column = f"desc `{self.table_name}`"
            result = client.query(sql_column)
            columns = [x[0] for x in result.result_set]
            return columns

    def run(self, timestamp: dict = None) -> dict:
        '''
        标准抽取
        Args:
            timestamp: 历史的最大时间。如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间

        '''
        try:
            self.prepare()
            max_timestamp = {}
            client = self.get_client()

            columns = self.get_columns()
            columnsWithoutSpecial = [otl_util.is_special(column) for column in columns]
            columns_str = ",".join([f"`{column}` as `{otl_util.is_special(column)}`" for column in columns])
            condition = ""

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    condition += f"where _timestamp is not null and IF(ISNULL(_action), '0', _action) <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    condition += f"where _timestamp is not null "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    condition += f"and _timestamp > '{table_timestamp}'"
            sql = f"select {columns_str} from `{self.table_name}` {condition}"

            with client.query_row_block_stream(sql, query_formats={'FixedString': 'string'}) as stream:
                retDicts = []
                start_time = time.time()
                skip = 0
                for block in stream:
                    # 转成字典列表
                    for row in block:
                        retDicts.append(dict(zip(columnsWithoutSpecial, list(row))))

                    if len(retDicts) == self.batch_size:
                        message = f'clickhouse 从 {self.table_name} 读取一批数据 {skip} ~ {skip + self.batch_size} 条，' \
                                  f'耗时：{time.time() - start_time}s'
                        Logger.log_info(message)

                        # 写入mongodb + 写入图数据库
                        self.extract(retDicts)
                        retDicts = []
                        start_time = time.time()
                        skip += self.batch_size
                if retDicts:
                    message = f'clickhouse 从 {self.table_name} 读取一批数据 {skip} ~ {skip + len(retDicts)} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    # 写入mongodb + 写入图数据库
                    self.extract(retDicts)

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建更新最大时间戳
            if "_timestamp" in columns:
                sql = f"select max(_timestamp) max_timestamp from `{self.table_name}`"
                result = client.query(sql, query_formats={'FixedString': 'string'})
                table_max_timestamp = result.result_set[0][0]
                if table_max_timestamp:
                    max_timestamp[self.entity_type] = str(table_max_timestamp)

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f"select {columns_str} from `{self.table_name}` " \
                      f"where _timestamp is not null " \
                      f"and _action>'0' "
                if table_timestamp:
                    sql += f"and _timestamp > '{table_timestamp}'"

                skip = 0
                with client.query_row_block_stream(sql, query_formats={'FixedString': 'string'}) as stream:
                    retDicts = []
                    start_time = time.time()
                    for block in stream:
                        # 转成字典列表
                        for row in block:
                            retDicts.append(dict(zip(columnsWithoutSpecial, list(row))))
                        if len(retDicts) == self.batch_size:
                            message = f'clickhouse 从 {self.table_name} 读取一批需要删除的数据 ' \
                                      f'{skip} ~ {skip + self.batch_size} 条，' \
                                      f'耗时：{time.time() - start_time}s'
                            Logger.log_info(message)

                            # 图数据库 删除数据
                            self.delete(retDicts)

                            retDicts = []
                            start_time = time.time()
                            skip += self.batch_size
                    if retDicts:
                        message = f'clickhouse 从 {self.table_name} 读取一批需要删除的数据 ' \
                                  f'{skip} ~ {skip + len(retDicts)} 条，' \
                                  f'耗时：{time.time() - start_time}s'
                        Logger.log_info(message)

                        # 图数据库 删除数据
                        self.delete(retDicts)

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("ClickHouseTransfer run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e

    def sql_run(self, timestamp: dict = None) -> dict:
        '''
        sql抽取
        Args:
            timestamp:历史的最大时间.如果是增量，该参数必传

        Returns:
            max_timestamp: 如果是增量，则返回数据源的最大时间
        '''
        try:
            self.prepare()
            sql = self.file_source
            max_time = ""
            max_timestamp = {}
            client = self.get_client()

            table_timestamp = None
            if self.flag == "increment":
                if self.is_entity:
                    # 点筛选出新增的部分，同时写入mongo和图数据库
                    sql = f"select * from ({self.file_source}) as temp where temp._timestamp is not null " \
                          f"and IF(ISNULL(temp._action), '0', temp._action) <= '0' "
                else:
                    # 边写入mongo的时候不判断是新增还是筛选，全部写入mongo，从mongo写入图数据库的时候再筛选
                    sql = f"select * from ({self.file_source}) as temp where temp._timestamp is not null "
                table_timestamp = timestamp.get(self.entity_type)
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}'"

            skip = 0
            with client.query_row_block_stream(sql, query_formats={'FixedString': 'string'}) as stream:
                columns = [otl_util.is_special(column) for column in stream.source.column_names]
                if len(set(columns)) != len(columns):
                    raise Exception(
                        f"Duplicate field names exist in {self.table_name} SQL extracting results. ")
                index = columns.index("_timestamp") if "_timestamp" in columns else -1
                retDicts = []
                start_time = time.time()
                for block in stream:
                    for row in block:
                        if index != -1 and row[index]:
                            max_time = max(str(row[index]), max_time)
                        retDicts.append(dict(zip(columns, list(row))))

                    if len(retDicts) == self.batch_size:
                        message = f'clickhouse 从 {self.table_name} 读取一批数据 {skip} ~ {skip + self.batch_size} 条，' \
                                  f'耗时：{time.time() - start_time}s'
                        Logger.log_info(message)

                        # 写入mongodb + 写入图数据库
                        self.extract(retDicts)
                        retDicts = []
                        start_time = time.time()
                        skip += self.batch_size
                if retDicts:
                    message = f'clickhouse 从 {self.table_name} 读取一批数据 {skip} ~ {skip + len(retDicts)} 条，' \
                              f'耗时：{time.time() - start_time}s'
                    Logger.log_info(message)

                    # 写入mongodb + 写入图数据库
                    self.extract(retDicts)

            # 写入图数据库
            # 写边时，等写mongo结束之后再写入图数据库
            # 增量删除边也在里面
            if not self.is_entity:
                self.write_edge(table_timestamp=table_timestamp)

            # 增量构建删除点
            if self.flag == "increment" and self.is_entity:
                # mongodb 清理删除的数据
                self.mongo_delete(table_timestamp)

                sql = f"select * from ({self.file_source}) as temp " \
                      f"where temp._timestamp is not null and temp._action>'0' "
                if table_timestamp:
                    sql += f"and temp._timestamp > '{table_timestamp}'"

                skip = 0
                with client.query_row_block_stream(sql, query_formats={'FixedString': 'string'}) as stream:
                    columns = [otl_util.is_special(column) for column in stream.source.column_names]
                    if len(set(columns)) != len(columns):
                        raise Exception(
                            f"Duplicate field names exist in {self.table_name} SQL extracting results. ")
                    index = columns.index("_timestamp") if "_timestamp" in columns else -1
                    retDicts = []
                    start_time = time.time()
                    for block in stream:
                        for row in block:
                            if index != -1 and row[index]:
                                max_time = max(str(row[index]), max_time)
                            retDicts.append(dict(zip(columns, list(row))))

                        if len(retDicts) == self.batch_size:
                            message = f'clickhouse 从 {self.table_name} 读取一批需要删除的数据 ' \
                                      f'{skip} ~ {skip + self.batch_size} 条，' \
                                      f'耗时：{time.time() - start_time}s'
                            Logger.log_info(message)

                            # 图数据库 删除数据
                            self.delete(retDicts)

                            retDicts = []
                            start_time = time.time()
                            skip += self.batch_size
                    if retDicts:
                        message = f'clickhouse 从 {self.table_name} 读取一批需要删除的数据 ' \
                                  f'{skip} ~ {skip + len(retDicts)} 条，' \
                                  f'耗时：{time.time() - start_time}s'
                        Logger.log_info(message)

                        # 图数据库 删除数据
                        self.delete(retDicts)

            # 增量构建更新最大时间戳
            if "_timestamp" in columns and max_time:
                max_timestamp[self.entity_type] = max_time

            message = "抽取数据：{} 结束".format(self.otl_class.get('relations', self.otl_class.get('name')))
            Logger.log_info(message)
            return {'max_timestamp': max_timestamp}
        except BaseException as e:
            error_log = log_oper.get_error_log("ClickHouseTransfer sql_run error: {}".format(e),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e


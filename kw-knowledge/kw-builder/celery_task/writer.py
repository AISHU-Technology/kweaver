# -*- coding:utf-8 -*-
import os
import sys
import time
import traceback
from multiprocessing.pool import ThreadPool

from pandas import Series

import common.stand_log as log_oper
from celery_task.graph_config import OntologyConfig, GraphKMapConfig
from dao.builder_dao import MongoBuildDao
from dao.graphdb_dao import GraphDB, SQLProcessor, gen_doc_vid
from utils.ConnectUtil import mongoConnect
from utils.log_info import Logger

write_edge_batch = int(os.getenv('WRITE_EDGE_BATCH', 50000))


class VertexWriter(object):

    def __init__(self, otl_name: str, graph_DBName: str, ontology_config: OntologyConfig,
                 kmap_config: GraphKMapConfig, flag: str):
        '''

        Args:
            otl_name: 实体类名
            graph_DBName: 图数据库名
            ontology_config: 本体配置信息
            kmap_config: 文件映射配置信息
            flag: 是否是增量，增量：increment；全量：full
        '''
        self.graphdb = GraphDB()
        self.sqlProcessor = SQLProcessor(self.graphdb.type)
        self.otl_name = otl_name
        self.graph_DBName = graph_DBName
        self.ontology_config = ontology_config
        self.kmap_config = kmap_config
        self.flag = flag

    def write(self, data):
        '''
        将数据插入图数据库中
        Args:
            data: 数据库读取的数据列表，每项数据是dict类型
        Returns:

        '''
        if not self.kmap_config.entity_info(self.otl_name).entity_type:
            message = '实体类 {} 未映射至数据，写入图数据库结束'.format(self.otl_name)
            Logger.log_info(message)
            return
        message = '图数据库开始插入顶点: {}'.format(self.otl_name)
        Logger.log_info(message)
        start_time = time.time()
        current = 0
        total = len(data)
        iter_size = 1000
        pool = ThreadPool(15)
        pool_res = []
        while current < total:
            pool_res.append(
                pool.apply_async(self.write_process, args=(data[current:current + iter_size], current + iter_size)))
            current += iter_size
        pool.close()
        pool.join()
        for res in pool_res:
            # 如果线程内部有异常则在此处抛出
            try:
                res.get()
            except Exception as e:
                message = '图数据在写入实体 {} 时发生错误：{}'.format(self.otl_name, e)
                Logger.log_error(message)
                raise e
        end_time = time.time()
        message = f"图数据库写入一批长度为 {total} 的实体 {self.otl_name} 结束，耗时:{end_time - start_time}s"
        Logger.log_info(message)


    def write_process(self, batch, end_index=0):
        '''
        单线程将数据插入图数据库中
        Args:
            batch: 一批从数据库中读取出来的数据，列表，每项为dict
            end_index: 已写入数据的条数
        '''
        try:
            # 生成ES索引
            es_bulk_index = ''
            if self.graphdb.type == 'nebulaGraph':
                es_bulk_index = self.sqlProcessor.es_bulk_multi(
                    self.graph_DBName, self.otl_name, self.kmap_config.entity_info(self.otl_name).otl_tab,
                    self.ontology_config.entity_pro_dict,
                    self.ontology_config.pro_merge, batch)

            # 生成nebula插入语句
            batch_sql = self.sqlProcessor.vertex_sql_multi(
                batch, self.kmap_config.entity_info(self.otl_name).otl_tab, self.ontology_config.entity_pro_dict,
                self.ontology_config.pro_merge, self.otl_name, self.kmap_config.entity_info(self.otl_name).ds_id)

            # 插入nebula点， 单线程
            # self.lock.acquire()
            if not batch_sql:
                message = '{} 无数据，图数据库写入顶点 0 个'.format(self.otl_name)
                Logger.log_info(message)
                return

            self.graphdb.create_vertex(self.graph_DBName, batch_sql=batch_sql, es_bulk_index=es_bulk_index,
                                       otl_name=self.otl_name,
                                       props=list(self.kmap_config.entity_info(self.otl_name).otl_tab.keys()))
            # self.lock.release()

            if end_index > 0 and end_index % 100000 == 0:
                message = '图数据库已写入顶点 {} {}个'.format(self.otl_name, end_index)
                Logger.log_info(message)
        except Exception as e:
            error_log = log_oper.get_error_log("write_process 写入图数据库失败: {}".format(e), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
            raise e

    def delete(self, data):
        '''
        增量构建删除数据
        Args:
            data: 数据库读取的数据列表，每项数据是dict类型
        '''
        start_time = time.time()
        total = len(data)
        current = 0
        iter_size = 1000
        pool = ThreadPool(15)
        pool_res = []
        while current < total:
            pool_res.append(pool.apply_async(self.process_delete,
                                             (data[current:current + iter_size], current + iter_size)))
            current += iter_size
        pool.close()
        pool.join()
        for res in pool_res:
            # 如果线程内部有异常则在此处抛出
            try:
                res.get()
            except Exception as e:
                message = '图数据在删除实体 {} 时发生错误：{}'.format(self.otl_name, e)
                Logger.log_error(message)
                raise e
        message = f"图数据库删除一批长度为 {total} 的实体 {self.otl_name}结束，耗时:{time.time() - start_time}s"
        Logger.log_info(message)

    def process_delete(self, batch, end_index=0):
        '''
        单线程增量构建删除数据
        Args:
            batch: 一批数据库读取的数据列表，每项数据是dict类型
            end_index: 已删除数据的条数
        '''
        try:
            # 生成ES索引
            es_bulk_index = ''
            if self.graphdb.type == 'nebulaGraph':
                es_bulk_index = self.sqlProcessor.es_bulk_multi(
                    self.graph_DBName, self.otl_name, self.kmap_config.entity_info(self.otl_name).otl_tab,
                    self.ontology_config.entity_pro_dict, self.ontology_config.pro_merge, batch, delete=True)

            # 生成nebula删除语句
            batch_sql = self.sqlProcessor.delete_sql_multi(
                batch, self.kmap_config.entity_info(self.otl_name).otl_tab, self.ontology_config.entity_pro_dict,
                self.ontology_config.pro_merge, self.otl_name)

            self.graphdb.exec_batch(batch_sql, self.graph_DBName)
            if self.graphdb.type == 'nebulaGraph':
                es_bulk_index_new = '\n'.join(es_bulk_index) + '\n'
                self.graphdb.batch_process_vertex_index(es_bulk_index_new)

            if end_index > 0 and end_index % 100000 == 0:
                message = '图数据库已删除顶点 {} {}个'.format(self.otl_name, end_index)
                Logger.log_info(message)

        except Exception as e:
            error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            raise e


class RelationBuildBase(object):
    """
    写边的类，包含一些比较复杂的数据对象，是其他写边子类的必备类，一个对象即可，考虑使用单例模式
    """

    def __init__(self, relation: list[str], graph_DBName: str, graph_mongo_Name: str,
                 ontology_config: OntologyConfig, kmap_config: GraphKMapConfig, flag: str):
        self.relation = relation
        self.kmap_config = kmap_config
        self.ontology_config = ontology_config
        self.graph_DBName = graph_DBName
        self.graph_mongo_Name = graph_mongo_Name
        self.flag = flag

        self.edge_info = kmap_config.edge_info(relation)
        self.graphdb = GraphDB()
        self.sqlProcessor = SQLProcessor(self.graphdb.type)
        self.merge_entity = self.get_merge_entity()

    @property
    def start_collection_name(self):
        ''' 起点实体的 mongodb collection 名 '''
        return self.graph_mongo_Name + '_' + self.edge_info.start_entity_class

    @property
    def end_collection_name(self):
        ''' 终点实体的 mongodb collection 名 '''
        return self.graph_mongo_Name + '_' + self.edge_info.end_entity_class

    @property
    def edge_collection_name(self):
        ''' 边的mongodb collection 名'''
        return self.graph_mongo_Name + "_" + self.edge_info.entity_type

    def get_merge_entity(self):
        """
        将融合属性列表，由实体类字典转成抽取对象类字典，方便后续写边vid计算
        Returns:
            {实体类的entity_type: 融合属性对应的文件属性列表}
        """
        merge_entity = dict()
        for key, value in self.ontology_config.pro_merge.items():
            # key: 实体类名
            # value: [融合属性]
            entity_name = self.kmap_config.entity_info(key).entity_type
            merge_list = []
            for merge_key in value:
                entity_merge_key = self.kmap_config.entity_info(key).otl_tab[merge_key]
                merge_list.append(entity_merge_key)
            merge_entity[entity_name] = merge_list
        return merge_entity

    def gen_vid(self, entity_name, one_data) -> str:
        """
        计算实体one_data在图数据库中的的VertexId，支持nebula和orientdb

        逻辑
            根据实体类的融合属性，根据web页面的先后顺序，计算出MD5结果

        参数
            entity_name: 抽取对象名称，用来获实体类的融合属性
            one_data: 实际的实体点数据

        条件
            1. 实体类必须有融合属性

        返回
            MD5字符串
                demo: 7f3fdf6fbbbcb5875062a88473303e0a
        """
        return gen_doc_vid(self.merge_entity, entity_name, one_data, self.kmap_config.entity_otl, self.graphdb.type)

    def get_collection_name(self, class_name):
        """
        获取实体类名对应的mongodb 集合名称

        参数
            class_name: 实体类的entity_type
        """
        return self.graph_mongo_Name + "_" + class_name


class RelationManualBuilder(object):
    """
    写边公共类，包含写边的公共方法

    参数
        buildInfo： RelationBuildBase，每种边类型的基础信息
    """

    def __init__(self, buildInfo: RelationBuildBase):
        self.buildInfo = buildInfo
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
            {长度值: 1} 字典格式：{2:1, 10:1, 5:1}
        """
        mongo_collection_name = self.buildInfo.get_collection_name(class_name)
        collection = MongoBuildDao.get_collection(mongo_collection_name)
        return MongoBuildDao.prop_len(collection, class_prop)

    def load_collection_prop_len(self, class_name, class_prop):
        """
        保存某集合某属性长度返回
        Returns:
            {抽取对象名: {长度值: 1}}
        """
        len_dict = self.__dict__.get('len_dict', dict())
        len_value = self.get_collection_prop_len(class_name, class_prop)
        # 有值的情况下，才会更新
        if len_value:
            len_dict[class_name] = len_value
            self.len_dict = len_dict

    def edge_sql(self, one_data):
        """
        构造边的属性值sql语句
        """
        sql_processor: SQLProcessor = self.buildInfo.sqlProcessor
        return sql_processor.prop_value_sql(
            self.buildInfo.edge_info.entity_type, self.buildInfo.edge_info.otl_tab, one_data,
            edge_class=self.buildInfo.relation[1],
            edge_pro_dict=self.buildInfo.ontology_config.edge_pro_dict)

    def find_contain_relations(self, collection, len_dict, collection_prop, find_value: str) -> list[dict]:
        """
        关系A.p1 包含 B.p2
        p1是父串，p2是子串， 如果找出包含关系，需要将p1_value的全部子串手动计算出来，然后在B中查询

        对应调用是:
        find_contain_relations(B_collection, B_lenDict, B_p2, A_p1_value)

        参数
            collection: Mongo集合对象， B_collection
            lenDict:  mongo集合长度字典，B_lenDict {长度值: 1}
            collection_prop: mongo集合关系属性，B_p2
            find_value: A_p1_value

        返回
            B_collection中符合条件的文档列表

        """
        sub_strings = MongoBuildDao.gen_sub_str(len_dict, find_value)
        exist_items = MongoBuildDao.relations(collection, collection_prop, sub_strings)
        return exist_items

    def find_equal_relations(self, batch_data, batch_prop, relation_collection, relation_prop):
        """
        关系 A.p1 等于 B.p2，假定边的方向是从A->B

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
        find_dict = {relation_prop: {"$in": values}}
        items = relation_collection.find(find_dict)

        results = dict()
        for item in items:
            key = item[relation_prop]
            end_data = results.get(key, [])
            end_data.append(item)
            results[key] = end_data
        return results

    def create_batch_edges(self, batch_data, batch_begin: dict, batch_end: dict):
        """
        批量写入边到图数据库， 由batch_data开始构建

        参数
            batch_data: 批量的关系数据
            batch_begin: 起点数据 dict batch_data的mongo_doc_id -> [起点的vids]
            batch_end: 终点数据 dict batch_data的mongo_doc_id -> [终点的vids]

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
        fullindex = []
        for one_data in batch_data:
            # 构造边的属性值sql语句
            if isinstance(one_data, Series):
                one_data = dict(one_data)
            prop_val_sql = self.edge_sql(one_data)
            # 获取某个数据的ObjectId字符串
            key = str(one_data['_id'])
            # 边的起点和终点，可能有多种情况
            start_points = batch_begin.get(key, [])
            end_points = batch_end.get(key, [])
            for i in start_points:
                for j in end_points:
                    # 起点和终点一样，跳过
                    if str(i) == str(j):
                        continue
                    starts.append(i)
                    ends.append(j)
                    prop_val_sqls.append(prop_val_sql)
                    if len(starts) % 1000 == 0:
                        total += 1000
                        # nebula插入必须单线程，这里加锁
                        # self.lock.acquire()
                        try:
                            graphdb.create_edges(self.buildInfo.relation[1], starts, ends, prop_val_sqls,
                                                 self.buildInfo.graph_DBName,
                                                 fullindex, self.buildInfo.ontology_config.edge_pro_index)
                        except Exception as e:
                            raise e
                        # finally:
                        #     self.lock.release()

                        # 循环重置
                        starts = []
                        ends = []
                        prop_val_sqls = []

        if len(starts) > 0:
            total += len(starts)

            # self.lock.acquire()
            try:
                graphdb.create_edges(self.buildInfo.relation[1], starts, ends, prop_val_sqls,
                                     self.buildInfo.graph_DBName,
                                     fullindex, self.buildInfo.ontology_config.edge_pro_index)
            except Exception as e:
                raise e
                # self.lock.release()
        # 边不插入全文索引
        # if fullindex:
        #     import asyncio
        #     loop = asyncio.new_event_loop()
        #     asyncio.set_event_loop(loop)
        #     tasks = set()
        #     for body in fullindex:
        #         if body:
        #             body = '\n'.join(body) + '\n'
        #             tasks.add(graphdb.async_fulltext_bulk_index(body))
        #     loop.run_until_complete(asyncio.wait(tasks))
        #     loop.close()

    def delete_batch_edges(self, batch_data, batch_begin: dict, batch_end: dict):
        """
        批量删除边

        参数
            batch_data: 批量的关系数据
            batch_begin: 起点数据 dict batch_data的mongo_doc_id -> [起点的vids]
            batch_end: 终点数据 dict batch_data的mongo_doc_id -> [终点的vids]
        """
        starts = []
        ends = []
        graphdb: GraphDB = self.buildInfo.graphdb
        total = 0
        for one_data in batch_data:
            # 构造边的属性值sql语句
            if isinstance(one_data, Series):
                one_data = dict(one_data)
            # 获取某个数据的ObjectId字符串
            key = str(one_data['_id'])
            # 边的起点和终点，可能有多种情况
            start_points = batch_begin.get(key, [])
            end_points = batch_end.get(key, [])
            for i in start_points:
                for j in end_points:
                    # 起点和终点一样，跳过
                    if str(i) == str(j):
                        continue
                    starts.append(i)
                    ends.append(j)
                    if len(starts) % 1000 == 0:
                        total += 1000
                        try:
                            graphdb.delete_edges(self.buildInfo.relation[1], starts, ends, self.buildInfo.graph_DBName)
                        except Exception as e:
                            raise e
                        # 循环重置
                        starts = []
                        ends = []

        if len(starts) > 0:
            try:
                graphdb.delete_edges(self.buildInfo.relation[1], starts, ends, self.buildInfo.graph_DBName)
            except Exception as e:
                raise e

    def gen_batch_vid(self, batch_otl_name, batch_datas):
        """
        计算批量数据的vid

        参数：
            batch_otl_name: batch_data对应的抽取对象名称
            batch_datas: mongodb中的一批批量实体数据

        返回：字典结构，{mongodb_doc_id: list(vids)}
        """
        results = dict()
        for one in batch_datas:
            vid = self.buildInfo.gen_vid(batch_otl_name, one)
            if vid:
                results[str(one["_id"])] = [vid]
        return results

    def batch_equal_relations(self, batch_data, batch_prop, relation_class_name, relation_prop):
        """
        去集合查询等于关系的数据

        参数：
            batch_data: 批量数据
            batch_prop: 批量数据的映射关系属性
            relation_class_name: 从该集合中查找与batch_data属性匹配的文档，并计算出对应的vid
            relation_prop: 关系集合的映射属性
        Returns:
            dict batch_data的mongo_doc_id -> [vids]
        """
        relation_collection_name = self.buildInfo.get_collection_name(relation_class_name)
        relation_collection = MongoBuildDao.get_collection(relation_collection_name)
        end_item_dict = self.find_equal_relations(batch_data, batch_prop, relation_collection, relation_prop)

        results = dict()
        for one_data in batch_data:
            if batch_prop not in one_data:
                continue
            key = one_data[batch_prop]
            if key == None or key == '':
                continue
            if key not in end_item_dict:
                continue
            one_ends = end_item_dict[key]
            vids = []
            if len(one_ends) > 10000:
                message = 'one_ends长度为{}, batch_prop={}, key={}'.format(len(one_ends), batch_prop, key)
                Logger.log_info(message)
            count = 0
            for one in one_ends:
                count += 1
                if count % 10000 == 0:
                    message = 'one_ends已遍历{}'.format(count)
                    Logger.log_info(message)
                vid = self.buildInfo.gen_vid(relation_class_name, one)
                if vid:
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
            relation_prop: 关系集合的映射属性
        wordsDict:dict -> bsonID[words]
        """
        # 去mongo中的集合C，查询每个数据对应的关系数据words
        results = dict()
        relation_collect_name = self.buildInfo.get_collection_name(relation_class_name)
        relation_collection = MongoBuildDao.get_collection(relation_collect_name)
        len_dict = self.len_dict.get(relation_class_name)
        for one_data in batch_data:
            if batch_prop not in one_data:
                continue
            docs = self.find_contain_relations(relation_collection, len_dict, relation_prop, one_data[batch_prop])

            vids = []
            bsonId = str(one_data['_id'])
            for one in docs:
                vid = self.buildInfo.gen_vid(relation_class_name, one)
                if vid:
                    vids.append(vid)
            results[bsonId] = vids

        return results


class RelationIn2Class(RelationManualBuilder):
    """
    涉及两个类之间的关系边构建，也叫 两框

    参数
        relationBaseInfo: 某边构建的基础信息
    """

    def __init__(self, relationBaseInfo: RelationBuildBase):
        super().__init__(relationBaseInfo)
        """
            边构建的前期准备，主要是准备一些属性
        """
        self.start_entity_class = self.buildInfo.edge_info.start_entity_class
        self.start_collection_name = self.buildInfo.start_collection_name

        self.end_entity_class = self.buildInfo.edge_info.end_entity_class
        self.end_collection_name = self.buildInfo.end_collection_name

        self.start_collection = MongoBuildDao.get_collection(self.start_collection_name)

        self.end_collection = MongoBuildDao.get_collection(self.end_collection_name)

        find_filter = {}
        if self.buildInfo.flag == "increment":
            find_filter = {'$or': [{'_action': {'$lte': '0'}}, {'_action': None}]}
        self.start_data_count = self.start_collection.count_documents(find_filter)
        self.end_data_count = self.end_collection.count_documents(find_filter)

        '''
        reverse为False时，为以下逻辑：
        关系 A.p1 包含 B.p2
        计算 A.p1 的所有子串，在 B collection 中查找与 p1 的子串相同的文档
        all_data_collection: A collection
        all_data_count: A collection 的文档总数
        find_class: A(抽取对象名)
        find_prop: p1(抽取对象文件属性名称)
        relation_class: B(抽取对象名)
        relation_prop: p2(抽取对象文件属性名称)

        reverse为True时，则相反
        '''
        self.all_data_collection = None
        self.all_data_count = None
        self.find_class = None
        self.find_prop = None
        self.relation_class = None
        self.relation_prop = None
        self.reverse = None

    def prepare_from_start(self):
        """
        边构建的起点数据
        """
        self.all_data_collection = self.start_collection
        self.all_data_count = self.start_data_count
        self.find_class = self.start_entity_class
        self.find_prop = self.buildInfo.edge_info.start_prop
        self.relation_class = self.end_entity_class
        self.relation_prop = self.buildInfo.edge_info.end_prop
        self.reverse = False

    def prepare_from_end(self):
        """
        边构建的终点数据
        """
        self.all_data_collection = self.end_collection
        self.all_data_count = self.end_data_count
        self.find_class = self.end_entity_class
        self.find_prop = self.buildInfo.edge_info.end_prop
        self.relation_class = self.start_entity_class
        self.relation_prop = self.buildInfo.edge_info.start_prop
        self.reverse = True

    def prepare(self):
        if self.buildInfo.edge_info.equation == "包含" or self.buildInfo.edge_info.equation == "被包含":
            if self.buildInfo.edge_info.equation == "被包含":
                self.prepare_from_end()
            if self.buildInfo.edge_info.equation == "包含":
                self.prepare_from_start()

            # 包含情况下，要加载属性长度范围，为后面的包含关系计算做准备
            self.load_collection_prop_len(self.find_class, self.find_prop)
            self.load_collection_prop_len(self.relation_class, self.relation_prop)

        if self.buildInfo.edge_info.equation == "等于":
            if self.start_data_count <= self.end_data_count:
                self.prepare_from_start()
            else:
                self.prepare_from_end()

        # 添加hash索引，方便mongo查找
        MongoBuildDao.hashed_index(self.start_collection, self.buildInfo.edge_info.start_prop)
        MongoBuildDao.hashed_index(self.end_collection, self.buildInfo.edge_info.end_prop)

        # self.lock = threading.Lock()

    def write(self):
        """
        写边的入口方法
        """
        start_time = time.time()
        if self.start_data_count <= 0 or self.end_data_count <= 0:
            message = 'edge_class: {} 无数据，write结束 '.format(self.buildInfo.relation)
            Logger.log_info(message)
            return
        self.prepare()
        pool = ThreadPool(10)
        pool_res = []
        iter_size = write_edge_batch
        current = 0
        while current < self.all_data_count:
            pool_res.append(pool.apply_async(self.process, (self.all_data_collection, current, iter_size)))
            current += iter_size
        pool.close()
        pool.join()
        for res in pool_res:
            # 如果线程内部有异常则在此处抛出
            try:
                res.get()
            except Exception as e:
                message = '写边 {} 时发生错误：{}'.format(self.buildInfo.relation, e)
                Logger.log_error(message)
                raise e
        message = f"写边 edge_class:{self.buildInfo.relation} 结束， " \
                  f"共写入{self.all_data_count}条，耗时：{time.time() - start_time}s"
        Logger.log_info(message)

    def process(self, collection, current, iter_size):
        """
        批量处理边

        参数
            collection: 起点的mongo集合
            current: 当前数据的索引
            iter_size: 每次数据的长度
        """
        try:
            find_filter = {}
            if self.buildInfo.flag == "increment":
                find_filter = {'$or': [{'_action': {'$lte': '0'}}, {'_action': None}]}
            batch_results = collection.find(find_filter).skip(current).limit(iter_size)
            batch_data = list(batch_results)
            # 直接关系情况下，边的起点可以直接计算
            batch_begin = self.gen_batch_vid(self.find_class, batch_data)

            batch_end = {}
            if self.buildInfo.edge_info.equation == "包含" or self.buildInfo.edge_info.equation == "被包含":
                batch_end = self.batch_contain_relations(batch_data, self.find_prop, self.relation_class,
                                                         self.relation_prop)

            if self.buildInfo.edge_info.equation == "等于":
                batch_end = self.batch_equal_relations(batch_data, self.find_prop, self.relation_class,
                                                       self.relation_prop)

            if self.reverse:
                self.create_batch_edges(batch_data, batch_end, batch_begin)
            else:
                self.create_batch_edges(batch_data, batch_begin, batch_end)
        except Exception as e:
            error_log = log_oper.get_error_log("批量处理边 error : {}".format(repr(e)), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
            raise e


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

    def __init__(self, relation_base_info: RelationBuildBase, **kwargs):
        super().__init__(relation_base_info)

        self.start_entity_class = self.buildInfo.edge_info.start_entity_class
        self.start_collection_name = self.buildInfo.start_collection_name

        self.end_entity_class = self.buildInfo.edge_info.end_entity_class
        self.end_collection_name = self.buildInfo.end_collection_name

        self.start_prop = self.buildInfo.edge_info.start_prop
        self.end_prop = self.buildInfo.edge_info.end_prop

        self.start_collection = MongoBuildDao.get_collection(self.start_collection_name)
        self.end_collection = MongoBuildDao.get_collection(self.end_collection_name)

        self.edge_collection_name = self.buildInfo.edge_collection_name
        self.edge_collection = MongoBuildDao.get_collection(self.edge_collection_name)

        # 增量构建时上一次记录的时间戳
        self.table_timestamp = kwargs.get('table_timestamp')

    def prepare(self):
        # 添加hash索引
        if not self.start_prop:
            message = '{} 的起点的抽取属性未配置抽取规则'.format(self.buildInfo.relation)
            Logger.log_info(message)
            raise Exception(message)
        if not self.end_prop:
            message = '{} 的终点的抽取属性未配置抽取规则'.format(self.buildInfo.relation)
            Logger.log_info(message)
            raise Exception(message)
        MongoBuildDao.hashed_index(self.start_collection, self.start_prop)
        MongoBuildDao.hashed_index(self.end_collection, self.end_prop)

    def write(self):
        """
        写边入口方法
        """
        start_time = time.time()
        self.prepare()
        # 确定边所在类
        find_filter = {}
        if self.buildInfo.flag == "increment":
            if self.table_timestamp:
                find_filter = {'$and': [{'_timestamp': {'$gt': self.table_timestamp}},
                                        {'$or': [{'_action': {'$lte': '0'}}, {'_action': None}]}]}
            else:
                find_filter = {'$or': [{'_action': {'$lte': '0'}}, {'_action': None}]}
        edge_collection = self.edge_collection
        total = edge_collection.count_documents(find_filter)
        if total > 0:
            if self.buildInfo.edge_info.equation_begin == "被包含":
                self.load_collection_prop_len(self.buildInfo.edge_info.start_entity_class,
                                              self.buildInfo.edge_info.start_prop)

            if self.buildInfo.edge_info.equation_end == "被包含":
                self.load_collection_prop_len(self.buildInfo.edge_info.end_entity_class,
                                              self.buildInfo.edge_info.end_prop)
        pool = ThreadPool(10)
        pool_res = []
        iter_size = write_edge_batch
        current = 0
        while current < total:
            pool_res.append(pool.apply_async(self.process, (edge_collection, current, iter_size)))
            # self.process(edge_collection, current, iter_size)
            current += iter_size
        pool.close()
        pool.join()
        for res in pool_res:
            # 如果线程内部有异常则在此处抛出
            try:
                res.get()
            except Exception as e:
                message = '写边 {} 时发生错误：{}'.format(self.buildInfo.relation, e)
                Logger.log_error(message)
                raise e
        message = f"写边 edge_class:{self.buildInfo.relation} 结束， 共写入{total}条, 耗时：{time.time() - start_time}s"
        Logger.log_info(message)

    def process(self, collection, current, iter_size):
        """
        批量处理边

        参数
            collection: 边的mongo集合
            current: 当前数据的索引
            iter_size: 每次数据的长度
        """
        try:
            find_filter = {}
            if self.buildInfo.flag == "increment":
                if self.table_timestamp:
                    find_filter = {'$and': [{'_timestamp': {'$gt': self.table_timestamp}},
                                            {'$or': [{'_action': {'$lte': '0'}}, {'_action': None}]}]}
                else:
                    find_filter = {'$or': [{'_action': {'$lte': '0'}}, {'_action': None}]}
            batch_results = collection.find(find_filter).skip(current).limit(iter_size)
            batch_data = list(batch_results)
            if current % 100000 == 0:
                message = "edge_class:{} current: {}".format(self.buildInfo.edge_info.relation, current)
                Logger.log_info(message)

            batch_begin = {}
            if self.buildInfo.edge_info.equation_begin == "等于":
                batch_begin = self.batch_equal_relations(batch_data,
                                                         self.buildInfo.edge_info.relation_begin_pro,
                                                         self.buildInfo.edge_info.start_entity_class,
                                                         self.buildInfo.edge_info.start_prop)
            if self.buildInfo.edge_info.equation_begin == "被包含":
                batch_begin = self.batch_contain_relations(batch_data,
                                                           self.buildInfo.edge_info.relation_begin_pro,
                                                           self.buildInfo.edge_info.start_entity_class,
                                                           self.buildInfo.edge_info.start_prop)

            batch_end = {}
            if self.buildInfo.edge_info.equation_end == "等于":
                batch_end = self.batch_equal_relations(batch_data,
                                                       self.buildInfo.edge_info.relation_end_pro,
                                                       self.buildInfo.edge_info.end_entity_class,
                                                       self.buildInfo.edge_info.end_prop)
            if self.buildInfo.edge_info.equation_end == "被包含":
                batch_end = self.batch_contain_relations(batch_data,
                                                         self.buildInfo.edge_info.relation_end_pro,
                                                         self.buildInfo.edge_info.end_entity_class,
                                                         self.buildInfo.edge_info.end_prop)

            self.create_batch_edges(batch_data, batch_begin, batch_end)

        except Exception as e:
            error_log = log_oper.get_error_log("批量处理边 error : {}".format(repr(e)), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
            raise e

    def delete(self):
        """
        删除边入口方法
        """
        start_time = time.time()
        self.prepare()
        # 确定边所在类
        edge_collection = self.edge_collection
        if self.table_timestamp:
            find_filter = {'$and': [{'_timestamp': {'$gt': self.table_timestamp}},
                                    {"_action": {'$gt': '0'}}]}
        else:
            find_filter = {"_action": {'$gt': '0'}}
        total = edge_collection.count_documents(find_filter)
        if total > 0:
            if self.buildInfo.edge_info.equation_begin == "被包含":
                self.load_collection_prop_len(self.buildInfo.edge_info.start_entity_class,
                                              self.buildInfo.edge_info.start_prop)
            if self.buildInfo.edge_info.equation_end == "被包含":
                self.load_collection_prop_len(self.buildInfo.edge_info.end_entity_class,
                                              self.buildInfo.edge_info.end_prop)
        pool = ThreadPool(10)
        pool_res = []
        iter_size = write_edge_batch
        current = 0
        while current < total:
            pool_res.append(pool.apply_async(self.delete_process, (edge_collection, current, iter_size)))
            current += iter_size
        pool.close()
        pool.join()
        for res in pool_res:
            # 如果线程内部有异常则在此处抛出
            try:
                res.get()
            except Exception as e:
                message = '删除边 {} 时发生错误：{}'.format(self.buildInfo.relation, e)
                Logger.log_error(message)
                raise e
        message = f"删除边 edge_class:{self.buildInfo.edge_info.relation} 结束， 共删除{total}条，耗时: {time.time() - start_time}s"
        Logger.log_info(message)

    def delete_process(self, collection, current, iter_size):
        """
        批量删除边
        参数
            collection: 边的mongo集合
            current: 当前数据的索引
            iter_size: 每次数据的长度
        """
        try:
            if self.table_timestamp:
                find_filter = {'$and': [{'_timestamp': {'$gt': self.table_timestamp}},
                                        {"_action": {'$gt': '0'}}]}
            else:
                find_filter = {"_action": {'$gt': '0'}}
            batch_results = collection.find(find_filter).skip(current).limit(iter_size)
            batch_data = list(batch_results)

            batch_begin = {}
            if self.buildInfo.edge_info.equation_begin == "等于":
                batch_begin = self.batch_equal_relations(batch_data,
                                                         self.buildInfo.edge_info.relation_begin_pro,
                                                         self.buildInfo.edge_info.start_entity_class,
                                                         self.buildInfo.edge_info.start_prop)
            if self.buildInfo.edge_info.equation_begin == "被包含":
                batch_begin = self.batch_contain_relations(batch_data,
                                                           self.buildInfo.edge_info.relation_begin_pro,
                                                           self.buildInfo.edge_info.start_entity_class,
                                                           self.buildInfo.edge_info.start_prop)

            batch_end = {}
            if self.buildInfo.edge_info.equation_end == "等于":
                batch_end = self.batch_equal_relations(batch_data,
                                                       self.buildInfo.edge_info.relation_end_pro,
                                                       self.buildInfo.edge_info.end_entity_class,
                                                       self.buildInfo.edge_info.end_prop)
            if self.buildInfo.edge_info.equation_end == "被包含":
                batch_end = self.batch_contain_relations(batch_data,
                                                         self.buildInfo.edge_info.relation_end_pro,
                                                         self.buildInfo.edge_info.end_entity_class,
                                                         self.buildInfo.edge_info.end_prop)

            self.delete_batch_edges(batch_data, batch_begin, batch_end)
        except Exception as e:
            error_log = log_oper.get_error_log("批量处理边delete error : {}".format(repr(e)), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
            raise e


class EdgeWriter(object):

    def __init__(self, relation: list[str], graph_DBName: str, graph_mongo_Name: str,
                 ontology_config: OntologyConfig, kmap_config: GraphKMapConfig, flag: str):
        self.base_info = RelationBuildBase(relation, graph_DBName, graph_mongo_Name, ontology_config, kmap_config, flag)

    def write_edge(self, **kwargs):
        base_info = self.base_info
        message = '图数据库开始写边: {}'.format(base_info.relation)
        Logger.log_info(message)
        # 如果是手绘
        source_type = base_info.ontology_config.source_type_dict[base_info.relation[1]]
        if source_type == 'manual':
            self.manual(base_info, **kwargs)
        # 如果是model
        model = base_info.ontology_config.model_dict[base_info.relation[1]]
        if model != '':
            self.model(base_info)

    def manual(self, base_info: RelationBuildBase, **kwargs):
        # 用户未选择实体的映射属性
        if not base_info.edge_info.begin_class_prop or not base_info.edge_info.end_class_prop:
            message = 'edge_name: {} 未选择实体的映射属性，抽取结束'.format(base_info.relation)
            Logger.log_info(message)
            return
        # 如果是4框
        if base_info.edge_info.equation == '':
            builder = RelationIn3Class(base_info, **kwargs)
            builder.write()
            if base_info.flag == "increment":
                builder.delete()
        # 如果是2框
        else:
            builder = RelationIn2Class(base_info)
            builder.write()

    def model(self, base_info: RelationBuildBase):
        """
        模型处理方法，代码没有动
        """
        edge_class = base_info.relation[1]
        begin_vertex_class = base_info.edge_info.begin_vertex_class
        end_vertex_class = base_info.edge_info.end_vertex_class
        graph_mongo_Name = base_info.graph_mongo_Name
        sqlProcessor = base_info.sqlProcessor
        edge_pro_dict = base_info.ontology_config.edge_pro_dict
        pro_merge = base_info.ontology_config.pro_merge
        graphdb = base_info.graphdb
        mongo_db = base_info.graph_DBName

        conn_db = mongoConnect.connect_mongo()

        if edge_class == (begin_vertex_class + "2" + end_vertex_class):
            s_class = edge_class.split("2")[0]
            o_class = edge_class.split("2")[-1]
        else:
            s_class = begin_vertex_class
            o_class = end_vertex_class

        table2 = conn_db[graph_mongo_Name + "_" + edge_class]
        alldata = table2.find()
        total = alldata.count()
        # 关系改为批量执行
        pool = ThreadPool(20)
        pool_res = []
        # pool = multiprocessing.Pool(10)
        error_report = []

        def error_callback(error):
            error = repr(error)
            Logger.log_error(error)
            error_report.append(error)

        if total > 0:
            table = conn_db[graph_mongo_Name + "_" + edge_class]
            iter_size = 1000
            current = 0
            # batch = table.find().limit(iter_size)
            while current < total:
                batch = table.find().limit(iter_size).skip(current)
                batch = list(batch)
                sql_list = sqlProcessor.edge_sql_multi(s_class, o_class, edge_class, batch, edge_pro_dict,
                                                       pro_merge=pro_merge)
                if graphdb.type == 'nebulaGraph':
                    props_check = list(edge_pro_dict[edge_class].keys())
                    graphdb._check_schema_nebula(mongo_db, edge_class, props_check, 'edge')
                pool_res.append(pool.apply_async(
                    graphdb.exec_batch, (sql_list, mongo_db), error_callback=error_callback))
                if graphdb.type == 'nebulaGraph':
                    es_bulk_edge_index = sqlProcessor.es_bulk_edge_multi(mongo_db, edge_class, batch,
                                                                         s_class, o_class, pro_merge)
                    if es_bulk_edge_index != '\n':
                        graphdb.fulltext_bulk_index(es_bulk_edge_index)
                # 批两处理关系最后一个id: batch_id
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
                    Logger.log_info(f'{edge_class}已插入数据：{current}条')
        pool.close()
        pool.join()
        if len(error_report) == 0:
            Logger.log_info(f'{edge_class}共插入(更新)数据{alldata.count()}条')
        else:
            Logger.log_info(f'{edge_class}在插入(更新)数据{alldata.count()}条的过程中失败')
        for res in pool_res:
            # 如果线程内部有异常则在此处抛出
            res.get()

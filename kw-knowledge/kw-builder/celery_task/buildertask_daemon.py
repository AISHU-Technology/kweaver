# -*- coding:utf-8 -*-
import copy
import json
import os
import signal
import sys
import time
import traceback
from collections import defaultdict
from dataclasses import dataclass
from queue import Queue
from typing import Callable

import requests

import common.stand_log as log_oper
from batch_task_param_processer import BatchTaskParamProcessor
from celery_task.celery_tasks import cel
from celery_task.extractions.standard_extract import standard_extract, standard_extract_RelationIn2Class
from celery_task.graph_config import OntologyConfig, GraphKMapConfig
from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB
from dao.otl_dao import otl_dao
from dao.subject_dao import TextMatchTask
from dao.task_dao import task_dao
from service.dsm_Service import dsm_service
from service.graph_Service import graph_Service
from service.task_Service import task_service
from utils.ConnectUtil import mongoConnect
from utils.common_response_status import CommonResponseStatus
from utils.log_info import Logger
from utils.opensearch_util import OpenSearchManager
from utils.util import GetGraphDbOsInfo


@cel.task(name='app.buildertask_daemon', bind=True)
def buildertask_daemon(self, graph_id, flag):
    '''
    构建任务守护进程
    Args:
        graph_id: 图谱id
        flag: 是否是增量，增量：increment； 全量：full

    Returns:

    '''
    try:
        message = '======== `start builder task`: graph_id = {}, flag = {} ========='.format(graph_id, flag)
        print('======== `start builder task`: graph_id = {}, flag = {} ========='.format(graph_id, flag))
        Logger.log_info(message)
        self.update_state(state='RUNNING')  # not debug

        task_id = self.request.id  # celery_task_id
        # task_id = 'buildertask_daemon_celery_task_id' + str(graph_id) + str(flag)  # debug

        # 记录任务运行时的ip
        task_service.save_task_ip(task_id)

        # ========== cancel intelligence task ==========
        cancel_intelligence_task(graph_id)

        # ========== 获取配置 ==========
        ret_code, obj = graph_Service.getGraphById(graph_id, "")
        if ret_code != 200:
            error_report = str({'cause': obj["cause"], 'message': obj["message"]})
            raise Exception(error_report)
        graph_config = obj["res"]
        ontology = graph_config['graph_otl'][0]
        graph_KMap = graph_config['graph_KMap']
        graph_mongo_Name = graph_config['graph_baseInfo']['graph_mongo_Name']
        graph_DBName = graph_config['graph_baseInfo']['graph_DBName']
        message = f'graph_mongo_Name = "{graph_mongo_Name}"'
        Logger.log_info(message)


        # 分组任务 参数处理
        batch_param_processor = BatchTaskParamProcessor(graph_id)
        # origin_ontology origin_graph_KMap 是分组处理前的
        # 如果多个分组中有相同的类，使用筛选后的ontology graph_KMap会找不到重叠的类的配置信息
        origin_ontology = ontology
        origin_graph_KMap = graph_KMap
        # ontology graph_KMap 是分组处理后的
        ontology, edge_names, graph_KMap = batch_param_processor.process(ontology, graph_KMap)
        is_batch = batch_param_processor.is_batch
        message = f'is_batch = {is_batch}\n' \
                  f'ontology = {ontology}\n' \
                  f'edge_names = {edge_names}\n' \
                  f'graph_KMap = {graph_KMap}'
        Logger.log_info(message)

        # ontology 信息处理
        ontology_config = OntologyConfig(ontology)

        # graph_KMap 信息处理
        kmap_config = GraphKMapConfig(graph_KMap)

        # hive数据源表分区字段检查
        for file in graph_KMap['files']:
            if file['data_source'] == 'hive' and file['extract_type'] == "standardExtraction":
                for a_file in file['files']:
                    ret_code, partition_names = dsm_service.getHivePartitions(file['ds_id'], a_file['file_name'])
                    if ret_code != 200:
                        raise Exception(
                            f"get hive partitions error, ds_id:{file['ds_id']}, file_name: {a_file['file_name']}")
                    for key in file.get('partition_infos', {}).keys():
                        if key not in partition_names:
                            raise Exception(f"{key} isn't ds_name:{file['files'][0]['file_path']} "
                                            f"table: {a_file['file_name']}'s partition name")

        # 检查数据源连接
        used_ds_ids = list(set(f['ds_id'] for f in graph_KMap['files']))
        ret_code, ret_message = dsm_service.connectTestByDsIDs(used_ds_ids)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            error_report = str({'cause': ret_message["cause"], 'message': ret_message["message"]})
            raise Exception(error_report)

        # 判断是增量还是全量
        # flag 可能的值： full: 全量, increment: 增量
        # Feature-543780修改: 不再将增量自动转换为全量。图空间不切换，schema按照增量修改，数据不筛选抽取全部
        timestamp = graph_dao.getTaskTimestamp(graph_id)["timestamp"]
        if not timestamp:
            timestamp = '{}'
            # flag = "full"
        timestamp = eval(timestamp)
        max_timestamp = copy.deepcopy(timestamp)
        # if flag == "increment":
        #     flag = check_increment(kmap_config)
        Logger.log_info('actual execution flag = "{}" '.format(flag))

        # 确定图空间名称
        # 全量构建创建新版本并使用新图数据库构建
        if flag == 'full' and not is_batch:
            current_DBName, previous_DBName, new_DBName = new_version(graph_id)
            graph_DBName = new_DBName
        message = f'graph_DBName = "{graph_DBName}"'
        Logger.log_info(message)

        # ========== 清理 mongodb 历史数据 ==========
        drop_mongo_collections(graph_id, graph_mongo_Name, flag, is_batch, kmap_config.entity_types,
                               kmap_config.edge_entity_types)

        # ========== 创建图数据库schema ==========
        create_schema(graph_DBName, ontology_config, kmap_config, edge_names, is_batch, flag)

        # 更新knowledge_graph的kg_data_volume字段
        graph_dao.updategraphbuildstatus(graph_id)


        # ========== 创建任务 ==========
        scheduler = TaskScheduler(task_id, max(os.cpu_count(), 1))
        for otl_class in graph_KMap['entity'] + graph_KMap['edge']:
            # otl_class: 实体类 或 关系类
            # is_entity: True: otl_class是实体类；Flase: otl_class是关系类
            is_entity = True
            entity = otl_class
            edge = {}
            if 'relations' in otl_class:
                is_entity = False
                edge = otl_class
                entity = {}
            extract_file = kmap_config.entity_type_dict.get(otl_class['entity_type'], {})
            extract_type = extract_file.get('extract_type')

            if extract_type in ['standardExtraction', 'sqlExtraction']:
                # 标准抽取 或 sql抽取
                if is_entity:
                    otl_task_id = task_dao.insert_child_task({
                        'graph_id': graph_id,
                        'task_type': 'entity',
                        'parent': task_id,
                        'entity': [entity],
                        'task_name': entity['name'],
                        'files': [{
                            'ds_id': extract_file.get('ds_id'),
                            'files': extract_file.get('files')
                        }],
                        'extract_type': extract_file.get('extract_type'),
                    })
                    dependencies = []
                else:
                    otl_task_id = task_dao.insert_child_task({
                        'graph_id': graph_id,
                        'task_type': 'edge',
                        'parent': task_id,
                        'edge': [edge],
                        'files': [{
                            'ds_id': extract_file.get('ds_id'),
                            'files': extract_file.get('files')
                        }],
                        'extract_type': extract_file.get('extract_type'),
                    })
                    dependencies = [edge['relations'][0], edge['relations'][2]]
                args = (otl_class, graph_DBName, graph_mongo_Name,
                        origin_ontology, origin_graph_KMap, flag, timestamp)
                scheduler.add_task(Task(otl_task_id, standard_extract, args))
                scheduler.set_dependencies(otl_task_id, dependencies)
            elif (not is_entity and not otl_class['entity_type'] and edge['relation_map']['equation']):
                # 两框抽取的边（未选择抽取对象）没有extract_type所以需要单独处理
                otl_task_id = task_dao.insert_child_task({
                    'graph_id': graph_id,
                    'task_type': 'edge',
                    'parent': task_id,
                    'edge': [edge],
                    'files': [{
                        'ds_id': extract_file.get('ds_id'),
                        'files': extract_file.get('files')
                    }],
                    'extract_type': extract_file.get('extract_type'),
                })
                dependencies = [edge['relations'][0], edge['relations'][2]]
                args = (otl_class, graph_DBName, graph_mongo_Name,
                        origin_ontology, origin_graph_KMap)
                scheduler.add_task(Task(otl_task_id, standard_extract_RelationIn2Class, args))
                scheduler.set_dependencies(otl_task_id, dependencies)
            else:
                # 没有映射至文件，只创建任务记录，没有实际运行任务
                task_info = task_dao.get_history_task_by_task_id(task_id)
                # task_info = [{'start_time': ''}]  # debug
                start_time = task_info[0]['start_time']
                if is_entity:
                    # 非模型的才添加记录
                    if not ontology_config.model_dict[entity['name']]:
                        task_dao.insert_child_task({
                            'graph_id': graph_id,
                            'task_type': 'entity',
                            'parent': task_id,
                            'entity': [entity],
                            'files': [{
                                'ds_id': extract_file.get('ds_id'),
                                'files': extract_file.get('files')
                            }],
                            'extract_type': extract_file.get('extract_type'),
                            'task_status': 'normal'
                        })
                else:
                    # 非模型的才添加记录
                    if not ontology_config.model_dict[edge['relations'][1]]:
                        task_dao.insert_child_task({
                            'graph_id': graph_id,
                            'task_type': 'edge',
                            'parent': task_id,
                            'edge': [edge],
                            'files': [{
                                'ds_id': extract_file.get('ds_id'),
                                'files': extract_file.get('files')
                            }],
                            'extract_type': extract_file.get('extract_type'),
                            'task_status': 'normal'
                        })
        # 分组构建，后续分组中有前面的分组中已经执行过的点边，只创建任务记录，没有实际运行任务
        if is_batch:
            origin_kmap_config = GraphKMapConfig(origin_graph_KMap)
            for entity in batch_param_processor.skip_ontology['entity']:
                task_dao.insert_child_task({
                    'graph_id': graph_id,
                    'task_type': 'entity',
                    'parent': task_id,
                    'entity': [entity],
                    'files': [{
                        'ds_id': origin_kmap_config.entity_info(entity['name']).ds_id,
                        'files': origin_kmap_config.entity_info(entity['name']).files['files']
                    }],
                    'extract_type': origin_kmap_config.entity_info(entity['name']).extract_type,
                    'task_status': 'normal'
                })
            for edge in batch_param_processor.skip_ontology['edge']:
                task_dao.insert_child_task({
                    'graph_id': graph_id,
                    'task_type': 'edge',
                    'parent': task_id,
                    'entity': [edge],
                    'files': [{
                        'ds_id': origin_kmap_config.edge_info(edge['relations']).ds_id,
                        'files': origin_kmap_config.edge_info(edge['relations']).files['files']
                    }],
                    'extract_type': origin_kmap_config.edge_info(edge['relations']).extract_type,
                    'task_status': 'normal'
                })

        # ========== 执行任务 ==========
        # 启动任务调度
        message = '========== 启动任务调度 =========='
        Logger.log_info(message)
        scheduler.start()

        # ========== 检查任务状态 ==========
        while True:
            unfinished_task = task_dao.get_child_task({'parent': task_id,
                                                       'task_status': ['waiting', 'running']})
            # unfinished_task = []  # debug
            if len(unfinished_task) == 0:
                break
            time.sleep(10)

        # ========== 任务结果处理 ==========
        # 检查子任务运行结果，判断任务最终结果

        # 更新最大时间戳
        errors = []
        for task_ret in scheduler.result:
            task_res = task_ret.result
            '''
            返回结果可能为
            1. 任务未结束或任务没有返回值: None
            2. 被终止: 
                isinstance(res, celery.exceptions.TaskRevokedError)
            3. 正常返回:
                直接就是任务return的结果，例：{'max_timestamp': {'entity': '1111'}}
            4. 异常:
                直接就是任务抛出的异常，例：Exception('errror')
            '''
            if task_res:
                if isinstance(task_res, Exception):
                    child_task_id = task_ret.task_id
                    child_task = task_dao.get_history_task_by_task_id(child_task_id)[0]
                    if child_task['task_type'] == 'edge':
                        child_task['task_name'] = eval(child_task['edge'])[0]['relations']
                    message = '{} task {} failed: {}'.format(
                        child_task['task_type'], child_task['task_name'], child_task['error_report'])
                    errors.append(message)
                else:
                    max_timestamp.update(task_res.get('max_timestamp', {}))
        if errors:
            raise Exception(errors)
        graph_dao.updateTaskTimestamp(graph_id, max_timestamp)

        graphdb = GraphDB()
        # 统计数量信息
        if graphdb.type == 'nebulaGraph':
            message = 'nebula submit job stats.'
            Logger.log_info(message)
            time.sleep(20)
            code = graphdb.submit_job_nebula(graph_DBName, graph_id, 'stats')
            if code != 200:
                raise Exception(str(graphdb.state))
            # 统计数量结束之后才允许结束
            time_out = 60 * 60  # 超时时间为1h
            while not graphdb.job_status_nebula(graph_DBName, graph_id):
                time.sleep(5)
                time_out -= 5
                if time_out < 0:
                    state = {
                        'state': 'FAILURE',
                        'meta': {'cause': "nebula submit time out.",
                                 'message': "nebula submit job failed."}
                    }
                    raise Exception(str(state))
        graphdb.close_nebula_conn()

        # 切换版本
        if flag == 'full' and not is_batch:
            change_version(current_DBName, previous_DBName, new_DBName, graph_id, True)

        # 插入/更新缓存
        update_config_cache(graph_id, graph_DBName)

        # 计算领域智商
        send_intelligence_task(graph_id)

        # 计算词向量
        if 'Anysharedocumentmodel' in [f.get('extract_model') for f in graph_KMap['files']] \
                and "subject" in ontology_config.entity_pro_dict:
            Logger.log_info("build document vector start")
            start_time = time.time()
            subject_match_task = TextMatchTask("test", graph_id, document_source=GetGraphDbOsInfo.graphdb_type)
            subject_match_task.build_document_embed()
            Logger.log_info("build document vector end, cost {}".format(time.time() - start_time))

        print("----任务结果处理完成----")

    except Exception as e:
        error_report = str(e)
        # 如果异常参数的第一项是列表，则保留列表格式，否则转为字符串
        # 这么做是为了如果有多个子任务失败，展示的结果以列表形式展示
        if isinstance(next(iter(e.args), None), list):
            error_report = e.args[0]
        error_log = log_oper.get_error_log(str(error_report), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)

        # 记录失败的版本信息
        try:
            if flag == 'full' and not is_batch:
                change_version(current_DBName, previous_DBName, new_DBName, graph_id, False)
        except Exception as e:
            msg = "change_version exception: " + repr(e)
            error_log = log_oper.get_error_log(msg, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)

        # orientdb计算领域智商
        try:
            if GetGraphDbOsInfo.graphdb_type != 'nebulaGraph':
                send_intelligence_task(graph_id)
        except Exception as e:
            msg = "send_intelligence_task exception: " + repr(e)
            error_log = log_oper.get_error_log(msg, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)

        # 终止子任务
        # 1. celery 终止任务
        # 2. 修改任务状态
        celery_tasks = task_dao.get_child_task({'parent': task_id,
                                                'task_status': ['waiting', 'running']})
        unfinished_ids = []
        for t in celery_tasks:
            if t['task_id']:
                cel.control.revoke(t['task_id'], terminate=True, signal=signal.SIGKILL)
            unfinished_ids.append(t['id'])
        if unfinished_ids:
            task_dao.task_on_stop(unfinished_ids)

        # 更新celery任务状态
        self.update_state(state='FAILURE', meta={'message': error_report})


def cancel_intelligence_task(graph_id):
    url = "http://localhost:6488/task/intelligence/cancel_by_relation_id"
    # url = "http://10.4.37.76:6488/task/intelligence/cancel_by_relation_id"  #debug
    headers = {
        'Content-Type': 'application/json',
    }
    graph_id = int(graph_id)
    param_json = dict()
    param_json['relation_id_list'] = [graph_id]

    try:
        response = requests.request("POST", url, headers=headers, data=json.dumps(param_json))
        if response.status_code != 200:
            raise Exception(str(response.text))
        return response.status_code, response.json()
    except Exception as e:
        error_log = log_oper.get_error_log(f"cancel task {graph_id} failed:{repr(e)}", sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)


def new_version(graph_id):
    '''
    获取图空间名
    Args:
        graph_id: 图谱id

    Returns:
        KDB_name: 当前图空间名
        KDB_name_temp： 上一个可用的图空间名
        new_db_name: 新的图空间名
    '''
    ret = graph_dao.get_version_by_id(graph_id)
    ret_dict = ret[0]
    KDB_name = ret_dict["KDB_name"]
    KDB_name_temp = ret_dict["KDB_name_temp"]
    if not KDB_name_temp:
        return KDB_name, KDB_name_temp, KDB_name
    if KDB_name_temp == "None_Version":
        return KDB_name, KDB_name_temp, KDB_name + "-2"
    # 新版本的版本号
    KDB_name_info = KDB_name.split('-')
    version_uuid = KDB_name_info[0]
    if len(KDB_name_info) == 2:
        KDB_name_version = int(KDB_name_info[1])
    else:
        KDB_name_version = 1
    KDB_name_temp_info = KDB_name_temp.split('-')
    if len(KDB_name_temp_info) == 2:
        KDB_name_temp_version = int(KDB_name_temp_info[1])
    else:
        KDB_name_temp_version = 1
    version_num = max(KDB_name_version, KDB_name_temp_version) + 1
    new_db_name = "{}-{}".format(version_uuid, str(version_num))
    return KDB_name, KDB_name_temp, new_db_name


def change_version(KDB_name, KDB_name_temp, new_db_name, graph_id, flag):
    '''
    构建结束后切换版本信息
    Args:
        KDB_name: 当前使用的版本名称
        KDB_name_temp: 上一个版本名称
        new_db_name: 本次构建中使用的版本名称
        graph_id: 图谱id
        flag: 构建是否成功

    Returns:

    '''
    # 第一次构建
    if not KDB_name_temp:
        if "-" in KDB_name:
            graph_dao.update_version(KDB_name, KDB_name.split('-')[0], graph_id)
        else:
            graph_dao.update_version(KDB_name, "None_Version", graph_id)
        return

    # 根据构建结果切换版本
    if flag:
        msg = '切换版本,当前图空间名称为 {}'.format(new_db_name)
        graph_dao.update_version(new_db_name, KDB_name, graph_id)
        ret = graph_dao.getbaseinfoById(graph_id)
        graph_baseInfo = ret[0]['graph_baseInfo']
        graph_baseInfo = eval(graph_baseInfo)
        graph_baseInfo['graph_DBName'] = new_db_name
        graph_dao.update_base_info(str(graph_baseInfo), graph_id)
    else:
        msg = '不切换版本,当前图空间名称为 {}'.format(KDB_name)
        graph_dao.update_version(KDB_name, new_db_name, graph_id)
    Logger.log_info(msg)
    # 如果不是第两次构建则删除被覆盖版本信息
    if KDB_name_temp != "None_Version":
        graphdb = GraphDB()
        graphdb.drop_database(KDB_name_temp)
        graphdb.close_nebula_conn()


def compare_onto_and_schema(graph_DBName: str, ontology_config: OntologyConfig):
    '''
    比较本体和图空间的schema
    Args:
        graph_DBName: 图空间名称
        ontology_config: 本体配置对象

    Returns:
        code: 成功返回值：200
        res:
            'add_tags': 增加点: {点类名称: {属性名称: 属性类型}}
            'add_tag_props': 点增加属性: {点类名称: {属性名称: 属性类型}}
            'add_tag_indexes': 点增加全文索引: {点类名称: 属性列表}
            'add_tag_vectors': 点增加向量索引: {点类名称: 属性列表}
            'remove_tags': 删除点: {点类名称: {属性名称: 属性类型}}
            'remove_tag_props': 点删除属性: {点类名称: {属性名称: 属性类型}}
            'add_edges': 增加边: {边类名称: {属性名称: 属性类型}}
            'add_edge_props': 边增加属性: {边类名称: {属性名称: 属性类型}}
            'add_edge_indexes': 边增加全文索引: {边类名称: 属性列表}
            'remove_edges': 删除边: {边类名称: {属性名称: 属性类型}}
            'remove_edge_props': 边删除属性: {边类名称: {属性名称: 属性类型}}

    '''
    graphdb = GraphDB()
    try:
        # 获取图空间的schema信息
        code, schema = graphdb.get_schema(graph_DBName)
        if code != 200:
            raise Exception(str(graphdb.state))
        # schema_entity_pro_dict: 图空间的 {点类名称: {属性名称: 属性类型}}
        schema_entity_pro_dict = {}
        for entity in schema['entity']:
            code, properties = graphdb.get_properties(graph_DBName, 'entity', entity)
            if code != 200:
                raise Exception(str(graphdb.state))
            schema_entity_pro_dict[entity] = properties
        # schema_edge_pro_dict: 图空间的 {边类名称: {属性名称: 属性类型}}
        schema_edge_pro_dict = {}
        for edge in schema['edge']:
            code, properties = graphdb.get_properties(graph_DBName, 'edge', edge)
            if code != 200:
                raise Exception(str(graphdb.state))
            schema_edge_pro_dict[edge] = properties
        # 获取现有的索引
        code, schema_indexes = graphdb.get_present_index(graph_DBName)
        if code != 200:
            raise Exception(repr(graphdb.state))
        schema_pro_index, schema_index_name, schema_pro_merge, schema_merge_name = schema_indexes

        # 获取本体信息
        onto_entity_pro_dict = ontology_config.entity_pro_dict
        onto_entity_pro_index = ontology_config.entity_pro_index
        onto_pro_merge = ontology_config.pro_merge
        onto_edge_pro_dict = ontology_config.edge_pro_dict
        onto_edge_pro_index = ontology_config.edge_pro_index

        # ========== 点的比较 ==========
        # 新增
        # 增加点: {点类名称: {属性名称: 属性类型}}
        add_tags = {}
        # 点增加属性: {点类名称: {属性名称: 属性类型}}
        add_tag_props = defaultdict(dict)
        # 点增加全文索引: {点类名称: 属性列表}
        add_tag_indexes = defaultdict(list)
        # 点增加向量索引: {点类名称: 属性列表}
        add_tag_vectors = defaultdict(list)
        for entity in onto_entity_pro_dict:
            if entity not in schema_entity_pro_dict:
                add_tags[entity] = onto_entity_pro_dict[entity]
                continue

            if set(onto_pro_merge[entity]) != set(schema_pro_merge[entity]):
                message = '本体与图空间的融合属性不一致，不允许修改。' \
                          '本体的点 {entity} 的融合属性为 {onto_prop} ，' \
                          '而图空间的点 {entity} 的融合属性为 {schema_prop} ' \
                    .format(entity=entity, onto_prop=onto_pro_merge[entity],
                            schema_prop=schema_pro_merge[entity])
                error_log = log_oper.get_error_log(message, sys._getframe(),
                                                   traceback.format_exc())
                Logger.log_error(error_log)
                raise Exception(message)

            onto_props = onto_entity_pro_dict[entity]
            schema_props = schema_entity_pro_dict[entity]
            for prop in onto_props:
                if prop not in schema_props:
                    add_tag_props[entity][prop] = onto_props[prop]
                    continue
                if not data_type_equal(onto_props[prop], schema_props[prop]):
                    message = '本体与图空间的实体类属性类型不一致，不允许修改。' \
                              '本体的点 {entity} 的属性 {prop} 的类型为 {onto_prop_type} ，' \
                              '而图空间的点 {entity} 的属性 {prop} 的类型为 {schema_prop_type} ' \
                        .format(entity=entity, prop=prop,
                                onto_prop_type=onto_props[prop],
                                schema_prop_type=schema_props[prop])
                    error_log = log_oper.get_error_log(message, sys._getframe(),
                                                       traceback.format_exc())
                    Logger.log_error(error_log)
                    raise Exception(message)

            add_indexes = list(set(onto_entity_pro_index[entity]) - set(schema_pro_index.get(entity.lower(), [])))
            for index in add_indexes:
                if index.endswith("-vector"):
                    index = index.replace('-vector', '')
                    add_tag_vectors[entity].append(index)
                else:
                    add_tag_indexes[entity].append(index)
        # 删除
        # 删除点: {点类名称: {属性名称: 属性类型}}
        remove_tags = {}
        # 点删除属性: {点类名称: {属性名称: 属性类型}}
        remove_tag_props = defaultdict(dict)
        for entity in schema_entity_pro_dict:
            if entity not in onto_entity_pro_dict:
                remove_tags[entity] = schema_entity_pro_dict[entity]
                continue
            onto_props = onto_entity_pro_dict[entity]
            schema_props = schema_entity_pro_dict[entity]
            for prop in schema_props:
                if prop not in onto_props:
                    if prop not in ['_ds_id_', '_timestamp_']:
                        remove_tag_props[entity][prop] = schema_props[prop]
                        continue

        # ========== 边的比较 ==========
        # 新增
        # 增加边: {边类名称: {属性名称: 属性类型}}
        add_edges = {}
        # 边增加属性: {边类名称: {属性名称: 属性类型}}
        add_edge_props = defaultdict(dict)
        # 边增加全文索引: {边类名称: 属性列表}
        add_edge_indexes = defaultdict(list)
        for edge in onto_edge_pro_dict:
            if edge not in schema_edge_pro_dict:
                add_edges[edge] = onto_edge_pro_dict[edge]
                continue

            onto_props = onto_edge_pro_dict[edge]
            schema_props = schema_edge_pro_dict[edge]
            for prop in onto_props:
                if prop not in schema_props:
                    add_edge_props[edge][prop] = onto_props[prop]
                    continue
                if not data_type_equal(onto_props[prop], schema_props[prop]):
                    message = '本体与图空间的关系类属性类型不一致，不允许修改。' \
                              '本体的边 {edge} 的属性 {prop} 的类型为 {onto_prop_type} ，' \
                              '而图空间的边 {edge} 的属性 {prop} 的类型为 {schema_prop_type} ' \
                        .format(edge=edge, prop=prop,
                                onto_prop_type=onto_props[prop],
                                schema_prop_type=schema_props[prop])
                    error_log = log_oper.get_error_log(message, sys._getframe(),
                                                       traceback.format_exc())
                    Logger.log_error(error_log)
                    raise Exception(message)

            add_indexes = list(set(onto_edge_pro_index[edge]) - set(schema_pro_index.get(edge.lower(), [])))
            for index in add_indexes:
                add_edge_indexes[edge].append(index)
        # 删除
        # 删除边: {边类名称: {属性名称: 属性类型}}
        remove_edges = {}
        # 边删除属性: {边类名称: {属性名称: 属性类型}}
        remove_edge_props = defaultdict(dict)
        for edge in schema_edge_pro_dict:
            if edge not in onto_edge_pro_dict:
                remove_edges[edge] = schema_edge_pro_dict[edge]
                continue
            onto_props = onto_edge_pro_dict[edge]
            schema_props = schema_edge_pro_dict[edge]
            for prop in schema_props:
                if prop not in onto_props:
                    if prop not in ['_ds_id_', '_timestamp_']:
                        remove_edge_props[edge][prop] = schema_props[prop]
                        continue

        res = {
            'add_tags': add_tags,
            'add_tag_props': add_tag_props,
            'add_tag_indexes': add_tag_indexes,
            'add_tag_vectors': add_tag_vectors,
            'remove_tags': remove_tags,
            'remove_tag_props': remove_tag_props,
            'add_edges': add_edges,
            'add_edge_props': add_edge_props,
            'add_edge_indexes': add_edge_indexes,
            'remove_edges': remove_edges,
            'remove_edge_props': remove_edge_props
        }
        message = '图数据库schema有这些变更: {}'.format(json.dumps(res))
        Logger.log_info(message)
        return 200, res
    finally:
        graphdb.close_nebula_conn()


def data_type_equal(onto_data_type: str, schema_data_type: str) -> bool:
    '''
    比较本体属性的数据类型与图数据库的数据类型是否相同
    Args:
        onto_data_type: 本体属性的数据类型
        schema_data_type: 图数据库的数据类型

    Returns:

    '''
    mapping = {'boolean': 'bool', 'decimal': 'double', 'integer': 'int', "float": "double"}
    if onto_data_type in mapping:
        onto_data_type = mapping[onto_data_type]
    if schema_data_type.startswith('int'):
        schema_data_type = 'int'
    return onto_data_type == schema_data_type


def create_schema(graph_DBName: str, ontology_config: OntologyConfig, kmap_config: GraphKMapConfig,
                  edge_names: list, is_batch: bool, flag: str):
    '''
    创建图数据库schema
    Args:
        graph_DBName: 图数据库名称
        ontology_config: 本体配置对象
        kmap_config: 映射配置对象
        edge_names: 需要构造schema的关系类名
        is_batch: 是否是分组构建
        flag: 是否是增量，增量：increment；全量：full
    '''
    message = '========== 开始创建图数据库schema =========='
    Logger.log_info(message)
    graphdb = GraphDB()

    try:
        entity_names = ontology_config.entity_names
        # 检查opensearch
        if graphdb.type == "nebulaGraph":
            try:
                code, res = check_opensearch(graph_DBName, entity_names, edge_names, is_batch)
            except Exception as e:
                raise Exception('opensearch error: {}'.format(e))
            if code != 200:
                raise Exception(str(res))

        # 检查图数据库是否存在，不存在则新建
        code, res = graphdb.check_db(graph_DBName)
        if code != 200:
            error_report = str({'cause': graphdb.state['meta']['cause'],
                                'message': graphdb.state['meta']['message']})
            raise Exception(error_report)

        # 筛选出真正需要创建schema的点和边
        entity_names_schema = entity_names
        edge_names_schema = edge_names
        # 增量构建处理：原有的schema不用重新创建
        alter_schema = {}
        # 图谱schema已改变
        schema_changed = False
        if flag == 'increment':
            res_code, alter_schema = compare_onto_and_schema(graph_DBName, ontology_config)
            if res_code != 200:
                raise Exception(repr(graphdb.state))
            entity_names_schema = list(alter_schema['add_tags'].keys())
            edge_names_schema = list(alter_schema['add_edges'].keys())

        # 创建点类
        entity_pro_dict = ontology_config.entity_pro_dict
        entity_pro_index = ontology_config.entity_pro_index
        pro_merge = ontology_config.pro_merge
        tag_class_start = time.time()
        Logger.log_info("开始创建点类")
        for otl_name in entity_names_schema:
            Logger.log_info(f'开始创建点类: {otl_name}')
            schema_changed = True
            code, res = graphdb.create_class(graph_DBName, otl_name, entity_pro_dict[otl_name], is_batch)
            if code != 200:
                raise Exception(str(graphdb.state))
            # 可能重新创建点类后索引发生了变化，所以需要重新获取
            code, res = graphdb.get_present_index(graph_DBName)
            if code != 200:
                raise Exception(repr(graphdb.state))
            present_index_field, present_index_name, present_index_field_unique, present_index_name_unique = res
            # 创建全文索引
            code, res = graphdb.create_full_index(otl_name, entity_pro_index[otl_name],
                                                  present_index_name, graph_DBName,
                                                  ontology_config.pro_vector[otl_name])
            if code != 200:
                message = 'create_full_index failed: {}'.format(res)
                error_log = log_oper.get_error_log(message, sys._getframe(),
                                                   traceback.format_exc())
                Logger.log_error(error_log)
                raise Exception(str(graphdb.state))
            # 创建唯一索引
            if otl_name in pro_merge:
                merge_pro = pro_merge[otl_name]  # 融合属性列表
                if otl_name not in present_index_name_unique:
                    code, res = graphdb.create_uni_index(otl_name, merge_pro, present_index_name_unique,
                                                         graph_DBName,
                                                         entity_pro_dict[otl_name])
                    if code != 200:
                        raise Exception(str(graphdb.state))
        Logger.log_info('创建点类结束，耗时{}s'.format(time.time() - tag_class_start))

        # 创建边类
        edge_pro_dict = ontology_config.edge_pro_dict
        edge_pro_index = ontology_config.edge_pro_index
        edge_class_start = time.time()
        Logger.log_info('开始创建边类')
        for edge_class in edge_names_schema:
            edge_otl_pro = list(edge_pro_dict[edge_class].keys())  # 边的属性列表
            Logger.log_info(f'开始创建边类:{edge_class}')
            schema_changed = True
            code, res = graphdb.create_edge_class(edge_class, edge_otl_pro, edge_pro_dict, graph_DBName, is_batch)
            if code != 200:
                raise Exception(str(graphdb.state))
            # 可能重新创建边类后索引发生了变化，所以需要重新获取
            code, res = graphdb.get_present_index(graph_DBName)
            if code != 200:
                raise Exception(repr(graphdb.state))
            present_index_field, present_index_name, present_index_field_unique, present_index_name_unique = res
            # 创建全文索引
            code, res = graphdb.create_full_index(edge_class, edge_pro_index[edge_class],
                                                  present_index_name, graph_DBName)
            if code != 200:
                message = 'create_full_index failed: {}'.format(res)
                error_log = log_oper.get_error_log(message, sys._getframe(),
                                                   traceback.format_exc())
                Logger.log_error(error_log)
                raise Exception(str(graphdb.state))
            # 唯一索引
            if graphdb.type == 'nebulaGraph':
                code, res = graphdb._create_edge_index_nebula(graph_DBName, edge_class + '_' + '_'.join(edge_otl_pro),
                                                              edge_class, edge_otl_pro, edge_pro_dict[edge_class])
                if code != 200:
                    raise Exception(str(graphdb.state))
        Logger.log_info('创建边类结束，耗时{}s'.format(time.time() - edge_class_start))
        if graphdb.type == 'nebulaGraph' and (entity_names_schema or edge_names_schema):
            Logger.log_info("waiting for nebula creating schema. please wait...")
            time.sleep(20)

        # 增量构建对schema进行修改
        if flag == "increment" and not is_batch:
            # 点新增属性
            for otl_name in alter_schema['add_tag_props']:
                schema_changed = True
                code, res = graphdb.alter_class(graph_DBName, otl_name, 'tag', 'add_prop',
                                                otl_pro=alter_schema['add_tag_props'][otl_name].keys(),
                                                en_pro_dict=alter_schema['add_tag_props'])
                if code != 200:
                    raise Exception(str(graphdb.state))
            # 点增加全文索引
            code, res = graphdb.get_present_index(graph_DBName)
            if code != 200:
                raise Exception(repr(graphdb.state))
            present_index_field, present_index_name, present_index_field_unique, present_index_name_unique = res
            for otl_name in alter_schema['add_tag_indexes']:
                code, res = graphdb.create_full_index(otl_name,
                                                      alter_schema['add_tag_indexes'][otl_name],
                                                      present_index_name, graph_DBName,
                                                      [])
                if code != 200:
                    raise Exception(str(graphdb.state))
            # 点增加向量
            for otl_name in alter_schema['add_tag_vectors']:
                code, res = graphdb.create_full_index(otl_name,
                                                      [],
                                                      present_index_name, graph_DBName,
                                                      alter_schema['add_tag_vectors'][otl_name])
                if code != 200:
                    raise Exception(str(graphdb.state))
            # 点删除属性
            for otl_name in alter_schema['remove_tag_props']:
                schema_changed = True
                for propertyname in alter_schema['remove_tag_props'][otl_name].keys():
                    code, res = graphdb.alter_class(graph_DBName, otl_name, 'tag', 'drop_prop',
                                                    en_pro_dict=alter_schema['remove_tag_props'],
                                                    unsafe="True",
                                                    propertyname=propertyname)
                    if code != 200:
                        raise Exception(str(graphdb.state))
            # 删除点类
            for otl_name in alter_schema['remove_tags']:
                schema_changed = True
                code, res = graphdb.drop_vertex(graph_DBName, otl_name)
                if code != 200:
                    raise Exception(repr(graphdb.state))
            # 边增加属性
            for edge in alter_schema['add_edge_props']:
                schema_changed = True
                code, res = graphdb.alter_class(graph_DBName, edge, 'edge', 'add_prop',
                                                otl_pro=alter_schema['add_edge_props'][edge].keys(),
                                                en_pro_dict=alter_schema['add_edge_props'])
                if code != 200:
                    raise Exception(str(graphdb.state))
            # 边增加全文索引
            for edge in alter_schema['add_edge_indexes']:
                code, res = graphdb.create_full_index(edge,
                                                      alter_schema['add_edge_indexes'][edge],
                                                      present_index_name, graph_DBName)
                if code != 200:
                    raise Exception(str(graphdb.state))
            # 边删除属性
            for edge in alter_schema['remove_edge_props']:
                schema_changed = True
                for propertyname in alter_schema['remove_edge_props'][edge].keys():
                    code, res = graphdb.alter_class(graph_DBName, edge, 'edge', 'drop_prop',
                                                    en_pro_dict=alter_schema['remove_tag_props'],
                                                    unsafe="True",
                                                    propertyname=propertyname)
                    if code != 200:
                        raise Exception(str(graphdb.state))
            # 删除边类
            for edge in alter_schema['remove_edges']:
                schema_changed = True
                code, res = graphdb.drop_edge(graph_DBName, edge)
                if code != 200:
                    raise Exception(repr(graphdb.state))
        if graphdb.type == 'nebulaGraph' and schema_changed:
            Logger.log_info("waiting for nebula creating schema. please wait...")
            time.sleep(20)
    finally:
        graphdb.close_nebula_conn()


def check_opensearch(mongo_db, entity_names, edge_names, is_batch):
    """
        检查opensearch的剩余分片是否充足，删除当前图谱未使用的索引

        Args:
        mongo_db: 表graph_config_table中的graph_baseInfo中的graph_DBName，表示orientdb中database的名字
        entity_names: entity name list that need to be built (both in ontology level and in data level)
        edge_names: edge name list that need to be built (only in ontology level)
    """
    # 获取当前db_name已用openSearch的索引名
    opensearch_manager = OpenSearchManager()
    code, indexs = opensearch_manager.get_used_indexs_by_db_name(mongo_db)
    if code != 200:
        return 500, repr(opensearch_manager.state)
    indexs = list(indexs)

    need_shared = 0
    for otl_name in entity_names:
        index = mongo_db + "_" + otl_name
        index = index.lower()

        # 检查openSearch中是否存在该点类数据
        if index not in indexs:
            # 没有，则需要额外的分片存储
            need_shared += 1
        else:
            # 有，则移除indexs中已有内容
            indexs.remove(index)

    for edge_name in edge_names:
        index = mongo_db + "_" + edge_name
        index = index.lower()

        # 检查openSearch中是否存在该边类数据
        if index not in indexs:
            need_shared += 1
        else:
            indexs.remove(index)

    # 非分批删除上次构建的废弃索引
    if len(indexs) != 0 and not is_batch:
        code, res = opensearch_manager.del_indexs(indexs)
        if code != 200:
            return 500, repr(opensearch_manager.state)

    # 调用openSearch接口，查询是否有足够的分片
    code, res = opensearch_manager.have_enough_shared(need_shared)
    if code != 200:
        return 500, repr(opensearch_manager.state)
    if res == False:
        return 500, repr({'state': 'FAILURE',
                          'meta': {'cause': "opensearch remaining shared is not enough",
                                   'message': "opensearch remaining shared is not enough"}})

    # 查询磁盘空间是否够opensearch正常使用
    code, res = opensearch_manager.have_enough_disk()
    if code != 200:
        return 500, repr(opensearch_manager.state)
    if res == False:
        return 500, repr({'state': 'FAILURE',
                          'meta': {'cause': "insufficient disk space, opensearch cannot run properly",
                                   'message': "insufficient disk space, opensearch cannot run properly"}})

    return 200, res


@dataclass
class Task:
    id: int  # mysql中记录的任务id
    fun: Callable
    args: tuple


class TaskScheduler:
    def __init__(self, task_id, max_concurrency):
        self.task_queue = Queue()
        self.dependencies = {}
        self.max_concurrency = max_concurrency
        self.task_id = task_id
        self.result = []

    def add_task(self, task: Task):
        self.task_queue.put(task)

    def set_dependencies(self, task_id, dependencies):
        '''
        设置子任务的依赖项
        Args:
            task_id: 子任务的mysql任务id
            dependencies: 列表，每项为实体类名或模型名
        '''
        self.dependencies[task_id] = dependencies

    def execute_task(self, task: Task):
        message = f"Executing task: {task}"
        Logger.log_info(message)
        # 在这里执行任务的逻辑
        # not debug start
        res = task.fun.apply_async(args=task.args)
        celery_task_id = res.task_id
        task_dao.update_celery_task_id(celery_task_id, task.id)
        # not debug end

        # # debug start
        # celery_task_id = task.fun.name + '_'.join([str(a) for a in task.args])
        # celery_task_id = celery_task_id[:200]
        # task_dao.update_celery_task_id(celery_task_id, task.id)
        # try:
        #     res = task.fun(*task.args)
        # except Exception as e:
        #     res = e
        # res = type('', (object,), {'result': res, 'task_id': celery_task_id})
        # # debug end

        self.result.append(res)

    def schedule_tasks(self):
        while not self.task_queue.empty():
            task = self.task_queue.get()

            # 如果任务被终止了，不用重新开始运行
            task_record = task_dao.get_history_task_by_id2(task.id)
            task_status = task_record[0]['task_status']
            if task_status != 'waiting':
                continue

            running_count = self.get_running_count()
            if running_count >= self.max_concurrency:
                # 达到最大并发任务数，等待其他任务完成
                message = '达到最大并发任务数，任务开始等待: Task(id={}, fun={})'.format(task.id, task.fun)
                Logger.log_info(message)
                self.task_queue.put(task)
                time.sleep(30)
                continue

            if self.check_dependence(task.id):
                # 有未完成的依赖，等待下次调度
                message = '依赖任务未完成，任务开始等待: Task(id={}, fun={})'.format(task.id, task.fun)
                Logger.log_info(message)
                self.task_queue.put(task)
                time.sleep(5)
                continue

            # 执行任务
            self.execute_task(task)

    def start(self):
        # 启动任务调度
        self.schedule_tasks()

    def get_running_count(self):
        running_tasks = task_dao.get_child_task({'parent': self.task_id,
                                                 'celery_submitted': True,
                                                 'task_status': ['waiting', 'running']})
        return len(running_tasks)

    def check_dependence(self, task_id):
        ''' 检查是否有未完成的依赖
        True: 有
        False: 无
        '''
        dependencies = self.dependencies.get(task_id, [])
        for dependency in dependencies:
            depend_task = task_dao.get_child_task({'parent': self.task_id,
                                                   'task_name': dependency,
                                                   'task_status': ["waiting", "running"]})
            if len(depend_task) > 0:
                return True
        return False


def drop_mongo_collections(graph_id, graph_mongo_Name, flag, is_batch, entity_types=None, edge_entity_types=None):
    """
    delete mongodb collections
    结构化增量： 只删除边，保留点的mongodb数据，保证旧的数据也能建立关系
    全量：删除所有collection
    Args:
        graph_mongo_Name: mongodb name, baseInfo["graph_mongo_Name"]
        flag: 是否是增量，增量：increment；全量：full
        is_batch: 是否是分组构建
        entity_types: graph_KMap中所有文件的 entity_type 列表
        edge_entity_types: graph_KMap中所有边的 entity_type 列表

    """
    conn_db = mongoConnect.connect_mongo()
    try:
        collection_names = conn_db.list_collection_names()
    except Exception as e:
        message = 'MongoDB error: {}'.format(e)
        raise Exception(message)
    collection_names_to_delete = [name for name in collection_names if name.startswith(graph_mongo_Name + '_')]
    if flag == 'increment':
        # 删除不在本次构建中的集合（已经删除的点边的脏数据）
        mongo_files = [graph_mongo_Name + "_" + file for file in entity_types]
        collection_names_to_delete = set(collection_names_to_delete) - set(mongo_files)

    if is_batch:
        # 分组构建
        task = task_dao.gettaskbyid(graph_id)[0]
        subgraph_ids = eval(task['subgraph_ids'])
        current_subgraph_id = task['current_subgraph_id']
        # first_batch: 是分组构建的第一组
        first_batch = current_subgraph_id == subgraph_ids[0]
        if not first_batch:
            if flag == 'full':
                collection_names_to_delete = [graph_mongo_Name + "_" + name for name in entity_types]
            else:
                collection_names_to_delete = []
    for collection_name in collection_names_to_delete:
        db_collection = conn_db[collection_name]
        db_collection.drop()
        message = "is deleting mongo database {}, table {} is deleted".format(graph_mongo_Name, collection_name)
        Logger.log_info(message)


def update_config_cache(graph_id: int, graph_DBName: str):
    '''
    插入/更新图谱配置缓存
    Args:
        graph_id: 图谱id
        graph_DBName: 图空间名称
    '''
    Logger.log_info("开始更新redis")
    ret = graph_dao.getbyid(graph_id)
    otl_id = ret[0]['graph_otl']
    ret = otl_dao.getbyid(otl_id)
    ret = ret[0]
    entitys = eval(ret['entity'])
    edges = eval(ret['edge'])
    res = {'entity': [], 'edge': []}
    for e in entitys:
        old_properties = e['properties']
        new_properties = []
        for prop in old_properties:
            p = dict()
            p['name'] = prop['name']
            p['type'] = prop['data_type']
            p['alias'] = prop['alias']
            new_properties.append(p)
        entity = {}
        entity['properties'] = new_properties
        entity['name'] = e['name']
        entity['alias'] = e['alias']
        entity['entity_id'] = e['entity_id']
        entity['x'] = e.get('x', None)
        entity['y'] = e.get('y', None)
        entity['default_tag'] = e.get('default_tag', '')
        entity['icon'] = e.get('icon', "")
        entity['shape'] = e.get('shape')
        entity['size'] = e.get('size')
        entity['color'] = e.get('fill_color')
        entity['fill_color'] = e.get('fill_color')
        entity['stroke_color'] = e.get('stroke_color')
        entity['text_position'] = e.get('text_position')
        entity['icon_color'] = e.get('icon_color')
        entity['text_width'] = e.get('text_width')
        entity['text_color'] = e.get('text_color')
        entity['text_type'] = e.get('text_type')
        res['entity'].append(entity)
    for e in edges:
        old_properties = e['properties']
        new_properties = []
        for prop in old_properties:
            p = dict()
            p['name'] = prop['name']
            p['type'] = prop['data_type']
            p['alias'] = prop['alias']
            new_properties.append(p)
        edge = {}
        edge['properties'] = new_properties
        edge['name'] = e['name']
        edge['alias'] = e['alias']
        edge['color'] = e['colour']
        edge['edge_id'] = e['edge_id']
        edge['relation'] = e['relations']
        edge['shape'] = e['shape']
        edge['width'] = e.get('width')
        res['edge'].append(edge)
    res['dbname'] = graph_DBName
    content = {}
    content["dbname"] = res['dbname']
    content["edge"] = edges
    content["entity"] = entitys
    graph_dao.refresh_redis_cache(graph_id, content)
    Logger.log_info("更新redis完成")


def send_intelligence_task(graph_id):
    '''
    提交领域智商计算任务
    '''
    url = "http://localhost:6488/task/intelligence"
    # url = "http://10.4.37.76:6488/task/intelligence"  #debug
    headers = {
        'Content-Type': 'application/json',
    }
    param_json = dict()
    param_json['task_type'] = 'intelligence'
    param_json['relation_id'] = graph_id
    param_json['task_name'] = 'intelligence-{}'.format(graph_id)
    param_json['async_task_name'] = "cel.intelligence_calculate"
    # 设置是否取消正在运行的同图谱任务
    param_json['cancel_pre'] = True
    param_json['task_params'] = json.dumps({"graph_id": graph_id})
    retry_count = 3
    # 尝试3次
    for _ in range(retry_count):
        try:
            response = requests.request("POST", url, headers=headers, data=json.dumps(param_json))
            if response.status_code != 200:
                Logger.log_info(f"post task {graph_id} failed:{str(response.text)}")
                continue
            Logger.log_info(f"post task {graph_id} success:{repr(response.json())}")
            break
        except Exception as e:
            error_log = log_oper.get_error_log(f"post task {graph_id} failed:{repr(e)}", sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
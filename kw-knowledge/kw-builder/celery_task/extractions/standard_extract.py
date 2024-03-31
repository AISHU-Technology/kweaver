# -*- coding:utf-8 -*-
import sys
import traceback

import common.stand_log as log_oper
from celery_task.celery_tasks import cel
from celery_task.graph_config import OntologyConfig, GraphKMapConfig
from celery_task.transfer import MysqlOdbcTransfer, MysqlTransfer, HiveTransfer,  \
    SqlserverTransfer, KingbaseesTransfer, PostgresqlTransfer, ClickHouseTransfer, DataStorage
from celery_task.writer import EdgeWriter
from dao.dsm_dao import dsm_dao
from service.task_Service import task_service
from utils.log_info import Logger


@cel.task(name='app.standard_extract', bind=True)
def standard_extract(self, otl_class: dict, graph_DBName: str,
                     graph_mongo_Name: str, ontology: dict,
                     graph_KMap: dict, flag: str, timestamp: dict = None) -> dict:
    '''
    标准抽取
    Args:
        otl_class: 实体类/关系类信息
        graph_DBName: 图数据库名称
        graph_mongo_Name: mongodb名称
        ontology: 本体配置信息
        graph_KMap: 文件映射配置信息
        flag: 是否是增量，增量：increment；全量：full
        timestamp: 历史的最大时间。如果是增量，该参数必传

    Returns:
        max_timestamp: 如果是增量，则返回数据源的最大时间

    '''
    celery_task_id = self.request.id
    # # debug start
    # import inspect
    # args = []
    # for i in inspect.signature(standard_extract).parameters.keys():
    #     args.append(str(locals().get(i)))
    # celery_task_id = 'app.standard_extract' + '_'.join(args)
    # celery_task_id = celery_task_id[:200]
    # # debug end
    try:
        task_service.save_task_ip(celery_task_id)
        task_service.on_start(celery_task_id)
        message = '========== 开始标准抽取: {} =========='.format(otl_class.get('relations', otl_class.get('name')))
        Logger.log_info(message)

        ontology_config = OntologyConfig(ontology)
        kmap_config = GraphKMapConfig(graph_KMap)
        is_entity = 'relations' not in otl_class
        if is_entity:
            otl_name = otl_class['name']
            otl_info = kmap_config.entity_info(otl_name)
        else:
            relation = otl_class['relations']
            otl_info = kmap_config.edge_info(relation)
        data_source = otl_info.data_source

        data_storage = DataStorage(otl_class, graph_DBName, graph_mongo_Name, ontology_config, kmap_config, flag)
        transfer = None
        if data_source == "mysql":
            ds_id = otl_info.ds_id
            ds_info = dsm_dao.getdsbyids([ds_id])[0]
            if ds_info["connect_type"] == "odbc":
                transfer = MysqlOdbcTransfer(otl_class, kmap_config, flag, data_storage)
            else:
                transfer = MysqlTransfer(otl_class, kmap_config, flag, data_storage)
        elif data_source == "hive":
            transfer = HiveTransfer(otl_class, kmap_config, flag, data_storage)
        elif data_source == "sqlserver":
            transfer = SqlserverTransfer(otl_class, kmap_config, flag, data_storage)
        elif data_source == "kingbasees":
            transfer = KingbaseesTransfer(otl_class, kmap_config, flag, data_storage)
        elif data_source == "postgresql":
            transfer = PostgresqlTransfer(otl_class, kmap_config, flag, data_storage)
        elif data_source == "clickhouse":
            transfer = ClickHouseTransfer(otl_class, kmap_config, flag, data_storage)

        extract_type = otl_info.extract_type
        if extract_type == "sqlExtraction":
            res = transfer.sql_run(timestamp)
        elif extract_type == "standardExtraction":
            res = transfer.run(timestamp)
        message = '最大时间戳为: {}'.format(res)
        Logger.log_info(message)
        task_service.on_success(celery_task_id)
        return res
    except Exception as e:
        error_log = log_oper.get_error_log(f'standard_extract error:{str(e)}', sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        task_service.on_failure(celery_task_id, error_log)
        raise e


@cel.task(name='app.standard_extract_RelationIn2Class', bind=True)
def standard_extract_RelationIn2Class(self, otl_class: dict, graph_DBName: str,
                                      graph_mongo_Name: str, ontology: dict,
                                      graph_KMap: dict):
    '''
    标准抽取：边的2框，无抽取对象，所以特殊处理
    Args:
        otl_class: 关系类信息
        graph_DBName: 图数据库名称
        graph_mongo_Name: mongodb名称
        ontology: 本体配置信息
        graph_KMap: 文件映射配置信息
    '''
    celery_task_id = self.request.id
    # # debug start
    # import inspect
    # args = []
    # for i in inspect.signature(standard_extract_RelationIn2Class).parameters.keys():
    #     args.append(str(locals().get(i)))
    # celery_task_id = 'app.standard_extract_RelationIn2Class' + '_'.join(args)
    # celery_task_id = celery_task_id[:200]
    # # debug end
    try:
        task_service.save_task_ip(celery_task_id)
        task_service.on_start(celery_task_id)
        message = '========== 开始标准抽取: {} =========='.format(otl_class.get('relations', otl_class.get('name')))
        Logger.log_info(message)

        ontology_config = OntologyConfig(ontology)
        kmap_config = GraphKMapConfig(graph_KMap)
        edge_writer = EdgeWriter(otl_class['relations'], graph_DBName, graph_mongo_Name, ontology_config, kmap_config,
                                 'full')
        edge_writer.write_edge()
        task_service.on_success(celery_task_id)
    except Exception as e:
        error_log = log_oper.get_error_log(f'standard_extract_RelationIn2Class error:{str(e)}'
                                           , sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        task_service.on_failure(celery_task_id, error_log)
        raise e

# -*- coding:utf-8 -*-
import db_migrate.build_tables.table_3 as table
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db
from dao.graph_dao import graph_dao
from dao.otl_dao import otl_dao
from dao.subgraph_dao import subgraph_dao

def updateDatabase():
    update_schema()
    update_contents()

@connect_execute_commit_close_db
def update_schema(connection, cursor):
    # 创建子图配置表
    sql = """
           CREATE TABLE `subgraph_config` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `ontology_id` int(11) NOT NULL,
                `graph_id` int(11) NOT NULL,
                `name` varchar(50) NOT NULL,
                `entity` longtext,
                `edge` longtext,
                `create_time` varchar(50),
                `update_time` varchar(50),
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
           """
    Logger.log_info(sql)
    cursor.execute(sql)

    # 修改图谱任务表
    sql = """
        ALTER TABLE `graph_task_table`
        ADD `subgraph_ids` longtext default '[0]',
        ADD `current_subgraph_id` int(11) default -1,
        ADD `failed_subgraph_ids` longtext,
        ADD `stop_subgraph_ids` longtext,
        ADD `write_mode` varchar(50) default 'skip',
        ADD `successful_subgraph` longtext;
         """
    Logger.log_info(sql)
    cursor.execute(sql)

    # 修改图谱历史任务表
    sql = """
        ALTER TABLE `graph_task_history_table`
        ADD `subgraph_id` int(11) default 0,
        ADD `task_name` varchar(50),
        ADD `entity` longtext,
        ADD `edge` longtext;
        """
    Logger.log_info(sql)
    cursor.execute(sql)

    sql = """
            ALTER TABLE knowledge_graph ADD KDB_name_temp varchar(250);
            """
    Logger.log_info(sql)
    cursor.execute(sql)

def update_contents():
    '''
    1. For the graphs with ontology, add a subgraph configuration for each graph, which is named "Ungrouped".
    The configuration of entities and edges is the entire ontology.
    2. For each row in graph_task_history_table, fill entity and edge with the ontology of the graph.
    '''
    all_graphs = graph_dao.getallgraph().to_dict('records')
    for graph in all_graphs:
        ontology_id = eval(graph['graph_otl'])
        if not ontology_id:
            continue
        ontology_id = ontology_id[0]
        ontology = otl_dao.getbyid(ontology_id).to_dict('records')[0]
        subgraph_config = {'graph_id': graph['id'],
                           'ontology_id': ontology_id,
                           'name': 'ungrouped',
                           'entity': ontology['entity'],
                           'edge': ontology['edge']
                           }
        subgraph_dao.insert_subgraph_config(subgraph_config)
        update_task_ontology(graph['id'], ontology)

@connect_execute_commit_close_db
def update_task_ontology(graph_id, ontology, connection, cursor):
    sql = '''UPDATE graph_task_history_table set task_name=graph_name, entity=%s, edge=%s where graph_id=%s'''
    Logger.log_info(sql)
    cursor.execute(sql, [ontology['entity'], ontology['edge'], graph_id])


class Builder_3:
    def update(self):
        Logger.log_info('builder-1.1.3 start updating.')
        updateDatabase()
        Logger.log_info('builder-1.1.3 update success.')

    def initiate(self):
        Logger.log_info('builder-1.1.3 start initiating.')
        table.init_datatable()
        Logger.log_info('builder-1.1.3 initiate success')

builder_3 = Builder_3()


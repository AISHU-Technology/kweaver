import pandas as pd

from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db
from celery.utils import log

logger = log.get_logger(__name__)


class EntityType(object):
    VERTEX = 1
    EDGE = 2


class EntityStatus(object):
    ENABLE = 1
    DISABLE = 0


class CommonStatic(object):
    default_iter_size = 10
    empty_value_list = ['NULL', '""', """''""", "()", '', '{}']


class IntelligenceDao:

    # 新增知识网络
    def __insert_record(self, params_json, cursor, connection):
        logger.info("save intelligence records:{}".format(repr(params_json)))

        value_list = list()
        value_list.append(params_json['graph_id'])
        value_list.append(params_json['entity'])
        value_list.append(params_json['entity_type'])
        value_list.append(params_json['prop_number'])
        value_list.append(params_json['data_number'])
        value_list.append(params_json['empty_number'])
        value_list.append(params_json['repeat_number'])
        value_list.append(params_json['updated_time'])

        sql = """
        INSERT INTO intelligence_records 
            (graph_id, entity, entity_type, prop_number, data_number, empty_number, repeat_number, updated_time) 
        VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s)
              """
        cursor.execute(sql, value_list)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_commit_close_db
    def insert_records(self, params_json_list, cursor, connection):
        # 删除
        graph_id_list = [params_json['graph_id'] for params_json in params_json_list]
        graph_id_list = list(set(graph_id_list))
        self.__delete_by_graph_id_list(graph_id_list, cursor)
        # 插入
        new_ids = []
        for params_json in params_json_list:
            params_json['repeat_number'] = 0
            new_id = self.__insert_record(params_json, cursor, connection)
            new_ids.append(new_id)
        return new_ids

    @connect_execute_close_db
    def query(self, graph_id_list, cursor, connection):
        # 查询记录，按照图谱查询，按照网络查询
        graph_id_list = [str(graph_id) for graph_id in graph_id_list]
        if not graph_id_list:
            # TODO 返回值处理
            return None
        sql = "select * from intelligence_records where graph_id in ({}) ".format(','.join(graph_id_list))
        cursor.execute(sql)
        return cursor.fetchall()

    def __delete_by_graph_id_list(self, graph_id_list, cursor):
        graph_id_list = [str(graph_id) for graph_id in graph_id_list]
        sql = """delete from intelligence_records where graph_id in (%s)"""
        cursor.execute(sql, ','.join(graph_id_list))


intelligence_dao = IntelligenceDao()

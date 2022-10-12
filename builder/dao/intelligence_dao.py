import math
from decimal import Decimal

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
        # delete previous intelligence calculate records
        graph_id_list = [params_json['graph_id'] for params_json in params_json_list]
        graph_id_list = list(set(graph_id_list))
        self.__delete_by_graph_id_list(graph_id_list, cursor)
        # insert new intelligence calculate records
        new_ids = []
        for params_json in params_json_list:
            new_id = self.__insert_record(params_json, cursor, connection)
            new_ids.append(new_id)
        # update network intelligence score
        for graph_id in graph_id_list:
            self.__update_network_score(graph_id, cursor)
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

    def __update_network_score(self, graph_id, cursor):
        # query network intelligence
        sql = f"""
                SELECT  b.knw_id knw_id,
                        sum(a.prop_number*a.data_number) total, 
	                    sum(a.empty_number) empty_number, 
	                    sum(a.repeat_number) repeat_number
                FROM intelligence_records a 
                join network_graph_relation b 
                on a.graph_id =b.graph_id  
                where b.graph_id={graph_id}
            """
        cursor.execute(sql)
        item = cursor.fetchone()
        # update network intelligence score
        score = self.intelligence_score(item['total'], item['empty_number'], item['repeat_number'])
        sql =f"""
                update knowledge_network set intelligence_score={score} where id={item['knw_id']}
            """
        cursor.execute(sql)

    def intelligence_score(self, total, empty_number, repeat_number):
        B = Decimal(math.log(total, 10) * 10)
        C1 = 1 - repeat_number / total
        C2 = 1 - empty_number / total
        return round(B * (C1 + C2) / 2, 2)


intelligence_dao = IntelligenceDao()

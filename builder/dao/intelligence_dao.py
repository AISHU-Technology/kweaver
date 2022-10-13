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
        value_list.append(params_json['entity_knowledge'])
        value_list.append(params_json['edge_knowledge'])
        value_list.append(params_json['data_number'])
        value_list.append(params_json['total_knowledge'])
        value_list.append(params_json['empty_number'])
        value_list.append(params_json['repeat_number'])
        value_list.append(params_json['data_quality_score'])
        value_list.append(params_json['update_time'])

        sql = """
        INSERT INTO intelligence_records 
            (graph_id, entity_knowledge, edge_knowledge, data_number, total_knowledge, empty_number, 
                repeat_number, data_quality_score, update_time) 
        VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s)
              """
        cursor.execute(sql, value_list)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_commit_close_db
    def insert_records(self, params_json_list, cursor, connection):
        # delete previous intelligence calculate records
        graph_id_list = [params_json['graph_id'] for params_json in params_json_list]
        graph_id_list = list(set(graph_id_list))

        knw_id_list = [params_json['knw_id'] for params_json in params_json_list]
        knw_id_list = list(set(knw_id_list))

        self.__delete_by_graph_id_list(graph_id_list, cursor)
        # insert new intelligence calculate records
        new_ids = []
        for params_json in params_json_list:
            new_id = self.__insert_record(params_json, cursor, connection)
            new_ids.append(new_id)
        # update network intelligence score
        for knw_id in knw_id_list:
            self.__update_network_score(knw_id, cursor)
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

    @connect_execute_close_db
    def query_in_page(self, query_param, cursor, connection):
        # 查询记录，按照图谱查询，按照网络查询
        sql = f"""
          select kg.id graph_id, kg.KG_name graph_name, ir.id, ir.total_knowledge, ir.repeat_number,
			     ir.entity_knowledge, ir.edge_knowledge,ir.empty_number, ir.data_quality_score, kg.update_time
			     from ((select ngr2.knw_id knw_id, kg2.* from knowledge_graph kg2 join 
			        network_graph_relation ngr2 on kg2.id=ngr2.graph_id where ngr2.knw_id={query_param['knw_id']})) kg 
			      left join intelligence_records ir on kg.id=ir.graph_id"""

        # 根据图谱名称模糊查询
        if 'graph_name' in query_param and query_param['graph_name']:
            sql += f""" where kg.KG_name like "%{query_param['graph_name']}%" """

        if 'rule' in query_param:
            rule_list = query_param['rule']
            order_list = query_param['order']

            po_list = list()
            for index, prop in enumerate(rule_list):
                # 如果两者不对齐，rule长度超了，跳过该rule
                if index + 1 > len(order_list):
                    continue
                order = order_list[index]
                if prop == "update_time":
                    po_list.append(f" order by kg.update_time {order}")
                if prop == 'data_quality_score':
                    po_list.append(f" order by ir.data_quality_score {order}")
                if prop == 'data_quality_B':
                    po_list.append(f" order by ir.total_knowledge {order}")

            if len(po_list) > 0:
                sql += ", ".join(po_list)
        # 分页
        if 'size' in query_param and 'page' in query_param:
            page = int(query_param['page'])
            size = int(query_param['size'])
            sql += f""" limit {(page - 1) * size}, {size}"""
        cursor.execute(sql)
        return cursor.fetchall()

    def __delete_by_graph_id_list(self, graph_id_list, cursor):
        graph_id_list = [str(graph_id) for graph_id in graph_id_list]
        sql = """delete from intelligence_records where graph_id in (%s)"""
        cursor.execute(sql, ','.join(graph_id_list))

    def __update_network_score(self, knw_id, cursor):
        # query network intelligence
        sql = f"""
                SELECT  b.knw_id knw_id,
                        sum(a.total_knowledge) total, 
	                    sum(a.empty_number) empty_number, 
	                    sum(a.repeat_number) repeat_number
                FROM intelligence_records a 
                join network_graph_relation b 
                on a.graph_id =b.graph_id  
                where b.knw_id={knw_id}
            """
        cursor.execute(sql)
        item = cursor.fetchone()
        # update network intelligence score
        score = self.intelligence_score(item['total'], item['empty_number'], item['repeat_number'])
        sql = f"""
                update knowledge_network set intelligence_score={score} where id={item['knw_id']}
            """
        cursor.execute(sql)

    def intelligence_score(self, total, empty_number, repeat_number):
        B = float(math.log(total, 10) * 10)
        C1 = float(1 - repeat_number / total)
        C2 = float(1 - empty_number / total)
        return round(B * (C1 + C2) / 2, 2)


intelligence_dao = IntelligenceDao()

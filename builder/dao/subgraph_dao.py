# -*- coding:utf-8 -*-
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db
import arrow

class SubgraphDao():
    @connect_execute_close_db
    def get_subgraph_list_by_graph_id(self, graph_id, connection, cursor):
        sql = f'SELECT id, name FROM `subgraph_config` WHERE graph_id = {graph_id}'
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_close_db
    def get_subgraph_config_by_id(self, id, connection, cursor):
        sql = f'SELECT * FROM `subgraph_config` WHERE id = {id}'
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_commit_close_db
    def insert_subgraph_config(self, params, connection, cursor):
        value_list = []
        value_list.append(params.get('graph_id'))
        value_list.append(params.get('ontology_id'))
        value_list.append(params.get('name'))
        value_list.append(str(params.get('entity')))
        value_list.append(str(params.get('edge')))
        value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        sql = '''INSERT INTO subgraph_config 
                    (graph_id, ontology_id, name, entity, edge, create_time, update_time)
                VALUES 
                    (%s, %s, %s, %s, %s, %s, %s)'''
        cursor.execute(sql, value_list)
        new_id = cursor.lastrowid
        return new_id

    @connect_execute_commit_close_db
    def update_subgraph_config(self, subgraph_config, connection, cursor):
        value_list = []
        value_list.append(subgraph_config.get('name'))
        modify_schema_flag = 'entity' in subgraph_config and 'edge' in subgraph_config
        if modify_schema_flag:
            value_list.append(str(subgraph_config.get('entity')))
            value_list.append(str(subgraph_config.get('edge')))
        value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        value_list.append(subgraph_config.get('subgraph_id'))
        sql = '''UPDATE subgraph_config
                SET name=%s, {} update_time=%s 
                WHERE id=%s'''.format('entity=%s, edge=%s,' if modify_schema_flag else '')
        cursor.execute(sql, value_list)

    @connect_execute_close_db
    def get_subgraph_list(self, graph_id, subgraph_name, connection, cursor):
        sql = f'''SELECT id, name, entity, edge FROM `subgraph_config`
                    WHERE graph_id={graph_id} AND name REGEXP "{subgraph_name}" order by create_time desc'''
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_close_db
    def get_graph_id_by_subgraph(self, subgraph_id, connection, cursor):
        sql = f"""SELECT name, graph_id FROM subgraph_config WHERE id = {subgraph_id}"""
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_commit_close_db
    def delete_subgraph_config(self, subgraph_ids, connection, cursor):
        sql = """DELETE FROM subgraph_config WHERE id in ({})""".format(','.join(map(str, subgraph_ids)))
        cursor.execute(sql)
        new_id = cursor.lastrowid
        return new_id

subgraph_dao = SubgraphDao()

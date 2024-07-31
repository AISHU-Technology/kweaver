# -*- coding:utf-8 -*-
import arrow
import rdsdriver
from utils.log_info import Logger
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db


class TaxonomyDao():

    @connect_execute_commit_close_db
    def insert_taxonomy(self, params_json: dict, connection, cursor) -> int:
        values = [params_json['name'],
                  params_json['knw_id'],
                  params_json['default_language'],
                  params_json.get('description'),
                  params_json['db_name'],
                  params_json['userId'],
                  params_json['userId']]
        sql = 'insert into taxonomy(name, knw_id, default_language, description, db_name, create_by, update_by) ' \
              'values (%s, %s, %s, %s, %s, %s, %s)'
        Logger.log_info(sql % tuple(values))
        cursor.execute(sql, values)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_close_db
    def is_id_exist(self, id: int, connection, cursor) -> bool:
        sql = 'select count(*) as `count` from taxonomy where id=%s and deleted=0'
        Logger.log_info(sql)
        cursor.execute(sql, id)
        ret = cursor.fetchall()
        return ret[0]["count"] > 0

    @connect_execute_close_db
    def get_knw_by_id(self, id: int, connection, cursor):
        sql = 'select knw_id from taxonomy where id={} and deleted=0'.format(id)
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_close_db
    def is_name_exist(self, name: str, knw_id: int, taxonomy_id, connection, cursor) -> bool:
        values = (name, knw_id, taxonomy_id)
        sql = 'select count(*) as `count` from taxonomy where name=%s and knw_id=%s and id!=%s and deleted=0'
        Logger.log_info(sql % values)
        cursor.execute(sql, values)
        ret = cursor.fetchall()
        return ret[0]["count"] > 0

    @connect_execute_commit_close_db
    def edit_taxonomy(self, taxonomy_id: int, params_json: dict, connection, cursor):
        values = (params_json['name'],
                  params_json['default_language'],
                  params_json.get('description'),
                  params_json['userId'],
                  taxonomy_id)
        sql = 'UPDATE taxonomy SET ' \
              'name=%s, default_language=%s, description=%s, ' \
              'update_by=%s ' \
              'WHERE id=%s'
        Logger.log_info(sql % values)
        cursor.execute(sql, values)

    @connect_execute_close_db
    def get_taxonomy_list_by_page(self, params_json: dict, connection, cursor):
        '''
        分页获取术语库列表
        Args:
            params_json:
                knw_id
                page
                size
                rule
                order
                name: 可选，搜索术语库名称
                ids: list of string 可选，限定id范围
        '''
        search_condition = ''
        if params_json.get('name'):
            name = '%' + params_json.get('name') + '%'
            search_condition = 'and t.name like %s '
        limited_id_condition = ''
        if 'ids' in params_json:
            if len(params_json['ids']) == 0:
                return []
            limited_id_condition = 'and t.id in ({}) '.format(','.join(params_json['ids']))
        # sql = 'select ' \
        #       't.id, t.name, t.description, t.default_language, t.word_num, ' \
        #       't.create_time as create_time, ' \
        #       't.update_time as update_time, ' \
        #       't.create_by, t.update_by, ' \
        #       'a1.username as create_user_name, ' \
        #       'a2.username as update_user_name ' \
        #       'from ' \
        #       'taxonomy as t ' \
        #       'LEFT JOIN account a1 ON a1.account_id = t.create_by ' \
        #       'LEFT JOIN account a2 ON a2.account_id = t.update_by ' \
        #       'where ' \
        #       f't.knw_id = {params_json["knw_id"]} ' \
        #       'and deleted=0 ' \
        #       f'{search_condition}' \
        #       f'{limited_id_condition}' \
        #       f'order by {params_json["rule"]} {params_json["order"]} ' \
        #       f'limit {(params_json["page"] - 1) * params_json["size"]}, {params_json["size"]}'
        sql = 'select ' \
              't.id, t.name, t.description, t.default_language, t.word_num, ' \
              't.create_time as create_time, ' \
              't.update_time as update_time, ' \
              't.create_by, t.update_by ' \
              'from ' \
              'taxonomy as t ' \
              'where ' \
              f't.knw_id = {params_json["knw_id"]} ' \
              'and deleted=0 ' \
              f'{search_condition}' \
              f'{limited_id_condition}' \
              f'order by {params_json["rule"]} {params_json["order"]} ' \
              f'limit {(params_json["page"] - 1) * params_json["size"]}, {params_json["size"]}'
        if search_condition:
            Logger.log_info(sql % name)
            cursor.execute(sql, name)
        else:
            Logger.log_info(sql)
            cursor.execute(sql, ())
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_taxonomy_list(self, params_json: dict, connection, cursor):
        '''
        获取术语库列表
        Args:
            params_json:
                knw_id
                rule
                order
                name: 可选，搜索术语库名称
                ids: list of string 可选，限定id范围
        '''
        search_condition = ''
        if params_json.get('name'):
            name = '%' + params_json.get('name') + '%'
            search_condition = 'and t.name like %s '
        limited_id_condition = ''
        if 'ids' in params_json:
            if len(params_json['ids']) == 0:
                return []
            limited_id_condition = 'and t.id in ({}) '.format(','.join(params_json['ids']))
        sql = 'select ' \
              't.id, t.name, t.description, t.default_language, t.word_num, ' \
              't.create_time as create_time, ' \
              't.update_time as update_time, ' \
              't.create_by, t.update_by ' \
              'from ' \
              'taxonomy as t ' \
              'where ' \
              f't.knw_id = {params_json["knw_id"]} ' \
              'and deleted=0 ' \
              f'{search_condition}' \
              f'{limited_id_condition}' \
              f'order by {params_json["rule"]} {params_json["order"]} '
        if search_condition:
            Logger.log_info(sql % name)
            cursor.execute(sql, name)
        else:
            Logger.log_info(sql)
            cursor.execute(sql, ())
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_db_names(self, ids: list[int], connection, cursor) -> dict[int, str]:
        if not isinstance(ids, list):
            ids = [ids]
        sql = 'SELECT id, db_name FROM taxonomy WHERE id in ({}) and deleted=0'.format(
            ",".join([str(id) for id in ids]))
        Logger.log_info(sql)
        cursor.execute(sql)
        sql_ret = cursor.fetchall()
        res = {}
        for a_ret in sql_ret:
            res[a_ret['id']] = a_ret['db_name']
        return res

    @connect_execute_commit_close_db
    def delete_taxonomies_logically(self, ids: list[int], connection, cursor):
        sql = 'update taxonomy set deleted=1 WHERE id in ({})'.format(",".join([str(id) for id in ids]))
        Logger.log_info(sql)
        cursor.execute(sql)

    @connect_execute_commit_close_db
    def delete_taxonomies(self, ids: list[int], connection, cursor):
        sql = 'DELETE FROM taxonomy WHERE id in ({})'.format(",".join([str(id) for id in ids]))
        Logger.log_info(sql)
        cursor.execute(sql)
        sql = 'DELETE FROM taxonomy_custom_relation WHERE taxonomy_id in ({})'.format(",".join([str(id) for id in ids]))
        Logger.log_info(sql)
        cursor.execute(sql)

    @connect_execute_commit_close_db
    def update_word_num(self, id: int, word_num: int, userid: str,  connection, cursor):
        sql = "update taxonomy set word_num=%s, update_by=%s where id=%s"
        value_list = [word_num, userid, id]
        Logger.log_info(sql)
        cursor.execute(sql, value_list)

    @connect_execute_close_db
    def get_custom_relation_by_taxonomy_id(self, taxonomy_id: int, connection, cursor) -> dict[int, str]:
        sql = 'SELECT id, name FROM taxonomy_custom_relation WHERE taxonomy_id={}'.format(taxonomy_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_commit_close_db
    def insert_custom_relation(self, name: str, taxonomy_id: int, params_json: dict, connection, cursor):
        values = (name, taxonomy_id,
                  params_json['userId'],
                  params_json['userId'])
        sql = 'insert into taxonomy_custom_relation(name, taxonomy_id, create_by, update_by) values (%s, %s, %s, %s)'
        Logger.log_info(sql % values)
        cursor.execute(sql, values)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_commit_close_db
    def delete_custom_relation(self, custom_relation_id: int, connection, cursor):
        sql = 'delete from taxonomy_custom_relation where id = {}'.format(custom_relation_id)
        Logger.log_info(sql)
        cursor.execute(sql)

    @connect_execute_commit_close_db
    def update_time(self, id: int, userid: str, connection, cursor):
        sql = "update taxonomy set update_time = '{}', update_by = '{}' where id = {}" \
            .format(arrow.now().format('YYYY-MM-DD HH:mm:ss'), userid, id)
        Logger.log_info(sql)
        cursor.execute(sql)

    @connect_execute_close_db
    def get_taxonomy_knowledge_by_id(self, taxonomy_id: int, connection, cursor):
        sql = f'SELECT total_knowledge FROM intelligence_records WHERE resource_id={taxonomy_id} and type=2;'
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_commit_close_db
    def insert_knowledge(self, taxonomy_id: int, knowledge: int, connection, cursor):
        value_list = []
        value_list.append(taxonomy_id)
        value_list.append(knowledge)
        value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        value_list.append(2)
        sql = 'insert into intelligence_records (resource_id, total_knowledge, update_time, type) values (%s, %s, %s, %s)'
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)

    @connect_execute_commit_close_db
    def update_knowledge(self, taxonomy_id: int, total_knowledge: int, connection, cursor):
        update_time = arrow.now().format('YYYY-MM-DD HH:mm:ss')
        sql = f"update intelligence_records set total_knowledge={total_knowledge}, update_time='{update_time}' " \
              f"where resource_id={taxonomy_id} and type=2;"
        Logger.log_info(sql)
        cursor.execute(sql)


taxonomy_dao = TaxonomyDao()

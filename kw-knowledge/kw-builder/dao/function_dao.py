# -*- coding:utf-8 -*-
from utils.my_pymysql_pool import connect_execute_close_db, connect_execute_commit_close_db
import arrow
from utils.log_info import Logger
import rdsdriver


class FunctionDao:
    @connect_execute_commit_close_db
    def insert_function(self, params_json, cursor, connection):
        sql = 'insert into `function` ' \
              '(name, code, description, parameters, create_time, update_time, create_by, ' \
              'update_by, knowledge_network_id, language) ' \
              'values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)'
        # userId = request.headers.get("userId")
        userId = ""
        value_list = [params_json.get('name'),
                      params_json.get('code'),
                      params_json.get('description'),
                      repr(params_json.get('parameters')),
                      arrow.now().format('YYYY-MM-DD HH:mm:ss'),
                      arrow.now().format('YYYY-MM-DD HH:mm:ss'),
                      userId,
                      userId,
                      params_json.get('knw_id'),
                      params_json.get('language')
                      ]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_close_db
    def get_function_by_name_and_knw_id(self, name, knw_id, cursor, connection, **kwargs):
        sql = 'select * from `function` where name=%s and knowledge_network_id=%s '
        values = [name, knw_id]
        if 'function_id' in kwargs:
            sql += 'and id != %s'
            values.append(kwargs.get('function_id'))
        Logger.log_info(sql % tuple(values))
        cursor.execute(sql, values)
        return cursor.fetchone()

    @connect_execute_close_db
    def get_function_by_id(self, function_id, cursor, connection):
        sql = 'select * from `function` where id=%s'
        Logger.log_info(sql)
        cursor.execute(sql, function_id)
        return cursor.fetchone()

    @connect_execute_commit_close_db
    def update_function(self, params_json, cursor, connection):
        sql = 'update `function` set ' \
              'name=%s, code=%s, description=%s, parameters=%s, update_time=%s,' \
              'update_by=%s, knowledge_network_id=%s ' \
              'where id=%s'
        # userId = request.headers.get("userId")
        userId = ""
        value_list = [params_json.get('name'),
                      params_json.get('code'),
                      params_json.get('description'),
                      repr(params_json.get('parameters')),
                      arrow.now().format('YYYY-MM-DD HH:mm:ss'),
                      userId,
                      params_json.get('knw_id'),
                      params_json.get('function_id')
                      ]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)

    @connect_execute_commit_close_db
    def delete_function(self, function_ids, cursor, connection):
        temp = ", ".join(["%s" for i in range(len(function_ids))])
        sql = 'delete from `function` where id in ({})'.format(temp)
        Logger.log_info(sql)
        cursor.execute(sql, function_ids)

    @connect_execute_close_db
    def get_function_list_count(self, params_json, cursor, connection):
        function_ids = params_json['function_ids']
        knw_id = params_json.get('knw_id')
        search = params_json.get('search', None)
        language = params_json.get('language', None)
        values = [knw_id]
        sql = 'select count(*) `count` from `function` f ' \
              'where f.knowledge_network_id=%s '

        if len(function_ids) > 0:
            sql += " and f.id in ({}) ".format(",".join(map(str, function_ids)))
        if search:
            sql += f" and f.name like %s "
            values.append('%' + search + '%')
        if language:
            sql += f" and f.language = '{language}' "
        Logger.log_info(sql % tuple(values))
        cursor.execute(sql, values)
        return cursor.fetchone().get('count')

    @connect_execute_close_db
    def get_function_list(self, params_json, cursor, connection):
        function_ids = params_json['function_ids']
        knw_id = params_json.get('knw_id')
        page = int(params_json.get('page')) - 1
        size = int(params_json.get('size'))
        order_field = params_json.get('order_field') if params_json.get('order_field') else 'update_time'
        order_type = params_json.get('order_type') if params_json.get('order_type') else 'desc'
        search = params_json.get('search', None)
        language = params_json.get('language', None)
        values = [knw_id]
        # sql = 'select f.id, f.name name, f.description, f.create_time, f.update_time, f.knowledge_network_id, ' \
        #       'f.language, a1.username create_by, a2.username update_by from `function` f ' \
        #       'left join account a1 on a1.account_id = f.create_by ' \
        #       'left join account a2 on a2.account_id = f.update_by ' \
        #       'where f.knowledge_network_id=%s '
        sql = 'select f.id, f.name name, f.description, f.create_time, f.update_time, f.knowledge_network_id, ' \
              'f.language, f.create_by, f.update_by from `function` f ' \
              'where f.knowledge_network_id=%s '

        if len(function_ids) > 0:
            sql += " and f.id in ({}) ".format(",".join(map(str, function_ids)))
        if search:
            sql += f" and f.name like %s "
            values.append('%' + search + '%')
        if language:
            sql += f" and f.language = '{language}' "

        sql += f' order by f.{order_field} {order_type} limit {page * size}, {size}'
        Logger.log_info(sql % tuple(values))
        cursor.execute(sql, values)
        return cursor.fetchall()

    @connect_execute_close_db
    def get_function_detail_by_id(self, function_id, cursor, connection):
        # sql = 'select f.id, f.name name, f.description, f.create_time, f.update_time, f.knowledge_network_id, ' \
        #       'f.code, f.parameters, f.language, a1.username create_by, a2.username update_by from `function` f '\
        #       'left join account a1 on a1.account_id = f.create_by ' \
        #       'left join account a2 on a2.account_id = f.update_by ' \
        #       'where f.id=%s '
        sql = 'select f.id, f.name name, f.description, f.create_time, f.update_time, f.knowledge_network_id, ' \
              'f.code, f.parameters, f.language, f.create_by, f.update_by from `function` f ' \
              'where f.id=%s '
        Logger.log_info(sql)
        cursor.execute(sql, function_id)
        return cursor.fetchone()

    @connect_execute_close_db
    def get_function_by_knw(self, knw_ids, connection, cursor):
        knw_ids = [str(knw_id) for knw_id in knw_ids]
        temp = ", ".join(["%s" for i in range(len(knw_ids))])
        sql = ' select id from `function` where knowledge_network_id in ({}); '.format(temp)
        Logger.log_info(sql)
        cursor.execute(sql, knw_ids)
        return cursor.fetchall()


function_dao = FunctionDao()

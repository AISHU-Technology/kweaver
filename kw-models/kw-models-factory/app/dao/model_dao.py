import datetime
from app.utils.my_pymysql_pool import connect_execute_close_db, connect_execute_commit_close_db
from app.utils.stand_log import StandLogger


class ModelDao():
    # 通过模型id获取模型名称
    @connect_execute_close_db
    def get_model_name_by_id(self, model_id, connection, cursor):
        sql = "select f_model_name from t_model_list where f_model_id={}".format(model_id)
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res[0]["f_model_name"]

    @connect_execute_close_db
    def get_model_id_by_name(self, model_name, connection, cursor):
        sql = "select f_model_id from t_model_list where f_model_name=%s"
        StandLogger.info_log(sql % model_name)
        cursor.execute(sql, model_name)
        res = cursor.fetchall()
        return res[0]["f_model_id"]

    @connect_execute_close_db
    def get_model_series_by_id(self, model_id, connection, cursor):
        sql = "select f_model_series from t_model_list where f_model_id={}".format(model_id)
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res[0]["f_model_series"]

    @connect_execute_close_db
    def get_model_by_types(self, types, connection, cursor):
        if types == None or types == "":
            sql = "select f_model,f_model_id,f_model_type,f_model_name,f_model_series,f_model_config from t_model_list"
        else:
            sql = "select f_model,f_model_id,f_model_type,f_model_name,f_model_series,f_model_config from t_model_list where f_model_type='{}'".format(types)
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_model_para_by_model(self, model, model_series, connection, cursor):
        sql = "select f_model_default_para from t_model_default_para_list where f_model='{}'".format(model)
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        if res == () or res == []:
            max_token = 4096 if model_series == 'aishu-baichuan' else 8192
            default = {
                'temperature': [0, 2, 1],
                'top_p': [0, 1, 1],
                'presence_penalty': [-2, 2, 0],
                'frequency_penalty': [-2, 2, 0],
                'max_tokens': [10, max_token, 1000]
            }
            return str(default)
        return res[0]["f_model_default_para"]

    @connect_execute_close_db
    def get_model_model_from_model_list_by_id(self, model_id, connection, cursor):
        sql = "select f_model from t_model_list where f_model_id={}".format(model_id)
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res[0]["f_model"]

    @connect_execute_close_db
    def get_all_model_list(self, connection, cursor):
        sql = """select f_create_by,f_create_time,f_is_delete,f_model,f_model_api,
                       f_model_config,f_model_id,f_model_name,f_model_series,f_model_type,
                       f_model_url,f_update_by,f_update_time from t_model_list"""
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_data_from_model_list_by_id(self, model_id, connection, cursor):
        sql = """select f_create_by,f_create_time,f_is_delete,f_model,f_model_api,f_model_config,f_model_id,
                            f_model_name,f_model_series,f_model_type,f_model_url,f_update_by,f_update_time 
                            from t_model_list where f_model_id='{}'""".format(model_id)
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def add_data_into_model_list(self, model_id, model_series, model_type, model_name, model, model_url, create_by,
                                 update_by, model_config, connection, cursor):
        sql = """insert into t_model_list(f_model_id,f_model_series,f_model_type,f_model_name,f_model,
                            f_model_url,f_create_by,f_update_by,f_model_config,f_update_time,f_create_time) values(
                            '{}','{}','{}','{}','{}','{}','{}','{}','{}','{}',
                            '{}')""".format(model_id, model_series, model_type, model_name, model, model_url, create_by,
                                            update_by, model_config, datetime.datetime.today(),
                                            datetime.datetime.today())
        StandLogger.info_log(sql)
        cursor.execute(sql)

    @connect_execute_commit_close_db
    def change_model_delete_status(self, model_id, connection, cursor):
        sql = """update t_model_list set f_is_delete=1 where f_model_id='{}'""".format(model_id)
        StandLogger.info_log(sql)
        cursor.execute(sql)

    @connect_execute_commit_close_db
    def rename_model(self, model_id, re_name, userId, connection, cursor):
        sql = """update t_model_list set f_model_name='{}',f_update_time='{}',f_update_by='{}' where 
                            f_model_id='{}'""".format(re_name, datetime.datetime.today(), userId, model_id)
        StandLogger.info_log(sql)
        cursor.execute(sql)

    @connect_execute_close_db
    def get_data_from_model_list_by_name_fuzzy(self, name, page, size, order, rule, connection, cursor):
        sql = """select f_create_by,f_create_time,f_is_delete,f_model,f_model_api,f_model_config,f_model_id,
                            f_model_name,f_model_series,f_model_type,f_model_url,f_update_by,f_update_time from 
                            t_model_list where f_is_delete=0 and f_model_name like '%{}%'""".format(name)
        if rule != "":
            sql += " order by f_" + rule
        if order == "desc":
            sql += " desc"
        sql += " limit {},{}".format(str(int(page) - 1), str(size))
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_data_from_model_list_by_name_fuzzy_and_series(self, name, series, page, size, order, rule,
                                                          connection, cursor):
        sql = """select f_create_by,f_create_time,f_is_delete,f_model,f_model_api,f_model_config,f_model_id,
                                    f_model_name,f_model_series,f_model_type,f_model_url,f_update_by,f_update_time from 
                                    t_model_list where f_is_delete=0 and f_model_series='{}' 
                                    and f_model_name like '%{}%'""".format(series, name)
        if rule != "":
            sql += " order by f_" + rule
        if order == "desc":
            sql += " desc"
        sql += " limit {},{}".format(str(int(page) - 1), str(size))
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_all_data_from_model_series(self, connection, cursor):
        sql = """select f_model_icon,f_model_param_id,f_model_series_desc_cn,f_model_series_desc_us,
                            f_model_series_id,f_model_series_name_cn,f_model_series_name_us from t_model_series"""
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_all_data_from_model_param(self, connection, cursor):
        sql = """select f_box_component,f_box_lab_cn,f_box_lab_us,f_box_mark_cn,f_box_mark_us,f_max,
                            f_max_mes_cn,f_max_mes_us,f_param_field,f_param_id,f_param_type,f_pat_mes_cn,f_pat_mes_us,
                            f_pattern,f_req,f_req_mes_cn,f_req_mes_us from t_model_param"""
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_data_from_model_param_by_param_id(self, param_id, connection, cursor):
        sql = """select f_box_component,f_box_lab_cn,f_box_lab_us,f_box_mark_cn,f_box_mark_us,f_max,
                            f_max_mes_cn,f_max_mes_us,f_param_field,f_param_id,f_param_type,f_pat_mes_cn,f_pat_mes_us,
                            f_pattern,f_req,f_req_mes_cn,f_req_mes_us from t_model_param 
                            where f_param_id='{}'""".format(param_id)
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_model_default_para_by_model(self, model, connection, cursor):
        sql = """select f_model,f_model_default_para from t_model_default_para_list 
                            where f_model='{}'""".format(model)
        StandLogger.info_log(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_model_by_name(self, model_name, connection, cursor):
        sql = """select f_model_id from t_model_list where f_model_name=%s;"""
        StandLogger.info_log(sql)
        cursor.execute(sql, model_name)
        res = cursor.fetchall()
        return res

model_dao = ModelDao()


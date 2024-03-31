
from utils.my_pymysql_pool import connect_execute_close_db, connect_execute_commit_close_db
from utils.log_info import Logger
import rdsdriver


class AsyncTaskDao(object):

    @connect_execute_commit_close_db
    def insert_record(self, params_json, cursor, connection):
        """
        cancel,是否取消前一个任务， 默认不取消
        """
        Logger.log_info("save intelligence records:{}".format(repr(params_json)))
        value_list = list()
        value_list.append(params_json.get('task_type'))
        value_list.append(params_json.get('task_status'))
        value_list.append(params_json.get('task_name'))
        value_list.append(params_json.get('celery_task_id', ''))
        value_list.append(params_json.get('relation_id'))
        value_list.append(params_json.get('task_params'))
        value_list.append(params_json.get('created_time'))

        sql = """
                INSERT INTO async_tasks 
                    (task_type, task_status, task_name, celery_task_id, relation_id, task_params, created_time)   
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s)
                      """
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_commit_close_db
    def delete(self, param_json, cursor, connection):
        """
        接受多种形式的删除
        """
        sql = "delete from async_tasks"
        condition = self.parse_condition(param_json)
        if len(condition) == 0:
            return None
        sql = sql + " where " + 'and'.join(condition)
        Logger.log_info(sql)
        cursor.execute(sql)

    @connect_execute_close_db
    def query_latest_task(self, relation_id_list, cursor, connection):
        if not relation_id_list or not isinstance(relation_id_list, list):
            return list()
        id_list = [str(v) for v in relation_id_list]

        sql = """select a.* from async_tasks a join 
                        (select relation_id , MAX(created_time) created_time from async_tasks 
                        where task_type=%s and relation_id in ({}) GROUP by relation_id) b
                        on a.relation_id  =  b.relation_id and a.created_time = b.created_time;"""

        sql = sql.format(','.join(id_list))
        Logger.log_info(sql % "intelligence")
        cursor.execute(sql, "intelligence")
        return cursor.fetchall()

    @connect_execute_close_db
    def query(self, query_json, cursor, connection):
        """
        支持多种参数的查询, 查询任务状态
        """
        if not isinstance(query_json, dict):
            # TODO
            return None
        sql = "select * from async_tasks"

        condition = self.parse_condition(query_json)
        if len(condition) > 0:
            sql = sql + " where " + 'and'.join(condition)

        cursor.execute(sql)
        Logger.log_info(sql)
        return cursor.fetchall()

    @connect_execute_commit_close_db
    def update(self, task_id, param_json, cursor, connection):
        # check last task_status
        sql = f""" select id from async_tasks where id={task_id} and task_status in ('failed','finished','canceled')"""
        Logger.log_info(sql)
        cursor.execute(sql)
        data = cursor.fetchone()
        if data:
            if "celery_task_id" in param_json:
                param_json = {"celery_task_id": param_json["celery_task_id"]}
            else:
                Logger.log_info(f"task {task_id} status not allowed change")
                return

        condition = self.parse_condition(param_json)
        if len(condition) <= 0:
            Logger.log_info("empty condition:{}".format(repr(param_json)))
            return

        insert_res = " ,result=%s " if param_json.get('result') else ""
        sql = "update async_tasks set {} {} where id={}".format(",".join(condition), insert_res, task_id)
        if insert_res:
            Logger.log_info(sql % param_json.get('result'))
            result = cursor.execute(sql, param_json.get('result'))
        else:
            Logger.log_info(sql)
            result = cursor.execute(sql)
        Logger.log_info(repr(result))

    @connect_execute_commit_close_db
    def inite_async_tasks(self, cursor, connection):
        sql = """update async_tasks set task_status='failed', result='Service exception, please try again'
                 where task_status='running' ;"""
        Logger.log_info(sql)
        cursor.execute(sql)

    @classmethod
    def parse_condition(cls, query_json):
        condition = list()

        if query_json.get('id'):
            condition.append(" id={} ".format(query_json.get('id')))
        if query_json.get('task_type'):
            condition.append(" task_type='{}' ".format(query_json.get('task_type')))
        if query_json.get('task_status'):
            task_status = query_json.get('task_status')
            if isinstance(task_status, list):
                condition.append(" task_status in ('{}') ".format('","'.join(task_status)))
            else:
                condition.append(" task_status='{}' ".format(task_status))
        if query_json.get('task_name'):
            condition.append(" task_name='{}' ".format(query_json.get('task_name')))
        if query_json.get('celery_task_id'):
            condition.append(" celery_task_id='{}' ".format(query_json.get('celery_task_id')))
        if query_json.get('relation_id'):
            condition.append(" relation_id='{}' ".format(query_json.get('relation_id')))
        if query_json.get('finished_time'):
            condition.append(" finished_time='{}'".format(query_json.get('finished_time')))
        return condition


async_task_dao = AsyncTaskDao()

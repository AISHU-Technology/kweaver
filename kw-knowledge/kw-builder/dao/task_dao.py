# -*-coding:utf-8-*-
# @Time    : 2020/11/2 13:54
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from utils.my_pymysql_pool import connect_execute_commit_close_db, connect_execute_close_db
import arrow
import pandas as pd
import datetime
import sys
import traceback
import rdsdriver
from utils.log_info import Logger
import common.stand_log as log_oper
import json
from utils.ConnectUtil import redisConnect
from common.errorcode import codes
from dao.graphdb_dao import GraphDB

class TaskDao(object):
    # 初始化redis

    # 初始化redis中graph_count
    def init_graph_count(self):
        try:
            db = "0"
            r = redisConnect.connect_redis(db, model="read")
            # 刚启动时，没有redis还没有graph_count，初始化为0
            if r.get(b"graph_count"):
                count = {"entities": 0, "edges": 0, "pro": 0, "all": 0}
                r.set("graph_count", json.dumps(count))
        except Exception as e:
            err = repr(e)
            Logger.log_info("init_graph_count error: {}".format(err))

    def initredis(self):
        try:
            # pool = redis.ConnectionPool(host=celeryconfig.redis_add, port=celeryconfig.redis_port, db=2)
            r = redisConnect.connect_redis(db=2, model="read")
            w = redisConnect.connect_redis(db=2, model="write")
            res = task_dao.getCount()
            # 获得任务列表中的所有task_id
            res_taskid_list = []
            for task in res:
                res_taskid_list.append(task["task_id"])
            for taskid in res_taskid_list:
                key = "celery-task-meta-" + taskid
                data = r.get(key)
                if data == None:
                    continue
                data = data.decode("utf-8")
                redisdata = json.loads(data)
                status = redisdata["status"]
                task_id = redisdata["task_id"]
                k_v = "celery-task-meta-" + task_id
                from datetime import datetime
                utc_time = datetime.utcnow().isoformat()
                va = {
                    "status": "REVOKED",
                    "result": {
                        "current": "builder server restart and stop task"
                    },
                    "traceback": "null",
                    "children": [],
                    "date_done": utc_time,
                    "task_id": task_id
                }
                status_diy = ["PENDING", "RUNNING"]
                if status in status_diy:
                    w.set(k_v, json.dumps(va).encode())
        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log("initredis error: {}".format(err), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)

    # 遍历redis 获得任务的信息，供定时刷新用
    def gettaskall(self, df_taskid_list):
        try:
            r = redisConnect.connect_redis(model="read", db=2)
            # keys = r.keys()

            task_id = []
            status = []
            date_done_list = []
            result = []
            all_res = []
            # for i in keys:
            #     key = i.decode("utf-8")
            #     taskid_key = key.split("celery-task-meta-")
            if len(df_taskid_list) != 0:
                for taskid in df_taskid_list:
                    key = "celery-task-meta-" + str(taskid)
                    data = r.get(key)
                    if data != None:
                        data = data.decode("utf-8")
                        redisdata = json.loads(data)
                        task_id.append(redisdata["task_id"])
                        status.append(redisdata["status"])
                        date_done = redisdata["date_done"]
                        if date_done is None or date_done == "null":
                            end_time = "None"
                        else:
                            date_done = date_done.split(".")[0]
                            UTC_FORMAT = "%Y-%m-%dT%H:%M:%S"
                            utcTime = datetime.datetime.strptime(date_done, UTC_FORMAT)
                            end_time = utcTime + datetime.timedelta(hours=8)
                        date_done_list.append(str(end_time))
                        redisdata["date_done"] = str(end_time)
                        result.append(redisdata["result"])
                        all_res.append(redisdata)

            df = pd.DataFrame({"task_id": task_id, "status": status, "date_done": date_done_list,
                               "result": result, "all_res": all_res})
            return "200", df
        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log("gettaskall error: {}".format(err), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
            if "No route to host" in err:
                return "400", "No route to host!"
            elif "service not known" in err:
                return "400", "service not known!"
            elif "DB index is out of range" in err:
                return "400", "DB index is out of range!"
            else:
                return "400", str(err) + "1"

    def getredisbytaskid(self, taskid):
        try:
            r = redisConnect.connect_redis(db=2, model="read")
            key = "celery-task-meta-" + str(taskid)
            data = r.get(key)
            if data:
                data = data.decode("utf-8")
                data = json.loads(data)
            
            return data
        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log("getredisbytaskid error: {}".format(err), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
            
            if "No route to host" in err:
                return "400", "No route to host!"
            elif "service not known" in err:
                return "400", "service not known!"
            elif "DB index is out of range" in err:
                return "400", "DB index is out of range!"
            else:
                return "400", str(err) + "3"

    # 获取根据状态
    @connect_execute_close_db
    def getCountbystatus(self, task_status, graph_name, connection, cursor, ):
        sql = """SELECT * FROM graph_task_table where task_status=%s;"""
        Logger.log_info(sql)
        cursor.execute(sql, task_status)
        res = cursor.fetchall()
        return len(res)

    # 根据状态排序
    @connect_execute_close_db
    def getallbystatus(self, task_status, page, size, order, connection, cursor):
        sql = """
                   SELECT * FROM graph_task_table where task_status=%s order by create_time Desc limit %s, %s;
                   """
        if order == "descend":
            sql = """
              SELECT * FROM graph_task_table where task_status=%s order by create_time  asc limit %s, %s;

                    """
        value_list = [task_status, page * size, size]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res

    # 根据任务id 获得任务
    @connect_execute_close_db
    def getbystatusid(self, id, connection, cursor, ):
        sql = """SELECT * FROM graph_task_table where task_id = %s"""
        Logger.log_info(sql)
        cursor.execute(sql, id)
        res = cursor.fetchall()
        return res

    # 根据celery任务id 获得任务数据
    @connect_execute_close_db
    def get_history_task_by_task_id(self, task_id, connection, cursor, ):
        sql = """SELECT * FROM graph_task_history_table where task_id = %s;"""
        Logger.log_info(sql % task_id)
        cursor.execute(sql, task_id)
        res = cursor.fetchall()
        return res

    # 根据图谱id 获得图谱数量
    @connect_execute_close_db
    def getgraphcountbyid(self, graph_id, connection, cursor):
        sql = """SELECT id FROM graph_config_table where id = %s""" % (graph_id)
        # sql = """SELECT id FROM graph_task_table where graph_id = %s""" % (graph_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getgraphnamebyid(self, graph_id, connection, cursor):
        sql = """SELECT graph_name FROM graph_config_table where id = %s""" % (graph_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def gettaskbyid(self, id, connection, cursor):
        # 根据图谱id获得历史数据
        # sql = """
        # SELECT
        #     a1.username AS create_user_name,
        #     h.*
        # FROM
        #     graph_task_table AS h
        #     LEFT JOIN account a1 ON a1.account_id=h.create_user
        # where
        #     h.graph_id = %s""" % (id)
        sql = """
        SELECT
            h.*
        FROM
            graph_task_table AS h
        where
            h.graph_id = %s""" % (id)
        # sql = sql.format()
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def gethistortbytime(self, task_id, endtime, connection, cursor, ):
        sql = """SELECT id FROM graph_task_history_table where task_id = %s and end_time = %s """
        value_list = [task_id, endtime]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def gettaskupdata(self, task_id, task_status, connection, cursor, ):
        sql = """SELECT id FROM graph_task_history_table where task_id=%s and task_status=%s;"""
        value_list = [task_id, task_status]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        res = cursor.fetchall()
        return res

    # 删除任务列表
    @connect_execute_commit_close_db
    def deletetask(self, task_id, graph_id, connection, cursor):
        if task_id:
            limit_str = f"task_id= '{task_id}' and graph_id={graph_id}"
        else:
            limit_str = f"graph_id={graph_id}"
        sql = f"""DELETE FROM graph_task_table WHERE {limit_str}"""
        Logger.log_info(sql)
        cursor.execute(sql)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_commit_close_db
    def deletehistorytask(self, task_ids, graph_id, connection, cursor):
        task_ids = ','.join(map(str, task_ids))
        sql = 'DELETE FROM graph_task_history_table where parent in ' \
              '(select task_id from graph_task_history_table where id in ({}))'.format(task_ids)
        Logger.log_info(sql)
        cursor.execute(sql)
        sql = f"""DELETE FROM graph_task_history_table WHERE id in ({task_ids}) and graph_id={graph_id}"""
        Logger.log_info(sql)
        cursor.execute(sql)
            

    # 根据图谱id 获得图谱数据库信息
    @connect_execute_close_db
    def geKGDBbyid(self, graph_id, connection, cursor):
        from service.graph_Service import graph_Service
        ret_code, obj = graph_Service.getGraphById(graph_id, "")
        return obj["res"]

    def getotlnum(self, graph_otl):
        '''
        获取本体数量信息
        Args:
            graph_otl: 本体信息，结构：[{"entity": [...], "edge": [...]}]

        Returns:
             resdict:
                entitynums: 实体类数量
                edgenums: 关系类数量
                propertynums: [实体类属性数量, 关系类属性数量]
        '''
        graph_otl = graph_otl[0]
        resdict = {}
        resdict["propertynums"] = []
        entitypronum = 0
        edgepronum = 0
        # resdict["edgepropertynums"] = 0
        # 遍历每条 dict
        for key in graph_otl:
            value = graph_otl[key]
            if key == "entity":
                # value = eval(value)
                entitynums = len(value)
                resdict["entitynums"] = entitynums
                if entitynums == 0:
                    entitypronum = 0 + entitypronum
                else:
                    # 遍历属性dict
                    for property in value:
                        for property_key in property:
                            if property_key == "properties":
                                p_v = property[property_key]
                                # property_value = eval(property[property_key])
                                propertynums = len(p_v)
                                entitypronum = propertynums + entitypronum

            if key == "edge":
                edgenums = len(value)
                resdict["edgenums"] = len(value)
                # value = eval(value)
                if edgenums == 0:
                    edgepronum = 0 + edgepronum
                else:
                    # 遍历属性dict
                    for property in value:
                        for property_key in property:
                            if property_key == "properties":
                                p_v = property[property_key]
                                # property_value = eval(property[property_key])
                                propertynums = len(p_v)
                                edgepronum = propertynums + edgepronum
            resdict["propertynums"] = [entitypronum, edgepronum]
        return resdict

    # 更新总任务记录
    @connect_execute_commit_close_db
    def update_history(self, graph_id, task_data, connection, cursor):
        '''
        更新任务历史记录
        Args:
            graph_id: 图谱id
            task_data:
                end_time
                error_report
                task_id: celery_task_id
        '''
        values_list = []
        values_list.append(task_data["end_time"])
        # 实体数量
        # 图谱数量
        res = self.geKGDBbyid(graph_id)
        graph_baseInfo = res["graph_baseInfo"]
        mongo_db = graph_baseInfo["graph_DBName"]  # 图数据库名也是MongoDB数据库名
        graphdb = GraphDB()
        code, countres = graphdb.count(mongo_db)
        edges, entities = 0, 0
        if code == codes.successCode:
            edges, entities, name2count, _, _, edge2pros, entity2pros = countres
        g_e_count = edges
        g_v_count = entities
        values_list.append(g_e_count)
        values_list.append(g_v_count)
        # Logger.log_info(str(task_data["error_report"]))
        values_list.append(str(task_data["error_report"]))
        values_list.append(task_data["task_id"])
        # Logger.log_info(values_list)
        sql = 'UPDATE graph_task_history_table SET end_time=%s,' \
              'graph_edge=%s,graph_entity=%s,error_report=%s  where task_id = %s'
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
            

    @connect_execute_commit_close_db
    def update_waiting_tasks_knowledge(self, graph_id, task_data, connection, cursor):
        '''update the knowledge number of waiting tasks of graph_task_history_table
        Args:
            graph_id: graph id
            task_data: a dictionary whose required keys are end_time and error_report
                end_time
                error_report
                task_status
        '''
        values_list = []
        values_list.append(task_data["end_time"])
        # 实体数量
        # 图谱数量
        res = self.geKGDBbyid(graph_id)
        graph_baseInfo = res["graph_baseInfo"]
        mongo_db = graph_baseInfo["graph_DBName"]  # 图数据库名也是MongoDB数据库名
        graphdb = GraphDB()
        code, countres = graphdb.count(mongo_db)
        edges, entities = 0, 0
        if code == codes.successCode:
            edges, entities, name2count, _, _, edge2pros, entity2pros = countres
        g_e_count = edges
        g_v_count = entities
        values_list.append(g_e_count)
        values_list.append(g_v_count)
        Logger.log_info(str(task_data["error_report"]))
        values_list.append(str(task_data["error_report"]))
        values_list.append(graph_id)
        Logger.log_info(values_list)
        sql = """UPDATE graph_task_history_table 
                SET end_time=%s, graph_edge=%s, graph_entity=%s, error_report=%s  
                where graph_id=%s and task_status='waiting'"""
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        Logger.log_info(
            "graph_id: {}, {} task_dao.inserthistory after id is {}".format(graph_id, task_data["task_status"], new_id))
        return new_id

    # 获得所有的任务列表
    @connect_execute_close_db
    def getCount(self, connection, cursor, ):
        sql = """
                SELECT * FROM graph_task_table;
                """
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_unfinished_task(self, connection, cursor):
        '''get information of unfinished task'''
        sql = '''SELECT * FROM graph_task_table where task_status in ('waiting', 'running')'''
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def getnumbysn(self, status, graph_name, graph_id, task_type, trigger_type, connection, cursor, ):
        values = []
        sql = f"""SELECT id FROM graph_task_history_table where graph_id=%s and parent is NULL"""
        values.append(graph_id)
        if status != "all":
            sql += f" and task_status=%s"
            values.append(status)
        if task_type != "all":
            sql += f" and task_type=%s"
            values.append(task_type)
        if trigger_type != "all":
            sql += f" and trigger_type=%s"
            values.append(trigger_type)
        sql += f" and graph_name like %s"
        values.append('%' + graph_name + '%')
        Logger.log_info(sql % tuple(values))
        cursor.execute(sql, values)
        res = cursor.fetchall()
            
        return len(res)

    @connect_execute_close_db
    def getallbysn(self, page, size, order, rule, status, graph_name, graph_id, task_type, trigger_type, connection,
                   cursor, ):
        limit_str = ""
        values = []
        values.append(graph_id)
        if status != "all":
            limit_str += f" and task_his.task_status=%s"
            values.append(status)
        if task_type != "all":
            limit_str += f" and task_his.task_type=%s"
            values.append(task_type)
        if trigger_type != "all":
            limit_str += f" and task_his.trigger_type=%s"
            values.append(trigger_type)
        limit_str += f" and task_his.graph_name like %s"
        values.append('%' + graph_name + '%')
        sql = f"""
            SELECT
              task_his.*,
              kg.id as kg_id
--                   a.username as create_user_name
            FROM
              graph_task_history_table task_his
              left join graph_config_table kg on kg.id = task_his.graph_id
--                   left join account a on a.account_id = task_his.create_user
            where
              graph_id = %s 
              and parent is null
              {limit_str}
            order by
              IF(ISNULL({rule}), 1, 0) {order}, {rule} {order}
            limit %s, %s"""
        values.append(page * size)
        values.append(size)
        Logger.log_info(sql % tuple(values))
        cursor.execute(sql, values)
        res = cursor.fetchall()
            
        return res

    # 获得正在运行的任务
    @connect_execute_close_db
    def getRunByid(self, graph_id, connection, cursor, ):
        sql = """SELECT * FROM graph_task_table where (task_status='running' OR  task_status='waiting') and graph_id=%s"""
        Logger.log_info(sql % graph_id)
        cursor.execute(sql, graph_id)
        res = cursor.fetchall()
            
        return res



    # 根据名字获取所有的任务
    @connect_execute_close_db
    def getdatabyname(self, graph_name, connection, cursor, ):
        sql = """
                SELECT * FROM graph_task_table WHERE graph_name like %s;
                 """
        name = "%" + graph_name + "%"
        Logger.log_info(sql % name)
        cursor.execute(sql, name)
        res = cursor.fetchall()
        return res

    @connect_execute_commit_close_db
    def updatestaskgname(self, graph_id, graph_name, connection, cursor):
        sql = """UPDATE graph_task_table SET graph_name=%s WHERE graph_id=%s;"""
        value_list = [graph_name, graph_id]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        # 刷新任务总表
        sql = """UPDATE graph_task_history_table SET graph_name=%s WHERE graph_id=%s"""
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
            
        return new_id

    @connect_execute_commit_close_db
    def updatehistorygname(self, graph_id, graph_name, connection, cursor):
        sql = """UPDATE graph_task_history_table SET graph_name=%s WHERE graph_id=%s;"""
        value_list = [graph_name, graph_id]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
            
        return new_id

    @connect_execute_commit_close_db
    def upKgstatus(self, graph_id, status, connection, cursor):
        sql = """UPDATE graph_config_table SET status=%s WHERE id=%s;"""
        value_list = [status, str(graph_id)]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
            
        return new_id

    # 更新状态
    @connect_execute_commit_close_db
    def updatestatusbyid(self, status, error_report, task_id, connection, cursor):
        values_list = []
        values_list.append(status)
        error_report = str(error_report)
        # error_report = error_report.replace('"', "'")
        values_list.append(error_report)
        values_list.append(str(task_id))
        sql = """UPDATE graph_task_table SET task_status=%s,error_report=%s  where task_id = %s"""
        sql_his = """UPDATE graph_task_history_table SET task_status=%s,error_report=%s  where task_id = %s"""
        if error_report == "":
            sql = """UPDATE graph_task_table SET task_status=%s  where task_id = %s"""
            sql_his = """UPDATE graph_task_history_table SET task_status=%s  where task_id = %s"""
            values_list = [status, str(task_id)]
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        # 更新任务总表
        Logger.log_info(sql_his % tuple(values_list))
        cursor.execute(sql_his, values_list)
        return new_id

    @connect_execute_commit_close_db
    def updatestatusse(self, status, row, connection, cursor):
        task_id = row["task_id"]
        error_report = row["error_report"]
        values_list = []
        values_list.append(status)
        values_list.append(str(error_report))
        values_list.append(str(task_id))

        sql = """UPDATE graph_task_table SET task_status=%s, error_report=%s where task_id = %s;"""
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        new_id = rdsdriver.process_last_row_id(cursor.lastrowid)

        sql = """UPDATE graph_task_history_table SET task_status=%s, error_report=%s where task_id = %s;"""
        Logger.log_info(sql % tuple(values_list))
        cursor.execute(sql, values_list)
        return new_id

    @connect_execute_close_db
    def getgraphrun(self, page, size, order, connection, cursor):
        sql_run = """SELECT * FROM graph_task_table where task_status='running' order by create_time Desc limit {0}, {1};"""
        if order == "descend":
            sql_run = """SELECT * FROM graph_task_table where task_status='running' order by create_time asc limit {0}, {1} ;"""
        sql_run = sql_run.format(page * size, size)
        Logger.log_info(sql_run)
        cursor.execute(sql_run)
        res = cursor.fetchall()
        return res

    # 递归 判断上一个第几页数据小于size
    def fac(self, page, size, order):
        res_run = self.getgraphrun(page, size, order)
        if len(res_run) < size and len(res_run) > 0:
            return len(res_run), page
        return self.fac(page - 1, size, order)

    # 获取所有数据（已修改，可能存在潜在BUG）
    @connect_execute_close_db
    def getall(self, page, size, order, connection, cursor):
        # num , p = self.fac( page, size, order)
        # 第一排序运行中
        sql_run = """SELECT * FROM graph_task_table where task_status='running'  order by create_time Desc limit {0}, {1};"""
        if order == "descend":
            sql_run = """SELECT * FROM graph_task_table where task_status='running'  order by create_time asc limit {0}, {1} ;"""
        sql_run = sql_run.format(page * size, size)
        Logger.log_info(sql_run)
        cursor.execute(sql_run)
        res_run = cursor.fetchall()
        res_run_len = len(res_run)

        # 第二排序等待中
        if res_run_len < size:
            if page > 0:
                page = page - 1
            sql_wait = """ SELECT * FROM graph_task_table where task_status!='running' and task_status='waiting' order by create_time Desc limit {0}, {1}; """
            if order == "descend":
                sql_wait = """SELECT * FROM graph_task_table where task_status!='running' and task_status='waiting' order by create_time asc limit {0}, {1}; """
            sql_wait = sql_wait.format(page * size, size)

            Logger.log_info(sql_wait)
            cursor.execute(sql_wait)
            res_wait = cursor.fetchall()
            all_res = res_run.append(res_wait[:size - res_run_len])

            all_res_len = len(all_res)

            # 第三排序 其他状态
            if all_res_len < size:
                if page > 0:
                    page = page - 1
                sql = """ SELECT * FROM graph_task_table where task_status!='running' and task_status!='waiting' order by create_time Desc limit {0}, {1}; """
                if order == "descend":
                    sql = """SELECT * FROM graph_task_table where task_status!='running' and task_status!='waiting' order by create_time asc limit {0}, {1}; """
                sql = sql.format(page * size, size)

                Logger.log_info(sql)
                cursor.execute(sql)
                res = cursor.fetchall()
                end_res = all_res.append(res[:size - all_res_len])

                return end_res
            return all_res
        return res_run

    # 根据图谱id和定时任务id 获得图谱数量
    @connect_execute_close_db
    def get_timer_by_id(self, task_id, graph_id, connection, cursor):
        sql = f"SELECT graph_id,task_id,cycle,date_time,date_list,enabled,crontab_id,task_type FROM timer_task where task_id = '{task_id}' and graph_id={graph_id}"
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
            
        return res

    @connect_execute_close_db
    def get_graph_conf_list_by_configs(self, configIds, connection, cursor):
        sql = """select * from(
                    select * from (
                            select gct.id as kg_id, graph_name as kg_name, status, gct.update_time
                            from graph_config_table gct
                            LEFT JOIN graph_task_table gtt on gct.id = gtt.graph_id 
                    ) as t1 
                where t1.KG_id in (
                        select kg_id 
                        from search_config 
                        where kg_id in ({0})
                        group by kg_id
                    )
            )  as t2 
            ORDER BY update_time DESC, graph_name"""
        sql = sql.format(",".join(map(str, configIds)))
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
            
        return res

    # 更新nebula顶点和边数量
    @connect_execute_commit_close_db
    def update_nebula_count(self, graph_ids, connection, cursor):
        new_id = None
        for graph_id in graph_ids:
            values_list = []
            res = self.geKGDBbyid(graph_id)
            graph_baseInfo = res["graph_baseInfo"]
            mongo_db = graph_baseInfo["graph_DBName"]  # 图数据库名也是MongoDB数据库名
            graphdb = GraphDB()
            code, countres = graphdb.count(mongo_db)
            edges, entities = 0, 0
            if code == codes.successCode:
                edges, entities, name2count, _, _, edge2pros, entity2pros = countres
            g_e_count = edges
            g_v_count = entities
            values_list.append(g_e_count)
            values_list.append(g_v_count)
            sql = f"""update graph_task_history_table set count_status=true,graph_edge=%s,graph_entity=%s where task_id 
                     in (select task_id from graph_task_table where graph_id = {graph_id})"""
            Logger.log_info(sql % tuple(values_list))
            cursor.execute(sql, values_list)
            new_id = rdsdriver.process_last_row_id(cursor.lastrowid)
        return new_id

    @connect_execute_close_db
    def check_task_status(self, graph_id, task_status, connection, cursor):
        """
        根据传入的id，状态，任务类型，判断当前任务是否正在运行。
        :param graph_id: 图谱配置id
        :param task_status: 任务状态
        :return: True 正常，False 不正常
        """
        sql = """select gt.task_status,gc.step_num from graph_config_table gc left join graph_task_table gt on gt.graph_id=gc.id
                where gc.id = {0} """.format(graph_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        res = res[0]

        if res['task_status'] != 'normal' or res['step_num'] < 4:
            return True
        else:
            return False

    @connect_execute_commit_close_db
    def initiate_graph_task(self, params, connection, cursor):
        from dao.subgraph_dao import subgraph_dao
        from dao.graph_dao import graph_dao
        from dao.otl_dao import otl_dao
        graph_id = params.get('graph_id')
        # initiate graph_task_table
        # user_id = request.headers.get("userId")
        user_id = ""
        value_list = []
        value_list.append(params.get('graph_id'))
        value_list.append(params.get('graph_name'))
        value_list.append('waiting')
        value_list.append(arrow.now().format('YYYY-MM-DD HH:mm:ss'))
        value_list.append(params.get('task_type', 'full'))
        value_list.append(params.get('trigger_type', 0))
        value_list.append(str(params.get('subgraph_ids', [0])))
        value_list.append(params.get('subgraph_ids', [0])[0])
        value_list.append(params.get('write_mode', 'skip'))
        value_list.append(user_id)
        timestamp = params.get('timestamp', "NULL")
        if timestamp == "NULL":
            sql = f'''INSERT INTO graph_task_table
                        (graph_id, graph_name, task_status, create_time, task_type, trigger_type, subgraph_ids, 
                        current_subgraph_id, write_mode, create_user, `timestamp`)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NULL)'''
        else:
            sql = f'''INSERT INTO graph_task_table
                        (graph_id, graph_name, task_status, create_time, task_type, trigger_type, subgraph_ids, 
                        current_subgraph_id, write_mode, create_user, `timestamp`)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)'''
            value_list.append(timestamp)
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)

        # initiate graph_task_history_table
        values = []
        values_placeholder = []
        for subgraph_id in params.get('subgraph_ids', [0]):
            value = []
            value.append(params.get('graph_id'))
            value.append(params.get('graph_name'))
            value.append('waiting')
            value.append(params.get('task_type', 'full'))
            value.append(str(params.get('trigger_type', 0)))
            value.append(str(subgraph_id))
            if subgraph_id != 0:
                task_name = subgraph_dao.get_subgraph_config_by_id(subgraph_id)[0]['name']
                subgraph = subgraph_dao.get_subgraph_config_by_id(subgraph_id)[0]
            else:
                task_name = params.get('graph_name')
                ontology_id = graph_dao.getbyid(graph_id)[0]['graph_otl']
                subgraph = otl_dao.getbyid(ontology_id)[0]
            value.append(task_name)
            value.append(subgraph['entity'])
            value.append(subgraph['edge'])
            value.append(user_id)
            numbers = self.getotlnum(
                [{'entity': eval(subgraph['entity']), 'edge': eval(subgraph['edge'])}]
            )
            value.append(numbers['entitynums'])
            value.append(numbers['edgenums'])
            value.append(numbers['propertynums'][0])
            value.append(numbers['propertynums'][1])
            values_placeholder.append('(' + ','.join(['%s'] * len(value)) + ')')
            values.extend(value)
        values_placeholder = ','.join(values_placeholder)
        sql = '''INSERT INTO graph_task_history_table
                    (graph_id, graph_name, task_status, task_type, trigger_type, subgraph_id, task_name, entity,
                     edge, create_user, entity_num, edge_num, entity_pro_num, edge_pro_num)
                    VALUES {}'''.format(values_placeholder)
        Logger.log_info(sql % tuple(values))
        cursor.execute(sql, values)

        # update graph status
        self.upKgstatus(graph_id, 'waiting')
            


    @connect_execute_commit_close_db
    def update_task_id(self, graph_id, subgraph_id, task_id, connection, cursor):
        sql = '''UPDATE graph_task_table set task_id=%s where graph_id=%s'''
        Logger.log_info(sql % (task_id, graph_id))
        cursor.execute(sql, [task_id, graph_id])
        sql = '''UPDATE graph_task_history_table 
                    set task_id=%s, start_time=%s
                    where graph_id=%s and subgraph_id=%s and task_status='waiting' and parent is null; '''
        now_time = arrow.now().format('YYYY-MM-DD HH:mm:ss')
        Logger.log_info(sql % (task_id, now_time, graph_id, subgraph_id))
        cursor.execute(sql, [task_id, now_time, graph_id, subgraph_id])

    @connect_execute_commit_close_db
    def update_history_table_status(self, status, error_report, task_id, connection, cursor):
        sql = '''UPDATE graph_task_history_table
                    set task_status=%s, error_report=%s
                    where task_id=%s'''
        Logger.log_info(sql % (status, str(error_report), task_id))
        cursor.execute(sql, [status, str(error_report), task_id])
            

    @connect_execute_commit_close_db
    def update_history_table_end_time(self, end_time, task_id, connection, cursor):
        sql = '''UPDATE graph_task_history_table
                        set end_time=%s
                        where task_id=%s'''
        Logger.log_info(sql % (end_time, task_id))
        cursor.execute(sql, [end_time, task_id])
            

    @connect_execute_commit_close_db
    def update_history_table_status_by_id(self, status, error_report, id, connection, cursor):
        sql = '''UPDATE graph_task_history_table
                        set task_status=%s, error_report=%s
                        where id=%s'''
        Logger.log_info(sql % (status, error_report, id))
        cursor.execute(sql, [status, error_report, id])
            

    @connect_execute_commit_close_db
    def insert_task_ontology(self, task_id, ontology, connection, cursor):
        sql = '''UPDATE graph_task_history_table
                    set entity=%s, edge=%s
                    where id=%s'''
        Logger.log_info(sql % (str(ontology['entity']), str(ontology['edge']), task_id))
        cursor.execute(sql, [str(ontology['entity']), str(ontology['edge']), task_id])

    @connect_execute_close_db
    def get_task_ontology(self, task_id, connection, cursor):
        sql = '''SELECT entity, edge from graph_task_history_table WHERE task_id='{}';'''.format(task_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_commit_close_db
    def update_success_subgraph(self, task_id, successful_subgraph, connection, cursor):
        sql = '''UPDATE graph_task_table set successful_subgraph=%s WHERE task_id=%s;'''
        value_list = [str(successful_subgraph), task_id]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
            

    @connect_execute_commit_close_db
    def update_failed_subgraph_ids(self, graph_id, failed_subgraph_ids, connection, cursor):
        sql = '''UPDATE graph_task_table set failed_subgraph_ids=%s WHERE graph_id=%s;'''
        value_list = [str(failed_subgraph_ids), graph_id]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
            

    @connect_execute_commit_close_db
    def update_stop_subgraph_ids(self, graph_id, stop_subgraph_ids, connection, cursor):
        sql = '''UPDATE graph_task_table set stop_subgraph_ids=%s WHERE graph_id=%s;'''
        value_list = [str(stop_subgraph_ids), graph_id]
        Logger.log_info(sql % tuple(value_list))
        cursor.execute(sql, value_list)
            

    @connect_execute_commit_close_db
    def update_current_subgraph_id(self, graph_id, current_subgraph_id, connection, cursor):
        # 如果开始下一个任务，先把task_id清空 防止celery_blue.start_task的【一个任务只能运行一次】限制影响下一个分组的运行
        if current_subgraph_id != -1:
            sql = 'UPDATE graph_task_table ' \
                  'set current_subgraph_id={}, task_id=NULL ' \
                  'WHERE graph_id={}'.format(current_subgraph_id, graph_id)
        else:
            sql = 'UPDATE graph_task_table set current_subgraph_id={} ' \
                  'WHERE graph_id={}'.format(current_subgraph_id, graph_id)
        Logger.log_info(sql)
        cursor.execute(sql)
            

    @connect_execute_commit_close_db
    def update_task_table_status(self, status, graph_id, connection, cursor):
        sql = '''UPDATE graph_task_table
                    set task_status=%s
                    where graph_id=%s'''
        Logger.log_info(sql % (status, graph_id))
        cursor.execute(sql, [status, graph_id])
            

    @connect_execute_commit_close_db
    def update_waiting_tasks(self, status, error_report, graph_id, connection, cursor):
        sql = '''UPDATE graph_task_history_table SET task_status=%s, error_report=%s 
                    where graph_id=%s and task_status='waiting';'''
        Logger.log_info(sql % (status, error_report, graph_id))
        cursor.execute(sql, [status, error_report, graph_id])
            

    @connect_execute_close_db
    def get_waiting_tasks(self, graph_id, connection, cursor):
        sql = '''SELECT * from graph_task_history_table
                    where graph_id=%s and task_status='waiting' and parent is null;'''
        Logger.log_info(sql % graph_id)
        cursor.execute(sql, [graph_id])
        return cursor.fetchall()

    @connect_execute_close_db
    def get_history_task_by_id(self, id, connection, cursor):
        # sql = '''SELECT gtht.*, a1.username create_user_name from graph_task_history_table gtht
        #          left join account a1 on gtht.create_user=a1.account_id
        #          where gtht.id=%s and gtht.parent is null'''
        sql = '''SELECT gtht.* from graph_task_history_table gtht 
                 where gtht.id=%s and gtht.parent is null'''
        Logger.log_info(sql % id)
        cursor.execute(sql, [id])
        return cursor.fetchall()

    @connect_execute_close_db
    def get_history_task_by_id2(self, id, connection, cursor):
        sql = 'SELECT * from graph_task_history_table where id=%s'
        Logger.log_info(sql % id)
        cursor.execute(sql, [id])
        return cursor.fetchall()

    @connect_execute_close_db
    def get_unfinished_task_by_graph_id(self, graph_id, connection, cursor):
        sql = '''SELECT * from graph_task_history_table
                    where graph_id=%s and task_status in ('waiting' ,'running') and parent is null'''
        Logger.log_info(sql % graph_id)
        cursor.execute(sql, [graph_id])
        return cursor.fetchall()

    @connect_execute_close_db
    def get_tasks(self, graph_id, task_ids, connection, cursor):
        sql = '''SELECT * from graph_task_history_table
                    where graph_id={} and id in ({})''' \
            .format(graph_id, ",".join(map(str, task_ids)))
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_close_db
    def get_running_rabbitmq(self, connection, cursor):
        sql = """
            SELECT gtt.*, gct.graph_name FROM graph_task_table gtt 
            LEFT JOIN graph_config_table gct ON gtt.graph_id=gct.id 
            WHERE gtt.task_status='running' AND gct.rabbitmq_ds=1
        """
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_commit_close_db
    def insert_child_task(self, params, connection, cursor):
        '''
        插入子任务
        '''
        values = [
            params.get('graph_id'),
            params.get('task_type'),
            params.get('parent'),
            str(params.get('entity', [])),
            str(params.get('edge', [])),
            str(params.get('task_name', '')),
            str(params.get('files', {})),
            params.get('task_status', 'waiting'),
            params.get('start_time'),
            params.get('end_time'),
            params.get('extract_type')
        ]
        numbers = self.getotlnum(
            [{'entity': params.get('entity', []), 'edge': params.get('edge', [])}]
        )
        values.append(numbers['entitynums'])
        values.append(numbers['edgenums'])
        values.append(numbers['propertynums'][0])
        values.append(numbers['propertynums'][1])
        values_placeholder = '(' + ','.join(['%s'] * len(values)) + ')'
        sql = 'insert into graph_task_history_table ' \
              '(graph_id, task_type, parent, entity, edge, task_name, files, task_status, ' \
              'start_time, end_time, extract_type, entity_num, edge_num, entity_pro_num, edge_pro_num) ' \
              'values {}'.format(values_placeholder)
        Logger.log_info(sql % tuple(values))
        cursor.execute(sql, values)

        return rdsdriver.process_last_row_id(cursor.lastrowid)

    @connect_execute_close_db
    def get_child_task(self, params, connection, cursor):
        '''
        获取子任务
        Args:
            params:
                parent: 父任务的celery_task_id，必传
                task_name: 实体类名或关系名或模型名，非必传
                task_status: 根据任务状态来筛选，非必传
                celery_submitted: 已提交celery任务，非必传

        Returns:

        '''
        sql = """select * from graph_task_history_table where parent = '{}' """.format(params.get('parent'))
        if 'task_name' in params:
            sql += "and task_name = '{}' ".format(params.get('task_name'))
        if 'task_status' in params:
            status = params.get('task_status')
            if isinstance(status, str):
                status = [status]
            sql += 'and task_status in ({}) '.format(
                ','.join(["'{}'".format(s) for s in status]))
        if 'celery_submitted' in params:
            sql += 'and task_id is not null '
        if 'task_type' in params:
            sql += "and task_type = '{}' ".format(params.get('task_type'))
        if params.get('omit_model_entity'):
            sql += "AND (NOT(extract_type='modelExtraction' AND task_type IN ('entity', 'edge')) or extract_type is null) "
        if 'rule' in params and 'order' in params:
            sql += ' order by IF(ISNULL({rule}), 1, 0) {order}, {rule} {order}'\
                .format(rule=params['rule'], order=params['order'])
        if 'page' in params and 'size' in params:
            page = int(params['page']) - 1
            size = int(params['size'])
            sql += ' limit {}, {}'.format(page * size, size)
        Logger.log_info(sql)
        cursor.execute(sql)

        return cursor.fetchall()

    @connect_execute_commit_close_db
    def update_celery_task_id(self, celery_task_id, task_id, connection, cursor):
        sql = 'update graph_task_history_table set task_id=%s where id=%s'
        args = (celery_task_id, task_id)
        Logger.log_info(sql % args)
        cursor.execute(sql, args)
            

    @connect_execute_commit_close_db
    def task_on_start(self, celery_task_id, connection, cursor):
        sql = """update graph_task_history_table set task_status='running', start_time=%s where task_id=%s"""
        args = (arrow.now().format('YYYY-MM-DD HH:mm:ss'), celery_task_id)
        Logger.log_info(sql % args)
        cursor.execute(sql, args)
        return cursor.rowcount

    @connect_execute_commit_close_db
    def task_on_success(self, celery_task_id, connection, cursor):
        sql = """update graph_task_history_table set task_status='normal', end_time=%s where task_id=%s"""
        args = (arrow.now().format('YYYY-MM-DD HH:mm:ss'), celery_task_id)
        Logger.log_info(sql % args)
        cursor.execute(sql, args)

    @connect_execute_commit_close_db
    def task_on_failure(self, celery_task_id, error_report, connection, cursor):
        args = (arrow.now().format('YYYY-MM-DD HH:mm:ss'),
                str(error_report),
                celery_task_id)
        sql = "update graph_task_history_table " \
              "set task_status='failed', end_time=%s, error_report=%s " \
              "where task_id=%s"
        Logger.log_info(sql % args)
        cursor.execute(sql, args)

    @connect_execute_commit_close_db
    def task_on_stop(self, task_id, connection, cursor):
        ids = task_id
        if isinstance(task_id, list):
            ids = ','.join([str(i) for i in task_id])
        sql = """update graph_task_history_table set task_status='stop', end_time='{}' where id in ({})""" \
              .format(arrow.now().format('YYYY-MM-DD HH:mm:ss'), ids)
        Logger.log_info(sql)
        cursor.execute(sql)

    @connect_execute_close_db
    def get_id_by_celery_id(self,celery_id, connection, cursor):
        sql = f"""SELECT id from graph_task_table WHERE task_id = '{celery_id}'"""
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_close_db
    def get_unfinished_submitted_task(self, connection, cursor):
        ''' 获取 已提交至celery 且 未结束 的任务 '''
        sql = """select * from graph_task_table where task_id is not null AND task_status IN ('waiting', 'running')"""
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()

    @connect_execute_close_db
    def get_unsubmitted_task(self, connection, cursor):
        ''' 获取未提交至celery的任务 '''
        sql = 'SELECT * FROM graph_task_table WHERE task_id IS NULL'
        Logger.log_info(sql)
        cursor.execute(sql)
        return cursor.fetchall()


task_dao = TaskDao()

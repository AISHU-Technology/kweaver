# -*-coding:utf-8-*-
# @Time    : 2020/11/2 13:50
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import datetime
import json
import signal
import socket
import sys
import time
import traceback

import pandas as pd
from celery import current_app
from flask_babel import gettext as _l

import common.stand_log as log_oper
from celery_task.celery_tasks import cel
from common.errorcode import codes
from common.errorcode.gview import Gview
from dao.dsm_dao import dsm_dao
from dao.graph_dao import graph_dao
from dao.task_dao import task_dao
from dao.task_onto_dao import task_dao_onto
from utils.ConnectUtil import redisConnect
from utils.common_response_status import CommonResponseStatus
from utils.log_info import Logger


class TaskService():
    # 获得图谱根据id
    def getgraphnamebyid(self, graph_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            rec_dict = task_dao.getgraphnamebyid(graph_id)
            obj["df"] = rec_dict
            if len(rec_dict) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graph not exist"
                obj['code'] = CommonResponseStatus.TASK_RUN_NO_GRAPH.value
                obj['message'] = "graph not exist"

        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj['cause'] = "get graph fail"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get graph fail"

        return ret_code, obj

    # 获得图谱根据id
    def getgraphcountbyid(self, graph_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            rec_dict = task_dao.getgraphcountbyid(graph_id)
            obj["df"] = rec_dict
            if len(rec_dict) == 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "graph not exist"
                obj['code'] = CommonResponseStatus.TASK_RUN_NO_GRAPH.value
                obj['message'] = "graph not exist"
                obj['solution'] = "Please use valid graph_id"

        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            obj['cause'] = "get graph fail"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "get graph fail"
            obj['solution'] = "Please check mariadb"
                
        return ret_code, obj

    # 根据任务id 获得图谱知识量
    def get_count_by_task_id(self, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            rec_dict = task_dao.get_history_task_by_task_id(task_id)
            obj["df"] = []
            if len(rec_dict) > 0:
                obj["df"] = rec_dict
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "task fail"
            # Response(status=500)
        return ret_code, obj

    # 根据图谱id 获得任务信息，更新后的信息
    def get_task_by_graph_id(self, graph_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            rec_dict = task_dao.gettaskbyid(graph_id)
            obj["df"] = []
            if len(rec_dict) > 0:
                obj["df"] = rec_dict

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "task fail"

        return ret_code, obj

    # 添加历史记录
    def update_history(self, graph_id, task_data):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            Logger.log_info("graph_id: {} task_dao.inserthistory ".format(graph_id))
            task_dao.update_history(graph_id, task_data)
            obj["res"] = "history task "

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "task fail"

        return ret_code, obj

    # 删除任务列表
    def deletetask(self, task_id, graph_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            task_dao.deletetask(task_id, graph_id)
            obj["res"] = "delete task "

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "delete task failed"

        return ret_code, obj

    # 删除历史任务列表
    def deletehistorytask(self, task_ids, graph_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            task_dao.deletehistorytask(task_ids, graph_id)
            obj["res"] = "delete history task "

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "delete history task failed"

        return ret_code, obj

    # 任务错误日志
    def getreportbytaskid(self, task_id):
        data = task_dao.getredisbytaskid(task_id)
        return data

    # 任务进度
    def getprogressbytaskid(self, params_json):
        data = task_dao.getredisbytaskid(params_json.get("task_id"))
        return data

    def initiate_graph_task(self, params):
        '''
        Insert initial value of all tasks in waiting status into graph_task_table and graph_task_history_table
        after submitting builder task and before submitting the task into celery.

        Parameters passed to the dao should be a dictionary whose required keys are ['graph_id', 'graph_name']

        Args:
            params: For immediate task or scheduled task, the keys are ['graph_id', 'task_type', 'trigger_type']
                    For batch task, the keys are ['task_id', 'subgraph_ids', 'write_mode']
        '''
        graph_id = params.get('graph_id')
        # get graph_name
        ret_name, obj_name = self.getgraphnamebyid(graph_id)
        graph_name = obj_name["df"][0]["graph_name"]
        params['graph_name'] = graph_name
        # initiate graph_task_table and graph_task_history_table
        task_dao.initiate_graph_task(params)

    def update_celery_task_id(self, graph_id, task_id):
        # get subgraph_id
        subgraph_id = task_dao.gettaskbyid(graph_id)[0]['current_subgraph_id']

        task_dao.update_task_id(graph_id, subgraph_id, task_id)

    def add_otl_task(self, otl_id, task_name, ds_id, task_type, postfix):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.insert_otl_Data(otl_id, task_name, ds_id, task_type, postfix)
            obj["res"] = ret

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = " otl predict task fail"

        return ret_code, obj

    def seconds_to_hms(self, seconds_num):
        m, s = divmod(seconds_num, 60)
        h, m = divmod(m, 60)
        hms = "%02d:%02d:%02d" % (h, m, s)
        return hms

    # 根据状态搜索
    def serchbystatus(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        try:
            page = params_json.get("page")
            task_status = params_json.get("status")
            size = params_json.get("size")
            order = params_json.get("order")
            graph_name = params_json.get("graph_name")
            count = task_dao.getCountbystatus(task_status, graph_name)
            rec_dict = task_dao.getallbystatus(task_status, int(page) - 1, int(size), order)
            res = {}
            res["count"] = count
            res["df"] = rec_dict
            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "query datasource fail"

        return ret_code, obj

    # 模糊查询
    def serachbyname(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            # 分页排序，是获得所有数据在分页分页排序，可以按照时间分页排序
            page = params_json.get("page")
            # user = args.get("user")
            size = params_json.get("size")
            order = params_json.get("order")
            ret = task_dao.getdatabyname(params_json.get("graph_name"))
            graph_name = params_json.get("graph_name", "")
            status = params_json.get("status", "")
            df = pd.DataFrame(ret)
            dfs, count = self.tasksort(df, page, size, order, status, graph_name)

            res = {}
            res["count"] = count
            res["df"] = dfs.to_dict('records')

            obj["res"] = res
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "insert connection fail"

        return ret_code, obj

    # 过滤正在运行和等待中的任务的数量
    def runtasknum(self, df):
        df_run = df.loc[df['task_status'] == 'running']
        df_wait = df.loc[df['task_status'] == 'waiting']

        return len(df_run) + len(df_wait)

    # 分页排序
    def tasksort(self, df, page, size, order, status, graph_name):
        # 根据条件过滤之后再排序
        graph_name = graph_name.lower()
        if graph_name != "":
            # df = df.loc[df["graph_name"].str.contains(graph_name)]
            dd = []
            for index, row in df.iterrows():
                state = row["graph_name"]
                state = state.lower()
                if state.__contains__(graph_name):
                    dd.append(row)
            df = pd.DataFrame(dd)

        if status != "all" and len(df) > 0:
            df = df.loc[df["task_status"] == status]

        if len(df) > 0:
            df_run = df.loc[df['task_status'] == 'running']
            df_wait = df.loc[df['task_status'] == 'waiting']
            df_other = df.loc[~df['task_status'].isin(['running', "waiting"])]
        else:
            df_run = pd.DataFrame()
            df_wait = pd.DataFrame()
            df_other = pd.DataFrame()

        df_all = pd.DataFrame()
        df_all = df_all.append(df_run)
        df_all = df_all.append(df_wait)
        df_all = df_all.append(df_other)
        ascend = False
        if order == "ascend":
            ascend = True
        if len(df_all) > 0:
            dfs = df_all.groupby("task_status", sort=False).apply(
                lambda x: x.sort_values("create_time", ascending=ascend).reset_index(drop=True))
            count = len(dfs)
        else:
            dfs = pd.DataFrame()
            count = len(dfs)

        dfs = dfs[(int(page) - 1) * int(size): (int(page) - 1) * int(size) + int(size)]
        return dfs, count

    # 停止任务 更新状态
    def updatestoptask(self, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        try:
            task_dao.updatestatusbyid("stop", "", task_id)
            obj["res"] = "update status success"
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            obj['message'] = "update status fail"

        return ret_code, obj

    def updatetaredis(self, mysql_task_info, task_info):
        '''if redis is down, update all task status and graph status to failed,
                and update knowledge number of all unfinished tasks'''
        for row in mysql_task_info:
            task_status = row["task_status"]
            graph_id = row["graph_id"]
            if task_status == "running" or task_status == "waiting":  # 如果redis挂掉 更改状态，
                error_report = {"result": {"cause": task_info, "message": task_info},
                                "status": "FAILURE",
                                "task_id": row['task_id']}
                # update current task status
                task_dao.updatestatusbyid("failed", str(error_report), row['task_id'])
                # update waiting tasks status
                task_dao.update_waiting_tasks('failed', str(error_report), graph_id)
                # redis 挂掉之后 修改任务状态，并修改图谱状态
                status = "failed"
                task_dao.upKgstatus(graph_id, status)
                # redis挂断插入历史数据
                from datetime import datetime
                dt = datetime.now()
                dt = str(dt.strftime("%Y-%m-%d %H:%M:%S"))
                dt = dt.split(".")[0]
                row["task_status"] = "failed"
                row["end_time"] = dt
                row["error_report"] = str(error_report)
                self.update_history(row["graph_id"], row)
                # update waiting tasks knowledge number
                task_dao.update_waiting_tasks_knowledge(graph_id, {'end_time': dt, 'error_report': str(error_report)})

    def update_task_status(self, table_task_info, redis_task_info):
        '''update task status by celery task information
        If the task finishes, start next task.
        This method can only be called by one process at a time. This process is implemented by the redis lock.

        Args:
            table_task_info: task information from graph_task_table in the format of dict list
            redis_task_info: celery task information from redis in the format of DataFrame
        '''
        redis = redisConnect.connect_redis("3", model="write")
        running_status = ['RUNNING']
        # for index, a_table_task_info in table_task_info.iterrows():
        for a_table_task_info in table_task_info:
            celery_task = redis_task_info.loc[redis_task_info['task_id'] == str(a_table_task_info['task_id'])]
            if len(celery_task) <= 0:
                continue
            celery_task = celery_task.to_dict('records')[0]
            celery_task_status = celery_task['status']
            celery_task_id = a_table_task_info['task_id']
            graph_id = a_table_task_info["graph_id"]
            redis_lock = 'update_task_status_lock_{}'.format(celery_task_id)
            get_lock = redis.set(redis_lock, 'valid', ex=5, nx=True)
            if not get_lock:
                # 如果锁存在但是没有失效时间, 则进行设置, 避免出现死锁
                if redis.ttl(redis_lock) == -1:
                    redis.expire(redis_lock, 5)
                continue
            Logger.log_info('updating task status. celery_task_id = {}, celery_task_status = {}'
                            .format(celery_task_id, celery_task_status))
            if celery_task_status in running_status:
                task_status = 'running'
                if len(task_dao.gettaskupdata(celery_task_id, "running")) == 0:
                    # update graph_task_table and graph_task_history_table status
                    task_dao.updatestatusbyid(task_status, '', celery_task_id)
                    # update knowledge table status
                    task_dao.upKgstatus(graph_id, task_status)
            elif celery_task_status == 'PENDING':
                task_status = 'waiting'
                # update graph_task_history_table status
                task_dao.update_history_table_status(task_status, '', celery_task_id)
            elif celery_task_status == 'SUCCESS':
                task_status = 'normal'
                end_time = celery_task['date_done']
                if a_table_task_info['task_status'] == task_status:
                    continue
                a_table_task_info['task_status'] = task_status
                a_table_task_info['end_time'] = end_time
                # update graph_task_history_table status
                task_dao.update_history_table_status(task_status, '', celery_task_id)
                task_dao.update_history_table_end_time(end_time, celery_task_id)
                # update graph_task_history_table knowledge number
                Logger.log_info("graph_id: {} SUCCESS start insert history knowledge number".format(graph_id))
                self.update_history(graph_id, a_table_task_info)
                # update graph_task_table successful subgraph configuration
                self.update_success_subgraph(celery_task_id)
                # start next task
                self.start_next_task(graph_id)
            elif celery_task_status == 'FAILURE':
                task_status = 'failed'
                end_time = celery_task['date_done']
                error_report = celery_task['all_res']
                error_report.pop('children')
                if a_table_task_info['task_status'] == task_status:
                    continue
                a_table_task_info['task_status'] = task_status
                a_table_task_info['end_time'] = end_time
                a_table_task_info['error_report'] = error_report
                # update graph_task_history_table status
                task_dao.update_history_table_status(task_status, error_report, celery_task_id)
                task_dao.update_history_table_end_time(end_time, celery_task_id)
                # update graph_task_history_table knowledge number
                Logger.log_info("graph_id: {} FAILURE start insert history knowledge number".format(graph_id))
                self.update_history(graph_id, a_table_task_info)
                # update graph_task_table failed_subgraph_ids
                self.update_failed_subgraph_ids(graph_id)
                # start next task
                self.start_next_task(graph_id)
            elif celery_task_status == 'REVOKED':
                task_status = 'stop'
                end_time = celery_task['date_done']
                if a_table_task_info['task_status'] == task_status:
                    continue
                # 因服务重启导致终止的任务，子任务也应该终止掉
                if celery_task['result'] == {"current": "builder server restart and stop task"}:
                    self.stop_child_tasks(celery_task_id)
                a_table_task_info['task_status'] = task_status
                a_table_task_info['end_time'] = end_time
                # update graph_task_history_table status
                task_dao.update_history_table_status(task_status, '', celery_task_id)
                task_dao.update_history_table_end_time(end_time, celery_task_id)
                # update graph_task_history_table knowledge number
                self.update_history(graph_id, a_table_task_info)
                # update graph_task_table stop subgraph_ids
                self.update_stop_subgraph_ids(graph_id)
                # start next task
                self.start_next_task(graph_id)
            else:
                status = 'waiting'
                # update graph_task_history_table status
                task_dao.update_history_table_status(status, '', celery_task_id)
            redis.delete(redis_lock)

    def update_success_subgraph(self, task_id):
        task_ontology = task_dao.get_task_ontology(task_id)[0]
        subgraph_entitys = eval(task_ontology['entity'])
        subgraph_edges = eval(task_ontology['edge'])
        successful_subgraph = task_dao.getbystatusid(task_id)[0]['successful_subgraph']
        if successful_subgraph:
            successful_subgraph = eval(successful_subgraph)
        else:
            successful_subgraph = {'entity': [], 'edge': []}
        successful_entity_names, successful_edge_relations = [], []
        for successful_entity in successful_subgraph['entity']:
            successful_entity_names.append(successful_entity.get('name'))
        for successful_edge in successful_subgraph['edge']:
            successful_edge_relations.append(successful_edge.get('relations'))
        for subgraph_entity in subgraph_entitys:
            if subgraph_entity['name'] not in successful_entity_names:
                successful_subgraph['entity'].append(subgraph_entity)
        for subgraph_edge in subgraph_edges:
            if subgraph_edge['relations'] not in successful_edge_relations:
                successful_subgraph['edge'].append(subgraph_edge)
        task_dao.update_success_subgraph(task_id, successful_subgraph)
            

    def update_failed_subgraph_ids(self, graph_id):
        task = task_dao.gettaskbyid(graph_id)[0]
        failed_subgraph_ids = []
        if task['failed_subgraph_ids']:
            failed_subgraph_ids = eval(task['failed_subgraph_ids'])
        current_subgraph_id = task['current_subgraph_id']
        failed_subgraph_ids.append(current_subgraph_id)
        task_dao.update_failed_subgraph_ids(graph_id, failed_subgraph_ids)
            

    def update_stop_subgraph_ids(self, graph_id):
        '''add current subgraph id to stop subgraph ids'''
        task = task_dao.gettaskbyid(graph_id)[0]
        stop_subgraph_ids = []
        if task['stop_subgraph_ids']:
            stop_subgraph_ids = eval(task['stop_subgraph_ids'])
        current_subgraph_id = task['current_subgraph_id']
        stop_subgraph_ids.append(current_subgraph_id)
        task_dao.update_stop_subgraph_ids(graph_id, stop_subgraph_ids)
            

    def start_next_task(self, graph_id):
        task = task_dao.gettaskbyid(graph_id)
        if len(task) == 0:
            raise Exception('start next task failed. graph_id {} dose not have a task.'.format(graph_id))
        task = task[0]
        current_subgraph_id = task['current_subgraph_id']
        subgraph_ids = eval(task['subgraph_ids'])
        task_type = task["task_type"]
        if current_subgraph_id == -1 or current_subgraph_id == subgraph_ids[-1]:
            # all tasks of this graph have been completed
            self.update_graph_final_status(graph_id)
            # set current_subgraph_id as -1
            task_dao.update_current_subgraph_id(graph_id, -1)
        else:
            # start next waiting task
            waiting_tasks = task_dao.get_waiting_tasks(graph_id)
            waiting_task_subgraph_ids = []
            for waiting_task in waiting_tasks:
                waiting_task_subgraph_ids.append(waiting_task['subgraph_id'])
            index = subgraph_ids.index(current_subgraph_id) + 1
            while index < len(subgraph_ids):
                if subgraph_ids[index] in waiting_task_subgraph_ids:
                    # set current_subgraph_id as the next item
                    task_dao.update_current_subgraph_id(graph_id, subgraph_ids[index])
                    from celery_task.celery_blue import start_task
                    ret_code, task_id = start_task(graph_id, task_type)
                    # update task status
                    table_task_info = task_dao.gettaskbyid(graph_id)
                    redis_task_info = task_dao.getredisbytaskid(task_id)
                    if redis_task_info:
                        date_done = redis_task_info['date_done']
                        if date_done is None or date_done == "null":
                            end_time = "None"
                        else:
                            date_done = date_done.split(".")[0]
                            UTC_FORMAT = "%Y-%m-%dT%H:%M:%S"
                            utcTime = datetime.datetime.strptime(date_done, UTC_FORMAT)
                            end_time = utcTime + datetime.timedelta(hours=8)
                        redis_task_info['date_done'] = str(end_time)
                        redis_task_info = pd.DataFrame({'task_id': [redis_task_info['task_id']],
                                                        'status': [redis_task_info['status']],
                                                        'date_done': [str(end_time)],
                                                        'result': [redis_task_info['result']],
                                                        'all_res': [redis_task_info]})
                        self.update_task_status(table_task_info, redis_task_info)
                    break
                index += 1
            if index == len(subgraph_ids):  # no next task
                self.update_graph_final_status(graph_id)
                # set current_subgraph_id as -1
                task_dao.update_current_subgraph_id(graph_id, -1)
            else:
                status = 'running'
                # update graph_task_table status
                task_dao.update_task_table_status(status, graph_id)
                # update knowledge table status
                task_dao.upKgstatus(graph_id, status)
            

    def update_graph_final_status(self, graph_id):
        '''update graph final status
        update table graph_task_table and graph_config_table'''
        task = task_dao.gettaskbyid(graph_id)
        if len(task) == 0:
            raise Exception('update graph final status failed. graph_id {} dose not have a task.'.format(graph_id))
        task = task[0]
        status = 'normal'
        if task['failed_subgraph_ids'] and len(eval(task['failed_subgraph_ids'])) > 0:
            status = 'failed'
        elif task['stop_subgraph_ids'] and len(eval(task['stop_subgraph_ids'])) > 0:
            status = 'stop'
        task_dao.update_task_table_status(status, graph_id)
        # update knowledge table status
        task_dao.upKgstatus(graph_id, status)
            

    def update_otl_status2(self, df, task_info, host_url):
        try:
            for index, row in df.iterrows():
                try:
                    task = task_info.loc[task_info["task_id"] == str(row['celery_task_id'])]
                    status2 = ""
                    error_report = ""
                    # 任务在redis列表中，处理，不在不处理
                    if len(task) > 0:
                        task = task.to_dict('records')
                        task = task[0]
                        task_state = task["status"]
                        # 默认运行中 如果不在运行中的状态改变状态 其他状态不变 normal edit running waiting failed stop
                        if task_state == "PENDING":
                            df.loc[index, 'task_status'] = "running"
                            status2 = "running"
                            update_time = task["date_done"]
                            task_dao_onto.update_otl_status_byceleryid(status2, error_report, row['celery_task_id'],
                                                                       update_time)
                        elif task_state == "SUCCESS":  ###更新結果
                            task_status = row["task_status"]
                            if task_status != "finished":
                                df.loc[index, 'task_status'] = "finished"
                            status2 = "finished"
                            result = task["result"]["res"]
                            update_time = task["date_done"]
                            task_dao_onto.update_otl_status_byceleryid(status2, result, row['celery_task_id'],
                                                                       update_time)
                            file_list = task["result"]["file_list"]
                            task_dao_onto.add_file_status(file_list, row['celery_task_id'])

                        elif task_state == "FAILURE":  ###更新結果
                            if row["task_status"] != "failed":
                                df.loc[index, 'task_status'] = "failed"
                                error_report = task["all_res"]
                            status2 = "failed"
                            result = task["result"]
                            update_time = task["date_done"]
                            # result=str(result).replace("'",'"')
                            task_dao_onto.update_otl_status_byceleryid(status2, result, row['celery_task_id'],
                                                                       update_time)
                        else:
                            df.loc[index, 'task_status'] = str(task_state)
                            status2 = str(task_state)
                            result = task["result"]
                            update_time = task["date_done"]
                            task_dao_onto.update_otl_status_byceleryid(status2, result, row['celery_task_id'],
                                                                       update_time)
                except Exception as e:
                    err = repr(e)
                    error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
                    Logger.log_error(error_log)
                    continue
            return df
        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            return df

    def getrunningtask(self):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.getrunningtask()
            task_status = [info["task_status"] for info in ret]
            if task_status.count("running") >= 3:
                obj["running"] = False

                return ret_code, obj
            else:
                obj["running"] = True

                return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = " otl predict task fail"


            return ret_code, obj

    # 获取任务列表
    def getalltask(self, args):
        ret_code = CommonResponseStatus.SUCCESS.value
        # 分页排序，是获得所有数据在分页排序，因为有三层排序，不知道第n页的数据
        page = args.get("page")
        size = args.get("size")
        order = args.get("order")
        rule = args.get('rule')
        status = args.get("status")
        graph_name = args.get("graph_name")
        task_type = args.get("task_type")
        trigger_type = args.get("trigger_type")
        graph_id = args.get("graph_id")
        graph_name = graph_name.replace("_", "\_")
        count = task_dao.getnumbysn(status, graph_name, graph_id, task_type, trigger_type)
        tasks = task_dao.getallbysn(int(page) - 1, int(size), order, rule, status, graph_name, graph_id, task_type,
                                    trigger_type)
        for info in tasks:
            if info["start_time"] and info["end_time"]:
                start_time = datetime.datetime.strptime(info["start_time"], "%Y-%m-%d %H:%M:%S")
                sec = 0
                end_time = datetime.datetime.strptime(info["end_time"], "%Y-%m-%d %H:%M:%S")
                sec = (end_time - start_time).total_seconds()
                info["all_time"] = self.seconds_to_hms(sec)
            else:
                info["all_time"] = None
        rec_dict = tasks
        res = {}
        res["count"] = count
        res['graph_status'] = graph_dao.get_knowledge_graph_by_id(graph_id)[0]['status']
        list_all = []
        for reslist in rec_dict:
            effective_storage = True
            dict_all = {}
            dict_all['effective_storage'] = effective_storage
            for key in reslist:
                # if key == "create_by":
                #     dict_all[key] = reslist['create_user_name']
                if key == "error_report":
                    value = reslist[key]
                    if value != "":
                        value = eval(str(value))
                    else:
                        value = ""
                    dict_all[key] = value
                elif key in ("start_time", "end_time", "all_time"):
                    value = reslist[key]
                    if value == 0:
                        dict_all[key] = None
                    else:
                        dict_all[key] = value
                elif key == 'id':
                    dict_all['task_id'] = reslist[key]
                elif key == 'task_id':
                    dict_all['celery_task_id'] = reslist[key]
                else:
                    dict_all[key] = reslist[key]
            list_all.append(dict_all)
        res["df"] = list_all
            
        return ret_code, res

    def update_otl_task(self, status, error_report, celery_task_id, task_id, update_time):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            task_dao_onto.update_otl_statusbyid(status, error_report, celery_task_id, task_id, update_time)
            obj["res"] = "update task "

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "update otl task fail"

        return ret_code, obj

    def get_task_by_task_id(self, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_task_by_task_id(task_id)
            obj["ret"] = ret

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get task by task_id fail"

        return ret_code, obj

    def get_all_otl_task(self, page, size, status, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_all_otl_task(page, size, status, otl_id)
            obj["ret"] = ret

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = _l("get task of otl fail")

        return ret_code, obj

    def get_all_by_otlid(self, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_all_by_otlid(otl_id)
            df = pd.DataFrame(ret)
            obj["df"] = df

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)

            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = _l("get task of otl fail")

        return ret_code, obj

    def get_all_otl_task_result(self, used_task, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_all_otl_task_result(used_task, otl_id)
            df = pd.DataFrame(ret)
            obj["df"] = df

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = _l("get all otl task result  fail")

        return ret_code, obj

    def get_finished_otl_task_result(self, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            rec_dict = task_dao_onto.get_finished_otl_task_result(otl_id)
            obj["df"] = []
            if len(rec_dict) > 0:
                obj["df"] = rec_dict
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get finished otl task result fail"

        return ret_code, obj

    def add_file_status(self, file_list, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.add_file_status(file_list, task_id)
            obj["df"] = []
            if len(ret) > 0:
                rec_dict = ret.to_dict('records')
                obj["df"] = rec_dict
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)

            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "add file status fail"

        return ret_code, obj

    def delete_otl_task(self, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            task_dao_onto.delete_otl_task(task_id)
            obj["res"] = " delete task " + str(task_id) + " success "

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "delete task fail"

        return ret_code, obj

    def get_all_task_from_otl_table(self, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_all_task_from_otl_table(otl_id)
            df = pd.DataFrame(ret)
            obj["df"] = df

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get all task fail"

        return ret_code, obj

    def get_multi_task_name(self, otl_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_multi_filesname(otl_id)
            num = len(ret) + 1
            task_name = "Task" + str(num)
            return ret_code, task_name
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get_multi_task_name failed"
            return ret_code, obj

    def update_otl_task_filelist(self, table_list, task_id):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:

            df = task_dao_onto.update_otl_task_filelist(table_list, task_id)
            return ret_code, df
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "update_otl_task_filelist"
            return ret_code, obj

    def get_task_list(self, task_list):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = task_dao_onto.get_task_list(task_list)
            df = pd.DataFrame(ret)
            obj["df"] = df

            return ret_code, obj
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
            if "Duplicate entry" in err:
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
            obj['message'] = "get_task_list fail"

            return ret_code, obj

    def get_timer_by_id(self, task_id, graph_id):
        graph_id = int(graph_id)
        code = CommonResponseStatus.SUCCESS.value
        desc = None
        detail = None
        solution = None
        data = {}
        try:
            rec_dict = task_dao.get_timer_by_id(task_id, graph_id)
        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            desc = "get timer task failed"
            detail = f'{err}'
            solution = "Please check mariadb status"
            code = CommonResponseStatus.REQUEST_ERROR.value
            
        else:
            if len(rec_dict) == 0:
                desc = "timer task not exist"
                detail = "timer task not exist"
                solution = "Please user valid task_id"
                code = CommonResponseStatus.TIMER_TASK_NOT_EXIST.value
                
            else:
                rec_dict[0]['date_list'] = json.loads(rec_dict[0]['date_list'])
                data['data'] = rec_dict
        data['error_code'] = code
        data['desc'] = desc
        data['detail'] = detail
        data['solution'] = solution
            
        return code, data

    # 获取定时任务总数和每页数据
    def get_timer_data(self, graph_id, order_type, page, size):
        code = CommonResponseStatus.SUCCESS.value
        data = {}
        try:
            res = graph_dao.select_timed_count(graph_id)
            count = res[0]['count']
            data['count'] = count
            res = graph_dao.select_timed_page(graph_id, order_type, page, size)
            for index, row in enumerate(res):
                res[index]['date_list'] = json.loads(row['date_list'])
            data['search'] = res

        except Exception as e:
            err = repr(e)
            code = 500
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            data['error_code'] = CommonResponseStatus.REQUEST_ERROR.value
            data['desc'] = "get timer task failed"
            data['detail'] = f'{err}'
            data['solution'] = "Please check mariadb status"
        return code, data

    # 定时任务开关
    def update_timer_switch(self, graph_id, task_id, enabled, update_by):
        code = CommonResponseStatus.SUCCESS.value
        data = {}
        try:
            graph_dao.update_timer_switch(graph_id, task_id, enabled, update_by)

        except Exception as e:
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            data['error_code'] = CommonResponseStatus.REQUEST_ERROR.value
            data['desc'] = "get timer task failed"
            data['detail'] = f'{err}'
            data['solution'] = "Please check mariadb status"
        return code, data

    def start_otl_task(self, params_json, task_id, userId):
        task = current_app.send_task('cel.predict_ontology', (params_json, task_id, userId))
        task_state = task.status
        # task_state = task_dao.getstatusbytaskid(task.id)

        if task_state == "":
            task_status = "redis wrong"  # redis 挂掉了
        elif task_state == "PENDING":
            task_status = "running"
        elif task_state == "SUCCESS":
            task_status = "finished"
        elif task_state == "FAILURE":
            task_status = "failed"
        else:
            task_status = "unkonwn"
        celery_task_id = task.id
        update_time = task.date_done
        if update_time is None:
            update_time = "None"
        else:
            date_done = str(update_time).split(".")[0]
            UTC_FORMAT = "%Y-%m-%d %H:%M:%S"
            utcTime = datetime.datetime.strptime(date_done, UTC_FORMAT)
            update_time = utcTime + datetime.timedelta(hours=8)
        # task_id=params_json["task_id"]
        # 更新本体任务状态
        ret_code, obj = task_service.update_otl_task(task_status, "", celery_task_id, task_id, update_time)
        if ret_code != 200:

            return ret_code, celery_task_id


        return ret_code, celery_task_id

    def save_task_ip(self, task_id):
        redis = redisConnect.connect_redis("0", model="write")
        ip = socket.gethostbyname(socket.gethostname())
        redis.hset("build_task_ip", task_id, ip)
        redis.expire("build_task_ip", 60 * 60 * 24 * 10)  # 超时时间设为10天

    def get_task_detail(self, task_id, params):
        ret = {'entity': [], 'edge': [], 'tasks': [], 'count': 0}
        the_task = task_dao.get_history_task_by_id(task_id)
        if len(the_task) == 0:
            code = codes.Builder_TaskService_GetTaskDetail_TaskNotExist

            return 500, Gview.TErrorreturn(code)
        the_task = the_task[0]

        models = set()
        alias_dict = {}
        entity = the_task['entity']
        entity = eval(entity) if entity else []
        ret['entity'] = entity
        for e in entity:
            alias_dict[e['name']] = e['alias']
            if e['model']:
                models.add(e['model'])

        edge = the_task['edge']
        edge = eval(edge) if edge else []
        ret['edge'] = edge
        for e in edge:
            alias_dict[e['name']] = e['alias']
            if e['model']:
                models.add(e['model'])

        celery_task_id = the_task['task_id']
        tasks = []

        # 如果没有模型的任务，则返回值添加一条
        model_task_num = 0
        # 不分页或者第一页
        if not params.get('page') or params.get('page') == '1':
            # 无筛选条件或筛选条件为模型或正常
            if ((not params.get('task_type') or params.get('task_type') == 'model')
                    and (not params.get('task_status') or params.get('task_status') == 'normal')):
                for model in models:
                    model_task = task_dao.get_child_task({'parent': celery_task_id, 'task_name': model})
                    if len(model_task) == 0:
                        tasks.append({
                            "alias": None,
                            "all_time": None,
                            "end_time": None,
                            "error_report": None,
                            "extract_type": "modelExtraction",
                            "files": None,
                            "id": None,
                            "name": model,
                            "relation": None,
                            "relation_alias": None,
                            "start_time": None,
                            "task_status": "normal",
                            "task_type": "model"
                        })
                        model_task_num += 1
            if params.get('size'):
                params['size'] = str(int(params['size']) - model_task_num)
            ret['count'] = model_task_num

        params.update({'parent': celery_task_id})
        # 模型的实体类关系类任务不返回
        params.update({'omit_model_entity': True})
        child_tasks = task_dao.get_child_task(params)

        for child_task in child_tasks:
            a_ret = {
                'id': child_task['id'],
                'task_type': child_task['task_type'],
                'task_status': child_task['task_status'],
                'error_report': child_task['error_report'],
                'start_time': child_task['start_time'],
                'end_time': child_task['end_time'],
                'extract_type': child_task['extract_type']
            }
            if child_task['task_type'] == 'entity':
                entity = eval(child_task['entity'])[0]['name']
                a_ret['name'] = entity
                a_ret['alias'] = alias_dict.get(entity)
                a_ret['relation'] = None
                a_ret['relation_alias'] = None
            elif child_task['task_type'] == 'edge':
                relation = eval(child_task['edge'])[0]['relations']
                a_ret['name'] = relation[1]
                a_ret['alias'] = alias_dict.get(relation[1])
                a_ret['relation'] = [relation[0], relation[2]]
                a_ret['relation_alias'] = [alias_dict.get(relation[0]), alias_dict.get(relation[2])]
            elif child_task['task_type'] == 'model':
                a_ret['name'] = child_task['task_name']
                a_ret['alias'] = None
                a_ret['relation'] = None
                a_ret['relation_alias'] = None

            files = eval(child_task['files']) if child_task['files'] else []
            for file in files:
                ds_name = None
                ds_path = None
                ds_id = file.get('ds_id')
                if ds_id:
                    ds = dsm_dao.getdatabyid(ds_id)
                    if ds:
                        ds_name = ds[0]['ds_name']
                        ds_path = ds[0]['ds_path']
                file['ds_name'] = ds_name
                file['ds_path'] = ds_path
            a_ret['files'] = files

            if child_task['start_time'] and child_task['end_time']:
                start_time = datetime.datetime.strptime(child_task["start_time"], "%Y-%m-%d %H:%M:%S")
                end_time = datetime.datetime.strptime(child_task["end_time"], "%Y-%m-%d %H:%M:%S")
                sec = (end_time - start_time).total_seconds()
                a_ret["all_time"] = self.seconds_to_hms(sec)
            else:
                a_ret['all_time'] = None
            tasks.append(a_ret)
        ret['tasks'] = tasks

        if 'page' in params and 'size' in params:
            params.pop('page')
            params.pop('size')
        total_tasks = task_dao.get_child_task(params)
        ret['count'] += len(total_tasks)

        return 200, ret

    def on_start(self, celery_task_id):
        # 修改构建状态为running
        # 有可能子任务进行的太快，父任务来不及记录子任务task_id，导致update语句不生效，所以引入等待重试
        retry_num = 3
        while retry_num > 0:
            affected_rows = task_dao.task_on_start(celery_task_id)
            # 为避免任务执行的太快，出现执行时间为0s的情况，更新开始时间之后强行等待1s
            time.sleep(1)
            if affected_rows:
                return
            retry_num -= 1
        raise Exception('任务 {} 记录开始时间失败'.format(celery_task_id))

    def on_success(self, celery_task_id):
        # 处理任务结果
        # 修改构建任务状态为normal
        task_dao.task_on_success(celery_task_id)

    def on_failure(self, celery_task_id, error_report):
        # 修改构建任务状态为failed,并更新失败原因
        task_dao.task_on_failure(celery_task_id, error_report)
        parent_task_id = task_dao.get_history_task_by_task_id(celery_task_id)[0]['parent']
        # 终止其他任务
        self.stop_child_tasks(parent_task_id)

    def stop_child_tasks(self, parent_task_id):
        # 1. celery 终止任务
        # 2. 修改任务状态
        celery_tasks = task_dao.get_child_task({'parent': parent_task_id,
                                                'task_status': ['waiting', 'running']})
        unfinished_ids = []
        for t in celery_tasks:
            if t['task_id']:
                cel.control.revoke(t['task_id'], terminate=True, signal=signal.SIGKILL)
            unfinished_ids.append(t['id'])
        if unfinished_ids:
            task_dao.task_on_stop(unfinished_ids)

    def get_id_by_celery_id(self, celery_id):
        return task_dao.get_id_by_celery_id(celery_id)


task_service = TaskService()

# -*-coding:utf-8-*-
# @Time    : 2020/11/28 18:50
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import sys
import traceback

from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB
from dao.task_dao import task_dao
from service.task_Service import task_service
from utils.ConnectUtil import redisConnect
from utils.log_info import Logger
import common.stand_log as log_oper


def updatedata():
    '''
    1. 更新celery任务状态
    2. 若celery worker充足，提交未提交至celery的任务
    Returns:

    '''
    # ========== 遍历未结束的任务，更新任务状态 ==========
    # task information from mysql table
    mysql_task_info = task_dao.get_unfinished_task()
    # 获得任务列表中的所有task_id
    res_taskid_list = []
    for task in mysql_task_info:
        if task["task_id"] != None:
            res_taskid_list.append(task["task_id"])
    # 获取所有任务的celery信息
    status_code, task_info = task_dao.gettaskall(res_taskid_list)
    if status_code == "400":
        Logger.log_info("redis 断开，不再更新原来数据 失败，失败原因是redis挂断")
        task_service.updatetaredis(mysql_task_info, task_info)
    else:
        try:
            task_service.update_task_status(mysql_task_info, task_info)
        except Exception as e:
            error_log = log_oper.get_error_log('updatedata error: {}'.format(str(e)),
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
    # ========== 提交新的任务 ==========
    from celery_task.celery_blue import start_task
    unsubmitted_task = task_dao.get_unsubmitted_task()
    for a_task in unsubmitted_task:
        start_task(a_task['graph_id'], a_task['task_type'])


def timer_update_task():
    # 每分钟15秒刷新timer_update
    # time.sleep(15)
    try:
        graph_dao.timer_update_task()
    except Exception as e:
        error_log = log_oper.get_error_log(f'update table timer_update error:{str(e)}', sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)


# 每5秒钟检测一次是否有nebula submit任务
def update_nebula_submit():
    try:
        read_conn = redisConnect.connect_redis(0, 'read')
        graph_db_ids = {}
        finished_graph = []
        write_conn = redisConnect.connect_redis(0, 'write')
        status = read_conn.exists("nebula_stats_job_id")
        if status:
            res = read_conn.hgetall("nebula_stats_job_id")
            if res:
                count = 0
                graph_ids = []
                graph_ids_map = {}
                delete_key = []
                for k, v in res.items():
                    count += 1
                    k = k.decode()
                    v = int(v.decode())
                    job_id = v
                    graph_name, graph_id = k.split('_')
                    graph_id = int(graph_id)
                    graph_ids_map[graph_id] = [job_id, graph_name]
                    graph_ids.append(graph_id)
                    # 避免检测任务太多，造成任务积压，数据库挂掉
                    if count > 3:
                        Logger.log_info("Detect up to 3 Nebula tasks at a time")
                        break
                res = graph_dao.get_graph_db_id(graph_ids)
                for count, row in enumerate(res):
                    graph_id = row['id']
                    grapgdb = GraphDB()
                    job_id, graph_name = graph_ids_map[graph_id]
                    code, nebula_list = grapgdb.get_list()
                    if graph_name in nebula_list:
                        ngql = f"show job {job_id}"
                        state_code, res = grapgdb._nebula_exec(ngql, db=graph_name)
                        if state_code == 200:
                            num = res.row_size()
                            for index in range(num):
                                value = res.row_values(index)
                                job_id_new = value[0].as_int()
                                status = value[2].as_string()
                                if job_id_new == job_id:
                                    if status == 'FINISHED':
                                        finished_graph.append(row['id'])
                                        delete_key.append(f'{graph_name}_{graph_id}')
                                    break
                    else:
                        delete_key.append(f'{graph_name}_{graph_id}')
                task_dao.update_nebula_count(graph_ids)
                for k in delete_key:
                    write_conn.hdel('nebula_stats_job_id', k)
    except Exception as e:
        error_log = log_oper.get_error_log(f'update_nebula_submit error:{str(e)}', sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)

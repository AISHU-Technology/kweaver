# -*-coding:utf-8-*-
# @Time    : 2020/10/19 13:42
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import arrow
import datetime
import json
import os
import pandas as pd
import signal
import sys
import traceback
from flask import Blueprint, jsonify, request
from flask_babel import gettext as _l
import common.stand_log as log_oper
from celery_task.buildertask_daemon import buildertask_daemon
from celery_task.celery_tasks import cel
from common.errorcode import codes
from common.errorcode.gview import Gview
from dao.graph_dao import graph_dao
from dao.subgraph_dao import subgraph_dao
from dao.task_dao import task_dao
from service.graph_Service import graph_Service
from service.task_Service import task_service
from utils.ConnectUtil import redisConnect
from utils.common_response_status import CommonResponseStatus
from utils.log_info import Logger
from utils.util import check_run_once

celery_controller_app = Blueprint('celery_controller_app', __name__)


def getHostUrl():
    hostUrl = request.host_url
    return hostUrl


def start_task(graph_id, task_type):
    '''
    Execute builder task.
    Submit the task to celery and record the celery task id into mysql.
    同时运行的任务数不能超过celery worker并发数的一半，因为要留一半给子任务使用，防止父任务占用所有的worker导致阻塞

    Args:
        graph_id: graph id
        task_type: task_type, full or increment
    '''
    redis_key = 'start_celery_{}'.format(graph_id)
    redis = redisConnect.connect_redis("3", model="write")
    lock = redis.set(redis_key, 'valid', ex=10, nx=True)
    if lock:
        try:
            # 同时运行的任务数不能超过并发数的一半
            unfinished_submitted_task = task_dao.get_unfinished_submitted_task()
            total_concurrency = max(os.cpu_count(), 1)
            if len(unfinished_submitted_task) >= total_concurrency // 2:
                return CommonResponseStatus.SUCCESS.value, None
            # 一个任务只能运行一次
            task_record = task_dao.gettaskbyid(graph_id)
            task_id = task_record[0]['task_id']
            if task_id:
                return CommonResponseStatus.SUCCESS.value, None
            message = f'提交celery图谱构建任务: graph_id={graph_id}, task_type={task_type}'
            Logger.log_info(message)
            # 执行任务
            task = buildertask_daemon.apply_async(args=[graph_id, task_type])
            # time.sleep(0.4)  # 修改
            task_service.update_celery_task_id(graph_id, task.id)
            return CommonResponseStatus.SUCCESS.value, task.id
        finally:
            redis.delete(redis_key)
    return CommonResponseStatus.SUCCESS.value, None


# 执行任务,单独的接口，融合时候也需要调用
@celery_controller_app.route('/buildertask', methods=['POST'])
def task():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        graph_id = params_json.get("graph_id")
        tasktype = params_json.get("tasktype")
        trigger_type = params_json.get("trigger_type", 0)
        userId = request.headers.get("userId")
        # 统计上传中的图谱
        res, code = graph_Service.get_upload_id(graph_id)
        if len(res) > 0:
            return jsonify({'res': {"cause": _l("graph being uploaded can not run. "),
                                    "code": CommonResponseStatus.GRAPH_UPLOAD_NOT_RUN.value,
                                    "message": _l("task cannot run, the graph is being uploaded. ")},
                            "code": 500})
        # 如果状态是编辑状态则不能执行
        graph_data_dict = graph_dao.getbyidandstatus(graph_id)
        if len(graph_data_dict) > 0:
            # 查看graph_id 存在不，如果不存在执行任务，如果存在，根据状态：执行中和等待中不可以执行，
            # 其他状态可以执行，且把该条数据放到历史记录去，并且查询结束时间放到历史记录
            ret_code, task_data = task_service.get_task_by_graph_id(graph_id)
            # tasktype为用户配置的任务状态，right_task_type为实际执行的任务状态
            right_task_type = tasktype
            if tasktype != 'full' and trigger_type <= 1:
                graph_task_state = graph_dao.getnormaltask(graph_id)
                if len(graph_task_state) == 0:
                    right_task_type = "full"
                    Logger.log_info(f'task_type is automatically changed to full')
            if len(task_data["df"]) > 0:
                task_data = task_data["df"]
                task_data = task_data[0]
                task_status = task_data["task_status"]
                timestamp = task_data["timestamp"]
                timestamp = "NULL" if timestamp is None else timestamp
                if task_status == "running" or task_status == "waiting":
                    Logger.log_info(f'task cannot run,cause task is runninig or waiting, graph_id: {graph_id}')
                    check_run_once(trigger_type, graph_id)
                    return jsonify(
                        {'res': {"cause": _l("task cannot run, the current knowledge graph is running or waiting."),
                                 "code": 500022,
                                 "message": _l(
                                     "task cannot run, the current knowledge graph is running or waiting.")},
                         "code": 500})
                else:
                    try:
                        # 删除
                        task_service.deletetask(None, graph_id)
                        task_service.initiate_graph_task({'graph_id': graph_id,
                                                          'task_type': tasktype,
                                                          'trigger_type': trigger_type,
                                                          'timestamp': timestamp,
                                                          'userId': userId
                                                          })
                        # 执行
                        ret_code, task_id = start_task(graph_id, right_task_type)
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
                            Logger.log_info('开始运行构建任务后刷新')
                            task_service.update_task_status(table_task_info, redis_task_info)
                        check_run_once(trigger_type, graph_id)
                        return jsonify({'res': f"{task_id} start running", "code": 200})
                    except Exception as e:
                        error_log = log_oper.get_error_log('executing task failed: {}'.format(e),
                                                           sys._getframe(), traceback.format_exc())
                        Logger.log_error(error_log)
                        err = repr(e)
                        check_run_once(trigger_type, graph_id)
                        # 修改状态
                        error_report = {'status': 'FAILURE', 'result': {'cause': err, 'message': err}}
                        task_dao.update_waiting_tasks("failed", str(error_report), graph_id)
                        task_dao.update_task_table_status("failed", graph_id)
                        task_dao.upKgstatus(graph_id, "failed")
                        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})
            else:
                task_service.initiate_graph_task({'graph_id': graph_id,
                                                  'task_type': tasktype,
                                                  'trigger_type': trigger_type,
                                                  'userId': userId
                                                  })
                ret_code, task_id = start_task(graph_id, right_task_type)
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
                    Logger.log_info('第一次开始运行构建任务后刷新')
                    task_service.update_task_status(table_task_info, redis_task_info)
                check_run_once(trigger_type, graph_id)
                return jsonify({'res': f"{task_id} start running", "code": 200})
        else:
            check_run_once(trigger_type, graph_id)
            msg = "当前知识图谱尚未完成配置，无法运行任务，请配置完成后重试"
            return jsonify({'res': {"cause": msg, "code": 500001,
                                    "message": msg}, "code": 500})
    except Exception as e:
        error_log = log_oper.get_error_log('executing task failed: {}'.format(e),
                                           sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        err = repr(e)
        check_run_once(trigger_type, graph_id)
        # 修改状态
        error_report = {'status': 'FAILURE', 'result': {'cause': err, 'message': err}}
        task_dao.update_waiting_tasks("failed", str(error_report), graph_id)
        task_dao.update_task_table_status("failed", graph_id)
        task_dao.upKgstatus(graph_id, "failed")
        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})


@celery_controller_app.route('/builder_task/batch', methods=['POST'])
def task_batch():
    '''
    execute the task of building the graph in batches
    '''
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        graph_id = params_json.get("graph_id")
        subgraph_ids = params_json.get('subgraph_ids')
        write_mode = params_json.get('write_mode')
        userId = request.headers.get("userId")
        flag = params_json.get('flag', "full")
        # check whether subgraph_ids exists
        graph_subgraphs = subgraph_dao.get_subgraph_list_by_graph_id(graph_id)
        graph_subgraph_ids = []
        for graph_subgraph in graph_subgraphs:
            graph_subgraph_ids.append(graph_subgraph['id'])
        if not set(subgraph_ids) <= set(graph_subgraph_ids):
            code = codes.Builder_CeleryBlue_TaskBatch_SubgraphIdNotExist

            return Gview.error_return(code, subgraph_id=str(set(subgraph_ids) - set(graph_subgraph_ids))), 500
        # graph cannot run: graph is in editing status
        graph_edit_status = graph_dao.getbyidandstatus(graph_id)
        if len(graph_edit_status) == 0:
            code = codes.Builder_CeleryBlue_TaskBatch_GraphInEditingStatus

            return Gview.error_return(code), 500
        # graph cannot run: graph status is in waiting or running
        ret_code, task_data = task_service.get_task_by_graph_id(graph_id)
        if task_data["df"] and task_data["df"][0]["task_status"] in ['running', 'waiting']:
            code = codes.Builder_CeleryBlue_TaskBatch_GraphInRunningOrWaiting

            return Gview.error_return(code), 500
        # graph cannot run: graph is being uploaded
        res, code = graph_Service.get_upload_id(graph_id)
        if len(res) > 0:
            code = codes.Builder_CeleryBlue_TaskBatch_GraphBeingUploaded

            return Gview.error_return(code), 500

        # start execute the task
        timestamp = "NULL"
        if task_data['df']:
            task_service.deletetask(None, graph_id)
            timestamp = task_data["df"][0]["timestamp"]
            timestamp = "NULL" if timestamp is None else timestamp
        task_service.initiate_graph_task(
            {'graph_id': graph_id, 'subgraph_ids': subgraph_ids, 'write_mode': write_mode,
             'timestamp': timestamp, 'task_type': flag, 'userId': userId})
        ret_code, task_id = start_task(graph_id, flag)
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
            Logger.log_info('开始运行分批构建任务后刷新')
            task_service.update_task_status(table_task_info, redis_task_info)
        return Gview.json_return(_l('{} start running success.'.format(task_id))), 200
    except Exception as e:
        code = codes.Builder_CeleryBlue_TaskBatch_UnknownError
        return Gview.error_return(code, description=str(e), cause=str(e)), 500


# 获取任务列表
@celery_controller_app.route('/buildertask', methods=['GET'])
def getalltask():
    try:
        params_json = request.args.to_dict()
        ret_code, obj = task_service.getalltask(params_json)
        return Gview.json_return(obj), 200
    except Exception as e:
        error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_CeleryBlue_GetAllTask_UnknownError
        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500

# 删除任务
@celery_controller_app.route('/delete_task', methods=['DELETE'])
def deletetask():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        graph_id = params_json.get("graph_id")
        task_ids = params_json["task_ids"]

        tasks = task_dao.get_tasks(graph_id, task_ids)
        stop_ids = []
        for a_task in tasks:
            # stop tasks that has been submitted to celery
            if a_task['task_id'] and a_task['task_status'] in ['running', 'waiting']:
                cel.control.revoke(a_task['task_id'], terminate=True, signal=signal.SIGKILL)
                task_service.stop_child_tasks(a_task['task_id'])
            elif a_task['task_status'] == 'waiting':
                # add stop subgraph ids.
                # Only unstarted tasks are added.
                # Started tasks will be added to stop_ids in scheduled task task_service.update_task_status
                stop_ids.append(a_task['subgraph_id'])
        graph_task = task_dao.gettaskbyid(graph_id)[0]
        stop_subgraph_ids = []
        if graph_task['stop_subgraph_ids']:
            stop_subgraph_ids = eval(graph_task['stop_subgraph_ids'])
        stop_subgraph_ids.extend(stop_ids)
        task_dao.update_stop_subgraph_ids(graph_id, stop_subgraph_ids)
        # delete history tasks
        code, obj = task_service.deletehistorytask(task_ids, graph_id)
        if code == 500:
            code = codes.Builder_CeleryBlue_DeleteTask_UnknownError
            return Gview.TErrorreturn(code, description=obj['message'], cause=obj['cause']), 500
        # start next task
        table_task_info = task_dao.gettaskbyid(graph_id)
        redis_task_info = task_dao.getredisbytaskid(graph_task['task_id'])
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
            Logger.log_info('删除任务后刷新')
            task_service.update_task_status(table_task_info, redis_task_info)
        return Gview.json_return(_l('delete task success')), 200
    except Exception as e:
        error_log = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_CeleryBlue_DeleteTask_UnknownError
        return Gview.TErrorreturn(code, description=repr(e), cause=repr(e)), 500


# 终止任务
@celery_controller_app.route('/stoptask', methods=['POST'])
def stop_task():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        graph_id = params_json.get("graph_id")
        task_id = params_json.get('task_id')
        if graph_id:
            # stop all tasks of the graph
            # check
            graph_task = task_dao.gettaskbyid(graph_id)
            if len(graph_task) == 0:
                code = codes.Builder_CeleryBlue_StopTask_TaskNotExist
                return Gview.TErrorreturn(code), 500
            graph_task = graph_task[0]
            if graph_task['task_status'] not in ['waiting', 'running']:
                code = codes.Builder_CeleryBlue_StopTask_TerminationNotAllowed
                return Gview.TErrorreturn(code), 500
            unfinished_tasks = task_dao.get_unfinished_task_by_graph_id(graph_id)
            if len(unfinished_tasks) == 0:
                code = codes.Builder_CeleryBlue_StopTask_TaskNotExist
                return Gview.TErrorreturn(code), 500
            stop_ids = []
            running_task_id = ''
            for a_task in unfinished_tasks:
                if a_task['task_status'] == 'running' or (a_task['task_status'] == 'waiting' and a_task['task_id']):
                    running_task_id = a_task['task_id']
                    # stop current running task
                    cel.control.revoke(running_task_id, terminate=True, signal=signal.SIGKILL)
                    task_service.stop_child_tasks(a_task['task_id'])
                    # update running task status
                    task_dao.update_history_table_status('stop', '', a_task['task_id'])
                    task_dao.update_history(graph_id,
                                            {'end_time': arrow.now().format('YYYY-MM-DD HH:mm:ss'),
                                             'error_report': '',
                                             'task_id': a_task['task_id']})
                elif a_task['task_status'] == 'waiting':
                    # Only unstarted tasks are added.
                    # Started tasks will be added to stop_ids in scheduled task task_service.update_task_status
                    stop_ids.append(a_task['subgraph_id'])
            # update waiting tasks status
            task_dao.update_waiting_tasks('stop', '', graph_id)
            task_dao.update_waiting_tasks_knowledge(graph_id,
                                                    {'end_time': arrow.now().format('YYYY-MM-DD HH:mm:ss'),
                                                     'error_report': '',
                                                     'task_status': 'waiting'})
            # add stop subgraph ids
            stop_subgraph_ids = []
            if graph_task['stop_subgraph_ids']:
                stop_subgraph_ids = eval(graph_task['stop_subgraph_ids'])
            stop_subgraph_ids.extend(stop_ids)
            task_dao.update_stop_subgraph_ids(graph_id, stop_subgraph_ids)
            # update graph_task_table stop subgraph_ids
            # and update graph status
            table_task_info = task_dao.gettaskbyid(graph_id)
            redis_task_info = task_dao.getredisbytaskid(running_task_id)
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
                Logger.log_info('终止图谱任务后刷新')
                task_service.update_task_status(table_task_info, redis_task_info)
            else:
                task_service.update_graph_final_status(graph_id)
            # 修改upload_ready为False
            graph_dao.switch_upload_ready(graph_id, False)
        elif task_id:
            # stop the task
            # check
            the_task = task_dao.get_history_task_by_id(task_id)
            if len(the_task) == 0:
                code = codes.Builder_CeleryBlue_StopTask_TaskNotExist
                return Gview.TErrorreturn(code), 500
            the_task = the_task[0]
            if the_task['task_status'] not in ['waiting', 'running']:
                code = codes.Builder_CeleryBlue_StopTask_TerminationNotAllowed
                return Gview.TErrorreturn(code), 500
            stop_ids = []
            # stop celery task
            if the_task['task_id']:
                cel.control.revoke(the_task['task_id'], terminate=True)
                task_service.stop_child_tasks(the_task['task_id'])
            else:
                stop_ids.append(the_task['subgraph_id'])
            # update history table status(id rather than task_id: in case the task has not been submitted to celery)
            task_dao.update_history_table_status_by_id('stop', '', task_id)
            task_dao.update_waiting_tasks_knowledge(the_task['graph_id'],
                                                    {'end_time': arrow.now().format('YYYY-MM-DD HH:mm:ss'),
                                                     'error_report': '',
                                                     'task_status': the_task['task_status']})
            # update graph_task_table stop subgraph_ids of unstarted task
            if stop_ids:
                graph_id = the_task['graph_id']
                graph_task = task_dao.gettaskbyid(graph_id)[0]
                stop_subgraph_ids = []
                if graph_task['stop_subgraph_ids']:
                    stop_subgraph_ids = eval(graph_task['stop_subgraph_ids'])
                stop_subgraph_ids.extend(stop_ids)
                task_dao.update_stop_subgraph_ids(graph_id, stop_subgraph_ids)
            # update graph_task_table stop subgraph_ids of started task
            # and start next task
            table_task_info = task_dao.gettaskbyid(the_task['graph_id'])
            redis_task_info = task_dao.getredisbytaskid(the_task['task_id'])
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
                Logger.log_info('终止任务后刷新')
                task_service.update_task_status(table_task_info, redis_task_info)
            else:
                task_service.update_graph_final_status(the_task['graph_id'])
            # 修改upload_ready为False
            graph_dao.switch_upload_ready(the_task['graph_id'], False)
        return Gview.json_return(_l('stop task success.')), 200
    except Exception as e:
        code = codes.Builder_CeleryBlue_StopTask_UnknownError
        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


# 健康检查
@celery_controller_app.route('/graph/health/ready', methods=["GET"], strict_slashes=False)
def health():
    return "success", 200


@celery_controller_app.route('/graph/health/alive', methods=["GET"], strict_slashes=False)
def healthalive():
    return "success", 200


@celery_controller_app.route('/detail/<task_id>', methods=['GET'])
def get_task_detail(task_id):
    # 根据任务id获取子任务的详细信息
    try:
        params = dict(request.args)

        code, res = task_service.get_task_detail(task_id, params)
        if code != 200:
            return res, 500
        return Gview.json_return(res), 200
    except Exception as e:
        error_log = log_oper.get_error_log("get child tasks error: {}".format(e), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_CeleryBlue_GetTaskDetail_UnknownError
        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500

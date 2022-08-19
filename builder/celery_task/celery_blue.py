# -*-coding:utf-8-*-
# @Time    : 2020/10/19 13:42
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import datetime

from celery import group
from flask import Blueprint, make_response, jsonify, request

from service.graph_Service import graph_Service
from utils.common_response_status import CommonResponseStatus
from utils.util import redislock, check_run_once

celery_controller_app = Blueprint('celery_controller_app', __name__)
from celery_tasks import *
from service.task_Service import task_service
from controller.graph_count_controller import get_graph_count_all
import os
import sys
import time
import json

sys.path.append(os.path.abspath("../"))
from service.task_Service import task_service
from dao.task_dao import task_dao
from dao.graph_dao import graph_dao
from utils.log_info import Logger


def getHostUrl():
    hostUrl = request.host_url
    return hostUrl


def start_task(graph_id, tasktype, trigger_type, right_task_type):
    Logger.log_info(
        f'graph_id={graph_id},tasktype={tasktype},trigger_type={trigger_type},right_task_type={right_task_type}')
    params_json = {}
    # 执行任务
    task = buildertask.apply_async(args=[graph_id, right_task_type])
    # task = buildertask.delay(graph_id)
    time.sleep(0.4)  # 修改
    # 获得任务状态
    # taskstate = buildertask.AsyncResult(task.id)
    # task_state = taskstate.state
    task_state = task_dao.getstatusbytaskid(task.id)
    status = ["graph_baseInfo", "graph_ds", "graph_otl", "graph_InfoExt", "graph_KMap", "graph_KMerge"]
    task_status = "running"
    if task_state == "":
        task_status = "waiting"  # redis 挂掉了
    else:
        if task_state not in status:
            if task_state == "PENDING":
                task_status = "waiting"
            elif task_state == "SUCESS":
                task_status = "normal"
            elif task_state == "FAILURE":
                task_status = "failed"
            elif task_state == "REVOKED":
                task_status = "stop"
        else:
            task_status = "running"

    params_json["task_status"] = task_status
    params_json["task_id"] = task.id
    # 根据图谱id获得的名字
    ret_name, obj_name = task_service.getgraphnamebyid(graph_id)
    df = obj_name["df"]
    df = df[0]
    params_json["graph_name"] = df["graph_name"]
    params_json["graph_id"] = graph_id
    params_json["task_type"] = tasktype
    params_json["trigger_type"] = trigger_type
    ret_code, obj = task_service.addtask(params_json)
    task_dao.upKgstatus(graph_id, task_status)
    # 待做 更新配置的状态为不是编辑状态
    return ret_code, obj, task.id


# 执行任务,单独的接口，融合时候也需要调用
@celery_controller_app.route('/buildertask', methods=['POST'])
def task():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        graph_id = params_json.get("graph_id")
        tasktype = params_json.get("tasktype")
        trigger_type = params_json.get("trigger_type", 0)
        # 如果状态是编辑状态则不能执行
        graph_data_dict2 = graph_dao.getbyidandstatus(graph_id)
        invalid_graph_df = task_dao.get_invalid_graph()
        invalid_graph_ids = invalid_graph_df['id'].tolist()
        if graph_id in invalid_graph_ids:
            Logger.log_info(f'task cannot run,the storage address of this graph does not exist,graph_id: {graph_id}')
            return jsonify({'res': {"cause": "invalid storage address",
                                    "code": 500056,
                                    "message": "task cannot run,the storage address of this graph does not exist"},
                            "code": 500})
        # 统计上传中的图谱
        res, code = graph_Service.get_upload_id(graph_id)
        res = res.to_dict('records')
        if len(res) > 0:
            return jsonify({'res': {"cause": "graph upload can not run",
                                    "code": CommonResponseStatus.GRAPH_UPLOAD_NOT_RUN.value,
                                    "message": "task cannot run,the graph upload"},
                            "code": 500})
        graph_data_dict = graph_data_dict2.to_dict('records')
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
                # # 执行任务时，查询redis任务的状态更新
                # task_service.updatetaskstatus(task_data)
                task_data = task_data[0]
                # 获得实时状态
                # task_status = task_service.getredistaskstatus(task_data["task_id"])
                task_status = task_data["task_status"]
                if task_status == "running" or task_status == "waiting":
                    Logger.log_info(f'task cannot run,cause task is runninig or waiting, graph_id: {graph_id}')
                    check_run_once(trigger_type, graph_id)
                    return jsonify({'res': {"cause": "task cannot run,cause task is runninig or waiting",
                                            "code": 500022,
                                            "message": "task cannot run,cause task is runninig or waiting"},
                                    "code": 500})
                # elif task_status == "stop":
                #     # 删除
                #     task_service.deletetask(graph_id)
                #     # 执行
                #     ret_code, obj, task_id = start_task(graph_id)
                #     return jsonify({'res': task_id + " start running", "code": 200})
                else:
                    try:
                        # 把数据插入到历史数据中 并删除，并执行
                        # task_service.addhistory(graph_id, task_data, request.host_url)
                        # 删除
                        task_service.deletetask(None, graph_id)
                        # 执行
                        ret_code, obj, task_id = start_task(graph_id, tasktype, trigger_type, right_task_type)
                        check_run_once(trigger_type, graph_id)
                        return jsonify({'res': task_id + " start running", "code": 200})
                    except Exception as e:
                        err = repr(e)
                        check_run_once(trigger_type, graph_id)
                        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})
            else:
                ret_code, obj, task_id = start_task(graph_id, tasktype, trigger_type, right_task_type)
                check_run_once(trigger_type, graph_id)
                return jsonify({'res': task_id + " start running", "code": 200})
        else:
            check_run_once(trigger_type, graph_id)
            msg = "当前知识图谱尚未完成配置，无法运行任务，请配置完成后重试"
            return jsonify({'res': {"cause": msg, "code": 500001,
                                    "message": msg}, "code": 500})
    except Exception as e:
        err = repr(e)
        check_run_once(trigger_type, graph_id)
        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})


# 获取任务列表
@celery_controller_app.route('/buildertask', methods=['GET'])
def getalltask():
    # 参数由另一个服务处理
    params_json = request.args.to_dict()
    ret_code, obj = task_service.getalltask(params_json)
    return jsonify({'res': obj, "code": ret_code})


# 根据任务id获取任务详情
@celery_controller_app.route('/getdetail', methods=['GET'])
def getdetailbytaskid():
    params_json = request.args.to_dict()
    host_url = getHostUrl()
    graph_id = params_json.get("graph_id")
    ret_code, obj = task_service.getdetailtask(graph_id, host_url)
    return jsonify({'res': obj, "code": ret_code})


# 分页获取历史任务
@celery_controller_app.route('/get_history_task', methods=['GET'])
def gethistorytask():
    params_json = request.args.to_dict()
    ret_code, obj = task_service.gethistorydata(params_json)
    return jsonify({'res': obj, "code": ret_code})


# 根据任务id获取进度
@celery_controller_app.route('/get_task_progress', methods=['GET'])
def getprogressbytaskid():
    try:
        params_json = request.args.to_dict()
        # host_url = getHostUrl()
        graph_id = params_json.get("graph_id")
        # # 获取之前刷新一次
        # import celery_scheduler
        # celery_scheduler.updatedata()
        # 查看graph_id 存在不，并跟新状态
        ret_code, task_data = task_service.get_task_by_graph_id(graph_id)
        # if ret_code == 200:
        if ret_code == 200:
            if len(task_data["df"]) == 0:
                return jsonify({'res': task_data, "code": 200})
            task_df = task_data["df"]
            task_df = task_df[0]
            status = ["graph_baseInfo", "graph_ds", "graph_otl", "graph_InfoExt", "graph_KMap", "graph_KMerge"]
            # task_id = task_df["task_id"]
            # task = buildertask.AsyncResult(task_id)
            task_state = task_dao.getstatusbytaskid(task_df["task_id"])
            if task_state in status:
                if task_state in ["graph_baseInfo", "graph_ds", "graph_otl"]:
                    task_df["task_status"] = "0"
                elif task_state == "graph_InfoExt":
                    task_df["task_status"] = "1"
                else:
                    task_df["task_status"] = "2"
            else:
                if task_state == "FAILURE" or task_state == "REVOKED":
                    task_df["task_status"] = "-1"
                else:
                    task_df["task_status"] = "3"

            obj = {}
            new_list = []
            new_list.append(task_df)
            obj["df"] = new_list
            return jsonify({'res': obj, "code": 200})
        else:
            return jsonify({'res': task_data, "code": 500})
    except Exception as e:
        err = repr(e)
        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})


# 删除任务
@celery_controller_app.route('/delete_task', methods=['DELETE'])
def deletetask():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        graph_id = params_json.get("graph_id")
        # 查看graph_id 存在不，如果不存在执行任务，如果存在，根据状态：执行中和等待中不可以执行，
        # 其他状态可以执行，且把该条数据放到历史记录去，并且查询结束时间放到历史记录
        ret_code, task_data = task_service.get_task_by_graph_id(graph_id)
        if len(task_data["df"]) > 0:
            task_data = task_data["df"]
            # # 执行任务时，查询redis任务的状态更新
            # task_service.updatetaskstatus(task_data)
            task_data = task_data[0]
            # 获得实时状态
            # task_status = task_service.getredistaskstatus(task_data["task_id"])
            task_status = task_data["task_status"]
            task_id = task_data["task_id"]
            graph_id = task_data["graph_id"]
            if task_status == "running" or task_status == "waiting":
                # 停止任务
                cel.control.revoke(task_id, terminate=True)
                # # 更新状态
                # task_service.updatestoptask(task_id)
            # 删除 任务列表
            ret_code, obj = task_service.deletetask(task_id, graph_id)
            if ret_code == 500:
                return jsonify({'res': obj, "code": 500})
        # 删除历史数据
        task_ids = params_json["task_ids"]
        ht_code, ht_obj = task_service.deletehistorytask(task_ids, graph_id)
        if ht_code == 500:
            return jsonify({'res': ht_obj, "code": 500})
        # 删除该配置的状态 不需要了
        # graph_dao.delupdsta(graph_id)
        # if task_status == "normal" or task_status == "failed":
        #     task_dao.upKgstatus(graph_id, task_status)
        # else:
        #     task_dao.upKgstatus(graph_id, "edit")
        return jsonify({'res': "delete task success", "code": 200})
    except Exception as e:
        err = repr(e)
        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})


# 终止任务
@celery_controller_app.route('/stoptask', methods=['POST'])
def taskstop():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        graph_id = params_json.get("graph_id")
        # 查看graph_id 存在不，如果不存在执行任务，如果存在，根据状态：执行中和等待中不可以执行，
        # 其他状态可以执行，且把该条数据放到历史记录去，并且查询结束时间放到历史记录
        ret_code, task_data = task_service.get_task_by_graph_id(graph_id)
        if len(task_data["df"]) > 0:
            task_data = task_data["df"]
            # # 执行任务时，查询redis任务的状态更新
            # task_service.updatetaskstatus(task_data)
            task_data = task_data[0]
            # 获得实时状态
            # task_status = task_service.getredistaskstatus(task_data["task_id"])
            task_status = task_data["task_status"]
            task_id = task_data["task_id"]
            if task_status == "running" or task_status == "waiting":
                # 停止任务
                cel.control.revoke(task_id, terminate=True)
                # 更新状态
                task_service.updatestoptask(task_id)
                # graph_dao.delupdsta(graph_id)
                task_dao.upKgstatus(graph_id, "stop")

                return jsonify({'res': "stop task", "code": 200})
            else:
                return jsonify(
                    {'res': {"cause": "task status cannot stop", "code": 500023, "message": "task status cannot stop"},
                     "code": 500})
        else:
            return jsonify({'res': {"cause": "task cannot exist!", "code": 500024, "message": "task cannot exist!"},
                            "code": 500})
    except Exception as e:
        err = repr(e)
        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})


# 健康检查
@celery_controller_app.route('/graph/health/ready', methods=["GET"], strict_slashes=False)
def health():
    return "success", 200


@celery_controller_app.route('/graph/health/alive', methods=["GET"], strict_slashes=False)
def healthalive():
    return "success", 200

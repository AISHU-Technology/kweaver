# -*-coding:utf-8-*-
# @Time    : 2020/11/9 10:42
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from flask import Blueprint, request, jsonify
import time
from config.config import permission_manage
from utils.CommonUtil import commonutil
from utils.ConnectUtil import redisConnect
from utils.log_info import Logger
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from service.task_Service import task_service
from service.graph_Service import graph_Service
from dao.otl_dao import otl_dao
import requests
from utils.ds_check_parameters import dsCheckParameters
import json
from dao.graph_dao import graph_dao
from service.Otl_Service import otl_service

task_controller_app = Blueprint('task_controller_app', __name__)


def getHostUrl():
    hostUrl = request.host_url
    return hostUrl


# 构建图谱时容量预警消息推送
def graph_capacity_send(url, count):
    params = {}
    params["pushTime"] = int(str(time.time()).split(".")[0])
    params["receiver"] = "manager"
    params["sender"] = "builder"
    params["type"] = "system-cap"
    params["body"] = str(count)
    try:
        response = requests.request("POST", url, data=json.dumps(params))
        if response.status_code == 200:
            mess = "graph capacity send success"
        else:
            mess = "graph capacity send failed"
    except Exception:
        mess = "service error, can't send message"
    return mess


def grapg_capacity_calculate():
    """
    从redis读取图谱容量graph_count，调用接口发送消息
    比较可用容量和剩余容量，容量不足则不能执行任务
    """
    obj = {}
    db = "0"
    result = 0
    r = redisConnect.connect_redis(db, model="read")
    try:
        if r.get("graph_count"):
            res = json.loads(r.get("graph_count"))
            result = res.get("all", 0)

        else:
            result = result

        url = "http://kg-manager:6800/api/manager/v1/message"
        message = graph_capacity_send(url, result)
        Logger.log_info(message)
    except Exception as e:
        Logger.log_error("图谱容量预警发送失败：{}".format(repr(e)))
    if r.get("capacity"):
        capacity = float(r.get("capacity"))
    else:
        capacity = 0

    # capacity = r.get("capacity", 0)
    if result < capacity:
        return 0, obj
    obj = {"cause": "Insufficient available graph capacity;",
           "code": CommonResponseStatus.INSUFFUCIENT_CAPACITY.value,
           "message": "Insufficient capacity! available graph capacity: {}; used graph capacity: {};".format(capacity,
                                                                                                             result)
           }
    return -1, obj


# 执行任务和删除任务
@task_controller_app.route('/<graph_id>', methods=["post", "DELETE"], strict_slashes=False)
def taskcrud(graph_id):
    method = request.method
    # uuid = request.headers.get("uuid")
    print(graph_id)
    if not graph_id.isdigit():
        message = "The parameter graph_id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if method == "POST":
        # 图谱id是否存在
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            check_res, message = dsCheckParameters.buildtaskbyidPar(params_json)
            if check_res != 0:
                Logger.log_error("parameters:%s invalid" % params_json)
                return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                           message=message), CommonResponseStatus.BAD_REQUEST.value
            ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
            Logger.log_error(json.dumps(ret_message))
            # 服务错误, 500001 服务错误， 500021 需要处理，图谱不存在
            if ret_code == CommonResponseStatus.SERVER_ERROR.value:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            # 容量统计校验, 容量不足则不能执行任务
            code, obj = grapg_capacity_calculate()
            if code != 0:
                Logger.log_error(obj["message"])
                return Gview.BuFailVreturn(cause=obj["cause"], code=obj["code"],
                                           message=obj["message"]), CommonResponseStatus.SERVER_ERROR.value
            tasktype = params_json["tasktype"]
            # graph_task_state = graph_dao.getnormaltask(graph_id)
            # if len(graph_task_state) == 0:
            #     tasktype = "full"
            trigger_type = 0

            # 根据graph_id 获取使用数据源类型, rabbitmq数据源时，trigger_type = 2
            re_code, re_obj = graph_Service.get_DataSourceById(graph_id)
            if re_code == 0:
                trigger_type = 2
            else:
                if re_obj:
                    return Gview.BuFailVreturn(cause=re_obj["cause"], code=re_obj["code"],
                                               message=re_obj["message"]), CommonResponseStatus.SERVER_ERROR.value
            # 调用执行
            url = "http://kg-builder:6485/buildertask"
            # payload = "{\"graph_id\":" + graph_id + "  \n ,\"tasktype\":" + '"' + tasktype + '"' + "  \n}"
            payload = {"graph_id": graph_id, "tasktype": tasktype, "trigger_type": trigger_type}
            headers = {
                'Content-Type': 'application/json',
                'uuid': request.headers.get("uuid")

            }
            response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
            # return make_response(jsonify(result=response.text))
            res_json = response.json()
            code = res_json["code"]
            if code == 200:
                return Gview.BuVreturn(message=res_json.get("res")), CommonResponseStatus.SUCCESS.value
            ret_message = res_json["res"]
            Logger.log_error(json.dumps(res_json))
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        else:
            return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value

    # 删除任务
    elif method == "DELETE":
        # 图谱id是否存在
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            check_res, message = dsCheckParameters.deletetaskbyidPar(params_json)
            if check_res != 0:
                Logger.log_error("parameters:%s invalid" % params_json)
                return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                           message=message), CommonResponseStatus.BAD_REQUEST.value
            ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
            # 服务错误, 500001 服务错误， 500021 需要处理，图谱不存在
            if ret_code == CommonResponseStatus.SERVER_ERROR.value:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            task_ids = params_json['task_ids']
            # 调用执行
            url = "http://kg-builder:6485/delete_task"
            payload = {"graph_id": graph_id, "task_ids": task_ids}
            headers = {
                'Content-Type': 'application/json',
                'uuid': request.headers.get("uuid")
            }
            response = requests.request("DELETE", url, headers=headers, data=json.dumps(payload))
            res_json = response.json()
            code = res_json["code"]
            ret_message = res_json["res"]
            obj = {}
            obj["res"] = ret_message
            if code == 200:
                return obj, CommonResponseStatus.SUCCESS.value
            Logger.log_error(json.dumps(res_json))
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        else:
            return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


# 任务列表通过id获得详情
# @task_controller_app.route('/getdetail/<graph_id>', methods=["GET"], strict_slashes=False)
def getdetailtask(graph_id):
    method = request.method
    if not graph_id.isdigit():
        message = "The parameter graph_id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if method == "GET":
        # 图谱id是否存在
        ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
        # 服务错误, 500001 服务错误， 500021 需要处理，图谱不存在
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        url = "http://kg-builder:6485/getdetail?graph_id=" + graph_id + ""
        payload = {}
        headers = {"uuid": request.headers.get("uuid")}
        response = requests.request("GET", url, headers=headers, data=payload)
        res_json = response.json()
        code = res_json["code"]
        ret_message = res_json["res"]
        if code == 200:
            return ret_message, CommonResponseStatus.SUCCESS.value
        Logger.log_error(json.dumps(res_json))
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value


# 分页获取任务列表
@task_controller_app.route('/<graph_id>', methods=["GET"], strict_slashes=False)
def getalltask(graph_id):
    uuid = request.headers.get("uuid")
    if not graph_id.isdigit():
        error_link = ""
        detail = "The parameter graph_id type must be int!"
        code = CommonResponseStatus.PARAMETERS_ERROR.value
        desc = "invalid parameter graph_id"
        solution = "Please check your parameter"
        return Gview.TErrorreturn(code, desc, solution, detail,
                                  error_link), CommonResponseStatus.BAD_REQUEST.value
    # 图谱id是否存在
    ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
    # 服务错误, 500001 服务错误， 500021 需要处理，图谱不存在
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        error_link = ""
        detail = ret_message["cause"]
        code = ret_message["code"]
        desc = ret_message["message"]
        solution = ret_message["solution"]
        return Gview.TErrorreturn(code, desc, solution, detail,
                                  error_link), CommonResponseStatus.SERVER_ERROR.value
    param_code, params_json, param_message = commonutil.getMethodParam()
    check_res, message = dsCheckParameters.searchtaskbynamePar(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        error_link = ""
        solution = "Please chech your parameters"
        return Gview.TErrorreturn(CommonResponseStatus.PARAMETERS_ERROR.value, message, solution, message,
                                  error_link), CommonResponseStatus.BAD_REQUEST.value
    params = ["page", "size", "order", "graph_name", "status", "task_type", "trigger_type"]
    payload = {"graph_id": graph_id}
    for k in params:
        payload[k] = params_json[k]
    url = "http://kg-builder:6485/buildertask"
    if permission_manage:
        payload['uuid'] = uuid
    headers = {"uuid": uuid}
    response = requests.request("GET", url, headers=headers, params=payload)
    print(f"url={response.url}")
    res_json = response.json()
    code = res_json["code"]
    ret_message = res_json["res"]
    if code == 200:
        return ret_message, CommonResponseStatus.SUCCESS.value
    Logger.log_error(json.dumps(res_json))
    error_link = ""
    solution = ret_message.get("solution", "")
    desc = ret_message["message"]
    code = ret_message["code"]
    detail = ret_message["cause"]
    return Gview.TErrorreturn(code, desc, solution, detail,
                              error_link), CommonResponseStatus.SERVER_ERROR.value


# 终止任务
@task_controller_app.route('/stoptask/<graph_id>', methods=["POST"], strict_slashes=False)
def stoptask(graph_id):
    method = request.method
    print(graph_id)
    if not graph_id.isdigit():
        message = "The parameter graph_id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if method == "POST":
        # 调用执行
        url = "http://kg-builder:6485/stoptask"
        payload = "{\"graph_id\":" + graph_id + "  \n}"
        headers = {
            'Content-Type': 'application/json',
            'uuid': request.headers.get("uuid")
        }
        response = requests.request("POST", url, headers=headers, data=payload)
        # return make_response(jsonify(result=response.text))
        res_json = response.json()
        code = res_json["code"]
        ret_message = res_json["res"]
        obj = {}
        obj["res"] = ret_message
        if code == 200:
            return obj, CommonResponseStatus.SUCCESS.value
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value


# 获取任务进度
@task_controller_app.route('/get_progress/<graph_id>', methods=["GET"], strict_slashes=False)
def getprogress(graph_id):
    method = request.method
    print(graph_id)
    if not graph_id.isdigit():
        message = "The parameter graph_id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if method == "GET":
        # 图谱id是否存在
        ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
        # 服务错误, 500001 服务错误， 500021 需要处理，图谱不存在
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        # 调用执行
        url = "http://kg-builder:6485/get_task_progress?graph_id=" + graph_id + ""
        payload = {}
        headers = {'uuid': request.headers.get("uuid")}
        response = requests.request("GET", url, headers=headers, data=payload)
        # return make_response(jsonify(result=response.text))
        res_json = response.json()
        code = res_json["code"]
        ret_message = res_json["res"]
        obj = {}
        obj["res"] = ret_message
        if code == 200:
            return obj, CommonResponseStatus.SUCCESS.value
        Logger.log_error(json.dumps(res_json))
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value


# 获得历史数据,此接口已取消，任务和历史任务全部合并到了任务接口获取
# @task_controller_app.route('/get_history_data/<graph_id>', methods=["GET"], strict_slashes=False)
def gethistort(graph_id):
    method = request.method
    if not graph_id.isdigit():
        error_link = ""
        detail = "The parameter graph_id type must be int!"
        code = CommonResponseStatus.PARAMETERS_ERROR.value
        desc = "invalid parameter graph_id"
        solution = "Please check your parameter"
        return Gview.TErrorreturn(code, desc, solution, detail,
                                  error_link), CommonResponseStatus.BAD_REQUEST.value
    if method == "GET":
        # 图谱id是否存在
        ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
        # 服务错误, 500001 服务错误， 500021 需要处理，图谱不存在
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            error_link = ""
            detail = ret_message["cause"]
            code = ret_message["code"]
            desc = ret_message["message"]
            solution = ret_message["solution"]
            return Gview.TErrorreturn(code, desc, solution, detail,
                                      error_link), CommonResponseStatus.SERVER_ERROR.value
        param_code, params_json, param_message = commonutil.getMethodParam()
        check_res, message = dsCheckParameters.getAllPar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            Logger.log_error(json.dumps(message))
            solution = "Please check parameters"
            code = CommonResponseStatus.PARAMETERS_ERROR.value
            desc = "parameters error"
            error_link = ""
            return Gview.TErrorreturn(code, desc, solution, message,
                                      error_link), CommonResponseStatus.BAD_REQUEST.value
        page = params_json["page"]
        size = params_json["size"]
        order = params_json["order"]
        task_type = params_json.get("task_type", 'all')
        trigger_type = params_json.get("trigger_type", 'all')
        task_status = params_json.get("task_status", 'all')
        url = "http://kg-builder:6485/get_history_task"
        print(url)
        payload = {"page": page, "size": size, "order": order, "graph_id": graph_id, "task_type": task_type,
                   "trigger_type": trigger_type, "task_status": task_status}
        headers = {'uuid': request.headers.get("uuid")}
        response = requests.request("GET", url, headers=headers, params=payload)
        res_json = response.json()
        code = res_json["code"]
        ret_message = res_json["res"]
        if code == 200:
            return ret_message, CommonResponseStatus.SUCCESS.value
        return Gview.TErrorreturn(ret_message["code"], ret_message["message"], ret_message["solution"],
                                  ret_message["cause"], "error_link"), CommonResponseStatus.SERVER_ERROR.value


# 正在运行的任务的数量
# @task_controller_app.route('/get_run_task_num', methods=["GET"], strict_slashes=False)
def getruntasknum():
    url = "http://kg-builder:6485/get_run_task"
    uuid = request.headers.get("uuid")
    payload = {}
    headers = {"uuid": uuid}
    response = requests.request("GET", url, headers=headers, data=payload)
    res_json = response.json()
    code = res_json["code"]
    ret_message = res_json["res"]
    if code == 200:
        return ret_message, CommonResponseStatus.SUCCESS.value
    Logger.log_error(json.dumps(res_json))
    return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                               message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value


# 健康检查 /api/builder/v1/task/health/ready
@task_controller_app.route('/health/ready', methods=["GET"], strict_slashes=False)
def health():
    # return "success", CommonResponseStatus.SUCCESS.value
    try:
        url = "http://localhost:6485/graph/health/ready"
        payload = {}
        headers = {'uuid': request.headers.get("uuid")}
        response = requests.request("GET", url, headers=headers, data=payload)
        code = response.status_code
        print("6485 端口服务状态：" + str(code))

        url_otl = "http://localhost:6488/onto/health/ready"
        response_otl = requests.request("GET", url_otl, headers=headers, data=payload)
        code_otl = response_otl.status_code
        print("6488 端口服务状态：" + str(code))
        if code_otl == 200 and code == 200:
            return "success", CommonResponseStatus.SUCCESS.value
        return "failed", CommonResponseStatus.SERVER_ERROR.value
    except Exception:
        return "failed", CommonResponseStatus.SERVER_ERROR.value


@task_controller_app.route('/health/alive', methods=["GET"], strict_slashes=False)
def healthalive():
    # return "success", CommonResponseStatus.SUCCESS.value
    try:
        url = "http://localhost:6485/graph/health/alive"
        payload = {}
        headers = {'uuid': request.headers.get("uuid")}
        response = requests.request("GET", url, headers=headers, data=payload)
        code = response.status_code
        print("6485 端口服务状态：" + str(code))

        url_otl = "http://localhost:6488/onto/health/alive"
        response_otl = requests.request("GET", url_otl, headers=headers, data=payload)
        code_otl = response_otl.status_code
        print("6488 端口服务状态：" + str(code))
        if code_otl == 200 and code == 200:
            return "success", CommonResponseStatus.SUCCESS.value
        return Gview.BuFailVreturn(cause="failed", code=50000,
                                   message="failed"), CommonResponseStatus.SERVER_ERROR.value
    except Exception:
        return "failed", CommonResponseStatus.SERVER_ERROR.value

# # 健康检查 /api/builder/v1/task/tb/health/ready
# # /api/builder/v1/onto/task/health/ready
# @task_controller_app.route('/tb/health/ready', methods=["GET"], strict_slashes=False)
# def healthtb():
#     url = "http://localhost:6485/health/ready"
#     payload = {}
#     headers = {}
#     response = requests.request("GET", url, headers=headers, data=payload)
#     res_json = response.json()
#     code = res_json["code"]
#     ret_message = res_json["res"]
#     if code == 200:
#         return ret_message, CommonResponseStatus.SUCCESS.value
#     Logger.log_error(json.dumps(res_json))
#     return Gview.BuFailVreturn(cause="failed", code=50000,
#                                message="failed"), CommonResponseStatus.SERVER_ERROR.value
#
# @task_controller_app.route('/tb/health/alive', methods=["GET"], strict_slashes=False)
# def healthalivetb():
#     url = "http://localhost:6485/health/alive"
#     payload = {}
#     headers = {}
#     response = requests.request("GET", url, headers=headers, data=payload)
#     res_json = response.json()
#     code = res_json["code"]
#     ret_message = res_json["res"]
#     if code == 200:
#         return ret_message, CommonResponseStatus.SUCCESS.value
#     Logger.log_error(json.dumps(res_json))
#     return Gview.BuFailVreturn(cause="failed", code=50000,
#                                message="failed"), CommonResponseStatus.SERVER_ERROR.value

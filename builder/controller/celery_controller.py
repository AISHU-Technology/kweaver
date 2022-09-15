# -*-coding:utf-8-*-
from flask import Blueprint, request, jsonify
import time
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
from flasgger import swag_from
import yaml
import os

task_controller_app = Blueprint('task_controller_app', __name__)


GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH', os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_old_response.yaml'), 'r') as f:
    swagger_old_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_old_response.update(swagger_definitions)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)

@task_controller_app.route('/<graph_id>', methods=["post"], strict_slashes=False)
@swag_from(swagger_old_response)
def taskcrud_post(graph_id):
    '''
    execute the task of building the graph
    execute the task of building the graph
    ---
    parameters:
        -   name: 'graph_id'
            in: 'path'
            required: True
            description: 'graph id'
            type: 'integer'
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/celery_task/taskcrud_post'
    '''
    print(graph_id)
    if not graph_id.isdigit():
        message = "The parameter graph_id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
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
        url = "http://kw-builder:6485/buildertask"
        payload = {"graph_id": graph_id, "tasktype": tasktype, "trigger_type": trigger_type}
        headers = {
            'Content-Type': 'application/json',
        }
        response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
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


@task_controller_app.route('/<graph_id>', methods=["DELETE"], strict_slashes=False)
@swag_from(swagger_old_response)
def taskcrud_delete(graph_id):
    '''
    delete the task of building the graph
    delete the task of building the graph
    ---
    parameters:
        -   name: 'graph_id'
            in: 'path'
            required: True
            description: 'graph id'
            type: 'integer'
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/celery_task/taskcrud_delete'
    '''
    print(graph_id)
    if not graph_id.isdigit():
        message = "The parameter graph_id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
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
        url = "http://kw-builder:6485/delete_task"
        payload = {"graph_id": graph_id, "task_ids": task_ids}
        headers = {
            'Content-Type': 'application/json'
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

@task_controller_app.route('/<graph_id>', methods=["GET"], strict_slashes=False)
@swag_from(swagger_new_response)
def getalltask(graph_id):
    '''
    get task list by page
    paging to get the task list of the knowledge graph
    ---
    parameters:
        -   name: graph_id
            in: path
            required: true
            description: graph id
            type: integer
        -   name: page
            in: query
            required: true
            description: page
            type: integer
        -   name: size
            in: query
            required: true
            description: number per page
            type: integer
        -   name: order
            in: query
            required: true
            description: "'descend': newest on the top; 'ascend': else"
            type: string
        -   name: status
            in: query
            required: true
            description: "task status. 'all'(default): query all; other options: 'normal', 'running', 'waiting', 'failed', 'stop'"
            type: string
        -   name: graph_name
            in: query
            required: true
            description: fuzzy search by name, not filled by default, returns all data
            type: string
        -   name: task_type
            in: query
            required: true
            description: "task type. 'all'(default): query all; other options: 'full', 'increment'"
            type: string
        -   name: trigger_type
            in: query
            required: true
            description: "trigger method. 'all'(default): query all; '0': manual triggering, '1': timed automatic triggering, '2': real-time triggering"
            type: string
    '''
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
    url = "http://kw-builder:6485/buildertask"
    response = requests.request("GET", url, params=payload)
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


@task_controller_app.route('/stoptask/<graph_id>', methods=["POST"], strict_slashes=False)
@swag_from(swagger_old_response)
def stoptask(graph_id):
    '''
    terminate the task of building the graph
    terminate the task of building the graph
    ---
    parameters:
        -   name: graph_id
            in: path
            required: true
            description: graph id
            type: integer
    '''
    method = request.method
    print(graph_id)
    if not graph_id.isdigit():
        message = "The parameter graph_id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if method == "POST":
        # 调用执行
        url = "http://kw-builder:6485/stoptask"
        payload = "{\"graph_id\":" + graph_id + "  \n}"
        headers = {
            'Content-Type': 'application/json'
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


@task_controller_app.route('/get_progress/<graph_id>', methods=["GET"], strict_slashes=False)
@swag_from(swagger_old_response)
def getprogress(graph_id):
    '''
    get task progress
    get the progress of the knowledge graph construction task
    ---
    parameters:
        -   name: graph_id
            in: path
            required: true
            description: graph id
            type: integer
    '''
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
        url = "http://kw-builder:6485/get_task_progress?graph_id=" + graph_id + ""
        payload = {}
        response = requests.request("GET", url, data=payload)
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


# 健康检查 /api/builder/v1/task/health/ready
@task_controller_app.route('/health/ready', methods=["GET"], strict_slashes=False)
@swag_from(swagger_definitions)
def health():
    '''
    health detection
    service health check
    ---
    responses:
        '200':
            description: success
    '''
    try:
        url = "http://localhost:6485/graph/health/ready"
        payload = {}
        response = requests.request("GET", url, data=payload)
        code = response.status_code
        print("6485 端口服务状态：" + str(code))

        url_otl = "http://localhost:6488/onto/health/ready"
        response_otl = requests.request("GET", url_otl, data=payload)
        code_otl = response_otl.status_code
        print("6488 端口服务状态：" + str(code))
        if code_otl == 200 and code == 200:
            return "success", CommonResponseStatus.SUCCESS.value
        return "failed", CommonResponseStatus.SERVER_ERROR.value
    except Exception:
        return "failed", CommonResponseStatus.SERVER_ERROR.value


@task_controller_app.route('/health/alive', methods=["GET"], strict_slashes=False)
@swag_from(swagger_definitions)
def healthalive():
    '''
    health detection
    service health detection
    ---
    responses:
        '200':
            description: success
    '''
    try:
        url = "http://localhost:6485/graph/health/alive"
        payload = {}
        response = requests.request("GET", url, data=payload)
        code = response.status_code
        print("6485 端口服务状态：" + str(code))

        url_otl = "http://localhost:6488/onto/health/alive"
        response_otl = requests.request("GET", url_otl, data=payload)
        code_otl = response_otl.status_code
        print("6488 端口服务状态：" + str(code))
        if code_otl == 200 and code == 200:
            return "success", CommonResponseStatus.SUCCESS.value
        return Gview.BuFailVreturn(cause="failed", code=50000,
                                   message="failed"), CommonResponseStatus.SERVER_ERROR.value
    except Exception:
        return "failed", CommonResponseStatus.SERVER_ERROR.value

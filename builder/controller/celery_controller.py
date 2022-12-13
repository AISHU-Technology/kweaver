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
from common.errorcode.gview import Gview as Gview2
from common.errorcode import codes
from utils.celery_check_params_json import celery_check_params
from flask_babel import gettext as _l

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
def execute_task(graph_id):
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
                $ref: '#/definitions/builder/celery_task/execute_task'
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
        # url = "http://localhost:6486/buildertask"  # for debug
        payload = {"graph_id": graph_id, "tasktype": tasktype, "trigger_type": trigger_type}
        headers = {
            'Content-Type': 'application/json',
            'Accept-Language': request.headers.get('Accept-Language')
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


@task_controller_app.route('/batch/<graph_id>', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def batch_execute_task(graph_id):
    '''
    execute the task of building the graph in batches
    execute the task of building the graph in batches
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
                $ref: '#/definitions/builder/celery_task/batch_execute_task'
    '''
    try:
        # check parameters validation
        if not graph_id.isdigit():
            message = _l("The parameter graph_id must be int!")
            code = codes.Builder_CeleryController_BatchExecuteTask_ParamError
            return Gview2.error_return(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_CeleryController_BatchExecuteTask_ParamError
            return Gview2.error_return(code, message=param_message), 400
        param_code, param_message = celery_check_params.batch_build(params_json)
        if param_code != celery_check_params.VALID:
            code = codes.Builder_CeleryController_BatchExecuteTask_ParamError
            return Gview2.error_return(code, message=param_message), 400
        # check whether graph id exists
        ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            code = codes.Builder_CeleryController_BatchExecuteTask_GraphIdNotExist
            return Gview2.error_return(code, graph_id=graph_id), 500

        # execute batch task
        subgraph_ids = params_json['subgraph_ids']
        write_mode = params_json['write_mode']
        url = "http://kw-builder:6485/builder_task/batch"
        # url = "http://localhost:6486/builder_task/batch"  # for debug
        headers = {'Content-Type': 'application/json',
                   'Accept-Language': request.headers.get('Accept-Language')}
        payload = {"graph_id": graph_id,
                   "subgraph_ids": subgraph_ids,
                   "write_mode": write_mode}
        res = requests.request("POST", url, headers=headers, data=json.dumps(payload))
        return res.json(), res.status_code
    except Exception as e:
        code = codes.Builder_CeleryController_BatchExecuteTask_UnknownError
        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@task_controller_app.route('/delete/<graph_id>', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def delete_task(graph_id):
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
                $ref: '#/definitions/builder/celery_task/delete_task'
    '''
    try:
        if not graph_id.isdigit():
            message = _l("The parameter graph_id type must be int!")
            code = codes.Builder_CeleryController_DeleteTask_ParamError
            return Gview2.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_CeleryController_DeleteTask_ParamError
            return Gview2.TErrorreturn(code, message=param_message), 400
        check_res, message = dsCheckParameters.deletetaskbyidPar(params_json)
        if check_res != 0:
            code = codes.Builder_CeleryController_DeleteTask_ParamError
            return Gview2.TErrorreturn(code, message=message), 400
        ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            code = codes.Builder_CeleryController_DeleteTask_GraphIdNotExist
            return Gview2.TErrorreturn(code, graph_id=graph_id), 500

        task_ids = params_json['task_ids']
        # 调用执行
        url = "http://kw-builder:6485/delete_task"
        # url = "http://localhost:6486/delete_task"  # for debug
        payload = {"graph_id": graph_id, "task_ids": task_ids}
        headers = {
            'Content-Type': 'application/json',
            'Accept-Language': request.headers.get('Accept-Language')
        }
        response = requests.request("DELETE", url, headers=headers, data=json.dumps(payload))
        return response.json(), response.status_code
    except Exception as e:
        code = codes.Builder_CeleryController_DeleteTask_UnknownError
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500

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
            description: "'desc': newest on the top; 'asc': else"
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
    try:
        if not graph_id.isdigit():
            message = _l("The parameter graph_id type must be int!")
            code = codes.Builder_CeleryController_GetAllTask_ParamError
            return Gview2.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        check_res, message = dsCheckParameters.searchtaskbynamePar(params_json)
        if check_res != 0:
            code = codes.Builder_CeleryController_GetAllTask_ParamError
            return Gview2.TErrorreturn(code, message=message), 400
        # 图谱id是否存在
        ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            code = codes.Builder_CeleryController_GetAllTask_GraphIdNotExist
            return Gview2.TErrorreturn(code, graph_id=graph_id), 500
        params = ["page", "size", "order", "graph_name", "status", "task_type", "trigger_type"]
        payload = {"graph_id": graph_id}
        for k in params:
            payload[k] = params_json[k]
        url = "http://kw-builder:6485/buildertask"
        # url = "http://localhost:6486/buildertask"  # for debug
        headers = {'Accept-Language': request.headers.get('Accept-Language')}
        response = requests.request("GET", url, params=payload, headers=headers)
        return response.json(), response.status_code
    except Exception as e:
        code = codes.Builder_CeleryController_GetAllTask_UnknownError
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


@task_controller_app.route('/stoptask', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def stoptask():
    '''
    terminate the task of building the graph
    If the parameter is graph_id, terminate all tasks of the graph. If the parameter is task_id, terminate the task.
    Parameters cannot be both graph_id and task_id.
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/celery_task/stoptask'
    '''
    try:
        # parameter check
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_CeleryController_StopTask_ParamError
            return Gview2.TErrorreturn(code, message=param_message), 400
        graph_id = params_json.get('graph_id')
        task_id = params_json.get('task_id')
        if graph_id and task_id:
            message = _l('parameters cannot be both graph_id and task_id.')
            code = codes.Builder_CeleryController_StopTask_ParamError
            return Gview2.TErrorreturn(code, message=message), 400
        elif graph_id:
            if type(graph_id) != int:
                message = _l('graph_id must be int.')
                code = codes.Builder_CeleryController_StopTask_ParamError
                return Gview2.TErrorreturn(code, message=message), 400
            elif graph_id <= 0:
                message = _l('graph_id must be larger than zero.')
                code = codes.Builder_CeleryController_StopTask_ParamError
                return Gview2.TErrorreturn(code, message=message), 400
        elif task_id:
            if type(task_id) != int:
                message = _l('task_id must be int.')
                code = codes.Builder_CeleryController_StopTask_ParamError
                return Gview2.TErrorreturn(code, message=message), 400
            elif task_id <= 0:
                message = _l('task_id must be larger than zero.')
                code = codes.Builder_CeleryController_StopTask_ParamError
                return Gview2.TErrorreturn(code, message=message), 400
        else:
            message = _l('parameter must be graph_id or task_id.')
            code = codes.Builder_CeleryController_StopTask_ParamError
            return Gview2.TErrorreturn(code, message=message), 400

        # 调用执行
        url = "http://kw-builder:6485/stoptask"
        # url = "http://localhost:6486/stoptask"  # for debug
        headers = {'Accept-Language': request.headers.get('Accept-Language')}
        response = requests.request("POST", url, json=params_json, headers=headers)
        return response.json(), response.status_code
    except Exception as e:
        code = codes.Builder_CeleryController_StopTask_UnknownError
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


@task_controller_app.route('/get_progress/<task_id>', methods=["GET"], strict_slashes=False)
@swag_from(swagger_new_response)
def getprogress(task_id):
    '''
    get task progress
    get the progress of the knowledge graph construction task
    ---
    parameters:
        -   name: task_id
            in: path
            required: true
            description: graph history task id
            type: integer
    '''
    try:
        if not task_id.isdigit():
            code = codes.Builder_CeleryController_GetProgress_ParamError
            return Gview2.TErrorreturn(code), 400

        # 调用执行
        url = "http://kw-builder:6485/get_task_progress"
        # url = "http://localhost:6486/get_task_progress"  # for debug
        headers = {'Accept-Language': request.headers.get('Accept-Language')}
        response = requests.request("GET", url, params={'task_id': task_id}, headers=headers)
        return response.json(), response.status_code
    except Exception as e:
        code = codes.Builder_CeleryController_GetProgress_UnknownError
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


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


@task_controller_app.route('/subgraph/<task_id>', methods=["GET"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_subgraph_config(task_id):
    '''
    query sub graph by task id
    query sub graph by task id
    ---
    parameters:
        -   in: path
            name: task_id
            description: task_id
            required: true
            type: integer
    '''
    try:
        # check task_id
        if not task_id.isdigit():
            message = _l("parameter task_id must be int!")
            code = codes.Builder_CeleryController_GetSubgraphConfig_ParamError
            return Gview2.error_return(code, message=message), 400
        if task_id == "0":
            message = _l("parameter task_id cannot be 0!")
            code = codes.Builder_CeleryController_GetSubgraphConfig_ParamError
            return Gview2.error_return(code, message=message), 400

        code, res = task_service.get_subgraph_config(task_id)
        if code != codes.successCode:
            return res, 500
        return Gview2.json_return(res), 200
    except Exception as e:
        code = codes.Builder_CeleryController_GetSubgraphConfig_UnknownError
        return Gview2.error_return(code, description=str(e), cause=str(e)), 500

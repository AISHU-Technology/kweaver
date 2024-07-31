# -*-coding:utf-8-*-
import json
import os
import sys
import time
import traceback

import requests
import yaml
from flasgger import swag_from
from flask import Blueprint, request
from flask_babel import gettext as _l
from jsonschema import validate, ValidationError

import common.stand_log as log_oper
from common.errorcode import codes
from common.errorcode.gview import Gview as Gview2
from service.graph_Service import graph_Service
from service.task_Service import task_service
from utils.CommonUtil import commonutil
from utils.Gview import Gview
from utils.celery_check_params_json import celery_check_params
from utils.common_response_status import CommonResponseStatus
from utils.ds_check_parameters import dsCheckParameters
from utils.log_info import Logger

task_controller_app = Blueprint('task_controller_app', __name__)


GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH',
                               os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r', encoding='utf-8') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_old_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_old_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_old_response.update(swagger_definitions)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)


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


@task_controller_app.route('/add/<graph_id>', methods=["post"], strict_slashes=False)
@swag_from(swagger_old_response)
def execute_task(graph_id):
    '''
    执行图谱构建任务
    执行图谱构建任务
    ---
    operationId: execute_task
    parameters:
        -   name: 'graph_id'
            in: 'path'
            required: True
            description: '图谱配置id'
            schema:
                type: 'integer'
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - task_type
                    properties:
                        task_type:
                            type: string
                            format: string
                            description: '任务构建类型，full(全量构建)，increment(增量构建)'
                            example: full
    responses:
      '200':
        description: 操作成功
        content:
            application/json:
                schema:
                    $ref: '#/components/schemas/builder.celery_task.execute_task_response200'
    '''
    Logger.log_info(graph_id)
    if not graph_id.isdigit():
        message = _l("The parameter graph_id type must be int!")
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    # 图谱id是否存在
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = dsCheckParameters.buildtaskbyidPar(params_json)
        if check_res != 0:
            Logger.log_info("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
        Logger.log_info(json.dumps(ret_message))
        # 服务错误, 500001 服务错误， 500021 需要处理，图谱不存在
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value

        task_type = params_json["task_type"]
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
        url = "http://localhost:6485/buildertask"
        # url = "http://10.4.37.76:6485/buildertask"  # debug
        payload = {"graph_id": graph_id, "task_type": task_type, "trigger_type": trigger_type}
        headers = {
            'Content-Type': 'application/json',
            'userId': request.headers.get("userId"),
            'Accept-Language': request.headers.get('Accept-Language')
        }
        response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
        # return make_response(jsonify(result=response.text))
        res_json = response.json()
        code = res_json["code"]
        if code == 200:
            graph_task_id = None
            code, graph_task = task_service.get_task_by_graph_id(graph_id)
            if code == CommonResponseStatus.SUCCESS.value:
                graph_task_id = graph_task['df'][0]['id']
            res = {
                "graph_task_id": graph_task_id
            }

            user_name = request.headers.get("username")
            operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, graph_id, {},
                                                       "为知识图谱{id=%s}创建构建任务" % graph_id)

            Logger.log_info(operation_log)
            return {"res": res}, CommonResponseStatus.SUCCESS.value
        ret_message = res_json["res"]
        error_log = log_oper.get_error_log(json.dumps(res_json), sys._getframe())
        Logger.log_error(error_log)
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@task_controller_app.route('/batch_add/<graph_id>', methods=["post"], strict_slashes=False)
# @swag_from(swagger_new_response)
def batch_execute_task(graph_id):
    '''
    execute the task of building the graph in batches
    execute the task of building the graph in batches
    # ---
    # parameters:
    #     -   name: 'graph_id'
    #         in: 'path'
    #         required: True
    #         description: 'graph id'
    #         type: 'integer'
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.celery_task.batch_execute_task'
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
        flag = params_json['flag']
        url = "http://localhost:6485/builder_task/batch"
        # url = "http://10.4.37.76:6485/builder_task/batch"  # for debug
        headers = {'Content-Type': 'application/json',
                   'Accept-Language': request.headers.get('Accept-Language'),
                   'userId': request.headers.get("userId")}
        payload = {"graph_id": graph_id, "subgraph_ids": subgraph_ids, "write_mode": write_mode, "flag": flag}
        res = requests.request("POST", url, headers=headers, data=json.dumps(payload))
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, graph_id, params_json,
                                                   "为知识图谱{id=%s}创建分组构建任务" % graph_id)
        Logger.log_info(operation_log)
        return res.json(), res.status_code
    except Exception as e:
        code = codes.Builder_CeleryController_BatchExecuteTask_UnknownError
        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@task_controller_app.route('/delete/<graph_id>', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def delete_task(graph_id):
    '''
    delete the task of building the graph
    delete the task of building the graph
    # ---
    # parameters:
    #     -   name: 'graph_id'
    #         in: 'path'
    #         required: True
    #         description: 'graph id'
    #         type: 'integer'
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.celery_task.delete_task'
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
        url = "http://localhost:6485/delete_task"
        # url = "http://10.4.37.76:6485/delete_task"  # for debug
        payload = {"graph_id": graph_id, "task_ids": task_ids}
        headers = {
            'Content-Type': 'application/json',
            'Accept-Language': request.headers.get('Accept-Language')
        }
        response = requests.request("DELETE", url, headers=headers, data=json.dumps(payload))
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, graph_id, params_json,
                                                   "为知识图谱{id=%s}删除构建任务" % graph_id)
        Logger.log_info(operation_log)
        return response.json(), response.status_code
    except Exception as e:
        code = codes.Builder_CeleryController_DeleteTask_UnknownError
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


@task_controller_app.route('/page/<graph_id>', methods=["GET"], strict_slashes=False)
@swag_from(swagger_new_response)
def getalltask(graph_id):
    '''
        分页获取图谱构建任务列表
        分页获取图谱构建任务列表
        ---
        operationId: getalltask
        parameters:
            -   name: graph_id
                in: path
                required: true
                description: 图谱配置id；可由 根据知识网络获取图谱信息接口 获取
                schema:
                    type: integer
            -   name: page
                in: query
                required: true
                description: 页码
                schema:
                    type: integer
            -   name: size
                in: query
                required: true
                description: 每页数量
                schema:
                    type: integer
            -   name: order
                in: query
                required: true
                description: "默认按照开始时间从新至旧排序，接受参数为：'desc'（从新到旧），'asc'（从旧到新）"
                schema:
                    type: string
            -   name: rule
                in: query
                description: 排序字段，可选值: start_time, end_time
                required: true
                schema:
                    type: 'string'
            -   name: status
                in: query
                required: true
                description: "默认all ,查询所有的，'normal'(正常), 'running'(运行中), 'waiting'(待运行), 'failed'(失败), 'stop'(中止)"
                schema:
                    type: string
            -   name: graph_name
                in: query
                required: true
                description: 对图谱名称进行模糊搜索，默认不填，返回所有数据
                schema:
                    type: string
            -   name: task_type
                in: query
                required: true
                description: "任务类型，默认all ,查询所有的，full(全量构建)，increment(增量构建)"
                schema:
                    type: string
            -   name: trigger_type
                in: query
                required: true
                description: "图谱触发方式，默认all 查询所有的，0：手动触发的图谱，1：定时自动触发的图谱，2：实时触发的图谱"
                schema:
                    type: string
        responses:
            '200':
                description: 操作成功
                content:
                    application/json:
                        schema:
                            $ref: '#/components/schemas/builder.celery_task.getalltask_response200'
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
        params = ["page", "size", "order", 'rule', "graph_name", "status", "task_type", "trigger_type"]
        payload = {"graph_id": graph_id}
        for k in params:
            payload[k] = params_json[k]
        url = "http://localhost:6485/buildertask"
        # url = "http://10.4.37.76:6485/buildertask"  # for debug
        headers = {'Accept-Language': request.headers.get('Accept-Language'),
                   'userId': request.headers.get("userId")}
        response = requests.request("GET", url, params=payload, headers=headers)
        return response.json(), response.status_code
    except Exception as e:
        error_log = log_oper.get_error_log("get task list error info: {}".format(e), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_CeleryController_GetAllTask_UnknownError
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


@task_controller_app.route('/stop', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def stoptask():
    '''
    终止任务
    传参只能为graph_id与task_id二者其一。如果传参为graph_id，终止该图谱下的所有任务；如果传参为task_id，终止该任务。
    ---
    operationId: stoptask
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    type: 'object'
                    properties:
                        graph_id:
                            type: integer
                            description: 图谱配置id
                            example: 1
                        task_id:
                            type: integer
                            description: 图谱历史任务id
                            example: 1
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
        url = "http://localhost:6485/stoptask"
        # url = "http://10.4.37.76:6485/stoptask"  # for debug
        headers = {'Accept-Language': request.headers.get('Accept-Language')}
        response = requests.request("POST", url, json=params_json, headers=headers)
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, graph_id, params_json,
                                                   "为知识图谱{id=%s}暂停构建任务{id=%s}" % (graph_id, task_id))
        Logger.log_info(operation_log)
        return response.json(), response.status_code
    except Exception as e:
        code = codes.Builder_CeleryController_StopTask_UnknownError
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


# 健康检查 /api/builder/v1/task/health/ready
@task_controller_app.route('/health/ready', methods=["GET"], strict_slashes=False)
# @swag_from(swagger_definitions)
def health():
    '''
    health detection
    service health check
    # ---
    # responses:
    #     '200':
    #         description: success
    '''
    try:
        url = "http://localhost:6485/graph/health/ready"
        payload = {}
        headers = {'userId': request.headers.get("userId")}
        response = requests.request("GET", url, headers=headers, data=payload)
        code = response.status_code
        Logger.log_info("6485 端口服务状态：" + str(code))

        url_otl = "http://localhost:6488/onto/health/ready"
        response_otl = requests.request("GET", url_otl, headers=headers, data=payload)
        code_otl = response_otl.status_code
        Logger.log_info("6488 端口服务状态：" + str(code))
        if code_otl == 200 and code == 200:
            return "success", CommonResponseStatus.SUCCESS.value
        return "failed", CommonResponseStatus.SERVER_ERROR.value
    except Exception:
        return "failed", CommonResponseStatus.SERVER_ERROR.value


@task_controller_app.route('/health/alive', methods=["GET"], strict_slashes=False)
# @swag_from(swagger_definitions)
def healthalive():
    '''
    health detection
    service health detection
    # ---
    # responses:
    #     '200':
    #         description: success
    '''
    try:
        url = "http://localhost:6485/graph/health/alive"
        payload = {}
        headers = {'userId': request.headers.get("userId")}
        response = requests.request("GET", url, headers=headers, data=payload)
        code = response.status_code
        Logger.log_info("6485 端口服务状态：" + str(code))

        url_otl = "http://localhost:6488/onto/health/alive"
        response_otl = requests.request("GET", url_otl, headers=headers, data=payload)
        code_otl = response_otl.status_code
        Logger.log_info("6488 端口服务状态：" + str(code))
        if code_otl == 200 and code == 200:
            return "success", CommonResponseStatus.SUCCESS.value
        return Gview.BuFailVreturn(cause="failed", code=50000,
                                   message="failed"), CommonResponseStatus.SERVER_ERROR.value
    except Exception:
        return "failed", CommonResponseStatus.SERVER_ERROR.value


@task_controller_app.route('/detail/<task_id>', methods=["GET"], strict_slashes=False)
def get_task_detail(task_id):
    '''
    query child task by task id
    query child task by task id
    # ---
    # parameters:
    #     -   in: path
    #         name: task_id
    #         description: task_id
    #         required: true
    #         schema:
    #             type: 'integer'
    #     -   name: task_type
    #         in: query
    #         description: 任务类型，可选值: entity, edge, model
    #         required: false
    #         schema:
    #             type: 'string'
    #     -   name: task_status
    #         in: query
    #         description: 任务状态，可选值: waiting, running, normal, failed
    #         required: false
    #         schema:
    #             type: 'string'
    #     -   name: rule
    #         in: query
    #         description: 排序字段，可选值: start_time, end_time
    #         required: false
    #         schema:
    #             type: 'string'
    #     -   name: order
    #         in: query
    #         description: 排序顺序，可选值: asc, desc
    #         required: false
    #         schema:
    #             type: 'string'
    #     -   name: page
    #         in: query
    #         description: 页数
    #         required: false
    #         schema:
    #             type: 'integer'
    #     -   name: size
    #         in: query
    #         description: 每页大小
    #         required: false
    #         schema:
    #             type: 'integer'
    '''
    try:
        # check task_id
        if not task_id.isdigit():
            message = _l("parameter task_id must be int!")
            code = codes.Builder_CeleryController_GetChildTasks_ParamError
            return Gview2.error_return(code, message=message), 400
        if task_id == "0":
            message = _l("parameter task_id cannot be 0!")
            code = codes.Builder_CeleryController_GetChildTasks_ParamError
            return Gview2.error_return(code, message=message), 400

        params = request.args
        schema = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'properties': {
                'task_type': {
                    'type': 'string',
                    'enum': ['entity', 'edge', 'model']
                },
                'task_status': {
                    'type': 'string',
                    'enum': ['waiting', 'running', 'normal', 'failed', 'stop']
                },
                'rule': {
                    'type': 'string',
                    'enum': ['start_time', 'end_time']
                },
                'order': {
                    'type': 'string',
                    'enum': ['asc', 'desc']
                },
                'page': {
                    'type': 'string',
                    'pattern': '^[1-9][0-9]*$'
                },
                'size': {
                    'type': 'string',
                    'pattern': '^[1-9][0-9]*$'
                }
            }
        }
        try:
            validate(params, schema)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_CeleryController_GetTaskDetail_ParamError
            return Gview2.error_return(code, message=message), 400

        url = 'http://localhost:6485/detail/{}'.format(task_id)  # not debug
        # url = 'http://10.4.37.76:6485/detail/{}'.format(task_id)  # debug
        response = requests.request("GET", url, params=params, headers=request.headers)
        return response.json(), response.status_code
    except Exception as e:
        error_log = log_oper.get_error_log("get child tasks error: {}".format(e), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_CeleryController_GetTaskDetail_UnknownError
        return Gview2.error_return(code, description=str(e), cause=str(e)), 500

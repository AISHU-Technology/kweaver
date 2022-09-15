# -*-coding:utf-8-*-
import time
import uuid

from croniter import croniter
from flask import Blueprint, request, jsonify

from utils.CommonUtil import commonutil
from utils.timer_check_parameters import CheckTimedParameters
from utils.log_info import Logger
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from service.task_Service import task_service
from dao.otl_dao import otl_dao
import requests
import json
from dao.graph_dao import graph_dao
from utils.util import get_timezone
from flasgger import swag_from
import yaml
import os

timer_controller_app = Blueprint('timer_controller_app', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH', os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)


@timer_controller_app.route('/add/<graph_id>', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def add_timed_task(graph_id):
    '''
    add a scheduled task
    ---
    parameters:
        -   name: graph_id
            in: path
            required: true
            description: graph id
            type: integer
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/add_timed_task'
    '''
    method = request.method
    if method == "POST":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            checktimedparameters = CheckTimedParameters()
            http_code, data = checktimedparameters.AddTimedTaskPar(graph_id, params_json)
            if http_code != CommonResponseStatus.SUCCESS.value:
                return Gview.TErrorreturn(data['error_code'], data['desc'], data['solution'], data['detail'],
                                          data['error_link']), http_code
            task_type = params_json.get("task_type")
            cycle = params_json.get("cycle")
            enabled = params_json.get("enabled", True)
            if not enabled:
                enabled = False
            date_time = params_json.get("datetime")
            date_list = data.get("date_list")
            timezone = get_timezone()
            crontab_list = data['crontab_list']
            cron = " ".join(crontab_list)
            try:
                croniter(cron)
            except Exception as e:
                error_link = ''
                code = CommonResponseStatus.PARAMETERS_ERROR.value
                detail = f"Invalid expression,crontab:{cron}"
                desc = "Invalid expression"
                solution = 'Please check your date parameters'
                return Gview.TErrorreturn(code, desc, solution, detail,
                                          error_link), CommonResponseStatus.BAD_REQUEST.value
            trigger_type = 1  # 定时自动触发
            crontab_list.append(timezone)
            task_id = str(uuid.uuid1())
            args = json.dumps([task_type, graph_id, trigger_type, cycle, task_id])
            kwargs = json.dumps({})
            task_data = [task_id, 'celery_tasks.send_builder_task', args, kwargs,
                         graph_id, task_type, cycle, enabled, date_time, f'{date_list}']
            try:
                graph_dao.insert_timed_data(crontab_list, task_data)
            except Exception as e:
                error_link = ''
                code = CommonResponseStatus.REQUEST_ERROR.value
                detail = str(e)
                desc = "write mariadb error"
                solution = 'Please check mariadb'
                return Gview.TErrorreturn(code, desc, solution, detail,
                                          error_link), CommonResponseStatus.SERVER_ERROR.value
            obj = {"state": "success"}
            return obj, CommonResponseStatus.SUCCESS.value
        else:
            error_link = ''
            code = CommonResponseStatus.PARAMETERS_ERROR.value
            detail = 'Incorrect parameter format'
            desc = "Incorrect parameter format"
            solution = 'Please check your parameter format'
            return Gview.TErrorreturn(code, desc, solution, detail,
                                      error_link), CommonResponseStatus.BAD_REQUEST.value


@timer_controller_app.route('/update/<graph_id>', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def update_timed_task(graph_id):
    '''
    modify scheduled task
    ---
    parameters:
        -   name: graph_id
            in: path
            required: true
            description: graph id
            type: integer
        -   name: task_id
            in: body
            required: true
            description: scheduled task id
            type: string
            example: "edfeca62-77f8-11ec-9513-4281da722808"
        -   name: task_type
            in: body
            required: true
            description: build task type，full, increment
            type: string
            example: increment
        -   name: cycle
            in: body
            required: true
            description: 'Valid values are one, day, week, month, one: execute once, day: execute every day, week: execute every week, month: execute every month'
            type: string
            example: week
        -   name: datetime
            in: body
            required: true
            description: "The delivery parameters that are only executed once are the specific date, such as: '2021-12-20 15:54', the delivery parameters are hours and minutes of each day, week and month, such as: '16:40'"
            type: string
            example: 17:02
        -   name: enabled
            in: body
            required: false
            description: 'Task switch, on: 1, off: 0, on by default'
            type: integer
            example: 1
        -   name: date_list
            in: body
            required: true
            description: Indicates the day of the week / day of execution. The content of the list is int, the effective value of the page every week is 1 ~ 7, the number of elements cannot be greater than 7, and the effective value of the page every month is 1 ~ 31. For example, [1, 4], the number of elements cannot be greater than 31, which represents Monday to Sunday or 1 ~ 31 in turn. The page of one execution and daily execution can only send an empty list, and other values will be directly discarded.
            type: array
            example: [1]
    '''
    method = request.method
    if method == "POST":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            checktimedparameters = CheckTimedParameters(timer_task_id=True)
            http_code, data = checktimedparameters.AddTimedTaskPar(graph_id, params_json)
            if http_code != CommonResponseStatus.SUCCESS.value:
                return Gview.TErrorreturn(data['error_code'], data['desc'], data['solution'], data['detail'],
                                          data['error_link']), http_code
            crontab_list = data['crontab_list']
            date_list = data.get("date_list")
            task_id = params_json.get('task_id')
            http_code, data = checktimedparameters.UpdateTimedTaskPar(graph_id, params_json)
            if http_code != CommonResponseStatus.SUCCESS.value:
                return Gview.TErrorreturn(data['error_code'], data['desc'], data['solution'], data['detail'],
                                          data['error_link']), http_code
            crontab_id = data['data'][0].get('crontab_id')
            cron = " ".join(crontab_list)
            try:
                croniter(cron)
            except Exception as e:
                error_link = ''
                code = CommonResponseStatus.PARAMETERS_ERROR.value
                detail = f"Invalid expression,crontab:{cron}"
                desc = "Invalid expression"
                solution = 'Please check your date parameters'
                Gview.TErrorreturn(code, desc, solution, detail,
                                   error_link), CommonResponseStatus.BAD_REQUEST.value
            trigger_type = 1  # 定时自动触发
            task_type = params_json.get("task_type")
            cycle = params_json.get("cycle")
            enabled = params_json.get("enabled", True)
            if not enabled:
                enabled = False
            date_time = params_json.get("datetime")
            args = json.dumps([task_type, graph_id, trigger_type, cycle, task_id])
            task_data = (args, task_type, cycle, enabled, date_time, task_id, graph_id, crontab_id, date_list)
            try:
                graph_dao.update_timed_data(crontab_list, task_data)
            except Exception as e:
                error_link = ''
                code = CommonResponseStatus.REQUEST_ERROR.value
                detail = str(e)
                desc = "write mariadb error"
                solution = 'Please check mariadb'
                return Gview.TErrorreturn(code, desc, solution, detail,
                                          error_link), CommonResponseStatus.SERVER_ERROR.value
            obj = {"state": "success"}
            return obj, CommonResponseStatus.SUCCESS.value
        else:
            error_link = ''
            code = CommonResponseStatus.PARAMETERS_ERROR.value
            detail = 'Incorrect parameter format'
            desc = "Incorrect parameter format"
            solution = 'Please check your parameter format'
            return Gview.TErrorreturn(code, desc, solution, detail,
                                      error_link), CommonResponseStatus.BAD_REQUEST.value


@timer_controller_app.route('/delete/<graph_id>', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def delete_timed_task(graph_id):
    '''
    batch delete scheduled task
    When the passed task_id list is partially invalid, only the valid task_id will be deleted, and the invalid value will be discarded directly. If all the values in the list are invalid, 200 will be returned directly. The background will not perform the deletion action. If the task ID does not match the graph ID, the backend will only delete the scheduled tasks belonging to the graph ID.
    ---
    parameters:
        -   name: graph_id
            in: path
            required: true
            description: graph id
            type: integer
        -   name: task_id
            in: body
            required: true
            description: List of scheduled task IDs. The contents of the list are scheduled task IDS, such as ['aaa','BBBB']
            type: array
            example: ["122","4bfc6d8e-68ab-11ec-b9d3-005056ba834d"]
    '''
    method = request.method
    if method == "POST":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            checktimedparameters = CheckTimedParameters()
            http_code, data = checktimedparameters.DeleteTimedTaskPar(graph_id, params_json)
            if http_code != CommonResponseStatus.SUCCESS.value:
                return Gview.TErrorreturn(data['error_code'], data['desc'], data['solution'], data['detail'],
                                          data['error_link']), http_code
            task_ids = params_json.get('task_id')
            for task_id in task_ids:
                task_id_invalid = checktimedparameters.check_task_id(task_id)
                if task_id_invalid:
                    task_ids.remove(task_id)
            if task_ids:
                try:
                    graph_dao.delete_timed_data(graph_id, task_ids)
                except Exception as e:
                    error_link = ''
                    code = CommonResponseStatus.REQUEST_ERROR.value
                    detail = str(e)
                    desc = "write mariadb error"
                    solution = 'Please check mariadb'
                    return Gview.TErrorreturn(code, desc, solution, detail,
                                              error_link), CommonResponseStatus.SERVER_ERROR.value
            obj = {"state": "success"}
            return obj, CommonResponseStatus.SUCCESS.value
        else:
            error_link = ''
            code = CommonResponseStatus.PARAMETERS_ERROR.value
            detail = 'Incorrect parameter format'
            desc = "Incorrect parameter format"
            solution = 'Please check your parameter format'
            return Gview.TErrorreturn(code, desc, solution, detail,
                                      error_link), CommonResponseStatus.BAD_REQUEST.value


@timer_controller_app.route('', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_timed_task():
    '''
    paging get scheduled task
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: graph id
            type: integer
        -   name: page
            in: query
            required: true
            description: page number
            type: integer
        -   name: size
            in: query
            required: true
            description: numbers per page
            type: integer
        -   name: order
            in: query
            required: true
            description: 'Valid values are ascend and descend, ascend: displayed in ascending order of change time (from old to new), descend: displayed in reverse order of change time (from new to old)'
            type: string
    '''
    method = request.method
    if method == "GET":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            checktimedparameters = CheckTimedParameters()
            http_code, data = checktimedparameters.SelectTimedTaskPar(params_json)
            if http_code != CommonResponseStatus.SUCCESS.value:
                return Gview.TErrorreturn(data['error_code'], data['desc'], data['solution'], data['detail'],
                                          data['error_link']), http_code
            graph_id = params_json.get("graph_id")
            page = int(params_json.get("page"))
            size = int(params_json.get("size"))
            order = data.get('order')
            code, data = task_service.get_timer_data(graph_id, order, page, size)
            if code != CommonResponseStatus.SUCCESS.value:
                error_link = ''
                code = data['error_code']
                desc = data['desc']
                detail = data['detail']
                solution = data['solution']
                return Gview.TErrorreturn(code, desc, solution, detail,
                                          error_link), CommonResponseStatus.SERVER_ERROR.value
            return data, CommonResponseStatus.SUCCESS.value

        else:
            error_link = ''
            code = CommonResponseStatus.PARAMETERS_ERROR.value
            detail = 'Incorrect parameter format'
            desc = "Incorrect parameter format"
            solution = 'Please check your parameter format'
            return Gview.TErrorreturn(code, desc, solution, detail,
                                      error_link), CommonResponseStatus.BAD_REQUEST.value


@timer_controller_app.route('/info', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_timed_info():
    '''
    get scheduled task details
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: graph id
            type: integer
        -   name: task_id
            in: query
            required: true
            description: scheduled task id
            type: string
    '''
    method = request.method
    if method == "GET":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            checktimedparameters = CheckTimedParameters()
            http_code, data = checktimedparameters.GetTimedInfoPar(params_json)
            if http_code != CommonResponseStatus.SUCCESS.value:
                return Gview.TErrorreturn(data['error_code'], data['desc'], data['solution'], data['detail'],
                                          data['error_link']), http_code
            obj = data['data'][0]
            del_keys = ('crontab_id', 'graph_id')
            for del_key in del_keys:
                del obj[del_key]
            return obj, CommonResponseStatus.SUCCESS.value
        else:
            error_link = ''
            code = CommonResponseStatus.PARAMETERS_ERROR.value
            detail = 'Incorrect parameter format'
            desc = "Incorrect parameter format"
            solution = 'Please check your parameter format'
            return Gview.TErrorreturn(code, desc, solution, detail,
                                      error_link), CommonResponseStatus.BAD_REQUEST.value


@timer_controller_app.route('/switch/<graph_id>', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def timed_switch(graph_id):
    '''
    scheduled task switch
    ---
    parameters:
        -   name: graph_id
            in: path
            required: true
            description: graph id
            type: integer
        -   name: task_id
            in: body
            required: true
            description: scheduled task id
            type: string
            example: "ce29686e-7352-11ec-8b53-005056ba834d"
        -   name: enabled
            in: body
            required: true
            description: 'Task switch, on: 1, off: 0'
            type: integer
            example: 1
    '''
    method = request.method
    if method == "POST":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            checktimedparameters = CheckTimedParameters()
            http_code, data = checktimedparameters.TimedSwitchPar(graph_id, params_json)
            if http_code != CommonResponseStatus.SUCCESS.value:
                return Gview.TErrorreturn(data['error_code'], data['desc'], data['solution'], data['detail'],
                                          data['error_link']), http_code
            task_id = params_json.get('task_id')
            enabled = params_json.get("enabled", True)
            if not enabled:
                enabled = False
            code, data = task_service.update_timer_switch(graph_id, task_id, enabled)
            if code != CommonResponseStatus.SUCCESS.value:
                error_link = ''
                code = data['error_code']
                desc = data['desc']
                detail = data['detail']
                solution = data['solution']
                return Gview.TErrorreturn(code, desc, solution, detail,
                                          error_link), CommonResponseStatus.SERVER_ERROR.value
            obj = {"state": "success"}
            return obj, CommonResponseStatus.SUCCESS.value
        else:
            error_link = ''
            code = CommonResponseStatus.PARAMETERS_ERROR.value
            detail = 'Incorrect parameter format'
            desc = "Incorrect parameter format"
            solution = 'Please check your parameter format'
            return Gview.TErrorreturn(code, desc, solution, detail,
                                      error_link), CommonResponseStatus.BAD_REQUEST.value

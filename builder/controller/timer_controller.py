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
    新增定时任务
    ---
    parameters:
        -   name: graph_id
            in: path
            required: true
            description: graph id
            type: integer
        -   name: task_type
            in: body
            required: true
            description: 'building task type. allowableValues: full, increment'
            example: increment
            type: string
        -   name: cycle
            in: body
            required: true
            description: "'one': execute once; 'day': execute daily; 'week': execute weekly; 'month': execute monthly. "
            type: string
            example: month
        -   name: datetime
            in: body
            required: true
            description: "The delivery parameters that are only executed once are the specific date, such as: '2021-12-20 15:54', else are hours and minutes for daily, week and month, such as: '16:40'. 只执行一次的传递参数为具体日期如：'2021-12-20 15:54'，每天，每周，每月传递小时分钟形如：'16:40'"
            type: string
            example: "17:20"
        -   name: enabled
            in: body
            required: false
            description: 任务开关，开启：1，关闭：0，默认开启
            type: integer
            example: 1
        -   name: date_list
            in: body
            required: true
            description: 表示周几/几号执行，list内容为int，每周页面有效值为1~7，元素个数不能大于7，每月页面有效值为1~31如[1，4]，元素个数不能大于31，依次代表周一到周日或者1~31号，一次执行和每天执行页面传递空列表即可，传递其它值会直接丢弃掉
            type: array
            example: [1,2,3,4,5]
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
    修改定时任务
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
            description: 定时任务id
            type: string
            example: "edfeca62-77f8-11ec-9513-4281da722808"
        -   name: task_type
            in: body
            required: true
            description: 构建任务类型，full，increment
            type: string
            example: increment
        -   name: cycle
            in: body
            required: true
            description: 有效值为one,day,week,month，one：执行一次，day：每天执行，week：每周执行，month：每月执行
            type: string
            example: week
        -   name: datetime
            in: body
            required: true
            description: 只执行一次的传递参数为具体日期如：'2021-12-20 15:54'，每天，每周，每月传递小时分钟形如：'16:40'
            type: string
            example: 17:02
        -   name: enabled
            in: body
            required: false
            description: 任务开关，开启：1，关闭：0，默认开启
            type: integer
            example: 1
        -   name: date_list
            in: body
            required: true
            description: 表示周几/几号执行，list内容为int，每周页面有效值为1~7，元素个数不能大于7，每月页面有效值为1~31如[1，4]，元素个数不能大于31，依次代表周一到周日或者1~31号，一次执行和每天执行页面传递空列表即可，传递其它值会直接丢弃掉
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
    批量删除定时任务
    当传递的task_id列表部分无效时，只针对有效的task_id执行删除动作，无效的值直接丢弃，如果列表中的值全部无效则直接返回200，后台不执行删除动作，task_id与graph_id不匹配的情况下，后端只会删除隶属于graph_id的定时任务。
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
            description: 定时任务id列表，list内容为定时任务id，如['aaa','bbbb‘]
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
    分页获取定时任务
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
            description: 有效值为ascend和descend，ascend：按照更改时间升序（从旧到新）展示，descend：按照更改时间倒序（从新到旧）展示
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
    获取定时任务详情
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
    定时任务开关
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
            description: 任务开关，开启：1，关闭：0
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

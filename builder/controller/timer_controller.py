# -*-coding:utf-8-*-
import time
import uuid

from croniter import croniter
from flask import Blueprint, request, jsonify

from config.config import permission_manage
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

timer_controller_app = Blueprint('timer_controller_app', __name__)

import sys


# 新增定时任务
@timer_controller_app.route('/add/<graph_id>', methods=["post"], strict_slashes=False)
def add_timed_task(graph_id):
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
            user_id = request.headers.get("uuid")
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
            args = json.dumps([task_type, graph_id, user_id, trigger_type, cycle, task_id])
            kwargs = json.dumps({})
            task_data = [task_id, 'celery_tasks.send_builder_task', args, kwargs,
                         user_id, user_id, graph_id, task_type, cycle, enabled, date_time, f'{date_list}']
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


# 修改定时任务
@timer_controller_app.route('/update/<graph_id>', methods=["post"], strict_slashes=False)
def update_timed_task(graph_id):
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
            user_id = request.headers.get("uuid")
            enabled = params_json.get("enabled", True)
            if not enabled:
                enabled = False
            date_time = params_json.get("datetime")
            args = json.dumps([task_type, graph_id, user_id, trigger_type, cycle, task_id])
            task_data = (args, user_id, task_type, cycle, enabled, date_time, task_id, graph_id, crontab_id, date_list)
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


# 批量删除定时任务
@timer_controller_app.route('/delete/<graph_id>', methods=["post"], strict_slashes=False)
def delete_timed_task(graph_id):
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


# 分页获取定时任务
@timer_controller_app.route('', methods=["get"], strict_slashes=False)
def get_timed_task():
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


# 获取定时任务详情
@timer_controller_app.route('/info', methods=["get"], strict_slashes=False)
def get_timed_info():
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


# 定时任务开关
@timer_controller_app.route('/switch/<graph_id>', methods=["post"], strict_slashes=False)
def timed_switch(graph_id):
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
            update_user = request.headers.get("uuid")
            code, data = task_service.update_timer_switch(graph_id, task_id, enabled, update_user)
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

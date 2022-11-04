# -*-coding:utf-8-*-
import uuid
from datetime import datetime, timedelta
from flask import request
import json
from service.task_Service import task_service
from utils.common_response_status import CommonResponseStatus


class CommonCheck(object):
    @classmethod
    def check_graph_id(cls, graph_id):
        data = {'error_link': ''}
        http_code = CommonResponseStatus.SUCCESS.value
        if not isinstance(graph_id, str) or not graph_id.isdigit():
            data['desc'] = "Invalid parameter graph_id"
            data['detail'] = "The parameter graph_id type must be int!"
            data['solution'] = "Please check your parameters"
            data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
            http_code = CommonResponseStatus.BAD_REQUEST.value
            return http_code, data
        ret_code, ret_message = task_service.getgraphcountbyid(graph_id)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            if ret_message['code'] == CommonResponseStatus.TASK_RUN_NO_GRAPH.value:
                data['desc'] = ret_message['message']
                data['detail'] = ret_message['message']
                data['solution'] = "Please check your parameters"
                data['error_code'] = ret_message['code']
                http_code = CommonResponseStatus.SERVER_ERROR.value
                return http_code, data
            else:
                data['desc'] = ret_message['message']
                data['detail'] = ret_message['message']
                data['solution'] = "Please check your mariadb"
                data['error_code'] = ret_message['code']
                http_code = CommonResponseStatus.SERVER_ERROR.value
                return http_code, data
        return http_code, data


class CheckTimedParameters(CommonCheck):
    def __init__(self, timer_task_id=False):
        self.data = {'error_link': '', 'date_list': []}
        self.http_code = CommonResponseStatus.SUCCESS.value
        self.missParas = []
        self.timer_task_id = timer_task_id
        self.add_required = ["task_type", "cycle", "datetime", "date_list"]
        if self.timer_task_id:
            self.add_required.append("task_id")
        self.find_required = ["graph_id", "page", "size", "order"]

    def check_miss_parameters(self, params_json, required):
        for key in required:
            if key not in params_json:
                self.missParas.append(key)
        if self.missParas:
            self.data['desc'] = f"parameters Missing!"
            self.data['detail'] = f"parameters: {','.join(self.missParas)} are Missing!"
            self.data['solution'] = "Please check your parameters"
            self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
            self.http_code = CommonResponseStatus.BAD_REQUEST.value
        return self.http_code, self.data

    def check_enabled(self, enabled):
        if not isinstance(enabled, int) or enabled not in (0, 1) or enabled is True or enabled is False:
            self.data['desc'] = f"parameters invalid"
            self.data['detail'] = f"parameters: enabled must be int and value in (0,1)"
            self.data['solution'] = "Please check your parameters"
            self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
            self.http_code = CommonResponseStatus.BAD_REQUEST.value
        return self.http_code, self.data

    def AddTimedTaskPar(self, graph_id, params_json):
        http_code, data = self.check_miss_parameters(params_json, self.add_required)
        if http_code != CommonResponseStatus.SUCCESS.value:
            return self.http_code, self.data
        enabled = params_json.get("enabled", 1)
        http_code, data = self.check_enabled(enabled)
        if http_code != CommonResponseStatus.SUCCESS.value:
            return self.http_code, self.data
        par_map = {"task_type": ("full", "increment"), "cycle": ("one", "day", "week", "month")}
        for key, valid_value in par_map.items():
            value = params_json.get(key)
            if value not in valid_value:
                self.data['desc'] = f"Invalid parameter {key}"
                self.data['detail'] = f"parameters: {key} must in {valid_value}!"
                self.data['solution'] = "Please check your parameters"
                self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                self.http_code = CommonResponseStatus.BAD_REQUEST.value
                return self.http_code, self.data
        cycle = params_json.get("cycle")
        date_str = params_json.get("datetime")
        try:
            day_of_week = '*'
            if cycle == "one":
                dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
                now = datetime.now() + timedelta(minutes=1)
                if dt <= now:
                    self.data['desc'] = f"Invalid parameter datetime"
                    self.data['detail'] = f"parameters: datetime must be greater than the current time 1 minutes!"
                    self.data['solution'] = "Please check your parameters"
                    self.data['error_code'] = CommonResponseStatus.TIME_LESS_NOW.value
                    self.http_code = CommonResponseStatus.SERVER_ERROR.value
                    return self.http_code, self.data
                month_of_year = date_str.split(' ')[0].split('-')[1]
                day_of_month = date_str.split(' ')[0].split('-')[2]
                hour = date_str.split(' ')[1].split(':')[0]
                minute = date_str.split(' ')[1].split(':')[1]
            else:
                datetime.strptime(date_str, "%H:%M")
                date_list = params_json.get("date_list")
                day_of_month = '*'
                month_of_year = "*"
                hour = date_str.split(':')[0]
                minute = date_str.split(':')[1]
                if cycle in ('week', 'month'):
                    max_length = 7 if cycle == 'week' else 31
                    if not isinstance(date_list, list) or not date_list or len(date_list) > max_length:
                        self.data['desc'] = f"Invalid parameter"
                        self.data[
                            'detail'] = f"parameters: date_list must be list and not null and max_length<={max_length}!"
                        self.data['solution'] = "Please check your parameters"
                        self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                        self.http_code = CommonResponseStatus.BAD_REQUEST.value
                        return self.http_code, self.data
                    date_list = list(set(date_list))
                    if cycle == 'week':
                        valid_list = [1, 2, 3, 4, 5, 6, 7]
                    else:
                        valid_list = []
                        for num in range(1, 32):
                            valid_list.append(num)
                    for content in date_list:
                        if content not in valid_list:
                            self.data['desc'] = f"Invalid parameter"
                            self.data[
                                'detail'] = f"parameters: date_list element must be int and the range of values is {valid_list}!"
                            self.data['solution'] = "Please check your parameters"
                            self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                            self.http_code = CommonResponseStatus.BAD_REQUEST.value
                            return self.http_code, self.data
                    if date_list != valid_list:
                        tmp = ""
                        for index, num in enumerate(date_list):
                            tmp += str(num)
                            if index != len(date_list) - 1:
                                tmp += ','
                        if cycle == 'week':
                            day_of_week = tmp
                        else:
                            day_of_month = tmp
                else:
                    date_list = []
                date_list.sort()
                self.data['date_list'] = json.dumps(date_list)
            crontab_list = [minute, hour, day_of_month, month_of_year, day_of_week]
            self.data['crontab_list'] = crontab_list
            return self.http_code, self.data
        except Exception:
            self.data['desc'] = f"Invalid parameter datetime"
            self.data[
                'detail'] = f"parameters: datetime When cycle = one the template is '%Y-%m-%d %H:%M' and others are '%H:%M'"
            self.data['solution'] = "Please check your parameters"
            self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
            self.http_code = CommonResponseStatus.BAD_REQUEST.value
            return self.http_code, self.data

    def UpdateTimedTaskPar(self, graph_id, params_json):
        task_id = params_json.get("task_id")
        task_id_invalid = self.check_task_id(task_id)
        if task_id_invalid:
            self.data['desc'] = f"Invalid parameter"
            self.data['detail'] = f"parameters: task_id invalid"
            self.data['solution'] = "Please check your parameters"
            self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
            self.http_code = CommonResponseStatus.BAD_REQUEST.value
            return self.http_code, self.data
        code, data = task_service.get_timer_by_id(task_id, graph_id)
        if code != CommonResponseStatus.SUCCESS.value:
            self.data['desc'] = data['desc']
            self.data['detail'] = data['detail']
            self.data['solution'] = data['solution']
            self.data['error_code'] = data['error_code']
            self.http_code = CommonResponseStatus.SERVER_ERROR.value
            return self.http_code, self.data
        self.data = data
        self.http_code = CommonResponseStatus.SUCCESS.value
        return self.http_code, self.data

    def check_task_id(self, task_id):
        task_id_invalid = False
        if isinstance(task_id, str):
            try:
                uuid.UUID(task_id)
            except Exception:
                task_id_invalid = True
            else:
                if len(task_id) != 36:
                    task_id_invalid = True
        else:
            task_id_invalid = True
        return task_id_invalid

    def DeleteTimedTaskPar(self, graph_id, params_json):
        if 'task_id' not in params_json:
            self.data['desc'] = f"parameters Missing!"
            self.data['detail'] = f"parameters: task_id are Missing!"
            self.data['solution'] = "Please check your parameters"
            self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
            self.http_code = CommonResponseStatus.BAD_REQUEST.value
            return self.http_code, self.data
        task_ids = params_json.get('task_id')
        if not isinstance(task_ids, list) or len(task_ids) == 0:
            self.data['desc'] = f"Invalid parameter"
            self.data['detail'] = f"parameters: task_id must be list and not null"
            self.data['solution'] = "Please check your parameters"
            self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
            self.http_code = CommonResponseStatus.BAD_REQUEST.value
            return self.http_code, self.data
        return self.http_code, self.data

    def SelectTimedTaskPar(self, params_json):
        http_code, data = self.check_miss_parameters(params_json, self.find_required)
        if http_code != CommonResponseStatus.SUCCESS.value:
            return self.http_code, self.data
        page = params_json.get("page")
        size = params_json.get("size")
        pars = {"page": page, "size": size}
        for k, v in pars.items():
            if not v.isdigit() or int(v) <= 0:
                self.data['desc'] = "Invalid parameter"
                self.data['detail'] = f"parameters: {k} must be int"
                self.data['solution'] = "Please check your parameters"
                self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
                self.http_code = CommonResponseStatus.BAD_REQUEST.value
                return self.http_code, self.data
        order = params_json.get("order")
        if order not in ('ascend', 'descend'):
            self.data['desc'] = f"Invalid parameter"
            self.data['detail'] = f"parameters: order must be ascend or descend"
            self.data['solution'] = "Please check your parameters"
            self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
            self.http_code = CommonResponseStatus.BAD_REQUEST.value
            return self.http_code, self.data
        order = 'asc' if order == 'ascend' else 'desc'
        self.data['order'] = order
        return self.http_code, self.data

    def GetTimedInfoPar(self, params_json):
        required = ['graph_id', 'task_id']
        http_code, data = self.check_miss_parameters(params_json, required)
        if http_code != CommonResponseStatus.SUCCESS.value:
            return self.http_code, self.data
        graph_id = params_json.get("graph_id")
        task_id = params_json.get("task_id")
        task_id_invalid = self.check_task_id(task_id)
        if task_id_invalid:
            self.data['desc'] = f"Invalid parameter"
            self.data['detail'] = f"parameters: task_id invalid"
            self.data['solution'] = "Please check your parameters"
            self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
            self.http_code = CommonResponseStatus.BAD_REQUEST.value
            return self.http_code, self.data
        code, data = task_service.get_timer_by_id(task_id, graph_id)
        if code != CommonResponseStatus.SUCCESS.value:
            self.data['desc'] = data['desc']
            self.data['detail'] = data['detail']
            self.data['solution'] = data['solution']
            self.data['error_code'] = data['error_code']
            self.http_code = CommonResponseStatus.SERVER_ERROR.value
        else:
            self.data['data'] = data['data']
        return self.http_code, self.data

    def TimedSwitchPar(self, graph_id, params_json):
        required = ['task_id', 'enabled']
        http_code, data = self.check_miss_parameters(params_json, required)
        if http_code != CommonResponseStatus.SUCCESS.value:
            return self.http_code, self.data
        task_id = params_json.get("task_id")
        enabled = params_json.get("enabled")
        task_id_invalid = self.check_task_id(task_id)
        if task_id_invalid:
            self.data['desc'] = f"Invalid parameter"
            self.data['detail'] = f"parameters: task_id invalid"
            self.data['solution'] = "Please check your parameters"
            self.data['error_code'] = CommonResponseStatus.PARAMETERS_ERROR.value
            self.http_code = CommonResponseStatus.BAD_REQUEST.value
            return self.http_code, self.data
        code, data = task_service.get_timer_by_id(task_id, graph_id)
        if code != CommonResponseStatus.SUCCESS.value:
            self.data['desc'] = data['desc']
            self.data['detail'] = data['detail']
            self.data['solution'] = data['solution']
            self.data['error_code'] = data['error_code']
            self.http_code = CommonResponseStatus.SERVER_ERROR.value
        else:
            date_time = data['data'][0]['date_time']
            cycle = data['data'][0]['cycle']
            if cycle == 'one':
                dt = datetime.strptime(date_time, "%Y-%m-%d %H:%M")
                now = datetime.now()
                if dt <= now:
                    self.data['desc'] = f"Invalid operation"
                    self.data['detail'] = f"Expired timed tasks are not allowed to click the switch"
                    self.data['solution'] = "Please use the edit function to modify the scheduled task"
                    self.data['error_code'] = CommonResponseStatus.Expired_TIMED_TASK.value
                    self.http_code = CommonResponseStatus.SERVER_ERROR.value
        http_code, data = self.check_enabled(enabled)
        if http_code != CommonResponseStatus.SUCCESS.value:
            return self.http_code, self.data
        return self.http_code, self.data

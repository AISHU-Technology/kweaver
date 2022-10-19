import datetime
import json

from common.errorcode import codes
from common.log import log
from dao.async_task_dao import async_task_dao
from celery import current_app
from celery.result import AsyncResult
from tenacity import retry, stop_after_attempt, wait_fixed, stop_after_delay
import timeout_decorator

from utils.util import async_call


class AsyncTaskService(object):

    def post(self, param_json):
        # 插入记录
        task_id = async_task_dao.insert_record(param_json)
        # 调用celery执行任务
        async_task_name = param_json.get('async_task_name')
        func = current_app.signature(async_task_name)
        log.info(f"celery config:{repr(current_app.conf)}")
        task = func.apply_async(args=[param_json, task_id])
        # 获取结果
        task_state = task.status

        if task_state == "":
            task_status = "redis wrong"
        elif task_state == "PENDING":
            task_status = "running"
        elif task_state == "SUCCESS":
            task_status = "finished"
        elif task_state == "FAILURE":
            task_status = "failed"
        else:
            task_status = "unkonwn"
        celery_task_id = task.id
        finished_time = task.date_done
        if finished_time is not None:
            utcTime = datetime.datetime.strptime(str(finished_time).split(".")[0], "%Y-%m-%d %H:%M:%S")
            finished_time = utcTime + datetime.timedelta(hours=8)
        # 更新本体任务状态
        update_params = dict()
        update_params["task_status"] = task_status
        update_params["celery_task_id"] = celery_task_id
        update_params["finished_time"] = finished_time

        ret_code, obj = self.update(task_id, update_params)
        return ret_code, celery_task_id

    @async_call
    def cancel_by_relation_id_list(self, task_type, relation_id_list, delete_record=False):
        for relation_id in relation_id_list:
            self.cancel_by_relation_id(task_type, relation_id, delete_record)

    def cancel_by_relation_id(self, task_type, relation_id, delete_record=False):
        parameter = dict()
        parameter['relation_id'] = relation_id
        parameter['task_type'] = task_type
        parameter['task_status'] = ['waiting', 'running']

        task_list = self.query(parameter)
        for task_info in task_list:
            self.cancel_task(task_info['id'], task_info.get('celery_task_id'), delete_record)

    def cancel_by_id(self, task_type, task_id, delete_record=False):
        parameter = dict()
        parameter['id'] = task_id
        parameter['task_type'] = task_type
        parameter['task_status'] = ['waiting', 'running']

        task_list = self.query(parameter)
        for task_info in task_list:
            self.cancel_task(task_info['id'], task_info.get('celery_task_id'), delete_record)

    def query(self, task_params):
        args = {
            "task_type": task_params.get('task_type'),
            "id": task_params.get('task_id'),
            "celery_task_id": task_params.get('celery_task_id'),
            "task_status": task_params.get('task_status'),
            "relation_id": task_params.get('relation_id')
        }
        task_list = async_task_dao.query(args)
        return task_list

    def update(self, task_id, param_json):
        ret_code = codes.successCode
        obj = {}
        try:
            log.info(repr(param_json))
            async_task_dao.update(task_id, param_json)
            obj["res"] = "update task "
        except Exception as e:
            err = repr(e)
            log.error(err)

            obj['cause'] = err
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            obj['code'] = codes.Builder_Dao_AsyncTaskDao_Update_ServerError
            if "Duplicate entry" in err:
                obj['code'] = codes.Builder_Dao_AsyncTaskDao_Update_UserPassError
            obj['message'] = "update otl task fail"

        return ret_code, obj

    @retry(wait=wait_fixed(2), stop=stop_after_attempt(3))
    @timeout_decorator.timeout(5)
    def delete_pre_running_task(self, task_type, current_task_id, relation_id, delete_record=False):
        """
            停止正在运行的相同任务
        """
        parameter = dict()
        parameter['relation_id'] = relation_id
        parameter['task_status'] = ['running', 'waiting']
        parameter['task_type'] = task_type

        task_list = self.query(parameter)
        for task_info in task_list:
            if task_info['id'] == current_task_id:
                continue
            self.cancel_task(task_info['id'], task_info.get('celery_task_id'))

    def cancel_task(self, task_id, celery_task_id, delete_record=False):
        if not celery_task_id:
            log.error(f"invalid celery task id {celery_task_id}")
            return
        task_result = AsyncResult(celery_task_id)
        # 如果没有status 状态值，那么表示该任务没找到，或者没有执行
        status = task_result.status
        if not status:
            log.error(f"celery task status {celery_task_id} missing")
            return
        # 终止该任务
        current_app.control.terminate(celery_task_id)
        if delete_record:
            async_task_dao.delete({"id": task_id})
            return
        # 保存取消状态
        if task_result.status == 'REVOKED':
            update_param = dict()
            update_param['task_status'] = 'canceled'
            update_param['finished_time'] = datetime.datetime.now()
            update_param['result'] = '已取消'
            code, res = self.update(task_id, update_param)
            if code != codes.successCode:
                log.error(f"update task {task_id} error {repr(res)}")


async_task_service = AsyncTaskService()

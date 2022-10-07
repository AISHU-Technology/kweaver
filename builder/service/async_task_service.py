import datetime
import json

from common.errorcode import codes
from common.log import log
from dao.async_task_dao import async_task_dao
from celery import current_app
from celery.result import AsyncResult


class AsyncTaskService(object):

    def post(self, param_json):
        # 停止之前运行中的任务
        if param_json.get('cancel'):
            self.delete_pre_running_task(param_json['task_type'], param_json['relation_id'])
        # 插入记录
        task_id = async_task_dao.insert_record(param_json)
        # 调用celery执行任务
        async_task_name = param_json.get('async_task_name')
        func = current_app.signature(async_task_name)
        # 获取执行参数
        task_params = json.loads(param_json.get('task_params', '{}'))
        task = func.apply_async(args=[task_params, task_id])
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

    def cancel(self, task_type, task_id, delete_record=False):
        """
        取消任务
        """
        parameter = dict()
        parameter['id'] = task_id
        parameter['task_type'] = task_type

        task_list = self.query(parameter)
        for task_info in task_list:
            celery_task_id = task_info.get('celery_task_id')
            if not celery_task_id:
                continue
            task_result = AsyncResult(celery_task_id)
            # 如果没有status 状态值，那么表示该任务没找到，或者没有执行
            if 'status' not in task_result:
                continue
            # 终止该任务
            current_app.control.terminate(celery_task_id)
            if delete_record:
                async_task_dao.delete({"id": task_info['id']})

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

    def delete_pre_running_task(self, task_type, relation_id, delete_record=False):
        """
            停止正在运行的相同任务
        """
        parameter = dict()
        parameter['relation_id'] = relation_id
        parameter['task_status'] = ['running', 'WAITING']
        parameter['task_type'] = task_type

        task_list = self.query(parameter)
        for task_info in task_list:
            celery_task_id = task_info.get('celery_task_id')
            if not celery_task_id:
                continue
            task_result = AsyncResult(celery_task_id)
            # 如果没有status 状态值，那么表示该任务没找到，或者没有执行
            if 'status' not in task_result:
                continue
            # 终止该任务
            current_app.control.terminate(celery_task_id)
            if delete_record:
                async_task_dao.delete({"id": task_info['id']})

async_task_service = AsyncTaskService()

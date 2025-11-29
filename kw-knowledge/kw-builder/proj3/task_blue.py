import datetime

from flask import Blueprint, request

from common.errorcode import codes
from common.errorcode.gview import Gview
from dao.lexicon_dao import lexicon_dao
from service.async_task_service import async_task_service
from utils.CommonUtil import commonutil
from utils.log_info import Logger as log

task_app = Blueprint('task_app', __name__)


@task_app.route('/task/<task_type>', methods=['POST'])
def create_task(task_type):
    """
        create instant task
        ---
        parameters:
            -   name: task_type
                in: path
                required: true
                description: graph id
                type: integer
    """
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0:
        return Gview.error_return(codes.Builder_GraphController_GetGraphInfoBasic_ParamError, args=param_message)

    params_json['task_type'] = task_type
    params_json['task_status'] = "waiting"
    params_json['create_time'] = datetime.datetime.now()

    if task_type in ["lexicon_build", "import_lexicon"]:
        lexicon_dao.update_lexicon_status(params_json["relation_id"], "waiting")

    code, celery_task_id = async_task_service.post(params_json)
    if code != codes.successCode:
        log.error(f"task {celery_task_id}, apply async result:{code}")
        return Gview.error_return(code), 500
    return Gview.json_return(celery_task_id), 200


@task_app.route('/task/<task_type>/cancel_by_id', methods=['POST'])
def cancel_task(task_type):
    """
    停止任务，保留记录
    """
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0 or 'task_id' not in params_json:
        return Gview.error_return(codes.Builder_GraphController_GetGraphInfoBasic_ParamError, args=param_message)

    task_id = params_json['task_id']
    async_task_service.cancel_by_id(task_type, task_id)
    return Gview.json_return("OK")


@task_app.route('/task/<task_type>/cancel_by_relation_id', methods=['POST'])
def cancel_batch_task(task_type):
    """
    停止任务，保留记录
    """
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0 or 'relation_id_list' not in params_json:
        return Gview.error_return(codes.Builder_GraphController_GetGraphInfoBasic_ParamError, args=param_message)

    relation_id_list = params_json['relation_id_list']
    if not relation_id_list:
        return Gview.error_return(codes.Builder_GraphController_GetGraphInfoBasic_ParamError, args=param_message)

    async_task_service.cancel_by_relation_id_list(task_type, relation_id_list)
    return Gview.json_return("OK")


@task_app.route('/task/<task_type>/<task_id>', methods=['DELETE'])
def delete_task(task_type, task_id):
    """
    停止任务，删除记录
    """
    async_task_service.cancel_by_id(task_type, task_id, delete_record=True)
    return Gview.json_return("OK")

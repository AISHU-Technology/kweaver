# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn


from task import *

from flask import jsonify, request
from flask import Blueprint

add_app = Blueprint('add_app', __name__)

sys.path.insert(0, os.path.abspath("../"))
from service.task_Service import task_service
from dao.dsm_dao import dsm_dao
from dao.otl_dao import otl_dao
from common.errorcode.gview import Gview as Gview2
from common.errorcode import codes
import traceback
from flask_babel import gettext as _l
from utils.log_info import Logger


@add_app.route('/onto/buildertask', methods=['POST'])
def otl_task():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        obj = {}
        # 查看当前running的任务数是否>=3,(运行中的任务数量最大为3)
        retcode, status_info = task_service.getrunningtask()
        if retcode != 200:
            code = codes.Builder_OntoBlue_OtlTask_UnknownError
            description = _l("add new task failed.")
            cause = _l("failed to get running task.")
            
            return Gview2.TErrorreturn(code, description=description, cause=cause), 500
        else:
            status = status_info["running"]
            if status == False:
                code = codes.Builder_OntoBlue_OtlTask_TaskNumberMaximum
                
                return Gview2.TErrorreturn(code), 500
            else:
                otl_id = params_json["ontology_id"]
                ds_id = params_json["ds_id"]
                postfix = params_json["postfix"]
                file_list = params_json["file_list"]
                if len(file_list) > 1:
                    task_type = "multi-files"
                    name_code, task_name = task_service.get_multi_task_name(otl_id)
                    if name_code != 200:
                        code = codes.Builder_OntoBlue_OtlTask_UnknownError
                        description = _l("get multi task name failed.")
                        cause = task_name['cause']
                        
                        return Gview2.TErrorreturn(code, description=description, cause=cause), 500
                else:
                    one = file_list[0]
                    if not isinstance(one, dict):  # hive或者mysql
                        task_type = "table"
                        task_name = one
                    else:  # as
                        file_type = one.get("type", "")
                        task_name = one.get("name", "")
                        if file_type == "dir":
                            task_type = "files"
                        else:
                            task_type = params_json["postfix"]
                # 根据本体id在本体表中查找
                check_res = otl_dao.getbyid(otl_id)
                if len(check_res) == 0:
                    code = codes.Builder_OntoBlue_OtlTask_OntologyIdNotExist
                    
                    return Gview2.TErrorreturn(code, ontology_id=otl_id), 500
                # 在本体任务表ontology_task_table中插入任务记录
                add_code, add_res = task_service.add_otl_task(otl_id, task_name, ds_id, task_type, postfix)
                if add_code != 200:
                    code = codes.Builder_OntoBlue_OtlTask_UnknownError
                    description = _l("task start failed.")
                    cause = add_res['cause']
                    
                    return Gview2.TErrorreturn(code, description=description, cause=cause), 500
                obj["ontology_id"] = otl_id
                task_id = add_res["res"]
                new_params_json = {}
                new_params_json["ontology_id"] = params_json["ontology_id"]
                new_params_json["file_list"] = params_json["file_list"]
                new_params_json["postfix"] = params_json["postfix"]
                new_params_json["ds_id"] = params_json["ds_id"]
                ds_id = new_params_json["ds_id"]
                # 根据数据源id在数据源表data_source_table中查找
                data = dsm_dao.getdatabyid(ds_id)
                if len(data) == 0:
                    code = codes.Builder_OntoBlue_OtlTask_DsIdNotExist
                    
                    return Gview2.TErrorreturn(code, ds_id=ds_id), 500
                else:
                    data = data[0]
                    new_params_json["ds_password"] = data["ds_password"]
                    new_params_json["data_source"] = data["data_source"]
                    new_params_json["ds_user"] = data["ds_user"]
                    new_params_json["ds_address"] = data["ds_address"]
                    new_params_json["ds_port"] = str(data["ds_port"])
                    new_params_json["ds_path"] = data["ds_path"]
                    new_params_json["ds_auth"] = data["ds_auth"]
                    new_params_json["ds_name"] = data["ds_name"]
                    new_params_json["vhost"] = data["vhost"]
                    new_params_json["queue"] = data["queue"]
                    new_params_json["json_schema"] = data["json_schema"]
                    new_params_json["connect_type"] = data["connect_type"]
                # 开始任务
                Logger.log_info("new_params_json: {}".format(new_params_json))
                Logger.log_info("task_id: {}".format(task_id))
                userId = request.headers.get('userId')
                start_code, celery_task_id = task_service.start_otl_task(new_params_json, task_id, userId)
                obj["celery_task_id"] = celery_task_id
                if start_code != 200:
                    code = codes.Builder_OntoBlue_OtlTask_UnknownError
                    description = task_id + _l(" task start failed.")
                    cause = task_id + _l(" task start failed.")
                    
                    return Gview2.TErrorreturn(code, description=description, cause=cause), 500
                
                return Gview2.json_return(obj), 200
    except Exception as e:
        traceback.print_exc()
        code = codes.Builder_OntoBlue_OtlTask_UnknownError
        
        return Gview2.TErrorreturn(code, description=repr(e), cause=repr(e)), 500


# 获取任务列表
@add_app.route('/onto/getalltask', methods=['POST'])
def get_all_otl_task():
    obj = {}
    params_json = request.get_data()
    params_json = json.loads(params_json)
    result = {}
    # params_json={"page":5,"size":4,"status":"all","otl_id":"new_5","used_task":[1,2,5,6]}
    page = int(params_json["page"]) - 1
    size = params_json["size"]
    status = "all"
    otl_id = params_json["ontology_id"]
    used_task = params_json["used_task"]
    ds_info = otl_dao.getbyid(otl_id)
    if len(ds_info) == 0:
        return jsonify({"res": {"cause": "ontology_id doesn`t exist!", "code": 500025,
                                "message": _l("can`t get task information")}, "code": 500})
    ret_all, task_all = task_service.get_all_by_otlid(otl_id)
    if ret_all != 200:
        return jsonify({'res': ret_all, "code": 500})
    ret, task_info = task_service.get_all_otl_task(page, size, status, otl_id)
    if ret != 200:
        return jsonify({'res': task_info, "code": 500})
    tasksatues = []
    if len(task_all["df"]) != 0:
        tasksatues = task_all["df"]["task_status"].values.tolist()
    if "running" in tasksatues:
        result["all_task_status"] = "running"
    else:
        result["all_task_status"] = "finished"
    result["task_info"] = {}
    result["task_info"]["task_count"] = len(task_all["df"])
    result["task_info"]["tasks"] = []
    task_info = task_info["ret"]
    if len(task_info) > 0:
        for row in task_info:
            one_task = {}
            one_task["task_name"] = row["task_name"]
            one_task["task_id"] = row["task_id"]
            one_task["celery_task_id"] = row["celery_task_id"]
            one_task["task_status"] = row["task_status"]
            one_task["task_type"] = row["task_type"]
            result["task_info"]["tasks"].append(one_task)
    ###获取结果
    result_code, result_info = task_service.get_all_otl_task_result(used_task, otl_id)
    if result_code != 200:
        return jsonify({'res': result_info, "code": 500})
    result_info = result_info["df"]
    result["result_info"] = {}
    result["result_info"]["result_count"] = len(result_info)
    result["result_info"]["results"] = []
    if len(result_info) > 0:
        for index, row in result_info.iterrows():
            one_result = {}
            one_result["task_id"] = row["task_id"]
            one_result["result"] = eval(row["result"])
            ds_id = row["ds_id"]
            ds_info = dsm_dao.getdatabyid(ds_id)
            ds_info = ds_info[0]
            ds_info["file_type"] = row["postfix"]
            one_result["data_source"] = ds_info

            result["result_info"]["results"].append(one_result)

    obj["res"] = result
    return jsonify({'res': obj["res"], "code": 200})


# 删除单个任务
@add_app.route('/onto/delete_task', methods=['POST'])
def delete_otl_task():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        task_list = params_json["task_list"]
        # 查看graph_id 存在不，如果不存在执行任务，如果存在，根据状态：执行中和等待中不可以执行，
        # 其他状态可以执行，且把该条数据放到历史记录去，并且查询结束时间放到历史记录
        # ret_code, task_data = task_service.get_task_by_task_id(task_id)
        ret_code, task_data = task_service.get_task_list(task_list)
        if ret_code != 200:
            return jsonify({'res': task_data["res"], "code": 500})

        task_data = task_data["df"]
        # # 执行任务时，查询redis任务的状态更新
        # task_service.updatetaskstatus(task_data)
        if len(task_data) == 0:
            return jsonify(
                {'res': {"cause": "task list doesn`t exist ", "code": 500024, "message": "delete task error"},
                 "code": 500})
        else:
            if len(task_data) > 0:
                for index, row in task_data.iterrows():
                    # task_data = task_data.loc[0]
                    # 获得实时状态
                    # task_status = task_service.getredistaskstatus(task_data["task_id"])
                    task_status = row["task_status"]
                    celery_task_id = row["celery_task_id"]
                    task_id = row["task_id"]
                    if task_status:
                        if task_status == "running" or task_status == "waiting":
                            # 停止任务
                            cel.control.revoke(celery_task_id, terminate=True)
                            # # 更新状态
                            # task_service.updatestoptask(task_id)
                        # 删除 任务列表
                    del_code, del_obj = task_service.delete_otl_task(task_id)
                    if del_code == 500:
                        return jsonify({'res': del_obj, "code": 500})

                return jsonify({'res': "delete task list success", "code": 200})

    except Exception as e:
        err = repr(e)
        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})


####删除整个本体的相关任务
@add_app.route('/onto/deletealltask', methods=['DELETE'])
def delete_all_otl_task():
    try:
        params_json = request.args.to_dict()
        otl_id = params_json["ontology_id"]
        ret = otl_dao.getbyid(otl_id)
        if len(ret) == 0:
            return jsonify(
                {"res": {"cause": "ontology_id doesn`t exist!", "code": 500025, "message": "task cannot be deleted!"},
                 "code": 500})

        ret_code, task_data = task_service.get_all_by_otlid(otl_id)
        if ret_code != 200:
            return jsonify({"res": task_data, "code": 500})
        all_code, all_data = task_service.get_all_task_from_otl_table(otl_id)
        if all_code != 200:
            return jsonify({"res": all_data, "code": 500})
        all_task = eval(all_data["df"].loc[0, "all_task"])
        all_task_df = pd.DataFrame(all_task, columns=["task_id"])
        if len(task_data["df"]) > 0:
            task_data = task_data["df"]
            task_data = pd.concat([task_data, all_task_df]).drop_duplicates(subset=["task_id"], keep=False)
            if len(task_data) > 0:
                for index, row in task_data.iterrows():
                    # 获得实时状态
                    # task_status = task_service.getredistaskstatus(task_data["task_id"])
                    task_id = row["task_id"]
                    task_status = row["task_status"]
                    celery_task_id = row["celery_task_id"]
                    if task_status == "running" or task_status == "waiting":
                        # 停止任务
                        cel.control.revoke(celery_task_id, terminate=True)
                        # # 更新状态
                        # task_service.updatestoptask(task_id)
                    # 删除 任务列表
                    del_code, del_obj = task_service.delete_otl_task(task_id)
                    if del_code == 500:
                        return jsonify({"res": del_obj, "code": 500})

                return jsonify({'res': "delete all task of otl_id " + str(otl_id) + " success", "code": 200})
            else:
                return jsonify({'res': "there is no task of  otl_id " + str(otl_id), "code": 200})
        else:
            return jsonify({'res': "there is no task of  otl_id " + str(otl_id), "code": 200})

    except Exception as e:
        err = repr(e)
        return jsonify({'res': {"cause": err, "code": 500001, "message": "task cannot be deleted!"}, "code": 500})


@add_app.route('/onto/getfilestatus', methods=['GET'])
def getfilestatus():
    obj = {}
    try:
        params_json = request.args.to_dict()
        task_id = params_json["task_id"]
        page = int(params_json["page"]) - 1
        size = int(params_json["size"])
        ret_code, task_data = task_service.get_task_by_task_id(task_id)
        if ret_code != 200:
            return jsonify({'res': {"cause": task_data["cause"], "code": 500001, "message": "task not exist!"},
                            "code": 500})
        task_data = task_data["ret"]
        if len(task_data) > 0:
            # # 执行任务时，查询redis任务的状态更新
            # task_service.updatetaskstatus(task_data)
            for row in task_data:
                # 获得实时状态
                # task_status = task_service.getredistaskstatus(task_data["task_id"])
                task_status = row["task_status"]

                if task_status == "running":
                    # 返回running字段
                    obj["res"] = {}
                    obj["res"]["result"] = {}
                    obj["res"]["result"]["task_id"] = row["task_id"]
                    obj["res"]["result"]["ontology_id"] = row["ontology_id"]
                    obj["res"]["result"]["file_numbers"] = "-"
                    obj["res"]["result"]["task_status"] = "running"
                    obj["res"]["result"]["error_code"] = ""
                    obj["res"]["result"]["files"] = []
                    obj["res"]["result"]["create_user_name"] = row["create_user_name"]
                    obj["res"]["result"]["create_time"] = row["create_time"]
                    obj["res"]["result"]["update_time"] = "-"
                    # # 更新状态
                    # task_service.updatestoptask(task_id)
                elif task_status == "failed":
                    obj["res"] = {}
                    obj["res"]["result"] = {}
                    obj["res"]["result"]["task_id"] = row["task_id"]
                    obj["res"]["result"]["ontology_id"] = row["ontology_id"]
                    obj["res"]["result"]["file_numbers"] = "-"
                    obj["res"]["result"]["task_status"] = "failed"
                    result = row["result"]
                    result = result.replace("\'", "")
                    dd = re.findall(r"code: [0-9]+, message", result)
                    code = re.findall(r"[0-9]+", dd[0])[0]
                    obj["res"]["result"]["error_code"] = int(code)
                    obj["res"]["result"]["files"] = []
                    obj["res"]["result"]["create_user_name"] = row["create_user_name"]
                    obj["res"]["result"]["create_time"] = row["create_time"]
                    obj["res"]["result"]["update_time"] = row["update_time"]
                elif task_status == "finished":
                    file_list = row["file_list"]
                    file_list = eval(file_list)
                    newfile_list = []
                    if len(file_list) > 0:
                        for file in file_list:
                            if len(file) == 6:
                                newfile_list.append(file[1:])
                            else:
                                newfile_list.append(file)
                    file = newfile_list[page * size:(page + 1) * size]
                    obj["res"] = {}
                    obj["res"]["result"] = {}
                    obj["res"]["result"]["task_id"] = row["task_id"]
                    obj["res"]["result"]["ontology_id"] = row["ontology_id"]
                    obj["res"]["result"]["file_numbers"] = len(newfile_list)
                    obj["res"]["result"]["task_status"] = row["task_status"]
                    obj["res"]["result"]["error_code"] = ""
                    obj["res"]["result"]["files"] = file
                    obj["res"]["result"]["create_user_name"] = row["create_user_name"]
                    obj["res"]["result"]["create_time"] = row["create_time"]
                    obj["res"]["result"]["update_time"] = row["update_time"]

                return jsonify({'res': obj["res"], "code": 200})
        else:
            return jsonify({'res': {"cause": "task not exist!", "code": 500024, "message": "task not exist!"},
                            "code": 500})
    except Exception as e:
        err = repr(e)
        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})


# 健康检查
@add_app.route('/onto/health/ready', methods=["GET"], strict_slashes=False)
def health():
    return jsonify({'res': "success", "code": 200})


@add_app.route('/onto/health/alive', methods=["GET"], strict_slashes=False)
def healthalive():
    return jsonify({'res': "success", "code": 200})

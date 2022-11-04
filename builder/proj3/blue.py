# -*-coding:utf-8-*-
from flask import Blueprint
add_app = Blueprint('add_app', __name__)
from task import *
import pandas as pd
import sys ,os
import re
import json
from flask import jsonify,request
sys.path.append(os.path.abspath("../"))
from service.Otl_Service import otl_service
from service.task_Service import task_service
from dao.dsm_dao import dsm_dao
from dao.otl_dao import otl_dao
from utils.Otl_Util import otl_util
import datetime


def start_otl_task(params_json,task_id):
    task = predict_ontology.apply_async(args=[params_json,task_id])
    task_state=task.status
    # task_state = task_dao.getstatusbytaskid(task.id)

    if task_state == "":
        task_status = "redis wrong"  # redis 挂掉了
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
    if finished_time is None:
        finished_time = "None"
    else:
        date_done = str(finished_time).split(".")[0]
        UTC_FORMAT = "%Y-%m-%d %H:%M:%S"
        utcTime = datetime.datetime.strptime(date_done, UTC_FORMAT)
        finished_time = utcTime + datetime.timedelta(hours=8)
    # task_id=params_json["task_id"]
    # 更新本体任务状态
    ret_code, obj = task_service.update_otl_task(task_status, "", celery_task_id,task_id,finished_time)
    if ret_code != 200:
        return ret_code,celery_task_id

    return ret_code,celery_task_id

@add_app.route('/onto/buildertask', methods=['POST'])
def otl_task():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        obj = {}
        # 查看当前running的任务数是否>=3,(运行中的任务数量最大为3)
        retcode, status_info = task_service.getrunningtask()
        if retcode != 200:
            return jsonify(
                {'res': {"cause": "failed to get running task ", "code": 500001, "message": "add new task wrong"},
                 "code": 500})
        else:
            status = status_info["running"]
            if status == False:
                return jsonify({'res': {
                    "cause": "can`t add new task beacuse the number of task has reached the upper limitation ",
                    "code": 500026, "message": "add new task wrong"}, "code": 500})
            else:
                otl_id = params_json["ontology_id"]
                ds_id = params_json["ds_id"]
                postfix = params_json["postfix"]
                file_list = params_json["file_list"]
                if len(file_list) > 1:
                    task_type = "multi-files"
                    name_code,task_name = task_service.get_multi_task_name(otl_id)
                    if name_code !=200:
                        return jsonify({'res': {"cause":task_name['cause'], "code": 500001, "message": "get multi task name wrong"}, "code": 500})
                else:
                    one = file_list[0]
                    if not isinstance(one, dict):
                        task_type = "table"
                        task_name = one
                    else:
                        file_type = one["type"]
                        task_name = one["name"]
                        # name_code, task_name = otl_service.getdocname(ds_id, one["docid"])
                        # if name_code != 200:
                        #     return jsonify({'res': {"cause": task_name['cause'], "code": 500001,
                        #                             "message": "task start wrong"}, "code": 500})
                            # return jsonify({'res': task_name, "code": 500})

                        if file_type == "dir":
                            task_type = "files"
                        else:
                            task_type = params_json["postfix"]
                # 根据本体id在本体表中查找
                check_df=otl_dao.getbyid(otl_id)
                if len(check_df)==0:
                    return jsonify({'res': {"cause": "ontology table dont have this otl_id", "code": 500025,
                                            "message": "task start wrong"}, "code": 500})
                # 在本体任务表ontology_task_table中插入任务记录
                add_code, add_res = task_service.add_otl_task(otl_id, task_name, ds_id, task_type, postfix)
                if add_code!=200:
                    return jsonify({'res': {"cause":add_res['cause'], "code": 500001,"message": "task start wrong"}, "code": 500})

                obj["ontology_id"] = otl_id
                task_id = add_res["res"]
                # print(params_json)
                # print(task_id)
                new_params_json = {}
                new_params_json["ontology_id"] = params_json["ontology_id"]
                new_params_json["file_list"] = params_json["file_list"]
                new_params_json["postfix"] = params_json["postfix"]
                new_params_json["ds_id"] = params_json["ds_id"]
                ds_id = new_params_json["ds_id"]
                # 根据数据源id在数据源表data_source_table中查找
                data = dsm_dao.getdatabyid(ds_id)
                if len(data) == 0:
                    return jsonify({'res': {"cause": "datasource table dont have this ds_id 153", "code": 500006,
                                            "message": "task  start wrong"}, "code": 500})

                else:
                    new_params_json["ds_password"] = data.loc[0, "ds_password"]
                    new_params_json["data_source"] = data.loc[0, "data_source"]
                    new_params_json["ds_user"] = data.loc[0, "ds_user"]
                    new_params_json["ds_address"] = data.loc[0, "ds_address"]
                    new_params_json["ds_port"] = str(data.loc[0, "ds_port"])
                    new_params_json["ds_path"] = data.loc[0, "ds_path"]
                    new_params_json["ds_auth"] = data.loc[0, "ds_auth"]
                    new_params_json["dsname"] = data.loc[0, "dsname"]
                    new_params_json["vhost"] = data.loc[0, "vhost"]
                    new_params_json["queue"] = data.loc[0, "queue"]
                    new_params_json["json_schema"] = data.loc[0, "json_schema"]
                    
                    # # rabbitmq数据源预测本体时，拉平后的json_schema key长度大于50则报错，无法抽取
                    # if new_params_json["data_source"] == "rabbitmq":
                    #     flat_data = otl_util.flatten_json_n(json.loads(new_params_json["json_schema"]))
                    #     for key in flat_data.keys():
                    #         if len(key) > 50:
                    #             return jsonify({'res': {"cause": "property name length greater than 50",
                    #                                     "code": 500001,
                    #                                     "message": "property name length, Unable to extract"}, "code": 500})
                        
                # 开始任务
                print("new_params_json: ",new_params_json)
                print("task_id: ",task_id)
                start_code, celery_task_id = start_otl_task(new_params_json,task_id)
                if start_code == 200:
                    obj["celery_task_id"] = celery_task_id
                    return jsonify({'res': obj, "code": 200})
                else:
                    return jsonify({'res': {"cause": task_id + " start wrong", "code": 500001,
                                            "message": task_id + " start wrong"}, "code": 500})

    except Exception as e:
        err = repr(e)
        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})

# 获取任务列表
@add_app.route('/onto/getalltask', methods=['POST'])
def get_all_otl_task():
    obj = {}
    params_json = request.get_data()
    params_json = json.loads(params_json)
    result = {}
    # params_json={"page":5,"size":4,"status":"all","otl_id":"new_5","used_task":[1,2,5,6]}
    page = int(params_json["page"])-1
    size = params_json["size"]
    status = "all"
    otl_id = params_json["ontology_id"]
    used_task = params_json["used_task"]
    df = otl_dao.getbyid(otl_id)
    if len(df) == 0:
        return jsonify({"res": {"cause": "ontology_id doesn`t exist!", "code": 500025, "message": "can`t get task information"}, "code": 500})
    ret_all,task_all=task_service.get_all_by_otlid(otl_id)
    if ret_all!=200:
        return  jsonify({'res': ret_all, "code": 500})
    ret,task_info=task_service.get_all_otl_task(page,size,status,otl_id)
    if ret!=200:
        return  jsonify({'res': task_info, "code": 500})
    tasksatues=task_all["df"]["task_status"].values.tolist()
    if "running" in tasksatues:
        result["all_task_status"] = "running"
    else:
        result["all_task_status"] = "finished"
    result["task_info"] = {}
    result["task_info"]["task_count"] = len(task_all["df"])
    result["task_info"]["tasks"] = []
    task_info=task_info["df"]
    if len(task_info)>0:
        for index , row in task_info.iterrows():
            one_task={}
            one_task["task_name"]=row["task_name"]
            one_task["task_id"] = row["task_id"]
            one_task["celery_task_id"] = row["celery_task_id"]
            one_task["task_status"] = row["task_status"]
            one_task["task_type"] = row["task_type"]
            result["task_info"]["tasks"].append(one_task)
    ###获取结果
    result_code,result_info=task_service.get_all_otl_task_result(used_task,otl_id)
    if result_code!=200:
        return jsonify({'res': result_info, "code": 500})
    result_info=result_info["df"]
    result["result_info"] = {}
    result["result_info"]["result_count"] = len(result_info)
    result["result_info"]["results"] = []
    if len(result_info)>0:
        for index , row in result_info.iterrows():
            one_result={}
            one_result["task_id"]=row["task_id"]
            one_result["result"] = eval(row["result"])
            ds_id = row["ds_id"]
            df = dsm_dao.getdatabyid(ds_id)
            result_df = df.to_dict("records")[0]
            result_df ["file_type"] = row["postfix"]
            one_result["data_source"] = result_df

            result["result_info"]["results"].append(one_result)

    obj["res"]=result
    return jsonify({'res': obj["res"], "code": 200})


# 删除单个任务
@add_app.route('/onto/delete_task', methods=['POST'])
def delete_otl_task():
    try:
        # params_json = request.args.to_dict()
        # # params_json = json.loads(params_json)
        # task_id=params_json["task_id"]
        params_json = request.get_data()
        params_json = json.loads(params_json)
        task_list = params_json["task_list"]
        # 查看graph_id 存在不，如果不存在执行任务，如果存在，根据状态：执行中和等待中不可以执行，
        # 其他状态可以执行，且把该条数据放到历史记录去，并且查询结束时间放到历史记录
        # ret_code, task_data = task_service.get_task_by_task_id(task_id)
        ret_code, task_data = task_service.get_task_list(task_list)
        if ret_code!=200:
            return jsonify({'res': task_data["res"], "code": 500})

        task_data = task_data["df"]
        # # 执行任务时，查询redis任务的状态更新
        # task_service.updatetaskstatus(task_data)
        if len(task_data)==0:
            return jsonify({'res': {"cause": "task list doesn`t exist ", "code": 500024, "message": "delete task error"}, "code": 500})
        else:
            if len(task_data)>0:
                for index,row in task_data.iterrows():
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
                    if del_code ==500:
                        return jsonify({'res': del_obj, "code": 500})
                return jsonify({'res':"delete task list success" , "code": 200})


    # else:
    #     return jsonify({'res': {"cause": "task cannot exist!", "code": 500024, "message": "task cannot exist!"},
    #                     "code": 500})
    except Exception as e:
        err = repr(e)
        return jsonify({'res': {"cause": err, "code": 500001, "message": err}, "code": 500})
####删除整个本体的相关任务
@add_app.route('/onto/deletealltask', methods=['DELETE'])
def delete_all_otl_task():
    try:
        params_json = request.args.to_dict()
        # params_json={"otl_id":"5","state":"edit"}##编辑不保存
        # params_json = {"otl_id": "5", "state": "finished"}  ##删本体
        # params_json = {"otl_id": "new_5", "state": "create"}  ##新建不保存
        otl_id = params_json["ontology_id"]
        df=otl_dao.getbyid(otl_id)
        if len(df)==0:
            return jsonify({"res": {"cause": "ontology_id doesn`t exist!", "code": 500025, "message": "task cannot be deleted!"}, "code": 500})

        ret_code, task_data = task_service.get_all_by_otlid(otl_id)
        if ret_code!=200:
            return jsonify({"res": task_data, "code": 500})
        all_code,all_data=task_service.get_all_task_from_otl_table(otl_id)
        if all_code!=200:
            return jsonify({"res": all_data, "code": 500})
        all_task=eval(all_data["df"].loc[0,"all_task"])
        all_task_df=pd.DataFrame(all_task,columns=["task_id"])
        if len(task_data["df"]) > 0:
            task_data = task_data["df"]
            task_data = pd.concat([task_data, all_task_df]).drop_duplicates(subset=["task_id"], keep=False)
            if len(task_data)>0:
                for index,row in task_data.iterrows():
                # 获得实时状态
                # task_status = task_service.getredistaskstatus(task_data["task_id"])
                    task_id=row["task_id"]
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
                        return jsonify({ "res":del_obj, "code": 500})
                return jsonify({'res': "delete all task of otl_id "+str(otl_id)+" success", "code": 200})
            else:
                return jsonify({'res': "there is no task of  otl_id " + str(otl_id) , "code": 200})
        else:
            return jsonify({'res': "there is no task of  otl_id " + str(otl_id), "code": 200})



    except Exception as e:
        err = repr(e)
        return jsonify({'res': {"cause": err, "code": 500001, "message": "task cannot be deleted!"}, "code": 500})

@add_app.route('/onto/getfilestatus', methods=['GET'])
def getfilestatus():
    obj={}
    try:
        params_json = request.args.to_dict()
        task_id = params_json["task_id"]
        page = int(params_json["page"])-1
        size = int(params_json["size"])
        ret_code, task_data = task_service.get_task_by_task_id(task_id)
        if ret_code!=200:
            return jsonify({'res': {"cause": task_data["cause"], "code": 500001, "message": "task not exist!"},
                            "code": 500})
        task_data=task_data["df"]
        if len(task_data) >0:
            # # 执行任务时，查询redis任务的状态更新
            # task_service.updatetaskstatus(task_data)
            for index, row in task_data.iterrows():
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
                    obj["res"]["result"]["create_time"] = row["create_time"]
                    obj["res"]["result"]["finished_time"] = "-"
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
                    obj["res"]["result"]["create_time"] = row["create_time"]
                    obj["res"]["result"]["finished_time"] = row["finished_time"]
                elif task_status == "finished":
                    file_list = row["file_list"]
                    file_list = eval(file_list)
                    newfile_list = []
                    if len(file_list)>0:
                        for file in file_list:
                            if len(file)== 6 :
                                newfile_list.append(file[1:])
                            else:
                                newfile_list.append(file)
                    file = newfile_list[page * size:(page + 1) * size]
                    obj["res"] = {}
                    obj["res"]["result"] = {}
                    obj["res"]["result"]["task_id"]=row["task_id"]
                    obj["res"]["result"]["ontology_id"] = row["ontology_id"]
                    obj["res"]["result"]["file_numbers"] = len(newfile_list)
                    obj["res"]["result"]["task_status"] = row["task_status"]
                    obj["res"]["result"]["error_code"] = ""
                    obj["res"]["result"]["files"] = file
                    obj["res"]["result"]["create_time"] = row["create_time"]
                    obj["res"]["result"]["finished_time"] = row["finished_time"]
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



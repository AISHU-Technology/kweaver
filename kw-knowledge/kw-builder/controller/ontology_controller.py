# -*-coding:utf-8-*-
# @Time    : 2020/8/12 15:57
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn

import yaml
import uuid

from dao.knw_dao import knw_dao
from service.Otl_Open_Service import otlOpenSerivice
from service.Otl_Service import otl_service
from utils.ontology_check_params import otl_check_params
from flask_babel import gettext as _l
from flask import Blueprint, request, jsonify, send_from_directory
from utils.CommonUtil import commonutil
from utils.log_info import Logger
import common.stand_log as log_oper
import sys
import os
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from dao.gridfs_dao import gridfs_dao
import requests
import json
from utils.celery_check_params_json import celery_check_params
from common.errorcode.gview import Gview as Gview2
from common.errorcode import codes
import traceback
from babel import negotiate_locale
from flasgger import swag_from

ontology_controller_app = Blueprint('ontology_controller_app', __name__)
ontology_controller_open = Blueprint('ontology_controller_open', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH', os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r', encoding='utf-8') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_old_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_old_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_old_response.update(swagger_definitions)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)



########mysql、hive根据数据源返回数据表#######
@ontology_controller_app.route('/ds_table/list', methods=["GET"])
def get_table():

    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        Logger.log_info(params_json)
        paramscode, message = otl_check_params.valid_params_check("get_table", params_json)
        if paramscode != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return Gview2.TErrorreturn(codes.Builder_OtlController_GetTable_ParamError,
                                       description=message,
                                       cause=message), 400

        ret_code, ret_message = otl_service.showtables(params_json)  ###########显示数据表####################
        if ret_code != CommonResponseStatus.SUCCESS.value:
            return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                      Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                      ErrorLink=ret_message["ErrorLink"]), ret_code
        
        return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview2.TErrorreturn(codes.Builder_OtlController_GetTable_ParamError,
                                   description="Incorrect parameter format",
                                   cause=param_message), 400


# ##########源数据预览#########
@ontology_controller_app.route('/preview_data', methods=["GET"])
def data_preview():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            paramscode, message = otl_check_params.valid_params_check("preview_data", params_json)
            if paramscode != 0:
                error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
                Logger.log_error(error_log)
                code = codes.Builder_OntologyController_DataPreview_ParamError
                
                return Gview2.TErrorreturn(code, message=message), 400
            ret_code, ret_message = otl_service.preview_data(params_json)
            
            return ret_message, ret_code
        else:
            code = codes.Builder_OntologyController_DataPreview_ParamError
            
            return Gview2.TErrorreturn(code, message=param_message), 400
    except Exception as e:
        error_log = log_oper.get_error_log("data_preview err:%s" % str(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_OntologyController_DataPreview_UnknownError
        
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


# 抽取数据
@ontology_controller_app.route('/autogen_schema', methods=["post"])
def predict_ontology():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        paramscode, message = otl_check_params.valid_params_check("predict_ontology", params_json)
        if paramscode != 0:
            code = codes.Builder_OntologyController_PredictOntology_ParamError
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            
            return Gview2.TErrorreturn(code, message=message), 400
        ret_code, ret_message = otl_service.predict_ontology(params_json)
        
        return ret_message, ret_code
    except Exception as e:
        error_log = log_oper.get_error_log("predict_ontology err:%s" % str(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_OntologyController_PredictOntology_UnknownError
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


# 新建本体
@ontology_controller_app.route('/add', methods=["post"])
def save_ontology():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        # check params
        ret_code, ret_message = otl_check_params.saveOtlPar(params_json)
        if ret_code != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            code = codes.Builder_OntologyController_SaveOntology_ParamsError
            return Gview2.error_return(code, message=ret_message), 400

        # generate identify_id
        params_json['identify_id'] = str(uuid.uuid1())
        ret_code, ret_message, onto_id = otl_service.ontology_save(params_json)
        if onto_id == -1:
            
            return ret_message, ret_code

        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, onto_id, params_json,
                                                   "新建了本体{id=%s}" % onto_id, "otl")
        Logger.log_info(operation_log)
        
        return Gview2.json_return(ret_message), CommonResponseStatus.SUCCESS.value
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_OntologyController_SaveOntology_UnknownError
        
        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@ontology_controller_app.route('/edit/<otl_id>', methods=['POST'])
def edit_ontology(otl_id):
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_error_code = codes.Builder_OntologyController_EditOntology_ParamError
        if param_code < 0:
            
            return Gview2.error_return(param_error_code, message=param_message), 400
        # check params
        if not otl_id.isdigit() or otl_id == "0":
            param_message = "otl_id" + _l(' must be int, and more than zero!')
            
            return Gview2.error_return(param_error_code, message=param_message), 400
        ret_code, ret_message = otl_check_params.editOtlPar(params_json)
        if ret_code != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            
            return Gview2.error_return(param_error_code, message=ret_message), 400

        params_json["otl_id"] = otl_id
        ret_code, ret_message = otl_service.edit_ontology(params_json)
        if ret_code != 200:
            
            return ret_message, ret_code

        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, otl_id, params_json,
                                                   "编辑了本体{id=%s}" % otl_id, "otl")
        Logger.log_info(operation_log)
        
        return Gview2.json_return(ret_message), CommonResponseStatus.SUCCESS.value
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_OntologyController_EditOntology_UnknownError
        
        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@ontology_controller_app.route('/delete', methods=['POST'])
def delete_ontology():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_error_code = codes.Builder_OntologyController_DelOntology_ParamError
        if param_code < 0:

            return Gview2.error_return(param_error_code, message=param_message), 400
        # check params
        ret_code, ret_message = otl_check_params.deleteOtlPar(params_json)
        if ret_code != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)

            return Gview2.error_return(param_error_code, message=ret_message), 400

        ret_code, ret_message = otl_service.delete_ontology(params_json)
        if ret_code != 200:

            return ret_message, ret_code

        otl_ids = params_json["otl_ids"]
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, otl_ids, params_json,
                                                   "删除了本体{id=%s}" % otl_ids, "otl")
        Logger.log_info(operation_log)

        return Gview2.json_return(ret_message), CommonResponseStatus.SUCCESS.value
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_OntologyController_DelOntology_UnknownError

        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@ontology_controller_app.route('/page', methods=["get"])
def getall():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_error_code = codes.Builder_OntologyController_GetAll_ParamError
        if param_code < 0:

            return Gview2.error_return(param_error_code, message=param_message), 400

        check_res, message = otl_check_params.getAllParOnto(params_json)
        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return Gview2.error_return(param_error_code, message=message), 400

        # 调用rbac接口获取数据源列表
        # dataIds = request.headers.get("dataIds")
        # otl_ids = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]
        params_json["otl_ids"] = []

        # params_json['user_id'] = request.headers.get("userId")

        # get ontology list
        ret_code, ret_message = otl_service.getall(params_json)
        if ret_code != 200:
            return ret_message, ret_code

        return Gview2.json_return(ret_message), CommonResponseStatus.SUCCESS.value
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_OntologyController_GetAll_UnknownError

        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@ontology_controller_app.route('/<otl_id>', methods=["get"], strict_slashes=False)
def otl(otl_id):
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_error_code = codes.Builder_OntologyController_Otl_ParamError
        if param_code < 0:

            return Gview2.error_return(param_error_code, message=param_message), 400
        # check otl_id
        if not otl_id.isdigit() or otl_id == "0":
            param_message = "otl_id" + _l(' must be int, and more than zero!')

            return Gview2.error_return(param_error_code, message=param_message), 400

        ret_code, ret_message = otl_service.get_by_id(otl_id)
        if ret_code != 200:
            
            return ret_message, ret_code

        return Gview2.json_return(ret_message), CommonResponseStatus.SUCCESS.value
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_OntologyController_Otl_UnknownError

        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@ontology_controller_app.route('/delotlbyids', methods=["DELETE"], strict_slashes=False)
def delotl():

    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    ret_code, ret_message = otl_service.delete(params_json, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:

        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    user_name = request.headers.get("username")
    ids = set(params_json["otlids"])
    operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, list(ids), {}, "删除了本体{id=%s}" % ids, "otl")
    Logger.log_info(operation_log)

    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/edit_name/<otlid>', methods=["post"], strict_slashes=False)
def updateotlname(otlid):
    try:
        host_url = getHostUrl()
        param_code, params_json, param_message = commonutil.getMethodParam()
        if not otlid.isdigit():
            code = codes.Builder_OntologyController_UpdateName_ParamError
            message = "The parameter otlid type must be int!"
            
            return Gview2.TErrorreturn(code, message=message), 400
        if param_code != 0:
            code = codes.Builder_OntologyController_UpdateName_ParamError
            
            return Gview2.TErrorreturn(code, message=param_message), 400
        check_res, message = otl_check_params.valid_params_check("update_otl_name", params_json)
        if check_res != 0:
            code = codes.Builder_OntologyController_UpdateName_ParamError
            
            return Gview2.TErrorreturn(code, message=message), 400
        params_json["ontology_id"] = str(otlid)

        ret_code, ret_message = otl_service.update_name(otlid, params_json, host_url, "-1")
        if ret_code != 200:
            
            return ret_message, ret_code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, otlid, params_json,
                                                   "修改了本体{id=%s}名称，结果为%s" % (otlid, params_json), "otl")
        Logger.log_info(operation_log)
        
        return Gview2.json_return(ret_message), CommonResponseStatus.SUCCESS.value

    except Exception as e:
        error_log = log_oper.get_error_log("update ontology name error" % params_json, sys._getframe())
        Logger.log_error(error_log)
        code = codes.Builder_OntologyController_UpdateName_UnknownError
        
        return Gview2.TErrorreturn(code, cause=str(e), description=str(e)), 500


@ontology_controller_app.route('updateinfo/<otlid>', methods=["put"], strict_slashes=False)
def updateotlinfo(otlid):
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    if not otlid.isdigit():
        message = "The parameter otlid type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if param_code == 0:
        # 待做 新增参数校验
        check_res, message = otl_check_params.valid_params_check("update_otl_info", params_json)
        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        params_json["ontology_id"] = str(otlid)
        logiccode, logicmessage = otl_check_params.entity_relation_check(params_json)
        if logiccode != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return Gview.BuFailVreturn(cause=logicmessage, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=logicmessage), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = otl_service.update_info(otlid, params_json, host_url, "-1")
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, otlid, params_json,
                                                   "修改了本体{id=%s}" % otlid, "otl")
        Logger.log_info(operation_log)
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value

    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@ontology_controller_app.route('/kg/<kg_id>', methods=["get"], strict_slashes=False)
def getotlbykgid(kg_id):

    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    if not kg_id.isdigit():
        return Gview.TErrorreturn(
            ErrorCode='Builder.controller.ontology.getKGid.KGidWrongFormat',
            Description='The parameter kg_id type must be int!',
            ErrorDetails='The parameter kg_id type must be int!',
            Solution='please check your kg_id',
            ErrorLink=''
        ), 400
    if param_code == 0:
        # 根据kg_id查询本体id
        code, obj = otl_service.getOtlIdbyKGId(kg_id)
        if code != CommonResponseStatus.SUCCESS.value:
            return obj, code
        otlid = obj
        # 根据本体id返回本体信息
        ret_code, ret_message = otl_service.get_by_id(otlid)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            return ret_message, ret_code
        # 过滤本体中不在图数据库中的点或边
        ret_code, ret_message = otl_service.filterotl(kg_id, ret_message)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            return ret_message, ret_code
        return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/task/build', methods=["POST"], strict_slashes=False)
def build_onto_task():
    try:
        params_json = request.get_data()
        params_json = json.loads(params_json)
        #####验证改
        paramscode, message = celery_check_params.valid_params_check("build_onto_task", params_json)
        if paramscode != 0:
            code = codes.Builder_OntologyController_BuildOntoTask_ParamError
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            
            return Gview2.TErrorreturn(code, message=message), 400
        url = "http://localhost:6488/onto/buildertask"
        # url = "http://10.4.37.76:6488/onto/buildertask"  # for debug
        payload = params_json
        headers = {
            'Content-Type': 'application/json',
            'userId': request.headers.get("userId"),
            'Accept-Language': request.headers.get('Accept-Language')
        }
        response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, params_json["ontology_id"], params_json,
                                                   "创建了本体{id=%s}构建任务" % params_json["ontology_id"], "otl")
        Logger.log_info(operation_log)
        
        return response.json(), response.status_code
    except Exception as e:
        error_log = log_oper.get_error_log("build_onto_task err:%s" % str(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_OntologyController_BuildOntoTask_UnknownError
        return Gview2.TErrorreturn(code, cause=repr(e), description=repr(e)), 500


@ontology_controller_app.route('/task/page', methods=["POST"], strict_slashes=False)
def gettaskinfo():

    params_json = request.get_data()
    params_json = json.loads(params_json)
    #####验证改
    paramscode, message = celery_check_params.valid_params_check("gettaskinfo", params_json)
    if paramscode != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        code = codes.Builder_OtlController_GetTaskInfo_ParamError
        
        return Gview2.TErrorreturn(code, cause=message, description=message), 400
    url = "http://localhost:6488/onto/getalltask"
    # url = "http://10.4.37.76:6488/onto/getalltask"  #debug
    payload = params_json
    headers = {
        'Content-Type': 'application/json',
        'userId': request.headers.get("userId"),
    }
    response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
    res_json = response.json()
    code = res_json["code"]
    if code != 200:
        ret_message = res_json["res"]
        code = codes.Builder_OtlController_GetTaskInfo_UnknownError
        
        return Gview2.TErrorreturn(code, cause=ret_message["cause"], description=ret_message["message"]), 500
    else:
        res_json_return = {}
        res_json_return["res"] = res_json["res"]
        
        return res_json_return, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/task/delete', methods=["POST"], strict_slashes=False)
def deletetask():

    params_json = request.get_data()
    params_json = json.loads(params_json)
    #####验证改
    paramscode, message = celery_check_params.valid_params_check("deletetask", params_json)
    if paramscode != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    url = "http://localhost:6488/onto/delete_task"
    # url = "http://10.4.37.76:6488/onto/delete_task" #debug
    payload = params_json
    # url=url+'?'+"task_id="+task_id
    headers = {
        'Content-Type': 'application/json',
        'userId': request.headers.get("userId")
    }
    response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
    # return make_response(jsonify(result=response.text))
    res_json = response.json()
    code = res_json["code"]
    if code != 200:
        ret_message = res_json["res"]
        
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    else:
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, params_json["task_list"], params_json,
                                                   "删除本体构建任务{id=%s}" % params_json["task_list"], "otl")
        Logger.log_info(operation_log)
        res_json_return = {}
        res_json_return["res"] = res_json["res"]
        
        return res_json_return, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/task_files/page', methods=["GET"], strict_slashes=False)
def get_task_files():

    params_json = request.args.to_dict()
    #####验证改
    paramscode, message = celery_check_params.valid_params_check("get_task_files", params_json)
    if paramscode != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    task_id = params_json["task_id"]
    page = params_json["page"]
    size = params_json["size"]
    url = "http://localhost:6488/onto/getfilestatus"
    # url = "http://10.4.37.76:6488/onto/getfilestatus" #debug
    url = url + '?' + "task_id=" + task_id + '&'
    url = url + "page=" + page + '&'
    url = url + "size=" + size
    headers = {
        'Content-Type': 'application/json',
        'userId': request.headers.get("userId")
    }
    response = requests.request("GET", url, headers=headers)
    res_json = response.json()
    code = res_json["code"]
    if code != 200:
        ret_message = res_json["res"]
        
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    else:
        res_json_return = {}
        res_json_return["res"] = res_json["res"]
        
        return res_json_return, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/task/batch_delete', methods=["DELETE"], strict_slashes=False)
def deletealltask():

    params_json = request.args.to_dict()
    paramscode, message = celery_check_params.valid_params_check("deletealltask", params_json)
    if paramscode != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    ontology_id = params_json["ontology_id"]
    # state = params_json["state"]
    url = "http://localhost:6488/onto/deletealltask"
    # url = "http://10.4.37.76:6488/onto/deletealltask" #debug
    url = url + '?' + "ontology_id=%s" % (ontology_id)
    headers = {
        'Content-Type': 'application/json',
        'userId': request.headers.get("userId")
    }
    response = requests.request("DELETE", url, headers=headers)
    # return make_response(jsonify(result=response.text))
    res_json = response.json()
    code = res_json["code"]
    if code != 200:
        ret_message = res_json["res"]
        
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    else:
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, ontology_id, {},
                                                   "删除本体{id=%s}所有构建任务" % ontology_id, "otl")
        Logger.log_info(operation_log)
        res_json_return = {}
        res_json_return["res"] = res_json["res"]
        
        return res_json_return, CommonResponseStatus.SUCCESS.value


# 本体入口，一键导入时数据源列表
@ontology_controller_app.route('/ds/list', methods=["get"], strict_slashes=False)
def graphDsList():

    # dataIds = request.headers.get("dataIds")
    # kgIds = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]
    kgIds = []
    ret_code, ret_message = otl_service.getds(kgIds)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/import_task', methods=["POST"], strict_slashes=False)
def import_task():
    """
    从文件导入本体
    """
    try:
        try:
            file = request.files.getlist('file')
        except Exception as e:
            error_log = log_oper.get_error_log("import ontology task get file err:%s" % str(e), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)
            code = codes.Builder_OntologyController_ImportTask_ParamError
            message = _l('failed to obtain the uploaded file. ') + str(e)
            
            return Gview2.TErrorreturn(code, message=message), 400
        if len(file) != 1:
            code = codes.Builder_OntologyController_ImportTask_ParamError
            message = _l('the number of uploaded files can only be 1. ')
            
            return Gview2.TErrorreturn(code, message=message), 400
        file = file[0]
        if file.filename.split('.')[-1] not in ['xlsx', 'json']:
            code = codes.Builder_OntologyController_ImportTask_ParamError
            message = _l('the type of uploaded file can only be xlsx or json. ')
            
            return Gview2.TErrorreturn(code, message=message), 400
        file_path = '/tmp/'
        if os.name == 'nt':
            file_path = 'C:/Users/Public/Downloads/'
        file.save(file_path + file.filename)
        gridfs_dao.connect()
        gridfs_dao.save(file_path + file.filename, file.filename)
        if os.path.getsize(file_path + file.filename) > 10 * 1024 * 1024:
            code = codes.Builder_OntologyController_ImportTask_ParamError
            message = _l('the size of uploaded file can not be larger tha 10M. ')
            
            return Gview2.TErrorreturn(code, message=message), 400
        knw_id = request.headers.get('knw-id')
        if not knw_id:
            code = codes.Builder_OntologyController_ImportTask_ParamError
            message = _l('parameter knw-id cannot be empty. ')
            
            return Gview2.TErrorreturn(code, message=message), 400
        res = knw_dao.check_knw_id(knw_id)
        if len(res) == 0:
            code = codes.Builder_OntologyController_ImportTask_KnwIdNotExist
            
            return Gview2.TErrorreturn(code, knw_id=knw_id), 500
        url = 'http://localhost:6488/task/import_onto'
        # url = 'http://10.4.37.76:6488/task/import_onto' #debug
        headers = {'Accept-Language': request.headers.get('Accept-Language')}
        payload = {'task_params': json.dumps({'file_name': file.filename}),
                   'task_name': 'import_onto-{}'.format(knw_id),
                   'async_task_name': 'cel.import_onto',
                   'relation_id': knw_id}
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            code = codes.Builder_OntologyController_ImportTask_AsyncTaskInternalError
            
            return Gview2.TErrorreturn(code, detail=str(response.text)), 500
        
        return response.json(), response.status_code
    except Exception as e:
        error_log = log_oper.get_error_log("import ontology task err:%s" % str(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_OntologyController_ImportTask_UnknownError
        
        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 500


@ontology_controller_app.route('/import_task', methods=["GET"], strict_slashes=False)
def get_import_task():
    """
    获取导入本体的任务状态
    """
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_error_code = codes.Builder_OntologyController_GetImportTask_ParamError
        message = ""
        if param_code < 0:
            
            return Gview2.TErrorreturn(param_error_code, message=param_message), 400
        # check param
        if "celery_task_id" not in params_json.keys() or not params_json["celery_task_id"]:
            message += _l("parameter celery_task_id is missing! ")
        if "knw_id" not in params_json.keys():
            message += _l("parameter knw_id is missing! ")
        elif not params_json["knw_id"].isdigit():
            message += _l("parameter knw_id must be int. ")
        if message:
            
            return Gview2.TErrorreturn(param_error_code, message=message), 400
        code, res = otl_service.get_import_task(params_json["celery_task_id"])
        
        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("get import ontology task result err:%s" % str(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_OntologyController_GetImportTask_UnknownError
        
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


@ontology_controller_app.route('/template', methods=["POST"], strict_slashes=False)
def download_onto_template():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_error_code = codes.Builder_OntologyController_DownloadOntoTemplate_ParamError
        message = ""
        if param_code < 0:
            
            return Gview2.TErrorreturn(param_error_code, message=param_message), 400
        # check param
        if "format" not in params_json.keys():
            message += _l("parameter format is missing! ")
        elif params_json["format"] not in ['xlsx', 'json']:
            message += _l("parameter format must be xlsx or json. ")
        if message:
            
            return Gview2.TErrorreturn(param_error_code, message=message), 400
        current_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(current_path, "template/")
        preferred = [x.replace('-', '_') for x in request.accept_languages.values()]
        language = negotiate_locale(preferred, ['en', 'zh'])
        if params_json["format"] == 'xlsx':
            if language == 'zh':
                file_name = '本体模板.xlsx'
            else:
                file_name = 'Ontology Template.xlsx'
        elif params_json["format"] == 'json':
            if language == 'zh':
                file_name = '本体模板json_zh.zip'
            else:
                file_name = '本体模板json_en.zip'
            # file_name = '本体模板.json'
        
        return send_from_directory(file_path, file_name, as_attachment=True)
    except Exception as e:
        error_log = log_oper.get_error_log("get import ontology task result err:%s" % str(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_OntologyController_DownloadOntoTemplate_UnknownError
        
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


@ontology_controller_app.route('/export', methods=["POST"], strict_slashes=False)
def export_onto():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_error_code = codes.Builder_OntologyController_ExportOnto_ParamError
        message = ""
        if param_code < 0:
            
            return Gview2.TErrorreturn(param_error_code, message=param_message), 400
        # check param
        if "format" not in params_json.keys():
            message += _l("parameter format is missing! ")
        elif params_json["format"] not in ['xlsx', 'json']:
            message += _l("parameter format must be xlsx or json. ")
        if "otl_id" not in params_json.keys():
            message += _l("parameter otl_id is missing! ")
        elif not isinstance(params_json['otl_id'], int):
            message += _l('parameter otl_id must be int. ')
        if message:
            
            return Gview2.TErrorreturn(param_error_code, message=message), 400
        preferred = [x.replace('-', '_') for x in request.accept_languages.values()]
        language = negotiate_locale(preferred, ['en', 'zh'])
        code, res = otl_service.export_onto(params_json['otl_id'], params_json['format'], language)
        if code == 200:
            
            return send_from_directory(res['file_path'], res['file_name'], as_attachment=True)
        else:
            
            return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("get import ontology task result err:%s" % str(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_OntologyController_ExportOnto_UnknownError
        
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


@ontology_controller_app.route('/sql/extract', methods=["POST"], strict_slashes=False)
def sql_extract():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_err_code = codes.Builder_OntologyController_SqlExtract_ParamError
        ret_status, message = otl_check_params.otlSqlExtractPar(params_json)
        if ret_status == -1:
            
            return Gview2.TErrorreturn(param_err_code, message=message), 400

        code, res = otl_service.sql_extract(params_json)
        if code != 200:
            
            return res, code
        
        return Gview2.json_return(res), code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_OntologyController_SqlExtract_UnknownError
        
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


@ontology_controller_app.route('/sql/preview_data', methods=["POST"], strict_slashes=False)
def sql_preview_data():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_err_code = codes.Builder_OntologyController_SqlPreViewData_ParamError
        ret_status, message = otl_check_params.otlSqlPreviewPar(params_json)
        if ret_status == -1:
            return Gview2.TErrorreturn(param_err_code, message=message), 400
        code, res = otl_service.sql_extract(params_json, preview=True)
        if code != 200:
            return res, code
        return Gview2.json_return(res), code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_OntologyController_SqlPreviewData_UnknownError
        
        return Gview2.TErrorreturn(code, description=str(e), cause=str(e)), 500


@ontology_controller_app.route('/vector/service_status', methods=["GET"], strict_slashes=False)
def get_vector_service_status():
    try:
        code, data = otl_service.get_vector_service_status()
        return data, code
    except Exception as e:
        return Gview2.json_return("Vector Service Exception"), 200


# 本体绑定数据源过滤
def BindingDataSourceFiltering(res, OwnerIds):
    """
    parms：
        res: 查询得到的本体数据{ "res": {"count": 1, "df" : []}}
        OwnerIds: 当前用户具有拥有者身份的数据源
    return：
        过滤掉本体数据中权限不足的绑定数据源(点和边都有可能绑定数据，均需过滤)
    """
    otls = res.get("res", {})
    df = otls.get("df", [])
    if len(df) > 0:
        for i in range(len(df)):
            # 点
            entitys = df[i].get("entity", [])
            for j in range(len(entitys)):
                ds_id = entitys[j].get("ds_id", 0)
                OwnerIds = list(map(str, OwnerIds))
                if ds_id not in OwnerIds:
                    res["res"]["df"][i]["entity"][j]["source_table"] = []
                    res["res"]["df"][i]["entity"][j]["source_type"] = "manual"
                    res["res"]["df"][i]["entity"][j]["data_type"] = ""
                    res["res"]["df"][i]["entity"][j]["data_source"] = ""
                    res["res"]["df"][i]["entity"][j]["ds_address"] = ""
                    res["res"]["df"][i]["entity"][j]["ds_id"] = ""
                    res["res"]["df"][i]["entity"][j]["ds_name"] = ""
                    res["res"]["df"][i]["entity"][j]["ds_path"] = ""
                    res["res"]["df"][i]["entity"][j]["extract_type"] = ""
                    res["res"]["df"][i]["entity"][j]["file_type"] = ""
                    res["res"]["df"][i]["entity"][j]["model"] = ""
                    res["res"]["df"][i]["entity"][j]["task_id"] = ""
            # 边
            edges = df[i].get("edge", [])
            for k in range(len(edges)):
                ds_id = edges[k].get("ds_id", 0)
                if ds_id not in OwnerIds:
                    res["res"]["df"][i]["edge"][k]["source_table"] = []
                    res["res"]["df"][i]["edge"][k]["source_type"] = "manual"
                    res["res"]["df"][i]["edge"][k]["data_type"] = ""
                    res["res"]["df"][i]["edge"][k]["data_source"] = ""
                    res["res"]["df"][i]["edge"][k]["ds_address"] = ""
                    res["res"]["df"][i]["edge"][k]["ds_id"] = ""
                    res["res"]["df"][i]["edge"][k]["ds_name"] = ""
                    res["res"]["df"][i]["edge"][k]["ds_path"] = ""
                    res["res"]["df"][i]["edge"][k]["extract_type"] = ""
                    res["res"]["df"][i]["edge"][k]["file_type"] = ""
                    res["res"]["df"][i]["edge"][k]["model"] = ""
                    res["res"]["df"][i]["edge"][k]["task_id"] = ""
    return res


def getHostUrl():
    hostUrl = request.host_url
    return hostUrl

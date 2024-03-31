# -*- coding:utf-8 -*-
import sys
from flask import Blueprint, request
from common.errorcode.gview import Gview
from common.errorcode import codes
import common.stand_log as log_oper
from utils.log_info import Logger
from utils.CommonUtil import commonutil
import traceback
from utils.function_check_parameters import function_check_parameters
from service.function_service import function_service

function_controller_app = Blueprint('function_controller_app', __name__)


@function_controller_app.route('/create', methods=["post"], strict_slashes=False)
def create_function():
    """ 新建函数 """
    try:
        # check parameters
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = codes.Builder_FunctionController_CreateFunction_ParamError
            return Gview.error_return(code, message=param_message), 400
        param_code, param_message = function_check_parameters.create_function(params_json)
        if param_code != function_check_parameters.VALID:
            code = codes.Builder_FunctionController_CreateFunction_ParamError
            return Gview.error_return(code, message=param_message), 400
        # create function
        code, res = function_service.create_function(params_json)
        # user operate log
        if code == 200:
            user_name = request.headers.get("username")
            operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, res["function_id"], params_json,
                                                       "创建了函数{id=%s}" % res["function_id"], "function")
            Logger.log_info(operation_log)
            return Gview.json_return(res), code
        return res, code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_FunctionController_CreateFunction_UnknownError
        return Gview.error_return(code, description=str(e), cause=str(e)), 500


@function_controller_app.route('/edit', methods=["post"], strict_slashes=False)
def edit_function():
    """ 编辑函数 """
    try:
        # check parameters
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = codes.Builder_FunctionController_EditFunction_ParamError
            return Gview.error_return(code, message=param_message), 400
        param_code, param_message = function_check_parameters.edit_function(params_json)
        if param_code != function_check_parameters.VALID:
            code = codes.Builder_FunctionController_EditFunction_ParamError
            return Gview.error_return(code, message=param_message), 400
        # edit function
        code, res = function_service.edit_function(params_json)
        # user operate log
        if code == 200:
            function_id = params_json["function_id"]
            user_name = request.headers.get("username")
            operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, function_id, params_json,
                                                       "修改了函数{id=%s}, 结果为%s" % (function_id, params_json), "function")
            Logger.log_info(operation_log)
            return Gview.json_return(res), code
        return res, code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_FunctionController_EditFunction_UnknownError
        return Gview.error_return(code, description=str(e), cause=str(e)), 500


@function_controller_app.route('/delete', methods=["post"], strict_slashes=False)
def delete_function():
    """ 删除函数 """
    try:
        # check parameters
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = codes.Builder_FunctionController_DeleteFunction_ParamError
            return Gview.error_return(code, message=param_message), 400
        param_code, param_message = function_check_parameters.delete_function(params_json)
        if param_code != function_check_parameters.VALID:
            code = codes.Builder_FunctionController_DeleteFunction_ParamError
            return Gview.error_return(code, message=param_message), 400
        # delete function
        code, res = function_service.delete_function(params_json)
        # user operate log
        if code == 200:
            function_ids = params_json["function_ids"]
            user_name = request.headers.get("username")
            operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, function_ids, params_json,
                                                       "删除了函数{id=%s}" % function_ids, "function")
            Logger.log_info(operation_log)
            return Gview.json_return(res), code
        return res, code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_FunctionController_DeleteFunction_UnknownError
        return Gview.error_return(code, description=str(e), cause=str(e)), 500


@function_controller_app.route('/list', methods=["get"], strict_slashes=False)
def get_function_list():
    """ 获取函数列表 """
    try:
        # check parameters
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = codes.Builder_FunctionController_GetFunctionList_ParamError
            return Gview.error_return(code, message=param_message), 400
        param_code, param_message = function_check_parameters.get_function_list(params_json)
        if param_code != function_check_parameters.VALID:
            code = codes.Builder_FunctionController_GetFunctionList_ParamError
            return Gview.error_return(code, message=param_message), 400

        # dataIds = request.headers.get("dataIds")
        # function_ids = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]
        # params_json['function_ids'] = function_ids
        params_json['function_ids'] = []

        # get function list
        code, res = function_service.get_function_list(params_json)
        return res, code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_FunctionController_GetFunctionList_UnknownError
        return Gview.error_return(code, description=str(e), cause=str(e)), 500


@function_controller_app.route('/get_by_id', methods=["get"], strict_slashes=False)
def get_function_by_id():
    """ 获取函数详情 """
    try:
        # check parameters
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = codes.Builder_FunctionController_GetFunctionById_ParamError
            return Gview.error_return(code, message=param_message), 400
        param_code, param_message = function_check_parameters.get_function_by_id(params_json)
        if param_code != function_check_parameters.VALID:
            code = codes.Builder_FunctionController_GetFunctionById_ParamError
            return Gview.error_return(code, message=param_message), 400
        # get function by id
        code, res = function_service.get_function_by_id(params_json)
        return res, code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_FunctionController_GetFunctionById_UnknownError
        return Gview.error_return(code, description=str(e), cause=str(e)), 500

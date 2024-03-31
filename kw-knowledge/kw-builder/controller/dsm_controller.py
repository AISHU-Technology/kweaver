# -*-coding:utf-8-*-
# @Time    : 2020/8/10 17:53
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import json
import os
import sys
import traceback

import yaml
from flask import Blueprint, request, jsonify
from flask_babel import gettext as _l

import common.stand_log as log_oper
from common.errorcode import codes
from common.errorcode.gview import Gview as Gview2
from service.dsm_Service import dsm_service
from utils.CommonUtil import commonutil
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from utils.ds_check_parameters import dsCheckParameters
from utils.log_info import Logger

dsm_controller_app = Blueprint('dsm_controller_app', __name__)
dsm_controller_open = Blueprint('dsm_controller_open', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH',
                               os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from flasgger import swag_from
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r', encoding='utf-8') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)


@dsm_controller_app.route('/testconnect', methods=["post"], strict_slashes=False)
def connectTest():
    """测试连接"""
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = dsCheckParameters.testConPar(params_json)
        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            
            return Gview2.TErrorreturn(codes.Builder_dsmController_connectTest_ParametersError,
                                       description=message), 400

        ret_code, ret_message = dsm_service.connectTest(params_json)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            
            return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                      Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                      ErrorLink=ret_message["ErrorLink"]), ret_code
        
        return Gview2.json_return(ret_message.get("res")), CommonResponseStatus.SUCCESS.value
    else:
        
        return Gview2.TErrorreturn(codes.Builder_dsmController_connectTest_ParametersError,
                                   description=param_message), 400


@dsm_controller_app.route('', methods=["get"], strict_slashes=False)
@dsm_controller_open.route('', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def getdss():
    """
    获取所有数据源
    获取所有数据源
    ---
    operationId: get_dss
    parameters:
        -   name: dataIds
            in: header
            description: 需要获取数据源信息的ID集合，使用","分割
            required: true
            schema:
                type: string
            example: 1,2,3
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - page
                        - size
                        - order
                        - knw_id
                    properties:
                        page:
                            type: integer
                            format: int32
                            description: 列表页号
                            example: 1
                        size:
                            type: integer
                            format: int32
                            description: 每页个数
                            example: 10
                        order:
                            type: string
                            format: string
                            description: 排序方式
                            example: ascend
                            enum:
                                - ascend
                                - descend
                        knw_id:
                            type: integer
                            format: int32
                            description: 知识网络ID,为-1时查询全部网络下的数据源
                            example: 1
                        ds_type:
                            type: string
                            format: string
                            description: 根据数据源类型进行筛选，可选值：["mysql", "hive", "sqlserver", "kingbasees", "postgresql", "clickhouse"];默认不传此参数返回所有
                            example: mysql
    responses:
        '200':
            description: 获取所有数据源成功
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/builder.ds.getdss200'
    """
    _, params_json, _ = commonutil.getMethodParam()
    host_url = getHostUrl()
    check_res, message = dsCheckParameters.getAllPar(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.getdss.ParametersError",
                                  Description=message, Solution=message, ErrorDetails=message,
                                  ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value

    # dataIds = request.headers.get("dataIds")
    # res_list = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]
    # params_json["kgIds"] = res_list

    ret_code, ret_message = dsm_service.getall(params_json, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        
        return Gview.TErrorreturn(ErrorCode=ret_message["code"], Description=ret_message["cause"],
                                  Solution=ret_message["cause"], ErrorDetails=ret_message["message"],
                                  ErrorLink=""), CommonResponseStatus.SERVER_ERROR.value
    
    return ret_message, CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('', methods=["post"], strict_slashes=False)
@dsm_controller_open.route('', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def addds():
    """
    新增数据源
    新增数据源
    ---
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - dsname
                        - data_source
                        - dataType
                        - ds_address
                        - ds_port
                        - ds_path
                        - extract_type
                        - knw_id
                        - connect_type
                        - ds_user
                        - ds_password
                    properties:
                        dsname:
                            type: string
                            format: string
                            description: 数据源名称
                            example: 测试用mysql
                        data_source:
                            type: string
                            format: string
                            description: 数据源类型
                            example: mysql
                            enum:
                                - mysql
                                - hive
                                - sqlserver
                                - kingbasees
                                - postgresql
                        dataType:
                            type: string
                            format: string
                            description: 数据类型
                            example: structured
                            enum:
                                - structured
                                - unstructured
                        ds_address:
                            type: string
                            format: string
                            description: IP
                            example: 192.168.0.1
                        ds_port:
                            type: integer
                            format: int32
                            description: 端口
                            example: 3306
                        ds_user:
                            type: string
                            format: string
                            description: 数据源用户名
                            example: root
                        ds_password:
                            type: string
                            format: string
                            description: 加密后的密码
                            example: ZWlzb28uY29tMTIz
                        ds_path:
                            type: string
                            format: string
                            description: 数据库database
                            example: anydata
                        extract_type:
                            type: string
                            format: string
                            description: 抽取类型
                            example: standardExtraction
                            enum:
                                - standardExtraction
                                - modelExtraction
                        knw_id:
                            type: integer
                            format: int32
                            description: 知识网络ID
                            example: 1
                        connect_type:
                            type: string
                            format: string
                            description: 连接类型
                            example: odbc
                            enum:
                                - odbc
                                -
    """
    _, params_json, _ = commonutil.getMethodParam()
    host_url = getHostUrl()
    ret_code, ret_message, ds_id = dsm_service.addds(params_json, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        
        return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                  Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                  ErrorLink=ret_message["ErrorLink"]), CommonResponseStatus.SERVER_ERROR.value
    # user_id = request.headers.get("Userid")
    # user_name = user_mgnt.get_user_info_by_id(user_id)["username"]
    user_name = ""
    operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, ds_id, params_json,
                                               "创建了数据源{id=%s}" % ds_id, "ds")
    Logger.log_info(operation_log)
    obj = {"res": ret_message.get("res"), "ds_id": ds_id}
    
    return jsonify(obj), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/<dsid>', methods=["post"], strict_slashes=False)
@dsm_controller_open.route('/<dsid>', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def ds(dsid):
    """
    数据源修改
    数据源修改
    ---
    operationId: update_ds
    parameters:
        -   name: ds_id
            in: path
            required: true
            description: 数据源ID
            schema:
                type: 'integer'
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - dsname
                        - data_source
                        - connect_type
                        - ds_user
                        - ds_password
                    properties:
                        dsname:
                            type: string
                            format: string
                            description: 数据源名称
                            example: 测试用mysql
                        data_source:
                            type: string
                            format: string
                            description: 数据源类型
                            example: mysql
                            enum:
                                - mysql
                                - hive
                                - sqlserver
                                - kingbasees
                                - postgresql
                                - sqlserver
                        ds_user:
                            type: string
                            format: string
                            description: 数据源用户名
                            example: root
                        ds_password:
                            type: string
                            format: string
                            description: 加密后的密码
                            example: ZWlzb28uY29tMTIz
                        json_schema:
                            type: string
                            format: string
                            description: json scheme
                            example: ''
                        ds_auth:
                            type: string
                            format: string
                            description: auth_token的id
                            example: ''
                        ds_port:
                            type: integer
                            format: int32
                            description: as数据源端口
                            example: 666
                        connect_type:
                            type: string
                            format: string
                            description: 连接类型
                            example: odbc
                            enum:
                                - odbc
                                -
    """
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    Logger.log_info(params_json)

    # params_json["user_id"] = request.headers["userId"]
    # params_json["roles"] = request.headers["roles"]
    ret_code, ret_message = dsm_service.update(dsid, params_json, host_url)
    if ret_code != CommonResponseStatus.SUCCESS.value:
        
        return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                  Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                  ErrorLink=ret_message["ErrorLink"]), ret_code
    user_name = request.headers.get("username")
    operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, dsid, params_json,
                                               "修改了数据源{id=%s}" % dsid, "ds")
    Logger.log_info(operation_log)
    return Gview2.json_return(ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/delbydsids', methods=["DELETE"], strict_slashes=False)
@dsm_controller_open.route('/delbydsids', methods=["DELETE"], strict_slashes=False)
@swag_from(swagger_new_response)
def delds():
    """
    数据源删除
    数据源删除
    ---
    operationId: del_by_ds_ids
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - dsids
                    properties:
                        dsids:
                            type: array
                            items:
                                type: integer
                            description: 数据源ID集合
                            example: [1, 2, 3]
    """
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    Logger.log_info(params_json)
    ret_code, ret_message = dsm_service.delete(params_json, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    obj = {"res": ret_message.get("res") + " success", "ds_ids": ret_message.get("ds_ids")}
    user_name = request.headers.get("username")
    operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, params_json["dsids"], {},
                                               "删除了数据源{id=%s}" % params_json["dsids"], "ds")
    Logger.log_info(operation_log)
    
    return jsonify(obj), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/get_by_id', methods=["GET"], strict_slashes=False)
@dsm_controller_open.route('/get_by_id', methods=["GET"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_by_id():
    """
        根据数据源id获取数据源信息
        根据数据源id获取数据源信息
        ---
        operationId: get_by_id
        parameters:
            -   name: dataIds
                in: header
                description: 需要获取数据源信息的ID集合，使用","分割
                required: true
                schema:
                    type: string
                example: 1,2,3
        requestBody:
            description: 'request body'
            content:
                application/json:
                    schema:
                        type: 'object'
                        required:
                            - ds_id
                        properties:
                            ds_id:
                                type: integer
                                format: int32
                                description: 数据源ID
                                example: 1
        responses:
            '200':
                description: 获取数据源成功
                content:
                    application/json:
                        schema:
                            $ref: '#/components/schemas/builder.ds.get_by_id200'
    """
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        ds_id = params_json.get("ds_id")
        message = ""
        if ds_id is None:
            message = _l("NO parameter %s. ") % "ds_id"
        elif not ds_id.isdigit():
            message = "ds_id" + _l(" must be number！")
        if message:
            code = codes.Builder_DsmController_GetById_ParamError
            
            return Gview2.error_return(code, message=message), 400
        res_code, res = dsm_service.getById(int(ds_id))
        if res_code == 200:
            
            return Gview2.json_return(res), res_code
        return res, res_code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_DsmController_GetById_UnknownError
        
        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


# 模糊查询
@dsm_controller_app.route('/searchbyname', methods=["get"], strict_slashes=False)
def getbydsname():
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    Logger.log_info(params_json)
    if param_code == 0:
        check_res, message = dsCheckParameters.dsgetbynamePar(params_json)
        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.getbydsname.ParametersError",
                                      Description=message, Solution=message, ErrorDetails="ParametersError",
                                      ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value

        # dataIds = request.headers.get("dataIds")
        # kgIds = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]
        # params_json["kgIds"] = kgIds

        ret_code, ret_message = dsm_service.getbydsname(params_json, host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            
            return Gview.TErrorreturn(ErrorCode=ret_message["code"], Description=ret_message["cause"],
                                      Solution=ret_message["cause"], ErrorDetails=ret_message["message"],
                                      ErrorLink=""), ret_code
        
        return ret_message, CommonResponseStatus.SUCCESS.value

    else:
        
        return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.getbydsname.ParametersError",
                                  Description=param_message, Solution=param_message,
                                  ErrorDetails="Incorrect parameter format",
                                  ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value


# 数据源复制
@dsm_controller_app.route('/ds_copy/<ds_id>', methods=["post"], strict_slashes=False)
def ds_copy(ds_id):
    host_url = getHostUrl()
    Logger.log_info("dsid: {}".format(ds_id))
    # 获取参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0:
        
        return Gview.TErrorreturn("Builder.controller.dsm_controller.ds_copy.ParametersError",
                                  param_message, param_message, "Incorrect parameter format",
                                  ""), CommonResponseStatus.BAD_REQUEST.value

    # 参数校验
    check_res, message = dsCheckParameters.dsAddPar(params_json)
    if check_res != 0:
        
        return Gview.TErrorreturn("Builder.controller.dsm_controller.ds_copy.ParametersError",
                                  message, message, "parameters error", ""), CommonResponseStatus.BAD_REQUEST.value
    # ds_id 必须是int
    if not ds_id.isdigit():
        
        return Gview.TErrorreturn("Builder.controller.dsm_controller.ds_copy.ParametersError",
                                  _l("ds_id must be int "), "ds_id must be int ",
                                  "parameters error", ""), CommonResponseStatus.BAD_REQUEST.value
    # ds_id 不存在
    code, obj = dsm_service.checkById(ds_id)
    if code != 0:
        
        return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.ds_copy.ParametersError",
                                  Description=obj["Cause"], Solution=obj["Cause"],
                                  ErrorDetails=obj["message"], ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value

    ds_id_tmp = ds_id
    ret_code, ret_message, ds_id = dsm_service.addds(params_json, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        
        return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                  Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                  ErrorLink=ret_message["ErrorLink"]), CommonResponseStatus.SERVER_ERROR.value

    obj = {"res": ret_message.get("res"), "ds_id": ds_id}
    user_name = request.headers.get("username")
    operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, ds_id, {"ds_id": ds_id},
                                               "复制了数据源{id=%s}，新数据源为:%s" % (ds_id_tmp, {"ds_id": ds_id}), "ds")
    Logger.log_info(operation_log)
        
    return jsonify(obj), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/hive/partitions', methods=["GET"], strict_slashes=False)
def getHivePartitions():
    ''' 获取hive数据源表的分区字段 '''
    params_json = request.args.to_dict()
    paramscode, message = dsCheckParameters.getHivePartitions(params_json)
    if paramscode != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.getHivePartitions.ParametersError",
                                  Description=message,
                                  Solution="Please check your parameter again.", ErrorDetails=message,
                                  ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = dsm_service.getHivePartitions(params_json["ds_id"], params_json["table_name"])
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        
        return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                  Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                  ErrorLink=ret_message["ErrorLink"]), CommonResponseStatus.SERVER_ERROR.value
    obj = {"res": ret_message}
        
    return jsonify(obj), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/hive/partition_case', methods=["GET"], strict_slashes=False)
def getHivePartitionCase():
    ''' 通过分区表达式获取hive分区实例 '''

    params_json = request.args.to_dict()
    paramscode, message = dsCheckParameters.getPartitionCase(params_json)
    if paramscode != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview.TErrorreturn(
            ErrorCode="Builder.controller.dsm_controller.getHivePartitionCase.ParametersError", Description=message,
            Solution="Please check your parameter again.", ErrorDetails=message,
            ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = dsm_service.getPartitionCase(params_json["expression"])
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        
        return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                  Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                  ErrorLink=ret_message["ErrorLink"]), CommonResponseStatus.SERVER_ERROR.value
    obj = {"res": ret_message}
    
    return jsonify(obj), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/hive/partition_infos/check', methods=["POST"], strict_slashes=False)
def checkPartitionInfos():
    ''' 批量检查分区配置 '''
    # 获取参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0:
        return Gview.TErrorreturn("Builder.controller.dsm_controller.checkPartitionInfos.ParametersError",
                                  param_message, param_message, "Incorrect parameter format",
                                  ""), CommonResponseStatus.BAD_REQUEST.value
    # 参数检查
    paramscode, message = dsCheckParameters.checkPartitionInfos(params_json)
    if paramscode != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.checkPartitionInfos.ParametersError",
                                  Description=message,
                                  Solution="Please check your parameter again.", ErrorDetails=message,
                                  ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value

    ret_code, ret_message = dsm_service.checkPartitionInfos(params_json["ds_id"], params_json["table_name"],
                                                            params_json["partition_infos"])
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        
        return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                  Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                  ErrorLink=ret_message["ErrorLink"]), CommonResponseStatus.SERVER_ERROR.value
    obj = {"res": ret_message}
        
    return jsonify(obj), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/table_field', methods=["GET"], strict_slashes=False)
def table_field():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_err_code = codes.Builder_DsmController_TableField_ParamError
        ret_status, message = dsCheckParameters.tableFieldPar(params_json)
        if ret_status == -1:
            return Gview2.TErrorreturn(param_err_code, message=message), 400

        # params_json["user_id"] = request.headers["userId"]
        # params_json["roles"] = request.headers["roles"]
        code, res = dsm_service.table_field(params_json)
        if code != 200:
            
            return res, code
        
        return Gview2.json_return(res), code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_DsmController_TableField_UnknownError
        
        return Gview2.TErrorreturn(code, cause=str(e)), 500


@dsm_controller_app.route('/sql', methods=["POST"], strict_slashes=False)
def ds_sql():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_err_code = codes.Builder_DsmController_DsSql_ParamError
        ret_status, message = dsCheckParameters.dsSql(params_json)
        if ret_status == -1:

            return Gview2.TErrorreturn(param_err_code, message=message), 400

        # params_json["user_id"] = request.headers["userId"]
        # params_json["roles"] = request.headers["roles"]
        code, res = dsm_service.ds_sql(params_json)
        if code != 200:

            return res, code

        return Gview2.json_return(res), code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_DsmController_DsSql_UnknownError

        return Gview2.TErrorreturn(code, cause=str(e)), 500


@dsm_controller_app.route('/previewdata', methods=["GET"], strict_slashes=False)
def preview_data():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        param_err_code = codes.Builder_DsmController_PreviewData_ParamError
        ret_status, message = dsCheckParameters.previewData(params_json)
        if ret_status == -1:

            return Gview2.TErrorreturn(param_err_code, message=message), 400

        params_json["limit_size"] = 500
        params_json["limit_wide"] = -1
        # params_json["user_id"] = request.headers["userId"]
        # params_json["roles"] = request.headers["roles"]
        code, res = dsm_service.preview_data(params_json)
        if code != 200:

            return res, code

        return Gview2.json_return(res), code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_DsmController_PreviewData_UnknownError

        return Gview2.TErrorreturn(code, cause=str(e)), 500


def getHostUrl():
    hostUrl = request.host_url
    return hostUrl

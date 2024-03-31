# -*-coding:utf-8-*-
# @Time    : 2020/9/7 18:22
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import os
import sys
import time
import traceback
import uuid as uuid_obj

import yaml
from flasgger import swag_from
from flask import Blueprint, request, jsonify, send_from_directory
from flask_babel import gettext as _l
from werkzeug.utils import secure_filename

import common.stand_log as log_oper
from common.errorcode import codes
from common.errorcode.gview import Gview as Gview2
from controller import celery_controller
from controller.knowledgeNetwork_controller import updateKnw
from dao.graph_dao import graph_dao
from dao.knw_dao import knw_dao
from dao.subgraph_dao import subgraph_dao
from dao.task_dao import task_dao
from service.Otl_Service import otl_service
from service.graph_Service import graph_Service
from service.intelligence_service import intelligence_calculate_service, intelligence_query_service
from service.knw_service import knw_service
from service.subgraph_service import subgraph_service
from utils.graph_param_validate import GraphParamValidate
from utils.CommonUtil import commonutil
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from utils.graph_check_parameters import graphCheckParameters
from utils.log_info import Logger
from utils.ontology_check_params import otl_check_params

graph_controller_app = Blueprint('graph_controller_app', __name__)
graph_controller_open = Blueprint('graph_controller_open', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH',
                               os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r', encoding='utf-8') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_old_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_old_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_old_response.update(swagger_definitions)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)


@graph_controller_app.route('', methods=["post"], strict_slashes=False)
def graphopt():
    '''
    GET请求：返回所有图谱信息
    POST请求：graph_Service.addgraph新增图谱
    '''
    method = request.method
    # 根据不同的请求方式请求方式获得参数并获取异常
    # get all
    if method == "GET":
        host_url = getHostUrl()
        graphParamValidate = GraphParamValidate(method)

        res_message, res_code = graphParamValidate.graphGet()
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        ret_code, ret_message = graph_Service.getallgraph(host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return ret_message, CommonResponseStatus.SUCCESS.value
    # add,新建图谱
    elif method == "POST":
        host_url = getHostUrl()
        param_code, params_json, param_message = commonutil.getMethodParam()
        params_json["graph_process"]["graph_DBName"] = "u{}".format(str(uuid_obj.uuid1()).replace('-', ''))
        ret_code, ret_message = knw_service.check_knw_id(params_json)
        if ret_code != 200:
            return Gview.BuFailVreturn(cause=ret_message["des"], code=CommonResponseStatus.INVALID_KNW_ID.value,
                                       message=ret_message["detail"]), CommonResponseStatus.SERVER_ERROR.value
        ret_code, ret_message, graph_id = graph_Service.addgraph(params_json, host_url)
        Logger.log_info(ret_message)
        if ret_code != 200:
            error_log = log_oper.get_error_log(str(ret_message), sys._getframe())
            Logger.log_error(error_log)
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), ret_code
        updateKnw(graph_id)
        obj = {"res": ret_message.get("res") + " success", "graph_id": graph_id}
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, graph_id, obj,
                                                   "新建了知识图谱{id=%s}，结果为%s" % (graph_id, obj))
        Logger.log_info(operation_log)
        return jsonify(obj), CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/getgraphdb', methods=["get"], strict_slashes=False)
def getgraphdb():
    '''
    graph_Service.getGraphDB查询图谱数据库连接信息
    '''
    host_url = getHostUrl()
    Logger.log_info(host_url)
    ret_code, ret_message = graph_Service.getGraphDB(host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/<graphid>', methods=["get"], strict_slashes=False)
def getgraphbyid(graphid):
    host_url = getHostUrl()
    if not graphid.isdigit():
        message = _l("The parameter graph id type must be int!")
        code = codes.Builder_GraphController_GetGraphById_ParamError

        return Gview2.TErrorreturn(code, description=message, cause=message), CommonResponseStatus.BAD_REQUEST.value
    # graph_id不存在
    code, ret = graph_Service.checkById(graphid)
    if code != 0:
        code = codes.Builder_GraphController_GetGraphById_CheckByIdError

        return Gview2.TErrorreturn(code, description=ret["message"], cause=ret["cause"]), 500

    ret_code, ret_message = graph_Service.getGraphById(graphid, host_url)

    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        code = codes.Builder_GraphController_GetGraphById_GetGraphByIdError

        return Gview2.TErrorreturn(code, description=ret_message["message"], cause=ret_message["cause"]), 500
        
    # 为保证hive顺序，使用json.dumps特殊处理返回
    import json
    return json.dumps(ret_message), CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/savenocheck', methods=["post"], strict_slashes=False)
def savenocheck():
    try:
        host_url = getHostUrl()
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            check_res, message = graphCheckParameters.savenoCheckPar(params_json)
            if check_res != 0:
                error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
                Logger.log_error(error_log)
                return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                           message=message), CommonResponseStatus.BAD_REQUEST.value
            ret_code, ret_message = graph_Service.savenocheck(params_json, host_url)
            if ret_code == CommonResponseStatus.SERVER_ERROR.value:

                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            user_name = request.headers.get("username")
            operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, params_json["graph_id"],
                                                       params_json,
                                                       "修改了知识图谱{id=%s}" % params_json["graph_id"])
            Logger.log_info(operation_log)
            return ret_message, CommonResponseStatus.SUCCESS.value

        else:
            return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value
    except Exception as e:
        error_log = log_oper.get_error_log("savenocheck error: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


# 一键导入时的数据源列表：该图谱下的，且属性id为1的数据源
@graph_controller_app.route('/getdsbygraphid', methods=["get"], strict_slashes=False)
def getdsbygraphids():
    '''
    根据图谱id返回数据源列表
    '''

    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = graphCheckParameters.getdsbygraphidPar(params_json)

        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value

        ret_code, ret_message = graph_Service.getdsbygraphid(params_json, host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:

            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value

        return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


def getHostUrl():
    hostUrl = request.host_url
    return hostUrl


# 根据图谱id获取图谱下的数据源或本体
@graph_controller_app.route('/query', methods=["post"], strict_slashes=False)
def getOtlDsById():
    host_url = getHostUrl()
    info = request.headers.get("info", "")
    # 获取参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        # 参数校验
        check_res, message = graphCheckParameters.getdsotlbygraphIdPar(params_json)
        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return Gview.TErrorreturn(ErrorCode="Builder.GraphController.GetOtlDsById.ParamsError",
                                      Description=message, Solution=message, ErrorDetails=message, ErrorLink="")

        ret_code, ret_message = graph_Service.getOtlDsByGraphid(params_json, host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.TErrorreturn(ErrorCode="Builder.GraphController.GetOtlDsById.InternalError",
                                      Description=ret_message["message"], Solution=ret_message["cause"],
                                      ErrorDetails=ret_message["message"], ErrorLink="")

        return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.TErrorreturn(ErrorCode="Builder.GraphController.GetOtlDsById.ParamsError",
                                  Description=param_message, Solution="Incorrect parameter format",
                                  ErrorDetails=param_message, ErrorLink="")


# 图谱查询,给定图谱id，返回图谱名称和描述
@graph_controller_app.route('/graph_info', methods=["post"], strict_slashes=False)
def getGraphInfoById():
    host_url = getHostUrl()
    info = request.headers.get("info", "")
    if info != "kg-manager":
        return Gview.BuFailVreturn(cause="No access", code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="No access"), CommonResponseStatus.BAD_REQUEST.value
    # 获取参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    # paras = request.get_argument()
    if param_code == 0:
        # 参数校验
        check_res, message = graphCheckParameters.getgraphinfoPar(params_json)
        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        try:
            ret_code, ret_message = graph_Service.getGraphInfoByGraphid(params_json, host_url)
        except Exception:
            return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.REQUEST_ERROR.value,
                                       message="Mysql correct error"), CommonResponseStatus.SERVER_ERROR.value
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:

            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


# 图谱批量删除
@graph_controller_app.route('/delbyids', methods=["POST"], strict_slashes=False)
@graph_controller_open.route("/delbyids", methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def graphDeleteByIds():
    """
    删除图谱接口
    删除图谱接口
    ---
    operationId: graphDeleteByIds
    requestBody:
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - graphids
                        - knw_id
                    properties:
                        graphids:
                            type: array
                            items:
                                type: integer
                            description: 图谱ID集合
                            example: [1, 2, 3]
                        knw_id:
                            type: integer
                            description: 知识网络id
                            example: 1
    responses:
        '200':
            description: 删除成功
            content:
                application/json:
                    schema:
                        type: 'object'
                        required:
                            - graph_id
                            - state
                        properties:
                            graph_id:
                                type: array
                                items:
                                    type: integer
                                description: 图谱ID集合
                                example: [1, 2, 3]
                            state:
                                type: string
                                description: 结果
                                example: success
    """

    userId = request.headers.get("userId")
    runs, noAuthority, noExist, normal, otl_id, search_config_id = [], [], [], [], [], []
    mess = ""
    obj, obj_code = {}, 200
    # 获取参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0:
        code = codes.Builder_GraphController_GraphDeleteByids_ParamError

        return Gview2.TErrorreturn(code, message=param_message), 400
    # 参数校验
    check_res, message = graphCheckParameters.graphDelPar(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        code = codes.Builder_GraphController_GraphDeleteByids_ParamError

        return Gview2.TErrorreturn(code, message=message), 400
    # 检查知识网络id是否存在
    ret_code, ret_message = knw_service.check_knw_id(params_json)
    if ret_code != 200:
        code = codes.Builder_GraphController_GraphDeleteByids_KnwIdNotExist

        return Gview2.TErrorreturn(code, knw_id=params_json["knw_id"]), 500
    # 检查图谱id是否存在
    graphids = params_json["graphids"]
    res = knw_dao.check_knw_graph(params_json["knw_id"], graphids)
    if len(res) != len(graphids):
        code = codes.Builder_GraphController_GraphDeleteByids_GraphIdNotExist

        return Gview2.TErrorreturn(code, graph_id=graphids), 500
    # 统计运行状态的
    res_mess, res_code = graph_Service.getStatusByIds(graphids)
    if res_code != 0:
        code = codes.Builder_GraphController_GraphDeleteByIds_UnknownError

        return Gview2.TErrorreturn(code, description=res_mess["message"], cause=res_mess["cause"]), 500
    # 运行状态的graphId列表
    runs = res_mess["runs"]

    # 统计不存在的id
    res, code = graph_Service.getNoExistIds(graphids)
    if code != 0:
        code = codes.Builder_GraphController_GraphDeleteByIds_UnknownError

        return Gview2.TErrorreturn(code, description=res["message"], cause=res["cause"]), 500
    noExist = res["noExist"]
    normal = list(set(graphids) - set(noExist) - set(runs))
    normal = list(set(normal) - set(noAuthority))
    # 单一删除
    if len(graphids) == 1:
        # 正常
        if len(normal) == 1:
            mess += "删除成功：%s; " % ",".join(map(str, normal))
            obj, obj_code = {"state": "success"}, CommonResponseStatus.SUCCESS.value
        # 不存在
        if len(noExist) != 0:
            mess += "%s 不存在; " % ",".join(map(str, noExist))
            mess += "删除成功：%s; " % ",".join(map(str, normal))
            mess += "operator userId: %s ;" % userId
            obj, obj_code = {"state": "success"}, CommonResponseStatus.SUCCESS.value
        if len(runs) == 1:
            obj, obj_code = {"Cause": "当前知识网络正在运行任务不可删除，请先停止或删除任务！",
                             "Code": CommonResponseStatus.SINGLE_RUNNING.value,
                             "message": "正在运行的网络不可以删除"}, CommonResponseStatus.SERVER_ERROR.value
        if len(noAuthority) == 1:
            obj, obj_code = {"Cause": "当前您的身份暂无该图谱相关权限！",
                             "Code": CommonResponseStatus.SINGLE_PERMISSION.value,
                             "message": "权限不足"}, CommonResponseStatus.SERVER_ERROR.value
    # 批量删除
    else:
        # 全部不存在
        if len(noExist) == len(graphids):
            obj, obj_code = {"state": "success"}, CommonResponseStatus.SUCCESS.value
        # 全部运行
        if len(runs) > 0 and len(noAuthority) == 0 and len(normal) == 0:
            obj, obj_code = {"Cause": "知识网络正在运行任务不可删除，请先停止或删除任务！！",
                             "Code": CommonResponseStatus.ALL_RUNNING.value,
                             "message": "正在运行的网络不可以删除"}, CommonResponseStatus.SERVER_ERROR.value
        # 运行 + 正常
        if len(runs) > 0 and len(noAuthority) == 0 and len(normal) > 0:
            obj, obj_code = {"Cause": "部分知识网络正在运行任务不可删除，请先停止或删除任务！",
                             "Code": CommonResponseStatus.RUNNING_AND_NORMAL.value,
                             "message": "正在运行的网络不可以删除"}, CommonResponseStatus.SERVER_ERROR.value
        # 运行 + 权限
        if len(runs) > 0 and len(noAuthority) > 0 and len(normal) == 0:
            obj, obj_code = {"Cause": "当前知识网络存在异常。删除失败，请重试！！",
                             "Code": CommonResponseStatus.RUNNING_AND_PERMISSION.value,
                             "message": "正在运行的网络不可以删除, 权限不足无法删除"}, CommonResponseStatus.SERVER_ERROR.value
        # 权限 + 正常
        if len(runs) == 0 and len(noAuthority) > 0 and len(normal) > 0:
            obj, obj_code = {"Cause": "部分知识网络相关权限，删除失败！",
                             "Code": CommonResponseStatus.PERMISSION_AND_NORMAL.value,
                             "message": "权限不足无法删除"}, CommonResponseStatus.SERVER_ERROR.value
        # 全部无权限
        if len(runs) == 0 and len(noAuthority) > 0 and len(normal) == 0:
            obj, obj_code = {"Cause": "无知识网络相关权限，删除失败！",
                             "Code": CommonResponseStatus.ALL_PERMISSION.value,
                             "message": "权限不足无法删除"}, CommonResponseStatus.SERVER_ERROR.value
        # 正常 + 运行 + 权限
        if len(runs) > 0 and len(noAuthority) > 0 and len(normal) > 0:
            obj, obj_code = {"Cause": "当前知识网络存在异常。删除失败，请重试！",
                             "Code": CommonResponseStatus.RUNNING_AND_PERMISSION_AND_NORMAL.value,
                             "message": "正在运行的网络不可以删除, 权限不足无法删除"}, CommonResponseStatus.SERVER_ERROR.value
        # 正常
        if len(runs) == 0 and len(noAuthority) == 0 and len(normal) > 0:
            obj, obj_code = {"status": "success"}, CommonResponseStatus.SUCCESS.value
    res1 = True
    # 统计上传中的图谱
    if len(normal) > 0:
        res, code = graph_Service.get_upload_id(normal)
        if code != 0:
            return Gview.TErrorreturn(res["code"], res["message"], res["solution"], res["cause"],
                                      ""), CommonResponseStatus.SERVER_ERROR.value
        if len(res) > 0:
            obj_code = 500
            desc = _l("graph upload can not delete")
            solution = _l("please wait upload finished")
            cause = _l("graph upload can not delete")
            return Gview.TErrorreturn(CommonResponseStatus.GRAPH_UPLOAD.value, desc, solution, cause, ""), obj_code
        if not res1:
            code = CommonResponseStatus.GRAPH_PERMISSION_DELETE_ERR.value

            return Gview.TErrorreturn(code, "图谱权限删除失败", "Please check permissions", "图谱权限删除失败",
                                      ""), CommonResponseStatus.SERVER_ERROR.value
    if len(normal) > 0:
        # 删除可以删除的
        res, code = graph_Service.deleteGraphByIds(normal)
        if code != 0:
            code = codes.Builder_GraphController_GraphDeleteByIds_UnknownError

            return Gview2.TErrorreturn(code, description=res["message"], cause=res["cause"]), 500

        # 更新知识网络的智商数据
        intelligence_calculate_service.update_intelligence_info(normal)

    if len(noExist) != 0:
        mess += "%s 不存在; " % ",".join(map(str, noExist))
    if len(runs) != 0:
        mess += "%s 正在运行; " % ",".join(map(str, runs))
    if len(normal) > 0:
        mess += "删除成功：%s; " % ",".join(map(str, normal))
        mess += "operator userId: %s ;" % userId
    Logger.log_info(mess)
    if len(normal) > 0:
        updateKnw(normal[0])
    if obj_code == 200:
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, normal, {},
                                                   "删除了知识图谱{id=%s}" % normal)
        Logger.log_info(operation_log)
        obj["graph_id"] = normal

        return jsonify(obj), 200
    solution = "请检查是否有删除权限或者图谱是否在运行中"
    code = codes.Builder_GraphController_GraphDeleteByIds_DeleteFail
    res_obj = {"ErrorCode": code, "Description": obj["message"], "ErrorDetails": obj["Cause"], "ErrorLink": "",
               "Solution": solution, "graph_id": normal}
        
    return jsonify(res_obj), obj_code


# 图谱编辑过程中的数据源列表
@graph_controller_app.route('/ds/<graphid>', methods=["GET"], strict_slashes=False)
def graphDsList(graphid):

    if not graphid.isdigit():
        message = _l("The parameter graph id type must be int!")
        code = codes.Builder_GraphController_GraphDsList_ParamError

        return Gview2.TErrorreturn(code, description=message, cause=message), CommonResponseStatus.BAD_REQUEST.value
    # 获取参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0:
        code = codes.Builder_GraphController_GraphDsList_ParamError

        return Gview2.TErrorreturn(code, description=_l("Incorrect parameter format"),
                                   cause=param_message), CommonResponseStatus.BAD_REQUEST.value
    # 参数校验
    check_res, message = graphCheckParameters.getGraphDSList(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        code = codes.Builder_GraphController_GraphDsList_ParamError

        return Gview2.TErrorreturn(code, description=message, cause=message), CommonResponseStatus.BAD_REQUEST.value

    # dataIds = request.headers.get("dataIds")
    # kgIds = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]


    # 该图谱拥有的数据源
    ret_code, obj = graph_Service.getDsByGraphid(graphid)
    if ret_code != 200:
        code = codes.Builder_GraphController_GraphDsList_GetDsByGraphIdError

        return Gview2.TErrorreturn(code, description=obj["message"],
                                   cause=obj["cause"]), CommonResponseStatus.SERVER_ERROR.value
    ids = obj.get("ids", [])
    # if len(kgIds) == 0:
    #     ids = []
    # for k in ids:
    # if k not in kgIds:
    #     kgIds.append(k)

    # dsids = kgIds
    params_json["dsids"] = []
    params_json["graphid"] = graphid

    ret_code, ret_message = graph_Service.getDsAll(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        code = codes.Builder_GraphController_GraphDsList_GetDsAllError

        return Gview2.TErrorreturn(code, description=obj["message"],
                                   cause=obj["cause"]), CommonResponseStatus.SERVER_ERROR.value
        
    return ret_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route("/adv-search-config/kglist-conf/<net_id>", methods=["GET"], strict_slashes=False)
def get_adv_search(net_id):
    # 在此处从头当中获取uuid值。这一步骤应该没有必要。builder项目当中未作处理。

    userId = request.headers.get("userId")
    if userId == "":
        return Gview.BuFailVreturn(
            cause="userId is not found",
            code=CommonResponseStatus.UUID_NOT_FOUND.value,
            message="userId is not found",
        ), 500

    # dataIds = request.headers.get("dataIds")
    # config_ids = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]

    # 此处兼容知识网络的功能。
    net_ids = knw_service.get_graph_by_knw_id_s(net_id)
    # if len(config_ids) == 0:
    config_ids = net_ids
    # else:
    #     config_ids = list(set(config_ids) & set(net_ids))

    # 如果长度为零，代表用户没有可见的知识图谱。直接返回即可。
    if len(config_ids) == 0:
        return Gview.BuFailVreturn(cause="user has not useful knowledge graph in this knowledge",
                                   code=CommonResponseStatus.USER_HAS_NOT_VIEWABLE_GRAPH_IN_NET.value,
                                   message="please assign permission to the user"), 500

    result = graph_Service.get_graph_conf_list(config_ids)
    forReturen = {"res": result}
        
    return jsonify(forReturen), 200


@graph_controller_app.route("/output", methods=["POST"], strict_slashes=False)
@graph_controller_open.route("/output", methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def graph_config_output():
    """
    图谱导出接口
    图谱导出接口
    ---
    operationId: graph_config_output
    requestBody:
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - id
                    properties:
                        id:
                            type: integer
                            description: 图谱ID
                            example: 1
                        check_status:
                            type: boolean
                            description: 导出时是否校验图谱已构建成功
                            example: true
    responses:
        '200':
            description: 导出成功
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/builder.graph.output_response200'
    """

    config_id = request.json.get("id")
    check_status = request.json.get("check_status", True)
    code, ret = graph_Service.checkById(config_id)
    if code != 0:
        return Gview.TErrorreturn(
            "Builder.controller.graph_controller.check_config_id.config_not_exists",
            ret["cause"], ret["cause"], ret["message"], ""
        ), 500

    if check_status and task_dao.check_task_status(config_id, "normal"):
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.task_status.task_running",
            _l("graph task is not normal or graph status is not finish"),
            _l("Please check graph or task status"),
            _l("graph task is not normal or graph status is not finish"),
            "",
        ), 500
    # 此处根据要导出的ids类型，导出图谱。
    try:
        file_path, file_name = graph_Service.graph_output(config_id)
    except Exception as e:
        error_log = log_oper.get_error_log("graph config output error: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        err = repr(e)
        return Gview.TErrorreturn(
            ErrorCode="Builder.controller.graph_controller.graph_config_output.graph_output_error",
            Description=err,
            Solution=_l("Please contact the developers."),
            ErrorDetails=err,
            ErrorLink="",
        ), 500

    user_name = request.headers.get("username")
    operation_log = log_oper.get_operation_log(user_name, log_oper.DOWNLOAD, config_id, {},
                                               "导出了知识图谱{id=%s}" % config_id)
    Logger.log_info(operation_log)

    return send_from_directory(file_path, file_name, as_attachment=True)


@graph_controller_app.route("/input", methods=["POST"], strict_slashes=False)
@graph_controller_open.route("/input", methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def graph_config_input():
    """
    图谱导入接口
    图谱导入接口
    ---
    operationId: graph_config_input
    requestBody:
        content:
            multipart/form-data:
                schema:
                    type: 'object'
                    required:
                        - knw_id
                        - file
                    properties:
                        knw_id:
                            type: integer
                            format: int32
                            description: 知识网络ID
                            example: 1
                        rename:
                            type: string
                            description: 重命名导入图谱
                            example: rename
                        file:
                            type: bytes
                            format: bytes
                            description: 图谱文件
                            example: ''
                        ds_id_map:
                            type: object
                            description: 新旧图谱ID映射表
                            example: {"21": 1, "22": 2}
    responses:
        '200':
            description: 导入成功
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/builder.graph.input_response200'
    """

    # 获取form表单当中的知识网络id和图谱id
    user_id = request.headers.get("Userid")
    roles = request.headers.get("Roles")
    knw_id = request.form.get("knw_id")
    rename = request.form.get("rename", "")
    ds_id_map = request.form.get("ds_id_map", "{}")
    ds_id_map = eval(ds_id_map)
    graph_id = request.form.get("graph_id")
    # 检测userId是否存在于头部，
    # if user_id == None:
    #     return Gview.TErrorreturn(
    #         "Builder.controller.graph_config.getuuid.uuidNotFound",
    #         "userId is not found in header",
    #         _l("Please contact the developers."),
    #         "userId is not found in header",
    #         "",
    #     ), 500
    if knw_id:
        # 检测知识网络是否存在。
        if not knw_service.check_exists_by_knw_id(knw_id):
            return Gview.TErrorreturn(
                "Builder.controller.graph_config.check_knw.knw_not_exists",
                _l("knw id %s not exists") % knw_id,
                _l("Please check your parameter again."),
                _l("knw id %s not exists") % knw_id,
                "",
            ), 500
    try:
        # 注意如果拿不到，需要报错。
        files = request.files.getlist("file")
    except Exception as e:
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.get_file.unexpect_error",
            _l("get file error"),
            _l("get file error"),
            e.__str__(),
            "",
        ), 500
    try:
        file_name = "{0}_input".format(uuid_obj.uuid4().hex)
        if os.name == 'nt': #windows
            os.makedirs('C:/Users/Public/Downloads/' + file_name)
        else:
            os.mknod(file_name)
        file = files[0]
        file.save(secure_filename(file_name))
        ret, status = graph_Service.graph_input(user_id, roles, knw_id, file_name, ds_id_map, rename, graph_id)
        if status != 200:
            return ret, 500
        graph_id = ret
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPLOAD, graph_id, {},
                                                   "导入了知识图谱{id=%s}" % graph_id)
        Logger.log_info(operation_log)

        return jsonify({'graph_id': graph_id}), 200
    except Exception as e:
        error_log = log_oper.get_error_log("graph config input error: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.unexception.unexpect_error",
            _l("unexception error"),
            _l("unexception error"),
            e.__str__(),
            "",
        ), 500
    finally:
        try:
            os.remove(file_name)
        except FileNotFoundError:
            pass


@graph_controller_open.route("/getidbydbname", methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def getidbydbname():
    """
    get id and KG_config_id by KDB_name
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.graph.getidbydbname'
    """

    dbnames = request.json.get("dbnames")
    if not dbnames or not isinstance(dbnames, list):  # 未传递dbnames 或 dbnames不为列表 或 dbnames列表长度为0
        return Gview.TErrorreturn(
            ErrorCode="Builder.comtroller.graph_config.getidbydbname.paramerror",
            Description="parameter error",
            Solution="please check your parameter again.",
            ErrorDetails="dbnames should be list and should have at least one value.",
            ErrorLink=""
        ), 500
    if len(dbnames) > 50:  # dbnames长度超过50个
        return Gview.TErrorreturn(
            ErrorCode="Builder.comtroller.graph_config.getidbydbname.paramlenerror",
            Description="parameter length error",
            Solution="please check your parameter again.",
            ErrorDetails="dbnames size should not exceed 50.",
            ErrorLink=""
        ), 500
    res = {}
    data = graph_dao.get_id_by_dbname(dbnames)
    for i in range(len(data)):
        dbname = data[i]["KDB_name"]
        idinfo = {}
        idinfo['id'] = int(data[i]["id"])
        idinfo['kgconfid'] = idinfo['id']
        res[dbname] = idinfo
        
    return res, 200


# 内部权限调用
@graph_controller_app.route("/getbykdbname", methods=["post"])
def getByKdbName():

    param_code, params_json, param_message = commonutil.getMethodParam()
    dbnames = params_json["dbnames"]
    if not dbnames or not isinstance(dbnames, list):
        return Gview.TErrorreturn(
            ErrorCode="Builder.comtroller.getbykdbname.paramerror",
            Description="parameter error",
            Solution="please check your parameter again.",
            ErrorDetails="dbnames should be list and should have at least one value.",
            ErrorLink=""
        ), 500
    data = graph_dao.get_id_by_dbname(dbnames)
    graph_ids = [int(data[i]["id"]) for i in range(len(data))]
        
    return jsonify({"res": graph_ids}), 200


# 判断gns1和gns2是否匹配
def is_match(gns1, gns2):
    """
    gns1：输入gns
    gns2：被匹配的gns
    匹配成功的情况：
    1. gns1 == gns2
    2. gns1是gns2的子目录
    3. gns1是gns2的父目录
    """
    gns_list1 = gns1.replace("gns://", "").split("/")
    gns_list2 = gns2.replace("gns://", "").split("/")
    len_gns1 = len(gns_list1)
    len_gns2 = len(gns_list2)
    if ((gns1 == gns2) or
            (len_gns1 > len_gns2 and gns_list1[:len_gns2] == gns_list2) or
            (len_gns1 < len_gns2 and gns_list2[:len_gns1] == gns_list1)):
        return True
    return False
    # if len_gns1 < len_gns2:
    #     return False
    # return gns_list1[:len_gns2] == gns_list2


@graph_controller_app.route('/info/basic', methods=["get"], strict_slashes=False)
def get_graph_info_basic():
    '''
    获取图谱信息
    获取图谱信息
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: 图谱id
            type: integer
        -   name: is_all
            in: query
            required: false
            description: 'True:返回所有字段,忽略key传入参数; False(默认):按照key返回需要的字段'
            type: boolean
        -   name: 'key'
            in: query
            required: false
            description: '需要额外获取信息的字段；可选值："graph_des"(图谱描述)、"create_email"(创建人邮箱)、"create_user(创建人)"、"create_time"(创建时间)、"update_email"(最终操作人邮箱)、"update_time"(最终操作时间)、"update_user"(最终操作用户)、"export"(图谱是否可以导出)、"is_import"(是外部导入的图谱还是手动创建)、"knowledge_type"(知识类型)、"status"(图谱状态)、"task_status"(图谱构建任务运行状态)、"step_num"(图谱配置流程进行到了第几步)、"ds"(使用过的数据源id)、"otl"(本体id)、"info_ext"(抽取规则信息)、"kmap"(映射规则信息)、"mongo_name"(MongoDB表名)、"graphdb_name"(图数据库DB名)、"graphdb_type"(图数据库类型)、"graphdb_address"(图数据库地址)、"graphdb_id"(图数据库id)'
            # type: array
    '''

    try:
        userId = request.headers.get("userId")
        graph_id = request.args.get('graph_id')
        is_all = request.args.get('is_all', 'False')
        key = request.args.get('key')
        # 参数校验
        # graph_id
        if not graph_id or not graph_id.isdigit():
            code = codes.Builder_GraphController_GetGraphInfoBasic_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='graph_id',
                                       description='请确保graph_id存在，且graph_id应为数字'), 400
        # is_all
        if is_all.lower() == 'true':
            is_all = True
        elif is_all.lower() == 'false':
            is_all = False
        else:
            code = codes.Builder_GraphController_GetGraphInfoBasic_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='is_all',
                                       description='is_all应为“True”或“False”'), 400
        # key参数校验
        if key:
            try:
                key = eval(key)
                if not isinstance(key, list):
                    code = codes.Builder_GraphController_GetGraphInfoBasic_KeyTypeError
                    data = Gview2.TErrorreturn(code)

                    return data, 400
            except Exception:
                code = codes.Builder_GraphController_GetGraphInfoBasic_KeyTypeError
                data = Gview2.TErrorreturn(code)

                return data, 400
        # 功能实现
        code, data = graph_Service.get_graph_info_basic(graph_id, is_all, key, userId)
        if code != codes.successCode:

            return data, 400

        return data, 200
    except Exception as e:
        error_log = log_oper.get_error_log('get_graph_info_basic failed: {}'.format(e),
                                           sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_GraphController_GetGraphInfoBasic_UnknownError

        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 500


@graph_controller_app.route('/info/onto', methods=["get"], strict_slashes=False)
def get_graph_info_onto():
    '''
    获取图谱的本体信息
    获取图谱的本体信息
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: 图谱id
            type: integer
        -   name: compensation_cache
            in: query
            required: false
            description: 是否补偿缓存，默认值为false
            type: boolean
    '''
    try:
        compensation_cache = request.args.get('compensation_cache')
        if compensation_cache == '':
            code = codes.Builder_GraphController_GetGraphInfoOnto_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='compensation_cache',
                                       description=_l('compensation_cache can not be empty')), 400
        if not compensation_cache:
            compensation_cache = False  # 默认为False
        if isinstance(compensation_cache, str) and compensation_cache.lower() == 'true':
            compensation_cache = True
        if isinstance(compensation_cache, str) and compensation_cache.lower() == 'false':
            compensation_cache = False
        graph_id = request.args.get('graph_id')
        if not graph_id or not graph_id.isdigit():
            code = codes.Builder_GraphController_GetGraphInfoOnto_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='graph_id',
                                       description=_l(
                                           'Make sure the graph_id exists, and the graph_id should be a number')), 400
        if compensation_cache != True and compensation_cache != False:
            code = codes.Builder_GraphController_GetGraphInfoOnto_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='compensation_cache',
                                       description=_l('compensation_cache must be bool')), 400
        code, data = graph_Service.get_graph_info_onto(graph_id, compensation_cache)
        if code != codes.successCode:

            return data, 400

        return data, 200
    except Exception as e:
        error_log = log_oper.get_error_log("get_graph_info_onto error: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_GraphController_GetGraphInfoOnto_UnknownError

        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


@graph_controller_app.route('/info/count', methods=["get"], strict_slashes=False)
def get_graph_info_count():
    '''
    获取图谱的数量信息
    获取图谱的数量信息
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: 图谱id
            type: integer
    '''
    try:
        graph_id = request.args.get('graph_id')
        if not graph_id or not graph_id.isdigit():
            code = codes.Builder_GraphController_GetGraphInfoCount_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='graph_id',
                                       description='请确保graph_id存在，且graph_id应为数字'), 400
        code, data = graph_Service.get_graph_info_count(graph_id)
        if code != codes.successCode:
            if data.json["ErrorDetails"] == "nebula show stats failed":
                return jsonify({"res": {"edge": [], "edge_count": 0, "entity": [], "entity_count": 0}}), 200

            return data, 400

        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoCount_UnknownError

        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


@graph_controller_app.route('/info/detail', methods=["get"], strict_slashes=False)
def get_graph_info_detail():
    '''
    获取图谱中的点或边的配置详情
    获取图谱中的点或边的配置详情
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: 图谱id
            type: integer
        -   name: type
            in: query
            required: true
            description: 点还是边 entity/edge
            type: string
        -   name: name
            in: query
            required: true
            description: 点/边的名字
            type: string
    '''
    try:
        graph_id = request.args.get('graph_id')
        otl_type = request.args.get('type')
        name = request.args.get('name')
        if not graph_id or not graph_id.isdigit():
            code = codes.Builder_GraphController_GetGraphInfoDetail_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='graph_id',
                                       description='请确保graph_id存在，且graph_id应为数字'), 400
        if not otl_type:
            code = codes.Builder_GraphController_GetGraphInfoDetail_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='type',
                                       description='请确保type存在'), 400
        if otl_type not in ['entity', 'edge']:
            code = codes.Builder_GraphController_GetGraphInfoDetail_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='type',
                                       description='type应为entity或edge, 当前type为{}'.format(otl_type)), 400
        if not name:
            code = codes.Builder_GraphController_GetGraphInfoDetail_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='name',
                                       description='请确保name存在'), 400
        code, data = graph_Service.get_graph_info_detail(graph_id, otl_type, name)
        if code != 200:

            return data, 400

        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoDetail_UnknownError
        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


# 内部权限调用
@graph_controller_app.route('/getbyotls', methods=['post'])
def getIdByOtl():
    """ search graph ids by ontology ids """
    otl_ids = request.json.get("otl_ids")
    if not otl_ids or not isinstance(otl_ids, list):
        return Gview.TErrorreturn(
            ErrorCode="Builder.GraphController.GetIdByOtl.ParamsError",
            Description="parameter error",
            Solution="please check your parameter again.",
            ErrorDetails="otl_ids should be list and should have at least one value.",
            ErrorLink=""
        ), 500
    res = graph_dao.get_id_by_otl(otl_ids)
    graph_ids = [record['id'] for record in res]
        
    return jsonify({'res': graph_ids}), 200


# 内部权限调用
@graph_controller_app.route('/getbytask', methods=['post'])
def getIdByTask():
    """ search graph ids by task ids """
    task_ids = request.json.get("task_ids")
    if not task_ids or not isinstance(task_ids, list):
        return Gview.TErrorreturn(
            ErrorCode="Builder.GraphController.GetIdByTask.ParamsError",
            Description="parameter error",
            Solution="please check your parameter again.",
            ErrorDetails="task_ids should be list and should have at least one value.",
            ErrorLink=""
        ), 500
    res = graph_dao.get_id_by_task(task_ids)
    graph_ids = [record['graph_id'] for record in res]
        
    return jsonify({'res': graph_ids}), 200


# 内部权限调用
@graph_controller_app.route('/getbysubgraph', methods=["POST"])
def getIdBySubgraph():
    """ search graph ids by subgraph ids"""
    subgraph_ids = request.json.get("subgraph_ids")
    if not subgraph_ids or not isinstance(subgraph_ids, list):
        return Gview.TErrorreturn(
            ErrorCode="Builder.GraphController.GetIdBySubgraph.ParamsError",
            Description="parameter error",
            Solution="please check your parameter again.",
            ErrorDetails="subgraph_ids should be list and should have at least one value.",
            ErrorLink=""
        ), 500
    datas = subgraph_dao.get_graph_ids_by_subgraphs(subgraph_ids)
    graph_ids = [data['graph_id'] for data in datas]
        
    return jsonify({'res': graph_ids}), 200


@graph_controller_app.route('/intelligence/task', methods=['post'], strict_slashes=False)
def intelligence_calculate_task():
    '''
    post knowledge graph intelligence calculate task
    ---
    parameters:
        -   name: graph_id
            in: body
            description: graph id
            required: true
            type: integer
            example: 13
    '''

    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code < 0 or 'graph_id' not in params_json:
        code = codes.Builder_GraphController_IntelligenceCalculateTask_ParamError

        return Gview2.error_return(code, arg='graph_id'), 400

    graph_id = params_json['graph_id']

    # send async task, because large graph will cause a very long time query

    code, resp = intelligence_calculate_service.send_task(graph_id)
    if code != codes.successHttpCode:

        return resp, 500
    user_name = request.headers.get("username")
    target_object = {"result": resp['res']}
    operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, graph_id, target_object,
                                               "计算知识图谱{id=%s}领域智商，结果为%s" % (graph_id, target_object))
    Logger.log_info(operation_log)
        
    return Gview2.json_return(resp['res']), 200


@graph_controller_app.route('/intelligence/<graph_id>', methods=['get'], strict_slashes=False)
def intelligence_stats(graph_id):
    '''
    query knowledge graph intelligence calculate result
    ---
    parameters:
        -   name: graph_id
            in: path
            required: true
            description: graph id
            type: integer
    '''

    if not intelligence_query_service.check_uint(graph_id):
        code = codes.Builder_GraphController_IntelligenceStats_ParamError
        return Gview2.error_return(code, arg='graph_id'), 400

    res_code, result = intelligence_query_service.query_graph_intelligence(graph_id)
    if res_code != codes.successCode:
        return result, 500
    return Gview2.json_return(result), 200


@graph_controller_open.route('/info/basic', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_graph_info_basic():
    '''
    获取图谱信息
    获取图谱信息
    ---
    operationId: get_graph_info_basic
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: 图谱id
            schema:
                type: integer
        -   name: is_all
            in: query
            required: false
            description: 'True:返回所有字段,忽略key传入参数; False(默认):按照key返回需要的字段'
            schema:
                type: boolean
        -   name: 'key'
            in: query
            required: false
            description: '需要额外获取信息的字段；可选值："graph_des"(图谱描述)、"create_email"(创建人邮箱)、"create_user(创建人)"、"create_time"(创建时间)、"update_email"(最终操作人邮箱)、"update_time"(最终操作时间)、"update_user"(最终操作用户)、"export"(图谱是否可以导出)、"is_import"(是外部导入的图谱还是手动创建)、"knowledge_type"(知识类型)、"status"(图谱状态)、"task_status"(图谱构建任务运行状态)、"step_num"(图谱配置流程进行到了第几步)、"ds"(使用过的数据源id)、"otl"(本体id)、"info_ext"(抽取规则信息)、"kmap"(映射规则信息)、"mongo_name"(MongoDB表名)、"graphdb_name"(图数据库DB名)、"graphdb_type"(图数据库类型)、"graphdb_address"(图数据库地址)、"graphdb_id"(图数据库id)'
            schema:
                type: string
    responses:
        '200':
            description: 操作成功
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/builder.graph.get_graph_info_basic_response200'
    '''
    try:
        userId = request.headers.get("userId")
        graph_id = request.args.get('graph_id')
        is_all = request.args.get('is_all', 'False')
        key = request.args.get('key')
        # 参数校验
        # graph_id
        if not graph_id or not graph_id.isdigit():
            code = codes.Builder_GraphController_GetGraphInfoBasic_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='graph_id',
                                       description='请确保graph_id存在，且graph_id应为数字'), 400
        # is_all
        if is_all.lower() == 'true':
            is_all = True
        elif is_all.lower() == 'false':
            is_all = False
        else:
            code = codes.Builder_GraphController_GetGraphInfoBasic_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='is_all',
                                       description='is_all应为“True”或“False”'), 400
        # key参数校验
        if key:
            try:
                key = eval(key)
                if not isinstance(key, list):
                    code = codes.Builder_GraphController_GetGraphInfoBasic_KeyTypeError
                    data = Gview2.TErrorreturn(code)

                    return data, 400
            except Exception:
                code = codes.Builder_GraphController_GetGraphInfoBasic_KeyTypeError
                data = Gview2.TErrorreturn(code)

                return data, 400
        # 功能实现
        code, data = graph_Service.get_graph_info_basic(graph_id, is_all, key, userId)
        if code != codes.successCode:

            return data, 400

        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoBasic_UnknownError

        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


@graph_controller_open.route('/info/onto', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_graph_info_onto():
    '''
    获取图谱的本体信息
    获取图谱的本体信息
    ---
    operationId: get_graph_info_onto
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: 图谱id
            schema:
                type: integer
        -   name: compensation_cache
            in: query
            required: false
            description: 是否补偿缓存，默认值为false
            schema:
                type: boolean
    responses:
        '200':
            description: 操作成功
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/builder.graph.get_graph_info_onto_response200'
    '''
    try:
        compensation_cache = request.args.get('compensation_cache')
        if compensation_cache == '':
            code = codes.Builder_GraphController_GetGraphInfoOnto_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='compensation_cache',
                                       description=_l('compensation_cache can not be empty')), 400
        if not compensation_cache:
            compensation_cache = False  # 默认为False
        if isinstance(compensation_cache, str) and compensation_cache.lower() == 'true':
            compensation_cache = True
        if isinstance(compensation_cache, str) and compensation_cache.lower() == 'false':
            compensation_cache = False
        graph_id = request.args.get('graph_id')
        if not graph_id or not graph_id.isdigit():
            code = codes.Builder_GraphController_GetGraphInfoOnto_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='graph_id',
                                       description=_l(
                                           'Make sure the graph_id exists, and the graph_id should be a number')), 400
        if compensation_cache != True and compensation_cache != False:
            code = codes.Builder_GraphController_GetGraphInfoOnto_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='compensation_cache',
                                       description=_l('compensation_cache must be bool')), 400
        code, data = graph_Service.get_graph_info_onto(graph_id, compensation_cache)
        if code != codes.successCode:

            return data, 400

        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoOnto_UnknownError

        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


@graph_controller_open.route('/info/count', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_graph_info_count():
    '''
    获取图谱的数量信息
    获取图谱的数量信息
    ---
    operationId: get_graph_info_count
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: 图谱id
            schema:
                type: integer
    responses:
        '200':
            description: 操作成功
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/builder.graph.get_graph_info_count_response200'
    '''
    try:
        graph_id = request.args.get('graph_id')
        if not graph_id or not graph_id.isdigit():
            code = codes.Builder_GraphController_GetGraphInfoCount_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='graph_id',
                                       description='请确保graph_id存在，且graph_id应为数字'), 400
        code, data = graph_Service.get_graph_info_count(graph_id)
        if code != codes.successCode:
            if data.json["ErrorDetails"] == "nebula show stats failed":
                return jsonify({"res": {"edge": [], "edge_count": 0, "entity": [], "entity_count": 0}}), 200

            return data, 400

        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoCount_UnknownError

        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


@graph_controller_open.route('/info/detail', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_graph_info_detail():
    '''
    获取图谱中的点或边的配置详情
    获取图谱中的点或边的配置详情
    ---
    operationId: get_graph_info_detail
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: 图谱id
            schema:
                type: integer
        -   name: type
            in: query
            required: true
            description: 点还是边 entity/edge
            schema:
                type: string
        -   name: name
            in: query
            required: true
            description: 点/边的名字
            schema:
                type: string
    responses:
        '200':
            description: 操作成功
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/builder.graph.get_graph_info_detail_response200'
    '''
    try:
        graph_id = request.args.get('graph_id')
        otl_type = request.args.get('type')
        name = request.args.get('name')
        if not graph_id or not graph_id.isdigit():
            code = codes.Builder_GraphController_GetGraphInfoDetail_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='graph_id',
                                       description='请确保graph_id存在，且graph_id应为数字'), 400
        if not otl_type:
            code = codes.Builder_GraphController_GetGraphInfoDetail_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='type',
                                       description='请确保type存在'), 400
        if otl_type not in ['entity', 'edge']:
            code = code = codes.Builder_GraphController_GetGraphInfoDetail_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='type',
                                       description='type应为entity或edge, 当前type为{}'.format(otl_type)), 400
        if not name:
            code = codes.Builder_GraphController_GetGraphInfoDetail_ParamError

            return Gview2.TErrorreturn(code,
                                       arg='name',
                                       description='请确保name存在'), 400
        code, data = graph_Service.get_graph_info_detail(graph_id, otl_type, name)
        if code != 200:

            return data, 400

        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoDetail_UnknownError

        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


@graph_controller_app.route('/subgraph', methods=['post'], strict_slashes=False)
def create_subgraph_config():
    '''
    create a subgraph configuration of a graph
    create a subgraph configuration of a graph
    ---
    parameters:
    -   in: 'body'
        name: 'body'
        description: 'request body'
        required: true
        schema:
            $ref: '#/components/schemas/builder.graph.create_subgraph_config'
    '''
    try:
        # check parameters
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = codes.Builder_GraphController_CreateSubgraphConfig_ParamError

            return Gview2.error_return(code, message=param_message), 400
        param_code, param_message = graphCheckParameters.create_subgraph_config(params_json)
        if param_code != graphCheckParameters.VALID:
            code = codes.Builder_GraphController_CreateSubgraphConfig_ParamError

            return Gview2.error_return(code, message=param_message), 400

        code, resp = subgraph_service.create_subgraph_config(params_json)
        if code != codes.successCode:

            return resp, 500
        user_name = request.headers.get("username")
        target_object = {"subgraph_id": resp["subgraph_id"]}
        operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, params_json["graph_id"],
                                                   target_object,
                                                   "给知识图谱{id=%s}新增了子图配置%s" % (
                                                   params_json["graph_id"], target_object))
        Logger.log_info(operation_log)

        return Gview2.json_return(resp), 200
    except Exception as e:
        code = codes.Builder_GraphController_CreateSubgraphConfig_UnknownError

        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@graph_controller_app.route('/subgraph/edit/<graph_id>', methods=['post'], strict_slashes=False)
def edit_subgraph_config(graph_id):
    '''
    edit subgraph configuration
    edit subgraph configuration
    ---
    parameters:
    -   in: path
        name: graph_id
        description: graph id
        required: true
        type: integer
    -   in: 'body'
        name: 'body'
        description: 'request body'
        required: true
        schema:
            $ref: '#/components/schemas/builder.graph.edit_subgraph_config'
    '''
    try:
        # check graph_id
        if not graph_id.isdigit():
            message = _l("parameter graph_id must be int!")
            code = codes.Builder_GraphController_EditSubgraphConfig_ParamError

            return Gview2.error_return(code, message=message), 400
        code, ret = graph_Service.checkById(graph_id)
        if code != 0:
            code = codes.Builder_GraphController_EditSubgraphConfig_GraphIdNotExist

            return Gview2.error_return(code, graph_id=graph_id), 500
        # check parameters
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = codes.Builder_GraphController_EditSubgraphConfig_ParamError

            return Gview2.error_return(code, message=param_message), 400
        param_code, param_message = graphCheckParameters.edit_subgraph_config(params_json)
        if param_code != graphCheckParameters.VALID:
            code = codes.Builder_GraphController_EditSubgraphConfig_ParamError

            return Gview2.error_return(code, message=param_message), 400

        code, res = subgraph_service.edit_subgraph_config(graph_id, params_json)
        if code != codes.successCode:

            return res, 500
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, graph_id, params_json,
                                                   "修改了知识图谱{id=%s}的子图配置" % graph_id)
        Logger.log_info(operation_log)

        return Gview2.json_return(res), 200
    except Exception as e:
        error_log = log_oper.get_error_log("edit subgraph config error: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_GraphController_EditSubgraphConfig_UnknownError

        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@graph_controller_app.route('/subgraph/savenocheck/<graph_id>', methods=['post'], strict_slashes=False)
def subgraph_save_no_check(graph_id):
    '''
    edit subgraph configuration
    edit subgraph configuration
    ---
    parameters:
    -   in: path
        name: graph_id
        description: graph id
        required: true
        type: integer
    -   in: 'body'
        name: 'body'
        description: 'request body'
        required: true
        schema:
            $ref: '#/components/schemas/builder.graph.savenocheck'
    '''
    try:
        # check graph_id
        if not graph_id.isdigit():
            message = _l("parameter graph_id must be int!")
            code = codes.Builder_GraphController_SubgraphSaveNoCheck_ParamError

            return Gview2.error_return(code, message=message), 400
        code, ret = graph_Service.checkById(graph_id)
        if code != 0:
            code = codes.Builder_GraphController_SubgraphSaveNoCheck_GraphIdNotExist

            return Gview2.error_return(code, graph_id=graph_id), 500
        # check parameters
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = codes.Builder_GraphController_SubgraphSaveNoCheck_ParamError

            return Gview2.error_return(code, message=param_message), 400
        param_code, param_message = graphCheckParameters.subgraph_save_no_check(params_json)
        if param_code != graphCheckParameters.VALID:
            code = codes.Builder_GraphController_SubgraphSaveNoCheck_ParamError

            return Gview2.error_return(code, message=param_message), 400

        code, res = subgraph_service.save_no_check(graph_id, params_json)
        if code != codes.successCode:

            return res, 500

        return Gview2.json_return(res), 200
    except Exception as e:
        code = codes.Builder_GraphController_SubgraphSaveNoCheck_UnknownError

        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@graph_controller_app.route('/subgraph', methods=['get'], strict_slashes=False)
def get_subgraph_list():
    '''
    query subgraph list
    query subgraph list
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: graph id
            type: integer
        -   name: subgraph_name
            in: query
            required: true
            description: sub graph name
            type: string
        -   name: return_all
            in: query
            required: false
            description: False return id, name, entity number, edge number; True additional return entity config info, edge config info
            type: boolean
    '''
    try:
        # check parameters
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = codes.Builder_GraphController_GetSubgraphList_ParamError

            return Gview2.error_return(code, message=param_message), 400
        param_code, param_message = graphCheckParameters.get_subgraph_list(params_json)
        if param_code != graphCheckParameters.VALID:
            code = codes.Builder_GraphController_GetSubgraphList_ParamError

            return Gview2.error_return(code, message=param_message), 400

        code, res = subgraph_service.get_subgraph_list(params_json)
        if code != codes.successCode:

            return res, 500

        return Gview2.json_return(res), 200
    except Exception as e:
        code = codes.Builder_GraphController_GetSubgraphList_UnknownError

        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@graph_controller_app.route('/subgraph/<subgraph_id>', methods=['get'], strict_slashes=False)
def get_subgraph_config(subgraph_id):
    '''
    get subgraph config info by subgrapph id
    get subgraph config info by subgrapph id
    ---
    parameters:
        -   in: path
            name: subgraph_id
            description: subgraph id
            required: true
            type: integer
    '''
    try:
        # check subgraph_id
        if not subgraph_id.isdigit():
            message = _l("parameter subgraph_id must be int!")
            code = codes.Builder_GraphController_GetSubgraphConfig_ParamError

            return Gview2.error_return(code, message=message), 400
        if subgraph_id == "0":
            message = _l("parameter subgraph_id cannot be 0!")
            code = codes.Builder_GraphController_GetSubgraphConfig_ParamError

            return Gview2.error_return(code, message=message), 400

        code, res = subgraph_service.get_subgraph_config(subgraph_id)
        if code != codes.successCode:

            return res, 500

        return Gview2.json_return(res), 200
    except Exception as e:
        code = codes.Builder_GraphController_GetSubgraphConfig_UnknownError

        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@graph_controller_app.route('/subgraph/delete', methods=['post'], strict_slashes=False)
def delete_subgraph_config():
    '''
    delete subgraph configuration
    delete subgraph configuration
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/components/schemas/builder.graph.delete_subgraph_config'
    '''
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = codes.Builder_GraphController_DeleteSubgraphConfig_ParamError

            return Gview2.error_return(code, message=param_message), 400
        graph_id = params_json.get('graph_id')
        subgraph_ids = params_json.get('subgraph_ids')
        if not graph_id:
            message = _l('parameter graph_id cannot be empty. ')
            code = codes.Builder_GraphController_DeleteSubgraphConfig_ParamError

            return Gview2.error_return(code, message=message), 400
        if not isinstance(graph_id, int):
            message = _l('parameter graph_id must be integer. ')
            code = codes.Builder_GraphController_DeleteSubgraphConfig_ParamError

            return Gview2.error_return(code, message=message), 400
        if graph_id <= 0:
            message = _l('parameter graph_id must be larger than zero. ')
            code = codes.Builder_GraphController_DeleteSubgraphConfig_ParamError

            return Gview2.error_return(code, message=message), 400
        if not subgraph_ids:
            message = _l('parameter subgraph_ids cannot be empty. ')
            code = codes.Builder_GraphController_DeleteSubgraphConfig_ParamError

            return Gview2.error_return(code, message=message), 400
        if not isinstance(subgraph_ids, list):
            message = _l('parameter subgraph_ids must be a list. ')
            code = codes.Builder_GraphController_DeleteSubgraphConfig_ParamError

            return Gview2.error_return(code, message=message), 400
        for subgraph_id in subgraph_ids:
            # check subgraph_id
            if not isinstance(subgraph_id, int):
                message = _l("parameter subgraph_id {} must be int!".format(subgraph_id))
                code = codes.Builder_GraphController_DeleteSubgraphConfig_ParamError

                return Gview2.error_return(code, message=message), 400
            if subgraph_id <= 0:
                message = _l("parameter subgraph_id must be larger than zero!")
                code = codes.Builder_GraphController_DeleteSubgraphConfig_ParamError

                return Gview2.error_return(code, message=message), 400

        code, res = subgraph_service.delete_subgraph_config(graph_id, subgraph_ids)
        if code != codes.successCode:

            return res, 500
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, graph_id,
                                                   {"subgraph_ids": subgraph_ids},
                                                   "删除了知识图谱{id=%s}的子图配置" % graph_id)
        Logger.log_info(operation_log)

        return Gview2.json_return(res), 200
    except Exception as e:
        code = codes.Builder_GraphController_DeleteSubgraphConfig_UnknownError

        return Gview2.error_return(code, description=str(e), cause=str(e)), 500


@graph_controller_open.route('/space', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def create_graph_space():
    '''
    创建图空间
    创建图空间
    ---
    operationId: create_graph_space
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - graph_id
                    properties:
                        graph_id:
                            type: integer
                            format: int32
                            description: 图谱id
                            example: 1
    '''
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_GraphController_CreateGraphSpace_ParamError

            return Gview2.error_return(code, message=param_message), 400
        graph_id = params_json.get("graph_id", None)
        if not graph_id:
            message = _l("graph_id cannot be empty.")
            code = codes.Builder_GraphController_CreateGraphSpace_ParamError

            return Gview2.error_return(code, message=message), 400
        elif not isinstance(graph_id, int) or graph_id < 1:
            message = _l("graph_id must be integer.")
            code = codes.Builder_GraphController_CreateGraphSpace_ParamError

            return Gview2.error_return(code, message=message), 400
        code, data = graph_Service.create_graph_space(graph_id)
        if code != 200:
            return data, 500

        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_CreateGraphSpace_UnknownError
        error_log = log_oper.get_error_log("create graph space error: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)

        return Gview2.TErrorreturn(code, cause=str(e), description=str(e)), 500


@graph_controller_open.route('/schema', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def create_schema():
    '''
    创建图数据库schema
    创建图数据库schema
    ---
    operationId: create_schema
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - graph_id
                    properties:
                        graph_id:
                            type: integer
                            format: int32
                            description: 图谱id
                            example: 1
    '''
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_GraphController_CreateSchema_ParamError

            return Gview2.error_return(code, message=param_message), 400
        graph_id = params_json.get("graph_id", None)
        if not graph_id:
            message = _l("graph_id cannot be empty.")
            code = codes.Builder_GraphController_CreateSchema_ParamError

            return Gview2.error_return(code, message=message), 400
        elif not isinstance(graph_id, int) or graph_id < 1:
            message = _l("graph_id must be integer.")
            code = codes.Builder_GraphController_CreateSchema_ParamError

            return Gview2.error_return(code, message=message), 400
        code, data = graph_Service.create_schema(graph_id)
        if code != 200:
            return data, 500

        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_CreateSchema_UnknownError
        error_log = log_oper.get_error_log("create schema error: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)

        return Gview2.TErrorreturn(code, cause=str(e), description=str(e)), 500


@graph_controller_open.route('/data', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def alter_graph_data():
    '''
    变更图数据库中的数据
    变更图数据库中的数据
    ---
    operationId: alter_graph_data
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - graph_id
                        - name
                        - action
                        - data_type
                        - graph_data
                    properties:
                        graph_id:
                            type: integer
                            format: int32
                            description: 图谱id
                            example: 1
                        name:
                            type: string
                            format: string
                            description: 插入数据对应本体中的实体或者关系类名
                            example: person
                        action:
                            type: string
                            format: string
                            description: action有效枚举值为：upsert、update、delete，分别代表新增、更新、删除
                            example: upsert
                        data_type:
                            type: string
                            format: string
                            description: data_type有效枚举值为：entity、edge，分别代表向实体类和关系类中插入数据
                            example: 'entity'
                        graph_data:
                            type: array
                            items:
                                type: object
                            description: 插入相应实体类或者关系类中的数据，实体类中的dict中必须同步传入融合属性值，关系类则必须传入起始点和终点的融合属性值或用_vid直接传起点或终点的vid。（当action为update时可以传部分属性，其它值则需要传所有属性）
                            example:  [{"name": "刘德华", "age": 50},{"name": "甄子丹", "age": 51}]
    '''
    t1 = time.time()
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=param_message), 400
        graph_id = params_json.get("graph_id")
        name = params_json.get('name')
        action = params_json.get('action')
        data_type = params_json.get('data_type')
        graph_data = params_json.get('graph_data')
        # 校验graph_id
        if graph_id is None:
            message = _l("graph_id cannot be empty.")
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        elif not isinstance(graph_id, int) or graph_id < 1:
            message = _l("graph_id must be integer.")
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        # 校验name
        if name is None:
            message = 'name' + _l(" cannot be empty. ")
            code = codes.Builder_GraphController_AlterGraphData_ParamError


            return Gview2.error_return(code, message=message), 400
        elif not isinstance(name, str):
            message = 'name' + _l(" must be string. ")
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        elif name == '':
            message = 'name' + _l(" cannot be empty. ")
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        # 校验action
        if action is None:
            message = 'action' + _l(" cannot be empty. ")
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        elif action not in ['upsert', 'update', 'delete']:
            message = 'action' + _l(" must be in ") + "['upsert', 'update', 'delete']. "
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        # 校验data_type
        if data_type is None:
            message = 'data_type' + _l(" cannot be empty. ")
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        elif data_type not in ['entity', 'edge']:
            message = 'data_type' + _l(" must be in ") + "['entity', 'edge']. "
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        # 校验graph_data
        if graph_data is None:
            message = 'graph_data' + _l(" cannot be empty. ")
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        elif not isinstance(graph_data, list):
            message = 'graph_data' + _l(" must be list ")
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        elif len(graph_data) == 0:
            message = 'graph_data' + _l(" cannot be empty. ")
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        elif len(graph_data) > 100:
            message = _l('length of graph_data cannot be larger than 100.')
            code = codes.Builder_GraphController_AlterGraphData_ParamError

            return Gview2.error_return(code, message=message), 400
        else:
            start_entity, end_entity = '', ''
            for a_graph_data in graph_data:
                if not isinstance(a_graph_data, dict):
                    message = _l('item of graph_data must be dict. ')
                    code = codes.Builder_GraphController_AlterGraphData_ParamError

                    return Gview2.error_return(code, message=message), 400
                if data_type == 'edge':
                    # start
                    if 'start' not in a_graph_data:
                        if action != 'delete':
                            message = _l('when data_type is edge, the graph_data must have start, end, edge_pros. ')
                        else:
                            message = _l('when data_type is edge, the graph_data must have start, end. ')
                        code = codes.Builder_GraphController_AlterGraphData_ParamError

                        return Gview2.error_return(code, message=message), 400
                    elif not isinstance(a_graph_data['start'], dict):
                        message = _l('the start of graph_data must be dict. ')
                        code = codes.Builder_GraphController_AlterGraphData_ParamError

                        return Gview2.error_return(code, message=message), 400
                    elif '_start_entity' not in a_graph_data['start']:
                        message = _l('the start of graph_data must be have _start_entity. ')
                        code = codes.Builder_GraphController_AlterGraphData_ParamError

                        return Gview2.error_return(code, message=message), 400
                    else:
                        if not start_entity:
                            start_entity = a_graph_data['start']['_start_entity']
                        elif a_graph_data['start']['_start_entity'] != start_entity:
                            message = _l('The start entity class type of multiple data should be consistent.')
                            code = codes.Builder_GraphController_AlterGraphData_ParamError

                            return Gview2.error_return(code, message=message), 400
                    # end
                    if 'end' not in a_graph_data:
                        if action != 'delete':
                            message = _l('when data_type is edge, the graph_data must have start, end, edge_pros. ')
                        else:
                            message = _l('when data_type is edge, the graph_data must have start, end. ')
                        code = codes.Builder_GraphController_AlterGraphData_ParamError

                        return Gview2.error_return(code, message=message), 400
                    elif not isinstance(a_graph_data['end'], dict):
                        message = _l('the end of graph_data must be dict. ')
                        code = codes.Builder_GraphController_AlterGraphData_ParamError

                        return Gview2.error_return(code, message=message), 400
                    elif '_end_entity' not in a_graph_data['end']:
                        message = _l('the end of graph_data must be have _end_entity. ')
                        code = codes.Builder_GraphController_AlterGraphData_ParamError

                        return Gview2.error_return(code, message=message), 400
                    else:
                        if not end_entity:
                            end_entity = a_graph_data['end']['_end_entity']
                        elif a_graph_data['end']['_end_entity'] != end_entity:
                            message = _l('The end entity class type of multiple data should be consistent.')
                            code = codes.Builder_GraphController_AlterGraphData_ParamError

                            return Gview2.error_return(code, message=message), 400
                    # edge_pros
                    if action != 'delete':
                        if 'edge_pros' not in a_graph_data:
                            message = _l('when data_type is edge, the graph_data must have start, end, edge_pros. ')
                            code = codes.Builder_GraphController_AlterGraphData_ParamError

                            return Gview2.error_return(code, message=message), 400
                        elif not isinstance(a_graph_data['edge_pros'], dict):
                            message = _l('the edge_pros of graph_data must be dict. ')
                            code = codes.Builder_GraphController_AlterGraphData_ParamError

                            return Gview2.error_return(code, message=message), 400
        code, data = graph_Service.alter_graph_data(graph_id, name, action, data_type, graph_data)
        if code != 200:
            return data, 500

        t2 = time.time()
        Logger.log_info(f"alter graph data spend:{t2-t1}s")
        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_AlterGraphData_UnknownError
        error_log = log_oper.get_error_log("alter graph data error: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(code, cause=str(e), description=str(e)), 500


@graph_controller_app.route('/data/batch_del_relation', methods=['post'], strict_slashes=False)
@swag_from(swagger_new_response)
def batch_del_relation():
    '''
    批量删除关系
    批量删除关系
    ---
    operationId: batch_del_relation
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    type: 'object'
                    required:
                        - graph_id
                        - vertex_name
                        - relation_name
                        - vertex_data
                    properties:
                        graph_id:
                            type: integer
                            format: int32
                            description: 图谱id
                            example: 1
                        vertex_name:
                            type: string
                            format: string
                            description: 需要批量删除关系的起始点或终点实体类名
                            example: 'company'
                        relation_name:
                            type: array
                            items:
                                type: object
                                properties:
                                    name:
                                        type: string
                                        format: string
                                        description: 需要批量删除的关系的关系类名
                                        example: 'ownerSubject'
                                    direction:
                                        type: string
                                        format: string
                                        description: 需要批量删除的关系的方向，可选值: in out both
                                        example: 'in'
                        vertex_data:
                            type: object
                            description: 删除该关系起始点或者终点的融合属性值或者vid
                            example: {"name": "天空科技股份有限公司"}

    '''
    t1 = time.time()
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_GraphController_BatchDelRelation_ParamError

            return Gview2.error_return(code, message=param_message), 400
        graph_id = params_json.get("graph_id", None)
        if not graph_id:
            message = _l("graph_id cannot be empty.")
            code = codes.Builder_GraphController_BatchDelRelation_ParamError

            return Gview2.error_return(code, message=message), 400
        elif not isinstance(graph_id, int) or graph_id < 1:
            message = _l("graph_id must be integer.")
            code = codes.Builder_GraphController_BatchDelRelation_ParamError

            return Gview2.error_return(code, message=message), 400
        vertex_name = params_json.get("vertex_name", None)
        relation_name = params_json.get("relation_name", None)
        vertex_data = params_json.get("vertex_data", None)
        if not vertex_name:
            message = _l("vertex_name cannot be empty.")
            code = codes.Builder_GraphController_BatchDelRelation_ParamError

            return Gview2.error_return(code, message=message), 400
        if not relation_name:
            message = _l("relation_name cannot be empty.")
            code = codes.Builder_GraphController_BatchDelRelation_ParamError

            return Gview2.error_return(code, message=message), 400
        if not vertex_data:
            message = _l("vertex_data cannot be empty.")
            code = codes.Builder_GraphController_BatchDelRelation_ParamError

            return Gview2.error_return(code, message=message), 400
        vertex_name = params_json.get("vertex_name", None)
        relation_name = params_json.get("relation_name", None)
        vertex_data = params_json.get("vertex_data", None)
        code, data = graph_Service.batch_del_relation(graph_id, vertex_name, relation_name, vertex_data)
        if code != 200:
            return data, 500

        t2 = time.time()
        Logger.log_info(f"delete edge data spend:{t2 - t1}s")
        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_BatchDelRelation_UnknownError
        error_log = log_oper.get_error_log("create schema error: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)

        return Gview2.TErrorreturn(code, cause=str(e), description=str(e)), 500


@graph_controller_app.route('/<graphid>', methods=["post"], strict_slashes=False)
def graph(graphid):
    '''
    根据图谱id编辑图谱信息
    graphCheckParameters.graphAddPar进行参数格式校验
    graph_Service.update编辑图谱
    '''
    try:
        method = request.method
        host_url = getHostUrl()
        graphParamValidate = GraphParamValidate(method)
        res_message, res_code = graphParamValidate.graphEdit(graphid=graphid)
        if res_code != 0:

            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        param_code, params_json, param_message = commonutil.getMethodParam()
        graph_step = params_json["graph_step"]
        graph_process_list = params_json["graph_process"]
        if isinstance(graph_process_list, list) and len(graph_process_list) > 0:
            graph_process_dict = graph_process_list[0]
        # 如果正在运行中不能编辑
        run_code, run_message = graph_Service.getrunbygraphid(graphid)
        if run_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=run_message["cause"], code=run_message["code"],
                                       message=run_message[
                                           "message"]), CommonResponseStatus.SERVER_ERROR.value
        # 上传中或者导出中的图谱不能编辑
        res, code = graph_Service.get_upload_id(graphid)
        if len(res) > 0:
            cause = "graph upload can not edit"
            message = "graph cannot edit,the graph is upload"
            code = CommonResponseStatus.GRAPH_UPLOAD_NOT_EDIT.value

            return Gview.BuFailVreturn(cause=cause, code=code,
                                       message=message), CommonResponseStatus.SERVER_ERROR.value
        # 处理graph_process
        # 本体
        if graph_step == "graph_otl":
            # 如果是流程中本体的部分 直接调用新增本体的参数
            updateoradd = params_json["updateoradd"]
            graph_process_dict["updateoradd"] = updateoradd
            if updateoradd == "add":
                paramscode, message = otl_check_params.valid_params_check("ontology_save", graph_process_dict)
                if paramscode != 0:
                    return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                               message=message), CommonResponseStatus.BAD_REQUEST.value
                # 如果已有本体，则报错
                otl_id = graph_dao.getbyid(graphid)[0]['graph_otl']
                if otl_id:
                    return Gview.BuFailVreturn(cause='ontology already exists',
                                               code=CommonResponseStatus.SERVER_ERROR.value,
                                               message='ontology already exists'), CommonResponseStatus.SERVER_ERROR.value
                # 流程中本体的部分 如果是新增本体 直接调用新增本体
                graph_process_dict['graph_id'] = graphid
                ret_code, ret_message, otl_id = otl_service.ontology_save(graph_process_dict)
                if ret_code != 200:
                    return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                               message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
                # 本体添加成功才更新图谱配置
                ret_code2, ret_message2 = graph_Service.update(graphid, params_json, otl_id, host_url)
                if ret_code2 == CommonResponseStatus.SERVER_ERROR.value:
                    return Gview.BuFailVreturn(cause=ret_message2["cause"], code=ret_message2["code"],
                                               message=ret_message2["message"]), \
                           CommonResponseStatus.SERVER_ERROR.value
                user_name = request.headers.get("username")
                operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, graphid, graph_process_list,
                                                           "给知识知识图谱{id=%s}新增了本体" % graphid)
                Logger.log_info(operation_log)
                return ret_message, CommonResponseStatus.SUCCESS.value
            elif updateoradd == "update_otl_name" or updateoradd == "update_otl_info":
                #  获得otl_id 根据 otl id更新本体
                paramscode, message = otl_check_params.valid_params_check(updateoradd, graph_process_dict)
                if paramscode != 0:
                    return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                               message=message), CommonResponseStatus.BAD_REQUEST.value
                otl_id = graph_process_dict.get("id", None)
                # id 校验需要在参数中校验，但是没发现有 待做
                if otl_id == None or not str(otl_id).isdigit() or otl_id == "0":
                    message += " parameters: id must be int, and more than zero"
                    return Gview.BuFailVreturn(cause=message, code=400001, message=message), 400
                #  流程中本体的部分 如果是修改本体 直接调用修改本体
                if updateoradd == "update_otl_name":
                    ret_code, ret_message = otl_service.update_name(str(otl_id), graph_process_dict, host_url, "1")
                elif updateoradd == "update_otl_info":
                    ret_code, ret_message = otl_service.update_info(str(otl_id), graph_process_dict, host_url, "1", graphid)
                if ret_code == 200:
                    updateKnw(graphid)
                    user_name = request.headers.get("username")
                    operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, graphid, graph_process_list,
                                                               "更新了知识图谱{id=%s}本体" % graphid)
                    Logger.log_info(operation_log)

                    return Gview.BuVreturn(message="update graph %s " % graphid), CommonResponseStatus.SUCCESS.value
                else:
                    return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                               message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        # 更新图谱基本信息
        elif graph_step == "graph_baseInfo":
            ret_code, ret_message = knw_service.check_knw_id(params_json)
            if ret_code != 200:
                return Gview.BuFailVreturn(cause=ret_message["des"], code=CommonResponseStatus.INVALID_KNW_ID.value,
                                           message=ret_message["detail"]), CommonResponseStatus.SERVER_ERROR.value
            ret_code, ret_message = graph_Service.update(graphid, params_json, "-1", host_url)
            if ret_code != 200:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            updateKnw(graphid)
            user_name = request.headers.get("username")
            operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, graphid, graph_process_list,
                                                       "更新了知识图谱{id=%s}基本信息" % graphid)
            Logger.log_info(operation_log)

            return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value
        # 更新数据源
        elif graph_step == "graph_ds":
            # 该图谱下原有的数据源
            ret_code, obj = graph_Service.getDsByGraphid(graphid)
            if ret_code != 200:
                return Gview.BuFailVreturn(cause=ret_code["cause"], code=ret_code["code"],
                                           message=ret_code["message"]), CommonResponseStatus.SERVER_ERROR.value
            dsids = obj["ids"]
            Logger.log_info("old_ids: {}".format(dsids))
            # 核对数据源是否有与RabbitMQ数据源混用、多个RabbitMQ数据源同时使用的情况
            if len(params_json.get("graph_process", [])) > 1:
                code, res_df = graph_Service.get_ds_source_by_id(params_json.get("graph_process", []))
                if code == -1:
                    return Gview.BuFailVreturn(cause=res_df["cause"], code=res_df["code"],
                                               message=res_df["message"]), CommonResponseStatus.SERVER_ERROR.value

            # 根据graph_config_table中的rabbitmq_ds字段，0：非rabbitmq；1：rabbitmq
            code1, obj1 = graph_Service.ds_is_rabbitmq(params_json.get("graph_process"))
            if code1 == -1:
                return Gview.BuFailVreturn(cause=obj1["cause"], code=obj1["code"],
                                           message=obj1["message"]), CommonResponseStatus.SERVER_ERROR.value

            params_json["rabbitmq_ds"] = code1
            # 更新
            ret_code, ret_message = graph_Service.update(graphid, params_json, "-1", host_url)
            if ret_code == CommonResponseStatus.SERVER_ERROR.value:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            Logger.log_info("ret_res: {}".format(ret_message))
            updateKnw(graphid)
            user_name = request.headers.get("username")
            operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, graphid, graph_process_list,
                                                       "更新了知识图谱{id=%s}数据源" % graphid)
            Logger.log_info(operation_log)
            return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value
        # 更新映射规则
        elif graph_step == 'graph_KMap':
            code, message = graph_Service.check_kmap_otl_consistence(params_json["graph_process"], graphid)
            if code != 0:
                return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.REQUEST_ERROR.value,
                                           message=message), CommonResponseStatus.SERVER_ERROR.value
            ret_code, ret_message = graph_Service.update(graphid, params_json, "-1", host_url)
            if ret_code == CommonResponseStatus.SERVER_ERROR.value:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            Logger.log_info("ret_res: {}".format(ret_message))
            updateKnw(graphid)
            user_name = request.headers.get("username")
            operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, graphid, graph_process_list,
                                                       "更新了知识图谱{id=%s}映射规则" % graphid)
            Logger.log_info(operation_log)
            return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value
    except Exception as e:
        error_log = log_oper.get_error_log("edit graph error: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        return Gview.BuFailVreturn(cause=str(e), code=CommonResponseStatus.SERVER_ERROR.value,
                                   message=str(e)), CommonResponseStatus.SERVER_ERROR.value

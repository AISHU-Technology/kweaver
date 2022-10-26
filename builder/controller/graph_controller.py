# -*-coding:utf-8-*-
import time

import requests
from flask import Blueprint, request, jsonify, send_file, send_from_directory, make_response

from werkzeug.utils import secure_filename
from dao.graph_dao import graph_dao
from dao.intelligence_dao import intelligence_dao
from dao.otl_dao import otl_dao
from dao.task_dao import task_dao
from dao.other_dao import other_dao
from service.knw_service import knw_service
from third_party_service.permission_manager import Permission
from utils.graph_check_parameters import graphCheckParameters
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from service.graph_Service import graph_Service
from utils.CommonUtil import commonutil
from utils.ontology_check_params import otl_check_params
from service.Otl_Service import otl_service
import json
import os
from utils.log_info import Logger
from service.task_Service import task_service
from service.intelligence_service import intelligence_query_service
from service.intelligence_service import intelligence_calculate_service

from controller.knowledgeNetwork_controller import saveRelation, deleteRelation, updateKnw
from common.errorcode.gview import Gview as Gview2
from common.errorcode import codes
import uuid
from flasgger import swag_from
import yaml

graph_controller_app = Blueprint('graph_controller_app', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH',
                               os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_old_response.yaml'), 'r') as f:
    swagger_old_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_old_response.update(swagger_definitions)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)


@graph_controller_app.route('', methods=["post"], strict_slashes=False)
@swag_from(swagger_old_response)
def graphopt():
    '''
    create a new knowledge graph
    create a new knowledge graph under the knowledge network
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/graph/graph'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    params_json["graph_process"][0]["graph_DBName"] = other_dao.get_random_uuid()
    ret_code, ret_message = knw_service.check_knw_id(params_json)
    if ret_code != 200:
        return Gview.BuFailVreturn(cause=ret_message["des"], code=CommonResponseStatus.INVALID_KNW_ID.value,
                                   message=ret_message["detail"]), CommonResponseStatus.SERVER_ERROR.value
    ret_code, ret_message, graph_id = graph_Service.addgraph(params_json)
    Logger.log_info(ret_message)
    if ret_code != 200:
        Logger.log_error(ret_message)
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), ret_code
    # 增加网络与图谱关系
    knw_id = params_json["knw_id"]
    response = saveRelation(knw_id, graph_id)
    if not response:
        graph_dao.delete_record(graph_id)
        return Gview.BuFailVreturn(cause=response["Description"], code=CommonResponseStatus.REQUEST_ERROR.value,
                                   message=response["ErrorDetail"]), CommonResponseStatus.SERVER_ERROR.value
    updateKnw(graph_id)
    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/<grapid>', methods=["post"], strict_slashes=False)
@swag_from(swagger_old_response)
def graph(grapid):
    '''
    edit the graph information according to the graph id
    edit the graph information according to the graph id
    ---
    parameters:
        -   name: 'graphid'
            in: 'path'
            description: 'graph id'
            required: true
            type: 'integer'
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/graph/graph'
    '''
    # graphCheckParameters.graphAddPar进行参数格式校验
    # graph_Service.update编辑图谱
    param_code, params_json, param_message = commonutil.getMethodParam()
    graph_step = params_json["graph_step"]
    graph_process_list = params_json["graph_process"]
    graph_process_dict = graph_process_list[0]
    # 如果正在运行中不能编辑
    run_code, run_message = graph_Service.getrunbygraphid(grapid)
    if run_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=run_message["cause"], code=run_message["code"],
                                   message=run_message[
                                       "message"]), CommonResponseStatus.SERVER_ERROR.value
    # 处理graph_process
    # 本体
    if graph_step == "graph_otl":
        #  如果是流程中本体的部分 直接调用新增本体的参数
        updateoradd = params_json["updateoradd"]
        graph_process_dict["updateoradd"] = updateoradd
        if updateoradd == "add":
            paramscode, message = otl_check_params.valid_params_check("ontology_save", graph_process_dict)
            if paramscode != 0:
                return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                           message=message), CommonResponseStatus.BAD_REQUEST.value
            # 如果已有本体，则报错
            otl_id = eval(graph_dao.getbyid(grapid).iloc[0]['graph_otl'])
            if len(otl_id) != 0:
                return Gview.BuFailVreturn(cause='ontology already exists', code=CommonResponseStatus.SERVER_ERROR.value,
                                           message='ontology already exists'), CommonResponseStatus.SERVER_ERROR.value
            #  流程中本体的部分 如果是新增本体 直接调用新增本体
            ret_code, ret_message, otl_id = otl_service.ontology_save(graph_process_dict)
            if ret_code == 200:  # 本体添加成功才更新图谱配置
                # otl_id = ret_message["res"]["ontology_id"]
                ret_code2, ret_message2 = graph_Service.update(grapid, params_json, otl_id)
                if ret_code2 == CommonResponseStatus.SERVER_ERROR.value:
                    return Gview.BuFailVreturn(cause=ret_message2["cause"], code=ret_message2["code"],
                                               message=ret_message2[
                                                   "message"]), CommonResponseStatus.SERVER_ERROR.value
                return ret_message, CommonResponseStatus.SUCCESS.value
            else:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value

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
                ret_code, ret_message = otl_service.update_name(str(otl_id), graph_process_dict, "1")
            elif updateoradd == "update_otl_info":
                ret_code, ret_message = otl_service.update_info(str(otl_id), graph_process_dict, "1", grapid)
            if ret_code == 200:
                # 更新 本体temp字段
                ret_code2, ret_message2 = graph_Service.update_otl_temp(grapid)
                if ret_code2 == CommonResponseStatus.SERVER_ERROR.value:
                    return Gview.BuFailVreturn(cause=ret_message2["cause"], code=ret_message2["code"],
                                               message=ret_message2[
                                                   "message"]), CommonResponseStatus.SERVER_ERROR.value
                updateKnw(grapid)
                return Gview.BuVreturn(message=ret_message2.get("res")), CommonResponseStatus.SUCCESS.value
            else:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    # 更新图谱基本信息
    elif graph_step == "graph_baseInfo":
        ret_code, ret_message = knw_service.check_knw_id(params_json)
        if ret_code != 200:
            return Gview.BuFailVreturn(cause=ret_message["des"], code=CommonResponseStatus.INVALID_KNW_ID.value,
                                       message=ret_message["detail"]), CommonResponseStatus.SERVER_ERROR.value
        ret_code, ret_message = graph_Service.update(grapid, params_json, "-1")
        if ret_code != 200:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        updateKnw(grapid)
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value
    # 更新抽取规则 -- 144162需求增加判断文件+文件夹数量
    elif graph_step == 'graph_InfoExt':
        nums = len(graph_process_list)
        if nums > 100:
            obj = {}
            message = "the number of files and documents cannot be more then 100"
            obj["ErrorCode"] = str(CommonResponseStatus.OUT_OF_LIMIT.value)
            obj["Description"] = message
            obj["Solution"] = "please reduce the numbers of files and document "
            obj["ErrorDetails"] = [str(message)]
            obj["ErrorLink"] = ""
            return Gview.VErrorreturn(obj), CommonResponseStatus.SERVER_ERROR.value
        ret_code, ret_message = graph_Service.update(grapid, params_json, "-1")
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            obj = {}
            obj["ErrorCode"] = str(ret_message["code"])
            obj["Description"] = ret_message["cause"]
            obj["Solution"] = "please check your mysql or your parameters"
            obj["ErrorDetails"] = [{str(ret_message["message"])}]
            obj["ErrorLink"] = ""
            return Gview.VErrorreturn(obj), CommonResponseStatus.BAD_REQUEST.value
        updateKnw(grapid)
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


    # 更新数据源
    else:
        # 该图谱下原有的数据源
        ret_code, obj = graph_Service.getDsByGraphid(grapid)
        if ret_code != 200:
            return Gview.BuFailVreturn(cause=ret_code["cause"], code=ret_code["code"],
                                       message=ret_code["message"]), CommonResponseStatus.SERVER_ERROR.value
        dsids = obj["ids"]
        print("old_ids: ", dsids)
        if graph_step == "graph_ds":
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
        ret_code, ret_message = graph_Service.update(grapid, params_json, "-1")
        Logger.log_error("parameters:%s invalid" % params_json)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        print('ret_res', ret_message)
        updateKnw(grapid)
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/getgraphdb', methods=["get"], strict_slashes=False)
@swag_from(swagger_old_response)
def getgraphdb():
    '''
    query database connection information
    query database connection information
    ---
    '''
    ret_code, ret_message = graph_Service.getGraphDB()
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/getbis', methods=["get"], strict_slashes=False)
@swag_from(swagger_old_response)
def getbis():
    """
    get base info switch
    get base info switch
    """
    ret_code, ret_message = graph_Service.getbis()
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/<graphid>', methods=["get"], strict_slashes=False)
@swag_from(swagger_old_response)
def getgraphbyid(graphid):
    '''
    query the graph
    query the graph information by graphid
    ---
    parameters:
        -   name: 'graphid'
            in: 'path'
            description: 'graph id'
            required: true
            type: 'integer'
    '''
    if not graphid.isdigit():
        message = "The parameter graph id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    # graph_id不存在
    code, ret = graph_Service.checkById(graphid)
    if code != 0:
        return jsonify(ret), 500
    ret_code, ret_message = graph_Service.getGraphById(graphid)

    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/<graph_step>/graphid=<graphid>', methods=["get"], strict_slashes=False,
                            endpoint="graph_step")
@swag_from(swagger_old_response)
def getgraphbystep(graphid, graph_step):
    '''
    get the entity class collection and its property collection in the specific graph configuration step
    get the entity class collection and its property collection in the specific graph configuration step
    ---
    parameters:
        -   name: 'graphid'
            in: 'path'
            description: 'graph id'
            required: true
            type: 'integer'
        -   name: 'graph_step'
            in: 'path'
            description: 'graph configuration step. options: "graph_InfoExt","graph_KMap","graph_KMerge"'
            required: true
            type: 'string'
            example: 'graph_InfoExt'
    '''
    if not graphid.isdigit():
        message = "The parameter graph id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = graph_Service.getGraphById(graphid)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    entity_message = graph_Service.get_entity_property(ret_message, graph_step)

    return entity_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/infoext_list', methods=["post"], strict_slashes=False)
@swag_from(swagger_old_response)
def getbyinfoext():
    '''
    get the extraction rule according to the extraction file list and graph configuration step
    get the extraction rule according to the extraction file list and graph configuration step
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/graph/getbyinfoext'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = graphCheckParameters.checkparam_getinfoext(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        graphid = params_json['graphid']
        graph_step = params_json['graph_step']
        infoext_list = params_json['infoext_list']

        ret_code, ret_message = graph_Service.getGraphById(graphid)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        if len(ret_message["res"][graph_step]) > 0:
            graph_step_info = ret_message["res"][graph_step]
            if len(infoext_list) > 0:
                obj = {}
                infoext_info = [i for i in graph_step_info if
                                {"ds_name": i['ds_name'], "file_source": i['file_source']} in infoext_list]
                obj["res"] = infoext_info
                return obj, CommonResponseStatus.SUCCESS.value
            else:
                ret_message["res"] = "infoext_list can not be []"
                return ret_message, CommonResponseStatus.SUCCESS.value
        else:
            ret_message["res"] = "%s is not exist" % graph_step
            return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@graph_controller_app.route('/check_kmapinfo', methods=["post"], strict_slashes=False)
@swag_from(swagger_old_response)
def check_kmapinfo():
    '''
    verify the mapping information
    During the mapping process, checking the mapping information is necessary. This interface is used to verify whether the mapping information is in the graph configuration (whether the entity class, edge class and their properties are in the ontology library, whether the entity name and its attributes are in the extraction rules, and whether the data source and its file ID are in the extraction rules).
    <b>Scenario</b>: the ontology, entity class properties and edge class properties which are used by step 5 are modified in step 3 ontology. The original configuration in step 5 is still there, but the information has been modified. When entering step 5, it is judged whether the information still exists. If it exists, it is marked with 0. If it does not exist, it is marked with 1. The property content under it does not exist with 2.
    <b>Scenario</b>: information extraction in step 4 modifies the extracted entities and properties used in step 5. It is judged whether the information in step 5 exists. 0: exists, 1: does not exist, 2: property content under it does not exist.
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/graph/check_kmapinfo'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        graphid = params_json.get("graphid", None)
        if not graphid or str(graphid) == "True":
            message = "The parameter graphid:%s is invalid!" % graphid
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        if not isinstance(graphid, int) or graphid < 0:
            message = "The parameter graphid:%s type must be int!" % graphid
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = graph_Service.getGraphById(graphid)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value

        check_res, message, graph_KMap_check = graphCheckParameters.check_graph_KMap2(params_json, ret_message)
        if check_res != 0:
            Logger.log_info("The parameters:%s is invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        return graph_KMap_check, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/savenocheck', methods=["post"], strict_slashes=False)
@swag_from(swagger_old_response)
def savenocheck():
    '''
    save and exit
    Exit after saving knowledge graph configuration information
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/graph/savenocheck'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = graphCheckParameters.savenoCheckPar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = graph_Service.savenocheck(params_json)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return ret_message, CommonResponseStatus.SUCCESS.value

    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@graph_controller_app.route('/getdsbygraphid', methods=["get"], strict_slashes=False)
@swag_from(swagger_old_response)
def getdsbygraphids():
    '''
    get data source list by graph id
    get data source list when clicking 'batching import' in step 3: ontology
    ---
    parameters:
        -   name: id
            in: query
            description: graph id
            required: true
            type: integer
            example: 1
        -   name: type
            in: query
            description: 'process identification. filter: filter non structural data, only return structural data; unfilter: return structured and unstructured data'
            type: string
            example: 'filter'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = graphCheckParameters.getdsbygraphidPar(params_json)

        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = graph_Service.getdsbygraphid(params_json)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value

        return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@graph_controller_app.route('/delbyids', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def graphDeleteByIds():
    '''
    batch delete graph by graph ids
    batch delete graph by graph ids
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/graph/graphDeleteByIds'
    '''
    mess = ""
    obj, obj_code = {}, 200
    # get parameters
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0:
        error_link = ''
        code = CommonResponseStatus.PARAMETERS_ERROR.value
        detail = 'Incorrect parameter format'
        desc = "Incorrect parameter format"
        solution = 'Please check your parameter format'
        return Gview.TErrorreturn(code, desc, solution, detail,
                                  error_link), CommonResponseStatus.BAD_REQUEST.value
    # parameter verification
    check_res, message = graphCheckParameters.graphDelPar(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        solution = "Please check parameters"
        code = CommonResponseStatus.PARAMETERS_ERROR.value
        desc = "parameters error"
        error_link = ""
        return Gview.TErrorreturn(code, desc, solution, message,
                                  error_link), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = knw_service.check_knw_id(params_json, delete_graph=True)
    if ret_code != 200:
        code = ret_message["code"]
        if code == CommonResponseStatus.GRAPH_NOT_KNW.value:
            code = CommonResponseStatus.GRAPH_NOT_KNW.value
        else:
            code = CommonResponseStatus.INVALID_KNW_ID.value
        return Gview.BuFailVreturn(cause=ret_message["des"], code=code,
                                   message=ret_message["detail"]), CommonResponseStatus.SERVER_ERROR.value
    graphids = params_json["graphids"]
    # get the graphs whose task status is running
    res_mess, res_code = graph_Service.getStatusByIds(graphids)
    if res_code != 0:
        return Gview.TErrorreturn(res_mess["code"], res_mess["message"], res_mess["solution"], res_mess["cause"],
                                  ""), CommonResponseStatus.SERVER_ERROR.value
    # the list of graph ids whose task status is running
    runs = res_mess["runs"]

    # get the graph ids that not exist in the database
    res, code = graph_Service.getNoExistIds(graphids)
    if code != 0:
        return Gview.TErrorreturn(res["code"], res["message"], res["solution"], res["cause"],
                                  ""), CommonResponseStatus.SERVER_ERROR.value
    noExist = res["noExist"]
    normal = list(set(graphids) - set(noExist) - set(runs))
    # delete one
    if len(graphids) == 1:
        # normal
        if len(normal) == 1:
            mess += "删除成功：%s; " % ",".join(map(str, normal))
            obj, obj_code = json.dumps({"state": "success"}), CommonResponseStatus.SUCCESS.value
        # not exist
        if len(noExist) != 0:
            mess += "%s 不存在; " % ",".join(map(str, noExist))
            mess += "删除成功：%s; " % ",".join(map(str, normal))
            obj, obj_code = json.dumps({"state": "success"}), CommonResponseStatus.SUCCESS.value
        if len(runs) == 1:
            obj, obj_code = {"Cause": "当前知识网络正在运行任务不可删除，请先停止或删除任务！",
                             "Code": CommonResponseStatus.SINGLE_RUNNING.value,
                             "message": "正在运行的网络不可以删除"}, CommonResponseStatus.SERVER_ERROR.value
    # batch delete
    else:
        # all not exist
        if len(noExist) == len(graphids):
            obj, obj_code = {"state": "success"}, CommonResponseStatus.SUCCESS.value
        # all running
        if len(runs) > 0 and len(normal) == 0:
            obj, obj_code = {"Cause": "知识网络正在运行任务不可删除，请先停止或删除任务！！",
                             "Code": CommonResponseStatus.ALL_RUNNING.value,
                             "message": "正在运行的网络不可以删除"}, CommonResponseStatus.SERVER_ERROR.value
        # some are running and some are normal
        if len(runs) > 0 and len(normal) > 0:
            obj, obj_code = {"Cause": "部分知识网络正在运行任务不可删除，请先停止或删除任务！",
                             "Code": CommonResponseStatus.RUNNING_AND_NORMAL.value,
                             "message": "正在运行的网络不可以删除"}, CommonResponseStatus.SERVER_ERROR.value
        # all normal
        if len(runs) == 0 and len(normal) > 0:
            obj, obj_code = json.dumps({"state": "success"}), CommonResponseStatus.SUCCESS.value
    if len(normal) > 0:
        # delete normal graphs
        res, code = graph_Service.deleteGraphByIds(normal)
        if code != 0:
            return Gview.TErrorreturn(res["code"], res["message"], res["solution"], res["cause"],
                                      ""), CommonResponseStatus.SERVER_ERROR.value
        # delete the relationship between the knowledge network and the knowledge graphs
        knw_id = params_json["knw_id"]
        deleteRelation(knw_id, normal)

        # 更新知识网络的智商数据
        intelligence_calculate_service.update_intelligence_info(normal)

    if len(noExist) != 0:
        mess += "%s 不存在; " % ",".join(map(str, noExist))
    if len(runs) != 0:
        mess += "%s 正在运行; " % ",".join(map(str, runs))
    if len(normal) > 0:
        mess += "删除成功：%s; " % ",".join(map(str, normal))
    Logger.log_info(mess)
    if len(normal) > 0:
        updateKnw(normal[0])
    if obj_code == 200:
        return obj, 200
    solution = "请检查是否有删除权限或者图谱是否在运行中"
    return Gview.TErrorreturn(obj["Code"], obj["message"], solution, obj["Cause"], ""), obj_code


@graph_controller_app.route('/ds/<graphid>', methods=["GET"], strict_slashes=False)
@swag_from(swagger_old_response)
def graphDsList(graphid):
    '''
    get data source list in the graph editing process
    get data source list in the graph editing process by graphid
    ---
    parameters:
        -   name: graphid
            in: path
            required: true
            description: graph id
            type: integer
        -   name: page
            in: query
            required: true
            description: page
            type: integer
        -   name: size
            in: query
            required: true
            description: number of display items per page
            type: integer
        -   name: order
            in: query
            required: false
            description: "'ascend'(default) display items in time sequence, new items on the top; else 'descend'"
            type: string
    '''
    if not graphid.isdigit():
        message = "The parameter graph id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    # graph_id不存在
    code, ret = graph_Service.checkById(graphid)
    if code != 0:
        return {"cause": ret["cause"],
                "code": ret["code"],
                "message": ret["message"]}, CommonResponseStatus.BAD_REQUEST.value
    # 获取参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value
    # 参数校验
    check_res, message = graphCheckParameters.getGraphDSList(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    params_json["graph_id"] = graphid
    ret_code, ret_message = graph_Service.getDsAll(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route("/adv-search-config/kglist-conf/<net_id>", methods=["GET"], strict_slashes=False)
@swag_from(swagger_old_response)
def get_adv_search(net_id):
    '''
    get knowledge graph list configuration by network id
    get knowledge graph list configuration by network id
    ---
    parameters:
        -   name: net_id
            in: path
            required: true
            description: network id
            type: integer
    '''
    # 此处兼容知识网络的功能。
    net_ids = knw_service.get_graph_by_knw_id_s(net_id)
    net_ids = list(net_ids.values())
    config_ids = set(net_ids)

    # 此处不需要判断，如果为空，不会走到这一步。
    ids = graph_dao.get_IdByConfigId(config_ids)

    # 获取到所有的有权限的id，对id进行相关字段拼接操作。然后返回。
    result = graph_Service.get_graph_conf_list(ids)
    forReturen = {"res": result}
    return jsonify(forReturen), 200


@graph_controller_app.route("/output", methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def graph_config_output():
    '''
    export the knowledge graph
    export the configuration information of the knowledge graph
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/graph/graph_config_output'
    '''
    config_ids = request.json.get("ids")
    if len(config_ids) > 1:
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.ids_length.too_much_id",
            "too much id",
            "please send a signal id",
            "too much id",
            "",
        ), 500
    for config_id in config_ids:
        code, ret = graph_Service.checkById(config_id)
        if code != 0:
            return Gview.TErrorreturn(
                "Builder.controller.graph_controller.check_config_id.config_not_exists",
                ret["cause"], ret["cause"], ret["message"], ""
            ), 500

        if task_dao.check_task_status(config_id, "normal"):
            return Gview.TErrorreturn(
                "Builder.controller.graph_config.task_status.task_running",
                "graph task is not normal or graph status is not finish",
                "Please check graph or task status",
                "graph task is not normal or graph status is not finish",
                "",
            ), 500
        if task_dao.check_storage_type(config_id):
            return Gview.TErrorreturn(
                "Builder.controller.graph_config.check_storage_type.storage_error",
                "storage type is not nebula",
                "you cant output a graph that not nebula",
                "graph not nebula",
                "",
            ), 500
    # 此处根据要导出的ids类型，导出图谱。
    file_path, file_name = graph_Service.graph_output(config_ids)
    return send_from_directory(file_path, file_name, as_attachment=True)


@graph_controller_app.route("/input", methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def graph_config_input():
    '''
    import the knowledge graph
    import the configuration information of the knowledge graph
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/graph/graph_config_input'
        -   name: file
            in: formData
            description: data file to be uploaded
            required: true
            type: file
            example:
    '''
    # 获取form表单当中的知识网络id和图谱id
    graph_id = request.form.get("graph_id")
    method = request.form.get("method")
    knw_id = request.form.get("knw_id", None)
    if knw_id:
        # 检测知识网络是否存在。
        if not knw_service.check_exists_by_knw_id(knw_id):
            return Gview.TErrorreturn(
                "Builder.controller.graph_config.check_knw.knw_not_exists",
                "knw is not found",
                "please use a useful knw id",
                "knw is not found",
                "",
            ), 500

    # 根据graph_id检测知识图谱数据库是否存在。
    df = graph_dao.getGraphDBbyId(graph_id)
    res = df.to_dict("records")
    if len(res) == 0:
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.check_graph_db.graph_db_not_exists",
            "graph_id is not found",
            "please use a useful graph",
            "graph_id is not found",
            "",
        ), 500
    db_type = res[0]['type']
    if db_type != 'nebula':
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.check_graph_db.graph_db_type_error",
            "graph db type error",
            "please choose nebula type",
            "import only supports nebula",
            "",
        ), 500
    # 标识文件
    file_name = secure_filename("{0}_input".format(str(uuid.uuid1())))
    if os.path.exists(file_name):
        os.remove(file_name)
    else:
        os.mknod(file_name)
    try:
        # 注意如果拿不到，需要报错。
        files = request.files.getlist("file")
    except Exception as e:
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.get_file.unexpect_error",
            "get file error",
            "send a file",
            e.__str__(),
            "",
        ), 500
    try:
        for file in files:
            file.save(file_name)
            ret, status = graph_Service.graph_input(knw_id, graph_id, file_name, method)
            if status != 200:
                return ret, 500
            os.remove(file_name)
    except Exception as e:
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.unexception.unexpect_error",
            "unexception error",
            "get more infomation in details",
            e.__str__(),
            "",
        ), 500

    return "True", 200


@graph_controller_app.route('/info/basic', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_graph_info_basic():
    '''
    get the graph information
    get the graph information by graph id
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: graph id
            type: integer
        -   name: is_all
            in: query
            required: false
            description: 'True：return all fields, ignoring the parameters passed in by key; False(default)：return the required fields by key'
            type: boolean
        -   name: 'key'
            in: query
            required: false
            description: fields requiring additional information
            # type: array
    '''
    try:
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
        code, data = graph_Service.get_graph_info_basic(graph_id, is_all, key)
        if code != codes.successCode:
            return data, 400
        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoBasic_UnknownError
        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


@graph_controller_app.route('/info/onto', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_graph_info_onto():
    '''
    get the ontology of the graph
    get the ontology of the graph by graph id
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: graph id
            type: integer
    '''
    try:
        graph_id = request.args.get('graph_id')
        if not graph_id or not graph_id.isdigit():
            code = codes.Builder_GraphController_GetGraphInfoOnto_ParamError
            return Gview2.TErrorreturn(code,
                                       arg='graph_id',
                                       description='请确保graph_id存在，且graph_id应为数字'), 400
        code, data = graph_Service.get_graph_info_onto(graph_id)
        if code != codes.successCode:
            return data, 400
        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoOnto_UnknownError
        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


@graph_controller_app.route('/info/count', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_graph_info_count():
    '''
    get the count of the graph
    count the number of entities and relationships in the knowledge graph
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: graph id
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
            return data, 400
        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoCount_UnknownError
        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


@graph_controller_app.route('/info/detail', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_graph_info_detail():
    '''
    get the configuration details of entities or edges in the graph
    get the configuration details of entities or edges in the graph
    ---
    parameters:
        -   name: graph_id
            in: query
            required: true
            description: graph id
            type: integer
        -   name: type
            in: query
            required: true
            description: entity or edge
            type: string
        -   name: name
            in: query
            required: true
            description: name of the entity or the edge
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
        if code != codes.successCode:
            return data, 400
        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoDetail_UnknownError
        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400


@graph_controller_app.route('/intelligence/task', methods=['post'], strict_slashes=False)
@swag_from(swagger_new_response)
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
    return Gview2.json_return(resp['res']), 200


@graph_controller_app.route('/intelligence/<graph_id>', methods=['get'], strict_slashes=False)
@swag_from(swagger_new_response)
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

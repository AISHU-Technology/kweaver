from flask import Blueprint, request, jsonify

from common.errorcode import codes
from service.intelligence_service import intelligence_calculate_service
from service.knw_service import knw_service
from dao.knw_dao import knw_dao
from utils.Gview import Gview
from common.errorcode.gview import Gview as Gview2
from utils.knw_check_params import knw_check_params
from utils.log_info import Logger
from utils.common_response_status import CommonResponseStatus
from utils.CommonUtil import commonutil
import json
from flasgger import swag_from
import yaml
import os

from service.intelligence_service import intelligence_query_service

knowledgeNetwork_controller_app = Blueprint('knowledgeNetwork_controller_app', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH',
                               os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)


@knowledgeNetwork_controller_app.route('/network', methods=['post'])
@swag_from(swagger_new_response)
def save_knowledgenetwork():
    '''
    add a knowledge network
    add a knowledge network
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/knowledge_network/save_knowledgenetwork'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()

    # 进行参数校验
    check_res, message = knw_check_params.knwAddParams(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.save_knowledgenetwork.ParamsError",
                                  "parameters Error!", "Please check your parameters", message,
                                  ""), CommonResponseStatus.BAD_REQUEST.value

    ret_code, ret_message, knw_id = knw_service.knowledgeNetwork_save(params_json)
    if knw_id == -1:
        return Gview.TErrorreturn(ret_message["code"], ret_message["cause"], "Please check your parameters",
                                  ret_message["message"], ""), ret_code
    return Gview.Vsuccess(data=knw_id), CommonResponseStatus.SUCCESS.value


@knowledgeNetwork_controller_app.route('/get_all', methods=['get'])
@swag_from(swagger_new_response)
def getAllKnw():
    '''
    paging query knowledge all network
    paging query knowledge all network
    ---
    parameters:
        -   name: page
            in: query
            required: true
            description: page number
            type: integer
        -   name: size
            in: query
            required: true
            description: numbers per page
            type: integer
        -   name: order
            in: query
            required: true
            description: desc asc (ascending and descending in time)
            type: string
        -   name: rule
            in: query
            required: true
            description: 'create: by creation time, update: by update time'
            type: string
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()

    check_res, message = knw_check_params.getKnwParams(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        code = codes.Builder_KnowledgeNetworkController_GetAllKnw_ParamsError
        return Gview2.error_return(code, detail=message), CommonResponseStatus.BAD_REQUEST.value

    ret_code, ret_message = knw_service.getKnw(params_json)
    if ret_code != 200:
        code = codes.Builder_Service_KnwService_KnwService_GetKnw_RequestError
        return Gview2.error_return(code, detail=ret_message["cause"],
                                   description=ret_message["message"]), CommonResponseStatus.BAD_REQUEST.value

    return jsonify(ret_message), CommonResponseStatus.SUCCESS.value


@knowledgeNetwork_controller_app.route('/get_by_name', methods=['get'])
@swag_from(swagger_new_response)
def getKnwByName():
    '''
    paging query knowledge network by name
    paging query knowledge network by name
    ---
    parameters:
        -   name: knw_name
            in: query
            required: true
            description: knowledge network name
            type: string
        -   name: page
            in: query
            required: true
            description: page number
            type: integer
        -   name: size
            in: query
            required: true
            description: numbers per page
            type: integer
        -   name: order
            in: query
            required: true
            description: desc asc (ascending and descending in time)
            type: string
        -   name: rule
            in: query
            required: true
            description: 'create: by creation time, update: by update time'
            type: string
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()

    check_res, message = knw_check_params.getByNameParams(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.getKnwByName.ParamsError",
                                  "parameters Error!",
                                  "Please check your parameters", message, ""), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = knw_service.getKnw(params_json)
    if ret_code != 200:
        return Gview.TErrorreturn(ret_message["code"], ret_message["cause"], ret_message["solution"],
                                  ret_message["message"], ""), CommonResponseStatus.BAD_REQUEST.value

    return jsonify(ret_message), CommonResponseStatus.SUCCESS.value


@knowledgeNetwork_controller_app.route('/edit_knw', methods=['post'])
@swag_from(swagger_new_response)
def editKnw():
    '''
    edit knowledge network
    edit knowledge network by knw_id
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/knowledge_network/editKnw'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    check_res, message = knw_check_params.editParams(params_json)
    if check_res != 0:
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.editKnw.ParamsError",
                                  "parameters Error!", "Please check your parameters", message,
                                  ""), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = knw_service.editKnw(params_json)
    if ret_code != 200:
        return Gview.TErrorreturn(ret_message["code"], ret_message["cause"], "Please check your parameters",
                                  ret_message["cause"], ""), ret_code

    return jsonify({"res": "edit knowledge network success"}), CommonResponseStatus.SUCCESS.value


@knowledgeNetwork_controller_app.route('/delete_knw', methods=['get'])
@swag_from(swagger_new_response)
def deleteKnw():
    '''
    delete knowledge network
    delete knowledge network by knw_id
    ---
    parameters:
        -   name: knw_id
            in: query
            required: true
            description: knowledge network id
            type: integer
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()

    check_res, message = knw_check_params.delParams(params_json)
    if check_res != 0:
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.deleteKnw.ParamsError",
                                  "parameters Missing!", "Please check your parameters",
                                  message, ""), CommonResponseStatus.BAD_REQUEST.value

    ret_code, ret_message = knw_service.deleteKnw(params_json)
    if ret_code != 200:
        return ret_message, ret_code
    return jsonify({"res": "delete knowledge network success"})


@knowledgeNetwork_controller_app.route('/get_graph_by_knw', methods=['get'])
@swag_from(swagger_new_response)
def getGraph():
    '''
    query knowledge graph by knowledge network id
    query knowledge graph by knowledge network id
    ---
    parameters:
        -   name: knw_id
            in: query
            required: true
            description: knowledge network id
            type: integer
        -   name: page
            in: query
            required: true
            description: page number
            type: integer
        -   name: size
            in: query
            required: true
            description: numbers per page
            type: integer
        -   name: order
            in: query
            required: true
            description: Can only be desc (from new to old) or asc (from old to new)
            type: string
        -   name: name
            in: query
            required: true
            description: Fuzzy search according to the graph name, not filled in by default, all data will be returned
            type: string
        -   name: rule
            in: query
            required: true
            description: 'create: sorted by creation time, update: sorted by update time, name: sorted by name'
            type: string
        -   name: upload_graph
            in: query
            required: false
            description: The valid values are true and false. The default value is false, which means that all graphs are returned. True means that only graphs with the storage type of nebula and successfully constructed are returned
            type: boolean
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    check_res, message = knw_check_params.getGraphParams(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.getGraph.ParamsError",
                                  "parameters Error!",
                                  "Please check your parameters", message, ""), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = knw_service.check_knw_id(params_json)
    if ret_code != 200:
        return Gview.TErrorreturn(ret_message["code"], ret_message["des"], ret_message["solution"],
                                  ret_message["detail"], ""), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = knw_service.getGraph(params_json)
    if ret_code != 200:
        return ret_message, ret_code

    return jsonify(ret_message), CommonResponseStatus.SUCCESS.value


@knowledgeNetwork_controller_app.route('/intelligence', methods=['get'])
@swag_from(swagger_new_response)
def intelligence_stats():
    '''
    query knowledge network intelligence calculate result
    ---
    parameters:
        -   name: know_id
            in: query
            required: true
            description: knowledge network id
            type: integer
    '''

    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0 or 'knw_id' not in params_json:
        code = codes.Builder_KnowledgeNetworkController_IntelligenceStats_ParamError
        return Gview2.error_return(code, arg='knw_id'), 400

    ret_code, ret_message = intelligence_query_service.query_network_param_check(params_json)
    if ret_code != codes.successCode:
        return Gview2.error_return(ret_code, **ret_message), 400

    res_code, result = intelligence_query_service.query_network_intelligence(params_json)
    if res_code != codes.successCode:
        return result, 500
    return result, 200


# 添加网络与图谱关系
def saveRelation(knw_id, graph_id):
    params_json = {"knw_id": knw_id, "graph_id": graph_id}

    check_code, message = knw_check_params.relationParams(params_json)
    if check_code != 0:
        return False

    ret_code, ret_message = knw_service.graphRelation(params_json)
    if ret_code != 200:
        return False

    return True


# 删除网络与图谱关系
def deleteRelation(knw_id, graph_ids):
    ret_code, ret_message = knw_service.deleteRelation(knw_id, graph_ids)
    if ret_code != 200:
        return Gview.TErrorreturn(ret_message["code"], ret_message["des"], ret_message["solution"],
                                  ret_message["detail"], ""), ret_code

    return True


# 知识网络内部修改
def updateKnw(graph_id):
    knw_service.updateKnw(graph_id)

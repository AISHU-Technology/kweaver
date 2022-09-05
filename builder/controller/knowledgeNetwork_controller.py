from flask import Blueprint, request, jsonify
from service.knw_service import knw_service
from dao.knw_dao import knw_dao
from utils.knw_check_params import knw_check_params
from utils.log_info import Logger
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from utils.CommonUtil import commonutil
import json
from flasgger import swag_from
import yaml
import os

knowledgeNetwork_controller_app = Blueprint('knowledgeNetwork_controller_app', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH', os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
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
    新建知识网络
    ---
    parameters:
        -   name: knw_name
            in: body
            required: true
            description: knowledge network name
            type: string
            example: knowledge_network_name
        -   name: knw_des
            in: body
            required: false
            description: knowledge network description
            type: string
            example: knowledge network description
        -   name: knw_color
            in: body
            required: true
            description: knowledge network color
            type: string
            example: '#126EE3'
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
    paging query knowledge network
    分页查询全部知识网络
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
            description: desc asc按时间升序降序
            type: string
        -   name: rule
            in: query
            required: true
            description: create按创建时间、update按更新时间
            type: string
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()

    check_res, message = knw_check_params.getKnwParams(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.getAllKnw.ParamsError"
                                  , "parameters Error!", "Please check your parameters", message,
                                  ""), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = knw_service.getKnw(params_json)
    if ret_code != 200:
        return Gview.TErrorreturn(ret_message["code"], ret_message["cause"], ret_message["solution"],
                                  ret_message["message"], ""), CommonResponseStatus.BAD_REQUEST.value

    return jsonify(ret_message), CommonResponseStatus.SUCCESS.value


@knowledgeNetwork_controller_app.route('/get_by_name', methods=['get'])
@swag_from(swagger_new_response)
def getKnwByName():
    '''
    paging query knowledge network by name
    按名称分页查询全部知识网络
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
            description: desc asc按时间升序降序
            type: string
        -   name: rule
            in: query
            required: true
            description: create按创建时间、update按更新时间
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
    编辑知识网络
    ---
    parameters:
        -   name: knw_id
            in: body
            required: true
            description: knowledge network id
            type: integer
            example: 1
        -   name: knw_name
            in: body
            required: true
            description: knowledge network name
            type: string
            example: knw_name
        -   name: knw_des
            in: body
            required: false
            description: knowledge network description
            type: string
            example: knw_des
        -   name: knw_color
            in: body
            required: true
            description: knowledge network color
            type: string
            example: '#126EE3'
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
    删除知识网络
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
    根据知识网络ID查询知识图谱
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
            description: 只能为 desc（从新到旧） 或 asc（从旧到新）
            type: string
        -   name: name
            in: query
            required: true
            description: 按照图谱名称模糊搜索，默认不填，返回所有数据
            type: string
        -   name: rule
            in: query
            required: true
            description: create按照创建时间排序，update按照更新时间排序，name按照名字排序
            type: string
        -   name: upload_graph
            in: query
            required: false
            description: 有效值true,false，默认为false，表示返回全部图谱，true表示只返回存储类型为nebula并且已经构建成功的图谱
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

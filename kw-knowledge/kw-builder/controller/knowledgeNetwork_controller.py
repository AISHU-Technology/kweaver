from flask import Blueprint, request, jsonify
from common.errorcode import codes
from service.knw_service import knw_service
from utils.knw_check_params import knw_check_params
from utils.log_info import Logger
import common.stand_log as log_oper
import sys
from utils.Gview import Gview
from common.errorcode.gview import Gview as Gview2
from utils.common_response_status import CommonResponseStatus
from utils.CommonUtil import commonutil
from flask_babel import gettext as _l
from flasgger import swag_from
import yaml
import os


knowledgeNetwork_controller_app = Blueprint('knowledgeNetwork_controller_app', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH',
                               os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r', encoding='utf-8') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)


# 新建知识网络
@knowledgeNetwork_controller_app.route('/add', methods=['post'])
@swag_from(swagger_new_response)
def save_knowledgenetwork():
    '''
    新建知识网络
    新建知识网络
    ---
    operationId: save_knowledgenetwork
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    $ref: '#/components/schemas/builder.knowledge_network.save_knowledgenetwork'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()

    # 进行参数校验
    check_res, message = knw_check_params.knwAddParams(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.save_knowledgenetwork.ParamsError",
                                  _l("Parameters Error!"), _l("Please check your parameters."), message,
                                  ""), CommonResponseStatus.BAD_REQUEST.value

    params_json['userId'] = request.headers.get('userId')
    ret_code, ret_message, knw_id = knw_service.knowledgeNetwork_save(params_json)
    if knw_id == -1:

        return Gview.TErrorreturn(ret_message["code"], ret_message["cause"], _l("Please check your parameters."),
                                  ret_message["message"], ""), ret_code
    user_name = request.headers.get("username")
    operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, knw_id, params_json,
                                               "新建了知识网络{id=%s}，结果为%s" % (knw_id, params_json), "kn")
    Logger.log_info(operation_log)
        
    return Gview.Vsuccess(data=knw_id), CommonResponseStatus.SUCCESS.value


# 分页查询全部知识网络
@knowledgeNetwork_controller_app.route('/page', methods=['get'])
@swag_from(swagger_new_response)
def getAllKnw():
    '''
    分页查询知识网络接口
    分页查询知识网络接口
    ---
    operationId: getAllKnw
    parameters:
        -   name: page
            in: query
            required: true
            description: 页码
            schema:
                type: integer
        -   name: size
            in: query
            required: true
            description: 每页数据
            schema:
                type: integer
        -   name: order
            in: query
            required: true
            description: desc asc按时间升序降序
            schema:
                type: string
        -   name: rule
            in: query
            required: true
            description: 'create按创建时间、update按更新时间'
            schema:
                type: string
    responses:
        '200':
            description: 操作成功
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/builder.knowledge_network.getAllKnw_response200'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()

    check_res, message = knw_check_params.getKnwParams(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        code = codes.Builder_KnowledgeNetworkController_GetAllKnw_ParamsError

        return Gview2.error_return(code, detail=message), CommonResponseStatus.BAD_REQUEST.value

    # dataIds = request.headers.get("dataIds")
    # Logger.log_info(dataIds)
    # res_list = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]
    # params_json["res_list"] = res_list

    ret_code, ret_message = knw_service.getKnw(params_json)
    if ret_code != 200:
        code = codes.Builder_Service_KnwService_KnwService_GetKnw_RequestError

        return Gview2.error_return(code, detail=ret_message["cause"],
                                   description=ret_message["message"]), CommonResponseStatus.BAD_REQUEST.value

    return jsonify(ret_message), CommonResponseStatus.SUCCESS.value


# 按名称分页查询全部知识网络
@knowledgeNetwork_controller_app.route('/page_by_name', methods=['get'])
@swag_from(swagger_new_response)
def getKnwByName():
    '''
    根据名称分页查询知识网络接口
    根据名称分页查询知识网络接口
    ---
    operationId: getKnwByName
    parameters:
        -   name: knw_name
            in: query
            required: true
            description: 知识网络名称
            schema:
                type: string
        -   name: page
            in: query
            required: true
            description: 页码
            schema:
                type: integer
        -   name: size
            in: query
            required: true
            description: 每页数据
            schema:
                type: integer
        -   name: order
            in: query
            required: true
            description: desc asc按时间升序降序
            schema:
                type: string
        -   name: rule
            in: query
            required: true
            description: 'create按创建时间、update按更新时间'
            schema:
                type: string
    responses:
      '200':
        description: 操作成功
        content:
            application/json:
                schema:
                    $ref: '#/components/schemas/builder.knowledge_network.getKnwByName_response200'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()

    check_res, message = knw_check_params.getByNameParams(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.getKnwByName.ParamsError",
                                  _l("Parameters Error!"),
                                  _l("Please check your parameters."), message, ""), CommonResponseStatus.BAD_REQUEST.value

    # dataIds = request.headers.get("dataIds")
    # res_list = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]
    # params_json["res_list"] = res_list

    ret_code, ret_message = knw_service.getKnw(params_json)
    if ret_code != 200:

        return Gview.TErrorreturn(ret_message["code"], ret_message["cause"], ret_message["solution"],
                                  ret_message["message"], ""), CommonResponseStatus.BAD_REQUEST.value

    return jsonify(ret_message), CommonResponseStatus.SUCCESS.value


# 编辑知识网络
@knowledgeNetwork_controller_app.route('/edit', methods=['post'])
# @swag_from(swagger_new_response)
def editKnw():
    '''
    edit knowledge network
    edit knowledge network by knw_id
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.knowledge_network.editKnw'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()

    check_res, message = knw_check_params.editParams(params_json)
    if check_res != 0:
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.editKnw.ParamsError",
                                  _l("Parameters Error!"), _l("Please check your parameters."), message,
                                  ""), CommonResponseStatus.BAD_REQUEST.value

    ret_code, ret_message = knw_service.editKnw(params_json)
    if ret_code != 200:

        return Gview.TErrorreturn(ret_message["code"], ret_message["cause"], _l("Please check your parameters."),
                                  ret_message["cause"], ""), ret_code
    user_name = request.headers.get("username")
    operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, params_json["knw_id"], params_json,
                                               "修改了知识网络{id=%s}，结果为%s" % (params_json["knw_id"], params_json), "kn")
    Logger.log_info(operation_log)
        
    return jsonify({"res": "edit knowledge network success"}), CommonResponseStatus.SUCCESS.value


# 删除知识网络
@knowledgeNetwork_controller_app.route('/delete', methods=['POST'])
@swag_from(swagger_new_response)
def deleteKnw():
    '''
    删除知识网络
    删除知识网络
    ---
    operationId: deleteKnw
    requestBody:
        description: 'request body'
        content:
            application/json:
                schema:
                    $ref: '#/components/schemas/builder.knowledge_network.deleteKnw'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()

    check_res, message = knw_check_params.delParams(params_json)
    if check_res != 0:
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.deleteKnw.ParamsError",
                                  "parameters Missing!", _l("Please check your parameters."),
                                  message, ""), CommonResponseStatus.BAD_REQUEST.value

    ret_code, ret_message = knw_service.deleteKnw(params_json)
    if ret_code != 200:
        return ret_message, ret_code
    user_name = request.headers.get("username")
    operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, params_json["knw_id"], {},
                                               "删除了知识网络{id=%s}" % params_json["knw_id"], "kn")
    Logger.log_info(operation_log)
        
    return jsonify({"res": "delete knowledge network success", "knw_id": [params_json["knw_id"]]})


# 根据知识网络ID查询知识图谱
@knowledgeNetwork_controller_app.route('/graph/page', methods=['get'])
@swag_from(swagger_new_response)
def getGraph():
    '''
    根据知识网络获取图谱信息
    根据知识网络获取图谱信息
    ---
    operationId: getGraph
    parameters:
        -   name: knw_id
            in: query
            required: true
            description: 知识网络id，可从查询知识网络接口获取
            schema:
                type: integer
        -   name: page
            in: query
            required: true
            description: 页码
            schema:
                type: integer
        -   name: size
            in: query
            required: true
            description: 每页数量
            schema:
                type: integer
        -   name: order
            in: query
            required: true
            description: 默认按从新至旧排序，接受参数为：'desc'（从新到旧），'asc'（从旧到新）
            schema:
                type: string
        -   name: name
            in: query
            required: true
            description: 对图谱名称进行模糊搜索，不填此参数则返回所有
            schema:
                type: string
        -   name: rule
            in: query
            required: true
            description: "默认按照更新时间排序，接受参数为：'update'（按图谱更新时间排序），'create'（按图谱创建时间排序）,'name'（按图谱名称排序）"
            schema:
                type: string
        -   name: upload_graph
            in: query
            required: false
            description: 默认为false，返回所有图谱；参数为true时只返回类型为nebula且构建成功的图谱
            schema:
                type: boolean
    responses:
        '200':
            description: 操作成功
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/builder.knowledge_network.getGraph_response200'
    '''

    param_code, params_json, param_message = commonutil.getMethodParam()
    check_res, message = knw_check_params.getGraphParams(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview.TErrorreturn("Builder.controller.knowledgeNetwork_controller.getGraph.ParamsError",
                                  _l("Parameters Error!"),
                                  _l("Please check your parameters."), message, ""), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = knw_service.check_knw_id(params_json)
    if ret_code != 200:
        
        return Gview.TErrorreturn(ret_message["code"], ret_message["des"], ret_message["solution"],
                                  ret_message["detail"], ""), CommonResponseStatus.BAD_REQUEST.value
    # params_json["user_id"] = request.headers.get("userId")
    ret_code, ret_message = knw_service.getGraph(params_json)
    if ret_code != 200:
        
        return ret_message, ret_code

    return jsonify(ret_message), CommonResponseStatus.SUCCESS.value

# 知识网络内部修改
def updateKnw(graph_id):
    knw_service.updateKnw(graph_id)

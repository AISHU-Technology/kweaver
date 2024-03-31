from flask import Blueprint, request, jsonify

from common.errorcode import codes
from dao.dsm_dao import dsm_dao
from dao.function_dao import function_dao
from dao.lexicon_dao import lexicon_dao
from dao.other_dao import other_dao
from service.knw_service import knw_service
from dao.knw_dao import knw_dao
from utils.knw_check_params import knw_check_params
from utils.log_info import Logger
import common.stand_log as log_oper
import sys
import traceback
from utils.Gview import Gview
from common.errorcode.gview import Gview as Gview2
from utils.common_response_status import CommonResponseStatus
from utils.CommonUtil import commonutil
import json
# from drivenadapters.user_management import user_mgnt

from service.intelligence_service import intelligence_query_service
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
@knowledgeNetwork_controller_app.route('/network', methods=['post'])
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
@knowledgeNetwork_controller_app.route('/get_all', methods=['get'])
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
@knowledgeNetwork_controller_app.route('/get_by_name', methods=['get'])
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


# 获取有创建应用权限的知识网络列表
@knowledgeNetwork_controller_app.route('/create_service_knw', methods=['GET'])
def createServiceKnw():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        check_code, message = knw_check_params.createServiceKnwParam(params_json)
        if check_code != 0:
            code = codes.Builder_KnowledgeNetworkController_CreateServiceKnw_ParamsError

            return Gview2.error_return(code, message=message), 400
        page = params_json["page"]
        size = params_json["size"]
        user_id = request.headers.get("userId")
        ret_code, ret_message = knw_service.get_create_service_knw(page, size, user_id)
        if ret_code != 200:

            return ret_message, ret_code

        return Gview2.json_return(ret_message), ret_code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = codes.Builder_KnowledgeNetworkController_CreateServiceKnw_UnknownError

        return Gview2.error_return(code, description=str(e)), 500


# 编辑知识网络
@knowledgeNetwork_controller_app.route('/edit_knw', methods=['post'])
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
@knowledgeNetwork_controller_app.route('/delete_knw', methods=['POST'])
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
@knowledgeNetwork_controller_app.route('/get_graph_by_knw', methods=['get'])
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


@knowledgeNetwork_controller_app.route('/intelligence', methods=['get'])
# @swag_from(swagger_new_response)
def intelligence_stats():
    '''
    query knowledge network intelligence calculate result
    query knowledge network intelligence calculate result
    # ---
    # parameters:
    #     -   name: size
    #         in: query
    #         required: true
    #         description: knowledge network intelligence list page size
    #         type: integer
    #     -   name: page
    #         in: query
    #         required: true
    #         description: knowledge network intelligence list page index
    #         type: integer
    #     -   name: rule
    #         in: query
    #         required: true
    #         description: knowledge network intelligence info sort properties
    #         type: string
    #     -   name: order
    #         in: query
    #         required: true
    #         description: knowledge network intelligence info sort type, desc or asc
    #         type: string
    #     -   name: knw_id
    #         in: query
    #         required: true
    #         description: knowledge network id
    #         type: integer
    #     -   name: graph_name
    #         in: query
    #         required: false
    #         description: graph name
    #         type: string
    '''

    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0 or 'knw_id' not in params_json:
        code = codes.Builder_KnowledgeNetworkController_IntelligenceStats_ParamError

        return Gview2.error_return(code, arg='knw_id'), 400

    ret_code, ret_message = intelligence_query_service.query_network_param_check(params_json)
    if ret_code != codes.successCode:

        return Gview2.error_return(ret_code, **ret_message), 400

    # dataIds = request.headers.get("dataIds")
    # graph_ids = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]
    # params_json["graph_ids"] = graph_ids

    res_code, result = intelligence_query_service.query_network_intelligence(params_json)
    if res_code != codes.successCode:
        return result, 500
        
    return result, 200


# 内部权限调用
@knowledgeNetwork_controller_app.route('/get_by_graph', methods=['post'])
# @swag_from(swagger_new_response)
def getKnwByGraphId():
    '''
    get knowledge network id by graph_id
    get knowledge network id by graph_id
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.knowledge_network.getKnwByGraphId'
    '''
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        graph_ids = params_json['graph_ids']
        res = knw_dao.get_ids_by_graph(graph_ids)
        knw_ids = [record['knw_id'] for record in res]

        return jsonify({'res': knw_ids}), 200
    except Exception as e:
        obj = {}
        err = repr(e)
        Logger.log_error(err)
        if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
            obj['Description'] = "you have an error in your SQL!"
        else:
            obj['Description'] = err
        obj['ErrorCode'] = "Builder.KnowledgeNetworkController.GetKnwByGraphId.InternalError"
        obj['ErrorDetails'] = "query grape fail"
        obj['Solution'] = "Please check mariadb or sql"
        obj["ErrorLink"] = ""
            
    return jsonify(obj), 500


# 内部权限调用
@knowledgeNetwork_controller_app.route('/getbylexicon', methods=['post'])
# @swag_from(swagger_new_response)
def getIdByLexicon():
    """
    search knw by lexicon ids
    search knw by lexicon ids
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.knowledge_network.getIdByLexicon'
    """
    lexicon_ids = request.json.get("lexicon_ids")
    if not lexicon_ids or not isinstance(lexicon_ids, list):
        return Gview.TErrorreturn(
            ErrorCode="Builder.KnowledgeNetwork.GetIdByLexicon.ParamsError",
            Description="parameter error",
            Solution="please check your parameter again.",
            ErrorDetails="lexicon_ids should be list and should have at least one value.",
            ErrorLink=""
        ), 500
    datas = knw_dao.get_id_by_lexicon(lexicon_ids)
    knowledge_ids = [data['knowledge_id'] for data in datas]
        
    return jsonify({'res': knowledge_ids}), 200


# 内部权限调用
@knowledgeNetwork_controller_app.route('/getbyds', methods=['post'])
# @swag_from(swagger_new_response)
def getIdByDs():
    """
    search knw by data source ids
    search knw by data source ids
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.knowledge_network.getIdByDs'
    """
    ds_ids = request.json.get("ds_ids")
    if not ds_ids or not isinstance(ds_ids, list):
        return Gview.TErrorreturn(
            ErrorCode="Builder.KnowledgeNetwork.GetIdByDs.ParamsError",
            Description="parameter error",
            Solution="please check your parameter again.",
            ErrorDetails="ds_ids should be list and should have at least one value.",
            ErrorLink=""
        ), 500
    datas = knw_dao.get_id_by_ds(ds_ids)
    knowledge_ids = [data['knw_id'] for data in datas]
        
    return jsonify({'res': knowledge_ids}), 200


# 内部权限调用
@knowledgeNetwork_controller_app.route('/getbyknw', methods=['post'])
# @swag_from(swagger_new_response)
def getGraphByKnw():
    """
    search graph by knw ids
    search graph by knw ids
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.knowledge_network.getGraphByKnw'
     """
    knw_ids = request.json.get("knw_ids")
    resource_type = request.json.get("type")
    if not knw_ids or not isinstance(knw_ids, list):
        return Gview.TErrorreturn(
            ErrorCode="Builder.KnowledgeNetwork.GetGraphByKnw.ParamsError",
            Description="parameter error",
            Solution="please check your parameter again.",
            ErrorDetails="knw_ids should be list and should have at least one value.",
            ErrorLink=""
        ), 500
    if resource_type == "kg":
        datas = knw_dao.get_graph_ids_by_knw(knw_ids)
        ids = [data['graph_id'] for data in datas]
    elif resource_type == "lexicon":
        datas = lexicon_dao.get_lexicon_by_knw(knw_ids)
        ids = [data['id'] for data in datas]
    elif resource_type == "function":
        datas = function_dao.get_function_by_knw(knw_ids)
        ids = [data['id'] for data in datas]
    else:
        datas = dsm_dao.get_ds_by_knw(knw_ids)
        ids = [data['id'] for data in datas]
        
    return jsonify({'res': ids}), 200


# 内部权限调用
@knowledgeNetwork_controller_app.route('/resource_exists', methods=['get'])
# @swag_from(swagger_new_response)
def resourceExists():
    """
    Determine whether the resource exists
    Determine whether the resource exists
    # ---
    # parameters:
    #     -   name: dataId
    #         in: query
    #         required: true
    #         description: the id of the object to be queried
    #         type: integer
    #         example: 1
    #     -   name: dataType
    #         in: query
    #         required: true
    #         description: 'optional values: kn, kg, lexicon, function, ds'
    #         type: string
    #         example: kn
    """
    params_json = request.args.to_dict()
    data_id = params_json['dataId']
    data_type = params_json['dataType']
    res = other_dao.resource(data_id, data_type)

    if len(res) > 0:
        return jsonify({'res': 'True'})
    return jsonify({'res': 'False'})


# 内部权限调用
@knowledgeNetwork_controller_app.route('/resource_creator', methods=['get'])
# @swag_from(swagger_new_response)
def resourceCreator():
    """
    find the resource creator
    find the resource creator
    # ---
    # parameters:
    #     -   name: dataId
    #         in: query
    #         required: true
    #         description: the id of the object to be queried
    #         type: integer
    #     -   name: dataType
    #         in: query
    #         required: true
    #         description: 'optional values: kn, kg, lexicon, function, ds'
    #         type: string
    """
    params_json = request.args.to_dict()
    data_id = params_json['dataId']
    data_type = params_json['dataType']
    res = other_dao.resource(data_id, data_type)

    if len(res) > 0:
        return jsonify({'res': res[0]['create_user']})
    return jsonify({'res': 'None'})


# 知识网络内部修改
def updateKnw(graph_id):
    knw_service.updateKnw(graph_id)

from flask import Blueprint, request, jsonify
from service.knw_service import knw_service
from dao.knw_dao import knw_dao
from utils.knw_check_params import knw_check_params
from utils.log_info import Logger
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from utils.CommonUtil import commonutil
import json

knowledgeNetwork_controller_app = Blueprint('knowledgeNetwork_controller_app', __name__)


# 新建知识网络
@knowledgeNetwork_controller_app.route('/network', methods=['post'])
def save_knowledgenetwork():
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


# 分页查询全部知识网络
@knowledgeNetwork_controller_app.route('/get_all', methods=['get'])
def getAllKnw():
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


# 按名称分页查询全部知识网络
@knowledgeNetwork_controller_app.route('/get_by_name', methods=['get'])
def getKnwByName():
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


# 编辑知识网络
@knowledgeNetwork_controller_app.route('/edit_knw', methods=['post'])
def editKnw():
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


# 删除知识网络
@knowledgeNetwork_controller_app.route('/delete_knw', methods=['get'])
def deleteKnw():
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


# 根据知识网络ID查询知识图谱
@knowledgeNetwork_controller_app.route('/get_graph_by_knw', methods=['get'])
def getGraph():
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

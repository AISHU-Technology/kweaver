# -*-coding:utf-8-*-
# @Time    : 2020/9/7 18:22
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import requests
from flask import Blueprint, request, jsonify, send_file, send_from_directory, make_response

from werkzeug.utils import secure_filename
from config.config import permission_manage
from dao.graph_dao import graph_dao
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
from third_party_service.managerUtils import managerutils
from controller.knowledgeNetwork_controller import saveRelation, deleteRelation, updateKnw
from common.errorcode.gview import Gview as Gview2
from common.errorcode import codes

graph_controller_app = Blueprint('graph_controller_app', __name__)
graph_controller_open = Blueprint('graph_controller_open', __name__)


@graph_controller_app.route('', methods=["post"], strict_slashes=False)
def graphopt():
    '''
    GET请求：返回所有图谱信息
    POST请求：graph_Service.addgraph新增图谱
    '''
    method = request.method
    uuid = request.headers.get("uuid")
    # 根据不同的请求方式请求方式获得参数并获取异常
    # get all
    if method == "GET":
        host_url = getHostUrl()
        permission = Permission(uuid, method)

        res_message, res_code = permission.graphGet()
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
        params_json["graph_process"][0]["graph_DBName"] = other_dao.get_random_uuid()
        ret_code, ret_message = knw_service.check_knw_id(params_json)
        if ret_code != 200:
            return Gview.BuFailVreturn(cause=ret_message["des"], code=CommonResponseStatus.INVALID_KNW_ID.value,
                                       message=ret_message["detail"]), CommonResponseStatus.SERVER_ERROR.value
        ret_code, ret_message, graph_id = graph_Service.addgraph(params_json, host_url)
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

        if permission_manage:
            # 增加资源
            res_message, res_code = managerutils.add_resource(kg_id=graph_id, type=3, uuid=uuid)
            if res_code != 200:
                # 删除新增的资源记录
                deleteRelation(knw_id, graph_id)
                graph_dao.delete_record(graph_id)
                return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                           message=res_message["message"]), res_code

            # 调用manager接口增加默认权限
            res_message, res_code = managerutils.add_permission(kg_id=graph_id, type=3, uuid=uuid)
            if res_code != 200:
                deleteRelation(knw_id, graph_id)
                graph_dao.delete_record(graph_id)
                return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                           message=res_message["message"]), res_code
        updateKnw(uuid, graph_id)
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/<grapid>', methods=["post"], strict_slashes=False)
def graph(grapid):
    '''
    根据图谱id编辑图谱信息
    graphCheckParameters.graphAddPar进行参数格式校验
    graph_Service.update编辑图谱
    '''
    uuid = request.headers.get("uuid")
    host_url = getHostUrl()
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
    # 上传中或者导出中的图谱不能编辑
    res, code = graph_Service.get_upload_id(grapid)
    res = res.to_dict('records')
    if len(res) > 0:
        cause = "graph upload can not edit"
        message = "graph cannot edit,the graph is upload"
        code = CommonResponseStatus.GRAPH_UPLOAD_NOT_EDIT.value
        return Gview.BuFailVreturn(cause=cause, code=code,
                                   message=message), CommonResponseStatus.SERVER_ERROR.value
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
            #  流程中本体的部分 如果是新增本体 直接调用新增本体
            # 是否有新增本体权限
            if permission_manage:
                res_message, res_code = managerutils.create_resource(uuid=uuid, resourceType=1)
                if res_code != 200:
                    return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                               message=res_message["message"]), res_code

            ret_code, ret_message, otl_id = otl_service.ontology_save(graph_process_dict)
            if ret_code == 200:  # 本体添加成功才更新图谱配置
                if permission_manage:
                    # 增加资源
                    res_message, res_code = managerutils.add_resource(kg_id=otl_id, type=1, uuid=uuid)
                    if res_code != 200:
                        # 删除新增的资源记录
                        otl_dao.delete([otl_id])
                        return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                                   message=res_message["message"]), res_code

                    # 调用manager接口增加默认权限
                    res_message, res_code = managerutils.add_permission(kg_id=otl_id, type=1, uuid=uuid)
                    if res_code != 200:
                        otl_dao.delete([otl_id])
                        return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                                   message=res_message["message"]), res_code

                # otl_id = ret_message["res"]["ontology_id"]
                ret_code2, ret_message2 = graph_Service.update(grapid, params_json, otl_id, host_url)
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
                ret_code, ret_message = otl_service.update_name(str(otl_id), graph_process_dict, host_url, "1")
            elif updateoradd == "update_otl_info":
                ret_code, ret_message = otl_service.update_info(str(otl_id), graph_process_dict, host_url, "1", grapid)
            if ret_code == 200:
                # 更新 本体temp字段
                ret_code2, ret_message2 = graph_Service.update_otl_temp(grapid, host_url)
                if ret_code2 == CommonResponseStatus.SERVER_ERROR.value:
                    return Gview.BuFailVreturn(cause=ret_message2["cause"], code=ret_message2["code"],
                                               message=ret_message2[
                                                   "message"]), CommonResponseStatus.SERVER_ERROR.value
                updateKnw(uuid, grapid)
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
        ret_code, ret_message = graph_Service.update(grapid, params_json, "-1", host_url)
        if ret_code != 200:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        updateKnw(uuid, grapid)
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
        ret_code, ret_message = graph_Service.update(grapid, params_json, "-1", host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            obj = {}
            obj["ErrorCode"] = str(ret_message["code"])
            obj["Description"] = ret_message["cause"]
            obj["Solution"] = "please check your mysql or your parameters"
            obj["ErrorDetails"] = [{str(ret_message["message"])}]
            obj["ErrorLink"] = ""
            return Gview.VErrorreturn(obj), CommonResponseStatus.BAD_REQUEST.value
        updateKnw(uuid, grapid)
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
        ret_code, ret_message = graph_Service.update(grapid, params_json, "-1", host_url)
        Logger.log_error("parameters:%s invalid" % params_json)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        print('ret_res', ret_message)

        if permission_manage:
            # 图谱编辑过程中，数据源发生变化，builder发送graphid和原有的数据源给manager

            ret_message1, ret_code1 = managerutils.ds_changed(grapid, dsids, uuid)
            if ret_code1 != 200:
                return Gview.BuFailVreturn(cause=ret_message1["cause"], code=ret_message1["code"],
                                           message=ret_message1["message"]), CommonResponseStatus.SERVER_ERROR.value
            if not ret_message1:
                return Gview.BuFailVreturn(cause="manager update failed", code=CommonResponseStatus.REQUEST_ERROR.value,
                                           message="manager update failed"), CommonResponseStatus.SERVER_ERROR.value
        updateKnw(uuid, grapid)
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/getgraphdb', methods=["get"], strict_slashes=False)
def getgraphdb():
    '''
    graph_Service.getGraphDB查询图谱数据库连接信息
    '''
    host_url = getHostUrl()
    print(host_url)
    ret_code, ret_message = graph_Service.getGraphDB(host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/getbis', methods=["get"], strict_slashes=False)
def getbis():
    """
    get base info switch
    :return:
    """
    host_url = getHostUrl()
    ret_code, ret_message = graph_Service.getbis(host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


# @graph_controller_app.route('/getgraphdb', methods=["get"], strict_slashes=False)
# def getGraphDB():
#     host_url = getHostUrl()
#     ret_code, ret_message = graph_Service.getGraphDB(host_url)
#     if ret_code == CommonResponseStatus.SERVER_ERROR.value:
#         return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
#                                    message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
#     return ret_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/<graphid>', methods=["get"], strict_slashes=False)
def getgraphbyid(graphid):
    uuid = request.headers.get("uuid")
    host_url = getHostUrl()
    if not graphid.isdigit():
        message = "The parameter graph id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    # graph_id不存在
    code, ret = graph_Service.checkById(graphid)
    if code != 0:
        return jsonify(ret), 500
        # return Gview.BuFailVreturn(cause=ret["cause"], code=ret["code"],
        #                           message=ret["message"]), CommonResponseStatus.REQUEST_ERROR.value

    if permission_manage:
        res_message, res_code = managerutils.operate_permission(uuid=uuid, kg_id=[graphid], type=3, action="update")
        if res_code != 200:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code

    ret_code, ret_message = graph_Service.getGraphById(graphid, host_url)

    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route('/<graph_step>/graphid=<graphid>', methods=["get"], strict_slashes=False,
                            endpoint="graph_step")
def getgraphbystep(graphid, graph_step):
    ''' Flora 20201104
    根据id和指定的图谱配置阶段，查询entity和property
    graphid：图谱id
    graph_step:["graph_InfoExt","graph_KMap","graph_KMerge"] '''
    host_url = getHostUrl()
    if not graphid.isdigit():
        message = "The parameter graph id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = graph_Service.getGraphById(graphid, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    entity_message = graph_Service.get_entity_property(ret_message, graph_step)

    return entity_message, CommonResponseStatus.SUCCESS.value


# 20201019Flora
@graph_controller_app.route('/infoext_list', methods=["post"], strict_slashes=False)
def getbyinfoext():
    ''' 根据id和指定的图谱配置阶段，查询图谱信息，参数
       graphid：图谱id
       graph_step:["graph_InfoExt","graph_KMap","graph_KMerge"] '''
    host_url = getHostUrl()
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

        ret_code, ret_message = graph_Service.getGraphById(graphid, host_url)
        print('ret_code', ret_code)
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


# 20201026Flora
@graph_controller_app.route('/check_kmapinfo', methods=["post"], strict_slashes=False)
def check_kmapinfo():
    ''' 根据id和指定的图谱配置阶段，查询图谱信息，参数
       graphid：图谱id
       check_kmapinfo:[参考KMap的写入参数] '''
    host_url = getHostUrl()
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
        ret_code, ret_message = graph_Service.getGraphById(graphid, host_url)
        print('ret_code', ret_code)
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
def savenocheck():
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = graphCheckParameters.savenoCheckPar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = graph_Service.savenocheck(params_json, host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return ret_message, CommonResponseStatus.SUCCESS.value

    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


# 一键导入时的数据源列表：该图谱下的，且属性id为1的数据源
@graph_controller_app.route('/getdsbygraphid', methods=["get"], strict_slashes=False)
def getdsbygraphids():
    '''
    根据图谱id返回数据源列表
    '''
    kgIds = []
    uuid = request.headers.get("uuid")
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = graphCheckParameters.getdsbygraphidPar(params_json)

        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        # 权限, 属性ID=1的数据源列表
        if permission_manage:
            # 调用manager接口获取数据源列表和属性
            res_message, res_code = managerutils.get_otlDsList(uuid=uuid, type=2)
            if res_code != 200:
                return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                           message=res_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            if len(res_message) != 0:
                for temp in res_message:
                    if temp["propertyId"] == 1:
                        kgIds.append(temp["configId"])
            # if len(kgIds) == 0:
            #     obj["res"] = {"count": 0, "df": []}
            #     return jsonify({"res": obj, "code": 200})
        if permission_manage:
            params_json["kgIds"] = kgIds
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
    if info != "kg-manager":
        return Gview.BuFailVreturn(cause="No access", code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="No access"), CommonResponseStatus.BAD_REQUEST.value
    # 获取参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        # 参数校验
        check_res, message = graphCheckParameters.getdsotlbygraphIdPar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value

        ret_code, ret_message = graph_Service.getOtlDsByGraphid(params_json, host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


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
    # print("paras: ", paras)
    if param_code == 0:
        # 参数校验
        check_res, message = graphCheckParameters.getgraphinfoPar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
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
def graphDeleteByIds():
    uuid = request.headers.get("uuid")
    runs, noAuthority, noExist, normal = [], [], [], []
    mess = ""
    obj, obj_code = {}, 200
    # 获取参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0:
        error_link = ''
        code = CommonResponseStatus.PARAMETERS_ERROR.value
        detail = 'Incorrect parameter format'
        desc = "Incorrect parameter format"
        solution = 'Please check your parameter format'
        return Gview.TErrorreturn(code, desc, solution, detail,
                                  error_link), CommonResponseStatus.BAD_REQUEST.value
    # 参数校验
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
    # 统计运行状态的
    res_mess, res_code = graph_Service.getStatusByIds(graphids)
    if res_code != 0:
        return Gview.TErrorreturn(res_mess["code"], res_mess["message"], res_mess["solution"], res_mess["cause"],
                                  ""), CommonResponseStatus.SERVER_ERROR.value
    # 运行状态的graphId列表
    runs = res_mess["runs"]

    # 统计不存在的id
    res, code = graph_Service.getNoExistIds(graphids)
    if code != 0:
        return Gview.TErrorreturn(res["code"], res["message"], res["solution"], res["cause"],
                                  ""), CommonResponseStatus.SERVER_ERROR.value
    noExist = res["noExist"]
    normal = list(set(graphids) - set(noExist) - set(runs))
    if permission_manage and len(normal) > 0:
        # 统计删除权限情况
        res_mess1, res_code1 = graph_Service.permission_statistics(normal, uuid)
        if res_code1 != 200:
            return Gview.TErrorreturn(res_mess1["code"], res_mess1["message"], res_mess1["solution"],
                                      res_mess1["cause"], ""), CommonResponseStatus.SERVER_ERROR.value
        noAuthority = res_mess1["noAuthority"]
    normal = list(set(normal) - set(noAuthority))
    # 单一删除
    if len(graphids) == 1:
        # 正常
        if len(normal) == 1:
            mess += "删除成功：%s; " % ",".join(map(str, normal))
            obj, obj_code = json.dumps({"state": "sucess"}), CommonResponseStatus.SUCCESS.value
        # 不存在
        if len(noExist) != 0:
            mess += "%s 不存在; " % ",".join(map(str, noExist))
            mess += "删除成功：%s; " % ",".join(map(str, normal))
            mess += "operator uuid: %s ;" % uuid
            obj, obj_code = json.dumps({"state": "sucess"}), CommonResponseStatus.SUCCESS.value
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
            # mess += "%s 不存在; " % ",".join(map(str, noExist))
            # mess += "删除成功：%s; " % ",".join(map(str, normal)) + "operator uuid: %s ;" % uuid
            obj, obj_code = {"state": "sucess"}, CommonResponseStatus.SUCCESS.value
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
            obj, obj_code = json.dumps({"state": "sucess"}), CommonResponseStatus.SUCCESS.value
    res1 = True
    # 统计上传中的图谱
    res, code = graph_Service.get_upload_id(normal)
    if code != 0:
        return Gview.TErrorreturn(res["code"], res["message"], res["solution"], res["cause"],
                                  ""), CommonResponseStatus.SERVER_ERROR.value
    res = res.to_dict('records')
    if len(res) > 0:
        obj_code = 500
        desc = "graph upload can not delete"
        solution = "please wait upload finished"
        cause = "graph upload can not delete"
        return Gview.TErrorreturn(CommonResponseStatus.GRAPH_UPLOAD.value, desc, solution, cause, ""), obj_code
    if permission_manage and len(normal) > 0:
        # 调用manager接口，告知可以删除的graphids
        res1, code1 = managerutils.graph_delete(normal)
        if code1 != 200:
            return Gview.TErrorreturn(res1["code"], res1["message"], res1["solution"], res1["cause"],
                                      ""), CommonResponseStatus.SERVER_ERROR.value
    if not res1:
        code = CommonResponseStatus.GRAPH_PERMISSION_DELETE_ERR.value
        return Gview.TErrorreturn(code, "图谱权限删除失败", "Please check permissions", "图谱权限删除失败",
                                  ""), CommonResponseStatus.SERVER_ERROR.value
    if len(normal) > 0:
        # 删除可以删除的
        res, code = graph_Service.deleteGraphByIds(normal)
        if code != 0:
            return Gview.TErrorreturn(res["code"], res["message"], res["solution"], res["cause"],
                                      ""), CommonResponseStatus.SERVER_ERROR.value
        # 删除知识网络与图谱关系
        knw_id = params_json["knw_id"]
        deleteRelation(knw_id, normal)

    if len(noExist) != 0:
        mess += "%s 不存在; " % ",".join(map(str, noExist))
    if len(runs) != 0:
        mess += "%s 正在运行; " % ",".join(map(str, runs))
    if len(normal) > 0:
        mess += "删除成功：%s; " % ",".join(map(str, normal))
        mess += "operator uuid: %s ;" % uuid
    Logger.log_info(mess)
    if len(normal) > 0:
        updateKnw(uuid, normal[0])
    if obj_code == 200:
        return obj, 200
    solution = "请检查是否有删除权限或者图谱是否在运行中"
    return Gview.TErrorreturn(obj["Code"], obj["message"], solution, obj["Cause"], ""), obj_code


# 图谱编辑过程中的数据源列表
@graph_controller_app.route('/ds/<graphid>', methods=["GET"], strict_slashes=False)
def graphDsList(graphid):
    kgIds, propertyIds = [], []
    uuid = request.headers.get("uuid")
    if not graphid.isdigit():
        message = "The parameter graph id type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
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
    if permission_manage:
        # 调用manager接口获取数据源列表和属性
        res_message, res_code = managerutils.get_otlDsList(uuid=uuid, type=2)
        if res_code != 200:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        if len(res_message) != 0:
            for temp in res_message:
                if temp["propertyId"] == 1:
                    kgIds.append(temp["configId"])  # 可以看见的数据源id列表
                    propertyIds.append(1)

    # 该图谱拥有的数据源
    ret_code, obj = graph_Service.getDsByGraphid(graphid)
    if ret_code != 200:
        return Gview.BuFailVreturn(cause=obj["cause"], code=obj["code"],
                                   message=obj["message"]), CommonResponseStatus.SERVER_ERROR.value
    ids = obj.get("ids", [])
    for k in ids:
        if k not in kgIds:
            kgIds.append(k)
            propertyIds.append(4)

    # dsids = list(set(ids + kgIds))
    # propertyIds = [1] * len(dsids)
    dsids = kgIds

    if len(dsids) == 0:
        ret_message = {"res": {"count": 0, "df": []}}
        return json.dumps(ret_message), CommonResponseStatus.SUCCESS.value
    params_json["dsids"] = dsids
    params_json["propertyIds"] = propertyIds

    ret_code, ret_message = graph_Service.getDsAll(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


# 根据gns查找相关的图谱id和图谱名称
@graph_controller_open.route('/getgraphbygns', methods=["POST"], strict_slashes=False)
def get_graph_by_gns():
    kgIds = []
    host_url = getHostUrl()
    appid = request.headers.get("appid", None)
    if appid is None:
        res = {
            "ErrorCode": 400000, "Description": "appid error",
            "Solution": "Please check appid",
            "ErrorDetails": "missing appid", "ErrorLink": ""
        }
        return jsonify(res), 400
    # 两个默认参数
    arg_extract_model = "Anysharedocumentmodel"
    arg_data_source = "as7"
    try:
        # 根据appid获取uuid
        code, obj = graph_Service.get_uuid_by_appid(appid)
        if code != 0:
            res = {
                "ErrorCode": obj["code"], "Description": obj["message"], "Solution": obj["cause"],
                "ErrorDetails": "获取uuid错误", "ErrorLink": ""
            }
            return jsonify(res), 500
        uuid = obj.to_dict()["uuid"][0]

        # 获取参数
        param_code, params_json, param_message = commonutil.getMethodParam()
        # 获取参数错误
        if param_code != 0:
            res = {
                "ErrorCode": 400000, "Description": param_message,
                "Solution": "parameter error, please check the input parameters carefully",
                "ErrorDetails": "get parameter error", "ErrorLink": ""
            }
            return jsonify(res), 400
        # 参数校验
        ret_status, message = graphCheckParameters.getidbygns_params(params_json)
        if ret_status != 0:
            res = {
                "ErrorCode": 400000, "Description": "params error",
                "Solution": "Please check the input parameters carefully",
                "ErrorDetails": message, "ErrorLink": ""
            }
            return jsonify(res), 400
        arg_gns_list = params_json.get("gns")
        # 用户可见图谱id列表
        if permission_manage:
            ret, code = managerutils.get_otlDsList(uuid=uuid, type=3)
            if code != 200:
                res = {
                    "ErrorCode": ret["code"], "Description": ret["cause"], "Solution": "权限访问错误",
                    "ErrorDetails": ret["message"], "ErrorLink": ""
                }
                return jsonify(res), code
            # # 用户可见图谱列表为空
            # if len(ret) == 0:
            #     res = {"res": []}
            #     return jsonify(res), 200

            for temp in ret:
                if temp["propertyId"] <= 4:
                    kgIds.append(temp["configId"])  # 可以看见的图谱id列表
                    # propertyIds.append(1)
        # 所有图谱信息
        ret_code, ret_obj = graph_Service.getallgraph(host_url)
        if ret_code != 200:
            res = {
                "ErrorCode": 500000, "Description": ret_obj["cause"], "Solution": "",
                "ErrorDetails": ret_obj["message"], "ErrorLink": ""
            }
            return jsonify(res), ret_code
        graphs = ret_obj.get("res", {}).get("df", {})
        if len(graphs) == 0:
            res = {
                "ErrorCode": 500051, "Description": "graph list is empty",
                "Solution": "No graphs now, please create the graph first",
                "ErrorDetails": "graph list is empty", "ErrorLink": ""
            }
            return jsonify(res), 500

        results = {}
        for arg_gns in arg_gns_list:
            result = getgraph_onegns(arg_gns, graphs, kgIds, arg_extract_model, arg_data_source)
            if arg_gns not in results:
                results[arg_gns] = result
        res = {"res": results}
        return jsonify(res), 200
    except Exception as e:
        res = {
            "ErrorCode": 500000, "Description": "internal error", "Solution": "Please contact the administrator",
            "ErrorDetails": repr(e), "ErrorLink": ""
        }
        return jsonify(res), 500


# 根据图谱名称获取图谱配置信息
# todo: getgraphbyid函数名重复，后期需要修改
@graph_controller_open.route('/<graph_name>', methods=["GET"], strict_slashes=False)
def getgraphbyid(graph_name):
    uuid = request.headers.get("uuid")
    host_url = getHostUrl()
    if not isinstance(graph_name, str):
        message = "The parameter graph name type must be string!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    # graph_name是否存在
    code, ret = graph_Service.checkByName(graph_name)
    if code != 0:
        return jsonify(ret), 500
    graph_id = ret.to_dict('records')[0]['id']
    if permission_manage:
        res_message, res_code = managerutils.operate_permission(uuid=uuid, kg_id=[graph_id], type=3, action="update")
        if res_code != 200:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code

    ret_code, ret_message = graph_Service.getGraphById(graph_id, host_url)

    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@graph_controller_app.route("/adv-search-config/kglist-conf/<net_id>", methods=["GET"], strict_slashes=False)
def get_adv_search(net_id):
    # 在此处从头当中获取uuid值。这一步骤应该没有必要。builder项目当中未作处理。

    uuid = request.headers.get("uuid")
    if uuid == "":
        return Gview.BuFailVreturn(
            cause="uuid is not found",
            code=CommonResponseStatus.UUID_NOT_FOUND.value,
            message="uuid is not found",
        ), 500
    # 此处获取用户能见的所有图谱列表。
    res_message, res_code = managerutils.get_auth_kg_id_list(uuid)
    if res_code != 200:
        return Gview.BuFailVreturn(cause=res_message["cause"],
                                   code=res_message["code"],
                                   message=res_message["message"]), res_code

    # 如果长度不为零，查询所有的config_id，需要到数据当中做转换。
    config_ids = []
    for item in res_message:
        config_ids.append(item["configId"])

    # 此处兼容知识网络的功能。
    net_ids = knw_service.get_graph_by_knw_id_s(net_id)
    net_ids = list(net_ids.values())
    config_ids = list(set(config_ids) & set(net_ids))

    # 如果长度为零，代表用户没有可见的知识图谱。直接返回即可。
    if len(config_ids) == 0:
        return Gview.BuFailVreturn(cause="user has not useful knowledge graph in this knowledge",
                                   code=CommonResponseStatus.USER_HAS_NOT_VIEWABLE_GRAPH_IN_NET.value,
                                   message="please assign permission to the user"), 500

    # 此处不需要判断，如果为空，不会走到这一步。
    ids = graph_dao.get_IdByConfigId(config_ids)

    # 获取可以操作的id。查看manager获取可以操作的所有ids。
    operatorIds = []
    for id in ids:
        message, code = managerutils.operate_permission(uuid, [id], 3, "advanced_config", True)
        # 对于单独的id来说，如果返回成功，代表id可以被操作，也就是有权限
        if code == 200:
            operatorIds.append(id)

    # 获取到所有的有权限的id，对id进行相关字段拼接操作。然后返回。
    result = graph_Service.get_graph_conf_list(operatorIds)
    forReturen = {"res": result}
    return jsonify(forReturen), 200


@graph_controller_app.route("/output", methods=["POST"], strict_slashes=False)
def graph_config_output():
    uuid = request.headers.get("uuid", None)
    Logger.log_info(f"uuid:{uuid},type:{type(uuid)}")
    # 检测uuid是否存在于头部，
    if uuid == None:
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.checkuuid.uuidNotExists",
            "uuid is not found",
            "please use a useful uuid",
            "uuid is not found",
            "",
        ), 500
    # 上传默认用户，此用户不做权限校验
    config_id_map = {}
    if uuid != "6bee2cb5-da40-11ec-a482-ea21cd616bd0":
        manager_list, status = managerutils.get_otlDsList(uuid, 3)
        if status != 200:
            return Gview.TErrorreturn(
                "Builder.controller.graph_config.get_otlDsList.not_permission",
                "no permission or",
                "Please add edit permission to this user",
                "no permission",
                "",
            ), 500
        for row in manager_list:
            config_id_map[row['configId']] = row['propertyId']
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
        propertyId = config_id_map.get(int(config_id), None)
        if uuid != "6bee2cb5-da40-11ec-a482-ea21cd616bd0":
            if not propertyId or propertyId > 3:
                return Gview.TErrorreturn(
                    "Builder.controller.graph_config.get_otlDsList.not_permission",
                    "no permission",
                    "Please add edit permission to this user",
                    "no permission",
                    "",
                ), 500

    # 此处根据要导出的ids类型，导出图谱。
    file_path, file_name = graph_Service.graph_output(config_ids)
    return send_from_directory(file_path, file_name, as_attachment=True)


@graph_controller_app.route("/input", methods=["POST"], strict_slashes=False)
def graph_config_input():
    # 获取form表单当中的知识网络id和图谱id
    graph_id = request.form.get("graph_id")
    uuid = request.headers.get("uuid")
    method = request.form.get("method")
    knw_id = request.form.get("knw_id", None)
    # 检测uuid是否存在于头部，
    if uuid == None:
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.getuuid.uuidNotFound",
            "uuid is not found in header",
            "please put a uuid in header",
            "uuid is not found in header",
            "",
        ), 500
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
    # 接受传递的参数。标识文件。
    file_name = "{0}_input".format(uuid)
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
            file.save(secure_filename(file_name))
            ret, status = graph_Service.graph_input(uuid, knw_id, graph_id, file_name, method)
            if status != 200:
                return ret, 500
    except Exception as e:
        return Gview.TErrorreturn(
            "Builder.controller.graph_config.unexception.unexpect_error",
            "unexception error",
            "get more infomation in details",
            e.__str__(),
            "",
        ), 500

    return "True", 200

@graph_controller_open.route("/getidbydbname", methods=["POST"], strict_slashes=False)
def getidbydbname():
    """根据KDB_name返回id和KG_config_id
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
        dbname = data.iloc[i, 0]
        idinfo = {}
        idinfo['id'] = int(data.iloc[i, 1])  # id
        idinfo['kgconfid'] = int(data.iloc[i, 2])  # KG_config_id
        res[dbname] = idinfo
    return res, 200

def getgraph_onegns(arg_gns, graph_ids, kgids, arg_extract_model, arg_data_source):
    result = []
    for graph in graph_ids:
        graph_id = graph.get("id")
        if graph_id in kgids:
            graph_name = graph.get("graph_name")
            graph_InfoExts = graph.get("graph_InfoExt", [])
            for graph_InfoExt in eval(graph_InfoExts):
                extract_model = graph_InfoExt.get("extract_model", "")
                data_source = graph_InfoExt.get("data_source", "")
                if extract_model != arg_extract_model or data_source != arg_data_source:
                    continue
                gns = graph_InfoExt.get("file_source", "")
                if is_match(arg_gns, gns):
                    result.append({"id": graph_id, "name": graph_name})
                    break
    return result


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
    try:
        uuid = request.headers.get("uuid")
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
        code, data = graph_Service.get_graph_info_basic(graph_id, is_all, key, uuid)
        if code != codes.successCode:
            return data, 400
        return data, 200
    except Exception as e:
        code = codes.Builder_GraphController_GetGraphInfoBasic_UnknownError
        return Gview2.TErrorreturn(code,
                                   cause=str(e),
                                   description=str(e)), 400

@graph_controller_app.route('/info/onto', methods=["get"], strict_slashes=False)
def get_graph_info_onto():
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
def get_graph_info_count():
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
def get_graph_info_detail():
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

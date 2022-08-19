# -*-coding:utf-8-*-
# @Time    : 2020/8/12 15:57
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from config import config
from config.config import permission_manage
from service.Otl_Open_Service import otlOpenSerivice
from service.Otl_Service import otl_service
from third_party_service.managerUtils import managerutils
from utils.ontology_check_params import otl_check_params
import datetime
from flask import Blueprint, request, jsonify
from utils.CommonUtil import commonutil
from utils.log_info import Logger
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from dao.otl_dao import otl_dao
import requests
import json
from utils.celery_check_params_json import celery_check_params
import re

ontology_controller_app = Blueprint('ontology_controller_app', __name__)
ontology_controller_open = Blueprint('ontology_controller_open', __name__)


#######查询所有本体#############
# @ontology_controller_app.route('/', methods=["get"])
# def onto2():
#
#
#     return id
#
# ########根据本体名查询本体#########
# @ontology_controller_app.route('/', methods=["get"])
#
#
#
# ###### 查询所有数据源名############（数据源管理已经存在4.3）问题：如何显示get_all分页显示，与原相同
# @ontology_controller_app.route('/', methods=["get"])

########mysql、hive根据数据源返回数据表#######
@ontology_controller_app.route('/gettabbydsn', methods=["GET"])
def get_table():
    # params_json = request.get_data()
    # params_json = json.loads(params_json)
    # host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        print(params_json)
        paramscode, message = otl_check_params.valid_params_check("get_table", params_json)
        if paramscode != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        # 权限
        flag = True
        if permission_manage:
            uuid = request.headers.get("uuid")
            dsid = int(params_json["ds_id"])
            # 调用manager接口获取数据源列表和属性
            res_message, res_code = managerutils.get_otlDsList(uuid=uuid, type=2)
            if res_code != 200:
                return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                           message=res_message["message"]), res_code
            kgIds = []
            for temp in res_message:
                if temp["propertyId"] == 1:
                    kgIds.append(temp["configId"])

            if dsid not in kgIds:
                flag = False

        if not flag:
            return Gview.BuFailVreturn(cause="无权进行此操作！", code=CommonResponseStatus.PERMISSION_ERROR.value,
                                       message="权限不足"), CommonResponseStatus.PERMISSION_DENIED.value

        ret_code, ret_message = otl_service.showtables(params_json)  ###########显示数据表####################
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            if ret_message["code"] == CommonResponseStatus.PARAMETERS_ERROR.value:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.BAD_REQUEST.value

            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


###################按需返回##############
@ontology_controller_app.route('/dirlist', methods=["GET"])  ###docid\tockendid
def filter_by_postfix():
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:

        paramscode, message = otl_check_params.valid_params_check("show_by_postfix", params_json)
        if paramscode != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = otl_service.show_by_postfix(params_json)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value

        print(ret_message)
        return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


# @ontology_controller_app.route('/flatfile', methods=["post"])###docid\tockendid
# def flat_file():
#     params_json = request.get_data()
#     params_json = json.loads(params_json)
#     paramscode, message = otl_check_params.valid_params_check("flatfile", params_json)
#     if paramscode != 0:
#         Logger.log_error("parameters:%s invalid" % params_json)
#         return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
#                                    message=message), CommonResponseStatus.BAD_REQUEST.value
#     ret_code, ret_message = otl_service.flatfile(params_json)
#     if ret_code == CommonResponseStatus.SERVER_ERROR.value:
#         return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
#                                    message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
#
#     print(ret_message)
#     return ret_message, CommonResponseStatus.SUCCESS.value


#########预览#############

##########本体预览#########
# @ontology_controller_app.route('/previewonto', methods=["get"])
# def ontology_preview():
#     params_json = request.args.to_dict()
#     ret_code, ret_message = otl_service.preview_ontology(params_json)
#     paramscode, message = otl_check_params.valid_params_check("preview_ontology", params_json)
#     if paramscode != 0:
#         Logger.log_error("parameters:%s invalid" % params_json)
#         return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
#                                    message=message), CommonResponseStatus.BAD_REQUEST.value
#     if ret_code == CommonResponseStatus.SERVER_ERROR.value:
#         return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
#                                    message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
#     return ret_message, CommonResponseStatus.SUCCESS.value
# ##########源数据预览#########
@ontology_controller_app.route('/previewdata', methods=["GET"])
def data_preview():
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        paramscode, message = otl_check_params.valid_params_check("preview_data", params_json)
        if paramscode != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = otl_service.preview_data(params_json)

        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            if ret_message["code"] == CommonResponseStatus.PARAMETERS_ERROR.value:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.BAD_REQUEST.value
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        print("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")

        print("*****************************")
        return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


##########调用算法 返回本体###############
@ontology_controller_app.route('/auto/autogenschema', methods=["post"])
def predict_ontology():
    params_json = request.get_data()
    params_json = json.loads(params_json)
    paramscode, message = otl_check_params.valid_params_check("predict_ontology", params_json)
    if paramscode != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = otl_service.predict_ontology(params_json)
    print(ret_code)
    print(ret_message)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        if ret_message["code"] == CommonResponseStatus.PARAMETERS_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.BAD_REQUEST.value
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


###########《保存》存入数据库#########################
# @ontology_controller_app.route('/saveontology', methods=["post","get"])
# def save_ontology():
#     # method = request.method
#     # if  method=="GET":
#     ret_code, ret_message = otl_service.ontology_save_fist()
#     if ret_code == CommonResponseStatus.SERVER_ERROR.value:
#         return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
#                                    message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
#     return ret_message, CommonResponseStatus.SUCCESS.value
#     # elif method=="POST":
#     #     params_json = request.get_data()
#     #     params_json = json.loads(params_json)
#     #
#     #     paramscode, message = otl_check_params.valid_params_check("ontology_save", params_json)
#     #     if paramscode==0:
#     #         logiccode,logicmessage=otl_check_params.entity_relation_check(params_json)
#     #         if logiccode != 0:
#     #             Logger.log_error("parameters:%s invalid" % params_json)
#     #             return Gview.BuFailVreturn(cause=logicmessage, code=CommonResponseStatus.PARAMETERS_ERROR.value,
#     #                                        message=logicmessage), CommonResponseStatus.BAD_REQUEST.value
#     #     else:
#     #         Logger.log_error("parameters:%s invalid" % params_json)
#     #         return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
#     #                                    message=message), CommonResponseStatus.BAD_REQUEST.value
#     #     ret_code, ret_message = otl_service.ontology_save(params_json)
#     #     if ret_code == CommonResponseStatus.SERVER_ERROR.value:
#     #         return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
#     #                                    message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
#     #     return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value
###########《保存》存入数据库#########################
# 新建本体
@ontology_controller_app.route('/saveontology', methods=["post"])
def save_ontology():
    uuid = request.headers.get("uuid")
    params_json = request.get_data()
    params_json = json.loads(params_json)
    ret_code, ret_message, onto_id = otl_service.ontology_save(params_json)
    if onto_id == -1:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value

    if permission_manage:
        # 增加资源
        res_message, res_code = managerutils.add_resource(kg_id=onto_id, type=1, uuid=uuid)
        if res_code != 200:
            # 删除新增的资源记录
            otl_dao.delete([onto_id])
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code

        # 调用manager接口增加默认权限
        res_message, res_code = managerutils.add_permission(kg_id=onto_id, type=1, uuid=uuid)
        if res_code != 200:
            otl_dao.delete([onto_id])
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
    return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/modellist', methods=["get"])
def get_model_list():
    ret_code, ret_message = otl_service.get_model_list()
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/modelspo', methods=["get"])
def get_model_spo():
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        paramscode, message = otl_check_params.valid_params_check("modelspo", params_json)
        if paramscode != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = otl_service.get_model_spo(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/getmodelotl', methods=["post"])
def get_model_otl():
    params_json = request.get_data()
    params_json = json.loads(params_json)
    paramscode, message = otl_check_params.valid_params_check("getmodelotl", params_json)
    if paramscode != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = otl_service.getmodelotl(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        if ret_message["code"] == CommonResponseStatus.PARAMETERS_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.BAD_REQUEST.value
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


# lzg add
@ontology_controller_app.route('/getotl', methods=["get"])
def getall():
    method = request.method
    uuid = request.headers.get("uuid")
    # 根据不同的请求方式请求方式获得参数并获取异常
    param_code, params_json, param_message = commonutil.getMethodParam()
    print(params_json, param_code)
    if param_code == 0:
        # 获取该用户可以看见的本体列表
        if method == "GET":
            host_url = getHostUrl()
            check_res, message = otl_check_params.getAllParOnto(params_json)
            if check_res != 0:
                Logger.log_error("parameters:%s invalid" % params_json)
                return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                           message=message), CommonResponseStatus.BAD_REQUEST.value

            if permission_manage:
                # 调用manager接口获取数据源列表和属性
                res_message, res_code = managerutils.get_otlDsList(uuid=uuid, type=1)
                if res_code != 200:
                    return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                               message=res_message["message"]), res_code
                params_json["res_list"] = res_message
                if len(res_message) == 0:
                    ret_message = {"res": {"count": 0, "df": []}}
                    return json.dumps(ret_message), CommonResponseStatus.SUCCESS.value

            ret_code, ret_message = otl_service.getall(params_json, host_url)
            if ret_code == CommonResponseStatus.SERVER_ERROR.value:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=param_message), CommonResponseStatus.BAD_REQUEST.value


@ontology_controller_app.route('/delotlbyids', methods=["DELETE"], strict_slashes=False)
def delotl():
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    ret_code, ret_message = otl_service.delete(params_json, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


# 模糊查询
@ontology_controller_app.route('/searchbyname', methods=["get"], strict_slashes=False)
def getotlbyname():
    host_url = getHostUrl()
    uuid = request.headers.get("uuid")
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = otl_check_params.otlgetbynamePar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value

        # 调用manager接口获取数据源列表和属性
        if permission_manage:
            # 调用manager接口获取数据源列表和属性
            res_message, res_code = managerutils.get_otlDsList(uuid=uuid, type=1)
            if res_code != 200:
                return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                           message=res_message["message"]), res_code
            params_json["res_list"] = res_message
            if len(res_message) == 0:
                ret_message = {"res": {"count": 0, "df": []}}
                return json.dumps(ret_message), CommonResponseStatus.SUCCESS.value

        ret_code, ret_message = otl_service.getbyotlname("", params_json, host_url, -1)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return ret_message, CommonResponseStatus.SUCCESS.value

    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@ontology_controller_app.route('updatename/<otlid>', methods=["put"], strict_slashes=False)
def updateotlname(otlid):
    host_url = getHostUrl()
    uuid = request.headers.get("uuid")
    param_code, params_json, param_message = commonutil.getMethodParam()
    if not otlid.isdigit():
        message = "The parameter otlid type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if param_code == 0:
        # 待做 新增参数校验
        check_res, message = otl_check_params.valid_params_check("update_otl_name", params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        params_json["ontology_id"] = str(otlid)
        # logiccode, logicmessage = otl_check_params.entity_relation_check(params_json)
        # if logiccode != 0:
        #     Logger.log_error("parameters:%s invalid" % params_json)
        #     return Gview.BuFailVreturn(cause=logicmessage, code=CommonResponseStatus.PARAMETERS_ERROR.value,
        #                                message=logicmessage), CommonResponseStatus.BAD_REQUEST.value
        if permission_manage:
            # 修改权限
            res_message, res_code = managerutils.operate_permission(uuid=uuid, kg_id=[otlid], type=1, action="update")
            if res_code != 200:
                return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                           message=res_message["message"]), CommonResponseStatus.SERVER_ERROR.value

        ret_code, ret_message = otl_service.update_name(otlid, params_json, host_url, "-1")
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value

    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@ontology_controller_app.route('updateinfo/<otlid>', methods=["put"], strict_slashes=False)
def updateotlinfo(otlid):
    host_url = getHostUrl()
    uuid = request.headers.get("uuid")
    param_code, params_json, param_message = commonutil.getMethodParam()
    if not otlid.isdigit():
        message = "The parameter otlid type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if param_code == 0:
        # 待做 新增参数校验
        check_res, message = otl_check_params.valid_params_check("update_otl_info", params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        params_json["ontology_id"] = str(otlid)
        logiccode, logicmessage = otl_check_params.entity_relation_check(params_json)
        if logiccode != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=logicmessage, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=logicmessage), CommonResponseStatus.BAD_REQUEST.value
        if permission_manage:
            # 修改权限
            res_message, res_code = managerutils.operate_permission(uuid=uuid, kg_id=[otlid], type=1, action="update")
            if res_code != 200:
                return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                           message=res_message["message"]), res_code
        ret_code, ret_message = otl_service.update_info(otlid, params_json, host_url, "-1")
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value

    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@ontology_controller_app.route('/<otlid>', methods=["get"], strict_slashes=False)
def ds(otlid):
    print("*******************************")
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    if not otlid.isdigit():
        message = "The parameter otlid type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if param_code == 0:
        if request.method == "GET":
            # get 不需要参数校验
            ret_code, ret_message = otl_service.getbyotlname(otlid, params_json, host_url, 1)
            if ret_code == CommonResponseStatus.SERVER_ERROR.value:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            return ret_message, CommonResponseStatus.SUCCESS.value
        #  # 弃用
        # elif request.method == "PUT":
        #     # 修改的参数校验和新增的一样
        #     check_res, message = otl_check_params.otlUpdatePar(params_json)
        #     if check_res != 0:
        #         Logger.log_error("parameters:%s invalid" % params_json)
        #         return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
        #                                    message=message), CommonResponseStatus.BAD_REQUEST.value
        #
        #     ret_code, ret_message = otl_service.update(otlid, params_json, host_url)
        #     if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        #         return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
        #                                    message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        #     return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/getbykgid/<kgid>', methods=["get"], strict_slashes=False)
def getotlbykgid(kgid):
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    if not kgid.isdigit():
        return Gview.TErrorreturn(
            ErrorCode='Builder.controller.ontology.getKGid.KGidWrongFormat',
            Description='The parameter kgid type must be int!',
            ErrorDetails='The parameter kgid type must be int!',
            Solution='please check your KGid',
            ErrorLink=''
        ), 400
    if param_code == 0:
        # 根据kgid查询本体id
        code, obj = otl_service.getOtlIdbyKGId(kgid)
        if code != CommonResponseStatus.SUCCESS.value:
            return obj, code
        otlid = obj
        # 根据本体id返回本体信息
        ret_code, ret_message = otl_service.getbyotlname(otlid, params_json, host_url, 1)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            return ret_message, ret_code
        # 过滤本体中不在图数据库中的点或边
        ret_code, ret_message = otl_service.filterotl(kgid, ret_message)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            return ret_message, ret_code
        return ret_message, CommonResponseStatus.SUCCESS.value


# 根据本体名称获取本体信息
@ontology_controller_app.route('/getotlbyname', methods=["get"], strict_slashes=False)
def getotlbyotlname():
    uuid = request.headers.get("uuid")
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    otlname = params_json.get("name")
    message = ""
    ret_status = 0
    if not isinstance(otlname, str):
        message += "name must be  str ; "
        ret_status = -1
    else:
        if len(otlname) > 100 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', otlname):
            message += "name must < 100 ; and it is must be consisted of letter ,number and underline ; "

            ret_status = -1
        if not otlname == ''.join(otlname.split()) or otlname == "":  # 所有参数值 校验是否包含空格或为空
            ret_status = -1
    if ret_status == -1:
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if param_code != 0:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value

    # 当前本体的id
    ret, code = otl_service.getOtlId(otlname)
    if code != 200:
        return Gview.BuFailVreturn(cause=ret["cause"], code=ret["code"],
                                   message=ret["message"]), code
    # 本体名称不存在
    if ret == -1:
        return Gview.BuFailVreturn(cause="Ontology name does not exist",
                                   code=CommonResponseStatus.REQUEST_ERROR.value,
                                   message="Ontology name does not exist"), CommonResponseStatus.SERVER_ERROR.value
    otlid = ret
    # 增加权限：查看当前查看的本体是否在该用户的可见列表中
    if permission_manage:
        # 调用manager接口获取数据源列表和属性
        res_message, res_code = managerutils.get_otlDsList(uuid=uuid, type=1)
        if res_code != 200:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        otlIds = []
        for temp in res_message:
            otlIds.append(temp["configId"])
        if otlid not in otlIds:
            return Gview.BuFailVreturn(cause="No permission to view the ontology data",
                                       code=CommonResponseStatus.PERMISSION_ERROR.value,
                                       message="permission error"), CommonResponseStatus.SERVER_ERROR.value

    ret_code, ret_message = otl_service.getotlbyname(otlname, params_json, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    # 过滤本体绑定的数据
    if permission_manage:
        uuid = request.headers.get("uuid")
        OwnerIds = []
        # 当前用户所有者身份的数据源
        res_message, res_code = managerutils.get_otlDsList(uuid=uuid, type=2)
        if res_code != 200:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        for temp in res_message:
            if temp["propertyId"] == 1:
                OwnerIds.append(temp["configId"])

        ret_message = BindingDataSourceFiltering(ret_message, OwnerIds)
    return ret_message, CommonResponseStatus.SUCCESS.value


####lj add
@ontology_controller_app.route('/task/build_task', methods=["POST"], strict_slashes=False)
def builde_onto_task():
    params_json = request.get_data()
    params_json = json.loads(params_json)
    #####验证改
    paramscode, message = celery_check_params.valid_params_check("builde_onto_task", params_json)
    if paramscode != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    # params_json={"otl_id":5,"state":4,"file_list":[],"postfix":"csv","ds_id":7,"extract_type":"labelextraction","step":"Otl"}

    url = "http://localhost:6488/onto/buildertask"
    payload = params_json
    headers = {
        'Content-Type': 'application/json',
        'uuid': request.headers.get("uuid")
    }
    response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
    # return make_response(jsonify(result=response.text))
    res_json = response.json()
    code = res_json["code"]
    if code != 200:
        ret_message = res_json["res"]
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    else:
        res_json_return = {}
        res_json_return["res"] = res_json["res"]
        return res_json_return, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/task/gettaskinfo', methods=["POST"], strict_slashes=False)
def gettaskinfo():
    params_json = request.get_data()
    params_json = json.loads(params_json)
    #####验证改
    paramscode, message = celery_check_params.valid_params_check("gettaskinfo", params_json)
    if paramscode != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    url = "http://localhost:6488/onto/getalltask"
    payload = params_json
    headers = {
        'Content-Type': 'application/json',
        'uuid': request.headers.get("uuid"),
    }
    response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
    # return make_response(jsonify(result=response.text))
    res_json = response.json()
    code = res_json["code"]
    if code != 200:
        ret_message = res_json["res"]
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    else:
        res_json_return = {}
        res_json_return["res"] = res_json["res"]
        return res_json_return, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/task/deletetask', methods=["POST"], strict_slashes=False)
def deletetask():
    params_json = request.get_data()
    params_json = json.loads(params_json)
    #####验证改
    paramscode, message = celery_check_params.valid_params_check("deletetask", params_json)
    if paramscode != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    url = "http://localhost:6488/onto/delete_task"
    payload = params_json
    # url=url+'?'+"task_id="+task_id
    headers = {
        'Content-Type': 'application/json',
        'uuid': request.headers.get("uuid")
    }
    response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
    # return make_response(jsonify(result=response.text))
    res_json = response.json()
    code = res_json["code"]
    if code != 200:
        ret_message = res_json["res"]
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    else:
        res_json_return = {}
        res_json_return["res"] = res_json["res"]
        return res_json_return, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/task/get_task_files', methods=["GET"], strict_slashes=False)
def get_task_files():
    params_json = request.args.to_dict()
    #####验证改
    paramscode, message = celery_check_params.valid_params_check("get_task_files", params_json)
    if paramscode != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    task_id = params_json["task_id"]
    page = params_json["page"]
    size = params_json["size"]
    url = "http://localhost:6488/onto/getfilestatus"
    url = url + '?' + "task_id=" + task_id + '&'
    url = url + "page=" + page + '&'
    url = url + "size=" + size
    headers = {
        'Content-Type': 'application/json',
        'uuid': request.headers.get("uuid")
    }
    response = requests.request("GET", url, headers=headers)
    res_json = response.json()
    code = res_json["code"]
    if code != 200:
        ret_message = res_json["res"]
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    else:
        res_json_return = {}
        res_json_return["res"] = res_json["res"]
        return res_json_return, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/task/deletealltask', methods=["DELETE"], strict_slashes=False)
def deletealltask():
    params_json = request.args.to_dict()
    paramscode, message = celery_check_params.valid_params_check("deletealltask", params_json)
    if paramscode != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    ontology_id = params_json["ontology_id"]
    # state = params_json["state"]
    url = "http://localhost:6488/onto/deletealltask"
    url = url + '?' + "ontology_id=%s" % (ontology_id)
    headers = {
        'Content-Type': 'application/json',
        'uuid': request.headers.get("uuid")
    }
    response = requests.request("DELETE", url, headers=headers)
    # return make_response(jsonify(result=response.text))
    res_json = response.json()
    code = res_json["code"]
    if code != 200:
        ret_message = res_json["res"]
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    else:
        res_json_return = {}
        res_json_return["res"] = res_json["res"]
        return res_json_return, CommonResponseStatus.SUCCESS.value


# # 健康检查 /api/builder/v1/onto/task/health/ready
# @ontology_controller_app.route('/task/health/ready', methods=["GET"], strict_slashes=False)
# def health():
#     url = "http://localhost:6488/onto/health/ready"
#     payload = {}
#     headers = {}
#     response = requests.request("GET", url, headers=headers, data=payload)
#     res_json = response.json()
#     code = res_json["code"]
#     ret_message = res_json["res"]
#     if code == 200:
#         return "success", CommonResponseStatus.SUCCESS.value
#     Logger.log_error(json.dumps(res_json))
#     return Gview.BuFailVreturn(cause="success", code=50000,
#                                message="success"), CommonResponseStatus.SERVER_ERROR.value
#
# @ontology_controller_app.route('/task/health/alive', methods=["GET"], strict_slashes=False)
# def healthalive():
#     url = "http://localhost:6488/onto/health/alive"
#     payload = {}
#     headers = {}
#     response = requests.request("GET", url, headers=headers, data=payload)
#     res_json = response.json()
#     code = res_json["code"]
#     ret_message = res_json["res"]
#     if code == 200:
#         return "success", CommonResponseStatus.SUCCESS.value
#     Logger.log_error(json.dumps(res_json))
#     return Gview.BuFailVreturn(cause="success", code=50000,
#                                message="success"), CommonResponseStatus.SERVER_ERROR.value

# @ontology_controller_app.route('/copy', methods=["POST"], strict_slashes=False)
# def copy_otl():
#     params_json = request.get_data()
#     params_json = json.loads(params_json)
#     #####验证改
#     paramscode, message = celery_check_params.valid_params_check("copy_otl", params_json)
#     if paramscode != 0:
#         Logger.log_error("parameters:%s invalid" % params_json)
#         return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
#                                    message=message), CommonResponseStatus.BAD_REQUEST.value
#     ret_code, ret_message = otl_service.copy_otl(params_json)
#     if ret_code == CommonResponseStatus.SERVER_ERROR.value:
#         return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
#                                    message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
#     return ret_message, CommonResponseStatus.SUCCESS.value

# 本体复制
@ontology_controller_app.route('/copy/<otlid>', methods=["POST"], strict_slashes=False)
def copy_otl(otlid):
    uuid = request.headers.get("uuid")
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code != 0:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value
    paramscode, message = otl_check_params.valid_params_check("ontology_save", params_json)
    if paramscode != 0:
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value

    if not otlid.isdigit():
        message = "otlid  must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    # 检查otlid是否存在
    ret_obj, ret_code = otl_service.getAllOtlIds()
    if ret_code != 200:
        return Gview.BuFailVreturn(cause=ret_obj["cause"], code=ret_obj["code"],
                                   message=ret_obj["message"]), ret_code
    otlids = ret_obj
    print("otlid: ", otlid)
    print("otlids: ", otlids)
    if int(otlid) not in otlids:
        return Gview.BuFailVreturn(cause="otlid does not exist", code=CommonResponseStatus.REQUEST_ERROR.value,
                                   message="otlid does not exist"), CommonResponseStatus.SERVER_ERROR.value

    # 预测状态、待编辑状态的本体不可以复制
    otlStatus, code = otl_service.getOtlStatus(otlid)
    if code != 200:
        return Gview.BuFailVreturn(cause=otlStatus["cause"], code=otlStatus["code"],
                                   message=otlStatus["message"]), code
    if otlStatus != "available":
        return Gview.BuFailVreturn(cause="Ontology in unavailable state cannot be copied",
                                   code=CommonResponseStatus.REQUEST_ERROR.value,
                                   message="Ontology in unavailable state cannot be copied"), CommonResponseStatus.SERVER_ERROR.value
    if permission_manage:
        # 复制权限
        res_message, res_code = managerutils.operate_permission(uuid=uuid, kg_id=[otlid], type=1, action="copy")
        if res_code != 200:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        # 获取被复制本体的数据
        ret_code, ret_message = otl_service.getbyotlname(otlid, {}, host_url, 1)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        # 过滤本体绑定的数据源
        OwnerIds = []
        # 当前用户所有者身份的数据源
        res_message, res_code = managerutils.get_otlDsList(uuid=uuid, type=2)
        if res_code != 200:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        for temp in res_message:
            if temp["propertyId"] == 1:
                OwnerIds.append(temp["configId"])
        ret_message = BindingDataSourceFiltering(ret_message, OwnerIds)
    else:
        # 获取被复制本体的数据
        ret_code, ret_message = otl_service.getbyotlname(otlid, {}, host_url, 1)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    # 数据库插入数据
    ret_code, ret_mess, onto_id = otl_service.saveCopyOtl(ret_message["res"].get("df")[0], params_json)
    if onto_id == -1:
        return Gview.BuFailVreturn(cause=ret_mess["cause"], code=ret_mess["code"],
                                   message=ret_mess["message"]), CommonResponseStatus.SERVER_ERROR.value
    # if ret_code == CommonResponseStatus.SERVER_ERROR.value:
    #     return Gview.BuFailVreturn(cause=ret_mess["cause"], code=ret_mess["code"],
    #                                message=ret_mess["message"]), CommonResponseStatus.SERVER_ERROR.value
    if permission_manage:
        # 增加资源
        res_message, res_code = managerutils.add_resource(kg_id=onto_id, type=1, uuid=uuid)
        if res_code != 200:
            # 删除新增的资源记录
            otl_dao.delete([onto_id])
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code

        # 调用manager接口增加默认权限
        res_message, res_code = managerutils.add_permission(kg_id=onto_id, type=1, uuid=uuid)
        if res_code != 200:
            otl_dao.delete([onto_id])
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code

    return {"res": {"ontology_id": onto_id}}, CommonResponseStatus.SUCCESS.value


# 本体入口，一键导入时数据源列表
@ontology_controller_app.route('/ds', methods=["get"], strict_slashes=False)
def graphDsList():
    kgIds = []
    obj = {}
    uuid = request.headers.get("uuid")
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
        if len(kgIds) == 0:
            obj = {"res": {"count": 0, "df": []}}
            return json.dumps(obj), CommonResponseStatus.SUCCESS.value
    ret_code, ret_message = otl_service.getds(kgIds)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value

    return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_open.route('/updateotlschema', methods=["POST"], strict_slashes=False)
def updateotlschema():
    param_code, params_json, param_message = commonutil.getMethodParam()
    graph_id = params_json.get("graph_id", None)
    if graph_id is None:
        obj = {}
        message = "parameter graph_id cannot be empty!"
        obj["ErrorCode"] = str(CommonResponseStatus.PARAMETERS_ERROR.value)
        obj["Description"] = message
        obj["Solution"] = "assign values to parameter graph_id.."
        obj["ErrorDetails"] = message
        obj["ErrorLink"] = ""
        return Gview.VErrorreturn(obj), CommonResponseStatus.BAD_REQUEST.value
    if type(graph_id).__name__ != "int":
        obj = {}
        message = "The parameter graph_id type must be int!"
        obj["ErrorCode"] = str(CommonResponseStatus.PARAMETERS_ERROR.value)
        obj["Description"] = message
        obj["Solution"] = "Enter graph_id of type int."
        obj["ErrorDetails"] = message
        obj["ErrorLink"] = ""
        return Gview.VErrorreturn(obj), CommonResponseStatus.BAD_REQUEST.value
    if param_code == 0:
        # 步骤2 参数图谱id是否存在; 图谱配置中本体是否存在，图谱状态是否运行中, 图谱数据库不存在,图谱不可用 ，并获得一些需要的信息
        ret_code, ret_message, df = otlOpenSerivice.getGraphById(graph_id)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            Logger.log_error(json.dumps(ret_message))
            return Gview.VErrorreturn(ret_message), CommonResponseStatus.SERVER_ERROR.value
        ret_code, obj = otlOpenSerivice.updateotlschema(params_json, df, graph_id)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            Logger.log_error(json.dumps(ret_message))
            return Gview.VErrorreturn(obj), ret_code
        return jsonify(obj), CommonResponseStatus.SUCCESS.value


# 本体绑定数据源过滤
def BindingDataSourceFiltering(res, OwnerIds):
    """
    parms：
        res: 查询得到的本体数据{ "res": {"count": 1, "df" : []}}
        OwnerIds: 当前用户具有拥有者身份的数据源
    return：
        过滤掉本体数据中权限不足的绑定数据源(点和边都有可能绑定数据，均需过滤)
    """
    otls = res.get("res", {})
    df = otls.get("df", [])
    if len(df) > 0:
        for i in range(len(df)):
            # 点
            entitys = df[i].get("entity", [])
            for j in range(len(entitys)):
                ds_id = entitys[j].get("ds_id", 0)
                OwnerIds = list(map(str, OwnerIds))
                if ds_id not in OwnerIds:
                    res["res"]["df"][i]["entity"][j]["source_table"] = []
                    res["res"]["df"][i]["entity"][j]["source_type"] = "manual"
                    res["res"]["df"][i]["entity"][j]["dataType"] = ""
                    res["res"]["df"][i]["entity"][j]["data_source"] = ""
                    res["res"]["df"][i]["entity"][j]["ds_address"] = ""
                    res["res"]["df"][i]["entity"][j]["ds_id"] = ""
                    res["res"]["df"][i]["entity"][j]["ds_name"] = ""
                    res["res"]["df"][i]["entity"][j]["ds_path"] = ""
                    res["res"]["df"][i]["entity"][j]["extract_type"] = ""
                    res["res"]["df"][i]["entity"][j]["file_type"] = ""
                    res["res"]["df"][i]["entity"][j]["model"] = ""
                    res["res"]["df"][i]["entity"][j]["task_id"] = ""
            # 边
            edges = df[i].get("edge", [])
            for k in range(len(edges)):
                ds_id = edges[k].get("ds_id", 0)
                if ds_id not in OwnerIds:
                    res["res"]["df"][i]["edge"][k]["source_table"] = []
                    res["res"]["df"][i]["edge"][k]["source_type"] = "manual"
                    res["res"]["df"][i]["edge"][k]["dataType"] = ""
                    res["res"]["df"][i]["edge"][k]["data_source"] = ""
                    res["res"]["df"][i]["edge"][k]["ds_address"] = ""
                    res["res"]["df"][i]["edge"][k]["ds_id"] = ""
                    res["res"]["df"][i]["edge"][k]["ds_name"] = ""
                    res["res"]["df"][i]["edge"][k]["ds_path"] = ""
                    res["res"]["df"][i]["edge"][k]["extract_type"] = ""
                    res["res"]["df"][i]["edge"][k]["file_type"] = ""
                    res["res"]["df"][i]["edge"][k]["model"] = ""
                    res["res"]["df"][i]["edge"][k]["task_id"] = ""
    return res


def getHostUrl():
    hostUrl = request.host_url
    return hostUrl

# -*-coding:utf-8-*-
# @Time    : 2020/8/10 17:53
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import requests
import pandas as pd
from flask import Blueprint, request, g,current_app,session,Response,jsonify

from config import config
from config.config import permission_manage
from dao.dsm_dao import dsm_dao

from dao.graph_dao import graph_dao
from dao.otl_dao import otl_dao
from third_party_service.anyshare.token import asToken
from third_party_service.managerUtils import managerutils

from utils.check_parameters import CheckParameters
from utils.ds_check_parameters import dsCheckParameters
import os
import sys
from utils.log_info import Logger
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from functools import wraps
from service.dsm_Service import dsm_service
import json
from utils.CommonUtil import commonutil
dsm_controller_app = Blueprint('dsm_controller_app', __name__)
@dsm_controller_app.route('/Auth', methods=["GET"], strict_slashes=False)
def auth():
    """AS7数据源 授权"""
    param_code, params_json, param_message = commonutil.getMethodParam()
    print(params_json)
    if param_code == 0:
        check_res, message = dsCheckParameters.Authcheck(params_json)####增加校验
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        ds_address = params_json["ds_address"]
        if "https://" not in ds_address:
            ds_address = "https://" + str(ds_address)
        params_json["ds_address"] = ds_address
        ret_code, ret_message = dsm_service.Oauth_2(params_json)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value

@dsm_controller_app.route('/gettoken', methods=["POST"], strict_slashes=False)
def gettoken():
    """将AS7的授权信息写入数据库"""
    params_json = request.get_data()
    params_json = json.loads(params_json)
    paramscode, message = dsCheckParameters.gettokencheck(params_json)####增加校验
    if paramscode != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = dsm_service.insert_refresh_token(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:

        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value

@dsm_controller_app.route('/testauth', methods=["POST"], strict_slashes=False)
def testauth():
    """未使用"""
    params_json = request.get_data()
    params_json = json.loads(params_json)
    paramscode, message = dsCheckParameters.verifycheck(params_json)####增加校验
    if paramscode != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    print(params_json)
    ret_code, ret_message = dsm_service.verify(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/testconnect', methods=["post"], strict_slashes=False)
def connectTest():
    """测试连接"""
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = dsCheckParameters.testConPar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        # 权限
        uuid = request.headers.get("uuid")
        ds_id = params_json.get("ds_id")
        # ds_id=0: 新建； ds_id=-1: 复制, ds_id > 0： 正常测试连接。新建和复制时默认有测试连接权限
        # 测试连接权限
        if ds_id > 0 and permission_manage:
            res_message, res_code = managerutils.operate_permission(uuid=uuid, kg_id=[ds_id], type=2, action="test_connect")
            if res_code != 200:
                return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                           message=res_message["message"]), CommonResponseStatus.SERVER_ERROR.value

        ret_code, ret_message = dsm_service.connectTest(params_json, host_url)

        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        if ret_code == CommonResponseStatus.BAD_REQUEST.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.BAD_REQUEST.value
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value

    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@dsm_controller_app.route('', methods=["get", "post"], strict_slashes=False)
def dsopt():
    """
    get: 获取所有数据源
    post: 新增数据源
    """
    method = request.method
    # 根据不同的请求方式请求方式获得参数并获取异常
    param_code, params_json, param_message = commonutil.getMethodParam()
    uuid = request.headers.get("uuid")
    # uuid = "853ba1db-4e37-11eb-a57d-0242ac190002"
    # get all,查询该用户可以看见的的数据源
    kgIds, propertyIds = [], []
    if method == "GET":
        host_url = getHostUrl()
        check_res, message = dsCheckParameters.getAllPar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.dsopt.ParametersError",
                                      Description=message, Solution=message, ErrorDetails=message,
                                      ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value
        if permission_manage:
            # 调用manager接口获取数据源列表和属性
            res_message, res_code = managerutils.get_otlDsList(uuid=uuid, type=2)
            if res_code != 200:
                return Gview.TErrorreturn(ErrorCode=res_message["code"], Description=res_message["cause"],
                                          Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                          ErrorLink=""), res_code
            if len(res_message) == 0:
                ret_message = {"res": {"count": 0, "df": []}}
                return json.dumps(ret_message), CommonResponseStatus.SUCCESS.value

            for temp in res_message:
                kgIds.append(temp["configId"])  # 可以看见的数据源id列表
                propertyIds.append(temp["propertyId"])
            params_json["kgIds"] = kgIds
            params_json["propertyIds"] = propertyIds

        ret_code, ret_message = dsm_service.getall(params_json, host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.TErrorreturn(ErrorCode=ret_message["code"], Description=ret_message["cause"],
                                      Solution=ret_message["cause"], ErrorDetails=ret_message["message"],
                                      ErrorLink=""), CommonResponseStatus.SERVER_ERROR.value
        return ret_message, CommonResponseStatus.SUCCESS.value
    # add, 新建数据源
    elif method == "POST":
        host_url = getHostUrl()
        ret_code, ret_message, ds_id = dsm_service.addds(params_json, host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                      Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                      ErrorLink=ret_message["ErrorLink"]), CommonResponseStatus.SERVER_ERROR.value

        if permission_manage:
            # 增加资源
            res_message, res_code = managerutils.add_resource(kg_id=ds_id, type=2, uuid=uuid)
            if res_code != 200:
                # 删除新增的资源记录
                dsm_dao.delete([ds_id])
                return Gview.TErrorreturn(ErrorCode=res_message["code"], Description=res_message["cause"],
                                          Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                          ErrorLink=""), res_code

            # 调用manager接口增加默认权限
            res_message, res_code = managerutils.add_permission(kg_id=ds_id, type=2, uuid=uuid)
            if res_code != 200:
                dsm_dao.delete([ds_id])
                return Gview.TErrorreturn(ErrorCode=res_message["code"], Description=res_message["cause"],
                                          Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                          ErrorLink=""), res_code
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/<dsid>', methods=["put"], strict_slashes=False)
def ds(dsid):
    """
    put: 修改数据源
    """
    host_url = getHostUrl()
    # 删除方法重新修改
    if request.method == "DELETE":
        ret_code, ret_message = dsm_service.delete(dsid, host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"])
        return Gview.BuVreturn(message=ret_message.get("res"))
    # 修改数据源
    elif request.method == "PUT":
        param_code, params_json, param_message = commonutil.getMethodParam()
        print(params_json)
        ret_code, ret_message = dsm_service.update(dsid, params_json, host_url)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value




@dsm_controller_app.route('/delbydsids', methods=["DELETE"], strict_slashes=False)
def delds():
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    print(params_json)
    ret_code, ret_message = dsm_service.delete(params_json, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


# 模糊查询
@dsm_controller_app.route('/searchbyname', methods=["get"], strict_slashes=False)
def getbydsname():
    host_url = getHostUrl()
    uuid = request.headers.get("uuid")
    param_code, params_json, param_message = commonutil.getMethodParam()
    print(params_json)
    if param_code == 0:
        check_res,  message = dsCheckParameters.dsgetbynamePar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.getbydsname.ParametersError",
                                      Description=message, Solution=message, ErrorDetails="ParametersError",
                                      ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value

        # 调用manager接口获取数据源列表和属性
        if permission_manage:
            # 调用manager接口获取数据源列表和属性
            res_message, res_code = managerutils.get_otlDsList(uuid=uuid, type=2)
            if res_code != 200:
                return Gview.TErrorreturn(ErrorCode=res_message["code"], Description=res_message["cause"],
                                          Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                          ErrorLink=""), res_code
            params_json["res_list"] = res_message
            if len(res_message) == 0:
                ret_message = {"res": {"count": 0, "df": []}}
                return json.dumps(ret_message), CommonResponseStatus.SUCCESS.value

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


@dsm_controller_app.route('/acctoken/<ds_id>', methods=["GET"])
def get_acctoken_by_id(ds_id):
    print("ds_id: ", ds_id)
    if not ds_id.isdigit():
        return Gview.BuFailVreturn(cause="ds_id must be int ", code=CommonResponseStatus.PARAMETERS_ERROR.value,
                               message="param error "), CommonResponseStatus.BAD_REQUEST.value
    df = graph_dao.getDs_authById(ds_id)
    df = df.to_dict()
    df = df["ds_auth"]
    if not df:
        return Gview.BuFailVreturn(cause=" ds_id %s not exist" % str(ds_id), code=CommonResponseStatus.REQUEST_ERROR.value,
                                   message=" ds_id %s not exist" % str(ds_id)), CommonResponseStatus.SERVER_ERROR.value
    ds_auth = df[0]
    data = {"ds_auth": ds_auth}
    print("data: ", data)
    print('开始获取AS token', __file__, 'get_acctoken_by_id')
    ret_code, token = asToken.get_token(ds_auth)
    obj = {'access_token': token}
    return {
        "res": obj
    }

# 数据源复制
@dsm_controller_app.route('/ds_copy/<ds_id>', methods=["post"], strict_slashes=False)
def ds_copy(ds_id):
    uuid = request.headers.get("uuid")
    host_url = getHostUrl()
    print("dsid: ", ds_id)
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
                                  "ds_id must be int ", "ds_id must be int ",
                                  "parameters error", ""), CommonResponseStatus.BAD_REQUEST.value
    # ds_id 不存在
    code, obj = dsm_service.checkById(ds_id)
    if code != 0:
        return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.ds_copy.ParametersError",
                                  Description=obj["Cause"], Solution=obj["Cause"],
                                  ErrorDetails=obj["message"], ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value

    # 复制权限
    if permission_manage:
        res_message, res_code = managerutils.operate_permission(uuid=uuid, kg_id=[ds_id], type=2, action="copy")
        if res_code != 200:
            return Gview.TErrorreturn(ErrorCode=res_message["code"], Description=res_message["cause"],
                                      Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                      ErrorLink=""), res_code

    ret_code, ret_message, ds_id = dsm_service.addds(params_json, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                  Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                  ErrorLink=ret_message["ErrorLink"]), CommonResponseStatus.SERVER_ERROR.value

    if permission_manage:
        # 增加资源
        res_message, res_code = managerutils.add_resource(kg_id=ds_id, type=2, uuid=uuid)
        if res_code != 200:
            # 删除新增的资源记录
            dsm_dao.delete([ds_id])
            return Gview.TErrorreturn(ErrorCode=res_message["code"], Description=res_message["cause"],
                                      Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                      ErrorLink=""), res_code

        # 调用manager接口增加默认权限
        res_message, res_code = managerutils.add_permission(kg_id=ds_id, type=2, uuid=uuid)
        if res_code != 200:
            dsm_dao.delete([ds_id])
            return Gview.TErrorreturn(ErrorCode=res_message["code"], Description=res_message["cause"],
                                      Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                      ErrorLink=""), res_code
    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value

def getHostUrl():
    hostUrl = request.host_url
    return hostUrl

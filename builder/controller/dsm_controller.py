# -*-coding:utf-8-*-
# @Time    : 2020/8/10 17:53
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import requests
import pandas as pd
from flask import Blueprint, request, g,current_app,session,Response,jsonify

from config import config
from dao.dsm_dao import dsm_dao

from dao.graph_dao import graph_dao
from dao.otl_dao import otl_dao
from third_party_service.anyshare.token import asToken

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
    # get all,查询该用户可以看见的的数据源
    if method == "GET":
        host_url = getHostUrl()
        check_res, message = dsCheckParameters.getAllPar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.dsopt.ParametersError",
                                      Description=message, Solution=message, ErrorDetails=message,
                                      ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value
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
    param_code, params_json, param_message = commonutil.getMethodParam()
    print(params_json)
    if param_code == 0:
        check_res,  message = dsCheckParameters.dsgetbynamePar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.getbydsname.ParametersError",
                                      Description=message, Solution=message, ErrorDetails="ParametersError",
                                      ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value
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
    ret_code, ret_message, ds_id = dsm_service.addds(params_json, host_url)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                  Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                  ErrorLink=ret_message["ErrorLink"]), CommonResponseStatus.SERVER_ERROR.value
    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value

def getHostUrl():
    hostUrl = request.host_url
    return hostUrl

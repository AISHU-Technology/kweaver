# -*-coding:utf-8-*-
import yaml
from flask import Blueprint, request
from dao.graph_dao import graph_dao
from third_party_service.anyshare.token import asToken

from flasgger import swag_from
from utils.ds_check_parameters import dsCheckParameters
import os
from utils.log_info import Logger
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from service.dsm_Service import dsm_service
import json
from utils.CommonUtil import commonutil

dsm_controller_app = Blueprint('dsm_controller_app', __name__)
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


@dsm_controller_app.route('/Auth', methods=["GET"], strict_slashes=False)
@swag_from(swagger_old_response)
def auth():
    '''
    Get authorization URL
    ---
    parameters:
        -   name: ds_route
            in: query
            required: true
            description: routing, only for auth-success
            type: string
            example: auth-success
        -   name: ds_address
            in: query
            required: true
            description: data source ip
            type: string
            example: 192.168.1.1
        -   name: ds_auth
            in: query
            required: true
            description: Data source id, Empty when adding data source
            type: integer
            example:
        -   name: ds_port
            in: query
            required: true
            description: data source port
            type: integer
            example: 443
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    print(params_json)
    if param_code == 0:
        check_res, message = dsCheckParameters.Authcheck(params_json)  ####增加校验
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
@swag_from(swagger_old_response)
def gettoken():
    '''
    Get token interface
    ---
    parameters:
        -   name: ds_code
            in: body
            required: true
            description: Authorization code
            type: string
            example: fd4645y6u6756454e5423465gbfxefef
        -   name: ds_auth
            in: body
            required: true
            description: Data source id
            type: integer
            example: 66
    '''
    params_json = request.get_data()
    params_json = json.loads(params_json)
    paramscode, message = dsCheckParameters.gettokencheck(params_json)  ####增加校验
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
    """not used"""
    params_json = request.get_data()
    params_json = json.loads(params_json)
    paramscode, message = dsCheckParameters.verifycheck(params_json)  ####增加校验
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
@swag_from(swagger_old_response)
def connectTest():
    '''
       test connect
       ---
       parameters:
           -   name: data_source
               in:  body
               required: true
               description: mysql/as/as7/hive/rabbitmq
               type: string
               example: my_mysql
           -   name: ds_address
               in:  body
               required: true
               description: Data source url or ip
               type: string
               example: 192.168.0.1
           -   name: ds_id
               in:  body
               required: true
               description: Data source id
               type: integer
               example: 1
           -   name: ds_port
               in:  body
               required: true
               description: Data source port
               type: integer
               example: 3306
           -   name: ds_user
               in:  body
               required: false
               description: Data source user,as does not have this parameter
               type: string
               example: admin
           -   name: ds_password
               in:  body
               required: false
               description: Data source password,as does not have this parameter
               type: string
               example: ZWlzb28uY29tMTIz
           -   name: ds_path
               in:  body
               required: true
               description: database or path
               type: string
               example: anydata
           -   name: vhost
               in:  body
               required: true
               description: When data_source is not rabbitmq, pass ""
               type: string
               example: " "
           -   name: queue
               in:  body
               required: true
               description: When data_source is not rabbitmq, pass ""
               type: string
               example: " "
       '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = dsCheckParameters.testConPar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = dsm_service.connectTest(params_json)

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


@dsm_controller_app.route('', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def dsopt():
    '''
          get all datasource
          ---
          parameters:
              -   name: page
                  in: query
                  required: true
                  description: page
                  type: integer
                  example: 1
              -   name: size
                  in: query
                  required: true
                  description: Number of lines displayed per page
                  type: integer
                  example: 10
              -   name: order
                  in: query
                  required: true
                  description: ascend is in reverse chronological order,descend is opposite
                  type: string
                  example: ascend
              -   name: knw_id
                  in:  query
                  required: true
                  description: knowledge network id
                  type: integer
                  example: 1
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    check_res, message = dsCheckParameters.getAllPar(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.dsopt.ParametersError",
                                  Description=message, Solution=message, ErrorDetails=message,
                                  ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value
    ret_code, ret_message = dsm_service.getall(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.TErrorreturn(ErrorCode=ret_message["code"], Description=ret_message["cause"],
                                  Solution=ret_message["cause"], ErrorDetails=ret_message["message"],
                                  ErrorLink=""), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def dsopt_post():
    '''
    add datasource
    ---
    parameters:
       -   name: dsname
           in: body
           required: true
           description: Data source name
           type: string
           example: test_mysql
       -   name: data_source
           in:  body
           required: true
           description: mysql/as/as7/hive/rabbitmq
           type: string
           example: mysql
       -   name: ds_address
           in:  body
           required: true
           description: Data source url or ip
           type: string
           example: 10.4.69.47
       -   name: ds_port
           in:  body
           required: true
           description: Data source port
           type: integer
           example: 3306
       -   name: ds_user
           in:  body
           required: true
           description: Data source user
           type: string
           example: root
       -   name: ds_password
           in:  body
           required: true
           description: Data source password,base64 code
           type: string
           example: ZWlzb28uY29tMTIz
       -   name: ds_path
           in:  body
           required: true
           description: database or path
           type: string
           example: anydata
       -   name: extract_type
           in:  body
           required: true
           description: extract type
           type: string
           example: standardExtraction
       -   name: vhost
           in:  body
           required: true
           description: When data_source is not rabbitmq, pass ""
           type: string
           example:
       -   name: queue
           in:  body
           required: true
           description: When data_source is not rabbitmq, pass ""
           type: string
           example:
       -   name: dataType
           in:  body
           required: true
           description: datasource type,structured、unstructured,rabbitmq is structured
           type: string
           example: structured
       -   name: json_schema
           in:  body
           required: true
           description: When data_source is not rabbitmq, pass ""
           type: string
           example:
       -   name: knw_id
           in:  body
           required: true
           description: knowledge network id
           type: integer
           example: 1

    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    ret_code, ret_message, ds_id = dsm_service.addds(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                  Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                  ErrorLink=ret_message["ErrorLink"]), CommonResponseStatus.SERVER_ERROR.value
    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/<dsid>', methods=["put"], strict_slashes=False)
@swag_from(swagger_old_response)
def ds(dsid):
    '''
    edit datasource
    ---
    parameters:
       -   name: dsid
           in: path
           required: true
           description: Data source id
           type: integer
           example: 1
       -   name: dsname
           in: body
           required: true
           description: Data source name
           type: string
           example: test_rabbitmq
       -   name: data_source
           in:  body
           required: true
           description: mysql/as/as7/hive/rabbitmq
           type: string
           example: rabbitmq
       -   name: ds_address
           in:  body
           required: true
           description: Data source url or ip
           type: string
           example: 192.168.1.1
       -   name: ds_port
           in:  body
           required: true
           description: Data source port
           type: integer
           example: 5672
       -   name: ds_user
           in:  body
           required: true
           description: Data source user
           type: string
           example: admin
       -   name: ds_password
           in:  body
           required: true
           description: Data source password
           type: string
           example: test123456
       -   name: ds_path
           in:  body
           required: true
           description: database or path
           type: string
           example: ""
       -   name: extract_type
           in:  body
           required: true
           description: extract type
           type: string
           example: standardExtraction
       -   name: vhost
           in:  body
           required: true
           description: When data_source is not rabbitmq, pass ""
           type: string
           example: test
       -   name: queue
           in:  body
           required: true
           description: When data_source is not rabbitmq, pass ""
           type: string
           example: test1
       -   name: dataType
           in:  body
           required: true
           description: datasource type,structured、unstructured,rabbitmq is structured
           type: string
           example: structured
       -   name: json_schema
           in:  body
           required: true
           description: When data_source is not rabbitmq, pass ""
           type: string
           example: {"name": "xiaoming"}
    '''
    # update datasource
    param_code, params_json, param_message = commonutil.getMethodParam()
    print(params_json)
    ret_code, ret_message = dsm_service.update(dsid, params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/delbydsids', methods=["DELETE"], strict_slashes=False)
@swag_from(swagger_old_response)
def delds():
    '''
    delete datasource
    ---
    parameters:
       -   name: dsids
           in: body
           required: true
           description: Data source ids
           type: string
           example: [1,2,3,4]
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    print(params_json)
    ret_code, ret_message = dsm_service.delete(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@dsm_controller_app.route('/searchbyname', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def getbydsname():
    '''
    Fuzzy query data source by name
    ---
    parameters:
       -   name: dsname
           in: query
           required: true
           description: Data source name
           type: string
           example: test
       -   name: page
           in: query
           required: true
           description: Data source name
           type: integer
           example: 1
       -   name: size
           in: query
           required: true
           description: Number of lines displayed per page
           type: integer
           example: 10
       -   name: order
           in: query
           required: true
           description: ascend is in reverse chronological order,descend is opposite
           type: string
           example: ascend
       -   name: knw_id
           in:  query
           required: true
           description: knowledge network id
           type: integer
           example: 1
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    print(params_json)
    if param_code == 0:
        check_res, message = dsCheckParameters.dsgetbynamePar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.TErrorreturn(ErrorCode="Builder.controller.dsm_controller.getbydsname.ParametersError",
                                      Description=message, Solution=message, ErrorDetails="ParametersError",
                                      ErrorLink=""), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = dsm_service.getbydsname(params_json)
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
@swag_from(swagger_old_response)
def get_acctoken_by_id(ds_id):
    '''
    get as token
    ---
    parameters:
       -   name: ds_id
           in: path
           required: true
           description: Data source id
           type: string
           example: 1
    '''
    print("ds_id: ", ds_id)
    if not ds_id.isdigit():
        return Gview.BuFailVreturn(cause="ds_id must be int ", code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="param error "), CommonResponseStatus.BAD_REQUEST.value
    df = graph_dao.getDs_authById(ds_id)
    df = df.to_dict()
    df = df["ds_auth"]
    if not df:
        return Gview.BuFailVreturn(cause=" ds_id %s not exist" % str(ds_id),
                                   code=CommonResponseStatus.REQUEST_ERROR.value,
                                   message=" ds_id %s not exist" % str(ds_id)), CommonResponseStatus.SERVER_ERROR.value
    ds_auth = df[0]
    ret_code, token = asToken.get_token(ds_auth)
    obj = {'access_token': token}
    return {
        "res": obj
    }


@dsm_controller_app.route('/ds_copy/<ds_id>', methods=["post"], strict_slashes=False)
@swag_from(swagger_new_response)
def ds_copy(ds_id):
    '''
        copy datasource
        ---
        parameters:
           -   name: dsname
               in: body
               required: true
               description: Data source name
               type: string
               example: test_rabbitmq
           -   name: data_source
               in:  body
               required: true
               description: mysql/as/as7/hive/rabbitmq
               type: string
               example: rabbitmq
           -   name: ds_address
               in:  body
               required: true
               description: Data source url or ip
               type: string
               example: 192.168.1.1
           -   name: ds_port
               in:  body
               required: true
               description: Data source port
               type: integer
               example: 5672
           -   name: ds_user
               in:  body
               required: true
               description: Data source user
               type: string
               example: admin
           -   name: ds_password
               in:  body
               required: true
               description: Data source password
               type: string
               example: test123456
           -   name: ds_path
               in:  body
               required: true
               description: database or path
               type: string
               example: " "
           -   name: extract_type
               in:  body
               required: true
               description: extract type
               type: string
               example: standardExtraction
           -   name: vhost
               in:  body
               required: true
               description: When data_source is not rabbitmq, pass ""
               type: string
               example: test
           -   name: queue
               in:  body
               required: true
               description: When data_source is not rabbitmq, pass ""
               type: string
               example: test1
           -   name: dataType
               in:  body
               required: true
               description: datasource type,structured、unstructured,rabbitmq is structured
               type: string
               example: structured
           -   name: json_schema
               in:  body
               required: true
               description: When data_source is not rabbitmq, pass ""
               type: string
               example: {"name": "xiaoming"}
           -   name: knw_id
               in:  body
               required: true
               description: knowledge network id
               type: integer
               example: 1

        '''
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
    ret_code, ret_message, ds_id = dsm_service.addds(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.TErrorreturn(ErrorCode=ret_message["ErrorCode"], Description=ret_message["Description"],
                                  Solution=ret_message["Solution"], ErrorDetails=ret_message["ErrorDetails"],
                                  ErrorLink=ret_message["ErrorLink"]), CommonResponseStatus.SERVER_ERROR.value
    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value

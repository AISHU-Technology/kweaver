# -*-coding:utf-8-*-
from config import config
from service.Otl_Service import otl_service
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
from flasgger import swag_from
import yaml
import os

ontology_controller_app = Blueprint('ontology_controller_app', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH', os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_old_response.yaml'), 'r') as f:
    swagger_old_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_old_response.update(swagger_definitions)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)


@ontology_controller_app.route('/gettabbydsn', methods=["GET"])
@swag_from(swagger_old_response)
def get_table():
    '''
    get data table by data source name
    ---
    parameters:
        -   name: ds_id
            in: query
            required: true
            description: data source id
            type: integer
            example: 8
        -   name: data_source
            in: query
            required: true
            description: 'data source type. options: as7, hive, mysql'
            type: string
            example: as7
        -   name: postfix
            in: query
            required: false
            description: the file postfix. only valid when the data source type is as
            type: string
            example: csv
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        print(params_json)
        paramscode, message = otl_check_params.valid_params_check("get_table", params_json)
        if paramscode != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
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


@ontology_controller_app.route('/dirlist', methods=["GET"])  ###docid\tockendid
@swag_from(swagger_old_response)
def filter_by_postfix():
    '''
    expand the AS folder
    ---
    parameters:
        -   name: ds_id
            in: query
            required: true
            description: data source id
            type: string
        -   name: docid
            in: query
            required: true
            description: the gns of the folder
            type: string
        -   name: postfix
            in: query
            required: true
            description: 'structured："csv","json"; unstructured：“all”'
            type: string
    '''
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


@ontology_controller_app.route('/previewdata', methods=["GET"])
@swag_from(swagger_old_response)
def data_preview():
    '''
    preview the data
    ---
    parameters:
        -   name: ds_id
            in: query
            required: true
            description: data source id
            type: string
        -   name: data_source
            in: query
            required: true
            description: data source type
            type: string
        -   name: name
            in: query
            required: true
            description: 'as: docid; mysql: table name'
            type: string
    '''
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


@ontology_controller_app.route('/auto/autogenschema', methods=["post"])
@swag_from(swagger_old_response)
def predict_ontology():
    '''
    get extraction object and its properties in step 4
    ---
    parameters:
        -   name: ds_id
            in: body
            required: true
            description: data source id
            type: string
            example: 8
        -   name: data_source
            in: body
            required: true
            description: 'data source type. options: as7 mysql hive'
            type: string
            example: as7
        -   name: file_list
            in: body
            required: true
            description: file list
            type: array
            example: [
                {
                    "docid": "gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/667CDDD12E364766B72F8652F624A072",
                    "type": "file",
                    "name": "cuostomer.csv"
                }
            ]
        -   name: extract_type
            in: body
            required: true
            description: labelExtraction or standardExtraction
            type: string
            example: standardExtraction
        -   name: step
            in: body
            required: false
            description: Otl or Ext. only valid when extract type is labelExtraction
            type: string
        -   name: postfix
            in: body
            required: true
            description: the file postfix
            type: integer
            example: csv
    '''
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


@ontology_controller_app.route('/saveontology', methods=["post"])
@swag_from(swagger_old_response)
def save_ontology():
    '''
    add an ontology
    ---
    parameters:
        -   name: ontology_name
            in: body
            required: true
            description: ontology name
            type: string
            example: ontology_name
        -   name: ontology_des
            in: body
            required: false
            description: ontology description
            type: string
            example: ontology_des
        -   name: entity
            in: body
            required: true
            description: entity class information
            type: array
            example:  [
                {
                  "colour": "#546CFF",
                  "name": "entity1",
                  "properties": [["name", "string"]],
                  "relations": ["entity1", "edge1", "entity2"],
                  "ds_name": "data source name or ontology name",
                  "dataTtype": "data type(structured, unstructured)",
                  "extract_type": "standardExtraction",
                  "model": "aishu",
                  "file_type": "file type，data sources such as csv, mysql don't have file type",
                  "source": [
                    "docid",
                    "table"
                  ],
                  "source_type": " automatic,manual,import"
                }
              ]
        -   name: edge
            in: body
            required: true
            description: edge class information
            type: array
            example: [
                {
                  "colour": "#123CDF",
                  "ds_name": "data source name or ontology name",
                  "dataType": "data type(structured, unstructured)",
                  "extract_type": "standardExtraction",
                  "model": "aishu",
                  "data_source": "as",
                  "ds_path": "123",
                  "id": "7",
                  "file_type": "file type，data sources such as csv, mysql don't have file type",
                  "name": "entity1",
                  "properties": [
                    ["name", "string"],
                    ["age", "int"]
                  ],
                  "source": [
                    "docid",
                    "table"
                  ],
                  "source_type": " automatic,manual,import"
                },
              ]
    '''
    params_json = request.get_data()
    params_json = json.loads(params_json)
    ret_code, ret_message, onto_id = otl_service.ontology_save(params_json)
    if onto_id == -1:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/modellist', methods=["get"])
@swag_from(swagger_old_response)
def get_model_list():
    '''
    get model list
    ---
    '''
    ret_code, ret_message = otl_service.get_model_list()
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/modelspo', methods=["get"])
@swag_from(swagger_old_response)
def get_model_spo():
    '''
    get model spo
    ---
    parameters:
        -   name: model
            in: query
            required: true
            description: model name
            type: string
    '''
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
@swag_from(swagger_old_response)
def get_model_otl():
    '''
    get model ontology
    ---
    parameters:
        -   name: file_list
            in: body
            required: true
            description: file list
            type: array
            example: [["gns://3B3FDF44E3FD48FEB0F0C38C0C4D9C13/C6B5BF7F283144E897CA818707F14812/AE3E13B7F7674CF7BA6C48D420D1AD07", "anyshare//anydata研发线//aaa.csv", "aaa.csv"]]
        -   name: model
            in: body
            required: true
            description: model name
            type: string
            example: AImodel
    '''
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


@ontology_controller_app.route('/getotl', methods=["get"])
@swag_from(swagger_old_response)
def getall():
    '''
    get ontology list
    ---
    parameters:
        -   name: page
            in: query
            required: true
            description: 'page number. -1: get all ontologies; else paging get ontology list.'
            type: integer
        -   name: size
            in: query
            required: true
            description: number per page
            type: integer
        -   name: order
            in: query
            required: true
            description: descend or ascend. order by time
            type: string
    '''
    method = request.method
    # 根据不同的请求方式请求方式获得参数并获取异常
    param_code, params_json, param_message = commonutil.getMethodParam()
    print(params_json, param_code)
    if param_code == 0:
        # 获取该用户可以看见的本体列表
        if method == "GET":
            check_res, message = otl_check_params.getAllParOnto(params_json)
            if check_res != 0:
                Logger.log_error("parameters:%s invalid" % params_json)
                return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                           message=message), CommonResponseStatus.BAD_REQUEST.value
            ret_code, ret_message = otl_service.getall(params_json)
            if ret_code == CommonResponseStatus.SERVER_ERROR.value:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            return ret_message, CommonResponseStatus.SUCCESS.value
    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=param_message), CommonResponseStatus.BAD_REQUEST.value


@ontology_controller_app.route('/delotlbyids', methods=["DELETE"], strict_slashes=False)
@swag_from(swagger_old_response)
def delotl():
    '''
    delete the ontology
    ---
    parameters:
        -   name: otlids
            in: body
            required: true
            description: ontology ids
            type: array
            example: [990,103,101,102,95,87,89]
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    ret_code, ret_message = otl_service.delete(params_json)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/searchbyname', methods=["get"], strict_slashes=False)
@swag_from(swagger_old_response)
def getotlbyname():
    '''
    fuzzy query ontology by name
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
            description: number per page
            type: integer
        -   name: order
            in: query
            required: true
            description: descend or ascend. order by time
            type: string
        -   name: otlname
            in: query
            required: true
            description: ontology name
            type: string
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        check_res, message = otl_check_params.otlgetbynamePar(params_json)
        if check_res != 0:
            Logger.log_error("parameters:%s invalid" % params_json)
            return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                       message=message), CommonResponseStatus.BAD_REQUEST.value
        ret_code, ret_message = otl_service.getbyotlname("", params_json, -1)
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return ret_message, CommonResponseStatus.SUCCESS.value

    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@ontology_controller_app.route('updatename/<otlid>', methods=["put"], strict_slashes=False)
@swag_from(swagger_old_response)
def updateotlname(otlid):
    '''
    update ontology name and description
    ---
    parameters:
        -   name: otlid
            in: path
            required: true
            description: ontology id
            type: integer
        -   name: ontology_name
            in: body
            required: true
            description: ontology name
            type: string
            example: ontology_name
        -   name: ontology_des
            in: body
            required: true
            description: ontology description
            type: string
            example: ontology_des
    '''
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

        ret_code, ret_message = otl_service.update_name(otlid, params_json, "-1")
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value

    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@ontology_controller_app.route('updateinfo/<otlid>', methods=["put"], strict_slashes=False)
@swag_from(swagger_old_response)
def updateotlinfo(otlid):
    '''
    update ontology information such as entity class information
    ---
    parameters:
        -   name: otlid
            in: path
            required: true
            description: ontolody id
            type: integer
        -   name: entity
            in: body
            required: true
            description: 'entity class information. required fields：entity_id,colour,ds_name,dataType,data_source,ds_path,ds_id, extract_type, name, source_table, source_type, properties. not required fields(the value can be empty, but the field must exist): file_type, task_id, properties_index, model, source_table, ds_address, alias.'
            type: array
            example: [
                {
                  "colour": "#805A9C",
                  "ds_name": "结构化数据",
                  "dataType": "structured",
                  "extract_type": "standardExtraction",
                  "file_type": "csv",
                  "task_id": "55",
                  "name": "nei1",
                  "source_table": [
                    [
                      "gns://B4FFFD35301B43B78DAEA4737A364C47/DC6942AC590846C297A52346AE9B27F0/EDEA69091B1B4538BE74AAA9535D0E66",
                      "结构化数据/csv/nei1.csv",
                      "nei1.csv"
                    ]
                  ],
                  "source_type": "automatic",
                  "properties": [
                    ["name", "string"],
                    ["p", "string"],
                    ["s", "string"]
                  ],
                  "properties_index": ["name", "p", "s"],
                  "data_source": "as7",
                  "ds_path": "结构化数据",
                  "model": "",
                  "entity_id": 4,
                  "ds_id": "5",
                  "ds_address":"https://10.4.69.44",
                  "alias":"花花护花"
                }
              ]
        -   name: edge
            in: body
            required: false
            description: edge class information. edge_id. others(ditto)
            type: array
            example: []
        -   name: used_task
            in: body
            required: true
            description: rendered task
            type: array
            example: [1, 23]
        -   name: flag
            in: body
            required: true
            description: '"nextstep": the next step is to verify that the entity cannot be empty, and the running tasks cannot be saved. "save": it is not verified that the entity is empty, and there are running tasks to save'
            type: string
            example: nextstep
    '''
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
        ret_code, ret_message = otl_service.update_info(otlid, params_json, "-1")
        if ret_code == CommonResponseStatus.SERVER_ERROR.value:
            return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                       message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
        return Gview.BuVreturn(message=ret_message.get("res")), CommonResponseStatus.SUCCESS.value

    else:
        return Gview.BuFailVreturn(cause=param_message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="Incorrect parameter format"), CommonResponseStatus.BAD_REQUEST.value


@ontology_controller_app.route('/<otlid>', methods=["get"], strict_slashes=False)
@swag_from(swagger_old_response)
def ds(otlid):
    '''
    get ontology details by name
    ---
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    if not otlid.isdigit():
        message = "The parameter otlid type must be int!"
        return Gview.BuFailVreturn(cause=message, code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message=message), CommonResponseStatus.BAD_REQUEST.value
    if param_code == 0:
        if request.method == "GET":
            # get 不需要参数校验
            ret_code, ret_message = otl_service.getbyotlname(otlid, params_json, 1)
            if ret_code == CommonResponseStatus.SERVER_ERROR.value:
                return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                           message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
            return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/getbykgid/<kgid>', methods=["get"], strict_slashes=False)
@swag_from(swagger_new_response)
def getotlbykgid(kgid):
    '''
    get ontology information by kgid
    ---
    parameters:
        -   name: kgid
            in: path
            required: true
            description: knowledge graph id
            type: integer
    '''
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
        ret_code, ret_message = otl_service.getbyotlname(otlid, params_json, 1)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            return ret_message, ret_code
        # 过滤本体中不在图数据库中的点或边
        ret_code, ret_message = otl_service.filterotl(kgid, ret_message)
        if ret_code != CommonResponseStatus.SUCCESS.value:
            return ret_message, ret_code
        return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/getotlbyname', methods=["get"], strict_slashes=False)
@swag_from(swagger_old_response)
def getotlbyotlname():
    '''
    get ontology information by ontology name
    ---
    parameters:
        -   name: name
            in: query
            required: true
            description: ontology name
            type: string
    '''
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
    ret_code, ret_message = otl_service.getotlbyname(otlname)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    return ret_message, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/task/build_task', methods=["POST"], strict_slashes=False)
@swag_from(swagger_old_response)
def builde_onto_task():
    '''
    execute the task of predicting ontology
    ---
    parameters:
        -   name: ontology_id
            in: body
            required: true
            description: When creating an ontology, the ontology ID of the first build task is null, and the temporary ontology ID is returned. Next, all the build tasks use the returned temporary ontology ID. When editing an ontology, the build task uses the ontology ID.
            type: string
            example: 8
        -   name: file_list
            in: body
            required: true
            description: files you want to predict
            type: array
            example: [{"docid":"gns://5B32B75DF1D246E59209BE1C04515587/4932E3A6EFC9476A8549C4D02DE2D40D/3D77695B9C1641398944920D7B6D921E","name":"industry_info.csv","type":"file"}]
        -   name: postfix
            in: body
            required: true
            description: 'Filter criteria: csv,json,""-->mysql/hive'
            type: string
            example: csv
        -   name: ds_id
            in: body
            required: true
            description: data source id
            type: integer
            example: 7
    '''
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
        'Content-Type': 'application/json'
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
@swag_from(swagger_old_response)
def gettaskinfo():
    '''
    query task list
    ---
    parameters:
        -   name: page
            in: body
            required: true
            description: page number
            type: integer
            example: 1
        -   name: size
            in: body
            required: true
            description: number per page
            type: integer
            example: 20
        -   name: ontology_id
            in: body
            required: true
            description: ontology id
            type: string
            example: 7
        -   name: used_task
            in: body
            required: true
            description: rendered tasks
            type: array
            example: []
    '''
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
        'Content-Type': 'application/json'
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
@swag_from(swagger_old_response)
def deletetask():
    '''
    delete the task
    ---
    parameters:
        -   name: task_list
            in: body
            required: true
            description: task list
            type: array
            example: [13]
    '''
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
        'Content-Type': 'application/json'
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
@swag_from(swagger_old_response)
def get_task_files():
    '''
    get the status of predicting files
    ---
    parameters:
        -   name: task_id
            in: query
            required: true
            description: task id
            type: integer
        -   name: page
            in: query
            required: true
            description: page number
            type: integer
        -   name: size
            in: query
            required: true
            description: number per page
            type: integer
    '''
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
        'Content-Type': 'application/json'
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
@swag_from(swagger_old_response)
def deletealltask():
    '''
    exit without saving all tasks related to deleting ontology
    ---
    parameters:
        -   name: ontology_id
            in: query
            required: true
            description: ontology id
            type: integer
        -   name: state
            in: query
            required: true
            description: "'edit': edit without saving (delete some tasks); 'notedit': create without saving (delete all tasks)"
            type: string
    '''
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
        'Content-Type': 'application/json'
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


@ontology_controller_app.route('/copy/<otlid>', methods=["POST"], strict_slashes=False)
@swag_from(swagger_old_response)
def copy_otl(otlid):
    '''
    copy ontology
    ---
    parameters:
        -   name: otlid
            in: path
            required: true
            description: ontology id
            type: integer
        -   name: ontology_name
            in: body
            required: true
            description: ontology name
            type: string
            example: ontology_name
        -   name: ontology_des
            in: body
            required: false
            description: ontology description
            type: string
            example: ontology_description
    '''
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
    # 获取被复制本体的数据
    ret_code, ret_message = otl_service.getbyotlname(otlid, {}, 1)
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value
    # 数据库插入数据
    ret_code, ret_mess, onto_id = otl_service.saveCopyOtl(ret_message["res"].get("df")[0], params_json)
    if onto_id == -1:
        return Gview.BuFailVreturn(cause=ret_mess["cause"], code=ret_mess["code"],
                                   message=ret_mess["message"]), CommonResponseStatus.SERVER_ERROR.value
    return {"res": {"ontology_id": onto_id}}, CommonResponseStatus.SUCCESS.value


@ontology_controller_app.route('/ds', methods=["get"], strict_slashes=False)
@swag_from(swagger_old_response)
def graphDsList():
    '''
    get data source list when clicking 'batching import' in step 3: ontology
    ---
    '''
    ret_code, ret_message = otl_service.getds()
    if ret_code == CommonResponseStatus.SERVER_ERROR.value:
        return Gview.BuFailVreturn(cause=ret_message["cause"], code=ret_message["code"],
                                   message=ret_message["message"]), CommonResponseStatus.SERVER_ERROR.value

    return ret_message, CommonResponseStatus.SUCCESS.value


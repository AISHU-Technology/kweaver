# -*- coding: utf-8 -*-
'''
@Author ：Jay.zhu
@Date ：2022/8/12 16:41
'''
import json
import os
import sys
import traceback

import requests
from flask import Blueprint, request, send_from_directory, jsonify, make_response
from flask_babel import gettext as _l
from common.errorcode.codes.lexicon_code import *
from common.errorcode.gview import Gview as Gview2
from controller import celery_controller
from dao.lexicon_dao import lexicon_dao
from service.graph_Service import graph_Service
from service.lexicon_service import lexicon_service
from utils.CommonUtil import commonutil
from utils.lexicon_check_parameters import lexicon_check_parameters
from utils.log_info import Logger
import common.stand_log as log_oper
from concurrent.futures import ThreadPoolExecutor
import yaml

executor = ThreadPoolExecutor(2)

lexicon_controller_app = Blueprint('lexicon_controller_app', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH', os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r', encoding='utf-8') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_old_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_old_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_old_response.update(swagger_definitions)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)


def getHostUrl():
    hostUrl = request.host_url
    return hostUrl


@lexicon_controller_app.route('/create', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def create_lexicon():
    '''
    create a new lexicon
    create a new lexicon
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.lexicon.create_lexicon'
    #     -   name: file
    #         in: formData
    #         description: lexicon file, Please refer to the template
    #         required: false
    #         type: file
    #         example:
    '''
    # 获取接口参数
    try:
        params_json = {}
        params_json["name"] = request.form.get("name")
        params_json["knowledge_id"] = request.form.get("knowledge_id")
        params_json["description"] = request.form.get("description", "")
        # user_id = request.headers.get("userId", "")
        user_id = ""
    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_FileUploadError,
                                   ErrorDetails="Failed to get file."), 500
    # 参数校验
    check_res, message = lexicon_check_parameters.check_insert_lexicon(params_json, request.form)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_ParamError,
                                   ErrorDetails=message), 400
    # 校验knowledge_id是否存在
    if not lexicon_service.is_knowledgeId_exist(int(params_json.get("knowledge_id"))):
        return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_KnowledgeIdNotExist,
                                   knowledge_id=params_json.get("knowledge_id")), 500
    # 校验词库名称是否存在
    if lexicon_service.is_lexicon_name_exist(params_json.get("name"), int(params_json.get("knowledge_id")), 0):
        return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_DuplicatedName,
                                   lexicon_name=params_json.get("name")), 500
    try:
        # 注意如果拿不到，需要报错
        uploaded_files = request.files.getlist("file")
        if len(uploaded_files) > 1:
            return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_FilesNumberExceeded), 500
        if len(uploaded_files) == 0:
            lexicon_id = lexicon_dao.insert_lexicon(params_json, user_id)
            lexicon_dao.update_lexicon_status(lexicon_id, "success")
            user_name = request.headers.get("username")
            target_object = {"lexicon_id": lexicon_id, "name": params_json["name"]}
            operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, lexicon_id, target_object,
                                                       "新增词库{id=%s}" % lexicon_id, "lexicon")
            Logger.log_info(operation_log)

            return jsonify({"res": lexicon_id}), 200

    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_FileUploadError,
                                   ErrorDetails="Failed to get file."), 500
    try:
        for file in uploaded_files:
            file_name = file.filename
            path = os.path.dirname(os.path.dirname(os.path.realpath(__file__))) + "/template/" + file_name
            # 文件格式
            if not (file_name.endswith(".txt") or file_name.endswith(".csv")):
                return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_FileFormatError), 500
            file.save(path)
            # 校验大小
            fsize = os.path.getsize(path)
            if fsize > 10 * 1024 * 1024:
                return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_DataExceeded), 500

            lexicon_id = lexicon_dao.insert_lexicon(params_json, user_id)
            params_json["lexicon_id"] = lexicon_id
            params_json["file_path"] = path
            params_json["user_id"] = user_id
            params_json["mode"] = "create"

            ret_code, message = send_import_lexicon(params_json)
            if ret_code != 200:
                code = Builder_LexiconController_CreateLexicon_AsyncTaskInternalError
                return Gview2.TErrorreturn(code, detail=message), 500

            user_name = request.headers.get("username")
            target_object = {"lexicon_id": lexicon_id, "name": params_json["name"]}
            operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, lexicon_id, target_object,
                                                       "新增词库{id=%s}" % lexicon_id, "lexicon")
            Logger.log_info(operation_log)
            return jsonify({"res": lexicon_id}), 200

    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_FileUploadError,
                                   ErrorDetails=repr(e)), 500


@lexicon_controller_app.route('/create/template_lexicon', methods=["POST"], strict_slashes=False)
def create_template_lexicon():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = Builder_LexiconController_CreateTemplateLexicon_ParamError
            return Gview2.error_return(code, message=param_message), 400
        check_res, message = lexicon_check_parameters.check_create_template_lexicon(params_json)
        if check_res != 0:
            code = Builder_LexiconController_CreateTemplateLexicon_ParamError
            return Gview2.error_return(code, message=message), 400

        user_id = request.headers.get("userId")
        roles = request.headers.get("roles")
        code, res = lexicon_service.create_template_lexicon(params_json, user_id, roles)
        if code == 200:
            # 用户行为日志
            user_name = request.headers.get("username")
            target_object = {"lexicon_id": res, "name": params_json["name"]}
            operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, res, target_object,
                                                       "新增词库{id=%s}" % res, "lexicon")
            Logger.log_info(operation_log)
            return Gview2.json_return(res), code
        return res, code
    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = Builder_LexiconController_CreateTemplateLexicon_UnknownError
        return Gview2.error_return(code, description=str(e)), 500


@lexicon_controller_app.route('/build_task', methods=["POST"], strict_slashes=False)
def build_task():
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code < 0:
            code = Builder_LexiconController_BuildTask_ParamError
            return Gview2.error_return(code, message=param_message), 400
        message = ""
        if "lexicon_id" not in params_json.keys():
            message += "NO parameter %s. " % "lexicon_id"
        elif not isinstance(params_json["lexicon_id"], int) or params_json["lexicon_id"] <= 0:
            message += "lexicon_id" + _l(" must be int, and more than zero!")
        if message:
            code = Builder_LexiconController_BuildTask_ParamError
            return Gview2.error_return(code, message=message), 400

        # code, res = lexicon_service.build_task(params_json["lexicon_id"], request.headers["userId"],
        #                                        request.headers["roles"])
        code, res = lexicon_service.build_task(params_json["lexicon_id"], "", "")
        if code == 200:

            return res, code
        return res, code

    except Exception as e:
        log_info = log_oper.get_error_log(repr(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(log_info)
        code = Builder_LexiconController_BuildTask_UnknownError
        return Gview2.error_return(code, description=str(e)), 500


@lexicon_controller_app.route('/getall', methods=["GET"], strict_slashes=False)
# @swag_from(swagger_new_response)
def get_lexicon():
    '''
    get a list of all lexicons
    paginate to get all lexicons
    # ---
    # parameters:
    #     -   name: knowledge_id
    #         in: query
    #         description: knowledge network id
    #         required: true
    #         type: integer
    #         example: 1
    #     -   name: page
    #         in: query
    #         description: page number when the results are returned in pages
    #         required: true
    #         type: integer
    #         example: 1
    #     -   name: size
    #         in: query
    #         description: the number of one page when the result page is returned
    #         required: true
    #         type: integer
    #         example: 10
    #     -   name: order
    #         in: query
    #         description: sort order, asc or desc
    #         required: true
    #         type: string
    #         example: asc
    #     -   name: rule
    #         in: query
    #         description: sorted fields
    #         required: true
    #         type: string
    #         example: "update_time"
    #     -   name: word
    #         in: query
    #         description: Search term
    #         required: false
    #         type: string
    #         example: "test"
    '''
    # 获取接口参数
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_get_all_lexicon(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_GetLexiconList_ParamError,
                                   ErrorDetails=message), 400
    # 校验knowledge_id是否存在
    if not lexicon_service.is_knowledgeId_exist(params_json.get("knowledge_id")):
        return Gview2.TErrorreturn(Builder_LexiconController_GetLexiconList_KnowledgeIdNotExist,
                                   knowledge_id=params_json.get("knowledge_id")), 500

    if not params_json.get("rule"):
        params_json["rule"] = "update_time"
    if not params_json.get("order"):
        params_json["order"] = "desc"

    # dataIds = request.headers.get("dataIds")
    # lexicon_ids = [] if not isinstance(dataIds, str) or dataIds == "" else [int(x) for x in dataIds.split(",")]
    # params_json["lexicon_ids"] = lexicon_ids
    params_json["lexicon_ids"] = []

    # 查找
    ret_code, res = lexicon_service.get_lexicon_list(params_json)
    if ret_code == 200:

        return jsonify({"res": res}), 200
    return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                               ErrorDetails=res), 500


@lexicon_controller_app.route('/getbyid', methods=["GET"], strict_slashes=False)
# @swag_from(swagger_new_response)
def get_lexicon_by_id():
    '''
    get lexicon according to lexicon id
    get lexicon according to lexicon id
    # ---
    # parameters:
    #     -   name: id
    #         in: query
    #         description: lexicon id
    #         required: true
    #         type: integer
    #         example: 1
    #     -   name: page
    #         in: query
    #         description: page number when the results are returned in pages
    #         required: true
    #         type: integer
    #         example: 1
    #     -   name: size
    #         in: query
    #         description: the number of one page when the result page is returned
    #         required: true
    #         type: integer
    #         example: 10
    '''
    # 获取接口参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_get_lexicon_by_id(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_GetLexiconById_ParamError,
                                   ErrorDetails=message), 400
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(int(params_json.get("id")))
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_GetLexiconById_LexiconIdNotExist,
                                   lexicon_id=params_json.get("id")), 500

    # 查找
    ret_code, res = lexicon_service.get_lexicon_by_id(params_json)
    if ret_code == 200:

        return jsonify({"res": res}), 200
    return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                               ErrorDetails=res), 500


@lexicon_controller_app.route('/insert', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def insert_word2lexicon():
    '''
    add new words to the specified lexicon
    add new words to the specified lexicon
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.lexicon.insert_word2lexicon'
    '''
    # 获取接口参数
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_add_lexicon_word(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_InsertLexiconWord_ParamError,
                                   ErrorDetails=message), 400
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(params_json.get("id"))
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_InsertLexiconWord_LexiconIdNotExist,
                                   lexicon_id=params_json.get("id")), 500
    # 校验词库状态
    ids = lexicon_service.get_lexicon_status(params_json.get("id"))
    if len(ids) == 0:
        return Gview2.TErrorreturn(Builder_LexiconController_InsertLexiconWord_InvalidStatus,
                                   lexicon_id=params_json.get("id")), 500
    user_id = request.headers.get("userId", "")
    # 词库新增词汇
    ret_code, mess = lexicon_service.insert_data2mongo(params_json.get("id"), [params_json.get("word_info")],
                                                       user_id, insert_one=True)
    if ret_code == 200:
        user_name = request.headers.get("username")
        word_info = params_json.get("word_info")
        if "_id" in word_info.keys():
            del word_info["_id"]
        target_object = {"word_info": word_info}
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, params_json["id"], target_object,
                                                   "给词库{id=%s}添加词汇%s" % (params_json["id"], target_object), "lexicon")
        Logger.log_info(operation_log)

        return jsonify({"res": "success"}), 200
    if mess == "Builder_LexiconController_InsertLexiconWord_FormatMismatch":
        return Gview2.TErrorreturn(Builder_LexiconController_InsertLexiconWord_FormatMismatch,
                                   data=params_json.get("word_info")), 500
    if mess == "Builder_LexiconController_InsertLexiconWord_WordExisted":
        return Gview2.TErrorreturn(Builder_LexiconController_InsertLexiconWord_WordExisted,
                                   data=params_json.get("word_info")), 500


@lexicon_controller_app.route('/search', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def search_word_in_lexicon():
    '''
    search words in the specified lexicon
    search words in the specified lexicon
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.lexicon.search_word_in_lexicon'
    #     -   name: page
    #         in: query
    #         description: page number when the results are returned in pages
    #         required: true
    #         type: integer
    #         example: 1
    #     -   name: size
    #         in: query
    #         description: the number of one page when the result page is returned
    #         required: true
    #         type: integer
    #         example: 10
    '''
    # 获取接口参数
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_search_lexicon_word(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_SearchLexiconWord_ParamError,
                                   ErrorDetails=message), 400
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(params_json.get("id"))
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_SearchLexiconWord_LexiconIdNotExist,
                                   lexicon_id=params_json.get("id")), 500

    # 搜索
    ret_code, res = lexicon_service.search_word_in_lexicon(params_json)
    if ret_code == 200:

        return jsonify({"res": res}), 200
    return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                               ErrorDetails=res), 500


@lexicon_controller_app.route('/edit_words', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def edit_word_in_lexicon():
    '''
    edit word in the specified lexicon
    edit word in the specified lexicon
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.lexicon.edit_word_in_lexicon'
    '''
    # 获取接口参数
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_edit_lexicon_word(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_EditLexiconWord_ParamError,
                                   ErrorDetails=message), 400
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(params_json.get("id"))
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_EditLexiconWord_LexiconIdNotExist,
                                   lexicon_id=params_json.get("id")), 500
    # 校验词库状态
    ids = lexicon_service.get_lexicon_status(params_json.get("id"))
    if len(ids) == 0:
        return Gview2.TErrorreturn(Builder_LexiconController_EditLexiconWord_InvalidStatus,
                                   lexicon_id=params_json.get("id")), 500
    # 修改
    user_id = request.headers.get("userId", "")
    error_code = lexicon_service.edit_word_in_lexicon(params_json, user_id)
    if not error_code:
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, params_json["id"], params_json,
                                                   "修改了词库{id=%s}中词汇" % params_json["id"], "lexicon")
        Logger.log_info(operation_log)
        return jsonify({"res": "success"}), 200
    # 被修改的词汇不存在
    elif error_code == "Builder_LexiconController_EditLexiconWord_LexiconWordNotExist":
        return Gview2.TErrorreturn(Builder_LexiconController_EditLexiconWord_LexiconWordNotExist,
                                   lexicon_word=params_json.get("old_info")), 500
    # 修改后的词汇已存在
    elif error_code == "Builder_LexiconController_EditLexiconWord_LexiconWordExisted":
        return Gview2.TErrorreturn(Builder_LexiconController_EditLexiconWord_LexiconWordExisted,
                                   lexicon_word=params_json.get("new_info")), 500
    # 格式不符合
    elif error_code == "Builder_LexiconController_EditLexiconWord_FormatMismatch":
        return Gview2.TErrorreturn(Builder_LexiconController_EditLexiconWord_FormatMismatch,
                                   new_info=params_json.get("new_info"),
                                   old_info=params_json.get("old_info")), 500
    else:
        return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                                   ErrorDetails=error_code), 500


@lexicon_controller_app.route('/delete_words', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def delete_word_in_lexicon():
    '''
    batch delete word in the specified lexicon
    batch delete word in the specified lexicon
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.lexicon.delete_word_in_lexicon'
    '''
    # 获取接口参数
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_delete_lexicon_word(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_DeleteLexiconWord_ParamError,
                                   ErrorDetails=message), 400
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(params_json.get("id"))
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_DeleteLexiconWord_LexiconIdNotExist,
                                   lexicon_id=params_json.get("id")), 500
    # 校验词库状态
    ids = lexicon_service.get_lexicon_status(params_json.get("id"))
    if len(ids) == 0:
        return Gview2.TErrorreturn(Builder_LexiconController_DeleteLexiconWord_InvalidStatus,
                                   lexicon_id=params_json.get("id")), 500
    # 删除
    user_id = request.headers.get("userId", "")
    error_code = lexicon_service.delete_word_in_lexicon(params_json, user_id)
    if not error_code:
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, params_json["id"], params_json,
                                                   "删除了词库{id=%s}中词汇" % params_json["id"], "lexicon")
        Logger.log_info(operation_log)

        return jsonify({"res": "success"}), 200
    if error_code == "Builder.LexiconController.DeleteLexiconWord.WordNotExist":
        return Gview2.TErrorreturn(Builder_LexiconController_DeleteLexiconWord_WordNotExist,
                                   delete_data=params_json.get("word_info_list")), 500
    return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                               ErrorDetails=error_code), 500


@lexicon_controller_app.route('/edit', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def edit_lexicon():
    '''
    edit basic information of lexicon
    edit basic information of lexicon
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.lexicon.edit_lexicon'
    '''
    # 获取接口参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_edit_lexicon(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_EditLexicon_ParamError,
                                   ErrorDetails=message), 400
    # 编辑
    # params_json["user_id"] = request.headers.get("userId", "")
    # params_json["roles"] = request.headers.get("roles", "")
    params_json["user_id"] = ""
    code, mess = lexicon_service.edit_lexicon(params_json)
    if code == 200:
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, params_json["id"], params_json,
                                                   "修改了词库{id=%s}，结果为%s" % (params_json["id"], params_json), "lexicon")
        Logger.log_info(operation_log)
        return jsonify({"res": "success"}), 200
    return mess, code


@lexicon_controller_app.route('/delete', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def delete_lexicon():
    '''
    batch delete lexicon
    batch delete lexicon by lexicon id
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.lexicon.delete_lexicon'
    '''
    # 获取接口参数
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_delete_lexicon(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_DeleteLexicon_ParamError,
                                   ErrorDetails=message), 400
    lexicon_ids = params_json.get("id_list")
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(lexicon_ids)
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_DeleteLexicon_LexiconIdNotExist,
                                   lexicon_id=lexicon_ids), 500

    # 删除
    code, mess = lexicon_service.delete_lexicon(lexicon_ids)
    if code == 200:
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, params_json["id_list"], {},
                                                   "删除了词库{id=%s}" % params_json["id_list"], "lexicon")
        Logger.log_info(operation_log)

        return jsonify({"res": "success", "lexicon_ids": lexicon_ids}), 200
    return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                               ErrorDetails=mess), 500


@lexicon_controller_app.route('/import_words', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def import_word2lexicon():
    '''
    import word information into lexicon
    import word information into lexicon
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.lexicon.import_word2lexicon'
    #     -   name: file
    #         in: formData
    #         description: lexicon file
    #         type: file
    #         example:
    '''
    # 获取接口参数
    params_json = {}
    params_json["mode"] = request.form.get("mode")
    params_json["id"] = request.form.get("id")
    # 参数校验
    check_res, message = lexicon_check_parameters.check_import_words_lexicon(params_json, request.form)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_ParamError,
                                   ErrorDetails=message), 400
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(int(params_json.get("id")))
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_LexiconIdNotExist,
                                   lexicon_id=params_json.get("id")), 500
    # 校验词库咋状态
    ids = lexicon_service.get_lexicon_status(request.form.get("id"))
    if len(ids) == 0:
        return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_InvalidStatus,
                                   lexicon_id=request.form.get("id")), 500
    try:
        # 注意如果拿不到，需要报错
        uploaded_files = request.files.getlist("file")
        if len(uploaded_files) > 1:
            return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_FilesNumberExceeded), 500
        elif not uploaded_files[0]:
            return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_FileEmptyError), 500
    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_FileUploadFailed,
                                   ErrorDetails=repr(e)), 500
    try:
        for file in uploaded_files:
            file_name = file.filename
            path = os.path.dirname(os.path.dirname(os.path.realpath(__file__))) + "/template/" + file_name
            # 文件格式
            if not (file_name.endswith(".txt") or file_name.endswith(".csv")):
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_FileFormatError), 500
            file.save(path)
            # 校验大小
            fsize = os.path.getsize(path)
            if fsize > 10 * 1024 * 1024:
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_DataExceeded), 500

            # 异步写入mongodb
            lexicon_id = params_json.get("id")
            params_json["lexicon_id"] = lexicon_id
            params_json["file_path"] = path
            params_json["user_id"] = request.headers.get('userId', '')
            params_json["mode"] = params_json.get("mode")

            ret_code, message = send_import_lexicon(params_json)
            if ret_code != 200:
                code = Builder_LexiconController_ImportWord2Lexicon_AsyncTaskInternalError
                return Gview2.TErrorreturn(code, detail=message), 500
            user_name = request.headers.get("username")
            operation_log = log_oper.get_operation_log(user_name, log_oper.UPLOAD, params_json["id"], params_json,
                                                       "为词库{id=%s}导入词汇" % params_json["id"], "lexicon")
            Logger.log_info(operation_log)
            return jsonify({"res": "success"}), 200

    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_FileUploadFailed,
                                   ErrorDetails=repr(e)), 500


@lexicon_controller_app.route('/export', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def export_lexicon():
    '''
    export lexicons
    export lexicons by lexicon id list
    # ---
    # parameters:
    #     -   in: 'body'
    #         name: 'body'
    #         description: 'request body'
    #         required: true
    #         schema:
    #             $ref: '#/components/schemas/builder.lexicon.export_lexicon'
    '''
    # 获取接口参数
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_export_lexicon(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_ExportLexicon_ParamError,
                                   ErrorDetails=message), 400
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(params_json.get("id_list"))
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_ExportLexicon_LexiconIdNotExist,
                                   lexicon_id=params_json.get("id_list")), 500
    # 校验词库咋状态
    ids = lexicon_service.get_lexicon_status(params_json.get("id_list"))
    if len(ids) == 0:
        return Gview2.TErrorreturn(Builder_LexiconController_ExportLexicon_InvalidStatus,
                                   lexicon_id=params_json.get("id_list")), 500
    # 导出
    file_path, file_name, flag = lexicon_service.export_lexicon(ids)
    if flag:
        response = make_response(send_from_directory(file_path, file_name, as_attachment=True))
        response.headers["Content-Disposition"] = "attachment; filename={}".format(file_name.encode().decode('latin-1'))
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.DOWNLOAD, params_json["id_list"], {},
                                                   "导出词库{id=%s}" % params_json["id_list"], "lexicon")
        Logger.log_info(operation_log)
        return response
    return Gview2.TErrorreturn(Builder_LexiconController_ExportLexicon_EmptyLexicon), 500


@lexicon_controller_app.route('/template', methods=["POST"], strict_slashes=False)
# @swag_from(swagger_new_response)
def download_template():
    '''
    download lexicon file format template
    download lexicon file format template
    ---
    '''
    # 获取接口参数
    host_url = getHostUrl()
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_download_template(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_DownloadTemplate_ParamError,
                                   ErrorDetails=message), 400
    # 下载
    try:
        file_path, file_name = lexicon_service.download_template()
        return send_from_directory(file_path, file_name, as_attachment=True)
    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_DownloadTemplate_DownoladFailed,
                                   ErrorDetails=repr(e)), 500


# 词库构建已产品化，删除临时接口
@lexicon_controller_app.route('/create_synonym', methods=["POST"], strict_slashes=False)
def create_synonym():
    """天辰项目交付临时open api，词库产品化后删除该接口，将该接口逻辑转为celery任务,未开启国际化"""
    try:
        uploaded_files = request.files.getlist("file")
        if len(uploaded_files) == 0 or len(uploaded_files) > 1:
            raise Exception("GetFileError")
    except Exception:
        return Gview2.TErrorreturn(Builder_LexiconController_CreateSynonym_GetFileError,
                                   ErrorDetails="Failed to get file."), 500
    params_json = {}
    # mode: custom表示铺平给as提供用作os自定义词库 / std表示给algserver提供的标准词库
    mode = request.form.get("mode")
    graph_id = request.form.get("graph_id")
    params_json["mode"] = request.form.get("mode")
    params_json["graph_id"] = request.form.get("graph_id")
    # 参数校验
    check_res, message = lexicon_check_parameters.check_create_synonym(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_CreateSynonym_ParamError,
                                   ErrorDetails=message), 400
    code, ret = graph_Service.checkById(graph_id)
    if code != 0:
        return Gview2.TErrorreturn(Builder_LexiconController_CreateSynonym_GraphIdNotExist,
                                   ErrorDetails="Graph id does not exist"), 500
    for file in uploaded_files:
        file_name = file.filename
        # 文件格式
        if not (file_name.endswith(".txt")):
            return Gview2.TErrorreturn(Builder_LexiconController_CreateSynonym_FileTypeError,
                                       ErrorDetails="Only txt file types are supported"), 500
        file.save(file_name)
        with open(file_name, "r", encoding="utf-8") as f:
            lines = f.readlines()
            contents = lines[1:]
    try:
        synonym_path, synonym_name, code = lexicon_service.generate_synonym(mode, graph_id, contents)
        if code == 1:
            return Gview2.TErrorreturn(Builder_LexiconController_CreateSynonym_ReadDsError,
                                       ErrorDetails="The data source network is unreachable or misconfigured"), 500
    except Exception as e:
        error_log = log_oper.get_error_log("generate_synonym error: {}".format(str(e)),
                                           sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_CreateSynonym_MatchError,
                                   ErrorDetails="Graph configuration and attribute thesaurus do not match"), 500
    user_name = request.headers.get("username")
    detail_type = "标准词库" if mode == "std" else "分词词库"
    operation_log = log_oper.get_operation_log(user_name, log_oper.DOWNLOAD, graph_id, {},
                                               f"基于图谱id={graph_id}生成并导出{detail_type}", "lexicon")
    Logger.log_info(operation_log)
    return send_from_directory(synonym_path, synonym_name, as_attachment=True)


@lexicon_controller_app.route('/download', methods=["GET"], strict_slashes=False)
def download_lexicon():
    """ 下载单个词库，用来通过api一次性获取单个词库所有内容用，还未产品化，临时使用，未开启国际化 """
    # 获取接口参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_download_lexicon(params_json)
    if check_res != 0:
        error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
        Logger.log_error(error_log)
        return Gview2.TErrorreturn(Builder_LexiconController_DownloadLexicon_ParamError,
                                   ErrorDetails=message), 400
    lexicon_id = params_json.get("lexicon_id")
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(int(lexicon_id))
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_DownloadLexicon_LexiconIdNotExist,
                                   lexicon_id=lexicon_id), 500
    # 校验词库状态
    ids = lexicon_service.get_lexicon_status(lexicon_id)
    if len(ids) == 0:
        return Gview2.TErrorreturn(Builder_LexiconController_DownloadLexicon_InvalidStatus,
                                   lexicon_id=lexicon_id), 500
    # 导出
    try:
        file_path, file_name, flag = lexicon_service.download_lexicon(ids)
        if flag:
            return send_from_directory(file_path, file_name, as_attachment=True)
    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_DownloadLexicon_InternalError,
                                   lexicon_id=lexicon_id), 500
    return Gview2.TErrorreturn(Builder_LexiconController_DownloadLexicon_EmptyLexicon,
                               lexicon_id=lexicon_id), 500


def send_import_lexicon(params_json):
    retry_count = 3
    message = ""
    request_status = False
    lexicon_id = params_json["lexicon_id"]
    path = params_json["file_path"]
    params_json['task_type'] = 'import_lexicon'
    params_json['relation_id'] = lexicon_id
    params_json['task_name'] = 'import_lexicon-{}'.format(lexicon_id)
    params_json['async_task_name'] = "cel.import_lexicon"
    params_json['cancel_pre'] = True
    params_json['task_params'] = json.dumps({"lexicon_id": lexicon_id, "file_path": path})

    url = "http://localhost:6488/task/import_lexicon"
    # url = "http://10.4.37.76:6488/task/import_lexicon"  #debug
    headers = {
        'Content-Type': 'application/json',
        'Accept-Language': request.headers.get('Accept-Language')
    }
    # 尝试3次
    for _ in range(retry_count):
        try:
            response = requests.request("POST", url, headers=headers, data=json.dumps(params_json))
            if response.status_code != 200:
                Logger.log_info(f"post task import_lexicon-{lexicon_id} failed:{str(response.text)}")
                message = f"post task import_lexicon-{lexicon_id} failed:{str(response.text)}"
                continue
            Logger.log_info(f"post task import_lexicon-{lexicon_id} success:{repr(response.json())}")
            request_status = True
            break
        except Exception as e:
            message = repr(e)
            error_log = log_oper.get_error_log(f"post task import_lexicon-{lexicon_id} failed:{repr(e)}",
                                               sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
    if not request_status:
        return 500, message
    return 200, ""

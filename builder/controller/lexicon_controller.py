# -*- coding: utf-8 -*-
import os
from flask import Blueprint, request, send_from_directory, jsonify, make_response
from common.errorcode.codes.lexicon_code import *
from common.errorcode.gview import Gview as Gview2
from dao.lexicon_dao import lexicon_dao
from service.lexicon_service import lexicon_service
from utils.CommonUtil import commonutil
from utils.lexicon_check_parameters import lexicon_check_parameters
from utils.log_info import Logger
from concurrent.futures import ThreadPoolExecutor
import yaml
from flasgger import swag_from


executor = ThreadPoolExecutor(2)

lexicon_controller_app = Blueprint('lexicon_controller_app', __name__)
GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH', os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_old_response.yaml'), 'r') as f:
    swagger_old_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_old_response.update(swagger_definitions)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_new_response.yaml'), 'r') as f:
    swagger_new_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_new_response.update(swagger_definitions)


@lexicon_controller_app.route('/create', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def create_lexicon():
    '''
    create a new lexicon
    create a new lexicon
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/lexicon/create_lexicon'
        -   name: file
            in: formData
            description: lexicon file, Please refer to the template
            required: false
            type: file
            example:
    '''
    try:
        params_json = {}
        params_json["name"] = request.form.get("name")
        params_json["knowledge_id"] = request.form.get("knowledge_id")
        params_json["labels"] = request.form.get("labels", "")
        params_json["description"] = request.form.get("description", "")
    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_FileUploadError,
                                   ErrorDetails="Failed to get file."), 500
    # 参数校验
    check_res, message = lexicon_check_parameters.check_insert_lexicon(params_json, request.form)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
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
            lexicon_id = lexicon_dao.insert_lexicon(params_json)
            lexicon_dao.update_lexicon_status(lexicon_id, "success")
            return jsonify({"res": lexicon_id}), 200
    
    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_FileUploadError,
                                   ErrorDetails="Failed to get file."), 500
    try:
        for file in uploaded_files:
            file_name = file.filename
            # 文件格式
            if not (file_name.endswith(".txt") or file_name.endswith(".csv")):
                return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_FileFormatError), 500
            file.save(file_name)
            # 校验大小
            fsize = os.path.getsize(file_name)
            if fsize > 10 * 1024 * 1024:
                return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_DataExceeded), 500
            
            # 读取文件内容
            columns, contents, flag, message = lexicon_service.get_file_content(file_name)
            # 编码错误
            if message == "Builder_LexiconController_CreateLexicon_EncodingError":
                return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_EncodingError), 500
            # 内容格式错误
            elif message == "Builder_LexiconController_CreateLexicon_ContentFormatError":
                return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_ContentFormatError), 500
            elif message:
                return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_FileUploadError,
                                           ErrorDetails=message), 500
            # 列名校验
            message1 = lexicon_service.file_columns_verification(columns)
            if message1 == "Builder_LexiconController_CreateLexicon_ContentFormatError":
                return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_ContentFormatError), 500
            elif message1 == "DataExceeded":
                return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_DataExceeded), 500
            res, message2 = lexicon_service.file_content_verification(flag, columns, contents)
            if message2 == "Builder_LexiconController_CreateLexicon_ContentFormatError":
                return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_ContentFormatError), 500
            # 创建词库，lexicon表插入词库信息
            params_json["columns"] = columns
            lexicon_id = lexicon_dao.insert_lexicon(params_json)
            
            params_json["labels"] = eval(params_json["labels"])
            params_json["columns"] = columns
            # 异步写入mongodb
            executor.submit(lexicon_service.insert_lexicon, lexicon_id, res)
            return jsonify({"res": lexicon_id}), 200
    
    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_CreateLexicon_FileUploadError,
                                   ErrorDetails=repr(e)), 500


@lexicon_controller_app.route('/labels', methods=["GET"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_labels():
    '''
    get candidate labels
    get candidate labels by knowledge_id
    ---
    parameters:
        -   name: knowledge_id
            in: query
            description: knowledge network id
            required: true
            type: integer
            example: 1
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_get_labels_lexicon(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview2.TErrorreturn(Builder_LexiconController_GetLabels_ParamError,
                                   ErrorDetails=message), 400
    # 校验knowledge_id是否存在
    if not lexicon_service.is_knowledgeId_exist(params_json.get("knowledge_id")):
        return Gview2.TErrorreturn(Builder_LexiconController_GetLabels_KnowledgeIdNotExist,
                                   knowledge_id=params_json.get("knowledge_id")), 500
    # 获取候选标签
    ret_code, res = lexicon_service.get_labels(params_json.get("knowledge_id"))
    if ret_code == 200:
        return jsonify({"res": res}), 200
    return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                               ErrorDetails=res), 500


@lexicon_controller_app.route('/getall', methods=["GET"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_lexicon():
    '''
    get a list of all lexicons
    paginate to get all lexicons
    ---
    parameters:
        -   name: knowledge_id
            in: query
            description: knowledge network id
            required: true
            type: integer
            example: 1
        -   name: page
            in: query
            description: page number when the results are returned in pages
            required: true
            type: integer
            example: 1
        -   name: size
            in: query
            description: the number of one page when the result page is returned
            required: true
            type: integer
            example: 10
        -   name: order
            in: query
            description: sort order, asc or desc
            required: true
            type: string
            example: asc
        -   name: rule
            in: query
            description: sorted fields
            required: true
            type: string
            example: "update_time"
        -   name: word
            in: query
            description: Search term
            required: false
            type: string
            example: "test"
    '''
    # 获取接口参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_get_all_lexicon(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
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
    
    # 查找
    ret_code, res = lexicon_service.get_lexicon_list(params_json)
    if ret_code == 200:
        return jsonify({"res": res}), 200
    return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                               ErrorDetails=res), 500


@lexicon_controller_app.route('/getbyid', methods=["GET"], strict_slashes=False)
@swag_from(swagger_new_response)
def get_lexicon_by_id():
    '''
    get lexicon according to lexicon id
    get lexicon according to lexicon id
    ---
    parameters:
        -   name: id
            in: query
            description: lexicon id
            required: true
            type: integer
            example: 1
        -   name: page
            in: query
            description: page number when the results are returned in pages
            required: true
            type: integer
            example: 1
        -   name: size
            in: query
            description: the number of one page when the result page is returned
            required: true
            type: integer
            example: 10
    '''
    # 获取接口参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_get_lexicon_by_id(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
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
@swag_from(swagger_new_response)
def insert_word2lexicon():
    '''
    add new words to the specified lexicon
    add new words to the specified lexicon
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/lexicon/insert_word2lexicon'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_add_lexicon_word(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
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
    # 词库新增词汇
    ret_code, mess = lexicon_service.insert_data2mongo(params_json.get("id"), [params_json.get("word_info")],
                                                       insert_one=True)
    if ret_code == 200:
        return jsonify({"res": "success"}), 200
    if mess == "Builder_LexiconController_InsertLexiconWord_FormatMismatch":
        return Gview2.TErrorreturn(Builder_LexiconController_InsertLexiconWord_FormatMismatch,
                                   data=params_json.get("word_info")), 500
    if mess == "Builder_LexiconController_InsertLexiconWord_WordExisted":
        return Gview2.TErrorreturn(Builder_LexiconController_InsertLexiconWord_WordExisted,
                                   data=params_json.get("word_info")), 500


@lexicon_controller_app.route('/search', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def search_word_in_lexicon():
    '''
    search words in the specified lexicon
    search words in the specified lexicon
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/lexicon/search_word_in_lexicon'
        -   name: page
            in: query
            description: page number when the results are returned in pages
            required: true
            type: integer
            example: 1
        -   name: size
            in: query
            description: the number of one page when the result page is returned
            required: true
            type: integer
            example: 10
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_search_lexicon_word(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
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
@swag_from(swagger_new_response)
def edit_word_in_lexicon():
    '''
    edit word in the specified lexicon
    edit word in the specified lexicon
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/lexicon/edit_word_in_lexicon'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_edit_lexicon_word(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
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
    error_code = lexicon_service.edit_word_in_lexicon(params_json)
    if not error_code:
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
@swag_from(swagger_new_response)
def delete_word_in_lexicon():
    '''
    batch delete word in the specified lexicon
    batch delete word in the specified lexicon
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/lexicon/delete_word_in_lexicon'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_delete_lexicon_word(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
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
    error_code = lexicon_service.delete_word_in_lexicon(params_json)
    if not error_code:
        return jsonify({"res": "success"}), 200
    if error_code == "Builder.LexiconController.DeleteLexiconWord.WordNotExist":
        return Gview2.TErrorreturn(Builder_LexiconController_DeleteLexiconWord_WordNotExist,
                                   delete_data=params_json.get("word_info_list")), 500
    return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                               ErrorDetails=error_code), 500


@lexicon_controller_app.route('/edit', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def edit_lexicon():
    '''
    edit basic information of lexicon
    edit basic information of lexicon
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/lexicon/edit_lexicon'
    '''
    # 获取接口参数
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_edit_lexicon(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview2.TErrorreturn(Builder_LexiconController_EditLexicon_ParamError,
                                   ErrorDetails=message), 400
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(params_json.get("id"))
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_EditLexicon_LexiconIdNotExist,
                                   lexicon_id=params_json.get("id")), 500
    # 该词库所属的知识网络id
    knowledge_id = lexicon_service.get_knowledge_by_lexicon_id(params_json.get("id"))
    
    # 校验词库名称是否存在
    if lexicon_service.is_lexicon_name_exist(params_json.get("name"), knowledge_id, params_json.get("id")):
        return Gview2.TErrorreturn(Builder_LexiconController_EditLexicon_DuplicatedName,
                                   lexicon_name=params_json.get("name")), 500
    
    # 编辑
    code, mess = lexicon_service.edit_lexicon(params_json)
    if code == 200:
        return jsonify({"res": "success"}), 200
    return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                               ErrorDetails=mess), 500


@lexicon_controller_app.route('/delete', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def delete_lexicon():
    '''
    batch delete lexicon
    batch delete lexicon by lexicon id
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/lexicon/delete_lexicon'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_delete_lexicon(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview2.TErrorreturn(Builder_LexiconController_DeleteLexicon_ParamError,
                                   ErrorDetails=message), 400
    # 校验词库id是否存在
    ids = lexicon_service.is_lexicon_id_exist(params_json.get("id_list"))
    if not ids:
        return Gview2.TErrorreturn(Builder_LexiconController_DeleteLexicon_LexiconIdNotExist,
                                   lexicon_id=params_json.get("id_list")), 500
    
    # 删除
    code, mess = lexicon_service.delete_lexicon(params_json.get("id_list"))
    if code == 200:
        return jsonify({"res": "success"}), 200
    return Gview2.TErrorreturn(Builder_LexiconController_DatabaseError,
                               ErrorDetails=mess), 500


@lexicon_controller_app.route('/import_words', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def import_word2lexicon():
    '''
    import word information into lexicon
    import word information into lexicon
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/lexicon/import_word2lexicon'
        -   name: file
            in: formData
            description: lexicon file
            type: file
            example:
    '''
    # 获取接口参数
    # param_code, params_json, param_message = commonutil.getMethodParam()
    params_json = {}
    params_json["mode"] = request.form.get("mode")
    params_json["id"] = request.form.get("id")
    
    # 参数校验
    check_res, message = lexicon_check_parameters.check_import_words_lexicon(params_json, request.form)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
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
            # 文件格式
            if not (file_name.endswith(".txt") or file_name.endswith(".csv")):
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_FileFormatError), 500
            file.save(file_name)
            # 校验大小
            fsize = os.path.getsize(file_name)
            if fsize > 10 * 1024 * 1024:
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_DataExceeded), 500
            
            # 读取文件内容
            columns, contents, flag, message = lexicon_service.get_file_content(file_name)
            if not message:
                if not columns and not contents:
                    return jsonify({"res": "success"}), 200
            # 编码错误
            if message == "Builder_LexiconController_CreateLexicon_EncodingError":
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_EncodingError), 500
            # 内容格式错误
            elif message == "Builder_LexiconController_CreateLexicon_ContentFormatError":
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_ContentFormatError), 500
            elif message:
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_FileUploadFailed,
                                           ErrorDetails=message), 500
            # 列名校验
            message1 = lexicon_service.file_columns_verification(columns)
            if message1 == "Builder_LexiconController_CreateLexicon_ContentFormatError":
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_ContentFormatError), 500
            elif message1 == "DataExceeded":
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_DataExceeded), 500
            res, message2 = lexicon_service.file_content_verification(flag, columns, contents)
            if message2 == "Builder_LexiconController_CreateLexicon_ContentFormatError":
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_ContentFormatError), 500
            # 新老数据是否匹配校验
            old_columns = lexicon_service.get_columns_from_lexicon(int(request.form.get("id")))
            if old_columns and set(old_columns) != set(columns):
                return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_FormatMismatch), 500
            # 替换还是新增
            if params_json.get("mode") == "replace":
                lexicon_service.delete_word_in_mongo(int(params_json.get("id")))
            
            # 异步写入mongodb
            executor.submit(lexicon_service.insert_data2mongo, int(params_json.get("id")), res)
            return jsonify({"res": "success"}), 200
    
    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_ImportWord2Lexicon_FileUploadFailed,
                                   ErrorDetails=repr(e)), 500


@lexicon_controller_app.route('/export', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def export_lexicon():
    '''
    export lexicons
    export lexicons by lexicon id list
    ---
    parameters:
        -   in: 'body'
            name: 'body'
            description: 'request body'
            required: true
            schema:
                $ref: '#/definitions/builder/lexicon/export_lexicon'
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_export_lexicon(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
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
        return response
    
    return Gview2.TErrorreturn(Builder_LexiconController_ExportLexicon_EmptyLexicon), 500


@lexicon_controller_app.route('/template', methods=["POST"], strict_slashes=False)
@swag_from(swagger_new_response)
def download_template():
    '''
    download lexicon file format template
    download lexicon file format template
    ---
    '''
    param_code, params_json, param_message = commonutil.getMethodParam()
    # 参数校验
    check_res, message = lexicon_check_parameters.check_download_template(params_json)
    if check_res != 0:
        Logger.log_error("parameters:%s invalid" % params_json)
        return Gview2.TErrorreturn(Builder_LexiconController_DownloadTemplate_ParamError,
                                   ErrorDetails=message), 400
    # 下载
    try:
        file_path, file_name = lexicon_service.download_template()
        return send_from_directory(file_path, file_name, as_attachment=True)
    except Exception as e:
        return Gview2.TErrorreturn(Builder_LexiconController_DownloadTemplate_DownoladFailed,
                                   ErrorDetails=repr(e)), 500

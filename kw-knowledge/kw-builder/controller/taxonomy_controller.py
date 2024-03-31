# -*- coding:utf-8 -*-
import re
import sys
import traceback

from flask import Blueprint, request
from flask_babel import gettext as _l
from jsonschema import validate, ValidationError

import common.stand_log as log_oper
from common.errorcode import codes
from common.errorcode.gview import Gview
from service.taxonomy_service import taxonomy_service
from utils.CommonUtil import commonutil
from utils.log_info import Logger

taxonomy_controller_app = Blueprint('taxonomy_controller_app', __name__)


@taxonomy_controller_app.route('', methods=["post"], strict_slashes=False)
def create_taxonomy():
    '''
    创建术语库
    '''
    try:
        # 参数校验
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_CreateTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        # pattern: 中英文、数字和键盘上的特殊字符
        pattern = u'^[=~!@#$&%^&*()_+`{}\-[\];:,.\\\?<>\'"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]+$'
        # 去除首尾空格和特殊字符
        if 'name' in params_json and isinstance(params_json['name'], str):
            params_json['name'] = params_json['name'].strip()
        schema = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['knw_id', 'name', 'default_language'],
            'properties': {
                'knw_id': {
                    'type': 'integer',
                    'minimum': 1
                },
                'name': {
                    'type': 'string',
                    'minLength': 1,
                    'maxLength': 50,
                    'pattern': pattern
                },
                'default_language': {
                    'type': 'string',
                    'enum': ['zh_CN', 'zh_TW', 'en']
                },
                'description': {
                    'oneOf': [
                        {
                            'type': 'string',
                            'maxLength': 255,
                            'pattern': pattern
                        },
                        {
                            'type': 'string',
                            'enum': ['']
                        }
                    ]
                }
            }
        }
        try:
            validate(params_json, schema)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_AddWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('Userid')
        params_json['roles'] = request.headers.get('Roles')
        code, res = taxonomy_service.create_taxonomy(params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.CREATE, params_json.get('knw_id'),
                                                   params_json,
                                                   "新增了术语库")
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("create taxonomy failed: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_CreateTaxonomy_UnknownError
        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>', methods=["post"], strict_slashes=False)
def edit_taxonomy(taxonomy_id: str):
    '''
    编辑术语库
    '''
    try:
        # 参数校验
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        if 'name' in params_json and isinstance(params_json['name'], str):
            params_json['name'] = params_json['name'].strip()
        name = params_json.get('name')
        default_language = params_json.get('default_language')
        description = params_json.get('description')
        # 校验name: 1-50字符，支持中英文、数字和键盘上的特殊字符
        pattern = u'^[=~!@#$&%^&*()_+`{}\-[\];:,.\\\?<>\'"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]+$'
        if name is None:
            message = 'name' + _l(" cannot be empty. ")
            code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not isinstance(name, str):
            message = 'name' + _l(" must be string ")
            code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif len(name) > 50 or len(name) == 0 or not (re.search(pattern, name)):
            message = 'name' + _l(" only support English and Chinese, numbers and special symbols on the keyboard,"
                                  " and the length is 0-50 digits.")
            code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        # 校验default_language: 只能为zh_CN zh_TW en 之一
        languages = ['zh_CN', 'zh_TW', 'en']
        if default_language is None:
            message = 'default_language' + _l(" cannot be empty. ")
            code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not isinstance(default_language, str):
            message = 'default_language' + _l(" must be string ")
            code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif default_language not in languages:
            message = 'default_language' + _l(" must be in ") + str(languages)
            code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        # 校验description: 0-255字符，支持中英文、数字和键盘上的特殊字符
        if description:
            if not isinstance(description, str):
                message = 'description' + _l(" must be string ")
                code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

                return Gview.TErrorreturn(code, message=message), 400
            elif len(description) > 255 or not (re.search(pattern, description)):
                message = 'description' + _l(
                    " only support English and Chinese, numbers and special symbols on the "
                    "keyboard, and the length is 0-255 digits.")
                code = codes.Builder_TaxonomyController_EditTaxonomy_ParamError

                return Gview.TErrorreturn(code, message=message), 400

        # 执行编辑操作
        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.edit_taxonomy(taxonomy_id, params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, taxonomy_id, params_json,
                                                   "编辑了{id=%s}的术语库" % taxonomy_id)
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("edit taxonomy {} failed: {}".format(taxonomy_id, repr(e)),
                                           sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_EditTaxonomy_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/', methods=["get"], strict_slashes=False)
def get_taxonomy_list():
    '''
    获取术语库列表
    '''
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        knw_id = params_json.get('knw_id')
        page = params_json.get('page')
        size = params_json.get('size')
        rule = params_json.get('rule')
        order = params_json.get('order')
        # 校验knw_id
        if knw_id is None or knw_id == '':
            message = 'knw_id' + _l(" cannot be empty. ")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not knw_id.isdigit():
            message = 'knw_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        knw_id = int(knw_id)
        params_json['knw_id'] = int(knw_id)
        if knw_id < 1:
            message = 'knw_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        # 校验page
        if page is None or page == '':
            message = 'page' + _l(" cannot be empty. ")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not page.isdigit():
            message = 'page' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        page = int(page)
        params_json['page'] = int(page)
        if page < 1:
            message = 'page' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        # 校验size
        if size is None or size == '':
            message = 'size' + _l(" cannot be empty. ")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not size.isdigit():
            message = 'size' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        size = int(size)
        params_json['size'] = size
        if size < 1:
            message = 'size' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        # 校验rule
        rules = ['update_time', 'create_time', 'name']
        if rule is None:
            message = 'rule' + _l(" cannot be empty. ")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not isinstance(rule, str):
            message = 'rule' + _l(" must be string ")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif rule not in rules:
            message = 'rule' + _l(" must be in ") + str(rules)
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        # 校验order
        orders = ['asc', 'desc']
        if order is None:
            message = 'order' + _l(" cannot be empty. ")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not isinstance(order, str):
            message = 'order' + _l(" must be string ")
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif order not in orders:
            message = 'order' + _l(" must be in ") + str(orders)
            code = codes.Builder_TaxonomyController_GetTaxonomyList_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('Userid')
        params_json['roles'] = request.headers.get('Roles')
        code, res = taxonomy_service.get_taxonomy_list(params_json)
        if code != 200:

            return res, code

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("get taxonomy list failed: {}".format(repr(e)), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_GetTaxonomyList_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/delete', methods=["post"], strict_slashes=False)
def delete_taxonomy():
    '''
    删除术语库
    '''
    try:
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_DeleteTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        taxonomy_ids = params_json.get('taxonomy_ids')
        # 校验taxonomy_ids:
        if taxonomy_ids is None:
            message = 'taxonomy_ids' + _l(" cannot be empty. ")
            code = codes.Builder_TaxonomyController_DeleteTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not isinstance(taxonomy_ids, list):
            message = 'taxonomy_ids' + _l(" must be list ")
            code = codes.Builder_TaxonomyController_DeleteTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif len(taxonomy_ids) == 0:
            message = 'taxonomy_ids' + _l(" cannot be empty. ")
            code = codes.Builder_TaxonomyController_DeleteTaxonomy_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        else:
            for taxonomy_id in taxonomy_ids:
                if not isinstance(taxonomy_id, int) or taxonomy_id <= 0:
                    message = 'taxonomy_id' + _l(" must be int, and more than zero!")
                    code = codes.Builder_TaxonomyController_DeleteTaxonomy_ParamError

                    return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.delete_taxonomy(taxonomy_ids, params_json)
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.DELETE, taxonomy_ids, {},
                                                   "删除了术语库{ids=%s}" % taxonomy_ids)
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("delete taxonomy {} failed: {}".format(taxonomy_id, repr(e)),
                                           sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_DeleteTaxonomy_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/word', methods=["post"], strict_slashes=False)
def add_word(taxonomy_id):
    '''
    添加词
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_AddWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_AddWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_AddWord_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        word_id_pattern = u'^[0-9a-f]+$'
        # 中英文、数字和键盘上的特殊字符
        pattern = u'^[=~!@#$&%^&*()_+`{}\-[\];:,.\\\?<>\'"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]+$'
        # 去除首尾空格和特殊字符
        if 'name' in params_json and isinstance(params_json['name'], str):
            params_json['name'] = params_json['name'].strip()
        schema_add_word = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['name', 'language'],
            'properties': {
                'parent': {
                    'type': 'string',
                    'minLength': 32,
                    'maxLength': 32,
                    'pattern': word_id_pattern
                },
                'name': {
                    'type': 'string',
                    'minLength': 1,
                    'maxLength': 255,
                    'pattern': pattern
                },
                'language': {
                    'type': 'string',
                    'enum': ['zh_CN', 'zh_TW', 'en']
                }
            }
        }
        try:
            validate(params_json, schema_add_word)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_AddWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.add_word(taxonomy_id, params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, taxonomy_id, params_json,
                                                   "在术语库{id=%s}添加了词" % taxonomy_id)
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("taxonomy {} add word failed: {}".format(taxonomy_id, repr(e)),
                                           sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_AddWord_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/word/<word_id>/label', methods=["post"], strict_slashes=False)
def edit_word_label(taxonomy_id, word_id):
    '''
    编辑词的基本信息
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_EditWordLabel_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_EditWordLabel_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        # 校验word_id
        word_id_pattern = u'^[0-9a-f]+$'
        # 中英文、数字和键盘上的特殊字符
        pattern = u'^[=~!@#$&%^&*()_+`{}\-[\];:,.\\\?<>\'"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]+$'
        if len(word_id) != 32:
            message = 'word_id "{}"'.format(word_id) + _l(" length must be ") + str(32)
            code = codes.Builder_TaxonomyController_EditWordLabel_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not re.match(word_id_pattern, word_id):
            message = 'word_id "{}"'.format(word_id) + _l(
                " must be a hexadecimal number within the range of 0-9 or a-f!")
            code = codes.Builder_TaxonomyController_EditWordLabel_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_EditWordLabel_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        schema_edit_word = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['action', 'language'],
            'properties': {
                'action': {
                    'type': 'string',
                    'enum': ['add', 'update', 'remove']
                },
                'language': {
                    'type': 'string',
                    'enum': ['zh_CN', 'zh_TW', 'en']
                },
                'label': {
                    'type': 'object',
                    "uniqueProperties": True,
                    "additionalProperties": False,
                    'required': ['name', 'description', 'synonym'],
                    'properties': {
                        'name': {
                            'type': 'string',
                            'minLength': 1,
                            'maxLength': 255,
                            'pattern': pattern
                        },
                        'description': {
                            'oneOf': [
                                {
                                    'type': 'string',
                                    'maxLength': 255,
                                    'pattern': pattern
                                },
                                {
                                    'type': 'string',
                                    'enum': ['']
                                }
                            ]
                        },
                        'synonym': {
                            'type': 'array',
                            'uniqueItems': True,
                            'items': {
                                'type': 'string',
                                'minLength': 1,
                                'maxLength': 255,
                                'pattern': pattern
                            }
                        }
                    }
                }
            },
            'allOf': [
                {
                    'if': {
                        'properties': {'action': {'enum': ['add', 'update']}}
                    },
                    'then': {
                        'required': ['label']
                    }
                }
            ]
        }
        try:
            validate(params_json, schema_edit_word)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_EditWordLabel_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.edit_word_label(taxonomy_id, word_id, params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, word_id, params_json,
                                                   "在术语库{id=%s}编辑了词{id=%s}的基本信息" % (taxonomy_id, word_id))
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "taxonomy {} edit word {} label failed: {}".format(taxonomy_id, word_id, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_EditWordLabel_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/word/<word_id>/level', methods=["post"], strict_slashes=False)
def edit_word_level(taxonomy_id, word_id):
    '''
    移动词的层级
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_EditWordLevel_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_EditWordLevel_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        # 校验word_id
        word_id_pattern = u'^[0-9a-f]+$'
        if len(word_id) != 32:
            message = 'word_id "{}"'.format(word_id) + _l(" length must be ") + str(32)
            code = codes.Builder_TaxonomyController_EditWordLabel_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not re.match(word_id_pattern, word_id):
            message = 'word_id "{}"'.format(word_id) + _l(
                " must be a hexadecimal number within the range of 0-9 or a-f!")
            code = codes.Builder_TaxonomyController_EditWordLabel_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_EditWordLevel_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        schema_edit_word = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['parent'],
            'properties': {
                'parent': {
                    'oneOf': [
                        {
                            'type': 'string',
                            'minLength': 32,
                            'maxLength': 32,
                            'pattern': word_id_pattern
                        },
                        {
                            'type': 'string',
                            'enum': ['root']
                        }
                    ]
                }
            }
        }
        try:
            validate(params_json, schema_edit_word)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_EditWordLevel_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.edit_word_level(taxonomy_id, word_id, params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, word_id, params_json,
                                                   "在术语库{id=%s}编辑了词{id=%s}的层级" % (taxonomy_id, word_id))
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "taxonomy {} edit word level {} failed: {}".format(taxonomy_id, word_id, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_EditWordLevel_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/word', methods=["get"], strict_slashes=False)
def get_top_words(taxonomy_id):
    '''
    获取术语库的顶级词
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_GetTopWords_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetTopWords_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json = {}
        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.get_top_words(taxonomy_id, params_json)
        if code != 200:

            return res, code

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("get taxonomy {} top words failed: {}".format(taxonomy_id, repr(e)),
                                           sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_GetTopWords_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/word/<word_ids>/subclass', methods=["get"], strict_slashes=False)
def get_child_words(taxonomy_id, word_ids):
    '''
    获取词的下级
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_GetChildWords_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetChildWords_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        # 校验word_ids
        word_ids = word_ids.split(',')
        word_id_pattern = u'^[0-9a-f]+$'
        for word_id in word_ids:
            if len(word_id) != 32 or not re.match(word_id_pattern, word_id):
                message = 'word_id "{}"'.format(word_id) + ' only support 0-9, a-f, and the length is 32 digits.'
                code = codes.Builder_TaxonomyController_GetChildWords_ParamError

                return Gview.TErrorreturn(code, message=message), 400

        params_json = {}
        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.get_child_words(taxonomy_id, word_ids, params_json)
        if code != 200:

            return res, code

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "get taxonomy {} {} child words failed: {}".format(taxonomy_id, word_ids, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_GetChildWords_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/word/<word_ids>', methods=["get"], strict_slashes=False)
def get_words(taxonomy_id, word_ids):
    '''
    获取词的下级
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_GetWords_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetWords_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        # 校验word_ids
        word_ids = word_ids.split(',')
        word_id_pattern = u'^[0-9a-f]+$'
        for word_id in word_ids:
            if len(word_id) != 32 or not re.match(word_id_pattern, word_id):
                message = 'word_id "{}"'.format(word_id) + ' only support 0-9, a-f, and the length is 32 digits.'
                code = codes.Builder_TaxonomyController_GetWords_ParamError

                return Gview.TErrorreturn(code, message=message), 400

        params_json = {}
        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.get_words(taxonomy_id, word_ids, params_json)
        if code != 200:

            return res, code

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "get taxonomy {} words {} failed: {}".format(taxonomy_id, word_ids, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_GetWords_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/search_word', methods=["get"], strict_slashes=False)
def search_word(taxonomy_id):
    '''
    搜索词
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_SearchWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_SearchWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_SearchWord_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400

        schema = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['query', 'field'],
            'properties': {
                'query': {
                    'type': 'string'
                },
                'field': {
                    'type': 'string',
                    'enum': ['name_and_synonym', 'displayed']
                },
                'language': {
                    'type': 'string',
                    'enum': ['zh_CN', 'zh_TW', 'en']
                }
            },
            "allOf": [
                {
                    "if": {"properties": {"field": {"const": "displayed"}}},
                    "then": {'required': ['language']}
                }
            ]
        }
        try:
            validate(params_json, schema)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_SearchWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.search_word(taxonomy_id, params_json)
        if code != 200:

            return res, code

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("search word from taxonomy {} failed: {}".format(taxonomy_id, repr(e)),
                                           sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_SearchWord_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/locate_word', methods=["get"], strict_slashes=False)
def locate_word(taxonomy_id):
    '''
    定位词的层级
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_LocateWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_LocateWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        word_id = request.args.get('word_id')
        # 校验word_id
        word_id_pattern = u'^[0-9a-f]+$'
        if not word_id:
            message = 'word_id' + _l(" cannot be empty. ")
            code = codes.Builder_TaxonomyController_LocateWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif len(word_id) != 32:
            message = 'word_id "{}"'.format(word_id) + _l(" length must be ") + str(32)
            code = codes.Builder_TaxonomyController_LocateWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        elif not re.match(word_id_pattern, word_id):
            message = 'word_id "{}"'.format(word_id) + _l(
                " must be a hexadecimal number within the range of 0-9 or a-f!")
            code = codes.Builder_TaxonomyController_LocateWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json = {}
        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.locate_word(taxonomy_id, word_id, params_json)
        if code != 200:

            return res, code

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("locate word from taxonomy {} failed: {}".format(taxonomy_id, repr(e)),
                                           sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_LocateWord_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/delete_word', methods=["post"], strict_slashes=False)
def delete_word(taxonomy_id):
    '''
    删除词
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_DeleteWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_DeleteWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_DeleteWord_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        word_id_pattern = u'^[0-9a-f]+$'
        schema_delete_word = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['word_ids', 'delete_option'],
            'properties': {
                'word_ids': {
                    'type': 'array',
                    'minItems': 1,
                    'uniqueItems': True,
                    'items': {
                        'type': 'string',
                        'minLength': 32,
                        'maxLength': 32,
                        'pattern': word_id_pattern
                    }
                },
                'delete_option': {
                    'type': 'string',
                    'enum': ['delete_one', 'delete_sub']
                }
            }
        }
        try:
            validate(params_json, schema_delete_word)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_DeleteWord_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.delete_word(taxonomy_id, params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, taxonomy_id, params_json,
                                                   "在术语库{id=%s}删除了词%s" % (taxonomy_id, params_json['word_ids']))
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log("delete word from taxonomy {} failed: {}".format(taxonomy_id, repr(e)),
                                           sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_DeleteWord_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/custom_relation', methods=["post"], strict_slashes=False)
def edit_custom_relation(taxonomy_id):
    '''
    编辑术语库的自定义关系
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_EditCustomRelation_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_EditCustomRelation_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_EditCustomRelation_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        # pattern: 中英文、数字和键盘上的特殊字符
        pattern = u'^[=~!@#$&%^&*()_+`{}\-[\];:,.\\\?<>\'"|/~！@#￥%…&*（）—+。={ }|【 】‘“’”：；、《》？，。\n/a-zA-Z0-9\u4e00-\u9fa5]+$'
        built_in_relation = ['subClassOf', 'isPartOf']
        schema = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['change_list'],
            'properties': {
                'change_list': {
                    'type': 'array',
                    "uniqueItems": True,
                    "items": {
                        "type": "object",
                        'required': ['action'],
                        "properties": {
                            "action": {
                                "type": 'string',
                                'enum': ['add', 'remove']
                            },
                            'id': {
                                'type': 'integer',
                                'minimum': 1
                            },
                            'name': {
                                'type': 'string',
                                'pattern': pattern,
                                'minLength': 1,
                                'maxLength': 255,
                                'not': {
                                    'enum': built_in_relation
                                }
                            }
                        },
                        "allOf": [
                            {
                                "if": {"properties": {"action": {"const": "add"}}},
                                "then": {'required': ['name']}
                            },
                            {
                                "if": {"properties": {"action": {"const": "remove"}}},
                                "then": {'required': ['id']}
                            }
                        ]
                    }
                }
            }
        }
        try:
            validate(params_json, schema)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_EditCustomRelation_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.edit_custom_relation(taxonomy_id, params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, taxonomy_id, params_json,
                                                   "在术语库{id=%s}编辑了自定义关系 %s" % (
                                                       taxonomy_id, params_json))
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "edit custom relation to taxonomy {} failed: {}".format(taxonomy_id, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_EditCustomRelation_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/custom_relation', methods=["get"], strict_slashes=False)
def get_custom_relation(taxonomy_id):
    '''
    获取自定义关系列表
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_GetCustomRelation_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetCustomRelation_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json = {}
        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.get_custom_relation(taxonomy_id, params_json)
        if code != 200:

            return res, code

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "get custom relation of taxonomy {} failed: {}".format(taxonomy_id, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_GetCustomRelation_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/relation/create_ispartof', methods=["post"], strict_slashes=False)
def create_relation_ispartof(taxonomy_id):
    '''
    新建词的属性
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_CreateRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_CreateRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_CreateRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        word_id_pattern = u'^[0-9a-f]+$'
        schema = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['start_word_id', 'end_word_id_list'],
            'properties': {
                'start_word_id': {
                    'type': 'string',
                    'minLength': 32,
                    'maxLength': 32,
                    'pattern': word_id_pattern
                },
                'end_word_id_list': {
                    'type': 'array',
                    "uniqueItems": True,
                    'minItems': 1,
                    "items": {
                        'type': 'string',
                        'minLength': 32,
                        'maxLength': 32,
                        'pattern': word_id_pattern
                    }
                }
            }
        }
        try:
            validate(params_json, schema)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_CreateRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.create_relation_ispartof(taxonomy_id, params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, taxonomy_id, params_json,
                                                   "在术语库{id=%s}添加了属性关系 %s" % (
                                                       taxonomy_id, params_json))
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "add relation isPartOf {} in taxonomy {} failed: {}".format(params_json, taxonomy_id, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_CreateRelationIspartof_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/relation/delete_ispartof', methods=["post"], strict_slashes=False)
def delete_relation_ispartof(taxonomy_id):
    '''
    删除词的属性
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_DeleteRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_DeleteRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_DeleteRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        word_id_pattern = u'^[0-9a-f]+$'
        schema = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['start_word_id', 'end_word_id_list'],
            'properties': {
                'start_word_id': {
                    'type': 'string',
                    'minLength': 32,
                    'maxLength': 32,
                    'pattern': word_id_pattern
                },
                'end_word_id_list': {
                    'type': 'array',
                    "uniqueItems": True,
                    'minItems': 1,
                    "items": {
                        'type': 'string',
                        'minLength': 32,
                        'maxLength': 32,
                        'pattern': word_id_pattern
                    }
                }
            }
        }
        try:
            validate(params_json, schema)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_DeleteRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.delete_relation_ispartof(taxonomy_id, params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, taxonomy_id, params_json,
                                                   "在术语库{id=%s}删除了属性关系 %s" % (
                                                       taxonomy_id, params_json))
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "delete relation isPartOf {} in taxonomy {} failed: {}".format(params_json, taxonomy_id, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_DeleteRelationIspartof_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/relation/edit_custom', methods=["post"], strict_slashes=False)
def edit_relation_custom(taxonomy_id):
    '''
    编辑词的自定义关系
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_EditRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_EditRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_EditRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        word_id_pattern = u'^[0-9a-f]+$'
        schema = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['relation_id', 'start_word_id', 'add_end_word_id_list', 'remove_end_word_id_list'],
            'properties': {
                'relation_id': {
                    'type': 'integer',
                    'minimum': 1
                },
                'start_word_id': {
                    'type': 'string',
                    'minLength': 32,
                    'maxLength': 32,
                    'pattern': word_id_pattern
                },
                'add_end_word_id_list': {
                    'type': 'array',
                    "uniqueItems": True,
                    "items": {
                        'type': 'string',
                        'minLength': 32,
                        'maxLength': 32,
                        'pattern': word_id_pattern
                    }
                },
                'remove_end_word_id_list': {
                    'type': 'array',
                    "uniqueItems": True,
                    "items": {
                        'type': 'string',
                        'minLength': 32,
                        'maxLength': 32,
                        'pattern': word_id_pattern
                    }
                }
            }
        }
        try:
            validate(params_json, schema)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_EditRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.edit_relation_custom(taxonomy_id, params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, taxonomy_id, params_json,
                                                   "在术语库{id=%s}编辑了词的自定义关系 %s" % (
                                                       taxonomy_id, params_json))
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "edit custom relation {} in taxonomy {} failed: {}".format(params_json, taxonomy_id, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_EditRelationCustom_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/relation/delete_custom', methods=["post"], strict_slashes=False)
def delete_relation_custom(taxonomy_id):
    '''
    删除词的自定义关系
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_DeleteRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_DeleteRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_DeleteRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        word_id_pattern = u'^[0-9a-f]+$'
        schema = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['relation_ids', 'word_id'],
            'properties': {
                'relation_ids': {
                    'type': 'array',
                    "uniqueItems": True,
                    'minItems': 1,
                    "items": {
                        'type': 'integer',
                        'minimum': 1
                    }
                },
                'word_id': {
                    'type': 'string',
                    'minLength': 32,
                    'maxLength': 32,
                    'pattern': word_id_pattern
                }
            }
        }
        try:
            validate(params_json, schema)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_DeleteRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.delete_relation_custom(taxonomy_id, params_json)
        if code != 200:

            return res, code
        user_name = request.headers.get("username")
        operation_log = log_oper.get_operation_log(user_name, log_oper.UPDATE, taxonomy_id, params_json,
                                                   "在术语库{id=%s}删除了词的自定义关系 %s" % (
                                                       taxonomy_id, params_json))
        Logger.log_info(operation_log)

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "delete custom relation {} in taxonomy {} failed: {}".format(params_json, taxonomy_id, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_DeleteRelationCustom_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/relation/ispartof', methods=["get"], strict_slashes=False)
def get_relation_ispartof(taxonomy_id):
    '''
    获取词的属性列表
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_GetRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_GetRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        word_id_pattern = u'^[0-9a-f]+$'
        schema = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['word_id'],
            'properties': {
                'word_id': {
                    'type': 'string',
                    'minLength': 32,
                    'maxLength': 32,
                    'pattern': word_id_pattern
                },
                'query': {
                    'type': 'string'
                },
                'language': {
                    'type': 'string',
                    'enum': ['zh_CN', 'zh_TW', 'en']
                }
            },
            "dependencies": {"query": ["language"]}
        }
        try:
            validate(params_json, schema)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_GetRelationIspartof_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.get_relation_ispartof(taxonomy_id, params_json)
        if code != 200:

            return res, code

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "get ispartof relation {} in taxonomy {} failed: {}".format(params_json, taxonomy_id, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_GetRelationIspartof_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500


@taxonomy_controller_app.route('/<taxonomy_id>/relation/custom', methods=["get"], strict_slashes=False)
def get_relation_custom(taxonomy_id):
    '''
    获取词的自定义关系列表
    '''
    try:
        # 校验taxonomy_id
        if not taxonomy_id.isdigit():
            message = 'taxonomy_id' + _l(" must be int ")
            code = codes.Builder_TaxonomyController_GetRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=message), 400
        taxonomy_id = int(taxonomy_id)
        if taxonomy_id <= 0:
            message = 'taxonomy_id' + _l(" must be int, and more than zero!")
            code = codes.Builder_TaxonomyController_GetRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            code = codes.Builder_TaxonomyController_GetRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=param_message), 400
        word_id_pattern = u'^[0-9a-f]+$'
        schema = {
            'type': 'object',
            "uniqueProperties": True,
            "additionalProperties": False,
            'required': ['word_id'],
            'properties': {
                'word_id': {
                    'type': 'string',
                    'minLength': 32,
                    'maxLength': 32,
                    'pattern': word_id_pattern
                },
                'query': {
                    'type': 'string'
                },
                'language': {
                    'type': 'string',
                    'enum': ['zh_CN', 'zh_TW', 'en']
                }
            },
            "dependencies": {"query": ["language"]}
        }
        try:
            validate(params_json, schema)
        except ValidationError as e:
            message = commonutil.handleParamError(e)
            code = codes.Builder_TaxonomyController_GetRelationCustom_ParamError

            return Gview.TErrorreturn(code, message=message), 400

        params_json['userId'] = request.headers.get('userId')
        params_json['roles'] = request.headers.get('roles')
        code, res = taxonomy_service.get_relation_custom(taxonomy_id, params_json)
        if code != 200:

            return res, code

        return res, code
    except Exception as e:
        error_log = log_oper.get_error_log(
            "get custom relation {} in taxonomy {} failed: {}".format(params_json, taxonomy_id, repr(e)),
            sys._getframe(),
            traceback.format_exc())
        Logger.log_error(error_log)
        code = codes.Builder_TaxonomyController_GetRelationCustom_UnknownError

        return Gview.TErrorreturn(code, description=str(e), cause=str(e)), 500

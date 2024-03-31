# -*- coding:utf-8 -*-
import copy

from flask_babel import gettext as _l
import re
from utils.CommonUtil import RegularEnum


class FunctionCheckParameters:
    VALID = 0
    INVALID = -1

    def params_check(self, params, all_params, required):
        """ 校验是否有缺少的参数或者额外的参数 """
        message = ''
        if 'timestamp' in params:
            params.remove('timestamp')
        # 缺少的参数
        lacked = list(set(required) - set(params))
        if len(lacked):
            message += _l("parameters:  %s  are Missing!,") % ", ".join(lacked)
        # 额外的参数
        extra = list(set(params) - set(all_params))
        if len(extra):
            message += _l("parameters:  %s  are not required!,") % ", ".join(extra)
        if message:
            return self.INVALID, message
        return self.VALID, message

    def create_function(self, params_json):
        all_params = ['knw_id', 'name', 'language', 'code', 'description', 'parameters']
        required = ['knw_id', 'name', 'language', 'code']
        code, message = self.params_check(params_json.keys(), all_params, required)
        for key, value in params_json.items():
            if key == 'knw_id':
                if not isinstance(value, int):
                    message += _l('parameter knw_id must be int. ')
                elif value <= 0:
                    message += _l('parameter knw_id must be larger than zero. ')
            elif key == 'name':
                if not isinstance(value, str):
                    message += _l('parameter name must be string. ')
                elif len(value) == 0:
                    message += _l('parameter name cannot be empty. ')
                elif len(value) > 50 or not re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        value):
                    message += "name" + _l(" only support English and Chinese, numbers and special symbols"
                                           " on the keyboard, and the length is 0-50 digits.")
            elif key == 'language':
                supported_language = ['nGQL']
                if not isinstance(value, str):
                    message += _l('parameter language must be string. ')
                elif len(value) == 0:
                    message += _l('parameter language cannot be empty. ')
                elif value not in supported_language:
                    message += _l('parameter language must be in {}; ').format(supported_language)
            elif key == 'code':
                if not isinstance(value, str):
                    message += _l('parameter code must be string. ')
                elif len(value) == 0:
                    message += _l('parameter code cannot be empty. ')
                elif len(value.encode()) > 16772150:
                    message += _l('The number of code bytes must be less than 16M;')
                else:
                    code_list = value.strip().split(';')
                    if len(code_list) > 2 or (len(code_list) == 2 and code_list[1] != ''):
                        message += _l('the code only supports a single statement. ')
            elif key == 'description':
                if not isinstance(value, str):
                    message += _l('parameter description must be string. ')
                elif len(value) > 150 or not (re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        value) or len(value) == 0):
                    message += 'description' + _l(" consists of Chinese, English, number and special symbols, and the length is 0-150 digits.")
            elif key == 'parameters':
                message += self.check_function_parameters(value)

        if message:
            return self.INVALID, message
        return self.VALID, message

    def edit_function(self, params_json):
        all_params = ['function_id', 'knw_id', 'name', 'language', 'code', 'description', 'parameters']
        required = ['function_id', 'knw_id', 'name', 'language', 'code']
        code, message = self.params_check(params_json.keys(), all_params, required)
        for key, value in params_json.items():
            if key == 'function_id':
                if not isinstance(value, int):
                    message += _l('parameter function_id must be int. ')
                elif value <= 0:
                    message += _l('parameter function_id must be larger than zero. ')
            elif key == 'knw_id':
                if not isinstance(value, int):
                    message += _l('parameter knw_id must be int. ')
                elif value <= 0:
                    message += _l('parameter knw_id must be larger than zero. ')
            elif key == 'name':
                if not isinstance(value, str):
                    message += _l('parameter name must be string. ')
                elif len(value) == 0:
                    message += _l('parameter name cannot be empty. ')
                elif len(value) > 50 or not re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        value):
                    message += "name" + _l(" only support English and Chinese, numbers and special symbols"
                                           " on the keyboard, and the length is 0-50 digits.")
            elif key == 'language':
                supported_language = ['nGQL']
                if not isinstance(value, str):
                    message += _l('parameter language must be string. ')
                elif len(value) == 0:
                    message += _l('parameter language cannot be empty. ')
                elif value not in supported_language:
                    message += _l('parameter language must be in {}; ').format(supported_language)
            elif key == 'code':
                if not isinstance(value, str):
                    message += _l('parameter code must be string. ')
                elif len(value) == 0:
                    message += _l('parameter code cannot be empty. ')
                elif len(value.encode()) > 16772150:
                    message += _l('The number of code bytes must be less than 16M;')
                else:
                    code_list = value.strip().split(';')
                    if len(code_list) > 2 or (len(code_list) == 2 and code_list[1] != ''):
                        message += _l('the code only supports a single statement. ')
            elif key == 'description':
                if not isinstance(value, str):
                    message += _l('parameter description must be string. ')
                elif len(value) > 150 or not (re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        value) or len(value) == 0):
                    message += 'description' + _l(" consists of Chinese, English, number and special symbols, and the length is 0-150 digits.")
            elif key == 'parameters':
                message += self.check_function_parameters(value)

        if message:
            return self.INVALID, message
        return self.VALID, message

    def delete_function(self, params_json):
        all_params = ['function_ids']
        required = ['function_ids']
        code, message = self.params_check(params_json.keys(), all_params, required)
        for key, value in params_json.items():
            if key == 'function_ids':
                function_ids = value
                if not isinstance(function_ids, list):
                    message += _l('parameter function_ids must be list. ')
                else:
                    for function_id in function_ids:
                        if not isinstance(function_id, int):
                            message += _l('function_id must be int. ')
                        elif function_id <= 0:
                            message += _l('function_id must be larger than zero. ')
        if message:
            return self.INVALID, message
        return self.VALID, message

    def get_function_list(self, params_json):
        all_params = ['knw_id', 'page', 'size', 'order_field', 'order_type', 'search', 'language']
        required = ['knw_id', 'page', 'size']
        code, message = self.params_check(list(params_json.keys()), all_params, required)
        for key, value in params_json.items():
            if key == 'knw_id':
                if not (isinstance(value, int) or value.isdigit()):
                    message += _l('parameter knw_id must be int. ')
                elif int(value) <= 0:
                    message += _l('parameter knw_id must be larger than zero. ')
            elif key == 'page':
                if not (isinstance(value, int) or value.isdigit()):
                    message += _l('parameter page must be int. ')
                elif int(value) <= 0:
                    message += _l('parameter page must be larger than zero. ')
            elif key == 'size':
                if not (isinstance(value, int) or value.isdigit()):
                    message += _l('parameter size must be int. ')
                elif int(value) <= 0:
                    message += _l('parameter size must be larger than zero. ')
            elif key == 'order_field':
                if not isinstance(value, str):
                    message += _l('parameter order_field must be string. ')
                elif len(value) != 0 and value not in ['update_time', 'create_time', 'name']:
                    message += _l('parameter order_field must be in ["update_time", "create_time", "name"];')
            elif key == 'order_type':
                if not isinstance(value, str):
                    message += _l('parameter order_type must be string. ')
                elif len(value) != 0 and value not in ['desc', 'asc']:
                    message += _l('parameter order_type must be in ["desc", "asc"];')
            elif key == 'search':
                if not isinstance(value, str):
                    message += _l('parameter search must be string. ')
            elif key == 'language':
                supported_language = ['nGQL']
                if not isinstance(value, str):
                    message += _l('parameter language must be string. ')
                elif value not in supported_language and value != '':
                    message += _l('parameter language must be in {}; ').format(supported_language)
        if message:
            return self.INVALID, message
        return self.VALID, message

    def get_function_by_id(self, params_json):
        all_params = ['function_id']
        required = ['function_id']
        code, message = self.params_check(list(params_json.keys()), all_params, required)
        for key, value in params_json.items():
            if key == 'function_id':
                if not (isinstance(value, int) or value.isdigit()):
                    message += _l('parameter function_id must be int. ')
        if message:
            return self.INVALID, message
        return self.VALID, message

    def check_function_parameters(self, value):
        function_param = ['name', 'alias', 'description', 'position', 'param_type', 'options']
        required = ['name', 'alias', 'position', 'param_type']
        message = ''
        parameter_names = []
        if not isinstance(value, list):
            message += _l('parameter parameters must be list. ')
        else:
            for index, parameter in enumerate(value, 1):
                if not isinstance(parameter, dict):
                    message += _l('the content in the list must be a dict.')
                else:
                    param_required = copy.deepcopy(required)
                    if str(parameter.get('param_type', '')) == 'entity':
                        param_required.append('options')
                    code, param_message = self.params_check(parameter.keys(), function_param, param_required)
                    message += param_message.replace("parameters", "function_param").replace("参数", "函数代码参数")
                    for parameter_key, parameter_value in parameter.items():
                        if parameter_key == 'name':
                            if not isinstance(parameter_value, str):
                                message += _l('the name of function_param No.{} must be string. ').format(index)
                            elif len(parameter_value) == 0:
                                message += _l('the name of function_param No.{} cannot be empty. ').format(index)
                            elif len(parameter_value) > 50 or not re.search(u'^[_a-z]+$', parameter_value):
                                message += _l(
                                    "the name of function_param No.{} cannot exceed 50 characters and characters must "
                                    "be lowercase english letters and _ . ").format(index)
                            elif parameter_value in parameter_names:
                                message += _l('the name of function_param No.{} cannot be created repeatedly;').format(index)
                                return message
                            parameter_names.append(parameter_value)
                        elif parameter_key == 'alias':
                            if not isinstance(parameter_value, str):
                                message += _l('the alias of function_param No.{} must be string. ').format(index)
                            elif len(parameter_value) == 0:
                                message += _l('the alias of function_param No.{} cannot be empty. ').format(index)
                            elif len(parameter_value) > 50 or \
                                    not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, parameter_value):
                                message += _l(
                                    "the alias of function_param No.{} cannot exceed 50 characters and characters must "
                                    "be numbers, _, chinese or english. ").format(index)
                        elif parameter_key == 'description':
                            if not isinstance(parameter_value, str):
                                message += _l('the description of function_param No.{} must be string. ').format(index)
                            elif len(parameter_value) > 1000 or not (re.search(
                                    RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                    parameter_value) or len(parameter_value) == 0):
                                message += _l('the description of function_param No.{} consists of Chinese, English, '
                                              'number and special symbols, and the length is 0-1000 digits.').format(index)
                        elif parameter_key == 'position':
                            if not isinstance(parameter_value, list):
                                message += _l('the position of function_param No.{} must be a list;').format(index)
                            else:
                                for position_info in parameter_value:
                                    if not isinstance(position_info, dict):
                                        message += _l('the information in position of function_param No.{} '
                                                      'must be a dict .').format(index)
                                    elif set(position_info.keys()) != {'pos', 'example'}:
                                        message += _l('the information in position of function_param No.{} not find'
                                                      ' key "pos" and "example" .').format(index)
                                    else:
                                        pos = position_info["pos"]
                                        if not isinstance(pos, list):
                                            message += _l('the pos in the position information of function_param'
                                                          ' No.{} must be a list;').format(index)
                                        elif len(pos) != 3:
                                            message += _l('the pos in the position information of function_param'
                                                          ' No.{} length must be 3;').format(index)
                                        else:
                                            flag = True
                                            for p in pos:
                                                if not isinstance(p, int) or p < 0:
                                                    message += _l(
                                                        'the value in position of function_param No.{} must be int'
                                                        ' and cannot be less than zero; ').format(index)
                                                    flag = False
                                            if flag:
                                                start_position = pos[1]
                                                end_position = pos[2]
                                                if start_position >= end_position:
                                                    message += _l(
                                                        'the value in position of function_param No.{} end_position '
                                                        'must more than start_position;').format(index)
                        elif parameter_key == 'param_type':
                            supported_type = ["entity", "string"]
                            if not isinstance(parameter_value, str):
                                message += _l('the param_type of function_param No.{} must be string. ').format(index)
                            elif parameter_value not in supported_type:
                                message += _l('the param_type of function_param No.{} must be in {}. ').format(index, supported_type)
                        elif parameter_key == "options":
                            supported_options = ["single", "multiple"]
                            if not isinstance(parameter_value, str):
                                message += _l('the options of function_param No.{} must be string. ').format(index)
                            elif parameter_value not in supported_options:
                                message += _l('the options of function_param No.{} must be in {}. ').format(index, supported_options)
        return message


function_check_parameters = FunctionCheckParameters()

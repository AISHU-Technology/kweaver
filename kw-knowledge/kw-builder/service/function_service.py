# -*- coding:utf-8 -*-
from dao.function_dao import function_dao
from dao.knw_dao import knw_dao
from common.errorcode import codes
from common.errorcode.gview import Gview


class FunctionService:
    def create_function(self, params_json):
        knw_id = params_json['knw_id']
        name = params_json['name']
        # knw_id not exist
        res = knw_dao.check_knw_id(knw_id)
        if len(res) == 0:
            code = codes.Builder_FunctionService_CreateFunction_KnwIdNotExist

            return 500, Gview.error_return(code, knw_id=knw_id)
        # duplicate name
        duplicated = function_dao.get_function_by_name_and_knw_id(name, knw_id)
        if duplicated:
            code = codes.Builder_FunctionService_CreateFunction_DuplicatedName

            return 500, Gview.error_return(code, name=name)
        # insert function
        function_id = function_dao.insert_function(params_json)
        res_dict = {"message": "create function success", "function_id": function_id}
            
        return 200, res_dict

    def edit_function(self, params_json):
        function_id = params_json.get('function_id')
        knw_id = params_json['knw_id']
        name = params_json['name']
        # function_id not exits
        existed = function_dao.get_function_by_id(function_id)
        if not existed:
            code = codes.Builder_FunctionService_EditFunction_FunctionIdNotExist

            return 500, Gview.error_return(code, function_id=function_id)
        # knw_id not exist
        res = knw_dao.check_knw_id(knw_id)
        if len(res) == 0:
            code = codes.Builder_FunctionService_EditFunction_KnwIdNotExist

            return 500, Gview.error_return(code, knw_id=knw_id)
        # duplicate name
        duplicated = function_dao.get_function_by_name_and_knw_id(name, knw_id, function_id=function_id)
        if duplicated:
            code = codes.Builder_FunctionService_EditFunction_DuplicatedName

            return 500, Gview.error_return(code, name=name)
        # update function
        function_dao.update_function(params_json)
            
        return 200, 'success'

    def delete_function(self, params_json):
        function_ids = params_json.get('function_ids')
        function_dao.delete_function(function_ids)
        res_dict = {"message": "delete functions success", "function_ids": params_json.get('function_ids')}
            
        return 200, res_dict

    def get_function_list(self, params_json):
        knw_id = params_json["knw_id"]
        # knw_id not exist
        res = knw_dao.check_knw_id(knw_id)
        if len(res) == 0:
            code = codes.Builder_FunctionService_GetFunctionList_KnwIdNotExist

            return 500, Gview.error_return(code, knw_id=knw_id)

        count = function_dao.get_function_list_count(params_json)
        functions = function_dao.get_function_list(params_json) if count != 0 else []
        res_dict = {"count": count, "functions": functions}
            
        return 200, Gview.json_return(res_dict)

    def get_function_by_id(self, params_json):
        function_id = params_json.get('function_id')
        # get basic information
        res = function_dao.get_function_detail_by_id(function_id)
        if not res:
            code = codes.Builder_FunctionService_GetFunctionById_FunctionIdNotExist

            return 500, Gview.error_return(code, function_id=function_id)
        res['parameters'] = eval(res['parameters'])
            
        return 200, Gview.json_return(res)


function_service = FunctionService()

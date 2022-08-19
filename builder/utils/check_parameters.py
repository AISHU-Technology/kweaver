# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn


from flask import request
import json


class CheckParameters(object):
    VALID = 0
    INVALID = -1
    # 某些参数只有固定值
    rule_dict = {}
    rule_dict["dataType"] = ["structured", "unstructured"]
    # rule_dict["extract_type"] = ["standardExtraction", "modelExtraction", "labelExtraction"]
    # rule_dict["data_source"] = ["mysql", "hive", "as", "as7"]
    rule_dict["extract_type"] = ["standardExtraction", "modelExtraction", "labelExtraction"]
    rule_dict["data_source"] = ["mysql", "hive", "as", "as7", "rabbitmq"]
    # 定义接口的参数
    dict_params = {}
    ds_contest_params = ["data_source", "ds_address", "ds_port", "ds_user", "ds_password", "ds_path"]
    ds_add_params = ["dsname", "dataType", "data_source", "ds_address", "ds_port", "ds_password",
                     "ds_path", "extract_type"]
    ds_getall_params = ["page", "size"]
    ds_getbyname_params = ["page", "size", "dsname"]
    ds_del_params = ["dsids"]
    dict_params["ds_contest_params"] = ds_contest_params
    dict_params["ds_add_params"] = ds_add_params
    dict_params["ds_getall_params"] = ds_getall_params
    dict_params["ds_getbyname_params"] = ds_getbyname_params
    dict_params["ds_del_params"] = ds_del_params

    @classmethod
    def params_check(cls, method):
        ret_status = cls.VALID
        message = ""
        # 请求的参数 如果请求的参数没有定义未处理
        params_json = request.args.to_dict()
        print(params_json, "1111")
        if request.method == "POST":
            params_json2 = request.get_data()
            params_json = json.loads(params_json2)
            print(params_json)
        # 定义的参数
        diy_params = cls.dict_params[method]
        # 1.不在请求中,2.在请求中没有值,3.满足12但不符合参数本身的规则
        message_dict = {"no_request": [], "request_illegal": [], "no_rule": []}
        for param in diy_params:
            # 要校验的参数是否在请求中，不在就是为空
            if param in params_json.keys():
                value = params_json[param]
                if param == "dsids":
                    ret_st, params, delmessage = CheckParameters.dsdelcheck(None, param, value)
                    if ret_st != 0:
                        message_dict["request_illegal"].append(param)
                        ret_status = cls.INVALID
                        return ret_status, params_json, delmessage
                    else:
                        return ret_status, params, delmessage

                # 整型校验
                if param == "ds_port" or param == "page" or param == "size":
                    if not value.isdigit():
                        message_dict["no_rule"].append(param)
                        ret_status = cls.INVALID
                    if isinstance(value, int) and param == "page":
                        if int(value) <= 0:
                            message_dict["no_rule"].append(param)
                            ret_status = cls.INVALID
                else:
                    # 长度不能为0 不能全是空格
                    if len(value) == 0 or value.isspace():
                        message_dict["request_illegal"].append(param)
                        ret_status = cls.INVALID
                # data_source 不是mysql as  hive
                if param == "data_source" or param == "extract_type" or param == "dataType":
                    if value not in cls.rule_dict[param]:
                        message_dict["no_rule"].append(param)
                        ret_status = cls.INVALID

            else:
                message_dict["no_request"].append(param)
                ret_status = cls.INVALID
        if len(message_dict["no_request"]) > 0:
            message += "%s can not be empty !" % ",".join(message_dict["no_request"])
        if len(message_dict["request_illegal"]) > 0:
            message += "%s illegal!" % ",".join(message_dict["request_illegal"])
        if len(message_dict["no_rule"]) > 0:
            message += "%s no rule!" % ",".join(message_dict["no_rule"])

        return ret_status, params_json, message

    def dsdelcheck(self, param, value):
        ret_status = 0
        message = ""
        flag_digit = True
        try:
            ids = json.loads(value)
            if type(ids).__name__ == "list":
                if len(ids) > 0:
                    for id1 in ids:
                        if not isinstance(id1, int):
                            flag_digit = False
                    if flag_digit:
                        return ret_status, ids, message
                    else:
                        ret_status = -1
                        message = "all element must be int"
                        return ret_status, param, message


                else:
                    ret_status = -1
                    message = "至少选择一个要删除的数据"
                    return ret_status, param, message
            else:
                ret_status = -1
                message = "参数数据类型必须是list"
                return ret_status, param, message
        except Exception as e:
            err = repr(e)
            ret_status = -1
            message = err
            return ret_status, param, message

    @classmethod
    def del_check(cls, method):
        ret_status = cls.VALID
        message = ""

        default_param_value = None

        params_json = request.args.to_dict()
        ids = params_json["ids", default_param_value]
        if ids is None:
            ret_status = cls.INVALID
            message = "请填写 ids"
        return ret_status, params_json, message

    #  登录参数校验
    @classmethod
    def login_check(cls, g):
        ret_status = cls.VALID
        default_param_value = None
        request_args_dict = g.request_info_dict['ARGS_DICT']
        account = request_args_dict.get('account', default_param_value)
        password = request_args_dict.get('password', default_param_value)

        if account is None or password is None:
            ret_status = cls.INVALID

        return ret_status, request_args_dict

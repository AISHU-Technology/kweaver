# -*-coding:utf-8-*-
# @Time    : 2020/8/18 23:14
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from utils.CommonUtil import commonutil, RegularEnum
import re
import regex
from flask_babel import gettext as _l
from utils.log_info import Logger


class DsCheckParameters(object):
    VALID = 0
    INVALID = -1
    rule_dict = {}
    rule_dict["data_type"] = ["structured", "unstructured"]
    rule_dict["extract_type"] = ["standardExtraction", "modelExtraction"]
    rule_dict["data_source"] = ["mysql", "hive", "sqlserver", "kingbasees", "postgresql",
                                "clickhouse"]
    ds_getall_params = ["page", "size", "order", "knw_id", 'filter', 'ds_type']
    task_status_params = ["page", "size", "order", "status"]
    search_taskbyname_params = ["page", "size", "order", "graph_name", "status", "task_type", "trigger_type", 'rule']
    ds_add_params = ("ds_name", "data_type", "data_source", "ds_address", "ds_port", "ds_user", "ds_password", "ds_path",
                     "extract_type", "ds_auth", "vhost", "queue", "json_schema", "knw_id", "connect_type")
    ds_edit_params = ("ds_name", "data_source", "ds_port", "ds_user", "ds_password", "ds_auth", "json_schema", "connect_type")
    ds_contest_params = (
        "ds_id", "data_source", "ds_address", "ds_port", "ds_user", "ds_password", "ds_path", "ds_auth",
        "vhost", "queue", "connect_type")

    ds_getbyname_params = ["page", "size", "ds_name", "order", "knw_id"]
    ds_auth_params = ["ds_route", "ds_address", "ds_auth"]
    ds_gettoken_params = ["ds_code", "ds_auth"]
    ds_verify_params = ["ds_auth"]

    def gettaskbystatusPar(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        for pa in self.task_status_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += " parameters: %s can not be empty !" % ",".join(
                message_dict["no_request"])
            return ret_status, message
        for k in params_json.keys():
            if k in self.task_status_params:
                value = params_json[k]
                if k == "page":
                    if value == "-1":
                        continue
                    else:
                        if not value.isdigit() or value == "0":
                            message += _l(" parameters: ") + k + _l(" must be int, and more than zero!")
                            ret_status = self.INVALID

                elif k == "order":
                    if value not in ["ascend", "descend"]:
                        message += " parameters: " + k + " must be ascend or descend!"
                        ret_status = self.INVALID
                elif k == "status":
                    if value not in ["normal", "edit", "running", "waiting", "failed", "stop", "all"]:
                        message += " parameters: " + k + " must be ascend or descend!"
                        ret_status = self.INVALID
                elif k == "graph_name":
                    if len(value) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, value):
                        message += " parameters: " + k + " Length over 50 or Characters are not _, Chinese, English！"
                        ret_status = self.INVALID

                else:
                    if not value.isdigit() or value == "0":
                        message += " parameters: " + k + " must be int, and more than zero!"
                        ret_status = self.INVALID

            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID

        if len(message_dict["request_error"]) > 0:
            message += _l(" parameters:  %s  error!") % ",".join(message_dict["request_error"])
        if len(message_dict["request_illegal"]) > 0:
            message += _l(" parameters: %s illegal!") % ",".join(message_dict["request_illegal"])
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
        return ret_status, message

    def searchtaskbynamePar(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        for pa in self.search_taskbyname_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += _l("parameters: %s can not be empty!") % ",".join(
                message_dict["no_request"])
            return ret_status, message
        for k in params_json.keys():
            if k in self.search_taskbyname_params:
                value = params_json[k]
                if k == "page":
                    if value == "-1":
                        continue
                    else:
                        if not value.isdigit() or value == "0":
                            message += _l("parameters: page must be int, and more than zero!")
                            ret_status = self.INVALID
                elif k == "order":
                    if value not in ["asc", "desc"]:
                        message += _l("parameters: order must be asc or desc!")
                        ret_status = self.INVALID
                elif k == "status":
                    if value not in ["normal", "running", "waiting", "failed", "stop", "all"]:
                        message += _l("parameters: status must be in (normal, running, waiting, failed, stop, all)!")
                        ret_status = self.INVALID
                elif k == "graph_name":
                    if len(value) > 50:
                        message += _l("parameters: graph_name Length over 50.")
                        ret_status = self.INVALID
                elif k == "size":
                    if not value.isdigit() or value == "0":
                        message += _l("parameters: size must be int, and more than zero!")
                        ret_status = self.INVALID
                elif k == "task_type":
                    if value not in ("full", "increment", "all"):
                        message += _l("parameters: tas_type must be in (full,increment,all)")
                        ret_status = self.INVALID
                elif k == "trigger_type":
                    if value not in ("0", "1", "2", "all"):
                        message += _l("parameters: trigger_type must be in (0,1,2,all)")
                        ret_status = self.INVALID
                elif k == 'rule':
                    rules = ('start_time', 'end_time')
                    if value not in rules:
                        message += _l("Parameter %s must be in %s. ") % (k, rules)
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID

        if len(message_dict["request_error"]) > 0:
            message += _l("parameters: %s error!") % ",".join(message_dict["request_error"])
        if len(message_dict["request_illegal"]) > 0:
            message += _l("parameters: %s illegal!") % ",".join(message_dict["request_illegal"])
        if len(message_dict["no_rule"]) > 0:
            message += _l("parameters: %s no rule!") % ",".join(message_dict["no_rule"])
        if message == "":
            message = _l("unknown error!")
        return ret_status, message

    def getAllPar(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        for pa in self.ds_getall_params:
            if pa not in params_json.keys() and pa not in ['filter', "ds_type"]:
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += _l(" parameters: %s can not be empty !") % ",".join(
                message_dict["no_request"])
            return ret_status, message
        for k in params_json.keys():
            if k in self.ds_getall_params:
                value = params_json[k]
                if k == "page":
                    if value == "-1":
                        continue
                    else:
                        if not value.isdigit() or value == "0":
                            message += _l(" parameters: ") + k + _l(" must be int, and more than zero!")
                            ret_status = self.INVALID

                elif k == "order":
                    if value not in ["ascend", "descend"]:
                        message += _l(" parameters: ") + k + _l(" must be ascend or descend!")
                        ret_status = self.INVALID
                elif k == "task_status":
                    if value not in ["normal", "waiting", "failed", "stop", "all"]:
                        message += _l(" parameters: ") + k + _l(" must be in [normal, waiting, failed, stop, all]!")
                        ret_status = self.INVALID
                elif k == "trigger_type":
                    if value not in [0, 1, 2]:
                        message += _l(" parameters: ") + k + _l(" must be 0, 1, 2!")
                        ret_status = self.INVALID
                elif k == "task_type":
                    if value not in ["full", "increment"]:
                        message += _l(" parameters: ") + k + _l(" must be full or increment!")
                        ret_status = self.INVALID
                elif k == 'filter':
                    if value not in ['structured']:
                        message += _l(" parameters: ") + k + _l(" must be structured!")
                        ret_status = self.INVALID
                elif k == 'knw_id':
                    if value == "-1":
                        continue
                    else:
                        if not value.isdigit() or value == "0":
                            message += _l(" parameters: ") + k + _l(" must be int, and more than zero!")
                            ret_status = self.INVALID
                elif k == 'ds_type':
                    if value not in self.rule_dict["data_source"]:
                        message += _l("Parameter %s must be in %s. ") % (k, str(self.rule_dict["data_source"]))
                        ret_status = self.INVALID
                else:
                    if not value.isdigit() or value == "0":
                        message += _l(" parameters: ") + k + _l(" must be int, and more than zero!")
                        ret_status = self.INVALID
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID

        if len(message_dict["request_error"]) > 0:
            message += _l(" parameters:  %s  error!") % ",".join(message_dict["request_error"])
        if len(message_dict["request_illegal"]) > 0:
            message += _l(" parameters: %s illegal!") % ",".join(message_dict["request_illegal"])
        if len(message_dict["no_rule"]) > 0:
            message += _l(" parameters: %s no rule!") % ",".join(message_dict["no_rule"])
        if message == "":
            message = _l("unknown error!")
        return ret_status, message

    # 新建数据源参数校验
    def dsAddPar(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        ds_add_params = list(self.ds_add_params)

        if "data_source" in params_json:
            datasource = params_json["data_source"]
            if "ds_auth" in ds_add_params:
                ds_add_params.remove("ds_auth")
        else:
            message_dict["no_request"].append("data_source")
            ret_status = self.INVALID
        try:
            # 缺少参数
            for pa in ds_add_params:
                if pa not in params_json.keys():
                    message_dict["no_request"].append(pa)
                    ret_status = self.INVALID
            # 缺少参数
            if len(message_dict["no_request"]) > 0:
                message += _l(" parameters: %s can not be empty !") % ",".join(
                    message_dict["no_request"])
                return ret_status, message

            for k in params_json.keys():
                # 正确的参数 校验值
                if k in ds_add_params:
                    value = params_json[k]
                    # value = str(value)
                    if k == "ds_port" or k == "data_type" or k == "extract_type" or k == "data_source":
                        continue

                    elif k == "ds_address":
                        if not isinstance(value, str):
                            message += _l(" parameters: ") + k + _l(" must be str！")
                            ret_status = self.INVALID
                        else:
                            data_source = params_json["data_source"]
                            if not commonutil.is_valid_domain(value):
                                message += _l(" parameters: ") + k + _l(" irregular！")
                                ret_status = self.INVALID

                    elif k == "ds_name":
                        if not isinstance(value, str):
                            message += _l(" parameters: ") + k + _l(" must be str！")
                            ret_status = self.INVALID
                        else:
                            if len(value) > 50 or len(value) == 0 or not (re.search(
                                    RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                    value)):
                                message += _l(" parameters: ") + k + _l(
                                    " only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits.")
                                ret_status = self.INVALID
                    elif k == "ds_auth":
                        if not isinstance(value, str):

                            message += _l("ds_auth must be str")
                            ret_status = self.INVALID
                        else:
                            if not value.isdigit() and value != "":
                                message += _l(" parameters: " + "ds_auth" + " must be number")
                                ret_status = self.INVALID
                    elif k == "vhost" or k == "queue":
                        pass
                    elif k == "json_schema":
                        if not isinstance(value, str):
                            message += _l(" parameters: " + "json_schema" + " must be json_string; ")
                            ret_status = self.INVALID

                    elif k == "knw_id":
                        value = params_json[k]
                        if not isinstance(value, int):
                            message += _l(" parameters: ") + k + _l(" must be number！")
                            ret_status = self.INVALID
                        elif value <= 0:
                            message += _l(" parameters: ") + k + _l(" can not be 0！")
                            ret_status = self.INVALID
                    elif k == "connect_type":
                        if not isinstance(value, str):
                            message += _l(" parameters: ") + k + _l(" must be str！")
                            ret_status = self.INVALID
                        else:
                            if params_json["data_source"] in self.rule_dict["data_source"]:
                                connect_type = params_json["connect_type"]
                                if connect_type == "odbc":
                                    if params_json["data_source"] != "mysql" and params_json[
                                        "data_source"] != "sqlserver" and params_json["data_source"] != "kingbasees":
                                        message += params_json["data_source"] + _l(" do not have the connect type")
                                        ret_status = self.INVALID
                                elif connect_type == "":
                                    if params_json["data_source"] == "sqlserver":
                                        message += params_json["data_source"] + _l(" must use odbc connect type")
                                        ret_status = self.INVALID
                                else:
                                    message += _l("connect_type must be 'odbc' or ''")
                                    ret_status = self.INVALID
                    else:
                        if not isinstance(value, str):
                            message += _l(" parameters: ") + k + _l(" must be str！")
                            ret_status = self.INVALID
                        else:
                            if k == "ds_path":
                                if params_json["data_source"] != "rabbitmq":
                                    # 所有参数值 校验是否包含空格或为空
                                    if value == "":
                                        message_dict["request_illegal"].append(k)
                                        ret_status = self.INVALID
                            else:
                                # 所有参数值 校验是否包含空格或为空
                                if not value == ''.join(value.split()) or value == "":
                                    message_dict["request_illegal"].append(k)
                                    ret_status = self.INVALID


                else:  # 多余的错误参数
                    # 注释 api 如果传入错误请求参数，要校验
                    if k != "timestamp":
                        message_dict["request_error"].append(k)
                        ret_status = self.INVALID

            ds_port = params_json.get("ds_port")
            data_type = params_json.get("data_type")
            extract_type = params_json.get("extract_type")
            data_source = params_json.get("data_source")
            if ds_port is not None:
                if type(ds_port) != int:
                    message += _l(" parameters: ds_port must be int")
                    ret_status = self.INVALID
                else:
                    if ds_port > 65535 or ds_port < 1:
                        message += _l(" parameters: ds_port must in 1~65535")
                        ret_status = self.INVALID
            else:
                message += _l(" parameters: ds_port must be int")
                ret_status = self.INVALID

            if data_type is not None:
                if data_type not in self.rule_dict["data_type"]:
                    message_dict["no_rule"].append("data_type")
                    ret_status = self.INVALID
            else:
                message += _l(" parameters: data_type must be str")
                ret_status = self.INVALID
            if extract_type is not None:
                if extract_type not in self.rule_dict["extract_type"]:
                    message_dict["no_rule"].append("extract_type")
                    ret_status = self.INVALID
            else:
                message += _l(" parameters: extract_type must be str")
                ret_status = self.INVALID

            if data_source is not None:
                if data_source not in self.rule_dict["data_source"]:
                    message_dict["no_rule"].append("data_source")
                    ret_status = self.INVALID
            else:
                message += _l(" parameters: data_source must be str")
                ret_status = self.INVALID

            if data_type == "structured":
                # if extract_type is not None:
                #     if extract_type not in self.rule_dict["extract_type"]:
                #         message_dict["no_rule"].append("extract_type")
                #         ret_status = self.INVALID
                #     else:
                if extract_type not in ["standardExtraction"]:
                    message += _l(" parameters:data_type is structured  parameters:extract_type must be standardExtraction!")
                    ret_status = self.INVALID

                # if data_source is not None:
                #     if data_source not in self.rule_dict["data_source"]:
                #         message_dict["no_rule"].append("data_source")
                #         ret_status = self.INVALID

            elif data_type == "unstructured":
                if extract_type is not None:
                    if extract_type != "modelExtraction":
                        message += _l("parameters: data_type is unstructured  parameters: extract_type must be modelExtraction!")
                        ret_status = self.INVALID

                if data_source is not None:
                    message += _l(" parameters:data_type is unstructured  parameters:data_source must be Anyshare!")
                    ret_status = self.INVALID

            # 参数多余，错误的参数
            if len(message_dict["request_error"]) > 0:
                message += _l(" parameters:  %s  error!") % ",".join(message_dict["request_error"])

            # 参数值错误
            if len(message_dict["request_illegal"]) > 0:
                message += _l(" parameters: %s illegal!") % ",".join(message_dict["request_illegal"])
            # 不符合规则
            if len(message_dict["no_rule"]) > 0:
                message += _l(" parameters: %s no rule!") % ",".join(message_dict["no_rule"])
            if message == "":
                message = _l("unknown error!")
        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID
        return ret_status, message

    # 编辑数据源参数校验
    def dsEditPar(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        ds_add_params = list(self.ds_edit_params)
        if not isinstance(params_json, dict):
            message = _l("parameters must be json")
            ret_status = self.INVALID
            return ret_status, message
        data_source = params_json.get("data_source")
        if data_source is not None:
            if data_source not in self.rule_dict["data_source"]:
                message += _l(" parameters: data_source must be [mysql, hive, sqlserver, kingbasees, postgresql]")
                ret_status = self.INVALID
                return ret_status, message
        else:
            message += _l(" parameters: data_source can not be empty !")
            ret_status = self.INVALID
            return ret_status, message

        if "data_source" in params_json:
            if data_source != "rabbitmq" and "json_schema" in ds_add_params:
                ds_add_params.remove("json_schema")
            if "ds_auth" in ds_add_params:
                ds_add_params.remove("ds_auth")
            if "ds_port" in ds_add_params:
                ds_add_params.remove("ds_port")
        else:
            message_dict["no_request"].append("data_source")
            ret_status = self.INVALID
        try:
            # 缺少参数
            for pa in ds_add_params:
                if pa not in params_json.keys():
                    message_dict["no_request"].append(pa)
                    ret_status = self.INVALID
            # 缺少参数
            if len(message_dict["no_request"]) > 0:
                message += _l(" parameters: %s can not be empty !") % ",".join(
                    message_dict["no_request"])
                return ret_status, message

            for k in params_json.keys():
                # 正确的参数 校验值
                if k in ds_add_params:
                    value = params_json[k]
                    # value = str(value)
                    if k == "ds_port" or k == "data_source":
                        continue

                    elif k == "ds_name":
                        if not isinstance(value, str):
                            message += _l(" parameters: ") + k + _l(" must be str！")
                            ret_status = self.INVALID
                        else:
                            if len(value) > 50 or len(value) == 0 or not (re.search(
                                    RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                                    value)):
                                message += _l(" parameters: ") + k + _l(
                                    " only support English and Chinese, numbers and special symbols on the keyboard, and the length is 0-50 digits.")
                                ret_status = self.INVALID
                    elif k == "json_schema":
                        if not isinstance(value, str):
                            message += _l(" parameters: " + "json_schema" + " must be json_string; ")
                            ret_status = self.INVALID
                    elif k == "ds_auth":
                        if not isinstance(value, str):

                            message += _l("ds_auth must be str")
                            ret_status = self.INVALID
                        else:
                            if not value.isdigit() and value != "":
                                message += _l(" parameters: " + "ds_auth" + " must be number")
                                ret_status = self.INVALID
                    elif k == "connect_type":
                        if type(value) != str:
                            message += _l(" parameters: ") + k + _l(" must be str！")
                            ret_status = self.INVALID
                        else:
                            if params_json["data_source"] in self.rule_dict["data_source"]:
                                connect_type = params_json["connect_type"]
                                if connect_type == "odbc":
                                    if params_json["data_source"] != "mysql" and params_json["data_source"] != "sqlserver" and params_json["data_source"] != "kingbasees":
                                        message += params_json["data_source"] + _l(" do not have the connect type")
                                        ret_status = self.INVALID
                                elif connect_type == "":
                                    if params_json["data_source"] == "sqlserver":
                                        message += params_json["data_source"] + _l(" must use odbc connect type")
                                        ret_status = self.INVALID
                                else:
                                    message += _l("connect_type must be 'odbc' or ''")
                                    ret_status = self.INVALID
                    else:
                        if not isinstance(value, str):
                            message += _l(" parameters: ") + k + _l(" must be str！")
                            ret_status = self.INVALID
                        else:
                            # 所有参数值 校验是否包含空格或为空
                            if not value == ''.join(value.split()) or value == "":
                                message_dict["request_illegal"].append(k)
                                ret_status = self.INVALID
                else:  # 多余的错误参数
                    # 注释 api 如果传入错误请求参数，要校验
                    if k != "timestamp" and k != "json_schema":
                        message_dict["request_error"].append(k)
                        ret_status = self.INVALID

            ds_port = params_json.get("ds_port")

            if ds_port is not None:
                if type(ds_port) != int:
                    message += _l(" parameters: ds_port must be int")
                    ret_status = self.INVALID
                else:
                    if ds_port > 65535 or ds_port < 1:
                        message += _l(" parameters: ds_port must in 1~65535")
                        ret_status = self.INVALID

            # 参数多余，错误的参数
            if len(message_dict["request_error"]) > 0:
                message += _l(" parameters:  %s  error!") % ",".join(message_dict["request_error"])
            # 参数值错误
            if len(message_dict["request_illegal"]) > 0:
                message += _l(" parameters: %s illegal!") % ",".join(message_dict["request_illegal"])
            # 不符合规则
            if len(message_dict["no_rule"]) > 0:
                message += _l(" parameters: %s no rule!") % ",".join(message_dict["no_rule"])
            if message == "":
                message = _l("unknown error!")
        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID
        return ret_status, message

    def testConPar(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        ds_contest_params = list(self.ds_contest_params)
        if not isinstance(params_json, dict):
            message = _l("parameters must be json")
            ret_status = self.INVALID
            return ret_status, message
        # 缺少参数
        if "data_source" in params_json:
            datasource = params_json["data_source"]
            if "ds_auth" in ds_contest_params:
                ds_contest_params.remove("ds_auth")

        else:
            message_dict["no_request"].append("data_source")
            ret_status = self.INVALID
        for pa in ds_contest_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += _l(" parameters: %s can not be empty !") % ",".join(
                message_dict["no_request"])
            return ret_status, message

        for k in params_json.keys():
            if k in ds_contest_params:
                value = params_json[k]
                #  某些参数是否是数字
                if k == "ds_port":
                    if type(value) != int:
                        message += _l(" parameters: ds_port must be int !")
                        ret_status = self.INVALID
                    else:
                        if value > 65535 or value < 1:
                            message += _l(" parameters: ds_port must in 1~65535 !")
                            ret_status = self.INVALID
                elif k == "ds_id":
                    if not isinstance(value, int):
                        message += _l("parameters: ds_id must be int !")
                        ret_status = self.INVALID
                elif k == "ds_auth":
                    if not isinstance(value, str):

                        message += _l("parameters: ds_auth must be str !")
                        ret_status = self.INVALID
                    else:
                        if not value.isdigit() and value != "":
                            message += _l(" parameters: " + "ds_auth" + " must be number !")
                            ret_status = self.INVALID
                    # if not isinstance(value, int):
                    #     message += " parameters: " + k + " must be int"
                    #     ret_status = self.INVALID

                elif k == "data_source":
                    if value not in self.rule_dict["data_source"]:
                        message_dict["no_rule"].append("data_source")
                        ret_status = self.INVALID
                elif k == "vhost" or k == "queue":
                    pass
                elif k == "ds_address":
                    if type(value) != str:
                        message += _l(" parameters: ") + k + _l(" must be str！")
                        ret_status = self.INVALID
                    else:
                        data_source = params_json["data_source"]
                        value = value.split("://")[-1]
                        if not commonutil.is_valid_domain(value):
                            message += _l(" parameters: ") + k + _l(" irregular！")
                            ret_status = self.INVALID
                    if not isinstance(value, str):
                        message += _l(" parameters: ") + k + _l(" must be str")
                        ret_status = self.INVALID
                        # 所有参数值 校验是否包含空格或为空
                    else:
                        if not value == ''.join(value.split()) or value == "":
                            message_dict["request_illegal"].append(k)
                            ret_status = self.INVALID
                elif k == "connect_type":
                    if type(value) != str:
                        message += _l(" parameters: ") + k + _l(" must be str！")
                        ret_status = self.INVALID
                    else:
                        if params_json["data_source"] in self.rule_dict["data_source"]:
                            connect_type = params_json["connect_type"]
                            if connect_type == "odbc":
                                if params_json["data_source"] != "mysql" and params_json["data_source"] != "sqlserver" and params_json["data_source"] != "kingbasees":
                                    message += params_json["data_source"] + _l(" do not have the connect type")
                                    ret_status = self.INVALID
                            elif connect_type == "":
                                if params_json["data_source"] == "sqlserver":
                                    message += params_json["data_source"] + _l(" must use odbc connect type")
                                    ret_status = self.INVALID
                            else:
                                message += _l("connect_type must be 'odbc' or ''")
                                ret_status = self.INVALID
                else:
                    if not isinstance(value, str):
                        message += _l(" parameters: ") + k + _l(" must be str！")
                        ret_status = self.INVALID
                    else:
                        if k == "ds_path":
                            # 所有参数值 校验是否包含空格或为空
                            if value == "" and params_json["data_source"] != "rabbitmq":
                                message_dict["request_illegal"].append(k)
                                ret_status = self.INVALID
                        else:
                            # 所有参数值 校验是否包含空格或为空
                            if not value == ''.join(value.split()) or value == "":
                                message_dict["request_illegal"].append(k)
                                ret_status = self.INVALID



            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID
        # 参数多余，错误的参数
        if len(message_dict["request_error"]) > 0:
            message += _l(" parameters:  %s  error!") % ",".join(message_dict["request_error"])
        # 参数值错误
        if len(message_dict["request_illegal"]) > 0:
            message += _l(" parameters: %s illegal!") % ",".join(message_dict["request_illegal"])
        # 不符合规则
        if len(message_dict["no_rule"]) > 0:
            message += _l(" parameters: %s no rule!") % ",".join(message_dict["no_rule"])
        if message == "":
            message = _l("unknown error!")
        return ret_status, message

    def dsgetbynamePar(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        # if not isinstance(params_json, dict):
        #     message = "parameters must json"
        #     ret_status = self.INVALID
        #     return ret_status, message
        # 缺少参数
        for pa in self.ds_getbyname_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += _l(" parameters: %s can not be empty !") % ",".join(
                message_dict["no_request"])
            return ret_status, message
        for k in params_json.keys():
            if k in self.ds_getbyname_params:
                value = params_json[k]
                if k == "page" or k == "size" or k == "knw_id":
                    if not value.isdigit() or value == "0":
                        message += " parameters: " + k + " must be int, and more than zero"
                        ret_status = self.INVALID
                elif k == "order":
                    if value not in ["ascend", "descend"]:
                        message += " parameters: " + k + " must be ascend or descend!"
                        ret_status = self.INVALID
                elif k == "ds_name":
                    if not isinstance(value, str):
                        message += " parameters: " + k + " must be str！"
                        ret_status = self.INVALID
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID
        # 参数多余，错误的参数
        if len(message_dict["request_error"]) > 0:
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])

        # 参数值错误
        if len(message_dict["request_illegal"]) > 0:
            message += _l(" parameters: %s illegal!") % ",".join(message_dict["request_illegal"])
        # 不符合规则
        if len(message_dict["no_rule"]) > 0:
            message += _l(" parameters: %s no rule!") % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
        return ret_status, message

    def dsUpdatePar(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        ds_add_params = list(self.ds_add_params)
        if not isinstance(params_json, dict):
            message = "parameters must be json"
            ret_status = self.INVALID
            return ret_status, message
        if "data_source" in params_json:
            datasource = params_json["data_source"]
            if "ds_auth" in ds_add_params:
                ds_add_params.remove("ds_auth")
        else:
            message_dict["no_request"].append("data_source")
            ret_status = self.INVALID

        # params_json = request.args.to_dict()
        try:
            # 缺少参数
            for pa in ds_add_params:
                if pa not in params_json.keys():
                    message_dict["no_request"].append(pa)
                    ret_status = self.INVALID
            for k in params_json.keys():
                if k in ds_add_params:
                    value = params_json[k]
                    value = str(value)

                    # 某些参数有选取规则
                    if k in self.rule_dict.keys():
                        if value not in self.rule_dict[k]:
                            message_dict["no_rule"].append(k)
                    #  某些参数是否是数字
                    if k == "ds_port":
                        if not value.isdigit():
                            message += " parameters: " + k + " must be int"
                            ret_status = self.INVALID
                    if k == "ds_auth":
                        if not isinstance(value, str):

                            message += k + "must be str"
                            ret_status = self.INVALID
                        else:

                            if not value.isdigit() and value != "":
                                message += " parameters: " + k + " must be number"
                                ret_status = self.INVALID


                    else:
                        # 所有参数值 校验是否包含空格或为空
                        if not value == ''.join(value.split()) or value == "":
                            message_dict["request_illegal"].append(k)
                            ret_status = self.INVALID

                else:
                    # 注释 api 如果传入错误请求参数，要校验
                    if k != "timestamp":
                        message_dict["request_error"].append(k)
                        ret_status = self.INVALID
            # 参数多余，错误的参数
            if len(message_dict["request_error"]) > 0:
                message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
            # 缺少参数
            if len(message_dict["no_request"]) > 0:
                message += " parameters: %s can not be empty and cannot contain spaces!" % ",".join(
                    message_dict["no_request"])
            # 参数值错误
            if len(message_dict["request_illegal"]) > 0:
                message += _l(" parameters: %s illegal!") % ",".join(message_dict["request_illegal"])
            # 不符合规则
            if len(message_dict["no_rule"]) > 0:
                message += _l(" parameters: %s no rule!") % ",".join(message_dict["no_rule"])
            if message == "":
                message = _l("unknown error!")
        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID
        return ret_status, message

    def dsDelPar(self, params_json):
        ret_status = self.VALID
        message = ""
        # 定义参数
        # required = ["graph_name", "graph_step", "graph_process", "graph_status"]
        required = ["dsids"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required:
                unnecessaryParameters.append(k)
        dsids = params_json.get("dsids", None)
        # 请求的参数缺少必须的参数
        MissingParameters = []
        if dsids == None:
            for k in required:
                if not k in values:
                    MissingParameters.append(k)
        if len(unnecessaryParameters) > 0:
            message += "parameters:  %s  are not required!" % ",".join(unnecessaryParameters)
            ret_status = self.INVALID
        if len(MissingParameters) > 0:
            message += "parameters:  %s  are Missing!" % ",".join(MissingParameters)
            ret_status = self.INVALID
        # 校验顺序一 先校验参数是否缺少或者多的
        if len(unnecessaryParameters) > 0 or len(MissingParameters) > 0:
            return ret_status, message
        Logger.log_info(type(dsids))
        if type(dsids).__name__ != "list":
            message += "The parameter dsids type must be list!"
            ret_status = self.INVALID
            return ret_status, message
        if len(dsids) == 0:
            message += "The parameter dsids cannot be empty!"
            ret_status = self.INVALID
            return ret_status, message
        flag_digit = True
        for id1 in dsids:
            if type(id1).__name__ != "int":
                flag_digit = False
                break
            # if not isinstance(id1, int):
            #     flag_digit = False
            #     break
            # else:
            #     if not id1 == ''.join(id1.split()) or id1 == "":
            #         flag_digit = False

        if not flag_digit:
            message = "The parameter list element  must be int"
            ret_status = self.INVALID
            return ret_status, message

        return ret_status, message

    def dsdelcheck(self, param, value):
        ret_status = 0
        message = ""
        flag_digit = True
        try:
            ids = value
            if type(ids).__name__ == "list":
                if len(ids) > 0:
                    for id1 in ids:
                        if not isinstance(id1, str):
                            flag_digit = False
                        else:
                            id1 = str(id1)
                            # if not isinstance(id1,int):
                            if len(id1) > 50 or not re.search(RegularEnum.ENGLISH_CHINESE_AND_UNDERLINE.value, id1):
                                message += "  The parameter list element Length over 50 or Characters are not _, Chinese, English！"
                                ret_status = self.INVALID

                        # if not id1 == ''.join(id1.split()) or id1 == "":
                        #         flag_digit = False

                    if flag_digit:
                        return ret_status, ids, message
                    else:
                        ret_status = -1
                        message = "The parameter list element  must be str"
                        return ret_status, param, message


                else:
                    ret_status = -1
                    message = "The parameter list cannot be empty"
                    return ret_status, param, message
            else:
                ret_status = -1
                message = "The parameter type must be list！"
                return ret_status, param, message
        except Exception as e:
            err = repr(e)
            ret_status = -1
            message = err
            return ret_status, param, message

        # return ret_status, param, message

    ####ljadd
    def Authcheck(self, params_json):
        ret_status = self.VALID
        inexistence = []
        message = " "
        illegual = []
        for param in self.ds_auth_params:
            if param not in params_json:
                inexistence.append(param)
                ret_status = self.INVALID
            else:
                value = params_json[param]
                if param == "ds_route":
                    if not isinstance(value, str):
                        illegual.append("ds_route")
                        message += param + "must be str"
                        ret_status = self.INVALID
                if param == "ds_address":
                    if not isinstance(value, str):
                        illegual.append(param)
                        message += " parameters: " + param + " must be str"
                        ret_status = self.INVALID
                    else:
                        if not value == ''.join(value.split()) or value == "":
                            illegual.append(param)
                            message += " parameters: " + param + " can not have blankspace"
                            ret_status = self.INVALID

                        else:
                            if ("https://" or "http:// ") in value:
                                value = value.split("://")[-1]
                            if not commonutil.is_valid_domain(value):
                                illegual.append(param)
                                message += " parameters: " + param + " irregular！"
                                ret_status = self.INVALID
                            # else:
                            #     illegual.append(param)
                            #     message += " parameters: " + param + " irregular！"
                            #     ret_status = self.INVALID
                if param == "ds_auth":
                    if not isinstance(value, str):
                        illegual.append("ds_auth")
                        message += param + "must be str"
                        ret_status = self.INVALID
                    else:

                        if not value.isdigit() and value != "":
                            illegual.append("ds_auth")
                            message += " parameters: " + param + " must be int"
                            ret_status = self.INVALID
                if param == "ds_port":
                    if type(value) != int:
                        message += " parameters: ds_port must be int"
                        ret_status = self.INVALID
                    else:
                        if value > 65535 or value < 1:
                            message += " parameters: ds_port must in 1~65535"
                            ret_status = self.INVALID

        if illegual:
            ret_status = self.INVALID
        if inexistence:
            message += "These parameters :" + ",".join(inexistence) + " are inexistence ; "
            ret_status = self.INVALID
        message += "\n"
        return ret_status, message

    def buildtaskbyidPar(self, params_json):
        ret_status = self.VALID
        message = ""
        # 定义参数
        required = ["task_type"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required:
                unnecessaryParameters.append(k)
        task_type = params_json.get("task_type", None)
        # 请求的参数缺少必须的参数
        MissingParameters = []
        if task_type == None:
            for k in required:
                if not k in values:
                    MissingParameters.append(k)
        if len(unnecessaryParameters) > 0:
            message += "parameters:  %s  are not required!" % ",".join(unnecessaryParameters)
            ret_status = self.INVALID
        if len(MissingParameters) > 0:
            message += "parameters:  %s  are Missing!" % ",".join(MissingParameters)
            ret_status = self.INVALID
        # 校验顺序一 先校验参数是否缺少或者多的
        if len(unnecessaryParameters) > 0 or len(MissingParameters) > 0:
            return ret_status, message
        Logger.log_info(type(task_type))
        if task_type is not None:
            if task_type not in ["full", "increment"]:
                message += "parameters tasktype must in ['full', 'increment']!"
                ret_status = self.INVALID
        else:
            message += " parameters: task_type must be str"
            ret_status = self.INVALID
        return ret_status, message

    def deletetaskbyidPar(self, params_json):
        ret_status = self.VALID
        message = ""
        # 定义参数
        required = ["task_ids"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required:
                unnecessaryParameters.append(k)
        task_ids = params_json.get("task_ids", None)
        # 请求的参数缺少必须的参数
        MissingParameters = []
        if task_ids == None:
            for k in required:
                if not k in values:
                    MissingParameters.append(k)
        if len(unnecessaryParameters) > 0:
            message += _l("parameters:  %s  are not required!" % ",".join(unnecessaryParameters))
            ret_status = self.INVALID
        if len(MissingParameters) > 0:
            message += _l("parameters:  %s  are Missing!" % ",".join(MissingParameters))
            ret_status = self.INVALID
        # 校验顺序一 先校验参数是否缺少或者多的
        if len(unnecessaryParameters) > 0 or len(MissingParameters) > 0:
            return ret_status, message
        if not isinstance(task_ids, list):
            message += _l("parameters task_id must be list!")
            ret_status = self.INVALID
        else:
            if task_ids:
                for v in task_ids:
                    if not isinstance(v, int):
                        message += _l("parameters: task_ids content must be int.")
                        ret_status = self.INVALID
            else:
                message += _l("parameters: task_ids list can not be empty.")
                ret_status = self.INVALID
        return ret_status, message

    def gettokencheck(self, params_json):
        ret_status = self.VALID
        inexistence = []
        message = " "
        illegual = []
        for param in self.ds_gettoken_params:
            if param not in params_json:
                inexistence.append(param)
                ret_status = self.INVALID
            else:
                value = params_json[param]
                if param == "ds_code":
                    if not isinstance(value, str):
                        illegual.append(param)
                        message += param + "must be str"
                        ret_status = self.INVALID


                elif param == "ds_auth":
                    if not isinstance(value, str):
                        illegual.append("ds_auth")
                        message += param + "must be str"
                        ret_status = self.INVALID
                    else:
                        if not value.isdigit() and value != "":
                            illegual.append("ds_auth")
                            message += " parameters: " + param + " must be int"
                            ret_status = self.INVALID
        if illegual:
            ret_status = self.INVALID
        if inexistence:
            message += "These parameters :" + ",".join(inexistence) + " are inexistence ; "
            ret_status = self.INVALID
        message += "\n"
        return ret_status, message

    def verifycheck(self, params_json):
        ret_status = self.VALID
        inexistence = []
        message = " "
        illegual = []
        for param in self.ds_verify_params:
            if param not in params_json:
                inexistence.append(param)
                ret_status = self.INVALID
            else:
                value = params_json[param]
                if param == "ds_auth":
                    if not isinstance(value, str):
                        illegual.append("ds_auth")
                        message += param + "must be str"
                        ret_status = self.INVALID
                    else:
                        if not value.isdigit() and value != "":
                            illegual.append("ds_auth")
                            message += " parameters: " + param + " must be int"
                            ret_status = self.INVALID
        if illegual:
            ret_status = self.INVALID
        if inexistence:
            message += "These parameters :" + ",".join(inexistence) + " are inexistence ; "
            ret_status = self.INVALID
        message += "\n"
        return ret_status, message

    def getHivePartitions(self, params_json):
        ret_status = 0
        message = ""
        requests = ["ds_id", "table_name"]
        for key in params_json:
            if key not in requests:
                # 多余的参数
                message += _l(" parameters: ") + key + _l(" is not required. ")
                ret_status = self.INVALID
            else:
                requests.remove(key)
                value = params_json[key]
                if key == "ds_id":
                    if len(value) == 0:
                        message += _l(" parameters: ") + key + _l(' cannot be empty. ')
                        ret_status = self.INVALID
                    elif not value.isdigit():
                        # ds_id 必须为int
                        message += _l(" parameters: ") + key + _l(" must be number.")
                        ret_status = self.INVALID
                    elif int(value) <= 0:
                        message += _l(" parameters: ") + key + _l(" less than 1.")
                        ret_status = self.INVALID
                elif key == "table_name":
                    if len(value) == 0:
                        message += _l(" parameters: ") + key + _l(' cannot be empty. ')
                        ret_status = self.INVALID
        for key in requests:
            message += _l(" parameters: ") + key + _l(' is required. ')
            ret_status = self.INVALID
        return ret_status, message

    def checkPartitionInfos(self, params_json):
        ret_status = 0
        message = ""
        requests = ["ds_id", "table_name", "partition_infos"]
        for key in params_json:
            if key not in requests:
                # 多余的参数
                message += _l(" parameters: ") + key + _l(" is not required. ")
                ret_status = self.INVALID
            else:
                requests.remove(key)
                value = params_json[key]
                if key == "ds_id":
                    # ds_id 必须为int
                    if not isinstance(value, int):
                        message += _l(" parameters: ") + key + _l(" must be number.")
                        ret_status = self.INVALID
                    elif value <= 0:
                        message += _l(" parameters: ") + key + _l(" less than 1.")
                        ret_status = self.INVALID
                elif key == "table_name":
                    # table_name 必须为string
                    if not isinstance(value, str):
                        message += _l(" parameters: ") + key + _l(' must be string. ')
                        ret_status = self.INVALID
                    elif len(value) == 0:
                        message += _l(" parameters: ") + key + _l(' cannot be empty. ')
                        ret_status = self.INVALID
                elif key == "partition_infos":
                    # partition_infos 必须为dict
                    if not isinstance(value, dict):
                        message += _l(" parameters: ") + key + _l(" must be dict.")
                        ret_status = self.INVALID
                        continue
                    elif len(value) == 0:
                        message += _l(" parameters: ") + key + _l(" cannot be empty.")
                        ret_status = self.INVALID
                    for name, expression in value.items():
                        if not isinstance(expression, str):
                            message += _l(" parameters: partition_infos partition") + name + _l("'s expression must be str")
                            ret_status = self.INVALID
        for key in requests:
            message += _l(" parameters: ") + key + _l(' is required. ')
            ret_status = self.INVALID
        return ret_status, message

    def getPartitionCase(self, params_json):
        ret_status = 0
        message = ""
        requests = ["expression"]
        for key in params_json:
            if key not in requests:
                # 多余的参数
                message += _l(" parameters: ") + key + _l(" is not required. ")
                ret_status = self.INVALID
            else:
                requests.remove(key)
                value = params_json[key]
                if key == "expression":
                    if len(value) == 0:
                        message += _l(" parameters: ") + key + _l(' cannot be empty. ')
                        ret_status = self.INVALID
        for key in requests:
            message += _l(" parameters: ") + key + _l(' is required. ')
            ret_status = self.INVALID
        return ret_status, message

    def tableFieldPar(self, params_json):
        message = ""
        ret_status = self.VALID
        # check ds_id
        if "ds_id" not in params_json.keys():
            message += _l("NO parameter %s. ") % "ds_id"
        elif not params_json["ds_id"].isdigit():
            message += _l("Parameter %s must be a int type. ") % "ds_id"

        # check data_source
        data_source_list = ["mysql", "postgresql", "sqlserver", "kingbasees", "hive", "clickhouse"]
        if "data_source" not in params_json.keys():
            message += _l("NO parameter %s. ") % "data_source"
        elif not isinstance(params_json["data_source"], str):
            message += _l("Parameter %s must be a string type. ") % "data_source"
        elif params_json["data_source"] not in data_source_list:
            message += _l("Parameter %s must be in %s. ") % ("data_source", data_source_list)

        # check table_name
        if "table_name" not in params_json.keys():
            message += _l("NO parameter %s. ") % "table_name"
        elif not isinstance(params_json["table_name"], str):
            message += _l("Parameter %s must be a string type. ") % "table_name"
        elif len(params_json["table_name"]) == 0:
            message += _l("Parameter %s cannot be empty. ") % "table_name"

        # check model_name
        model_data_source = ["postgresql", "sqlserver", "kingbasees"]
        if params_json.get("data_source", "") in model_data_source:
            if "model_name" not in params_json.keys():
                message += _l("NO parameter %s. ") % "model_name"
            elif not isinstance(params_json["model_name"], str):
                message += _l("Parameter %s must be a string type. ") % "model_name"
            elif len(params_json["model_name"]) == 0:
                message += _l("Parameter %s cannot be empty. ") % "model_name"

        if message:
            ret_status = self.INVALID
        return ret_status, message

    def dsSql(self, params_json):
        message = ""
        ret_status = self.VALID
        # check ds_id
        if "ds_id" not in params_json.keys():
            message += _l("NO parameter %s. ") % "ds_id"
        elif not isinstance(params_json["ds_id"], int):
            message += _l("Parameter %s must be a int type. ") % "ds_id"

        # check sql
        if "sql" not in params_json.keys():
            message += _l("NO parameter %s. ") % "sql"
        elif not isinstance(params_json["sql"], str):
            message += _l("Parameter %s must be a string type. ") % "sql"
        elif len(params_json["sql"]) == 0:
            message += _l("Parameter %s cannot be empty. ") % "sql"
        elif not commonutil.check_statement_num(params_json["sql"]):
            message += _l("Parameter sql only support entering a single statement. ")
        else:
            sql = params_json["sql"]
            sql = re.sub(r"[\n\t]", " ", sql)
            if not regex.findall("^(?i)(\\s*)(select)(\\s+)(((?!( insert | update | delete | create |"
                                 " drop | alter | truncate | grant )).)+)$", sql):
                message += _l("Parameter sql must be a query statement. ")

        if message:
            ret_status = self.INVALID
        return ret_status, message

    def previewData(self, params_json):
        message = ""
        ret_status = self.VALID
        # check ds_id
        if "ds_id" not in params_json.keys():
            message += _l("NO parameter %s. ") % "ds_id"
        elif not params_json["ds_id"].isdigit():
            message += _l("Parameter %s must be a int type. ") % "ds_id"

        # check data_source
        data_source_list = ["mysql", "postgresql", "sqlserver", "kingbasees", "hive", "clickhouse"]
        if "data_source" not in params_json.keys():
            message += _l("NO parameter %s. ") % "data_source"
        elif not isinstance(params_json["data_source"], str):
            message += _l("Parameter %s must be a string type. ") % "data_source"
        elif params_json["data_source"] not in data_source_list:
            message += _l("Parameter %s must be in %s. ") % ("data_source", data_source_list)

        # check name
        if "name" not in params_json.keys():
            message += _l("NO parameter %s. ") % "name"
        elif not isinstance(params_json["name"], str):
            message += _l("Parameter %s must be a string type. ") % "name"
        elif len(params_json["name"]) == 0:
            message += _l("Parameter %s cannot be empty. ") % "name"

        # check model_name
        model_data_source = ["postgresql", "sqlserver", "kingbasees"]
        if params_json.get("data_source", "") in model_data_source:
            if "model_name" not in params_json.keys():
                message += _l("NO parameter %s. ") % "model_name"
            elif not isinstance(params_json["model_name"], str):
                message += _l("Parameter %s must be a string type. ") % "model_name"
            elif len(params_json["model_name"]) == 0:
                message += _l("Parameter %s cannot be empty. ") % "model_name"

        if message:
            ret_status = self.INVALID
        return ret_status, message


dsCheckParameters = DsCheckParameters()

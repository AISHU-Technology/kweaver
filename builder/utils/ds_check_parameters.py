# -*-coding:utf-8-*-
from flask import request
import json
from config import config as Config
from utils.CommonUtil import commonutil
import re


class DsCheckParameters(object):
    VALID = 0
    INVALID = -1
    rule_dict = {}
    rule_dict["dataType"] = ["structured", "unstructured"]
    rule_dict["extract_type"] = ["standardExtraction", "modelExtraction", "labelExtraction"]
    rule_dict["data_source"] = ["mysql", "hive", "as", "as7", "rabbitmq"]
    ds_getall_params = ["page", "size", "order", "knw_id"]
    task_status_params = ["page", "size", "order", "status"]
    search_taskbyname_params = ["page", "size", "order", "graph_name", "status", "task_type", "trigger_type"]
    # ds_add_params = ["dsname", "dataType", "data_source", "ds_address", "ds_port", "ds_user", "ds_password", "ds_path",
    #                  "extract_type"]
    # ds_contest_params = ["data_source", "ds_address", "ds_port", "ds_user", "ds_password", "ds_path"]

    ds_add_params = ("dsname", "dataType", "data_source", "ds_address", "ds_port", "ds_user", "ds_password", "ds_path",
                     "extract_type", "ds_auth", "vhost", "queue", "json_schema", "knw_id")
    ds_edit_params = ("dsname", "dataType", "data_source", "ds_address", "ds_port", "ds_user", "ds_password", "ds_path",
                      "extract_type", "ds_auth", "vhost", "queue", "json_schema")
    ds_contest_params = (
        "ds_id", "data_source", "ds_address", "ds_port", "ds_user", "ds_password", "ds_path", "ds_auth",
        "vhost", "queue")

    ds_del_params = ["dsnames"]
    ds_getbyname_params = ["page", "size", "dsname", "order", "knw_id"]
    ds_auth_params=["ds_route","ds_address","ds_auth"]
    ds_gettoken_params=["ds_code","ds_auth"]
    ds_verify_params=["ds_auth"]

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
                            message += " parameters: " + k + " must be int, and more than zero!"
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
                    if len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
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
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
        if len(message_dict["request_illegal"]) > 0:
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
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
            message += " parameters: %s can not be empty !" % ",".join(
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
                            message += " parameters: " + k + " must be int, and more than zero!"
                            ret_status = self.INVALID

                elif k == "order":
                    if value not in ["ascend", "descend"]:
                        message += " parameters: " + k + " must be ascend or descend!"
                        ret_status = self.INVALID

                elif k == "status":
                    if value not in ["normal", "running", "waiting", "failed", "stop", "all"]:
                        message += " parameters: " + k + ' must be in (normal,running,waiting,failed, stop,all)!'
                        ret_status = self.INVALID
                elif k == "graph_name":
                    if len(value) > 50:
                        message += " parameters: " + k + " Length over 50 "
                        ret_status = self.INVALID
                    # if len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                    #     message += " parameters: " + k + " Length over 50 or Characters are not _, Chinese, English！"
                    #     ret_status = self.INVALID
                elif k == "size":
                    if not value.isdigit() or value == "0":
                        message += " parameters: " + k + " must be int, and more than zero!"
                        ret_status = self.INVALID
                elif k == "task_type":
                    if value not in ("full", "increment", "all"):
                        message += " parameters: " + k + ' must be in (full,increment,all)'
                        ret_status = self.INVALID
                elif k == "trigger_type":
                    if value not in ("0", "1", "2", "all"):
                        message += " parameters: " + k + ' must be in (0,1,2,all)'
                        ret_status = self.INVALID
            else:
                # 注释 api 如果传入错误请求参数，要校验
                if k != "timestamp":
                    message_dict["request_error"].append(k)
                    ret_status = self.INVALID

        if len(message_dict["request_error"]) > 0:
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
        if len(message_dict["request_illegal"]) > 0:
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
        return ret_status, message

    def getAllPar(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        for pa in self.ds_getall_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += " parameters: %s can not be empty !" % ",".join(
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
                            message += " parameters: " + k + " must be int, and more than zero!"
                            ret_status = self.INVALID

                elif k == "order":
                    if value not in ["ascend", "descend"]:
                        message += " parameters: " + k + " must be ascend or descend!"
                        ret_status = self.INVALID
                elif k == "task_status":
                    if value not in ["normal", "waiting", "failed", "stop", "all"]:
                        message += " parameters: " + k + " must be in [normal, waiting, failed, stop, all]!"
                        ret_status = self.INVALID
                elif k == "trigger_type":
                    if value not in [0, 1, 2]:
                        message += " parameters: " + k + " must be 0, 1, 2!"
                        ret_status = self.INVALID
                elif k == "task_type":
                    if value not in ["full", "increment"]:
                        message += " parameters: " + k + " must be full or increment!"
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
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
        if len(message_dict["request_illegal"]) > 0:
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
        return ret_status, message

    # 新建数据源参数校验
    def dsAddPar(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        ds_add_params = list(self.ds_add_params)

        if "data_source" in params_json:
            datasource = params_json["data_source"]
            if datasource != "as7":
                if "ds_auth" in ds_add_params:
                    ds_add_params.remove("ds_auth")
            else:
                if "ds_user" in ds_add_params:
                    ds_add_params.remove("ds_user")
                if "ds_password" in ds_add_params:
                    ds_add_params.remove("ds_password")
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
                message += " parameters: %s can not be empty !" % ",".join(
                    message_dict["no_request"])
                return ret_status, message

            for k in params_json.keys():
                # 正确的参数 校验值
                if k in ds_add_params:
                    value = params_json[k]
                    # value = str(value)
                    if k == "ds_port" or k == "dataType" or k == "extract_type" or k == "data_source":
                        continue

                    elif k == "ds_address":
                        if not isinstance(value, str):
                            message += " parameters: " + k + " must be str！"
                            ret_status = self.INVALID
                        else:
                            data_source = params_json["data_source"]
                            if data_source == "as" or data_source == "as7":
                                if "http://" in value or "https://" in value:
                                    value = value.split("://")[-1]
                                if not commonutil.is_valid_domain(value):
                                    message += " parameters: " + k + " irregular！"
                                    ret_status = self.INVALID

                            else:
                                if not commonutil.is_valid_domain(value):
                                    message += " parameters: " + k + " irregular！"
                                    ret_status = self.INVALID

                    elif k == "dsname":
                        if not isinstance(value, str):
                            message += " parameters: " + k + " must be str！"
                            ret_status = self.INVALID
                        else:
                            if len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                                message += " parameters: " + k + " Length over 50 or Characters are not _, Chinese, English！"
                                ret_status = self.INVALID
                    elif k == "ds_auth":
                        if not isinstance(value, str):

                            message += "ds_auth must be str"
                            ret_status = self.INVALID
                        else:
                            if not value.isdigit() and value != "":
                                message += " parameters: " + "ds_auth" + " must be number"
                                ret_status = self.INVALID
                    elif k == "vhost" or k == "queue":
                        if params_json["data_source"] == "rabbitmq":
                            # if len(value) > 50:
                            #     message += " parameters: " + k + " Length over 50 ！"
                            #     ret_status = self.INVALID
                            if not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value) or len(value.strip()) == 0:
                                message += " parameters: " + k + " Characters are not _, Chinese, English！"
                                ret_status = self.INVALID
                    elif k == "json_schema":
                        if not isinstance(value, str):
                            message += " parameters: " + "json_schema" + " must be json_string; "
                            ret_status = self.INVALID
                        else:
                            if params_json["data_source"] == "rabbitmq":
                                if not value.strip():
                                    message += " parameters: " + "json_schema" + " can't be empty; "
                                    ret_status = self.INVALID
                                else:
                                    if value.strip() != "{}":
                                        try:
                                            if not isinstance(eval(value), dict):
                                                message += " parameters: " + "json_schema" + " must be json_string; "
                                                ret_status = self.INVALID
                                        except Exception:
                                            message += " parameters: " + "json_schema" + " must be json_string; "
                                            ret_status = self.INVALID
                                    else:
                                        message += " parameters: " + "json_schema" + " can't be empty;"
                                        ret_status = self.INVALID

                    elif k == "knw_id":
                        value = params_json[k]
                        if not isinstance(value, int):
                            message += " parameters: " + k + " must be number！"
                            ret_status = self.INVALID
                        elif value <= 0:
                            message += " parameters: " + k + " can not be 0！"
                            ret_status = self.INVALID

                    else:
                        if not isinstance(value, str):
                            message += " parameters: " + k + " must be str！"
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
            dataType = params_json.get("dataType")
            extract_type = params_json.get("extract_type")
            data_source = params_json.get("data_source")
            if ds_port is not None:
                if type(ds_port) != int:
                    message += " parameters: ds_port must be int"
                    ret_status = self.INVALID
                else:
                    if ds_port > 65535 or ds_port < 1:
                        message += " parameters: ds_port must in 1~65535"
                        ret_status = self.INVALID
            else:
                message += " parameters: ds_port must be int"
                ret_status = self.INVALID

            if dataType is not None:
                if dataType not in self.rule_dict["dataType"]:
                    message_dict["no_rule"].append("dataType")
                    ret_status = self.INVALID
            else:
                message += " parameters: dataType must be str"
                ret_status = self.INVALID
            if extract_type is not None:
                if extract_type not in self.rule_dict["extract_type"]:
                    message_dict["no_rule"].append("extract_type")
                    ret_status = self.INVALID
            else:
                message += " parameters: extract_type must be str"
                ret_status = self.INVALID

            if data_source is not None:
                if data_source not in self.rule_dict["data_source"]:
                    message_dict["no_rule"].append("data_source")
                    ret_status = self.INVALID
            else:
                message += " parameters: data_source must be str"
                ret_status = self.INVALID

            if dataType == "structured":
                # if extract_type is not None:
                #     if extract_type not in self.rule_dict["extract_type"]:
                #         message_dict["no_rule"].append("extract_type")
                #         ret_status = self.INVALID
                #     else:
                if extract_type not in ["standardExtraction", "labelExtraction"]:
                    message += " parameters:dataType is structured  parameters:extract_type must be standardExtraction or labelExtraction!"
                    ret_status = self.INVALID

                # if data_source is not None:
                #     if data_source not in self.rule_dict["data_source"]:
                #         message_dict["no_rule"].append("data_source")
                #         ret_status = self.INVALID

            elif dataType == "unstructured":
                if extract_type is not None:
                    if extract_type != "modelExtraction":
                        message += "parameters: dataType is unstructured  parameters: extract_type must be modelExtraction!"
                        ret_status = self.INVALID

                if data_source is not None:
                    if data_source not in ["as", "as7"]:
                        message += " parameters:dataType is unstructured  parameters:data_source must be Anyshare!"
                        ret_status = self.INVALID

            # 参数多余，错误的参数
            if len(message_dict["request_error"]) > 0:
                message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])

            # 参数值错误
            if len(message_dict["request_illegal"]) > 0:
                message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
            # 不符合规则
            if len(message_dict["no_rule"]) > 0:
                message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
            if message == "":
                message = "unknown error!"
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
            message = "parameters must be json"
            ret_status = self.INVALID
            return ret_status, message
        if "data_source" in params_json:
            datasource = params_json["data_source"]
            if datasource != "as7":
                if "ds_auth" in ds_add_params:
                    ds_add_params.remove("ds_auth")
            else:
                if "ds_user" in ds_add_params:
                    ds_add_params.remove("ds_user")
                if "ds_password" in ds_add_params:
                    ds_add_params.remove("ds_password")
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
                message += " parameters: %s can not be empty !" % ",".join(
                    message_dict["no_request"])
                return ret_status, message

            for k in params_json.keys():
                # 正确的参数 校验值
                if k in ds_add_params:
                    value = params_json[k]
                    # value = str(value)
                    if k == "ds_port" or k == "dataType" or k == "extract_type" or k == "data_source":
                        continue

                    elif k == "ds_address":
                        if not isinstance(value, str):
                            message += " parameters: " + k + " must be str！"
                            ret_status = self.INVALID
                        else:
                            data_source = params_json["data_source"]
                            if data_source == "as" or data_source == "as7":
                                if "http://" in value or "https://" in value:
                                    value = value.split("://")[-1]
                                if not commonutil.is_valid_domain(value):
                                    message += " parameters: " + k + " irregular！"
                                    ret_status = self.INVALID


                            else:
                                if not commonutil.is_valid_domain(value):
                                    message += " parameters: " + k + " irregular！"
                                    ret_status = self.INVALID

                    elif k == "dsname":
                        if not isinstance(value, str):
                            message += " parameters: " + k + " must be str！"
                            ret_status = self.INVALID
                        else:
                            if len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                                message += " parameters: " + k + " Length over 50 or Characters are not _, Chinese, English！"
                                ret_status = self.INVALID
                    elif k == "vhost" or k == "queue":
                        if params_json["data_source"] == "rabbitmq":
                            # if len(value) > 50:
                            #     message += " parameters: " + k + " Length over 50 ！"
                            #     ret_status = self.INVALID
                            if not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value) or len(value.strip()) == 0:
                                message += " parameters: " + k + " Characters are not _, Chinese, English！ And can't be empty"
                                ret_status = self.INVALID

                    elif k == "json_schema":
                        if not isinstance(value, str):
                            message += " parameters: " + "json_schema" + " must be json_string; "
                            ret_status = self.INVALID
                        else:
                            if params_json["data_source"] == "rabbitmq":
                                if not value.strip():
                                    message += " parameters: " + "json_schema" + " can't be empty; "
                                    ret_status = self.INVALID
                                else:
                                    if value.strip() != "{}":
                                        try:
                                            if not isinstance(eval(value), dict):
                                                message += " parameters: " + "json_schema" + " must be json_string; "
                                                ret_status = self.INVALID
                                        except Exception:
                                            message += " parameters: " + "json_schema" + " must be json_string; "
                                            ret_status = self.INVALID
                                    else:
                                        message += " parameters: " + "json_schema" + " can't be empty;"
                                        ret_status = self.INVALID
                    elif k == "ds_auth":
                        if not isinstance(value, str):

                            message += "ds_auth must be str"
                            ret_status = self.INVALID
                        else:
                            if not value.isdigit() and value != "":
                                message += " parameters: " + "ds_auth" + " must be number"
                                ret_status = self.INVALID
                    else:
                        if not isinstance(value, str):
                            message += " parameters: " + k + " must be str！"
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
            dataType = params_json.get("dataType")
            extract_type = params_json.get("extract_type")
            data_source = params_json.get("data_source")
            if ds_port is not None:
                if type(ds_port) != int:
                    message += " parameters: ds_port must be int"
                    ret_status = self.INVALID
                else:
                    if ds_port > 65535 or ds_port < 1:
                        message += " parameters: ds_port must in 1~65535"
                        ret_status = self.INVALID
            else:
                message += " parameters: ds_port must be int"
                ret_status = self.INVALID

            if dataType is not None:
                if dataType not in self.rule_dict["dataType"]:
                    message_dict["no_rule"].append("dataType")
                    ret_status = self.INVALID
            else:
                message += " parameters: dataType must be str"
                ret_status = self.INVALID
            if extract_type is not None:
                if extract_type not in self.rule_dict["extract_type"]:
                    message_dict["no_rule"].append("extract_type")
                    ret_status = self.INVALID
            else:
                message += " parameters: extract_type must be str"
                ret_status = self.INVALID

            if data_source is not None:
                if data_source not in self.rule_dict["data_source"]:
                    message_dict["no_rule"].append("data_source")
                    ret_status = self.INVALID
            else:
                message += " parameters: data_source must be str"
                ret_status = self.INVALID

            if dataType == "structured":
                # if extract_type is not None:
                #     if extract_type not in self.rule_dict["extract_type"]:
                #         message_dict["no_rule"].append("extract_type")
                #         ret_status = self.INVALID
                #     else:
                if extract_type not in ["standardExtraction", "labelExtraction"]:
                    message += " parameters:dataType is structured  parameters:extract_type must be standardExtraction or labelExtraction!"
                    ret_status = self.INVALID

                # if data_source is not None:
                #     if data_source not in self.rule_dict["data_source"]:
                #         message_dict["no_rule"].append("data_source")
                #         ret_status = self.INVALID

            elif dataType == "unstructured":
                if extract_type is not None:
                    if extract_type != "modelExtraction":
                        message += "parameters: dataType is unstructured  parameters: extract_type must be modelExtraction!"
                        ret_status = self.INVALID

                if data_source is not None:
                    if data_source not in ["as", "as7"]:
                        message += " parameters:dataType is unstructured  parameters:data_source must be Anyshare!"
                        ret_status = self.INVALID

            # 参数多余，错误的参数
            if len(message_dict["request_error"]) > 0:
                message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])

            # 参数值错误
            if len(message_dict["request_illegal"]) > 0:
                message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
            # 不符合规则
            if len(message_dict["no_rule"]) > 0:
                message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
            if message == "":
                message = "unknown error!"
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
            message = "parameters must be json"
            ret_status = self.INVALID
            return ret_status, message
        # 缺少参数
        if "data_source" in params_json:
            datasource = params_json["data_source"]
            if datasource != "as7":
                if "ds_auth" in ds_contest_params:
                    ds_contest_params.remove("ds_auth")
            else:
                if "ds_user" in ds_contest_params:
                    ds_contest_params.remove("ds_user")
                if "ds_password" in ds_contest_params:
                    ds_contest_params.remove("ds_password")

        else:
            message_dict["no_request"].append("data_source")
            ret_status = self.INVALID
        for pa in ds_contest_params:
            if pa not in params_json.keys():
                message_dict["no_request"].append(pa)
                ret_status = self.INVALID
        # 缺少参数
        if len(message_dict["no_request"]) > 0:
            message += " parameters: %s can not be empty !" % ",".join(
                message_dict["no_request"])
            return ret_status, message

        for k in params_json.keys():
            if k in ds_contest_params:
                value = params_json[k]
                #  某些参数是否是数字
                if k == "ds_port":
                    if type(value) != int:
                        message += " parameters: ds_port must be int !"
                        ret_status = self.INVALID
                    else:
                        if value > 65535 or value < 1:
                            message += " parameters: ds_port must in 1~65535 !"
                            ret_status = self.INVALID
                elif k == "ds_id":
                    if not isinstance(value, int):
                        message += "parameters: ds_id must be int !"
                        ret_status = self.INVALID
                elif k == "ds_auth":
                    if not isinstance(value, str):

                        message += "parameters: ds_auth must be str !"
                        ret_status = self.INVALID
                    else:
                        if not value.isdigit() and value != "":
                            message += " parameters: " + "ds_auth" + " must be number !"
                            ret_status = self.INVALID
                    # if not isinstance(value, int):
                    #     message += " parameters: " + k + " must be int"
                    #     ret_status = self.INVALID

                elif k == "data_source":
                    if value not in self.rule_dict["data_source"]:
                        message_dict["no_rule"].append("data_source")
                        ret_status = self.INVALID
                elif k == "vhost" or k == "queue":
                    if params_json["data_source"] == "rabbitmq":
                        # if len(value) > 50:
                        #     message += " parameters: " + k + " Length over 50 ！"
                        #     ret_status = self.INVALID
                        if not isinstance(value, str):
                            message += "parameters: {} must be str !".format(value)
                            ret_status = self.INVALID
                        else:
                            if not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value) or len(value.strip()) == 0:
                                message += " parameters: " + k + " Characters are not _, Chinese, English！ And can't be empty"
                                ret_status = self.INVALID
                elif k == "ds_address":
                    if type(value) != str:
                        message += " parameters: " + k + " must be str！"
                        ret_status = self.INVALID
                    else:
                        data_source = params_json["data_source"]
                        if data_source == "as" or data_source == "as7":
                            if "http://" in value or "https://" in value:
                                value = value.split("://")[-1]
                            if not commonutil.is_valid_domain(value):
                                message += " parameters: " + k + " irregular！"
                                ret_status = self.INVALID


                        else:
                            value = value.split("://")[-1]
                            if not commonutil.is_valid_domain(value):
                                message += " parameters: " + k + " irregular！"
                                ret_status = self.INVALID
                    if not isinstance(value, str):
                        message += " parameters: " + k + " must be str"
                        ret_status = self.INVALID
                        # 所有参数值 校验是否包含空格或为空
                    else:
                        if not value == ''.join(value.split()) or value == "":
                            message_dict["request_illegal"].append(k)
                            ret_status = self.INVALID
                else:
                    if not isinstance(value, str):
                        message += " parameters: " + k + " must be str！"
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
            message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
        # 参数值错误
        if len(message_dict["request_illegal"]) > 0:
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
        # 不符合规则
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
        if message == "":
            message = "unknown error!"
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
            message += " parameters: %s can not be empty !" % ",".join(
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
                elif k == "dsname":
                    if not isinstance(value, str):
                        message += " parameters: " + k + " must be str！"
                        ret_status = self.INVALID
                    # else:
                    #     if len(value) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', value):
                    #         message += " parameters: " + k + " Length over 50 or Characters are not _, Chinese, English！"
                    #         ret_status = self.INVALID
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
            message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
        # 不符合规则
        if len(message_dict["no_rule"]) > 0:
            message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
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
            if datasource != "as7":
                if "ds_auth" in ds_add_params:
                    ds_add_params.remove("ds_auth")
            else:
                if "ds_user" in ds_add_params:
                    ds_add_params.remove("ds_user")
                if "ds_password" in ds_add_params:
                    ds_add_params.remove("ds_password")
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
                message += " parameters: %s illegal!" % ",".join(message_dict["request_illegal"])
            # 不符合规则
            if len(message_dict["no_rule"]) > 0:
                message += " parameters: %s no rule!" % ",".join(message_dict["no_rule"])
            if message == "":
                message = "unknown error!"
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
        print(type(dsids))
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

    # def dsDelPar(self,params_json):
    #     ret_status = 0
    #     message = ""
    #     message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
    #     if not isinstance(params_json, dict):
    #         message = "parameters must be json"
    #         ret_status = self.INVALID
    #         return ret_status, message
    #     # 缺少参数
    #     for pa in self.ds_del_params:
    #         if pa not in params_json.keys():
    #             message_dict["no_request"].append(pa)
    #             ret_status = self.INVALID
    #     # 缺少参数
    #     if len(message_dict["no_request"]) > 0:
    #         message += " parameters: %s can not be empty !" % ",".join(
    #             message_dict["no_request"])
    #         return ret_status, message
    #     for k in params_json.keys():
    #         if k in self.ds_del_params:
    #             value = params_json[k]
    #             ret_st, params, delmessage = self.dsdelcheck(k, value)
    #             if ret_st != 0:
    #                 message = delmessage
    #                 ret_status = self.INVALID
    #
    #         else:
    #             # 注释 api 如果传入错误请求参数，要校验
    #             if k != "timestamp":
    #                 message_dict["request_error"].append(k)
    #                 ret_status = self.INVALID
    #     # 参数多余，错误的参数
    #     if len(message_dict["request_error"]) > 0:
    #         message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])
    #
    #     if message == "":
    #         message = "unknown error!"
    #     return ret_status, message
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
                            if len(id1) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', id1):
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
        required = ["tasktype"]
        # 请求参数
        values = params_json
        # 请求的参数不在定义的参数中
        unnecessaryParameters = []
        for k in values:
            if not k in required:
                unnecessaryParameters.append(k)
        tasktype = params_json.get("tasktype", None)
        # 请求的参数缺少必须的参数
        MissingParameters = []
        if tasktype == None:
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
        print(type(tasktype))
        if tasktype is not None:
            if tasktype not in ["full", "increment"]:
                message += "parameters tasktype must in ['full', 'increment']!"
                ret_status = self.INVALID
        else:
            message += " parameters: tasktype must be str"
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
            message += "parameters:  %s  are not required!" % ",".join(unnecessaryParameters)
            ret_status = self.INVALID
        if len(MissingParameters) > 0:
            message += "parameters:  %s  are Missing!" % ",".join(MissingParameters)
            ret_status = self.INVALID
        # 校验顺序一 先校验参数是否缺少或者多的
        if len(unnecessaryParameters) > 0 or len(MissingParameters) > 0:
            return ret_status, message
        if not isinstance(task_ids, list):
            message += "parameters task_id must be list!"
            ret_status = self.INVALID
        else:
            if task_ids:
                for v in task_ids:
                    if not isinstance(v, str) or len(v) > 36:
                        message += " parameters: task_ids content must be str and length<=36"
                        ret_status = self.INVALID
            else:
                message += " parameters: task_ids list can not be empty"
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


dsCheckParameters = DsCheckParameters()

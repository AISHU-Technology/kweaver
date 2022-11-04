import re


class Knw_check_params(object):
    def __init__(self):
        self.VALID = 0
        self.INVALID = -1
        self.knw_color = ["#126EE3", "#8c8c8c", "#019688", "#7CBE00", "#FF8600"]
        self.knw_add_params = ["knw_name", "knw_des", "knw_color"]
        self.get_all_knw_params = ["page", "size", "order", "rule"]
        self.get_by_name_params = ["knw_name", "page", "size", "order", "rule"]
        self.edit_params = ["knw_name", "knw_des", "knw_color", "knw_id"]
        self.get_graph_params = ["knw_id", "page", "size", "order", "name", "rule"]

    # 新增参数校验
    def knwAddParams(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        knw_add_params = list(self.knw_add_params)

        try:
            # 缺少参数
            for param in knw_add_params:
                if param not in params_json.keys() and param != "knw_des":
                    message_dict["no_request"].append(param)
                    ret_status = self.INVALID
            if len(message_dict["no_request"]) > 0:
                message += " parameters: %s can not be empty !" % ",".join(message_dict["no_request"])
                return ret_status, message

            # 校验参数值是否正确
            for key in params_json.keys():

                if key == "knw_name":
                    value = params_json[key]
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID
                    elif len(value) <= 0 or value.isspace():
                        message += " parameters: " + key + " can not empty! "
                        ret_status = self.INVALID
                    elif len(value) > 50 or (
                            not re.search(
                                u'^[-_a-zA-Z0-9 =~!@#$&%^&*\'\"\“、\‘()_+`{}[\];:,.·?<>|/~！$\s/\n\\\s@#￥%…&*“”（）—+。={}|【】：；、《》？，。\u4e00-\u9fa5]+$', 
                                value) and value != ""):
                        message += " parameters: " + key + " Length over 50 or Characters are not _, Chinese, English！"
                        ret_status = self.INVALID

                elif key == "knw_des":
                    value = params_json[key]
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID
                    elif len(value) > 200 or (
                            not re.search(
                                u'^[-_a-zA-Z0-9 =~!@#$&%^&*\'\"\“、\‘()_+`{}[\];:,.·?<>|/~！$\s/\n\\\s@#￥%…&*“”（）—+。={}|【】：；、《》？，。\u4e00-\u9fa5]+$',
                                value) and value != ""):
                        message += " parameters: " + key + " Length over 200 or Characters are not _, Chinese, English！"
                        ret_status = self.INVALID

                elif key == "knw_color":
                    value = params_json[key]
                    if value not in self.knw_color:
                        message += " parameters: " + key + " must be given value！"
                        ret_status = self.INVALID

                else:  # 多余参数
                    message_dict["request_error"].append(key)
                    ret_status = self.INVALID

            # 参数多余，错误的参数
            if len(message_dict["request_error"]) > 0:
                message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])

            # 未知错误
            if message == "":
                message = "unknown error!"

        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID

        return ret_status, message

    # 查询参数校验
    def getKnwParams(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}

        try:
            if "timestamp" in params_json.keys():
                params_json.pop("timestamp")
            # 缺少参数
            for param in self.get_all_knw_params:
                if param not in params_json.keys():
                    message_dict["no_request"].append(param)
                    ret_status = self.INVALID
            if len(message_dict["no_request"]) > 0:
                message += " parameters: %s can not be empty !" % ",".join(message_dict["no_request"])
                return ret_status, message

            for key in params_json.keys():
                if key == "page" or key == "size":
                    value = str(params_json[key])
                    if not value.isdigit():
                        message += " parameters: " + key + " must be number！"
                        ret_status = self.INVALID
                    if int(value) <= 0:
                        message += " parameters: " + key + " can not be 0！"
                        ret_status = self.INVALID

                elif key == "order":
                    value = params_json[key]
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID
                    elif value not in ["desc", "asc"]:
                        message += " parameters: " + key + " must be desc or asc！"
                        ret_status = self.INVALID

                elif key == "rule":
                    value = params_json[key]
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID
                    elif value not in ["create", "update"]:
                        message += " parameters: " + key + " must be create or update！"
                        ret_status = self.INVALID
                else:  # 多余参数
                    message_dict["request_error"].append(key)
                    ret_status = self.INVALID

            # 参数多余，错误的参数
            if len(message_dict["request_error"]) > 0:
                message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])

            # 未知错误
            if message == "":
                message = "unknown error!"

        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID

        return ret_status, message

    # 根据名称查询参数校验
    def getByNameParams(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}

        try:
            if "timestamp" in params_json.keys():
                params_json.pop("timestamp")
            # 缺少参数
            for param in self.get_by_name_params:
                if param not in params_json.keys():
                    message_dict["no_request"].append(param)
                    ret_status = self.INVALID
            if len(message_dict["no_request"]) > 0:
                message += " parameters: %s can not be empty !" % ",".join(message_dict["no_request"])
                return ret_status, message

            for key in params_json.keys():
                if key == "knw_name":
                    value = params_json[key]
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID

                elif key == "page" or key == "size":
                    value = str(params_json[key])
                    if not value.isdigit():
                        message += " parameters: " + key + " must be number！"
                        ret_status = self.INVALID
                    if int(value) <= 0:
                        message += " parameters: " + key + " must more than zero！"
                        ret_status = self.INVALID

                elif key == "order":
                    value = params_json[key]
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID
                    elif value not in ["desc", "asc"]:
                        message += " parameters: " + key + " must be desc or asc！"
                        ret_status = self.INVALID

                elif key == "rule":
                    value = params_json[key]
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID
                    elif value not in ["create", "update"]:
                        message += " parameters: " + key + " must be create or update！"
                        ret_status = self.INVALID
                else:  # 多余参数
                    message_dict["request_error"].append(key)
                    ret_status = self.INVALID

            # 参数多余，错误的参数
            if len(message_dict["request_error"]) > 0:
                message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])

            # 未知错误
            if message == "":
                message = "unknown error!"

        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID

        return ret_status, message

    # 编辑参数校验
    def editParams(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        edit_params = list(self.edit_params)

        try:
            # 缺少参数
            for param in edit_params:
                if param not in params_json.keys() and param != "knw_des":
                    message_dict["no_request"].append(param)
                    ret_status = self.INVALID
            if len(message_dict["no_request"]) > 0:
                message += " parameters: %s can not be empty !" % ",".join(message_dict["no_request"])
                return ret_status, message

            # 校验参数值是否正确
            for key in params_json.keys():

                if key == "knw_name":
                    value = params_json[key]
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID
                    elif len(value) <= 0 or value.isspace():
                        message += " parameters: " + key + " can not empty! "
                        ret_status = self.INVALID
                    elif len(value) > 50 or (
                            not re.search(
                                u'^[-_a-zA-Z0-9 =~!@#$&%^&*\'\"\“、\‘()_+`{}[\];:,.·?<>|/~！$\s/\n\\\s@#￥%…&*“”（）—+。={}|【】：；、《》？，。\u4e00-\u9fa5]+$', 
                                value) and value != ""):
                        message += " parameters: " + key + " Length over 50 or Characters are not _, Chinese, English！"
                        ret_status = self.INVALID

                elif key == "knw_des":
                    value = params_json[key]
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID
                    elif len(value) > 200 or (
                            not re.search(
                                u'^[-_a-zA-Z0-9 =~!@#$&%^&*\'\"\“、\‘()_+`{}[\];:,.·?<>|/~！$\s/\n\\\s@#￥%…&*“”（）—+。={}|【】：；、《》？，。\u4e00-\u9fa5]+$',
                                value) and value != ""):
                        message += " parameters: " + key + " Length over 200 or Characters are not _, Chinese, English！"
                        ret_status = self.INVALID

                elif key == "knw_color":
                    value = params_json[key]
                    if value not in self.knw_color:
                        message += " parameters: " + key + " must be given value！"
                        ret_status = self.INVALID

                elif key == "knw_id":
                    value = params_json[key]
                    if not isinstance(value, int):
                        message += " parameters: " + key + " must be number！"
                        ret_status = self.INVALID
                    elif value <= 0:
                        message += " parameters: " + key + " can not be 0！"
                        ret_status = self.INVALID

                else:  # 多余参数
                    message_dict["request_error"].append(key)
                    ret_status = self.INVALID

            # 参数多余，错误的参数
            if len(message_dict["request_error"]) > 0:
                message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])

            # 未知错误
            if message == "":
                message = "unknown error!"

        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID

        return ret_status, message

    # 删除知识网络参数校验
    def delParams(self, params_json):
        ret_status = 0
        message = ""
        request_error = []

        try:
            if "timestamp" in params_json.keys():
                params_json.pop("timestamp")
            if "knw_id" not in params_json.keys():
                message += " parameters: knw_id can not be empty !"
                ret_status = self.INVALID
                return ret_status, message

            for key in params_json.keys():
                if key == "knw_id":
                    value = str(params_json[key])
                    if not value.isdigit():
                        message += " parameters: " + key + " must be number！"
                        ret_status = self.INVALID
                    if int(value) <= 0:
                        message += " parameters: " + key + " can not be 0！"
                        ret_status = self.INVALID
                else:
                    request_error.append(key)
                    ret_status = self.INVALID
            # 参数多余，错误的参数
            if len(request_error) > 0:
                message += " parameters:  %s  error!" % ",".join(request_error)
            # 未知错误
            if message == "":
                message = "unknown error!"

        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID

        return ret_status, message

    # 获取图谱参数校验
    def getGraphParams(self, params_json):
        ret_status = 0
        message = ""
        message_dict = {"request_error": [], "no_request": [], "request_illegal": [], "no_rule": []}
        try:
            if "timestamp" in params_json.keys():
                params_json.pop("timestamp")
            # 缺少参数
            for param in self.get_graph_params:
                if param not in params_json.keys():
                    message_dict["no_request"].append(param)
                    ret_status = self.INVALID
            if len(message_dict["no_request"]) > 0:
                message += " parameters: %s can not be empty !" % ",".join(message_dict["no_request"])
                return ret_status, message

            # 校验参数值是否正确
            for key in params_json.keys():
                value = params_json[key]
                if key in ["knw_id", "page", "size"]:
                    if not str(value).isdigit():
                        message += " parameters: " + key + " must be number！"
                        ret_status = self.INVALID
                    if int(value) <= 0:
                        message += " parameters: " + key + " can not be 0！"
                        ret_status = self.INVALID

                elif key == "order":
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID
                    elif value not in ["desc", "asc"]:
                        message += " parameters: " + key + " must be desc or asc !"
                        ret_status = self.INVALID

                elif key == "rule":
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID
                    elif value not in ["create", "update", "name"]:
                        message += " parameters: " + key + " must be create , update or name !"
                        ret_status = self.INVALID

                elif key == "name":
                    if not isinstance(value, str):
                        message += " parameters: " + key + " must be str！"
                        ret_status = self.INVALID

                elif key == "upload_graph":
                    value = params_json.get(key, 'false')
                    if value not in ('true', 'false'):
                        message += " parameters: " + key + " must be bool！"
                        ret_status = self.INVALID

                else:  # 多余参数
                    if key != "upload_graph":
                        message_dict["request_error"].append(key)
                        ret_status = self.INVALID

            # 参数多余，错误的参数
            if len(message_dict["request_error"]) > 0:
                message += " parameters:  %s  error!" % ",".join(message_dict["request_error"])

            # 未知错误
            if message == "":
                message = "unknown error!"

        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID

        return ret_status, message

    # 新增关系参数校验
    def relationParams(self, params_json):
        ret_status = 0
        message = ""
        request_error = []
        try:
            if "knw_id" not in params_json.keys():
                message += " parameters: knw_id can not be empty !"
                ret_status = self.INVALID
                return ret_status, message
            elif "graph_id" not in params_json.keys():
                message += " parameters: graph_id can not be empty !"
                ret_status = self.INVALID
                return ret_status, message

            for key in params_json.keys():
                if key in ["knw_id", "graph_id"]:
                    value = str(params_json[key])
                    if not value.isdigit():
                        message += " parameters: " + key + " must be number！"
                        ret_status = self.INVALID
                    if int(value) <= 0:
                        message += " parameters: " + key + " can not be 0！"
                        ret_status = self.INVALID
                else:
                    request_error.append(key)
                    ret_status = self.INVALID
            # 参数多余，错误的参数
            if len(request_error) > 0:
                message += " parameters:  %s  error!" % ",".join(request_error)
            # 未知错误
            if message == "":
                message = "unknown error!"

        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID

        return ret_status, message

    # 删除关系参数校验
    def deleteRelationParams(self, params_json):
        ret_status = 0
        message = ""
        request_error = []
        try:
            if "knw_id" not in params_json.keys():
                message += " parameters: knw_id can not be empty !"
                ret_status = self.INVALID
                return ret_status, message
            elif "graph_id" not in params_json.keys():
                message += " parameters: graph_id can not be empty !"
                ret_status = self.INVALID
                return ret_status, message

            for key in params_json.keys():
                if key == "knw_id":
                    value = str(params_json[key])
                    if not value.isdigit():
                        message += " parameters: " + key + " must be number！"
                        ret_status = self.INVALID
                    if int(value) <= 0:
                        message += " parameters: " + key + " can not be 0！"
                        ret_status = self.INVALID
                elif key == "graph_id":
                    value = params_json[key]
                    if not isinstance(value, list):
                        message += "parameters: " + key + " must be list "
                else:
                    request_error.append(key)
                    ret_status = self.INVALID
            # 参数多余，错误的参数
            if len(request_error) > 0:
                message += " parameters:  %s  error!" % ",".join(request_error)
            # 未知错误
            if message == "":
                message = "unknown error!"

        except Exception as e:
            message = repr(e)
            ret_status = self.INVALID

        return ret_status, message


knw_check_params = Knw_check_params()

import sys
import re
from utils.CommonUtil import commonutil
from utils.timer_check_parameters import CommonCheck
from utils.common_response_status import CommonResponseStatus
from utils.ds_check_parameters import dsCheckParameters
from utils.graph_check_parameters import graphCheckParameters
from utils.ontology_check_params import otl_check_params
from service.graph_Service import graph_Service
from utils.log_info import Logger
import common.stand_log as log_oper
from flask_babel import gettext as _l


class GraphParamValidate(object):
    def __init__(self, method):
        self.method = method

    # GET请求：返回所有图谱信息;
    def graphGet(self):
        # 获取参数
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            return {"cause": param_message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": "Incorrect parameter format"}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # POST请求：新增图谱
    def graphCreate(self):
        # 获取参数
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            return {"cause": param_message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": "Incorrect parameter format"}, CommonResponseStatus.BAD_REQUEST.value
        # 参数校验
        check_res, message = graphCheckParameters.graphAddPar(params_json, None)
        if check_res != 0:
            Logger.log_info("message: {}".format(message))
            error_log = log_oper.get_error_log("parameters:%s invalid; " % params_json + "cause:%s" % message, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # 图谱编辑
    def graphEdit(self, graphid):
        if not graphid.isdigit():
            message = "The url api/builder/v1/graph/graph_id graph_id type must be int!"
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message,
                    "solution": "Please check parameters graph_id"}, CommonResponseStatus.BAD_REQUEST.value

        # graph_id不存在
        code, ret = graph_Service.checkById(graphid)
        if code != 0:
            return {"cause": ret["cause"],
                    "code": ret["code"],
                    "message": ret["message"],
                    "solution": "Please use valid graph_id"}, CommonResponseStatus.BAD_REQUEST.value

        # 获取参数
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": param_message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": "Incorrect parameter format",
                    "solution": "Please check quest body or header"}, CommonResponseStatus.BAD_REQUEST.value
        # 参数校验
        check_res, message = graphCheckParameters.graphAddPar(params_json, graphid)
        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message,
                    "solution": "Please check parameters"}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # 定时任务权限管理，与图谱编辑权限相同
    def TimerTask(self, graphid):
        http_code, res_message = CommonCheck.check_graph_id(graphid)
        if http_code != CommonResponseStatus.SUCCESS.value:
            return http_code, res_message
        return http_code, {}

    # DELETE请求,删除图谱
    def graphDelete(self):
        pass

    # POST请求：新增数据源
    def dsmCreate(self):
        # 获取参数
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            return {"cause": param_message,
                    "code": "Builder.third_party_service.permission_manager.Permission.dsmCreate.ParametersError",
                    "message": "Incorrect parameter format"}, CommonResponseStatus.BAD_REQUEST.value

        # 参数校验
        check_res, message = dsCheckParameters.dsAddPar(params_json)
        if check_res != 0:
            Logger.log_info("message: {}".format(message))
            error_log = log_oper.get_error_log("parameters:%s invalid; " % params_json + "cause:%s" % message, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": "Builder.third_party_service.permission_manager.Permission.dsmCreate.ParametersError",
                    "message": message}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # POST请求, 编辑数据源
    def dsmEdit(self, dsid):
        if not dsid.isdigit():
            message = _l("The url api/builder/v1/ds/dsid dsid type must be int!")
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message}, CommonResponseStatus.BAD_REQUEST.value
        # 获取参数
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": param_message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": "Incorrect parameter format"}, CommonResponseStatus.BAD_REQUEST.value
        # 参数校验
        check_res, message = dsCheckParameters.dsEditPar(params_json)
        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message}, CommonResponseStatus.BAD_REQUEST.value

        return {}, 0

    # DELETE请求,删除数据源
    def dsmDelete(self):
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": param_message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": "Incorrect parameter format"}, CommonResponseStatus.BAD_REQUEST.value
        check_res, message = dsCheckParameters.dsDelPar(params_json)
        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # PUT请求, 编辑本体
    def ontoEdit(self):
        pass

    # DELETE请求,删除本体
    def ontoDelete(self):
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": param_message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": "Incorrect parameter format"}, CommonResponseStatus.BAD_REQUEST.value
        check_res, message = otl_check_params.otlDelPar(params_json)
        if check_res != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # 运行任务
    def task_run(self, graph_id):
        if not graph_id.isdigit():
            message = "The url api/builder/v1/task/graph_id graph_id type must be int!"
            error_log = log_oper.get_error_log("error:%s " % message, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # 删除任务
    def task_delete(self, graph_id):
        if not graph_id.isdigit():
            message = "The url api/builder/v1/task/graph_id graph_id type must be int!"
            error_log = log_oper.get_error_log("error:%s " % message, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # 任务详情
    def task_detail(self, graph_id):
        if not graph_id.isdigit():
            message = "The url api/builder/v1/task/getdetail/graph_id graph_id type must be int!"
            error_log = log_oper.get_error_log("error:%s " % message, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # 历史记录
    def task_history(self, graph_id):
        if not graph_id.isdigit():
            message = "The url api/builder/v1/task/get_history_data/graph_id graph_id type must be int!"
            error_log = log_oper.get_error_log("error:%s " % message, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message,
                    "solution": "Please check parameters graph_id"}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # 获取任务进度
    def task_progress(self, graph_id):
        if not graph_id.isdigit():
            message = "The url api/builder/v1/task/get_history_data/graph_id graph_id type must be int!"
            error_log = log_oper.get_error_log("error:%s " % message, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": message,
                    "code": CommonResponseStatus.PARAMETERS_ERROR.value,
                    "message": message}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    # 知识网络增删改查
    def knowledgeNetwork(self):
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code != 0:
            error_log = log_oper.get_error_log("parameters:%s invalid" % params_json, sys._getframe())
            Logger.log_error(error_log)
            return {"cause": param_message,
                    "message": "Incorrect parameter format"}, CommonResponseStatus.BAD_REQUEST.value
        return param_message, param_code

    def graph_output(self, params_json):
        try:
            id = params_json["id"]
            if id <= 0:
                return {"cause": "parameter id must more than 0", "code": 400000,
                        "message": "Incorrect parameter format"}, CommonResponseStatus.BAD_REQUEST.value
        except Exception as e:
            return {"cause": e.__str__(), "code": 400000,
                    "message": "Incorrect parameter format"}, CommonResponseStatus.BAD_REQUEST.value
        return {}, 0

    def graph_input(self, knw_id, files, ds_id_map, rename):
        try:
            if not knw_id:
                raise Exception("knw_id is required")
            if not knw_id.isdigit():
                raise Exception("knw_id must be an int type")

            if not isinstance(rename, str):
                raise Exception("rename" + _l(" must be string. "))
            elif rename == "":
                pass
            elif len(rename) > 50 or not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', rename):
                raise Exception("rename" + _l(" only support English and Chinese, numbers and underline, and the length is 0-50 digits."))

            if len(files) != 1:
                raise Exception("file is not found")
            
            try:
                ds_id_map = eval(ds_id_map)
            except Exception as e:
                raise Exception("parameter: ds_id_map is invalid")
            
            if not isinstance(ds_id_map, dict):
                raise Exception("ds_id_map must be a dict")

            for key, v in ds_id_map.items():
                if not re.search('^[1-9]\d*$', key):
                    raise Exception("ds_id_map's key is invalid")
                if not isinstance(v, int):
                    raise Exception("ds_id_map's value must be an int type")

        except Exception as e:
            return {"cause": e.__str__(), "code": 400000,
                    "message": "Incorrect parameter format"}, CommonResponseStatus.BAD_REQUEST.value

        return {}, 0

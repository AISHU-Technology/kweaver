import os
import sys
import traceback
from flask import request
from flask_babel import gettext as _l
import common.stand_log as log_oper
from dao.dsm_dao import dsm_dao
from dao.function_dao import function_dao
from dao.knw_dao import knw_dao
from dao.lexicon_dao import lexicon_dao
from dao.taxonomy_dao import taxonomy_dao
from utils.common_response_status import CommonResponseStatus
from utils.log_info import Logger


class knwService:
    def knowledgeNetwork_save(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        knw_id = -1
        try:
            # 知识网络是否存在
            knowledgeNetwork_name = params_json.get("knw_name")
            knw_info_list = knw_dao.get_id_by_name(knowledgeNetwork_name)
            if len(knw_info_list) > 0:
                obj['cause'] = "knowledgeNetwork name already existed "
                obj['code'] = "Builder.service.knw_service.knwService.knowledgeNetwork_save.NameRepeat"
                obj['message'] = "insert fail"
                
                return 500, obj, -1

            knowledgeNetwork_id = knw_dao.insert_knowledgeNetwork(params_json)
            if knowledgeNetwork_id == 0:
                obj['cause'] = "knowledgeNetwork name already existed "
                obj['code'] = "Builder.service.knw_service.knwService.knowledgeNetwork_save.NameRepeat"
                obj['message'] = "insert fail"
                
                return 500, obj, -1
            res = {}
            res["knowledgeNetwork_id"] = knowledgeNetwork_id
            obj["res"] = res
            knw_id = knowledgeNetwork_id

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            obj['cause'] = err
            obj['code'] = "Builder.service.knw_service.knwService.knowledgeNetwork_save.RequestError"
            obj['message'] = "insert fail"
            if "Duplicate entry" in err:
                obj['cause'] = "database already have the same name"
                obj['message'] = "insert fail"
                
        return ret_code, obj, knw_id

    def getKnw(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            knw_ids = params_json.get("res_list", [])
            knw_name = ""
            if "knw_name" in params_json.keys():
                knw_name = params_json["knw_name"]
            page = int(params_json.get("page"))
            size = int(params_json.get("size"))
            order = params_json.get("order")
            rule = params_json.get("rule")
            if rule == "create":
                rule = "create_time"
            elif rule == "update":
                rule = "update_time"

            ret = knw_dao.get_count(knw_name, knw_ids)
            count = len(ret)

            rec_dict = knw_dao.get_knw_by_name(knw_name, page - 1, size, order, rule, knw_ids)

            for rec in rec_dict:
                intelligence_score = rec.get('intelligence_score', -1.0)
                rec['intelligence_score'] = '{:.2f}'.format(intelligence_score)

            res = {"count": count,
                   "df": rec_dict}
            obj["res"] = res

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = "Builder.service.knw_service.knwService.getKnw.RequestError"
            obj['message'] = "query knowledge network fail"
            obj['solution'] = "Please check mariadb or sql"
                
        return ret_code, obj

    def get_create_service_knw(self, page, size, user_id):
        knw_ids = []
        # knw_ids = data_auth.get_data_ids_by_permission("kn", user_id, "KN_ADD_SERVICE")
        # if len(knw_ids) == 0:
        #     return 200, {"count": 0, "df": []}
        count = knw_dao.get_count_by_ids(knw_ids)
        ret = knw_dao.get_knw_by_ids(knw_ids, page, size)
        
        return 200, {"count": count, "df": ret}


    def editKnw(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            knw_id = int(params_json["knw_id"])
            knw_name = params_json["knw_name"]
            knw_info_list = knw_dao.get_knw_by_id(knw_id)
            if len(knw_info_list) == 0:
                # 知识网络不存在
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "id  %s not exist!" % knw_id
                obj['code'] = "Builder.service.knw_service.knwService.editKnw.RequestError"
                obj['message'] = "update fail"
                
                return ret_code, obj

            knw_info_list = knw_dao.get_id_by_name(knw_name)
            if len(knw_info_list) > 0 and knw_info_list[0]["id"] != knw_id:
                obj['cause'] = "knowledgeNetwork name already existed "
                obj['code'] = "Builder.service.knw_service.knwService.editKnw.NameRepeat"
                obj['message'] = "insert fail"
                
                return CommonResponseStatus.SERVER_ERROR.value, obj

            knw_dao.edit_knw(params_json)

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = "Builder.service.knw_service.knwService.editKnw.RequestError"
            obj['message'] = "query grape fail"
            obj['solution'] = "Please check mariadb or sql"
                
        return ret_code, obj

    def deleteKnw(self, params_json):
        knw_id = params_json["knw_id"]
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            ret = knw_dao.get_creator(knw_id)
            if len(ret) <= 0:
                # 找不到知识网络
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.knw_service.knwService.deleteKnw.RequestError"
                obj["Description"] = "not find the knowledge network"
                obj["Solution"] = _l("Please check your parameters.")
                obj["ErrorDetails"] = "delete error"
                obj["ErrorLink"] = ""
                
                return ret_code, obj

            ret_relation = knw_dao.get_relation(knw_id)
            if len(ret_relation) > 0:
                # 存在知识图谱，无法删除
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.knw_service.knwService.deleteKnw.GraphNotEmptyError"
                obj["Description"] = "the knowledge network still include knowledge!"
                obj["Solution"] = "Please delete all knowledge representations in the knowledge network first!"
                obj["ErrorDetails"] = "Deletion failed"
                obj["ErrorLink"] = ""
                
                return ret_code, obj

            # 存在词库，无法删除
            count = lexicon_dao.get_lexicon_count(knw_id, [])
            if count > 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.knw_service.knwService.deleteKnw.LexiconNotEmptyError"
                obj["Description"] = "the knowledge network still include lexicon!"
                obj["Solution"] = "Please delete all lexicon in the knowledge network first!"
                obj["ErrorDetails"] = "Deletion failed"
                obj["ErrorLink"] = ""
                
                return ret_code, obj

            # 存在数据源，无法删除
            count = dsm_dao.getCountByKnwId([], knw_id, '', None)
            if count > 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.knw_service.knwService.deleteKnw.DataSourceNotEmptyError"
                obj["Description"] = "the knowledge network still include data source!"
                obj["Solution"] = "Please delete all data source in the knowledge network first!"
                obj["ErrorDetails"] = "Deletion failed"
                obj["ErrorLink"] = ""
                
                return ret_code, obj

            count = len(function_dao.get_function_by_knw([knw_id]))
            if count > 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.knw_service.knwService.deleteKnw.FunctionNotEmptyError"
                obj["Description"] = "the knowledge network still include function!"
                obj["Solution"] = "Please delete all function in the knowledge network first!"
                obj["ErrorDetails"] = "Deletion failed"
                obj["ErrorLink"] = ""
                
                return ret_code, obj

            # 存在术语库 无法删除
            taxonomies = taxonomy_dao.get_taxonomy_list({'knw_id': knw_id,
                                                         'rule': 'update_time',
                                                         'order': 'desc'})
            if len(taxonomies) != 0:
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.knw_service.knwService.deleteKnw.TaxonomyNotEmptyError"
                obj["Description"] = "the knowledge network still include taxonomy!"
                obj["Solution"] = "Please delete all taxonomy in the knowledge network first!"
                obj["ErrorDetails"] = "Deletion failed"
                obj["ErrorLink"] = ""
                
                return ret_code, obj

            knw_dao.delete_knw(knw_id)

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['Description'] = "you have an error in your SQL!"
            else:
                obj['Description'] = err
            obj['ErrorCode'] = "Builder.service.knw_service.knwService.deleteKnw.RequestError"
            obj['ErrorDetails'] = "query grape fail"
            obj['Solution'] = "Please check mariadb or sql"
            obj["ErrorLink"] = ""
            
        return ret_code, obj

    def getGraph(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            # engine接口暂时不支持传userid，返回所有的，后期engine调用builder接口添加userid后去除此判断
            graph_ids = None
            knw_id = params_json["knw_id"]
            page = int(params_json["page"])
            size = int(params_json["size"])
            order = params_json["order"]
            rule = params_json["rule"]
            filter = params_json.get("filter", 'all')
            if rule == "create":
                rule = "create_time"
            if rule == "update":
                rule = "update_time"
            if rule == "name":
                rule = "graph_name"
            graph_name = params_json["name"]
            graph_name = graph_name.replace("_", "\_")
            graph_name = graph_name.replace("'", "\\'")
            ret = knw_dao.get_all_graph(knw_id, graph_ids, graph_name, filter)
            count = len(ret)
            ret = knw_dao.get_graph_by_knw(knw_id, graph_ids, page - 1, size, order, graph_name, rule, filter)
            res = {"count": count, "df": ret}
            obj["res"] = res

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['Description'] = "you have an error in your SQL!"
            else:
                obj['Description'] = err
            obj['ErrorCode'] = "Builder.service.knw_service.knwService.getGraph.RequestError"
            obj['ErrorDetails'] = "query grape fail"
            obj['Solution'] = "Please check mariadb or sql"
            obj["ErrorLink"] = ""
            
        return ret_code, obj

    def updateKnw(self, graph_id):
        return knw_dao.update_knw(graph_id)

    def check_knw_id(self, params_json):
        '''
        check whether knw_id exists.
        Args:
            params_json: consist of 'knw_id'.
        Returns:
            ret_code: return code
            obj: return object
        '''
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            knw_id = params_json["knw_id"]
            if knw_id == "-1":
                return ret_code, obj
            res = knw_dao.check_knw_id(knw_id)
            if len(res) == 0:
                ret_code = CommonResponseStatus.BAD_REQUEST.value
                obj['detail'] = "knw_id not exist!"
                obj['code'] = "Builder.service.knw_service.knwService.check_knw_id.KnwNotExist"
                obj['des'] = "knw_id not exist!"
                obj['solution'] = "Please check knw_id not exist!"
                
                return ret_code, obj
            
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            error_log = log_oper.get_error_log(err, sys._getframe(), traceback.format_exc())
            Logger.log_error(error_log)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['des'] = "you have an error in your SQL!"
            else:
                obj['des'] = err
            obj['code'] = "Builder.service.knw_service.knwService.graphRelation.RequestError"
            obj['detail'] = "insert fail"
            obj['solution'] = "Please check mariadb or sql"
                
        return ret_code, obj

    def check_exists_by_knw_id(self, knw_id):
        knw = knw_dao.check_knw_id(knw_id)
        
        if len(knw) == 0:
            return False
        else:
            return True

    def get_graph_by_knw_id_s(self, knw_id):
        res = knw_dao.get_graph_by_knw_id(knw_id)
        graph_ids = []
        for graph_id in res:
            graph_ids.append(graph_id["graph_id"])

        return graph_ids

    def get_uuid(self):
        return request.headers.get("userId")


knw_service = knwService()

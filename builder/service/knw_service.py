from distutils.util import strtobool

from dao.knw_dao import knw_dao
from utils.common_response_status import CommonResponseStatus
from utils.log_info import Logger
from flask import request


class knwService:
    def knowledgeNetwork_save(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        knw_id = -1
        try:
            # 知识网络是否存在
            knowledgeNetwork_name = params_json.get("knw_name")
            res = knw_dao.get_id_by_name(knowledgeNetwork_name)
            if len(res) > 0:
                obj['cause'] = "knowledgeNetwork name already existed "
                obj['code'] = "Builder.service.knw_service.knwService.knowledgeNetwork_save.NameRepeat"
                obj['message'] = "insert fail"
                return 500, obj, -1

            knowledgeNetwork_id = knw_dao.insert_knowledgeNetwork(params_json)
            res = {}
            res["knowledgeNetwork_id"] = knowledgeNetwork_id
            obj["res"] = res
            knw_id = knowledgeNetwork_id

            return ret_code, obj, knw_id

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            print(e)
            err = repr(e)
            Logger.log_error(err)
            obj['cause'] = err
            obj['code'] = "Builder.service.knw_service.knwService.knowledgeNetwork_save.RequestError"
            obj['message'] = "insert fail"
            if "Duplicate entry" in err:
                obj['cause'] = "database already have the same name"
                obj['code'] = CommonResponseStatus.USRPASS_ERROR.value
                obj['message'] = "insert fail"
            else:
                obj['cause'] = " You have error in Mysql"
            return ret_code, obj, knw_id

    def getKnw(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}

        try:
            knw_name = ""
            if "knw_name" in params_json.keys():
                knw_name = params_json["knw_name"]
            page = int(params_json.get("page"))
            size = int(params_json.get("size"))
            order = params_json.get("order")
            rule = params_json.get("rule")
            if rule == "create":
                rule = "creation_time"
            elif rule == "update":
                rule = "update_time"

            ret = knw_dao.get_count(knw_name)
            count = len(ret)

            ret = knw_dao.get_knw_by_name(knw_name, page - 1, size, order, rule)
            rec_dict = ret.to_dict('records')
            res = {"count": count, "df": rec_dict}
            obj["res"] = res

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['cause'] = "you have an error in your SQL!"
            else:
                obj['cause'] = err
            obj['code'] = "Builder.service.knw_service.knwService.getKnw.RequestError"
            obj['message'] = "query knowledge network fail"
            obj['solution'] = "Please check mariadb or sql"
        return ret_code, obj

    def editKnw(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            knw_id = int(params_json["knw_id"])
            knw_name = params_json["knw_name"]
            df = knw_dao.get_knw_by_id(knw_id)
            if len(df) == 0:
                # 知识网络不存在
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj['cause'] = "id  %s not exist!" % knw_id
                obj['code'] = "Builder.service.knw_service.knwService.editKnw.RequestError"
                obj['message'] = "update fail"
                return ret_code, obj

            res = knw_dao.get_id_by_name(knw_name)
            if len(res) > 0 and res.to_dict('records')[0]["id"] != knw_id:
                obj['cause'] = "knowledgeNetwork name already existed "
                obj['code'] = "Builder.service.knw_service.knwService.editKnw.NameRepeat"
                obj['message'] = "insert fail"
                return CommonResponseStatus.SERVER_ERROR.value, obj

            knw_dao.edit_knw(params_json)

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
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
            ret = knw_dao.get_knw_by_id(knw_id)
            if len(ret) <= 0:
                # 找不到知识网络
                ret_code = CommonResponseStatus.SERVER_ERROR.value
                obj["ErrorCode"] = "Builder.service.knw_service.knwService.deleteKnw.RequestError"
                obj["Description"] = "not find the knowledge network"
                obj["Solution"] = "Please check your parameters"
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

            knw_dao.delete_knw(knw_id)

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
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
            knw_id = params_json["knw_id"]
            page = int(params_json["page"])
            size = int(params_json["size"])
            order = params_json["order"]
            rule = params_json["rule"]
            upload_graph = params_json.get("upload_graph", 'false')
            upload_graph = strtobool(upload_graph)
            if rule == "create":
                rule = "create_time"
            if rule == "update":
                rule = "update_time"
            if rule == "name":
                rule = "KG_name"
            graph_name = params_json["name"]
            graph_name = graph_name.replace("_", "\_")
            ret = knw_dao.get_all_graph(knw_id, graph_name, upload_graph)
            count = len(ret)
            ret = knw_dao.get_graph_by_knw(knw_id, page - 1, size, order, graph_name, rule,
                                           upload_graph)
            res = {"count": count, "df": ret}
            obj["res"] = res

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['Description'] = "you have an error in your SQL!"
            else:
                obj['Description'] = err
            obj['ErrorCode'] = "Builder.service.knw_service.knwService.getGraph.RequestError"
            obj['ErrorDetails'] = "query grape fail"
            obj['Solution'] = "Please check mariadb or sql"
            obj["ErrorLink"] = ""
        return ret_code, obj

    def graphRelation(self, params_json):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            knw_id = params_json["knw_id"]
            graph_id = params_json["graph_id"]
            knw_dao.insert_graph_relation(knw_id, graph_id)

        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['des'] = "you have an error in your SQL!"
            else:
                obj['des'] = err
            obj['code'] = "Builder.service.knw_service.knwService.graphRelation.RequestError"
            obj['detail'] = "insert fail"
            obj['solution'] = "Please check mariadb or sql"
        return ret_code, obj

    def deleteRelation(self, knw_id, graph_ids):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            knw_dao.delete_graph_relation(knw_id, graph_ids)
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['des'] = "you have an error in your SQL!"
            else:
                obj['des'] = err
            obj['code'] = "Builder.service.knw_service.knwService.deleteRelation.RequestError"
            obj['detail'] = "delete fail"
            obj['solution'] = "Please check mariadb or sql"
        return ret_code, obj

    def updateKnw(self, graph_id):
        return knw_dao.update_knw(graph_id)

    def check_knw_id(self, params_json, delete_graph=False):
        ret_code = CommonResponseStatus.SUCCESS.value
        obj = {}
        try:
            knw_id = params_json["knw_id"]
            df = knw_dao.check_knw_id(knw_id)
            res = df.to_dict('records')
            if len(res) == 0:
                ret_code = CommonResponseStatus.BAD_REQUEST.value
                obj['detail'] = "knw_id not exist!"
                obj['code'] = "Builder.service.knw_service.knwService.check_knw_id.KnwNotExist"
                obj['des'] = "knw_id not exist!"
                obj['solution'] = "Please check knw_id not exist!"
                return ret_code, obj
            if delete_graph:
                graphids = params_json["graphids"]
                df = knw_dao.check_knw_graph(knw_id, graphids)
                res = df.to_dict('records')
                if len(res) != len(graphids):
                    ret_code = CommonResponseStatus.BAD_REQUEST.value
                    obj['detail'] = "The knowledge network does not match the graph!"
                    obj['code'] = CommonResponseStatus.GRAPH_NOT_KNW.value
                    obj['des'] = "The knowledge network does not match the graph!"
                    obj['solution'] = "Please check knw_id or graph_id!"
        except Exception as e:
            ret_code = CommonResponseStatus.SERVER_ERROR.value
            err = repr(e)
            Logger.log_error(err)
            if "SQL" in err or "DatabaseError" in err or "MariaDB" in err:
                obj['des'] = "you have an error in your SQL!"
            else:
                obj['des'] = err
            obj['code'] = "Builder.service.knw_service.knwService.graphRelation.RequestError"
            obj['detail'] = "insert fail"
            obj['solution'] = "Please check mariadb or sql"
        return ret_code, obj

    def check_exists_by_knw_id(self, knw_id):
        df = knw_dao.check_knw_id(knw_id)
        knw = df.to_dict(orient="records")
        if len(knw) == 0:
            return False
        else:
            return True

    def get_graph_by_knw_id_s(self, knw_id):
        df = knw_dao.get_graph_by_knw_id(knw_id)
        result = df["graph_id"].to_dict()
        return result



knw_service = knwService()

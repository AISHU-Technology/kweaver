# -*- coding: utf-8 -*-
from flask import Blueprint, request, jsonify
from utils.CommonUtil import commonutil
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from dao.subject_dao import tm, delete_subject_task, update_subject_task, query_subject_task, search_subject_task, search_kgs_subject_task
from utils.sentence_embedding import SentenceEncoder
from service.graph_Service import graph_Service
from utils.ConnectUtil import mongoConnect


task_controller_open_kc = Blueprint('task_controller_open_kc', __name__)


# parameter verification
def check_params(input_params_json, sub_method=None):

    if "kg_id" not in input_params_json:
        return 400, {"cause": "param is missing", "message": "kg_id is required", "code": 400000}

    if sub_method != "search" and "subject_id" not in input_params_json:
        return 400, {"cause": "param is missing", "message": "subject_id is required", "code": 400000}

    if sub_method in ["create", "update"]:
        params_list = ["subject_path", "subject_fold", "subject_name", "subject_desc", "subject_label", "subject_document"]
        for param in params_list:
            if param not in input_params_json:
                return 400, {"cause": "param is missing", "message": "{} is required".format(param), "code": 400000}
    elif sub_method in ["get"]:
        params_list = ["page", "limit"]
        for param in params_list:
            if param not in input_params_json:
                return 400, {"cause": "param is missing", "message": "{} is required".format(param), "code": 400000}
    elif sub_method in ["search"]:
        params_list = ["subject_path", "subject_fold", "subject_name", "subject_desc", "subject_label", "page", "limit"]
        for param in params_list:
            if param not in input_params_json:
                return 400, {"cause": "param is missing", "message": "{} is required".format(param), "code": 400000}

    if "kg_id" in input_params_json:
        if sub_method == "get":
            if isinstance(input_params_json["kg_id"], str) and not input_params_json["kg_id"].isdigit():
                return 400, {"cause": "param is not valid", "message": "kg_id is not digit", "code": 400000}
        else:
            if not isinstance(input_params_json["kg_id"], int):
                return 400, {"cause": "param is not valid", "message": "kg_id is not digit", "code": 400000}

    if "subject_id" in input_params_json:
        if sub_method == "get":
            if isinstance(input_params_json["subject_id"], str) and not input_params_json["subject_id"].isdigit():
                return 400, {"cause": "param is not valid", "message": "subject_id is not digit", "code": 400000}
        else:
            if not isinstance(input_params_json["subject_id"], int):
                return 400, {"cause": "param is not valid", "message": "subject_id is not digit", "code": 400000}

    if "subject_name" in input_params_json:

        if not isinstance(input_params_json["subject_name"], str):
            return 400, {"cause": "param is not valid", "message": "subject_name is not str", "code": 400000}
        if sub_method != "search":
            if input_params_json["subject_name"] == "":
                return 400, {"cause": "param is not valid", "message": "subject_name should not be empty", "code": 400000}
    if "page" in input_params_json:
        if sub_method == "get":
            if isinstance(input_params_json["page"], str) and not input_params_json["page"].isdigit():
                return 400, {"cause": "param is not valid", "message": "page is not digit", "code": 400000}
        else:
            if not isinstance(input_params_json["page"], int):
                return 400, {"cause": "param is not valid", "message": "page is not digit", "code": 400000}
        if int(input_params_json["page"]) <= 0:
            return 400, {"cause": "param is not valid", "message": "page should bigger than 0", "code": 400000}

    if "limit" in input_params_json:
        if sub_method == "get":
            if isinstance(input_params_json["limit"], str) and not input_params_json["limit"].isdigit():
                return 400, {"cause": "param is not valid", "message": "limit is not digit", "code": 400000}
        else:
            if not isinstance(input_params_json["limit"], int):
                return 400, {"cause": "param is not valid", "message": "limit is not digit", "code": 400000}
        if int(input_params_json["limit"]) <= 0:
            return 400, {"cause": "param is not valid", "message": "limit should bigger than 0", "code": 400000}
    if "subject_fold" in input_params_json:
        if not isinstance(input_params_json["subject_fold"], str):
            return 400, {"cause": "param is not valid", "message": "subject_fold is not str", "code": 400000}
    if "subject_path" in input_params_json:
        if not isinstance(input_params_json["subject_path"], str):
            return 400, {"cause": "param is not valid", "message": "subject_path is not str", "code": 400000}
    if "doc_title_keyword" in input_params_json:
        if not isinstance(input_params_json["doc_title_keyword"], str):
            return 400, {"cause": "param is not valid", "message": "doc_title_keyword is not str", "code": 400000}
    if "subject_desc" in input_params_json:
        if not isinstance(input_params_json["subject_desc"], str):
            return 400, {"cause": "param is not valid", "message": "subject_desc is not str", "code": 400000}
    if "subject_label" in input_params_json:
        if not isinstance(input_params_json["subject_label"], list):
            return 400, {"cause": "param is not valid", "message": "subject_label is not list", "code": 400000}
        if len(input_params_json["subject_label"]) and not isinstance(input_params_json["subject_label"][0], dict):
            return 400, {"cause": "param is not valid", "message": "subject_label is not list[dict]", "code": 400000}
        if len(input_params_json["subject_label"]) and "name" not in input_params_json["subject_label"][0]:
            return 400, {"cause": "param is not valid", "message": "subject_label should contain name", "code": 400000}

    if "subject_document" in input_params_json:
        if not isinstance(input_params_json["subject_document"], list):
            return 400, {"cause": "param is not valid", "message": "subject_document is not list", "code": 400000}
        if len(input_params_json["subject_document"]) and not isinstance(input_params_json["subject_document"][0], dict):
            return 400, {"cause": "param is not valid", "message": "subject_document is not list[dict]", "code": 400000}
        if len(input_params_json["subject_document"]) and "score" not in input_params_json["subject_document"][0]:
            return 400, {"cause": "param is not valid", "message": "subject_document should contain score", "code": 400000}
        if len(input_params_json["subject_document"]) and "gns" not in input_params_json["subject_document"][0]:
            return 400, {"cause": "param is not valid", "message": "subject_document should contain gns", "code": 400000}

    if sub_method in ["search"]:
        if input_params_json["subject_name"].strip() == "" \
                and input_params_json["subject_desc"].strip() == "" \
                and len(input_params_json["subject_label"]) == 0:
            return 400, {"cause": "param is not valid",
                         "message": "subject_name subject_desc subject_label should not be empty at all",
                         "code": 400000}

    return 200, ""


def check_params_v2(input_params_json, sub_method=None):
    params_list = ["kg_id_list", "subject_path", "subject_fold", "subject_name",
                   "subject_desc", "subject_label", "page", "limit", "filter_documents"]
    for param in params_list:
        if param not in input_params_json:
            return 400, {"cause": "param is missing", "message": "{} is required".format(param), "code": 400000}

    if not isinstance(input_params_json["kg_id_list"], list):
        return 400, {"cause": "param is not valid", "message": "kg_id_list is not list", "code": 400000}

    if len(input_params_json["kg_id_list"]) == 0:
        return 400, {"cause": "param is not valid", "message": "kg_id_list is not empty", "code": 400000}
    for kg_id in input_params_json["kg_id_list"]:
        if not isinstance(kg_id, int):
            return 400, {"cause": "param is not valid", "message": "kg_id {} is not digit".format(kg_id), "code": 400000}

    if not isinstance(input_params_json["subject_path"], str):
        return 400, {"cause": "param is not valid", "message": "subject_path is not str", "code": 400000}

    if not isinstance(input_params_json["subject_fold"], list):
        return 400, {"cause": "param is not valid", "message": "subject_fold is not list", "code": 400000}

    if not isinstance(input_params_json["subject_name"], str):
        return 400, {"cause": "param is not valid", "message": "subject_name is not str", "code": 400000}
    # if input_params_json["subject_name"] == "":
    #     return 400, {"cause": "param is not valid", "message": "subject_name should not be empty", "code": 400000}

    if not isinstance(input_params_json["subject_desc"], str):
        return 400, {"cause": "param is not valid", "message": "subject_desc is not str", "code": 400000}

    if not isinstance(input_params_json["subject_label"], list):
        return 400, {"cause": "param is not valid", "message": "subject_label is not list", "code": 400000}
    if len(input_params_json["subject_label"]) and not isinstance(input_params_json["subject_label"][0], dict):
        return 400, {"cause": "param is not valid", "message": "subject_label is not list[dict]", "code": 400000}
    if len(input_params_json["subject_label"]) and "name" not in input_params_json["subject_label"][0]:
        return 400, {"cause": "param is not valid", "message": "subject_label should contain name", "code": 400000}

    if not isinstance(input_params_json["page"], int):
            return 400, {"cause": "param is not valid", "message": "page is not digit", "code": 400000}
    if int(input_params_json["page"]) <= 0:
        return 400, {"cause": "param is not valid", "message": "page should bigger than 0", "code": 400000}

    if not isinstance(input_params_json["limit"], int):
            return 400, {"cause": "param is not valid", "message": "limit is not digit", "code": 400000}
    if int(input_params_json["limit"]) <= 0:
        return 400, {"cause": "param is not valid", "message": "limit should bigger than 0", "code": 400000}

    if not isinstance(input_params_json["filter_documents"], list):
        return 400, {"cause": "param is not valid", "message": "filter_documents is not list", "code": 400000}
    for f_document in input_params_json["filter_documents"]:
        if not isinstance(f_document, str):
            return 400, {"cause": "param is not valid",
                         "message": "filter_documents {} is not str".format(f_document),
                         "code": 400000}
    if len(input_params_json["filter_documents"]) and not isinstance(input_params_json["filter_documents"][0], str):
        return 400, {"cause": "param is not valid", "message": "filter_documents is not list[str]", "code": 400000}

    if input_params_json["subject_name"].strip() == "" \
            and input_params_json["subject_desc"].strip() == "" \
            and len(input_params_json["subject_label"]) == 0:
        return 400, {"cause": "param is not valid",
                     "message": "subject_name subject_desc subject_label should not be empty at all",
                     "code": 400000}

    return 200, ""


# create theme
@task_controller_open_kc.route('/subject', methods=["POST"], strict_slashes=False)
def create_subject():
    method = request.method
    if method == "POST":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            ret_code, message = check_params(params_json, "create")
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=message["cause"], code=message["code"],
                                             message=message["message"]), CommonResponseStatus.BAD_REQUEST.value
            kg_id = params_json["kg_id"]
            ret_code, task_res = tm.submit_subject_task(kg_id,
                                                        subject_id=params_json["subject_id"],
                                                        subject_path=params_json["subject_path"],
                                                        subject_fold=params_json["subject_fold"],
                                                        subject_name=params_json["subject_name"],
                                                        subject_desc=params_json["subject_desc"],
                                                        subject_label=params_json["subject_label"],
                                                        subject_document=params_json["subject_document"])
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=task_res["cause"],
                                             code=task_res["code"],
                                             message=task_res["message"]), CommonResponseStatus.SERVER_ERROR.value
            return Gview.text_match_return(data=task_res), CommonResponseStatus.SUCCESS.value
        else:
            return Gview.BuFailVreturnV2(cause=param_message,
                                         code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                         message="Incorrect parameter format"), CommonResponseStatus.SERVER_ERROR.value


# delete theme
@task_controller_open_kc.route('/subject/deletion', methods=["POST"], strict_slashes=False)
def delete_subject():
    method = request.method
    if method == "POST":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            ret_code, message = check_params(params_json, "delete")
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=message["cause"], code=message["code"],
                                             message=message["message"]), CommonResponseStatus.BAD_REQUEST.value
            kg_id = params_json["kg_id"]
            subject_id = params_json["subject_id"]
            ret_code, task_res = delete_subject_task(kg_id, subject_id)

            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=task_res["cause"], code=task_res["code"],
                                             message=task_res["message"]), CommonResponseStatus.SERVER_ERROR.value

            return Gview.text_match_return(data={"state": "success"}), CommonResponseStatus.SUCCESS.value

        else:
            return Gview.BuFailVreturnV2(cause=param_message,
                                         code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                         message="Incorrect parameter format"), CommonResponseStatus.SERVER_ERROR.value


# Edit theme
@task_controller_open_kc.route('/subject/update', methods=["POST"], strict_slashes=False)
def update_subject():
    method = request.method
    if method == "POST":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            ret_code, message = check_params(params_json, "update")
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=message["cause"], code=message["code"],
                                             message=message["message"]), CommonResponseStatus.BAD_REQUEST.value
            kg_id = params_json["kg_id"]
            # print(params_json)
            ret_code, task_res = update_subject_task(
                kg_id,
                subject_id=params_json["subject_id"],
                subject_path=params_json["subject_path"],
                subject_fold=params_json["subject_fold"],
                subject_name=params_json["subject_name"],
                subject_desc=params_json["subject_desc"],
                subject_label=params_json["subject_label"],
                subject_document=params_json["subject_document"])
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=task_res["cause"], code=task_res["code"],
                                             message=task_res["message"]), CommonResponseStatus.SERVER_ERROR.value

            return Gview.text_match_return(data={"state": "success"}), CommonResponseStatus.SUCCESS.value

        else:
            return Gview.BuFailVreturnV2(cause=param_message,
                                         code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                         message="Incorrect parameter format"), CommonResponseStatus.SERVER_ERROR.value


# Get topic-related documentation information
@task_controller_open_kc.route('/subject/document', methods=["GET"], strict_slashes=False)
def get_subject():
    method = request.method
    if method == "GET":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            ret_code, message = check_params(params_json, "get")
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=message["cause"], code=message["code"],
                                             message=message["message"]), CommonResponseStatus.BAD_REQUEST.value
            kg_id = params_json["kg_id"]
            subject_id = params_json["subject_id"]
            doc_title_keyword = params_json.get("doc_title_keyword", "")
            page = params_json["page"]
            limit = params_json["limit"]

            ret_code, task_res = query_subject_task(kg_id, subject_id=subject_id, doc_title_keyword=doc_title_keyword, page=page, limit=limit)
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=task_res["cause"], code=task_res["code"],
                                             message=task_res["message"]), CommonResponseStatus.SERVER_ERROR.value

            return Gview.text_match_return(data=task_res), CommonResponseStatus.SUCCESS.value

        else:
            return Gview.BuFailVreturnV2(cause=param_message,
                                         code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                         message="Incorrect parameter format"), CommonResponseStatus.SERVER_ERROR.value


@task_controller_open_kc.route('/subject/search', methods=["POST"], strict_slashes=False)
def search_subject():
    method = request.method
    if method == "POST":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            ret_code, message = check_params(params_json, "search")
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=message["cause"], code=message["code"],
                                             message=message["message"]), CommonResponseStatus.BAD_REQUEST.value
            kg_id = params_json["kg_id"]

            ret_code, task_res = search_subject_task(
                kg_id,
                subject_path=params_json["subject_path"],
                subject_fold=params_json["subject_fold"],
                subject_name=params_json["subject_name"],
                subject_desc=params_json["subject_desc"],
                subject_label=params_json["subject_label"],
                search_type=params_json.get("search_type", "mix"),
                page=params_json["page"],
                limit=params_json["limit"])
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=task_res["cause"],
                                             code=task_res["code"],
                                             message=task_res["message"]), CommonResponseStatus.SERVER_ERROR.value

            return Gview.text_match_return(data=task_res), CommonResponseStatus.SUCCESS.value

        else:
            return Gview.BuFailVreturnV2(cause=param_message,
                                         code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                         message="Incorrect parameter format"), CommonResponseStatus.SERVER_ERROR.value


@task_controller_open_kc.route('/subject/knowledge_graphs/search', methods=["POST"], strict_slashes=False)
def search_kgs_subject():
    method = request.method
    if method == "POST":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            ret_code, message = check_params_v2(params_json, "search_kgs")
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=message["cause"], code=message["code"],
                                             message=message["message"]), CommonResponseStatus.BAD_REQUEST.value
            kg_id = params_json["kg_id_list"]

            ret_code, task_res = search_kgs_subject_task(
                kg_id,
                subject_path=params_json["subject_path"],
                subject_fold=params_json["subject_fold"],
                subject_name=params_json["subject_name"],
                subject_desc=params_json["subject_desc"],
                subject_label=params_json["subject_label"],
                search_type=params_json.get("search_type", "vector"),
                page=params_json["page"],
                limit=params_json["limit"],
                filter_documents=params_json["filter_documents"])
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause=task_res["cause"],
                                             code=task_res["code"],
                                             message=task_res["message"]), CommonResponseStatus.SERVER_ERROR.value

            return Gview.text_match_return(data=task_res), CommonResponseStatus.SUCCESS.value

        else:
            return Gview.BuFailVreturnV2(cause=param_message,
                                         code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                         message="Incorrect parameter format"), CommonResponseStatus.SERVER_ERROR.value


def check_params_embedding(param_json):
    required_params = ["text"]
    redundants = []  # extra parameter
    lacks = []  # missing parameter
    ret_code = 200
    message = ""
    for k in param_json.keys():
        if k not in required_params and k not in ["type", "weights"]:
            redundants.append(k)
    if len(redundants) > 0:
        message += "redundant parameter: {}; ".format("、".join(redundants))
    for k in required_params:
        if k not in param_json.keys():
            lacks.append(k)
    if len(lacks) > 0:
        message += "missing parameter: {}; ".format("、".join(lacks))
    for k, v in param_json.items():
        if k == "text":
            if not isinstance(v, list):
                message += "parameter text must be list; "
            else:
                if len(v) == 0:
                    message += "parameter text can't be empty; "
        elif k == "type":
            if v and v not in ["mean", "max"]:
                message += "parameter type must in ['mean', 'max']; "
        elif k == "weights":
            if v and not isinstance(v, list):
                message += "parameter weights must be list; "
            else:
                for w in v:
                    if not isinstance(w, float) and not isinstance(w, int):
                        message += "parameter weights's element must be float or int; "
                        break
                    if w < 0:
                        message += "parameter weights's element must >= 0; "
                        
        else:
            message += "parameter error"
    if message:
        ret_code = 400
    
    return ret_code, message


@task_controller_open_kc.route('/embedding', methods=["POST"], strict_slashes=False)
def get_embeddings():
    res = []
    method = request.method
    MAX_BATCH = 100
    if method == "POST":
        param_code, params_json, param_message = commonutil.getMethodParam()
        if param_code == 0:
            ret_code, message = check_params_embedding(params_json)
            if ret_code != 200:
                return Gview.BuFailVreturnV2(cause="parameter error", code=400000,
                                             message=message), CommonResponseStatus.BAD_REQUEST.value
            texts = params_json.get("text", [])
            print("batch: ", len(texts))
            if len(texts) > MAX_BATCH:
                return Gview.BuFailVreturnV2(cause="text processed exceeds the maximum batch", code=500001,
                                             message="the text processed({}) exceeds the maximum batch".format(len(texts))), CommonResponseStatus.SERVER_ERROR.value
                
            feature_nums = len(texts[0])
            default_weights = [1] * feature_nums
            pooling_type = params_json.get("type", "mean")
            weights = params_json.get("weights", default_weights)
            embed_model = tm.embed_model
            sent_encoder = SentenceEncoder(embed_model=embed_model, pooling_method=pooling_type)
            for text in texts:
                emb = sent_encoder.get_document_embedding(text, weights)
                res.append(emb.tolist())
            obj = {"res": res}
            return jsonify(obj), 200
        
        
def check_params_topics(param_json):
    required_params = ["gns", "kg_id"]
    redundants = []  # extra parameter
    lacks = []  # missing parameter
    ret_code = 200
    message = ""
    for k, v in param_json.items():
        if k not in ["gns", "kg_id", "topk"]:
            redundants.append(k)
    if len(redundants) > 0:
        message += "redundant parameter: {}; ".format("、".join(redundants))
    for k in required_params:
        if k not in param_json.keys():
            lacks.append(k)
    if len(lacks) > 0:
        message += "missing parameter: {}; ".format("、".join(lacks))
    for k, v in param_json.items():
        if k == "kg_id":
            if not isinstance(v, int):
                message += "The parameter kg_id type must be int! "
            else:
                if v <= 0:
                    message += "The parameter kg_id must > 0! "
        elif k == "gns":
            if not isinstance(v, list):
                message += "The parameter gns must be list! "
            else:
                if len(v) > 100:
                    message += "the max num of gns is 100, length of gns is {} > 100! ".format(len(v))
                for ele in v:
                    if not isinstance(ele, str):
                        message += "The parameter gns must be list of string! "
        elif k == "topk":
            if not isinstance(v, int):
                message += "The parameter topk type must be int! "
            else:
                if v <= 0:
                    message += "The parameter topk must > 0! "
    if message:
        ret_code = 400
    return ret_code, message

    
@task_controller_open_kc.route('/topics', methods=["POST"], strict_slashes=False)
def get_topic_words():
    """ Find the corresponding subject word according to gns and id"""
    param_code, params_json, param_message = commonutil.getMethodParam()
    if param_code == 0:
        ret_code, message = check_params_topics(params_json)
        if ret_code != 200:
            obj = {}
            obj["ErrorCode"] = str(CommonResponseStatus.PARAMETERS_ERROR.value)
            obj["Description"] = "parameter error"
            obj["Solution"] = "Please check the parameters carefully"
            obj["ErrorDetails"] = str(message)
            obj["ErrorLink"] = ""
            return Gview.VErrorreturn(obj), CommonResponseStatus.BAD_REQUEST.value

        graph_id = params_json.get("kg_id")
        gns_list = params_json.get("gns", [])
        topk = params_json.get("topk", 10)
        # graph_id not found
        code, ret = graph_Service.checkById(graph_id)
        if code != 0:
            obj = {}
            obj["ErrorCode"] = str(ret["code"])
            obj["Description"] = "kg_id  %s not exist!" % str(graph_id)
            obj["Solution"] = "Please check the parameters carefully"
            obj["ErrorDetails"] = "kg_id error"
            obj["ErrorLink"] = ""
            return Gview.VErrorreturn(obj), CommonResponseStatus.SERVER_ERROR.value
        # # gns not found
        # mongodb = "mongoDB-" + str(graph_id) + "_gnsInfo"
        #
        # query = {"gns": gns}
        # dbconn = mongoConnect.connect_mongo()
        # gns_data = dbconn[mongodb].find(query, {'gns': 1, 'type': 1, 'name': 1, '_id': 0})
        # if gns_data.count() == 0:
        #     ret = {
        #             "cause": "gns %s not exist!" % gns,
        #             "code": 500003,
        #             "message": "gns error"
        #     }
        #     return jsonify(ret), 500

        code1, ret1 = graph_Service.get_topic_by_gns(graph_id, gns_list, topk)
        if code1 != 0:
            obj = {}
            obj["ErrorCode"] = str(500000)
            obj["Description"] = ret1["message"]
            obj["Solution"] = "please check carefully! "
            obj["ErrorDetails"] = ret1["cause"]
            obj["ErrorLink"] = ""
            return Gview.VErrorreturn(obj), CommonResponseStatus.BAD_REQUEST.value
        return jsonify(ret1), 200
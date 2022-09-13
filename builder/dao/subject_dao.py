# -*- coding: utf-8 -*-
# @Time : 2021/10/15 15:52
# @Author : jack.li
# @Email : jack.li@aishu.cn
# @File : task_manager.py
# @Project : builder
import os
import time
import bz2
import io
import json
import logging
import traceback
import requests
import pymongo
import jieba
import gridfs
import _pickle as cPickle
import numpy as np
# from pymongo import UpdateOne
from configparser import ConfigParser
from concurrent.futures import ThreadPoolExecutor, wait, ProcessPoolExecutor
from dao.graph_dao import graph_dao
from dao.task_dao import task_dao
from service.graph_Service import graph_Service
from utils.CommonUtil import commonutil
from controller import graph_count_controller
from utils.common_response_status import CommonResponseStatus
from utils.ConnectUtil import mongoClient
from utils.opensearch_util import OpenSearchManager
from common.errorcode import codes

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(lineno)d - %(message)s')
logger = logging.getLogger(__name__)

READY_STATE = -1
FINISH_STATE = 0
RUNNING_STATE = 1
NORMAL_STATUS = 200
EXCEPTION_STATUS = 500


# 异常处理装饰器
def except_decorator():
    def sub_func(func):
        def wrapper(*args, **kwargs):
            try:
                res = func(*args, **kwargs)
            except Exception as e:
                traceback.print_exc()
                return EXCEPTION_STATUS, {"message": str(e),
                                          "cause": "inner error",
                                          "code": CommonResponseStatus.REQUEST_ERROR.value}
            return res
        return wrapper
    return sub_func


# 向量均值计算
def min_embed(query_word_embed):
    query_word_embed_num = 0.0
    q = None
    for qv, qw in query_word_embed:
        if q is None:
            q = qv
        else:
            q += qv
        query_word_embed_num += qw
    q /= query_word_embed_num
    return q


# 执行orient sql 语句
def execute_orient_command(args, input_sql, sess=None):
    try:
        url = "http://{0}:{1}/command/{2}/sql".format(args["ip"], args["port"], args["database"])
        post_params = {
            "command": input_sql
        }

        res = sess.post(url, json=post_params)
        res_dict = json.loads(res.content)
    except Exception:
        traceback.print_exc()
        return EXCEPTION_STATUS, {"message": "OrientDB has something wrong!",
                                  "cause": "OrientDB has something wrong!",
                                  "code": CommonResponseStatus.REQUEST_ERROR.value}

    return NORMAL_STATUS, res_dict


# 获取mongodb 配置
def get_mongodb_db_config():
    return {
        "mongodb_ip": "kg-mongodb",
        "mongodb_port": 27017}


# 基础数据库连接工具
class BaseDBUtils(object):

    def init_db(self, **kwargs):
        pass #empty

    def delete_subject(self, subject_id):
        pass #empty

    def update_subject(self, **kwargs):
        pass #empty

    def query_subject(self, **kwargs):
        pass #empty


class MongoDBUtils(BaseDBUtils):

    def __init__(self):
        super(MongoDBUtils, self).__init__()
        self.db_name = None
        self.client_mon = None

    def init_db(self, **kwargs):
        pass


# orientdb 工具
class OrientDBUtils(BaseDBUtils):

    def init_db(self, **kwargs):
        self.sess = requests.Session()
        self.args = kwargs["args"]
        self.sess.auth = (self.args["user"], self.args["passwd"])

    # 查询subject_id 是否存在
    def query_subject_exits(self, subject_id):
        query_sql = "select @rid from subject where subject_id={}".format(subject_id)
        ret_code, data = execute_orient_command(self.args, query_sql, self.sess)
        if ret_code != NORMAL_STATUS:
            return EXCEPTION_STATUS, data

        if "result" in data:
            return NORMAL_STATUS, len(data["result"])
        return EXCEPTION_STATUS, {"cause": "inner error", "message": data,
                                  "code": CommonResponseStatus.REQUEST_ERROR.value}

    # 插入主题
    def insert_subject(self, **kwargs):
        subject_id = kwargs["subject_id"]
        subject_path = kwargs["subject_path"]
        subject_fold = kwargs["subject_fold"]
        subject_name = kwargs["subject_name"]
        subject_desc = kwargs["subject_desc"]
        subject_label = kwargs["subject_label"]
        subject_document = kwargs["subject_document"]

        # 插入点
        sql = "CREATE  VERTEX subject SET subject_id={subject_id}, subject_path = '{subject_path}', " \
              "subject_fold = '{subject_fold}', " \
              "name = '{subject_name}',  " \
              "subject_desc = '{subject_desc}' " \
            .format(subject_path=subject_path,
                    subject_fold=subject_fold,
                    subject_name=subject_name,
                    subject_desc=subject_desc,
                    subject_id=subject_id)
        ret_code, data = execute_orient_command(self.args, sql, self.sess)
        if ret_code != NORMAL_STATUS:
            return EXCEPTION_STATUS, data

        query_sql = "select @rid from subject where subject_id={} ".format(subject_id)
        ret_code, data = execute_orient_command(self.args, query_sql, self.sess)
        if ret_code != NORMAL_STATUS:
            return EXCEPTION_STATUS, data
        if "result" not in data or len(data["result"]) == 0:
            logger.error(data)
            return EXCEPTION_STATUS, {"message": "OrientDB has something wrong!",
                                      "cause": "OrientDB has something wrong!",
                                      "code": CommonResponseStatus.REQUEST_ERROR.value}
        subject_rid = data["result"][0]["@rid"]

        # 插入标签边
        for label in subject_label:
            insert_sql = "update label set name='{0}', type_kc=true upsert where name='{0}'".format(label["name"])
            execute_orient_command(self.args, insert_sql, self.sess)

            query_sql = "select @rid from label where name='{}'".format(label["name"])
            ret_code, data = execute_orient_command(self.args, query_sql, self.sess)
            if ret_code != NORMAL_STATUS:
                continue
            if "result" not in data:
                continue
            if len(data["result"]) == 0:
                continue
            label_rid = data["result"][0]["@rid"]

            insert_sql = "CREATE EDGE label2subject FROM {0} TO {1} set name='label2subject'".format(
                label_rid, subject_rid)
            execute_orient_command(self.args, insert_sql, self.sess)

        # 插入文档边
        for document in subject_document:
            query_sql = "select @rid from document where gns='{}'".format(document["gns"])
            ret_code, data = execute_orient_command(self.args, query_sql, self.sess)
            if ret_code != NORMAL_STATUS:
                continue
            if "result" not in data:
                continue
            if len(data["result"]) == 0:
                continue
            document_rid = data["result"][0]["@rid"]

            sql = "CREATE EDGE subject2document FROM {0} TO {1} set name='subject2document', score={2}".format(
                subject_rid, document_rid, document.get("score", 0.0))
            execute_orient_command(self.args, sql, self.sess)

    # 删除主题
    def delete_subject(self, subject_id):
        query_sql = "select @rid, out(subject2document).@rid, in(label2subject).@rid from subject where subject_id={}".format(
            subject_id)
        recode, res_dict = execute_orient_command(self.args, query_sql, self.sess)
        if recode != NORMAL_STATUS:
            return EXCEPTION_STATUS, res_dict

        vertex_list = []
        sub2doc_edge_pair_list = []
        lab2sub_edge_pair_list = []
        for doc_info in res_dict.get("result", []):
            vertex_list.append(doc_info["@rid"])
            for sub_rid in doc_info["out(subject2document).@rid"]:
                sub2doc_edge_pair_list.append((doc_info["@rid"], sub_rid))
            for label_rid in doc_info["in(label2subject).@rid"]:
                lab2sub_edge_pair_list.append((label_rid, doc_info["@rid"]))

        for edge_v1, edge_v2 in sub2doc_edge_pair_list:
            sql = "DELETE EDGE FROM {} TO {} where @class='subject2document'".format(edge_v1, edge_v2)
            execute_orient_command(self.args, sql, self.sess)

        for edge_v1, edge_v2 in lab2sub_edge_pair_list:
            sql = "DELETE EDGE FROM {} TO {} where @class='label2subject'".format(edge_v1, edge_v2)
            execute_orient_command(self.args, sql, self.sess)

        for vertex in vertex_list:
            sql = "delete vertex {}".format(vertex)
            execute_orient_command(self.args, sql, self.sess)

        logger.info("delete vertex {}".format(len(vertex_list)))
        logger.info("delete sub2doc edge {}".format(len(sub2doc_edge_pair_list)))
        logger.info("delete label2sub edge {}".format(len(lab2sub_edge_pair_list)))

    # 更新主题
    def update_subject(self, **kwargs):
        subject_id = kwargs["subject_id"]
        subject_path = kwargs["subject_path"]
        subject_fold = kwargs["subject_fold"]
        subject_name = kwargs["subject_name"]
        subject_desc = kwargs["subject_desc"]
        subject_label = kwargs["subject_label"]
        subject_document = kwargs["subject_document"]

        sql = "UPDATE subject SET subject_path = '{subject_path}', " \
              "subject_fold = '{subject_fold}', " \
              "name = '{subject_name}',  " \
              "subject_desc = '{subject_desc}' WHERE subject_id = {subject_id}" \
            .format(subject_path=subject_path,
                    subject_fold=subject_fold,
                    subject_name=subject_name,
                    subject_desc=subject_desc,
                    subject_id=subject_id)
        ret_code, data = execute_orient_command(self.args, sql, self.sess)
        if ret_code != NORMAL_STATUS:
            return EXCEPTION_STATUS, data

        query_sql = "select @rid from subject where subject_id={}".format(subject_id)
        ret_code, data = execute_orient_command(self.args, query_sql, self.sess)
        if ret_code != NORMAL_STATUS:
            return EXCEPTION_STATUS, data
        subject_rid = data["result"][0]["@rid"]

        # 插入label 邊
        for label in subject_label:
            insert_sql = "update label set name='{0}', type_kc=true upsert where name='{0}'".format(label["name"])
            execute_orient_command(self.args, insert_sql, self.sess)

            query_sql = "select @rid from label where name='{}'".format(label["name"])
            ret_code, data = execute_orient_command(self.args, query_sql, self.sess)
            if ret_code != NORMAL_STATUS:
                continue
            if "result" not in data:
                continue
            if len(data["result"]) == 0:
                continue
            label_rid = data["result"][0]["@rid"]

            insert_sql = "CREATE EDGE label2subject FROM {0} TO {1} set name='label2subject'".format(
                label_rid, subject_rid)
            execute_orient_command(self.args, insert_sql, self.sess)

        # 插入文档边
        for document in subject_document:
            query_sql = "select @rid from document where gns='{}'".format(document["gns"])
            ret_code, data = execute_orient_command(self.args, query_sql, self.sess)
            if ret_code != NORMAL_STATUS:
                continue
            if "result" not in data:
                continue
            if len(data["result"]) == 0:
                continue
            document_rid = data["result"][0]["@rid"]

            sql = "CREATE EDGE subject2document FROM {0} TO {1} set name='subject2document', score={2}".format(
                subject_rid, document_rid, document["score"])
            execute_orient_command(self.args, sql, self.sess)

    # 查询主题
    def query_subject(self, **kwargs):
        subject_id = kwargs["subject_id"]
        doc_title_keyword = kwargs["doc_title_keyword"]
        page = int(kwargs["page"])
        limit = int(kwargs["limit"])
        conditions = [("out.subject_id", "=", subject_id)]
        if doc_title_keyword != "":
            conditions.append(("in.name", " like ", "'%{}%'".format(doc_title_keyword)))
        condition_str = " and ".join(["{0}{1}{2}".format(k, q, v) for k, q, v in conditions])
        sql = "select score, in.gns, in.name from subject2document where {0} order by score desc " \
              "skip {1} limit {2}".format(condition_str, page * limit - limit, limit)
        # print(sql)
        logger.info(sql)
        res_list = []
        ret_code, orient_res = execute_orient_command(self.args, sql, self.sess)
        if ret_code != NORMAL_STATUS:
            return EXCEPTION_STATUS, orient_res

        if "result" not in orient_res:
            logger.error(orient_res)
            return res_list
        for item in orient_res["result"]:
            res_list.append({
                "gns": item["in.gns"],
                "score": item["score"],
                "name": item["in.name"]
            })
        return res_list

    # 搜索主题文档
    def search_subject(self, **kwargs):
        subject_name = kwargs["subject_name"].strip()
        subject_desc = kwargs["subject_desc"]
        subject_label = kwargs["subject_label"]
        page = int(kwargs["page"])
        limit = int(kwargs["limit"])

        query = ""
        if subject_name:
            query = " ".join(jieba.cut(subject_name))
        if subject_desc:
            query += " " + subject_desc
        if subject_label:
            query += " " + " ".join([sl["name"] for sl in subject_label])
        query = query.replace("*", "\\*").replace("+", "\\+").replace("-", "\\-")
        res_list = []
        if query.strip() == "":
            return NORMAL_STATUS, res_list
        sql = "select name, gns, $score as score from document where  search_class('{0}')=true skip {1} limit {2}".format(
            query, page * limit - limit, limit)
        logger.info(sql)

        ret_code, orient_res = execute_orient_command(self.args, sql, self.sess)
        if ret_code != NORMAL_STATUS:
            return EXCEPTION_STATUS, {"message": "OrientDB has something wrong!",
                                      "cause": "OrientDB has something wrong!",
                                      "code": CommonResponseStatus.REQUEST_ERROR.value}
        if "result" not in orient_res:
            logger.error(orient_res)
            return NORMAL_STATUS, res_list
        for item in orient_res["result"]:
            res_list.append({
                "gns": item["gns"],
                "score": item["score"],
                "name": item["name"]
            })
        return NORMAL_STATUS, res_list


# 计算cos 距离
def cosine_distance(a, b):
    if a.shape != b.shape:
        raise RuntimeError("array {} shape not match {}".format(a.shape, b.shape))
    if a.ndim == 1:
        a_norm = np.linalg.norm(a)
        b_norm = np.linalg.norm(b)
    elif a.ndim == 2:
        a_norm = np.linalg.norm(a, axis=1, keepdims=True)
        b_norm = np.linalg.norm(b, axis=1, keepdims=True)
    else:
        raise RuntimeError("array dimensions {} not right".format(a.ndim))
    similiarity = np.dot(a, b.T) / (a_norm * b_norm)
    dist = 1. - similiarity
    return dist


# 加载词向量
def load_word_vector_by(embedding_file):
    embedding_dict = dict()
    with bz2.BZ2File(embedding_file, 'rb') as input:
        with io.TextIOWrapper(input, encoding='utf-8') as dec:
            for line in dec:
                if len(line.rstrip().split(" ")) <= 2:
                    continue
                token, vector = line.rstrip().split(" ", 1)
                embedding_dict[token] = np.fromstring(vector, dtype=np.float, sep=" ")
    return embedding_dict


# 判断是否是子文件
def is_subdocument(fold_gns, document_gns):
    fold_gns_list = fold_gns.split("/")
    document_gns_list = document_gns.split("/")
    if len(document_gns_list) <= len(fold_gns_list):
        return False

    for i, item in enumerate(fold_gns_list):
        if item != document_gns_list[i]:
            return False
    return True


# 词汇包装
class NeoWord(object):

    def __init__(self, word, weight=1.0):
        self.word = word
        self.weight = weight


class TextMatchTask(object):
    def __init__(self,
                 task_id,
                 kg_id,
                 **kwargs):
        self.state = READY_STATE
        self.task_id = task_id
        self.kg_id = kg_id
        self.subject_id = kwargs.get("subject_id")
        self.subject_path = kwargs.get("subject_path")
        self.subject_fold = kwargs.get("subject_fold")
        self.subject_name = kwargs.get("subject_name")
        self.subject_desc = kwargs.get("subject_desc")
        self.subject_label = kwargs.get("subject_label")
        self.subject_document = kwargs.get("subject_document")
        self.kg_info = kwargs.get("kg_info")
        cur_path = os.path.dirname(__file__)
        self.config_path = os.path.join(os.path.dirname(cur_path), "config/asapi.conf")
        self.text_match_model = kwargs.get("text_match_model", "word2vec")
        self.document_source = kwargs.get("document_source", "orientdb")  # document 来源

        # 模型需要的參數
        self.document_num = None
        self.word2vec_model = None

        # 缓存变量
        self.word_df_cache = dict()
        # 停用词
        self.stop_words = {",", ".", "!", "?", "，", "。", "！", "？", "的", "地",
                           "得", "pdf", "doc", "docx", "ppt", "pptx", "#", "#.", "目录", "41",
                           "35", "16", "33", "19", "18", "06", "15", "07", "11", "22", "10",
                           "23", "12", "130", "更多", "资料"}

    # 构建文档向量
    @except_decorator()
    def build_document_embed(self):
        # if self.document_source == "mongodb":
        #     self.build_document_embed_mongo()
        # elif self.document_source == "orientdb":
        #     self.build_document_embed_orientdb()
        # else:
        self.build_document_embed_orientdb()

    # 基于orientdb 构建词向量
    def build_document_embed_orientdb(self):
        ret_code, obj = graph_Service.getGraphById(self.kg_id)
        if ret_code != NORMAL_STATUS:
            obj["code"] = CommonResponseStatus.KGID_NOT_EXIST.value
            logger.error(obj)
            return ret_code, obj
        res = obj["res"]
        graph_baseInfo = res["graph_baseInfo"]
        base_info = graph_baseInfo[0]
        address = base_info["graphDBAddress"].split(";")[0]  # 图数据库ip
        graph_db_name = base_info["graph_DBName"]
        graph_db_id = base_info["graph_db_id"]

        # 若opensearch中还未创建index时，创建index
        opensearch_manager = OpenSearchManager(graph_db_id)
        opensearch_manager.create_index(self.kg_id)

        ret = task_dao.getGraphDBbyId(graph_db_id)
        rec_dict = ret.to_dict('records')
        # if len(rec_dict) == 0:
        #     return EXCEPTION_STATUS, {"message": "OrientDB ip does not exist", "code": 5005001,
        #                  "cause": "OrientDB ip does not exits"}
        rec_dict = rec_dict[0]
        username = rec_dict["db_user"]
        password = rec_dict["db_ps"]
        password = commonutil.DecryptBybase64(password)
        graph_db_port = rec_dict["port"].split(";")[0]

        args = {
            "ip": address,
            "port": graph_db_port,
            "database": graph_db_name,
        }
        sess = requests.Session()
        sess.auth = (username, password)

        # mongo_config = get_mongodb_db_config()
        # client_mon = pymongo.MongoClient(
        #     'mongodb://{}:{}/'.format(mongo_config["mongodb_ip"], mongo_config["mongodb_port"]))
        # db = client_mon[graph_mongo_name]
        # db = mongoClient().connect_mongo()

        i = 0
        skip = 0
        limit = 20
        cache_num = 100
        document_word_embed_cache = []
        document_infos_list = []
        # db["subject_info_{}".format(self.kg_id)].drop()
        # db["document_index_{}.chunks".format(self.kg_id)].drop()
        # db["document_index_{}.files".format(self.kg_id)].drop()

        if len(tm.embed_model):
            tm.load_model()
        # words_set = set()
        while True:
            query_sql = "select file_type,gns,name,in(label2document).name from document skip {0} limit {1}".format(
                skip, limit)
            ret_code, res_dict = execute_orient_command(args, query_sql, sess)
            if ret_code != NORMAL_STATUS:
                break
            if "result" not in res_dict:
                break

            for document in res_dict["result"]:

                # if document["file_type"].lower() not in [".pdf", ".txt", ".doc", ".ppt", ".docx", ".pptx"]:
                #     continue

                document_title_list = [NeoWord(word, 2.0) for word in jieba.cut(document["name"]) if
                                       word not in self.stop_words]
                document_represent = [NeoWord(label, 1.5) for label in
                                      document["in(label2document).name"] if
                                      label not in self.stop_words] + document_title_list

                document_word_set = set()
                for nw in document_represent:
                    document_word_set.add(nw.word)

                document_word_embed = [(tm.embed_model[item.word] * item.weight, item.weight) for item in
                                       document_represent if
                                       item.word in tm.embed_model]
                if len(document_word_embed) == 0:
                    continue
                document_word_embed_cache.append(min_embed(document_word_embed))
                # document_infos[i] = {"gns": document["gns"], "name": document["name"], "_id": i}
                document_infos_list.append({"gns": document["gns"], "name": document["name"], "_id": i,
                                            "word_list": list(document_word_set)})
                i += 1

                if len(document_word_embed_cache) == cache_num:
                    for emb, info in zip(document_word_embed_cache, document_infos_list):
                        emb = np.array(emb).astype('float32')
                        doc_name = info.get("name")
                        gns = info.get("gns")
                        # opensearch写入数据
                        opensearch_manager.insert_data(self.kg_id, doc_name, gns, emb)
                    document_word_embed_cache = []
                    document_infos_list = []

            if len(res_dict["result"]) < limit:
                break
            skip += limit
        # words_set.add("万科")
        # sentence = "万科企业股份有限公司，简称万科或万科集团（英語：CHINA VANKE CO., LTD.，深市：000002/200002（B股已除牌），简称：万科A/万科B；港交所：2202），是中国乃至全球规模最大的地产发展商之一，业务包括住宅开发、物业管理、商业地产、物流仓储、旅游度假、教育产业等，总部位于中国深圳市盐田区大梅沙环梅路33号，2017年至今，深圳地铁集团为集团第一大股东。"
        # for word in jieba.cut(sentence):
        #     words_set.add(word)
        # word_dict = {"word_set": list(words_set)}
        #
        #
        # with open("word_set.json", "w") as f:
        #     f.write(json.dumps(word_dict))

        if len(document_word_embed_cache):
            for emb, info in zip(document_word_embed_cache, document_infos_list):
                emb = np.array(emb).astype('float32')
                doc_name = info.get("name")
                gns = info.get("gns")
                # opensearch写入数据
                opensearch_manager.insert_data(self.kg_id, doc_name, gns, emb)
        
        # if len(document_infos):
        #     word_embed_model_path = "{}/{}".format(self.get_config()["text_match"]["text_match_embed_path"],
        #                                            'document_embed_{}.index'.format(self.kg_id))
        #     faiss.write_index(index, word_embed_model_path)
        #     document_infos_path = "{}/{}".format(self.get_config()["text_match"]["text_match_embed_path"],
        #                                            'document_info_{}.json'.format(self.kg_id))
        #     with open(document_infos_path, "w", encoding="utf-8") as f:
        #         f.write(json.dumps(document_infos))

    # 基于mongodb 构建词向量
    def build_document_embed_mongo(self):
        import faiss
        dim = 300
        nlist = 5
        quantizer = faiss.IndexFlatIP(dim)  # the other index，需要以其他index作为基础
        index = faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_INNER_PRODUCT)
        ret_code, obj = graph_Service.getGraphById(self.kg_id)
        res = obj["res"]
        graph_baseInfo = res["graph_baseInfo"]
        baseInfo = graph_baseInfo[0]
        graph_db_id = baseInfo["graph_db_id"]
        graph_mongo_name = baseInfo["graph_mongo_Name"]

        ret = task_dao.getGraphDBbyId(graph_db_id)
        rec_dict = ret.to_dict('records')
        if len(rec_dict) == 0:
            return EXCEPTION_STATUS, {"message": "OrientDB ip does not exist", "code": 5005001,
                                      "cause": "OrientDB ip does not exits"}

        db_config = get_mongodb_db_config()
        client_mon = pymongo.MongoClient(
            'mongodb://{}:{}/'.format(db_config["mongodb_ip"], db_config["mongodb_port"]))

        res = client_mon[graph_mongo_name]['label2document'].aggregate(
            [{"$group": {"_id": "$o_pro.gns", "slist": {"$addToSet": "$s"}, "name": {"$first": "$o"}}}])

        document_word_embed_cache = []
        document_infos = dict()
        document_cache = []
        i = 0
        for document in res:
            if len(document_cache) < 20:
                document_cache.append(document)
            file_type = document["name"].split(".")[-1]
            if file_type.lower() not in ["pdf", "txt", "doc", "ppt", "docx", "pptx"]:
                continue
            document_title_list = [NeoWord(word, 2.0) for word in jieba.cut(document["name"]) if
                                   word not in self.stop_words]
            document_represent = [NeoWord(label, 1.5) for label in
                                  document["slist"] if label not in self.stop_words] + document_title_list

            document_word_embed = [(tm.embed_model[item.word] * item.weight, item.weight) for item in document_represent
                                   if
                                   item.word in tm.embed_model]
            if len(document_word_embed) == 0:
                continue
            document_word_embed_cache.append(min_embed(document_word_embed))
            document_infos[i] = {"gns": document["_id"], "name": document["name"]}
            i += 1

            if len(document_word_embed_cache) == 100:
                doc_embed_list = np.array(document_word_embed_cache).astype('float32')
                index.train(doc_embed_list)
                index.add(doc_embed_list)
                document_word_embed_cache = []
        if len(document_word_embed_cache):
            doc_embed_list = np.array(document_word_embed_cache).astype('float32')
            index.train(doc_embed_list)
            index.add(doc_embed_list)

        word_embed_model_path = "{}/{}".format(self.get_config()["text_match"]["text_match_embed_path"],
                                               'document_embed_{}.index'.format(self.kg_id))
        faiss.write_index(index, word_embed_model_path)
        document_infos_path = "{}/{}".format(self.get_config()["text_match"]["text_match_embed_path"],
                                             'document_info_{}.json'.format(self.kg_id))
        with open(document_infos_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(document_infos))

    def bm25(self, args, sess, query, document_represents):
        d_num = self.document_num
        avg_len = 30
        k1 = 1
        b = 0.5
        score = 0
        big_k = k1 * (1 - b + b * len(document_represents) / avg_len)
        tf_dict = dict()
        for item in query:
            tf_dict.setdefault(item.word, 0)
            tf_dict[item.word] += item.weight

        for word, freq in tf_dict.items():
            if word in self.word_df_cache:
                word_df = self.word_df_cache[word]
                if word_df == 0:
                    continue
            else:
                query_df_sql = "select out(label2document).size() from label where name = '{}'".format(word)
                ret_code, df_res = execute_orient_command(args, query_df_sql, sess)
                if ret_code != NORMAL_STATUS:
                    continue
                if "result" not in df_res:
                    continue
                if len(df_res["result"]) == 0:
                    self.word_df_cache[word] = 0
                    continue
                word_df = df_res["result"][0]["out(label2document).size()"]
                self.word_df_cache[word] = word_df
            word_idf = np.log(d_num - word_df + 0.5) - np.log(word_df + 0.5)
            score += word_idf * ((k1 + 1) * freq / (big_k + freq))
        return score

    def get_config(self):
        config = ConfigParser()
        config.read(self.config_path, "utf-8")
        return config

    # 构建词向量
    def word2vec(self, query, document):

        # 句子向量使用加權詞向量
        query_word_embed = [(self.word2vec_model[item.word] * item.weight, item.weight) for item in query if
                            item.word in self.word2vec_model]
        if len(query_word_embed) == 0:
            return 0.0
        query_word_embed = min_embed(query_word_embed)

        document_word_embed = [(self.word2vec_model[item.word] * item.weight, item.weight) for item in document if
                               item.word in self.word2vec_model]
        if len(document_word_embed) == 0:
            return 0.0
        document_word_embed = min_embed(document_word_embed)

        score = cosine_distance(query_word_embed, document_word_embed)
        return score

    # 查询主题相关文档
    @except_decorator()
    def search_subject(self, **kwargs):
        """
        设置最大搜索数量 -- 1000
        """
        # import faiss
        # subject_path = kwargs["subject_path"]
        # subject_fold = kwargs["subject_fold"]
        subject_name = kwargs["subject_name"].strip()
        subject_desc = kwargs["subject_desc"].strip()
        subject_label = kwargs["subject_label"]
        graph_db_id = kwargs["graph_db_id"]
        page = int(kwargs["page"])
        limit = int(kwargs["limit"])

        # db_config = get_mongodb_db_config()
        # client_mon = pymongo.MongoClient(
        #     'mongodb://{}:{}/'.format(db_config["mongodb_ip"], db_config["mongodb_port"]))
        # db = client_mon[graph_mongo_name]

        # document_infos_path = "{}/{}".format(self.get_config()["text_match"]["text_match_embed_path"],
        #                                      'document_info_{}.json'.format(self.kg_id))
        # word_embed_model_path = "{}/{}".format(self.get_config()["text_match"]["text_match_embed_path"],
        #                                        'document_embed_{}.index'.format(self.kg_id))
        # if not os.path.exists(document_infos_path):
        #     logger.error("document info {} is not exits".format(document_infos_path))
        #     return []
        # if not os.path.exists(word_embed_model_path):
        #     logger.error("document embedding {} is not exits".format(word_embed_model_path))
        #     return []
        if subject_name == "":
            query_name = []
        else:
            query_name = [NeoWord(subject_name, 2.0)]
            name_words = list(jieba.cut(subject_name))
            if len(name_words) > 1:
                for word in name_words:
                    if word in self.stop_words:
                        continue
                    query_name.append(NeoWord(word, 1.5))
        # print(query_name)

        query_desc = []
        if subject_desc:
            query_desc = [NeoWord(word, 0.1) for word in jieba.cut(subject_desc) if
                          word not in self.stop_words]
        query_label = []
        if subject_label:
            query_label = [NeoWord(label["name"], 1.0) for label in subject_label if label["name"].strip()]

        query_word = query_name + query_desc + query_label
        query_embed = None
        nwweight = 0
        if len(tm.embed_model) == 0:
            logger.error("word embed is empty")
            return []
        for nw in query_word:
            if nw.word not in tm.embed_model:
                continue
            if query_embed is None:
                query_embed = tm.embed_model[nw.word] * nw.weight
            else:
                query_embed += tm.embed_model[nw.word] * nw.weight
            nwweight += nw.weight
        if query_embed is None:
            return []
        query_embed /= nwweight

        # faiss_index = faiss.read_index(word_embed_model_path)
        query_embed = np.array(query_embed).astype("float32")

        # with open(document_infos_path, "r", encoding="utf-8") as f:
        #     document_infos = json.loads(f.read())
        # res = []
        # for i, d in enumerate(D[0]):
        #     doc_id = I[0][i + page * limit - limit]
        #     if doc_id == -1:
        #         continue
        #     if float(d) < 0.2:
        #         continue
        res = []
        try:
            opensearch_manager = OpenSearchManager(graph_db_id)
            hits = opensearch_manager.search_data_by_emb(self.kg_id, query_embed)
            temps = hits["hits"]["hits"]
            temps = temps[(page-1) * limit: page*limit]
            for hit in temps:
                res.append({
                    "score": hit["_score"],
                    "name": hit["_source"]["doc_name"],
                    "gns": hit["_source"]["gns"]
                })
        except Exception as e:
            logger.warning("search error: {}".format(repr(e)))
            res = []
        # print(res)
        return res


# 插入主题任务
@except_decorator()
def insert_subject_task(kg_id, **kwargs):
    ret_code, obj = graph_Service.getGraphById(kg_id, slient=True)
    if ret_code != NORMAL_STATUS:
        obj["code"] = CommonResponseStatus.KGID_NOT_EXIST.value
        return ret_code, obj

    otl_id_list = graph_dao.get_graph_otl_id(kg_id)
    if len(otl_id_list) == 0:
        return EXCEPTION_STATUS, {"cause": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "message": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "code": CommonResponseStatus.KG_AS_MODEL_NOT_EXIST.value}
    kg_as_state = 0
    # print(otl_id_list["graph_otl"])
    for otl_id in eval(otl_id_list["graph_otl"][0]):
        otl_entity_info = graph_dao.get_graph_entity_otl_info_by_id(otl_id)
        otl_entity_infos = eval(otl_entity_info["entity"][0])
        for entity in otl_entity_infos:
            if entity["name"] != "document":
                continue
            if entity["model"] == "Anysharedocumentmodel":
                kg_as_state = 1
            break
        if kg_as_state:
            break
    if kg_as_state == 0:
        return EXCEPTION_STATUS, {"cause": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "message": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "code": CommonResponseStatus.KG_AS_MODEL_NOT_EXIST.value}
    code, graph_info = graph_count_controller.getGraphCountByid(graph_id=kg_id)
    if code != codes.successCode:
        return EXCEPTION_STATUS, {"message": "OrientDB has something wrong!",
                                  "code": CommonResponseStatus.REQUEST_ERROR.value,
                                  "cause": "OrientDB has something wrong!"}
    edges, entities, edge_pros, entity_pros, properties = graph_info
    if edges == 0 and entities == 0:
        return EXCEPTION_STATUS, {"cause": "kg id {} knowledge is empty".format(kg_id),
                                  "message": "kg id {} knowledge is empty".format(kg_id),
                                  "code": CommonResponseStatus.KG_DB_EMPTY.value}

    # task_id = "{0}-{1}-{2}".format(int(time.time()), kg_id, random.randint(0, 100))
    res = obj["res"]
    graph_baseInfo = res["graph_baseInfo"]
    base_info = graph_baseInfo[0]
    address = base_info["graphDBAddress"].split(";")[0]  # 图数据库ip
    graph_db_name = base_info["graph_DBName"]
    graph_db_id = base_info["graph_db_id"]
    ret = task_dao.getGraphDBbyId(graph_db_id)
    rec_dict = ret.to_dict('records')
    if len(rec_dict) == 0:
        return EXCEPTION_STATUS, {"message": "OrientDB ip does not exist",
                                  "code": CommonResponseStatus.REQUEST_ERROR.value,
                                  "cause": "OrientDB ip does not exits"}

    rec_dict = rec_dict[0]
    username = rec_dict["db_user"]
    password = rec_dict["db_ps"]
    password = commonutil.DecryptBybase64(password)
    graph_db_port = rec_dict["port"].split(";")[0]

    args = {
        "ip": address,
        "port": graph_db_port,
        "database": graph_db_name,
        "user": username,
        "passwd": password
    }

    db_utils = OrientDBUtils()
    db_utils.init_db(args=args)
    ret, subject_res = db_utils.query_subject_exits(subject_id=kwargs["subject_id"])
    if ret != NORMAL_STATUS:
        return EXCEPTION_STATUS, subject_res
    if subject_res > 0:
        return EXCEPTION_STATUS, {"cause": "subject_id exits",
                                  "message": "subject_id exits",
                                  "code": CommonResponseStatus.SUBJECT_ID_EXIST.value}
    db_utils.insert_subject(**kwargs)
    return NORMAL_STATUS, {"state": "success"}


# 删除主题任务
@except_decorator()
def delete_subject_task(kg_id, subject_id):
    ret_code, obj = graph_Service.getGraphById(kg_id)
    if ret_code != NORMAL_STATUS:
        obj["code"] = CommonResponseStatus.KGID_NOT_EXIST.value
        return ret_code, obj

    res = obj["res"]
    graph_baseInfo = res["graph_baseInfo"]
    base_info = graph_baseInfo[0]
    address = base_info["graphDBAddress"].split(";")[0]  # 图数据库ip
    graph_db_name = base_info["graph_DBName"]
    graph_db_id = base_info["graph_db_id"]
    ret = task_dao.getGraphDBbyId(graph_db_id)
    rec_dict = ret.to_dict('records')
    if len(rec_dict) == 0:
        return EXCEPTION_STATUS, {"message": "OrientDB ip does not exist",
                                  "code": CommonResponseStatus.REQUEST_ERROR.value,
                                  "cause": "OrientDB ip does not exits"}
    rec_dict = rec_dict[0]
    username = rec_dict["db_user"]
    password = rec_dict["db_ps"]
    password = commonutil.DecryptBybase64(password)
    graph_db_port = rec_dict["port"].split(";")[0]

    args = {
        "ip": address,
        "port": graph_db_port,
        "database": graph_db_name,
        "user": username,
        "passwd": password
    }

    db_utils = OrientDBUtils()
    db_utils.init_db(args=args)
    db_utils.delete_subject(subject_id)

    return NORMAL_STATUS, "message"


# 更新主题任务
@except_decorator()
def update_subject_task(kg_id, **kwargs):
    ret_code, obj = graph_Service.getGraphById(kg_id)
    if ret_code != NORMAL_STATUS:
        obj["code"] = CommonResponseStatus.KGID_NOT_EXIST.value
        return ret_code, obj

    otl_id_list = graph_dao.get_graph_otl_id(kg_id)
    if len(otl_id_list) == 0:
        return EXCEPTION_STATUS, {"cause": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "message": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "code": CommonResponseStatus.KG_AS_MODEL_NOT_EXIST.value}
    kg_as_state = 0
    # print(otl_id_list["graph_otl"])
    for otl_id in eval(otl_id_list["graph_otl"][0]):
        otl_entity_info = graph_dao.get_graph_entity_otl_info_by_id(otl_id)
        otl_entity_infos = eval(otl_entity_info["entity"][0])
        for entity in otl_entity_infos:
            if entity["name"] != "document":
                continue
            if entity["model"] == "Anysharedocumentmodel":
                kg_as_state = 1
            break
        if kg_as_state:
            break
    if kg_as_state == 0:
        return EXCEPTION_STATUS, {"cause": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "message": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "code": CommonResponseStatus.KG_AS_MODEL_NOT_EXIST.value}

    code, graph_info = graph_count_controller.getGraphCountByid(graph_id=kg_id)
    if code != codes.successCode:
        return EXCEPTION_STATUS, {"message": "OrientDB has something wrong!",
                                  "code": CommonResponseStatus.REQUEST_ERROR.value,
                                  "cause": "OrientDB has something wrong!"}
    edges, entities, edge_pros, entity_pros, properties = graph_info
    if edges == 0 and entities == 0:
        return EXCEPTION_STATUS, {"cause": "kg id {} knowledge is empty".format(kg_id),
                                  "message": "kg id {} knowledge is empty".format(kg_id),
                                  "code": CommonResponseStatus.KG_DB_EMPTY.value}

    res = obj["res"]
    graph_baseInfo = res["graph_baseInfo"]
    base_info = graph_baseInfo[0]
    address = base_info["graphDBAddress"].split(";")[0]  # 图数据库ip
    graph_db_name = base_info["graph_DBName"]
    graph_db_id = base_info["graph_db_id"]
    ret = task_dao.getGraphDBbyId(graph_db_id)
    rec_dict = ret.to_dict('records')
    if len(rec_dict) == 0:
        return EXCEPTION_STATUS, {"message": "OrientDB ip does not exist",
                                  "code": CommonResponseStatus.REQUEST_ERROR.value,
                                  "cause": "OrientDB ip does not exits"}
    rec_dict = rec_dict[0]
    username = rec_dict["db_user"]
    # username = commonutil.DecryptBybase64(username)
    password = rec_dict["db_ps"]
    password = commonutil.DecryptBybase64(password)
    graph_db_port = rec_dict["port"].split(";")[0]

    args = {
        "ip": address,
        "port": graph_db_port,
        "database": graph_db_name,
        "user": username,
        "passwd": password
    }

    db_utils = OrientDBUtils()
    db_utils.init_db(args=args)
    ret_code, subject_res = db_utils.query_subject_exits(kwargs["subject_id"])
    if ret_code != NORMAL_STATUS:
        return EXCEPTION_STATUS, {"cause": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "message": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "code": CommonResponseStatus.KG_AS_MODEL_NOT_EXIST.value}
        # return ret_code, subject_res
    if subject_res == 0:
        return EXCEPTION_STATUS, {"cause": "subject_id {} not exits".format(kwargs["subject_id"]),
                                  "message": "subject_id not exits",
                                  "code": CommonResponseStatus.SUBJECT_ID_NOT_EXIST.value}
    db_utils.update_subject(**kwargs)

    return NORMAL_STATUS, "message"


# 查询主题任务
@except_decorator()
def query_subject_task(kg_id, **kwargs):
    ret_code, obj = graph_Service.getGraphById(kg_id)
    if ret_code != NORMAL_STATUS:
        obj["code"] = CommonResponseStatus.KGID_NOT_EXIST.value
        return ret_code, obj
    res = obj["res"]
    graph_baseInfo = res["graph_baseInfo"]
    base_info = graph_baseInfo[0]
    address = base_info["graphDBAddress"].split(";")[0]  # 图数据库ip
    graph_db_name = base_info["graph_DBName"]
    graph_db_id = base_info["graph_db_id"]
    otl_id_list = graph_dao.get_graph_otl_id(kg_id)
    if len(otl_id_list) == 0:
        return EXCEPTION_STATUS, {"cause": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "message": "kg id {} anyshare document model is not exits".format(kg_id),
                                  "code": CommonResponseStatus.KG_AS_MODEL_NOT_EXIST.value}
    kg_as_state = 0
    for otl_id in eval(otl_id_list["graph_otl"][0]):
        otl_entity_info = graph_dao.get_graph_entity_otl_info_by_id(otl_id)
        otl_entity_infos = eval(otl_entity_info["entity"][0])
        for entity in otl_entity_infos:
            if entity["name"] != "document":
                continue
            if entity["model"] == "Anysharedocumentmodel":
                kg_as_state = 1
            break
        if kg_as_state:
            break
    if kg_as_state == 0:
        return NORMAL_STATUS, {
            "subject_id": int(kwargs["subject_id"]),
            "kg_id": int(kg_id),
            "relate_document": []
        }

    code, graph_info = graph_count_controller.getGraphCountByid(graph_id=kg_id)
    if code != codes.successCode:
        return EXCEPTION_STATUS, {"message": "OrientDB has something wrong!",
                                  "code": CommonResponseStatus.REQUEST_ERROR.value,
                                  "cause": "OrientDB has something wrong!"}
    edges, entities, edge_pros, entity_pros, properties = graph_info
    if edges == 0 and entities == 0:
        return EXCEPTION_STATUS, {"cause": "kg id {} knowledge is empty".format(kg_id),
                                  "message": "kg id {} knowledge is empty".format(kg_id),
                                  "code": CommonResponseStatus.KG_DB_EMPTY.value}

    ret = task_dao.getGraphDBbyId(graph_db_id)
    rec_dict = ret.to_dict('records')
    if len(rec_dict) == 0:
        return EXCEPTION_STATUS, {"message": "OrientDB ip does not exist",
                                  "code": CommonResponseStatus.REQUEST_ERROR.value,
                                  "cause": "OrientDB ip does not exits"}

    rec_dict = rec_dict[0]
    username = rec_dict["db_user"]
    password = rec_dict["db_ps"]
    password = commonutil.DecryptBybase64(password)
    graph_db_port = rec_dict["port"].split(";")[0]
    args = {
        "ip": address,
        "port": graph_db_port,
        "database": graph_db_name,
        "user": username,
        "passwd": password
    }

    db_utils = OrientDBUtils()
    db_utils.init_db(args=args)
    ret_code, subject_res = db_utils.query_subject_exits(kwargs["subject_id"])
    if ret_code != NORMAL_STATUS:
        return EXCEPTION_STATUS, {"cause": "kg id {} anyshare document model something wrong".format(kg_id),
                                  "message": "kg id {} anyshare document model  something wrong".format(kg_id),
                                  "code": CommonResponseStatus.KG_AS_MODEL_NOT_EXIST.value}
    if subject_res == 0:
        return EXCEPTION_STATUS, {"cause": "subject_id {} not exits".format(kwargs["subject_id"]),
                                  "message": "subject_id not exits",
                                  "code": CommonResponseStatus.SUBJECT_ID_NOT_EXIST.value}
    res = db_utils.query_subject(**kwargs)

    final_res = {
        "subject_id": int(kwargs["subject_id"]),
        "kg_id": int(kg_id),
        "relate_document": res
    }

    return NORMAL_STATUS, final_res


# 查询主题任务
@except_decorator()
def search_subject_task(kg_id, **kwargs):
    search_type = kwargs["search_type"]
    graph_info = graph_dao.getbyid(kg_id)
    if graph_info.shape[0] == 0:
        return 500, {"message": "{} not exist!".format(kg_id),
                     "code": CommonResponseStatus.KGID_NOT_EXIST.value,
                     "cause": "{} not exist!".format(kg_id)}
    graph_info = graph_info.iloc[0]

    graph_baseInfo = graph_info["graph_baseInfo"]
    graph_db_id = graph_info["graph_db_id"]
    graph_baseInfo = eval(graph_baseInfo)
    base_info = graph_baseInfo[0]
    address = base_info["graphDBAddress"]  # 图数据库ip
    graph_db_name = base_info["graph_DBName"]

    args = {
        "ip": address,
        "port": os.getenv("ORIENTPORT", "2480"),
        "database": graph_db_name,
        "user": os.getenv("ORIENTUSER", "admin"),
        "passwd": os.getenv("ORIENTPASS", "admin")
    }

    page_ = kwargs["page"]
    limit_ = kwargs["limit"]

    # 根据查询类型的不同，选择不同的查询方式
    if search_type == "vector":
        tmt = TextMatchTask("task", kg_id)
        graph_mongo_name = base_info["graph_mongo_Name"]
        kwargs["graph_mongo_name"] = graph_mongo_name
        kwargs["page"] = 1
        kwargs["limit"] = 100
        kwargs["threshold"] = 0.5
        kwargs["graph_db_id"] = graph_db_id

        text_res_list = tmt.search_subject(**kwargs)
    elif search_type == "full-text":

        db_utils = OrientDBUtils()
        db_utils.init_db(args=args)
        kwargs["page"] = 1
        kwargs["limit"] = 100

        ret_code, text_res_list = db_utils.search_subject(**kwargs)
        if ret_code != NORMAL_STATUS:
            return EXCEPTION_STATUS, text_res_list
    else:
        tmt = TextMatchTask("task", kg_id)
        graph_mongo_name = base_info["graph_mongo_Name"]
        kwargs["graph_mongo_name"] = graph_mongo_name
        kwargs["page"] = 1
        kwargs["limit"] = 100
        kwargs["threshold"] = 0.5
        kwargs["graph_db_id"] = graph_db_id
        vector_res = tmt.search_subject(**kwargs)

        db_utils = OrientDBUtils()
        db_utils.init_db(args=args)
        kwargs["page"] = 1
        kwargs["limit"] = 100
        ret_code, text_res = db_utils.search_subject(**kwargs)
        if ret_code != NORMAL_STATUS:
            return EXCEPTION_STATUS, text_res
        text_res_dict = {}
        for i, item in enumerate(text_res):
            item["score"] = 1 - i / 100
            text_res_dict[item["gns"]] = item

        for item in vector_res:
            if item["gns"] in text_res_dict:
                text_res_dict[item["gns"]]["score"] = text_res_dict[item["gns"]]["score"] * 0.8 + item["score"] * 0.2
            else:
                item["score"] *= 0.2
                text_res_dict[item["gns"]] = item

        text_res_list = [item for k, item in text_res_dict.items()]
        text_res_list.sort(key=lambda x: x["score"], reverse=True)
    res = text_res_list[page_ * limit_ - limit_:page_ * limit_]

    final_res = {
        "kg_id": int(kg_id),
        "relate_document": res,
        "count": len(text_res_list)
    }

    return NORMAL_STATUS, final_res


# 查询多个主题
@except_decorator()
def search_kgs_subject_task(kg_id_list, **kwargs):
    # search_type = kwargs["search_type"]

    filter_documents = kwargs["filter_documents"]
    page_ = kwargs["page"]
    limit_ = kwargs["limit"]
    kg_info = {}
    for kg_id in kg_id_list:
        graph_info = graph_dao.getbyid(kg_id)
        if graph_info.shape[0] == 0:
            # return 500, {"message": "{} not exist!".format(kg_id),
            #              "code": CommonResponseStatus.KGID_NOT_EXIST.value,
            #              "cause": "{} not exist!".format(kg_id)}
            logger.warning("kg id {} not exits!".format(kg_id))
            continue
        # print(graph_info.to_dict())
        # print(graph_info.iloc[0])
        kg_info[kg_id] = graph_info.iloc[0]

    if len(kg_info) == 0:
        return EXCEPTION_STATUS, {"message": "{} not exist!".format(kg_id_list),
                                  "code": CommonResponseStatus.KGID_NOT_EXIST.value,
                                  "cause": "{} not exist!".format(kg_id_list)}

    final_res = {}

    for kg_id, item in kg_info.items():
        graph_baseInfo = item["graph_baseInfo"]
        graph_baseInfo = eval(graph_baseInfo)
        base_info = graph_baseInfo[0]
        address = base_info["graphDBAddress"]  # 图数据库ip
        graph_db_name = base_info["graph_DBName"]
        graph_db_id = base_info["graph_db_id"]

        args = {
            "ip": address,
            "port": os.getenv("ORIENTPORT", "2480"),
            "database": graph_db_name,
            "user": os.getenv("ORIENTUSER", "admin"),
            "passwd": os.getenv("ORIENTPASS", "admin")
        }

        db_utils = OrientDBUtils()
        db_utils.init_db(args=args)
        kwargs["page"] = 1
        kwargs["limit"] = 100
        ret_code, text_res = db_utils.search_subject(**kwargs)
        if ret_code != NORMAL_STATUS:
            return EXCEPTION_STATUS, text_res
        text_res_dict = {}
        for i, item in enumerate(text_res):
            item["score"] = 1 - i / 100
            text_res_dict[item["gns"]] = item

        tmt = TextMatchTask("task", kg_id)
        graph_mongo_name = base_info["graph_mongo_Name"]
        kwargs["graph_mongo_name"] = graph_mongo_name
        kwargs["page"] = 1
        kwargs["limit"] = 100
        kwargs["threshold"] = 0.5
        kwargs["graph_db_id"] = graph_db_id
        vector_res = tmt.search_subject(**kwargs)

        for item in vector_res:
            if item["gns"] in text_res_dict:
                text_res_dict[item["gns"]]["score"] = text_res_dict[item["gns"]]["score"] * 0.8 + item["score"] * 0.2
            else:
                item["score"] *= 0.2
                text_res_dict[item["gns"]] = item

        for _, item in text_res_dict.items():
            if item["gns"] in filter_documents:
                continue
            if item["gns"] in final_res:
                fr = final_res[item["gns"]]
                final_res[item["gns"]] = {
                    "kg_id": fr["kg_id"] + [kg_id],
                    "name": item["name"],
                    "gns": item["gns"],
                    "score": max(item["score"], fr["score"])
                }
            else:
                final_res[item["gns"]] = {
                    "kg_id": [kg_id],
                    "name": item["name"],
                    "gns": item["gns"],
                    "score": item["score"]
                }

    final_res_list = [v for k, v in final_res.items()]
    final_res_list.sort(key=lambda x: x["score"], reverse=True)
    # max_size = 100

    final_res = {
        "relate_document": final_res_list[page_ * limit_ - limit_:page_ * limit_],
        "count": len(final_res_list)
    }

    return NORMAL_STATUS, final_res


# 任务管理
class TaskManger(object):

    def __new__(cls, *args, **kw):
        if not hasattr(cls, '_instance'):
            orig = super(TaskManger, cls)
            cls._instance = orig.__new__(cls, *args, **kw)
        return cls._instance

    def __init__(self):
        self.task_info = dict()
        self.embed_model = dict()
        cur_path = os.path.dirname(__file__)
        self.config_path = os.path.join(os.path.dirname(cur_path), "config/asapi.conf")
        self.pool = ThreadPoolExecutor(max_workers=10)
        self.load_model()
        # self.pool.submit(self.load_model)

    def get_config(self):
        config = ConfigParser()
        config.read(self.config_path, "utf-8")
        return config

    def load_model(self):
        path = "{}/word2vec.bin".format(self.get_config()["text_match"]["text_match_embed_path"])
        if not os.path.exists(path):
            logger.error("word2vec model {} not exits".format(path))
            return
        with open(path, "rb") as f:
            self.embed_model = cPickle.load(f)
        logger.info("vector model is load")

    # 提交创建主题任务
    def submit_subject_task(self,
                            kg_id,
                            **kwargs):
        insert_res = insert_subject_task(kg_id, **kwargs)
        return insert_res

    def preprocess(self):

        def f():
            start = time.time()
            graph_ids = graph_dao.get_graph_id_list()
            for graph_id in graph_ids["id"]:
                task = TextMatchTask("test", graph_id)
                task.build_document_embed()
            print("build index cost {}".format(time.time() - start))

        self.pool.submit(f)


tm = TaskManger()

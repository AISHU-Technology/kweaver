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
import traceback
import requests
import pymongo
import jieba
import numpy as np
import sys
from concurrent.futures import ThreadPoolExecutor
from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB, get_md5
from service.graph_Service import graph_Service
from utils.common_response_status import CommonResponseStatus
from utils.opensearch_util import OpenSearchManager
from utils.log_info import Logger
import common.stand_log as log_oper
from utils.util import GetGraphDbOsInfo

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
                error_log = log_oper.get_error_log(str(e), sys._getframe(), traceback.format_exc())
                Logger.log_error(error_log)
                return EXCEPTION_STATUS, {"ErrorDetails": str(e),
                                          "Description": str(e),
                                          "ErrorCode": "Builder.SubjectDao.Except.InternalError",
                                          "Solution": "inner error",
                                          "ErrorLink": ""}
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
        error_log = log_oper.get_error_log("OrientDB has something wrong!", sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
        return EXCEPTION_STATUS, {"message": "OrientDB has something wrong!",
                                  "cause": "OrientDB has something wrong!",
                                  "code": CommonResponseStatus.REQUEST_ERROR.value}

    return NORMAL_STATUS, res_dict


# 获取mongodb 配置
def get_mongodb_db_config():
    return {
        "mongodb_ip": "mongodb",
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
        self.text_match_model = kwargs.get("text_match_model", "word2vec")
        self.document_source = kwargs.get("document_source", "orientDB")  # document 来源

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
        if self.document_source == "nebulaGraph":
            self.build_document_embed_nebula()
        else:
            self.build_document_embed_orientdb()

    # 基于nebula构建词向量
    def build_document_embed_nebula(self):
        ret_code, obj = graph_Service.getGraphById(self.kg_id, "")
        if ret_code != NORMAL_STATUS:
            obj["code"] = CommonResponseStatus.KGID_NOT_EXIST.value
            error_log = log_oper.get_error_log(str(obj), sys._getframe())
            Logger.log_error(error_log)
            return ret_code, obj
        res = obj["res"]
        graph_baseInfo = res["graph_baseInfo"]
        base_info = graph_baseInfo
        graph_db_name = base_info["graph_DBName"]
        # If the index has not been created in opensearch, create index
        opensearch_manager = OpenSearchManager()
        opensearch_manager.create_index(self.kg_id)

        graphdb = GraphDB()

        i = 0
        cache_num = 100
        res_list = []
        document_word_embed_cache = []
        document_infos_list = []

        ngql = "match (v1:document)-[e:label2document]-(v2) return v1.document.gns as gns,v1.document.name," \
               "v1.document.file_type,v2.label.name order by gns"
        ret_code, props_res = graphdb.exec(ngql, graph_db_name)

        if ret_code == NORMAL_STATUS and props_res.row_size() > 0:
            for n in range(props_res.row_size()):
                val = props_res.row_values(n)
                if n == 0 or val[0] != props_res.row_values(n - 1)[0]:
                    res_list.append(
                        {'gns': str(val[0])[1:-1], 'name': str(val[1])[1:-1], 'file_type': str(val[2])[1:-1],
                         'label_names': [str(val[3])[1:-1]]})
                else:
                    res_list[-1]["label_names"].append(str(val[3])[1:-1])

            for document in res_list:
                document_title_list = [NeoWord(word, 2.0) for word in jieba.cut(document["name"]) if
                                       word not in self.stop_words]
                document_represent = [NeoWord(label, 1.5) for label in
                                      document["label_names"] if
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

        if len(document_word_embed_cache):
            for emb, info in zip(document_word_embed_cache, document_infos_list):
                emb = np.array(emb).astype('float32')
                doc_name = info.get("name")
                gns = info.get("gns")
                # opensearch写入数据
                opensearch_manager.insert_data(self.kg_id, doc_name, gns, emb)

    # 基于orientdb 构建词向量
    def build_document_embed_orientdb(self):
        ret_code, obj = graph_Service.getGraphById(self.kg_id, "")
        if ret_code != NORMAL_STATUS:
            obj["code"] = CommonResponseStatus.KGID_NOT_EXIST.value
            error_log = log_oper.get_error_log(str(obj), sys._getframe())
            Logger.log_error(error_log)
            return ret_code, obj
        res = obj["res"]
        graph_baseInfo = res["graph_baseInfo"]
        base_info = graph_baseInfo
        address = base_info["graphDBAddress"].split(";")[0]  # 图数据库ip
        graph_db_name = base_info["graph_DBName"]

        # 若opensearch中还未创建index时，创建index
        opensearch_manager = OpenSearchManager()
        opensearch_manager.create_index(self.kg_id)
        # if len(rec_dict) == 0:
        #     return EXCEPTION_STATUS, {"message": "OrientDB ip does not exist", "code": 5005001,
        #                  "cause": "OrientDB ip does not exits"}
        args = {
            "ip": address,
            "port": GetGraphDbOsInfo.graphdb_port,
            "database": graph_db_name,
        }
        sess = requests.Session()
        sess.auth = (GetGraphDbOsInfo.graphdb_user, GetGraphDbOsInfo.graphdb_password)

        i = 0
        skip = 0
        limit = 20
        cache_num = 100
        document_word_embed_cache = []
        document_infos_list = []

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

        if len(document_word_embed_cache):
            for emb, info in zip(document_word_embed_cache, document_infos_list):
                emb = np.array(emb).astype('float32')
                doc_name = info.get("name")
                gns = info.get("gns")
                # opensearch写入数据
                opensearch_manager.insert_data(self.kg_id, doc_name, gns, emb)

    # 基于mongodb 构建词向量
    def build_document_embed_mongo(self):
        import faiss
        dim = 300
        nlist = 5
        quantizer = faiss.IndexFlatIP(dim)  # the other index，需要以其他index作为基础
        index = faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_INNER_PRODUCT)
        ret_code, obj = graph_Service.getGraphById(self.kg_id, "")
        res = obj["res"]
        graph_baseInfo = res["graph_baseInfo"]
        baseInfo = graph_baseInfo
        graph_mongo_name = baseInfo["graph_mongo_Name"]
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


# nebula insert subject
def insert_subject_nebula(graphdb, graph_db_name, **kwargs):
    subject_id = kwargs["subject_id"]
    subject_path = kwargs["subject_path"]
    subject_fold = kwargs["subject_fold"]
    subject_name = kwargs["subject_name"]
    subject_desc = kwargs["subject_desc"]
    subject_label = kwargs["subject_label"]
    subject_document = kwargs["subject_document"]

    # insert vertex
    props = ["subject_id", "subject_path", "subject_fold", "name", "subject_desc"]
    values = [int(subject_id), subject_path, subject_fold, subject_name, subject_desc]
    graphdb.create_vertex(db=graph_db_name, otl_name="subject", props=props, values=values, values_index=[subject_id],
                          pro_value="pro_value", pro_value_index="pro_value_index")

    ngql = "match (v:subject{subject_id:" + str(subject_id) + "}) return id(v) as vid"
    ret_code, props_res = graphdb.exec(ngql, graph_db_name)
    if ret_code != NORMAL_STATUS:
        return EXCEPTION_STATUS, props_res.error_msg()
    if props_res.row_size() < 1:
        return EXCEPTION_STATUS, "nebula has something wrong"
    vid = str(props_res.row_values(0)[0])[1:-1]

    # insert label edge
    for label in subject_label:
        ngql = "match (v:label{name:'" + label["name"] + "'}) return id(v) as vid"
        ret_code, props_res = graphdb.exec(ngql, graph_db_name)
        if ret_code != NORMAL_STATUS:
            continue
        if props_res.row_size() < 1:
            label_vid = get_md5("'" + label["name"] + "'_")
            ngql = 'insert vertex `label` (name, type_kc) values "{0}":("{1}", true)'.format(label_vid, label["name"])
            ret_code, props_res = graphdb.exec(ngql, graph_db_name)
            if ret_code != NORMAL_STATUS:
                continue
        else:
            label_vid = str(props_res.row_values(0)[0])[1:-1]
        graphdb.create_edge("label2subject", label_vid, vid, [["name"], ["'label2subject'"]], graph_db_name)

    # insert document edge
    for document in subject_document:
        ngql = "match (v:document{gns:'" + document["gns"] + "'}) return id(v) as vid"
        ret_code, props_res = graphdb.exec(ngql, graph_db_name)
        if ret_code != NORMAL_STATUS:
            continue
        if props_res.row_size() < 1:
            continue
        document_vid = str(props_res.row_values(0)[0])[1:-1]
        score = document.get("score", 0.0)
        graphdb.create_edge("subject2document", vid, document_vid,
                            [["name", "score"], ["'subject2document'", str(score)]], graph_db_name)
    return 200, "message"


def search_subject_nebula(graphdb, graph_db_name, **kwargs):
    subject_name = kwargs["subject_name"].strip()
    subject_desc = kwargs["subject_desc"]
    doc_title_keyword = kwargs["doc_title_keyword"]
    page = int(kwargs["page"])
    limit = int(kwargs["limit"])

    ngql = "match (v1:subject)-[e:subject2document]->(v2:document) " \
           "where v1.subject.name contains '{0}' and v1.subject.subject_desc contains '{1}' " \
           "and v2.document.name contains '{2}' " \
           "return e.score as score, v2.document.gns as gns, v2.document.name as name " \
           "order by score desc skip {3} limit {4}".format(subject_name, subject_desc, doc_title_keyword, page * limit - limit, limit)
    ret_code, props_res = graphdb.exec(ngql, graph_db_name)
    if ret_code != NORMAL_STATUS:
        return EXCEPTION_STATUS, props_res.error_msg()
    res_list = []
    for i in range(props_res.row_size()):
        val = props_res.row_values(i)
        res_list.append({
            "score": float(str(val[0])),
            "gns": str(val[1])[1:-1],
            "name": str(val[2])[1:-1]
        })
    return 200, res_list


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
        self.pool = ThreadPoolExecutor(max_workers=10)


    def preprocess(self):

        def f():
            start = time.time()
            graph_ids = graph_dao.get_graph_id_list()
            for graph_id in graph_ids:
                task = TextMatchTask("test", graph_id["id"])
                task.build_document_embed()
            Logger.log_info("build index cost {}".format(time.time() - start))

        self.pool.submit(f)


tm = TaskManger()

# -*- coding: utf-8 -*-
from opensearchpy import OpenSearch
from utils.log_info import Logger
from dao.task_dao import task_dao
from utils.CommonUtil import commonutil
import os


class OpenSearchManager(object):
    def __init__(self, graph_db_id):
        ret = task_dao.getGraphDBbyId(graph_db_id)
        rec_dict = ret.to_dict('records')
        rec_dict = rec_dict[0]
        fulltext_id = rec_dict['fulltext_id']
        ret = task_dao.getFulltextEnginebyId(fulltext_id)
        rec_dict = ret.to_dict('records')[0]
        host = rec_dict['ip']
        port = rec_dict['port']
        user = rec_dict['user']
        passwd = rec_dict['password']
        passwd = commonutil.DecryptBybase64(passwd)

        print(host, port, user, passwd)
        auth = (user, passwd)
        self.test_index = "document_embeddings"
        try:
            self.client = OpenSearch(
                hosts=[{'host': host, 'port': port}],
                http_compress=True,  # enables gzip compression for request bodies
                http_auth=auth,
                # client_cert = client_cert_path,
                # client_key = client_key_path,
                use_ssl=True,
                verify_certs=False,
                ssl_assert_hostname=False,
                ssl_show_warn=False,
                # ca_certs = ca_certs_path
            )
            self._is_exist(self.test_index)
        except Exception:
            self.client = OpenSearch(
                hosts=[{'host': host, 'port': port}],
                http_compress=True,  # enables gzip compression for request bodies
                http_auth=auth,
                # client_cert = client_cert_path,
                # client_key = client_key_path,
                use_ssl=False,
                verify_certs=False,
                ssl_assert_hostname=False,
                ssl_show_warn=False,
                # ca_certs = ca_certs_path
            )
            self._is_exist(self.test_index)
            
    def _is_exist(self, index):
        # 判断index_name是否存在
        return self.client.indices.exists(index)
    
    def create_index(self, kg_id):
        # index_name = 'my_python_test001'  # 相当于sql表中的表名
        # 相当于定义sql表中的字段
        index = self.test_index + "_" + str(kg_id)
        if not self._is_exist(index):
            index_body = {
                "settings": {
                    "index": {
                        "knn": True,
                        "knn.algo_param.ef_search": 100
                    }
                },
                "mappings": {
                    "properties": {
                        "doc_embed": {
                            "type": "knn_vector",
                            "dimension": 300,
                            "method": {
                                "name": "hnsw",
                                "space_type": "l2",
                                "engine": "nmslib",
                                "parameters": {
                                    "ef_construction": 128,
                                    "m": 24
                                }
                            }
                        },
                        "gns": {
                            "type": "text"
                        },
                        "doc_name": {
                            "type": "text"
                        }
                    }
                }
            }
            self.client.indices.create(index=index, body=index_body)
            # print("create index res: ", res)
            Logger.log_info("create index: {}".format(index))
    
    def insert_data(self, kg_id, doc_name, gns, embed):
        index = self.test_index + "_" + str(kg_id)
        try:
            self.client.index(index=index, body={
                "doc_embed": embed,
                "doc_name": doc_name,
                "gns": gns
            })
            Logger.log_info("insert data, gns: {}".format(gns))
        except Exception:
            Logger.log_error("insert data error: {}".format(gns))
    
    def delete_data(self):
        pass #EMPTY
    
    def update_data(self):
        pass #EMPTY
    
    def search_data_by_emb(self, kg_id, query, topK=1000):
        index = self.test_index + "_" + str(kg_id)
        try:
            res = self.client.search(
                index=index,
                body={
                    "_source": ["doc_name", "gns"],
                    "size": topK,
                    "query": {
                        "knn": {
                            "doc_embed": {
                                "vector": query,
                                "k": topK
                            }
                        }
                    }
                }
            )
            # print("search res: ", res["hits"]["total"]["value"])
            return res
        except Exception as e:
            Logger.log_error("search query error: {}".format(repr(e)))

    def search_data_by_keyword(self, kg_id, word, topK=1000):
        index = self.test_index + "_" + str(kg_id)
        try:
            res = self.client.search(
                index=index,
                body={
                    "_source": ["doc_name", "gns"],
                    "size": topK,
                    "query": {
                        "match": {
                            "doc_name": word,
                        }
                    }
                }
            )
            return res
        except Exception as e:
            Logger.log_error("search word error: {}".format(repr(e)))



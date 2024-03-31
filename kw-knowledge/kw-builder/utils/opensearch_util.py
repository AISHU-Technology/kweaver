# -*- coding: utf-8 -*-
from opensearchpy import OpenSearch
from utils.log_info import Logger
import common.stand_log as log_oper
import sys
import traceback
import requests
from requests.auth import HTTPBasicAuth

from utils.util import GetGraphDbOsInfo


class OpenSearchManager(object):
    def __init__(self):
        host = GetGraphDbOsInfo.opensearch_ip
        port = GetGraphDbOsInfo.opensearch_port
        user = GetGraphDbOsInfo.opensearch_user
        passwd = GetGraphDbOsInfo.opensearch_passwd

        auth = (user, passwd)
        self.test_index = "document_embeddings"
        try:
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
        except Exception:
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
        finally:
            self._basicUrl = f"http://{host}:{port}"
            self._user = user
            self._passwd = passwd
            self.state = {}

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
            error_log = log_oper.get_error_log("insert data error: {}".format(gns), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)

    def delete_data(self):
        pass  # EMPTY

    def update_data(self):
        pass  # EMPTY

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
            return res
        except Exception as e:
            error_log = log_oper.get_error_log("search query error: {}".format(repr(e)), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)

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
            error_log = log_oper.get_error_log("search word error: {}".format(repr(e)), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)

    def delete_index(self, kg_id):
        index = self.test_index + "_" + str(kg_id)
        try:
            res = self.client.indices.delete(
                index=index,
            )
            return res
        except Exception as e:
            error_log = log_oper.get_error_log("search word error: {}".format(repr(e)), sys._getframe(),
                                               traceback.format_exc())
            Logger.log_error(error_log)

    def have_enough_shared(self, need_shared):
        """
        判断openSearch是否能容纳所需分片数
        need_shared: 所需分片数
        """
        # 调用网络接口
        url = self._basicUrl + "/_cluster/health?pretty"
        # 获取当前已用分片
        response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))
        if response.status_code != 200:
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': "opensearch health get fail",
                                   'message': "opensearch health get fail"}}
            Logger.log_info(self.state)
            return response.status_code, response.json()
        res_json = response.json()
        used_shared = res_json['active_shards'] + res_json['relocating_shards'] + res_json['initializing_shards'] + \
                      res_json['unassigned_shards'] + res_json['delayed_unassigned_shards']

        # 获取最大分片
        url = self._basicUrl + "/_cluster/settings"
        response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))
        if response.status_code != 200:
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': "opensearch settings get fail",
                                   'message': "opensearch settings get fail"}}
            Logger.log_info(self.state)
            return response.status_code, response.json()
        res_json = response.json()
        max_shared = "float('inf')"
        transient = res_json.get("transient")
        if transient != None:
            cluster = transient.get("cluster")
            if cluster != None:
                max_shared = cluster.get("max_shards_per_node", "float('inf')")
        max_shared = eval(max_shared)

        # 比较剩余分片数是否 大于 所需分片数
        return 200, max_shared - used_shared >= need_shared

    def have_enough_disk(self):
        '''
        当磁盘空间超过水位线时（cluster.routing.allocation.disk.watermark.flood_stage），
        会自动将索引切换为只读状态，此时插入数据会失败。
        提前检查是否有只读索引，判断磁盘使用情况
        '''
        # 查看watermark
        url = self._basicUrl + "/_cluster/settings"
        response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd),
                                params={'include_defaults': 'true',
                                        'flat_settings': 'true'})
        if response.status_code != 200:
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': "opensearch getting cluster settings fail",
                                   'message': "opensearch getting cluster settings fail"}}
            Logger.log_info(self.state)
            return response.status_code, response.json()
        res_json = response.json()
        key = 'cluster.routing.allocation.disk.watermark.flood_stage'
        if key in res_json['transient']:
            watermark_flood_stage = res_json['transient'][key].lower()
        elif key in res_json['persistent']:
            watermark_flood_stage = res_json['persistent'][key].lower()
        elif key in res_json['defaults']:
            watermark_flood_stage = res_json['defaults'][key].lower()
        if watermark_flood_stage.endswith('%'):
            # 百分值
            watermark_flood_stage = watermark_flood_stage.replace('%', '')
            watermark_flood_stage = float(watermark_flood_stage) / 100
        elif watermark_flood_stage.endswith('kb'):
            # 绝对值
            watermark_flood_stage = watermark_flood_stage.replace('kb', '')
            watermark_flood_stage = int(watermark_flood_stage) * 1024
        elif watermark_flood_stage.endswith('mb'):
            # 绝对值
            watermark_flood_stage = watermark_flood_stage.replace('mb', '')
            watermark_flood_stage = int(watermark_flood_stage) * 1024 * 1024
        elif watermark_flood_stage.endswith('gb'):
            # 绝对值
            watermark_flood_stage = watermark_flood_stage.replace('gb', '')
            watermark_flood_stage = int(watermark_flood_stage) * 1024 * 1024 * 1024
        elif watermark_flood_stage.endswith('tb'):
            # 绝对值
            watermark_flood_stage = watermark_flood_stage.replace('tb', '')
            watermark_flood_stage = int(watermark_flood_stage) * 1024 * 1024 * 1024 * 1024
        else:
            # 百分值
            watermark_flood_stage = float(watermark_flood_stage)
        # 查看实际磁盘占用
        url = self._basicUrl + "/_nodes/stats/"
        response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))
        if response.status_code != 200:
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': "opensearch getting nodes stats fail",
                                   'message': "opensearch getting nodes stats fail"}}
            Logger.log_info(self.state)
            return response.status_code, response.json()
        res_json = response.json()
        for node, node_stats in res_json['nodes'].items():
            for os_path in node_stats['fs']['data']:
                total_space = os_path['total_in_bytes']
                free_space = os_path['free_in_bytes']
                if watermark_flood_stage < 1:
                    flood_stage = total_space * watermark_flood_stage
                else:
                    flood_stage = watermark_flood_stage
                if total_space - free_space >= flood_stage:
                    return 200, False
        return 200, True


    def get_used_indexs_by_db_name(self, db_name):
        """
        获取图id已用openSearch的索引名
        db_name: 图id
        """
        # 调用网络接口
        url = self._basicUrl + f"/{db_name}*"
        # 获取当前已用索引
        response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))
        if response.status_code != 200:
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': "opensearch db_name indexs get fail",
                                   'message': "opensearch db_name indexs get fail"}}
            Logger.log_info(self.state)
            return response.status_code, response.json()
        res_json = response.json()
        return 200, res_json.keys()

    def del_indexs(self, indexs):
        """
        删除openSearch中当前索引集合
        indexs: 索引集合
        """
        if len(indexs) == 0:
            return 200, ""
        # 调用网络接口
        url = self._basicUrl + "/%s" % ','.join(indexs)
        # 删除分片
        response = requests.delete(url, auth=HTTPBasicAuth(self._user, self._passwd))
        if response.status_code != 200:
            self.state = {'state': 'FAILURE',
                          'meta': {'cause': response.content,
                                   'message': "opensearch delete indexs fail"}}
            Logger.log_info(self.state)
            return response.status_code, response.json()
        return 200, ""


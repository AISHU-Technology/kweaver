import datetime
import json
import math
import time
from decimal import Decimal

import requests

from common.errorcode import codes
from common.log import log
from dao.async_task_dao import async_task_dao
from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB
from dao.intelligence_dao import intelligence_dao
from dao.otl_dao import otl_dao
from service.graph_Service import graph_Service


class IntelligenceCalculateService(object):

    def calculate_graph_intelligence(self, graph_id):
        """
        图谱的数据质量, 计算每个实体类的数据量
        """
        if not graph_id or graph_id < 0:
            return "invalid params"

        graph_info = graph_dao.get_graph_detail(graph_id)

        if not graph_info or not graph_info.get('KDB_name') or not graph_info.get('graph_db_id'):
            return "invalid graph"

        space_id = graph_info["KDB_name"]
        graph_db = GraphDB(graph_info['graph_db_id'])

        entity_onto_list = intelligence_query_service.query_real_entity_list(graph_db, graph_id, space_id)

        graph_quality = dict()
        graph_quality['graph_id'] = graph_id
        graph_quality['knw_id'] = graph_info['knw_id']
        graph_quality['update_time'] = datetime.datetime.now()

        for entity_info in entity_onto_list:
            quality_dict = self.entity_quality(graph_db, entity_info)

            if quality_dict is None:
                return None

            self.add_graph_stats(graph_quality, quality_dict)

        """
        写入到数据库
        """
        if entity_onto_list:
            intelligence_dao.insert_records([graph_quality])

    def entity_quality(self, graph_db: GraphDB, entity_info: dict):
        """
        查询图数据库中的实际数据质量
        """
        entity_name = entity_info['name']
        space_id = entity_info['space_id']
        otl_type = entity_info['otl_type']
        total = entity_info['total']

        code, properties = graph_db.get_properties(space_id, otl_type, entity_name)
        not_empty_total = 0
        for prop in properties.keys():
            code, res = graph_db.graph_entity_prop_empty(space_id, entity_name, otl_type, prop)
            not_empty_total += total if code != 200 else res.column_values('not_empty').pop(0).as_int()

        entity_info['total'] = entity_info['total']
        entity_info['empty'] = entity_info['total'] * len(properties) - not_empty_total
        entity_info['repeat'] = 0
        entity_info['prop_number'] = len(properties)
        return entity_info

    def send_task(self, graph_id):
        """
        发送异步任务到celery, 参数未知
        """

        url = "http://localhost:6488/task/intelligence"
        headers = {
            'Content-Type': 'application/json',
        }
        param_json = dict()
        param_json['task_type'] = 'intelligence'
        param_json['relation_id'] = graph_id
        param_json['task_name'] = 'intelligence-{}'.format(graph_id)
        param_json['async_task_name'] = "cel.intelligence_calculate"
        # 设置是否取消正在运行的同图谱任务
        param_json['cancel_pre'] = True
        param_json['task_params'] = json.dumps({"graph_id": graph_id})

        try:
            response = requests.request("POST", url, headers=headers, data=json.dumps(param_json))
            if response.status_code != 200:
                return response.status_code, {}
            res_json = response.json()
            return response.status_code, res_json
        except Exception as e:
            log.error(repr(e))
            return codes.failServerErrorCode, {}

    def graph_calculate_task(self, param_json):
        """
        方便异步任务调用的方法
        """
        if 'graph_id' not in param_json:
            raise Exception("invalid parameters")
        self.calculate_graph_intelligence(param_json['graph_id'])

    def add_graph_stats(self, graph_record, quality_dict):
        graph_record.setdefault('entity_knowledge', 0)
        graph_record.setdefault('edge_knowledge', 0)
        graph_record.setdefault('data_number', 0)
        graph_record.setdefault('total_knowledge', 0)
        graph_record.setdefault('empty_number', 0)
        graph_record.setdefault('repeat_number', 0)
        graph_record.setdefault('data_quality_score', 0)
        # total statistics
        knowledge = quality_dict['total'] * quality_dict['prop_number']

        if quality_dict['otl_type'] == 'entity':
            graph_record['entity_knowledge'] += knowledge
        else:
            graph_record['edge_knowledge'] += knowledge

        graph_record['data_number'] += quality_dict['prop_number']
        graph_record['total_knowledge'] += knowledge
        graph_record['empty_number'] += quality_dict['empty']
        graph_record['repeat_number'] += quality_dict['repeat']
        # 计算总的智商分数
        graph_record['data_quality_score'] = intelligence_dao.intelligence_score(graph_record['total_knowledge'],
                                                                                 graph_record['empty_number'],
                                                                                 graph_record['repeat_number'])


class IntelligenceQueryService(object):

    def query_graph_intelligence(self, graph_id):
        """
        查询图谱的智商
        """
        try:
            graph_info = graph_dao.get_graph_detail(graph_id)

            code, data = graph_Service.get_graph_info_count(graph_id)
            if code != codes.successCode:
                return code, data
            count_info = data.json.get('res')

            records = intelligence_dao.query([graph_info['graph_id']])
            if not records:
                return codes.successCode, self.default_graph_response(graph_info)
            # 汇总计算
            graph_quality = self.graph_intelligence_info(records[0], graph_info)
            # 需要加上总数信息
            graph_quality['edge'] = count_info.get('edge', [])
            graph_quality['edge_count'] = count_info.get('edge_count', 0)
            graph_quality['entity'] = count_info.get('entity', [])
            graph_quality['entity_count'] = count_info.get('entity_count', 0)
            # 添加最后一次任务信息
            task_info_list = async_task_dao.query_latest_task([graph_quality['graph_id']])
            self.add_task_info(graph_quality, task_info_list)
            return codes.successCode, graph_quality
        except Exception as e:
            log.error(repr(e))
            return codes.failCode, None

    def query_network_intelligence(self, query_params: dict):
        """
        计算知识网络的领域智商
        """

        try:
            # 根据名称，模糊，分页查询图谱
            graph_score_list = self.query_graph_score_in_pages(query_params)
            if not graph_score_list:
                return codes.successCode, self.default_network_response(query_params['knw_id'])

            graph_id_list = [info['graph_id'] for info in graph_score_list]

            # 查询graph详细信息
            graph_detail_list = graph_dao.get_graph_detail(graph_id_list)
            graph_detail_dict = {graph_detail['graph_id']: graph_detail for graph_detail in graph_detail_list}

            # 查询任务记录
            knw_intelligence = dict()
            task_info_list = async_task_dao.query_latest_task(graph_id_list)
            task_info_dict = {int(task_info['relation_id']): task_info for task_info in task_info_list}

            # 统计智商数据
            recent_calculate_time = ''
            total = 0
            repeat = 0
            empty = 0
            has_value = False
            graph_intelligence_list = list()
            for graph_score in graph_score_list:
                graph_info = graph_detail_dict.get(graph_score['graph_id'])
                # 添加领域智商
                graph_quality = self.graph_intelligence_info(graph_score, graph_info)
                # 添加任务状态
                self.add_task_info(graph_quality, task_info_dict.get(graph_info['graph_id']))
                graph_intelligence_list.append(graph_quality)
                # 没有数据就不用加入计算了
                if graph_quality['total_knowledge'] <= 0:
                    continue
                # 更新最大时间
                recent_calculate_time = self.max_time(graph_quality['last_task_time'], recent_calculate_time)
                # 总得分
                total += graph_quality['total_knowledge']
                repeat += graph_quality['data_repeat_C1']
                empty += graph_quality['data_empty_C2']

                has_value = True

            knw_intelligence['knw_id'] = graph_detail_list[0]["knw_id"]
            knw_intelligence['knw_name'] = graph_detail_list[0]["knw_name"]
            knw_intelligence['knw_description'] = graph_detail_list[0]["knw_description"]
            knw_intelligence['color'] = graph_detail_list[0]["color"]
            knw_intelligence['creation_time'] = graph_detail_list[0]["creation_time"]
            knw_intelligence['update_time'] = graph_detail_list[0]["update_time"]
            knw_intelligence['recent_calculate_time'] = recent_calculate_time
            knw_intelligence['graph_intelligence_list'] = graph_intelligence_list
            # calculate network intelligence
            score = round(intelligence_dao.intelligence_score(total, empty, repeat), 2)
            if not has_value:
                score = -1
            knw_intelligence['intelligence_score'] = score

            return codes.successCode, knw_intelligence
        except Exception as e:
            log.error(repr(e))
            return codes.failCode, None

    @classmethod
    def query_graph_onto_info(cls, graph_id):
        """
        查询本体表，获取用户设计的本体详细信息
        """
        graph_detail = graph_dao.get_graph_detail(graph_id)
        if not graph_detail:
            return None, None

        # 查本体
        onto_info_list = None
        id_list_str = graph_detail.get('graph_otl')
        if id_list_str:
            id_list = eval(id_list_str)
            if id_list:
                onto_info_list = otl_dao.getbyids(id_list)

        onto_info_list_dict = onto_info_list.to_dict('index')
        onto_info_list = [info for index, info in onto_info_list_dict.items()]

        entity_list = list()
        edge_list = list()
        for onto_info in onto_info_list:
            # 合并实体类
            item_entity_list = eval(onto_info['entity'])
            entity_list.extend(item_entity_list)

            item_edge_list = eval(onto_info['edge'])
            edge_list.extend(item_edge_list)

        return entity_list, edge_list

    def query_real_entity_list(self, graph_db: GraphDB, graph_id, space_id: str):
        """
        比较mysql中的本体和实际图数据库中的本体，最终以图数据库中的为准
        """
        res_code, class_list = graph_db.stats(space_id)
        if res_code != codes.successCode:
            log.error("query graph onto info error")
            return []
        # 构造字典，过滤不存在的边或者实体类
        real_class_dict = dict()
        for c in class_list:
            if not isinstance(c, dict):
                continue
            for k, v in c.items():
                if k not in real_class_dict:
                    real_class_dict[k] = v

        entity_list, edge_list = intelligence_query_service.query_graph_onto_info(graph_id)
        entity_onto_list = list()
        # 添加边
        for edge in edge_list:
            name = edge['name']
            total = real_class_dict.get(name)
            if not total:
                continue
            item = dict()
            item['space_id'] = space_id
            item['otl_type'] = 'edge'
            item['name'] = name
            item['total'] = total

            entity_onto_list.append(item)
        # 添加实体
        for entity in entity_list:
            name = entity['name']
            total = real_class_dict.get(name)
            if not total:
                continue
            item = dict()
            item['space_id'] = space_id
            item['otl_type'] = 'entity'
            item['name'] = name
            item['total'] = total

            entity_onto_list.append(item)
        return entity_onto_list

    def network_list_intelligence(self, knw_id_list: list):
        """
        查询一批知识网络的智商
        """
        results = list()
        for knw_id in knw_id_list:
            r = self.query_network_intelligence(knw_id)
            results.append(r)
        return results

    def default_graph_response(self, graph_info):
        res = dict()
        res['graph_id'] = graph_info['graph_id']
        res['graph_config_id'] = graph_info['graph_config_id']
        res['graph_name'] = graph_info['graph_name']
        res['calculate_status'] = 'NOT_CALCULATE'
        res['edge_knowledge'] = 0
        res['entity_knowledge'] = 0
        res['data_quality_B'] = -1
        res['total_knowledge'] = 0
        res['last_task_message'] = ''
        res['last_task_time'] = ''
        res['data_repeat_C1'] = -1
        res['data_empty_C2'] = -1
        res['data_quality_B'] = -1
        res['data_quality_score'] = -1
        return res

    def default_intelligence_list(self, graph_info_list):

        return

    def default_network_response(self, knw_id):
        return {"res": {"knw_id": knw_id, "graph_intelligence_list": []}}

    def max_time(self, a: datetime.datetime, b: datetime.datetime):
        return a

    def query_graph_score_in_pages(self, query_params):
        """
        分页查询图谱信息
        """
        if 'page' not in query_params:
            query_params['page'] = 1
        if 'size' not in query_params:
            query_params['size'] = 10
        # 如果小于0， 表示明确不需要分页
        if int(query_params.get('size')) < 0:
            query_params.pop('size', 0)
            query_params.pop('page', 0)
        if isinstance(query_params.get('rule'), str):
            query_params['rule'] = query_params['rule'].split(',')
        if isinstance(query_params.get('order'), str):
            query_params['order'] = query_params['order'].split(',')

        graph_score_list = intelligence_dao.query_in_page(query_params)
        return graph_score_list

    def graph_intelligence_info(self, record, graph_info):
        """
        根据图谱信息，给出合适的智商信息
        """
        if not record or not record['id']:
            return self.default_graph_response(graph_info)
        total_knowledge = record.get('total_knowledge', 0)
        graph_quality = dict()
        graph_quality['graph_id'] = graph_info['graph_id']
        graph_quality['graph_name'] = graph_info['graph_name']
        graph_quality['graph_config_id'] = graph_info['graph_config_id']
        graph_quality['entity_knowledge'] = record.get('entity_knowledge', 0)
        graph_quality['edge_knowledge'] = record.get('edge_knowledge', 0)
        graph_quality['data_repeat_C1'] = round(record.get('repeat_number', 0) / total_knowledge, 2)
        graph_quality['data_empty_C2'] = round(record.get('empty_number', 0) / total_knowledge, 2)
        graph_quality['data_quality_B'] = round(math.log(record.get('total_knowledge', 0), 10) * 10, 2)
        graph_quality['total_knowledge'] = total_knowledge
        graph_quality['data_quality_score'] = round(record['data_quality_score'], 2)
        return graph_quality

    def add_task_info(self, graph_quality, task_info_list):
        """
        添加最后一次任务信息
        """

        if task_info_list is None:
            graph_quality['calculate_status'] = "NOT_CALCULATE"
            graph_quality['last_task_message'] = ""
            graph_quality['last_task_time'] = ""
            return

        if not isinstance(task_info_list, list):
            task_info = task_info_list
        else:
            task_info = task_info_list[0]

        calculate_status = '-'
        task_status = task_info.get('task_status', "-")
        if task_status == 'running':
            calculate_status = 'IN_CALCULATING'
        elif task_status == 'finished':
            calculate_status = 'CALCULATED'
        elif task_status == 'failed':
            calculate_status = 'CALCULATE_FAIL'
        elif task_status == 'canceled':
            calculate_status = 'CALCULATE_CANCEL'

        graph_quality['calculate_status'] = calculate_status
        graph_quality['last_task_message'] = task_info.get('result') if task_info.get('result') else ""
        graph_quality['last_task_time'] = (task_info['created_time']).strftime('%Y-%m-%d %H:%M:%S')


intelligence_query_service = IntelligenceQueryService()
intelligence_calculate_service = IntelligenceCalculateService()

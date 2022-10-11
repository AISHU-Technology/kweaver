import datetime
import json
import math
import time

import requests

from common.errorcode import codes
from common.log import log
from dao.async_task_dao import async_task_dao
from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB
from dao.intelligence_dao import intelligence_dao
from dao.otl_dao import otl_dao


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

        quality_dict_list = list()
        for entity_info in entity_onto_list:
            quality_dict = self.entity_quality(graph_db, entity_info)

            if quality_dict is None:
                return None

            record = dict()
            record['graph_id'] = graph_id
            record['entity'] = quality_dict['name']
            record['entity_type'] = quality_dict['otl_type']
            record['prop_number'] = quality_dict['prop_number']
            record['data_number'] = quality_dict['total']
            record['empty_number'] = quality_dict['empty']
            record['updated_time'] = datetime.datetime.now()

            quality_dict_list.append(record)

        """
        写入到数据库
        """
        if quality_dict_list:
            intelligence_dao.insert_records(quality_dict_list)

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


class IntelligenceQueryService(object):

    def query_graph_intelligence(self, graph_id):
        """
        查询图谱的智商
        """
        try:
            graph_info = graph_dao.get_graph_detail(graph_id)

            records = intelligence_dao.query([graph_info['graph_id']])
            if not records:
                return codes.successCode, self.default_graph_response(graph_info)
            # 汇总计算
            graph_quality = self.intelligence_stats(records, graph_info)
            # 添加最后一次任务信息
            task_info_list = async_task_dao.query_latest_task([graph_quality['graph_id']])
            self.add_task_info(graph_quality, task_info_list)
            return codes.successCode, graph_quality
        except Exception as e:
            log.error(repr(e))
            return codes.failCode, None

    def query_network_intelligence_score(self, knw_id):
        """
        查询单个知识网络的领域智商
        """
        # 根据名称，模糊，分页查询图谱
        query_params = dict()
        query_params["knw_id"] = knw_id
        query_params["size"] = -1
        graph_info_list = self.query_graph_in_pages(query_params)
        log.info(graph_info_list)

        if not graph_info_list:
            return -1

        graph_info_dict = {info['graph_id']: info for info in graph_info_list}
        graph_id_list = [graph_id for graph_id in graph_info_dict.keys()]

        # 查询领域智商
        records = intelligence_dao.query(graph_id_list)
        if not records:
            return -1

        record_dict = dict()
        for record in records:
            entity_records = record_dict.get(record['graph_id'], list())
            entity_records.append(record)
            record_dict[record['graph_id']] = entity_records

        total = 0
        for graph_info in graph_info_list:
            entity_records = record_dict.get(graph_info['graph_id'], [])
            graph_quality = self.intelligence_stats(entity_records, graph_info)
            # 没有数据就不用加入计算了
            if graph_quality['total_knowledge'] <= 0:
                continue
            total += graph_quality['total_knowledge'] * (
                    (2 - graph_quality['data_quality_C1'] - graph_quality['data_quality_C2']) / 2)
        if total <= 0:
            return -1
        return round(math.log(total, 10) * 10, 2)

    def query_network_intelligence(self, query_params: dict):
        """
        计算知识网络的领域智商
        """

        try:
            # 根据名称，模糊，分页查询图谱
            graph_info_list = self.query_graph_in_pages(query_params)
            if not graph_info_list:
                return codes.successCode, self.default_network_response(query_params['knw_id'])

            graph_info_dict = {info['graph_id']: info for info in graph_info_list}
            graph_id_list = [graph_id for graph_id in graph_info_dict.keys()]

            # 查询领域智商
            records = intelligence_dao.query(graph_id_list)
            record_dict = dict()
            for record in records:
                entity_records = record_dict.get(record['graph_id'], list())
                entity_records.append(record)
                record_dict[record['graph_id']] = entity_records

            # 查询任务记录
            knw_intelligence = dict()
            task_info_list = async_task_dao.query_latest_task(graph_id_list)
            task_info_dict = {int(task_info['relation_id']): task_info for task_info in task_info_list}

            # 统计智商数据
            recent_calculate_time = ''
            total = 0
            has_value = False
            graph_intelligence_list = list()
            for graph_info in graph_info_list:
                entity_records = record_dict.get(graph_info['graph_id'], [])
                # 添加领域智商
                graph_quality = self.intelligence_stats(entity_records, graph_info)
                # 添加任务状态
                self.add_task_info(graph_quality, task_info_dict.get(graph_info['graph_id']))
                graph_intelligence_list.append(graph_quality)
                # 没有数据就不用加入计算了
                if graph_quality['total_knowledge'] <= 0:
                    continue
                # 更新最大时间
                recent_calculate_time = self.max_time(graph_quality['last_task_time'], recent_calculate_time)
                # 总得分
                total += graph_quality['total_knowledge'] * (1 - graph_quality['data_quality_C2'] / 2)
                has_value = True

            knw_intelligence['knw_id'] = graph_info_list[0]["knw_id"]
            knw_intelligence['knw_name'] = graph_info_list[0]["knw_name"]
            knw_intelligence['knw_description'] = graph_info_list[0]["knw_description"]
            knw_intelligence['color'] = graph_info_list[0]["color"]
            knw_intelligence['creation_time'] = graph_info_list[0]["creation_time"]
            knw_intelligence['update_time'] = graph_info_list[0]["update_time"]
            knw_intelligence['total'] = round(math.log(total, 10) * 10, 2) if has_value else -1
            knw_intelligence['recent_calculate_time'] = recent_calculate_time
            knw_intelligence['graph_intelligence_list'] = graph_intelligence_list

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
        res['last_task_message'] = ''
        res['last_task_time'] = ''
        res['data_repeat_C1'] = -1
        res['data_missing_C2'] = -1
        res['data_quality_B'] = -1
        res['data_quality_score'] = -1

    def default_intelligence_list(self, graph_info_list):

        return

    def default_network_response(self, knw_id):
        return {"res": {"knw_id": knw_id, "graph_intelligence_list": []}}

    def max_time(self, a: datetime.datetime, b: datetime.datetime):
        return a

    def query_graph_in_pages(self, query_params):
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
        graph_info_list = graph_dao.query_graph_otl_in_page(query_params)
        return graph_info_list

    def intelligence_stats(self, records, graph_info):
        graph_quality = dict()
        graph_quality['graph_id'] = graph_info['graph_id']
        graph_quality['graph_name'] = graph_info['graph_name']
        graph_quality['graph_config_id'] = graph_info['graph_config_id']
        if not records:
            graph_quality['data_quality_C1'] = -1
            graph_quality['data_quality_C2'] = -1
            graph_quality['data_quality_B'] = -1
            graph_quality['total_knowledge'] = -1
            graph_quality['intelligence_score'] = -1
            return graph_quality

        total = 0
        not_empty = 0
        updated_time = None
        for record in records:
            # 计算总数
            entity_total = record['prop_number'] * record['data_number']
            total += entity_total
            # 计算缺失总数
            not_empty += (entity_total - record['empty_number'])
            # 计算时间，所有的时间应该是一致的，取一条即可
            updated_time = record['updated_time']

        graph_quality['data_quality_C1'] = 0
        graph_quality['data_quality_C2'] = round(1 - not_empty / total, 2)
        graph_quality['data_quality_B'] = round(math.log(total, 10) * 10, 2)
        graph_quality['total_knowledge'] = total
        graph_quality['intelligence_score'] = graph_quality['data_quality_B'] * \
                                              (1 - graph_quality['data_quality_C1'] +
                                               1 - graph_quality['data_quality_C2']) / 2
        graph_quality['intelligence_score'] = round(graph_quality['intelligence_score'], 2)

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

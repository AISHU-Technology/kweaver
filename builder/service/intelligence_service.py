import datetime
import json
import math

import requests

from common.errorcode import codes
from common.log import log
from dao.async_task_dao import async_task_dao
from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB
from dao.intelligence_dao import intelligence_dao
from dao.otl_dao import otl_dao
from dao.knw_dao import knw_dao
from service.async_task_service import async_task_service
from service.graph_Service import graph_Service
from common.errorcode.gview import Gview
from utils.util import async_call


class IntelligenceCalculateService(object):

    def calculate_graph_intelligence(self, graph_id):
        """
        图谱的数据质量, 计算每个实体类的数据量
        """
        if not graph_id:
            raise Exception("parameter graph_id invalid or missing")
        graph_id = int(graph_id)
        if graph_id <= 0:
            raise Exception("parameter graph_id invalid")

        graph_info = graph_dao.get_graph_detail(graph_id)

        if not graph_info or not graph_info.get('KDB_name') or not graph_info.get('graph_db_id'):
            raise Exception(f"graph {graph_id} is empty")

        space_id = graph_info["KDB_name"]
        graph_db = GraphDB(graph_info['graph_db_id'])

        graph_quality = self.gen_default_quality_record(graph_info)
        entity_onto_list = intelligence_query_service.query_real_entity_list(graph_db, graph_id, space_id)
        if entity_onto_list:
            for entity_info in entity_onto_list:
                quality_dict = self.entity_quality(graph_db, entity_info)
                self.add_graph_stats(graph_quality, quality_dict)

            # 计算总的智商分数
            graph_quality['data_quality_score'] = intelligence_dao.data_quality_score(graph_quality['total_knowledge'],
                                                                                      graph_quality['empty_number'],
                                                                                      graph_quality['repeat_number'])
        """
        写入到数据库
        """
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
        if code != codes.successCode:
            raise Exception(repr(properties))

        not_empty_total = 0
        for prop in properties.keys():
            code, res = graph_db.graph_entity_prop_empty(space_id, entity_name, otl_type, prop)
            if code != 200:
                if total == 0:
                    continue
                raise Exception(repr(res))
            not_empty_total += res

        if total <= 0:
            entity_info['empty'] = 0
        else:
            entity_info['empty'] = total * len(properties) - not_empty_total

        entity_info['total'] = total
        entity_info['repeat'] = 0
        entity_info['prop_number'] = len(properties)
        return entity_info

    def gen_default_quality_record(self, graph_info):
        graph_quality = dict()
        graph_quality['graph_id'] = graph_info['graph_id']
        graph_quality['knw_id'] = graph_info['knw_id']
        graph_quality['update_time'] = datetime.datetime.now()
        graph_quality.setdefault('entity_knowledge', 0)
        graph_quality.setdefault('edge_knowledge', 0)
        graph_quality.setdefault('data_number', 0)
        graph_quality.setdefault('total_knowledge', 0)
        graph_quality.setdefault('empty_number', 0)
        graph_quality.setdefault('repeat_number', 0)
        graph_quality.setdefault('data_quality_score', 0)
        return graph_quality

    @async_call
    def update_intelligence_info(self, graph_id_list):
        try:
            self.cancel_task_list(graph_id_list)
            # delete intelligence info
            intelligence_dao.delete_intelligence_info(graph_id_list)
        except Exception as e:
            err_msg = repr(e)
            log.error(f"delete_graph:{graph_id_list} records failed: {err_msg}")

    @async_call
    def cancel_task_list(self, graph_id_list):
        """
        send async task to celery
        """
        url = "http://localhost:6488/task/intelligence/cancel_by_relation_id"
        headers = {
            'Content-Type': 'application/json',
        }
        param_json = dict()
        param_json['relation_id_list'] = graph_id_list

        try:
            response = requests.request("POST", url, headers=headers, data=json.dumps(param_json))
            if response.status_code != 200:
                raise Exception(str(response.text))
            return response.status_code, response.json()
        except Exception as e:
            err_msg = repr(e)
            log.error(err_msg)
            code = codes.Builder_IntelligenceCalculateService_CancelTaskList_AsyncTaskInternalError
            return code, Gview.error_return(code, detail=err_msg)

    def send_task(self, graph_id):
        """
        send async task to celery
        """

        # query graph status
        ret_code, resp = graph_Service.get_graph_info_basic(graph_id, False, ['status', 'graphdb_type'])
        if ret_code != codes.successCode:
            return ret_code, resp

        # only normal and failed status could be calculated
        graph_info = resp.json.get('res', {})
        graph_status = graph_info.get('status', '')
        graph_db_type = graph_info.get('graphdb_type', '')

        if graph_status != "normal" and graph_status != "failed":
            code = codes.Builder_IntelligenceCalculateService_SendTask_GraphInvalidStatusError
            if graph_status == 'edit' or graph_status == 'stop':
                code = codes.Builder_IntelligenceCalculateService_SendTask_GraphConfigStatusError
            if graph_status == 'running':
                code = codes.Builder_IntelligenceCalculateService_SendTask_GraphRunStatusError
            if graph_status == 'waiting':
                code = codes.Builder_IntelligenceCalculateService_SendTask_GraphWaitStatusError
            return code, Gview.error_return(code)
        if graph_status == 'failed' and graph_db_type == 'nebula':
            code = codes.Builder_IntelligenceCalculateService_SendTask_GraphFailStatusError
            return code, Gview.error_return(code)

        url = "http://localhost:6488/task/intelligence"
        headers = {
            'Content-Type': 'application/json',
        }
        param_json = dict()
        param_json['task_type'] = 'intelligence'
        param_json['relation_id'] = graph_id
        param_json['task_name'] = 'intelligence-{}'.format(graph_id)
        param_json['async_task_name'] = "cel.intelligence_calculate"
        # set cancel the previous task
        param_json['cancel_pre'] = True
        param_json['task_params'] = json.dumps({"graph_id": graph_id})

        try:
            response = requests.request("POST", url, headers=headers, data=json.dumps(param_json))
            if response.status_code != 200:
                code = codes.Builder_IntelligenceCalculateService_SendTask_AsyncTaskInternalError
                return code, Gview.error_return(code, detail=str(response.text))
            res_json = response.json()
            return response.status_code, res_json
        except Exception as e:
            err_msg = repr(e)
            log.error(err_msg)
            code = codes.Builder_IntelligenceCalculateService_SendTask_AsyncTaskInternalError
            return code, Gview.error_return(code, detail=err_msg)

    def graph_calculate_task(self, param_json):
        """
        for async service
        """
        if 'graph_id' not in param_json:
            raise Exception("invalid parameters")
        self.calculate_graph_intelligence(param_json['graph_id'])

    def add_graph_stats(self, graph_record, quality_dict):
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


class IntelligenceQueryService(object):

    def query_graph_intelligence(self, graph_id):
        """
        query graph intelligence info
        """
        try:
            graph_info = graph_dao.get_graph_detail(graph_id)
            if not graph_info:
                code = codes.Builder_IntelligenceQueryService_QueryGraphIntelligence_GraphNotExistsError
                return code, Gview.error_return(code, graph_id=graph_id)

            # add basic info
            graph_quality = dict()
            graph_quality['graph_id'] = graph_info['graph_id']
            graph_quality['graph_name'] = graph_info['graph_name']
            graph_quality['graph_config_id'] = graph_info['graph_config_id']
            graph_quality['update_time'] = graph_info['last_update_time']

            # query graph detail in GraphDB, if this graph is empty, return default response
            code, data = graph_Service.get_graph_info_count(graph_id)
            if code != codes.successCode:
                log.info(repr(data.json))
                return codes.successCode, self.default_graph_response(graph_info)
            count_info = data.json.get('res')
            # sum edge count
            edge_info_detail = count_info.get('edge', [])
            edge_count = 0
            edge_knowledge = 0
            for edge_info in edge_info_detail:
                edge_count += edge_info['count']
                edge_knowledge += edge_info['count'] * edge_info['prop_number']
            graph_quality['edge_count'] = edge_count

            # sum  entity
            entity_info_detail = count_info.get('entity', [])
            entity_count = 0
            entity_knowledge = 0
            for entity_info in entity_info_detail:
                entity_count += entity_info['count']
                entity_knowledge += entity_info['count'] * entity_info['prop_number']
            graph_quality['entity_count'] = entity_count

            # add last task info
            task_info_list = async_task_dao.query_latest_task([graph_quality['graph_id']])
            self.add_task_info(graph_quality, list(task_info_list))

            # add calculate info
            records = intelligence_dao.query([graph_info['graph_id']])
            record = records[0] if records else None
            self.add_graph_intelligence_info(graph_quality, record)

            total_knowledge = entity_knowledge + edge_knowledge
            graph_quality['total_knowledge'] = total_knowledge

            return codes.successCode, graph_quality
        except Exception as e:
            err_msg = repr(e)
            log.error(err_msg)
            code = codes.Builder_IntelligenceQueryService_QueryGraphIntelligence_QueryError
            return code, Gview.error_return(code, detail=err_msg)

    def query_network_intelligence(self, query_params: dict):
        """
        query network intelligence
        """
        try:
            knw_id = int(query_params.get('knw_id', 0))
            graph_name = query_params.get('graph_name', '')

            df = knw_dao.get_knw_by_id(knw_id)
            knw_info_list = df.to_dict('records')
            knw_info = knw_info_list[0]

            ret = knw_dao.get_graph_count(knw_id, graph_name)
            count = len(ret)

            if count == 0:
                return codes.successCode, Gview.json_return(self.default_network_response(knw_info, count))

            # query graph by name in page
            graph_score_list = self.query_graph_score_in_pages(query_params)
            if not graph_score_list:
                return codes.successCode, self.default_network_response(knw_info, count)
            graph_id_list = [info['graph_id'] for info in graph_score_list]

            # query graph detail info
            graph_detail_list = graph_dao.get_graph_detail(graph_id_list)
            graph_detail_dict = {graph_detail['graph_id']: graph_detail for graph_detail in graph_detail_list}

            # query graph intelligence task calculate record
            knw_intelligence = dict()
            task_info_list = async_task_dao.query_latest_task(graph_id_list)
            task_info_dict = {int(task_info['relation_id']): task_info for task_info in task_info_list}

            # start intelligence info statistic
            graph_intelligence_list = list()
            for graph_score in graph_score_list:
                # add graph basic info
                graph_info = graph_detail_dict.get(graph_score['graph_id'])
                graph_quality = dict()
                graph_quality['graph_id'] = graph_info['graph_id']
                graph_quality['graph_name'] = graph_info['graph_name']
                graph_quality['graph_config_id'] = graph_info['graph_config_id']
                graph_quality['update_time'] = graph_info['last_update_time']

                # add task status
                self.add_task_info(graph_quality, task_info_dict.get(graph_info['graph_id']))

                # add record info
                self.add_graph_intelligence_info(graph_quality, graph_score)
                graph_intelligence_list.append(graph_quality)

            knw_intelligence['id'] = int(knw_id)
            knw_intelligence['knw_name'] = knw_info["knw_name"]
            knw_intelligence['knw_description'] = knw_info["knw_description"]
            knw_intelligence['color'] = knw_info["color"]
            knw_intelligence['creation_time'] = knw_info["creation_time"]
            knw_intelligence['update_time'] = knw_info["update_time"]
            knw_intelligence['graph_intelligence_list'] = graph_intelligence_list
            knw_intelligence['total_graph'] = count
            score = knw_info.get('intelligence_score')
            if not score:
                score = 0
            knw_intelligence['intelligence_score'] = "{:.2f}".format(score)

            return codes.successCode, Gview.json_return(knw_intelligence)
        except Exception as e:
            err_msg = repr(e)
            log.error(err_msg)
            code = codes.Builder_IntelligenceQueryService_QueryNetworkIntelligence_QueryError
            return code, Gview.error_return(code, detail=err_msg)

    @classmethod
    def query_graph_onto_info(cls, graph_id):
        """
        query Ontology info,
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
            # merge edge and entity
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

    def default_graph_response(self, graph_info):
        res = dict()
        res['graph_id'] = graph_info['graph_id']
        res['graph_config_id'] = graph_info['graph_config_id']
        res['graph_name'] = graph_info['graph_name']
        res['calculate_status'] = 'NOT_CALCULATE'
        res['edge_knowledge'] = '-1.00'
        res['entity_knowledge'] = '-1.00'
        res['edge_count'] = '-1.00'
        res['entity_count'] = '-1.00'
        res['data_quality_B'] = '-1.00'
        res['total_knowledge'] = '-1.00'
        res['last_task_message'] = ''
        res['last_task_time'] = ''
        res['data_repeat_C1'] = '-1.00'
        res['data_empty_C2'] = '-1.00'
        res['data_quality_B'] = '-1.00'
        res['data_quality_score'] = '-1.00'
        return res

    def default_network_response(self, knw_info, total):
        data = dict()
        data.update(knw_info)
        data['intelligence_score'] = '{:.2f}'.format(knw_info.get('intelligence_score', -1))
        data['graph_intelligence_list'] = []
        data['total_graph'] = total
        return data

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

        rule = query_params.get('rule', '')
        if rule and rule not in ('data_quality_B', 'update_time', 'data_quality_score'):
            rule == ''

        order = query_params.get('order', '')
        if order and order not in ('desc', 'asc'):
            order == ''

        graph_score_list = intelligence_dao.query_in_page(query_params)
        return graph_score_list

    def add_graph_intelligence_info(self, graph_quality, record):
        """
        根据图谱信息，给出合适的智商信息
        """
        if not record or not record['id']:
            graph_quality['data_quality_B'] = '-1.00'
            graph_quality['total_knowledge'] = '-1.00'
            graph_quality['data_repeat_C1'] = '-1.00'
            graph_quality['data_empty_C2'] = '-1.00'
            graph_quality['data_quality_B'] = '-1.00'
            graph_quality['data_quality_score'] = '-1.00'
            return
        total_knowledge = record.get('total_knowledge', 0)
        if int(total_knowledge) == 0:
            graph_quality['data_repeat_C1'] = "0.00"
            graph_quality['data_empty_C2'] = "0.00"
            graph_quality['data_quality_B'] = "0.00"
            graph_quality['total_knowledge'] = '0.00'
            graph_quality['data_quality_score'] = "0.00"
        else:
            graph_quality['data_repeat_C1'] = "{:.2f}".format(record.get('repeat_number', 0) / total_knowledge)
            graph_quality['data_empty_C2'] = "{:.2f}".format(record.get('empty_number', 0) / total_knowledge)
            graph_quality['data_quality_B'] = "{:.2f}".format(math.log(record.get('total_knowledge', 0), 10) * 10)
            graph_quality['total_knowledge'] = total_knowledge
            graph_quality['data_quality_score'] = "{:.2f}".format(float(record.get('data_quality_score', 0)))

    def add_task_info(self, graph_quality, task_info_list):
        """
        添加最后一次任务信息
        """

        if not task_info_list:
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

    def check_uint(self, graph_id):
        if not graph_id:
            return False
        try:
            graph_id = int(graph_id)
            if graph_id <= 0:
                return False
            return True
        except:
            return False

    def query_network_param_check(self, params_json):
        result = dict()
        knw_id = params_json.get("knw_id")

        if not self.check_uint(knw_id):
            code = codes.Builder_KnowledgeNetworkController_IntelligenceStats_ParamError
            result['arg'] = 'knw_id'
            return code, result

        df = knw_dao.check_knw_id(knw_id)
        res = df.to_dict('records')
        if len(res) == 0:
            code = codes.Builder_IntelligenceQueryService_QueryNetworkIntelligence_KnwNotExist
            result['knw_id'] = int(knw_id)
            return code, result

        size = params_json.get('size')
        page = params_json.get('page')
        rule = params_json.get('rule')
        order = params_json.get('order')

        if not self.check_uint(size):
            code = codes.Builder_KnowledgeNetworkController_IntelligenceStats_ParamError
            result['arg'] = 'size'
            return code, result

        if int(size) > 100:
            code = codes.Builder_KnowledgeNetworkController_IntelligenceStats_ParamTooBigError
            result['arg'] = 'size'
            result['max'] = 100
            return code, result

        if not self.check_uint(page):
            code = codes.Builder_KnowledgeNetworkController_IntelligenceStats_ParamError
            result['arg'] = 'page'
            return code, result

        if not rule or not isinstance(rule, str):
            code = codes.Builder_KnowledgeNetworkController_IntelligenceStats_ParamError
            result['arg'] = 'rule'
            return code, result

        rule_allowed = ('data_quality_B', 'update_time', 'data_quality_score')
        if rule not in rule_allowed:
            code = codes.Builder_KnowledgeNetworkController_IntelligenceStats_NotAllowedParamError
            result['arg'] = 'rule'
            result['allowed'] = ','.join(rule_allowed)
            return code, result

        if not order or not isinstance(order, str):
            code = codes.Builder_KnowledgeNetworkController_IntelligenceStats_ParamError
            result['arg'] = 'order'
            return code, result
        order_allowed = ('desc', 'asc')
        if order not in order_allowed:
            code = codes.Builder_KnowledgeNetworkController_IntelligenceStats_NotAllowedParamError
            result['arg'] = 'order'
            result['allowed'] = ','.join(order_allowed)
            return code, result
        return codes.successCode, result

    def intelligence_calculate_test(self, params_json, task_id):
        if not task_id:
            # 没有关键参数 task_id， 直接退出
            log.error("missing important argument [task_id] please check your argument list")
            return
        try:
            update_json = dict()
            # 停止之前运行中的任务
            if params_json.get('cancel_pre'):
                async_task_service.delete_pre_running_task(params_json['task_type'], task_id,
                                                           params_json['relation_id'])
            # 获取执行参数
            task_params = json.loads(params_json.get('task_params', '{}'))
            intelligence_calculate_service.graph_calculate_task(task_params)

            update_json['task_status'] = 'finished'
            return {'current': 100, 'total': 100}
        except BaseException as e:
            import traceback
            traceback.print_exc()
            update_json['result'] = str(e)
            update_json['task_status'] = 'failed'
            log.error(update_json['result'])
        finally:
            # 此处只需要更新下错误原因即可，状态由外部调用更新
            update_json['finished_time'] = datetime.datetime.now()
            async_task_service.update(task_id, update_json)
            return {'current': 100, 'total': 100}


intelligence_query_service = IntelligenceQueryService()
intelligence_calculate_service = IntelligenceCalculateService()

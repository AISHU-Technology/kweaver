# -*- coding:utf-8 -*-
from dao.graph_dao import graph_dao
from dao.otl_dao import otl_dao
from dao.subgraph_dao import subgraph_dao
from dao.task_dao import task_dao
from utils.log_info import Logger


class BatchTaskParamProcessor():
    '''process graph configuration for batch tasks'''

    def __init__(self, graph_id):
        self.graph_id = graph_id
        # get task info
        task_info = task_dao.gettaskbyid(graph_id)[0]
        successful_subgraph = task_info['successful_subgraph']
        self.subgraph_id = task_info['current_subgraph_id']
        write_mode = task_info['write_mode']
        self.is_batch = (self.subgraph_id > 0)

        self.successful_model = set()
        if successful_subgraph:
            successful_subgraph = eval(successful_subgraph)
            message = 'successful_subgraph = {}'.format(successful_subgraph)
            Logger.log_info(message)
            for entity in successful_subgraph['entity']:
                if 'model' in entity['model'].lower():
                    self.successful_model.add(entity['model'])
            for edge in successful_subgraph['edge']:
                if 'model' in edge['model'].lower():
                    self.successful_model.add(edge['model'])

        self.entity_names = []
        self.edge_relations = []
        self.edge_names = []
        # new_ontology: 需要执行构建任务的本体
        self.new_ontology = {'entity': [], 'edge': []}
        # skip_ontology: 在当前分组中但前面的分组已执行过任务，本次构建不需要执行任务，只记录任务记录
        self.skip_ontology = {'entity': [], 'edge': []}
        if self.is_batch:
            self._get_subgraph(successful_subgraph, write_mode)

    def _get_subgraph(self, successful_subgraph, write_mode):
        '''Get the subgraph modified by the ontology and the successful subgraph.

        Returns
            new_ontology: 本次分组中需要构建的点与关系。
                entity: schema和数据都需要构建
                edge： 数据需要构建，schema可能已在之前的分组中构建过了，具体是否需要构建schema由edge_names来决定
            edge_names: 需要构造schema的关系类名
        '''
        # get subgraph info
        subgraph_config = subgraph_dao.get_subgraph_config_by_id(self.subgraph_id)[0]
        subgraph_entity_names, subgraph_edge_relations, subgraph_edge_names = [], [], []
        for a_subgraph_entity in eval(subgraph_config['entity']):
            subgraph_entity_names.append(a_subgraph_entity['name'])
        for a_subgraph_edge in eval(subgraph_config['edge']):
            subgraph_edge_relations.append(a_subgraph_edge['relations'])
            subgraph_edge_names.append(a_subgraph_edge['name'])
        # get ontology info
        ontology_id = graph_dao.getbyid(self.graph_id)[0]['graph_otl']
        ontology = otl_dao.getbyid(ontology_id)[0]
        # get successful subgraph info
        successful_entity_names, successful_edge_relations, successful_edge_names = [], [], []
        if successful_subgraph and write_mode == 'skip':
            for a_successful_entity in successful_subgraph.get('entity'):
                successful_entity_names.append(a_successful_entity['name'])
            for a_successful_edge in successful_subgraph.get('edge'):
                successful_edge_relations.append(a_successful_edge['relations'])
                successful_edge_names.append(a_successful_edge['name'])
        # modify the subgraph according to the ontology and the successful subgraph
        for a_ontology_entity in eval(ontology['entity']):
            if a_ontology_entity['name'] in subgraph_entity_names:
                # 实际需要运行任务的实体类
                if a_ontology_entity['name'] not in successful_entity_names:
                    self.entity_names.append(a_ontology_entity['name'])
                    self.new_ontology['entity'].append(a_ontology_entity)
                # 不需要运行任务，但需插入一条任务记录
                else:
                    self.skip_ontology['entity'].append(a_ontology_entity)
        for a_ontology_edge in eval(ontology['edge']):
            if a_ontology_edge['relations'] in subgraph_edge_relations:
                # 实际需要运行任务的关系类
                if a_ontology_edge['relations'] not in successful_edge_relations:
                    self.edge_relations.append(a_ontology_edge['relations'])
                    self.new_ontology['edge'].append(a_ontology_edge)
                # 不需要运行任务，但需插入一条任务记录
                else:
                    self.skip_ontology['edge'].append(a_ontology_edge)
            # 需要创建schema的边类
            if (a_ontology_edge['name'] in subgraph_edge_names and
                    a_ontology_edge['name'] not in successful_edge_names):
                self.edge_names.append(a_ontology_edge['name'])

    def process(self, graph_otl, graph_KMap):
        '''process graph configuration to fit the subgraph configuration
        Returns:
            new_ontology: 本次分组中需要构建的点与关系。
                entity: schema和数据都需要构建
                edge： 数据需要构建，schema可能已在之前的分组中构建过了，具体是否需要构建schema由edge_names来决定
            edge_names: 需要构造schema的关系类名
            subgraph_KMap: KMap information of filtered subgraph
        '''
        if not self.is_batch:
            edge_names = []
            for a_subgraph_edge in graph_otl['edge']:
                edge_names.append(a_subgraph_edge['name'])
            return graph_otl, list(set(edge_names)), graph_KMap
        subgraph_KMap = self._process_graph_KMap(graph_KMap, graph_otl)
        return self.new_ontology, self.edge_names, subgraph_KMap

    def _process_graph_KMap(self, graph_KMap, graph_otl):
        # otl_mode: {实体类名/关系类名: 实体类/关系类所属模型}
        otl_model = {}
        for entity in graph_otl['entity']:
            otl_model[entity['name']] = entity['model']
        for edge in graph_otl['edge']:
            otl_model[edge['name']] = edge['model']
        subgraph_entity, subgraph_edge, subgraph_file = [], [], []
        # entity_types 除模型外的实体类/关系类映射的entity_type
        entity_types = set()
        for entity in graph_KMap.get('entity', []):
            if entity['name'] in self.entity_names:
                subgraph_entity.append(entity)
                if otl_model[entity['name']] not in self.successful_model:
                    entity_types.add(entity['entity_type'])
        for edge in graph_KMap.get('edge', []):
            if edge['relations'] in self.edge_relations:
                subgraph_edge.append(edge)
                if otl_model[edge['relations'][1]] not in self.successful_model:
                    entity_types.add(edge['entity_type'])
        for file in graph_KMap.get('files', []):
            for extract_rule in file['extract_rules']:
                if extract_rule['entity_type'] in entity_types:
                    subgraph_file.append(file)
                    break
        subgraph_KMap = {
            'entity': subgraph_entity,
            'edge': subgraph_edge,
            'files': subgraph_file
        }
        return subgraph_KMap

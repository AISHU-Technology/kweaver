# -*- coding:utf-8 -*-
from dao.task_dao import task_dao
from dao.subgraph_dao import subgraph_dao
from dao.graph_dao import graph_dao
from dao.otl_dao import otl_dao
import copy


class BatchTaskParamProcessor():
    '''process graph configuration for batch tasks'''
    def __init__(self, graph_id):
        self.graph_id = graph_id
        # get task info
        task_info = task_dao.gettaskbyid(graph_id).to_dict('records')[0]
        successful_subgraph = task_info['successful_subgraph']
        self.subgraph_id = task_info['current_subgraph_id']
        write_mode = task_info['write_mode']
        self.is_batch = (self.subgraph_id > 0)

        self.successful_model = set()
        print('successful_subgraph000')
        print(successful_subgraph)
        if successful_subgraph:
            print('successful_subgraph111')
            print(successful_subgraph)
            successful_subgraph = eval(successful_subgraph)
            print('successful_subgraph222')
            print(successful_subgraph)
            for entity in successful_subgraph['entity']:
                if 'model' in entity['model'].lower():
                    self.successful_model.add(entity['model'])
            for edge in successful_subgraph['edge']:
                if 'model' in edge['model'].lower():
                    self.successful_model.add(edge['model'])

        if self.is_batch:
            self.entity_names, self.edge_relations, self.edge_names \
                = self._get_subgraph(successful_subgraph, write_mode)

    def _get_subgraph(self, successful_subgraph, write_mode):
        '''Get the subgraph modified by the ontology and the successful subgraph.

        Returns
            entity_names: the entity names of filtered subgraph
            edge_relations: the edge relations of filtered subgraph
            edge_names: the edge names of filtered subgraph
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
        ontology_id = eval(graph_dao.getbyid(self.graph_id).to_dict('records')[0]['graph_otl'])[0]
        ontology = otl_dao.getbyid(ontology_id).to_dict('records')[0]
        # get successful subgraph info
        successful_entity_names, successful_edge_relations, successful_edge_names = [], [], []
        if successful_subgraph and write_mode == 'skip':
            for a_successful_entity in successful_subgraph.get('entity'):
                successful_entity_names.append(a_successful_entity['name'])
            for a_successful_edge in successful_subgraph.get('edge'):
                successful_edge_relations.append(a_successful_edge['relations'])
                successful_edge_names.append(a_successful_edge['name'])
        # modify the subgraph according to the ontology and the successful subgraph
        entity_names, edge_relations, edge_names = [], [], []
        for a_ontology_entity in eval(ontology['entity']):
            if (a_ontology_entity['name'] in subgraph_entity_names and
                    a_ontology_entity['name'] not in successful_entity_names):
                entity_names.append(a_ontology_entity['name'])
        for a_ontology_edge in eval(ontology['edge']):
            if (a_ontology_edge['relations'] in subgraph_edge_relations and
                    a_ontology_edge['relations'] not in successful_edge_relations):
                edge_relations.append(a_ontology_edge['relations'])
            if (a_ontology_edge['name'] in subgraph_edge_names and
                    a_ontology_edge['name'] not in successful_edge_names):
                edge_names.append(a_ontology_edge['name'])
        return entity_names, edge_relations, list(set(edge_names))

    def process(self, graph_otl, graph_InfoExt, graph_KMap, graph_KMerge):
        '''process graph configuration to fit the subgraph configuration
        Returns:
            entity_names: entities that need to be built
            edge_relations: edge relations that need to be built
            edge_names: edge names that need to be built
            subgraph_InfoExt: extraction information that need to be extracted
            entity_types: extraction object that need to be extracted.
        '''
        if not self.is_batch:
            entity_names, edge_relations, edge_names = [], [], []
            for a_subgraph_entity in graph_otl['entity']:
                entity_names.append(a_subgraph_entity['name'])
            for a_subgraph_edge in graph_otl['edge']:
                edge_relations.append(a_subgraph_edge['relations'])
                edge_names.append(a_subgraph_edge['name'])
            return entity_names, edge_relations, list(set(edge_names)), graph_InfoExt, {}
        subgraph_KMap, entity_types = self._process_graph_KMap(graph_KMap, graph_otl)
        subgraph_InfoExt = self._process_graph_InfoExt(graph_InfoExt, entity_types)
        return self.entity_names, self.edge_relations, self.edge_names, subgraph_InfoExt, entity_types

    def _process_graph_KMerge(self, graph_KMerge):
        subgraph_KMerge = copy.deepcopy(graph_KMerge)
        subgraph_entity_classes = []
        for entity_class in graph_KMerge[0]['entity_classes']:
            if entity_class['name'] in self.entity_names:
                subgraph_entity_classes.append(entity_class)
        subgraph_KMerge[0]['entity_classes'] = subgraph_entity_classes
        return subgraph_KMerge

    def _process_graph_KMap(self, graph_KMap, graph_otl):
        subgraph_KMap = copy.deepcopy(graph_KMap)
        subgraph_otls_map, subgraph_rlations_map = [], []
        entity_types = set()  # used to filter graph_InfoExt
        otl_model = {}
        for entity in graph_otl['entity']:
            otl_model[entity['name']] = entity['model']
        for edge in graph_otl['edge']:
            otl_model[edge['name']] = edge['model']
        for otl_map in graph_KMap[0]['otls_map']:
            if otl_map['otl_name'] in self.entity_names:
                subgraph_otls_map.append(otl_map)
                if otl_model[otl_map['otl_name']] not in self.successful_model:
                    entity_types.add(otl_map['entity_type'])
        for relation_map in graph_KMap[0]['relations_map']:
            relation = [relation_map['relation_info']['begin_name'],
                        relation_map['relation_info']['edge_name'],
                        relation_map['relation_info']['end_name']]
            if relation in self.edge_relations:
                subgraph_rlations_map.append(relation_map)
                relation_info = relation_map['relation_info']
                if otl_model[relation_info['edge_name']] not in self.successful_model:
                    entity_types.add(relation_info['entity_type'])
        subgraph_KMap[0]['otls_map'] = subgraph_otls_map
        subgraph_KMap[0]['relations_map'] = subgraph_rlations_map
        return subgraph_KMap, entity_types

    def _process_graph_InfoExt(self, graph_InfoExt, entity_types):
        subgraph_InfoExt = []
        for file in graph_InfoExt:
            if file['extract_type'] == 'standardExtraction':
                if file['extract_rules'][-1]['entity_type'] in entity_types:
                    subgraph_InfoExt.append(file)
            else:
                for extract_rule in file['extract_rules']:
                    if extract_rule['entity_type'] in entity_types:
                        subgraph_InfoExt.append(file)
                        break
        return subgraph_InfoExt
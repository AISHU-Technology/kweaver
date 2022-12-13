# -*- coding:utf-8 -*-
from common.errorcode import codes
from common.errorcode.gview import Gview
from dao.graph_dao import graph_dao
from dao.subgraph_dao import subgraph_dao
from dao.otl_dao import otl_dao
from service.graph_Service import graph_Service
from utils.common_response_status import CommonResponseStatus
from flask_babel import gettext as _l

class SubgraphService():
    def create_subgraph_config(self, params):
        name = params.get('name')
        entity = params.get('entity')
        edge = params.get('edge')
        ontology_id = params.get('ontology_id')
        graph_id = params.get('graph_id')
        # check whether graph_id exists
        graph_info = graph_dao.getbyid(graph_id).to_dict('records')
        if len(graph_info) == 0:
            code = codes.Builder_SubgraphService_CreateSubgraphConfig_GraphIdNotExist
            return code, Gview.error_return(code, graph_id=graph_id)
        # check whether the graph is running
        code, res = graph_Service.getrunbygraphid(str(graph_id))
        if code != CommonResponseStatus.SUCCESS.value:
            code = codes.Builder_SubgraphService_CreateSubgraphConfig_GraphRunning
            return code, Gview.error_return(code)
        # check whether ontology id exists
        graph_ontology_id = eval(graph_info[0]['graph_otl'])
        if ontology_id not in graph_ontology_id:
            code = codes.Builder_SubgraphService_CreateSubgraphConfig_OntologyNotExist
            return code, Gview.error_return(code, ontology_id=ontology_id)
        # check whether the name is duplicate
        subgraph_list = subgraph_dao.get_subgraph_list_by_graph_id(graph_id)
        for a_subgraph in subgraph_list:
            if a_subgraph['name'] == name:
                code = codes.Builder_SubgraphService_CreateSubgraphConfig_DuplicateName
                return code, Gview.error_return(code, name=name)
        # check whether entity and edge is valid
        ontology = otl_dao.getbyid(ontology_id).to_dict('records')[0]
        ontology_entity = eval(ontology['entity'])
        ontology_edge = eval(ontology['edge'])
        unexpected_entity, unexpected_edge = [], []
        for a_entity in entity:
            if a_entity not in ontology_entity:
                unexpected_entity.append(a_entity['name'])
        for a_edge in edge:
            if a_edge not in ontology_edge:
                unexpected_edge.append(a_edge['name'])
        unexpected_message = ''
        if unexpected_entity:
            unexpected_message += _l('entity {} not in the ontology. '.format(','.join(unexpected_entity)))
        if unexpected_edge:
            unexpected_message += _l('edge {} not in the ontology. '.format(','.join(unexpected_edge)))
        if unexpected_message:
            code = codes.Builder_SubgraphService_CreateSubgraphConfig_UnexpectedClass
            return code, Gview.error_return(code, message=unexpected_message)
        # insert subgraph configuration
        new_id = subgraph_dao.insert_subgraph_config(params)
        return codes.successCode, {'message': 'create subgraph {} success.'.format(new_id), 'subgraph_id': new_id}

    def edit_subgraph_config(self, graph_id, params):
        # check whether graph_id exists
        graph_info = graph_dao.getbyid(graph_id).to_dict('records')
        if len(graph_info) == 0:
            code = codes.Builder_SubgraphService_EditSubgraphConfig_GraphIdNotExist
            return code, Gview.error_return(code, graph_id=graph_id)
        # check whether the graph is running
        code, res = graph_Service.getrunbygraphid(str(graph_id))
        if code != CommonResponseStatus.SUCCESS.value:
            code = codes.Builder_SubgraphService_EditSubgraphConfig_GraphRunning
            return code, Gview.error_return(code)
        graph_subgraph = subgraph_dao.get_subgraph_list_by_graph_id(graph_id)
        graph_subgraph_list = {}
        ungrouped_subgraph_id = 0
        for a_subgraph in graph_subgraph:
            graph_subgraph_list[a_subgraph['id']] = a_subgraph['name']
            if a_subgraph['name'] in ['未分组', 'ungrouped']:
                ungrouped_subgraph_id = a_subgraph['id']
        ontology_id = eval(graph_info[0]['graph_otl'])[0]
        ontology = otl_dao.getbyid(ontology_id).to_dict('records')[0]
        ontology_entity = eval(ontology['entity'])
        ontology_edge = eval(ontology['edge'])
        failed_ids = {'CannotRenamedToUngrouped': [], 'SubgraphIdNotExist': [], 'UngroupedCannotRename': [],
                      'DuplicateName': [], 'UnexpectedClass': []}
        successful_ids = []
        for subgraph_config in params:
            subgraph_id = subgraph_config.get('subgraph_id')
            name = subgraph_config.get('name')
            entity = subgraph_config.get('entity', [])
            edge = subgraph_config.get('edge', [])
            # group cannot be renamed to ungrouped, 未分组
            if name in ['未分组', 'ungrouped'] and subgraph_id != ungrouped_subgraph_id:
                failed_ids['CannotRenamedToUngrouped'].append(subgraph_id)
                continue
            # check whether subgraph_id exists
            if subgraph_id not in graph_subgraph_list.keys():
                failed_ids['SubgraphIdNotExist'].append(subgraph_id)
                continue
            # ungrouped cannot rename
            if subgraph_id == ungrouped_subgraph_id and name not in ['未分组', 'ungrouped']:
                failed_ids['UngroupedCannotRename'].append(subgraph_id)
                continue
            # check whether name is duplicate
            if name != graph_subgraph_list[subgraph_id] and name in graph_subgraph_list.values():
                failed_ids['DuplicateName'].append((subgraph_id, name))
                continue
            # check whether entity and edge are in the ontology
            unexpected_entity, unexpected_edge = [], []
            for a_entity in entity:
                if a_entity not in ontology_entity:
                    unexpected_entity.append(a_entity['name'])
            for a_edge in edge:
                if a_edge not in ontology_edge:
                    unexpected_edge.append(a_edge['name'])
            unexpected_message = ''
            if unexpected_entity:
                unexpected_message += _l('entity {} not in the ontology. '.format(','.join(unexpected_entity)))
            if unexpected_edge:
                unexpected_message += _l('edge {} not in the ontology. '.format(','.join(unexpected_edge)))
            if unexpected_message:
                unexpected_message = _l('subgraph id {} has unexpected classes: '.format(subgraph_id)) + unexpected_message
                failed_ids['UnexpectedClass'].append(unexpected_message)
                continue
            subgraph_dao.update_subgraph_config(subgraph_config)
            successful_ids.append(subgraph_id)
        res = {}
        if successful_ids:
            res['res'] = 'edit subgraph {} success. '.format(successful_ids)
        error = []
        if failed_ids['CannotRenamedToUngrouped']:
            code = codes.Builder_SubgraphService_EditSubgraphConfig_CannotRenamedToUngrouped
            error.append(
                Gview.error_return(code, subgraph_id=str(failed_ids['CannotRenamedToUngrouped'])).json)
        if failed_ids['SubgraphIdNotExist']:
            code = codes.Builder_SubgraphService_EditSubgraphConfig_SubgraphIdNotExist
            error.append(
                Gview.error_return(code, subgraph_id=str(failed_ids['SubgraphIdNotExist'])).json)
        if failed_ids['UngroupedCannotRename']:
            code = codes.Builder_SubgraphService_EditSubgraphConfig_UngroupedCannotRename
            error.append(
                Gview.error_return(code, subgraph_id=str(failed_ids['UngroupedCannotRename'])).json)
        if failed_ids['DuplicateName']:
            code = codes.Builder_SubgraphService_EditSubgraphConfig_DuplicateName
            error.append(
                Gview.error_return(code, items=str(failed_ids['DuplicateName'])).json)
        if failed_ids['UnexpectedClass']:
            code = codes.Builder_SubgraphService_EditSubgraphConfig_UnexpectedClass
            error.append(
                Gview.error_return(code, message=str(failed_ids['UnexpectedClass'])).json)
        if len(error) > 0:
            res['error'] = error
            return 500, res
        return codes.successCode, res

    def get_subgraph_list(self, params):
        res = []
        graph_id = params.get('graph_id')
        subgraph_name = params.get('subgraph_name')
        if subgraph_name and subgraph_name in '未分组':
            subgraph_name += '|ungrouped'
        return_all = params.get('return_all', 'False')
        graph_info = graph_dao.getbyid(graph_id).to_dict('records')
        if len(graph_info) == 0:
            code = codes.Builder_SubgraphService_GetSubgraphList_GraphIdNotExist
            return code, Gview.error_return(code, graph_id=graph_id)
        subgraphs = subgraph_dao.get_subgraph_list(graph_id, subgraph_name)
        for subgraph in subgraphs:
            entity = eval(subgraph['entity'])
            edge = eval(subgraph['edge'])
            subgraph_dict = {'id': subgraph['id'], 'name': subgraph['name'], 'entity_num': len(entity),
                             'edge_num': len(edge)}
            if return_all == 'True':
                subgraph_dict['entity'] = entity
                subgraph_dict['edge'] = edge
            res.append(subgraph_dict)
        return codes.successCode, res

    def get_subgraph_config(self, subgraph_id):
        subgraphs = subgraph_dao.get_subgraph_config_by_id(subgraph_id)
        if len(subgraphs) == 0:
            code = codes.Builder_SubgraphService_GetSubgraphConfig_SubgraphIdNotExist
            return code, Gview.error_return(code, subgraph_id=subgraph_id)
        subgraph = subgraphs[0]
        entity = eval(subgraph['entity'])
        edge = eval(subgraph['edge'])
        res = {'id': subgraph['id'], 'name': subgraph['name'], 'entity_num': len(entity),
               'entity': entity, 'edge_num': len(edge), 'edge': edge}
        return codes.successCode, res

    def delete_subgraph_config(self, graph_id, subgraph_ids):
        # check graph status
        graph_info = graph_dao.get_knowledge_graph_by_id(graph_id).to_dict('records')
        if len(graph_info) == 0:
            code = codes.Builder_SubgraphService_DeleteSubgraphConfig_GraphIdNotExist
            return code, Gview.error_return(code, graph_id=graph_id)
        graph_info = graph_info[0]
        status = graph_info.get('status')
        if status == 'running':
            code = codes.Builder_SubgraphService_DeleteSubgraphConfig_GraphRunning
            return code, Gview.error_return(code)
        elif status == 'waiting':
            code = codes.Builder_SubgraphService_DeleteSubgraphConfig_GraphWaiting
            return code, Gview.error_return(code)

        graph_subgraphs = subgraph_dao.get_subgraph_list_by_graph_id(graph_id)
        graph_subgraph_ids = []
        ungrouped_id = []
        for a_graph_subgraph in graph_subgraphs:
            graph_subgraph_ids.append(a_graph_subgraph['id'])
            if a_graph_subgraph['name'] in ['未分组', 'ungrouped']:
                ungrouped_id.append(a_graph_subgraph['id'])
        # subgraph ids that cannot be deleted successfully
        failed_ids = {'ungrouped': set(subgraph_ids) & set(ungrouped_id),
                      'nonexistent_ids': set(subgraph_ids) - set(graph_subgraph_ids)}
        subgraph_ids = list(set(subgraph_ids) - failed_ids['ungrouped'] - failed_ids['nonexistent_ids'])

        res = {}
        if subgraph_ids:
            subgraph_dao.delete_subgraph_config(subgraph_ids)
            res['res'] = 'delete subgraph {} success'.format(subgraph_ids)
        error = []
        if failed_ids['ungrouped']:
            code = codes.Builder_SubgraphService_DeleteSubgraphConfig_DeleteUngrouped
            error.append(Gview.error_return(code, subgraph_id=str(failed_ids['ungrouped'])).json)
        if failed_ids['nonexistent_ids']:
            code = codes.Builder_SubgraphService_DeleteSubgraphConfig_SubgraphIdNotExist
            error.append(Gview.error_return(code, subgraph_id=str(failed_ids['nonexistent_ids'])).json)
        if len(error) > 0:
            res['error'] = error
            return 500, res
        return codes.successCode, res


subgraph_service = SubgraphService()

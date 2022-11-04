from typing import Iterable


class GraphSearchEngine:
    def __init__(self, graph_connector=None):
        self.graph_connector = graph_connector

    def connect_graph_db(self, ips, ports, user, password):
        self.graph_connector = self.graph_connector(ips, ports, user, password)

    def set_graph_connector_and_get_graph(self, graph_connector, ips, ports, user, password):
        self.graph_connector = graph_connector
        self.connect_graph_db(ips, ports, user, password)

    def entity_mention_extractor(self, query) -> Iterable:
        '''Extract entity mentions from query.'''
        raise NotImplementedError

    def entity_link_function(self, entity_metions) -> Iterable:
        '''Link entity mentions to entities in graph'''
        raise NotImplementedError

    def intent_recognizer(self, query, graph_type, entities):
        '''Find which graph space to search and which search action to act.Return [(space_name:str,search_function)...]'''
        raise NotImplementedError

    def search(self, query: str, **kwargs):
        entity_metions = self.entity_mention_extractor(query)
        entities = self.entity_link_function(entity_metions)
        kwargs.update({'input_entities': entities})
        if self.graph_connector is None:
            raise ValueError('Graph not ready')
        space_name, intent_search_function = self.intent_recognizer(query, 'normal_graph')
        if callable(intent_search_function):
            search_result = intent_search_function(self.graph_connector, space_name, **kwargs)
        else:
            raise ValueError('intent_search_function not callable')
        return search_result

# -*- coding: utf-8 -*-


import logging
from typing import Dict, Iterable, Union, Any, List, Optional
from dataclasses import dataclass
from enum import Enum

# define const variable

#: logger
logger = logging.getLogger(__name__)
#: all vertex type
ALL_VERTEX_TYPE = '*'


@dataclass
class Vertex:
    """
    describe a vertex
    """
    vid: Union[str, int]
    vertex_type: str
    # vertex props mapping
    props: Optional[Dict[str, Any]]


@dataclass
class Edge:
    """
    describe a edge
    """
    edge_type: str
    # edge props mapping
    props: Dict[str, Any]
    source: Vertex
    destination: Vertex


@dataclass
class Path:
    value: Vertex
    edge_type: str
    # edge props mapping
    props: Dict[str, Any]
    next: 'Path'

@dataclass
class SubGraph:
    # all nodes in path
    vertexes: List[Vertex]
    # all relationship in path
    edges: List[Edge]

class TagType(str, Enum):
    VERTEX = 'VERTEX'
    EDGE = 'EDGE'


class DIRECTION(str, Enum):
    POSITIVE = 'POSITIVE'
    REVERSELY = 'REVERSELY'
    BIDIRECT = 'BIDIRECT'

class PathPattern(str, Enum):
    ALL = 'ALL'
    SHORTEST = 'SHORTEST'

class OperateEnum(str, Enum):
    EQ = "=="
    GT = ">"
    GTE = ">="
    LT = "<"
    LTE = "<="
    IN = "IN"
    NOT_IN = "NOT IN"
    IS_NULL = 'IS NULL'
    IS_NOT_NULL = 'IS NOT NULL'
    IS_EMPTY = 'IS EMPTY'
    IS_NOT_EMPTY = 'IS NOT EMPTY'


@dataclass
class Statement:
    property: str
    value: Any
    operate: OperateEnum

    def __post_init__(self):
        # check value is iterable
        if self.operate in (OperateEnum.IN, OperateEnum.NOT_IN):
            if not isinstance(self.value, Iterable):
                raise InvalidTypeException(f'value:{self.value}')


class EngineSDKException(Exception):
    """
    search engine sdk base exception
    """

    def __init__(self, message: str = ''):
        super().__init__()

        self.message = message


class EmptySearchException(EngineSDKException):
    """
    Search for empty condition exception
    """
    pass


class InvalidTypeException(EngineSDKException):
    """
    param type invalid exception
    """
    pass


class GraphSearch:

    def vid_search(
            self, graph_connector, space_name: str, vid: List[str], vertex_types: List[str]
    ) -> List[Vertex]:
        """
        Retrieve the nodes in the graph, through the designated node type and node id

        Args:
            :param graph_connector: graph db connector
            :param space_name: graph db space name
            :param vertex_types: graph db vertex vertex type list
            :param vid: the list of retrieve the node ids
            :return: List[Vertex]

        Return:
            List[Vertex]
        """
        raise NotImplementedError

    def search_entities(
            self, graph_connector, space_name: str, vertex_type: str, statements: List[Statement]
    ) -> List[Vertex]:
        """
        Retrieve the nodes in the graph, through the designated node type and some statements

        Args:
            :param graph_connector: graph db connector
            :param space_name: graph db space name
            :param vertex_type: node type
            :param statements: node properties statements, optional
            :return: List[Vertex]

        Return:
            List[Vertex]
        """
        raise NotImplementedError

    def search_edges(
            self, graph_connector, space_name: str, edge_type: str, statements: List[Statement]
    ) -> List[Edge]:
        """
        Retrieve the edges in the graph, through the designated edge type and some statements

        Args:
            :param graph_connector: graph db connector
            :param space_name: graph db space name
            :param vertex_type: edge type
            :param statements: edge properties statements, optional
            :return: List[Edge]

        Return:
            List[Edge]
        """
        raise NotImplementedError

    def find_final_objective(
            self, graph_connector, space: str, final_objective_vertex_type: List[str], start_vid: List[str],
            edge_types: List[str], max_depth_limit: int
    ) -> List[Vertex]:
        """
        Find the tree structure of a root node within the maximum depth of leaf nodes. Can specify the query edge type
        and leaf node types, eventually return to a leaf node entities

        Args:
            :param graph_connector: graph db connector
            :param space: graph database name
            :param final_objective_vertex_type: the leaf node type
            :param start_vid: root node id of the query
            :param edge_types: the set of edge type
            :param max_path_length: maximum depth for query
            :return: List[Vertex]

        Return:
            List(Vertex)
        """
        raise NotImplementedError

    def find_neighbours(
            self, graph_connector, space: str, input_entities: List[Vertex],
            edge_types: List[str],
            invalidate_target_entity_types: List[str], max_path_lenth: int
    ) -> List[Vertex]:
        '''
        Query node set of adjacent nodes, can filter the query through the edge type sets and
        remove the invalid categories of target nodes, and finally returned to remove their own collection of nodes

        Args:
            :param graph_connector: graph db connector
            :param space: graph database name
            :param input_entities: the set of node ids to query
            :param edge_types: the query through the edge type sets
            :param invalidate_target_entity_types: exclude passing node type sets
            :param max_path_length: maximum depth for query
            :return: List[Vertex]

        Return:
            List(Vertex)
        '''
        raise NotImplementedError

    def entities_to_subgraph(self, graph_connector, space, input_entities: Iterable,
                             invalidate_edge_types: Iterable,
                             invalidate_target_entity_types: Iterable, max_path_length: int):
        '''
        Query a node associated with the sub-graph, can filter the sub-graph nodes and edges,
        remove the invalid categories of nodes and edges, and finally return the list of nodes and edges

        Args:
            :param graph_connector: graph connector
            :param input_entities: the set of node ids to query
            :param invalidate_edge_types: exclude passing node type sets
            :param invalidate_target_entity_types: exclude passing edge type sets
            :param max_path_length: maximum depth for query
            :return: a subgraph of node set and edge set

        Return:
            SubGraph(
                vertexes: List(Vertex),
                edges: List(Edge)
            )

        >>> search: GraphSearch = GraphSearch()
        >>> subgraph: SubGraph = search.entities_to_subgraph(conn, "test5nebula", ["3d44287147994e2f40f8a44653d2688a"], [], [], 3)
        '''
        raise NotImplementedError

    def find_path(self, graph_connector, space, start_entity: Vertex, end_entity: Vertex,
                  path_edge_type: str,
                  path_direction: DIRECTION, max_path_length: int, path_pattern: str) -> List[Path]:
        '''
        Query all the paths or the shortest path between two nodes

        Args:
            :param graph_connector: graph connector
            :param space: graph space
            :param start_entity: the start node of path
            :param end_entity: the end node of path
            :param path_edge_type: the set of edge types
            :param path_direction: path direction
            :param max_path_length: maximum depth of path
            :param path_pattern: all paths or shortest path
            :return: the set of path between two nodes

        Return:
            List(Path)

        >>> search: GraphSearch = GraphSearch()
        >>> paths: List[Path] = search.find_path(conn, "test5nebula", Vertex(vid="3d44287147994e2f40f8a44653d2688a", vertex_type="", props={}),Vertex(vid="3e9373175e94c3c801f87d0bbaac0b76", vertex_type="", props={}), "",DIRECTION.REVERSELY, 3, PathPattern.ALL)
        '''
        raise NotImplementedError

    def execute(self, graph_connector, space_name: str, sql: str) -> Any:
        """
        Execute the sql statement directly
        :param graph_connector: graph db connector
        :param space_name: graph db space name
        :param sql: sql statement
        :return: connector returned original result
        Examples:
        MATCH p=(v:player)-[e]->(v2) WHERE id(v) == "player101" RETURN p;
        >>> search: GraphSearch = GraphSearch()
        >>> sql: str = 'MATCH p=(v:player)-[e]->(v2) WHERE id(v) == "player101" RETURN p;'
        >>> query_result: Any = search.execute(conn, 'test', sql)
        """
        pass


    def find_common_neighbours(self, graph_connector, space: str, vids: List[str]) -> List[Vertex]:
        '''
        Find two points or more points common neighbours

        Args:
            :param graph_connector: graph db connector
            :param space: graph database name
            :param vids: the set of node ids

        Return:
            List(Vertex)
        '''

        raise NotImplementedError

    def cycle_detection(self, graph_connector, space: str):
        '''
        Detect whether there is a cycle in the graph

        Args:
            :param graph_connector: graph db connector
            :param space: graph database name

        Return:

        '''

        raise NotImplementedError

    def topological_sort(self, graph_connector, space: str):
        '''
        Directed acyclic graph vertex linear sequence. Given a directed graph, will be ordered all the vertices,
        makes all the edge from the row in front of the elements to row in the back of the element

        Args:
            :param graph_connector: graph db connector
            :param space: graph database name

        Return:

        '''

        raise NotImplementedError

    def connected_component(self, graph_connector, space: str):
        '''
        Connected component represents the graph of a subgraph, all nodes are connected to each other

        Args:
            :param graph_connector: graph db connector
            :param space: graph database name

        Return:

        '''

        raise NotImplementedError
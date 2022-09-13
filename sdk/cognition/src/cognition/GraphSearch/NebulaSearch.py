# -*- coding:utf-8 -*-


import logging
from typing import Iterable, List, Union, Any
import asyncio
from cognition.Connector import NebulaConnector
from cognition.GraphSearch.GraphSearch import (
    GraphSearch,
    TagType, Statement, OperateEnum, Path, Vertex, Edge, ALL_VERTEX_TYPE, SubGraph, PathPattern,
    DIRECTION,
    EmptySearchException, InvalidTypeException
)

#: logger
logger = logging.getLogger(__name__)


class Query:
    """
    build n_gql where statement
    """

    def __init__(self, tag_type: TagType, tag_name: str):
        self.tag_type: TagType = tag_type
        self.tag_name: str = tag_name
        self._statement: List[Statement] = []

    def _append(self, statement: Statement):
        self._statement.append(statement)

    @staticmethod
    def _check_property_name(property_name: str):
        if not property_name:
            raise EmptySearchException(f'property_name:{property_name}')
        if not isinstance(property_name, str):
            raise InvalidTypeException(f'property_name:{property_name}')

    def _base_operate(self, property_name: str, value: Any, operate: OperateEnum) -> 'Query':
        """
        base operate method
        :param property_name: property name
        :param value: str or int
        :param operate: ==/>/>=/</<=/in/not in
        :return:
        """
        self._check_property_name(property_name)
        self._append(Statement(property_name, value, operate))
        return self

    def eq(self, property_name: str, value: Union[str, int]) -> 'Query':
        """
        :param property_name:
        :param value:
        :return:
        """
        return self._base_operate(property_name, value, OperateEnum.EQ)

    def gt(self, property_name: str, value: Union[str, int]) -> 'Query':
        return self._base_operate(property_name, value, OperateEnum.GT)

    def gte(self, property_name: str, value: Union[str, int]) -> 'Query':
        return self._base_operate(property_name, value, OperateEnum.GTE)

    def lt(self, property_name: str, value: Union[str, int]) -> 'Query':
        return self._base_operate(property_name, value, OperateEnum.LT)

    def lte(self, property_name: str, value: Union[str, int]) -> 'Query':
        return self._base_operate(property_name, value, OperateEnum.LTE)

    def in_(self, property_name: str, value: Iterable[Union[str, int]]) -> 'Query':
        return self._base_operate(property_name, value, OperateEnum.IN)

    def not_in_(self, property_name: str, value: Iterable[Union[str, int]]) -> 'Query':
        return self._base_operate(property_name, value, OperateEnum.NOT_IN)

    def is_null(self, property_name: str) -> 'Query':
        return self._base_operate(property_name, None, OperateEnum.IS_NULL)

    def is_not_null(self, property_name: str) -> 'Query':
        return self._base_operate(property_name, None, OperateEnum.IS_NOT_NULL)

    def is_empty(self, property_name: str) -> 'Query':
        return self._base_operate(property_name, None, OperateEnum.IS_EMPTY)

    def is_not_empty(self, property_name: str) -> 'Query':
        return self._base_operate(property_name, None, OperateEnum.IS_NOT_EMPTY)

    def generate_lookup_statement(self) -> str:
        """
        LOOKUP ON player WHERE player.age == 40 YIELD vertex as v;
        :return:
        """

        return self.generate_lookup_statement_by_statements(self.tag_type, self.tag_name, self._statement)

    @staticmethod
    def generate_lookup_statement_by_statements(tag_type: TagType, tag_name: str, statements: List[Statement]) -> str:
        """
        LOOKUP ON player WHERE player.age == 40 YIELD vertex as v;
        :param tag_type: Vertex or Edge
        :param tag_name:
        :param statements:
        :return:
        """

        def deal_value(value: Union[str, int]) -> str:
            if isinstance(value, str):
                return f'"{value}"'
            if isinstance(value, int):
                return f'{value}'
            if isinstance(value, float):
                return f'{value}'
            if isinstance(value, bool):
                return f'{value}'
            raise InvalidTypeException(f'value:{value}')

        if statements is None or len(statements) == 0:
            statement: str = f'LOOKUP ON `{tag_name}`'
        else:
            statement: str = f'LOOKUP ON `{tag_name}` WHERE'
            for _s in statements:
                statement += f' {tag_name}.{_s.property} {_s.operate.value}'
                # no need value
                if _s.operate in (
                        OperateEnum.IS_NULL, OperateEnum.IS_NOT_NULL,
                        OperateEnum.IS_EMPTY, OperateEnum.IS_NOT_EMPTY
                ):
                    statement += ' AND'
                    continue

                _value = _s.value
                # deal with in / not in
                if _s.operate in (OperateEnum.IN, OperateEnum.NOT_IN):
                    statement += ' ['
                    if isinstance(_value, str) or isinstance(_value, int):
                        _value = [_value]

                    # iter _value
                    if isinstance(_value, Iterable):
                        for _i in _value:
                            statement += f' {deal_value(_i)},'
                        statement = statement.rstrip(',')
                    statement += ']'
                else:
                    if not isinstance(_s.value, int) and not isinstance(_s.value, str) \
                            and not isinstance(_s.value, float) and not isinstance(_s.value, bool):
                        raise InvalidTypeException(f'value:{_s.value}')
                    statement += f' {deal_value(_value)}'

                statement += ' AND'
            # remove the last AND
            statement = statement.rstrip(' AND')
            # add yield statement
        if tag_type == TagType.VERTEX:
            statement += ' YIELD properties(vertex) as v'
        if tag_type == TagType.EDGE:
            statement += ' YIELD properties(edge) as e'
        statement += ';'
        return statement


class NebulaSearch(GraphSearch):
    """
    GraphSearch中的方法在此都要实现一遍
    """

    def vid_search(
            self, graph_connector, space_name: str, vid: List[str], vertex_types: List[str]
    ) -> List[Vertex]:
        """
        Retrieve the nodes in the graph, through the designated node type and node id

        Node retrieval for Nebula Graph Database

        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn_nebula = NebulaConnector(ips=["10.4.131.25"], ports=["9669"], user="root", password="root")
        >>> vertex_list = search.vid_search(conn_nebula, 'treeStructure', ['label_01'], ['label'])
        >>> type(vertex_list)
        <class 'List'>
        ```

        Args:
            :param graph_connector: graph db connector
            :param space_name: graph db space name
            :param vid: the list of retrieve the node ids
            :param vertex_types: graph db vertex vertex type list

        Return:
            List[Vertex]

        Examples:
        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn_nebula = NebulaConnector(ips=["10.4.131.25"], ports=["9669"], user="root", password="root")
        >>> vertex_list = search.vid_search(conn_nebula, 'treeStructure', ['label_01'], ['label'])
        >>> type(vertex_list)
        <class 'List'>
        ```
        """
        if not vid:
            raise EmptySearchException('empty vid')
        # define return variable
        vertex_list: List[Vertex] = list()
        # build tag component
        vertex_type_component: str = ALL_VERTEX_TYPE
        if vertex_types:
            vertex_type_component = ','.join('`' + t + '`' for t in vertex_types)

        vid_component = ','.join('"' + id + '"' for id in vid)

        # build n_gql
        n_gql: str = f'FETCH PROP ON {vertex_type_component} {vid_component};'
        logger.debug(f"vid_search(vid: {vid}, vertex_types:{vertex_type_component}) --> {n_gql}")
        resultSets: Any = asyncio.run(graph_connector.execute(space_name, n_gql))

        for row in resultSets:
            node = row[0].as_node()
            vertex_list.append(
                Vertex(
                    vid=node.get_id().as_string(),
                    vertex_type=node.tags()[0],
                    props=self._props_type_transform(node.properties(node.tags()[0]))
                )
            )

        return vertex_list

    def search_entities(
            self, graph_connector, space_name: str, vertex_type: str, statements: List[Statement]
    ) -> List[Vertex]:
        """
        Retrieve the nodes in the graph, through the designated node type and some statements

        Node retrieval for Nebula Graph Database

        Notes:
            In the nebula contains at least one index, if use the LOOKUP statement based on the specified properties
            query is no index, the system will be available

        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn_nebula = NebulaConnector(ips=["10.4.131.25"], ports=["9669"], user="root", password="root")
        >>> statements: List[Statement] = [Statement(property='name', value='aaa', operate=OperateEnum.EQ)]
        >>> vertex_list = search.search_entities(conn_nebula, 'treeStructure', 'player', statements)
        >>> type(vertex_list)
        <class 'List'>
        ```

        Args:
            :param graph_connector: graph db connector
            :param space_name: graph db space name
            :param vertex_type: node type
            :param statements: node properties statements, optional

        Return:
            List[Vertex]

        Example:
        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn_nebula = NebulaConnector(ips=["10.4.131.25"], ports=["9669"], user="root", password="root")
        >>> statements: List[Statement] = [Statement(property='name', value='aaa', operate=OperateEnum.EQ)]
        >>> vertex_list = search.search_entities(conn_nebula, 'treeStructure', 'player', statements)
        >>> type(vertex_list)
        <class 'List'>
        ```
        """
        if not vertex_type:
            raise EmptySearchException('empty vertex type')

        # define return variable
        vertex_list: List[Vertex] = list()
        # call Query.generate_lookup_statement_by_statements to generate n_gql
        n_gql: str = Query.generate_lookup_statement_by_statements(TagType.VERTEX, vertex_type, statements)
        logger.debug(f"search_entities(vertex_type: {vertex_type}, statements:{statements}) --> {n_gql}")
        resultSets: Any = asyncio.run(graph_connector.execute(space_name, n_gql))

        for row in resultSets:
            vid = row[0].as_string()
            properties = row[1].as_map()

            vertex_list.append(
                Vertex(
                    vid=vid,
                    vertex_type=vertex_type,
                    props=self._props_type_transform(properties),
                )
            )

        # format query result
        return vertex_list

    def search_edges(
            self, graph_connector, space_name: str, edge_type: str, statements: List[Statement]
    ) -> List[Edge]:
        """
        Retrieve the edges in the graph, through the designated edges type and some statements

        Edge retrieval for Nebula Graph Database

        Notes:
            In the nebula contains at least one index, if use the LOOKUP statement based on the specified properties
            query is no index, the system will be available

        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn_nebula = NebulaConnector(ips=["10.4.131.25"], ports=["9669"], user="root", password="root")
        >>> statements: List[Statement] = [Statement(property='degree', value=40, operate=OperateEnum.EQ)]
        >>> edge_list = search.search_edges(conn_nebula, 'treeStructure', 'follow', statements)
        >>> type(edge_list)
        <class 'List'>
        ```

        Args:
            :param graph_connector: graph db connector
            :param space_name: graph db space name
            :param edge_type: edge type
            :param statements: edge properties statements, optional

        Return:
            List[Edge]

        Examples:
        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn_nebula = NebulaConnector(ips=["10.4.131.25"], ports=["9669"], user="root", password="root")
        >>> statements: List[Statement] = [Statement(property='degree', value=40, operate=OperateEnum.EQ)]
        >>> edge_list = search.search_edges(conn_nebula, 'treeStructure', 'follow', statements)
        >>> type(edge_list)
        <class 'List'>
        ```
        """
        if not edge_type:
            raise EmptySearchException('empty edge type')

        # define return variable
        edge_list: List[Edge] = list()
        # call Query.generate_lookup_statement_by_statements to generate n_gql
        n_gql: str = Query.generate_lookup_statement_by_statements(TagType.EDGE, edge_type, statements)
        logger.debug(f"search_entities(edge_type: {edge_type}, statements:{statements}) --> {n_gql}")
        resultSets: Any = asyncio.run(graph_connector.execute(space_name, n_gql))
        # format query result

        for row in resultSets:
            srcVid = row[0].as_string()
            dstVid = row[1].as_string()
            properties = row[3].as_map()

            src, dst = Vertex, Vertex
            vids = '"'+srcVid+'"' + ',' + '"'+dstVid+'"'
            fetch_sql = f'FETCH PROP ON * {vids};'
            vertex_props = asyncio.run(graph_connector.execute(space_name, fetch_sql))
            for row in vertex_props:
                node = row[0].as_node()

                if node.get_id().as_string() == srcVid:
                    src = Vertex(
                        vid=node.get_id().as_string(),
                        vertex_type=node.tags()[0],
                        props=self._props_type_transform(node.properties(node.tags()[0]))
                    )
                if node.get_id().as_string() == dstVid:
                    dst = Vertex(
                        vid=node.get_id().as_string(),
                        vertex_type=node.tags()[0],
                        props=self._props_type_transform(node.properties(node.tags()[0]))
                    )
            edge_list.append(
                Edge(
                   edge_type=edge_type,
                   source=src,
                    destination=dst,
                    props=self._props_type_transform(properties),
                )
            )
        return edge_list

    def find_neighbours(self, graph_connector, space: str, input_entities: List[Vertex],
            edge_types: List[str], invalidate_target_entity_types: List[str], max_path_length: int) -> List[Vertex]:
        """
        Query node set of adjacent nodes, can filter the query through the edge type sets and
        remove the invalid categories of target nodes, and finally returned to remove their own collection of nodes

        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn = NebulaConnector(ips=["10.4.131.25"],ports=["9669"],user="root",password="root")
        >>> neighbours = search.find_neighbours(conn, 'test5nebula', [Vertex(vid='3d44287147994e2f40f8a44653d2688a', vertex_type='', props={})], ['label2document', 'document2text'], ['document', 'text'], 3)
        >>> type(neighbours)
        <class 'List[Vertex]'>
        ```

        Args:
            :param graph_connector: graph db connector
            :param space: graph database name
            :param input_entities: the set of node ids to query
            :param edge_types: the query through the edge type sets
            :param invalidate_target_entity_types: exclude passing node type sets
            :param max_path_length: maximum depth for query

        Return:
            List[Vertex]

        Examples:
        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn = NebulaConnector(ips=["10.4.131.25"],ports=["9669"],user="root",password="root")
        >>> neighbours = search.find_neighbours(conn, 'test5nebula', [Vertex(vid='3d44287147994e2f40f8a44653d2688a', vertex_type='', props={})], ['label2document', 'document2text'], ['document', 'text'], 3)
        >>> type(neighbours)
        <class 'List[Vertex]'>
        ```
        """
        # define return variable
        vertex_list: List[Vertex] = list()

        if len(input_entities) == 0:
            raise EmptySearchException

        show_tags = """show tags;"""
        tags = asyncio.run(graph_connector.execute(space, show_tags))
        all_tags = [row[0].as_string() for row in tags]
        for target_entity in invalidate_target_entity_types:
            if target_entity not in all_tags:
                logger.warning("{} not exist".format(target_entity))

        show_edges = """show edges;"""
        edges = asyncio.run(graph_connector.execute(space, show_edges))
        all_edges = [row[0].as_string() for row in edges]
        for edge in edge_types:
            if edge not in all_edges:
                logger.warning("{} not exist".format(edge))

        input_vids = [entity.vid for entity in input_entities]

        # GET SUBGRAPH 指定edge_type nGQL有所区分
        edge_direction: str = ''
        if len(edge_types) != 0:
            edge_direction = 'BOTH'  # 指定双向

        vids = ", ".join('"' + entity.vid + '"' for entity in input_entities)
        etypes = ", ".join(edge for edge in edge_types)
        neighbours = f'GET SUBGRAPH WITH PROP {max_path_length} STEPS FROM {vids} {edge_direction} {etypes} YIELD VERTICES AS nodes;'

        resultSet = asyncio.run(graph_connector.execute(space, neighbours))
        for nodes in resultSet:
            for _node in nodes:
                for node in _node.as_list():
                    node = node.as_node()
                    # filter itself
                    if node.get_id().as_string() in input_vids:
                        continue
                    if node.tags()[0] not in invalidate_target_entity_types:
                        vertex_list.append(
                            Vertex(
                                vid=node.get_id().as_string(),
                                vertex_type=node.tags()[0],
                                props=self._props_type_transform(node.properties(node.tags()[0]))
                            )
                        )

        return vertex_list

    def find_final_objective(
            self, graph_connector, space: str, final_objective_vertex_type: List[str], start_vid: List[str],
            edge_types: List[str], max_depth_limit: int) -> List[Vertex]:
        """
        Find the tree structure of a root node within the maximum depth of leaf nodes. Can specify the query edge type
        and leaf node types, eventually return to a leaf node entities

        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn = NebulaConnector(ips=["10.4.131.25"],ports=["9669"],user="root",password="root")
        >>> objective = search.find_final_objective(conn, 'test5nebula', ['document'], ['3d44287147994e2f40f8a44653d2688a'], ['label2document'], 3)
        >>> type(objective)
        <class 'List[Vertex]'>
        ```

        Args:
            :param graph_connector: graph db connector
            :param space: graph database name
            :param final_objective_vertex_type: the leaf node type
            :param start_vid: root node id of the query
            :param edge_types: the set of edge type
            :param max_path_length: maximum depth for query

        Return:
            List[Vertex]

        Examples:
        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn = NebulaConnector(ips=["10.4.131.25"],ports=["9669"],user="root",password="root")
        >>> objective = search.find_final_objective(conn, 'test5nebula', ['document'], ['3d44287147994e2f40f8a44653d2688a'], ['label2document'], 3)
        >>> type(objective)
        <class 'List[Vertex]'>
        ```
        """
        # define return variable
        vertex_list: List[Vertex] = list()

        if len(start_vid) == 0:
            raise EmptySearchException

        def dfs(root, depth):
            if root == None:
                return
            find_children = """match (v)-[e{edge_types}]->(v2) where id(v) in [{vids}] return v2;"""\
                .format(edge_types='|'.join(':' + e for e in edge_types), vids='"' + root + '"')
            resultSet = asyncio.run(graph_connector.execute(space, find_children))

            if depth >= max_depth_limit or len(resultSet) == 0:
                paths.append(path[:])
                return

            for nodes in resultSet:
                for node in nodes:
                    node = node.as_node()
                    path.append(node.get_id().as_string())
                    dfs(node.get_id().as_string(), depth+1)
                path.pop()

        paths, path = [], []
        for vid in start_vid:
            path.append(vid)
            dfs(vid, 0)

        for p in paths:
            leaf_node = p[-1]
            fatch_sql = """FETCH PROP ON * "{}";""".format(leaf_node)
            vertex_props = asyncio.run(graph_connector.execute(space, fatch_sql))

            for row in vertex_props:
                node = row[0].as_node()
                if node.tags()[0] in final_objective_vertex_type:
                    vertex_list.append(Vertex(
                        vid=node.get_id().as_string(),
                        vertex_type=node.tags()[0],
                        props=self._props_type_transform(node.properties(node.tags()[0]))
                    ))

        return vertex_list

    def entities_to_subgraph(self, graph_connector, space: str, input_entities: Iterable, invalidate_edge_types: Iterable,
                             invalidate_target_entity_types: Iterable, max_path_length: int):
        '''
        Query a node associated with the sub-graph, can filter the sub-graph nodes and edges,
        remove the invalid categories of nodes and edges, and finally return the list of nodes and edges.

        Subgraph retrieval for Nebula Graph Database

        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn = NebulaConnector(ips=["10.4.131.25"],ports=["9669"],user="root",password="root")
        >>> subgraph = search.entities_to_subgraph(conn, 'test5nebula', ['3d44287147994e2f40f8a44653d2688a'], ['label2document', 'document2text'], ['document', 'text'], 3)
        >>> type(subgraph)
        <class 'SubGraph'>
        ```
        Args:
            :param graph_connector: graph connector
            :param space: graph database name
            :param input_entities: the set of node ids to query
            :param invalidate_edge_types: exclude passing edge type sets
            :param invalidate_target_entity_types: exclude passing node type sets
            :param max_path_length: maximum depth for query

        Return:
             SubGraph(
                vertexes: List(Vertex),
                edges: List(Edge)
            )

        Example:
        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn = NebulaConnector(ips=["10.4.131.25"],ports=["9669"],user="root",password="root")
        >>> subgraph = search.entities_to_subgraph(conn, 'test5nebula', ['3d44287147994e2f40f8a44653d2688a'], ['label2document', 'document2text'], ['document', 'text'], 3)
        >>> type(subgraph)
        <class 'SubGraph'>
        ```
        '''
        # define return variable
        vertex_list: List[Vertex] = list()
        edges_list: List[Edge] = list()

        if len(input_entities) == 0:
            raise EmptySearchException

        show_tags = """show tags;"""
        tags = asyncio.run(graph_connector.execute(space, show_tags))
        all_tags = [row[0].as_string() for row in tags]
        for target_entity in invalidate_target_entity_types:
            if target_entity not in all_tags:
                logger.warning("{} not exist".format(target_entity))

        show_edges = """show edges;"""
        edges = asyncio.run(graph_connector.execute(space, show_edges))
        all_edges = [row[0].as_string() for row in edges]
        for edge_type in invalidate_edge_types:
            if edge_type not in all_edges:
                logger.warning("{} not exist".format(edge_type))

        subgraph = """GET SUBGRAPH WITH PROP {} STEPS FROM {} YIELD VERTICES AS nodes, EDGES AS relationships;"""\
            .format(max_path_length, ",".join('"' + e + '"' for e in input_entities))

        resultSet = asyncio.run(graph_connector.execute(space, subgraph))
        for nodes, relationships in resultSet:
            for node in nodes.as_list():
                node = node.as_node()
                if node.tags()[0] not in invalidate_target_entity_types:
                    vertex_list.append(
                        Vertex(
                            vid=node.get_id().as_string(),
                            vertex_type=node.tags()[0],
                            props=self._props_type_transform(node.properties(node.tags()[0]))
                        )
                    )

            for relation in relationships.as_list():
                if relation.is_edge():
                    edge = relation.as_relationship()
                    if edge.edge_name() not in invalidate_edge_types:
                        edges_list.append(
                            Edge(
                                edge_type=edge.edge_name(),
                                props=self._props_type_transform(edge.properties()),
                                source=edge.start_vertex_id().as_string(),
                                destination=edge.end_vertex_id().as_string()
                            )
                        )

        sub_graph = SubGraph(
            vertexes=vertex_list,
            edges=edges_list
        )
        return sub_graph

    def find_path(self, graph_connector, space, start_entity: Vertex, end_entity: Vertex, path_edge_type: str,
                  path_direction: DIRECTION, max_path_length: int, path_pattern: PathPattern, path_line_limit=100) -> List[Path]:
        """
        Query all the paths or the shortest path between two nodes

        Path retrieval for Nebula Graph Database
        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn = NebulaConnector(ips=["10.4.131.25"],ports=["9669"],user="root",password="root")
        >>> paths = search.find_path(conn, "test5nebula", Vertex(vid="3d44287147994e2f40f8a44653d2688a", vertex_type="", props={}),Vertex(vid="3e9373175e94c3c801f87d0bbaac0b76", vertex_type="", props={}), "",DIRECTION.BIDIRECT, 3, PathPattern.ALL)
        >>> type(path) for path in paths
        <class 'Path'>
        ```

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

        Example:
        ```python
        >>> search: NebulaSearch = NebulaSearch()
        >>> conn = NebulaConnector(ips=["10.4.131.25"],ports=["9669"],user="root",password="root")
        >>> paths = search.find_path(conn, "test5nebula", Vertex(vid="3d44287147994e2f40f8a44653d2688a", vertex_type="", props={}),Vertex(vid="3e9373175e94c3c801f87d0bbaac0b76", vertex_type="", props={}), "",DIRECTION.BIDIRECT, 3, PathPattern.ALL)
        >>> type(path) for path in paths
        <class 'Path'>
        ```
        """
        # define return variable
        paths: List[Path] = list()

        if start_entity == None or end_entity == None:
            raise EmptySearchException

        if path_edge_type == "":
            path_edge_type = "*"

        if path_direction == 'POSITIVE':
            path_direction = ''

        sql = """FIND {} PATH WITH PROP FROM "{}" TO "{}" OVER {} {} UPTO {} STEPS | LIMIT {};"""\
            .format(path_pattern, start_entity.vid, end_entity.vid, path_edge_type, path_direction, max_path_length, path_line_limit)
        resultSet = asyncio.run(graph_connector.execute(space, sql))
        for row in resultSet:
            path = row[0].as_path()
            src = Vertex(
                vid=path.start_node().get_id().as_string(),
                vertex_type=path.start_node().tags()[0],
                props=self._props_type_transform(path.start_node().properties(path.start_node().tags()[0]))
            )
            cur = Path(value=src, edge_type="", props={}, next=None)
            pre = cur

            for relationship in path.relationships():
                pre.edge_type = relationship.edge_name()
                pre.props = self._props_type_transform(relationship.properties())

                if relationship.start_vertex_id().as_string() == cur.value.vid:
                    cur.next = Path(
                        value=Vertex(vid=relationship.end_vertex_id().as_string(), vertex_type="", props={}),
                        edge_type="", props={}, next=None)
                elif relationship.end_vertex_id().as_string() == cur.value.vid:
                    cur.next = Path(
                        value=Vertex(vid=relationship.start_vertex_id().as_string(), vertex_type="", props={}),
                        edge_type="", props={}, next=None)

                fetch_sql = """FETCH PROP ON * "{}";""".format(cur.next.value.vid)
                vertex_props = asyncio.run(graph_connector.execute(space, fetch_sql))
                for row in vertex_props:
                    node = row[0].as_node()
                    cur.next.value.vertex_type = node.tags()[0]
                    cur.next.value.props = self._props_type_transform(node.properties(node.tags()[0]))

                cur = cur.next

            paths.append(pre)

        return paths

    def _props_type_transform(self, valeWrap_props: dict):
        for key, value in valeWrap_props.items ():
            valeWrap_props[key] = str(value).strip('"')
        return valeWrap_props

    def execute(self, graph_connector, space_name: str, sql: str) -> Any:
        """
        Execute the sql statement directly
        :param graph_connector: graph db connector
        :param space_name: graph db space name
        :param sql: sql statement
        :return:
        """
        pass


if __name__ == '__main__':
    test_statement: str = Query.generate_lookup_statement_by_statements(
        TagType.EDGE,
        'player',
        [
            Statement(property='name', value='aaa', operate=OperateEnum.EQ),
            Statement(property='version', value=None, operate=OperateEnum.IS_NULL),
            Statement(property='age', value=40, operate=OperateEnum.GTE),
        ]
    )
    print(test_statement)

    query: Query = Query(TagType.EDGE, 'player').eq('name', 'aaa').is_null('version').gte('age', 40)
    print(query.generate_lookup_statement())

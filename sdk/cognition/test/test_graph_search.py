#!/usr/bin/env python
# -*- coding: utf-8 -*-
import pytest
from cognition.GraphSearch.GraphSearch import Vertex, DIRECTION, Path, PathPattern, SubGraph, Statement, OperateEnum
from cognition.GraphSearch.NebulaSearch import NebulaSearch

def setup_function():
    print("init...")

def teardown_function():
    print("clean...")

def test_entities_subgraph(conn_nebula):
    search = NebulaSearch()
    subgraph = search.entities_to_subgraph(conn_nebula, 'treeStructure', ['label_01'], ['label2document', 'document2text'], ['document', 'text'], 3)
    assert isinstance(subgraph, SubGraph)

    for vertex in subgraph.vertexes:
        assert vertex.vertex_type not in ['document', 'text']
    for edge in subgraph.edges:
        assert edge.edge_type not in ['label2document', 'document2text']

def test_find_path(conn_nebula):
    search = NebulaSearch()

    # all paths
    paths = search.find_path(conn_nebula, "treeStructure",
                             Vertex(vid="label_01", vertex_type="", props={}),
                             Vertex(vid="document_03", vertex_type="", props={}), "",
                             DIRECTION.BIDIRECT, 2, PathPattern.ALL)
    assert len(paths) == 1
    for path in paths:
        assert isinstance(path, Path)
        assert path.value.vid in ['label_01', 'label_06', 'document_03']

    # shortest path
    paths = search.find_path(conn_nebula, "treeStructure",
                             Vertex(vid="label_01", vertex_type="", props={}),
                             Vertex(vid="document_03", vertex_type="", props={}), "",
                             DIRECTION.BIDIRECT, 3, PathPattern.SHORTEST)
    assert len(paths) == 1
    for path in paths:
        assert isinstance(path, Path)
        assert path.value.vid in ['label_01', 'label_06', 'document_03']


def test_find_neighbours(conn_nebula):
    search = NebulaSearch()
    neighbours = search.find_neighbours(conn_nebula, 'treeStructure', [Vertex('label_01', '', {})], [], [], 3)

    # vid = 'text_03' 不存在于neighbours中
    _bool = False
    for neighbour in neighbours:
        assert isinstance(neighbour, Vertex)
        if neighbour.vid == 'text_03':
            _bool = True
    assert _bool == False

    neighbours = search.find_neighbours(conn_nebula, 'treeStructure', [Vertex('label_01', '', {})],
                                        ['label2document', 'label2label'], [], 3)
    assert len(neighbours) == 9
    # vid = 'text_01', 'text_02', 'text_03' 不存在于neighbours中
    _bool = False
    for neighbour in neighbours:
        assert isinstance(neighbour, Vertex)
        if neighbour.vid in ['text_01', 'text_02', 'text_03']:
            _bool = True
    assert _bool == False

    # 查询深度为0
    neighbours = search.find_neighbours(conn_nebula, 'treeStructure', [Vertex('label_01', '', {})], [], [], 0)
    assert len(neighbours) == 0


def test_find_final_objective(conn_nebula):
    search = NebulaSearch()

    objectives = search.find_final_objective(conn_nebula, 'treeStructure', ['document'], ['label_01'], [], 5)
    assert len(objectives) == 2
    for vertex in objectives:
        assert isinstance(vertex, Vertex)
        assert vertex.vid in ['document_02', 'document_04']

    objectives = search.find_final_objective(conn_nebula, 'treeStructure', ['document'], ['label_01'], ['label2document'], 5)
    assert len(objectives) == 1
    for vertex in objectives:
        assert isinstance(vertex, Vertex)
        assert vertex.vid == 'document_01'

    objectives = search.find_final_objective(conn_nebula, 'treeStructure', ['document'], ['label_01', 'label_06'], ['label2document'], 5)
    assert len(objectives) == 3
    for vertex in objectives:
        assert isinstance(vertex, Vertex)
        assert vertex.vid in ['document_01', 'document_03', 'document_04']

    objectives = search.find_final_objective(conn_nebula, 'treeStructure', ['text'], ['label_01'], [], 5)
    assert len(objectives) == 2
    for vertex in objectives:
        assert isinstance(vertex, Vertex)
        assert vertex.vid in ['text_01', 'text_02']

def test_search_entities(conn_nebula):
    search = NebulaSearch()

    statements = [
        Statement(property='name', value='系统', operate=OperateEnum.EQ),
        Statement(property='confidence', value=0.7, operate=OperateEnum.GT),
        Statement(property='type_nw', value=True, operate=OperateEnum.EQ)
    ]
    entities = search.search_entities(conn_nebula, 'u035550d3edff11ec812762841a7c932b', 'label', statements)
    assert len(entities) == 0

    # 查询全部
    entities = search.search_entities(conn_nebula, 'treeStructure', 'label', None)
    assert len(entities) == 6

def test_search_edges(conn_nebula):
    search = NebulaSearch()

    statements = [
        Statement(property='name', value='', operate=OperateEnum.EQ)
    ]
    edges = search.search_edges(conn_nebula, 'treeStructure', 'label2label', statements)
    assert len(edges) == 0

    # 查询全部
    edges = search.search_edges(conn_nebula, 'treeStructure', 'label2label', None)
    assert len(edges) == 5


def test_vid_search(conn_nebula):
    search = NebulaSearch()

    vertex_list = search.vid_search(conn_nebula, 'treeStructure', ['label_01', 'label_02'], ['label'])
    assert len(vertex_list) == 2

    vertex_list = search.vid_search(conn_nebula, 'treeStructure', ['label_01', 'label_02'], None)
    assert len(vertex_list) == 2

    vertex_list = search.vid_search(conn_nebula, 'treeStructure', ['label_01', 'label_02'], ['label', 'document'])
    assert len(vertex_list) == 2
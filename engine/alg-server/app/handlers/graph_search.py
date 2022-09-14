# -*- coding: utf-8 -*-

from typing import Iterable, List, Dict
from cognition.GraphSearch.NebulaSearch import NebulaSearch
from cognition.GraphSearch.OrientDBSearch import OrientDBSearch
from ..schemas.response import Vertex, Edge, Path, PathMetaData, TargetVertex
from fastapi import HTTPException
from cognition.Connector import NebulaConnector, OrientDBConnector
import time
from collections import defaultdict


class NebulaAnyDataGraphSearch(NebulaSearch):
    async def search_vid_1(self, graph_connector, space: str, entity_rids: List[str]) -> Dict[str, tuple]:
        if not entity_rids:
            return {}

        # 查询属性
        sql = """
            use {space};
            match (v)
            where id(v) in {entity_rids}
            return id(v), properties(v), labels(v);
        """.format(space=space, entity_rids=entity_rids)
        res = await graph_connector.execute_json(sql)

        # 解析结果
        vid_to_properties = {}
        for row in res["results"][0]["data"]:
            row = row["row"]
            vid_to_properties[row[0]] = (row[1]['name'], row[2][0])
        return vid_to_properties

    async def search_vid_2(self, graph_connector, space: str, entity_rids: List[str]):
        if not entity_rids:
            return {}

        # 查询属性
        sql = """
            use {space};
            match (v)
            where id(v) in {entity_rids}
            return id(v), properties(v)
        """.format(space=space, entity_rids=entity_rids)
        res = await graph_connector.execute_json(sql)

        # 解析结果
        vid_to_properties = {}
        for row in res["results"][0]["data"]:
            vid, props = row["row"]
            vid_to_properties[vid] = props
        return vid_to_properties

    async def general_search(self, graph_connector, space: str, **kwargs):
        mention_id_to_mention_score = {mention.id: mention.score for mention in kwargs["input_entities"]}
        search_range_vertexes = set(kwargs["search_range_vertexes"])
        display_range_vertexs = set(kwargs["display_range_vertexes"])
        last_layer_via_id_to_path = defaultdict(lambda: {"vertexes": set(), "edges": set(), "meta_data": list()})
        target_id_to_path = defaultdict(lambda: {"vertexes": set(), "edges": set(), "meta_data": list()})

        st = time.time()

        # 检查参数
        if "input_entities" not in kwargs or "search_range_edges" not in kwargs or "display_range_vertexes" not in kwargs or "max_depth" not in kwargs:
            raise HTTPException(status_code=500, detail="gerenal search parameter error!")

        # 参数特殊情况处理
        if not kwargs["input_entities"] or not kwargs["display_range_vertexes"]:
            return {}

        # 参数特殊情况处理
        if kwargs["max_depth"] <= 0 or not kwargs["search_range_edges"]:
            for mention in kwargs["input_entities"]:
                if mention.type_.split("_", 1)[-1] in display_range_vertexs:
                    target_id_to_path[mention.id]["meta_data"].append([mention_id_to_mention_score[mention.id], 0])
                    target_id_to_path[mention.id]["vertexes"].add(mention.id)
            return target_id_to_path

        # 子图查询
        sql = """
                use {space};
                get subgraph {steps} steps from {vertices} both {edges} YIELD VERTICES AS nodes, EDGES AS relationships;
           """.format(
            space=space,
            steps=kwargs["max_depth"],
            vertices=str([entity.id for entity in kwargs["input_entities"]])[1:-1],
            edges=",".join(kwargs["search_range_edges"])
        )

        print(sql)

        res = await graph_connector.execute(sql)

        # 解析查询结果
        for i in range(len(res)):
            via_id_to_path = defaultdict(lambda: {"vertexes": set(), "edges": set(), "meta_data": list()})
            via_ids = set()
            target_ids = set()
            # node字段解析
            for node in res[i][0].as_list():
                node = node.as_node()
                node_tag = node.tags()[0]
                node_id = node.get_id().as_string()
                # 保留在display_range_vertexs范围的点
                if node_tag in display_range_vertexs:
                    if i == 0:
                        target_id_to_path[node_id]["meta_data"].append([mention_id_to_mention_score[node_id], 0])
                    target_id_to_path[node_id]["vertexes"].add(node_id)
                    target_ids.add(node_id)
                # 保留在search_range_vertexes的点
                if node_tag in search_range_vertexes:
                    if i == 0:
                        via_id_to_path[node_id]["meta_data"].append(mention_id_to_mention_score[node_id])
                    via_id_to_path[node_id]["vertexes"].add(node_id)
                    via_ids.add(node_id)

            if i == 0:
                last_layer_via_id_to_path = via_id_to_path
                continue

            # edge字段解析
            for edge in res[i-1][1].as_list():
                edge = edge.as_relationship()
                src_id = edge.start_vertex_id().as_string()
                end_id = edge.end_vertex_id().as_string()
                edge_name = edge.edge_name()
                # 有效中间路径
                if src_id in via_ids and end_id in last_layer_via_id_to_path:
                    via_id_to_path[src_id]["vertexes"] = via_id_to_path[src_id]["vertexes"].union(
                        last_layer_via_id_to_path[end_id]["vertexes"])
                    via_id_to_path[src_id]["edges"] = via_id_to_path[src_id]["edges"].union(
                        last_layer_via_id_to_path[end_id]["edges"])
                    via_id_to_path[src_id]["edges"].add((src_id, end_id, edge_name))
                    via_id_to_path[src_id]["meta_data"].extend(last_layer_via_id_to_path[end_id]["meta_data"])

                if src_id in target_ids and end_id in last_layer_via_id_to_path:
                    target_id_to_path[src_id]["vertexes"] = target_id_to_path[src_id]["vertexes"].union(
                        last_layer_via_id_to_path[end_id]["vertexes"])
                    target_id_to_path[src_id]["edges"] = target_id_to_path[src_id]["edges"].union(
                        last_layer_via_id_to_path[end_id]["edges"])
                    target_id_to_path[src_id]["edges"].add((src_id, end_id, edge_name))
                    for md in last_layer_via_id_to_path[end_id]["meta_data"]:
                        target_id_to_path[src_id]["meta_data"].append((md, i))

                if end_id in via_ids and src_id in last_layer_via_id_to_path:
                    via_id_to_path[end_id]["vertexes"] = via_id_to_path[end_id]["vertexes"].union(
                        last_layer_via_id_to_path[src_id]["vertexes"])
                    via_id_to_path[end_id]["edges"] = via_id_to_path[end_id]["edges"].union(
                        last_layer_via_id_to_path[src_id]["edges"])
                    via_id_to_path[end_id]["edges"].add((src_id, end_id, edge_name))
                    via_id_to_path[end_id]["meta_data"].extend(last_layer_via_id_to_path[src_id]["meta_data"])

                if end_id in target_ids and src_id in last_layer_via_id_to_path:
                    target_id_to_path[end_id]["vertexes"] = target_id_to_path[end_id]["vertexes"].union(
                        last_layer_via_id_to_path[src_id]["vertexes"])
                    target_id_to_path[end_id]["edges"] = target_id_to_path[end_id]["edges"].union(
                        last_layer_via_id_to_path[src_id]["edges"])
                    target_id_to_path[end_id]["edges"].add((src_id, end_id, edge_name))
                    for md in last_layer_via_id_to_path[src_id]["meta_data"]:
                        target_id_to_path[end_id]["meta_data"].append((md, i))

            last_layer_via_id_to_path = via_id_to_path

        return target_id_to_path


class OrientDBAnyDataGraphSearch(OrientDBSearch):
    async def search_vid_1(self, graph_connector, space: str, entity_rids: List[str]) -> Dict[str, tuple]:
        return {}

    async def search_vid_2(self, graph_connector, space: str, entity_rids: List[str]) -> Dict[str, tuple]:
        return {}

    async def general_search(self, graph_connector, space: str, **kwargs) -> Dict[str, TargetVertex]:
        return {}


class AnyDataGraphSearch:
    async def search_vid_1(self, graph_connector, space: str, entity_rids: List[str]) -> Dict[str, tuple]:
        if isinstance(graph_connector, NebulaConnector):
            graph_search = NebulaAnyDataGraphSearch()
        if isinstance(graph_connector, OrientDBConnector):
            graph_search = OrientDBAnyDataGraphSearch()
        return await graph_search.search_vid_1(graph_connector, space, entity_rids)

    async def search_vid_2(self, graph_connector, space: str, entity_rids: List[str]) -> Dict[str, tuple]:
        if isinstance(graph_connector, NebulaConnector):
            graph_search = NebulaAnyDataGraphSearch()
        if isinstance(graph_connector, OrientDBConnector):
            graph_search = OrientDBAnyDataGraphSearch()
        return await graph_search.search_vid_2(graph_connector, space, entity_rids)

    async def general_search(self, graph_connector, space: str, **kwargs) -> Dict[str, TargetVertex]:
        if isinstance(graph_connector, NebulaConnector):
            graph_search = NebulaAnyDataGraphSearch()
        if isinstance(graph_connector, OrientDBConnector):
            graph_search = OrientDBAnyDataGraphSearch()
        return await graph_search.general_search(graph_connector, space, **kwargs)


ad_search = AnyDataGraphSearch()

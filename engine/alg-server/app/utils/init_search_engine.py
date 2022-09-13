# !/usr/bin/env python
# -*- coding:utf-8 -*-
from ..handlers.search_engine import AnyDataSearchEngine
from typing import List, Dict
from cognition.Connector import NebulaConnector, OrientDBConnector, OpenSearchConnector
import base64


async def init_search_engine(config_info: List[Dict]):
    """
    初始化search_engine
    config_info: 用户配置信息和图谱基本信息
    """
    kg_id_to_search_engine = {}
    kg_id_to_search_kwargs = {}
    for info in config_info:
        # 新的kg_id
        if info["kg_id"] not in kg_id_to_search_engine:
            # nebula类型
            if info["graph_db_type"] == "nebula":
                nebula_connector = NebulaConnector(
                    ips=info["graph_db_ip"].split(";"),
                    ports=info["graph_db_port"].split(";"),
                    user=info["graph_db_user"],
                    password=base64.b64decode(info["graph_db_pwd"]).decode()
                )
                fulltext_connector = OpenSearchConnector(
                    ips=info["fulltext_ip"].split(";") if info["fulltext_ip"] else [],
                    ports=info["fulltext_port"].split(";") if info["fulltext_port"] else [],
                    user=info["fulltext_user"],
                    password=base64.b64decode(info["fulltext_pwd"]).decode()
                )
                search_engine = AnyDataSearchEngine(nebula_connector, fulltext_connector)
            # orientdb 类型
            if info["graph_db_type"] == "orientdb":
                orientdb_connector = OrientDBConnector(
                    ips=info["graph_db_ip"],
                    ports=info["graph_db_port"],
                    user=info["graph_db_user"],
                    password=base64.b64decode(info["graph_db_pwd"]).decode()
                )
                search_engine = AnyDataSearchEngine(orientdb_connector, orientdb_connector)

            kg_id_to_search_engine[info["kg_id"]] = search_engine

            kg_id_to_search_kwargs[info["kg_id"]] = {
                "max_depth": info["max_depth"],
                "search_range_vertexes": info["search_range_vertexes"],
                "search_range_edges": info["search_range_edges"],
                "display_range_vertexes": info["display_range_vertexes"],
                "conf_update_time": info["conf_update_time"],
                "kg_id": info["kg_id"],
                "kg_name": info["kg_name"],
                "hlStart": info["hlStart"],
                "hlEnd": info["hlEnd"],
                "tag_to_color": info["tag_to_color"],
                "tag_to_analysis": info["tag_to_analysis"]
            }
        # kg_id多条记录
        else:
            if info["conf_update_time"] > kg_id_to_search_kwargs[info["kg_id"]]["conf_update_time"]:
                kg_id_to_search_kwargs[info["kg_id"]]["max_depth"] = info["max_depth"]
                kg_id_to_search_kwargs[info["kg_id"]]["search_range_vertexes"] = info["search_range_vertexes"]
                kg_id_to_search_kwargs[info["kg_id"]]["search_range_edges"] = info["search_range_edges"]
                kg_id_to_search_kwargs[info["kg_id"]]["display_range_vertexes"] = info["display_range_vertexes"]
                kg_id_to_search_kwargs[info["kg_id"]]["conf_update_time"] = info["conf_update_time"]

    return kg_id_to_search_engine, kg_id_to_search_kwargs

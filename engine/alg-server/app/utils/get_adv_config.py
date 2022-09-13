# !/usr/bin/env python
# -*- coding:utf-8 -*-
import inject
from .connector import AsyncRequestMysql
from typing import List, Dict
import json
from typing import Optional
from ..schemas.request import ConfContent
import datetime
from fastapi import HTTPException


BASE_SQL = """
select 
    a.conf_content as conf_content,
    a.update_time as conf_update_time,
    b.id as kg_id,
    b.KDB_name as kg_name,
    b.hlStart as hlStart,
    b.hlEnd as hlEnd,
    c.ip as graph_db_ip,
    c.port as graph_db_port,
    c.user as graph_db_user,
    c.password as graph_db_pwd,
    c.type as graph_db_type,
    d.ip as fulltext_ip,
    d.port as fulltext_port,
    d.user as fulltext_user,
    d.password as fulltext_pwd,
    m.graph_otl
from search_config as a
left join knowledge_graph as b
on a.kg_id = b.id
left join graph_config_table m
on b.KG_config_id = m.id
left join graph_db as c
on m.graph_db_id = c.id
left join fulltext_engine as d
on c.fulltext_id = d.id
"""

TEST_SQL = """
select 
    b.id as kg_id,
    b.KDB_name as kg_name,
    b.hlStart as hlStart,
    b.hlEnd as hlEnd,
    c.ip as graph_db_ip,
    c.port as graph_db_port,
    c.user as graph_db_user,
    c.password as graph_db_pwd,
    c.type as graph_db_type,
    d.ip as fulltext_ip,
    d.port as fulltext_port,
    d.user as fulltext_user,
    d.password as fulltext_pwd,
    m.graph_otl
from knowledge_graph as b
left join graph_config_table m
on b.KG_config_id = m.id
left join graph_db as c
on m.graph_db_id = c.id
left join fulltext_engine as d
on c.fulltext_id = d.id
where b.id in ({ids})
"""

SQL_BY_CONF_ID = BASE_SQL + "where a.id in ({ids})"
SQL_BY_KG_ID = BASE_SQL + "where a.kg_id in ({ids})"
SQL_BY_ALL = BASE_SQL


OTL_SQL = """
select id, entity, edge
from ontology_table
where id in ({ids})
"""


async def get_adv_conf(ids: str, ids_type: str, conf_content: Optional[ConfContent] = None) -> List[Dict]:
    """
    获取用户配置信息、图谱连接信息、本体信息
    ids: 图谱/配置ID
    ids_type:
        all: ids为空，查询所有的图谱
        conf_id: ids为配置ID
        kg_id: ids为图谱ID
        test: conf_content来自请求体，而且数据库
    conf_content: 当ids_type=test时，会传入conf_content，否则不传
    """
    # read graph information
    mysql_connector = inject.instance(AsyncRequestMysql)

    if ids_type not in ["all", "kg_id", "conf_id", "test"]:
        raise HTTPException(status_code=500, detail="ids type error!")

    # 获取用户配置信息，以及图谱连结信息
    if ids_type == "all":
        config_info = await mysql_connector.get(SQL_BY_ALL)
    if ids_type == "kg_id":
        config_info = await mysql_connector.get(SQL_BY_KG_ID.format(ids=ids))
    if ids_type == "conf_id":
        config_info = await mysql_connector.get(SQL_BY_CONF_ID.format(ids=ids))
    if ids_type == "test":
        config_info = await mysql_connector.get(TEST_SQL.format(ids=ids))
        config_info = [[conf_content.json(), datetime.datetime.now()] + list(c) for c in config_info]

    if ids_type in ["conf_id", "kg_id", "test"] and len(config_info) < len(ids.split(",")):
        raise HTTPException(status_code=500, detail="config id or kg id not exist!")

    res = list()
    otl_ids = set()
    for conf_content, conf_update_time, kg_id, kg_name, hlStart, hlEnd, graph_db_ip, graph_db_port, graph_db_user, \
        graph_db_pwd, graph_db_type, fulltext_ip, fulltext_port, fulltext_user, fulltext_pwd, graph_otl in config_info:

        conf_content = json.loads(conf_content)
        graph_otl = json.loads(graph_otl)[0]

        if ids_type in ["kg_id", "all"] and conf_content["display_range"]["vertexes"]["open"] != ["document"]:
            raise HTTPException(status_code=500, detail="display range should only contain 'document'!")

        res.append({
            "max_depth": conf_content["max_depth"],
            "search_range_vertexes": conf_content["search_range"]["vertexes"]["open"],
            "search_range_edges": conf_content["search_range"]["edges"]["open"],
            "display_range_vertexes": conf_content["display_range"]["vertexes"]["open"],
            "conf_update_time": conf_update_time,
            "kg_id": kg_id,
            "kg_name": kg_name,
            "hlStart": hlStart,
            "hlEnd": hlEnd,
            "graph_db_ip": graph_db_ip,
            "graph_db_port": graph_db_port,
            "graph_db_user": graph_db_user,
            "graph_db_pwd": graph_db_pwd,
            "graph_db_type": graph_db_type,
            "fulltext_ip": fulltext_ip,
            "fulltext_port": fulltext_port,
            "fulltext_user": fulltext_user,
            "fulltext_pwd": fulltext_pwd,
            "graph_otl": graph_otl
        })

        otl_ids.add(graph_otl)

    # 获取本体信息
    otl_info = await mysql_connector.get(OTL_SQL.format(ids=str(otl_ids)[1:-1]))
    for otl_id, entity_otl, edge_otl in otl_info:
        entity_otl = json.loads(entity_otl.replace("'", '"'))
        edge_otl = json.loads(edge_otl.replace("'", '"'))

        tag_to_color = {}
        tag_to_analysis = {}
        for otl in entity_otl:
            # 实体颜色
            tag_to_color[otl["name"]] = otl["colour"]
            # 探索式分析参数
            tag_to_analysis[otl["name"]] = otl["name"] == "document" and otl["model"] == "Anysharedocumentmodel"
        for otl in edge_otl:
            # 边的颜色
            tag_to_color[otl["name"]] = otl["colour"]

        for r in res:
            if r["graph_otl"] == otl_id:
                r["tag_to_color"] = tag_to_color
                r["tag_to_analysis"] = tag_to_analysis
                break
    return res

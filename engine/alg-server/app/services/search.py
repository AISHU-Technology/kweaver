# -*- coding: utf-8 -*-
from fastapi import APIRouter
from ..utils.get_adv_config import get_adv_conf
from ..utils.init_search_engine import init_search_engine
import asyncio
from operator import attrgetter
from ..schemas.response import Response, ASTargetVertex, SearchResult, ASSearchResult, ASResponse
from ..schemas.request import RequestModel
import time
from typing import Optional


router = APIRouter(prefix='/v2/adv_search', tags=['search'])


@router.get('/{conf_ids}', response_model=Response)
async def get(conf_ids: str, query: str, page: int, size: int):
    """
    AD平台语义搜索接口
    """
    start_time = time.time()
    conf_info = await get_adv_conf(ids=conf_ids, ids_type="conf_id")
    kg_id_to_search_engine, kg_id_to_search_kwargs = await init_search_engine(conf_info)
    tasks = []
    for kg_id, search_engine in kg_id_to_search_engine.items():
        tasks.append(asyncio.create_task(search_engine.search(query, **kg_id_to_search_kwargs[kg_id])))

    result_of_multi_kg = []
    for task in tasks:
        result_of_one_kg = await task
        result_of_multi_kg += result_of_one_kg

    # 对搜索结果按得分排序
    target_vertexes = sorted(result_of_multi_kg, key=attrgetter('score'), reverse=True)[(page - 1) * size:page * size]

    # for i, target_vertex in enumerate(target_vertexes):
    #     # 展示分数
    #     target_vertex.score = max(10 - 0.5 * (((page - 1) * size + i) // 5), 1.0)

    end_time = time.time()
    response = Response(
        time=round(end_time - start_time, 2),
        number=len(result_of_multi_kg),
        res=SearchResult(search=target_vertexes)
    )
    return response


@router.post('/test', response_model=Response)
async def post(conf_content: RequestModel):
    """
    AD平台测试搜索接口
    """
    start_time = time.time()
    conf_info = await get_adv_conf(ids=conf_content.kg_ids, ids_type="test", conf_content=conf_content.conf_content)
    kg_id_to_search_engine, kg_id_to_search_kwargs = await init_search_engine(conf_info)
    tasks = []
    for kg_id, search_engine in kg_id_to_search_engine.items():
        tasks.append(asyncio.create_task(search_engine.search(conf_content.query, **kg_id_to_search_kwargs[kg_id])))

    result_of_multi_kg = []
    for task in tasks:
        result_of_one_kg = await task
        result_of_multi_kg += result_of_one_kg

    # 对搜索结果按得分排序
    target_vertexes = sorted(result_of_multi_kg, key=attrgetter('score'), reverse=True)[(conf_content.page - 1) * conf_content.size:conf_content.page * conf_content.size]

    # for i, target_vertex in enumerate(target_vertexes):
    #     # 展示分数
    #     target_vertex.score = max(10 - 0.5 * (((conf_content.page - 1) * conf_content.size + i) // 5), 1.0)

    end_time = time.time()

    response = Response(
        time=round(end_time - start_time, 2),
        number=len(result_of_multi_kg),
        res=SearchResult(search=target_vertexes)
    )
    return response


@router.get('', response_model=ASResponse)
async def get(query: str, page: int, size: int, kg_id: Optional[str] = ""):
    """
    AS搜索接口
    """
    start_time = time.time()
    conf_info = await get_adv_conf(ids=kg_id, ids_type="kg_id" if kg_id else "all")
    kg_id_to_search_engine, kg_id_to_search_kwargs = await init_search_engine(conf_info)
    tasks = []
    for kg_id, search_engine in kg_id_to_search_engine.items():
        tasks.append(asyncio.create_task(search_engine.search(query, **kg_id_to_search_kwargs[kg_id])))

    result_of_multi_kg = []
    for task in tasks:
        result_of_one_kg = await task
        result_of_multi_kg += result_of_one_kg

    # 对搜索结果按得分排序
    target_vertexes = sorted(result_of_multi_kg, key=attrgetter('score'), reverse=True)[(page - 1) * size:page * size]

    as_target_vertexes = []
    for i, target_vertex in enumerate(target_vertexes):
        # # 展示分数
        # target_vertex.score = max(10 - 0.5 * (((page - 1) * size + i) // 5), 1.0)
        as_target_vertex = ASTargetVertex(
            kg_id=target_vertex.kg_id,
            labels=target_vertex.tag,
            score=max(target_vertex.score, 10.0),
            gns=target_vertex.properties["gns"]
        )
        as_target_vertexes.append(as_target_vertex)

    end_time = time.time()

    response = ASResponse(
        time=round(end_time - start_time, 2),
        number=len(result_of_multi_kg),
        res=ASSearchResult(search=as_target_vertexes)
    )
    return response

# -*- coding:utf-8 -*-
import re
from flask import Blueprint, jsonify
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus
from service.graph_Service import graph_Service
from dao.graphdb_dao import GraphDB
from dao.graph_dao import graph_dao
import threading
from utils.ConnectUtil import redisConnect

rebuild_fulltextindex_controller_app = Blueprint('rebuild_fulltextindex_controller_app', __name__)

@rebuild_fulltextindex_controller_app.route('/<KDB_name>', methods=["POST"])
def rebuild_fulltextindex(KDB_name):
    '''提交重建索引任务'''
    try:
        if not re.search(u'^[a-z]+[_a-z0-9]*$', KDB_name):
            return Gview.TErrorreturn(
                ErrorCode='Builder.controller.graph_config.getKDBname.KDBnameWrongFormat',
                Description='KDB_name must be lowercase character, number and underline and starts with lowercase character.',
                ErrorDetails='KDB_name must be lowercase character, number and underline and starts with lowercase character.',
                Solution='please check your KDB_name',
                ErrorLink=''
            ), 400
        df = graph_dao.get_config_id_by_KDB_name(KDB_name)
        df = df.to_dict('records')
        # KDB_name不存在
        if len(df) == 0:
            return Gview.TErrorreturn(
                ErrorCode='Builder.controller.graph_config.getKDBname.KDBnameNotFound',
                Description='KDB_name is not found',
                ErrorDetails='KDB_name is not found',
                Solution='please check your KDB_name',
                ErrorLink=''
            ), 400
        graph_id = df[0]['KG_config_id']
        ret_code, obj = graph_Service.getGraphById(graph_id, "")
        # graph_id 不存在
        if ret_code != 200:
            return Gview.TErrorreturn(
                ErrorCode='Builder.controller.graph_config.getgraphid.graphidNotFound',
                Description='graph_id is not found',
                ErrorDetails='can\'t find graph_id which id got from KDB_name',
                Solution='Database information has conflicts. Please check table knowledge_graph and table graph_config_table',
                ErrorLink=''
            ), 500
        res = obj["res"]
        graph_baseInfo = res["graph_baseInfo"]
        graph_db_id = 0
        for baseInfo in graph_baseInfo:
            graph_db_id = baseInfo["graph_db_id"]
        graphdb = GraphDB(graph_db_id)
        if graphdb.type != 'nebula':
            return Gview.TErrorreturn(
                ErrorCode='Builder.controller.rebuild_fulltextindex.get_graphdb_type.graphdb_type_error',
                Description='graph_db type must be nebula',
                ErrorDetails='graph_db type must be nebula. This graph_db type is {}'.format(graphdb.type),
                Solution='This graph can\'t rebuild fulltextindex. Please change a graph.',
                ErrorLink=''
            ), 500
        # 获取需要创建索引的本体属性信息
        graph_otl = res["graph_otl"]
        graph_otl_info = graph_otl[0]
        entity = graph_otl_info["entity"]
        edge = graph_otl_info["edge"]
        tag_pro_index = {}
        edge_pro_index = {}
        for i in entity:
            tag_pro_index[i["name"]] = i["properties_index"]
        for i in edge:
            edge_pro_index[i["name"]] = i["properties_index"]
        
        redis = redisConnect.connect_redis("0", model="write")
        redis.set(f"rebuild_flag_{graph_id}", 1, ex=86400)
        t = threading.Thread(target=graphdb.fulltext_rebuild_nebula, 
                             args=(tag_pro_index, edge_pro_index, graph_id, KDB_name))
        t.start()
        res = 'rebuild fulltext task started.'
        result = {"res": res}
        return result
    except Exception as e:
        return str(e), 500

@rebuild_fulltextindex_controller_app.route('/<KDB_name>', methods=["GET"])
def rebuild_status(KDB_name):
    '''获取重建索引状态'''
    if not re.search(u'^[a-z]+[_a-z0-9]*$', KDB_name):
        return Gview.TErrorreturn(
            ErrorCode='Builder.controller.graph_config.getKDBname.KDBnameWrongFormat',
            Description='KDB_name must be lowercase character, number and underline and starts with lowercase character.',
            ErrorDetails='KDB_name must be lowercase character, number and underline and starts with lowercase character.',
            Solution='please check your KDB_name',
            ErrorLink=''
        ), 400
    df = graph_dao.get_config_id_by_KDB_name(KDB_name)
    df = df.to_dict('records')
    # KDB_name不存在
    if len(df) == 0:
        return Gview.TErrorreturn(
            ErrorCode='Builder.controller.graph_config.getKDBname.KDBnameNotFound',
            Description='KDB_name is not found',
            ErrorDetails='KDB_name is not found',
            Solution='please check your KDB_name',
            ErrorLink=''
        ), 400
    graph_id = df[0]['KG_config_id']
    ret_code, obj = graph_Service.getGraphById(graph_id, "")
    # graph_id 不存在
    if ret_code != 200:
        return Gview.TErrorreturn(
            ErrorCode='Builder.controller.graph_config.getgraphid.graphidNotFound',
            Description='graph_id is not found',
            ErrorDetails='can\'t find graph_id which id got from KDB_name',
            Solution='Database information has conflicts. Please check table knowledge_graph and table graph_config_table',
            ErrorLink=''
        ), 500
    redis = redisConnect.connect_redis("0", model="read")
    status = redis.get(f"rebuild_flag_{graph_id}")
    if not status or status.decode("utf-8") == '0':
        res = 'rebuild fulltext task finished.'
        result = {"res": res}
        return result
    else:
        res = 'rebuild fulltext task still running.'
        result = {"res": res}
        return result
import os
import time

import requests
import yaml
from flasgger import swag_from
from flask import Blueprint, jsonify

from common.errorcode import codes
from common.errorcode.gview import Gview as Gview2
from controller import celery_controller
from dao.graph_dao import graph_dao
from dao.graphdb_dao import GraphDB
from dao.intelligence_dao import intelligence_dao
from dao.task_dao import task_dao
from service.graph_Service import graph_Service
from utils.ConnectUtil import redisConnect
from utils.Gview import Gview
from utils.common_response_status import CommonResponseStatus

graph_count_controller_app = Blueprint('graph_count_controller_app', __name__)
graph_count_controller_app_open = Blueprint('graph_count_controller_app_open', __name__)

GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH', os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r', encoding='utf-8') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_old_response.yaml'), 'r', encoding='utf-8') as f:
    swagger_old_response = yaml.load(f, Loader=yaml.FullLoader)
    swagger_old_response.update(swagger_definitions)


def get_entity_egdes_num(graph_id):
    '''统计实体和边分别对应的个数
    Returns:
        code: 返回码
        res: 正确则返回下列值
            edges: 边的总数
            entities: 点的总数
            name2count: {点/边的名字: 个数}
            edge2pros: {边名: 属性个数}
            entity2pros: {实体名: 属性个数}
    '''
    ret_code, obj = graph_Service.getGraphById(graph_id, "")
    if ret_code != 200:
        return '0'
    res = obj["res"]
    if not bool(obj["res"]):
        return '0'
    graph_baseInfo = res["graph_baseInfo"]
    dbname = graph_baseInfo["graph_DBName"]
    graphdb = GraphDB()

    try:
        if dbname:
            code, res = graphdb.count(dbname)
            if code != codes.successCode:
                if code == codes.Builder_GraphdbDao_Count_GraphDBConnectionError:
                    res = Gview2.TErrorreturn(code,
                                              cause='{} connection error'.format(dbname),
                                              description='{} connection error'.format(dbname))
                elif code == codes.Builder_GraphdbDao_Count_DBNameNotExitsError:
                    res = Gview2.TErrorreturn(code,
                                              db_name=dbname,
                                              graphdb_address=graphdb.address,
                                              graphdb_port=graphdb.port,
                                              graphdb_type=graphdb.type)
                elif code == codes.Builder_GraphdbDao_CountOrientdb_OrientdbRequestError:
                    res = Gview2.TErrorreturn(code,
                                              cause=res['cause'],
                                              description=res['description'])
                elif code == codes.Builder_GraphdbDao_CountNebula_NebulaExecError:
                    res = Gview2.TErrorreturn(code,
                                              cause=res['cause'],
                                              description=res['description'])
                return code, res
            edges, entities, name2count, entity_count, edge_count, edge2pros, entity2pros = res
            return codes.successCode, (edges, entities, name2count, edge2pros, entity2pros)
        else:
            return codes.successCode, (0, 0, {}, {}, {})
    except Exception:
        return codes.successCode, (0, 0, {}, {}, {})


def getGraphCountByid(graph_id):
    edges, entities, edge_pros, entity_pros, properties = 0, 0, 0, 0, 0
    code, res = get_entity_egdes_num(graph_id)
    if code != codes.successCode:
        return code, res
    else:
        edges, entities, name2count, edge2pros, entity2pros = res
        if len(edge2pros.keys()) > 0 and len(name2count.keys()) > 0:
            for k in edge2pros.keys():
                if k in name2count:
                    edge_pros += name2count[k] * edge2pros[k]

        if len(entity2pros.keys()) > 0 and len(name2count.keys()) > 0:
            for k in entity2pros.keys():
                if k in name2count:
                    entity_pros += name2count[k] * entity2pros[k]
        properties = edge_pros + entity_pros
        return codes.successCode, (edges, entities, edge_pros, entity_pros, properties)


def getGraphCount(graph_id):
    edges, entities, edge_pros, entity_pros, properties = 0, 0, 0, 0, 0
    code, res = get_entity_egdes_num(graph_id)
    if code != codes.successCode:
        return code, res
    edges, entities, name2count, edge2pros, entity2pros = res
    properties = edges + entities
    return codes.successCode, (edges, entities, edge_pros, entity_pros, properties)


def update_rabbitmq_capacity():
    datas = task_dao.get_running_rabbitmq()
    if len(datas) > 0:
        for data in datas:
            graph_id = data['graph_id']
            db = data['KDB_name']
            graphdb = GraphDB()

            if graphdb.type == 'nebula':
                # nebula 统计知识量
                graphdb.submit_job_nebula(db, graph_id, 'stats')
                time_out = 60 * 60  # 超时时间为1h
                while not graphdb.job_status_nebula(db, graph_id):
                    time.sleep(5)
                    time_out -= 5
                    if time_out < 0:
                        break

            code, res = getGraphCountByid(graph_id)
            edges, entities, edge_pros, entity_pros, properties = res
            intelligence_dao.update_rabbitmq_knowledge(entity_pros, edge_pros, edges+entities, graph_id)


def get_graph_count_all():
    '''
    GET请求：返回所有图谱的entity、edge、property总数量
    '''
    entities, edges, properties, all_num = 0, 0, 0, 0
    # select 所有的graph_id对应的graph_baseInfo
    graph_infos = graph_dao.getAllGraph()

    for info in graph_infos:
        graph_id = info["id"]
        code, res = getGraphCountByid(graph_id)
        if code == codes.successCode:
            edge_nums, entity_nums, edge_pro, entity_pro, pros = res

            entities += entity_nums
            edges += edge_nums
            properties += pros
        else:
            return code, res

    res = {
        "entities": entities,
        "edges": edges,
        "pro": properties,
        "all": properties
    }

    return codes.successCode, res


@graph_count_controller_app.route('', methods=['GET'])
def get_all_knowledge():
    try:
        res = {}
        ret = intelligence_dao.get_all_knowledge()
        all_knowledge = ret[0]['all_knowledge']
        res["all_knowledge"] = all_knowledge if all_knowledge else 0
        db = "0"
        r = redisConnect.connect_redis(db, model="read")
        if r.get("license_knowledge_limit"):
            capacity = int(r.get("license_knowledge_limit"))
        else:
            capacity = 10000000
        res["knowledge_limit"] = capacity
        return jsonify(res), 200
    except Exception:
        result = {
            "ErrorCode": "Builder.Controller.GraphCountController.GetALlKnowledge.InternalError",
            "Description": "get all knowledge internal error",
            "ErrorDetails": "get all knowledge internal error",
            "Solution": "Please contact the developers."
        }
        return result, 500


@graph_count_controller_app.route('/<graph_id>', methods=["GET"])
def graphs_count_by_id(graph_id):
    # graph_id 不是int
    if not graph_id.isdigit():
        return Gview.BuFailVreturn(cause="graph_id must be int ", code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="param error "), CommonResponseStatus.BAD_REQUEST.value
    # graph_id 不存在
    code, ret = graph_Service.checkById(graph_id)
    if code != 0:
        return jsonify(ret), 500
    code, resp = getGraphCount(graph_id)
    if code != codes.successCode:
        edges, entities, properties = "--", "--", "--"
    else:
        edges, entities, edge_pros, entity_pros, properties = resp
    res = {
        "entity_pro": entities,
        "edge_pro": edges,
        "pros": properties
    }
    result = {"res": res}
    return result


# open api获取图数据库点和边数量
@graph_count_controller_app_open.route('/<graph_id>', methods=["GET"])
@swag_from(swagger_old_response)
def graphs_count_by_id(graph_id):
    '''
    图谱知识量统计接口
    图谱知识量统计接口
    ---
    operationId: graphs_count_by_id
    parameters:
        -   name: graph_id
            in: path
            required: true
            description: 图谱配置id
            schema:
                type: integer
    responses:
        '200':
            description: 操作成功
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/builder.graph_count.graphs_count_by_id_response200'
    '''
    status = 0
    # graph_id 不是int
    if not graph_id.isdigit():
        return Gview.BuFailVreturn(cause="graph_id must be int ", code=CommonResponseStatus.PARAMETERS_ERROR.value,
                                   message="param error "), CommonResponseStatus.BAD_REQUEST.value
    # graph_id 不存在
    code, ret = graph_Service.checkById(graph_id)
    if code != 0:
        return jsonify(ret), 500
        # return Gview.BuFailVreturn(cause=ret["cause"], code=ret["code"],
        #                            message=ret["message"]), CommonResponseStatus.REQUEST_ERROR.value

    code, resp = getGraphCount(graph_id)
    if code != codes.successCode:
        edges, entities, properties = 0, 0, 0
        status = -1
    else:
        edges, entities, edge_pros, entity_pros, properties = resp
    res = {
        "entity_pro": entities,
        "edge_pro": edges,
        "pros": properties,
        "status": status
    }
    result = {"res": res}
    return result

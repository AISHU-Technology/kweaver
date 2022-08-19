# -*-coding:utf-8-*-
# @Author: Lowe.li
# @Email: Lowe.li@aishu.cn
# @CreatDate: 2020/6/30 14:50
import copy
import os
import sys

sys.path.append(os.path.abspath("../"))
os.environ['GBUILDER_ROOT_PATH'] = os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from flask import Flask, request, g, jsonify, current_app, send_from_directory, session, make_response, redirect
from config import config
from utils.Gresponse import Gresponse
from utils.Gview import Gview
import json
from third_party_service.permission_manager import Permission
import logging

from common.international import bind_i18n

# from flask_cors import *

app = Flask(__name__)
app.config.from_object(config)

# 开启国际化
bind_i18n(app)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(lineno)d - %(message)s')
logger = logging.getLogger(__name__)


# CORS(app, resources=r'/*')

@app.before_request
def before_request():
    path = request.path
    method = request.method
    print("path: ", path)
    print("method: ", method)
    permission = Permission()
    # GET请求：返回所有图谱信息;
    # if path == "/api/builder/v1/graph/" and method == "GET":
    #     res_message, res_code = permission.graphGet()
    #     if res_code != 0:
    #         return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
    #                                    message=res_message["message"]), res_code
    #     return None
    # POST请求：新增图谱
    if path == "/api/builder/v1/graph" and method == "POST":
        res_message, res_code = permission.graphCreate()
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None
    # 图谱编辑
    elif path == "/api/builder/v1/graph/output" and method == "POST":
        params_json = request.get_data()
        params_json = json.loads(params_json)
        res_message, res_code = permission.graph_output(params_json)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None
    elif path == "/api/builder/v1/graph/input" and method == "POST":
        knw_id = request.form.get("knw_id", None)
        graph_id = request.form.get("graph_id")
        method = request.form.get("method")
        files = request.files.getlist("file")
        res_message, res_code = permission.graph_input(knw_id, graph_id, method, files)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None
    elif "/api/builder/v1/graph" in path and method == "POST":
        graphid = path.split("/")[-1]
        if graphid not in ["check_kmapinfo", "getgraphbygns", "delbyids", "graph_info", "query", "savenocheck",
                           "infoext_list"]:
            res_message, res_code = permission.graphEdit(graphid=graphid)
            if res_code != 0:
                return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                           message=res_message["message"]), res_code
        return None

    # 定时任务增删改查权限与图谱编辑权限保持一致
    elif "/api/builder/v1/timer" in path:
        if method == "GET":
            body = request.args.to_dict()
            graphid = body.get('graph_id', '')
        else:
            graphid = path.split("/")[-1]
        http_code, data = permission.TimerTask(graphid=graphid)
        if http_code != 200:
            return Gview.TErrorreturn(data['error_code'], data['desc'], data['solution'], data['detail'],
                                      data['error_link']), http_code
        return None
    # 返回数据源
    elif path == "/api/builder/v1/ds" and method == "GET":
        return None
    # 新建数据源
    elif path == "/api/builder/v1/ds" and method == "POST":
        res_message, res_code = permission.dsmCreate()
        if res_code != 0:
            return Gview.TErrorreturn(ErrorCode=res_message["code"], Description=res_message["cause"],
                                      Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                      ErrorLink=""), res_code
        return None
    # 编辑数据源
    elif "/api/builder/v1/ds" in path and method == "PUT":
        dsid = path.split("/")[-1]
        res_message, res_code = permission.dsmEdit(dsid=dsid)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None
    # 删除数据源
    elif "/api/builder/v1/ds/delbydsids" in path and method == "DELETE":
        res_message, res_code = permission.dsmDelete()
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None

    # POST请求,新增本体
    elif path == "/api/builder/v1/onto/saveontology" and method == "POST":
        params_json = request.get_data()
        params_json = json.loads(params_json)
        res_message, res_code = permission.ontoCreate(params_json)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None

    # 删除本体
    elif path == "/api/builder/v1/onto/delotlbyids" and method == "DELETE":
        res_message, res_code = permission.ontoDelete()
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None
    # 运行任务
    elif "/api/builder/v1/task" in path and "stoptask" not in path and "gettaskinfo" not in path and method == "POST":
        graph_id = path.split("/")[-1]
        res_message, res_code = permission.task_run(graph_id)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None
    # 删除任务
    elif "/api/builder/v1/task" in path and method == "DELETE":
        graph_id = path.split("/")[-1]
        res_message, res_code = permission.task_delete(graph_id)
        if isinstance(res_message, dict) and 'code' in res_message:
            if res_message["code"] == "Manager.Graph.KnowledgeNetworkNotFoundError":
                res_message["code"] = 500021
                res_message["cause"] = "graph_id is not exist"
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
    # 任务详情
    elif "/api/builder/v1/task/getdetail" in path and method == "GET":
        graph_id = path.split("/")[-1]
        res_message, res_code = permission.task_detail(graph_id)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
    # 中止任务
    elif "/api/builder/v1/task/stoptask" in path and method == "POST":
        graph_id = path.split("/")[-1]
        res_message, res_code = permission.task_stop(graph_id)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
    # 历史记录
    elif "/api/builder/v1/task/get_history_data/" in path and method == "GET":
        graph_id = path.split("/")[-1]
        res_message, res_code = permission.task_history(graph_id)
        if res_code != 0:
            return Gview.TErrorreturn(res_message["code"], res_message["message"], res_message["solution"],
                                      res_message["cause"], ""), res_code

    # 任务进度
    elif "/api/builder/v1/task/get_progress" in path and method == "GET":
        graph_id = path.split("/")[-1]
        res_message, res_code = permission.task_progress(graph_id)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code

    # 知识网络
    elif "/api/builder/v1/knw" in path:
        res_message, res_code = permission.knowledgeNetwork()
        if res_code != 0:
            return Gview.TErrorreturn("Builder.main.builder_app.before_request.KnwError",
                                      res_message["cause"], res_message["message"], res_message["cause"], ""), res_code
    else:
        return None


# @app.after_request
# def af_request(resp):
#     req_met = request.method
#     if req_met == "OPTIONS":
#         return resp
#     else:
#         resp = make_response(resp)
#
#         authorization = g.authorization
#         authorization = authorization["Authorization"]
#         # hflog.info("request token:%s " % authorization)
#         if authorization is not None:
#             resp.headers.add("Access-Control-Expose-Headers","Authorization")
#             resp.headers.add("Authorization", authorization)
#         return resp
#
# @app.before_request
# def beforeRequest():
#     """
#     前置钩子
#     :return:
#     """
#     # verify authority
#     req_met = request.method
#     if req_met == "OPTIONS":
#         pass
#     else:
#         author = request.headers.get('Authorization')
#         hflog.info("request token:%s " % author)
#         authorization = {"Authorization": None}
#         g.authorization = authorization
#         if author == "" or author == None:
#             return {"Code": "400001", "Cause": "Authorization is invalid", "message": "Authorization is invalid"}, 401
#         try:
#             info = jwt.decode(author, key="AnyDATA", algorithms=['HS256'])
#
#             current_time = datetime.datetime.now()
#             current_timestap = time.mktime(current_time.timetuple())
#             if (current_timestap - info["iat"]) > 15 * 60:
#                 dtime = datetime.datetime.now()
#                 un_time = time.mktime(dtime.timetuple())
#                 exp = datetime.datetime.now() + datetime.timedelta(minutes=30)
#                 exp = time.mktime(exp.timetuple())
#                 payload = {
#                     'user': info["user"],
#                     'iss': "aishu.cn",
#                     "iat": un_time,
#                     'exp': exp,  # 过期时间
#                     'type': info["type"],
#                     'id': info["id"]
#                 }
#                 try:
#                     token = jwt.encode(payload, "AnyDATA", algorithm='HS256').decode("ascii")
#                     author_token = g.authorization
#                     author_token["Authorization"] = token
#                     hflog.info("jwt token:%s " % token)
#                 except Exception as e:
#                     err = repr(e)
#                     return {"Code": "400001", "Cause": err, "message": err}, 401
#
#         except ExpiredSignatureError:
#             return {"Code": "400002", "Cause": "Authorization is expired", "message": "Authorization is expired"}, 401
#         except Exception as e:
#             err = repr(e)
#             return {"Code": "400003", "Cause": err, "message": err}, 401


# @app.after_request
# def afterRequest(response):
#     """
#     后置钩子
#     :param f:
#     :return:
#     """
#     # session.permanent = True
#     # app.permanent_session_lifetime = datetime.timedelta(minutes=1)  # 设置session到期时间
#
#     data = json.loads(response.data.decode('utf-8').replace("None", ' '))
#     if hasattr(g, 'request_info_dict'):
#         request_info_dict = copy.copy(g.request_info_dict)
#         if 'LOG_TYPE' in request_info_dict:
#             del request_info_dict['LOG_TYPE']
#         log_response_dict = {'RESPONSE_INFO': data, 'REQUEST_INFO': request_info_dict,  'LOG_TYPE': 'response_info'}
#         hflog.info(json.dumps(log_response_dict))
#
#     return Grequest.afterRequest(response)
#
#
# @app.teardown_request
# def exceptionRequest(exception):
#     """
#     异常钩子
#     :param exception:
#     :return:
#     """
#     return Gview.Vfail(None, repr(exception))
#
#
# @app.errorhandler(Exception)
# def exception500(exception):
#     """
#     http异常处理钩子
#     :param error:
#     :return:
#     """
#     log_error_dict = {'ERROR_INFO': repr(exception), 'LOG_TYPE': 'error_info'}
#     if hasattr(g, 'request_info_dict'):
#         request_info_dict = copy.copy(g.request_info_dict)
#         if 'LOG_TYPE' in request_info_dict:
#             del request_info_dict['LOG_TYPE']
#         log_error_dict['REQUEST_INFO'] = request_info_dict
#     hflog.error(json.dumps(log_error_dict))
#
#     return Gview.Vfail(None, repr(exception))
#
#
# @app.errorhandler(404)
# def exception404(error):
#     """
#     http异常处理钩子
#     :param error:
#     :return:
#     """
#     return Gview.Vreturn(404, None, repr(error))


from controller.dsm_controller import dsm_controller_app
from controller.ontologym_controller import ontology_controller_app, ontology_controller_open
# from controller.streamline_line import streamline_controller_app
from controller.graph_controller import graph_controller_app, graph_controller_open
from controller.celery_controller_open_kc import task_controller_open_kc
from controller.celery_controller import task_controller_app
from controller.graph_count_controller import graph_count_controller_app
from controller.graph_count_controller import graph_count_controller_app_open
from controller.timer_controller import timer_controller_app
from controller.rebuild_fulltextindex_controller import rebuild_fulltextindex_controller_app
from controller.knowledgeNetwork_controller import knowledgeNetwork_controller_app

# from controller.test_blue import  test_app
app.register_blueprint(dsm_controller_app, url_prefix='/api/builder/v1/ds')

app.register_blueprint(ontology_controller_app, url_prefix='/api/builder/v1/onto')
app.register_blueprint(ontology_controller_open, url_prefix='/api/builder/v1/open/onto')

# app.register_blueprint(streamline_controller_app, url_prefix='/api/builder/v1/streamline')
app.register_blueprint(graph_controller_app, url_prefix='/api/builder/v1/graph')
app.register_blueprint(graph_controller_open, url_prefix='/api/builder/v1/open/graph')

app.register_blueprint(task_controller_app, name="task_controller_app_open", url_prefix='/api/builder/v1/open/task')
app.register_blueprint(task_controller_app, name="task_controller_app", url_prefix='/api/builder/v1/task')

app.register_blueprint(graph_count_controller_app, url_prefix='/api/builder/v1/graphcount')
app.register_blueprint(graph_count_controller_app_open, url_prefix='/api/builder/v1/open/graphcount')
# app.register_blueprint(dsm_controller_app, url_prefix='/api/builder/v1/acctoken')

app.register_blueprint(rebuild_fulltextindex_controller_app, url_prefix='/api/builder/v1/fulltextindex')
app.register_blueprint(task_controller_open_kc, url_prefix='/api/builder/v1/open/kc')
app.register_blueprint(timer_controller_app, url_prefix='/api/builder/v1/timer')

app.register_blueprint(knowledgeNetwork_controller_app, name="knowledgeNetwork_controller_app",
                       url_prefix='/api/builder/v1/knw')
app.register_blueprint(knowledgeNetwork_controller_app, name="knowledgeNetwork_controller_app_open",
                       url_prefix='/api/builder/v1/open/knw')
# app.register_blueprint(test_app, url_prefix='/test')
app.response_class = Gresponse
# app.config['SECRET_KEY'] = 'you never guess'
if __name__ == '__main__':
    import sys
    import os

    print("ENV RDSHOST : ", os.getenv("RDSHOST"))
    print("ENV RDSPORT:  ", eval(os.getenv("RDSPORT")))
    print("ENV RDSUSER : ", os.getenv("RDSUSER"))
    print("ENV RDSDBNAME : ", os.getenv("RDSDBNAME"))
    # host_str = '0.0.0.0'
    # host_str = '10.2.196.58'
    # 初始化，先清除redis任务的状态
    from dao.task_dao import task_dao
    from dao.task_onto_dao import task_dao_onto

    print("开始连库")
    ## 因为celery得不到所有的key所以需要先注释掉
    task_dao.initredis()
    print("连库完成")
    task_dao.init_graph_count()
    task_dao_onto.initredis_onto()
    app.run(host=config.builder_ip, port=int(config.builder_port), debug=config.builder_debug)

# -*-coding:utf-8-*-
# @Author: Lowe.li
# @Email: Lowe.li@aishu.cn
# @CreatDate: 2020/6/30 14:50
import os
import sys
sys.path.insert(0, os.path.abspath("../"))
os.environ['GBUILDER_ROOT_PATH'] = os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from flask import Flask, request, g, jsonify, current_app, send_from_directory, session, make_response, redirect
from config import config
from utils.Gresponse import Gresponse
from utils.Gview import Gview
import json
from utils.graph_param_validate import GraphParamValidate
from common.international import bind_i18n
from flasgger import Swagger, LazyString, LazyJSONEncoder
import yaml
from utils.log_info import Logger
from common.errorcode import codes

app = Flask(__name__)
app.config.from_object(config)
# 上传文件最大限制为50M
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# 开启国际化
bind_i18n(app)

# 生成swagger文档
# 由于flasgger>=0.9.6b1才对openapi 3.0.2支持度较好，但是最新的发行版本为0.9.5，
# 在生产环境中不方便使用，因此在本地生成文档swagger_json.json之后直接使用
GBUILDER_ROOT_PATH = os.getenv('GBUILDER_ROOT_PATH', os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_template.yaml'), 'r', encoding='utf-8') as f:
    swagger_template = yaml.load(f, Loader=yaml.FullLoader)
with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_definitions.yaml'), 'r', encoding='utf-8') as f:
    swagger_definitions = yaml.load(f, Loader=yaml.FullLoader)
app.json_encoder = LazyJSONEncoder
swagger_config = Swagger.DEFAULT_CONFIG
swagger_config['specs'][0]['rule_filter'] = lambda rule: False  # 不生成文档
swagger_config['openapi'] = '3.0.2'  # flasgger>=0.9.6b1 才对openapi 3.0.2支持度较好
swagger_config['uiversion'] = 3
swagger_config['components'] = swagger_definitions['components']
swagger = Swagger(app, template=swagger_template,
                  sanitizer=lambda text: text.replace('\n', '')  # 描述中会有\n字符，通过此配置过滤掉，默认的sanitizer将\n替换为<br/>
                  )
# 返回本地openapi文档
@app.route('/swagger_json.json')
def get_oenapi_doc():
    with open(os.path.join(GBUILDER_ROOT_PATH, 'docs/swagger_json.json'), 'r', encoding='utf-8') as f:
        return f.read()

# CORS(app, resources=r'/*')

# from limiter import Limiter, MemoryStorage
# tokenBucketLimit = int(os.getenv("RPS_LIMIT", 1))
#
# # 创建一个令牌桶限流器，设置容量为tokenBucketLimit，每秒产生tokenBucketLimit个令牌
# bucket = Limiter(capacity=tokenBucketLimit, rate=tokenBucketLimit, storage=MemoryStorage())

@app.before_request
def before_request():
    path = request.path
    method = request.method
    Logger.log_info("path: {}".format(path))
    Logger.log_info("method: {}".format(method))
    graphParamValidate = GraphParamValidate(method)
    # POST请求：新增图谱
    if path == "/api/builder/v1/graph/add" and method == "POST":
        res_message, res_code = graphParamValidate.graphCreate()
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None
    elif (path == "/api/builder/v1/graph/output" or path == "/api/builder/v1/open/graph/output") and method == "POST":
        params_json = request.get_data()
        params_json = json.loads(params_json)
        res_message, res_code = graphParamValidate.graph_output(params_json)
        if res_code != 0:
            return Gview.TErrorreturn(ErrorCode=codes.Builder_BuilderApp_BeforeRequest_ParametersError, Description=res_message["cause"],
                                      Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                      ErrorLink=""), res_code
        return None
    elif (path == "/api/builder/v1/graph/input" or path == "/api/builder/v1/open/graph/input") and method == "POST":
        knw_id = request.form.get("knw_id")
        files = request.files.getlist("file")
        ds_id_map = request.form.get("ds_id_map", "{}")
        rename = request.form.get("rename", "")
        res_message, res_code = graphParamValidate.graph_input(knw_id, files, ds_id_map, rename)
        if res_code != 0:
            return Gview.TErrorreturn(ErrorCode=codes.Builder_BuilderApp_BeforeRequest_ParametersError, Description=res_message["cause"],
                                      Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                      ErrorLink=""), res_code
        return None
    # 定时任务增删改查权限与图谱编辑权限保持一致
    elif "/api/builder/v1/timer" in path:
        if method == "GET":
            body = request.args.to_dict()
            graphid = body.get('graph_id', '')
        else:
            graphid = path.split("/")[-1]
        http_code, data = graphParamValidate.TimerTask(graphid=graphid)
        if http_code != 200:
            return Gview.TErrorreturn(data['error_code'], data['desc'], data['solution'], data['detail'],
                                      data['error_link']), http_code
        return None
    # 返回数据源
    elif path == "/api/builder/v1/ds/page" and method == "GET":
        return None
    # 新建数据源
    elif path == "/api/builder/v1/ds/add" and method == "POST":
        res_message, res_code = graphParamValidate.dsmCreate()
        if res_code != 0:
            return Gview.TErrorreturn(ErrorCode=res_message["code"], Description=res_message["cause"],
                                      Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                      ErrorLink=""), res_code
        return None
    # 编辑数据源
    elif "/api/builder/v1/ds/edit" in path and len(path.split('/')) == 6 and path.split('/')[-1].isdigit() and method == "POST":
        dsid = path.split("/")[-1]
        res_message, res_code = graphParamValidate.dsmEdit(dsid=dsid)
        if res_code != 0:
            return Gview.TErrorreturn(ErrorCode=codes.Builder_BuilderApp_BeforeRequest_ParametersError, Description=res_message["cause"],
                                      Solution=res_message["cause"], ErrorDetails=res_message["message"],
                                      ErrorLink=""), res_code
        return None
    # 删除数据源
    elif "/api/builder/v1/ds/delete" in path and method == "DELETE":
        res_message, res_code = graphParamValidate.dsmDelete()
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None

    # 删除本体
    elif path == "/api/builder/v1/onto/delete" and method == "DELETE":
        res_message, res_code = graphParamValidate.ontoDelete()
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None
    # 运行任务
    elif "/api/builder/v1/task" in path and "stop" not in path and "gettaskinfo" not in path and method == "POST":
        graph_id = path.split("/")[-1]
        res_message, res_code = graphParamValidate.task_run(graph_id)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
        return None
    # 删除任务
    elif "/api/builder/v1/task" in path and method == "DELETE":
        graph_id = path.split("/")[-1]
        res_message, res_code = graphParamValidate.task_delete(graph_id)
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
        res_message, res_code = graphParamValidate.task_detail(graph_id)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code
    # 历史记录
    elif "/api/builder/v1/task/get_history_data/" in path and method == "GET":
        graph_id = path.split("/")[-1]
        res_message, res_code = graphParamValidate.task_history(graph_id)
        if res_code != 0:
            return Gview.TErrorreturn(res_message["code"], res_message["message"], res_message["solution"],
                                      res_message["cause"], ""), res_code

    # 任务进度
    elif "/api/builder/v1/task/get_progress" in path and method == "GET":
        graph_id = path.split("/")[-1]
        res_message, res_code = graphParamValidate.task_progress(graph_id)
        if res_code != 0:
            return Gview.BuFailVreturn(cause=res_message["cause"], code=res_message["code"],
                                       message=res_message["message"]), res_code

    # 知识网络
    elif "/api/builder/v1/knw" in path:
        res_message, res_code = graphParamValidate.knowledgeNetwork()
        if res_code != 0:
            return Gview.TErrorreturn("Builder.main.builder_app.before_request.KnwError",
                                      res_message["cause"], res_message["message"], res_message["cause"], ""), res_code
    else:
        return None


from controller.dsm_controller import dsm_controller_app, dsm_controller_open
from controller.ontology_controller import ontology_controller_app, ontology_controller_open
from controller.graph_controller import graph_controller_app, graph_controller_open
from controller.celery_controller import task_controller_app
from controller.graph_count_controller import graph_count_controller_app
from controller.graph_count_controller import graph_count_controller_app_open
from controller.timer_controller import timer_controller_app
from controller.rebuild_fulltextindex_controller import rebuild_fulltextindex_controller_app
from controller.knowledgeNetwork_controller import knowledgeNetwork_controller_app
from controller.lexicon_controller import lexicon_controller_app
from controller.function_controller import function_controller_app
from controller.taxonomy_controller import taxonomy_controller_app

# from controller.test_blue import  test_app
app.register_blueprint(dsm_controller_app, url_prefix='/api/builder/v1/ds')
app.register_blueprint(dsm_controller_open, url_prefix='/api/builder/v1/open/ds')

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

app.register_blueprint(rebuild_fulltextindex_controller_app, url_prefix='/api/builder/v1/fulltext_index')
app.register_blueprint(timer_controller_app, url_prefix='/api/builder/v1/timer')

app.register_blueprint(knowledgeNetwork_controller_app, name="knowledgeNetwork_controller_app",
                       url_prefix='/api/builder/v1/knw')
app.register_blueprint(knowledgeNetwork_controller_app, name="knowledgeNetwork_controller_app_open",
                       url_prefix='/api/builder/v1/open/knw')
app.register_blueprint(lexicon_controller_app, name="lexicon_controller_app",
                       url_prefix='/api/builder/v1/lexicon')
app.register_blueprint(lexicon_controller_app, name="lexicon_controller_app_open",
                       url_prefix='/api/builder/v1/open/lexicon')
app.register_blueprint(function_controller_app, name='function_controller_app',
                       url_prefix='/api/builder/v1/function')
app.register_blueprint(taxonomy_controller_app, name='taxonomy_controller_app',
                       url_prefix='/api/builder/v1/taxonomy')
# app.register_blueprint(test_app, url_prefix='/test')
app.response_class = Gresponse
# app.config['SECRET_KEY'] = 'you never guess'
if __name__ == '__main__':
    import sys
    import os

    Logger.log_info("ENV RDSHOST : {}".format(os.getenv("RDSHOST")))
    Logger.log_info("ENV RDSPORT:  {}".format(eval(os.getenv("RDSPORT"))))
    Logger.log_info("ENV RDSUSER : {}".format(os.getenv("RDSUSER")))
    Logger.log_info("ENV RDSDBNAME : {}".format(os.getenv("RDSDBNAME")))

    # 初始化，先清除redis任务的状态
    from dao.task_dao import task_dao
    from dao.task_onto_dao import task_dao_onto
    from dao.lexicon_dao import lexicon_dao
    ## 因为celery得不到所有的key所以需要先注释掉
    task_dao.initredis()
    task_dao.init_graph_count()
    task_dao_onto.initredis_onto()
    lexicon_dao.init_status()
    app.run(host="0.0.0.0", port=6475, debug=False)

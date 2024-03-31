from __future__ import absolute_import

import datetime
import json
import os
import sys
import time

sys.path.insert(0, os.path.abspath("../"))

from celery_task.transfer import MysqlTransfer, HiveTransfer, ClickHouseTransfer, KingbaseesTransfer, \
    SqlserverTransfer, PostgresqlTransfer
from dao.graphdb_dao import get_md5, normalize_text
from service.graph_Service import graph_Service
from utils.ConnectUtil import mongoConnect
from celery import Celery
from service.async_task_service import async_task_service
from service.intelligence_service import intelligence_calculate_service
from service.task_Service import task_service
from service.lexicon_service import lexicon_service
from config import config
from utils.database import DataBase
from utils.Otl_Util import otl_util
from utils.common_response_status import CommonResponseStatus
from utils.CommonUtil import RegularEnum
from flask_app import app
from dao.otl_dao import otl_dao
from dao.lexicon_dao import lexicon_dao
from dao.gridfs_dao import gridfs_dao
import traceback
from utils.log_info import Logger
import common.stand_log as log_oper
import pandas as pd
import uuid as uuid_obj
import warnings
from jsonschema import validate, ValidationError
import random
import re
from flask_babel import gettext as _l
import copy
from celery_task.graph_config import GraphKMapConfig, OntologyConfig

redis_cluster_mode = str(os.getenv("REDISCLUSTERMODE", ""))
if config.local_testing != True:
    if redis_cluster_mode == "sentinel":
        cel = Celery(app.name, broker=app.config['CELERY_BROKER_URL'],
                     broker_transport_options=app.config['CELERY_BROKER_TRANSPORT_OPTIONS'],
                     backend=app.config['CELERY_RESULT_BACKEND'],
                     result_backend_transport_options=app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS'],
                     include=[app.name])
        # @cel.task(name='cel.add', bind=True)
        # def add(self,x,y):
        #     result=x+y
        #     return result
        Logger.log_info("-------------------------celery config -------------------------")
        Logger.log_info(cel.conf.broker_url)
        cel.conf.broker_transport_options = app.config['CELERY_BROKER_TRANSPORT_OPTIONS']
        Logger.log_info(cel.conf.broker_transport_options)
        Logger.log_info(cel.conf.result_backend)
        cel.conf.result_backend_transport_options = app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS']
        Logger.log_info(cel.conf.result_backend_transport_options)
        cel.conf.update(app.config)
        Logger.log_info("-------------------------app+cel config -------------------------")
        Logger.log_info(cel.conf.broker_url)
        Logger.log_info(cel.conf.broker_transport_options)
        Logger.log_info(cel.conf.result_backend)
        Logger.log_info(cel.conf.result_backend_transport_options)
    else:
        # 初始化Celery
        cel = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'],
                     include=[app.name])
else:
    cel = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'],
                 include=[app.name])

    # 将Flask中的配置直接传递给Celery
    cel.conf.update(app.config)

cel.set_default()


@cel.task(name='cel.predict_ontology', bind=True)
def predict_ontology(self, new_params_json, task_id, userId):
    obj = {}
    try:
        ### 文件夹迭选
        #### 获取文件
        file_list = new_params_json["file_list"]
        tableinfo = []
        for i in range(len(file_list)):
            if new_params_json["data_source"]:
                tableinfo.append(
                    [str(file_list[i]), str(new_params_json["ds_path"]), str(new_params_json["dsname"]), "running",
                     str(new_params_json["data_source"])])
                # tableinfo: [[table_name, ds_path, ds_name, 'running', data_source]]
        new_params_json["table_list"] = tableinfo
        # 更新本体任务表的file_list字段
        add_code, add_res = task_service.update_otl_task_filelist(new_params_json["table_list"], task_id)
        if add_code != 200:
            ## 如果出現update死鎖 則重試
            if "Deadlock" in add_res['cause']:
                time.sleep(1)
                add_code1, add_res1 = task_service.update_otl_task_filelist(new_params_json["table_list"], task_id)
                if add_code1 != 200:
                    self.update_state(state="FAILURE", meta=add_res1)
            else:
                self.update_state(state="FAILURE", meta=add_res)
            return {'current': 100, 'total': 100}
        if len(new_params_json["table_list"]) == 0:
            res = {}
            res["entity_list"] = []
            res["entity_property_dict"] = []

            res["entity_relation_set"] = []
            res["entity_main_table_dict"] = []
            res["relation_main_table_dict"] = []
            res["relation_property_dict"] = []
            res["extract_type"] = "标准抽取"

            obj["res"] = res
            obj["file_list"] = []
            return obj
            # obj["res"] = res
        else:
            if len(new_params_json["table_list"]) > 100:
                new_params_json["table_list"] = new_params_json["table_list"][0:100]
            new_entity_property_dict = []
            new_entity_for_table_dict = []
            new_relation_property_dict = []
            new_relation_main_table = []
            new_relation_set = []
            try:
                new_params_json["newtablelist"] = new_params_json["table_list"]
                code_extract, res_extract = DataBase(new_params_json).get_entity_edge(new_params_json)
                if code_extract != CommonResponseStatus.SUCCESS.value:
                    self.update_state(state="FAILURE", meta=res_extract)
                    return {'current': 100, 'total': 100}
                new_entity_list = res_extract["res"]["entity_list"]
                new_entity_property_dict = res_extract["res"]["entity_property_dict"]
                for i in range(len(new_entity_property_dict)):
                    new_entity_property_dict[i]['property'] = [
                        {'name': p[0],
                         'alias': p[0],
                         'data_type': p[1],
                         'description': '',
                         'synonym': ''}
                        for p in res_extract["res"]["entity_property_dict"][i]['property']
                    ]

                new_entity_for_table_dict = res_extract["res"]["entity_main_table_dict"]

                res = {}
                res["entity_list"] = new_entity_list
                res["entity_property_dict"] = new_entity_property_dict
                res["entity_relation_set"] = new_relation_set
                res["entity_main_table_dict"] = new_entity_for_table_dict
                res["relation_main_table_dict"] = new_relation_main_table
                res["relation_property_dict"] = new_relation_property_dict
                res["extract_type"] = "标准抽取"
                obj["res"] = res
                obj["file_list"] = res_extract["file_list"]
                return obj
            except Exception as e:
                obj = {}
                err = repr(e)
                obj['cause'] = err
                obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                obj['message'] = "Predict ontology fail"
                self.update_state(state="FAILURE", meta=obj)
                return {'current': 100, 'total': 100}
    except Exception as e:
        traceback.print_exc()
        obj["cause"] = str(repr(e))
        obj["message"] = "predict ontology failed"
        obj["code"] = 500
        self.update_state(state="FAILURE", meta=obj)
        return {'current': 100, 'total': 100}


@cel.task(name='cel.intelligence_calculate', bind=True)
def intelligence_calculate(self, params_json, task_id):
    """
        execute intelligence computer task
    """
    if not task_id:
        # 没有关键参数 task_id， 直接退出
        error_log = log_oper.get_error_log("missing important argument [task_id] please check your argument list",
                                           sys._getframe())
        Logger.log_error(error_log)
        return
    try:
        update_json = dict()
        # 停止之前运行中的任务
        if params_json.get('cancel_pre'):
            async_task_service.delete_pre_running_task(params_json['task_type'], task_id, params_json['relation_id'])
        # 获取执行参数
        task_params = json.loads(params_json.get('task_params', '{}'))
        intelligence_calculate_service.graph_calculate_task(task_params)

        update_json['task_status'] = 'finished'
        return {'current': 100, 'total': 100}
    except BaseException as e:
        update_json['result'] = str(e)
        update_json['task_status'] = 'failed'
        error_log = log_oper.get_error_log(str(e), sys._getframe(), traceback.format_exc())
        Logger.log_error(error_log)
    finally:
        # 此处只需要更新下错误原因即可，状态由外部调用更新
        update_json['finished_time'] = datetime.datetime.now()
        async_task_service.update(task_id, update_json)
        return {'current': 100, 'total': 100}


@cel.task(name='cel.import_onto', bind=True)
def import_onto(self, params_json, task_id):
    """ 从文件导入本体
    筛选：
    - 无/重复：实体类名/id、实体类属性名、边名/id、边的关系、边属性名
    自动填充：
    - 本体名、本体唯一id
    - 实体类别名、形状、大小、填充颜色、描边颜色、文字颜色、文字固定或自适应、文字宽度、文字位置
    - 实体类属性别名、类型、索引、融合属性、默认显示属性
    - 关系类别名、颜色、形状、粗细、同名关系类属性继承自第一条
    - 关系类属性别名、类型、默认显示属性
    """
    print('cel.task ------->')
    update_json = {}
    file_path = '/tmp/'
    if os.name == 'nt':
        file_path = 'C:/Users/Public/Downloads/'
    try:
        task_params = json.loads(params_json.get('task_params', '{}'))
        knw_id = params_json.get('relation_id')
        file_name_no_path = task_params.get('file_name')
        gridfs_dao.connect()
        gridfs_dao.get(file_name_no_path, file_path + file_name_no_path)
        file_name = file_path + file_name_no_path
        ontology = {}
        if file_name.endswith('xlsx'):
            warnings.simplefilter(action='ignore', category=UserWarning)
            # 校验文件格式是否正确
            code, message, language = check_ontology_schema_xlsx(file_name)
            if code != 0:
                error_log = log_oper.get_error_log('文件内容错误，请下载模板，并按照格式填写。' + message, sys._getframe())
                Logger.log_error(error_log)
                update_json["task_status"] = "failed"
                update_json["result"] = _l('File content error, please download the template '
                                           'and complete the document according to the format requirements.')
                return {'current': 100, 'total': 100}

            if language == 'zh':
                df = pd.read_excel(file_name, sheet_name='本体配置', dtype=str)
            elif language == 'en':
                df = pd.read_excel(file_name, sheet_name='Ontology Configuration', dtype=str)
            # 校验本体名称
            # 本体名称为空
            if pd.isnull(df.iloc[0][1]):
                update_json["task_status"] = "failed"
                update_json["result"] = _l('Import failed! Ontology name is empty. Please modify and try again.')
                return {'current': 100, 'total': 100}
            ontology_name = str(df.iloc[0][1])
            # 本体名称不合法
            if len(ontology_name) > 50 or not re.search(
                    RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                    ontology_name):
                message = _l(
                    "Import failed! The format of the ontology name is incorrect. Please modify and try again.")
                update_json["task_status"] = "failed"
                update_json["result"] = message
                return {'current': 100, 'total': 100}
            # 本体名称重复
            res = otl_dao.check_otl_name(ontology_name, knw_id, -1)
            if len(res) > 0:
                update_json["task_status"] = "failed"
                update_json["result"] = _l(
                    "Import failed! The ontology name already exists. Please modify and try again.")
                return {'current': 100, 'total': 100}
            ontology['ontology_name'] = ontology_name
            # 校验本体描述
            ontology_des = str(df.iloc[1][1]) if not pd.isnull(df.iloc[1][1]) else ''
            if (len(ontology_des) > 150 or not (re.search(
                    RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                    ontology_des) or len(ontology_des) == 0)):
                message = _l(
                    "Import failed! The format of ontology description is incorrect. Please modify and try again.")
                update_json["task_status"] = "failed"
                update_json["result"] = message
                return {'current': 100, 'total': 100}
            ontology['ontology_des'] = ontology_des
            # 校验领域标签
            domain_values = str(df.iloc[2][1]) if not pd.isnull(df.iloc[2][1]) else ''
            domain_values = domain_values.split('|')[0: 10]
            if '' in domain_values:
                domain_values.remove('')
            domain_names = []
            for domain in domain_values:
                if domain in domain_names:
                    message = _l(
                        "Import failed! The format of ontology domain is incorrect. Please modify and try again.")
                    update_json["task_status"] = "failed"
                    update_json["result"] = message
                    return {'current': 100, 'total': 100}
                elif len(domain) > 50 or not re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value, domain):
                    message = _l(
                        "Import failed! The format of ontology domain is incorrect. Please modify and try again.")
                    update_json["task_status"] = "failed"
                    update_json["result"] = message
                    return {'current': 100, 'total': 100}
                domain_names.append(domain)
            ontology['domain'] = domain_values
            ontology['identify_id'] = str(uuid_obj.uuid1()).replace('-', '')
            ontology['used_task'] = []
            ontology['canvas'] = {'background_color': 'white',
                                  'background_image': 'point'}

            if language == 'zh':
                df = pd.read_excel(file_name, sheet_name='实体类定义')
            elif language == 'en':
                df = pd.read_excel(file_name, sheet_name='Entity Class Definition')
            entitys = {}
            for i_row, row in enumerate(df.values.tolist()):
                if i_row == 0:
                    continue
                name, alias, description, synonym, shape, icon, size, fill_color, stroke_color, \
                text_color, text_type, text_width, x, y, text_position, icon_color = row[:16]
                # 实体类名为空则跳过
                if pd.isnull(name):
                    continue
                fill_color = str(fill_color) if not pd.isnull(fill_color) else get_color()
                stroke_color = str(stroke_color) if not pd.isnull(stroke_color) else fill_color
                entitys[name] = {'name': name,
                                 'entity_id': i_row,
                                 'alias': str(alias) if not pd.isnull(alias) else name,
                                 'description': str(description) if not pd.isnull(description) else '',
                                 'synonym': str(synonym) if not pd.isnull(synonym) else '',
                                 'shape': str(shape) if not pd.isnull(shape) else 'circle',
                                 'icon': str(icon) if not pd.isnull(icon) else '',
                                 'size': str(size) if not pd.isnull(size) else '0.5x',
                                 'fill_color': fill_color,
                                 'stroke_color': stroke_color,
                                 'text_color': str(text_color) if not pd.isnull(text_color) else 'rgba(0,0,0,0.8)',
                                 'text_type': str(text_type) if not pd.isnull(text_width) else 'adaptive',
                                 'text_width': text_width if not pd.isnull(text_width) else 14,
                                 'x': x if not pd.isnull(x) else '',
                                 'y': y if not pd.isnull(y) else '',
                                 'text_position': str(text_position) if not pd.isnull(text_position) else 'top',
                                 'icon_color': str(icon_color) if not pd.isnull(icon_color) else '',
                                 'properties': [],
                                 'default_tag': '',
                                 'properties_index': [],
                                 'index_default_switch': False,
                                 'index_main_switch': False,
                                 'primary_key': [],
                                 "vector_generation": [],
                                 'source_type': 'manual',
                                 'model': '',
                                 'task_id': ''
                                 }

            if language == 'zh':
                df = pd.read_excel(file_name, sheet_name='实体类属性')
            elif language == 'en':
                df = pd.read_excel(file_name, sheet_name='Entity Class Attribute')
            entity_props = []
            for i_row, row in enumerate(df.values.tolist()):
                if i_row == 0:
                    continue
                entity_name, name, alias, data_type, index, merge, default_tag, description, synonym, vector = row[:10]
                if pd.isnull(entity_name) or pd.isnull(name):
                    continue
                if entity_name not in entitys:
                    continue
                if [entity_name, name] in entity_props:
                    continue
                entity_props.append([entity_name, name])
                properties = {'name': str(name),
                              'description': str(description) if not pd.isnull(description) else '',
                              'alias': str(alias) if not pd.isnull(alias) else name,
                              'data_type': str(data_type) if not pd.isnull(data_type) else 'string',
                              'synonym': str(synonym) if not pd.isnull(synonym) else ''
                              }
                entitys[entity_name]['properties'].append(properties)
                if index == 'Y':
                    entitys[entity_name]['properties_index'].append(name)
                if vector == 'Y':
                    entitys[entity_name]['vector_generation'].append(name)
                if merge == 'Y':
                    entitys[entity_name]['primary_key'].append(name)
                if default_tag == 'Y' and not entitys[entity_name]['default_tag']:
                    entitys[entity_name]['default_tag'] = name

            ontology['entity'] = list(entitys.values())

            for entity in ontology['entity']:
                if not entity['properties_index'] and len(entity['properties']) > 0:
                    entity['properties_index'] = [entity['properties'][0]['name']]
                if not entity['primary_key'] and len(entity['properties']) > 0:
                    entity['primary_key'] = [entity['properties'][0]['name']]
                if not entity['default_tag'] and len(entity['properties']) > 0:
                    entity['default_tag'] = entity['properties'][0]['name']

            if language == 'zh':
                df = pd.read_excel(file_name, sheet_name='关系类定义')
            elif language == 'en':
                df = pd.read_excel(file_name, sheet_name='Relationship Class Definition')
            edges = {}
            relations = []
            for i_row, row in enumerate(df.values.tolist()):
                if i_row == 0:
                    continue
                name, alias, start_entity, end_entity, description, synonym, color, shape, width = row[:9]
                if pd.isnull(name) or pd.isnull(start_entity) or pd.isnull(end_entity):
                    continue
                if start_entity not in entitys or end_entity not in entitys:
                    continue
                relation = [start_entity, name, end_entity]
                if relation in relations:
                    continue
                relations.append(relation)
                edge = {'name': str(name),
                        'edge_id': i_row,
                        'alias': str(alias) if not pd.isnull(alias) else name,
                        'relations': relation,
                        'description': str(description) if not pd.isnull(description) else '',
                        'synonym': str(synonym) if not pd.isnull(synonym) else '',
                        'colour': str(color) if not pd.isnull(color) else get_color(),
                        'shape': str(shape) if not pd.isnull(shape) else 'line',
                        'width': str(width) if not pd.isnull(width) else '0.25x',
                        'properties_index': [],
                        'default_tag': '',
                        'properties': [],
                        'source_type': 'manual',
                        'model': '',
                        'index_default_switch': False,
                        'index_main_switch': False
                        }
                if name not in edges:
                    edges[name] = [edge]
                else:
                    edge = copy.deepcopy(edges[name][0])
                    edge['name'] = str(name)
                    edge['edge_id'] = i_row
                    edge['relations'] = relation
                    edges[name].append(edge)

            if language == 'zh':
                df = pd.read_excel(file_name, sheet_name='关系类属性')
            elif language == 'en':
                df = pd.read_excel(file_name, sheet_name='Relationship Class Attribute')
            edge_props = []
            for i_row, row in enumerate(df.values.tolist()):
                if i_row == 0:
                    continue
                edge_name, name, alias, data_type, index, default_tag, description, synonym = row[:8]
                if pd.isnull(edge_name) or pd.isnull(name):
                    continue
                if edge_name not in edges:
                    continue
                if [edge_name, name] in edge_props:
                    continue
                edge_props.append([edge_name, name])
                properties = {'name': str(name),
                              'description': str(description) if not pd.isnull(description) else '',
                              'alias': str(alias) if not pd.isnull(alias) else name,
                              'data_type': str(data_type) if not pd.isnull(data_type) else 'string',
                              'synonym': str(synonym) if not pd.isnull(synonym) else ''
                              }
                for edge in edges[edge_name]:
                    edge['properties'].append(properties)
                    if index == 'Y':
                        edge['properties_index'].append(name)
                    if default_tag == 'Y' and not edge['default_tag']:
                        edge['default_tag'] = name
            ontology['edge'] = []
            for edge in edges.values():
                ontology['edge'].extend(edge)

            for edge in ontology['edge']:
                if not edge['default_tag'] and len(edge['properties']) > 0:
                    edge['default_tag'] = edge['properties'][0]['name']

            update_json["task_status"] = "finished"
            update_json["result"] = json.dumps(ontology, ensure_ascii=False)
            return {'current': 100, 'total': 100}
        elif file_name.endswith('json'):
            try:
                with open(file_name) as f:
                    content = f.read()
                try:
                    ontology = json.loads(content)
                except Exception as e:
                    error_log = log_oper.get_error_log('文件内容错误，请下载模板，并按照格式填写。'
                                                       + 'The file is not in the correct JSON format. '
                                                       + str(e), sys._getframe())
                    Logger.log_error(error_log)
                    update_json["task_status"] = "failed"
                    update_json["result"] = _l('File content error, please download the template '
                                               'and complete the document according to the format requirements.')
                    return {'current': 100, 'total': 100}
                code, message = check_ontology_schema_json(ontology)
                if code != 0:
                    error_log = log_oper.get_error_log('文件内容错误，请下载模板，并按照格式填写。' + message,
                                                       sys._getframe())
                    Logger.log_error(error_log)
                    update_json["task_status"] = "failed"
                    update_json["result"] = _l('File content error, please download the template '
                                               'and complete the document according to the format requirements.')
                    return {'current': 100, 'total': 100}
                # 校验本体名称
                # 本体名称为空
                if ontology['ontology_name'] == '':
                    update_json["task_status"] = "failed"
                    update_json["result"] = _l('Import failed! Ontology name is empty. Please modify and try again.')
                    return {'current': 100, 'total': 100}
                # 本体名称不合法
                if len(ontology['ontology_name']) > 50 or not re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        ontology['ontology_name']):
                    message = _l(
                        "Import failed! The format of the ontology name is incorrect. Please modify and try again.")
                    update_json["task_status"] = "failed"
                    update_json["result"] = message
                    return {'current': 100, 'total': 100}
                # 本体名称重复
                res = otl_dao.check_otl_name(ontology['ontology_name'], knw_id, -1)
                if len(res) > 0:
                    update_json["task_status"] = "failed"
                    update_json["result"] = _l(
                        "Import failed! The ontology name already exists. Please modify and try again.")
                    return {'current': 100, 'total': 100}
                # 校验本体描述
                ontology_des = ontology['ontology_des']
                if (len(ontology_des) > 150 or not (re.search(
                        RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                        ontology_des) or len(ontology_des) == 0)):
                    message = _l(
                        "Import failed! The format of ontology description is incorrect. Please modify and try again.")
                    update_json["task_status"] = "failed"
                    update_json["result"] = message
                    return {'current': 100, 'total': 100}
                # 校验领域标签
                domain_values = ontology['domain']
                domain_values = domain_values[0:10]
                if '' in domain_values:
                    domain_values.remove('')
                domain_names = []
                for domain in domain_values:
                    if domain in domain_names:
                        message = _l(
                            "Import failed! The format of ontology domain is incorrect. Please modify and try again.")
                        update_json["task_status"] = "failed"
                        update_json["result"] = message
                        return {'current': 100, 'total': 100}
                    elif not isinstance(domain, str):
                        message = _l(
                            "Import failed! The format of ontology domain is incorrect. Please modify and try again.")
                        update_json["task_status"] = "failed"
                        update_json["result"] = message
                        return {'current': 100, 'total': 100}
                    elif len(domain) > 50 or not re.search(
                            RegularEnum.ENGLISH_CHINESE_AND_SPECIAL_SYMBOLS_ON_THE_KEYBOARD.value,
                            domain):
                        message = _l(
                            "Import failed! The format of ontology domain is incorrect. Please modify and try again.")
                        update_json["task_status"] = "failed"
                        update_json["result"] = message
                        return {'current': 100, 'total': 100}
                    domain_names.append(domain)
                ontology['domain'] = domain_values
                if 'identify_id' not in ontology or not ontology['identify_id']:
                    ontology['identify_id'] = str(uuid_obj.uuid1()).replace('-', '')
                if 'used_task' not in ontology:
                    ontology['used_task'] = []
                if 'canvas' not in ontology:
                    ontology['canvas'] = {'background_color': 'white',
                                          'background_image': 'point'}
                # entity
                # 筛选
                new_entitys = []
                entity_names = []
                entity_ids = []
                for entity in ontology['entity']:
                    if not entity['name'] or entity['name'] in entity_names or entity['entity_id'] in entity_ids:
                        continue
                    entity_names.append(entity['name'])
                    entity_ids.append(entity['entity_id'])
                    new_properties = []
                    property_names = []
                    for p in entity['properties']:
                        if not p['name'] or p['name'] in property_names:
                            continue
                        property_names.append(p['name'])
                        new_properties.append(p)
                    entity['properties'] = new_properties
                    new_entitys.append(entity)
                ontology['entity'] = new_entitys
                # 自动填充
                for entity in ontology['entity']:
                    if not entity['alias']:
                        entity['alias'] = entity['name']
                    if not entity['shape']:
                        entity['shape'] = 'circle'
                    if not entity['size']:
                        entity['size'] = '0.5x'
                    if not entity['fill_color']:
                        entity['fill_color'] = get_color()
                    if not entity['stroke_color']:
                        entity['stroke_color'] = entity['fill_color']
                    if not entity['text_color']:
                        entity['text_color'] = 'rgba(0,0,0,0.8)'
                    if not entity['text_type']:
                        entity['text_type'] = 'adaptive'
                    if not entity['text_width']:
                        entity['text_width'] = 14
                    if not entity['text_position']:
                        entity['text_position'] = 'top'
                    if 'model' not in entity:
                        entity['model'] = ''
                    if 'source_type' not in entity:
                        entity['source_type'] = 'manual'
                    if 'index_default_switch' not in entity:
                        entity['index_default_switch'] = False
                    if 'index_main_switch' not in entity:
                        entity['index_main_switch'] = False
                    for p in entity['properties']:
                        if not p['alias']:
                            p['alias'] = p['name']
                        if not p['data_type']:
                            p['data_type'] = 'string'
                    if not entity['properties_index'] and len(entity['properties']) > 0:
                        entity['properties_index'] = [entity['properties'][0]['name']]
                    if not entity['primary_key'] and len(entity['properties']) > 0:
                        entity['primary_key'] = [entity['properties'][0]['name']]
                    if not entity['default_tag'] and len(entity['properties']) > 0:
                        entity['default_tag'] = entity['properties'][0]['name']
                    if 'task_id' not in entity:
                        entity['task_id'] = ''
                # edge
                # 筛选
                new_edges = []
                relations = []
                edge_ids = []
                for edge in ontology['edge']:
                    if not edge['name'] or edge['edge_id'] in edge_ids:
                        continue
                    if not (len(edge['relations']) == 3
                            and edge['relations'][0] in entity_names
                            and edge['relations'][1] == edge['name']
                            and edge['relations'][2] in entity_names):
                        continue
                    if edge['relations'] in relations:
                        continue
                    relations.append(edge['relations'])
                    edge_ids.append(edge['edge_id'])
                    new_properties = []
                    property_names = []
                    for p in edge['properties']:
                        if not p['name'] or p['name'] in property_names:
                            continue
                        property_names.append(p['name'])
                        new_properties.append(p)
                    edge['properties'] = new_properties
                    new_edges.append(edge)
                ontology['edge'] = new_edges
                # 自动填充
                edges = {}
                for edge in ontology['edge']:
                    if edge['name'] in edges:
                        edge['colour'] = edges[edge['name']]['colour']
                        edge['shape'] = edges[edge['name']]['shape']
                        edge['alias'] = edges[edge['name']]['alias']
                        edge['properties_index'] = edges[edge['name']]['properties_index']
                        edge['default_tag'] = edges[edge['name']]['default_tag']
                        edge['synonym'] = edges[edge['name']]['synonym']
                        edge['properties'] = edges[edge['name']]['properties']
                        edge['width'] = edges[edge['name']]['width']
                        edge['description'] = edges[edge['name']]['description']
                        edge['model'] = edges[edge['name']]['model']
                        edge['source_type'] = edges[edge['name']]['source_type']
                    else:
                        if not edge['alias']:
                            edge['alias'] = edge['name']
                        if not edge['colour']:
                            edge['colour'] = get_color()
                        if not edge['shape']:
                            edge['shape'] = 'line'
                        if not edge['width']:
                            edge['width'] = '0.25x'
                        if 'model' not in edge:
                            edge['model'] = ''
                        if 'source_type' not in edge:
                            edge['source_type'] = 'manual'
                        if 'index_default_switch' not in edge:
                            edge['index_default_switch'] = False
                        if 'index_main_switch' not in edge:
                            edge['index_main_switch'] = False
                        for p in edge['properties']:
                            if not p['alias']:
                                p['alias'] = p['name']
                            if not p['data_type']:
                                p['data_type'] = 'string'
                        if not edge['default_tag'] and len(edge['properties']) > 0:
                            edge['default_tag'] = edge['properties'][0]['name']
                update_json["task_status"] = "finished"
                update_json["result"] = json.dumps(ontology, ensure_ascii=False)
                return {'current': 100, 'total': 100}
            except Exception as e:
                error_log = log_oper.get_error_log('文件内容错误，请下载模板，并按照格式填写。' + str(e),
                                                   sys._getframe())
                Logger.log_error(error_log)
                update_json["task_status"] = "failed"
                update_json["result"] = _l('File content error, please download the template '
                                           'and complete the document according to the format requirements.')
                return {'current': 100, 'total': 100}
        else:
            update_json["task_status"] = "failed"
            update_json["result"] = 'the type of uploaded file can only be xlsx or json. '
            return {'current': 100, 'total': 100}
        os.remove(file_name)
        gridfs_dao.delete(file_name_no_path)
    except Exception as e:
        error_log = log_oper.get_error_log("import ontology task err:%s" % str(e), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        update_json["task_status"] = "failed"
        update_json["result"] = str(error_log)
        return {'current': 100, 'total': 100}
    finally:
        update_json['finished_time'] = datetime.datetime.now()
        async_task_service.update(task_id, update_json)


@cel.task(name='cel.import_lexicon', bind=True)
def import_lexicon(self, params_json, task_id):
    update_json = {}
    lexicon_id = params_json["lexicon_id"]
    file_path = params_json["file_path"]
    user_id = params_json["user_id"]
    lexicon_dao.update_lexicon_status(lexicon_id, "running")
    try:
        # 读取文件内容
        columns, contents, flag, message = lexicon_service.get_file_content(file_path)
        # 编码错误
        if message == "Builder_LexiconController_CreateLexicon_EncodingError":
            error_log = log_oper.get_error_log('File upload failed, file encoding error. '
                                               'The file only supports UTF-8 encoding.', sys._getframe())
            Logger.log_error(error_log)
            update_json["task_status"] = "failed"
            update_json["result"] = _l(
                'File upload failed, file encoding error. The file only supports UTF-8 encoding.')
            return {'current': 100, 'total': 100}
        # 内容格式错误
        elif message == "Builder_LexiconController_CreateLexicon_ContentFormatError":
            error_log = log_oper.get_error_log('File upload failed, file content format error', sys._getframe())
            Logger.log_error(error_log)
            update_json["task_status"] = "failed"
            update_json["result"] = _l('File upload failed, file content format error.')
            return {'current': 100, 'total': 100}
        elif message:
            error_log = log_oper.get_error_log(message, sys._getframe())
            Logger.log_error(error_log)
            update_json["task_status"] = "failed"
            update_json["result"] = message
            return {'current': 100, 'total': 100}
        # 列名校验
        message1 = lexicon_service.file_columns_verification(columns)
        if message1 == "Builder_LexiconController_CreateLexicon_ContentFormatError":
            error_log = log_oper.get_error_log("File upload failed, file content format error", sys._getframe())
            Logger.log_error(error_log)
            update_json["task_status"] = "failed"
            update_json["result"] = _l("File upload failed, file content format error.")
            return {'current': 100, 'total': 100}
        elif message1 == "DataExceeded":
            error_log = log_oper.get_error_log("File upload failed, data amount exceeds", sys._getframe())
            Logger.log_error(error_log)
            update_json["task_status"] = "failed"
            update_json["result"] = _l("File upload failed, data amount exceeds.")
            return {'current': 100, 'total': 100}
        res, message2 = lexicon_service.file_content_verification(flag, columns, contents)
        if message2 == "Builder_LexiconController_CreateLexicon_ContentFormatError":
            error_log = log_oper.get_error_log("File upload failed, file content format error", sys._getframe())
            Logger.log_error(error_log)
            update_json["task_status"] = "failed"
            update_json["result"] = _l("File upload failed, file content format error.")
            return {'current': 100, 'total': 100}
        # 新数据列名不匹配
        old_columns = lexicon_service.get_columns_from_lexicon(lexicon_id)
        if old_columns and set(old_columns) != set(columns):
            error_log = log_oper.get_error_log("New data and original data fields are inconsistent", sys._getframe())
            Logger.log_error(error_log)
            update_json["task_status"] = "failed"
            update_json["result"] = _l("New data and original data fields are inconsistent.")
            return {'current': 100, 'total': 100}
        # 替换还是新增
        mode = params_json.get("mode")
        if mode == "create":
            lexicon_dao.update_lexicon_columns(lexicon_id, columns, user_id)
        elif mode == "replace":
            lexicon_service.delete_word_in_mongo(lexicon_id)

        # 写入mongodb
        if mode == "create":
            ret_code, ret_message = lexicon_service.insert_lexicon(lexicon_id, res)
        else:
            ret_code, ret_message = lexicon_service.insert_data2mongo(lexicon_id, res, user_id)
        if ret_code != 200:
            error_log = log_oper.get_error_log(ret_message, sys._getframe())
            Logger.log_error(error_log)
            update_json["task_status"] = "failed"
            update_json["result"] = ret_message
            return {'current': 100, 'total': 100}
        update_json["task_status"] = "finished"
        update_json["result"] = ret_message
    except Exception as e:
        error_log = log_oper.get_error_log("import lexicon task err:%s" % str(e), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        update_json["task_status"] = "failed"
        update_json["result"] = str(error_log)
        return {'current': 100, 'total': 100}
    finally:
        # 文件不存在报错 pass
        try:
            os.remove(file_path)
        except FileNotFoundError:
            pass
        update_json['finished_time'] = datetime.datetime.now()
        if update_json["task_status"] == "failed":
            lexicon_dao.update_lexicon_status(lexicon_id, "failed")
            lexicon_dao.update_lexicon_error_info(lexicon_id, str(update_json["result"]))
        async_task_service.update(task_id, update_json)


@cel.task(name='cel.lexicon_build', bind=True)
def lexicon_build(self, params_json, task_id):
    db = mongoConnect.connect_mongo()
    update_json = {}
    lexicon_id = params_json["lexicon_id"]
    lexicon_dao.update_lexicon_status(lexicon_id, "running")
    mongodb_name = f"Lexicon-{lexicon_id}"
    mode = params_json["mode"]
    extract_info = params_json["extract_info"]
    try:
        if "lexicon" in extract_info:
            if mode != "custom":
                error_log = log_oper.get_error_log("Only custom template support extract lexicon.", sys._getframe())
                Logger.log_error(error_log)
                update_json["task_status"] = "failed"
                update_json["result"] = _l("Only custom template support extract lexicon.")
                return {'current': 100, 'total': 100}
            word_info = []
            for extract_lexicon in extract_info["lexicon"]:
                extract_mongodb_name = f"Lexicon-{extract_lexicon['id']}"
                extract_columns = extract_lexicon["columns"]
                separators = extract_lexicon["separator"]
                extract_words = db[extract_mongodb_name].find()
                for word in extract_words:
                    for index, column in enumerate(extract_columns):
                        separator = separators[index]
                        if separator == "\\t":
                            separator = "\t"
                        elif separator == "\\n":
                            separator = "\n"
                        words = word[column].split(separator) if separator != "" else [word[column]]
                        word_info.append({"words": word for word in words})
            if word_info:
                lexicon_dao.write_lexicon2mongo(db, mongodb_name, word_info)

        if "graph" in extract_info:
            for extract_graph in extract_info["graph"]:
                graph_id = extract_graph["id"]
                synonym_dict = {}
                std_pro_dict = {}
                for entity in extract_graph["entities"]:
                    entity_name = entity["name"]
                    prop_list = entity["prop"]
                    separator_list = entity["separator"]
                    std_pro_dict[entity_name] = entity.get("std_prop", "")
                    synonym_dict[entity_name] = {}
                    for index, prop in enumerate(prop_list):
                        synonym_dict[entity_name][prop] = separator_list[index]

                ret_code, ret_message = graph_Service.getGraphById(graph_id, host_url="")
                res = ret_message['res']
                graph_KMap = res['graph_KMap']
                kmap_config = GraphKMapConfig(graph_KMap)
                ontology = res['graph_otl'][0]
                ontology_config = OntologyConfig(ontology)
                for otl_name, std_pro in std_pro_dict.items():
                    otl_info = kmap_config.entity_info(otl_name)
                    if not otl_info.entity_type:
                        continue
                    batch_size = 200000
                    data_source = otl_info.data_source
                    extract_type = otl_info.extract_type
                    file_name = otl_info.files['files'][0]['file_name']
                    file_source = otl_info.files['files'][0]['file_source']
                    if data_source == "mysql":
                        transfer = MysqlTransfer({'name': otl_name}, kmap_config)
                        client = transfer.get_client_dict()
                        cursor = client.cursor()
                        if extract_type == "standardExtraction":
                            sql_column = f"desc `{file_name}`"
                            cursor.execute(sql_column)
                            df_column = cursor.fetchall()
                            columns = [x['Field'] for x in df_column]
                            columns_new = [f"`{column}` as `{otl_util.is_special(column)}`" for column in
                                           columns]
                            columns_str = ",".join(columns_new)
                            sql = f"select {columns_str} from `{file_name}`;"
                        else:
                            sql = file_source
                        cursor.execute(sql)
                        while True:
                            data = cursor.fetchmany(batch_size)
                            if len(data) <= 0:
                                break
                            word_info = extract_word_info(data, graph_id, mode, otl_name, std_pro,
                                                          synonym_dict, otl_info.otl_tab, ontology_config.pro_merge)
                            if word_info:
                                lexicon_dao.write_lexicon2mongo(db, mongodb_name, word_info)
                    elif data_source == "hive":
                        transfer = HiveTransfer({'name': otl_name}, kmap_config)
                        client = transfer.get_client()
                        hive_conn = client.conn
                        hive_cursor = hive_conn.cursor()
                        columns = transfer.get_columns()
                        if extract_type == "sqlExtraction":
                            sql = file_source
                        else:
                            columns_str = ",".join(
                                [f"`{column}` as `{otl_util.is_special(column)}`" for column in columns])
                            database = transfer.data_ds['ds_path']
                            sql = f"SELECT {columns_str} FROM {database}.`{file_name}`"
                        hive_cursor.execute(sql)

                        while True:
                            data = hive_cursor.fetchmany(size=1000000)
                            if len(data) <= 0:
                                break
                            dataDicts = []
                            for i in range(len(data)):
                                dataDicts.append(dict(zip(columns, data[i])))
                            word_info = extract_word_info(dataDicts, graph_id, mode, otl_name, std_pro,
                                                          synonym_dict, otl_info.otl_tab, ontology_config.pro_merge)
                            if word_info:
                                lexicon_dao.write_lexicon2mongo(db, mongodb_name, word_info)
                    elif data_source == "sqlserver":
                        transfer = SqlserverTransfer({'name': otl_name}, kmap_config)
                        client = transfer.get_client()
                        cursor = client.cursor()
                        if extract_type == "standardExtraction":
                            sql_column = f"select column_name from information_schema.COLUMNS " \
                                         f"where TABLE_SCHEMA=N'{transfer.schema}' " \
                                         f"and TABLE_NAME=N'{transfer.table_name}' ;"
                            cursor.execute(sql_column)
                            ret = cursor.fetchall()
                            columns = [x[0] for x in ret]
                            columnsWithoutSpecial = [otl_util.is_special(column) for column in columns]
                            columns_new = [f'''"{column}" as "{otl_util.is_special(column)}"'''
                                           for column in columns]
                            columns_str = ",".join(columns_new)
                            sql = f'''select {columns_str} from "{transfer.schema}"."{transfer.table_name}";'''
                            cursor.execute(sql)
                        else:
                            sql = file_source
                            cursor.execute(sql)
                            description = cursor.description
                            columnsWithoutSpecial = [otl_util.is_special(desc[0]) for desc in description]

                        while True:
                            data = cursor.fetchmany(batch_size)
                            if len(data) <= 0:
                                break
                            data_dicts = []
                            for i in range(len(data)):
                                data_dicts.append(dict(zip(columnsWithoutSpecial, data[i])))
                            word_info = extract_word_info(data_dicts, graph_id, mode, otl_name, std_pro,
                                                          synonym_dict, otl_info.otl_tab, ontology_config.pro_merge)
                            if word_info:
                                lexicon_dao.write_lexicon2mongo(db, mongodb_name, word_info)
                    elif data_source == "kingbasees":
                        transfer = KingbaseesTransfer({'name': otl_name}, kmap_config)
                        client = transfer.get_client()
                        cursor = client.cursor()
                        if extract_type == "standardExtraction":
                            sql_column = f"SELECT column_name FROM information_schema.columns " \
                                         f"WHERE table_schema = '{transfer.schema}' " \
                                         f"AND table_name='{transfer.table_name}';"
                            cursor.execute(sql_column)
                            ret = cursor.fetchall()
                            columns = [x[0] for x in ret]
                            columnsWithoutSpecial = [otl_util.is_special(column) for column in columns]
                            columns_new = [f'''"{column}" as "{otl_util.is_special(column)}"'''
                                           for column in columns]
                            columns_str = ",".join(columns_new)
                            sql = f'''SELECT {columns_str} FROM "{transfer.schema}"."{transfer.table_name}";'''
                            cursor.execute(sql)
                        else:
                            sql = file_source
                            cursor.execute(sql)
                            description = cursor.description
                            columnsWithoutSpecial = [otl_util.is_special(desc[0]) for desc in description]

                        while True:
                            data = cursor.fetchmany(batch_size)
                            if len(data) <= 0:
                                break
                            data_dicts = []
                            for i in range(len(data)):
                                data_dicts.append(dict(zip(columnsWithoutSpecial, data[i])))
                            word_info = extract_word_info(data_dicts, graph_id, mode, otl_name, std_pro,
                                                          synonym_dict, otl_info.otl_tab, ontology_config.pro_merge)
                            if word_info:
                                lexicon_dao.write_lexicon2mongo(db, mongodb_name, word_info)
                    elif data_source == "postgresql":
                        transfer = PostgresqlTransfer({'name': otl_name}, kmap_config)
                        client = transfer.get_client()
                        cursor = client.cursor()
                        if extract_type == "standardExtraction":
                            sql_column = f"SELECT column_name FROM information_schema.columns WHERE " \
                                         f"table_schema = '{transfer.schema}' " \
                                         f"AND table_name='{transfer.table_name}';"
                            cursor.execute(sql_column)
                            ret = cursor.fetchall()
                            columns = [x[0] for x in ret]
                            columnsWithoutSpecial = [otl_util.is_special(column) for column in columns]
                            columns_new = [f'''"{column}" as "{otl_util.is_special(column)}"''' for column
                                           in columns]
                            columns_str = ",".join(columns_new)
                            sql = f'''SELECT {columns_str} FROM "{transfer.schema}"."{transfer.table_name}";'''
                            cursor.execute(sql)
                        else:
                            sql = file_source
                            cursor.execute(sql)
                            description = cursor.description
                            columnsWithoutSpecial = [otl_util.is_special(desc[0]) for desc in description]

                        while True:
                            data = cursor.fetchmany(batch_size)
                            if len(data) <= 0:
                                break
                            data_dicts = []
                            for i in range(len(data)):
                                data_dicts.append(dict(zip(columnsWithoutSpecial, data[i])))
                            word_info = extract_word_info(data_dicts, graph_id, mode, otl_name, std_pro,
                                                          synonym_dict, otl_info.otl_tab, ontology_config.pro_merge)
                            if word_info:
                                lexicon_dao.write_lexicon2mongo(db, mongodb_name, word_info)
                    elif data_source == "clickhouse":
                        transfer = ClickHouseTransfer({'name': otl_name}, kmap_config)
                        client = transfer.get_client()
                        if extract_type == "standardExtraction":
                            sql_column = f"desc `{transfer.table_name}`"
                            result = client.query(sql_column)
                            columns = [x[0] for x in result.result_set]
                            columns_new = [f"`{column}` as `{otl_util.is_special(column)}`" for column in
                                           columns]
                            columns_str = ",".join(columns_new)
                            sql = f"select {columns_str} from `{transfer.table_name}`"
                        else:
                            sql = file_source

                        with client.query_row_block_stream(sql, query_formats={
                            'FixedString': 'string'}) as stream:
                            columns = [otl_util.is_special(column) for column in stream.source.column_names]
                            data = []
                            for block in stream:
                                for row in block:
                                    data.append(dict(zip(columns, list(row))))
                                if len(data) == batch_size:
                                    word_info = extract_word_info(data, graph_id, mode, otl_name, std_pro,
                                                                  synonym_dict, otl_info.otl_tab,
                                                                  ontology_config.pro_merge)
                                    lexicon_dao.write_lexicon2mongo(db, mongodb_name, word_info)
                                    data = []
                            if data:
                                word_info = extract_word_info(data, graph_id, mode, otl_name, std_pro,
                                                              synonym_dict, otl_info.otl_tab, ontology_config.pro_merge)
                                if word_info:
                                    lexicon_dao.write_lexicon2mongo(db, mongodb_name, word_info)
                    else:
                        Logger.log_info(data_source + "not supports lexicon extract")

        lexicon_dao.update_lexicon_status(lexicon_id, "success")
        update_json["task_status"] = "finished"
        update_json["result"] = "success"

    except Exception as e:
        error_log = log_oper.get_error_log("build lexicon task err:%s" % str(e), sys._getframe(),
                                           traceback.format_exc())
        Logger.log_error(error_log)
        update_json["task_status"] = "failed"
        update_json["result"] = str(error_log)
        return {'current': 100, 'total': 100}
    finally:
        update_json['finished_time'] = datetime.datetime.now()
        if update_json["task_status"] == "failed":
            lexicon_dao.update_lexicon_status(lexicon_id, "failed")
            lexicon_dao.update_lexicon_error_info(lexicon_id, str(update_json["result"]))
        async_task_service.update(task_id, update_json)


def extract_word_info(data: list[dict], graph_id: int, mode: str, otl_name: str, std_pro: str,
                      synonym_dict: dict[str, dict[str, str]], tal_prop_map_otl: dict[str, str],
                      otl_map_primary: dict[str, list[str]]):
    word_info = []
    for row in data:
        for otl_prop, otl_pro_sep in synonym_dict[otl_name].items():
            tab_pro = tal_prop_map_otl[otl_prop]
            if not row.get(tab_pro):
                continue
            else:
                if otl_pro_sep == "\\t":
                    otl_pro_sep = "\t"
                elif otl_pro_sep == "\\n":
                    otl_pro_sep = "\n"
                res = row[tab_pro].split(otl_pro_sep) if otl_pro_sep else [row[tab_pro]]
                for v in res:
                    if not v:
                        continue
                    if mode == "custom":
                        word_info.append({"words": str(v)})
                    elif mode == "std":
                        std_lexicon = row.get(tal_prop_map_otl[std_pro])
                        if not std_lexicon:
                            continue
                        word_info.append({"synonym": str(v), "std_name": str(std_lexicon), "std_property": std_pro,
                                          "ent_name": otl_name, "graph_id": graph_id})
                    elif mode == "entity_link":
                        idval = otl_name + '_'
                        for primary_key in otl_map_primary[otl_name]:
                            primary_column = tal_prop_map_otl[primary_key]
                            vid_value = row[primary_column]
                            vid_value = normalize_text(str(vid_value))
                            idval += f'{vid_value}_'
                        vid = get_md5(idval)
                        word_info.append({"words": str(v), "vid": vid, "ent_name": otl_name, "graph_id": graph_id})
    return word_info


def get_color():
    color_list = [
        "#54639C",
        "#5f81d8",
        "#5889C4",
        "#5c539b",
        "#805a9c",
        "#d770a1",
        "#d8707a",
        "#2a908f",
        "#50a06a",
        "#7bbaa0",
        "#91c073",
        "#bbd273",
        "#f0e34f",
        "#ecb763",
        "#e39640",
        "#d9704c",
        "#d9534c",
        "#c64f58",
        "#3a4673",
        "#68798e",
        "#c5c8cC",
    ]
    color_hex = random.choice(color_list)
    color_rgba = 'rgba({},{},{},1)'.format(*tuple(int(color_hex[i:i + 2], 16) for i in (1, 3, 5)))
    return color_rgba


def check_ontology_schema_xlsx(file_name):
    """
    校验excel文件格式是否符合本体模板
    Args:
        file_name: 文件路径
    Returns:
        code: 0: 正确; -1: 不正确
        message: 错误信息
        language: 文件使用的语言 zh en
    """
    df = pd.ExcelFile(file_name)
    sheet_names = df.sheet_names
    language = ''
    if sheet_names == ['本体配置', '实体类定义', '实体类属性', '关系类定义', '关系类属性']:
        language = 'zh'
    elif sheet_names == ['Ontology Configuration', 'Entity Class Definition', 'Entity Class Attribute',
                         'Relationship Class Definition', 'Relationship Class Attribute']:
        language = 'en'
    else:
        return -1, '工作表名不正确。', language

    if language == 'zh':
        try:
            df = pd.read_excel(file_name, sheet_name='本体配置')
        except Exception as e:
            return -1, str(e), language
        if df.shape[0] < 3 or df.shape[1] < 2:
            return -1, '本体配置表表头不正确。', language
        if list(df.iloc[:, 0]) != ['*本体命名', '本体描述', '本体所属领域']:
            return -1, '本体配置表表头不正确。', language

        try:
            df = pd.read_excel(file_name, sheet_name='实体类定义')
        except Exception as e:
            return -1, str(e), language
        if df.shape[0] < 1 or df.shape[1] < 16:
            return -1, '实体类定义表表头不正确。', language
        if list(df.iloc[0]) != ['*实体类名', '实体类显示名', '实体类描述', '实体类名同义词', '形状', '图标',
                                '大小', '填充颜色', '描边颜色', '文字颜色', '文字固定或自适应', '文字宽度',
                                '位置（x坐标）', '位置（y坐标）', '文字位置', '图标颜色']:
            return -1, '实体类定义表表头不正确。', language

        try:
            df = pd.read_excel(file_name, sheet_name='实体类属性')
        except Exception as e:
            return -1, str(e), language
        if df.shape[0] < 1 or df.shape[1] < 9:
            return -1, '实体类属性表表头不正确。', language
        if list(df.iloc[0]) != ['*所属实体类', '*属性名', '显示名', '属性值类型', '是否创建索引', '是否融合属性',
                                '是否默认显示属性', '实体类属性描述', '显示名同义词', '是否创建向量索引']:
            return -1, '实体类属性表表头不正确。', language

        try:
            df = pd.read_excel(file_name, sheet_name='关系类定义')
        except Exception as e:
            return -1, str(e), language
        if df.shape[0] < 1 or df.shape[1] < 9:
            return -1, '关系类定义表表头不正确。', language
        if list(df.iloc[0]) != ['*关系类名', '关系类显示名', '*起始实体', '*指向实体', '关系类描述',
                                '关系类名同义词', '颜色', '形状', '粗细']:
            return -1, '关系类定义表表头不正确。', language

        try:
            df = pd.read_excel(file_name, sheet_name='关系类属性')
        except Exception as e:
            return -1, str(e), language
        if df.shape[0] < 1 or df.shape[1] < 8:
            return -1, '关系类属性表表头不正确。', language
        if list(df.iloc[0]) != ['*所属关系类', '*属性名', '显示名', '属性值类型', '是否创建索引',
                                '是否默认显示属性', '关系类属性描述', '显示名同义词']:
            return -1, '关系类属性表表头不正确。', language
    else:
        try:
            df = pd.read_excel(file_name, sheet_name='Ontology Configuration')
        except Exception as e:
            return -1, str(e), language
        if df.shape[0] < 3 or df.shape[1] < 2:
            return -1, '本体配置表表头不正确。', language
        if list(df.iloc[:, 0]) != ['*Ontology Naming', 'Ontology Description', 'Ontology Domain Affiliated']:
            return -1, '本体配置表表头不正确。', language

        try:
            df = pd.read_excel(file_name, sheet_name='Entity Class Definition')
        except Exception as e:
            return -1, str(e), language
        if df.shape[0] < 1 or df.shape[1] < 16:
            return -1, '实体类定义表表头不正确。', language
        if list(df.iloc[0]) != ['*Entity Class Name', 'Entity Class Show Name', 'Entity Class Description',
                                'Entity Class Name Synonyms', 'Shape', 'Icon', 'Size', 'Fill Color', 'Stroke Color',
                                'Text Color', 'Text Fixed or Adaptive', 'Text Width', 'Location (x-coordinate)',
                                'Location (y-coordinate)', 'Text Location', 'Icon Color']:
            return -1, '实体类定义表表头不正确。', language

        try:
            df = pd.read_excel(file_name, sheet_name='Entity Class Attribute')
        except Exception as e:
            return -1, str(e), language
        if df.shape[0] < 1 or df.shape[1] < 9:
            return -1, '实体类属性表表头不正确。', language
        if list(df.iloc[0]) != ['*Entity Class Affiliated', '*Attribute Name', 'Show Name', 'Attribute Value Type',
                                'Create Indexes or Not', 'Fuse Attribute or Not', 'Show Attribute by Default or Not',
                                'Entity Class Attribute Description', 'Show Name Synonyms',
                                'Create Vector Indexes or Not']:
            return -1, '实体类属性表表头不正确。', language

        try:
            df = pd.read_excel(file_name, sheet_name='Relationship Class Definition')
        except Exception as e:
            return -1, str(e), language
        if df.shape[0] < 1 or df.shape[1] < 9:
            return -1, '关系类定义表表头不正确。', language
        if list(df.iloc[0]) != ['*Relationship Class Name', 'Relationship Class Show Name', '*Starting Entity',
                                '*End Entity', 'Relationship Class Description', 'Relationship Class Name Synonyms',
                                'Color', 'Shape', 'Width']:
            return -1, '关系类定义表表头不正确。', language

        try:
            df = pd.read_excel(file_name, sheet_name='Relationship Class Attribute')
        except Exception as e:
            return -1, str(e), language
        if df.shape[0] < 1 or df.shape[1] < 8:
            return -1, '关系类属性表表头不正确。', language
        if list(df.iloc[0]) != ['*Relationship Class Affiliated', '*Attribute Name', 'Show Name',
                                'Attribute Value Type', 'Create Indexes or Not', 'Show Attribute by Default or Not',
                                'Relationship Class Attribute Description', 'Show Name Synonyms']:
            return -1, '关系类属性表表头不正确。', language

    return 0, '', language


def check_ontology_schema_json(ontology):
    """
    校验json文件格式是否符合本体模板
    Args:
        ontology: json解析后的文件内容
    Returns:
        code: 0: 正确; -1: 不正确
        message: 错误信息
    """
    ontology_schema = {'type': 'object',
                       'required': ['entity', 'ontology_des', 'domain', 'ontology_name', 'edge'],
                       "uniqueProperties": True,
                       "additionalProperties": False,
                       "properties": {
                           'ontology_des': {'type': 'string'},
                           'domain': {'type': 'array'},
                           'ontology_name': {'type': 'string'},
                           'entity': {
                               'type': 'array',
                               'items': {
                                   'type': 'object',
                                   'required': ['x', 'properties_index', 'text_color', 'primary_key', 'size', 'alias',
                                                'text_width', 'text_type', 'icon', 'synonym', 'description',
                                                'fill_color',
                                                'shape', 'y', 'text_position', 'icon_color', 'entity_id', 'name',
                                                'default_tag',
                                                'properties', 'stroke_color'],
                                   'properties': {
                                       'x': {},
                                       'properties_index': {'type': 'array'},
                                       'text_color': {'type': 'string'},
                                       'primary_key': {'type': 'array'},
                                       'size': {'type': 'string'},
                                       'alias': {'type': 'string'},
                                       'text_width': {},
                                       'text_type': {'type': 'string'},
                                       'model': {'type': 'string'},
                                       'icon': {'type': 'string'},
                                       'synonym': {'type': 'string'},
                                       'description': {'type': 'string'},
                                       'fill_color': {'type': 'string'},
                                       'shape': {'type': 'string'},
                                       'source_type': {'type': 'string'},
                                       'y': {},
                                       'text_position': {'type': 'string'},
                                       'icon_color': {'type': 'string'},
                                       'entity_id': {'type': 'integer'},
                                       'name': {'type': 'string'},
                                       'default_tag': {'type': 'string'},
                                       'properties': {'type': 'array',
                                                      'items': {
                                                          'type': 'object',
                                                          'required': ['alias', 'name', 'data_type', 'synonym',
                                                                       'description'],
                                                          'properties': {
                                                              'alias': {'type': 'string'},
                                                              'name': {'type': 'string'},
                                                              'data_type': {'type': 'string'},
                                                              'synonym': {'type': 'string'},
                                                              'description': {'type': 'string'}}
                                                      }},
                                       'stroke_color': {'type': 'string'}
                                   }}
                           },
                           'edge': {'type': 'array',
                                    'items': {
                                        'type': 'object',
                                        'required': ['colour', 'shape', 'alias', 'name',
                                                     'relations', 'edge_id', 'properties_index', 'default_tag',
                                                     'synonym', 'properties', 'width', 'description'],
                                        'properties': {
                                            'colour': {'type': 'string'},
                                            'shape': {'type': 'string'},
                                            'source_type': {'type': 'string'},
                                            'alias': {'type': 'string'},
                                            'name': {'type': 'string'},
                                            'model': {'type': 'string'},
                                            'relations': {'type': 'array'},
                                            'edge_id': {'type': 'integer'},
                                            'properties_index': {'type': 'array'},
                                            'default_tag': {'type': 'string'},
                                            'synonym': {'type': 'string'},
                                            'properties': {'type': 'array',
                                                           'items': {
                                                               'type': 'object',
                                                               'required': ['alias', 'name', 'data_type', 'synonym',
                                                                            'description'],
                                                               'properties': {
                                                                   'alias': {'type': 'string'},
                                                                   'name': {'type': 'string'},
                                                                   'data_type': {'type': 'string'},
                                                                   'synonym': {'type': 'string'},
                                                                   'description': {'type': 'string'}}
                                                           }},
                                            'width': {'type': 'string'},
                                            'description': {'type': 'string'},
                                        }
                                    }}}
                       }
    try:
        validate(ontology, ontology_schema)
    except ValidationError as e:
        return -1, e.message
    else:
        return 0, ''

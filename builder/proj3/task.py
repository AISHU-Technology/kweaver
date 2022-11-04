from __future__ import absolute_import

import yaml
from flask_app import app
from celery import Celery
import sys, os

from config.config import db_config_path

sys.path.append(os.path.abspath("../"))
from service.Otl_Service import otl_service
from service.task_Service import task_service
from config import config
from dao.dsm_dao import dsm_dao
from method.knowledge_graph import Ontology
from method.database import DataBase
from os import path
import time
from utils.common_response_status import CommonResponseStatus
with open(db_config_path, 'r') as f:
    yaml_config = yaml.load(f)
redis_config = yaml_config['redis']
redis_cluster_mode = redis_config['mode']
if config.local_testing != True:
    if redis_cluster_mode == "sentinel":
        cel = Celery(app.name, broker=app.config['CELERY_BROKER_URL'],
                     broker_transport_options=app.config['CELERY_BROKER_TRANSPORT_OPTIONS'],
                     backend=app.config['CELERY_RESULT_BACKEND'],
                     result_backend_transport_options=app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS'],
                     include=[app.name])
        print("-------------------------celery config -------------------------")
        print(cel.conf.broker_url)
        cel.conf.broker_transport_options = app.config['CELERY_BROKER_TRANSPORT_OPTIONS']
        print(cel.conf.broker_transport_options)
        print(cel.conf.result_backend)
        cel.conf.result_backend_transport_options = app.config['CELERY_RESULT_BACKEND_TRANSPORT_OPTIONS']
        print(cel.conf.result_backend_transport_options)
        cel.conf.update(app.config)
        print("-------------------------app+cel config -------------------------")
        print(cel.conf.broker_url)
        print(cel.conf.broker_transport_options)
        print(cel.conf.result_backend)
        print(cel.conf.result_backend_transport_options)
    else:
        # 初始化Celery
        cel = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'],
                     include=[app.name])
else:
    cel = Celery(app.name, broker=app.config['CELERY_BROKER_URL'], backend=app.config['CELERY_RESULT_BACKEND'],
                 include=[app.name])

    # 将Flask中的配置直接传递给Celery
    cel.conf.update(app.config)


@cel.task(name='cel.predict_ontology', bind=True)
def predict_ontology(self, new_params_json, task_id):
    obj = {}
    try:
        ### 文件夹迭选
        #### 获取文件
        if new_params_json["data_source"] == "as7":
            flat_code, tablelist = otl_service.flatfile(new_params_json)
            if flat_code == 200:
                for i in range(len(tablelist)):
                    if new_params_json["postfix"]:
                        tablelist[i].extend(
                            [str(new_params_json["dsname"]), "running", str(new_params_json["postfix"])])
                new_params_json["table_list"] = tablelist
            else:
                self.update_state(state="FAILURE", meta=tablelist)
                return {'current': 100, 'total': 100}
                # return jsonify({'res': tablelist, "code": 500})
        else:
            file_list = new_params_json["file_list"]
            tableinfo = []

            for i in range(len(file_list)):
                if new_params_json["data_source"]:
                    tableinfo.append(
                        [str(file_list[i]), str(new_params_json["ds_path"]), str(new_params_json["dsname"]), "running",
                         str(new_params_json["data_source"])])
            new_params_json["table_list"] = tableinfo
        # tableinfo = params_json["table_list"]
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

            # print(res)
            obj["res"] = res
            obj["file_list"] = []
            return obj
            # print(res)
            # obj["res"] = res
        else:
            if len(new_params_json["table_list"]) > 100:
                new_params_json["table_list"] = new_params_json["table_list"][0:100]
            new_entity_property_dict = []
            new_entity_for_table_dict = []
            new_relation_property_dict = []
            new_relation_main_table = []
            new_relation_set = []
            if new_params_json["data_source"] not in ["as", "as7"]:  ##hive,masql [a,b,c]
                # try:
                # tablelist = params_json["table_list"]
                # ontology = Ontology()  ########因为初始化问题，每次都需要进行类实例化，要不然会出现缓存未清除的现象
                # code, res, entity_list, entity_property_dict, entity_relation_set, entity_for_table_dict, name_rule_dict, pro_type_dict, newtable_list = ontology.data_processing(
                #     new_params_json)
                # #####newtable_list update to mysql
                # if len(entity_list) == 0:  ####如果算法没有提取到 则常规提取
                try:
                    # new_params_json["newtablelist"] = [i[0] for i in new_params_json["table_list"]]
                    new_params_json["newtablelist"] = new_params_json["table_list"]
                    code_extract, res_extract = DataBase(new_params_json).get_entity_edge(new_params_json)
                    if code_extract != CommonResponseStatus.SUCCESS.value:
                        self.update_state(state="FAILURE", meta=res_extract)
                        return {'current': 100, 'total': 100}
                        # raise Ignore()
                        # return code_extract, res_extract
                    new_entity_list = res_extract["res"]["entity_list"]
                    new_entity_property_dict = res_extract["res"]["entity_property_dict"]

                    new_entity_for_table_dict = res_extract["res"]["entity_main_table_dict"]

                    res = {}
                    res["entity_list"] = [list(t) for t in set(tuple(_) for _ in new_entity_list)]
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

            else:  ###as
                try:  ####常规提取
                    tablelist_as = new_params_json["table_list"]
                    newtabledic = {}
                    new_params_json["new_table_list"] = []
                    if tablelist_as:
                        for table in tablelist_as:
                            newtabledic[table[0]] = table[1:]
                            new_params_json["new_table_list"].append(table)
                    code_extract, res_extract = DataBase(new_params_json).get_entity_edge(new_params_json)
                    if code_extract != CommonResponseStatus.SUCCESS.value:
                        self.update_state(state="FAILURE", meta=res_extract)
                        return {'current': 100, 'total': 100}
                        # raise Ignore()
                        # return code_extract, res_extract
                    newtable_list = res_extract["file_list"]
                    new_entity_list = res_extract["res"]["entity_list"]
                    new_entity_property_dict = res_extract["res"]["entity_property_dict"]

                    new_entity_for_table_dict = res_extract["res"]["entity_main_table_dict"]
                    new_entity_for_table_dict_path = []
                    if len(new_entity_for_table_dict) != 0:
                        for entity in new_entity_for_table_dict:
                            main_table = entity["main_table"]
                            entity["main_table"] = []
                            if main_table:
                                for one in main_table:
                                    path = newtabledic[one]
                                    entity["main_table"].append([one, path[0], path[1]])
                                new_entity_for_table_dict_path.append(entity)

                    res = {}
                    res["entity_list"] = [list(t) for t in set(tuple(_) for _ in new_entity_list)]
                    res["entity_property_dict"] = new_entity_property_dict
                    res["entity_relation_set"] = new_relation_set
                    res["entity_main_table_dict"] = new_entity_for_table_dict_path
                    res["relation_main_table_dict"] = new_relation_main_table
                    res["relation_property_dict"] = new_relation_property_dict
                    res["extract_type"] = "标准抽取"
                    obj["res"] = res
                    obj["file_list"] = newtable_list
                    return obj
                except Exception as e:
                    obj = {}
                    err = repr(e)
                    obj['cause'] = err
                    obj['code'] = CommonResponseStatus.REQUEST_ERROR.value
                    obj['message'] = "Predict ontology fail"
                    self.update_state(state="FAILURE", meta=obj)
                    return {'current': 100, 'total': 100}
                    # raise Ignore()
                    # return ret_code, obj
    except Exception as e:
        obj["cause"] = str(repr(e))
        obj["message"] = "predict ontology failed"
        obj["code"] = 500
        self.update_state(state="FAILURE", meta=obj)
        return {'current': 100, 'total': 100}

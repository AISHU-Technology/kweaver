# -*- coding: utf-8 -*-
# @Time : 2021/10/18 15:30
# @Author : jack.li
# @Email : jack.li@aishu.cn
# @File : mongo2orientdb.py
# @Project : builder
import re
import os
import sys
import time
import math
import pymongo
import ahocorasick
import pandas as pd
from functools import partial
from utils.CommonUtil import commonutil
from multiprocessing.dummy import Pool as ThreadPool


class Celeryconfig(object):
    def __init__(self):
        self.mongodb_add = "kg-mongodb"  # 10.4.81.11  kg-mongodb
        self.mongodb_port = "27017"

celeryconfig = Celeryconfig()

def command_create_new(pro_class, start_sql, end_sql, pro_dict):
    create_sql = [f"let $start_data ={start_sql}",
                           f"let $end_data ={end_sql}"]
    relation_create_sql = f"create edge {pro_class} UPSERT from $start_data to $end_data"

    num = 0
    if pro_dict:
        for pro in pro_dict:
            pro_value = normalize_text(str(pro_dict[pro]))
            if num == 0:
                if pro == "timestamp":
                    relation_create_sql += " , `{}`={} ".format(pro, str(pro_value))
                else:
                    relation_create_sql += " set `{}`='{}' ".format(pro, str(pro_value))
            else:
                if pro == "timestamp":
                    relation_create_sql += " , `{}`={} ".format(pro, str(pro_value))
                else:
                    relation_create_sql += " , `{}`='{}' ".format(pro, str(pro_value))
            num += 1
    relation_create_sql += " RETRY 1000 WAIT 10"
    relation_create_sql = re.sub('[\r|\n]*', "", relation_create_sql)
    create_sql.append(relation_create_sql)
    return create_sql

def _get_select_sql(obj, property_dict):
    sql = 'select from `{}` where '.format(obj)
    for i, (property_key, property_value) in enumerate(property_dict.items()):
        property_value = normalize_text(str(property_value))
        # if property_value in ["None", "null", " ", ""]:
        #     flag += 1
        #     continue
        if i == 0:
            sql += "`{}`='{}'".format(property_key, str(property_value))
        # elif flag == i:
        #     sql += "`{}`='{}'".format(property_key, str(property_value))
        else:
            sql += " and `{}`='{}'".format(property_key, str(property_value))
    return sql


def process_edg_new(item,s_class,o_class,edge_class):
    s, p, o, s_pro, p_pro, o_pro = \
        item["s"], item["p"], item["o"], item["s_pro"], item["p_pro"], item[
            "o_pro"]
    p_pro["timestamp"] = str(time.time())
    if "_id" in s_pro:
        del s_pro["_id"]
    if "_id" in p_pro:
        del p_pro["_id"]
    if "_id" in o_pro:
        del o_pro["_id"]
    s_sql = _get_select_sql(s_class, s_pro)
    o_sql = _get_select_sql(o_class, o_pro)
    s_sql = re.sub('[\r|\n]*', "", s_sql)
    o_sql = re.sub('[\r|\n]*', "", o_sql)
    relation_create_sql = command_create_new(edge_class, s_sql, o_sql, p_pro)
    return relation_create_sql

def normalize_text(text):
    text = re.sub(r"[\n\t\'\"]", " ", text)
    text = text.replace("\\", "\\\\").strip()
    return text

def process_class(batch_iter, otl_tab, en_pro_dict, merge_otls, otl_name):
    process_class_sql = ""
    # batch_id = batch_iter['_id']
    row = batch_iter
    tab_val = []
    tab_val_index = []
    for ot_tb in otl_tab:
        tb_val = otl_tab[ot_tb]
        if tb_val in row.keys():
            row_val_t = row[tb_val]
            if not (tb_val in ["type_as", "type_sa", "type_kc", "type_nw"] and row_val_t == "false"):
                if row_val_t:
                    if not (isinstance(row_val_t, float) and math.isnan(row_val_t)):
                        val = "%(otlpro)s=%(otlvalue)s" % {"otlpro": "`" + ot_tb + "`",
                                                           "otlvalue": orient_type_transform(
                                                               normalize_text(
                                                                   str(row_val_t)),
                                                               en_pro_dict[otl_name][
                                                                   ot_tb])}
                        tab_val.append(val)
                        if otl_name in merge_otls:
                            merge_pros = merge_otls[otl_name]
                            if ot_tb in merge_pros:
                                tab_val_index.append(val)
    if "ds_id" in row.keys():
        tab_val.append('`ds_id`=\'' + str(row["ds_id"]) + '\'')

    ts = time.time()
    tab_val.append(" `timestamp` = " + str(ts))
    if tab_val:
        if tab_val_index:
            sql = "UPDATE `{}` SET {} UPSERT WHERE {}".format(otl_name, ",".join(
                m for m in tab_val), " and ".join(m for m in tab_val_index))
            process_class_sql = sql
        else:
            sql = "UPDATE `{}` SET {} UPSERT WHERE {}".format(otl_name, ",".join(
                m for m in tab_val), " and ".join(m for m in tab_val))
            process_class_sql = sql
    process_class_sql = re.sub('[\r|\n]*', "", process_class_sql)
    return process_class_sql


def oriendb_batch_http(address,db,sql,port,username,password,graph_id):

    import requests
    from requests.auth import HTTPBasicAuth
    orient_url = "http://{}:{}/batch/{}".format(address, port, db)
    print(orient_url)
    body = {
        "transaction": False,
        "operations": [
            {
                "type": "script",
                "language": "sql",
                "script": sql
            }
        ]
    }
    print(body)
    headers = {"Connection": "close"}
    #重试20次
    for _ in range(20):
        try:
            or_res = requests.post(url=orient_url, headers=headers, json=body, auth=HTTPBasicAuth(username, password))
            if or_res.status_code != 200:
                if or_res.status_code == 409:
                    print(f'mvcc error start retry')
                    continue
        except Exception as e:
            print(f'write orientdb error:{str(e)},sleep 1s,start retry')
            time.sleep(1)
        else:
            # if not oriendb_batch_http.updategraph:
            #     if or_res.status_code == 200:
            #         if isinstance(sql, list):
            #             for sq in sql:
            #                 if "create" in sq.lower() or "drop" in sq.lower() or "update" in sq.lower():
            #                     oriendb_batch_http.updategraph = True
            #                     break
            #         elif isinstance(sql, str):
            #             if "create" in sql.lower() or "drop" in sql.lower() or "update" in sql.lower():
            #                 oriendb_batch_http.updategraph = True
            #     else:
            #         print(or_res.json())
            return or_res.status_code, or_res.json()
    return 500, {}


def oriendb_http(address,db,sql,graph_id,port,username,password):
    import requests
    from requests.auth import HTTPBasicAuth
    orient_url = "http://{}:{}/command/{}/sql".format(address, port, db)
    sql=re.sub('[\r|\n]*',"",sql)
    body = {"command": sql}
    headers = {"Connection": "close"}
    #重试10次
    for _ in range(10):
        try:
            or_res = requests.post(url=orient_url, headers=headers, json=body, auth=HTTPBasicAuth(username, password))
        except Exception as e:
            print(f'run orientdb sql error:{str(e)},sleep 1s retry')
        else:
            # if not oriendb_batch_http.updategraph:
            #     if or_res.status_code == 200:
            #         if "create" in sql.lower() or "drop" in sql.lower():
            #             oriendb_batch_http.updategraph = True
            #     else:
            #         print(sql)
            #         print(or_res.json())
            return or_res.status_code, or_res.json()
    return 500, {}

def orient_type_transform(value,type):
    if type=="string" or type=="datetime" or type=="date":
        value="'"+str(value)+"'"
        return value
    else:
        return str(value)

def get_pro_type(graph_otl):
    entity_pro_dict={}
    edge_pro_dict = {}
    otl=graph_otl[0]
    entitys=otl["entity"]
    edges=otl["edge"]
    for entity in entitys:
        name=entity["name"]
        properties=entity["properties"]
        entity_pro_dict[name]={}
        for pro in properties:
            entity_pro_dict[name][pro[0]]=pro[1]
    for edge in edges:
        name = edge["name"]
        properties = edge["properties"]
        edge_pro_dict[name] = {}
        for pro in properties:
            edge_pro_dict[name][pro[0]] = pro[1]
    return entity_pro_dict,edge_pro_dict

def gr_map2(pro_index,en_pro_dict,edge_pro_dict,g_kmap,g_baseinfo,g_merge,graphid):
    merge_falg = False
    otls_map = []  # 本体映射
    relations_map = []  # 关系映射
    merge_otls = {}
    try:
        for map_dict in g_kmap:
            for map_key in map_dict:
                if map_key == "otls_map":
                    # 本体映射
                    otls_map = map_dict[map_key]
                elif map_key == "relations_map":
                    # 关系映射
                    relations_map = map_dict[map_key]
        for gme in g_merge:
            merge_falg = gme["status"]
            entity_classes = gme["entity_classes"]
            for ec in entity_classes:
                otl_n = ec["name"]  # 类
                otl_pro = ec["properties"]
                merge_pro = {}
                for op in otl_pro:
                    ft = op['function']
                    ft_pro = op['property']  # 融合的属性
                    merge_pro[ft_pro] = ft
                merge_otls[otl_n] = merge_pro
        # 遍历本体和实体的映射 组装 [[{本体：实体},{本体属性：实体属性}]]
        all_otl_class = []
        for otl_class in otls_map:
            otl_class_list = []
            dict1 = {}
            dict1[otl_class["otl_name"]] = otl_class["entity_type"]
            otl_class_list.append(dict1)
            property_map = otl_class["property_map"]
            for pro_map in property_map:
                dict2 = {}
                dict2[pro_map["otl_prop"]] = pro_map["entity_prop"]
                otl_class_list.append(dict2)
            all_otl_class.append(otl_class_list)

        address = ""
        mongo_db = ""
        graph_mongo_Name = ""
        for baseInfo in g_baseinfo:
            address = baseInfo["graphDBAddress"]  # 图数据库ip
            mongo_db = baseInfo["graph_DBName"]  # 图数据库名也是MongoDB数据库名
            graph_mongo_Name = baseInfo["graph_mongo_Name"]
        import pyorient
        import requests
        sys.path.append(os.path.abspath("../"))
        from dao.task_dao import task_dao
        ret = task_dao.getGraphDBbyIp(address)
        rec_dict = ret.to_dict('records')
        if len(rec_dict)==0:
            return 500, "DB IP does not exist"
        rec_dict = rec_dict[0]
        username = rec_dict["db_user"]
        # username = commonutil.DecryptBybase64(username)
        password = rec_dict["db_ps"]
        password = commonutil.DecryptBybase64(password)
        graph_DBPort = rec_dict["port"]
        # 连接数据库
        client_mon = pymongo.MongoClient(
            'mongodb://' + celeryconfig.mongodb_add + ':' + celeryconfig.mongodb_port + '/')
        db = client_mon[graph_mongo_Name]
        # 统计mongodb 和 orientdb的数据量写入task表
        # graph_dao.updateKQ(graphid, graph_mongo_Name, celeryconfig.mongodb_add, celeryconfig.mongodb_port)
        index_query = "select expand(indexes) from metadata:indexmanager"
        code ,re_index = oriendb_http(address, mongo_db, index_query,graphid,graph_DBPort,username,password)

        present_index_filed = {}
        present_index_name = {}
        present_index_filed_unique = {}
        present_index_name_unique = {}
        if "result" in re_index.keys():
            index = re_index["result"]
            for object in index:
                if object["type"] == "FULLTEXT":
                    index_name = object["name"]
                    classname = object["indexDefinition"]["className"]
                    present_index_name[classname] = index_name
                    if len(object["indexDefinition"]) == 4:  ###多个shuxing
                        indexDefinitions = object["indexDefinition"]["indexDefinitions"]
                        properties = []
                        for j in indexDefinitions:
                            filed = j["field"]
                            properties.append(filed)
                        present_index_filed[classname] = properties
                    else:
                        present_index_filed[classname] = object["indexDefinition"]["field"]
                elif object["type"] == "UNIQUE_HASH_INDEX":
                    index_name = object["name"]
                    classname = object["indexDefinition"]["className"]
                    present_index_name_unique[classname] = index_name
                    if len(object["indexDefinition"]) == 4:  ###多个shuxing
                        indexDefinitions = object["indexDefinition"]["indexDefinitions"]
                        properties = []
                        for j in indexDefinitions:
                            filed = j["field"]
                            properties.append(filed)
                        present_index_filed_unique[classname] = properties
                    else:
                        present_index_filed_unique[classname] = object["indexDefinition"]["field"]
        # # 多进程 + 多线程 需要设置环境变量export PYTHONOPTIMIZE=1
        # pool = multiprocessing.Pool(multiprocessing.cpu_count())
        # partial_work55 = partial(mul_process_class, relations_map=relations_map, address=address,
        #                          mongo_db=mongo_db, graphid=graphid, graph_DBPort=graph_DBPort,
        #                          username=username,
        #                          password=password, present_index_name=present_index_name, pro_index=pro_index,
        #                          merge_falg=merge_falg,
        #                          present_index_filed=present_index_filed,
        #                          present_index_name_unique=present_index_name_unique, merge_otls=merge_otls,
        #                          en_pro_dict=en_pro_dict
        #                          )
        # pool.map(partial_work55, all_otl_class)

        # 遍历实体映射创建本体图谱
        start_create_vertex = time.time()
        for o_i in range(len(all_otl_class)):
            dict_otl = all_otl_class[o_i]
            otl_name = ""  # 本体
            tab_ = ""  # 表
            otl_pro = []
            tab_pro = []
            tab_otl = {}
            otl_tab = {}

            for all_otl_in in range(len(dict_otl)):
                otl_keys = dict_otl[all_otl_in]
                if all_otl_in == 0:

                    otl_key = list(otl_keys.keys())
                    otl_name = otl_key[0]
                    tab_ = otl_keys[otl_name]
                else:
                    # otl_keys = dict_otl[all_otl_in]
                    otl_key = list(otl_keys.keys())
                    otl_pro.append(otl_key[0])
                    tab_pro.append(otl_keys[otl_key[0]])
                    tab_otl[otl_keys[otl_key[0]]] = otl_key[0]
                    otl_tab[otl_key[0]] = otl_keys[otl_key[0]]
            flag_dl = False
            for rela in relations_map:
                if "relation_info" not in rela.keys():
                    continue
                if "property_map" not in rela.keys():
                    continue
                if "relation_map" not in rela.keys():
                    continue
                edge_so_dict = {}
                relation_info = rela["relation_info"]
                begin_class = relation_info["begin_name"]
                # 关系映射 独立和其他不一样
                relation_map = rela["relation_map"]
                if len(relation_map) > 0:
                    relation_map = relation_map[0]
                    Multi_relation = relation_map["Multi_relation"]
                    if Multi_relation == "独立关联" and otl_name == begin_class:
                        flag_dl = True
            if flag_dl:  # 独立关联走独立的
                continue
            else:
                print(f'开始创建顶点:{otl_name}')
                vertex_time1 = time.time()
                v_class = "create class `{}` extends V".format(otl_name)  # E
                oriendb_http(address, mongo_db, v_class,graphid,graph_DBPort,username,password)
                for o_p in otl_pro:
                    e_pro = "create property `{}`.`{}` {}".format(otl_name, o_p, en_pro_dict[otl_name][o_p])
                    oriendb_http(address, mongo_db, e_pro,graphid,graph_DBPort,username,password)
                address_pro = "create property `{}`.`{}` {}".format(otl_name, "ds_id", "string")
                oriendb_http(address, mongo_db, address_pro, graphid,graph_DBPort,username,password)
                address_pro = "create property `{}`.`{}` {}".format(otl_name, "timestamp", "DOUBLE")
                oriendb_http(address, mongo_db, address_pro, graphid, graph_DBPort, username, password)


                if otl_name in present_index_name:
                    present_filed = present_index_filed[otl_name]
                    if isinstance(present_filed, str):
                        present_filed = [present_filed]
                    new_set =  [i for i in present_filed if i not in otl_pro]
                    for otl in pro_index[otl_name]:
                        if otl not in new_set:
                            new_set.append(otl)
                    o_p_name = "_".join(new_set)
                    o_p_s = ",".join(["`" + pro + "`" for pro in new_set])

                    if not (otl_name == "document" and present_index_name[otl_name] == "document.docfulltexindex"):
                        drop_sql = "DROP INDEX " + "`" + present_index_name[otl_name] + "`"
                        oriendb_http(address, mongo_db, drop_sql, graphid,graph_DBPort,username,password)
                        e_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                            otl_name, o_p_name, otl_name, o_p_s)
                        oriendb_http(address, mongo_db, e_index, graphid,graph_DBPort,username,password)
                        rebuild = 'REBUILD INDEX `{}.fulltext_{}`'.format(otl_name, o_p_name)
                        oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)



                else:
                    o_p_name = "_".join(pro_index[otl_name])
                    o_p_s = ",".join(["`" + pro + "`" for pro in pro_index[otl_name]])
                    e_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                        otl_name, o_p_name, otl_name, o_p_s)
                    oriendb_http(address, mongo_db, e_index,graphid,graph_DBPort,username,password)
                    rebuild = 'REBUILD INDEX `{}.fulltext_{}`'.format(otl_name, o_p_name)
                    oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)
                    # e_index = "create index `{}`.name on `{}`(name) UNIQUE_HASH_INDEX".format(otl_name, otl_name)
                    # client.command(v_index)
                if merge_falg:
                    if otl_name in merge_otls:
                        merge_pros=merge_otls[otl_name]
                        merge_pro=[]
                        for k,v in merge_pros.items():
                            merge_pro.append(k)
                        if merge_pro:
                            index_sql="CREATE INDEX `{}.{}` on `{}` ({}) UNIQUE_HASH_INDEX" .format(otl_name,"_".join(i for i in merge_pro), otl_name,",".join("`"+i+"`" for i in merge_pro))
                            code ,r_json =oriendb_http(address, mongo_db, index_sql,graphid,graph_DBPort,username,password)
                            if otl_name in present_index_name_unique and code == 200:
                                drop_sql = "DROP INDEX " + "`" + present_index_name_unique[otl_name] + "`"
                                code ,r_json =oriendb_http(address, mongo_db, drop_sql, graphid, graph_DBPort, username, password)
                        if otl_name == "label":
                            merge_pro = ["name", "ds_id"]
                            index_sql = "CREATE INDEX `{}.{}` on `{}` ({}) UNIQUE_HASH_INDEX".format(otl_name, "_".join(
                                i for i in merge_pro), otl_name, ",".join("`" + i + "`" for i in merge_pro))
                            code, r_json = oriendb_http(address, mongo_db, index_sql, graphid, graph_DBPort, username,
                                                        password)
                            index_sql = "CREATE INDEX label.name ON label (name) NOTUNIQUE_HASH_INDEX"
                            code, r_json = oriendb_http(address, mongo_db, index_sql, graphid, graph_DBPort, username,
                                                        password)

                # 仅仅多线程
                #开始写入顶点数据
                if tab_ != "":
                    table2 = db[tab_]
                    alldata = table2.find()
                    if alldata.count() > 0:
                        table = db[tab_]
                        alldata_length = alldata.count()
                        iter_size = 1000
                        current = 0
                        batch_id = []
                        # batch = table.find().limit(iter_size)
                        while current < alldata_length:
                            if (batch_id):
                                # batch = table.find({"_id": {'$gt': ObjectId(batch_id[0])}}).limit(iter_size)
                                batch = table.find().limit(iter_size).skip(current)
                            else:
                                batch = table.find().limit(iter_size)
                            # 多线程
                            # pool = ThreadPool(40)
                            # 多进程
                            # pool = multiprocessing.Pool(multiprocessing.cpu_count())
                            partial_work = partial(process_class, otl_tab=otl_tab,
                                                   en_pro_dict=en_pro_dict, merge_otls=merge_otls,
                                                   otl_name=otl_name)
                            # batch_sql = pool.map(partial_work, batch)
                            batch_sql = list(map(partial_work, batch))

                            if (batch_id):
                                # batch = table.find({"_id": {'$gt': ObjectId(batch_id[0])}}).limit(iter_size)
                                batch = table.find().limit(iter_size).skip(current)
                            else:
                                batch = table.find().limit(iter_size)
                            list_d = pd.DataFrame(list(batch))
                            list_d = list_d["_id"].tail(1)
                            batch_id = list_d.tolist()
                            oriendb_batch_http(address, mongo_db, batch_sql, graph_DBPort, username, password,graphid)
                            # pool.close()
                            # pool.join()
                            current = current + iter_size
                            if current % 10000==0:
                                print(f'{otl_name}已插入数据：{current}条')
                vertex_time2 = time.time()
                print(f'创建顶点{otl_name}成功,耗时:{vertex_time2-vertex_time1}s')
        finish_create_vertex = time.time()
        print(f'创建顶点总耗时：{finish_create_vertex-start_create_vertex}s')
        # 遍历关系
        for rela in relations_map:
            edge_so_dict = {}
            if "relation_info" not in rela.keys():
                continue
            if "property_map" not in rela.keys():
                continue
            if "relation_map" not in rela.keys():
                continue
            relation_info = rela["relation_info"]
            edge_class = relation_info["edge_name"]  # 边类的名字  图本体

            edge_class_entity = relation_info["entity_type"]  # 边类映射的实体 抽取
            begin_class = relation_info["begin_name"]  # 首实体 图本体
            end_class = relation_info["end_name"]  # 尾实体 图本体
            print(f'开始创建边:{edge_class}')
            edge_so_dict[edge_class] = {}
            edge_so_dict[edge_class]["out"] = begin_class
            edge_so_dict[edge_class]["in"] = end_class
            edge_claa_list = []  # 边 映射的组装
            e_dict = {}
            e_dict[edge_class] = edge_class_entity
            edge_claa_list.append(e_dict)
            edge_promap = rela["property_map"]
            for pro_map in edge_promap:
                dict3 = {}
                dict3[pro_map["edge_prop"]] = pro_map["entity_prop"]
                edge_claa_list.append(dict3)

            # 关系映射 独立和其他不一样
            relation_map = rela["relation_map"]
            if len(relation_map) > 0:
                relation_map = relation_map[0]
                Multi_relation = relation_map["Multi_relation"]
                if Multi_relation == "文档结构关系":
                    v_class = "create class `{}` extends E".format(edge_class)  # E
                    oriendb_http(address, mongo_db, v_class,graphid,graph_DBPort,username,password)
                    for o_p in edge_claa_list[1:]:
                        o_p = list(o_p.keys())[0]
                        e_pro = "create property `{}`.`{}` {}".format(edge_class, o_p, edge_pro_dict[edge_class][o_p])
                        oriendb_http(address, mongo_db, e_pro,graphid,graph_DBPort,username,password)
                    address_pro = "create property `{}`.`{}` {}".format(edge_class, "timestamp", "DOUBLE")
                    oriendb_http(address, mongo_db, address_pro, graphid, graph_DBPort, username, password)
                    if edge_class in present_index_name:

                        present_filed = present_index_filed[edge_class]
                        newset = []
                        if isinstance(present_filed,str):
                            present_filed=[present_filed]
                        newset =  [i for i in present_filed if i not in edge_claa_list[1:]]
                        for pro in pro_index[edge_class]:
                            # pro = list(pro.keys())[0]
                            if pro not in newset:
                                newset.append(pro)
                        o_p_name = "_".join(newset)
                        o_p_s = ",".join(["`" + pro + "`" for pro in newset])
                        drop_sql = "DROP INDEX " + "`" + present_index_name[edge_class] + "`"
                        oriendb_http(address, mongo_db, drop_sql,graphid,graph_DBPort,username,password)
                        e_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                            edge_class, o_p_name, edge_class, o_p_s)
                        # e_index = "create index {}.name on {}(name) UNIQUE_HASH_INDEX".format(edge_name, edge_name)
                        # client.command(v_index)
                        oriendb_http(address, mongo_db, e_index,graphid,graph_DBPort,username,password)
                        rebuild = 'REBUILD INDEX `{}.fulltext_{}`'.format(edge_class, o_p_name)
                        oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)



                    else:
                        # edge_pro = [list(i.keys())[0] for i in edge_claa_list[1:]]
                        edge_pro = pro_index[edge_class]
                        o_p_name = "_".join(edge_pro)
                        o_p_s = ",".join(["`" + pro + "`" for pro in edge_pro])
                        e_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                            edge_class, o_p_name, edge_class, o_p_s)
                        # e_index = "create index {}.name on {}(name) UNIQUE_HASH_INDEX".format(edge_name, edge_name)
                        # client.command(v_index)
                        oriendb_http(address, mongo_db, e_index,graphid,graph_DBPort,username,password)
                        rebuild = 'REBUILD INDEX `{}.fulltext_{}`'.format(edge_class, o_p_name)
                        oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)


                    in_sql = "CREATE PROPERTY `{}`.`in` LINK  `{}`".format(edge_class, edge_so_dict[edge_class]["in"])
                    out_sql = "CREATE PROPERTY `{}`.`out` LINK  `{}`".format(edge_class, edge_so_dict[edge_class]["out"])
                    oriendb_http(address, mongo_db, in_sql,graphid,graph_DBPort,username,password)
                    oriendb_http(address, mongo_db, out_sql,graphid,graph_DBPort,username,password)
                    # if merge_falg:
                    in_out_index = "CREATE INDEX  `{}.in_out`  ON  `{}`  (out,in)  UNIQUE_HASH_INDEX".format(
                        edge_class, edge_class)
                    oriendb_http(address, mongo_db, in_out_index, graphid, graph_DBPort, username, password)
                    try:
                        s_class = edge_class.split("2")[0]
                        o_class = edge_class.split("2")[-1]
                        # rela_table = db[edge_class]
                        # rela_table_data = rela_table.find()
                        # pool = ThreadPool(1)
                        # # pool = multiprocessing.Pool(20)
                        # partial_work = partial(process_class44,s_class=s_class,o_class=o_class,edge_class=edge_class, address=address,
                        #                        mongo_db=mongo_db, graphid=graphid, graph_DBPort=graph_DBPort, username=username, password=password)
                        # pool.map(partial_work, rela_table_data)
                        # pool.close()
                        # pool.join()

                        if edge_class != "":
                            table2 = db[edge_class]
                            alldata = table2.find()
                            # 关系改为批量执行
                            pool = ThreadPool(20)
                            # pool = multiprocessing.Pool(10)
                            if alldata.count() > 0:
                                table = db[edge_class]
                                alldata_length = alldata.count()
                                iter_size = 1000
                                current = 0
                                batch_id = []
                                # batch = table.find().limit(iter_size)
                                while current < alldata_length:
                                    if (batch_id):
                                        # batch = table.find({"_id": {'$gt': ObjectId(batch_id[0])}}).limit(iter_size)
                                        batch = table.find().limit(iter_size).skip(current)
                                    else:
                                        batch = table.find().limit(iter_size)

                                    # pool = ThreadPool(500)
                                    # pool = multiprocessing.Pool(10)
                                    # partial_work = partial(process_class33, otl_tab=otl_tab,
                                    #                        en_pro_dict=en_pro_dict, merge_otls=merge_otls,
                                    #                        otl_name=otl_name)
                                    # batch_sql = pool.map(partial_work, batch)
                                    partial_work = partial(process_edg_new, s_class=s_class, o_class=o_class,
                                                           edge_class=edge_class)
                                    batch_sql= list(map(partial_work, batch))
                                    sql_list=[]
                                    for data in batch_sql:
                                        sql_list.extend(data)
                                    # 批量出来有创建语句和更新语句；创建语句批量一个错都错了。
                                    # batch_sql [[创建sql，更新],[创建sql，更新]]
                                    # 不使用内存转换 [[创建sql，创建sql],[更新，更新]]
                                    # batch_sql_t =list(map(list, itertools.zip_longest(*batch_sql)))
                                    # 使用内存转换 [[创建sql，创建sql],[更新，更新]]
                                    # batch_sql_t = list(map(list, zip(*batch_sql)))
                                    if (batch_id):
                                        # batch = table.find({"_id": {'$gt': ObjectId(batch_id[0])}}).limit(iter_size)
                                        batch = table.find().limit(iter_size).skip(current)
                                    else:
                                        batch = table.find().limit(iter_size)
                                    list_d = pd.DataFrame(list(batch))
                                    list_d = list_d["_id"].tail(1)
                                    batch_id = list_d.tolist()
                                    pool.apply_async(oriendb_batch_http,
                                               (address, mongo_db, sql_list, graph_DBPort, username, password,
                                                graphid,))
                                    # print("批两处理关系最后一个id: ",batch_id)
                                    # 创建
                                    # oriendb_batch_http(address, mongo_db, batch_sql_t[0], graph_DBPort, username, password,
                                    #                    graphid)
                                    # 更新
                                    # oriendb_batch_http(address, mongo_db, batch_sql_t[1], graph_DBPort, username,
                                    #                    password,
                                    #                    graphid)
                                    # del batch_sql
                                    # del batch_sql_t
                                    # pool.close()
                                    # pool.join()
                                    current = current + iter_size
                                    if current % 10000 == 0:
                                        print(f'{edge_class}已插入数据：{current}条')
                            pool.close()
                            pool.join()
                            print(f'{edge_class}共插入(更新)数据{alldata.count()}条')
                        # rela_table = db[edge_class]
                        # rela_table_data = rela_table.find()
                        # # 多线程
                        # print("准备进入多进程")
                        # pool = ThreadPool(3)
                        # # pool = multiprocessing.Pool(3)
                        # partial_work = partial(process_edg, s_class=s_class, o_class=o_class, edge_class=edge_class,
                        #                        address=address,
                        #                        mongo_db=mongo_db, graphid=graphid, graph_DBPort=graph_DBPort,
                        #                        username=username, password=password)
                        # # rela_table_data 大小固定游标方式读取
                        # pool.map(partial_work, rela_table_data)
                        # pool.close()
                        # pool.join()
                    except Exception as e:
                        print(repr(e))
                elif Multi_relation == "包含关系":
                    sql = "create class {} extends E".format(edge_class)
                    oriendb_http(address, mongo_db, sql,graphid,graph_DBPort,username,password)
                    for o_p in edge_claa_list[1:]:
                        o_p = list(o_p.keys())[0]
                        e_pro = "create property `{}`.`{}` {}".format(edge_class, o_p, edge_pro_dict[edge_class][o_p])
                        oriendb_http(address, mongo_db, e_pro,graphid,graph_DBPort,username,password)
                    address_pro = "create property `{}`.`{}` {}".format(edge_class, "timestamp", "DOUBLE")
                    oriendb_http(address, mongo_db, address_pro, graphid, graph_DBPort, username, password)
                    if edge_class in present_index_name:

                        present_filed = present_index_filed[edge_class]
                        newset = []
                        if isinstance(present_filed,str):
                            present_filed=[present_filed]
                        newset =  [i for i in present_filed if i not in edge_claa_list[1:]]
                        # for pro in edge_claa_list[1:]:
                        for pro in pro_index[edge_class]:
                            # pro = list(pro.keys())[0]
                            if pro not in newset:
                                newset.append(pro)
                        o_p_name = "_".join(newset)
                        o_p_s = ",".join(["`" + pro + "`" for pro in newset])
                        drop_sql = "DROP INDEX " + "`" + present_index_name[edge_class] + "`"
                        oriendb_http(address, mongo_db, drop_sql,graphid,graph_DBPort,username,password)
                        e_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                            edge_class, o_p_name, edge_class, o_p_s)
                        # e_index = "create index {}.name on {}(name) UNIQUE_HASH_INDEX".format(edge_name, edge_name)
                        # client.command(v_index)
                        oriendb_http(address, mongo_db, e_index,graphid,graph_DBPort,username,password)
                        rebuild = 'REBUILD INDEX `{}.fulltext_{}`'.format(edge_class, o_p_name)
                        oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)

                    else:
                        # edge_pro = [list(i.keys())[0] for i in edge_claa_list[1:]]
                        edge_pro = pro_index[edge_class]
                        o_p_name = "_".join(edge_pro)
                        o_p_s = ",".join(["`" + pro + "`" for pro in edge_pro])
                        e_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                            edge_class, o_p_name, edge_class, o_p_s)
                        # e_index = "create index {}.name on {}(name) UNIQUE_HASH_INDEX".format(edge_name, edge_name)
                        # client.command(v_index)
                        oriendb_http(address, mongo_db, e_index,graphid,graph_DBPort,username,password)
                        rebuild = 'REBUILD INDEX `{}.fulltext_{}`'.format(edge_class, o_p_name)
                        oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)
                    in_sql = "CREATE PROPERTY `{}`.`in` LINK  `{}`".format(edge_class, edge_so_dict[edge_class]["in"])
                    out_sql = "CREATE PROPERTY `{}`.`out` LINK  `{}`".format(edge_class,
                                                                             edge_so_dict[edge_class]["out"])
                    oriendb_http(address, mongo_db, in_sql,graphid,graph_DBPort,username,password)
                    oriendb_http(address, mongo_db, out_sql,graphid,graph_DBPort,username,password)
                    if merge_falg:
                        in_out_index = "CREATE INDEX  `{}.in_out`  ON  `{}`  (  `in`, `out` )  UNIQUE_HASH_INDEX".format(edge_class, edge_class)
                        oriendb_http(address, mongo_db, in_out_index, graphid, graph_DBPort, username, password)

                    ###step1:构建初始类构建AC自动机
                    begin_prop = relation_map["begin_prop"]
                    end_prop = relation_map["end_prop"]
                    map_dict={}
                    for o_i in range(len(all_otl_class)):
                        dict_otl = all_otl_class[o_i]
                        if begin_class in dict_otl[0].keys():
                            map_dict[begin_class]= dict_otl[0][begin_class]
                        if end_class in dict_otl[0].keys():
                            map_dict[end_class] = dict_otl[0][end_class]
                    data = list(db[map_dict[begin_class]].find())
                    if len(data) > 0:
                        ACtree = ahocorasick.Automaton()
                        for index, onedata in enumerate(data):
                            if begin_prop in onedata:
                                word = onedata[begin_prop]
                                if word:
                                    ACtree.add_word(str(word), (index, str(word)))
                        ACtree.make_automaton()
                        enddata = db[map_dict[end_class]].find()
                        if enddata.count() > 0:
                            for i in list(enddata):
                                command = []
                                for k, v in i.items():
                                    if k != "_id":
                                        sql = k + "=" + '"' + normalize_text(str(v)) + '"'
                                        command.append(sql)
                                if end_prop in i:
                                    if i[end_prop]:
                                        one = str(i[end_prop])
                                        words=[]
                                        for j in ACtree.iter(one):
                                            if j[1][1] not in words:
                                                words.append(j[1][1])
                                        for word in words:
                                            orientsql = "CREATE EDGE  `{}` FROM (select from `{}` where `{}`={}) TO (select from `{}` where {})  set `{}`={} , `timestamp` = {}".format \
                                                (edge_class, begin_class, begin_prop,'"' + normalize_text(str(word)) + '"', end_class,
                                                 " and ".join(command), "name", '"' + edge_class + '"',str(time.time()))
                                            code ,r_json = oriendb_http(address, mongo_db, orientsql, graphid, graph_DBPort,username, password)
                                            if code == 500:
                                                if "DuplicatedException" in r_json["errors"][0]["content"]:
                                                    orientsql_update = "UPDATE  EDGE `{}` set out= (select from `{}` where `{}`={}) ,in = (select from `{}` where {}) , `{}`={} , `timestamp` = {} UPSERT where out = (select from `{}` where `{}`={}) and in = (select from `{}` where {})".format \
                                                        (edge_class, begin_class, begin_prop, '"' + normalize_text(str(word)) + '"',
                                                         end_class, " and ".join(command), "name", '"' + edge_class + '"',str(time.time()) , begin_class, begin_prop, '"' + normalize_text(str(word)) + '"',
                                                         end_class, " and ".join(command))
                                                    oriendb_http(address, mongo_db, orientsql_update,graphid,graph_DBPort,username,password)

                                # orientsql = "CREATE EDGE  `{}` FROM (select from `{}` where `{}`={}) TO (select from `{}` where {})  set `{}`={}".format \
                                #     (edge_class, begin_class, begin_prop, '"' + normalize_text(j) + '"', end_class, " and ".join(command), "name",
                                #      '"'+edge_class+'"')
                                # re3 = oriendb_http(address, mongo_db, orientsql)

                begin_prop = relation_map["begin_prop"]
                end_prop = relation_map["end_prop"]
                edge_prop_list = relation_map["edge_prop"]
                if edge_class_entity == "" or begin_prop == "" or end_prop == "" or len(edge_prop_list) == 0:
                    continue
                r_list = []
                if Multi_relation == "独立关联":
                    r_m_dict = {}
                    r_m_dict_2 = {}
                    d_list = []
                    d_list.append(begin_prop)
                    d_list.append(end_prop)
                    r_m_dict[begin_class] = d_list
                    r_list.append(r_m_dict)
                    r_m_dict_2[edge_class] = edge_prop_list
                    r_list.append(r_m_dict_2)
                    # 连接数据库
                    client_mon = pymongo.MongoClient(
                        'mongodb://' + celeryconfig.mongodb_add + ':' + celeryconfig.mongodb_port + '/')
                    db = client_mon[graph_mongo_Name]
                    # edge_claa_list all_otl_class
                    ot_ = all_otl_class[0]
                    ot_dict = ot_[0]
                    entity_t = ot_dict[begin_class]  # E:samp
                    table = db[entity_t]
                    alldata = table.find()
                    if alldata.count() > 0:
                        data = pd.DataFrame(list(alldata))

                        # 读取数据
                        # data = pd.DataFrame(list(table.find()))
                        v_class = "create class `{}` extends V".format(begin_class)  # E
                        eds = edge_claa_list[0]
                        ed = list(eds.keys())

                        e_class = "create class `{}` extends E".format(ed[0])
                        oriendb_http(address, mongo_db, v_class,graphid,graph_DBPort,username,password)
                        oriendb_http(address, mongo_db, e_class,graphid,graph_DBPort,username,password)
                        # create property
                        v_pro = "create property `{}`.`name` string".format(begin_class)
                        e_pro = "create property `{}`.`name` string".format(ed[0])
                        in_sql = "CREATE PROPERTY `{}`.`in` LINK  `{}`".format(ed[0], edge_so_dict[ed[0]]["in"])
                        out_sql = "CREATE PROPERTY `{}`.`out` LINK  `{}`".format(ed[0], edge_so_dict[ed[0]]["out"])
                        oriendb_http(address, mongo_db, v_pro,graphid,graph_DBPort,username,password)
                        oriendb_http(address, mongo_db, e_pro,graphid,graph_DBPort,username,password)
                        oriendb_http(address, mongo_db, in_sql,graphid,graph_DBPort,username,password)
                        oriendb_http(address, mongo_db, out_sql,graphid,graph_DBPort,username,password)
                        address_pro = "create property `{}`.`{}` {}".format(ed[0], "timestamp", "string")
                        oriendb_http(address, mongo_db, address_pro, graphid, graph_DBPort, username, password)
                        if merge_falg:
                            in_out_index = "CREATE INDEX  `{}.in_out`  ON  `{}`  (  `in`, `out` )  UNIQUE_HASH_INDEX".format(
                                ed[0], ed[0])
                            oriendb_http(address, mongo_db, in_out_index, graphid, graph_DBPort, username, password)

                        if ed[0] in present_index_name:
                            drop_sql = "DROP INDEX " + "`" + present_index_name[ed[0]] + "`"
                            oriendb_http(address, mongo_db, drop_sql,graphid,graph_DBPort,username,password)
                            edge_pro = pro_index[ed[0]]
                            o_p_name = "_".join(edge_pro)
                            o_p_s = ",".join(["`" + pro + "`" for pro in edge_pro])

                            e_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                                ed[0],o_p_name, ed[0],o_p_s)
                            oriendb_http(address, mongo_db, e_index, graphid,graph_DBPort,username,password)
                            rebuild = 'REBUILD INDEX `{}`.fulltext_name'.format(ed[0])
                            oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)
                        else:
                            edge_pro = pro_index[ed[0]]
                            o_p_name = "_".join(edge_pro)
                            o_p_s = ",".join(["`" + pro + "`" for pro in edge_pro])

                            e_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                                ed[0], o_p_name, ed[0], o_p_s)
                            oriendb_http(address, mongo_db, e_index,graphid,graph_DBPort,username,password)
                            rebuild = 'REBUILD INDEX `{}`.fulltext_name'.format(ed[0])
                            oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)
                        if merge_falg:
                            create_property_index_sql = "CREATE INDEX `{}.{}` on `{}` ({}) UNIQUE_HASH_INDEX".format(ed[0],"name", ed[0], "name")
                            code ,r_json = oriendb_http(address, mongo_db, create_property_index_sql, graphid, graph_DBPort, username,password)
                            if ed[0] in present_index_name_unique and code == 200:
                                drop_sql = "DROP INDEX " + "`" + present_index_name_unique[ed[0]] + "`"
                                oriendb_http(address, mongo_db, drop_sql, graphid, graph_DBPort, username, password)


                        if begin_class in present_index_name:
                            drop_sql = "DROP INDEX " + "`" + present_index_name[begin_class] + "`"
                            oriendb_http(address, mongo_db, drop_sql,graphid,graph_DBPort,username,password)
                            entity_pro = pro_index[begin_class]
                            o_p_name = "_".join(entity_pro)
                            o_p_s = ",".join(["`" + pro + "`" for pro in entity_pro])

                            v_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                                begin_class,o_p_name, begin_class,o_p_s)
                            oriendb_http(address, mongo_db, v_index,graphid,graph_DBPort,username,password)
                            rebuild = 'REBUILD INDEX `{}`.fulltext_name'.format(begin_class)
                            oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)

                        else:

                            edge_pro = pro_index[begin_class]
                            o_p_name = "_".join(edge_pro)
                            o_p_s = ",".join(["`" + pro + "`" for pro in edge_pro])

                            v_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                                begin_class, o_p_name, begin_class, o_p_s)
                            # v_index = "create index {}.name on {}(name) UNIQUE_HASH_INDEX".format(ed[0], ed[0])
                            # client.command(v_index)
                            oriendb_http(address, mongo_db, v_index,graphid,graph_DBPort,username,password)
                            rebuild = 'REBUILD INDEX `{}.fulltext_name`'.format(begin_class)
                            oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)
                        if merge_falg:
                            create_property_index_sql = "CREATE INDEX `{}.{}` on `{}` ({}) UNIQUE_HASH_INDEX".format(begin_class,"name", begin_class, "name")
                            code ,r_json = oriendb_http(address, mongo_db, create_property_index_sql, graphid, graph_DBPort, username,password)
                            if begin_class in present_index_name_unique and code == 200:
                                drop_sql = "DROP INDEX " + "`" + present_index_name_unique[begin_class] + "`"
                                oriendb_http(address, mongo_db, drop_sql, graphid, graph_DBPort, username, password)

                        for index, row in data.iterrows():
                            if not (isinstance(row[begin_prop], float) and math.isnan(row[begin_prop])):
                                v_sql = 'UPDATE  `{}` set `name`="{}" ,`timestamp` = {} UPSERT WHERE `name`="{}"'.format(begin_class,normalize_text(row[begin_prop]),str(time.time()),normalize_text(row[begin_prop]))
                                oriendb_http(address, mongo_db, v_sql,graphid,graph_DBPort,username,password)
                                v_sql2 = 'UPDATE  `{}` set `name`="{}" ,`timestamp` = {} UPSERT WHERE `name`="{}"'.format(begin_class,normalize_text(row[end_prop]),str(time.time()),normalize_text(row[end_prop]) )
                                oriendb_http(address, mongo_db, v_sql2,graphid,graph_DBPort,username,password)

                            e_sql2 = 'create edge `{}` from (SELECT FROM `{}` WHERE name = "{}") to ' \
                                     '(SELECT FROM `{}` WHERE name = "{}") set name="{}" ,`timestamp`= {}'.format(ed[0], begin_class,
                                                                                                 row[begin_prop],
                                                                                                 begin_class,
                                                                                                 row[end_prop],
                                                                                                 row[edge_prop_list[0]],str(time.time()))
                            code , r_json = oriendb_http(address, mongo_db, e_sql2, graphid, graph_DBPort, username, password)
                            if code == 500:
                                if "DuplicatedException" in r_json["errors"][0]["content"]:
                                    e_sql2_update = 'UPDATE EDGE `{}` SET  out = (SELECT FROM `{}` WHERE name = "{}"),in = ' \
                                             '(SELECT FROM `{}` WHERE name = "{}") , name="{}" ,`timestamp`={} UPSERT WHERE out = (SELECT FROM `{}` WHERE name = "{}") and in = ' \
                                             '(SELECT FROM `{}` WHERE name = "{}") '.format(ed[0], begin_class,row[begin_prop],begin_class,row[end_prop],row[edge_prop_list[0]],str(time.time()),begin_class,row[begin_prop],begin_class,row[end_prop])
                                    oriendb_http(address, mongo_db, e_sql2_update,graphid,graph_DBPort,username,password)



                else:
                    r_m_dict = {}
                    r_m_dict[begin_class] = begin_prop
                    r_m_dict_2 = {}
                    r_m_dict_2[end_class] = end_prop
                    r_m_dict_3 = {}
                    r_m_dict_3[edge_class] = edge_prop_list
                    r_list.append(r_m_dict)
                    r_list.append(r_m_dict_2)
                    r_list.append(r_m_dict_3)

                    r_m_dict = {}
                    r_m_dict_2 = {}
                    d_list = []
                    d_list.append(begin_prop)
                    d_list.append(end_prop)
                    r_m_dict[begin_class] = d_list
                    r_list.append(r_m_dict)
                    r_m_dict_2[edge_class] = edge_prop_list
                    r_list.append(r_m_dict_2)


                    r_m_dict[begin_class] = begin_prop
                    r_m_dict_2[end_class] = end_prop
                    r_m_dict_3[edge_class] = edge_prop_list

                    # 遍历边的数据，根据关系映射创建关系
                    edge_name = ""  # 本体
                    edge_tab_ = ""  # 表
                    edge_pro = []
                    edge_tab_pro = []
                    edge_tab_otl = {}
                    for all_otl_in in range(len(edge_claa_list)):
                        if all_otl_in == 0:
                            edg_keys = edge_claa_list[all_otl_in]
                            edg_key = list(edg_keys.keys())
                            edge_name = edg_key[0]
                            edge_tab_ = edg_keys[edge_name]
                        else:
                            edg_keys = edge_claa_list[all_otl_in]
                            edg_key = list(edg_keys.keys())
                            k = edg_key[0]
                            if k == "name":
                                edge_pro.append(edg_key[0])
                                edge_tab_pro.append(edge_class)
                                edge_tab_otl[edge_class] = edg_key[0]
                            else:
                                edge_pro.append(edg_key[0])
                                edge_tab_pro.append(edg_keys[edg_key[0]])
                                edge_tab_otl[edg_keys[edg_key[0]]] = edg_key[0]

                    v_class = "create class `{}` extends E".format(edge_name)  # E
                    oriendb_http(address, mongo_db, v_class,graphid,graph_DBPort,username,password)
                    for o_p in edge_pro:
                        e_pro = "create property `{}`.`{}` {}".format(edge_name, o_p, edge_pro_dict[edge_name][o_p])
                        oriendb_http(address, mongo_db, e_pro,graphid,graph_DBPort,username,password)
                    address_pro = "create property `{}`.`{}` {}".format(edge_name, "timestamp", "DOUBLE")
                    oriendb_http(address, mongo_db, address_pro, graphid, graph_DBPort, username, password)
                    if edge_name in present_index_name:

                        present_filed = present_index_filed[edge_name]
                        newset = []
                        if isinstance(present_filed,str):
                            present_filed=[present_filed]
                        newset =  [i for i in present_filed if i not in edge_pro]
                        for pro in pro_index[edge_name]:
                            if pro not in newset:
                                newset.append(pro)
                        o_p_name = "_".join(newset)
                        o_p_s = ",".join(["`" + pro + "`" for pro in newset])
                        drop_sql = "DROP INDEX " + "`" + present_index_name[edge_name] + "`"
                        oriendb_http(address, mongo_db, drop_sql,graphid,graph_DBPort,username,password)

                        e_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                            edge_name, o_p_name, edge_name, o_p_s)
                        # e_index = "create index {}.name on {}(name) UNIQUE_HASH_INDEX".format(edge_name, edge_name)
                        # client.command(v_index)
                        oriendb_http(address, mongo_db, e_index,graphid,graph_DBPort,username,password)
                        rebuild = 'REBUILD INDEX `{}.fulltext_{}`'.format(edge_name, o_p_name)
                        oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)

                    else:
                        o_p_name = "_".join(pro_index[edge_name])
                        o_p_s = ",".join(["`" + pro + "`" for pro in edge_pro])
                        e_index = 'create index `{}.fulltext_{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                            edge_name, o_p_name, edge_name, o_p_s)
                        # e_index = "create index {}.name on {}(name) UNIQUE_HASH_INDEX".format(edge_name, edge_name)
                        # client.command(v_index)
                        oriendb_http(address, mongo_db, e_index,graphid,graph_DBPort,username,password)
                        rebuild = 'REBUILD INDEX `{}.fulltext_{}`'.format(edge_name, o_p_name)
                        oriendb_http(address, mongo_db, rebuild, graphid,graph_DBPort,username,password)
                    # if merge_falg:
                    #     create_property_index_sql = "CREATE INDEX {}.property_index on {} ({}) UNIQUE".format(edge_name,edge_name,",".join(["`" + pro + "`" for pro in edge_pro]))
                    #     oriendb_http(address, mongo_db, create_property_index_sql, graphid,graph_DBPort,username,password)
                            # e_index = 'create index `{}.{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                    #     edge_name, o_p_name, edge_name, o_p_s)
                    # # e_index = "create index {}.name on {}(name) UNIQUE_HASH_INDEX".format(edge_name, edge_name)
                    # # client.command(v_index)
                    # oriendb_http(address, mongo_db, e_index)
                    # o_p_name = "_".join(edge_pro)
                    # o_p_s = ",".join(["`" + pro + "`" for pro in edge_pro])
                    # e_index = 'create index `{}.{}` on `{}`({}) fulltext engine lucene metadata{{"index": "com.hankcs.lucene.HanLPIndexAnalyzer","query": "com.hankcs.lucene.HanLPAnalyzer"}}'.format(
                    #     edge_name, o_p_name, edge_name, o_p_s)
                    # # e_index = "create index {}.name on {}(name) UNIQUE_HASH_INDEX".format(edge_name, edge_name)
                    # # client.command(v_index)
                    # oriendb_http(address, mongo_db, e_index)
                    in_sql = "CREATE PROPERTY `{}`.`in` LINK  `{}`".format(edge_name, edge_so_dict[edge_name]["in"])
                    out_sql = "CREATE PROPERTY `{}`.`out` LINK  `{}`".format(edge_name, edge_so_dict[edge_name]["out"])
                    oriendb_http(address, mongo_db, in_sql,graphid,graph_DBPort,username,password)
                    oriendb_http(address, mongo_db, out_sql,graphid,graph_DBPort,username,password)
                    if merge_falg:
                        in_out_index = "CREATE INDEX  `{}.in_out`  ON  `{}`  (  `in`, `out` )  UNIQUE_HASH_INDEX".format(
                            edge_name, edge_name)
                        oriendb_http(address, mongo_db, in_out_index, graphid, graph_DBPort, username, password)

                    table2 = db[edge_tab_]
                    alldata = table2.find()
                    if alldata.count() > 0:
                        data2 = pd.DataFrame(list(alldata))
                        # [[{'Entity': 'sample_db'}, {'name': 'entity1'}]]
                        # [{'edge': 'sample_db'}, {'name': 'relation'}]
                        # [{'Entity': ['entity1', 'entity2']}, {'edge': ['relation']}]
                        # 遍历关系表，根据映射信息创建 关系
                        # data2 = pd.DataFrame(list(table2.find()))
                        for index, row in data2.iterrows():

                            set_list = []
                            for edge_tab_i in edge_tab_pro:
                                if edge_tab_otl[edge_tab_i]=="name":
                                    set_con1 = "%(otlpro)s=%(otlvalue)s" % {
                                        "otlpro": "`" + str(edge_tab_otl[edge_tab_i]) + "`",
                                        "otlvalue": "'"+edge_tab_i+"'"}
                                    set_list.append(set_con1)
                                else:
                                    if edge_tab_i!="" and edge_tab_i in row.keys():
                                        set_con1 = "%(otlpro)s=%(otlvalue)s" % {
                                            "otlpro": "`" + str(edge_tab_otl[edge_tab_i]) + "`",
                                            "otlvalue": orient_type_transform(row[edge_tab_i], edge_pro_dict[edge_name][
                                                edge_tab_otl[edge_tab_i]])}
                                        # set_con1 = "`" + str(edge_tab_otl[edge_tab_i]) + "`" + "=" + "'" + orient_type_transform(row[edge_tab_i],edge_pro_dict[edge_name][edge_tab_otl[edge_tab_i]]) + "'"
                                        set_list.append(set_con1)
                            set_list.append('`timestamp` = '+str(time.time()))
                            set_con = ",".join(set_list)

                            if Multi_relation == "内部关联":
                                set_names = []
                                otl_name = ""
                                for o_i in range(len(all_otl_class)):
                                    dict_otl = all_otl_class[o_i]
                                    otl_keys = dict_otl[0]
                                    otl_key = list(otl_keys.keys())
                                    otl_name = otl_key[0]
                                    tab_ = otl_keys[otl_name]
                                    otl_tab_rel = {}
                                    tab_otl_dic = {}
                                    if tab_ == edge_tab_:
                                        for be_dict in range(len(dict_otl)):
                                            otl_keys = dict_otl[be_dict]
                                            otl_key = list(otl_keys.keys())
                                            otl_tab_rel[otl_key[0]] = otl_keys[otl_key[0]]
                                            if be_dict == 0:
                                                tab_otl_dic[otl_keys[otl_key[0]]] = otl_key[0]
                                    for tab_key in otl_tab_rel:
                                        if otl_tab_rel[tab_key] in row.keys():
                                            value=row[otl_tab_rel[tab_key]]
                                            if not (isinstance(value, float) and math.isnan(value)):
                                                set_names.append("`" + str(tab_key) + "`" + "=" + orient_type_transform(row[otl_tab_rel[tab_key]],en_pro_dict[tab_otl_dic[e_dict[edge_class]]][tab_key]))
                                # tab_otl = {}
                                    # if tab_ == edge_tab_:
                                    #     for be_dict in range(len(dict_otl)):
                                    #         otl_keys = dict_otl[be_dict]
                                    #         otl_key = list(otl_keys.keys())
                                    #         tab_otl[otl_keys[otl_key[0]]] = otl_key[0]
                                    # for tab_key in tab_otl:
                                    #     if tab_key in row.keys():
                                    #         set_names.append("`" + str(tab_otl[tab_key]) + "`" + "=" + "'" + str(
                                    #             row[tab_key]) + "' ")
                                o_class = end_class
                                o_pro = end_prop
                                # end_pro_type = en_pro_dict[o_class][edge_prop_list[1]]
                                # o_value = orient_type_transform(row[edge_prop_list[1]], end_pro_type)
                                # 处理修改完属性找不到对应的值
                                o_value = ""
                                for o_i in range(len(all_otl_class)):
                                    dict_otl = all_otl_class[o_i]
                                    otl_keys = dict_otl[0]
                                    otl_key = list(otl_keys.keys())
                                    otl_name = otl_key[0]
                                    if otl_name == end_class:
                                        for dotl in dict_otl[1:]:
                                            for o_k in dotl:
                                                if end_prop ==dotl[o_k]:
                                                    o_pro = o_k
                                                    value=row[edge_prop_list[1]]
                                                    if not (isinstance(value, float) and math.isnan(value)):
                                                        o_value = orient_type_transform(row[edge_prop_list[1]],
                                                                                en_pro_dict[end_class][
                                                                                    o_k])
                                                    break
                                if o_value == "":
                                    end_pro_type = en_pro_dict[o_class][edge_prop_list[1]]
                                    o_value = orient_type_transform(row[edge_prop_list[1]], end_pro_type)
                                create_edg_aql = "CREATE EDGE `{}` FROM (select from `{}` where {}) TO (select from `{}` where `{}`={}) set " \
                                    .format(edge_name, begin_class, " and ".join(set_names), end_class, o_pro, o_value)
                                create_edg_aql += set_con
                                # 待做，执行一次查询，有就不创建
                                code , r_json = oriendb_http(address, mongo_db, create_edg_aql, graphid, graph_DBPort, username,
                                                   password)
                                if code == 500:
                                    if "DuplicatedException" in r_json["errors"][0]["content"]:
                                        create_edg_aql_update = "UPDATE EDGE `{}` SET out= (select from `{}` where {}) ,in = (select from `{}` where `{}`={}) ,{} UPSERT WHERE  out= (select from `{}` where {}) and in = (select from `{}` where `{}`={})" \
                                            .format(edge_name, begin_class, " and ".join(set_names), end_class,o_pro,o_value,set_con , begin_class, " and ".join(set_names), end_class,o_pro,o_value,)

                                    # 待做，执行一次查询，有就不创建
                                        oriendb_http(address, mongo_db, create_edg_aql_update,graphid,graph_DBPort,username,password)
                            if Multi_relation == "外部关联":
                                # begin_prop_val = "'" + edge_prop_list[0] + "'"
                                # end_prop_val = "'" + edge_prop_list[1] + "'"

                                s_class = begin_class
                                s_pro = begin_prop
                                # s_v = orient_type_transform(row[edge_prop_list[0]], en_pro_dict[begin_class][
                                #     begin_prop])
                                # p = edge_name

                                o_class = end_class
                                o_p = end_prop
                                # o_v = orient_type_transform(row[edge_prop_list[1]], en_pro_dict[end_class][
                                #     end_prop])
                                s_v = ""
                                o_v = ""

                                # 处理修改完属性找不到对应的值
                                for o_i in range(len(all_otl_class)):
                                    dict_otl = all_otl_class[o_i]
                                    otl_keys = dict_otl[0]
                                    otl_key = list(otl_keys.keys())
                                    otl_name = otl_key[0]
                                    if otl_name == begin_class:
                                        for dotl in dict_otl[1:]:
                                            for o_k in dotl:
                                                if begin_prop ==dotl[o_k]:
                                                    s_pro=o_k
                                                    if not (isinstance(row[edge_prop_list[0]], float) and math.isnan(row[edge_prop_list[0]])):
                                                        s_v = orient_type_transform(row[edge_prop_list[0]],
                                                                                en_pro_dict[begin_class][
                                                                                    o_k])
                                                    break
                                for o_i in range(len(all_otl_class)):
                                    dict_otl = all_otl_class[o_i]
                                    otl_keys = dict_otl[0]
                                    otl_key = list(otl_keys.keys())
                                    otl_name = otl_key[0]
                                    if otl_name == end_class:
                                        for dotl in dict_otl[1:]:
                                            for o_k in dotl:
                                                if end_prop == dotl[o_k]:
                                                    o_p = o_k
                                                    if not (isinstance(row[edge_prop_list[1]], float) and math.isnan(row[edge_prop_list[1]])):
                                                        o_v = orient_type_transform(row[edge_prop_list[1]],
                                                                                en_pro_dict[end_class][
                                                                                    o_k])
                                                break
                                if s_v == "":
                                    s_v = orient_type_transform(row[edge_prop_list[0]], en_pro_dict[begin_class][begin_prop])
                                if o_v == "":
                                    o_v = orient_type_transform(row[edge_prop_list[1]], en_pro_dict[end_class][end_prop])

                                create_edg_aql = "CREATE EDGE  `{}` FROM (select from `{}` where `{}`={}) TO (select from `{}` where `{}`={})  set " \
                                    .format(edge_name, begin_class, s_pro, s_v, end_class, o_p, o_v)
                                create_edg_aql += set_con
                                code , r_json = oriendb_http(address, mongo_db, create_edg_aql, graphid, graph_DBPort, username,password)
                                if code == 500:
                                    if "DuplicatedException" in r_json["errors"][0]["content"]:

                                        create_edg_aql_update = "UPDATE EDGE  `{}` SET out= (select from `{}` where `{}`={}) ,in= (select from `{}` where `{}`={})  ,{} UPSERT WHERE out= (select from `{}` where `{}`={}) and in= (select from `{}` where `{}`={})  " \
                                            .format(edge_name, begin_class, s_pro,s_v,end_class, o_p,o_v,set_con,begin_class, s_pro,s_v,end_class, o_p,o_v)
                                        # create_edg_aql += set_con
                                        oriendb_http(address, mongo_db, create_edg_aql_update,graphid,graph_DBPort,username,password)
        finish_create_edge = time.time()
        print(f'创建边总耗时：{finish_create_edge-finish_create_vertex}s')
        return 200, " success"
    except Exception as e:
        print(repr(e))
        return 500, repr(e)

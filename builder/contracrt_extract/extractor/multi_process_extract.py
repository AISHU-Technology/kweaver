# -*- coding: utf-8 -*-
from functools import partial

from contracrt_extract.extractor.extract import get_docx, ExtractElements
import json
# import math
# from memory_profiler import profile
# from concurrent.futures import ThreadPoolExecutor
#
# file = "../data/IT系统及平台项目工程设计框架合同模板.docx"
# ext = ExtractElements(configYaml="../data/configuration.yaml")
# result = ext.get_element(file)
# print("result: ", result)

# def split_list(nums_thread, files):
#     lists = []
#     # 每个线程处理的数据个数
#     nums = math.ceil(len(files) / nums_thread)
#     count = 0
#     for i in range(nums_thread):
#         _list = files[count: count + nums]
#         lists.append(_list)
#         count += nums
#     return lists
#
#
# def work(file, ext):
#     ress = []
#     # ext = ExtractElements(configYaml="../data/configuration.yaml", model_path="../data/model.pkl")
#     res = ext.get_element(file)
#     ress.append(res)
#     return ress
#
#
# def use():
#     ext = ExtractElements(configYaml="../data/configuration.yaml")
#
#     file = "../data/IT系统及平台项目工程设计框架合同模板.docx"
#     files = [file] * 10
#     pool = ThreadPoolExecutor(max_workers=5)
#     # lists = split_list(nums_thread=5, files=files)
#     results = pool.map(work, files, ext)
#     print(type(results))
#     for i, ret in enumerate(results):
#         print(i, ret)
#     print('thread execute end!')


# if __name__ == '__main__':
#     use()

# 多线程
# import time
# from functools import partial
# from multiprocessing.dummy import Pool as ThreadPool
# start = time.time()
# ext = ExtractElements(configYaml="../data/configuration.yaml", model_path="../data/model.pkl")
#
# partial_work = partial(work, ext=ext)
# pool = ThreadPool(8)
# file = "../data/IT系统及平台项目工程设计框架合同模板.docx"
# files = [file] * 100
# res = pool.map(partial_work, files)
# end = time.time()
#
# print(len(res))
# print("Cost: ", end - start)


# 不用多线程
# start = time.time()
# ext = ExtractElements(configYaml="../data/configuration.yaml", model_path="../data/model.pkl")
# ress = []
# for i, file in enumerate(files):
#     print(i)
#     res = ext.get_element(file)
#     ress.append(res)
# print(ress[-1])
# print(len(ress))
# end = time.time()
# print("Cost: ", end - start)


import time
import multiprocessing as mp
import configparser


config = configparser.ConfigParser()
config.read("./../config/config.ini", encoding="utf-8")
sections = config.sections()
# 获取特定section
extract_items = config.items('extract')
extract_items = dict(extract_items)

configYaml = extract_items["configyaml"]
model = extract_items["model"]
stopwords_file = extract_items["stopwords_file"]
schema_file = extract_items["schema_english"]
process_num = int(extract_items["process_num"])


class MultiExtract():
    def __init__(self, configYaml, model_path, stopwords_file, as7_json, version, process_num=16):
        # 直接调用 Manager 提供的 list() 和 dict()
        self.process_num = process_num
        self.manager = mp.Manager
        self.mp_lst = self.manager().list()
        self.ext = ExtractElements(configYaml=configYaml, model_path=model_path, stopwords_file=stopwords_file,
                                   as7_json=as7_json, version=version)

    def proc_func(self, docid):
        res = self.ext.get_element(docid)
        # print("res: ", res)
        # self.mp_lst.append(res)
        if res:
            self.mp_lst.append(res)

    def flow(self, docids):
        pool = mp.Pool(self.process_num)
        for docid in docids:
            pool.apply_async(self.proc_func, args=(docid, ))
        pool.close()
        pool.join()


# 提取的结构化数据转换为SPO
def convert2spo(json_data):
    spo_list = []
    with open(schema_file, 'r', encoding='utf8')as fp:
        schemas = json.load(fp)
    for schema in schemas:
        s = schema.get("subject_type", "")
        p = schema.get("predicate", "")
        o = schema.get("object_type", "")
        # 属性
        if o.lower() in ["text", "date", "number"]:
            if s == "company":
                owner = json_data.get("owner_subject", "")
                others = json_data.get("other_subject", [])
                others.append(owner)
                for com in set(others):
                    spo_list.append((s, p, com))
            elif s == "clause":
                clauses = json_data.get("clause", {})
                for name, content in clauses.items():
                    if p == "name":
                        spo_list.append((s, "name", name))
                    else:
                        spo_list.append((s, "content", content))
            else:
                spo_list.append((s, p, json_data.get(p, "")))
        else:
            contract_name = json_data.get("name", "")
            if o == "clause":
                clauses = json_data.get("clause", {})
                for name, content in clauses.items():
                    spo_list.append((contract_name, p, content))
            elif p == "ownerSubject":
                owner = json_data.get("owner_subject", "")
                spo_list.append((contract_name, p, owner))
            else:
                others = json_data.get("other_subject", [])
                for other in others:
                    spo_list.append((contract_name, p, other))

    return spo_list


# @profile(precision=4,stream=open('memory_profiler.log','w+'))
# 多进程提取合同结构化数据
def multi_extract(docids, configYaml, model, stopwords_file, process_num, as7_json, version):
    start_time = time.time()
    op = MultiExtract(configYaml=configYaml, model_path=model, stopwords_file=stopwords_file, process_num=process_num,
                      as7_json=as7_json, version=version)
    op.flow(docids)
    # print(len(op.mp_lst))
    print(time.time() - start_time)
    return op.mp_lst


# 合同模型提取的数据写入mongodb
def contract_insert2mongodb(db, data, schema_file):
    with open(schema_file, 'r', encoding='utf8')as fp:
        schemas = json.load(fp)
    con = {}
    claus = {}
    for schema in schemas:
        s = schema.get("subject_type", "")
        p = schema.get("predicate", "")
        o = schema.get("object_type", "")
        # 实体-属性
        if o.lower() in ["text", "date", "number"]:
            if s == "company":
                owner = data.get("owner_subject", "")
                others = data.get("other_subject", [])
                others.append(owner)
                for com in set(others):
                    db[s].insert_one({"name": com})
            elif s == "clause":
                clauses = data.get("clause", {})
                for k, v in clauses.items():
                    if p == "name":
                        claus[p] = k
                    else:
                        claus[p] = v
                if len(claus.keys()) == 2:
                    db[s].insert_one(claus)
            else:
                con[p] = data.get(p, "")
                if len(list(con.keys())) == 12:
                    db[s].insert_one(con)
        # 边
        else:
            contract_name = data.get("name", "")
            if p == "contain":
                clauses = data.get("clause", [])
                for name, content in clauses.items():
                    con = {}
                    con["s"] = contract_name
                    con["p"] = p
                    con["o"] = name
                    con["s_pros"] = {"id": data.get("id")}
                    con["p_pros"] = {"name": p}
                    con["o_pros"] = {"name": name, "content": content}
                    db[p].insert_one(con)
            elif p == "ownerSubject":
                owner = data.get("owner_subject", "")
                con = {}
                con["s"] = contract_name
                con["p"] = p
                con["o"] = owner
                con["s_pros"] = {"id": data.get("id")}
                con["p_pros"] = {"name": p}
                con["o_pros"] = {"name": owner }
                db[p].insert_one(con)
            else:
                others = data.get("other_subject", [])
                for other in others:
                    con = {}
                    con["s"] = contract_name
                    con["p"] = p
                    con["o"] = other
                    con["s_pros"] = {"id": data.get("id")}
                    con["p_pros"] = {"name": p}
                    con["o_pros"] = {"name": other}
                    db[p].insert_one(con)
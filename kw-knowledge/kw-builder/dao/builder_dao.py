import json
from ctypes import sizeof

from utils.ConnectUtil import mongoConnect
import pymongo
from pymongo.database import Collection
from utils.util import DateEncoder
from utils.log_info import Logger


class MongoBuildDao(object):
    """
    AD图谱构建任务，结构化数据源，手动模式，创建边的相关mongo操作方法集合
    """
    config = mongoConnect.get_config()
    client = mongoConnect.connect_mongo()

    @classmethod
    def get_collection(cls, collection: str) -> Collection:
        try:
            return cls.client[collection]
        except Exception:
            raise Exception("get collection {} error".format(collection))

    @classmethod
    def hashed_index(cls, c: Collection, prop: str):
        """
        给指定的collection创建哈希索引
        参数：
            collection: pymongo集合实例
            prop: 需要创建索引的属性名称
        """
        c.create_index([(prop, pymongo.HASHED)], background=True)

    @classmethod
    def prop_len(cls, c: Collection, prop: str) -> list:
        """
        统计某个集合的某个属性的长度范围

        参数
            c: mongo集合
            prop: 属性

        逻辑
            1. 没有值，没有此属性，返回None，调用方法需要判断None

        返回
            {长度值: 1}
        """
        pipelines = list()
        pipelines.append({"$match": {
            "$and": [
                {prop: {"$ne": None}},
                {prop: {"$ne": ""}}
            ]
        }})
        pipelines.append({"$project": {
            "length": {"$strLenCP": "$" + prop}
        }})
        pipelines.append({"$group": {
            "_id": None,
            "lens": {"$addToSet": "$length"}
        }})
        res = list(c.aggregate(pipelines))
        if len(res) <= 0:
            return None
        if 'lens' in res[0]:
            return {n: 1 for n in res[0]['lens']}
        return None

    @classmethod
    def relations(cls, c, prop, props):
        """
        查找集合中某个属性包含某个列表值的文档

        参数
            c: mongo集合对象
            prop: Mongodb的属性
            props: 值list
            prop_filter:选择合适的属性返回
        """
        find_dict = {prop: {"$in": props}}
        return list(c.find(find_dict))

    @classmethod
    def gen_sub_str(cls, pld: dict[int, int], s: str) -> list[str]:
        """
        手动计算s的全部子串，pld是长度过字典，如果不包含某个长度，那么就跳过该长度字串的生成

        参数
            pld: 子串长度过滤字典 {长度值: 1}
                demo {1:1,3:1}
            s: 父串，需要计算子串的字符串
        """
        if pld == None:
            pld = dict()
        rs = list()
        # 空值无法计算子串，直接返回
        if s is None:
            return rs
        s = str(s)
        for i in range(len(s)):
            if (i + 1) not in pld:
                continue
            for j in range(len(s) - i):
                rs.append(s[j:j + i + 1])
        return rs

    @classmethod
    def insert_many(cls, c, documents, ordered=False):
        if not documents or not c:
            Logger.log_info("collection empty or documents empty")
            return
        try:
            return c.insert_many(documents=documents, ordered=ordered)
        except BaseException as e:
            if "writeConcernErrors" not in str(e):
                raise e

    @classmethod
    def collection_count(cls, collection_name):
        collection = cls.get_collection(collection_name)
        if not collection:
            return -1
        return int(collection.count_documents({}))

    @classmethod
    def step_size(cls, collection_name, total):
        collection = cls.get_collection(collection_name)
        if not collection:
            return 1000
        one = collection.find_one({})
        one['_id'] = str(one['_id'])
        one_size = len(json.dumps(one, cls=DateEncoder))
        # 粗略估算下每个点的插入nebula的长度
        part_size = one_size + (len(one) + 1) * 7 + 32
        result_size = int(int(total / part_size) / 1000) * 1000
        # 设置最大的值
        return result_size if result_size <= 5000 else 5000

    @classmethod
    def upsert(cls, c, documents, entity_index):
        if not documents or not c:
            Logger.log_info("collection empty or documents empty")
            return
        try:
            for doc in documents:
                index_dict = {}
                for index in entity_index:
                    index_dict[index] = doc[index]
                c.update_one(index_dict, {"$set": doc}, upsert=True)

        except BaseException as e:
            raise e

# -*-coding:utf-8-*-
"""
# Time    : 2022/5/12
# Author  : William.wang
# Email   : William.wang@aishu.cn
"""

from utils.my_pymysql_pool import connect_execute_close_db
from utils.log_info import Logger


class OtherDao():
    """
    本函数用来存储其他表的查询数据，更新时，记得将列表在此处补充。
    查询表列表：search_config，account
    """

    @connect_execute_close_db
    def get_search_config_by_id(self, search_id, connection, cursor):
        """
        根据kg_id查询对应的搜索配置表。
        :param search_id: 搜索配置id，查表即可。
        :return: 对应的搜索id
        """
        sql = """
        SELECT * FROM search_config WHERE kg_id = {}
        """.format(search_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def get_random_uuid(self, connection, cursor):
        """
        :return: uuid 随机字符，前缀拼接u，生成算法一致
        """
        sql = """select CONCAT("u", replace(uuid(),"-","")) as uuid;"""
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res[0]["uuid"]

    @connect_execute_close_db
    def check_search_config_by_name(self, name, connection, cursor):
        """
        :return: True 用户存在，False用户不存在。
        """
        sql = """select id from search_config where conf_name = '{}'""".format(name)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        if len(res) > 0:
            return True
        else:
            return False

    @connect_execute_close_db
    def get_search_config_by_name_and_kg_id(self, name, kg_id, connection, cursor):
        """
        :param kg_id: 图搜索配置id
        :return: dict
        """
        sql = """select * from search_config where conf_name = '{}' and kg_id = {}""".format(name, kg_id)
        Logger.log_info(sql)
        cursor.execute(sql)
        res = cursor.fetchall()
        return res

    @connect_execute_close_db
    def resource(self, data_id, data_type, connection, cursor):
        sql = ""
        if data_type == "kn":
            sql = f""" select creator_id as create_user from knowledge_network where id=%s; """
        elif data_type == "kg":
            sql = f""" select create_user from graph_config_table where id=%s; """
        elif data_type == "lexicon":
            sql = f""" select create_user from lexicon where id=%s; """
        elif data_type == "ds":
            sql = f""" select create_user from data_source_table where id=%s; """
        elif data_type == "function":
            sql = f""" select create_user from `function` where id=%s; """
        elif data_type == "otl":
            sql = f""" select create_user from ontology_table where id=%s; """

        Logger.log_info(sql)
        cursor.execute(sql, data_id)
        return cursor.fetchall()


other_dao = OtherDao()

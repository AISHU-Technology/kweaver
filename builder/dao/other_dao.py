# -*-coding:utf-8-*-
"""
# Time    : 2022/5/12
# Author  : William.wang
# Email   : William.wang@aishu.cn
"""

from utils.my_pymysql_pool import connect_execute_close_db,connect_execute_commit_close_db
import pandas as pd
from utils.log_info import Logger


class OtherDao():
    """
    本函数用来存储其他表的查询数据，更新时，记得将列表在此处补充。
    查询表列表：search_config
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
        df = pd.read_sql(sql, connection)
        return df

    @connect_execute_close_db
    def get_random_uuid(self, connection, cursor):
        """
        根据uuid判断对应uuid的用户是否存在
        :return: uuid 随机字符，前缀拼接u，生成算法一致
        """
        sql = """select CONCAT("u", replace(uuid(),"-","")) as uuid;"""
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        df = df.to_dict(orient="records")
        return df[0]["uuid"]

    @connect_execute_close_db
    def check_search_config_by_name(self, name, connection, cursor):
        """
        根据conf_name查询对应的搜索配置表。
        :param name: conf_name
        :return: True 配置存在，False 配置不存在。
        """
        sql = """select id from search_config where conf_name = '{}'""".format(name)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        df = df.to_dict(orient="records")
        if len(df) > 0:
            return True
        else:
            return False

    @connect_execute_close_db
    def get_search_config_by_name_and_kg_id(self, name, kg_id, connection, cursor):
        """
        根据conf_name和kg_id查询对应的搜索配置表。
        :param name: conf_name
        :param kg_id: 图搜索配置id
        :return: dict
        """
        sql = """select * from search_config where conf_name = '{}' and kg_id = {}""".format(name, kg_id)
        Logger.log_info(sql)
        df = pd.read_sql(sql, connection)
        df = df.to_dict(orient="records")
        return df


other_dao = OtherDao()

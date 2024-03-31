# -*-coding:utf-8-*-
# @Author: Lowe.li
# @Email: Lowe.li@aishu.cn
# @CreatDate: 2020/7/1 9:45
# @File : pymysql_pool.py
# @Software : PyCharm
import threading

import rdsdriver
from dbutilsx.pooled_db import PooledDB, PooledDBInfo
import os


# 单例
class PymysqlPool(object):
    yamlConfig = None
    _instance_lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not hasattr(cls, '_instance'):
            with PymysqlPool._instance_lock:
                if not hasattr(cls, '_instance'):
                    PymysqlPool._instance = super().__new__(cls)
            return PymysqlPool._instance

    @classmethod
    def get_pool(cls):
        DB_MINCACHED = 2
        DB_MAXCACHED = 5
        DB_MAXSHARED = 5
        DB_MAXCONNECTIONS = 3
        DB_BLOCKING = True

        DB_HOST = os.getenv("RDSHOST")
        DB_PORT = eval(os.getenv("RDSPORT"))
        DB_USER_NAME = os.getenv("RDSUSER")
        DB_PASSWORD = str(os.getenv("RDSPASS"))
        DB_SCHEMA = os.getenv("RDSDBNAME")
        CHARSET = 'utf8'

        w = PooledDBInfo(
            creator=rdsdriver,
            mincached=DB_MINCACHED,
            maxcached=DB_MAXCACHED,
            maxshared=DB_MAXSHARED,
            maxconnections=DB_MAXCONNECTIONS,
            blocking=DB_BLOCKING,
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER_NAME,
            password=DB_PASSWORD,
            database=DB_SCHEMA,
            charset=CHARSET,
            cursorclass=rdsdriver.DictCursor
        )
        r = w
        op = PooledDB(
            master=w,
            backup=r,
        )

        return op

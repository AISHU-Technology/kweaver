# -*-coding:utf-8-*-
# @Author: Lowe.li
# @Email: Lowe.li@aishu.cn
# @CreatDate: 2020/7/1 9:45
# @File : pymysql_pool.py
# @Software : PyCharm
import threading

import pymysql
from DBUtils.PooledDB import PooledDB
import yaml
import sys
import os


# sys.path.append(os.path.abspath("../"))
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
    def get_pool(cls, dbname, read_write):
        # if cls.yamlConfig is None:
            # with open(sys.path[0]+'/config/mysql.yaml', 'r') as f:
            # with open('./config/mysql.yaml', 'r') as f:
        #     print('pymysql_pool path: ', os.getcwd())
        #     with open('./../config/mysql.yaml', 'r') as f:
        #         cls.yamlConfig = yaml.load(f)
        # db_config = cls.yamlConfig.get(dbname).get(read_write)
        # DB_MINCACHED = db_config.get('mincached')
        # DB_MAXCACHED = db_config.get('maxcached')
        # DB_MAXSHARED = db_config.get('maxshared')
        # DB_MAXCONNECTIONS = db_config.get('maxconnections')
        # DB_BLOCKING = db_config.get('blocking')
        DB_MINCACHED = 2
        DB_MAXCACHED = 5
        DB_MAXSHARED = 5
        DB_MAXCONNECTIONS = 3
        DB_BLOCKING = True
        # DB_HOST = db_config.get('host')
        # DB_PORT = db_config.get('port')
        # DB_USER_NAME = db_config.get('user')
        # DB_PASSWORD = str(db_config.get('password'))
        # DB_SCHEMA = db_config.get('database')
        DB_HOST = os.getenv("RDSHOST")
        DB_PORT = eval(os.getenv("RDSPORT"))
        DB_USER_NAME = os.getenv("RDSUSER")
        DB_PASSWORD = str(os.getenv("RDSPASS"))
        DB_SCHEMA = os.getenv("RDSDBNAME")
        # CHARSET = db_config.get('charset')
        CHARSET = 'utf8'

        pool = PooledDB(
            creator=pymysql,
            mincached=DB_MINCACHED,
            maxcached=DB_MAXCACHED,
            maxshared=DB_MAXSHARED,
            maxconnections=DB_MAXCONNECTIONS,
            blocking=DB_BLOCKING,
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER_NAME,
            password=DB_PASSWORD,
            db=DB_SCHEMA,
            charset=CHARSET
        )

        return pool

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
from os import path


# sys.path.append(os.path.abspath("../"))
# 单例
from config.config import db_config_path


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
        with open(db_config_path, 'r') as f:
            yaml_config = yaml.load(f)
        mariadb_config = yaml_config['mariadb']
        host = mariadb_config.get('host')
        port = mariadb_config.get('port')
        user_name = mariadb_config.get('user')
        password = mariadb_config.get('password')
        database = mariadb_config.get('database')
        CHARSET = 'utf8'

        pool = PooledDB(
            creator=pymysql,
            mincached=DB_MINCACHED,
            maxcached=DB_MAXCACHED,
            maxshared=DB_MAXSHARED,
            maxconnections=DB_MAXCONNECTIONS,
            blocking=DB_BLOCKING,
            host=host,
            port=port,
            user=user_name,
            password=password,
            db=database,
            charset=CHARSET
        )

        return pool

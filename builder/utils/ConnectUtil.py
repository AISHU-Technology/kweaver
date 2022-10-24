# -*-coding:utf-8-*-
import yaml
from impala.dbapi import connect
import redis
from redis.sentinel import Sentinel
import sys, os
from os import path
from config.config import db_config_path

sys.path.append(os.path.abspath("../"))


class HiveClient:
    def __init__(self, db_host, user, password, database, port=10000):
        """
        create connection to hive server2
        PLAIN LDAP
        """

        # config = {"mapreduce.job.queuename": "XXX"}
        self.conn = connect(host=db_host,
                            port=port,
                            auth_mechanism='LDAP',
                            user=user,
                            password=password,
                            database=database,
                            timeout=10
                            )

    def query(self, sql):
        """
              query
              """
        with self.conn.cursor() as cursor:
            cursor.execute(sql)

            return cursor.fetchall()

    def close(self):
        self.conn.close()

    def read_sql(self, sql):
        """
              query
              """
        with self.conn.cursor() as cursor:
            return cursor.read_sql(sql, self.conn)

            # cursor.fetchall()


class RedisClinet():
    def __init__(self):
        with open(db_config_path, 'r') as f:
            yaml_config = yaml.load(f, Loader=yaml.FullLoader)
        redis_config = yaml_config['redis']
        self.redis_cluster_mode = redis_config['mode']
        self.redis_account = redis_config.get('user', None)
        self.redis_password = redis_config.get('password', None)
        if self.redis_cluster_mode == "sentinel":
            sentinel_config = redis_config['sentinel']
            self.sentinel_list = [(v['host'], v['port']) for v in sentinel_config]
            self.sentinel_account = redis_config['sentinel_user']
            self.sentinel_password = redis_config['sentinel_password']
            self.master_name = redis_config['master_name']
        elif self.redis_cluster_mode == "stand-alone":
            self.redis_host = redis_config.get('host', None)
            self.redis_port = redis_config.get('port', None)

    def get_config(self):
        if self.redis_cluster_mode == "sentinel":
            return self.sentinel_list, None, self.redis_account, self.redis_password, self.master_name, self.sentinel_account, self.sentinel_password, self.redis_cluster_mode
        if self.redis_cluster_mode == "stand-alone":
            return self.redis_host, self.redis_port, self.redis_account, self.redis_password, "", "", "", self.redis_cluster_mode

    def connect_redis(self, db, model):

        if self.redis_cluster_mode == "sentinel":
            sentinel = Sentinel(self.sentinel_list,
                                password=self.sentinel_password,
                                sentinel_kwargs={"password": self.sentinel_password,
                                                 "username": self.sentinel_account})
            if model == "write":
                redis_con = sentinel.master_for(self.master_name,
                                                username=self.redis_account,
                                                password=self.redis_password,
                                                db=db)

            if model == "read":
                redis_con = sentinel.slave_for(self.master_name,
                                               username=self.redis_account,
                                               password=self.redis_password,
                                               db=db)
            return redis_con
        if self.redis_cluster_mode == "stand-alone":
            if model == "read":
                pool = redis.ConnectionPool(host=self.redis_host, port=self.redis_port, db=db,
                                            username=self.redis_account, password=self.redis_password)
                redis_con = redis.StrictRedis(connection_pool=pool)
                return redis_con
            if model == "write":
                pool = redis.ConnectionPool(host=self.redis_host, port=self.redis_port, db=db,
                                            username=self.redis_account, password=self.redis_password)
                redis_con = redis.StrictRedis(connection_pool=pool)
                return redis_con


from pymongo import MongoClient
import urllib.parse


class mongoClient(object):
    def connect_mongo(self):
        with open(db_config_path, 'r') as f:
            yaml_config = yaml.load(f, Loader=yaml.FullLoader)
        mongodb_config = yaml_config['mongodb']
        user = mongodb_config['user']
        password = urllib.parse.quote_plus(mongodb_config['password'])
        host = mongodb_config['host']
        port = mongodb_config['port']
        database = mongodb_config['database']
        if password is not None and user is not None:
            con_str=f'mongodb://{user}:{password}@{host}:{port}/'
            conn = MongoClient(con_str)
        else:
            conn = MongoClient('mongodb://{host}:{port}/')
        dbconn = conn[database]
        return dbconn


redisConnect = RedisClinet()
mongoConnect = mongoClient()

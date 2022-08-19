# -*-coding:utf-8-*-
# @Author: Lowe.li
# @Email: Lowe.li@aishu.cn
# @CreatDate: 2020/7/7 16:01
# @File : hiveUtil.py
# @Software : PyCharm

from utils.log_info import Logger

from impala.dbapi import connect
from pymongo import MongoClient
# sudo yum install gcc-c++ python-devel.x86_64 cyrus-sasl-devel.x86_64 然后pip install sasl pip install thrift_sasl
# yum install cyrus-sasl-plain cyrus-sasl-devel cyrus-sasl-gssapi  cyrus-sasl-md5

# conn = connect(host='10.2.192.33', port=10000, user='es2hdfs',password="Eisoo.com123",database='admin',auth_mechanism='LDAP')
# cursor = conn.cursor()
# cursor.execute('select * from testdate_6_7c_e_s_r_xlsx ')
# for result in cursor.fetchall():
#     print(result)
import os
import redis
from redis.sentinel import Sentinel
import sys , os
sys.path.append(os.path.abspath("../"))
from config import config
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
            return cursor.read_sql(sql,self.conn)

             # cursor.fetchall()


class RedisClinet():
    def __init__(self):
        self.redis_cluster_mode = str(os.getenv("REDISCLUSTERMODE", ""))
        self.redis_ip = os.getenv("REDISHOST", "")
        self.redis_read_ip = os.getenv("REDISREADHOST", "")
        self.redis_read_port = os.getenv("REDISREADPORT", "")
        self.redis_read_user = os.getenv("REDISREADUSER", "")
        self.redis_read_passwd = str(os.getenv("REDISREADPASS", ""))
        self.redis_write_ip = os.getenv("REDISWRITEHOST", "")
        self.redis_write_port = os.getenv("REDISWRITEPORT", "")
        self.redis_write_user = os.getenv("REDISWRITEUSER", "")
        self.redis_write_passwd = str(os.getenv("REDISWRITEPASS", ""))
        print(self.redis_ip)
        self.redis_port = os.getenv("REDISPORT", "")
        self.redis_user = ""
        if str(os.getenv("REDISUSER")):
            self.redis_user = os.getenv("REDISUSER", "")
        self.redis_passwd = str(os.getenv("REDISPASS", ""))
        self.redis_master_name = str(os.getenv("SENTINELMASTER", ""))
        self.redis_sentinel_user = str(os.getenv("SENTINELUSER", ""))
        self.redis_sentinel_password = str(os.getenv("SENTINELPASS", ""))

    # def connect_redis(self,db):
    #     if self.redis_passwd and self.redis_user:
    #         r = redis.StrictRedis(host=self.redis_ip, port=self.redis_port, password=self.redis_passwd,username=self.redis_user, db=db)
    #     else:
    #         r = redis.StrictRedis(host=self.redis_ip, port=self.redis_port, db=db)
    #     return r
    def get_config(self):
        if self.redis_cluster_mode == "master-slave" :
            return self.redis_write_ip, self.redis_write_port,self.redis_write_user,self.redis_write_passwd,self.redis_master_name,self.redis_sentinel_user,self.redis_sentinel_password
        if self.redis_cluster_mode == "sentinel":
            return self.redis_ip, self.redis_port, self.redis_user, self.redis_passwd, self.redis_master_name, self.redis_sentinel_user, self.redis_sentinel_password
    def connect_redis(self, db ,model):

        if self.redis_cluster_mode == "sentinel" :
            sentinel = Sentinel([(self.redis_ip, self.redis_port)],
                                password=self.redis_sentinel_password,
                                sentinel_kwargs={"password": self.redis_sentinel_password,
                                                 "username": self.redis_sentinel_user})
            if model == "write":

                redis_con = sentinel.master_for(self.redis_master_name,
                                                username=self.redis_user,
                                                password=self.redis_passwd,
                                                db=db)

            if model == "read":
                redis_con = sentinel.slave_for(self.redis_master_name,
                                                username=self.redis_user,
                                                password=self.redis_passwd,
                                                db=db)
            return redis_con
        if self.redis_cluster_mode == "master-slave":
            if model == "read":
                pool = redis.ConnectionPool(host=self.redis_read_ip, port=self.redis_read_port, db=db,password=self.redis_read_passwd)
                redis_con = redis.StrictRedis(connection_pool=pool)
                return redis_con
            if model == "write":
                pool = redis.ConnectionPool(host=self.redis_write_ip, port=self.redis_write_port, db=db, password=self.redis_write_passwd)
                redis_con = redis.StrictRedis(connection_pool=pool)
                return redis_con




    # from redis.sentinel import Sentinel
# import os
# sentinel = Sentinel([(os.getenv("REDISHOST"), os.getenv("REDISPORT"))],password=str(os.getenv("SENTINELPASS", "")),sentinel_kwargs={"password": str(os.getenv("SENTINELPASS", "")),"username":  str(os.getenv("SENTINELUSER", ""))})
# redis_con_w = sentinel.master_for(str(os.getenv("SENTINELMASTER", "")),username=os.getenv("REDISUSER"),password=str(os.getenv("REDISPASS", "")),db=1)
# redis_con_w.set("name","anydata")
# redis_con_r = sentinel.slave_for(str(os.getenv("SENTINELMASTER", "")),username=os.getenv("REDISUSER"),password=str(os.getenv("REDISPASS", "")),db=1)
# aa = redis_con_r.keys()


from pymongo import MongoClient
import os
import urllib.parse
class mongoClient:
    def __init__(self):

        self.mongodb_ip = os.getenv("MONGODBHOST")
        #处理ut测试获取不到环境变量
        if not self.mongodb_ip:
            self.mongodb_ip='ut'
        self.mongodb_port = os.getenv("MONGODBPORT")
        self.mongodb_user = ""
        if os.getenv("MONGODBUSER"):
            self.mongodb_user = os.getenv("MONGODBUSER")
        self.mongodb_passwd = ""
        if str(os.getenv("MONGODBPASS")):
            self.mongodb_passwd = str(os.getenv("MONGODBPASS"))
        self.UNIONDEPLOY = str(os.getenv("UNIONDEPLOY", ""))
        if ";" in self.mongodb_ip :
            self.mongodb_ip_port = (",").join(["{}:{}".format(ip, self.mongodb_port) for ip in self.mongodb_ip.split(";")])
        else:
            self.mongodb_ip_port = (",").join(["{}:{}".format(ip, self.mongodb_port) for ip in self.mongodb_ip.split(",")])


    def connect_mongo (self):
        ##0就是独立部署
        if self.UNIONDEPLOY == "0":
            database = "anydata"
        ##1就是联合部署
        elif self.UNIONDEPLOY == "1":
            database = "anyshare"
        if self.mongodb_passwd != "" and self.mongodb_user != "":
            conn = MongoClient('mongodb://' +self.mongodb_user+":"+urllib.parse.quote_plus(self.mongodb_passwd)+"@"+ self.mongodb_ip_port+ '/'+database)
            dbconn = conn["anydata"]
        else :
            conn = MongoClient('mongodb://'+self.mongodb_ip_port +'/')
            dbconn = conn["anydata"]
        return dbconn
    def get_config(self):
        return self.mongodb_ip_port, self.mongodb_user ,self.mongodb_passwd




redisConnect = RedisClinet()
mongoConnect = mongoClient()
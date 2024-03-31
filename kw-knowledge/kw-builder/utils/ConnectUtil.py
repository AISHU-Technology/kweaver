# -*-coding:utf-8-*-
import os
import redis
from impala.dbapi import connect
from pymongo import MongoClient
from redis.sentinel import Sentinel
from utils.log_info import Logger


class HiveClient:
    def __init__(self, db_host, user, password, database, port=10000, timeout=10):
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
                            timeout=timeout
                            )

    def query(self, sql):
        """
              query
              """
        with self.conn.cursor() as cursor:
            cursor.execute(sql)

            return cursor.fetchall()

    def query_many(self, sql, size):
        """ query many """
        with self.conn.cursor() as cursor:
            cursor.execute(sql)
            desc = cursor.description
            return desc, cursor.fetchmany(size)

    def close(self):
        self.conn.close()

    def read_sql(self, sql):
        """
              query
              """
        with self.conn.cursor() as cursor:
            return cursor.read_sql(sql, self.conn)

            # cursor.fetchall()

    def isPartitionTable(self, table_name):
        sql = f"show create table `{table_name}`"
        with self.conn.cursor() as cursor:
            cursor.execute(sql)
            res = cursor.fetchall()
            for line in res:
                if "partitioned" in line[0].lower():
                    return True
        return False

    def getPartitions(self, table_name):
        """
            获取hive表的所有分区字段
            return:
                list["分区1", "分区2"]
        """
        sql = f"show partitions `{table_name}`"
        with self.conn.cursor() as cursor:
            cursor.execute(sql)

            res = cursor.fetchall()[0][0]
            res = res.split("/")
            partitions = []
            for val in res:
                partition = val.split("=")[0]
                partitions.append(partition)
            return partitions


class RedisClinet(object):
    def __init__(self):
        self.redis_cluster_mode = str(os.getenv("REDISCLUSTERMODE", "master-slave"))
        self.redis_ip = os.getenv("REDISHOST", "")
        self.redis_read_ip = os.getenv("REDISREADHOST", "")
        self.redis_read_port = os.getenv("REDISREADPORT", "")
        self.redis_read_user = os.getenv("REDISREADUSER", "")
        self.redis_read_passwd = str(os.getenv("REDISREADPASS", ""))
        self.redis_write_ip = os.getenv("REDISWRITEHOST", "")
        self.redis_write_port = os.getenv("REDISWRITEPORT", "")
        self.redis_write_user = os.getenv("REDISWRITEUSER", "")
        self.redis_write_passwd = str(os.getenv("REDISWRITEPASS", ""))
        Logger.log_info(self.redis_ip)
        self.redis_port = os.getenv("REDISPORT", "")
        self.redis_user = ""
        if str(os.getenv("REDISUSER")):
            self.redis_user = os.getenv("REDISUSER", "")
        self.redis_passwd = str(os.getenv("REDISPASS", ""))
        self.redis_master_name = str(os.getenv("SENTINELMASTER", ""))
        self.redis_sentinel_user = str(os.getenv("SENTINELUSER", ""))
        self.redis_sentinel_password = str(os.getenv("SENTINELPASS", ""))

    def get_config(self):
        if self.redis_cluster_mode == "master-slave":
            return self.redis_write_ip, self.redis_write_port, self.redis_write_user, self.redis_write_passwd, self.redis_master_name, self.redis_sentinel_user, self.redis_sentinel_password
        if self.redis_cluster_mode == "sentinel":
            return self.redis_ip, self.redis_port, self.redis_user, self.redis_passwd, self.redis_master_name, self.redis_sentinel_user, self.redis_sentinel_password

    def connect_redis(self, db, model):

        if self.redis_cluster_mode == "sentinel":
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
                pool = redis.ConnectionPool(host=self.redis_read_ip, port=self.redis_read_port, db=db,
                                            password=self.redis_read_passwd)
                redis_con = redis.StrictRedis(connection_pool=pool)
            if model == "write":
                pool = redis.ConnectionPool(host=self.redis_write_ip, port=self.redis_write_port, db=db,
                                            password=self.redis_write_passwd)
                redis_con = redis.StrictRedis(connection_pool=pool)
            return redis_con

    # from redis.sentinel import Sentinel


# import os
# sentinel = Sentinel([(os.getenv("REDISHOST"), os.getenv("REDISPORT"))],password=str(os.getenv("SENTINELPASS", "")),sentinel_kwargs={"password": str(os.getenv("SENTINELPASS", "")),"username":  str(os.getenv("SENTINELUSER", ""))})
# redis_con_w = sentinel.master_for(str(os.getenv("SENTINELMASTER", "")),username=os.getenv("REDISUSER"),password=str(os.getenv("REDISPASS", "")),db=1)
# redis_con_w.set("name","kweaver")
# redis_con_r = sentinel.slave_for(str(os.getenv("SENTINELMASTER", "")),username=os.getenv("REDISUSER"),password=str(os.getenv("REDISPASS", "")),db=1)
# aa = redis_con_r.keys()


class mongoClient(object):
    def __init__(self):
        self.mongodb_ip = os.getenv("MONGODBHOST") if os.getenv("MONGODBHOST") else "127.0.0.1"
        self.mongodb_port = os.getenv("MONGODBPORT") if os.getenv("MONGODBPORT") else "27017"
        self.mongodb_user = os.getenv("MONGODBUSER") if os.getenv("MONGODBUSER") else "kweaver"
        self.mongodb_passwd = os.getenv("MONGODBPASS") if os.getenv("MONGODBPASS") else "kwever123!QWE"
        if ";" in self.mongodb_ip:
            self.mongodb_ip_port = (",").join(
                ["{}:{}".format(ip, self.mongodb_port) for ip in self.mongodb_ip.split(";")])
        else:
            self.mongodb_ip_port = (",").join(
                ["{}:{}".format(ip, self.mongodb_port) for ip in self.mongodb_ip.split(",")])
        self.authSource = os.getenv("MONGODBAUTHSOURCE")

    def connect_mongo(self):
        database = os.getenv("MONGODBNAME") if os.getenv("MONGODBNAME") else "kweaver"
        if self.mongodb_passwd != "" and self.mongodb_user != "":
            conn = MongoClient(
                f'{self.mongodb_ip_port}',
                connect=False,
                username=f'{self.mongodb_user}',
                password=f'{self.mongodb_passwd}',
                authSource=f'{self.authSource}',
                serverSelectionTimeoutMS=15000
            )
            dbconn = conn[database]
        else:
            conn = MongoClient('mongodb://' + self.mongodb_ip_port + '/', connect=False, serverSelectionTimeoutMS=15000)
            dbconn = conn[database]
        return dbconn

    def get_config(self):
        return self.mongodb_ip_port, self.mongodb_user, self.mongodb_passwd


redisConnect = RedisClinet()
mongoConnect = mongoClient()
three_redis_read = redisConnect.connect_redis(3, model="read")

import pymysql
from DBUtils.PooledDB import PooledDB
from db_conn.common.db.mysql.mySqlConfig import DbMysqlConfig
from db_conn.config.mysql_conf import host, port, user, password, database, mysql_log_open,pooled_db_config


# 基于DBUtils.PooledDB 数据库连接池的初始化
class DBMySqlPoolConn:

    __pool = None

    def __init__(self, config, creator=pymysql,  **kwargs):

        if not self.__pool:
            self.__class__.__pool = PooledDB(creator=creator,
                                             charset=config.charset,
                                             host=config.host,
                                             port=config.port,
                                             database=config.database,
                                             user=config.user,
                                             password=config.password,
                                             maxconnections=config.max_connections,
                                             mincached=config.min_cached,
                                             maxcached=config.max_cached,
                                             maxshared=config.max_shared,
                                             blocking=config.blocking,
                                             maxusage=config.max_usage,
                                             setsession=config.set_session,
                                             **kwargs
                                             )
            self.__pool = self.__class__.__pool

    def get_pool(self):
        return self.__pool

    def get_conn(self):
        return self.__pool.connection()


db_config = DbMysqlConfig(host, user, password, database, port, **pooled_db_config)
pooled_db_connection = DBMySqlPoolConn(db_config)

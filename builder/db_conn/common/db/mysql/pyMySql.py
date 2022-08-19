
import time
import pymysql
from common.db.mysql.mysqlPoolConn import DBMySqlPoolConn
from timeit import default_timer
from common.log.logger import logger
from common.db.mysql.mySqlConfig import DbMysqlConfig


# 建立MySQL的连接
class DBMySqlLib(object):

    MAX_RETRY_NUMS = 3  # 最大的重试次数

    def __init__(self, host=None, user="", password="", database=None,
                 port=3306, mysql_pool=True,  **kwargs):
        """
        Args:
            _host: 数据库ip地址
            _database:数据库名称
            _user: 用户名
            _password: 用户密码
            _mysql_pool: 是否使用连接池 （默认是 True）
            _commit: 是否在最后提交事务(设置为False的时候方便单元测试)
            _log_open: 是否打印程序运行日志
        """
        self._host = host
        self._port = port
        self._user = user
        self._password = password
        self._database = database
        self._mysql_pool = mysql_pool
        self._log_open = bool(kwargs.get('log_open', False))
        self._commit = bool(kwargs.get('auto_commit', True))

        db_config = DbMysqlConfig(self._host,  self._user, self._password, self._database, self._port, **kwargs)

        self.db_config = db_config
        self._pymysql_params = db_config.pymysql_params

    def __enter__(self):
        # 如果开启了日志
        if self._log_open is True:
            self._start = default_timer()
        conn = self.__connect(self.db_config)
        conn.autocommit = False
        self._conn = conn
        return self

    def __exit__(self, *exc_info):
        # 提交事务
        if self._commit:
            self._conn.commit()
        # 在退出的时候自动关闭连接和cursor
        self._cursor.close()
        self._conn.close()
        if self._log_open is True:
            diff = default_timer() - self._start
            logger.info('-- %s: %.6f 秒' % ("SQL执行时间：", diff))

    '''数据库的连接方法'''
    def __connect(self, db_config, retry_nums=0, retry_interval=1):
        """
        db_config: object
                DbMysqlConfig 返回的连接对象
        retry_nums: int
                连接重试的次数
        retry_interval: int
                重试的时间间隔
        """
        try:
            if self._mysql_pool is True:
                mysql_pool_connect = DBMySqlPoolConn(db_config, pymysql, **self._pymysql_params)
                conn = mysql_pool_connect.get_conn()
            else:
                conn = pymysql.Connection(host=db_config.host,
                                          user=db_config.user,
                                          password=db_config.password,
                                          database=db_config.database,
                                          port=db_config.port, **self._pymysql_params)
            cursor = conn.cursor(pymysql.cursors.DictCursor)
            self._cursor = cursor
            return conn
        except pymysql.err.OperationalError as e:
            if retry_nums < self.MAX_RETRY_NUMS:
                retry_nums += 1
                time.sleep(retry_interval * retry_nums)
                return self.__connect(db_config, retry_nums, retry_interval)
            else:
                raise GetConnectionError("can't get connection from ({}),retry_nums={}, retry_interval={}(s)".format(
                '数据库连接', retry_nums, retry_interval*retry_nums))
        # except Exception as e:
        #     raise e

    @property
    def cursor(self):
        return self._cursor

    @property
    def connection(self):
        return self._conn

    def begin(self):
        """开启事务"""
        self._conn.begin()

    def commit(self):
        """提交事务"""
        self._conn.commit()

    def rollback(self):
        """回滚事务"""
        self._conn.rollback()

    '''返回 count'''
    def get_count(self, sql, params=None, count_key='count(id)'):
        self.cursor.execute(sql, params)
        data = self.cursor.fetchone()
        if not data:
            return 0
        return data[count_key]

    '''获取单条数据的值'''
    def fetch_one(self, sql, params=None):
        self.cursor.execute(sql, params)
        return self.cursor.fetchone()

    def fetch_all(self, sql, params=None):
        self.cursor.execute(sql, params)
        return self.cursor.fetchall()


class GetConnectionError(Exception):
    """Exception related can't get connection  within timeout seconds."""

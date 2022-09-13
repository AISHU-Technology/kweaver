
import functools
from common.db.mysql.pyMySql import DBMySqlLib
from config.mysql_conf import host, port, user, password, database, mysql_log_open,pooled_db_config
from common.log.logger import logger


# PyMySQL的数据库入口方法
def using_mysql(creator='pymysql', **kw):
    def using_py_mysql(func):

        kw['log_open'] = mysql_log_open
        mysql_pool = False  # 未使用数据库连接池

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                with DBMySqlLib(host, user, password, database, port, mysql_pool, **kw) as db:
                    kwargs['db'] = db
                    result = func(*args, **kwargs)
                    return result
            except Exception as e:
                logger.error("PyMySQL Exception error info:", e)
                raise e
            finally:
                pass
            return None

        return wrapper
    return using_py_mysql


# PyMySQL POOL的数据库入口方法
def using_mysql_pool(creator='pymysqlPool', **kw):

    def using_pooled_db(func):

        kw['log_open'] = mysql_log_open
        if pooled_db_config.get('maxconnections') is not None:
            kw['maxconnections'] = pooled_db_config.get('maxconnections')
        if pooled_db_config.get('mincached') is not None:
            kw['mincached'] = pooled_db_config.get('mincached')
        if pooled_db_config.get('maxcached') is not None:
            kw['maxcached'] = pooled_db_config.get('maxcached')
        if pooled_db_config.get('maxshared') is not None:
            kw['maxshared'] = pooled_db_config.get('maxshared')
        if pooled_db_config.get('blocking') is not None:
            kw['blocking'] = pooled_db_config.get('blocking')

        mysql_pool = True  # 使用数据库连接池

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                with DBMySqlLib(host, user, password, database, port, mysql_pool, **kw) as db:
                    kwargs['db'] = db
                    result = func(*args, **kwargs)
                    return result
            except Exception as e:
                logger.error("PyMySQL POOL Exception error info:{}", e)
                raise e
            finally:
                pass
            return None

        return wrapper
    return using_pooled_db


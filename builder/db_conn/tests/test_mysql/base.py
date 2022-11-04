import gc
import json
import os
import re
import warnings
import unittest

import pymysql
import functools

from db_conn.common.db.usingMysql import using_mysql
from db_conn.config.mysql_conf import mysql_log_open
from db_conn.common.db.mysql.pyMySql import DBMySqlLib


class PyMySQLTestCase(unittest.TestCase):
    # You can specify your test environment creating a file named
    #  "databases.json" or editing the `databases` variable below.
    fname = os.path.join(os.path.dirname(__file__), "databases.json")
    if os.path.exists(fname):
        with open(fname) as f:
            databases = json.load(f)
    else:
        databases = [
            {
                "host": "10.4.106.255",
                "user": "anydata",
                "passwd": "Qwe123!@#",
                "database": "anydata",
                "port": 3320,
                "use_unicode": True,
                "local_infile": True,
            },
            {"host": "localhost", "user": "root", "passwd": "", "database": "test2"},
        ]

    def mysql_server_is(self, conn, version_tuple):
        """Return True if the given connection is on the version given or
        greater.

        This only checks the server version string provided when the
        connection is established, therefore any check for a version tuple
        greater than (5, 5, 5) will always fail on MariaDB, as it always
        starts with 5.5.5, e.g. 5.5.5-10.7.1-MariaDB-1:10.7.1+maria~focal.

        e.g.::

            if self.mysql_server_is(conn, (5, 6, 4)):
                # do something for MySQL 5.6.4 and above
        """
        server_version = conn.get_server_info()
        server_version_tuple = tuple(
            (int(dig) if dig is not None else 0)
            for dig in re.match(r"(\d+)\.(\d+)\.(\d+)", server_version).group(1, 2, 3)
        )
        return server_version_tuple >= version_tuple

    _connections = None

    @property
    def connections_params(self):
        return self.databases[0].copy()

    @property
    def connections(self):
        if self._connections is None:
            self._connections = []
            for params in self.databases:
                self._connections.append(pymysql.connect(**params))
            self.addCleanup(self._teardown_connections)
        return self._connections

    def connect(self, **params):
        p = self.databases[0].copy()
        p.update(params)
        conn = pymysql.connect(**p)

        @self.addCleanup
        def teardown():
            if conn.open:
                conn.close()

        return conn

    def _teardown_connections(self):
        if self._connections:
            for connection in self._connections:
                if connection.open:
                    connection.close()
            self._connections = None

    def safe_create_table(self, connection, tablename, ddl, cleanup=False):
        """create a table.

        Ensures any existing version of that table is first dropped.

        Also adds a cleanup rule to drop the table after the test
        completes.
        """
        cursor = connection.cursor()

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            cursor.execute("drop table if exists `%s`" % (tablename,))
        cursor.execute(ddl)
        cursor.close()
        if cleanup:
            self.addCleanup(self.drop_table, connection, tablename)


    def drop_table(self, connection, tablename):
        cursor = connection.cursor()
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            cursor.execute("drop table if exists `%s`" % (tablename,))
        cursor.close()


# PyMySQL的数据库入口方法
def using_mysql(creator='pymysql', **kw):
    def using_py_mysql(func):
        connection = PyMySQLTestCase().connections_params

        kw['log_open'] = False

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with DBMySqlLib(connection['host'], connection['user'], connection['passwd'],
                            connection['database'], connection['port'], False, **kw) as db:
                kwargs['db'] = db
                result = func(*args, **kwargs)
                return result
            return None

        return wrapper
    return using_py_mysql


# PyMySQL POOL的数据库入口方法
def using_mysql_pool(creator='pymysqlPool', **kw):
    def using_pooled_db(func):
        connection = PyMySQLTestCase().connections_params

        kw['log_open'] = True
        kw['maxconnections'] = 20

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with DBMySqlLib(connection['host'], connection['user'], connection['passwd'], connection['database'],
                            connection['port'], True, **kw) as db:
                kwargs['db'] = db
                result = func(*args, **kwargs)
                return result
            return None
        return wrapper
    return using_pooled_db

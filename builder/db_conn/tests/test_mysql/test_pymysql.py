import time

from .base import (PyMySQLTestCase, using_mysql, using_mysql_pool)
import pymysql


class TestConnection(PyMySQLTestCase):

    def test_connection_gone_away(self):
        """
        http://dev.mysql.com/doc/refman/5.0/en/gone-away.html
        http://dev.mysql.com/doc/refman/5.0/en/error-messages-client.html#error_cr_server_gone_error
        """
        con = self.connect()
        cur = con.cursor()
        cur.execute("SET wait_timeout=1")
        time.sleep(2)
        with self.assertRaises(pymysql.OperationalError) as cm:
            cur.execute("SELECT 1+1")
        # error occures while reading, not writing because of socket buffer.
        # self.assertEqual(cm.exception.args[0], 2006)
        self.assertIn(cm.exception.args[0], (2006, 2013))

    @using_mysql()
    def test_get_one_version_info(self, db):
        sql = 'SELECT * FROM version  WHERE  id = 1'
        db.cursor.execute(sql)
        # time.sleep(10)
        res = db.cursor.fetchone()
        self.assertEqual(res, dict({'id': 1, 'manager_version': None, 'builder_version': 'builder-1.1.5', 'engine_version': None}))

    @using_mysql_pool()
    def test_pool_get_one_version_info(self, db):
        sql = 'SELECT * FROM version  WHERE  id = 1'
        db.cursor.execute(sql)
        res = db.cursor.fetchone()
        self.assertEqual(res, dict({'id': 1, 'manager_version': None, 'builder_version': 'builder-1.1.5', 'engine_version': None}))


    @using_mysql()
    def test_get_one_version_info_none(self, db):
        sql = 'SELECT * FROM version  WHERE  id = 10'
        db.cursor.execute(sql)
        res = db.cursor.fetchone()
        self.assertEqual(None, res)






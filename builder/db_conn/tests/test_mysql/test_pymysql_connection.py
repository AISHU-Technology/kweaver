import datetime
import ssl
import sys
import pytest
import time
from unittest import mock

import pymysql
from tests.test_mysql import base
from pymysql.constants import CLIENT
from .base import (using_mysql, using_mysql_pool)

class TestConnection(base.PyMySQLTestCase):
    def test_utf8mb4(self):
        """This test requires MySQL >= 5.5"""
        arg = self.databases[0].copy()
        arg["charset"] = "utf8mb4"
        conn = pymysql.connect(**arg)

    #@using_mysql()
    @using_mysql_pool
    def test_largedata(self, db):
        """Large query and response (>=16MB)"""
        cur = db.connection.cursor()
        cur.execute("SELECT @@max_allowed_packet")
        if cur.fetchone()[0] < 16 * 1024 * 1024 + 10:
            print("Set max_allowed_packet to bigger than 17MB")
            return
        t = "a" * (16 * 1024 * 1024)
        cur.execute("SELECT '" + t + "'")
        assert cur.fetchone()[0] == t

    @using_mysql()
    # @using_mysql_pool
    def test_autocommit(self, db):
        con = db.connection
        self.assertFalse(con.get_autocommit())

        cur = con.cursor()
        cur.execute("SET AUTOCOMMIT=1")
        self.assertTrue(con.get_autocommit())

        con.autocommit(False)
        self.assertFalse(con.get_autocommit())
        cur.execute("SELECT @@AUTOCOMMIT")
        self.assertEqual(cur.fetchone()[0], 0)

    @using_mysql()
    @using_mysql_pool()
    def test_select_db(self, db):
        con = db.connection
        current_db = self.databases[0]["database"]
        other_db = self.databases[1]["database"]

        cur = con.cursor()
        cur.execute("SELECT database()")
        self.assertEqual(cur.fetchone()[0], current_db)

        con.select_db(other_db)
        cur.execute("SELECT database()")
        self.assertEqual(cur.fetchone()[0], other_db)

    # @using_mysql
    @using_mysql_pool()
    def test_connection_gone_away(self, db):
        """
        http://dev.mysql.com/doc/refman/5.0/en/gone-away.html
        http://dev.mysql.com/doc/refman/5.0/en/error-messages-client.html#error_cr_server_gone_error
        """
        con = db.connection
        cur = con.cursor()
        cur.execute("SET wait_timeout=1")
        time.sleep(2)
        with self.assertRaises(pymysql.OperationalError) as cm:
            cur.execute("SELECT 1+1")
        # error occures while reading, not writing because of socket buffer.
        # self.assertEqual(cm.exception.args[0], 2006)
        self.assertIn(cm.exception.args[0], (2006, 2013))

    @using_mysql(init_command='SELECT "bar"; SELECT "baz"',
            client_flag=CLIENT.MULTI_STATEMENTS)
    def test_init_command(self, db):
        conn = db.connection
        c = conn.cursor()
        c.execute('select "foobar";')
        self.assertEqual(("foobar",), c.fetchone())
        conn.close()
        with self.assertRaises(pymysql.err.Error):
            conn.ping(reconnect=False)

    @using_mysql(read_default_group="client",)
    def test_read_default_group(self, db):
        conn = db.connection
        self.assertTrue(conn.open)

    @using_mysql()
    # @using_mysql_pool
    def test_set_charset(self, db):
        c = db.connection
        c.set_charset("utf8mb4")
        # TODO validate setting here



# A custom type and function to escape it
class Foo:
    value = "bar"


def escape_foo(x, d):
    return x.value


class TestEscape(base.PyMySQLTestCase):

    @using_mysql()
    # @using_mysql_pool()
    def test_escape_string(self, db):
        con = db.connection
        cur = con.cursor()

        self.assertEqual(con.escape("foo'bar"), "'foo\\'bar'")
        # added NO_AUTO_CREATE_USER as not including it in 5.7 generates warnings
        # mysql-8.0 removes the option however
        if self.mysql_server_is(con, (8, 0, 0)):
            cur.execute("SET sql_mode='NO_BACKSLASH_ESCAPES'")
        else:
            cur.execute("SET sql_mode='NO_BACKSLASH_ESCAPES,NO_AUTO_CREATE_USER'")
        self.assertEqual(con.escape("foo'bar"), "'foo''bar'")

    # @using_mysql()
    @using_mysql_pool()
    def test_escape_builtin_encoders(self, db):
        con = db.connection
        cur = con.cursor()

        val = datetime.datetime(2012, 3, 4, 5, 6)
        self.assertEqual(con.escape(val, con.encoders), "'2012-03-04 05:06:00'")

    # @using_mysql()
    @using_mysql_pool()
    def test_escape_custom_object(self, db):
        con = db.connection
        cur = con.cursor()

        mapping = {Foo: escape_foo}
        self.assertEqual(con.escape(Foo(), mapping), "bar")

    # @using_mysql()
    @using_mysql_pool()
    def test_escape_fallback_encoder(self, db):
        con = db.connection
        cur = con.cursor()

        class Custom(str):
            pass

        mapping = {str: pymysql.converters.escape_string}
        self.assertEqual(con.escape(Custom("foobar"), mapping), "'foobar'")

    #@using_mysql()
    @using_mysql_pool()
    def test_escape_no_default(self, db):
        con = db.connection
        cur = con.cursor()

        self.assertRaises(TypeError, con.escape, 42, {})

    # @using_mysql
    @using_mysql_pool()
    def test_escape_dict_value(self, db):
        con = db.connection
        cur = con.cursor()

        mapping = con.encoders.copy()
        mapping[Foo] = escape_foo
        self.assertEqual(con.escape({"foo": Foo()}, mapping), {"foo": "bar"})

    # @using_mysql
    @using_mysql_pool()
    def test_escape_list_item(self, db):
        con = db.connection
        cur = con.cursor()

        mapping = con.encoders.copy()
        mapping[Foo] = escape_foo
        self.assertEqual(con.escape([Foo()], mapping), "(bar)")

    # @using_mysql(init_command='SELECT "bar"; SELECT "baz"',
    #         client_flag=CLIENT.MULTI_STATEMENTS)
    @using_mysql_pool(init_command='SELECT "bar"; SELECT "baz"',
            client_flag=CLIENT.MULTI_STATEMENTS)
    def test_previous_cursor_not_closed(self, db):
        con = db.connection
        cur1 = con.cursor()
        cur1.execute("SELECT 1; SELECT 2")
        cur2 = con.cursor()
        cur2.execute("SELECT 3")
        self.assertEqual(cur2.fetchone()[0], 3)


    @using_mysql(client_flag=CLIENT.MULTI_STATEMENTS)
    #@using_mysql_pool(client_flag=CLIENT.MULTI_STATEMENTS)
    def test_commit_during_multi_result(self, db):
        con = db.connection
        cur = con.cursor()
        cur.execute("SELECT 1; SELECT 2")
        con.commit()
        cur.execute("SELECT 3")
        self.assertEqual(cur.fetchone()[0], 3)



"""Test the PooledDB module.

Note:
We don't test performance here, so the test does not predicate
whether PooledDB actually will help in improving performance or not.
We also assume that the underlying SteadyDB connections are tested.

Copyright and credit info:

* This test was contributed by Christoph Zwerschke
"""

import unittest

from . import mock_db as db_base
from common.db.mysql.mysqlPoolConn import DBMySqlPoolConn
from common.db.mysql.pyMySql import DbMysqlConfig

from DBUtils.PooledDB import (
    PooledDB, SharedDBConnection, InvalidConnection, TooManyConnections)



class TestPooledDB(unittest.TestCase):

    def test_version(self):
        from DBUtils import __version__
        self.assertEqual(PooledDB.version, __version__)

    def test_no_threadsafety(self):
        from DBUtils.PooledDB import NotSupportedError
        for threadsafety in (None, 0):
            db_base.threadsafety = threadsafety
            self.assertRaises(NotSupportedError, PooledDB, db_base)

    def test_config(self):
        kwargs = {'mincached': 0, 'maxcached': 0, 'maxshared': 1}
        config = DbMysqlConfig(**kwargs)

        self.assertEqual(config.min_cached, 0)
        self.assertEqual(config.max_cached, 0)
        self.assertEqual(config.max_shared, 1)
        self.assertEqual(config.max_connections, 30)
        self.assertTrue(hasattr(config, 'max_connections'))


    def test_threadsafety(self):

        kwargs = {'mincached': 0, 'maxcached': 0, 'maxshared': 1}
        config = DbMysqlConfig(**kwargs)
        for threadsafety in (1, 2, 3):
            db_base.threadsafety = threadsafety
            pool = PooledDB(db_base, 0, 0, 1)

            self.assertTrue(hasattr(pool, '_maxshared'))
            if threadsafety > 1:
                self.assertEqual(pool._maxshared, 1)
                self.assertTrue(hasattr(pool, '_shared_cache'))
            else:
                self.assertEqual(pool._maxshared, 0)
                self.assertFalse(hasattr(pool, '_shared_cache'))

    def test_create_connection(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            shareable = threadsafety > 1
            pool = PooledDB(
                db_base, 1, 1, 1, 0, False, None, None, True, None, None,
                'PooledDBTestDB', user='PooledDBTestUser')
            self.assertTrue(hasattr(pool, '_idle_cache'))
            self.assertEqual(len(pool._idle_cache), 1)
            if shareable:
                self.assertTrue(hasattr(pool, '_shared_cache'))
                self.assertEqual(len(pool._shared_cache), 0)
            else:
                self.assertFalse(hasattr(pool, '_shared_cache'))
            self.assertTrue(hasattr(pool, '_maxusage'))
            self.assertIsNone(pool._maxusage)
            self.assertTrue(hasattr(pool, '_setsession'))
            self.assertIsNone(pool._setsession)
            con = pool._idle_cache[0]
            from dbutils.steady_db import SteadyDBConnection
            self.assertTrue(isinstance(con, SteadyDBConnection))
            self.assertTrue(hasattr(con, '_maxusage'))
            self.assertEqual(con._maxusage, 0)
            self.assertTrue(hasattr(con, '_setsession_sql'))
            self.assertIsNone(con._setsession_sql)
            db = pool.connection()
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 1)
            self.assertTrue(hasattr(db, '_con'))
            self.assertEqual(db._con, con)
            self.assertTrue(hasattr(db, 'cursor'))
            self.assertTrue(hasattr(db, '_usage'))
            self.assertEqual(db._usage, 0)
            self.assertTrue(hasattr(con, '_con'))
            db_con = con._con
            self.assertTrue(hasattr(db_con, 'database'))
            self.assertEqual(db_con.database, 'PooledDBTestDB')
            self.assertTrue(hasattr(db_con, 'user'))
            self.assertEqual(db_con.user, 'PooledDBTestUser')
            self.assertTrue(hasattr(db_con, 'open_cursors'))
            self.assertEqual(db_con.open_cursors, 0)
            self.assertTrue(hasattr(db_con, 'num_uses'))
            self.assertEqual(db_con.num_uses, 0)
            self.assertTrue(hasattr(db_con, 'num_queries'))
            self.assertEqual(db_con.num_queries, 0)
            cursor = db.cursor()
            self.assertEqual(db_con.open_cursors, 1)
            cursor.execute('select test')
            r = cursor.fetchone()
            cursor.close()
            self.assertEqual(db_con.open_cursors, 0)
            self.assertEqual(r, 'test')
            self.assertEqual(db_con.num_queries, 1)
            self.assertEqual(db._usage, 1)
            cursor = db.cursor()
            self.assertEqual(db_con.open_cursors, 1)
            cursor.execute('set sessiontest')
            cursor2 = db.cursor()
            self.assertEqual(db_con.open_cursors, 2)
            cursor2.close()
            self.assertEqual(db_con.open_cursors, 1)
            cursor.close()
            self.assertEqual(db_con.open_cursors, 0)
            self.assertEqual(db_con.num_queries, 1)
            self.assertEqual(db._usage, 2)
            self.assertEqual(
                db_con.session, ['rollback', 'sessiontest'])
            pool = PooledDB(db_base, 1, 1, 1)
            self.assertEqual(len(pool._idle_cache), 1)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            db = pool.connection()
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 1)
            db.close()
            self.assertEqual(len(pool._idle_cache), 1)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            db = pool.connection(True)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 1)
            db.close()
            self.assertEqual(len(pool._idle_cache), 1)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            db = pool.connection(False)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            self.assertEqual(db._usage, 0)
            db_con = db._con._con
            self.assertIsNone(db_con.database)
            self.assertIsNone(db_con.user)
            db.close()
            self.assertEqual(len(pool._idle_cache), 1)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            db = pool.dedicated_connection()
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            self.assertEqual(db._usage, 0)
            db_con = db._con._con
            self.assertIsNone(db_con.database)
            self.assertIsNone(db_con.user)
            db.close()
            self.assertEqual(len(pool._idle_cache), 1)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            pool = PooledDB(db_base, 0, 0, 0, 0, False, 3, ('set datestyle',))
            self.assertEqual(pool._maxusage, 3)
            self.assertEqual(pool._setsession, ('set datestyle',))
            con = pool.connection()._con
            self.assertEqual(con._maxusage, 3)
            self.assertEqual(con._setsession_sql, ('set datestyle',))

    def test_close_connection(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            shareable = threadsafety > 1
            pool = PooledDB(
                db_base, 0, 1, 1, 0, False, None, None, True, None, None,
                'PooledDBTestDB', user='PooledDBTestUser')
            self.assertTrue(hasattr(pool, '_idle_cache'))
            self.assertEqual(len(pool._idle_cache), 0)
            db = pool.connection()
            self.assertTrue(hasattr(db, '_con'))
            con = db._con
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 1)
                self.assertTrue(hasattr(db, '_shared_con'))
                shared_con = db._shared_con
                self.assertEqual(pool._shared_cache[0], shared_con)
                self.assertTrue(hasattr(shared_con, 'shared'))
                self.assertEqual(shared_con.shared, 1)
                self.assertTrue(hasattr(shared_con, 'con'))
                self.assertEqual(shared_con.con, con)
            from dbutils.steady_db import SteadyDBConnection
            self.assertTrue(isinstance(con, SteadyDBConnection))
            self.assertTrue(hasattr(con, '_con'))
            db_con = con._con
            self.assertTrue(hasattr(db_con, 'num_queries'))
            self.assertEqual(db._usage, 0)
            self.assertEqual(db_con.num_queries, 0)
            db.cursor().execute('select test')
            self.assertEqual(db._usage, 1)
            self.assertEqual(db_con.num_queries, 1)
            db.close()
            self.assertIsNone(db._con)
            if shareable:
                self.assertIsNone(db._shared_con)
                self.assertEqual(shared_con.shared, 0)
            self.assertRaises(InvalidConnection, getattr, db, '_usage')
            self.assertFalse(hasattr(db_con, '_num_queries'))
            self.assertEqual(len(pool._idle_cache), 1)
            self.assertEqual(pool._idle_cache[0]._con, db_con)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            db.close()
            if shareable:
                self.assertEqual(shared_con.shared, 0)
            db = pool.connection()
            self.assertEqual(db._con, con)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 1)
                shared_con = db._shared_con
                self.assertEqual(pool._shared_cache[0], shared_con)
                self.assertEqual(shared_con.con, con)
                self.assertEqual(shared_con.shared, 1)
            self.assertEqual(db._usage, 1)
            self.assertEqual(db_con.num_queries, 1)
            self.assertTrue(hasattr(db_con, 'database'))
            self.assertEqual(db_con.database, 'PooledDBTestDB')
            self.assertTrue(hasattr(db_con, 'user'))
            self.assertEqual(db_con.user, 'PooledDBTestUser')
            db.cursor().execute('select test')
            self.assertEqual(db_con.num_queries, 2)
            db.cursor().execute('select test')
            self.assertEqual(db_con.num_queries, 3)
            db.close()
            self.assertEqual(len(pool._idle_cache), 1)
            self.assertEqual(pool._idle_cache[0]._con, db_con)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            db = pool.connection(False)
            self.assertEqual(db._con, con)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            db.close()
            self.assertEqual(len(pool._idle_cache), 1)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)

    def test_close_all(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            shareable = threadsafety > 1
            pool = PooledDB(db_base, 10)
            self.assertEqual(len(pool._idle_cache), 10)
            pool.close()
            self.assertEqual(len(pool._idle_cache), 0)
            pool = PooledDB(db_base, 10)
            closed = ['no']

            def close(what=closed):
                what[0] = 'yes'

            pool._idle_cache[7]._con.close = close
            self.assertEqual(closed, ['no'])
            del pool
            self.assertEqual(closed, ['yes'])
            pool = PooledDB(db_base, 10, 10, 5)
            self.assertEqual(len(pool._idle_cache), 10)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            cache = []
            for i in range(5):
                cache.append(pool.connection())
            self.assertEqual(len(pool._idle_cache), 5)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 5)
            else:
                self.assertEqual(len(pool._idle_cache), 5)
            pool.close()
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            pool = PooledDB(db_base, 10, 10, 5)
            closed = []

            def close_idle(what=closed):
                what.append('idle')

            def close_shared(what=closed):
                what.append('shared')

            if shareable:
                cache = []
                for i in range(5):
                    cache.append(pool.connection())
                pool._shared_cache[3].con.close = close_shared
            else:
                pool._idle_cache[7]._con.close = close_shared
            pool._idle_cache[3]._con.close = close_idle
            self.assertEqual(closed, [])
            del pool
            if shareable:
                del cache
            self.assertEqual(closed, ['idle', 'shared'])

    def test_shareable_connection(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            shareable = threadsafety > 1
            kwargs = {'mincached': 0, 'maxcached': 1, 'maxshared': 2}
            config = DbMysqlConfig(**kwargs)

            pool_coon = DBMySqlPoolConn(config, db_base)

            pool = pool_coon.get_pool()

            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            db1 = pool_coon.get_conn()
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 1)
            # db2 = pool_coon.get_conn()
            # self.assertNotEqual(db1._con, db2._con)
            # self.assertEqual(len(pool._idle_cache), 0)
            # if shareable:
            #     self.assertEqual(len(pool._shared_cache), 2)
            # db3 = pool_coon.get_conn()
            # self.assertEqual(len(pool._idle_cache), 0)
            # if shareable:
            #     self.assertEqual(len(pool._shared_cache), 2)
            #     self.assertEqual(db3._con, db1._con)
            #     self.assertEqual(db1._shared_con.shared, 2)
            #     self.assertEqual(db2._shared_con.shared, 1)
            # else:
            #     self.assertNotEqual(db3._con, db1._con)
            #     self.assertNotEqual(db3._con, db2._con)
            # db4 = pool_coon.get_conn()
            # self.assertEqual(len(pool._idle_cache), 0)
            # if shareable:
            #     self.assertEqual(len(pool._shared_cache), 2)
            #     self.assertEqual(db4._con, db2._con)
            #     self.assertEqual(db1._shared_con.shared, 2)
            #     self.assertEqual(db2._shared_con.shared, 2)
            # else:
            #     self.assertNotEqual(db4._con, db1._con)
            #     self.assertNotEqual(db4._con, db2._con)
            #     self.assertNotEqual(db4._con, db3._con)
            # db5 = pool.connection(False)
            # self.assertNotEqual(db5._con, db1._con)
            # self.assertNotEqual(db5._con, db2._con)
            # self.assertNotEqual(db5._con, db3._con)
            # self.assertNotEqual(db5._con, db4._con)
            # self.assertEqual(len(pool._idle_cache), 0)
            # if shareable:
            #     self.assertEqual(len(pool._shared_cache), 2)
            #     self.assertEqual(db1._shared_con.shared, 2)
            #     self.assertEqual(db2._shared_con.shared, 2)
            # db5.close()
            # self.assertEqual(len(pool._idle_cache), 1)
            db5 = pool_coon.get_conn()
            if shareable:
                self.assertEqual(len(pool._idle_cache), 1)
                self.assertEqual(len(pool._shared_cache), 2)
                self.assertEqual(db5._shared_con.shared, 3)
            else:
                self.assertEqual(len(pool._idle_cache), 0)
            # pool = PooledDB(db_base, 0, 0, 1)
            # self.assertEqual(len(pool._idle_cache), 0)
            # db1 = pool.connection(False)
            # if shareable:
            #     self.assertEqual(len(pool._shared_cache), 0)
            # db2 = pool.connection()
            # if shareable:
            #     self.assertEqual(len(pool._shared_cache), 1)
            # db3 = pool.connection()
            # if shareable:
            #     self.assertEqual(len(pool._shared_cache), 1)
            #     self.assertEqual(db2._con, db3._con)
            # else:
            #     self.assertNotEqual(db2._con, db3._con)
            # del db3
            # if shareable:
            #     self.assertEqual(len(pool._idle_cache), 0)
            #     self.assertEqual(len(pool._shared_cache), 1)
            # else:
            #     self.assertEqual(len(pool._idle_cache), 1)
            # del db2
            # if shareable:
            #     self.assertEqual(len(pool._idle_cache), 1)
            #     self.assertEqual(len(pool._shared_cache), 0)
            # else:
            #     self.assertEqual(len(pool._idle_cache), 2)
            # del db1
            # if shareable:
            #     self.assertEqual(len(pool._idle_cache), 2)
            #     self.assertEqual(len(pool._shared_cache), 0)
            # else:
            #     self.assertEqual(len(pool._idle_cache), 3)

    def test_min_max_cached(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            shareable = threadsafety > 1
            pool = PooledDB(db_base, 3)
            self.assertEqual(len(pool._idle_cache), 3)
            cache = [pool.connection() for i in range(3)]
            self.assertEqual(len(pool._idle_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 3)
            cache = [pool.connection() for i in range(6)]
            self.assertEqual(len(pool._idle_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 6)
            pool = PooledDB(db_base, 0, 3)
            self.assertEqual(len(pool._idle_cache), 0)
            cache = [pool.connection() for i in range(3)]
            self.assertEqual(len(pool._idle_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 3)
            cache = [pool.connection() for i in range(6)]
            self.assertEqual(len(pool._idle_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 3)
            pool = PooledDB(db_base, 3, 3)
            self.assertEqual(len(pool._idle_cache), 3)
            cache = [pool.connection() for i in range(3)]
            self.assertEqual(len(pool._idle_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 3)
            cache = [pool.connection() for i in range(6)]
            self.assertEqual(len(pool._idle_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 3)
            pool = PooledDB(db_base, 3, 2)
            self.assertEqual(len(pool._idle_cache), 3)
            cache = [pool.connection() for i in range(4)]
            self.assertEqual(len(pool._idle_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 3)
            pool = PooledDB(db_base, 2, 5)
            self.assertEqual(len(pool._idle_cache), 2)
            cache = [pool.connection() for i in range(10)]
            self.assertEqual(len(pool._idle_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 5)
            pool = PooledDB(db_base, 1, 2, 3)
            self.assertEqual(len(pool._idle_cache), 1)
            cache = [pool.connection(False) for i in range(4)]
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 2)
            cache = [pool.connection() for i in range(10)]
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 3)
            del cache
            self.assertEqual(len(pool._idle_cache), 2)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            pool = PooledDB(db_base, 1, 3, 2)
            self.assertEqual(len(pool._idle_cache), 1)
            cache = [pool.connection(False) for i in range(4)]
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 3)
            cache = [pool.connection() for i in range(10)]
            if shareable:
                self.assertEqual(len(pool._idle_cache), 1)
                self.assertEqual(len(pool._shared_cache), 2)
            else:
                self.assertEqual(len(pool._idle_cache), 0)
            del cache
            self.assertEqual(len(pool._idle_cache), 3)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)

    def test_max_shared(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            shareable = threadsafety > 1
            pool = PooledDB(db_base)
            self.assertEqual(len(pool._idle_cache), 0)
            cache = [pool.connection() for i in range(10)]
            self.assertEqual(len(cache), 10)
            self.assertEqual(len(pool._idle_cache), 0)
            pool = PooledDB(db_base, 1, 1, 0)
            self.assertEqual(len(pool._idle_cache), 1)
            cache = [pool.connection() for i in range(10)]
            self.assertEqual(len(cache), 10)
            self.assertEqual(len(pool._idle_cache), 0)
            pool = PooledDB(db_base, 0, 0, 1)
            cache = [pool.connection() for i in range(10)]
            self.assertEqual(len(cache), 10)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 1)
            pool = PooledDB(db_base, 1, 1, 1)
            self.assertEqual(len(pool._idle_cache), 1)
            cache = [pool.connection() for i in range(10)]
            self.assertEqual(len(cache), 10)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 1)
            pool = PooledDB(db_base, 0, 0, 7)
            cache = [pool.connection(False) for i in range(3)]
            self.assertEqual(len(cache), 3)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            cache = [pool.connection() for i in range(10)]
            self.assertEqual(len(cache), 10)
            self.assertEqual(len(pool._idle_cache), 3)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 7)

    def test_sort_shared(self):
        db_base.threadsafety = 2
        pool = PooledDB(db_base, 0, 4, 4)
        cache = []
        for i in range(6):
            db = pool.connection()
            db.cursor().execute('select test')
            cache.append(db)
        for i, db in enumerate(cache):
            self.assertEqual(db._shared_con.shared, 1 if 2 <= i < 4 else 2)
        cache[2].begin()
        cache[3].begin()
        db = pool.connection()
        self.assertIs(db._con, cache[0]._con)
        db.close()
        cache[3].rollback()
        db = pool.connection()
        self.assertIs(db._con, cache[3]._con)

    def test_equally_shared(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            shareable = threadsafety > 1
            pool = PooledDB(db_base, 5, 5, 5)
            self.assertEqual(len(pool._idle_cache), 5)
            for i in range(15):
                db = pool.connection(False)
                db.cursor().execute('select test')
                db.close()
            self.assertEqual(len(pool._idle_cache), 5)
            for i in range(5):
                con = pool._idle_cache[i]
                self.assertEqual(con._usage, 3)
                self.assertEqual(con._con.num_queries, 3)
            cache = []
            for i in range(35):
                db = pool.connection()
                db.cursor().execute('select test')
                cache.append(db)
                del db
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 5)
                for i in range(5):
                    con = pool._shared_cache[i]
                    self.assertEqual(con.shared, 7)
                    con = con.con
                    self.assertEqual(con._usage, 10)
                    self.assertEqual(con._con.num_queries, 10)
            del cache
            self.assertEqual(len(pool._idle_cache), 5)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)

    def test_many_shared(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            shareable = threadsafety > 1
            pool = PooledDB(db_base, 0, 0, 5)
            cache = []
            for i in range(35):
                db = pool.connection()
                db.cursor().execute('select test1')
                db.cursor().execute('select test2')
                db.cursor().callproc('test3')
                cache.append(db)
                del db
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 5)
                for i in range(5):
                    con = pool._shared_cache[i]
                    self.assertEqual(con.shared, 7)
                    con = con.con
                    self.assertEqual(con._usage, 21)
                    self.assertEqual(con._con.num_queries, 14)
                cache[3] = cache[8] = cache[33] = None
                cache[12] = cache[17] = cache[34] = None
                self.assertEqual(len(pool._shared_cache), 5)
                self.assertEqual(pool._shared_cache[0].shared, 7)
                self.assertEqual(pool._shared_cache[1].shared, 7)
                self.assertEqual(pool._shared_cache[2].shared, 5)
                self.assertEqual(pool._shared_cache[3].shared, 4)
                self.assertEqual(pool._shared_cache[4].shared, 6)
                for db in cache:
                    if db:
                        db.cursor().callproc('test4')
                for i in range(6):
                    db = pool.connection()
                    db.cursor().callproc('test4')
                    cache.append(db)
                    del db
                for i in range(5):
                    con = pool._shared_cache[i]
                    self.assertEqual(con.shared, 7)
                    con = con.con
                    self.assertEqual(con._usage, 28)
                    self.assertEqual(con._con.num_queries, 14)
            del cache
            if shareable:
                self.assertEqual(len(pool._idle_cache), 5)
                self.assertEqual(len(pool._shared_cache), 0)
            else:
                self.assertEqual(len(pool._idle_cache), 35)

    def test_rollback(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            pool = PooledDB(db_base, 0, 1)
            self.assertEqual(len(pool._idle_cache), 0)
            db = pool.connection(False)
            self.assertEqual(len(pool._idle_cache), 0)
            self.assertEqual(db._con._con.open_cursors, 0)
            cursor = db.cursor()
            self.assertEqual(db._con._con.open_cursors, 1)
            cursor.execute('set doit1')
            db.commit()
            cursor.execute('set dont1')
            cursor.close()
            self.assertEqual(db._con._con.open_cursors, 0)
            del db
            self.assertEqual(len(pool._idle_cache), 1)
            db = pool.connection(False)
            self.assertEqual(len(pool._idle_cache), 0)
            self.assertEqual(db._con._con.open_cursors, 0)
            cursor = db.cursor()
            self.assertEqual(db._con._con.open_cursors, 1)
            cursor.execute('set doit2')
            cursor.close()
            self.assertEqual(db._con._con.open_cursors, 0)
            db.commit()
            session = db._con._con.session
            db.close()
            self.assertEqual(session, [
                'doit1', 'commit', 'dont1', 'rollback',
                'doit2', 'commit', 'rollback'])

    def test_maxconnections(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            shareable = threadsafety > 1
            pool = PooledDB(db_base, 1, 2, 2, 3)
            self.assertTrue(hasattr(pool, '_maxconnections'))
            self.assertEqual(pool._maxconnections, 3)
            self.assertTrue(hasattr(pool, '_connections'))
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 1)
            cache = []
            for i in range(3):
                cache.append(pool.connection(False))
            self.assertEqual(pool._connections, 3)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            self.assertRaises(TooManyConnections, pool.connection, 0)
            self.assertRaises(TooManyConnections, pool.connection)
            cache = []
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 2)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            for i in range(3):
                cache.append(pool.connection())
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(pool._connections, 2)
                self.assertEqual(len(pool._shared_cache), 2)
                cache.append(pool.connection(False))
                self.assertEqual(pool._connections, 3)
                self.assertEqual(len(pool._shared_cache), 2)
            else:
                self.assertEqual(pool._connections, 3)
            self.assertRaises(TooManyConnections, pool.connection, 0)
            if shareable:
                cache.append(pool.connection(True))
                self.assertEqual(pool._connections, 3)
            else:
                self.assertRaises(TooManyConnections, pool.connection)
            del cache
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 2)
            pool = PooledDB(db_base, 0, 1, 1, 1)
            self.assertEqual(pool._maxconnections, 1)
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 0)
            db = pool.connection(False)
            self.assertEqual(pool._connections, 1)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            self.assertRaises(TooManyConnections, pool.connection, 0)
            self.assertRaises(TooManyConnections, pool.connection)
            del db
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 1)
            cache = [pool.connection()]
            self.assertEqual(pool._connections, 1)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 1)
                cache.append(pool.connection())
                self.assertEqual(pool._connections, 1)
                self.assertEqual(len(pool._shared_cache), 1)
                self.assertEqual(pool._shared_cache[0].shared, 2)
            else:
                self.assertRaises(TooManyConnections, pool.connection)
            self.assertRaises(TooManyConnections, pool.connection, 0)
            if shareable:
                cache.append(pool.connection(True))
                self.assertEqual(pool._connections, 1)
                self.assertEqual(len(pool._shared_cache), 1)
                self.assertEqual(pool._shared_cache[0].shared, 3)
            else:
                self.assertRaises(TooManyConnections, pool.connection, 1)
            del cache
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 1)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            db = pool.connection(False)
            self.assertEqual(pool._connections, 1)
            self.assertEqual(len(pool._idle_cache), 0)
            del db
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 1)
            pool = PooledDB(db_base, 1, 2, 2, 1)
            self.assertEqual(pool._maxconnections, 2)
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 1)
            cache = []
            cache.append(pool.connection(False))
            self.assertEqual(pool._connections, 1)
            self.assertEqual(len(pool._idle_cache), 0)
            cache.append(pool.connection(False))
            self.assertEqual(pool._connections, 2)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            self.assertRaises(TooManyConnections, pool.connection, 0)
            self.assertRaises(TooManyConnections, pool.connection)
            pool = PooledDB(db_base, 4, 3, 2, 1, False)
            self.assertEqual(pool._maxconnections, 4)
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 4)
            cache = []
            for i in range(4):
                cache.append(pool.connection(False))
            self.assertEqual(pool._connections, 4)
            self.assertEqual(len(pool._idle_cache), 0)
            self.assertRaises(TooManyConnections, pool.connection, 0)
            self.assertRaises(TooManyConnections, pool.connection)
            pool = PooledDB(db_base, 1, 2, 3, 4, False)
            self.assertEqual(pool._maxconnections, 4)
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 1)
            for i in range(4):
                cache.append(pool.connection())
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(pool._connections, 3)
                self.assertEqual(len(pool._shared_cache), 3)
                cache.append(pool.connection())
                self.assertEqual(pool._connections, 3)
                cache.append(pool.connection(False))
                self.assertEqual(pool._connections, 4)
            else:
                self.assertEqual(pool._connections, 4)
                self.assertRaises(TooManyConnections, pool.connection)
            self.assertRaises(TooManyConnections, pool.connection, 0)
            pool = PooledDB(db_base, 0, 0, 3, 3, False)
            self.assertEqual(pool._maxconnections, 3)
            self.assertEqual(pool._connections, 0)
            cache = []
            for i in range(3):
                cache.append(pool.connection(False))
            self.assertEqual(pool._connections, 3)
            self.assertRaises(TooManyConnections, pool.connection, 0)
            self.assertRaises(TooManyConnections, pool.connection, 1)
            cache = []
            self.assertEqual(pool._connections, 0)
            for i in range(3):
                cache.append(pool.connection())
            self.assertEqual(pool._connections, 3)
            if shareable:
                for i in range(3):
                    cache.append(pool.connection())
                self.assertEqual(pool._connections, 3)
            else:
                self.assertRaises(TooManyConnections, pool.connection)
            self.assertRaises(TooManyConnections, pool.connection, 0)
            pool = PooledDB(db_base, 0, 0, 3)
            self.assertEqual(pool._maxconnections, 0)
            self.assertEqual(pool._connections, 0)
            cache = []
            for i in range(10):
                cache.append(pool.connection(False))
                cache.append(pool.connection())
            if shareable:
                self.assertEqual(pool._connections, 13)
                self.assertEqual(len(pool._shared_cache), 3)
            else:
                self.assertEqual(pool._connections, 20)
            pool = PooledDB(db_base, 1, 1, 1, 1, True)
            self.assertEqual(pool._maxconnections, 1)
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 1)
            db = pool.connection(False)
            self.assertEqual(pool._connections, 1)
            self.assertEqual(len(pool._idle_cache), 0)

            def connection():
                db = pool.connection()
                cursor = db.cursor()
                cursor.execute('set thread')
                cursor.close()
                db.close()

            from threading import Thread
            thread = Thread(target=connection)
            thread.start()
            thread.join(0.1)
            self.assertTrue(thread.is_alive())
            self.assertEqual(pool._connections, 1)
            self.assertEqual(len(pool._idle_cache), 0)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            session = db._con._con.session
            self.assertEqual(session, ['rollback'])
            del db
            thread.join(0.1)
            self.assertFalse(thread.is_alive())
            self.assertEqual(pool._connections, 0)
            self.assertEqual(len(pool._idle_cache), 1)
            if shareable:
                self.assertEqual(len(pool._shared_cache), 0)
            db = pool.connection(False)
            self.assertEqual(pool._connections, 1)
            self.assertEqual(len(pool._idle_cache), 0)
            self.assertEqual(
                session, ['rollback', 'rollback', 'thread', 'rollback'])
            del db

    def test_maxusage(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            for maxusage in (0, 3, 7):
                pool = PooledDB(db_base, 0, 0, 0, 1, False, maxusage)
                self.assertEqual(pool._maxusage, maxusage)
                self.assertEqual(len(pool._idle_cache), 0)
                db = pool.connection(False)
                self.assertEqual(db._con._maxusage, maxusage)
                self.assertEqual(len(pool._idle_cache), 0)
                self.assertEqual(db._con._con.open_cursors, 0)
                self.assertEqual(db._usage, 0)
                self.assertEqual(db._con._con.num_uses, 0)
                self.assertEqual(db._con._con.num_queries, 0)
                for i in range(20):
                    cursor = db.cursor()
                    self.assertEqual(db._con._con.open_cursors, 1)
                    cursor.execute(f'select test{i}')
                    r = cursor.fetchone()
                    self.assertEqual(r, f'test{i}')
                    cursor.close()
                    self.assertEqual(db._con._con.open_cursors, 0)
                    if maxusage:
                        j = i % maxusage + 1
                    else:
                        j = i + 1
                    self.assertEqual(db._usage, j)
                    self.assertEqual(db._con._con.num_uses, j)
                    self.assertEqual(db._con._con.num_queries, j)
                db.cursor().callproc('test')
                self.assertEqual(db._con._con.open_cursors, 0)
                self.assertEqual(db._usage, j + 1)
                self.assertEqual(db._con._con.num_uses, j + 1)
                self.assertEqual(db._con._con.num_queries, j)

    def test_setsession(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            setsession = ('set time zone', 'set datestyle')
            pool = PooledDB(db_base, 0, 0, 0, 1, False, None, setsession)
            self.assertEqual(pool._setsession, setsession)
            db = pool.connection(False)
            self.assertEqual(db._setsession_sql, setsession)
            self.assertEqual(
                db._con._con.session, ['time zone', 'datestyle'])
            db.cursor().execute('select test')
            db.cursor().execute('set test1')
            self.assertEqual(db._usage, 2)
            self.assertEqual(db._con._con.num_uses, 4)
            self.assertEqual(db._con._con.num_queries, 1)
            self.assertEqual(
                db._con._con.session, ['time zone', 'datestyle', 'test1'])
            db.close()
            db = pool.connection(False)
            self.assertEqual(db._setsession_sql, setsession)
            self.assertEqual(
                db._con._con.session,
                ['time zone', 'datestyle', 'test1', 'rollback'])
            db._con._con.close()
            db.cursor().execute('select test')
            db.cursor().execute('set test2')
            self.assertEqual(
                db._con._con.session, ['time zone', 'datestyle', 'test2'])

    def test_one_thread_two_connections(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            shareable = threadsafety > 1
            pool = PooledDB(db_base, 2)
            db1 = pool.connection()
            for i in range(5):
                db1.cursor().execute('select test')
            db2 = pool.connection()
            self.assertNotEqual(db1, db2)
            self.assertNotEqual(db1._con, db2._con)
            for i in range(7):
                db2.cursor().execute('select test')
            self.assertEqual(db1._con._con.num_queries, 5)
            self.assertEqual(db2._con._con.num_queries, 7)
            del db1
            db1 = pool.connection()
            self.assertNotEqual(db1, db2)
            self.assertNotEqual(db1._con, db2._con)
            for i in range(3):
                db1.cursor().execute('select test')
            self.assertEqual(db1._con._con.num_queries, 8)
            db2.cursor().execute('select test')
            self.assertEqual(db2._con._con.num_queries, 8)
            pool = PooledDB(db_base, 0, 0, 2)
            db1 = pool.connection()
            for i in range(5):
                db1.cursor().execute('select test')
            db2 = pool.connection()
            self.assertNotEqual(db1, db2)
            self.assertNotEqual(db1._con, db2._con)
            for i in range(7):
                db2.cursor().execute('select test')
            self.assertEqual(db1._con._con.num_queries, 5)
            self.assertEqual(db2._con._con.num_queries, 7)
            del db1
            db1 = pool.connection()
            self.assertNotEqual(db1, db2)
            self.assertNotEqual(db1._con, db2._con)
            for i in range(3):
                db1.cursor().execute('select test')
            self.assertEqual(db1._con._con.num_queries, 8)
            db2.cursor().execute('select test')
            self.assertEqual(db2._con._con.num_queries, 8)
            pool = PooledDB(db_base, 0, 0, 1)
            db1 = pool.connection()
            db2 = pool.connection()
            self.assertNotEqual(db1, db2)
            if shareable:
                self.assertEqual(db1._con, db2._con)
            else:
                self.assertNotEqual(db1._con, db2._con)
            del db1
            db1 = pool.connection(False)
            self.assertNotEqual(db1, db2)
            self.assertNotEqual(db1._con, db2._con)

    def test_tnree_threads_two_connections(self):
        for threadsafety in (1, 2):
            db_base.threadsafety = threadsafety
            pool = PooledDB(db_base, 2, 2, 0, 2, True)
            from queue import Queue, Empty
            queue = Queue(3)

            def connection():
                try:
                    queue.put(pool.connection(), 1, 1)
                except Exception:
                    queue.put(pool.connection(), 1)

            from threading import Thread
            for i in range(3):
                Thread(target=connection).start()
            try:
                db1 = queue.get(1, 1)
                db2 = queue.get(1, 1)
            except TypeError:
                db1 = queue.get(1)
                db2 = queue.get(1)
            self.assertNotEqual(db1, db2)
            db1_con = db1._con
            db2_con = db2._con
            self.assertNotEqual(db1_con, db2_con)
            try:
                self.assertRaises(Empty, queue.get, 1, 0.1)
            except TypeError:
                self.assertRaises(Empty, queue.get, 0)
            del db1
            try:
                db1 = queue.get(1, 1)
            except TypeError:
                db1 = queue.get(1)
            self.assertNotEqual(db1, db2)
            self.assertNotEqual(db1._con, db2._con)
            self.assertEqual(db1._con, db1_con)
            pool = PooledDB(db_base, 2, 2, 1, 2, True)
            db1 = pool.connection(False)
            db2 = pool.connection(False)
            self.assertNotEqual(db1, db2)
            db1_con = db1._con
            db2_con = db2._con
            self.assertNotEqual(db1_con, db2_con)
            Thread(target=connection).start()
            try:
                self.assertRaises(Empty, queue.get, 1, 0.1)
            except TypeError:
                self.assertRaises(Empty, queue.get, 0)
            del db1
            try:
                db1 = queue.get(1, 1)
            except TypeError:
                db1 = queue.get(1)
            self.assertNotEqual(db1, db2)
            self.assertNotEqual(db1._con, db2._con)
            self.assertEqual(db1._con, db1_con)

    def test_ping_check(self):
        Connection = db_base.Connection
        Connection.has_ping = True
        Connection.num_pings = 0
        db_base.threadsafety = 2
        pool = PooledDB(db_base, 1, 1, 0, 0, False, None, None, True, None, 0)
        db = pool.connection()
        self.assertTrue(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 0)
        db._con.close()
        db.close()
        db = pool.connection()
        self.assertFalse(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 0)
        pool = PooledDB(db_base, 1, 1, 1, 0, False, None, None, True, None, 0)
        db = pool.connection()
        self.assertTrue(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 0)
        db._con.close()
        db = pool.connection()
        self.assertFalse(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 0)
        pool = PooledDB(db_base, 1, 1, 0, 0, False, None, None, True, None, 1)
        db = pool.connection()
        self.assertTrue(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 1)
        db._con.close()
        db.close()
        db = pool.connection()
        self.assertTrue(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 2)
        pool = PooledDB(db_base, 1, 1, 1, 0, False, None, None, True, None, 1)
        db = pool.connection()
        self.assertTrue(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 3)
        db._con.close()
        db = pool.connection()
        self.assertTrue(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 4)
        pool = PooledDB(db_base, 1, 1, 1, 0, False, None, None, True, None, 2)
        db = pool.connection()
        self.assertTrue(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 4)
        db._con.close()
        db = pool.connection()
        self.assertFalse(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 4)
        db.cursor()
        self.assertTrue(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 5)
        pool = PooledDB(db_base, 1, 1, 1, 0, False, None, None, True, None, 4)
        db = pool.connection()
        self.assertTrue(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 5)
        db._con.close()
        db = pool.connection()
        self.assertFalse(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 5)
        cursor = db.cursor()
        db._con.close()
        self.assertFalse(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 5)
        cursor.execute('select test')
        self.assertTrue(db._con._con.valid)
        self.assertEqual(Connection.num_pings, 6)
        Connection.has_ping = False
        Connection.num_pings = 0

    def test_failed_transaction(self):
        db_base.threadsafety = 2
        pool = PooledDB(db_base, 0, 1, 1)
        db = pool.connection()
        cursor = db.cursor()
        db._con._con.close()
        cursor.execute('select test')
        db.begin()
        db._con._con.close()
        self.assertRaises(db_base.InternalError, cursor.execute, 'select test')
        cursor.execute('select test')
        db.begin()
        db.cancel()
        db._con._con.close()
        cursor.execute('select test')
        pool = PooledDB(db_base, 1, 1, 0)
        db = pool.connection()
        cursor = db.cursor()
        db._con._con.close()
        cursor.execute('select test')
        db.begin()
        db._con._con.close()
        self.assertRaises(db_base.InternalError, cursor.execute, 'select test')
        cursor.execute('select test')
        db.begin()
        db.cancel()
        db._con._con.close()
        cursor.execute('select test')

    def test_shared_in_transaction(self):
        db_base.threadsafety = 2
        pool = PooledDB(db_base, 0, 1, 1)
        db = pool.connection()
        db.begin()
        pool.connection(False)
        self.assertRaises(TooManyConnections, pool.connection)
        pool = PooledDB(db_base, 0, 2, 2)
        db1 = pool.connection()
        db2 = pool.connection()
        self.assertIsNot(db2._con, db1._con)
        db2.close()
        db2 = pool.connection()
        self.assertIsNot(db2._con, db1._con)
        db = pool.connection()
        self.assertIs(db._con, db1._con)
        db.close()
        db1.begin()
        db = pool.connection()
        self.assertIs(db._con, db2._con)
        db.close()
        db2.begin()
        pool.connection(False)
        self.assertRaises(TooManyConnections, pool.connection)
        db1.rollback()
        db = pool.connection()
        self.assertIs(db._con, db1._con)

    def test_reset_transaction(self):
        pool = PooledDB(db_base, 1, 1, 0)
        db = pool.connection()
        db.begin()
        con = db._con
        self.assertTrue(con._transaction)
        self.assertEqual(con._con.session, ['rollback'])
        db.close()
        self.assertIs(pool.connection()._con, con)
        self.assertFalse(con._transaction)
        self.assertEqual(con._con.session, ['rollback'] * 3)
        pool = PooledDB(db_base, 1, 1, 0, reset=False)
        db = pool.connection()
        db.begin()
        con = db._con
        self.assertTrue(con._transaction)
        self.assertEqual(con._con.session, [])
        db.close()
        self.assertIs(pool.connection()._con, con)
        self.assertFalse(con._transaction)
        self.assertEqual(con._con.session, ['rollback'])

    def test_context_manager(self):
        pool = PooledDB(db_base, 1, 1, 1)
        con = pool._idle_cache[0]._con
        with pool.connection() as db:
            self.assertTrue(hasattr(db, '_shared_con'))
            self.assertFalse(pool._idle_cache)
            self.assertTrue(con.valid)
            with db.cursor() as cursor:
                self.assertEqual(con.open_cursors, 1)
                cursor.execute('select test')
                r = cursor.fetchone()
            self.assertEqual(con.open_cursors, 0)
            self.assertEqual(r, 'test')
            self.assertEqual(con.num_queries, 1)
        self.assertTrue(pool._idle_cache)
        with pool.dedicated_connection() as db:
            self.assertFalse(hasattr(db, '_shared_con'))
            self.assertFalse(pool._idle_cache)
            with db.cursor() as cursor:
                self.assertEqual(con.open_cursors, 1)
                cursor.execute('select test')
                r = cursor.fetchone()
            self.assertEqual(con.open_cursors, 0)
            self.assertEqual(r, 'test')
            self.assertEqual(con.num_queries, 2)
        self.assertTrue(pool._idle_cache)


class TestSharedDBConnection(unittest.TestCase):

    def test_create_connection(self):
        db_con = db_base.connect()
        con = SharedDBConnection(db_con)
        self.assertEqual(con.con, db_con)
        self.assertEqual(con.shared, 1)

    def test_share_and_unshare(self):
        con = SharedDBConnection(db_base.connect())
        self.assertEqual(con.shared, 1)
        con.share()
        self.assertEqual(con.shared, 2)
        con.share()
        self.assertEqual(con.shared, 3)
        con.unshare()
        self.assertEqual(con.shared, 2)
        con.unshare()
        self.assertEqual(con.shared, 1)

    def test_comparison(self):
        con1 = SharedDBConnection(db_base.connect())
        con1.con._transaction = False
        con2 = SharedDBConnection(db_base.connect())
        con2.con._transaction = False
        self.assertTrue(con1 == con2)
        self.assertTrue(con1 <= con2)
        self.assertTrue(con1 >= con2)
        self.assertFalse(con1 != con2)
        self.assertFalse(con1 < con2)
        self.assertFalse(con1 > con2)
        con2.share()
        self.assertFalse(con1 == con2)
        self.assertTrue(con1 <= con2)
        self.assertFalse(con1 >= con2)
        self.assertTrue(con1 != con2)
        self.assertTrue(con1 < con2)
        self.assertFalse(con1 > con2)
        con1.con._transaction = True
        self.assertFalse(con1 == con2)
        self.assertFalse(con1 <= con2)
        self.assertTrue(con1 >= con2)
        self.assertTrue(con1 != con2)
        self.assertFalse(con1 < con2)
        self.assertTrue(con1 > con2)


if __name__ == '__main__':
    unittest.main()
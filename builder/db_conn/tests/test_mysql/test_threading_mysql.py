import logging
import time
import concurrent.futures
import pymysql
import threading
from db_conn.tests.test_mysql.base import (using_mysql, using_mysql_pool)
from db_conn.tests.test_mysql import base
from pymysql.constants import CLIENT
from db_conn.common.log.logger import logger
from db_conn.common.db.mysql.pyMySql import DBMySqlLib

class TestThreadingMysql(base.PyMySQLTestCase):

    @using_mysql_pool()
    def test_pool_get_one_version_info(self, db=''):

        sql = 'SELECT * FROM version  WHERE  id = 1'
        db.cursor.execute(sql)
        # time.sleep(10)
        res = db.cursor.fetchone()
        # logger.info(sql)
        print(res)

        self.assertEqual(res, dict({'id': 1, 'manager_version': 'manager-1.1.3', 'builder_version': 'builder-1.1.6', 'engine_version': 'engine-1.1.1', 'dataio_version': 'dataio-1.1.1'}))




    def mysql_exe(self,nums):

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            executor.map(self.test_pool_get_one_version_info, nums)



    def test_xx(self):
        connection1 = base.PyMySQLTestCase().connections_params
        kw = {}
        kw['log_open'] = False
        kw['maxconnections'] = 20
        # logger.info('connection')
        # print(connection1)
        with DBMySqlLib(connection1['host'], connection1['user'], connection1['passwd'],
                   connection1['database'], connection1['port'], True, **kw) as db:
            conn = db.connection
            sql = 'SELECT * FROM version  WHERE  id = 1'
            db.cursor.execute(sql)
        # time.sleep(10)
            res = db.cursor.fetchone()
            logger.info(res)
            # logging.error(res)
            print(res)

    def test_exe(self):
        # nums = [1,2,3,4,5,6,7,8,9,10]
        # self.mysql_exe(nums)
        for i in range(10):
            # print(i)
            # t = threading.Thread(target=self.test_pool_get_one_version_info)
            t = threading.Thread(target=self.test_xx)
            t.start()

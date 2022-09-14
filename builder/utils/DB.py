# -*-coding:utf-8-*-
# @Time    : 2020/8/11 13:13
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
import pymysql
class DB(object):
    def __init__(self, host, port, user, password, database, charset):
        '''

        :param host: IP
        :param user: 用户名
        :param password: 密码
        :param port: 端口号
        :param database: 数据库名
        :param charset: 编码格式
        '''
        self.conn_db = pymysql.connect(host=host, user=user, password=password,port=port, database=database, charset=charset)
        self.cursor = self.conn_db.cursor()

    def exec(self, sql):
        self.cursor.execute(sql)
        # self.conn_db.commit()
        return self.cursor.fetchall()

    def __del__(self):
        self.cursor.close()
        self.conn_db.close()

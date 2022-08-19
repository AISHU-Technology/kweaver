# -*- coding: utf-8 -*-
'''
@Time    : 2019/12/31 16:58
@Author  : Tian.gu
'''

import pyorient
import os


class Orient():
    def __del__(self):
        self.client.close()

    def __init__(self):
        self.batch_list = ['begin']
        try:
            self.client = pyorient.OrientDB('10.2.196.48', 2424)
            self.cur = self.client.connect(user='root', password='dalong')
            print("orientdb connect success")
        except Exception:
            raise RuntimeError

    def close_db(self):
        self.client.close()

    def drop_db(self, db_name):
        try:
            self.client.db_drop(db_name)
            print("drop %s success" % (db_name))
        except Exception:
            pass

    def open_db(self, db_name):
        self.client.db_open(db_name, "admin", "admin")

    def creat_database(self, db_name):
        try:
            if self.client.db_exists(db_name, pyorient.STORAGE_TYPE_PLOCAL):
                print("orientdb exists")
            else:
                self.client.db_create(db_name, pyorient.DB_TYPE_GRAPH, pyorient.STORAGE_TYPE_PLOCAL)
                print("orientdb creat success")
        except Exception:
            raise Exception
        finally:
            self.client.db_open(db_name, "admin", "admin")

    def execute(self, sql):
        self.client.command(sql)

    def search(self, sql):
        return self.client.command(sql)

    def batch_execute(self, batch_sql):
        self.batch_list.append(batch_sql)
        self.batch_list.append('commit retry 100;')
        _ = self.client.batch(';'.join(self.batch_list))
        self.batch_list = ['begin']

    def delete_index(self,index):
        sql = "drop index %s" % (index)
        try:
            self.execute(sql)
            print("delete index %s success" % (index))
        except Exception:
            print("delete index %s error"%(index))

    def delete_vertex(self, entity):
        sql = "delete vertex %s" % (entity)
        try:
            self.execute(sql)
            print("delete vertex %s success" % (entity))
        except Exception:
            print("delete vertex %s error" % (entity))

    def delete_edge(self,relationship):
        sql = "delete edge %s"%(relationship)
        try:
            self.execute(sql)
            print("delete edge %s success" % (relationship))
        except Exception:
            print("delete edge %s error" % (relationship))

    def find_primary(self, entity, property, property_value):
        pass #EMPTY

    def property_confirm_vertex(self, entity, property_dict):
        find_sql = "select from {} where".format(entity)
        for i, (property_key, property_value) in enumerate(property_dict.items()):
            if i == 0:
                find_sql += "`{}`='{}'".format(property_key, property_value)
            else:
                find_sql += " and `{}`='{}'".format(property_key, property_value)
        result = self.search(find_sql)
        if result:
            ### 已存在，返回1
            return 1
        else:
            return 0

    def vertex_confirm_relation(self, rid1, rel, rid2):
        gremlin_sql = "g.V().has('@rid','{}').out('{}').has('@rid','{}')".format(rid1, rel, rid2)
        # print(gremlin_sql)
        if self.search(gremlin_sql):
            return 1
        else:
            return 0
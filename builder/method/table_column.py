# -*- coding: utf-8 -*-
'''
@Time    : 2020/2/21 10:31
@Author  : Tian.gu
'''

from .database import DataBase
# import name_rule
import re
from collections import defaultdict


### 引入表选择和列选择的接口
class TableColumn():
    def __init__(self):
        self.table_list = []
        self.table_columns_dict = defaultdict(list)
        self.table_column_frag_dict = defaultdict(list)
        self.column_relation_list = []
        self.table_primary_dict = {}

    def select(self, table_column_result,flag="mysql"):
        try:
            for table, column in table_column_result:
                self.table_list.append(table)
                self.table_columns_dict[table].append(column)
                self.table_column_frag_dict[table].extend(
                    [word.lower() for word in re.findall("[a-zA-Z][^_\-A-Z]+", column)])
        except Exception as e:
            raise e
        ### 查询表格约束并提取信息
        # constraint_sql = "select table_name,column_name,constraint_name,referenced_table_name,referenced_column_name from information_schema.key_column_usage " \
        #                 "where constraint_schema='komdb' and table_name like 'T_%'"
        if flag=="mysql":
            try:
                constraint_sql = "select table_name,column_name,constraint_name,referenced_table_name,referenced_column_name from information_schema.key_column_usage " \
                                 "where constraint_schema='komdb_dw'"
                constraint_result = DataBase(flag=1).query(constraint_sql)
                for constraint in constraint_result:
                    table_name, \
                    column_name, \
                    constraint_name, \
                    references_table_name, \
                    references_column_name = constraint
                    if constraint_name == "FOREIGN":
                        self.column_relation_list.append(
                            (table_name, column_name, references_table_name, references_column_name))
                    elif constraint_name == "PRIMARY":
                        self.table_primary_dict[table_name] = column_name
            except Exception:
                pass
        print("self.table_list")
        print(self.table_list)
        print("self.table_columns_dict")
        print(self.table_columns_dict)
        print("self.table_column_frag_dict")
        print(self.table_column_frag_dict)
        print("self.table_primary_dict")
        print(self.table_primary_dict)
        return self.table_list, self.table_columns_dict, self.table_column_frag_dict,  self.table_primary_dict

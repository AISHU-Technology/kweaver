# -*- coding: utf-8 -*-
'''
@Time    : 2020/3/26 17:59
@Author  : Tian.gu
'''
from collections import defaultdict

class Statistics():
    def run(self, file_path="err_sql.txt"):
        err_type_count_dict = {}
        with open(file_path,"r+") as file:
            for line in file.read().split("\n"):
                err_type = line.split(":::")[0]
                if err_type in err_type_count_dict.keys():
                    err_type_count_dict[err_type] = err_type_count_dict[err_type] + 1
                else:
                    err_type_count_dict[err_type] = 1
        print(err_type_count_dict)


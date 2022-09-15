# -*- coding: utf-8 -*-
# import orientdb
import re
from .name_rule import _2upper,upper2_
from collections import defaultdict
import os
import time
# from .similar import
from .database import DataBase
from .table_column import TableColumn
from itertools import product
import gc
from utils.common_response_status import CommonResponseStatus

class Ontology():


    def __init__(self):
        '''初始化参数'''
        print("%%%%%%%%%%%%%%%start initialise%%%%%%%%%%%")
        self.entity_kernel = None
        self.entity_list = []  # 实体列表
        self.entity_primary_dict = defaultdict()
        self.entity_property_dict = {}  # 实体属性词典
        self.entity_relation_set = set()  # 实体关系集合
        self.table_list = []  # 表集合
        self.table_columns_dict = defaultdict(list)  # 数据库中的表和列
        self.table_column_frag_dict = defaultdict(list)  # 用来存放列切分后的碎片，用来判断主表
        self.table_entity_dict = {}  # 表归属的实体
        self.table_primary_dict = {}  # 表主键
        self.table_column_entity_dict = defaultdict(list)  # 表的列所属的实体和字段
        self.table_entity_property_list_dict = defaultdict()  # 表的列所属的实体的属性
        self.entity_main_table_dict = {}  # 实体主表
        self.entity_for_table_dict = {} ###实体所属表
        self.foreign_relation_list = []  # 列的关系，即外键信息
        self.column_entity_dict = {}  # 列所对应的实体
        self.column_relation_list = []  # 约束关系
        self.column_type_dict = {}  # 列的类型
        self.entity_column_dict = defaultdict(set)  # 实体所直接对应的列（名称包含实体），用于发现无（主表）属性实体并构建其属性
        self.relation_table_list = []  # 关系表，即实体主表外的其他表
        self.name_rule_dict = {}  # 规范命名词典
        print("%%%%%%%%%%%%%%%end initialise%%%%%%%%%%%")


    def data_processing(self,params_json):
        '''本体构建'''
        ### 连接数据并查询表及列名
        code,res,table_column_result, self.name_rule_dict,pro_type_dict,newtablelist= DataBase(params_json).select()
        if code == CommonResponseStatus.SERVER_ERROR.value:
            return code, res,self.entity_list, self.entity_property_dict, self.entity_relation_set,self.entity_for_table_dict,self.name_rule_dict,pro_type_dict,newtablelist
        flag=params_json["data_source"]
        ###引入表选择和列选择的接口
        self.table_list, self.table_columns_dict, \
        self.table_column_frag_dict, \
        self.table_primary_dict = TableColumn().select(table_column_result,flag=flag)

        # print()

        ### 基于算法确定实体：碎片出现占表比例，与碎片组合概念的种类，两个数目的乘积作为判断kernel的依据，其组合概念即实体
        frag_list = []
        frag_count_dict = {}
        frag_concept_dict = defaultdict(set)
        ### entity_kernel，实体核心是满足条件的前缀或后缀碎片
        for table, column_frag_list in self.table_column_frag_dict.items():
            if column_frag_list:
                try:
                    frag_list = frag_list + column_frag_list.remove(self.table_primary_dict[table].lower())
                except Exception:
                    frag_list += column_frag_list

        frag_set = set(frag_list)
        for frag in frag_set:
            frag_count_dict[frag] = 0
            for table, column_list in self.table_columns_dict.items():
                flag = 0
                for column in column_list:
                    frag_len = len(frag)
                    column_len = len(column)
                    if frag_len <= column_len:
                        ### 前缀
                        if frag == column.lower()[:frag_len]:
                            flag = 1
                            entity = column.lower()[frag_len:]
                            if len(entity) > 2:
                                frag_concept_dict[frag].add(entity)
                        ### 后缀
                        elif frag == column.lower()[column_len - frag_len:]:
                            flag = 1
                            entity = column.lower()[:column_len - frag_len]
                            if len(entity) > 2:
                                frag_concept_dict[frag].add(entity)
                if flag:
                    frag_count_dict[frag] += 1

        kernel_p_list = [(frag_count_dict[frag] * len(frag_concept_dict[frag]), frag) for frag in frag_set]
        kernel_p_list.sort(key=lambda x: x[0], reverse=True)
        if not kernel_p_list:
            return code, res,self.entity_list, self.entity_property_dict, self.entity_relation_set,self.entity_for_table_dict,self.name_rule_dict,pro_type_dict,newtablelist
        self.entity_kernel = kernel_p_list[0][1]

        self.entity_kernel="id"

        entity_set = frag_concept_dict[self.entity_kernel]

        ### 过滤，除去有符号和组合词
        # for entity1 in entity_set:
        #     for entity2 in entity_set:
        #         if entity1 != entity2:
        #             waste_list.append(similar.Similar(entity1,entity2))
        # entity_list = [word for word in entity_set if word not in waste_list]

        entity_list = list(entity_set)
        entity_table_num_dict = defaultdict(list)
        ### 找主表：根据表名除去关系表，受表名的影响会存在实体找不到主表和找错的情况
        for entity in entity_list:
            flag = 0
            for table, column_list in self.table_columns_dict.items():
                column_lower_list = list(map(lambda x: x.lower(), column_list))
                if (entity + self.entity_kernel) in column_lower_list or (
                        self.entity_kernel + entity) in column_lower_list:
                    # 考虑实体核心存在、实体在表名中存在，与碎片数目
                    if entity in table.lower():
                        flag = 1
                        entity_table_num_dict[entity].append(
                            (self.table_column_frag_dict[table].count(entity), len(table), table))
            if flag:
                entity_table_num_dict[entity].sort(key=lambda x: (-x[0], x[1]))
        self.entity_list = list(entity_table_num_dict.keys())
        for key,value in entity_table_num_dict.items():
            self.entity_for_table_dict[key]=[]
            for one in value:
                self.entity_for_table_dict[key].append(one[2])


        self.entity_main_table_dict = dict(map(lambda x: (x[0], x[1][0][2]), entity_table_num_dict.items()))

        # print(self.entity_list)
        # print(self.entity_main_table_dict)
        for entity, entity_main_table in self.entity_main_table_dict.items():
            self.table_entity_dict[entity_main_table] = entity
            column_list = self.table_columns_dict[entity_main_table]
            ### 默认属性即主表的所有列,删除与其他实体相关的列并建立关系
            self.entity_property_dict[entity] = column_list[:]
            for column in column_list:
                entity_flag = 1  ### 用于标识列归属于本实体还是别的实体
                ### 判断主键属性，主键属性加*前缀，暂不考虑
                if (entity + self.entity_kernel) == column.lower() or (self.entity_kernel + entity) == column.lower():
                    self.entity_primary_dict[entity] = column
                    # self.entity_property_dict[entity].remove(column)
                    # self.entity_property_dict[entity].append('*'+column)
                for en in self.entity_list:
                    if en in column.lower() and en != entity and entity not in column.lower():
                        ### 实体主表与其他实体的联系
                        self.entity_relation_set.add((entity,entity + "2" + en, en))
                        ### 主表中涉及其他实体的属性
                        self.table_column_entity_dict[entity_main_table].append((column, en, column))
                        self.column_entity_dict[column] = en
                        entity_flag = 0
                        try:
                            self.entity_property_dict[entity].remove(column)
                        except Exception:
                            pass
                if entity_flag:
                    self.table_column_entity_dict[entity_main_table].append((column, entity, column))
                    self.column_entity_dict[column] = entity
            ### 去掉外键并建立基于外键的实体关系
            for item in self.foreign_relation_list:
                if entity_main_table == item[0]:
                    self.entity_property_dict[entity].remove(item[1])
                    self.entity_relation_set.add((entity, entity + "2" + e, self.table_entity_dict[item[2]]))
                    self.table_column_entity_dict[entity_main_table].append((item[1], item[2], item[3]))
                    self.column_entity_dict[column] = item[2]

        ### 关系表
        entity_table = self.entity_main_table_dict.values()
        self.relation_table_list = [word for word in self.table_list if word not in entity_table]
        for relation_table in self.relation_table_list:
            main_entity = ""
            ### 根据id（主键）判断上下位,默认表名中存在着主键实体
            # if relation_table in self.table_primary_dict:
            #     for en in self.entity_list:
            #         try:
            #             if en in self.table_primary_dict[relation_table].lower():
            #                 main_entity = en
            #         except:
            #             pass

            column_lower_list = []
            for column in self.table_columns_dict[relation_table]:
                for en in self.entity_list:
                    column_lower = column.lower()
                    column_lower_list.append(column_lower)
                    if (en + self.entity_kernel) == column_lower or (self.entity_kernel + entity) == column_lower:
                        main_entity = en
                    elif en in column_lower:  ########
                        self.table_column_entity_dict[relation_table].append((column, en, column))
            if main_entity:
                self.table_entity_dict[relation_table] = main_entity
                for item in self.table_column_entity_dict[relation_table]:
                    if item[1] != main_entity:
                        self.entity_relation_set.add((main_entity, main_entity + "2" + item[1], item[1]))
        for table, column_list in self.table_column_entity_dict.items():
            self.table_entity_property_list_dict[table] = defaultdict(set)
            for item in column_list:
                ### 第一是相等，其次是in
                try:
                    entity_property_list = self.entity_property_dict[item[1]]
                    flag = 0
                    for property in entity_property_list:
                        if item[2].lower() == property.lower():
                            self.table_entity_property_list_dict[table][item[1]].add((item[0], property))
                            flag = 1
                            break
                    if flag:
                        continue
                    else:
                        for property in entity_property_list:
                            # if item[2].lower() in property.lower() or property.lower() in item[2].lower():
                            if item[2].lower() in property.lower():
                                self.table_entity_property_list_dict[table][item[1]].add((item[0], property))
                                break
                except Exception:
                    ### 外键的情况被一同考虑了
                    self.table_entity_property_list_dict[table][item[1]].add((item[0], item[2]))

        ### 管理属性的排列顺序
        for entity in self.entity_property_dict:
            property_list = [entity + self.entity_kernel[0].upper() + self.entity_kernel[1:], entity + "Name"]
            property_list = [word for word in property_list if word in self.entity_property_dict[entity]]
            property_list = property_list + [word for word in self.entity_property_dict[entity]
                                             if word not in property_list and entity in word]
            property_list = property_list + [word for word in self.entity_property_dict[entity]
                                             if word not in property_list]
            self.entity_property_dict[entity] = property_list

            # print(self.entity_property_dict)
            # print(self.entity_relation_set)
            # print(self.table_entity_property_list_dict)

        return code, res,self.entity_list, self.entity_property_dict, self.entity_relation_set,self.entity_for_table_dict,self.name_rule_dict,pro_type_dict,newtablelist
               # self.entity_primary_dict, \
               # self.table_columns_dict, \
               # self.entity_main_table_dict, \
               # self.relation_table_list, \
               # self.table_entity_property_list_dict, \
               # self.table_primary_dict, \
               # self.table_entity_dict, \
               # self.name_rule_dict

    # def ontology_structure(self):
    #     _ = self.data_processing()
    #     self.orientdb_write_ontology()
    #     print("construct ontology done")




ontology = Ontology()

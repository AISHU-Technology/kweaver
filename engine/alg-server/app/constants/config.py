# -*- coding: utf-8 -*- 
# @Time : 2022/5/24 14:52 
# @Author : liqianlan
import os
from enum import Enum

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_DIR, 'app', 'data')

# Entity extract config dir,containing dict,rule,model files
ENTITY_CONFIG_DIR = os.path.join(DATA_DIR, 'entity')
ENTITY_DICT_FILE = os.path.join(ENTITY_CONFIG_DIR, 'dict.txt')  # 实体识别词典
ENTITY_RULE_FILE = os.path.join(ENTITY_CONFIG_DIR, 'rule.txt')  # 实体识别规则文件

# Intent recognition config dir,containing dict,rule,model files
INTENT_CONFIG_DIR = os.path.join(DATA_DIR, 'intent')
INTENT_RULE_FILE = os.path.join(INTENT_CONFIG_DIR, 'rule.json')

# Entity link config dir,containing dict,rule,model files
ENTITY_LINK_DIR = os.path.join(DATA_DIR, 'link')
ENTITY_SYNONYM_FILE = os.path.join(ENTITY_LINK_DIR, 'synonym.txt')

GENERAL_INTENT_NAME = '查文档'
GENERAL_INTENT_SPACE = '文档'
UNRECOGNIZED_INTENT_NAME = '其他'
UNRECOGNIZED_INTENT_SPACE = '无'


class SearchGraphSpace(Enum):
    n0601 = '运维'
    conceptMapDB = '概念'
    AB8 = '文档'
    none = '无'

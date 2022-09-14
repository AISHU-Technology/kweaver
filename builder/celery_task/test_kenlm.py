# !/usr/bin/env python
# -*- coding:utf-8 -*-
"""
    File Name: test_kenlm
    Description: 
    Author: Austin
    date: 2021/8/16
"""
import requests
import sys
from multiprocessing import Manager

manager = Manager()
share_dict = manager.dict({'count': 0, 'time': 0})

sys.path.append(r'.')
sys.path.append(r'..')
from dao.kg_new_word.new_words_dao_v2 import NewWordsToMongo

requests.packages.urllib3.disable_warnings()

config_path = "./../config/asapi.conf"
mongo_host = "10.2.196.57"

is_increment = False

mongo_db = "mongoDB_7"
as7json = {'ds_address': 'https://10.240.0.133', 'ds_port': 443, 'ds_auth': '1', 'id': 1}

# mongo_db = "mongoDB_4"
# as7json = {'ds_address': 'https://10.240.0.133', 'ds_port': 443, 'ds_auth': '5', 'id': 1}

new_words_to_mongo = NewWordsToMongo(config_path=config_path, mongo_db=mongo_db, mongo_host=mongo_host,
                                     mongo_port='27017', as7_json=as7json, is_increment=is_increment)
new_words_to_mongo.start()

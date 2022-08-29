# !/usr/bin/env python
# -*- coding:utf-8 -*-

import configparser
import logging
import yaml
import os
import time
from os import path
from dao.kg_new_word.new_words import Document
from dao.kg_new_word.co_pair import CoPairGen
from dao.kg_new_word.idf_counter import IDFCounter
from dao.kg_new_word.key_words import KWGenerator
from .data_util import MongoCon
from dao.kg_new_word.key_words_extract_multiprocess import DataProcess, load_data, KeyWords, get_keywords, DataSave
import multiprocessing

process_num = multiprocessing.cpu_count()

logging.basicConfig(level=logging.INFO, format='%(levelname)s %(asctime)s %(filename)s:%(lineno)d %(message)s')
logger = logging.getLogger(__name__)


class NewWordsToMongo(object):
    def __init__(self, config_path, as7_json, mongo_db, mongo_host=None, mongo_port=None, is_increment=False):
        self.as7_json = as7_json
        self.config_path = config_path
        self.mongo_db = mongo_db
        self.mongo = MongoCon(mongo_host, mongo_port, mongo_db)

        self.conf = configparser.ConfigParser()
        self.conf.read(self.config_path, "utf-8")
        self.mysql_cfg = None

        self.is_increment = is_increment

    def run(self):
        logger.info('-------------------------------------------------------------------------- new word')
        # 计算new_words，并写入mongodb_newWord，{ngram, n, freq, entropy, in_dict}
        doc_ngram = Document(as_cfg=self.as7_json, mysql_cfg=self.mysql_cfg, mongo=self.mongo, mongo_db=self.mongo_db,
                             conf=self.conf)
        doc_ngram.run()

        logger.info('-------------------------------------------------------------------------- idf')
        # 关键词：基于new_word构建AC_tree，统计idf并写入mongodb_wordIDF
        idf_counter = IDFCounter(mysql_cfg=self.mysql_cfg, mongo=self.mongo, mongo_db=self.mongo_db,
                                 as_cfg=self.as7_json, conf=self.conf)
        idf_counter.count_idf()

        logger.info('-------------------------------------------------------------------------- key word')
        # 基于tf-idf得到文档的label，对应边和点写入mongodb
        kw_gen = KWGenerator(mongo=self.mongo, mongo_db=self.mongo_db, mysql_cfg=self.mysql_cfg, as_cfg=self.as7_json,
                             conf=self.conf)
        kw_gen.gen_key_words()

        # 关键词提取
        logger.info("process_num: {}".format(process_num))
        time1 = time.time()
        logger.info('--------------------------------------------------------------------------text key words')
        data_process = DataProcess(mongo=self.mongo, mongo_db=self.mongo_db, user_words=[], as_cfg=self.as7_json,
                                   mysql_cfg=self.mysql_cfg, conf=self.conf, keyword_num=10, pos=True)
        gns_list, names = data_process.get_gns_from_mongo()
        # 加载所有gns数据
        doc_list = load_data(gns_list=gns_list, get_text=data_process.get_text_by_gns, process_num=process_num)
        # 训练tf-idf
        keywords = KeyWords(doc_list)
        idf_dic, default_idf = keywords.train_idf()
        keywords_list = get_keywords(idf_dic, default_idf, doc_list, process_num, tfidf_extract=keywords.tfidf_extract,
                                     keyword_num=10)
        # 写入mongodb
        data_save = DataSave(key_words=keywords_list, gns_list=gns_list, names=names, mongo=self.mongo,
                             mongo_db=self.mongo_db)
        data_save.word_tfidf_to_mongo()
        data_save.label2mongodb()
        time2 = time.time()
        logger.info("KeyWords COST: {}".format(str(time2 - time1)))

        logger.info('-------------------------------------------------------------------------- co pair')
        co_pair_gen = CoPairGen(mysql_cfg=self.mysql_cfg, mongo=self.mongo, mongo_db=self.mongo_db,
                                as_cfg=self.as7_json, conf=self.conf)
        co_pair_gen.gen_co_pair()

        logger.info('-------------------------------------------------------------------------- rm')
        # 删除中间过程保存的文件
        self.rm_mid_file()

    def rm_mid_file(self):
        for f_name in os.listdir('output'):
            if self.mongo_db in f_name:
                os.remove('output/' + f_name)
                logger.info('removed file {}'.format(f_name))

    def start(self):
        st = time.time()
        self.as7_json['key_list'] = self.conf.get('com', 'as_keys').split(',')
        db_config_path = path.join(path.dirname(path.dirname(path.abspath(__file__))), 'config', 'kwconfig.yaml')
        with open(db_config_path, 'r') as f:
            yaml_config = yaml.load(f)
        mariadb_config = yaml_config['mariadb']
        ip = mariadb_config.get('host')
        port = mariadb_config.get('port')
        user = mariadb_config.get('user')
        passwd = mariadb_config.get('password')
        database = mariadb_config.get('database')
        self.mysql_cfg = {
            'host': ip,
            'db': database,
            'user': user,
            'password': passwd,
            'charset': 'utf8',
            'port': port
        }
        if not os.path.isdir('output'):
            os.makedirs('output')
        self.run()
        logger.info('total cost time {}'.format(time.time() - st))

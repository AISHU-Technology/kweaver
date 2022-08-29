# !/usr/bin/env python
# -*- coding:utf-8 -*-

import logging
import os

import ahocorasick
import yaml
from pymongo import MongoClient
from os import path

logging.basicConfig(level=logging.INFO, format='%(levelname)s %(asctime)s %(filename)s:%(lineno)d %(message)s')
logger = logging.getLogger(__name__)


def build_ac_tree(word_list):
    ac_tree = ahocorasick.Automaton()
    for index, word in enumerate(word_list):
        ac_tree.add_word(word[::-1], (index, word))
    try:
        ac_tree.make_automaton()
    except Exception as e:
        logger.info('build ac tree error - {}'.format(e))
        return None
    logger.info('Built AC Tree {}'.format(len(word_list)))
    return ac_tree


def build_ac_tree_forward(word_list):
    ac_tree = ahocorasick.Automaton()
    for index, word in enumerate(word_list):
        ac_tree.add_word(word, (index, word))
    try:
        ac_tree.make_automaton()
    except Exception as e:
        logger.info('build ac tree error - {}'.format(e))
        return None
    logger.info('Built AC Tree {}'.format(len(word_list)))
    return ac_tree


def error_cb(r):
    logger.info(f'error callback - {str(r)}')


class Progress:
    """显示进度，自己简单封装，比tqdm更可控一些
    iterator: 可迭代的对象；
    period: 显示进度的周期；
    steps: iterator可迭代的总步数，相当于len(iterator)
    """

    def __init__(self, iterator, period=1, steps=None, desc=None):
        self.iterator = iterator
        self.period = period
        if hasattr(iterator, '__len__'):
            self.steps = len(iterator)
        else:
            self.steps = steps
        self.desc = desc
        if self.steps:
            self._format_ = u'%s/%s passed' % ('%s', self.steps)
        else:
            self._format_ = u'%s passed'
        if self.desc:
            self._format_ = self.desc + ' - ' + self._format_
        self.logger = logging.getLogger()

    def __iter__(self):
        for i, j in enumerate(self.iterator):
            if (i + 1) % self.period == 0:
                self.logger.info(self._format_ % (i + 1))
            yield j


class MongoCon:
    def __init__(self, host, port, db):
        self.host = host
        self.port = port
        self.db = db

    @property
    def con(self):
        import urllib.parse
        from config.config import db_config_path
        with open(db_config_path, 'r') as f:
            yaml_config = yaml.load(f)
        mongodb_config = yaml_config['mongodb']
        user = mongodb_config['user']
        password = urllib.parse.quote_plus(mongodb_config['password'])
        host = mongodb_config['host']
        port = mongodb_config['port']
        database = mongodb_config['database']
        if password is not None and user is not None:
            conn = MongoClient(f'mongodb://{user}:{password}@{host}:{port}/')
        else:
            conn = MongoClient('mongodb://{host}:{port}/')
        dbconn = conn[database]
        return dbconn


# 从mongodb中获取文档的gns
def get_gns(mongo, mongo_db, q_gns, signal, who, keys=('gns',), n_limit=1000):
    n_gns = 0
    gns_tb_conn = mongo.con[mongo_db + '_' + 'gnsInfo']

    tn_gns = gns_tb_conn.find().count()
    logger.info('gns total num {}'.format(tn_gns))

    n_iter = tn_gns // n_limit + bool(tn_gns % n_limit)
    for i in range(n_iter):
        logger.info('{} iter {}'.format(who, i))
        n_skip = i * n_limit
        for item in gns_tb_conn.find().limit(n_limit).skip(n_skip):
            if item.get("type") == 0:
                q_gns.put(tuple(item[key] for key in keys), timeout=120)
                n_gns += 1

    logger.info('gns file num {}'.format(n_gns))
    signal['no_more_gns'] = True
    signal['n_gns'] = n_gns

# !/usr/bin/env python
# -*- coding:utf-8 -*-

import logging
from multiprocessing import Pool, Manager
import re
import time
from collections import Counter
import queue
import jieba_fast
import math
from collections import defaultdict

from third_party_service.anyshare.token import asToken
from .otl_dao_non_async import get_as_file
from .data_util import build_ac_tree_forward, error_cb, get_gns
import numpy as np


logging.basicConfig(level=logging.INFO, format='%(levelname)s %(asctime)s %(filename)s:%(lineno)d %(message)s')
logger = logging.getLogger(__name__)


class CoPairGen:
    def __init__(self, as_cfg, mysql_cfg, mongo, mongo_db, conf):
        self.mongo = mongo
        self.mongo_db = mongo_db
        self.as_cfg = as_cfg
        self.mysql_cfg = mysql_cfg

        self.n_process = conf.getint('co_pair', 'n_process')

        self.n_size = conf.getint('co_pair', 'n_size')
        self.min_n = conf.getint('co_pair', 'min_n')
        self.min_ratio = conf.getfloat('co_pair', 'min_ratio')

        logger.info('n process {} - n size {} - min n {} - min ratio {}'.format(
            self.n_process, self.n_size, self.min_n, self.min_ratio))

        self.word_list = []
        self.ratio_co_pair = {}

    def read_word_list(self):
        res = self.mongo.con[self.mongo_db + '_' + 'label2document'].find({}, {'s': 1, 'p_pro': 1, '_id': 0})
        word_weights = defaultdict(list)
        for r in res:
            word = r['s']
            if 'weight' in r['p_pro']:
                weight = float(r['p_pro']['weight'])
                word_weights[word].append(weight)
        self.word_list = list(word_weights.keys())

        self.insert_label_to_mongo(word_weights)

    @staticmethod
    def entropy(prob_list):
        if not prob_list:
            return 0.0
        data_sum = np.sum(prob_list)
        prob_list_nz = [x / data_sum for x in prob_list]
        shannon_ent = 0.0
        for prob in prob_list_nz:
            shannon_ent -= prob * math.log(prob)
        len_l = len(prob_list_nz)
        if len_l > 1:
            shannon_ent = shannon_ent / math.log(len_l + 1)
        else:
            shannon_ent = prob_list[0]
        return shannon_ent

    # label 写入mongodb
    def insert_label_to_mongo(self, word_weights):
        key_word_items = []
        for word, weights in word_weights.items():
            item = {
                'name': word,
                'adlabel_kcid': word,
                'kc_topic_tags': '',
                'confidence': self.entropy(weights),
                'type_as': 'false',
                'type_sa': 'false',
                'type_nw': 'true',
                'type_kc': 'false',
                'ds_id': self.as_cfg['id']
            }
            key_word_items.append(item)
        logger.info('label num {}'.format(len(key_word_items)))
        if key_word_items:
            self.mongo.con[self.mongo_db + '_' + 'label'].insert_many(key_word_items)

    @staticmethod
    def find_sorted_position(the_list, target):
        low = 0
        high = len(the_list) - 1
        while low <= high:
            mid = (high + low) // 2
            if the_list[mid] == target:
                return mid
            elif target < the_list[mid]:
                high = mid - 1
            else:
                low = mid + 1
        return low

    def count_doc_co_pair(self, text, ac_tree):
        lines = re.split(r"[\n]+", text)
        n_co_pair = defaultdict(int)
        for sent in lines:
            phrases = jieba_fast.cut(sent)
            pindex = []
            index = 0
            for phrase in phrases:
                index = index + len(phrase)
                pindex.append(index)
            phrase_pair = []
            index1 = 0
            index2 = -1
            is_co_pairs = {}

            for phrase in ac_tree.iter(sent):
                phrase_pair.append(phrase)
                index2 += 1
                while (index1 < index2) and (abs(
                        CoPairGen.find_sorted_position(pindex, phrase_pair[index1][0]) -
                        CoPairGen.find_sorted_position(pindex, phrase_pair[index2][0])) > self.n_size):
                    index1 += 1
                for i in range(index1, index2):
                    is_co_pairs[(phrase_pair[i][1][0], phrase_pair[index2][1][0])] = 1
                    is_co_pairs[(phrase_pair[index2][1][0], phrase_pair[i][1][0])] = 1

            for pair, n in is_co_pairs.items():
                n_co_pair[pair] += n
        return n_co_pair

    def count_co_pair_(self, q_gns, signal, ac_tree):
        tn_co_pairs = defaultdict(float)
        print('开始获取AS token', __file__, 'count_co_pair_')
        ret_code, access_token = asToken.get_token(self.as_cfg['ds_auth'])
        while True:
            try:
                gns = q_gns.get(timeout=5)[0]
                gns = gns.split('/')[-1]
            except queue.Empty as _:
                if signal['no_more_gns']:
                    logger.info('queue is already empty, no more gns.')
                else:
                    logger.info('something wrong happened!')
                break
            text = get_as_file(self.as_cfg, gns, access_token)
            if not text:
                continue
            n_co_pairs = self.count_doc_co_pair(text, ac_tree)
            for pair, n in n_co_pairs.items():
                tn_co_pairs[pair] += math.log(2 + n)
        return tn_co_pairs

    def filter_co_pair(self, tn_co_pairs):
        n_words = [0] * len(self.word_list)
        for (p1, _), n in tn_co_pairs.items():
            if n >= self.min_n:
                n_words[p1] += n

        for (p1, p2), n in tn_co_pairs.items():
            if n >= self.min_n:
                ratio = round(n, 2) / round(n_words[p1], 2)
                if ratio > self.min_ratio:
                    self.ratio_co_pair[(self.word_list[p1], self.word_list[p2])] = ratio

    def insert_co_pair_to_mongo(self):
        co_word_items = []
        for (w1, w2), ratio in self.ratio_co_pair.items():
            if w1 != w2:
                item = {
                    's': w1,
                    'p': 'label2label',
                    'o': w2,
                    's_pro': {'name': w1, 'adlabel_kcid': w1, 'type_nw': 'true'},
                    'p_pro': {'name': 'label2label', 'weight': str(ratio)},
                    'o_pro': {'name': w2, 'adlabel_kcid': w2, 'type_nw': 'true'}
                }
                co_word_items.append(item)

        logger.info('co pair num {}'.format(len(co_word_items)))
        if co_word_items:
            self.mongo.con[self.mongo_db + '_' + 'label2label'].insert_many(co_word_items)

    def gen_co_pair(self):
        logger.info('co pair start')
        st = time.time()
        self.read_word_list()

        if not self.word_list:
            return None

        ac_tree = build_ac_tree_forward(self.word_list)

        q_gns = Manager().Queue(self.n_process * 5)
        signal = Manager().dict({'no_more_gns': False})
        pool = Pool(self.n_process)

        pool.apply_async(get_gns, args=(self.mongo, self.mongo_db, q_gns, signal, 'co pair'), error_callback=error_cb)

        res_list = []
        for _ in range(self.n_process - 1):
            res = pool.apply_async(self.count_co_pair_, args=(q_gns, signal, ac_tree), error_callback=error_cb)
            res_list.append(res)

        tn_co_pairs = Counter()
        for res in res_list:
            tn_co_pairs_part = res.get()
            tn_co_pairs.update(tn_co_pairs_part)
        pool.close()
        pool.join()

        self.filter_co_pair(tn_co_pairs)
        self.insert_co_pair_to_mongo()
        logger.info('co pair - cost time {}'.format(time.time() - st))

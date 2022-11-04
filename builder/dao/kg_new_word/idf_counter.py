# !/usr/bin/env python
# -*- coding:utf-8 -*-
import json
import os

from third_party_service.anyshare.token import asToken
from .otl_dao_non_async import get_as_file
import queue
import logging
import time
from multiprocessing import Manager, Pool
from collections import defaultdict
import math
from .data_util import error_cb, build_ac_tree, get_gns


logging.basicConfig(level=logging.INFO, format='%(levelname)s %(asctime)s %(filename)s:%(lineno)d %(message)s')
logger = logging.getLogger(__name__)


class IDFCounter:
    def __init__(self, as_cfg, mysql_cfg, mongo, mongo_db, conf):
        self.mongo = mongo
        self.mongo_db = mongo_db
        self.mysql_cfg = mysql_cfg
        self.as_cfg = as_cfg

        self.n_process = conf.getint('kw', 'n_process')
        logger.info('n process {}'.format(self.n_process))

    def count_df_(self, pi, q_gns, signal, ac_tree):
        print('开始获取AS token', __file__, 'count_df_')
        ret_code, access_token = asToken.get_token(self.as_cfg['ds_auth'])
        df_dict = defaultdict(int)
        not_empty = 0
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
            not_empty += 1

            # doc_word_set = set()
            # for _, (_, phrase) in ac_tree.iter(text):
            #     doc_word_set.add(phrase)
            # for w in doc_word_set:
            #     df_dict[w] += 1

            words = ['']
            for i in text[::-1]:
                if ac_tree.match(words[-1] + i):
                    words[-1] += i
                else:
                    words.append(i)
            doc_word_set = set([w[::-1] for w in words[::-1] if len(w) > 1])
            for w in doc_word_set:
                df_dict[w] += 1

        logger.info('not empty file {} - process no {}'.format(not_empty, pi))
        if df_dict:
            with open('output/' + self.mongo_db + '_df_' + str(pi), 'w') as f:
                json.dump([not_empty, df_dict], f, ensure_ascii=False)

    def count_df(self):
        ngram = self.mongo.con[self.mongo_db + '_' + 'newWord'].find({}, {'ngram': 1, '_id': 0})
        ngram = [ngram['ngram'] for ngram in ngram]
        logger.info('ngram num {}'.format(len(ngram)))
        if not ngram:
            return {}, 0

        ac_tree = build_ac_tree(ngram)

        q_gns = Manager().Queue(self.n_process * 5)
        signal = Manager().dict({'no_more_gns': False, 'n_gns': 0})
        pool = Pool(self.n_process)

        pool.apply_async(get_gns, args=(self.mongo, self.mongo_db, q_gns, signal, 'df'), error_callback=error_cb)

        for pi in range(self.n_process - 1):
            pool.apply_async(self.count_df_, args=(pi, q_gns, signal, ac_tree), error_callback=error_cb)

        pool.close()
        pool.join()

        return self.read_df()

    def read_df(self):
        dfs = defaultdict(int)
        not_empty = 0
        for file in os.listdir('output'):
            if self.mongo_db + '_df_' in file:
                with open('output/' + file, 'r', encoding='utf-8') as f:
                    ne, data = json.load(f)
                not_empty += ne
                for w, df in data.items():
                    dfs[w] += df
        logger.info('not empty file {} - df length {}'.format(not_empty, len(dfs)))
        return dfs, not_empty

    def count_idf(self):
        logger.info('idf counting start')
        st = time.time()

        dfs, not_empty = self.count_df()

        items = []
        avg_idf = 0
        for w, df in dfs.items():
            idf = math.log((not_empty + 1)/(df + 1)) + 1
            avg_idf += idf
            item = {
                'ngram': w,
                'idf': idf
            }
            items.append(item)
        if len(items):
            avg_idf /= len(items)
            items.append({'ngram': 'avg', 'idf': avg_idf})

        if items:
            self.mongo.con[self.mongo_db + '_' + 'wordIDF'].insert_many(items)

        logger.info('idf counting - cost time {}'.format(time.time() - st))

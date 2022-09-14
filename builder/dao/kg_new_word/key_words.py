# !/usr/bin/env python
# -*- coding:utf-8 -*-
from third_party_service.anyshare.token import asToken
from .otl_dao_non_async import get_as_file
import queue
import logging
import time
from collections import Counter
from multiprocessing import Manager, Pool
from .data_util import error_cb, get_gns, build_ac_tree


logging.basicConfig(level=logging.INFO, format='%(levelname)s %(asctime)s %(filename)s:%(lineno)d %(message)s')
logger = logging.getLogger(__name__)


class KWGenerator:
    def __init__(self, as_cfg, mysql_cfg, mongo, mongo_db, conf):
        self.mongo = mongo
        self.mongo_db = mongo_db
        self.mysql_cfg = mysql_cfg
        self.as_cfg = as_cfg

        self.n_process = conf.getint('kw', 'n_process')
        self.n_top = conf.getint('kw', 'n_top')
        logger.info('n process {} - n top {}'.format(self.n_process, self.n_top))

    # 将gns对应的label点和label2document边写入mongodb
    def insert_kw_to_mongo(self, key_words_list, doc_info_list):
        items_list = []
        for i, key_words in enumerate(key_words_list):
            gns, name = doc_info_list[i]
            tot_weight = sum([w for _, w in key_words])
            for word, weight in key_words:
                item = {
                    's': word,
                    'p': 'label2document',
                    'o': name,
                    's_pro': {'name': word, 'adlabel_kcid': word, 'type_nw': 'true'},
                    'p_pro': {'name': 'label2document', 'weight': str(weight/tot_weight)},
                    'o_pro': {'gns': gns}
                }
                items_list.append(item)

        if items_list:
            self.mongo.con[self.mongo_db + '_' + 'label2document'].insert_many(items_list)
    
    # 基于tf-idf得到文档的label，对应边和点写入mongodb
    def gen_key_words_(self, q_gns, signal, ac_tree, words_idf, n_top):
        print('开始获取AS token', __file__, 'gen_key_words_')
        ret_code, access_token = asToken.get_token(self.as_cfg['ds_auth'])
        key_words_list = []
        doc_info_list = []
        while True:
            try:
                gns, name = q_gns.get(timeout=5)
                gns_last_id = gns.split('/')[-1]
            except queue.Empty as _:
                if signal['no_more_gns']:
                    logger.info('queue is already empty, no more gns.')
                else:
                    logger.info('something wrong happened!')
                break
            text = get_as_file(self.as_cfg, gns_last_id, access_token)
            if not text:
                continue
            # word_list = list()
            # for _, (_, phrase) in ac_tree.iter(text):
            #     word_list.append(phrase)

            words = ['']
            for i in text[::-1]:
                if ac_tree.match(words[-1] + i):
                    words[-1] += i
                else:
                    words.append(i)
            word_list = [w[::-1] for w in words[::-1] if len(w) > 1]

            words_tf = Counter(word_list)
            words_tfidf = {}
            for k, v in words_tf.items():
                if k in words_idf:
                    words_tfidf[k] = v * words_idf[k]
                else:
                    words_tfidf[k] = v * words_idf['avg']
            words_tfidf = sorted(words_tfidf.items(), key=lambda x: (x[1], x[0]), reverse=True)[:n_top]
            key_words_list.append(words_tfidf)
            doc_info_list.append((gns, name))

            if len(key_words_list) == 100000:
                self.insert_kw_to_mongo(key_words_list, doc_info_list)
                key_words_list, doc_info_list = [], []

        self.insert_kw_to_mongo(key_words_list, doc_info_list)

    def gen_key_words(self):
        logger.info('key words start')
        st = time.time()

        words_idf = self.mongo.con[self.mongo_db + '_' + 'wordIDF'].find({}, {'_id': 0})
        words_idf = {idf['ngram']: idf['idf'] for idf in words_idf}
        if not words_idf:
            return

        ac_tree = build_ac_tree(words_idf.keys())

        q_gns = Manager().Queue(self.n_process * 5)
        signal = Manager().dict({'no_more_gns': False})
        pool = Pool(self.n_process)

        pool.apply_async(get_gns, args=(self.mongo, self.mongo_db, q_gns, signal, 'key words', ('gns', 'name')),
                         error_callback=error_cb)

        for _ in range(self.n_process - 1):
            pool.apply_async(self.gen_key_words_, args=(q_gns, signal, ac_tree, words_idf, self.n_top),
                             error_callback=error_cb)

        pool.close()
        pool.join()
        logger.info('idf counting - cost time {}'.format(time.time() - st))

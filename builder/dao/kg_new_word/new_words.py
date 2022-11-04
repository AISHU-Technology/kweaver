# !/usr/bin/env python
# -*- coding:utf-8 -*-

import json
import math
import os
import sys
import re
from collections import defaultdict

from third_party_service.anyshare.token import asToken
from .filter import NewWordFilter
import jieba_fast
from .otl_dao_non_async import get_as_file
import queue
import logging
import time
from multiprocessing import Manager, Pool
from .data_util import error_cb, get_gns

logging.basicConfig(level=logging.INFO, format='%(levelname)s %(asctime)s %(filename)s:%(lineno)d %(message)s')
logger = logging.getLogger(__name__)
jieba_fast.setLogLevel(logging.INFO)


class TrieNode:
    def __init__(self, freq=0, children_freq=0, parent=None):
        self.parent = parent
        self.freq = freq
        self.children = {}
        self.children_freq = children_freq

    def insert(self, char, n=1):
        self.children_freq += n
        if char not in self.children:
            self.children[char] = TrieNode(parent=self)
        self.children[char].freq += n
        return self.children[char]

    def fetch(self, char):
        return self.children[char]


class TrieTree:
    def __init__(self, ngram_size, split_char='|'):
        self.n_chunk = 0
        self._root = TrieNode()
        self.ngram_size = ngram_size
        self.split_char = split_char

    def insert(self, chunk, n):
        self.n_chunk += 1
        node = self._root
        for char in chunk.split(self.split_char):
            node = node.insert(char, n)
        if len(chunk) < self.ngram_size:
            node.insert("EOS", n)
        return node

    def fetch(self, chunk):
        node = self._root
        for char in chunk:
            node = node.fetch(char)
        return node

    def get_root(self):
        return self._root


class UnionNewWord:
    def __init__(self, mongo_db, mongo):
        self.mongo_db = mongo_db
        self.mongo = mongo
    
    # 从保存的文件中，读取new_word
    def read_new_word(self, is_back):
        fn = 'bw_nw' if is_back else 'fw_nw'
        new_words = {}
        for file in os.listdir('output'):
            if self.mongo_db in file and fn in file:
                with open('output/' + file, 'r', encoding='utf-8') as f:
                    data = f.read().split('\n')
                for d in data:
                    ngram, depth, freq, pmi, entropy = d.split('\t')
                    new_words[ngram] = (int(depth), int(freq), float(pmi), float(entropy))
        return new_words
    
    # 根据fw_nws和bw_nws计算new_words，并写入mongodb_newWord
    def union_new_word(self):
        fw_nws = self.read_new_word(False)
        bw_nws = self.read_new_word(True)

        new_words = []
        n_in_dict = 0
        n_one_gram = 1
        for ngram, (depth, freq, pmi, entropy) in fw_nws.items():
            if ngram in bw_nws:
                if depth == 1:

                    n_one_gram += 1
                    if pmi == 1:
                        n_in_dict += 1

                    item = {
                        'ngram': ngram,
                        'n': depth,
                        'freq': freq,
                        'entropy': min(entropy, bw_nws[ngram][3]),
                        'in_dict': pmi
                    }
                    new_words.append(item)
                else:
                    item = {
                        'ngram': ngram,
                        'n': depth,
                        'freq': freq,
                        'pmi': min(pmi, bw_nws[ngram][2]),
                        'entropy': min(entropy, bw_nws[ngram][3])
                    }
                    new_words.append(item)

        if new_words:
            logger.info('one grams in dict {} - new one grams num {} - n>1 grams num {}'.format(
                n_in_dict, n_one_gram - n_in_dict, len(new_words) - n_one_gram))
            self.mongo.con[self.mongo_db + '_' + 'newWord'].insert_many(new_words)


class Document:
    def __init__(self, as_cfg, mysql_cfg, mongo, mongo_db, conf):
        self.as_cfg = as_cfg
        self.mysql_cfg = mysql_cfg
        self.mongo = mongo
        self.mongo_db = mongo_db

        self.n_process = conf.getint('nw', 'n_process')
        self.ngram_size = conf.getint('nw', 'ngram_size')
        self.min_freq = conf.getint('nw', 'min_freq')
        self.min_pmi = conf.getfloat('nw', 'min_pmi')
        self.min_entropy = conf.getfloat('nw', 'min_entropy')
        self.max_trie = conf.getint('nw', 'max_trie')
        self.max_chunk = conf.getint('nw', 'max_chunk')
        self.stop_words_path = conf.get('nw', 'stop_words_path')
        # self.jieba_dict_path = '/root/py_env/new_word/lib/python3.6/site-packages/jieba_fast/dict.txt'

        logger.info('ngram size {}, min freq {}, min pmi {}, min entropy {}'.format(
            self.ngram_size, self.min_freq, self.min_pmi, self.min_entropy))
        logger.info('n process {}, max trie {}, max chunk {}'.format(self.n_process, self.max_trie, self.max_chunk))

        self.filter = NewWordFilter(self.stop_words_path)

        self.total = 0
        self.chunks = defaultdict(int)
        self.b_chunks = defaultdict(int)
        self.words = defaultdict(self.ini)
        self.file_no = 0

    @staticmethod
    def ini():
        return [0, 0, 0]

    def update_chunks(self, line):
        b_line = line[::-1]
        ln = len(line)
        self.total += ln
        for s_ind in range(ln):
            e_ind = s_ind + self.ngram_size
            self.words[line[s_ind]][0] += 1
            self.words[line[s_ind]][1] += len("".join(line[s_ind+1:e_ind]))
            self.words[b_line[s_ind]][2] += len("".join(b_line[s_ind+1:e_ind]))
            self.chunks["|".join(line[s_ind:e_ind])] += 1
            self.b_chunks["|".join(b_line[s_ind:e_ind])] += 1

    def write_chunks(self, pi):
        logger.info('chunks length {} - process no {} - file no {} - chunks size {}'.format(len(self.chunks), pi, self.file_no, sys.getsizeof(self.chunks)))
        if self.chunks:
            with open('output/' + self.mongo_db + '_fw_chunk_' + str(pi) + '_' + str(self.file_no), 'w',
                      encoding='utf-8') as f:
                json.dump(self.chunks, f, ensure_ascii=False)
            self.chunks = defaultdict(int)

            with open('output/' + self.mongo_db + '_bw_chunk_' + str(pi) + '_' + str(self.file_no), 'w',
                      encoding='utf-8') as f:
                json.dump(self.b_chunks, f, ensure_ascii=False)
            self.b_chunks = defaultdict(int)

            self.file_no += 1

    def write_words(self, pi):
        logger.info('words length {} - process no {}'.format(len(self.words), pi))
        if self.words:
            with open('output/' + self.mongo_db + '_words_' + str(pi), 'w', encoding='utf-8') as f:
                json.dump([self.total, self.words], f, ensure_ascii=False)

    def gen_chunks(self, pi, q_gns, signal):
        print('开始获取AS token', __file__, 'gen_chunks')
        ret_code, access_token = asToken.get_token(self.as_cfg['ds_auth'])
        not_empty = 0
        while True:
            try:
                gns = q_gns.get(timeout=5)[0]
                gns = gns.split('/')[-1]
            except queue.Empty as _:
                if signal['no_more_gns']:
                    logger.info('queue is already empty, no more gns.')
                else:
                    logger.info('error - something wrong happened!')
                break
            text = get_as_file(self.as_cfg, gns, access_token)
            if not text:
                continue

            not_empty += 1

            text = text.replace(u'\u3000', ' ').strip()
            text = re.sub(u'[^\u4e00-\u9fa50-9a-zA-Z ]+', '\n', text).split('\n')

            for line in text:
                line = line.strip()
                if not re.findall('[\u4e00-\u9fab]', line):
                    continue
                line = jieba_fast.lcut(line)
                self.update_chunks(line)

                if len(self.chunks) >= self.max_chunk:
                    self.write_chunks(pi)

        self.write_chunks(pi)
        self.write_words(pi)
        logger.info('fetched file num {}'.format(not_empty))

    def union_words(self):
        words = defaultdict(self.ini)
        total = 0
        for file in os.listdir('output'):
            if self.mongo_db in file and 'words' in file:
                with open('output/' + file, 'r', encoding='utf-8') as f:
                    tn, data = json.load(f)
                total += tn
                for w, (freq, zn, b_zn) in data.items():
                    words[w][0] += freq
                    words[w][1] += zn
                    words[w][2] += b_zn
        logger.info('words length {}, total freq {}'.format(len(words), total))
        return words, total

    def gen_margins(self, words, pos):
        margins, margin, tot = [], set(), 0
        for word, v in words.items():
            margin.add(word)
            tot += v[pos]
            if tot > self.max_trie:
                margins.append(margin)
                margin, tot = set(), 0
        margins.append(margin)
        logger.info('margins num {}'.format(len(margins)))
        return margins

    # 构建子树
    def build_sub_trie(self, pi, margin, is_back):
        trie = TrieTree(self.ngram_size)
        for file in os.listdir('output'):
            fn = 'bw_chunk' if is_back else 'fw_chunk'
            if self.mongo_db in file and fn in file:
                logger.info('debug start {}'.format(file))
                with open('output/' + file, 'r', encoding='utf-8') as f:
                    chunks = json.load(f)
                logger.info('debug end {}'.format(file))
                for i, (chunk, n) in enumerate(chunks.items()):
                    # if i % 1000 == 0:
                    #     logger.info('pi {} {} {}'.format(pi, i, len(chunks)))
                    first_word = chunk.split('|')[0]
                    if first_word in margin:
                        trie.insert(chunk, n)
        logger.info('trie chunks num {} - process no {}'.format(trie.n_chunk, pi))
        return trie
    
    # 遍历子树
    def traverse_sub_trie(self, words, trie, total, jieba_dict, is_back):
        def dfs(node, node_word, depth, parent_children_freq):
            if depth <= self.ngram_size - 1 and node.freq > self.min_freq:
                children_prob = []
                ngram_str = ''.join(ngram[::-1]) if is_back else ''.join(ngram)

                for word, child_node in node.children.items():
                    ngram.append(word)

                    children_prob.append(child_node.freq / node.children_freq)
                    dfs(child_node, word, depth+1, node.children_freq)
                    ngram.pop()

                if depth > 1 and children_prob:
                    prob_y_x = node.freq / parent_children_freq
                    prob_y = words[node_word][0] / total
                    pmi = math.log(prob_y_x / prob_y)
                    entropy = sum([-prob * math.log(prob) for prob in children_prob])
                    if entropy > self.min_entropy and pmi > self.min_pmi and self.filter.strict_filter(ngram_str):
                        new_words[ngram_str] = [depth, node.freq, pmi, entropy]

                if depth == 1 and children_prob:
                    entropy = sum([-prob * math.log(prob) for prob in children_prob])
                    if entropy > self.min_entropy and self.filter.one_word_filter(node_word):
                        if node_word in jieba_dict:
                            new_words[node_word] = [depth, node.freq, 1, entropy]
                        else:
                            new_words[node_word] = [depth, node.freq, 0, entropy]

        ngram = []
        new_words = {}
        root = trie.get_root()
        root.freq = total
        dfs(root, '', 0, total)
        return new_words

    def write_new_word(self, pi, new_words, is_back):
        logger.info('new words num {} - process no {}'.format(len(new_words), pi))
        if new_words:
            fn = '_bw_nw_' if is_back else '_fw_nw_'
            with open('output/' + self.mongo_db + fn + str(pi), 'w', encoding='utf-8') as f:
                f.write('\n'.join(['\t'.join([word, str(v[0]), str(v[1]), str(v[2]), str(v[3])])
                                   for word, v in new_words.items()]))

    def gen_new_word(self, pi, words, margin, total, jieba_dict, is_back):
        logger.info('build sub trie {}, margin length {}'.format(pi, len(margin)))
        trie = self.build_sub_trie(pi, margin, is_back)
        logger.info('traverse sub trie')
        new_words = self.traverse_sub_trie(words, trie, total, jieba_dict, is_back)
        self.write_new_word(pi, new_words, is_back)

    def load_jieba_dict(self):
        with open(self.jieba_dict_path, 'r', encoding='utf-8') as f:
            data = f.read().split('\n')

        jieba_dict = set()
        for d in data:
            jieba_dict.add(d.split(' ')[0])
        return jieba_dict

    def run(self):
        logger.info('new word discovery start')
        st = time.time()

        q_gns = Manager().Queue(self.n_process * 5)
        signal = Manager().dict({'no_more_gns': False, 'n_gns': 0})
        pool = Pool(self.n_process)

        pool.apply_async(get_gns, args=(self.mongo, self.mongo_db, q_gns, signal, 'new word'), error_callback=error_cb)

        for pi in range(self.n_process - 1):
            pool.apply_async(self.gen_chunks, args=(pi, q_gns, signal), error_callback=error_cb)

        pool.close()
        pool.join()

        words, total = self.union_words()
        # jieba_dict = self.load_jieba_dict()
        jieba_dict = set()

        pool = Pool(self.n_process-1)

        for pi, margin in enumerate(self.gen_margins(words, 1)):
            # self.gen_new_word(pi, words, margin, total, jieba_dict, False)
            pool.apply_async(self.gen_new_word, args=(pi+100, words, margin, total, jieba_dict, False), error_callback=error_cb)
        
        # pool.close()
        # pool.join()
        # pool = Pool(self.n_process-1)

        for pi, margin in enumerate(self.gen_margins(words, 2)):
            # self.gen_new_word(pi, words, margin, total, jieba_dict, True)
            pool.apply_async(self.gen_new_word, args=(pi, words, margin, total, jieba_dict, True), error_callback=error_cb)

        pool.close()
        pool.join()

        unw = UnionNewWord(self.mongo_db, self.mongo)
        unw.union_new_word()

        logger.info('new word discovery - cost time {}'.format(time.time() - st))

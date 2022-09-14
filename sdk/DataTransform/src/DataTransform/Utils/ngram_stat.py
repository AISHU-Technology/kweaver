# !/usr/bin/env python
# -*- coding:utf-8 -*-
import json
import logging
import re
import os
from collections import defaultdict
import time
import jieba_fast


jieba_fast.setLogLevel(logging.INFO)


class NgramStat:
    def __init__(self, line_iter, out_path, pro_no=1, ngram_size=4, max_chunk=40000000):
        """
        text_iter: texts iterator

        total_words_num: int, total words number of all input texts
        ngram_num: a dict, key is a word and value is the frequency of all ngram begin with the word
        ngram_length: a dict, key is a word and value is the total length of n-grams begin with the word
        back_ngram_length: a dict, key is a word and value is the total length of all back ngram begin with the word
        ngram_freq: a dict, key is a ngram and value is the frequency of the ngram
        back_ngram_freq: a dict, key is a back ngram and value is the frequency of the back ngram
        """
        self.line_iter = line_iter
        self.out_path = out_path
        self.ngram_size = ngram_size
        self.max_chunk = max_chunk

        self.words_num = 0
        self.ngram_num = defaultdict(int)
        self.ngram_length = defaultdict(int)
        self.back_ngram_length = defaultdict(int)
        self.ngram_freq = defaultdict(int)
        self.back_ngram_freq = defaultdict(int)
        self.pro_no = time.time()
        self.file_no = 1

    def update_ngram_counter(self, words):
        """
        update all ngram counters with words
        """
        # 把句子逆向
        back_words = words[::-1]
        self.words_num += len(words)
        for s_ind in range(len(words)):
            e_ind = s_ind + self.ngram_size
            # 统计the frequency of all ngram begin with the word
            self.ngram_num[words[s_ind]] += 1
            # 统计is the total length of n-grams begin with the word
            self.ngram_length[words[s_ind]] += len("".join(words[s_ind:e_ind]))
            # 倒叙 the total length of all back ngram begin with the word
            self.back_ngram_length[back_words[s_ind]] += len("".join(back_words[s_ind:e_ind]))
            # 统计ngram词频
            self.ngram_freq["|".join(words[s_ind:e_ind])] += 1
            # 统计ngram倒向词频
            self.back_ngram_freq["|".join(back_words[s_ind:e_ind])] += 1

    def write_ngram_frequency_to_disk(self):
        # save forward ngram to disk
        file = os.path.join(self.out_path, 'pro%s.%s.fore.json' % (str(self.pro_no), str(self.file_no)))
        with open(file, 'w', encoding='utf-8') as f:
            json.dump(self.ngram_freq, f, ensure_ascii=False)

        # save backward ngram to disk
        file = os.path.join(self.out_path, 'pro%s.%s.back.json' % (str(self.pro_no), str(self.file_no)))
        with open(file, 'w', encoding='utf-8') as f:
            json.dump(self.back_ngram_freq, f, ensure_ascii=False)

        self.file_no += 1

    def stat_ngram(self):
        # print("ngram stat")
        for line in self.line_iter:
            # 对句子分词
            words = jieba_fast.lcut(line)
            self.update_ngram_counter(words)
            # when ngram_freq is longer than max_chunk, then save it to disk
            # 如果字典树很多的话
            if len(self.ngram_freq) >= self.max_chunk:
                self.write_ngram_frequency_to_disk()
                # reinitialize
                self.ngram_freq = defaultdict(int)
                self.back_ngram_freq = defaultdict(int)

        # here, text_iter has been traversed completely
        self.write_ngram_frequency_to_disk()
        with open(os.path.join(self.out_path, 'pro%s.ngram.json' % str(self.pro_no)), 'w', encoding='utf-8') as f:
            json.dump([self.words_num, self.ngram_num, self.ngram_length, self.back_ngram_length], f,
                      ensure_ascii=False)

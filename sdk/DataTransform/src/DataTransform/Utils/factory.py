# !/usr/bin/env python
# -*- coding:utf-8 -*-
import json
import logging
import os
import re
from collections import Counter
from datasets import Dataset
import pandas as pd

def integrator(out_path):
    """
    integrate multiple ngram.txt results
    """
    # print("integrate")
    total_words_num = 0
    ngram_num = Counter()
    ngram_length = Counter()
    back_ngram_length = Counter()
    files = [file for file in os.listdir(out_path) if ".ngram.json" in file]
    for file in files:
        with open(os.path.join(out_path, file), 'r', encoding='utf-8') as f:
            sub_total_words_num, sub_ngram_num, sub_ngram_length, sub_back_ngram_length = json.load(f)
        total_words_num += sub_total_words_num
        ngram_num += sub_ngram_num
        ngram_length += sub_ngram_length
        back_ngram_length += sub_back_ngram_length
    return total_words_num, dict(ngram_num), dict(ngram_length), dict(back_ngram_length)


def trie_first_layers(ngram_length, max_trie=30000000):
    """
    getting pre tries' first layers in order to control the size of a pre trie

    max_trie: the max number of words a pre trie containing
    ngram_length: a dict, key is a word and value is the total length of n-grams begin with the word
    """
    # word sequence will be used as a pre trie first layer
    first_layer = set()
    first_layers = []
    total_length = 0
    for word, length in ngram_length.items():
        first_layer.add(word)
        total_length += length
        # exceed max_trie, stop adding
        if total_length > max_trie:
            first_layers.append(first_layer)
            # reinitialize
            first_layer, total_length = set(), 0
    first_layers.append(first_layer)
    return first_layers


def load_jieba_dict(jieba_dict_path):
    """
    Load word segmentation dictionary
    Args:
        jieba_dict_path: string, Path to jieba dict
    Returns: None
    """
    with open(jieba_dict_path, 'r', encoding='utf-8') as f:
        data = f.read().split('\n')

    jieba_dict = set()
    for d in data:
        jieba_dict.add(d.split(' ')[0])
    return jieba_dict


def preprocess(line):
    # unify spaces
    line = line.replace(u'\u3000', ' ')
    # keep only Chinese, English, digits and space, others replaced with "\n"
    line = re.sub(u'[^\u4e00-\u9fa50-9a-zA-Z ]+', '\n', line)
    # replace multiple continuous spaces with only one space and remove blanks at both end
    line = re.sub(" +", " ", line).strip()
    # if not contain Chinese, then set empty

    return [li for li in line.split("\n") if re.findall('[\u4e00-\u9fab]', li)]


def merger(out_path):
    # print("merge")
    # read forward new words files
    # files = [out_path + file for file in os.listdir(out_path) if ".nw.json" in file]
    files = [os.path.join(out_path,  file) for file in os.listdir(out_path) if ".nw.json" in file]
    new_words = {}
    for file in files:
        with open(file, "r", encoding='utf-8') as f:
            new_words.update(json.load(f))

    # read backward new words files
    files = [os.path.join(out_path, file) for file in os.listdir(out_path) if ".nwb.json" in file]
    back_new_words = {}
    for file in files:
        with open(file, "r", encoding='utf-8') as f:
            back_new_words.update(json.load(f))

    merged_new_words = []
    # merge new words
    for ngram, (depth, freq, pmi, entropy) in new_words.items():
        if ngram in back_new_words:
            item = {
                'ngram': ngram,
                'n': depth,
                'freq': freq,
                'pmi': pmi,
                'entropy': min(entropy, back_new_words[ngram][3])
            }
            merged_new_words.append(item)

    # print("new words number:", len(merged_new_words))
    df = pd.DataFrame(merged_new_words)
    dataset_newword = Dataset.from_pandas(df)

    return dataset_newword
    # with open(out_path + "new_words.json", "w", encoding="utf-8") as f:
    #     json.dump(merged_new_words, f, ensure_ascii=False)


class Progress:
    def __init__(self, iterator, period=1, steps=None, desc=None):
        """
        show progress
        Args:
            iterator: iterable object
            period: a period to print progress information
            steps: length of iterator
            desc: description to show
        """
        self.iterator = iterator
        self.period = period
        if hasattr(iterator, '__len__'):
            self.steps = len(iterator)
        else:
            self.steps = steps
        self.desc = desc

        if self.steps:
            self._format_ = u'%s/%s passed' %('%s', self.steps)
        else:
            self._format_ = u'%s passed'
        if self.desc:
            self._format_ = self.desc + ' - ' + self._format_

        self.logger = logging.getLogger()

    def __iter__(self):
        for i, j in enumerate(self.iterator):
            if (i + 1) % self.period == 0:
                self.logger.info(self._format_ % (i+1))
            yield j

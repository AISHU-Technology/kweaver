# !/usr/bin/env python
# -*- coding:utf-8 -*-

import json
import math
import os

from DataTransform.Utils.factory import load_jieba_dict
from DataTransform.Utils.filter import NewWordFilter
import jieba_fast
import logging
from DataTransform.Utils.pre_trie import PreTrie

logging.basicConfig(level=logging.INFO, format='%(levelname)s %(asctime)s %(filename)s:%(lineno)d %(message)s')
logger = logging.getLogger(__name__)
jieba_fast.setLogLevel(logging.INFO)


class NewWordsExtractor:
    """
    extract new words from a pre trie
    first build a pre trie, the traverse a pre trie to extract new words
    metrics used including pmi, entropy and frequency
    """
    def __init__(
            self,
            total_words_num,
            ngram_num,
            stop_words_path,
            jieba_dict_path,
            out_path,
            ngram_size=4,
            min_freq=5,
            min_pmi=4,
            min_entropy=0.63
    ):
        self.ngram_num = ngram_num
        self.total_words_num = total_words_num
        self.stop_words_path = stop_words_path
        self.jieba_dict = load_jieba_dict(jieba_dict_path)
        self.out_path = out_path

        self.ngram_size = ngram_size
        self.min_freq = min_freq
        self.min_pmi = min_pmi
        self.min_entropy = min_entropy

        self.filter = NewWordFilter(self.stop_words_path)

        self.back_ngram_files = [os.path.join(self.out_path, file) for file in os.listdir(self.out_path) if ".back.json" in file]
        self.ngram_files = [os.path.join(self.out_path, file) for file in os.listdir(self.out_path) if ".fore.json" in file]

    def build_pre_trie(self, files, first_layer):
        """
        input:
            files: ngram frequency files
            first_layer: words list of the first layer
        output: a pre trie
        """
        trie = PreTrie(self.ngram_size)
        for file in files:
            with open(file, 'r', encoding='utf-8') as f:
                ngram_freq = json.load(f)
            for ngram, freq in ngram_freq.items():
                if ngram.split('|')[0] in first_layer:
                    trie.insert(ngram, freq)
        return trie

    def traverse_sub_trie(self, trie, is_back):
        """
        applying deep first search method to traverse a pre trie, meanwhile computing metrics and
        judging conditions and obtaining new words
        input:
            ngram_num: a dict, key is a word and value is the frequency of all ngram begin with the word
            trie: a pre trie
            total_words_num: total words frequency
            is_back: whether the pre trie is based on back n-grams or not
        output: a dict, key is the new words and value is the metrics
        """
        def dfs(node, node_word, depth, parent_children_freq):
            if depth <= self.ngram_size - 1 and node.freq > self.min_freq:
                children_prob = []
                ngram_str = ''.join(ngram[::-1]) if is_back else ''.join(ngram)

                for word, child_node in node.children.items():
                    ngram.append(word)

                    children_prob.append(child_node.freq / node.children_freq)
                    dfs(child_node, word, depth + 1, node.children_freq)
                    ngram.pop()

                if depth > 1 and children_prob:
                    prob_y_x = node.freq / parent_children_freq
                    prob_y = self.ngram_num[node_word] / self.total_words_num
                    pmi = math.log(prob_y_x / prob_y)
                    entropy = sum([-prob * math.log(prob) for prob in children_prob])
                    if entropy > self.min_entropy and pmi > self.min_pmi and self.filter.strict_filter(ngram_str):
                        new_words[ngram_str] = [depth, node.freq, pmi, entropy]

                if depth == 1 and children_prob:
                    entropy = sum([-prob * math.log(prob) for prob in children_prob])
                    if entropy > self.min_entropy and self.filter.one_word_filter(node_word):
                        if node_word not in self.jieba_dict:
                            new_words[node_word] = [depth, node.freq, 0, entropy]

        ngram = []
        new_words = {}
        root = trie.get_root()
        root.freq = self.total_words_num
        dfs(root, '', 0, self.total_words_num)
        return new_words

    def extract_new_word(self, first_layer, is_back, pro_no=1):
        """
        extract new words and save to middle files
        input:
            ngram_num: a dict, key is a word and value is the frequency of all ngram begin with the word
            first_layer: words list of the first layer
            total_words_num: total words frequency
            is_back: whether the pre trie is based on back n-grams or not
        """
        # print("build trie %s, is_back = %s" % (str(pro_no), is_back))
        trie = self.build_pre_trie(self.back_ngram_files if is_back else self.ngram_files, first_layer)
        # print("traverse trie %s, is_back = %s" % (str(pro_no), is_back))
        new_words = self.traverse_sub_trie(trie, is_back)
        # return new_words
        file = "pro%s.nwb.json" % str(pro_no) if is_back else "pro%s.nw.json" % str(pro_no)
        with open(os.path.join(self.out_path, file), 'w', encoding='utf-8') as f:
            json.dump(new_words, f, ensure_ascii=False)
    def extract_new_word_proc(self, first_layer, is_back,column, pro_no=1):
        """
        extract new words and save to middle files
        input:
            ngram_num: a dict, key is a word and value is the frequency of all ngram begin with the word
            first_layer: words list of the first layer
            total_words_num: total words frequency
            is_back: whether the pre trie is based on back n-grams or not
        """
        # print("build trie %s, is_back = %s" % (str(pro_no), is_back))
        trie = self.build_pre_trie(self.back_ngram_files if is_back else self.ngram_files, first_layer[column])
        # print("traverse trie %s, is_back = %s" % (str(pro_no), is_back))
        new_words = self.traverse_sub_trie(trie, is_back)
        # return new_words
        file = "pro%s.nwb.json" % str(pro_no) if is_back else "pro%s.nw.json" % str(pro_no)
        with open(os.path.join(self.out_path, file), 'w', encoding='utf-8') as f:
            json.dump(new_words, f, ensure_ascii=False)

# !/usr/bin/env python
# -*- coding:utf-8 -*-
import os

from DataTransform.Utils.factory import integrator, trie_first_layers, preprocess, merger
from DataTransform.Utils.new_words import NewWordsExtractor
from DataTransform.Utils.ngram_stat import NgramStat
from datasets import Dataset
import pandas as pd
import os
current_path = os.path.dirname(os.path.abspath(__file__))


class New_Word(object):
    def __init__(self, out_path, stop_words_path=os.path.join(current_path, "stopwords"),
                 jieba_dict_path=os.path.join(current_path, "dict.txt"),
                 aug_column_name='content',
                 ngram_size=4,
                 min_freq=5,
                 min_pmi=4,
                 min_entropy=0.63):
        """
        Extract new words
        >>> new_word = New_Word(out_path="../result",
        ...                     stop_words_path="stopwords",
        ...                     jieba_dict_path="dict.txt",
        ...                     aug_column_name='content',
        ...                     ngram_size=4,
        ...                     min_freq=5,
        ...                     min_pmi=4,
        ...                     min_entropy=0.63)
        
            Args:
                out_path: string, Storage path of intermediate calculation results.
                stop_words_path: string, Path to the stop words.
                jieba_dict_path: string, Path to word segmentation dictionary.
                aug_column_name: string, Name of the field to be processed in the dataset. As data, aug_column_name='content'; local text file, aug_column_name='text'.
                ngram_size: int, The size of word ngram
                min_freq: int, Minimum word frequency threshold. Words with word frequency less than this value will be excluded.
                min_pmi: float, Minimum mutual information threshold. Words with mutual information less than this value will be excluded.
                min_entropy: float, Minimum entropy threshold. Words with entropy less than this value will be excluded.
        """
        self.out_path = out_path
        self.line_iter = []
        self.stop_words_path = stop_words_path
        self.jieba_dict_path = jieba_dict_path
        self.aug_column_name = aug_column_name
        self.ngram_size = ngram_size
        self.min_freq = min_freq
        self.min_pmi = min_pmi
        self.min_entropy = min_entropy
        # if out_path exists, then remove files under it, otherwise make directory
        if os.path.exists(out_path):
            for file in os.listdir(out_path):
                os.remove(os.path.join(out_path, file))
                # print("remove", out_path + file)
        else:
            os.mkdir(out_path)
    
    def pre_process_new_word(self, dataset, ):
        contents = dataset[self.aug_column_name]
        contents = [con for con in contents if con]
        res_dict = {}
        res = []
        for content in contents:
            res.append(1)
            for line in content.split("\n"):
                ls = preprocess(line)
                self.line_iter.extend(ls)
            # here can run in parallel, first split line_iter into multiple iterator, then feed to multiple NgramStat process
        NgramStat(self.line_iter, self.out_path).stat_ngram()
        res_dict["data"] = res
        return res_dict
    
    def process_new_word(self, out_path):
        total_words_num, ngram_num, ngram_length, back_ngram_length = integrator(out_path)
        
        first_layers = trie_first_layers(ngram_length)
        back_first_layers = trie_first_layers(back_ngram_length)
        nw_extractor = NewWordsExtractor(total_words_num, ngram_num, self.stop_words_path,
                                         self.jieba_dict_path, out_path,
                                         self.ngram_size, self.min_freq, self.min_pmi, self.min_entropy)
        # multiple first_layers can run in parallel
        ###### dataset.map()########
        df = pd.DataFrame({"first_layers": first_layers})
        dataset = Dataset.from_pandas(df)
        dataset.map(lambda x: nw_extractor.extract_new_word_proc(x, False, "first_layers"), num_proc=5)
        dfb = pd.DataFrame({"back_first_layers": back_first_layers})
        datasetb = Dataset.from_pandas(dfb)
        datasetb.map(lambda x: nw_extractor.extract_new_word_proc(x, True, "back_first_layers"), num_proc=5)
        ###### dataset.map()########
        
        ######$$$    pool  $$$######
        # pool = Pool(5)
        # for first_layer in first_layers:
        #     pool.apply_async(nw_extractor.extract_new_word, args=(first_layer,False,))
        # pool.close()
        # pool.join()
        # pool = Pool(5)
        # # multiple first_layers can run in parallel
        # for first_layer in back_first_layers:
        #     pool.apply_async(nw_extractor.extract_new_word, args=(first_layer, True,))
        # pool.close()
        # pool.join()
        ######$$$    pool  $$$######
        
        ###### normal #####
        # for first_layer in first_layers:
        #     nw_extractor.extract_new_word(first_layer, False)
        # for first_layer in back_first_layers:
        #     nw_extractor.extract_new_word(first_layer, True)
        ###### normal #####
        
        dataset = merger(out_path)
        return dataset

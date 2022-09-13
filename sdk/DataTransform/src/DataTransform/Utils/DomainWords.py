# -*- coding: utf-8 -*-
'''
@Author ：Jay.zhu
@Date ：2022/5/31 9:11
'''
import jieba_fast
import re
from DataTransform.DataflowDatasetDict import DataflowDatasetDict
from DataTransform.DatasetProcessor import DatasetProcessor
from DataTransform.ProcessFunctions.AggregateFunctions import new_word_extract
import pandas as pd
from datasets import Dataset, load_dataset
import os
current_path = os.path.dirname(os.path.abspath(__file__))


class DomainWords(object):
    def __init__(self, corpus,
                 rate=10,
                 min_freq=5,
                 min_pmi=4,
                 min_entropy=0.63,
                 topk=100,
                 stop_words_path=os.path.join(current_path, "stopwords"),
                 jieba_dict_path=os.path.join(current_path, "dict.txt"),
                 out_path="../result/",
                 aug_column_name="content",
                 word_list=None,
                 **kwargs):
        """
        Extract domain vocabulary from given data.
        The input corpus should consist of two parts: target domain data and non target domain data.
        Using non target domain data to exclude non target domain words in the target domain.
        This function is based on new word discovery and word Ngram.
        
        Args:
            corpus: datasetDict, consist of two parts: target domain data and non target domain data.
            rate: float or int, Word frequency ratio of words in target domain data and non target domain data.
            min_freq: int, Minimum word frequency threshold. Words with word frequency less than this value will be excluded.
            min_pmi: float, Minimum mutual information threshold. Words with mutual information less than this value will be excluded.
            min_entropy: float, Minimum entropy threshold. Words with entropy less than this value will be excluded.
            topk: int, Return topk words for sorting
            stop_words_path: string, Path to the stop words.
            jieba_dict_path: string, Path to word segmentation dictionary.
            out_path: string, Storage path of intermediate calculation results.
            aug_column_name: string, Name of the field to be processed in the dataset. As data, aug_column_name='content'; local text file, aug_column_name='text'.
            word_list: list, segmentation dictionary， Users can add their own word segmentation dictionary.
        """
        self.corpus = corpus
        self.min_freq = min_freq
        self.min_pmi = min_pmi
        self.min_entropy = min_entropy
        self.topk = topk
        self.rate = rate
        if stop_words_path:
            self.stopwords = [sw.replace('\n', '') for sw in open(stop_words_path, encoding='utf8').readlines()]
        else:
            self.stopwords = []
        self.jieba_dict_path = jieba_dict_path
        self.stop_words_path = stop_words_path
        self.out_path = out_path
        self.aug_column_name = aug_column_name
        if word_list:
            self.__add_dict(word_list)
        new_words = self.__get_new_words()
        self.__add_dict(new_words)
    
    def __get_new_words(self):
        """
        Get new words list
        Returns: list, new words list
        """
        domain = self.corpus.get("domain")
        if not domain:
            return []
        domain_dataset = []
        for raw in domain:
            if raw.get(self.aug_column_name):
                domain_dataset.append(raw)
        domain_dataset = pd.DataFrame(domain_dataset)
        domain_dataset = Dataset.from_pandas(domain_dataset)
        new_words_dataset = DataflowDatasetDict({"ALL": domain_dataset})
        dataset_newword = DatasetProcessor(process_name='chinese_word_from_newword',
                                           process_method="self_define_process", aug_func=new_word_extract,
                                           aug_column_name=self.aug_column_name,
                                           stop_words_path=self.stop_words_path, jieba_dict_path=self.jieba_dict_path,
                                           out_path=self.out_path, batched=True, batch_size=200,
                                           min_freq=self.min_freq,
                                           min_pmi=self.min_pmi,
                                           min_entropy=self.min_entropy)
        new_words_dataset.set_process_pipeline([dataset_newword])
        new_words_dataset.run_process_pipeline(using_beam=False)
        new_words = []
        for i, a_row in enumerate(new_words_dataset.get('NewWord', {})):
            new_words.append(a_row.get("ngram"))
        return new_words
    
    def __gen_ngrams(self, word_list, n):
        """
        Generate ngram based on word segmentation list
        Args:
            word_list: list
            n: ngram size
        Returns: list, word ngram list
        """
        res = []
        for i in range(len(word_list) - n + 1):
            res.append("".join(word_list[i: i + n]))
        return res
    
    def __get_ngrams(self, text):
        one_gram = [word.strip() for word in jieba_fast.lcut(text) if word.strip()]
        two_gram = self.__gen_ngrams(one_gram, 2)
        three_gram = self.__gen_ngrams(one_gram, 3)
        
        words = one_gram + two_gram + three_gram
        return words
    
    def __cut_words(self, text):
        """
        cut word
        Args:
            text: string, Text to be segmented
        Returns: list, list of words
        """
        text = re.sub(u'[^\u4e00-\u9fa50-9a-zA-Z-_]+', " ", text)
        words = self.__get_ngrams(text)
        return words
    
    def __add_dict(self, new_words):
        """
        Load words into jieba dictionary
        Args:
            new_words: list, words list
        Returns: None

        """
        for new_word in new_words:
            jieba_fast.add_word(new_word)
    
    def __frequency_standardization(self, word2count, words_total):
        """
        Word frequency standardization
        Args:
            word2count: dict, Word frequency dictionary
            words_total: int, Total text length
        Returns: dict, word frequency
        """
        for word, freq in word2count.items():
            word2count[word] = (1000000 / words_total) * freq
        return word2count
    
    def __word_frequency_count(self, texts):
        """
        word frequency count
        Args:
            texts: string, Pending text
        Returns: dict, word frequency
        """
        word2count = {}
        words_total = 0
        texts = [text for text in texts if text]
        for text in texts:
            words_total += len(re.sub(u'[^\u4e00-\u9fa50-9a-zA-Z_]+', "", text))
            words = self.__cut_words(text)
            for word in words:
                if len(word) > 1:
                    word2count[word] = word2count.get(word, 0) + 1
        
        word2count = {i: j for i, j in word2count.items() if j >= self.min_freq}
        word2count = self.__frequency_standardization(word2count, words_total)
        return word2count
    
    def __compare(self, word2count1, word2count2):
        """
        Target domain words filtering
        Args:
            word2count1: dict, Target domain word frequency statistical dictionary
            word2count2: dict, Non target domain word frequency statistical dictionary
        Returns: dict, domain words dict
        """
        words = {}
        for word, freq in word2count1.items():
            if self.__filtering(word):
                if word in word2count2:
                    score = freq / word2count1[word]
                else:
                    score = freq / 0.001
                if score >= self.rate:
                    words[word] = score
        sorted(words.items(), key=lambda x: x[1], reverse=True)
        return words

    def __filtering(self, word):
        """
        
        Args:
            word: string, candidate domain word
        Returns: True or Flase
        """
        adverb_words = ['和', '跟', '与', '既', '同', '及', '而', '况', '况且', '何况', '乃至', '则', '乃', '就', '而', '便', '于是', '然后',
                        '至于', '说到', '此外', '像', '如', '一般', '比方', '接着', '却', '虽然', '但是', '然而', '而', '偏偏', '只是', '不过', '至于', '致',
                        '不料', '岂知', '那么', '原来', '因为', '由于', '以便', '因此', '所以', '是故', '以致', '或', '或者', '还是', '亦', '非',
                        '即', '不是', '就是', '若', '如果', '若是', '假如', '只要', '除非', '假使', '倘若', '即使', '假若', '要是', '譬如', '像', '好比',
                        '如同', '似乎', '等于', '不如', '不及', '与其', '不如', '若', '则', '虽然', '可是', '固然', '尽管', '纵然', '即使', '不但', '不仅',
                        '而且', '何况', '并', '且', '不管', '只要', '除非', '以', '以便', '以免', '为了', '吗', '呢', '吧', '啊', '的', '比较', '相当']
        pattern = re.compile("^(" + "|".join(adverb_words) + ")" + "|^(-?\d+)(\.\d+)?$")
        if word in self.stopwords:
            return False
        if pattern.match(word) or word.isdigit():
            return False
        return True
    
    def extract(self):
        """
        Target domain vocabulary extraction
        Returns: dataset, domain vocabulary
        >>> data_files = {"domain": "../../sample_data/dev/dev_small.csv", "other": "../../sample_data/test/test_small.csv"}
        >>> dataset_dict = DataflowDatasetDict(load_dataset('csv', data_files=data_files))
        >>> dataset_domain_words = DomainWords(corpus=dataset_dict,
        ...                                    min_freq=1,
        ...                                    min_pmi=0,
        ...                                    min_entropy=0,
        ...                                    rate=10,
        ...                                    topk=10,
        ...                                    aug_column_name="query",
        ...                                    stop_words_path="stopwords",
        ...                                    jieba_dict_path="dict.txt",
        ...                                    out_path="../result/")
        >>> domain_words = dataset_domain_words.extract()
        >>> domain_words["word"]
        ['在线教育', '行业', '时代背景', '提升', '体验', '方案', '听云', '客户', '案例', '课堂']
        """
        if not (isinstance(self.topk, int) and self.topk >= 0):
            raise ValueError(('DataTransform.DomainWords',
                                      "Non compliant parameters: topk must be a non negative integer."))
        
        res = []
        domain_dataset = self.corpus.get("domain")
        other_dataset = self.corpus.get("other")
        if domain_dataset:
            domain_texts = [row.get(self.aug_column_name, "") for row in domain_dataset]
            domain_word2count = self.__word_frequency_count(domain_texts)
        else:
            domain_word2count = {}
        if other_dataset:
            other_texts = [row.get(self.aug_column_name, "") for row in other_dataset]
            other_word2count = self.__word_frequency_count(other_texts)
        else:
            other_word2count = {}
        words = self.__compare(domain_word2count, other_word2count)
        i = 0
        domain_words = []
        for word, score in words.items():
            if i < self.topk:
                item = {"word": word}
                domain_words.append(item)
                i += 1
            else:
                break
        df = pd.DataFrame(domain_words)
        dataset_domain_word = Dataset.from_pandas(df)
        return dataset_domain_word

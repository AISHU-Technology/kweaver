# -*- coding: utf-8 -*-
import math
import jieba_fast
import jieba_fast.posseg as posseg
import functools
import numpy as np

from third_party_service.anyshare.token import asToken
from .otl_dao_non_async import get_as_file
import time
import re
from utils.log_info import Logger
from multiprocessing import Pool
from functools import partial


class DataProcess(object):
    def __init__(self, mongo, mongo_db, user_words, as_cfg, mysql_cfg, conf, keyword_num=10, pos=True):
            """
            Args:
                mongo: mongodb数据库连接
                mongo_db: mongodb的document名称
                user_words：用户词表
                as_cfg：as配置，根据gns读取文档内容
                mysql_cfg：mysql配置
                conf：配置
                pos: 是否根据pos过滤关键词，默认为True
            """
            self.mongo = mongo
            self.mongo_db = mongo_db
            self.user_words = user_words
            self.as_cfg = as_cfg
            self.mysql_cfg = mysql_cfg
            stop_words_path = conf.get('nw', 'stop_words_path')
            self.stopwords = [sw.replace('\n', '') for sw in open(stop_words_path, encoding='utf8').readlines()]
            self.keyword_num = keyword_num
            self.pos = pos
            self.jieba_add_words()
    
    def get_new_words_from_mongo(self):
        """ 从mongodb中读取新词 """
        new_word_data = self.mongo.con[self.mongo_db + '_' + 'newWord'].find({}, {'ngram': 1, '_id': 0})
        new_words = [line['ngram'] for line in new_word_data]
        Logger.log_info('ngram num {}'.format(len(new_words)))
        return new_words

    # 从mongo中读取gns
    def get_gns_from_mongo(self):
        """ 从mongodb中读取gns，type=0的gns是文档， type=1的gns是目录"""
        gns_list, names = [], []
        try:
            gns_data = self.mongo.con[self.mongo_db + '_' + 'gnsInfo'].find({}, {'gns': 1, 'type': 1, 'name': 1, '_id': 0})
            for line in gns_data:
                if line["type"] == 0:
                    gns_list.append(line.get("gns"))
                    names.append(line.get("name"))
            Logger.log_info('gns total num {}'.format(len(gns_list)))
            return gns_list, names
        except Exception as e:
            Logger.log_error("get gns error: {}".format(repr(e)))

    def jieba_add_words(self):
        """ 添新词和用户词表添加到jieba分词的词表中"""
        new_words = self.get_new_words_from_mongo()
        words = new_words + self.user_words
        for word in words:
            jieba_fast.add_word(word)

    def seg_to_list(self, text):
        """ jieba 分词"""
        if not self.pos:
            # 不进行词性标注分词
            seg_list = jieba_fast.lcut(text)
        else:
            # 进行词性标注分词
            seg_list = posseg.lcut(text)
        return seg_list

    def word_filter(self, text):
        """ 根据POS参数选择是否词性过滤,不进行词性过滤，则将词性都标记为n，表示全部保留 """
        filter_list = []
        seg_list = self.seg_to_list(text)
        for seg in seg_list:
            if not self.pos:
                word = seg
                flag = 'n'
            else:
                word = seg.word
                flag = seg.flag
            if not flag.startswith('n'):
                continue
            # 过滤停用词表中的词，以及长度为<2的词
            if word not in self.stopwords and len(word) > 1:
                filter_list.append(word)
        return filter_list

    def get_text_by_gns(self, gns):
        """ 根据gns获取文档内容，并分词"""
        print('开始获取AS token', __file__, 'get_text_by_gns')
        ret_code, access_token = asToken.get_token(self.as_cfg['ds_auth'])
        gns_last_id = gns.split('/')[-1]
        text = get_as_file(self.as_cfg, gns_last_id, access_token)
        # punctuation = """[!"#$%&'*+,-./;<=>?@[\]^_`{|}~“”？，！【】、。；’‘……￥·]"""
        # text = re.sub(punctuation, " ", text)
        text = text.replace(u'\u3000', ' ').strip()
        text = re.sub(u'[^\u4e00-\u9fa50-9a-zA-Z ]+', "", text)
        p = re.compile("\[bookmark: [_A-Za-z0-9 ]*\]|[a-zA-Z0-9]")
        text = re.sub(p, "", text)
        text = text.replace("\n", "")
        words_list = self.word_filter(text)
        return words_list
    

# 多进程获取所有数据
def load_data(gns_list, get_text, process_num):
    """ 获取所有文档的文本内容 """
    try:
        # 初始化多进程
        pool1 = Pool(process_num)
        func = partial(get_text)
        result = pool1.map(func, gns_list)
        pool1.close()
        pool1.join()
        return result
    except Exception as e:
        Logger.log_error("load data multiprocess error: {}".format(repr(e)))
    

class KeyWords:
    def __init__(self, doc_list):
        """
        基于corpus计算keywords
        """
        self.doc_list = doc_list

    def train_idf(self):
        """ idf值统计 """
        idf_dic = {}
        # 总文档数
        total = len(self.doc_list)
        Logger.log_info('document total num {}'.format(total))
        # 每个词出现的文档数  集合是去重的
        for doc in self.doc_list:
            for word in set(doc):  # 这是一个集合 这个很关键  集合是去重的
                idf_dic[word] = idf_dic.get(word, 0.0) + 1.0
        # 按公式转换为idf值，分母加1进行平滑处理
        for k, v in idf_dic.items():
            idf_dic[k] = math.log(total / (v + 1.0) + 1.0)
        
        # 对于没有在字典中的词，默认其仅在一个文档出现，得到默认idf值
        default_idf = math.log(total / 1.0)
        return idf_dic, default_idf
    
    def tfidf_extract(self, tfidf_model, word_list):
        """ 计算TFIDF值 并输出前topk个关键字 """
        # print("计算TFIDF值 并输出前topk个关键字...")
        keywords = tfidf_model.get_tfidf(word_list)
        return keywords
    

def get_keywords(idf_dic, default_idf, doc_list, process_num, tfidf_extract, keyword_num):
    """ 多进程获取所有文档的关键词 """
    # 在所有数据上计算idf_dict、default_idf
    # tf-idf
    tfidf_model = TfIdf(idf_dic, default_idf, keyword_num)
    try:
        pool = Pool(process_num)
        func = partial(tfidf_extract, tfidf_model)
        result = pool.map(func, doc_list)
        pool.close()
        pool.join()
        return result
    except Exception as e:
        Logger.log_error("keywords multiprocess error: {}".format(repr(e)))


class DataSave(object):
    def __init__(self, key_words, gns_list, names, mongo, mongo_db):
        self.key_words = key_words
        self.gns_list = gns_list
        self.names = names
        self.mongo = mongo
        self.mongo_db = mongo_db

    def get_new_words_from_mongo(self):
        """ 从mongodb中读取新词 """
        new_word_data = self.mongo.con[self.mongo_db + '_' + 'newWord'].find({}, {'ngram': 1, '_id': 0})
        new_words = [line['ngram'] for line in new_word_data]
        Logger.log_info('ngram num {}'.format(len(new_words)))
        return new_words
    
    def word_tfidf_to_mongo(self, ):
        """ 关键词以及对应的tf-idf写入mongodb """
        items_list = []
        
        Logger.log_info("关键词开始写入mongodb")
        for gns, name, temp in zip(self.gns_list, self.names, self.key_words):
            for line in temp:
                item = {
                    "gns": gns,
                    "name": name,
                    "word": line[0],
                    "tf_idf": line[1],
                    "type": "keyword"
                }
                Logger.log_info("关键词： " + str(item))
                items_list.append(item)
        
        Logger.log_info("write to {}".format(self.mongo_db + '_' + 'KeyWords'))
        if items_list:
            self.mongo.con[self.mongo_db + '_' + 'KeyWords'].insert_many(items_list)
    
    def label2mongodb(self):
        """ 将关键词和新词作为label写入mongodb"""
        new_words = self.get_new_words_from_mongo()
        items_list = []
        for gns, name, temp in zip(self.gns_list, self.names, self.key_words):
            for line in temp:
                if line[0] not in new_words:
                    type_new = "keyword"
                    item = {
                        's': line[0],
                        'p': 'label2document',
                        'o': name,
                        's_pro': {'name': line[0], 'adlabel_kcid': line[0], 'type_nw': type_new},
                        'p_pro': {'name': 'label2document', 'weight': line[1]},
                        'o_pro': {'gns': gns}
                    }
                    Logger.log_info("label2document： " + str(item))
                    items_list.append(item)
        
        Logger.log_info("write to {}".format(self.mongo_db + '_' + 'label2document'))
        if items_list:
            self.mongo.con[self.mongo_db + '_' + 'label2document'].insert_many(items_list)


class TfIdf(object):
    def __init__(self, idf_dic, default_idf, keyword_num):
        """
        Args:
            idf_dic: 训练好的idf字典
            default_idf: 默认idf值
            keyword_num: 关键词数量
        """
        self.idf_dic, self.default_idf = idf_dic, default_idf
        self.keyword_num = keyword_num
    
    def get_tf_dic(self, word_list):
        """ 统计tf值 """
        tf_dic = {}
        for word in word_list:
            tf_dic[word] = tf_dic.get(word, 0.0) + 1.0
        
        tt_count = len(word_list)
        for k, v in tf_dic.items():
            tf_dic[k] = float(v) / tt_count
        return tf_dic
    
    def cmp(self, e1, e2):
        """ 排序函数，用于topK关键词的按值排序 """
        res = np.sign(e1[1] - e2[1])
        if res != 0:
            return res
        else:
            a = e1[0] + e2[0]
            b = e2[0] + e1[0]
            if a > b:
                return 1
            elif a == b:
                return 0
            else:
                return -1
    
    def get_tfidf(self, word_list):
        """ 按公式计算tf-idf """
        tf_dic = self.get_tf_dic(word_list)
        keywords = []
        tfidf_dic = {}
        for word in word_list:
            idf = self.idf_dic.get(word, self.default_idf)
            tf = tf_dic.get(word, 0)
            
            tfidf = tf * idf
            tfidf_dic[word] = tfidf

        # 根据tf-idf排序，去排名前keyword_num的词作为关键词
        for k, v in sorted(tfidf_dic.items(), key=functools.cmp_to_key(self.cmp), reverse=True)[:self.keyword_num]:
            keywords.append((k, v))
        return keywords

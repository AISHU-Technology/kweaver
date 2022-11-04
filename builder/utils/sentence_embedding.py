# -*- coding: utf-8 -*-
import numpy as np
from jieba import cut


np.random.seed(44)


class SentenceEncoder(object):
    def __init__(self, embed_model, max_sequence_length=512, embed_dim=300, pooling_method="mean"):
        """
        文本处理为一个向量表示
        Args:
            max_sequence_length: 句子最大长度,过长则截断
            embed_model: 向量模型, eg:与训练好的word2vec词向量
            embed_dim: 词向量维度
            stop_words: 停用词
            pooling_method: 句向量计算方式
        """
        self.max_sequence_length = max_sequence_length
        self.embed_model = embed_model
        stopwords_file = "./../unstructedmodel/Contractmodel/model/stopwords.txt"
        self.stop_words = [line.strip() for line in open(stopwords_file, 'r', encoding='utf-8').readlines()]
        self.embed_dim = embed_dim
        self.pooling_method = pooling_method
    
    def _cut_words(self, text):
        """
        句子文本分词,去除停用词,长度过长时截断处理
        Args:
            text: str, 待处理的句子文本
        Returns:
            list, 分词结果
        """
        text = text[:self.max_sequence_length]
        # [word for word in cut(text) if word not in self.stop_words][:self.max_sequence_length // 2]
        return [word for word in cut(text) if word not in self.stop_words]
    
    def _pooling(self, arr):
        """
        mean-pooling计算句子向量
        Args：
            arr: np.array，句子向量矩阵，[seq_length, embedding_dim]
            pooling_method: pooling方式， eg： mean、max
        Returns:
            np.array, 句子向量，(1， embedding_dim)
        """
        if self.pooling_method == "max":
            return np.max(arr, axis=0)
        return np.mean(arr, axis=0)
    
    def _get_text_embedding(self, text):
        """
        计算句向量,词的embedding的平均
        Args:
            text: str, 待处理句子文本
            pooling_method: pooling 方式
        Returns:
            np.array, 句子的表示向量
        """
        if not text.strip():
            return np.zeros(self.embed_dim)
        words = self._cut_words(text)
        text_embedding = np.zeros((len(words), self.embed_dim))
        for i, word in enumerate(words):
            if word in self.embed_model:
                text_embedding[i] = np.array(self.embed_model[word])
            else:
                text_embedding[i] = np.random.uniform(-1, 1, (1, self.embed_dim))
        return self._pooling(text_embedding)

    def get_document_embedding(self, features, weights):
        """
        文档向量计算,不同特征向量的加权平均
        Args:
            features: 文档向量计算特征,eg:文档名称、摘要、内容等等
            weights： 不同特征的权重
        Returns:
            np.array，文档表示向量
        """
        sum_weights = 0
        document_embedding = np.zeros(self.embed_dim)
        if not weights:
            weights = [1] * len(features)
        for feature, weight in zip(features, weights):
            feature_embed = self._get_text_embedding(feature)
            if feature_embed.any():
                document_embedding += feature_embed * weight
                sum_weights += weight
        if sum_weights == 0:
            return document_embedding
        return document_embedding / sum_weights
        






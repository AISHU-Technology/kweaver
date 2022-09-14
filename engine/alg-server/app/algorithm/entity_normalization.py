# -*- coding: utf-8 -*-
from typing import List

from ..constants.config import ENTITY_SYNONYM_FILE
from ..utils.mention import Mention


class EntityNormalization:
    """
    实体消歧
    """
    def __init__(self, synonym_path=None, vector_path=None):
        """
        导入近义词文件，和词向量模型路径

        Args:
            synonym_path: 近义词文件
            vector_path: 词向量模型路径
        """
        with open(synonym_path, 'r', encoding='utf-8')as f:
            lines = f.readlines()
        word_pairs = [line.strip().split('\t') for line in lines]
        self.synonym_dict = {}
        for i, word_pair in enumerate(word_pairs):
            if len(word_pair) != 2:
                raise ValueError('The synonym pair in line {} is not valid:{}'.format(i+1, word_pair))
            self.synonym_dict[word_pair[0]] = word_pair[1]
        self.vector_path = vector_path

    def dict_normalize(self, mentions) -> List[Mention]:
        """
        词典消歧

        >>> slots = [Mention('podpending', 'abnormal', 0, 10)]
        >>> en = EntityNormalization(ENTITY_SYNONYM_FILE)
        >>> res = en.dict_normalize(slots)
        >>> res[0].text
        'Pod 停滞在 Pending 状态'
        >>> res[0].type
        'abnormal'

        Args:
            mentions: 实体抽取结果 List[Mention]

        Returns:

        """
        for mention in mentions:
            if not mention.normalized and mention.text in self.synonym_dict.keys():
                new_text = self.synonym_dict[mention.text]
                mention.text = new_text
                mention.normalized = True
        return mentions

    def similar_normalize(self, mentions) -> List[Mention]:
        """
        相似度消歧

        Args:
            mentions: 实体抽取结果 List[Mention]

        Returns:

        """
        pass

    def normalize(self, mentions) -> List[Mention]:
        """
        综合dict_normalize,siimilar_normalize函数

        Args:
            mentions: 实体抽取结果 List[Mention]

        Returns: 实体消歧结果 List[Mention]

        """
        pass


ENTITY_LINKER = EntityNormalization(ENTITY_SYNONYM_FILE)
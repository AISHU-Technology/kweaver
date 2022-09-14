# -*- coding: utf-8 -*-
"""Entity mention extractor based on dict

Recognize the longest mention by Aho-Corasick automaton and Trie.

Typical usage example:

extractor = DictExtractor()
extractor.add_dict(dict_path)
extractor.extract(query)
"""
from typing import List

import ahocorasick

from ..constants.config import ENTITY_DICT_FILE
from ..utils.mention import Mention


class DictExtractor(object):
    """
    Extract entity mention from query by dict.
    """
    def __init__(self):
        self.actree = ahocorasick.Automaton()

    def add_dict(self, path):
        """
        Import entity recognize dict file.

        Args:
            path: Dict file path

        Returns:

        """
        if path is None:
            print('No dict file added.')
            return
        with open(path, "r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()
                if not line:
                    continue
                elems = line.split(' ')
                if len(elems) < 2:
                    raise ValueError("The line is not valid: {}".format(line))
                word, flag = elems[0], elems[-1]
                self.actree.add_word(word, (flag, word))
        self.actree.make_automaton()

    def extract(self, query) -> List[Mention]:
        """
        Extract entity by dict.

        >>> question = '软件升级流程，异常情况'
        >>> extractor = DictExtractor()
        >>> extractor.add_dict(ENTITY_DICT_FILE)
        >>> res = extractor.extract(question)
        >>> res[0].text
        '升级流程'
        >>> res[0].type
        'supgrade_type'
        >>> res[1].text
        '异常情况'

        Args:
            query: Question text

        Returns: Mention list

        """
        # i的形式为(index1,(index2,word))
        # index1: 提取后的结果在sentence中的末尾索引
        # index2: 提取后的结果在self.actree中的索引
        try:
            ner_results = [Mention(i[1][1], i[1][0], i[0] + 1 - len(i[1][1]), i[0] + 1)
                           for i in self.actree.iter_long(query)]
        except AttributeError as e:
            ner_results = []
        return ner_results

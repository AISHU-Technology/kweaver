# -*- coding: utf-8 -*-
from typing import Dict, Iterable, Union, Any, List, Optional

from ..algorithm.dict_extractor import DictExtractor
from ..algorithm.rule_extractor import RuleExtractor
from ..algorithm.lucene_extractor import LuceneExtractor
from ..constants.config import ENTITY_DICT_FILE, ENTITY_RULE_FILE
from ..utils.mention import Mention
from ..utils.util import validate


class Extractor:
    def __init__(self, rule_file=None, dict_file=None, model_file=None):
        """
        实体抽取初始化，导入各个配置文件

        Args:
            rule_file: 规则文件路径
            dict_file: 词典文件路径
            model_file: 模型文件路径
        """
        self.rule_extractor = RuleExtractor()
        self.rule_extractor.set_rule_file(rule_file)
        self.dict_extractor = DictExtractor()
        self.dict_extractor.add_dict(dict_file)
        self.lucene_extractor = LuceneExtractor()
        self.model_extractor = None

    def merge(self):
        """
        融合抽取结果

        Returns:

        """
        pass

    async def extract(self, query: str, **kwargs) -> List[Mention]:
        """
        综合规则词典模型的实体抽取

        >>> query = 'anyshare的升级流程'
        >>> extractor = Extractor(ENTITY_RULE_FILE, ENTITY_DICT_FILE)
        >>> res = extractor.extract(query)
        >>> res[0].text
        'anyshare'
        >>> res[1].text
        '升级流程'

        Args:
            query: 问句

        Returns: 实体列表

        """

        mentions_rule = self.rule_extractor.extract(query)
        mentions_dict = self.dict_extractor.extract(query)
        mentions_lucene = await self.lucene_extractor.extract(
            query, kwargs["fulltext_connector"], kwargs["kg_name"], kwargs["search_range_vertexes"])
        for i in range(len(mentions_dict)-1, -1, -1):
            if not validate(mentions_rule, mentions_dict[i]):
                mentions_dict.pop(i)
        for i in range(len(mentions_lucene)-1, -1, -1):
            if not validate(mentions_rule, mentions_lucene[i]):
                mentions_dict.pop(i)
        mentions = sorted(mentions_rule+mentions_dict+mentions_lucene, key=lambda x: x.start)
        return mentions


ENTITY_EXTRACTOR = Extractor(ENTITY_RULE_FILE, ENTITY_DICT_FILE)

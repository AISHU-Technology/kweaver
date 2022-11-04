# -*- coding: utf-8 -*-
import re

from app.constants.config import ENTITY_RULE_FILE
from app.utils.mention import Mention
from app.utils.util import validate


class Rule(object):
    """
    实体抽取规则
    """
    def __init__(self, text=None):
        """
        规则初始化与规则解析

        Args:
            text: 规则文本
        """
        self.rule_text = text
        self.reg = None
        self.entity_type = None
        self.parse_rule()

    def parse_rule(self):
        """
        Parse the entity extraction rule.

        Returns:

        """
        rule = self.rule_text
        split_res = rule.split('\t')
        if len(split_res) != 2:
            raise ValueError('The rule is not valid:{}'.format(rule))
        self.entity_type = split_res[1].strip()
        # 前面规则已匹配的位置，不要重复匹配
        self.reg = split_res[0]  # +r'(?![^\{]*\})'

    def fit(self, query):
        """
        Extract entity from query by this rule.

        >>> rule = Rule('AS[0-9][.]?[0-9][.]?[0-9][.]?[0-9]\\t软件版本')
        >>> print(rule.reg)
        AS[0-9][.]?[0-9][.]?[0-9][.]?[0-9]
        >>> print(rule.entity_type)
        软件版本
        >>> res = rule.fit('AS7.0.1.9的介绍')
        >>> print(res[0].text, res[0].type, res[0].start, res[0].end)
        AS7.0.1.9 软件版本 0 9
        >>> type(res[0])
        <class 'app.utils.mention.Mention'>

        Args:
            query: Question str

        Returns:

        """
        # Don't change query in this function, or the doctest will be wrong.If change, change in outside function.
        match_iter = list(re.finditer(self.reg, query))
        mentions = [Mention(ob.group(), self.entity_type, ob.span()[0], ob.span()[1]) for ob in match_iter]
        return mentions


class RuleExtractor(object):
    """
    Manage rules and extract entity mention from query by rule.
    """
    def __init__(self):
        """Initial rule extractor."""
        self.rule_file = None
        self.rules = []
        self.mentions = []

    def set_rule_file(self, path):
        """
        Load rule file and parse rules.

        Args:
            path: rule file path

        Returns:

        """
        if path is None:
            print('No rule file added.')
            return
        self.rule_file = path
        with open(path, 'r', encoding='utf-8')as f:
            lines = f.readlines()
        self.rules = [Rule(line) for line in lines]

    def extract(self, query):
        """
        Extract entities from query according to all the rules in rule file.

        >>> extractor = RuleExtractor()
        >>> extractor.set_rule_file(ENTITY_RULE_FILE)
        >>> res = extractor.extract('as7019和k8s')
        >>> print(res[0].text, res[0].type, res[0].start, res[0].end)
        as software 0 2
        >>> print(res[1].text, res[1].type, res[1].start, res[1].end)
        7019 software_version 2 6
        >>> print(res[2].text, res[2].type, res[2].start, res[2].end)
        k8s software 7 10

        Args:
            query: Question text.

        Returns:
        """
        self._reset_results()
        for rule in self.rules:
            matches = rule.fit(query)

            for i in range(len(matches)-1, -1, -1):
                if not validate(self.mentions, matches[i]):
                    matches.pop(i)

            self.mentions += matches

        self.mentions = sorted(self.mentions, key=lambda x: x.start)
        return self.mentions

    def _reset_results(self):
        self.mentions = []

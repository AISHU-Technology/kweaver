# -*- coding: utf-8 -*- 
# @Time : 2022/5/19 15:48 
# @Author : liqianlan
import re
import json
from typing import List

from app.constants.config import INTENT_RULE_FILE
from app.utils.intent import Intent
from app.utils.mention import Mention


# class IntentRule(object):
#     def __init__(self, rule_text, intent, space):
#         """
#         Initial with intent rule text.
#
#         Args:
#             rule_text: Rule text
#         """
#         self.reg = rule_text
#         self.intent = Intent(intent, space)
#
#         # self.rule_text = rule_text.strip()
#         # elems = self.rule_text.split("\t")
#         # if len(elems) != 2:
#         #     raise ValueError("The intent rule is not valid:{}".format(self.rule_text))
#         # self.reg = elems[0]
#         # intent_elems = elems[1].split('-')
#         # self.intent_type = intent_elems[0]
#         # self.search_space = None
#         # if len(intent_elems) == 2:
#         #     self.search_space = intent_elems[1]
#
#
#     def fit(self, text_to_match):
#         """
#         Match rule.
#
#         Args:
#             text_to_match: Processed text,contains entity information.
#
#         Returns: True, or False
#
#         """
#         if re.search(self.reg, text_to_match) is not None:
#             return True
#         else:
#             return False

class IntentRuleManager(object):
    def __init__(self):
        self.rules = []

    def load_rules(self, path):
        """
        Load rule file.

        Args:
            path: Intent rule file path

        Returns:

        """
        with open(path, 'rb')as f:
            intent_rule_json = json.load(f)
        self.rules = intent_rule_json

    def get_intent(self, query:str, slots:List[Mention]) -> List[Intent]:
        """
        Recognize intent of query by rules.Support multiple intents.

        >>> irm = IntentRuleManager()
        >>> irm.load_rules(INTENT_RULE_FILE)
        >>> query = 'Pod CrashLoopBackOff'
        >>> slots = [Mention('Pod CrashLoopBackOff','abnormal',1,10)]
        >>> res = irm.get_intent(query, slots)
        >>> res[0].intent
        '升级异常-分析类型、原因、处理方法(无软件名称、无异常情况名称）'
        >>> res[0].search_space
        '运维'

        Args:
            query: Question text.
            slots: Entities extracted from query.

        Returns: Intent list

        """
        intents = []
        categories = []
        text = generate_text_to_match(query, slots)
        for intent_dic in self.rules:
            intent = intent_dic['intent']
            category = intent_dic['category']
            rules = intent_dic['rules']
            for rule in rules:
                if re.search(rule, text) is not None and category not in categories:
                    intents.append(Intent(intent, category))
                    categories.append(category)
                    break
        return intents


def generate_text_to_match(query, slots):
    """
    Fill slot type into query.

    Args:
        query: Question text.
        slots: Entity match.

    Returns:

    """

    # query = query[:slot.start]+'{@'+slot.type_+'}'+query[slot.end:]

    return query


RULE_INTENT_RECOGNIZER = IntentRuleManager()
RULE_INTENT_RECOGNIZER.load_rules(INTENT_RULE_FILE)

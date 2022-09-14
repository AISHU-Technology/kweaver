# -*- coding: utf-8 -*- 
# @Time : 2022/5/20 13:22 
# @Author : liqianlan
from ..utils.intent import Intent
from .graph_search import ad_search


async def action_func1(graph_connector, search_space, input_entities):
    """
    调用sdk中的通用搜索，或resources下的search.py
    需要把query中抽取的实体关系等，填到查询逻辑里需要的条件里去
    查询逻辑执行完毕后的答案组织

    Args:
        graph_connector:
        search_space: 查询的图谱
        input_entities: 抽取出来的实体

    Returns: 搜索结果

    """
    return "just a try."


async def action_func2(graph_connector, search_space, input_entities):
    return "just a try."


class ActionManager:
    def __init__(self):
        """
        Manage the actions of intent.

        intent_action example:
        {
            'maintenance_graph': {
                '升级流程查询': func1,
                '命令查询': func2,
            },
            'concept_graph': {
                '概念查询': func3
            }
        }
        """
        self.intent_action = {}

    def add_action(self, intent_name, func):
        """
        把查询逻辑function和意图对应起来，保存为self.intent_action: dict

        Args:
            intent_name: Intent name.
            search_space: Which graph to search.
            func:

        Returns:

        """
        self.intent_action[intent_name] = func

    def process(self, graph_connector, intents, slots):
        """
        根据query识别的多个意图，进行多个意图的查询执行

        Args:
            graph_connector: 图谱连接器
            intents: Intent实例列表
            query: 问句
            slots: 实体识别和消歧结果

        Returns: Answer.

        """
        results = []
        for intent in intents:
            intent_name = intent.intent
            results.append(self.intent_action[intent_name](graph_connector, slots))

    def get_action(self, intent: Intent):
        """
        Get action of an intent.
        Args:
            intent: Intent list, contains intent name and search space.

        Returns: Action function.

        """
        if intent.intent not in self.intent_action:
            raise ValueError("The intent has not a related action:{}".format(intent.intent))

        return self.intent_action[intent.intent]

AM = ActionManager()
AM.add_action('语义搜索', ad_search.general_search)

# -*- coding: utf-8 -*-

from ..algorithm.entity_normalization import ENTITY_LINKER
from ..algorithm.extractor import ENTITY_EXTRACTOR
from ..algorithm.rule_intent import RULE_INTENT_RECOGNIZER
from ..constants.config import GENERAL_INTENT_NAME, GENERAL_INTENT_SPACE, UNRECOGNIZED_INTENT_SPACE, \
    UNRECOGNIZED_INTENT_NAME
from ..handlers.intent_related_action import AM
from ..utils.intent import Intent
from ..algorithm.rank import rank
from .graph_search import ad_search
import time
from ..schemas.response import *

from cognition.GraphSearchEngine import GraphSearchEngine
from typing import Iterable


class AnyDataSearchEngine(GraphSearchEngine):
    def __init__(self, graph_connector=None, fulltext_connector=None):
        super(AnyDataSearchEngine, self).__init__(graph_connector)
        self.fulltext_connector = fulltext_connector

    async def entity_mention_extractor(self, query, **kwargs) -> Iterable:
        """
        Extract entity mentions in query.

        Args:
            query: Question text.

        Returns: Mention list.

        """
        # 实体识别方法，获取query中实体文本集合。
        kwargs["fulltext_connector"] = self.fulltext_connector
        mentions = await ENTITY_EXTRACTOR.extract(query, **kwargs)
        return mentions

    async def intent_recognizer(self, query, graph_type, entities):
        """
        Recognize the intent of query,containing intent name and search graph.
        Args:
            query: Input query.
            graph_type:
            entities: Entities extarcted from query.

        Returns:

        """
        # TODO: 修改基类的输入
        # 意图识别方法，搜索意图识别，现在只有一个意图，也就是蔓延搜索子图entities_to_subgraph
        intents = RULE_INTENT_RECOGNIZER.get_intent(query, entities)
        # “其他”意图
        if len(intents) == 1 and intents[0].intent == GENERAL_INTENT_NAME and intents[0].search_space == GENERAL_INTENT_SPACE:
            intents.insert(0, Intent(UNRECOGNIZED_INTENT_NAME, UNRECOGNIZED_INTENT_SPACE))
        intent_actions = [AM.get_action(intent) for intent in intents]
        return intents, intent_actions

    def entity_link_function(self, entity_metions) -> Iterable:
        """
        Link the mention to real graph entity.

        Args:
            entity_metions: Entities extracted from query.

        Returns:

        """
        # 实体链接方法，将文本中提取到的实体文本集合链接到图中的实体,返回实体信息集合。将实体mention连接到对应的图谱的实体上
        entities = ENTITY_LINKER.dict_normalize(entity_metions)
        return entities

    async def search(self, query: str, **kwargs):
        entity_metions = await self.entity_mention_extractor(query, **kwargs)
        entities = self.entity_link_function(entity_metions)
        kwargs.update({'input_entities': entities})
        if self.graph_connector is None:
            raise ValueError('Graph not ready')
        intents, intent_actions = await self.intent_recognizer(query, 'normal_graph', entities)
        search_results = {}
        all_rids = set()
        for intent, intent_action in zip(intents, intent_actions):
            res = await intent_action(self.graph_connector, kwargs["kg_name"], **kwargs)
            if not res:
                return []
            for target_id, path in res.items():
                # all_rids，路径上所有的点
                all_rids = all_rids.union(path["vertexes"])
                if target_id not in search_results:
                    search_results[target_id] = path
                # 同一target，路径的信息累加
                else:
                    search_results[target_id]["vertexes"] = search_results[target_id]["vertexes"].union(
                        path["vertexes"])
                    search_results[target_id]["edges"] = search_results[target_id]["edges"].union(path["edges"])
                    search_results[target_id]["mata_data"] = search_results[target_id]["mata_data"].extend(
                        path["meta_data"])

        # 获取所有点的属性信息
        vid_to_name_label = await ad_search.search_vid_1(self.graph_connector, kwargs["kg_name"], list(all_rids))
        # 获取结果点的属性信息
        vid_to_properties = await ad_search.search_vid_2(self.graph_connector, kwargs["kg_name"], list(search_results.keys()))

        # 封装
        for target_id, path in search_results.items():
            score = rank(path["meta_data"])
            vertices = [Vertex(id=vid, tag=vid_to_name_label[vid][1], name=vid_to_name_label[vid][0], color=kwargs["tag_to_color"][vid_to_name_label[vid][1]]) for vid in path["vertexes"]]
            edges = [Edge(from_id=src_id, to_id=end_id, tag=tag, name=tag, color=kwargs["tag_to_color"][tag]) for
                     src_id, end_id, tag in path["edges"]]
            search_results[target_id] = TargetVertex(
                tag=vid_to_name_label[target_id][1],
                id=target_id,
                kg_id=kwargs["kg_id"],
                name=vid_to_name_label[target_id][0],
                color=kwargs["tag_to_color"][vid_to_name_label[target_id][1]],
                score=score,
                analysis=kwargs["tag_to_analysis"][vid_to_name_label[target_id][1]],
                properties=vid_to_properties[target_id],
                search_path=Path(vertexes=vertices, edges=edges)
            )

        return search_results.values()

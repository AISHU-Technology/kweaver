# !/usr/bin/env python
# -*- coding:utf-8 -*-
import asyncio
from ..utils.mention import Mention
from cognition.Connector import OpenSearchConnector, OrientDBConnector


class BaseLuceneExtractor:
    def __init__(self, query, connector, kg_name, search_range):
        self.query = query
        self.connector = connector
        self.kg_name = kg_name
        self.search_range = search_range

    async def _fulltext_indexes(self):
        raise NotImplementedError

    async def _lucene_search(self, fulltext_indexes):
        raise NotImplementedError

    async def _parser(self, data):
        raise NotImplementedError

    async def extract(self):
        fulltext_indexes = await self._fulltext_indexes()
        results = await self._lucene_search(fulltext_indexes)
        results = await self._parser(results)
        return results


class NebulaLuceneExtractor(BaseLuceneExtractor):
    async def _fulltext_indexes(self):
        url = "{space}_*".format(space=self.kg_name)
        indexes = await self.connector.execute(url)
        fulltext_indexes = {}
        for key, value in indexes.items():
            fulltext_indexes[key] = []
            for field, field_type in value["mappings"]["properties"].items():
                if field_type["type"] == "text":
                    fulltext_indexes[key].append(field)
        return fulltext_indexes

    async def _lucene_search(self, fulltext_indexes):
        search_range_vertexes = [self.kg_name + "_" + v.lower() for v in self.search_range]
        tasks = []
        for index, fields in fulltext_indexes.items():
            if index not in search_range_vertexes:
                continue
            url = "{index}/_search".format(index=index)
            if self.query:
                body = {
                    "query": {
                        "multi_match": {
                            "query": self.query,
                            "fields": fields,
                            "operator": "or"
                        }
                    },
                    "from": 0,
                    "size": 100
                }
            else:
                body = {
                    "query": {
                        "match_all": {}
                    },
                    "from": 0,
                    "size": 5
                }
            tasks.append(asyncio.create_task(self.connector.execute(url, body)))

        res_list = []
        for task in tasks:
            res_list.append(await task)

        return res_list

    async def _parser(self, data):
        mentions = []
        for d in data:
            for hit in d["hits"]["hits"]:
                if "name" not in hit["_source"]:
                    continue
                mentions.append(Mention(
                    text=hit["_source"]["name"],
                    type_=hit["_index"],
                    id=hit["_id"],
                    start=self.query.find(hit["_source"]["name"]),
                    end=self.query.find(hit["_source"]["name"]) + len(hit["_source"]["name"]) - 1,
                    normalized=True,
                    score=hit["_score"]
                ))
        return mentions


class OrientDBLuceneExtractor(BaseLuceneExtractor):
    async def _fulltext_indexes(self):
        return {}

    async def _lucene_search(self, fulltext_indexes):
        return []

    async def _parser(self, data):
        return []


class LuceneExtractor:
    @staticmethod
    async def extract(query, connector, kg_name, search_range=None):
        if not search_range:
            return []

        if isinstance(connector, OpenSearchConnector):
            lucene_extractor = NebulaLuceneExtractor(query, connector, kg_name, search_range)
        if isinstance(connector, OrientDBConnector):
            lucene_extractor = OrientDBLuceneExtractor(query, connector, kg_name, search_range)
        return await lucene_extractor.extract()

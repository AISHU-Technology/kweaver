# !/usr/bin/env python
# -*- coding:utf-8 -*-
from pydantic import BaseModel
from typing import List, Dict, Optional, Set, Union


class Vertex(BaseModel):
    id: str
    tag: Optional[str] = ''
    name: Optional[str] = ''
    color: Optional[str] = ''

    # def __hash__(self):
    #     return hash((self.id, ))


class Edge(BaseModel):
    from_id: str
    to_id: str
    tag: Optional[str] = ''
    name: Optional[str] = ''
    color: Optional[str] = ''

    # def __hash__(self):
    #     return hash((self.from_id, self.to_id, self.tag))


class PathMetaData(BaseModel):
    from_entity_score: Optional[float]
    depth: Optional[int]
    weight: Optional[float] = 1.0


class Path(BaseModel):
    vertexes: Optional[List[Vertex]] = []
    edges: Optional[List[Edge]] = []
    meta_data: Optional[List[PathMetaData]] = []


class TargetVertex(BaseModel):
    tag: str
    id: str
    kg_id: Optional[int] = -1
    name: Optional[str] = ''
    color: Optional[str] = ''
    score: Optional[float] = 0.0
    analysis: Optional[bool] = False
    properties: Optional[Dict] = {}
    search_path: Optional[Path] = None


class SearchResult(BaseModel):
    search: List[TargetVertex]


class Response(BaseModel):
    time: float
    number: int
    res: SearchResult


# For AnyShare
class ASTargetVertex(BaseModel):
    labels: str
    gns: str
    kg_id: Optional[int] = -1
    explain: Optional[str] = ""
    score: Optional[float] = 0.0


class ASSearchResult(BaseModel):
    search: List[ASTargetVertex]


class ASResponse(BaseModel):
    time: float
    number: int
    res: ASSearchResult

# !/usr/bin/env python
# -*- coding:utf-8 -*-
from pydantic import BaseModel
from typing import List, Optional


class Vertexes(BaseModel):
    open: List[str]
    close: Optional[List[str]] = None


class Edges(BaseModel):
    open: List[str]
    close: Optional[List[str]] = None


class SearchRange(BaseModel):
    vertexes: Vertexes
    edges: Edges


class DisplayRange(BaseModel):
    vertexes: Vertexes


class ConfContent(BaseModel):
    max_depth: int
    search_range: SearchRange
    display_range: DisplayRange


class RequestModel(BaseModel):
    kg_ids: str
    query: str
    page: int
    size: int
    conf_content: ConfContent

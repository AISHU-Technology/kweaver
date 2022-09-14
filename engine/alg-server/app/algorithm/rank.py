# !/usr/bin/env python
# -*- coding:utf-8 -*-
import numpy as np


def rank(meta_data):
    score = 0.0
    for from_entity_score, depth in meta_data:
        # score += from_entity_score * 1.0 / (np.log2(depth + 1.0) + 1.0)
        score += from_entity_score * 1.0 / (5**depth)
    return round(score, 1)

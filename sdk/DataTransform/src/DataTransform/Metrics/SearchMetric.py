# !/usr/bin/env python
# -*- coding:utf-8 -*-
import datasets
from collections import OrderedDict
import numpy as np


SEARCH_METRIC_ID = "search_metric"

SEARCH_METRIC_CITATION = """
title = 搜索效果评估指标
"""

SEARCH_METRIC_DESCRIPTION = """
SearchMetric用于评估搜索效果，作为‘搜的到、搜的准’的度量方法。
"""

SEARCH_METRIC_KWARGS_DESCRIPTION = """
Args:
    predictions: 元素为整型的序列，代表目标文档在搜索结果列表中的排序
    references：实际计算并不需要，但仍需设置，长度和predictions相等，所有元素为None
    top_n_list：top_n列表，可选，默认[1, 3, 5, 10]
    top_n_weights：top_n_list中每一项对应的权重，可选，默认[0.4, 0.3, 0.2, 0.1]
Returns:
    1. 每一项top_n文档占比/得分
    2. 搜索效果的加权/最终得分
Examples:
    search_metric = load_metric("/tmp/graphengine-dataflow/Metrics/SearchMetric.py")
    predictions = [1, 8, 20, 4, 7, 23, 34, 1, 6, 3]
    references = [None] * len(predictions)
    result = search_metric.compute(predictions=predictions, references=references)
"""

SEARCH_METRIC_FEATURES = datasets.Features({
    'predictions': datasets.Value('int32'),
    'references': datasets.Value('null')
})


def top_n_proportion(predictions, top_n):
    return ((np.array(predictions) < top_n) & (np.array(predictions) >= 0)).mean()


@datasets.utils.file_utils.add_start_docstrings(SEARCH_METRIC_DESCRIPTION, SEARCH_METRIC_KWARGS_DESCRIPTION)
class SearchMetric(datasets.Metric):
    def _info(self):
        return datasets.MetricInfo(
            description=SEARCH_METRIC_DESCRIPTION,
            citation=SEARCH_METRIC_CITATION,
            inputs_description=SEARCH_METRIC_KWARGS_DESCRIPTION,
            features=SEARCH_METRIC_FEATURES
        )

    def _compute(self, *, predictions=None, references=None, **kwargs):
        if "top_n_list" not in kwargs:
            kwargs["top_n_list"] = [1, 3, 5, 10]

        if "top_n_weights" not in kwargs:
            kwargs["top_n_weights"] = [0.4, 0.3, 0.2, 0.1]

        if len(kwargs["top_n_list"]) != len(kwargs["top_n_weights"]):
            raise Exception("top_n_list and top_n_weights must be same length!")

        res = OrderedDict()
        res["weighted_score"] = 0
        for top_n, weight in zip(kwargs["top_n_list"], kwargs["top_n_weights"]):
            res["top_%s_proportion" % top_n] = top_n_proportion(predictions, top_n)
            res["weighted_score"] += weight * res["top_%s_proportion" % top_n]

        return res

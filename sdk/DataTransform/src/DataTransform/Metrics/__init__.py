# !/usr/bin/env python
# -*- coding:utf-8 -*-
from huggingface_hub.hf_api import MetricInfo
from .SearchMetric import SEARCH_METRIC_ID, SEARCH_METRIC_CITATION, SEARCH_METRIC_DESCRIPTION


SearchMetricInfo = MetricInfo(**{
    "id": SEARCH_METRIC_ID,
    "citation": SEARCH_METRIC_CITATION,
    "description": SEARCH_METRIC_DESCRIPTION
})


CustomMetricsInfo = [SearchMetricInfo]

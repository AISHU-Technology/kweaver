# !/usr/bin/env python
# -*- coding:utf-8 -*-
from datasets import list_metrics
from DataTransform.Metrics import CustomMetricsInfo


def view_metrics(with_community_metrics=True, with_details=False):
    metrics = list_metrics(with_community_metrics, with_details)
    custom_metrics = CustomMetricsInfo
    if not with_details:
        custom_metrics = [metric.id for metric in CustomMetricsInfo]
    return {
        "Metrics": metrics,
        "custom_metrics": custom_metrics
    }

# !/usr/bin/env python
# -*- coding:utf-8 -*-
from scipy.stats import pearsonr, spearmanr
from sklearn.metrics import f1_score


def simple_accuracy(preds, labels):
    return float((preds == labels).mean())


def acc_and_f1(preds, labels):
    acc = simple_accuracy(preds, labels)
    f1 = float(f1_score(y_true=labels, y_pred=preds))
    return {
        "accuracy": acc,
        "f1": f1,
    }


def pearson_and_spearman(preds, labels):
    pearson_corr = float(pearsonr(preds, labels)[0])
    spearman_corr = float(spearmanr(preds, labels)[0])
    return {
        "pearson": pearson_corr,
        "spearmanr": spearman_corr,
    }


def acc_topk(preds, labels, topk):
    """
    Calculate the accuracy of the first topk prediction results. Acc@topk
    Args:
        preds: list, prediction results
        labels: list, correct results
        topk: int, Top k prediction results
    Returns: float, the accuracy of the first topk prediction results, Acc@topk
    
    >>> preds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    >>> labels = ['a', 'b', 'f', 'i', 'g']
    >>> topk = 10
    >>> acc_topk(preds, labels, topk)
    0.5
    """
    preds = set(preds[: topk])
    correct = 0
    for pred in preds:
        if pred in labels:
            correct += 1
    return float(correct / len(preds))


def recall(preds, labels):
    """
    Calculate recall rate
    Args:
        preds: list, prediction results
        labels: list, correct results
    Returns: float, recall rate
    
    >>> preds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
    >>> labels = ['a', 'b', 'f', 'i', 'g']
    >>> recall(preds, labels)
    1.0
    """
    correct = 0
    for pred in set(preds):
        if pred in labels:
            correct += 1
    return float(correct / len(labels))

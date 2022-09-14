# -*- coding: utf-8 -*-
import json
from contracrt_extract.title_classify.process import title_map
from contracrt_extract.title_classify.processing import DataProcess
import joblib
import re
import os
from contracrt_extract.title_classify.classify_model import rule_filter


def classify(data, model, stopwords_file):
    stopwords = [line.strip() for line in open(stopwords_file, 'r', encoding='utf-8').readlines()]
    # model_path = "./model/data/model.pkl"

    # 长度超过20的默认为是内容
    if len(data) > 50000:
        titles = process_len_text(data)
        # print("分类的标题：", titles)
        res = title_map(data, data, titles)
        # print("title_mapping: ", res)
        return res
    else:
        data_process = DataProcess(data, stopwords)
        process_sentence_list, source_sentence_list = data_process.pre_data()
        pred_labels = model.predict(process_sentence_list)
        titles = rule_filter(process_sentence_list, pred_labels.tolist())

        # print("规则筛选后分类的标题：", titles)
        res = title_map(data, source_sentence_list, titles)
        # print("title_mapping: ", res.keys())
        return res


def process_len_text(content):
    res = []
    pattern1 = re.compile("^第[一二三四五六七八九十0-9]{1,2}[章节篇条、．.]([:：])?")
    pattern2 = re.compile("^[一二三四五六七八九十]{1,2}[章节篇条、.．]")
    for line in content:
        if re.search(pattern1, line):
            res.append(line)
        if re.search(pattern2, line):
            res.append(line)
    return res
# !/usr/bin/env python
# -*- coding:utf-8 -*-
import time

from datasets import Dataset

from DataTransform.DataflowDatasetDict import DataflowDatasetDict
from DataTransform.DatasetProcessor import DatasetProcessor
from DataTransform.ProcessFunctions.AggregateFunctions import back_translation, \
    domain_words_extract
from DataTransform.ProcessFunctions.SingleElementProcessFunctions import passage_parse


def test_back_translation():
    start_time = time.time()
    test_data = {"Comment": ["你好呀，你吃饭了吗？"] * 2 + ["你最近工作开心吗？"] * 2 + ["天气不错，出去走走吧。"] * 2 + ["明天似乎要下雨，出门记得带伞。"] * 2}
    test_data = DataflowDatasetDict({"train": Dataset.from_dict(test_data)})
    start_length = test_data["train"].num_rows

    # 配置处理器
    back_translation_processor = DatasetProcessor(
        process_name="back_translation",
        process_method="self_define_process",
        aug_func=back_translation,
        aug_column_name="Comment",
        batch_size=2,
        from_model_name="/mnt/sdb2/MingFei/opus-mt-zh-en",
        to_model_name="/mnt/sdb2/MingFei/opus-mt-en-zh"
        #from_model_name="/root/data/opus-mt-zh-en",
        #to_model_name="/root/data/opus-mt-en-zh"
    )
    # 设置pipeline，pipeline由一个个processor组成
    test_data.set_process_pipeline([back_translation_processor])
    # 运行pipeline
    test_data.run_process_pipeline()
    # 查看结果
    print(test_data["train"].to_pandas().head())
    # 检查行数
    end_length = test_data["train"].num_rows
    assert start_length == end_length
    end_time = time.time()
    # 执行时长
    print(end_time - start_time)


def test_domian_words(domain_dataset_dict_test):
    dataset_newword = DatasetProcessor(process_name='chinese_domain_words_etxract',
                                       process_method="self_define_process", aug_func=domain_words_extract,
                                       aug_column_name='query',
                                       stop_words_path="../src/DataTransform/Utils/stopwords",
                                       jieba_dict_path="../src/DataTransform/Utils/dict.txt",
                                       out_path="../result",
                                       min_freq=1, min_pmi=0, min_entropy=0, rate=10, topk=10)
    domain_dataset_dict_test.set_process_pipeline([dataset_newword])
    domain_dataset_dict_test.run_process_pipeline(using_beam=False)
    print(domain_dataset_dict_test["domain_words"]["word"])
    assert len(domain_dataset_dict_test["domain_words"]["word"]) == 10
    assert domain_dataset_dict_test["domain_words"]["word"] == ['在线教育', '行业', '时代背景', '提升', '体验', '方案', '听云', '客户',
                                                                '案例', '课堂']


def test_passage_parse(dir_test):
    dataset_newword = DatasetProcessor(process_name='file_passage_parse',
                                       process_method="data_aug_from_columns", aug_func=passage_parse,
                                       aug_column_name='files_path',
                                       length=200,  # 指定passage长度限制
                                       )
    dir_test.set_process_pipeline([dataset_newword])
    dir_test.run_process_pipeline(using_beam=False)
    print(dir_test)

    # len(passage) <= 200
    for i, row in enumerate(dir_test['test']):
        for passages in row['passages']:
            for passage in passages:
                assert len(passage) <= 200

# !/usr/bin/env python
# -*- coding:utf-8 -*-

from datasets import DatasetInfo
from datasets import load_dataset

from DataTransform.DataflowDatasetDict import DataflowDatasetDict
from DataTransform.DatasetProcessor import DatasetProcessor, DATA_AUG_FROM_COLUMNS
from DataTransform.ProcessFunctions.AggregateFunctions import back_translation

from DataTransform.ProcessFunctions.SingleElementProcessFunctions import tokenize, \
    string_split_expend

# 创建数据集
DESCRIPTION = '''文档与搜索语句对应关系数据集,作者：爱数 AnyDATA全体人员'''
HOMEPAGE = '''https://www.aishu.cn/?utm_source=BrandZone&utm_medium=CPT&utm_campaign=Title'''
LICENSE = '''Apache 2'''
VERSION = '1.0.0'
dataset_info = DatasetInfo(
    description=DESCRIPTION,
    homepage=HOMEPAGE,
    license=LICENSE,
    version=VERSION
)

data_files = {"dev": "../sample_data/dev/dev_small.csv", "test": "../sample_data/test/test_small.csv"}
dataset_dict = DataflowDatasetDict(load_dataset('csv', data_files=data_files))

for k in dataset_dict:
    dataset_dict[k].info.update(dataset_info)
print(dataset_dict)
print(dataset_dict['dev'].info)

'''
加工数据集
加工工序为：对query列的内容进行竖线分隔展开成多行->对新的query列进行分词并创建新的tokens列保存结果->对query列的内容进行回译增强
'''
# 创建加工器
queries_split_row_expend = DatasetProcessor(process_name='querys_clean_and_expend',
                                            process_method=DATA_AUG_FROM_COLUMNS,
                                            aug_func=string_split_expend,
                                            aug_column_name='query', expend_rows=True, spliter='|')
from jieba import cut as cut

tokenize_column_expend = DatasetProcessor(process_name='tokenize_column_expend', process_method=DATA_AUG_FROM_COLUMNS,
                                          aug_func=tokenize, aug_column_name='query',
                                          tokenizer=cut, new_column_name='tokens')
# 请替换指定自己的from_model_name,to_model_name

back_translation_processor = DatasetProcessor(
    process_name="back_translation",
    process_method="self_define_process",
    aug_func=back_translation,
    aug_column_name="query",
    batch_size=2,
    from_model_name="/mnt/sdb2/MingFei/opus-mt-zh-en",
    to_model_name="/mnt/sdb2/MingFei/opus-mt-en-zh"
)
# 设置加工流水线
dataset_dict.set_process_pipeline(
    [queries_split_row_expend, tokenize_column_expend, back_translation_processor])
# 运行加工流水线对数据集进行加工
dataset_dict.run_process_pipeline(using_beam=False)
# 打印前5行看结果
print(dataset_dict)
for i, a_row in enumerate(dataset_dict['dev']):
    print(a_row)
    if i == 5:
        break

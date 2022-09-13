# -*- coding: utf-8 -*-
'''
@Author ：Jay.zhu
@Date ：2022/6/30 14:09
'''
from DataTransform.DatasetProcessor import DatasetProcessor
from datasets import load_dataset
from DataTransform.DataflowDatasetDict import DataflowDatasetDict
from DataTransform.ProcessFunctions.AggregateFunctions import domain_words_extract


class DomainWordsTask:
    """
    Task of domain vocabulary extraction.(Currently only local files can be read)
    """
    
    def __init__(self, domain_file, other_file, column_name, output_file,
                 min_freq=0, min_pmi=-1, min_entropy=-1, rate=10, topk=10):
        self.data_files = {}
        if domain_file:
            self.data_files["domain"] = domain_file
            self.file_type = domain_file.split(".")[-1]
        if other_file:
            self.data_files["other"] = other_file
            self.file_type = other_file.split(".")[-1]
        if self.file_type != "csv":
            self.file_type = "text"
        self.column_name = column_name
        self.output_file = output_file
        self.min_freq = min_freq
        self.min_pmi = min_pmi
        self.min_entropy = min_entropy
        self.rate = rate
        self.topk = topk
    
    def _load_datasets(self):
        dataset_dict = DataflowDatasetDict(load_dataset(self.file_type, data_files=self.data_files))
        return dataset_dict
    
    def _construct_process_pipelines(self):
        dataset_dict = self._load_datasets()
        dataset_domain = DatasetProcessor(process_name='chinese_domain_words_etxract',
                                          process_method="self_define_process",
                                          aug_func=domain_words_extract,
                                          aug_column_name=self.column_name,
                                          min_freq=self.min_freq,
                                          min_pmi=self.min_pmi,
                                          min_entropy=self.min_entropy,
                                          rate=self.rate,
                                          topk=self.topk)
        dataset_dict.set_process_pipeline([dataset_domain])
        dataset_dict.run_process_pipeline(using_beam=False)
        return dataset_dict
    
    def _transform_and_output(self):
        dataset_dict = self._construct_process_pipelines()
        dataset_dict.save_to_disk(self.output_file)

from typing import Optional, Iterable

import pytest
from datasets import Features

from DataTransform.DataflowDatasetDict import DataflowDatasetDict
from DataTransform.DatasetProcessor import DatasetProcessor, DATA_AUG_FROM_COLUMNS, SELF_DEFINE_PROCESS
from DataTransform.Utils.UtilFuncs import iterator_of_dicts_to_dict_of_iterators, process_one_example, \
    dict_of_lists_to_iterator_of_dicts


def func_self_define(dataset_dict_input: DataflowDatasetDict, str_print: str = 'none') \
        -> Optional[DataflowDatasetDict]:
    print(str_print)
    dataset_dict_output = dataset_dict_input
    return dataset_dict_output


def string_split_expend(string: str, spliter: str) -> Iterable[str]:
    if string is None:
        return []
    else:
        return string.split(spliter)


class TestDatasetProcessor:
    split_processor = DatasetProcessor(process_name='split_processor',
                                       process_method=DATA_AUG_FROM_COLUMNS,
                                       aug_func=string_split_expend,
                                       aug_column_name='query', expend_rows=True, spliter='|')

    processor_self_define = DatasetProcessor(process_name='processor_self_define',
                                             process_method=SELF_DEFINE_PROCESS,
                                             aug_func=func_self_define,
                                             # dataset_dict=DataflowDatasetDict(DatasetDict()),
                                             str_print='ttt'
                                             )

    def test_init(self):
        assert self.split_processor.process_name == 'split_processor'
        assert self.split_processor.process_method == DATA_AUG_FROM_COLUMNS
        assert self.split_processor.kwargs['aug_column_name'] == 'query'

        with pytest.raises(ValueError) as e:
            DatasetProcessor(process_name='processor_self_define',
                             process_method='no method')
        exec_msg = e.value.args[0]
        assert exec_msg == 'no method should be one of the names below dict_keys([\'data_aug_from_columns\',' \
                           ' \'self_define_process\'])'

        with pytest.raises(ValueError) as e:
            DatasetProcessor(process_name='split_processor',
                             process_method=DATA_AUG_FROM_COLUMNS,
                             aug_func=string_split_expend
                             )
        exec_msg = e.value.args[0]
        assert exec_msg == 'data_aug_from_columns must have parameter aug_column_name'

    def test_process(self, dataset_dict_test):
        dic_split_1 = self.split_processor.process(dataset_dict_test)
        dic_split_2 = self.split_processor._data_aug_from_columns(
            dataset_dict=dataset_dict_test, **self.split_processor.kwargs)
        for i, a_row in enumerate(dic_split_1['test1']):
            assert a_row == dic_split_2['test1'][i]
        kwargs = self.processor_self_define.kwargs

        dic_self_define_1 = self.processor_self_define.process(dataset_dict_test)
        dic_self_define_2 = self.processor_self_define.self_define_process(
            dataset_dict=dataset_dict_test, **kwargs)
        for i, a_row in enumerate(dic_self_define_1['test1']):
            assert a_row == dic_self_define_2['test1'][i]

    def test__data_aug_from_columns_func(self, dataset_dict_test):
        examples = dataset_dict_test['test1'].to_dict()
        aug_func = string_split_expend
        aug_column_name = 'query'
        expend_rows = True
        spliter = '|'

        assert self.split_processor._data_aug_from_columns_func(examples=examples,
                                                                aug_func=aug_func,
                                                                aug_column_name=aug_column_name,
                                                                expend_rows=expend_rows,
                                                                spliter=spliter) \
               == iterator_of_dicts_to_dict_of_iterators(
            self.split_processor._data_aug_from_columns_generater(examples=examples,
                                                                  aug_func=aug_func,
                                                                  aug_column_name=aug_column_name,
                                                                  expend_rows=expend_rows,
                                                                  spliter=spliter))

    def test__data_aug_from_columns_generater(self, dataset_dict_test):

        examples = dataset_dict_test['test1'].to_dict()
        aug_func = string_split_expend
        aug_column_name = 'query'
        expend_rows = True
        spliter = '|'

        examples_list_gen = dict_of_lists_to_iterator_of_dicts(examples)
        new_examples = []

        for example in examples_list_gen:
            for new_example_test in process_one_example(example, aug_func, aug_column_name,
                                                        expend_rows, spliter=spliter):
                new_examples.append(new_example_test)
        for new_example in self.split_processor._data_aug_from_columns_generater(examples, aug_func,
                                                                                 aug_column_name, expend_rows,
                                                                                 spliter=spliter):
            assert new_example == new_examples.pop(0)

    def test__data_aug_from_columns(self, dataset_dict_test):
        aug_func = string_split_expend
        aug_column_name = 'query'
        expend_rows = True
        spliter = '|'

        with_indices: bool = False
        batch_size: Optional[int] = None
        keep_in_memory: bool = True
        load_from_cache_file: bool = False
        writer_batch_size: Optional[int] = 1000
        features: Optional[Features] = None
        disable_nullable: bool = False
        num_proc: Optional[int] = None
        desc: Optional[str] = None

        new_dataset_dict = self.split_processor._data_aug_from_columns(dataset_dict_test, aug_func, aug_column_name,
                                                                       expend_rows=expend_rows,
                                                                       spliter=spliter)
        new_dataset_dict_list = []
        for i, a_row in enumerate(new_dataset_dict['test1']):
            new_dataset_dict_list.append(a_row)
            if i == 100:
                break
        new_dataset_dict_test = DataflowDatasetDict(
            dataset_dict_test.map(
                lambda x: self.split_processor._data_aug_from_columns_func(x, aug_func=aug_func,
                                                                           aug_column_name=aug_column_name,
                                                                           expend_rows=expend_rows,
                                                                           spliter=spliter
                                                                           ),
                with_indices=with_indices,
                batched=True,
                batch_size=batch_size,
                keep_in_memory=keep_in_memory,
                load_from_cache_file=load_from_cache_file,
                writer_batch_size=writer_batch_size,
                features=features,
                disable_nullable=disable_nullable,
                num_proc=num_proc,
                desc=desc))
        assert len(new_dataset_dict_test['test1']) == len(new_dataset_dict['test1'])
        for i, a_row in enumerate(new_dataset_dict_test['test1']):
            assert a_row == new_dataset_dict_list[i]
            if i == 100:
                break

    def test_self_define_processor(self, dataset_dict_test):
        assert self.processor_self_define.self_define_process(dataset_dict_test, func_self_define,
                                                              str_print='test') \
               == func_self_define(dataset_dict_test, 'test')

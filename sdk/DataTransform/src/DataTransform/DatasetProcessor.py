from typing import Optional

import apache_beam as beam
from datasets import Features
from typing import Union,List
from DataTransform.DataflowDatasetDict import DataflowDatasetDict
from DataTransform.DatasetProcessorInfo import DatasetProcessorInfo
from DataTransform.SideInputFunction import SideInputFunction
from DataTransform.ProcessFunctions.SingleElementProcessFunctions import \
    string_split_expend
from DataTransform.Utils.UtilFuncs import process_one_example,iterator_of_dicts_to_dict_of_iterators,dict_of_lists_to_iterator_of_dicts
DATA_AUG_FROM_COLUMNS = 'data_aug_from_columns'
DATA_AUG_FROM_COLUMNS_EXPEND_FUNC_PARAM_NAME = 'aug_func'
DATA_AUG_FROM_COLUMNS_EXPEND_COLUMN_NAME_PARAM_NAME = 'aug_column_name'

SELF_DEFINE_PROCESS = 'self_define_process'
PROCESS_NAMES_AND_PARAMETERS = {DATA_AUG_FROM_COLUMNS: [DATA_AUG_FROM_COLUMNS_EXPEND_FUNC_PARAM_NAME,
                                                        DATA_AUG_FROM_COLUMNS_EXPEND_COLUMN_NAME_PARAM_NAME],
                                SELF_DEFINE_PROCESS: [DATA_AUG_FROM_COLUMNS_EXPEND_FUNC_PARAM_NAME]}


class MyProcess(beam.DoFn):
    def process(self, element, **kwargs):
        return process_one_example(element, **kwargs)


class DatasetProcessor(object):
    '''DatasetProcessor can be constructed and set into a DataflowDataset's pipeline to process the dataset sequentially
     '''

    def __init__(self, process_name: str, process_method: str, **kwargs):
        # Sanity checks to ensure proper dataflow and it's parameters
        '''supported Args:
                                aug_func:function to process the column values.
                                aug_column_name:columns to process.
                                expend_rows:True if you want to expend an example into multiple rows
                                side_input:Additional input for processing dataset.
                                    If it's a function,then it will be used to process the dataset to generate an
                                        in-memory side input and the generated side input will be passed to aug_func.
                                    If it's not a function,then it will be simply passed to the aug_func.
                                side_input_kwargs:When side_input is a function,this will be passed to side_input
                                    function when executing.
                                **kwargs:Any other parameters for aug_func.
        >>> model_process_column_expend = DatasetProcessor(process_name='model_process_column_expend',
        ...                                                process_method=DATA_AUG_FROM_COLUMNS,
        ...                                                aug_func=string_split_expend,
        ...                                                aug_column_name='query',
        ...                                                new_column_name='string_splited')
        '''
        self.kwargs = kwargs
        self.process_name = process_name
        if process_method in PROCESS_NAMES_AND_PARAMETERS:
            for a_param_name in PROCESS_NAMES_AND_PARAMETERS[process_method]:
                if a_param_name not in self.kwargs:
                    raise ValueError('''%s must have parameter %s''' % (process_method, a_param_name))
            self.process_method = process_method
        else:
            raise ValueError(
                '''%s should be one of the names below %s''' % (
                    process_method, str(PROCESS_NAMES_AND_PARAMETERS.keys()))
            )
        self.dataset_processor_info = DatasetProcessorInfo()
        self.ptransform_of_processor = beam.ParDo(MyProcess(), **kwargs)

    def process(self, dataset_dict):
        '''Act the process method'''
        if self.process_method == DATA_AUG_FROM_COLUMNS:
            return self._data_aug_from_columns(dataset_dict=dataset_dict, **self.kwargs)
        elif self.process_method == SELF_DEFINE_PROCESS:
            return self.self_define_process(dataset_dict=dataset_dict, **self.kwargs)

    def _data_aug_from_columns_func(self, examples, aug_func, aug_column_name, **kwargs):
        result_dict_of_lists = iterator_of_dicts_to_dict_of_iterators(
            self._data_aug_from_columns_generater(examples, aug_func, aug_column_name, **kwargs))
        return result_dict_of_lists

    def _data_aug_from_columns_generater(self, examples, aug_func, aug_column_name: Union[List[str], str],
                                         expend_rows: bool = False, **func_param):
        """Process every example and expend rows or expend columns or only update the example.
            When expending one example row into several rows,aug_func have to return an iterable object and
            expend_rows should be True.
            When expending more columns , aug_func have to return a dictionary
            like {column_name1:value1,column_name2:value2}.
            When expending both more columns and rows,aug_func have to return a dictionary like
            {column_name1:Iterable1,column_name2:Iterable2} and expend_rows should be True.
            When updating one column value of example without any expending,aug_func returns
            the same data type as before.
        >>> split_processor = DatasetProcessor(process_name='split_processor',
        ...                                    process_method=DATA_AUG_FROM_COLUMNS,
        ...                                    aug_func= string_split_expend,
        ...                                    aug_column_name='value',
        ...                                    expend_rows=True,
        ...                                    spliter='|')
        >>> examples = {'key': ['k1', 'k2'], 'value': ['v1.1|v1.2', 'v2.1|v2.2']}
        >>> aug_func = string_split_expend
        >>> aug_column_name = 'value'
        >>> expend_rows = True
        >>> spliter = '|'
        >>> output1 = (split_processor._data_aug_from_columns_generater(examples, aug_func, aug_column_name, expend_rows, spliter=spliter))
        >>> type(output1)
        <class 'generator'>
        >>> list(output1)
        [{'key': 'k1', 'value': 'v1.1'}, {'key': 'k1', 'value': 'v1.2'}, {'key': 'k2', 'value': 'v2.1'}, {'key': 'k2', 'value': 'v2.2'}]

        >>> expend_rows = False
        >>> output2 = (split_processor._data_aug_from_columns_generater(examples, aug_func, aug_column_name, expend_rows, spliter=spliter))
        >>> type(output2)
        <class 'generator'>
        >>> list(output2)
        [{'key': 'k1', 'value': "['v1.1', 'v1.2']"}, {'key': 'k2', 'value': "['v2.1', 'v2.2']"}]


            Args:
                examples:example batch of dataset.
                aug_func:function to process the column values.
                aug_column_name:columns to process.
                expend_rows:True if you want to expend an example into multiple rows
                **func_param:Any other parameters for aug_func."""
        examples_list_gen = dict_of_lists_to_iterator_of_dicts(examples)
        for example in examples_list_gen:
            for new_example in process_one_example(example, aug_func, aug_column_name,
                                                   expend_rows, **func_param):
                yield new_example

    def _data_aug_from_columns(self, dataset_dict, aug_func, aug_column_name: Union[str, List[str]], side_input=None,
                               side_input_kwargs=None, with_indices: bool = False,
                               batch_size: Optional[int] = None,
                               keep_in_memory: bool = True,
                               load_from_cache_file: bool = False,
                               writer_batch_size: Optional[int] = 1000,
                               features: Optional[Features] = None,
                               disable_nullable: bool = False,
                               num_proc: Optional[int] = None,
                               desc: Optional[str] = None,
                               **kwargs) -> DataflowDatasetDict:
        dataset_dict._check_values_type()

        if side_input is not None:
            # if side_input is a function
            new_side_input = side_input
            if callable(side_input):
                new_side_input = side_input(side_input_kwargs)
            elif isinstance(side_input, SideInputFunction):
                # default by using side input function in processing the dataset to generate side input result
                new_side_input = side_input.apply(dataset_dict, **side_input_kwargs)
            new_datasetdict = DataflowDatasetDict(
                dataset_dict.map(lambda x: self._data_aug_from_columns_func(x, aug_func=aug_func,
                                                                            aug_column_name=aug_column_name,
                                                                            side_input=new_side_input, **kwargs
                                                                            ), with_indices=with_indices,
                                 batched=True,
                                 batch_size=batch_size,
                                 keep_in_memory=keep_in_memory,
                                 load_from_cache_file=load_from_cache_file,
                                 writer_batch_size=writer_batch_size,
                                 features=features,
                                 disable_nullable=disable_nullable,
                                 num_proc=num_proc,
                                 desc=desc))
        else:
            new_datasetdict = DataflowDatasetDict(
                dataset_dict.map(lambda x: self._data_aug_from_columns_func(x, aug_func=aug_func,
                                                                            aug_column_name=aug_column_name, **kwargs
                                                                            ), with_indices=with_indices,
                                 batched=True,
                                 batch_size=batch_size,
                                 keep_in_memory=keep_in_memory,
                                 load_from_cache_file=load_from_cache_file,
                                 writer_batch_size=writer_batch_size,
                                 features=features,
                                 disable_nullable=disable_nullable,
                                 num_proc=num_proc,
                                 desc=desc))
        return new_datasetdict
        pass

    def self_define_process(self, dataset_dict, aug_func, **kwargs) -> Optional[DataflowDatasetDict]:
        """
        >>> dict1 = {'tokens':['a','b','c']}
        >>> dataset_dict = DataflowDatasetDict(dict1)
        >>> def func_self_define(dataset_dict_input: DataflowDatasetDict, str_print: str = 'none') -> Optional[DataflowDatasetDict]:
        ...     print(str_print)
        ...     dataset_dict_output = dataset_dict_input
        ...     return dataset_dict_output

        >>> test_self_define_column_expend = DatasetProcessor(process_name='test_self_define',
        ...                                                   process_method='self_define_process',
        ...                                                   aug_func=func_self_define,
        ...                                                   str_print='test')

        >>> test_self_define_column_expend.self_define_process(dataset_dict=dataset_dict, **test_self_define_column_expend.kwargs)
        test
        DatasetDict({
            tokens: ['a', 'b', 'c']
        })
        """
        return aug_func(dataset_dict, **kwargs)

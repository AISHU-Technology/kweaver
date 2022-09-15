from copy import deepcopy
from typing import Iterable, Dict, List, Union, Iterator
from DataTransform.ProcessFunctions.SingleElementProcessFunctions import string_split_expend


def iterator_of_dicts_to_dict_of_iterators(list_of_dicts_gen: Iterator[Dict]) -> Dict[str, Iterator]:
    """
    >>> dic_input_1 = {'key1': 'value1_1', 'key2': 'value1_2'}
    >>> dic_input_2 = {'key1': 'value2_1', 'key2': 'value2_2'}
    >>> dic_list = [dic_input_1, dic_input_2]
    >>> result_dict = iterator_of_dicts_to_dict_of_iterators(dic_list)
    >>> result_dict
    {'key1': ['value1_1', 'value2_1'], 'key2': ['value1_2', 'value2_2']}
    """
    keys = []
    result_dict = {}
    for a_dict in list_of_dicts_gen:
        if keys == []:
            keys = a_dict.keys()
            if result_dict == {}:
                result_dict = result_dict.fromkeys(keys)
                for key in result_dict:
                    result_dict[key] = []
        for a_key in keys:
            result_dict[a_key].append(a_dict[a_key])
    return result_dict


def dict_of_lists_to_iterator_of_dicts(dict_of_lists: Dict[str, list]) -> Iterator[Dict]:
    """
    >>> dic_input = {'key1': ['value1_1', 'value2_1'], 'key2': ['value1_2', 'value2_2']}
    >>> list(dict_of_lists_to_iterator_of_dicts(dic_input))
    [{'key1': 'value1_1', 'key2': 'value1_2'}, {'key1': 'value2_1', 'key2': 'value2_2'}]
    """
    if dict_of_lists is not None:
        for i in range(len(list(dict_of_lists.values())[0])):
            a_dict = {}
            for a_key in dict_of_lists:
                a_dict[a_key] = dict_of_lists[a_key][i]
            yield a_dict


def process_one_example(example, aug_func, aug_column_name: Union[List[str], str],
                        expend_rows: bool = False, **func_param):
    """
    >>> example_t: dict = {'doc_id': 140, 'query': '123|abc|135'}
    >>> aug_column_name_t = 'query'
    >>> output = process_one_example(example_t, string_split_expend, aug_column_name_t, expend_rows=True, spliter='|')
    >>> list(output)
    [{'doc_id': 140, 'query': '123'}, {'doc_id': 140, 'query': 'abc'}, {'doc_id': 140, 'query': '135'}]

    """
    if isinstance(aug_column_name, List):
        aug_func_input_list = [example[name] for name in aug_column_name]
        auged_column_value = aug_func(*aug_func_input_list, **func_param)
    else:
        auged_column_value = aug_func(example[aug_column_name], **func_param)
    if expend_rows:
        if isinstance(auged_column_value, str) is False and isinstance(auged_column_value, Iterable) is False:
            raise ValueError('''Can't expend rows because Aug_func returns %s''' % type(auged_column_value))
        if isinstance(auged_column_value, Dict):
            auged_column_value = dict_of_lists_to_iterator_of_dicts(auged_column_value)
            for a_new_value in auged_column_value:
                example = deepcopy(dict(example.items()))
                example.update(a_new_value)
                yield example
        elif isinstance(auged_column_value, Iterable):
            for a_new_value in auged_column_value:
                example = deepcopy(dict(example.items()))
                example.update({aug_column_name: a_new_value})
                yield example
    else:
        if isinstance(auged_column_value, Dict):  # Expend columns
            example = deepcopy(dict(example.items()))
            example.update(auged_column_value)
            yield example
        else:
            example = deepcopy(dict(example.items()))
            if isinstance(auged_column_value, Iterable):
                example.update({aug_column_name: str([value for value in auged_column_value])})
            else:
                example.update({aug_column_name: auged_column_value})
            yield example

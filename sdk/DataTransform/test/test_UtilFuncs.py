from copy import deepcopy
from typing import Iterable

import pytest

from DataTransform.Utils.UtilFuncs import iterator_of_dicts_to_dict_of_iterators, dict_of_lists_to_iterator_of_dicts, \
    process_one_example


def test_iterator_of_dicts_to_dict_of_iterators():
    dic_input_1 = {'key1': 'value1_1', 'key2': 'value1_2'}
    dic_input_2 = {'key1': 'value2_1', 'key2': 'value2_2'}
    dic_list = [dic_input_1, dic_input_2]
    result_dict = iterator_of_dicts_to_dict_of_iterators(dic_list)
    assert result_dict == {
        'key1': ['value1_1', 'value2_1'],
        'key2': ['value1_2', 'value2_2']}


def test_dict_of_lists_to_iterator_of_dicts():
    dic_input = {
        'key1': ['value1_1', 'value2_1'],
        'key2': ['value1_2', 'value2_2']}
    list_output = [
        {'key1': 'value1_1', 'key2': 'value1_2'},
        {'key1': 'value2_1', 'key2': 'value2_2'}]
    for a_dict in dict_of_lists_to_iterator_of_dicts(dic_input):
        assert a_dict == list_output.pop(0)


def test_process_one_example():
    example: dict = {'doc_id': 140,
                     'doc_path': '公司产品知识库/04.AnyRobot Family/AnyRobot Family 3/11-生态转售产品介绍/01-听云生态合作/4-听云解决方案/在线教育',
                     'tag_type': '开发集',
                     'doc_name': '行业解决方案-在线教育-V1.0-20200205', 'doc_type': '.pptx',
                     'query': '在线教育行业时代背景|在线教育行业提升用户体验方案|听云在线教育客户案例|云课堂在线教育性能监测与保障|在线教育应用系统优化和质量保障'}

    def string_split_expend(string: str, spliter: str) -> Iterable[str]:
        if string is None:
            return []
        else:
            return string.split(spliter)

    def string_split_error(string: str, spliter: str) -> float:
        if string is None:
            return 666.6666
        else:
            return 123.2333

    def return_dict(string: str) -> dict:
        if string is None:
            return {}
        else:
            return {
                'key1': ['value1_1', 'value2_1'],
                'key2': ['value1_2', 'value2_2']}

    def return_int(string: str) -> int:
        if string is None:
            return 0
        else:
            return 1

    def two_columns(string1, string2):

        string1 = str(string1)
        string2 = str(string2)
        return string1 + string2

    aug_column_name = 'query'

    # 0: aug_columns_name is list'
    '''
    输入为list时update({aug_column_name: auged_column_value})会报错
    output0 = process_one_example(example, two_columns, ['doc_id', 'tag_type'], expend_rows=False)
    for a_example in output0:
        print(a_example)
    '''

    # output100 : 'expend_rows is True, return not Iterable
    with pytest.raises(ValueError) as e:
        output100 = process_one_example(example, string_split_error, 'query', expend_rows=True, spliter='|')
        for a_value in output100:
            pass
    exec_msg = e.value.args[0]
    assert exec_msg == "Can't expend rows because Aug_func returns <class 'float'>"

    # 101： expend,return dict
    output101 = process_one_example(example, return_dict, aug_column_name, expend_rows=True)
    auged_column_value = dict_of_lists_to_iterator_of_dicts(return_dict('test'))
    example_t = deepcopy(dict(example.items()))
    for a_example in output101:
        example_t.update(next(auged_column_value))
        assert a_example == example_t

    # 102： expend,return Iterable
    output102 = process_one_example(example, string_split_expend, aug_column_name, expend_rows=True, spliter='|')
    auged_column_value = string_split_expend(example[aug_column_name], spliter='|')
    i = 0
    for value in auged_column_value:
        assert next(output102)[aug_column_name] == value

    # 110: return dict
    output110 = process_one_example(example, return_dict, aug_column_name, expend_rows=False)
    example_t = deepcopy(dict(example.items()))
    for a_example in output110:
        example_t.update(return_dict(example[aug_column_name]))
        assert a_example == example_t

    # 111: return Iterable
    output111 = process_one_example(example, string_split_expend, aug_column_name, expend_rows=False, spliter='|')
    example_t = deepcopy(dict(example.items()))
    auged_column_value = string_split_expend(example['query'], spliter='|')
    example_t.update({aug_column_name: str([value for value in auged_column_value])})
    for a_example in output111:
        assert a_example == example_t

    # 112: return others
    output112 = process_one_example(example, return_int, aug_column_name, expend_rows=False)
    for a_example in output112:
        assert a_example[aug_column_name] == return_int(example[aug_column_name])

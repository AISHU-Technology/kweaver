from DataTransform.DatasetProcessor import DatasetProcessor, DATA_AUG_FROM_COLUMNS


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


class TestDataflowDatasetDict:
    processor_1 = DatasetProcessor(process_name='query_pattern_row_expend',
                                   process_method=DATA_AUG_FROM_COLUMNS, aug_func=return_dict,
                                   aug_column_name='query', expend_rows=True)
    processor_2 = DatasetProcessor(process_name='chinese_word_substitute_aug_for_a_query',
                                   process_method=DATA_AUG_FROM_COLUMNS, aug_func=return_int,
                                   aug_column_name='query', expend_rows=True, )

    def test_set_process_pipeline(self, dataset_dict_test):
        pipeline = [self.processor_1, self.processor_2]
        dataset_dict_test.set_process_pipeline(pipeline)
        assert dataset_dict_test.process_pipeline == pipeline

    def test_append_processors(self, dataset_dict_test):
        dataset_dict_test.set_process_pipeline([])
        pipeline = [self.processor_1, self.processor_2]

        dataset_dict_test.append_processors(pipeline)
        assert dataset_dict_test.process_pipeline == pipeline
        dataset_dict_test.append_processors(self.processor_1)
        pipeline.append(self.processor_1)
        assert dataset_dict_test.process_pipeline == pipeline

    def test_get_process_pipeline(self, dataset_dict_test):
        pipeline = [self.processor_1, self.processor_2]
        dataset_dict_test.set_process_pipeline(pipeline)
        assert dataset_dict_test.get_process_pipeline == pipeline

    def test_run_process_pipline(self):
        pass

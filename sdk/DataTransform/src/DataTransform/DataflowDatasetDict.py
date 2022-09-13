# !/usr/bin/env python
# -*- coding:utf-8 -*-

from typing import List

from datasets import DatasetDict
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from DataTransform import SideInputFunction

class DataflowDatasetDict(DatasetDict):
    """A dictionary (dict of str: datasets.Dataset) with dataobject transforms methods (map, filter, etc.)
        and can set dataflow pipeline with DatasetProcessors to dataflow dataobject sequentially."""

    def __init__(self, DatasetDict):
        super(DataflowDatasetDict, self).__init__(DatasetDict)
        self.process_pipeline = []
        self.beam_options = PipelineOptions(runner='DirectRunner')
        self.beam_process_pipeline = beam.Pipeline(options=self.beam_options)

    def set_process_pipeline(self, process_pipeline: List):
        self.process_pipeline = process_pipeline

    def append_processors(self, processor):
        if isinstance(processor, List):
            self.process_pipeline.extend(processor)
        else:
            self.process_pipeline.append(processor)

    @property
    def get_process_pipeline(self):
        return self.process_pipeline

    def run_process_pipeline(self, using_beam=False):
        if self.process_pipeline == []:
            raise ValueError(
                'dataflow pipeline cannot be empty'
            )
        if using_beam:
            with self.beam_process_pipeline as p:
                pcolls = []
                for i, k in enumerate(self):
                    pcolls.append(self[k])
                process_result = pcolls | beam.Flatten()
                for a_processor in self.process_pipeline:
                    print('processing ' + a_processor.process_name)
                    print(a_processor.side_input)
                    if 'side_input' in a_processor.kwargs:
                        if a_processor.kwargs['side_input'] is not None:
                            if isinstance(a_processor.kwargs['side_input'], SideInputFunction):
                                beam_combine_fn = beam.CombineFn
                                pass
                            elif callable(a_processor.kwargs['side_input']):
                                pass
                            else:
                                pass
                    else:
                        process_result = (
                                process_result | a_processor.process_name >> a_processor.ptransform_of_processor)
                print('writing to ' + 'all' + '_result.csv')
                process_result | beam.io.WriteToText('Y:/work/graphengine-dataflow/data/output/' + 'all' + '_result.csv')
                # read from all result csv and return into memory or save as a dataset dict to disk
                # TODO
        else:
            for a_processor in self.process_pipeline:
                print(a_processor.process_name)
                self.__init__(a_processor.process(self))

import abc

from DataTransform.DataflowDatasetDict import DataflowDatasetDict


class Task(abc):
    '''
    Task is for packaging the whole process from loading datasets,constructing process pipelines to run the process
    pipeline and other after works.
    '''

    @abc.abstractmethod
    def _load_datasets(self, **kwargs):
        '''
        Args:
            **kwargs:Any parameter for loading datasets.

        Returns:
            One or more datasets.
        '''
        raise NotImplementedError()

    @abc.abstractmethod
    def _construct_process_pipelines(self, datasets, **kwargs):
        '''
        Construct the pipelines to process datasets.
        Args:
            datasets:Datasets to process.
            **kwargs:Any other parameters for constructing the pipelines.
        '''
        raise NotImplementedError()

    @abc.abstractmethod
    def _transform_and_output(self, datasets, **kwargs):
        '''
        Run the process pipelines and complete after jobs if necessary.
        Args:
            datasets:Datasets to process.
            **kwargs:Any other parameters for this process.
        '''
        raise NotImplementedError()

    def run(self, **kwargs):
        '''
        Run the task.
        Args:
            **kwargs:Parameters for running the task.
        Examples:

        '''
        datasets = self._load_datasets(**kwargs)
        self._construct_process_pipelines(datasets, **kwargs)
        self._transform_and_output(datasets, **kwargs)

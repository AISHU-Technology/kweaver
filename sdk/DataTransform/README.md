# Introduction 
DataTransform is for dataset processing.DataTransform supports multiple platform to process
your dataset in streaming with only one sort of code.

# Getting Started

##Install:
You can simply run the pip install command to install DataTransform by:

    pip install DataTransform

or you can clone the code and run:
    
    python setup.py install

to install the package.

##Software dependencies

TODO

##Latest releases

TODO

##Quick start
You can process your dataset and transform it to a new dataset by the following steps.

Build a dataset by Hugging Face dataset loader:

    data_files = {"dev": "../../data/dev/dev_small.csv", "test": "../../data/test/test_small.csv"}
    dataset_dict = DataflowDatasetDict(load_dataset('csv', data_files=data_files))

Make data processors to process you dataset:

    querys_clean_and_split_row_expend = DatasetProcessor(process_name='querys_clean_and_expend',
                                                     process_method=DATA_AUG_FROM_COLUMNS,
                                                     aug_func=DatasetProcessor.string_split_expend,
                                                     aug_column_name='query', expend_rows=True, spliter='|')

Set the processor into the dataset's process pipeline:

    dataset_dict.set_process_pipeline(
    [querys_clean_and_split_row_expend])

Run process pipeline:

    dataset_dict.run_process_pipeline(using_beam=False)

After processing progress has done, the dataset has been processed by you processor and transformed to a new 
form.See more task examples in tasks directory.

##About DatasetProcessor

Dataset processing most time includes multiple process methods as a process pipeline.These
methods may generate more examples, or generate more features, or transform the dataset to a
new form,or even combine the dataset into a single value or other type.
Every process step needs a DatasetProcessor to do one step of processing by setting a DatasetProcessor into the
process pipeline of dataset and using the function which is passed into the DatasetProcessor by 
the input parameter aug_func.

DatasetProcessor now has 2 kind of methods when processing the dataset.DATA_AUG_FROM_COLUMNS and self_define_process.
When build a DatasetProcessor,if you want to process the dataset examples one by one using one or more features,you 
can set the process_method as DATA_AUG_FROM_COLUMNS. In order to handle some complex cases, you also can set the
process_method as self_define_process to support your own process method.

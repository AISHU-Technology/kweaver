import torch
from datasets import load_dataset

from DataTransform.DataflowDatasetDict import DataflowDatasetDict


def back_translation(dataset_dict: DataflowDatasetDict, aug_column_name: str, batch_size: int, from_model_name: str,
                     to_model_name: str) -> DataflowDatasetDict:
    """
    Augmenter that leverage two translation models for augmentation. For example, the source is English. This
    augmenter translate source to German and translating it back to English.

    :param DataflowDatasetDict dataset_dict: dataset to be augmented
    :param str aug_column_name: a column name of dataset_dict
    :param int batch_size: Batch size.
    :param str from_model_name: local model path, and model must be downloaded from https://huggingface.co/models?filter=translation&search=Helsinki-NLP. As
        long as from_model_name is pair with to_model_name. For example, from_model_name is English to Japanese,
        then to_model_name should be Japanese to English.
    :param str to_model_name: local model path, and model must be downloaded from https://huggingface.co/models?filter=translation&search=Helsinki-NLP.
    """
    import nlpaug.augmenter.word as naw
    device = "cuda" if torch.cuda.is_available() else "cpu"
    augmenter = naw.BackTranslationAug(
        from_model_name=from_model_name,
        to_model_name=to_model_name,
        device=device,
        batch_size=batch_size,
        name='BackTranslationAug'
    )
    new_datasetdict = DataflowDatasetDict(dataset_dict.map(
        lambda examples: {aug_column_name: augmenter.augment(examples[aug_column_name])},
        batched=True,
        batch_size=batch_size
    ))
    return new_datasetdict


def domain_words_extract(dataset_dict, **kwargs):
    """
    Extract domain vocabulary of given data
    Args:
        dataset_dict: DataSetDict, the input data
        rate: float or int, Word frequency ratio of words in target domain data and non target domain data.
        min_freq: int, Minimum word frequency threshold. Words with word frequency less than this value will be excluded.
        min_pmi: float, Minimum mutual information threshold. Words with mutual information less than this value will be excluded.
        min_entropy: float, Minimum entropy threshold. Words with entropy less than this value will be excluded.
        topk: int, Return topk words for sorting
        stop_words_path: string, Path to the stop words.
        jieba_dict_path: string, Path to word segmentation dictionary.
        out_path: string, Storage path of intermediate calculation results.
        aug_column_name: string, Name of the field to be processed in the dataset. As data, aug_column_name='content'; local text file, aug_column_name='text'.
    Returns: DataSetDict, domain words

    >>> data_files = {"domain": "../../../sample_data/dev/dev_small.csv", "other": "../../../sample_data/test/test_small.csv"}
    >>> dataset_dict = DataflowDatasetDict(load_dataset('csv', data_files=data_files))
    >>> domian_dataset = domain_words_extract(dataset_dict=dataset_dict,
    ...                  aug_column_name='query',
    ...                  stop_words_path="../Utils/stopwords",
    ...                  jieba_dict_path="../Utils/dict.txt",
    ...                  out_path="../result/",
    ...                  min_freq=1,
    ...                  min_pmi=-1,
    ...                  min_entropy=-1,
    ...                  rate=10,
    ...                  topk=10)
    >>> domain_words = domian_dataset["domain_words"]["word"]
    >>> domain_words
    ['在线教育', '行业', '时代背景', '提升', '体验', '方案', '听云', '客户', '案例', '课堂']
    """
    from DataTransform.Utils.DomainWords import DomainWords
    domain_extractor = DomainWords(corpus=dataset_dict, **kwargs)
    res = domain_extractor.extract()
    dataset_dict = DataflowDatasetDict({"domain_words": res})
    return dataset_dict


def new_word_extract(dataset_dict, out_path, batched, batch_size, **kwargs):
    """
    Extract new words from given data
    Args:
        dataset_dict: DatasetDict, The input data
        batched：True or Flase
        batch_size： batch size
        out_path: string, Storage path of intermediate calculation results.
        stop_words_path: string, Path to the stop words.
        jieba_dict_path: string, Path to word segmentation dictionary.
        aug_column_name: string, Name of the field to be processed in the dataset. As data, aug_column_name='content'; local text file, aug_column_name='text'.
        ngram_size: int, The size of word ngram
        min_freq: int, Minimum word frequency threshold. Words with word frequency less than this value will be excluded.
        min_pmi: float, Minimum mutual information threshold. Words with mutual information less than this value will be excluded.
        min_entropy: float, Minimum entropy threshold. Words with entropy less than this value will be excluded.
    Returns: DataSetDict, new words

    >>> dataset = load_dataset('csv', data_files={'ALL': "../../../sample_data/dev/dev_small.csv"}, streaming=True)
    >>> dataset = dataset.filter(lambda example: example["query"])
    >>> dataset_dict = DataflowDatasetDict(dataset)
    >>> new_words = new_word_extract(dataset_dict=dataset_dict,
    ...                                 out_path="../result",
    ...                                 batched=True,
    ...                                 batch_size=200,
    ...                                 stop_words_path="../Utils/stopwords",
    ...                                 jieba_dict_path="../Utils/dict.txt",
    ...                                 aug_column_name='query',
    ...                                 ngram_size=4,
    ...                                 min_freq=0,
    ...                                 min_pmi=-1,
    ...                                 min_entropy=-1)
    >>> new_words["NewWord"]["ngram"]
    ['在线教育客户', '在线教育性能监测', '在线教育性能', '行业提升用户', '提升用户体验', '提升用户', '用户体验', '听云', '课堂在线教育性能', '性能监测']
    """
    from DataTransform.Utils.example import New_Word
    N_W = New_Word(out_path, **kwargs)
    for k, dataset in dataset_dict.items():
        update_dataset = dataset.map(N_W.pre_process_new_word, batched=batched, batch_size=batch_size, load_from_cache_file=False)
        list(update_dataset)
    dataset = N_W.process_new_word(out_path)
    dataset_dict = DataflowDatasetDict({"NewWord": dataset})
    return dataset_dict

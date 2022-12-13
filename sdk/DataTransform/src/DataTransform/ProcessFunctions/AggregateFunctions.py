import os
import sys
import torch
import pandas as pd
from datasets import load_dataset, Dataset
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


def knowledge_graph_alignment(train_dataset_dict, model_name='GCN_Align', iteration=1, out_path="../result", test_dataset_dict=None):
    """
    Entity alignment (EA) merges knowledge graphs (KGs) by identifying the equivalent entities in different graphs,
    which can effectively enrich knowledge representations of KGs.

    Parameters:
        dataset_dict: DataSetDict, the input data, consist of four parts: "kg1_rel_path","kg1_attr_path","kg2_rel_path" and "kg2_attr_path".
            kg1_rel_path: string
                the input kg1 relation file path.
            kg1_attr_path：string
                the input kg1 attribute file path.
            kg2_rel_path： string
                the input kg2 relation file path.
            kg2_attr_path: string
                the input kg2 attribute file path.
        model_name: string, optional, default: 'GCNAlign'.
            semantic embedding modules.
        iteration: int, The size of iteration.
        test_dataset_dict: default: None. if you want to evaluate the resuluts of EA module, please input the test data.
            DataSetDict, the test data, consist of one parts: "test_path".
        out_path: string, Storage path of intermediate calculation results.

    Returns: DataSetDict
        {
        'entity mapping': set(),
        'relation_mapping_sub': set(),
        'relation_mapping_sup': set(),
        'attribute_mapping_sub': set(),
        'attribute_mapping_sup': set()
        }

    >>> kg1_rel_path = '../../../sample_data/MED-BBK-9K/rel_triples_1'
    >>> kg1_attr_path = '../../../sample_data/MED-BBK-9K/attr_triples_1'
    >>> kg2_rel_path = '../../../sample_data/MED-BBK-9K/rel_triples_2'
    >>> kg2_attr_path = '../../../sample_data/MED-BBK-9K/attr_triples_2'
    >>> test_path = '../../../sample_data/MED-BBK-9K/ent_links'
    >>> train_data_files = {"kg1_rel_path": kg1_rel_path, "kg1_attr_path": kg1_attr_path, "kg2_rel_path": kg2_rel_path,
                        "kg2_attr_path": kg2_attr_path}
    >>> test_data_files = {"test_path": test_path}
    >>> train_dataset_dict = DataflowDatasetDict(load_dataset('csv', data_files=train_data_files, sep="\t", header=None))
    >>> test_dataset_dict = DataflowDatasetDict(load_dataset('csv', data_files=test_data_files, sep="\t", header=None))
    >>> Alignmentor = knowledge_graph_alignment(train_dataset_dict=train_dataset_dict, model_name='GCN_Align', iteration=1, test_dataset_dict=test_dataset_dict, out_path="../result")
    {
    'entity mapping': {('病毒性食管炎', 'ep', 0.146814088486928), ('先天性脑积水', '先天性脑积水', 0.9993075228217657), ('虚弱', '虚弱', 0.999314523720291), ('静脉炎', '静脉炎', 0.999543043671418), ('鹅掌风', '手癣', 0.8879881670502451), ('肝爽颗粒', '步长肝爽成方', 0.44940147379809625), ('肺癌', '支气管和肺恶性肿瘤', 0.8274734308029934), ('免疫抑制剂', '南岛醋酸泼尼松', 0.6372806348915949)} ...,
    'relation_mapping_sub': {('适用手术', '适应症-(inv)', 0.1097604393570976), ('典型症状', '典型症状', 0.37832189519673204), ('相关检查-(inv)', '相关检查-(inv)', 0.8871400906641329)},
    'relation_mapping_sup': {('典型症状-(inv)', '对应疾病', 0.19198083164102253), ('适应症-(inv)', '适应症-(inv)', 0.5417437391551595), ('别名-(inv)', '别名', 0.2478470256654167)},
    'attribute_mapping_sub': {('英文名', '拼音', 0.1258696199298126), ('拼音', '拼音', 0.9975949651201889)},
    'attribute_mapping_sup': {('英文名', '英文名称', 0.2535222130063965), ('拼音', '拼音', 0.9970308118966927)}
    }
    """

    from DataTransform.Utils.PRASEMap.utils.PRASEUtils import get_time_str, print_kgs_stat, print_kg_stat
    from DataTransform.Utils.PRASEMap.se.GCNAlign import GCNAlign
    import DataTransform.Utils.PRASEMap.utils.PRASEUtils as pu
    from DataTransform.Utils.PRASEMap.pr.PARIS import PARIS


    print(get_time_str() + "Construct source KG...")
    sys.stdout.flush()
    # construct source KG from file
    kg1_rel_dataset = train_dataset_dict.get("kg1_rel_path")
    kg1_attr_dataset = train_dataset_dict.get("kg1_attr_path")
    kg1 = pu.construct_kg(kg1_rel_dataset, kg1_attr_dataset)
    print_kg_stat(kg1)
    print(get_time_str() + "Construct target KG...")
    sys.stdout.flush()
    # construct target KG from file
    kg2_rel_dataset = train_dataset_dict.get("kg2_rel_path")
    kg2_attr_dataset = train_dataset_dict.get("kg2_attr_path")
    kg2 = pu.construct_kg(kg2_rel_dataset, kg2_attr_dataset)
    print_kg_stat(kg2)
    # construct KGs object
    kgs = pu.construct_kgs(kg1, kg2)
    # configure kgs
    if model_name == 'BootEA':
        kgs.set_se_module('BootEA')
    elif model_name == 'GCN_Align':
        kgs.set_se_module(GCNAlign)
    kgs.set_pr_module(PARIS)
    '''
    Set Thread Number:
    kgs.pr.set_worker_num(4)
    '''
    '''
    Load PRASEMap Model:
    pu.load_prase_model(kgs, load_path)
    '''
    # init kgs
    kgs.init()
    print(get_time_str() + "Performing PR Module (PARIS)...")
    sys.stdout.flush()
    # run pr module
    kgs.run_pr()
    print_kgs_stat(kgs)
    test_dataset_dict.get("test_path")
    if test_dataset_dict.get("test_path"):
        kgs.test(test_dataset_dict.get("test_path"), threshold=[0.106 * i for i in range(10)])

    kgs.pr.enable_rel_init(False)

    for i in range(iteration):
        print(get_time_str() + "Performing SE Module (GCNAlign)...")
        sys.stdout.flush()
        # run se module
        kgs.run_se(embedding_feedback=True, mapping_feedback=True)
        # print_kgs_stat(kgs)
        if test_dataset_dict.get("test_path"):
            kgs.test(test_dataset_dict.get("test_path"), threshold=[0.106 * i for i in range(10)])
        print(get_time_str() + "Performing PR Module (PARIS)...")
        sys.stdout.flush()
        # run pr module
        kgs.run_pr()
        print_kgs_stat(kgs)
        if test_dataset_dict.get("test_path"):
            kgs.test(test_dataset_dict.get("test_path"), threshold=[0.106 * i for i in range(10)])
    '''
    Save PRASEMap Model:
    pu.save_prase_model(kgs, save_path)
    '''
    print(get_time_str() + "Discovered entity mapping : ")
    ent_align_result = kgs.get_ent_align_name_result()
    print(ent_align_result)
    print(get_time_str() + "Discovered entity mapping number: " + str(len(ent_align_result)))
    sys.stdout.flush()
    relation_mapping_sub, relation_mapping_sup = kgs.get_rel_align_name_result()
    print(get_time_str() + "Discovered relation mapping : ")
    print(relation_mapping_sub)
    print(relation_mapping_sup)
    print(get_time_str() + "Discovered relation mapping number: " + str(
        len(relation_mapping_sub) + len(relation_mapping_sup)))
    sys.stdout.flush()
    print(get_time_str() + "Discovered relation mapping : ")
    attribute_mapping_sub, attribute_mapping_sup = kgs.get_attr_align_name_result()
    print(attribute_mapping_sub)
    print(attribute_mapping_sup)
    print(get_time_str() + "Discovered attribute mapping number: " + str(
        len(attribute_mapping_sub) + len(attribute_mapping_sup)))
    sys.stdout.flush()
    mapping_res = [
        {'entity mapping': ent_align_result},
        {'relation_mapping_sub': relation_mapping_sub},
        {'relation_mapping_sup': relation_mapping_sup},
        {'attribute_mapping_sub': attribute_mapping_sub},
        {'attribute_mapping_sup': attribute_mapping_sup}
    ]
    df = pd.DataFrame(mapping_res)
    dataset_mapping_res = Dataset.from_pandas(df)

    dataset_dict = DataflowDatasetDict({"mapping_res": dataset_mapping_res})
    return dataset_dict

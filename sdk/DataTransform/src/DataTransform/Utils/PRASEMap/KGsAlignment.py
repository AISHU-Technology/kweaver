# -*- coding: utf-8 -*-
'''
@Author ：Chao.li
@Date ：2022/10/10 9:11
'''

import re
import os
import sys
import pandas as pd
from datasets import Dataset, load_dataset
from DataTransform.Utils.PRASEMap.pr.PARIS import PARIS
from DataTransform.Utils.PRASEMap.se.GCNAlign import GCNAlign
import DataTransform.Utils.PRASEMap.utils.PRASEUtils as pu
from DataTransform.Utils.PRASEMap.pr.PARIS import PARIS
from DataTransform.DataflowDatasetDict import DataflowDatasetDict
from DataTransform.Utils.PRASEMap.utils.PRASEUtils import get_time_str, print_kgs_stat, print_kg_stat

current_path = os.path.dirname(os.path.abspath(__file__))


class KGsAlignment(object):
    def __init__(self, corpus, model_name='GCN_Align', out_path="../result/", iteration=1):
        self.corpus = corpus
        self.iteration = iteration
        self.model_name = model_name
        self.out_path = out_path

    def knowledge_graph_alignment(self):
        print(get_time_str() + "Construct source KG...")
        sys.stdout.flush()
        # construct source KG from file
        kg1_rel_dataset = self.corpus.get("kg1_rel_path")
        kg1_attr_dataset = self.corpus.get("kg1_attr_path")
        kg1 = pu.construct_kg(kg1_rel_dataset, kg1_attr_dataset)
        print_kg_stat(kg1)

        print(get_time_str() + "Construct target KG...")
        sys.stdout.flush()
        # construct target KG from file
        kg2_rel_dataset = self.corpus.get("kg2_rel_path")
        kg2_attr_dataset = self.corpus.get("kg2_attr_path")
        kg2 = pu.construct_kg(kg2_rel_dataset, kg2_attr_dataset)
        print_kg_stat(kg2)

        # construct KGs object
        kgs = pu.construct_kgs(kg1, kg2)

        # configure kgs
        if self.model_name == 'BootEA':
            kgs.set_se_module('BootEA')
        elif self.model_name == 'GCN_Align':
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
        # print_kgs_stat(kgs)
        kgs.pr.enable_rel_init(False)

        # iteration = 1
        for i in range(self.iteration):
            print(get_time_str() + "Performing SE Module (GCNAlign)...")
            sys.stdout.flush()
            # run se module
            kgs.run_se(embedding_feedback=True, mapping_feedback=True)

            # print_kgs_stat(kgs)
            print(get_time_str() + "Performing PR Module (PARIS)...")
            sys.stdout.flush()
            # run pr module
            kgs.run_pr()

            # print_kgs_stat(kgs)
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
        return dataset_mapping_res


import math
import os
import gc
import time
import sys
import random
from time import strftime, localtime
import torch
from DataTransform.Utils.PRASEMap.se.gcn_align_model import GCN_Align_Unit
from torch import optim
from torch.autograd import Variable
from DataTransform.Utils.PRASEMap.utils.PRASEUtils import to_tensor, sparse_to_tensor
import torch.nn as nn
import numpy as np
import scipy.sparse as sp
from scipy.spatial.distance import cdist

from prase import KGs

_LAYER_UIDS = {}
'''
This implementation is based on https://github.com/1049451037/GCN-Align
'''

class GCNAlign:

    def __init__(self, kgs: KGs, **kwargs):

        self.kgs = kgs
        self.embed_dim = kwargs.get("embed_dim", 200)
        self.dropout = kwargs.get("dropout", 0.0)
        self.lr = kwargs.get("lr", 8)
        self.margin = kwargs.get("margin", 4)
        self.neg_num = kwargs.get("neg_num", 5)
        self.epoch_num = kwargs.get("epoch_num", 100)

        self.support_number = 1

        self.ae_input = None
        self.support = None
        self.adj = None
        self.ph_ae = None
        self.ph_se = None
        self.model_ae = None
        self.model_se = None
        self.feed_dict_se = None
        self.feed_dict_ae = None

        self.gcn_se = None
        self.gcn_ae = None

        self.se_input_dim = None
        self.ae_input_dim = None

        self.embed_idx_dict = dict()
        self.embed_idx_dict_inv = dict()

        self.ent_training_links = list()

        self.kg1_ent_emb_id_list = list()
        self.kg2_ent_emb_id_list = list()

        self.kg1_train_ent_lite_list = list()
        self.kg2_train_ent_lite_list = list()

        self.kg1_test_ent_list = list()
        self.kg2_test_ent_list = list()

        self.session = None

        self.vec_se = None
        self.vec_ae = None

    def normalize_adj(self, adj):
        adj = sp.coo_matrix(adj)
        rowsum = np.array(adj.sum(1))
        d_inv_sqrt = np.power(rowsum, -0.5).flatten()
        d_inv_sqrt[np.isinf(d_inv_sqrt)] = 0.
        d_mat_inv_sqrt = sp.diags(d_inv_sqrt)
        return adj.dot(d_mat_inv_sqrt).transpose().dot(d_mat_inv_sqrt).tocoo()

    def preprocess_adj(self, adj):
        adj_normalized = self.normalize_adj(adj + sp.eye(adj.shape[0]))
        return sparse_to_tensor(adj_normalized)

    def _reindex(self):
        embed_idx = 0
        self.embed_idx_dict.clear()
        self.embed_idx_dict_inv.clear()
        for item in self.kgs.kg1.get_ent_id_set() | self.kgs.kg2.get_ent_id_set():
            if not self.embed_idx_dict.__contains__(item):
                self.embed_idx_dict[item] = embed_idx
                self.embed_idx_dict_inv[embed_idx] = item
                embed_idx += 1

        for (lite_id, lite_name) in self.kgs.kg1.lite_id_name_dict.items():
            if not self.embed_idx_dict.__contains__(lite_id):
                self.embed_idx_dict[lite_id] = embed_idx
                self.embed_idx_dict_inv[embed_idx] = lite_id
                embed_idx += 1

        for (lite_id, lite_name) in self.kgs.kg2.lite_id_name_dict.items():
            if not self.embed_idx_dict.__contains__(lite_id):
                if self.kgs.kg1.name_lite_id_dict.__contains__(lite_name):
                    lite_cp_id = self.kgs.kg1.name_lite_id_dict[lite_name]
                    lite_cp_embed_id = self.embed_idx_dict[lite_cp_id]
                    self.embed_idx_dict[lite_id] = lite_cp_embed_id
                else:
                    self.embed_idx_dict[lite_id] = embed_idx
                    self.embed_idx_dict_inv[embed_idx] = lite_id
                    embed_idx += 1

    def _load_attr(self):
        fre_list1 = self.kgs.kg1.get_attr_one_way_frequency_list()
        fre_list2 = self.kgs.kg2.get_attr_one_way_frequency_list()
        fre_list1 = fre_list1[:1000] if len(fre_list1) >= 1000 else fre_list1
        fre_list2 = fre_list2[:1000] if len(fre_list2) >= 1000 else fre_list2
        fre = fre_list1 + fre_list2

        attr2id = {}
        num = int(len(fre))
        for i in range(num):
            attr2id[fre[i][0]] = i

        attr = np.zeros((self.kgs.get_entity_nums(), num), dtype=np.float32)
        for (h, r, t) in self.kgs.kg1.get_attribute_id_triples() | self.kgs.kg2.get_attribute_id_triples():
            if r in attr2id:
                attr[self.embed_idx_dict[h]][attr2id[r]] = 1.0
        self.attr = attr

    def _init_weight_adj(self):
        weight_dict = dict()
        for (h, r, t) in self.kgs.kg1.get_relation_id_triples() | self.kgs.kg2.get_relation_id_triples():
            h_emb_id, t_emb_id = self.embed_idx_dict[h], self.embed_idx_dict[t]
            if h_emb_id == t_emb_id:
                continue
            else:
                inv_functionality = max(self.kgs.kg1.get_inv_functionality_by_id(t_emb_id),
                                        self.kgs.kg2.get_inv_functionality_by_id(t_emb_id))
                if (h_emb_id, t_emb_id) not in weight_dict:
                    weight_dict[(h_emb_id, t_emb_id)] = max(inv_functionality, 0.3)
                else:
                    weight_dict[(h_emb_id, t_emb_id)] += max(inv_functionality, 0.3)
        row, col, data = [], [], []
        for (key, value) in weight_dict.items():
            row.append(key[0])
            col.append(key[1])
            data.append(value)

        self.adj = sp.coo_matrix((data, (row, col)), shape=(self.kgs.get_entity_nums(), self.kgs.get_entity_nums()))

    def _load_data(self):
        self._init_weight_adj()
        self.ae_input = sparse_to_tensor(sp.coo_matrix(self.attr))
        self.se_input_dim = self.ae_input.size(dim=0)
        self.ae_input_dim = self.ae_input.size(dim=1)
        self.support = [self.preprocess_adj(self.adj)]
        self._init_train_data()
        return

    def _init_train_data(self, threshold=0.1):
        self.ent_training_links.clear()
        self.kg1_test_ent_list.clear()
        self.kg2_test_ent_list.clear()
        for (e1, e2, p) in self.kgs.get_ent_align_ids_result():
            if p < threshold:
                continue
            idx1, idx2 = self.embed_idx_dict[e1], self.embed_idx_dict[e2]
            self.ent_training_links.append([idx1, idx2])

        for ent in self.kgs.kg1.get_ent_id_set():
            self.kg1_ent_emb_id_list.append(self.embed_idx_dict[ent])

        for ent in self.kgs.kg2.get_ent_id_set():
            self.kg2_ent_emb_id_list.append(self.embed_idx_dict[ent])

        for item in self.kgs.get_kg1_unaligned_candidate_ids():
            self.kg1_test_ent_list.append(self.embed_idx_dict[item])
        for item in self.kgs.get_kg2_unaligned_candidate_ids():
            self.kg2_test_ent_list.append(self.embed_idx_dict[item])

        self.train_array = np.array(self.ent_training_links)

    def _init_model(self):
        self.model_ae = GCN_Align_Unit(self.support, input_dim=self.ae_input_dim,
                                       output_dim=self.embed_dim,
                                       sparse_inputs=True, featureless=False, logging=False,
                                       neg_num=self.neg_num, margin=self.margin)
        self.model_se = GCN_Align_Unit(self.support, input_dim=self.se_input_dim,
                                       output_dim=self.embed_dim,
                                       sparse_inputs=False, featureless=True, logging=False,
                                       neg_num=self.neg_num, margin=self.margin)
        print(self.model_ae.parameters())

        self.optimizer1 = optim.Adam(self.model_ae.parameters(), lr=self.lr)
        self.optimizer2 = optim.Adam(self.model_se.parameters(), lr=self.lr)

    def init(self):
        self._reindex()
        self._load_attr()
        self._load_data()
        self._init_model()

    def _generate_neg_list_from_feedback(self):
        neg_list = list()
        for (ent1, ent2, prob) in self.kgs.get_inserted_forced_mappings():
            if prob > 0.5:
                continue
            idx1, idx2 = self.embed_idx_dict[ent1], self.embed_idx_dict[ent2]
            neg_list.append([idx1, idx2])
        return neg_list

    def to_tensor_cpu(batch):
        return torch.from_numpy(np.array(batch))

    def train(self):
        # **t=train_number k=neg_num
        neg_num = self.neg_num
        train_num = len(self.ent_training_links)
        if train_num <= 0:
            print(str(strftime("[%Y-%m-%d %H:%M:%S]: ", localtime())) + "No entity mapping from PR module")
            return
        print(str(strftime("[%Y-%m-%d %H:%M:%S]: ", localtime())) + "Positive instance number: " + str(train_num))
        sys.stdout.flush()

        train_links = np.array(self.ent_training_links)

        pos = np.ones((train_num, neg_num)) * (train_links[:, 0].reshape((train_num, 1)))
        neg_left = pos.reshape((train_num * neg_num,))
        pos = np.ones((train_num, neg_num)) * (train_links[:, 1].reshape((train_num, 1)))
        neg2_right = pos.reshape((train_num * neg_num,))

        neg_list = self._generate_neg_list_from_feedback()

        if len(neg_list) > 0:
            neg_links = np.array(neg_list)
            neg_left_append = neg_links[:, 0].reshape((len(neg_list), ))
            neg_right_append = neg_links[:, 1].reshape((len(neg_list), ))
        else:
            neg_left_append = np.empty(shape=(0, ))
            neg_right_append = np.empty(shape=(0, ))

        print(str(strftime("[%Y-%m-%d %H:%M:%S]: ", localtime())) + "Feedback negative instance number: " + str(len(neg_list)))

        neg2_left = None
        neg_right = None
        feed_dict_se = None
        feed_dict_ae = None
        print(str(strftime("[%Y-%m-%d %H:%M:%S]: ", localtime())) + "Negative instance number: " + str(len(neg_left)))

        for i in range(1, self.epoch_num + 1):
            start = time.time()
            if i % 10 == 1:
                neg2_left = np.random.choice(self.se_input_dim, train_num * neg_num)
                neg_right = np.random.choice(self.se_input_dim, train_num * neg_num)

            feed_dict_ae = dict()
            feed_dict_ae.update({'features': self.ae_input})
            feed_dict_ae.update({'support': self.support[0]})
            feed_dict_ae.update({'dropout': self.dropout})
            feed_dict_ae.update({'neg_left:0': neg_left, 'neg_right:0': neg_right,
                                 'neg2_left:0': neg2_left, 'neg2_right:0': neg2_right})
            feed_dict_ae.update({'ILL0': self.train_array[:, 0], 'ILL1': self.train_array[:, 1]})

            feed_dict_se = dict()
            feed_dict_se.update({'features': to_tensor(1.)})
            feed_dict_se.update({'support': self.support[0]})
            feed_dict_se.update({'dropout': self.dropout})
            feed_dict_se.update({'neg_left:0': neg_left, 'neg_right:0': neg_right,
                                 'neg2_left:0': neg2_left, 'neg2_right:0': neg2_right})
            feed_dict_se.update({'ILL0': self.train_array[:, 0], 'ILL1': self.train_array[:, 1]})

            if len(neg_list) > 0:
                pos_append = np.array(random.choices(self.ent_training_links, k=len(neg_list)))
                pos_left_append = pos_append[:, 0].reshape((len(neg_list),))
                pos_right_append = pos_append[:, 1].reshape((len(neg_list),))
            else:
                pos_left_append = np.empty(shape=(0,))
                pos_right_append = np.empty(shape=(0,))

            feed_dict_ae.update({'feedback_pos_left:0': pos_left_append, 'feedback_pos_right:0': pos_right_append})
            feed_dict_ae.update({'feedback_neg_left:0': neg_left_append, 'feedback_neg_right:0': neg_right_append})
            feed_dict_se.update({'feedback_pos_left:0': pos_left_append, 'feedback_pos_right:0': pos_right_append})
            feed_dict_se.update({'feedback_neg_left:0': neg_left_append, 'feedback_neg_right:0': neg_right_append})

            self.optimizer1.zero_grad()
            self.optimizer2.zero_grad()

            batch_loss1 = self.model_ae(feed_dict_ae)
            batch_loss2 = self.model_se(feed_dict_se)

            batch_loss1.backward()
            batch_loss2.backward()
            self.optimizer1.step()
            self.optimizer2.step()

            gc.collect()

            batch_loss = batch_loss1 + batch_loss2
            log = 'Training, epoch {}, average triple loss {:.4f}, cost time {:.4f} s'.format(i, batch_loss,
                                                                                              time.time() - start)
            print(str(strftime("[%Y-%m-%d %H:%M:%S]: ", localtime())) + log)
            sys.stdout.flush()

    def mapping_feed_back_to_pr(self, beta=0.9):
        self.vec_se = self.model_se.get_output()
        self.vec_ae = self.model_ae.get_output()
        embeddings = np.concatenate([self.vec_se * beta, self.vec_ae * (1.0 - beta)], axis=1)
        if len(self.kg1_test_ent_list) == 0 or len(self.kg2_test_ent_list) == 0:
            print(str(strftime("[%Y-%m-%d %H:%M:%S]: ", localtime())) + "Adding 0 entity mappings")
            return
        embeds1 = np.array([embeddings[e] for e in self.kg1_test_ent_list])
        embeds2 = np.array([embeddings[e] for e in self.kg2_test_ent_list])
        distance = cdist(embeds1, embeds2, "cityblock")

        kg1_counterpart = np.argmin(distance, axis=1)
        kg2_counterpart = np.argmin(distance, axis=0)
        kg1_matched_pairs = set([(i, kg1_counterpart[i]) for i in range(len(kg1_counterpart))])
        kg2_matched_pairs = set([(kg2_counterpart[i], i) for i in range(len(kg2_counterpart))])
        kg_matched_pairs = kg1_matched_pairs & kg2_matched_pairs

        self.kgs.se_feedback_pairs.clear()

        mapping_num = 0
        for (kg1_ent, kg2_ent) in kg_matched_pairs:
            kg1_emb_id, kg2_emb_id = self.kg1_test_ent_list[kg1_ent], self.kg2_test_ent_list[kg2_ent]
            kg1_id, kg2_id = self.embed_idx_dict_inv[kg1_emb_id], self.embed_idx_dict_inv[kg2_emb_id]
            self.kgs.se_feedback_pairs.add((kg1_id, kg2_id))
            if distance[kg1_ent][kg2_ent] > 0.3:
                continue
            self.kgs.insert_ent_eqv_both_way_by_id(kg1_id, kg2_id, 1 - distance[kg1_ent][kg2_ent])
            mapping_num += 1
        self.kgs.pr.init_loaded_data()
        print(str(strftime("[%Y-%m-%d %H:%M:%S]: ", localtime())) + "Successfully adding " + str(mapping_num) + " entity mappings")
        sys.stdout.flush()

    def embedding_feed_back_to_pr(self, beta=0.9):
        self.vec_se = self.model_se.get_output()
        self.vec_ae = self.model_ae.get_output()
        embeddings = np.concatenate([self.vec_se * beta, self.vec_ae * (1.0 - beta)], axis=1)
        for ent in self.kgs.kg1.get_ent_id_set():
            ent_emb_id = self.embed_idx_dict[ent]
            self.kgs.kg1.insert_ent_embed_by_id(ent, embeddings[ent_emb_id, :])

        for ent in self.kgs.kg2.get_ent_id_set():
            ent_emb_id = self.embed_idx_dict[ent]
            self.kgs.kg2.insert_ent_embed_by_id(ent, embeddings[ent_emb_id, :])

        print(str(strftime("[%Y-%m-%d %H:%M:%S]: ", localtime())) + "Successfully binding entity embeddings")
        sys.stdout.flush()

    def feed_back_to_pr_module(self, mapping_feedback=True, embedding_feedback=True, beta=0.9):
        if mapping_feedback:
            self.mapping_feed_back_to_pr(beta)
        if embedding_feedback:
            self.embedding_feed_back_to_pr(beta)

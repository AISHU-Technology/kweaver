import gc
import math
import multiprocessing as mp
import random
import time
import torch
import torch.nn as nn
import numpy as np
from DataTransform.Utils.PRASEMap.utils.PRASEUtils import to_tensor
import torch.nn.functional as F
import scipy.sparse as sp


'''
Refactoring based on https://github.com/1049451037/GCN-Align
'''
_LAYER_UIDS = {}


# *******************************layers**************************
def get_layer_uid(layer_name=''):
    """Helper function, assigns unique layer IDs."""
    if layer_name not in _LAYER_UIDS:
        _LAYER_UIDS[layer_name] = 1
        return 1
    else:
        _LAYER_UIDS[layer_name] += 1
        return _LAYER_UIDS[layer_name]


def sparse_dropout(x, keep_prob, noise_shape):
    """Dropout for sparse tensors."""
    mask = ((torch.rand(x.values().size()) + keep_prob).floor()).type(torch.bool)
    rc = x.indices()[:, mask]
    val = x.values()[mask] * (1.0 / keep_prob)
    return torch.sparse.Tensor(rc, val)

def load_attr(ent_num, kgs):
    cnt = {}
    entity_attributes_dict = {**kgs.kg1.entity_attributes_dict, **kgs.kg2.entity_attributes_dict}
    for _, vs in entity_attributes_dict.items():
        for v in vs:
            if v not in cnt:
                cnt[v] = 1
            else:
                cnt[v] += 1
    fre = [(k, cnt[k]) for k in sorted(cnt, key=cnt.get, reverse=True)]
    print(fre)
    attr2id = {}
    num = int(0.7 * len(cnt))
    for i in range(num):
        attr2id[fre[i][0]] = i
    attr = np.zeros((ent_num, num), dtype=np.float32)
    for ent, vs in entity_attributes_dict.items():
        for v in vs:
            if v in attr2id:
                attr[ent][attr2id[v]] = 1.0
    return attr

class GraphConvolution(nn.Module):
    """Graph convolution layer. (featureless=True and transform=False) is not supported for now."""

    def __init__(self, input_dim, output_dim, support, dropout=0.,
                 sparse_inputs=False, act=torch.relu, bias=False,
                 featureless=False, transform=True, **kwargs):
        super(GraphConvolution, self).__init__()

        '''if dropout:
            self.dropout = placeholders['dropout']
        else:
            self.dropout = 0.'''
        self.dropout = 0.
        self.act = act
        self.support = support
        self.sparse_inputs = sparse_inputs
        self.featureless = featureless
        self.bias = bias
        self.transform = transform
        self.vars = {}
        # helper variable for sparse dropout
        self.num_features_nonzero = 0
        self.weight0 = None
        self.bias = self.zeros([output_dim])
        for i in range(len(self.support)):
            if input_dim == output_dim and not self.transform and not featureless:
                continue
            self.weight0 = self.trunc_normal([input_dim, output_dim])
        if self.bias:
            self.vars['bias'] = self.zeros([output_dim])

        '''if self.logging:
            self._log_vars()'''

    def trunc_normal(self, shape, name=None, normalize=True):
        tensor = torch.Tensor(shape[0], shape[1])
        with torch.no_grad():
            size = tensor.shape
            tmp = tensor.new_empty(size + (4,)).normal_()
            valid = (tmp < 2) & (tmp > -2)
            ind = valid.max(-1, keepdim=True)[1]
            tensor.data.copy_(tmp.gather(-1, ind).squeeze(-1))
            tensor.data.mul_(1.0 / math.sqrt(shape[0])).add_(0)
        # initial = tf.Variable(tf.truncated_normal(shape, stddev=1.0 / math.sqrt(shape[0])))
        if not normalize:
            return nn.Parameter(tensor)
        return nn.Parameter(F.normalize(tensor, 2, -1))

    def glorot(self, shape, name=None):
        """Glorot & Bengio (AISTATS 2010) init."""
        init_range = np.sqrt(6.0 / (shape[0] + shape[1]))
        t = torch.FloatTensor(shape[0], shape[1])
        tmp = nn.Parameter(t)
        nn.init.uniform_(tmp, -init_range, init_range)
        return tmp

    def zeros(self, shape, name=None):
        """All zeros."""
        initial = nn.Parameter(torch.FloatTensor(shape))
        nn.init.zeros_(initial)
        return initial

    def to_tensor_cpu(batch):
        return torch.from_numpy(np.array(batch))

    def sparse_to_tensor(sparse_mx):
        def to_tuple(mx):
            if not sp.isspmatrix_coo(mx):
                mx = mx.tocoo()
            coords = []
            coords.append(mx.row)
            coords.append(mx.col)
            # coords = np.vstack((mx.row, mx.col)).transpose()
            values = mx.data
            shape = mx.shape
            return torch.sparse_coo_tensor(to_tensor(coords), values, size=shape)
            # return coords, values, shape

        if isinstance(sparse_mx, list):
            for i in range(len(sparse_mx)):
                sparse_mx[i] = to_tuple(sparse_mx[i])
        else:
            sparse_mx = to_tuple(sparse_mx)

        return sparse_mx

    def forward(self, data):
        x = data['features']

        # dropout
        if self.dropout:
            if self.sparse_inputs:
                x = sparse_dropout(x, 1 - self.dropout, self.num_features_nonzero)
            else:
                x = torch.dropout(x, 1 - self.dropout, True)

        # convolve
        supports = list()
        output = None
        '''for i in range(len(self.support)):
            if 'weights_' + str(i) in self.vars:
                if not self.featureless:
                    pre_sup = torch.matmul(x, self.vars['weights_' + str(i)])
                else:
                    pre_sup = self.vars['weights_' + str(i)]
            else:
                pre_sup = x'''
        if self.weight0 is not None:
            if not self.featureless:
                pre_sup = torch.matmul(x, self.weight0)
            else:
                pre_sup = self.weight0
        else:
            pre_sup = x
        support = torch.matmul(data['support'].to(torch.float32), pre_sup)
        output = support
        supports.append(support)

        # bias
        if self.bias:
            output += self.vars['bias']

        return self.act(output)


def align_loss(outlayer, data, gamma, k):
    left = data['ILL0']
    right = data['ILL1']
    t = len(left)
    left_x = torch.index_select(outlayer, 0, to_tensor(left))
    right_x = torch.index_select(outlayer, 0, to_tensor(right))
    A = torch.sum(torch.abs(left_x - right_x), 1).unsqueeze(-1)
    neg_left = to_tensor(data['neg_left:0']).to(torch.int32)
    neg_right = to_tensor(data['neg_right:0']).to(torch.int32)
    neg_l_x = torch.index_select(outlayer, 0, neg_left)
    neg_r_x = torch.index_select(outlayer, 0, neg_right)
    B = torch.sum(torch.abs(neg_l_x - neg_r_x), 1).unsqueeze(-1)
    C = - B.view(t, k)
    D = A + gamma
    L1 = torch.relu(C + D.view(t, 1)).view(k * t, 1)
    neg_left = to_tensor(data['neg2_left:0']).to(torch.int32)
    neg_right = to_tensor(data['neg2_right:0']).to(torch.int32)
    neg_l_x = torch.index_select(outlayer, 0, neg_left)
    neg_r_x = torch.index_select(outlayer, 0, neg_right)
    B = torch.sum(torch.abs(neg_l_x - neg_r_x), 1).unsqueeze(-1)
    C = - B.view(t, k)
    L2 = torch.relu(C + D.view(t, 1)).view(k * t, 1)

    neg_feedback_left = to_tensor(data["feedback_neg_left:0"]).to(torch.int32)
    neg_feedback_right = to_tensor(data["feedback_neg_right:0"]).to(torch.int32)
    pos_feedback_left = to_tensor(data["feedback_pos_left:0"]).to(torch.int32)
    pos_feedback_right = to_tensor(data["feedback_pos_right:0"]).to(torch.int32)
    pos_f_l = torch.index_select(outlayer, 0, pos_feedback_left)
    pos_f_r = torch.index_select(outlayer, 0, pos_feedback_right)

    A2 = torch.sum(torch.abs(pos_f_l - pos_f_r), 1).unsqueeze(1)
    neg_f_l = torch.index_select(outlayer, 0, neg_feedback_left)
    neg_f_r = torch.index_select(outlayer, 0, neg_feedback_right)
    B2 = -torch.sum(torch.abs(neg_f_l - neg_f_r), 1).unsqueeze(1)
    D2 = A2 + gamma
    L3 = torch.relu(B2 + D2)

    L = torch.cat([L1, L2, L3], 0)

    return torch.mean(L)


# ***************************models****************************************
class GCN_Align_Unit(nn.Module):
    def __init__(self, support, input_dim, output_dim, sparse_inputs=False, featureless=True, neg_num=5, margin=3, **kwargs):
        super(GCN_Align_Unit, self).__init__()
        self.outputs = None
        # self.args = args
        self.layers = nn.ModuleList()
        # self.inputs = placeholders['features']
        self.input_dim = input_dim
        self.output_dim = output_dim
        self.support = support
        # self.ILL = ILL
        # self.layers = []
        self.activations = []
        self.sparse_inputs = sparse_inputs
        self.featureless = featureless
        self.neg_num = neg_num
        self.margin = margin
        self.gru1 = GraphConvolution(input_dim=self.input_dim,
                                     output_dim=self.output_dim,
                                     support=self.support,
                                     act=torch.relu,
                                     dropout=False,
                                     featureless=self.featureless,
                                     sparse_inputs=self.sparse_inputs,
                                     transform=False
                                     )
        self.gru2 = GraphConvolution(input_dim=self.output_dim,
                                     output_dim=self.output_dim,
                                     support=self.support,
                                     act=lambda x: x,
                                     dropout=False,
                                     transform=False
                                     )
        # print(list(self.gru1.parameters()))
        self.layers.append(self.gru1)
        self.layers.append(self.gru2)

    def loss(self, data):
        return align_loss(self.outputs, data, self.margin, self.neg_num)

    def forward(self, data):
        """ Wrapper for _build() """
        # Build sequential layer model
        hidden = self.layers[0](data)
        data['features'] = hidden
        self.outputs = self.layers[1](data)
        # Build metrics
        return self.loss(data)

    def get_output(self):
        return self.outputs.cpu().detach().numpy()


class GCN_Utils:
    def __init__(self, args, kgs):
        self.args = args
        self.kgs = kgs

    @staticmethod
    def sparse_to_tuple(sparse_mx):
        def to_tuple(mx):
            if not sp.isspmatrix_coo(mx):
                mx = mx.tocoo()
            coords = np.vstack((mx.row, mx.col)).transpose()
            values = mx.data
            shape = mx.shape
            return coords, values, shape

        if isinstance(sparse_mx, list):
            for i in range(len(sparse_mx)):
                sparse_mx[i] = to_tuple(sparse_mx[i])
        else:
            sparse_mx = to_tuple(sparse_mx)

        return sparse_mx

    @staticmethod
    def sparse_to_tensor(sparse_mx):
        def to_tuple(mx):
            if not sp.isspmatrix_coo(mx):
                mx = mx.tocoo()
            coords = []
            coords.append(mx.row)
            coords.append(mx.col)
            # coords = np.vstack((mx.row, mx.col)).transpose()
            values = mx.data
            shape = mx.shape
            return torch.sparse_coo_tensor(to_tensor(coords), values, size=shape)
            # return coords, values, shape

        if isinstance(sparse_mx, list):
            for i in range(len(sparse_mx)):
                sparse_mx[i] = to_tuple(sparse_mx[i])
        else:
            sparse_mx = to_tuple(sparse_mx)

        return sparse_mx

    @staticmethod
    def normalize_adj(adj):
        """Symmetrically normalize adjacency matrix."""
        adj = sp.coo_matrix(adj)
        rowsum = np.array(adj.sum(1))
        d_inv_sqrt = np.power(rowsum, -0.5).flatten()
        d_inv_sqrt[np.isinf(d_inv_sqrt)] = 0.
        d_mat_inv_sqrt = sp.diags(d_inv_sqrt)
        return adj.dot(d_mat_inv_sqrt).transpose().dot(d_mat_inv_sqrt).tocoo()

    def preprocess_adj(self, adj):
        """Preprocessing of adjacency matrix for simple GCN model and conversion to tuple representation."""
        adj_normalized = self.normalize_adj(adj + sp.eye(adj.shape[0]))
        return self.sparse_to_tensor(adj_normalized)

    @staticmethod
    def construct_feed_dict(features, support, placeholders):
        """Construct feed dictionary for GCN-Align."""
        feed_dict = dict()
        feed_dict.update({placeholders['features']: features})
        feed_dict.update({placeholders['support'][i]: support[i] for i in range(len(support))})
        return feed_dict

    @staticmethod
    def func(triples):
        head = {}
        cnt = {}
        for tri in triples:
            if tri[1] not in cnt:
                cnt[tri[1]] = 1
                head[tri[1]] = {tri[0]}
            else:
                cnt[tri[1]] += 1
                head[tri[1]].add(tri[0])
        r2f = {}
        for r in cnt:
            r2f[r] = len(head[r]) / cnt[r]
        return r2f

    @staticmethod
    def ifunc(triples):
        tail = {}
        cnt = {}
        for tri in triples:
            if tri[1] not in cnt:
                cnt[tri[1]] = 1
                tail[tri[1]] = {tri[2]}
            else:
                cnt[tri[1]] += 1
                tail[tri[1]].add(tri[2])
        r2if = {}
        for r in cnt:
            r2if[r] = len(tail[r]) / cnt[r]
        return r2if

    def get_weighted_adj(self, e, KG):
        r2f = self.func(KG)
        r2if = self.ifunc(KG)
        M = {}
        for tri in KG:
            if tri[0] == tri[2]:
                continue
            if (tri[0], tri[2]) not in M:
                M[(tri[0], tri[2])] = max(r2if[tri[1]], 0.3)
            else:
                M[(tri[0], tri[2])] += max(r2if[tri[1]], 0.3)
            if (tri[2], tri[0]) not in M:
                M[(tri[2], tri[0])] = max(r2f[tri[1]], 0.3)
            else:
                M[(tri[2], tri[0])] += max(r2f[tri[1]], 0.3)
        row = []
        col = []
        data = []
        for key in M:
            row.append(key[1])
            col.append(key[0])
            data.append(M[key])
        indice = []
        indice.append(row)
        indice.append(col)
        # return torch.sparse_coo_tensor(to_tensor(indice), data, size=[e, e])
        return sp.coo_matrix((data, (row, col)), shape=(e, e))

    def get_ae_input(self, attr):
        return self.sparse_to_tuple(sp.coo_matrix(attr))

    def load_data(self, attr):
        ae_input = self.get_ae_input(attr)
        triples = self.kgs.kg1.relation_triples_list + self.kgs.kg2.relation_triples_list
        adj = self.get_weighted_adj(self.kgs.entities_num, triples)
        train = np.array(self.kgs.train_links)
        return adj, ae_input, train




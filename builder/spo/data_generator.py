# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn

# from keras.layers import *
import numpy as np
class dataGenerator:
    """数据生成器模版
    """
    def __init__(self, data, tokenizer, maxlen, predicate2id,batch_size=32):
        self.tokenizer = tokenizer
        self.maxlen = maxlen
        self.predicate2id = predicate2id
        self.data = data
        self.batch_size = batch_size
        self.steps = len(self.data) // self.batch_size
        if len(self.data) % self.batch_size != 0:
            self.steps += 1

    def __len__(self):
        return self.steps

    def __iter__(self, random=False):
        idxs = list(range(len(self.data)))
        if random:
            np.random.shuffle(idxs)
        batch_token_ids, batch_segment_ids = [], []
        batch_subject_labels, batch_subject_ids, batch_object_labels = [], [], []
        for i in idxs:
            d = self.data[i]
            tokenized_inputs = self.tokenizer(d['text'], max_length=self.maxlen)
            input_ids, attention_mask = tokenized_inputs.input_ids, tokenized_inputs.attention_mask
            # token_ids, segment_ids= self.tokenizer.encode(d['text'], max_length=self.maxlen)
            # 整理三元组 {s: [(o, p)]}
            spoes = {}
            for s, p, o in d['spo_list']:
                s = self.tokenizer(s)[1:-1]
                p = self.predicate2id[p]
                o = self.tokenizer(o)[1:-1]
                # s_idx = search(s, token_ids)
                # o_idx = search(o, token_ids)
                s_idx = search(s, input_ids)
                o_idx = search(o, input_ids)
                if s_idx != -1 and o_idx != -1:
                    s = (s_idx, s_idx + len(s) - 1)
                    o = (o_idx, o_idx + len(o) - 1, p)
                    if s not in spoes:
                        spoes[s] = []
                    spoes[s].append(o)
            if spoes:
                # subject标签
                subject_labels = np.zeros((len(input_ids), 2))
                for s in spoes:
                    subject_labels[s[0], 0] = 1
                    subject_labels[s[1], 1] = 1
                # 随机选一个subject
                start, end = np.array(list(spoes.keys())).T
                start = np.random.choice(start)
                end = np.random.choice(end[end >= start])
                subject_ids = (start, end)
                # 对应的object标签
                object_labels = np.zeros((len(input_ids), len(self.predicate2id), 2))
                for o in spoes.get(subject_ids, []):
                    object_labels[o[0], o[2], 0] = 1
                    object_labels[o[1], o[2], 1] = 1
                # 构建batch
                batch_token_ids.append(input_ids)
                batch_segment_ids.append(attention_mask)
                batch_subject_labels.append(subject_labels)
                batch_subject_ids.append(subject_ids)
                batch_object_labels.append(object_labels)
                if len(batch_token_ids) == self.batch_size or i == idxs[-1]:
                    batch_token_ids = sequence_padding(batch_token_ids)
                    batch_segment_ids = sequence_padding(batch_segment_ids)
                    batch_subject_labels = sequence_padding(batch_subject_labels, padding=np.zeros(2))
                    batch_subject_ids = np.array(batch_subject_ids)
                    batch_object_labels = sequence_padding(batch_object_labels,
                                                           padding=np.zeros((len(self.predicate2id), 2)))
                    yield [
                              batch_token_ids, batch_segment_ids,
                              batch_subject_labels, batch_subject_ids, batch_object_labels
                          ], None
                    batch_token_ids, batch_segment_ids = [], []
                    batch_subject_labels, batch_subject_ids, batch_object_labels = [], [], []

    def forfit(self):
        while True:
            for d in self.__iter__(True):
                yield d

# 让每条文本的长度相同，用0填充
def sequence_padding(inputs, length=None, padding=0):
    """Numpy函数，将序列padding到同一长度
    """
    if length is None:
        length = max([len(x) for x in inputs])

    outputs = np.array([
        np.concatenate([x, [padding] * (length - len(x))])
        if len(x) < length else x[:length] for x in inputs
    ])
    return outputs

def search(pattern, sequence):
    """从sequence中寻找子串pattern
    如果找到，返回第一个下标；否则返回-1。
    """
    n = len(pattern)
    for i in range(len(sequence)):
        if sequence[i:i + n] == pattern:
            return i
    return -1




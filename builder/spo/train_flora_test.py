# -*-coding:utf-8-*-

import time
import json
from tqdm import tqdm
import numpy as np
from transformers import BertTokenizerFast, AdamW
from transformers import BertModel, BertPreTrainedModel
import torch
import torch.nn as nn
import configparser

config = configparser.ConfigParser()
config.read("./../config/config.ini")

# 获取所有section
sections = config.sections()
# 获取特定section
items = config.items('bert')# 返回结果为元组
# 可以通过dict方法转换为字典
bert_items = dict(items)
bert_base = bert_items["bert_base"]
config_path = r"" + bert_items["config_path"]
checkpoint_path = r"" + bert_items["checkpoint_path"]
dict_path = r"" + bert_items["dict_path"]


data_items = config.items('data')
data_items = dict(data_items)

model_items = config.items('model')
model_items = dict(model_items)
maxlen = model_items["maxlen"]




class SubjectModel(BertPreTrainedModel):
    def __init__(self, config):
        super().__init__(config)
        self.bert = BertModel(config)
        self.dense = nn.Linear(config.hidden_size, 2)

    def forward(self,
                input_ids,
                attention_mask=None):
        output = self.bert(input_ids, attention_mask=attention_mask)
        subject_out = self.dense(output[0])
        subject_out = torch.sigmoid(subject_out)

        return output[0], subject_out


class ObjectModel_a(nn.Module):
    def __init__(self, subject_model,predicate2id_num):
        super().__init__()
        self.encoder = subject_model
        self.dense_subject_position = nn.Linear(2, 768)
        self.predicate2id_num = predicate2id_num
        self.dense_object = nn.Linear(768, predicate2id_num * 2)

    def forward(self,
                input_ids,
                subject_position,
                attention_mask=None,
                ):
        output, subject_out = self.encoder(input_ids, attention_mask)
        subject_position = self.dense_subject_position(subject_position).unsqueeze(1)
        object_out = output + subject_position
        # [bs, 768] -> [bs, 98]
        object_out = self.dense_object(object_out)
        # [bs, 98] -> [bs, 49, 2]
        object_out = torch.reshape(object_out, (object_out.shape[0], object_out.shape[1], self.predicate2id_num, 2)) #schemas类别数
        object_out = torch.sigmoid(object_out)
        object_out = torch.pow(object_out, 4)
        return subject_out,object_out


class ObjectModel(nn.Module):
    def __init__(self, subject_model,predicate2id_num):
        super().__init__()
        self.encoder = subject_model
        self.dense_subject_position = nn.Linear(2, 768)
        self.predicate2id_num = predicate2id_num
        self.dense_object = nn.Linear(768, predicate2id_num * 2)

    def forward(self,
                input_ids,
                subject_position,
                attention_mask=None,
                ):
        output, subject_out = self.encoder(input_ids, attention_mask)
        subject_position = self.dense_subject_position(subject_position).unsqueeze(1)
        object_out = output + subject_position
        # [bs, 768] -> [bs, 98]
        object_out = self.dense_object(object_out)
        # [bs, 98] -> [bs, 49, 2]
        object_out = torch.reshape(object_out, (object_out.shape[0], object_out.shape[1], self.predicate2id_num, 2)) #schemas类别数
        object_out = torch.sigmoid(object_out)
        object_out = torch.pow(object_out, 4)
        return subject_out,object_out

class SPO(tuple):
    """用来存三元组的类
    表现跟tuple基本一致，只是重写了 __hash__ 和 __eq__ 方法，
    使得在判断两个三元组是否等价时容错性更好。
    """

    def __init__(self, spo):
        self.spox = (
            spo[0],
            spo[1],
            spo[2],
        )

    def __hash__(self):
        return self.spox.__hash__()

    def __eq__(self, spo):
        return self.spox == spo.spox


def init_schemas(schema_path):
    predicate2id, id2predicate = {}, {}
    with open(schema_path, encoding='utf-8') as f:
        for l in f:
            l = json.loads(l)
            if l['predicate'] not in predicate2id:
                id2predicate[str(len(predicate2id))] = l['predicate']
                predicate2id[l['predicate']] = len(predicate2id)
    return predicate2id, id2predicate


def load_data(filename):
    D = []
    with open(filename, encoding='utf-8') as f:
        for l in f:
            l = json.loads(l)
            D.append({
                'text': l['text'],
                'spo_list': [
                    (spo['subject'], spo['predicate'], spo['object'])
                    for spo in l['spo_list']
                ]
            })
    return D


# def init_schemas_spodata():
#     schemas ='/mnt/datasets_LM/spo_data/data/schemas.json'
#     with open(schemas, encoding='utf-8') as f:
#         json_list = json.load(f)
#         id2predicate = json_list[0]
#         predicate2id = json_list[1]
# def load_data_spodata(filename):
#     """加载数据/mnt/datasets_LM/spo_data
#     单条格式：{'text': text, 'spo_list': [[s, p, o],[s, p, o]]}
#     """
#     with open(filename, encoding='utf-8') as f:
#         json_list = json.load(f)
#     return json_list


# 初始化配置和模型
GPU_NUM = 0
device = torch.device(f'cuda:{GPU_NUM}') if torch.cuda.is_available() else torch.device('cpu')
epoch_num = 1
batch_size = 8
maxlen = 128
learning_rate = 5e-5



class train_class(object):
    def __init__(self,model_name):
        if model_name == "Generalmodel":
            schema_path = data_items["bd_schemas"]
            self.model_path = model_items["ai_model_path"]
        if model_name == "AImodel":
            schema_path = data_items["ai_schema"]
            self.model_path = model_items["bd_model_path"]

        self.predicate2id, self.id2predicate = init_schemas(schema_path)

        self.tokenizer = BertTokenizerFast.from_pretrained(bert_base)
        self.subject_model = SubjectModel.from_pretrained(bert_base).to(device)
        self.model = ObjectModel(self.subject_model, len(self.predicate2id)).to(device)
        self.optim = AdamW(self.model.parameters(), lr=learning_rate)
        self.loss_func = torch.nn.BCELoss()
        self.vocab = {}
        with open(bert_base + 'vocab.txt', encoding='utf_8')as file:
            for l in file.readlines():
                self.vocab[len(self.vocab)] = l.strip()


    def search(self,pattern, sequence):
        """从sequence中寻找子串pattern
        如果找到，返回第一个下标；否则返回-1。
        """
        n = len(pattern)
        for i in range(len(sequence)):
            if sequence[i:i + n] == pattern:
                return i
        return -1


    def sequence_padding(self,inputs, length=None, padding=0, mode='post'):
        """Numpy函数，将序列padding到同一长度
        """
        if length is None:
            length = max([len(x) for x in inputs])

        pad_width = [(0, 0) for _ in np.shape(inputs[0])]
        outputs = []
        for x in inputs:
            x = x[:length]
            if mode == 'post':
                pad_width[0] = (0, length - len(x))
            elif mode == 'pre':
                pad_width[0] = (length - len(x), 0)
            else:
                raise ValueError('"mode" argument must be "post" or "pre".')
            x = np.pad(x, pad_width, 'constant', constant_values=padding)
            outputs.append(x)

        return np.array(outputs)


    def data_generator(self,data, batch_size=batch_size):
        batch_input_ids, batch_attention_mask = [], []
        batch_subject_labels, batch_subject_ids, batch_object_labels = [], [], []
        texts = []
        for i, d in enumerate(data):
            text = d['text']
            texts.append(text)
            encoding = self.tokenizer(text=text)
            input_ids, attention_mask = encoding.input_ids, encoding.attention_mask
            # 整理三元组 {s: [(o, p)]}
            spoes = {}
            for s, p, o in d['spo_list']:
                # cls x x x sep
                s_encoding = self.tokenizer(text=s).input_ids[1:-1]
                o_encoding = self.tokenizer(text=o).input_ids[1:-1]
                # 找对应的s与o的起始位置
                s_idx = self.search(s_encoding, input_ids)
                o_idx = self.search(o_encoding, input_ids)
                # p = p.replace("_@value", "")
                p = self.predicate2id[p]

                if s_idx != -1 and o_idx != -1:
                    s = (s_idx, s_idx + len(s_encoding) - 1)
                    o = (o_idx, o_idx + len(o_encoding) - 1, p)
                    if s not in spoes:
                        spoes[s] = []
                    spoes[s].append(o)
            if spoes:
                # subject标签
                subject_labels = np.zeros((len(input_ids), 2))
                for s in spoes:
                    # 注意要+1，因为有cls符号
                    subject_labels[s[0], 0] = 1
                    subject_labels[s[1], 1] = 1
                # 一个s对应多个o时，随机选一个subject
                start, end = np.array(list(spoes.keys())).T
                start = np.random.choice(start)
                # end = np.random.choice(end[end >= start])
                end = end[end >= start][0]
                subject_ids = (start, end)
                # 对应的object标签
                object_labels = np.zeros((len(input_ids), len(self.predicate2id), 2))
                for o in spoes.get(subject_ids, []):
                    object_labels[o[0], o[2], 0] = 1
                    object_labels[o[1], o[2], 1] = 1
                # 构建batch
                batch_input_ids.append(input_ids)
                batch_attention_mask.append(attention_mask)
                batch_subject_labels.append(subject_labels)
                batch_subject_ids.append(subject_ids)
                batch_object_labels.append(object_labels)
                if len(batch_subject_labels) == batch_size or i == len(data) - 1:
                    batch_input_ids = self.sequence_padding(batch_input_ids)
                    batch_attention_mask = self.sequence_padding(batch_attention_mask)
                    batch_subject_labels = self.sequence_padding(batch_subject_labels)
                    batch_subject_ids = np.array(batch_subject_ids)
                    batch_object_labels = self.sequence_padding(batch_object_labels)
                    yield [
                              torch.from_numpy(batch_input_ids).long(), torch.from_numpy(batch_attention_mask).long(),
                              torch.from_numpy(batch_subject_labels), torch.from_numpy(batch_subject_ids),
                              torch.from_numpy(batch_object_labels)
                          ]
                    batch_input_ids, batch_attention_mask = [], []
                    batch_subject_labels, batch_subject_ids, batch_object_labels = [], [], []


    def train_loop(self,train_generator):

        self.model.train()
        pbar = tqdm(train_generator)
        train_loss = 0.
        for step, batch in enumerate(pbar):
            input_ids = batch[0].to(device)
            attention_mask = batch[1].to(device)
            subject_labels = batch[2].to(device)
            subject_ids = batch[3].to(device)
            object_labels = batch[4].to(device)
            subject_out, object_out = self.model(input_ids, subject_ids.float(), attention_mask)
            subject_out = subject_out * attention_mask.unsqueeze(-1)
            object_out = object_out * attention_mask.unsqueeze(-1).unsqueeze(-1)

            subject_loss = self.loss_func(subject_out, subject_labels.float())
            object_loss = self.loss_func(object_out, object_labels.float())

            # subject_loss = torch.mean(subject_loss, dim=2)
            # subject_loss = torch.sum(subject_loss * attention_mask) / torch.sum(attention_mask)

            loss = subject_loss + object_loss
            train_loss += loss.item()

            self.optim.zero_grad()
            loss.backward()
            self.optim.step()
            # lr_scheduler.step()
            pbar.update()
            pbar.set_description(f'train loss:{loss.item()}')


        return train_loss


    def eval_loop(self,model,eval_loader,predict=False):

        model.eval()
        # if predict:
        subject_model = model.encoder
        with torch.no_grad():
            X, Y, Z = 1e-10, 1e-10, 1e-10
            pbar = tqdm(eval_loader)
            for data in pbar:
                spo_pred = []
                text = data['text']
                spo_ori = data['spo_list']
                en = self.tokenizer(text=text, return_tensors='pt')
                _, subject_preds = subject_model(en.input_ids.to(device), en.attention_mask.to(device))
                subject_preds = subject_preds.cpu().data.numpy()
                start = np.where(subject_preds[0, :, 0] > 0.6)[0]
                end = np.where(subject_preds[0, :, 1] > 0.5)[0]

                subjects = []
                for i in start:
                    j = end[end >= i]
                    if len(j) > 0:
                        j = j[0]
                        subjects.append((i, j))
                # print(subjects)
                if subjects:
                    for s in subjects:
                        index = en.input_ids.cpu().data.numpy().squeeze(0)[s[0]:s[1] + 1]
                        subject = ''.join([self.vocab[i] for i in index])
                        # print(subject)
                        _, object_preds = model(en.input_ids.to(device),
                                                torch.from_numpy(np.array([s])).float().to(device),
                                                en.attention_mask.to(device))
                        object_preds = object_preds.cpu().data.numpy()
                        for object_pred in object_preds:
                            start = np.where(object_pred[:, :, 0] > 0.2)
                            end = np.where(object_pred[:, :, 1] > 0.2)
                            for _start, predicate1 in zip(*start):
                                for _end, predicate2 in zip(*end):
                                    if _start <= _end and predicate1 == predicate2:
                                        index = en.input_ids.cpu().data.numpy().squeeze(0)[_start:_end + 1]
                                        object = ''.join([self.vocab[i] for i in index])
                                        predicate = self.id2predicate[str(predicate1)]
                                        # print(object, '\t', predicate)
                                        spo_pred.append([subject, predicate, object])
                    # print('text:', text, spo_pred)

                    R = set([SPO(_spo) for _spo in spo_pred])# 预测结果
                    T = set([SPO(_spo) for _spo in spo_ori])# 真实结果
                    X += len(R & T) # 交集
                    Y += len(R)
                    Z += len(T)
            f1, precision, recall = 2 * X / (Y + Z), X / Y, X / Z
            pbar.update()
            pbar.set_description('f1: %.5f, precision: %.5f, recall: %.5f' % (f1, precision, recall))
            pbar.close()
            print('f1:', f1, 'precision:', precision, 'recall:', recall)
            return {'f1:', f1, 'precision:', precision, 'recall:', recall}


    def train_run(self,train_generator,eval_data,checkpoint_save=None):



        start_time = time.time()
        for epoch in range(epoch_num):
            print('************start train************')
            train_loss = self.train_loop(train_generator)

            # print('************start eval************')
            # metrics = eval_loop(model,eval_data)

        if checkpoint_save:
        #     torch.save(self.model, checkpoint_save)
            self.subject_model.save_pretrained("/mnt/flora_hu/pytorh_save")

        print("end",time.time()-start_time)


    def predict_run(self,model_ckpt,eval_data):

        model_fintune = torch.load(model_ckpt)
        metrics = self,self.eval_loop(model_fintune,eval_data,predict=True)


if __name__ == '__main__':
    # 加载数据集,训练模型


    # train_file = '/mnt/datasets_LM/spo_data/data/train.json'
    # dev_file = '/mnt/datasets_LM/spo_data/data/dev.json'
    train_file = '/mnt/datasets_LM/1AImodel_datasets/ai_train_data.json'
    eval_file = '/mnt/datasets_LM/1AImodel_datasets/ai_dev_data.json'
    # train_file = '/mnt/datasets_LM/1Generalmodel_datasets/train_data2020.json'
    # eval_file = '/mnt/datasets_LM/1Generalmodel_datasets/dev_data2020.json'

    # train_file = r"" + data_items["ai_train_data"]
    # eval_file = r"" + data_items["ai_valid_data"]
    # train_file = r"" + data_items["bd_train_data"]
    # eval_file = r"" + data_items["bd_valid_data"]

    train_data = load_data(train_file)
    eval_data = load_data(eval_file)

    # model_name = "Generalmodel"
    model_name = "AImodel"
    train_ins = train_class(model_name)
    train_generator = train_ins.data_generator(train_data, batch_size=batch_size)
    eval_generator = train_ins.data_generator(eval_data, batch_size=batch_size)

    # train
    checkpoint_save = train_ins.model_path
    train_ins.train_run(train_generator,eval_data,checkpoint_save)

    # predict_test
    # model_ckpt = train_ins.model_path
    # train_ins.predict_run(model_ckpt,eval_data)


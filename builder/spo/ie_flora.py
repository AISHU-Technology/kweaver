# -*-coding:utf-8-*-
# @Time    : 2022/7/27
# @Author  : flora_hu

import json
import numpy as np
import requests
import configparser
from tqdm import tqdm

from transformers import  BertTokenizerFast
import torch
from spo.train_flora import SubjectModel,ObjectModel#加载模型使用，不能删除

config = configparser.ConfigParser()
config.read("./../config/config.ini")

# 获取所有section
sections = config.sections()
# 获取特定section
items = config.items('bert')# 返回结果为元组
# 可以通过dict方法转换为字典
data_items = config.items('data')
data_items = dict(data_items)

model_items = config.items('model')
model_items = dict(model_items)
maxlen = model_items["maxlen"]
batch_size = model_items["batch_size"]

bert_items = dict(items)
bert_base = bert_items["bert_base"]
config_path = r"" + bert_items["config_path"]
checkpoint_path = r"" + bert_items["checkpoint_path"]
dict_path = r"" + bert_items["dict_path"]


vocab = {}
with open(bert_items["dict_path"], encoding='utf_8')as file:
    for l in file.readlines():
        vocab[len(vocab)] = l.strip()

GPU_NUM = 0
device = torch.device(f'cuda:{GPU_NUM}') if torch.cuda.is_available() else torch.device('cpu')
print("devide",device)


# 这两个class不能删、不能删，删了加载模型将报错
# class SubjectModel:
#     pass
# class ObjectModel:
#     pass



def extract_spoes(text,dict_path,subject_model,model,id2predicate):
    """抽取输入text所包含的三元组
    """
    subject_model.eval()
    model.eval()
    tokenizer = BertTokenizerFast.from_pretrained(bert_items["bert_base"])
    en = tokenizer(text=text, truncation=True, max_length=int(maxlen), return_tensors='pt')
    _, subject_preds = subject_model(en.input_ids.to(device), en.attention_mask.to(device))
    subject_preds = subject_preds.cpu().data.numpy()
    start = np.where(subject_preds[0, :, 0] > 0.6)[0]
    end = np.where(subject_preds[0, :, 1] > 0.5)[0]

    spo_pred = []
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
            subject = ''.join([vocab[i] for i in index])
            # print(subject)
            _, object_preds = model(en.input_ids.to(device),
                                    torch.from_numpy(np.array([s])).float().to(device),
                                    en.attention_mask.to(device))
            object_preds = object_preds.cpu().data.numpy()
            for object_pred in object_preds:
                start = np.where(object_pred[:, :, 0] > 0.6)
                end = np.where(object_pred[:, :, 1] > 0.5)
                for _start, predicate1 in zip(*start):
                    for _end, predicate2 in zip(*end):
                        if _start <= _end and predicate1 == predicate2:
                            index = en.input_ids.cpu().data.numpy().squeeze(0)[_start:_end + 1]
                            object = ''.join([vocab[i] for i in index])
                            predicate = id2predicate[str(predicate1)]
                            # print(object, '\t', predicate)
                            spo_pred.append((subject, predicate, object))
                        # print('text:', text, spo_pred)
    return spo_pred


class Extract_SPO(object):
    def __init__(self,model_name):
        if model_name=="Generalmodel":
            self.schema_path=data_items["bd_schemas"]
            print(self.schema_path)
        if model_name == "AImodel":
            self.schema_path = data_items["ai_schema"]
        # self.config_path=bert_items["config_path"]
        # self.checkpoint_path=bert_items["checkpoint_path"]
        self.dict_path=bert_items["dict_path"]
        self.predicate2id, self.id2predicate = {}, {}
        with open(self.schema_path,"r", encoding='utf-8') as f:
            for l in f.readlines():
                l = json.loads(l)
                if l['predicate'] not in self.predicate2id:
                    self.id2predicate[str(len(self.predicate2id))] = l['predicate']
                    self.predicate2id[l['predicate']] = len(self.predicate2id)

        if model_name=="Generalmodel":
            modelpath="bd_model_path"
            modelpath = config.get("model", modelpath)
            print(modelpath)
        if model_name=="AImodel":
            modelpath="ai_model_path"
            modelpath = config.get("model", modelpath)
            print(modelpath)
        if torch.cuda.is_available():
            map_location = lambda storage, loc: storage.cuda()
        else:
            map_location = 'cpu'
        self.model = torch.load(modelpath,map_location=map_location)
        self.subject_model = self.model.encoder

    def extract_spo(self, text):
        result_list=[]
        if "\r\n" in text:
            data = text.split("\r\n")
        else:
            # if "\r" in text:
            #     data = text.split("\r")
            if "\n" in text:
                data = text.split("\n")
            else :
                data= text
        if isinstance(data,str):
            result = extract_spoes(data, self.dict_path, self.subject_model, self.model, self.id2predicate)
            # print(text,result)
            result_list.extend(result)
        else:
            for one in data:
                if one!="":
                    sentences=one.split("。")
                    if isinstance(sentences, str):
                        result = extract_spoes(sentences, self.dict_path, self.subject_model, self.model,
                                               self.id2predicate)
                        result_list.extend(result)
                    else:
                        for sentence in sentences:
                            result = extract_spoes(sentence,self.dict_path,self.subject_model,self.model,self.id2predicate)
                            result_list.extend(result)
        return result_list

    def extract_text(self, ds_address,ds_port,docid,esapi):
        ds_address=ds_address.replace("https","http")
        url=esapi.format(ds_address,ds_port,docid)
        headers = {
            'Content-Type': 'application/json'
        }
        response = requests.request("GET", url, headers=headers, timeout=10, verify=False)
        resp_json = response.json()
        text=resp_json['_source']['content']
        return text



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


if __name__ == '__main__':

    # 179测试环境数据加载
    # train_file = '/mnt/datasets_LM/1AImodel_datasets/ai_train_data.json'
    # eval_file = '/mnt/datasets_LM/1AImodel_datasets/ai_dev_data.json'

    # 正式上线加载文件,test AImodel
    SPO = Extract_SPO("AImodel")
    train_file = r"" + data_items["ai_train_data"]
    eval_file = r"" + data_items["ai_valid_data"]
    train_data = load_data(train_file)
    eval_data = load_data(eval_file)
    for data in tqdm(eval_data):
        spo_pred = []
        text = data['text']
        spo_ori = data['spo_list']
        spo_list = SPO.extract_spo(text)
        print(spo_list,text)


    # test Generalmodel
    # SPO = Extract_SPO("Generalmodel")
    # train_file = r"" + data_items["bd_train_data"]
    # eval_file = r"" + data_items["bd_valid_data"]
    # train_data = load_data(train_file)
    # eval_data = load_data(eval_file)
    # for data in tqdm(eval_data):
    #     spo_pred = []
    #     text = data['text']
    #     spo_ori = data['spo_list']
    #     spo_list = SPO.extract_spo(text)
    #     print(spo_list, text)


    # # lodad model test
    # modelpath = "ai_model_path"
    # modelpath = config.get("model", modelpath)
    # print(modelpath)
    # if torch.cuda.is_available():
    #     map_location = lambda storage, loc: storage.cuda()
    # else:
    #     map_location = 'cpu'
    #
    # model = torch.load(modelpath, map_location=map_location)

    # for name, param in model.named_parameters():  # 查看可优化的参数有哪些
    #     # if param.requires_grad:
    #         print(name)
    # for name in model.state_dict():
    #     print(name)
    # print("_________________")
    #
    # subject_model = model.encoder
    # for name in subject_model.state_dict():
    #     print(name)
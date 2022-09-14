

import time
import json
from tqdm import tqdm
import numpy as np
from transformers import BertTokenizer, BertTokenizerFast, AdamW,get_scheduler
from transformers import BertModel, BertPreTrainedModel
import torch
import torch.nn as nn
import configparser



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




bert_base='/flora_code/tttt/bert-base-chinese'
subject_model = SubjectModel.from_pretrained(bert_base)
tokenizer = BertTokenizerFast.from_pretrained(bert_base)

text='DJI大疆农业2020新品发布会”发布会在石家庄市海淀区宋庆龄青少年文化交流中心召开'
text2='欧博思在德国慕尼黑举办工业机器人高校科技成果发布会以及欧博思智慧屏、欧博思智能手表等产品'

# print(tokenizer.encode(text,return_tensors="pt"))
# encoded_sequence = tokenizer(text=text)
# print(type(encoded_sequence),encoded_sequence)
# tokenized_sequence = tokenizer.tokenize(text)
# print(tokenized_sequence)
# decoded_sequence = tokenizer.decode(encoded_sequence['input_ids'])
# print(decoded_sequence,'\n',text)

# padded_sequences = tokenizer([text, text2], padding=True)
# print('padded_sequences',padded_sequences)
#
# encoded_dict = tokenizer(text, text2)
# print('encoded_dict',encoded_dict)
# decoded = tokenizer.decode(encoded_dict["input_ids"])
# print(decoded)


sequence = "Hugging Face Inc. is a company based in New York City. Its headquarters are in DUMBO, therefore very" "close to the Manhattan Bridge."
print("tokenizer.encode",tokenizer.encode(sequence))
print("tokenizer.decode",tokenizer.decode(tokenizer.encode(sequence)))
tokens = tokenizer.tokenize(tokenizer.decode(tokenizer.encode(sequence)))
print("tokenizer.tokenize",tokens)
print("tokenizer()",tokenizer(sequence))
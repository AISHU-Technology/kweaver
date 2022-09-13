# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn

from spo.bert_keras.layers import LayerNormalization
from spo.bert_keras.bert import build_bert_model
from spo.bert_keras.optimizers import Adam
from keras.layers import *
from keras.models import Model
from spo.bert_keras.backend import keras, K, batch_gather

def extrac_subject(inputs):
    """根据subject_ids从output中取出subject的向量表征
    """
    output, subject_ids = inputs
    subject_ids = K.cast(subject_ids, 'int32')
    start = batch_gather(output, subject_ids[:, :1])
    end = batch_gather(output, subject_ids[:, 1:])
    subject = K.concatenate([start, end], 2)
    return subject[:, 0]

import json
import configparser
# file = r'config.ini'
# # 创建配置文件对象
# con = configparser.ConfigParser()
#
# # 读取文件
# con.read(file, encoding='utf-8')
# # 获取所有section
# sections = con.sections()
# print(sections)
# # ['data', 'bert']
# data_items = con.items('data')
# data_items = dict(data_items)
# schema_path = r"" + data_items["bd_schemas"]

def build_bert(nclass,config_path,checkpoint_path,predicate2id):

    # 补充输入
    subject_labels = Input(shape=(None, 2), name='Subject-Labels')
    subject_ids = Input(shape=(2,), name='Subject-Ids')
    object_labels = Input(shape=(None, len(predicate2id), 2), name='Object-Labels')

    # 加载预训练模型
    bert = build_bert_model(
        config_path=config_path,
        checkpoint_path=checkpoint_path,
        return_keras_model=False,
    )

    # 预测subject
    output = Dense(units=nclass,
                   activation='sigmoid',
                   kernel_initializer=bert.initializer)(bert.model.output)
    subject_preds = Lambda(lambda x: x ** 2)(output)

    subject_model = Model(bert.model.inputs, subject_preds)

    # 传入subject，预测object
    # 通过Conditional Layer Normalization将subject融入到object的预测中
    output = bert.model.layers[-2].get_output_at(-1)
    subject = Lambda(extrac_subject)([output, subject_ids])
    output = LayerNormalization(conditional=True)([output, subject])
    output = Dense(units=len(predicate2id) * 2,
                   activation='sigmoid',
                   kernel_initializer=bert.initializer)(output)
    output = Reshape((-1, len(predicate2id), 2))(output)
    object_preds = Lambda(lambda x: x ** 4)(output)

    object_model = Model(bert.model.inputs + [subject_ids], object_preds)

    # 训练模型
    train_model = Model(bert.model.inputs + [subject_labels, subject_ids, object_labels],
                        [subject_preds, object_preds])

    mask = bert.model.get_layer('Sequence-Mask').output_mask

    subject_loss = K.binary_crossentropy(subject_labels, subject_preds)
    subject_loss = K.mean(subject_loss, 2)
    subject_loss = K.sum(subject_loss * mask) / K.sum(mask)

    object_loss = K.binary_crossentropy(object_labels, object_preds)
    object_loss = K.sum(K.mean(object_loss, 3), 2)
    object_loss = K.sum(object_loss * mask) / K.sum(mask)

    train_model.add_loss(subject_loss + object_loss)
    train_model.compile(optimizer=Adam(1e-5))
    subject_model.summary()
    object_model.summary()
    train_model.summary()

    return subject_model, object_model, train_model




# -*- coding: utf-8 -*-
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score
from sklearn.metrics import precision_score
from sklearn.metrics import recall_score
from sklearn.metrics import f1_score
import joblib


class Classify:
    """ 标题分类模型 """
    def __init__(self, max_features=3000, hidden_size=128, activation="relu", max_iter=200):
        self.text_clf = Pipeline([('tfidf', TfidfVectorizer(max_features=max_features)),
                                  ('clf', MLPClassifier(hidden_layer_sizes=(hidden_size, hidden_size), activation=activation,
                                                        learning_rate="adaptive", max_iter=max_iter, shuffle=True))])

    def data_split(self, datas, labels):
        xtrain, xvalid, ytrain, yvalid = train_test_split(datas,
                                                          labels,
                                                          stratify=labels,
                                                          random_state=42,
                                                          test_size=0.2,
                                                          shuffle=True)
        return xtrain, xvalid, ytrain, yvalid

    def train(self, datas, labels):
        xtrain, xvalid, ytrain, yvalid = self.data_split(datas, labels)
        text_classifier = self.text_clf.fit(xtrain, ytrain)
        predicted = text_classifier.predict(xvalid)
        # print("MLPClassifier准确率为：", np.mean(predicted == yvalid))
        self.evaluate(predicted, yvalid)

        # 根据标题的特征，指定规则调整分类错误的
        filter_labels = rule_filter(xvalid, predicted)
        self.evaluate(filter_labels, yvalid)
        # self.check(xvalid, yvalid, filter_labels)

    def predict(self, content):
        pred = self.text_clf.predict(content)
        return pred

    def evaluate(self, predicted, yvalid):
        accuracy = accuracy_score(predicted, yvalid)
        precision = precision_score(predicted, yvalid)
        recall = recall_score(predicted, yvalid)
        f1 = f1_score(predicted, yvalid)
        print("Accuracy: ", accuracy)
        print("Precision: ", precision)
        print("Recall: ", recall)
        print("F1: ", f1)

    def check(self, xvalid, yvalid, predicted):
        res = pd.DataFrame({"content": xvalid.tolist(), "label": yvalid, "pred": predicted})
        res.to_csv("./valid_res.csv", sep=',', index=True, encoding="utf_8_sig")


    def model_save(self):
        joblib.dump(self.text_clf, '../data/model.pkl')


# 在分类的基础上，规则处理
def rule_filter(sentences, labels):
    res = []
    punctuation = r"""!"#$%&'(（*+,-./;<=>?@[\]^_`{|}~”？，！【】（、。；’‘……￥·"""
    for i, sentence in enumerate(sentences):

        sentence = sentence.split()
        # print("sentences: ", sentence)
        if len(sentence) >= 2 and sentence[0] == "合同" and sentence[1] == "附件":
            labels[i] = 0
            continue
        if len(sentence) > 15 or sentence[-1] in punctuation or sentence[0] in list(punctuation) + ["A", "B", "C", "D"]\
                or sentence[0] == "附件" or sentence[0] == "协议" or sentence[-1] == "合同":
            labels[i] = 0
            continue
        if sentence[-1] == "#number":
            labels[i] = 0
            continue
        if sentence[0] == "#title":
            labels[i] = 1
        if "".join(sentence) == "项目验收付款" or "".join(sentences) == "到货付款":
            labels[i] = 0
        if "，" in "".join(sentence) or "," in "".join(sentence) or "银行信息" in "".join(sentence) or "支票" in "".join(sentence) \
                or "如下" in "".join(sentence) or "支票" in "".join(sentence) or "运输标记" in "".join(sentence):
            labels[i] = 0

    # 返回标签为1的句子
    for i in range(len(sentences)):
        if labels[i] == 1:
            # print("title: ", sentences[i])
            res.append(sentences[i])
    return res


if __name__ == '__main__':
    # 加载数据
    file = "../data/class_data.csv"
    data = pd.read_csv(file)
    # 删除含有nan的行
    data.dropna(axis=0, how='any', inplace=True)
    data["label"] = data["label"].astype("int")

    # 训练
    print("model training ...")
    model = Classify()
    model.train(data.words.values, data.label.values)


    # 模型保存
    print("Save model ...")
    model.model_save()
    print("Finished !!!")

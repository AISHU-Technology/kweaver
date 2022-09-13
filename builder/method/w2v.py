
import re
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
# from sklearn.feature_extraction.text import TfidfVectorizer
import codecs
import time
# from gensim.models import word2vec
import pandas as pd
import json
class W2v():
    def __init__(self):
        self.word_list=[]
        self.inp="data.txt"
        self.text8="text8"
        self.out_model ="w2v.model"
        self.out_vector ="vec.vector"
        self.model=None

    def build_model(self):
        sentences=word2vec.Text8Corpus(self.text8)
        self.model = word2vec.Word2Vec(sentences, size=10, window=5, min_count=1, sg=1)
        self.save_model()

    def make_file(self,data):
        file=codecs.open(self.inp, "w+",'utf-8')
        for key,value_list in data.items():
            value_list.append(key)
            concept_list,frag_list=[],[]
            for item in value_list:
                frag_list.extend(re.findall("[A-Z][^_\-A-Z]+", item))
            concept_list=[word.lower() for word in value_list+frag_list if len(word)>2]
            self.word_list.extend(concept_list)
            file.write(" ".join(concept_list)+"\n")
            # if "_" in table_name
            #     entity_concept_list=list[re.findall("[A-Z][^_\-]+",table_name)]
            # else:
            #     entity_concept_list = list[re.findall("[A-Z][^A-Z]+", table_name)]
        file.close()
        return self.word_list

    def save_model(self):
        self.model.save(self.out_model)
        self.model.wv.save_word2vec_format(self.out_vector, binary=False)

    def go_train(self): #增量训练
        sentences=word2vec.LineSentence(self.inp)
        self.model=word2vec.Word2Vec.load(self.out_model)
        self.model.build_vocab(sentences, update=True) #自增设置
        self.model.train(sentences,total_examples=model.corpus_count,epochs=2)

    def use_model(self,word_list):
        self.make_file(data)
        self.model = word2vec.Word2Vec.load(self.out_model)
        print(self.model.wv["projectno"])
        print(self.model.similar_by_word('projectno'))
        # keys=self.model.wv.vocab.keys()
        # print(keys)
        wordvector = []
        for word in self.word_list:
            wordvector.append(self.model.wv[word])
        return wordvector


def k_means(wordvector,word_list):
    clf = KMeans(n_clusters=5).fit(wordvector)
    labels = clf.labels_
    # print(clf.cluster_centers_)
    print(labels)
    classCollects = {}
    for i in range(len(word_list)):
        if labels[i] in classCollects.keys():
            classCollects[labels[i]].append(word_list[i])
        else:
            classCollects[labels[i]] = [word_list[i]]
    print(classCollects)


# data={"T_Project":["ProjectId","ProjectNo","ProjectName"],"T_ProjectFunnel":["ProjectId","AreaId","CreateDate"],
#       "T_Project_Visit":["VisitId","ProjectName","VisitSummary"],"T_Visit_Record":["VisitId","VisitSummary","VisitType"]}
#
# word_list=W2v().make_file(data)
# wordvector=W2v().use_model(word_list)
# k_means(wordvector,word_list)
def createDataFrame():
    d = [{'a':1,
        'b':2,
        'c':3,
        'd':4,
        'e':5},
         {'a': 1,
          'b': 2,
          'c': 3,
          'd': 4,
          'e': 5}
         ]



    a=json.dumps(d)
    df = pd.read_json(a)
    #打印出dataFrame
    print(df)
    return df

if __name__ == '__main__':
    a=""
    print(len(a))



# # 定义向量化参数TF-IDF
# tfidf_vectorizer=TfidfVectorizer(max_df=0.9,max_features=100000,use_idf=False,ngram_range=(1,3))
# tfidf_matrix = tfidf_vectorizer.fit_transform(concept)
# tfidf_dense=tfidf_matrix.toarray()
# clusters=3
# km=KMeans(n_clusters=clusters).fit(tfidf_matrix)
# km.fit(tfidf_matrix)
#
# labels=km.labels_
# centroids = km.cluster_centers_ #获取聚类中心
# print(labels)
# print(centroids)
#
#
# ##绘图
# from  matplotlib.colors import  rgb2hex
# import numpy as np
# fig, ax = plt.subplots()
# # 随机生成使用16进制表示的颜色
# colors = tuple([(random.random(),random.random(), random.random()) for i in range(clusters)])
# colors = [rgb2hex(x) for x in colors]  # from  matplotlib.colors import  rgb2hex
# for i,label in enumerate(labels):
#     need_idx = np.where(km == colors[label])[0]
#     print(need_idx)
#     plt.plot(tfidf_matrix[need_idx,1], tfidf_matrix[need_idx,0], colors[label],label=concept[i])
# plt.show()


# -*- coding: utf-8 -*-
import jieba
import pandas as pd
from collections import OrderedDict
import re


def cut_words(content):
    '''
    对句子列表进行分词
    :param content: 句子列表
    :return: 句子分词后的列表
    '''
    sent_words = []
    for con in content:
        word = " ".join(jieba.lcut(str(con).strip().replace("\u2002", "").replace("\u3000", "").replace("\xa0", "").replace(" ", "")))
        if word:
            sent_words.append(word)
    return sent_words


def get_csv(file):
    data = pd.read_csv(file)
    data.fillna(0, inplace=True)
    content = data.content.to_list()
    labels = data.label.to_list()
    return content, labels


# 去除句子中的空格等符号
def preprocess_text(content):
    sentences = []
    for line in content:
        line = line.replace("_", "").replace(" ", "").replace("\t", "").replace("\u2002", "").replace("\u3000", "").replace("\xa0", "").strip()
        sentences.append(line)
    return sentences

def integration(sentences, source_sentences):
    source_res = []
    res = []
    i = 0
    while i < len(source_sentences) - 1:
        if source_sentences[i] == "#number":
            i += 1
            continue
        if source_sentences[i] == "#title" or source_sentences[i] == "#order":
            temp = source_sentences[i] + " " + source_sentences[i+1]
            source_res.append(temp)
            res.append(sentences[i+1])
            i += 2
        else:
            source_res.append(source_sentences[i])
            res.append(sentences[i])
            i += 1
    if source_sentences[len(source_sentences)-1] != "#title":
        source_res.append(source_sentences[len(source_sentences)-1])
        res.append(sentences[len(source_sentences)-1])
    return res, source_res

# 标题正文映射
def title_map(sentences, source_sentences, titles):
    '''
    sentences: 原始的未经处理的句子列表
    source_sentences: 预处理后的句子，未去除空的，和原始句子等长
    titles：标题列表(句子分类前已经过处理)
    '''
    pattern = re.compile("^第[一二三四五六七八九十0-9]{1,2}[章节篇条、．.]([:：])?|^[一二三四五六七八九十]{1,2}[章节篇条、.．]")
    # pattern = re.compile("^\d{1,2}[.．]\d{1,2}([.．]\d{1,2})?([.．]\d{1,2})?|^\d{1,2}[、) ）.]?|^[(（][123456789一二三四五六七八九十][) ）]")
    pattern1 = re.compile("^\d{1,2}[.．]\d{1,2}([.．]\d{1,2})?([.．]\d{1,2})?")
    sentences, source_sentences = integration(sentences, source_sentences)
    assert len(sentences) == len(source_sentences)

    res = OrderedDict()
    result = OrderedDict()

    titles_content = OrderedDict()
    index_dict = OrderedDict()
    index_list = []
    titles_list = []
    if len(titles) == 0:
        return titles_content

    for title in titles:
        title = str(title)
        for i, sent in enumerate(source_sentences):
            if "【" in sent:
                sent = sent.split("【")[0].strip()
            if "（" in sent:
                sent = sent.split("（")[0].strip()
            if "(" in sent:
                sent = sent.split("(")[0].strip()

            if title == sent or sent == "#title" + " " + title or sent == "#title" + title or \
                    title.replace("#title", "").replace("#number", "").replace(".", "").replace("．", "").strip() \
                    == sent.replace("#title", "").replace("#number", "").replace(".", "").replace("．", "").strip():
                if sent not in index_dict:
                    if not re.match(pattern1, sentences[i]):
                        index_dict[sentences[i]] = i
                else:
                    sent = sentences[i] + str(i)
                    index_dict[sent] = i
    index_dict = sorted(index_dict.items(), key=lambda item: item[1])
    # print("index_dict: ", index_dict)
    for temp in index_dict:
        index_list.append(temp[1])
        titles_list.append(temp[0])
    # print("titles_list: ", titles_list)
    titles_content["序言"] = sentences[: index_list[0]]
    for i in range(len(index_list) - 1):
        titles_content[titles_list[i]] = sentences[index_list[i]+1: index_list[i+1]]
    titles_content[titles_list[-1]] = sentences[index_list[-1]+1:]

    # 处理条款名称的
    for title, con in titles_content.items():
        if str(title).rstrip()[-1] == "。":
            # line = "".join(con.split("条")[:-1])
            # print("title: ", title)
            if re.match(pattern, title):
                line = re.match(pattern, title.lstrip()).group()
                c = re.sub(pattern, "", title.lstrip())
                res[line] = [c] + titles_content[title]
        else:
            res[title] = titles_content[title]
    # 分离签字页：最后一个标题对应内容中，不是以“。”结束的句子之后的内容
    names = list(res.keys())
    last_content = res[names[-1]]
    position = 0
    for line in last_content:
        line = str(line).strip()
        if line[-1] in r"""!",.;?[\]^_`{|}~“”？，！【】（）、。；’‘……￥·）""" or re.match(pattern1, line):
            position += 1
        else:
            break
    for name in names[:-1]:
        result[name] = res[name]
    result[names[-1]] = res[names[-1]][:position]
    result["后序"] = res[names[-1]][position:]
    return result


# 在分类的基础上，规则处理
def rule_filter1(content, labels):
    res = []
    punctuation = r"""!"#$%&'()*+,-./;<=>?@[\]^_`{|}~“”？，！【】（）、。；’‘……￥·）"""
    for i in range(len(content)):
        content[i] = content[i].split()

        if content[i][0] == "#order":
            labels[i] = 0
        if content[i][-1] in punctuation:
            labels[i] = 0
        if "。" in content[i]:
            labels[i] = 0
        if content[i][-1] == "其他":
            labels[i] = 1
        if content[i][0] == "#title":
            labels[i] = 1
    # 返回标签为1的句子
    for i in range(len(content)):
        if labels[i] == 1:
            res.append(" ".join(content[i]))
    return res

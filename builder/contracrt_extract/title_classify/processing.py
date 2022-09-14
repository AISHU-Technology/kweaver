# -*- coding: utf-8 -*-
import jieba
import re
jieba.add_word("#title")
jieba.add_word("#number")
jieba.add_word("#date")
jieba.add_word("#order")

class DataProcess():
    def __init__(self, content, stopwords=None):
        self.content = content
        self.stopwords = stopwords
        if stopwords is None:
            self.stopwords = []

    def order_normalizer(self, tokens):
        pattern = re.compile("^\d{1,2}\.\d{1,2}(\.\d{1,2})?(\.\d{1,2})?")
        pattern1 = re.compile("^\d{1,2}[、) ）.]?")
        pattern2 = re.compile("^[(（][123456789一二三四五六七八九十][) ）]")
        tokens = re.sub(pattern, "#order", str(tokens).replace(" ", "").strip(), count=2)
        tokens = re.sub(pattern1, "#order", str(tokens).replace(" ", "").strip(), count=2)
        tokens = re.sub(pattern2, "#order", str(tokens).replace(" ", "").strip(), count=2)
        return tokens

    def title_normalizer(self, tokens):
        pattern1 = re.compile("^第?[一二三四五六七八九十0-9]{1,3}[章节篇条、.]")
        pattern2 = re.compile("^第\d{1,2}[章节篇条][、.]?")
        tokens = re.sub(pattern1, "#title", str(tokens).replace(" ", "").strip(), count=2)
        tokens = re.sub(pattern2, "#title", str(tokens).replace(" ", "").strip(), count=2)
        return tokens

    def number_normalizer(self, tokens):
        pattern = re.compile("(([1-9]\\d*[\\d,，]*\\.?\\d*)|(0\\.[0-9]+))")
        tokens = re.sub(pattern, "#number", tokens, count=10)
        return tokens

    def date_normalizer(self, tokens):
        pattern1 = re.compile("\d{4}年\d{1,2}月\d{1,2}日?")
        pattern2 = re.compile("年月日?")
        tokens = re.sub(pattern1, "#date", str(tokens).replace(" ", ""), count=10)
        tokens = re.sub(pattern2, "#date", str(tokens).replace(" ", ""), count=10)
        return tokens

    def char_replace(self, sentences):
        res = []

        for sentence in sentences:
            if sentences:
                sentence = self.title_normalizer(sentence)
                sentence = self.order_normalizer(sentence)
                sentence = self.date_normalizer(sentence)
                sentence = self.number_normalizer(sentence)
                res.append(sentence)
        return res

    def integrate(self, arr):
        res = []
        i = 0
        while i < len(arr) - 1:
            if arr[i] == "#title" or arr[i] == "#order" or arr[i] in "①②③④⑤⑥⑦⑧⑨":
                temp = arr[i] + " " + arr[i + 1]
                # print("temp: ", temp)
                res.append(temp)
                i += 2
            else:
                res.append(arr[i])
                i += 1
        if arr[len(arr) - 1] != "#title":
            res.append(arr[len(arr) - 1])
        return res

    def pre_data(self):
        """分词去停用词
        sentences: list,句子列表
        Return:
            process_sentence_list:处理后的句子，不包含去除停用词后为空的句子
            source_sentence_list:处理后的句子，包含去除停用词后为空的句子，和原句子列表sentences等长，方便后续的查找标题所在位置
        """
        # 替换指定字符
        pre_sentences = self.char_replace(self.content)

        source_sentence_list = []
        process_sentence_list = []
        seg_list = [jieba.lcut(
            sentence.replace("\t", "").replace("\u2002", "").replace("\u3000", "").replace("\xa0", "").replace(" ", "").strip()) for sentence in pre_sentences]
        for seg in seg_list:
            line = [word for word in seg if word not in self.stopwords]
            if line:
                # if len(line) < 10 and line[-1] not in r"""!"#$%&'()*+,-./;<=>?@[\]^_`{|}~“”？，！【】（）、。；’‘……￥·）""":
                process_sentence_list.append(" ".join(line))
            source_sentence_list.append(" ".join(line))
        process_sentence_list = self.integrate(process_sentence_list)
        # print("process_sentence_list: ", process_sentence_list)
        return process_sentence_list, source_sentence_list


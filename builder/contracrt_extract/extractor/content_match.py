# -*- coding: utf-8 -*-
import re
from collections import OrderedDict


def chapter_match(content_dict):
    '''
    匹配指定内容所在的章节
    :param keyword: 内容对应关键词
    :param content_dict: 文件根据标题划分后的内容dict
    :return: 匹配到的内容，dict
    '''
    pattern = re.compile("《订单》付款方式|费用标准及支付|付款方式|合同价款与支付|《订单》价款和《订单》价款的支付、订单数量|《订单》价款的支付方式|付款及其条件|付款")

    res = {}
    titles = content_dict.keys()
    # print("content_dict: ", content_dict)
    for title in titles:
        # print("title:   ", title)
        if pattern.search(title):
            res[title] = content_dict[title]
            # break
    return res


def paymentStage_match(chapter_dict):
    '''
    根据付款阶段的名称字段，从付款内容所在章节划分付款阶段的内容
    :param chapter_dict:
    :return:
    '''
    stages, idxs = [], []
    paymentStage_dict = OrderedDict()
    pattern = re.compile("^\d{1,2}\.\d{1,2}(\.\d{1,2})?(\.\d{1,2})?|^\d{1,2}[、) ）.]?|^[(（][123456789一二三四五六七八九十][) ）]")
    # pattern = re.compile("^(\d{1,2}[.、．)）]?)*")
    # pattern2 = re.compile("^\d{1,2}\.\d{1,2}(\.\d{1,2})?(\.\d{1,2})?")

    # pattern1 = re.compile("^工程进度款([0-9])?|^尾款|^竣工结算工程价款|^第一期付款[（(]预付款[）)]|^第二期付款[（(]初验付款[)）]|^第三期付款[(（]终验付款[)）]|^第四期付款|^预付款|^交货付款|^初验付款|^终验付款")
    pattern1 = re.compile("^工程进度款([0-9])?|^尾款|^竣工结算工程价款|^第一期付款|^第二期付款|^第三期付款|^第四期付款|^预付款|^交货付款|^初验付款|^终验付款|^上线付款|^到货付款|^项目验收付款|^一阶段设计费用|合同尾款")

    for title in chapter_dict.keys():
        if chapter_dict[title]:
            texts = chapter_dict[title]
            # texts = [re.sub(pattern, "", text).strip() for text in chapter_dict[title]]
            # texts = [re.sub(pattern2, "", text).strip() for text in texts]
            for i, text in enumerate(texts):
                # for stage in paymentStage:
                #     if text.startswith(stage):
                line = re.sub(pattern, "", text).strip()
                # line = re.sub(pattern2, "", line).strip()
                if pattern1.search(line):
                    stages.append(pattern1.search(line).group())
                    idxs.append(i)

            # idxs为空,没有明显的付款阶段字段
            if len(idxs):
                for i in range(len(stages) - 1):
                    paymentStage_dict[stages[i]] = texts[idxs[i]: idxs[i+1]]

                paymentStage_dict[stages[-1]] = texts[idxs[-1]:]
                break
    return paymentStage_dict




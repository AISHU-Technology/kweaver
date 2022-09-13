# -*- coding: utf-8 -*-
import re
from typing import Iterable
import time
import csv
import os
import functools


def split_text_by_header(string: str) -> Iterable:
    """Split the headings according to the rules"""
    text_arr = re.split(r'([一二三四五六七八九十0-9]{1,}[章节篇条、．.].+?) ', string)
    
    for i in text_arr:
        if i == "":
            text_arr.remove(i)
    
    return text_arr


def parse_head(string: str) -> bool:
    """Determines whether the string is a title according to the rules"""
    # matchObj = re.match(r'[0-9.]{2,}|[第一二三四五六七八九十0-9篇章节：:、]{2,}', str)
    matchObj = re.match(
        r'^第[一二三四五六七八九十0-9]{1,}[章节篇条、．.]([:：])?|^[一二三四五六七八九十]{1,}[章节篇条、.．]|^[0-9]{1,}[、．.]', string)
    
    # 限制标题字符长度
    if matchObj and len(matchObj.string) < 50:
        return True
    
    return False


def split_text(string: str, length) -> Iterable:
    """Split by length and end with specified punctuation"""
    res = []
    
    # 标点切分
    text_arr = re.split(r'([。！？!?])', string)
    text_arr.append("")
    text_arr = ["".join(i) for i in zip(text_arr[0::2], text_arr[1::2])]
    
    # 限定长度
    tt = ""
    for index, text in enumerate(text_arr):
        tt += text
        if len(tt) >= length or index == len(text_arr) - 1:
            res.append(tt)
            tt = ""
    return res


'''格式化字节'''


def formatByte(number):
    for (scale, label) in [(1024 * 1024 * 1024, "GB"), (1024 * 1024, "MB"), (1024, "KB")]:
        if number >= scale:
            return "%.2f %s" % (number * 1.0 / scale, label)
        elif number == 1:
            return "1字节"
        else:
            byte = "%.2f" % (number or 0)
    return (byte[:3]) if byte.endswith(".00") else byte + "字节"


# 格式化时间戳


def formatTime(longtime):
    '''格式化时间的函数'''
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(longtime))


# 追加写入csv


def csvWriter(path, ds, mode='a'):
    with open(path, mode=mode, encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        for d in ds:
            if d == None:
                continue
            writer.writerow(d)
        f.flush()
    f.close()


# getFileReverse 递归获取文件


def getFileReverse(path):
    files = list()
    filesList = os.listdir(path)
    for fileName in filesList:
        filesAbpath = os.path.join(path, fileName)
        if os.path.isdir(filesAbpath):
            files.extend(getFileReverse(filesAbpath))
        else:
            files.append(filesAbpath)
    return files


# readPreset 读取制定路径下的预设值的值
def readPreset(path):
    rs = []
    with open(path, mode='r', encoding='utf-8') as f:
        for line in f:
            rs.append(line.strip('\n'))
    return rs


def cmp(x1, x2):
    if len(x1) >= len(x2):
        return -1
    else:
        return 1


def lenSort(l):
    l.sort(key=functools.cmp_to_key(cmp))
    return l

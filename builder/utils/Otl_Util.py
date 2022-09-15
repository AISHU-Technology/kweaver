# -*-coding:utf-8-*-
import requests
import json
from utils.common_response_status import CommonResponseStatus
# from dao.otl_dao import otl_dao

import re

class Otl_Util(object):

    def set_default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        raise TypeError

    def fliter_file(self, postfix, filelist):
        newfilelist = []
        for file in filelist:
            if file.endwith(postfix):
                newfilelist.append(file)
        count = len(newfilelist)
        return count, newfilelist

    def is_special(self,char):
        # 将 下划线、字母、数字、汉字 以外的字符 转为空字符
        if not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', char):
            char = re.sub('[^A-Za-z0-9\u4e00-\u9fa5_]', '', char)
        # 去掉开头的下划线
            char = char.lstrip('_')
        if len(char) >= 50:
            char = char[:50]
        return char
    
    def is_sprcial_no_cut(self, char):
        if not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', char):
            char = re.sub('[^A-Za-z0-9\u4e00-\u9fa5_]', '_', char)
        return char
    
    def Levenshtein_Distance(self, str1, str2):
        """
        计算字符串 str1 和 str2 的编辑距离
        :param str1
        :param str2
        :return:
        """
        matrix = [[i + j for j in range(len(str2) + 1)] for i in range(len(str1) + 1)]

        for i in range(1, len(str1) + 1):
            for j in range(1, len(str2) + 1):
                if (str1[i - 1] == str2[j - 1]):
                    d = 0
                else:
                    d = 1

                matrix[i][j] = min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + d)

        return matrix[len(str1)][len(str2)]


    def check_json(self,rows):
        print("check json")
        SYMBOLS = {'}': '{', ']': '[', ')': '('}
        SYMBOLS_L, SYMBOLS_R = SYMBOLS.values(), SYMBOLS.keys()

        arr = []
        for c in rows:
            if c in SYMBOLS_L:
                # 左符号入栈
                arr.append(c)
            elif c in SYMBOLS_R:
                # 右符号要么出栈，要么匹配失败
                if arr and arr[-1] == SYMBOLS[c]:
                    arr.pop()
                else:
                    return False

        return not arr
    ######迭代没有层数限制时可用
    # def flatten_json(self,y):  ####json扁平处理，y=data，n=层数
    #     print("start flat data")
    #     out = {}
    #
    #     times = []
    #     def flatten(x, name=''):
    #         print("start flatt json")
    #
    #         if type(x) is dict:
    #             times.append(1)
    #             for a in x:
    #                 if len(times) > n:
    #                     out[name[:-1]] = x
    #                     continue
    #                 else:
    #                     flatten(x[a], n, name + a + '_')
    #
    #         else:
    #             out[name[:-1]] = x
    #
    #     flatten(y, n)
    #     return out
    def flatten_json(self, jsondata, n):  ##n无用
        out = {}
        for k, v in jsondata.items():
            if isinstance(v, dict):
                for k_1, v_1 in v.items():
                    if isinstance(v_1, dict):
                        for k_2, v_2 in v_1.items():
                            out[k + "_" + k_1 + "_" + k_2] = v_2
                    else:
                        out[k + "_" + k_1] = v_1
            else:
                out[k] = v
        return out

    def flatten_json_n(self, jsondata):
        prefix = ""
        res = {}
    
        def innc(jsondata, prefix):
            for i, j in jsondata.items():
                if isinstance(j, dict):
                    innc(j, prefix + i + '_')
                else:
                    res[prefix + i] = j
    
        innc(jsondata, prefix)
        return res


otl_util = Otl_Util()

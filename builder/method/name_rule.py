# -*- coding: utf-8 -*-
'''
@Time    : 2020/2/26 9:54
@Author  : Tian.gu
'''
import re


def _2upper(param):
    if not re.search(u'^[_a-zA-Z0-9\u4e00-\u9fa5]+$', param):
        param = re.sub('[^A-Za-z0-9\u4e00-\u9fa5_]', '_', param)
    for item in re.findall(r"_[a-z]", param):
        param = param.replace(item, item[-1].upper())
    return param


def upper2_(param):
    for item in re.findall(r"[A-Z]", param):
        param = param.replace(item, "_" + item.lower())
    return param
def drop_adornment(param_list):
    mix = []
    new_param_list=[]

    if param_list:
        param = param_list[0]
        if "_" in param or "-" in param:
            adornment_list = re.findall(r"[^_\-]+", param)
            if adornment_list:
                mix = [(sum([1 for bean in param_list if bean.startswith(adornment_list[0])]), adornment_list[0], 0),
                       (sum([1 for bean in param_list if bean.endswith(adornment_list[-1])]), adornment_list[-1], 1)]
        else:
            adornment_list = re.findall(r"[^A-Z]+", param)
            if adornment_list:
                mix = [(sum([1 for bean in param_list if bean.startswith(adornment_list[0])]), adornment_list[0], 0),
                       (sum([1 for bean in param_list if bean.endswith(adornment_list[-1])]), adornment_list[-1], 1)]
    if mix:
        mix.sort(reverse=True)
        count, adornment, flag = mix[0]
        if count == len(param_list):
            if flag == 0:
                mid_param_list = [x[len(adornment):] for x in param_list]
                new_param_list = [x[1:] for x in mid_param_list if x.startswith("_") or x.startswith("-")]
            else:
                mid_param_list = [x[:-len(adornment)] for x in param_list]
                new_param_list = [x[:-1] for x in mid_param_list if x.endswith("_") or x.endswith("-")]
    if new_param_list:
        return new_param_list
    else:
        return param_list
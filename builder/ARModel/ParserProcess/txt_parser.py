# -*- coding: utf-8 -*-

from ARModel.utils.util import *


class TxtParse():
    def __init__(self):
        pass #EMPTY
    
    def parse(self, txt_path, length):
        f = open(txt_path, "r", encoding="utf-8")
        file_name = txt_path.split("data/docs/dev/")[-1]  # 文档名

        head = ""
        for line in f.readlines():
            # 按规则切分出标题
            text_arrs = split_text_by_header(line)

            for t in text_arrs:
                t = t.strip()
                res = dict()

                if parse_head(t):
                    head = t
                    continue

                # 长度截取
                if len(t) > length:
                    text_arr = split_text(t, length)
                    for text in text_arr:
                        text = text.strip()
                        if len(text) == 0:
                            continue

                        res["text"] = text
                        res["head"] = head
                        res["name"] = file_name
                        print(res)
                        res = {}
                else:
                    if len(t) == 0:
                        continue

                    res["text"] = t
                    res["head"] = head
                    res["name"] = file_name
                    print(res)

        f.close()
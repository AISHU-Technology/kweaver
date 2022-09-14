# !/usr/bin/env python
# -*- coding:utf-8 -*-
import requests
import json


class SearchAndRank:
    """
    搜索并计算目标文档在搜索结果中的排序
    """
    def __init__(self, url):
        self.url = url

    def _search(self, query, **kwargs):
        raise NotImplementedError

    def search_and_rank(self, example, replace_prefix="", **kwargs):
        """
        input:
            example:  dict，必须包含query和doc_path字段
            replace_prefix: 搜索结果文档路径待replace的前缀，用于和example["doc_path"]保持一致
        output:
            example: 在原example基础上新增rank字段，rank为目标文档在搜索结果中的排序
        """
        result = self._search(example["query"], **kwargs)
        rank = -1
        for i, res_doc_info in enumerate(result):
            res_doc_path = res_doc_info["path"].replace(replace_prefix, "")
            if example["doc_path"] == res_doc_path:
                rank = i
                break
        return {"rank": rank}


class AdvSearchAndRank(SearchAndRank):
    """
    AnyDATA高级搜索
    """
    def __init__(self, url):
        super(AdvSearchAndRank, self).__init__(url)

    def _search(self, query, **kwargs):
        if "conf_id" not in kwargs:
            raise Exception("miss conf_id argument!")
        url = self.url % (kwargs["conf_id"], query)
        print(url)
        res = requests.get(url, verify=False)
        res = json.loads(res.text)
        return res["res"]["search"]


class AnyShareSearchAndRank(SearchAndRank):
    """
    AnyShare搜索
    """
    def __init__(self, url):
        super(AnyShareSearchAndRank, self).__init__(url)

    def _search(self, query, **kwargs):
        if "body" not in kwargs:
            raise Exception("miss body argument!")
        kwargs["body"]["keys"] = query
        res = requests.post(url=self.url, headers=kwargs["headers"], data=json.dumps(kwargs["body"]), verify=False)
        res = json.loads(res.text)
        res = res["response"]["docs"]
        ret = []
        for r in res:
            if "ext" not in r["_source"]:
                continue
            path = r["_source"]["parentpath"] + "/" + r["_source"]["basename"] + r["_source"]["ext"]
            ret.append({"path": path})
        return ret


class AnyShareFileSearchAndRank(SearchAndRank):
    """
    AnyShare搜索
    """
    def __init__(self, url):
        super(AnyShareFileSearchAndRank, self).__init__(url)

    def _search(self, query, **kwargs):
        if "body" not in kwargs:
            raise Exception("miss body argument!")
        kwargs["body"]["keyword"] = query
        res = requests.post(url=self.url, headers=kwargs["headers"], data=json.dumps(kwargs["body"]), verify=False)
        res = json.loads(res.text)
        try:
            res = res["files"]
        except Exception as e:
            print(e)
            res = []
        ret = []
        for r in res:
            if "extension" not in r:
                continue
            path = r["parent_path"] + "/" + r["basename"] + r["extension"]
            ret.append({"path": path})
        return ret

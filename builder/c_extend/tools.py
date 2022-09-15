# -*- coding: utf-8 -*-
import re
from collections import defaultdict


class NoDe(object):
    """
    node
    """
    def __init__(self, string='', is_root=False):
        self._next_p = {}
        self.fail = None
        self.is_root = is_root
        self.string = string
        self.parent = None

    def __iter__(self):
        return iter(self._next_p.keys())

    def __getitem__(self, item):
        return self._next_p[item]

    def __setitem__(self, key, value):
        _u = self._next_p.setdefault(key, value)
        _u.parent = self

    def __repr__(self):
        return "<NoDe object '%s' at %s>" % \
               (self.string, object.__repr__(self)[1:-1].split('at')[-1])

    def __str__(self):
        return self.__repr__()


def split_str(input_str: str):
    split_char = {"。", "？", "！", "!", "?", "\r", "\n", " "}
    not_add_char = {"\r", "\n", " "}
    start = 0
    # input_str_list = re.split("[\r\n\s]", input_str)
    # for sub_input_str in input_str_list:
    for i, i_char in enumerate(input_str):
        if i_char not in split_char:
            continue
        if i > start:
            # if i_char == " " and input_str[i-1] != " ":
            #     continue
            if i_char in not_add_char:
                sub_str = input_str[start:i]
            else:
                sub_str = input_str[start:i+1]
            sub_str = sub_str.strip()
            if check(sub_str):
                yield sub_str
        start = i+1
    if start < len(input_str):
        sub_str = input_str[start:]
        if check(sub_str):
            yield sub_str


def check(sentence: str):
    if len(sentence) < 6 or len(sentence) > 120:
        return False
    if sentence[0] in ["①"]:
        return False
    if sentence[-1] in ["?", "？"]:
        return False
    if not re.fullmatch("^[\u4e00-\u9fa5_a-zA-Z]{1,15}是.+$", sentence):
        return False
    if re.search("___", sentence):
        return False

    if re.search("（）", sentence):
        return False
    return True


# cython 实现
class AhoCorasickModel(object):
    """
    Ac object
    """
    def __init__(self, words_set):
        self.words_set = words_set
        self.words = list(self.words_set)
        self.words.sort(key=lambda x: len(x))
        self._root = NoDe(is_root=True)
        self._node_meta = defaultdict(set)
        self._node_all = [(0, self._root)]
        _a = {}
        for word in self.words:
            for w in word:
                _a.setdefault(w, set())
                _a[w].add(word)

        def node_append(keyword):
            assert len(keyword) > 0
            _ = self._root
            for _i, k in enumerate(keyword):
                node = NoDe(k)
                # if k in _:
                #     pass
                # else:
                if k not in _:
                    _[k] = node
                    self._node_all.append((_i+1, _[k]))
                if _i >= 1:
                    for _j in _a[k]:
                        if keyword[:_i+1].endswith(_j):
                            self._node_meta[id(_[k])].add((_j, len(_j)))
                _ = _[k]
            # else:
            if _ != self._root:
                self._node_meta[id(_)].add((keyword, len(keyword)))

        for word in self.words:
            node_append(word)
        self._node_all.sort(key=lambda x: x[0])
        self._make()

    def _make(self):
        """
        build ac tree
        :return:
        """
        for _level, node in self._node_all:
            if node == self._root or _level <= 1:
                node.fail = self._root
            else:
                _node = node.parent.fail
                while True:
                    if node.str in _node:
                        node.fail = _node[node.str]
                        break
                    else:
                        if _node == self._root:
                            node.fail = self._root
                            break
                        else:
                            _node = _node.fail

    def search(self, content, with_index=False):
        result = set()
        node = self._root
        index = 0
        for i in content:
            while 1:
                if i not in node:
                    if node == self._root:
                        break
                    else:
                        node = node.fail
                else:
                    for keyword, keyword_len in self._node_meta.get(id(node[i]), set()):
                        if not with_index:
                            result.add(keyword)
                        else:
                            result.add((keyword, (index - keyword_len + 1, index + 1)))
                    node = node[i]
                    break
            index += 1
        return result

    # 用于解释模型
    def search_filter_by_indx(self, content, with_index=False, v_index=0):
        result = set()
        node = self._root
        index = 0
        is_inx = content.index("是")
        for i in content:
            while 1:
                if i not in node:
                    if node == self._root:
                        break
                    else:
                        node = node.fail
                else:
                    for keyword, keyword_len in self._node_meta.get(id(node[i]), set()):
                        if not with_index:
                            result.add(keyword)
                        else:
                            result.add((keyword, (index - keyword_len + 1, index + 1)))
                    node = node[i]
                    break
            index += 1
            if index >= is_inx:
                break
        return result

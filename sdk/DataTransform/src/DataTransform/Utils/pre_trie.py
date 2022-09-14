# !/usr/bin/env python
# -*- coding:utf-8 -*-


class Node:
    """
    a node of a pre trie
    """
    def __init__(self, freq=0, children_freq=0, parent=None):
        # parent node
        self.parent = parent
        # key is a word, value is a trie node
        self.children = {}
        # total n-grams frequency of a sub trie beginning with the current node
        self.freq = freq
        # children's total frequency
        self.children_freq = children_freq

    def insert(self, char, n):
        """
        insert a child node
        """
        self.children_freq += n
        if char not in self.children:
            self.children[char] = Node(parent=self)
        self.children[char].freq += n
        return self.children[char]

    def fetch(self, char):
        return self.children[char]


class PreTrie:
    """
    a pre trie
    """
    def __init__(self, ngram_size, split_char='|'):
        self._root = Node()
        self.ngram_size = ngram_size
        self.split_char = split_char

    def insert(self, chunk, n):
        # whenever inserting, starting from the root node
        node = self._root
        # inserting until the last gram, also the leaf node
        for char in chunk.split(self.split_char):
            node = node.insert(char, n)

        if len(chunk) < self.ngram_size:
            node.insert("EOS", n)

    def get_root(self):
        return self._root

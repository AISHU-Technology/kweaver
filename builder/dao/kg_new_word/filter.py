# !/usr/bin/env python
# -*- coding:utf-8 -*-

import re
from jieba_fast import posseg


class NewWordFilter:
	def __init__(self, stop_words_path):
		self.stop_words_path = stop_words_path
		self.stop_words = set()

		self.load_stop_word()

	def load_stop_word(self):
		with open(self.stop_words_path, 'r', encoding='utf-8') as f:
			sw = f.readlines()
		for w in sw:
			w = w.strip()
			if len(w) > 1:
				self.stop_words.add(w)

	def rule_filter(self, word):
		num_flag = re.findall(r'[0-9]{1, }', word)
		if (word[0] in ['年', '月', '日'] or word[-1] in ['年', '月']) and len(num_flag) > 0:
			return False
		if num_flag:
			if len(num_flag) > 1:
				return False
			if len(num_flag[0]) > 2:
				return False
			if not re.findall('[0-9]', word[-1]):
				return False

		if len(re.findall(r'[\u4e00-\u9fa5a-zA-Z]', word)) == 0:
			return False
		if '的' in word:
			ind = word.index('的')
			if ind < 2 or ind + 3 > len(word):
				return False
		if '让' == word[0]:
			return False
		if word[-1] == '内':
			return False
		if '需' in word and '需求' not in word:
			return False
		for i in self.stop_words:
			if i in word:
				return False
		return True

	@staticmethod
	def strict_pos_parse(w):
		tag = [i.flag for i in posseg.lcut(w)]

		if 'm' in tag and '第三方' not in w:
			return False
		if 'p' in tag:
			return False
		if 's' in tag:
			return False
		if 'f' in tag:
			return False
		if 'b' in tag:
			return False
		if 'r' in tag:
			return False
		if 'c' in tag:
			return False
		if 'x' in tag:
			return False
		for t in tag:
			if 'u' in t:
				return False

		if ('ns' in tag[-1] or 'nr' in tag[-1]) and len(set(tag)) == 1:
			return False
		if 'n' not in tag[-1]:
			return False

		if 'nr' == tag[0] and len(w) == 3:
			return False
		if 'q' in tag[0]:
			return False

		return True

	def one_word_filter(self, word):
		if len(word) < 2 or word in self.stop_words:
			return False

		t = re.findall('[a-zA-Z0-9]+', word)
		if t and t[0].lower() == word.lower():
			return False

		return True

	def strict_filter(self, ngram):
		if len(ngram) > 2 and self.strict_pos_parse(ngram) and self.rule_filter(ngram):
			return True
		return False

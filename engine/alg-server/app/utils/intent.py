# -*- coding: utf-8 -*- 
# @Time : 2022/5/20 13:50 
# @Author : liqianlan


class Intent(object):
    def __init__(self, intent=None, category=None):
        """
        意图,包含意图名称，和图谱名称

        >>> it = Intent('exception_search', 'maintenance')
        >>> print(it.intent, it.search_space)
        exception_search maintenance

        Args:
            intent: 意图名称
            search_space: 对应查询的图谱
            category: 意图类别，同一类别的意图，只是槽位不同，不要重复识别
        """
        self.intent = intent
        self.category = category

    def gather_attrs(self):
        """
        Gather all attributes.

        Returns:

        """
        return ",".join("{}={}"
                        .format(k, getattr(self, k))
                        for k in self.__dict__.keys())

    def __str__(self):
        return "[{}:{}]".format(self.__class__.__name__, self.gather_attrs())

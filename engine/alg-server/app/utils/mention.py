# -*- coding: utf-8 -*-


class Mention(object):
    def __init__(self, text, type_, start, end, id=None, normalized=False, score=0.0):
        """
        Entity mention extracted in query text.

        >>> m = Mention('AS', 'Software', 1, 3)
        >>> print(m.text, m.type, m.start, m.end)
        AS Software 1 3
        >>> type(m.start)
        <class 'int'>
        >>> type(m.text)
        <class 'str'>

        Args:
            text: Entity mention text
            type_: Entity mention type
            start: Text start index
            end: Text end index
        """

        self.text = text
        self.type_ = type_
        self.start = start
        self.end = end
        self.id = id
        self.normalized = normalized  # 是否已消歧
        self.score = score

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

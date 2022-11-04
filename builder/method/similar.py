# -*- coding: utf-8 -*-
def Similar(word1,word2):
    word1_len,word2_len=len(word1),len(word2)
    a,b=(word1,word2) if word1_len <= word2_len else (word2,word1)
    a_len,b_len=len(a),len(b)
    a=a.lower()
    b=b.lower()
    max_value=0
    for i in range(a_len,0,-1):
        if a[:i] == b[:i] or a[:i] == b[(b_len-i):]:
            max_value=i
            # print(a[:i])
            break
    # print("{0}/{1}".format(max,len(word1)))
    if max_value/a_len==1:
        return b
    else:
        return None

#
# degree=Similar("areaconfig","Area")
# print(degree)

# from itertools import product
# resu=list(map(lambda x:x[0]+x[1],product([1,2,3],[1,2,3])))
# print(resu)


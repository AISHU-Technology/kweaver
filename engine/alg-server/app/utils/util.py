# -*- coding: utf-8 -*- 
# @Time : 2022/5/27 14:58 



def validate(mentions, mention):
    """
    Judge if mention has conflict with mentions in location.
    Args:
        mentions: Mentions already exist.
        mention: New mention extracted.

    Returns: True, or False.

    """
    for mt in mentions:
        if mention.start >= mt.end or mention.end <= mt.start:
            continue
        return False
    return True

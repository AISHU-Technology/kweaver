from ARModel.conf.configer import config
import os


def ReadStart():
    filePath = config.get('preset', 'idPath', 'data/id')
    i = ''
    if not os.path.exists(filePath):
        return 1
    with open(filePath, 'r', encoding='utf-8') as f:
        i = str(f.readline())
        if i == '':
            return 1
    return int(i)


def WriteEnd(i):
    filePath = config.get('preset', 'idPath', 'data/id')
    with open(filePath, 'w', encoding='utf-8') as f:
        f.write(str(i))
    f.close()

def getIndex():
    start = ReadStart()
    WriteEnd(start + 1)
    return start
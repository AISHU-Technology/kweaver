from ARModel.utils.util import lenSort
from ARModel.utils.util import readPreset
from ARModel.conf.configer import config
import hashlib


def loadPresetDict(presetPath):
    lines = readPreset(config.get('preset', presetPath))

    data = dict()
    for index, line in enumerate(lines):
        data[line] = index + 1
    return data


software = loadPresetDict('softwarePath')
sortedSoftware = lenSort(list(software.keys()))

labels = loadPresetDict('labelPath')
versions = loadPresetDict('versionsPath')

category = loadPresetDict('categoryPath')
sortedCategory = lenSort(list(category.keys()))

records = dict()


def reloadDict(scope):
    if scope == 'version':
        loadPresetDict('versionsPath')
    if scope == 'software':
        software = loadPresetDict('softwarePath')
        lenSort(list(software.keys()))
    if scope == 'label':
        loadPresetDict('labelPath')


def isDuplicate(row):
    key = hashlib.md5(row.encode(encoding='UTF-8')).hexdigest()
    if key in records:
        return True
    records[key] = 1
    return False


def presetIndex(key, d):
    if key in d:
        return d.get(key)
    return -1


def ReadStart(scope, key):
    if scope == 'software':
        software = loadPresetDict('softwarePath')
        return presetIndex(key, software)
    if scope == 'label':
        labels = loadPresetDict('labelPath')
        return presetIndex(key, labels)
    if scope == 'version':
        versions = loadPresetDict('versionsPath')
        return presetIndex(key, versions)
    return -1


def WriteVersion(versions):
    filePath = config.get('preset', 'versionsPath')
    with open(filePath, 'a', encoding='utf-8') as f:
        for version in versions:
            f.write(str(version) + '\n')
    f.close()


def queryIndex(scope, key):
    start = ReadStart(scope, key)
    if scope == 'version' and start < 0:
        WriteVersion([key])
        return ReadStart(scope, key)
    return start
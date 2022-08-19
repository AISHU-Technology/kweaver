from ARModel.utils.util import *


# 通用简单本体，在文档中可以支持，软件，软件版本，目录，标签，章节，正文，概述，版权，关系
class CommonNou():
    def __init__(self, prefix, id, name):
        self.id = id
        self.prefix = prefix
        self.name = name
    
    def one(self,prefix, id, name):
        if name == "":
            return []
        return [CommonNou(prefix, id, name)]
    
    def multi(self,prefix, ds):
        cs = []
        for d in ds:
            if len(d) < 2 or d[1] == '':
                continue
            c = CommonNou(prefix, d[0], d[1])
            # if c == None:
            #     continue
            cs.append(c)
        return cs
    
    def header(self):
        return ['{0}ID'.format(self.prefix), 'name']
    
    def export(self):
        return ['{0}-{1}'.format(self.prefix, self.id), self.name]
    
    def nameExpr(self):
        return '{0}-{1}'.format(self.prefix, self.id)
    
    def values(self, objs):
        vs = []
        for obj in objs:
            vs.append(obj.name)
        return vs


# 文档
class DocumentNou():
    def __init__(self, meteInfo, fileInfo):
        self.id = meteInfo['id']
        self.name = meteInfo['name']
        self.category = meteInfo['category']
        self.path = meteInfo['path']
        self.format = meteInfo['format']
        self.size = formatByte(fileInfo.st_size)
        self.CreateTime = formatTime(fileInfo.st_ctime)
        self.ModifyTime = formatTime(fileInfo.st_mtime)
        self.title = meteInfo['title']
        self.label = meteInfo['label']
    
    def header(self):
        return ["docID", "name", "path", 'category', "label", "format", "size", "CreateTime", "ModifyTime", "title"]
    
    def one(self, meteInfo, fileInfo):
        return [DocumentNou(meteInfo, fileInfo)]
    
    def export(self):
        ds = []
        keys = self.header()
        
        for key in keys:
            if key == 'docID':
                ds.append('doc-{0}'.format(self.id))
            else:
                ds.append(self.__getattribute__(key))
        return ds
    
    def nameExpr(self):
        return 'doc-{0}'.format(self.id)


# 关系SPO
class RelationSPO():
    def __init__(self, idStr, predicate, obj):
        self.subject = idStr
        self.predicate = predicate
        self.object = obj
    
    def header(self):
        return ['subject', 'predicate', 'object']
    
    def export(self):
        return [self.subject, self.predicate, self.object]
    
    def multi(self, ds):
        cs = []
        for d in ds:
            if not d or len(d) < 3:
                continue
            cs.append(RelationSPO(d[0], d[1], d[2]))
        return cs


class NouHelper():
    def csv(self, ds):
        rows = list()
        for d in ds:
            if not d:
                continue
            rows.append(d.export())
        return rows
    
    def header(self, ds):
        if len(ds) <= 0:
            return ''
        return ds[0].header()


class DocComponent():
    def __init__(self, prefix, id, name, category, content):
        self.id = id
        self.prefix = prefix
        self.name = name
        self.category = category
        self.content = content
    
    def one(self, prefix, id, name, category, content):
        if content == "":
            return None
        return [DocComponent(prefix, id, name, category, content)]
    
    def multi(self, ds):
        cs = []
        for d in ds:
            if len(d) < 4 or d[1] == '':
                continue
            c = DocComponent('component', d[0], d[1], d[2], d[3])
            # if c == None:
            #     continue
            cs.append(c)
        return cs
    
    def header(self):
        return ['{0}ID'.format(self.prefix), 'name', 'category', 'content']
    
    def export(self):
        return ['{0}-{1}'.format(self.prefix, self.id), self.name, self.category, self.content]
    
    def nameExpr(self):
        return '{0}-{1}'.format(self.prefix, self.id)
    
    def values(self, objs):
        vs = []
        for obj in objs:
            vs.append(obj.content)
        return vs
